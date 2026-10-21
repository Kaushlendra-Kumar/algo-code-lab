import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 37,
    title: 'State-Space and Bitmask DP',
    zone: 'dynamic-programming',
    advanced: true,
    objectives: [
      'Add the missing information to a DP state (holding, cooldown, last colour)',
      'Draw a small state machine and turn its arrows into transitions',
      'Represent a set of visited items as a bitmask and iterate over subsets',
      'Estimate when 2ⁿ · n² states are affordable',
    ],
    prerequisites: ['Day 27: 1D DP', 'Day 14: bit manipulation'],
    lesson: [
      {
        heading: 'When dp[i] is not enough',
        body: 'Sometimes the best decision at step i depends on more than i: are you holding a stock? which colour was the last house? is a cooldown active? Put that information into the state: `dp[i][s]`. The rule is the **Markov property** — the state must contain everything the future depends on.',
      },
      {
        heading: 'State machines',
        body: 'For stock trading with cooldown, each day you are in one of three states: `hold`, `sold` (just sold, must rest tomorrow) or `rest`. Draw arrows for the allowed actions (buy, sell, wait) and each arrow becomes one term in a max. Three variables updated per day give O(n) time and O(1) memory.',
      },
      {
        heading: 'Sets as integers',
        body: 'With n ≤ 20 items, a subset fits in an int: bit j set ⇔ item j is in the set. `mask | (1 << j)` adds j, `(mask >> j) & 1` tests it, `__builtin_popcount(mask)` counts members. Iterating `mask` from 0 to 2ⁿ − 1 visits every subset, and every subset comes after its own subsets.',
      },
      {
        heading: 'Travelling salesman (Held–Karp)',
        body: '`dp[mask][j]` = cheapest way to start at city 0, visit exactly the cities in `mask`, and end at j. Transition: extend to an unvisited k with `dp[mask | 1<<k][k] = min(…, dp[mask][j] + d[j][k])`. Answer: min over j of `dp[full][j] + d[j][0]`. O(2ⁿ · n²) instead of O(n!).',
      },
      {
        heading: 'Budget check',
        body: 'n = 15: 2¹⁵ · 15² ≈ 7·10⁶ — instant. n = 20: ≈ 4·10⁸ — borderline. n = 25: impossible. Memory 2ⁿ · n integers at n = 20 is 80 MB. Always check before choosing bitmask DP.',
      },
    ],
    recognition: [
      '"Cooldown", "at most k transactions", "no two adjacent equal" → add a dimension to the state.',
      'n ≤ 20 and you must visit / assign / partition all items → bitmask DP.',
      'Answer for a range built from smaller ranges with a split point → interval DP.',
    ],
    patterns: ['state-space-dp', 'bitmask-dp', 'bitmask-state', 'interval-dp'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd37-A',
      title: 'Bitmask DP for the travelling salesman',
      goal: 'Find the shortest round trip that starts at city 0, visits every city once and returns.',
      input: '4 cities, distance matrix [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]',
      output: 'states filled = 13\nshortest tour = 80',
      idea: 'dp[mask][j] stores the best cost of a path from 0 that visits exactly mask and ends at j. Every mask is processed after all its subsets because adding a bit makes the number larger.',
      code: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<vector<int>> d = {{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}};
    int n = d.size(), FULL = (1 << n) - 1;
    const int INF = INT_MAX / 2;
    vector<vector<int>> dp(1 << n, vector<int>(n, INF));
    dp[1][0] = 0;  // only city 0 visited, standing at 0
    int filled = 0;
    for (int mask = 1; mask <= FULL; mask++)
        for (int j = 0; j < n; j++) {
            if (dp[mask][j] == INF) continue;
            filled++;
            for (int k = 0; k < n; k++) {
                if ((mask >> k) & 1) continue;  // k already visited
                int next = mask | (1 << k);                                //@gap
                dp[next][k] = min(dp[next][k], dp[mask][j] + d[j][k]);  //@gap
            }
        }
    int best = INF;
    for (int j = 1; j < n; j++) best = min(best, dp[FULL][j] + d[j][0]);
    cout << "states filled = " << filled << "\n";
    cout << "shortest tour = " << best << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'dp[1][0] = 0;  // only city 0 visited, standing at 0', note: 'mask 0001: the tour starts at city 0.' },
        { match: 'if ((mask >> k) & 1) continue;  // k already visited', note: 'Parentheses matter: >> binds tighter than &, but == would not.' },
        { match: 'int next = mask | (1 << k);', note: 'Add k to the visited set.' },
        { match: 'for (int j = 1; j < n; j++) best = min(best, dp[FULL][j] + d[j][0]);', note: 'Close the tour by returning to city 0.' },
      ],
      dryRun: {
        columns: ['mask (binary)', 'meaning', 'example entry'],
        rows: [
          ['0001', 'visited {0}', 'dp[0001][0] = 0'],
          ['0011', 'visited {0,1}', 'dp[0011][1] = 10'],
          ['0111', 'visited {0,1,2}', 'dp[0111][2] = min(10+35, …) = 45'],
          ['1111', 'all visited', 'best = dp[1111][j] + d[j][0] = 80'],
        ],
      },
      complexity: { time: 'O(2ⁿ · n²)', space: 'O(2ⁿ · n)', why: '2ⁿ masks × n end cities × n extensions.' },
      edgeCases: ['n = 1 → tour length 0 (handle separately)', 'Asymmetric distances still work'],
      mistakes: ['1 << n overflow for n ≥ 31', 'Forgetting the return edge to city 0', 'Iterating masks in an order where a superset comes before its subset'],
      tryIt: 'Only 13 (mask, end) states are reachable here out of 64. Compare with 9! = 362 880 orders for n = 10 versus 2¹⁰ · 10 states.',
      bug: {
        find: 'for (int j = 1; j < n; j++) best = min(best, dp[FULL][j] + d[j][0]);',
        replace: 'for (int j = 1; j < n; j++) best = min(best, dp[FULL][j]);',
        symptom: 'The program prints "shortest tour = 65" — the length of a one-way path 0 → 1 → 3 → 2, not a round trip.',
        explanation: 'dp[FULL][j] is a path that visits everything and ends at j. A tour must still return to the start, so add d[j][0] before taking the minimum.',
      },
    },
    exampleB: {
      id: 'd37-B',
      kind: 'variant',
      title: 'State machine DP: stock trading with cooldown',
      goal: 'Buy and sell a stock any number of times, holding at most one share, with a one-day cooldown after each sale. Maximise profit.',
      input: 'prices = {1, 2, 3, 0, 2}',
      output: 'day 0 price 1: hold=-1 sold=0 rest=0\nday 1 price 2: hold=-1 sold=1 rest=0\nday 2 price 3: hold=-1 sold=2 rest=1\nday 3 price 0: hold=1 sold=-1 rest=2\nday 4 price 2: hold=1 sold=3 rest=2\nmax profit = 3',
      idea: 'Three numbers describe the best profit when ending today in each state. Each arrow of the state machine (buy, sell, wait) is one candidate in a max.',
      code: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> prices = {1, 2, 3, 0, 2};
    long long hold = LLONG_MIN / 2, sold = LLONG_MIN / 2, rest = 0;
    for (size_t i = 0; i < prices.size(); i++) {
        long long p = prices[i];
        long long newHold = max(hold, rest - p);  // keep holding, or buy after resting
        long long newSold = hold + p;             // sell what we held
        long long newRest = max(rest, sold);      // wait (cooldown ends)
        hold = newHold;
        sold = newSold;
        rest = newRest;
        cout << "day " << i << " price " << p << ": hold=" << hold << " sold=" << (sold < -1000000 ? 0 : sold)
             << " rest=" << rest << "\n";
    }
    cout << "max profit = " << max(sold, rest) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'long long newHold = max(hold, rest - p);  // keep holding, or buy after resting', note: 'Buying is only allowed from rest — never right after selling.' },
        { match: 'long long newSold = hold + p;             // sell what we held', note: 'Selling moves from hold to sold.' },
        { match: 'long long newRest = max(rest, sold);      // wait (cooldown ends)', note: 'Yesterday\'s sale turns into rest today: that is the cooldown.' },
        { match: 'hold = newHold;', note: 'Compute all new values from the old ones before overwriting.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Three variables updated per day.' },
      edgeCases: ['Falling prices → profit 0', 'Single day'],
      mistakes: ['Updating hold before computing sold from the old hold', 'Allowing a buy from sold (no cooldown)'],
      tryIt: 'Remove the cooldown by buying from max(rest, sold) and compare the profit.',
    },
    complexityNotes: 'A state machine with s states over n steps is O(n · s). Bitmask DP is O(2ⁿ · n²) for TSP-style problems and O(3ⁿ) when iterating submasks of every mask.',
    quiz: [
      {
        prompt: 'Which expression checks whether bit j of mask is set?',
        options: ['mask & 1 << j == 1', '(mask >> j) & 1', 'mask | (1 << j)', 'mask ^ j'],
        answer: 1,
        explanation: 'The first option parses as mask & ((1 << j) == 1) because == binds tighter than &.',
      },
      {
        prompt: 'With cooldown, from which state may you buy?',
        options: ['sold', 'rest', 'hold', 'Any state'],
        answer: 1,
        explanation: 'sold must first pass through a day of rest.',
      },
      {
        prompt: 'Held–Karp for n = 16 cities needs roughly…',
        options: ['16! operations', '2¹⁶ · 16² ≈ 1.7·10⁷ operations', '16² operations', '2¹⁶ operations'],
        answer: 1,
        explanation: 'Masks × end city × next city.',
      },
    ],
    recap: 'If the future depends on extra information, add it to the state. Small state machines give O(n) DPs; small sets become bitmasks, giving O(2ⁿ · n²) solutions to problems that look factorial.',
    nextPrep: 'Tomorrow: combining patterns — hashing with prefix sums, heaps with maps, and more.',
  },
  questions: [
    {
      id: 'd37-paint-fence',
      day: 37,
      title: 'Painting the Fence Posts',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['state-space-dp', 'dp-1d'],
      objective: 'Two-state DP: same as previous colour or different.',
      statement: 'Paint n posts with k colours so that no three consecutive posts share a colour. Print the number of ways.',
      constraints: ['1 ≤ n ≤ 50', '1 ≤ k ≤ 10⁵', 'Answer fits in 64-bit for the tests'],
      examples: [{ input: 'n=3, k=2', output: '6' }],
      edgeCases: ['n = 1 → k', 'k = 1 and n ≥ 3 → 0'],
      cues: ['"no three in a row" → remember whether the last two match'],
      hints: ['same[i] = diff[i−1]; diff[i] = (same[i−1] + diff[i−1]) · (k − 1).'],
      approach: 'Two running counters.',
      correctness: 'A post can match the previous one only if the previous two differed.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two variables.' },
      cpp: cpp`
#include <iostream>
using namespace std;

unsigned long long paintFence(int n, unsigned long long k) {
    if (n == 1) return k;
    unsigned long long same = k, diff = k * (k - 1);  // after two posts
    for (int i = 3; i <= n; i++) {
        unsigned long long newSame = diff;
        unsigned long long newDiff = (same + diff) * (k - 1);
        same = newSame;
        diff = newDiff;
    }
    return same + diff;
}`,
      main: cpp`
int main() {
    int n;
    unsigned long long k;
    cin >> n >> k;
    cout << paintFence(n, k) << "\n";
    return 0;
}`,
      io: 'Input: n k. Output: number of ways.',
      keyLines: [{ match: 'unsigned long long newSame = diff;', note: 'Repeat the colour only after a change.' }],
      mistakes: ['Forgetting the n = 1 base case'],
      tests: [
        { in: '3 2', out: '6' },
        { in: '1 1', out: '1' },
        { in: '7 2', out: '42' },
        { in: '3 1', out: '0' },
      ],
    },
    {
      id: 'd37-paint-house',
      day: 37,
      title: 'Coloured Row Houses',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['state-space-dp', 'dp-2d'],
      objective: 'State = colour of the last house.',
      statement: 'Each of n houses can be painted red, blue or green with given costs. Adjacent houses must differ. Print the minimum total cost.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ cost ≤ 20'],
      examples: [{ input: '(17,2,17) (16,16,5) (14,3,19)', output: '10' }],
      edgeCases: ['Single house → its cheapest colour'],
      cues: ['Adjacent constraint on a small set of choices'],
      hints: ['dp[c] = cost[i][c] + min(dp of the other two colours).'],
      approach: 'Rolling three values.',
      correctness: 'The best plan ending in colour c must come from a best plan ending in another colour.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Three values per house.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <iostream>
#include <vector>
using namespace std;

int minPaintCost(const vector<array<int, 3>>& cost) {
    array<int, 3> dp = cost[0];
    for (size_t i = 1; i < cost.size(); i++) {
        array<int, 3> next;
        for (int c = 0; c < 3; c++) next[c] = cost[i][c] + min(dp[(c + 1) % 3], dp[(c + 2) % 3]);
        dp = next;
    }
    return *min_element(dp.begin(), dp.end());
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<array<int, 3>> cost(n);
    for (auto& c : cost) cin >> c[0] >> c[1] >> c[2];
    cout << minPaintCost(cost) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines of three costs. Output: minimum total.',
      keyLines: [{ match: 'for (int c = 0; c < 3; c++) next[c] = cost[i][c] + min(dp[(c + 1) % 3], dp[(c + 2) % 3]);', note: 'The two other colours via modular indexing.' }],
      mistakes: ['Greedy cheapest colour per house'],
      tests: [
        { in: '3\n17 2 17\n16 16 5\n14 3 19', out: '10' },
        { in: '1\n7 6 2', out: '2' },
        { in: '2\n1 5 3\n2 9 4', out: '5' },
        { in: '4\n1 2 3\n1 2 3\n3 3 1\n2 1 2', out: '5' },
      ],
    },
    {
      id: 'd37-stock-fee',
      day: 37,
      title: 'Trading with a Broker Fee',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['state-space-dp'],
      objective: 'Two-state machine: cash and hold.',
      statement: 'Trade any number of times (one share at a time). Each completed sale costs a fee. Print the maximum profit.',
      constraints: ['1 ≤ n ≤ 5·10⁴', '1 ≤ price ≤ 5·10⁴', '0 ≤ fee ≤ 5·10⁴'],
      examples: [{ input: 'prices 1 3 2 8 4 9, fee 2', output: '8' }],
      edgeCases: ['Fee larger than any gain → 0'],
      cues: ['Unlimited trades with a cost → two states'],
      hints: ['cash = max(cash, hold + p − fee); hold = max(hold, cash − p).'],
      approach: 'Two variables per day.',
      correctness: 'Each state stores the best profit achievable while being in that state.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Constant work per day.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long maxProfitFee(const vector<int>& prices, int fee) {
    long long cash = 0, hold = -prices[0];
    for (size_t i = 1; i < prices.size(); i++) {
        long long newCash = max(cash, hold + prices[i] - fee);
        long long newHold = max(hold, cash - prices[i]);
        cash = newCash;
        hold = newHold;
    }
    return cash;
}`,
      main: cpp`
int main() {
    int n, fee;
    cin >> n >> fee;
    vector<int> p(n);
    for (auto& x : p) cin >> x;
    cout << maxProfitFee(p, fee) << "\n";
    return 0;
}`,
      io: 'Input: n fee, then n prices. Output: maximum profit.',
      keyLines: [{ match: 'long long newCash = max(cash, hold + prices[i] - fee);', note: 'Pay the fee once per sale.' }],
      mistakes: ['Charging the fee on both buy and sell'],
      tests: [
        { in: '6 2\n1 3 2 8 4 9', out: '8' },
        { in: '6 3\n1 3 7 5 10 3', out: '6' },
        { in: '3 10\n1 5 9', out: '0' },
        { in: '1 0\n5', out: '0' },
      ],
    },
    {
      id: 'd37-stock-k',
      day: 37,
      title: 'At Most K Trades',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['state-space-dp', 'dp-2d'],
      objective: 'State = (transactions used, holding).',
      statement: 'With at most k buy-sell transactions (one share at a time), print the maximum profit.',
      constraints: ['0 ≤ k ≤ 100', '0 ≤ n ≤ 1000'],
      examples: [{ input: 'k=2, prices 3 2 6 5 0 3', output: '7' }],
      edgeCases: ['k = 0 or n ≤ 1 → 0', 'k ≥ n/2 → unlimited trades'],
      cues: ['"at most k transactions"'],
      hints: ['buy[t] = max(buy[t], sell[t−1] − p); sell[t] = max(sell[t], buy[t] + p).'],
      approach: 'Arrays buy[1..k], sell[0..k] updated per day.',
      correctness: 'buy[t] / sell[t] are the best profits after the t-th buy / sell so far.',
      complexity: { time: 'O(n · k)', space: 'O(k)', why: 'k states per day.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int maxProfitK(int k, const vector<int>& prices) {
    vector<int> buy(k + 1, INT_MIN / 2), sell(k + 1, 0);
    for (int p : prices)
        for (int t = 1; t <= k; t++) {
            buy[t] = max(buy[t], sell[t - 1] - p);
            sell[t] = max(sell[t], buy[t] + p);
        }
    return sell[k];
}`,
      main: cpp`
int main() {
    int k, n;
    cin >> k >> n;
    vector<int> p(n);
    for (auto& x : p) cin >> x;
    cout << maxProfitK(k, p) << "\n";
    return 0;
}`,
      io: 'Input: k n, then n prices. Output: maximum profit.',
      keyLines: [{ match: 'buy[t] = max(buy[t], sell[t - 1] - p);', note: 'The t-th buy follows the (t−1)-th sell.' }],
      mistakes: ['Initialising buy with 0 (allows "selling" without buying)'],
      tests: [
        { in: '2 6\n3 2 6 5 0 3', out: '7' },
        { in: '2 3\n2 4 1', out: '2' },
        { in: '0 3\n1 2 3', out: '0' },
        { in: '1 5\n7 1 5 3 6', out: '5' },
      ],
    },
    {
      id: 'd37-assignment',
      day: 37,
      title: 'Matching Workers to Jobs',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['bitmask-dp', 'bitmask-state'],
      objective: 'dp over masks of assigned jobs.',
      statement: 'n workers and n jobs; cost[i][j] is the cost of worker i doing job j. Each worker does exactly one job. Print the minimum total cost.',
      constraints: ['1 ≤ n ≤ 16'],
      examples: [{ input: '(9,2,7,8) (6,4,3,7) (5,8,1,8) (7,6,9,4)', output: '13' }],
      edgeCases: ['n = 1'],
      cues: ['n ≤ 16, assign each to a distinct one'],
      hints: ['Worker index = popcount(mask) — workers are assigned in order.', 'dp[mask | 1<<j] = min(dp[mask] + cost[i][j]).'],
      approach: 'Bitmask DP over jobs used.',
      correctness: 'Assigning workers in index order makes the mask alone determine the next worker.',
      complexity: { time: 'O(2ⁿ · n)', space: 'O(2ⁿ)', why: 'Each mask tries n jobs.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int minAssignment(const vector<vector<int>>& cost) {
    int n = cost.size();
    vector<int> dp(1 << n, INT_MAX);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] == INT_MAX) continue;
        int worker = __builtin_popcount(mask);
        if (worker == n) continue;
        for (int j = 0; j < n; j++)
            if (!((mask >> j) & 1)) dp[mask | (1 << j)] = min(dp[mask | (1 << j)], dp[mask] + cost[worker][j]);
    }
    return dp[(1 << n) - 1];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> c(n, vector<int>(n));
    for (auto& row : c)
        for (auto& x : row) cin >> x;
    cout << minAssignment(c) << "\n";
    return 0;
}`,
      io: 'Input: n, then the n×n cost matrix. Output: minimum cost.',
      keyLines: [{ match: 'int worker = __builtin_popcount(mask);', note: 'The number of jobs taken tells which worker is next.' }],
      mistakes: ['Adding the worker to the state (unnecessary 2ⁿ · n states)'],
      tests: [
        { in: '4\n9 2 7 8\n6 4 3 7\n5 8 1 8\n7 6 9 4', out: '13' },
        { in: '1\n5', out: '5' },
        { in: '2\n1 2\n2 1', out: '2' },
        { in: '3\n1 1 1\n1 1 1\n1 1 1', out: '3' },
      ],
    },
    {
      id: 'd37-tsp',
      day: 37,
      title: 'Delivery Round Trip',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['bitmask-dp', 'state-space-dp'],
      objective: 'Held–Karp.',
      statement: 'Given an n×n distance matrix, print the length of the shortest tour that starts at 0, visits every city exactly once and returns to 0.',
      constraints: ['1 ≤ n ≤ 16', '0 ≤ d ≤ 10⁶'],
      examples: [{ input: '4 cities (see example A)', output: '80' }],
      edgeCases: ['n = 1 → 0'],
      cues: ['Visit all, n ≤ 16'],
      hints: ['dp[mask][j] as in the lesson.'],
      approach: 'Held–Karp bitmask DP.',
      correctness: 'Every tour corresponds to a sequence of mask extensions; the DP takes the minimum over them.',
      complexity: { time: 'O(2ⁿ · n²)', space: 'O(2ⁿ · n)', why: 'Standard.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

long long tsp(const vector<vector<long long>>& d) {
    int n = d.size();
    if (n == 1) return 0;
    const long long INF = LLONG_MAX / 4;
    vector<vector<long long>> dp(1 << n, vector<long long>(n, INF));
    dp[1][0] = 0;
    for (int mask = 1; mask < (1 << n); mask++)
        for (int j = 0; j < n; j++) {
            if (dp[mask][j] >= INF) continue;
            for (int k = 0; k < n; k++)
                if (!((mask >> k) & 1)) {
                    int nm = mask | (1 << k);
                    dp[nm][k] = min(dp[nm][k], dp[mask][j] + d[j][k]);
                }
        }
    long long best = INF;
    for (int j = 1; j < n; j++) best = min(best, dp[(1 << n) - 1][j] + d[j][0]);
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<long long>> d(n, vector<long long>(n));
    for (auto& row : d)
        for (auto& x : row) cin >> x;
    cout << tsp(d) << "\n";
    return 0;
}`,
      io: 'Input: n, then the distance matrix. Output: shortest tour length.',
      keyLines: [{ match: 'dp[nm][k] = min(dp[nm][k], dp[mask][j] + d[j][k]);', note: 'Extend the path to an unvisited city.' }],
      mistakes: ['Forgetting the return to city 0'],
      tests: [
        { in: '4\n0 10 15 20\n10 0 35 25\n15 35 0 30\n20 25 30 0', out: '80' },
        { in: '1\n0', out: '0' },
        { in: '2\n0 5\n7 0', out: '12' },
        { in: '3\n0 1 10\n10 0 1\n1 10 0', out: '3' },
      ],
    },
    {
      id: 'd37-k-partition',
      day: 37,
      title: 'Equal Loads for K Trucks',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['bitmask-dp', 'backtracking'],
      objective: 'Bitmask DP storing the fill level of the current bucket.',
      statement: 'Can the numbers be split into k groups with equal sums? Print YES or NO.',
      constraints: ['1 ≤ k ≤ n ≤ 16', '1 ≤ a[i] ≤ 10⁴'],
      examples: [{ input: '4 3 2 3 5 2 1, k=4', output: 'YES' }],
      edgeCases: ['Sum not divisible by k', 'An element larger than the target'],
      cues: ['n ≤ 16, partition into equal groups'],
      hints: ['Fill groups one at a time; dp[mask] = fill of the current group (or -1 if unreachable).'],
      approach: 'dp[mask] = (sum of mask) mod target, valid only if reachable without overflowing a group.',
      correctness: 'Filling groups in order, the used set determines the current group\'s fill; a number can be added only if it fits.',
      complexity: { time: 'O(2ⁿ · n)', space: 'O(2ⁿ)', why: 'Each mask tries n numbers.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

bool canPartitionK(const vector<int>& a, int k) {
    int n = a.size(), total = accumulate(a.begin(), a.end(), 0);
    if (total % k) return false;
    int target = total / k;
    vector<int> fill(1 << n, -1);  // -1 = unreachable
    fill[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (fill[mask] == -1) continue;
        for (int i = 0; i < n; i++) {
            if ((mask >> i) & 1) continue;
            if (fill[mask] + a[i] > target) continue;  // would overflow the current group
            fill[mask | (1 << i)] = (fill[mask] + a[i]) % target;
        }
    }
    return fill[(1 << n) - 1] == 0;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << (canPartitionK(a, k) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: n k, then n numbers. Output: YES or NO.',
      keyLines: [{ match: 'fill[mask | (1 << i)] = (fill[mask] + a[i]) % target;', note: 'A full group wraps to 0 and the next group starts.' }],
      mistakes: ['Greedy filling largest-first without backtracking'],
      tests: [
        { in: '7 4\n4 3 2 3 5 2 1', out: 'YES' },
        { in: '4 3\n1 2 3 4', out: 'NO' },
        { in: '1 1\n5', out: 'YES' },
        { in: '6 3\n2 2 2 2 3 3', out: 'NO' },
      ],
    },
    {
      id: 'd37-burst-balloons',
      day: 37,
      title: 'Popping Lanterns for Points',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['interval-dp', 'state-space-dp'],
      objective: 'Interval DP choosing the last element to remove.',
      statement: 'Bursting lantern i earns left · a[i] · right, where left/right are its current neighbours (1 beyond the ends). Print the maximum total for bursting all lanterns.',
      constraints: ['1 ≤ n ≤ 300', '0 ≤ a[i] ≤ 100'],
      examples: [{ input: '3 1 5 8', output: '167' }],
      edgeCases: ['Single lantern → a[0]'],
      cues: ['Removing items changes neighbours → think about the last one removed in a range'],
      hints: ['Pad with 1 on both sides.', 'dp[l][r] = best for the open interval (l, r); choose the last k to burst inside.'],
      approach: 'Interval DP by increasing length.',
      correctness: 'If k is last in (l, r), its neighbours at that moment are exactly l and r; the two sides are independent.',
      complexity: { time: 'O(n³)', space: 'O(n²)', why: 'n² intervals × n split points.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int maxCoins(const vector<int>& a) {
    vector<int> v = {1};
    v.insert(v.end(), a.begin(), a.end());
    v.push_back(1);
    int m = v.size();
    vector<vector<int>> dp(m, vector<int>(m, 0));
    for (int len = 2; len < m; len++)
        for (int l = 0; l + len < m; l++) {
            int r = l + len;
            for (int k = l + 1; k < r; k++)
                dp[l][r] = max(dp[l][r], dp[l][k] + v[l] * v[k] * v[r] + dp[k][r]);
        }
    return dp[0][m - 1];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << maxCoins(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: maximum total.',
      keyLines: [{ match: 'dp[l][r] = max(dp[l][r], dp[l][k] + v[l] * v[k] * v[r] + dp[k][r]);', note: 'k is burst last, between l and r.' }],
      mistakes: ['Choosing the first lantern to burst (sub-problems are not independent)'],
      tests: [
        { in: '4\n3 1 5 8', out: '167' },
        { in: '2\n1 5', out: '10' },
        { in: '1\n7', out: '7' },
        { in: '3\n2 0 2', out: '6' },
      ],
    },
  ],
};

export default day;
