import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 7,
    title: 'Binary Search and Boundaries',
    zone: 'binary-search',
    objectives: [
      'Implement exact binary search with a closed [lo, hi] range',
      'Implement lower and upper bound with a half-open [lo, hi) range',
      'Avoid overflow and infinite loops in the midpoint update',
      'Use std::lower_bound / std::upper_bound and interpret their results',
    ],
    prerequisites: ['Day 1: Big-O and O(log n)', 'Day 4: loop invariants'],
    lesson: [
      {
        heading: 'Halving the search space',
        body: 'In a sorted array, comparing the target with the middle element tells you which half cannot contain it. After k comparisons only n/2ᵏ candidates remain, so ⌈log₂(n + 1)⌉ comparisons suffice — 20 for a million elements.',
      },
      {
        heading: 'Pick a convention and stay consistent',
        body: '- **Closed** `[lo, hi]`: start `hi = n − 1`, loop `while (lo <= hi)`, update `lo = mid + 1` / `hi = mid − 1`.\n- **Half-open** `[lo, hi)`: start `hi = n`, loop `while (lo < hi)`, update `lo = mid + 1` / `hi = mid`.\nMixing them causes infinite loops or skipped elements.',
      },
      {
        heading: 'Computing mid safely',
        body: '`(lo + hi) / 2` can overflow when lo and hi are near INT_MAX. Write `lo + (hi − lo) / 2`. With the half-open convention, mid is always < hi, so `hi = mid` makes progress.',
      },
      {
        heading: 'Boundaries: lower and upper bound',
        body: '`lower_bound` = first index with `a[i] >= x`; `upper_bound` = first index with `a[i] > x`. Their difference counts copies of x, and lower_bound is also the insertion position that keeps the array sorted. In the STL both take iterators and return an iterator; subtract `a.begin()` to get an index.',
      },
      {
        heading: 'Binary search is about predicates',
        body: 'Think of a predicate `P(i)` that is false…false true…true across the array (e.g. `a[i] >= x`). Binary search finds the first true. This view generalises to rotated arrays and "search on the answer" tomorrow.',
      },
    ],
    recognition: [
      'Sorted data + "find", "first", "last", "count", "insert position" → binary search.',
      'Required O(log n) → binary search (or a tree).',
      'A yes/no condition that flips exactly once along the index → search for the boundary.',
    ],
    patterns: ['binary-search', 'lower-upper-bound', 'monotonic-predicate', 'invariant-reasoning'],
    visualizations: ['binary-search'],
    exampleA: {
      id: 'd07-A',
      title: 'Exact binary search (closed interval)',
      goal: 'Find the index of a target in a sorted array or report that it is absent.',
      input: 'a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91}, target = 23',
      output: 'found 23 at index 5',
      idea: 'Keep the invariant "if the target exists, it is in [lo, hi]". Each comparison with a[mid] removes mid and one whole half.',
      code: TRACE_CODE['binary-search'],
      keyLines: [
        { match: 'int lo = 0, hi = (int)a.size() - 1;', note: 'Closed interval: hi is the last valid index.' },
        { match: 'while (lo <= hi) {', note: 'lo == hi is still a one-element range that must be checked.' },
        { match: 'int mid = lo + (hi - lo) / 2;', note: 'Overflow-safe midpoint.' },
        { match: 'if (a[mid] < target) lo = mid + 1;', note: 'mid itself is excluded because a[mid] ≠ target.' },
      ],
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'The range halves every iteration; only three indices are stored.' },
      edgeCases: ['Empty array: hi = −1, loop does not run', 'Target smaller than all / larger than all', 'Duplicates: returns some matching index, not necessarily the first'],
      mistakes: ['while (lo < hi) with hi = n − 1 skips the last candidate', 'lo = mid (instead of mid + 1) can loop forever'],
      tryIt: 'Return the insertion position when the target is absent (hint: it is lo after the loop).',
      trace: { id: 'binary-search', input: { a: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 } },
      bug: {
        find: 'if (a[mid] < target) lo = mid + 1;',
        replace: 'if (a[mid] < target) lo = mid;',
        symptom: 'The program never finishes: once lo = 4 and hi = 5, mid stays 4 forever.',
        explanation: 'With lo = mid the range [lo, hi] may stop shrinking: when hi = lo + 1, mid = lo and nothing changes. Excluding mid with mid + 1 guarantees progress.',
      },
    },
    exampleB: {
      id: 'd07-B',
      kind: 'variant',
      title: 'Lower bound and counting duplicates',
      goal: 'Find the first index whose value is ≥ target and count how many times target occurs.',
      input: 'a = {1, 2, 2, 2, 5, 7}, target = 2',
      output: 'first index with a[i] >= 2: 1\ncount of 2: 3',
      idea: 'Search the boundary of the predicate a[i] >= target with a half-open range. When a[mid] ≥ target, mid might be the answer, so keep it (hi = mid).',
      code: TRACE_CODE['lower-bound'],
      keyLines: [
        { match: 'int lo = 0, hi = (int)a.size();', note: 'Half-open [lo, hi): hi = n stands for "no such element".' },
        { match: 'while (lo < hi) {', note: 'Stop when the range is empty: lo == hi is the answer.' },
        { match: 'else hi = mid;', note: 'Keep mid as a candidate — it satisfies the predicate.' },
        { match: 'int after = upper_bound(a.begin(), a.end(), target) - a.begin();', note: 'STL upper_bound: first element > target. Iterator − begin() = index.' },
      ],
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Two independent binary searches.' },
      edgeCases: ['Target larger than everything → n', 'Target smaller than everything → 0', 'Target absent → count 0'],
      mistakes: ['hi = mid − 1 in the half-open version skips the answer', 'Forgetting that lower_bound may return end()'],
      tryIt: 'Write upperBound yourself by changing a single comparison.',
      trace: { id: 'lower-bound', input: { a: [1, 2, 2, 2, 5, 7], target: 2 } },
      bug: {
        find: 'else hi = mid;',
        replace: 'else hi = mid - 1;',
        symptom: 'The program prints "first index with a[i] >= 2: 0" — index 0 holds 1, which is smaller than 2.',
        explanation: 'In the half-open convention hi is exclusive, so hi = mid − 1 throws away mid, which may be the first valid position.',
      },
    },
    complexityNotes: 'Every variant here is O(log n) time and O(1) space. Counting occurrences with two bounds is O(log n) instead of O(n) scanning.',
    quiz: [
      {
        prompt: 'Why is lo + (hi − lo) / 2 preferred over (lo + hi) / 2?',
        options: ['It is faster', 'lo + hi can overflow int', 'It rounds up', 'It works for unsorted arrays'],
        answer: 1,
        explanation: 'When lo and hi are both large, their sum can exceed INT_MAX.',
      },
      {
        prompt: 'For a = {1, 3, 3, 3, 8}, what are lower_bound(3) and upper_bound(3) as indices?',
        options: ['1 and 3', '1 and 4', '0 and 4', '2 and 4'],
        answer: 1,
        explanation: 'First ≥ 3 is index 1; first > 3 is index 4 (value 8). Count = 3.',
      },
      {
        prompt: 'In a half-open search [lo, hi), which update is correct when a[mid] ≥ target (finding lower bound)?',
        options: ['hi = mid − 1', 'hi = mid', 'lo = mid', 'lo = mid + 1'],
        answer: 1,
        explanation: 'mid satisfies the predicate and may be the first such index.',
      },
    ],
    recap: 'Binary search maintains an interval that must contain the answer and halves it each step. Choose closed or half-open bounds deliberately; lower/upper bound find boundaries and count duplicates in O(log n).',
    nextPrep: 'Tomorrow: binary search on the answer — the same boundary search, but over possible answers instead of array indices.',
  },
  questions: [
    {
      id: 'd07-search-insert',
      day: 7,
      title: 'Insert Position',
      difficulty: 'Easy',
      topic: 'binary-search',
      patterns: ['lower-upper-bound'],
      objective: 'Return lower_bound as the insertion index.',
      statement: 'Given a sorted array of distinct integers and a target, print the index of the target if present, otherwise the index where it would be inserted to keep the order.',
      constraints: ['1 ≤ n ≤ 10⁵', 'Distinct sorted values'],
      examples: [{ input: 'a = [1, 3, 5, 6], target = 2', output: '1' }],
      edgeCases: ['Insert at 0', 'Insert at n'],
      cues: ['Insert position in sorted array → lower bound'],
      hints: ['You want the first index with a[i] ≥ target.', 'Use a half-open search returning lo.'],
      approach: 'Half-open lower bound.',
      correctness: 'All indices < lo hold values < target; lo is the first position not smaller than target.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Binary search.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int searchInsert(const vector<int>& a, int target) {
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << searchInsert(a, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n sorted integers. Output: index.',
      keyLines: [{ match: 'return lo;', note: 'lo == hi at exit: the boundary.' }],
      mistakes: ['Returning -1 when not found'],
      tests: [
        { in: '4 2\n1 3 5 6', out: '1' },
        { in: '4 7\n1 3 5 6', out: '4' },
        { in: '4 0\n1 3 5 6', out: '0' },
        { in: '4 5\n1 3 5 6', out: '2' },
      ],
      viz: 'binary-search',
    },
    {
      id: 'd07-sqrt-floor',
      day: 7,
      title: 'Integer Square Root',
      difficulty: 'Easy',
      topic: 'binary-search',
      patterns: ['binary-search', 'monotonic-predicate'],
      objective: 'Binary search over a numeric range with overflow-safe checks.',
      statement: 'Print ⌊√x⌋ for a non-negative integer x without using sqrt.',
      constraints: ['0 ≤ x ≤ 2³¹ − 1'],
      examples: [{ input: 'x = 8', output: '2' }],
      edgeCases: ['x = 0', 'x = 1', 'Perfect squares', 'x = 2³¹ − 1'],
      cues: ['Largest m with m² ≤ x — the predicate m² ≤ x is true…true false…false'],
      hints: ['Search m in [0, x].', 'Compare m * m with x using 64-bit arithmetic.', 'Keep the largest m that satisfies the predicate.'],
      approach: 'Closed search; when mid² ≤ x record mid and go right, else go left.',
      correctness: 'The predicate is monotone in m, so the last true is ⌊√x⌋.',
      complexity: { time: 'O(log x)', space: 'O(1)', why: 'About 31 iterations.' },
      cpp: cpp`
#include <iostream>
using namespace std;

long long isqrt(long long x) {
    long long lo = 0, hi = x, ans = 0;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        if (mid * mid <= x) {
            ans = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return ans;
}`,
      main: cpp`
int main() {
    long long x;
    cin >> x;
    cout << isqrt(x) << "\n";
    return 0;
}`,
      io: 'Input: x. Output: floor of the square root.',
      keyLines: [{ match: 'if (mid * mid <= x) {', note: 'long long prevents overflow of mid * mid.' }],
      mistakes: ['int overflow in mid * mid', 'Using floating-point sqrt and rounding errors'],
      tests: [
        { in: '8', out: '2' },
        { in: '0', out: '0' },
        { in: '16', out: '4' },
        { in: '2147483647', out: '46340' },
      ],
    },
    {
      id: 'd07-count-occurrences',
      day: 7,
      title: 'How Many Copies?',
      difficulty: 'Easy',
      topic: 'binary-search',
      patterns: ['lower-upper-bound'],
      objective: 'Answer many count queries with STL bounds.',
      statement: 'Given a sorted array and q queries, print how many times each queried value appears.',
      constraints: ['1 ≤ n, q ≤ 10⁵'],
      examples: [{ input: 'a = [1, 2, 2, 2, 3], queries = [2, 4]', output: '3\n0' }],
      edgeCases: ['Value absent', 'All elements equal'],
      cues: ['Count of x in sorted data → upper_bound − lower_bound'],
      hints: ['lower_bound gives the first copy.', 'upper_bound gives one past the last copy.'],
      approach: 'equal_range or upper_bound − lower_bound per query.',
      correctness: 'Copies of x occupy exactly [lower_bound(x), upper_bound(x)).',
      complexity: { time: 'O((n + q) log n)', space: 'O(1) extra', why: 'Two binary searches per query.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int countOf(const vector<int>& a, int x) {
    auto range = equal_range(a.begin(), a.end(), x);
    return range.second - range.first;
}`,
      main: cpp`
int main() {
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    while (q--) {
        int x;
        cin >> x;
        cout << countOf(a, x) << "\n";
    }
    return 0;
}`,
      io: 'Input: n q, n sorted values, then q values. Output: one count per line.',
      keyLines: [{ match: 'auto range = equal_range(a.begin(), a.end(), x);', note: 'equal_range returns {lower_bound, upper_bound} in one call.' }],
      mistakes: ['Linear scan per query (O(n·q))'],
      tests: [
        { in: '5 2\n1 2 2 2 3\n2 4', out: '3\n0' },
        { in: '3 1\n7 7 7\n7', out: '3' },
        { in: '1 2\n5\n4 5', out: '0\n1' },
        { in: '6 3\n1 1 2 3 3 3\n1 3 0', out: '2\n3\n0' },
      ],
    },
    {
      id: 'd07-first-last',
      day: 7,
      title: 'First and Last Appearance',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['lower-upper-bound', 'monotonic-predicate'],
      objective: 'Write both boundary searches by hand.',
      statement: 'Given a sorted array and a target, print the first and last index of the target, or "-1 -1" if it is absent.',
      constraints: ['0 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [5, 7, 7, 8, 8, 10], target = 8', output: '3 4' }],
      edgeCases: ['Empty array', 'Single match', 'Target at both ends'],
      cues: ['Boundaries of a block of equal values → two predicates (≥ x and > x)'],
      hints: ['first = lower_bound(target).', 'last = upper_bound(target) − 1.', 'If first == n or a[first] != target, it is absent.'],
      approach: 'One generic helper firstIndex(pred) used for "≥ target" and "> target".',
      correctness: 'Both predicates are monotone over the sorted array.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Two binary searches.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

// First index i with a[i] >= x (strict = false) or a[i] > x (strict = true).
int boundary(const vector<int>& a, int x, bool strict) {
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        bool goRight = strict ? a[mid] <= x : a[mid] < x;
        if (goRight) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    int first = boundary(a, t, false);
    if (first == n || a[first] != t) cout << "-1 -1\n";
    else cout << first << " " << boundary(a, t, true) - 1 << "\n";
    return 0;
}`,
      io: 'Input: n target, then n sorted integers. Output: first and last index.',
      keyLines: [{ match: 'bool goRight = strict ? a[mid] <= x : a[mid] < x;', note: 'The only difference between lower and upper bound.' }],
      mistakes: ['Reading a[first] when first == n'],
      tests: [
        { in: '6 8\n5 7 7 8 8 10', out: '3 4' },
        { in: '6 6\n5 7 7 8 8 10', out: '-1 -1' },
        { in: '0 1', out: '-1 -1' },
        { in: '3 2\n2 2 2', out: '0 2' },
      ],
    },
    {
      id: 'd07-peak',
      day: 7,
      title: 'Find a Mountain Peak',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['monotonic-predicate', 'binary-search'],
      objective: 'Binary search on an unsorted array using a local slope predicate.',
      statement: 'Adjacent elements are distinct. A peak is an element strictly greater than its neighbours (out-of-range neighbours count as −∞). For this task the array strictly increases and then strictly decreases (it may be only increasing or only decreasing). Print the peak index.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [1, 3, 5, 4, 2]', output: '2' }],
      edgeCases: ['Peak at index 0', 'Peak at index n − 1', 'n = 1'],
      cues: ['Predicate "a[i] > a[i + 1]" is false…false true…true on a mountain'],
      hints: ['Compare a[mid] with a[mid + 1].', 'If it is increasing at mid, the peak is to the right.', 'Otherwise mid could be the peak — keep it.'],
      approach: 'Half-open style on [0, n − 1]: if a[mid] < a[mid + 1] then lo = mid + 1 else hi = mid.',
      correctness: 'The first index where the array starts descending is the peak.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Binary search over indices.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int peakIndex(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << peakIndex(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: peak index.',
      keyLines: [{ match: 'if (a[mid] < a[mid + 1]) lo = mid + 1;', note: 'mid < hi guarantees mid + 1 is a valid index.' }],
      mistakes: ['Accessing a[mid + 1] when mid could equal n − 1'],
      tests: [
        { in: '5\n1 3 5 4 2', out: '2' },
        { in: '1\n7', out: '0' },
        { in: '4\n9 7 3 1', out: '0' },
        { in: '4\n1 2 3 4', out: '3' },
      ],
    },
    {
      id: 'd07-search-matrix',
      day: 7,
      title: 'Search a Sorted Grid',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['binary-search'],
      objective: 'Treat a row-major sorted matrix as one virtual array.',
      statement: 'Each row of an R×C matrix is sorted and the first value of each row is larger than the last value of the previous row. Print `true` if target is present.',
      constraints: ['1 ≤ R, C ≤ 1000'],
      examples: [{ input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' }],
      edgeCases: ['Single row', 'Single column', 'Target outside the range'],
      cues: ['Matrix that is sorted when read row by row → index mapping i → (i / C, i % C)'],
      hints: ['Read the matrix as an array of length R·C.', 'Element i is at row i / C, column i % C.'],
      approach: 'Closed binary search over [0, R·C − 1] with index mapping.',
      correctness: 'The row-major sequence is fully sorted under the given conditions.',
      complexity: { time: 'O(log(R·C))', space: 'O(1)', why: 'One binary search.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

bool searchMatrix(const vector<vector<int>>& m, int target) {
    int R = m.size(), C = m[0].size();
    int lo = 0, hi = R * C - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int v = m[mid / C][mid % C];
        if (v == target) return true;
        if (v < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
}`,
      main: cpp`
int main() {
    int R, C, t;
    cin >> R >> C >> t;
    vector<vector<int>> m(R, vector<int>(C));
    for (auto& row : m)
        for (auto& x : row) cin >> x;
    cout << (searchMatrix(m, t) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: R C target, then the matrix. Output: true or false.',
      keyLines: [{ match: 'int v = m[mid / C][mid % C];', note: 'Map a flat index back to (row, column).' }],
      mistakes: ['Using R instead of C in the mapping'],
      tests: [
        { in: '3 4 3\n1 3 5 7\n10 11 16 20\n23 30 34 60', out: 'true' },
        { in: '3 4 13\n1 3 5 7\n10 11 16 20\n23 30 34 60', out: 'false' },
        { in: '1 1 5\n5', out: 'true' },
        { in: '2 1 4\n1\n3', out: 'false' },
      ],
    },
    {
      id: 'd07-kth-missing',
      day: 7,
      title: 'The K-th Skipped Number',
      difficulty: 'Medium',
      topic: 'binary-search',
      patterns: ['monotonic-predicate', 'binary-search'],
      objective: 'Binary search on a derived monotone quantity.',
      statement: 'A strictly increasing array of positive integers skips some numbers. Print the k-th positive integer missing from it.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ a[i] ≤ 10⁹', '1 ≤ k ≤ 10⁹'],
      examples: [{ input: 'a = [2, 3, 4, 7, 11], k = 5', output: '9', explanation: 'Missing: 1, 5, 6, 8, 9, …' }],
      edgeCases: ['Answer before a[0]', 'Answer after the last element'],
      cues: ['missing(i) = a[i] − (i + 1) is non-decreasing → search for the first i with missing(i) ≥ k'],
      hints: ['How many numbers are missing before a[i]? a[i] − (i + 1).', 'That count never decreases with i.', 'If lo elements are "before" the answer, the answer is k + lo.'],
      approach: 'lo = first index with a[i] − (i + 1) ≥ k; answer = lo + k.',
      correctness: 'Exactly lo array values are smaller than the answer, so the k-th missing value is k + lo.',
      complexity: { time: 'O(log n)', space: 'O(1)', why: 'Binary search over indices.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long kthMissing(const vector<long long>& a, long long k) {
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] - (mid + 1) < k) lo = mid + 1;
        else hi = mid;
    }
    return lo + k;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << kthMissing(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: the k-th missing positive.',
      keyLines: [{ match: 'if (a[mid] - (mid + 1) < k) lo = mid + 1;', note: 'Fewer than k numbers missing so far → answer is further right.' }],
      mistakes: ['Linear simulation (too slow for k = 10⁹)'],
      tests: [
        { in: '5 5\n2 3 4 7 11', out: '9' },
        { in: '4 2\n1 2 3 4', out: '6' },
        { in: '1 1\n5', out: '1' },
        { in: '3 1000000000\n1 2 3', out: '1000000003' },
      ],
    },
    {
      id: 'd07-median-two-arrays',
      day: 7,
      title: 'Median of Two Sorted Lists',
      difficulty: 'Hard',
      topic: 'binary-search',
      patterns: ['binary-search', 'monotonic-predicate'],
      objective: 'Binary search on a partition position.',
      statement: 'Given two sorted arrays (sizes n and m, n + m ≥ 1), print the median of their union with one decimal place.',
      constraints: ['0 ≤ n, m ≤ 10⁵', 'Required: O(log(min(n, m)))'],
      examples: [{ input: 'a = [1, 3], b = [2]', output: '2.0' }],
      edgeCases: ['One array empty', 'All of a smaller than b', 'Even total length'],
      cues: ['O(log) on two sorted arrays → partition the smaller one'],
      hints: ['Choose i elements from a and j = (n + m + 1)/2 − i from b for the left half.', 'The partition is valid when a[i−1] ≤ b[j] and b[j−1] ≤ a[i].', 'Binary search i in the smaller array; use ±∞ at the edges.'],
      brute: 'Merge both arrays: O(n + m).',
      approach: 'Binary search i ∈ [0, n] in the smaller array; adjust based on which cross-condition fails.',
      correctness: 'A valid partition puts exactly the (n+m+1)/2 smallest elements on the left; the median is derived from the boundary values.',
      complexity: { time: 'O(log(min(n, m)))', space: 'O(1)', why: 'Binary search over the shorter array.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

double medianOfTwo(const vector<long long>& A, const vector<long long>& B) {
    const vector<long long>& a = A.size() <= B.size() ? A : B;
    const vector<long long>& b = A.size() <= B.size() ? B : A;
    int n = a.size(), m = b.size(), half = (n + m + 1) / 2;
    int lo = 0, hi = n;
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2, j = half - i;
        long long aLeft = i ? a[i - 1] : LLONG_MIN, aRight = i < n ? a[i] : LLONG_MAX;
        long long bLeft = j ? b[j - 1] : LLONG_MIN, bRight = j < m ? b[j] : LLONG_MAX;
        if (aLeft > bRight) hi = i - 1;
        else if (bLeft > aRight) lo = i + 1;
        else {
            long long leftMax = max(aLeft, bLeft);
            if ((n + m) % 2) return leftMax;
            return (leftMax + min(aRight, bRight)) / 2.0;
        }
    }
    return 0.0;  // unreachable for valid input
}`,
      main: cpp`
#include <cstdio>
int main() {
    int n, m;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cin >> m;
    vector<long long> b(m);
    for (auto& x : b) cin >> x;
    printf("%.1f\n", medianOfTwo(a, b));
    return 0;
}`,
      io: 'Input: n, n values, m, m values. Output: the median with one decimal.',
      keyLines: [
        { match: 'int n = a.size(), m = b.size(), half = (n + m + 1) / 2;', note: 'The left half has one extra element when the total is odd.' },
        { match: 'if (aLeft > bRight) hi = i - 1;', note: 'Took too many from a — move the partition left.' },
      ],
      mistakes: ['Searching the larger array (j can go negative)', 'Integer division when averaging'],
      tests: [
        { in: '2\n1 3\n1\n2', out: '2.0' },
        { in: '2\n1 2\n2\n3 4', out: '2.5' },
        { in: '0\n1\n5', out: '5.0' },
        { in: '3\n1 2 3\n3\n4 5 6', out: '3.5' },
      ],
    },
  ],
};

export default day;
