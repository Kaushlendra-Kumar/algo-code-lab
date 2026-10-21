import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 9,
    title: 'Sorting, Custom Comparators and Merge Reasoning',
    zone: 'foundations',
    objectives: [
      'Use std::sort with lambdas and multi-key comparators',
      'Know which sorts are stable and why stability matters',
      'Sort intervals and records so that a greedy scan finishes the job',
      'Count pairs across halves using the merge step of merge sort',
    ],
    prerequisites: ['Day 1: complexity of sorting', 'Day 4: merging two sorted arrays'],
    lesson: [
      {
        heading: 'std::sort and comparators',
        body: '`sort(v.begin(), v.end(), cmp)` sorts in O(n log n). The comparator answers "should a come before b?" and must be a **strict weak ordering**: `cmp(a, a)` is false, and it is transitive. Returning `a <= b` breaks this and is undefined behaviour.',
      },
      {
        heading: 'Multi-key ordering',
        body: 'Compare the primary key first; only when equal fall back to the next key: `if (a.score != b.score) return a.score > b.score; return a.name < b.name;`. `std::tie(a.x, a.y) < std::tie(b.x, b.y)` builds lexicographic comparisons concisely.',
      },
      {
        heading: 'Stability',
        body: 'A stable sort keeps equal elements in their original relative order. `std::stable_sort` (merge sort based) is stable; `std::sort` is not guaranteed to be. Stability lets you sort by several keys in passes (least significant first).',
      },
      {
        heading: 'Sort first, then scan',
        body: 'Many problems become simple after sorting: closest pair of numbers are neighbours, overlapping meetings are adjacent after sorting by start, duplicates cluster together. The total cost is O(n log n) for the sort plus O(n) for the scan.',
      },
      {
        heading: 'Merge-based counting',
        body: 'During merge sort\'s merge step, when an element from the right half is taken before remaining left elements, it is smaller than all of them — that is a batch of **inversions** counted in O(1). The whole count costs O(n log n) instead of O(n²).',
      },
    ],
    recognition: [
      'The answer depends on relative order, not on positions → consider sorting first.',
      'Ties must be broken in a specific way → multi-key comparator.',
      'Count pairs (i < j) with a[i] > a[j] → merge sort counting.',
      'Original indices needed after sorting → sort indices or pairs (value, index).',
    ],
    patterns: ['custom-sort', 'merge-sort', 'interval-sorting', 'divide-and-conquer'],
    visualizations: ['sorting'],
    exampleA: {
      id: 'd09-A',
      title: 'Leaderboard with a multi-key comparator',
      goal: 'Sort players by score (high first); break ties by name alphabetically.',
      input: '{"mia", 90}, {"ava", 95}, {"leo", 90}, {"zoe", 70}',
      output: '1. ava 95\n2. leo 90\n3. mia 90\n4. zoe 70',
      idea: 'A comparator returns true when a must come before b. Check the primary key; only on a tie look at the secondary key.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Player {
    string name;
    int score;
};

int main() {
    vector<Player> players = {{"mia", 90}, {"ava", 95}, {"leo", 90}, {"zoe", 70}};
    sort(players.begin(), players.end(), [](const Player& a, const Player& b) {
        if (a.score != b.score) return a.score > b.score;  //@gap
        return a.name < b.name;                            //@gap
    });
    for (size_t i = 0; i < players.size(); i++)
        cout << i + 1 << ". " << players[i].name << " " << players[i].score << "\n";
    return 0;
}`,
      keyLines: [
        { match: '[](const Player& a, const Player& b) {', note: 'A lambda comparator; const references avoid copying strings.' },
        { match: 'if (a.score != b.score) return a.score > b.score;', note: 'Higher score first (descending primary key).' },
        { match: 'return a.name < b.name;', note: 'Tie-break: alphabetical (ascending secondary key).' },
      ],
      dryRun: {
        columns: ['comparison', 'rule used', 'result'],
        rows: [
          ['ava(95) vs mia(90)', 'scores differ → 95 > 90', 'ava first'],
          ['mia(90) vs leo(90)', 'scores equal → "leo" < "mia"', 'leo first'],
          ['leo(90) vs zoe(70)', 'scores differ → 90 > 70', 'leo first'],
        ],
      },
      complexity: { time: 'O(n log n · L)', space: 'O(log n)', why: 'O(n log n) comparisons; string comparisons cost up to O(L). std::sort uses O(log n) stack.' },
      edgeCases: ['All scores equal → pure alphabetical order', 'Identical players — comparator must return false for both orders'],
      mistakes: ['return a.score >= b.score (not a strict weak ordering → undefined behaviour)', 'Comparing names first'],
      tryIt: 'Add a third key: among equal score and name, the player who joined earlier (a new field) comes first.',
      bug: {
        find: 'return a.name < b.name;',
        replace: 'return a.name > b.name;',
        symptom: 'The program prints "2. mia 90" before leo, breaking alphabetical tie-breaking.',
        explanation: 'For equal scores the comparator must put the alphabetically smaller name first, i.e. return a.name < b.name.',
      },
    },
    exampleB: {
      id: 'd09-B',
      kind: 'variant',
      title: 'Insertion sort from scratch',
      goal: 'Sort a small array by growing a sorted prefix — the building block many hybrid sorts use for tiny ranges.',
      input: 'a = {5, 2, 4, 6, 1, 3}',
      output: 'sorted: 1 2 3 4 5 6',
      idea: 'a[0..i−1] is always sorted. Take key = a[i], shift larger elements right, and drop key into the gap.',
      code: TRACE_CODE['insertion-sort'],
      keyLines: [
        { match: 'int key = a[i];', note: 'Save the value: shifting will overwrite a[i].' },
        { match: 'while (j >= 0 && a[j] > key) {', note: 'Strict > keeps equal elements in order → insertion sort is stable.' },
        { match: 'a[j + 1] = a[j];', note: 'Shift one larger element to the right.' },
        { match: 'a[j + 1] = key;', note: 'j stopped just before the insertion point.' },
      ],
      complexity: { time: 'O(n²) worst, O(n) on sorted input', space: 'O(1)', why: 'Each key may shift past all earlier elements; on sorted input the while loop never runs.' },
      edgeCases: ['Already sorted (best case)', 'Reverse sorted (worst case)', 'Duplicates stay in order'],
      mistakes: ['Checking a[j] > key before j >= 0 (reads a[−1])', 'Using >= (breaks stability)'],
      tryIt: 'Count the number of shifts; it equals the number of inversions in the array.',
      trace: { id: 'insertion-sort', input: { a: [5, 2, 4, 6, 1, 3] } },
    },
    complexityNotes: 'std::sort is O(n log n). Sorting-based solutions cost O(n log n) + the scan. Merge-sort inversion counting is O(n log n) time and O(n) extra space.',
    quiz: [
      {
        prompt: 'Which comparator is valid for sorting ints in descending order?',
        options: ['[](int a, int b){ return a >= b; }', '[](int a, int b){ return a > b; }', '[](int a, int b){ return a - b; }', '[](int a, int b){ return true; }'],
        answer: 1,
        explanation: 'It must be a strict weak ordering: comp(x, x) must be false. >= violates that.',
      },
      {
        prompt: 'You need equal-score players to keep their original input order. Which call guarantees it?',
        options: ['sort', 'stable_sort', 'nth_element', 'partial_sort'],
        answer: 1,
        explanation: 'Only stable_sort guarantees stability.',
      },
      {
        prompt: 'During a merge, the right element 3 is taken while 4 left elements remain. How many inversions does that add?',
        options: ['1', '3', '4', '0'],
        answer: 2,
        explanation: 'All 4 remaining left elements are greater than 3 and appear before it.',
      },
    ],
    recap: 'Comparators encode the order a problem needs; sort first, then a linear scan often solves it. Merge sort\'s merge step can count cross-half relationships in bulk.',
    nextPrep: 'Tomorrow: stacks and queues, including monotonic stacks. Review push/pop/top on std::stack.',
  },
  questions: [
    {
      id: 'd09-min-abs-diff',
      day: 9,
      title: 'Closest Pair of Prices',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['custom-sort'],
      objective: 'After sorting, the closest pair is adjacent.',
      statement: 'Print the minimum absolute difference between any two of the n distinct prices.',
      constraints: ['2 ≤ n ≤ 10⁵', '−10⁹ ≤ price ≤ 10⁹'],
      examples: [{ input: 'prices = [4, 2, 1, 3]', output: '1' }],
      edgeCases: ['Negative prices', 'n = 2', 'Differences up to 2·10⁹ (64-bit)'],
      cues: ['Closest values → neighbours after sorting'],
      hints: ['Checking all pairs is O(n²).', 'Sort; only adjacent elements can be closest.'],
      approach: 'Sort and take the minimum of a[i] − a[i − 1].',
      correctness: 'For sorted a and i < j, a[j] − a[i] ≥ a[i+1] − a[i], so non-adjacent pairs are never better.',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Dominated by sorting.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

long long minAbsDiff(vector<long long> a) {
    sort(a.begin(), a.end());
    long long best = LLONG_MAX;
    for (size_t i = 1; i < a.size(); i++) best = min(best, a[i] - a[i - 1]);
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << minAbsDiff(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: minimum difference.',
      keyLines: [{ match: 'best = min(best, a[i] - a[i - 1]);', note: 'Sorted, so the difference is non-negative.' }],
      mistakes: ['int overflow for 10⁹ − (−10⁹)'],
      tests: [
        { in: '4\n4 2 1 3', out: '1' },
        { in: '2\n-1000000000 1000000000', out: '2000000000' },
        { in: '5\n10 30 21 42 27', out: '3' },
        { in: '3\n-5 -1 7', out: '4' },
      ],
      viz: 'sorting',
    },
    {
      id: 'd09-relative-sort',
      day: 9,
      title: 'Sort by a Priority List',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['custom-sort', 'hash-lookup'],
      objective: 'Map each value to a rank and sort by (rank, value).',
      statement: 'Sort array a so that values appearing in the priority list p come first, in the order of p; remaining values follow in ascending order.',
      constraints: ['1 ≤ |a|, |p| ≤ 1000', 'p has distinct values'],
      examples: [{ input: 'a = [2,3,1,3,2,4,6,7,9,2,19], p = [2,1,4,3,9,6]', output: '2 2 2 1 4 3 3 9 6 7 19' }],
      edgeCases: ['Values not in p', 'p contains values absent from a'],
      cues: ['Custom order defined by a list → rank map + comparator'],
      hints: ['Store rank[p[i]] = i.', 'Values not in p get rank |p| (after all listed ones).', 'Compare (rank, value) pairs.'],
      approach: 'unordered_map rank; sort by (rank or INF, value).',
      correctness: 'The comparator orders first by priority position, then numerically, exactly as required.',
      complexity: { time: 'O(n log n)', space: 'O(|p|)', why: 'Sorting with O(1) average rank lookups.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

void relativeSort(vector<int>& a, const vector<int>& p) {
    unordered_map<int, int> rank;
    for (int i = 0; i < (int)p.size(); i++) rank[p[i]] = i;
    int other = p.size();
    auto key = [&](int x) {
        auto it = rank.find(x);
        return make_pair(it == rank.end() ? other : it->second, x);
    };
    sort(a.begin(), a.end(), [&](int x, int y) { return key(x) < key(y); });
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cin >> m;
    vector<int> p(m);
    for (auto& x : p) cin >> x;
    relativeSort(a, p);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, n values, m, m priority values. Output: sorted array.',
      keyLines: [{ match: 'return make_pair(it == rank.end() ? other : it->second, x);', note: 'pair comparison is lexicographic: rank first, then value.' }],
      mistakes: ['Using rank[x] inside the comparator (inserts missing keys)'],
      tests: [
        { in: '11\n2 3 1 3 2 4 6 7 9 2 19\n6\n2 1 4 3 9 6', out: '2 2 2 1 4 3 3 9 6 7 19' },
        { in: '3\n5 4 3\n0', out: '3 4 5' },
        { in: '4\n1 1 2 2\n1\n2', out: '2 2 1 1' },
        { in: '2\n9 8\n3\n8 9 7', out: '8 9' },
      ],
    },
    {
      id: 'd09-can-attend',
      day: 9,
      title: 'Can I Attend Every Meeting?',
      difficulty: 'Easy',
      topic: 'foundations',
      patterns: ['interval-sorting'],
      objective: 'Detect overlap among intervals by sorting on start time.',
      statement: 'Given n meetings [start, end) print `true` if one person can attend all of them (no overlaps; touching is allowed).',
      constraints: ['0 ≤ n ≤ 10⁴'],
      examples: [{ input: 'meetings = [[0,30],[5,10],[15,20]]', output: 'false' }],
      edgeCases: ['No meetings', 'Touching intervals [1,2) and [2,3)'],
      cues: ['Any overlap among intervals → sort by start and compare neighbours'],
      hints: ['After sorting by start, an overlap must occur between neighbours.', 'Check start[i] < end[i − 1].'],
      approach: 'Sort by start; return false if any meeting starts before the previous one ends.',
      correctness: 'If meeting i overlaps some earlier meeting j, it also starts before the end of the latest-ending earlier meeting — the check against the neighbour catches the first overlap.',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Sort plus a scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

bool canAttendAll(vector<pair<int, int>> m) {
    sort(m.begin(), m.end());
    for (size_t i = 1; i < m.size(); i++)
        if (m[i].first < m[i - 1].second) return false;
    return true;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> m(n);
    for (auto& [s, e] : m) cin >> s >> e;
    cout << (canAttendAll(m) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "start end". Output: true or false.',
      keyLines: [{ match: 'if (m[i].first < m[i - 1].second) return false;', note: 'Strict <: a meeting may start exactly when the previous ends.' }],
      mistakes: ['Using <= and rejecting touching meetings'],
      tests: [
        { in: '3\n0 30\n5 10\n15 20', out: 'false' },
        { in: '2\n7 10\n2 4', out: 'true' },
        { in: '2\n1 2\n2 3', out: 'true' },
        { in: '0', out: 'true' },
      ],
    },
    {
      id: 'd09-sort-by-frequency',
      day: 9,
      title: 'Frequency Ranking',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['custom-sort', 'frequency-counting'],
      objective: 'Sort by a computed key with a tie-break.',
      statement: 'Sort integers by increasing frequency; values with equal frequency are sorted in decreasing order. Print the result.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [1, 1, 2, 2, 2, 3]', output: '3 1 1 2 2 2' }],
      edgeCases: ['All distinct → descending order', 'All equal'],
      cues: ['Order by a derived statistic → count first, then comparator'],
      hints: ['Count frequencies.', 'Comparator: freq[a] < freq[b], or equal freq and a > b.'],
      approach: 'Frequency map then sort with the two-level comparator.',
      correctness: 'The comparator matches the required order exactly and is a strict weak ordering.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Counting plus sorting.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

void frequencySort(vector<int>& a) {
    unordered_map<int, int> freq;
    for (int x : a) freq[x]++;
    sort(a.begin(), a.end(), [&](int x, int y) {
        if (freq[x] != freq[y]) return freq[x] < freq[y];
        return x > y;
    });
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    frequencySort(a);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: re-ordered array.',
      keyLines: [{ match: 'if (freq[x] != freq[y]) return freq[x] < freq[y];', note: 'Every value in a is already a key, so operator[] does not insert here.' }],
      mistakes: ['Tie-breaking ascending instead of descending'],
      tests: [
        { in: '6\n1 1 2 2 2 3', out: '3 1 1 2 2 2' },
        { in: '5\n2 3 1 3 2', out: '1 3 3 2 2' },
        { in: '3\n-1 1 -6', out: '1 -1 -6' },
        { in: '4\n5 5 5 5', out: '5 5 5 5' },
      ],
    },
    {
      id: 'd09-largest-number',
      day: 9,
      title: 'Biggest Number From Tiles',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['custom-sort', 'activity-selection'],
      objective: 'Derive a comparator from pairwise concatenation.',
      statement: 'Arrange non-negative integers so their concatenation forms the largest number; print it as a string (no leading zeros except the single number 0).',
      constraints: ['1 ≤ n ≤ 100', '0 ≤ value ≤ 10⁹'],
      examples: [{ input: 'a = [3, 30, 34, 5, 9]', output: '9534330' }],
      edgeCases: ['All zeros → "0"', 'Prefix relationships like 3 vs 30'],
      cues: ['Order decided by which concatenation is bigger → comparator on strings a+b vs b+a'],
      hints: ['Numeric order fails: 3 should come before 30.', 'Put x before y if x+y > y+x as strings.', 'If the first character is \'0\', the answer is "0".'],
      approach: 'Convert to strings, sort with (x + y > y + x), join, handle the all-zero case.',
      correctness: 'The concatenation comparator is transitive; an exchange argument shows any adjacent pair out of this order can be swapped to increase the result.',
      complexity: { time: 'O(n log n · L)', space: 'O(n · L)', why: 'Each comparison builds strings of length ≤ 2L.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string largestNumber(const vector<long long>& a) {
    vector<string> s;
    for (long long x : a) s.push_back(to_string(x));
    sort(s.begin(), s.end(), [](const string& x, const string& y) { return x + y > y + x; });
    if (s[0] == "0") return "0";
    string out;
    for (auto& t : s) out += t;
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << largestNumber(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the largest concatenation.',
      keyLines: [
        { match: 'return x + y > y + x;', note: 'Compare the two possible concatenations directly.' },
        { match: 'if (s[0] == "0") return "0";', note: 'If the biggest piece is 0, everything is 0.' },
      ],
      mistakes: ['Sorting numerically', 'Returning "000"'],
      tests: [
        { in: '5\n3 30 34 5 9', out: '9534330' },
        { in: '2\n10 2', out: '210' },
        { in: '3\n0 0 0', out: '0' },
        { in: '3\n121 12 1', out: '121211' },
      ],
    },
    {
      id: 'd09-h-index',
      day: 9,
      title: 'Researcher Impact Score',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['custom-sort', 'monotonic-predicate'],
      objective: 'Sort descending and find the last index satisfying a monotone condition.',
      statement: 'Given citation counts for n papers, print the h-index: the largest h such that at least h papers have ≥ h citations.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ citations ≤ 10⁹'],
      examples: [{ input: 'c = [3, 0, 6, 1, 5]', output: '3' }],
      edgeCases: ['All zero → 0', 'All huge → n'],
      cues: ['"at least h items with value ≥ h" → sort descending and scan'],
      hints: ['Sort citations in descending order.', 'h can be i + 1 while c[i] ≥ i + 1.'],
      approach: 'Sort descending; h = number of leading positions with c[i] ≥ i + 1.',
      correctness: 'In descending order the condition c[i] ≥ i + 1 is true for a prefix and false afterwards.',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'Sort plus scan (a counting-sort variant is O(n)).' },
      cpp: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

int hIndex(vector<long long> c) {
    sort(c.begin(), c.end(), greater<long long>());
    int h = 0;
    while (h < (int)c.size() && c[h] >= h + 1) h++;
    return h;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    cout << hIndex(c) << "\n";
    return 0;
}`,
      io: 'Input: n, then n citation counts. Output: h-index.',
      keyLines: [{ match: 'sort(c.begin(), c.end(), greater<long long>());', note: 'greater<> sorts in descending order.' }],
      mistakes: ['Off-by-one: compare with h + 1, not h'],
      tests: [
        { in: '5\n3 0 6 1 5', out: '3' },
        { in: '3\n1 3 1', out: '1' },
        { in: '2\n0 0', out: '0' },
        { in: '3\n100 100 100', out: '3' },
      ],
    },
    {
      id: 'd09-team-ranking',
      day: 9,
      title: 'Tournament Standings',
      difficulty: 'Medium',
      topic: 'foundations',
      patterns: ['custom-sort'],
      objective: 'Implement a four-key comparator with std::tie.',
      statement: 'Each team has a name, points, goal difference and goals scored. Rank by points (desc), then goal difference (desc), then goals scored (desc), then name (asc). Print the names in order.',
      constraints: ['1 ≤ n ≤ 10⁴', 'Names are unique lowercase words'],
      examples: [{ input: 'reds 10 5 12, blues 10 5 14, greens 12 1 8', output: 'greens blues reds' }],
      edgeCases: ['Complete ties except name', 'Negative goal difference'],
      cues: ['Lexicographic multi-key order → std::tie with negated descending keys'],
      hints: ['Descending keys can be compared by negating them.', 'std::tie(a.x, a.y) < std::tie(b.x, b.y) compares lexicographically.'],
      approach: 'Sort with tie(-points, -gd, -scored, name).',
      correctness: 'Tuple comparison implements exactly the specified priority order.',
      complexity: { time: 'O(n log n)', space: 'O(1) extra', why: 'One sort.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <tuple>
#include <vector>
using namespace std;

struct Team {
    string name;
    int points, gd, scored;
};

void rankTeams(vector<Team>& t) {
    sort(t.begin(), t.end(), [](const Team& a, const Team& b) {
        return make_tuple(-a.points, -a.gd, -a.scored, a.name) < make_tuple(-b.points, -b.gd, -b.scored, b.name);
    });
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<Team> t(n);
    for (auto& x : t) cin >> x.name >> x.points >> x.gd >> x.scored;
    rankTeams(t);
    for (int i = 0; i < n; i++) cout << t[i].name << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n lines "name points gd scored". Output: ranked names.',
      keyLines: [{ match: 'return make_tuple(-a.points, -a.gd, -a.scored, a.name) < make_tuple(-b.points, -b.gd, -b.scored, b.name);', note: 'Negating numeric keys turns ascending tuple order into descending for those keys.' }],
      mistakes: ['Negating the name (impossible) instead of only the numbers'],
      tests: [
        { in: '3\nreds 10 5 12\nblues 10 5 14\ngreens 12 1 8', out: 'greens blues reds' },
        { in: '2\nb 3 0 1\na 3 0 1', out: 'a b' },
        { in: '3\nx 0 -2 1\ny 0 -1 0\nz 1 -9 0', out: 'z y x' },
        { in: '1\nsolo 0 0 0', out: 'solo' },
      ],
    },
    {
      id: 'd09-count-inversions',
      day: 9,
      title: 'How Unsorted Is It?',
      difficulty: 'Hard',
      topic: 'foundations',
      patterns: ['merge-sort', 'divide-and-conquer'],
      objective: 'Count inversions during merge sort.',
      statement: 'Count pairs (i < j) with a[i] > a[j].',
      constraints: ['1 ≤ n ≤ 2·10⁵', 'Answer may exceed 2³¹'],
      examples: [{ input: 'a = [2, 4, 1, 3, 5]', output: '3', explanation: '(2,1), (4,1), (4,3)' }],
      edgeCases: ['Sorted → 0', 'Reverse sorted → n(n−1)/2', 'Duplicates are not inversions'],
      cues: ['Count pairs with an order relation across positions → merge sort counting'],
      hints: ['Split in halves and count inversions inside each half recursively.', 'Cross inversions are counted while merging.', 'When taking from the right half, add the number of remaining left elements.'],
      brute: 'Double loop: O(n²).',
      approach: 'Merge sort; on taking b[j] before remaining a[i..], add (mid − i).',
      correctness: 'Each cross pair is counted exactly once at the moment its right element is merged.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Merge sort recursion with a temporary buffer.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long sortCount(vector<int>& a, vector<int>& tmp, int lo, int hi) {  // [lo, hi)
    if (hi - lo < 2) return 0;
    int mid = lo + (hi - lo) / 2;
    long long cnt = sortCount(a, tmp, lo, mid) + sortCount(a, tmp, mid, hi);
    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else {
            cnt += mid - i;  // a[i..mid) are all > a[j]
            tmp[k++] = a[j++];
        }
    }
    while (i < mid) tmp[k++] = a[i++];
    while (j < hi) tmp[k++] = a[j++];
    for (int t = lo; t < hi; t++) a[t] = tmp[t];
    return cnt;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n), tmp(n);
    for (auto& x : a) cin >> x;
    cout << sortCount(a, tmp, 0, n) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: number of inversions.',
      keyLines: [
        { match: 'cnt += mid - i;', note: 'Batch-count all remaining left elements at once.' },
        { match: 'if (a[i] <= a[j]) tmp[k++] = a[i++];', note: '<= so equal values are not counted as inversions.' },
      ],
      mistakes: ['Using < (counts equal pairs)', 'int counter overflow'],
      tests: [
        { in: '5\n2 4 1 3 5', out: '3' },
        { in: '4\n4 3 2 1', out: '6' },
        { in: '3\n1 1 1', out: '0' },
        { in: '6\n1 20 6 4 5 2', out: '9' },
      ],
    },
  ],
};

export default day;
