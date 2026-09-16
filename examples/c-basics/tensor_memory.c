// C17: an owning allocation, borrowed strided views, and independent checks.
#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    float *data;                 // Borrowed. This struct never frees it.
    size_t rows, cols;
    size_t row_stride, col_stride; // In elements, not bytes.
} MatrixView;

static float *allocate_floats(size_t count) {
    if (count > SIZE_MAX / sizeof(float)) return NULL;
    return calloc(count, sizeof(float));
}

static float *element(MatrixView a, size_t row, size_t col) {
    assert(row < a.rows && col < a.cols);
    // The caller guarantees that view extents and strides fit the allocation.
    return a.data + row * a.row_stride + col * a.col_stride;
}

static MatrixView transpose(MatrixView a) {
    return (MatrixView){a.data, a.cols, a.rows, a.col_stride, a.row_stride};
}

static void multiply(MatrixView a, MatrixView b, MatrixView c) {
    assert(a.cols == b.rows && c.rows == a.rows && c.cols == b.cols);
    // Output must not overlap either input. No hidden allocation in the loop.
    for (size_t row = 0; row < c.rows; ++row)
        for (size_t col = 0; col < c.cols; ++col) {
            double sum = 0;
            for (size_t k = 0; k < a.cols; ++k)
                sum += (double)*element(a, row, k) * *element(b, k, col);
            *element(c, row, col) = (float)sum;
        }
}

static void run_case(size_t rows, size_t cols, size_t padding) {
    const size_t stride = cols + padding;
    float *owner = allocate_floats(rows * stride);
    float *output_owner = allocate_floats(rows * rows);
    if (!owner || !output_owner) {
        free(owner); free(output_owner);
        fputs("Allocation failed\n", stderr); exit(EXIT_FAILURE);
    }
    MatrixView a = {owner, rows, cols, stride, 1};
    MatrixView at = transpose(a);
    MatrixView c = {output_owner, rows, rows, rows, 1};
    for (size_t r = 0; r < rows; ++r)
        for (size_t col = 0; col < cols; ++col)
            *element(a, r, col) = (float)((int)((r * 7 + col * 3) % 11) - 5);
    for (size_t r = 0; r < rows; ++r)
        for (size_t col = 0; col < cols; ++col)
            assert(element(a, r, col) == element(at, col, r));
    multiply(a, at, c);
    for (size_t r = 0; r < rows; ++r) {
        for (size_t col = 0; col < rows; ++col) {
            double reference = 0;
            // Independent direct address arithmetic checks the strided helper.
            for (size_t k = 0; k < cols; ++k)
                reference += (double)owner[r * stride + k] * owner[col * stride + k];
            assert(fabs((double)output_owner[r * rows + col] - reference) < 1e-6);
        }
        for (size_t col = cols; col < stride; ++col)
            assert(owner[r * stride + col] == 0); // Padding was not overwritten.
    }
    printf("PASS %zux%zu stride=%zu: transpose aliases storage, A*A^T agrees\n", rows, cols, stride);
    free(output_owner);
    free(owner); // a and at are now invalid views. Neither is freed separately.
}

int main(void) {
    assert(allocate_floats(SIZE_MAX) == NULL);
    run_case(1, 1, 0);
    run_case(3, 5, 3);
    run_case(7, 33, 1);
    return EXIT_SUCCESS;
}
