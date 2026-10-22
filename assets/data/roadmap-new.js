// New roadmap modules (original). Same format as the tracker study path:
//   ## id | Module title
//   > note line (shown in Learn)        = formula line (formula sheet)
//   - Topic | what to learn | problem 1 ;; problem 2
export const NEW_MODULES = String.raw`
## sv-1 | SystemVerilog for design and verification
> SystemVerilog extends Verilog with better types (logic, enums, structs), intent-revealing blocks (always_comb, always_ff) and, for verification, object-oriented classes, randomization and interfaces.
- logic, enums and structs | logic replaces wire/reg, typedef enum for FSM states, packed structs and unions | Rewrite an FSM using typedef enum logic [1:0] {IDLE, RUN, DONE} state_t;
- always_comb, always_ff, always_latch | Intent-revealing blocks, tool checks, unique and priority case | What warning does always_comb give that always @(*) does not?
- Interfaces and modports | Bundling signals, modports for direction, clocking blocks | Write an interface for a valid/ready bus with master and slave modports.
- Classes and randomization | class, new, rand/randc, constraint blocks, pre/post_randomize | Write a packet class with rand addr[7:0] constrained to 0x10-0x1F.
- Queues, dynamic and associative arrays | $, push_back, foreach, sizes | Store expected values in a queue and pop them in a scoreboard.

## sv-2 | Assertions and functional coverage
> Assertions describe rules that must hold every cycle; coverage proves which scenarios were actually exercised. Together they answer "is it correct?" and "did we test enough?".
= a |-> b : overlapping implication (b checked in the same cycle)
= a |=> b : non-overlapping implication (b checked one cycle later)
= ##[1:3] : delay of 1 to 3 cycles
- Immediate vs concurrent assertions | assert inside procedural code vs assert property sampled on a clock | When is an immediate assertion enough?
- Sequences and implication | ##n delays, |-> and |=>, repetition [*n], $rose/$fell/$stable | Write: every req must get gnt within 1 to 4 cycles.
- disable iff and reset | Turning assertions off during reset | Why do most properties need disable iff (!rst_n)?
- Covergroups and bins | coverpoints, bins, cross coverage, sampling events | Cover all 4 opcodes crossed with zero/non-zero operands.
- Coverage closure | Code vs functional coverage, holes, writing targeted tests | Coverage is 100% but a bug escaped. How is that possible?

## sv-3 | UVM testbench architecture
> UVM is a standard SystemVerilog class library for building reusable testbenches. Freshers are expected to explain the components and how a transaction flows through them.
- Transactions and sequences | uvm_sequence_item, uvm_sequence, body(), start_item/finish_item | Write the flow from a sequence to the DUT pins.
- Driver, monitor, sequencer, agent | Active vs passive agents, virtual interfaces | Why must the monitor not depend on the driver?
- Scoreboard and reference model | Analysis ports, expected vs actual, out-of-order data | How does a scoreboard compare transactions for a FIFO?
- Phases and objections | build, connect, run, report phases; raise/drop objection | What ends the run phase?
- Factory and config DB | type overrides, uvm_config_db set/get | Replace a driver with an error-injecting one without editing the env.

## syn-1 | Logic synthesis
> Synthesis turns RTL into a netlist of standard cells that meets timing, area and power goals under the given constraints. What you write in RTL strongly shapes what hardware you get.
- What synthesis does | Translation, optimisation, technology mapping to a cell library | Name the three inputs to a synthesis tool.
- Coding for synthesis | Latch inference, priority vs parallel logic, resource sharing, operators | Why can a long if-else chain be slower than a case statement?
- Pipelining and retiming | Splitting long paths with registers, latency vs throughput | A 12 ns path must run at 200 MHz. Where do you add registers?
- Area, timing and power trade-offs | Cell sizing, multi-Vt, gate count reports | Read a synthesis report: what do WNS and TNS tell you?
- Equivalence checking | Formal proof that netlist matches RTL | Why run LEC after every netlist change?

## syn-2 | Design constraints (SDC)
> SDC files tell timing tools how the design is clocked and connected to the outside world. Wrong constraints make timing reports meaningless.
= create_clock -period 10 [get_ports clk]  (100 MHz)
= set_input_delay / set_output_delay : time used outside the block
- Clocks and generated clocks | create_clock, create_generated_clock, clock groups | Define a 250 MHz clock and a divide-by-2 generated clock.
- Input and output delays | Budgeting time between chips, virtual clocks | The external device uses 3 ns of a 10 ns cycle. What input delay do you set?
- Uncertainty, latency and transition | Jitter and skew margins, clock latency before CTS | Why add clock uncertainty before the clock tree is built?
- Timing exceptions | set_false_path, set_multicycle_path, set_max_delay | When is a false path dangerous?
- Design rules | max_transition, max_capacitance, max_fanout | Why do slow transitions matter for both timing and power?

## lp-1 | Low-power design
> Power is a first-class design goal: battery life, heat and chip cost all depend on it. Techniques act on activity, capacitance, voltage, frequency or leakage.
= P_dyn = α · C · V² · f
= E = P · t ;  energy per operation ∝ C · V²
- Clock gating | Integrated clock-gating cells, enable conditions, glitch-free gating | Why is clock gating done with a latch plus AND, not a plain AND?
- Power gating | Header/footer switches, isolation cells, retention registers | What goes wrong if an off block's outputs are not isolated?
- Multi-voltage design | Voltage islands, level shifters, DVFS | Where are level shifters needed?
- Multi-Vt and leakage | Low/standard/high Vt cells, leakage vs speed | Which paths should use low-Vt cells?
- UPF power intent | Power domains, supply nets, power states | What does a UPF file describe that RTL does not?

## mem-1 | Memory design
> On-chip memories (SRAM arrays, register files, ROMs) take a large share of chip area. Designers must understand bit cells, peripheral circuits and how memories are instantiated in RTL.
= Capacity = 2^(address bits) × word width
- SRAM array organisation | Rows, columns, word lines, bit lines, column muxing | A 64 Kb SRAM: why not organise it as 65536 rows × 1 column?
- Read and write operation | Precharge, sense amplifiers, write drivers, read/write margins | Why does an SRAM read use a sense amplifier instead of waiting for a full swing?
- Memory compilers and macros | Single-port, dual-port, register files, BIST wrappers | When would you choose a register file over an SRAM macro?
- Memory in RTL | Inferring RAM, read-during-write behaviour, byte enables | Write a synchronous single-port RAM with byte enables.
- Reliability | ECC (SECDED), redundancy rows, soft errors | How many check bits does SECDED need for 64 data bits?

## pd-1 | Physical design: floorplan to route
> Physical design turns a netlist into geometry. Each step trades off timing, congestion, power and area.
- Floorplanning | Die/core size, utilisation, macro placement, IO planning | Why place memory macros at the edges?
- Power planning | Rings, stripes, rails, IR drop budget | What happens to timing when IR drop is high?
- Placement | Global and detailed placement, congestion, timing-driven placement | How do you fix a congested region?
- Clock tree synthesis | Buffers, skew, latency, insertion delay, useful skew | Why does hold get worse after CTS?
- Routing | Global and detailed routing, metal layers, vias, crosstalk | Why are clocks often routed with extra spacing (shielding)?

## pd-2 | Sign-off
> Sign-off checks prove the layout is manufacturable and meets every spec before tape-out.
- Parasitic extraction and STA | RC extraction, SPEF, multi-corner multi-mode analysis | Why does timing change after extraction?
- DRC and LVS | Manufacturing rules, layout vs schematic | An LVS error says "short". What do you look for?
- Antenna and density rules | Charge on long metal during fabrication, diode insertion, fill | How does an antenna violation damage a gate?
- Electromigration and IR drop | Current density limits, wider wires, more vias | Which nets are most at risk of electromigration?
- Signal integrity | Crosstalk delay and noise, spacing, shielding | How can a neighbour's switching make a path slower?

## dft-1 | Design for test (DFT)
> Manufacturing defects are unavoidable, so chips are designed to be testable. Scan chains, ATPG and BIST let a tester find faults in seconds.
= Fault coverage = detected faults / total faults
- Fault models | Stuck-at-0/1, transition faults, bridging faults | How many stuck-at faults does a 2-input NAND have?
- Scan design | Scan flip-flops, scan chains, shift and capture modes | Explain shift-capture-shift for one test pattern.
- ATPG | Automatic test pattern generation, controllability and observability | Why is a deep counter hard to test without scan?
- BIST | Memory BIST (march tests), logic BIST with LFSRs and MISRs | Why do memories use BIST instead of scan?
- JTAG boundary scan | TAP controller, IEEE 1149.1, board-level interconnect test | What can boundary scan test that internal scan cannot?

## eda-1 | EDA tools and methodology
> Chip teams use a chain of tools from simulation to sign-off. Knowing what each tool does (and what it outputs) matters more in interviews than tool menus.
- Simulation tools | Event-driven simulators (VCS, Xcelium, Questa, Icarus, Verilator) and waveforms | What is the difference between Verilator and an event-driven simulator?
- Lint and CDC tools | Static RTL checks, clock-domain crossing analysis | Name two bugs lint catches before simulation.
- Synthesis and STA tools | Design Compiler/Genus, PrimeTime/Tempus, reports | What reports do you check after synthesis?
- Physical design tools | Innovus, ICC2, OpenROAD; DEF/LEF/GDS files | What does a LEF file describe?
- Scripting and revision control | Tcl, Python, Makefiles, Git, regressions | Why is Tcl everywhere in EDA?

## plat-1 | STM32 and ARM Cortex-M in practice
> STM32 parts are the most common ARM Cortex-M microcontrollers in industry. The same concepts (clock tree, GPIO, NVIC, DMA) appear on every vendor's chips.
- STM32 families and tools | F0/F1/F4/G0/L4/H7, CubeMX, CubeIDE, HAL vs LL vs registers | When would you avoid the HAL?
- Clock tree setup | HSI, HSE, PLL, AHB/APB prescalers, peripheral clocks | Configure 84 MHz SYSCLK from an 8 MHz crystal.
- Peripherals by registers | RCC enable, GPIO MODER/OTYPER/ODR/IDR, USART, timers | Blink an LED using only register writes.
- Interrupts and DMA on STM32 | EXTI, NVIC_EnableIRQ, DMA streams/channels | Send a buffer over UART with DMA and get an interrupt at the end.
- Low-power modes | Sleep, Stop, Standby, wake-up sources, RTC | Which mode keeps RAM and wakes on an RTC alarm?

## plat-2 | ESP32 and connected devices
> The ESP32 adds Wi-Fi and Bluetooth to a dual-core microcontroller and runs FreeRTOS underneath ESP-IDF and Arduino.
- ESP32 architecture | Xtensa/RISC-V cores, flash, PSRAM, peripherals, partitions | Why does ESP32 code run from external flash through a cache?
- ESP-IDF and FreeRTOS | Tasks pinned to cores, event loops, menuconfig | Which core runs the Wi-Fi stack by default?
- Wi-Fi, MQTT and HTTP | Station/AP modes, reconnect logic, TLS | Design reconnect logic that does not drain the battery.
- Deep sleep and power | Deep sleep, RTC memory, wake-up stubs, current budget | How do you keep a counter across deep sleep?
- OTA updates | Dual partitions, rollback, signed images | What happens if power fails during an OTA write?

## lnx-1 | Embedded Linux fundamentals
> Larger devices run Linux on an application processor. Interviews check that you know the boot chain, user vs kernel space and the tools around building an image.
- Boot chain | ROM code, bootloader (U-Boot), kernel, device tree, rootfs, init | List the boot stages of an embedded Linux board.
- Kernel vs user space | System calls, processes, virtual memory, /dev, /sys, /proc | How does an application talk to a GPIO in Linux?
- Device tree | Describing hardware to the kernel, compatible strings, overlays | Why not hard-code board details in the driver?
- Build systems | Cross-compilation, toolchains, Buildroot, Yocto | What is a cross-compiler and why do you need one?
- Shell and debugging | dmesg, strace, gdb/gdbserver, top, journal | An app crashes on the board. How do you debug it remotely?

## lnx-2 | Linux device drivers
> A driver is kernel code that exposes hardware to user space. Character drivers and platform drivers are the classic interview topics.
- Kernel modules | module_init/exit, insmod/rmmod, printk, licences | What does a minimal kernel module contain?
- Character drivers | file_operations, open/read/write/ioctl, copy_to_user | Why can't a driver just dereference a user pointer?
- Platform drivers and probe | Matching via device tree, probe/remove, devm_ resources | When is probe() called?
- Interrupts and deferred work | request_irq, top/bottom halves, workqueues, tasklets | What may you not do in an interrupt handler in Linux?
- Concurrency in the kernel | Spinlocks vs mutexes, atomic context, sleeping | Why can't you take a mutex inside an interrupt handler?

## edbg-1 | Firmware debugging and testing
> Good firmware engineers are good debuggers. Systematic debugging and automated tests catch bugs before customers do.
- Debug tools | SWD/JTAG probes, GDB, breakpoints, watchpoints, semihosting, RTT | When is a watchpoint better than a breakpoint?
- Fault analysis | HardFault decoding, stack overflow detection, asserts, crash logs | Design a crash log that survives a reset.
- Hardware-level debugging | Oscilloscope, logic analyzer, multimeter, signal integrity | Your SPI works at 1 MHz but not at 10 MHz. What do you check?
- Unit testing firmware | Host-based tests, mocking hardware, Unity/CppUTest | How do you unit test a driver without the hardware?
- Hardware-in-the-loop and CI | Test jigs, automated flashing, regression on real boards | What would a nightly firmware CI run?

## dsa2-1 | Recursion and backtracking
> Recursion solves a problem through smaller copies of itself; backtracking explores choices and undoes them when they fail.
= Recursion depth × frame size must fit the stack
- Recursion basics | Base case, recursive case, call stack, tail recursion | Write power(x, n) in O(log n) using recursion.
- Recursion on arrays and strings | Reverse, palindrome, sum, binary search recursively | Check if a string is a palindrome recursively.
- Subsets and permutations | Include/exclude choice tree, swapping | Print all subsets of {1,2,3}. How many are there?
- Backtracking problems | N-Queens, sudoku, combination sum, maze paths | Count the solutions of 4-Queens.
- Recursion vs iteration | Stack usage, converting recursion to loops, memoisation | Why is naive recursive Fibonacci slow?

## dsa2-2 | Trees and graphs
> Trees model hierarchies; graphs model networks. BFS and DFS are the two traversals behind most problems.
= BFS/DFS on V vertices, E edges: O(V + E)
- Binary tree traversals | Pre/in/post-order, level order with a queue | Print a tree level by level.
- Binary search trees | Insert, search, delete, inorder gives sorted order | Check whether a binary tree is a valid BST.
- Heaps and priority queues | Min/max heap, heapify, heap sort, top-k | Find the k largest elements of an array.
- Graph representation and traversal | Adjacency list/matrix, BFS, DFS, connected components | Count islands in a grid.
- Shortest paths and topological sort | BFS for unweighted, Dijkstra, Kahn's algorithm | Order tasks with dependencies.

## dsa2-3 | Greedy algorithms
> A greedy algorithm makes the locally best choice at each step. It is fast but only correct when the problem has the greedy-choice property.
- Greedy choice property | When greedy works, exchange arguments, counterexamples | Show that greedy coin change fails for coins {1, 3, 4} and amount 6.
- Activity selection | Sort by end time, pick non-overlapping | Maximum meetings in one room.
- Intervals | Merge intervals, minimum platforms, interval scheduling | Merge [1,3],[2,6],[8,10],[15,18].
- Fractional knapsack and Huffman | Value/weight ratio, optimal prefix codes | Why does greedy work for fractional but not 0/1 knapsack?

## dsa2-4 | Dynamic programming
> Dynamic programming solves overlapping subproblems once and reuses the answers. Define the state, the transition and the base case.
= dp[i] = best answer for the first i items (typical 1-D state)
- Memoisation vs tabulation | Top-down with cache vs bottom-up table, space optimisation | Compute Fibonacci(50) both ways.
- 1-D DP | Climbing stairs, house robber, max subarray (Kadane) | Ways to climb n stairs taking 1 or 2 steps.
- 2-D DP and grids | Unique paths, minimum path sum, LCS, edit distance | Length of the longest common subsequence of two strings.
- Knapsack | 0/1 knapsack, subset sum, coin change (ways and minimum) | Minimum coins to make 11 with {1, 2, 5}.
- DP on sequences | Longest increasing subsequence, partition problems | LIS of 10, 9, 2, 5, 3, 7, 101, 18.

## net-1 | Network theorems and AC analysis
> Network theory gives systematic ways to solve any linear circuit: nodal and mesh analysis, superposition, Thevenin/Norton, and phasors for sinusoidal steady state.
= X_L = 2πfL ; X_C = 1 / (2πfC)
= Z_series = R + j(X_L − X_C) ; |Z| = √(R² + X²)
= Max power transfer: R_L = R_th (AC: Z_L = Z_th*)
- Nodal and mesh analysis | KCL at nodes, KVL around meshes, supernode/supermesh | Solve a 2-node circuit with nodal analysis.
- Superposition, Thevenin, Norton | Turning off sources, equivalent circuits, source transformation | Find the Thevenin equivalent seen by a load.
- Phasors and impedance | Sinusoids as complex numbers, impedance of R, L, C | Impedance of R = 30 Ω in series with X_L = 40 Ω.
- AC power | Real, reactive, apparent power, power factor | P, Q and S for V = 230 V, I = 5 A, PF 0.8.
- Resonance | Series and parallel resonance, Q factor, bandwidth | Resonant frequency of L = 10 mH, C = 100 nF.

## net-2 | Transients and two-port networks
> Transient analysis shows how circuits move between steady states; two-port parameters describe a network by what happens at its terminals.
= RC: v(t) = V_final + (V_initial − V_final) e^(−t/τ), τ = RC
= RL: τ = L / R
= RLC series: ω₀ = 1/√(LC), ζ = (R/2)√(C/L)
- First-order transients | RC and RL step responses, time constant | Voltage across a capacitor 2τ after a step.
- Second-order circuits | Over-, critically- and under-damped RLC, damping ratio | Classify R = 100 Ω, L = 1 mH, C = 1 µF.
- Initial and final values | Capacitor voltage and inductor current continuity | Why can't capacitor voltage jump?
- Two-port parameters | Z, Y, h and ABCD parameters, cascading | Which parameter set multiplies for cascaded networks?

## ana-1 | Transistor amplifiers
> Amplifiers use a transistor's small-signal behaviour around a DC operating point. Bias first, then analyse gain, input and output resistance.
= BJT: I_C = β I_B ; g_m = I_C / V_T (V_T ≈ 26 mV) ; r_π = β / g_m
= CE gain ≈ −g_m R_C ; MOSFET CS gain ≈ −g_m R_D
- BJT biasing | Fixed bias, voltage-divider bias, Q-point, stability | Find I_C for a voltage-divider biased stage.
- Small-signal models | Hybrid-π, g_m, r_π, r_o | g_m of a BJT at I_C = 1 mA.
- Common-emitter / common-source | Gain, input and output resistance | Gain of a CE stage with I_C = 2 mA and R_C = 2.2 kΩ.
- Follower and cascode stages | Emitter/source follower as buffer, cascode for gain and bandwidth | Why is an emitter follower's gain close to 1?
- Frequency response | Coupling and bypass capacitors, Miller effect, bandwidth | What does the Miller effect do to input capacitance?

## ana-2 | Feedback, op-amp circuits and oscillators
> Negative feedback trades gain for stability, bandwidth and accuracy. Positive feedback with the right phase makes oscillators.
= Closed-loop gain A_f = A / (1 + Aβ) ≈ 1/β when Aβ ≫ 1
= Gain-bandwidth product: A × BW = constant
= Barkhausen: |Aβ| = 1 and phase = 0° (360°)
- Negative feedback | Loop gain, desensitivity, effect on bandwidth and impedance | A = 10⁵, β = 0.01: closed-loop gain?
- Op-amp applications | Integrator, differentiator, instrumentation amplifier, active filters | Output of an integrator for a constant input.
- Op-amp limits | GBW, slew rate, offset, CMRR | Full-power bandwidth for slew rate 0.5 V/µs and 10 V peak.
- Oscillators | Barkhausen criterion, RC phase-shift, Wien bridge, crystal | Frequency of a Wien bridge with R = 10 kΩ, C = 10 nF.
- 555 timer | Astable and monostable modes | Pulse width of a monostable 555 with R = 100 kΩ, C = 10 µF.

## sig-1 | Signals and systems
> Signals carry information; systems transform them. Linear time-invariant (LTI) systems are completely described by their impulse response.
= y(t) = x(t) * h(t) (convolution)
= Fourier: X(f) = ∫ x(t) e^(−j2πft) dt ; Laplace: X(s) = ∫ x(t) e^(−st) dt
- Signal types and operations | Continuous/discrete, periodic, even/odd, energy/power, shifting and scaling | Is x(t) = e^(−2t)u(t) an energy or a power signal?
- System properties | Linearity, time invariance, causality, stability, memory | Is y(t) = x(2t) time-invariant?
- Convolution and impulse response | Flip, shift, multiply, integrate; LTI output | Convolve two unit rectangles of width 1.
- Fourier series and transform | Spectrum of periodic and aperiodic signals, key pairs and properties | Fourier transform of a rectangular pulse.
- Laplace transform | ROC, poles and zeros, transfer functions | Laplace transform of e^(−at)u(t).

## sig-2 | Sampling, Z-transform and DSP basics
> Digital systems work on samples. Sampling, quantisation and the Z-transform connect the analog world to DSP code.
= Nyquist: f_s > 2 f_max
= SQNR ≈ 6.02 N + 1.76 dB
= Z{a^n u[n]} = 1 / (1 − a z^(−1)), ROC |z| > |a|
- Sampling and aliasing | Nyquist rate, alias frequency, anti-aliasing filters | A 7 kHz tone sampled at 10 kHz appears at what frequency?
- Quantisation | Step size, SQNR, dither | SQNR of a 12-bit converter.
- Z-transform | Definition, ROC, stability (poles inside unit circle) | Is H(z) = 1/(1 − 1.2 z⁻¹) stable if causal?
- DFT and FFT | N-point DFT, bin spacing, FFT complexity | Bin spacing of a 1024-point FFT at 48 kHz.
- FIR and IIR filters | Moving average, difference equations, linear phase | Why do FIR filters have no stability problems?

## ctl-1 | Control systems basics
> Control systems use feedback to make a plant follow a reference. Transfer functions, block diagrams and time-domain specs describe them.
= Closed loop: T(s) = G(s) / (1 + G(s)H(s))
= 2nd order: ω_n, ζ ; %OS = 100 e^(−ζπ/√(1−ζ²)) ; t_s(2%) ≈ 4 / (ζ ω_n)
= Steady-state error (unity feedback, step): e_ss = 1 / (1 + K_p)
- Transfer functions and block diagrams | Poles, zeros, block reduction, signal flow graphs | Reduce G1 and G2 in series inside unity feedback.
- Time response | First- and second-order step response, rise time, overshoot, settling | %OS for ζ = 0.5.
- Steady-state error | System type, error constants Kp, Kv, Ka | e_ss for a step with K_p = 9.
- PID control | Effect of P, I and D terms, tuning ideas | Which term removes steady-state error?

## ctl-2 | Stability and frequency response
> Stability decides whether a feedback system settles or blows up. Routh-Hurwitz, root locus and Bode/Nyquist plots answer it from different angles.
= Gain margin = 1 / |GH| at phase −180° ; phase margin = 180° + ∠GH at |GH| = 1
- Routh-Hurwitz criterion | Routh array, sign changes, marginal stability | Range of K for s³ + 3s² + 3s + 1 + K to be stable.
- Root locus | Branches, asymptotes, breakaway points | Where do root-locus branches start and end?
- Bode plots | Asymptotic magnitude and phase, corner frequencies, gain and phase margin | Slope of the magnitude after two poles.
- Nyquist criterion | Encirclements of −1, N = Z − P | What does an encirclement of −1 mean?

## com-1 | Analog communication
> Communication systems move information over a channel. Analog modulation (AM, FM) shows the trade-offs between bandwidth, power and noise.
= AM: s(t) = A_c[1 + μ m(t)] cos(2πf_c t) ; P_t = P_c(1 + μ²/2)
= FM (Carson): BW ≈ 2(Δf + f_m) ; β = Δf / f_m
- Amplitude modulation | DSB-FC, DSB-SC, SSB, modulation index, efficiency | Total power for P_c = 100 W and μ = 0.5.
- Frequency and phase modulation | Deviation, modulation index, Carson's rule | FM bandwidth for Δf = 75 kHz and f_m = 15 kHz.
- Receivers | Superheterodyne, IF, image frequency | Image frequency for f_s = 1000 kHz and IF = 455 kHz (high-side LO).
- Noise | Thermal noise, SNR, noise figure | Thermal noise power in 1 MHz at 290 K.

## com-2 | Digital communication and information theory
> Digital communication sends bits as symbols. Bandwidth, noise and coding set how fast and how reliably bits can move.
= Shannon: C = B log₂(1 + SNR)
= Bit rate = symbol rate × log₂(M)
= Entropy: H = −Σ p log₂ p
- Sampling, PCM and line coding | Quantisation, bit rate of PCM, NRZ/Manchester | Bit rate of PCM speech: 8 kHz × 8 bits.
- Digital modulation | ASK, FSK, PSK, QPSK, QAM, constellations | Bits per symbol for 64-QAM.
- Channel capacity | Shannon-Hartley, bandwidth vs SNR trade-off | Capacity of a 3 kHz channel at 30 dB SNR.
- Information theory and coding | Entropy, Huffman coding, parity, Hamming codes | Entropy of a fair 8-sided die.
- Multiplexing and access | TDM, FDM, OFDM, CDMA basics | Why does OFDM handle multipath well?

## emt-1 | Electromagnetic fields
> Electromagnetics explains how charges and currents create fields, and how fields store energy and exert force.
= Coulomb: F = q₁q₂ / (4πε₀ r²) ; ε₀ = 8.854 × 10⁻¹² F/m
= Parallel plate: C = ε A / d
= Maxwell: ∇·D = ρ, ∇·B = 0, ∇×E = −∂B/∂t, ∇×H = J + ∂D/∂t
- Vector calculus | Gradient, divergence, curl, coordinate systems | Divergence of F = x i + y j + z k.
- Electrostatics | Coulomb's law, Gauss's law, potential, capacitance | Capacitance of plates 1 cm² apart by 1 mm in air.
- Magnetostatics | Biot-Savart, Ampère's law, inductance | Field inside a long solenoid.
- Maxwell's equations | Integral and differential forms, displacement current | Why was displacement current needed?

## emt-2 | Waves, transmission lines and antennas
> At high frequency, wires become transmission lines and fields travel as waves. Matching and reflections decide whether power reaches the load.
= Γ = (Z_L − Z₀) / (Z_L + Z₀) ; VSWR = (1 + |Γ|) / (1 − |Γ|)
= λ = c / f ; v = 1/√(με)
- Plane waves | Wave equation, intrinsic impedance (377 Ω in free space), skin depth | Wavelength of a 2.4 GHz wave in air.
- Transmission lines | Characteristic impedance, reflection, VSWR, standing waves | Γ for a 100 Ω load on a 50 Ω line.
- Impedance matching | Quarter-wave transformer, stubs, Smith chart idea | Z of a quarter-wave transformer between 50 Ω and 200 Ω.
- Antenna basics | Dipole, gain, directivity, radiation pattern | Length of a half-wave dipole at 100 MHz.

## math-1 | Linear algebra
> Matrices describe linear systems; eigenvalues describe how a system behaves along its natural directions.
= det of 2×2 [a b; c d] = ad − bc
= Eigenvalues: det(A − λI) = 0 ; trace = Σλ, det = Πλ
- Matrices and determinants | Operations, inverse, rank | Determinant of [[2, 1], [5, 3]].
- Systems of linear equations | Consistency, rank, Gaussian elimination | When does Ax = b have infinitely many solutions?
- Eigenvalues and eigenvectors | Characteristic equation, properties, diagonalisation | Eigenvalues of [[2, 0], [0, 5]].

## math-2 | Calculus and differential equations
> Calculus describes change; differential equations describe circuits, motion and control systems.
= d/dx(xⁿ) = n xⁿ⁻¹ ; ∫ xⁿ dx = xⁿ⁺¹/(n+1)
= First-order linear ODE: y' + Py = Q, integrating factor e^(∫P dx)
- Limits, derivatives and maxima | Rules, maxima/minima, Taylor series | Maximum of f(x) = −x² + 4x.
- Integration | Definite integrals, area, by parts | ∫₀¹ x² dx.
- Differential equations | First-order linear, second-order with constant coefficients | Solve dy/dt = −2y with y(0) = 3.

## math-3 | Probability and statistics
> Probability underpins noise analysis, communications and reliability.
= P(A∪B) = P(A) + P(B) − P(A∩B) ; Bayes: P(A|B) = P(B|A)P(A)/P(B)
= Binomial: P(k) = C(n,k) pᵏ (1−p)ⁿ⁻ᵏ ; Poisson mean = variance = λ
- Basic probability | Events, conditional probability, Bayes' theorem | P(at least one six in two dice rolls).
- Random variables | Mean, variance, PDF/CDF | Mean and variance of a fair die.
- Distributions | Binomial, Poisson, uniform, Gaussian | P(exactly 2 heads in 4 fair tosses).
`;
