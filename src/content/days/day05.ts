import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 5,
    title: 'Sliding Windows: Fixed and Variable',
    zone: 'sliding-window',
    objectives: [
      'Maintain the aggregate of a fixed-size window in O(1) per slide',
      'Grow and shrink a variable window while a constraint holds',
      'Explain when a sliding window is valid (monotone constraints) and when it is not',
      'Combine windows with frequency tables',
    ],
    prerequisites: ['Day 2: frequency counting', 'Day 4: same-direction pointers'],
    lesson: [
      {
        heading: 'What is a window?',
        body: 'A window is a contiguous range `[left, right]` of an array or string. Instead of recomputing an answer for each of the O(n²) subarrays, we move the window and update its state incrementally.',
      },
      {
        heading: 'Fixed-size windows',
        body: 'For "every window of length k", build the first window, then slide: **add** the element entering on the right and **remove** the one leaving on the left. Sum, counts and frequency tables update in O(1).',
      },
      {
        heading: 'Variable-size windows',
        body: 'Expand `right` one step at a time. While the window **violates** the constraint, shrink from `left`. After shrinking, the window `[left, right]` is the longest valid window ending at `right` (for "longest" problems), or record the length while it is valid (for "shortest" problems).',
      },
      {
        heading: 'When is the technique valid?',
        body: 'The constraint must be **monotone**: if a window is valid, every sub-window is valid too (or, for minimum problems, if a window satisfies "sum ≥ target", every super-window does). Non-negative numbers make sums monotone. With **negative numbers**, shrinking may increase the sum, so use prefix sums + hash map (Day 3) instead.',
      },
      {
        heading: 'Why O(n)?',
        body: '`left` and `right` only move forward, each at most n times. The inner `while` loop looks nested but its total work across the whole run is bounded by n — an amortised argument.',
      },
    ],
    recognition: [
      '"Contiguous subarray/substring" + "longest/shortest/maximum" → sliding window candidate.',
      'Fixed length k → fixed window.',
      '"At most k distinct", "no repeats", "sum ≥ target" with non-negative values → variable window.',
      'Negative numbers with a sum target → prefix sums instead.',
    ],
    patterns: ['sliding-window-fixed', 'sliding-window-variable', 'frequency-counting', 'amortized-analysis'],
    visualizations: ['sliding-window'],
    exampleA: {
      id: 'd05-A',
      title: 'Maximum sum of a window of size k',
      goal: 'Find the largest sum among all contiguous windows of exactly k elements.',
      input: 'a = {2, 1, 5, 1, 3, 2}, k = 3',
      output: 'max sum 9 starts at 2',
      idea: 'Consecutive windows share k − 1 elements. Sliding by one only adds a[right] and removes a[right − k].',
      code: TRACE_CODE['window-fixed'],
      keyLines: [
        { match: 'if (k > (int)a.size()) {', note: 'Guard: no window of size k exists.' },
        { match: 'for (int i = 0; i < k; i++) window += a[i];', note: 'Build the first full window once.' },
        { match: 'window += a[right] - a[right - k];', note: 'Slide: one element enters, one leaves — O(1).' },
        { match: 'bestStart = right - k + 1;', note: 'The window ending at right starts at right − k + 1.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'k steps to build the first window, then one O(1) update per remaining element.' },
      edgeCases: ['k = n: only one window', 'k > n: no window', 'Negative values: still valid for a fixed window'],
      mistakes: ['Recomputing each window sum from scratch (O(n·k))', 'Off-by-one in the start index'],
      tryIt: 'Print the average of every window instead of only the maximum.',
      trace: { id: 'window-fixed', input: { a: [2, 1, 5, 1, 3, 2], k: 3 } },
      bug: {
        find: 'window += a[right] - a[right - k];',
        replace: 'window += a[right] - a[right - k + 1];',
        symptom: 'The program prints "max sum 8 starts at 0" instead of 9 starting at 2.',
        explanation: 'The element leaving the window ending at right is a[right − k], not a[right − k + 1] (which is still inside the new window).',
      },
    },
    exampleB: {
      id: 'd05-B',
      kind: 'variant',
      title: 'Longest substring without repeating characters',
      goal: 'Find the longest contiguous substring whose characters are all distinct.',
      input: 's = "abcbdca"',
      output: 'longest 4 "bdca"',
      idea: 'Extend the window to the right. When the new character already appears inside the window, jump left just past its previous position. last[c] remembers where c was last seen.',
      code: TRACE_CODE['window-variable'],
      keyLines: [
        { match: 'vector<int> last(256, -1);', note: 'Last index of each byte value; −1 means never seen.' },
        { match: 'if (last[c] >= left) {', note: 'Only a repeat inside the current window matters; older positions are already outside.' },
        { match: 'left = last[c] + 1;', note: 'Jump directly past the duplicate instead of shrinking one step at a time.' },
        { match: 'if (right - left + 1 > best) {', note: 'After fixing the window it is valid, so its length is a candidate.' },
      ],
      complexity: { time: 'O(n)', space: 'O(1)', why: 'right advances n times; left only moves forward; the table has a fixed 256 entries.' },
      edgeCases: ['All characters equal → 1', 'All distinct → n', 'A repeat that lies before left (e.g. the final "a") must be ignored'],
      mistakes: ['Writing left = last[c] + 1 without the >= left check (left can move backwards)', 'Indexing with a signed char (negative index for non-ASCII bytes)'],
      tryIt: 'Change the constraint to "at most two distinct characters" using a count table and a while-shrink loop.',
      trace: { id: 'window-variable', input: { s: 'abcbdca' } },
    },
    complexityNotes: 'Both windows are O(n): each index enters the window once and leaves at most once. The state (sum, counts, last-seen table) is O(1) or O(alphabet).',
    quiz: [
      {
        prompt: 'Why does a variable sliding window fail for "longest subarray with sum = k" when values can be negative?',
        options: ['Windows need sorted input', 'Shrinking can increase the sum, so the shrink/grow rule is no longer monotone', 'Negative numbers cannot be stored', 'It becomes O(n log n)'],
        answer: 1,
        explanation: 'Monotonicity is what makes a single forward pass correct.',
      },
      {
        prompt: 'The inner while loop in a variable window can run many times for one right. Overall complexity?',
        options: ['O(n²)', 'O(n log n)', 'O(n) — left moves forward at most n times in total', 'O(k·n)'],
        answer: 2,
        explanation: 'Amortised analysis: total shrink steps ≤ n.',
      },
      {
        prompt: 'For a fixed window of size k ending at right, which element leaves when sliding?',
        options: ['a[right − k]', 'a[right − k + 1]', 'a[right − 1]', 'a[left + 1]'],
        answer: 0,
        explanation: 'The new window is [right − k + 1, right]; a[right − k] dropped out.',
      },
    ],
    recap: 'Fixed windows slide by adding one element and removing one; variable windows grow on the right and shrink on the left while invalid. Both are O(n) when the constraint is monotone.',
    nextPrep: 'Tomorrow: fast and slow pointers on linked lists. Review what a pointer to the next node is.',
  },
  questions: [
    {
      id: 'd05-max-average',
      day: 5,
      title: 'Best k-Day Average',
      difficulty: 'Easy',
      topic: 'sliding-window',
      patterns: ['sliding-window-fixed'],
      objective: 'Track a fixed window sum.',
      statement: 'Given n daily step counts and k, print the maximum average over any k consecutive days, rounded to exactly 2 decimal places.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵', '−10⁴ ≤ value ≤ 10⁴'],
      examples: [{ input: 'a = [1, 12, -5, -6, 50, 3], k = 4', output: '12.75' }],
      edgeCases: ['k = n', 'Negative values'],
      cues: ['"k consecutive" → fixed window'],
      hints: ['Maximising the average is the same as maximising the sum (k is fixed).', 'Slide a window sum.', 'Divide once at the end.'],
      approach: 'Fixed window maximum sum, then divide by k.',
      correctness: 'Average = sum / k with constant k, so the max-sum window is the max-average window.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One slide per element.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

double maxAverage(const vector<int>& a, int k) {
    long long window = 0;
    for (int i = 0; i < k; i++) window += a[i];
    long long best = window;
    for (int i = k; i < (int)a.size(); i++) {
        window += a[i] - a[i - k];
        best = max(best, window);
    }
    return (double)best / k;
}`,
      main: cpp`
#include <cstdio>
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    printf("%.2f\n", maxAverage(a, k));
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: the maximum average with two decimals.',
      keyLines: [{ match: 'return (double)best / k;', note: 'Cast before dividing to avoid integer division.' }],
      mistakes: ['Integer division', 'Comparing averages with floating point at every step (unnecessary)'],
      tests: [
        { in: '6 4\n1 12 -5 -6 50 3', out: '12.75' },
        { in: '1 1\n5', out: '5.00' },
        { in: '3 2\n-1 -2 -3', out: '-1.50' },
        { in: '5 5\n1 2 3 4 5', out: '3.00' },
      ],
      viz: 'sliding-window',
    },
    {
      id: 'd05-distinct-windows',
      day: 5,
      title: 'Windows With All-Distinct Values',
      difficulty: 'Easy',
      topic: 'sliding-window',
      patterns: ['sliding-window-fixed', 'frequency-counting'],
      objective: 'Maintain a frequency table inside a fixed window.',
      statement: 'Count how many windows of exactly k consecutive elements contain no repeated value.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁵', '1 ≤ value ≤ 10⁹'],
      examples: [{ input: 'a = [1, 2, 3, 2, 4, 5], k = 3', output: '3', explanation: '[1,2,3], [3,2,4], [2,4,5]' }],
      edgeCases: ['k = 1 → every window counts', 'All equal values'],
      cues: ['Fixed window + "distinct" → counts map and number of duplicated keys'],
      hints: ['Keep a frequency map for the window.', 'A window is distinct when the map has exactly k keys.', 'Erase keys whose count drops to 0.'],
      approach: 'Slide with a hash map; after each full window check map.size() == k.',
      correctness: 'Distinct keys equal k exactly when no value repeats among the k elements.',
      complexity: { time: 'O(n)', space: 'O(k)', why: 'O(1) average map update per slide.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int distinctWindows(const vector<int>& a, int k) {
    unordered_map<int, int> cnt;
    int result = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        cnt[a[i]]++;
        if (i >= k) {
            if (--cnt[a[i - k]] == 0) cnt.erase(a[i - k]);
        }
        if (i >= k - 1 && (int)cnt.size() == k) result++;
    }
    return result;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << distinctWindows(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: number of windows.',
      keyLines: [{ match: 'if (--cnt[a[i - k]] == 0) cnt.erase(a[i - k]);', note: 'Erase zero counts so size() equals the number of distinct values.' }],
      mistakes: ['Leaving zero-count keys in the map'],
      tests: [
        { in: '6 3\n1 2 3 2 4 5', out: '3' },
        { in: '4 1\n7 7 7 7', out: '4' },
        { in: '4 2\n5 5 5 5', out: '0' },
        { in: '5 5\n1 2 3 4 5', out: '1' },
      ],
    },
    {
      id: 'd05-min-subarray-len',
      day: 5,
      title: 'Shortest Burst Over Target',
      difficulty: 'Medium',
      topic: 'sliding-window',
      patterns: ['sliding-window-variable', 'monotonicity-detection'],
      objective: 'Shrink while the window is valid to find the minimum length.',
      statement: 'Given positive integers and a target, print the length of the shortest contiguous subarray with sum ≥ target, or 0 if none exists.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ a[i] ≤ 10⁴', '1 ≤ target ≤ 10⁹'],
      examples: [{ input: 'a = [2, 3, 1, 2, 4, 3], target = 7', output: '2', explanation: '[4, 3]' }],
      edgeCases: ['No valid subarray → 0', 'Single element ≥ target → 1'],
      cues: ['Positive numbers + "shortest with sum ≥ target" → variable window shrinking while valid'],
      hints: ['Positive values make the sum grow with the window.', 'Expand right; while sum ≥ target, record the length and shrink left.'],
      approach: 'for right: sum += a[right]; while sum ≥ target: best = min(best, len); sum −= a[left++].',
      correctness: 'For each right, shrinking stops at the smallest valid window ending at right; positivity guarantees no shorter valid window was skipped.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Both pointers move forward at most n times.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int minSubarrayLen(const vector<int>& a, long long target) {
    long long sum = 0;
    int left = 0, best = INT_MAX;
    for (int right = 0; right < (int)a.size(); right++) {
        sum += a[right];
        while (sum >= target) {
            best = min(best, right - left + 1);
            sum -= a[left++];
        }
    }
    return best == INT_MAX ? 0 : best;
}`,
      main: cpp`
int main() {
    int n;
    long long target;
    cin >> n >> target;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << minSubarrayLen(a, target) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n positive integers. Output: minimal length or 0.',
      keyLines: [{ match: 'while (sum >= target) {', note: 'while, not if: keep shrinking as long as the window stays valid.' }],
      mistakes: ['Using if instead of while', 'Returning INT_MAX when nothing was found'],
      tests: [
        { in: '6 7\n2 3 1 2 4 3', out: '2' },
        { in: '3 4\n1 4 4', out: '1' },
        { in: '8 11\n1 1 1 1 1 1 1 1', out: '0' },
        { in: '5 15\n1 2 3 4 5', out: '5' },
      ],
    },
    {
      id: 'd05-max-ones-k-flips',
      day: 5,
      title: 'Longest Lit Corridor',
      difficulty: 'Medium',
      topic: 'sliding-window',
      patterns: ['sliding-window-variable'],
      objective: 'Allow at most k "bad" elements inside the window.',
      statement: 'A corridor has n lamps (1 = on, 0 = off). You may switch on at most k lamps. Print the longest run of consecutive lit lamps you can achieve.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ k ≤ n'],
      examples: [{ input: 'a = [1,1,1,0,0,0,1,1,1,1,0], k = 2', output: '6' }],
      edgeCases: ['k = 0', 'k ≥ number of zeros → n'],
      cues: ['"at most k zeros in the window" → variable window counting zeros'],
      hints: ['Rephrase: longest window containing at most k zeros.', 'Count zeros in the window; shrink while zeros > k.'],
      approach: 'Expand right counting zeros; while zeros > k, move left (decrement zeros when a zero leaves); record the window length.',
      correctness: '"At most k zeros" is monotone: any sub-window of a valid window is valid.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Linear two-pointer scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int longestOnes(const vector<int>& a, int k) {
    int left = 0, zeros = 0, best = 0;
    for (int right = 0; right < (int)a.size(); right++) {
        if (a[right] == 0) zeros++;
        while (zeros > k) {
            if (a[left] == 0) zeros--;
            left++;
        }
        best = max(best, right - left + 1);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << longestOnes(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n bits. Output: longest achievable run.',
      keyLines: [{ match: 'while (zeros > k) {', note: 'Restore validity before measuring.' }],
      mistakes: ['Measuring before shrinking'],
      tests: [
        { in: '11 2\n1 1 1 0 0 0 1 1 1 1 0', out: '6' },
        { in: '4 0\n0 0 0 0', out: '0' },
        { in: '5 5\n0 1 0 1 0', out: '5' },
        { in: '7 1\n1 0 1 1 0 1 1', out: '5' },
      ],
    },
    {
      id: 'd05-k-distinct',
      day: 5,
      title: 'Playlist With At Most K Artists',
      difficulty: 'Medium',
      topic: 'sliding-window',
      patterns: ['sliding-window-variable', 'frequency-counting'],
      objective: 'Track the number of distinct keys in a variable window.',
      statement: 'A playlist is a lowercase string where each letter is an artist. Print the length of the longest contiguous segment with at most k distinct artists.',
      constraints: ['1 ≤ |s| ≤ 10⁵', '0 ≤ k ≤ 26'],
      examples: [{ input: 's = "eceba", k = 2', output: '3', explanation: '"ece"' }],
      edgeCases: ['k = 0 → 0', 'k ≥ distinct letters → |s|'],
      cues: ['"at most k distinct" → window + count table + distinct counter'],
      hints: ['Count letters in the window and how many have non-zero counts.', 'Shrink while distinct > k.'],
      approach: 'cnt[26] and a distinct counter maintained on transitions 0→1 and 1→0.',
      correctness: 'At most k distinct is monotone under shrinking; each right is measured after restoring validity.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Fixed 26-entry table and a linear scan.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
using namespace std;

int longestKDistinct(const string& s, int k) {
    int cnt[26] = {0}, distinct = 0, left = 0, best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        if (cnt[s[right] - 'a']++ == 0) distinct++;
        while (distinct > k) {
            if (--cnt[s[left] - 'a'] == 0) distinct--;
            left++;
        }
        best = max(best, right - left + 1);
    }
    return best;
}`,
      main: cpp`
int main() {
    string s;
    int k;
    cin >> s >> k;
    cout << longestKDistinct(s, k) << "\n";
    return 0;
}`,
      io: 'Input: string k. Output: longest segment length.',
      keyLines: [{ match: "if (cnt[s[right] - 'a']++ == 0) distinct++;", note: 'Post-increment: compare the old count with 0, then increment.' }],
      mistakes: ['Recounting distinct letters every step (O(26n) is fine, but error-prone)'],
      tests: [
        { in: 'eceba 2', out: '3' },
        { in: 'aa 1', out: '2' },
        { in: 'abc 0', out: '0' },
        { in: 'abaccc 2', out: '4' },
      ],
    },
    {
      id: 'd05-permutation-in-string',
      day: 5,
      title: 'Hidden Rearrangement',
      difficulty: 'Medium',
      topic: 'sliding-window',
      patterns: ['sliding-window-fixed', 'frequency-counting'],
      objective: 'Compare a window\'s frequency table with a pattern table.',
      statement: 'Print `true` if some permutation of pattern p appears as a contiguous substring of text t, otherwise `false`.',
      constraints: ['1 ≤ |p|, |t| ≤ 10⁴', 'Lowercase letters'],
      examples: [{ input: 'p = "ab", t = "eidbaooo"', output: 'true', explanation: '"ba" at index 3' }],
      edgeCases: ['|p| > |t|', 'p equals t'],
      cues: ['Anagram of p inside t → fixed window of length |p| with counts'],
      hints: ['A window of length |p| is a permutation of p iff the counts match.', 'Track how many of the 26 letters currently match.'],
      approach: 'Fixed window; maintain matches = number of letters with equal counts; answer true when matches == 26.',
      correctness: 'Equal counts for all letters ⇔ the window is an anagram of p.',
      complexity: { time: 'O(|t|)', space: 'O(1)', why: 'O(1) update per slide with the matches counter.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

bool containsPermutation(const string& p, const string& t) {
    if (p.size() > t.size()) return false;
    int need[26] = {0}, have[26] = {0};
    for (char c : p) need[c - 'a']++;
    int m = p.size();
    for (int i = 0; i < (int)t.size(); i++) {
        have[t[i] - 'a']++;
        if (i >= m) have[t[i - m] - 'a']--;
        if (i >= m - 1) {
            bool same = true;
            for (int c = 0; c < 26 && same; c++) same = need[c] == have[c];
            if (same) return true;
        }
    }
    return false;
}`,
      main: cpp`
int main() {
    string p, t;
    cin >> p >> t;
    cout << (containsPermutation(p, t) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: p t. Output: true or false.',
      keyLines: [{ match: "if (i >= m) have[t[i - m] - 'a']--;", note: 'Remove the character leaving the window.' }],
      mistakes: ['Checking only character presence, not counts'],
      tests: [
        { in: 'ab eidbaooo', out: 'true' },
        { in: 'ab eidboaoo', out: 'false' },
        { in: 'abc ab', out: 'false' },
        { in: 'adc dcda', out: 'true' },
      ],
    },
    {
      id: 'd05-char-replacement',
      day: 5,
      title: 'Uniform Banner',
      difficulty: 'Medium',
      topic: 'sliding-window',
      patterns: ['sliding-window-variable', 'frequency-counting'],
      objective: 'Use window length minus the most frequent count as the "cost".',
      statement: 'Given an uppercase string and k, you may change at most k characters. Print the length of the longest substring that can be made of one repeated letter.',
      constraints: ['1 ≤ |s| ≤ 10⁵', '0 ≤ k ≤ |s|'],
      examples: [{ input: 's = "AABABBA", k = 1', output: '4' }],
      edgeCases: ['k = 0', 'k ≥ |s|'],
      cues: ['A window is fixable if length − maxFreq ≤ k'],
      hints: ['Keep the most frequent letter, change the rest.', 'Window valid ⇔ (len − maxCount) ≤ k.', 'maxCount never needs to decrease: a smaller max cannot produce a longer answer.'],
      approach: 'Variable window with counts; track maxCount; if len − maxCount > k move left once.',
      correctness: 'The window length only grows when a strictly better maxCount appears, so the final length equals the best achievable.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Linear scan with a 26-entry table.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
using namespace std;

int characterReplacement(const string& s, int k) {
    int cnt[26] = {0}, left = 0, maxCount = 0, best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        maxCount = max(maxCount, ++cnt[s[right] - 'A']);
        if (right - left + 1 - maxCount > k) {
            cnt[s[left] - 'A']--;
            left++;
        }
        best = max(best, right - left + 1);
    }
    return best;
}`,
      main: cpp`
int main() {
    string s;
    int k;
    cin >> s >> k;
    cout << characterReplacement(s, k) << "\n";
    return 0;
}`,
      io: 'Input: string k. Output: longest achievable length.',
      keyLines: [{ match: 'if (right - left + 1 - maxCount > k) {', note: 'Moving left by one keeps the window size from growing when invalid.' }],
      mistakes: ['Recomputing maxCount by scanning 26 letters on every shrink (correct but slower)'],
      tests: [
        { in: 'AABABBA 1', out: '4' },
        { in: 'ABAB 2', out: '4' },
        { in: 'ABCD 0', out: '1' },
        { in: 'AAAA 0', out: '4' },
      ],
    },
    {
      id: 'd05-min-window',
      day: 5,
      title: 'Smallest Window Covering a Pattern',
      difficulty: 'Hard',
      topic: 'sliding-window',
      patterns: ['sliding-window-variable', 'frequency-counting'],
      objective: 'Shrink a covering window to its minimum while tracking how many requirements are met.',
      statement: 'Given strings s and t (letters only), print the length of the smallest window of s that contains every character of t with multiplicity, or 0 if none exists.',
      constraints: ['1 ≤ |s|, |t| ≤ 10⁵', 'ASCII letters'],
      examples: [{ input: 's = "ADOBECODEBANC", t = "ABC"', output: '4', explanation: '"BANC"' }],
      edgeCases: ['t longer than s', 'Repeated letters in t', 'Case sensitivity'],
      cues: ['"smallest substring containing all of …" → covering window with counts'],
      hints: ['Count what t needs.', 'Track how many characters of t are still missing.', 'When nothing is missing, shrink from the left as far as possible and record the length.'],
      approach: 'need[c] counts; missing = |t|. Expanding decrements missing when need[c] > 0 before decrement. While missing == 0, record length and release s[left].',
      correctness: 'Every minimal covering window ending at right is reached by the shrink loop, and all windows are considered as right sweeps the string.',
      complexity: { time: 'O(|s| + |t|)', space: 'O(1)', why: 'Each pointer moves at most |s| times; the count table has 128 entries.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
using namespace std;

int minWindow(const string& s, const string& t) {
    int need[128] = {0};
    for (char c : t) need[(int)c]++;
    int missing = t.size(), left = 0, best = INT_MAX;
    for (int right = 0; right < (int)s.size(); right++) {
        if (need[(int)s[right]]-- > 0) missing--;
        while (missing == 0) {
            best = min(best, right - left + 1);
            if (++need[(int)s[left]] > 0) missing++;
            left++;
        }
    }
    return best == INT_MAX ? 0 : best;
}`,
      main: cpp`
int main() {
    string s, t;
    cin >> s >> t;
    cout << minWindow(s, t) << "\n";
    return 0;
}`,
      io: 'Input: s t. Output: length of the minimum window or 0.',
      keyLines: [
        { match: 'if (need[(int)s[right]]-- > 0) missing--;', note: 'need can go negative: that records surplus copies inside the window.' },
        { match: 'if (++need[(int)s[left]] > 0) missing++;', note: 'Releasing a required character that had no surplus makes the window incomplete again.' },
      ],
      mistakes: ['Tracking only presence (fails for repeated letters in t)'],
      tests: [
        { in: 'ADOBECODEBANC ABC', out: '4' },
        { in: 'a a', out: '1' },
        { in: 'a aa', out: '0' },
        { in: 'aaflslflsldkalskaaa aaa', out: '3' },
      ],
    },
  ],
};

export default day;
