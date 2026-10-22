// Digital circuit problems for the Circuit Lab.
// pins: inputs/outputs that are placed (and locked) for you.
// check: fn(inputs) -> expected outputs   (or a sequential model)
// par:   the smallest number of gates we know works (for a star)
// sol:   a reference circuit: [id, type, x, y, n?] parts and [from, to] wires.
//        "A" = pin labelled A, "g1" = output of g1, "g1.0" = input 0 of g1,
//        "ff.q"/"ff.qn" = DFF outputs, "ff.d"/"ff.clk" = DFF inputs, "m.0"/"m.1"/"m.s" = MUX inputs.
const b = x => x ? 1 : 0;
export const CIRCUIT_PROBLEMS = [
{
  id: "k-not-nand", title: "NOT from a NAND", level: "Easy", topic: "Universal gates",
  desc: "NAND is a <b>universal gate</b>: any logic can be built from NANDs alone. Start small - make an inverter (<b>Y = NOT A</b>) using only NAND gates.",
  hint: "Connect A to both inputs of one NAND: NOT(A AND A) = NOT A.",
  allowed: ["NAND"], par: 1,
  pins: { in: ["A"], out: ["Y"] },
  check: i => ({ Y: b(!i.A) }),
  sol: { parts: [["g1", "NAND", 300, 60]], wires: [["A", "g1.0"], ["A", "g1.1"], ["g1", "Y"]] },
},
{
  id: "k-and-nand", title: "AND from NANDs", level: "Easy", topic: "Universal gates",
  desc: "Build <b>Y = A AND B</b> using only NAND gates.",
  hint: "A NAND followed by a NAND-inverter undoes the NOT.",
  allowed: ["NAND"], par: 2,
  pins: { in: ["A", "B"], out: ["Y"] },
  check: i => ({ Y: b(i.A && i.B) }),
  sol: { parts: [["g1", "NAND", 260, 60], ["g2", "NAND", 420, 60]], wires: [["A", "g1.0"], ["B", "g1.1"], ["g1", "g2.0"], ["g1", "g2.1"], ["g2", "Y"]] },
},
{
  id: "k-or-nand", title: "OR from NANDs", level: "Easy", topic: "Universal gates",
  desc: "Build <b>Y = A OR B</b> using only NAND gates. Think De Morgan: A + B = NOT( NOT A · NOT B ).",
  hint: "Invert A and invert B with two NANDs, then NAND the results.",
  allowed: ["NAND"], par: 3,
  pins: { in: ["A", "B"], out: ["Y"] },
  check: i => ({ Y: b(i.A || i.B) }),
  sol: { parts: [["g1", "NAND", 240, 30], ["g2", "NAND", 240, 130], ["g3", "NAND", 420, 80]], wires: [["A", "g1.0"], ["A", "g1.1"], ["B", "g2.0"], ["B", "g2.1"], ["g1", "g3.0"], ["g2", "g3.1"], ["g3", "Y"]] },
},
{
  id: "k-xor-nand", title: "XOR with four NANDs", level: "Medium", topic: "Universal gates",
  desc: "A classic interview puzzle: build <b>Y = A XOR B</b> with only NAND gates. It can be done with <b>four</b>.",
  hint: "First N1 = NAND(A,B). Then N2 = NAND(A,N1), N3 = NAND(B,N1), Y = NAND(N2,N3).",
  allowed: ["NAND"], par: 4,
  pins: { in: ["A", "B"], out: ["Y"] },
  check: i => ({ Y: i.A ^ i.B }),
  sol: { parts: [["n1", "NAND", 220, 90], ["n2", "NAND", 380, 30], ["n3", "NAND", 380, 150], ["n4", "NAND", 540, 90]],
    wires: [["A", "n1.0"], ["B", "n1.1"], ["A", "n2.0"], ["n1", "n2.1"], ["n1", "n3.0"], ["B", "n3.1"], ["n2", "n4.0"], ["n3", "n4.1"], ["n4", "Y"]] },
},
{
  id: "k-nand-nor", title: "NAND from NORs", level: "Medium", topic: "Universal gates",
  desc: "NOR is universal too. Build <b>Y = NOT(A AND B)</b> using only NOR gates.",
  hint: "NAND = NOT A OR NOT B (De Morgan). Make NOT A and NOT B with NORs, OR them (a NOR), then invert (a NOR).",
  allowed: ["NOR"], par: 4,
  pins: { in: ["A", "B"], out: ["Y"] },
  check: i => ({ Y: b(!(i.A && i.B)) }),
  sol: { parts: [["g1", "NOR", 220, 30], ["g2", "NOR", 220, 130], ["g3", "NOR", 380, 80], ["g4", "NOR", 530, 80]],
    wires: [["A", "g1.0"], ["A", "g1.1"], ["B", "g2.0"], ["B", "g2.1"], ["g1", "g3.0"], ["g2", "g3.1"], ["g3", "g4.0"], ["g3", "g4.1"], ["g4", "Y"]] },
},
{
  id: "k-mux", title: "2:1 multiplexer from gates", level: "Easy", topic: "Combinational",
  desc: "Build a 2:1 mux without the MUX part: <b>Y = D0</b> when <b>S = 0</b>, and <b>Y = D1</b> when <b>S = 1</b>. Use AND, OR and NOT.",
  hint: "Y = (D0 AND NOT S) OR (D1 AND S).",
  allowed: ["AND", "OR", "NOT"], par: 4,
  pins: { in: ["D0", "D1", "S"], out: ["Y"] },
  check: i => ({ Y: i.S ? i.D1 : i.D0 }),
  sol: { parts: [["inv", "NOT", 200, 150], ["a0", "AND", 340, 30], ["a1", "AND", 340, 110], ["o", "OR", 500, 70]],
    wires: [["S", "inv.0"], ["D0", "a0.0"], ["inv", "a0.1"], ["D1", "a1.0"], ["S", "a1.1"], ["a0", "o.0"], ["a1", "o.1"], ["o", "Y"]] },
},
{
  id: "k-half", title: "Half adder", level: "Easy", topic: "Arithmetic",
  desc: "Add two bits. <b>S</b> (sum) and <b>C</b> (carry): 1 + 1 = 10 in binary, so S = 0, C = 1.",
  hint: "S = A XOR B, C = A AND B.",
  par: 2,
  pins: { in: ["A", "B"], out: ["S", "C"] },
  check: i => ({ S: i.A ^ i.B, C: b(i.A && i.B) }),
  sol: { parts: [["x", "XOR", 300, 30], ["a", "AND", 300, 120]], wires: [["A", "x.0"], ["B", "x.1"], ["A", "a.0"], ["B", "a.1"], ["x", "S"], ["a", "C"]] },
},
{
  id: "k-full", title: "Full adder", level: "Medium", topic: "Arithmetic",
  desc: "Add three bits A, B and carry-in CI. Outputs: <b>S</b> = sum bit, <b>CO</b> = carry out. Chain four of these and you have a 4-bit ripple-carry adder.",
  hint: "S = A XOR B XOR CI.  CO = (A AND B) OR (CI AND (A XOR B)). Reuse the A XOR B gate.",
  par: 5,
  pins: { in: ["A", "B", "CI"], out: ["S", "CO"] },
  check: i => ({ S: i.A ^ i.B ^ i.CI, CO: b(i.A + i.B + i.CI >= 2) }),
  sol: { parts: [["x1", "XOR", 220, 30], ["x2", "XOR", 400, 30], ["a1", "AND", 220, 180], ["a2", "AND", 400, 120], ["o", "OR", 560, 150]],
    wires: [["A", "x1.0"], ["B", "x1.1"], ["x1", "x2.0"], ["CI", "x2.1"], ["A", "a1.0"], ["B", "a1.1"], ["x1", "a2.0"], ["CI", "a2.1"], ["a2", "o.0"], ["a1", "o.1"], ["x2", "S"], ["o", "CO"]] },
},
{
  id: "k-major", title: "Majority voter", level: "Medium", topic: "K-maps",
  desc: "Three sensors vote. <b>Y = 1</b> when at least two of A, B, C are 1. Draw the K-map, find the simplest sum of products, then build it.",
  hint: "Y = AB + BC + AC: three 2-input ANDs and one 3-input OR (select the OR and press + input).",
  par: 4,
  pins: { in: ["A", "B", "C"], out: ["Y"] },
  check: i => ({ Y: b(i.A + i.B + i.C >= 2) }),
  sol: { parts: [["a1", "AND", 260, 20], ["a2", "AND", 260, 100], ["a3", "AND", 260, 180], ["o", "OR", 440, 90, 3]],
    wires: [["A", "a1.0"], ["B", "a1.1"], ["B", "a2.0"], ["C", "a2.1"], ["A", "a3.0"], ["C", "a3.1"], ["a1", "o.0"], ["a2", "o.1"], ["a3", "o.2"], ["o", "Y"]] },
},
{
  id: "k-kmap", title: "Simplify with a K-map", level: "Medium", topic: "K-maps",
  desc: "Build <b>F(A,B,C) = Σm(1, 3, 5, 6, 7)</b> (F is 1 for those minterms, A is the most significant bit). Minimise first: the K-map gives a 2-term answer.",
  hint: "Group m(1,3,5,7) = C. Group m(6,7) = AB. So F = C + AB.",
  par: 2,
  pins: { in: ["A", "B", "C"], out: ["F"] },
  check: i => ({ F: b([1, 3, 5, 6, 7].includes(i.A * 4 + i.B * 2 + i.C)) }),
  sol: { parts: [["a", "AND", 260, 40], ["o", "OR", 440, 80]], wires: [["A", "a.0"], ["B", "a.1"], ["a", "o.0"], ["C", "o.1"], ["o", "F"]] },
},
{
  id: "k-cmp", title: "1-bit comparator", level: "Medium", topic: "Combinational",
  desc: "Compare two bits. <b>GT</b> = A &gt; B, <b>EQ</b> = A == B, <b>LT</b> = A &lt; B.",
  hint: "GT = A AND NOT B. LT = NOT A AND B. EQ = A XNOR B (or NOR of GT and LT).",
  par: 5,
  pins: { in: ["A", "B"], out: ["GT", "EQ", "LT"] },
  check: i => ({ GT: b(i.A > i.B), EQ: b(i.A === i.B), LT: b(i.A < i.B) }),
  sol: { parts: [["na", "NOT", 200, 160], ["nb", "NOT", 200, 30], ["gt", "AND", 360, 20], ["lt", "AND", 360, 180], ["eq", "XNOR", 360, 100]],
    wires: [["A", "na.0"], ["B", "nb.0"], ["A", "gt.0"], ["nb", "gt.1"], ["na", "lt.0"], ["B", "lt.1"], ["A", "eq.0"], ["B", "eq.1"], ["gt", "GT"], ["eq", "EQ"], ["lt", "LT"]] },
},
{
  id: "k-dec", title: "2-to-4 decoder", level: "Medium", topic: "Combinational",
  desc: "Inputs A (MSB) and B. Exactly one output is 1: <b>Y0</b> for 00, <b>Y1</b> for 01, <b>Y2</b> for 10, <b>Y3</b> for 11.",
  hint: "Two inverters give NOT A and NOT B. Then four ANDs: Y0 = A'B', Y1 = A'B, Y2 = AB', Y3 = AB.",
  par: 6,
  pins: { in: ["A", "B"], out: ["Y0", "Y1", "Y2", "Y3"] },
  check: i => { const n = i.A * 2 + i.B; return { Y0: b(n === 0), Y1: b(n === 1), Y2: b(n === 2), Y3: b(n === 3) }; },
  sol: { parts: [["na", "NOT", 180, 20], ["nb", "NOT", 180, 120], ["y0", "AND", 380, 20], ["y1", "AND", 380, 110], ["y2", "AND", 380, 200], ["y3", "AND", 380, 290]],
    wires: [["A", "na.0"], ["B", "nb.0"], ["na", "y0.0"], ["nb", "y0.1"], ["na", "y1.0"], ["B", "y1.1"], ["A", "y2.0"], ["nb", "y2.1"], ["A", "y3.0"], ["B", "y3.1"], ["y0", "Y0"], ["y1", "Y1"], ["y2", "Y2"], ["y3", "Y3"]] },
},
{
  id: "k-parity", title: "Odd parity checker", level: "Easy", topic: "Combinational",
  desc: "<b>P = 1</b> when an odd number of A, B, C, D are 1. UART and memory use parity bits to catch single-bit errors.",
  hint: "XOR is a 'odd number of ones' detector. One 4-input XOR works, or a tree of 2-input XORs.",
  par: 1,
  pins: { in: ["A", "B", "C", "D"], out: ["P"] },
  check: i => ({ P: i.A ^ i.B ^ i.C ^ i.D }),
  sol: { parts: [["x", "XOR", 300, 80, 4]], wires: [["A", "x.0"], ["B", "x.1"], ["C", "x.2"], ["D", "x.3"], ["x", "P"]] },
},
{
  id: "k-mux4", title: "4:1 mux from 2:1 muxes", level: "Medium", topic: "Combinational",
  desc: "Using MUX parts only, build a 4:1 multiplexer: <b>Y = D[S1 S0]</b>. Inputs D0-D3, select S1 (MSB) and S0. Building big muxes from small ones is a favourite interview question.",
  hint: "Two muxes pick with S0 (D0/D1 and D2/D3). A third mux picks between them with S1.",
  allowed: ["MUX2"], par: 3,
  pins: { in: ["D0", "D1", "D2", "D3", "S0", "S1"], out: ["Y"] },
  check: i => ({ Y: [i.D0, i.D1, i.D2, i.D3][i.S1 * 2 + i.S0] }),
  sol: { parts: [["m1", "MUX2", 240, 20], ["m2", "MUX2", 240, 160], ["m3", "MUX2", 440, 90]],
    wires: [["D0", "m1.0"], ["D1", "m1.1"], ["S0", "m1.s"], ["D2", "m2.0"], ["D3", "m2.1"], ["S0", "m2.s"], ["m1", "m3.0"], ["m2", "m3.1"], ["S1", "m3.s"], ["m3", "Y"]] },
},
/* --------------------------------------------------------------- sequential */
{
  id: "k-tff", title: "T flip-flop from a D flip-flop", level: "Medium", topic: "Sequential",
  desc: "A T flip-flop <b>toggles</b> on each rising clock edge when T = 1, and holds when T = 0. Build one from a D flip-flop plus one gate. Output <b>Q</b>. The flip-flop starts at 0. The checker gives one clock pulse per row (click CLK to try it yourself).",
  hint: "Next Q = T XOR Q. Feed D from an XOR of T and the flip-flop's own Q.",
  par: 2,
  pins: { in: ["T"], clk: "CLK", out: ["Q"] },
  seq: { model: { init: () => 0, step: (q, i) => { const n = i.T ? 1 - q : q; return { state: n, out: { Q: n } }; } },
    steps: [{ T: 1 }, { T: 1 }, { T: 0 }, { T: 0 }, { T: 1 }, { T: 0 }, { T: 1 }, { T: 1 }, { T: 1 }, { T: 0 }] },
  sol: { parts: [["x", "XOR", 220, 30], ["ff", "DFF", 380, 30]], wires: [["T", "x.0"], ["ff.q", "x.1"], ["x", "ff.d"], ["CLK", "ff.clk"], ["ff.q", "Q"]] },
},
{
  id: "k-count", title: "2-bit synchronous counter", level: "Hard", topic: "Sequential",
  desc: "Build a counter that goes 00, 01, 10, 11, 00 ... on each clock (Q1 is the MSB). Both flip-flops must share the same <b>CLK</b> (synchronous). Both start at 0.",
  hint: "Q0 toggles every clock: D0 = NOT Q0 (use Q'). Q1 toggles when Q0 is 1: D1 = Q1 XOR Q0.",
  par: 3,
  pins: { in: [], clk: "CLK", out: ["Q1", "Q0"] },
  seq: { model: { init: () => 0, step: (s) => { const n = (s + 1) & 3; return { state: n, out: { Q1: n >> 1, Q0: n & 1 } }; } },
    steps: [{}, {}, {}, {}, {}, {}, {}] },
  sol: { parts: [["f0", "DFF", 220, 150], ["x", "XOR", 220, 20], ["f1", "DFF", 400, 20]],
    wires: [["f0.qn", "f0.d"], ["CLK", "f0.clk"], ["f1.q", "x.0"], ["f0.q", "x.1"], ["x", "f1.d"], ["CLK", "f1.clk"], ["f1.q", "Q1"], ["f0.q", "Q0"]] },
},
{
  id: "k-shift", title: "3-bit shift register", level: "Medium", topic: "Sequential",
  desc: "On every clock, the bit at <b>DIN</b> moves into Q0, Q0 moves into Q1, and Q1 moves into Q2. All start at 0. This is how SPI turns serial bits into a byte.",
  hint: "Three D flip-flops in a chain, all on the same CLK.",
  par: 3,
  pins: { in: ["DIN"], clk: "CLK", out: ["Q2", "Q1", "Q0"] },
  seq: { model: { init: () => 0, step: (s, i) => { const n = ((s << 1) | (i.DIN ? 1 : 0)) & 7; return { state: n, out: { Q2: n >> 2 & 1, Q1: n >> 1 & 1, Q0: n & 1 } }; } },
    steps: [{ DIN: 1 }, { DIN: 0 }, { DIN: 1 }, { DIN: 1 }, { DIN: 0 }, { DIN: 0 }, { DIN: 1 }, { DIN: 0 }] },
  sol: { parts: [["f0", "DFF", 200, 20], ["f1", "DFF", 340, 20], ["f2", "DFF", 480, 20]],
    wires: [["DIN", "f0.d"], ["f0.q", "f1.d"], ["f1.q", "f2.d"], ["CLK", "f0.clk"], ["CLK", "f1.clk"], ["CLK", "f2.clk"], ["f2.q", "Q2"], ["f1.q", "Q1"], ["f0.q", "Q0"]] },
},
];

/* ------------------------------------------------------------- builders */
const PIN_X_IN = 30, PIN_X_OUT = 660;
export function problemCircuit(p) {
  const comps = [];
  const ins = p.pins.in.slice(); const nIn = ins.length + (p.pins.clk ? 1 : 0);
  const gap = Math.min(80, Math.max(50, Math.floor(440 / Math.max(1, nIn))));
  ins.forEach((l, i) => comps.push({ id: "p_" + l, type: "IN", label: l, x: PIN_X_IN, y: 30 + i * gap }));
  if (p.pins.clk) comps.push({ id: "p_" + p.pins.clk, type: "CLK", label: p.pins.clk, x: PIN_X_IN, y: 30 + ins.length * gap });
  const og = Math.min(90, Math.max(50, Math.floor(440 / p.pins.out.length)));
  p.pins.out.forEach((l, i) => comps.push({ id: "p_" + l, type: "OUT", label: l, x: PIN_X_OUT, y: 30 + i * og }));
  return { comps, wires: [] };
}
export function lockedIds(p) { return [...p.pins.in, ...(p.pins.clk ? [p.pins.clk] : []), ...p.pins.out].map(l => "p_" + l); }

export function solutionCircuit(p) {
  const c = problemCircuit(p);
  p.sol.parts.forEach(([id, type, x, y, n]) => c.comps.push(Object.assign({ id, type, x, y }, n ? { n } : (["AND", "OR", "NAND", "NOR", "XOR", "XNOR"].includes(type) ? { n: 2 } : {}))));
  const ref = s => {
    const [id, pin] = s.split(".");
    const isPin = c.comps.find(x => x.id === "p_" + id);
    if (isPin) return { c: "p_" + id, p: isPin.type === "OUT" ? "i0" : "o0" };
    const part = c.comps.find(x => x.id === id);
    if (!part) throw new Error("bad ref " + s);
    if (!pin) return { c: id, p: "o0" };
    const map = { q: "o0", qn: "o1", d: "i0", clk: "i1", s: "i2" };
    return { c: id, p: map[pin] || ("i" + pin) };
  };
  p.sol.wires.forEach(([a, z]) => c.wires.push({ from: ref(a), to: ref(z) }));
  return c;
}

export function checkSpec(p) {
  return p.seq
    ? { seq: true, inputs: p.pins.in.concat(p.pins.clk ? [p.pins.clk] : []), outputs: p.pins.out, clock: p.pins.clk, model: p.seq.model, steps: p.seq.steps, allowed: p.allowed }
    : { inputs: p.pins.in, outputs: p.pins.out, fn: p.check, allowed: p.allowed };
}
