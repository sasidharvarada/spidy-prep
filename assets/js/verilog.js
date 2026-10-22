/* ==========================================================================
   Spidy Verilog — a small two-state Verilog simulator for the browser.
   Supports the synthesizable subset used in interview practice:
     modules (ANSI or classic ports), parameters, wire/reg/logic/integer,
     vectors and memories, assign, always @* / @(list) / @(posedge ...),
     always_comb / always_ff / always_latch, if/else, case/casez/casex,
     for loops, blocking and non-blocking assignment, concatenation,
     replication, all common operators, sub-module instantiation,
     $display / $write, simple initial blocks.
   Values are 2-state (x and z read as 0). Widths up to 64 bits.
   ========================================================================== */

export class VerilogError extends Error {
  constructor(msg, line) { super(line ? `line ${line}: ${msg}` : msg); this.line = line; this.plain = msg; }
}

/* ---------------------------------------------------------------- lexer */
const KW = new Set(("module endmodule input output inout wire reg logic integer int bit parameter localparam " +
  "assign always always_comb always_ff always_latch initial begin end if else case casez casex endcase default " +
  "for posedge negedge or signed unsigned genvar generate endgenerate function endfunction task endtask while " +
  "repeat forever unique priority").split(" "));
const OPS = ["<<<", ">>>", "===", "!==", "<<", ">>", "<=", ">=", "==", "!=", "&&", "||", "~&", "~|", "~^", "^~",
  "**", "+:", "-:", "+", "-", "*", "/", "%", "&", "|", "^", "~", "!", "<", ">", "=", "?", ":", ";", ",", ".",
  "(", ")", "[", "]", "{", "}", "@", "#"];

function lex(src) {
  const toks = []; let i = 0, line = 1; const n = src.length;
  const push = (t, v, extra) => toks.push(Object.assign({ t, v, line }, extra || {}));
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i + 2); const end = e < 0 ? n : e + 2;
      for (let k = i; k < end; k++) if (src[k] === "\n") line++;
      i = end; continue;
    }
    if (c === "`") { // compiler directives: ignore the whole line (`timescale, `default_nettype ...)
      if (/^`define/.test(src.slice(i))) throw new VerilogError("`define macros are not supported here - use a parameter instead", line);
      while (i < n && src[i] !== "\n") i++; continue;
    }
    if (c === '"') {
      let j = i + 1, s = "";
      while (j < n && src[j] !== '"') { if (src[j] === "\\" && j + 1 < n) { const e = src[j + 1]; s += e === "n" ? "\n" : e === "t" ? "\t" : e; j += 2; } else s += src[j++]; }
      push("str", s); i = j + 1; continue;
    }
    // numbers: 4'b1010, 8'hFF, 'd5, '0, 12, 3.5
    let m = /^(\d[\d_]*)?\s*'([sS]?)([bBoOdDhH])\s*([0-9a-fA-FxXzZ?_]+)/.exec(src.slice(i, i + 200));
    if (m) {
      const width = m[1] ? parseInt(m[1].replace(/_/g, ""), 10) : null;
      const base = m[3].toLowerCase(); const digits = m[4].replace(/_/g, "");
      const bits = { b: 1, o: 3, h: 4 }[base];
      let v = 0n, dc = 0n;
      if (base === "d") {
        if (/[xz?]/i.test(digits)) { v = 0n; dc = width ? (1n << BigInt(width)) - 1n : 0n; }
        else v = BigInt(digits);
      } else {
        for (const ch of digits) {
          const lc = ch.toLowerCase(); const sh = BigInt(bits);
          v <<= sh; dc <<= sh;
          if (lc === "x" || lc === "z" || lc === "?") dc |= (1n << sh) - 1n;
          else { const d = parseInt(lc, 16); if (isNaN(d) || d >= (1 << bits)) throw new VerilogError(`bad digit '${ch}' in number ${m[0]}`, line); v |= BigInt(d); }
        }
      }
      if (width === 0) throw new VerilogError("a number cannot have width 0", line);
      if (width) { const mk = (1n << BigInt(width)) - 1n; v &= mk; dc &= mk; }
      push("num", m[0], { width: width || 32, sized: !!width, val: v, dc });
      i += m[0].length; continue;
    }
    m = /^'([01xXzZ])/.exec(src.slice(i, i + 3));
    if (m) { push("fill", m[0], { bit: m[1] === "1" ? 1 : 0 }); i += 2; continue; }
    m = /^\d[\d_]*(\.\d+)?/.exec(src.slice(i, i + 40));
    if (m) {
      if (m[1]) throw new VerilogError("real numbers are not supported", line);
      push("num", m[0], { width: 32, sized: false, val: BigInt(m[0].replace(/_/g, "")), dc: 0n });
      i += m[0].length; continue;
    }
    m = /^[$]?[A-Za-z_][A-Za-z0-9_$]*/.exec(src.slice(i, i + 200));
    if (m) {
      const w = m[0];
      if (w[0] === "$") push("sys", w); else push(KW.has(w) ? "kw" : "id", w);
      i += w.length; continue;
    }
    const op = OPS.find(o => src.startsWith(o, i));
    if (op) { push("op", op); i += op.length; continue; }
    throw new VerilogError(`unexpected character '${c}'`, line);
  }
  push("eof", "end of file");
  return toks;
}

/* ---------------------------------------------------------------- parser */
class Parser {
  constructor(toks) { this.t = toks; this.p = 0; }
  get cur() { return this.t[this.p]; }
  peek(k = 1) { return this.t[Math.min(this.p + k, this.t.length - 1)]; }
  is(v) { const c = this.cur; return (c.t === "op" || c.t === "kw") && c.v === v; }
  eat(v) { if (this.is(v)) { this.p++; return true; } return false; }
  expect(v, what) {
    if (this.is(v)) return this.t[this.p++];
    const c = this.cur;
    throw new VerilogError(`expected '${v}'${what ? " " + what : ""} but found '${c.v}'`, c.line);
  }
  ident(what) {
    const c = this.cur;
    if (c.t !== "id") throw new VerilogError(`expected ${what || "a name"} but found '${c.v}'`, c.line);
    this.p++; return c.v;
  }

  file() {
    const mods = [];
    while (this.cur.t !== "eof") {
      if (this.is("module")) mods.push(this.module());
      else throw new VerilogError(`expected 'module' but found '${this.cur.v}'`, this.cur.line);
    }
    if (!mods.length) throw new VerilogError("no module found - start with: module name ( ... );");
    return mods;
  }

  module() {
    const line = this.expect("module").line;
    const name = this.ident("a module name");
    const m = { name, line, params: [], ports: [], portOrder: [], items: [] };
    if (this.eat("#")) {
      this.expect("(");
      do {
        this.eat("parameter"); this.eat("localparam");
        this.skipType();
        const pl = this.cur.line, pn = this.ident("a parameter name"); this.expect("=");
        m.params.push({ name: pn, expr: this.expr(), line: pl, local: false });
      } while (this.eat(","));
      this.expect(")");
    }
    if (this.eat("(")) {
      if (!this.is(")")) {
        if (this.is("input") || this.is("output") || this.is("inout")) {
          let last = null;
          do {
            if (this.is("input") || this.is("output") || this.is("inout")) last = this.portHead();
            else if (!last) throw new VerilogError("port direction missing", this.cur.line);
            const pl = this.cur.line, pn = this.ident("a port name");
            m.ports.push(Object.assign({}, last, { name: pn, line: pl })); m.portOrder.push(pn);
          } while (this.eat(","));
        } else {
          do { m.portOrder.push(this.ident("a port name")); } while (this.eat(","));
        }
      }
      this.expect(")");
    }
    this.expect(";", "after the port list");
    while (!this.is("endmodule")) {
      if (this.cur.t === "eof") throw new VerilogError(`module '${name}' is missing 'endmodule'`, this.cur.line);
      this.item(m);
    }
    this.expect("endmodule");
    return m;
  }

  skipType() { while (this.is("wire") || this.is("reg") || this.is("logic") || this.is("signed") || this.is("unsigned") || this.is("integer") || this.is("int") || this.is("bit")) this.p++; if (this.is("[")) this.range(); }

  portHead() {
    const dir = this.cur.v; this.p++;
    let kind = "wire", signed = false;
    for (;;) {
      if (this.is("reg") || this.is("logic") || this.is("bit")) { kind = "reg"; this.p++; }
      else if (this.is("wire")) { this.p++; }
      else if (this.is("signed")) { signed = true; this.p++; }
      else if (this.is("unsigned")) { this.p++; }
      else break;
    }
    const range = this.is("[") ? this.range() : null;
    return { dir, kind, range, signed };
  }
  range() { this.expect("["); const msb = this.expr(); this.expect(":"); const lsb = this.expr(); this.expect("]"); return { msb, lsb }; }

  item(m) {
    const c = this.cur, line = c.line;
    if (this.is("input") || this.is("output") || this.is("inout")) {
      const h = this.portHead();
      do {
        const pl = this.cur.line, pn = this.ident("a port name");
        if (!m.portOrder.includes(pn)) throw new VerilogError(`'${pn}' is declared as a port but is not in the module's port list`, pl);
        m.ports.push(Object.assign({}, h, { name: pn, line: pl }));
        if (this.eat("=")) throw new VerilogError("ports cannot have initial values here", pl);
      } while (this.eat(","));
      this.expect(";"); return;
    }
    if (this.is("wire") || this.is("reg") || this.is("logic") || this.is("integer") || this.is("int") || this.is("bit") || this.is("genvar")) {
      const kw = c.v; this.p++;
      let kind = kw === "wire" ? "wire" : "reg", width = null;
      if (kw === "integer" || kw === "int" || kw === "genvar") width = 32;
      while (this.is("signed") || this.is("unsigned") || this.is("reg") || this.is("logic")) this.p++;
      const range = this.is("[") ? this.range() : null;
      do {
        const nl = this.cur.line, nm = this.ident("a signal name");
        let arr = null;
        if (this.is("[")) arr = this.range();
        let init = null;
        if (this.eat("=")) init = this.expr();
        m.items.push({ k: "decl", kind, range, width, name: nm, arr, line: nl, int: width === 32 && !range });
        if (init) {
          if (kind === "wire") m.items.push({ k: "assign", lhs: { k: "id", name: nm, line: nl }, rhs: init, line: nl });
          else m.items.push({ k: "init", name: nm, rhs: init, line: nl });
        }
      } while (this.eat(","));
      this.expect(";"); return;
    }
    if (this.is("parameter") || this.is("localparam")) {
      const local = c.v === "localparam"; this.p++;
      this.skipType();
      do {
        const pl = this.cur.line, pn = this.ident("a parameter name"); this.expect("=");
        m.params.push({ name: pn, expr: this.expr(), line: pl, local });
      } while (this.eat(","));
      this.expect(";"); return;
    }
    if (this.is("assign")) {
      this.p++;
      do {
        const lhs = this.lvalue(); const al = this.cur.line;
        if (this.is("<=")) throw new VerilogError("use '=' in an assign statement, not '<='", al);
        this.expect("=", "in assign");
        m.items.push({ k: "assign", lhs, rhs: this.expr(), line });
      } while (this.eat(","));
      this.expect(";"); return;
    }
    if (this.is("always") || this.is("always_comb") || this.is("always_ff") || this.is("always_latch")) {
      const kw = c.v; this.p++;
      let sens = null;
      if (kw === "always_comb" || kw === "always_latch") sens = "*";
      if (this.eat("@")) {
        if (this.eat("*")) sens = "*";
        else {
          this.expect("(");
          if (this.eat("*")) sens = "*";
          else {
            sens = [];
            do {
              let edge = null;
              if (this.eat("posedge")) edge = "pos"; else if (this.eat("negedge")) edge = "neg";
              const sl = this.cur.line, sn = this.ident("a signal in the sensitivity list");
              if (this.is("[")) throw new VerilogError("use a whole signal in the sensitivity list, not a bit of it", sl);
              sens.push({ edge, name: sn, line: sl });
            } while (this.eat("or") || this.eat(","));
          }
          this.expect(")");
        }
      }
      if (sens === null) {
        if (this.is("#")) throw new VerilogError("delays (#) belong in testbenches. This simulator drives the inputs and clock for you", line);
        throw new VerilogError("always needs a sensitivity list, e.g. always @(*) or always @(posedge clk)", line);
      }
      if (kw === "always_ff" && sens === "*") throw new VerilogError("always_ff needs @(posedge clk)", line);
      m.items.push({ k: "always", kw, sens, body: this.stmt(), line });
      return;
    }
    if (this.is("initial")) { this.p++; m.items.push({ k: "initial", body: this.stmt(), line }); return; }
    if (this.is("function") || this.is("task") || this.is("generate"))
      throw new VerilogError(`'${c.v}' is not supported in this simulator yet`, line);
    if (c.t === "id") return this.instance(m);
    throw new VerilogError(`unexpected '${c.v}' inside module`, line);
  }

  instance(m) {
    const line = this.cur.line;
    const mod = this.ident();
    const inst = { k: "inst", mod, line, params: [], namedParams: false, conns: [], named: false, name: null };
    if (this.eat("#")) {
      this.expect("(");
      if (this.is(".")) {
        inst.namedParams = true;
        do { this.expect("."); const pn = this.ident(); this.expect("("); inst.params.push({ name: pn, expr: this.expr() }); this.expect(")"); } while (this.eat(","));
      } else { do { inst.params.push({ expr: this.expr() }); } while (this.eat(",")); }
      this.expect(")");
    }
    if (this.cur.t !== "id") throw new VerilogError(`'${mod}' looks like a module instance but has no instance name (e.g. ${mod} u1 (...);)`, line);
    inst.name = this.ident();
    this.expect("(");
    if (!this.is(")")) {
      if (this.is(".")) {
        inst.named = true;
        do {
          this.expect("."); const pn = this.ident("a port name"); this.expect("(");
          const e = this.is(")") ? null : this.expr(); this.expect(")");
          inst.conns.push({ name: pn, expr: e });
        } while (this.eat(","));
      } else { do { inst.conns.push({ expr: this.expr() }); } while (this.eat(",")); }
    }
    this.expect(")"); this.expect(";");
    m.items.push(inst);
  }

  stmt() {
    const c = this.cur, line = c.line;
    if (this.eat(";")) return { k: "nop" };
    if (this.eat("begin")) {
      if (this.eat(":")) this.ident();
      const body = [];
      while (!this.is("end")) {
        if (this.cur.t === "eof") throw new VerilogError("'begin' without matching 'end'", line);
        body.push(this.stmt());
      }
      this.expect("end");
      if (this.is(":")) { this.p++; this.ident(); }
      return { k: "block", body, line };
    }
    if (this.is("unique") || this.is("priority")) { this.p++; return this.stmt(); }
    if (this.eat("if")) {
      this.expect("(", "after if"); const cond = this.expr(); this.expect(")", "to close the if condition");
      const then = this.stmt(); const els = this.eat("else") ? this.stmt() : null;
      return { k: "if", cond, then, els, line };
    }
    if (this.is("case") || this.is("casez") || this.is("casex")) {
      const kind = c.v; this.p++;
      this.expect("("); const sel = this.expr(); this.expect(")");
      const items = []; let def = null;
      while (!this.is("endcase")) {
        if (this.cur.t === "eof") throw new VerilogError("'case' without 'endcase'", line);
        if (this.eat("default")) { this.eat(":"); def = this.stmt(); continue; }
        const labels = [];
        do { labels.push(this.expr()); } while (this.eat(","));
        this.expect(":", "after the case label");
        items.push({ labels, body: this.stmt() });
      }
      this.expect("endcase");
      return { k: "case", kind, sel, items, def, line };
    }
    if (this.eat("for")) {
      this.expect("(");
      this.eat("integer"); this.eat("int"); this.eat("genvar");
      const init = this.assignStmt(false); this.expect(";");
      const cond = this.expr(); this.expect(";");
      let step;
      // allow i++ / i=i+1
      const sl = this.lvalue();
      if (this.is("+") && this.peek().v === "+") { this.p += 2; step = { k: "ba", lhs: sl, rhs: { k: "bin", op: "+", a: sl, b: { k: "num", w: 32, v: 1n, dc: 0n, sized: false } }, line }; }
      else { this.expect("="); step = { k: "ba", lhs: sl, rhs: this.expr(), line }; }
      this.expect(")");
      return { k: "for", init, cond, step, body: this.stmt(), line };
    }
    if (this.is("while") || this.is("repeat") || this.is("forever"))
      throw new VerilogError(`'${c.v}' loops are not supported - use a for loop with a fixed count`, line);
    if (this.is("#")) throw new VerilogError("delays (#) belong in testbenches. This simulator drives the inputs and clock for you", line);
    if (this.is("@")) throw new VerilogError("event waits (@) inside a block are not supported", line);
    if (c.t === "sys") {
      this.p++; const args = [];
      if (this.eat("(")) { if (!this.is(")")) do { args.push(this.cur.t === "str" ? { k: "str", v: this.t[this.p++].v } : this.expr()); } while (this.eat(",")); this.expect(")"); }
      this.expect(";");
      return { k: "sys", name: c.v, args, line };
    }
    const s = this.assignStmt(true); this.expect(";", "at the end of the statement");
    return s;
  }

  assignStmt(allowNb) {
    const line = this.cur.line;
    const lhs = this.lvalue();
    if (this.is("+") && this.peek().v === "+") { this.p += 2; return { k: "ba", lhs, rhs: { k: "bin", op: "+", a: lhs, b: { k: "num", w: 32, v: 1n, dc: 0n, sized: false } }, line }; }
    if (this.eat("=")) return { k: "ba", lhs, rhs: this.expr(), line };
    if (allowNb && this.eat("<=")) return { k: "nba", lhs, rhs: this.expr(), line };
    throw new VerilogError(`expected '=' or '<=' after '${this.t[this.p - 1].v}'`, line);
  }

  lvalue() {
    const line = this.cur.line;
    if (this.eat("{")) {
      const parts = []; do { parts.push(this.lvalue()); } while (this.eat(",")); this.expect("}");
      return { k: "concat", parts, line };
    }
    const name = this.ident("a signal name"); return this.selects({ k: "id", name, line });
  }

  selects(node) {
    while (this.is("[")) {
      this.p++;
      const a = this.expr();
      if (this.eat(":")) { const b = this.expr(); this.expect("]"); node = { k: "part", of: node, msb: a, lsb: b, line: node.line }; }
      else if (this.is("+:") || this.is("-:")) { const dir = this.cur.v[0]; this.p++; const w = this.expr(); this.expect("]"); node = { k: "ipart", of: node, base: a, width: w, dir, line: node.line }; }
      else { this.expect("]"); node = { k: "bit", of: node, idx: a, line: node.line }; }
    }
    return node;
  }

  expr() { return this.ternary(); }
  ternary() {
    const c = this.binary(0);
    if (this.eat("?")) { const a = this.ternary(); this.expect(":", "in the ? : expression"); const b = this.ternary(); return { k: "tern", c, a, b }; }
    return c;
  }
  binary(lvl) {
    const L = [["||"], ["&&"], ["|"], ["^", "~^", "^~"], ["&"], ["==", "!=", "===", "!=="], ["<", "<=", ">", ">="],
      ["<<", ">>", "<<<", ">>>"], ["+", "-"], ["*", "/", "%"], ["**"]];
    if (lvl >= L.length) return this.unary();
    let a = this.binary(lvl + 1);
    while (this.cur.t === "op" && L[lvl].includes(this.cur.v)) {
      let op = this.cur.v; this.p++;
      if (op === "===") op = "=="; if (op === "!==") op = "!="; if (op === "^~") op = "~^";
      const b = this.binary(lvl + 1); a = { k: "bin", op, a, b };
    }
    return a;
  }
  unary() {
    const c = this.cur;
    if (c.t === "op" && ["~", "!", "-", "+", "&", "|", "^", "~&", "~|", "~^"].includes(c.v)) { this.p++; return { k: "un", op: c.v, a: this.unary() }; }
    return this.primary();
  }
  primary() {
    const c = this.cur;
    if (c.t === "num") { this.p++; return { k: "num", w: c.width, v: c.val, dc: c.dc, sized: c.sized }; }
    if (c.t === "fill") { this.p++; return { k: "fill", bit: c.bit }; }
    if (c.t === "str") throw new VerilogError("strings can only be used in $display", c.line);
    if (c.t === "sys") {
      this.p++; const args = [];
      this.expect("("); if (!this.is(")")) do { args.push(this.expr()); } while (this.eat(",")); this.expect(")");
      return { k: "call", name: c.v, args, line: c.line };
    }
    if (this.eat("(")) { const e = this.expr(); this.expect(")"); return e; }
    if (this.eat("{")) {
      const first = this.expr();
      if (this.eat("{")) { // replication {n{...}}
        const parts = []; do { parts.push(this.expr()); } while (this.eat(","));
        this.expect("}"); this.expect("}");
        return { k: "repl", count: first, parts };
      }
      const parts = [first]; while (this.eat(",")) parts.push(this.expr()); this.expect("}");
      return { k: "concat", parts };
    }
    if (c.t === "id") { this.p++; return this.selects({ k: "id", name: c.v, line: c.line }); }
    throw new VerilogError(`unexpected '${c.v}' in expression`, c.line);
  }
}

/* ---------------------------------------------------------------- helpers */
const mask = w => (1n << BigInt(w)) - 1n;
const big = v => typeof v === "bigint" ? v : BigInt(v);

/* ---------------------------------------------------------------- elaboration */
// Turns the parsed modules into a flat design: signals + processes whose
// expression trees point straight at signal objects.
function elaborate(mods, topName) {
  const byName = new Map(mods.map(m => [m.name, m]));
  let top = topName ? byName.get(topName) : null;
  if (topName && !top) {
    throw new VerilogError(`your top module must be called '${topName}' (found: ${mods.map(m => m.name).join(", ")})`);
  }
  if (!top) {
    const used = new Set(); mods.forEach(m => m.items.forEach(it => { if (it.k === "inst") used.add(it.mod); }));
    top = mods.filter(m => !used.has(m.name)).pop() || mods[mods.length - 1];
  }
  const D = { signals: [], byPath: new Map(), comb: [], seq: [], inits: [], warnings: [], top: top.name, ports: [] };
  let procCounter = 0;
  const warn = (msg, line) => { const s = line ? `line ${line}: ${msg}` : msg; if (!D.warnings.includes(s)) D.warnings.push(s); };

  function constEval(e, scope, what) {
    const r = resolve(e, scope, { constOnly: what || "this value" });
    return Number(evalExpr(r, Math.max(32, selfWidth(r))));
  }

  function build(mod, prefix, paramOverrides, depth) {
    if (depth > 16) throw new VerilogError("module instances nest too deeply (does a module instantiate itself?)");
    const scope = { names: new Map(), params: new Map(), prefix, mod };
    // parameters
    for (const p of mod.params) {
      let val;
      if (!p.local && paramOverrides && paramOverrides.has(p.name)) val = paramOverrides.get(p.name);
      else val = BigInt(constEval(p.expr, scope, `parameter ${p.name}`));
      scope.params.set(p.name, val);
    }
    if (paramOverrides) for (const k of paramOverrides.keys()) if (!mod.params.some(p => p.name === k && !p.local)) throw new VerilogError(`module '${mod.name}' has no parameter '${k}'`);

    const rangeW = (r, nm) => {
      if (!r) return { w: 1, msb: 0, lsb: 0 };
      const msb = constEval(r.msb, scope, `the range of ${nm}`), lsb = constEval(r.lsb, scope, `the range of ${nm}`);
      const w = Math.abs(msb - lsb) + 1;
      if (w > 64) throw new VerilogError(`'${nm}' is ${w} bits wide - this simulator supports up to 64 bits`);
      return { w, msb, lsb };
    };
    const addSig = (name, info, line) => {
      if (scope.names.has(name)) {
        const s = scope.names.get(name);
        // classic style: "output q; reg q;" -> upgrade
        if (s.port && !s.redeclared) { if (info.kind === "reg") s.isReg = true; if (info.rangeSet && info.rangeSet.w > 1) Object.assign(s, info.rangeSet); s.redeclared = true; return s; }
        throw new VerilogError(`'${name}' is declared twice`, line);
      }
      if (scope.params.has(name)) throw new VerilogError(`'${name}' is already a parameter`, line);
      const s = { name, path: prefix + name, w: 1, msb: 0, lsb: 0, isReg: false, val: 0n, depth: 0, drivers: new Set(), line };
      Object.assign(s, info.rangeSet || {});
      s.isReg = info.kind === "reg"; s.int = !!info.int;
      scope.names.set(name, s); D.signals.push(s); D.byPath.set(s.path, s);
      return s;
    };

    // ports
    for (const pn of mod.portOrder) {
      const decl = mod.ports.find(p => p.name === pn);
      if (!decl) throw new VerilogError(`port '${pn}' has no direction - add 'input ${pn};' or 'output ${pn};'`, mod.line);
      const r = rangeW(decl.range, pn);
      const s = addSig(pn, { kind: decl.kind, rangeSet: { w: r.w, msb: r.msb, lsb: r.lsb } }, decl.line);
      s.port = decl.dir;
      if (decl.dir === "inout") throw new VerilogError("inout ports are not supported", decl.line);
    }
    for (const it of mod.items) if (it.k === "decl") {
      const r = it.width === 32 && !it.range ? { w: 32, msb: 31, lsb: 0 } : rangeW(it.range, it.name);
      const s = addSig(it.name, { kind: it.kind, int: it.int, rangeSet: (it.range || it.width) ? { w: r.w, msb: r.msb, lsb: r.lsb } : null }, it.line);
      if (it.arr) {
        const a = constEval(it.arr.msb, scope, `the size of ${it.name}`), b = constEval(it.arr.lsb, scope, `the size of ${it.name}`);
        s.arrLo = Math.min(a, b); s.depth = Math.abs(a - b) + 1;
        if (s.depth > 65536) throw new VerilogError(`memory '${it.name}' is too large`, it.line);
        s.mem = new Array(s.depth).fill(0n);
      }
    }
    // top-level port list for the design
    if (!prefix) for (const pn of mod.portOrder) { const s = scope.names.get(pn); D.ports.push({ name: pn, dir: s.port, w: s.w, sig: s }); }

    for (const it of mod.items) {
      if (it.k === "assign") {
        const lhs = resolve(it.lhs, scope, { lvalue: true });
        targetsOf(lhs).forEach(s => {
          if (s.isReg && !s.int) throw new VerilogError(`'${s.name}' is a reg, so it cannot be driven by assign. Declare it as a wire (or drive it from an always block)`, it.line);
          driven(s, "assign@" + it.line, it.line);
        });
        D.comb.push({ kind: "assign", line: it.line, lhs, rhs: resolve(it.rhs, scope) });
      } else if (it.k === "always") {
        const uid = ++procCounter;
        const body = resolveStmt(it.body, scope);
        const p = { kind: "always", line: it.line, body, kw: it.kw };
        const writes = new Set(); collectWrites(body, writes);
        writes.forEach(s => {
          if (!s.isReg) throw new VerilogError(`'${s.name}' is assigned inside an always block, so it must be declared 'reg' (or 'output reg')`, it.line);
          driven(s, "always@" + it.line + "#" + uid, it.line);
        });
        if (it.sens === "*" || it.sens.every(x => !x.edge)) {
          p.writes = writes;
          if (it.sens !== "*") {
            const reads = new Set(); collectReads(body, reads);
            const listed = new Set(it.sens.map(x => { const s = scope.names.get(x.name); if (!s) throw new VerilogError(`'${x.name}' in the sensitivity list is not declared`, x.line); return s; }));
            const missing = [...reads].filter(s => !listed.has(s) && !writes.has(s)).map(s => s.name);
            if (missing.length) warn(`sensitivity list is missing ${missing.join(", ")} - use always @(*) so you never miss one`, it.line);
          }
          lintComb(body, it, writes);
          D.comb.push(p);
        } else {
          if (it.sens.some(x => !x.edge)) throw new VerilogError("do not mix edge (posedge/negedge) and level signals in one sensitivity list", it.line);
          p.sens = it.sens.map(x => {
            const s = scope.names.get(x.name);
            if (!s) throw new VerilogError(`'${x.name}' in the sensitivity list is not declared`, x.line);
            return { edge: x.edge, sig: s };
          });
          lintSeq(body, it);
          D.seq.push(p);
        }
      } else if (it.k === "initial") {
        D.inits.push({ body: resolveStmt(it.body, scope), line: it.line });
      } else if (it.k === "init") {
        D.inits.push({ body: { k: "ba", lhs: resolve({ k: "id", name: it.name, line: it.line }, scope, { lvalue: true }), rhs: resolve(it.rhs, scope), line: it.line }, line: it.line });
      } else if (it.k === "inst") {
        const sub = byName.get(it.mod);
        if (!sub) throw new VerilogError(`unknown module '${it.mod}' (is it defined in the code?)`, it.line);
        const ov = new Map();
        const pubParams = sub.params.filter(p => !p.local);
        it.params.forEach((pp, i) => {
          const nm = it.namedParams ? pp.name : (pubParams[i] || {}).name;
          if (!nm) throw new VerilogError(`too many parameters for '${it.mod}'`, it.line);
          ov.set(nm, BigInt(constEval(pp.expr, scope, `parameter ${nm}`)));
        });
        const subScope = build(sub, prefix + it.name + ".", ov, depth + 1);
        it.conns.forEach((cn, i) => {
          const pn = it.named ? cn.name : sub.portOrder[i];
          if (!pn) throw new VerilogError(`too many connections for '${it.mod}' (it has ${sub.portOrder.length} ports)`, it.line);
          const ps = subScope.names.get(pn);
          if (!ps || !ps.port) throw new VerilogError(`module '${it.mod}' has no port called '${pn}'`, it.line);
          if (!cn.expr) return;
          const portRef = { k: "sig", sig: ps };
          if (ps.port === "input") {
            D.comb.push({ kind: "assign", line: it.line, lhs: portRef, rhs: resolve(cn.expr, scope), inst: true });
            driven(ps, "port", it.line);
          } else {
            let lhs;
            try { lhs = resolve(cn.expr, scope, { lvalue: true }); }
            catch (e) { throw new VerilogError(`output port '${pn}' of ${it.name} must connect to a wire, not an expression`, it.line); }
            targetsOf(lhs).forEach(s => {
              if (s.isReg && !s.int) throw new VerilogError(`'${s.name}' is connected to an output of ${it.name}, so it must be a wire, not a reg`, it.line);
              driven(s, "inst:" + it.name, it.line);
            });
            D.comb.push({ kind: "assign", line: it.line, lhs, rhs: portRef, inst: true });
          }
        });
        if (it.named) {
          const conn = new Set(it.conns.map(c => c.name));
          sub.portOrder.forEach(pn => { if (!conn.has(pn) && subScope.names.get(pn).port === "input") warn(`input '${pn}' of ${it.name} is not connected (it reads as 0)`, it.line); });
        }
      }
    }
    // outputs never driven
    for (const pn of mod.portOrder) {
      const s = scope.names.get(pn);
      if (s.port === "output" && !s.drivers.size) warn(`output '${pn}'${prefix ? " of " + prefix.slice(0, -1) : ""} is never assigned`, mod.line);
    }
    return scope;
  }

  function driven(s, who, line) {
    const isAlways = who.startsWith("always");
    for (const d of s.drivers) {
      if (d === who) continue;
      if (isAlways || d.startsWith("always"))
        throw new VerilogError(`'${s.name}' is driven from two places. Assign each signal in only one always block (or one assign)`, line);
    }
    s.drivers.add(who);
  }

  function lookup(name, scope, line, opts) {
    if (scope.params.has(name)) {
      if (opts && opts.lvalue) throw new VerilogError(`'${name}' is a parameter and cannot be assigned`, line);
      const v = scope.params.get(name);
      return { k: "num", w: 32, v: v & mask(64), dc: 0n, sized: false, param: name };
    }
    const s = scope.names.get(name);
    if (!s) {
      if (opts && opts.constOnly) throw new VerilogError(`'${name}' is not a parameter, so it cannot be used in ${opts.constOnly}`, line);
      throw new VerilogError(`'${name}' is not declared`, line);
    }
    if (opts && opts.constOnly) throw new VerilogError(`'${name}' is a signal, so it cannot be used in ${opts.constOnly}`, line);
    return { k: "sig", sig: s };
  }

  function resolve(e, scope, opts) {
    switch (e.k) {
      case "num": case "fill": return e;
      case "id": {
        const r = lookup(e.name, scope, e.line, opts);
        if (r.k === "sig" && r.sig.depth && !(opts && opts.allowMem)) throw new VerilogError(`'${e.name}' is a memory - pick one word with ${e.name}[index]`, e.line);
        return r;
      }
      case "bit": case "part": case "ipart": {
        const base = e.of.k === "id" ? lookup(e.of.name, scope, e.of.line, opts) : resolve(e.of, scope, Object.assign({}, opts, { allowMem: true }));
        if (base.k === "num") throw new VerilogError(`cannot select bits of parameter '${e.of.name}'`, e.line);
        const s = base.sig;
        if (e.k === "bit" && base.k === "sig" && s.depth && e.of.k === "id") {
          return { k: "mem", sig: s, idx: resolve(e.idx, scope), line: e.line };
        }
        const inner = base.k === "mem" ? base : base;
        const ew = base.k === "mem" ? s.w : (base.k === "sig" ? s.w : null);
        if (e.k === "bit") return { k: "bit", of: inner, idx: resolve(e.idx, scope), line: e.line, w: ew };
        if (e.k === "part") {
          const a = constEval(e.msb, scope, "a part select"), b = constEval(e.lsb, scope, "a part select");
          return { k: "part", of: inner, a, b, line: e.line };
        }
        return { k: "ipart", of: inner, base: resolve(e.base, scope), width: constEval(e.width, scope, "the width of +:"), dir: e.dir, line: e.line };
      }
      case "concat": return { k: "concat", parts: e.parts.map(p => resolve(p, scope, opts)) };
      case "repl": {
        if (opts && opts.lvalue) throw new VerilogError("replication {n{...}} cannot be assigned to");
        const n = constEval(e.count, scope, "a replication count");
        if (n < 1 || n > 64) throw new VerilogError("replication count must be 1..64");
        return { k: "repl", count: n, parts: e.parts.map(p => resolve(p, scope)) };
      }
      case "un": case "bin": case "tern": case "call":
        if (opts && opts.lvalue) throw new VerilogError("you can only assign to a signal, a bit/part of it, or a {concatenation}");
        if (e.k === "un") return { k: "un", op: e.op, a: resolve(e.a, scope, opts) };
        if (e.k === "bin") return { k: "bin", op: e.op, a: resolve(e.a, scope, opts), b: resolve(e.b, scope, opts) };
        if (e.k === "tern") return { k: "tern", c: resolve(e.c, scope, opts), a: resolve(e.a, scope, opts), b: resolve(e.b, scope, opts) };
        if (!["$signed", "$unsigned", "$clog2", "$bits"].includes(e.name)) throw new VerilogError(`${e.name}() is not supported`, e.line);
        if (e.name === "$bits") { const a = resolve(e.args[0], scope, Object.assign({}, opts, { constOnly: undefined })); return { k: "num", w: 32, v: BigInt(selfWidth(a)), dc: 0n, sized: false }; }
        return { k: "call", name: e.name, args: e.args.map(a => resolve(a, scope, opts)) };
    }
    throw new VerilogError("cannot understand this expression");
  }

  function resolveStmt(s, scope) {
    switch (s.k) {
      case "nop": return s;
      case "block": return { k: "block", body: s.body.map(x => resolveStmt(x, scope)), line: s.line };
      case "if": return { k: "if", cond: resolve(s.cond, scope), then: resolveStmt(s.then, scope), els: s.els && resolveStmt(s.els, scope), line: s.line };
      case "case": return { k: "case", kind: s.kind, sel: resolve(s.sel, scope), items: s.items.map(i => ({ labels: i.labels.map(l => resolve(l, scope)), body: resolveStmt(i.body, scope) })), def: s.def && resolveStmt(s.def, scope), line: s.line };
      case "for": return { k: "for", init: resolveStmt(s.init, scope), cond: resolve(s.cond, scope), step: resolveStmt(s.step, scope), body: resolveStmt(s.body, scope), line: s.line };
      case "ba": case "nba": return { k: s.k, lhs: resolve(s.lhs, scope, { lvalue: true }), rhs: resolve(s.rhs, scope), line: s.line };
      case "sys": return { k: "sys", name: s.name, args: s.args.map(a => a.k === "str" ? a : resolve(a, scope)), line: s.line };
    }
    throw new VerilogError("unknown statement");
  }

  function lintComb(body, it, writes) {
    if (it.kw === "always_latch") return;
    const all = assignedAll(body);
    const latches = [...writes].filter(s => !all.has(s) && !s.int);
    if (latches.length) warn(`latch inferred for ${latches.map(s => s.name).join(", ")}: not assigned in every path of this always @(*) block. Add an else / default, or set a default value at the top`, it.line);
    walk(body, st => { if (st.k === "nba") warn("use blocking '=' in combinational always blocks", st.line); });
  }
  function lintSeq(body, it) {
    walk(body, st => { if (st.k === "ba" && targetsOf(st.lhs).some(s => !s.int)) warn("use non-blocking '<=' in clocked always blocks (blocking '=' can cause race bugs)", st.line); });
  }

  build(top, "", null, 0);
  return D;
}

function walk(s, f) {
  if (!s) return; f(s);
  if (s.k === "block") s.body.forEach(x => walk(x, f));
  else if (s.k === "if") { walk(s.then, f); walk(s.els, f); }
  else if (s.k === "case") { s.items.forEach(i => walk(i.body, f)); walk(s.def, f); }
  else if (s.k === "for") { walk(s.init, f); walk(s.step, f); walk(s.body, f); }
}
function targetsOf(l) {
  if (l.k === "sig") return [l.sig];
  if (l.k === "mem") return [l.sig];
  if (l.k === "bit" || l.k === "part" || l.k === "ipart") return targetsOf(l.of);
  if (l.k === "concat") return l.parts.flatMap(targetsOf);
  return [];
}
function collectWrites(s, set) { walk(s, st => { if (st.k === "ba" || st.k === "nba") targetsOf(st.lhs).forEach(x => set.add(x)); }); }
function readsOfExpr(e, set) {
  if (!e) return;
  switch (e.k) {
    case "sig": set.add(e.sig); break;
    case "mem": set.add(e.sig); readsOfExpr(e.idx, set); break;
    case "bit": readsOfExpr(e.of, set); readsOfExpr(e.idx, set); break;
    case "part": readsOfExpr(e.of, set); break;
    case "ipart": readsOfExpr(e.of, set); readsOfExpr(e.base, set); break;
    case "concat": case "repl": e.parts.forEach(p => readsOfExpr(p, set)); break;
    case "un": readsOfExpr(e.a, set); break;
    case "bin": readsOfExpr(e.a, set); readsOfExpr(e.b, set); break;
    case "tern": readsOfExpr(e.c, set); readsOfExpr(e.a, set); readsOfExpr(e.b, set); break;
    case "call": e.args.forEach(a => readsOfExpr(a, set)); break;
  }
}
function collectReads(s, set) {
  walk(s, st => {
    if (st.k === "if") readsOfExpr(st.cond, set);
    if (st.k === "case") { readsOfExpr(st.sel, set); st.items.forEach(i => i.labels.forEach(l => readsOfExpr(l, set))); }
    if (st.k === "ba" || st.k === "nba") { readsOfExpr(st.rhs, set); if (st.lhs.k !== "sig") { const t = new Set(); readsOfExpr(st.lhs, t); t.forEach(x => { if (!targetsOf(st.lhs).includes(x)) set.add(x); }); } }
  });
}
// signals definitely assigned (whole) on every path
function assignedAll(s) {
  if (!s) return new Set();
  switch (s.k) {
    case "ba": case "nba": return new Set(s.lhs.k === "sig" || s.lhs.k === "concat" ? targetsOf(s.lhs) : targetsOf(s.lhs));
    case "block": { const r = new Set(); s.body.forEach(x => assignedAll(x).forEach(v => r.add(v))); return r; }
    case "if": { if (!s.els) return new Set(); const a = assignedAll(s.then), b = assignedAll(s.els); return new Set([...a].filter(x => b.has(x))); }
    case "case": {
      if (!s.def && !caseIsFull(s)) return new Set();
      const sets = s.items.map(i => assignedAll(i.body)); if (s.def) sets.push(assignedAll(s.def));
      return sets.reduce((acc, x) => new Set([...acc].filter(v => x.has(v))));
    }
    case "for": return assignedAll(s.body);
  }
  return new Set();
}
function caseIsFull(s) {
  const w = selfWidth(s.sel); if (w > 10) return false;
  const vals = new Set();
  for (const it of s.items) for (const l of it.labels) {
    if (l.k !== "num") return false;
    if (l.dc) { // count matches
      for (let v = 0; v < (1 << w); v++) if ((BigInt(v) & ~l.dc & mask(w)) === (l.v & ~l.dc & mask(w))) vals.add(v);
    } else vals.add(Number(l.v));
  }
  return vals.size === (1 << w);
}

/* ---------------------------------------------------------------- widths & eval */
function bitPos(sig, idx) { return sig.msb >= sig.lsb ? idx - sig.lsb : sig.lsb - idx; }
function baseWidth(of) { return of.k === "mem" ? of.sig.w : of.k === "sig" ? of.sig.w : selfWidth(of); }

export function selfWidth(e) {
  switch (e.k) {
    case "num": return e.sized ? e.w : 32;
    case "fill": return 1;
    case "sig": return e.sig.w;
    case "mem": return e.sig.w;
    case "bit": return 1;
    case "part": return Math.abs(e.a - e.b) + 1;
    case "ipart": return e.width;
    case "concat": return e.parts.reduce((s, p) => s + selfWidth(p), 0);
    case "repl": return e.count * e.parts.reduce((s, p) => s + selfWidth(p), 0);
    case "un": return ["~", "-", "+"].includes(e.op) ? selfWidth(e.a) : 1;
    case "bin":
      if (["+", "-", "*", "/", "%", "&", "|", "^", "~^"].includes(e.op)) return Math.max(selfWidth(e.a), selfWidth(e.b));
      if (["<<", ">>", "<<<", ">>>", "**"].includes(e.op)) return selfWidth(e.a);
      return 1;
    case "tern": return Math.max(selfWidth(e.a), selfWidth(e.b));
    case "call": return e.name === "$clog2" ? 32 : selfWidth(e.args[0]);
  }
  return 32;
}

function readBase(of) {
  if (of.k === "sig") return of.sig.val;
  if (of.k === "mem") return memRead(of);
  return evalExpr(of, selfWidth(of));
}
function memRead(m) {
  const i = Number(evalExpr(m.idx, selfWidth(m.idx))) - m.sig.arrLo;
  if (i < 0 || i >= m.sig.depth) return 0n;
  return m.sig.mem[i];
}

export function evalExpr(e, w) {
  const M = mask(w);
  switch (e.k) {
    case "num": return e.v & M;
    case "fill": return e.bit ? M : 0n;
    case "sig": return e.sig.val & M;
    case "mem": return memRead(e) & M;
    case "bit": {
      const sig = e.of.k === "sig" || e.of.k === "mem" ? e.of.sig : null;
      const idx = Number(evalExpr(e.idx, selfWidth(e.idx)));
      const pos = sig ? bitPos(sig, idx) : idx;
      const bw = baseWidth(e.of);
      if (pos < 0 || pos >= bw) return 0n;
      return (readBase(e.of) >> BigInt(pos)) & 1n;
    }
    case "part": {
      const sig = e.of.sig; const lo = Math.min(bitPos(sig, e.a), bitPos(sig, e.b));
      const wd = Math.abs(e.a - e.b) + 1;
      return (readBase(e.of) >> BigInt(Math.max(0, lo))) & mask(wd) & M;
    }
    case "ipart": {
      const sig = e.of.sig; const b = Number(evalExpr(e.base, selfWidth(e.base)));
      const lowIdx = e.dir === "+" ? b : b - e.width + 1;
      const lo = sig.msb >= sig.lsb ? lowIdx - sig.lsb : sig.lsb - (lowIdx + e.width - 1);
      if (lo < 0) return 0n;
      return (readBase(e.of) >> BigInt(lo)) & mask(e.width) & M;
    }
    case "concat": {
      let v = 0n;
      for (const p of e.parts) { const pw = selfWidth(p); v = (v << BigInt(pw)) | evalExpr(p, pw); }
      return v & M;
    }
    case "repl": {
      let one = 0n, ow = 0;
      for (const p of e.parts) { const pw = selfWidth(p); one = (one << BigInt(pw)) | evalExpr(p, pw); ow += pw; }
      let v = 0n; for (let i = 0; i < e.count; i++) v = (v << BigInt(ow)) | one;
      return v & M;
    }
    case "un": {
      if (e.op === "~") return ~evalExpr(e.a, w) & M;
      if (e.op === "-") return (-evalExpr(e.a, w)) & M;
      if (e.op === "+") return evalExpr(e.a, w);
      const aw = selfWidth(e.a), a = evalExpr(e.a, aw);
      if (e.op === "!") return a === 0n ? 1n : 0n;
      const full = mask(aw);
      let ones = 0; for (let x = a; x; x >>= 1n) if (x & 1n) ones++;
      switch (e.op) {
        case "&": return a === full ? 1n : 0n;
        case "|": return a !== 0n ? 1n : 0n;
        case "^": return BigInt(ones & 1);
        case "~&": return a === full ? 0n : 1n;
        case "~|": return a !== 0n ? 0n : 1n;
        case "~^": return BigInt(1 - (ones & 1));
      }
      break;
    }
    case "bin": {
      const op = e.op;
      if (["+", "-", "*", "/", "%", "&", "|", "^", "~^"].includes(op)) {
        const a = evalExpr(e.a, w), b = evalExpr(e.b, w);
        switch (op) {
          case "+": return (a + b) & M;
          case "-": return (a - b) & M;
          case "*": return (a * b) & M;
          case "/": return b === 0n ? M : (a / b) & M;
          case "%": return b === 0n ? M : (a % b) & M;
          case "&": return a & b;
          case "|": return a | b;
          case "^": return a ^ b;
          case "~^": return ~(a ^ b) & M;
        }
      }
      if (["<<", ">>", "<<<", ">>>"].includes(op)) {
        const a = evalExpr(e.a, w), b = evalExpr(e.b, selfWidth(e.b));
        if (b > 128n) return 0n;
        return (op[0] === "<" ? (a << b) : (a >> b)) & M;
      }
      if (op === "**") { const a = evalExpr(e.a, w), b = evalExpr(e.b, selfWidth(e.b)); return b > 128n ? 0n : (a ** b) & M; }
      if (op === "&&" || op === "||") {
        const a = evalExpr(e.a, selfWidth(e.a)) !== 0n;
        if (op === "&&" && !a) return 0n; if (op === "||" && a) return 1n;
        return evalExpr(e.b, selfWidth(e.b)) !== 0n ? 1n : 0n;
      }
      const ow = Math.max(selfWidth(e.a), selfWidth(e.b));
      const a = evalExpr(e.a, ow), b = evalExpr(e.b, ow);
      switch (op) {
        case "==": return a === b ? 1n : 0n;
        case "!=": return a !== b ? 1n : 0n;
        case "<": return a < b ? 1n : 0n;
        case "<=": return a <= b ? 1n : 0n;
        case ">": return a > b ? 1n : 0n;
        case ">=": return a >= b ? 1n : 0n;
      }
      break;
    }
    case "tern": return evalExpr(e.c, selfWidth(e.c)) !== 0n ? evalExpr(e.a, w) : evalExpr(e.b, w);
    case "call": {
      if (e.name === "$clog2") { let v = evalExpr(e.args[0], 64), n = 0n; v = v - 1n; while (v > 0n) { v >>= 1n; n++; } return n & M; }
      return evalExpr(e.args[0], w);
    }
  }
  throw new VerilogError("cannot evaluate expression");
}

/* ---------------------------------------------------------------- compile API */
export function compileVerilog(src, opts = {}) {
  const mods = new Parser(lex(src)).file();
  const names = new Set();
  mods.forEach(m => { if (names.has(m.name)) throw new VerilogError(`module '${m.name}' is defined twice`, m.line); names.add(m.name); });
  return elaborate(mods, opts.top);
}

/* ---------------------------------------------------------------- simulator */
export class Sim {
  constructor(design, opts = {}) {
    this.D = design; this.log = []; this.changed = false;
    this.maxPasses = opts.maxPasses || 400;
    for (const s of design.signals) { s.val = 0n; if (s.mem) s.mem.fill(0n); }
    for (const ini of design.inits) this.exec(ini.body, null, "init");
    this.settle();
  }
  port(name) { const p = this.D.ports.find(p => p.name === name); if (!p) throw new VerilogError(`no port called '${name}'`); return p; }
  get(name) { return this.port(name).sig.val; }

  write(s, lo, w, value, idx) {
    if (s.mem) {
      if (idx === undefined) return;
      const i = idx - s.arrLo; if (i < 0 || i >= s.depth) return;
      const old = s.mem[i]; const m = mask(w) << BigInt(lo);
      const nv = (old & ~m) | ((big(value) & mask(w)) << BigInt(lo));
      if (nv !== old) { s.mem[i] = nv; this.changed = true; }
      return;
    }
    if (lo < 0) { value = big(value) >> BigInt(-lo); w += lo; lo = 0; }
    if (lo + w > s.w) w = s.w - lo;
    if (w <= 0) return;
    const m = mask(w) << BigInt(lo);
    const nv = (s.val & ~m) | ((big(value) & mask(w)) << BigInt(lo));
    if (nv !== s.val) { s.val = nv; this.changed = true; }
  }

  // resolve an lvalue into concrete writes [{sig, lo, w, idx}] (evaluated now)
  targets(l) {
    switch (l.k) {
      case "sig": return [{ sig: l.sig, lo: 0, w: l.sig.w }];
      case "mem": return [{ sig: l.sig, lo: 0, w: l.sig.w, idx: Number(evalExpr(l.idx, selfWidth(l.idx))) }];
      case "bit": {
        const base = this.targets(l.of)[0]; const sig = base.sig;
        const idx = Number(evalExpr(l.idx, selfWidth(l.idx)));
        const pos = bitPos(sig, idx);
        if (pos < 0 || pos >= sig.w) return [];
        return [{ sig, lo: pos, w: 1, idx: base.idx }];
      }
      case "part": {
        const base = this.targets(l.of)[0]; const sig = base.sig;
        const lo = Math.min(bitPos(sig, l.a), bitPos(sig, l.b));
        return [{ sig, lo, w: Math.abs(l.a - l.b) + 1, idx: base.idx }];
      }
      case "ipart": {
        const base = this.targets(l.of)[0]; const sig = base.sig;
        const b = Number(evalExpr(l.base, selfWidth(l.base)));
        const lowIdx = l.dir === "+" ? b : b - l.width + 1;
        const lo = sig.msb >= sig.lsb ? lowIdx - sig.lsb : sig.lsb - (lowIdx + l.width - 1);
        return [{ sig, lo, w: l.width, idx: base.idx }];
      }
      case "concat": return l.parts.flatMap(p => this.targets(p));
    }
    return [];
  }
  lwidth(l) { return l.k === "concat" ? l.parts.reduce((s, p) => s + this.lwidth(p), 0) : selfWidth(l); }

  assign(lhs, rhs, nba) {
    const lw = this.lwidth(lhs);
    let v = evalExpr(rhs, Math.max(lw, selfWidth(rhs))) & mask(lw);
    const ts = this.targets(lhs);
    // concat targets: MSB part first
    let rem = lw;
    const writes = [];
    if (lhs.k === "concat") {
      for (const t of ts) { rem -= t.w; writes.push([t, (v >> BigInt(rem)) & mask(t.w)]); }
    } else if (ts.length) writes.push([ts[0], v]);
    if (nba) nba.push(...writes);
    else writes.forEach(([t, val]) => this.write(t.sig, t.lo, t.w, val, t.idx));
  }

  exec(s, nba, ctx) {
    switch (s.k) {
      case "nop": return;
      case "block": for (const x of s.body) this.exec(x, nba, ctx); return;
      case "ba": this.assign(s.lhs, s.rhs, null); return;
      case "nba":
        if (!nba) { this.assign(s.lhs, s.rhs, null); return; }
        this.assign(s.lhs, s.rhs, nba); return;
      case "if": if (evalExpr(s.cond, selfWidth(s.cond)) !== 0n) this.exec(s.then, nba, ctx); else if (s.els) this.exec(s.els, nba, ctx); return;
      case "case": {
        const lw = Math.max(selfWidth(s.sel), ...s.items.flatMap(i => i.labels.map(selfWidth)));
        const sv = evalExpr(s.sel, lw);
        for (const it of s.items) for (const l of it.labels) {
          let lv = evalExpr(l, lw), dc = s.kind !== "case" && l.k === "num" ? l.dc : 0n;
          if (((sv ^ lv) & ~dc & mask(lw)) === 0n) { this.exec(it.body, nba, ctx); return; }
        }
        if (s.def) this.exec(s.def, nba, ctx);
        return;
      }
      case "for": {
        this.exec(s.init, nba, ctx);
        let n = 0;
        while (evalExpr(s.cond, selfWidth(s.cond)) !== 0n) {
          if (++n > 100000) throw new VerilogError("for loop runs too long (more than 100000 times)", s.line);
          this.exec(s.body, nba, ctx); this.exec(s.step, nba, ctx);
        }
        return;
      }
      case "sys": {
        if (s.name === "$display" || s.name === "$write") {
          let out = "", args = s.args.slice();
          if (args[0] && args[0].k === "str") {
            const fmt = args.shift().v;
            out = fmt.replace(/%(0?\d*)([dbhxoct%])/gi, (m, pad, f) => {
              if (f === "%") return "%";
              if (f.toLowerCase() === "t") return String(this.time || 0);
              const a = args.shift(); if (!a) return m;
              const v = evalExpr(a, selfWidth(a));
              const base = { d: 10, b: 2, h: 16, x: 16, o: 8 }[f.toLowerCase()];
              let txt = v.toString(base); if (base === 16) txt = txt.toUpperCase();
              if (f.toLowerCase() !== "d" && !pad) txt = txt.padStart(Math.ceil(selfWidth(a) / Math.log2(base)), "0");
              if (f.toLowerCase() === "c") txt = String.fromCharCode(Number(v));
              return pad ? txt.padStart(parseInt(pad, 10), pad[0] === "0" ? "0" : " ") : txt;
            });
          }
          out += args.map(a => evalExpr(a, selfWidth(a)).toString()).join(" ");
          this.log.push(out + (s.name === "$display" ? "\n" : ""));
          if (this.log.length > 2000) this.log.splice(0, 1000);
        } else if (s.name === "$finish" || s.name === "$stop") { /* ignored */ }
        else throw new VerilogError(`${s.name} is not supported`, s.line);
        return;
      }
    }
  }

  settle() {
    for (let pass = 0; pass < this.maxPasses; pass++) {
      let any = false;
      for (const p of this.D.comb) {
        if (p.kind === "assign") { this.changed = false; this.assign(p.lhs, p.rhs, null); if (this.changed) any = true; }
        else {
          // compare a block's results before/after, so temporaries that are
          // rebuilt every run (n = 0; n = n + ...) do not count as a change
          const ws = p.writesArr || (p.writesArr = [...p.writes]);
          const before = ws.map(s => s.mem ? s.mem.join(",") : s.val);
          this.exec(p.body, null, "comb");
          for (let i = 0; i < ws.length; i++) {
            const s = ws[i], now = s.mem ? s.mem.join(",") : s.val;
            if (now !== before[i]) { any = true; break; }
          }
        }
      }
      if (!any) return;
    }
    throw new VerilogError("the circuit never settles: there is a combinational loop (a signal that depends on itself without a clock)");
  }

  // set inputs, then propagate (including clock edges)
  set(values) {
    const watch = new Set(); this.D.seq.forEach(p => p.sens.forEach(x => watch.add(x.sig)));
    let prev = new Map([...watch].map(s => [s, s.val]));
    for (const [k, v] of Object.entries(values)) {
      const p = this.port(k);
      if (p.dir !== "input") throw new VerilogError(`'${k}' is not an input`);
      p.sig.val = big(v) & mask(p.sig.w);
    }
    this.settle();
    for (let guard = 0; guard < 50; guard++) {
      const trig = this.D.seq.filter(p => p.sens.some(x => {
        const a = prev.get(x.sig) & 1n, b = x.sig.val & 1n;
        return x.edge === "pos" ? (a === 0n && b === 1n) : (a === 1n && b === 0n);
      }));
      if (!trig.length) return;
      prev = new Map([...watch].map(s => [s, s.val]));
      const nba = [];
      for (const p of trig) this.exec(p.body, nba, "seq");
      for (const [t, v] of nba) this.write(t.sig, t.lo, t.w, v, t.idx);
      this.settle();
    }
    throw new VerilogError("clock edges keep triggering each other (a clock made from a register feeding back?)");
  }
  outputs() { const o = {}; this.D.ports.filter(p => p.dir === "output").forEach(p => o[p.name] = p.sig.val); return o; }
  inputs() { return this.D.ports.filter(p => p.dir === "input"); }
}

/* ---------------------------------------------------------------- checker */
// Compares a user's design against a reference design.
// spec: { top, kind: 'comb'|'seq', clk, reset:{name, active:0|1, cycles}, cycles, seed, stim(rng, cycle) }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export function checkDesign(userSrc, refSrc, spec) {
  const res = { ok: false, error: null, warnings: [], mismatch: null, trace: [], passed: 0, total: 0, log: "" };
  let U, R;
  try { U = compileVerilog(userSrc, { top: spec.top }); }
  catch (e) { res.error = e.message; res.errorLine = e.line; return res; }
  res.warnings = U.warnings;
  R = compileVerilog(refSrc, { top: spec.top });
  // port check
  for (const p of R.ports) {
    const q = U.ports.find(x => x.name === p.name);
    if (!q) { res.error = `your module needs ${p.dir === "input" ? "an input" : "an output"} called '${p.name}'${p.w > 1 ? ` [${p.w - 1}:0]` : ""}`; return res; }
    if (q.dir !== p.dir) { res.error = `'${p.name}' should be an ${p.dir}`; return res; }
    if (q.w !== p.w) { res.error = `'${p.name}' should be ${p.w} bit${p.w > 1 ? "s" : ""} wide${p.w > 1 ? ` ([${p.w - 1}:0])` : ""}, yours is ${q.w}`; return res; }
  }
  for (const q of U.ports) if (!R.ports.find(p => p.name === q.name)) { res.error = `remove the extra port '${q.name}' - the tests do not drive it`; return res; }

  let us, rs;
  try { us = new Sim(U); } catch (e) { res.error = e.message; return res; }
  rs = new Sim(R);
  const ins = R.ports.filter(p => p.dir === "input"), outs = R.ports.filter(p => p.dir === "output");
  const rand = rng(spec.seed || 12345);
  const snap = (sim, extra) => { const o = {}; R.ports.forEach(p => o[p.name] = sim.port(p.name).sig.val); return Object.assign(o, extra || {}); };
  const compare = (label, step) => {
    res.total++;
    const bad = outs.filter(p => us.get(p.name) !== rs.get(p.name));
    res.trace.push({ step, label, you: snap(us), exp: snap(rs), bad: bad.map(b => b.name) });
    if (bad.length) {
      const inStr = ins.filter(p => p.name !== spec.clk).map(p => `${p.name}=${fmtVal(us.get(p.name), p.w)}`).join(", ");
      res.mismatch = {
        step, label, inputs: inStr,
        outs: bad.map(p => ({ name: p.name, you: fmtVal(us.get(p.name), p.w), exp: fmtVal(rs.get(p.name), p.w) }))
      };
      return false;
    }
    res.passed++; return true;
  };
  const apply = v => { try { us.set(v); } catch (e) { res.error = e.message; throw e; } rs.set(v); };

  try {
    if (spec.kind === "comb") {
      const bits = ins.reduce((s, p) => s + p.w, 0);
      const vectors = [];
      if (spec.vectors) spec.vectors.forEach(v => vectors.push(v));
      else if (bits <= 12) for (let n = 0; n < (1 << bits); n++) {
        const v = {}; let off = 0;
        for (let i = ins.length - 1; i >= 0; i--) { const p = ins[i]; v[p.name] = (n >> off) & ((1 << p.w) - 1); off += p.w; }
        vectors.push(v);
      } else for (let n = 0; n < 400; n++) {
        const v = {}; ins.forEach(p => { v[p.name] = randBits(rand, p.w); }); vectors.push(v);
      }
      for (let i = 0; i < vectors.length; i++) {
        apply(vectors[i]);
        if (!compare(Object.entries(vectors[i]).map(([k, x]) => `${k}=${x}`).join(" "), i)) break;
      }
    } else {
      const clk = spec.clk || "clk", rst = spec.reset;
      const data = ins.filter(p => p.name !== clk && (!rst || p.name !== rst.name));
      const cycles = spec.cycles || 40;
      apply({ [clk]: 0, ...(rst ? { [rst.name]: rst.active } : {}) });
      for (let c = 0; c < cycles; c++) {
        const v = { [clk]: 0 };
        if (rst) {
          const inReset = c < (rst.cycles || 2) || (spec.midReset && c === Math.floor(cycles * 0.6));
          v[rst.name] = inReset ? rst.active : 1 - rst.active;
        }
        const st = spec.stim ? spec.stim(rand, c) : null;
        data.forEach(p => { v[p.name] = st && p.name in st ? st[p.name] : randBits(rand, p.w, spec.bias && spec.bias[p.name]); });
        apply(v);
        if (!compare(`cycle ${c}: inputs set`, c)) break;
        apply({ [clk]: 1 });
        if (!compare(`cycle ${c}: after rising clock edge`, c)) break;
      }
    }
    if (!res.error && !res.mismatch) res.ok = true;
  } catch (e) { if (!res.error) res.error = e.message; }
  res.log = us.log.join("");
  return res;
}
function randBits(rand, w, bias) {
  if (w === 1) return rand() < (bias == null ? 0.5 : bias) ? 1 : 0;
  let v = 0n; for (let i = 0; i < w; i++) if (rand() < 0.5) v |= 1n << BigInt(i);
  return v;
}
export function fmtVal(v, w) { v = big(v); return w === 1 ? String(v) : (w <= 8 ? `${w}'b${v.toString(2).padStart(w, "0")}` : `${w}'h${v.toString(16).toUpperCase()}`); }

/* run a design with a simple auto stimulus (for the playground) */
export function autoRun(src, opts = {}) {
  const D = compileVerilog(src, { top: opts.top });
  const sim = new Sim(D);
  const ins = D.ports.filter(p => p.dir === "input");
  const clk = ins.find(p => /^(clk|clock|i_clk|clk_i)$/i.test(p.name));
  const rst = ins.find(p => /^(rst|reset|rst_n|reset_n|rstn|areset|i_rst)$/i.test(p.name));
  const rstActive = rst && /n$/i.test(rst.name) ? 0 : 1;
  const rand = rng(opts.seed || 7);
  const trace = [];
  const snap = label => { const o = {}; D.ports.forEach(p => o[p.name] = p.sig.val); trace.push({ label, you: o }); };
  if (clk) {
    sim.set({ [clk.name]: 0, ...(rst ? { [rst.name]: rstActive } : {}) });
    const n = opts.cycles || 16;
    for (let c = 0; c < n; c++) {
      const v = { [clk.name]: 0 };
      if (rst) v[rst.name] = c < 2 ? rstActive : 1 - rstActive;
      ins.filter(p => p !== clk && p !== rst).forEach(p => v[p.name] = randBits(rand, p.w, 0.6));
      sim.set(v); snap(`c${c}`);
      sim.set({ [clk.name]: 1 }); snap(`c${c}+`);
    }
  } else {
    const bits = ins.reduce((s, p) => s + p.w, 0);
    const n = bits <= 5 ? 1 << bits : 24;
    for (let k = 0; k < n; k++) {
      const v = {};
      if (bits <= 5) { let off = 0; for (let i = ins.length - 1; i >= 0; i--) { const p = ins[i]; v[p.name] = (k >> off) & ((1 << p.w) - 1); off += p.w; } }
      else ins.forEach(p => v[p.name] = randBits(rand, p.w));
      sim.set(v); snap(String(k));
    }
  }
  return { design: D, trace, warnings: D.warnings, log: sim.log.join(""), clk: clk && clk.name };
}
