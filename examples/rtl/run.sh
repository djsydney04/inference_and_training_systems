#!/bin/sh
set -eu
cd "$(dirname "$0")"
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/atlas-rtl.XXXXXX")
trap 'rm -rf "$build_dir"' EXIT HUP INT TERM
for name in ripple elastic_mac dot4 systolic3; do
    case "$name" in ripple) design=ripple_adder;; *) design=$name;; esac
    iverilog -g2012 -Wall -s "tb_$name" -o "$build_dir/$name" "$design.sv" "tb_$name.sv"
    vvp "$build_dir/$name"
done
