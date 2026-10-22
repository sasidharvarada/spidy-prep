// Interactive widgets used in lessons, labs and the home page.
const NS = "http://www.w3.org/2000/svg";
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ----------------------------------------------------------- ring (donut) */
export function ring(pct, color, size, label, sub) {
  const sw = size < 80 ? 7 : 10, r = size / 2 - sw / 2 - 3, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, Math.max(0, pct) / 100));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)} ${Math.round(pct)} percent">
<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--hair)" stroke-width="${sw}"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
<text x="50%" y="${sub ? "48%" : "54%"}" text-anchor="middle" class="ring__v" ${size < 80 ? 'style="font-size:14px"' : ""}>${esc(label)}</text>
${sub ? `<text x="50%" y="65%" text-anchor="middle" class="ring__s">${esc(sub)}</text>` : ""}</svg>`;
}

/* ----------------------------------------------------------- gate demo */
export function gateWidget(host, opts = {}) {
  let A = 0, B = 0, G = opts.gate || "AND";
  const F = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XNOR: (a, b) => 1 - (a ^ b) };
  const SH = {
    AND: "M160 55 H200 A40 40 0 0 1 200 135 H160 Z", NAND: "M160 55 H196 A40 40 0 0 1 196 135 H160 Z",
    OR: "M156 55 Q176 95 156 135 Q220 135 248 95 Q220 55 156 55 Z", NOR: "M156 55 Q176 95 156 135 Q214 135 240 95 Q214 55 156 55 Z",
    XOR: "M164 55 Q184 95 164 135 Q228 135 256 95 Q228 55 164 55 Z M152 55 Q172 95 152 135", XNOR: "M164 55 Q184 95 164 135 Q222 135 248 95 Q222 55 164 55 Z M152 55 Q172 95 152 135",
  };
  const gates = opts.gates || ["AND", "OR", "XOR", "NAND", "NOR", "XNOR"];
  host.innerHTML = `<div class="wg"><div class="row" style="justify-content:space-between"><span class="wg__t">${esc(opts.title || "Can you light the lamp?")}</span>
<div class="tabs" role="tablist">${gates.map(g => `<button type="button" role="tab" data-g="${g}">${g}</button>`).join("")}</div></div>
<p class="wg__d">Tap A and B to switch the inputs. The truth table follows you.</p>
<svg viewBox="0 0 420 190" role="img" aria-label="Logic gate with two inputs and a lamp">
<g class="inbtn" data-in="A" tabindex="0" role="switch"><rect x="10" y="30" width="54" height="40" rx="9"/><text x="37" y="56" text-anchor="middle">A=0</text></g>
<g class="inbtn" data-in="B" tabindex="0" role="switch"><rect x="10" y="120" width="54" height="40" rx="9"/><text x="37" y="146" text-anchor="middle">B=0</text></g>
<path class="wire" data-w="A" d="M64 50 H120 V75 H160"/><path class="wire" data-w="B" d="M64 140 H120 V115 H160"/>
<path class="gate" data-shape d=""/><circle class="gate" data-bub cx="0" cy="95" r="7" style="display:none"/>
<text class="gtxt" data-lbl x="200" y="100" text-anchor="middle">AND</text>
<path class="wire" data-w="Y" d="M262 95 H330"/>
<circle class="lamp" cx="360" cy="95" r="26" fill="var(--sunk)" stroke="var(--ink)" stroke-width="3"/><path d="M350 121 h20 v10 h-20z" fill="var(--ink)"/>
<text x="360" y="172" text-anchor="middle" class="gtxt" data-y style="font-size:13px">Y = 0</text></svg>
<div class="truth" aria-live="polite"></div></div>`;
  const q = s => host.querySelector(s);
  function draw() {
    const y = F[G](A, B);
    q("[data-shape]").setAttribute("d", SH[G]);
    const bub = q("[data-bub]"); const neg = G === "NAND" || G === "NOR" || G === "XNOR";
    bub.style.display = neg ? "" : "none"; bub.setAttribute("cx", G === "NOR" ? 247 : G === "XNOR" ? 255 : 243);
    q("[data-lbl]").textContent = G;
    [["A", A], ["B", B]].forEach(([k, v]) => {
      const el = q(`[data-in="${k}"]`); el.classList.toggle("hi", !!v); el.setAttribute("aria-checked", String(!!v));
      el.querySelector("text").textContent = `${k}=${v}`; q(`[data-w="${k}"]`).classList.toggle("hi", !!v);
    });
    q('[data-w="Y"]').classList.toggle("hi", !!y); q(".lamp").classList.toggle("on", !!y); q("[data-y]").textContent = "Y = " + y;
    let t = `<span class="h">A</span><span class="h">B</span><span class="h">${G}</span>`;
    [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(([a, b]) => { const c = a === A && b === B ? ' class="cur"' : ""; t += `<span${c}>${a}</span><span${c}>${b}</span><span${c}>${F[G](a, b)}</span>`; });
    q(".truth").innerHTML = t;
    host.querySelectorAll("[data-g]").forEach(b => { b.classList.toggle("on", b.dataset.g === G); b.setAttribute("aria-selected", String(b.dataset.g === G)); });
  }
  host.querySelectorAll(".inbtn").forEach(el => {
    const tog = () => { if (el.dataset.in === "A") A ^= 1; else B ^= 1; draw(); };
    el.addEventListener("click", tog); el.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tog(); } });
  });
  host.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { G = b.dataset.g; draw(); }));
  draw();
}

/* ----------------------------------------------------------- D flip-flop vs latch */
export function dffWidget(host) {
  let D = 0, clk = 0, Q = 0, L = 0, hist = [];
  host.innerHTML = `<div class="wg"><span class="wg__t">Latch vs flip-flop</span>
<p class="wg__d">Change D, then raise and lower the clock. The latch copies D the whole time the clock is high; the flip-flop only at the rising edge.</p>
<div class="row" style="gap:18px">
<div><div class="note">Input D</div><div class="seg2" data-d><button type="button" data-v="0" class="on">0</button><button type="button" data-v="1">1</button></div></div>
<div><div class="note">Clock</div><div class="seg2" data-c><button type="button" data-v="0" class="on">LOW</button><button type="button" data-v="1">HIGH</button></div></div>
<div><div class="note">D latch Q</div><div class="seg2"><button type="button" disabled data-l>0</button></div></div>
<div><div class="note">D flip-flop Q</div><div class="seg2"><button type="button" disabled data-f>0</button></div></div></div>
<svg viewBox="0 0 520 150" style="margin-top:14px" data-wave aria-label="Waveform of D, clock, latch output and flip-flop output"></svg>
<p class="note" data-msg aria-live="polite">Set D to 1 with the clock LOW: neither output changes.</p></div>`;
  const q = s => host.querySelector(s);
  function rec() { hist.push({ D, clk, L, Q }); if (hist.length > 26) hist.shift(); }
  function wave() {
    const rows = [["D", "D"], ["CLK", "clk"], ["latch", "L"], ["flop", "Q"]], W = 520, x0 = 52, step = (W - x0 - 8) / 26;
    let s = "";
    rows.forEach(([n, k], r) => {
      const y1 = 14 + r * 34, y0 = y1 + 20;
      s += `<text x="4" y="${y1 + 14}" class="wv-name${r > 1 ? " out" : ""}">${n}</text>`;
      let d = "";
      hist.forEach((h, i) => { const y = h[k] ? y1 : y0; const x = x0 + i * step; d += (i ? ` V${y}` : `M${x} ${y}`) + ` H${x + step}`; });
      s += `<path d="${d}" class="wv-line${r > 1 ? " out" : ""}"/>`;
    });
    q("[data-wave]").innerHTML = s;
  }
  function paint(msg) {
    q("[data-l]").textContent = L; q("[data-f]").textContent = Q;
    q("[data-l]").classList.toggle("on", !!L); q("[data-f]").classList.toggle("on", !!Q);
    host.querySelectorAll("[data-d] button").forEach(b => b.classList.toggle("on", +b.dataset.v === D));
    host.querySelectorAll("[data-c] button").forEach(b => b.classList.toggle("on", +b.dataset.v === clk));
    if (msg) q("[data-msg]").textContent = msg;
    wave();
  }
  host.querySelectorAll("[data-d] button").forEach(b => b.addEventListener("click", () => {
    D = +b.dataset.v; if (clk) L = D; rec();
    paint(clk ? "Clock is HIGH: the latch is transparent and follows D. The flip-flop holds." : "Clock is LOW: both hold their value.");
  }));
  host.querySelectorAll("[data-c] button").forEach(b => b.addEventListener("click", () => {
    const n = +b.dataset.v; let msg = "";
    if (!clk && n) { Q = D; L = D; msg = "Rising edge: the flip-flop captured D. The latch is now transparent."; }
    else if (clk && !n) msg = "Clock went LOW: the latch closes and holds. The flip-flop ignores falling edges.";
    clk = n; rec(); paint(msg);
  }));
  for (let i = 0; i < 4; i++) rec();
  paint();
}

/* ----------------------------------------------------------- register bits */
export function bitsWidget(host) {
  let reg = 0x00, op = "set";
  host.innerHTML = `<div class="wg"><span class="wg__t">Play with an 8-bit register</span>
<p class="wg__d">Pick an operation, then click a bit. The C code updates to match.</p>
<div class="tabs" data-ops><button type="button" data-op="set" class="on">set</button><button type="button" data-op="clr">clear</button><button type="button" data-op="tgl">toggle</button><button type="button" data-op="tst">test</button></div>
<div class="bits" data-bits></div>
<pre class="code" data-code style="margin:8px 0 0"></pre>
<div class="kv"><span>hex <b data-hex></b></span><span>decimal <b data-dec></b></span><span>bits set <b data-pop></b></span></div></div>`;
  const q = s => host.querySelector(s);
  const bits = q("[data-bits]");
  for (let i = 7; i >= 0; i--) bits.insertAdjacentHTML("beforeend", `<button type="button" class="bitb" data-i="${i}"><small>${i}</small><span>0</span></button>`);
  let line = "uint8_t reg = 0x00;";
  function draw() {
    bits.querySelectorAll(".bitb").forEach(b => { const on = (reg >> b.dataset.i) & 1; b.classList.toggle("on", !!on); b.querySelector("span").textContent = on; });
    q("[data-hex]").textContent = "0x" + reg.toString(16).toUpperCase().padStart(2, "0");
    q("[data-dec]").textContent = reg;
    let n = 0; for (let x = reg; x; x &= x - 1) n++; q("[data-pop]").textContent = n;
    q("[data-code]").textContent = line;
    host.querySelectorAll("[data-op]").forEach(b => b.classList.toggle("on", b.dataset.op === op));
  }
  bits.addEventListener("click", e => {
    const b = e.target.closest(".bitb"); if (!b) return; const i = +b.dataset.i;
    if (op === "set") { reg |= 1 << i; line = `reg |= (1u << ${i});      // reg = 0x${reg.toString(16).toUpperCase().padStart(2, "0")}`; }
    if (op === "clr") { reg &= ~(1 << i) & 0xFF; line = `reg &= ~(1u << ${i});     // reg = 0x${reg.toString(16).toUpperCase().padStart(2, "0")}`; }
    if (op === "tgl") { reg ^= 1 << i; line = `reg ^= (1u << ${i});      // reg = 0x${reg.toString(16).toUpperCase().padStart(2, "0")}`; }
    if (op === "tst") line = `(reg >> ${i}) & 1u       // = ${(reg >> i) & 1}`;
    draw();
  });
  host.querySelectorAll("[data-op]").forEach(b => b.addEventListener("click", () => { op = b.dataset.op; draw(); }));
  draw();
}

/* ----------------------------------------------------------- UART frame */
export function uartWidget(host) {
  let ch = "U", parity = "N";
  host.innerHTML = `<div class="wg"><span class="wg__t">One UART byte on the wire</span>
<p class="wg__d">Type a character. Bits go out least-significant first, framed by a start and a stop bit.</p>
<div class="row"><label class="note">Character <input data-ch maxlength="1" value="U" style="width:54px;border:1px solid var(--line);border-radius:7px;padding:5px 8px;font-family:var(--mono);font-size:15px"></label>
<div class="tabs" data-par><button type="button" data-p="N" class="on">8N1</button><button type="button" data-p="E">8E1</button><button type="button" data-p="O">8O1</button></div></div>
<svg viewBox="0 0 560 110" data-svg style="margin-top:12px" aria-label="UART waveform"></svg>
<div class="kv" data-info></div></div>`;
  const q = s => host.querySelector(s);
  function draw() {
    const code = ch.charCodeAt(0) & 0xFF;
    const data = []; for (let i = 0; i < 8; i++) data.push((code >> i) & 1);
    const ones = data.reduce((a, b) => a + b, 0);
    const seq = [{ v: 1, l: "idle" }, { v: 0, l: "start" }, ...data.map((v, i) => ({ v, l: "D" + i }))];
    if (parity !== "N") seq.push({ v: parity === "E" ? ones & 1 : 1 - (ones & 1), l: "par" });
    seq.push({ v: 1, l: "stop" }, { v: 1, l: "idle" });
    const W = 560, st = W / seq.length, hi = 18, lo = 62;
    let d = `M0 ${seq[0].v ? hi : lo}`, s = "", x = 0;
    seq.forEach((b, i) => { d += ` V${b.v ? hi : lo} H${x += st}`;
      const fill = b.l === "start" ? "var(--red-w)" : b.l === "stop" ? "var(--green-w)" : b.l === "par" ? "var(--amber-w)" : b.l[0] === "D" ? "var(--blue-w)" : "none";
      s += `<rect x="${i * st}" y="10" width="${st}" height="60" fill="${fill}"/>`;
      s += `<text x="${i * st + st / 2}" y="88" text-anchor="middle" class="wv-step" style="font-size:10px">${b.l}</text>`;
      if (b.l[0] === "D" || b.l === "par") s += `<text x="${i * st + st / 2}" y="104" text-anchor="middle" class="wv-val" style="font-weight:700">${b.v}</text>`;
    });
    q("[data-svg]").innerHTML = s + `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
    const bits = 10 + (parity !== "N" ? 1 : 0);
    q("[data-info]").innerHTML = `<span>'${esc(ch)}' = <b>0x${code.toString(16).toUpperCase().padStart(2, "0")}</b> = <b>${code.toString(2).padStart(8, "0")}</b></span><span>${bits} bits per byte</span><span>at 115200 baud: <b>${Math.floor(115200 / bits)}</b> bytes/s</span>`;
  }
  q("[data-ch]").addEventListener("input", e => { ch = e.target.value || " "; draw(); });
  host.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => { parity = b.dataset.p; host.querySelectorAll("[data-p]").forEach(x => x.classList.toggle("on", x === b)); draw(); }));
  draw();
}

/* ----------------------------------------------------------- PWM / timer calculator */
export function pwmWidget(host) {
  host.innerHTML = `<div class="wg"><span class="wg__t">Timer and PWM calculator</span>
<p class="wg__d">Change the values. f = clock / ((PSC+1) × (ARR+1)), duty = CCR / (ARR+1).</p>
<div class="calc"><label>Timer clock (MHz)<input type="number" data-f value="16" min="1" step="1"></label>
<label>PSC<input type="number" data-psc value="15" min="0" max="65535"></label>
<label>ARR<input type="number" data-arr value="999" min="1" max="65535"></label>
<label>CCR<input type="number" data-ccr value="250" min="0"></label></div>
<svg viewBox="0 0 560 90" data-svg aria-label="PWM waveform"></svg>
<div class="kv" data-out></div></div>`;
  const q = s => host.querySelector(s);
  function draw() {
    const f = Math.max(0.001, +q("[data-f]").value) * 1e6, psc = Math.max(0, Math.floor(+q("[data-psc]").value)), arr = Math.max(1, Math.floor(+q("[data-arr]").value));
    const ccr = Math.max(0, Math.min(arr + 1, Math.floor(+q("[data-ccr]").value)));
    const tick = f / (psc + 1), upd = tick / (arr + 1), duty = ccr / (arr + 1);
    const fmtF = x => x >= 1e6 ? (x / 1e6).toPrecision(4) + " MHz" : x >= 1e3 ? (x / 1e3).toPrecision(4) + " kHz" : x.toPrecision(4) + " Hz";
    const fmtT = x => x >= 1 ? x.toPrecision(4) + " s" : x >= 1e-3 ? (x * 1e3).toPrecision(4) + " ms" : x >= 1e-6 ? (x * 1e6).toPrecision(4) + " µs" : (x * 1e9).toPrecision(4) + " ns";
    let d = "M0 70", x = 0; const per = 560 / 4;
    for (let i = 0; i < 4; i++) { const h = per * duty; d += ` V${duty > 0 ? 18 : 70} H${x + h} V70 H${x + per}`; x += per; }
    q("[data-svg]").innerHTML = `<line x1="0" y1="70" x2="560" y2="70" class="wv-grid"/><path d="${d}" fill="none" stroke="var(--red)" stroke-width="2.5"/>`;
    q("[data-out]").innerHTML = `<span>counter tick <b>${fmtT(1 / tick)}</b></span><span>PWM / update frequency <b>${fmtF(upd)}</b></span><span>period <b>${fmtT(1 / upd)}</b></span><span>duty <b>${(duty * 100).toFixed(1)}%</b></span><span>resolution <b>${arr + 1} steps</b></span>`;
  }
  host.querySelectorAll("input").forEach(i => i.addEventListener("input", draw));
  draw();
}

/* ----------------------------------------------------------- K-map + Quine-McCluskey */
export function minimize(n, ones, dcs = []) {
  const all = [...new Set([...ones, ...dcs])];
  if (!ones.length) return { sop: "0", terms: [] };
  if (ones.length + dcs.length === 1 << n && ones.length) {
    const allOnes = ones.length === 1 << n; if (allOnes) return { sop: "1", terms: [] };
  }
  // implicants as {v, m (mask of don't-care bits), cov:Set}
  let cur = all.map(v => ({ v, m: 0, cov: [v] }));
  const primes = [];
  while (cur.length) {
    const next = new Map(), used = new Set();
    for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
      const a = cur[i], b = cur[j];
      if (a.m !== b.m) continue;
      const diff = a.v ^ b.v;
      if (diff && (diff & (diff - 1)) === 0) {
        const v = a.v & ~diff, m = a.m | diff, k = v + "/" + m;
        if (!next.has(k)) next.set(k, { v, m, cov: [...new Set([...a.cov, ...b.cov])] });
        used.add(i); used.add(j);
      }
    }
    cur.forEach((t, i) => { if (!used.has(i) && !primes.some(p => p.v === t.v && p.m === t.m)) primes.push(t); });
    cur = [...next.values()];
  }
  const need = ones.slice();
  const lits = p => n - popc(p.m);
  // choose the cover with fewest terms, then fewest literals (exhaustive for small sets)
  let best = null;
  const P = primes.filter(p => p.cov.some(x => need.includes(x)));
  const essential = P.filter(p => need.some(m => P.filter(q => q.cov.includes(m)).length === 1 && p.cov.includes(m)));
  const rest = P.filter(p => !essential.includes(p));
  const covered0 = new Set(essential.flatMap(p => p.cov));
  const left = need.filter(m => !covered0.has(m));
  if (!left.length) best = essential;
  else if (rest.length <= 16) {
    for (let mask = 1; mask < 1 << rest.length; mask++) {
      const pick = rest.filter((_, i) => mask >> i & 1);
      const cov = new Set(pick.flatMap(p => p.cov));
      if (!left.every(m => cov.has(m))) continue;
      const cand = essential.concat(pick);
      if (!best || cand.length < best.length || (cand.length === best.length && cand.reduce((s, p) => s + lits(p), 0) < best.reduce((s, p) => s + lits(p), 0))) best = cand;
    }
  } else best = P;
  const names = "ABCD".slice(0, n);
  const term = p => { let s = ""; for (let i = 0; i < n; i++) { const bit = 1 << (n - 1 - i); if (p.m & bit) continue; s += names[i] + (p.v & bit ? "" : "'"); } return s || "1"; };
  best.sort((a, b) => lits(a) - lits(b) || a.v - b.v);
  return { sop: best.map(term).join(" + "), terms: best.map(p => ({ text: term(p), cov: p.cov })) };
}
function popc(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

export function kmapWidget(host, opts = {}) {
  let n = opts.vars || 3, vals = new Array(16).fill(0);
  host.innerHTML = `<div class="wg"><div class="row" style="justify-content:space-between"><span class="wg__t">K-map solver</span>
<div class="tabs" data-n><button type="button" data-v="2">2 vars</button><button type="button" data-v="3">3 vars</button><button type="button" data-v="4">4 vars</button></div></div>
<p class="wg__d">Click a cell to cycle 0 → 1 → X (don't care). Small numbers are the minterm indices. A is the most significant bit.</p>
<div data-map style="overflow-x:auto"></div>
<div class="note">Minimal sum of products</div><div class="expr" data-sop>F = 0</div>
<div class="note">Product of sums (from the 0s)</div><div class="expr" data-pos>F = 1</div>
<div class="note" data-list style="margin-top:6px"></div>
<div class="row" style="margin-top:10px"><button type="button" class="btn btn--sm btn--ghost" data-clear>Clear</button><button type="button" class="btn btn--sm btn--ghost" data-rand>Random</button></div></div>`;
  const q = s => host.querySelector(s);
  const gray = [0, 1, 3, 2];
  function layout() {
    const rv = n === 2 ? 1 : n === 3 ? 1 : 2, cv = n - rv;
    const rows = rv === 1 ? [0, 1] : gray, cols = cv === 1 ? [0, 1] : gray;
    const names = "ABCD";
    const rl = names.slice(0, rv), cl = names.slice(rv, n);
    let h = `<table class="kmap"><tr><th>${rl}\\${cl}</th>${cols.map(c => `<th>${c.toString(2).padStart(cv, "0")}</th>`).join("")}</tr>`;
    rows.forEach(r => {
      h += `<tr><th>${r.toString(2).padStart(rv, "0")}</th>`;
      cols.forEach(c => { const m = (r << cv) | c; const v = vals[m]; h += `<td><button type="button" data-m="${m}" class="${v === 1 ? "v1" : v === 2 ? "vx" : ""}" aria-label="minterm ${m}">${v === 2 ? "X" : v}<small>${m}</small></button></td>`; });
      h += `</tr>`;
    });
    q("[data-map]").innerHTML = h + "</table>";
    host.querySelectorAll("[data-n] button").forEach(b => b.classList.toggle("on", +b.dataset.v === n));
    solve();
  }
  function solve() {
    const N = 1 << n, ones = [], dcs = [], zeros = [];
    for (let m = 0; m < N; m++) (vals[m] === 1 ? ones : vals[m] === 2 ? dcs : zeros).push(m);
    const s = minimize(n, ones, dcs);
    q("[data-sop]").textContent = "F = " + s.sop;
    const z = minimize(n, zeros, dcs);
    // POS: complement of the SOP of F' -> De Morgan each term
    const pos = z.sop === "0" ? "1" : z.sop === "1" ? "0" : z.terms.map(t => "(" + t.text.match(/[A-D]'?/g).map(l => l.endsWith("'") ? l[0] : l + "'").join(" + ") + ")").join("");
    q("[data-pos]").textContent = "F = " + pos;
    q("[data-list]").textContent = `F = Σm(${ones.join(", ") || "-"})${dcs.length ? " + d(" + dcs.join(", ") + ")" : ""}`;
  }
  q("[data-map]").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return; const m = +b.dataset.m; vals[m] = (vals[m] + 1) % 3; layout(); });
  host.querySelectorAll("[data-n] button").forEach(b => b.addEventListener("click", () => { n = +b.dataset.v; vals = new Array(16).fill(0); layout(); }));
  q("[data-clear]").addEventListener("click", () => { vals = new Array(16).fill(0); layout(); });
  q("[data-rand]").addEventListener("click", () => { vals = vals.map(() => Math.random() < 0.45 ? 1 : Math.random() < 0.1 ? 2 : 0); layout(); });
  if (opts.ones) opts.ones.forEach(m => vals[m] = 1);
  layout();
}

/* ----------------------------------------------------------- waveform viewer */
// trace: [{label, you:{sig:BigInt}, exp?:{}, bad?:[names]}], ports: [{name, dir, w}]
export function waveform(host, trace, ports, opts = {}) {
  if (!trace || !trace.length) { host.innerHTML = '<div class="empty">No waveform.</div>'; return; }
  const maxSteps = opts.maxSteps || 64;
  let start = 0;
  const badIdx = trace.findIndex(t => t.bad && t.bad.length);
  if (trace.length > maxSteps) start = badIdx >= 0 ? Math.max(0, Math.min(trace.length - maxSteps, badIdx - maxSteps + 8)) : 0;
  const T = trace.slice(start, start + maxSteps);
  const rows = [];
  ports.filter(p => p.dir === "input").forEach(p => rows.push({ name: p.name, w: p.w, key: "you", cls: "" }));
  ports.filter(p => p.dir === "output").forEach(p => {
    rows.push({ name: p.name, w: p.w, key: "you", cls: "out", label: opts.compare ? p.name + " (you)" : p.name });
    if (opts.compare) rows.push({ name: p.name, w: p.w, key: "exp", cls: "exp", label: p.name + " (expected)" });
  });
  const nameW = Math.min(170, 14 + Math.max(...rows.map(r => (r.label || r.name).length)) * 7.2);
  const stepW = Math.max(22, Math.min(46, opts.stepW || 34)), rowH = 30, W = nameW + T.length * stepW + 10, H = rows.length * rowH + 24;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Waveform">`;
  T.forEach((t, i) => {
    const x = nameW + i * stepW;
    if (t.bad && t.bad.length) s += `<rect x="${x}" y="0" width="${stepW}" height="${H - 18}" class="wv-bad"/>`;
    s += `<line x1="${x}" y1="0" x2="${x}" y2="${H - 18}" class="wv-grid"/>`;
    if (i % 2 === 0) s += `<text x="${x + 2}" y="${H - 5}" class="wv-step">${esc(String(t.step != null ? t.step : start + i))}${t.label && /edge/.test(t.label) ? "↑" : ""}</text>`;
  });
  rows.forEach((r, ri) => {
    const y1 = ri * rowH + 6, y0 = y1 + 18;
    s += `<text x="4" y="${y1 + 13}" class="wv-name ${r.cls}">${esc(r.label || r.name)}</text>`;
    if (r.w === 1) {
      let d = "";
      T.forEach((t, i) => { const v = t[r.key] && t[r.key][r.name]; const y = v ? y1 : y0; const x = nameW + i * stepW; d += (i ? ` V${y}` : `M${x} ${y}`) + ` H${x + stepW}`; });
      s += `<path d="${d}" class="wv-line ${r.cls}"/>`;
    } else {
      let i = 0;
      while (i < T.length) {
        const v = T[i][r.key] ? T[i][r.key][r.name] : 0n; let j = i;
        while (j + 1 < T.length && (T[j + 1][r.key] ? T[j + 1][r.key][r.name] : 0n) === v) j++;
        const x1 = nameW + i * stepW + 2, x2 = nameW + (j + 1) * stepW - 2, ym = (y1 + y0) / 2;
        s += `<path d="M${x1} ${ym} L${x1 + 4} ${y1} H${x2 - 4} L${x2} ${ym} L${x2 - 4} ${y0} H${x1 + 4} Z" class="wv-bus ${r.cls}"/>`;
        const txt = BigInt(v).toString(16).toUpperCase();
        if (x2 - x1 > txt.length * 6 + 6) s += `<text x="${(x1 + x2) / 2}" y="${ym + 3.5}" text-anchor="middle" class="wv-val">${txt}</text>`;
        i = j + 1;
      }
    }
  });
  host.innerHTML = `<div class="wave">${s}</svg></div>${trace.length > maxSteps ? `<p class="note" style="margin-top:4px">Showing steps ${start}-${start + T.length - 1} of ${trace.length}${badIdx >= 0 ? " (around the first mismatch)" : ""}. Bus values are hex.</p>` : '<p class="note" style="margin-top:4px">Bus values are shown in hex. ↑ marks steps right after a rising clock edge.</p>'}`;
}
