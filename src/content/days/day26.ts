import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 26,
    title: 'Dynamic Programming Foundations',
    zone: 'dynamic-programming',
    objectives: [
      'Recognise overlapping subproblems and optimal substructure',
      'Define a DP state, base cases and a transition precisely',
      'Convert exponential recursion into memoisation and then tabulation',
      'Analyse DP cost as (number of states) × (work per state)',
    ],
    prerequisites: ['Day 11: recursion', 'Day 12: backtracking (the brute force DP improves on)'],
    lesson: [
      {
        heading: 'When does DP apply?',
        body: '1. **Overlapping subproblems** — the naive recursion solves the same smaller problem many times.\n2. **Optimal substructure** — the best answer for a problem is built from best answers of its subproblems.\nIf both hold, store each subproblem\'s answer once and reuse it.',
      },
      {
        heading: 'The DP recipe',
        body: '- **State**: what does `dp[i]` mean, in words? ("number of ways to reach step i")\n- **Transition**: how is `dp[i]` computed from smaller states? (`dp[i] = dp[i−1] + dp[i−2]`)\n- **Base cases**: the smallest states answered directly (`dp[0] = 1`).\n- **Answer**: which state holds the final result (`dp[n]`).\n- **Order**: compute states so dependencies are ready.',
      },
      {
        heading: 'Memoisation (top-down)',
        body: 'Keep the natural recursion and add a cache: if the state was solved, return the stored value. Only reachable states are computed. Use a sentinel like −1 for "unknown" when 0 is a valid answer.',
      },
      {
        heading: 'Tabulation (bottom-up)',
        body: 'Fill an array from base cases upward with loops. No recursion depth limits, usually faster, and it often reveals that only the last few states are needed — e.g. Fibonacci needs just two variables (O(1) space).',
      },
      {
        heading: 'Complexity',
        body: 'Time = number of states × transitions per state. Fibonacci: n states × O(1) = O(n), versus O(φⁿ) ≈ O(1.618ⁿ) for naive recursion.',
      },
    ],
    recognition: [
      '"Number of ways", "minimum cost", "maximum value", "is it possible" over choices → DP candidate.',
      'A brute-force recursion whose arguments repeat → memoise it.',
      'Decisions made left to right where the future depends only on a small summary → define that summary as the state.',
    ],
    patterns: ['memoization', 'tabulation', 'dp-1d', 'brute-to-optimal'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd26-A',
      kind: 'brute-vs-optimized',
      title: 'Naive recursion vs memoisation (counting calls)',
      goal: 'Compute Fibonacci(30) both ways and count how many function calls each needs.',
      input: 'n = 30',
      output: 'naive: fib(30) = 832040 using 2692537 calls\nmemo:  fib(30) = 832040 using 59 calls',
      idea: 'The naive tree recomputes fib(28), fib(27), … again and again. A memo table stores each fib(k) the first time, so every later request is O(1).',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long naiveCalls = 0, memoCalls = 0;

long long fibNaive(int n) {
    naiveCalls++;
    if (n <= 1) return n;
    return fibNaive(n - 1) + fibNaive(n - 2);
}

long long fibMemo(int n, vector<long long>& memo) {
    memoCalls++;
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];                              //@gap
    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);   //@gap
}

int main() {
    int n = 30;
    long long a = fibNaive(n);
    vector<long long> memo(n + 1, -1);
    long long b = fibMemo(n, memo);
    cout << "naive: fib(" << n << ") = " << a << " using " << naiveCalls << " calls\n";
    cout << "memo:  fib(" << n << ") = " << b << " using " << memoCalls << " calls\n";
    return 0;
}`,
      keyLines: [
        { match: 'return fibNaive(n - 1) + fibNaive(n - 2);', note: 'Two recursive calls per level: the call tree grows like φⁿ.' },
        { match: 'vector<long long> memo(n + 1, -1);', note: '−1 means "not computed" (no Fibonacci value is negative).' },
        { match: 'if (memo[n] != -1) return memo[n];', note: 'Reuse a stored answer instead of recomputing the subtree.' },
        { match: 'return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);', note: 'Compute once, store, return.' },
      ],
      dryRun: {
        columns: ['n', 'naive calls', 'memo calls'],
        rows: [
          ['10', '177', '19'],
          ['20', '21 891', '39'],
          ['30', '2 692 537', '59'],
        ],
      },
      complexity: { time: 'Naive O(φⁿ); memo O(n)', space: 'O(n) either way (recursion depth); memo adds an O(n) table', why: 'Memo computes each of the n + 1 states once; each cached state answers later calls in O(1).' },
      edgeCases: ['n = 0 and n = 1 are base cases', 'fib(93) is the largest that fits in signed 64-bit'],
      mistakes: ['Using 0 as "uncomputed" when 0 is a real value', 'Passing the memo by value (copies, no reuse)'],
      tryIt: 'Write the bottom-up version with two variables and check it matches.',
      bug: {
        find: 'long long fibMemo(int n, vector<long long>& memo) {',
        replace: 'long long fibMemo(int n, vector<long long> memo) {',
        symptom: 'The program prints "memo:  fib(30) = 832040 using 2692537 calls" — memoisation stopped working.',
        explanation: 'Passing the vector by value gives every call its own copy, so results stored by one call are invisible to others. Pass the cache by reference.',
      },
    },
    exampleB: {
      id: 'd26-B',
      title: 'Tabulation: climbing stairs',
      goal: 'Count the ways to climb n steps taking 1 or 2 steps at a time.',
      input: 'n = 6',
      output: 'ways(6) = 13',
      idea: 'The last move onto step i was either from i − 1 or from i − 2, so dp[i] = dp[i − 1] + dp[i − 2]. Fill the table from the base cases upward.',
      code: TRACE_CODE['climb-stairs'],
      keyLines: [
        { match: 'dp[0] = 1;', note: 'One way to stand at the bottom: do nothing.' },
        { match: 'if (n >= 1) dp[1] = 1;', note: 'Guard so n = 0 does not write dp[1] out of bounds.' },
        { match: 'dp[i] = dp[i - 1] + dp[i - 2];', note: 'Transition: last step was 1 or 2.' },
      ],
      complexity: { time: 'O(n)', space: 'O(n), reducible to O(1)', why: 'One loop; only the previous two values are needed.' },
      edgeCases: ['n = 0 → 1', 'Large n overflows long long beyond n ≈ 90 — use modular arithmetic'],
      mistakes: ['Starting the loop at 1 and reading dp[−1]', 'Forgetting the n ≥ 1 guard'],
      tryIt: 'Allow steps of 1, 2 or 3 and update the transition.',
      trace: { id: 'climb-stairs', input: { n: 6 } },
    },
    complexityNotes: 'DP cost = states × transitions. Naive recursion repeats states exponentially; memoisation and tabulation compute each state once.',
    quiz: [
      {
        prompt: 'Which two properties make a problem suitable for DP?',
        options: ['Sorted input and uniqueness', 'Overlapping subproblems and optimal substructure', 'Small input and recursion', 'Graphs and weights'],
        answer: 1,
        explanation: 'Reuse is only useful if subproblems repeat, and correctness needs optimal substructure.',
      },
      {
        prompt: 'A DP has n·m states and each state looks at 3 others. Time complexity?',
        options: ['O(n + m)', 'O(n·m)', 'O(3ⁿ)', 'O(n²m²)'],
        answer: 1,
        explanation: 'Constant transitions per state: O(n·m).',
      },
      {
        prompt: 'Why use −1 instead of 0 to mark "not computed" in many memo tables?',
        options: ['−1 is faster', '0 can be a legitimate answer, so it cannot double as "unknown"', 'Vectors start at −1', 'It saves memory'],
        answer: 1,
        explanation: 'The sentinel must be impossible as a real result.',
      },
    ],
    optimize: {
      prompt: 'Naive fib(n) makes about 1.6ⁿ calls. What exactly does the memo table eliminate?',
      options: ['The base cases', 'Recomputing fib(k) for the same k in different branches of the call tree', 'The addition', 'Recursion itself'],
      answer: 1,
      explanation: 'Each distinct argument is solved once; repeated subtrees become O(1) lookups.',
    },
    recap: 'DP stores answers to overlapping subproblems. Define the state in words, write the transition and base cases, then implement top-down (memo) or bottom-up (table).',
    nextPrep: 'Tomorrow: one-dimensional DP — house robber, maximum subarray and friends.',
  },
  questions: [
    {
      id: 'd26-fibonacci',
      day: 26,
      title: 'Fibonacci Modulo',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['tabulation', 'dp-1d'],
      objective: 'Tabulate with O(1) space and a modulus.',
      statement: 'Print F(n) mod 1 000 000 007 where F(0) = 0, F(1) = 1.',
      constraints: ['0 ≤ n ≤ 10⁷'],
      examples: [{ input: 'n = 10', output: '55' }],
      edgeCases: ['n = 0', 'n = 1', 'Large n needs the modulus'],
      cues: ['Each value depends on the previous two → rolling variables'],
      hints: ['Keep a = F(i − 1), b = F(i).', 'Update both each step modulo M.'],
      approach: 'Iterate with two variables.',
      correctness: 'Invariant: after i steps, (a, b) = (F(i−1), F(i)) mod M.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Constant work per step.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long fibMod(long long n) {
    const long long MOD = 1000000007;
    if (n == 0) return 0;
    long long a = 0, b = 1;
    for (long long i = 2; i <= n; i++) {
        long long c = (a + b) % MOD;
        a = b;
        b = c;
    }
    return b;
}`,
      main: cpp`
int main() {
    long long n;
    cin >> n;
    cout << fibMod(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: F(n) mod 1e9+7.',
      keyLines: [{ match: 'long long c = (a + b) % MOD;', note: 'Take the modulus every step to keep numbers small.' }],
      mistakes: ['Naive recursion (exponential)'],
      tests: [
        { in: '10', out: '55' },
        { in: '0', out: '0' },
        { in: '1', out: '1' },
        { in: '100', out: '687995182' },
      ],
      viz: 'dp',
    },
    {
      id: 'd26-tribonacci',
      day: 26,
      title: 'Three-Term Sequence',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['tabulation', 'dp-1d'],
      objective: 'Extend the window to three previous states.',
      statement: 'T(0) = 0, T(1) = 1, T(2) = 1, T(n) = T(n−1) + T(n−2) + T(n−3). Print T(n).',
      constraints: ['0 ≤ n ≤ 37 (fits in 32-bit)'],
      examples: [{ input: 'n = 4', output: '4' }],
      edgeCases: ['n ≤ 2 base cases'],
      cues: ['Recurrence over a fixed window → rolling variables'],
      hints: ['Keep the last three values.'],
      approach: 'Bottom-up with three variables.',
      correctness: 'Follows the recurrence exactly.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Constant per step.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long tribonacci(int n) {
    long long t[3] = {0, 1, 1};
    if (n < 3) return t[n];
    for (int i = 3; i <= n; i++) {
        long long next = t[0] + t[1] + t[2];
        t[0] = t[1];
        t[1] = t[2];
        t[2] = next;
    }
    return t[2];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    cout << tribonacci(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: T(n).',
      keyLines: [{ match: 'long long next = t[0] + t[1] + t[2];', note: 'Sum of the three previous terms.' }],
      mistakes: ['Wrong base cases'],
      tests: [
        { in: '4', out: '4' },
        { in: '0', out: '0' },
        { in: '2', out: '1' },
        { in: '25', out: '1389537' },
      ],
    },
    {
      id: 'd26-tiling',
      day: 26,
      title: 'Tiling a Hallway',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'tabulation'],
      objective: 'Derive a recurrence from the last placement.',
      statement: 'Count the ways to tile a 2×n hallway with 1×2 dominoes (rotations allowed), modulo 1 000 000 007.',
      constraints: ['1 ≤ n ≤ 10⁶'],
      examples: [{ input: 'n = 3', output: '3' }],
      edgeCases: ['n = 1 → 1'],
      cues: ['Last column is either one vertical domino or two horizontal ones covering two columns'],
      hints: ['ways(n) = ways(n − 1) + ways(n − 2).', 'Base: ways(0) = 1, ways(1) = 1.'],
      approach: 'Fibonacci-style tabulation with modulus.',
      correctness: 'The rightmost tiles are either a vertical domino (leaving 2×(n−1)) or a pair of horizontals (leaving 2×(n−2)).',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Rolling variables.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long tilings(int n) {
    const long long MOD = 1000000007;
    long long prev = 1, cur = 1;  // ways(0), ways(1)
    for (int i = 2; i <= n; i++) {
        long long next = (prev + cur) % MOD;
        prev = cur;
        cur = next;
    }
    return cur;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    cout << tilings(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: number of tilings mod 1e9+7.',
      keyLines: [{ match: 'long long prev = 1, cur = 1;  // ways(0), ways(1)', note: 'An empty hallway has one (empty) tiling.' }],
      mistakes: ['Setting ways(0) = 0'],
      tests: [
        { in: '3', out: '3' },
        { in: '1', out: '1' },
        { in: '5', out: '8' },
        { in: '50', out: '365010934' },
      ],
    },
    {
      id: 'd26-min-cost-climbing',
      day: 26,
      title: 'Cheapest Way Up the Stairs',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'tabulation'],
      objective: 'Minimisation DP over a line.',
      statement: 'cost[i] is paid when stepping on stair i. You may start at stair 0 or 1 and climb 1 or 2 stairs at a time. Print the minimum cost to reach the top (one past the last stair).',
      constraints: ['2 ≤ n ≤ 1000', '0 ≤ cost ≤ 999'],
      examples: [{ input: 'cost = [10, 15, 20]', output: '15' }],
      edgeCases: ['Two stairs', 'All zeros'],
      cues: ['Minimum over the last move → dp[i] = min(dp[i−1] + cost[i−1], dp[i−2] + cost[i−2])'],
      hints: ['dp[i] = minimum cost to stand on position i (top is position n).', 'dp[0] = dp[1] = 0.'],
      approach: 'Tabulate dp[0..n].',
      correctness: 'Every route to i arrives from i − 1 or i − 2, paying that stair.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minCostClimb(const vector<int>& cost) {
    int n = cost.size();
    vector<int> dp(n + 1, 0);
    for (int i = 2; i <= n; i++) dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);
    return dp[n];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> c(n);
    for (auto& x : c) cin >> x;
    cout << minCostClimb(c) << "\n";
    return 0;
}`,
      io: 'Input: n, then n costs. Output: minimum total cost.',
      keyLines: [{ match: 'dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);', note: 'Pay for the stair you step from.' }],
      mistakes: ['Treating the top as stair n − 1'],
      tests: [
        { in: '3\n10 15 20', out: '15' },
        { in: '10\n1 100 1 1 1 100 1 1 100 1', out: '6' },
        { in: '2\n0 0', out: '0' },
        { in: '4\n5 1 5 1', out: '2' },
      ],
    },
    {
      id: 'd26-decode-ways',
      day: 26,
      title: 'Ways to Decode a Message',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'memoization'],
      objective: 'DP with validity conditions on transitions.',
      statement: 'Letters A–Z are encoded as 1–26. Count the ways to decode a digit string (answer fits in 32-bit).',
      constraints: ['1 ≤ |s| ≤ 100'],
      examples: [{ input: '226', output: '3', explanation: 'BZ, VF, BBF' }],
      edgeCases: ['Leading zero → 0', '"10", "20" (only two-digit decoding)', '"30" → 0'],
      cues: ['Decode the next 1 or 2 characters → dp over prefix length'],
      hints: ['dp[i] = ways to decode the first i characters.', 'Single digit s[i−1] ≠ \'0\' adds dp[i−1].', 'Two digits 10–26 add dp[i−2].'],
      approach: 'Tabulation over prefix lengths.',
      correctness: 'The last token of any decoding is one or two characters long; transitions count both exactly when valid.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Two checks per position.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

long long numDecodings(const string& s) {
    int n = s.size();
    vector<long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        if (s[i - 1] != '0') dp[i] += dp[i - 1];
        if (i >= 2) {
            int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
    }
    return dp[n];
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << numDecodings(s) << "\n";
    return 0;
}`,
      io: 'Input: digit string. Output: number of decodings.',
      keyLines: [{ match: 'if (two >= 10 && two <= 26) dp[i] += dp[i - 2];', note: '"05" is not a valid two-digit code.' }],
      mistakes: ['Accepting "0x" as a two-digit code'],
      tests: [
        { in: '226', out: '3' },
        { in: '06', out: '0' },
        { in: '10', out: '1' },
        { in: '11106', out: '2' },
      ],
    },
    {
      id: 'd26-perfect-squares',
      day: 26,
      title: 'Fewest Square Tiles',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'knapsack'],
      objective: 'Unbounded minimisation DP.',
      statement: 'Print the least number of perfect squares that sum to n.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: 'n = 12', output: '3', explanation: '4 + 4 + 4' }],
      edgeCases: ['n itself a square → 1'],
      cues: ['Minimum count of reusable parts summing to n → dp[x] = 1 + min dp[x − s]'],
      hints: ['dp[0] = 0.', 'For each x try every square s ≤ x.'],
      approach: 'Tabulation over x with inner loop over squares.',
      correctness: 'Any optimal decomposition of x ends with some square s, leaving an optimal decomposition of x − s.',
      complexity: { time: 'O(n √n)', space: 'O(n)', why: '√x squares per state.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int numSquares(int n) {
    vector<int> dp(n + 1, n);
    dp[0] = 0;
    for (int x = 1; x <= n; x++)
        for (int s = 1; s * s <= x; s++) dp[x] = min(dp[x], dp[x - s * s] + 1);
    return dp[n];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    cout << numSquares(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: minimum number of squares.',
      keyLines: [{ match: 'for (int s = 1; s * s <= x; s++) dp[x] = min(dp[x], dp[x - s * s] + 1);', note: 'Try each square as the last part.' }],
      mistakes: ['Greedy largest square first (12 → 9+1+1+1 = 4 parts)'],
      tests: [
        { in: '12', out: '3' },
        { in: '13', out: '2' },
        { in: '1', out: '1' },
        { in: '7', out: '4' },
      ],
    },
    {
      id: 'd26-dice-target',
      day: 26,
      title: 'Dice Rolls Hitting a Total',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-2d', 'tabulation'],
      objective: 'Two-parameter counting DP.',
      statement: 'Roll d dice with f faces each. Count the ordered outcomes whose sum is target, modulo 1 000 000 007.',
      constraints: ['1 ≤ d, f ≤ 30', '1 ≤ target ≤ 1000'],
      examples: [{ input: 'd=2, f=6, target=7', output: '6' }],
      edgeCases: ['target < d or target > d·f → 0'],
      cues: ['Count sequences with a sum constraint → dp[dice][sum]'],
      hints: ['dp[i][s] = ways to make s with i dice.', 'dp[i][s] = Σ_{k=1..f} dp[i−1][s−k].'],
      approach: 'Rolling 1D array over dice.',
      correctness: 'The last die shows k, leaving s − k for the remaining dice.',
      complexity: { time: 'O(d · target · f)', space: 'O(target)', why: 'Three nested loops with rolling rows.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long diceWays(int d, int f, int target) {
    const long long MOD = 1000000007;
    vector<long long> dp(target + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= d; i++) {
        vector<long long> next(target + 1, 0);
        for (int s = 1; s <= target; s++)
            for (int k = 1; k <= f && k <= s; k++) next[s] = (next[s] + dp[s - k]) % MOD;
        dp = next;
    }
    return dp[target];
}`,
      main: cpp`
int main() {
    int d, f, t;
    cin >> d >> f >> t;
    cout << diceWays(d, f, t) << "\n";
    return 0;
}`,
      io: 'Input: d f target. Output: count mod 1e9+7.',
      keyLines: [{ match: 'vector<long long> next(target + 1, 0);', note: 'next[0] stays 0: with i ≥ 1 dice the sum is at least 1.' }],
      mistakes: ['Updating dp in place (mixes dice counts)'],
      tests: [
        { in: '2 6 7', out: '6' },
        { in: '1 6 3', out: '1' },
        { in: '1 2 3', out: '0' },
        { in: '30 30 500', out: '222616187' },
      ],
    },
    {
      id: 'd26-word-break',
      day: 26,
      title: 'Can the Sentence Be Segmented?',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'hash-lookup', 'memoization'],
      objective: 'Boolean DP over prefixes with dictionary lookups.',
      statement: 'Given a string and a dictionary, print `true` if the string can be split into a sequence of dictionary words (words may repeat).',
      constraints: ['1 ≤ |s| ≤ 300', '1 ≤ dictionary ≤ 1000', 'word length ≤ 20'],
      examples: [{ input: 's = leetcode, dict = [leet, code]', output: 'true' }],
      edgeCases: ['Greedy longest-match fails ("aaaab" type inputs)', 'Repeated words'],
      cues: ['Split into valid pieces → dp[i] = some j < i with dp[j] and s[j..i) in dict'],
      hints: ['dp[0] = true.', 'Only check j ≥ i − maxWordLength.'],
      approach: 'Tabulation with an unordered_set.',
      correctness: 'A valid segmentation of the prefix of length i ends with some dictionary word s[j..i).',
      complexity: { time: 'O(n · L²)', space: 'O(n + dict)', why: 'L = max word length; substring creation costs O(L).' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_set>
#include <vector>
using namespace std;

bool wordBreak(const string& s, const vector<string>& words) {
    unordered_set<string> dict(words.begin(), words.end());
    size_t maxLen = 0;
    for (auto& w : words) maxLen = max(maxLen, w.size());
    int n = s.size();
    vector<bool> dp(n + 1, false);
    dp[0] = true;
    for (int i = 1; i <= n; i++)
        for (int j = max(0, i - (int)maxLen); j < i && !dp[i]; j++)
            if (dp[j] && dict.count(s.substr(j, i - j))) dp[i] = true;
    return dp[n];
}`,
      main: cpp`
int main() {
    string s;
    int m;
    cin >> s >> m;
    vector<string> w(m);
    for (auto& x : w) cin >> x;
    cout << (wordBreak(s, w) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: s m, then m words. Output: true or false.',
      keyLines: [{ match: 'if (dp[j] && dict.count(s.substr(j, i - j))) dp[i] = true;', note: 'A valid prefix followed by one dictionary word.' }],
      mistakes: ['Greedy matching of the longest word'],
      tests: [
        { in: 'leetcode 2\nleet code', out: 'true' },
        { in: 'applepenapple 2\napple pen', out: 'true' },
        { in: 'catsandog 5\ncats dog sand and cat', out: 'false' },
        { in: 'aaaaaaab 2\na aa', out: 'false' },
      ],
    },
  ],
};

export default day;
