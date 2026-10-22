/* ECE Lab: every simulator and interactive model in one place */
import { store } from "../store.js";
import { MODS, SIMS } from "../registry.js";
import { $, esc, app, setTitle, makeEditor, ctx, empty } from "../ui.js";
import { gateWidget, dffWidget, bitsWidget, uartWidget, pwmWidget, kmapWidget, waveform } from "../widgets.js";
import { fsmWidget, rtosWidget, timingWidget, rcWidget, cpuWidget, busWidget } from "../labs-extra.js";
import { autoRun } from "../verilog.js";
import { CircuitEditor, truthTable } from "../circuit.js";
import { getC } from "../code.js";

const GROUPS = [
  ["Digital logic", ["gate", "kmap", "circuit"]], ["Sequential logic and timing", ["dff", "fsm", "timing"]], ["HDL", ["verilog"]],
  ["Processor and memory", ["cpu"]], ["Embedded C and peripherals", ["c", "bits", "pwm", "uart", "spi"]], ["RTOS", ["rtos"]], ["Analog", ["rc"]],
];
const BLURB = {
  gate: "Click the inputs of any 2-input gate and see the output and truth table.", kmap: "Click cells to set 1 / 0 / don't-care; get the minimal sum of products.",
  circuit: "Drag gates, muxes and flip-flops, wire them, flip inputs and print the truth table.", dff: "Clock a D flip-flop and see how Q follows D only on the edge.",
  fsm: "Step a Moore or Mealy machine bit by bit; edit its next-state table.", timing: "Setup and hold slack and f-max for one register-to-register path, with a timing picture.",
  verilog: "Write synthesizable Verilog, simulate it with automatic stimulus, see the waveform.", cpu: "An 8-bit teaching CPU: step instructions and watch registers, flags and memory.",
  c: "A real C compiler in your browser with standard input.", bits: "Flip bits of a register and see hex, decimal and the C mask expression.",
  pwm: "Timer prescaler and auto-reload for a target PWM frequency and duty cycle.", uart: "Frame a byte with start, data, parity and stop bits.",
  spi: "SPI modes 0-3 and a full I2C transaction drawn bit by bit.", rtos: "Fixed-priority preemptive scheduling, time slicing, mutex blocking and priority inheritance.",
  rc: "Time constant, the 63% point and the low-pass cut-off of an RC circuit.",
};
const routeOf = k => SIMS[k].href.replace("#/lab/", "");
const modsFor = k => [...MODS.values()].filter(m => (m.sims || []).includes(k));

export function labIndex() {
  setTitle("ECE Lab");
  app().innerHTML = `<div class="wrap page"><span class="kicker">ECE Lab</span><h1 class="h1">See it work.</h1>
<p class="lead">Simulators and interactive models that run in your browser. Each is labelled for what it is:</p>
<div class="grid g2" style="margin:14px 0 6px"><div class="card"><span class="badge badge--sim">Software simulation</span><p class="note" style="margin-top:6px">Runs what you write - C code, Verilog or a gate-level circuit - with ideal digital behaviour.</p></div>
<div class="card"><span class="badge badge--model">Interactive model</span><p class="note" style="margin-top:6px">An educational picture of an idea with ideal behaviour. Good for intuition, not a replacement for datasheets or SPICE.</p></div></div>
<p class="note">None of these claim hardware accuracy: there are no real gate delays, noise, analog effects or chip-specific timing.</p>
${GROUPS.map(([g, ks]) => `<h2 class="h2">${g}</h2><div class="grid g3">${ks.map(k => { const s = SIMS[k]; return `<a class="card tile" href="${s.href}" style="--c:${s.kind === "sim" ? "var(--violet)" : "var(--teal)"}"><span class="badge badge--${s.kind}">${s.kind === "sim" ? "Software simulation" : "Interactive model"}</span><h3>${esc(s.title)}</h3><p>${esc(BLURB[k])}</p>${store.raw().sims[k] ? `<span class="note">Opened ${store.raw().sims[k]}×</span>` : ""}<span class="go">Open →</span></a>`; }).join("")}</div>`).join("")}</div>`;
}

export function labPage(r) {
  const k = Object.keys(SIMS).find(x => routeOf(x) === r); if (!k) { app().innerHTML = `<div class="wrap page">${empty("That lab does not exist.", '<a class="btn btn--sm btn--red" href="#/lab">ECE Lab</a>')}</div>`; return; }
  const s = SIMS[k]; setTitle(s.title); store.sim(k);
  store.setLast({ href: s.href, title: s.title, kind: "ECE Lab" });
  const mods = modsFor(k);
  app().innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/lab">ECE Lab</a><span>/</span><span>${esc(s.title)}</span></div>
<div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="badge badge--${s.kind}">${s.kind === "sim" ? "Software simulation" : "Interactive model"}</span><h1 class="h1" style="margin-top:6px">${esc(s.title)}</h1><p class="lead">${esc(BLURB[k])}</p></div></div>
<div id="lab" style="margin-top:16px"></div>
${mods.length ? `<p class="note" style="margin-top:16px">Used in: ${mods.map(m => `<a href="#/m/${m.id}/simulate">${esc(m.title)}</a>`).join(" · ")}</p>` : ""}</div>`;
  const host = $("#lab");
  const W = {
    gate: () => { host.innerHTML = '<div class="grid g2"><div id="g1"></div><div id="g2"></div></div>'; gateWidget($("#g1")); gateWidget($("#g2"), { gate: "XOR" }); },
    kmap: () => { host.innerHTML = '<div class="grid g2"><div id="k1"></div><div id="k2"></div></div>'; kmapWidget($("#k1"), { vars: 4 }); kmapWidget($("#k2"), { vars: 3 }); },
    dff: () => dffWidget(host), fsm: () => fsmWidget(host), timing: () => timingWidget(host), rtos: () => rtosWidget(host), rc: () => rcWidget(host), spi: () => busWidget(host),
    cpu: () => { const stop = cpuWidget(host); ctx.cleanup.push(stop); }, bits: () => bitsWidget(host), pwm: () => pwmWidget(host), uart: () => uartWidget(host),
    circuit: () => circuitLab(host), verilog: () => verilogLab(host), c: () => cLab(host),
  };
  W[k]();
}

function circuitLab(host) {
  host.innerHTML = `<p class="note">Add inputs, gates and outputs; drag from pin to pin to wire. Click an input to flip it, a clock for one pulse. Double-click an input or output to rename it. Ctrl+Z undoes.</p><div id="cl" style="margin-top:10px"></div><div class="row" style="margin-top:10px"><button class="btn btn--ink" id="tt">Show truth table</button><span class="note">Your circuit is saved.</span></div><div id="ttout" style="margin-top:10px"></div>`;
  const ed = new CircuitEditor($("#cl"), { circuit: store.circuit("lab") || { comps: [{ id: "c1", type: "IN", label: "A", x: 40, y: 60 }, { id: "c2", type: "IN", label: "B", x: 40, y: 160 }, { id: "c3", type: "AND", n: 2, x: 300, y: 90 }, { id: "c4", type: "OUT", label: "Y", x: 540, y: 100 }], wires: [{ from: { c: "c1", p: "o0" }, to: { c: "c3", p: "i0" } }, { from: { c: "c2", p: "o0" }, to: { c: "c3", p: "i1" } }, { from: { c: "c3", p: "o0" }, to: { c: "c4", p: "i0" } }] }, height: 560, onChange: c => store.setCircuit("lab", c) });
  $("#tt").onclick = () => {
    const t = truthTable(ed.circ);
    if (!t) { $("#ttout").innerHTML = '<p class="note">Add at least one Input and one Output.</p>'; return; }
    if (t.tooMany) { $("#ttout").innerHTML = '<p class="note">Too many inputs for a table (max 6).</p>'; return; }
    $("#ttout").innerHTML = `<div class="card" style="overflow-x:auto"><table class="ttab"><tr>${t.ins.map(n => `<th>${esc(n)}</th>`).join("")}${t.outs.map((n, i) => `<th class="${i ? "" : "sepc"}">${esc(n)}</th>`).join("")}</tr>${t.rows.map(r => `<tr>${r.ins.map(v => `<td>${v}</td>`).join("")}${r.outs.map((v, i) => `<td class="${i ? "" : "sepc"}">${r.osc ? "~" : v}</td>`).join("")}</tr>`).join("")}</table><p class="note" style="margin-top:6px">Flip-flops are taken at their current state; "~" means the circuit oscillates.</p></div>`;
  };
}
const V_SAMPLE = `// Edit and press Simulate. Inputs named clk / rst are driven automatically.
module counter (
  input            clk,
  input            rst,
  input            en,
  output reg [3:0] count,
  output           max
);
  always @(posedge clk) begin
    if (rst)     count <= 4'd0;
    else if (en) count <= count + 1'b1;
  end
  assign max = &count;
endmodule
`;
function verilogLab(host) {
  host.innerHTML = `<p class="note">Two-state simulation of synthesizable Verilog: modules and instances, parameters, assign, always @(*) and clocked blocks, case, for loops, memories and $display. The last module (or the one nobody instantiates) is the top.</p>
<div class="edwrap" style="margin-top:10px"><div class="edbar"><span class="fname">design.v</span><label class="note">cycles <input id="cyc" type="number" value="16" min="2" max="200" class="numin" style="width:64px"></label><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--red" id="run">▶ Simulate</button></div><div id="ed"></div></div>
<div class="out" id="out" style="margin-top:12px"><div class="out-h">Waveform</div><div class="out-b"><p class="note">Press Simulate (or Ctrl+Enter). Inputs get random values; clk and reset are driven for you.</p></div></div>`;
  const ed = makeEditor($("#ed"), store.code("lab-v") || V_SAMPLE, "text/x-verilog", v => store.setCode("lab-v", v));
  $("#reset").onclick = () => { if (confirm("Reset to the sample design?")) { ed.set(V_SAMPLE); store.clearCode("lab-v"); } };
  const run = () => {
    try { const r = autoRun(ed.get(), { cycles: Math.max(2, Math.min(200, +$("#cyc").value || 16)), seed: Date.now() % 100000 });
      $("#out").innerHTML = `<div class="out-h ok">Top module: ${esc(r.design.top)}</div><div class="out-b"><div id="wv"></div>${r.warnings.length ? `<ul class="warnlist">${r.warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}${r.log ? `<p class="note" style="margin-top:8px">$display output:</p><pre>${esc(r.log)}</pre>` : ""}</div>`;
      waveform($("#wv"), r.trace, r.design.ports, { maxSteps: 400 });
    } catch (e) { if (e.line) ed.markLine(e.line); $("#out").innerHTML = `<div class="out-h bad">Error</div><div class="out-b"><pre>${esc(e.message)}</pre></div>`; }
  };
  $("#run").onclick = run; $("#ed").addEventListener("run", run);
}
const C_SAMPLE = `#include <stdio.h>
#include <stdint.h>

int main(void) {
  uint8_t a = 200, b = 100;
  uint8_t sum = a + b;           /* wraps around */
  printf("200 + 100 as uint8_t = %u\\n", sum);

  int n;
  if (scanf("%d", &n) == 1)
    printf("you typed %d, in hex 0x%X\\n", n, n);
  return 0;
}
`;
function cLab(host) {
  host.innerHTML = `<p class="note">32-bit C compiler (xcc) compiled to WebAssembly. Array bounds and NULL pointers are checked at run time; programs stop after 4 seconds. It runs standard C - not a microcontroller's registers or timing.</p>
<div class="ws ws--play" style="margin-top:10px"><div class="edwrap"><div class="edbar"><span class="fname">playground.c</span><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--red" id="run">▶ Run</button></div><div id="ed"></div></div>
<div class="ws-main"><label class="note" for="stdin">Input (stdin)</label><textarea id="stdin" class="stdin" spellcheck="false">42</textarea><div class="out" id="out"><div class="out-h">Output</div><div class="out-b"><p class="note">Press Run (or Ctrl+Enter).</p></div></div></div></div>`;
  const ed = makeEditor($("#ed"), store.code("lab-c") || C_SAMPLE, "text/x-csrc", v => store.setCode("lab-c", v));
  getC().then(m => m.warmUp()).catch(() => { });
  $("#reset").onclick = () => { if (confirm("Reset to the sample program?")) { ed.set(C_SAMPLE); store.clearCode("lab-c"); } };
  const run = async () => {
    $("#run").disabled = true; $("#out").innerHTML = '<div class="out-h"><span class="spin"></span> Running...</div>';
    try { const r = await (await getC()).runProgram(ed.get(), $("#stdin").value); const m = /main\.c\((\d+)\)/.exec(r.err || ""); if (m) ed.markLine(+m[1]);
      $("#out").innerHTML = r.phase === "done" ? `<div class="out-h ok">Finished in ${r.ms} ms</div><div class="out-b"><pre>${esc(r.out || "(no output)")}</pre></div>` : `<div class="out-h bad">${r.phase === "compile" ? "Compile error" : r.phase === "timeout" ? "Time limit" : "Runtime error"}</div><div class="out-b"><pre>${esc(r.err)}</pre>${r.out ? `<pre style="margin-top:8px">${esc(r.out)}</pre>` : ""}</div>`;
    } catch (e) { $("#out").innerHTML = `<div class="out-h bad">Could not run</div><div class="out-b"><pre>${esc(e.message || e)}</pre></div>`; }
    finally { $("#run").disabled = false; }
  };
  $("#run").onclick = run; $("#ed").addEventListener("run", run);
}
