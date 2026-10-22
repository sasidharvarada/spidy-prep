/* ==========================================================================
   Registry: builds one connected model from every content source.
     tracks -> parts -> modules -> topics
     questions (all types) -> module, lessons -> modules, resources -> modules
   Ids are stable so progress survives content edits:
     tracker path topic   p:<track>:<slug>      (same as the Embedded Tracker)
     tracker checklist    <sec>:<topic>:<row>   (same as the Embedded Tracker)
     new module topic     t:<module>:<slug>
   ========================================================================== */
import { TRACKER_PATH } from "../data/tracker-path.js";
import { SYL } from "../data/tracker-syl.js";
import { PWEEKS } from "../data/pweeks.js";
import { NEW_MODULES } from "../data/roadmap-new.js";
import { Q_DIGITAL } from "../data/qb/q-digital.js";
import { Q_VLSI } from "../data/qb/q-vlsi.js";
import { Q_EMBEDDED } from "../data/qb/q-embedded.js";
import { Q_DSA, DSA_PROBLEMS } from "../data/qb/q-dsa.js";
import { Q_APT } from "../data/qb/q-apt.js";
import { Q_CORE } from "../data/qb/q-core.js";
import { EXPLAIN } from "../data/qb/q-explain.js";
import { EMBEDDED_COURSE } from "../data/v1/course-embedded.js";
import { VLSI_COURSE } from "../data/v1/course-vlsi.js";
import { C_PROBLEMS } from "../data/v1/c-problems.js";
import { VERILOG_PROBLEMS } from "../data/v1/verilog-problems.js";
import { CIRCUIT_PROBLEMS } from "../data/v1/circuit-problems.js";
import { MCQ_EXTRA } from "../data/v1/mcq.js";
import { INTERVIEW } from "../data/v1/interview.js";

export const slug = x => String(x).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const hashNum = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };

/* ---------------------------------------------------------------- modules */
export const MODS = new Map();
function addMod(m) { m.topics = m.topics || []; m.notes = m.notes || []; m.formulas = m.formulas || []; m.lessons = []; m.qs = []; m.tracks = []; MODS.set(m.id, m); return m; }

// 1) Embedded Tracker study path (tick ids identical to the tracker)
const TRACKER_TRACKS = [];
(function parsePath(txt) {
  let T = null, L = null;
  txt.split("\n").forEach(line => {
    line = line.trim(); if (!line) return;
    if (line.startsWith("## ")) { L = { name: line.slice(3).replace(/^Level\s+\d+\s*-\s*/i, "").trim(), items: [] }; if (T) T.levels.push(L); return; }
    if (line.startsWith("# ")) { const p = line.slice(2).split("|").map(x => x.trim()); T = { id: p[0], name: p[1], when: p[2], kind: p[3] || "study", desc: p[4] || "", levels: [] }; TRACKER_TRACKS.push(T); L = null; return; }
    if (line.startsWith("- ") && L) { const p = line.slice(2).split("|").map(x => x.trim()); L.items.push({ n: p[0], learn: p[1] || "", probs: (p[2] || "").split(";;").map(x => x.trim()).filter(Boolean) }); }
  });
  const SHORT = { res: "Resume", c: "C", dsa: "DSA", mcu: "MCU", proto: "Protocols", rtos: "RTOS", circ: "Circuits", semi: "Semiconductors", de: "Digital", vlsi: "Verilog", arch: "Arch & OS", apt: "Aptitude" };
  TRACKER_TRACKS.forEach(t => {
    const seen = {};
    t.levels.forEach((l, li) => {
      addMod({
        id: `${t.id}-${li + 1}`, title: `${SHORT[t.id] || t.name}: ${l.name}`, name: l.name, src: "tracker", group: t.name, when: t.when, desc: li === 0 ? t.desc : "",
        topics: l.items.map(it => { let s = slug(it.n); if (seen[s]) s += "-" + (++seen[s]); else seen[s] = 1; return { id: `p:${t.id}:${s}`, n: it.n, learn: it.learn, probs: it.probs }; }),
      });
    });
  });
})(TRACKER_PATH);

// 2) New modules written for this platform
(function parseNew(txt) {
  let M = null;
  txt.split("\n").forEach(line => {
    line = line.trim(); if (!line) return;
    if (line.startsWith("## ")) { const [id, title] = line.slice(3).split("|").map(x => x.trim()); M = addMod({ id, title, src: "new" }); return; }
    if (!M) return;
    if (line.startsWith("> ")) M.notes.push(line.slice(2));
    else if (line.startsWith("= ")) M.formulas.push(line.slice(2));
    else if (line.startsWith("- ")) { const p = line.slice(2).split("|").map(x => x.trim()); M.topics.push({ id: `t:${M.id}:${slug(p[0])}`, n: p[0], learn: p[1] || "", probs: (p[2] || "").split(";;").map(x => x.trim()).filter(Boolean) }); }
  });
})(NEW_MODULES);

// 3) Modules built from tracker checklist sections that have no study-path track
const SYL_BY = Object.fromEntries(SYL.map(d => [d.id, d]));
const SYL_MODS = { stor: ["fw-stor", "Storage and filesystems"], boot: ["fw-boot", "Bootloader and OTA updates"], sec: ["fw-sec", "Firmware security"], iot: ["fw-iot", "Wireless and IoT"], pwr: ["fw-pwr", "Low-power firmware"], pcb: ["pcb-1", "PCB literacy"], soft: ["hr-1", "HR round and getting hired"] };
for (const [sec, [id, title]] of Object.entries(SYL_MODS)) {
  const d = SYL_BY[sec];
  addMod({ id, title, src: "checklist", desc: d.desc, topics: d.topics.map((t, ti) => ({ id: `s:${sec}:${ti}`, n: t.n, learn: t.subs.map(s => s.n).join(", "), probs: [], syl: [sec, ti] })) });
}

/* ---------------------------------------------------------------- tracks */
const R = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}-${a + i}`);
export const TRACKS = [
  { id: "vlsi", title: "VLSI Design", short: "VLSI", color: "#9333EA", blurb: "Devices to CMOS, Verilog RTL, verification, synthesis, timing, low power, physical design and DFT.", parts: [
    ["Semiconductor devices", R("semi", 1, 4)], ["CMOS circuits", R("semi", 5, 7)], ["Verilog RTL", ["vlsi-1", "vlsi-2", "vlsi-3", "vlsi-5", "vlsi-8"]],
    ["Verification", ["vlsi-4", "sv-1", "sv-2", "sv-3"]], ["Synthesis and timing", ["syn-1", "syn-2", "vlsi-7"]], ["Low power and memory", ["lp-1", "mem-1"]],
    ["Physical design and DFT", ["vlsi-6", "pd-1", "pd-2", "dft-1", "eda-1"]]] },
  { id: "digital", title: "Digital Electronics", short: "Digital", color: "#E63946", blurb: "Number systems, Boolean algebra, K-maps, combinational and sequential circuits, FSMs, timing and memory.", parts: [
    ["Number systems and logic", R("de", 1, 4)], ["Combinational and sequential", R("de", 5, 8)], ["Timing and memory", ["de-9", "de-10"]]] },
  { id: "embedded", title: "Embedded Systems", short: "Embedded", color: "#2563EB", blurb: "Embedded C, Cortex-M, peripherals, protocols, FreeRTOS, Embedded Linux, debugging and architecture.", parts: [
    ["C for embedded", R("c", 1, 8)], ["Microcontrollers", [...R("mcu", 1, 7), "plat-1", "plat-2"]], ["Communication protocols", R("proto", 1, 6)], ["RTOS", R("rtos", 1, 5)],
    ["Embedded Linux and debugging", ["lnx-1", "lnx-2", "edbg-1"]], ["Computer architecture and OS", R("arch", 1, 4)], ["Advanced firmware", ["fw-stor", "fw-boot", "fw-sec", "fw-iot", "fw-pwr"]]] },
  { id: "dsa", title: "DSA in C", short: "DSA", color: "#0D9488", blurb: "Striver-style order: complexity, arrays, strings, sorting, stacks, lists, hashing, recursion, graphs, greedy and DP.", parts: [
    ["Foundations", R("dsa", 1, 4)], ["Data structures", R("dsa", 5, 7)], ["Algorithms", R("dsa2", 1, 4)]] },
  { id: "aptitude", title: "Aptitude", short: "Aptitude", color: "#D97706", blurb: "Quantitative, logical and verbal sections of placement online tests.", parts: [["Aptitude", R("apt", 1, 3)]] },
  { id: "core", title: "Core ECE", short: "Core ECE", color: "#16A34A", blurb: "Networks, analog, signals, control, communication, electromagnetics, maths and PCB for core and GATE-style rounds.", parts: [
    ["Circuits and networks", ["circ-1", "circ-2", "net-1", "net-2"]], ["Analog electronics", [...R("circ", 3, 7), "ana-1", "ana-2"]], ["Devices (shared with VLSI)", R("semi", 1, 3)],
    ["Signals and systems", ["sig-1", "sig-2"]], ["Control systems", ["ctl-1", "ctl-2"]], ["Communication", ["com-1", "com-2"]], ["Electromagnetics", ["emt-1", "emt-2"]],
    ["Engineering maths", R("math", 1, 3)], ["PCB", ["pcb-1"]]] },
  { id: "career", title: "Resume and HR", short: "Career", color: "#475569", blurb: "Your own projects told well, STAR stories and the HR round.", parts: [["Resume projects", R("res", 1, 7)], ["HR and getting hired", ["hr-1"]]] },
].map(t => ({ ...t, parts: t.parts.map(([title, mods]) => ({ title, mods })) }));
export const TRACK = Object.fromEntries(TRACKS.map(t => [t.id, t]));
TRACKS.forEach(t => t.parts.forEach(p => p.mods.forEach(id => {
  const m = MODS.get(id); if (!m) { console.warn("Missing module", id); return; }
  m.tracks.push(t.id); if (!m.track) { m.track = t.id; m.part = p.title; }
})));
TRACKS.forEach(t => { t.mods = t.parts.flatMap(p => p.mods).filter(id => MODS.has(id)); });
// Order inside a track = roadmap order (number shown as 1, 2, 3 ...)
TRACKS.forEach(t => t.mods.forEach((id, i) => { const m = MODS.get(id); if (m.track === t.id) m.num = i + 1; }));
for (const m of MODS.values()) if (!m.track) console.warn("Module not in any track", m.id);

/* ---------------------------------------------------------------- lessons (v1 courses) */
const LESSON_MODS = {
  "e-types": ["c-1"], "e-volatile": ["c-6"], "e-bits": ["c-5"], "e-memory": ["c-3"], "e-structs": ["c-4"], "e-arch": ["mcu-1"], "e-boot": ["mcu-3"], "e-gpio": ["mcu-5"],
  "e-irq": ["mcu-4"], "e-timers": ["mcu-5"], "e-adc": ["mcu-6"], "e-uart": ["proto-2"], "e-spi": ["proto-3"], "e-i2c": ["proto-4"], "e-can": ["proto-5"],
  "e-rtos-tasks": ["rtos-1", "rtos-2"], "e-rtos-sync": ["rtos-3"], "e-rtos-comm": ["rtos-4", "rtos-5"], "e-debug": ["edbg-1"],
  "v-num": ["de-1"], "v-gates": ["de-2", "de-3"], "v-kmap": ["de-4"], "v-comb": ["de-5"], "v-latch": ["de-6"], "v-fsm": ["de-7", "de-8"], "v-timing": ["de-9", "vlsi-5"],
  "v-mosfet": ["semi-3", "semi-4"], "v-cmos": ["semi-5", "semi-6"], "v-power": ["semi-7", "lp-1"], "v-vbasics": ["vlsi-1", "vlsi-2"], "v-vseq": ["vlsi-3"], "v-vtb": ["vlsi-4"],
  "v-sta": ["vlsi-7"], "v-flow": ["vlsi-6", "eda-1"], "v-mem": ["de-10", "mem-1", "arch-3"],
};
export const LESSONS = new Map();
for (const C of [EMBEDDED_COURSE, VLSI_COURSE]) C.modules.forEach(cm => cm.lessons.forEach(l => {
  const mods = LESSON_MODS[l.id] || []; const L = Object.assign({ course: C.id, courseTitle: C.title, chapter: cm.title, mods }, l);
  LESSONS.set(l.id, L); mods.forEach(id => MODS.get(id) && MODS.get(id).lessons.push(l.id));
  if (!mods.length) console.warn("Lesson without module", l.id);
}));

/* ---------------------------------------------------------------- questions */
export const QUESTIONS = [];
export const Q = new Map();
function addQ(q) { if (Q.has(q.id)) { console.warn("Duplicate question id", q.id); return; } if (!MODS.has(q.mod)) { console.warn("Question with unknown module", q.id, q.mod); return; } Q.set(q.id, q); QUESTIONS.push(q); MODS.get(q.mod).qs.push(q.id); (q.also || []).forEach(m => MODS.get(m) && MODS.get(m).qs.push(q.id)); }

// keyword router for the v1 MCQs and interview questions
const route = (text, rules, def) => { for (const [re, m] of rules) if (re.test(text)) return m; return def; };
const RULES = {
  C: [[/volatile|const|static|extern|register keyword|inline/i, "c-6"], [/malloc|heap|stack|free\(|leak/i, "c-3"], [/struct|union|padding|endian|align/i, "c-4"], [/bit|mask|shift|<<|>>|\^|&/i, "c-5"], [/pointer|\*p|NULL|array/i, "c-2"], [/string|strcpy|char s/i, "c-7"], [/macro|#define|preprocess/i, "c-6"]],
  MCU: [[/adc|dac|dma/i, "mcu-6"], [/interrupt|nvic|exception|pendsv|isr|latency/i, "mcu-4"], [/boot|vector|reset|startup|linker/i, "mcu-3"], [/gpio|open.?drain|oscillator|crystal|timer|pwm|watchdog/i, "mcu-5"], [/register|bit.?band/i, "mcu-7"]],
  Protocols: [[/uart|baud|rs.?232/i, "proto-2"], [/spi|cpol|cpha|mosi/i, "proto-3"], [/i2c|sda|scl/i, "proto-4"], [/can\b|can bus|arbitration/i, "proto-5"]],
  RTOS: [[/mutex|semaphore|priority inversion|inheritance|race/i, "rtos-3"], [/queue|notification|event group|message/i, "rtos-4"], [/stack overflow|heap|watchdog|memory/i, "rtos-5"], [/schedul|preempt|tick|context switch|round.?robin|priority/i, "rtos-2"]],
  Digital: [[/k.?map|minimi|sop|pos/i, "de-4"], [/latch|flip.?flop|d ff|jk/i, "de-6"], [/counter|ripple/i, "de-7"], [/fsm|moore|mealy|state/i, "de-8"], [/two'?s|binary|gray|bcd|hex/i, "de-1"], [/boolean|de morgan|nand|nor|universal/i, "de-3"]],
  Timing: [[/metastab|cdc|synchroni[sz]er|clock domain/i, "vlsi-5"], [/sta|slack|corner|false path|multicycle/i, "vlsi-7"]],
  CMOS: [[/threshold|mosfet|saturation|triode|body effect/i, "semi-4"], [/power|leakage|dynamic|activity/i, "semi-7"], [/inverter|noise margin|vtc|delay|fan.?out/i, "semi-6"]],
  RTL: [[/testbench|\$display|initial/i, "vlsi-4"], [/assign|always @\(\*\)|combinational/i, "vlsi-2"]],
  Flow: [[/placement|cts|clock tree|routing|floorplan|drc|lvs|antenna/i, "vlsi-6"], [/synthes/i, "syn-1"]],
  Memory: [[/sram|dram|cell|sense|refresh|6t/i, "mem-1"], [/cache/i, "arch-3"]],
  Verification: [[/uvm|scoreboard|agent|sequence/i, "sv-3"], [/assert|coverage/i, "sv-2"]],
  Architecture: [[/cache|tlb|virtual/i, "arch-3"], [/pipeline|hazard|forwarding/i, "arch-2"]],
  Design: [[/ring|buffer|queue|fifo/i, "dsa-5"], [/state machine|fsm/i, "c-8"], [/low.?power|sleep|battery/i, "fw-pwr"], [/bootloader|ota|update/i, "fw-boot"]],
  Debug: [],
};
const DEFAULT_MOD = { C: "c-8", MCU: "mcu-2", Protocols: "proto-6", RTOS: "rtos-1", Digital: "de-5", Timing: "de-9", CMOS: "semi-5", RTL: "vlsi-3", Flow: "vlsi-7", Memory: "de-10", Verification: "vlsi-4", Architecture: "arch-1", Design: "edbg-1", Debug: "edbg-1" };
const routeT = (t, text) => route(text, RULES[t] || [], DEFAULT_MOD[t] || "edbg-1");

// a) lesson quizzes (ids identical to the first Spidy Prep site, so old progress imports)
for (const L of LESSONS.values()) (L.quiz || []).forEach((x, k) => addQ({ id: `${L.id}-q${k}`, type: "mcq", mod: L.mods[0], level: "Easy", q: x.q, o: x.o, a: x.a, sol: x.why || "", lesson: L.id, src: "Lesson quiz" }));
// b) extra MCQs
for (const d of ["embedded", "vlsi"]) MCQ_EXTRA[d].forEach((x, i) => addQ({ id: `x-${d}-${i}`, type: "mcq", mod: routeT(x.t, x.q), level: "Medium", q: x.q, o: x.o, a: x.a, sol: x.why || "" }));
// c) interview questions with model answers
for (const d of ["embedded", "vlsi"]) INTERVIEW[d].forEach((x, i) => addQ({ id: `iv:${d}-${i}`, type: "con", mod: routeT(x.t, x.q + " " + x.a), level: x.lv || "Medium", q: x.q, model: x.a, keys: x.keys, interview: true }));
// d) new banks
const EXPL_USED = new Set();
for (const q of [...Q_DIGITAL, ...Q_VLSI, ...Q_EMBEDDED, ...Q_DSA, ...Q_APT, ...Q_CORE]) {
  const x = Object.assign({}, q);
  if (!x.sol && EXPLAIN[x.id]) { x.sol = EXPLAIN[x.id]; EXPL_USED.add(x.id); }
  if (x.type === "con") x.interview = true;
  addQ(x);
}
// e) coding / RTL / circuit problems
const C_MOD = { "c-bitops": "c-5", "c-popcount": "c-5", "c-pow2": "c-5", "c-nibble": "c-5", "c-revbits": "c-5", "c-field": "c-5", "c-gray": "c-5", "c-bswap": "c-4", "c-struct": "c-4", "c-strlen": "c-7", "c-strrev": "c-7", "c-atoi": "c-7", "c-memmove": "c-3", "c-binary": "c-1", "c-ring": "dsa-5", "c-llrev": "dsa-6", "c-llmid": "dsa-6", "c-bsearch": "dsa-4", "c-second": "dsa-2", "c-missing": "dsa-2", "c-crc8": "proto-1", "c-movavg": "mcu-6", "c-fsm": "c-8" };
const C_ALSO = { "c-ring": ["rtos-4"], "c-crc8": ["fw-boot"], "c-bswap": ["proto-1"], "c-llrev": ["c-2"], "c-bsearch": ["c-2"] };
for (const p of [...C_PROBLEMS, ...DSA_PROBLEMS]) addQ({ id: p.id, type: "c", mod: p.mod || C_MOD[p.id] || "c-8", also: C_ALSO[p.id], level: p.level, q: p.title, topic: p.topic, prob: p });
const V_MOD = id => ({ "v-and": "vlsi-1", "v-sync": "vlsi-5", "v-regfile": "vlsi-8", "v-fifo": "vlsi-8", "v-1011": "vlsi-3", "v-traffic": "vlsi-3" })[id] || (/dff|cnt|updown|sipo|lfsr|edge|tick/.test(id) ? "vlsi-3" : "vlsi-2");
const V_ALSO = { "v-1011": ["de-8"], "v-traffic": ["de-8"], "v-regfile": ["de-10"], "v-fifo": ["de-10", "vlsi-5"], "v-cnt": ["de-7"], "v-updown": ["de-7"], "v-lfsr": ["de-7"], "v-add4": ["de-5"], "v-alu": ["de-5"], "v-mux4": ["de-5"], "v-gray": ["de-1"], "v-dff": ["de-6"], "v-dffa": ["de-6"] };
for (const p of VERILOG_PROBLEMS) addQ({ id: p.id, type: "verilog", mod: V_MOD(p.id), also: V_ALSO[p.id], level: p.level, q: p.title, topic: p.topic, prob: p });
const K_MOD = id => /nand|nor/.test(id) && id !== "k-mux" ? "de-2" : /kmap|major/.test(id) ? "de-4" : /count/.test(id) ? "de-7" : /tff|shift/.test(id) ? "de-6" : "de-5";
const K_ALSO = { "k-and-nand": ["semi-5"], "k-nand-nor": ["semi-5", "de-3"], "k-xor-nand": ["de-3"] };
for (const p of CIRCUIT_PROBLEMS) addQ({ id: p.id, type: "circuit", mod: K_MOD(p.id), also: K_ALSO[p.id], level: p.level, q: p.title, topic: p.topic, prob: p });
// f) tracker checklist rows -> self-check items (tick ids identical to the tracker)
const SYL_MAP = {
  elec: ["net-1", "net-2", "ana-1", "semi-4", "circ-5", "circ-6", "de-2", "semi-5", "de-9", "circ-7"],
  c: ["c-1", "c-2", "c-4", "c-5", "c-6", "c-8", "c-6", "c-8"], cm: ["mcu-2", "mcu-3", "mcu-4", "edbg-1", "mcu-2", "rtos-3", "mcu-2"],
  drv: ["mcu-1", "mcu-5", "mcu-5", "mcu-6", "mcu-6", "mcu-6"], dbg: Array(7).fill("edbg-1"), proto: ["proto-1", "proto-2", "proto-3", "proto-4", "proto-5", "proto-6", "proto-6", "proto-6", "proto-6"],
  rtos: ["rtos-1", "rtos-2", "rtos-3", "rtos-5", "rtos-2"], stor: Array(4).fill("fw-stor"), boot: Array(2).fill("fw-boot"), sec: Array(4).fill("fw-sec"), iot: Array(6).fill("fw-iot"),
  pwr: Array(4).fill("fw-pwr"), test: Array(5).fill("edbg-1"), math: ["de-1", "sig-2", "sig-2", "sig-2", "ctl-1"], pcb: Array(3).fill("pcb-1"),
  dsa: ["dsa-1", "c-5", "dsa-2", "dsa-4", "dsa-5", "dsa-6", "dsa-7", "dsa2-2", "dsa2-4", "mcu-7", "hr-1"], soft: Array(3).fill("hr-1"),
};
SYL.forEach(d => d.topics.forEach((t, ti) => t.subs.forEach((s, si) => {
  const mod = (SYL_MAP[d.id] || [])[ti]; if (!mod) { console.warn("Unmapped checklist topic", d.id, ti); return; }
  addQ({ id: `${d.id}:${ti}:${si}`, type: "self", mod, level: "", q: s.q || s.n, title: s.n, group: `${d.name} · ${t.n}`, key: s.t === "key", src: "Checklist" });
})));

/* ---------------------------------------------------------------- derived per-module data */
for (const m of MODS.values()) {
  const qs = m.qs.map(id => Q.get(id)).filter(q => q.type !== "self");
  const lv = { Easy: 0, Medium: 0, Hard: 0 }; qs.forEach(q => lv[q.level] != null && lv[q.level]++);
  const score = qs.length ? (lv.Medium + 2 * lv.Hard) / qs.length : 0.8;
  m.level = score < 0.6 ? "Easy" : score < 1.15 ? "Medium" : "Hard";
  m.mins = 25 * Math.max(1, m.topics.length) + 4 * qs.length; // rough study time estimate
  m.has = { lesson: m.lessons.length > 0, sim: false };
}

/* ---------------------------------------------------------------- simulations per module */
// kind "model" = interactive educational model; kind "sim" = software simulation of code you write.
export const SIMS = {
  gate: { title: "Logic gate explorer", kind: "model", href: "#/lab/gates" }, kmap: { title: "K-map minimiser", kind: "model", href: "#/lab/kmap" },
  circuit: { title: "Circuit builder", kind: "sim", href: "#/lab/circuit" }, verilog: { title: "Verilog simulator", kind: "sim", href: "#/lab/verilog" },
  c: { title: "C compiler", kind: "sim", href: "#/lab/c" }, dff: { title: "D flip-flop and timing", kind: "model", href: "#/lab/flipflop" },
  fsm: { title: "FSM stepper", kind: "model", href: "#/lab/fsm" }, timing: { title: "Setup / hold calculator", kind: "model", href: "#/lab/timing" },
  rtos: { title: "RTOS scheduler timeline", kind: "model", href: "#/lab/rtos" }, uart: { title: "UART frame viewer", kind: "model", href: "#/lab/uart" },
  pwm: { title: "Timer and PWM calculator", kind: "model", href: "#/lab/pwm" }, bits: { title: "Register bit editor", kind: "model", href: "#/lab/bits" },
  rc: { title: "RC charging and filters", kind: "model", href: "#/lab/rc" }, cpu: { title: "Tiny CPU, registers and memory", kind: "model", href: "#/lab/cpu" },
  spi: { title: "SPI / I2C waveforms", kind: "model", href: "#/lab/bus" },
};
const SIM_MODS = {
  gate: ["de-2", "de-3", "semi-5"], kmap: ["de-4", "de-5"], circuit: ["de-2", "de-3", "de-5", "de-6", "de-7"], verilog: ["vlsi-1", "vlsi-2", "vlsi-3", "vlsi-4", "vlsi-5", "vlsi-8", "sv-1"],
  c: [...R("c", 1, 8), ...R("dsa", 1, 7), ...R("dsa2", 1, 4), "mcu-7"], dff: ["de-6", "de-9", "vlsi-5"], fsm: ["de-8", "vlsi-3", "c-8"], timing: ["de-9", "vlsi-7", "syn-2"],
  rtos: R("rtos", 1, 5), uart: ["proto-1", "proto-2"], pwm: ["mcu-5"], bits: ["c-5", "mcu-7"], rc: ["circ-2", "net-2", "ctl-1"], cpu: ["arch-1", "arch-2", "mcu-2", "mcu-1"],
  spi: ["proto-3", "proto-4", "proto-6"],
};
for (const [k, ids] of Object.entries(SIM_MODS)) ids.forEach(id => { const m = MODS.get(id); if (m) { (m.sims = m.sims || []).push(k); m.has.sim = true; } });

/* ---------------------------------------------------------------- external resources */
// Every link below was opened and checked. Topic videos are YouTube *searches*
// (clearly labelled) because individual video URLs change.
const LINK = {
  neso: { t: "Neso Academy (YouTube channel)", u: "https://www.youtube.com/@nesoacademy", k: "video" },
  aae: { t: "ALL ABOUT ELECTRONICS (YouTube channel)", u: "https://www.youtube.com/@ALLABOUTELECTRONICS", k: "video" },
  ben: { t: "Ben Eater - build a computer from logic chips (YouTube)", u: "https://www.youtube.com/@BenEater", k: "video" },
  tuf: { t: "take U forward - DSA videos (YouTube)", u: "https://www.youtube.com/@takeUforward", k: "video" },
  a2z: { t: "Striver's A2Z DSA sheet (takeuforward.org)", u: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", k: "practice" },
  hdl: { t: "HDLBits - Verilog practice problems", u: "https://hdlbits.01xz.net", k: "practice" },
  chipv: { t: "ChipVerify - Verilog, SystemVerilog and UVM tutorials", u: "https://www.chipverify.com", k: "read" },
  eda: { t: "EDA Playground - run real simulators online", u: "https://www.edaplayground.com", k: "practice" },
  frt: { t: "FreeRTOS developer documentation", u: "https://www.freertos.org/Documentation/02-Kernel/02-Kernel-features/00-Developer-docs", k: "read" },
  idf: { t: "ESP-IDF programming guide (Espressif)", u: "https://docs.espressif.com/projects/esp-idf/en/stable/esp32/index.html", k: "read" },
  boot: { t: "Bootlin embedded Linux training (free slides and labs)", u: "https://bootlin.com/training/embedded-linux/", k: "read" },
  kdrv: { t: "Linux kernel driver API documentation", u: "https://docs.kernel.org/driver-api/index.html", k: "read" },
  mit002: { t: "MIT OCW 6.002 Circuits and Electronics", u: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/", k: "read" },
  mit003: { t: "MIT OCW 6.003 Signals and Systems", u: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/", k: "read" },
  ibx: { t: "IndiaBix aptitude questions", u: "https://www.indiabix.com/aptitude/questions-and-answers/", k: "practice" },
  nptel: { t: "NPTEL course catalogue (IIT lectures)", u: "https://nptel.ac.in/courses", k: "video" },
  khanla: { t: "Khan Academy - Linear algebra", u: "https://www.khanacademy.org/math/linear-algebra", k: "video" },
};
const TRACK_LINKS = { vlsi: ["chipv", "hdl", "eda", "nptel"], digital: ["neso", "hdl"], embedded: ["frt", "idf"], dsa: ["a2z", "tuf"], aptitude: ["ibx"], core: ["aae", "mit002", "nptel"], career: [] };
const MOD_LINKS = {
  "semi-": ["aae", "nptel"], "de-": ["neso", "hdl"], "vlsi-": ["hdl", "chipv", "eda"], "sv-": ["chipv", "eda"], "syn-": ["chipv"], "rtos-": ["frt"], "plat-2": ["idf"], "lnx-1": ["boot"], "lnx-2": ["kdrv", "boot"],
  "arch-": ["ben"], "mcu-2": ["ben"], "dsa": ["a2z", "tuf"], "apt-": ["ibx"], "circ-": ["aae", "mit002"], "net-": ["aae", "mit002"], "ana-": ["aae", "mit002"], "sig-": ["mit003", "neso"],
  "ctl-": ["neso", "nptel"], "com-": ["neso", "nptel"], "emt-": ["nptel"], "math-1": ["khanla"], "math-": ["nptel"], "fw-iot": ["idf"],
};
export function resourcesFor(m) {
  const keys = []; for (const [p, ks] of Object.entries(MOD_LINKS)) if (m.id === p || m.id.startsWith(p)) keys.push(...ks);
  if (!keys.length) keys.push(...(TRACK_LINKS[m.track] || []));
  const out = [...new Set(keys)].map(k => Object.assign({ ext: true }, LINK[k]));
  const hint = { vlsi: "VLSI", digital: "digital electronics", embedded: "embedded", dsa: "DSA", aptitude: "aptitude", core: "", career: "interview" }[m.track] || "";
  out.unshift({ t: `YouTube search: "${m.title}${hint ? " " + hint : ""}"`, u: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${m.title} ${hint}`.trim()), k: "video", search: true, ext: true });
  if (["semi", "sig", "ctl", "com", "emt", "net", "ana", "math"].some(p => m.id.startsWith(p))) out.push({ t: `YouTube search: "NPTEL ${m.title}"`, u: "https://www.youtube.com/results?search_query=" + encodeURIComponent("NPTEL " + m.title), k: "video", search: true, ext: true });
  return out;
}

/* ---------------------------------------------------------------- roles (planner + interview mode) */
const T = id => TRACK[id].mods;
export const ROLES = [
  { id: "my12", title: "My 12-week tracker plan", blurb: "The exact order of the Embedded Tracker plan (resume, C, DSA, MCU, circuits, protocols, RTOS, semiconductors, digital, architecture, VLSI).", mods: pweekMods() },
  { id: "vlsi_design", title: "VLSI Design", blurb: "Analog/digital IC design entry roles: devices, CMOS, digital, RTL, timing, low power, physical design.", mods: [...T("digital"), ...R("semi", 1, 7), "vlsi-1", "vlsi-2", "vlsi-3", "vlsi-5", "syn-1", "syn-2", "vlsi-7", "lp-1", "mem-1", "vlsi-6", "pd-1", "pd-2", "dft-1", "arch-1", "arch-2", "arch-3", ...T("aptitude"), ...T("career")] },
  { id: "rtl", title: "RTL Design", blurb: "Front-end design: digital, Verilog/SystemVerilog, CDC, synthesis, STA, architecture.", mods: [...T("digital"), "vlsi-1", "vlsi-2", "vlsi-3", "vlsi-5", "vlsi-8", "sv-1", "vlsi-4", "syn-1", "syn-2", "vlsi-7", "lp-1", "mem-1", ...R("arch", 1, 3), "semi-5", "semi-6", "semi-7", ...R("dsa", 1, 3), ...T("aptitude"), ...T("career")] },
  { id: "dv", title: "Design Verification", blurb: "Testbenches, SystemVerilog, assertions, coverage, UVM, plus the digital and C basics DV interviews ask.", mods: [...T("digital"), "vlsi-1", "vlsi-2", "vlsi-3", "vlsi-4", "sv-1", "sv-2", "sv-3", "vlsi-5", "vlsi-7", "eda-1", ...R("c", 1, 5), ...R("dsa", 1, 5), "arch-1", "arch-2", ...T("aptitude"), ...T("career")] },
  { id: "fpga", title: "FPGA Engineer", blurb: "Digital design, Verilog, CDC, constraints and timing, plus MCU and protocol basics.", mods: [...T("digital"), "vlsi-1", "vlsi-2", "vlsi-3", "vlsi-4", "vlsi-5", "vlsi-8", "syn-1", "syn-2", "vlsi-7", ...R("arch", 1, 3), "mcu-1", "mcu-2", ...R("proto", 1, 4), ...R("c", 1, 5), ...T("aptitude"), ...T("career")] },
  { id: "firmware", title: "Embedded Firmware", blurb: "C, Cortex-M, peripherals, protocols, FreeRTOS, debugging, Linux basics, circuits and digital basics.", mods: [...T("embedded").filter(id => id !== "lnx-2"), ...R("dsa", 1, 7), ...R("circ", 1, 5), ...R("de", 1, 6), ...T("aptitude"), ...T("career")] },
  { id: "software", title: "Software Engineer", blurb: "Coding rounds: C, full DSA, OS and architecture, Linux, aptitude.", mods: [...R("c", 1, 8), ...T("dsa"), ...R("arch", 1, 4), "lnx-1", ...T("aptitude"), ...T("career")] },
  { id: "core_ece", title: "Core ECE / GATE-style", blurb: "Networks, analog, devices, digital, signals, control, communication, electromagnetics and maths.", mods: [...T("core"), ...R("de", 1, 9), ...T("aptitude"), "hr-1"] },
].map(r => ({ ...r, mods: [...new Set(r.mods)].filter(id => MODS.has(id)) }));
export const ROLE = Object.fromEntries(ROLES.map(r => [r.id, r]));
function pweekMods() { const out = []; PWEEKS.forEach(([, h1, h2]) => [...h1, ...h2].forEach(([t, a, b, rev]) => { if (rev) return; for (let i = a; i <= b; i++) out.push(`${t}-${i}`); })); return out.concat(R("apt", 1, 3)); }
export { PWEEKS };

/* ---------------------------------------------------------------- formulas + search */
export function formulasFor(m) { return m.formulas; }
export const SEARCH = [];
for (const t of TRACKS) SEARCH.push({ k: "Track", t: t.title, s: t.blurb, href: `#/learn/${t.id}` });
for (const m of MODS.values()) {
  SEARCH.push({ k: "Module", t: m.title, s: `${TRACK[m.track].title} · ${m.part}`, href: `#/m/${m.id}` });
  m.topics.forEach(tp => SEARCH.push({ k: "Topic", t: tp.n, s: `${m.title} · ${tp.learn}`, href: `#/m/${m.id}/learn` }));
}
for (const L of LESSONS.values()) SEARCH.push({ k: "Lesson", t: L.title, s: L.sum, href: `#/lesson/${L.id}` });
for (const q of QUESTIONS) SEARCH.push({ k: TYPE_NAME(q.type), t: q.title || q.q, s: MODS.get(q.mod).title, href: `#/q/${encodeURIComponent(q.id)}` });
SEARCH.forEach(x => { x.l = (x.t + " " + x.s).toLowerCase(); });

export function TYPE_NAME(t) { return { mcq: "MCQ", num: "Numerical", con: "Concept", self: "Checklist", c: "C coding", verilog: "Verilog", circuit: "Circuit" }[t] || t; }
export const TYPES = ["mcq", "num", "con", "c", "verilog", "circuit", "self"];

/* ---------------------------------------------------------------- MCQ option order (deterministic shuffle) */
export function optionOrder(q) {
  const n = q.o.length, idx = [...Array(n).keys()]; let h = hashNum(q.id) || 1;
  for (let i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (/all of the above|none of the above|both/i.test(q.o.join("|"))) return [...Array(n).keys()]; // keep order when options refer to each other
  return idx;
}

/* ---------------------------------------------------------------- numeric answer check */
const SI = { p: 1e-12, n: 1e-9, u: 1e-6, "µ": 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };
export function parseNum(s) {
  s = String(s).trim().replace(/,/g, "").replace(/\s+/g, "").replace(/×10\^?/g, "e").replace(/x10\^/g, "e");
  if (!s) return NaN;
  let m = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s); if (m) return +m[1] / +m[2];
  m = /^(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)([pnuµmkKMG])?[a-zA-ZΩ°%/]*$/.exec(s); if (!m) return NaN;
  return +m[1] * (m[2] ? SI[m[2]] : 1);
}
export function checkNum(q, input) {
  const v = parseNum(input); if (!isFinite(v)) return null;
  const a = q.ans;
  if (q.tol == null && Number.isInteger(a)) return Math.abs(v - a) <= Math.max(1e-9, Math.abs(a) * 1e-3);
  const tol = q.tol == null ? 0.02 : q.tol;
  return a === 0 ? Math.abs(v) < 1e-6 : Math.abs(v - a) <= Math.abs(a) * tol + 1e-12;
}

/* ---------------------------------------------------------------- self-test helper for the build */
export function registryReport() {
  const byType = {}; QUESTIONS.forEach(q => byType[q.type] = (byType[q.type] || 0) + 1);
  const noSol = QUESTIONS.filter(q => (q.type === "mcq" || q.type === "num") && !q.sol).map(q => q.id);
  const emptyMods = [...MODS.values()].filter(m => !m.qs.length).map(m => m.id);
  return { modules: MODS.size, tracks: TRACKS.length, lessons: LESSONS.size, questions: QUESTIONS.length, byType, noSol, emptyMods, explainUnused: Object.keys(EXPLAIN).filter(k => !EXPL_USED.has(k)), search: SEARCH.length };
}
