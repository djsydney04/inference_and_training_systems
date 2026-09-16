# Digital arithmetic and accelerator labs

These original examples accompany the atlas's **Digital logic** and **FPGA / ASIC** chapters. All arithmetic contracts below use signed two's-complement integers unless stated otherwise.

## Run

Install Icarus Verilog, then run from the repository root:

```sh
sh examples/rtl/run.sh
```

The script compiles each testbench separately, puts temporary binaries outside the repository, fails on any `$fatal`, and removes the binaries on exit. No FPGA board is needed. `iverilog -g2012` enables the supported SystemVerilog syntax. The design modules deliberately use a small, synthesizable language subset.

## Circuit contracts

| Design | Arithmetic and protocol | Test |
| --- | --- | --- |
| `ripple_adder.sv` | Parameterized unsigned bit patterns; default 8-bit sum, unsigned carry and signed-overflow flags | All 65,536 8-bit operand pairs |
| `elastic_mac.sv` | Independent signed 8×8+20-bit transactions; exact 21-bit result; two elastic register stages | Queue scoreboard, signed operands, source bubbles, consumer stalls, simultaneous transfers, reset while occupied |
| `dot4.sv` | Four accepted signed 8×8 pairs; exact 18-bit sum; WAIT/RUN/RESULT controller | 64 vectors, source pauses, held results, all-minimum-negative corner |
| `systolic3.sv` | 3×3 output-stationary array; signed 8-bit inputs and 20-bit accumulators; one hop/edge | 18 matrices, all 9 PEs checked after each of 10 cycles: 1,620 checks |

### Ready/valid

For the elastic MAC and dot4, input and output transfers happen on rising edges where `valid && ready`. Producers must hold a valid payload stable until accepted. Consumers may deassert ready and stall indefinitely. The synchronous, active-high reset clears state and discards in-flight work. Reset is not an ordinary transaction.

The MAC's product register carries the matching addend. Both pipeline stages use old register values at an edge. A token accepted at edge 1 produces a registered output after edge 2 and can be consumed at edge 3; with continuous traffic, the steady-state transfer interval is one cycle.

The testbench's lifetime accepted and consumed counts differ by two because an explicit reset flushes two occupied slots. Its queue is cleared at that reset boundary. Within each reset epoch, all consumed outputs match the queue exactly.

### Systolic injection

At zero-based cycle `t`, inject `A[i][t-i]` into row `i` and `B[t-j][j]` into column `j` if those indices are in `0..2`; otherwise deassert that lane's valid. Operands meet at PE `(i,j)` for reduction index `k` at cycle `t=k+i+j`. The last computation occurs at `t=6`. Results appear in row-major 20-bit slices of `results`.

This array has no ready signals, output queue or completion signal. The caller owns the fixed schedule, reads the sums after the final edge and resets before a new independent tile. Its valid bits suppress padding; they do not verify that matching reduction indices arrived together. The provided testbench supplies that schedule and checks each partial sum, including after invalid, deliberately nonzero padding. Do not claim general flow-control support or stream unbounded reductions into finite accumulators.

## Synthesis inspection

With Yosys or YoWASP Yosys installed:

```sh
yosys -p 'read_verilog -sv examples/rtl/elastic_mac.sv; hierarchy -check -top elastic_mac; proc; opt; check; stat'
yosys -p 'read_verilog -sv examples/rtl/systolic3.sv; hierarchy -check -top systolic3; proc; opt; check; stat'
```

Substitute `yowasp-yosys` for `yosys` if using YoWASP. To synthesize all four designs to generic logic and rerun the same testbenches against those generated netlists:

```sh
sh examples/rtl/synth.sh
# Or: RTL_YOSYS=yowasp-yosys sh examples/rtl/synth.sh
```

This harness stores generated netlists in a temporary directory and checks that no structural problems remain using `check -assert`. Device mapping, placement/routing, clock and I/O constraints, and board-specific pin constraints are additional steps. Do not feed the simulation testbench to hardware synthesis.

## Validation record

On 2026-09-14, Icarus Verilog 13.0 completed all four tests:

```text
PASS ripple: 65536 operand pairs, carry and signed overflow
PASS elastic MAC: 640 accepted, 638 consumed, 560 simultaneous; reset flush, stalls, signed arithmetic
PASS dot4: 64 vectors, source bubbles, result stalls, -128 corner, reset mid-vector
PASS systolic3: 1620 per-cycle PE checks; skew, signed corners, reset, invalid padding
```

YoWASP Yosys 0.69 then completed full generic synthesis (`synth`) and structural checks (`check -assert`) for all four designs. Icarus reran the same testbenches against the generated Verilog netlists; all four passed with the same counts. This is tested post-synthesis behavior, not a formal equivalence proof.

The associated TypeScript tests exhaust the same adder truth table, check fixed-point rounding and saturation, verify timing-model identities, enumerate 256 consumer-stall patterns for the elastic pipeline, and check all systolic partial sums and activity counts.

These are functional and logical-cycle checks. No target FPGA mapping, placed-and-routed frequency, on-board measurement, analog metastability simulation, ASIC signoff or fabricated hardware is claimed.
