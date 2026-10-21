import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 3,
    title: 'Prefix Sums, Suffix Sums and Difference Arrays',
    zone: 'arrays-hashing',
    objectives: [
      'Build prefix sums and answer range-sum queries in O(1)',
      'Combine prefix sums with a hash map to count subarrays with a given sum',
      'Use suffix aggregates for "everything to the right" questions',
      'Apply many range updates at once with a difference array',
    ],
    prerequisites: ['Day 1: running aggregates', 'Day 2: hash maps for counting'],
    lesson: [
      {
        heading: 'Prefix sums: precompute once, query forever',
        body: 'Define `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + a[i]`. Then the sum of `a[l..r]` is `prefix[r + 1] − prefix[l]`. Building costs O(n); each query is O(1). The extra leading zero removes the special case for ranges that start at index 0.',
      },
      {
        heading: 'Subarray sum = difference of two prefixes',
        body: 'A subarray `a[l..r]` sums to k exactly when `prefix[r + 1] − prefix[l] = k`. Walking left to right, count how many earlier prefixes equal `current − k` using a hash map — this works with **negative numbers**, where a sliding window would fail.',
      },
      {
        heading: 'Suffix aggregates',
        body: 'Sometimes each position needs information about everything to its right: the largest value after i, the product of the rest. Build it with a right-to-left pass, or combine a left pass and a right pass into one output array to save memory.',
      },
      {
        heading: 'Difference arrays for batch range updates',
        body: 'To add v to every element in `[l, r]`, record `diff[l] += v` and `diff[r + 1] −= v`. After all updates, a single prefix-sum pass over `diff` produces the final values. Each update costs O(1) instead of O(r − l + 1). Allocate n + 1 slots so `r + 1` is always valid.',
      },
      {
        heading: '2D prefix sums',
        body: '`P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] − P[i][j]` (inclusion–exclusion). Any rectangle sum is then four lookups.',
      },
    ],
    recognition: [
      'Many range-sum queries on an array that does not change → prefix sums.',
      '"Number of subarrays with sum k / divisible by k" (negatives allowed) → prefix sums + hash map of counts.',
      '"For each i, something about the right side" → suffix pass.',
      'Many "add v to range" updates followed by reads → difference array.',
    ],
    patterns: ['prefix-sum', 'difference-array', 'suffix-sum', 'hash-lookup'],
    visualizations: ['prefix-sum'],
    exampleA: {
      id: 'd03-A',
      title: 'Build a prefix array and answer range queries',
      goal: 'Answer several range-sum queries on a fixed array in O(1) each.',
      input: 'a = {3, 1, 4, 1, 5, 9, 2}; queries (1,3), (0,6), (4,4)',
      output: 'sum[1..3] = 6\nsum[0..6] = 25\nsum[4..4] = 5',
      idea: 'prefix[i] holds the sum of the first i elements. A range sum is "everything up to r" minus "everything before l".',
      code: TRACE_CODE['prefix-sum'],
      keyLines: [
        { match: 'vector<long long> prefix(n + 1, 0);', note: 'n + 1 slots: prefix[0] is the empty sum. long long guards against overflow.' },
        { match: 'prefix[i + 1] = prefix[i] + a[i];', note: 'Each prefix extends the previous one by one element.' },
        { match: 'long long sum = prefix[r + 1] - prefix[l];', note: 'Inclusive range [l, r]: subtract the part before l.' },
        { match: 'for (auto [l, r] : queries)', note: 'C++17 structured bindings unpack each pair.' },
      ],
      complexity: { time: 'O(n + q)', space: 'O(n)', why: 'O(n) to build, O(1) for each of the q queries.' },
      edgeCases: ['Single-element range (l = r)', 'Range starting at 0 uses prefix[0] = 0', 'Out-of-range queries must be validated by the caller'],
      mistakes: ['prefix[r] − prefix[l] drops a[r]', 'Sizing prefix as n and writing prefix[n]'],
      tryIt: 'Add a query that returns the average of a[l..r] as a double.',
      trace: { id: 'prefix-sum', input: { a: [3, 1, 4, 1, 5, 9, 2], queries: [[1, 3], [0, 6], [4, 4]] } },
      bug: {
        find: 'long long sum = prefix[r + 1] - prefix[l];',
        replace: 'long long sum = prefix[r] - prefix[l];',
        symptom: 'The program prints sum[1..3] = 5, sum[0..6] = 23 and sum[4..4] = 0.',
        explanation: 'prefix[r] covers only a[0..r−1], so the last element of each range is missing. The inclusive range [l, r] needs prefix[r + 1].',
      },
    },
    exampleB: {
      id: 'd03-B',
      kind: 'variant',
      title: 'Difference array: many range additions',
      goal: 'Apply several "add v to [l, r]" updates, then print the final array.',
      input: 'n = 6; updates (0,2,+3), (1,4,+2), (3,5,−1)',
      output: '3 5 5 1 1 -1',
      idea: 'Instead of touching every element of each range, mark where an addition starts (+v) and where it stops (−v after r). A final running sum spreads each mark across its range.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 6;
    struct Update { int l, r, v; };
    vector<Update> updates = {{0, 2, 3}, {1, 4, 2}, {3, 5, -1}};
    vector<long long> diff(n + 1, 0);
    for (auto u : updates) {
        diff[u.l] += u.v;      // the addition starts here
        diff[u.r + 1] -= u.v;  // and stops after r
    }
    long long running = 0;
    for (int i = 0; i < n; i++) {
        running += diff[i];
        cout << running << (i + 1 < n ? " " : "\n");
    }
    return 0;
}`,
      keyLines: [
        { match: 'vector<long long> diff(n + 1, 0);', note: 'One extra slot so diff[r + 1] is valid even when r = n − 1.' },
        { match: 'diff[u.l] += u.v;', note: 'Every element from l onward receives +v during the final prefix pass…' },
        { match: 'diff[u.r + 1] -= u.v;', note: '…and this cancels it again from r + 1 onward.' },
        { match: 'running += diff[i];', note: 'The prefix sum of diff is the final value at i.' },
      ],
      dryRun: {
        columns: ['i', 'diff[i]', 'running (= value)'],
        rows: [
          ['0', '+3', '3'],
          ['1', '+2', '5'],
          ['2', '0', '5'],
          ['3', '−3 −1 = −4', '1'],
          ['4', '0', '1'],
          ['5', '−2', '−1'],
        ],
      },
      complexity: { time: 'O(n + u)', space: 'O(n)', why: 'Each of u updates is O(1); one O(n) pass materialises the result.' },
      edgeCases: ['Update covering the whole array uses diff[n]', 'Negative increments', 'Overlapping updates simply add up'],
      mistakes: ['diff of size n → out-of-bounds write at r + 1 = n', 'Reading values before the prefix pass'],
      tryIt: 'Let each update be read from input and print how many positions end with a positive value.',
    },
    complexityNotes: 'Prefix sums trade O(n) memory for O(1) queries. The hash-map variant counts subarrays in O(n) time and O(n) space. Difference arrays make each range update O(1) with one O(n) pass at the end.',
    quiz: [
      {
        prompt: 'With prefix[0] = 0 and prefix[i + 1] = prefix[i] + a[i], what is sum(a[2..5])?',
        options: ['prefix[5] − prefix[2]', 'prefix[6] − prefix[2]', 'prefix[6] − prefix[1]', 'prefix[5] − prefix[1]'],
        answer: 1,
        explanation: 'Inclusive [l, r] = prefix[r + 1] − prefix[l].',
      },
      {
        prompt: 'Why can\'t a sliding window count subarrays with sum k when the array has negative numbers?',
        options: ['Windows cannot store negatives', 'Growing the window no longer always increases the sum, so shrink/grow decisions break', 'It is O(n²)', 'Hash maps are required for windows'],
        answer: 1,
        explanation: 'The window technique relies on monotonicity. Negative numbers break it; prefix sums + hash map do not need it.',
      },
      {
        prompt: 'A difference array has size n. What goes wrong for an update on [3, n − 1]?',
        options: ['Nothing', 'diff[n] is written out of bounds', 'The update is ignored', 'It becomes O(n)'],
        answer: 1,
        explanation: 'The cancel mark goes at r + 1 = n, so allocate n + 1 slots.',
      },
    ],
    optimize: {
      prompt: 'Answering q range-sum queries by looping over each range costs O(n·q). What does the prefix array reuse?',
      options: ['The input order', 'Sums of shared prefixes, computed once instead of re-added for every query', 'The output buffer', 'Nothing — it is the same work'],
      answer: 1,
      explanation: 'Every range sum is a difference of two stored prefixes, so additions are never repeated.',
    },
    recap: 'Prefix sums turn range sums into subtraction, the prefix + hash map combo counts subarrays with any target (even with negatives), and difference arrays batch range updates.',
    nextPrep: 'Tomorrow: two pointers. Think about how sortedness lets you discard many pairs at once.',
  },
  questions: [
    {
      id: 'd03-range-sum',
      day: 3,
      title: 'Rainfall Range Totals',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum'],
      objective: 'Answer many range-sum queries in O(1).',
      statement: 'Daily rainfall is recorded for n days. Answer q queries: total rainfall from day l to day r inclusive (0-based).',
      constraints: ['1 ≤ n, q ≤ 10⁵', '0 ≤ rainfall ≤ 10⁹', '0 ≤ l ≤ r < n'],
      examples: [{ input: 'rain = [2, 0, 5, 1], queries = (0,2), (1,3)', output: '7\n6' }],
      edgeCases: ['l = r', 'Large totals (use long long)'],
      cues: ['Static array + many range sums → prefix sums'],
      hints: ['Summing each range separately is O(n) per query.', 'Precompute the total of the first i days.', 'answer = prefix[r + 1] − prefix[l].'],
      brute: 'Loop over every range: O(n·q).',
      approach: 'Build prefix sums once, answer each query with one subtraction.',
      correctness: 'prefix[r + 1] contains a[0..r], prefix[l] contains a[0..l−1]; their difference is exactly a[l..r].',
      complexity: { time: 'O(n + q)', space: 'O(n)', why: 'Linear build plus constant work per query.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<long long> buildPrefix(const vector<long long>& a) {
    vector<long long> p(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) p[i + 1] = p[i] + a[i];
    return p;
}`,
      main: cpp`
int main() {
    int n, q;
    cin >> n >> q;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> p = buildPrefix(a);
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << p[r + 1] - p[l] << "\n";
    }
    return 0;
}`,
      io: 'Input: n q, then n values, then q lines "l r". Output: one total per line.',
      keyLines: [{ match: 'p[i + 1] = p[i] + a[i];', note: 'Shifted by one so p[0] = 0.' }],
      mistakes: ['Using int for sums of up to 10⁵ · 10⁹'],
      tests: [
        { in: '4 2\n2 0 5 1\n0 2\n1 3', out: '7\n6' },
        { in: '1 1\n9\n0 0', out: '9' },
        { in: '3 3\n1000000000 1000000000 1000000000\n0 2\n1 1\n0 1', out: '3000000000\n1000000000\n2000000000' },
        { in: '5 2\n0 0 0 0 0\n0 4\n2 3', out: '0\n0' },
      ],
      viz: 'prefix-sum',
    },
    {
      id: 'd03-pivot-index',
      day: 3,
      title: 'Balance Point',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum', 'suffix-sum'],
      objective: 'Compare left and right sums without a second array.',
      statement: 'Find the leftmost index i where the sum of elements strictly to its left equals the sum strictly to its right. Print -1 if none exists.',
      constraints: ['1 ≤ n ≤ 10⁵', '−1000 ≤ a[i] ≤ 1000'],
      examples: [{ input: 'a = [1, 7, 3, 6, 5, 6]', output: '3', explanation: 'Left 1+7+3 = 11, right 5+6 = 11.' }],
      edgeCases: ['Index 0 (left sum is 0)', 'Last index (right sum is 0)', 'Negative values'],
      cues: ['left sum and right sum at every index → total − left − a[i]'],
      hints: ['Compute the total once.', 'Maintain the left sum while scanning.', 'right = total − left − a[i].'],
      approach: 'total = Σa; scan with left; if left == total − left − a[i] return i; left += a[i].',
      correctness: 'At index i, left holds exactly a[0..i−1], so the right sum is the remainder of the total.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two linear passes.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int pivotIndex(const vector<int>& a) {
    long long total = accumulate(a.begin(), a.end(), 0LL), left = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (left == total - left - a[i]) return i;
        left += a[i];
    }
    return -1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << pivotIndex(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the pivot index or -1.',
      keyLines: [
        { match: 'accumulate(a.begin(), a.end(), 0LL)', note: 'The initial value 0LL makes the accumulation 64-bit.' },
        { match: 'if (left == total - left - a[i]) return i;', note: 'Check before adding a[i] to left.' },
      ],
      mistakes: ['Adding a[i] to left before the comparison', 'accumulate with 0 (int) overflowing'],
      tests: [
        { in: '6\n1 7 3 6 5 6', out: '3' },
        { in: '3\n1 2 3', out: '-1' },
        { in: '3\n2 1 -1', out: '0' },
        { in: '1\n5', out: '0' },
      ],
    },
    {
      id: 'd03-equal-01',
      day: 3,
      title: 'Balanced Coin Flips',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum', 'hash-lookup'],
      objective: 'Use the first occurrence of each prefix value to find the longest zero-sum subarray.',
      statement: 'A sequence of coin flips is given as 0s and 1s. Print the length of the longest contiguous block with equally many 0s and 1s.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'flips = [0, 1, 1, 0, 1, 1, 1, 0]', output: '4' }],
      edgeCases: ['No balanced block → 0', 'Whole array balanced'],
      cues: ['Treat 0 as −1: "equal counts" becomes "sum zero"'],
      hints: ['Replace 0 with −1.', 'A zero-sum subarray means two equal prefix sums.', 'Store the first index of each prefix value; prefix 0 occurs at index −1.'],
      approach: 'Running balance (+1 for 1, −1 for 0). For each index, if the balance was seen before at j, length i − j is balanced; keep the earliest j.',
      correctness: 'Equal balances at j and i mean the elements j+1..i sum to zero; using the earliest j maximises the length.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One pass and a map of at most 2n + 1 balances.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int longestBalanced(const vector<int>& a) {
    unordered_map<int, int> first;  // balance -> earliest index
    first[0] = -1;
    int balance = 0, best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        balance += a[i] == 1 ? 1 : -1;
        auto it = first.find(balance);
        if (it != first.end()) best = max(best, i - it->second);
        else first[balance] = i;
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << longestBalanced(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n bits. Output: length of the longest balanced block.',
      keyLines: [
        { match: 'first[0] = -1;', note: 'A balanced prefix starting at index 0 needs a virtual earlier balance of 0.' },
        { match: 'else first[balance] = i;', note: 'Only store the first occurrence — later ones would shorten the answer.' },
      ],
      mistakes: ['Overwriting the stored index each time', 'Forgetting first[0] = −1'],
      tests: [
        { in: '8\n0 1 1 0 1 1 1 0', out: '4' },
        { in: '2\n0 1', out: '2' },
        { in: '3\n1 1 1', out: '0' },
        { in: '6\n0 0 1 0 1 1', out: '6' },
      ],
    },
    {
      id: 'd03-subarray-sum-k',
      day: 3,
      title: 'Ledger Segments Summing to K',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum', 'hash-lookup'],
      objective: 'Count subarrays with a target sum when values may be negative.',
      statement: 'A ledger has n signed transactions. Count contiguous segments whose total equals k.',
      constraints: ['1 ≤ n ≤ 2·10⁴', '−1000 ≤ a[i] ≤ 1000', '−10⁷ ≤ k ≤ 10⁷'],
      examples: [{ input: 'a = [1, 1, 1], k = 2', output: '2' }],
      edgeCases: ['Negative values', 'k = 0 with zeros in the array', 'Segment starting at index 0'],
      cues: ['"count subarrays with sum k" + negatives → prefix sums with a count map'],
      hints: ['Sum(l..r) = P[r+1] − P[l].', 'For each r, you need the number of earlier prefixes equal to P[r+1] − k.', 'Store counts of prefixes seen so far, starting with {0: 1}.'],
      brute: 'All O(n²) subarrays with running sums.',
      approach: 'Walk once maintaining the prefix sum; add count[prefix − k] to the answer, then record the prefix.',
      correctness: 'Each subarray ending at r corresponds to exactly one earlier prefix equal to current − k.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One pass with average-O(1) map updates.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

long long countSubarrays(const vector<int>& a, long long k) {
    unordered_map<long long, long long> seen;
    seen[0] = 1;  // the empty prefix
    long long prefix = 0, count = 0;
    for (int x : a) {
        prefix += x;
        auto it = seen.find(prefix - k);
        if (it != seen.end()) count += it->second;
        seen[prefix]++;
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << countSubarrays(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: number of segments.',
      keyLines: [
        { match: 'seen[0] = 1;', note: 'Allows segments that start at index 0.' },
        { match: 'auto it = seen.find(prefix - k);', note: 'Earlier prefixes P with current − P = k.' },
        { match: 'seen[prefix]++;', note: 'Record after counting so an empty segment is never counted.' },
      ],
      mistakes: ['Recording the prefix before the lookup (counts empty segments when k = 0)', 'Using a sliding window with negatives'],
      tests: [
        { in: '3 2\n1 1 1', out: '2' },
        { in: '3 3\n1 2 3', out: '2' },
        { in: '4 0\n0 0 0 0', out: '10' },
        { in: '5 0\n1 -1 1 -1 1', out: '6' },
      ],
    },
    {
      id: 'd03-product-except-self',
      day: 3,
      title: 'Product of Everyone Else',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['suffix-sum', 'prefix-sum'],
      objective: 'Combine prefix and suffix products without division.',
      statement: 'For each index i print the product of all elements except a[i], without using division.',
      constraints: ['2 ≤ n ≤ 10⁵', '−30 ≤ a[i] ≤ 30', 'All products fit in a signed 64-bit integer'],
      examples: [{ input: 'a = [1, 2, 3, 4]', output: '24 12 8 6' }],
      edgeCases: ['One zero', 'Two or more zeros', 'Negative numbers'],
      cues: ['"except self" + no division → left products × right products'],
      hints: ['out[i] = (product of everything left of i) × (product of everything right of i).', 'Fill out[] with left products in a forward pass.', 'Multiply in right products with a backward pass using one running variable.'],
      brute: 'For each i multiply all other elements: O(n²).',
      approach: 'Forward pass writes prefix products into out; backward pass multiplies by a running suffix product.',
      correctness: 'After both passes out[i] = Π a[0..i−1] · Π a[i+1..n−1].',
      complexity: { time: 'O(n)', space: 'O(1) extra besides the output', why: 'Two passes and one running variable.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<long long> productExceptSelf(const vector<long long>& a) {
    int n = a.size();
    vector<long long> out(n, 1);
    for (int i = 1; i < n; i++) out[i] = out[i - 1] * a[i - 1];
    long long suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        out[i] *= suffix;
        suffix *= a[i];
    }
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> out = productExceptSelf(a);
    for (int i = 0; i < n; i++) cout << out[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: n products.',
      keyLines: [
        { match: 'out[i] = out[i - 1] * a[i - 1];', note: 'out[i] becomes the product of everything left of i.' },
        { match: 'out[i] *= suffix;', note: 'suffix is the product of everything right of i at this moment.' },
      ],
      mistakes: ['Dividing the total product (fails with zeros)', 'Updating suffix before using it'],
      tests: [
        { in: '4\n1 2 3 4', out: '24 12 8 6' },
        { in: '5\n-1 1 0 -3 3', out: '0 0 9 0 0' },
        { in: '2\n5 7', out: '7 5' },
        { in: '3\n0 0 2', out: '0 0 0' },
      ],
    },
    {
      id: 'd03-diff-updates',
      day: 3,
      title: 'Stadium Seat Bookings',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['difference-array'],
      objective: 'Apply many range increments in O(1) each.',
      statement: 'Seats are numbered 1..n. Each of m bookings reserves seats l..r for v people each. Print the number of people per seat after all bookings.',
      constraints: ['1 ≤ n, m ≤ 2·10⁵', '1 ≤ l ≤ r ≤ n', '1 ≤ v ≤ 10⁴'],
      examples: [{ input: 'n = 5, bookings = (1,2,10), (2,3,20), (2,5,25)', output: '10 55 45 25 25' }],
      edgeCases: ['Booking covers seat n', 'Single-seat bookings'],
      cues: ['Many range updates, one final read → difference array'],
      hints: ['Adding v to every seat in every booking is O(n·m).', 'Mark +v at l and −v after r.', 'One prefix pass gives the totals. Mind 1-based seats.'],
      brute: 'Loop over each booked range: O(n·m).',
      approach: 'diff[l−1] += v; diff[r] −= v (0-based), then prefix-sum.',
      correctness: 'Seat s receives v from every booking with l ≤ s ≤ r: those bookings contributed +v at or before s and their −v lies after s.',
      complexity: { time: 'O(n + m)', space: 'O(n)', why: 'O(1) per booking and one prefix pass.' },
      cpp: cpp`
#include <array>
#include <iostream>
#include <vector>
using namespace std;

vector<long long> seatTotals(int n, const vector<array<long long, 3>>& bookings) {
    vector<long long> diff(n + 1, 0);
    for (auto& b : bookings) {
        diff[b[0] - 1] += b[2];
        diff[b[1]] -= b[2];
    }
    vector<long long> out(n);
    long long run = 0;
    for (int i = 0; i < n; i++) out[i] = run += diff[i];
    return out;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<array<long long, 3>> b(m);
    for (auto& x : b) cin >> x[0] >> x[1] >> x[2];
    vector<long long> out = seatTotals(n, b);
    for (int i = 0; i < n; i++) cout << out[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n m, then m lines "l r v". Output: n totals.',
      keyLines: [
        { match: 'diff[b[0] - 1] += b[2];', note: 'Convert seat l to 0-based index l − 1.' },
        { match: 'diff[b[1]] -= b[2];', note: 'Seat r is index r − 1, so the cancel mark goes at index r.' },
      ],
      mistakes: ['Mixing 1-based seats with 0-based indices', 'diff of size n'],
      tests: [
        { in: '5 3\n1 2 10\n2 3 20\n2 5 25', out: '10 55 45 25 25' },
        { in: '1 1\n1 1 7', out: '7' },
        { in: '4 2\n1 4 1\n4 4 2', out: '1 1 1 3' },
        { in: '3 0', out: '0 0 0' },
      ],
    },
    {
      id: 'd03-divisible-k',
      day: 3,
      title: 'Segments Divisible by K',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum', 'frequency-counting'],
      objective: 'Count pairs of equal prefix remainders.',
      statement: 'Count contiguous subarrays whose sum is divisible by k.',
      constraints: ['1 ≤ n ≤ 3·10⁴', '−10⁴ ≤ a[i] ≤ 10⁴', '2 ≤ k ≤ 10⁴'],
      examples: [{ input: 'a = [4, 5, 0, -2, -3, 1], k = 5', output: '7' }],
      edgeCases: ['Negative numbers: C++ % can return negatives', 'All zeros'],
      cues: ['sum(l..r) divisible by k ⇔ prefix remainders are equal'],
      hints: ['(P[r+1] − P[l]) % k == 0 ⇔ P[r+1] % k == P[l] % k.', 'Count prefix remainders; each equal pair is one subarray.', 'Normalise: ((x % k) + k) % k.'],
      approach: 'Count remainders of prefix sums (including the empty prefix 0); add count[r] before incrementing it.',
      correctness: 'Each pair of equal-remainder prefixes j < i gives exactly one divisible subarray a[j..i−1].',
      complexity: { time: 'O(n)', space: 'O(k)', why: 'One pass; a count array of size k.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long divisibleSubarrays(const vector<int>& a, int k) {
    vector<long long> cnt(k, 0);
    cnt[0] = 1;  // empty prefix
    long long prefix = 0, total = 0;
    for (int x : a) {
        prefix += x;
        int r = ((prefix % k) + k) % k;
        total += cnt[r];
        cnt[r]++;
    }
    return total;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << divisibleSubarrays(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: count of divisible subarrays.',
      keyLines: [{ match: 'int r = ((prefix % k) + k) % k;', note: 'In C++, −7 % 5 is −2; adding k and taking % again gives 3.' }],
      mistakes: ['Using a negative remainder as an index (out of bounds)'],
      tests: [
        { in: '6 5\n4 5 0 -2 -3 1', out: '7' },
        { in: '1 9\n5', out: '0' },
        { in: '3 2\n0 0 0', out: '6' },
        { in: '3 3\n-3 3 -3', out: '6' },
      ],
    },
    {
      id: 'd03-submatrix-target',
      day: 3,
      title: 'Treasure Rectangles',
      difficulty: 'Hard',
      topic: 'arrays-hashing',
      patterns: ['prefix-sum', 'hash-lookup'],
      objective: 'Reduce a 2D counting problem to many 1D subarray-sum problems.',
      statement: 'Given an R×C grid of integers, count non-empty sub-rectangles whose sum equals target.',
      constraints: ['1 ≤ R, C ≤ 100', '−1000 ≤ cell ≤ 1000', '|target| ≤ 10⁸'],
      examples: [{ input: 'grid = [[0,1,0],[1,1,1],[0,1,0]], target = 0', output: '4' }],
      edgeCases: ['Single cell', 'Negative values', 'target = 0'],
      cues: ['Rectangle sums + counting → fix a pair of rows, then 1D "subarray sum = k"'],
      hints: ['Fix the top and bottom rows.', 'Collapse the columns between them into a 1D array of column sums.', 'Count 1D subarrays with sum target using prefix sums + hash map.'],
      brute: 'Enumerate all O(R²C²) rectangles with 2D prefix sums.',
      approach: 'For each top row, accumulate column sums while extending the bottom row; for each (top, bottom) run the prefix+map count over the column sums.',
      correctness: 'Every rectangle is defined by its row span and a contiguous column span; the inner 1D count enumerates the column spans exactly once.',
      complexity: { time: 'O(R² · C)', space: 'O(C)', why: 'R² row pairs, each with an O(C) hash-map pass.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

long long countRectangles(const vector<vector<int>>& g, long long target) {
    int R = g.size(), C = g[0].size();
    long long total = 0;
    for (int top = 0; top < R; top++) {
        vector<long long> col(C, 0);
        for (int bottom = top; bottom < R; bottom++) {
            for (int c = 0; c < C; c++) col[c] += g[bottom][c];
            unordered_map<long long, int> seen{{0, 1}};
            long long prefix = 0;
            for (int c = 0; c < C; c++) {
                prefix += col[c];
                auto it = seen.find(prefix - target);
                if (it != seen.end()) total += it->second;
                seen[prefix]++;
            }
        }
    }
    return total;
}`,
      main: cpp`
int main() {
    int R, C;
    long long target;
    cin >> R >> C >> target;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << countRectangles(g, target) << "\n";
    return 0;
}`,
      io: 'Input: R C target, then the grid row by row. Output: number of rectangles.',
      keyLines: [
        { match: 'for (int c = 0; c < C; c++) col[c] += g[bottom][c];', note: 'col[c] = sum of rows top..bottom in column c.' },
        { match: 'unordered_map<long long, int> seen{{0, 1}};', note: 'Fresh 1D counter for each row pair.' },
      ],
      mistakes: ['Rebuilding column sums from scratch for every bottom (adds a factor of R)'],
      tests: [
        { in: '3 3 0\n0 1 0\n1 1 1\n0 1 0', out: '4' },
        { in: '2 2 0\n1 -1\n-1 1', out: '5' },
        { in: '1 1 5\n5', out: '1' },
        { in: '2 3 3\n1 1 1\n1 1 1', out: '2' },
      ],
    },
  ],
};

export default day;
