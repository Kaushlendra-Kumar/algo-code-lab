import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 8,
    title: 'Binary Search on the Answer and Rotated Arrays',
    zone: 'binary-search',
    objectives: [
      'Recognise monotone feasibility: if x works, every larger x works',
      'Binary search over a range of candidate answers with a greedy check',
      'Search rotated sorted arrays by identifying the sorted half',
      'Choose safe search bounds and avoid overflow in feasibility checks',
    ],
    prerequisites: ['Day 7: lower bound and invariants', 'Day 1: estimating complexity'],
    lesson: [
      {
        heading: 'Searching answers, not indices',
        body: 'Some problems ask for the **smallest value x** that makes something possible: the slowest speed that finishes on time, the smallest truck capacity, the least number of days. If `feasible(x)` is false…false true…true as x grows, binary search over x finds the first true value in O(log(range)) checks.',
      },
      {
        heading: 'Designing feasible(x)',
        body: 'The check usually simulates the process greedily with the candidate fixed: "at speed x, how many hours?", "with capacity x, how many days?". It must be monotone and fast, typically O(n). Total time: O(n · log(range)).',
      },
      {
        heading: 'Bounds',
        body: '`lo` must be a value that might be the answer (often 1 or max(element)), and `hi` must be definitely feasible (often the sum or the maximum). With a half-open search `[lo, hi)` set hi one past a feasible value, or use the closed form and track the best answer.',
      },
      {
        heading: 'Rotated sorted arrays',
        body: 'A sorted array rotated at some pivot (e.g. [4,5,6,7,0,1,2]) is two sorted runs. At any mid, **at least one half is sorted**. Check whether the target lies inside that sorted half; if so search there, otherwise search the other half. The minimum is the boundary of the predicate `a[i] <= a.back()`.',
      },
    ],
    recognition: [
      '"Minimum/maximum value such that …" with a large numeric range → binary search on the answer.',
      'Checking one candidate is easy (greedy simulation) but enumerating all is too slow.',
      'Sorted array that has been rotated, and O(log n) is required → compare with an endpoint to find the sorted half.',
    ],
    patterns: ['binary-search-answer', 'monotonic-predicate', 'monotonicity-detection'],
    visualizations: ['binary-search'],
    exampleA: {
      id: 'd08-A',
      title: 'Slowest reading speed that finishes on time',
      goal: 'Books have p[i] pages. Each hour you read up to x pages of a single book. Find the minimum integer x that finishes all books within h hours.',
      input: 'pages = {3, 6, 7, 11}, h = 8',
      output: 'minimum speed = 4',
      idea: 'Hours needed at speed x is Σ ceil(p[i] / x), which never increases as x grows. So "finishes within h hours" is false…false true…true over x — binary search the first true.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Can we finish all books in h hours at speed x?
bool feasible(const vector<int>& pages, long long x, long long h) {
    long long hours = 0;
    for (int p : pages) hours += (p + x - 1) / x;  // ceil(p / x)
    return hours <= h;
}

int main() {
    vector<int> pages = {3, 6, 7, 11};
    long long h = 8;
    long long lo = 1, hi = *max_element(pages.begin(), pages.end());
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (feasible(pages, mid, h)) hi = mid;  //@gap
        else lo = mid + 1;                      //@gap
    }
    cout << "minimum speed = " << lo << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'hours += (p + x - 1) / x;', note: 'Integer ceiling division without floating point.' },
        { match: 'long long lo = 1, hi = *max_element(pages.begin(), pages.end());', note: 'At speed max(p) every book takes 1 hour, so hi is feasible whenever h ≥ number of books.' },
        { match: 'if (feasible(pages, mid, h)) hi = mid;', note: 'mid works — the answer is mid or smaller.' },
        { match: 'else lo = mid + 1;', note: 'mid is too slow — every smaller speed is too slow as well.' },
      ],
      dryRun: {
        columns: ['lo', 'hi', 'mid', 'hours at mid', 'feasible?'],
        rows: [
          ['1', '11', '6', '1+1+2+2 = 6', 'yes → hi = 6'],
          ['1', '6', '3', '1+2+3+4 = 10', 'no → lo = 4'],
          ['4', '6', '5', '1+2+2+3 = 8', 'yes → hi = 5'],
          ['4', '5', '4', '1+2+2+3 = 8', 'yes → hi = 4'],
          ['4', '4', '—', '—', 'stop: answer 4'],
        ],
      },
      complexity: { time: 'O(n log M)', space: 'O(1)', why: 'log₂(M) iterations, M = max pages, each running an O(n) feasibility check.' },
      edgeCases: ['h equals the number of books → answer = max(p)', 'Very large page counts: hours can exceed 2³¹, use long long'],
      mistakes: ['Using floating-point ceil', 'Starting lo at 0 (division by zero)'],
      tryIt: 'Print the number of hours needed at the optimal speed as well.',
      bug: {
        find: 'for (int p : pages) hours += (p + x - 1) / x;',
        replace: 'for (int p : pages) hours += p / x;',
        symptom: 'The program prints "minimum speed = 3", but at 3 pages per hour the books need 1 + 2 + 3 + 4 = 10 hours.',
        explanation: 'A partially read book still costs a whole hour, so hours must round up: ceil(p / x) = (p + x − 1) / x. Plain integer division rounds down and underestimates the time.',
      },
    },
    exampleB: {
      id: 'd08-B',
      kind: 'variant',
      title: 'Search in a rotated sorted array',
      goal: 'Find a target in a sorted array of distinct values that was rotated at an unknown pivot.',
      input: 'a = {4, 5, 6, 7, 0, 1, 2}; targets 0 and 3',
      output: '0 found at index 4\n3 not found',
      idea: 'Compare a[lo] with a[mid]. If a[lo] ≤ a[mid], the left half is sorted; otherwise the right half is. Check whether the target fits inside the sorted half to decide where to go.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

int searchRotated(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {  // left half [lo, mid] is sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                // right half [mid, hi] is sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

int main() {
    vector<int> a = {4, 5, 6, 7, 0, 1, 2};
    for (int t : {0, 3}) {
        int idx = searchRotated(a, t);
        if (idx == -1) cout << t << " not found\n";
        else cout << t << " found at index " << idx << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'if (a[lo] <= a[mid]) {', note: '<= handles lo == mid (a one-element left half is sorted).' },
        { match: 'if (a[lo] <= target && target < a[mid]) hi = mid - 1;', note: 'Target inside the sorted left half — search there.' },
        { match: 'if (a[mid] < target && target <= a[hi]) lo = mid + 1;', note: 'Target inside the sorted right half.' },
      ],
      dryRun: {
        columns: ['lo', 'hi', 'mid', 'a[mid]', 'sorted half', 'decision (target 0)'],
        rows: [
          ['0', '6', '3', '7', 'left [4..7]', '0 not in [4, 7) → lo = 4'],
          ['4', '6', '5', '1', 'left [0..1]', '0 in [0, 1) → hi = 4'],
          ['4', '4', '4', '0', '—', 'found at 4'],
        ],
      },
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Every iteration discards half of the remaining range.' },
      edgeCases: ['No rotation', 'Single element', 'Target at the pivot'],
      mistakes: ['Using < instead of <= in a[lo] <= a[mid]', 'Duplicates break the "one half is sorted" test (needs extra handling)'],
      tryIt: 'Find the index of the minimum element (the rotation point) with a similar loop comparing a[mid] with a[hi].',
    },
    complexityNotes: 'Binary search on the answer costs O(log(range)) feasibility checks; with an O(n) check the total is O(n log range). Rotated search stays O(log n).',
    quiz: [
      {
        prompt: 'What property must feasible(x) have for binary search on the answer?',
        options: ['It must be O(1)', 'Monotonicity: once true, it stays true for larger x (or the reverse)', 'x must be a power of two', 'The input must be sorted'],
        answer: 1,
        explanation: 'Binary search finds the boundary of a monotone predicate.',
      },
      {
        prompt: 'In a rotated sorted array with distinct values, a[lo] <= a[mid]. What can you conclude?',
        options: ['The right half is sorted', 'The left half [lo, mid] is sorted', 'The array is not rotated', 'mid is the pivot'],
        answer: 1,
        explanation: 'If the pivot were inside [lo, mid], a[lo] would be greater than a[mid].',
      },
      {
        prompt: 'Speeds range up to 10⁹ and n = 10⁵. Approximate cost of binary search on the answer with an O(n) check?',
        options: ['10⁵', '3·10⁶', '10¹⁴', '10⁹'],
        answer: 1,
        explanation: 'About 30 iterations × 10⁵ = 3·10⁶ operations.',
      },
    ],
    optimize: {
      prompt: 'A brute force tries every speed 1, 2, 3, … until one works. What does binary search exploit to skip most speeds?',
      options: ['Sorted pages', 'Monotone feasibility: one failed check rules out all smaller speeds, one success rules out all larger ones', 'Hashing', 'Memoised hours'],
      answer: 1,
      explanation: 'Each check discards half the remaining candidate range.',
    },
    recap: 'When answers are ordered and feasibility is monotone, binary search the answer with a greedy check. In rotated arrays, one half around mid is always sorted — use it to decide direction.',
    nextPrep: 'Tomorrow: sorting with custom comparators. Think about which order makes a greedy scan obvious.',
  },
  questions: [
    {
      id: 'd08-search-rotated',
      day: 8,
      title: 'Find in a Rotated Schedule',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['monotonic-predicate', 'binary-search'],
      objective: 'Search a rotated sorted array in O(log n).',
      statement: 'A sorted list of distinct timestamps was rotated. Print the index of target, or -1.',
      constraints: ['1 ≤ n ≤ 10⁵', 'Distinct values'],
      examples: [{ input: 'a = [4, 5, 6, 7, 0, 1, 2], target = 0', output: '4' }],
      edgeCases: ['Not rotated', 'Single element'],
      cues: ['Rotated sorted + O(log n) → find the sorted half at each step'],
      hints: ['One of [lo, mid] and [mid, hi] is sorted.', 'Check whether the target lies in the sorted half.'],
      approach: 'Modified binary search (see Example B).',
      correctness: 'The sorted half can be tested by its endpoints; otherwise the target can only be in the other half.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Halving per iteration.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int searchRotated(const vector<int>& a, int t) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[lo] <= a[mid]) {
            if (a[lo] <= t && t < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (a[mid] < t && t <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << searchRotated(a, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n integers. Output: index or -1.',
      keyLines: [{ match: 'if (a[lo] <= a[mid]) {', note: 'Left half sorted.' }],
      mistakes: ['Strict < in the sorted-half test'],
      tests: [
        { in: '7 0\n4 5 6 7 0 1 2', out: '4' },
        { in: '7 3\n4 5 6 7 0 1 2', out: '-1' },
        { in: '1 1\n1', out: '0' },
        { in: '5 5\n5 1 2 3 4', out: '0' },
      ],
      viz: 'binary-search',
    },
    {
      id: 'd08-min-rotated',
      day: 8,
      title: 'Earliest Timestamp After Rotation',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['monotonic-predicate'],
      objective: 'Find the rotation point as the boundary of a predicate.',
      statement: 'Print the minimum element of a rotated sorted array of distinct integers.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [3, 4, 5, 1, 2]', output: '1' }],
      edgeCases: ['No rotation', 'n = 1', 'n = 2'],
      cues: ['a[i] <= a[n − 1] is false…false true…true → first true is the minimum'],
      hints: ['Compare a[mid] with a[hi].', 'If a[mid] > a[hi], the minimum is to the right of mid.', 'Otherwise mid could be the minimum.'],
      approach: 'lo < hi loop: if a[mid] > a[hi] then lo = mid + 1 else hi = mid.',
      correctness: 'The minimum is the first element of the second sorted run, the boundary of the predicate.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Binary search.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int findMin(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else hi = mid;
    }
    return a[lo];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << findMin(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the minimum.',
      keyLines: [{ match: 'if (a[mid] > a[hi]) lo = mid + 1;', note: 'mid is in the first (larger) run.' }],
      mistakes: ['Comparing with a[lo] (ambiguous when not rotated)'],
      tests: [
        { in: '5\n3 4 5 1 2', out: '1' },
        { in: '4\n11 13 15 17', out: '11' },
        { in: '1\n7', out: '7' },
        { in: '2\n2 1', out: '1' },
      ],
    },
    {
      id: 'd08-ship-capacity',
      day: 8,
      title: 'Smallest Truck Capacity',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['binary-search-answer'],
      objective: 'Binary search capacity with a greedy loading check.',
      statement: 'Packages must be shipped in the given order within d days. Each day a truck loads consecutive packages without exceeding its capacity. Print the minimum capacity.',
      constraints: ['1 ≤ d ≤ n ≤ 5·10⁴', '1 ≤ weight ≤ 500'],
      examples: [{ input: 'w = [1,2,3,4,5,6,7,8,9,10], d = 5', output: '15' }],
      edgeCases: ['d = 1 → sum', 'd = n → max weight'],
      cues: ['"minimum capacity such that it fits in d days" → search the capacity'],
      hints: ['Capacity ≥ max(w) and ≤ sum(w).', 'Greedy check: fill each day until the next package does not fit.'],
      approach: 'Binary search capacity in [max, sum]; feasible if greedy needs ≤ d days.',
      correctness: 'Greedy packing minimises days for a fixed capacity, and more capacity never needs more days.',
      complexity: { time: 'O(n log(sum))', space: 'O(1)', why: 'log(sum) checks of O(n).' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int daysNeeded(const vector<int>& w, long long cap) {
    int days = 1;
    long long load = 0;
    for (int x : w) {
        if (load + x > cap) {
            days++;
            load = 0;
        }
        load += x;
    }
    return days;
}

long long minCapacity(const vector<int>& w, int d) {
    long long lo = *max_element(w.begin(), w.end());
    long long hi = accumulate(w.begin(), w.end(), 0LL);
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (daysNeeded(w, mid) <= d) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, d;
    cin >> n >> d;
    vector<int> w(n);
    for (auto& x : w) cin >> x;
    cout << minCapacity(w, d) << "\n";
    return 0;
}`,
      io: 'Input: n d, then n weights. Output: minimum capacity.',
      keyLines: [{ match: 'long long lo = *max_element(w.begin(), w.end());', note: 'Any smaller capacity cannot carry the heaviest package.' }],
      mistakes: ['lo = 1: the greedy check would never finish a too-heavy package'],
      tests: [
        { in: '10 5\n1 2 3 4 5 6 7 8 9 10', out: '15' },
        { in: '6 3\n3 2 2 4 1 4', out: '6' },
        { in: '5 4\n1 2 3 1 1', out: '3' },
        { in: '3 1\n5 5 5', out: '15' },
      ],
    },
    {
      id: 'd08-aggressive-cows',
      day: 8,
      title: 'Spread the Sensors',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['binary-search-answer', 'custom-sort'],
      objective: 'Maximise a minimum distance with a greedy placement check.',
      statement: 'Place k sensors at k of the n given positions so the minimum distance between any two sensors is as large as possible. Print that distance.',
      constraints: ['2 ≤ k ≤ n ≤ 10⁵', '0 ≤ position ≤ 10⁹'],
      examples: [{ input: 'positions = [1, 2, 8, 4, 9], k = 3', output: '3', explanation: 'Use 1, 4 and 8 (or 9).' }],
      edgeCases: ['k = 2 → max − min', 'Duplicate positions'],
      cues: ['"maximise the minimum" → binary search the distance (feasibility is monotone decreasing)'],
      hints: ['Sort positions.', 'For distance D, greedily place a sensor whenever the gap from the last one is ≥ D.', 'Find the largest D for which at least k sensors fit.'],
      approach: 'Sort; binary search the largest feasible D in [0, max − min].',
      correctness: 'Greedy leftmost placement fits the most sensors for a fixed D; if D fits, every smaller D fits too.',
      complexity: { time: 'O(n log n + n log(range))', space: 'O(1)', why: 'Sort plus log(range) greedy checks.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

bool canPlace(const vector<long long>& p, int k, long long d) {
    int placed = 1;
    long long last = p[0];
    for (size_t i = 1; i < p.size(); i++) {
        if (p[i] - last >= d) {
            placed++;
            last = p[i];
        }
    }
    return placed >= k;
}

long long maxMinDistance(vector<long long> p, int k) {
    sort(p.begin(), p.end());
    long long lo = 0, hi = p.back() - p.front();
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;  // round up: we search the LAST true
        if (canPlace(p, k, mid)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<long long> p(n);
    for (auto& x : p) cin >> x;
    cout << maxMinDistance(p, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n positions. Output: largest minimum distance.',
      keyLines: [{ match: 'long long mid = lo + (hi - lo + 1) / 2;', note: 'When searching the last true with lo = mid, round mid up or the loop can stall.' }],
      mistakes: ['Rounding mid down with lo = mid (infinite loop)'],
      tests: [
        { in: '5 3\n1 2 8 4 9', out: '3' },
        { in: '2 2\n0 1000000000', out: '1000000000' },
        { in: '4 4\n5 5 5 5', out: '0' },
        { in: '6 3\n1 2 3 4 5 6', out: '2' },
      ],
    },
    {
      id: 'd08-reading-speed',
      day: 8,
      title: 'Bookworm Speed Limit',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['binary-search-answer'],
      objective: 'Apply the Example A template to new input.',
      statement: 'Books have p[i] pages; each hour you read at most x pages of one book. Print the minimum integer x to finish within h hours.',
      constraints: ['1 ≤ n ≤ 10⁴', 'n ≤ h ≤ 10⁹', '1 ≤ p[i] ≤ 10⁹'],
      examples: [{ input: 'p = [30, 11, 23, 4, 20], h = 5', output: '30' }],
      edgeCases: ['h = n → max(p)', 'Huge page counts (64-bit hours)'],
      cues: ['Minimum speed, monotone hours → binary search on the answer'],
      hints: ['Hours at speed x = Σ ceil(p / x).', 'Search x in [1, max(p)].'],
      approach: 'Half-open binary search with the hours check.',
      correctness: 'Hours are non-increasing in x.',
      complexity: { time: 'O(n log(max p))', space: 'O(1)', why: 'About 30 checks of O(n).' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long minSpeed(const vector<long long>& p, long long h) {
    long long lo = 1, hi = *max_element(p.begin(), p.end());
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2, hours = 0;
        for (long long x : p) hours += (x + mid - 1) / mid;
        if (hours <= h) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n;
    long long h;
    cin >> n >> h;
    vector<long long> p(n);
    for (auto& x : p) cin >> x;
    cout << minSpeed(p, h) << "\n";
    return 0;
}`,
      io: 'Input: n h, then n page counts. Output: minimum speed.',
      keyLines: [{ match: 'for (long long x : p) hours += (x + mid - 1) / mid;', note: 'Ceiling division in 64-bit.' }],
      mistakes: ['int hours overflowing'],
      tests: [
        { in: '5 5\n30 11 23 4 20', out: '30' },
        { in: '5 6\n30 11 23 4 20', out: '23' },
        { in: '4 8\n3 6 7 11', out: '4' },
        { in: '1 1000000000\n1000000000', out: '1' },
      ],
    },
    {
      id: 'd08-bouquets',
      day: 8,
      title: 'Earliest Day for Bouquets',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['binary-search-answer'],
      objective: 'Binary search over days with a consecutive-run check.',
      statement: 'Flower i blooms on day bloom[i]. A bouquet needs k adjacent bloomed flowers. Print the minimum day to make m bouquets, or -1 if impossible.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ m, k ≤ 10⁶', '1 ≤ bloom[i] ≤ 10⁹'],
      examples: [{ input: 'bloom = [1, 10, 3, 10, 2], m = 3, k = 1', output: '3' }],
      edgeCases: ['m·k > n → -1 (beware overflow of m·k)', 'All bloom on the same day'],
      cues: ['If day D works, any later day works → binary search the day'],
      hints: ['Impossible exactly when m·k > n.', 'For a day D, scan and count runs of bloomed flowers of length k.'],
      approach: 'Binary search D in [min, max] of bloom days with a run-counting check.',
      correctness: 'More bloomed flowers can only create more bouquets.',
      complexity: { time: 'O(n log(max bloom))', space: 'O(1)', why: 'log range × linear scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

bool canMake(const vector<int>& b, long long day, long long m, int k) {
    long long bouquets = 0;
    int run = 0;
    for (int x : b) {
        run = (x <= day) ? run + 1 : 0;
        if (run == k) {
            bouquets++;
            run = 0;
        }
    }
    return bouquets >= m;
}

long long minDays(const vector<int>& b, long long m, int k) {
    if (m * k > (long long)b.size()) return -1;
    long long lo = *min_element(b.begin(), b.end()), hi = *max_element(b.begin(), b.end());
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (canMake(b, mid, m, k)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, k;
    long long m;
    cin >> n >> m >> k;
    vector<int> b(n);
    for (auto& x : b) cin >> x;
    cout << minDays(b, m, k) << "\n";
    return 0;
}`,
      io: 'Input: n m k, then n bloom days. Output: minimum day or -1.',
      keyLines: [{ match: 'if (m * k > (long long)b.size()) return -1;', note: 'm and k are up to 10⁶, so m·k needs 64 bits.' }],
      mistakes: ['Not resetting run after making a bouquet'],
      tests: [
        { in: '5 3 1\n1 10 3 10 2', out: '3' },
        { in: '5 3 2\n1 10 3 10 2', out: '-1' },
        { in: '7 2 3\n7 7 7 7 12 7 7', out: '12' },
        { in: '2 1 1\n1000000000 1000000000', out: '1000000000' },
      ],
    },
    {
      id: 'd08-split-array',
      day: 8,
      title: 'Balanced Workload Split',
      difficulty: 'Hard',
      topic: 'binary-search',
      patterns: ['binary-search-answer'],
      objective: 'Minimise the largest part sum by searching the limit.',
      statement: 'Split an array of non-negative integers into exactly k non-empty contiguous parts to minimise the largest part sum. Print that minimum.',
      constraints: ['1 ≤ k ≤ n ≤ 1000', '0 ≤ a[i] ≤ 10⁶'],
      examples: [{ input: 'a = [7, 2, 5, 10, 8], k = 2', output: '18' }],
      edgeCases: ['k = n → max element', 'k = 1 → total sum', 'Zeros'],
      cues: ['Minimise the maximum → binary search the maximum allowed sum'],
      hints: ['For a limit L, greedily count the parts needed.', 'If parts ≤ k, L is feasible (extra cuts never increase the maximum).'],
      approach: 'Binary search L in [max, sum] with the greedy part counter.',
      correctness: 'Greedy produces the fewest parts under limit L; feasibility is monotone in L.',
      complexity: { time: 'O(n log(sum))', space: 'O(1)', why: 'log(sum) greedy passes.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int partsNeeded(const vector<long long>& a, long long limit) {
    int parts = 1;
    long long cur = 0;
    for (long long x : a) {
        if (cur + x > limit) {
            parts++;
            cur = 0;
        }
        cur += x;
    }
    return parts;
}

long long splitArray(const vector<long long>& a, int k) {
    long long lo = *max_element(a.begin(), a.end()), hi = accumulate(a.begin(), a.end(), 0LL);
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (partsNeeded(a, mid) <= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << splitArray(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: minimal largest part sum.',
      keyLines: [{ match: 'if (partsNeeded(a, mid) <= k) hi = mid;', note: 'Fewer parts than k can always be split further without exceeding the limit.' }],
      mistakes: ['Requiring parts == k exactly in the check'],
      tests: [
        { in: '5 2\n7 2 5 10 8', out: '18' },
        { in: '5 2\n1 2 3 4 5', out: '9' },
        { in: '3 3\n1 4 4', out: '4' },
        { in: '4 1\n0 0 0 5', out: '5' },
      ],
    },
    {
      id: 'd08-kth-in-table',
      day: 8,
      title: 'K-th Number in a Times Table',
      difficulty: 'Hard',
      topic: 'binary-search',
      patterns: ['binary-search-answer', 'monotonic-predicate'],
      objective: 'Binary search a value using a counting function instead of materialising data.',
      statement: 'The m × n multiplication table has entry i·j at row i, column j (1-based). Print the k-th smallest entry.',
      constraints: ['1 ≤ m, n ≤ 3·10⁴', '1 ≤ k ≤ m·n'],
      examples: [{ input: 'm = 3, n = 3, k = 5', output: '3', explanation: '1, 2, 2, 3, 3, 4, 6, 6, 9' }],
      edgeCases: ['k = 1', 'k = m·n'],
      cues: ['Too many values to sort, but "how many ≤ x" is easy → search x'],
      hints: ['Row i contains min(x / i, n) values ≤ x.', 'Find the smallest x with count(x) ≥ k.'],
      approach: 'Binary search x in [1, m·n] with count(x) = Σ min(x / i, n).',
      correctness: 'count is non-decreasing; the smallest x with count ≥ k is an actual table value.',
      complexity: { time: 'O(m log(m·n))', space: 'O(1)', why: 'O(m) count per step.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
using namespace std;

long long countAtMost(long long x, long long m, long long n) {
    long long c = 0;
    for (long long i = 1; i <= m; i++) c += min(x / i, n);
    return c;
}

long long kthInTable(long long m, long long n, long long k) {
    long long lo = 1, hi = m * n;
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (countAtMost(mid, m, n) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    long long m, n, k;
    cin >> m >> n >> k;
    cout << kthInTable(m, n, k) << "\n";
    return 0;
}`,
      io: 'Input: m n k. Output: the k-th smallest entry.',
      keyLines: [{ match: 'for (long long i = 1; i <= m; i++) c += min(x / i, n);', note: 'Row i holds i, 2i, …, ni; floor(x / i) of them are ≤ x.' }],
      mistakes: ['Building the whole table (up to 9·10⁸ entries)'],
      tests: [
        { in: '3 3 5', out: '3' },
        { in: '2 3 6', out: '6' },
        { in: '1 1 1', out: '1' },
        { in: '4 5 10', out: '6' },
      ],
    },
  ],
};

export default day;
