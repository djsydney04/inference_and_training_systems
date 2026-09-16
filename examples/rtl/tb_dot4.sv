`timescale 1ns/1ps
module tb_dot4;
    reg clk=0;
    always #5 clk=~clk;
    reg rst=1, in_valid=0, out_ready=0;
    reg signed [7:0] a=0,b=0;
    wire in_ready,out_valid;
    wire signed [17:0] y;
    dot4 dut(clk,rst,in_valid,in_ready,a,b,out_valid,out_ready,y);
    integer vector_id,k,sum,aa,bb;
    initial begin
        repeat(3) @(negedge clk); rst=0;
        // Reset after accepting two terms: discard the incomplete vector.
        @(negedge clk); a=5; b=7; in_valid=1;
        repeat(2) @(negedge clk);
        in_valid=0; rst=1;
        @(negedge clk); rst=0;
        if (!in_ready || out_valid) $fatal(1,"reset failed to discard partial dot product");
        for(vector_id=0;vector_id<64;vector_id=vector_id+1) begin
            sum=0;
            for(k=0;k<4;k=k+1) begin
                repeat((k+vector_id)%3) @(negedge clk);
                @(negedge clk);
                aa=vector_id==0 ? -128 : (vector_id*17+k*43)%256-128;
                bb=vector_id==0 ? -128 : (vector_id*23+k*13)%256-128;
                a=aa; b=bb; in_valid=1; sum=sum+aa*bb;
                @(posedge clk);
                if(!in_ready) $fatal(1,"not ready for dot operand");
                @(negedge clk); in_valid=0;
            end
            if(!out_valid || $signed(y)!==sum) $fatal(1,"incorrect dot product");
            repeat(4) begin
                @(negedge clk);
                if(!out_valid || $signed(y)!==sum || in_ready) $fatal(1,"dot result not held");
            end
            out_ready=1; @(negedge clk); out_ready=0;
        end
        $display("PASS dot4: 64 vectors, source bubbles, result stalls, -128 corner, reset mid-vector");
        $finish;
    end
    initial begin #100000; $fatal(1,"watchdog"); end
endmodule
