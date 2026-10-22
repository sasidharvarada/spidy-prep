// Verilog practice problems. Each one is checked by simulating your design
// next to the reference solution with the same inputs (exhaustive for small
// combinational designs, random cycles for clocked ones).
export const VERILOG_PROBLEMS = [
/* ------------------------------------------------------------ combinational */
{
  id: "v-and", title: "AND gate", level: "Easy", topic: "Combinational",
  desc: `Write a module <code>and_gate</code> with inputs <code>a</code>, <code>b</code> and output <code>y</code>, where <code>y</code> is 1 only when both inputs are 1.`,
  hint: "One continuous assignment is enough: assign y = ... ;",
  spec: { top: "and_gate", kind: "comb" },
  starter: `module and_gate (
  input  a,
  input  b,
  output y
);
  // your code here

endmodule
`,
  solution: `module and_gate (input a, input b, output y);
  assign y = a & b;
endmodule
`},
{
  id: "v-mux2", title: "2-to-1 multiplexer", level: "Easy", topic: "Combinational",
  desc: `Build <code>mux2</code>: when <code>sel</code> is 0, <code>y</code> = <code>d0</code>; when <code>sel</code> is 1, <code>y</code> = <code>d1</code>. All signals are 1 bit.`,
  hint: "The ternary operator reads like a mux: sel ? d1 : d0",
  spec: { top: "mux2", kind: "comb" },
  starter: `module mux2 (
  input  d0, d1, sel,
  output y
);

endmodule
`,
  solution: `module mux2 (input d0, d1, sel, output y);
  assign y = sel ? d1 : d0;
endmodule
`},
{
  id: "v-mux4", title: "4-to-1 multiplexer with case", level: "Easy", topic: "Combinational",
  desc: `Build <code>mux4</code> with a 4-bit input <code>d[3:0]</code>, a 2-bit select <code>sel[1:0]</code> and output <code>y</code> = <code>d[sel]</code>. Write it with an <code>always @(*)</code> block and a <code>case</code> statement (good practice for interviews), declaring <code>y</code> as <code>output reg</code>.`,
  hint: "Every path must assign y, otherwise you infer a latch. A case with all four values (or a default) does that.",
  spec: { top: "mux4", kind: "comb" },
  starter: `module mux4 (
  input      [3:0] d,
  input      [1:0] sel,
  output reg       y
);
  always @(*) begin
    case (sel)
      // ...
    endcase
  end
endmodule
`,
  solution: `module mux4 (input [3:0] d, input [1:0] sel, output reg y);
  always @(*) begin
    case (sel)
      2'd0: y = d[0];
      2'd1: y = d[1];
      2'd2: y = d[2];
      default: y = d[3];
    endcase
  end
endmodule
`},
{
  id: "v-half", title: "Half adder", level: "Easy", topic: "Arithmetic",
  desc: `Build <code>half_adder</code>: add two bits <code>a</code> and <code>b</code>. Output <code>sum</code> and <code>carry</code>.`,
  hint: "sum is 1 when exactly one input is 1. carry is 1 when both are 1.",
  spec: { top: "half_adder", kind: "comb" },
  starter: `module half_adder (
  input  a, b,
  output sum, carry
);

endmodule
`,
  solution: `module half_adder (input a, b, output sum, carry);
  assign sum   = a ^ b;
  assign carry = a & b;
endmodule
`},
{
  id: "v-full", title: "Full adder from two half adders", level: "Easy", topic: "Arithmetic",
  desc: `Build <code>full_adder</code> with inputs <code>a</code>, <code>b</code>, <code>cin</code> and outputs <code>sum</code>, <code>cout</code>.<br>Challenge: write a <code>half_adder</code> module and use <b>two instances</b> of it plus one OR gate. This is exactly how interviewers test hierarchy.`,
  hint: "First half adder adds a and b. Second adds that sum and cin. cout = carry1 | carry2.",
  spec: { top: "full_adder", kind: "comb" },
  starter: `module half_adder (input a, b, output sum, carry);
  assign sum   = a ^ b;
  assign carry = a & b;
endmodule

module full_adder (
  input  a, b, cin,
  output sum, cout
);
  wire s1, c1, c2;
  // half_adder ha1 ( ... );
  // half_adder ha2 ( ... );

endmodule
`,
  solution: `module half_adder (input a, b, output sum, carry);
  assign sum = a ^ b;
  assign carry = a & b;
endmodule
module full_adder (input a, b, cin, output sum, cout);
  wire s1, c1, c2;
  half_adder ha1 (.a(a),  .b(b),   .sum(s1),  .carry(c1));
  half_adder ha2 (.a(s1), .b(cin), .sum(sum), .carry(c2));
  assign cout = c1 | c2;
endmodule
`},
{
  id: "v-add4", title: "4-bit adder with carry", level: "Easy", topic: "Arithmetic",
  desc: `Build <code>adder4</code>: <code>a[3:0] + b[3:0] + cin</code>. Output the 4-bit <code>sum</code> and the carry out <code>cout</code>.`,
  hint: "A concatenation on the left catches the 5th bit: assign {cout, sum} = a + b + cin;",
  spec: { top: "adder4", kind: "comb" },
  starter: `module adder4 (
  input  [3:0] a, b,
  input        cin,
  output [3:0] sum,
  output       cout
);

endmodule
`,
  solution: `module adder4 (input [3:0] a, b, input cin, output [3:0] sum, output cout);
  assign {cout, sum} = a + b + cin;
endmodule
`},
{
  id: "v-dec38", title: "3-to-8 decoder with enable", level: "Easy", topic: "Combinational",
  desc: `Build <code>dec3to8</code>. When <code>en</code> is 1, exactly one bit of <code>y[7:0]</code> is high: bit number <code>a[2:0]</code>. When <code>en</code> is 0, <code>y</code> is all zeros.`,
  hint: "Shift a single 1 left by a: 8'b1 << a.",
  spec: { top: "dec3to8", kind: "comb" },
  starter: `module dec3to8 (
  input  [2:0] a,
  input        en,
  output [7:0] y
);

endmodule
`,
  solution: `module dec3to8 (input [2:0] a, input en, output [7:0] y);
  assign y = en ? (8'b1 << a) : 8'b0;
endmodule
`},
{
  id: "v-prienc", title: "4-to-2 priority encoder", level: "Medium", topic: "Combinational",
  desc: `Build <code>prienc4</code>. Input <code>req[3:0]</code>. Output <code>idx[1:0]</code> = position of the <b>highest</b> set bit, and <code>valid</code> = 1 if any bit is set. When no bit is set, <code>idx</code> must be 0.`,
  hint: "Check from the top: if (req[3]) ... else if (req[2]) ... Use always @(*) and give every output a value in every path.",
  spec: { top: "prienc4", kind: "comb" },
  starter: `module prienc4 (
  input      [3:0] req,
  output reg [1:0] idx,
  output           valid
);

endmodule
`,
  solution: `module prienc4 (input [3:0] req, output reg [1:0] idx, output valid);
  assign valid = |req;
  always @(*) begin
    if      (req[3]) idx = 2'd3;
    else if (req[2]) idx = 2'd2;
    else if (req[1]) idx = 2'd1;
    else             idx = 2'd0;
  end
endmodule
`},
{
  id: "v-cmp", title: "4-bit magnitude comparator", level: "Easy", topic: "Combinational",
  desc: `Build <code>cmp4</code> comparing unsigned <code>a[3:0]</code> and <code>b[3:0]</code>. Outputs: <code>gt</code> (a &gt; b), <code>eq</code> (a == b), <code>lt</code> (a &lt; b). Exactly one is 1 at any time.`,
  hint: "Relational operators give a 1-bit result directly.",
  spec: { top: "cmp4", kind: "comb" },
  starter: `module cmp4 (
  input  [3:0] a, b,
  output gt, eq, lt
);

endmodule
`,
  solution: `module cmp4 (input [3:0] a, b, output gt, eq, lt);
  assign gt = a > b;
  assign eq = a == b;
  assign lt = a < b;
endmodule
`},
{
  id: "v-parity", title: "Even parity generator", level: "Easy", topic: "Combinational",
  desc: `Build <code>parity8</code>. Output <code>p</code> so that <code>{data, p}</code> has an <b>even</b> number of 1s. Input <code>data[7:0]</code>.`,
  hint: "The reduction XOR ^data is 1 when data has an odd number of 1s.",
  spec: { top: "parity8", kind: "comb" },
  starter: `module parity8 (
  input  [7:0] data,
  output p
);

endmodule
`,
  solution: `module parity8 (input [7:0] data, output p);
  assign p = ^data;
endmodule
`},
{
  id: "v-gray", title: "Binary to Gray code", level: "Easy", topic: "Combinational",
  desc: `Build <code>bin2gray</code>: convert a 4-bit binary <code>b[3:0]</code> to Gray code <code>g[3:0]</code>. In Gray code, consecutive values differ by exactly one bit. (FIFO pointers crossing clock domains use this.)`,
  hint: "g = b ^ (b >> 1)",
  spec: { top: "bin2gray", kind: "comb" },
  starter: `module bin2gray (
  input  [3:0] b,
  output [3:0] g
);

endmodule
`,
  solution: `module bin2gray (input [3:0] b, output [3:0] g);
  assign g = b ^ (b >> 1);
endmodule
`},
{
  id: "v-seg7", title: "Hex to 7-segment decoder", level: "Medium", topic: "Combinational",
  desc: `Build <code>hex7seg</code>. Input <code>x[3:0]</code> (0-F), output <code>seg[6:0]</code> for a common-cathode display (1 = segment on). Bit order: <code>seg[0]</code>=a, <code>seg[1]</code>=b, ... <code>seg[6]</code>=g.
<pre class="spec">   aaa
  f   b
   ggg
  e   c
   ddd</pre>
Digits: 0 1 2 3 4 5 6 7 8 9 A b C d E F (b and d are lowercase shapes).`,
  hint: "Use a case on x. For example 0 lights a,b,c,d,e,f = 7'b0111111.",
  spec: { top: "hex7seg", kind: "comb" },
  starter: `module hex7seg (
  input      [3:0] x,
  output reg [6:0] seg   // {g,f,e,d,c,b,a}
);
  always @(*) begin
    case (x)
      4'h0: seg = 7'b0111111;
      // ...
      default: seg = 7'b0000000;
    endcase
  end
endmodule
`,
  solution: `module hex7seg (input [3:0] x, output reg [6:0] seg);
  always @(*) begin
    case (x)
      4'h0: seg = 7'h3F; 4'h1: seg = 7'h06; 4'h2: seg = 7'h5B; 4'h3: seg = 7'h4F;
      4'h4: seg = 7'h66; 4'h5: seg = 7'h6D; 4'h6: seg = 7'h7D; 4'h7: seg = 7'h07;
      4'h8: seg = 7'h7F; 4'h9: seg = 7'h6F; 4'hA: seg = 7'h77; 4'hB: seg = 7'h7C;
      4'hC: seg = 7'h39; 4'hD: seg = 7'h5E; 4'hE: seg = 7'h79; default: seg = 7'h71;
    endcase
  end
endmodule
`},
{
  id: "v-alu", title: "4-bit ALU with zero flag", level: "Medium", topic: "Arithmetic",
  desc: `Build <code>alu4</code> with <code>a[3:0]</code>, <code>b[3:0]</code>, <code>op[1:0]</code>. Output <code>y[3:0]</code> and <code>zero</code> (1 when y is 0).
<table class="spec"><tr><th>op</th><th>y</th></tr><tr><td>00</td><td>a + b (drop the carry)</td></tr><tr><td>01</td><td>a - b (wraps around)</td></tr><tr><td>10</td><td>a &amp; b</td></tr><tr><td>11</td><td>a | b</td></tr></table>`,
  hint: "case (op) inside always @(*), then assign zero = (y == 4'd0);",
  spec: { top: "alu4", kind: "comb" },
  starter: `module alu4 (
  input      [3:0] a, b,
  input      [1:0] op,
  output reg [3:0] y,
  output           zero
);

endmodule
`,
  solution: `module alu4 (input [3:0] a, b, input [1:0] op, output reg [3:0] y, output zero);
  always @(*) begin
    case (op)
      2'b00: y = a + b;
      2'b01: y = a - b;
      2'b10: y = a & b;
      default: y = a | b;
    endcase
  end
  assign zero = (y == 4'd0);
endmodule
`},
{
  id: "v-popcnt", title: "Count the ones", level: "Medium", topic: "Combinational",
  desc: `Build <code>popcount8</code>: output <code>n[3:0]</code> = how many bits of <code>d[7:0]</code> are 1. Try a <code>for</code> loop inside <code>always @(*)</code> - it unrolls into an adder tree.`,
  hint: "Start with n = 0; then for (i=0; i<8; i=i+1) n = n + d[i]; Declare integer i;",
  spec: { top: "popcount8", kind: "comb" },
  starter: `module popcount8 (
  input      [7:0] d,
  output reg [3:0] n
);
  integer i;

endmodule
`,
  solution: `module popcount8 (input [7:0] d, output reg [3:0] n);
  integer i;
  always @(*) begin
    n = 4'd0;
    for (i = 0; i < 8; i = i + 1)
      n = n + d[i];
  end
endmodule
`},
/* ------------------------------------------------------------ sequential */
{
  id: "v-dff", title: "D flip-flop with synchronous reset", level: "Easy", topic: "Sequential",
  desc: `Build <code>dff_sync</code>. On every rising edge of <code>clk</code>: if <code>rst</code> is 1, <code>q</code> becomes 0; otherwise <code>q</code> takes <code>d</code>. Reset only acts on a clock edge (synchronous).`,
  hint: "always @(posedge clk) with non-blocking <= assignments.",
  spec: { top: "dff_sync", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 40, midReset: true },
  starter: `module dff_sync (
  input      clk, rst, d,
  output reg q
);

endmodule
`,
  solution: `module dff_sync (input clk, rst, d, output reg q);
  always @(posedge clk) begin
    if (rst) q <= 1'b0;
    else     q <= d;
  end
endmodule
`},
{
  id: "v-dffa", title: "D flip-flop with asynchronous reset", level: "Easy", topic: "Sequential",
  desc: `Build <code>dff_async</code> with an <b>active-low asynchronous</b> reset <code>rst_n</code>: as soon as <code>rst_n</code> goes 0, <code>q</code> becomes 0 - without waiting for the clock. Otherwise <code>q</code> takes <code>d</code> on the rising edge of <code>clk</code>.`,
  hint: "Put the reset edge in the sensitivity list: always @(posedge clk or negedge rst_n).",
  spec: { top: "dff_async", kind: "seq", clk: "clk", reset: { name: "rst_n", active: 0 }, cycles: 40, midReset: true, bias: { d: 0.8 } },
  starter: `module dff_async (
  input      clk, rst_n, d,
  output reg q
);

endmodule
`,
  solution: `module dff_async (input clk, rst_n, d, output reg q);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 1'b0;
    else        q <= d;
  end
endmodule
`},
{
  id: "v-cnt", title: "4-bit counter with enable", level: "Easy", topic: "Sequential",
  desc: `Build <code>counter4</code>: on each rising edge, if <code>rst</code> is 1 the count goes to 0; else if <code>en</code> is 1 the count goes up by 1 (15 wraps to 0). Output <code>count[3:0]</code>.`,
  hint: "count <= count + 1'b1; wraps by itself because count is 4 bits.",
  spec: { top: "counter4", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 50, bias: { en: 0.8 } },
  starter: `module counter4 (
  input            clk, rst, en,
  output reg [3:0] count
);

endmodule
`,
  solution: `module counter4 (input clk, rst, en, output reg [3:0] count);
  always @(posedge clk) begin
    if (rst)     count <= 4'd0;
    else if (en) count <= count + 1'b1;
  end
endmodule
`},
{
  id: "v-updown", title: "Up/down counter with load", level: "Medium", topic: "Sequential",
  desc: `Build <code>updown4</code>. On each rising edge, with this priority:
<ol><li><code>rst</code> = 1: <code>q</code> = 0</li><li>else <code>load</code> = 1: <code>q</code> = <code>d[3:0]</code></li><li>else <code>up</code> = 1: <code>q</code> + 1, otherwise <code>q</code> - 1 (both wrap)</li></ol>`,
  hint: "An if / else if / else chain matches the priority list exactly.",
  spec: { top: "updown4", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 50, bias: { load: 0.15 } },
  starter: `module updown4 (
  input            clk, rst, load, up,
  input      [3:0] d,
  output reg [3:0] q
);

endmodule
`,
  solution: `module updown4 (input clk, rst, load, up, input [3:0] d, output reg [3:0] q);
  always @(posedge clk) begin
    if (rst)       q <= 4'd0;
    else if (load) q <= d;
    else if (up)   q <= q + 1'b1;
    else           q <= q - 1'b1;
  end
endmodule
`},
{
  id: "v-sipo", title: "Shift register (serial in, parallel out)", level: "Easy", topic: "Sequential",
  desc: `Build <code>sipo4</code>. On each rising edge, shift <code>q[3:0]</code> left by one and put <code>sin</code> into <code>q[0]</code>. <code>rst</code> (synchronous, active high) clears it.`,
  hint: "q <= {q[2:0], sin};",
  spec: { top: "sipo4", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 40 },
  starter: `module sipo4 (
  input            clk, rst, sin,
  output reg [3:0] q
);

endmodule
`,
  solution: `module sipo4 (input clk, rst, sin, output reg [3:0] q);
  always @(posedge clk) begin
    if (rst) q <= 4'b0;
    else     q <= {q[2:0], sin};
  end
endmodule
`},
{
  id: "v-lfsr", title: "4-bit LFSR", level: "Medium", topic: "Sequential",
  desc: `Build <code>lfsr4</code>, a maximal-length 4-bit LFSR. Reset (synchronous, active high) loads <code>q</code> = <code>4'b0001</code>. Each rising edge: <code>q</code> shifts left and the new bit 0 is <code>q[3] ^ q[2]</code>. It cycles through all 15 non-zero values.`,
  hint: "q <= {q[2:0], q[3] ^ q[2]};  Note: an all-zero LFSR is stuck forever - that is why reset loads 1.",
  spec: { top: "lfsr4", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 40 },
  starter: `module lfsr4 (
  input            clk, rst,
  output reg [3:0] q
);

endmodule
`,
  solution: `module lfsr4 (input clk, rst, output reg [3:0] q);
  always @(posedge clk) begin
    if (rst) q <= 4'b0001;
    else     q <= {q[2:0], q[3] ^ q[2]};
  end
endmodule
`},
{
  id: "v-edge", title: "Rising-edge detector", level: "Medium", topic: "Sequential",
  desc: `Build <code>rise_detect</code>. Output <code>pulse</code> is 1 for exactly one clock cycle after <code>sig</code> goes from 0 to 1 (as seen at two consecutive rising clock edges). Keep the previous value of <code>sig</code> in a register <code>prev</code>; <code>rst</code> clears it.<br><code>pulse</code> = <code>sig</code> sampled now is 1 and <code>prev</code> is 0, registered (so <code>pulse</code> is itself a flip-flop output).`,
  hint: "always @(posedge clk) begin prev <= sig; pulse <= sig & ~prev; end",
  spec: { top: "rise_detect", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 50 },
  starter: `module rise_detect (
  input      clk, rst, sig,
  output reg pulse
);
  reg prev;

endmodule
`,
  solution: `module rise_detect (input clk, rst, sig, output reg pulse);
  reg prev;
  always @(posedge clk) begin
    if (rst) begin
      prev  <= 1'b0;
      pulse <= 1'b0;
    end else begin
      prev  <= sig;
      pulse <= sig & ~prev;
    end
  end
endmodule
`},
{
  id: "v-tick", title: "Tick every 3rd clock", level: "Medium", topic: "Sequential",
  desc: `Build <code>tick3</code>: a counter that goes 0, 1, 2, 0, 1, 2 ... (output <code>cnt[1:0]</code>), and <code>tick</code> = 1 (combinational) whenever <code>cnt</code> is 2. Synchronous active-high <code>rst</code> sets <code>cnt</code> to 0. This is how slow enables are made from a fast clock.`,
  hint: "if (cnt == 2) cnt <= 0; else cnt <= cnt + 1;  and  assign tick = (cnt == 2'd2);",
  spec: { top: "tick3", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 30 },
  starter: `module tick3 (
  input            clk, rst,
  output reg [1:0] cnt,
  output           tick
);

endmodule
`,
  solution: `module tick3 (input clk, rst, output reg [1:0] cnt, output tick);
  always @(posedge clk) begin
    if (rst || cnt == 2'd2) cnt <= 2'd0;
    else                    cnt <= cnt + 1'b1;
  end
  assign tick = (cnt == 2'd2);
endmodule
`},
{
  id: "v-sync", title: "2-flop synchronizer", level: "Easy", topic: "Clock domains",
  desc: `Build <code>sync2</code>: pass the asynchronous input <code>async_in</code> through two flip-flops clocked by <code>clk</code>. Output <code>sync_out</code> is the second flop. No reset. This is the standard fix for metastability on single-bit signals.`,
  hint: "reg meta; always @(posedge clk) begin meta <= async_in; sync_out <= meta; end",
  spec: { top: "sync2", kind: "seq", clk: "clk", cycles: 40 },
  starter: `module sync2 (
  input      clk, async_in,
  output reg sync_out
);
  reg meta;

endmodule
`,
  solution: `module sync2 (input clk, async_in, output reg sync_out);
  reg meta;
  always @(posedge clk) begin
    meta     <= async_in;
    sync_out <= meta;
  end
endmodule
`},
{
  id: "v-1011", title: "Sequence detector 1011 (Mealy, overlapping)", level: "Hard", topic: "FSM",
  desc: `Build <code>det1011</code>. A serial bit <code>x</code> arrives, one per clock. Output <code>z</code> is 1 <b>during the cycle</b> in which the current <code>x</code> completes the pattern <code>1011</code> (Mealy: <code>z</code> depends on the state and <code>x</code>). Overlapping is allowed: in <code>1011011</code>, <code>z</code> fires twice.<br>Use a state register (synchronous active-high <code>rst</code> to the idle state), a next-state block and an output assignment.`,
  hint: "States by how much of the pattern you have seen: S0 (nothing), S1 (1), S2 (10), S3 (101). From S3, x=1 means found: z=1 and go to S1 (the last 1 can start a new pattern).",
  spec: { top: "det1011", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 80 },
  starter: `module det1011 (
  input  clk, rst, x,
  output z
);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;

  // state register

  // next-state logic

  // Mealy output
  assign z = 1'b0;
endmodule
`,
  solution: `module det1011 (input clk, rst, x, output z);
  localparam S0 = 2'd0, S1 = 2'd1, S2 = 2'd2, S3 = 2'd3;
  reg [1:0] state, next;
  always @(posedge clk)
    if (rst) state <= S0; else state <= next;
  always @(*) begin
    case (state)
      S0: next = x ? S1 : S0;
      S1: next = x ? S1 : S2;
      S2: next = x ? S3 : S0;
      default: next = x ? S1 : S2;
    endcase
  end
  assign z = (state == S3) && x;
endmodule
`},
{
  id: "v-traffic", title: "Traffic light controller", level: "Hard", topic: "FSM",
  desc: `Build <code>traffic</code>. Output <code>light[1:0]</code>: 0 = green, 1 = yellow, 2 = red. After a synchronous active-high <code>rst</code> the light is green and its timer is 0. Then it stays <b>green for 4 clocks, yellow for 2, red for 3</b>, and repeats.<br>Exact rule: keep a counter <code>t</code>. Each clock, if <code>t</code> has reached (time of this colour - 1), move to the next colour and set <code>t</code> = 0; otherwise <code>t</code> + 1.`,
  hint: "Two registers: light and t. A case on light picks the limit: green 3, yellow 1, red 2.",
  spec: { top: "traffic", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 40 },
  starter: `module traffic (
  input            clk, rst,
  output reg [1:0] light
);
  reg [2:0] t;

endmodule
`,
  solution: `module traffic (input clk, rst, output reg [1:0] light);
  reg [2:0] t;
  reg [2:0] limit;
  always @(*) begin
    case (light)
      2'd0: limit = 3'd3;
      2'd1: limit = 3'd1;
      default: limit = 3'd2;
    endcase
  end
  always @(posedge clk) begin
    if (rst) begin
      light <= 2'd0; t <= 3'd0;
    end else if (t == limit) begin
      t <= 3'd0;
      light <= (light == 2'd2) ? 2'd0 : light + 1'b1;
    end else
      t <= t + 1'b1;
  end
endmodule
`},
{
  id: "v-regfile", title: "Register file (4 x 8)", level: "Medium", topic: "Memory",
  desc: `Build <code>regfile</code>: four 8-bit registers. On the rising edge, if <code>we</code> is 1, write <code>wdata</code> into register <code>waddr[1:0]</code>. Two read ports are combinational: <code>rdata1</code> = register <code>raddr1</code>, <code>rdata2</code> = register <code>raddr2</code>. All registers start at 0 and there is no reset.`,
  hint: "reg [7:0] r [0:3];  then  assign rdata1 = r[raddr1];",
  spec: { top: "regfile", kind: "seq", clk: "clk", cycles: 60 },
  starter: `module regfile (
  input        clk, we,
  input  [1:0] waddr, raddr1, raddr2,
  input  [7:0] wdata,
  output [7:0] rdata1, rdata2
);
  reg [7:0] r [0:3];

endmodule
`,
  solution: `module regfile (input clk, we, input [1:0] waddr, raddr1, raddr2, input [7:0] wdata, output [7:0] rdata1, rdata2);
  reg [7:0] r [0:3];
  always @(posedge clk)
    if (we) r[waddr] <= wdata;
  assign rdata1 = r[raddr1];
  assign rdata2 = r[raddr2];
endmodule
`},
{
  id: "v-fifo", title: "Synchronous FIFO (depth 4)", level: "Hard", topic: "Memory",
  desc: `Build <code>fifo4</code>: 8-bit data, 4 entries, one clock, synchronous active-high <code>rst</code> (empties it).
<ul><li>A push happens when <code>push</code> is 1 and the FIFO is not <code>full</code>. A pop happens when <code>pop</code> is 1 and it is not <code>empty</code>. Both may happen in the same cycle.</li>
<li><code>dout</code> always shows the oldest entry (show-ahead, combinational read). When empty its value does not matter but must equal <code>mem[rd_ptr]</code>.</li>
<li><code>full</code> when it holds 4 entries; <code>empty</code> when it holds 0.</li></ul>Use 2-bit read/write pointers and a 3-bit count. Memory and pointers start at 0.`,
  hint: "wire do_push = push && !full; wire do_pop = pop && !empty;  count changes by +1, -1 or 0.",
  spec: { top: "fifo4", kind: "seq", clk: "clk", reset: { name: "rst", active: 1 }, cycles: 120, bias: { push: 0.6, pop: 0.45 }, midReset: true },
  starter: `module fifo4 (
  input        clk, rst, push, pop,
  input  [7:0] din,
  output [7:0] dout,
  output       full, empty
);
  reg [7:0] mem [0:3];
  reg [1:0] wr_ptr, rd_ptr;
  reg [2:0] count;

endmodule
`,
  solution: `module fifo4 (input clk, rst, push, pop, input [7:0] din, output [7:0] dout, output full, empty);
  reg [7:0] mem [0:3];
  reg [1:0] wr_ptr, rd_ptr;
  reg [2:0] count;
  wire do_push = push && !full;
  wire do_pop  = pop && !empty;
  always @(posedge clk) begin
    if (rst) begin
      wr_ptr <= 2'd0; rd_ptr <= 2'd0; count <= 3'd0;
    end else begin
      if (do_push) begin
        mem[wr_ptr] <= din;
        wr_ptr <= wr_ptr + 1'b1;
      end
      if (do_pop) rd_ptr <= rd_ptr + 1'b1;
      count <= count + do_push - do_pop;
    end
  end
  assign dout  = mem[rd_ptr];
  assign full  = (count == 3'd4);
  assign empty = (count == 3'd0);
endmodule
`},
];
