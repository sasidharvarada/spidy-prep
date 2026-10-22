/* Small shared UI helpers */
export { esc, ring } from "./widgets.js";
import { esc } from "./widgets.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const app = () => document.getElementById("app");
export const SITE = "Spidy ECE Prep";

export function toast(msg) { const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2800); }
export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (x) { } ta.remove(); return ok; }
}
export const setTitle = t => { document.title = t ? `${t} · ${SITE}` : `${SITE} - learn, practise and prepare for ECE interviews`; };
export const pill = (l, cls) => l ? `<span class="pill pill--${(cls || l).toLowerCase()}">${esc(l)}</span>` : "";
export const tick = on => `<span class="tick${on ? " on" : ""}" aria-hidden="true">✓</span>`;
export const bar = (p, c) => `<div class="bar" style="--c:${c || "var(--red)"}" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`;
export const pct = p => `${Math.round(p || 0)}%`;
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
export const fmtMins = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
export const fmtDate = (d, o) => d.toLocaleDateString(undefined, o || { weekday: "short", day: "numeric", month: "short" });
export const empty = (msg, action) => `<div class="empty card">${msg}${action ? `<div style="margin-top:10px">${action}</div>` : ""}</div>`;
export const loading = msg => `<div class="loading"><span class="spin"></span> ${esc(msg || "Loading...")}</div>`;
export const extLink = (r) => `<a class="ext" href="${esc(r.u)}" target="_blank" rel="noopener noreferrer"><span class="ext__k ext__k--${r.k}">${{ video: "Video", read: "Read", practice: "Practice" }[r.k] || "Link"}</span><span class="ext__t">${esc(r.t)}</span><span class="ext__go" aria-hidden="true">↗</span></a>`;

/* simple line chart (SVG) for small series */
export function lineChart(series, opts = {}) {
  const W = opts.w || 560, H = opts.h || 150, P = 26, n = series[0].v.length;
  const mx = Math.max(opts.min || 1, ...series.flatMap(s => s.v));
  const x = i => P + (W - P - 8) * (n === 1 ? 0.5 : i / (n - 1)), y = v => H - 20 - (H - 34) * v / mx;
  const grid = [0, 0.5, 1].map(f => `<line x1="${P}" x2="${W - 8}" y1="${y(mx * f)}" y2="${y(mx * f)}" class="ch-grid"/><text x="${P - 5}" y="${y(mx * f) + 3}" class="ch-ax" text-anchor="end">${+(mx * f).toFixed(1)}</text>`).join("");
  const lines = series.map(s => `<polyline fill="none" stroke="${s.c}" stroke-width="2.2" stroke-linejoin="round" points="${s.v.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"/>${s.v.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${v ? 2.6 : 0}" fill="${s.c}"><title>${esc(opts.labels ? opts.labels[i] : i)}: ${v} ${esc(s.name)}</title></circle>`).join("")}`).join("");
  const labs = (opts.labels || []).map((l, i) => i % (opts.every || 7) === 0 ? `<text x="${x(i)}" y="${H - 4}" class="ch-ax" text-anchor="middle">${esc(l)}</text>` : "").join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(opts.aria || "chart")}">${grid}${lines}${labs}</svg>${series.length > 1 ? `<div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${esc(s.name)}</span>`).join("")}</div>` : ""}`;
}
export function donut(parts, size = 150, center = "") {
  const tot = parts.reduce((s, p) => s + p.v, 0) || 1, r = 52, c = 2 * Math.PI * r; let off = 0;
  const segs = parts.map(p => { const len = c * p.v / tot; const s = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${p.c}" stroke-width="18" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(p.name)}: ${p.v}</title></circle>`; off += len; return s; }).join("");
  return `<div class="donut"><svg viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="${esc(parts.map(p => p.name + " " + p.v).join(", "))}"><circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--hair)" stroke-width="18"/>${segs}<text x="70" y="76" text-anchor="middle" class="ring__v">${esc(center)}</text></svg><div class="legend legend--col">${parts.map(p => `<span><i style="background:${p.c}"></i>${esc(p.name)} <b>${p.v}</b></span>`).join("")}</div></div>`;
}

export function icon(n) {
  const a = 'class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  return ({
    home: `<svg ${a}><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/></svg>`,
    book: `<svg ${a}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/></svg>`,
    code: `<svg ${a}><path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13 4-2 16"/></svg>`,
    mic: `<svg ${a}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`,
    flask: `<svg ${a}><path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/></svg>`,
    cal: `<svg ${a}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    chart: `<svg ${a}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
    search: `<svg ${a}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
    moon: `<svg ${a}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>`,
    sun: `<svg ${a}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    play: `<svg ${a}><path d="M7 4v16l13-8z"/></svg>`,
    star: `<svg ${a}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`,
    repeat: `<svg ${a}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>`,
    timer: `<svg ${a}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>`,
    cloud: `<svg ${a}><path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z"/></svg>`,
    bookmark: `<svg ${a}><path d="M6 3h12v18l-6-4-6 4z"/></svg>`,
    chip: `<svg ${a}><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>`,
  })[n] || "";
}

/* code editor (CodeMirror 5 when loaded, else a textarea) */
export function makeEditor(host, value, mode, onChange) {
  if (window.CodeMirror) {
    const cm = window.CodeMirror(host, {
      value, mode, lineNumbers: true, indentUnit: 2, tabSize: 2, smartIndent: true, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
      extraKeys: { Tab: c => c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("  ", "end"), "Ctrl-Enter": () => host.dispatchEvent(new CustomEvent("run")), "Cmd-Enter": () => host.dispatchEvent(new CustomEvent("run")) },
    });
    let marked = null;
    cm.on("change", () => { if (marked != null) { cm.removeLineClass(marked, "background", "cm-error-line"); marked = null; } onChange && onChange(cm.getValue()); });
    setTimeout(() => cm.refresh(), 0);
    return {
      get: () => cm.getValue(), set: v => cm.setValue(v), focus: () => cm.focus(),
      markLine(n) { if (marked != null) cm.removeLineClass(marked, "background", "cm-error-line"); if (n > 0 && n <= cm.lineCount()) { marked = n - 1; cm.addLineClass(marked, "background", "cm-error-line"); cm.scrollIntoView({ line: marked, ch: 0 }, 80); } },
    };
  }
  const ta = document.createElement("textarea"); ta.className = "fallback-ed"; ta.spellcheck = false; ta.value = value;
  ta.addEventListener("input", () => onChange && onChange(ta.value));
  ta.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") host.dispatchEvent(new CustomEvent("run")); });
  host.appendChild(ta);
  return { get: () => ta.value, set: v => { ta.value = v; }, focus: () => ta.focus(), markLine() { } };
}

/* "Copy AI prompt" text for a module or question - teaching prompt, never claims content */
export function tutorPrompt(m, extra) {
  return [`You are my patient teacher. I am preparing for ECE job interviews (embedded, VLSI and core electronics) in India.`, "",
    `Module: ${m.title}`, ...(m.topics.length ? ["Topics:", ...m.topics.map((t, i) => `${i + 1}. ${t.n}${t.learn ? " - " + t.learn : ""}`)] : []), extra ? "\n" + extra : "", "",
    "Teach in this order:", "1. Each idea in simple words and where it is used in real chips or boards.", "2. Diagrams drawn with text, truth tables, waveforms, formulas with units - explain every symbol.",
    "3. One fully worked example per topic.", "4. Common mistakes and what people confuse it with.", "5. A short summary table.",
    "6. Then give me 5 problems from easy to interview level, one at a time. Wait for my answer, check it, explain my mistakes.",
    "7. Finally ask me 3 interview questions and grade my answers out of 10.", "", "Use simple English. Stop after step 5 and wait for me to say 'ready'."].join("\n");
}

/* page lifecycle + modal (shared by all views) */
export const ctx = { cleanup: [] };
export const rerender = () => dispatchEvent(new HashChangeEvent("hashchange"));
export function openModal(html, onOpen) {
  const m = $("#modal"); m.innerHTML = `<div class="modal__bg" data-close></div><div class="modal__box" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false;
  m.querySelector("[data-close]").onclick = closeModal; $$("[data-close-btn]", m).forEach(b => b.onclick = closeModal);
  onOpen && onOpen(m.querySelector(".modal__box"));
}
export function closeModal() { const m = $("#modal"); if (m && !m.hidden) { m.hidden = true; m.innerHTML = ""; } }
