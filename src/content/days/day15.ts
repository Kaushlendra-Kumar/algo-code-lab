import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 15,
    title: 'Heaps, Priority Queues and Top-K',
    zone: 'stacks-queues',
    objectives: [
      'Explain the binary-heap array layout and sift-up/sift-down',
      'Use std::priority_queue as a max-heap and as a min-heap',
      'Select the k largest/smallest items in O(n log k)',
      'Merge k sorted sequences with a heap of "heads"',
    ],
    prerequisites: ['Day 9: sorting and comparators', 'Day 10: stacks and queues'],
    lesson: [
      {
        heading: 'Binary heap',
        body: 'A heap is a complete binary tree stored in an array: the children of index i are 2i + 1 and 2i + 2, its parent is (i − 1) / 2. In a **min-heap** every parent ≤ its children, so the minimum is at index 0. Push appends and **sifts up**; pop moves the last element to the root and **sifts down** — both O(log n).',
      },
      {
        heading: 'std::priority_queue',
        body: '`priority_queue<int>` is a **max-heap**: `top()` is the largest. For a min-heap write `priority_queue<int, vector<int>, greater<int>>`. For pairs/tuples the comparison is lexicographic. A custom comparator returns true when its first argument has **lower** priority (it is "less").',
      },
      {
        heading: 'Top-K with a bounded heap',
        body: 'To keep the k largest values of a stream, use a **min-heap of size k**: push each value, and if the size exceeds k pop the minimum. The heap always holds the k largest seen so far and its top is the k-th largest. Cost O(n log k) time and O(k) memory.',
      },
      {
        heading: 'K-way merge',
        body: 'Put the first element of each sorted list into a min-heap as (value, list id, index). Repeatedly pop the smallest, output it, and push the next element from the same list. Total O(N log k) for N elements across k lists.',
      },
    ],
    recognition: [
      '"k largest/smallest/closest/most frequent" → bounded heap (or quickselect).',
      'Repeatedly take the current minimum/maximum while items arrive → priority queue.',
      'Merge many sorted sources → heap of heads.',
      'Greedy choices that depend on the best remaining option → heap-based greedy.',
    ],
    patterns: ['top-k', 'heap-greedy', 'merge-sort', 'streaming'],
    visualizations: ['heap'],
    exampleA: {
      id: 'd15-A',
      title: 'Top-K largest with a min-heap of size k',
      goal: 'Find the 3 largest values of an array using O(k) memory.',
      input: 'nums = {5, 1, 9, 3, 7, 6, 8}, k = 3',
      output: 'top 3: 7 8 9',
      idea: 'The min-heap holds the best k values so far; its top is the weakest of them. Any value smaller than the top can never enter the top k.',
      code: TRACE_CODE['heap-topk'],
      keyLines: [
        { match: 'priority_queue<int, vector<int>, greater<int>> heap;', note: 'greater<int> turns the default max-heap into a min-heap.' },
        { match: 'heap.push(x);', note: 'O(log k) sift-up.' },
        { match: 'if ((int)heap.size() > k) heap.pop();', note: 'Evict the smallest so only k candidates remain.' },
        { match: 'out.push_back(heap.top());', note: 'Popping a min-heap yields ascending order.' },
      ],
      complexity: { time: 'O(n log k)', space: 'O(k)', why: 'Each of n values costs one push and at most one pop on a heap of size ≤ k + 1.' },
      edgeCases: ['k = n → all values', 'Duplicates are kept', 'k = 1 → the maximum'],
      mistakes: ['Using a max-heap of all n values (O(n) memory)', 'Forgetting that priority_queue is a max-heap by default'],
      tryIt: 'Return the k-th largest value directly (it is heap.top() after the loop).',
      trace: { id: 'heap-topk', input: { nums: [5, 1, 9, 3, 7, 6, 8], k: 3 } },
      bug: {
        find: 'priority_queue<int, vector<int>, greater<int>> heap;',
        replace: 'priority_queue<int> heap;',
        symptom: 'The program prints "top 3: 5 3 1" — the three smallest values, largest first.',
        explanation: 'With the default max-heap, pop() removes the largest value, so the heap ends up keeping the k smallest. Top-K largest needs a min-heap.',
      },
    },
    exampleB: {
      id: 'd15-B',
      kind: 'variant',
      title: 'Merge k sorted lists with a heap of heads',
      goal: 'Merge several sorted vectors into one sorted output.',
      input: '{1, 4, 7}, {2, 5, 8}, {0, 6}',
      output: '0 1 2 4 5 6 7 8',
      idea: 'The overall smallest remaining element is always the smallest of the current heads. Keep the heads in a min-heap of (value, list, index).',
      code: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

vector<int> mergeK(const vector<vector<int>>& lists) {
    using Item = tuple<int, int, int>;  // (value, list id, index in list)
    priority_queue<Item, vector<Item>, greater<Item>> pq;
    for (int i = 0; i < (int)lists.size(); i++)
        if (!lists[i].empty()) pq.push({lists[i][0], i, 0});
    vector<int> out;
    while (!pq.empty()) {
        auto [v, li, idx] = pq.top();
        pq.pop();
        out.push_back(v);
        if (idx + 1 < (int)lists[li].size()) pq.push({lists[li][idx + 1], li, idx + 1});  //@gap
    }
    return out;
}

int main() {
    vector<vector<int>> lists = {{1, 4, 7}, {2, 5, 8}, {0, 6}};
    vector<int> out = mergeK(lists);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    return 0;
}`,
      keyLines: [
        { match: 'using Item = tuple<int, int, int>;', note: 'Tuples compare lexicographically, so the value decides first.' },
        { match: 'if (!lists[i].empty()) pq.push({lists[i][0], i, 0});', note: 'Seed the heap with each list\'s head.' },
        { match: 'if (idx + 1 < (int)lists[li].size()) pq.push({lists[li][idx + 1], li, idx + 1});', note: 'Replace the popped head with its successor.' },
      ],
      dryRun: {
        columns: ['pop', 'output so far', 'heap after push'],
        rows: [
          ['0 (list 2)', '0', '1, 2, 6'],
          ['1 (list 0)', '0 1', '2, 4, 6'],
          ['2 (list 1)', '0 1 2', '4, 5, 6'],
          ['4 (list 0)', '0 1 2 4', '5, 6, 7'],
        ],
      },
      complexity: { time: 'O(N log k)', space: 'O(k)', why: 'N pops and pushes on a heap holding at most one head per list.' },
      edgeCases: ['Empty lists are skipped', 'k = 1 just copies the list'],
      mistakes: ['Pushing all N elements at once (O(N log N), more memory)'],
      tryIt: 'Count how many times the heap size is exactly k during the merge.',
    },
    complexityNotes: 'Heap push/pop are O(log size). Bounding the heap to k items keeps memory O(k) and time O(n log k). Building a heap from n items with make_heap is O(n).',
    quiz: [
      {
        prompt: 'In an array-based heap, what are the children of index 4?',
        options: ['8 and 9', '9 and 10', '5 and 6', '2 and 3'],
        answer: 1,
        explanation: '2i + 1 = 9 and 2i + 2 = 10.',
      },
      {
        prompt: 'To keep the k largest values of a stream, which heap do you maintain?',
        options: ['Max-heap of all values', 'Min-heap of size k', 'Max-heap of size k', 'No heap'],
        answer: 1,
        explanation: 'The min-heap\'s top is the weakest candidate — the one to evict.',
      },
      {
        prompt: 'What does priority_queue<int> pq; pq.top() return?',
        options: ['The smallest element', 'The largest element', 'The first inserted element', 'A random element'],
        answer: 1,
        explanation: 'std::priority_queue is a max-heap by default.',
      },
    ],
    recap: 'Heaps keep the best item available in O(1) with O(log n) updates. Bounded heaps answer top-K in O(n log k), and heaps of heads merge k sorted lists.',
    nextPrep: 'Tomorrow: binary trees and depth-first traversals.',
  },
  questions: [
    {
      id: 'd15-last-stone',
      day: 15,
      title: 'Smash the Heaviest Stones',
      difficulty: 'Easy',
      topic: 'stacks-queues',
      patterns: ['heap-greedy'],
      objective: 'Simulate repeated "take the two largest" with a max-heap.',
      statement: 'Repeatedly take the two heaviest stones x ≥ y. If equal, both disappear; otherwise a stone of weight x − y remains. Print the final stone weight (0 if none).',
      constraints: ['1 ≤ n ≤ 30', '1 ≤ weight ≤ 1000'],
      examples: [{ input: 'w = [2, 7, 4, 1, 8, 1]', output: '1' }],
      edgeCases: ['One stone', 'All equal pairs'],
      cues: ['Repeatedly need the two largest → max-heap'],
      hints: ['Pop two, push the difference if non-zero.'],
      approach: 'Max-heap simulation.',
      correctness: 'Each step follows the rules exactly with the two largest current stones.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'At most n rounds of heap operations.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int lastStone(const vector<int>& w) {
    priority_queue<int> pq(w.begin(), w.end());
    while (pq.size() > 1) {
        int x = pq.top(); pq.pop();
        int y = pq.top(); pq.pop();
        if (x != y) pq.push(x - y);
    }
    return pq.empty() ? 0 : pq.top();
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
      io: 'Input: n, then n weights. Output: final weight.',
      keyLines: [{ match: 'priority_queue<int> pq(w.begin(), w.end());', note: 'Range constructor builds the heap in O(n).' }],
      mistakes: ['Re-sorting the array every round (O(n² log n))'],
      tests: [
        { in: '6\n2 7 4 1 8 1', out: '1' },
        { in: '1\n5', out: '5' },
        { in: '2\n3 3', out: '0' },
        { in: '3\n10 4 2', out: '4' },
      ],
      viz: 'heap',
    },
    {
      id: 'd15-kth-largest',
      day: 15,
      title: 'K-th Highest Score',
      difficulty: 'Easy',
      topic: 'stacks-queues',
      patterns: ['top-k'],
      objective: 'Use a bounded min-heap.',
      statement: 'Print the k-th largest value (counting duplicates).',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4', output: '4' }],
      edgeCases: ['k = 1', 'k = n', 'Duplicates'],
      cues: ['k-th largest → min-heap of size k'],
      hints: ['Keep only k values in a min-heap.', 'The top is the answer.'],
      approach: 'Bounded min-heap.',
      correctness: 'The heap holds the k largest; the smallest of them is the k-th largest.',
      complexity: { time: 'O(n log k)', space: 'O(k)', why: 'n heap operations of size ≤ k.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int kthLargest(const vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int x : a) {
        pq.push(x);
        if ((int)pq.size() > k) pq.pop();
    }
    return pq.top();
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
      io: 'Input: n k, then n integers. Output: the k-th largest.',
      keyLines: [{ match: 'if ((int)pq.size() > k) pq.pop();', note: 'Evict the smallest candidate.' }],
      mistakes: ['Sorting descending is O(n log n) — acceptable but not optimal for k ≪ n'],
      tests: [
        { in: '9 4\n3 2 3 1 2 4 5 5 6', out: '4' },
        { in: '6 2\n3 2 1 5 6 4', out: '5' },
        { in: '1 1\n7', out: '7' },
        { in: '3 3\n9 9 9', out: '9' },
      ],
    },
    {
      id: 'd15-connect-ropes',
      day: 15,
      title: 'Cheapest Rope Joining',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['heap-greedy', 'activity-selection'],
      objective: 'Greedy: always combine the two cheapest items.',
      statement: 'Joining two ropes of lengths a and b costs a + b and yields a rope of length a + b. Print the minimum total cost to join all ropes into one.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ length ≤ 10⁴'],
      examples: [{ input: 'ropes = [4, 3, 2, 6]', output: '29' }],
      edgeCases: ['One rope → 0', 'Large totals (64-bit)'],
      cues: ['Repeatedly merge the two smallest (Huffman-style) → min-heap'],
      hints: ['Long ropes should be added as few times as possible.', 'Always join the two shortest.'],
      approach: 'Min-heap; pop two, add cost, push the sum.',
      correctness: 'Exchange argument (Huffman): the two shortest ropes can always be siblings at the deepest level of an optimal merge tree.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'n − 1 merges with heap operations.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

long long minJoinCost(const vector<long long>& r) {
    priority_queue<long long, vector<long long>, greater<long long>> pq(r.begin(), r.end());
    long long cost = 0;
    while (pq.size() > 1) {
        long long a = pq.top(); pq.pop();
        long long b = pq.top(); pq.pop();
        cost += a + b;
        pq.push(a + b);
    }
    return cost;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> r(n);
    for (auto& x : r) cin >> x;
    cout << minJoinCost(r) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lengths. Output: minimum cost.',
      keyLines: [{ match: 'cost += a + b;', note: 'Each join pays the combined length.' }],
      mistakes: ['Joining in input order', 'Sorting once (the merged rope must re-enter the order)'],
      tests: [
        { in: '4\n4 3 2 6', out: '29' },
        { in: '1\n10', out: '0' },
        { in: '3\n1 2 3', out: '9' },
        { in: '5\n5 5 5 5 5', out: '60' },
      ],
    },
    {
      id: 'd15-top-k-frequent',
      day: 15,
      title: 'Most Requested Songs',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['top-k', 'frequency-counting'],
      objective: 'Combine a frequency map with a bounded heap.',
      statement: 'Print the k most frequent song ids, ordered by frequency descending and then by id ascending.',
      constraints: ['1 ≤ k ≤ number of distinct ids ≤ n ≤ 10⁵'],
      examples: [{ input: 'ids = [1, 1, 1, 2, 2, 3], k = 2', output: '1 2' }],
      edgeCases: ['Ties in frequency', 'k equals the number of distinct ids'],
      cues: ['"k most frequent" → count, then top-k by (frequency, id)'],
      hints: ['Count with a hash map.', 'Keep a min-heap of the k best (freq, −id) pairs, or sort the distinct ids.'],
      approach: 'Frequency map + min-heap of size k keyed by (freq, −id); output in reverse pop order.',
      correctness: 'The heap keeps the k best by the required ordering; popping gives them worst-first.',
      complexity: { time: 'O(n + d log k)', space: 'O(d)', why: 'd distinct ids.' },
      cpp: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <unordered_map>
#include <vector>
using namespace std;

vector<int> topKFrequent(const vector<int>& a, int k) {
    unordered_map<int, int> freq;
    for (int x : a) freq[x]++;
    // (frequency, -id): larger is better. Min-heap evicts the worst.
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    for (auto& [id, f] : freq) {
        pq.push({f, -id});
        if ((int)pq.size() > k) pq.pop();
    }
    vector<int> out;
    while (!pq.empty()) {
        out.push_back(-pq.top().second);
        pq.pop();
    }
    reverse(out.begin(), out.end());
    return out;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    vector<int> out = topKFrequent(a, k);
    for (int i = 0; i < k; i++) cout << out[i] << (i + 1 < k ? " " : "\n");
    return 0;
}`,
      io: 'Input: n k, then n ids. Output: k ids.',
      keyLines: [{ match: 'pq.push({f, -id});', note: 'Negating the id makes smaller ids rank higher on ties.' }],
      mistakes: ['Ignoring the tie-break rule'],
      tests: [
        { in: '6 2\n1 1 1 2 2 3', out: '1 2' },
        { in: '1 1\n5', out: '5' },
        { in: '6 2\n4 4 3 3 2 2', out: '2 3' },
        { in: '7 3\n9 8 8 7 7 7 9', out: '7 8 9' },
      ],
    },
    {
      id: 'd15-k-closest',
      day: 15,
      title: 'Nearest Charging Stations',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['top-k'],
      objective: 'Bounded max-heap on squared distances.',
      statement: 'Given n points and k, print the k points closest to the origin, sorted by distance and then by x, then y.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁴', '|x|, |y| ≤ 10⁴'],
      examples: [{ input: 'points = (1,3), (-2,2), (5,-1), k = 1', output: '-2 2' }],
      edgeCases: ['Equal distances', 'Point at the origin'],
      cues: ['k smallest by a key → max-heap of size k'],
      hints: ['Compare squared distances to avoid sqrt.', 'Keep a max-heap of size k keyed by (dist², x, y).'],
      approach: 'Bounded max-heap, then sort the survivors.',
      correctness: 'The max-heap top is the worst of the k best; anything worse is evicted.',
      complexity: { time: 'O(n log k + k log k)', space: 'O(k)', why: 'Heap of size k plus final sort.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

vector<tuple<long long, int, int>> kClosest(const vector<pair<int, int>>& p, int k) {
    priority_queue<tuple<long long, int, int>> pq;  // max-heap
    for (auto [x, y] : p) {
        pq.push({1LL * x * x + 1LL * y * y, x, y});
        if ((int)pq.size() > k) pq.pop();
    }
    vector<tuple<long long, int, int>> out;
    while (!pq.empty()) {
        out.push_back(pq.top());
        pq.pop();
    }
    sort(out.begin(), out.end());
    return out;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<pair<int, int>> p(n);
    for (auto& [x, y] : p) cin >> x >> y;
    for (auto [d, x, y] : kClosest(p, k)) cout << x << " " << y << "\n";
    return 0;
}`,
      io: 'Input: n k, then n points. Output: k points, one per line.',
      keyLines: [{ match: 'pq.push({1LL * x * x + 1LL * y * y, x, y});', note: 'Squared distance in 64-bit; no floating point.' }],
      mistakes: ['Using sqrt and comparing doubles'],
      tests: [
        { in: '3 1\n1 3\n-2 2\n5 -1', out: '-2 2' },
        { in: '3 2\n3 3\n5 -1\n-2 4', out: '3 3\n-2 4' },
        { in: '1 1\n0 0', out: '0 0' },
        { in: '4 2\n1 0\n0 1\n-1 0\n0 -1', out: '-1 0\n0 -1' },
      ],
    },
    {
      id: 'd15-merge-k-sorted',
      day: 15,
      title: 'Merge K Sorted Logs',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['heap-greedy', 'merge-sort'],
      objective: 'K-way merge with a heap of heads.',
      statement: 'Given k sorted lists, print their merged sorted sequence.',
      constraints: ['1 ≤ k ≤ 10⁴', 'Total N ≤ 10⁵'],
      examples: [{ input: '[1,4,5], [1,3,4], [2,6]', output: '1 1 2 3 4 4 5 6' }],
      edgeCases: ['Empty lists', 'k = 1'],
      cues: ['Many sorted inputs → heap of current heads'],
      hints: ['Push (value, list, index) for each non-empty list.', 'Pop the smallest, push its successor.'],
      approach: 'Example B.',
      correctness: 'The smallest remaining element is always among the heads.',
      complexity: { time: 'O(N log k)', space: 'O(k)', why: 'One heap operation pair per output element.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

vector<int> mergeK(const vector<vector<int>>& L) {
    using T = tuple<int, int, int>;
    priority_queue<T, vector<T>, greater<T>> pq;
    for (int i = 0; i < (int)L.size(); i++)
        if (!L[i].empty()) pq.push({L[i][0], i, 0});
    vector<int> out;
    while (!pq.empty()) {
        auto [v, i, j] = pq.top();
        pq.pop();
        out.push_back(v);
        if (j + 1 < (int)L[i].size()) pq.push({L[i][j + 1], i, j + 1});
    }
    return out;
}`,
      main: cpp`
int main() {
    int k;
    cin >> k;
    vector<vector<int>> L(k);
    for (auto& l : L) {
        int m;
        cin >> m;
        l.resize(m);
        for (auto& x : l) cin >> x;
    }
    vector<int> out = mergeK(L);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "");
    cout << "\n";
    return 0;
}`,
      io: 'Input: k, then each list as "m v1 … vm". Output: merged sequence.',
      keyLines: [{ match: 'if (j + 1 < (int)L[i].size()) pq.push({L[i][j + 1], i, j + 1});', note: 'Advance within the same list.' }],
      mistakes: ['Concatenate-then-sort works but is O(N log N)'],
      tests: [
        { in: '3\n3 1 4 5\n3 1 3 4\n2 2 6', out: '1 1 2 3 4 4 5 6' },
        { in: '2\n0\n1 7', out: '7' },
        { in: '1\n3 1 2 3', out: '1 2 3' },
        { in: '2\n2 -5 0\n2 -6 9', out: '-6 -5 0 9' },
      ],
    },
    {
      id: 'd15-reorganize-string',
      day: 15,
      title: 'No Two Neighbours Alike',
      difficulty: 'Medium',
      topic: 'stacks-queues',
      patterns: ['heap-greedy', 'frequency-counting'],
      objective: 'Greedily place the most frequent remaining letter that differs from the last one.',
      statement: 'Rearrange a lowercase string so no two adjacent characters are equal. Among valid answers, build it greedily: at each step take the most frequent remaining letter (ties → alphabetically smaller) that differs from the previous one. Print the result or `impossible`.',
      constraints: ['1 ≤ |s| ≤ 500'],
      examples: [{ input: 's = "aab"', output: 'aba' }],
      edgeCases: ['One letter more than half the length → impossible', 'Single character'],
      cues: ['Always use the most plentiful letter while avoiding the previous one → max-heap'],
      hints: ['Impossible if some count > (n + 1) / 2.', 'Pop the best letter; if it equals the previous, pop the second best instead.', 'Push letters back while they still have copies.'],
      approach: 'Max-heap of (count, −letter); hold back the letter used last.',
      correctness: 'Using the most frequent letter whenever allowed never creates a dead end when no count exceeds (n + 1)/2.',
      complexity: { time: 'O(n log 26)', space: 'O(26)', why: 'n placements with a tiny heap.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <string>
using namespace std;

string reorganize(const string& s) {
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;
    priority_queue<pair<int, int>> pq;  // (count, -letter)
    for (int c = 0; c < 26; c++)
        if (cnt[c]) {
            if (cnt[c] > ((int)s.size() + 1) / 2) return "impossible";
            pq.push({cnt[c], -c});
        }
    string out;
    while (!pq.empty()) {
        auto first = pq.top();
        pq.pop();
        if (!out.empty() && out.back() == char('a' - first.second)) {
            if (pq.empty()) return "impossible";
            auto second = pq.top();
            pq.pop();
            out += char('a' - second.second);
            if (--second.first) pq.push(second);
            pq.push(first);
        } else {
            out += char('a' - first.second);
            if (--first.first) pq.push(first);
        }
    }
    return out;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << reorganize(s) << "\n";
    return 0;
}`,
      io: 'Input: a string. Output: rearranged string or "impossible".',
      keyLines: [{ match: "if (!out.empty() && out.back() == char('a' - first.second)) {", note: 'The best letter cannot repeat the previous one — use the runner-up.' }],
      mistakes: ['Not checking the (n + 1)/2 bound'],
      tests: [
        { in: 'aab', out: 'aba' },
        { in: 'aaab', out: 'impossible' },
        { in: 'z', out: 'z' },
        { in: 'aabbcc', out: 'abcabc' },
      ],
    },
    {
      id: 'd15-smallest-range',
      day: 15,
      title: 'Narrowest Window Over K Lists',
      difficulty: 'Hard',
      topic: 'stacks-queues',
      patterns: ['heap-greedy', 'sliding-window-variable'],
      objective: 'Track the min with a heap and the max with a variable.',
      statement: 'Given k sorted lists, find the smallest range [a, b] that includes at least one number from each list. Smaller means b − a smaller, then a smaller. Print a and b.',
      constraints: ['1 ≤ k ≤ 3500', 'Total elements ≤ 10⁵'],
      examples: [{ input: '[4,10,15,24,26], [0,9,12,20], [5,18,22,30]', output: '20 24' }],
      edgeCases: ['k = 1 → [x, x] for the smallest x', 'Equal values across lists'],
      cues: ['One pointer per list + current min/max → heap of heads with running max'],
      hints: ['Start with each list\'s first element; the range is [heap min, current max].', 'To shrink, advance the list that holds the minimum.', 'Stop when a list is exhausted.'],
      approach: 'Min-heap of heads; track max; update the best range each iteration.',
      correctness: 'Only advancing the minimum can produce a smaller valid range; the procedure visits every candidate left endpoint.',
      complexity: { time: 'O(N log k)', space: 'O(k)', why: 'Each element enters the heap once.' },
      cpp: cpp`
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

pair<int, int> smallestRange(const vector<vector<int>>& L) {
    using T = tuple<int, int, int>;
    priority_queue<T, vector<T>, greater<T>> pq;
    int curMax = INT_MIN;
    for (int i = 0; i < (int)L.size(); i++) {
        pq.push({L[i][0], i, 0});
        curMax = max(curMax, L[i][0]);
    }
    pair<int, int> best = {get<0>(pq.top()), curMax};
    while (true) {
        auto [v, i, j] = pq.top();
        pq.pop();
        if ((long long)curMax - v < (long long)best.second - best.first) best = {v, curMax};
        if (j + 1 == (int)L[i].size()) break;
        int nxt = L[i][j + 1];
        curMax = max(curMax, nxt);
        pq.push({nxt, i, j + 1});
    }
    return best;
}`,
      main: cpp`
int main() {
    int k;
    cin >> k;
    vector<vector<int>> L(k);
    for (auto& l : L) {
        int m;
        cin >> m;
        l.resize(m);
        for (auto& x : l) cin >> x;
    }
    auto [a, b] = smallestRange(L);
    cout << a << " " << b << "\n";
    return 0;
}`,
      io: 'Input: k, then each list as "m v1 … vm" (non-empty). Output: a b.',
      keyLines: [{ match: 'if ((long long)curMax - v < (long long)best.second - best.first) best = {v, curMax};', note: 'Strict < keeps the earlier (smaller a) range on ties.' }],
      mistakes: ['Advancing a list other than the one holding the minimum'],
      tests: [
        { in: '3\n5 4 10 15 24 26\n4 0 9 12 20\n4 5 18 22 30', out: '20 24' },
        { in: '3\n3 1 2 3\n3 1 2 3\n3 1 2 3', out: '1 1' },
        { in: '1\n3 5 6 7', out: '5 5' },
        { in: '2\n2 1 10\n2 4 20', out: '1 4' },
      ],
    },
  ],
};

export default day;
