import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 4,
    title: 'Two Pointers',
    zone: 'two-pointers',
    objectives: [
      'Use opposite-direction pointers on sorted data to discard many pairs per step',
      'Use same-direction (read/write) pointers to transform arrays in place',
      'State and maintain the invariant that justifies each pointer move',
      'Extend pair search to triplets by fixing one element',
    ],
    prerequisites: ['Day 1: in-place array updates', 'Day 2: complement lookup (for comparison)'],
    lesson: [
      {
        heading: 'Opposite-direction pointers',
        body: 'Put `left` at the start and `right` at the end of a **sorted** array. If `a[left] + a[right]` is too small, no pair using this `left` can work (every other partner is ≤ `a[right]`), so `left++`. If it is too large, `right--`. Each step discards a whole row or column of the n×n pair table, so the scan is O(n).',
      },
      {
        heading: 'Same-direction pointers',
        body: 'A **read** pointer scans every element; a **write** pointer marks where the next kept element goes. Everything before `write` is the finished result. This removes duplicates, filters values or partitions an array in O(n) time and O(1) extra space.',
      },
      {
        heading: 'Invariants make pointer code correct',
        body: 'Write down what is true at the top of each loop iteration, e.g. "if a valid pair exists, it lies within [left, right]" or "a[0..write) contains the kept elements in order". Initialisation must make it true and each move must preserve it. Most off-by-one bugs are invariant violations.',
      },
      {
        heading: 'From pairs to triplets',
        body: 'For 3Sum, sort, fix the first element `i`, then run the pair search on `i + 1 .. n − 1`. Skip equal neighbours to avoid duplicate triplets. Total O(n²) — far better than O(n³).',
      },
    ],
    recognition: [
      'Sorted input (or you may sort) + pair/triplet with a target → opposite pointers.',
      '"In place", "O(1) extra space", "remove/move elements" → read/write pointers.',
      'Palindromes and symmetric checks → pointers moving inward from both ends.',
      'Unsorted data where original indices matter → prefer hashing (Day 2).',
    ],
    patterns: ['two-pointers-opposite', 'two-pointers-same', 'in-place-transform', 'invariant-reasoning'],
    visualizations: ['two-pointers'],
    exampleA: {
      id: 'd04-A',
      title: 'Pair sum in a sorted array',
      goal: 'Find two positions in a sorted array whose values add up to the target.',
      input: 'a = {1, 3, 4, 6, 8, 11}, target = 10',
      output: 'pair at 2 3 (4 + 6)',
      idea: 'Compare the current sum with the target. Too small → the smallest value cannot be in any answer with the remaining partners, move left. Too large → the largest value is useless, move right.',
      code: TRACE_CODE['pair-sum-sorted'],
      keyLines: [
        { match: 'int left = 0, right = (int)a.size() - 1;', note: 'Start with the widest pair. The cast avoids unsigned wrap-around on an empty vector.' },
        { match: 'while (left < right) {', note: 'Strict <: a pair needs two different indices.' },
        { match: 'if (sum < target) left++;', note: 'Every pair (left, j ≤ right) has sum ≤ current sum < target — discard all of them.' },
        { match: 'else right--;', note: 'Every pair (i ≥ left, right) has sum ≥ current sum > target — discard all of them.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each iteration moves one pointer inward; they meet after at most n − 1 moves.' },
      edgeCases: ['Empty or single-element array: the loop never runs', 'No solution: pointers meet and {-1, -1} is returned', 'Duplicates: works unchanged'],
      mistakes: ['Using <= in the loop condition (pairs an element with itself)', 'Applying the technique to unsorted data'],
      tryIt: 'Modify pairSum to count all pairs (i < j) with sum ≤ target in O(n). Hint: when a[left] + a[right] ≤ target, every j in (left, right] works with left.',
      trace: { id: 'pair-sum-sorted', input: { a: [1, 3, 4, 6, 8, 11], target: 10 } },
      bug: {
        find: 'if (sum < target) left++;',
        replace: 'if (sum > target) left++;',
        symptom: 'For target 10 the program prints "no pair" although 4 + 6 = 10.',
        explanation: 'When the sum is too large, increasing left makes it even larger. The comparison must move left only when the sum is too small.',
      },
    },
    exampleB: {
      id: 'd04-B',
      kind: 'variant',
      title: 'Remove duplicates in place (read/write pointers)',
      goal: 'Keep one copy of each value of a sorted array in place and report the new length.',
      input: 'a = {1, 1, 2, 3, 3, 3, 5}',
      output: 'k = 4\n1 2 3 5',
      idea: 'The read pointer visits everything. A value is new exactly when it differs from the last kept value a[write − 1]; only then copy it to a[write].',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

// Returns k; a[0..k) holds the distinct values in order.
int removeDuplicates(vector<int>& a) {
    if (a.empty()) return 0;
    int write = 1;
    for (int read = 1; read < (int)a.size(); read++) {
        if (a[read] != a[write - 1]) {
            a[write] = a[read];
            write++;
        }
    }
    return write;
}

int main() {
    vector<int> a = {1, 1, 2, 3, 3, 3, 5};
    int k = removeDuplicates(a);
    cout << "k = " << k << "\n";
    for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? " " : "\n");
    return 0;
}`,
      keyLines: [
        { match: 'int write = 1;', note: 'a[0] is always kept, so writing starts at index 1.' },
        { match: 'if (a[read] != a[write - 1]) {', note: 'Compare with the last kept value, not with a[read − 1].' },
        { match: 'a[write] = a[read];', note: 'Safe: write ≤ read, so we never overwrite unread data.' },
      ],
      dryRun: {
        columns: ['read', 'a[read]', 'a[write−1]', 'action', 'write after', 'a[0..write)'],
        rows: [
          ['1', '1', '1', 'skip', '1', '1'],
          ['2', '2', '1', 'copy', '2', '1 2'],
          ['3', '3', '2', 'copy', '3', '1 2 3'],
          ['4', '3', '3', 'skip', '3', '1 2 3'],
          ['5', '3', '3', 'skip', '3', '1 2 3'],
          ['6', '5', '3', 'copy', '4', '1 2 3 5'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One forward pass; only two integer indices are stored.' },
      edgeCases: ['Empty vector returns 0', 'All values equal → k = 1', 'Already distinct → k = n'],
      mistakes: ['Calling erase() inside the loop (O(n²) and invalidates indices)', 'Comparing with a[read − 1] after earlier writes changed the array'],
      tryIt: 'Allow each value to appear at most twice: compare a[read] with a[write − 2].',
    },
    complexityNotes: 'Both pointer styles are O(n) because each pointer only moves forward (or inward) and each move is O(1). Sorting first adds O(n log n).',
    quiz: [
      {
        prompt: 'In a sorted array, a[left] + a[right] > target. Which move is justified?',
        options: ['left++', 'right--', 'Both', 'Restart from the middle'],
        answer: 1,
        explanation: 'a[right] paired with any remaining left is at least the current sum, which is already too big.',
      },
      {
        prompt: 'Why does 3Sum with a fixed first element plus two pointers run in O(n²)?',
        options: ['Sorting is O(n²)', 'n choices of the first element × an O(n) pointer scan', 'Hashing collisions', 'Recursion depth'],
        answer: 1,
        explanation: 'The outer loop runs n times and each inner two-pointer pass is linear.',
      },
      {
        prompt: 'In remove-duplicates, what does a[0..write) represent?',
        options: ['Unread elements', 'The distinct values kept so far, in order', 'Duplicates', 'Garbage values'],
        answer: 1,
        explanation: 'That is the loop invariant of the write pointer.',
      },
    ],
    optimize: {
      prompt: 'The brute-force pair search checks n(n−1)/2 pairs. What does one pointer move eliminate?',
      options: ['A single pair', 'All remaining pairs that use the discarded element', 'Half of the array always', 'Nothing until the end'],
      answer: 1,
      explanation: 'Sortedness proves that every pair involving the discarded endpoint is too small (or too large).',
    },
    recap: 'Opposite pointers exploit sorted order to discard whole groups of pairs; read/write pointers rewrite arrays in place. Both are O(n) and rely on a clear invariant.',
    nextPrep: 'Tomorrow: sliding windows — two same-direction pointers that bound a contiguous range.',
  },
  questions: [
    {
      id: 'd04-valid-palindrome',
      day: 4,
      title: 'Mirror Sentence',
      difficulty: 'Easy',
      topic: 'two-pointers',
      patterns: ['two-pointers-opposite'],
      objective: 'Skip irrelevant characters while moving pointers inward.',
      statement: 'A sentence (one line, may contain spaces and punctuation) is a palindrome if, after keeping only letters and digits and ignoring case, it reads the same both ways. Print `true` or `false`.',
      constraints: ['1 ≤ length ≤ 2·10⁵', 'Printable ASCII'],
      examples: [{ input: 'A man, a plan, a canal: Panama', output: 'true' }],
      edgeCases: ['Only punctuation → true', 'Mixed case', 'Digits'],
      cues: ['Symmetric comparison from both ends → opposite pointers'],
      hints: ['Compare the first and last relevant characters.', 'Advance a pointer while it sits on a non-alphanumeric character.', 'Compare with tolower on both sides.'],
      approach: 'left/right pointers skip non-alphanumerics and compare lowercased characters until they meet.',
      correctness: 'Each comparison checks one mirrored pair of relevant characters; all pairs are checked before the pointers cross.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each pointer moves at most n times.' },
      cpp: cpp`
#include <cctype>
#include <iostream>
#include <string>
using namespace std;

bool isPalindrome(const string& s) {
    int l = 0, r = (int)s.size() - 1;
    while (l < r) {
        if (!isalnum((unsigned char)s[l])) { l++; continue; }
        if (!isalnum((unsigned char)s[r])) { r--; continue; }
        if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
        l++;
        r--;
    }
    return true;
}`,
      main: cpp`
int main() {
    string s;
    getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: one line of text. Output: true or false.',
      keyLines: [
        { match: 'if (!isalnum((unsigned char)s[l])) { l++; continue; }', note: 'Cast to unsigned char: passing a negative char to isalnum is undefined behaviour.' },
        { match: 'getline(cin, s);', note: 'Reads the whole line including spaces.' },
      ],
      mistakes: ['Building a cleaned copy (fine, but O(n) extra space)', 'Using cin >> s (stops at the first space)'],
      tests: [
        { in: 'A man, a plan, a canal: Panama', out: 'true' },
        { in: 'race a car', out: 'false' },
        { in: '.,!', out: 'true' },
        { in: 'No 1 2on', out: 'false' },
      ],
      viz: 'two-pointers',
    },
    {
      id: 'd04-squares-sorted',
      day: 4,
      title: 'Sorted Squares',
      difficulty: 'Easy',
      topic: 'two-pointers',
      patterns: ['two-pointers-opposite'],
      objective: 'Fill the output from the largest end.',
      statement: 'Given a non-decreasing array (may contain negatives), print the squares of all elements in non-decreasing order.',
      constraints: ['1 ≤ n ≤ 10⁵', '−10⁴ ≤ a[i] ≤ 10⁴'],
      examples: [{ input: 'a = [-4, -1, 0, 3, 10]', output: '0 1 9 16 100' }],
      edgeCases: ['All negative', 'All positive', 'Zeros'],
      cues: ['Largest square is at one of the two ends'],
      hints: ['Squaring breaks the order only because of negatives.', 'The largest absolute value is at an end.', 'Fill the result from the back, taking the larger end each time.'],
      brute: 'Square everything and sort: O(n log n).',
      approach: 'Pointers at both ends; place the larger square at position k (from the back) and move that pointer.',
      correctness: 'The largest remaining square is always at one of the two ends of the remaining range.',
      complexity: { time: 'O(n)', space: 'O(n) for the output', why: 'One pass placing one value per step.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<long long> sortedSquares(const vector<long long>& a) {
    int n = a.size(), l = 0, r = n - 1;
    vector<long long> out(n);
    for (int k = n - 1; k >= 0; k--) {
        long long L = a[l] * a[l], R = a[r] * a[r];
        if (L > R) { out[k] = L; l++; }
        else { out[k] = R; r--; }
    }
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> out = sortedSquares(a);
    for (int i = 0; i < n; i++) cout << out[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n sorted integers. Output: sorted squares.',
      keyLines: [{ match: 'for (int k = n - 1; k >= 0; k--) {', note: 'Fill from the largest position downwards.' }],
      mistakes: ['Filling from the front (the smallest square is not at an end)'],
      tests: [
        { in: '5\n-4 -1 0 3 10', out: '0 1 9 16 100' },
        { in: '3\n-3 -2 -1', out: '1 4 9' },
        { in: '1\n0', out: '0' },
        { in: '4\n-7 -3 2 3', out: '4 9 9 49' },
      ],
    },
    {
      id: 'd04-remove-element',
      day: 4,
      title: 'Purge a Value In Place',
      difficulty: 'Easy',
      topic: 'two-pointers',
      patterns: ['two-pointers-same', 'in-place-transform'],
      objective: 'Use a write pointer to compact kept elements.',
      statement: 'Remove every occurrence of value v from the array in place, keeping the order of the remaining elements. Print the new length k and then the first k elements (print an empty second line if k = 0).',
      constraints: ['0 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [3, 2, 2, 3, 4], v = 3', output: '3\n2 2 4' }],
      edgeCases: ['Everything removed', 'Nothing removed', 'n = 0'],
      cues: ['"in place" + keep order → read/write pointers'],
      hints: ['Scan with a read pointer.', 'Copy a[read] to a[write] only if it is not v.'],
      approach: 'write = 0; for each element ≠ v: a[write++] = element.',
      correctness: 'Invariant: a[0..write) holds the kept elements seen so far, in order.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Single pass.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int removeValue(vector<int>& a, int v) {
    int write = 0;
    for (int x : a)
        if (x != v) a[write++] = x;
    return write;
}`,
      main: cpp`
int main() {
    int n, v;
    cin >> n >> v;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    int k = removeValue(a, v);
    cout << k << "\n";
    for (int i = 0; i < k; i++) cout << a[i] << (i + 1 < k ? " " : "");
    cout << "\n";
    return 0;
}`,
      io: 'Input: n v, then n integers. Output: k, then the kept elements.',
      keyLines: [{ match: 'if (x != v) a[write++] = x;', note: 'Range-for reads by value, so overwriting earlier slots is safe.' }],
      mistakes: ['Using erase in a loop (quadratic)'],
      tests: [
        { in: '5 3\n3 2 2 3 4', out: '3\n2 2 4' },
        { in: '3 1\n1 1 1', out: '0\n' },
        { in: '4 9\n1 2 3 4', out: '4\n1 2 3 4' },
        { in: '6 2\n0 1 2 2 3 2', out: '3\n0 1 3' },
      ],
    },
    {
      id: 'd04-merge-sorted',
      day: 4,
      title: 'Merge Two Sorted Lists of Scores',
      difficulty: 'Easy',
      topic: 'two-pointers',
      patterns: ['two-pointers-same', 'merge-sort'],
      objective: 'Merge two sorted sequences with one pointer each.',
      statement: 'Given two non-decreasing arrays, print their merged non-decreasing sequence.',
      constraints: ['0 ≤ n, m ≤ 10⁵'],
      examples: [{ input: 'a = [1, 4, 7], b = [2, 3, 9]', output: '1 2 3 4 7 9' }],
      edgeCases: ['One array empty', 'Equal values across arrays'],
      cues: ['Two sorted inputs → take the smaller head each time'],
      hints: ['Keep an index into each array.', 'Append the smaller current element and advance that index.', 'Copy the leftovers at the end.'],
      approach: 'Classic merge step from merge sort.',
      correctness: 'The smallest remaining element of the union is always one of the two current heads.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Every element is copied once.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

vector<int> mergeSorted(const vector<int>& a, const vector<int>& b) {
    vector<int> out;
    out.reserve(a.size() + b.size());
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cin >> m;
    vector<int> b(m);
    for (auto& x : b) cin >> x;
    vector<int> out = mergeSorted(a, b);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "");
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, n values, m, m values. Output: merged sequence.',
      keyLines: [
        { match: 'out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);', note: '<= takes from a first on ties, which keeps the merge stable.' },
        { match: 'out.reserve(a.size() + b.size());', note: 'Avoids repeated reallocation.' },
      ],
      mistakes: ['Forgetting the leftover copy loops'],
      tests: [
        { in: '3\n1 4 7\n3\n2 3 9', out: '1 2 3 4 7 9' },
        { in: '0\n2\n5 6', out: '5 6' },
        { in: '2\n1 1\n2\n1 1', out: '1 1 1 1' },
        { in: '1\n10\n0', out: '10' },
      ],
    },
    {
      id: 'd04-three-sum',
      day: 4,
      title: 'Zero-Sum Trios',
      difficulty: 'Medium',
      topic: 'two-pointers',
      patterns: ['two-pointers-opposite', 'custom-sort'],
      objective: 'Fix one element and run a pair search, skipping duplicates.',
      statement: 'Count the distinct value-triplets {x, y, z} (as multisets) from the array with x + y + z = 0, using three different positions.',
      constraints: ['3 ≤ n ≤ 3000', '−10⁵ ≤ a[i] ≤ 10⁵'],
      examples: [{ input: 'a = [-1, 0, 1, 2, -1, -4]', output: '2', explanation: '{-1, -1, 2} and {-1, 0, 1}' }],
      edgeCases: ['All zeros → 1', 'No solution', 'Many duplicates'],
      cues: ['Triplets with a target sum → sort + fix one + two pointers'],
      hints: ['Sort the array.', 'For each i, find pairs in (i, n) summing to −a[i] with two pointers.', 'Skip a[i] equal to a[i − 1], and skip equal neighbours after finding a pair.'],
      brute: 'Three nested loops plus a set for uniqueness: O(n³).',
      approach: 'Sort; for each distinct a[i], two-pointer search on the suffix, moving past duplicates after each match.',
      correctness: 'Sorting makes each distinct triplet appear in exactly one non-decreasing order; duplicate skipping visits each such order once.',
      complexity: { time: 'O(n²)', space: 'O(1) besides sorting', why: 'n outer iterations × O(n) pointer scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int countZeroTriplets(vector<int> a) {
    sort(a.begin(), a.end());
    int n = a.size(), count = 0;
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        int l = i + 1, r = n - 1;
        while (l < r) {
            long long s = (long long)a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                count++;
                int lv = a[l], rv = a[r];
                while (l < r && a[l] == lv) l++;
                while (l < r && a[r] == rv) r--;
            }
        }
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << countZeroTriplets(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: number of distinct zero-sum triplets.',
      keyLines: [
        { match: 'if (i > 0 && a[i] == a[i - 1]) continue;', note: 'Same first value → same set of triplets; skip it.' },
        { match: 'while (l < r && a[l] == lv) l++;', note: 'Move past every copy of the matched values.' },
      ],
      mistakes: ['Not skipping duplicates (overcounts)', 'Using a set of vectors (works but slower)'],
      tests: [
        { in: '6\n-1 0 1 2 -1 -4', out: '2' },
        { in: '5\n0 0 0 0 0', out: '1' },
        { in: '3\n1 2 3', out: '0' },
        { in: '7\n-2 0 1 1 2 -1 -4', out: '3' },
      ],
    },
    {
      id: 'd04-container-water',
      day: 4,
      title: 'Widest Reservoir',
      difficulty: 'Medium',
      topic: 'two-pointers',
      patterns: ['two-pointers-opposite', 'invariant-reasoning'],
      objective: 'Argue why moving the shorter wall is safe.',
      statement: 'n vertical walls have heights h[i] at x = i. Choose two walls to form a container with the x-axis; it holds min(h[i], h[j]) × (j − i) water. Print the maximum.',
      constraints: ['2 ≤ n ≤ 10⁵', '0 ≤ h[i] ≤ 10⁴'],
      examples: [{ input: 'h = [1, 8, 6, 2, 5, 4, 8, 3, 7]', output: '49' }],
      edgeCases: ['Two walls', 'Zero heights'],
      cues: ['Maximise over pairs; width shrinks as pointers move inward'],
      hints: ['Start with the widest container.', 'Moving the taller wall can never help: width shrinks and the height is still capped by the shorter wall.', 'Always move the shorter wall.'],
      brute: 'All pairs: O(n²).',
      approach: 'left = 0, right = n − 1; record area; move the pointer at the shorter wall.',
      correctness: 'Any container using the shorter wall with a closer partner has smaller width and height ≤ shorter wall, so it cannot beat the current one — discarding it is safe.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Pointers move inward n − 1 times total.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long maxWater(const vector<int>& h) {
    int l = 0, r = (int)h.size() - 1;
    long long best = 0;
    while (l < r) {
        best = max(best, (long long)min(h[l], h[r]) * (r - l));
        if (h[l] < h[r]) l++;
        else r--;
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    cout << maxWater(h) << "\n";
    return 0;
}`,
      io: 'Input: n, then n heights. Output: maximum water.',
      keyLines: [{ match: 'if (h[l] < h[r]) l++;', note: 'The shorter wall limits every container it is part of; drop it.' }],
      mistakes: ['Moving the taller wall'],
      tests: [
        { in: '9\n1 8 6 2 5 4 8 3 7', out: '49' },
        { in: '2\n1 1', out: '1' },
        { in: '5\n4 3 2 1 4', out: '16' },
        { in: '3\n0 0 0', out: '0' },
      ],
    },
    {
      id: 'd04-dutch-flag',
      day: 4,
      title: 'Three-Colour Sort',
      difficulty: 'Medium',
      topic: 'two-pointers',
      patterns: ['two-pointers-same', 'in-place-transform', 'invariant-reasoning'],
      objective: 'Partition into three regions in one pass with three pointers.',
      statement: 'An array contains only 0, 1 and 2. Sort it in place in a single pass without counting, then print it.',
      constraints: ['1 ≤ n ≤ 10⁵'],
      examples: [{ input: 'a = [2, 0, 2, 1, 1, 0]', output: '0 0 1 1 2 2' }],
      edgeCases: ['Only one colour', 'Already sorted'],
      cues: ['Three-way partition → low / mid / high pointers'],
      hints: ['Maintain regions: [0, low) zeros, [low, mid) ones, (high, n) twos.', 'Look at a[mid] and swap it into the right region.', 'Do not advance mid after swapping with high — the swapped-in value is unexamined.'],
      approach: 'Dijkstra\'s Dutch national flag: 0 → swap with low, low++, mid++; 1 → mid++; 2 → swap with high, high--.',
      correctness: 'Each step preserves the three-region invariant and shrinks the unknown region [mid, high] by one.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Each step decreases high − mid.' },
      cpp: cpp`
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

void sortColors(vector<int>& a) {
    int low = 0, mid = 0, high = (int)a.size() - 1;
    while (mid <= high) {
        if (a[mid] == 0) swap(a[low++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else swap(a[mid], a[high--]);
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    sortColors(a);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n values in {0,1,2}. Output: sorted array.',
      keyLines: [
        { match: 'else swap(a[mid], a[high--]);', note: 'mid is not advanced: the new a[mid] has not been classified yet.' },
        { match: 'if (a[mid] == 0) swap(a[low++], a[mid++]);', note: 'a[low] is known to be 1 (or low == mid), so mid can advance.' },
      ],
      mistakes: ['Incrementing mid after swapping with high'],
      tests: [
        { in: '6\n2 0 2 1 1 0', out: '0 0 1 1 2 2' },
        { in: '3\n2 1 0', out: '0 1 2' },
        { in: '1\n1', out: '1' },
        { in: '5\n2 2 2 0 0', out: '0 0 2 2 2' },
      ],
    },
    {
      id: 'd04-four-sum',
      day: 4,
      title: 'Four-Way Budget Split',
      difficulty: 'Hard',
      topic: 'two-pointers',
      patterns: ['two-pointers-opposite', 'custom-sort'],
      objective: 'Generalise k-sum: fix two elements, then two pointers.',
      statement: 'Count distinct value-quadruplets (as multisets, using four different positions) whose sum equals target.',
      constraints: ['4 ≤ n ≤ 200', '−10⁹ ≤ a[i], target ≤ 10⁹'],
      examples: [{ input: 'a = [1, 0, -1, 0, -2, 2], target = 0', output: '3' }],
      edgeCases: ['Sums overflow 32-bit (use long long)', 'All equal values', 'No solution'],
      cues: ['k-sum on sorted data → fix k − 2 elements + two pointers'],
      hints: ['Sort first.', 'Two nested loops fix a[i] and a[j]; two pointers find the rest.', 'Skip duplicates at every level and compute sums in 64-bit.'],
      brute: 'Four nested loops: O(n⁴).',
      approach: 'Sort; for i, for j > i (both skipping duplicates), run pair search on (j, n).',
      correctness: 'Identical to 3Sum with one more fixed level; each distinct quadruplet is generated exactly once in sorted order.',
      complexity: { time: 'O(n³)', space: 'O(1) besides sorting', why: 'O(n²) fixed pairs × O(n) pointer scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int countFourSum(vector<long long> a, long long target) {
    sort(a.begin(), a.end());
    int n = a.size(), count = 0;
    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;
            int l = j + 1, r = n - 1;
            while (l < r) {
                long long s = a[i] + a[j] + a[l] + a[r];
                if (s < target) l++;
                else if (s > target) r--;
                else {
                    count++;
                    long long lv = a[l], rv = a[r];
                    while (l < r && a[l] == lv) l++;
                    while (l < r && a[r] == rv) r--;
                }
            }
        }
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    long long target;
    cin >> n >> target;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << countFourSum(a, target) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n integers. Output: number of distinct quadruplets.',
      keyLines: [
        { match: 'if (j > i + 1 && a[j] == a[j - 1]) continue;', note: 'Duplicate skip for the second level starts after its first candidate.' },
        { match: 'long long s = a[i] + a[j] + a[l] + a[r];', note: 'Four values up to 10⁹ overflow int.' },
      ],
      mistakes: ['Skipping j duplicates with j > 0 instead of j > i + 1', 'int overflow in the sum'],
      tests: [
        { in: '6 0\n1 0 -1 0 -2 2', out: '3' },
        { in: '5 8\n2 2 2 2 2', out: '1' },
        { in: '4 -294967296\n1000000000 1000000000 1000000000 1000000000', out: '0' },
        { in: '4 4000000000\n1000000000 1000000000 1000000000 1000000000', out: '1' },
      ],
    },
  ],
};

export default day;
