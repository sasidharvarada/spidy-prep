/* ==========================================================================
   Question rendering for every non-coding type (mcq, num, con, self) plus
   the per-question tools: bookmark, difficulty mark, notes, own tags.
   ========================================================================== */
import { store } from "./store.js";
import { MODS, TRACK, LESSONS, optionOrder, checkNum, TYPE_NAME } from "./registry.js";
import { $, $$, esc, pill, toast, copy } from "./ui.js";

/* Best-matching topic of the module for a question (used for hints and "related") */
export function topicFor(q) {
  const m = MODS.get(q.mod); if (!m || !m.topics.length) return null;
  const words = new Set(String(q.q + " " + (q.sol || q.model || "")).toLowerCase().match(/[a-z0-9]{3,}/g) || []);
  let best = null, bs = 0;
  for (const t of m.topics) { const tw = String(t.n + " " + t.learn).toLowerCase().match(/[a-z0-9]{3,}/g) || []; let s = 0; tw.forEach(w => { if (words.has(w)) s++; }); if (s > bs) { bs = s; best = t; } }
  return best;
}
export const hintFor = q => q.hint ? { own: true, text: q.hint } : (() => { const t = topicFor(q); return t ? { own: false, text: `Revisit "${t.n}"${t.learn ? `: ${t.learn}` : ""}.` } : null; })();

export function metaRow(q, opts = {}) {
  const m = MODS.get(q.mod), t = TRACK[m.track];
  return `<div class="qmeta">${pill(TYPE_NAME(q.type), "type")}${q.level ? pill(q.level) : ""}${q.sub ? pill(q.sub, "sub") : ""}${q.key ? pill("Key", "key") : ""}
${opts.noMod ? "" : `<a class="pill pill--mod" href="#/m/${m.id}" style="--c:${t.color}">${esc(t.short)} · ${esc(m.title)}</a>`}${store.tags(q.id).map(x => `<span class="pill pill--tag">${esc(x)}</span>`).join("")}</div>`;
}

/* steps: split a solution into readable steps when it has several sentences */
export function solHtml(s) {
  if (!s) return "";
  const parts = String(s).split(/(?<=[.;])\s+(?=[A-Z0-9(=])|\s+→\s+|\n/).map(x => x.trim()).filter(Boolean);
  return parts.length > 2 ? `<ol class="steps">${parts.map(p => `<li>${esc(p)}</li>`).join("")}</ol>` : `<p>${esc(s)}</p>`;
}

function attLine(q) {
  const a = store.att(q.id);
  return a ? `<span class="note">Attempts: ${a.n} · right: ${a.ok} (${Math.round(100 * a.ok / a.n)}%)${a.lastOk === 0 ? " · last answer wrong" : ""}</span>` : `<span class="note">Not attempted yet</span>`;
}

/* Tools bar under a question */
export function toolsHtml(q) {
  const mk = store.mark(q.id);
  return `<div class="qtools" data-q="${esc(q.id)}">
<button class="tbtn${store.bm(q.id) ? " on" : ""}" data-act="bm" aria-pressed="${store.bm(q.id)}">${store.bm(q.id) ? "★ Bookmarked" : "☆ Bookmark"}</button>
<span class="seg" role="group" aria-label="How hard was it for you">${["easy", "medium", "difficult"].map(v => `<button class="${mk === v ? "on" : ""}" data-act="mark" data-v="${v}" aria-pressed="${mk === v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join("")}</span>
<button class="tbtn" data-act="note">${store.note(q.id) ? "✎ Edit note" : "✎ Note"}</button>
<button class="tbtn" data-act="tag" title="Tag with a company or interview where you saw it">＃ Tag</button>
<span class="qtools__att">${attLine(q)}</span></div>
<div class="qnote" ${store.note(q.id) ? "" : "hidden"}><textarea aria-label="Your note" placeholder="Your own note: a trick, a mistake to avoid...">${esc(store.note(q.id))}</textarea></div>`;
}
export function wireTools(host, q, onChange) {
  host.addEventListener("click", e => {
    const b = e.target.closest(".qtools [data-act]"); if (!b || b.closest(".qtools").dataset.q !== q.id) return;
    const act = b.dataset.act;
    if (act === "bm") { const on = store.toggleBm(q.id); b.classList.toggle("on", on); b.textContent = on ? "★ Bookmarked" : "☆ Bookmark"; toast(on ? "Bookmarked - it is in your revision queue." : "Bookmark removed."); }
    if (act === "mark") { store.setMark(q.id, b.dataset.v); $$("[data-act=mark]", b.parentNode).forEach(x => { const on = store.mark(q.id) === x.dataset.v; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); }); }
    if (act === "note") { const n = $(".qnote", host); n.hidden = !n.hidden; if (!n.hidden) $("textarea", n).focus(); }
    if (act === "tag") {
      const cur = store.tags(q.id).join(", ");
      const v = prompt("Your own tags for this question (for example the company or interview where you were asked it). Separate with commas.", cur);
      if (v != null) { store.setTags(q.id, v.split(",")); toast("Tags saved."); onChange && onChange(); }
    }
  });
  const ta = $(".qnote textarea", host); if (ta) ta.addEventListener("input", () => store.setNote(q.id, ta.value));
}

/* ------------------------------------------------------------------ the card */
// opts: { mock: true } -> no feedback until submit (answer kept in opts.answers)
export function renderQ(host, q, opts = {}) {
  const head = opts.hideStem ? "" : `<div class="qstem">${opts.num ? `<span class="qnum">${opts.num}.</span>` : ""}${esc(q.q)}</div>`;
  if (q.type === "mcq") {
    const ord = optionOrder(q);
    host.innerHTML = `${head}<div class="opts">${ord.map((k, i) => `<button type="button" class="opt" data-k="${k}"><b>${"ABCDEF"[i]}</b><span>${esc(q.o[k])}</span></button>`).join("")}</div><div class="qres"></div>`;
    if (opts.mock) {
      const sel = opts.answers[q.id]; if (sel != null) $$(".opt", host).forEach(b => b.classList.toggle("sel", +b.dataset.k === sel));
      host.onclick = e => { const b = e.target.closest(".opt"); if (!b) return; opts.answers[q.id] = +b.dataset.k; $$(".opt", host).forEach(x => x.classList.toggle("sel", x === b)); opts.onPick && opts.onPick(); };
      return;
    }
    host.onclick = e => {
      const b = e.target.closest(".opt"); if (!b || b.disabled) return;
      const k = +b.dataset.k, ok = k === q.a;
      $$(".opt", host).forEach(x => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      store.record(q.id, ok);
      $(".qres", host).innerHTML = `<div class="why ${ok ? "ok" : "bad"}"><b>${ok ? "Correct." : "Not quite."}</b> ${solHtml(q.sol)}</div>`;
      opts.onAnswer && opts.onAnswer(ok);
    };
    return;
  }
  if (q.type === "num") {
    host.innerHTML = `${head}<form class="numrow"><label class="sr" for="na-${esc(q.id)}">Your answer</label><input id="na-${esc(q.id)}" class="numin" inputmode="decimal" autocomplete="off" placeholder="Your answer" value="${opts.mock && opts.answers[q.id] != null ? esc(opts.answers[q.id]) : ""}">${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""}${opts.mock ? "" : `<button class="btn btn--ink btn--sm">Check</button><button type="button" class="btn btn--ghost btn--sm" data-show>Show solution</button>`}</form>
<p class="note">Numbers like 4.7k, 2.2e-3, 1/3 are fine. ${q.tol != null ? `Within ${Math.round(q.tol * 100)}% counts as right.` : Number.isInteger(q.ans) ? "Give the exact value." : "Within 2% counts as right."}</p><div class="qres"></div>`;
    const inp = $(".numin", host);
    if (opts.mock) { inp.addEventListener("input", () => { opts.answers[q.id] = inp.value; opts.onPick && opts.onPick(); }); return; }
    const show = (ok, revealed) => { $(".qres", host).innerHTML = `<div class="why ${ok ? "ok" : revealed ? "" : "bad"}"><b>${ok ? "Correct." : revealed ? "Solution." : "Not quite."}</b> Answer: <b class="mono">${esc(fmtAns(q))}</b>${solHtml(q.sol)}</div>`; };
    $("form", host).onsubmit = e => {
      e.preventDefault(); const r = checkNum(q, inp.value);
      if (r == null) { toast("Type a number (you can use k, m, u, n, e-3 or a fraction)."); inp.focus(); return; }
      store.record(q.id, r); show(r); inp.classList.toggle("ok", r); inp.classList.toggle("bad", !r); opts.onAnswer && opts.onAnswer(r);
    };
    $("[data-show]", host).onclick = () => show(false, true);
    return;
  }
  if (q.type === "con") {
    const s = store.iv(q.id);
    host.innerHTML = `${head}<label class="sr" for="ca-${esc(q.id)}">Your answer</label><textarea id="ca-${esc(q.id)}" class="ans" placeholder="Answer in your own words, as you would say it in the interview...">${esc(s.answer || "")}</textarea>
<div class="row" style="margin-top:8px"><button class="btn btn--ink btn--sm" data-chk>Check my answer</button><button class="btn btn--ghost btn--sm" data-show>Just show the answer</button><button class="btn btn--ghost btn--sm" data-ai>Copy AI grading prompt</button></div><div class="qres"></div>`;
    const ta = $("textarea", host); ta.addEventListener("input", () => store.setIv(q.id, { answer: ta.value }));
    const reveal = scoreIt => {
      const ans = ta.value.trim(); let hit = 0;
      const keys = (q.keys || []).map(([label, re]) => { let h = false; try { h = scoreIt && new RegExp(re, "i").test(ans); } catch (e) { } if (h) hit++; return `<span class="key${h ? " hit" : ""}">${h ? "✓ " : ""}${esc(label)}</span>`; }).join("");
      $(".qres", host).innerHTML = `<div class="model"><h4>MODEL ANSWER</h4><p>${esc(q.model)}</p>${q.keys && q.keys.length ? `<h4 style="margin-top:10px">KEY POINTS${scoreIt ? " YOU MENTIONED" : ""}</h4><div class="keys">${keys}</div>` : ""}
${scoreIt && q.keys && q.keys.length ? `<p class="note" style="margin-top:8px">Covered <b>${hit} / ${q.keys.length}</b> key points. Keyword matching is only a guide - judge your clarity too.</p>` : ""}
<div class="row" style="margin-top:10px"><button class="btn btn--green btn--sm" data-r="good">✓ I nailed it</button><button class="btn btn--amber btn--sm" data-r="review">↻ Review again</button></div></div>`;
      $$("[data-r]", host).forEach(b => b.onclick = () => { const good = b.dataset.r === "good"; store.setIv(q.id, { rating: b.dataset.r }); store.record(q.id, good); toast(good ? "Marked as nailed." : "Added to your revision queue."); opts.onAnswer && opts.onAnswer(good); $$("[data-r]", host).forEach(x => x.disabled = true); });
    };
    $("[data-chk]", host).onclick = () => { if (!ta.value.trim()) { toast("Write an answer first, even a short one."); ta.focus(); return; } reveal(true); };
    $("[data-show]", host).onclick = () => reveal(false);
    $("[data-ai]", host).onclick = async () => toast(await copy(gradePrompt(q, ta.value.trim())) ? "Prompt copied - paste it into any AI chat." : "Could not copy.");
    if (s.rating) reveal(false);
    return;
  }
  if (q.type === "self") {
    const draw = () => {
      const on = store.done(q.id);
      host.innerHTML = `<div class="qstem">${esc(q.title || "")}</div><p class="selfq">${esc(q.q)}</p><p class="note">${esc(q.group || "")}</p>
<div class="row" style="margin-top:10px"><button class="btn btn--sm ${on ? "btn--green" : "btn--ink"}" data-tk>${on ? "✓ Done" : "Mark as done"}</button><button class="btn btn--ghost btn--sm" data-ai>Copy AI prompt</button></div>
<p class="note" style="margin-top:8px">A checklist task from your Embedded Tracker: do it on paper, in a simulator or on a board, then tick it. Ticks sync with the tracker ids.</p>`;
      $("[data-tk]", host).onclick = () => { store.setDone(q.id, !store.done(q.id)); draw(); opts.onAnswer && opts.onAnswer(store.done(q.id)); };
      $("[data-ai]", host).onclick = async () => toast(await copy(`I am preparing for ECE interviews. Topic: ${q.group} - ${q.title}.\nTask: ${q.q}\nFirst explain the idea simply with a worked example, then let me try the task and check my answer step by step.`) ? "Prompt copied." : "Could not copy.");
    };
    draw(); return;
  }
  host.innerHTML = `${head}<a class="btn btn--red btn--sm" href="#/q/${encodeURIComponent(q.id)}">Open in the editor →</a>`;
}
export function fmtAns(q) { const a = q.ans; const s = Math.abs(a) >= 1e6 || (Math.abs(a) < 1e-3 && a !== 0) ? a.toExponential(3) : String(+a.toPrecision(5)); return `${s}${q.unit ? " " + q.unit : ""}`; }

export function gradePrompt(q, answer) {
  const m = MODS.get(q.mod);
  return [`Act as a strict but kind technical interviewer for an ECE fresher role (${TRACK[m.track].title}, topic: ${m.title}).`, "",
    `Question: ${q.q}`, "", `My answer: ${answer || "(I could not answer - teach me)"}`, "",
    `Reference points a strong answer covers: ${(q.keys || []).map(k => k[0]).join("; ")}`, "",
    "1. Score my answer out of 10 and say what was missing or wrong.", "2. Give a better answer I could say in about 60 seconds.", "3. Ask me two follow-up questions an interviewer would ask next, one at a time."].join("\n");
}

/* Related concepts: module, best topic, lessons */
export function relatedHtml(q) {
  const m = MODS.get(q.mod), t = topicFor(q);
  const ls = m.lessons.map(id => LESSONS.get(id));
  const also = (q.also || []).map(id => MODS.get(id)).filter(Boolean);
  return `<div class="related"><h4>Related</h4><ul>
<li>Module: <a href="#/m/${m.id}">${esc(m.title)}</a>${also.map(x => `, <a href="#/m/${x.id}">${esc(x.title)}</a>`).join("")}</li>
${t ? `<li>Topic: <a href="#/m/${m.id}/learn">${esc(t.n)}</a></li>` : ""}
${ls.map(l => `<li>Lesson: <a href="#/lesson/${l.id}">${esc(l.title)}</a></li>`).join("")}
${(m.sims || []).length ? `<li>Try it: <a href="#/m/${m.id}/simulate">simulations for this module</a></li>` : ""}</ul></div>`;
}
