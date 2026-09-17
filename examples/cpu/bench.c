#define _POSIX_C_SOURCE 200809L
#include "kernels.h"
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* Kernels compile separately without LTO, so these calls remain inside the
   timed loop. Do not replace this boundary with volatile array accesses. */
typedef double (*matrix_kernel)(const double *, size_t);
static double chain_matrix(const double *a, size_t n) { return sum_chain(a, n * n); }
static double independent_matrix(const double *a, size_t n) { return sum_independent(a, n * n); }
static matrix_kernel kernels[] = {sum_rows, sum_columns, chain_matrix, independent_matrix};
static const char *names[] = {"rows", "columns", "chain", "independent"};

static double initialize(double *a, size_t count) {
    double sum = 0.0;
    for (size_t i = 0; i < count; ++i) {
        a[i] = (double)(i % 17);
        sum += a[i];
    }
    return sum;
}

static double now(void) {
    struct timespec value;
    if (clock_gettime(CLOCK_MONOTONIC, &value) != 0) {
        perror("clock_gettime");
        exit(EXIT_FAILURE);
    }
    return (double)value.tv_sec + (double)value.tv_nsec * 1e-9;
}

static size_t argument(const char *value, size_t maximum, const char *label) {
    char *end;
    errno = 0;
    unsigned long parsed = strtoul(value, &end, 10);
    if (errno || *value < '0' || *value > '9' || *end || parsed == 0 || parsed > maximum) {
        fprintf(stderr, "%s must be an integer from 1 to %zu\n", label, maximum);
        exit(EXIT_FAILURE);
    }
    return (size_t)parsed;
}

static int check(void) {
    const size_t sizes[] = {1, 2, 3, 5, 16, 33};
    double a[33 * 33];
    for (size_t s = 0; s < sizeof sizes / sizeof sizes[0]; ++s) {
        size_t n = sizes[s];
        double expected = initialize(a, n * n);
        for (size_t k = 0; k < sizeof kernels / sizeof kernels[0]; ++k) {
            if (kernels[k](a, n) != expected) {
                fprintf(stderr, "%s failed for N=%zu\n", names[k], n);
                return EXIT_FAILURE;
            }
        }
    }
    /* Exercise every possible four-accumulator tail, including no elements. */
    for (size_t length = 0; length <= 19; ++length) {
        double expected = initialize(a, length);
        if (sum_chain(a, length) != expected || sum_independent(a, length) != expected)
            return fprintf(stderr, "Reduction failed for length %zu\n", length), EXIT_FAILURE;
    }
    float x[21], y[21];
    for (size_t length = 0; length <= 19; ++length) {
        for (size_t i = 0; i < 21; ++i) { x[i] = (float)i; y[i] = 3.0f; }
        axpy(y + 1, x + 1, 2.0f, length);
        for (size_t i = 0; i < 21; ++i) {
            float expected = (i >= 1 && i <= length) ? 2.0f * (float)i + 3.0f : 3.0f;
            if (x[i] != (float)i || y[i] != expected)
                return fprintf(stderr, "AXPY failed at length %zu, index %zu\n", length, i), EXIT_FAILURE;
        }
    }
    puts("PASS: four reductions, all accumulator tails, AXPY and surrounding values");
    return EXIT_SUCCESS;
}

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--check") == 0) return check();
    if (argc < 2 || argc > 4) {
        fprintf(stderr, "Usage: %s rows|columns|chain|independent [N=1024] [repetitions=20]\n       %s --check\n", argv[0], argv[0]);
        return EXIT_FAILURE;
    }
    size_t selected = 0;
    while (selected < sizeof names / sizeof names[0] && strcmp(argv[1], names[selected]) != 0) ++selected;
    if (selected == sizeof names / sizeof names[0]) {
        fprintf(stderr, "Unknown traversal: %s\n", argv[1]);
        return EXIT_FAILURE;
    }
    size_t n = argc > 2 ? argument(argv[2], 4096, "N") : 1024;
    size_t repetitions = argc > 3 ? argument(argv[3], 1000, "Repetitions") : 20;
    size_t count = n * n;
    double *a = malloc(count * sizeof *a);
    if (!a) { perror("malloc"); return EXIT_FAILURE; }
    double expected = initialize(a, count);
    matrix_kernel kernel = kernels[selected];
    double warmup = kernel(a, n);
    if (warmup != expected) {
        fprintf(stderr, "Warmup checksum mismatch\n");
        free(a);
        return EXIT_FAILURE;
    }
    double checksum = 0.0;
    double start = now();
    for (size_t repeat = 0; repeat < repetitions; ++repeat) checksum += kernel(a, n);
    double elapsed = now() - start;
    if (checksum != expected * (double)repetitions) {
        fprintf(stderr, "Timed checksum mismatch\n");
        free(a);
        return EXIT_FAILURE;
    }
    printf("%s | N=%zu | %.2f MiB | %zu repetitions\n", names[selected], n,
           (double)(count * sizeof *a) / (1024.0 * 1024.0), repetitions);
    printf("%.6f seconds total | %.3f ms per traversal | checksum %.0f\n",
           elapsed, elapsed * 1000.0 / (double)repetitions, checksum);
    puts("Allocation, initialization and one warmup traversal excluded from elapsed time.");
    free(a);
    return EXIT_SUCCESS;
}
