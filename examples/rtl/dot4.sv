`timescale 1ns/1ps
// A deliberately serial dot product: four accepted signed 8-bit pairs.
// WAIT takes pair 1; RUN takes pairs 2..4; RESULT holds the sum until consumed.
// The 18-bit result safely represents four full-range signed 8x8 products.
module dot4 (
    input wire clk, rst,
    input wire in_valid,
    output wire in_ready,
    input wire signed [7:0] a, b,
    output wire out_valid,
    input wire out_ready,
    output reg signed [17:0] y
);
    localparam WAIT = 2'd0, RUN = 2'd1, RESULT = 2'd2;
    reg [1:0] state;
    reg [1:0] count;
    reg signed [17:0] acc;
    wire signed [15:0] product = a * b;
    wire signed [17:0] wide_product = {{2{product[15]}}, product};
    assign in_ready = state == WAIT || state == RUN;
    assign out_valid = state == RESULT;
    always @(posedge clk) begin
        if (rst) begin
            state <= WAIT;
            count <= 0;
            acc <= 0;
            y <= 0;
        end else begin
            case (state)
                WAIT: if (in_valid && in_ready) begin
                    acc <= wide_product;
                    count <= 1;
                    state <= RUN;
                end
                RUN: if (in_valid && in_ready) begin
                    acc <= acc + wide_product;
                    count <= count + 1'b1;
                    if (count == 3) begin
                        y <= acc + wide_product;
                        state <= RESULT;
                    end
                end
                RESULT: if (out_ready) state <= WAIT;
                default: state <= WAIT;
            endcase
        end
    end
endmodule
