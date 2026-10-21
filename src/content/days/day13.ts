import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 13,
    title: 'Constraint Pruning: Combination Sum and Word Search',
    zone: 'recursion',
    objectives: [
      'Prune branches that provably cannot lead to a solution',
      'Use sorting to turn "skip this candidate" into "stop the loop"',
      'Backtrack on grids with in-place visited marking',
      'Recognise when pruning is enough and when DP is needed',
    ],
    prerequisites: ['Day 12: backtracking template'],
    lesson: [
      {
        heading: 'Pruning',
        body: 'A branch can be cut as soon as a cheap test proves no completion of it works: the remaining sum is negative, a queen is attacked, the word does not match. Pruning does not change worst-case complexity, but it often shrinks the explored tree by orders of magnitude.',
      },
      {
        heading: 'Sort to prune harder',
        body: 'In combination sum, sort the candidates. If candidate i is already larger than the remaining target, every later candidate is too — so `break` instead of `continue`.',
      },
      {
        heading: 'Reuse vs. no reuse',
        body: '- Each number reusable → recurse with the same index `i`.\n- Each number used at most once → recurse with `i + 1`.\n- Duplicates in input, unique results → sort and skip `c[i] == c[i−1]` for `i > start`.',
      },
      {
        heading: 'Grid backtracking',
        body: 'Word search explores 4 directions from each cell. Mark a cell as visited by temporarily overwriting it (e.g. with \'#\') and restore it after the recursive calls. Prune immediately when the current cell does not match the next letter.',
      },
      {
        heading: 'When pruning is not enough',
        body: 'If you only need to **count** solutions or find an **optimum**, and subproblems repeat (same index, same remaining sum), dynamic programming (Day 26+) avoids re-exploring them.',
      },
    ],
    recognition: [
      '"All combinations that sum to target" → backtracking with sorted pruning.',
      '"Does the word exist in the grid" → DFS with in-place visited marks.',
      'Constraint satisfaction (N-Queens, Sudoku) → place, check conflicts early, undo.',
      'Only a count/optimum needed with overlapping states → consider DP instead.',
    ],
    patterns: ['constraint-pruning', 'backtracking', 'combinations', 'grid-traversal', 'branch-and-bound'],
    visualizations: ['recursion'],
    exampleA: {
      id: 'd13-A',
      title: 'Combination sum with sorted pruning',
      goal: 'List all combinations of candidates (reusable) that add up to the target.',
      input: 'candidates = {2, 3, 5}, target = 8',
      output: '2 2 2 2\n2 3 3\n3 5\ncount 3',
      idea: 'Sort candidates. At each node try candidates from the current index (reuse allowed). As soon as one exceeds the remaining target, all later ones do too — break.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int found = 0;

void dfs(const vector<int>& c, int start, int remain, vector<int>& cur) {
    if (remain == 0) {
        for (size_t i = 0; i < cur.size(); i++) cout << cur[i] << (i + 1 < cur.size() ? " " : "\n");
        found++;
        return;
    }
    for (int i = start; i < (int)c.size(); i++) {
        if (c[i] > remain) break;          // sorted: later candidates are larger too
        cur.push_back(c[i]);
        dfs(c, i, remain - c[i], cur);     //@gap
        cur.pop_back();
    }
}

int main() {
    vector<int> c = {5, 2, 3};
    sort(c.begin(), c.end());
    vector<int> cur;
    dfs(c, 0, 8, cur);
    cout << "count " << found << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'sort(c.begin(), c.end());', note: 'Sorting enables the break and produces combinations in non-decreasing order.' },
        { match: 'if (c[i] > remain) break;', note: 'Prune the whole rest of the loop, not just this candidate.' },
        { match: 'dfs(c, i, remain - c[i], cur);', note: 'Pass i (not i + 1) because a candidate may be reused.' },
      ],
      dryRun: {
        columns: ['cur', 'remain', 'action'],
        rows: [
          ['[2,2,2,2]', '0', 'record'],
          ['[2,2,2]', '2', 'try 3 > 2 → break'],
          ['[2,3,3]', '0', 'record'],
          ['[2,3]', '3', 'try 5 > 3 → break (after 3)'],
          ['[3,5]', '0', 'record'],
          ['[5]', '3', '5 > 3 → break'],
        ],
      },
      complexity: { time: 'Exponential in target/min(c)', space: 'O(target / min(c))', why: 'The tree depth is at most target / smallest candidate; pruning cuts most of the width.' },
      edgeCases: ['No combination → count 0', 'Candidate equal to target', 'Large target with small candidates can explode — consider DP for counting'],
      mistakes: ['continue instead of break (correct but slower)', 'Recursing with 0 instead of i (produces permutations of the same combination)'],
      tryIt: 'Make each candidate usable at most once (recurse with i + 1) and handle duplicate candidates.',
      bug: {
        find: 'dfs(c, i, remain - c[i], cur);',
        replace: 'dfs(c, 0, remain - c[i], cur);',
        symptom: 'The program prints "count 6" — the same combination appears in different orders (2 3 3, 3 2 3, 3 3 2).',
        explanation: 'Restarting at index 0 lets the recursion pick smaller candidates after larger ones, generating permutations of the same multiset. Passing i keeps each combination non-decreasing.',
      },
    },
    exampleB: {
      id: 'd13-B',
      kind: 'variant',
      title: 'Word search on a grid',
      goal: 'Decide whether a word can be traced through horizontally/vertically adjacent cells without reusing a cell.',
      input: 'board ABCE / SFCS / ADEE; words "ABCCED" and "ABCB"',
      output: 'ABCCED: found\nABCB: not found',
      idea: 'Start DFS from every cell matching the first letter. Mark the cell, explore 4 neighbours for the next letter, then unmark.',
      code: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool dfs(vector<string>& b, const string& w, int r, int c, int k) {
    if (k == (int)w.size()) return true;
    if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[k]) return false;
    char saved = b[r][c];
    b[r][c] = '#';  // mark visited
    bool ok = dfs(b, w, r + 1, c, k + 1) || dfs(b, w, r - 1, c, k + 1) ||
              dfs(b, w, r, c + 1, k + 1) || dfs(b, w, r, c - 1, k + 1);
    b[r][c] = saved;  // undo
    return ok;
}

bool exists(vector<string> b, const string& w) {
    for (int r = 0; r < (int)b.size(); r++)
        for (int c = 0; c < (int)b[0].size(); c++)
            if (dfs(b, w, r, c, 0)) return true;
    return false;
}

int main() {
    vector<string> board = {"ABCE", "SFCS", "ADEE"};
    for (string w : {"ABCCED", "ABCB"})
        cout << w << ": " << (exists(board, w) ? "found" : "not found") << "\n";
    return 0;
}`,
      keyLines: [
        { match: "b[r][c] != w[k]", note: 'Prune immediately on a mismatch or out-of-bounds cell.' },
        { match: "b[r][c] = '#';", note: 'Temporarily mark the cell so the path cannot reuse it.' },
        { match: 'b[r][c] = saved;', note: 'Restore the cell for other paths.' },
      ],
      dryRun: {
        columns: ['step', 'cell', 'letter', 'result'],
        rows: [
          ['1', '(0,0)', 'A', 'match'],
          ['2', '(0,1)', 'B', 'match'],
          ['3', '(0,2)', 'C', 'match'],
          ['4', '(1,2)', 'C', 'match'],
          ['5', '(2,2)', 'E', 'match'],
          ['6', '(2,1)', 'D', 'match → found'],
        ],
      },
      complexity: { time: 'O(R·C·3^L)', space: 'O(L)', why: 'From each start, every step has at most 3 new directions; recursion depth is the word length L.' },
      edgeCases: ['Word longer than R·C', 'Single cell grid', 'Revisiting a cell must be prevented (ABCB)'],
      mistakes: ['Forgetting to restore the cell', 'Using a global visited array without resetting it'],
      tryIt: 'Count how many distinct starting cells lead to the word.',
    },
    complexityNotes: 'Backtracking with pruning is still exponential in the worst case; the value of pruning is in the constant factors and typical inputs. Always reason about the search tree size.',
    quiz: [
      {
        prompt: 'Candidates are sorted ascending and c[i] > remaining. Why is break correct (not just continue)?',
        options: ['Because the loop is too slow', 'Every later candidate is ≥ c[i], so none can fit either', 'It avoids recursion', 'It is not correct'],
        answer: 1,
        explanation: 'Sortedness turns one failure into a proof for the rest of the loop.',
      },
      {
        prompt: 'In combination sum where each candidate may be reused, which index do you pass to the recursive call?',
        options: ['0', 'i', 'i + 1', 'start + 1'],
        answer: 1,
        explanation: 'Same index allows reuse; never going back to smaller indices prevents permutations.',
      },
      {
        prompt: 'Word search marks a cell with \'#\' before recursing. What must happen afterwards?',
        options: ['Nothing', 'Restore the original letter', 'Mark neighbours', 'Clear the whole board'],
        answer: 1,
        explanation: 'Other paths may need that cell.',
      },
    ],
    recap: 'Pruning stops hopeless branches early; sorting often turns a skip into a break. Grid backtracking marks and unmarks cells in place.',
    nextPrep: 'Tomorrow: bit manipulation — a compact way to represent subsets and flags.',
  },
  questions: [
    {
      id: 'd13-subset-sum-exists',
      day: 13,
      title: 'Exact Change',
      difficulty: 'Easy',
      topic: 'recursion',
      patterns: ['backtracking', 'constraint-pruning'],
      objective: 'Search include/exclude with a remaining-sum prune.',
      statement: 'Given n positive coin values (each usable at most once), print `true` if some subset sums exactly to target.',
      constraints: ['1 ≤ n ≤ 20', '1 ≤ value, target ≤ 10⁶'],
      examples: [{ input: 'coins = [3, 34, 4, 12, 5, 2], target = 9', output: 'true' }],
      edgeCases: ['Target smaller than every coin', 'Single coin equal to target'],
      cues: ['n ≤ 20 → 2ⁿ search is fine; prune when the remainder goes negative'],
      hints: ['Recurse on index i with the remaining target.', 'Stop when remaining < 0.', 'Return as soon as remaining == 0.'],
      approach: 'Include/exclude DFS with early exit.',
      correctness: 'All subsets are explored except those already exceeding the target.',
      complexity: { time: 'O(2ⁿ)', space: 'O(n)', why: 'Binary tree of depth n.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

bool canMake(const vector<long long>& c, size_t i, long long remain) {
    if (remain == 0) return true;
    if (remain < 0 || i == c.size()) return false;
    return canMake(c, i + 1, remain - c[i]) || canMake(c, i + 1, remain);
}`,
      main: cpp`
int main() {
    int n;
    long long t;
    cin >> n >> t;
    vector<long long> c(n);
    for (auto& x : c) cin >> x;
    cout << (canMake(c, 0, t) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n target, then n values. Output: true or false.',
      keyLines: [{ match: 'if (remain < 0 || i == c.size()) return false;', note: 'Prune overshoots; stop at the end of the list.' }],
      mistakes: ['Checking remain == 0 after the index check (misses a full-length subset)'],
      tests: [
        { in: '6 9\n3 34 4 12 5 2', out: 'true' },
        { in: '6 30\n3 34 4 12 5 2', out: 'false' },
        { in: '1 7\n7', out: 'true' },
        { in: '3 1\n2 3 4', out: 'false' },
      ],
      viz: 'recursion',
    },
    {
      id: 'd13-combination-sum',
      day: 13,
      title: 'Count Recipes for a Target',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['combinations', 'constraint-pruning'],
      objective: 'Count combinations with reuse using sorted pruning.',
      statement: 'Count the combinations (multisets) of distinct positive candidates, each usable any number of times, that sum to target.',
      constraints: ['1 ≤ n ≤ 30', '2 ≤ candidate ≤ 40', '1 ≤ target ≤ 40'],
      examples: [{ input: 'c = [2, 3, 6, 7], target = 7', output: '2', explanation: '[2,2,3] and [7]' }],
      edgeCases: ['No solution', 'Target equals one candidate'],
      cues: ['Reuse allowed, order irrelevant → same-index recursion over sorted candidates'],
      hints: ['Sort the candidates.', 'Recurse with the same index for reuse.', 'Break when a candidate exceeds the remainder.'],
      approach: 'Example A without printing.',
      correctness: 'Non-decreasing index order makes each multiset unique.',
      complexity: { time: 'Exponential (small target)', space: 'O(target)', why: 'Depth ≤ target / 2.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long countCombos(const vector<int>& c, int start, int remain) {
    if (remain == 0) return 1;
    long long total = 0;
    for (int i = start; i < (int)c.size() && c[i] <= remain; i++) total += countCombos(c, i, remain - c[i]);
    return total;
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> c(n);
    for (auto& x : c) cin >> x;
    sort(c.begin(), c.end());
    cout << countCombos(c, 0, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n candidates. Output: number of combinations.',
      keyLines: [{ match: 'for (int i = start; i < (int)c.size() && c[i] <= remain; i++)', note: 'Pruning folded into the loop condition.' }],
      mistakes: ['Counting permutations (starting at 0 in recursion)'],
      tests: [
        { in: '4 7\n2 3 6 7', out: '2' },
        { in: '3 8\n2 3 5', out: '3' },
        { in: '1 1\n2', out: '0' },
        { in: '2 10\n2 5', out: '2' },
      ],
    },
    {
      id: 'd13-combination-sum-ii',
      day: 13,
      title: 'Use Each Coin Once',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['combinations', 'constraint-pruning'],
      objective: 'Combine i + 1 recursion with duplicate skipping.',
      statement: 'Coins may repeat; each coin can be used at most once. Print every distinct combination summing to target (non-decreasing, lexicographic order), then the count.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ coin ≤ 50', '1 ≤ target ≤ 30'],
      examples: [{ input: 'c = [10,1,2,7,6,1,5], target = 8', output: '1 1 6\n1 2 5\n1 7\n2 6\ncount 4' }],
      edgeCases: ['All coins equal', 'No solution → only "count 0"'],
      cues: ['Use once + duplicates → sort, recurse i + 1, skip equal siblings'],
      hints: ['Sort.', 'Skip i > start with c[i] == c[i − 1].', 'Recurse with i + 1.'],
      approach: 'Sorted backtracking with sibling deduplication and break pruning.',
      correctness: 'Each multiset is generated once from its sorted representation.',
      complexity: { time: 'O(2ⁿ) worst case', space: 'O(n)', why: 'Each coin in or out, heavily pruned.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int combos = 0;

void dfs(const vector<int>& c, int start, int remain, vector<int>& cur) {
    if (remain == 0) {
        for (size_t i = 0; i < cur.size(); i++) cout << cur[i] << (i + 1 < cur.size() ? " " : "\n");
        combos++;
        return;
    }
    for (int i = start; i < (int)c.size(); i++) {
        if (i > start && c[i] == c[i - 1]) continue;
        if (c[i] > remain) break;
        cur.push_back(c[i]);
        dfs(c, i + 1, remain - c[i], cur);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int n, t;
    cin >> n >> t;
    vector<int> c(n);
    for (auto& x : c) cin >> x;
    sort(c.begin(), c.end());
    vector<int> cur;
    dfs(c, 0, t, cur);
    cout << "count " << combos << "\n";
    return 0;
}`,
      io: 'Input: n target, then n coins. Output: combinations, then the count.',
      keyLines: [{ match: 'if (i > start && c[i] == c[i - 1]) continue;', note: 'Avoid starting two identical branches at the same level.' }],
      mistakes: ['Using a set to deduplicate results'],
      tests: [
        { in: '7 8\n10 1 2 7 6 1 5', out: '1 1 6\n1 2 5\n1 7\n2 6\ncount 4' },
        { in: '5 5\n2 5 2 1 2', out: '1 2 2\n5\ncount 2' },
        { in: '2 3\n1 1', out: 'count 0' },
        { in: '3 2\n1 1 1', out: '1 1\ncount 1' },
      ],
    },
    {
      id: 'd13-combination-sum-iii',
      day: 13,
      title: 'K Digits Adding to N',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['combinations', 'constraint-pruning'],
      objective: 'Prune by both count and sum.',
      statement: 'Print all combinations of k distinct digits from 1–9 that sum to n (ascending inside, lexicographic overall), then the count.',
      constraints: ['2 ≤ k ≤ 9', '1 ≤ n ≤ 60'],
      examples: [{ input: 'k = 3, n = 7', output: '1 2 4\ncount 1' }],
      edgeCases: ['Impossible: n too large or too small'],
      cues: ['Small fixed domain (1–9) with count + sum constraints'],
      hints: ['Choose digits in increasing order.', 'Stop when the size reaches k or the sum exceeds n.'],
      approach: 'Backtracking over digits 1–9 with two prunes.',
      correctness: 'Increasing digits give each set once.',
      complexity: { time: 'O(C(9, k) · k)', space: 'O(k)', why: 'At most C(9, k) combinations.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int total = 0;

void dfs(int start, int k, int remain, vector<int>& cur) {
    if ((int)cur.size() == k) {
        if (remain == 0) {
            for (int i = 0; i < k; i++) cout << cur[i] << (i + 1 < k ? " " : "\n");
            total++;
        }
        return;
    }
    for (int d = start; d <= 9 && d <= remain; d++) {
        cur.push_back(d);
        dfs(d + 1, k, remain - d, cur);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int k, n;
    cin >> k >> n;
    vector<int> cur;
    dfs(1, k, n, cur);
    cout << "count " << total << "\n";
    return 0;
}`,
      io: 'Input: k n. Output: combinations, then the count.',
      keyLines: [{ match: 'for (int d = start; d <= 9 && d <= remain; d++) {', note: 'Digits increase, and must not exceed what is left.' }],
      mistakes: ['Allowing repeated digits'],
      tests: [
        { in: '3 7', out: '1 2 4\ncount 1' },
        { in: '3 9', out: '1 2 6\n1 3 5\n2 3 4\ncount 3' },
        { in: '4 1', out: 'count 0' },
        { in: '2 17', out: '8 9\ncount 1' },
      ],
    },
    {
      id: 'd13-word-search',
      day: 13,
      title: 'Hidden Word on a Board',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['backtracking', 'grid-traversal', 'constraint-pruning'],
      objective: 'DFS on a grid with in-place marking.',
      statement: 'Given an R×C board of uppercase letters and a word, print `true` if the word can be formed from sequentially adjacent (up/down/left/right) cells without reusing a cell.',
      constraints: ['1 ≤ R, C ≤ 6', '1 ≤ |word| ≤ 15'],
      examples: [{ input: 'board = [ABCE,SFCS,ADEE], word = SEE', output: 'true' }],
      edgeCases: ['Word longer than the board', 'Cell reuse required → false'],
      cues: ['Path through a grid with no reuse → backtracking DFS'],
      hints: ['Try every starting cell.', 'Mark the cell before exploring and restore it afterwards.'],
      approach: 'Example B.',
      correctness: 'DFS enumerates all simple paths that match the word prefix by prefix.',
      complexity: { time: 'O(R·C·3^L)', space: 'O(L)', why: 'Branching factor ≤ 3 after the first step.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool dfs(vector<string>& b, const string& w, int r, int c, int k) {
    if (k == (int)w.size()) return true;
    if (r < 0 || c < 0 || r >= (int)b.size() || c >= (int)b[0].size() || b[r][c] != w[k]) return false;
    char saved = b[r][c];
    b[r][c] = '#';
    bool ok = dfs(b, w, r + 1, c, k + 1) || dfs(b, w, r - 1, c, k + 1) || dfs(b, w, r, c + 1, k + 1) || dfs(b, w, r, c - 1, k + 1);
    b[r][c] = saved;
    return ok;
}

bool exists(vector<string>& b, const string& w) {
    for (int r = 0; r < (int)b.size(); r++)
        for (int c = 0; c < (int)b[0].size(); c++)
            if (dfs(b, w, r, c, 0)) return true;
    return false;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<string> b(R);
    for (auto& row : b) cin >> row;
    string w;
    cin >> w;
    cout << (exists(b, w) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: R C, R rows, then the word. Output: true or false.',
      keyLines: [{ match: "b[r][c] = '#';", note: 'In-place visited mark.' }],
      mistakes: ['Not restoring the cell'],
      tests: [
        { in: '3 4\nABCE\nSFCS\nADEE\nSEE', out: 'true' },
        { in: '3 4\nABCE\nSFCS\nADEE\nABCB', out: 'false' },
        { in: '1 1\nA\nA', out: 'true' },
        { in: '2 2\nAB\nCD\nABDC', out: 'true' },
      ],
    },
    {
      id: 'd13-target-sum-ways',
      day: 13,
      title: 'Plus or Minus',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['backtracking', 'subsets'],
      objective: 'Explore a binary sign choice per element.',
      statement: 'Assign + or − to each number so the expression equals target. Print the number of ways.',
      constraints: ['1 ≤ n ≤ 20', '0 ≤ value ≤ 1000'],
      examples: [{ input: 'a = [1, 1, 1, 1, 1], target = 3', output: '5' }],
      edgeCases: ['Zeros double the count', 'Unreachable target'],
      cues: ['Two choices per element, n ≤ 20 → 2ⁿ search'],
      hints: ['Recurse with the running total.', 'At the end compare with target.'],
      approach: 'Plain 2ⁿ DFS (a subset-sum DP also works).',
      correctness: 'Every sign assignment is one leaf.',
      complexity: { time: 'O(2ⁿ)', space: 'O(n)', why: 'Full binary tree.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long ways(const vector<int>& a, size_t i, long long sum, long long target) {
    if (i == a.size()) return sum == target ? 1 : 0;
    return ways(a, i + 1, sum + a[i], target) + ways(a, i + 1, sum - a[i], target);
}`,
      main: cpp`
int main() {
    int n;
    long long t;
    cin >> n >> t;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    cout << ways(a, 0, 0, t) << "\n";
    return 0;
}`,
      io: 'Input: n target, then n values. Output: number of ways.',
      keyLines: [{ match: 'return ways(a, i + 1, sum + a[i], target) + ways(a, i + 1, sum - a[i], target);', note: 'Both signs explored.' }],
      mistakes: ['Treating +0 and −0 as the same way (they count separately)'],
      tests: [
        { in: '5 3\n1 1 1 1 1', out: '5' },
        { in: '1 1\n1', out: '1' },
        { in: '2 0\n0 0', out: '4' },
        { in: '3 10\n1 2 3', out: '0' },
      ],
    },
    {
      id: 'd13-n-queens',
      day: 13,
      title: 'Peaceful Queens',
      difficulty: 'Hard',
      topic: 'recursion',
      patterns: ['constraint-pruning', 'backtracking', 'bit-masks'],
      objective: 'Place one queen per row with O(1) conflict checks.',
      statement: 'Count the ways to place n queens on an n×n board so that no two attack each other.',
      constraints: ['1 ≤ n ≤ 12'],
      examples: [{ input: 'n = 4', output: '2' }],
      edgeCases: ['n = 1 → 1', 'n = 2, 3 → 0'],
      cues: ['One per row → backtrack over rows; track used columns and diagonals'],
      hints: ['Place exactly one queen per row.', 'Column c, diagonal r + c and anti-diagonal r − c + n − 1 identify conflicts.', 'Use boolean arrays (or bit masks) for O(1) checks.'],
      approach: 'Row-by-row backtracking with three occupancy arrays.',
      correctness: 'Each solution has one queen per row; the arrays reject exactly the attacked squares.',
      complexity: { time: 'O(n!) bound, far less with pruning', space: 'O(n)', why: 'At most n choices in row 0, n − 1 in row 1, …' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int n;
vector<bool> col, diag, anti;

long long place(int r) {
    if (r == n) return 1;
    long long ways = 0;
    for (int c = 0; c < n; c++) {
        if (col[c] || diag[r + c] || anti[r - c + n - 1]) continue;
        col[c] = diag[r + c] = anti[r - c + n - 1] = true;
        ways += place(r + 1);
        col[c] = diag[r + c] = anti[r - c + n - 1] = false;
    }
    return ways;
}`,
      main: cpp`
int main() {
    cin >> n;
    col.assign(n, false);
    diag.assign(2 * n - 1, false);
    anti.assign(2 * n - 1, false);
    cout << place(0) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: number of solutions.',
      keyLines: [{ match: 'if (col[c] || diag[r + c] || anti[r - c + n - 1]) continue;', note: 'Constant-time attack check.' }],
      mistakes: ['Scanning the board for conflicts each time (O(n) extra per check)'],
      tests: [
        { in: '4', out: '2' },
        { in: '1', out: '1' },
        { in: '3', out: '0' },
        { in: '8', out: '92' },
      ],
    },
    {
      id: 'd13-sudoku',
      day: 13,
      title: 'Solve the Number Grid',
      difficulty: 'Hard',
      topic: 'recursion',
      patterns: ['constraint-pruning', 'backtracking'],
      objective: 'Fill cells with candidates that respect row, column and box constraints.',
      statement: 'Solve a 9×9 Sudoku given as 9 lines of digits with 0 for empty cells. Print the solved grid (puzzles have a unique solution).',
      constraints: ['Valid puzzle with a unique solution'],
      examples: [{ input: '9 lines of digits', output: '9 solved lines' }],
      edgeCases: ['Already solved grid'],
      cues: ['Constraint satisfaction → backtracking with fast validity checks'],
      hints: ['Track used digits per row, column and 3×3 box.', 'Fill the next empty cell with each allowed digit, recurse, undo.'],
      approach: 'Backtracking over empty cells with three occupancy tables.',
      correctness: 'Only consistent placements are made, and every possibility is tried before backtracking.',
      complexity: { time: 'Exponential worst case', space: 'O(81)', why: 'Bounded board; pruning makes typical puzzles fast.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<string> g(9);
bool rowUsed[9][10], colUsed[9][10], boxUsed[9][10];

bool solve(int idx) {
    if (idx == 81) return true;
    int r = idx / 9, c = idx % 9, b = (r / 3) * 3 + c / 3;
    if (g[r][c] != '0') return solve(idx + 1);
    for (int d = 1; d <= 9; d++) {
        if (rowUsed[r][d] || colUsed[c][d] || boxUsed[b][d]) continue;
        rowUsed[r][d] = colUsed[c][d] = boxUsed[b][d] = true;
        g[r][c] = char('0' + d);
        if (solve(idx + 1)) return true;
        g[r][c] = '0';
        rowUsed[r][d] = colUsed[c][d] = boxUsed[b][d] = false;
    }
    return false;
}`,
      main: cpp`
int main() {
    for (int r = 0; r < 9; r++) {
        cin >> g[r];
        for (int c = 0; c < 9; c++) {
            int d = g[r][c] - '0';
            if (d) rowUsed[r][d] = colUsed[c][d] = boxUsed[(r / 3) * 3 + c / 3][d] = true;
        }
    }
    solve(0);
    for (auto& row : g) cout << row << "\n";
    return 0;
}`,
      io: 'Input: 9 lines of 9 digits (0 = empty). Output: the solved grid.',
      keyLines: [{ match: 'int r = idx / 9, c = idx % 9, b = (r / 3) * 3 + c / 3;', note: 'Box index 0..8 from the row and column.' }],
      mistakes: ['Forgetting to undo the occupancy tables'],
      tests: [
        {
          in: '530070000\n600195000\n098000060\n800060003\n400803001\n700020006\n060000280\n000419005\n000080079',
          out: '534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179',
        },
        {
          in: '534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286170',
          out: '534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179',
        },
        {
          in: '000000000\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179',
          out: '534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179',
        },
      ],
    },
  ],
};

export default day;
