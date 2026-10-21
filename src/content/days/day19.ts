import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TREE_BUILD, TREE_HEAD, TREE_IO } from './shared';

const day: DayModule = {
  day: {
    day: 19,
    title: 'Tree Construction, Path Problems and Serialization',
    zone: 'trees',
    objectives: [
      'Rebuild a tree from pre-order + in-order traversals',
      'Serialise a tree to a string and parse it back',
      'Solve root-to-leaf and any-to-any path problems',
      'Use a hash map of prefix sums along a root-to-node path',
    ],
    prerequisites: ['Day 16: DFS', 'Day 17: BFS', 'Day 3: prefix sums + hash maps'],
    lesson: [
      {
        heading: 'Why one traversal is not enough',
        body: 'Pre-order alone does not tell where the left subtree ends. Combined with in-order (distinct values), the first pre-order value is the root, and its position in the in-order sequence splits left and right subtrees — giving their sizes.',
      },
      {
        heading: 'Efficient reconstruction',
        body: 'Store each value\'s in-order index in a hash map so splitting is O(1). Consume the pre-order sequence with a moving index while recursing on in-order ranges: total O(n).',
      },
      {
        heading: 'Serialization',
        body: 'Pre-order with explicit null markers (e.g. `#`) is self-delimiting: when parsing, read a token; `#` means null, otherwise create a node and parse its left then right subtree. The same recursion shape writes and reads.',
      },
      {
        heading: 'Path problems',
        body: '- Root-to-leaf paths: carry the current path (vector) down and undo with pop_back — backtracking on a tree.\n- Downward paths summing to k (start anywhere): carry the prefix sum from the root and count earlier prefixes equal to current − k with a hash map, removing the current prefix when returning.',
      },
    ],
    recognition: [
      '"Construct the tree from traversals" → root from pre/post-order, split with in-order.',
      '"Serialize/deserialize" → pre-order with null markers.',
      '"All root-to-leaf paths" → DFS with a path vector and undo.',
      '"Number of downward paths with sum k" → prefix sums + hash map along the path.',
    ],
    patterns: ['divide-and-conquer', 'tree-dfs', 'backtracking', 'prefix-sum'],
    visualizations: ['tree'],
    exampleA: {
      id: 'd19-A',
      title: 'Rebuild a tree from pre-order and in-order',
      goal: 'Reconstruct the tree and print its post-order to show the shape is correct.',
      input: 'preorder = {3, 9, 20, 15, 7}, inorder = {9, 3, 15, 20, 7}',
      output: 'postorder: 9 15 7 20 3',
      idea: 'pre[p] is the root of the current range. Its in-order position m splits [lo, hi] into [lo, m − 1] (left) and [m + 1, hi] (right). Recurse left first, because pre-order lists the whole left subtree before the right one.',
      code: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

vector<int> pre, in;
unordered_map<int, int> pos;  // value -> index in inorder
size_t p = 0;                 // next unused preorder index
vector<TreeNode*> pool;

TreeNode* build(int lo, int hi) {
    if (lo > hi) return nullptr;
    pool.push_back(new TreeNode(pre[p++]));
    TreeNode* root = pool.back();
    int m = pos[root->val];
    root->left = build(lo, m - 1);   //@gap
    root->right = build(m + 1, hi);  //@gap
    return root;
}

void post(TreeNode* n) {
    if (!n) return;
    post(n->left);
    post(n->right);
    cout << " " << n->val;
}

int main() {
    pre = {3, 9, 20, 15, 7};
    in = {9, 3, 15, 20, 7};
    for (int i = 0; i < (int)in.size(); i++) pos[in[i]] = i;
    TreeNode* root = build(0, (int)in.size() - 1);
    cout << "postorder:";
    post(root);
    cout << "\n";
    for (auto* n : pool) delete n;
    return 0;
}`,
      keyLines: [
        { match: 'pool.push_back(new TreeNode(pre[p++]));', note: 'The next unused pre-order value is the root of this range.' },
        { match: 'int m = pos[root->val];', note: 'O(1) split point thanks to the hash map.' },
        { match: 'root->left = build(lo, m - 1);', note: 'Must build the left subtree first: pre-order consumes it next.' },
      ],
      dryRun: {
        columns: ['root (pre[p])', 'in-order range', 'split m', 'left range', 'right range'],
        rows: [
          ['3', '[0,4]', '1', '[0,0]', '[2,4]'],
          ['9', '[0,0]', '0', 'empty', 'empty'],
          ['20', '[2,4]', '3', '[2,2]', '[4,4]'],
          ['15', '[2,2]', '2', 'empty', 'empty'],
          ['7', '[4,4]', '4', 'empty', 'empty'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each value becomes one node with an O(1) map lookup; the map and recursion use O(n).' },
      edgeCases: ['Single node', 'Skewed trees (recursion depth n)', 'Duplicate values make the split ambiguous'],
      mistakes: ['Building the right subtree first', 'Searching the in-order array linearly each time (O(n²))'],
      tryIt: 'Rebuild from in-order + post-order instead (consume post-order from the back and build the right subtree first).',
      bug: {
        find: 'for (int i = 0; i < (int)in.size(); i++) pos[in[i]] = i;',
        replace: 'for (int i = 0; i < (int)in.size(); i++) pos[pre[i]] = i;',
        symptom: 'The program prints "postorder: 7 15 20 9 3" — the tree became a right-leaning chain.',
        explanation: 'The split position must come from the in-order sequence: it tells how many values belong to the left subtree. Indexing by pre-order puts every root at the left edge of its range, so every left subtree comes out empty.',
      },
    },
    exampleB: {
      id: 'd19-B',
      kind: 'variant',
      title: 'Serialize and deserialize with null markers',
      goal: 'Turn a tree into a string and back, and show the round trip is lossless.',
      input: 'tree: 1 (left 2, right 3 (children 4, 5))',
      output: 'serialized: 1 2 # # 3 4 # # 5 # #\nround trip: 1 2 # # 3 4 # # 5 # #',
      idea: 'Write pre-order, emitting # for every null child. Reading uses the same recursion: a # returns null; a number creates a node whose left and right subtrees are read next.',
      code: cpp`
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

vector<TreeNode*> pool;

void serialize(TreeNode* n, ostringstream& out) {
    if (!n) {
        out << "# ";
        return;
    }
    out << n->val << " ";
    serialize(n->left, out);
    serialize(n->right, out);
}

TreeNode* deserialize(istringstream& in) {
    string tok;
    in >> tok;
    if (tok == "#") return nullptr;
    pool.push_back(new TreeNode(stoi(tok)));
    TreeNode* n = pool.back();
    n->left = deserialize(in);
    n->right = deserialize(in);
    return n;
}

string encode(TreeNode* root) {
    ostringstream out;
    serialize(root, out);
    string s = out.str();
    s.pop_back();  // trailing space
    return s;
}

int main() {
    TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);
    n1.left = &n2;
    n1.right = &n3;
    n3.left = &n4;
    n3.right = &n5;
    string s = encode(&n1);
    cout << "serialized: " << s << "\n";
    istringstream in(s);
    TreeNode* copy = deserialize(in);
    cout << "round trip: " << encode(copy) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      keyLines: [
        { match: 'out << "# ";', note: 'Null markers make the encoding unambiguous.' },
        { match: 'if (tok == "#") return nullptr;', note: 'Mirror of the writer: a marker means "no child here".' },
        { match: 'n->left = deserialize(in);', note: 'Read the left subtree first — same order it was written.' },
      ],
      dryRun: {
        columns: ['token read', 'action'],
        rows: [
          ['1', 'create root, read its left'],
          ['2', 'create 2, read its left'],
          ['#', '2.left = null'],
          ['#', '2.right = null → back to 1, read its right'],
          ['3', 'create 3 …'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One token per node and per null child (2n + 1 tokens).' },
      edgeCases: ['Empty tree serialises to "#"', 'Negative values parse with stoi'],
      mistakes: ['Omitting null markers (cannot reconstruct the shape)', 'Reading subtrees in a different order than writing'],
      tryIt: 'Serialise with BFS (level order) instead and write the matching parser.',
    },
    complexityNotes: 'Construction and serialisation are O(n) with hash-map lookups. Path enumeration is O(n · h) when each path is copied; prefix-sum path counting is O(n).',
    quiz: [
      {
        prompt: 'Why does reconstruction need both pre-order and in-order (with distinct values)?',
        options: ['Pre-order gives roots; in-order shows how many nodes fall in each subtree', 'In-order is faster', 'Pre-order is always ambiguous', 'It does not — pre-order alone suffices'],
        answer: 0,
        explanation: 'The root\'s in-order position splits the remaining values into left and right.',
      },
      {
        prompt: 'How many tokens does pre-order serialisation with null markers produce for n nodes?',
        options: ['n', 'n + 1', '2n + 1', 'n²'],
        answer: 2,
        explanation: 'n values plus n + 1 null children.',
      },
      {
        prompt: 'Counting downward paths with sum k: when returning from a node, why remove its prefix from the map?',
        options: ['To save memory only', 'The map must contain only prefixes of the current root-to-node path', 'To avoid overflow', 'It is optional'],
        answer: 1,
        explanation: 'Prefixes from other branches are not ancestors and must not be counted.',
      },
    ],
    recap: 'Pre-order gives roots and in-order gives sizes; null markers make pre-order a complete encoding. Path problems combine DFS with backtracking or prefix-sum maps.',
    nextPrep: 'Tomorrow: intervals — sorting by endpoints and merging overlaps.',
  },
  questions: [
    {
      id: 'd19-tree-paths',
      day: 19,
      title: 'All Root-to-Leaf Routes',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-dfs', 'backtracking'],
      objective: 'Carry and undo a path while descending.',
      statement: 'Print every root-to-leaf path as values joined by "->", in DFS order (left before right).',
      constraints: ['1 ≤ nodes ≤ 100'],
      examples: [{ input: '1 2 3 null 5', output: '1->2->5\n1->3' }],
      edgeCases: ['Single node', 'Negative values'],
      cues: ['Every root-to-leaf path → DFS with a path vector'],
      hints: ['Push the node, recurse, pop.', 'Print when you reach a leaf.'],
      approach: 'Backtracking DFS.',
      correctness: 'Each leaf is reached exactly once along its unique root path.',
      complexity: { time: 'O(n · h)', space: 'O(h)', why: 'Each printed path has length ≤ h.' },
      cpp: cpp`${TREE_HEAD}

void paths(TreeNode* n, vector<int>& cur) {
    if (!n) return;
    cur.push_back(n->val);
    if (!n->left && !n->right) {
        for (size_t i = 0; i < cur.size(); i++) cout << cur[i] << (i + 1 < cur.size() ? "->" : "\n");
    } else {
        paths(n->left, cur);
        paths(n->right, cur);
    }
    cur.pop_back();
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    vector<int> cur;
    paths(build(readTokens(), pool), cur);
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: one path per line.`,
      keyLines: [{ match: 'cur.pop_back();', note: 'Undo before returning to the parent.' }],
      mistakes: ['Printing at null children (duplicates for nodes with one child)'],
      tests: [
        { in: '5\n1 2 3 null 5', out: '1->2->5\n1->3' },
        { in: '1\n7', out: '7' },
        { in: '3\n-1 null -2', out: '-1->-2' },
        { in: '7\n1 2 3 4 5 6 7', out: '1->2->4\n1->2->5\n1->3->6\n1->3->7' },
      ],
      viz: 'tree',
    },
    {
      id: 'd19-build-pre-in',
      day: 19,
      title: 'Rebuild From Two Traversals',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['divide-and-conquer', 'hash-lookup'],
      objective: 'Reconstruct a tree with a hash map of in-order positions.',
      statement: 'Given pre-order and in-order traversals of a tree with distinct values, print its post-order traversal.',
      constraints: ['1 ≤ n ≤ 3000'],
      examples: [{ input: 'pre = 3 9 20 15 7, in = 9 3 15 20 7', output: '9 15 7 20 3' }],
      edgeCases: ['Left-skewed tree', 'Single node'],
      cues: ['Pre-order root + in-order split'],
      hints: ['Map each value to its in-order index.', 'Recurse on in-order ranges, consuming pre-order left to right.'],
      approach: 'Example A.',
      correctness: 'Each recursive call handles exactly the nodes of one subtree.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'One node per value.' },
      cpp: cpp`
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

vector<int> pre, in, out;
unordered_map<int, int> pos;
size_t p = 0;

// Emits post-order directly without materialising nodes.
void build(int lo, int hi) {
    if (lo > hi) return;
    int root = pre[p++];
    int m = pos[root];
    build(lo, m - 1);
    build(m + 1, hi);
    out.push_back(root);
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    pre.resize(n);
    in.resize(n);
    for (auto& x : pre) cin >> x;
    for (auto& x : in) cin >> x;
    for (int i = 0; i < n; i++) pos[in[i]] = i;
    build(0, n - 1);
    for (int i = 0; i < n; i++) cout << out[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, pre-order (n values), in-order (n values). Output: post-order.',
      keyLines: [{ match: 'out.push_back(root);', note: 'Appending after both recursive calls yields post-order.' }],
      mistakes: ['Linear search in in-order for every root'],
      tests: [
        { in: '5\n3 9 20 15 7\n9 3 15 20 7', out: '9 15 7 20 3' },
        { in: '1\n1\n1', out: '1' },
        { in: '3\n1 2 3\n3 2 1', out: '3 2 1' },
        { in: '3\n1 2 3\n1 2 3', out: '3 2 1' },
      ],
    },
    {
      id: 'd19-build-in-post',
      day: 19,
      title: 'Rebuild From In-order and Post-order',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['divide-and-conquer', 'hash-lookup'],
      objective: 'Consume post-order from the back.',
      statement: 'Given in-order and post-order traversals (distinct values), print the pre-order traversal.',
      constraints: ['1 ≤ n ≤ 3000'],
      examples: [{ input: 'in = 9 3 15 20 7, post = 9 15 7 20 3', output: '3 9 20 15 7' }],
      edgeCases: ['Right-skewed tree'],
      cues: ['Post-order root is last → walk it backwards, building right before left'],
      hints: ['The last post-order value is the root.', 'Moving backwards, you meet the right subtree before the left.'],
      approach: 'Recursive build with a decreasing post-order index; collect nodes into a pre-order list.',
      correctness: 'Reversed post-order is root, right, left — so the right range must be built first.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Hash map + one call per node.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

struct Node {
    int val, left = -1, right = -1;
};

vector<int> in, post;
vector<Node> nodes;
unordered_map<int, int> pos;
int p;

int build(int lo, int hi) {
    if (lo > hi) return -1;
    int val = post[p--];
    int id = nodes.size();
    nodes.push_back({val});
    int m = pos[val];
    int r = build(m + 1, hi);
    int l = build(lo, m - 1);
    nodes[id].right = r;
    nodes[id].left = l;
    return id;
}

void preorder(int id, vector<int>& out) {
    if (id < 0) return;
    out.push_back(nodes[id].val);
    preorder(nodes[id].left, out);
    preorder(nodes[id].right, out);
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    in.resize(n);
    post.resize(n);
    for (auto& x : in) cin >> x;
    for (auto& x : post) cin >> x;
    for (int i = 0; i < n; i++) pos[in[i]] = i;
    p = n - 1;
    int root = build(0, n - 1);
    vector<int> out;
    preorder(root, out);
    for (int i = 0; i < n; i++) cout << out[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, in-order, post-order. Output: pre-order.',
      keyLines: [
        { match: 'int r = build(m + 1, hi);', note: 'Right subtree first when walking post-order backwards.' },
        { match: 'nodes[id].right = r;', note: 'Index-based nodes: no raw pointers into a growing vector.' },
      ],
      mistakes: ['Holding a reference to nodes[id] across push_back (invalidated on reallocation)'],
      tests: [
        { in: '5\n9 3 15 20 7\n9 15 7 20 3', out: '3 9 20 15 7' },
        { in: '1\n4\n4', out: '4' },
        { in: '3\n1 2 3\n1 2 3', out: '3 2 1' },
        { in: '3\n2 1 3\n2 3 1', out: '1 2 3' },
      ],
    },
    {
      id: 'd19-path-sum-ii',
      day: 19,
      title: 'Routes With an Exact Budget',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs', 'backtracking'],
      objective: 'Collect all root-to-leaf paths matching a sum.',
      statement: 'Print every root-to-leaf path whose values sum to target (space-separated, DFS order), then the count.',
      constraints: ['0 ≤ nodes ≤ 5000', '−1000 ≤ value ≤ 1000'],
      examples: [{ input: '5 4 8 11 null 13 4 7 2 null null 5 1, target 22', output: '5 4 11 2\n5 8 4 5\ncount 2' }],
      edgeCases: ['No path → only "count 0"', 'Negative values'],
      cues: ['All root-to-leaf paths with a condition → DFS + path vector'],
      hints: ['Carry the remaining target and the path.', 'Record at leaves where the remainder is 0.'],
      approach: 'Backtracking DFS.',
      correctness: 'Every root-to-leaf path is explored once.',
      complexity: { time: 'O(n · h)', space: 'O(h)', why: 'Path copies at matching leaves.' },
      cpp: cpp`${TREE_HEAD}

int found = 0;

void dfs(TreeNode* n, long long remain, vector<int>& path) {
    if (!n) return;
    path.push_back(n->val);
    remain -= n->val;
    if (!n->left && !n->right && remain == 0) {
        for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\n");
        found++;
    }
    dfs(n->left, remain, path);
    dfs(n->right, remain, path);
    path.pop_back();
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    long long t;
    cin >> t;
    vector<int> path;
    dfs(root, t, path);
    cout << "count " << found << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Then target. Output: matching paths, then the count.`,
      keyLines: [{ match: 'if (!n->left && !n->right && remain == 0) {', note: 'Only complete root-to-leaf paths count.' }],
      mistakes: ['Pruning when remain < 0 (invalid with negative values)'],
      tests: [
        { in: '13\n5 4 8 11 null 13 4 7 2 null null 5 1\n22', out: '5 4 11 2\n5 8 4 5\ncount 2' },
        { in: '3\n1 2 3\n5', out: 'count 0' },
        { in: '2\n1 2\n3', out: '1 2\ncount 1' },
        { in: '3\n-2 null -3\n-5', out: '-2 -3\ncount 1' },
      ],
    },
    {
      id: 'd19-path-sum-iii',
      day: 19,
      title: 'Downward Streaks Summing to K',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['prefix-sum', 'hash-lookup', 'tree-dfs'],
      objective: 'Apply prefix-sum counting along a root path.',
      statement: 'Count paths that go downward (parent to child) and sum to k. A path may start and end at any nodes.',
      constraints: ['0 ≤ nodes ≤ 1000', '|value| ≤ 10⁹', '|k| ≤ 1000'],
      examples: [{ input: '10 5 -3 3 2 null 11 3 -2 null 1, k = 8', output: '3' }],
      edgeCases: ['Negative values', 'k = 0'],
      cues: ['Subarray sum = k but on root-to-node paths → prefix sums + hash map with undo'],
      hints: ['Carry the prefix sum from the root.', 'Add count[prefix − k] at each node.', 'Increment count[prefix] before recursing and decrement after.'],
      brute: 'Start a DFS from every node: O(n · h).',
      approach: 'One DFS with a prefix-count map that only contains the current path.',
      correctness: 'Each downward path ending at node v corresponds to an ancestor prefix equal to prefix(v) − k.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One visit per node; the map holds the current path.' },
      cpp: cpp`${TREE_HEAD}
#include <unordered_map>

unordered_map<long long, int> seen{{0, 1}};

long long countPaths(TreeNode* n, long long prefix, long long k) {
    if (!n) return 0;
    prefix += n->val;
    long long total = 0;
    auto it = seen.find(prefix - k);
    if (it != seen.end()) total += it->second;
    seen[prefix]++;
    total += countPaths(n->left, prefix, k) + countPaths(n->right, prefix, k);
    seen[prefix]--;
    return total;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    long long k;
    cin >> k;
    cout << countPaths(root, 0, k) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Then k. Output: number of paths.`,
      keyLines: [{ match: 'seen[prefix]--;', note: 'Remove this node\'s prefix before returning to its parent.' }],
      mistakes: ['Not undoing the map entry (counts paths across branches)', 'int overflow on prefix sums'],
      tests: [
        { in: '11\n10 5 -3 3 2 null 11 3 -2 null 1\n8', out: '3' },
        { in: '1\n1\n1', out: '1' },
        { in: '3\n1 -1 1\n0', out: '1' },
        { in: '5\n1 null 2 null 3\n3', out: '2' },
      ],
    },
    {
      id: 'd19-lca-binary-tree',
      day: 19,
      title: 'Common Ancestor in Any Binary Tree',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs'],
      objective: 'Return found nodes upward and detect the split.',
      statement: 'Values are unique and both p and q exist. Print their lowest common ancestor in a general binary tree.',
      constraints: ['2 ≤ nodes ≤ 10⁵ (height ≤ 2000)'],
      examples: [{ input: '3 5 1 6 2 0 8 null null 7 4, p 5, q 1', output: '3' }],
      edgeCases: ['p is an ancestor of q', 'p == q'],
      cues: ['No ordering → search both subtrees and combine'],
      hints: ['Return the node if it is p or q.', 'If both subtrees return non-null, the current node is the LCA.', 'Otherwise propagate the non-null one.'],
      approach: 'Post-order DFS returning the found node.',
      correctness: 'The first node whose two subtrees each contain one target (or that is a target containing the other) is returned upward unchanged.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'Single DFS.' },
      cpp: cpp`${TREE_HEAD}

TreeNode* lca(TreeNode* n, int p, int q) {
    if (!n || n->val == p || n->val == q) return n;
    TreeNode* l = lca(n->left, p, q);
    TreeNode* r = lca(n->right, p, q);
    if (l && r) return n;
    return l ? l : r;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    int p, q;
    cin >> p >> q;
    cout << lca(root, p, q)->val << "\n";
    for (auto* x : pool) delete x;
    return 0;
}`,
      io: `${TREE_IO} Then p q. Output: the LCA value.`,
      keyLines: [{ match: 'if (l && r) return n;', note: 'Targets found on both sides: n splits them.' }],
      mistakes: ['Using the BST shortcut on a non-BST tree'],
      tests: [
        { in: '11\n3 5 1 6 2 0 8 null null 7 4\n5 1', out: '3' },
        { in: '11\n3 5 1 6 2 0 8 null null 7 4\n5 4', out: '5' },
        { in: '2\n1 2\n1 2', out: '1' },
        { in: '11\n3 5 1 6 2 0 8 null null 7 4\n7 8', out: '3' },
      ],
    },
    {
      id: 'd19-flatten',
      day: 19,
      title: 'Flatten Into a Right Chain',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-dfs', 'in-place-transform'],
      objective: 'Rewire pointers in reverse pre-order.',
      statement: 'Flatten the tree in place into a "linked list" using right pointers in pre-order (all left pointers null). Print the values by following right pointers.',
      constraints: ['0 ≤ nodes ≤ 2000'],
      examples: [{ input: '1 2 5 3 4 null 6', output: '1 2 3 4 5 6' }],
      edgeCases: ['Empty tree', 'Already a right chain'],
      cues: ['Pre-order linking → process right, then left, then node (reverse pre-order) with a "previous" pointer'],
      hints: ['Visit nodes in the order right, left, node.', 'Point node->right at the previously processed node; set left to null.'],
      approach: 'Reverse pre-order DFS with a global prev pointer.',
      correctness: 'Reverse pre-order visits nodes from the end of the target list; linking each to the previous builds the list back to front.',
      complexity: { time: 'O(n)', space: 'O(h)', why: 'One DFS.' },
      cpp: cpp`${TREE_HEAD}

TreeNode* prevNode = nullptr;

void flatten(TreeNode* n) {
    if (!n) return;
    flatten(n->right);
    flatten(n->left);
    n->right = prevNode;
    n->left = nullptr;
    prevNode = n;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    flatten(root);
    for (TreeNode* n = root; n; n = n->right) cout << n->val << (n->right ? " " : "");
    cout << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: flattened values.`,
      keyLines: [{ match: 'n->right = prevNode;', note: 'prevNode is the next node in pre-order.' }],
      mistakes: ['Forgetting to clear left pointers'],
      tests: [
        { in: '7\n1 2 5 3 4 null 6', out: '1 2 3 4 5 6' },
        { in: '0', out: '' },
        { in: '3\n1 null 2', out: '1 2' },
        { in: '3\n1 2 3', out: '1 2 3' },
      ],
    },
    {
      id: 'd19-serialize',
      day: 19,
      title: 'Save and Load a Tree',
      difficulty: 'Hard',
      topic: 'trees',
      patterns: ['tree-dfs', 'recursive-decomposition'],
      objective: 'Design a lossless text format.',
      statement: 'Read a tree in level order, serialise it with pre-order and # markers, print the encoding, deserialise it, and print the level order of the result (with "null" for missing children, trailing nulls removed).',
      constraints: ['0 ≤ nodes ≤ 10⁴'],
      examples: [{ input: '1 2 3 null null 4 5', output: '1 2 # # 3 4 # # 5 # #\n1 2 3 null null 4 5' }],
      edgeCases: ['Empty tree → "#" and an empty line', 'Negative values'],
      cues: ['Encode/decode a tree → pre-order + null markers'],
      hints: ['Writer and reader use the same recursion.', 'Use istringstream to read tokens.'],
      approach: 'Example B plus a level-order printer.',
      correctness: 'The encoding visits each node and each null child exactly once in a fixed order that the reader replays.',
      complexity: { time: 'O(n)', space: 'O(n)', why: '2n + 1 tokens.' },
      cpp: cpp`${TREE_HEAD}
#include <sstream>

void serialize(TreeNode* n, string& out) {
    if (!n) {
        out += "# ";
        return;
    }
    out += to_string(n->val) + " ";
    serialize(n->left, out);
    serialize(n->right, out);
}

TreeNode* deserialize(istringstream& in, vector<TreeNode*>& pool) {
    string t;
    in >> t;
    if (t == "#") return nullptr;
    pool.push_back(new TreeNode(stoi(t)));
    TreeNode* n = pool.back();
    n->left = deserialize(in, pool);
    n->right = deserialize(in, pool);
    return n;
}

string levelOrder(TreeNode* root) {
    vector<string> tok;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* n = q.front();
        q.pop();
        if (!n) {
            tok.push_back("null");
            continue;
        }
        tok.push_back(to_string(n->val));
        q.push(n->left);
        q.push(n->right);
    }
    while (!tok.empty() && tok.back() == "null") tok.pop_back();
    string s;
    for (size_t i = 0; i < tok.size(); i++) s += (i ? " " : "") + tok[i];
    return s;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    string enc;
    serialize(root, enc);
    enc.pop_back();
    cout << enc << "\n";
    istringstream in(enc);
    TreeNode* copy = deserialize(in, pool);
    cout << levelOrder(copy) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the encoding, then the level order of the decoded tree.`,
      keyLines: [{ match: 'if (t == "#") return nullptr;', note: 'Markers restore missing children exactly.' }],
      mistakes: ['Encoding only values (shape lost)'],
      tests: [
        { in: '7\n1 2 3 null null 4 5', out: '1 2 # # 3 4 # # 5 # #\n1 2 3 null null 4 5' },
        { in: '0', out: '#\n' },
        { in: '3\n-1 null 2', out: '-1 # 2 # #\n-1 null 2' },
        { in: '1\n42', out: '42 # #\n42' },
      ],
    },
  ],
};

export default day;
