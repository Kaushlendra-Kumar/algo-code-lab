import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 27,
    title: 'One-Dimensional DP: Take or Skip, Best Ending Here',
    zone: 'dynamic-programming',
    objectives: [
      'Model take/skip decisions along a sequence',
      'Distinguish "best ending at i" from "best within the first i"',
      'Reduce 1D DP to O(1) space with rolling variables',
      'Handle circular sequences by splitting into linear cases',
    ],
    prerequisites: ['Day 26: DP recipe'],
    lesson: [
      {
        heading: 'Take or skip',
        body: 'House robber: `dp[i]` = best loot using houses 0..i. Either skip house i (`dp[i−1]`) or rob it (`a[i] + dp[i−2]`), because robbing forbids the neighbour. `dp[i] = max(dp[i−1], a[i] + dp[i−2])`.',
      },
      {
        heading: '"Ending at i" states',
        body: 'Maximum subarray (Kadane): `best[i]` = largest sum of a subarray **ending exactly at i** = `max(a[i], best[i−1] + a[i])`. The global answer is the maximum over all i. "Ending at i" states are common whenever the answer must be contiguous.',
      },
      {
        heading: 'Extra information in the state',
        body: 'Products can flip sign, so maximum product subarray tracks both the largest and the smallest product ending at i. Jump problems may track the farthest reachable index. If the next decision needs more than one number, keep more numbers.',
      },
      {
        heading: 'Rolling variables',
        body: 'When `dp[i]` only needs `dp[i−1]` and `dp[i−2]`, keep two variables instead of an array — O(1) space.',
      },
      {
        heading: 'Circular inputs',
        body: 'If the first and last items are adjacent (houses in a circle), solve twice: once excluding the first item and once excluding the last, and take the better result.',
      },
    ],
    recognition: [
      'Sequence + "cannot pick adjacent" → take/skip DP.',
      '"Maximum/minimum contiguous subarray …" → best-ending-at-i state.',
      'Answer at i depends on a few previous answers only → rolling variables.',
    ],
    patterns: ['dp-1d', 'running-aggregate', 'tabulation'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd27-A',
      title: 'House robber: take or skip',
      goal: 'Maximise loot from houses in a row without robbing two adjacent houses.',
      input: 'houses = {2, 7, 9, 3, 1}',
      output: 'max loot = 12',
      idea: 'At house i, compare skipping it (keep dp[i−1]) with robbing it (a[i] plus the best up to i − 2).',
      code: TRACE_CODE['house-robber'],
      keyLines: [
        { match: 'dp[0] = a[0];', note: 'With one house, rob it.' },
        { match: 'long long take = a[i] + (i >= 2 ? dp[i - 2] : 0);', note: 'Robbing i forbids i − 1, so add the best up to i − 2.' },
        { match: 'dp[i] = max(skip, take);', note: 'Best of the two decisions.' },
        { match: 'if (n == 0) return 0;', note: 'Guard before touching a[0].' },
      ],
      complexity: { time: 'O(n)', space: 'O(n), reducible to O(1)', why: 'One pass; only dp[i−1] and dp[i−2] are used.' },
      edgeCases: ['Empty street → 0', 'Single house', 'Two houses → the larger'],
      mistakes: ['Greedy "rob every other house" (fails on 2, 1, 1, 2)', 'Forgetting the n == 0 guard'],
      tryIt: 'Rewrite with two variables prev2 and prev1.',
      trace: { id: 'house-robber', input: { a: [2, 7, 9, 3, 1] } },
      bug: {
        find: 'long long take = a[i] + (i >= 2 ? dp[i - 2] : 0);',
        replace: 'long long take = a[i] + dp[i - 1];',
        symptom: 'The program prints "max loot = 22" — it robbed every house, including neighbours.',
        explanation: 'Robbing house i is only allowed if house i − 1 was not robbed, so the take option must build on dp[i − 2], not dp[i − 1].',
      },
    },
    exampleB: {
      id: 'd27-B',
      kind: 'variant',
      title: "Kadane's maximum subarray",
      goal: 'Find the largest sum of a non-empty contiguous subarray.',
      input: 'a = {-2, 1, -3, 4, -1, 2, 1, -5, 4}',
      output: 'max subarray sum = 6',
      idea: 'Let cur be the best sum of a subarray ending at i. Either extend the previous one or start fresh at a[i] — whichever is larger. Track the best cur ever seen.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long maxSubarray(const vector<int>& a) {
    long long cur = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        cur = max((long long)a[i], cur + a[i]);  //@gap
        best = max(best, cur);                   //@gap
    }
    return best;
}

int main() {
    vector<int> a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    cout << "max subarray sum = " << maxSubarray(a) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'long long cur = a[0], best = a[0];', note: 'Start from a real element so all-negative arrays work.' },
        { match: 'cur = max((long long)a[i], cur + a[i]);', note: 'Extend or restart — a negative prefix only hurts.' },
        { match: 'best = max(best, cur);', note: 'The answer may end anywhere.' },
      ],
      dryRun: {
        columns: ['i', 'a[i]', 'cur (best ending here)', 'best'],
        rows: [
          ['0', '−2', '−2', '−2'],
          ['1', '1', '1', '1'],
          ['2', '−3', '−2', '1'],
          ['3', '4', '4', '4'],
          ['4', '−1', '3', '4'],
          ['5', '2', '5', '5'],
          ['6', '1', '6', '6'],
          ['7', '−5', '1', '6'],
          ['8', '4', '5', '6'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass with two variables.' },
      edgeCases: ['All negative → the largest element', 'Single element'],
      mistakes: ['Initialising best = 0 (wrong for all-negative input)'],
      tryIt: 'Also print the start and end indices of the best subarray.',
    },
    complexityNotes: 'All of today\'s DPs are O(n) time. Because each state needs only a constant number of previous states, space drops to O(1).',
    quiz: [
      {
        prompt: 'Why is "rob every other house" wrong for houses {2, 1, 1, 2}?',
        options: ['It is right', 'The best is 2 + 2 = 4 from the first and last houses, which are not every-other', 'It ignores the first house', 'It overflows'],
        answer: 1,
        explanation: 'Gaps of more than one house can be optimal; DP considers all valid patterns.',
      },
      {
        prompt: 'In Kadane\'s algorithm, what does cur represent?',
        options: ['The best sum overall', 'The best sum of a subarray ending exactly at i', 'The prefix sum', 'The minimum so far'],
        answer: 1,
        explanation: 'best tracks the overall answer.',
      },
      {
        prompt: 'For maximum product subarray, why track the minimum product too?',
        options: ['To handle zeros', 'A negative number turns the smallest product into the largest', 'For speed', 'It is not needed'],
        answer: 1,
        explanation: 'Sign flips swap the roles of min and max.',
      },
    ],
    recap: '1D DP tracks a small amount of information per index: take/skip choices or best-ending-here values. Rolling variables make it O(1) space.',
    nextPrep: 'Tomorrow: grid DP — the same ideas in two dimensions.',
  },
  questions: [
    {
      id: 'd27-max-subarray',
      day: 27,
      title: 'Best Streak of Daily Gains',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'running-aggregate'],
      objective: 'Implement Kadane\'s algorithm.',
      statement: 'Print the maximum sum of a non-empty contiguous subarray.',
      constraints: ['1 ≤ n ≤ 10⁵', '−10⁴ ≤ a[i] ≤ 10⁴'],
      examples: [{ input: 'a = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6' }],
      edgeCases: ['All negative', 'Single element'],
      cues: ['Contiguous + maximum sum → best ending at i'],
      hints: ['cur = max(a[i], cur + a[i]).', 'best = max(best, cur).'],
      approach: 'Kadane.',
      correctness: 'Any optimal subarray ending at i either extends the best ending at i − 1 or starts at i.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long kadane(const vector<int>& a) {
    long long cur = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        cur = max((long long)a[i], cur + a[i]);
        best = max(best, cur);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << kadane(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: maximum subarray sum.',
      keyLines: [{ match: 'cur = max((long long)a[i], cur + a[i]);', note: 'Restart when the running sum is negative.' }],
      mistakes: ['best = 0 initially'],
      tests: [
        { in: '9\n-2 1 -3 4 -1 2 1 -5 4', out: '6' },
        { in: '1\n1', out: '1' },
        { in: '5\n5 4 -1 7 8', out: '23' },
        { in: '3\n-3 -1 -2', out: '-1' },
      ],
      viz: 'dp',
    },
    {
      id: 'd27-house-robber-ii',
      day: 27,
      title: 'Robbing a Circular Street',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d'],
      objective: 'Reduce a circular constraint to two linear runs.',
      statement: 'Houses form a circle (first and last are neighbours). Print the maximum loot without robbing adjacent houses.',
      constraints: ['1 ≤ n ≤ 100', '0 ≤ a[i] ≤ 1000'],
      examples: [{ input: 'a = [2, 3, 2]', output: '3' }],
      edgeCases: ['n = 1', 'n = 2'],
      cues: ['Circle → exclude either the first or the last house'],
      hints: ['First and last cannot both be robbed.', 'Answer = max(rob(a[0..n−2]), rob(a[1..n−1])).'],
      approach: 'Linear robber on two ranges.',
      correctness: 'Every valid circular plan omits the first or the last house (or both).',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two linear passes.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long robRange(const vector<int>& a, int lo, int hi) {
    long long prev2 = 0, prev1 = 0;
    for (int i = lo; i <= hi; i++) {
        long long cur = max(prev1, prev2 + a[i]);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}

long long robCircle(const vector<int>& a) {
    int n = a.size();
    if (n == 1) return a[0];
    return max(robRange(a, 0, n - 2), robRange(a, 1, n - 1));
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << robCircle(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: maximum loot.',
      keyLines: [{ match: 'return max(robRange(a, 0, n - 2), robRange(a, 1, n - 1));', note: 'Break the circle in the two possible ways.' }],
      mistakes: ['Forgetting n = 1'],
      tests: [
        { in: '3\n2 3 2', out: '3' },
        { in: '4\n1 2 3 1', out: '4' },
        { in: '1\n7', out: '7' },
        { in: '5\n2 7 9 3 1', out: '11' },
      ],
    },
    {
      id: 'd27-max-product',
      day: 27,
      title: 'Maximum Product Streak',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'state-space-dp'],
      objective: 'Track both extremes because of sign flips.',
      statement: 'Print the maximum product of a non-empty contiguous subarray (fits in 64-bit).',
      constraints: ['1 ≤ n ≤ 2·10⁴', '−10 ≤ a[i] ≤ 10'],
      examples: [{ input: 'a = [2, 3, -2, 4]', output: '6' }],
      edgeCases: ['Zeros reset products', 'Even number of negatives', 'Single negative element'],
      cues: ['Products + negatives → keep max and min ending here'],
      hints: ['When a[i] < 0 swap the roles of max and min.', 'hi = max(a[i], hi · a[i]), lo = min(a[i], lo · a[i]).'],
      approach: 'Two running extremes.',
      correctness: 'The extreme products ending at i come from extending an extreme ending at i − 1 or starting at i.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Constant per element.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long maxProduct(const vector<int>& a) {
    long long hi = a[0], lo = a[0], best = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        long long x = a[i];
        if (x < 0) swap(hi, lo);
        hi = max(x, hi * x);
        lo = min(x, lo * x);
        best = max(best, hi);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << maxProduct(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: maximum product.',
      keyLines: [{ match: 'if (x < 0) swap(hi, lo);', note: 'Multiplying by a negative turns the minimum into the maximum.' }],
      mistakes: ['Tracking only the maximum'],
      tests: [
        { in: '4\n2 3 -2 4', out: '6' },
        { in: '3\n-2 0 -1', out: '0' },
        { in: '3\n-2 3 -4', out: '24' },
        { in: '1\n-5', out: '-5' },
      ],
    },
    {
      id: 'd27-jump-game',
      day: 27,
      title: 'Can the Frog Reach the End?',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['running-aggregate', 'dp-1d', 'activity-selection'],
      objective: 'Track the farthest reachable index.',
      statement: 'a[i] is the maximum jump length from index i. Starting at 0, print `true` if the last index is reachable.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ a[i] ≤ 10⁵'],
      examples: [{ input: 'a = [2, 3, 1, 1, 4]', output: 'true' }],
      edgeCases: ['n = 1 → true', 'Zero blocking the way'],
      cues: ['Reachability along a line → maintain the farthest index reachable so far'],
      hints: ['If i > farthest, i is unreachable.', 'farthest = max(farthest, i + a[i]).'],
      approach: 'One pass with a running maximum.',
      correctness: 'Every index ≤ farthest is reachable because reachable sets along a line are prefixes.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

bool canReach(const vector<int>& a) {
    long long farthest = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (i > farthest) return false;
        farthest = max(farthest, (long long)i + a[i]);
    }
    return true;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << (canReach(a) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n, then n jump lengths. Output: true or false.',
      keyLines: [{ match: 'if (i > farthest) return false;', note: 'A gap that cannot be crossed.' }],
      mistakes: ['Exploring all jumps recursively (exponential)'],
      tests: [
        { in: '5\n2 3 1 1 4', out: 'true' },
        { in: '5\n3 2 1 0 4', out: 'false' },
        { in: '1\n0', out: 'true' },
        { in: '3\n0 1 1', out: 'false' },
      ],
    },
    {
      id: 'd27-min-jumps',
      day: 27,
      title: 'Fewest Jumps to the End',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['queue-level-traversal', 'running-aggregate'],
      objective: 'Implicit BFS by levels over a range.',
      statement: 'a[i] is the maximum jump length from i. The end is always reachable. Print the minimum number of jumps to reach the last index.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: 'a = [2, 3, 1, 1, 4]', output: '2' }],
      edgeCases: ['n = 1 → 0'],
      cues: ['Minimum steps with ranges of reach → level-by-level expansion'],
      hints: ['All indices reachable in k jumps form a contiguous range.', 'Scan the current range to compute the next range\'s end.'],
      approach: 'Greedy BFS with curEnd and farthest.',
      correctness: 'Each level is the set of indices reachable with exactly that many jumps; levels are contiguous.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minJumps(const vector<int>& a) {
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i + 1 < (int)a.size(); i++) {
        farthest = max(farthest, i + a[i]);
        if (i == curEnd) {
            jumps++;
            curEnd = farthest;
        }
    }
    return jumps;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << minJumps(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n jump lengths. Output: minimum jumps.',
      keyLines: [{ match: 'if (i == curEnd) {', note: 'Finished scanning the current level → take one more jump.' }],
      mistakes: ['Looping to the last index (adds an extra jump)'],
      tests: [
        { in: '5\n2 3 1 1 4', out: '2' },
        { in: '1\n0', out: '0' },
        { in: '5\n2 3 0 1 4', out: '2' },
        { in: '4\n1 1 1 1', out: '3' },
      ],
    },
    {
      id: 'd27-delete-earn',
      day: 27,
      title: 'Delete and Earn',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'frequency-counting'],
      objective: 'Reduce to house robber over values.',
      statement: 'Taking a value x earns x but deletes every x − 1 and x + 1. You may take all copies of x. Print the maximum total.',
      constraints: ['1 ≤ n ≤ 2·10⁴', '1 ≤ value ≤ 10⁴'],
      examples: [{ input: 'a = [2, 2, 3, 3, 3, 4]', output: '9' }],
      edgeCases: ['Single value', 'Values far apart'],
      cues: ['Choosing value v forbids v ± 1 → house robber over v = 1..max'],
      hints: ['points[v] = v · count(v).', 'Run house robber on points[].'],
      approach: 'Bucket + rolling robber DP.',
      correctness: 'Adjacent values are exactly the conflicts, like adjacent houses.',
      complexity: { time: 'O(n + V)', space: 'O(V)', why: 'V = max value.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long deleteAndEarn(const vector<int>& a) {
    int V = *max_element(a.begin(), a.end());
    vector<long long> points(V + 1, 0);
    for (int x : a) points[x] += x;
    long long prev2 = 0, prev1 = 0;
    for (int v = 1; v <= V; v++) {
        long long cur = max(prev1, prev2 + points[v]);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << deleteAndEarn(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: maximum points.',
      keyLines: [{ match: 'for (int x : a) points[x] += x;', note: 'Taking v means taking all its copies.' }],
      mistakes: ['Processing elements individually instead of by value'],
      tests: [
        { in: '6\n2 2 3 3 3 4', out: '9' },
        { in: '3\n3 4 2', out: '6' },
        { in: '1\n5', out: '5' },
        { in: '4\n1 1 1 2', out: '3' },
      ],
    },
    {
      id: 'd27-min-cost-tickets',
      day: 27,
      title: 'Cheapest Travel Passes',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'state-space-dp'],
      objective: 'DP over calendar days with pass durations.',
      statement: 'You travel on given days of the year (1..365, increasing). Passes cost c1 (1 day), c7 (7 days), c30 (30 days). Print the minimum total cost.',
      constraints: ['1 ≤ days ≤ 365', '1 ≤ costs ≤ 1000'],
      examples: [{ input: 'days = [1,4,6,7,8,20], costs = 2 7 15', output: '11' }],
      edgeCases: ['A 7-day pass cheaper than one day pass', 'Single travel day'],
      cues: ['Decisions over time with coverage windows → dp over days'],
      hints: ['dp[d] = minimum cost to cover all travel days ≤ d.', 'Non-travel day: dp[d] = dp[d − 1].', 'Travel day: min(dp[d−1] + c1, dp[d−7] + c7, dp[d−30] + c30) with negatives clamped to 0.'],
      approach: 'Tabulation over 1..365.',
      correctness: 'The pass covering the last travel day was bought at day d, d−6 or d−29.',
      complexity: { time: 'O(365)', space: 'O(365)', why: 'Constant work per calendar day.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minTicketCost(const vector<int>& days, int c1, int c7, int c30) {
    int last = days.back();
    vector<bool> travel(last + 1, false);
    for (int d : days) travel[d] = true;
    vector<int> dp(last + 1, 0);
    for (int d = 1; d <= last; d++) {
        if (!travel[d]) {
            dp[d] = dp[d - 1];
            continue;
        }
        dp[d] = min({dp[d - 1] + c1, dp[max(0, d - 7)] + c7, dp[max(0, d - 30)] + c30});
    }
    return dp[last];
}`,
      main: cpp`
int main() {
    int n, c1, c7, c30;
    cin >> n;
    vector<int> d(n);
    for (auto& x : d) cin >> x;
    cin >> c1 >> c7 >> c30;
    cout << minTicketCost(d, c1, c7, c30) << "\n";
    return 0;
}`,
      io: 'Input: n, n travel days, then c1 c7 c30. Output: minimum cost.',
      keyLines: [{ match: 'dp[d] = min({dp[d - 1] + c1, dp[max(0, d - 7)] + c7, dp[max(0, d - 30)] + c30});', note: 'Initializer-list min compares three options.' }],
      mistakes: ['Greedy choice of the cheapest per-day pass'],
      tests: [
        { in: '6\n1 4 6 7 8 20\n2 7 15', out: '11' },
        { in: '12\n1 2 3 4 5 6 7 8 9 10 30 31\n2 7 15', out: '17' },
        { in: '1\n100\n5 3 30', out: '3' },
        { in: '2\n1 365\n1 10 20', out: '2' },
      ],
    },
    {
      id: 'd27-longest-valid-parens',
      day: 27,
      title: 'Longest Balanced Stretch',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['dp-1d', 'expression-parsing'],
      objective: 'Ending-at-i DP that looks back past a matched block.',
      statement: 'Given a string of ( and ), print the length of the longest well-formed (balanced) substring.',
      constraints: ['0 ≤ |s| ≤ 3·10⁴'],
      examples: [{ input: ')()())', output: '4' }],
      edgeCases: ['Empty string → 0', 'Nested and adjacent blocks: "()(())" → 6'],
      cues: ['Longest valid substring ending at i → dp[i]'],
      hints: ['dp[i] = length of the longest valid substring ending at i (0 if s[i] = \'(\').', 'If s[i−1] = \'(\': dp[i] = dp[i−2] + 2.', 'If s[i−1] = \')\' and the char before the block ending at i−1 is \'(\': dp[i] = dp[i−1] + 2 + dp[before that].'],
      approach: 'Ending-at-i DP with two cases.',
      correctness: 'A valid substring ending with ")" either closes an adjacent "(" or wraps a valid block ending at i − 1; concatenation with the block before is added.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Constant work per index.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int longestValid(const string& s) {
    int n = s.size(), best = 0;
    vector<int> dp(n, 0);
    for (int i = 1; i < n; i++) {
        if (s[i] != ')') continue;
        if (s[i - 1] == '(') {
            dp[i] = (i >= 2 ? dp[i - 2] : 0) + 2;
        } else {
            int j = i - dp[i - 1] - 1;  // candidate matching '('
            if (j >= 0 && s[j] == '(') dp[i] = dp[i - 1] + 2 + (j >= 1 ? dp[j - 1] : 0);
        }
        best = max(best, dp[i]);
    }
    return best;
}`,
      main: cpp`
int main() {
    string s;
    if (!(cin >> s)) s = "";
    cout << longestValid(s) << "\n";
    return 0;
}`,
      io: 'Input: a bracket string (possibly empty). Output: length of the longest valid substring.',
      keyLines: [{ match: 'int j = i - dp[i - 1] - 1;  // candidate matching \'(\'', note: 'Skip over the valid block ending at i − 1.' }],
      mistakes: ['Forgetting to add the valid block before j'],
      tests: [
        { in: ')()())', out: '4' },
        { in: '(()', out: '2' },
        { in: '', out: '0' },
        { in: '()(())', out: '6' },
      ],
    },
  ],
};

export default day;
