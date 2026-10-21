import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TREE_BUILD, TREE_HEAD, TREE_IO } from './shared';

const day: DayModule = {
  day: {
    day: 16,
    title: 'Binary Trees and Depth-First Traversals',
    zone: 'trees',
    objectives: [
      'Implement pre-, in- and post-order DFS recursively',
      'Compute subtree properties (height, size, sum) bottom-up',
      'Separate "value returned to the parent" from "global best answer"',
      'Handle null children and skewed trees safely',
    ],
    prerequisites: ['Day 11: recursion', 'Pointers and structs'],
    lesson: [
      {
        heading: 'Binary trees',
        body: 'Each node has at most two children, `left` and `right`. Leaves have no children. The **height** is the number of nodes on the longest root-to-leaf path. A tree with n nodes can have height between ⌈log₂(n + 1)⌉ (balanced) and n (a chain).',
      },
      {
        heading: 'Three DFS orders',
        body: '- **Pre-order**: node, left, right — copying a tree, serialising.\n- **In-order**: left, node, right — sorted order for BSTs.\n- **Post-order**: left, right, node — compute a node from its children (heights, sizes, deleting).',
      },
      {
        heading: 'Bottom-up thinking',
        body: 'Most tree questions have the shape `f(node) = combine(f(node->left), f(node->right), node->val)` with `f(nullptr)` as the base case. Trust the recursive calls on the subtrees, just like Day 11.',
      },
      {
        heading: 'Return value vs. global answer',
        body: 'For the **diameter** (longest path between any two nodes), each node returns its height to the parent, but the best path through it uses **both** children: leftHeight + rightHeight. Keep that in a separate variable updated at every node.',
      },
      {
        heading: 'Cost',
        body: 'Each node is visited once: O(n) time. The recursion stack is O(h): O(log n) for balanced trees but O(n) for a chain — very deep trees may need an explicit stack.',
      },
    ],
    recognition: [
      'Property of a whole subtree (height, size, balanced?) → post-order DFS returning values.',
      'Information flowing from root to leaves (path sums, depth limits) → pass parameters down.',
      'Answer may pass through a node using both sides → global best + returned partial value.',
    ],
    patterns: ['tree-dfs', 'recursive-decomposition'],
    visualizations: ['tree'],
    exampleA: {
      id: 'd16-A',
      title: 'Traversal orders, height and sum',
      goal: 'Print the three DFS orders of a small tree and compute its height and node sum.',
      input: 'tree: 1 (left 2 (children 4, 5), right 3)',
      output: 'preorder: 1 2 4 5 3\ninorder: 4 2 5 1 3\npostorder: 4 5 2 3 1\nheight = 3\nsum = 15',
      idea: 'The three orders differ only in where the node is printed relative to its two recursive calls. Height and sum are post-order: combine the children\'s answers.',
      code: cpp`
#include <algorithm>
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

void preorder(TreeNode* n) {
    if (!n) return;
    cout << " " << n->val;
    preorder(n->left);
    preorder(n->right);
}

void inorder(TreeNode* n) {
    if (!n) return;
    inorder(n->left);
    cout << " " << n->val;
    inorder(n->right);
}

void postorder(TreeNode* n) {
    if (!n) return;
    postorder(n->left);
    postorder(n->right);
    cout << " " << n->val;
}

int height(TreeNode* n) {
    if (!n) return 0;
    return 1 + max(height(n->left), height(n->right));  //@gap
}

long long sum(TreeNode* n) { return n ? n->val + sum(n->left) + sum(n->right) : 0; }

int main() {
    TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);
    n1.left = &n2;
    n1.right = &n3;
    n2.left = &n4;
    n2.right = &n5;
    cout << "preorder:";
    preorder(&n1);
    cout << "\ninorder:";
    inorder(&n1);
    cout << "\npostorder:";
    postorder(&n1);
    cout << "\nheight = " << height(&n1) << "\n";
    cout << "sum = " << sum(&n1) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (!n) return;', note: 'Every traversal starts with the null base case.' },
        { match: 'return 1 + max(height(n->left), height(n->right));', note: 'Post-order: the node\'s height comes from its children.' },
        { match: 'long long sum(TreeNode* n) { return n ? n->val + sum(n->left) + sum(n->right) : 0; }', note: 'The empty tree sums to 0.' },
        { match: 'TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);', note: 'Stack-allocated nodes: no new/delete needed for a fixed demo tree.' },
      ],
      dryRun: {
        columns: ['call', 'height(left)', 'height(right)', 'returns'],
        rows: [
          ['height(4)', '0', '0', '1'],
          ['height(5)', '0', '0', '1'],
          ['height(2)', '1', '1', '2'],
          ['height(3)', '0', '0', '1'],
          ['height(1)', '2', '1', '3'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Each node is visited once per traversal; the stack holds one frame per level of the current path.' },
      edgeCases: ['Empty tree → height 0, sum 0', 'Skewed tree → recursion depth n'],
      mistakes: ['Dereferencing a null child', 'Counting edges vs nodes for height inconsistently'],
      tryIt: 'Add a function that counts leaves (nodes with no children).',
      bug: {
        find: 'return 1 + max(height(n->left), height(n->right));',
        replace: 'return 1 + min(height(n->left), height(n->right));',
        symptom: 'The program prints "height = 2" instead of 3.',
        explanation: 'Height follows the longest path, so take the maximum of the children. min computes the shortest root-to-null path, which is a different quantity.',
      },
    },
    exampleB: {
      id: 'd16-B',
      kind: 'variant',
      title: 'Diameter: returned height vs. global best',
      goal: 'Find the number of edges on the longest path between any two nodes.',
      input: 'tree: 1 (left 2 (children 4, 5), right 3)',
      output: 'diameter = 3',
      idea: 'At each node the longest path through it is leftHeight + rightHeight edges. The node returns its own height (1 + max) to the parent, while a separate variable keeps the best path seen anywhere.',
      code: cpp`
#include <algorithm>
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

int best = 0;

int depth(TreeNode* n) {
    if (!n) return 0;
    int l = depth(n->left), r = depth(n->right);
    best = max(best, l + r);  // path through n (in edges)
    return 1 + max(l, r);     // height returned to the parent
}

int main() {
    TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);
    n1.left = &n2;
    n1.right = &n3;
    n2.left = &n4;
    n2.right = &n5;
    depth(&n1);
    cout << "diameter = " << best << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'best = max(best, l + r);', note: 'A path may bend at n, using both subtrees.' },
        { match: 'return 1 + max(l, r);', note: 'A parent can only extend one branch of n.' },
      ],
      dryRun: {
        columns: ['node', 'l', 'r', 'l + r', 'best', 'returns'],
        rows: [
          ['4', '0', '0', '0', '0', '1'],
          ['5', '0', '0', '0', '0', '1'],
          ['2', '1', '1', '2', '2', '2'],
          ['3', '0', '0', '0', '2', '1'],
          ['1', '2', '1', '3', '3', '3'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One post-order traversal.' },
      edgeCases: ['Single node → 0', 'Longest path may not pass through the root'],
      mistakes: ['Returning l + r to the parent', 'Counting nodes instead of edges'],
      tryIt: 'Return the diameter measured in nodes instead of edges.',
    },
    complexityNotes: 'Tree DFS is O(n) time. Space is O(h) for recursion: O(log n) when balanced and O(n) when the tree degenerates into a chain.',
    quiz: [
      {
        prompt: 'Which traversal order computes a node\'s height from its children\'s heights?',
        options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
        answer: 2,
        explanation: 'Children must be processed before the node.',
      },
      {
        prompt: 'For a tree that is a chain of n nodes, what is the recursion depth of DFS?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        answer: 2,
        explanation: 'The depth equals the height, which is n for a chain.',
      },
      {
        prompt: 'In the diameter algorithm, why not return l + r to the parent?',
        options: ['It is slower', 'A path from the parent can only continue down one child branch', 'It overflows', 'It is the same thing'],
        answer: 1,
        explanation: 'A simple path cannot use both branches of n and also go up to the parent.',
      },
    ],
    recap: 'Tree problems are recursion on subtrees. Choose the traversal order by when the node needs its children\'s results, and keep global answers separate from values returned upward.',
    nextPrep: 'Tomorrow: breadth-first traversal (level order) with a queue.',
  },
  questions: [
    {
      id: 'd16-max-depth',
      day: 16,
      title: 'Tallest Branch',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Post-order height computation.',
      statement: 'Print the maximum depth (number of nodes on the longest root-to-leaf path) of a binary tree.',
      constraints: ['0 ≤ nodes ≤ 10⁴'],
      examples: [{ input: '3 9 20 null null 15 7', output: '3' }],
      edgeCases: ['Empty tree → 0', 'Chain'],
      cues: ['Subtree property → post-order'],
      hints: ['depth(null) = 0.', 'depth(n) = 1 + max(depth(left), depth(right)).'],
      approach: 'Recursive height.',
      correctness: 'Induction on subtree size.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One visit per node.' },
      cpp: cpp`${TREE_HEAD}

int maxDepth(TreeNode* n) {
    if (!n) return 0;
    return 1 + max(maxDepth(n->left), maxDepth(n->right));
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    cout << maxDepth(root) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the maximum depth.`,
      keyLines: [{ match: 'return 1 + max(maxDepth(n->left), maxDepth(n->right));', note: 'Longest branch plus the node itself.' }],
      mistakes: ['Returning 1 for null'],
      tests: [
        { in: '7\n3 9 20 null null 15 7', out: '3' },
        { in: '0', out: '0' },
        { in: '1\n5', out: '1' },
        { in: '7\n1 2 null 3 null 4 null', out: '4' },
      ],
      viz: 'tree',
    },
    {
      id: 'd16-invert-tree',
      day: 16,
      title: 'Mirror the Tree',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Transform a tree recursively.',
      statement: 'Mirror a binary tree (swap left and right children everywhere) and print its pre-order traversal.',
      constraints: ['0 ≤ nodes ≤ 100'],
      examples: [{ input: '4 2 7 1 3 6 9', output: '4 7 9 6 2 3 1' }],
      edgeCases: ['Empty tree → print an empty line', 'Single node'],
      cues: ['Apply the same operation to every subtree'],
      hints: ['Swap the children of the current node.', 'Recurse into both children.'],
      approach: 'swap(n->left, n->right), then invert both.',
      correctness: 'Each node\'s children are swapped exactly once.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One visit per node.' },
      cpp: cpp`${TREE_HEAD}

TreeNode* invert(TreeNode* n) {
    if (!n) return nullptr;
    swap(n->left, n->right);
    invert(n->left);
    invert(n->right);
    return n;
}

void pre(TreeNode* n, vector<int>& out) {
    if (!n) return;
    out.push_back(n->val);
    pre(n->left, out);
    pre(n->right, out);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = invert(build(readTokens(), pool));
    vector<int> out;
    pre(root, out);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "");
    cout << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: pre-order of the mirrored tree.`,
      keyLines: [{ match: 'swap(n->left, n->right);', note: 'Order of swap vs recursion does not matter here.' }],
      mistakes: ['Assigning left = right then right = left (loses a child)'],
      tests: [
        { in: '7\n4 2 7 1 3 6 9', out: '4 7 9 6 2 3 1' },
        { in: '3\n2 1 3', out: '2 3 1' },
        { in: '0', out: '' },
        { in: '3\n1 2 null', out: '1 2' },
      ],
    },
    {
      id: 'd16-path-sum',
      day: 16,
      title: 'Root-to-Leaf Budget',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Pass a remaining budget down the tree.',
      statement: 'Print `true` if some root-to-leaf path has values summing exactly to target.',
      constraints: ['0 ≤ nodes ≤ 5000', '−1000 ≤ value ≤ 1000'],
      examples: [{ input: '5 4 8 11 null 13 4 7 2 null null null 1, target 22', output: 'true' }],
      edgeCases: ['Empty tree → false', 'Negative values', 'Path must end at a leaf'],
      cues: ['Root-to-leaf condition → pass remaining target down'],
      hints: ['Subtract the node value as you go down.', 'Check the remainder only at leaves.'],
      approach: 'has(n, t) = leaf ? t == val : has(left, t − val) || has(right, t − val).',
      correctness: 'Every root-to-leaf path is explored with its exact remaining target.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One visit per node.' },
      cpp: cpp`${TREE_HEAD}

bool hasPathSum(TreeNode* n, long long target) {
    if (!n) return false;
    target -= n->val;
    if (!n->left && !n->right) return target == 0;
    return hasPathSum(n->left, target) || hasPathSum(n->right, target);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    long long target;
    cin >> target;
    cout << (hasPathSum(root, target) ? "true" : "false") << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Then target. Output: true or false.`,
      keyLines: [{ match: 'if (!n->left && !n->right) return target == 0;', note: 'Only leaves end a path.' }],
      mistakes: ['Accepting a path that ends at an internal node'],
      tests: [
        { in: '13\n5 4 8 11 null 13 4 7 2 null null null 1\n22', out: 'true' },
        { in: '3\n1 2 3\n5', out: 'false' },
        { in: '0\n0', out: 'false' },
        { in: '3\n-2 null -3\n-5', out: 'true' },
      ],
    },
    {
      id: 'd16-symmetric',
      day: 16,
      title: 'Mirror-Symmetric Tree',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Recurse on two subtrees in lockstep.',
      statement: 'Print `true` if a binary tree is a mirror image of itself around its centre.',
      constraints: ['0 ≤ nodes ≤ 1000'],
      examples: [{ input: '1 2 2 3 4 4 3', output: 'true' }],
      edgeCases: ['Empty tree → true', 'Same values but different shape'],
      cues: ['Compare left subtree with mirrored right subtree'],
      hints: ['Write mirror(a, b).', 'a and b mirror each other if their values match and mirror(a.left, b.right) and mirror(a.right, b.left).'],
      approach: 'Paired recursion.',
      correctness: 'Structural induction on the pair of subtrees.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Each pair compared once.' },
      cpp: cpp`${TREE_HEAD}

bool mirror(TreeNode* a, TreeNode* b) {
    if (!a || !b) return a == b;
    return a->val == b->val && mirror(a->left, b->right) && mirror(a->right, b->left);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    cout << ((!root || mirror(root->left, root->right)) ? "true" : "false") << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: true or false.`,
      keyLines: [{ match: 'if (!a || !b) return a == b;', note: 'Both null → true; exactly one null → false.' }],
      mistakes: ['Comparing a.left with b.left'],
      tests: [
        { in: '7\n1 2 2 3 4 4 3', out: 'true' },
        { in: '7\n1 2 2 null 3 null 3', out: 'false' },
        { in: '0', out: 'true' },
        { in: '3\n1 2 2', out: 'true' },
      ],
    },
    {
      id: 'd16-diameter',
      day: 16,
      title: 'Longest Trail Between Two Nodes',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Track a global best while returning heights.',
      statement: 'Print the diameter (number of edges on the longest path between any two nodes) of a binary tree.',
      constraints: ['1 ≤ nodes ≤ 10⁴'],
      examples: [{ input: '1 2 3 4 5', output: '3' }],
      edgeCases: ['Single node → 0', 'Path not through the root'],
      cues: ['Best path may bend at any node → global max of leftHeight + rightHeight'],
      hints: ['Compute heights bottom-up.', 'At each node update best with left + right.'],
      approach: 'Example B.',
      correctness: 'Every simple path has a highest node where it bends; it is evaluated there.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Single DFS.' },
      cpp: cpp`${TREE_HEAD}

int best = 0;

int height(TreeNode* n) {
    if (!n) return 0;
    int l = height(n->left), r = height(n->right);
    best = max(best, l + r);
    return 1 + max(l, r);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    height(build(readTokens(), pool));
    cout << best << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the diameter.`,
      keyLines: [{ match: 'best = max(best, l + r);', note: 'Candidate path bending at n.' }],
      mistakes: ['Returning l + r upward'],
      tests: [
        { in: '5\n1 2 3 4 5', out: '3' },
        { in: '1\n1', out: '0' },
        { in: '2\n1 2', out: '1' },
        { in: '12\n1 2 null 3 4 5 null null 6 7 null 8', out: '6' },
      ],
    },
    {
      id: 'd16-balanced',
      day: 16,
      title: 'Is the Tree Balanced?',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Return a sentinel to short-circuit an O(n) check.',
      statement: 'A tree is height-balanced if for every node the heights of its two subtrees differ by at most 1. Print `true` or `false`.',
      constraints: ['0 ≤ nodes ≤ 5000'],
      examples: [{ input: '3 9 20 null null 15 7', output: 'true' }],
      edgeCases: ['Empty → true', 'Root balanced but a subtree unbalanced'],
      cues: ['Check a property at every node using heights → return −1 as "unbalanced"'],
      hints: ['Computing height separately at every node is O(n²).', 'Return −1 from a subtree that is already unbalanced.'],
      approach: 'check(n) returns height or −1.',
      correctness: 'A subtree is balanced iff both children are balanced and their heights differ by ≤ 1.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Single post-order pass.' },
      cpp: cpp`${TREE_HEAD}

int check(TreeNode* n) {
    if (!n) return 0;
    int l = check(n->left);
    if (l < 0) return -1;
    int r = check(n->right);
    if (r < 0 || abs(l - r) > 1) return -1;
    return 1 + max(l, r);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    cout << (check(root) >= 0 ? "true" : "false") << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: true or false.`,
      keyLines: [{ match: 'if (r < 0 || abs(l - r) > 1) return -1;', note: '−1 propagates "unbalanced" to the root without extra work.' }],
      mistakes: ['Checking only the root'],
      tests: [
        { in: '7\n3 9 20 null null 15 7', out: 'true' },
        { in: '9\n1 2 2 3 3 null null 4 4', out: 'false' },
        { in: '0', out: 'true' },
        { in: '7\n1 2 null 3 null 4 null', out: 'false' },
      ],
    },
    {
      id: 'd16-good-nodes',
      day: 16,
      title: 'Unbeaten Nodes',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Pass the path maximum down the tree.',
      statement: 'A node is good if no node on the path from the root to it has a greater value. Count the good nodes.',
      constraints: ['1 ≤ nodes ≤ 10⁵'],
      examples: [{ input: '3 1 4 3 null 1 5', output: '4' }],
      edgeCases: ['Equal values count as good', 'Negative values'],
      cues: ['Condition depends on the path from the root → parameter passed down'],
      hints: ['Carry the maximum value seen on the path.', 'A node is good if val ≥ that maximum.'],
      approach: 'dfs(n, maxSoFar).',
      correctness: 'maxSoFar is exactly the maximum over the node\'s ancestors.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One visit per node.' },
      cpp: cpp`${TREE_HEAD}

int good(TreeNode* n, int maxSoFar) {
    if (!n) return 0;
    int self = n->val >= maxSoFar ? 1 : 0;
    int m = max(maxSoFar, n->val);
    return self + good(n->left, m) + good(n->right, m);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    cout << good(root, INT_MIN) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: number of good nodes.`,
      keyLines: [{ match: 'int self = n->val >= maxSoFar ? 1 : 0;', note: '≥ so equal values remain good.' }],
      mistakes: ['Starting maxSoFar at 0 (fails for negative roots)'],
      tests: [
        { in: '7\n3 1 4 3 null 1 5', out: '4' },
        { in: '5\n3 3 null 4 2', out: '3' },
        { in: '1\n-5', out: '1' },
        { in: '3\n2 1 1', out: '1' },
      ],
    },
    {
      id: 'd16-max-path-sum',
      day: 16,
      title: 'Most Valuable Path',
      difficulty: 'Hard',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Combine a clamped returned gain with a global best path.',
      statement: 'A path is any sequence of connected nodes (each used at most once); it need not pass through the root. Print the maximum path sum.',
      constraints: ['1 ≤ nodes ≤ 3·10⁴', '−1000 ≤ value ≤ 1000'],
      examples: [{ input: '-10 9 20 null null 15 7', output: '42', explanation: '15 + 20 + 7' }],
      edgeCases: ['All negative → the largest single value', 'Single node'],
      cues: ['Path may bend → global best; return only one branch upward'],
      hints: ['gain(n) = n.val + max(0, gain(left), gain(right)).', 'Best path through n = n.val + max(0, gain(left)) + max(0, gain(right)).', 'Ignore negative branches with max(0, …).'],
      approach: 'Post-order DFS returning the best downward gain and updating a global answer.',
      correctness: 'Every path has a top node where both (non-negative) branches are combined.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One DFS.' },
      cpp: cpp`${TREE_HEAD}

int bestSum = INT_MIN;

int gain(TreeNode* n) {
    if (!n) return 0;
    int l = max(0, gain(n->left));
    int r = max(0, gain(n->right));
    bestSum = max(bestSum, n->val + l + r);
    return n->val + max(l, r);
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    gain(build(readTokens(), pool));
    cout << bestSum << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the maximum path sum.`,
      keyLines: [
        { match: 'int l = max(0, gain(n->left));', note: 'A negative branch is better left out.' },
        { match: 'bestSum = max(bestSum, n->val + l + r);', note: 'Path bending at n.' },
      ],
      mistakes: ['Initialising bestSum to 0 (wrong for all-negative trees)'],
      tests: [
        { in: '7\n-10 9 20 null null 15 7', out: '42' },
        { in: '3\n1 2 3', out: '6' },
        { in: '3\n-3 -1 -2', out: '-1' },
        { in: '1\n-7', out: '-7' },
      ],
    },
  ],
};

export default day;
