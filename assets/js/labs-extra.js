/* ==========================================================================
   ECE Lab interactive models (educational, ideal behaviour):
   FSM stepper, RTOS scheduler timeline, setup/hold timing, RC circuit,
   tiny CPU (registers + memory), SPI and I2C waveforms.
   ========================================================================== */
import { esc } from "./widgets.js";
const $ = (s, r) => r.querySelector(s);
const COLORS = ["#2563EB", "#E63946", "#16A34A", "#D97706", "#9333EA", "#0D9488"];

/* =================================================================== FSM */
const FSMS = {
  det1011: { title: "1011 sequence detector (Moore, overlapping)", moore: true, start: "S0",
    states: { S0: { out: 0, n: ["S0", "S1"] }, S1: { out: 0, n: ["S10", "S1"] }, S10: { out: 0, n: ["S0", "S101"] }, S101: { out: 0, n: ["S10", "S1011"] }, S1011: { out: 1, n: ["S10", "S1"] } } },
  mealy101: { title: "101 detector (Mealy, overlapping)", moore: false, start: "A",
    states: { A: { n: ["A", "B"], o: [0, 0] }, B: { n: ["C", "B"], o: [0, 0] }, C: { n: ["A", "B"], o: [0, 1] } } },
  parity: { title: "Even-parity checker (Moore)", moore: true, start: "EVEN", states: { EVEN: { out: 0, n: ["EVEN", "ODD"] }, ODD: { out: 1, n: ["ODD", "EVEN"] } } },
  traffic: { title: "Traffic light (Moore, input = timer done)", moore: true, start: "GREEN", outName: "light",
    states: { GREEN: { out: "G", n: ["GREEN", "YELLOW"] }, YELLOW: { out: "Y", n: ["YELLOW", "RED"] }, RED: { out: "R", n: ["RED", "GREEN"] } } },
};
export function fsmWidget(host) {
  let key = "det1011", F, cur, hist;
  const reset = () => { F = JSON.parse(JSON.stringify(FSMS[key])); cur = F.start; hist = []; };
  reset();
  host.innerHTML = `<div class="wg"><div class="wg__t">FSM stepper</div><div class="wg__d">Feed input bits one clock at a time and watch the state machine move. Edit the next-state table to design your own.</div>
<div class="row"><select data-k aria-label="Machine">${Object.entries(FSMS).map(([k, v]) => `<option value="${k}">${esc(v.title)}</option>`).join("")}</select>
<button class="btn btn--sm btn--ink" data-in="0">Input 0 ▸ clock</button><button class="btn btn--sm btn--ink" data-in="1">Input 1 ▸ clock</button><button class="btn btn--sm btn--ghost" data-rst>Reset</button></div>
<div data-svg style="margin-top:10px"></div><div class="row" style="align-items:flex-start;gap:18px;margin-top:8px"><div data-tbl style="overflow-x:auto"></div><div data-hist style="flex:1;min-width:200px"></div></div>
<input data-seq placeholder="Or type a sequence like 1011011 and press Enter" class="numin" style="width:100%;margin-top:8px" aria-label="Input sequence"></div>`;
  const ids = () => Object.keys(F.states);
  const outOf = (s, b) => F.moore ? F.states[s].out : F.states[s].o[b];
  function draw() {
    const S = ids(), n = S.length, W = 560, H = 270, cx = W / 2, cy = H / 2 + 14, R = Math.min(170, 60 + n * 22), RY = 78;
    const pos = {}; S.forEach((s, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; pos[s] = [cx + R * Math.cos(a), cy + RY * Math.sin(a)]; });
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:620px;height:auto;display:block;margin:0 auto"><defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink2)"/></marker></defs>`;
    const last = hist[hist.length - 1];
    S.forEach(s => [0, 1].forEach(b => {
      const t = F.states[s].n[b]; const [x1, y1] = pos[s], [x2, y2] = pos[t]; const lab = F.moore ? b : `${b}/${F.states[s].o[b]}`;
      const hot = last && last.from === s && last.inp === b;
      if (s === t) { svg += `<path d="M${x1 - 10} ${y1 - 20} C ${x1 - 34} ${y1 - 62}, ${x1 + 34} ${y1 - 62}, ${x1 + 10} ${y1 - 20}" fill="none" stroke="${hot ? "var(--red)" : "var(--ink2)"}" stroke-width="${hot ? 2.6 : 1.4}" marker-end="url(#fa)"/><text x="${x1}" y="${y1 - 52}" text-anchor="middle" class="fsm-l">${lab}</text>`; return; }
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, off = 10;
      const sx = x1 + ux * 22 - uy * off, sy = y1 + uy * 22 + ux * off, ex = x2 - ux * 24 - uy * off, ey = y2 - uy * 24 + ux * off;
      const mx = (sx + ex) / 2 - uy * 16, my = (sy + ey) / 2 + ux * 16;
      svg += `<path d="M${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}" fill="none" stroke="${hot ? "var(--red)" : "var(--ink2)"}" stroke-width="${hot ? 2.6 : 1.4}" marker-end="url(#fa)"/><text x="${mx}" y="${my}" text-anchor="middle" class="fsm-l">${lab}</text>`;
    }));
    S.forEach(s => { const [x, y] = pos[s], on = s === cur; svg += `<circle cx="${x}" cy="${y}" r="22" fill="${on ? "var(--red)" : "var(--card)"}" stroke="var(--ink)" stroke-width="2"/>${s === F.start ? `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="var(--ink2)" stroke-dasharray="3 3"/>` : ""}<text x="${x}" y="${y + (F.moore ? -1 : 4)}" text-anchor="middle" class="fsm-s" fill="${on ? "#fff" : "var(--ink)"}">${esc(s)}</text>${F.moore ? `<text x="${x}" y="${y + 12}" text-anchor="middle" class="fsm-o" fill="${on ? "#fff" : "var(--mute)"}">${esc(String(F.states[s].out))}</text>` : ""}`; });
    $("[data-svg]", host).innerHTML = svg + "</svg>";
    $("[data-tbl]", host).innerHTML = `<table class="ttab"><tr><th>State</th>${F.moore ? "<th>Output</th>" : ""}<th>in=0 →</th><th>in=1 →</th>${F.moore ? "" : "<th>out 0/1</th>"}</tr>${S.map(s => `<tr${s === cur ? ' class="bad"' : ""}><td>${esc(s)}</td>${F.moore ? `<td>${esc(String(F.states[s].out))}</td>` : ""}${[0, 1].map(b => `<td><select data-ed="${s}:${b}">${S.map(x => `<option ${x === F.states[s].n[b] ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></td>`).join("")}${F.moore ? "" : `<td>${F.states[s].o.join(" / ")}</td>`}</tr>`).join("")}</table>`;
    $("[data-hist]", host).innerHTML = hist.length ? `<table class="ttab"><tr><th>clk</th><th>state</th><th>in</th><th>next</th><th>${esc(F.outName || "out")}</th></tr>${hist.slice(-10).map(h => `<tr><td>${h.k}</td><td>${esc(h.from)}</td><td>${h.inp}</td><td>${esc(h.to)}</td><td class="o">${esc(String(h.out))}</td></tr>`).join("")}</table>` : `<p class="note">Current state <b>${esc(cur)}</b>. Press an input button to apply one clock edge.</p>`;
  }
  const step = b => { const to = F.states[cur].n[b]; const out = F.moore ? F.states[to].out : outOf(cur, b); hist.push({ k: hist.length + 1, from: cur, inp: b, to, out }); cur = to; draw(); };
  host.addEventListener("click", e => { const b = e.target.closest("[data-in]"); if (b) step(+b.dataset.in); if (e.target.closest("[data-rst]")) { cur = F.start; hist = []; draw(); } });
  host.addEventListener("change", e => { if (e.target.matches("[data-k]")) { key = e.target.value; reset(); draw(); } const ed = e.target.closest("[data-ed]"); if (ed) { const [s, b] = ed.dataset.ed.split(":"); F.states[s].n[+b] = ed.value; draw(); } });
  $("[data-seq]", host).addEventListener("keydown", e => { if (e.key !== "Enter") return; const v = e.target.value.replace(/[^01]/g, ""); [...v].forEach(c => step(+c)); e.target.value = ""; });
  draw();
}

/* =================================================================== RTOS scheduler */
const RT_PRESETS = {
  periodic: { title: "Three periodic tasks (fixed-priority preemptive)", inherit: false, slice: false, ticks: 24,
    tasks: [{ name: "Sensor", prio: 3, period: 4, exec: 1 }, { name: "Control", prio: 2, period: 6, exec: 2 }, { name: "Logger", prio: 1, period: 12, exec: 3 }] },
  inversion: { title: "Priority inversion (shared mutex, no inheritance)", inherit: false, slice: false, ticks: 20,
    tasks: [{ name: "High", prio: 3, period: 20, exec: 2, offset: 2, cs: [0, 2] }, { name: "Medium", prio: 2, period: 20, exec: 6, offset: 3 }, { name: "Low", prio: 1, period: 20, exec: 4, offset: 0, cs: [1, 3] }] },
  inherit: { title: "Same tasks with priority inheritance", inherit: true, slice: false, ticks: 20,
    tasks: [{ name: "High", prio: 3, period: 20, exec: 2, offset: 2, cs: [0, 2] }, { name: "Medium", prio: 2, period: 20, exec: 6, offset: 3 }, { name: "Low", prio: 1, period: 20, exec: 4, offset: 0, cs: [1, 3] }] },
  rr: { title: "Equal priorities with time slicing (round robin)", inherit: false, slice: true, ticks: 16,
    tasks: [{ name: "A", prio: 1, period: 16, exec: 4 }, { name: "B", prio: 1, period: 16, exec: 4 }, { name: "C", prio: 1, period: 16, exec: 3 }] },
  overload: { title: "Overloaded: utilisation above 100%", inherit: false, slice: false, ticks: 24,
    tasks: [{ name: "Fast", prio: 3, period: 3, exec: 1 }, { name: "Mid", prio: 2, period: 4, exec: 2 }, { name: "Slow", prio: 1, period: 6, exec: 2 }] },
};
export function simulateRtos(tasks, ticks, opts) {
  const jobs = [], rows = tasks.map(() => []), events = [];
  let holder = null, lastRun = null, rr = 0;
  for (let t = 0; t < ticks; t++) {
    tasks.forEach((k, i) => { const off = k.offset || 0; if (t >= off && (t - off) % k.period === 0) { const old = jobs.find(j => j.task === i && j.rem > 0); if (old) { events.push({ t, i, miss: true }); old.missed = true; } jobs.push({ task: i, rem: k.exec, done: 0, rel: t, dl: t + k.period }); events.push({ t, i, rel: true }); } });
    const ready = jobs.filter(j => j.rem > 0);
    const eff = j => { let p = tasks[j.task].prio; if (opts.inherit && holder === j) ready.forEach(o => { if (o.waiting) p = Math.max(p, tasks[o.task].prio); }); return p; };
    ready.forEach(j => { const cs = tasks[j.task].cs; j.waiting = !!(cs && j.done === cs[0] && holder && holder !== j); });
    const runnable = ready.filter(j => !j.waiting);
    let run = null;
    if (runnable.length) {
      const top = Math.max(...runnable.map(eff)); const cands = runnable.filter(j => eff(j) === top);
      if (cands.length > 1 && opts.slice) { run = cands[rr % cands.length]; rr++; }
      else run = cands.includes(lastRun) ? lastRun : cands[0];
    }
    tasks.forEach((k, i) => { const j = ready.find(x => x.task === i); rows[i][t] = !j ? "" : j === run ? (holder === j || (tasks[i].cs && j.done === tasks[i].cs[0]) ? "cs" : "run") : j.waiting ? "block" : "ready"; });
    if (run) {
      const cs = tasks[run.task].cs, inh = eff(run) > tasks[run.task].prio;
      if (cs && run.done === cs[0]) holder = run;
      run.rem--; run.done++;
      if (cs && run.done === cs[0] + cs[1] && holder === run) holder = null;
      if (inh) rows[run.task][t] = "inh";
      if (run.rem === 0) { run.end = t + 1; if (run.end > run.dl) events.push({ t: run.end, i: run.task, late: true }); }
    }
    lastRun = run;
  }
  const U = tasks.reduce((s, k) => s + k.exec / k.period, 0), n = tasks.length;
  const resp = tasks.map((k, i) => { const js = jobs.filter(j => j.task === i && j.end != null); return js.length ? Math.max(...js.map(j => j.end - j.rel)) : null; });
  return { rows, events, U, bound: n * (Math.pow(2, 1 / n) - 1), resp, missed: events.filter(e => e.miss || e.late).length };
}
export function rtosWidget(host) {
  let P = JSON.parse(JSON.stringify(RT_PRESETS.periodic));
  host.innerHTML = `<div class="wg"><div class="wg__t">RTOS scheduler timeline</div><div class="wg__d">An ideal single-core, tick-based scheduler like FreeRTOS: the highest-priority ready task runs; equal priorities share the CPU when time slicing is on. Edit the tasks and watch preemption, blocking and priority inversion.</div>
<div class="row"><select data-p aria-label="Scenario">${Object.entries(RT_PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.title)}</option>`).join("")}</select>
<label class="chk"><input type="checkbox" data-inh> <span>Priority inheritance</span></label><label class="chk"><input type="checkbox" data-sl> <span>Time slicing</span></label>
<label class="note">ticks <input data-tk type="number" min="8" max="60" style="width:60px" class="numin"></label></div>
<div data-tbl style="overflow-x:auto;margin-top:10px"></div><div data-g style="overflow-x:auto;margin-top:10px"></div><div data-s class="kv"></div></div>`;
  const draw = () => {
    $("[data-inh]", host).checked = P.inherit; $("[data-sl]", host).checked = P.slice; $("[data-tk]", host).value = P.ticks;
    $("[data-tbl]", host).innerHTML = `<table class="ttab rt-tbl"><tr><th>Task</th><th>Priority</th><th>Period</th><th>Exec</th><th>Start</th><th>Mutex at / for</th></tr>${P.tasks.map((k, i) => `<tr><td><span class="sw" style="background:${COLORS[i % 6]}"></span>${esc(k.name)}</td>${["prio", "period", "exec", "offset"].map(f => `<td><input type="number" min="${f === "offset" ? 0 : 1}" max="60" value="${k[f] || 0}" data-f="${i}:${f}" aria-label="${k.name} ${f}"></td>`).join("")}<td><input type="text" value="${k.cs ? k.cs.join("/") : ""}" placeholder="-" data-f="${i}:cs" style="width:56px" aria-label="${k.name} mutex"></td></tr>`).join("")}</table>`;
    const r = simulateRtos(P.tasks, P.ticks, P), cw = 22, nw = 80, W = nw + P.ticks * cw + 10, H = P.tasks.length * 30 + 28;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    for (let t = 0; t <= P.ticks; t++) s += `<line x1="${nw + t * cw}" y1="0" x2="${nw + t * cw}" y2="${H - 16}" class="wv-grid"/>${t % 2 === 0 ? `<text x="${nw + t * cw}" y="${H - 4}" class="wv-step" text-anchor="middle">${t}</text>` : ""}`;
    P.tasks.forEach((k, i) => {
      const y = i * 30 + 4; s += `<text x="4" y="${y + 15}" class="wv-name">${esc(k.name)} (p${k.prio})</text>`;
      r.rows[i].forEach((c, t) => { if (!c) return; const x = nw + t * cw + 1; const col = COLORS[i % 6];
        s += c === "run" ? `<rect x="${x}" y="${y}" width="${cw - 2}" height="20" rx="2" fill="${col}"/>` : c === "cs" ? `<rect x="${x}" y="${y}" width="${cw - 2}" height="20" rx="2" fill="${col}"/><text x="${x + cw / 2 - 1}" y="${y + 14}" text-anchor="middle" class="rt-m">M</text>`
          : c === "inh" ? `<rect x="${x}" y="${y}" width="${cw - 2}" height="20" rx="2" fill="${col}" stroke="var(--ink)" stroke-width="2"/><text x="${x + cw / 2 - 1}" y="${y + 14}" text-anchor="middle" class="rt-m">↑</text>`
            : c === "block" ? `<rect x="${x}" y="${y + 6}" width="${cw - 2}" height="8" fill="none" stroke="${col}" stroke-dasharray="3 2"/>` : `<rect x="${x}" y="${y + 8}" width="${cw - 2}" height="4" fill="${col}" opacity=".35"/>`; });
    });
    r.events.forEach(e => { const x = nw + e.t * cw, y = e.i * 30 + 4; s += e.rel ? `<path d="M${x} ${y - 3} v6 m-3 -3 l3 3 l3 -3" stroke="var(--ink2)" fill="none"/>` : `<text x="${x}" y="${y + 15}" class="rt-x" text-anchor="middle">✗</text>`; });
    $("[data-g]", host).innerHTML = s + "</svg>";
    $("[data-s]", host).innerHTML = `<span>CPU utilisation U = <b>${(100 * r.U).toFixed(1)}%</b></span><span>RMS bound for ${P.tasks.length} tasks = <b>${(100 * r.bound).toFixed(1)}%</b></span><span>Worst response: ${P.tasks.map((k, i) => `${esc(k.name)} <b>${r.resp[i] ?? "-"}</b>`).join(", ")}</span><span>Deadline misses: <b style="color:${r.missed ? "var(--red)" : "var(--green)"}">${r.missed}</b></span>
<span class="note" style="flex-basis:100%">Solid = running · M = running inside the mutex · ↑ = running with inherited priority · dashed = blocked on the mutex · thin = ready, waiting for CPU · ↓ = release · ✗ = deadline miss. Context-switch time is taken as zero.</span>`;
  };
  host.addEventListener("change", e => {
    if (e.target.matches("[data-p]")) P = JSON.parse(JSON.stringify(RT_PRESETS[e.target.value]));
    else if (e.target.matches("[data-inh]")) P.inherit = e.target.checked;
    else if (e.target.matches("[data-sl]")) P.slice = e.target.checked;
    else if (e.target.matches("[data-tk]")) P.ticks = Math.max(8, Math.min(60, +e.target.value || 20));
    else if (e.target.dataset.f) { const [i, f] = e.target.dataset.f.split(":"); if (f === "cs") { const m = /^(\d+)\s*\/\s*(\d+)$/.exec(e.target.value.trim()); P.tasks[i].cs = m ? [+m[1], +m[2]] : null; } else P.tasks[i][f] = Math.max(f === "offset" ? 0 : 1, +e.target.value || 0); }
    draw();
  });
  draw();
}

/* =================================================================== setup / hold */
export function timingWidget(host) {
  const v = { clk: 5, tcq: 0.4, cmax: 3.2, cmin: 0.3, tsu: 0.3, th: 0.2, skew: 0.2 };
  const F = [["clk", "Clock period (ns)"], ["tcq", "Clock-to-Q (ns)"], ["cmax", "Logic delay max (ns)"], ["cmin", "Logic delay min (ns)"], ["tsu", "Setup time (ns)"], ["th", "Hold time (ns)"], ["skew", "Clock skew, capture − launch (ns)"]];
  host.innerHTML = `<div class="wg"><div class="wg__t">Setup and hold calculator</div><div class="wg__d">One register-to-register path. Change the numbers and see both checks and the timing picture.</div>
<div class="calc">${F.map(([k, l]) => `<label>${l}<input type="number" step="0.1" data-k="${k}" value="${v[k]}"></label>`).join("")}</div><div data-r class="kv"></div><div data-svg style="margin-top:8px;overflow-x:auto"></div>
<p class="note">Setup slack = T<sub>clk</sub> + skew − (t<sub>cq</sub> + t<sub>logic,max</sub> + t<sub>su</sub>). Hold slack = t<sub>cq</sub> + t<sub>logic,min</sub> − t<sub>hold</sub> − skew. Ideal model: no jitter, OCV or uncertainty.</p></div>`;
  const draw = () => {
    const su = v.clk + v.skew - (v.tcq + v.cmax + v.tsu), ho = v.tcq + v.cmin - v.th - v.skew, need = v.tcq + v.cmax + v.tsu - v.skew;
    $("[data-r]", host).innerHTML = `<span>Setup slack <b style="color:${su >= 0 ? "var(--green)" : "var(--red)"}">${su.toFixed(2)} ns</b> ${su >= 0 ? "met" : "VIOLATED"}</span><span>Hold slack <b style="color:${ho >= 0 ? "var(--green)" : "var(--red)"}">${ho.toFixed(2)} ns</b> ${ho >= 0 ? "met" : "VIOLATED"}</span><span>f<sub>max</sub> = <b>${need > 0 ? (1000 / need).toFixed(1) : "∞"} MHz</b></span>`;
    const W = 560, x0 = 96, sc = (W - x0 - 16) / Math.max(v.clk * 1.35, need * 1.1), X = t => x0 + t * sc;
    const clk = (y, sh, lab) => { let d = `M${X(0 + sh) - 20} ${y + 24} H${X(sh)}`; for (let k = 0; k < 2; k++) { const a = X(sh + k * v.clk), b = X(sh + k * v.clk + v.clk / 2), c = X(sh + (k + 1) * v.clk); d += ` V${y} H${b} V${y + 24} H${c}`; } return `<text x="4" y="${y + 16}" class="wv-name">${lab}</text><path d="${d}" class="wv-line"/>`; };
    const arr = v.tcq + v.cmax, cap = v.clk + v.skew;
    let s = `<svg viewBox="0 0 ${W} 190" style="width:100%;max-width:680px;min-width:480px;height:auto">${clk(10, 0, "CLK launch")}${clk(52, v.skew, "CLK capture")}`;
    const bus = (x1, x2, lab, cls) => x2 - x1 < 12 ? "" : `<path d="M${x1} 108 L${x1 + 5} 98 H${x2 - 5} L${x2} 108 L${x2 - 5} 118 H${x1 + 5} Z" class="wv-bus ${cls}"/>${x2 - x1 > lab.length * 6.5 ? `<text x="${(x1 + x2) / 2}" y="111" text-anchor="middle" class="wv-val">${lab}</text>` : ""}`;
    s += `<text x="4" y="112" class="wv-name">D (capture)</text>${bus(x0, Math.min(X(arr), W - 10), "settling", "exp")}${bus(Math.min(X(arr), W - 10), W - 10, "new data valid", "out")}`;
    s += `<rect x="${X(cap - v.tsu)}" y="92" width="${v.tsu * sc}" height="32" fill="rgba(230,57,70,.18)"/><rect x="${X(cap)}" y="92" width="${v.th * sc}" height="32" fill="rgba(217,119,6,.22)"/>`;
    s += `<line x1="${X(cap)}" y1="40" x2="${X(cap)}" y2="140" stroke="var(--red)" stroke-dasharray="4 3"/><text x="${X(cap)}" y="152" class="wv-step" text-anchor="middle">capture edge</text>`;
    s += `<text x="${X(arr)}" y="170" class="wv-step" text-anchor="middle">data arrives ${arr.toFixed(2)} ns</text><text x="${x0}" y="186" class="wv-step">shaded: setup window (red) and hold window (amber) around the capture edge</text></svg>`;
    $("[data-svg]", host).innerHTML = s;
  };
  host.addEventListener("input", e => { const k = e.target.dataset.k; if (k) { v[k] = +e.target.value || 0; draw(); } });
  draw();
}

/* =================================================================== RC */
export function rcWidget(host) {
  const v = { r: 10, c: 1, vin: 5 }; // kOhm, uF
  host.innerHTML = `<div class="wg"><div class="wg__t">RC charging and low-pass filter</div><div class="wg__d">Ideal resistor and capacitor driven by a step. The same RC sets the time constant and the −3 dB cut-off frequency.</div>
<div class="calc"><label>R (kΩ)<input type="number" step="0.1" data-k="r" value="10"></label><label>C (µF)<input type="number" step="0.01" data-k="c" value="1"></label><label>Step voltage (V)<input type="number" step="0.1" data-k="vin" value="5"></label></div>
<div data-r class="kv"></div><div class="grid g2" style="margin-top:8px"><div data-t></div><div data-f></div></div></div>`;
  const draw = () => {
    const tau = v.r * 1e3 * v.c * 1e-6, fc = 1 / (2 * Math.PI * tau);
    const fmtT = t => t >= 1 ? t.toFixed(3) + " s" : t >= 1e-3 ? (t * 1e3).toFixed(3) + " ms" : (t * 1e6).toFixed(2) + " µs";
    const fmtF = f => f >= 1e6 ? (f / 1e6).toFixed(2) + " MHz" : f >= 1e3 ? (f / 1e3).toFixed(2) + " kHz" : f.toFixed(2) + " Hz";
    $("[data-r]", host).innerHTML = `<span>τ = RC = <b>${fmtT(tau)}</b></span><span>63.2% at τ = <b>${(0.632 * v.vin).toFixed(2)} V</b></span><span>≈ fully charged at 5τ = <b>${fmtT(5 * tau)}</b></span><span>f<sub>c</sub> = 1/(2πRC) = <b>${fmtF(fc)}</b></span>`;
    const W = 420, H = 200, P = 34;
    let d = ""; for (let i = 0; i <= 100; i++) { const t = 5 * i / 100; const y = v.vin * (1 - Math.exp(-t)); d += `${i ? "L" : "M"}${P + (W - P - 6) * i / 100} ${H - 20 - (H - 34) * y / v.vin}`; }
    const tx = P + (W - P - 6) / 5;
    $("[data-t]", host).innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart"><line x1="${P}" x2="${W - 6}" y1="${H - 20}" y2="${H - 20}" class="ch-grid"/><path d="${d}" fill="none" stroke="var(--blue)" stroke-width="2.2"/><line x1="${tx}" x2="${tx}" y1="14" y2="${H - 20}" class="ch-grid" stroke-dasharray="3 3"/><circle cx="${tx}" cy="${H - 20 - (H - 34) * 0.632}" r="3.5" fill="var(--red)"/><text x="${tx + 4}" y="${H - 20 - (H - 34) * 0.632 - 6}" class="ch-ax">63.2%</text>${[0, 1, 2, 3, 4, 5].map(k => `<text x="${P + (W - P - 6) * k / 5}" y="${H - 6}" class="ch-ax" text-anchor="middle">${k}τ</text>`).join("")}<text x="4" y="18" class="ch-ax">V<tspan dy="2" font-size="8">C</tspan></text></svg><p class="note">Capacitor voltage after the step</p>`;
    let g = ""; for (let i = 0; i <= 100; i++) { const lf = -2 + 4 * i / 100, f = Math.pow(10, lf) * fc, db = -10 * Math.log10(1 + (f / fc) ** 2); g += `${i ? "L" : "M"}${P + (W - P - 6) * i / 100} ${14 + (H - 34) * (-db) / 40}`; }
    $("[data-f]", host).innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart">${[0, -10, -20, -30, -40].map(db => `<line x1="${P}" x2="${W - 6}" y1="${14 + (H - 34) * -db / 40}" y2="${14 + (H - 34) * -db / 40}" class="ch-grid"/><text x="${P - 4}" y="${17 + (H - 34) * -db / 40}" class="ch-ax" text-anchor="end">${db}</text>`).join("")}<path d="${g}" fill="none" stroke="var(--violet)" stroke-width="2.2"/><line x1="${P + (W - P - 6) / 2}" x2="${P + (W - P - 6) / 2}" y1="14" y2="${H - 20}" stroke="var(--red)" stroke-dasharray="3 3"/><text x="${P + (W - P - 6) / 2 + 4}" y="${14 + (H - 34) * 3 / 40 + 12}" class="ch-ax">f<tspan dy="2" font-size="8">c</tspan><tspan dy="-2">: −3 dB</tspan></text>${["fc/100", "fc/10", "fc", "10fc", "100fc"].map((l, k) => `<text x="${P + (W - P - 6) * k / 4}" y="${H - 6}" class="ch-ax" text-anchor="middle">${l}</text>`).join("")}</svg><p class="note">Low-pass gain (dB) vs frequency: −20 dB per decade above f<sub>c</sub></p>`;
  };
  host.addEventListener("input", e => { const k = e.target.dataset.k; if (k) { v[k] = Math.max(1e-6, +e.target.value || 0); draw(); } });
  draw();
}

/* =================================================================== tiny CPU */
const CPU_EX = {
  sum: { t: "Sum 1 to 5 into R0", src: "; R0 = 1 + 2 + 3 + 4 + 5\n      LDI R0, 0\n      LDI R1, 5\nloop: ADD R0, R1\n      DEC R1\n      JNZ loop\n      ST  R0, [0]\n      OUT R0\n      HLT" },
  mul: { t: "Multiply 6 x 7 by repeated addition", src: "      LDI R0, 0     ; result\n      LDI R1, 6     ; multiplicand\n      LDI R2, 7     ; counter\nloop: ADD R0, R1\n      DEC R2\n      JNZ loop\n      OUT R0\n      HLT" },
  mem: { t: "Fill memory 0..7 with squares", src: "      LDI R1, 0     ; i\n      LDI R3, 8\nloop: MOV R0, R1\n      LDI R2, 0\n      MOV R2, R1    ; R2 = i\n      LDI R0, 0\nsq:   ADD R0, R1    ; R0 += i, i times\n      DEC R2\n      JNZ sq\n      STR R0, [R1]  ; mem[i] = i*i\n      INC R1\n      MOV R2, R1\n      SUB R2, R3\n      JNZ loop\n      HLT" },
};
export function assemble(src) {
  const lines = src.split("\n"), prog = [], labels = {}, errs = [];
  lines.forEach((raw, ln) => { let l = raw.replace(/;.*/, "").trim(); if (!l) return; const m = /^(\w+):\s*(.*)$/.exec(l); if (m) { labels[m[1].toLowerCase()] = prog.length; l = m[2].trim(); if (!l) return; } prog.push({ ln, text: l }); });
  const reg = s => { const m = /^R([0-3])$/i.exec(s.trim()); if (!m) throw new Error(`expected a register R0-R3, got "${s.trim()}"`); return +m[1]; };
  const num = s => { s = s.trim(); const v = /^0x/i.test(s) ? parseInt(s, 16) : /^0b/i.test(s) ? parseInt(s.slice(2), 2) : parseInt(s, 10); if (isNaN(v)) throw new Error(`expected a number, got "${s}"`); return v & 255; };
  const ops = prog.map(p => {
    const [op0, ...rest] = p.text.split(/\s+/); const op = op0.toUpperCase(); const args = rest.join(" ").split(",").map(x => x.trim()).filter(Boolean);
    try {
      if (["LDI"].includes(op)) return { op, d: reg(args[0]), v: num(args[1]), ln: p.ln };
      if (["MOV", "ADD", "SUB", "AND", "OR", "XOR"].includes(op)) return { op, d: reg(args[0]), s: reg(args[1]), ln: p.ln };
      if (["INC", "DEC", "OUT"].includes(op)) return { op, d: reg(args[0]), ln: p.ln };
      if (op === "LD" || op === "ST") { const a = /^\[(.+)\]$/.exec(args[1] || ""); if (!a) throw new Error(`${op} needs an address like [3]`); return { op, d: reg(args[0]), a: num(a[1]) & 15, ln: p.ln }; }
      if (op === "LDR" || op === "STR") { const a = /^\[(.+)\]$/.exec(args[1] || ""); if (!a) throw new Error(`${op} needs a register address like [R1]`); return { op, d: reg(args[0]), r: reg(a[1]), ln: p.ln }; }
      if (["JMP", "JZ", "JNZ", "JC"].includes(op)) { const L = (args[0] || "").toLowerCase(); if (!(L in labels)) throw new Error(`unknown label "${args[0] || ""}"`); return { op, to: labels[L], ln: p.ln }; }
      if (op === "HLT" || op === "NOP") return { op, ln: p.ln };
      throw new Error(`unknown instruction "${op0}"`);
    } catch (e) { errs.push(`line ${p.ln + 1}: ${e.message}`); return { op: "NOP", ln: p.ln }; }
  });
  return { ops, errs };
}
export function cpuStep(S, ops) {
  if (S.halt || S.pc >= ops.length) { S.halt = true; return; }
  const I = ops[S.pc]; let next = S.pc + 1; S.lastW = null; S.lastR = null;
  const setZ = v => { S.z = (v & 255) === 0 ? 1 : 0; return v & 255; };
  switch (I.op) {
    case "LDI": S.r[I.d] = I.v; break;
    case "MOV": S.r[I.d] = S.r[I.s]; break;
    case "ADD": { const v = S.r[I.d] + S.r[I.s]; S.c = v > 255 ? 1 : 0; S.r[I.d] = setZ(v); break; }
    case "SUB": { const v = S.r[I.d] - S.r[I.s]; S.c = v < 0 ? 1 : 0; S.r[I.d] = setZ(v); break; }
    case "AND": S.r[I.d] = setZ(S.r[I.d] & S.r[I.s]); break;
    case "OR": S.r[I.d] = setZ(S.r[I.d] | S.r[I.s]); break;
    case "XOR": S.r[I.d] = setZ(S.r[I.d] ^ S.r[I.s]); break;
    case "INC": { const v = S.r[I.d] + 1; S.c = v > 255 ? 1 : 0; S.r[I.d] = setZ(v); break; }
    case "DEC": { const v = S.r[I.d] - 1; S.c = v < 0 ? 1 : 0; S.r[I.d] = setZ(v); break; }
    case "LD": S.r[I.d] = S.mem[I.a]; S.lastR = I.a; break;
    case "ST": S.mem[I.a] = S.r[I.d]; S.lastW = I.a; break;
    case "LDR": S.r[I.d] = S.mem[S.r[I.r] & 15]; S.lastR = S.r[I.r] & 15; break;
    case "STR": S.mem[S.r[I.r] & 15] = S.r[I.d]; S.lastW = S.r[I.r] & 15; break;
    case "JMP": next = I.to; break;
    case "JZ": if (S.z) next = I.to; break;
    case "JNZ": if (!S.z) next = I.to; break;
    case "JC": if (S.c) next = I.to; break;
    case "OUT": S.out.push(S.r[I.d]); break;
    case "HLT": S.halt = true; next = S.pc; break;
  }
  S.pc = next; S.cyc++;
}
export function cpuWidget(host) {
  let src = CPU_EX.sum.src, asm, S, timer = null;
  const reset = () => { asm = assemble(src); S = { pc: 0, r: [0, 0, 0, 0], mem: Array(16).fill(0), z: 0, c: 0, cyc: 0, out: [], halt: false }; };
  host.innerHTML = `<div class="wg"><div class="wg__t">Tiny CPU: registers, flags and memory</div><div class="wg__d">An 8-bit teaching CPU with 4 registers, Z and C flags and 16 bytes of RAM. Each Step runs one instruction (fetch, decode, execute) - real CPUs pipeline these.</div>
<div class="row"><select data-ex aria-label="Example program">${Object.entries(CPU_EX).map(([k, v]) => `<option value="${k}">${esc(v.t)}</option>`).join("")}</select><button class="btn btn--sm btn--ink" data-step>Step</button><button class="btn btn--sm btn--red" data-run>Run</button><button class="btn btn--sm btn--ghost" data-rst>Reset</button></div>
<div class="cpu"><div><textarea data-src class="cpu__src" spellcheck="false" aria-label="Assembly program"></textarea><div data-err class="note"></div></div><div data-st></div></div>
<details class="hint"><summary>Instruction set</summary><div><code>LDI Rd, n</code> load number · <code>MOV/ADD/SUB/AND/OR/XOR Rd, Rs</code> · <code>INC/DEC Rd</code> · <code>LD Rd, [addr]</code> / <code>ST Rs, [addr]</code> · <code>LDR/STR Rd, [Rn]</code> address in a register · <code>JMP/JZ/JNZ/JC label</code> · <code>OUT Rd</code> · <code>HLT</code>. Values are 8-bit; Z = result was zero, C = carry/borrow.</div></details></div>`;
  const ta = $("[data-src]", host); ta.value = src;
  const draw = () => {
    $("[data-err]", host).innerHTML = asm.errs.length ? `<span style="color:var(--red)">${asm.errs.map(esc).join("<br>")}</span>` : "";
    const curLn = asm.ops[S.pc] ? asm.ops[S.pc].ln : -1;
    const hex = v => v.toString(16).toUpperCase().padStart(2, "0");
    $("[data-st]", host).innerHTML = `<div class="cpu__regs">${S.r.map((v, i) => `<div><span>R${i}</span><b>${v}</b><small>0x${hex(v)}</small></div>`).join("")}<div><span>PC</span><b>${S.pc}</b><small>line ${curLn + 1}</small></div><div><span>Flags</span><b>Z${S.z} C${S.c}</b><small>${S.cyc} steps</small></div></div>
<div class="cpu__mem">${S.mem.map((v, i) => `<div class="${S.lastW === i ? "w" : S.lastR === i ? "r" : ""}"><span>${i}</span>${v}</div>`).join("")}</div>
<p class="note">Next: <code>${esc(asm.ops[S.pc] ? src.split("\n")[asm.ops[S.pc].ln].trim() : "(end)")}</code>${S.halt ? " · <b>halted</b>" : ""} · OUT: <b>${S.out.join(", ") || "-"}</b></p>`;
  };
  const stop = () => { clearInterval(timer); timer = null; $("[data-run]", host).textContent = "Run"; };
  host.addEventListener("click", e => {
    if (e.target.closest("[data-step]")) { if (asm.errs.length) return; cpuStep(S, asm.ops); draw(); }
    if (e.target.closest("[data-rst]")) { stop(); reset(); draw(); }
    if (e.target.closest("[data-run]")) { if (timer) return stop(); if (asm.errs.length) return; $("[data-run]", host).textContent = "Pause"; timer = setInterval(() => { cpuStep(S, asm.ops); draw(); if (S.halt || S.cyc > 2000) stop(); }, 220); }
  });
  host.addEventListener("change", e => { if (e.target.matches("[data-ex]")) { stop(); src = CPU_EX[e.target.value].src; ta.value = src; reset(); draw(); } });
  ta.addEventListener("input", () => { stop(); src = ta.value; reset(); draw(); });
  reset(); draw();
  return () => stop();
}

/* =================================================================== SPI / I2C */
export function busWidget(host) {
  const v = { bus: "spi", byte: "A5", mode: 0, msb: true, addr: "48", rw: 0, ack: true };
  host.innerHTML = `<div class="wg"><div class="wg__t">SPI and I2C waveforms</div><div class="wg__d">Ideal logic levels for one byte. Use it to check which edge samples data and what a full I2C transaction looks like.</div>
<div class="row"><div class="seg2"><button data-bus="spi" class="on">SPI</button><button data-bus="i2c">I2C</button></div><span data-opts class="row"></span></div><div data-svg style="overflow-x:auto;margin-top:10px"></div><p data-n class="note"></p></div>`;
  const opts = () => {
    $("[data-opts]", host).innerHTML = v.bus === "spi"
      ? `<label class="note">Byte (hex) <input data-k="byte" value="${v.byte}" maxlength="2" class="numin" style="width:56px"></label><label class="note">Mode <select data-k="mode">${[0, 1, 2, 3].map(m => `<option value="${m}" ${m === v.mode ? "selected" : ""}>${m} (CPOL ${m >> 1}, CPHA ${m & 1})</option>`).join("")}</select></label><label class="chk"><input type="checkbox" data-k="msb" ${v.msb ? "checked" : ""}> <span>MSB first</span></label>`
      : `<label class="note">Address (hex, 7-bit) <input data-k="addr" value="${v.addr}" maxlength="2" class="numin" style="width:56px"></label><label class="note">Data (hex) <input data-k="byte" value="${v.byte}" maxlength="2" class="numin" style="width:56px"></label><label class="note"><select data-k="rw"><option value="0" ${!v.rw ? "selected" : ""}>Write</option><option value="1" ${v.rw ? "selected" : ""}>Read</option></select></label><label class="chk"><input type="checkbox" data-k="ack" ${v.ack ? "checked" : ""}> <span>Slave ACKs</span></label>`;
  };
  const draw = () => {
    const byte = parseInt(v.byte, 16) & 255 || 0, bits = [...Array(8)].map((_, i) => (byte >> (v.msb || v.bus === "i2c" ? 7 - i : i)) & 1);
    const nw = 60, cw = 50, hy = 34;
    if (v.bus === "spi") {
      const cpol = v.mode >> 1, cpha = v.mode & 1, W = nw + 10 * cw + 20, H = 3 * hy + 40, X = t => nw + t * cw / 2;
      const lvl = (y, b) => b ? y : y + 20;
      let cs = `M${nw - 30} ${lvl(4, 1)} H${X(1)} V${lvl(4, 0)} H${X(18)} V${lvl(4, 1)} H${W}`;
      let sck = `M${nw - 30} ${lvl(4 + hy, cpol)} H${X(3)}`; for (let k = 0; k < 16; k++) { const lv = k % 2 === 0 ? 1 - cpol : cpol; sck += ` V${lvl(4 + hy, lv)} H${X(4 + k)}`; } sck += ` H${W}`;
      // CPHA 0: bit valid before its first (leading) edge, sampled there; CPHA 1: changes on the leading edge, sampled on the trailing edge
      let mo = `M${nw - 30} ${lvl(4 + 2 * hy, 1)} H${cpha ? X(3) : X(1.5)}`;
      bits.forEach((b, i) => { mo += ` V${lvl(4 + 2 * hy, b)} H${cpha ? X(5 + 2 * i) : X(4 + 2 * i)}`; });
      mo += ` V${lvl(4 + 2 * hy, 1)} H${W}`;
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><text x="4" y="18" class="wv-name">CS</text><path d="${cs}" class="wv-line"/><text x="4" y="${18 + hy}" class="wv-name">SCLK</text><path d="${sck}" class="wv-line"/><text x="4" y="${18 + 2 * hy}" class="wv-name out">MOSI</text><path d="${mo}" class="wv-line out"/>`;
      bits.forEach((b, i) => { const sx = X(cpha ? 4 + 2 * i : 3 + 2 * i); s += `<line x1="${sx}" y1="${4 + hy}" x2="${sx}" y2="${4 + 3 * hy}" stroke="var(--red)" stroke-dasharray="2 3"/><text x="${sx}" y="${H - 6}" text-anchor="middle" class="wv-val">${b}</text>`; });
      $("[data-svg]", host).innerHTML = s + "</svg>";
      $("[data-n]", host).innerHTML = `Mode ${v.mode}: clock idles ${cpol ? "high" : "low"}; data is sampled on the ${cpha ? "second" : "first"} clock edge of each bit (the <span style="color:var(--red)">red</span> lines - ${(cpol ^ cpha) ? "falling" : "rising"} edges) and changes on the other edge. Byte 0x${byte.toString(16).toUpperCase().padStart(2, "0")} sent ${v.msb ? "MSB" : "LSB"} first.`;
    } else {
      const addr = parseInt(v.addr, 16) & 127, seq = [];
      seq.push({ k: "S" }); [...Array(7)].forEach((_, i) => seq.push({ k: "A", b: (addr >> (6 - i)) & 1 })); seq.push({ k: "RW", b: v.rw }); seq.push({ k: "ACK", b: v.ack ? 0 : 1 });
      if (v.ack) { bits.forEach(b => seq.push({ k: "D", b })); seq.push({ k: v.rw ? "NACK" : "ACK", b: v.rw ? 1 : 0 }); }
      seq.push({ k: "P" });
      const bw = 34, W = nw + seq.length * bw + 20, H = 2 * hy + 50;
      let sda = `M${nw - 20} 4`, scl = `M${nw - 20} ${4 + hy}`, labels = "";
      seq.forEach((e, i) => {
        const x = nw + i * bw;
        if (e.k === "S") { sda += ` H${x + bw / 3} V24 H${x + bw}`; scl += ` H${x + 2 * bw / 3} V${24 + hy} H${x + bw}`; }
        else if (e.k === "P") { sda += ` V24 H${x + bw / 3}`; scl += ` H${x + bw / 4} V${4 + hy} H${x + bw}`; sda += ` H${x + 2 * bw / 3} V4 H${x + bw}`; }
        else { const y = e.b ? 4 : 24; sda += ` H${x + 3} V${y} H${x + bw}`; scl += ` H${x + bw / 3} V${4 + hy} H${x + 2 * bw / 3} V${24 + hy} H${x + bw}`; }
        const col = e.k === "A" ? "var(--blue)" : e.k === "RW" ? "var(--violet)" : /ACK/.test(e.k) ? (e.b ? "var(--red)" : "var(--green)") : e.k === "D" ? "var(--ink)" : "var(--amber)";
        labels += `<text x="${x + bw / 2}" y="${H - 18}" text-anchor="middle" class="wv-val" fill="${col}">${e.k === "A" || e.k === "D" ? e.b : e.k === "RW" ? (e.b ? "R" : "W") : e.k === "ACK" && e.b ? "NACK" : e.k}</text>`;
      });
      sda += ` H${W}`; scl += ` H${W}`;
      $("[data-svg]", host).innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><text x="4" y="18" class="wv-name out">SDA</text><path d="${sda}" class="wv-line out"/><text x="4" y="${18 + hy}" class="wv-name">SCL</text><path d="${scl}" class="wv-line"/>${labels}<text x="${nw}" y="${H - 4}" class="wv-step">S = start (SDA falls while SCL high) · address · R/W · ACK (receiver pulls SDA low) · data · P = stop</text></svg>`;
      $("[data-n]", host).innerHTML = `Address 0x${addr.toString(16).toUpperCase().padStart(2, "0")} becomes the byte 0x${((addr << 1) | v.rw).toString(16).toUpperCase().padStart(2, "0")} on the wire (address shifted left, R/W in bit 0). SDA only changes while SCL is low, except for START and STOP.${!v.ack ? " With no ACK the master stops: the device is absent or busy." : ""}`;
    }
  };
  host.addEventListener("click", e => { const b = e.target.closest("[data-bus]"); if (b) { v.bus = b.dataset.bus; host.querySelectorAll("[data-bus]").forEach(x => x.classList.toggle("on", x === b)); opts(); draw(); } });
  host.addEventListener("input", e => { const k = e.target.dataset.k; if (!k) return; v[k] = e.target.type === "checkbox" ? e.target.checked : k === "mode" || k === "rw" ? +e.target.value : e.target.value.replace(/[^0-9a-f]/gi, ""); draw(); });
  opts(); draw();
}
