// VLSI course - original lessons written for Spidy Prep.
export const VLSI_COURSE = {
  id: "vlsi", title: "VLSI & Digital Design", color: "#9333EA",
  intro: "Digital logic to CMOS transistors, Verilog RTL, timing and the chip design flow - the path from 'what is a gate' to RTL and STA interviews.",
  modules: [
{
  id: "vl-dig", title: "Digital logic", lessons: [
{
  id: "v-num", title: "Number systems and two's complement", mins: 9,
  sum: "Binary, hex, signed numbers, overflow and Gray code - the arithmetic every RTL engineer uses daily.",
  body: `
<h3>Bases</h3>
<p>Hex groups 4 bits per digit, octal 3. Convert binary to hex by splitting into nibbles from the right: <code>1011 0111</code> = <code>0xB7</code> = 183.</p>
<h3>Two's complement</h3>
<p>To negate: invert all bits and add 1. For N bits the range is -2<sup>N-1</sup> to 2<sup>N-1</sup> - 1 (8 bits: -128 to 127). The MSB has weight -2<sup>N-1</sup>, so <code>1111 1111</code> = -128 + 127 = -1.</p>
<p>The beauty: the same adder handles signed and unsigned numbers. Subtraction is A + (~B) + 1, which is why an adder with an XOR on B and carry-in = 1 does subtraction.</p>
<h3>Overflow</h3>
<ul><li>Unsigned overflow: a carry out of the MSB.</li>
<li>Signed overflow: adding two numbers of the <b>same sign</b> gives a result of the <b>other sign</b>. Equivalently, carry into the MSB ≠ carry out of the MSB.</li></ul>
<p>Example in 8 bits: 100 + 50 = 150, which is above 127, so the result reads as -106: signed overflow (but no unsigned overflow).</p>
<h3>Sign extension</h3>
<p>To widen a signed number, copy the sign bit: 4-bit <code>1010</code> (-6) becomes 8-bit <code>1111 1010</code>. In Verilog: <code>{{4{x[3]}}, x}</code>.</p>
<h3>Gray code</h3>
<p>Consecutive values differ in exactly one bit: 00, 01, 11, 10. Conversion: <code>g = b ^ (b &gt;&gt; 1)</code>. Used for rotary encoders, K-map ordering, and async FIFO pointers (a pointer sampled mid-change is off by at most one).</p>
<h3>BCD</h3>
<p>Each decimal digit in 4 bits: 59 = <code>0101 1001</code>. Wasteful but convenient for displays.</p>`,
  takeaway: "Negate = invert + 1; N bits hold -2^(N-1)..2^(N-1)-1. Signed overflow: same-sign inputs, different-sign result. Gray code changes one bit per step: g = b ^ (b >> 1).",
  quiz: [
    { q: "-45 in 8-bit two's complement?", o: ["0xD3", "0xAD", "0x2D", "0xD2"], a: 0, why: "45 = 0x2D; invert = 0xD2; +1 = 0xD3." },
    { q: "8-bit signed: 0x70 + 0x20 = ?", o: ["0x90 with signed overflow", "0x90 no overflow", "0x50", "Carry out"], a: 0, why: "112 + 32 = 144 > 127: two positives gave a negative-looking result." },
    { q: "Gray code of binary 0110?", o: ["0101", "0111", "0011", "1010"], a: 0, why: "0110 ^ 0011 = 0101." },
  ],
  practice: ["v-gray", "c-gray"],
},
{
  id: "v-gates", title: "Logic gates and Boolean algebra", mins: 11,
  sum: "The seven gates, Boolean laws, De Morgan, and why NAND and NOR are universal.",
  demo: "gate",
  body: `
<table><tr><th>Gate</th><th>Expression</th><th>Output is 1 when</th></tr>
<tr><td>AND</td><td>A·B</td><td>all inputs are 1</td></tr><tr><td>OR</td><td>A+B</td><td>any input is 1</td></tr>
<tr><td>NOT</td><td>A'</td><td>input is 0</td></tr><tr><td>NAND</td><td>(A·B)'</td><td>any input is 0</td></tr>
<tr><td>NOR</td><td>(A+B)'</td><td>all inputs are 0</td></tr><tr><td>XOR</td><td>A⊕B</td><td>an odd number of inputs is 1</td></tr>
<tr><td>XNOR</td><td>(A⊕B)'</td><td>inputs are equal (2-input)</td></tr></table>
<h3>Laws you use constantly</h3>
<ul><li>Identity: A + 0 = A, A·1 = A. Null: A + 1 = 1, A·0 = 0.</li>
<li>Idempotent: A + A = A. Complement: A + A' = 1, A·A' = 0.</li>
<li>Absorption: A + AB = A, A(A + B) = A.</li>
<li>Useful: A + A'B = A + B.</li>
<li>Consensus: AB + A'C + BC = AB + A'C (the BC term is redundant).</li></ul>
<h3>De Morgan</h3>
<div class="formula">(A·B)' = A' + B' &nbsp;&nbsp;&nbsp; (A + B)' = A'·B'</div>
<p>"Break the bar, change the sign." It converts AND-OR logic into NAND-NAND logic, which is how real CMOS logic is often built.</p>
<h3>Universal gates</h3>
<p>Any Boolean function can be made from NAND alone (or NOR alone):</p>
<ul><li>NOT A = NAND(A, A)</li><li>A·B = NOT(NAND(A,B)) - 2 NANDs</li><li>A + B = NAND(A', B') - 3 NANDs</li><li>A ⊕ B = 4 NANDs (a favourite puzzle - try it in the Circuit Lab)</li></ul>
<p>In CMOS, NAND is preferred over NOR because its series transistors are the fast NMOS ones (more in the CMOS module).</p>`,
  takeaway: "Know every gate's truth table, absorption and De Morgan. NAND and NOR are universal: NOT = 1 NAND, AND = 2, OR = 3, XOR = 4.",
  quiz: [
    { q: "Simplify A + A'B.", o: ["A", "B", "A + B", "AB"], a: 2, why: "A + A'B = (A + A')(A + B) = A + B." },
    { q: "(A + B)' equals...", o: ["A' + B'", "A'B'", "AB", "A ⊕ B"], a: 1, why: "De Morgan: NOR = AND of complements." },
    { q: "Minimum NAND gates for a 2-input XOR?", o: ["3", "4", "5", "6"], a: 1, why: "The classic 4-NAND XOR." },
  ],
  practice: ["k-not-nand", "k-and-nand", "k-or-nand", "k-xor-nand", "k-nand-nor", "v-and"],
},
{
  id: "v-kmap", title: "K-maps and minimisation", mins: 12,
  sum: "SOP and POS, grouping 1s, don't-cares, and static hazards.",
  demo: "kmap",
  body: `
<h3>Canonical forms</h3>
<p>A <b>minterm</b> is an AND term containing every variable once; the function is 1 for it. <b>Sum of products (SOP)</b> ORs minterms: F = Σm(1,3,5). A <b>maxterm</b> is an OR term that is 0 for one input combination; <b>product of sums (POS)</b> ANDs them: F = ΠM(0,2,4,6,7). Σm and ΠM of the same function list complementary numbers.</p>
<h3>The K-map</h3>
<p>Cells are arranged in <b>Gray-code order</b> (00, 01, 11, 10), so neighbouring cells differ in one variable - and the edges wrap around. Group adjacent 1s in rectangles of 1, 2, 4, 8 or 16 cells. Each group becomes one product term; variables that change inside the group drop out.</p>
<ul><li>Make groups as <b>large</b> as possible (fewer literals).</li><li>Use as <b>few</b> groups as possible.</li>
<li>Groups may overlap; every 1 must be covered.</li><li>Corners of a 4-variable map are all adjacent.</li></ul>
<p>Example: F(A,B,C) = Σm(1,3,5,7) is every cell with C = 1, one group of four: <b>F = C</b>.</p>
<h3>Don't cares</h3>
<p>Input combinations that never occur (for example, BCD values 10-15) are marked X. Treat an X as 1 when it makes a group bigger, ignore it otherwise.</p>
<h3>POS from the map</h3>
<p>Group the 0s instead, write each group as a sum with complemented sense, and AND them.</p>
<h3>Static hazards</h3>
<p>F = AB + A'C with B = C = 1: when A switches, one AND turns off while the other turns on; a slightly slow inverter can create a brief 0 glitch. The fix is the redundant consensus term <b>BC</b>, which covers the transition between the two groups. In synchronous designs such glitches settle before the clock edge, so they mainly matter for asynchronous signals and clocks.</p>`,
  takeaway: "Group 1s in power-of-two rectangles on a Gray-ordered, wrapping map: bigger groups, fewer groups. Don't-cares help when useful. Adjacent groups not covered by a common term can glitch; add the consensus term.",
  quiz: [
    { q: "F(A,B,C) = Σm(0,2,4,6) simplifies to...", o: ["A'", "C'", "B'", "AC"], a: 1, why: "Every even minterm has C = 0: one group of four." },
    { q: "Why is K-map ordering 00, 01, 11, 10?", o: ["Binary counting", "So neighbours differ by one bit", "Alphabetical", "To save space"], a: 1, why: "Gray order makes adjacency mean one-variable difference." },
  ],
  practice: ["k-kmap", "k-major"],
},
]},
{
  id: "vl-comb", title: "Combinational building blocks", lessons: [
{
  id: "v-comb", title: "Mux, decoder, encoder, adders and comparators", mins: 13,
  sum: "The blocks every datapath is built from, and the classic adder speed trade-off.",
  body: `
<h3>Multiplexer</h3>
<p>An N:1 mux picks one of N inputs with log<sub>2</sub>N select lines: Y = S'·D0 + S·D1 for a 2:1 mux. Muxes are universal: an 8:1 mux can implement any 3-input function (put the truth table on the data inputs), and a 4:1 mux can do any 3-input function if the third variable (or its complement, 0 or 1) drives the data inputs. Larger muxes are trees of smaller ones.</p>
<h3>Decoder and encoder</h3>
<p>A decoder turns an n-bit code into 2<sup>n</sup> one-hot lines (address decoding, chip selects). A full adder is just a 3:8 decoder plus two OR gates. An encoder does the reverse; a <b>priority encoder</b> outputs the index of the highest active input plus a valid flag (interrupt controllers, arbiters).</p>
<h3>Adders</h3>
<ul><li>Half adder: S = A ⊕ B, C = AB.</li>
<li>Full adder: S = A ⊕ B ⊕ Cin, Cout = AB + Cin(A ⊕ B).</li>
<li><b>Ripple-carry</b>: chain N full adders. Simple and small, but the carry ripples through all N stages: delay grows <b>linearly</b> with N.</li>
<li><b>Carry-lookahead</b>: compute generate G = AB and propagate P = A ⊕ B for each bit, then all carries in parallel: C1 = G0 + P0·C0, C2 = G1 + P1·G0 + P1·P0·C0, ... Delay grows roughly <b>logarithmically</b> with N in hierarchical form, at the cost of more area.</li>
<li>Carry-select and carry-skip adders sit in between.</li></ul>
<h3>Subtractor and ALU</h3>
<p>A - B = A + B' + 1: XOR each B bit with a SUB control line and feed SUB into the carry-in. An ALU adds a mux that chooses between the adder, AND, OR, XOR... results, plus flags (zero, carry, overflow, negative).</p>
<h3>Comparator</h3>
<p>For 1 bit: GT = AB', LT = A'B, EQ = (A ⊕ B)'. For N bits, compare from the MSB down: the first differing bit decides.</p>`,
  takeaway: "Muxes select (and can implement any function), decoders one-hot, priority encoders arbitrate. Ripple-carry delay is O(N); carry-lookahead trades area for O(log N). Subtraction = add the inverted operand plus 1.",
  quiz: [
    { q: "Delay of an N-bit ripple-carry adder grows...", o: ["Constant", "Linearly with N", "With log N", "With N squared"], a: 1, why: "The carry may pass through every stage." },
    { q: "In carry-lookahead, propagate P is...", o: ["A AND B", "A XOR B", "A OR B", "NOT A"], a: 1, why: "P = A ⊕ B (A + B also works for carry purposes); G = AB." },
  ],
  practice: ["k-mux", "k-mux4", "k-half", "k-full", "k-dec", "k-cmp", "v-mux2", "v-mux4", "v-add4", "v-dec38", "v-prienc", "v-cmp", "v-alu"],
},
]},
{
  id: "vl-seq", title: "Sequential logic and timing", lessons: [
{
  id: "v-latch", title: "Latches vs flip-flops", mins: 10,
  sum: "Level-sensitive vs edge-triggered storage, and why synchronous design uses flip-flops.",
  demo: "dff",
  body: `
<h3>SR latch</h3>
<p>Two cross-coupled NOR (or NAND) gates hold a bit. S sets, R resets, S = R = 1 is the forbidden state for the NOR version (both outputs 0, and the result is unpredictable when both release).</p>
<h3>D latch: level-sensitive</h3>
<p>While the enable is high, the latch is <b>transparent</b>: Q follows D. When enable goes low, Q holds the last value.</p>
<h3>D flip-flop: edge-triggered</h3>
<p>Q takes the value of D only at the <b>rising edge</b> of the clock and holds it for the whole cycle. A common construction is two latches in series, master and slave, enabled on opposite clock phases.</p>
<h3>Why flip-flops win in synchronous design</h3>
<p>With flip-flops, data moves exactly one stage per clock edge, so timing analysis is a simple per-path check. With transparent latches, data can race through several stages in one phase, and timing depends on duty cycle. Latches are smaller and are used deliberately in some high-performance designs and for clock gating, but <b>unintended latches</b> from incomplete <code>if</code>/<code>case</code> in combinational RTL are a classic bug.</p>
<h3>Characteristic equations</h3>
<table><tr><th>Type</th><th>Next state</th></tr><tr><td>D</td><td>Q+ = D</td></tr><tr><td>T</td><td>Q+ = T ⊕ Q</td></tr>
<tr><td>JK</td><td>Q+ = JQ' + K'Q (J = K = 1 toggles)</td></tr><tr><td>SR</td><td>Q+ = S + R'Q (S = R = 1 not allowed)</td></tr></table>
<p>Converting between types: write the next-state you want, then solve for the input the available flip-flop needs (a T flip-flop from a D: D = T ⊕ Q).</p>`,
  takeaway: "A latch is transparent while enabled (level); a flip-flop samples only at the clock edge. Synchronous design uses flip-flops; accidental latches come from incomplete combinational code.",
  quiz: [
    { q: "A latch is...", o: ["Edge-triggered", "Level-sensitive", "Asynchronous only", "Always clocked twice"], a: 1, why: "Transparent while enabled." },
    { q: "Make a T flip-flop from a D flip-flop: D = ?", o: ["T", "T AND Q", "T XOR Q", "NOT Q"], a: 2, why: "Q+ = T ⊕ Q." },
  ],
  practice: ["k-tff", "v-dff", "v-dffa"],
},
{
  id: "v-fsm", title: "Counters, shift registers and FSMs", mins: 13,
  sum: "Synchronous vs ripple counters, Johnson and ring counters, and designing Moore and Mealy machines.",
  body: `
<h3>Counters</h3>
<ul><li><b>Ripple (asynchronous)</b>: each flip-flop is clocked by the previous one's output. Few gates, but delays add up and outputs glitch while rippling.</li>
<li><b>Synchronous</b>: all flip-flops share one clock; logic computes the next value (bit i toggles when all lower bits are 1).</li>
<li><b>Mod-N</b>: reset to 0 after N-1 (a decade counter is mod-10).</li>
<li><b>Ring counter</b>: a single 1 circulating through N flip-flops: N states, one-hot outputs.</li>
<li><b>Johnson counter</b>: feed back the <i>inverted</i> last bit: 2N states (4 flops: 0000, 1000, 1100, 1110, 1111, 0111, 0011, 0001).</li></ul>
<p>The MSB of an n-bit binary counter divides the clock by 2<sup>n</sup>.</p>
<h3>Shift registers and LFSRs</h3>
<p>SISO, SIPO, PISO, PIPO describe serial/parallel in and out. SIPO turns a serial stream (SPI, UART) into a byte. An <b>LFSR</b> feeds back the XOR of chosen taps; a maximal-length n-bit LFSR cycles through all 2<sup>n</sup> - 1 non-zero states (pseudo-random patterns, CRCs, scramblers). All-zero is a stuck state.</p>
<h3>FSMs</h3>
<p><b>Moore</b>: outputs depend only on the state - glitch-free, one cycle later. <b>Mealy</b>: outputs depend on state and inputs - fewer states, reacts in the same cycle, but outputs can glitch with the inputs.</p>
<p>Design steps: state diagram, state table, state encoding, next-state and output equations, then build. Encodings:</p>
<table><tr><th>Encoding</th><th>Flip-flops for N states</th><th>Note</th></tr>
<tr><td>Binary</td><td>⌈log<sub>2</sub>N⌉</td><td>fewest flops</td></tr><tr><td>One-hot</td><td>N</td><td>simple, fast next-state logic; common in FPGAs</td></tr>
<tr><td>Gray</td><td>⌈log<sub>2</sub>N⌉</td><td>one bit changes per transition</td></tr></table>
<h3>Sequence detectors</h3>
<p>Name states by "how much of the pattern have I seen". For overlapping detection, after a match go to the state that represents the longest suffix of the pattern that is also a prefix (for 1011, after a match the last "1" already starts a new pattern).</p>`,
  takeaway: "Synchronous counters share one clock; ring = N states, Johnson = 2N. Maximal LFSRs visit 2^n - 1 states. Moore outputs depend on state only; Mealy on state and input. One-hot trades flops for speed.",
  quiz: [
    { q: "How many states does a 4-bit Johnson counter have?", o: ["4", "8", "15", "16"], a: 1, why: "A Johnson counter has 2N states." },
    { q: "Flip-flops needed for 6 states with one-hot encoding?", o: ["3", "6", "8", "64"], a: 1, why: "One flip-flop per state." },
    { q: "Which FSM type can produce an output in the same cycle the input arrives?", o: ["Moore", "Mealy", "Both", "Neither"], a: 1, why: "Mealy outputs depend directly on inputs." },
  ],
  practice: ["k-count", "k-shift", "v-cnt", "v-updown", "v-sipo", "v-lfsr", "v-tick", "v-edge", "v-1011", "v-traffic"],
},
{
  id: "v-timing", title: "Setup, hold, metastability and clock domains", mins: 14,
  sum: "The timing equations, how skew helps and hurts, and safe clock-domain crossing.",
  body: `
<h3>Definitions</h3>
<p><b>Setup time</b>: data must be stable this long <b>before</b> the clock edge. <b>Hold time</b>: data must stay stable this long <b>after</b> the edge. <b>Clock-to-Q</b> (t<sub>cq</sub>): delay from the edge to the new output.</p>
<h3>Setup check (limits the clock frequency)</h3>
<div class="formula">T<sub>clk</sub> ≥ t<sub>cq</sub> + t<sub>logic,max</sub> + t<sub>setup</sub> − t<sub>skew</sub></div>
<p>with skew = clock arrival at capture flop − clock arrival at launch flop. Example: t<sub>cq</sub> = 2 ns, logic = 5 ns, setup = 1 ns, no skew: T ≥ 8 ns, f<sub>max</sub> = 125 MHz.</p>
<h3>Hold check (independent of frequency)</h3>
<div class="formula">t<sub>cq</sub> + t<sub>logic,min</sub> ≥ t<sub>hold</sub> + t<sub>skew</sub></div>
<p>New data must not arrive at the capture flop so early that it overwrites the value being captured. Slowing the clock <b>does not</b> fix a hold violation - you add delay (buffers) on the fast path. A hold violation on silicon is fatal at any frequency.</p>
<h3>Skew</h3>
<p>Positive skew (capture clock late) <b>helps setup and hurts hold</b>. Negative skew does the opposite. Clock tree synthesis aims to keep skew small and balanced.</p>
<h3>Metastability</h3>
<p>If data changes inside the setup/hold window - unavoidable when the signal comes from another clock domain or an asynchronous pin - the flip-flop can hang between 0 and 1 for an unbounded time before resolving randomly. The probability of still being undecided falls exponentially with the time allowed.</p>
<p><b>2-flop synchroniser</b>: the second flip-flop gives the first a whole clock period to resolve. MTBF rises enormously, but it never becomes infinite; very fast or critical designs use three flops.</p>
<h3>Clock domain crossing (CDC)</h3>
<ul><li><b>Single control bit</b>: 2-flop synchroniser.</li>
<li><b>Short pulse</b> from a fast to a slow domain: may be missed - convert it to a toggle, synchronise, then detect the edge; or use a handshake.</li>
<li><b>Multi-bit bus</b>: synchronising each bit separately can capture a mix of old and new bits. Use a handshake (req/ack) with a stable bus, an <b>asynchronous FIFO</b>, or Gray-coded counters (only one bit changes at a time).</li></ul>`,
  takeaway: "Setup: T ≥ tcq + logic + tsetup - skew (fix: slow clock or less logic). Hold: tcq + min logic ≥ thold + skew (fix: add delay; clock speed does not help). Synchronise single bits with 2 flops; buses need a handshake, async FIFO or Gray code.",
  quiz: [
    { q: "tcq = 1 ns, logic = 6 ns, tsetup = 1 ns, no skew. fmax?", o: ["125 MHz", "143 MHz", "100 MHz", "166 MHz"], a: 0, why: "T = 8 ns → 125 MHz." },
    { q: "How do you fix a hold violation?", o: ["Lower the clock frequency", "Add delay to the short path", "Remove pipeline stages", "Increase setup time"], a: 1, why: "Hold does not depend on the clock period." },
    { q: "Why use Gray code for async FIFO pointers?", o: ["Smaller", "Only one bit changes per increment, so a sampled value is never wildly wrong", "Faster logic", "It is required by Verilog"], a: 1, why: "A sample taken mid-change is either the old or the new value." },
  ],
  practice: ["v-sync"],
},
]},
{
  id: "vl-cmos", title: "CMOS circuits", lessons: [
{
  id: "v-mosfet", title: "The MOSFET", mins: 13,
  sum: "Structure, threshold voltage, the three regions and the drain-current equations.",
  body: `
<h3>Structure</h3>
<p>An NMOS transistor has n+ source and drain regions in a p-type body, with a gate on top of a thin oxide. A positive gate-source voltage above the <b>threshold voltage V<sub>th</sub></b> attracts electrons under the gate, forming a channel (inversion), and current can flow from drain to source. PMOS is the mirror image: p+ regions in an n-well, it turns on when V<sub>GS</sub> is more negative than its (negative) threshold, and it conducts holes.</p>
<p>Electrons are about 2-3 times more mobile than holes, so a PMOS must be wider to match an NMOS's current.</p>
<h3>Regions of operation (NMOS)</h3>
<table><tr><th>Region</th><th>Condition</th><th>Drain current</th></tr>
<tr><td>Cutoff</td><td>V<sub>GS</sub> &lt; V<sub>th</sub></td><td>≈ 0 (only leakage)</td></tr>
<tr><td>Linear (triode)</td><td>V<sub>GS</sub> &gt; V<sub>th</sub> and V<sub>DS</sub> &lt; V<sub>GS</sub> − V<sub>th</sub></td><td>k'(W/L)[(V<sub>GS</sub> − V<sub>th</sub>)V<sub>DS</sub> − V<sub>DS</sub><sup>2</sup>/2]</td></tr>
<tr><td>Saturation</td><td>V<sub>DS</sub> ≥ V<sub>GS</sub> − V<sub>th</sub></td><td>(k'/2)(W/L)(V<sub>GS</sub> − V<sub>th</sub>)<sup>2</sup></td></tr></table>
<p>k' = μC<sub>ox</sub>. In saturation the channel is <b>pinched off</b> at the drain end, so current barely depends on V<sub>DS</sub>. As a switch in digital logic, the transistor moves through all three regions during each transition.</p>
<p>Worked example: k'(W/L) = 2 mA/V<sup>2</sup>, V<sub>th</sub> = 0.5 V, V<sub>GS</sub> = 1.5 V, V<sub>DS</sub> = 2 V. V<sub>GS</sub> − V<sub>th</sub> = 1 V &lt; V<sub>DS</sub>, so saturation: I<sub>D</sub> = 0.5 × 2 × 1<sup>2</sup> = 1 mA.</p>
<h3>Second-order effects</h3>
<ul><li><b>Body effect</b>: a source higher than the body raises V<sub>th</sub> (matters for stacked transistors).</li>
<li><b>Channel-length modulation</b>: in saturation I<sub>D</sub> rises slightly with V<sub>DS</sub>: multiply by (1 + λV<sub>DS</sub>).</li>
<li><b>Velocity saturation</b> in short channels makes current closer to linear in (V<sub>GS</sub> − V<sub>th</sub>).</li>
<li><b>Subthreshold leakage</b> grows exponentially as V<sub>th</sub> is lowered - the main static power problem in modern nodes.</li></ul>`,
  takeaway: "NMOS turns on above Vth; cutoff, linear (VDS < VGS - Vth), saturation (VDS ≥ VGS - Vth, square law). PMOS is slower per width because holes are less mobile. Lower Vth = faster but leakier.",
  quiz: [
    { q: "VGS = 2 V, Vth = 0.7 V, VDS = 0.5 V. Region?", o: ["Cutoff", "Linear", "Saturation", "Breakdown"], a: 1, why: "VGS - Vth = 1.3 V > VDS = 0.5 V → linear." },
    { q: "Why are PMOS transistors drawn wider?", o: ["Thicker oxide", "Holes are less mobile than electrons", "Higher Vth", "Body effect"], a: 1, why: "Lower mobility means less current per unit width." },
  ],
  practice: [],
},
{
  id: "v-cmos", title: "CMOS inverter and gates", mins: 13,
  sum: "The inverter's transfer curve, noise margins, NAND/NOR structure and sizing.",
  body: `
<h3>The inverter</h3>
<p>A PMOS from V<sub>DD</sub> to the output and an NMOS from the output to ground, gates tied together. Input low: PMOS on, NMOS off, output high. Input high: the reverse. In either steady state there is no path from V<sub>DD</sub> to ground, so static power is (ideally) zero - the big reason CMOS won.</p>
<h3>Voltage transfer curve (VTC)</h3>
<p>Plot V<sub>out</sub> against V<sub>in</sub>: high, then a steep drop around the <b>switching threshold V<sub>M</sub></b> (where V<sub>in</sub> = V<sub>out</sub> and both transistors are in saturation), then low. Sizing the PMOS stronger moves V<sub>M</sub> up. For a symmetric V<sub>M</sub> = V<sub>DD</sub>/2, the PMOS is made about 2-3× wider than the NMOS.</p>
<h3>Noise margins</h3>
<div class="formula">NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub> &nbsp;&nbsp;&nbsp; NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub></div>
<p>V<sub>IL</sub> and V<sub>IH</sub> are the points where the VTC slope is −1. Larger margins tolerate more noise.</p>
<h3>Static CMOS gates</h3>
<p>Every gate has a <b>pull-down network</b> of NMOS (conducts when the output should be 0) and a <b>dual pull-up network</b> of PMOS: series in one becomes parallel in the other.</p>
<ul><li><b>NAND</b>: NMOS in series, PMOS in parallel. <b>NOR</b>: NMOS in parallel, PMOS in series.</li>
<li>Static CMOS gates are naturally inverting. AND = NAND + inverter (6 transistors).</li>
<li>NAND is preferred: its series stack uses the faster NMOS. NOR puts slow PMOS in series, which must then be made very wide.</li>
<li>Sizing for equal drive to an inverter: in a 2-input NAND the series NMOS are each 2× wide; in a 2-input NOR the series PMOS are each 2× the inverter's PMOS.</li></ul>
<p>Example: Y = (AB + C)'. Pull-down: (A series B) parallel C. Pull-up: (A parallel B) series C. 6 transistors.</p>
<h3>Transmission gate and tri-state</h3>
<p>An NMOS passes a strong 0 but a weak 1 (V<sub>DD</sub> − V<sub>th</sub>); a PMOS passes a strong 1 but a weak 0. Putting both in parallel with complementary gates makes a <b>transmission gate</b> that passes both well (used in muxes and latches). A <b>tri-state</b> buffer can disconnect its output (high-Z) so several drivers can share a bus.</p>`,
  takeaway: "CMOS inverter: no static current path. VM moves with PMOS/NMOS strength; noise margins from VTC. Gates = NMOS pull-down + dual PMOS pull-up; NAND beats NOR because its series stack is NMOS. Transmission gates pass both levels.",
  quiz: [
    { q: "In a CMOS NAND gate, the NMOS transistors are...", o: ["In parallel", "In series", "Not used", "Cross-coupled"], a: 1, why: "Output goes low only when all inputs are high." },
    { q: "VOH = 3.3, VIH = 2.0, VOL = 0.2, VIL = 0.8. NML?", o: ["1.3 V", "0.6 V", "1.2 V", "2.5 V"], a: 1, why: "NML = VIL - VOL = 0.8 - 0.2 = 0.6 V." },
    { q: "An NMOS pass transistor passes a logic 1 as...", o: ["VDD", "VDD - Vth", "0", "VDD + Vth"], a: 1, why: "It stops conducting when the output gets within Vth of its gate." },
  ],
  practice: ["k-and-nand", "k-nand-nor"],
},
{
  id: "v-power", title: "Power and delay", mins: 11,
  sum: "Dynamic, short-circuit and leakage power, the techniques to cut them, and gate delay basics.",
  body: `
<h3>Dynamic power</h3>
<div class="formula">P<sub>dyn</sub> = α · C · V<sub>DD</sub><sup>2</sup> · f</div>
<p>α is the activity factor (how often a node toggles per cycle), C the switched capacitance. Each full charge-discharge cycle of a capacitor draws C·V<sup>2</sup> of energy from the supply. Because of the <b>square</b>, lowering the voltage is the most powerful lever: halve V<sub>DD</sub> and dynamic power drops to a quarter (but gates get slower).</p>
<p>Example: α = 0.1, C = 1 nF, V = 1 V, f = 100 MHz → 0.1 × 10<sup>−9</sup> × 1 × 10<sup>8</sup> = 10 mW.</p>
<h3>Short-circuit power</h3>
<p>During an input transition both PMOS and NMOS are briefly on. Slow input edges make this worse, so designs keep transition times short.</p>
<h3>Static (leakage) power</h3>
<p>Subthreshold leakage (grows exponentially as V<sub>th</sub> decreases and with temperature), gate leakage through thin oxide, and junction leakage. In advanced nodes leakage can be a large share of total power, even when the chip is idle.</p>
<h3>Reducing power</h3>
<ul><li><b>Clock gating</b>: stop the clock to idle registers - cuts α (the clock tree is a big consumer).</li>
<li><b>Power gating</b>: switch off the supply of idle blocks with header/footer switches - cuts leakage; state must be saved or restored.</li>
<li><b>DVFS</b>: lower voltage and frequency when full speed is not needed.</li>
<li><b>Multi-V<sub>th</sub></b>: fast low-V<sub>th</sub> cells only on critical paths, low-leakage high-V<sub>th</sub> cells elsewhere.</li>
<li>Multiple voltage islands (with level shifters), and operand isolation.</li></ul>
<h3>Delay</h3>
<p>A gate's delay is roughly the time to charge or discharge its load: t<sub>p</sub> ∝ R<sub>on</sub>·C<sub>load</sub>. Bigger fan-out means more load and more delay; wider transistors lower R but add input capacitance to the previous stage. Long wires add distributed RC (delay grows with length squared), which is why long routes get repeaters. Propagation delay t<sub>p</sub> = (t<sub>pHL</sub> + t<sub>pLH</sub>)/2; rise and fall times are measured 10%-90%.</p>`,
  takeaway: "P = αCV²f, so voltage is the strongest lever. Short-circuit power comes from slow edges; leakage from low Vth and heat. Clock gating cuts activity, power gating cuts leakage, DVFS cuts both. Delay ≈ R·C of the load.",
  quiz: [
    { q: "Supply voltage drops from 1.0 V to 0.8 V, same f. Dynamic power becomes...", o: ["80%", "64%", "51%", "90%"], a: 1, why: "0.8² = 0.64." },
    { q: "Which technique mainly reduces leakage power?", o: ["Clock gating", "Power gating", "Pipelining", "Wider wires"], a: 1, why: "Cutting the supply to idle blocks removes their leakage." },
  ],
  practice: [],
},
]},
{
  id: "vl-verilog", title: "Verilog RTL", lessons: [
{
  id: "v-vbasics", title: "Verilog basics", mins: 12,
  sum: "Modules, ports, wire vs reg, continuous assignment and combinational always blocks.",
  body: `
<p>Verilog <b>describes hardware</b>, it does not run line by line. Every <code>assign</code> and every <code>always</code> block is a piece of circuitry working in parallel.</p>
<pre class="code">module adder4 (
  input  [3:0] a, b,
  input        cin,
  output [3:0] sum,
  output       cout
);
  assign {cout, sum} = a + b + cin;   // 5-bit result split by concatenation
endmodule</pre>
<h3>wire vs reg</h3>
<ul><li><code>wire</code> - a connection driven by an <code>assign</code> or a module output.</li>
<li><code>reg</code> - anything assigned inside an <code>always</code> block. It does <b>not</b> automatically mean a flip-flop: a <code>reg</code> written in <code>always @(*)</code> becomes combinational logic.</li>
<li>SystemVerilog's <code>logic</code> works for both.</li></ul>
<h3>Numbers and vectors</h3>
<p><code>8'hFF</code>, <code>4'b1010</code>, <code>3'd5</code>: width, base, value. Select bits with <code>x[3]</code> or <code>x[7:4]</code>, join with <code>{a, b}</code>, repeat with <code>{4{1'b0}}</code>. Reduction operators: <code>&amp;x</code> (all ones?), <code>|x</code> (any one?), <code>^x</code> (odd parity).</p>
<h3>Combinational always blocks</h3>
<pre class="code">always @(*) begin
  case (sel)
    2'd0: y = a;
    2'd1: y = b;
    default: y = c;
  endcase
end</pre>
<p><code>@(*)</code> makes the block sensitive to everything it reads (a manual list that misses a signal creates a simulation/synthesis mismatch). Use <b>blocking</b> <code>=</code> here, and give every output a value on <b>every path</b> - otherwise synthesis infers a latch to "remember" the old value. Assigning defaults at the top of the block is the easy way:</p>
<pre class="code">always @(*) begin
  grant = 2'b00;          // default
  if (req[1]) grant = 2'b10;
  else if (req[0]) grant = 2'b01;
end</pre>
<h3>Hierarchy</h3>
<pre class="code">half_adder ha1 (.a(a), .b(b), .sum(s1), .carry(c1));   // named port connection</pre>
<p>Named connections are safer than positional ones. Parameters make modules reusable: <code>module reg_n #(parameter W = 8) (...)</code> and <code>reg_n #(.W(16)) r1 (...)</code>.</p>`,
  takeaway: "Verilog is parallel hardware. wire for assign/module outputs, reg for always outputs (not necessarily a flop). In always @(*), use =, cover every path (or set defaults) to avoid latches.",
  quiz: [
    { q: "A reg assigned in always @(*) synthesises to...", o: ["Always a flip-flop", "Combinational logic (if every path assigns it)", "A latch always", "Nothing"], a: 1, why: "'reg' is a language type, not a hardware register." },
    { q: "What does &x return for x = 4'b1101?", o: ["1", "0", "4'b1101", "4'b0000"], a: 1, why: "Reduction AND is 1 only if all bits are 1." },
  ],
  practice: ["v-and", "v-mux2", "v-mux4", "v-half", "v-full", "v-add4", "v-parity", "v-seg7", "v-popcnt"],
},
{
  id: "v-vseq", title: "Sequential RTL: blocking vs non-blocking", mins: 13,
  sum: "Clocked always blocks, the <= rule, resets, and a clean FSM coding style.",
  body: `
<h3>Flip-flops in RTL</h3>
<pre class="code">always @(posedge clk) begin
  if (rst) q &lt;= 1'b0;   // synchronous reset
  else     q &lt;= d;
end

always @(posedge clk or negedge rst_n) begin
  if (!rst_n) q &lt;= 1'b0; // asynchronous active-low reset
  else        q &lt;= d;
end</pre>
<h3>Blocking (=) vs non-blocking (&lt;=)</h3>
<p>Blocking assignments update immediately, in order. Non-blocking assignments evaluate all right-hand sides first and update together at the end of the time step - exactly how flip-flops sharing a clock behave.</p>
<pre class="code">// shift register, correct
always @(posedge clk) begin q1 &lt;= d;  q2 &lt;= q1; q3 &lt;= q2; end   // 3 flops
// with blocking, q1, q2 and q3 all become d in one clock: 1 flop!
always @(posedge clk) begin q1 = d;   q2 = q1;  q3 = q2;  end</pre>
<p><b>The rules:</b> use <code>&lt;=</code> in clocked blocks, <code>=</code> in combinational blocks, never mix them on one signal, and assign each signal in only one block.</p>
<h3>Sync vs async reset</h3>
<table><tr><th></th><th>Synchronous</th><th>Asynchronous</th></tr>
<tr><td>Acts</td><td>only at a clock edge</td><td>immediately</td></tr>
<tr><td>Needs a running clock</td><td>yes</td><td>no</td></tr>
<tr><td>Glitch on reset line</td><td>filtered by the clock</td><td>can reset the design</td></tr>
<tr><td>Caution</td><td>reset path is part of the data logic</td><td>de-assertion must be synchronised to the clock</td></tr></table>
<p>The common recommendation: <b>assert asynchronously, de-assert synchronously</b> using a reset synchroniser (two flops whose output drives the async reset).</p>
<h3>FSM coding style</h3>
<pre class="code">always @(posedge clk) state &lt;= rst ? IDLE : next;   // state register
always @(*) begin                                   // next-state logic
  next = state;                                     // default: stay
  case (state)
    IDLE: if (start) next = RUN;
    RUN:  if (done)  next = IDLE;
  endcase
end
assign busy = (state == RUN);                       // Moore output</pre>
<h3>What is synthesisable?</h3>
<p>Not synthesisable: <code>#</code> delays, <code>initial</code> blocks (except FPGA register init), <code>$display</code>, file I/O, loops whose count is not fixed at compile time. A <code>for</code> loop with constant bounds simply unrolls into parallel hardware.</p>`,
  takeaway: "Clocked blocks: <=. Combinational blocks: =. One driver per signal. Async reset: assert async, release synchronously. Code FSMs as state register + next-state block + outputs.",
  quiz: [
    { q: "always @(posedge clk) begin b = a; c = b; end creates how many flip-flops in the a→c path?", o: ["2", "1", "0", "3"], a: 1, why: "With blocking, c gets the new b (= a) in the same edge, so effectively one stage." },
    { q: "Which is not synthesisable?", o: ["for loop with constant bound", "#10 delay", "case statement", "Concatenation"], a: 1, why: "Delays only exist in simulation." },
  ],
  practice: ["v-dff", "v-dffa", "v-cnt", "v-updown", "v-sipo", "v-lfsr", "v-edge", "v-tick", "v-1011", "v-traffic", "v-regfile", "v-fifo"],
},
{
  id: "v-vtb", title: "Testbenches and verification", mins: 10,
  sum: "Writing a self-checking testbench, and what SystemVerilog, assertions and UVM add.",
  body: `
<p>A testbench is a module with no ports that instantiates the design (the DUT), drives its inputs and checks its outputs. It may use everything that is not synthesisable.</p>
<pre class="code">module tb;
  reg  clk = 0, rst = 1, en = 0;
  wire [3:0] count;
  counter4 dut (.clk(clk), .rst(rst), .en(en), .count(count));

  always #5 clk = ~clk;                 // 100 MHz clock

  initial begin
    $dumpfile("wave.vcd"); $dumpvars(0, tb);
    #12 rst = 0; en = 1;
    repeat (5) @(posedge clk);
    #1 if (count !== 4'd5) $display("FAIL: count=%d", count);
       else                $display("PASS");
    $finish;
  end
endmodule</pre>
<h3>Good habits</h3>
<ul><li><b>Self-checking</b>: compare against expected values automatically; never rely on eyeballing waveforms.</li>
<li>Change inputs away from the active clock edge (or with non-blocking assignments) to avoid races with the DUT.</li>
<li>Cover corner cases: reset in the middle of activity, full and empty, overflow and wrap-around, back-to-back operations.</li>
<li>Compare against a <b>reference model</b>: the checker on this site does exactly that - it simulates your design next to a reference with the same random inputs.</li></ul>
<h3>Beyond plain Verilog</h3>
<ul><li><b>SystemVerilog</b>: classes, constrained-random stimulus (<code>rand</code>, <code>constraint</code>), interfaces, queues.</li>
<li><b>Assertions (SVA)</b>: properties checked every cycle, e.g. <code>assert property (@(posedge clk) req |-&gt; ##[1:3] gnt);</code></li>
<li><b>Functional coverage</b>: proves which scenarios were actually exercised.</li>
<li><b>UVM</b>: a standard class library for reusable testbenches (drivers, monitors, scoreboards, sequences) - standard in DV jobs; for fresher interviews, know what each component does.</li></ul>`,
  takeaway: "A testbench instantiates the DUT, generates clock and stimulus, and checks outputs automatically. Verification jobs add constrained-random SystemVerilog, assertions, coverage and UVM.",
  quiz: [
    { q: "always #5 clk = ~clk; gives a clock period of...", o: ["5 time units", "10 time units", "2.5 time units", "20 time units"], a: 1, why: "It toggles every 5 units: high 5, low 5." },
    { q: "Main benefit of a self-checking testbench?", o: ["Faster simulation", "Errors are detected automatically on every run", "It synthesises", "Smaller waveforms"], a: 1, why: "Regressions can run unattended." },
  ],
  practice: [],
},
]},
{
  id: "vl-flow", title: "Chip design flow", lessons: [
{
  id: "v-sta", title: "Static timing analysis", mins: 11,
  sum: "Timing paths, arrival and required times, slack, false and multicycle paths, PVT corners.",
  body: `
<p>STA checks every timing path in the design without simulation vectors. It is complete and fast, but it only checks timing - not function.</p>
<h3>Timing paths</h3>
<p>Each path starts at a launch point and ends at a capture point: input port → flop, flop → flop, flop → output port, input → output. Every path is checked for setup and hold.</p>
<h3>Slack</h3>
<div class="formula">setup slack = required time − arrival time</div>
<p>Positive slack: met, with margin. Negative slack: violation. Example: data arrives at 4.2 ns, required by 5.0 ns → slack +0.8 ns. The path with the worst negative slack is the <b>critical path</b>; WNS and TNS (worst and total negative slack) summarise the design.</p>
<h3>Telling STA what not to check</h3>
<ul><li><b>False path</b>: a path that can never be active functionally (for example, between two mutually exclusive mux settings, or between unrelated asynchronous clocks that are already synchronised).</li>
<li><b>Multicycle path</b>: data is only captured every N cycles (enable-controlled), so it may take N periods.</li>
<li>Clock definitions, generated clocks, input/output delays and uncertainty (jitter) are given in SDC constraints.</li></ul>
<h3>Fixing violations</h3>
<p>Setup: upsize cells, use faster (low-V<sub>th</sub>) cells, restructure or pipeline logic, improve placement, useful skew. Hold: insert delay buffers on the short path.</p>
<h3>PVT corners and OCV</h3>
<p>Delay changes with <b>P</b>rocess (slow/fast transistors), <b>V</b>oltage and <b>T</b>emperature. Setup is checked at the slow corner (slow process, low voltage, typically high temperature), hold at the fast corner (fast process, high voltage). In deep nanometre nodes low temperature can be the slow case ("temperature inversion"). On-chip variation (OCV) derates launch and capture paths differently to stay safe.</p>`,
  takeaway: "STA checks all paths: slack = required - arrival. Exclude impossible paths (false paths) and relax enabled ones (multicycle). Check setup at slow corners and hold at fast corners.",
  quiz: [
    { q: "Arrival 6.3 ns, required 6.0 ns. Setup slack?", o: ["+0.3 ns", "-0.3 ns", "0", "12.3 ns"], a: 1, why: "6.0 - 6.3 = -0.3 ns: violation." },
    { q: "Hold is usually checked at...", o: ["Slow corner", "Fast corner", "Typical only", "It is not checked"], a: 1, why: "Hold fails when the data path is fastest." },
  ],
  practice: [],
},
{
  id: "v-flow", title: "RTL to GDSII, and FPGA vs ASIC", mins: 11,
  sum: "Every step a chip goes through, what each step produces, and when to choose an FPGA.",
  body: `
<h3>The ASIC flow</h3>
<ol>
<li><b>Specification and architecture</b> - features, performance, power, area targets; block diagram.</li>
<li><b>RTL design</b> - Verilog/SystemVerilog/VHDL.</li>
<li><b>Functional verification</b> - simulation, constrained-random tests, assertions, coverage, formal checks.</li>
<li><b>Logic synthesis</b> - RTL + standard-cell library + SDC constraints → gate-level netlist; first timing and area estimates. DFT (scan chains, BIST) is inserted around here.</li>
<li><b>Logical equivalence check</b> - proves the netlist matches the RTL.</li>
<li><b>Floorplanning</b> - die size, macro placement (memories), I/Os, power grid.</li>
<li><b>Placement</b> - standard cells placed and optimised.</li>
<li><b>Clock tree synthesis</b> - buffers that deliver the clock with low skew.</li>
<li><b>Routing</b> - metal wires for every connection.</li>
<li><b>Sign-off</b> - STA with extracted parasitics, IR drop and electromigration, signal integrity, <b>DRC</b> (manufacturing rules) and <b>LVS</b> (layout matches the netlist).</li>
<li><b>GDSII / OASIS</b> - the final layout sent to the foundry ("tape-out").</li></ol>
<h3>Standard cells</h3>
<p>Pre-designed gates and flip-flops of a fixed height that tile into rows. The library (.lib) gives timing and power tables for each cell at each PVT corner; the LEF gives its shape for placement and routing.</p>
<h3>FPGA vs ASIC</h3>
<table><tr><th></th><th>FPGA</th><th>ASIC</th></tr>
<tr><td>Upfront cost</td><td>low</td><td>very high (masks, design effort)</td></tr>
<tr><td>Cost per unit</td><td>high</td><td>low at volume</td></tr>
<tr><td>Speed and power</td><td>slower, more power</td><td>faster, efficient</td></tr>
<tr><td>Change after build</td><td>reprogram anytime</td><td>needs a new chip</td></tr>
<tr><td>Time to market</td><td>weeks</td><td>many months</td></tr></table>
<p>FPGAs implement logic in <b>look-up tables</b> (LUTs) and flip-flops connected by programmable routing, plus hard blocks (block RAM, DSP slices, transceivers). They suit prototypes, low volume and products that must be updated; ASICs suit high volume and the best performance per watt.</p>`,
  takeaway: "Spec → RTL → verify → synthesise → floorplan → place → CTS → route → sign-off (STA, DRC, LVS) → GDSII. FPGAs: LUTs, cheap to start, reprogrammable; ASICs: fast, efficient, cheap at volume.",
  quiz: [
    { q: "LVS checks that...", o: ["Timing is met", "The layout matches the netlist", "Manufacturing spacing rules are met", "The RTL is correct"], a: 1, why: "Layout versus schematic." },
    { q: "Clock tree synthesis happens...", o: ["Before synthesis", "After placement, before routing", "After tape-out", "During RTL design"], a: 1, why: "Cells must be placed before the clock can be distributed to them." },
  ],
  practice: [],
},
{
  id: "v-mem", title: "Memories and the memory hierarchy", mins: 10,
  sum: "SRAM and DRAM cells, flash, and how caches hide slow memory.",
  body: `
<h3>SRAM</h3>
<p>The <b>6T cell</b>: two cross-coupled inverters (4 transistors) hold the bit, two access transistors connect it to the bit lines when the word line is on. Fast and needs no refresh, but large - used for caches and register files. Read: precharge both bit lines, enable the word line, a sense amplifier detects which line drops. Cell transistors are sized so a read does not flip the cell and a write can overpower it.</p>
<h3>DRAM</h3>
<p>The <b>1T1C cell</b>: one transistor and one capacitor. Very dense and cheap per bit, but the charge leaks away, so every row must be <b>refreshed</b> every few tens of milliseconds, and reading is destructive (the row is written back). Slower than SRAM.</p>
<h3>Non-volatile memory</h3>
<p>ROM (fixed), EEPROM (byte-erasable, slow, small), <b>Flash</b> (floating-gate or charge-trap cells, erased in blocks, limited write endurance). NOR flash allows random reads and executing code in place; NAND flash is denser and used for storage.</p>
<h3>Capacity</h3>
<p>A memory with <i>n</i> address lines and <i>m</i> data lines holds 2<sup>n</sup> × m bits. 12 address lines × 8 data lines = 4096 bytes.</p>
<h3>The hierarchy</h3>
<p>Registers → L1 cache → L2/L3 → DRAM → flash/disk: each level is bigger, slower and cheaper per bit. Caches work because of <b>locality</b>: temporal (recently used data is used again) and spatial (nearby data is used soon).</p>
<div class="formula">AMAT = hit time + miss rate × miss penalty</div>
<p>Example: 2 ns hit, 5% misses, 50 ns penalty → 2 + 0.05 × 50 = 4.5 ns.</p>
<p>Cache organisation: direct-mapped (each address has one possible line), set-associative (a few), fully associative (any). Address bits split into <b>tag | index | offset</b>: a 4 KB direct-mapped cache with 16-byte lines has 256 lines → 4 offset bits, 8 index bits, the rest tag.</p>`,
  takeaway: "SRAM: 6T, fast, no refresh, caches. DRAM: 1T1C, dense, needs refresh, destructive read. Flash: non-volatile, block erase. AMAT = hit + miss rate × penalty; address = tag | index | offset.",
  quiz: [
    { q: "Why does DRAM need refresh?", o: ["The transistor wears out", "The capacitor's charge leaks away", "To clear the cache", "SRAM needs it too"], a: 1, why: "Stored charge leaks over milliseconds." },
    { q: "Hit 1 ns, miss rate 10%, penalty 40 ns. AMAT?", o: ["5 ns", "4 ns", "41 ns", "1.4 ns"], a: 0, why: "1 + 0.1 × 40 = 5 ns." },
  ],
  practice: ["v-regfile", "v-fifo"],
},
]},
  ],
};
