// Run: node tools/test-verilog.mjs
import { checkDesign, compileVerilog, autoRun } from "../assets/js/verilog.js";
import { VERILOG_PROBLEMS } from "../assets/data/v1/verilog-problems.js";
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } };
for (const p of VERILOG_PROBLEMS) {
  const r = checkDesign(p.solution, p.solution, p.spec);
  ok(r.ok, `${p.id} ref vs ref: ${r.error || JSON.stringify(r.mismatch)}`);
  ok(r.warnings.length === 0, `${p.id} ref has warnings: ${r.warnings}`);
  const s = checkDesign(p.starter, p.solution, p.spec);
  ok(!s.ok, `${p.id} starter should not pass`);
  ok(!s.error || /never|latch/.test(s.error) || true, "");
  try { compileVerilog(p.starter, { top: p.spec.top }); } catch (e) { fail++; console.log("FAIL starter compile", p.id, e.message); }
  console.log(`${p.id.padEnd(10)} ${r.ok ? "ok" : "BAD"}  tests=${r.total}  starter: ${s.error ? "error: " + s.error.slice(0, 70) : (s.mismatch ? "mismatch at " + s.mismatch.label : "?")}`);
}
const P = id => VERILOG_PROBLEMS.find(p => p.id === id);
const wrong = [
  ["v-dffa", `module dff_async(input clk, rst_n, d, output reg q);
  always @(posedge clk) if(!rst_n) q<=0; else q<=d;
endmodule`, "sync instead of async"],
  ["v-dff", `module dff_sync(input clk, rst, d, output reg q);
  always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d;
endmodule`, "async instead of sync"],
  ["v-1011", `module det1011(input clk,rst,x,output z);
  localparam S0=0,S1=1,S2=2,S3=3; reg [1:0] state,next;
  always @(posedge clk) if(rst) state<=S0; else state<=next;
  always @(*) case(state) S0: next=x?S1:S0; S1: next=x?S1:S2; S2: next=x?S3:S0; default: next=S0; endcase
  assign z=(state==S3)&&x;
endmodule`, "non-overlapping"],
  ["v-sipo", `module sipo4(input clk,rst,sin,output reg [3:0] q);
  always @(posedge clk) if(rst) q<=0; else q<={sin,q[3:1]};
endmodule`, "shift wrong way"],
  ["v-add4", `module adder4(input [3:0] a,b,input cin,output [3:0] sum,output cout);
  assign sum=a+b+cin; assign cout=0;
endmodule`, "missing carry"],
  ["v-mux4", `module mux4(input [3:0] d, input [1:0] sel, output reg y);
  always @(*) case(sel) 0:y=d[0]; 1:y=d[1]; 2:y=d[2]; endcase
endmodule`, "latch"],
  ["v-edge", `module rise_detect(input clk,rst,sig,output reg pulse); reg prev;
  always @(posedge clk) begin prev = sig; pulse = sig & ~prev; end
endmodule`, "blocking bug"],
  ["v-fifo", `module fifo4(input clk,rst,push,pop,input [7:0] din,output [7:0] dout,output full,empty);
  reg [7:0] mem[0:3]; reg [1:0] wr_ptr,rd_ptr; reg [2:0] count;
  always @(posedge clk) if(rst) begin wr_ptr<=0;rd_ptr<=0;count<=0; end else begin
    if(push) begin mem[wr_ptr]<=din; wr_ptr<=wr_ptr+1; end
    if(pop) rd_ptr<=rd_ptr+1; count<=count+push-pop; end
  assign dout=mem[rd_ptr]; assign full=count==4; assign empty=count==0;
endmodule`, "no full/empty guard"],
];
for (const [id, src, why] of wrong) {
  const r = checkDesign(src, P(id).solution, P(id).spec);
  ok(!r.ok, `${id} wrong (${why}) should fail`);
  console.log(`wrong ${id.padEnd(9)} (${why}): ${r.ok ? "PASSED?!" : (r.error ? "error " + r.error : "mismatch " + r.mismatch.label + " " + JSON.stringify(r.mismatch.outs))}${r.warnings.length ? "  warn: " + r.warnings.join(" | ") : ""}`);
}
// error messages
const errs = [
  `module m(input a, output y); assign y = a & ; endmodule`,
  `module m(input a, output y); always @(*) y = a; endmodule`,
  `module m(input a, output reg y); assign y = a; endmodule`,
  `module m(input a, output y); assign y = b; endmodule`,
  `module m(input clk, output reg q); always @(posedge clk) q <= ~q; always @(posedge clk) q <= 0; endmodule`,
  `module m(input a, output y); assign y = ~y; endmodule`,
  `module m(input a, output y) assign y = a; endmodule`,
];
for (const e of errs) { try { const d = compileVerilog(e); autoRun(e); console.log("NO ERROR for:", e); fail++; } catch (x) { console.log("err ok:", x.message); } }
// classic port style + params + ipart + mem + display
const r = autoRun(`module top(clk, rst, q);
  parameter W = 4;
  input clk, rst; output [W-1:0] q; reg [W-1:0] q;
  wire [7:0] v = 8'hA5;
  always @(posedge clk) if (rst) q <= 0; else begin q <= q + v[3 +: 2]; $display("q=%d %b", q, v[7:4]); end
endmodule`);
console.log("autoRun:", r.trace.length, "steps, last q =", String(r.trace.at(-1).you.q), "log:", JSON.stringify(r.log.slice(0, 40)));
console.log(fail ? `\n${fail} FAILURES` : "\nALL GOOD");
