import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 33,
    title: 'Selection and Streams: Quickselect and Two Heaps',
    zone: 'advanced',
    advanced: true,
    objectives: [
      'Find the k-th smallest element in expected O(n) with quickselect',
      'Choose between sorting, a size-k heap and quickselect',
      'Maintain a running median with two balanced heaps',
      'Process data streams with bounded memory',
    ],
    prerequisites: ['Day 9: sorting and partitioning', 'Day 15: heaps'],
    lesson: [
      {
        heading: 'Three ways to get the k-th element',
        body: '- **Sort**: O(n log n), simple, gives every rank.\n- **Size-k heap**: O(n log k), works on streams, keeps the top k.\n- **Quickselect**: expected O(n), in place, but reorders the array and needs all data up front.',
      },
      {
        heading: 'Quickselect',
        body: 'Partition around a pivot like quicksort. The pivot lands at its final sorted index p. If p == k you are done; otherwise recurse into **only one side**. Expected work is n + n/2 + n/4 + … ≈ 2n. A random pivot avoids the O(n²) worst case on adversarial inputs.',
      },
      {
        heading: 'Running median',
        body: 'Keep the smaller half in a max-heap `low` and the larger half in a min-heap `high`. Invariants: every value in `low` ≤ every value in `high`, and `low.size()` is equal to or one more than `high.size()`. The median is `low.top()` or the average of both tops.',
      },
      {
        heading: 'Insert, then rebalance',
        body: 'Push the new value into `low`, move `low.top()` to `high` (fixes the ordering), and if `high` became larger, move its top back. Every insertion is O(log n); reading the median is O(1).',
      },
      {
        heading: 'Streams',
        body: 'A stream can be read once and is too large to store. Keep only a summary: a running sum, a window queue, a size-k heap or two heaps. Ask "what is the minimum state that still answers the query?".',
      },
    ],
    recognition: [
      '"k-th largest/smallest" once, array in memory → quickselect (or nth_element).',
      '"top k" from a stream or with k ≪ n → size-k heap.',
      '"median of everything so far" → two heaps.',
    ],
    patterns: ['quickselect', 'two-heaps', 'streaming', 'top-k'],
    visualizations: ['heap', 'sorting'],
    exampleA: {
      id: 'd33-A',
      title: 'Quickselect with Lomuto partition',
      goal: 'Find the k-th smallest value (0-based k) without sorting the whole array.',
      input: 'a = {7, 2, 9, 4, 1, 8, 3}, k = 3',
      output: 'pivot 3 at index 2 -> go right\npivot 9 at index 6 -> go left\npivot 8 at index 5 -> go left\npivot 7 at index 4 -> go left\npivot 4 at index 3 -> found\n3rd (0-based) smallest = 4',
      idea: 'Partition puts the pivot at its sorted position p. Compare p with k and continue only in the side that contains index k.',
      code: cpp`
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// Lomuto partition of a[lo..hi] around a[hi]; returns the pivot's final index.
int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi], store = lo;
    for (int i = lo; i < hi; i++)
        if (a[i] < pivot) swap(a[i], a[store++]);
    swap(a[store], a[hi]);
    return store;
}

int quickselect(vector<int>& a, int k) {
    int lo = 0, hi = a.size() - 1;
    while (true) {
        int p = partition(a, lo, hi);
        cout << "pivot " << a[p] << " at index " << p;
        if (p == k) {
            cout << " -> found\n";
            return a[p];
        }
        if (p < k) {
            cout << " -> go right\n";
            lo = p + 1;  //@gap
        } else {
            cout << " -> go left\n";
            hi = p - 1;  //@gap
        }
    }
}

int main() {
    vector<int> a = {7, 2, 9, 4, 1, 8, 3};
    int k = 3;
    int v = quickselect(a, k);
    cout << k << "rd (0-based) smallest = " << v << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (a[i] < pivot) swap(a[i], a[store++]);', note: 'Everything smaller than the pivot is moved to the front.' },
        { match: 'swap(a[store], a[hi]);', note: 'The pivot lands at its final sorted index.' },
        { match: 'lo = p + 1;', note: 'k is to the right — discard the left part entirely.' },
        { match: 'hi = p - 1;', note: 'k is to the left — discard the right part.' },
      ],
      dryRun: {
        columns: ['range', 'pivot', 'array after partition', 'p vs k=3'],
        rows: [
          ['[0,6]', '3', '2 1 3 4 7 8 9', 'p=2 < 3 → right'],
          ['[3,6]', '9', 'unchanged (9 is the largest)', 'p=6 > 3 → left'],
          ['[3,5]', '8', 'unchanged', 'p=5 > 3 → left'],
          ['[3,4]', '7', 'unchanged', 'p=4 > 3 → left'],
          ['[3,3]', '4', 'unchanged', 'p=3 = k → found'],
        ],
      },
      complexity: { time: 'Expected O(n), worst O(n²)', space: 'O(1)', why: 'Each round discards one side; a bad pivot discards only one element.' },
      edgeCases: ['k = 0 or k = n − 1', 'Many duplicates (Lomuto degrades; three-way partition helps)', 'Already sorted input with last-element pivot → worst case (this input already shows four rounds)'],
      mistakes: ['Recursing into both sides (that is quicksort)', 'Forgetting that quickselect reorders the input'],
      tryIt: 'Pick a random pivot (swap it to a[hi] first) and observe fewer rounds on sorted inputs.',
      bug: {
        find: 'hi = p - 1;',
        replace: 'hi = p;',
        symptom: 'The loop never ends: pivot 9 is reported at index 6 again and again.',
        explanation: 'Without − 1 the pivot stays inside the range. When it is the largest element of the range, partition returns the same p every time and the range never shrinks. Excluding the pivot guarantees progress.',
      },
    },
    exampleB: {
      id: 'd33-B',
      kind: 'variant',
      title: 'Running median with two heaps',
      goal: 'Print the median after each value arrives.',
      input: 'stream 5, 15, 1, 3, 8, 7',
      output: 'add 5 -> median 5\nadd 15 -> median 10\nadd 1 -> median 5\nadd 3 -> median 4\nadd 8 -> median 5\nadd 7 -> median 6',
      idea: 'low (max-heap) holds the smaller half, high (min-heap) the larger half. Route every value through low into high, then rebalance sizes.',
      code: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct RunningMedian {
    priority_queue<int> low;                             // max-heap: smaller half
    priority_queue<int, vector<int>, greater<int>> high;  // min-heap: larger half

    void add(int x) {
        low.push(x);
        high.push(low.top());  // largest of the small half moves up
        low.pop();
        if (high.size() > low.size()) {  //@gap
            low.push(high.top());         //@gap
            high.pop();
        }
    }
    double median() const {
        if (low.size() > high.size()) return low.top();
        return (low.top() + (double)high.top()) / 2.0;
    }
};

int main() {
    RunningMedian rm;
    for (int x : {5, 15, 1, 3, 8, 7}) {
        rm.add(x);
        cout << "add " << x << " -> median " << rm.median() << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'high.push(low.top());  // largest of the small half moves up', note: 'Guarantees every value in low ≤ every value in high.' },
        { match: 'if (high.size() > low.size()) {', note: 'Keep low equal to or one bigger than high.' },
        { match: 'if (low.size() > high.size()) return low.top();', note: 'Odd count: the middle is the top of low.' },
        { match: 'return (low.top() + (double)high.top()) / 2.0;', note: 'Even count: average of the two middles (double avoids integer division and overflow).' },
      ],
      dryRun: {
        columns: ['add', 'low (max-heap)', 'high (min-heap)', 'median'],
        rows: [
          ['5', '5', '—', '5'],
          ['15', '5', '15', '10'],
          ['1', '1 5', '15', '5'],
          ['3', '1 3', '5 15', '4'],
          ['8', '1 3 5', '8 15', '5'],
          ['7', '1 3 5', '7 8 15', '6'],
        ],
      },
      complexity: { time: 'O(log n) per add, O(1) per median', space: 'O(n)', why: 'At most three heap operations per value.' },
      edgeCases: ['Duplicates', 'Negative numbers', 'Sum of two large ints overflows — cast before adding'],
      mistakes: ['Pushing directly into one heap based on a comparison and forgetting to rebalance', 'Integer division for even counts'],
      tryIt: 'Add a remove(x) using lazy deletion — the core of the sliding-window median.',
    },
    complexityNotes: 'Quickselect is expected O(n) but worst-case O(n²); std::nth_element gives the same in practice. A size-k heap is O(n log k) and works on streams. Two heaps give O(log n) updates and O(1) medians.',
    quiz: [
      {
        prompt: 'After one partition step, the pivot is at index p and k > p. Quickselect continues in…',
        options: ['Both halves', 'a[p+1..hi] only', 'a[lo..p−1] only', 'The whole array again'],
        answer: 1,
        explanation: 'The k-th element must be right of the pivot; the left side can be ignored.',
      },
      {
        prompt: 'For a stream of 10⁹ numbers, the top 10 values are best found with…',
        options: ['Sort everything', 'A min-heap of size 10', 'Quickselect', 'Two heaps'],
        answer: 1,
        explanation: 'O(n log 10) time, O(10) memory, single pass.',
      },
      {
        prompt: 'In the two-heap median, which heap is a max-heap?',
        options: ['The one with the larger half', 'The one with the smaller half', 'Both', 'Neither'],
        answer: 1,
        explanation: 'The largest of the small half sits on top, next to the smallest of the large half.',
      },
    ],
    recap: 'Quickselect partitions and follows only the side containing k (expected O(n)). Heaps of size k summarise streams. Two heaps split values at the median and give O(1) median queries after O(log n) inserts.',
    nextPrep: 'Tomorrow: sweep line and difference arrays for overlapping intervals.',
  },
  questions: [
    {
      id: 'd33-third-max',
      day: 33,
      title: 'Bronze Medal Score',
      difficulty: 'Easy',
      topic: 'advanced',
      patterns: ['top-k', 'streaming'],
      objective: 'Track the top three distinct values in one pass.',
      statement: 'Print the third largest distinct value. If there are fewer than three distinct values, print the maximum.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]| ≤ 2³¹ − 1'],
      examples: [{ input: '2 2 3 1', output: '1' }],
      edgeCases: ['Duplicates of the maximum', 'Values equal to INT_MIN'],
      cues: ['Small fixed k, distinct values'],
      hints: ['Keep a std::set of at most three values.'],
      approach: 'Size-3 ordered set.',
      correctness: 'The set holds the three largest distinct values seen so far.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Set size never exceeds 3.' },
      cpp: cpp`
#include <iostream>
#include <set>
#include <vector>
using namespace std;

long long thirdMax(const vector<long long>& a) {
    set<long long> top;
    for (long long x : a) {
        top.insert(x);
        if (top.size() > 3) top.erase(top.begin());
    }
    return top.size() == 3 ? *top.begin() : *top.rbegin();
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << thirdMax(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: the answer.',
      keyLines: [{ match: 'if (top.size() > 3) top.erase(top.begin());', note: 'Drop the smallest when more than three are kept.' }],
      mistakes: ['Using INT_MIN as a "missing" sentinel when the input may contain it'],
      tests: [
        { in: '4\n2 2 3 1', out: '1' },
        { in: '2\n1 2', out: '2' },
        { in: '5\n-2147483648 1 1 2 2', out: '-2147483648' },
        { in: '6\n5 5 4 4 3 3', out: '3' },
      ],
    },
    {
      id: 'd33-moving-average',
      day: 33,
      title: 'Smoothing a Sensor Feed',
      difficulty: 'Easy',
      topic: 'advanced',
      patterns: ['streaming', 'sliding-window-fixed'],
      objective: 'Window queue + running sum.',
      statement: 'For each incoming value print the average of the last k values (or of all values if fewer than k), with two decimals.',
      constraints: ['1 ≤ k ≤ 10⁴', '1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'k=3, stream 1 10 3 5', output: '1.00 5.50 4.67 6.00' }],
      edgeCases: ['k = 1'],
      cues: ['Stream + last k values'],
      hints: ['Keep a queue and a running sum.'],
      approach: 'Queue of size ≤ k.',
      correctness: 'The sum always equals the sum of the queue.',
      complexity: { time: 'O(1) per value', space: 'O(k)', why: 'One push and at most one pop.' },
      cpp: cpp`
#include <cstdio>
#include <iostream>
#include <queue>
using namespace std;

struct MovingAverage {
    size_t k;
    queue<int> q;
    long long sum = 0;
    explicit MovingAverage(size_t k) : k(k) {}
    double next(int x) {
        q.push(x);
        sum += x;
        if (q.size() > k) {
            sum -= q.front();
            q.pop();
        }
        return (double)sum / q.size();
    }
};`,
      main: cpp`
int main() {
    int k, n;
    cin >> k >> n;
    MovingAverage m(k);
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        printf("%s%.2f", i ? " " : "", m.next(x));
    }
    printf("\n");
    return 0;
}`,
      io: 'Input: k n, then n values. Output: averages with two decimals.',
      keyLines: [{ match: 'sum -= q.front();', note: 'The oldest value leaves the window.' }],
      mistakes: ['Re-summing the window each time (O(k) per value)'],
      tests: [
        { in: '3 4\n1 10 3 5', out: '1.00 5.50 4.67 6.00' },
        { in: '1 3\n4 5 6', out: '4.00 5.00 6.00' },
        { in: '5 2\n-1 -2', out: '-1.00 -1.50' },
        { in: '2 4\n1 2 3 4', out: '1.00 1.50 2.50 3.50' },
      ],
    },
    {
      id: 'd33-kth-largest',
      day: 33,
      title: 'K-th Highest Bid',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['quickselect', 'top-k'],
      objective: 'Use nth_element (quickselect) correctly.',
      statement: 'Print the k-th largest value (1-based, duplicates count separately).',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵'],
      examples: [{ input: '3 2 1 5 6 4, k=2', output: '5' }],
      edgeCases: ['k = 1 → max', 'k = n → min'],
      cues: ['Single order statistic'],
      hints: ['k-th largest = index n − k in ascending order.', 'std::nth_element runs quickselect.'],
      approach: 'nth_element at index n − k.',
      correctness: 'After nth_element, a[n−k] is exactly the element that would be there after sorting.',
      complexity: { time: 'Expected O(n)', space: 'O(1)', why: 'Quickselect.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int kthLargest(vector<int> a, int k) {
    nth_element(a.begin(), a.begin() + (a.size() - k), a.end());
    return a[a.size() - k];
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << kthLargest(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n values. Output: k-th largest.',
      keyLines: [{ match: 'nth_element(a.begin(), a.begin() + (a.size() - k), a.end());', note: 'Ascending index n − k is the k-th largest.' }],
      mistakes: ['Using index k − 1 (that is the k-th smallest)'],
      tests: [
        { in: '6 2\n3 2 1 5 6 4', out: '5' },
        { in: '9 4\n3 2 3 1 2 4 5 5 6', out: '4' },
        { in: '1 1\n7', out: '7' },
        { in: '5 5\n5 4 3 2 1', out: '1' },
      ],
    },
    {
      id: 'd33-top-k-words',
      day: 33,
      title: 'Trending Tags',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['top-k', 'frequency-counting', 'custom-sort'],
      objective: 'Count, then select with a custom order.',
      statement: 'Print the k most frequent words; ties are broken alphabetically.',
      constraints: ['1 ≤ n ≤ 10⁴', '1 ≤ k ≤ number of distinct words'],
      examples: [{ input: 'i love leetcode i love coding, k=2', output: 'i love' }],
      edgeCases: ['All words with equal frequency'],
      cues: ['Frequency + top k + tie-break'],
      hints: ['Count with a map.', 'Sort (or partial_sort) by (−count, word).'],
      approach: 'Hash count + partial_sort.',
      correctness: 'The comparator matches the required ranking exactly.',
      complexity: { time: 'O(n + d log k)', space: 'O(d)', why: 'partial_sort on d distinct words.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

vector<string> topKWords(const vector<string>& words, int k) {
    unordered_map<string, int> freq;
    for (auto& w : words) freq[w]++;
    vector<pair<int, string>> items;
    for (auto& [w, c] : freq) items.push_back({-c, w});
    partial_sort(items.begin(), items.begin() + k, items.end());
    vector<string> res;
    for (int i = 0; i < k; i++) res.push_back(items[i].second);
    return res;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<string> w(n);
    for (auto& s : w) cin >> s;
    auto res = topKWords(w, k);
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n k, then n words. Output: k words.',
      keyLines: [{ match: 'for (auto& [w, c] : freq) items.push_back({-c, w});', note: 'Negated count sorts frequent first; equal counts fall back to alphabetical.' }],
      mistakes: ['Relying on unordered_map iteration order for ties'],
      tests: [
        { in: '6 2\ni love leetcode i love coding', out: 'i love' },
        { in: '10 4\nthe day is sunny the the the sunny is is', out: 'the is sunny day' },
        { in: '3 3\nc b a', out: 'a b c' },
        { in: '4 1\nx y y x', out: 'x' },
      ],
    },
    {
      id: 'd33-k-closest',
      day: 33,
      title: 'Nearest Price Points',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['binary-search', 'sliding-window-fixed'],
      objective: 'Binary search for the start of a size-k window.',
      statement: 'Given a sorted array, print the k values closest to x in ascending order. Closer is |a − x| smaller; ties prefer the smaller value.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁴'],
      examples: [{ input: '1 2 3 4 5, k=4, x=3', output: '1 2 3 4' }],
      edgeCases: ['x outside the range of the array'],
      cues: ['Sorted array + k closest → contiguous window'],
      hints: ['The answer is a window a[s..s+k).', 'Binary search s: if x − a[mid] > a[mid+k] − x, move right.'],
      approach: 'Binary search over window starts.',
      correctness: 'Comparing the two window ends decides which side to drop; the predicate is monotone in s.',
      complexity: { time: 'O(log(n − k) + k)', space: 'O(1)', why: 'Binary search plus output.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<int> kClosest(const vector<int>& a, int k, int x) {
    int lo = 0, hi = a.size() - k;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (x - a[mid] > a[mid + k] - x) lo = mid + 1;
        else hi = mid;
    }
    return vector<int>(a.begin() + lo, a.begin() + lo + k);
}`,
      main: cpp`
int main() {
    int n, k, x;
    cin >> n >> k >> x;
    vector<int> a(n);
    for (auto& v : a) cin >> v;
    auto res = kClosest(a, k, x);
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: n k x, then the sorted array. Output: k values.',
      keyLines: [{ match: 'if (x - a[mid] > a[mid + k] - x) lo = mid + 1;', note: 'a[mid] is farther than a[mid+k]: the window should start later.' }],
      mistakes: ['Using abs() in the comparison (breaks when x is between the ends)'],
      tests: [
        { in: '5 4 3\n1 2 3 4 5', out: '1 2 3 4' },
        { in: '5 4 -1\n1 2 3 4 5', out: '1 2 3 4' },
        { in: '6 3 10\n1 2 3 9 11 12', out: '9 11 12' },
        { in: '4 2 5\n1 4 6 9', out: '4 6' },
      ],
    },
    {
      id: 'd33-kth-matrix',
      day: 33,
      title: 'K-th Cell in a Sorted Grid',
      difficulty: 'Medium',
      topic: 'advanced',
      patterns: ['binary-search-answer', 'two-pointers-opposite'],
      objective: 'Binary search on the value with a staircase count.',
      statement: 'Rows and columns of an n×n matrix are sorted ascending. Print the k-th smallest element (1-based).',
      constraints: ['1 ≤ n ≤ 300', '1 ≤ k ≤ n²', '|value| ≤ 10⁹'],
      examples: [{ input: '1 5 9 / 10 11 13 / 12 13 15, k=8', output: '13' }],
      edgeCases: ['Duplicates', 'k = 1 or k = n²'],
      cues: ['Sorted matrix + k-th → binary search on value'],
      hints: ['count(≤ v) is monotone in v.', 'Count from the bottom-left corner in O(n).'],
      approach: 'Binary search for the smallest v with count(≤ v) ≥ k.',
      correctness: 'That smallest v must be a matrix value and is exactly the k-th smallest.',
      complexity: { time: 'O(n log(range))', space: 'O(1)', why: 'O(n) staircase per probe.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long countLE(const vector<vector<long long>>& m, long long v) {
    int n = m.size(), r = n - 1, c = 0;
    long long cnt = 0;
    while (r >= 0 && c < n) {
        if (m[r][c] <= v) {
            cnt += r + 1;  // whole column prefix is <= v
            c++;
        } else {
            r--;
        }
    }
    return cnt;
}

long long kthSmallest(const vector<vector<long long>>& m, long long k) {
    long long lo = m[0][0], hi = m.back().back();
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (countLE(m, mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<vector<long long>> m(n, vector<long long>(n));
    for (auto& row : m)
        for (auto& x : row) cin >> x;
    cout << kthSmallest(m, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then the matrix. Output: k-th smallest.',
      keyLines: [{ match: 'cnt += r + 1;  // whole column prefix is <= v', note: 'Staircase: each step moves right or up.' }],
      mistakes: ['mid = (lo + hi) / 2 with negative values rounds toward zero — use lo + (hi − lo) / 2'],
      tests: [
        { in: '3 8\n1 5 9\n10 11 13\n12 13 15', out: '13' },
        { in: '1 1\n-5', out: '-5' },
        { in: '2 3\n1 2\n1 3', out: '2' },
        { in: '3 5\n-9 -3 0\n-8 -1 4\n-2 5 7', out: '-1' },
      ],
    },
    {
      id: 'd33-running-median',
      day: 33,
      title: 'Live Median Board',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['two-heaps', 'streaming'],
      objective: 'Implement the two-heap median.',
      statement: 'After each incoming integer, print the median of all integers so far with one decimal.',
      constraints: ['1 ≤ n ≤ 10⁵', '|x| ≤ 10⁹'],
      examples: [{ input: '5 15 1 3', output: '5.0 10.0 5.0 4.0' }],
      edgeCases: ['Large values (sum of two tops overflows int)'],
      cues: ['Median of a growing collection'],
      hints: ['Max-heap for the lower half, min-heap for the upper half.'],
      approach: 'Two heaps, push through low, rebalance.',
      correctness: 'Invariants (ordering and sizes) hold after each add, so the tops are the middle elements.',
      complexity: { time: 'O(log n) per value', space: 'O(n)', why: 'Heap operations.' },
      cpp: cpp`
#include <cstdio>
#include <functional>
#include <queue>
#include <vector>
using namespace std;

struct MedianFinder {
    priority_queue<long long> low;
    priority_queue<long long, vector<long long>, greater<long long>> high;
    void add(long long x) {
        low.push(x);
        high.push(low.top());
        low.pop();
        if (high.size() > low.size()) {
            low.push(high.top());
            high.pop();
        }
    }
    double median() const {
        return low.size() > high.size() ? low.top() : (low.top() + high.top()) / 2.0;
    }
};`,
      main: cpp`
int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    MedianFinder mf;
    for (int i = 0; i < n; i++) {
        long long x;
        if (scanf("%lld", &x) != 1) return 0;
        mf.add(x);
        printf("%s%.1f", i ? " " : "", mf.median());
    }
    printf("\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: medians with one decimal.',
      keyLines: [{ match: 'high.push(low.top());', note: 'Route through low so ordering is preserved.' }],
      mistakes: ['int overflow when averaging two tops'],
      tests: [
        { in: '4\n5 15 1 3', out: '5.0 10.0 5.0 4.0' },
        { in: '1\n-7', out: '-7.0' },
        { in: '2\n1000000000 1000000000', out: '1000000000.0 1000000000.0' },
        { in: '6\n2 2 2 1 1 1', out: '2.0 2.0 2.0 2.0 2.0 1.5' },
      ],
    },
    {
      id: 'd33-sliding-median',
      day: 33,
      title: 'Rolling Median Window',
      difficulty: 'Hard',
      topic: 'advanced',
      patterns: ['two-heaps', 'sliding-window-fixed'],
      objective: 'Median of every window of size k.',
      statement: 'Print the median of each contiguous window of size k, with one decimal.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵', '|a[i]| ≤ 2³¹ − 1'],
      examples: [{ input: '1 3 -1 -3 5 3 6 7, k=3', output: '1.0 -1.0 -1.0 3.0 5.0 6.0' }],
      edgeCases: ['k = 1', 'Duplicates leaving the window'],
      cues: ['Median + sliding window → balanced structure with deletion'],
      hints: ['Two multisets work like two heaps but support erase.', 'Keep low.size() == high.size() or one more.'],
      approach: 'Two multisets with rebalancing after each insert/erase.',
      correctness: 'Same invariants as the running median, maintained under deletion.',
      complexity: { time: 'O(n log k)', space: 'O(k)', why: 'Logarithmic multiset operations.' },
      cpp: cpp`
#include <cstdio>
#include <set>
#include <vector>
using namespace std;

vector<double> windowMedians(const vector<long long>& a, int k) {
    multiset<long long> low, high;  // low: smaller half, high: larger half
    auto balance = [&]() {
        while (low.size() > high.size() + 1) {
            high.insert(*prev(low.end()));
            low.erase(prev(low.end()));
        }
        while (high.size() > low.size()) {
            low.insert(*high.begin());
            high.erase(high.begin());
        }
    };
    vector<double> res;
    for (int i = 0; i < (int)a.size(); i++) {
        if (low.empty() || a[i] <= *prev(low.end())) low.insert(a[i]);
        else high.insert(a[i]);
        if (i >= k) {
            long long out = a[i - k];
            auto it = low.find(out);
            if (it != low.end()) low.erase(it);
            else high.erase(high.find(out));
        }
        balance();
        if (i >= k - 1)
            res.push_back(k % 2 ? (double)*prev(low.end()) : (*prev(low.end()) + *high.begin()) / 2.0);
    }
    return res;
}`,
      main: cpp`
int main() {
    int n, k;
    if (scanf("%d %d", &n, &k) != 2) return 0;
    vector<long long> a(n);
    for (auto& x : a)
        if (scanf("%lld", &x) != 1) return 0;
    auto res = windowMedians(a, k);
    for (size_t i = 0; i < res.size(); i++) printf("%s%.1f", i ? " " : "", res[i]);
    printf("\n");
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: medians with one decimal.',
      keyLines: [
        { match: 'auto it = low.find(out);', note: 'Erase one copy only (find + erase(iterator)), not every duplicate.' },
        { match: 'balance();', note: 'Restore size invariants after insert and erase.' },
      ],
      mistakes: ['multiset::erase(value) removes all duplicates'],
      tests: [
        { in: '8 3\n1 3 -1 -3 5 3 6 7', out: '1.0 -1.0 -1.0 3.0 5.0 6.0' },
        { in: '4 1\n4 1 3 2', out: '4.0 1.0 3.0 2.0' },
        { in: '5 2\n1 1 1 1 1', out: '1.0 1.0 1.0 1.0' },
        { in: '2 2\n2147483647 2147483647', out: '2147483647.0' },
      ],
    },
  ],
};

export default day;
