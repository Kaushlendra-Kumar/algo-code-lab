import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 30,
    title: 'Sequence DP: LCS, Edit Distance and LIS',
    zone: 'dynamic-programming',
    objectives: [
      'Define dp[i][j] over prefixes of two sequences',
      'Derive LCS and edit-distance transitions from the last characters',
      'Compute LIS in O(n²) and in O(n log n) with patience sorting',
      'Reconstruct a subsequence from a filled table',
    ],
    prerequisites: ['Day 28: 2D tables', 'Day 7: lower_bound'],
    lesson: [
      {
        heading: 'Prefix states',
        body: 'For two strings `a` and `b`, let `dp[i][j]` describe the first `i` characters of `a` and the first `j` of `b`. Row 0 and column 0 are empty prefixes — the base cases. The answer sits in `dp[n][m]`.',
      },
      {
        heading: 'Longest common subsequence',
        body: 'If `a[i−1] == b[j−1]`, that character can end the common subsequence: `dp[i][j] = dp[i−1][j−1] + 1`. Otherwise one of the two last characters is unused: `dp[i][j] = max(dp[i−1][j], dp[i][j−1])`.',
      },
      {
        heading: 'Edit distance',
        body: 'Minimum inserts, deletes and replaces to turn `a` into `b`. Equal last characters cost nothing (`dp[i−1][j−1]`); otherwise take 1 + min(replace `dp[i−1][j−1]`, delete `dp[i−1][j]`, insert `dp[i][j−1]`). Base: `dp[i][0] = i`, `dp[0][j] = j`.',
      },
      {
        heading: 'Longest increasing subsequence',
        body: '`len[i]` = LIS ending at `i` = 1 + max `len[k]` over k < i with `a[k] < a[i]` — O(n²). Faster: keep `tails[L]` = smallest possible tail of an increasing subsequence of length L+1. Each new value replaces the first tail ≥ it (`lower_bound`) or extends the list. `tails.size()` is the LIS length.',
      },
      {
        heading: 'Subsequence vs substring',
        body: 'A subsequence may skip characters; a substring is contiguous. Longest common *substring* resets to 0 on a mismatch instead of taking a max.',
      },
    ],
    recognition: [
      'Two strings + "common", "transform", "delete to make equal" → dp over prefixes i, j.',
      '"Longest increasing / chain / nested" → LIS, often after sorting.',
      'Palindromic subsequence of s → LCS of s and reverse(s) (or interval DP).',
    ],
    patterns: ['subsequence-dp', 'dp-2d', 'binary-search'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd30-A',
      title: 'Longest common subsequence with reconstruction',
      goal: 'Find the length and one example of the longest common subsequence of two strings.',
      input: 'a = "ABCBDAB", b = "BDCABA"',
      output: 'LCS length = 4\nLCS = BCBA',
      idea: 'Fill the prefix table, then walk back from dp[n][m]: on a match take the character and go diagonally; otherwise move toward the larger neighbour.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a = "ABCBDAB", b = "BDCABA";
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;  //@gap
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);            //@gap
        }
    string lcs;
    int i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] == b[j - 1]) {
            lcs += a[i - 1];
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    reverse(lcs.begin(), lcs.end());
    cout << "LCS length = " << dp[n][m] << "\n";
    cout << "LCS = " << lcs << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));', note: 'Extra row/column for empty prefixes.' },
        { match: 'if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;', note: 'Matching last characters extend the diagonal answer.' },
        { match: 'else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);', note: 'Drop the last character of a or of b.' },
        { match: 'reverse(lcs.begin(), lcs.end());', note: 'The walk-back collects characters from the end.' },
      ],
      dryRun: {
        columns: ['i (prefix of a)', 'dp[i][1..6] for b = B D C A B A'],
        rows: [
          ['1 A', '0 0 0 1 1 1'],
          ['2 AB', '1 1 1 1 2 2'],
          ['3 ABC', '1 1 2 2 2 2'],
          ['4 ABCB', '1 1 2 2 3 3'],
          ['5 ABCBD', '1 2 2 2 3 3'],
          ['6 ABCBDA', '1 2 2 3 3 4'],
          ['7 ABCBDAB', '1 2 2 3 4 4'],
        ],
      },
      complexity: { time: 'O(n · m)', space: 'O(n · m) (O(min(n, m)) for length only)', why: 'Every pair of prefixes is filled once.' },
      edgeCases: ['An empty string → 0', 'Identical strings → full length', 'Several optimal answers exist; tie-breaking chooses one'],
      mistakes: ['Indexing a[i] instead of a[i − 1] with the padded table', 'Confusing subsequence with substring'],
      tryIt: 'Prefer j-- on ties and see a different LCS of the same length.',
      bug: {
        find: 'if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;',
        replace: 'if (a[i - 1] == b[j - 1]) dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) + 1;',
        symptom: 'The program prints "LCS length = 5", yet the reconstructed LCS printed below it has only 4 letters.',
        explanation: 'A match may only extend the answer for both prefixes shortened (the diagonal). Using the up/left neighbours re-uses a character that was already matched.',
      },
    },
    exampleB: {
      id: 'd30-B',
      kind: 'brute-vs-optimized',
      title: 'LIS in O(n log n) with tails',
      goal: 'Find the length of the longest strictly increasing subsequence.',
      input: 'a = {10, 9, 2, 5, 3, 7, 101, 18}',
      output: 'tails after each value:\n10\n9\n2\n2 5\n2 3\n2 3 7\n2 3 7 101\n2 3 7 18\nLIS length = 4',
      idea: 'tails[k] is the smallest tail of any increasing subsequence of length k + 1. tails is sorted, so a binary search finds where the new value fits.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> a = {10, 9, 2, 5, 3, 7, 101, 18};
    vector<int> tails;
    cout << "tails after each value:\n";
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);  //@gap
        if (it == tails.end()) tails.push_back(x);              //@gap
        else *it = x;
        for (size_t k = 0; k < tails.size(); k++) cout << (k ? " " : "") << tails[k];
        cout << "\n";
    }
    cout << "LIS length = " << tails.size() << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'auto it = lower_bound(tails.begin(), tails.end(), x);', note: 'First tail ≥ x — strictly increasing, so equal values replace.' },
        { match: 'if (it == tails.end()) tails.push_back(x);', note: 'x is bigger than every tail: a longer subsequence exists.' },
        { match: 'else *it = x;', note: 'A smaller tail for the same length leaves more room for later values.' },
      ],
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'One binary search per element. The O(n²) version compares each pair.' },
      edgeCases: ['Duplicates (strict vs non-strict changes lower_bound to upper_bound)', 'Decreasing array → 1'],
      mistakes: ['Believing tails itself is an LIS (it usually is not)', 'Using upper_bound for a strictly increasing LIS'],
      tryIt: 'Switch to upper_bound and run on {2, 2, 2}: that computes the longest non-decreasing subsequence.',
      bug: {
        find: 'else *it = x;',
        replace: 'else {}',
        symptom: 'The program prints "LIS length = 2" — the tails never get smaller, so 2, 3, 7 can never start a longer chain.',
        explanation: 'Replacing the first tail ≥ x with x is the whole trick: a smaller tail for the same length keeps future extensions possible. Without it, the first large value (10) blocks everything after it.',
      },
    },
    complexityNotes: 'Two-sequence DP is O(n · m) time; rolling rows reduce memory to O(m) when no reconstruction is needed. LIS drops from O(n²) to O(n log n) with the tails array.',
    quiz: [
      {
        prompt: 'In LCS, when a[i−1] ≠ b[j−1], dp[i][j] equals…',
        options: ['dp[i−1][j−1]', 'max(dp[i−1][j], dp[i][j−1])', 'dp[i−1][j−1] + 1', '0'],
        answer: 1,
        explanation: 'At least one of the two last characters is not part of the LCS.',
      },
      {
        prompt: 'Edit distance base case dp[i][0] is…',
        options: ['0', 'i', '1', 'infinity'],
        answer: 1,
        explanation: 'Deleting all i characters turns a prefix into the empty string.',
      },
      {
        prompt: 'In the tails method, tails[k] stores…',
        options: ['The k-th element of the LIS', 'The smallest tail of any increasing subsequence of length k + 1', 'The count of subsequences', 'The largest element seen'],
        answer: 1,
        explanation: 'Keeping tails small maximises the chance to extend later.',
      },
    ],
    recap: 'Sequence DP indexes prefixes. LCS takes the diagonal on a match and the best neighbour otherwise; edit distance adds one operation cost; LIS uses the tails array with lower_bound for O(n log n).',
    nextPrep: 'Tomorrow: greedy algorithms — and how to prove (or disprove) them.',
  },
  questions: [
    {
      id: 'd30-is-subsequence',
      day: 30,
      title: 'Hidden Message Check',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'two-pointers-same'],
      objective: 'Greedy subsequence test as a warm-up.',
      statement: 'Print YES if s is a subsequence of t (s can be obtained by deleting characters from t), otherwise NO.',
      constraints: ['1 ≤ |s|, |t| ≤ 10⁵', 'Lowercase letters'],
      examples: [{ input: 's = ace, t = abcde', output: 'YES' }],
      edgeCases: ['s longer than t'],
      cues: ['Order matters but gaps are allowed'],
      hints: ['Walk through t; advance a pointer in s when characters match.'],
      approach: 'Two pointers — matching as early as possible never hurts.',
      correctness: 'Matching the earliest possible position leaves the most of t for the rest of s.',
      complexity: { time: 'O(|t|)', space: 'O(1)', why: 'Single scan.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

bool isSubsequence(const string& s, const string& t) {
    size_t i = 0;
    for (char c : t)
        if (i < s.size() && s[i] == c) i++;
    return i == s.size();
}`,
      main: cpp`
int main() {
    string s, t;
    cin >> s >> t;
    cout << (isSubsequence(s, t) ? "YES" : "NO") << "\n";
    return 0;
}`,
      io: 'Input: s and t on one line. Output: YES or NO.',
      keyLines: [{ match: 'if (i < s.size() && s[i] == c) i++;', note: 'Earliest match is always safe.' }],
      mistakes: ['Reading s[i] after i reached the end'],
      tests: [
        { in: 'ace abcde', out: 'YES' },
        { in: 'aec abcde', out: 'NO' },
        { in: 'abc ab', out: 'NO' },
        { in: 'aaa baaba', out: 'YES' },
      ],
    },
    {
      id: 'd30-lcs',
      day: 30,
      title: 'Shared Melody Length',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'dp-2d'],
      objective: 'LCS length with rolling rows.',
      statement: 'Print the length of the longest common subsequence of two strings.',
      constraints: ['1 ≤ |a|, |b| ≤ 2000'],
      examples: [{ input: 'abcde ace', output: '3' }],
      edgeCases: ['No common characters → 0'],
      cues: ['Two strings, common, order kept'],
      hints: ['Keep only the previous row.', 'Remember the old diagonal before overwriting.'],
      approach: 'Two rolling rows.',
      correctness: 'Standard LCS recurrence; row i only needs row i − 1.',
      complexity: { time: 'O(n · m)', space: 'O(m)', why: 'Two rows of length m + 1.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int lcsLength(const string& a, const string& b) {
    vector<int> prev(b.size() + 1, 0), cur(b.size() + 1, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (size_t j = 1; j <= b.size(); j++)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    return prev[b.size()];
}`,
      main: cpp`
int main() {
    string a, b;
    cin >> a >> b;
    cout << lcsLength(a, b) << "\n";
    return 0;
}`,
      io: 'Input: two strings. Output: LCS length.',
      keyLines: [{ match: 'swap(prev, cur);', note: 'After the swap, prev holds the row just computed.' }],
      mistakes: ['Returning cur after the swap'],
      tests: [
        { in: 'abcde ace', out: '3' },
        { in: 'abc def', out: '0' },
        { in: 'ABCBDAB BDCABA', out: '4' },
        { in: 'aaaa aa', out: '2' },
      ],
      viz: 'dp',
    },
    {
      id: 'd30-lis',
      day: 30,
      title: 'Longest Rising Streak (Not Contiguous)',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'binary-search'],
      objective: 'LIS in O(n log n).',
      statement: 'Print the length of the longest strictly increasing subsequence.',
      constraints: ['1 ≤ n ≤ 10⁵', '|a[i]| ≤ 10⁹'],
      examples: [{ input: '10 9 2 5 3 7 101 18', output: '4' }],
      edgeCases: ['All equal → 1', 'Already increasing → n'],
      cues: ['"increasing subsequence", n up to 10⁵'],
      hints: ['Maintain tails sorted.', 'lower_bound for strict increase.'],
      brute: 'O(n²) DP over pairs.',
      approach: 'Patience sorting with tails.',
      correctness: 'tails[k] is always the minimum tail of a length-(k+1) increasing subsequence; its size equals the LIS length.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Binary search per element.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int lis(const vector<int>& a) {
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << lis(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: LIS length.',
      keyLines: [{ match: 'auto it = lower_bound(tails.begin(), tails.end(), x);', note: 'Replace the first tail ≥ x.' }],
      mistakes: ['upper_bound (non-strict)'],
      tests: [
        { in: '8\n10 9 2 5 3 7 101 18', out: '4' },
        { in: '6\n0 1 0 3 2 3', out: '4' },
        { in: '4\n7 7 7 7', out: '1' },
        { in: '5\n-3 -2 -1 0 1', out: '5' },
      ],
    },
    {
      id: 'd30-edit-distance',
      day: 30,
      title: 'Spell-Checker Distance',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'dp-2d'],
      objective: 'Edit distance with three operations.',
      statement: 'Print the minimum number of single-character inserts, deletes or replacements that turn word a into word b.',
      constraints: ['0 ≤ |a|, |b| ≤ 500 (empty words are given as "-")'],
      examples: [{ input: 'horse ros', output: '3' }],
      edgeCases: ['One empty word → length of the other', 'Equal words → 0'],
      cues: ['Transform one string into another with unit-cost operations'],
      hints: ['dp[i][0] = i, dp[0][j] = j.', 'Match → diagonal; else 1 + min of three neighbours.'],
      approach: 'Full table.',
      correctness: 'The last operation in an optimal script is a match, replace, delete or insert; each maps to one neighbour.',
      complexity: { time: 'O(n · m)', space: 'O(n · m)', why: 'Table over prefixes.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int editDistance(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1]
                                            : 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});
    return dp[n][m];
}`,
      main: cpp`
int main() {
    string a, b;
    cin >> a >> b;
    if (a == "-") a = "";
    if (b == "-") b = "";
    cout << editDistance(a, b) << "\n";
    return 0;
}`,
      io: 'Input: two words ("-" for empty). Output: edit distance.',
      keyLines: [{ match: ': 1 + min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});', note: 'Replace, delete, insert.' }],
      mistakes: ['Forgetting the base row/column'],
      tests: [
        { in: 'horse ros', out: '3' },
        { in: 'intention execution', out: '5' },
        { in: '- abc', out: '3' },
        { in: 'same same', out: '0' },
      ],
      viz: 'dp',
    },
    {
      id: 'd30-palindromic-subseq',
      day: 30,
      title: 'Longest Mirror Subsequence',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'interval-dp'],
      objective: 'Reduce to LCS with the reversed string.',
      statement: 'Print the length of the longest palindromic subsequence of s.',
      constraints: ['1 ≤ |s| ≤ 1000'],
      examples: [{ input: 'bbbab', output: '4' }],
      edgeCases: ['Single character → 1'],
      cues: ['Palindrome + subsequence'],
      hints: ['A palindromic subsequence reads the same backwards — common to s and reverse(s).'],
      approach: 'LCS(s, reverse(s)).',
      correctness: 'Every palindromic subsequence is common to both; the LCS of s and its reverse can always be chosen palindromic, so lengths coincide.',
      complexity: { time: 'O(n²)', space: 'O(n)', why: 'LCS with rolling rows.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int longestPalSubseq(const string& s) {
    string r(s.rbegin(), s.rend());
    size_t n = s.size();
    vector<int> prev(n + 1, 0), cur(n + 1, 0);
    for (size_t i = 1; i <= n; i++) {
        for (size_t j = 1; j <= n; j++)
            cur[j] = s[i - 1] == r[j - 1] ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    return prev[n];
}`,
      main: cpp`
int main() {
    string s;
    cin >> s;
    cout << longestPalSubseq(s) << "\n";
    return 0;
}`,
      io: 'Input: s. Output: length.',
      keyLines: [{ match: 'string r(s.rbegin(), s.rend());', note: 'Reverse once, then reuse LCS.' }],
      mistakes: ['Confusing with longest palindromic substring'],
      tests: [
        { in: 'bbbab', out: '4' },
        { in: 'cbbd', out: '2' },
        { in: 'a', out: '1' },
        { in: 'character', out: '5' },
      ],
    },
    {
      id: 'd30-min-deletions',
      day: 30,
      title: 'Trim Two Words to Match',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'dp-2d'],
      objective: 'Reuse LCS to count deletions.',
      statement: 'In one step you may delete one character from either word. Print the minimum steps to make the words equal.',
      constraints: ['1 ≤ |a|, |b| ≤ 500'],
      examples: [{ input: 'sea eat', output: '2' }],
      edgeCases: ['Disjoint letters → |a| + |b|'],
      cues: ['Only deletions, both strings → keep the LCS'],
      hints: ['What remains after deleting is a common subsequence.'],
      approach: 'Answer = |a| + |b| − 2 · LCS.',
      correctness: 'Keeping the longest common subsequence minimises deletions.',
      complexity: { time: 'O(n · m)', space: 'O(m)', why: 'LCS.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int minDeletions(const string& a, const string& b) {
    vector<int> prev(b.size() + 1, 0), cur(b.size() + 1, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (size_t j = 1; j <= b.size(); j++)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    return a.size() + b.size() - 2 * prev[b.size()];
}`,
      main: cpp`
int main() {
    string a, b;
    cin >> a >> b;
    cout << minDeletions(a, b) << "\n";
    return 0;
}`,
      io: 'Input: two words. Output: minimum deletions.',
      keyLines: [{ match: 'return a.size() + b.size() - 2 * prev[b.size()];', note: 'Everything outside the LCS is deleted from both.' }],
      mistakes: ['Using edit distance (allows replacements)'],
      tests: [
        { in: 'sea eat', out: '2' },
        { in: 'leetcode etco', out: '4' },
        { in: 'abc xyz', out: '6' },
        { in: 'a a', out: '0' },
      ],
    },
    {
      id: 'd30-distinct-subsequences',
      day: 30,
      title: 'Counting Hidden Copies',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'dp-1d'],
      objective: 'Counting DP over two strings.',
      statement: 'Print the number of distinct ways (by index positions) that t appears as a subsequence of s.',
      constraints: ['1 ≤ |s|, |t| ≤ 1000', 'Answer fits in 64-bit for the tests'],
      examples: [{ input: 'rabbbit rabbit', output: '3' }],
      edgeCases: ['t longer than s → 0'],
      cues: ['"number of ways" + subsequence of one string in another'],
      hints: ['ways[j] = ways to form t[0..j) from the processed prefix of s.', 'Iterate j downwards so each s character is used once per formation.'],
      approach: '1D counting DP, j descending.',
      correctness: 'For each character of s, every formation of t[0..j−1) can be extended by it when s[i] == t[j−1].',
      complexity: { time: 'O(|s| · |t|)', space: 'O(|t|)', why: 'One row.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

unsigned long long distinctSubseq(const string& s, const string& t) {
    vector<unsigned long long> ways(t.size() + 1, 0);
    ways[0] = 1;
    for (char c : s)
        for (size_t j = t.size(); j >= 1; j--)
            if (t[j - 1] == c) ways[j] += ways[j - 1];
    return ways[t.size()];
}`,
      main: cpp`
int main() {
    string s, t;
    cin >> s >> t;
    cout << distinctSubseq(s, t) << "\n";
    return 0;
}`,
      io: 'Input: s t. Output: count.',
      keyLines: [{ match: 'if (t[j - 1] == c) ways[j] += ways[j - 1];', note: 'Descending j: ways[j − 1] still excludes c.' }],
      mistakes: ['Ascending j counts one character of s twice'],
      tests: [
        { in: 'rabbbit rabbit', out: '3' },
        { in: 'babgbag bag', out: '5' },
        { in: 'abc abcd', out: '0' },
        { in: 'aaaa aa', out: '6' },
      ],
    },
    {
      id: 'd30-russian-doll',
      day: 30,
      title: 'Nesting Envelopes',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['subsequence-dp', 'custom-sort', 'binary-search'],
      objective: 'Turn a 2D chain into LIS with a clever sort.',
      statement: 'An envelope (w, h) fits into another if both width and height are strictly smaller. Print the maximum number of envelopes that can be nested.',
      constraints: ['1 ≤ n ≤ 10⁵', '1 ≤ w, h ≤ 10⁵'],
      examples: [{ input: '(5,4) (6,4) (6,7) (2,3)', output: '3' }],
      edgeCases: ['Equal widths cannot nest'],
      cues: ['Chain with two strictly increasing dimensions'],
      hints: ['Sort by width ascending, and by height descending for equal widths.', 'Then run strict LIS on heights.'],
      approach: 'Sort + LIS on heights.',
      correctness: 'Descending heights within one width prevent two envelopes of the same width from both entering the increasing subsequence.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sort + patience LIS.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int maxEnvelopes(vector<pair<int, int>> env) {
    sort(env.begin(), env.end(), [](const pair<int, int>& x, const pair<int, int>& y) {
        return x.first != y.first ? x.first < y.first : x.second > y.second;
    });
    vector<int> tails;
    for (auto& e : env) {
        auto it = lower_bound(tails.begin(), tails.end(), e.second);
        if (it == tails.end()) tails.push_back(e.second);
        else *it = e.second;
    }
    return tails.size();
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> env(n);
    for (auto& e : env) cin >> e.first >> e.second;
    cout << maxEnvelopes(env) << "\n";
    return 0;
}`,
      io: 'Input: n, then n lines "w h". Output: maximum chain length.',
      keyLines: [{ match: 'return x.first != y.first ? x.first < y.first : x.second > y.second;', note: 'Same width → taller first, so they cannot chain.' }],
      mistakes: ['Sorting heights ascending for equal widths'],
      tests: [
        { in: '4\n5 4\n6 4\n6 7\n2 3', out: '3' },
        { in: '3\n1 1\n1 1\n1 1', out: '1' },
        { in: '5\n1 2\n2 3\n3 4\n3 5\n4 5', out: '4' },
        { in: '4\n4 5\n4 6\n6 7\n2 3', out: '3' },
      ],
    },
  ],
};

export default day;
