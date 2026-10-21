import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 29,
    title: 'Knapsack and Subset Sum',
    zone: 'dynamic-programming',
    objectives: [
      'Model "take or skip each item under a budget" as dp[item][capacity]',
      'Compress 0/1 knapsack to one array by iterating capacity downwards',
      'Distinguish 0/1 (each item once) from unbounded (reuse allowed) loops',
      'Recognise subset-sum disguises: partition, target difference, last stone',
    ],
    prerequisites: ['Day 27: 1D DP', 'Day 28: 2D tables'],
    lesson: [
      {
        heading: 'The 0/1 knapsack state',
        body: '`dp[i][w]` = best value using only the first `i` items with capacity `w`. For item `i` you either skip it (`dp[i−1][w]`) or take it if it fits (`dp[i−1][w − wt] + val`). Row `i` depends only on row `i − 1`.',
      },
      {
        heading: 'One array, loop backwards',
        body: 'With a single array `best[w]`, loop `w` from W down to `wt`. Going downwards, `best[w − wt]` still holds the value from the previous item, so each item is used at most once. Looping upwards would let the same item be reused — which is exactly the **unbounded** knapsack.',
      },
      {
        heading: 'Subset sum is knapsack with booleans',
        body: '`can[s]` = "some subset sums to s". Transition: `can[s] |= can[s − x]`, again with `s` descending. Partition into equal halves = subset sum to total/2. Minimum difference between two groups = total − 2 · (largest reachable sum ≤ total/2).',
      },
      {
        heading: 'Counting vs optimising',
        body: 'Replace max with + to count ways. For coin change *combinations* (order does not matter), loop over coins outside and amounts inside; swapping the loops counts ordered sequences instead.',
      },
      {
        heading: 'Pseudo-polynomial time',
        body: 'O(n · W) looks polynomial, but W is a number, not an input length. When W is huge (10⁹) this DP is impossible — look for other structure (meet in the middle, greedy for special cases).',
      },
    ],
    recognition: [
      'Each item is used at most once and there is a budget/capacity → 0/1 knapsack.',
      '"Split into two groups with equal / closest sums" → subset sum on total/2.',
      'Unlimited copies of each item (coins) → unbounded knapsack, capacity loop ascending.',
      'Two budgets (zeros and ones, members and profit) → 2D capacity, still loop downwards.',
    ],
    patterns: ['knapsack', 'dp-2d', 'dp-1d'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd29-A',
      title: '0/1 knapsack table',
      goal: 'Pick items (each at most once) with total weight ≤ 7 to maximise value.',
      input: 'weights {1, 3, 4, 5}, values {1, 4, 5, 7}, W = 7',
      output: 'best value = 9',
      idea: 'Fill dp row by row. Each cell either copies the cell above (skip) or adds the item to the best answer for the remaining capacity in the row above (take).',
      code: TRACE_CODE.knapsack,
      keyLines: [
        { match: 'vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));', note: 'Row 0 (no items) is all zeros.' },
        { match: 'dp[i][w] = dp[i - 1][w];', note: 'Skip option: same as without item i.' },
        { match: 'dp[i][w] = max(dp[i][w], dp[i - 1][w - wt[i - 1]] + val[i - 1]);', note: 'Take option uses the previous row, so the item is counted once.' },
        { match: 'return dp[n][W];', note: 'All items considered, full capacity.' },
      ],
      complexity: { time: 'O(n · W)', space: 'O(n · W), reducible to O(W)', why: 'One cell per (item, capacity) pair, O(1) work each.' },
      edgeCases: ['W = 0 → 0', 'An item heavier than W is always skipped', 'Values 0'],
      mistakes: ['Using dp[i][w − wt] (same row) — that is the unbounded version', 'Off-by-one between item i and wt[i − 1]'],
      tryIt: 'Change the trace input so that greedy by value/weight ratio fails.',
      trace: { id: 'knapsack', input: { wt: [1, 3, 4, 5], val: [1, 4, 5, 7], W: 7 } },
      bug: {
        find: 'if (wt[i - 1] <= w) {',
        replace: 'if (wt[i - 1] < w) {',
        symptom: 'The program prints "best value = 8" instead of 9.',
        explanation: 'An item that fills the remaining capacity exactly (weight 4 into capacity 4 next to weight 3) is never taken. The condition must allow wt == w.',
      },
    },
    exampleB: {
      id: 'd29-B',
      kind: 'variant',
      title: 'Subset sum with one boolean array',
      goal: 'List every total (≤ 12) that some subset of {2, 3, 7} can make, each number used at most once.',
      input: 'nums = {2, 3, 7}, limit = 12',
      output: 'reachable: 0 2 3 5 7 9 10 12',
      idea: 'can[s] says whether total s is reachable. Adding number x makes s reachable if s − x was reachable before x was considered — loop s downwards so "before" is preserved.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {2, 3, 7};
    int limit = 12;
    vector<bool> can(limit + 1, false);
    can[0] = true;  // the empty subset
    for (int x : nums)
        for (int s = limit; s >= x; s--)  //@gap
            if (can[s - x]) can[s] = true;  //@gap
    cout << "reachable:";
    for (int s = 0; s <= limit; s++)
        if (can[s]) cout << " " << s;
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'can[0] = true;', note: 'Sum 0 is always reachable by taking nothing.' },
        { match: 'for (int s = limit; s >= x; s--)', note: 'Descending: can[s − x] still describes subsets without x.' },
        { match: 'if (can[s - x]) can[s] = true;', note: 'Extend a reachable total by x.' },
      ],
      dryRun: {
        columns: ['after number', 'reachable totals'],
        rows: [
          ['—', '0'],
          ['2', '0 2'],
          ['3', '0 2 3 5'],
          ['7', '0 2 3 5 7 9 10 12'],
        ],
      },
      complexity: { time: 'O(n · limit)', space: 'O(limit)', why: 'One pass over the array per number.' },
      edgeCases: ['Number larger than limit (inner loop does not run)', 'Duplicates in nums are separate items'],
      mistakes: ['Ascending loop: a number gets reused'],
      tryIt: 'Use bitset<13> and the one-liner can |= can << x.',
      bug: {
        find: 'for (int s = limit; s >= x; s--)',
        replace: 'for (int s = x; s <= limit; s++)',
        symptom: 'The program prints "reachable: 0 2 3 4 5 6 7 8 9 10 11 12" — totals like 4 = 2 + 2 appear.',
        explanation: 'Ascending order lets can[s − x] already include x, so each number can be used repeatedly (unbounded knapsack).',
      },
    },
    complexityNotes: 'Knapsack-style DP costs O(n · W) time and O(W) memory with the backwards loop. It is pseudo-polynomial: fine for W ≤ ~10⁶, hopeless for W ≈ 10⁹.',
    quiz: [
      {
        prompt: 'In the 1D 0/1 knapsack, why must capacity be iterated from high to low?',
        options: ['It is faster', 'So best[w − wt] still refers to the previous item set', 'To avoid negative indices', 'It does not matter'],
        answer: 1,
        explanation: 'Low-to-high would read values that already include the current item.',
      },
      {
        prompt: 'Coin change "number of combinations": which loop goes outside?',
        options: ['Amounts', 'Coins', 'Either', 'Neither — use recursion'],
        answer: 1,
        explanation: 'Coins outside means each combination is built in a fixed coin order, so it is counted once.',
      },
      {
        prompt: 'Partition {1, 5, 11, 5} into two equal-sum subsets reduces to…',
        options: ['Sorting', 'Subset sum to 11', 'Knapsack with W = 22', 'Two pointers'],
        answer: 1,
        explanation: 'One half must sum to total / 2 = 11.',
      },
    ],
    recap: '0/1 knapsack: dp over items × capacity, skip or take. One array with a descending capacity loop keeps each item single-use; ascending makes it unbounded. Subset sum, partition and target-difference problems are all the same DP with booleans or counts.',
    nextPrep: 'Tomorrow: DP over two sequences — LCS, edit distance and LIS.',
  },
  questions: [
    {
      id: 'd29-can-make',
      day: 29,
      title: 'Exact Change from a Pouch',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Boolean subset sum.',
      statement: 'A pouch holds coins with the given values (each coin used at most once). Print YES if some selection sums exactly to the target, otherwise NO.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ value ≤ 1000', '0 ≤ target ≤ 10⁵'],
      examples: [{ input: 'coins 3 34 4 12 5 2, target 9', output: 'YES', explanation: '4 + 5 = 9' }],
      edgeCases: ['target = 0 → YES (empty selection)', 'All coins larger than target'],
      cues: ['Each item once + exact total → subset sum'],
      hints: ['can[0] = true.', 'For each coin x, for s from target down to x: can[s] |= can[s − x].'],
      brute: 'Try all 2ⁿ subsets — too slow for n = 100.',
      approach: 'Boolean 1D DP with a descending loop.',
      correctness: 'After processing k coins, can[s] is true exactly when a subset of those k coins sums to s.',
      complexity: { time: 'O(n · target)', space: 'O(target)', why: 'One pass per coin.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

bool canMake(const vector<int>& coins, int target) {
    vector<bool> can(target + 1, false);
    can[0] = true;
    for (int x : coins)
        for (int s = target; s >= x; s--)
            if (can[s - x]) can[s] = true;
    return can[target];
}`,
      main: cpp`
int main() {
    int n, target;
    cin >> n >> target;
    vector<int> coins(n);
    for (auto& x : coins) cin >> x;
    cout << (canMake(coins, target) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: n target, then n coin values. Output: YES or NO.',
      keyLines: [{ match: 'for (int s = target; s >= x; s--)', note: 'Descending keeps each coin single-use.' }],
      mistakes: ['Ascending loop (reuses coins)'],
      tests: [
        { in: '6 9\n3 34 4 12 5 2', out: 'YES' },
        { in: '6 30\n3 34 4 12 5 2', out: 'NO' },
        { in: '2 0\n5 7', out: 'YES' },
        { in: '3 4\n2 3 7', out: 'NO' },
      ],
      viz: 'dp',
    },
    {
      id: 'd29-knapsack01',
      day: 29,
      title: 'Packing the Expedition Bag',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Classic 0/1 knapsack in O(W) memory.',
      statement: 'Given n items with weights and values and a bag capacity W, print the maximum total value of items whose total weight does not exceed W. Each item can be taken at most once.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ W ≤ 10⁵', '1 ≤ weight ≤ W', '0 ≤ value ≤ 10⁹'],
      examples: [{ input: 'W=7, items (1,1) (3,4) (4,5) (5,7)', output: '9' }],
      edgeCases: ['No item fits', 'Large values → use long long'],
      cues: ['Budget + take/skip each item once'],
      hints: ['best[w] = max(best[w], best[w − wt] + val), w descending.'],
      approach: '1D knapsack.',
      correctness: 'Standard take/skip recurrence; descending order keeps items single-use.',
      complexity: { time: 'O(n · W)', space: 'O(W)', why: 'One array.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long knapsack(const vector<int>& wt, const vector<long long>& val, int W) {
    vector<long long> best(W + 1, 0);
    for (size_t i = 0; i < wt.size(); i++)
        for (int w = W; w >= wt[i]; w--) best[w] = max(best[w], best[w - wt[i]] + val[i]);
    return best[W];
}`,
      main: cpp`
int main() {
    int n, W;
    cin >> n >> W;
    vector<int> wt(n);
    vector<long long> val(n);
    for (int i = 0; i < n; i++) cin >> wt[i] >> val[i];
    cout << knapsack(wt, val, W) << "\n";
    return 0;
}`,
      io: 'Input: n W, then n lines "weight value". Output: maximum value.',
      keyLines: [{ match: 'for (int w = W; w >= wt[i]; w--) best[w] = max(best[w], best[w - wt[i]] + val[i]);', note: 'Take-or-skip in place.' }],
      mistakes: ['int overflow on values'],
      tests: [
        { in: '4 7\n1 1\n3 4\n4 5\n5 7', out: '9' },
        { in: '3 50\n10 60\n20 100\n30 120', out: '220' },
        { in: '1 1\n2 100', out: '0' },
        { in: '2 10\n5 1000000000\n5 1000000000', out: '2000000000' },
      ],
      viz: 'dp',
    },
    {
      id: 'd29-partition-equal',
      day: 29,
      title: 'Splitting the Treasure Evenly',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Reduce partition to subset sum.',
      statement: 'Can the numbers be split into two groups with equal sums? Print YES or NO.',
      constraints: ['1 ≤ n ≤ 200', '1 ≤ a[i] ≤ 100'],
      examples: [{ input: '1 5 11 5', output: 'YES', explanation: '{1, 5, 5} and {11}' }],
      edgeCases: ['Odd total → NO immediately', 'Single element → NO'],
      cues: ['Two groups, equal sums'],
      hints: ['If the total is odd, answer NO.', 'Otherwise ask whether total/2 is reachable.'],
      approach: 'Subset sum to total/2.',
      correctness: 'One group sums to total/2 iff the other does too.',
      complexity: { time: 'O(n · total)', space: 'O(total)', why: 'Boolean DP over half the total.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

bool canPartition(const vector<int>& a) {
    int total = accumulate(a.begin(), a.end(), 0);
    if (total % 2) return false;
    int half = total / 2;
    vector<bool> can(half + 1, false);
    can[0] = true;
    for (int x : a)
        for (int s = half; s >= x; s--)
            if (can[s - x]) can[s] = true;
    return can[half];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << (canPartition(a) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: n, then n numbers. Output: YES or NO.',
      keyLines: [{ match: 'if (total % 2) return false;', note: 'Odd totals can never split evenly.' }],
      mistakes: ['Forgetting the odd check, then integer-dividing the total'],
      tests: [
        { in: '4\n1 5 11 5', out: 'YES' },
        { in: '4\n1 2 3 5', out: 'NO' },
        { in: '1\n2', out: 'NO' },
        { in: '6\n3 3 3 4 5 2', out: 'YES' },
      ],
    },
    {
      id: 'd29-last-stone',
      day: 29,
      title: 'Smallest Leftover Boulder',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Spot a subset-sum problem in disguise.',
      statement: 'Repeatedly smash two stones x ≤ y: if equal both vanish, otherwise y − x remains. Print the smallest possible weight of the last stone (0 if none remain).',
      constraints: ['1 ≤ n ≤ 30', '1 ≤ w ≤ 100'],
      examples: [{ input: '2 7 4 1 8 1', output: '1' }],
      edgeCases: ['Single stone → its weight', 'All equal pairs → 0'],
      cues: ['Every stone ends up with a + or − sign → split into two groups'],
      hints: ['The final weight is |sum(A) − sum(B)| for some split.', 'Find the largest reachable sum ≤ total/2.'],
      approach: 'Answer = total − 2 · best where best is the largest reachable subset sum ≤ total/2.',
      correctness: 'Any signed split is achievable by some smash order, and the difference is minimised when one side is as close to half as possible.',
      complexity: { time: 'O(n · total)', space: 'O(total)', why: 'Subset-sum DP.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int lastStone(const vector<int>& w) {
    int total = accumulate(w.begin(), w.end(), 0), half = total / 2;
    vector<bool> can(half + 1, false);
    can[0] = true;
    for (int x : w)
        for (int s = half; s >= x; s--)
            if (can[s - x]) can[s] = true;
    for (int s = half; s >= 0; s--)
        if (can[s]) return total - 2 * s;
    return total;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> w(n);
    for (auto& x : w) cin >> x;
    cout << lastStone(w) << "\n";
    return 0;
}`,
      io: 'Input: n, then n weights. Output: minimum final weight.',
      keyLines: [{ match: 'if (can[s]) return total - 2 * s;', note: 'The closer one side is to half, the smaller the difference.' }],
      mistakes: ['Simulating greedily with a heap (that gives the largest-first answer, not the minimum)'],
      tests: [
        { in: '6\n2 7 4 1 8 1', out: '1' },
        { in: '5\n31 26 33 21 40', out: '5' },
        { in: '1\n9', out: '9' },
        { in: '4\n3 3 5 5', out: '0' },
      ],
    },
    {
      id: 'd29-coin-min',
      day: 29,
      title: 'Fewest Tokens for a Fare',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Unbounded knapsack minimising count.',
      statement: 'Tokens come in the given denominations with unlimited supply. Print the minimum number of tokens that sum exactly to the amount, or -1 if impossible.',
      constraints: ['1 ≤ k ≤ 12', '1 ≤ coin ≤ 10⁴', '0 ≤ amount ≤ 10⁴'],
      examples: [{ input: 'coins 1 2 5, amount 11', output: '3', explanation: '5 + 5 + 1' }],
      edgeCases: ['amount 0 → 0', 'Impossible amounts → -1'],
      cues: ['Unlimited copies + minimise count'],
      hints: ['dp[a] = 1 + min over coins of dp[a − c].', 'Initialise with a large sentinel.'],
      approach: 'Ascending 1D DP (reuse allowed).',
      correctness: 'The last token of an optimal solution is some coin c, leaving an optimal solution for a − c.',
      complexity: { time: 'O(k · amount)', space: 'O(amount)', why: 'Each amount tries each coin.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minCoins(const vector<int>& coins, int amount) {
    const int INF = 1e9;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a && dp[a - c] != INF) dp[a] = min(dp[a], dp[a - c] + 1);
    return dp[amount] == INF ? -1 : dp[amount];
}`,
      main: cpp`
int main() {
    int k, amount;
    cin >> k >> amount;
    vector<int> coins(k);
    for (auto& c : coins) cin >> c;
    cout << minCoins(coins, amount) << "\n";
    return 0;
}`,
      io: 'Input: k amount, then k denominations. Output: minimum tokens or -1.',
      keyLines: [{ match: 'if (c <= a && dp[a - c] != INF) dp[a] = min(dp[a], dp[a - c] + 1);', note: 'Skip unreachable states so INF + 1 never wins.' }],
      mistakes: ['Greedy largest-coin-first (fails for {1, 3, 4}, amount 6)'],
      tests: [
        { in: '3 11\n1 2 5', out: '3' },
        { in: '1 3\n2', out: '-1' },
        { in: '1 0\n1', out: '0' },
        { in: '3 6\n1 3 4', out: '2' },
      ],
    },
    {
      id: 'd29-coin-ways',
      day: 29,
      title: 'Ways to Pay the Toll',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-1d'],
      objective: 'Count combinations, not orderings.',
      statement: 'With unlimited coins of each denomination, print how many different combinations (order does not matter) sum to the amount.',
      constraints: ['1 ≤ k ≤ 300', '1 ≤ coin ≤ 5000', '0 ≤ amount ≤ 5000', 'Answer fits in 64-bit'],
      examples: [{ input: 'coins 1 2 5, amount 5', output: '4' }],
      edgeCases: ['amount 0 → 1', 'No combination → 0'],
      cues: ['"how many ways", order irrelevant, unlimited supply'],
      hints: ['Coins in the outer loop, amounts ascending inside.'],
      approach: 'ways[a] += ways[a − c] with coins outside.',
      correctness: 'Processing coins one at a time builds each multiset in a fixed coin order, so it is counted exactly once.',
      complexity: { time: 'O(k · amount)', space: 'O(amount)', why: 'One array.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long countWays(const vector<int>& coins, int amount) {
    vector<long long> ways(amount + 1, 0);
    ways[0] = 1;
    for (int c : coins)
        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];
    return ways[amount];
}`,
      main: cpp`
int main() {
    int k, amount;
    cin >> k >> amount;
    vector<int> coins(k);
    for (auto& c : coins) cin >> c;
    cout << countWays(coins, amount) << "\n";
    return 0;
}`,
      io: 'Input: k amount, then k denominations. Output: number of combinations.',
      keyLines: [{ match: 'for (int a = c; a <= amount; a++) ways[a] += ways[a - c];', note: 'Ascending because each coin may be reused.' }],
      mistakes: ['Amounts outside / coins inside counts permutations (1+2 and 2+1 separately)'],
      tests: [
        { in: '3 5\n1 2 5', out: '4' },
        { in: '1 3\n2', out: '0' },
        { in: '1 0\n7', out: '1' },
        { in: '4 10\n2 5 3 6', out: '5' },
      ],
    },
    {
      id: 'd29-ones-zeros',
      day: 29,
      title: 'Bit Budget',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-2d'],
      objective: 'Knapsack with two capacities.',
      statement: 'Given binary strings and budgets m (zeros) and n (ones), print the size of the largest subset of strings whose total zeros ≤ m and total ones ≤ n.',
      constraints: ['1 ≤ count ≤ 600', '1 ≤ length ≤ 100', '0 ≤ m, n ≤ 100'],
      examples: [{ input: '10 0001 111001 1 0, m=5, n=3', output: '4' }],
      edgeCases: ['A string that alone exceeds a budget'],
      cues: ['Two separate budgets, each item once'],
      hints: ['best[z][o] = max strings using ≤ z zeros and ≤ o ones.', 'Loop both budgets downwards.'],
      approach: '2D knapsack, value 1 per string.',
      correctness: 'Same take/skip argument as 0/1 knapsack, with a 2D capacity.',
      complexity: { time: 'O(count · m · n)', space: 'O(m · n)', why: 'Table per capacity pair.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int maxStrings(const vector<string>& strs, int m, int n) {
    vector<vector<int>> best(m + 1, vector<int>(n + 1, 0));
    for (const string& s : strs) {
        int zeros = count(s.begin(), s.end(), '0'), ones = s.size() - zeros;
        for (int z = m; z >= zeros; z--)
            for (int o = n; o >= ones; o--) best[z][o] = max(best[z][o], best[z - zeros][o - ones] + 1);
    }
    return best[m][n];
}`,
      main: cpp`
int main() {
    int k, m, n;
    cin >> k >> m >> n;
    vector<string> strs(k);
    for (auto& s : strs) cin >> s;
    cout << maxStrings(strs, m, n) << "\n";
    return 0;
}`,
      io: 'Input: count m n, then the strings. Output: largest subset size.',
      keyLines: [{ match: 'for (int o = n; o >= ones; o--) best[z][o] = max(best[z][o], best[z - zeros][o - ones] + 1);', note: 'Both capacities descend so each string is used once.' }],
      mistakes: ['Ascending loops reuse strings'],
      tests: [
        { in: '5 5 3\n10 0001 111001 1 0', out: '4' },
        { in: '3 1 1\n10 0 1', out: '2' },
        { in: '1 0 0\n1', out: '0' },
        { in: '4 2 2\n00 11 01 10', out: '2' },
      ],
    },
    {
      id: 'd29-profitable-schemes',
      day: 29,
      title: 'Profitable Crew Plans',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['knapsack', 'dp-2d'],
      objective: 'Count knapsack selections with a capped "at least" dimension.',
      statement: 'There are G members and some jobs; job i needs group[i] members and yields profit[i]. A plan is any subset of jobs using at most G members in total with total profit at least P. Print the number of plans modulo 1 000 000 007.',
      constraints: ['1 ≤ G ≤ 100', '0 ≤ P ≤ 100', '1 ≤ jobs ≤ 100', '1 ≤ group[i] ≤ 100', '0 ≤ profit[i] ≤ 100'],
      examples: [{ input: 'G=5, P=3, group 2 2, profit 2 3', output: '2' }],
      edgeCases: ['P = 0 → the empty plan counts', 'Jobs too large to fit'],
      cues: ['Count subsets, one budget (members) and one "at least" target (profit)'],
      hints: ['ways[g][p] = plans using exactly g members with profit min(total, P).', 'Cap profit at P so the table stays small.'],
      approach: 'Counting knapsack over (members used, capped profit), both descending.',
      correctness: 'Capping profit at P merges all "enough profit" states, which behave identically for the answer.',
      complexity: { time: 'O(jobs · G · P)', space: 'O(G · P)', why: 'One table update per job.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int profitableSchemes(int G, int P, const vector<int>& group, const vector<int>& profit) {
    const int MOD = 1000000007;
    vector<vector<long long>> ways(G + 1, vector<long long>(P + 1, 0));
    ways[0][0] = 1;
    for (size_t j = 0; j < group.size(); j++)
        for (int g = G; g >= group[j]; g--)  // descending: row g - group[j] is still "without job j"
            for (int p = 0; p <= P; p++) {
                int to = min(P, p + profit[j]);  // cap profit at P
                ways[g][to] = (ways[g][to] + ways[g - group[j]][p]) % MOD;
            }
    long long total = 0;
    for (int g = 0; g <= G; g++) total = (total + ways[g][P]) % MOD;
    return (int)total;
}`,
      main: cpp`
int main() {
    int G, P, k;
    cin >> G >> P >> k;
    vector<int> group(k), profit(k);
    for (auto& x : group) cin >> x;
    for (auto& x : profit) cin >> x;
    cout << profitableSchemes(G, P, group, profit) << "\n";
    return 0;
}`,
      io: 'Input: G P k, then k group sizes, then k profits. Output: count mod 1e9+7.',
      keyLines: [
        { match: 'int to = min(P, p + profit[j]);', note: 'Every profit ≥ P is equally good, so they share one column.' },
        { match: 'ways[g][to] = (ways[g][to] + ways[g - group[j]][p]) % MOD;', note: 'Push counts forward from the state without job j.' },
      ],
      mistakes: ['Not capping profit (table too large)', 'Double counting when several source profits clamp to the same cell'],
      tests: [
        { in: '5 3 2\n2 2\n2 3', out: '2' },
        { in: '10 5 3\n2 3 5\n6 7 8', out: '7' },
        { in: '1 0 1\n2\n5', out: '1' },
        { in: '1 1 2\n1 1\n0 0', out: '0' },
      ],
    },
  ],
};

export default day;
