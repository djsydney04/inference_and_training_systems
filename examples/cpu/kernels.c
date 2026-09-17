#include "kernels.h"

/* Both matrix traversals read the same row-major allocation. */
double sum_rows(const double *a, size_t n) {
    double sum = 0.0;
    for (size_t row = 0; row < n; ++row)
        for (size_t column = 0; column < n; ++column)
            sum += a[row * n + column];
    return sum;
}

double sum_columns(const double *a, size_t n) {
    double sum = 0.0;
    for (size_t column = 0; column < n; ++column)
        for (size_t row = 0; row < n; ++row)
            sum += a[row * n + column];
    return sum;
}

double sum_chain(const double *a, size_t count) {
    double sum = 0.0;
    for (size_t i = 0; i < count; ++i) sum += a[i];
    return sum;
}

double sum_independent(const double *a, size_t count) {
    double s0 = 0.0, s1 = 0.0, s2 = 0.0, s3 = 0.0;
    size_t i = 0;
    for (; count - i >= 4; i += 4) {
        s0 += a[i];
        s1 += a[i + 1];
        s2 += a[i + 2];
        s3 += a[i + 3];
    }
    double sum = (s0 + s1) + (s2 + s3);
    for (; i < count; ++i) sum += a[i];
    return sum;
}

/* The caller promises that the accessed x and y ranges do not overlap. */
void axpy(float *restrict y, const float *restrict x, float scale, size_t count) {
    for (size_t i = 0; i < count; ++i) y[i] = scale * x[i] + y[i];
}
