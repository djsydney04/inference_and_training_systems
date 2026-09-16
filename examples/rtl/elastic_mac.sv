`timescale 1ns/1ps
// Two elastic register stages. Each transaction computes a*b+c independently.
// a,b: signed 8 bit. c: signed 20 bit. y: signed 21 bit (no truncation).
// Reset is synchronous and active high; reset discards all in-flight tokens.
// Input/output transfer occurs only on a rising edge with valid && ready.
module elastic_mac (
    input  wire clk, rst,
    input  wire in_valid,
    output wire in_ready,
    input  wire signed [7:0] a, b,
    input  wire signed [19:0] c,
    output wire out_valid,
    input  wire out_ready,
    output reg signed [20:0] y
);
    reg product_valid, result_valid;
    reg signed [15:0] product;
    reg signed [19:0] addend;
    wire result_ready = !result_valid || out_ready;
    assign in_ready = !product_valid || result_ready;
    assign out_valid = result_valid;
    wire signed [20:0] wide_product = {{5{product[15]}}, product};
    wire signed [20:0] wide_addend = {addend[19], addend};

    always @(posedge clk) begin
        if (rst) begin
            product_valid <= 1'b0;
            result_valid <= 1'b0;
            product <= 16'sd0;
            addend <= 20'sd0;
            y <= 21'sd0;
        end else begin
            // Both stages read old register values at this edge.
            if (result_ready) begin
                result_valid <= product_valid;
                if (product_valid) y <= wide_product + wide_addend;
            end
            if (in_ready) begin
                product_valid <= in_valid;
                if (in_valid) begin
                    product <= a * b;
                    addend <= c;
                end
            end
        end
    end
endmodule
