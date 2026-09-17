CC ?= cc
CLANG ?= clang
CFLAGS ?= -O3 -std=c11 -Wall -Wextra -Wpedantic

.PHONY: all check assembly clean
all: cpu_bench
cpu_bench: bench.o kernels.o
	$(CC) $(CFLAGS) bench.o kernels.o -o $@
bench.o: bench.c kernels.h
	$(CC) $(CFLAGS) -c bench.c -o $@
kernels.o: kernels.c kernels.h
	$(CC) $(CFLAGS) -c kernels.c -o $@
check: cpu_bench
	./cpu_bench --check
assembly:
	$(CLANG) $(CFLAGS) -Rpass=loop-vectorize -Rpass-missed=loop-vectorize -Rpass-analysis=loop-vectorize -S kernels.c -o kernels.s
clean:
	rm -f cpu_bench bench.o kernels.o kernels.s
