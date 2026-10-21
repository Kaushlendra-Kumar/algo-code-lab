import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TREE_BUILD, TREE_HEAD, TREE_IO } from './shared';

// Builds a BST by inserting values in the given order (used by several drivers).
const BST_INSERT = `TreeNode* insert(TreeNode* root, int v, vector<TreeNode*>& pool) {
    if (!root) {
        pool.push_back(new TreeNode(v));
        return pool.back();
    }
    if (v < root->val) root->left = insert(root->left, v, pool);
    else root->right = insert(root->right, v, pool);
    return root;
}`;

const day: DayModule = {
  day: {
    day: 18,
    title: 'Binary Search Trees, Validation and LCA',
    zone: 'trees',
    objectives: [
      'State and use the BST ordering invariant',
      'Search, insert and traverse a BST in O(h)',
      'Validate a BST with inherited lower/upper bounds',
      'Find the lowest common ancestor by steering left or right',
    ],
    prerequisites: ['Day 16: tree DFS', 'Day 7: binary search reasoning'],
    lesson: [
      {
        heading: 'The BST invariant',
        body: 'For every node, **all** values in its left subtree are smaller and **all** values in its right subtree are larger. This is a statement about entire subtrees, not just about the direct children.',
      },
      {
        heading: 'Search and insert in O(h)',
        body: 'Compare with the current node and go left or right — the same halving idea as binary search, but over a tree. With a balanced tree h = O(log n); inserting sorted data without balancing creates a chain with h = n. `std::set`/`std::map` are self-balancing trees that guarantee O(log n).',
      },
      {
        heading: 'In-order traversal is sorted',
        body: 'In-order DFS (left, node, right) visits a BST\'s values in ascending order. This gives k-th smallest queries, validation by checking increasing order, and conversion to a sorted array.',
      },
      {
        heading: 'Validation with bounds',
        body: 'Pass down an open interval (low, high). The root may be anything; its left child must lie in (low, root.val) and its right child in (root.val, high). Use `long long` or pointers for the bounds so INT_MIN/INT_MAX values are handled.',
      },
      {
        heading: 'Lowest common ancestor in a BST',
        body: 'Starting at the root: if both values are smaller, go left; if both are larger, go right; otherwise the current node splits them and is the LCA. O(h) without extra memory.',
      },
    ],
    recognition: [
      '"BST" in the statement → exploit ordering to steer left/right.',
      '"k-th smallest", "sorted order", "closest value" → in-order traversal or guided search.',
      '"Is this a valid BST?" → bounds passed down (not just parent-child checks).',
    ],
    patterns: ['bst-property', 'tree-dfs', 'binary-search'],
    visualizations: ['tree'],
    exampleA: {
      id: 'd18-A',
      title: 'Validate a BST with inherited bounds',
      goal: 'Decide whether two given trees are valid binary search trees.',
      input: 'tree A: 5 (3 (2, 4), 8); tree B: 5 (3 (2, 6), 8)',
      output: 'tree A valid: true\ntree B valid: false',
      idea: 'Each node must lie strictly inside the interval inherited from all its ancestors. In tree B, 6 is a right child of 3 (fine locally) but sits in the left subtree of 5, so it must be < 5.',
      code: cpp`
#include <climits>
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

bool valid(TreeNode* n, long long low, long long high) {
    if (!n) return true;
    if (n->val <= low || n->val >= high) return false;
    return valid(n->left, low, n->val) && valid(n->right, n->val, high);  //@gap
}

int main() {
    TreeNode a5(5), a3(3), a8(8), a2(2), a4(4);
    a5.left = &a3; a5.right = &a8; a3.left = &a2; a3.right = &a4;
    TreeNode b5(5), b3(3), b8(8), b2(2), b6(6);
    b5.left = &b3; b5.right = &b8; b3.left = &b2; b3.right = &b6;
    cout << boolalpha;
    cout << "tree A valid: " << valid(&a5, LLONG_MIN, LLONG_MAX) << "\n";
    cout << "tree B valid: " << valid(&b5, LLONG_MIN, LLONG_MAX) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (n->val <= low || n->val >= high) return false;', note: 'Strict bounds: duplicates are not allowed in this BST definition.' },
        { match: 'return valid(n->left, low, n->val) && valid(n->right, n->val, high);', note: 'The left subtree tightens the upper bound; the right subtree tightens the lower bound.' },
        { match: 'valid(&a5, LLONG_MIN, LLONG_MAX)', note: '64-bit sentinels so node values equal to INT_MIN/INT_MAX are still accepted.' },
      ],
      dryRun: {
        columns: ['node (tree B)', 'allowed interval', 'ok?'],
        rows: [
          ['5', '(−∞, +∞)', 'yes'],
          ['3', '(−∞, 5)', 'yes'],
          ['2', '(−∞, 3)', 'yes'],
          ['6', '(3, 5)', 'no → invalid'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Each node checked once; recursion depth is the height.' },
      edgeCases: ['Empty tree is valid', 'Values at INT_MIN / INT_MAX', 'Duplicates (decide your convention)'],
      mistakes: ['Only comparing a node with its parent', 'Using int bounds with INT_MIN/INT_MAX sentinels'],
      tryIt: 'Validate by doing an in-order traversal and checking that values strictly increase.',
      bug: {
        find: 'return valid(n->left, low, n->val) && valid(n->right, n->val, high);',
        replace: 'return valid(n->left, LLONG_MIN, n->val) && valid(n->right, n->val, LLONG_MAX);',
        symptom: 'The program prints "tree B valid: true" even though 6 sits in the left subtree of 5.',
        explanation: 'Resetting the bounds at every call only compares a node with its parent. Node 6 is checked against (3, +∞) and passes, although its ancestor 5 requires it to be smaller than 5. Bounds must be inherited from all ancestors.',
      },
    },
    exampleB: {
      id: 'd18-B',
      kind: 'variant',
      title: 'Lowest common ancestor in a BST',
      goal: 'Find the deepest node that has both p and q as descendants (a node is its own descendant).',
      input: 'BST built from 6 2 8 0 4 7 9 3 5; queries (2, 8), (2, 4), (3, 5)',
      output: 'lca(2,8) = 6\nlca(2,4) = 2\nlca(3,5) = 4',
      idea: 'While both values are on the same side of the current node, move to that side. The first node where they split (or that equals one of them) is the LCA.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

TreeNode* insert(TreeNode* root, int v, vector<TreeNode*>& pool) {
    if (!root) {
        pool.push_back(new TreeNode(v));
        return pool.back();
    }
    if (v < root->val) root->left = insert(root->left, v, pool);
    else root->right = insert(root->right, v, pool);
    return root;
}

TreeNode* lca(TreeNode* root, int p, int q) {
    while (root) {
        if (p < root->val && q < root->val) root = root->left;        //@gap
        else if (p > root->val && q > root->val) root = root->right;  //@gap
        else return root;  // they split here (or one equals root)
    }
    return nullptr;
}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int v : {6, 2, 8, 0, 4, 7, 9, 3, 5}) root = insert(root, v, pool);
    for (auto [p, q] : vector<pair<int, int>>{{2, 8}, {2, 4}, {3, 5}})
        cout << "lca(" << p << "," << q << ") = " << lca(root, p, q)->val << "\n";
    for (auto* n : pool) delete n;
    return 0;
}`,
      keyLines: [
        { match: 'if (p < root->val && q < root->val) root = root->left;', note: 'Both in the left subtree — the LCA is deeper on the left.' },
        { match: 'else return root;', note: 'Values on different sides, or one of them is the current node.' },
        { match: 'TreeNode* insert(TreeNode* root, int v, vector<TreeNode*>& pool) {', note: 'Recursive BST insert; the pool owns every node for cleanup.' },
      ],
      dryRun: {
        columns: ['query', 'path', 'answer'],
        rows: [
          ['(2,8)', '6: 2 < 6 < 8 split', '6'],
          ['(2,4)', '6 → 2: p == 2', '2'],
          ['(3,5)', '6 → 2 → 4: 3 < 4 < 5 split', '4'],
        ],
      },
      complexity: { time: 'O(h)', space: 'O(1)', why: 'One root-to-node walk, iteratively.' },
      edgeCases: ['p == q', 'One node is an ancestor of the other'],
      mistakes: ['Using the general binary-tree LCA (works, but O(n)) when the BST property gives O(h)'],
      tryIt: 'Return the distance (in edges) between p and q using the LCA.',
    },
    complexityNotes: 'BST operations cost O(h): O(log n) when balanced, O(n) when degenerate. Validation and in-order traversal are O(n).',
    quiz: [
      {
        prompt: 'Tree: 10 with left child 5, and 5 has right child 12. Is it a valid BST?',
        options: ['Yes — 12 > 5', 'No — 12 is in 10\'s left subtree so it must be < 10', 'Yes — only parent/child matters', 'Cannot tell'],
        answer: 1,
        explanation: 'The invariant applies to whole subtrees.',
      },
      {
        prompt: 'In-order traversal of a valid BST produces values in…',
        options: ['Descending order', 'Ascending order', 'Level order', 'Random order'],
        answer: 1,
        explanation: 'Left subtree < node < right subtree at every node.',
      },
      {
        prompt: 'What is the cost of searching a BST built by inserting 1, 2, 3, …, n in order (no balancing)?',
        options: ['O(1)', 'O(log n)', 'O(n) — the tree is a chain', 'O(n log n)'],
        answer: 2,
        explanation: 'Sorted inserts create a degenerate tree.',
      },
    ],
    recap: 'BSTs keep left < node < right for whole subtrees. Guided search, insert and LCA are O(h); validation needs bounds inherited from ancestors.',
    nextPrep: 'Tomorrow: building trees from traversals and path problems.',
  },
  questions: [
    {
      id: 'd18-range-sum',
      day: 18,
      title: 'Total Within a Price Band',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['bst-property', 'tree-dfs'],
      objective: 'Prune subtrees using the BST order.',
      statement: 'Values are inserted into an empty BST in the given order. Print the sum of all values within [low, high].',
      constraints: ['1 ≤ n ≤ 2·10⁴', 'Distinct values'],
      examples: [{ input: 'insert 10 5 15 3 7 18, range [7, 15]', output: '32' }],
      edgeCases: ['Range covers everything', 'Range covers nothing'],
      cues: ['BST + range → skip subtrees that are entirely outside'],
      hints: ['If node < low, only the right subtree can contribute.', 'If node > high, only the left subtree can.'],
      approach: 'Pruned DFS.',
      correctness: 'Skipped subtrees contain only out-of-range values by the BST property.',
      complexity: { time: 'O(n) worst, faster with pruning', space: 'O(h)', why: 'Visits only relevant nodes plus boundaries.' },
      cpp: cpp`${TREE_HEAD}

long long rangeSum(TreeNode* n, int low, int high) {
    if (!n) return 0;
    if (n->val < low) return rangeSum(n->right, low, high);
    if (n->val > high) return rangeSum(n->left, low, high);
    return n->val + rangeSum(n->left, low, high) + rangeSum(n->right, low, high);
}`,
      main: cpp`${BST_INSERT}

int main() {
    int n;
    cin >> n;
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        root = insert(root, v, pool);
    }
    int low, high;
    cin >> low >> high;
    cout << rangeSum(root, low, high) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, n values to insert, then low high. Output: the sum.',
      keyLines: [{ match: 'if (n->val < low) return rangeSum(n->right, low, high);', note: 'The whole left subtree is even smaller — skip it.' }],
      mistakes: ['Visiting every node without pruning (correct but slower)'],
      tests: [
        { in: '6\n10 5 15 3 7 18\n7 15', out: '32' },
        { in: '1\n4\n1 3', out: '0' },
        { in: '3\n2 1 3\n1 3', out: '6' },
        { in: '7\n10 5 15 3 7 13 18\n6 10', out: '17' },
      ],
      viz: 'tree',
    },
    {
      id: 'd18-search-bst',
      day: 18,
      title: 'Find a Key in a BST',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['bst-property', 'binary-search'],
      objective: 'Guided O(h) search.',
      statement: 'After inserting the values into a BST, answer q queries: print the depth (root = 0) of each queried value, or -1 if absent.',
      constraints: ['1 ≤ n, q ≤ 10⁴'],
      examples: [{ input: 'insert 4 2 7 1 3; queries 3 5', output: '2\n-1' }],
      edgeCases: ['Query the root', 'Absent values'],
      cues: ['Search in a BST → steer by comparison'],
      hints: ['Walk down from the root counting steps.'],
      approach: 'Iterative search with a depth counter.',
      correctness: 'The BST property guarantees the target, if present, lies on the comparison path.',
      complexity: { time: 'O(h) per query', space: 'O(1)', why: 'One path walk.' },
      cpp: cpp`${TREE_HEAD}

int depthOf(TreeNode* n, int v) {
    for (int d = 0; n; d++) {
        if (v == n->val) return d;
        n = v < n->val ? n->left : n->right;
    }
    return -1;
}`,
      main: cpp`${BST_INSERT}

int main() {
    int n, q;
    cin >> n;
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        root = insert(root, v, pool);
    }
    cin >> q;
    while (q--) {
        int v;
        cin >> v;
        cout << depthOf(root, v) << "\n";
    }
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, n values, q, q queries. Output: depth or -1 per query.',
      keyLines: [{ match: 'n = v < n->val ? n->left : n->right;', note: 'Only one subtree can contain v.' }],
      mistakes: ['Searching both subtrees (O(n))'],
      tests: [
        { in: '5\n4 2 7 1 3\n2\n3 5', out: '2\n-1' },
        { in: '1\n9\n1\n9', out: '0' },
        { in: '4\n1 2 3 4\n2\n4 0', out: '3\n-1' },
        { in: '3\n5 3 8\n3\n8 3 5', out: '1\n1\n0' },
      ],
    },
    {
      id: 'd18-sorted-to-bst',
      day: 18,
      title: 'Balanced Tree From a Sorted List',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['divide-and-conquer', 'bst-property'],
      objective: 'Choose the middle as root recursively.',
      statement: 'Build a height-balanced BST from a sorted array by always choosing the middle element (left middle for even sizes) as the root. Print its pre-order traversal and height.',
      constraints: ['1 ≤ n ≤ 10⁴', 'Strictly increasing'],
      examples: [{ input: 'a = [-10, -3, 0, 5, 9]', output: '0 -10 -3 5 9\nheight 3' }],
      edgeCases: ['n = 1', 'Even n'],
      cues: ['Balanced from sorted data → divide and conquer at the middle'],
      hints: ['root = a[mid]; left subtree from a[lo..mid−1]; right from a[mid+1..hi].', 'mid = lo + (hi − lo) / 2 picks the left middle.'],
      approach: 'Recursive build on index ranges.',
      correctness: 'Each subtree is built from a contiguous sorted range, so the BST property holds; halving keeps heights within 1.',
      complexity: { time: 'O(n)', space: 'O(log n)', why: 'Each element becomes one node; recursion depth is log n.' },
      cpp: cpp`${TREE_HEAD}

TreeNode* buildBalanced(const vector<int>& a, int lo, int hi, vector<TreeNode*>& pool) {
    if (lo > hi) return nullptr;
    int mid = lo + (hi - lo) / 2;
    pool.push_back(new TreeNode(a[mid]));
    TreeNode* n = pool.back();
    n->left = buildBalanced(a, lo, mid - 1, pool);
    n->right = buildBalanced(a, mid + 1, hi, pool);
    return n;
}

void pre(TreeNode* n, vector<int>& out) {
    if (!n) return;
    out.push_back(n->val);
    pre(n->left, out);
    pre(n->right, out);
}

int height(TreeNode* n) { return n ? 1 + max(height(n->left), height(n->right)) : 0; }`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    vector<TreeNode*> pool;
    TreeNode* root = buildBalanced(a, 0, n - 1, pool);
    vector<int> out;
    pre(root, out);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    cout << "height " << height(root) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, then n sorted values. Output: pre-order, then "height h".',
      keyLines: [{ match: 'int mid = lo + (hi - lo) / 2;', note: 'Left middle for even-sized ranges (matches the expected output).' }],
      mistakes: ['Inserting the sorted values one by one (creates a chain)'],
      tests: [
        { in: '5\n-10 -3 0 5 9', out: '0 -10 -3 5 9\nheight 3' },
        { in: '1\n7', out: '7\nheight 1' },
        { in: '2\n1 3', out: '1 3\nheight 2' },
        { in: '7\n1 2 3 4 5 6 7', out: '4 2 1 3 6 5 7\nheight 3' },
      ],
    },
    {
      id: 'd18-validate-bst',
      day: 18,
      title: 'Is It Really a BST?',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['bst-property', 'tree-dfs'],
      objective: 'Validate with inherited bounds.',
      statement: 'Given a binary tree (level order), print `true` if it is a valid BST with strictly increasing in-order values.',
      constraints: ['1 ≤ nodes ≤ 10⁴', 'Values span the full 32-bit range'],
      examples: [{ input: '5 1 4 null null 3 6', output: 'false' }],
      edgeCases: ['INT_MIN / INT_MAX values', 'Duplicates → false'],
      cues: ['Validate BST → (low, high) bounds'],
      hints: ['Pass bounds down as long long.', 'Left child: high = node; right child: low = node.'],
      approach: 'Example A.',
      correctness: 'A tree is a BST iff every node lies within the bounds of its ancestors.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One DFS.' },
      cpp: cpp`${TREE_HEAD}

bool valid(TreeNode* n, long long low, long long high) {
    if (!n) return true;
    if (n->val <= low || n->val >= high) return false;
    return valid(n->left, low, n->val) && valid(n->right, n->val, high);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    cout << (valid(root, LLONG_MIN, LLONG_MAX) ? "true" : "false") << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: true or false.`,
      keyLines: [{ match: 'return valid(n->left, low, n->val) && valid(n->right, n->val, high);', note: 'Tighten exactly one bound per direction.' }],
      mistakes: ['Parent-only comparisons', 'int sentinels'],
      tests: [
        { in: '7\n5 1 4 null null 3 6', out: 'false' },
        { in: '3\n2 1 3', out: 'true' },
        { in: '1\n2147483647', out: 'true' },
        { in: '3\n1 1 null', out: 'false' },
      ],
    },
    {
      id: 'd18-kth-smallest',
      day: 18,
      title: 'K-th Smallest in a BST',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['bst-property', 'tree-dfs'],
      objective: 'Stop an in-order traversal after k visits.',
      statement: 'Insert values into a BST, then print the k-th smallest value.',
      constraints: ['1 ≤ k ≤ n ≤ 10⁴', 'Distinct values'],
      examples: [{ input: 'insert 5 3 6 2 4 1, k = 3', output: '3' }],
      edgeCases: ['k = 1', 'k = n'],
      cues: ['Order statistic in a BST → in-order traversal'],
      hints: ['In-order visits values ascending.', 'Count visits and stop at k (iterative stack makes stopping easy).'],
      approach: 'Iterative in-order with an explicit stack.',
      correctness: 'The k-th node visited in-order is the k-th smallest.',
      complexity: { time: 'O(h + k)', space: 'O(h)', why: 'Descend to the minimum, then k steps.' },
      cpp: cpp`${TREE_HEAD}
#include <stack>

int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) {
            st.push(cur);
            cur = cur->left;
        }
        cur = st.top();
        st.pop();
        if (--k == 0) return cur->val;
        cur = cur->right;
    }
    return -1;
}`,
      main: cpp`${BST_INSERT}

int main() {
    int n, k;
    cin >> n;
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        root = insert(root, v, pool);
    }
    cin >> k;
    cout << kthSmallest(root, k) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, n values, k. Output: the k-th smallest.',
      keyLines: [{ match: 'if (--k == 0) return cur->val;', note: 'Early exit once k nodes have been visited.' }],
      mistakes: ['Collecting all values first (fine but O(n))'],
      tests: [
        { in: '6\n5 3 6 2 4 1\n3', out: '3' },
        { in: '4\n3 1 4 2\n1', out: '1' },
        { in: '1\n9\n1', out: '9' },
        { in: '5\n10 20 30 40 50\n5', out: '50' },
      ],
    },
    {
      id: 'd18-lca-bst',
      day: 18,
      title: 'Shared Manager in a BST',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['bst-property'],
      objective: 'Iterative LCA using ordering.',
      statement: 'Insert values into a BST. For each query (p, q), both present, print their lowest common ancestor.',
      constraints: ['2 ≤ n ≤ 10⁵ (insertion order random enough for reasonable height)', '1 ≤ q ≤ 10⁴'],
      examples: [{ input: 'insert 6 2 8 0 4 7 9 3 5; query (2, 8)', output: '6' }],
      edgeCases: ['p == q', 'Ancestor–descendant pair'],
      cues: ['LCA in a BST → walk down while both are on one side'],
      hints: ['Both smaller → go left; both larger → go right; else stop.'],
      approach: 'Example B.',
      correctness: 'The split point is the deepest node with p and q in different (or own) subtrees.',
      complexity: { time: 'O(h) per query', space: 'O(1)', why: 'Single path.' },
      cpp: cpp`${TREE_HEAD}

int lca(TreeNode* n, int p, int q) {
    while (n) {
        if (p < n->val && q < n->val) n = n->left;
        else if (p > n->val && q > n->val) n = n->right;
        else return n->val;
    }
    return -1;
}`,
      main: cpp`${BST_INSERT}

int main() {
    int n, q;
    cin >> n;
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        root = insert(root, v, pool);
    }
    cin >> q;
    while (q--) {
        int a, b;
        cin >> a >> b;
        cout << lca(root, a, b) << "\n";
    }
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, n values, q, q pairs. Output: one LCA per line.',
      keyLines: [{ match: 'else return n->val;', note: 'Split point found.' }],
      mistakes: ['Assuming p < q'],
      tests: [
        { in: '9\n6 2 8 0 4 7 9 3 5\n3\n2 8\n2 4\n3 5', out: '6\n2\n4' },
        { in: '2\n2 1\n1\n1 2', out: '2' },
        { in: '5\n5 3 8 1 4\n2\n4 1\n8 4', out: '3\n5' },
        { in: '3\n1 2 3\n1\n3 3', out: '3' },
      ],
    },
    {
      id: 'd18-two-sum-bst',
      day: 18,
      title: 'Pair in a Sorted Tree',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['two-pointers-opposite', 'bst-property'],
      objective: 'Flatten via in-order and reuse two pointers.',
      statement: 'Insert distinct values into a BST. Print `true` if two different nodes sum to k.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: 'insert 5 3 6 2 4 7, k = 9', output: 'true' }],
      edgeCases: ['n = 1 → false', 'k = 2·value of one node → false (needs two nodes)'],
      cues: ['BST in-order = sorted array → two pointers'],
      hints: ['In-order traversal gives a sorted vector.', 'Then run opposite-direction two pointers.'],
      approach: 'In-order to vector + two pointers.',
      correctness: 'Same as sorted pair sum (Day 4).',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Traversal plus linear scan.' },
      cpp: cpp`${TREE_HEAD}

void inorder(TreeNode* n, vector<int>& out) {
    if (!n) return;
    inorder(n->left, out);
    out.push_back(n->val);
    inorder(n->right, out);
}

bool findTarget(TreeNode* root, long long k) {
    vector<int> a;
    inorder(root, a);
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        long long s = (long long)a[l] + a[r];
        if (s == k) return true;
        if (s < k) l++;
        else r--;
    }
    return false;
}`,
      main: cpp`${BST_INSERT}

int main() {
    int n;
    long long k;
    cin >> n;
    vector<TreeNode*> pool;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; i++) {
        int v;
        cin >> v;
        root = insert(root, v, pool);
    }
    cin >> k;
    cout << (findTarget(root, k) ? "true" : "false") << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: 'Input: n, n values, k. Output: true or false.',
      keyLines: [{ match: 'inorder(root, a);', note: 'The BST hands us a sorted array for free.' }],
      mistakes: ['Pairing a node with itself'],
      tests: [
        { in: '6\n5 3 6 2 4 7\n9', out: 'true' },
        { in: '6\n5 3 6 2 4 7\n28', out: 'false' },
        { in: '1\n1\n2', out: 'false' },
        { in: '3\n2 1 3\n4', out: 'true' },
      ],
    },
    {
      id: 'd18-recover-bst',
      day: 18,
      title: 'Two Swapped Labels',
      difficulty: 'Hard',
      topic: 'trees',
      patterns: ['bst-property', 'tree-dfs'],
      objective: 'Detect inversions in an in-order sequence.',
      statement: 'Exactly two node values of a BST were swapped by mistake. Print the two wrong values (smaller first), then the corrected in-order traversal.',
      constraints: ['2 ≤ nodes ≤ 1000', 'Distinct values'],
      examples: [{ input: '1 3 null null 2', output: '1 3\n1 2 3' }],
      edgeCases: ['Swapped nodes adjacent in in-order (one inversion)', 'Non-adjacent (two inversions)'],
      cues: ['A sorted sequence with two swapped elements → find the inversion(s)'],
      hints: ['Traverse in-order keeping the previous node.', 'At the first drop, the first wrong node is prev; the second wrong node is the current node of the last drop.', 'Swap their values.'],
      approach: 'In-order DFS tracking prev, first, second; swap values at the end.',
      correctness: 'Swapping two elements of a sorted list creates one inversion if adjacent, otherwise two; first/second capture both cases.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One traversal.' },
      cpp: cpp`${TREE_HEAD}

TreeNode *prevNode = nullptr, *firstBad = nullptr, *secondBad = nullptr;

void scan(TreeNode* n) {
    if (!n) return;
    scan(n->left);
    if (prevNode && prevNode->val > n->val) {
        if (!firstBad) firstBad = prevNode;
        secondBad = n;
    }
    prevNode = n;
    scan(n->right);
}

void inorder(TreeNode* n, vector<int>& out) {
    if (!n) return;
    inorder(n->left, out);
    out.push_back(n->val);
    inorder(n->right, out);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    scan(root);
    int a = firstBad->val, b = secondBad->val;
    cout << min(a, b) << " " << max(a, b) << "\n";
    swap(firstBad->val, secondBad->val);
    vector<int> out;
    inorder(root, out);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "\n");
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the two swapped values, then the fixed in-order.`,
      keyLines: [{ match: 'if (!firstBad) firstBad = prevNode;', note: 'The first violation identifies the larger misplaced value.' }],
      mistakes: ['Assuming the swap is always between adjacent in-order nodes'],
      tests: [
        { in: '5\n1 3 null null 2', out: '1 3\n1 2 3' },
        { in: '7\n3 1 4 null null 2 null', out: '2 3\n1 2 3 4' },
        { in: '2\n1 2', out: '1 2\n1 2' },
        { in: '7\n4 2 6 1 7 5 3', out: '3 7\n1 2 3 4 5 6 7' },
      ],
    },
  ],
};

export default day;
