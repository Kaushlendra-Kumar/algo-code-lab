import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 2,
    title: 'Hash Maps, Sets and Frequency Counting',
    zone: 'arrays-hashing',
    objectives: [
      'Use unordered_set and unordered_map for O(1) average membership and lookup',
      'Count frequencies with a map or a fixed-size array',
      'Solve pair problems with complement lookup in one pass',
      'Know when hashing beats sorting — and when it does not',
    ],
    prerequisites: ['Day 1: loops, vectors, Big-O', 'Basic idea of a key → value table'],
    lesson: [
      {
        heading: 'What a hash table gives you',
        body: 'A hash table stores keys in buckets chosen by a hash function. On average, **insert**, **find** and **erase** take O(1). In C++ use `unordered_set<T>` for "is x present?" and `unordered_map<K, V>` for "what is associated with x?". The ordered versions `set`/`map` are balanced trees: O(log n) per operation but keys stay sorted.',
      },
      {
        heading: 'Frequency counting',
        body: '`count[x]++` builds a histogram in one pass. With `unordered_map`, `operator[]` inserts a zero-initialised value if the key is missing, so incrementing just works. For lowercase letters a plain `int count[26]` indexed by `c - \'a\'` is faster and simpler.',
      },
      {
        heading: 'Complement lookup',
        body: 'Many pair problems ask for i < j with a[i] + a[j] = target. Instead of checking every pair (O(n²)), walk once and ask: **have I already seen target − a[j]?** Look the complement up **before** inserting the current element so an element is never paired with itself.',
      },
      {
        heading: 'Costs and caveats',
        body: '- Average O(1) is not worst-case O(1): adversarial inputs can cause many collisions.\n- Iteration order of unordered containers is unspecified — never rely on it for output.\n- Hashing uses O(n) extra memory; sorting + two pointers may use O(1).\n- `map.count(k)` or `map.find(k)` checks membership without inserting; `map[k]` inserts.',
      },
    ],
    recognition: [
      '"Have I seen this before?" or "how many times?" → set or map.',
      'Pairs that sum/differ to a target in unsorted data → complement lookup.',
      'Comparing multisets (anagrams) → equal frequency tables.',
      'Need sorted output or nearest keys → ordered map/set instead.',
    ],
    patterns: ['hash-lookup', 'frequency-counting'],
    visualizations: ['prefix-sum'],
    exampleA: {
      id: 'd02-A',
      title: 'Two Sum with complement lookup',
      goal: 'Return the indices of two different elements that add up to the target.',
      input: 'nums = {3, 8, 4, 9, 1, 6}, target = 10',
      output: 'indices 3 4',
      idea: 'For each element, the partner we need is target − nums[i]. If that value was seen earlier, we are done; otherwise remember the current value and its index.',
      code: TRACE_CODE['two-sum-hash'],
      keyLines: [
        { match: 'unordered_map<int, int> seen;', note: 'Maps a value to the index where we saw it.' },
        { match: 'int need = target - nums[i];', note: 'The complement that would complete a pair with nums[i].' },
        { match: 'auto it = seen.find(need);', note: '`find` does not insert anything, unlike `seen[need]`.' },
        { match: 'seen[nums[i]] = i;', note: 'Insert after the lookup so nums[i] cannot pair with itself.' },
      ],
      complexity: { time: 'O(n) average', space: 'O(n)', why: 'Each element is looked up and inserted once; the map can hold up to n entries.' },
      edgeCases: ['Duplicates like {5, 5} with target 10 work because the first 5 is stored before the second is examined', 'No valid pair: the loop ends and an empty vector is returned', 'Negative numbers work unchanged'],
      mistakes: ['Inserting before looking up (pairs an element with itself when target = 2·x)', 'Using seen[need] to test membership — it silently inserts need with value 0'],
      tryIt: 'Change the function to return the number of pairs (i < j) whose sum is target, counting duplicates.',
      trace: { id: 'two-sum-hash', input: { nums: [3, 8, 4, 9, 1, 6], target: 10 } },
      bug: {
        find: 'auto it = seen.find(need);',
        replace: 'auto it = seen.find(nums[i]);',
        symptom: 'For {3, 8, 4, 9, 1, 6} the program prints "no pair" even though 9 + 1 = 10.',
        explanation: 'We must look up the complement `need`, not the current value. Searching for nums[i] only finds repeated values.',
      },
    },
    exampleB: {
      id: 'd02-B',
      kind: 'variant',
      title: 'Anagram check with a frequency array',
      goal: 'Decide whether two lowercase words use exactly the same letters with the same counts.',
      input: '("listen", "silent") and ("rat", "car")',
      output: 'listen/silent: anagram\nrat/car: not anagram',
      idea: 'Count letters of the first word up and of the second word down. They are anagrams exactly when every counter returns to zero.',
      code: cpp`
#include <iostream>
#include <string>
using namespace std;

bool isAnagram(const string& a, const string& b) {
    if (a.size() != b.size()) return false;
    int count[26] = {0};
    for (char c : a) count[c - 'a']++;
    for (char c : b) count[c - 'a']--;
    for (int k = 0; k < 26; k++)
        if (count[k] != 0) return false;
    return true;
}

int main() {
    string pairs[2][2] = {{"listen", "silent"}, {"rat", "car"}};
    for (auto& p : pairs) {
        cout << p[0] << "/" << p[1] << ": " << (isAnagram(p[0], p[1]) ? "anagram" : "not anagram") << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'if (a.size() != b.size()) return false;', note: 'Different lengths can never be anagrams — a cheap early exit.' },
        { match: 'int count[26] = {0};', note: 'A fixed alphabet makes an array faster than a hash map.' },
        { match: "count[c - 'a']++;", note: "c - 'a' maps 'a'..'z' to 0..25." },
        { match: 'if (count[k] != 0) return false;', note: 'Any non-zero counter means one word has extra copies of that letter.' },
      ],
      dryRun: {
        columns: ['phase', 'letters processed', 'non-zero counters'],
        rows: [
          ['count a', 'l i s t e n', 'e:1 i:1 l:1 n:1 s:1 t:1'],
          ['subtract b', 's i l e n t', 'none'],
          ['result', '—', 'all zero → anagram'],
          ['count a', 'r a t', 'a:1 r:1 t:1'],
          ['subtract b', 'c a r', 'c:−1 t:1 → not anagram'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two passes over the words plus 26 checks; the counter array has a fixed size.' },
      edgeCases: ['Empty strings are anagrams of each other', 'Uppercase or non-letters would index out of range — normalise or use unordered_map<char,int>'],
      mistakes: ['Sorting both strings works but costs O(n log n)', 'Forgetting the length check and only testing one direction'],
      tryIt: 'Extend the function to Unicode-agnostic ASCII by using an array of 256 counters indexed by (unsigned char)c.',
    },
    complexityNotes: 'Hash operations are O(1) on average, so one pass with lookups is O(n) time and O(n) space. A fixed 26-letter counter is O(1) space because its size does not grow with n.',
    quiz: [
      {
        prompt: 'Why should Two Sum look up the complement before inserting nums[i]?',
        options: ['It is faster', 'So an element is never paired with itself', 'unordered_map requires it', 'To keep indices sorted'],
        answer: 1,
        explanation: 'If target = 2·nums[i], inserting first would let nums[i] match itself.',
      },
      {
        prompt: 'What does `m[key]` do on an unordered_map when key is absent?',
        options: ['Throws an exception', 'Returns 0 without changing the map', 'Inserts key with a value-initialised value and returns a reference', 'Undefined behaviour'],
        answer: 2,
        explanation: 'operator[] inserts. Use find() or count() to test membership without inserting.',
      },
      {
        prompt: 'You need all distinct values in sorted order. Which container fits best?',
        options: ['unordered_set', 'set', 'vector without sorting', 'stack'],
        answer: 1,
        explanation: 'std::set keeps keys ordered (O(log n) per insert); unordered_set has no defined order.',
      },
    ],
    optimize: {
      prompt: 'A brute-force Two Sum checks every pair. What repeated work does the hash map remove?',
      options: ['Reading the input', 'Re-scanning all earlier elements to find the complement of each new element', 'Sorting', 'Printing'],
      answer: 1,
      explanation: 'The map remembers earlier elements so the inner "search all previous" loop becomes one O(1) lookup.',
    },
    recap: 'Hash sets answer membership, hash maps answer "what was associated with this key", and frequency tables compare multisets — all in O(1) average per operation.',
    nextPrep: 'Tomorrow: prefix sums. Revisit Day 1 running sums — a prefix array is a stored running sum.',
  },
  questions: [
    {
      id: 'd02-contains-duplicate',
      day: 2,
      title: 'Duplicate Badge Scan',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['hash-lookup'],
      objective: 'Use a hash set for O(1) membership.',
      statement: 'Badge numbers are scanned at a door. Print `true` if any badge number was scanned more than once, otherwise `false`.',
      constraints: ['1 ≤ n ≤ 10⁵', '−10⁹ ≤ badge ≤ 10⁹'],
      examples: [{ input: 'badges = [4, 1, 9, 4]', output: 'true' }],
      edgeCases: ['n = 1', 'Negative numbers', 'Duplicate at the very end'],
      cues: ['"any repeated value" → set of seen values'],
      hints: ['Compare with every earlier badge is O(n²).', 'Remember what you have seen in a structure with fast lookup.', 'insert() on unordered_set returns a pair whose .second is false if the value was already present.'],
      brute: 'Compare every pair: O(n²).',
      approach: 'Insert each badge into an unordered_set; if insertion fails, a duplicate exists.',
      correctness: 'The set contains exactly the badges seen so far, so a failed insert means the current badge appeared before.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One average-O(1) insert per badge; the set may hold all n badges.' },
      cpp: cpp`
#include <iostream>
#include <unordered_set>
#include <vector>
using namespace std;

bool hasDuplicate(const vector<long long>& a) {
    unordered_set<long long> seen;
    for (long long x : a)
        if (!seen.insert(x).second) return true;
    return false;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << (hasDuplicate(a) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n, then n badge numbers. Output: true or false.',
      keyLines: [{ match: 'if (!seen.insert(x).second) return true;', note: 'insert returns {iterator, inserted}; inserted is false when x was already there.' }],
      mistakes: ['Sorting the original vector when the caller needs it unchanged', 'Printing 1/0 instead of true/false'],
      tests: [
        { in: '4\n4 1 9 4', out: 'true' },
        { in: '1\n7', out: 'false' },
        { in: '5\n-1 -2 -3 -4 -5', out: 'false' },
        { in: '6\n10 20 30 40 50 10', out: 'true' },
      ],
      viz: 'prefix-sum',
    },
    {
      id: 'd02-valid-anagram',
      day: 2,
      title: 'Scrambled Password',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['frequency-counting'],
      objective: 'Compare two multisets of letters with a counter array.',
      statement: 'Given two lowercase words s and t, print `true` if t is a rearrangement of s (same letters with the same counts), otherwise `false`.',
      constraints: ['1 ≤ |s|, |t| ≤ 10⁵', 'Only lowercase English letters'],
      examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true' }],
      edgeCases: ['Different lengths', 'Same letters, different counts ("aab" vs "abb")'],
      cues: ['Order does not matter, counts do → frequency table'],
      hints: ['Different lengths → immediately false.', 'Count each letter of s.', 'Decrement for each letter of t; every counter must end at zero.'],
      brute: 'Sort both strings and compare: O(n log n).',
      approach: 'One 26-slot counter: +1 for s, −1 for t, then check all zeros.',
      correctness: 'Counters are zero exactly when each letter occurs equally often in both words.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Linear passes and a fixed 26-element array.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int cnt[26] = {0};
    for (size_t i = 0; i < s.size(); i++) {
        cnt[s[i] - 'a']++;
        cnt[t[i] - 'a']--;
    }
    for (int c : cnt)
        if (c) return false;
    return true;
}`,
      main: cpp`
int main() {
    string s, t;
    cin >> s >> t;
    cout << (isAnagram(s, t) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: two words separated by whitespace. Output: true or false.',
      keyLines: [
        { match: "cnt[s[i] - 'a']++;", note: 'Same loop handles both words because their lengths are equal.' },
        { match: 'if (c) return false;', note: 'A non-zero counter means one word has an extra copy of a letter.' },
      ],
      mistakes: ['Only checking that every letter of t appears in s (ignores counts)'],
      tests: [
        { in: 'anagram nagaram', out: 'true' },
        { in: 'rat car', out: 'false' },
        { in: 'aab abb', out: 'false' },
        { in: 'a ab', out: 'false' },
      ],
    },
    {
      id: 'd02-first-unique',
      day: 2,
      title: 'First One-of-a-Kind Character',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['frequency-counting'],
      objective: 'Use two passes: count first, then query in order.',
      statement: 'Print the index of the first character in a lowercase string that occurs exactly once, or -1 if there is none.',
      constraints: ['1 ≤ |s| ≤ 10⁵'],
      examples: [{ input: 's = "loveleetcode"', output: '2', explanation: "'v' at index 2 is the first unique character." }],
      edgeCases: ['All characters repeated → -1', 'Single character → 0'],
      cues: ['"exactly once" needs full counts before deciding → two passes'],
      hints: ['You cannot decide uniqueness until the whole string is read.', 'First pass: count. Second pass: find the first index with count 1.'],
      approach: 'Count every letter, then scan left to right and return the first position whose letter count is 1.',
      correctness: 'After the first pass counts are final, so the second pass checks the true multiplicity in original order.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'Two linear passes with a 26-element array.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

int firstUnique(const string& s) {
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;
    for (int i = 0; i < (int)s.size(); i++)
        if (cnt[s[i] - 'a'] == 1) return i;
    return -1;
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << firstUnique(s) << "\n";
    return 0;
}`,
      io: 'Input: one lowercase string. Output: index or -1.',
      keyLines: [{ match: "if (cnt[s[i] - 'a'] == 1) return i;", note: 'Second pass preserves the original order.' }],
      mistakes: ['Returning the first character whose count is 1 in alphabetical order instead of string order'],
      tests: [
        { in: 'loveleetcode', out: '2' },
        { in: 'aabb', out: '-1' },
        { in: 'z', out: '0' },
        { in: 'leetcode', out: '0' },
      ],
    },
    {
      id: 'd02-majority',
      day: 2,
      title: 'Election Majority',
      difficulty: 'Easy',
      topic: 'arrays-hashing',
      patterns: ['frequency-counting', 'running-aggregate'],
      objective: 'Find a value occurring more than n/2 times.',
      statement: 'Votes are given as candidate ids. One candidate is guaranteed to receive more than half of the votes. Print that candidate.',
      constraints: ['1 ≤ n ≤ 10⁵', 'A majority always exists'],
      examples: [{ input: 'votes = [2, 2, 1, 1, 1, 2, 2]', output: '2' }],
      edgeCases: ['n = 1', 'Majority appears at the end'],
      cues: ['"more than n/2" → counting, or Boyer–Moore voting for O(1) space'],
      hints: ['A hash map of counts works in O(n) space.', 'Can you pair each majority vote with a different vote to cancel it?', 'Keep a candidate and a counter: increment on match, decrement otherwise, replace candidate at 0.'],
      brute: 'Count with an unordered_map and return the key with count > n/2.',
      approach: "Boyer–Moore voting: the majority survives pairwise cancellation because it outnumbers all other votes combined.",
      correctness: 'Each decrement cancels one majority vote with at most one non-majority vote; since majority > n/2, it cannot be fully cancelled.',
      complexity: { time: 'O(n)', space: 'O(1)', why: 'One pass with two variables.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int majority(const vector<int>& v) {
    int candidate = 0, count = 0;
    for (int x : v) {
        if (count == 0) candidate = x;
        count += (x == candidate) ? 1 : -1;
    }
    return candidate;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (auto& x : v) cin >> x;
    cout << majority(v) << "\n";
    return 0;
}`,
      io: 'Input: n, then n votes. Output: the majority candidate.',
      keyLines: [
        { match: 'if (count == 0) candidate = x;', note: 'With the counter at zero, the previous votes cancelled out completely.' },
        { match: 'count += (x == candidate) ? 1 : -1;', note: 'Matching votes reinforce, different votes cancel.' },
      ],
      mistakes: ['Using this without the guarantee — then a verification pass is needed'],
      tests: [
        { in: '7\n2 2 1 1 1 2 2', out: '2' },
        { in: '1\n9', out: '9' },
        { in: '3\n3 2 3', out: '3' },
        { in: '5\n1 1 2 2 2', out: '2' },
      ],
    },
    {
      id: 'd02-anagram-groups',
      day: 2,
      title: 'Count Anagram Families',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['frequency-counting', 'hash-lookup'],
      objective: 'Build a canonical key for each group.',
      statement: 'Given n lowercase words, words belong to the same family if they are anagrams of each other. Print the number of families and the size of the largest family.',
      constraints: ['1 ≤ n ≤ 10⁴', '1 ≤ |word| ≤ 100'],
      examples: [{ input: 'words = [eat, tea, tan, ate, nat, bat]', output: '3 3', explanation: '{eat, tea, ate}, {tan, nat}, {bat}' }],
      edgeCases: ['All words identical', 'Single word'],
      cues: ['Group by "same letters" → canonical key (sorted word or count signature)'],
      hints: ['Two anagrams become identical after sorting their letters.', 'Use the sorted word as a hash-map key.', 'Count words per key.'],
      approach: 'For each word, key = sorted copy; increment groups[key]. Answer = number of keys and the maximum count.',
      correctness: 'Anagrams map to the same key and non-anagrams to different keys, so keys correspond one-to-one with families.',
      complexity: { time: 'O(n · L log L)', space: 'O(n · L)', why: 'Sorting each word of length L, storing up to n keys.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

pair<int, int> anagramFamilies(const vector<string>& words) {
    unordered_map<string, int> groups;
    for (string w : words) {
        sort(w.begin(), w.end());
        groups[w]++;
    }
    int largest = 0;
    for (auto& [key, cnt] : groups) largest = max(largest, cnt);
    return {(int)groups.size(), largest};
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> w(n);
    for (auto& s : w) cin >> s;
    auto [families, largest] = anagramFamilies(w);
    cout << families << " " << largest << "\n";
    return 0;
}`,
      io: 'Input: n, then n words. Output: number of families and largest family size.',
      keyLines: [
        { match: 'for (string w : words) {', note: 'Copy each word (not a reference) so sorting it does not change the input.' },
        { match: 'groups[w]++;', note: 'operator[] creates the key with 0 on first sight.' },
      ],
      mistakes: ['Sorting the original strings by reference', 'Using a concatenated count string without separators (ambiguous keys like 1,11 vs 11,1)'],
      tests: [
        { in: '6\neat tea tan ate nat bat', out: '3 3' },
        { in: '1\nabc', out: '1 1' },
        { in: '3\nab ba ab', out: '1 3' },
        { in: '4\na b c d', out: '4 1' },
      ],
    },
    {
      id: 'd02-longest-consecutive',
      day: 2,
      title: 'Longest Unbroken Ticket Run',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['hash-lookup'],
      objective: 'Start counting only from sequence beginnings to stay O(n).',
      statement: 'Given n integers in any order, print the length of the longest set of consecutive integers (x, x+1, …, x+k) that all appear.',
      constraints: ['0 ≤ n ≤ 10⁵', '−10⁹ ≤ value ≤ 10⁹'],
      examples: [{ input: 'nums = [100, 4, 200, 1, 3, 2]', output: '4', explanation: '1, 2, 3, 4' }],
      edgeCases: ['n = 0', 'Duplicates', 'Negative values'],
      cues: ['O(n) required and sorting would be O(n log n) → hash set'],
      hints: ['Put everything in a set.', 'Only start counting at x if x − 1 is not in the set.', 'Then walk x + 1, x + 2, … while present.'],
      brute: 'Sort and scan: O(n log n).',
      approach: 'For each x with x − 1 absent, count how far x, x + 1, … extends.',
      correctness: 'Each run is counted exactly once from its smallest element; every element is visited by at most one inner walk.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'The inner while loop advances over each element at most once in total (amortised).' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_set>
#include <vector>
using namespace std;

int longestRun(const vector<long long>& a) {
    unordered_set<long long> s(a.begin(), a.end());
    int best = 0;
    for (long long x : s) {
        if (s.count(x - 1)) continue;  // not the start of a run
        int len = 1;
        while (s.count(x + len)) len++;
        best = max(best, len);
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << longestRun(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: longest consecutive run length.',
      keyLines: [
        { match: 'if (s.count(x - 1)) continue;', note: 'Skip non-starts; this keeps the total work linear.' },
        { match: 'while (s.count(x + len)) len++;', note: 'Walk the run upward from its start.' },
      ],
      mistakes: ['Iterating the original array with duplicates (repeats work)', 'Overflow when values are near INT_MAX — long long avoids it'],
      tests: [
        { in: '6\n100 4 200 1 3 2', out: '4' },
        { in: '0\n', out: '0' },
        { in: '5\n1 1 1 2 2', out: '2' },
        { in: '7\n-3 -1 -2 10 0 5 6', out: '4' },
      ],
    },
    {
      id: 'd02-pairs-diff-k',
      day: 2,
      title: 'Distinct Pairs With Gap K',
      difficulty: 'Medium',
      topic: 'arrays-hashing',
      patterns: ['hash-lookup', 'frequency-counting'],
      objective: 'Count unique value pairs with a fixed difference.',
      statement: 'Count distinct value pairs (x, y) with y − x = k that can be formed from the array (each pair counted once even if values repeat). For k = 0, a pair needs the value to appear at least twice.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ k ≤ 10⁹'],
      examples: [{ input: 'nums = [3, 1, 4, 1, 5], k = 2', output: '2', explanation: '(1, 3) and (3, 5)' }],
      edgeCases: ['k = 0 with duplicates', 'All values equal'],
      cues: ['"distinct pairs" → work over distinct values with counts'],
      hints: ['Build a frequency map of values.', 'For k > 0 check whether x + k exists for each distinct x.', 'For k = 0 count values with frequency ≥ 2.'],
      approach: 'Frequency map; iterate distinct keys and count x + k present (or freq ≥ 2 when k = 0).',
      correctness: 'Each distinct pair is identified uniquely by its smaller value x, which is visited once.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Building the map and one pass over distinct keys.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int pairsWithDiff(const vector<long long>& a, long long k) {
    unordered_map<long long, int> freq;
    for (long long x : a) freq[x]++;
    int count = 0;
    for (auto& [x, f] : freq) {
        if (k == 0) count += (f >= 2);
        else count += freq.count(x + k) > 0;
    }
    return count;
}`,
      main: cpp`
int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    cout << pairsWithDiff(a, k) << "\n";
    return 0;
}`,
      io: 'Input: n k, then n integers. Output: number of distinct pairs.',
      keyLines: [
        { match: 'else count += freq.count(x + k) > 0;', note: 'count() checks presence without inserting — inserting while iterating would invalidate the loop.' },
        { match: 'if (k == 0) count += (f >= 2);', note: 'With k = 0 the pair uses the same value twice.' },
      ],
      mistakes: ['Using freq[x + k] inside the loop (inserts keys during iteration)', 'Counting index pairs instead of value pairs'],
      tests: [
        { in: '5 2\n3 1 4 1 5', out: '2' },
        { in: '5 0\n1 3 1 5 4', out: '1' },
        { in: '5 1\n1 2 3 4 5', out: '4' },
        { in: '3 0\n7 8 9', out: '0' },
      ],
    },
    {
      id: 'd02-four-sum-count',
      day: 2,
      title: 'Four Ledgers Balance',
      difficulty: 'Hard',
      topic: 'arrays-hashing',
      patterns: ['hash-lookup', 'brute-to-optimal'],
      objective: 'Split a 4-way search into two 2-way halves (meet in the middle).',
      statement: 'Four arrays A, B, C, D each have n integers. Count tuples (i, j, k, l) with A[i] + B[j] + C[k] + D[l] = 0.',
      constraints: ['1 ≤ n ≤ 300', '|values| ≤ 2²⁸'],
      examples: [{ input: 'A=[1,2], B=[-2,-1], C=[-1,2], D=[0,2]', output: '2' }],
      edgeCases: ['Many zeros → answer up to n⁴ = 8.1·10⁹ (needs 64-bit)', 'No solutions'],
      cues: ['n⁴ is too big but n² is fine → combine pairs'],
      hints: ['Four nested loops is O(n⁴) ≈ 8·10⁹.', 'Count every possible A[i] + B[j] in a hash map.', 'For each C[k] + D[l], add the count of its negation.'],
      brute: 'Four nested loops: O(n⁴).',
      approach: 'Map sumAB → count over all n² pairs; then for each of the n² CD sums add map[−sum].',
      correctness: 'Every valid tuple corresponds to exactly one (AB pair, CD pair) whose sums cancel, and is counted once.',
      complexity: { time: 'O(n²)', space: 'O(n²)', why: 'Two double loops and a map of up to n² sums.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

long long fourSumCount(const vector<long long>& A, const vector<long long>& B, const vector<long long>& C, const vector<long long>& D) {
    unordered_map<long long, long long> ab;
    for (long long a : A)
        for (long long b : B) ab[a + b]++;
    long long total = 0;
    for (long long c : C)
        for (long long d : D) {
            auto it = ab.find(-(c + d));
            if (it != ab.end()) total += it->second;
        }
    return total;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<long long>> v(4, vector<long long>(n));
    for (auto& arr : v)
        for (auto& x : arr) cin >> x;
    cout << fourSumCount(v[0], v[1], v[2], v[3]) << "\n";
    return 0;
}`,
      io: 'Input: n, then the four arrays (n values each). Output: number of tuples.',
      keyLines: [
        { match: 'for (long long b : B) ab[a + b]++;', note: 'All n² sums of the first half.' },
        { match: 'auto it = ab.find(-(c + d));', note: 'The second half must cancel the first: AB = −(C + D).' },
        { match: 'long long total = 0;', note: 'The count can exceed 2³¹.' },
      ],
      mistakes: ['Storing the answer in int', 'Using ab[-(c+d)] which inserts zeros and bloats the map'],
      tests: [
        { in: '2\n1 2\n-2 -1\n-1 2\n0 2', out: '2' },
        { in: '1\n0\n0\n0\n0', out: '1' },
        { in: '2\n0 0\n0 0\n0 0\n0 0', out: '16' },
        { in: '1\n1\n1\n1\n1', out: '0' },
      ],
    },
  ],
};

export default day;
