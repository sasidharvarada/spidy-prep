/* ==========================================================================
   Spidy Circuit Lab - drag-and-drop logic circuit editor and simulator.
   Components: IN (switch), OUT (lamp), CLK (push button), CONST 0/1,
   NOT, BUF, AND, OR, NAND, NOR, XOR, XNOR (2-4 inputs), MUX2, DFF.
   ========================================================================== */

export const GATES = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"];
export const PALETTE = ["IN", "OUT", "CLK", "NOT", "AND", "OR", "NAND", "NOR", "XOR", "XNOR", "MUX2", "DFF", "ONE", "ZERO"];
const NAMES = { IN: "Input", OUT: "Output", CLK: "Clock", NOT: "NOT", BUF: "Buffer", AND: "AND", OR: "OR", NAND: "NAND", NOR: "NOR", XOR: "XOR", XNOR: "XNOR", MUX2: "2:1 MUX", DFF: "D flip-flop", ONE: "Constant 1", ZERO: "Constant 0" };
export const compName = t => NAMES[t] || t;

/* ------------------------------------------------------------- geometry */
export function geom(c) {
  const n = c.n || 2;
  switch (c.type) {
    case "IN": case "CLK": return { w: 64, h: 32, ins: [], outs: [[64, 16]] };
    case "ONE": case "ZERO": return { w: 36, h: 28, ins: [], outs: [[36, 14]] };
    case "OUT": return { w: 64, h: 32, ins: [[0, 16]], outs: [] };
    case "NOT": case "BUF": return { w: 60, h: 40, ins: [[0, 20]], outs: [[60, 20]] };
    case "MUX2": return { w: 60, h: 80, ins: [[0, 20], [0, 50], [30, 80]], outs: [[60, 35]], inNames: ["0", "1", "S"] };
    case "DFF": return { w: 70, h: 70, ins: [[0, 20], [0, 50]], outs: [[70, 20], [70, 50]], inNames: ["D", ">"], outNames: ["Q", "Q'"] };
  }
  // gates
  const h = Math.max(40, n * 20);
  const ins = []; for (let i = 0; i < n; i++) ins.push([0, Math.round(h * (i + 1) / (n + 1) / 10) * 10 || 10]);
  // make sure inputs are distinct and on the 10px grid
  for (let i = 0; i < n; i++) ins[i][1] = (h / (n + 1)) * (i + 1);
  return { w: 70, h, ins, outs: [[70, h / 2]] };
}
export function pinPos(c, pin) {
  const g = geom(c); const [kind, idx] = [pin[0], +pin.slice(1)];
  const p = (kind === "i" ? g.ins : g.outs)[idx];
  return p ? [c.x + p[0], c.y + p[1]] : [c.x, c.y];
}

/* ------------------------------------------------------------- simulation */
// state: { inputs: {compId: 0|1}, ff: {compId: q}, prevClk: {compId: 0|1} }
export function newState(circ) {
  const st = { inputs: {}, ff: {}, prevClk: {}, out: {} };
  circ.comps.forEach(c => { if (c.type === "IN" || c.type === "CLK") st.inputs[c.id] = c.value ? 1 : 0; if (c.type === "DFF") { st.ff[c.id] = 0; st.prevClk[c.id] = 0; } });
  return st;
}

function gateFn(t, v) {
  switch (t) {
    case "AND": return v.every(x => x) ? 1 : 0;
    case "OR": return v.some(x => x) ? 1 : 0;
    case "NAND": return v.every(x => x) ? 0 : 1;
    case "NOR": return v.some(x => x) ? 0 : 1;
    case "XOR": return v.reduce((a, b) => a ^ b, 0);
    case "XNOR": return 1 - v.reduce((a, b) => a ^ b, 0);
  }
  return 0;
}

// Settle combinational logic. Returns {vals, ok}. vals: "id:o0" -> bit
export function settle(circ, st) {
  const src = new Map(); // "id:iN" -> "id:oM"
  circ.wires.forEach(w => src.set(`${w.to.c}:${w.to.p}`, `${w.from.c}:${w.from.p}`));
  const vals = st.vals || new Map();
  const rd = (c, i) => { const s = src.get(`${c.id}:i${i}`); return s ? (vals.get(s) || 0) : 0; };
  let ok = false;
  for (let pass = 0; pass < 100; pass++) {
    let changed = false;
    const set = (c, o, v) => { const k = `${c.id}:o${o}`; if ((vals.get(k) || 0) !== v || !vals.has(k)) { if ((vals.get(k) || 0) !== v) changed = true; vals.set(k, v); } };
    for (const c of circ.comps) {
      const n = c.n || 2;
      switch (c.type) {
        case "IN": case "CLK": set(c, 0, st.inputs[c.id] ? 1 : 0); break;
        case "ONE": set(c, 0, 1); break;
        case "ZERO": set(c, 0, 0); break;
        case "NOT": set(c, 0, rd(c, 0) ? 0 : 1); break;
        case "BUF": set(c, 0, rd(c, 0)); break;
        case "MUX2": set(c, 0, rd(c, 2) ? rd(c, 1) : rd(c, 0)); break;
        case "DFF": set(c, 0, st.ff[c.id] || 0); set(c, 1, st.ff[c.id] ? 0 : 1); break;
        case "OUT": break;
        default: if (GATES.includes(c.type)) { const v = []; for (let i = 0; i < n; i++) v.push(rd(c, i)); set(c, 0, gateFn(c.type, v)); }
      }
    }
    if (!changed) { ok = true; break; }
  }
  st.vals = vals;
  circ.comps.forEach(c => { if (c.type === "OUT") st.out[c.id] = rd(c, 0); });
  st.oscillating = !ok;
  return st;
}

// Apply new input values and process flip-flop clock edges.
export function step(circ, st, inputs) {
  if (inputs) Object.assign(st.inputs, inputs);
  settle(circ, st);
  const src = new Map(); circ.wires.forEach(w => src.set(`${w.to.c}:${w.to.p}`, `${w.from.c}:${w.from.p}`));
  const rd = (c, i) => { const s = src.get(`${c.id}:i${i}`); return s ? (st.vals.get(s) || 0) : 0; };
  for (let guard = 0; guard < 32; guard++) {
    const updates = [];
    circ.comps.forEach(c => {
      if (c.type !== "DFF") return;
      const clk = rd(c, 1);
      if (!st.prevClk[c.id] && clk) updates.push([c.id, rd(c, 0)]);
      st.prevClk[c.id] = clk;
    });
    if (!updates.length) break;
    updates.forEach(([id, d]) => st.ff[id] = d);
    settle(circ, st);
  }
  return st;
}

export function labelOf(circ, label) { return circ.comps.find(c => (c.label || "").toUpperCase() === label.toUpperCase()); }

/* ------------------------------------------------------------- checking */
// prob.check: { inputs: [...labels], outputs: [...labels], fn: (inObj) => outObj }  (combinational)
//          or { seq: true, inputs, outputs, clock: "CLK", model: { init(), step(state, inObj) -> {state, out} }, steps: [inObj...] }
export function checkCircuit(circ, chk) {
  const res = { ok: false, rows: [], error: null };
  const need = l => { const c = labelOf(circ, l); if (!c) throw new Error(`the circuit needs a part labelled ${l}`); return c; };
  try {
    const ins = chk.inputs.map(need), outs = chk.outputs.map(need);
    if (chk.allowed) {
      const bad = circ.comps.filter(c => !["IN", "OUT", "CLK"].includes(c.type) && !chk.allowed.includes(c.type));
      if (bad.length) throw new Error(`only ${chk.allowed.join(", ")} allowed here - remove the ${compName(bad[0].type)}`);
    }
    if (!chk.seq) {
      const n = ins.length;
      for (let k = 0; k < (1 << n); k++) {
        const inObj = {}; const st = newState(circ);
        ins.forEach((c, i) => { const v = (k >> (n - 1 - i)) & 1; inObj[c.label] = v; st.inputs[c.id] = v; });
        settle(circ, st);
        if (st.oscillating) throw new Error("the circuit oscillates (a loop with no flip-flop)");
        const exp = chk.fn(inObj), got = {};
        outs.forEach(c => got[c.label] = st.out[c.id] || 0);
        const good = chk.outputs.every(l => got[labelOf(circ, l).label] === exp[l]);
        res.rows.push({ in: inObj, got, exp, good });
      }
    } else {
      const clk = need(chk.clock || "CLK");
      const st = newState(circ); let ms = chk.model.init();
      step(circ, st, { [clk.id]: 0 });
      chk.steps.forEach((inObj, idx) => {
        const set = { [clk.id]: 0 };
        ins.forEach(c => { if (c !== clk) set[c.id] = inObj[c.label] || 0; });
        step(circ, st, set);
        step(circ, st, { [clk.id]: 1 });
        step(circ, st, { [clk.id]: 0 });
        if (st.oscillating) throw new Error("the circuit oscillates");
        const r = chk.model.step(ms, inObj); ms = r.state;
        const got = {}; outs.forEach(c => got[c.label] = st.out[c.id] || 0);
        const good = chk.outputs.every(l => got[labelOf(circ, l).label] === r.out[l]);
        res.rows.push({ in: Object.assign({ clock: idx + 1 }, inObj), got, exp: r.out, good });
      });
    }
    res.ok = res.rows.every(r => r.good);
    res.gates = circ.comps.filter(c => !["IN", "OUT", "CLK", "ONE", "ZERO"].includes(c.type)).length;
  } catch (e) { res.error = e.message; }
  return res;
}

/* ------------------------------------------------------------- SVG drawing */
const NS = "http://www.w3.org/2000/svg";
const el = (t, a, parent) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };

function gatePath(t, w, h) {
  const bw = 46; // body width (bubble/output stub after)
  if (t === "AND" || t === "NAND") return `M8 2 H${bw / 2 + 4} A${bw / 2 - 4} ${h / 2 - 2} 0 0 1 ${bw / 2 + 4} ${h - 2} H8 Z`;
  if (t === "OR" || t === "NOR" || t === "XOR" || t === "XNOR") {
    const x0 = t[0] === "X" ? 14 : 8;
    return `M${x0} 2 Q${x0 + 14} ${h / 2} ${x0} ${h - 2} Q${x0 + 30} ${h - 2} ${bw + 2} ${h / 2} Q${x0 + 30} 2 ${x0} 2 Z`;
  }
  return "";
}

export class CircuitEditor {
  constructor(host, opts = {}) {
    this.host = host; this.opts = opts;
    this.circ = opts.circuit ? JSON.parse(JSON.stringify(opts.circuit)) : { comps: [], wires: [] };
    this.locked = new Set(opts.locked || []);         // component ids that cannot be moved/deleted
    this.palette = opts.palette || PALETTE;
    this.sel = null; this.drag = null; this.pendingPin = null; this.hist = []; this.future = [];
    this.st = newState(this.circ); step(this.circ, this.st);
    this.build(); this.render();
  }
  nextId() { let n = 1; const ids = new Set(this.circ.comps.map(c => c.id)); while (ids.has("c" + n)) n++; return "c" + n; }
  snapshot() { this.hist.push(JSON.stringify(this.circ)); if (this.hist.length > 80) this.hist.shift(); this.future = []; }
  undo() { if (!this.hist.length) return; this.future.push(JSON.stringify(this.circ)); this.circ = JSON.parse(this.hist.pop()); this.afterEdit(false); }
  redo() { if (!this.future.length) return; this.hist.push(JSON.stringify(this.circ)); this.circ = JSON.parse(this.future.pop()); this.afterEdit(false); }
  afterEdit(snap) {
    const old = this.st; this.st = newState(this.circ);
    // keep switch values
    this.circ.comps.forEach(c => { if (c.type === "IN" && old.inputs[c.id] != null) this.st.inputs[c.id] = old.inputs[c.id]; if (c.type === "DFF" && old.ff[c.id] != null) this.st.ff[c.id] = old.ff[c.id]; });
    step(this.circ, this.st);
    if (this.sel && !this.find(this.sel.id) && this.sel.kind === "comp") this.sel = null;
    this.render(); if (this.opts.onChange) this.opts.onChange(this.circ);
  }
  find(id) { return this.circ.comps.find(c => c.id === id); }

  build() {
    this.host.innerHTML = "";
    this.host.classList.add("cl");
    const pal = document.createElement("div"); pal.className = "cl__pal"; pal.setAttribute("role", "toolbar"); pal.setAttribute("aria-label", "Components");
    this.palette.forEach(t => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cl__pi"; b.dataset.t = t; b.title = "Add " + compName(t);
      b.innerHTML = `<svg viewBox="0 0 76 44" aria-hidden="true">${iconSvg(t)}</svg><span>${t === "MUX2" ? "MUX" : t === "ONE" ? "1" : t === "ZERO" ? "0" : t}</span>`;
      b.addEventListener("click", () => this.add(t));
      pal.appendChild(b);
    });
    const bar = document.createElement("div"); bar.className = "cl__bar";
    bar.innerHTML = `<button type="button" data-a="undo" title="Undo (Ctrl+Z)">Undo</button><button type="button" data-a="redo" title="Redo">Redo</button>
      <span class="cl__sep"></span><span class="cl__selinfo" aria-live="polite">Tip: drag from a pin to another pin to draw a wire. Click an input switch to flip it.</span>
      <span class="cl__grow"></span>
      <button type="button" data-a="nin" class="cl__selbtn" hidden>- input</button><button type="button" data-a="pin" class="cl__selbtn" hidden>+ input</button>
      <button type="button" data-a="rename" class="cl__selbtn" hidden>Rename</button><button type="button" data-a="del" class="cl__selbtn cl__del" hidden>Delete</button>
      <button type="button" data-a="clear" title="Remove everything you added">Clear</button>`;
    bar.addEventListener("click", e => { const b = e.target.closest("button"); if (b) this.action(b.dataset.a); });
    const wrap = document.createElement("div"); wrap.className = "cl__wrap";
    this.W = this.opts.width || 960; this.H = this.opts.height || 520;
    this.svg = el("svg", { class: "cl__svg", width: this.W, height: this.H, viewBox: `0 0 ${this.W} ${this.H}`, role: "application", "aria-label": "Circuit canvas" });
    const defs = el("defs", {}, this.svg);
    const pat = el("pattern", { id: "clgrid" + (this.uid = Math.random().toString(36).slice(2, 7)), width: 20, height: 20, patternUnits: "userSpaceOnUse" }, defs);
    el("circle", { cx: 1, cy: 1, r: 1, class: "cl__dot" }, pat);
    el("rect", { x: 0, y: 0, width: this.W, height: this.H, fill: `url(#clgrid${this.uid})`, class: "cl__bg" }, this.svg);
    this.gW = el("g", {}, this.svg); this.gC = el("g", {}, this.svg); this.gT = el("g", {}, this.svg);
    wrap.appendChild(this.svg);
    this.host.append(pal, bar, wrap);
    this.barEl = bar;
    this.svg.addEventListener("pointerdown", e => this.down(e));
    this.svg.addEventListener("pointermove", e => this.move(e));
    this.svg.addEventListener("pointerup", e => this.up(e));
    this.svg.addEventListener("pointercancel", () => { this.drag = null; this.gT.innerHTML = ""; });
    this.svg.addEventListener("dblclick", e => { const g = e.target.closest("[data-c]"); if (g) { this.sel = { kind: "comp", id: g.dataset.c }; this.action("rename"); } });
    this.svg.tabIndex = 0;
    this.svg.addEventListener("keydown", e => {
      if ((e.key === "Delete" || e.key === "Backspace") && this.sel) { e.preventDefault(); this.action("del"); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); this.redo(); }
      if (e.key === "Escape") { this.pendingPin = null; this.sel = null; this.render(); }
    });
  }

  pt(e) { const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = this.svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }

  add(t) {
    this.snapshot();
    const c = { id: this.nextId(), type: t, x: 0, y: 0 };
    if (GATES.includes(t)) c.n = 2;
    if (t === "IN") c.label = this.freeLabel("ABCDEFGHJKLMN".split(""));
    if (t === "OUT") c.label = this.freeLabel(["Y", "Z", "F", "G", "S", "C", "Q", "P", "W"]);
    if (t === "CLK") c.label = this.freeLabel(["CLK", "CLK2", "CLK3"]);
    // place: a free spot near the middle
    const g = geom(c);
    let x = t === "IN" || t === "CLK" || t === "ONE" || t === "ZERO" ? 40 : t === "OUT" ? this.W - 120 : Math.round((this.W / 2 - g.w / 2) / 10) * 10, y = 40;
    while (this.circ.comps.some(o => Math.abs(o.x - x) < 60 && Math.abs(o.y - y) < geom(o).h + 10) && y < this.H - 80) y += 60;
    c.x = x; c.y = y;
    this.circ.comps.push(c);
    this.sel = { kind: "comp", id: c.id };
    this.afterEdit();
  }
  freeLabel(list) { const used = new Set(this.circ.comps.map(c => (c.label || "").toUpperCase())); return list.find(l => !used.has(l.toUpperCase())) || list[0] + this.circ.comps.length; }

  action(a) {
    if (a === "undo") return this.undo();
    if (a === "redo") return this.redo();
    if (a === "clear") {
      if (!this.circ.comps.some(c => !this.locked.has(c.id))) return;
      if (!confirm("Remove everything you added?")) return;
      this.snapshot();
      this.circ.comps = this.circ.comps.filter(c => this.locked.has(c.id));
      this.circ.wires = []; this.sel = null; return this.afterEdit();
    }
    const s = this.sel; if (!s) return;
    if (a === "del") {
      this.snapshot();
      if (s.kind === "wire") this.circ.wires.splice(s.idx, 1);
      else {
        if (this.locked.has(s.id)) { this.say("This part belongs to the problem and cannot be deleted."); this.circ.wires = this.circ.wires; return; }
        this.circ.comps = this.circ.comps.filter(c => c.id !== s.id);
        this.circ.wires = this.circ.wires.filter(w => w.from.c !== s.id && w.to.c !== s.id);
      }
      this.sel = null; return this.afterEdit();
    }
    const c = s.kind === "comp" && this.find(s.id); if (!c) return;
    if ((a === "pin" || a === "nin") && GATES.includes(c.type)) {
      const n = (c.n || 2) + (a === "pin" ? 1 : -1); if (n < 2 || n > 4) return;
      this.snapshot(); c.n = n;
      this.circ.wires = this.circ.wires.filter(w => !(w.to.c === c.id && +w.to.p.slice(1) >= n));
      return this.afterEdit();
    }
    if (a === "rename" && ["IN", "OUT", "CLK"].includes(c.type)) {
      if (this.locked.has(c.id)) { this.say("Problem pins keep their names."); return; }
      const v = prompt("Label (1-6 letters or digits):", c.label || "");
      if (v && /^[A-Za-z][A-Za-z0-9_]{0,5}$/.test(v.trim())) { this.snapshot(); c.label = v.trim().toUpperCase(); this.afterEdit(); }
    }
  }
  say(msg) { const s = this.barEl.querySelector(".cl__selinfo"); s.textContent = msg; }

  down(e) {
    const p = this.pt(e);
    const pin = e.target.closest("[data-pin]");
    if (pin) {
      e.preventDefault();
      const [cid, pid] = pin.dataset.pin.split("|");
      if (this.pendingPin) { this.connect(this.pendingPin, { c: cid, p: pid }); this.pendingPin = null; this.render(); return; }
      this.drag = { kind: "wire", from: { c: cid, p: pid }, sx: p.x, sy: p.y, moved: false };
      this.svg.setPointerCapture(e.pointerId);
      return;
    }
    const w = e.target.closest("[data-w]");
    if (w) { this.sel = { kind: "wire", idx: +w.dataset.w }; this.pendingPin = null; this.render(); return; }
    const g = e.target.closest("[data-c]");
    if (g) {
      e.preventDefault();
      const c = this.find(g.dataset.c);
      this.drag = { kind: "move", c, ox: p.x - c.x, oy: p.y - c.y, sx: p.x, sy: p.y, moved: false, x0: c.x, y0: c.y };
      this.svg.setPointerCapture(e.pointerId);
      return;
    }
    this.sel = null; this.pendingPin = null; this.render();
  }
  move(e) {
    if (!this.drag) return;
    const p = this.pt(e), d = this.drag;
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 4) d.moved = true;
    if (d.kind === "move" && d.moved) {
      if (this.locked.has(d.c.id) && !this.opts.movableLocked) return;
      const g = geom(d.c);
      d.c.x = Math.max(0, Math.min(this.W - g.w, Math.round((p.x - d.ox) / 10) * 10));
      d.c.y = Math.max(0, Math.min(this.H - g.h, Math.round((p.y - d.oy) / 10) * 10));
      this.render();
    } else if (d.kind === "wire") {
      const [x1, y1] = pinPos(this.find(d.from.c), d.from.p);
      this.gT.innerHTML = "";
      el("path", { d: wirePath(x1, y1, p.x, p.y, d.from.p[0] === "i"), class: "cl__wire cl__wire--temp" }, this.gT);
    }
  }
  up(e) {
    const d = this.drag; this.drag = null; this.gT.innerHTML = "";
    if (!d) return;
    if (d.kind === "move") {
      if (!d.moved) {
        const c = d.c;
        if (c.type === "IN") { this.st.inputs[c.id] = this.st.inputs[c.id] ? 0 : 1; step(this.circ, this.st); }
        else if (c.type === "CLK") { this.pulse(c); }
        this.sel = { kind: "comp", id: c.id }; this.render();
      } else if (d.c.x !== d.x0 || d.c.y !== d.y0) {
        this.hist.push(JSON.stringify(Object.assign({}, this.circ, { comps: this.circ.comps.map(o => o === d.c ? Object.assign({}, o, { x: d.x0, y: d.y0 }) : o) })));
        if (this.opts.onChange) this.opts.onChange(this.circ);
      }
      return;
    }
    if (d.kind === "wire") {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const pin = t && t.closest && t.closest("[data-pin]");
      if (pin) { const [cid, pid] = pin.dataset.pin.split("|"); this.connect(d.from, { c: cid, p: pid }); }
      else if (!d.moved) { this.pendingPin = d.from; this.say("Now tap the pin to connect to (Esc to cancel)."); this.render(); }
    }
  }
  pulse(c) {
    this.st.inputs[c.id] = 1; step(this.circ, this.st); this.render();
    clearTimeout(this.pulseT);
    this.pulseT = setTimeout(() => { this.st.inputs[c.id] = 0; step(this.circ, this.st); this.render(); }, 220);
  }
  connect(a, b) {
    if (a.c === b.c && a.p === b.p) return;
    let from = a, to = b;
    if (a.p[0] === "i" && b.p[0] === "o") { from = b; to = a; }
    if (from.p[0] !== "o" || to.p[0] !== "i") { this.say("Connect an output pin (right side) to an input pin (left side)."); return; }
    this.snapshot();
    this.circ.wires = this.circ.wires.filter(w => !(w.to.c === to.c && w.to.p === to.p)); // one driver per input
    this.circ.wires.push({ from, to });
    this.sel = null; this.afterEdit();
  }

  setInputs(map) { this.circ.comps.forEach(c => { if (c.label && map[c.label] != null) this.st.inputs[c.id] = map[c.label]; }); step(this.circ, this.st); this.render(); }

  render() {
    const { gW, gC } = this; gW.innerHTML = ""; gC.innerHTML = "";
    const v = k => this.st.vals ? (this.st.vals.get(k) || 0) : 0;
    // wires
    this.circ.wires.forEach((w, i) => {
      const a = this.find(w.from.c), b = this.find(w.to.c); if (!a || !b) return;
      const [x1, y1] = pinPos(a, w.from.p), [x2, y2] = pinPos(b, w.to.p);
      const on = v(`${w.from.c}:${w.from.p}`);
      const sel = this.sel && this.sel.kind === "wire" && this.sel.idx === i;
      const d = wirePath(x1, y1, x2, y2);
      el("path", { d, class: "cl__hit", "data-w": i }, gW);
      el("path", { d, class: `cl__wire${on ? " on" : ""}${sel ? " sel" : ""}`, "data-w": i }, gW);
    });
    // components
    for (const c of this.circ.comps) {
      const g = geom(c);
      const sel = this.sel && this.sel.kind === "comp" && this.sel.id === c.id;
      const grp = el("g", { transform: `translate(${c.x},${c.y})`, "data-c": c.id, class: `cl__comp cl__${c.type.toLowerCase()}${sel ? " sel" : ""}${this.locked.has(c.id) ? " locked" : ""}` }, gC);
      el("rect", { x: -4, y: -4, width: g.w + 8, height: g.h + 8, rx: 6, class: "cl__selbox" }, grp);
      this.drawBody(grp, c, g, v);
      g.ins.forEach((p, i) => {
        const on = this.inputValue(c, i);
        el("line", { x1: p[0], y1: p[1], x2: c.type === "MUX2" && i === 2 ? p[0] : p[0] + 8, y2: c.type === "MUX2" && i === 2 ? p[1] - 8 : p[1], class: "cl__stub" + (on ? " on" : "") }, grp);
        const pc = el("circle", { cx: p[0], cy: p[1], r: 5, class: "cl__pin" + (this.pendingPin && this.pendingPin.c === c.id && this.pendingPin.p === "i" + i ? " pend" : ""), "data-pin": `${c.id}|i${i}` }, grp);
        el("title", {}, pc).textContent = (g.inNames ? g.inNames[i] : "input " + (i + 1));
        el("circle", { cx: p[0], cy: p[1], r: 11, class: "cl__pinhit", "data-pin": `${c.id}|i${i}` }, grp);
      });
      g.outs.forEach((p, i) => {
        const on = v(`${c.id}:o${i}`);
        el("line", { x1: p[0] - 8, y1: p[1], x2: p[0], y2: p[1], class: "cl__stub" + (on ? " on" : "") }, grp);
        el("circle", { cx: p[0], cy: p[1], r: 5, class: "cl__pin cl__pin--o" + (on ? " on" : "") + (this.pendingPin && this.pendingPin.c === c.id && this.pendingPin.p === "o" + i ? " pend" : ""), "data-pin": `${c.id}|o${i}` }, grp);
        el("circle", { cx: p[0], cy: p[1], r: 11, class: "cl__pinhit", "data-pin": `${c.id}|o${i}` }, grp);
      });
    }
    // toolbar state
    const s = this.sel, c = s && s.kind === "comp" && this.find(s.id);
    const show = (a, on) => { const b = this.barEl.querySelector(`[data-a="${a}"]`); b.hidden = !on; };
    show("del", !!s && !(c && this.locked.has(c.id)));
    show("pin", c && GATES.includes(c.type) && (c.n || 2) < 4);
    show("nin", c && GATES.includes(c.type) && (c.n || 2) > 2);
    show("rename", c && ["IN", "OUT", "CLK"].includes(c.type) && !this.locked.has(c.id));
    if (!this.pendingPin) this.say(c ? `${compName(c.type)}${c.label ? " " + c.label : ""} selected${c.type === "IN" ? " - click it to flip" : c.type === "CLK" ? " - click it for one clock pulse" : ""}` : s ? "Wire selected - press Delete to remove it" : (this.st.oscillating ? "⚠ The circuit oscillates: a loop with no flip-flop never settles." : "Tip: drag from a pin to another pin to draw a wire. Click an input switch to flip it."));
    this.barEl.querySelector('[data-a="undo"]').disabled = !this.hist.length;
    this.barEl.querySelector('[data-a="redo"]').disabled = !this.future.length;
    if (this.opts.onRender) this.opts.onRender(this);
  }
  inputValue(c, i) {
    const w = this.circ.wires.find(w => w.to.c === c.id && w.to.p === "i" + i);
    return w && this.st.vals ? (this.st.vals.get(`${w.from.c}:${w.from.p}`) || 0) : 0;
  }
  drawBody(grp, c, g, v) {
    const t = c.type;
    if (t === "IN" || t === "CLK") {
      const on = this.st.inputs[c.id] ? 1 : 0;
      el("rect", { x: 0, y: 0, width: 56, height: g.h, rx: 7, class: "cl__body cl__inbody" + (on ? " on" : "") }, grp);
      if (t === "IN") {
        el("rect", { x: 30, y: 7, width: 20, height: 18, rx: 4, class: "cl__switch" + (on ? " on" : "") }, grp);
        el("text", { x: 40, y: 20, class: "cl__bit", "text-anchor": "middle" }, grp).textContent = on;
      } else {
        el("path", { d: "M31 22 h5 v-11 h6 v11 h5", class: "cl__clkicon" }, grp);
      }
      el("text", { x: 15, y: 21, class: "cl__lbl", "text-anchor": "middle" }, grp).textContent = (c.label || "?").slice(0, 4);
      el("line", { x1: 56, y1: 16, x2: 64, y2: 16, class: "cl__stub" + (on ? " on" : "") }, grp);
      return;
    }
    if (t === "ONE" || t === "ZERO") {
      el("rect", { x: 0, y: 0, width: 28, height: 28, rx: 6, class: "cl__body" }, grp);
      el("text", { x: 14, y: 19, class: "cl__bit", "text-anchor": "middle" }, grp).textContent = t === "ONE" ? "1" : "0";
      return;
    }
    if (t === "OUT") {
      const on = this.inputValue(c, 0);
      el("line", { x1: 0, y1: 16, x2: 12, y2: 16, class: "cl__stub" + (on ? " on" : "") }, grp);
      el("circle", { cx: 26, cy: 16, r: 13, class: "cl__lamp" + (on ? " on" : "") }, grp);
      el("text", { x: 26, y: 20.5, class: "cl__bit cl__bit--lamp", "text-anchor": "middle" }, grp).textContent = on;
      el("text", { x: 46, y: 21, class: "cl__lbl" }, grp).textContent = (c.label || "?").slice(0, 4);
      return;
    }
    if (t === "NOT" || t === "BUF") {
      el("path", { d: "M8 4 L46 20 L8 36 Z", class: "cl__body" }, grp);
      if (t === "NOT") el("circle", { cx: 50, cy: 20, r: 4, class: "cl__body" }, grp);
      return;
    }
    if (t === "MUX2") {
      el("path", { d: "M8 4 L52 16 L52 64 L8 76 Z", class: "cl__body" }, grp);
      el("text", { x: 14, y: 24, class: "cl__pinname" }, grp).textContent = "0";
      el("text", { x: 14, y: 54, class: "cl__pinname" }, grp).textContent = "1";
      el("text", { x: 26, y: 66, class: "cl__pinname" }, grp).textContent = "S";
      el("text", { x: 30, y: 40, class: "cl__glbl", "text-anchor": "middle" }, grp).textContent = "MUX";
      return;
    }
    if (t === "DFF") {
      el("rect", { x: 8, y: 2, width: 54, height: 66, rx: 4, class: "cl__body" }, grp);
      el("path", { d: "M8 44 L16 50 L8 56", class: "cl__clkmark" }, grp);
      el("text", { x: 14, y: 24, class: "cl__pinname" }, grp).textContent = "D";
      el("text", { x: 56, y: 24, class: "cl__pinname", "text-anchor": "end" }, grp).textContent = "Q";
      el("text", { x: 56, y: 54, class: "cl__pinname", "text-anchor": "end" }, grp).textContent = "Q'";
      el("text", { x: 35, y: 40, class: "cl__glbl", "text-anchor": "middle" }, grp).textContent = "DFF";
      const q = this.st.ff[c.id] ? 1 : 0;
      el("rect", { x: 26, y: 46, width: 18, height: 16, rx: 3, class: "cl__switch" + (q ? " on" : "") }, grp);
      el("text", { x: 35, y: 58, class: "cl__bit", "text-anchor": "middle" }, grp).textContent = q;
      return;
    }
    if (GATES.includes(t)) {
      if (t[0] === "X") el("path", { d: `M8 2 Q22 ${g.h / 2} 8 ${g.h - 2}`, class: "cl__body cl__noFill" }, grp);
      el("path", { d: gatePath(t, g.w, g.h), class: "cl__body" }, grp);
      const neg = t === "NAND" || t === "NOR" || t === "XNOR";
      if (neg) el("circle", { cx: 52, cy: g.h / 2, r: 4, class: "cl__body" }, grp);
      el("text", { x: 27, y: g.h / 2 + 4, class: "cl__glbl", "text-anchor": "middle" }, grp).textContent = t;
    }
  }
}

function wirePath(x1, y1, x2, y2, reverse) {
  if (reverse) [x1, y1, x2, y2] = [x2, y2, x1, y1];
  const mx = x2 >= x1 + 20 ? Math.round((x1 + x2) / 2 / 10) * 10 : x1 + 20;
  if (x2 >= x1 + 20) return `M${x1} ${y1} H${mx} V${y2} H${x2}`;
  const my = Math.round((y1 + y2) / 2 / 10) * 10 + (Math.abs(y1 - y2) < 30 ? 40 : 0);
  return `M${x1} ${y1} H${x1 + 20} V${my} H${x2 - 20} V${y2} H${x2}`;
}

export function iconSvg(t) {
  const s = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"';
  const stub = (y1, y2) => `<path d="M4 ${y1} H18 M4 ${y2} H18 M56 22 H72" ${s}/>`;
  switch (t) {
    case "IN": return `<rect x="10" y="10" width="44" height="24" rx="6" ${s}/><rect x="32" y="15" width="16" height="14" rx="3" fill="currentColor"/><path d="M54 22 H70" ${s}/>`;
    case "OUT": return `<path d="M4 22 H22" ${s}/><circle cx="40" cy="22" r="14" ${s}/><circle cx="40" cy="22" r="6" fill="currentColor"/>`;
    case "CLK": return `<rect x="8" y="10" width="46" height="24" rx="6" ${s}/><path d="M18 28 h7 v-12 h8 v12 h8" ${s}/><path d="M54 22 H70" ${s}/>`;
    case "ONE": case "ZERO": return `<rect x="22" y="8" width="30" height="28" rx="6" ${s}/><text x="37" y="29" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor" font-family="monospace">${t === "ONE" ? 1 : 0}</text>`;
    case "NOT": return `<path d="M4 22 H20 M20 8 L50 22 L20 36 Z M58 22 H72" ${s}/><circle cx="54" cy="22" r="4" ${s}/>`;
    case "AND": return stub(14, 30) + `<path d="M18 6 H36 A16 16 0 0 1 36 38 H18 Z" ${s}/>`;
    case "NAND": return stub(14, 30) + `<path d="M18 6 H34 A16 16 0 0 1 34 38 H18 Z" ${s}/><circle cx="54" cy="22" r="4" ${s}/>`;
    case "OR": return stub(14, 30) + `<path d="M16 6 Q26 22 16 38 Q44 38 56 22 Q44 6 16 6 Z" ${s}/>`;
    case "NOR": return stub(14, 30) + `<path d="M16 6 Q26 22 16 38 Q42 38 50 22 Q42 6 16 6 Z" ${s}/><circle cx="54" cy="22" r="4" ${s}/>`;
    case "XOR": return stub(14, 30) + `<path d="M12 6 Q22 22 12 38 M18 6 Q28 22 18 38 Q44 38 56 22 Q44 6 18 6 Z" ${s}/>`;
    case "XNOR": return stub(14, 30) + `<path d="M12 6 Q22 22 12 38 M18 6 Q28 22 18 38 Q42 38 50 22 Q42 6 18 6 Z" ${s}/><circle cx="54" cy="22" r="4" ${s}/>`;
    case "MUX2": return `<path d="M24 4 L52 12 L52 32 L24 40 Z M4 14 H24 M4 30 H24 M52 22 H72" ${s}/>`;
    case "DFF": return `<rect x="18" y="4" width="38" height="36" rx="3" ${s}/><path d="M18 26 L24 30 L18 34 M4 14 H18 M4 30 H18 M56 14 H72" ${s}/>`;
  }
  return "";
}

/* truth table of the current circuit (sandbox) */
export function truthTable(circ) {
  const ins = circ.comps.filter(c => c.type === "IN").sort((a, b) => a.y - b.y || a.x - b.x);
  const outs = circ.comps.filter(c => c.type === "OUT").sort((a, b) => a.y - b.y || a.x - b.x);
  if (!ins.length || !outs.length) return null;
  if (ins.length > 6) return { tooMany: true };
  const rows = [];
  for (let k = 0; k < (1 << ins.length); k++) {
    const st = newState(circ);
    ins.forEach((c, i) => st.inputs[c.id] = (k >> (ins.length - 1 - i)) & 1);
    settle(circ, st);
    rows.push({ ins: ins.map(c => st.inputs[c.id]), outs: outs.map(c => st.out[c.id] || 0), osc: st.oscillating });
  }
  return { ins: ins.map(c => c.label), outs: outs.map(c => c.label), rows };
}
