import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 31,
    title: 'Greedy Choices and How to Trust Them',
    zone: 'greedy',
    objectives: [
      'Recognise problems where a locally best choice is globally safe',
      'Prove a greedy rule with an exchange argument',
      'Disprove a greedy rule quickly with a small counterexample',
      'Combine sorting with greedy selection',
    ],
    prerequisites: ['Day 20: intervals and sorting', 'Day 29: coin change DP'],
    lesson: [
      {
        heading: 'What greedy means',
        body: 'A greedy algorithm makes the choice that looks best right now and never revisits it. It is fast (often one sort plus one pass) — but only correct when the problem has the **greedy-choice property**: some optimal solution starts with the greedy choice.',
      },
      {
        heading: 'Exchange argument',
        body: 'Take any optimal solution that differs from the greedy one at the first decision. Swap in the greedy choice and show the solution stays valid and no worse. Repeating the swap turns the optimum into the greedy solution, so greedy is optimal.',
      },
      {
        heading: 'Interval scheduling',
        body: 'To fit the most non-overlapping intervals, always pick the one that **ends earliest**. Exchange: the first interval of any optimal schedule can be replaced by the earliest-ending one without colliding with the rest. Sorting by start time or by length does *not* work.',
      },
      {
        heading: 'When greedy fails',
        body: 'Coins {1, 3, 4}, amount 6: "largest coin first" gives 4 + 1 + 1 (3 coins) but 3 + 3 uses 2. Before trusting a greedy rule, try tiny adversarial inputs — or compare with a brute force/DP on random cases.',
      },
      {
        heading: 'Common greedy shapes',
        body: '- Sort then sweep (intervals, boats, cookies).\n- Two passes left→right and right→left (candy, trapping constraints).\n- Running balance that resets (gas station).\n- Heap of best current options (Day 15, scheduling).',
      },
    ],
    recognition: [
      '"Maximum number of non-overlapping …" → sort by end, take earliest end.',
      'Pairing smallest with largest under a limit → sort + two pointers.',
      'Feels like DP but the choice is "obviously" safe → try an exchange proof; if it fails, go back to DP.',
    ],
    patterns: ['interval-scheduling', 'activity-selection', 'custom-sort'],
    visualizations: ['greedy'],
    exampleA: {
      id: 'd31-A',
      title: 'Maximum non-overlapping meetings',
      goal: 'Choose as many meetings as possible so that none overlap (a meeting may start exactly when another ends).',
      input: '[1,4] [3,5] [0,6] [5,7] [3,9] [5,9] [6,10] [8,11] [8,12] [2,14] [12,16]',
      output: 'chosen: [1,4] [5,7] [8,11] [12,16]\ncount = 4',
      idea: 'Sort by end time. Keep the end of the last chosen meeting; take a meeting whenever it starts at or after that end.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<pair<int, int>> m = {{1, 4}, {3, 5}, {0, 6}, {5, 7}, {3, 9}, {5, 9},
                                {6, 10}, {8, 11}, {8, 12}, {2, 14}, {12, 16}};
    sort(m.begin(), m.end(), [](const pair<int, int>& a, const pair<int, int>& b) {
        return a.second < b.second;  // earliest end first
    });
    int lastEnd = -1, count = 0;
    cout << "chosen:";
    for (auto& [s, e] : m) {
        if (s >= lastEnd) {  //@gap
            lastEnd = e;     //@gap
            count++;
            cout << " [" << s << "," << e << "]";
        }
    }
    cout << "\n";
    cout << "count = " << count << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'return a.second < b.second;  // earliest end first', note: 'The greedy key: finishing early leaves the most room.' },
        { match: 'if (s >= lastEnd) {', note: 'Compatible with everything chosen so far (touching ends allowed).' },
        { match: 'lastEnd = e;', note: 'Only the last end matters for future compatibility.' },
      ],
      dryRun: {
        columns: ['meeting (sorted by end)', 'lastEnd before', 'take?'],
        rows: [
          ['[1,4]', '-1', 'yes'],
          ['[3,5]', '4', 'no (3 < 4)'],
          ['[0,6]', '4', 'no'],
          ['[5,7]', '4', 'yes'],
          ['[3,9] [5,9] [6,10]', '7', 'no'],
          ['[8,11]', '7', 'yes'],
          ['[8,12] [2,14]', '11', 'no'],
          ['[12,16]', '11', 'yes'],
        ],
      },
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Sorting dominates; the sweep is linear.' },
      edgeCases: ['Meetings that touch (end == start) — decide whether they conflict', 'Identical meetings'],
      mistakes: ['Sorting by start time (one long early meeting blocks everything)', 'Sorting by duration (counterexample: a short meeting straddling two long ones)'],
      tryIt: 'Sort by start time instead and count how many meetings you get.',
      bug: {
        find: 'return a.second < b.second;  // earliest end first',
        replace: 'return a.first < b.first;  // earliest start first',
        symptom: 'The program prints "count = 3" — it grabbed [0,6] first and lost a meeting.',
        explanation: 'Starting early says nothing about how long a meeting blocks the room. The exchange argument only works for the earliest end.',
      },
    },
    exampleB: {
      id: 'd31-B',
      kind: 'edge-case',
      title: 'When greedy fails: coins {1, 3, 4}',
      goal: 'Compare "largest coin first" with DP for every amount up to 8.',
      input: 'coins {1, 3, 4}, amounts 1..8',
      output: 'amount greedy dp\n1 1 1\n2 2 2\n3 1 1\n4 1 1\n5 2 2\n6 3 2  <- greedy is wrong\n7 2 2\n8 2 2',
      idea: 'Greedy is only safe for special coin systems (like 1, 2, 5, 10). A DP table gives the true optimum, and a side-by-side check exposes the failure at 6.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int greedyCoins(vector<int> coins, int amount) {
    sort(coins.rbegin(), coins.rend());
    int used = 0;
    for (int c : coins) {
        used += amount / c;  // take as many of the largest coin as possible
        amount %= c;
    }
    return amount == 0 ? used : -1;
}

int dpCoins(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, 1e9);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
    return dp[amount];
}

int main() {
    vector<int> coins = {1, 3, 4};
    cout << "amount greedy dp\n";
    for (int a = 1; a <= 8; a++) {
        int g = greedyCoins(coins, a), d = dpCoins(coins, a);
        cout << a << " " << g << " " << d;
        if (g != d) cout << "  <- greedy is wrong";
        cout << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'used += amount / c;  // take as many of the largest coin as possible', note: 'The greedy rule — never reconsidered.' },
        { match: 'if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);', note: 'DP tries every last coin, so it cannot be fooled.' },
        { match: 'if (g != d) cout << "  <- greedy is wrong";', note: 'Comparing against a trusted solver is how to test greedy rules.' },
      ],
      complexity: { time: 'Greedy O(k log k); DP O(k · amount)', space: 'O(amount) for DP', why: 'Greedy sorts once; DP fills a table.' },
      edgeCases: ['Coin systems where greedy is optimal (canonical systems)', 'Amounts that are impossible'],
      mistakes: ['Assuming greedy works because it passed the sample'],
      tryIt: 'Try coins {1, 5, 10, 25}: greedy and DP agree for every amount.',
    },
    complexityNotes: 'Most greedy algorithms are O(n log n) because of a sort followed by an O(n) sweep. Their difficulty is in the proof, not the code.',
    quiz: [
      {
        prompt: 'For maximum non-overlapping intervals, sort by…',
        options: ['Start time', 'End time', 'Length', 'Input order'],
        answer: 1,
        explanation: 'Earliest end leaves the most room for the remaining intervals.',
      },
      {
        prompt: 'What does an exchange argument show?',
        options: ['That greedy is fast', 'That any optimal solution can be transformed into the greedy one without getting worse', 'That DP is unnecessary for every problem', 'That the input is sorted'],
        answer: 1,
        explanation: 'If the greedy choice can always be swapped in, greedy is optimal.',
      },
      {
        prompt: 'Coins {1, 3, 4}, amount 6. Greedy (largest first) uses…',
        options: ['2 coins', '3 coins', '4 coins', 'It fails to pay'],
        answer: 1,
        explanation: '4 + 1 + 1. The optimum is 3 + 3.',
      },
    ],
    recap: 'Greedy commits to the locally best option. It is correct only with a proof (usually an exchange argument); a tiny counterexample is enough to reject it. Sort-then-sweep is the most common greedy shape.',
    nextPrep: 'Tomorrow: tries — prefix trees for words and autocomplete.',
  },
  questions: [
    {
      id: 'd31-cookies',
      day: 31,
      title: 'Snack Time Matching',
      difficulty: 'Easy',
      topic: 'greedy',
      patterns: ['custom-sort', 'two-pointers-same'],
      objective: 'Sort two lists and match greedily.',
      statement: 'Child i is content with a snack of size ≥ greed[i]. Each child gets at most one snack. Print the maximum number of content children.',
      constraints: ['1 ≤ children, snacks ≤ 3·10⁴'],
      examples: [{ input: 'greed 1 2 3, snacks 1 1', output: '1' }],
      edgeCases: ['No snacks large enough'],
      cues: ['Match items to requirements, maximise matches'],
      hints: ['Sort both.', 'Give each snack (smallest first) to the least greedy unsatisfied child it can satisfy.'],
      approach: 'Sort + two pointers.',
      correctness: 'Using the smallest sufficient snack for the least greedy child never blocks a better assignment.',
      complexity: { time: 'O(n log n + m log m)', space: 'O(1)', why: 'Sorting dominates.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int contentChildren(vector<int> greed, vector<int> snacks) {
    sort(greed.begin(), greed.end());
    sort(snacks.begin(), snacks.end());
    size_t child = 0;
    for (int s : snacks)
        if (child < greed.size() && s >= greed[child]) child++;
    return child;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<int> greed(n), snacks(m);
    for (auto& g : greed) cin >> g;
    for (auto& s : snacks) cin >> s;
    cout << contentChildren(greed, snacks) << "\n";
    return 0;
}`,
      io: 'Input: n m, then n greed values, then m snack sizes. Output: count.',
      keyLines: [{ match: 'if (child < greed.size() && s >= greed[child]) child++;', note: 'Too-small snacks are skipped forever.' }],
      mistakes: ['Giving the biggest snack to the least greedy child'],
      tests: [
        { in: '3 2\n1 2 3\n1 1', out: '1' },
        { in: '2 3\n1 2\n1 2 3', out: '2' },
        { in: '2 1\n5 6\n4', out: '0' },
        { in: '4 4\n4 1 3 2\n2 2 1 5', out: '3' },
      ],
      viz: 'greedy',
    },
    {
      id: 'd31-lemonade',
      day: 31,
      title: 'Making Change at the Stall',
      difficulty: 'Easy',
      topic: 'greedy',
      patterns: ['activity-selection', 'running-aggregate'],
      objective: 'Greedy change-giving with counts.',
      statement: 'Each drink costs 5. Customers pay with 5, 10 or 20 in order; you start with no change. Print YES if everyone can receive correct change, else NO.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: '5 5 5 10 20', output: 'YES' }],
      edgeCases: ['First customer pays 10 → NO'],
      cues: ['Make change with few denominations; prefer spending larger notes'],
      hints: ['For 20, give 10 + 5 if possible, else 5 + 5 + 5.'],
      approach: 'Track counts of 5s and 10s.',
      correctness: 'A 10 is only useful for 20s, while a 5 is useful for both — so spend the 10 first.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Counters only.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

bool canServe(const vector<int>& bills) {
    int fives = 0, tens = 0;
    for (int b : bills) {
        if (b == 5) fives++;
        else if (b == 10) {
            if (fives == 0) return false;
            fives--;
            tens++;
        } else {
            if (tens > 0 && fives > 0) {
                tens--;
                fives--;
            } else if (fives >= 3) {
                fives -= 3;
            } else {
                return false;
            }
        }
    }
    return true;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> bills(n);
    for (auto& b : bills) cin >> b;
    cout << (canServe(bills) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: n, then n bills. Output: YES or NO.',
      keyLines: [{ match: 'if (tens > 0 && fives > 0) {', note: 'Prefer using the 10 — it is less flexible.' }],
      mistakes: ['Using three 5s first, leaving useless 10s'],
      tests: [
        { in: '5\n5 5 5 10 20', out: 'YES' },
        { in: '5\n5 5 10 10 20', out: 'NO' },
        { in: '1\n10', out: 'NO' },
        { in: '6\n5 5 10 5 20 20', out: 'NO' },
      ],
    },
    {
      id: 'd31-gas-station',
      day: 31,
      title: 'Circular Fuel Route',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['running-aggregate', 'activity-selection'],
      objective: 'Reset-the-start greedy on a circle.',
      statement: 'Station i gives gas[i] fuel; driving to station i+1 costs cost[i]. Starting with an empty tank, print the index of the station from which you can complete the circle, or -1. The answer is unique if it exists.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'gas 1 2 3 4 5, cost 3 4 5 1 2', output: '3' }],
      edgeCases: ['Total gas < total cost → -1'],
      cues: ['Circular tour + running balance'],
      hints: ['If total gas ≥ total cost, a start exists.', 'Whenever the tank goes negative, no station in the current segment can be the start — restart after it.'],
      brute: 'Simulate from every start: O(n²).',
      approach: 'One pass with a running tank and a candidate start.',
      correctness: 'If the tank fails at j starting from s, every start between s and j also fails (they arrive at each point with no more fuel).',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Single pass.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int startStation(const vector<int>& gas, const vector<int>& cost) {
    long long total = 0, tank = 0;
    int start = 0;
    for (size_t i = 0; i < gas.size(); i++) {
        total += gas[i] - cost[i];
        tank += gas[i] - cost[i];
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
    }
    return total < 0 ? -1 : start;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> gas(n), cost(n);
    for (auto& g : gas) cin >> g;
    for (auto& c : cost) cin >> c;
    cout << startStation(gas, cost) << "\n";
    return 0;
}`,
      io: 'Input: n, then gas values, then cost values. Output: start index or -1.',
      keyLines: [{ match: 'start = i + 1;', note: 'Everything up to i is ruled out in one step.' }],
      mistakes: ['Returning start without checking the total'],
      tests: [
        { in: '5\n1 2 3 4 5\n3 4 5 1 2', out: '3' },
        { in: '3\n2 3 4\n3 4 3', out: '-1' },
        { in: '1\n5\n4', out: '0' },
        { in: '4\n4 1 1 5\n2 3 3 2', out: '3' },
      ],
    },
    {
      id: 'd31-partition-labels',
      day: 31,
      title: 'Splitting a Banner',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['interval-scheduling', 'hash-lookup'],
      objective: 'Extend a segment to the last occurrence of its letters.',
      statement: 'Split the string into as many parts as possible so that each letter appears in at most one part. Print the part sizes.',
      constraints: ['1 ≤ |s| ≤ 500', 'Lowercase letters'],
      examples: [{ input: 'ababcbacadefegdehijhklij', output: '9 7 8' }],
      edgeCases: ['All distinct letters → all 1s', 'One repeated letter at both ends → one part'],
      cues: ['Each letter defines an interval from first to last occurrence'],
      hints: ['Record the last index of each letter.', 'Extend the current part end to the max last index seen; cut when i reaches it.'],
      approach: 'Greedy interval merging in one pass.',
      correctness: 'A cut at i is valid iff all letters seen so far end by i; cutting at the first such i maximises the count.',
      complexity: { time: 'O(n)', space: 'O(1)', why: '26 last positions.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<int> partitionLabels(const string& s) {
    int last[26] = {};
    for (int i = 0; i < (int)s.size(); i++) last[s[i] - 'a'] = i;
    vector<int> sizes;
    int start = 0, end = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        end = max(end, last[s[i] - 'a']);
        if (i == end) {
            sizes.push_back(end - start + 1);
            start = i + 1;
        }
    }
    return sizes;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    vector<int> sizes = partitionLabels(s);
    for (size_t i = 0; i < sizes.size(); i++) cout << (i ? " " : "") << sizes[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: s. Output: part sizes separated by spaces.',
      keyLines: [{ match: 'end = max(end, last[s[i] - \'a\']);', note: 'The part must stretch to cover every letter inside it.' }],
      mistakes: ['Cutting when a letter repeats instead of when all letters are closed'],
      tests: [
        { in: 'ababcbacadefegdehijhklij', out: '9 7 8' },
        { in: 'eccbbbbdec', out: '10' },
        { in: 'abc', out: '1 1 1' },
        { in: 'abac', out: '3 1' },
      ],
    },
    {
      id: 'd31-boats',
      day: 31,
      title: 'Rescue Rafts',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['two-pointers-opposite', 'custom-sort'],
      objective: 'Pair heaviest with lightest.',
      statement: 'Each raft carries at most two people with total weight ≤ limit. Print the minimum number of rafts (every person weighs ≤ limit).',
      constraints: ['1 ≤ n ≤ 5·10⁴'],
      examples: [{ input: 'weights 3 2 2 1, limit 3', output: '3' }],
      edgeCases: ['Everyone too heavy to pair'],
      cues: ['Pairs under a limit, minimise groups'],
      hints: ['Sort.', 'The heaviest person always leaves now; take the lightest along if possible.'],
      approach: 'Sort + two pointers.',
      correctness: 'If the heaviest cannot pair with the lightest, they cannot pair with anyone; if they can, pairing them is never worse (exchange argument).',
      complexity: { time: 'O(n log n)', space: 'O(1)', why: 'Sort + linear sweep.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int numRafts(vector<int> w, int limit) {
    sort(w.begin(), w.end());
    int lo = 0, hi = w.size() - 1, rafts = 0;
    while (lo <= hi) {
        if (w[lo] + w[hi] <= limit) lo++;
        hi--;
        rafts++;
    }
    return rafts;
}`,
      main: cpp`
int main() {
    int n, limit;
    cin >> n >> limit;
    vector<int> w(n);
    for (auto& x : w) cin >> x;
    cout << numRafts(w, limit) << "\n";
    return 0;
}`,
      io: 'Input: n limit, then n weights. Output: raft count.',
      keyLines: [{ match: 'if (w[lo] + w[hi] <= limit) lo++;', note: 'The lightest joins only if they fit.' }],
      mistakes: ['Pairing the two lightest people'],
      tests: [
        { in: '4 3\n3 2 2 1', out: '3' },
        { in: '2 3\n1 2', out: '1' },
        { in: '4 5\n3 5 3 4', out: '4' },
        { in: '1 5\n5', out: '1' },
      ],
    },
    {
      id: 'd31-two-city',
      day: 31,
      title: 'Splitting the Interview Panel',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['custom-sort', 'activity-selection'],
      objective: 'Sort by the cost of a decision.',
      statement: '2n candidates; flying candidate i to city A costs a[i] and to city B costs b[i]. Exactly n must go to each city. Print the minimum total cost.',
      constraints: ['1 ≤ n ≤ 50', '1 ≤ costs ≤ 1000'],
      examples: [{ input: '(10,20) (30,200) (400,50) (30,20)', output: '110' }],
      edgeCases: ['Equal differences'],
      cues: ['Two choices per item, a fixed split'],
      hints: ['Sort by a[i] − b[i].', 'The first half goes to A.'],
      approach: 'Sort by preference strength.',
      correctness: 'Candidates with the most negative a − b gain the most from A; any swap of an A and B assignment against this order cannot reduce cost.',
      complexity: { time: 'O(n log n)', space: 'O(1)', why: 'One sort.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int twoCity(vector<pair<int, int>> c) {
    sort(c.begin(), c.end(), [](const pair<int, int>& x, const pair<int, int>& y) {
        return x.first - x.second < y.first - y.second;
    });
    int n = c.size() / 2, total = 0;
    for (int i = 0; i < (int)c.size(); i++) total += i < n ? c[i].first : c[i].second;
    return total;
}`,
      main: cpp`
int main() {
    int m;
    cin >> m;
    vector<pair<int, int>> c(m);
    for (auto& p : c) cin >> p.first >> p.second;
    cout << twoCity(c) << "\n";
    return 0;
}`,
      io: 'Input: 2n, then 2n lines "a b". Output: minimum cost.',
      keyLines: [{ match: 'return x.first - x.second < y.first - y.second;', note: 'Most A-favouring candidates first.' }],
      mistakes: ['Greedily picking the cheaper city per person (breaks the n/n split)'],
      tests: [
        { in: '4\n10 20\n30 200\n400 50\n30 20', out: '110' },
        { in: '2\n5 1\n1 5', out: '2' },
        { in: '6\n259 770\n448 54\n926 667\n184 139\n840 118\n577 469', out: '1859' },
        { in: '2\n7 7\n7 7', out: '14' },
      ],
    },
    {
      id: 'd31-jump-game',
      day: 31,
      title: 'Hopping Across Stones',
      difficulty: 'Medium',
      topic: 'greedy',
      patterns: ['running-aggregate', 'graph-bfs'],
      objective: 'Greedy BFS by layers on an array.',
      statement: 'From index i you may jump up to a[i] steps forward. Starting at 0, print the minimum number of jumps to reach the last index, or -1 if impossible.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ a[i] ≤ 10⁵'],
      examples: [{ input: '2 3 1 1 4', output: '2' }],
      edgeCases: ['n = 1 → 0', 'A zero that blocks progress → -1'],
      cues: ['Minimum jumps, reach ranges'],
      hints: ['Indices reachable with k jumps form a contiguous range.', 'Track the end of the current range and the farthest reach of the next.'],
      approach: 'Implicit BFS over ranges.',
      correctness: 'Each layer is exactly the set of indices reachable with that many jumps.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int minJumps(const vector<int>& a) {
    int n = a.size(), jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i < n - 1; i++) {
        if (i > farthest) return -1;
        farthest = max(farthest, i + a[i]);
        if (i == curEnd) {
            if (farthest <= i) return -1;
            jumps++;
            curEnd = farthest;
            if (curEnd >= n - 1) break;
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
      io: 'Input: n, then n jump lengths. Output: minimum jumps or -1.',
      keyLines: [{ match: 'if (i == curEnd) {', note: 'End of a BFS layer: one more jump is needed.' }],
      mistakes: ['Always jumping to the farthest index (not optimal)'],
      tests: [
        { in: '5\n2 3 1 1 4', out: '2' },
        { in: '5\n3 2 1 0 4', out: '-1' },
        { in: '1\n0', out: '0' },
        { in: '6\n1 1 1 1 1 1', out: '5' },
      ],
    },
    {
      id: 'd31-candy',
      day: 31,
      title: 'Fair Sticker Handout',
      difficulty: 'Hard',
      topic: 'greedy',
      patterns: ['running-aggregate', 'in-place-transform'],
      objective: 'Two-pass greedy that satisfies left and right constraints.',
      statement: 'Children stand in a line with ratings. Each child gets at least one sticker, and a child with a higher rating than a neighbour gets more stickers than that neighbour. Print the minimum total.',
      constraints: ['1 ≤ n ≤ 2·10⁴'],
      examples: [{ input: '1 0 2', output: '5' }],
      edgeCases: ['Equal neighbours have no constraint', 'Strictly decreasing ratings'],
      cues: ['Constraints from both neighbours'],
      hints: ['Left-to-right pass handles the left neighbour.', 'Right-to-left pass handles the right neighbour, taking the max.'],
      approach: 'Two passes.',
      correctness: 'Each pass gives the minimal count satisfying one side; the max of the two satisfies both and is minimal.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Two passes with an array.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

long long minStickers(const vector<int>& r) {
    int n = r.size();
    vector<int> give(n, 1);
    for (int i = 1; i < n; i++)
        if (r[i] > r[i - 1]) give[i] = give[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--)
        if (r[i] > r[i + 1]) give[i] = max(give[i], give[i + 1] + 1);
    return accumulate(give.begin(), give.end(), 0LL);
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> r(n);
    for (auto& x : r) cin >> x;
    cout << minStickers(r) << "\n";
    return 0;
}`,
      io: 'Input: n, then n ratings. Output: minimum total stickers.',
      keyLines: [{ match: 'if (r[i] > r[i + 1]) give[i] = max(give[i], give[i + 1] + 1);', note: 'max keeps the left constraint satisfied too.' }],
      mistakes: ['Overwriting instead of taking max in the second pass'],
      tests: [
        { in: '3\n1 0 2', out: '5' },
        { in: '3\n1 2 2', out: '4' },
        { in: '5\n5 4 3 2 1', out: '15' },
        { in: '6\n1 3 4 5 2 1', out: '13' },
      ],
    },
  ],
};

export default day;
