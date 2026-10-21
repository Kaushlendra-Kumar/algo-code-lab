import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 12,
    title: 'Backtracking: Subsets, Permutations, Combinations',
    zone: 'recursion',
    objectives: [
      'Use the choose → explore → un-choose template',
      'Generate subsets, permutations and combinations without duplicates',
      'Handle duplicate input values by sorting and skipping equal siblings',
      'Estimate the size of a search tree before coding',
    ],
    prerequisites: ['Day 11: recursion and the call stack'],
    lesson: [
      {
        heading: 'The backtracking template',
        body: '```\nvoid backtrack(state):\n    if state is complete: record it\n    for each choice:\n        make the choice        (push_back, mark used)\n        backtrack(new state)\n        undo the choice        (pop_back, unmark)\n```\nThe undo step restores the state so the next choice starts clean — one shared vector is reused instead of copying at each call.',
      },
      {
        heading: 'Subsets',
        body: 'Each element is in or out: 2ⁿ subsets. The "start index" formulation records the current set at every node and only adds elements after the last one chosen, so each subset appears once.',
      },
      {
        heading: 'Permutations',
        body: 'Order matters: at every position try every unused element (track with `used[]`). n! leaves. For distinct elements there are no duplicates; with repeated values, sort and skip `nums[i] == nums[i−1]` when `nums[i−1]` is not used at this level.',
      },
      {
        heading: 'Combinations',
        body: 'Choose k of n with increasing indices (start parameter). Prune when the remaining elements cannot fill the combination: stop when `n − i < k − cur.size()`.',
      },
      {
        heading: 'Size estimates',
        body: '2²⁰ ≈ 10⁶ subsets and 10! ≈ 3.6·10⁶ permutations are fine. 2³⁰ or 13! are not — look for pruning or DP.',
      },
    ],
    recognition: [
      '"Generate all", "list every", "all possible arrangements" → backtracking.',
      'Order matters → permutations; order does not matter → subsets/combinations with a start index.',
      'Duplicates in input but unique outputs required → sort + skip equal siblings.',
      'n is small (≤ 20) — a strong hint that exponential search is intended.',
    ],
    patterns: ['backtracking', 'subsets', 'permutations', 'combinations'],
    visualizations: ['recursion'],
    exampleA: {
      id: 'd12-A',
      title: 'All subsets with choose / recurse / undo',
      goal: 'List every subset of {1, 2, 3}.',
      input: 'nums = {1, 2, 3}',
      output: '[]\n[1]\n[1,2]\n[1,2,3]\n[1,3]\n[2]\n[2,3]\n[3]\ntotal 8',
      idea: 'Every node of the recursion tree is a subset. From a node we may add any element after the last one we added, recurse, then remove it again.',
      code: TRACE_CODE.subsets,
      keyLines: [
        { match: 'out.push_back(cur);', note: 'Record the current subset at every node (not only at leaves).' },
        { match: 'for (int i = start; i < (int)nums.size(); i++) {', note: 'Only elements after the last chosen one: prevents duplicates like [2,1].' },
        { match: 'cur.push_back(nums[i]);', note: 'Choose.' },
        { match: 'cur.pop_back();', note: 'Un-choose: restore cur before trying the next element.' },
      ],
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(n) recursion + output', why: '2ⁿ subsets, each copied in O(n); the recursion depth is at most n.' },
      edgeCases: ['Empty input → one subset []', 'Duplicates in nums need sorting + skipping'],
      mistakes: ['Forgetting pop_back (cur keeps growing)', 'Recursing with i instead of i + 1 (reuses elements)'],
      tryIt: 'Print only the subsets whose sum is even.',
      trace: { id: 'subsets', input: { nums: [1, 2, 3] } },
      bug: {
        find: 'backtrack(nums, i + 1, cur, out);',
        replace: 'backtrack(nums, start + 1, cur, out);',
        symptom: 'The program prints "total 16" and lists invalid subsets such as [1,3,3] and [3,2].',
        explanation: 'The next call must start after the element just chosen (i + 1). Using start + 1 lets later loop iterations re-choose earlier or equal positions.',
      },
    },
    exampleB: {
      id: 'd12-B',
      kind: 'variant',
      title: 'Permutations with a used[] array',
      goal: 'List all orderings of {1, 2, 3}.',
      input: 'nums = {1, 2, 3}',
      output: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1',
      idea: 'Fill positions one at a time. Any element not yet used can go in the next position; mark it, recurse, unmark.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

void permute(const vector<int>& nums, vector<bool>& used, vector<int>& cur) {
    if (cur.size() == nums.size()) {
        for (size_t i = 0; i < cur.size(); i++) cout << cur[i] << (i + 1 < cur.size() ? " " : "\n");
        return;
    }
    for (size_t i = 0; i < nums.size(); i++) {
        if (used[i]) continue;
        used[i] = true;            //@gap
        cur.push_back(nums[i]);
        permute(nums, used, cur);
        cur.pop_back();
        used[i] = false;           //@gap
    }
}

int main() {
    vector<int> nums = {1, 2, 3};
    vector<bool> used(nums.size(), false);
    vector<int> cur;
    permute(nums, used, cur);
    return 0;
}`,
      keyLines: [
        { match: 'if (used[i]) continue;', note: 'Each element appears once per permutation.' },
        { match: 'used[i] = true;', note: 'Choose element i for the current position.' },
        { match: 'used[i] = false;', note: 'Undo so i is available for other branches.' },
      ],
      dryRun: {
        columns: ['depth', 'cur', 'used', 'next choice'],
        rows: [
          ['0', '[]', '---', 'try 1'],
          ['1', '[1]', 'X--', 'try 2'],
          ['2', '[1,2]', 'XX-', 'try 3 → print 1 2 3'],
          ['2', '[1,3] (after undo of 2)', 'X-X', 'try 2 → print 1 3 2'],
          ['1', '[2] (after undo of 1)', '-X-', '…'],
        ],
      },
      complexity: { time: 'O(n · n!)', space: 'O(n)', why: 'n! leaves, each printed in O(n); depth n.' },
      edgeCases: ['n = 1', 'Duplicate values produce duplicate permutations unless skipped'],
      mistakes: ['Forgetting to reset used[i]'],
      tryIt: 'Count permutations where no element stays in its original position (derangements).',
    },
    complexityNotes: 'Backtracking cost ≈ number of nodes in the recursion tree × work per node. Subsets: 2ⁿ; permutations: n!; combinations: C(n, k).',
    quiz: [
      {
        prompt: 'Why does the subsets template use a start index?',
        options: ['To make recursion faster', 'So each subset is produced once, in one canonical (increasing index) order', 'To limit depth', 'It is required by vector'],
        answer: 1,
        explanation: 'Without it, [1,2] and [2,1] would both be generated.',
      },
      {
        prompt: 'How many permutations of 10 distinct elements are there?',
        options: ['1 024', '3 628 800', '100', '10 000 000 000'],
        answer: 1,
        explanation: '10! = 3 628 800 — feasible to enumerate.',
      },
      {
        prompt: 'What breaks if you forget cur.pop_back() after the recursive call?',
        options: ['Nothing', 'cur keeps elements from finished branches, so later results are wrong', 'Stack overflow only', 'Compilation error'],
        answer: 1,
        explanation: 'The shared state must be restored for sibling branches.',
      },
    ],
    recap: 'Backtracking explores a decision tree with one shared, mutable candidate: choose, recurse, undo. Subsets use a start index, permutations use used[], and duplicates are handled by sorting and skipping equal siblings.',
    nextPrep: 'Tomorrow: pruning — stop exploring branches that can no longer succeed.',
  },
  questions: [
    {
      id: 'd12-binary-strings',
      day: 12,
      title: 'All Switch Settings',
      difficulty: 'Easy',
      topic: 'recursion',
      patterns: ['backtracking', 'subsets'],
      objective: 'Enumerate a full binary decision tree.',
      statement: 'A panel has n switches. Print every setting as a binary string in lexicographic order.',
      constraints: ['1 ≤ n ≤ 10'],
      examples: [{ input: 'n = 2', output: '00\n01\n10\n11' }],
      edgeCases: ['n = 1'],
      cues: ['Every position has two choices → 2ⁿ leaves'],
      hints: ['Recurse on the position.', 'Try 0 before 1 for lexicographic order.'],
      approach: 'gen(pos): if pos == n print; else set 0, recurse, set 1, recurse.',
      correctness: 'Each leaf corresponds to exactly one assignment of n bits.',
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(n)', why: '2ⁿ strings of length n.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

void gen(string& s, int pos) {
    if (pos == (int)s.size()) {
        cout << s << "\n";
        return;
    }
    for (char c : {'0', '1'}) {
        s[pos] = c;
        gen(s, pos + 1);
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    string s(n, '0');
    gen(s, 0);
    return 0;
}`,
      io: 'Input: n. Output: 2ⁿ strings.',
      keyLines: [{ match: 's[pos] = c;', note: 'Overwriting the position acts as both choose and undo.' }],
      mistakes: ['Printing before all positions are set'],
      tests: [
        { in: '2', out: '00\n01\n10\n11' },
        { in: '1', out: '0\n1' },
        { in: '3', out: '000\n001\n010\n011\n100\n101\n110\n111' },
        { in: '1', out: '0\n1' },
      ],
      viz: 'recursion',
    },
    {
      id: 'd12-subsets-sum',
      day: 12,
      title: 'Subset Sums',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['subsets', 'backtracking'],
      objective: 'Generate subsets and aggregate a property.',
      statement: 'Print the sums of all 2ⁿ subsets of the array, sorted ascending (the empty subset has sum 0).',
      constraints: ['1 ≤ n ≤ 15'],
      examples: [{ input: 'a = [2, 3]', output: '0 2 3 5' }],
      edgeCases: ['Negative numbers', 'Duplicate sums'],
      cues: ['All subsets → include/exclude recursion'],
      hints: ['At index i, either skip a[i] or add it.', 'Collect sums at the leaves, then sort.'],
      approach: 'Include/exclude recursion carrying the running sum.',
      correctness: 'Each leaf corresponds to one subset.',
      complexity: { time: 'O(2ⁿ log 2ⁿ)', space: 'O(2ⁿ)', why: '2ⁿ sums plus sorting.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void collect(const vector<int>& a, size_t i, long long sum, vector<long long>& out) {
    if (i == a.size()) {
        out.push_back(sum);
        return;
    }
    collect(a, i + 1, sum, out);         // exclude a[i]
    collect(a, i + 1, sum + a[i], out);  // include a[i]
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> out;
    collect(a, 0, 0, out);
    sort(out.begin(), out.end());
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: 2ⁿ sums ascending.',
      keyLines: [{ match: 'collect(a, i + 1, sum + a[i], out);', note: 'Passing sum by value means there is nothing to undo.' }],
      mistakes: ['Forgetting the empty subset'],
      tests: [
        { in: '2\n2 3', out: '0 2 3 5' },
        { in: '1\n-4', out: '-4 0' },
        { in: '3\n1 1 1', out: '0 1 1 1 2 2 2 3' },
        { in: '3\n5 -2 1', out: '-2 -1 0 1 3 4 5 6' },
      ],
    },
    {
      id: 'd12-subsets-dup',
      day: 12,
      title: 'Unique Ingredient Combos',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['subsets', 'backtracking'],
      objective: 'Skip equal siblings to avoid duplicate subsets.',
      statement: 'Ingredients may repeat. Print every distinct sub-multiset (one per line, values ascending, empty line style "[]"), in the order produced by the sorted start-index template, then the count.',
      constraints: ['1 ≤ n ≤ 10'],
      examples: [{ input: 'a = [1, 2, 2]', output: '[]\n[1]\n[1,2]\n[1,2,2]\n[2]\n[2,2]\ncount 6' }],
      edgeCases: ['All equal', 'No duplicates'],
      cues: ['Duplicates + unique results → sort and skip a[i] == a[i−1] when i > start'],
      hints: ['Sort first.', 'In the loop, skip i > start with a[i] == a[i − 1].'],
      approach: 'Start-index subsets with sibling-duplicate skipping.',
      correctness: 'Among equal values at one tree level only the first is branched on, so each multiset is generated once.',
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(n)', why: 'At most 2ⁿ subsets.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int printed = 0;

void dfs(const vector<int>& a, int start, vector<int>& cur) {
    cout << "[";
    for (size_t i = 0; i < cur.size(); i++) cout << (i ? "," : "") << cur[i];
    cout << "]\n";
    printed++;
    for (int i = start; i < (int)a.size(); i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        cur.push_back(a[i]);
        dfs(a, i + 1, cur);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    vector<int> cur;
    dfs(a, 0, cur);
    cout << "count " << printed << "\n";
    return 0;
}`,
      io: 'Input: n, then n integers. Output: distinct subsets, then the count.',
      keyLines: [{ match: 'if (i > start && a[i] == a[i - 1]) continue;', note: 'i > start (not i > 0): the first equal value at this level is still allowed.' }],
      mistakes: ['Using i > 0 (wrongly skips [2,2])'],
      tests: [
        { in: '3\n1 2 2', out: '[]\n[1]\n[1,2]\n[1,2,2]\n[2]\n[2,2]\ncount 6' },
        { in: '2\n5 5', out: '[]\n[5]\n[5,5]\ncount 3' },
        { in: '1\n0', out: '[]\n[0]\ncount 2' },
        { in: '3\n3 1 3', out: '[]\n[1]\n[1,3]\n[1,3,3]\n[3]\n[3,3]\ncount 6' },
      ],
    },
    {
      id: 'd12-permutations',
      day: 12,
      title: 'Every Seating Order',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['permutations', 'backtracking'],
      objective: 'Generate permutations in lexicographic order.',
      statement: 'Given n distinct integers, print all permutations in lexicographic order, one per line.',
      constraints: ['1 ≤ n ≤ 7'],
      examples: [{ input: 'a = [3, 1, 2]', output: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1' }],
      edgeCases: ['n = 1'],
      cues: ['Order matters → permutations with used[]'],
      hints: ['Sort the input first.', 'Trying unused elements in index order then yields lexicographic output.'],
      approach: 'Sort + used[] backtracking.',
      correctness: 'Choosing smaller values first at every position produces lexicographic order.',
      complexity: { time: 'O(n · n!)', space: 'O(n)', why: 'n! permutations of length n.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void permute(const vector<int>& a, vector<bool>& used, vector<int>& cur) {
    if (cur.size() == a.size()) {
        for (size_t i = 0; i < cur.size(); i++) cout << cur[i] << (i + 1 < cur.size() ? " " : "\n");
        return;
    }
    for (size_t i = 0; i < a.size(); i++) {
        if (used[i]) continue;
        used[i] = true;
        cur.push_back(a[i]);
        permute(a, used, cur);
        cur.pop_back();
        used[i] = false;
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    vector<bool> used(n, false);
    vector<int> cur;
    permute(a, used, cur);
    return 0;
}`,
      io: 'Input: n, then n distinct integers. Output: n! lines.',
      keyLines: [{ match: 'sort(a.begin(), a.end());', note: 'Sorted input gives lexicographic output.' }],
      mistakes: ['Not sorting first'],
      tests: [
        { in: '3\n3 1 2', out: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1' },
        { in: '1\n7', out: '7' },
        { in: '2\n5 -1', out: '-1 5\n5 -1' },
        { in: '2\n0 1', out: '0 1\n1 0' },
      ],
    },
    {
      id: 'd12-permutations-unique',
      day: 12,
      title: 'Distinct Rearrangements',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['permutations', 'backtracking'],
      objective: 'Skip duplicate permutations when values repeat.',
      statement: 'Given n integers that may repeat, print the number of distinct permutations, then each in lexicographic order.',
      constraints: ['1 ≤ n ≤ 8'],
      examples: [{ input: 'a = [1, 1, 2]', output: '3\n1 1 2\n1 2 1\n2 1 1' }],
      edgeCases: ['All equal → 1', 'All distinct → n!'],
      cues: ['Repeated values + unique orderings → skip a[i] == a[i−1] when a[i−1] is unused'],
      hints: ['Sort first.', 'Skip i if a[i] == a[i−1] and !used[i−1]: the equal value was already tried at this position.'],
      approach: 'Sorted used[] backtracking with the duplicate rule; collect, then print count and lines.',
      correctness: 'Equal values are forced to be used in index order, so each multiset arrangement is built once.',
      complexity: { time: 'O(n · n!)', space: 'O(n · P)', why: 'At most n! leaves; P = number of distinct permutations stored.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void dfs(const vector<int>& a, vector<bool>& used, vector<int>& cur, vector<vector<int>>& out) {
    if (cur.size() == a.size()) {
        out.push_back(cur);
        return;
    }
    for (size_t i = 0; i < a.size(); i++) {
        if (used[i]) continue;
        if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;
        used[i] = true;
        cur.push_back(a[i]);
        dfs(a, used, cur, out);
        cur.pop_back();
        used[i] = false;
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    vector<bool> used(n, false);
    vector<int> cur;
    vector<vector<int>> out;
    dfs(a, used, cur, out);
    cout << out.size() << "\n";
    for (auto& p : out)
        for (size_t i = 0; i < p.size(); i++) cout << p[i] << (i + 1 < p.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n integers. Output: count, then the permutations.',
      keyLines: [{ match: 'if (i > 0 && a[i] == a[i - 1] && !used[i - 1]) continue;', note: 'Only use the second copy if the first copy is already placed.' }],
      mistakes: ['Using a set of vectors to deduplicate (slower, more memory)'],
      tests: [
        { in: '3\n1 1 2', out: '3\n1 1 2\n1 2 1\n2 1 1' },
        { in: '3\n2 2 2', out: '1\n2 2 2' },
        { in: '2\n1 2', out: '2\n1 2\n2 1' },
        { in: '4\n1 1 2 2', out: '6\n1 1 2 2\n1 2 1 2\n1 2 2 1\n2 1 1 2\n2 1 2 1\n2 2 1 1' },
      ],
    },
    {
      id: 'd12-combinations',
      day: 12,
      title: 'Pick K Team Members',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['combinations', 'constraint-pruning'],
      objective: 'Generate combinations with an early-stop bound.',
      statement: 'Print all combinations of k numbers chosen from 1..n in lexicographic order.',
      constraints: ['1 ≤ k ≤ n ≤ 12'],
      examples: [{ input: 'n = 4, k = 2', output: '1 2\n1 3\n1 4\n2 3\n2 4\n3 4' }],
      edgeCases: ['k = n', 'k = 1'],
      cues: ['Choose k of n, order irrelevant → increasing indices'],
      hints: ['Recurse with the next allowed number.', 'Stop the loop when not enough numbers remain: i ≤ n − (k − size) + 1.'],
      approach: 'Start-index backtracking with the pruning bound.',
      correctness: 'Strictly increasing choices enumerate each k-subset once; the bound only removes branches that cannot reach size k.',
      complexity: { time: 'O(k · C(n, k))', space: 'O(k)', why: 'Each combination built in O(k).' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

void combine(int n, int k, int start, vector<int>& cur) {
    if ((int)cur.size() == k) {
        for (int i = 0; i < k; i++) cout << cur[i] << (i + 1 < k ? " " : "\n");
        return;
    }
    int need = k - cur.size();
    for (int i = start; i <= n - need + 1; i++) {
        cur.push_back(i);
        combine(n, k, i + 1, cur);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int n, k;
    cin >> n >> k;
    vector<int> cur;
    combine(n, k, 1, cur);
    return 0;
}`,
      io: 'Input: n k. Output: C(n, k) lines.',
      keyLines: [{ match: 'for (int i = start; i <= n - need + 1; i++) {', note: 'Pruning: leave room for the remaining picks.' }],
      mistakes: ['Looping to n without the bound (correct but explores dead branches)'],
      tests: [
        { in: '4 2', out: '1 2\n1 3\n1 4\n2 3\n2 4\n3 4' },
        { in: '1 1', out: '1' },
        { in: '3 3', out: '1 2 3' },
        { in: '5 4', out: '1 2 3 4\n1 2 3 5\n1 2 4 5\n1 3 4 5\n2 3 4 5' },
      ],
    },
    {
      id: 'd12-generate-parentheses',
      day: 12,
      title: 'All Balanced Bracket Strings',
      difficulty: 'Medium',
      topic: 'recursion',
      patterns: ['backtracking', 'constraint-pruning'],
      objective: 'Constrain choices with counters so only valid strings are built.',
      statement: 'Print all balanced strings of n pairs of parentheses in lexicographic order ("(" < ")").',
      constraints: ['1 ≤ n ≤ 8'],
      examples: [{ input: 'n = 2', output: '(())\n()()' }],
      edgeCases: ['n = 1'],
      cues: ['Generate only valid sequences → track open and close counts'],
      hints: ['You may add "(" while open < n.', 'You may add ")" while close < open.'],
      approach: 'Backtracking on (open, close) counts.',
      correctness: 'The two rules are exactly the conditions for a prefix of a balanced string.',
      complexity: { time: 'O(n · Catalan(n))', space: 'O(n)', why: 'Catalan(n) outputs of length 2n.' },
      cpp: cpp`
#include <iostream>
#include <string>
using namespace std;

void gen(string& cur, int open, int close, int n) {
    if ((int)cur.size() == 2 * n) {
        cout << cur << "\n";
        return;
    }
    if (open < n) {
        cur.push_back('(');
        gen(cur, open + 1, close, n);
        cur.pop_back();
    }
    if (close < open) {
        cur.push_back(')');
        gen(cur, open, close + 1, n);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    string cur;
    gen(cur, 0, 0, n);
    return 0;
}`,
      io: 'Input: n. Output: Catalan(n) strings.',
      keyLines: [{ match: 'if (close < open) {', note: 'Never close more than you opened.' }],
      mistakes: ['Generating all 2²ⁿ strings and filtering'],
      tests: [
        { in: '2', out: '(())\n()()' },
        { in: '1', out: '()' },
        { in: '3', out: '((()))\n(()())\n(())()\n()(())\n()()()' },
        { in: '1', out: '()' },
      ],
    },
    {
      id: 'd12-palindrome-partitions',
      day: 12,
      title: 'Palindrome Cuts',
      difficulty: 'Hard',
      topic: 'recursion',
      patterns: ['backtracking', 'combinations'],
      objective: 'Backtrack over cut positions with a validity check.',
      statement: 'Count the ways to cut a lowercase string into pieces that are all palindromes, and print the partition with the fewest pieces (if several, the first one found when trying shorter first pieces first).',
      constraints: ['1 ≤ |s| ≤ 14'],
      examples: [{ input: 's = "aab"', output: '2\naa|b', explanation: '"a|a|b" and "aa|b"' }],
      edgeCases: ['Single character', 'Whole string is a palindrome'],
      cues: ['All ways to split a string → choose the end of the next piece'],
      hints: ['From position start, try every end e where s[start..e] is a palindrome.', 'Recurse from e + 1; record when start reaches the end.', 'Track the best (fewest pieces) partition as you go.'],
      approach: 'Backtracking over piece ends; keep a running count and the best partition.',
      correctness: 'Every partition is a sequence of piece ends; the recursion enumerates each exactly once.',
      complexity: { time: 'O(n · 2ⁿ)', space: 'O(n)', why: 'Up to 2ⁿ⁻¹ partitions, palindrome checks O(n).' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string s;
long long ways = 0;
vector<string> cur, best;

bool isPal(int l, int r) {
    while (l < r)
        if (s[l++] != s[r--]) return false;
    return true;
}

void dfs(int start) {
    if (start == (int)s.size()) {
        ways++;
        if (best.empty() || cur.size() < best.size()) best = cur;
        return;
    }
    for (int e = start; e < (int)s.size(); e++) {
        if (!isPal(start, e)) continue;
        cur.push_back(s.substr(start, e - start + 1));
        dfs(e + 1);
        cur.pop_back();
    }
}`,
      main: cpp`
int main() {
    cin >> s;
    dfs(0);
    cout << ways << "\n";
    for (size_t i = 0; i < best.size(); i++) cout << best[i] << (i + 1 < best.size() ? "|" : "\n");
    return 0;
}`,
      io: 'Input: a string. Output: the number of partitions, then the fewest-piece partition joined by "|".',
      keyLines: [{ match: 'if (best.empty() || cur.size() < best.size()) best = cur;', note: 'Strict < keeps the first partition found among ties.' }],
      mistakes: ['Copying substrings for every palindrome check (slow)'],
      tests: [
        { in: 'aab', out: '2\naa|b' },
        { in: 'a', out: '1\na' },
        { in: 'aba', out: '2\naba' },
        { in: 'abc', out: '1\na|b|c' },
      ],
    },
  ],
};

export default day;
