import { mcq, num, con, r } from "./helpers.js";
// VLSI question bank (original).
const VT = 0.02585, ni = 1.5e10;
const vbi = (na, nd) => VT * Math.log(na * nd / ni / ni);
export const Q_VLSI = [
/* ---------------- semi-1 semiconductor fundamentals ---------------- */
mcq("semi-1", "E", "How many valence electrons does silicon have?", ["4", "3", "5", "8"], 0, "Silicon is group IV; it forms four covalent bonds.", {}),
mcq("semi-1", "E", "Doping silicon with phosphorus produces...", ["n-type, electrons are majority carriers", "p-type, holes are majority carriers", "Intrinsic silicon", "An insulator"], 0, "Phosphorus has 5 valence electrons and donates one.", {}),
mcq("semi-1", "E", "Doping silicon with boron produces...", ["p-type", "n-type", "intrinsic", "metallic"], 0, "Boron (3 valence electrons) accepts an electron, creating a hole.", {}),
num("semi-1", "M", "Silicon at 300 K: ni = 1.5×10¹⁰ cm⁻³. Doped with Nd = 10¹⁶ cm⁻³. Hole concentration p (cm⁻³)?", ni * ni / 1e16, "cm⁻³", `n ≈ Nd = 10¹⁶; p = ni²/n = ${r(ni * ni / 1e16)} cm⁻³ (mass-action law).`, { hint: "n · p = ni²" }),
mcq("semi-1", "M", "Band gap of silicon at room temperature is about...", ["1.12 eV", "0.67 eV", "1.42 eV", "3.4 eV"], 0, "Si 1.12 eV, Ge 0.67 eV, GaAs 1.42 eV.", {}),
mcq("semi-1", "M", "As temperature rises, the intrinsic carrier concentration...", ["Increases strongly (exponentially)", "Decreases", "Stays constant", "Becomes zero"], 0, "More electrons gain enough energy to cross the band gap.", {}),
mcq("semi-1", "M", "Mobility of electrons in silicon compared with holes is...", ["About 2-3 times higher", "Equal", "Lower", "10× lower"], 0, "μn ≈ 1350 and μp ≈ 480 cm²/V·s in lightly doped Si.", {}),
num("semi-1", "M", "Conductivity of n-type Si with n = 10¹⁶ cm⁻³ and μn = 1350 cm²/V·s (S/cm)? q = 1.6×10⁻¹⁹ C.", 1.6e-19 * 1e16 * 1350, "S/cm", `σ ≈ q n μn = 1.6e-19 × 1e16 × 1350 = ${r(1.6e-19 * 1e16 * 1350)} S/cm.`, {}),
con("semi-1", "E", "What is the difference between intrinsic and extrinsic semiconductors?", "An intrinsic semiconductor is pure: its electrons and holes come only from thermal generation, so n = p = ni. An extrinsic semiconductor is doped: donors (n-type) add free electrons or acceptors (p-type) add holes, so one carrier type dominates and conductivity rises by orders of magnitude and can be controlled.", [["pure vs doped", "pure|dop"], ["n = p = ni", "n ?= ?p|ni"], ["donor / acceptor", "donor|acceptor|n.?type|p.?type"]]),

/* ---------------- semi-2 PN junction ---------------- */
num("semi-2", "M", "Built-in potential of a Si junction with Na = Nd = 10¹⁶ cm⁻³ at 300 K (V)? Use VT = 25.85 mV, ni = 1.5×10¹⁰.", vbi(1e16, 1e16), "V", `Vbi = VT ln(NaNd/ni²) = 0.02585 × ln(1e32 / 2.25e20) = ${r(vbi(1e16, 1e16))} V.`, { tol: 0.02 }),
num("semi-2", "M", "Same junction but Na = 10¹⁸ cm⁻³, Nd = 10¹⁶ cm⁻³. Built-in potential (V)?", vbi(1e18, 1e16), "V", `Vbi = 0.02585 × ln(1e34 / 2.25e20) = ${r(vbi(1e18, 1e16))} V. Heavier doping raises Vbi.`, { tol: 0.02 }),
mcq("semi-2", "E", "Under reverse bias, the depletion region...", ["Widens", "Narrows", "Disappears", "Stays the same"], 0, "The applied voltage adds to the built-in potential.", {}),
mcq("semi-2", "M", "In a p+n junction (heavily doped p side), the depletion region lies mostly in...", ["The n side", "The p side", "Equally in both", "The metal contact"], 0, "Charge balance: Na·xp = Nd·xn, so the lightly doped side is wider.", {}),
num("semi-2", "M", "Diode with Is = 10⁻¹⁴ A at 300 K (VT = 25.85 mV). Current at V = 0.65 V (mA)?", 1e-14 * (Math.exp(0.65 / VT) - 1) * 1e3, "mA", `I = Is(e^(V/VT) − 1) = 1e-14 × e^(${r(0.65 / VT)}) ≈ ${r(1e-14 * Math.exp(0.65 / VT) * 1e3)} mA.`, { tol: 0.03 }),
num("semi-2", "M", "How much must the forward voltage of an ideal diode increase to multiply its current by 10, at VT = 25.85 mV (mV)?", VT * Math.log(10) * 1e3, "mV", `ΔV = VT ln 10 = ${r(VT * Math.log(10) * 1e3)} mV (about 60 mV per decade).`, {}),
mcq("semi-2", "M", "Zener breakdown dominates in junctions that are...", ["Heavily doped (breakdown below ~5 V)", "Lightly doped", "Forward biased", "Made of germanium only"], 0, "A thin depletion region lets electrons tunnel; avalanche dominates in lightly doped, higher-voltage junctions.", {}),
mcq("semi-2", "H", "Temperature coefficient of a diode's forward voltage at constant current is about...", ["−2 mV/°C", "+2 mV/°C", "0", "−20 mV/°C"], 0, "Forward voltage falls roughly 2 mV per degree - used in temperature sensors.", {}),

/* ---------------- semi-3 transistors ---------------- */
num("semi-3", "E", "BJT with β = 120 and IB = 15 µA in active region. IC (mA)?", 120 * 15e-3, "mA", "IC = β IB = 120 × 15 µA = 1.8 mA.", {}),
num("semi-3", "E", "BJT with β = 99. What is α = IC/IE?", 99 / 100, "", "α = β/(β + 1) = 99/100 = 0.99.", { tol: 0.001 }),
mcq("semi-3", "E", "A MOSFET is controlled by...", ["Gate voltage", "Base current", "Drain current", "Body current"], 0, "It is a voltage-controlled device with (ideally) no DC gate current.", {}),
mcq("semi-3", "M", "Increasing gate-oxide thickness (other things equal) makes Vth...", ["Larger in magnitude", "Smaller", "Zero", "Unchanged"], 0, "Less oxide capacitance means more gate voltage is needed to invert the channel.", {}),
mcq("semi-3", "M", "Which BJT region is used as a closed switch?", ["Saturation", "Active", "Cut-off", "Reverse active"], 0, "Both junctions forward biased, VCE ≈ 0.2 V.", {}),
con("semi-3", "M", "Compare BJTs and MOSFETs for digital logic.", "MOSFETs draw almost no static gate current, scale to very small sizes and allow complementary CMOS with near-zero static power, so they dominate digital ICs. BJTs need continuous base current, are larger, and saturated BJTs switch slowly because of stored charge, but they offer higher transconductance per current and are still used in analog, RF and some high-speed circuits.", [["gate vs base current", "gate current|base current|voltage.?controlled"], ["static power / CMOS", "static|cmos|power"], ["scaling / density", "scal|dens|small"], ["BJT strengths", "transconductance|analog|rf|gain"]]),

/* ---------------- semi-4 MOSFET operation ---------------- */
mcq("semi-4", "E", "NMOS with VGS = 1.0 V, Vth = 0.4 V, VDS = 0.2 V is in...", ["Linear (triode)", "Saturation", "Cut-off", "Breakdown"], 0, "VDS = 0.2 V < VGS − Vth = 0.6 V.", {}),
mcq("semi-4", "E", "NMOS with VGS = 1.0 V, Vth = 0.4 V, VDS = 0.9 V is in...", ["Saturation", "Linear", "Cut-off", "Subthreshold"], 0, "VDS ≥ VGS − Vth = 0.6 V.", {}),
num("semi-4", "M", "NMOS in saturation: k'(W/L) = 400 µA/V², VGS = 1.2 V, Vth = 0.4 V. ID (µA), ignoring λ?", 0.5 * 400 * (1.2 - 0.4) ** 2, "µA", "ID = ½ k'(W/L)(VGS − Vth)² = 0.5 × 400 × 0.64 = 128 µA.", {}),
num("semi-4", "M", "Same NMOS (k'W/L = 400 µA/V², Vth = 0.4 V) with VGS = 1.2 V and VDS = 0.3 V. ID (µA)?", 400 * ((1.2 - 0.4) * 0.3 - 0.3 * 0.3 / 2), "µA", "Linear: ID = k'(W/L)[(VGS − Vth)VDS − VDS²/2] = 400 × (0.24 − 0.045) = 78 µA.", {}),
num("semi-4", "M", "If W/L doubles and everything else stays the same, the saturation current changes by a factor of...", 2, "×", "ID is proportional to W/L.", {}),
num("semi-4", "M", "Doubling the overdrive (VGS − Vth) changes the ideal saturation current by a factor of...", 4, "×", "Square law: (2)² = 4. Short-channel devices show less than this because of velocity saturation.", {}),
num("semi-4", "M", "NMOS in saturation with ID = 200 µA and overdrive 0.2 V. Transconductance gm (mS)?", 2 * 200e-6 / 0.2 * 1e3, "mS", "gm = 2 ID / Vov = 2 × 200 µA / 0.2 V = 2 mS.", {}),
mcq("semi-4", "M", "Body effect: if the source is above the body voltage of an NMOS, its threshold voltage...", ["Increases", "Decreases", "Stays the same", "Becomes negative"], 0, "VSB > 0 widens the depletion region under the gate, so more gate voltage is needed.", {}),
mcq("semi-4", "M", "Channel-length modulation means that in saturation...", ["ID rises slightly with VDS", "ID falls with VDS", "Vth rises with VDS", "The device leaves saturation"], 0, "The effective channel shortens as VDS grows: ID(1 + λVDS).", {}),
mcq("semi-4", "H", "Subthreshold leakage current depends on (VGS − Vth) approximately...", ["Exponentially", "Linearly", "Quadratically", "Not at all"], 0, "Below threshold the device behaves like a BJT-style diffusion device; ~60-100 mV per decade.", {}),

/* ---------------- semi-5 CMOS logic ---------------- */
num("semi-5", "E", "Transistor count of a static CMOS 3-input NAND gate?", 6, "", "Three series NMOS and three parallel PMOS.", {}),
num("semi-5", "E", "Transistor count of a static CMOS 2-input XOR built as XOR = (A·B + A'·B')' with inverters for A' and B'?", 12, "", "The complex gate needs 8 transistors plus two inverters (4) = 12. (Transmission-gate XORs use fewer.)", {}),
mcq("semi-5", "M", "For Y = (A·(B + C))', the pull-down network is...", ["A in series with (B parallel C)", "A parallel with (B series C)", "All three in series", "All three in parallel"], 0, "Pull-down implements the un-inverted function with NMOS: AND = series, OR = parallel.", {}),
mcq("semi-5", "M", "For the same Y = (A·(B + C))', the pull-up network is...", ["A parallel with (B series C)", "A series with (B parallel C)", "All in series", "All in parallel"], 0, "The PMOS network is the dual.", {}),
mcq("semi-5", "M", "Why are static CMOS gates naturally inverting?", ["NMOS pull low when inputs are high, PMOS pull high when inputs are low", "Because of the body effect", "To save power", "Because of the clock"], 0, "A non-inverting function needs an extra inverter stage.", {}),
mcq("semi-5", "M", "A 2-input NAND sized for the same pull-down strength as an inverter with NMOS width W uses NMOS of width...", ["2W each", "W each", "W/2 each", "4W each"], 0, "Two series devices double resistance, so each is made twice as wide.", {}),
mcq("semi-5", "M", "A transmission gate is preferred over a single NMOS pass transistor because it...", ["Passes both strong 0 and strong 1", "Uses fewer transistors", "Is faster to turn on only", "Needs no control signal"], 0, "NMOS passes a weak 1, PMOS passes a weak 0; together both levels are full swing.", {}),
mcq("semi-5", "E", "A tri-state buffer's third state is...", ["High impedance (disconnected)", "Logic 0.5", "Always 1", "Short circuit"], 0, "Used so several drivers can share a bus.", {}),
con("semi-5", "H", "Draw (describe) the CMOS circuit for Y = (A·B + C·D)'.", "Pull-down network: NMOS A in series with B, and NMOS C in series with D, with those two series branches in parallel between Y and ground. Pull-up network (dual): PMOS A in parallel with B, in series with PMOS C in parallel with D, between VDD and Y. Total 8 transistors, an AND-OR-INVERT (AOI22) gate.", [["series AB / CD in pull-down", "series"], ["parallel branches", "parallel"], ["PMOS dual network", "pmos|dual|pull.?up"], ["8 transistors / AOI", "\\b8\\b|eight|aoi"]]),

/* ---------------- semi-6 behaviour ---------------- */
num("semi-6", "E", "VOH = 3.3 V, VIH = 2.0 V. High noise margin NMH (V)?", 3.3 - 2.0, "V", "NMH = VOH − VIH = 1.3 V.", {}),
num("semi-6", "E", "VIL = 1.2 V, VOL = 0.3 V. Low noise margin NML (V)?", 1.2 - 0.3, "V", "NML = VIL − VOL = 0.9 V.", {}),
num("semi-6", "E", "tpHL = 45 ps and tpLH = 65 ps. Average propagation delay (ps)?", (45 + 65) / 2, "ps", "tp = (tpHL + tpLH)/2 = 55 ps.", {}),
num("semi-6", "M", "A gate drives 30 fF with an effective resistance of 4 kΩ. Approximate delay 0.69RC (ps)?", 0.69 * 4e3 * 30e-15 * 1e12, "ps", `0.69 × 4 kΩ × 30 fF = ${r(0.69 * 4e3 * 30e-15 * 1e12)} ps.`, {}),
num("semi-6", "M", "An inverter's delay is 20 ps per fan-out of 1. Roughly what delay at fan-out 4 if delay grows linearly with load (ps)?", 80, "ps", "Linear load model: 4 × 20 ps = 80 ps (real gates add a fixed parasitic part).", {}),
mcq("semi-6", "M", "Why is a long chain of high fan-in gates avoided?", ["Series transistor stacks get slow (delay grows roughly with the square of fan-in)", "It uses too little area", "It increases noise margin too much", "It needs two clocks"], 0, "Both resistance and capacitance grow with the stack.", {}),
mcq("semi-6", "M", "Rise time is commonly measured between...", ["10% and 90% of the swing", "0% and 100%", "50% and 50%", "20% and 80% only for clocks"], 0, "Some libraries use 20-80% or 30-70%, but 10-90% is the classic definition.", {}),
mcq("semi-6", "M", "Why are long on-chip wires broken up with repeaters?", ["Unbuffered wire delay grows with length squared; repeaters make it roughly linear", "To reduce area", "To lower leakage", "For testability"], 0, "Distributed RC: R and C both grow with length.", {}),

/* ---------------- semi-7 power ---------------- */
num("semi-7", "M", "α = 0.15, C = 2 nF (total switched), VDD = 0.9 V, f = 500 MHz. Dynamic power (mW)?", 0.15 * 2e-9 * 0.81 * 500e6 * 1e3, "mW", `P = αCV²f = 0.15 × 2e-9 × 0.81 × 5e8 = ${r(0.15 * 2e-9 * 0.81 * 500e6 * 1e3)} mW.`, {}),
num("semi-7", "M", "Voltage is scaled from 1.1 V to 0.8 V at the same frequency. New dynamic power as a percentage of the old?", (0.8 / 1.1) ** 2 * 100, "%", `(0.8/1.1)² = ${r((0.8 / 1.1) ** 2 * 100)}%.`, { tol: 0.01 }),
num("semi-7", "M", "A chip at 1.0 V and 1 GHz uses 2 W of dynamic power. With DVFS it runs at 0.8 V and 600 MHz. New dynamic power (W)?", 2 * 0.64 * 0.6, "W", "P scales with V²f: 2 × 0.64 × 0.6 = 0.768 W.", {}),
num("semi-7", "E", "Energy to charge and discharge a 10 fF node once at 1 V (fJ)?", 10e-15 * 1 * 1e15, "fJ", "E = C·V² per full cycle = 10 fJ (half stored, half lost in the pull-up; the stored half is lost in the pull-down).", {}),
mcq("semi-7", "M", "Which effect makes leakage a bigger share of power in advanced nodes?", ["Lower threshold voltages and thinner oxides", "Higher supply voltages", "Larger transistors", "Lower temperatures"], 0, "Subthreshold leakage grows exponentially as Vth drops; gate leakage grows as oxide thins.", {}),
mcq("semi-7", "M", "Short-circuit power increases when...", ["Input transition times are slow", "The clock is gated", "VDD is lowered below 2Vth", "Fan-out is reduced"], 0, "Both networks conduct for longer during a slow input edge.", {}),

/* ---------------- vlsi-1 / vlsi-2 Verilog ---------------- */
mcq("vlsi-1", "E", "What value does 4'b1010 >> 1 give?", ["4'b0101", "4'b1101", "4'b0100", "4'b1001"], 0, "Logical shift right inserts 0.", {}),
mcq("vlsi-1", "E", "{2'b10, 3'b011} is...", ["5'b10011", "5'b01110", "3'b011", "5'b11010"], 0, "Concatenation puts the first part in the MSBs.", {}),
mcq("vlsi-1", "M", "For a = 4'b1100, what is ^a (reduction XOR)?", ["0", "1", "4'b0011", "Undefined"], 0, "Two 1s: even parity → 0.", {}),
mcq("vlsi-1", "M", "Which assignment to a wire is legal?", ["assign y = a & b;", "always @(*) y = a & b; (y declared wire)", "y <= a & b; outside any block", "initial y = 1; in synthesizable RTL"], 0, "Wires are driven by continuous assignments or module outputs.", {}),
mcq("vlsi-1", "M", "In Verilog, 4'd9 + 4'd9 assigned to a 4-bit wire gives...", ["4'd2", "4'd18", "4'd0", "4'd15"], 0, "18 mod 16 = 2; the carry is lost.", {}),
mcq("vlsi-1", "M", "What is the result of 3'b101 == 3'b1x1 in simulation?", ["x", "1", "0", "z"], 0, "== returns x when a compared bit is unknown; === would return 0.", { hint: "Logical equality with unknowns." }),
mcq("vlsi-2", "M", "always @(*) begin if (en) y = a; end infers...", ["A latch on y", "A flip-flop", "Pure combinational logic", "A tri-state buffer"], 0, "When en = 0, y must hold its value.", {}),
mcq("vlsi-2", "M", "A case statement without default whose items cover only 3 of 4 select values, inside always @(*), infers...", ["A latch", "A mux with X output", "A flip-flop", "Nothing"], 0, "The uncovered value requires memory.", {}),
mcq("vlsi-2", "M", "assign y = sel ? a : b; synthesises to...", ["A 2:1 multiplexer", "A latch", "A flip-flop", "A decoder"], 0, "The ternary operator is a mux.", {}),
mcq("vlsi-2", "H", "if-else if chains synthesise to priority logic. A case statement with mutually exclusive items synthesises to...", ["A parallel mux (no priority needed)", "A priority chain always", "Latches", "A ROM"], 0, "Exclusive conditions allow a balanced mux; 'unique case' tells tools they are exclusive.", {}),
con("vlsi-2", "M", "What is the difference between wire and reg in Verilog?", "wire models a connection driven continuously by an assign statement or a module output; it cannot hold a value on its own. reg is a variable assigned inside procedural blocks (always/initial) and keeps its value until assigned again. A reg does not necessarily become a flip-flop: in a combinational always @(*) block with complete assignments it becomes logic. SystemVerilog's logic replaces both for most uses.", [["wire = continuous / assign", "continuous|assign|connection"], ["reg = procedural", "procedural|always|initial"], ["reg not always a flop", "not (always|necessarily)|combinational"], ["logic in SV", "logic"]]),

/* ---------------- vlsi-3 sequential RTL ---------------- */
mcq("vlsi-3", "M", "always @(posedge clk) begin a <= b; b <= a; end does what?", ["Swaps a and b every clock", "Copies b into both", "Creates a latch", "Nothing"], 0, "Non-blocking assignments read old values, so the registers swap.", {}),
mcq("vlsi-3", "M", "always @(posedge clk) begin a = b; b = a; end does what?", ["Both end up with the old b", "Swaps a and b", "Both end up with old a", "Infinite loop"], 0, "Blocking: a gets b, then b gets the new a (= old b).", {}),
mcq("vlsi-3", "M", "Which reset style requires the clock to be running for reset to take effect?", ["Synchronous reset", "Asynchronous reset", "Both", "Neither"], 0, "A synchronous reset is just a data input sampled at the clock edge.", {}),
mcq("vlsi-3", "H", "Why should asynchronous reset be de-asserted synchronously?", ["If release happens near a clock edge, flops can go metastable or leave reset in different cycles", "To reduce area", "To save power", "Because synthesis requires it"], 0, "A reset synchronizer releases reset aligned to the clock.", {}),
num("vlsi-3", "M", "How many flip-flops does this infer? always @(posedge clk) begin q1 <= d; q2 <= q1; q3 <= q2; end", 3, "", "Three registers in a shift chain.", {}),
mcq("vlsi-3", "M", "A clock divider by 2 can be written as...", ["always @(posedge clk) clk_out <= ~clk_out;", "assign clk_out = clk / 2;", "always @(*) clk_out = ~clk;", "assign clk_out = clk >> 1;"], 0, "A toggle flip-flop halves the frequency. In practice prefer a clock enable.", {}),
con("vlsi-3", "H", "Write (in words) a parameterised synchronous FIFO's full and empty logic using an extra pointer bit.", "Use read and write pointers with one more bit than the address width. Both start at 0. Write increments wr_ptr when not full, read increments rd_ptr when not empty. Empty when wr_ptr == rd_ptr (all bits). Full when the address bits are equal but the extra MSBs differ, meaning the writer has wrapped around once more than the reader. Memory is indexed by the lower address bits.", [["extra pointer bit", "extra|one more|msb|wrap"], ["empty: pointers equal", "empty.{0,40}equal|equal.{0,40}empty"], ["full: MSB differs", "full.{0,60}(differ|msb|wrap)"], ["guard push/pop", "not full|not empty|!full|!empty"]]),

/* ---------------- vlsi-4 verification ---------------- */
mcq("vlsi-4", "E", "always #5 clk = ~clk; with `timescale 1ns/1ps gives a clock of...", ["100 MHz", "200 MHz", "50 MHz", "5 MHz"], 0, "Period 10 ns.", {}),
mcq("vlsi-4", "M", "Which is the strongest sign that a testbench is good?", ["It checks results automatically against expected values", "It prints many messages", "It runs fast", "It only uses directed tests"], 0, "Self-checking testbenches scale to regressions.", {}),
mcq("vlsi-4", "M", "$monitor vs $display:", ["$monitor prints whenever its arguments change; $display prints once", "They are identical", "$display is continuous", "$monitor only works in synthesis"], 0, "", {}),
mcq("vlsi-4", "M", "To avoid races between testbench and DUT, testbench inputs are best changed...", ["Away from the active clock edge (e.g. on the falling edge) or with non-blocking assignments", "Exactly at the rising edge with blocking assignments", "Using #0 delays", "Inside the DUT"], 0, "Clocking blocks in SystemVerilog formalise this.", {}),

/* ---------------- vlsi-5 CDC ---------------- */
mcq("vlsi-5", "M", "What is the safest way to pass a multi-bit counter value between asynchronous clocks?", ["Gray-code it, then synchronise with 2 flops per bit", "2-flop sync each binary bit", "Pass it directly", "Use a faster clock"], 0, "Only one bit changes per step, so the sampled value is old or new.", {}),
mcq("vlsi-5", "M", "In an asynchronous FIFO, the write pointer is synchronised into...", ["The read clock domain, to generate empty", "The write domain, to generate empty", "Both domains equally", "Neither"], 0, "Empty is computed in the read domain using the synchronised write pointer; full in the write domain using the synchronised read pointer.", {}),
mcq("vlsi-5", "H", "Why are full and empty in an async FIFO 'pessimistic'?", ["They use pointers that are a couple of cycles old, so the FIFO may report full/empty slightly early, which is safe", "They are often wrong", "They ignore wrap-around", "They are computed combinationally"], 0, "The synchroniser delay only makes the flags conservative.", {}),
num("vlsi-5", "H", "MTBF = e^(t/τ)/(T0·fclk·fdata). If each extra flop adds 1 ns of resolution time and τ = 50 ps, by what factor does MTBF improve per extra flop (as a power of 10)?", Math.log10(Math.exp(1e-9 / 50e-12)), "×10^", `e^(1 ns / 50 ps) = e^20 ≈ 10^${r(Math.log10(Math.exp(20)), 3)}.`, { tol: 0.02, hint: "Compute e^(t/τ) and take log10." }),

/* ---------------- vlsi-6 / vlsi-7 physical and STA ---------------- */
num("vlsi-7", "E", "Data arrival 3.7 ns, data required 3.5 ns. Setup slack (ns)?", 3.5 - 3.7, "ns", "Slack = required − arrival = −0.2 ns (violation).", {}),
num("vlsi-7", "M", "Clock period 2 ns, launch clock latency 0.3 ns, capture clock latency 0.5 ns, tcq 0.1 ns, logic 1.6 ns, setup 0.1 ns. Setup slack (ns)?", (2 + 0.5 - 0.1) - (0.3 + 0.1 + 1.6), "ns", "Required = 2 + 0.5 − 0.1 = 2.4 ns; arrival = 0.3 + 0.1 + 1.6 = 2.0 ns; slack = +0.4 ns.", {}),
mcq("vlsi-7", "M", "STA checks timing...", ["On all paths without needing test vectors", "Only on paths exercised in simulation", "Only at the typical corner", "Only for clocks"], 0, "It is exhaustive and vector-free but checks timing, not function.", {}),
mcq("vlsi-7", "M", "A path from a register in a 'test mode only' mux input to functional logic, never active in mission mode, is best handled as...", ["A false path in functional-mode constraints", "A multicycle path", "Ignored by deleting it", "A generated clock"], 0, "Exclude it in the mode where it cannot happen.", {}),
mcq("vlsi-7", "M", "With set_multicycle_path -setup 2, the default hold check moves to...", ["One cycle later too, so usually set_multicycle_path -hold 1 is added", "It does not change", "Two cycles earlier", "It is removed"], 0, "Without the hold adjustment the hold check becomes overly strict.", {}),
mcq("vlsi-6", "E", "Which step follows placement in the physical design flow?", ["Clock tree synthesis", "Floorplanning", "Synthesis", "RTL coding"], 0, "Floorplan → place → CTS → route.", {}),
mcq("vlsi-6", "M", "What does OCV (on-chip variation) derating do?", ["Makes launch and capture paths pessimistic in opposite directions to cover variation on the same die", "Changes the supply voltage", "Removes skew", "Adds test points"], 0, "", {}),

/* ---------------- sv ---------------- */
mcq("sv-1", "E", "SystemVerilog 'logic' can be used where Verilog used...", ["Both wire and reg (single driver)", "Only wire", "Only parameters", "Only in testbenches"], 0, "Multiple drivers still need a net type (wire/tri).", {}),
mcq("sv-1", "M", "What does always_comb add compared with always @(*)?", ["Tool checks that the block is combinational (no latches) and sensitivity to functions it calls", "Faster simulation only", "A clock", "Nothing"], 0, "It also runs once at time zero.", {}),
mcq("sv-1", "M", "randc differs from rand in that randc...", ["Cycles through all values before repeating", "Is faster", "Allows constraints only", "Is not random"], 0, "Random-cyclic: a permutation of the range.", {}),
mcq("sv-1", "M", "A 'unique case' tells synthesis and simulation that...", ["Exactly one item matches, so items can be evaluated in parallel; violations warn in simulation", "There is a default", "The case is full and priority encoded", "It must be one-hot"], 0, "", {}),
mcq("sv-1", "M", "Which construct groups bus signals and directions for reuse between DUT and testbench?", ["interface with modports", "package", "class", "program block"], 0, "", {}),
mcq("sv-2", "M", "req |=> gnt means...", ["If req is true, gnt must be true in the next cycle", "gnt must be true in the same cycle", "req and gnt are equal", "gnt implies req"], 0, "|=> is non-overlapping implication.", {}),
mcq("sv-2", "M", "Which property checks that ack arrives 1 to 3 cycles after req?", ["req |-> ##[1:3] ack", "req |-> ack[*3]", "req ##3 ack", "ack |-> req"], 0, "", {}),
mcq("sv-2", "M", "Code coverage at 100% but functional coverage at 60% means...", ["Every line ran, but many specified scenarios were never exercised", "The design is fully verified", "The testbench has syntax errors", "Coverage tools disagree, ignore it"], 0, "Code coverage measures what code ran, not whether all features and corner cases were tested.", {}),
mcq("sv-2", "M", "Why do most concurrent assertions include 'disable iff (!rst_n)'?", ["To avoid false failures while the design is in reset", "To speed up simulation", "To enable coverage", "To make them synthesizable"], 0, "", {}),
mcq("sv-3", "E", "In UVM, which component converts transactions into pin wiggles?", ["Driver", "Monitor", "Scoreboard", "Sequencer"], 0, "", {}),
mcq("sv-3", "E", "Which component observes the DUT pins and produces transactions?", ["Monitor", "Driver", "Sequence", "Test"], 0, "", {}),
mcq("sv-3", "M", "What keeps the UVM run phase alive?", ["Raised objections", "The clock", "The scoreboard", "The factory"], 0, "The phase ends when all objections are dropped.", {}),
mcq("sv-3", "M", "A passive agent contains...", ["Only a monitor (no driver or sequencer)", "Only a driver", "Driver and sequencer", "A scoreboard"], 0, "Used to observe interfaces driven by something else.", {}),
con("sv-3", "M", "What is the UVM factory used for?", "The factory creates components and objects by type through create() instead of new(), so a test can override a type (for example replace a normal driver or sequence item with an error-injecting one) globally or for a specific instance path, without editing the environment code. It makes testbenches reusable and configurable.", [["create() instead of new", "create|new"], ["type overrides", "override"], ["no code change / reuse", "without (changing|editing)|reus|configur"]]),

/* ---------------- syn ---------------- */
mcq("syn-1", "E", "The three main inputs to logic synthesis are...", ["RTL, a cell library and constraints", "GDSII, SPEF and LEF", "Netlist, DEF and testbench", "C code, linker script and makefile"], 0, "", {}),
mcq("syn-1", "M", "A 10 ns combinational path must run at 250 MHz. Minimum pipeline stages if it splits evenly (ignore flop overhead)?", ["3", "2", "4", "5"], 0, "Each stage must be ≤ 4 ns: 10/4 = 2.5 → 3 stages.", {}),
mcq("syn-1", "M", "Retiming means...", ["Moving registers across combinational logic to balance path delays without changing function", "Changing the clock frequency", "Re-running simulation", "Adding clock gating"], 0, "", {}),
mcq("syn-1", "M", "Why run logical equivalence checking (LEC) after synthesis?", ["To formally prove the netlist implements the same function as the RTL", "To check timing", "To check DRC", "To create test patterns"], 0, "", {}),
mcq("syn-2", "E", "create_clock -period 4 [get_ports clk] defines a clock of...", ["250 MHz", "4 MHz", "400 MHz", "25 MHz"], 0, "1/4 ns = 250 MHz.", {}),
num("syn-2", "M", "Clock period 10 ns. The external chip uses 3.5 ns of the cycle before data reaches your input. Input delay to set (ns)?", 3.5, "ns", "set_input_delay 3.5 -clock clk [get_ports din]; your logic has 10 − 3.5 = 6.5 ns minus setup.", {}),
mcq("syn-2", "M", "Clock uncertainty in pre-CTS constraints models...", ["Expected jitter and skew that the clock tree will introduce", "Hold time", "Wire delay", "Leakage"], 0, "", {}),
mcq("syn-2", "M", "Between two truly asynchronous clocks with proper synchronisers, the usual constraint is...", ["set_clock_groups -asynchronous (or false paths)", "set_multicycle_path 2", "No constraint", "A generated clock"], 0, "", {}),

/* ---------------- lp / mem / pd / dft / eda ---------------- */
mcq("lp-1", "M", "Why does an integrated clock-gating cell use a latch?", ["To hold the enable stable while the clock is high so the gated clock cannot glitch", "To save area", "To divide the clock", "To add delay"], 0, "", {}),
mcq("lp-1", "M", "Isolation cells are needed when...", ["A powered-down domain drives a powered-on domain", "Two domains share a voltage", "A clock is gated", "Scan is enabled"], 0, "They clamp floating outputs to known values.", {}),
mcq("lp-1", "M", "Retention registers allow...", ["Keeping state while the main supply of a block is switched off", "Faster clocks", "Lower dynamic power only", "Removing level shifters"], 0, "", {}),
mcq("lp-1", "M", "Level shifters are required where...", ["Signals cross between domains at different voltages", "Clocks are gated", "Memories are used", "Flops are scanned"], 0, "", {}),
mcq("lp-1", "M", "The file format that captures power intent (domains, switches, isolation) is...", ["UPF", "SDC", "SPEF", "LEF"], 0, "Unified Power Format (IEEE 1801).", {}),
num("mem-1", "M", "How many check bits does a SECDED Hamming code need for 32 data bits?", 7, "bits", "Hamming needs r with 2^r ≥ m + r + 1 → r = 6 for 32 bits, plus 1 overall parity for double-error detection = 7.", {}),
num("mem-1", "M", "A 1 Mb SRAM organised as a square array: how many rows (word lines)?", Math.sqrt(2 ** 20), "", "√(2^20) = 1024 rows × 1024 columns.", {}),
mcq("mem-1", "M", "SRAM read uses a sense amplifier because...", ["Bit lines have high capacitance; detecting a small difference is much faster than waiting for full swing", "Cells are too strong", "It refreshes the cell", "It is needed for writes only"], 0, "", {}),
mcq("mem-1", "M", "A read-stability failure in a 6T SRAM cell means...", ["The cell flips its stored value during a read", "The cell cannot be written", "The bit line never discharges", "The word line is stuck"], 0, "The pull-down must be stronger than the access transistor (cell ratio).", {}),
mcq("pd-1", "M", "Hold violations often get worse after CTS because...", ["Real clock skew appears and some capture clocks arrive late", "Logic gets slower", "Wires get shorter", "Setup is fixed"], 0, "", {}),
mcq("pd-1", "M", "Typical fix for routing congestion in a region:", ["Spread cells (lower local density), use placement blockages, re-floorplan macros", "Increase clock frequency", "Add more scan chains", "Remove decoupling capacitors"], 0, "", {}),
mcq("pd-1", "E", "What is utilisation in floorplanning?", ["Fraction of core area occupied by cells", "Number of metal layers", "Clock frequency", "Power per area"], 0, "", {}),
mcq("pd-2", "M", "An antenna violation happens when...", ["A long metal wire connected to a gate collects charge during fabrication and can damage the gate oxide", "Two wires are too close", "A net has no driver", "The die is too large"], 0, "Fixed with diodes or layer jumping.", {}),
mcq("pd-2", "M", "LVS compares...", ["The layout's extracted netlist with the schematic/netlist", "Timing with constraints", "Spacing rules", "Power with budget"], 0, "", {}),
mcq("pd-2", "M", "Crosstalk can increase a victim net's delay when...", ["An aggressor switches in the opposite direction at the same time", "Aggressor is quiet", "The net is shielded", "The clock is slow"], 0, "Coupling capacitance effectively doubles (Miller effect).", {}),
num("dft-1", "E", "How many single stuck-at faults exist on the pins of a 2-input NAND gate (2 inputs + 1 output)?", 6, "", "Each of the 3 pins can be stuck-at-0 or stuck-at-1.", {}),
mcq("dft-1", "M", "In scan mode, flip-flops are connected as...", ["A shift register (scan chain)", "A counter", "Independent latches", "A ring oscillator"], 0, "", {}),
mcq("dft-1", "M", "Memory BIST commonly uses...", ["March algorithms writing and reading patterns in address order", "Scan chains", "Random logic only", "JTAG only"], 0, "", {}),
mcq("dft-1", "M", "JTAG boundary scan is mainly used for...", ["Testing board-level interconnect and accessing on-chip debug/test", "Measuring power", "Clock generation", "Placing cells"], 0, "", {}),
num("dft-1", "M", "A design has 20,000 modelled faults and the patterns detect 19,400. Fault coverage (%)?", 19400 / 20000 * 100, "%", "19400/20000 = 97%.", {}),
mcq("eda-1", "M", "Verilator differs from event-driven simulators because it...", ["Compiles RTL into cycle-based C++ and is very fast, but does not model delays or 4-state X well", "Is a waveform viewer", "Does synthesis", "Only reads VHDL"], 0, "", {}),
mcq("eda-1", "E", "A LEF file describes...", ["Cell and macro abstracts (size, pins, blockages) and technology layers", "Timing arcs", "Netlist connectivity", "Power intent"], 0, "Timing is in .lib; connectivity in the netlist; power intent in UPF.", {}),
mcq("eda-1", "E", "Which language is used for scripting most EDA tools?", ["Tcl", "COBOL", "Lisp only", "Bash only"], 0, "", {}),
];
