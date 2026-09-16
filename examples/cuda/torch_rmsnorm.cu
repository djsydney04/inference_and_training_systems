// Correctness-first PyTorch extension, not a tuned normalization kernel.
// One 256-thread block reduces each row. Every thread joins every barrier.
#include <ATen/ATen.h>
#include <c10/cuda/CUDAGuard.h>
#include <c10/cuda/CUDAStream.h>
#include <c10/cuda/CUDAException.h>
#include <cuda_runtime.h>
#include <cmath>
#include <limits>
#include <vector>

namespace {
constexpr int BLOCK = 256;

__device__ float block_sum(float value) {
    __shared__ float scratch[BLOCK];
    const int lane = threadIdx.x;
    scratch[lane] = value;
    __syncthreads();
    for (int offset = BLOCK / 2; offset > 0; offset /= 2) {
        if (lane < offset) scratch[lane] += scratch[lane + offset];
        __syncthreads();
    }
    const float result = scratch[0];
    __syncthreads();
    return result;
}

__global__ void forward_rows(const float* x, const float* weight,
                             float* output, float* inverse,
                             int64_t width, float epsilon) {
    const int64_t base = int64_t(blockIdx.x) * width;
    float squares = 0.0f;
    for (int64_t col = threadIdx.x; col < width; col += BLOCK)
        squares += x[base + col] * x[base + col];
    const float inv = rsqrtf(block_sum(squares) / float(width) + epsilon);
    if (threadIdx.x == 0) inverse[blockIdx.x] = inv;
    for (int64_t col = threadIdx.x; col < width; col += BLOCK)
        output[base + col] = x[base + col] * inv * weight[col];
}

__global__ void backward_rows(const float* x, const float* weight,
                              const float* inverse, const float* grad_output,
                              float* grad_input, int64_t width) {
    const int64_t base = int64_t(blockIdx.x) * width;
    const float inv = inverse[blockIdx.x];
    float dot = 0.0f;
    for (int64_t col = threadIdx.x; col < width; col += BLOCK)
        dot += grad_output[base + col] * weight[col] * x[base + col];
    dot = block_sum(dot);
    for (int64_t col = threadIdx.x; col < width; col += BLOCK) {
        const int64_t index = base + col;
        grad_input[index] = inv * grad_output[index] * weight[col]
            - x[index] * inv * inv * inv * dot / float(width);
    }
}

__global__ void backward_weight(const float* x, const float* inverse,
                                const float* grad_output, float* grad_weight,
                                int64_t rows, int64_t width) {
    const int64_t col = int64_t(blockIdx.x) * BLOCK + threadIdx.x;
    if (col >= width) return; // No barrier exists in this kernel.
    // Serial row reduction: simple ownership, no atomic updates or workspace.
    // For large row counts, a staged parallel reduction is the next exercise.
    float sum = 0.0f;
    for (int64_t row = 0; row < rows; ++row) {
        const int64_t index = row * width + col;
        sum += grad_output[index] * x[index] * inverse[row];
    }
    grad_weight[col] = sum;
}

void check_inputs(const at::Tensor& x, const at::Tensor& weight) {
    TORCH_CHECK(x.is_cuda() && weight.is_cuda(), "inputs must be CUDA tensors");
    TORCH_CHECK(x.device() == weight.device(), "inputs must share one device");
    TORCH_CHECK(x.scalar_type() == at::kFloat && weight.scalar_type() == at::kFloat,
                "only FP32 is supported; autocast is not implemented");
    TORCH_CHECK(x.dim() == 2 && weight.dim() == 1, "expected x [rows,width], weight [width]");
    TORCH_CHECK(x.size(0) > 0 && x.size(1) > 0, "empty tensors are not supported");
    TORCH_CHECK(weight.size(0) == x.size(1), "weight width mismatch");
    TORCH_CHECK(x.is_contiguous() && weight.is_contiguous(), "inputs must be contiguous");
    TORCH_CHECK(x.size(0) <= std::numeric_limits<int>::max()
                && x.size(1) <= std::numeric_limits<int>::max(), "shape exceeds launch contract");
}
} // namespace

std::vector<at::Tensor> atlas_rmsnorm_forward_cuda(
    const at::Tensor& x, const at::Tensor& weight, double epsilon) {
    check_inputs(x, weight);
    const float eps = static_cast<float>(epsilon);
    TORCH_CHECK(std::isfinite(epsilon) && std::isfinite(eps) && eps > 0.0f,
                "epsilon must be positive and representable as finite FP32");
    const c10::cuda::CUDAGuard guard(x.device());
    const auto stream = c10::cuda::getCurrentCUDAStream(x.get_device());
    auto output = at::empty_like(x);
    auto inverse = at::empty({x.size(0)}, x.options());
    forward_rows<<<static_cast<unsigned>(x.size(0)), BLOCK, 0, stream.stream()>>>(
        x.data_ptr<float>(), weight.data_ptr<float>(), output.data_ptr<float>(),
        inverse.data_ptr<float>(), x.size(1), eps);
    C10_CUDA_KERNEL_LAUNCH_CHECK();
    return {output, inverse};
}

std::vector<at::Tensor> atlas_rmsnorm_backward_cuda(
    const at::Tensor& x, const at::Tensor& weight,
    const at::Tensor& inverse, const at::Tensor& grad_output) {
    check_inputs(x, weight);
    TORCH_CHECK(inverse.device() == x.device() && grad_output.device() == x.device(),
                "backward tensors must share the input device");
    TORCH_CHECK(inverse.scalar_type() == at::kFloat && grad_output.scalar_type() == at::kFloat,
                "backward tensors must be FP32");
    TORCH_CHECK(inverse.dim() == 1 && inverse.size(0) == x.size(0), "inverse shape mismatch");
    TORCH_CHECK(grad_output.sizes() == x.sizes(), "upstream gradient shape mismatch");
    TORCH_CHECK(inverse.is_contiguous() && grad_output.is_contiguous(),
                "backward tensors must be contiguous");
    const c10::cuda::CUDAGuard guard(x.device());
    const auto stream = c10::cuda::getCurrentCUDAStream(x.get_device());
    auto grad_input = at::empty_like(x);
    auto grad_weight = at::empty_like(weight);
    backward_rows<<<static_cast<unsigned>(x.size(0)), BLOCK, 0, stream.stream()>>>(
        x.data_ptr<float>(), weight.data_ptr<float>(), inverse.data_ptr<float>(),
        grad_output.data_ptr<float>(), grad_input.data_ptr<float>(), x.size(1));
    C10_CUDA_KERNEL_LAUNCH_CHECK();
    const auto blocks = static_cast<unsigned>((x.size(1) + BLOCK - 1) / BLOCK);
    backward_weight<<<blocks, BLOCK, 0, stream.stream()>>>(
        x.data_ptr<float>(), inverse.data_ptr<float>(), grad_output.data_ptr<float>(),
        grad_weight.data_ptr<float>(), x.size(0), x.size(1));
    C10_CUDA_KERNEL_LAUNCH_CHECK();
    return {grad_input, grad_weight};
}
