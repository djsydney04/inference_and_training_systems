# From C storage to a tensor

Run from the repository root using Clang or GCC:

```sh
mkdir -p /tmp/atlas-c
cc -std=c17 -O1 -g -Wall -Wextra -Wpedantic -Werror \
  -fsanitize=address,undefined -fno-omit-frame-pointer \
  examples/c-basics/tensor_memory.c -lm -o /tmp/atlas-c/tensor_memory
/tmp/atlas-c/tensor_memory
cc -std=c17 -O2 -S examples/c-basics/tensor_memory.c -o /tmp/atlas-c/tensor_memory.s
```

The harness checks one-element and odd-size matrices, padded row strides,
transpose views, independent matrix multiplication, untouched padding and an
allocation-size overflow guard. View construction here uses small compile-time
test shapes; an untrusted view API also needs checked extent/stride arithmetic.
`assert` is part of this teaching harness: do not compile tests with `-DNDEBUG`.

Exercises, in order:

1. Print the addresses of `a[1,2]` and `transpose(a)[2,1]`; explain equality.
2. Make a contiguous copy of the transpose and explain why pointer equality ends.
3. Add a sliced view starting at row 1, column 1. Store the original owner
   separately: a shifted pointer must not be passed to `free`.
4. Add a checked view constructor that proves the largest addressed offset is
   within capacity, including arithmetic-overflow checks and zero extents.
5. Change loop order and benchmark a large problem. Keep allocation outside the
   measured loop, consume the result, and compare the numerical error as well.

The C standard calls these automatic and allocated storage durations; stack and
heap are common implementation terms. ASan/UBSan finds classes of runtime errors,
not every possible violation. Passing these cases is not a general proof.

Primary references: [C11 committee draft, sections 6.2.4, 6.5.6, 7.22.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
and [Clang AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html).
