// Study path from the Embedded Tracker (same text format, same tick ids).
export const TRACKER_PATH = String.raw`
# res | Resume Projects | Weeks 1-3 | resume | Half of every interview is your own projects. Master these first, out loud.
## Fix the resume
- Cut off-target projects | Remove or shrink AetherAgents, Quantum gates, AQI routing; keep 4-5 hardware projects | Rewrite your project list with only hardware and firmware work. Is it still one page?
- Remove 'vibe coding' from skills | Why it hurts for hardware roles; one honest line about using AI tools | Write the one sentence you will say if asked "Do you use AI tools to code?"
- Add M.S. CGPA | Companies filter on CGPA | Add it to the PDF and the website.
- A number on every project | Nodes, months deployed, data rate, accuracy, power, uptime | Write one number for every project line. Any line without a number?
- Back up every listed skill | STM32 and CAN are listed but no project uses them | Build a small STM32 register-level UART + timer + interrupt demo, or remove the claim.
- PDF matches the website | Dates, titles, project names | Compare both line by line and fix every mismatch.
## Air-quality RTOS device
- Block diagram | MCU, sensors, buses, power, storage, network, cloud | Draw the full device from memory in 3 minutes, labelling every bus.
- Part and interface choices | SDS011 on UART, AHT10 on I2C, ESP32 vs STM32 | For every part give one reason and one alternative you rejected.
- Task design | Every FreeRTOS task with priority, period, stack size | What breaks if the network task gets the highest priority?
- Inter-task communication | Where you used queue, mutex, semaphore, event group | Point to one place where a race condition could happen and how you prevented it.
- Fault tolerance | Wi-Fi drop, dead sensor, full SD card, brown-out | Walk through what your firmware does when Wi-Fi is down for 2 hours.
- Numbers | Devices, months deployed, sample rate, uptime, data loss | Write all numbers on one card and memorise them.
- Hardest bug | Symptom, guesses, how you narrowed it, root cause, fix, prevention | Tell it in under 2 minutes, recorded on your phone.
## Wi-SUN mesh
- Why Wi-SUN | Compare with Zigbee, LoRaWAN, Wi-Fi on range, rate, power, mesh | Make a 4-row comparison table from memory.
- FFN, LFN, border router | Role of each; what happens when a parent dies | Explain mesh healing in 3 sentences.
- Routing basics (RPL) | DODAG, parent selection, upward and downward routes | Draw how a packet reaches the border router from a 3-hop node.
- Relay control path | Dashboard to relay, every hop and protocol, latency | Trace one "relay ON" command and say where the time is spent.
## Smart water meter
- Pipeline | Capture, crop, model, post-processing, upload | Draw the pipeline and say where each stage runs.
- Model on device | Model size, input size, inference time, accuracy, trade-offs | How did you make the model fit? What did you give up?
- Failure cases | Glare, condensation, rolling digits | How does the system handle a digit halfway between 3 and 4?
- oneM2M in one minute | What it is, why not plain MQTT | Explain oneM2M to someone who never heard of it.
## Test jig and PCB
- Schematic walkthrough | Power entry, protection, level shifting, connectors, Pi interface | Explain your schematic block by block in 3 minutes.
- PCB decisions | Layers, decoupling placement, power and ground routing | Why is each decoupling cap placed where it is?
- Revision A mistakes | What was wrong, how found, how fixed | Tell the story of your first board's mistake.
## Digital twin
- Plain explanation | What it does, without buzzwords | Explain it in two simple sentences.
- Safety of remote control | Interlocks in firmware and cloud | What stops a bad command from running a pump dry?
- Your part vs team's part | Exactly what you built | Say it in one clear sentence.
## Your stories
- Tell me about yourself | Education, SCRC work, 2 best projects, why this role | Record a 90-second version and cut filler words.
- Three STAR stories | Hard bug, teamwork or deadline, a failure | Write each as Situation, Task, Action, Result.
- Papers and awards | 30 seconds per paper: problem, your work, result | Explain each paper to a non-expert.
- Why this company | Link your projects to their products | Write 3 sentences for your top company.

# c | C Programming for Embedded | Weeks 1-3 | study | The most asked topic in every embedded interview. Write code for every item.
## Basics
- Data types and sizes | char, short, int, long, float, double, stdint types (uint8_t etc.), sizeof, platform dependence | What is sizeof(int) on an 8-bit AVR vs a 32-bit ARM? ;; Why do embedded engineers prefer uint32_t over int?
- Signed vs unsigned | Two's complement, ranges, overflow and wrap-around, comparison traps | What does (unsigned)-1 > 1 give? ;; Range of int8_t and uint8_t?
- Type conversion | Implicit promotion, integer promotion, explicit casting, truncation | char a=200, b=100; int c = a+b; what is c if char is signed?
- Operators | Arithmetic, relational, logical vs bitwise, precedence, associativity, short-circuit | Value of x after: int x=5; x = x++ + ++x; (explain why it is undefined)
- Storage classes | auto, static, extern, register; scope, lifetime, linkage | A static local variable in a function called 3 times; what does it print?
## Pointers
- Pointer basics | Address-of, dereference, pointer declaration, pointer size | int a=10; int *p=&a; *p=20; what is a? ;; sizeof(char*) on 32-bit?
- Pointer arithmetic | Adding to pointers, scaling by type size, difference of pointers | int arr[5]; int *p=arr; what address is p+3 if arr is at 0x1000?
- Pointers and arrays | Array decay, arr vs &arr, arr[i] equals *(arr+i) | Difference between sizeof(arr) and sizeof(p)?
- Pointer to pointer | Double pointers, changing a pointer inside a function | Write a function that allocates memory and returns it through a parameter.
- const with pointers | const int *p, int *const p, const int *const p | Which of the three can change the value, and which can change the address?
- void and NULL pointers | Generic pointers, casting, NULL, dangling, wild pointers | Show one dangling pointer bug and fix it.
- Function pointers | Declaration, calling, arrays of function pointers, callbacks | Write a calculator using an array of function pointers.
## Memory
- Memory layout | text, data, bss, heap, stack; where each variable lives | For a given program, mark where each variable is stored.
- Stack vs heap | Allocation, speed, size, overflow | Why is recursion dangerous on a microcontroller?
- Dynamic allocation | malloc, calloc, realloc, free; leaks; fragmentation | Why do many embedded projects ban malloc after startup?
## Data layout
- Structures | Declaration, access, pointers to structs, arrow operator | Write a struct for a sensor reading and pass it by pointer.
- Unions | Shared memory, size of union, use cases | Use a union to split a uint32_t into 4 bytes.
- Padding and alignment | Why padding exists, reordering members, packed structs | sizeof(struct {char a; int b; char c;})? How to reduce it?
- Bit-fields | Syntax, portability problems | Model an 8-bit status register using bit-fields.
- Endianness | Big vs little endian, checking at runtime, byte swapping | Write a function to detect endianness. ;; Swap bytes of a uint32_t.
- enum and typedef | Named constants, typedef for clarity | Write a typedef enum for traffic light states.
## Bit manipulation
- Bitwise operators | AND, OR, XOR, NOT, left and right shift | Compute 0x5A & 0x0F, 0x5A | 0x0F, 0x5A ^ 0xFF.
- Set, clear, toggle, check | Macros for each operation on bit n | Write SET_BIT, CLEAR_BIT, TOGGLE_BIT, CHECK_BIT macros.
- Masks and register fields | Read and write a multi-bit field without touching others | Set bits 4-6 of a register to 0b101 without changing other bits.
- Shifts | Logical vs arithmetic shift, shifting signed numbers | What is -8 >> 1? Why is it implementation defined?
- Bit tricks | Count set bits, power of 2 check, swap without temp, reverse bits, lowest set bit | Check if n is a power of 2 in one line. ;; Reverse the bits of a byte.
## Embedded keywords
- volatile | Why compilers optimise away reads, hardware registers, ISR shared flags | Show a loop that hangs without volatile and works with it.
- const | Read-only data, flash placement, const vs #define | Where does a const global array get stored on a microcontroller?
- Macros vs inline | Macro pitfalls, parentheses, side effects, inline functions | What does SQUARE(a+1) give with #define SQUARE(x) x*x?
- Header files and extern | Header guards, declaring vs defining, multiple definition errors | Share a global variable between two .c files correctly.
- static in embedded | File-scope static, static functions, hiding | Why make driver helper functions static?
## Strings
- Strings in C | char arrays, null terminator, string literals in flash | Difference between char s[]="hi" and char *s="hi"?
- Write string functions | strlen, strcpy, strcmp, strcat by hand | Implement my_strlen and my_strcmp.
- memcpy vs memmove | Overlapping memory | Implement memmove that handles overlap.
- atoi and itoa | Number to string and back | Implement atoi with sign handling.
## Output and tricky questions
- Predict the output | sizeof tricks, ++ and --, pointer and array puzzles | Solve 20 "predict the output" C questions from a question bank.
- Undefined behaviour | Signed overflow, uninitialised variables, out-of-bounds | List 5 kinds of undefined behaviour with examples.
- Recursion | Base case, stack frames, factorial, fibonacci | Write factorial recursively and iteratively. Which is safer on an MCU?

# dsa | DSA in C | Week 4 | study | Coding rounds for embedded roles use easy-medium problems in C. Write each one by hand.
## Complexity
- Big-O notation | O(1), O(log n), O(n), O(n log n), O(n^2); best, average, worst case | Find the time complexity of a nested loop where the inner loop runs i times.
- Time vs space | Trading memory for speed, in-place algorithms | Why might you pick a slower algorithm on a microcontroller?
## Arrays
- Array basics | Traversal, insertion, deletion, reverse | Reverse an array in place.
- Classic array problems | Largest, second largest, missing number, duplicates | Find the missing number in 1..n in O(n) without extra memory.
- Two pointers | Pair with given sum in sorted array, remove duplicates | Find a pair with sum 10 in a sorted array.
- Sliding window | Max sum subarray of size k, moving average | Compute a moving average of the last 8 ADC samples efficiently.
- Rotation | Rotate array by k | Rotate an array left by k positions in place.
## Strings
- Palindrome and reverse | Two-pointer checks, reverse words | Reverse the words in "hello embedded world".
- Anagram and counting | Frequency arrays | Check if two strings are anagrams in O(n).
- Substring search | Naive search, find first occurrence | Implement strstr.
## Searching and sorting
- Linear and binary search | Conditions, iterative binary search | Write binary search; what is its complexity?
- Simple sorts | Bubble, selection, insertion; stability | Sort 5 numbers by hand with insertion sort, showing each pass.
- Merge and quick sort | Divide and conquer, complexity, in-place | Which sort would you use on a microcontroller with little RAM and why?
## Stack, queue, ring buffer
- Stack | Array implementation, push, pop, overflow | Check balanced brackets using a stack.
- Queue | Array implementation, enqueue, dequeue | Implement a queue using two stacks.
- Circular (ring) buffer | Head, tail, full vs empty, power-of-2 size, ISR-safe use | Write a UART receive ring buffer used by an ISR and main loop.
## Linked list
- Singly linked list | Node struct, insert at head and tail, delete, traverse | Write insert and delete for a singly linked list.
- Reverse a list | Iterative and recursive | Reverse a linked list iteratively.
- Middle and loop | Slow and fast pointers, Floyd cycle detection | Find the middle node. ;; Detect a loop.
- Merge and doubly linked | Merge two sorted lists, doubly linked list | Merge two sorted linked lists.
## Hashing and trees basics
- Hash tables | Hash function, collisions, chaining | Find the first non-repeating character in a string.
- Binary tree | Inorder, preorder, postorder traversal | Write inorder traversal recursively.
- Binary search tree | Insert, search, height | Insert 50, 30, 70, 20, 40 into a BST and draw it.

# mcu | Microcontroller and ARM Cortex-M | Weeks 5-6 | study | How the chip actually runs your code. Semiconductor companies ask this deeply.
## Basics
- Microprocessor vs microcontroller | CPU only vs CPU + memory + peripherals on one chip | Give 4 differences and one example of each.
- Harvard vs von Neumann | Separate vs shared buses for code and data | Which one does Cortex-M use? What is modified Harvard?
- Memory map | Flash, SRAM, peripheral region, system region, addresses | Where is flash and SRAM on an STM32F4? Why are peripherals memory mapped?
- Buses | AHB, APB, bus matrix, clock per bus | Why are slow peripherals on APB?
- Clock system | HSI, HSE, PLL, prescalers, clock tree | Configure 168 MHz from an 8 MHz crystal: what PLL values?
## Cortex-M core
- Register set | R0-R12, SP, LR, PC, xPSR | What does LR hold after a function call?
- Thumb instruction set | 16 and 32-bit instructions, why Thumb | Why does Cortex-M only run Thumb?
- Modes and privilege | Thread vs handler mode, privileged vs unprivileged | Which mode does an ISR run in?
- MSP and PSP | Two stack pointers, why an RTOS uses PSP | Who uses MSP and who uses PSP in FreeRTOS?
## Boot process
- Reset sequence | What happens from power-on to main | List the steps from reset to main().
- Vector table | Initial SP, reset handler, exception vectors, VTOR | What are the first two words of the vector table?
- Startup code | Copy .data, zero .bss, call SystemInit, call main | Why must .bss be zeroed before main?
- Linker script | MEMORY, SECTIONS, .text, .data, .bss, LMA vs VMA | Why does .data have a load address in flash and a run address in RAM?
- Bootloader | What it does, jumping to application, relocating vector table | Write the steps to jump from a bootloader to an app at 0x08008000.
## Interrupts
- Interrupt vs polling | Latency, CPU use, when to use each | A button pressed once a minute: poll or interrupt? Why?
- ISR rules | Short, no blocking, volatile flags, no printf | List 5 things you must never do in an ISR.
- NVIC and priority | Priority levels, preemption vs sub-priority, lower number = higher priority | Two interrupts arrive together with priority 2 and 5. Which runs first?
- Nesting and tail-chaining | Preemption, tail-chaining, late arrival | What is tail-chaining and why does it save time?
- Interrupt latency | Stacking, 12-cycle entry, what adds latency | What makes interrupt latency worse in your code?
- Exceptions | SysTick, PendSV, SVC, HardFault and causes | Name 3 causes of a HardFault and how you would debug one.
## Peripherals
- GPIO | Input, output, push-pull, open-drain, pull-up, pull-down, alternate function | When must you use open-drain? ;; Configure PA5 as output with registers.
- External interrupts | Edge trigger, EXTI lines, debounce | Write a button interrupt with software debounce.
- Timers | Prescaler, auto-reload, counter, update event | Timer clock 16 MHz: find PSC and ARR for a 1 ms interrupt.
- PWM | Duty cycle, frequency, resolution | Make a 1 kHz PWM with 25% duty from a 72 MHz timer clock.
- Input capture | Measure frequency and pulse width | How would you measure a 10 kHz signal's frequency?
- Watchdog | Independent vs window watchdog, kicking strategy | Where should you kick the watchdog, and where never?
## ADC, DAC, DMA, power
- ADC | Resolution, Vref, sampling time, conversion formula, SAR ADC | 12-bit ADC, Vref 3.3 V, reading 2048: what voltage?
- DAC | Resolution, output formula | 10-bit DAC with 5 V reference: smallest step?
- DMA | Peripheral to memory, memory to memory, circular mode, half and full interrupts | Use DMA to fill an ADC buffer continuously. Why is it better than an ISR per sample?
- Low-power modes | Sleep, stop, standby, wake-up sources | Battery device sampling once a minute: which mode between samples?
## Register-level programming
- Reading the reference manual | Finding a peripheral's registers and bits | Find the GPIO MODER register for STM32 and explain its bits.
- Register-level driver | Enable clock, configure, read and write registers | Blink an LED with no HAL, only registers.
- HAL vs registers | Pros and cons, what interviewers expect | When would you skip the HAL?

# proto | Communication Protocols | Week 7 | study | UART, SPI, I2C and CAN are asked in almost every embedded interview. Draw waveforms.
## Basics
- Serial vs parallel | Wires, speed, skew, distance | Why did serial replace parallel for long links?
- Synchronous vs asynchronous | Shared clock vs agreed baud rate | Is UART synchronous? Is SPI?
- Duplex | Simplex, half-duplex, full-duplex | Which of UART, SPI, I2C are full-duplex?
- Baud rate vs bit rate | Symbols vs bits, overhead | UART at 115200 baud, 8N1: how many bytes per second?
- Open-drain and pull-ups | Wired-AND, why I2C needs pull-ups | What happens on I2C if pull-ups are missing?
## UART
- UART frame | Idle, start bit, data bits, parity, stop bits | Draw the waveform for 0x55 in 8N1.
- Baud rate calculation | Baud divisor, clock error tolerance | 16 MHz clock, 16x oversampling, 9600 baud: divisor and error?
- Parity and errors | Even and odd parity, framing error, overrun error | Even parity bit for 0b1011001?
- Physical layers | TTL, RS-232, RS-485 | Why does RS-485 go further than RS-232?
## SPI
- SPI signals | SCLK, MOSI, MISO, CS, master and slave | Draw the 4 signals for sending one byte.
- SPI modes | CPOL, CPHA, modes 0-3 | In mode 0, on which edge is data sampled?
- Multiple slaves | Separate CS lines vs daisy chain | 4 sensors on SPI: how many pins needed?
- SPI speed and limits | Clock speed, no ACK, distance | SPI at 10 MHz: time to send 256 bytes?
## I2C
- I2C signals | SDA, SCL, open-drain | Why can two devices never short each other on I2C?
- Start, stop, repeated start | Conditions on SDA while SCL high | Draw start and stop conditions.
- Addressing and ACK | 7-bit and 10-bit addresses, read/write bit, ACK and NACK | Write the bytes sent to read 2 bytes from register 0x10 of device 0x68.
- Clock stretching and arbitration | Slave holds SCL low, multi-master arbitration | How does a slave slow down the master?
- Speeds and pull-up sizing | 100k, 400k, 1M; bus capacitance, rise time | Bus capacitance 200 pF, rise time 1 us: maximum pull-up?
## CAN
- CAN physical layer | CAN_H, CAN_L, differential, dominant and recessive, 120 ohm termination | Why two 120 ohm resistors? What is the bus resistance?
- CAN frame | SOF, ID, RTR, control, data, CRC, ACK, EOF; standard vs extended | Draw a standard CAN frame with field sizes.
- Arbitration | Lowest ID wins, non-destructive | IDs 0x123 and 0x0F0 transmit together. Who wins?
- Bit stuffing and errors | Stuffing after 5 equal bits, error frames, error counters, bus-off | Stuff this bit stream: 1111110000011.
- CAN FD | Faster data phase, 64-byte payload | Two differences between CAN and CAN FD.
## Comparison and others
- UART vs SPI vs I2C vs CAN | Wires, speed, distance, devices, use cases | Build the comparison table from memory.
- USB basics | Host and device, enumeration, endpoints, speeds | What happens when you plug in a USB device?
- Wireless overview | BLE, Wi-Fi, LoRa, Zigbee, Wi-SUN: range, power, rate | Pick a wireless link for a battery sensor reporting once an hour, and justify.

# rtos | RTOS (FreeRTOS) | Week 8 | study | You used FreeRTOS in your projects, so expect deep questions here.
## Concepts
- Super-loop vs RTOS | When a super-loop stops being enough | Give 2 signs a project needs an RTOS.
- Real-time | Hard vs soft vs firm real time, determinism | Is a car airbag hard or soft real time?
- Tasks | Task, TCB, stack per task, priority | What is stored in a Task Control Block?
- Task states | Running, ready, blocked, suspended | Draw the state diagram with the events that move between states.
## Scheduling
- Preemptive vs cooperative | Who decides when a task switches | Which one does FreeRTOS use by default?
- Priority scheduling | Highest ready task runs | Three tasks of priority 1, 2, 3 are ready. Which runs? What if 3 blocks?
- Time slicing | Round robin among equal priorities, tick | What happens with two equal-priority tasks that never block?
- Tick and context switch | SysTick, PendSV, saving and restoring registers | Why does FreeRTOS use PendSV for context switching?
- Starvation | Low priority task never runs | How do you prevent starvation?
## Synchronisation
- Critical section | Disabling interrupts, scheduler lock | When is disabling interrupts acceptable?
- Mutex | Ownership, lock and unlock, recursive mutex | Protect a shared UART with a mutex.
- Semaphores | Binary vs counting semaphores, signalling | Use a counting semaphore for 3 identical buffers.
- Mutex vs semaphore | Ownership, priority inheritance, use cases | Explain the difference in 3 points.
- Priority inversion | What it is, Mars Pathfinder, priority inheritance | Draw the timeline of priority inversion with tasks L, M, H.
- Deadlock | Four conditions, prevention | Two tasks and two mutexes: create a deadlock, then fix it.
## Communication
- Queues | Copy by value, blocking send and receive, queue length | Send sensor data from an ISR to a task with a queue.
- Event groups | Waiting on multiple bits | Wait until both Wi-Fi and sensor are ready.
- Task notifications | Lightweight signalling | Why are task notifications faster than semaphores?
- ISR to task | FromISR APIs, deferred interrupt processing, yield from ISR | Why must you use xQueueSendFromISR inside an ISR?
## Memory and robustness
- Stack sizing | Stack overflow, high-water mark, overflow hooks | How do you find the right stack size for a task?
- Heap schemes | heap_1 to heap_5 | Which heap scheme avoids fragmentation completely?
- Software timers | Timer service task, one-shot vs auto-reload | Why must timer callbacks never block?
- Reentrancy | Reentrant functions, thread safety | Is strtok reentrant? Why does it matter?

# circ | Circuits and Analog | Weeks 5-7 | study | Hardware interviews start here. Do every numerical on paper.
## Circuit laws
- Ohm's law and power | V = IR, P = VI, P = I^2 R | 5 V across 220 ohm: current and power?
- KVL and KCL | Loop and node equations | 12 V, 3k and 6k in series: current and voltage across each.
- Series and parallel | Equivalent resistance | 4 ohm, 6 ohm and 12 ohm in parallel: equivalent?
- Voltage and current dividers | Formulas, loading effect | Divide 12 V to 3.3 V for an ADC with real resistor values.
- Thevenin and Norton | Equivalent circuits, maximum power transfer | Find the Thevenin equivalent of a divider with a load.
## Capacitors and inductors
- Capacitor | Charge, Q = CV, energy, series and parallel | Two 10 uF caps in series: total? In parallel?
- RC charging | Time constant tau = RC, 63% rule, 5 tau | R = 10k, C = 10 uF: tau, and time to reach 99%?
- RC filters | Low-pass, high-pass, cutoff f = 1/(2 pi R C) | Design a low-pass filter with 1 kHz cutoff.
- Inductor | V = L di/dt, energy, flyback | Why does a relay coil need a flyback diode?
- Decoupling capacitors | Why 100 nF near every IC, bulk vs bypass | Where do you place a decoupling cap and why?
## Diodes
- Diode basics | Forward drop, reverse bias, I-V curve | Diode with 0.7 V drop, 5 V supply, 1k resistor: current?
- Rectifiers | Half-wave, full-wave, bridge, ripple | Sketch the output of a bridge rectifier.
- Zener and LED | Zener regulation, LED current resistor | LED 2 V at 10 mA from 5 V: resistor value?
- Clippers and protection | Clamp diodes, TVS, reverse polarity protection | Protect an MCU input from 12 V spikes.
## Transistor as a switch
- BJT switch | Saturation, base resistor, current gain | Drive a 100 mA relay from a 3.3 V pin with a BJT (beta 100): base resistor?
- MOSFET switch | Logic-level MOSFET, Vgs, Rds(on), low-side switching | Why use a logic-level MOSFET with a 3.3 V MCU?
- Pull-up and pull-down | Floating inputs, resistor values | Why does a floating input read random values?
## Op-amps
- Ideal op-amp rules | Infinite gain, no input current, virtual short | State the two golden rules.
- Inverting and non-inverting | Gain formulas | Design a non-inverting amplifier with gain 11.
- Buffer, summing, difference | Voltage follower, adder, subtractor | Why put a buffer before an ADC?
- Comparator and Schmitt trigger | Hysteresis | Why does a noisy signal need a Schmitt trigger?
## ADC and DAC
- Sampling | Nyquist theorem, aliasing, anti-alias filter | Signal up to 3 kHz: minimum sampling rate?
- Resolution and quantisation | LSB = Vref / 2^N, quantisation error | 10-bit ADC, 5 V Vref: LSB size?
- ADC types | SAR, flash, sigma-delta, dual slope | Which ADC is fastest? Which is most accurate?
- DAC types | R-2R ladder, weighted resistor | Draw a 3-bit R-2R DAC.
## Power supply
- LDO vs buck converter | Efficiency, noise, heat, dropout | 12 V to 3.3 V at 500 mA with an LDO: power wasted?
- Battery basics | mAh, Li-ion voltage range, battery life calculation | 2000 mAh battery, 5 mA average: life in days?
- Power budget | Sleep current, active current, duty cycle | Device uses 50 mA for 1 s every minute and 10 uA otherwise: average current?

# semi | Semiconductors and CMOS | Weeks 8-10 | study | From the atom to the CMOS gate. Each level builds on the one before.
## Level 1 - Semiconductor fundamentals
- Atoms and electrons | Atom structure, valence electrons, why silicon has 4 | How many valence electrons do silicon, boron and phosphorus have?
- Silicon and covalent bonds | Crystal lattice, covalent bonding | Why is pure silicon a poor conductor at 0 K?
- Energy bands | Valence band, conduction band, band gap; conductor vs semiconductor vs insulator | Band gap of Si and Ge in eV? Why does Ge leak more?
- Intrinsic semiconductor | Electron-hole pairs, ni, temperature effect | What happens to conductivity when temperature rises?
- Doping and extrinsic semiconductors | N-type (donors), P-type (acceptors), majority and minority carriers | Silicon doped with phosphorus: which type, which majority carrier?
- Electrons and holes | Hole concept, mass-action law n*p = ni^2 | ni = 1.5e10 /cm3, Nd = 1e16: find n and p.
## Level 2 - PN junction
- PN junction formation | Diffusion of carriers, recombination | What forms when P and N regions meet?
- Diffusion and drift | Two currents, concentration vs electric field | Which current dominates at equilibrium?
- Depletion region | Immobile ions, electric field, width vs doping | Which side does the depletion region extend into more if N is lightly doped?
- Built-in potential | Formula Vbi = VT ln(NaNd/ni^2) | Na = Nd = 1e16, ni = 1.5e10, VT = 26 mV: find Vbi.
- Forward and reverse bias | Depletion width change, I-V curve, diode equation | Use I = Is(e^(V/VT) - 1) with Is = 1e-14 A at V = 0.7 V.
- Breakdown | Avalanche vs Zener breakdown | Which breakdown happens in heavily doped junctions?
## Level 3 - Transistors
- Transistor concept | Switch and amplifier, three terminals | Why is a transistor called a current or voltage controlled device?
- BJT | NPN and PNP, regions, current gain beta, Ic = beta Ib | Ib = 20 uA, beta = 100: Ic and Ie?
- FET family | JFET vs MOSFET, voltage controlled | Two advantages of FET over BJT.
- MOSFET structure | Gate, source, drain, body, oxide, channel | Draw the cross-section of an NMOS transistor and label everything.
- Threshold voltage | What Vth is, what changes it | Why does a thinner oxide lower Vth?
## Level 4 - MOSFET operation
- NMOS and PMOS | Carriers, symbols, turning on | Which conducts when gate is high? Why is PMOS slower?
- Enhancement vs depletion | Normally off vs normally on | Which type is used in digital CMOS?
- Regions of operation | Cutoff, linear (triode), saturation; conditions using Vgs, Vds, Vth | Vgs = 2 V, Vth = 0.7 V, Vds = 0.5 V: which region?
- Drain current equations | Linear and saturation equations, k' and W/L | k'(W/L) = 2 mA/V^2, Vgs = 1.5 V, Vth = 0.5 V: saturation current?
- Channel formation and pinch-off | Inversion, pinch-off at saturation | Explain why current stops rising in saturation.
- Second-order effects | Body effect, channel length modulation, velocity saturation | How does body effect change Vth?
## Level 5 - CMOS logic
- CMOS inverter | PMOS pull-up, NMOS pull-down, VTC curve, switching point | Draw the inverter VTC and mark the regions of each transistor.
- Pull-up and pull-down networks | Series and parallel duality | Why are PMOS in parallel when NMOS are in series?
- NAND and NOR in CMOS | Transistor-level circuits, why NAND is preferred | Draw a 2-input CMOS NAND. Why is NAND faster than NOR?
- Complex gates | Building any function, transistor count | Draw the CMOS circuit for Y = NOT(A.B + C).
- AND, OR, XOR, XNOR | Built from NAND/NOR plus inverter, transistor counts | How many transistors in a CMOS AND gate?
- Transmission gate and tri-state | Pass transistors, TG, tri-state buffer | Why does an NMOS pass transistor pass a weak 1?
## Level 6 - Digital circuit behaviour
- Logic levels and noise margin | VIL, VIH, VOL, VOH, NMH, NML | VOH 3.3, VIH 2.0, VOL 0.4, VIL 0.8: find both noise margins.
- Propagation delay | tpLH, tpHL, tp average | tpLH = 40 ps, tpHL = 30 ps: tp?
- Rise and fall time | 10%-90% definition | Why is fall time usually faster than rise time?
- Fan-in and fan-out | Effect on delay | Why avoid NAND gates with fan-in of 8?
- Drive strength and loading | Sizing, load capacitance | What happens to delay when fan-out doubles?
- RC delay | Elmore delay, wire delay | R = 1k, C = 100 fF: RC delay?
## Level 7 - CMOS power
- Dynamic power | P = alpha C V^2 f | C = 1 nF, V = 1 V, f = 100 MHz, alpha = 0.1: power?
- Short-circuit power | Both transistors on during switching | Why do slow input edges increase short-circuit power?
- Static and leakage power | Subthreshold leakage, gate leakage | Why does leakage grow as technology shrinks?
- Reducing power | Clock gating, power gating, DVFS, multi-Vth | Halve the voltage: how much does dynamic power drop?

# de | Digital Electronics | Weeks 9-10 | study | The base of VLSI and computer architecture. Draw every circuit and solve every table.
## Level 1 - Number systems
- Binary, octal, hex | Place value, conversions between bases | Convert 156 to binary, octal, hex. ;; Convert 0xB7 to decimal.
- Signed numbers | Sign-magnitude, 1's complement, 2's complement, ranges | Represent -45 in 8-bit 2's complement.
- Binary arithmetic | Addition, subtraction using 2's complement, overflow detection | Compute 100 + 50 in 8-bit signed. Is there overflow?
- Codes | BCD, Gray code, excess-3, ASCII | Convert binary 1011 to Gray code and back.
- Fixed and floating point | Q format, IEEE 754 single precision basics | Represent 5.75 in IEEE 754 single precision.
## Level 2 - Logic gates
- Basic gates | AND, OR, NOT: symbol, expression, truth table | Draw symbols and truth tables for AND, OR, NOT.
- Derived gates | NAND, NOR, XOR, XNOR: symbol, expression, truth table | Draw all 4 truth tables. When is XOR output 1?
- Universal gates | Build NOT, AND, OR, XOR using only NAND, then only NOR | How many NAND gates make an XOR?
- Gate properties | Fan-in, fan-out, propagation delay, logic families TTL vs CMOS | Compare TTL and CMOS on power and speed.
## Level 3 - Boolean algebra
- Boolean laws | Identity, null, idempotent, complement, commutative, associative, distributive, absorption | Simplify A + AB. ;; Simplify A(A + B).
- De Morgan's theorems | NOT(A.B) = A' + B', NOT(A + B) = A'.B' | Simplify NOT(A + B.C).
- SOP and POS | Minterms, maxterms, canonical forms | Write F = sum m(1,3,5,7) in POS form.
- Consensus and duality | Consensus theorem, dual of an expression | Simplify AB + A'C + BC.
## Level 4 - K-maps
- 2 and 3-variable K-maps | Gray code ordering, grouping 1s | Minimise F(A,B,C) = sum m(0,2,4,6).
- 4-variable K-maps | Quads, octets, wrap-around | Minimise F = sum m(0,1,2,5,8,9,10).
- Don't care conditions | Using X to make bigger groups | Minimise F = sum m(1,3,7,11,15) + d(0,2,5).
- POS minimisation | Grouping 0s | Minimise F = product M(0,1,4,5) in POS.
- Hazards | Static-1 and static-0 hazards, fixing with redundant terms | Find and fix the hazard in F = AB + A'C.
## Level 5 - Combinational circuits
- Half and full adder | Truth table, expressions, circuits | Build a full adder from two half adders.
- Ripple carry and carry look-ahead | Delay, generate and propagate | 32-bit ripple adder, 1 ns per FA: total delay?
- Subtractor | Half and full subtractor, adder-subtractor with XOR | Make a 4-bit adder-subtractor using one control bit.
- Multiplexer | 2:1, 4:1, 8:1, mux as a universal logic block | Implement F(A,B,C) = sum m(1,2,6,7) with a 4:1 mux.
- Demultiplexer and decoder | 1:4 demux, 2:4 and 3:8 decoders, decoder-based logic | Implement a full adder with a 3:8 decoder and OR gates.
- Encoder and priority encoder | 8:3 encoder, priority logic | Write the truth table of a 4:2 priority encoder.
- Comparator | 1-bit and 2-bit magnitude comparator | Design a 2-bit comparator with A>B, A=B, A<B outputs.
- ALU | Arithmetic and logic operations selected by control bits | Design a 1-bit ALU doing AND, OR, ADD.
## Level 6 - Sequential circuits
- Latch | SR latch with NOR and NAND, gated D latch, invalid state | Draw an SR latch with NOR gates and its truth table.
- Flip-flops | SR, JK, D, T; characteristic tables | Write characteristic tables for JK and T flip-flops.
- Latch vs flip-flop | Level vs edge triggered, master-slave | Draw outputs of a D latch and a D flip-flop for the same input.
- Flip-flop conversion | Excitation tables, converting JK to D, D to T | Convert a D flip-flop into a T flip-flop.
- Registers | Shift registers SISO, SIPO, PISO, PIPO; universal shift register | 4-bit SISO register: how many clocks to load and read out 4 bits?
## Level 7 - Counters
- Asynchronous counters | Ripple counter, delay problem | 4-bit ripple counter, 10 ns per FF: maximum frequency?
- Synchronous counters | Design using excitation tables | Design a 3-bit synchronous up counter with T flip-flops.
- Mod-N counters | Mod-6, mod-10 (decade) | Design a mod-6 counter.
- Ring and Johnson counters | States, decoding | A 4-bit Johnson counter has how many states? List them.
- Frequency division | Divide by 2, 4, odd numbers | Output frequency of a 4-bit counter's MSB with 16 MHz clock?
## Level 8 - Finite state machines
- Moore vs Mealy | Output depends on state vs state + input | Which one reacts one clock earlier?
- State diagram and table | Drawing, state assignment, encoding (binary, one-hot, Gray) | How many flip-flops for 5 states in binary vs one-hot?
- Sequence detector | Overlapping vs non-overlapping | Design a 1011 detector, Mealy, overlapping.
- FSM design flow | Diagram, table, encoding, equations, circuit | Design a traffic light controller FSM.
## Level 9 - Timing
- Setup and hold time | Definitions, violations | Draw a timing diagram showing a setup violation.
- Maximum clock frequency | Tclk >= tcq + tlogic + tsetup | tcq 2 ns, tlogic 5 ns, tsetup 1 ns: fmax?
- Clock skew | Positive and negative skew, effect on setup and hold | Positive skew 1 ns in the problem above: new fmax?
- Metastability and synchronisers | 2-FF synchroniser, MTBF | Why can a synchroniser never remove metastability completely?
## Level 10 - Memory
- Memory basics | Address lines, data lines, capacity | Memory with 12 address lines and 8 data lines: capacity?
- ROM, PROM, EPROM, EEPROM, Flash | Differences, uses | Why is flash erased in blocks?
- SRAM | 6T cell, read and write | Draw a 6T SRAM cell and explain a read.
- DRAM | 1T1C cell, refresh, destructive read | Why does DRAM need refresh and SRAM does not?
- Memory hierarchy | Registers, cache, RAM, storage; speed vs size vs cost | Order these by speed and cost per bit.

# vlsi | VLSI and Verilog | Weeks 11-12 | study | For VLSI, FPGA and verification roles. Install iverilog and gtkwave (sudo apt install iverilog gtkwave) or use EDA Playground, and simulate everything.
## Level 1 - Verilog basics
- Module and ports | module, input, output, inout, instantiation | Write a 2-input AND module and instantiate it twice.
- Data types | wire, reg, integer, vectors, logic in SystemVerilog | When must a signal be reg?
- Modelling styles | Gate-level, dataflow (assign), behavioural (always) | Write a 2:1 mux in all three styles.
- Operators | Bitwise, logical, reduction, concatenation, replication, shift | What is {4{2'b10}}? What does &a do for a 4-bit a?
## Level 2 - Combinational RTL
- always @* and case | Sensitivity, case, casez, default | Write a 4:1 mux using case.
- Latch inference | Missing else or default creates a latch | Show a latch-inferring block and fix it.
- Adders and ALU in Verilog | Behavioural adder, parameterised width | Write a parameterised N-bit adder with carry out.
- Decoder, encoder, comparator | RTL versions | Write a 3:8 decoder.
## Level 3 - Sequential RTL
- Flip-flops in Verilog | always @(posedge clk), sync vs async reset | Write a D flip-flop with async active-low reset.
- Blocking vs non-blocking | = vs <=, simulation order | Write a 3-stage shift register both ways and compare simulations.
- Counters and shift registers | Up/down counter, LFSR | Write a 4-bit up/down counter with enable.
- FSM in Verilog | Two and three always-block style | Write the 1011 sequence detector in Verilog.
- Clock dividers | Divide by 2, by N, by 3 with 50% duty | Write a divide-by-3 with 50% duty cycle.
## Level 4 - Verification
- Testbench | Clock generation, reset, stimulus, $dumpfile | Write a testbench for your counter and view it in GTKWave.
- Self-checking testbench | Expected values, $display PASS/FAIL | Make the adder testbench check all inputs automatically.
- Synthesisable vs not | initial, # delays, $display, loops | Which of these synthesise and why?
- SystemVerilog basics | Classes, constrained random, assertions, coverage, what UVM is | Write one assertion: req must get ack within 3 cycles.
## Level 5 - Clock domain crossing
- Single-bit CDC | 2-FF synchroniser | Write a 2-FF synchroniser in Verilog.
- Pulse and multi-bit CDC | Pulse synchroniser, handshake, Gray code | Why can't you synchronise a 4-bit bus with 2-FF on each bit?
- FIFOs | Synchronous FIFO, asynchronous FIFO, full and empty | Write a synchronous FIFO with full and empty flags.
## Level 6 - Physical design concepts
- Transistor sizing | W/L, PMOS 2-3x wider, logical effort idea | Why is the PMOS wider than the NMOS in an inverter?
- Standard cells and libraries | Cell library, .lib timing, cell height | What information does a .lib file contain?
- Layout, stick diagrams, design rules | Layers, lambda rules | Draw the stick diagram of a CMOS inverter.
- CMOS fabrication | Wafer, oxidation, photolithography, etching, doping, metal layers | List the main fabrication steps in order.
- Interconnect and parasitics | Wire R and C, crosstalk, RC extraction | Why do long wires need repeaters?
## Level 7 - STA and design flow
- Static timing analysis | Timing paths, arrival and required time, slack | Arrival 4 ns, required 5 ns: slack? Is it met?
- False and multicycle paths | When to use each | Give an example of a false path.
- PVT corners | Process, voltage, temperature; setup at slow corner, hold at fast corner | Why check hold at the fast corner?
- ASIC design flow | Spec, RTL, simulation, synthesis, floorplan, placement, CTS, routing, STA, GDSII | Write the full flow from RTL to GDSII in order.
- FPGA vs ASIC | LUTs, flip-flops, cost, speed, flexibility | When would a company choose FPGA over ASIC?
## Level 8 - Mini projects
- UART TX and RX | Baud generator, shift register, FSM | Build UART TX and RX, loop them back, send 10 bytes in simulation.
- FIFO project | Synchronous then asynchronous FIFO | Build and verify a sync FIFO; then an async FIFO with Gray pointers.
- Put it on GitHub and resume | README, waveform screenshots, one resume line | Push the projects and add the resume line.

# arch | Computer Architecture and OS | Weeks 10-11 | study | Asked in hardware, embedded and VLSI rounds alike. Draw a picture for each.
## Level 1 - Architecture basics
- CPU building blocks | ALU, registers, control unit, buses | Draw a simple CPU with these blocks.
- Instruction cycle | Fetch, decode, execute | Walk through the cycle for an ADD instruction.
- RISC vs CISC | Instruction size, cycles, registers, examples ARM, RISC-V, x86 | Give 4 differences.
- Addressing modes | Immediate, register, direct, indirect, indexed | Name the addressing mode in LDR R0, [R1, #4].
## Level 2 - Pipelining
- Pipeline stages | IF, ID, EX, MEM, WB; throughput vs latency | 5-stage pipeline, 100 instructions: cycles needed?
- Hazards | Structural, data, control | Give an example of each.
- Fixing hazards | Forwarding, stalls, branch prediction | Which data hazard can forwarding not fix?
## Level 3 - Cache and memory
- Cache basics | Hit, miss, hit ratio, average access time | Hit 2 ns, miss penalty 50 ns, hit ratio 95%: average access time?
- Cache mapping | Direct, set associative, fully associative; tag, index, offset | 4 KB direct-mapped, 16 B lines, 32-bit address: tag, index, offset bits?
- Write policies | Write-through, write-back, dirty bit | Why does DMA cause cache coherency problems?
- Locality | Temporal and spatial | Why is looping over a 2D array row by row faster in C?
## Level 4 - Operating system
- Process vs thread | What is shared, what is private | Why is a thread switch cheaper than a process switch?
- CPU scheduling | FCFS, SJF, round robin, priority | Compute average waiting time for 3 jobs (5, 3, 8 ms) with FCFS and SJF.
- Deadlock | Four conditions, prevention, avoidance | Break each condition with an example.
- Virtual memory | Paging, page table, TLB, page fault | Why do microcontrollers usually not have virtual memory?
- Kernel and drivers | User vs kernel space, system calls, device driver idea | What does a Linux device driver do?

# apt | Aptitude | 10 min daily | apt | Most placements start with an online test. Use IndiaBix or PrepInsta with a timer.
## Quantitative
- Percentages and profit-loss | Percentage change, successive change, profit, discount | A price rises 20% then falls 20%: net change?
- Ratios and mixtures | Ratio, proportion, alligation | Mix 20% and 50% acid to get 30%: ratio?
- Time, speed, distance | Relative speed, trains, boats | Trains of 120 m and 180 m cross in 10 s moving opposite: relative speed?
- Time and work | Work rates, pipes and cisterns | A in 12 days, B in 18 days: together?
- Permutation, combination, probability | nPr, nCr, basic probability | Ways to choose 3 from 8? Chance of exactly 2 heads in 3 tosses?
- Number system | Divisibility, remainders, HCF, LCM | Remainder of 2^100 divided by 7?
## Logical reasoning
- Series and patterns | Number, letter, figure series | 2, 6, 12, 20, 30, ?
- Seating and blood relations | Linear, circular arrangements, family trees | Solve 5 seating puzzles in 10 minutes.
- Syllogisms | Venn diagram method | All A are B, some B are C: is "some A are C" definite?
- Data interpretation | Tables, bar charts, pie charts | Solve 10 DI questions in 10 minutes.
## Verbal
- Reading comprehension | Main idea, inference | Do one passage in 6 minutes.
- Grammar and error spotting | Tenses, articles, subject-verb agreement | Do 10 error-spotting questions.
- Full mock test | Company-style test under time | Take one full mock every Sunday and note your weakest topic.

`;
