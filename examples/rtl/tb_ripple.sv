`timescale 1ns/1ps
module tb_ripple;
    reg [7:0] a, b;
    wire [7:0] sum;
    wire carry, overflow;
    integer i, j, exact, expected_signed, signed_a, signed_b;
    ripple_adder dut(a, b, sum, carry, overflow);
    initial begin
        for (i=0; i<256; i=i+1) begin
            for (j=0; j<256; j=j+1) begin
                a=i; b=j; #1;
                exact=i+j;
                signed_a=i<128 ? i : i-256;
                signed_b=j<128 ? j : j-256;
                expected_signed=signed_a+signed_b;
                if ({carry,sum} !== exact[8:0]) $fatal(1,"carry/sum mismatch");
                if (overflow !== (expected_signed < -128 || expected_signed > 127))
                    $fatal(1,"signed overflow mismatch");
            end
        end
        $display("PASS ripple: 65536 operand pairs, carry and signed overflow");
        $finish;
    end
endmodule
