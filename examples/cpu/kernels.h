#ifndef CPU_KERNELS_H
#define CPU_KERNELS_H

#include <stddef.h>

double sum_rows(const double *a, size_t n);
double sum_columns(const double *a, size_t n);
double sum_chain(const double *a, size_t count);
double sum_independent(const double *a, size_t count);
void axpy(float *restrict y, const float *restrict x, float scale, size_t count);

#endif
