// Educational FP32 SIMT GEMM. One thread computes one output element.
// Original implementation; not a Tensor Core kernel or a cuBLAS competitor.
#include <cuda_runtime.h>
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <iostream>
#include <vector>

static void check(cudaError_t result, const char* operation) {
  if (result != cudaSuccess) {
    std::cerr << operation << ": " << cudaGetErrorString(result) << '\n';
    std::exit(EXIT_FAILURE);
  }
}

template<int TILE>
__global__ void tiled_matmul(const float* a, const float* b, float* c,
                             int m, int n, int k) {
  __shared__ float as[TILE][TILE];
  __shared__ float bs[TILE][TILE];
  const int tx = threadIdx.x, ty = threadIdx.y;
  const int row = blockIdx.y * TILE + ty;
  const int col = blockIdx.x * TILE + tx;
  float accumulator = 0.0f;

  for (int base = 0; base < k; base += TILE) {
    // Out-of-range loads become zero. Every thread still reaches both barriers.
    as[ty][tx] = row < m && base + tx < k ? a[row * k + base + tx] : 0.0f;
    bs[ty][tx] = base + ty < k && col < n ? b[(base + ty) * n + col] : 0.0f;
    __syncthreads(); // producers finish before peers consume their operands

    for (int p = 0; p < TILE; ++p)
      accumulator = fmaf(as[ty][p], bs[p][tx], accumulator);

    __syncthreads(); // consumers finish before the next iteration overwrites SRAM
  }
  if (row < m && col < n) c[row * n + col] = accumulator;
}

static bool verify(int m, int n, int k, bool fractional) {
  std::vector<float> a(m*k), b(k*n), result(m*n);
  for (int row=0; row<m; ++row) for (int col=0; col<k; ++col)
    a[row*k+col] = fractional ? std::sin(float(row*k+col)*.17f) : float((row*3+col*2)%7-3);
  for (int row=0; row<k; ++row) for (int col=0; col<n; ++col)
    b[row*n+col] = fractional ? std::cos(float(row*n+col)*.11f) : float((row*2+col*3+1)%5-2);
  float *da=nullptr, *db=nullptr, *dc=nullptr;
  check(cudaMalloc(&da, a.size()*sizeof(float)), "allocate A");
  check(cudaMalloc(&db, b.size()*sizeof(float)), "allocate B");
  check(cudaMalloc(&dc, result.size()*sizeof(float)), "allocate C");
  check(cudaMemcpy(da, a.data(), a.size()*sizeof(float), cudaMemcpyHostToDevice), "copy A");
  check(cudaMemcpy(db, b.data(), b.size()*sizeof(float), cudaMemcpyHostToDevice), "copy B");
  // Poison the output: a missing store must not accidentally compare as zero.
  check(cudaMemset(dc, 0xff, result.size()*sizeof(float)), "poison C");
  constexpr int tile=16;
  tiled_matmul<tile><<<dim3((n+tile-1)/tile,(m+tile-1)/tile),dim3(tile,tile)>>>(da,db,dc,m,n,k);
  check(cudaGetLastError(), "launch tiled_matmul");
  check(cudaDeviceSynchronize(), "complete tiled_matmul");
  check(cudaMemcpy(result.data(), dc, result.size()*sizeof(float), cudaMemcpyDeviceToHost), "copy C");
  bool passed=true;
  double max_error=0;
  for (int row=0; row<m; ++row) for (int col=0; col<n; ++col) {
    double expected=0;
    for (int p=0; p<k; ++p) expected += double(a[row*k+p])*double(b[p*n+col]);
    const double error=std::abs(double(result[row*n+col])-expected);
    max_error=std::max(max_error,error);
    passed &= std::isfinite(result[row*n+col]) && error <= 1e-4 + 1e-4*std::abs(expected);
  }
  check(cudaFree(da),"free A");check(cudaFree(db),"free B");check(cudaFree(dc),"free C");
  std::cout << (passed?"PASS ":"FAIL ") << m << 'x' << k << " @ " << k << 'x' << n
            << (fractional?" fractional":" integer") << " max absolute error=" << max_error << '\n';
  return passed;
}

int main() {
  int count=0;
  check(cudaGetDeviceCount(&count),"query devices");
  if (count<1) { std::cerr << "A CUDA-capable GPU is required.\n"; return EXIT_FAILURE; }
  cudaDeviceProp properties{};
  check(cudaGetDeviceProperties(&properties,0),"query device properties");
  std::cout << "Device: " << properties.name << "; tile=16; FP32 SIMT; correctness only\n";
  bool passed=true;
  for (const auto& shape : std::vector<std::vector<int>>{{4,4,6},{3,3,5},{1,5,1},{31,33,17},{17,9,257}})
    for (bool fractional : {false,true}) passed &= verify(shape[0],shape[1],shape[2],fractional);
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
