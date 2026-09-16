`timescale 1ns/1ps
// Three-by-three output-stationary teaching array. No backpressure.
// Inject row i and column j delayed by i and j cycles respectively.
// Each valid operand hops one PE per rising edge; reset between independent tiles.
module systolic_pe (
    input wire clk, rst,
    input wire signed [7:0] a_in, b_in,
    input wire a_valid_in, b_valid_in,
    output reg signed [7:0] a_out, b_out,
    output reg a_valid_out, b_valid_out,
    output reg signed [19:0] acc
);
    wire signed [15:0] product = a_in * b_in;
    wire signed [19:0] extended_product = {{4{product[15]}},product};
    always @(posedge clk) begin
        if (rst) begin
            a_out <= 0; b_out <= 0;
            a_valid_out <= 0; b_valid_out <= 0;
            acc <= 0;
        end else begin
            a_out <= a_in; b_out <= b_in;
            a_valid_out <= a_valid_in; b_valid_out <= b_valid_in;
            if (a_valid_in && b_valid_in) acc <= acc + extended_product;
        end
    end
endmodule

module systolic3 (
    input wire clk, rst,
    input wire [23:0] a_edge, b_edge,
    input wire [2:0] a_valid, b_valid,
    output wire [179:0] results
);
    wire [7:0] a_link[0:2][0:3];
    wire [7:0] b_link[0:3][0:2];
    wire va[0:2][0:3];
    wire vb[0:3][0:2];
    genvar i,j;
    generate for(i=0;i<3;i=i+1) begin : rows
        assign a_link[i][0] = a_edge[8*i +: 8];
        assign va[i][0] = a_valid[i];
        assign b_link[0][i] = b_edge[8*i +: 8];
        assign vb[0][i] = b_valid[i];
        for(j=0;j<3;j=j+1) begin : cols
            systolic_pe pe(
                .clk(clk), .rst(rst),
                .a_in(a_link[i][j]), .b_in(b_link[i][j]),
                .a_valid_in(va[i][j]), .b_valid_in(vb[i][j]),
                .a_out(a_link[i][j+1]), .b_out(b_link[i+1][j]),
                .a_valid_out(va[i][j+1]), .b_valid_out(vb[i+1][j]),
                .acc(results[20*(i*3+j) +: 20])
            );
        end
    end endgenerate
endmodule
