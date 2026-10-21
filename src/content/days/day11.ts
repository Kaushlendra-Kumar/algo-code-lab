import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 11,
    title: 'Recursion, Base Cases and the Call Stack',
    zone: 'recursion',
    objectives: [
      'Write recursive functions with correct base cases and progress toward them',
      'Trace the call stack and reason about recursion depth',
      'Use the "trust the recursive call" (inductive) mindset',
      'Analyse recursive time with recurrences and space with maximum depth',
    ],
    prerequisites: ['Functions and parameters in C++', 'Day 10: stacks'],
    lesson: [
      {
        heading: 'Anatomy of a recursive function',
        body: '1. **Base case**: an input small enough to answer directly.\n2. **Recursive case**: express the answer using the same function on a strictly smaller input.\n3. **Progress**: every call moves toward a base case. Missing either leads to infinite recursion and a stack overflow.',
      },
      {
        heading: 'The call stack',
        body: 'Each call gets a stack frame holding its parameters and local variables. Frames are pushed on call and popped on return — LIFO, exactly like Day 10. Space complexity is O(maximum depth). Default stacks are typically 1–8 MB, so depth around 10⁵–10⁶ can crash; convert very deep recursion to loops.',
      },
      {
        heading: 'Trust the recursion',
        body: 'Don\'t trace every level in your head. Assume the call on the smaller input returns the right answer (the inductive hypothesis) and check only that you combine it correctly and that the base case is right. That is mathematical induction in code.',
      },
      {
        heading: 'Analysing cost',
        body: '- `f(n) = f(n − 1) + O(1)` → O(n) time, O(n) depth.\n- `f(n) = f(n / 2) + O(1)` → O(log n) (fast power, binary search).\n- `f(n) = 2 f(n / 2) + O(n)` → O(n log n) (merge sort).\n- `f(n) = f(n − 1) + f(n − 2)` → exponential, unless results are cached (Day 26).',
      },
    ],
    recognition: [
      'The input is self-similar (trees, nested lists, expressions) → recursion is natural.',
      'The answer for n is easy given the answer for a smaller n.',
      'Recursion depth could be huge (long lists) → prefer iteration.',
      'The same arguments are computed repeatedly → add memoisation (Day 26).',
    ],
    patterns: ['recursive-decomposition', 'divide-and-conquer'],
    visualizations: ['recursion'],
    exampleA: {
      id: 'd11-A',
      title: 'Fast exponentiation by halving',
      goal: 'Compute xⁿ with O(log n) multiplications.',
      input: '2^10 and 3^13',
      output: '2^10 = 1024\n3^13 = 1594323',
      idea: 'xⁿ = (x^(n/2))² when n is even, and x · (x^(n/2))² when n is odd. Each call halves n, so the depth is about log₂ n.',
      code: cpp`
#include <iostream>
using namespace std;

long long power(long long x, int n) {
    if (n == 0) return 1;                // base case
    long long half = power(x, n / 2);    // trust the smaller call
    long long result = half * half;      //@gap
    if (n % 2 == 1) result *= x;         //@gap
    return result;
}

int main() {
    cout << "2^10 = " << power(2, 10) << "\n";
    cout << "3^13 = " << power(3, 13) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (n == 0) return 1;', note: 'x⁰ = 1 — every chain of halvings ends here.' },
        { match: 'long long half = power(x, n / 2);', note: 'Compute the half power ONCE and reuse it; calling power twice would make the algorithm O(n).' },
        { match: 'if (n % 2 == 1) result *= x;', note: 'Odd exponent: one extra factor of x.' },
      ],
      dryRun: {
        columns: ['call', 'n', 'half', 'result returned'],
        rows: [
          ['power(3,13)', '13', 'power(3,6) = 729', '729² · 3 = 1594323'],
          ['power(3,6)', '6', 'power(3,3) = 27', '27² = 729'],
          ['power(3,3)', '3', 'power(3,1) = 3', '3² · 3 = 27'],
          ['power(3,1)', '1', 'power(3,0) = 1', '1² · 3 = 3'],
          ['power(3,0)', '0', '—', '1 (base case)'],
        ],
      },
      complexity: { time: 'O(log n)', space: 'O(log n)', why: 'n halves on each call; each frame does O(1) work and the stack is log n deep.' },
      edgeCases: ['n = 0 → 1', 'x = 0', 'Overflow for large results — use modular arithmetic in practice'],
      mistakes: ['power(x, n/2) * power(x, n/2) — two recursive calls make it O(n)', 'No base case → infinite recursion'],
      tryIt: 'Make it compute xⁿ mod 1 000 000 007 for n up to 10¹⁸ (use long long n and take % after every multiplication).',
      bug: {
        find: 'if (n % 2 == 1) result *= x;',
        replace: 'if (n % 2 == 0) result *= x;',
        symptom: 'The program prints "2^10 = 32" instead of 1024.',
        explanation: 'The extra factor belongs to odd exponents: x^(2k+1) = (x^k)² · x. Applying it to even exponents multiplies by x at the wrong levels.',
      },
    },
    exampleB: {
      id: 'd11-B',
      kind: 'variant',
      title: 'Tower of Hanoi — recursion as a plan',
      goal: 'Move n disks from peg A to peg C using peg B, never placing a larger disk on a smaller one. Print the moves.',
      input: 'n = 3',
      output: 'A -> C\nA -> B\nC -> B\nA -> C\nB -> A\nB -> C\nA -> C\ntotal moves: 7',
      idea: 'To move n disks: move the top n − 1 out of the way to the spare peg, move the largest disk, then move the n − 1 disks on top of it. Each sub-step is the same problem with one fewer disk.',
      code: cpp`
#include <iostream>
using namespace std;

int moves = 0;

void hanoi(int n, char from, char to, char spare) {
    if (n == 0) return;
    hanoi(n - 1, from, spare, to);
    cout << from << " -> " << to << "\n";
    moves++;
    hanoi(n - 1, spare, to, from);
}

int main() {
    hanoi(3, 'A', 'C', 'B');
    cout << "total moves: " << moves << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (n == 0) return;', note: 'Zero disks: nothing to move.' },
        { match: 'hanoi(n - 1, from, spare, to);', note: 'Clear the way: park n − 1 disks on the spare peg.' },
        { match: 'hanoi(n - 1, spare, to, from);', note: 'Stack the n − 1 disks back on top of the largest one.' },
      ],
      dryRun: {
        columns: ['call', 'action'],
        rows: [
          ['hanoi(3,A,C,B)', 'needs hanoi(2,A,B,C) first'],
          ['hanoi(2,A,B,C)', 'A->C, A->B, C->B (two disks parked on B)'],
          ['hanoi(3,…)', 'moves the largest disk A->C'],
          ['hanoi(2,B,C,A)', 'B->A, B->C, A->C'],
        ],
      },
      complexity: { time: 'O(2ⁿ)', space: 'O(n)', why: 'T(n) = 2T(n − 1) + 1 = 2ⁿ − 1 moves; recursion depth is n.' },
      edgeCases: ['n = 0 prints only the total', 'n = 1 is a single move'],
      mistakes: ['Swapping the roles of to/spare in the recursive calls'],
      tryIt: 'Without printing moves, return the move count for n = 30 using the recurrence (and compare with 2ⁿ − 1).',
    },
    complexityNotes: 'Recursive cost = number of calls × work per call. Halving recursions are logarithmic; binary branching on n − 1 is exponential. Space is the maximum depth of simultaneously active calls.',
    quiz: [
      {
        prompt: 'What is the space complexity of a recursion f(n) = f(n − 1) + O(1)?',
        options: ['O(1)', 'O(log n)', 'O(n) — n frames are on the stack at the deepest point', 'O(n²)'],
        answer: 2,
        explanation: 'The deepest chain has n active calls.',
      },
      {
        prompt: 'Why is power(x, n/2) * power(x, n/2) much slower than computing the half once?',
        options: ['Multiplication is slow', 'It doubles the calls at every level: T(n) = 2T(n/2) + O(1) = O(n)', 'It overflows', 'It is not slower'],
        answer: 1,
        explanation: 'Reusing the result keeps it at one call per level: O(log n).',
      },
      {
        prompt: 'A recursive function processes a linked list of 10⁶ nodes, one call per node. What is the main risk?',
        options: ['Wrong answer', 'Stack overflow from 10⁶ frames', 'Exponential time', 'Integer overflow'],
        answer: 1,
        explanation: 'Use an iterative loop for very deep linear recursion.',
      },
    ],
    recap: 'Recursion = base case + smaller self-call + progress. Trust the smaller call, combine correctly, and measure cost by calls × work and space by depth.',
    nextPrep: 'Tomorrow: backtracking — recursion that builds candidates step by step and undoes choices.',
  },
  questions: [
    {
      id: 'd11-fast-power-mod',
      day: 11,
      title: 'Modular Power',
      difficulty: 'Easy',
      topic: 'recursion',
      patterns: ['recursive-decomposition', 'divide-and-conquer'],
      objective: 'Combine halving recursion with modular arithmetic.',
      statement: 'Given integers x, n and m, print xⁿ mod m. n can be as large as 10¹⁸, so repeated multiplication is too slow.',
      constraints: ['0 ≤ x ≤ 10⁹', '0 ≤ n ≤ 10¹⁸', '1 ≤ m ≤ 10⁹'],
      examples: [{ input: 'x = 2, n = 10, m = 1000', output: '24' }],
      edgeCases: ['n = 0 → 1 mod m', 'm = 1 → 0', 'x ≥ m'],
      cues: ['Huge exponent → halve it recursively'],
      hints: ['xⁿ = (x^(n/2))² · (x if n odd).', 'Reduce modulo m after every multiplication.', 'Products of two values < 10⁹ fit in 64 bits.'],
      approach: 'Recursive fast power with % m at each step.',
      correctness: '(a·b) mod m = ((a mod m)(b mod m)) mod m, so intermediate reduction preserves the result.',
      complexity: { time: 'O(log n)', space: 'O(log n)', why: 'One call per halving.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long powMod(long long x, long long n, long long m) {
    if (n == 0) return 1 % m;
    long long half = powMod(x, n / 2, m);
    long long r = half * half % m;
    if (n % 2) r = r * (x % m) % m;
    return r;
}`,
      main: cpp`
int main() {
    long long x, n, m;
    cin >> x >> n >> m;
    cout << powMod(x, n, m) << "\n";
    return 0;
}`,
      io: 'Input: x n m. Output: xⁿ mod m.',
      keyLines: [{ match: 'if (n == 0) return 1 % m;', note: '1 % m handles m = 1 (answer 0).' }],
      mistakes: ['Returning 1 when m = 1', 'Overflow from multiplying before reducing'],
      tests: [
        { in: '2 10 1000', out: '24' },
        { in: '5 0 7', out: '1' },
        { in: '7 3 1', out: '0' },
        { in: '2 1000000000000000000 1000000007', out: '719476260' },
      ],
    },
    {
      id: 'd11-recursive-palindrome',
      day: 11,
      title: 'Palindrome by Recursion',
      difficulty: 'Easy',
      topic: 'recursion',
      patterns: ['recursive-decomposition'],
      objective: 'Express a check on a range via a smaller range.',
      statement: 'Using recursion on index bounds, print `true` if a lowercase word is a palindrome.',
      constraints: ['1 ≤ |s| ≤ 10⁴'],
      examples: [{ input: 's = "level"', output: 'true' }],
      edgeCases: ['Single character', 'Even length'],
      cues: ['A range is a palindrome if its ends match and the inside is a palindrome'],
      hints: ['Base case: l ≥ r.', 'Compare s[l] and s[r], then recurse on (l + 1, r − 1).'],
      approach: 'isPal(l, r) = l ≥ r || (s[l] == s[r] && isPal(l + 1, r − 1)).',
      correctness: 'Induction on the range length.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'n/2 calls deep.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

bool isPal(const string& s, int l, int r) {
    if (l >= r) return true;
    return s[l] == s[r] && isPal(s, l + 1, r - 1);
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << (isPal(s, 0, (int)s.size() - 1) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: a word. Output: true or false.',
      keyLines: [{ match: 'if (l >= r) return true;', note: 'Empty or one-character range.' }],
      mistakes: ['Passing the string by value (O(n²) copying)'],
      tests: [
        { in: 'level', out: 'true' },
        { in: 'ab', out: 'false' },
        { in: 'x', out: 'true' },
        { in: 'abba', out: 'true' },
      ],
      viz: 'recursion',
    },
    {
      id: 'd11-hanoi-count',
      day: 11,
      title: 'Hanoi Move Count',
      difficulty: 'Easy',
      topic: 'recursion',
      patterns: ['recursive-decomposition'],
      objective: 'Turn a recursive procedure into a recurrence.',
      statement: 'Print the minimum number of moves to solve Tower of Hanoi with n disks.',
      constraints: ['0 ≤ n ≤ 62'],
      examples: [{ input: 'n = 3', output: '7' }],
      edgeCases: ['n = 0', 'n = 62 (fits in signed 64-bit)'],
      cues: ['T(n) = 2T(n − 1) + 1'],
      hints: ['Follow the recursive plan from Example B.', 'Count instead of printing.'],
      approach: 'moves(n) = 0 if n = 0 else 2·moves(n − 1) + 1.',
      correctness: 'Each level moves n − 1 disks twice plus the largest disk once; this is optimal.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One call per disk count.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long hanoiMoves(int n) {
    if (n == 0) return 0;
    return 2 * hanoiMoves(n - 1) + 1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    cout << hanoiMoves(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: number of moves.',
      keyLines: [{ match: 'return 2 * hanoiMoves(n - 1) + 1;', note: 'Two sub-towers plus the largest disk.' }],
      mistakes: ['Simulating all 2ⁿ moves'],
      tests: [
        { in: '3', out: '7' },
        { in: '0', out: '0' },
        { in: '1', out: '1' },
        { in: '62', out: '4611686018427387903' },
      ],
    },
    {
      id: 'd11-kth-symbol',
      day: 11,
      title: 'K-th Symbol in a Growing Code',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['recursive-decomposition'],
      objective: 'Recurse on the structure instead of building it.',
      statement: 'Row 1 is "0". Each next row replaces 0 with "01" and 1 with "10". Print the k-th symbol (1-based) of row n.',
      constraints: ['1 ≤ n ≤ 30', '1 ≤ k ≤ 2ⁿ⁻¹'],
      examples: [{ input: 'n = 4, k = 5', output: '1', explanation: 'Row 4 = 01101001' }],
      edgeCases: ['n = 1', 'k at the end of the row'],
      cues: ['Building row 30 needs 2²⁹ symbols → recurse on the parent symbol'],
      hints: ['Symbol k in row n comes from symbol (k + 1)/2 in row n − 1.', 'Odd k copies the parent; even k flips it.'],
      approach: 'kth(n, k) = n == 1 ? 0 : kth(n − 1, (k+1)/2) XOR (k is even).',
      correctness: 'Each parent produces (parent, !parent) in positions (2j − 1, 2j).',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One call per row.' },
      cpp: cpp`
#include <iostream>
using namespace std;

int kthSymbol(int n, long long k) {
    if (n == 1) return 0;
    int parent = kthSymbol(n - 1, (k + 1) / 2);
    return (k % 2 == 1) ? parent : 1 - parent;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    cout << kthSymbol(n, k) << "\n";
    return 0;
}`,
      io: 'Input: n k. Output: 0 or 1.',
      keyLines: [{ match: 'int parent = kthSymbol(n - 1, (k + 1) / 2);', note: 'Positions 2j − 1 and 2j share parent j.' }],
      mistakes: ['Generating whole rows (memory explodes)'],
      tests: [
        { in: '4 5', out: '1' },
        { in: '1 1', out: '0' },
        { in: '2 2', out: '1' },
        { in: '30 536870912', out: '1' },
      ],
    },
    {
      id: 'd11-binary-no-11',
      day: 11,
      title: 'Codes Without Consecutive Ones',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['recursive-decomposition', 'backtracking'],
      objective: 'Generate strings recursively while respecting a local constraint.',
      statement: 'Print, in lexicographic order, all binary strings of length n with no two consecutive 1s, then their count.',
      constraints: ['1 ≤ n ≤ 12'],
      examples: [{ input: 'n = 3', output: '000\n001\n010\n100\n101\ncount 5' }],
      edgeCases: ['n = 1'],
      cues: ['Build character by character; the next choice depends on the previous character'],
      hints: ['Always try "0" first (lexicographic order).', 'Append "1" only if the previous character is not "1".'],
      approach: 'gen(prefix): if |prefix| = n output; else gen(prefix+"0"); if last ≠ 1 gen(prefix+"1").',
      correctness: 'Every valid string is produced once; invalid extensions are never created.',
      complexity: { time: 'O(n · F(n))', space: 'O(n)', why: 'F(n) ≈ Fibonacci many strings, each of length n.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

int countOut = 0;

void gen(string& cur, int n) {
    if ((int)cur.size() == n) {
        cout << cur << "\n";
        countOut++;
        return;
    }
    cur.push_back('0');
    gen(cur, n);
    cur.pop_back();
    if (cur.empty() || cur.back() != '1') {
        cur.push_back('1');
        gen(cur, n);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    string cur;
    gen(cur, n);
    cout << "count " << countOut << "\n";
    return 0;
}`,
      io: 'Input: n. Output: the strings, then "count c".',
      keyLines: [{ match: "if (cur.empty() || cur.back() != '1') {", note: 'Only add 1 after a 0 (or at the start).' }],
      mistakes: ['Checking cur.back() on an empty string'],
      tests: [
        { in: '3', out: '000\n001\n010\n100\n101\ncount 5' },
        { in: '1', out: '0\n1\ncount 2' },
        { in: '2', out: '00\n01\n10\ncount 3' },
        { in: '4', out: '0000\n0001\n0010\n0100\n0101\n1000\n1001\n1010\ncount 8' },
      ],
    },
    {
      id: 'd11-nested-depth-sum',
      day: 11,
      title: 'Weighted Nested Boxes',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['recursive-decomposition', 'expression-parsing'],
      objective: 'Parse a nested structure with a recursive descent parser.',
      statement: 'A nested list such as [1,[4,[6]]] contains integers at different depths (outer list = depth 1). Print the sum of each integer multiplied by its depth.',
      constraints: ['Length ≤ 10⁴', 'Integers may be negative', 'Valid syntax, no spaces'],
      examples: [{ input: '[1,[4,[6]]]', output: '27', explanation: '1·1 + 4·2 + 6·3' }],
      edgeCases: ['Empty lists []', 'Negative numbers', 'Deep nesting'],
      cues: ['Nested brackets → recursive parser with a depth parameter'],
      hints: ['Write parseList(depth) that reads "[" … "]".', 'Inside, an element is either a number or another list.', 'Pass depth + 1 to nested lists.'],
      approach: 'Recursive descent over the string with a shared position index.',
      correctness: 'The grammar list := [ (elem (, elem)*)? ], elem := int | list is parsed exactly once per character.',
      complexity: { time: 'O(n)', space: 'O(depth)', why: 'Each character is read once.' },
      cpp: cpp`
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

string s;
size_t pos = 0;

long long parseList(int depth) {
    long long total = 0;
    pos++;  // skip '['
    while (s[pos] != ']') {
        if (s[pos] == ',') {
            pos++;
            continue;
        }
        if (s[pos] == '[') {
            total += parseList(depth + 1);
        } else {
            bool neg = s[pos] == '-';
            if (neg) pos++;
            long long v = 0;
            while (isdigit((unsigned char)s[pos])) v = v * 10 + (s[pos++] - '0');
            total += (neg ? -v : v) * depth;
        }
    }
    pos++;  // skip ']'
    return total;
}`,
      main: cpp`
int main() {
    cin >> s;
    cout << parseList(1) << "\n";
    return 0;
}`,
      io: 'Input: one nested list. Output: the weighted sum.',
      keyLines: [{ match: 'total += parseList(depth + 1);', note: 'The nested list consumes its own brackets and returns its weighted sum.' }],
      mistakes: ['Using a global depth counter that is not restored'],
      tests: [
        { in: '[1,[4,[6]]]', out: '27' },
        { in: '[[1,1],2,[1,1]]', out: '10' },
        { in: '[]', out: '0' },
        { in: '[-3,[[-2]]]', out: '-9' },
      ],
    },
    {
      id: 'd11-decode-string',
      day: 11,
      title: 'Expand Compressed Text',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['recursive-decomposition', 'expression-parsing'],
      objective: 'Recursively expand k[...] groups.',
      statement: 'Decode strings like 3[a2[c]] where k[x] means x repeated k times. Print the expanded string.',
      constraints: ['|s| ≤ 100', 'Output length ≤ 10⁵', 'Lowercase letters, digits and brackets'],
      examples: [{ input: '3[a2[c]]', output: 'accaccacc' }],
      edgeCases: ['Multi-digit counts like 10[a]', 'Letters outside brackets'],
      cues: ['Nested repetition → recursion returns the decoded inside of a bracket'],
      hints: ['decode() reads until "]" or the end.', 'Digits form k; after "[" recurse; repeat the result k times.'],
      approach: 'Recursive descent: letters append; number + bracket → recurse and repeat.',
      correctness: 'Each bracket pair is decoded by exactly one recursive call.',
      complexity: { time: 'O(output length)', space: 'O(output + depth)', why: 'Each output character is produced once per enclosing copy.' },
      cpp: cpp`
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

string decode(const string& s, size_t& i) {
    string out;
    while (i < s.size() && s[i] != ']') {
        if (isdigit((unsigned char)s[i])) {
            int k = 0;
            while (isdigit((unsigned char)s[i])) k = k * 10 + (s[i++] - '0');
            i++;  // '['
            string inner = decode(s, i);
            i++;  // ']'
            while (k--) out += inner;
        } else {
            out += s[i++];
        }
    }
    return out;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    size_t i = 0;
    cout << decode(s, i) << "\n";
    return 0;
}`,
      io: 'Input: encoded string. Output: decoded string.',
      keyLines: [{ match: 'string inner = decode(s, i);', note: 'The recursive call stops at the matching "]".' }],
      mistakes: ['Reading only single-digit counts'],
      tests: [
        { in: '3[a2[c]]', out: 'accaccacc' },
        { in: '2[abc]3[cd]ef', out: 'abcabccdcdcdef' },
        { in: '10[a]', out: 'aaaaaaaaaa' },
        { in: 'xy', out: 'xy' },
      ],
    },
    {
      id: 'd11-expression-eval',
      day: 11,
      title: 'Calculator With Parentheses',
      difficulty: 'Hard',
      topic: 'recursion',
      patterns: ['recursive-decomposition', 'expression-parsing'],
      objective: 'Implement operator precedence with mutually recursive functions.',
      statement: 'Evaluate an integer expression with + − * /, parentheses and unary minus (no spaces). Division truncates toward zero.',
      constraints: ['Length ≤ 10⁴', 'Valid expression', 'Values fit in 64-bit; no division by zero'],
      examples: [{ input: '2*(3+4)-5', output: '9' }],
      edgeCases: ['Unary minus: -(2+3)', 'Nested parentheses', 'Left associativity: 8/2/2 = 2'],
      cues: ['Precedence levels → expr := term (± term)*, term := factor (*/ factor)*, factor := number | (expr) | -factor'],
      hints: ['Write one function per precedence level.', 'factor handles numbers, parentheses and unary minus.', 'Loop (not recurse) for left-associative operators.'],
      approach: 'Recursive descent parser with expr/term/factor.',
      correctness: 'The grammar encodes precedence (* / bind tighter) and left associativity via loops.',
      complexity: { time: 'O(n)', space: 'O(depth)', why: 'Each character consumed once.' },
      cpp: cpp`
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

string s;
size_t p = 0;
long long expr();

long long factor() {
    if (s[p] == '-') {
        p++;
        return -factor();
    }
    if (s[p] == '(') {
        p++;
        long long v = expr();
        p++;  // ')'
        return v;
    }
    long long v = 0;
    while (p < s.size() && isdigit((unsigned char)s[p])) v = v * 10 + (s[p++] - '0');
    return v;
}

long long term() {
    long long v = factor();
    while (p < s.size() && (s[p] == '*' || s[p] == '/')) {
        char op = s[p++];
        long long r = factor();
        v = (op == '*') ? v * r : v / r;
    }
    return v;
}

long long expr() {
    long long v = term();
    while (p < s.size() && (s[p] == '+' || s[p] == '-')) {
        char op = s[p++];
        long long r = term();
        v = (op == '+') ? v + r : v - r;
    }
    return v;
}`,
      main: cpp`
int main() {
    cin >> s;
    cout << expr() << "\n";
    return 0;
}`,
      io: 'Input: one expression. Output: its value.',
      keyLines: [
        { match: 'long long expr();', note: 'Forward declaration: factor calls expr for parentheses.' },
        { match: 'while (p < s.size() && (s[p] == \'*\' || s[p] == \'/\')) {', note: 'A loop gives left associativity.' },
      ],
      mistakes: ['Right-recursive grammar makes 8-2-2 evaluate as 8-(2-2)'],
      tests: [
        { in: '2*(3+4)-5', out: '9' },
        { in: '8/2/2', out: '2' },
        { in: '-(2+3)*2', out: '-10' },
        { in: '1-(-7/2)', out: '4' },
      ],
    },
  ],
};

export default day;
