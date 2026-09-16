// Bindings only. The CUDA translation unit owns validation and device launches.
#include <torch/extension.h>
#include <vector>

std::vector<at::Tensor> atlas_rmsnorm_forward_cuda(
    const at::Tensor& x, const at::Tensor& weight, double epsilon);
std::vector<at::Tensor> atlas_rmsnorm_backward_cuda(
    const at::Tensor& x, const at::Tensor& weight,
    const at::Tensor& inverse, const at::Tensor& grad_output);

PYBIND11_MODULE(TORCH_EXTENSION_NAME, module) {
    module.def("forward", &atlas_rmsnorm_forward_cuda,
               "Contiguous FP32 RMSNorm forward (CUDA)");
    module.def("backward", &atlas_rmsnorm_backward_cuda,
               "Contiguous FP32 RMSNorm first backward (CUDA)");
}
