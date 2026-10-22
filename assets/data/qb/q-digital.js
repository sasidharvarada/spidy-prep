import { mcq, num, con, r } from "./helpers.js";
// Digital Electronics question bank (original).
const bin = (n, w) => n.toString(2).padStart(w, "0");
const tc = (n, w) => ((n % (1 << w)) + (1 << w)) % (1 << w);
export const Q_DIGITAL = [
/* ---------------- de-1 number systems ---------------- */
num("de-1", "E", "Convert binary 1101 0110 to decimal.", 0b11010110, "", `Weights 128+64+16+4+2 = ${0b11010110}.`, { hint: "Add the place values of the 1 bits." }),
mcq("de-1", "E", "Hex value of binary 1011 1110?", ["0xBE", "0xEB", "0xBD", "0x7E"], 0, "Split into nibbles from the right: 1011 = B, 1110 = E.", { hint: "Group 4 bits per hex digit." }),
num("de-1", "E", "Decimal value of octal 157?", 1 * 64 + 5 * 8 + 7, "", "1×64 + 5×8 + 7 = 111.", { hint: "Octal digit weights are 64, 8, 1." }),
mcq("de-1", "E", `8-bit two's complement of −20?`, [`0x${tc(-20, 8).toString(16).toUpperCase()}`, "0x94", "0xEB", "0x14"], 0, `20 = ${bin(20, 8)}. Invert: ${bin(255 - 20, 8)}. Add 1: ${bin(tc(-20, 8), 8)} = 0x${tc(-20, 8).toString(16).toUpperCase()}.`, { hint: "Invert all bits of +20 and add 1." }),
num("de-1", "M", "What decimal value does the 8-bit two's complement pattern 1001 0110 represent?", 0b10010110 - 256, "", `As unsigned it is ${0b10010110}; the MSB weight is −128, so the value is ${0b10010110} − 256 = ${0b10010110 - 256}.`, { hint: "Subtract 256 when the MSB is 1." }),
mcq("de-1", "M", "Range of a 6-bit two's complement number?", ["−32 to +31", "−31 to +31", "−32 to +32", "0 to 63"], 0, "−2^(n−1) to 2^(n−1) − 1 = −32 to 31.", { hint: "One more negative value than positive." }),
mcq("de-1", "M", "In 4-bit two's complement, 0110 + 0011 = ?", ["1001, signed overflow", "1001, no overflow", "0101", "1001 with carry out"], 0, "6 + 3 = 9 > 7. Two positives gave a pattern with MSB 1 (−7), so signed overflow; no carry out of the MSB.", { hint: "Check the sign of the result against the inputs." }),
mcq("de-1", "E", "Gray code of binary 1011?", ["1110", "1101", "1001", "0111"], 0, "g = b ^ (b >> 1) = 1011 ^ 0101 = 1110.", { hint: "XOR each bit with the bit to its left." }),
mcq("de-1", "M", "Binary value of Gray code 1101?", ["1001", "1011", "1100", "0110"], 0, "b3 = g3 = 1; b2 = b3^g2 = 0; b1 = b2^g1 = 0; b0 = b1^g0 = 1 → 1001.", { hint: "Each binary bit = previous binary bit XOR current Gray bit." }),
num("de-1", "E", "How many bits are needed to represent the unsigned decimal number 1000?", Math.ceil(Math.log2(1001)), "", "2^9 = 512 < 1000 < 1024 = 2^10, so 10 bits.", { hint: "Find the smallest n with 2^n > 1000." }),
mcq("de-1", "E", "BCD code of decimal 47?", ["0100 0111", "0010 1111", "0100 1001", "0111 0100"], 0, "Each digit separately: 4 = 0100, 7 = 0111.", { hint: "Encode each decimal digit in 4 bits." }),
mcq("de-1", "M", "Sign-extend the 4-bit value 1010 to 8 bits.", ["1111 1010", "0000 1010", "1000 1010", "1010 0000"], 0, "Copy the sign bit (1) into the new upper bits.", { hint: "Copy the MSB." }),
num("de-1", "M", "IEEE 754 single precision: how many bits are in the exponent field?", 8, "bits", "Single precision = 1 sign + 8 exponent + 23 fraction bits.", { hint: "32 = 1 + ? + 23" }),
con("de-1", "M", "Why do computers use two's complement for signed numbers instead of sign-magnitude?", "Two's complement has a single representation of zero and lets the same binary adder handle signed and unsigned addition and subtraction (A − B = A + ~B + 1), so no special sign logic is needed. Sign-magnitude has +0 and −0 and needs separate logic to compare signs and subtract magnitudes.", [["one zero", "one zero|single zero|two zeros|\\+0|-0"], ["same adder", "same adder|adder|hardware"], ["subtraction trick", "invert|~|\\+ ?1|plus one"]]),

/* ---------------- de-2 gates ---------------- */
mcq("de-2", "E", "Which gate gives 1 only when its two inputs differ?", ["XOR", "XNOR", "NAND", "OR"], 0, "XOR is the inequality detector.", {}),
mcq("de-2", "E", "A 3-input NOR gate outputs 1 for how many of the 8 input combinations?", ["1", "3", "7", "4"], 0, "NOR is 1 only when all inputs are 0.", {}),
mcq("de-2", "E", "Which is NOT a universal gate?", ["XOR", "NAND", "NOR", "All are universal"], 0, "XOR cannot make AND or OR on its own (it is linear over GF(2)).", { hint: "Can you build a NOT and an AND from it alone?" }),
mcq("de-2", "M", "An XOR gate with one input tied to 1 behaves as a...", ["NOT gate", "Buffer", "Constant 0", "Constant 1"], 0, "A ⊕ 1 = A'. This is how XOR implements controlled inversion (e.g. in an adder-subtractor).", {}),
num("de-2", "M", "Minimum number of 2-input NAND gates needed for a 2-input OR?", 3, "gates", "OR = NAND(NOT A, NOT B): two NANDs as inverters plus one NAND.", { hint: "De Morgan." }),
num("de-2", "M", "Minimum number of 2-input NOR gates needed for a 2-input AND?", 3, "gates", "AND = NOR(NOT A, NOT B): two NOR inverters plus one NOR.", { hint: "The dual of the NAND-OR result." }),
mcq("de-2", "M", "An 8-input XOR outputs 1 when...", ["An odd number of inputs are 1", "All inputs are 1", "Exactly one input is 1", "An even number of inputs are 1"], 0, "Multi-input XOR is the odd-parity function.", {}),
mcq("de-2", "E", "TTL vs CMOS: CMOS logic is preferred mainly because of...", ["Very low static power", "Higher speed at all times", "Lower cost of resistors", "It needs no supply"], 0, "Static CMOS draws almost no current except while switching.", {}),
con("de-2", "E", "Explain fan-in and fan-out.", "Fan-in is the number of inputs a gate has. Fan-out is the number of gate inputs that one output can drive while still meeting voltage levels and timing. Larger fan-in makes series transistor stacks slower; larger fan-out adds load capacitance and delay, so designers limit it or add buffers.", [["fan-in = inputs", "fan.?in.{0,40}input"], ["fan-out = loads driven", "fan.?out.{0,40}(drive|load|connected)"], ["delay effect", "delay|slow|capacit"]]),

/* ---------------- de-3 boolean algebra ---------------- */
mcq("de-3", "E", "Simplify A·B + A·B'.", ["A", "B", "1", "AB"], 0, "A(B + B') = A·1 = A.", {}),
mcq("de-3", "E", "Simplify (A + B)(A + B').", ["A", "B", "A + B", "1"], 0, "= A + BB' = A + 0 = A (distributive law, dual form).", {}),
mcq("de-3", "M", "Simplify A'B'C + A'BC + AB'C + ABC.", ["C", "A + C", "BC", "A'C"], 0, "All four terms contain C and cover every combination of A, B, so F = C.", {}),
mcq("de-3", "M", "Complement of F = A·(B + C') using De Morgan?", ["A' + B'·C", "A' · B'C", "A + B'C", "A'B + C"], 0, "F' = A' + (B + C')' = A' + B'·C.", { hint: "Break the bar, change the operator." }),
mcq("de-3", "M", "Which term is redundant in AB + A'C + BC?", ["BC", "AB", "A'C", "None"], 0, "Consensus theorem: BC is covered by AB + A'C.", {}),
mcq("de-3", "M", "Write F(A,B,C) = Σm(0, 3, 5, 6) as a product of maxterms.", ["ΠM(1, 2, 4, 7)", "ΠM(0, 3, 5, 6)", "ΠM(1, 2, 4)", "ΠM(2, 4, 7)"], 0, "The maxterms are the minterm numbers not in the list.", {}),
mcq("de-3", "H", "F = Σm(0, 3, 5, 6) for 3 variables is the same as...", ["A ⊕ B ⊕ C complemented (even parity)", "A ⊕ B ⊕ C", "AB + C", "A + B + C"], 0, "Minterms 0 (000), 3 (011), 5 (101), 6 (110) all have an even number of 1s: XNOR of three variables.", { hint: "Count the 1s in each minterm." }),
num("de-3", "M", "How many distinct Boolean functions of 3 variables exist?", 2 ** (2 ** 3), "", "Each of the 2^3 = 8 rows of the truth table can be 0 or 1: 2^8 = 256.", { hint: "Count possible truth tables." }),
con("de-3", "M", "State and explain De Morgan's theorems with a circuit example.", "(A·B)' = A' + B' and (A + B)' = A'·B'. A NAND gate is equivalent to an OR gate with inverted inputs, and a NOR is an AND with inverted inputs. This lets you convert AND-OR logic into NAND-NAND logic, which is how two-level logic is usually built in CMOS.", [["NAND = OR of complements", "a'? ?\\+ ?b'|or.{0,20}invert|or of"], ["NOR = AND of complements", "a'b'|and.{0,20}invert|and of"], ["NAND-NAND conversion", "nand.?nand|bubble|convert"]]),

/* ---------------- de-4 K-maps ---------------- */
mcq("de-4", "M", "Minimise F(A,B,C) = Σm(1, 3, 5, 7).", ["C", "A + C", "BC", "A'C + AC"], 0, "All odd minterms: one group of four where C = 1.", {}),
mcq("de-4", "M", "Minimise F(A,B,C) = Σm(2, 3, 6, 7).", ["B", "A + B", "AB", "B'"], 0, "Cells with B = 1 form one group of four.", {}),
mcq("de-4", "M", "Minimise F(A,B,C,D) = Σm(0, 2, 8, 10).", ["B'D'", "A'D'", "B'C'", "AB'"], 0, "The four corners of a 4-variable map are adjacent: B = 0 and D = 0.", { hint: "Corners wrap around." }),
mcq("de-4", "M", "Minimise F(A,B,C,D) = Σm(5, 7, 13, 15).", ["BD", "AB", "CD", "BC"], 0, "Those cells share B = 1 and D = 1.", {}),
mcq("de-4", "H", "Minimise F(A,B,C,D) = Σm(1, 3, 7, 11, 15) with don't cares d(0, 2, 5).", ["A'B' + CD", "A'D + CD", "CD", "A'B'D + CD"], 0, "Using d(0,2): A'B' covers 0,1,2,3. CD covers 3,7,11,15. (A'D + CD is another equally small answer using d(5).)", { hint: "Use don't cares only when they enlarge a group." }),
mcq("de-4", "E", "Why are K-map rows and columns ordered 00, 01, 11, 10?", ["So adjacent cells differ in exactly one variable", "Binary counting order", "It is arbitrary", "To save space"], 0, "Gray-code order makes physical adjacency equal logical adjacency.", {}),
mcq("de-4", "M", "In a K-map, a group of 8 cells in a 4-variable map eliminates how many variables?", ["3", "2", "1", "4"], 0, "2^3 = 8, so three variables change inside the group and drop out, leaving one literal.", {}),
mcq("de-4", "H", "F = AB + A'C has a static-1 hazard when B = C = 1 and A changes. The fix is to add...", ["BC", "AC", "A'B", "ABC'"], 0, "The consensus term BC stays 1 during the transition.", {}),
num("de-4", "M", "How many prime implicants does F(A,B,C) = Σm(0,1,2,5,6,7) have?", 6, "", "A'B', A'C', B'C, BC', AC, AB - six prime implicants arranged in a ring, and two different minimal covers of three terms exist.", { hint: "List every maximal group of 2." }),
con("de-4", "M", "What are don't-care conditions and how are they used in minimisation?", "Don't cares are input combinations that never occur or whose output does not matter, such as BCD codes 10-15. In a K-map they are marked X and can be treated as 1 when that makes a group larger (fewer literals), or as 0 otherwise. They must not be grouped on their own.", [["never occur / doesn't matter", "never|not (occur|matter)|unused"], ["treat as 1 or 0", "1 or 0|either|as 1"], ["bigger groups", "large|bigger|fewer"]]),

/* ---------------- de-5 combinational ---------------- */
num("de-5", "E", "How many select lines does a 32:1 multiplexer need?", 5, "", "log2(32) = 5.", {}),
num("de-5", "M", "How many 4:1 multiplexers are needed to build a 16:1 multiplexer?", 5, "", "4 muxes in the first level pick within groups of 4; one more picks among their outputs.", { hint: "Build a two-level tree." }),
num("de-5", "M", "How many 2-to-4 decoders (with enable) are needed to build a 4-to-16 decoder?", 5, "", "Four decoders give the 16 outputs; a fifth decodes the two MSBs to enable one of them.", {}),
mcq("de-5", "M", "A full adder can be built from a 3-to-8 decoder plus...", ["Two OR gates", "One OR gate", "Two AND gates", "Four XOR gates"], 0, "S = Σm(1,2,4,7) and Cout = Σm(3,5,6,7): OR the matching decoder outputs.", {}),
mcq("de-5", "E", "Half adder outputs are...", ["S = A ⊕ B, C = AB", "S = A + B, C = AB", "S = AB, C = A ⊕ B", "S = A ⊕ B, C = A + B"], 0, "Sum is XOR, carry is AND.", {}),
mcq("de-5", "M", "Full adder carry out equals...", ["AB + Cin(A ⊕ B)", "A ⊕ B ⊕ Cin", "AB + Cin", "(A + B)Cin"], 0, "Carry when both are 1, or when exactly one is 1 and Cin is 1 (equivalently the majority AB + BC + AC).", {}),
num("de-5", "M", "A 16-bit ripple-carry adder uses full adders with 2 ns carry delay. Worst-case carry delay?", 16 * 2, "ns", "The carry may ripple through all 16 stages: 16 × 2 = 32 ns.", {}),
mcq("de-5", "M", "In carry-lookahead logic, generate G and propagate P for bit i are...", ["G = AB, P = A ⊕ B", "G = A ⊕ B, P = AB", "G = A + B, P = AB", "G = A'B, P = AB'"], 0, "A bit generates a carry when both are 1 and propagates an incoming carry when exactly one is 1.", {}),
mcq("de-5", "M", "Write C2 in carry-lookahead form.", ["G1 + P1G0 + P1P0C0", "G1 + G0 + C0", "P1 + G1G0", "G1P1 + C0"], 0, "C2 = G1 + P1·C1 and C1 = G0 + P0·C0.", {}),
mcq("de-5", "E", "A 4-to-2 priority encoder with inputs 0110 (bit 3 to bit 0) outputs...", ["10", "01", "11", "00"], 0, "The highest set bit is bit 2, so the output is 2 = 10.", {}),
mcq("de-5", "M", "How do you turn a 4-bit adder into an adder/subtractor?", ["XOR each B bit with SUB and feed SUB into carry-in", "Invert A when SUB = 1", "Add a second adder", "Swap A and B"], 0, "A − B = A + B' + 1.", {}),
mcq("de-5", "H", "Implement F(A,B,C) = Σm(1, 2, 6, 7) with a 4:1 mux using A, B as selects. Data inputs I0..I3 are...", ["C, C', 0, 1", "C', C, 1, 0", "0, 1, C, C'", "C, 0, C', 1"], 0, "AB = 00: F = 1 only for m1 (C = 1) → C. 01: m2 (C = 0) → C'. 10: none → 0. 11: m6, m7 → 1.", { hint: "For each AB pair, write F as a function of C." }),
mcq("de-5", "M", "A 2-bit comparator's A > B output in terms of A1A0 and B1B0?", ["A1B1' + (A1 ⊙ B1)A0B0'", "A1B1 + A0B0", "A1 ⊕ B1", "A0B0' only"], 0, "A is bigger if its MSB is bigger, or if the MSBs are equal and its LSB is bigger.", {}),
con("de-5", "M", "Explain why a carry-lookahead adder is faster than a ripple-carry adder.", "In a ripple-carry adder each stage waits for the carry from the previous stage, so delay grows linearly with width. A carry-lookahead adder computes generate and propagate for every bit in parallel and derives each carry directly from them and the input carry using two-level logic, so carries do not ripple; in hierarchical form the delay grows roughly with log of the width, at the cost of more gates.", [["ripple waits / linear", "wait|linear|ripple"], ["generate and propagate", "generate|propagate"], ["parallel carries", "parallel|simultaneous|directly"], ["area cost", "area|gates|larger"]]),

/* ---------------- de-6 sequential ---------------- */
mcq("de-6", "E", "A gated D latch with enable = 1 is...", ["Transparent: Q follows D", "Holding its value", "Edge-triggered", "Reset"], 0, "Level-sensitive storage passes D while enabled.", {}),
mcq("de-6", "M", "JK flip-flop with J = K = 1 on a clock edge will...", ["Toggle", "Set", "Reset", "Hold"], 0, "J = K = 1 complements Q.", {}),
mcq("de-6", "M", "Characteristic equation of a JK flip-flop?", ["Q+ = JQ' + K'Q", "Q+ = J + K'Q", "Q+ = J ⊕ K", "Q+ = JK + Q"], 0, "Set when J and Q = 0; keep when K = 0 and Q = 1.", {}),
mcq("de-6", "M", "Convert a JK flip-flop to a D flip-flop:", ["J = D, K = D'", "J = D, K = D", "J = D', K = D", "J = 1, K = D"], 0, "Q+ = DQ' + DQ = D when K = D'.", {}),
mcq("de-6", "M", "Convert a D flip-flop into a T flip-flop:", ["D = T ⊕ Q", "D = T", "D = TQ", "D = T + Q"], 0, "Toggle when T = 1, hold when T = 0.", {}),
mcq("de-6", "M", "Excitation table: a JK flip-flop goes from Q = 0 to Q = 1. Required J, K?", ["J = 1, K = X", "J = X, K = 1", "J = 0, K = X", "J = 1, K = 1 only"], 0, "J must be 1; K can be anything (0 sets, 1 toggles - both give 1).", {}),
num("de-6", "E", "A 4-bit SISO shift register: how many clock pulses to load 4 bits and read them all out serially?", 8, "clocks", "4 clocks to shift in, 4 more to shift out.", {}),
mcq("de-6", "M", "Master-slave D flip-flop: the master latch is transparent when the clock is...", ["Low (for a rising-edge flop)", "High", "Changing", "Never"], 0, "The master follows D while clock is low; at the rising edge the slave opens and the master closes, so Q takes the value present at the edge.", {}),
mcq("de-6", "E", "An SR latch made from NOR gates holds its state when...", ["S = 0, R = 0", "S = 1, R = 1", "S = 1, R = 0", "S = 0, R = 1"], 0, "Both inactive = memory.", {}),
con("de-6", "E", "What is a race-around condition in a JK flip-flop and how is it avoided?", "In a level-triggered JK latch with J = K = 1, the output keeps toggling as long as the clock stays high, because each toggle feeds back to the input; the final state depends on the pulse width. It is avoided with edge triggering or a master-slave structure, so the output can change only once per clock cycle.", [["toggling repeatedly", "toggl|oscillat|repeated"], ["J = K = 1, clock high / level", "j ?= ?k ?= ?1|level|clock (is )?high"], ["fix: edge / master-slave", "edge|master"]]),

/* ---------------- de-7 counters ---------------- */
num("de-7", "E", "Minimum number of flip-flops for a mod-12 counter?", Math.ceil(Math.log2(12)), "", "2^4 = 16 ≥ 12 > 8, so 4.", {}),
num("de-7", "E", "A 5-bit ring counter has how many states?", 5, "", "A ring counter of N flip-flops circulates a single 1: N states.", {}),
num("de-7", "E", "A 5-bit Johnson counter has how many states?", 10, "", "Johnson counters have 2N states.", {}),
num("de-7", "M", "A 4-bit ripple counter uses flip-flops with 8 ns clock-to-Q. Maximum clock frequency so the count settles within one period?", 1e3 / (4 * 8), "MHz", `Worst case the change ripples through all 4 flops: 32 ns, so f ≤ 1/32 ns = ${r(1e3 / 32)} MHz.`, { tol: 0.03 }),
num("de-7", "E", "Clock = 48 MHz. Frequency at the MSB of a 4-bit binary counter?", 48 / 16, "MHz", "Each stage divides by 2: 48 / 2^4 = 3 MHz.", {}),
mcq("de-7", "M", "In a synchronous binary up counter built from T flip-flops, bit 2 toggles when...", ["Q1 = Q0 = 1", "Q1 = 1", "Q0 = 1", "Always"], 0, "Bit i toggles when all lower bits are 1.", {}),
mcq("de-7", "M", "Why are synchronous counters preferred over ripple counters at high speed?", ["All flip-flops switch together, so delays do not accumulate and outputs do not glitch", "They use fewer gates", "They need no clock", "They count down"], 0, "Ripple counters accumulate clock-to-Q delays and show transient wrong values.", {}),
num("de-7", "M", "A maximal-length 6-bit LFSR cycles through how many states?", 2 ** 6 - 1, "", "2^n − 1 = 63 (all-zero is excluded).", {}),
mcq("de-7", "M", "A mod-6 counter made by resetting a 3-bit counter asynchronously when it reaches 6 (110). Problem?", ["State 6 appears briefly as a glitch", "It counts to 7", "It never resets", "It needs 6 flip-flops"], 0, "Asynchronous reset decoding shows 110 for a short time before clearing; synchronous reset at 5 is cleaner.", {}),

/* ---------------- de-8 FSM ---------------- */
mcq("de-8", "E", "In a Moore machine the output depends on...", ["The current state only", "The state and current inputs", "Inputs only", "The next state"], 0, "Moore outputs are a function of state.", {}),
num("de-8", "M", "Minimum flip-flops for a 9-state FSM with binary encoding?", Math.ceil(Math.log2(9)), "", "2^4 = 16 ≥ 9.", {}),
num("de-8", "M", "Flip-flops needed for the same 9-state FSM with one-hot encoding?", 9, "", "One flip-flop per state.", {}),
num("de-8", "M", "Minimum number of states for a Mealy detector of 1101 with overlap?", 4, "", "States for prefixes '', 1, 11, 110; the output fires on the transition from 110 with input 1.", {}),
num("de-8", "M", "Minimum number of states for a Moore detector of 1101 with overlap?", 5, "", "Moore needs one extra state to hold the output after the match.", {}),
mcq("de-8", "M", "After detecting 1101 (overlapping), the Mealy detector should go to the state meaning...", ["'1' seen", "Nothing seen", "'11' seen", "'110' seen"], 0, "The final 1 is the longest suffix that is also a prefix of 1101.", { hint: "Longest proper suffix that is a prefix." }),
mcq("de-8", "H", "Why is one-hot encoding popular in FPGAs?", ["Flip-flops are plentiful and next-state logic becomes small and fast", "It uses fewer flip-flops", "It needs no reset", "It avoids clocks"], 0, "Each state's logic depends on few bits; FPGAs have many registers per LUT.", {}),
con("de-8", "M", "Design approach for an FSM - walk through the steps you follow.", "Read the specification and draw a state diagram, deciding Moore or Mealy. Make a state table with next states and outputs, minimise states if possible, choose an encoding (binary, one-hot, Gray), derive next-state and output equations (K-maps or let synthesis do it), then write RTL with a state register, next-state logic and output logic, including a reset state and a default for unused states, and verify with a testbench covering every transition.", [["state diagram", "diagram"], ["state table", "table"], ["encoding", "encod|one.?hot|binary|gray"], ["RTL structure", "register|next.?state|rtl"], ["reset / default state", "reset|default|unused|illegal"]]),

/* ---------------- de-9 timing ---------------- */
num("de-9", "M", "tcq = 0.4 ns, logic = 2.1 ns, tsetup = 0.3 ns, no skew. Maximum clock frequency in MHz?", 1e3 / (0.4 + 2.1 + 0.3), "MHz", `T = 0.4 + 2.1 + 0.3 = 2.8 ns, f = 1/2.8 ns = ${r(1e3 / 2.8)} MHz.`, { tol: 0.01 }),
num("de-9", "M", "Clock period 5 ns, tcq = 0.5 ns, tsetup = 0.4 ns. Maximum combinational delay allowed between two flops (ns)?", 5 - 0.5 - 0.4, "ns", "T − tcq − tsetup = 4.1 ns.", {}),
num("de-9", "H", "tcq = 0.3 ns, min logic delay = 0.1 ns, thold = 0.25 ns, capture clock arrives 0.3 ns after launch. Hold slack (ns)?", (0.3 + 0.1) - (0.25 + 0.3), "ns", `Arrival = 0.4 ns; required = thold + skew = 0.55 ns; slack = 0.4 − 0.55 = ${r(0.4 - 0.55)} ns → violation.`, { tol: 0.01, hint: "Hold slack = data arrival − (thold + skew)." }),
num("de-9", "H", "tcq = 1 ns, logic = 7 ns, tsetup = 1 ns, and the capture clock arrives 0.5 ns after the launch clock. Minimum clock period (ns)?", 1 + 7 + 1 - 0.5, "ns", "T ≥ tcq + logic + setup − skew = 8.5 ns.", {}),
mcq("de-9", "M", "A design fails hold at 100 MHz. At 50 MHz it will...", ["Still fail hold", "Pass", "Fail setup", "Pass with half the margin"], 0, "Hold timing does not involve the clock period.", {}),
mcq("de-9", "M", "What is the main purpose of a 2-flop synchronizer?", ["Give a metastable first flop time to resolve before the signal is used", "Divide the clock", "Remove glitches from combinational logic", "Fix hold violations"], 0, "It increases MTBF exponentially; it cannot make failure impossible.", {}),
mcq("de-9", "H", "A one-cycle pulse in a 200 MHz domain must reach a 50 MHz domain. A simple 2-flop synchronizer...", ["Can miss the pulse entirely", "Always captures it", "Doubles it", "Is unnecessary"], 0, "The pulse (5 ns) is shorter than the receiving clock period (20 ns). Use a toggle synchronizer or a handshake.", {}),
mcq("de-9", "M", "Recovery and removal times apply to...", ["Asynchronous reset/set de-assertion relative to the clock", "Data inputs", "Clock gating cells", "Scan chains only"], 0, "They are the setup/hold equivalents for async control pins.", {}),
con("de-9", "H", "A design passes setup at the slow corner but fails hold at the fast corner. What do you do?", "Hold fails because the data path is too fast compared with the clock arrival at the capture flop. Insert delay buffers or use slower/higher-Vt cells on the short data paths (or reduce skew at the capture side), checking that the extra delay does not break setup on the same paths. Changing the clock frequency does not help hold.", [["data path too fast", "too fast|short path|fast path"], ["add buffers / delay", "buffer|delay cell|add delay"], ["recheck setup", "setup"], ["frequency doesn't help", "frequen|period"]]),

/* ---------------- de-10 memory ---------------- */
num("de-10", "E", "A memory has 14 address lines and 16 data lines. Capacity in bits?", 2 ** 14 * 16, "bits", "2^14 words × 16 bits = 262144 bits (32 KB).", {}),
num("de-10", "E", "How many address lines does a 2 MB byte-addressable memory need?", 21, "", "2 MB = 2^21 bytes.", {}),
num("de-10", "M", "How many 1K × 4 chips are needed to build a 4K × 8 memory?", (4 * 8) / (1 * 4), "chips", "Capacity ratio: (4K × 8) / (1K × 4) = 8; arranged as 4 rows of 2 chips.", {}),
mcq("de-10", "E", "Which memory loses its data when power is removed?", ["SRAM", "Flash", "EEPROM", "Mask ROM"], 0, "SRAM and DRAM are volatile.", {}),
mcq("de-10", "M", "Why is flash memory erased in blocks?", ["Erasing removes charge from many cells sharing a well, so it is done for whole blocks at once", "To save power", "For security", "Because writes are slow"], 0, "Erase uses high voltage on a shared region; programming can be per page.", {}),
mcq("de-10", "M", "A 6T SRAM cell's two cross-coupled inverters...", ["Hold the bit and its complement", "Act as the sense amplifier", "Refresh the cell", "Drive the word line"], 0, "The access transistors connect them to bit lines when the word line is high.", {}),
];
