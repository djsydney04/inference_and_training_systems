// Correctness-first FP32 row kernels. Requires CUDA, C++17 and an NVIDIA GPU.
// All 256 threads participate in every block reduction, including row tails.
#include <cuda_runtime.h>
#include <math_constants.h>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

#define CUDA_CHECK(call) do { const cudaError_t error = (call); if (error != cudaSuccess) { \
    std::fprintf(stderr, "%s:%d: %s\n", __FILE__, __LINE__, cudaGetErrorString(error)); std::exit(EXIT_FAILURE); } } while (0)

template <typename T> struct DeviceBuffer {
    T *data = nullptr;
    explicit DeviceBuffer(size_t n) { if (n) CUDA_CHECK(cudaMalloc(reinterpret_cast<void **>(&data), n * sizeof(T))); }
    ~DeviceBuffer() { if (data) cudaFree(data); }
    DeviceBuffer(const DeviceBuffer &) = delete;
    DeviceBuffer &operator=(const DeviceBuffer &) = delete;
};

constexpr int BLOCK = 256;
constexpr float EPS = 1e-5f;

template <bool Maximum> __device__ float block_reduce(float value) {
    __shared__ float scratch[BLOCK];
    const int t = threadIdx.x;
    scratch[t] = value;
    __syncthreads();
    for (int offset = BLOCK / 2; offset > 0; offset /= 2) {
        if (t < offset) scratch[t] = Maximum ? fmaxf(scratch[t], scratch[t + offset]) : scratch[t] + scratch[t + offset];
        __syncthreads();
    }
    const float result = scratch[0];
    // Stop the next invocation from overwriting scratch before peers read it.
    __syncthreads();
    return result;
}

__global__ void axpy(const float *x, const float *y, float *out, size_t n, float alpha) {
    const size_t start = size_t(blockIdx.x) * blockDim.x + threadIdx.x;
    const size_t stride = size_t(blockDim.x) * gridDim.x;
    for (size_t i = start; i < n; i += stride) out[i] = alpha * x[i] + y[i];
}

__global__ void sum_partials(const float *x, float *partials, size_t n) {
    float local = 0;
    for (size_t i = size_t(blockIdx.x) * BLOCK + threadIdx.x; i < n; i += size_t(BLOCK) * gridDim.x) local += x[i];
    const float sum = block_reduce<false>(local);
    if (threadIdx.x == 0) partials[blockIdx.x] = sum;
}

__global__ void softmax_forward(const float *x, float *y, int cols) {
    const size_t base = size_t(blockIdx.x) * cols;
    float maximum = -CUDART_INF_F;
    for (int c = threadIdx.x; c < cols; c += BLOCK) maximum = fmaxf(maximum, x[base + c]);
    maximum = block_reduce<true>(maximum);
    float sum = 0;
    for (int c = threadIdx.x; c < cols; c += BLOCK) sum += expf(x[base + c] - maximum);
    sum = block_reduce<false>(sum);
    for (int c = threadIdx.x; c < cols; c += BLOCK) y[base + c] = expf(x[base + c] - maximum) / sum;
}

__global__ void softmax_backward(const float *y, const float *dy, float *dx, int cols) {
    const size_t base = size_t(blockIdx.x) * cols;
    float dot = 0;
    for (int c = threadIdx.x; c < cols; c += BLOCK) dot += y[base + c] * dy[base + c];
    dot = block_reduce<false>(dot);
    for (int c = threadIdx.x; c < cols; c += BLOCK) dx[base + c] = y[base + c] * (dy[base + c] - dot);
}

__global__ void rms_forward(const float *x, const float *weight, float *y, float *inverse, int cols) {
    const size_t base = size_t(blockIdx.x) * cols;
    float squares = 0;
    for (int c = threadIdx.x; c < cols; c += BLOCK) squares += x[base + c] * x[base + c];
    const float inv = rsqrtf(block_reduce<false>(squares) / cols + EPS);
    if (threadIdx.x == 0) inverse[blockIdx.x] = inv;
    for (int c = threadIdx.x; c < cols; c += BLOCK) y[base + c] = x[base + c] * inv * weight[c];
}

__global__ void rms_backward(const float *x, const float *weight, const float *dy, const float *inverse,
                             float *dx, float *partial_dw, int cols) {
    const size_t base = size_t(blockIdx.x) * cols;
    const float inv = inverse[blockIdx.x];
    float dot = 0;
    for (int c = threadIdx.x; c < cols; c += BLOCK) dot += dy[base + c] * weight[c] * x[base + c];
    dot = block_reduce<false>(dot);
    for (int c = threadIdx.x; c < cols; c += BLOCK) {
        dx[base + c] = inv * dy[base + c] * weight[c] - x[base + c] * inv * inv * inv * dot / cols;
        partial_dw[base + c] = dy[base + c] * x[base + c] * inv;
    }
}

__global__ void weight_gradient(const float *partial_dw, float *dw, int rows, int cols) {
    const int c = int(blockIdx.x * blockDim.x + threadIdx.x);
    if (c >= cols) return; // Safe: this kernel has no block barrier.
    float sum = 0;
    for (int row = 0; row < rows; ++row) sum += partial_dw[size_t(row) * cols + c];
    dw[c] = sum;
}

static void launch_checked() { CUDA_CHECK(cudaGetLastError()); CUDA_CHECK(cudaDeviceSynchronize()); }
static void upload(float *dst, const std::vector<float> &src) {
    CUDA_CHECK(cudaMemcpy(dst, src.data(), src.size() * sizeof(float), cudaMemcpyHostToDevice));
}
static std::vector<float> download(const float *src, size_t n) {
    std::vector<float> result(n);
    CUDA_CHECK(cudaMemcpy(result.data(), src, n * sizeof(float), cudaMemcpyDeviceToHost));
    return result;
}
static void compare(const char *label, const std::vector<float> &actual, const std::vector<double> &expected) {
    if (actual.size() != expected.size()) std::exit(EXIT_FAILURE);
    double worst = 0;
    for (size_t i = 0; i < actual.size(); ++i) {
        const double difference = std::abs(double(actual[i]) - expected[i]);
        worst = std::max(worst, difference);
        if (!std::isfinite(actual[i]) || difference > 3e-4 + 3e-4 * std::abs(expected[i])) {
            std::fprintf(stderr, "%s[%zu]: got %.9g expected %.12g\n", label, i, actual[i], expected[i]); std::exit(EXIT_FAILURE);
        }
    }
    std::printf("  %-12s max absolute error %.3g\n", label, worst);
}

static void run_case(int rows, int cols, bool zero_input = false, bool large_logits = false) {
    const size_t n = size_t(rows) * cols;
    std::vector<float> x(n), dy(n), w(cols);
    for (size_t i = 0; i < n; ++i) {
        x[i] = zero_input ? 0.f : float(int(i % 19) - 9) * .13f + (large_logits ? 1000.f : 0.f);
        dy[i] = float(int(i % 11) - 5) * .17f;
    }
    for (int c = 0; c < cols; ++c) w[c] = .8f + float(c % 7) * .03f;
    DeviceBuffer<float> d_x(n), d_dy(n), d_w(cols), d_y(n), d_dx(n), d_inv(rows), d_pdw(n), d_dw(cols), d_partial(3);
    upload(d_x.data, x); upload(d_dy.data, dy); upload(d_w.data, w);
    std::printf("Checking %dx%d%s%s\n", rows, cols, zero_input ? " zero input" : "", large_logits ? " large logits" : "");
    std::vector<double> ref(n), grad(n), rms(n), rms_dx(n), dw(cols, 0);

    axpy<<<3, BLOCK>>>(d_x.data, d_dy.data, d_y.data, n, .5f); launch_checked();
    for (size_t i = 0; i < n; ++i) ref[i] = .5 * x[i] + dy[i];
    compare("axpy", download(d_y.data, n), ref);

    sum_partials<<<3, BLOCK>>>(d_x.data, d_partial.data, n); launch_checked();
    // A second launch is a legal grid-wide boundary and completes on-device sum.
    sum_partials<<<1, BLOCK>>>(d_partial.data, d_y.data, 3); launch_checked();
    double total = 0; for (float value : x) total += value;
    compare("sum", download(d_y.data, 1), {total});

    softmax_forward<<<rows, BLOCK>>>(d_x.data, d_y.data, cols); launch_checked();
    softmax_backward<<<rows, BLOCK>>>(d_y.data, d_dy.data, d_dx.data, cols); launch_checked();
    for (int row = 0; row < rows; ++row) {
        const size_t base = size_t(row) * cols;
        double maximum = x[base], sum = 0, dot = 0, squares = 0, rms_dot = 0;
        for (int c = 0; c < cols; ++c) maximum = std::max(maximum, double(x[base + c]));
        for (int c = 0; c < cols; ++c) sum += std::exp(double(x[base + c]) - maximum);
        for (int c = 0; c < cols; ++c) {
            ref[base + c] = std::exp(double(x[base + c]) - maximum) / sum;
            dot += ref[base + c] * dy[base + c];
            squares += double(x[base + c]) * x[base + c];
            rms_dot += double(dy[base + c]) * w[c] * x[base + c];
        }
        const double inv = 1 / std::sqrt(squares / cols + double(EPS));
        for (int c = 0; c < cols; ++c) {
            const size_t i = base + c;
            grad[i] = ref[i] * (dy[i] - dot);
            rms[i] = double(x[i]) * inv * w[c];
            rms_dx[i] = inv * dy[i] * w[c] - x[i] * inv * inv * inv * rms_dot / cols;
            dw[c] += dy[i] * double(x[i]) * inv;
        }
    }
    compare("softmax", download(d_y.data, n), ref);
    compare("softmax dx", download(d_dx.data, n), grad);
    rms_forward<<<rows, BLOCK>>>(d_x.data, d_w.data, d_y.data, d_inv.data, cols); launch_checked();
    rms_backward<<<rows, BLOCK>>>(d_x.data, d_w.data, d_dy.data, d_inv.data, d_dx.data, d_pdw.data, cols); launch_checked();
    weight_gradient<<<(cols + BLOCK - 1) / BLOCK, BLOCK>>>(d_pdw.data, d_dw.data, rows, cols); launch_checked();
    compare("rmsnorm", download(d_y.data, n), rms);
    compare("rmsnorm dx", download(d_dx.data, n), rms_dx);
    compare("rmsnorm dw", download(d_dw.data, cols), dw);
}

int main() {
    int count = 0; CUDA_CHECK(cudaGetDeviceCount(&count));
    if (count == 0) { std::fputs("An NVIDIA CUDA device is required.\n", stderr); return EXIT_FAILURE; }
    cudaDeviceProp prop{}; CUDA_CHECK(cudaGetDeviceProperties(&prop, 0));
    std::printf("Device: %s, compute capability %d.%d\n", prop.name, prop.major, prop.minor);
    // Empty tensors: the host owns this policy; a zero-sized grid is not launched.
    for (int cols : {1, 7, 31, 32, 33, 255, 256, 257, 1025}) run_case(3, cols);
    run_case(2, 33, true); run_case(2, 257, false, true);
    CUDA_CHECK(cudaDeviceSynchronize());
    std::puts("All CUDA reference comparisons passed. No throughput claim is made.");
    return EXIT_SUCCESS;
}
