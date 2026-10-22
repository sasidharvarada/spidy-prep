// Run: node tools/test-circuits.mjs
import { checkCircuit, truthTable } from "../assets/js/circuit.js";
import { CIRCUIT_PROBLEMS, problemCircuit, solutionCircuit, checkSpec } from "../assets/data/v1/circuit-problems.js";
let fail = 0;
for (const p of CIRCUIT_PROBLEMS) {
  const sol = checkCircuit(solutionCircuit(p), checkSpec(p));
  const empty = checkCircuit(problemCircuit(p), checkSpec(p));
  const bad = !sol.ok || empty.ok || sol.gates > p.par;
  if (bad) fail++;
  console.log(p.id.padEnd(12), sol.ok ? "ok" : "BAD " + (sol.error || JSON.stringify(sol.rows.find(r => !r.good))), `gates ${sol.gates}/par ${p.par}`, empty.ok ? "EMPTY PASSES?!" : "");
}
const tt = truthTable(solutionCircuit(CIRCUIT_PROBLEMS.find(p => p.id === "k-full")));
console.log("truth table full adder:", tt.ins.join(""), "->", tt.outs.join(","), tt.rows.map(r => r.ins.join("") + ":" + r.outs.join("")).join(" "));
// oscillation: NOT feeding itself
const osc = { comps: [{ id: "p_Y", type: "OUT", label: "Y", x: 0, y: 0 }, { id: "n", type: "NOT", x: 0, y: 0 }], wires: [{ from: { c: "n", p: "o0" }, to: { c: "n", p: "i0" } }, { from: { c: "n", p: "o0" }, to: { c: "p_Y", p: "i0" } }] };
console.log("oscillator:", checkCircuit(osc, { inputs: [], outputs: ["Y"], fn: () => ({ Y: 0 }) }).error);
console.log(fail ? `${fail} FAILURES` : "ALL GOOD");
