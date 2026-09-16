#!/bin/sh
# Generic synthesis + re-simulation. This does not place/route or select a device.
set -eu
cd "$(dirname "$0")"
rtl_yosys=${RTL_YOSYS:-yosys}
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/atlas-rtl-synth.XXXXXX")
trap 'rm -rf "$build_dir"' EXIT HUP INT TERM
for name in ripple elastic_mac dot4 systolic3; do
    case "$name" in ripple) design=ripple_adder;; *) design=$name;; esac
    "$rtl_yosys" -Q -T -p "read_verilog -sv $design.sv; hierarchy -check -top $design; synth -top $design; check -assert; write_verilog -noattr $build_dir/$design.v" > "$build_dir/$design.log" 2>&1 || {
        cat "$build_dir/$design.log"
        exit 1
    }
    iverilog -g2012 -s "tb_$name" -o "$build_dir/$name" "$build_dir/$design.v" "tb_$name.sv"
    vvp "$build_dir/$name"
done
