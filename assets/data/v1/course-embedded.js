// Embedded Systems course - original lessons written for Spidy Prep.
export const EMBEDDED_COURSE = {
  id: "embedded", title: "Embedded Systems", color: "#2563EB",
  intro: "From C on bare metal to interrupts, protocols and an RTOS - the topics embedded interviews actually ask, in the order they build on each other.",
  modules: [
{
  id: "em-c", title: "C for embedded", lessons: [
{
  id: "e-types", title: "Fixed-width types and integer promotion", mins: 10,
  sum: "Why embedded code says uint8_t instead of int, and the promotion rules that cause real bugs.",
  body: `
<p>On a PC, <code>int</code> is 32 bits. On an 8-bit AVR it is 16 bits. Firmware talks to hardware registers that have an exact size, so it uses the types from <code>&lt;stdint.h&gt;</code>: <code>uint8_t</code>, <code>int16_t</code>, <code>uint32_t</code> and so on. The name tells you the width and the sign, on every compiler.</p>
<h3>Unsigned wraps, signed overflow is undefined</h3>
<p>Unsigned arithmetic is defined to wrap around modulo 2<sup>n</sup>: a <code>uint8_t</code> holding 255 plus 1 becomes 0. Signed overflow is <b>undefined behaviour</b>: the compiler may assume it never happens and optimise accordingly. Use unsigned types for counters, masks and register values.</p>
<h3>Integer promotion</h3>
<p>Before arithmetic, C converts anything smaller than <code>int</code> (char, short, uint8_t, uint16_t on 32-bit targets) to <code>int</code>. Three classic traps follow from this:</p>
<ul>
<li><code>uint8_t a = 200, b = 100; if (a + b > 255)</code> is <b>true</b>, because the addition happens in <code>int</code> and gives 300. Storing it back in a <code>uint8_t</code> gives 44.</li>
<li><code>uint8_t x = 0x0F; if (~x == 0xF0)</code> is <b>false</b>: <code>~x</code> is computed on a promoted int and equals 0xFFFFFFF0.</li>
<li>Comparing signed and unsigned converts the signed value to unsigned: <code>-1 &lt; 1u</code> is <b>false</b>, because -1 becomes 0xFFFFFFFF.</li>
</ul>
<div class="callout"><b>Rule of thumb:</b> keep register and bit work in one unsigned type, cast results back explicitly (<code>(uint8_t)(x &lt;&lt; 4)</code>), and turn on compiler warnings (<code>-Wall -Wextra -Wconversion</code>).</div>
<h3>Sizes worth memorising</h3>
<table><tr><th>Type</th><th>Typical 32-bit MCU</th></tr>
<tr><td>char</td><td>8 bits (signedness is implementation-defined)</td></tr>
<tr><td>short</td><td>16 bits</td></tr><tr><td>int, long, pointers</td><td>32 bits</td></tr><tr><td>long long</td><td>64 bits</td></tr></table>`,
  takeaway: "Use stdint types, prefer unsigned for bits and counters, and remember that small types are promoted to int before any arithmetic.",
  quiz: [
    { q: "uint8_t a = 250; a = a + 10; What is a?", o: ["260", "4", "255", "Undefined"], a: 1, why: "260 does not fit in 8 bits; storing it keeps the low 8 bits: 260 - 256 = 4." },
    { q: "Which of these is undefined behaviour in C?", o: ["uint32_t overflow", "int overflow", "Right-shifting an unsigned value", "Casting int to uint8_t"], a: 1, why: "Only signed overflow is undefined. Unsigned arithmetic wraps by definition." },
    { q: "What does (-1 < 1u) evaluate to?", o: ["1", "0", "Compile error", "Undefined"], a: 1, why: "-1 is converted to unsigned (0xFFFFFFFF), which is not less than 1." },
  ],
  practice: ["c-binary", "c-struct"],
},
{
  id: "e-volatile", title: "volatile and const", mins: 9,
  sum: "The two keywords every embedded interview asks about, and exactly what each one promises.",
  body: `
<p>The compiler is allowed to keep a variable in a register and skip reading memory again if it believes nothing changed it. That is a great optimisation for normal code, and a disaster when the value is changed by hardware or an interrupt.</p>
<h3>volatile: "something else may change this"</h3>
<pre class="code">volatile int data_ready = 0;      // set by an ISR

void UART_IRQHandler(void) { data_ready = 1; }

int main(void) {
  while (!data_ready) { }   // without volatile this can become an infinite loop
}</pre>
<p><code>volatile</code> forces the compiler to perform every read and write exactly as written, in order. Use it for:</p>
<ul><li>memory-mapped peripheral registers</li><li>variables shared between an ISR and the main code</li><li>variables shared between RTOS tasks or cores (together with proper locking)</li></ul>
<div class="callout warn"><b>volatile is not atomic.</b> <code>counter++</code> on a volatile variable is still read, modify, write. An interrupt between the read and the write loses an update. Protect it by disabling the interrupt briefly, or use an atomic operation.</div>
<h3>const: "this code will not change it"</h3>
<p><code>const</code> makes the compiler reject writes. On microcontrollers, a global <code>const</code> table is usually placed in <b>flash</b> instead of RAM, which saves precious RAM.</p>
<h3>Reading pointer declarations</h3>
<table><tr><th>Declaration</th><th>Meaning</th></tr>
<tr><td><code>const int *p</code></td><td>pointer to a constant int: <code>*p = 5</code> is an error, <code>p++</code> is fine</td></tr>
<tr><td><code>int *const p</code></td><td>constant pointer: <code>*p = 5</code> is fine, <code>p++</code> is an error</td></tr>
<tr><td><code>const int *const p</code></td><td>neither can change</td></tr>
<tr><td><code>volatile const uint32_t *p</code></td><td>a read-only hardware status register</td></tr></table>
<p>Read right to left: <code>int *const p</code> is "p is a const pointer to int".</p>`,
  takeaway: "volatile stops the compiler from caching a value (needed for registers and ISR flags) but does not make code atomic. const stops writes and often puts data in flash.",
  quiz: [
    { q: "A flag is set in an ISR and polled in main(). What must the flag be?", o: ["static", "volatile", "const", "register"], a: 1, why: "volatile makes main() re-read the flag from memory every time." },
    { q: "Does volatile make x++ safe from interrupts?", o: ["Yes", "No, it is still a read-modify-write", "Only on ARM", "Only for 8-bit variables"], a: 1, why: "volatile controls caching, not atomicity." },
    { q: "In 'int *const p', what cannot change?", o: ["The int", "The pointer p", "Both", "Neither"], a: 1, why: "const sits right after *, so the pointer itself is constant." },
  ],
  practice: ["c-bitops"],
},
{
  id: "e-bits", title: "Bit manipulation and register access", mins: 12,
  sum: "Masks, read-modify-write and how C code actually writes to a peripheral register.",
  demo: "bits",
  body: `
<p>Peripherals are controlled through registers: 32-bit words at fixed addresses where each bit or group of bits means something (enable, mode, flag).</p>
<h3>The four basic operations</h3>
<pre class="code">reg |=  (1u &lt;&lt; n);     // set bit n
reg &amp;= ~(1u &lt;&lt; n);     // clear bit n
reg ^=  (1u &lt;&lt; n);     // toggle bit n
if (reg &amp; (1u &lt;&lt; n))   // test bit n</pre>
<p>Always use <code>1u</code>: <code>1 &lt;&lt; 31</code> shifts into the sign bit of a signed int, which is undefined.</p>
<h3>Multi-bit fields</h3>
<p>To write a 3-bit field at bit 4 without touching other bits: build a mask, clear, then set.</p>
<pre class="code">#define MODE_POS  4u
#define MODE_MASK (0x7u &lt;&lt; MODE_POS)
reg = (reg &amp; ~MODE_MASK) | ((mode &lt;&lt; MODE_POS) &amp; MODE_MASK);</pre>
<h3>Talking to the hardware</h3>
<p>A register is just a memory address, accessed through a <code>volatile</code> pointer:</p>
<pre class="code">#define GPIOA_ODR (*(volatile uint32_t *)0x40020014u)
GPIOA_ODR |= (1u &lt;&lt; 5);   // drive pin PA5 high</pre>
<p>Vendor headers wrap this in structs (<code>GPIOA-&gt;ODR</code>) whose members line up with the register offsets.</p>
<div class="callout warn"><b>Read-modify-write is not atomic.</b> If an ISR changes the same register between your read and your write, its change is lost. Many MCUs offer set/reset registers (write 1 to set one pin, other bits ignored) or bit-banding precisely to avoid this.</div>
<h3>Handy tricks interviewers ask</h3>
<ul><li><code>x &amp; (x - 1)</code> clears the lowest set bit; zero means x was a power of two.</li>
<li><code>x &amp; -x</code> isolates the lowest set bit.</li>
<li>Swap nibbles: <code>(b &lt;&lt; 4) | (b &gt;&gt; 4)</code> (then cast to 8 bits).</li></ul>`,
  takeaway: "Set with |, clear with & ~, toggle with ^, test with &. Fields need mask-clear-then-set. Registers are volatile pointers, and read-modify-write can race with interrupts.",
  quiz: [
    { q: "Which line clears bit 3 of reg?", o: ["reg |= (1u << 3)", "reg &= ~(1u << 3)", "reg ^= (1u << 3)", "reg &= (1u << 3)"], a: 1, why: "AND with a mask that has a 0 only at bit 3." },
    { q: "x & (x - 1) == 0 (with x != 0) means...", o: ["x is odd", "x is a power of two", "x is negative", "x has all bits set"], a: 1, why: "A power of two has a single 1 bit; subtracting 1 flips it and all lower bits." },
  ],
  practice: ["c-bitops", "c-field", "c-popcount", "c-pow2", "c-nibble", "c-revbits"],
},
{
  id: "e-memory", title: "Memory layout: stack, heap, data and bss", mins: 10,
  sum: "Where every variable lives in a firmware image, and why embedded code avoids malloc.",
  body: `
<p>A firmware image is split into sections. Knowing which section a variable lands in answers a large family of interview questions.</p>
<table><tr><th>Section</th><th>What goes there</th><th>Lives in</th></tr>
<tr><td>.text</td><td>machine code, constant data (<code>const</code> tables, string literals)</td><td>Flash</td></tr>
<tr><td>.data</td><td>globals and statics <b>with</b> a non-zero initial value</td><td>RAM (initial values copied from flash at startup)</td></tr>
<tr><td>.bss</td><td>globals and statics that are zero or uninitialised</td><td>RAM (zeroed at startup)</td></tr>
<tr><td>heap</td><td><code>malloc</code> memory</td><td>RAM, grows up</td></tr>
<tr><td>stack</td><td>local variables, return addresses, saved registers</td><td>RAM, usually grows down</td></tr></table>
<pre class="code">int a = 5;           // .data
int b;               // .bss
static int c = 0;    // .bss
const int d = 7;     // .text / .rodata (flash)
void f(void) {
  int e;             // stack
  static int g = 1;  // .data - keeps its value between calls
  char *h = malloc(8); // h on the stack, the 8 bytes on the heap
}</pre>
<h3>The static keyword</h3>
<ul><li>On a local variable: lifetime becomes the whole program (stored in .data/.bss), scope stays the function.</li>
<li>On a global or function: visible only inside that .c file (internal linkage). Good for hiding driver internals.</li></ul>
<h3>Why firmware avoids malloc</h3>
<ul><li><b>Fragmentation:</b> after many allocations and frees, there may be enough free bytes in total but no single block big enough.</li>
<li><b>Unpredictable timing</b>, which hurts real-time code.</li>
<li><b>Hidden failures:</b> malloc can return NULL months into a deployment.</li></ul>
<p>Common practice: allocate everything statically, or only allocate at startup, or use fixed-size memory pools.</p>
<div class="callout"><b>Stack overflow</b> is a top cause of mysterious crashes: deep recursion, big local arrays, or nested interrupts. RTOSes let you fill the stack with a pattern and check how much was used (the "high-water mark").</div>`,
  takeaway: "Code and const data in flash; initialised globals in .data, zero ones in .bss, locals on the stack. Firmware prefers static allocation over malloc.",
  quiz: [
    { q: "Where is 'static int count;' inside a function stored?", o: ["Stack", "Heap", ".bss", "Registers"], a: 2, why: "Static locals live for the whole program; zero-initialised ones go in .bss." },
    { q: "What does startup code do with .data?", o: ["Zeroes it", "Copies initial values from flash to RAM", "Nothing", "Moves it to the stack"], a: 1, why: "Initial values are stored in flash and copied to RAM before main()." },
  ],
  practice: ["c-ring", "c-llrev"],
},
{
  id: "e-structs", title: "Structs, padding, unions and endianness", mins: 11,
  sum: "Predict sizeof, read bytes in the right order, and map structs onto packets and registers.",
  body: `
<h3>Alignment and padding</h3>
<p>CPUs read memory fastest (and on some cores, only) when a 4-byte value starts at an address divisible by 4. So the compiler inserts padding.</p>
<pre class="code">struct A { char c; int i; char d; };   // 1 + 3 pad + 4 + 1 + 3 pad = 12
struct B { int i; char c; char d; };   // 4 + 1 + 1 + 2 pad          = 8</pre>
<p>Rules: each member starts at a multiple of its own alignment, and the total size is a multiple of the largest alignment (so arrays of the struct stay aligned). <b>Order members from largest to smallest</b> to minimise padding.</p>
<p><code>__attribute__((packed))</code> removes padding, which is useful for wire formats, but unaligned access is slower and can fault on some cores. Many teams prefer to serialise fields byte by byte instead.</p>
<h3>Unions</h3>
<p>All members of a union share the same memory; its size is the size of the largest member. A common use is viewing the same bytes two ways:</p>
<pre class="code">union { uint32_t word; uint8_t bytes[4]; } u;
u.word = 0x11223344;
// little-endian: bytes[0] == 0x44</pre>
<h3>Endianness</h3>
<p><b>Little-endian</b> stores the least significant byte at the lowest address (x86, ARM Cortex-M by default). <b>Big-endian</b> stores the most significant byte first (network byte order, many sensors).</p>
<pre class="code">int is_little(void) { uint16_t x = 1; return *(uint8_t *)&amp;x == 1; }</pre>
<p>Portable code avoids the question entirely by building values with shifts: <code>(p[0] &lt;&lt; 8) | p[1]</code> reads a big-endian 16-bit value on any CPU.</p>`,
  takeaway: "Members align to their size and the struct rounds up to its largest alignment; sort members large to small. Little-endian puts the low byte first. Shifts make byte order explicit and portable.",
  quiz: [
    { q: "sizeof(struct { char a; int b; }) on a 32-bit MCU?", o: ["5", "6", "8", "4"], a: 2, why: "1 byte + 3 padding + 4 bytes = 8." },
    { q: "On a little-endian CPU, uint32_t 0xAABBCCDD at address 0: what byte is at address 0?", o: ["AA", "BB", "CC", "DD"], a: 3, why: "Least significant byte first." },
  ],
  practice: ["c-struct", "c-bswap"],
},
]},
{
  id: "em-mcu", title: "Inside a microcontroller", lessons: [
{
  id: "e-arch", title: "MCU architecture and the memory map", mins: 9,
  sum: "CPU core, buses, flash, SRAM and peripherals - and how they share one address space.",
  body: `
<p>A <b>microcontroller</b> puts a CPU, flash, SRAM, clocks and peripherals (GPIO, timers, UART, ADC...) on one chip. A <b>microprocessor</b> is mostly the CPU and needs external RAM and storage; it usually runs Linux with an MMU.</p>
<h3>Harvard vs von Neumann</h3>
<p>Von Neumann uses one bus for instructions and data. Harvard uses separate buses, so the core can fetch the next instruction while reading data. ARM Cortex-M3/M4 use a <b>modified Harvard</b> design: separate instruction and data buses, but one unified address space, so code can still read constant tables from flash.</p>
<h3>Memory map</h3>
<p>Everything has an address. On a Cortex-M device a typical map is:</p>
<table><tr><th>Address</th><th>Region</th></tr>
<tr><td>0x0000_0000 / 0x0800_0000</td><td>Flash (code)</td></tr><tr><td>0x2000_0000</td><td>SRAM</td></tr>
<tr><td>0x4000_0000</td><td>Peripherals (registers)</td></tr><tr><td>0xE000_0000</td><td>Core peripherals: NVIC, SysTick, debug</td></tr></table>
<p>Because peripherals are memory-mapped, normal load and store instructions configure hardware.</p>
<h3>Buses and clocks</h3>
<p>Fast blocks (CPU, DMA, memory) sit on a high-speed bus (AHB); slower peripherals sit behind bridges on APB buses with their own prescalers. A peripheral does nothing until its <b>clock is enabled</b> - the first line of most driver init code, and the first thing to check when "my UART does not work".</p>
<p>The clock tree starts from an internal RC oscillator (fast to start, less accurate) or an external crystal (accurate), often multiplied by a PLL.</p>`,
  takeaway: "One address space holds flash, RAM and peripheral registers. Cortex-M is modified Harvard. Enable a peripheral's clock before touching it.",
  quiz: [
    { q: "Why does writing to an address turn on an LED?", o: ["The OS intercepts it", "Peripheral registers are memory-mapped", "The compiler adds a driver", "GPIO is in flash"], a: 1, why: "Peripheral registers live in the address space; stores reach the hardware." },
    { q: "First thing to check when a peripheral seems dead?", o: ["Stack size", "Its clock enable bit", "The heap", "Endianness"], a: 1, why: "A peripheral without its clock enabled ignores register writes." },
  ],
  practice: [],
},
{
  id: "e-boot", title: "From reset to main()", mins: 10,
  sum: "Vector table, startup code and the linker script: what runs before your first line of C.",
  body: `
<p>A classic question: "What happens when you press reset?" On an ARM Cortex-M:</p>
<ol>
<li>The core reads the first word of the <b>vector table</b> (at address 0, or wherever it is mapped) and loads it into the stack pointer.</li>
<li>It reads the second word - the address of the <b>Reset_Handler</b> - and jumps there.</li>
<li>The startup code copies the initial values of <b>.data</b> from flash to RAM.</li>
<li>It fills <b>.bss</b> with zeros.</li>
<li>It calls <code>SystemInit()</code> (clock and PLL setup on many vendors' code).</li>
<li>It may run C library init (static constructors in C++), then calls <code>main()</code>.</li>
</ol>
<h3>The vector table</h3>
<p>An array of addresses: initial stack pointer, reset handler, fault handlers, then one entry per interrupt. When interrupt 37 fires, the hardware loads entry 37 and jumps to it. A bootloader that starts an application moves the table with the <code>VTOR</code> register.</p>
<h3>The linker script</h3>
<p>It tells the linker where flash and RAM are and where each section goes. The key idea is that <b>.data has two addresses</b>: the place it is stored (load address, in flash) and the place it runs (run address, in RAM). The startup code uses symbols from the linker script to know what to copy.</p>
<pre class="code">MEMORY {
  FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}
.data : { *(.data*) } &gt; RAM AT &gt; FLASH</pre>`,
  takeaway: "Reset loads SP and the reset vector, startup copies .data, zeroes .bss, sets up clocks, then calls main(). The linker script decides where every section lives.",
  quiz: [
    { q: "What are the first two words of a Cortex-M vector table?", o: ["main and SystemInit", "Initial SP and Reset_Handler address", "NMI and HardFault", "Flash size and RAM size"], a: 1, why: "Word 0 is the initial stack pointer; word 1 is the reset handler address." },
    { q: "Why must .bss be zeroed by startup code?", o: ["C guarantees uninitialised globals start at 0", "To save flash", "For the stack", "It is optional"], a: 0, why: "The C standard says static storage without an initialiser starts at zero." },
  ],
  practice: [],
},
{
  id: "e-gpio", title: "GPIO, pull-ups and debouncing", mins: 9,
  sum: "Push-pull vs open-drain, why floating inputs misbehave, and how to read a bouncy button.",
  body: `
<h3>Output types</h3>
<ul><li><b>Push-pull:</b> the pin actively drives both high and low. The default for LEDs and chip selects.</li>
<li><b>Open-drain:</b> the pin can only pull low; a resistor pulls the line high. Several devices can share one line safely (a "wired-AND"): if any device pulls low, the line is low. I2C and many interrupt lines work this way. It also lets a 3.3 V chip talk to a line pulled up to a different voltage.</li></ul>
<h3>Inputs need a defined level</h3>
<p>An input pin connected to nothing <b>floats</b>: it picks up noise and reads random values, and may waste power. Use an internal or external <b>pull-up</b> (reads 1 when the button is open, 0 when pressed to ground) or <b>pull-down</b>.</p>
<h3>Alternate functions</h3>
<p>Most pins can be handed to a peripheral (UART TX, SPI clock, timer output) through an alternate-function setting instead of being driven by software.</p>
<h3>Debouncing</h3>
<p>A mechanical contact bounces for a few milliseconds, producing several edges for one press. Fixes:</p>
<ul><li>Hardware: RC filter plus a Schmitt-trigger input.</li>
<li>Software: sample every 1-5 ms and accept a new level only after it has been stable for N samples (see the debouncer problem).</li>
<li>Do not do it with a long delay inside an interrupt handler.</li></ul>`,
  takeaway: "Push-pull drives both levels; open-drain only pulls low and needs a pull-up, which allows shared lines. Never leave inputs floating. Debounce by requiring a stable level for several samples.",
  quiz: [
    { q: "Why does I2C use open-drain outputs?", o: ["Higher speed", "So several devices can share a line without shorting", "Lower cost", "To avoid pull-ups"], a: 1, why: "Devices only pull low; the resistor pulls high, so no device ever fights another driving high." },
    { q: "A button connects a pin to ground when pressed. Which resistor do you need?", o: ["Pull-down", "Pull-up", "None", "A series 0 ohm"], a: 1, why: "The pull-up holds the pin at 1 when the button is open." },
  ],
  practice: ["c-fsm"],
},
]},
{
  id: "em-irq", title: "Interrupts, timers and ADC", lessons: [
{
  id: "e-irq", title: "Interrupts and the NVIC", mins: 12,
  sum: "How an interrupt is taken, how priorities work, and the rules for writing ISRs.",
  body: `
<p><b>Polling</b> checks a flag in a loop: simple, but it wastes CPU and can miss short events. An <b>interrupt</b> makes the hardware stop the current code, run a handler (ISR) and come back.</p>
<h3>What happens on a Cortex-M interrupt</h3>
<ol><li>The core finishes (or abandons) the current instruction.</li>
<li>It pushes 8 registers (R0-R3, R12, LR, PC, xPSR) onto the stack automatically - that is why ISRs can be plain C functions.</li>
<li>It loads the handler address from the vector table and runs it in Handler mode.</li>
<li>Returning from the handler pops the registers and resumes.</li></ol>
<p>Entry takes about 12 clock cycles. <b>Tail-chaining</b> skips the pop/push when another interrupt is pending at the end of a handler.</p>
<h3>Priorities (NVIC)</h3>
<p>On ARM, a <b>lower number means higher priority</b>. A higher-priority interrupt can preempt a running lower-priority ISR (nesting). Priority bits can be split into a preempt priority and a sub-priority; the sub-priority only decides the order among pending interrupts of equal preempt priority.</p>
<h3>ISR rules</h3>
<ul><li>Keep it short: read the data, clear the flag, set a flag or push to a buffer, return.</li>
<li>No blocking calls, no long loops, no <code>printf</code>, no <code>malloc</code>.</li>
<li><b>Clear the interrupt flag</b>, or the ISR fires again immediately.</li>
<li>Variables shared with main must be <code>volatile</code>, and multi-step updates need protection (briefly disable that interrupt).</li>
<li>Do the heavy work later in the main loop or an RTOS task ("deferred processing").</li></ul>
<h3>Latency and jitter</h3>
<p>Latency is the time from the event to the first ISR instruction. It grows when interrupts are disabled for long, when a higher-priority ISR is running, or when the code runs from slow flash.</p>`,
  takeaway: "The hardware stacks registers and jumps through the vector table. Lower number = higher priority on ARM. ISRs must be short, clear their flag, and share data through volatile variables with protection.",
  quiz: [
    { q: "Two pending interrupts have priority 1 and 4 on a Cortex-M. Which runs first?", o: ["Priority 4", "Priority 1", "Whichever came first", "Both at once"], a: 1, why: "Lower number = higher priority on ARM." },
    { q: "An ISR keeps firing again and again. Most likely cause?", o: ["Stack too small", "The interrupt flag is not cleared", "Missing volatile", "Wrong optimisation"], a: 1, why: "An uncleared pending flag re-triggers the interrupt immediately." },
    { q: "Which is fine inside an ISR?", o: ["printf", "malloc", "Pushing a byte into a ring buffer", "Waiting for a mutex"], a: 2, why: "A ring buffer push is short and non-blocking." },
  ],
  practice: ["c-ring"],
},
{
  id: "e-timers", title: "Timers, PWM and the watchdog", mins: 11,
  sum: "Prescaler and auto-reload maths, duty cycle, input capture and watchdog strategy.",
  demo: "pwm",
  body: `
<p>A hardware timer is a counter driven by a clock. A <b>prescaler</b> (PSC) divides the clock, the counter counts up to the <b>auto-reload</b> value (ARR), then wraps and can raise an update interrupt.</p>
<div class="formula">f<sub>update</sub> = f<sub>timer clock</sub> / ((PSC + 1) × (ARR + 1))</div>
<p>Example: a 16 MHz clock and a 1 ms tick. PSC = 15 gives 1 MHz (1 µs per count), ARR = 999 gives 1000 counts = 1 ms.</p>
<h3>PWM</h3>
<p>A compare register (CCR) sets when the output switches. With the counter running 0..ARR, the output is high while the count is below CCR:</p>
<div class="formula">duty = CCR / (ARR + 1)</div>
<p>PWM controls LED brightness, motor speed and, with a filter, can act as a simple DAC. Resolution is ARR + 1 steps, so a higher PWM frequency means fewer steps for the same clock.</p>
<h3>Input capture</h3>
<p>The timer copies the counter value into a register when an edge arrives on a pin. Two captures give the period or pulse width of a signal without busy loops.</p>
<h3>Watchdog</h3>
<p>A watchdog resets the chip unless the software "kicks" it in time. Kick it from one place that proves the whole system is alive (for example, after every task has checked in) - never from a timer interrupt, which keeps running even when the main code is stuck. A <b>window</b> watchdog also resets if you kick it too early.</p>`,
  takeaway: "Update rate = clock / ((PSC+1)(ARR+1)); PWM duty = CCR/(ARR+1). Input capture timestamps edges. Kick the watchdog only when the whole system is healthy.",
  quiz: [
    { q: "Timer clock 8 MHz, PSC = 7, ARR = 999. Update frequency?", o: ["1 kHz", "8 kHz", "1 MHz", "125 Hz"], a: 0, why: "8 MHz / 8 = 1 MHz; 1 MHz / 1000 = 1 kHz." },
    { q: "ARR = 99, CCR = 25. PWM duty?", o: ["25%", "24.75%", "75%", "4%"], a: 0, why: "25 / (99 + 1) = 25%." },
    { q: "Where should the watchdog be kicked?", o: ["In a 1 ms timer ISR", "In the main loop once all tasks report healthy", "At startup only", "In the HardFault handler"], a: 1, why: "A timer ISR keeps running when the main code hangs, hiding the fault." },
  ],
  practice: [],
},
{
  id: "e-adc", title: "ADC, sampling and DMA", mins: 11,
  sum: "Resolution, LSB size, Nyquist and why DMA beats an interrupt per sample.",
  body: `
<h3>ADC basics</h3>
<p>An N-bit ADC splits the reference voltage into 2<sup>N</sup> steps.</p>
<div class="formula">V = code × V<sub>ref</sub> / 2<sup>N</sup> &nbsp;&nbsp;&nbsp; 1 LSB = V<sub>ref</sub> / 2<sup>N</sup></div>
<p>A 12-bit ADC with 3.3 V reference: 1 LSB = 3.3 / 4096 ≈ 0.81 mV. A reading of 2048 means about 1.65 V. (Some datasheets use 2<sup>N</sup> - 1 in the denominator; the difference is one LSB.)</p>
<h3>ADC types</h3>
<table><tr><th>Type</th><th>Speed</th><th>Resolution</th><th>Typical use</th></tr>
<tr><td>Flash</td><td>fastest</td><td>low (6-8 bit)</td><td>scopes, radio</td></tr>
<tr><td>SAR</td><td>medium</td><td>10-16 bit</td><td>inside most MCUs</td></tr>
<tr><td>Sigma-delta</td><td>slow</td><td>16-24 bit</td><td>audio, precision sensors</td></tr></table>
<h3>Sampling</h3>
<p><b>Nyquist:</b> sample faster than twice the highest frequency in the signal, or high frequencies fold down and appear as false low frequencies (<b>aliasing</b>). Real designs sample several times faster and add an analog low-pass (anti-aliasing) filter before the ADC.</p>
<p>The ADC's sampling capacitor needs time to charge: high source impedance needs a longer sampling time or a buffer op-amp.</p>
<h3>DMA</h3>
<p>Direct Memory Access copies data between peripherals and memory without the CPU. Instead of one interrupt per ADC sample, DMA fills a whole buffer and interrupts once. In <b>circular mode</b> with half-transfer and transfer-complete interrupts, the CPU processes one half of the buffer while DMA fills the other ("ping-pong").</p>
<div class="callout warn">On cores with a data cache, invalidate or clean the cache around DMA buffers, or the CPU may see stale data.</div>`,
  takeaway: "1 LSB = Vref/2^N. Sample above twice the highest frequency and filter first. DMA moves samples without the CPU; circular mode with half/full interrupts gives double buffering.",
  quiz: [
    { q: "10-bit ADC, Vref = 5 V. Size of 1 LSB?", o: ["4.9 mV", "5 mV", "19.5 mV", "0.5 mV"], a: 0, why: "5 / 1024 ≈ 4.88 mV." },
    { q: "Signal content up to 4 kHz. Minimum sampling rate?", o: ["4 kHz", "8 kHz", "2 kHz", "16 kHz"], a: 1, why: "More than twice the highest frequency (Nyquist)." },
  ],
  practice: ["c-movavg"],
},
]},
{
  id: "em-proto", title: "Communication protocols", lessons: [
{
  id: "e-uart", title: "UART", mins: 10,
  sum: "Frame format, baud rate maths, parity and the physical layers RS-232 and RS-485.",
  demo: "uart",
  body: `
<p>UART is <b>asynchronous</b>: there is no clock wire. Both sides agree on the baud rate in advance, and every byte carries its own start and stop markers. It needs two wires (TX, RX) plus ground and is full-duplex.</p>
<h3>The frame</h3>
<p>Idle line = 1. Then: one <b>start bit</b> (0), 5-9 <b>data bits, LSB first</b>, an optional <b>parity bit</b>, and 1 or 2 <b>stop bits</b> (1). "8N1" means 8 data bits, no parity, 1 stop bit: 10 bits per byte.</p>
<div class="formula">bytes per second = baud / bits per frame &nbsp;→&nbsp; 115200 / 10 = 11520 B/s</div>
<h3>Clock accuracy</h3>
<p>The receiver re-syncs on every start bit and samples each bit in its middle (often using 16× oversampling). Over one 10-bit frame, the total mismatch between the two clocks must stay under about half a bit, so the combined baud error must be below roughly 2-5%. An internal RC oscillator can be too inaccurate at high baud rates.</p>
<h3>Errors</h3>
<ul><li><b>Parity error</b> - the parity bit does not match (catches single-bit errors).</li>
<li><b>Framing error</b> - the stop bit was not 1 (wrong baud rate, noise).</li>
<li><b>Overrun</b> - a new byte arrived before software read the last one. Fix with interrupts plus a ring buffer, or DMA.</li></ul>
<h3>Physical layers</h3>
<table><tr><th></th><th>TTL UART</th><th>RS-232</th><th>RS-485</th></tr>
<tr><td>Levels</td><td>0 / 3.3 V</td><td>±3 to ±15 V (inverted)</td><td>differential pair</td></tr>
<tr><td>Distance</td><td>cm</td><td>~15 m</td><td>~1200 m</td></tr>
<tr><td>Devices</td><td>2</td><td>2</td><td>up to 32+ on one bus</td></tr></table>`,
  takeaway: "UART has no clock: start bit, data LSB first, parity, stop. 8N1 = 10 bits per byte. Baud error must stay within a few percent. RS-485 is differential and goes far.",
  quiz: [
    { q: "9600 baud, 8N1. Bytes per second?", o: ["1200", "960", "9600", "1067"], a: 1, why: "10 bits per byte: 9600 / 10 = 960." },
    { q: "What does a framing error usually indicate?", o: ["Parity mismatch", "Wrong baud rate or noise", "Buffer overrun", "Missing pull-up"], a: 1, why: "The stop bit was sampled as 0, usually due to timing mismatch." },
  ],
  practice: ["c-ring", "c-binary"],
},
{
  id: "e-spi", title: "SPI", mins: 9,
  sum: "Four wires, a shared clock, and the four modes set by CPOL and CPHA.",
  body: `
<p>SPI is a <b>synchronous, full-duplex</b> bus with one master and one or more slaves. Signals: <b>SCLK</b> (clock from the master), <b>MOSI</b> (master out), <b>MISO</b> (master in) and one <b>chip select</b> (CS, active low) per slave.</p>
<p>It works like two shift registers joined in a ring: every clock, one bit leaves the master on MOSI and one bit arrives from the slave on MISO. To read a byte you must clock out a (dummy) byte.</p>
<h3>Modes</h3>
<table><tr><th>Mode</th><th>CPOL (idle clock)</th><th>CPHA</th><th>Data sampled on</th></tr>
<tr><td>0</td><td>0 (low)</td><td>0</td><td>rising edge</td></tr><tr><td>1</td><td>0</td><td>1</td><td>falling edge</td></tr>
<tr><td>2</td><td>1 (high)</td><td>0</td><td>falling edge</td></tr><tr><td>3</td><td>1</td><td>1</td><td>rising edge</td></tr></table>
<p>CPHA = 0 samples on the first clock edge, CPHA = 1 on the second. Master and slave must use the same mode - the number one reason a new SPI device returns garbage.</p>
<h3>Strengths and limits</h3>
<ul><li>Fast (tens of MHz), simple, no addressing overhead.</li>
<li>No acknowledgement: the master cannot tell if a slave is even present.</li>
<li>One CS pin per slave (or daisy-chaining), short distances only.</li></ul>`,
  takeaway: "SPI = SCLK, MOSI, MISO, CS. Full-duplex shift registers; reading needs clocking. Mode = CPOL/CPHA and must match the device. Fast but no ACK and one CS per slave.",
  quiz: [
    { q: "SPI mode 0 samples data on...", o: ["Falling edge", "Rising edge", "Both edges", "CS edge"], a: 1, why: "CPOL=0, CPHA=0: idle low, sample on the first (rising) edge." },
    { q: "How many wires for 3 SPI slaves (excluding ground)?", o: ["4", "5", "6", "7"], a: 2, why: "SCLK, MOSI, MISO shared + 3 chip selects = 6." },
  ],
  practice: [],
},
{
  id: "e-i2c", title: "I2C", mins: 11,
  sum: "Two open-drain wires, addressing, ACK/NACK, clock stretching and pull-up sizing.",
  body: `
<p>I2C uses two wires shared by many devices: <b>SDA</b> (data) and <b>SCL</b> (clock). Both are <b>open-drain</b> with pull-up resistors. It is half-duplex and slower than SPI (100 kHz standard, 400 kHz fast, 1 MHz fast-plus) but needs only two pins for dozens of devices.</p>
<h3>A transaction</h3>
<ol><li><b>START</b>: SDA falls while SCL is high.</li>
<li>7-bit <b>address</b> + <b>R/W</b> bit (0 = write).</li>
<li>The addressed device pulls SDA low for one clock: <b>ACK</b>. No device answering leaves it high: <b>NACK</b>.</li>
<li>Data bytes, each followed by ACK. When reading, the master NACKs the last byte.</li>
<li><b>STOP</b>: SDA rises while SCL is high.</li></ol>
<p>Reading a sensor register: START, addr+W, register number, <b>repeated START</b>, addr+R, read bytes, NACK, STOP. SDA may only change while SCL is low - except for START and STOP, which is how they are recognised.</p>
<h3>Clock stretching and arbitration</h3>
<p>A slow slave can hold SCL low to pause the master. With two masters, each checks that SDA really has the level it wrote; the one that writes 1 but sees 0 loses arbitration and backs off, without corrupting the other's message.</p>
<h3>Pull-up sizing</h3>
<p>The pull-up and the bus capacitance form an RC: rise time ≈ 0.85 × R × C (for the 30%→70% threshold). For 400 kHz the rise time limit is 300 ns; with 200 pF bus capacitance, R ≤ 300 ns / (0.85 × 200 pF) ≈ 1.7 kΩ. Too large a resistor gives slow edges; too small exceeds the pins' sink current.</p>`,
  takeaway: "I2C = SDA + SCL, open-drain with pull-ups, 7-bit addresses, ACK after every byte. START/STOP are SDA edges while SCL is high. Size pull-ups from rise time and bus capacitance.",
  quiz: [
    { q: "How is a START condition recognised?", o: ["SCL falls while SDA is high", "SDA falls while SCL is high", "SDA rises while SCL is high", "A special address"], a: 1, why: "Data normally changes only while SCL is low, so an SDA edge with SCL high is a marker." },
    { q: "Nobody pulls SDA low after the address byte. That is a...", o: ["Repeated start", "NACK", "STOP", "Clock stretch"], a: 1, why: "No ACK means no device with that address answered." },
  ],
  practice: ["c-crc8"],
},
{
  id: "e-can", title: "CAN bus", mins: 10,
  sum: "Differential signalling, non-destructive arbitration, frames and error confinement.",
  body: `
<p>CAN connects ECUs in cars and machines. It is a multi-master bus on a <b>differential pair</b> (CAN_H, CAN_L), terminated with a <b>120 Ω resistor at each end</b> (60 Ω total between the wires). Differential signalling rejects noise picked up equally on both wires.</p>
<h3>Dominant and recessive</h3>
<p>A <b>dominant</b> bit (logical 0) actively drives the pair apart; a <b>recessive</b> bit (logical 1) lets it float back. If anyone sends dominant, the bus is dominant - a wired-AND, like I2C.</p>
<h3>Arbitration</h3>
<p>Messages carry an identifier, not a destination. Nodes start sending together and compare each bit they send with the bus. A node sending recessive (1) that reads dominant (0) has lost and stops. So the <b>lowest ID wins</b>, and the winner's frame is not damaged ("non-destructive" arbitration). Lower ID = higher priority.</p>
<h3>Frame (classic CAN, standard 11-bit ID)</h3>
<p>SOF, 11-bit ID, RTR, control (including DLC, the data length 0-8), 0-8 data bytes, 15-bit CRC, ACK slot, EOF. CAN FD raises the payload to 64 bytes and switches to a faster bit rate during the data phase.</p>
<h3>Bit stuffing and errors</h3>
<p>After five identical bits, the transmitter inserts one opposite bit so receivers keep resynchronising; receivers remove it. Every node checks CRC, form, stuffing and ACK. Error counters move a misbehaving node from error-active to error-passive and finally <b>bus-off</b>, so one faulty node cannot jam the bus.</p>`,
  takeaway: "CAN: differential pair, 120 Ω at each end, dominant 0 beats recessive 1, lowest ID wins arbitration without damage, bit stuffing after 5 equal bits, error counters lead to bus-off.",
  quiz: [
    { q: "IDs 0x123 and 0x0F0 start transmitting together. Who wins?", o: ["0x123", "0x0F0", "Both retry", "Neither"], a: 1, why: "The lower ID has the first dominant bit where they differ." },
    { q: "Resistance measured between CAN_H and CAN_L on a correctly terminated, unpowered bus?", o: ["120 Ω", "60 Ω", "240 Ω", "0 Ω"], a: 1, why: "Two 120 Ω resistors in parallel." },
  ],
  practice: [],
},
]},
{
  id: "em-rtos", title: "RTOS", lessons: [
{
  id: "e-rtos-tasks", title: "Tasks, states and scheduling", mins: 11,
  sum: "What an RTOS adds over a super-loop, task states, preemption and context switching.",
  body: `
<p>A <b>super-loop</b> (<code>while(1)</code> calling functions in turn) is fine until one slow job delays an urgent one. An RTOS splits the work into <b>tasks</b>, each with its own stack and a <b>priority</b>, and a scheduler decides which runs.</p>
<h3>Real-time means deterministic</h3>
<p>Not "fast" - predictable. A <b>hard</b> real-time deadline must never be missed (airbag, motor commutation); <b>soft</b> real-time degrades gracefully (video frames).</p>
<h3>Task states</h3>
<ul><li><b>Running</b> - on the CPU (one task per core).</li>
<li><b>Ready</b> - could run, waiting for the CPU.</li>
<li><b>Blocked</b> - waiting for time, a queue, a semaphore or an event.</li>
<li><b>Suspended</b> - removed from scheduling until resumed.</li></ul>
<h3>Preemptive priority scheduling</h3>
<p>FreeRTOS by default always runs the <b>highest-priority ready task</b>. When a higher-priority task becomes ready (for example, an ISR gives it a semaphore), it preempts the running task immediately. Tasks of equal priority share the CPU by <b>time slicing</b> on each tick. A high-priority task that never blocks <b>starves</b> everything below it - tasks should block while waiting, not busy-poll.</p>
<h3>Context switch</h3>
<p>The scheduler saves the running task's registers on its stack, stores its stack pointer in the task control block (TCB), picks the next task, restores its stack pointer and registers. On Cortex-M this happens in the lowest-priority <b>PendSV</b> exception so it never interrupts another ISR, and the periodic <b>SysTick</b> provides the tick. Tasks run on the process stack (PSP); ISRs and the kernel use the main stack (MSP).</p>`,
  takeaway: "An RTOS runs the highest-priority ready task; equal priorities time-slice. Tasks must block when waiting or they starve others. Context switches save registers to the task's stack (PendSV on Cortex-M).",
  quiz: [
    { q: "Task priorities 1, 2, 3 are all ready (3 = highest). Which runs?", o: ["1", "2", "3", "They round-robin"], a: 2, why: "Preemptive priority scheduling runs the highest ready task." },
    { q: "A task waiting on an empty queue is in which state?", o: ["Ready", "Running", "Blocked", "Suspended"], a: 2, why: "Waiting for an event = Blocked; it uses no CPU." },
  ],
  practice: [],
},
{
  id: "e-rtos-sync", title: "Mutexes, semaphores and priority inversion", mins: 12,
  sum: "Protecting shared resources, signalling between tasks, and the bug that hit Mars Pathfinder.",
  body: `
<h3>Mutex - protect a shared resource</h3>
<p>A mutex has an <b>owner</b>: the task that takes it must give it back. Use it around a shared UART, I2C bus or data structure. FreeRTOS mutexes include <b>priority inheritance</b>.</p>
<h3>Semaphore - signal an event or count resources</h3>
<p>A <b>binary semaphore</b> has no owner; one task (or ISR) gives, another takes. Classic use: an ISR gives the semaphore, a task waiting on it wakes up and does the work. A <b>counting semaphore</b> tracks N identical resources, such as free buffers.</p>
<table><tr><th></th><th>Mutex</th><th>Binary semaphore</th></tr>
<tr><td>Owner</td><td>yes - only the taker releases</td><td>no</td></tr><tr><td>Priority inheritance</td><td>yes</td><td>no</td></tr>
<tr><td>Use from ISR</td><td>no</td><td>give: yes</td></tr><tr><td>Purpose</td><td>mutual exclusion</td><td>signalling</td></tr></table>
<h3>Priority inversion</h3>
<p>Low task L holds a mutex. High task H wants it and blocks. Now medium task M (which does not need the mutex) becomes ready and preempts L. H is now effectively waiting for M - a lower priority task - possibly forever.</p>
<p><b>Fix: priority inheritance.</b> While L holds a mutex that H wants, L temporarily runs at H's priority, so M cannot preempt it. L finishes, releases the mutex, drops back, and H runs. (Alternative: priority ceiling.) This exact bug caused repeated resets on Mars Pathfinder in 1997 until inheritance was switched on remotely.</p>
<h3>Deadlock</h3>
<p>Task A holds mutex 1 and waits for 2; task B holds 2 and waits for 1. Four conditions are needed: mutual exclusion, hold-and-wait, no preemption, circular wait. Break one - the usual fix is to <b>always take locks in the same global order</b>, or to use timeouts.</p>`,
  takeaway: "Mutex = ownership + priority inheritance, for shared resources. Semaphore = signalling or counting, can be given from an ISR. Priority inversion is fixed by inheritance; deadlock by consistent lock order.",
  quiz: [
    { q: "An ISR must wake a processing task. Best primitive?", o: ["Mutex", "Binary semaphore or task notification", "Spin loop", "Recursive mutex"], a: 1, why: "Signalling from an ISR; mutexes cannot be used from ISRs." },
    { q: "Priority inheritance raises the priority of...", o: ["The highest task", "The task holding the mutex", "The medium task", "The idle task"], a: 1, why: "The holder runs at the waiter's priority until it releases the mutex." },
  ],
  practice: [],
},
{
  id: "e-rtos-comm", title: "Queues, ISR deferral and stacks", mins: 10,
  sum: "Passing data safely between tasks and ISRs, and sizing task stacks.",
  body: `
<h3>Queues</h3>
<p>A queue is a thread-safe FIFO. FreeRTOS copies items <b>by value</b> into the queue, so the sender can reuse its variable straight away. A task waiting to receive from an empty queue blocks (no CPU use) until data arrives or a timeout expires. Sending to a full queue can block too.</p>
<h3>From an ISR</h3>
<p>ISRs must never block, so they use the <code>...FromISR</code> API variants (<code>xQueueSendFromISR</code>, <code>xSemaphoreGiveFromISR</code>). These report whether a higher-priority task was woken; the ISR then requests a context switch at exit so that task runs immediately instead of at the next tick.</p>
<pre class="code">void ADC_IRQHandler(void) {
  BaseType_t woken = pdFALSE;
  uint16_t s = ADC1-&gt;DR;
  xQueueSendFromISR(adcQueue, &amp;s, &amp;woken);
  portYIELD_FROM_ISR(woken);
}</pre>
<p>This is <b>deferred interrupt processing</b>: the ISR grabs data and leaves; a task does the slow work at a normal priority.</p>
<h3>Other tools</h3>
<ul><li><b>Event groups</b> - wait for several conditions ("Wi-Fi up AND sensor ready").</li>
<li><b>Task notifications</b> - a lighter, faster signal sent directly to one task.</li>
<li><b>Software timers</b> - callbacks run in the timer service task; they must never block.</li></ul>
<h3>Stack sizing</h3>
<p>Every task has its own stack. Too small and it silently overwrites memory. Measure: start generous, run all paths, read the high-water mark (<code>uxTaskGetStackHighWaterMark</code>), keep a margin, and enable stack-overflow checking during development. Large local buffers and printf-style functions are the usual stack hogs.</p>`,
  takeaway: "Queues copy data and let tasks block while waiting. ISRs use the FromISR API and yield to the woken task. Measure stack usage with the high-water mark.",
  quiz: [
    { q: "Why does FreeRTOS have xQueueSendFromISR?", o: ["It is faster", "ISRs must never block and need special handling of context switches", "To send larger items", "For debugging only"], a: 1, why: "The ISR versions never block and report whether a switch is needed." },
    { q: "Best way to find a task's real stack need?", o: ["Guess 1 KB", "Measure the high-water mark under worst-case use", "Use the heap", "Disable interrupts"], a: 1, why: "The high-water mark shows the most stack ever used." },
  ],
  practice: ["c-ring"],
},
]},
{
  id: "em-debug", title: "Debugging and low power", lessons: [
{
  id: "e-debug", title: "Debugging firmware and saving power", mins: 10,
  sum: "SWD/JTAG, decoding a HardFault, tools on the bench, and sleep modes for battery devices.",
  body: `
<h3>Debug interfaces</h3>
<p><b>JTAG</b> (4-5 pins) and ARM's <b>SWD</b> (2 pins: SWDIO, SWCLK) let a probe halt the core, set breakpoints, step, and read memory and registers. Flash code can only hold a few hardware breakpoints; <b>watchpoints</b> stop when a variable is written - ideal for "who is corrupting this?"</p>
<h3>HardFault</h3>
<p>Common causes: dereferencing a NULL or invalid pointer, stack overflow, an unaligned access, executing from an invalid address, or calling a function through a corrupted pointer. To find the culprit, read the stacked PC (where the fault happened) and LR from the exception stack frame, and the fault status registers (CFSR, HFSR, MMFAR/BFAR).</p>
<h3>Bench tools</h3>
<ul><li><b>Logic analyzer</b> - decodes UART/SPI/I2C and shows timing between signals.</li>
<li><b>Oscilloscope</b> - analog shape: ringing, slow edges, noise, power rails.</li>
<li><b>GPIO toggling</b> - set a pin high at ISR entry and low at exit to measure duration and jitter with a scope. Much cheaper than printf.</li>
<li><b>printf</b> over UART is slow and changes timing; fine for slow paths, misleading for races.</li></ul>
<h3>Low-power basics</h3>
<p>Average current decides battery life. Example: 20 mA for 50 ms every 10 s, 5 µA otherwise ≈ 20 × 0.005 + 0.005 ≈ <b>0.105 mA</b>. A 1000 mAh battery then lasts about 9500 hours.</p>
<ul><li>Sleep: core stops, peripherals run, fast wake-up.</li><li>Stop/deep sleep: most clocks off, RAM kept, wake on interrupt or RTC.</li>
<li>Standby/shutdown: almost everything off, RAM lost, wake resets the chip.</li></ul>
<p>Also: turn off unused peripheral clocks, never leave inputs floating, lower the clock or voltage, and finish work fast then sleep ("race to sleep").</p>`,
  takeaway: "Use SWD breakpoints and watchpoints; decode HardFaults from the stacked PC and fault registers; measure timing with GPIO toggles. Battery life follows average current: sleep deeply and wake briefly.",
  quiz: [
    { q: "Best tool to find which code writes a corrupted global?", o: ["printf", "Data watchpoint", "Oscilloscope", "Watchdog"], a: 1, why: "A watchpoint halts the core on the exact write." },
    { q: "10 mA for 1 s each minute, 10 µA otherwise. Average current?", o: ["About 0.18 mA", "10 mA", "1 mA", "0.01 mA"], a: 0, why: "10/60 ≈ 0.167 mA + ~0.01 mA ≈ 0.18 mA." },
  ],
  practice: [],
},
]},
  ],
};
