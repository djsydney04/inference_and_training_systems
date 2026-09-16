`timescale 1ns/1ps
module tb_elastic_mac;
    reg clk=0;
    always #5 clk=~clk;
    reg rst=1, in_valid=0, out_ready=0;
    reg signed [7:0] a=0,b=0;
    reg signed [19:0] c=0;
    wire in_ready, out_valid;
    wire signed [20:0] y;
    elastic_mac dut(clk,rst,in_valid,in_ready,a,b,c,out_valid,out_ready,y);
    integer expected[0:8191];
    integer head=0, tail=0, accepted=0, received=0, simultaneous=0;
    integer cycle;
    reg [31:0] rng=32'hcafe1234;
    reg held=0;
    reg signed [20:0] held_y;
    reg input_waiting=0, input_held=0;
    reg signed [7:0] held_a,held_b;
    reg signed [19:0] held_c;

    // Check pre-edge transfers. DUT nonblocking assignments commit afterward.
    always @(posedge clk) begin
        if (rst) begin
            head=0; tail=0; held=0; input_held=0;
        end else begin
            if (input_held && (!in_valid || a !== held_a || b !== held_b || c !== held_c))
                $fatal(1,"testbench source changed its stalled offer");
            input_held=in_valid && !in_ready;
            held_a=a; held_b=b; held_c=c;
            if (held && (!out_valid || y !== held_y))
                $fatal(1,"output changed while stalled");
            if (out_valid && out_ready) begin
                if (head>=tail) $fatal(1,"unexpected/duplicated output");
                if ($signed(y) !== expected[head])
                    $fatal(1,"value mismatch: got %0d expected %0d",$signed(y),expected[head]);
                head=head+1; received=received+1;
            end
            if (in_valid && in_ready) begin
                expected[tail]=$signed(a)*$signed(b)+$signed(c);
                tail=tail+1; accepted=accepted+1;
                input_waiting=0;
            end
            if (in_valid && in_ready && out_valid && out_ready) simultaneous=simultaneous+1;
            held=out_valid && !out_ready;
            held_y=y;
        end
    end

    initial begin
        repeat(3) @(negedge clk);
        rst=0;
        // Includes source bubbles, long consumer stalls, signed corners and reset.
        for (cycle=0; cycle<1800; cycle=cycle+1) begin
            @(negedge clk);
            rng={rng[30:0],rng[31]^rng[21]^rng[1]^rng[0]};
            if (cycle==701) begin
                rst=1; in_valid=0; input_waiting=0;
            end else if (cycle==702) begin
                rst=0;
            end else if (!rst) begin
                out_ready=(cycle%31>=9) && rng[4];
                if (!input_waiting) begin
                    in_valid=rng[0] || rng[3];
                    if (cycle<256) begin
                        // Exercise full operand range against negative extreme.
                        a=cycle-128; b=-128; c=(cycle%2) ? 524287 : -524288;
                    end else begin
                        a=rng[7:0]; b=rng[15:8]; c=rng[31:12];
                    end
                    input_waiting=in_valid;
                end
            end
        end
        @(negedge clk); out_ready=1;
        // Preserve an already offered token until the source handshake completes.
        if (input_waiting) begin
            while (input_waiting) @(negedge clk);
        end
        in_valid=0;
        repeat(5) @(negedge clk);
        if (head!=tail || out_valid) $fatal(1,"pipeline failed to drain");
        if (received<200 || simultaneous<20) $fatal(1,"insufficient traffic coverage");
        $display("PASS elastic MAC: %0d accepted, %0d consumed, %0d simultaneous; reset flush, stalls, signed arithmetic",accepted,received,simultaneous);
        $finish;
    end
    initial begin #100000; $fatal(1,"watchdog"); end
endmodule
