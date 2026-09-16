`timescale 1ns/1ps
// Original teaching circuit: unsigned carry and signed overflow are distinct.
module ripple_adder #(parameter W = 8) (
    input  wire [W-1:0] a, b,
    output wire [W-1:0] sum,
    output wire carry_out, signed_overflow
);
    wire [W:0] carry;
    assign carry[0] = 1'b0;
    genvar i;
    generate for (i = 0; i < W; i = i + 1) begin : bit_slice
        assign sum[i] = a[i] ^ b[i] ^ carry[i];
        assign carry[i+1] = (a[i] & b[i]) |
                              ((a[i] ^ b[i]) & carry[i]);
    end endgenerate
    assign carry_out = carry[W];
    assign signed_overflow = carry[W] ^ carry[W-1];
endmodule
