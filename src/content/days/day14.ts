import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 14,
    title: 'Bit Manipulation, Masks and XOR',
    zone: 'foundations',
    objectives: [
      'Read and write individual bits with &, |, ^, ~, << and >>',
      'Use XOR cancellation to find unpaired values',
      'Represent subsets of up to ~20 items as integer masks',
      'Avoid precedence and overflow pitfalls with shifts',
    ],
    prerequisites: ['Binary representation of integers', 'Day 12: subsets'],
    lesson: [
      {
        heading: 'The operators',
        body: '- `x & y`: bits set in both. `x | y`: bits set in either. `x ^ y`: bits set in exactly one.\n- `x << k` multiplies by 2ᵏ; `x >> k` divides by 2ᵏ (for non-negative x).\n- Test bit i: `(x >> i) & 1`. Set: `x | (1 << i)`. Clear: `x & ~(1 << i)`. Toggle: `x ^ (1 << i)`.',
      },
      {
        heading: 'Useful identities',
        body: '- `x & (x − 1)` removes the lowest set bit → loop it to count set bits (Kernighan).\n- `x > 0 && (x & (x − 1)) == 0` ⇔ x is a power of two.\n- `x & −x` isolates the lowest set bit.\n- XOR: `a ^ a = 0`, `a ^ 0 = a`, order does not matter — pairs cancel.',
      },
      {
        heading: 'Masks as sets',
        body: 'With n ≤ 20, an integer `mask` in [0, 2ⁿ) describes a subset: bit i set ⇔ item i is chosen. Looping `mask` from 0 to 2ⁿ − 1 enumerates all subsets without recursion. Union is `|`, intersection `&`, difference `& ~`.',
      },
      {
        heading: 'Pitfalls',
        body: '- Precedence: `x & 1 == 0` parses as `x & (1 == 0)`. Always parenthesise.\n- `1 << 40` overflows an int; write `1LL << 40`.\n- Right-shifting negative numbers and shifting by ≥ the bit width are implementation-defined or undefined — work with unsigned types for bit tricks.\n- `__builtin_popcount` (GCC/Clang) counts bits in O(1); `std::bitset<N>` and C++20 `std::popcount` are portable alternatives.',
      },
    ],
    recognition: [
      '"Every element appears twice except one" → XOR everything.',
      'Small set of booleans (≤ 64) or n ≤ 20 subsets → bit masks.',
      '"Power of two", "count set bits", "flip bits" → bit identities.',
    ],
    patterns: ['xor-properties', 'bit-masks', 'bit-ops', 'subset-enumeration'],
    visualizations: ['complexity'],
    exampleA: {
      id: 'd14-A',
      title: 'Bit toolkit: count, test, power of two, XOR',
      goal: 'Demonstrate the core bit operations on concrete numbers.',
      input: 'x = 44 (101100₂), nums = {4, 1, 2, 1, 2}',
      output: 'popcount(44) = 3\nbit 2 of 44 is 1\n44 with bit 0 set = 45\n44 with bit 3 cleared = 36\n64 is power of two: yes\n44 is power of two: no\nunpaired value = 4',
      idea: 'Each operation targets specific bits with a mask built by shifting 1. XOR of all numbers leaves only the unpaired one because equal values cancel.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

int popcount(unsigned x) {
    int count = 0;
    while (x) {
        x &= x - 1;  // drop the lowest set bit
        count++;
    }
    return count;
}

bool isPowerOfTwo(long long x) { return x > 0 && (x & (x - 1)) == 0; }

int main() {
    unsigned x = 44;  // 101100 in binary
    cout << "popcount(44) = " << popcount(x) << "\n";
    cout << "bit 2 of 44 is " << ((x >> 2) & 1) << "\n";
    cout << "44 with bit 0 set = " << (x | (1u << 0)) << "\n";
    cout << "44 with bit 3 cleared = " << (x & ~(1u << 3)) << "\n";
    cout << "64 is power of two: " << (isPowerOfTwo(64) ? "yes" : "no") << "\n";
    cout << "44 is power of two: " << (isPowerOfTwo(44) ? "yes" : "no") << "\n";
    vector<int> nums = {4, 1, 2, 1, 2};
    int acc = 0;
    for (int v : nums) acc ^= v;  //@gap
    cout << "unpaired value = " << acc << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'x &= x - 1;', note: 'Subtracting 1 flips the lowest set bit and everything below it; AND removes exactly that bit.' },
        { match: 'return x > 0 && (x & (x - 1)) == 0;', note: 'Powers of two have exactly one set bit. Parentheses matter: == binds tighter than &.' },
        { match: '(x & ~(1u << 3))', note: '~ builds a mask with every bit except bit 3.' },
        { match: 'for (int v : nums) acc ^= v;', note: 'Pairs cancel (a ^ a = 0); the unpaired value survives.' },
      ],
      dryRun: {
        columns: ['step', 'x (binary)', 'count'],
        rows: [
          ['start', '101100', '0'],
          ['x &= x−1', '101000', '1'],
          ['x &= x−1', '100000', '2'],
          ['x &= x−1', '000000', '3 → stop'],
        ],
      },
      complexity: { time: 'O(set bits) for popcount, O(1) for the rest, O(n) for XOR', space: 'O(1)', why: 'Kernighan loops once per set bit; single operations are constant time.' },
      edgeCases: ['x = 0 has no set bits and is not a power of two', 'Negative numbers: use unsigned for bit tricks'],
      mistakes: ['Writing x & x − 1 == 0 without parentheses', 'Using 1 << 31 on a signed int (overflow)'],
      tryIt: 'Print the binary representation of x using bitset<8>(x) and verify each line by hand.',
      bug: {
        find: 'bool isPowerOfTwo(long long x) { return x > 0 && (x & (x - 1)) == 0; }',
        replace: 'bool isPowerOfTwo(long long x) { return x > 0 && (x & (x + 1)) == 0; }',
        symptom: 'The program prints "64 is power of two: no".',
        explanation: 'x & (x − 1) clears the lowest set bit; only a single-bit number becomes 0. x + 1 has no such meaning.',
      },
    },
    exampleB: {
      id: 'd14-B',
      kind: 'variant',
      title: 'Enumerate subsets with a bit mask',
      goal: 'List every subset of {a, b, c} and its mask, without recursion.',
      input: 'items = {a, b, c}',
      output: '000 {}\n001 {a}\n010 {b}\n011 {a,b}\n100 {c}\n101 {a,c}\n110 {b,c}\n111 {a,b,c}',
      idea: 'Every integer from 0 to 2ⁿ − 1 is a distinct subset: bit i says whether item i is included.',
      code: cpp`
#include <bitset>
#include <iostream>
#include <string>
using namespace std;

int main() {
    string items = "abc";
    int n = items.size();
    for (int mask = 0; mask < (1 << n); mask++) {
        cout << bitset<3>(mask) << " {";
        bool first = true;
        for (int i = 0; i < n; i++) {
            if ((mask >> i) & 1) {  //@gap
                cout << (first ? "" : ",") << items[i];
                first = false;
            }
        }
        cout << "}\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'for (int mask = 0; mask < (1 << n); mask++) {', note: '2ⁿ masks, one per subset.' },
        { match: 'if ((mask >> i) & 1) {', note: 'Is item i in this subset?' },
        { match: 'cout << bitset<3>(mask)', note: 'bitset prints the mask in binary (most significant bit first).' },
      ],
      dryRun: {
        columns: ['mask', 'binary', 'bits set', 'subset'],
        rows: [
          ['3', '011', '0, 1', '{a,b}'],
          ['5', '101', '0, 2', '{a,c}'],
          ['6', '110', '1, 2', '{b,c}'],
        ],
      },
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(1)', why: '2ⁿ masks, n bit tests each.' },
      edgeCases: ['n = 0 → one empty subset', 'n ≥ 31 → 1 << n overflows int'],
      mistakes: ['mask <= (1 << n) (one extra iteration)', 'Reading bit i as mask & i'],
      tryIt: 'Print only subsets with exactly two items using __builtin_popcount(mask) == 2.',
    },
    complexityNotes: 'Single bit operations are O(1). Enumerating all masks is O(2ⁿ) (times n to inspect bits), which is fine up to n ≈ 20.',
    quiz: [
      {
        prompt: 'What does x & (x − 1) do?',
        options: ['Sets the lowest bit', 'Removes the lowest set bit', 'Counts bits', 'Doubles x'],
        answer: 1,
        explanation: 'x − 1 flips the lowest set bit and the zeros below it.',
      },
      {
        prompt: 'In {7, 3, 7, 9, 3}, what is the XOR of all elements?',
        options: ['0', '9', '7', '29'],
        answer: 1,
        explanation: '7 and 3 cancel in pairs, leaving 9.',
      },
      {
        prompt: 'Why is `if (x & 1 == 0)` buggy?',
        options: ['& is not allowed on ints', '== binds tighter, so it computes x & (1 == 0) = x & 0 = 0', 'It checks the wrong bit', 'It overflows'],
        answer: 1,
        explanation: 'Write ((x & 1) == 0).',
      },
    ],
    recap: 'Bits give O(1) set operations, XOR cancellation finds unpaired values, and integer masks enumerate subsets compactly for small n.',
    nextPrep: 'Tomorrow: heaps and priority queues — always access the smallest or largest item in O(log n).',
  },
  questions: [
    {
      id: 'd14-single-number',
      day: 14,
      title: 'The Lonely Sock',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['xor-properties'],
      objective: 'XOR all values to cancel pairs.',
      statement: 'Every sock id appears exactly twice except one. Print the id that appears once, in O(n) time and O(1) memory.',
      constraints: ['1 ≤ n ≤ 3·10⁴ (n odd)'],
      examples: [{ input: 'ids = [4, 1, 2, 1, 2]', output: '4' }],
      edgeCases: ['n = 1', 'Negative ids'],
      cues: ['Pairs + one exception → XOR'],
      hints: ['What is a ^ a?', 'XOR is commutative and associative.'],
      approach: 'acc = XOR of all values.',
      correctness: 'Pairs cancel to 0; 0 ^ x = x.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int lonely(const vector<int>& a) {
    int acc = 0;
    for (int x : a) acc ^= x;
    return acc;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << lonely(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n ids. Output: the unpaired id.',
      keyLines: [{ match: 'for (int x : a) acc ^= x;', note: 'Order does not matter.' }],
      mistakes: ['Sorting (O(n log n)) or hashing (O(n) memory)'],
      tests: [
        { in: '5\n4 1 2 1 2', out: '4' },
        { in: '1\n7', out: '7' },
        { in: '3\n-1 5 5', out: '-1' },
        { in: '7\n9 3 9 3 0 8 8', out: '0' },
      ],
    },
    {
      id: 'd14-hamming-distance',
      day: 14,
      title: 'Bits That Differ',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['bit-ops', 'xor-properties'],
      objective: 'Combine XOR with popcount.',
      statement: 'Print the number of bit positions where the two non-negative integers x and y differ.',
      constraints: ['0 ≤ x, y < 2³¹'],
      examples: [{ input: 'x = 1, y = 4', output: '2' }],
      edgeCases: ['x = y → 0'],
      cues: ['"positions that differ" → XOR then count ones'],
      hints: ['x ^ y has a 1 exactly where they differ.', 'Count the set bits.'],
      approach: 'popcount(x ^ y) with Kernighan\'s loop.',
      correctness: 'XOR marks the differing bits.',
      complexity: { time: 'O(1)', space: 'O(1)', why: 'At most 31 iterations.' },
      cpp: cpp`
#include <iostream>
using namespace std;

int hamming(unsigned x, unsigned y) {
    unsigned d = x ^ y;
    int count = 0;
    while (d) {
        d &= d - 1;
        count++;
    }
    return count;
}`,
      main: cpp`
int main() {
    unsigned x, y;
    cin >> x >> y;
    cout << hamming(x, y) << "\n";
    return 0;
}`,
      io: 'Input: x y. Output: Hamming distance.',
      keyLines: [{ match: 'unsigned d = x ^ y;', note: 'Differing bits become 1.' }],
      mistakes: ['Comparing decimal digits'],
      tests: [
        { in: '1 4', out: '2' },
        { in: '3 1', out: '1' },
        { in: '0 0', out: '0' },
        { in: '2147483647 0', out: '31' },
      ],
    },
    {
      id: 'd14-power-of-two',
      day: 14,
      title: 'Is It a Power of Two?',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['bit-ops'],
      objective: 'Use the single-set-bit identity.',
      statement: 'For each of q integers print `true` if it is a power of two.',
      constraints: ['1 ≤ q ≤ 10⁵', '−2⁶² ≤ x ≤ 2⁶²'],
      examples: [{ input: '1 16 18', output: 'true\ntrue\nfalse' }],
      edgeCases: ['0 and negative numbers → false', '1 = 2⁰ → true'],
      cues: ['Power of two ⇔ exactly one set bit'],
      hints: ['x & (x − 1) removes the only set bit of a power of two.', 'Exclude x ≤ 0.'],
      approach: 'x > 0 && (x & (x − 1)) == 0.',
      correctness: 'A positive number has one set bit iff removing its lowest set bit gives 0.',
      complexity: { time: 'O(1) per query', space: 'O(1)', why: 'Constant operations.' },
      cpp: cpp`
#include <iostream>
using namespace std;

bool isPow2(long long x) { return x > 0 && (x & (x - 1)) == 0; }`,
      main: cpp`
int main() {
    int q;
    cin >> q;
    while (q--) {
        long long x;
        cin >> x;
        cout << (isPow2(x) ? "true" : "false") << "\n";
    }
    return 0;
}`,
      io: 'Input: q, then q integers. Output: one line per integer.',
      keyLines: [{ match: 'return x > 0 && (x & (x - 1)) == 0;', note: 'Parenthesise the & expression.' }],
      mistakes: ['Forgetting x > 0', 'Floating-point log2 rounding errors'],
      tests: [
        { in: '3\n1 16 18', out: 'true\ntrue\nfalse' },
        { in: '2\n0 -8', out: 'false\nfalse' },
        { in: '1\n4611686018427387904', out: 'true' },
        { in: '2\n1023 1024', out: 'false\ntrue' },
      ],
    },
    {
      id: 'd14-counting-bits',
      day: 14,
      title: 'Bit Counts From 0 to N',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['bit-ops', 'dp-1d'],
      objective: 'Reuse smaller answers: bits(i) = bits(i >> 1) + (i & 1).',
      statement: 'Print the number of set bits of every integer from 0 to n.',
      constraints: ['0 ≤ n ≤ 10⁵'],
      examples: [{ input: 'n = 5', output: '0 1 1 2 1 2' }],
      edgeCases: ['n = 0'],
      cues: ['Answers for i reuse the answer for i / 2'],
      hints: ['Shifting right drops the last bit.', 'bits[i] = bits[i >> 1] + (i & 1).'],
      approach: 'One-line DP over i.',
      correctness: 'i and i >> 1 share all bits except the lowest one.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each value computed in O(1).' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<int> countBits(int n) {
    vector<int> bits(n + 1, 0);
    for (int i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
    return bits;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> b = countBits(n);
    for (int i = 0; i <= n; i++) cout << b[i] << (i < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n. Output: n + 1 counts.',
      keyLines: [{ match: 'bits[i] = bits[i >> 1] + (i & 1);', note: 'Parentheses around i & 1 are required.' }],
      mistakes: ['Recounting bits of every number from scratch (fine but slower)'],
      tests: [
        { in: '5', out: '0 1 1 2 1 2' },
        { in: '0', out: '0' },
        { in: '2', out: '0 1 1' },
        { in: '8', out: '0 1 1 2 1 2 2 3 1' },
      ],
    },
    {
      id: 'd14-single-number-ii',
      day: 14,
      title: 'One Item Among Triples',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['bit-masks', 'bit-ops'],
      objective: 'Count bits modulo 3 per position.',
      statement: 'Every value appears exactly three times except one, which appears once. Print it in O(n) time and O(1) memory.',
      constraints: ['1 ≤ n ≤ 3·10⁴', 'Values fit in a 32-bit signed int'],
      examples: [{ input: 'a = [2, 2, 3, 2]', output: '3' }],
      edgeCases: ['Negative answer', 'n = 1'],
      cues: ['XOR fails for triples → count each bit position mod 3'],
      hints: ['For each bit, count how many numbers have it set.', 'Counts are multiples of 3 except for the bits of the answer.'],
      approach: 'For bit 0..31: if count % 3 == 1, set that bit in the answer (use unsigned to rebuild, then cast).',
      correctness: 'Tripled numbers contribute multiples of 3 to every bit count.',
      complexity: { time: 'O(32 · n)', space: 'O(1)', why: '32 passes or one pass with 32 counters.' },
      cpp: cpp`
#include <cstdint>
#include <iostream>
#include <vector>
using namespace std;

int singleAmongTriples(const vector<int>& a) {
    uint32_t ans = 0;
    for (int b = 0; b < 32; b++) {
        int count = 0;
        for (int x : a) count += ((uint32_t)x >> b) & 1u;
        if (count % 3) ans |= (1u << b);
    }
    return (int32_t)ans;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << singleAmongTriples(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the single value.',
      keyLines: [{ match: 'for (int x : a) count += ((uint32_t)x >> b) & 1u;', note: 'Shift as unsigned to avoid sign extension issues.' }],
      mistakes: ['Shifting signed negatives', 'Building the answer in int with 1 << 31 (overflow)'],
      tests: [
        { in: '4\n2 2 3 2', out: '3' },
        { in: '7\n0 1 0 1 0 1 99', out: '99' },
        { in: '4\n-2 -2 -2 -7', out: '-7' },
        { in: '1\n5', out: '5' },
      ],
    },
    {
      id: 'd14-single-number-iii',
      day: 14,
      title: 'Two Lonely Values',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['xor-properties', 'bit-ops'],
      objective: 'Split by a differing bit after XOR.',
      statement: 'Exactly two values appear once; all others appear twice. Print the two values in ascending order.',
      constraints: ['2 ≤ n ≤ 3·10⁴'],
      examples: [{ input: 'a = [1, 2, 1, 3, 2, 5]', output: '3 5' }],
      edgeCases: ['Negative values', 'One of them is 0'],
      cues: ['XOR of all = x ^ y; a set bit of it separates x and y'],
      hints: ['Let d = XOR of everything = x ^ y ≠ 0.', 'Pick any set bit of d (e.g. d & −d).', 'Partition numbers by that bit and XOR each group.'],
      approach: 'Lowest set bit splits into two groups each containing one unique value.',
      correctness: 'x and y differ at the chosen bit; pairs fall into the same group and cancel.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two passes.' },
      cpp: cpp`
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <vector>
using namespace std;

pair<int, int> twoSingles(const vector<int>& a) {
    uint32_t d = 0;
    for (int v : a) d ^= (uint32_t)v;
    uint32_t low = d & (~d + 1);  // lowest set bit (d & -d for unsigned)
    uint32_t x = 0, y = 0;
    for (int v : a) {
        if ((uint32_t)v & low) x ^= (uint32_t)v;
        else y ^= (uint32_t)v;
    }
    int p = (int32_t)x, q = (int32_t)y;
    return {min(p, q), max(p, q)};
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    auto [p, q] = twoSingles(a);
    cout << p << " " << q << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the two singles ascending.',
      keyLines: [{ match: 'uint32_t low = d & (~d + 1);', note: 'Two\'s complement: ~d + 1 = −d, so this isolates the lowest set bit without signed overflow.' }],
      mistakes: ['d & -d with d = INT_MIN as a signed int (overflow)'],
      tests: [
        { in: '6\n1 2 1 3 2 5', out: '3 5' },
        { in: '2\n-1 0', out: '-1 0' },
        { in: '4\n7 9 7 11', out: '9 11' },
        { in: '2\n2147483647 -2147483648', out: '-2147483648 2147483647' },
      ],
    },
    {
      id: 'd14-subset-sums-mask',
      day: 14,
      title: 'Count Subsets by Mask',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['subset-enumeration', 'bit-masks'],
      objective: 'Enumerate subsets iteratively with masks.',
      statement: 'Count the subsets (including the empty one) of n integers whose sum equals target.',
      constraints: ['1 ≤ n ≤ 20', '|value| ≤ 10⁶'],
      examples: [{ input: 'a = [1, 2, 3], target = 3', output: '2', explanation: '{1,2} and {3}' }],
      edgeCases: ['target = 0 counts the empty set', 'Negative values'],
      cues: ['n ≤ 20 → loop over 2ⁿ masks'],
      hints: ['For each mask, sum the elements whose bit is set.', '2²⁰ · 20 ≈ 2·10⁷ operations — fine.'],
      approach: 'Double loop over masks and bits.',
      correctness: 'Masks are in bijection with subsets.',
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(1)', why: 'Each mask inspected in O(n).' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long countSubsets(const vector<long long>& a, long long target) {
    int n = a.size();
    long long count = 0;
    for (long long mask = 0; mask < (1LL << n); mask++) {
        long long sum = 0;
        for (int i = 0; i < n; i++)
            if ((mask >> i) & 1) sum += a[i];
        if (sum == target) count++;
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    long long t;
    cin >> n >> t;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << countSubsets(a, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n integers. Output: number of subsets.',
      keyLines: [{ match: 'for (long long mask = 0; mask < (1LL << n); mask++) {', note: '1LL keeps the shift 64-bit.' }],
      mistakes: ['Forgetting that the empty set sums to 0'],
      tests: [
        { in: '3 3\n1 2 3', out: '2' },
        { in: '2 0\n5 -5', out: '2' },
        { in: '4 10\n1 2 3 4', out: '1' },
        { in: '3 100\n1 2 3', out: '0' },
      ],
    },
    {
      id: 'd14-max-xor-pair',
      day: 14,
      title: 'Maximum XOR of Two Numbers',
      difficulty: 'Hard',
      topic: 'foundations',
      patterns: ['bit-masks', 'trie', 'hash-lookup'],
      objective: 'Build the answer greedily bit by bit using prefix sets.',
      statement: 'Print the maximum value of a[i] XOR a[j] over all pairs (i may equal j).',
      constraints: ['1 ≤ n ≤ 2·10⁵', '0 ≤ a[i] < 2³¹'],
      examples: [{ input: 'a = [3, 10, 5, 25, 2, 8]', output: '28', explanation: '5 ^ 25 = 28' }],
      edgeCases: ['n = 1 → 0', 'All equal → 0'],
      cues: ['Maximise XOR → decide bits from the most significant down'],
      hints: ['Try to set bit b of the answer, keeping higher bits fixed.', 'Store all prefixes (numbers masked to bits ≥ b) in a set.', 'The bit is achievable if some prefix p has (candidate ^ p) also in the set.'],
      brute: 'All pairs: O(n²).',
      approach: 'Greedy over bits 30..0 with a hash set of prefixes (a binary trie also works).',
      correctness: 'a ^ b = c ⇔ a ^ c = b, so checking membership of candidate ^ p finds a pair achieving the candidate prefix.',
      complexity: { time: 'O(31 · n)', space: 'O(n)', why: '31 rounds of building a set and n lookups.' },
      cpp: cpp`
#include <iostream>
#include <unordered_set>
#include <vector>
using namespace std;

int maxXor(const vector<int>& a) {
    int ans = 0, mask = 0;
    for (int b = 30; b >= 0; b--) {
        mask |= (1 << b);
        unordered_set<int> prefixes;
        for (int x : a) prefixes.insert(x & mask);
        int candidate = ans | (1 << b);
        for (int p : prefixes) {
            if (prefixes.count(candidate ^ p)) {
                ans = candidate;
                break;
            }
        }
    }
    return ans;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << maxXor(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: maximum pairwise XOR.',
      keyLines: [
        { match: 'int candidate = ans | (1 << b);', note: 'Greedily try to set the current bit.' },
        { match: 'if (prefixes.count(candidate ^ p)) {', note: 'Two prefixes XOR to candidate exactly when p ^ candidate is also a prefix.' },
      ],
      mistakes: ['Starting from bit 31 for signed int (1 << 31 overflows)'],
      tests: [
        { in: '6\n3 10 5 25 2 8', out: '28' },
        { in: '1\n7', out: '0' },
        { in: '3\n8 8 8', out: '0' },
        { in: '8\n14 70 53 83 49 91 36 80', out: '127' },
      ],
    },
  ],
};

export default day;
