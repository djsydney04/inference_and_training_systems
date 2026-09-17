// One numerical contract, separate CUDA and HIP binaries. See README.md.
// Default build runs a CPU emulation of the bounds-checked launch.
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <stdexcept>
#include <vector>

#if defined(ATLAS_HIP)
#include <hip/hip_runtime.h>
#define GPU(name) hip##name
using DeviceProperties = hipDeviceProp_t;
#elif defined(ATLAS_CUDA)
#include <cuda_runtime.h>
#define GPU(name) cuda##name
using DeviceProperties = cudaDeviceProp;
#endif

constexpr int edge = 16;

#if defined(ATLAS_HIP) || defined(ATLAS_CUDA)
void check(GPU(Error_t) error) {
  if (error != GPU(Success)) throw std::runtime_error(GPU(GetErrorString)(error));
}
struct DeviceBuffer {
  float* data = nullptr;
  explicit DeviceBuffer(size_t elements) {
    check(GPU(Malloc)(reinterpret_cast<void**>(&data), elements * sizeof(float)));
  }
  ~DeviceBuffer() { if (data) GPU(Free)(data); }
  DeviceBuffer(const DeviceBuffer&) = delete;
  DeviceBuffer& operator=(const DeviceBuffer&) = delete;
};

__global__ void multiply(const float* a, const float* b, float* c, int m, int k, int n) {
  const int row = blockIdx.y * blockDim.y + threadIdx.y;
  const int column = blockIdx.x * blockDim.x + threadIdx.x;
  if (row >= m || column >= n) return;
  float sum = 0;
  for (int p = 0; p < k; ++p) sum += a[row * k + p] * b[p * n + column];
  c[row * n + column] = sum;
}
#endif

void run_case(int m, int k, int n, bool zeros = false) {
  std::vector<float> a(m * k), b(k * n), c(m * n, NAN);
  for (size_t i = 0; i < a.size(); ++i) a[i] = zeros ? 0.f : (int(i % 17) - 8) / 7.f;
  for (size_t i = 0; i < b.size(); ++i) b[i] = (int(i % 13) - 6) / 5.f;

  // Independently accumulated reference: loop over outer products in FP64.
  std::vector<double> reference(m * n, 0.0);
  for (int p = 0; p < k; ++p)
    for (int row = 0; row < m; ++row)
      for (int column = 0; column < n; ++column)
        reference[row * n + column] += double(a[row * k + p]) * b[p * n + column];

#if defined(ATLAS_HIP) || defined(ATLAS_CUDA)
  DeviceBuffer da(a.size()), db(b.size()), dc(c.size());
  check(GPU(Memcpy)(da.data, a.data(), a.size() * sizeof(float), GPU(MemcpyHostToDevice)));
  check(GPU(Memcpy)(db.data, b.data(), b.size() * sizeof(float), GPU(MemcpyHostToDevice)));
  check(GPU(Memcpy)(dc.data, c.data(), c.size() * sizeof(float), GPU(MemcpyHostToDevice)));
  const dim3 block(edge, edge), grid((n + edge - 1) / edge, (m + edge - 1) / edge);
  multiply<<<grid, block>>>(da.data, db.data, dc.data, m, k, n);
  check(GPU(GetLastError)());
  check(GPU(DeviceSynchronize)());
  check(GPU(Memcpy)(c.data(), dc.data, c.size() * sizeof(float), GPU(MemcpyDeviceToHost)));
#else
  // CPU launch emulation tests coverage of ragged grid edges, not GPU execution.
  for (int by = 0; by < (m + edge - 1) / edge; ++by)
    for (int bx = 0; bx < (n + edge - 1) / edge; ++bx)
      for (int ty = 0; ty < edge; ++ty)
        for (int tx = 0; tx < edge; ++tx) {
          const int row = by * edge + ty, column = bx * edge + tx;
          if (row >= m || column >= n) continue;
          float sum = 0;
          for (int p = 0; p < k; ++p) sum += a[row * k + p] * b[p * n + column];
          c[row * n + column] = sum;
        }
#endif
  double max_error = 0;
  for (size_t i = 0; i < c.size(); ++i) {
    const double error = std::abs(c[i] - reference[i]);
    if (!std::isfinite(c[i]) || error > 2e-4 + 2e-4 * std::abs(reference[i]))
      throw std::runtime_error("Matmul mismatch or unwritten output");
    max_error = std::max(max_error, error);
  }
  std::printf("PASS [%d,%d] x [%d,%d], max absolute error %.8g%s\n",
              m, k, k, n, max_error, zeros ? " (zero left operand)" : "");
}

int main() {
  try {
#if defined(ATLAS_HIP) || defined(ATLAS_CUDA)
    check(GPU(SetDevice)(0));
    DeviceProperties properties{};
    check(GPU(GetDeviceProperties)(&properties, 0));
    std::printf("Device: %s; runtime warpSize: %d; threads/block: %d\n",
                properties.name, properties.warpSize, edge * edge);
#else
    std::puts("CPU launch emulation only; no accelerator is used.");
#endif
    run_case(1, 1, 1);
    run_case(17, 19, 13);
    run_case(32, 64, 48);
    run_case(33, 131, 65);
    run_case(17, 19, 13, true);
    return 0;
  } catch (const std::exception& error) {
    std::fprintf(stderr, "%s\n", error.what());
    return 1;
  }
}
