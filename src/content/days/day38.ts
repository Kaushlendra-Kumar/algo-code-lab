import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 38,
    title: 'Combining Patterns',
    zone: 'advanced',
    advanced: true,
    objectives: [
      'Pair a prefix sum with a hash map to answer subarray questions in O(n)',
      'Pair a hash map with a heap for frequency-based selection',
      'Combine memoisation with DFS on implicit DAGs',
      'Break an unfamiliar problem into known building blocks',
    ],
    prerequisites: ['Day 3: prefix sums', 'Day 15: heaps', 'Day 27: memoisation'],
    lesson: [
      {
        heading: 'Most hard problems are two easy ones',
        body: 'Interview problems often glue two patterns together: a prefix sum turns "subarray sum = k" into "two prefix values differ by k", and a hash map finds that difference in O(1). Learn to ask: *what quantity would make this a lookup?*',
      },
      {
        heading: 'Prefix sum + hash map',
        body: '`sum(i..j) = P[j+1] − P[i]`. To find subarrays with sum k ending at j, look up how many (or the earliest) earlier prefixes equal `P[j+1] − k`. Store the **first** index of each prefix for "longest", or the **count** for "how many". Works with negative numbers, unlike sliding windows.',
      },
      {
        heading: 'Hash map + heap',
        body: 'Count with a hash map in O(n), then select the top k entries with a size-k min-heap in O(d log k) where d is the number of distinct keys. The map handles identity, the heap handles ranking.',
      },
      {
        heading: 'DFS + memo on implicit DAGs',
        body: 'If moves always go "uphill" (strictly increasing values, later times, larger sets), the state graph has no cycles, so DFS with memoisation computes longest paths in O(V + E). No visited array is needed — the ordering prevents loops.',
      },
      {
        heading: 'A checklist for new problems',
        body: '1. What is the brute force and its complexity?\n2. Which repeated work could a data structure remove (hash, heap, prefix, monotonic stack)?\n3. Is there monotonicity (binary search, two pointers)?\n4. Are there overlapping sub-problems (DP)?\n5. Check the constraints: n ≤ 20 → exponential, n ≤ 10³ → n², n ≤ 10⁵ → n log n.',
      },
    ],
    recognition: [
      'Subarray sum / count with negative numbers → prefix sum + hash map.',
      '"k most frequent", "top k by score" → hash count + heap (or sort).',
      'Longest path where moves strictly increase something → DFS + memo.',
    ],
    patterns: ['prefix-sum', 'hash-lookup', 'top-k', 'memoization', 'brute-to-optimal'],
    visualizations: ['prefix-sum', 'heap'],
    exampleA: {
      id: 'd38-A',
      title: 'Longest subarray with sum k (prefix sum + hash map)',
      goal: 'Find the length of the longest contiguous subarray whose sum is exactly k. Numbers may be negative.',
      input: 'a = {1, -1, 5, -2, 3}, k = 3',
      output: 'j=0 prefix=1\nj=1 prefix=0\nj=2 prefix=5\nj=3 prefix=3 match length 4\nj=4 prefix=6 match length 1\nlongest = 4',
      idea: 'Store the first index where each prefix sum appears. At position j, a previous prefix equal to prefix − k marks the start of a subarray with sum k; the earliest such start gives the longest one.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {1, -1, 5, -2, 3};
    int k = 3;
    unordered_map<long long, int> firstIndex;
    firstIndex[0] = -1;  // empty prefix "ends" before index 0
    long long prefix = 0;
    int best = 0;
    for (int j = 0; j < (int)a.size(); j++) {
        prefix += a[j];
        cout << "j=" << j << " prefix=" << prefix;
        auto it = firstIndex.find(prefix - k);
        if (it != firstIndex.end()) {
            best = max(best, j - it->second);  //@gap
            cout << " match length " << j - it->second;
        }
        if (!firstIndex.count(prefix)) firstIndex[prefix] = j;  //@gap
        cout << "\n";
    }
    cout << "longest = " << best << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'firstIndex[0] = -1;  // empty prefix "ends" before index 0', note: 'Allows subarrays that start at index 0.' },
        { match: 'auto it = firstIndex.find(prefix - k);', note: 'sum(i+1..j) = prefix − P[i] = k ⇔ P[i] = prefix − k.' },
        { match: 'if (!firstIndex.count(prefix)) firstIndex[prefix] = j;', note: 'Keep only the earliest index: it gives the longest subarray.' },
      ],
      dryRun: {
        columns: ['j', 'a[j]', 'prefix', 'look for', 'found at', 'length'],
        rows: [
          ['0', '1', '1', '−2', '—', '—'],
          ['1', '−1', '0', '−3', '—', '—'],
          ['2', '5', '5', '2', '—', '—'],
          ['3', '−2', '3', '0', '−1', '4'],
          ['4', '3', '6', '3', '3', '1'],
        ],
      },
      complexity: { time: 'O(n) expected', space: 'O(n)', why: 'One pass with O(1) average hash operations.' },
      edgeCases: ['No subarray sums to k → 0', 'k = 0 with zero-sum stretches', 'Overflow — use long long for prefixes'],
      mistakes: ['Overwriting the index of a repeated prefix (gives shorter subarrays)', 'Using a sliding window with negative numbers'],
      tryIt: 'Change the map to count prefixes instead and count all subarrays with sum k.',
      bug: {
        find: 'if (!firstIndex.count(prefix)) firstIndex[prefix] = j;',
        replace: 'firstIndex[prefix] = j;',
        symptom: 'The program prints "longest = 2" — prefix 0 reappears at j = 1 and overwrites the seed index −1.',
        explanation: 'Overwriting keeps the latest index of each prefix sum, so the start of the subarray moves right and the length shrinks. For "longest", keep the first occurrence; for "shortest", keep the last.',
      },
    },
    exampleB: {
      id: 'd38-B',
      kind: 'variant',
      title: 'Top-k frequent values (hash map + min-heap)',
      goal: 'Find the k values that occur most often.',
      input: 'a = {4, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4}, k = 2',
      output: 'counts: 1x2 2x3 3x4 4x2\ntop 2: 3 2',
      idea: 'Count with a hash map, then keep a min-heap of (count, value) of size k: the smallest of the current top k sits on top and is evicted when something more frequent arrives.',
      code: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <map>
#include <queue>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {4, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4};
    int k = 2;
    map<int, int> freq;  // ordered only so the printout is deterministic
    for (int x : a) freq[x]++;
    cout << "counts:";
    for (auto& [v, c] : freq) cout << " " << v << "x" << c;
    cout << "\n";
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;  // (count, value)
    for (auto& [v, c] : freq) {
        heap.push({c, v});
        if ((int)heap.size() > k) heap.pop();  // evict the least frequent
    }
    vector<int> top;
    while (!heap.empty()) {
        top.push_back(heap.top().second);
        heap.pop();
    }
    reverse(top.begin(), top.end());  // most frequent first
    cout << "top " << k << ":";
    for (int v : top) cout << " " << v;
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'for (int x : a) freq[x]++;', note: 'Step 1: counting.' },
        { match: 'if ((int)heap.size() > k) heap.pop();  // evict the least frequent', note: 'Step 2: the heap never grows beyond k.' },
        { match: 'reverse(top.begin(), top.end());  // most frequent first', note: 'A min-heap pops in ascending order.' },
      ],
      complexity: { time: 'O(n + d log k)', space: 'O(d)', why: 'd distinct values, heap of size k.' },
      edgeCases: ['Ties in frequency (define a tie-break)', 'k equals the number of distinct values'],
      mistakes: ['Using a max-heap of all d values when k ≪ d', 'Forgetting the final reverse'],
      tryIt: 'Use bucket sort by frequency (vector of lists indexed by count) for O(n).',
    },
    complexityNotes: 'Combined solutions cost the sum of their parts: prefix + hash is O(n); hash + heap is O(n + d log k); DFS + memo is O(states + transitions).',
    quiz: [
      {
        prompt: 'Why does a sliding window fail for "longest subarray with sum k" when numbers can be negative?',
        options: ['It is too slow', 'Growing the window can decrease the sum, so shrink/grow decisions are not monotone', 'It needs sorting', 'It uses too much memory'],
        answer: 1,
        explanation: 'Windows rely on monotonicity that negative numbers break.',
      },
      {
        prompt: 'For "longest", which index of a repeated prefix sum should be stored?',
        options: ['The latest', 'The earliest', 'Both', 'Neither'],
        answer: 1,
        explanation: 'The earliest start gives the longest subarray.',
      },
      {
        prompt: 'DFS with memo computes longest increasing paths in a grid without a visited array because…',
        options: ['Grids are small', 'Strictly increasing moves cannot form cycles', 'Memo replaces recursion', 'It uses BFS'],
        answer: 1,
        explanation: 'The value strictly increases along any path, so no cell repeats.',
      },
    ],
    recap: 'Many problems are compositions: prefix sums + hashing for subarray sums, hashing + heaps for frequency rankings, DFS + memo for longest paths on DAGs. Start from the brute force and remove its repeated work with the right structure.',
    nextPrep: 'Tomorrow: implementation-heavy problems — matrices, parsing and careful edge cases.',
  },
  questions: [
    {
      id: 'd38-count-pairs',
      day: 38,
      title: 'Matching Price Tags',
      difficulty: 'Easy',
      topic: 'advanced',
      patterns: ['hash-lookup', 'frequency-counting'],
      objective: 'Count pairs with a given sum using a hash map.',
      statement: 'Print the number of index pairs i < j with a[i] + a[j] = target.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]|, |target| ≤ 10⁹'],
      examples: [{ input: '1 5 7 -1 5, target 6', output: '3' }],
      edgeCases: ['Duplicates', 'x + x = target'],
      cues: ['Pairs with a sum → complement lookup'],
      hints: ['For each x, add count[target − x] seen so far, then record x.'],
      approach: 'One pass with a frequency map.',
      correctness: 'Each pair is counted exactly once, at its later index.',
      complexity: { time: 'O(n) expected', space: 'O(n)', why: 'Hash map.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

long long countPairs(const vector<long long>& a, long long target) {
    unordered_map<long long, long long> seen;
    long long pairs = 0;
    for (long long x : a) {
        auto it = seen.find(target - x);
        if (it != seen.end()) pairs += it->second;
        seen[x]++;
    }
    return pairs;
}`,
      main: cpp`
int main() {
    int n;
    long long target;
    cin >> n >> target;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << countPairs(a, target) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n integers. Output: number of pairs.',
      keyLines: [{ match: 'seen[x]++;', note: 'Record x after the lookup so it never pairs with itself.' }],
      mistakes: ['Recording before looking up (counts i = j)'],
      tests: [
        { in: '5 6\n1 5 7 -1 5', out: '3' },
        { in: '4 2\n1 1 1 1', out: '6' },
        { in: '1 2\n1', out: '0' },
        { in: '3 0\n-1000000000 1000000000 0', out: '1' },
      ],
    },
    {
      id: 'd38-longest-sum-k',
      day: 38,
      title: 'Longest Balanced Ledger Run',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['prefix-sum', 'hash-lookup'],
      objective: 'Earliest-index prefix map.',
      statement: 'Print the length of the longest contiguous subarray with sum exactly k (0 if none). Values may be negative.',
      constraints: ['1 ≤ n ≤ 2·10⁵', '|a[i]| ≤ 10⁹', '|k| ≤ 10¹⁵'],
      examples: [{ input: '1 -1 5 -2 3, k=3', output: '4' }],
      edgeCases: ['Whole array', 'No match'],
      cues: ['Subarray sum with negatives'],
      hints: ['Map prefix → first index, seeded with 0 → −1.'],
      approach: 'Prefix sum + hash map (first occurrence).',
      correctness: 'For each end j the earliest valid start is found in O(1).',
      complexity: { time: 'O(n) expected', space: 'O(n)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int longestSumK(const vector<long long>& a, long long k) {
    unordered_map<long long, int> first;
    first[0] = -1;
    long long prefix = 0;
    int best = 0;
    for (int j = 0; j < (int)a.size(); j++) {
        prefix += a[j];
        auto it = first.find(prefix - k);
        if (it != first.end()) best = max(best, j - it->second);
        first.emplace(prefix, j);  // emplace does nothing if the key exists
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << longestSumK(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: longest length.',
      keyLines: [{ match: 'first.emplace(prefix, j);  // emplace does nothing if the key exists', note: 'Keeps the earliest index automatically.' }],
      mistakes: ['first[prefix] = j overwrites'],
      tests: [
        { in: '5 3\n1 -1 5 -2 3', out: '4' },
        { in: '4 1\n-2 -1 2 1', out: '2' },
        { in: '3 3\n0 0 3', out: '3' },
        { in: '2 10\n1 2', out: '0' },
      ],
      viz: 'prefix-sum',
    },
    {
      id: 'd38-k-smallest-pairs',
      day: 38,
      title: 'Cheapest Outfit Combinations',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['heap-greedy', 'top-k'],
      objective: 'Heap over a sorted 2D frontier.',
      statement: 'Two sorted arrays a and b. Print the k pairs (a[i], b[j]) with the smallest sums, in order of sum (ties by i, then j), as "x+y".',
      constraints: ['1 ≤ |a|, |b| ≤ 10⁵', '1 ≤ k ≤ 10⁴'],
      examples: [{ input: 'a 1 7 11, b 2 4 6, k=3', output: '1+2 1+4 1+6' }],
      edgeCases: ['k larger than |a|·|b|'],
      cues: ['k smallest among a sorted matrix of sums'],
      hints: ['Start with (i, 0) for every i < k; after popping (i, j) push (i, j+1).'],
      approach: 'Min-heap over row heads.',
      correctness: 'Each row is sorted, so the next candidate in a row is its right neighbour; the heap holds the frontier.',
      complexity: { time: 'O(k log k)', space: 'O(k)', why: 'At most k + min(k, |a|) heap operations.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

vector<pair<int, int>> kSmallestPairs(const vector<int>& a, const vector<int>& b, int k) {
    priority_queue<tuple<long long, int, int>, vector<tuple<long long, int, int>>, greater<tuple<long long, int, int>>> pq;
    for (int i = 0; i < (int)a.size() && i < k; i++) pq.push({(long long)a[i] + b[0], i, 0});
    vector<pair<int, int>> res;
    while (!pq.empty() && (int)res.size() < k) {
        auto [s, i, j] = pq.top();
        pq.pop();
        res.push_back({a[i], b[j]});
        if (j + 1 < (int)b.size()) pq.push({(long long)a[i] + b[j + 1], i, j + 1});
    }
    return res;
}`,
      main: cpp`
int main() {
    int n, m, k;
    cin >> n >> m >> k;
    vector<int> a(n), b(m);
    for (auto& x : a) cin >> x;
    for (auto& x : b) cin >> x;
    auto res = kSmallestPairs(a, b, k);
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i].first << "+" << res[i].second;
    cout << "\n";
    return 0;
}`,
      io: 'Input: n m k, then a, then b. Output: pairs as x+y.',
      keyLines: [{ match: 'if (j + 1 < (int)b.size()) pq.push({(long long)a[i] + b[j + 1], i, j + 1});', note: 'Advance only along the popped row.' }],
      mistakes: ['Generating all n·m pairs'],
      tests: [
        { in: '3 3 3\n1 7 11\n2 4 6', out: '1+2 1+4 1+6' },
        { in: '3 3 2\n1 1 2\n1 2 3', out: '1+1 1+1' },
        { in: '2 1 3\n1 2\n3', out: '1+3 2+3' },
        { in: '2 2 4\n1 2\n1 2', out: '1+1 1+2 2+1 2+2' },
      ],
    },
    {
      id: 'd38-evaluate-division',
      day: 38,
      title: 'Currency Exchange Chains',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['graph-dfs', 'hash-lookup'],
      objective: 'Weighted graph + DFS multiplying along a path.',
      statement: 'Given equations a / b = v, answer queries x / y by chaining equations. Print each answer with 5 decimals, or -1.00000 if unknown.',
      constraints: ['1 ≤ equations, queries ≤ 20', 'Names are short lowercase strings'],
      examples: [{ input: 'a/b=2, b/c=3; queries a/c b/a a/e a/a', output: '6.00000 0.50000 -1.00000 1.00000' }],
      edgeCases: ['x/x where x is unknown → -1', 'Disconnected names'],
      cues: ['Ratios that compose along paths'],
      hints: ['Edge a → b with weight v and b → a with 1/v.', 'DFS from x multiplying weights until y.'],
      approach: 'Hash-mapped adjacency + DFS per query.',
      correctness: 'The product along any path from x to y equals x / y by transitivity.',
      complexity: { time: 'O(Q · (V + E))', space: 'O(V + E)', why: 'One DFS per query.' },
      cpp: cpp`
#include <cstdio>
#include <iostream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;

unordered_map<string, vector<pair<string, double>>> g;

double dfs(const string& x, const string& y, unordered_set<string>& seen) {
    if (x == y) return 1.0;
    seen.insert(x);
    for (auto& [nb, w] : g[x]) {
        if (seen.count(nb)) continue;
        double r = dfs(nb, y, seen);
        if (r > 0) return w * r;
    }
    return -1.0;
}

double query(const string& x, const string& y) {
    if (!g.count(x) || !g.count(y)) return -1.0;
    unordered_set<string> seen;
    return dfs(x, y, seen);
}`,
      main: cpp`
int main() {
    int e, q;
    cin >> e;
    for (int i = 0; i < e; i++) {
        string a, b;
        double v;
        cin >> a >> b >> v;
        g[a].push_back({b, v});
        g[b].push_back({a, 1.0 / v});
    }
    cin >> q;
    for (int i = 0; i < q; i++) {
        string x, y;
        cin >> x >> y;
        printf("%s%.5f", i ? " " : "", query(x, y));
    }
    printf("\n");
    return 0;
}`,
      io: 'Input: e, then e lines "a b value", then q and q lines "x y". Output: answers with 5 decimals.',
      keyLines: [{ match: 'g[b].push_back({a, 1.0 / v});', note: 'The reverse edge carries the reciprocal.' }],
      mistakes: ['Answering x/x = 1 for unknown x'],
      tests: [
        { in: '2\na b 2.0\nb c 3.0\n4\na c\nb a\na e\na a', out: '6.00000 0.50000 -1.00000 1.00000' },
        { in: '1\nx y 0.5\n2\ny x\nz z', out: '2.00000 -1.00000' },
        { in: '3\na b 1.5\nb c 2.5\nbc cd 5.0\n2\na c\nc bc', out: '3.75000 -1.00000' },
        { in: '1\np q 4\n1\nq p', out: '0.25000' },
      ],
    },
    {
      id: 'd38-non-overlapping',
      day: 38,
      title: 'Most Separate Target Runs',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['prefix-sum', 'hash-lookup', 'interval-scheduling'],
      objective: 'Prefix + hash combined with a greedy reset.',
      statement: 'Print the maximum number of non-empty, non-overlapping subarrays each with sum exactly target.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]| ≤ 10⁴'],
      examples: [{ input: '-1 3 5 1 4 2 -9, target 6', output: '2' }],
      edgeCases: ['All zeros with target 0'],
      cues: ['Count non-overlapping subarrays with a sum → greedy earliest end'],
      hints: ['Scan with a prefix set; when a match appears, count it and reset the set.'],
      approach: 'Greedy: always close the subarray that ends earliest.',
      correctness: 'Taking the earliest-ending valid subarray is optimal (interval scheduling exchange argument).',
      complexity: { time: 'O(n) expected', space: 'O(n)', why: 'Hash set per segment.' },
      cpp: cpp`
#include <iostream>
#include <unordered_set>
#include <vector>
using namespace std;

int maxNonOverlapping(const vector<int>& a, int target) {
    unordered_set<long long> seen = {0};
    long long prefix = 0;
    int count = 0;
    for (int x : a) {
        prefix += x;
        if (seen.count(prefix - target)) {
            count++;
            seen = {0};  // start fresh after the chosen subarray
            prefix = 0;
        } else {
            seen.insert(prefix);
        }
    }
    return count;
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << maxNonOverlapping(a, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n integers. Output: maximum count.',
      keyLines: [{ match: 'seen = {0};  // start fresh after the chosen subarray', note: 'Later subarrays must start after this one ends.' }],
      mistakes: ['Not resetting (counts overlapping subarrays)'],
      tests: [
        { in: '7 6\n-1 3 5 1 4 2 -9', out: '2' },
        { in: '5 2\n1 1 1 1 1', out: '2' },
        { in: '4 0\n0 0 0 0', out: '4' },
        { in: '3 10\n1 2 3', out: '0' },
      ],
    },
    {
      id: 'd38-min-window-distinct',
      day: 38,
      title: 'Shortest Tour of Every Stall',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['sliding-window-variable', 'frequency-counting'],
      objective: 'Sliding window + frequency map with a "covered" counter.',
      statement: 'Print the length of the shortest contiguous subarray that contains every distinct value of the array at least once.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: '2 1 2 3 3 1 2', output: '3' }],
      edgeCases: ['All equal → 1', 'All distinct → n'],
      cues: ['Shortest window covering a set'],
      hints: ['Count distinct values D first.', 'Expand right; while the window has D distinct, shrink left.'],
      approach: 'Variable sliding window.',
      correctness: 'For each right end the window is shrunk to the shortest valid one.',
      complexity: { time: 'O(n) expected', space: 'O(D)', why: 'Each index enters and leaves once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;

int shortestCovering(const vector<int>& a) {
    size_t D = unordered_set<int>(a.begin(), a.end()).size();
    unordered_map<int, int> cnt;
    int best = a.size(), l = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        cnt[a[r]]++;
        while (cnt.size() == D) {
            best = min(best, r - l + 1);
            if (--cnt[a[l]] == 0) cnt.erase(a[l]);
            l++;
        }
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << shortestCovering(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n values. Output: shortest length.',
      keyLines: [{ match: 'if (--cnt[a[l]] == 0) cnt.erase(a[l]);', note: 'Erase zero counts so cnt.size() is the number of distinct values in the window.' }],
      mistakes: ['Leaving zero entries in the map'],
      tests: [
        { in: '7\n2 1 2 3 3 1 2', out: '3' },
        { in: '3\n5 5 5', out: '1' },
        { in: '4\n1 2 3 4', out: '4' },
        { in: '6\n1 1 2 2 3 1', out: '3' },
      ],
    },
    {
      id: 'd38-longest-increasing-path',
      day: 38,
      title: 'Longest Climb on a Height Map',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['memoization', 'graph-dfs', 'grid-traversal'],
      objective: 'DFS + memo on an implicit DAG.',
      statement: 'Print the length of the longest strictly increasing path in a grid (moves up/down/left/right).',
      constraints: ['1 ≤ R, C ≤ 200'],
      examples: [{ input: '994 / 668 / 211', output: '4', explanation: '1 → 2 → 6 → 9' }],
      edgeCases: ['All equal → 1'],
      cues: ['Strictly increasing moves → no cycles → memo works'],
      hints: ['best(r, c) = 1 + max best(neighbour) over larger neighbours.'],
      approach: 'Memoised DFS from every cell.',
      correctness: 'The increasing-value order is a topological order, so memoised values are final.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell computed once with 4 neighbours.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int R, C;
vector<vector<int>> h, memo;

int best(int r, int c) {
    if (memo[r][c]) return memo[r][c];
    int res = 1;
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int d = 0; d < 4; d++) {
        int nr = r + dr[d], nc = c + dc[d];
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && h[nr][nc] > h[r][c]) res = max(res, 1 + best(nr, nc));
    }
    return memo[r][c] = res;
}

int longestIncreasingPath() {
    memo.assign(R, vector<int>(C, 0));
    int ans = 0;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) ans = max(ans, best(r, c));
    return ans;
}`,
      main: cpp`
int main() {
    cin >> R >> C;
    h.assign(R, vector<int>(C));
    for (auto& row : h)
        for (auto& x : row) cin >> x;
    cout << longestIncreasingPath() << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid. Output: longest path length.',
      keyLines: [{ match: 'if (memo[r][c]) return memo[r][c];', note: '0 means "not computed" because every answer is ≥ 1.' }],
      mistakes: ['Adding a visited array (unnecessary and breaks memo reuse)'],
      tests: [
        { in: '3 3\n9 9 4\n6 6 8\n2 1 1', out: '4' },
        { in: '3 3\n3 4 5\n3 2 6\n2 2 1', out: '4' },
        { in: '1 1\n1', out: '1' },
        { in: '2 3\n1 2 3\n6 5 4', out: '6' },
      ],
    },
    {
      id: 'd38-count-smaller',
      day: 38,
      title: 'Shorter Rivals to the Right',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['merge-sort', 'divide-and-conquer'],
      objective: 'Count inversions per element with merge sort.',
      statement: 'For each element, print how many elements to its right are strictly smaller.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]| ≤ 10⁴'],
      examples: [{ input: '5 2 6 1', output: '2 1 1 0' }],
      edgeCases: ['Duplicates (not counted as smaller)'],
      cues: ['"how many to the right are smaller" for every index → inversion counting'],
      hints: ['Merge sort indices by value.', 'When taking from the left half, add how many right-half elements were already taken.'],
      approach: 'Merge sort on index array with counters.',
      correctness: 'Right-half elements merged before a left element are exactly the smaller ones to its right in that half.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Merge sort.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

void sortCount(const vector<int>& a, vector<int>& idx, vector<int>& cnt, vector<int>& tmp, int lo, int hi) {
    if (hi - lo <= 1) return;
    int mid = (lo + hi) / 2;
    sortCount(a, idx, cnt, tmp, lo, mid);
    sortCount(a, idx, cnt, tmp, mid, hi);
    int i = lo, j = mid, k = lo, takenRight = 0;
    while (i < mid || j < hi) {
        if (j == hi || (i < mid && a[idx[i]] <= a[idx[j]])) {
            cnt[idx[i]] += takenRight;  // right elements already merged are smaller
            tmp[k++] = idx[i++];
        } else {
            takenRight++;
            tmp[k++] = idx[j++];
        }
    }
    for (int t = lo; t < hi; t++) idx[t] = tmp[t];
}

vector<int> countSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> idx(n), cnt(n, 0), tmp(n);
    for (int i = 0; i < n; i++) idx[i] = i;
    sortCount(a, idx, cnt, tmp, 0, n);
    return cnt;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    auto res = countSmaller(a);
    for (int i = 0; i < n; i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: n counts.',
      keyLines: [{ match: 'cnt[idx[i]] += takenRight;  // right elements already merged are smaller', note: '<= in the comparison keeps equal values from being counted.' }],
      mistakes: ['Sorting values instead of indices (loses the original positions)'],
      tests: [
        { in: '4\n5 2 6 1', out: '2 1 1 0' },
        { in: '1\n-1', out: '0' },
        { in: '2\n-1 -1', out: '0 0' },
        { in: '5\n5 4 3 2 1', out: '4 3 2 1 0' },
      ],
    },
  ],
};

export default day;
