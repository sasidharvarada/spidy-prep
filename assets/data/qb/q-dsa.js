import { mcq, num, con, r, C } from "./helpers.js";
// DSA question bank (original).
export const Q_DSA = [
mcq("dsa-1", "E", "Time complexity of binary search on n sorted elements?", ["O(log n)", "O(n)", "O(n log n)", "O(1)"], 0, "The range halves each step.", {}),
mcq("dsa-1", "E", "for (i = 0; i < n; i++) for (j = 0; j < n; j++) x++; runs in...", ["O(n²)", "O(n)", "O(n log n)", "O(2n)"], 0, "", {}),
mcq("dsa-1", "M", "for (i = 1; i < n; i *= 2) x++; runs in...", ["O(log n)", "O(n)", "O(√n)", "O(n log n)"], 0, "i doubles each time.", {}),
mcq("dsa-1", "M", "for (i = 0; i < n; i++) for (j = 0; j < i; j++) x++; total iterations?", ["n(n−1)/2, so O(n²)", "n, so O(n)", "n log n", "2n"], 0, "0 + 1 + ... + (n−1).", {}),
mcq("dsa-1", "M", "for (i = n; i > 0; i /= 2) for (j = 0; j < i; j++) x++; runs in...", ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], 0, "n + n/2 + n/4 + ... < 2n.", {}),
num("dsa-1", "M", "An O(n²) algorithm takes 1 s for n = 10 000. Estimated time for n = 30 000 (s)?", 9, "s", "Tripling n multiplies time by 3² = 9.", {}),
mcq("dsa-1", "M", "Space complexity of recursive factorial(n)?", ["O(n) - one stack frame per call", "O(1)", "O(log n)", "O(n²)"], 0, "", {}),
mcq("dsa-1", "M", "Master theorem: T(n) = 2T(n/2) + O(n) solves to...", ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], 0, "Merge sort's recurrence.", {}),
mcq("dsa-2", "E", "Accessing arr[i] in an array takes...", ["O(1)", "O(n)", "O(log n)", "O(i)"], 0, "", {}),
mcq("dsa-2", "M", "Kadane's algorithm finds...", ["The maximum subarray sum in O(n)", "The sorted order", "The median", "All subarrays"], 0, "", {}),
num("dsa-2", "M", "Maximum subarray sum of [−2, 1, −3, 4, −1, 2, 1, −5, 4]?", 6, "", "Subarray [4, −1, 2, 1] sums to 6.", {}),
mcq("dsa-2", "M", "Best way to find a pair with sum K in a SORTED array?", ["Two pointers from both ends, O(n)", "Check all pairs, O(n²)", "Binary search each element, O(n²)", "Sort again"], 0, "", {}),
mcq("dsa-2", "M", "Rotate an array of n elements right by k in place with O(1) extra space:", ["Reverse whole, reverse first k, reverse rest", "Shift one by one k times only", "Use a second array", "Sort it"], 0, "Three reversals, O(n).", {}),
mcq("dsa-3", "E", "Check whether two strings are anagrams in O(n) using...", ["A count array of 256 characters", "Sorting both (O(n log n))", "Nested loops", "Recursion"], 0, "", {}),
mcq("dsa-3", "M", "Naive substring search worst case for text n and pattern m?", ["O(n·m)", "O(n + m)", "O(n)", "O(m)"], 0, "KMP improves this to O(n + m).", {}),
mcq("dsa-4", "E", "Which sort is stable?", ["Merge sort", "Quick sort (typical)", "Heap sort", "Selection sort"], 0, "", {}),
mcq("dsa-4", "M", "Worst case of quicksort with a bad pivot?", ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], 0, "Already sorted input with first-element pivot.", {}),
mcq("dsa-4", "M", "Which sort is best for a nearly sorted small array on an MCU?", ["Insertion sort - O(n) on nearly sorted data, in place", "Merge sort", "Quick sort", "Bubble sort always"], 0, "", {}),
num("dsa-4", "M", "Maximum number of comparisons for binary search in 1000 sorted elements?", Math.floor(Math.log2(1000)) + 1, "", "⌊log2 1000⌋ + 1 = 10.", {}),
mcq("dsa-4", "M", "Counting sort works in O(n + k) when...", ["Keys are small integers in a range k", "Keys are strings", "Data is linked", "Always"], 0, "", {}),
mcq("dsa-5", "E", "Which structure gives LIFO order?", ["Stack", "Queue", "Ring buffer", "Heap"], 0, "", {}),
mcq("dsa-5", "M", "A ring buffer of size 8 with head = 3, tail = 6 (count tracked separately = 5). How many free slots?", ["3", "5", "8", "2"], 0, "8 − 5 = 3.", {}),
mcq("dsa-5", "M", "Why are ring-buffer sizes often powers of two?", ["Index wrap becomes a cheap AND instead of a modulo", "They use less RAM", "Required by C", "For alignment only"], 0, "", {}),
mcq("dsa-5", "M", "Valid-parentheses checking uses a...", ["Stack", "Queue", "Heap", "Hash set only"], 0, "", {}),
mcq("dsa-6", "E", "Inserting at the head of a singly linked list is...", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 0, "", {}),
mcq("dsa-6", "M", "Floyd's cycle detection uses...", ["A slow pointer moving 1 step and a fast pointer moving 2", "A hash table", "Recursion", "Reversing the list"], 0, "", {}),
mcq("dsa-6", "M", "Finding the middle of a linked list in one pass:", ["Slow/fast pointers; slow is at the middle when fast ends", "Count then walk", "Recursion", "Sort first"], 0, "", {}),
mcq("dsa-7", "M", "Average time for lookup in a hash table with a good hash and load factor < 1?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "", {}),
mcq("dsa-7", "M", "Inorder traversal of a binary search tree gives...", ["Keys in sorted order", "Level order", "Reverse order", "Random order"], 0, "", {}),
num("dsa-7", "M", "Maximum number of nodes in a binary tree of height 4 (root at height 0)?", 2 ** 5 - 1, "", "2^(h+1) − 1 = 31.", {}),
num("dsa2-1", "E", "Number of subsets of a set with 5 elements?", 2 ** 5, "", "Each element is in or out: 2^5 = 32.", {}),
num("dsa2-1", "E", "Number of permutations of 5 distinct elements?", 120, "", "5! = 120.", {}),
num("dsa2-1", "M", "Number of solutions to the 6-Queens problem?", 4, "", "6-Queens has 4 distinct solutions (8-Queens has 92).", {}),
mcq("dsa2-1", "M", "Naive recursive fib(n) is slow because...", ["It recomputes the same subproblems exponentially many times", "Recursion is always slow", "It uses floating point", "Of integer overflow"], 0, "Memoisation makes it O(n).", {}),
num("dsa2-1", "M", "How many calls does naive fib(5) make (fib(0) = 0, fib(1) = 1 as base cases, counting the first call)?", 15, "calls", "Calls(n) = 1 + Calls(n−1) + Calls(n−2) with Calls(0) = Calls(1) = 1 → 1, 1, 3, 5, 9, 15.", {}),
mcq("dsa2-2", "M", "BFS on an unweighted graph finds...", ["Shortest paths in number of edges from the source", "Minimum spanning tree", "Topological order always", "Longest paths"], 0, "", {}),
mcq("dsa2-2", "M", "Time complexity of BFS with an adjacency list?", ["O(V + E)", "O(V²)", "O(E log V)", "O(V·E)"], 0, "", {}),
mcq("dsa2-2", "M", "Dijkstra's algorithm fails with...", ["Negative edge weights", "Undirected graphs", "Zero-weight edges", "Sparse graphs"], 0, "", {}),
mcq("dsa2-2", "M", "Topological sort exists only for...", ["Directed acyclic graphs", "Trees", "Undirected graphs", "Complete graphs"], 0, "", {}),
mcq("dsa2-2", "M", "Finding the k largest of n elements efficiently uses...", ["A min-heap of size k: O(n log k)", "Sorting: O(n²)", "A stack", "BFS"], 0, "", {}),
num("dsa2-3", "M", "Greedy coin change with coins {1, 3, 4} for amount 6 uses how many coins (greedy picks largest first)?", 3, "coins", "Greedy: 4 + 1 + 1 = 3 coins, but optimal is 3 + 3 = 2 coins - greedy fails here.", {}),
num("dsa2-3", "M", "Activity selection: intervals (1,4), (3,5), (0,6), (5,7), (8,9), (5,9). Maximum non-overlapping activities?", 3, "", "Sort by end: (1,4), (5,7), (8,9) → 3.", {}),
mcq("dsa2-3", "M", "Greedy works for fractional knapsack but not 0/1 knapsack because...", ["Items cannot be split in 0/1, so the best ratio choice can leave unusable capacity", "0/1 has negative weights", "Fractional is NP-hard", "Greedy is always wrong"], 0, "", {}),
num("dsa2-4", "E", "Ways to climb 6 stairs taking 1 or 2 steps at a time?", 13, "", "ways(n) = ways(n−1) + ways(n−2): 1, 2, 3, 5, 8, 13.", {}),
num("dsa2-4", "M", "Minimum coins to make 11 with coins {1, 2, 5}?", 3, "coins", "5 + 5 + 1.", {}),
num("dsa2-4", "M", "Length of the longest common subsequence of \"ABCBDAB\" and \"BDCABA\"?", 4, "", "One LCS is BCBA (length 4).", {}),
num("dsa2-4", "M", "Length of the longest increasing subsequence of 10, 9, 2, 5, 3, 7, 101, 18?", 4, "", "For example 2, 3, 7, 18.", {}),
num("dsa2-4", "M", "Unique paths from top-left to bottom-right of a 3×7 grid moving only right or down?", C(8, 2), "", "Choose which 2 of the 8 moves go down: C(8,2) = 28.", {}),
mcq("dsa2-4", "M", "0/1 knapsack DP with n items and capacity W runs in...", ["O(n·W) time", "O(2ⁿ) always", "O(n log n)", "O(W)"], 0, "Pseudo-polynomial.", {}),
con("dsa2-4", "M", "How do you recognise that a problem needs dynamic programming?", "Two signs: optimal substructure - the best answer can be built from best answers to smaller subproblems - and overlapping subproblems - the same smaller problems are solved again and again in a naive recursion. Then define a state (what the subproblem is), a transition (how a state is built from smaller ones) and base cases, and either memoise the recursion or fill a table bottom-up.", [["optimal substructure", "optimal substructure|smaller subproblem"], ["overlapping subproblems", "overlapping|repeated|same subproblem"], ["state / transition / base", "state|transition|base case"], ["memo vs table", "memo|table|bottom.?up"]]),
];

// DSA coding problems in C (run in the browser compiler, same format as the C problems).
export const DSA_PROBLEMS = [
{
  id: "c-kadane", mod: "dsa-2", title: "Maximum subarray sum (Kadane)", level: "Medium", topic: "Arrays",
  desc: `Write <code>int max_subarray(const int *a, int n)</code>: the largest sum of a non-empty contiguous subarray. O(n) time, O(1) space. If every number is negative, return the largest one.`,
  hint: "Keep the best sum ending here: cur = max(a[i], cur + a[i]); best = max(best, cur).",
  kind: "function",
  starter: `int max_subarray(const int *a, int n) {
  return 0;
}
`,
  solution: `int max_subarray(const int *a, int n) {
  int best = a[0], cur = a[0];
  for (int i = 1; i < n; i++) { cur = (cur + a[i] > a[i]) ? cur + a[i] : a[i]; if (cur > best) best = cur; }
  return best;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int a[] = {-2, 1, -3, 4, -1, 2, 1, -5, 4}; printf("%d\\n", max_subarray(a, 9));
  int b[] = {-3, -1, -2}; printf("%d\\n", max_subarray(b, 3));
  int c[] = {5}; printf("%d\\n", max_subarray(c, 1));
  int d[] = {1, 2, 3, 4}; printf("%d\\n", max_subarray(d, 4));
  int e[] = {2, -1, 2, -1, 2, -10, 3}; printf("%d\\n", max_subarray(e, 7));
}
`},
{
  id: "c-rotate", mod: "dsa-2", title: "Rotate an array in place", level: "Medium", topic: "Arrays",
  desc: `Write <code>void rotate_right(int *a, int n, int k)</code> that rotates the array right by <code>k</code> positions in place with O(1) extra memory. <code>k</code> may be larger than <code>n</code>; <code>n</code> may be 0.`,
  hint: "k %= n; reverse all, reverse the first k, reverse the remaining n - k.",
  kind: "function",
  starter: `void rotate_right(int *a, int n, int k) {
}
`,
  solution: `static void rev(int *a, int i, int j) { while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; } }
void rotate_right(int *a, int n, int k) {
  if (n <= 0) return; k %= n; if (k < 0) k += n;
  rev(a, 0, n - 1); rev(a, 0, k - 1); rev(a, k, n - 1);
}
`,
  harness: `#include <stdio.h>
static void show(int *a, int n) { for (int i = 0; i < n; i++) printf("%d ", a[i]); printf("\\n"); }
void __spidy_tests(void) {
  int ks[] = {0, 1, 3, 7, 10};
  for (int t = 0; t < 5; t++) { int a[] = {1, 2, 3, 4, 5, 6, 7}; rotate_right(a, 7, ks[t]); printf("k=%d: ", ks[t]); show(a, 7); }
  int one[] = {9}; rotate_right(one, 1, 5); show(one, 1);
  rotate_right(one, 0, 3); printf("empty ok\\n");
}
`},
{
  id: "c-brackets", mod: "dsa-5", title: "Valid brackets", level: "Easy", topic: "Stack, queue, ring buffer",
  desc: `Write <code>int balanced(const char *s)</code>: return 1 if every <code>(</code>, <code>[</code> and <code>{</code> is closed by the matching bracket in the right order, else 0. Other characters are ignored. Strings are at most 100 characters.`,
  hint: "Push opening brackets on a stack; on a closing bracket the top must be its partner.",
  kind: "function",
  starter: `int balanced(const char *s) {
  char stack[100];
  int top = 0;

  return 0;
}
`,
  solution: `int balanced(const char *s) {
  char st[100]; int top = 0;
  for (; *s; s++) {
    char c = *s;
    if (c == '(' || c == '[' || c == '{') st[top++] = c;
    else if (c == ')' || c == ']' || c == '}') {
      char want = c == ')' ? '(' : c == ']' ? '[' : '{';
      if (top == 0 || st[--top] != want) return 0;
    }
  }
  return top == 0;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  const char *t[] = {"", "()", "([]{})", "(]", "((", "))", "a[b(c)d]e", "{[}]", "{{[[(())]]}}", "if (x[i] > 0) { y(); }"};
  for (int i = 0; i < 10; i++) printf("balanced(\\"%s\\") = %d\\n", t[i], balanced(t[i]));
}
`},
{
  id: "c-merge", mod: "dsa-4", title: "Merge two sorted arrays", level: "Easy", topic: "Searching and sorting",
  desc: `Write <code>void merge(const int *a, int na, const int *b, int nb, int *out)</code> that merges two ascending arrays into <code>out</code> (size na + nb), also ascending. O(na + nb).`,
  hint: "Two indices; copy the smaller head each step; then copy the leftovers.",
  kind: "function",
  starter: `void merge(const int *a, int na, const int *b, int nb, int *out) {
}
`,
  solution: `void merge(const int *a, int na, const int *b, int nb, int *out) {
  int i = 0, j = 0, k = 0;
  while (i < na && j < nb) out[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];
  while (i < na) out[k++] = a[i++];
  while (j < nb) out[k++] = b[j++];
}
`,
  harness: `#include <stdio.h>
static void show(int *a, int n) { for (int i = 0; i < n; i++) printf("%d ", a[i]); printf("\\n"); }
void __spidy_tests(void) {
  int a[] = {1, 4, 7, 10}, b[] = {2, 3, 8}, o[16];
  merge(a, 4, b, 3, o); show(o, 7);
  merge(a, 0, b, 3, o); show(o, 3);
  merge(a, 4, b, 0, o); show(o, 4);
  int c[] = {5, 5, 5}, d[] = {5, 6}; merge(c, 3, d, 2, o); show(o, 5);
  int e[] = {-3, 0}, f[] = {-5, -4, 9}; merge(e, 2, f, 3, o); show(o, 5);
}
`},
{
  id: "c-firstuniq", mod: "dsa-7", title: "First non-repeating character", level: "Easy", topic: "Hashing",
  desc: `Write <code>int first_unique(const char *s)</code>: the index of the first character that appears exactly once in <code>s</code>, or -1 if none. O(n) with a 256-entry count array.`,
  hint: "Pass 1: count every character. Pass 2: return the first index whose count is 1.",
  kind: "function",
  starter: `int first_unique(const char *s) {
  int count[256] = {0};

  return -1;
}
`,
  solution: `int first_unique(const char *s) {
  int count[256] = {0};
  for (const char *p = s; *p; p++) count[(unsigned char)*p]++;
  for (int i = 0; s[i]; i++) if (count[(unsigned char)s[i]] == 1) return i;
  return -1;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  const char *t[] = {"leetcode", "loveleetcode", "aabb", "", "z", "embedded", "swiss"};
  for (int i = 0; i < 7; i++) printf("first_unique(\\"%s\\") = %d\\n", t[i], first_unique(t[i]));
}
`},
{
  id: "c-majority", mod: "dsa-7", title: "Majority element", level: "Medium", topic: "Hashing",
  desc: `Write <code>int majority(const int *a, int n)</code>: return the element that appears more than n/2 times, or -1 if there is none. Use the Boyer-Moore voting algorithm (O(n), O(1) space) and then verify the candidate.`,
  hint: "Keep a candidate and a counter; equal → +1, different → -1, at 0 take the new element. Then count the candidate.",
  kind: "function",
  starter: `int majority(const int *a, int n) {
  return -1;
}
`,
  solution: `int majority(const int *a, int n) {
  int cand = 0, cnt = 0;
  for (int i = 0; i < n; i++) { if (cnt == 0) { cand = a[i]; cnt = 1; } else if (a[i] == cand) cnt++; else cnt--; }
  cnt = 0; for (int i = 0; i < n; i++) if (a[i] == cand) cnt++;
  return (n > 0 && cnt * 2 > n) ? cand : -1;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int a[] = {3, 2, 3}; printf("%d\\n", majority(a, 3));
  int b[] = {2, 2, 1, 1, 1, 2, 2}; printf("%d\\n", majority(b, 7));
  int c[] = {1, 2, 3, 4}; printf("%d\\n", majority(c, 4));
  int d[] = {7}; printf("%d\\n", majority(d, 1));
  int e[] = {1, 1, 2, 2}; printf("%d\\n", majority(e, 4));
  printf("%d\\n", majority(a, 0));
}
`},
{
  id: "c-stairs", mod: "dsa2-4", title: "Climbing stairs (DP)", level: "Easy", topic: "Dynamic programming",
  desc: `Write <code>long long ways(int n)</code>: the number of ways to climb <code>n</code> stairs taking 1 or 2 steps at a time (n from 0 to 80; ways(0) = 1). Use a loop, not plain recursion.`,
  hint: "ways(n) = ways(n-1) + ways(n-2). Keep only the last two values.",
  kind: "function",
  starter: `long long ways(int n) {
  return 0;
}
`,
  solution: `long long ways(int n) {
  long long a = 1, b = 1;
  for (int i = 2; i <= n; i++) { long long c = a + b; a = b; b = c; }
  return b;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int t[] = {0, 1, 2, 3, 5, 10, 30, 50, 80};
  for (int i = 0; i < 9; i++) printf("ways(%d) = %lld\\n", t[i], ways(t[i]));
}
`},
{
  id: "c-coins", mod: "dsa2-4", title: "Minimum coins (DP)", level: "Medium", topic: "Dynamic programming",
  desc: `Write <code>int min_coins(const int *coins, int k, int amount)</code>: the fewest coins (unlimited supply of each value) that add up to <code>amount</code>, or -1 if impossible. amount ≤ 1000.`,
  hint: "dp[0] = 0; dp[x] = 1 + min(dp[x - c]) over coins c ≤ x. Use a large value for 'impossible'.",
  kind: "function",
  starter: `int min_coins(const int *coins, int k, int amount) {
  return -1;
}
`,
  solution: `int min_coins(const int *coins, int k, int amount) {
  static int dp[1001]; const int INF = 1000000;
  dp[0] = 0;
  for (int x = 1; x <= amount; x++) {
    dp[x] = INF;
    for (int i = 0; i < k; i++) if (coins[i] <= x && dp[x - coins[i]] + 1 < dp[x]) dp[x] = dp[x - coins[i]] + 1;
  }
  return dp[amount] >= INF ? -1 : dp[amount];
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int a[] = {1, 2, 5}; printf("%d %d %d\\n", min_coins(a, 3, 11), min_coins(a, 3, 0), min_coins(a, 3, 3));
  int b[] = {2}; printf("%d %d\\n", min_coins(b, 1, 3), min_coins(b, 1, 8));
  int c[] = {1, 3, 4}; printf("%d\\n", min_coins(c, 3, 6));
  int d[] = {186, 419, 83, 408}; printf("%d\\n", min_coins(d, 4, 1000));
  int e[] = {7, 13}; printf("%d\\n", min_coins(e, 2, 1));
}
`},
{
  id: "c-lis", mod: "dsa2-4", title: "Longest increasing subsequence", level: "Hard", topic: "Dynamic programming",
  desc: `Write <code>int lis(const int *a, int n)</code>: the length of the longest strictly increasing subsequence (not necessarily contiguous). n ≤ 1000. An O(n²) DP is fine; O(n log n) is a bonus.`,
  hint: "len[i] = 1 + max(len[j]) for j < i with a[j] < a[i]. The answer is the max over i.",
  kind: "function",
  starter: `int lis(const int *a, int n) {
  return 0;
}
`,
  solution: `int lis(const int *a, int n) {
  static int tail[1000]; int len = 0;
  for (int i = 0; i < n; i++) {
    int lo = 0, hi = len;
    while (lo < hi) { int m = (lo + hi) / 2; if (tail[m] < a[i]) lo = m + 1; else hi = m; }
    tail[lo] = a[i]; if (lo == len) len++;
  }
  return len;
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  int a[] = {10, 9, 2, 5, 3, 7, 101, 18}; printf("%d\\n", lis(a, 8));
  int b[] = {0, 1, 0, 3, 2, 3}; printf("%d\\n", lis(b, 6));
  int c[] = {7, 7, 7, 7}; printf("%d\\n", lis(c, 4));
  int d[] = {5, 4, 3, 2, 1}; printf("%d\\n", lis(d, 5));
  printf("%d\\n", lis(a, 0));
  int e[] = {1, 3, 6, 7, 9, 4, 10, 5, 6}; printf("%d\\n", lis(e, 9));
}
`},
{
  id: "c-queens", mod: "dsa2-1", title: "Count N-Queens solutions", level: "Hard", topic: "Recursion and backtracking",
  desc: `Write <code>int queens(int n)</code>: the number of ways to place <code>n</code> queens on an n×n board so that none attack each other (1 ≤ n ≤ 9). Use backtracking row by row.`,
  hint: "Track used columns and both diagonals (r+c and r-c+n-1) in arrays; recurse to the next row; undo on return.",
  kind: "function",
  starter: `int queens(int n) {
  return 0;
}
`,
  solution: `static int N, col[16], d1[32], d2[32];
static int place(int r) {
  if (r == N) return 1;
  int cnt = 0;
  for (int c = 0; c < N; c++) {
    if (col[c] || d1[r + c] || d2[r - c + N - 1]) continue;
    col[c] = d1[r + c] = d2[r - c + N - 1] = 1;
    cnt += place(r + 1);
    col[c] = d1[r + c] = d2[r - c + N - 1] = 0;
  }
  return cnt;
}
int queens(int n) { N = n; for (int i = 0; i < 32; i++) { if (i < 16) col[i] = 0; d1[i] = d2[i] = 0; } return place(0); }
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  for (int n = 1; n <= 9; n++) printf("queens(%d) = %d\\n", n, queens(n));
}
`},
{
  id: "c-gridbfs", mod: "dsa2-2", title: "Shortest path in a grid (BFS)", level: "Hard", topic: "Trees and graphs",
  desc: `A grid has <code>rows × cols</code> cells (each ≤ 20) given as strings of '.' (free) and '#' (wall). Write <code>int shortest(const char *g[], int rows, int cols)</code>: the fewest moves (up/down/left/right) from the top-left to the bottom-right cell, or -1 if unreachable. Both corners are free.`,
  hint: "BFS from (0,0) with a queue of cells and a distance array initialised to -1.",
  kind: "function",
  starter: `int shortest(const char *g[], int rows, int cols) {
  return -1;
}
`,
  solution: `int shortest(const char *g[], int rows, int cols) {
  static int dist[20][20], qr[400], qc[400];
  for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) dist[r][c] = -1;
  int h = 0, t = 0; qr[t] = 0; qc[t++] = 0; dist[0][0] = 0;
  int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
  while (h < t) {
    int r = qr[h], c = qc[h++];
    for (int k = 0; k < 4; k++) {
      int nr = r + dr[k], nc = c + dc[k];
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || g[nr][nc] == '#' || dist[nr][nc] >= 0) continue;
      dist[nr][nc] = dist[r][c] + 1; qr[t] = nr; qc[t++] = nc;
    }
  }
  return dist[rows - 1][cols - 1];
}
`,
  harness: `#include <stdio.h>
void __spidy_tests(void) {
  const char *a[] = {"...", ".#.", "..."}; printf("%d\\n", shortest(a, 3, 3));
  const char *b[] = {".#", "#."}; printf("%d\\n", shortest(b, 2, 2));
  const char *c[] = {"....#", "###.#", "....#", ".####", "....."}; printf("%d\\n", shortest(c, 5, 5));
  const char *d[] = {"."}; printf("%d\\n", shortest(d, 1, 1));
  const char *e[] = {"..........", "#########.", "..........", ".#########", ".........."}; printf("%d\\n", shortest(e, 5, 10));
}
`},
{
  id: "c-revwords", mod: "dsa-3", title: "Reverse the words in a sentence", level: "Medium", topic: "Strings",
  desc: `Write <code>void reverse_words(char *s)</code> that reverses the order of words in place. Words are separated by single spaces and there are no leading or trailing spaces. "spi i2c uart" becomes "uart i2c spi".`,
  hint: "Reverse the whole string, then reverse each word.",
  kind: "function",
  starter: `void reverse_words(char *s) {
}
`,
  solution: `static void rv(char *a, char *b) { while (a < b) { char t = *a; *a++ = *b; *b-- = t; } }
void reverse_words(char *s) {
  char *e = s; while (*e) e++;
  if (e == s) return;
  rv(s, e - 1);
  char *w = s;
  for (char *p = s; ; p++) { if (*p == ' ' || *p == '\\0') { rv(w, p - 1); if (!*p) break; w = p + 1; } }
}
`,
  harness: `#include <stdio.h>
#include <string.h>
void __spidy_tests(void) {
  const char *t[] = {"spi i2c uart", "hello", "", "a b", "the quick brown fox jumps"};
  for (int i = 0; i < 5; i++) { char buf[64]; strcpy(buf, t[i]); reverse_words(buf); printf("[%s]\\n", buf); }
}
`},
];
