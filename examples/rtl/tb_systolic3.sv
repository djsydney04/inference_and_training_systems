`timescale 1ns/1ps
module tb_systolic3;
    reg clk=0;
    always #5 clk=~clk;
    reg rst=1;
    reg [23:0] a_edge=0,b_edge=0;
    reg [2:0] a_valid=0,b_valid=0;
    wire [179:0] results;
    systolic3 dut(clk,rst,a_edge,b_edge,a_valid,b_valid,results);
    integer A[0:2][0:2],B[0:2][0:2];
    integer tile,i,j,k,t,expected,observed,checks=0;
    initial begin
        for(tile=0;tile<18;tile=tile+1) begin
            @(negedge clk); rst=1; a_valid=0; b_valid=0;
            @(negedge clk); rst=0;
            for(i=0;i<3;i=i+1) for(j=0;j<3;j=j+1) begin
                if(tile==0) begin
                    A[i][j]=i*3+j+1;
                    B[i][j]=(i==j)?2:((j==(i+1)%3)?1:0);
                end else if(tile==1) begin
                    A[i][j]=-128; B[i][j]=-128;
                end else begin
                    A[i][j]=(tile*31+i*11+j*79)%256-128;
                    B[i][j]=(tile*13+i*91+j*27)%256-128;
                end
            end
            for(t=0;t<10;t=t+1) begin
                // Row/column skew; inactive edge data is deliberately nonzero.
                a_edge=24'h7f7f7f; b_edge=24'h808080;
                a_valid=0; b_valid=0;
                for(i=0;i<3;i=i+1) begin
                    k=t-i;
                    if(k>=0 && k<3) begin
                        a_edge[8*i +: 8]=A[i][k]; a_valid[i]=1;
                        b_edge[8*i +: 8]=B[k][i]; b_valid[i]=1;
                    end
                end
                @(posedge clk); #1;
                for(i=0;i<3;i=i+1) for(j=0;j<3;j=j+1) begin
                    expected=0;
                    for(k=0;k<3;k=k+1)
                        if(k+i+j<=t) expected=expected+A[i][k]*B[k][j];
                    observed=$signed(results[20*(i*3+j) +: 20]);
                    if(observed!==expected)
                        $fatal(1,"tile=%0d cycle=%0d PE(%0d,%0d): got=%0d expected=%0d",tile,t,i,j,observed,expected);
                    checks=checks+1;
                end
                @(negedge clk);
            end
        end
        $display("PASS systolic3: %0d per-cycle PE checks; skew, signed corners, reset, invalid padding",checks);
        $finish;
    end
    initial begin #100000; $fatal(1,"watchdog"); end
endmodule
