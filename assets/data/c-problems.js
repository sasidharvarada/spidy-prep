// Embedded C practice problems.
// kind "function": you write function(s); a hidden harness calls them and prints results.
// kind "program":  you write main(); it reads stdin and prints to stdout.
// Your output is compared line by line with the reference solution's output.
export const C_PROBLEMS = [
/* --------------------------------------------------------------- bits */
{
  id: "c-bitops", title: "Set, clear, toggle and test a bit", level: "Easy", topic: "Bit manipulation",
  desc: `Write four functions that work on bit <code>n</code> (0-31) of a 32-bit register value and return the new value (or the bit):
<ul><li><code>set_bit(r, n)</code> - bit n becomes 1</li><li><code>clear_bit(r, n)</code> - bit n becomes 0</li><li><code>toggle_bit(r, n)</code> - bit n flips</li><li><code>test_bit(r, n)</code> - returns 1 if bit n is set, else 0</li></ul>Watch out for <code>1 &lt;&lt; 31</code> on a signed int: use <code>1u</code>.`,
  hint: "Masks: (1u << n). Set with |, clear with & ~mask, toggle with ^, test with (r >> n) & 1u.",
  kind: "function",
  starter: `#include <stdint.h>

uint32_t set_bit(uint32_t r, unsigned n)    { return r; }
uint32_t clear_bit(uint32_t r, unsigned n)  { return r; }
uint32_t toggle_bit(uint32_t r, unsigned n) { return r; }
int      test_bit(uint32_t r, unsigned n)   { return 0; }
`,
  solution: `#include <stdint.h>
uint32_t set_bit(uint32_t r, unsigned n)    { return r | (1u << n); }
uint32_t clear_bit(uint32_t r, unsigned n)  { return r & ~(1u << n); }
uint32_t toggle_bit(uint32_t r, unsigned n) { return r ^ (1u << n); }
int      test_bit(uint32_t r, unsigned n)   { return (r >> n) & 1u; }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  uint32_t v[] = {0x0u, 0xFFFFFFFFu, 0x12345678u, 0x80000001u};
  unsigned b[] = {0, 3, 15, 31};
  for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) {
    printf("set_bit(0x%08X,%u)    = 0x%08X\\n", v[i], b[j], set_bit(v[i], b[j]));
    printf("clear_bit(0x%08X,%u)  = 0x%08X\\n", v[i], b[j], clear_bit(v[i], b[j]));
    printf("toggle_bit(0x%08X,%u) = 0x%08X\\n", v[i], b[j], toggle_bit(v[i], b[j]));
    printf("test_bit(0x%08X,%u)   = %d\\n", v[i], b[j], test_bit(v[i], b[j]));
  }
}
`},
{
  id: "c-popcount", title: "Count set bits", level: "Easy", topic: "Bit manipulation",
  desc: `Write <code>int count_bits(uint32_t x)</code> that returns how many bits of <code>x</code> are 1.<br>Interview follow-up: Brian Kernighan's trick <code>x &amp;= x - 1</code> removes the lowest set bit, so the loop runs only once per 1-bit.`,
  hint: "while (x) { x &= x - 1; count++; }",
  kind: "function",
  starter: `#include <stdint.h>

int count_bits(uint32_t x) {
  int count = 0;

  return count;
}
`,
  solution: `#include <stdint.h>
int count_bits(uint32_t x) { int c = 0; while (x) { x &= x - 1; c++; } return c; }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  uint32_t v[] = {0u, 1u, 2u, 3u, 0xFFu, 0x80000000u, 0xFFFFFFFFu, 0xAAAAAAAAu, 0x12345678u, 0x7FFFFFFFu};
  for (int i = 0; i < 10; i++) printf("count_bits(0x%08X) = %d\\n", v[i], count_bits(v[i]));
}
`},
{
  id: "c-pow2", title: "Power of two check", level: "Easy", topic: "Bit manipulation",
  desc: `Write <code>int is_pow2(uint32_t x)</code>: return 1 if <code>x</code> is a power of two (1, 2, 4, 8 ...), else 0. Zero is <b>not</b> a power of two. Do it in one expression, without a loop.`,
  hint: "A power of two has exactly one bit set, so x & (x - 1) is 0. Remember the x != 0 check.",
  kind: "function",
  starter: `#include <stdint.h>

int is_pow2(uint32_t x) {
  return 0;
}
`,
  solution: `#include <stdint.h>
int is_pow2(uint32_t x) { return x != 0 && (x & (x - 1)) == 0; }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  uint32_t v[] = {0u, 1u, 2u, 3u, 4u, 6u, 64u, 96u, 1024u, 0x80000000u, 0xFFFFFFFFu, 0x40000001u};
  for (int i = 0; i < 12; i++) printf("is_pow2(%u) = %d\\n", v[i], is_pow2(v[i]));
}
`},
{
  id: "c-nibble", title: "Swap nibbles", level: "Easy", topic: "Bit manipulation",
  desc: `Write <code>uint8_t swap_nibbles(uint8_t b)</code>: swap the upper and lower 4 bits. <code>0xAB</code> becomes <code>0xBA</code>.`,
  hint: "(b << 4) | (b >> 4), then make sure the result is cast back to 8 bits.",
  kind: "function",
  starter: `#include <stdint.h>

uint8_t swap_nibbles(uint8_t b) {
  return b;
}
`,
  solution: `#include <stdint.h>
uint8_t swap_nibbles(uint8_t b) { return (uint8_t)((b << 4) | (b >> 4)); }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  unsigned v[] = {0x00, 0xAB, 0x12, 0xF0, 0x0F, 0x81, 0xFF, 0x5A};
  for (int i = 0; i < 8; i++) printf("swap_nibbles(0x%02X) = 0x%02X\\n", v[i], (unsigned)swap_nibbles((uint8_t)v[i]));
}
`},
{
  id: "c-revbits", title: "Reverse the bits of a byte", level: "Medium", topic: "Bit manipulation",
  desc: `Write <code>uint8_t reverse_bits(uint8_t b)</code>: bit 0 becomes bit 7, bit 1 becomes bit 6, and so on. <code>0x01</code> becomes <code>0x80</code>, <code>0x0F</code> becomes <code>0xF0</code>.`,
  hint: "Loop 8 times: shift the result left, add the lowest bit of b, shift b right.",
  kind: "function",
  starter: `#include <stdint.h>

uint8_t reverse_bits(uint8_t b) {
  uint8_t r = 0;

  return r;
}
`,
  solution: `#include <stdint.h>
uint8_t reverse_bits(uint8_t b) {
  uint8_t r = 0;
  for (int i = 0; i < 8; i++) { r = (uint8_t)((r << 1) | (b & 1u)); b >>= 1; }
  return r;
}
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  for (unsigned v = 0; v < 256; v += 17) printf("reverse_bits(0x%02X) = 0x%02X\\n", v, (unsigned)reverse_bits((uint8_t)v));
  printf("reverse_bits(0x01) = 0x%02X\\n", (unsigned)reverse_bits(0x01));
  printf("reverse_bits(0xB4) = 0x%02X\\n", (unsigned)reverse_bits(0xB4));
}
`},
{
  id: "c-field", title: "Write a register field", level: "Medium", topic: "Bit manipulation",
  desc: `Peripheral registers pack several settings into one word. Write <code>uint32_t write_field(uint32_t reg, unsigned pos, unsigned width, uint32_t value)</code> that puts <code>value</code> into bits <code>pos .. pos+width-1</code> and leaves all other bits unchanged. Extra high bits of <code>value</code> must be ignored. <code>width</code> is 1-31.<br>Also write <code>uint32_t read_field(uint32_t reg, unsigned pos, unsigned width)</code>.`,
  hint: "mask = ((1u << width) - 1u) << pos;  reg = (reg & ~mask) | ((value << pos) & mask);",
  kind: "function",
  starter: `#include <stdint.h>

uint32_t write_field(uint32_t reg, unsigned pos, unsigned width, uint32_t value) {
  return reg;
}

uint32_t read_field(uint32_t reg, unsigned pos, unsigned width) {
  return 0;
}
`,
  solution: `#include <stdint.h>
uint32_t write_field(uint32_t reg, unsigned pos, unsigned width, uint32_t value) {
  uint32_t mask = ((1u << width) - 1u) << pos;
  return (reg & ~mask) | ((value << pos) & mask);
}
uint32_t read_field(uint32_t reg, unsigned pos, unsigned width) {
  return (reg >> pos) & ((1u << width) - 1u);
}
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  printf("%08X\\n", write_field(0x00000000u, 4, 3, 5u));
  printf("%08X\\n", write_field(0xFFFFFFFFu, 4, 3, 0u));
  printf("%08X\\n", write_field(0x12345678u, 8, 8, 0xABu));
  printf("%08X\\n", write_field(0x12345678u, 8, 4, 0xABu));
  printf("%08X\\n", write_field(0x00000000u, 0, 1, 1u));
  printf("%08X\\n", write_field(0x00000000u, 28, 4, 0xFu));
  printf("%08X\\n", write_field(0xA5A5A5A5u, 16, 16, 0x1234u));
  printf("%u\\n", read_field(0x12345678u, 8, 8));
  printf("%u\\n", read_field(0x12345678u, 0, 4));
  printf("%u\\n", read_field(0xF0000000u, 28, 4));
  printf("%u\\n", read_field(0x00000050u, 4, 3));
}
`},
{
  id: "c-bswap", title: "Swap endianness", level: "Medium", topic: "Bit manipulation",
  desc: `Data from a network or a big-endian sensor must often be byte-swapped. Write <code>uint32_t bswap32(uint32_t x)</code>: <code>0x11223344</code> becomes <code>0x44332211</code>. Then write <code>uint16_t read_be16(const uint8_t *p)</code> that reads two bytes as a big-endian number (<code>p[0]</code> is the high byte).`,
  hint: "Move each byte with shifts and masks: ((x >> 24) & 0xFF) | ((x >> 8) & 0xFF00) | ...",
  kind: "function",
  starter: `#include <stdint.h>

uint32_t bswap32(uint32_t x) {
  return x;
}

uint16_t read_be16(const uint8_t *p) {
  return 0;
}
`,
  solution: `#include <stdint.h>
uint32_t bswap32(uint32_t x) {
  return ((x >> 24) & 0x000000FFu) | ((x >> 8) & 0x0000FF00u) |
         ((x << 8) & 0x00FF0000u) | ((x << 24) & 0xFF000000u);
}
uint16_t read_be16(const uint8_t *p) { return (uint16_t)((p[0] << 8) | p[1]); }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  uint32_t v[] = {0x11223344u, 0x00000001u, 0xFF000000u, 0xDEADBEEFu, 0u};
  for (int i = 0; i < 5; i++) printf("bswap32(0x%08X) = 0x%08X\\n", v[i], bswap32(v[i]));
  uint8_t b[] = {0x12, 0x34, 0xFF, 0x01, 0x00, 0x80};
  for (int i = 0; i < 6; i += 2) printf("read_be16(%02X %02X) = 0x%04X\\n", b[i], b[i+1], (unsigned)read_be16(&b[i]));
}
`},
/* --------------------------------------------------------------- strings & memory */
{
  id: "c-strlen", title: "Write your own strlen and strcmp", level: "Easy", topic: "Strings",
  desc: `Without <code>&lt;string.h&gt;</code>, write:
<ul><li><code>size_t my_strlen(const char *s)</code></li><li><code>int my_strcmp(const char *a, const char *b)</code> - returns 0 if equal, a negative number if <code>a</code> sorts first, positive otherwise. The tests only check the sign.</li></ul>`,
  hint: "Walk both strings while the characters match and are not '\\0'; return the difference of the first mismatching chars (as unsigned char).",
  kind: "function",
  starter: `#include <stddef.h>

size_t my_strlen(const char *s) {
  return 0;
}

int my_strcmp(const char *a, const char *b) {
  return 0;
}
`,
  solution: `#include <stddef.h>
size_t my_strlen(const char *s) { const char *p = s; while (*p) p++; return (size_t)(p - s); }
int my_strcmp(const char *a, const char *b) {
  while (*a && *a == *b) { a++; b++; }
  return (unsigned char)*a - (unsigned char)*b;
}
`,
  harness: `#include <stdio.h>
#include <stddef.h>
static int sgn(int x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); }
void __spidy_tests(void) {
  const char *s[] = {"", "a", "hello", "embedded systems", "12345678901234567890"};
  for (int i = 0; i < 5; i++) printf("my_strlen(\\"%s\\") = %d\\n", s[i], (int)my_strlen(s[i]));
  const char *a[] = {"abc", "abc", "abd", "ab", "", "Zeta", "spi"};
  const char *b[] = {"abc", "abd", "abc", "abc", "", "alpha", "spi bus"};
  for (int i = 0; i < 7; i++) printf("sign(my_strcmp(\\"%s\\", \\"%s\\")) = %d\\n", a[i], b[i], sgn(my_strcmp(a[i], b[i])));
}
`},
{
  id: "c-strrev", title: "Reverse a string in place", level: "Easy", topic: "Strings",
  desc: `Write <code>void reverse(char *s)</code> that reverses <code>s</code> in place (no second buffer). "uart" becomes "trau". Empty strings and 1-character strings must work.`,
  hint: "Two pointers: one at the start, one at the last character. Swap and move them toward each other.",
  kind: "function",
  starter: `void reverse(char *s) {

}
`,
  solution: `void reverse(char *s) {
  char *e = s; while (*e) e++;
  if (e == s) return;
  e--;
  while (s < e) { char t = *s; *s++ = *e; *e-- = t; }
}
`,
  harness: `#include <stdio.h>
#include <string.h>
void __spidy_tests(void) {
  const char *t[] = {"uart", "", "a", "ab", "racecar", "Hello, World!", "1234567890"};
  for (int i = 0; i < 7; i++) { char buf[32]; strcpy(buf, t[i]); reverse(buf); printf("reverse(\\"%s\\") = \\"%s\\"\\n", t[i], buf); }
}
`},
{
  id: "c-atoi", title: "Write your own atoi", level: "Medium", topic: "Strings",
  desc: `Write <code>int my_atoi(const char *s)</code>: skip leading spaces, accept an optional <code>+</code> or <code>-</code>, then read decimal digits until the first non-digit. Return 0 if there are no digits. You can assume the result fits in an <code>int</code>.`,
  hint: "result = result * 10 + (c - '0'); apply the sign at the end.",
  kind: "function",
  starter: `int my_atoi(const char *s) {
  return 0;
}
`,
  solution: `int my_atoi(const char *s) {
  while (*s == ' ' || *s == '\\t') s++;
  int sign = 1;
  if (*s == '+' || *s == '-') { if (*s == '-') sign = -1; s++; }
  int r = 0;
  while (*s >= '0' && *s <= '9') { r = r * 10 + (*s - '0'); s++; }
  return sign * r;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  const char *t[] = {"42", "   -17", "+8", "0", "123abc", "abc", "", "  -0", "2147483647", "-2147483647", " 12 34", "-"};
  for (int i = 0; i < 12; i++) printf("my_atoi(\\"%s\\") = %d\\n", t[i], my_atoi(t[i]));
}
`},
{
  id: "c-memmove", title: "memmove that handles overlap", level: "Medium", topic: "Memory",
  desc: `Write <code>void *my_memmove(void *dst, const void *src, size_t n)</code>. Unlike <code>memcpy</code>, the source and destination may overlap, and the result must be as if the bytes were first copied to a temporary buffer. Do not use a temporary buffer: choose the copy direction instead.`,
  hint: "If dst is before src, copy forwards. If dst is after src, copy backwards from the end.",
  kind: "function",
  starter: `#include <stddef.h>

void *my_memmove(void *dst, const void *src, size_t n) {
  return dst;
}
`,
  solution: `#include <stddef.h>
void *my_memmove(void *dst, const void *src, size_t n) {
  unsigned char *d = dst; const unsigned char *s = src;
  if (d < s) { while (n--) *d++ = *s++; }
  else if (d > s) { d += n; s += n; while (n--) *--d = *--s; }
  return dst;
}
`,
  harness: `#include <stdio.h>
#include <string.h>
void __spidy_tests(void) {
  char a[32];
  strcpy(a, "0123456789"); my_memmove(a + 2, a, 5); printf("right overlap: %s\\n", a);
  strcpy(a, "0123456789"); my_memmove(a, a + 3, 5); printf("left overlap:  %s\\n", a);
  strcpy(a, "abcdef");     my_memmove(a, a, 6);     printf("same place:    %s\\n", a);
  strcpy(a, "abcdef");     my_memmove(a + 1, a, 0); printf("zero bytes:    %s\\n", a);
  char b[16] = "xxxxxxxx"; my_memmove(b, "SPI", 3); printf("no overlap:    %s\\n", b);
  printf("returns dst:   %d\\n", my_memmove(a, a + 1, 1) == a);
}
`},
/* --------------------------------------------------------------- data structures */
{
  id: "c-ring", title: "Ring buffer for UART bytes", level: "Medium", topic: "Data structures",
  desc: `A UART receive interrupt writes bytes into a ring buffer, and the main loop reads them out. Implement a ring buffer of <b>8 bytes</b> (size is a power of two, so you can wrap with <code>&amp; 7</code>):
<ul><li><code>void rb_init(RingBuf *rb)</code></li><li><code>int rb_put(RingBuf *rb, uint8_t b)</code> - returns 1 on success, 0 if full (byte dropped)</li><li><code>int rb_get(RingBuf *rb, uint8_t *out)</code> - returns 1 and the oldest byte, or 0 if empty</li><li><code>int rb_count(const RingBuf *rb)</code></li></ul>It must hold all <b>8</b> bytes when full. Keep the struct fields as given (head, tail, count).`,
  hint: "Using a count field makes full (count == 8) and empty (count == 0) easy. head = where to write, tail = where to read.",
  kind: "function",
  starter: `#include <stdint.h>

#define RB_SIZE 8

typedef struct {
  uint8_t data[RB_SIZE];
  unsigned head;   // next write index
  unsigned tail;   // next read index
  unsigned count;  // bytes stored
} RingBuf;

void rb_init(RingBuf *rb) {
}

int rb_put(RingBuf *rb, uint8_t b) {
  return 0;
}

int rb_get(RingBuf *rb, uint8_t *out) {
  return 0;
}

int rb_count(const RingBuf *rb) {
  return 0;
}
`,
  solution: `#include <stdint.h>
#define RB_SIZE 8
typedef struct { uint8_t data[RB_SIZE]; unsigned head, tail, count; } RingBuf;
void rb_init(RingBuf *rb) { rb->head = rb->tail = rb->count = 0; }
int rb_put(RingBuf *rb, uint8_t b) {
  if (rb->count == RB_SIZE) return 0;
  rb->data[rb->head] = b; rb->head = (rb->head + 1) & (RB_SIZE - 1); rb->count++;
  return 1;
}
int rb_get(RingBuf *rb, uint8_t *out) {
  if (rb->count == 0) return 0;
  *out = rb->data[rb->tail]; rb->tail = (rb->tail + 1) & (RB_SIZE - 1); rb->count--;
  return 1;
}
int rb_count(const RingBuf *rb) { return (int)rb->count; }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  RingBuf rb; rb_init(&rb); uint8_t v = 0; int ok, c;
  ok = rb_get(&rb, &v); c = rb_count(&rb); printf("empty get: %d, count %d\\n", ok, c);
  for (int i = 0; i < 10; i++) { ok = rb_put(&rb, (uint8_t)(10 + i)); c = rb_count(&rb); printf("put %d -> %d (count %d)\\n", 10 + i, ok, c); }
  for (int i = 0; i < 3; i++) { ok = rb_get(&rb, &v); c = rb_count(&rb); printf("get -> %d value %d (count %d)\\n", ok, ok ? v : -1, c); }
  for (int i = 0; i < 4; i++) { ok = rb_put(&rb, (uint8_t)(50 + i)); c = rb_count(&rb); printf("put %d -> %d (count %d)\\n", 50 + i, ok, c); }
  for (int i = 0; i < 10; i++) { ok = rb_get(&rb, &v); c = rb_count(&rb); printf("get -> %d value %d (count %d)\\n", ok, ok ? v : -1, c); }
}
`},
{
  id: "c-llrev", title: "Reverse a linked list", level: "Medium", topic: "Data structures",
  desc: `Write <code>Node *reverse_list(Node *head)</code> that reverses a singly linked list in place and returns the new head. Use the iterative three-pointer method (prev, cur, next).`,
  hint: "prev = NULL; while (cur) { next = cur->next; cur->next = prev; prev = cur; cur = next; } return prev;",
  kind: "function",
  starter: `#include <stddef.h>

typedef struct Node {
  int val;
  struct Node *next;
} Node;

Node *reverse_list(Node *head) {
  return head;
}
`,
  solution: `#include <stddef.h>
typedef struct Node { int val; struct Node *next; } Node;
Node *reverse_list(Node *head) {
  Node *prev = NULL, *cur = head;
  while (cur) { Node *nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
  return prev;
}
`,
  harness: `#include <stdio.h>
#include <stdlib.h>
static Node *mk(int n) { Node *h = NULL; for (int i = n; i >= 1; i--) { Node *x = malloc(sizeof(Node)); x->val = i; x->next = h; h = x; } return h; }
static void show(Node *h) { printf("["); while (h) { printf("%d%s", h->val, h->next ? " " : ""); h = h->next; } printf("]\\n"); }
void __spidy_tests(void) {
  int sizes[] = {0, 1, 2, 5};
  for (int i = 0; i < 4; i++) { Node *h = mk(sizes[i]); printf("n=%d: ", sizes[i]); show(reverse_list(h)); }
  Node *h = mk(4); h = reverse_list(reverse_list(h)); printf("twice: "); show(h);
}
`},
{
  id: "c-llmid", title: "Middle node and loop detection", level: "Medium", topic: "Data structures",
  desc: `Using the slow/fast pointer technique, write:
<ul><li><code>Node *middle(Node *head)</code> - the middle node; for an even count return the <b>second</b> of the two middle nodes. Return NULL for an empty list.</li><li><code>int has_loop(Node *head)</code> - 1 if following <code>next</code> pointers ever repeats a node (Floyd's algorithm), else 0.</li></ul>`,
  hint: "slow moves 1 step, fast moves 2. When fast reaches the end, slow is in the middle. If they ever meet, there is a loop.",
  kind: "function",
  starter: `#include <stddef.h>

typedef struct Node {
  int val;
  struct Node *next;
} Node;

Node *middle(Node *head) {
  return NULL;
}

int has_loop(Node *head) {
  return 0;
}
`,
  solution: `#include <stddef.h>
typedef struct Node { int val; struct Node *next; } Node;
Node *middle(Node *head) {
  Node *s = head, *f = head;
  while (f && f->next) { s = s->next; f = f->next->next; }
  return s;
}
int has_loop(Node *head) {
  Node *s = head, *f = head;
  while (f && f->next) { s = s->next; f = f->next->next; if (s == f) return 1; }
  return 0;
}
`,
  harness: `#include <stdio.h>
#include <stdlib.h>
static Node pool[16];
static Node *mk(int n) { for (int i = 0; i < n; i++) { pool[i].val = i + 1; pool[i].next = (i + 1 < n) ? &pool[i + 1] : NULL; } return n ? &pool[0] : NULL; }
void __spidy_tests(void) {
  for (int n = 0; n <= 6; n++) { Node *m = middle(mk(n)); printf("middle of %d nodes: %d\\n", n, m ? m->val : -1); }
  for (int n = 0; n <= 4; n++) printf("has_loop(%d nodes, no loop) = %d\\n", n, has_loop(mk(n)));
  mk(6); pool[5].next = &pool[2]; printf("has_loop(tail -> node 3) = %d\\n", has_loop(&pool[0]));
  mk(1); pool[0].next = &pool[0]; printf("has_loop(self loop) = %d\\n", has_loop(&pool[0]));
}
`},
{
  id: "c-bsearch", title: "Binary search", level: "Easy", topic: "Algorithms",
  desc: `Write <code>int bsearch_idx(const int *a, int n, int key)</code>: <code>a</code> is sorted ascending. Return the index of <code>key</code>, or -1 if it is not there. Must be O(log n).<br>Use <code>mid = lo + (hi - lo) / 2</code> and be ready to explain why (overflow).`,
  hint: "lo = 0, hi = n - 1; while (lo <= hi) ...",
  kind: "function",
  starter: `int bsearch_idx(const int *a, int n, int key) {
  return -1;
}
`,
  solution: `int bsearch_idx(const int *a, int n, int key) {
  int lo = 0, hi = n - 1;
  while (lo <= hi) { int mid = lo + (hi - lo) / 2; if (a[mid] == key) return mid; if (a[mid] < key) lo = mid + 1; else hi = mid - 1; }
  return -1;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int a[] = {-9, -3, 0, 2, 7, 11, 18, 25, 40, 99};
  int keys[] = {-9, 0, 7, 99, 25, 5, -10, 100, 3};
  for (int i = 0; i < 9; i++) printf("find %d -> %d\\n", keys[i], bsearch_idx(a, 10, keys[i]));
  printf("empty -> %d\\n", bsearch_idx(a, 0, 1));
  int one[] = {4}; printf("one hit -> %d, one miss -> %d\\n", bsearch_idx(one, 1, 4), bsearch_idx(one, 1, 5));
}
`},
{
  id: "c-crc8", title: "CRC-8 checksum", level: "Hard", topic: "Communication",
  desc: `Many sensors (and SMBus) protect data with a CRC-8. Write <code>uint8_t crc8(const uint8_t *data, size_t len)</code> using polynomial <code>0x07</code> (x<sup>8</sup>+x<sup>2</sup>+x+1), initial value <code>0x00</code>, MSB first, no final XOR.<br>For each byte: XOR it into the CRC, then 8 times: if the top bit is set, shift left and XOR with 0x07, else just shift left.`,
  hint: "crc ^= byte; for (8 bits) crc = (crc & 0x80) ? (uint8_t)((crc << 1) ^ 0x07) : (uint8_t)(crc << 1);",
  kind: "function",
  starter: `#include <stdint.h>
#include <stddef.h>

uint8_t crc8(const uint8_t *data, size_t len) {
  uint8_t crc = 0x00;

  return crc;
}
`,
  solution: `#include <stdint.h>
#include <stddef.h>
uint8_t crc8(const uint8_t *data, size_t len) {
  uint8_t crc = 0x00;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) crc = (crc & 0x80) ? (uint8_t)((crc << 1) ^ 0x07) : (uint8_t)(crc << 1);
  }
  return crc;
}
`,
  harness: `#include <stdio.h>
#include <stdint.h>
#include <string.h>
void __spidy_tests(void) {
  const char *s = "123456789";
  printf("crc8(\\"123456789\\") = 0x%02X\\n", (unsigned)crc8((const uint8_t *)s, strlen(s)));
  uint8_t a[] = {0x00}; printf("crc8({00}) = 0x%02X\\n", (unsigned)crc8(a, 1));
  uint8_t b[] = {0xFF}; printf("crc8({FF}) = 0x%02X\\n", (unsigned)crc8(b, 1));
  uint8_t c[] = {0xBE, 0xEF}; printf("crc8({BE EF}) = 0x%02X\\n", (unsigned)crc8(c, 2));
  printf("crc8(empty) = 0x%02X\\n", (unsigned)crc8(c, 0));
}
`},
{
  id: "c-movavg", title: "Moving average filter", level: "Medium", topic: "Signal processing",
  desc: `Noisy ADC readings are often smoothed with a moving average. Implement a 4-sample moving average:
<ul><li><code>void ma_init(MovAvg *m)</code> - starts with all 4 samples = 0</li><li><code>uint16_t ma_add(MovAvg *m, uint16_t sample)</code> - adds a sample (dropping the oldest) and returns the average of the last 4 samples, using integer division.</li></ul>Do it in O(1) per sample: keep a running sum instead of adding all 4 every time.`,
  hint: "sum = sum - oldest + sample; store sample at idx; idx = (idx + 1) & 3; return sum / 4;",
  kind: "function",
  starter: `#include <stdint.h>

typedef struct {
  uint16_t buf[4];
  uint32_t sum;
  unsigned idx;
} MovAvg;

void ma_init(MovAvg *m) {
}

uint16_t ma_add(MovAvg *m, uint16_t sample) {
  return 0;
}
`,
  solution: `#include <stdint.h>
typedef struct { uint16_t buf[4]; uint32_t sum; unsigned idx; } MovAvg;
void ma_init(MovAvg *m) { for (int i = 0; i < 4; i++) m->buf[i] = 0; m->sum = 0; m->idx = 0; }
uint16_t ma_add(MovAvg *m, uint16_t s) {
  m->sum = m->sum - m->buf[m->idx] + s;
  m->buf[m->idx] = s; m->idx = (m->idx + 1) & 3u;
  return (uint16_t)(m->sum / 4);
}
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  MovAvg m; ma_init(&m);
  uint16_t s[] = {100, 100, 100, 100, 200, 0, 4095, 4095, 4095, 4095, 7, 9, 3, 1};
  for (int i = 0; i < 14; i++) printf("add %u -> avg %u\\n", (unsigned)s[i], (unsigned)ma_add(&m, s[i]));
}
`},
{
  id: "c-gray", title: "Gray code both ways", level: "Medium", topic: "Bit manipulation",
  desc: `Write <code>uint32_t to_gray(uint32_t b)</code> and <code>uint32_t from_gray(uint32_t g)</code>. Rotary encoders and async FIFO pointers use Gray code because only one bit changes per step.`,
  hint: "to_gray: b ^ (b >> 1). from_gray: keep XOR-ing in shifted copies: b = g; for (s = 1; s < 32; s <<= 1) b ^= b >> s;",
  kind: "function",
  starter: `#include <stdint.h>

uint32_t to_gray(uint32_t b) {
  return b;
}

uint32_t from_gray(uint32_t g) {
  return g;
}
`,
  solution: `#include <stdint.h>
uint32_t to_gray(uint32_t b) { return b ^ (b >> 1); }
uint32_t from_gray(uint32_t g) { for (uint32_t s = 1; s < 32; s <<= 1) g ^= g >> s; return g; }
`,
  harness: `#include <stdio.h>
#include <stdint.h>
void __spidy_tests(void) {
  for (uint32_t i = 0; i < 16; i++) printf("%2u -> gray %2u -> back %2u\\n", i, to_gray(i), from_gray(to_gray(i)));
  printf("to_gray(0xFFFFFFFF) = 0x%08X\\n", to_gray(0xFFFFFFFFu));
  printf("from_gray(0x80000000) = 0x%08X\\n", from_gray(0x80000000u));
}
`},
/* --------------------------------------------------------------- programs */
{
  id: "c-binary", title: "Print a byte in binary", level: "Easy", topic: "Programs",
  desc: `Read an integer <code>n</code> (0-255) from input and print it as 8 binary digits, then on the next line the number of 1 bits.<br>Input <code>5</code> prints:<pre class="spec">00000101
2</pre>`,
  hint: "for (int i = 7; i >= 0; i--) putchar(((n >> i) & 1) ? '1' : '0');",
  kind: "program", tests: ["5", "0", "255", "128", "170", "73"],
  starter: `#include <stdio.h>

int main(void) {
  int n;
  scanf("%d", &n);

  return 0;
}
`,
  solution: `#include <stdio.h>
int main(void) {
  int n, ones = 0; scanf("%d", &n);
  for (int i = 7; i >= 0; i--) { int b = (n >> i) & 1; ones += b; putchar(b ? '1' : '0'); }
  printf("\\n%d\\n", ones);
  return 0;
}
`},
{
  id: "c-second", title: "Second largest number", level: "Easy", topic: "Programs",
  desc: `Input: <code>n</code> (2-100), then <code>n</code> integers. Print the second largest <b>distinct</b> value. If all values are equal, print <code>NONE</code>. Do it in one pass.<br>Input <code>5</code> / <code>4 9 2 9 7</code> prints <code>7</code>.`,
  hint: "Keep largest and second. When a value beats largest, the old largest becomes second. Skip values equal to largest.",
  kind: "program", tests: ["5\n4 9 2 9 7", "3\n1 1 1", "2\n-5 -2", "6\n10 20 30 40 50 60", "4\n7 7 3 7", "5\n-1 -1 -3 -2 -2"],
  starter: `#include <stdio.h>

int main(void) {
  int n;
  scanf("%d", &n);

  return 0;
}
`,
  solution: `#include <stdio.h>
#include <limits.h>
int main(void) {
  int n, x, best = INT_MIN, second = INT_MIN, haveSecond = 0, first = 1;
  scanf("%d", &n);
  for (int i = 0; i < n; i++) {
    scanf("%d", &x);
    if (first) { best = x; first = 0; continue; }
    if (x > best) { second = best; best = x; haveSecond = 1; }
    else if (x < best && (!haveSecond || x > second)) { second = x; haveSecond = 1; }
  }
  if (haveSecond) printf("%d\\n", second); else printf("NONE\\n");
  return 0;
}
`},
{
  id: "c-missing", title: "Find the missing number", level: "Easy", topic: "Programs",
  desc: `Input: <code>n</code>, then <code>n - 1</code> distinct numbers from <code>1..n</code> in any order. Print the missing one. Use O(1) extra memory (no array of size n needed): XOR or the sum formula.`,
  hint: "XOR all numbers 1..n and all given numbers. Pairs cancel; the missing one remains.",
  kind: "program", tests: ["5\n1 2 4 5", "2\n2", "2\n1", "8\n8 7 6 5 4 3 1", "10\n2 3 4 5 6 7 8 9 10"],
  starter: `#include <stdio.h>

int main(void) {
  int n;
  scanf("%d", &n);

  return 0;
}
`,
  solution: `#include <stdio.h>
int main(void) {
  int n, x, acc = 0; scanf("%d", &n);
  for (int i = 1; i <= n; i++) acc ^= i;
  for (int i = 0; i < n - 1; i++) { scanf("%d", &x); acc ^= x; }
  printf("%d\\n", acc);
  return 0;
}
`},
{
  id: "c-struct", title: "Struct padding (predict, then measure)", level: "Medium", topic: "Memory",
  desc: `Interviewers love "what is <code>sizeof</code> this struct?". This compiler is 32-bit (int and pointers are 4 bytes, aligned to 4). Write a program that prints <code>sizeof</code> of the three structs below, one per line, then reorder the members of <code>BadOrder</code> into a new struct <code>GoodOrder</code> with the same members and print its size too (it must be <b>8</b>).
<pre class="spec">struct BadOrder  { char a; int b; char c; };
struct Mixed     { char a; short b; char c; int d; };
struct Packed3   { char a; char b; char c; };</pre>`,
  hint: "Put the largest members first. Padding is added so every member starts at a multiple of its own size, and the total is a multiple of the largest alignment.",
  kind: "program", tests: [""],
  starter: `#include <stdio.h>

struct BadOrder { char a; int b; char c; };
struct Mixed    { char a; short b; char c; int d; };
struct Packed3  { char a; char b; char c; };

/* struct GoodOrder { ... }; */

int main(void) {
  printf("%d\\n", (int)sizeof(struct BadOrder));

  return 0;
}
`,
  solution: `#include <stdio.h>
struct BadOrder { char a; int b; char c; };
struct Mixed    { char a; short b; char c; int d; };
struct Packed3  { char a; char b; char c; };
struct GoodOrder { int b; char a; char c; };
int main(void) {
  printf("%d\\n%d\\n%d\\n%d\\n", (int)sizeof(struct BadOrder), (int)sizeof(struct Mixed), (int)sizeof(struct Packed3), (int)sizeof(struct GoodOrder));
  return 0;
}
`},
{
  id: "c-fsm", title: "Button debouncer state machine", level: "Hard", topic: "Embedded design",
  desc: `A mechanical button bounces for a few milliseconds. Write a debouncer called once per millisecond with the raw pin level:
<code>int debounce(Debouncer *d, int raw)</code> returns the <b>stable</b> state. The stable state changes only after <code>raw</code> has been different from it for <b>5 consecutive calls</b>; any call where <code>raw</code> equals the stable state resets the counter. Also write <code>void deb_init(Debouncer *d)</code> (stable = 0, count = 0).`,
  hint: "if (raw == d->stable) d->count = 0; else if (++d->count >= 5) { d->stable = raw; d->count = 0; } return d->stable;",
  kind: "function",
  starter: `typedef struct {
  int stable;
  int count;
} Debouncer;

void deb_init(Debouncer *d) {
}

int debounce(Debouncer *d, int raw) {
  return 0;
}
`,
  solution: `typedef struct { int stable; int count; } Debouncer;
void deb_init(Debouncer *d) { d->stable = 0; d->count = 0; }
int debounce(Debouncer *d, int raw) {
  if (raw == d->stable) d->count = 0;
  else if (++d->count >= 5) { d->stable = raw; d->count = 0; }
  return d->stable;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  Debouncer d; deb_init(&d);
  const char *in = "0001010111111100101000000110000";
  printf("raw:    %s\\nstable: ", in);
  for (const char *p = in; *p; p++) printf("%d", debounce(&d, *p - '0'));
  printf("\\n");
}
`},
];
