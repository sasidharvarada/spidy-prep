/* ==========================================================================
   Coding workspaces: C (xcc compiler in a worker), Verilog (own 2-state
   simulator, checked against a reference design) and digital circuits.
   ========================================================================== */
import { store } from "./store.js";
import { checkDesign, autoRun } from "./verilog.js";
import { CircuitEditor, checkCircuit, PALETTE } from "./circuit.js";
import { problemCircuit, solutionCircuit, lockedIds, checkSpec } from "../data/v1/circuit-problems.js";
import { waveform } from "./widgets.js";
import { $, esc, toast, makeEditor, app } from "./ui.js";

let cEngine = null;
export const getC = async () => cEngine || (cEngine = await import("./c-engine.js"));
const warnHtml = w => w && w.length ? `<p class="note" style="margin-top:8px;color:var(--amber-t)">Warnings:</p><ul class="warnlist">${w.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";

function descPanel(q, head, extra) {
  const p = q.prob;
  return `${head}<h1 class="h1" style="font-size:26px">${esc(p.title)} ${store.solved(q.id) ? '<span class="pill pill--done">Solved</span>' : ""}</h1>
<div class="prose">${p.desc}</div>${extra || ""}
<details class="hint"><summary>Hint</summary><div>${esc(p.hint || "Break it into small steps and test each with Run.")}</div></details>
<details class="hint" id="solDet"><summary>Show a reference solution</summary><div id="solBox"></div></details>`;
}
function wireSolution(render) { $("#solDet").addEventListener("toggle", () => { if (!$("#solDet").open || $("#solBox").dataset.done) return; $("#solBox").dataset.done = 1; render($("#solBox")); }); }
const outBox = (cls, head, body) => { $("#out").innerHTML = `<div class="out-h ${cls}">${head}</div><div class="out-b">${body}</div>`; };

/* ---------------- C ---------------- */
export function cWorkspace(q, head, after) {
  const p = q.prob, id = q.id, isProg = p.kind === "program";
  app().innerHTML = `<div class="wrap page"><div class="ws">
<section class="ws-desc">${descPanel(q, head, `<p class="note">${isProg ? `Your program reads standard input. Two sample inputs are shown below; Submit also checks ${Math.max(0, p.tests.length - 2)} additional evaluation inputs.` : "Write the function(s) only - no main(). Run uses the bundled exercise harness; Submit checks the full harness."}</p>${isProg ? `<div class="sample-list"><h3>Visible sample tests</h3>${p.tests.slice(0, 2).map((x, i) => `<div class="sample"><b>Sample ${i + 1}</b><pre>${esc(x || "(empty input)")}</pre></div>`).join("")}</div>` : `<div class="callout"><p>This browser evaluator is educational, not private: its test harness and reference implementation are shipped to the browser. A trusted hidden grader is required for genuinely private tests.</p></div>`}`)}${after || ""}</section>
<section class="ws-main">
 <div class="edwrap"><div class="edbar"><span class="fname">main.c</span><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--ink" id="run">${isProg ? "▶ Run samples" : "▶ Run"}</button><button class="btn btn--sm btn--red" id="submit">Submit</button></div><div id="ed"></div></div>
 ${isProg ? `<label class="note" for="stdin">Input (stdin) for Run</label><textarea id="stdin" class="stdin" spellcheck="false">${esc(p.tests[0])}</textarea>` : ""}
 <div class="out" id="out"><div class="out-h">Output</div><div class="out-b"><p class="note"><b>Run</b> compiles and runs; <b>Submit</b> checks against the tests. Ctrl+Enter runs.</p><p class="note" id="engNote">The compiler loads on first use (about 0.5 MB).</p></div></div>
 <p class="note">Software simulation: a 32-bit C compiler (xcc) in WebAssembly. It follows standard C, not the timing or peripherals of a real microcontroller.</p>
</section></div></div>`;
  const ed = makeEditor($("#ed"), store.code(id) || p.starter, "text/x-csrc", v => store.setCode(id, v));
  getC().then(m => m.warmUp()).then(() => { const n = $("#engNote"); if (n) n.textContent = "C compiler ready."; }).catch(() => { const n = $("#engNote"); if (n) n.textContent = "The compiler could not load. Check your connection and reload."; });
  $("#reset").onclick = () => { if (confirm("Replace your code with the starter code?")) { ed.set(p.starter); store.clearCode(id); } };
  const busy = on => ["#run", "#submit"].forEach(s => $(s).disabled = on);
  const showErr = r => {
    const m = /main\.c\((\d+)\)/.exec(r.err || ""); if (m) ed.markLine(+m[1]);
    outBox("bad", r.phase === "compile" ? "✗ Compile error" : r.phase === "timeout" ? "✗ Time limit exceeded (4 s)" : "✗ Runtime error", `<pre>${esc(r.err || "")}</pre>${r.out ? `<p class="note" style="margin-top:8px">Output before the error:</p><pre>${esc(r.out)}</pre>` : ""}`);
  };
  async function run() {
    busy(true); outBox("", '<span class="spin"></span> Compiling and running...', "");
    try {
      const C = await getC();
      if (isProg) {
        const r = await C.runSamples(p, ed.get());
        if (r.phase !== "done") showErr(r);
        else outBox("", "Visible sample results", r.rows.map((x, i) => `<div class="sample-result ${x.ok ? "ok" : "bad"}"><b>Sample ${i + 1}: ${x.ok ? "Passed" : "Failed"}</b><p class="note">Your output</p><pre>${esc(x.actual || "(no output)")}</pre>${x.ok ? "" : `<p class="note">Expected output</p><pre>${esc(x.expected || "(no output)")}</pre>`}</div>`).join(""));
      } else {
        const r = await C.runWithHarness(ed.get(), p.harness);
        if (r.phase !== "done") showErr(r); else outBox("", `Harness output <span class="note" style="font-weight:400">(${r.ms} ms)</span>`, `<pre>${esc(r.out || "(no output)")}</pre><p class="note" style="margin-top:8px">This is a local educational harness. Submit performs the same browser-side comparison.</p>`);
      }
    } catch (e) { outBox("bad", "Could not run", `<pre>${esc(e.message || e)}</pre>`); } finally { busy(false); }
  }
  async function submit() {
    busy(true); outBox("", '<span class="spin"></span> Running the tests...', "");
    try {
      const C = await getC(); const r = await C.checkProblem(p, ed.get());
      if (r.ok) { store.record(id, true); outBox("ok", `✓ Accepted - all ${r.lines} output line${r.lines > 1 ? "s" : ""} match`, `<p>Well done! ${isProg ? `Passed ${r.tests} test input${r.tests > 1 ? "s" : ""}.` : ""}</p><p class="note" style="margin-top:6px">Interview habit: explain the solution out loud with its time and memory cost.</p>`); toast("Accepted! Problem solved."); }
      else if (r.phase === "wrong") { store.record(id, false); outBox("bad", `✗ Wrong answer${isProg ? ` on evaluation case ${r.testIndex + 1}` : ""}`, `${r.hidden ? "<p class=\"note\">An evaluation case failed. Its private input and expected output are not shown.</p>" : `<div class="diff"><b>yours</b><span class="you">${esc(r.you)}</span><b>expected</b><span class="exp">${esc(r.exp)}</span></div>`}<p class="note">${r.passedLines} of ${r.totalLines} lines matched before this case.</p>`); }
      else if (r.phase === "internal") outBox("warn", "Checker problem", `<pre>${esc(r.err)}</pre>`);
      else { store.record(id, false); showErr(r); }
    } catch (e) { outBox("bad", "Could not run the tests", `<pre>${esc(e.message || e)}</pre>`); } finally { busy(false); }
  }
  $("#run").onclick = run; $("#submit").onclick = submit; $("#ed").addEventListener("run", run);
  wireSolution(box => { box.innerHTML = `<pre class="code">${esc(p.solution)}</pre><button class="btn btn--sm btn--ghost" id="useSol">Load it into the editor</button>`; $("#useSol").onclick = () => { if (confirm("Replace your code with the reference solution?")) ed.set(p.solution); }; });
}

/* ---------------- Verilog ---------------- */
function compilePorts(src, top) { try { const r = autoRun(src, { top, cycles: 1 }); return r.design.ports.map(p => ({ name: p.name, dir: p.dir, w: p.w })); } catch (e) { return []; } }
export function vWorkspace(q, head, after) {
  const p = q.prob, id = q.id, sp = p.spec;
  const how = sp.kind === "comb" ? "Your module is simulated next to a reference design for every input combination (or 400 random ones for wide inputs) and the outputs are compared."
    : `Your module is clocked for ${sp.cycles || 40} cycles with random inputs${sp.reset ? `, starting with ${sp.reset.name} = ${sp.reset.active}` : ""}. Outputs are compared with a reference after inputs change and after every rising edge of <code>${sp.clk}</code>.`;
  app().innerHTML = `<div class="wrap page"><div class="ws">
<section class="ws-desc">${descPanel(q, head, `<p class="note">${how}</p>`)}${after || ""}</section>
<section class="ws-main">
 <div class="edwrap"><div class="edbar"><span class="fname">${esc(sp.top)}.v</span><button class="btn btn--sm btn--ghost" id="reset">Reset</button><button class="btn btn--sm btn--ink" id="run">▶ Simulate</button><button class="btn btn--sm btn--red" id="submit">Submit</button></div><div id="ed"></div></div>
 <div class="out" id="out"><div class="out-h">Simulation</div><div class="out-b"><p class="note"><b>Simulate</b> drives your design with sample inputs and draws the waveform. <b>Submit</b> checks it against the reference. Ctrl+Enter simulates.</p></div></div>
 <p class="note">Software simulation: a two-state (0/1, no X or Z) cycle-based Verilog simulator written for this site. It checks logic, not gate delays or synthesis results.</p>
</section></div></div>`;
  const ed = makeEditor($("#ed"), store.code(id) || p.starter, "text/x-verilog", v => store.setCode(id, v));
  $("#reset").onclick = () => { if (confirm("Replace your code with the starter code?")) { ed.set(p.starter); store.clearCode(id); } };
  function run() {
    try { const r = autoRun(ed.get(), { top: sp.top, cycles: 16 }); outBox("", `Waveform <span class="note" style="font-weight:400">(sample inputs${r.clk ? ", " + r.clk + " driven automatically" : ""})</span>`, `<div id="wv"></div>${warnHtml(r.warnings)}${r.log ? `<p class="note" style="margin-top:8px">$display output:</p><pre>${esc(r.log)}</pre>` : ""}`); waveform($("#wv"), r.trace, r.design.ports); }
    catch (e) { if (e.line) ed.markLine(e.line); outBox("bad", "✗ Error", `<pre>${esc(e.message)}</pre>`); }
  }
  function submit() {
    const r = checkDesign(ed.get(), p.solution, sp);
    if (r.error) { if (r.errorLine) ed.markLine(r.errorLine); outBox("bad", "✗ Cannot check yet", `<pre>${esc(r.error)}</pre>${warnHtml(r.warnings)}`); return; }
    store.record(id, !!r.ok);
    if (r.ok) { outBox("ok", `✓ Accepted - ${r.passed} checks passed`, `<p>Your design matches the reference on every check.</p>${warnHtml(r.warnings)}<div id="wv" style="margin-top:10px"></div>`); toast("Accepted! Problem solved."); }
    else { const m = r.mismatch; outBox("bad", `✗ Mismatch at ${esc(m.label)}`, `<p class="note">Inputs: <code>${esc(m.inputs)}</code></p><div class="diff">${m.outs.map(o => `<b>${esc(o.name)}</b><span><span class="you">yours ${esc(o.you)}</span> · <span class="exp">expected ${esc(o.exp)}</span></span>`).join("")}</div><p class="note">${r.passed} checks passed before this. The red column in the waveform is the first mismatch.</p>${warnHtml(r.warnings)}<div id="wv" style="margin-top:10px"></div>`); }
    waveform($("#wv"), r.trace, compilePorts(p.solution, sp.top), { compare: true });
  }
  $("#run").onclick = run; $("#submit").onclick = submit; $("#ed").addEventListener("run", run);
  wireSolution(box => { box.innerHTML = `<pre class="code">${esc(p.solution)}</pre><button class="btn btn--sm btn--ghost" id="useSol">Load it into the editor</button>`; $("#useSol").onclick = () => { if (confirm("Replace your code with the reference solution?")) ed.set(p.solution); }; });
}

/* ---------------- Circuit ---------------- */
export function kWorkspace(q, head, after) {
  const p = q.prob, id = q.id;
  const pal = p.allowed ? [...p.allowed] : PALETTE.filter(t => !["IN", "OUT", "CLK"].includes(t));
  app().innerHTML = `<div class="wrap page"><div class="ws ws--lab">
<section class="ws-desc">${descPanel(q, head, `<p class="note">${p.allowed ? `<b>Allowed parts:</b> ${p.allowed.join(", ")}. ` : ""}${p.par ? `Target: <b>${p.par} gate${p.par > 1 ? "s" : ""}</b> or fewer for a star.` : ""}</p><p class="note">Add parts from the left bar, drag from a pin to another pin to wire them, click inputs to test. The labelled pins are fixed.</p>`)}${after || ""}</section>
<section class="ws-main"><div id="lab"></div>
<div class="row"><button class="btn btn--red" id="check">Check circuit</button><button class="btn btn--ghost" id="resetC">Start over</button><span class="note" id="gcount"></span></div>
<div class="out" id="out"><div class="out-h">Result</div><div class="out-b"><p class="note">Press <b>Check circuit</b> to test every input combination${p.seq ? " (and clock sequence)" : ""}.</p></div></div>
<p class="note">Software simulation of ideal logic: zero gate delay, no glitches or electrical effects.</p></section></div></div>`;
  let editor;
  const count = () => { const n = editor.circ.comps.filter(c => !["IN", "OUT", "CLK", "ONE", "ZERO"].includes(c.type)).length; $("#gcount").textContent = `${n} gate${n === 1 ? "" : "s"} used${p.par ? ` · target ${p.par}` : ""}`; };
  const mk = circ => { editor = new CircuitEditor($("#lab"), { circuit: circ, locked: lockedIds(p), palette: pal, width: 760, height: Math.max(420, 60 + Math.max(p.pins.in.length + (p.pins.clk ? 1 : 0), p.pins.out.length) * 80), onChange: c => { store.setCircuit(id, c); count(); } }); count(); };
  mk(store.circuit(id) || problemCircuit(p));
  $("#resetC").onclick = () => { if (confirm("Remove everything you built?")) { store.clearCircuit(id); mk(problemCircuit(p)); } };
  $("#check").onclick = () => {
    const r = checkCircuit(editor.circ, checkSpec(p));
    if (r.error) { $("#out").innerHTML = `<div class="out-h bad">✗ ${esc(r.error)}</div>`; return; }
    const ins = p.seq ? ["clock", ...p.pins.in] : p.pins.in;
    const visible = r.rows.slice(0, 2), hidden = r.rows.slice(2);
    const tbl = `<div style="overflow-x:auto"><table class="ttab"><tr>${ins.map(n => `<th>${esc(n)}</th>`).join("")}${p.pins.out.map((n, i) => `<th class="${i === 0 ? "sepc" : ""}">${esc(n)}</th>`).join("")}<th>expected</th></tr>${visible.map(row => `<tr class="${row.good ? "good" : "bad"}">${ins.map(n => `<td>${row.in[n] ?? ""}</td>`).join("")}${p.pins.out.map((n, i) => `<td class="o${i === 0 ? " sepc" : ""}">${row.got[n]}</td>`).join("")}<td>${p.pins.out.map(n => row.exp[n]).join(" ")}</td></tr>`).join("")}</table></div>${hidden.length ? `<p class="note" style="margin-top:8px">${hidden.filter(x => x.good).length} of ${hidden.length} additional evaluation checks passed. Their vectors are not shown.</p>` : ""}`;
    store.record(id, !!r.ok);
    if (r.ok) { const star = p.par && r.gates <= p.par; $("#out").innerHTML = `<div class="out-h ok">✓ Correct${star ? " ★ with the minimum gate count" : ""}</div><div class="out-b"><p>${r.gates} gate${r.gates === 1 ? "" : "s"} used${p.par && !star ? ` - it can be done with ${p.par}. Try again for the star!` : "."}</p>${tbl}</div>`; toast(star ? "Correct, and minimal! ★" : "Correct!"); }
    else { const nb = r.rows.filter(x => !x.good).length; $("#out").innerHTML = `<div class="out-h bad">✗ ${nb} row${nb > 1 ? "s" : ""} wrong</div><div class="out-b"><p class="note">Red rows show where your outputs differ.</p>${tbl}</div>`; }
  };
  wireSolution(box => { box.innerHTML = `<p class="note">The reference uses ${p.par} gate${p.par > 1 ? "s" : ""}. Loading it replaces your circuit.</p><button class="btn btn--sm btn--ghost" id="useSol">Load the reference circuit</button>`; $("#useSol").onclick = () => { if (confirm("Replace your circuit with the reference solution?")) { const c = solutionCircuit(p); store.setCircuit(id, c); mk(c); } }; });
}
