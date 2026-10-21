import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';
import { TREE_BUILD, TREE_HEAD, TREE_IO } from './shared';

const day: DayModule = {
  day: {
    day: 17,
    title: 'Breadth-First Search on Trees',
    zone: 'trees',
    objectives: [
      'Traverse a tree level by level with std::queue',
      'Freeze the level size to group nodes by depth',
      'Answer per-level questions: averages, right view, widest level',
      'Find the shallowest node with a property using early exit',
    ],
    prerequisites: ['Day 10: queues', 'Day 16: tree basics'],
    lesson: [
      {
        heading: 'Level-order traversal',
        body: 'Push the root into a queue. Repeatedly pop a node and push its children. Because a queue is FIFO, all nodes at depth d are processed before any node at depth d + 1.',
      },
      {
        heading: 'Grouping by level',
        body: 'At the start of each round, `int size = q.size();` is exactly the number of nodes on the current level. Pop exactly `size` nodes in an inner loop; children pushed during the loop belong to the next level. Reading `q.size()` inside the loop condition would mix levels.',
      },
      {
        heading: 'BFS vs DFS on trees',
        body: 'BFS naturally answers **shallowest** questions (minimum depth, first leaf, nearest target) and per-level aggregates. DFS is simpler for subtree properties. BFS memory is O(width), which can be n/2 for a full tree; DFS memory is O(height).',
      },
      {
        heading: 'Position indices for width',
        body: 'Number nodes like a heap: the root is 1, children of i are 2i and 2i + 1. The width of a level is last index − first index + 1. Re-base indices per level (subtract the first index) to avoid overflow on deep trees.',
      },
    ],
    recognition: [
      '"Level", "depth by depth", "right side view", "zigzag" → BFS with level size.',
      '"Minimum depth", "nearest leaf" → BFS, stop at the first match.',
      'Per-level aggregates (sum, average, max) → BFS rounds.',
    ],
    patterns: ['tree-bfs', 'queue-level-traversal'],
    visualizations: ['tree'],
    exampleA: {
      id: 'd17-A',
      title: 'Level-order traversal grouped by depth',
      goal: 'Print the values of each level of a binary tree.',
      input: 'tree: 3 (left 9, right 20 (children 15, 7))',
      output: 'level 0: 3\nlevel 1: 9 20\nlevel 2: 15 7',
      idea: 'Snapshot the queue size at the start of each level; pop exactly that many nodes and push their children for the next level.',
      code: TRACE_CODE['level-order'],
      keyLines: [
        { match: 'q.push(root);', note: 'The first level contains only the root.' },
        { match: 'int size = q.size();', note: 'Freeze the level size before children are added.' },
        { match: 'if (node->left) q.push(node->left);', note: 'Children join the back of the queue: they belong to the next level.' },
        { match: 'levels.push_back(level);', note: 'One vector per completed level.' },
      ],
      complexity: { time: 'O(n)', space: 'O(w)', why: 'Every node is pushed and popped once; the queue holds at most one level plus its children (w = max width).' },
      edgeCases: ['Empty tree → no levels', 'Skewed tree → one node per level'],
      mistakes: ['for (int i = 0; i < q.size(); i++) — size changes as children are pushed', 'Pushing null children'],
      tryIt: 'Print the levels bottom-up (reverse the result) or the average of each level.',
      trace: { id: 'level-order', input: { tree: [3, 9, 20, null, null, 15, 7] } },
      bug: {
        find: 'for (int i = 0; i < size; i++) {',
        replace: 'for (int i = 0; i < (int)q.size(); i++) {',
        symptom: 'The program prints "level 0: 3 9" — nodes from the next level leak into the current one.',
        explanation: 'q.size() grows while children are pushed, so the inner loop keeps consuming nodes from the next level. Freeze the size first.',
      },
    },
    exampleB: {
      id: 'd17-B',
      kind: 'variant',
      title: 'Right side view',
      goal: 'Print the value you would see from the right at each level: the last node of every level.',
      input: 'tree: 1 (left 2 (right 5), right 3 (right 4))',
      output: 'right view: 1 3 4',
      idea: 'Do a level-order traversal and record the node popped at index size − 1 of each level.',
      code: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left = nullptr, *right = nullptr;
    TreeNode(int v) : val(v) {}
};

vector<int> rightView(TreeNode* root) {
    vector<int> view;
    if (!root) return view;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            if (i == size - 1) view.push_back(n->val);  //@gap
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return view;
}

int main() {
    TreeNode n1(1), n2(2), n3(3), n4(4), n5(5);
    n1.left = &n2;
    n1.right = &n3;
    n2.right = &n5;
    n3.right = &n4;
    cout << "right view:";
    for (int v : rightView(&n1)) cout << " " << v;
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (i == size - 1) view.push_back(n->val);', note: 'The last node popped on a level is the rightmost one.' },
        { match: 'if (n->left) q.push(n->left);', note: 'Left before right keeps left-to-right order inside a level.' },
      ],
      dryRun: {
        columns: ['level', 'nodes popped', 'last node'],
        rows: [
          ['0', '1', '1'],
          ['1', '2, 3', '3'],
          ['2', '5, 4', '4'],
        ],
      },
      complexity: { time: 'O(n)', space: 'O(w)', why: 'Standard BFS.' },
      edgeCases: ['A left node can be visible if the right subtree is shorter', 'Empty tree'],
      mistakes: ['Assuming the right view is just the right-most branch'],
      tryIt: 'Produce the left side view by recording i == 0 instead.',
    },
    complexityNotes: 'Tree BFS visits each node once: O(n) time. Queue memory is O(width), up to about n/2 for a complete tree.',
    quiz: [
      {
        prompt: 'Why store q.size() in a variable before the inner loop?',
        options: ['Performance only', 'Children pushed during the loop would otherwise be treated as part of the current level', 'q.size() is O(n)', 'It is not necessary'],
        answer: 1,
        explanation: 'The frozen size marks the boundary between levels.',
      },
      {
        prompt: 'Which traversal finds the minimum depth of a tree while visiting the fewest nodes in general?',
        options: ['Pre-order DFS', 'Post-order DFS', 'BFS, stopping at the first leaf', 'In-order DFS'],
        answer: 2,
        explanation: 'BFS reaches the shallowest leaf first.',
      },
      {
        prompt: 'What is the worst-case queue size during BFS on a complete binary tree with n nodes?',
        options: ['O(1)', 'O(log n)', 'About n/2 (the last level)', 'O(n²)'],
        answer: 2,
        explanation: 'The deepest level holds roughly half the nodes.',
      },
    ],
    recap: 'BFS with a frozen level size groups nodes by depth, answers per-level questions and finds the shallowest matches first.',
    nextPrep: 'Tomorrow: binary search trees — ordered trees that support O(h) search.',
  },
  questions: [
    {
      id: 'd17-level-averages',
      day: 17,
      title: 'Average per Floor',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Aggregate per level.',
      statement: 'Print the average value of each level, rounded to 2 decimals, one per line.',
      constraints: ['1 ≤ nodes ≤ 10⁴', '|value| ≤ 2³¹ − 1'],
      examples: [{ input: '3 9 20 null null 15 7', output: '3.00\n14.50\n11.00' }],
      edgeCases: ['Large values (sum in 64-bit)', 'Single node'],
      cues: ['Per-level aggregate → BFS rounds'],
      hints: ['Sum the frozen-size level in long long.', 'Divide by the level size.'],
      approach: 'BFS with level sums.',
      correctness: 'Each round processes exactly one level.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'Standard BFS.' },
      cpp: cpp`${TREE_HEAD}

vector<double> levelAverages(TreeNode* root) {
    vector<double> out;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int size = q.size();
        long long sum = 0;
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            sum += n->val;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        out.push_back((double)sum / size);
    }
    return out;
}`,
      main: cpp`${TREE_BUILD}
#include <cstdio>

int main() {
    vector<TreeNode*> pool;
    for (double a : levelAverages(build(readTokens(), pool))) printf("%.2f\n", a);
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: one average per line.`,
      keyLines: [{ match: 'long long sum = 0;', note: 'Several 2³¹ values on one level overflow int.' }],
      mistakes: ['Integer division'],
      tests: [
        { in: '7\n3 9 20 null null 15 7', out: '3.00\n14.50\n11.00' },
        { in: '1\n5', out: '5.00' },
        { in: '3\n2147483647 2147483647 2147483647', out: '2147483647.00\n2147483647.00' },
        { in: '3\n1 -2 3', out: '1.00\n0.50' },
      ],
      viz: 'tree',
    },
    {
      id: 'd17-min-depth',
      day: 17,
      title: 'Nearest Leaf',
      difficulty: 'Easy',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Stop BFS at the first leaf.',
      statement: 'Print the minimum depth: the number of nodes on the shortest path from the root to a leaf (0 for an empty tree).',
      constraints: ['0 ≤ nodes ≤ 10⁵'],
      examples: [{ input: '3 9 20 null null 15 7', output: '2' }],
      edgeCases: ['A node with one child is not a leaf', 'Chain'],
      cues: ['Shallowest leaf → BFS with early return'],
      hints: ['Process level by level.', 'Return the current depth when you pop a leaf.'],
      approach: 'BFS by levels; return depth at the first leaf.',
      correctness: 'BFS visits depths in increasing order.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'Stops early in the best case.' },
      cpp: cpp`${TREE_HEAD}

int minDepth(TreeNode* root) {
    if (!root) return 0;
    queue<TreeNode*> q;
    q.push(root);
    for (int depth = 1; !q.empty(); depth++) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            if (!n->left && !n->right) return depth;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return 0;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    cout << minDepth(build(readTokens(), pool)) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: minimum depth.`,
      keyLines: [{ match: 'if (!n->left && !n->right) return depth;', note: 'The first leaf found is the shallowest.' }],
      mistakes: ['Recursive min(left, right) that treats a missing child as depth 0'],
      tests: [
        { in: '7\n3 9 20 null null 15 7', out: '2' },
        { in: '9\n2 null 3 null 4 null 5 null 6', out: '5' },
        { in: '0', out: '0' },
        { in: '3\n1 2 3', out: '2' },
      ],
    },
    {
      id: 'd17-right-view',
      day: 17,
      title: 'View From the Right',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Record the last node of each level.',
      statement: 'Print the values visible when looking at the tree from the right side, top to bottom.',
      constraints: ['0 ≤ nodes ≤ 100'],
      examples: [{ input: '1 2 3 null 5 null 4', output: '1 3 4' }],
      edgeCases: ['Left node visible when the right side is shorter', 'Empty tree'],
      cues: ['Last node per level → BFS'],
      hints: ['Record the node at index size − 1 of each level.'],
      approach: 'Example B.',
      correctness: 'The last popped node per level is the rightmost.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'BFS.' },
      cpp: cpp`${TREE_HEAD}

vector<int> rightView(TreeNode* root) {
    vector<int> view;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            if (i == size - 1) view.push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return view;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    vector<int> v = rightView(build(readTokens(), pool));
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << (i + 1 < v.size() ? " " : "");
    cout << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: visible values.`,
      keyLines: [{ match: 'if (i == size - 1) view.push_back(n->val);', note: 'Rightmost node of the level.' }],
      mistakes: ['Following only right pointers'],
      tests: [
        { in: '7\n1 2 3 null 5 null 4', out: '1 3 4' },
        { in: '4\n1 2 3 4', out: '1 3 4' },
        { in: '0', out: '' },
        { in: '3\n1 null 3', out: '1 3' },
      ],
    },
    {
      id: 'd17-zigzag',
      day: 17,
      title: 'Zigzag Levels',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Alternate the output direction per level.',
      statement: 'Print the level order with direction alternating: left-to-right for level 0, right-to-left for level 1, and so on. One level per line.',
      constraints: ['0 ≤ nodes ≤ 2000'],
      examples: [{ input: '3 9 20 null null 15 7', output: '3\n20 9\n15 7' }],
      edgeCases: ['Single level', 'Empty tree'],
      cues: ['Level order + alternating direction'],
      hints: ['Collect each level left-to-right.', 'Reverse it on odd levels.'],
      approach: 'Standard BFS; reverse odd levels before printing.',
      correctness: 'Reversing a left-to-right level yields right-to-left.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'Reversal is linear in level size.' },
      cpp: cpp`${TREE_HEAD}

vector<vector<int>> zigzag(TreeNode* root) {
    vector<vector<int>> out;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int size = q.size();
        vector<int> level;
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            level.push_back(n->val);
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        if (out.size() % 2 == 1) reverse(level.begin(), level.end());
        out.push_back(level);
    }
    return out;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    for (auto& level : zigzag(build(readTokens(), pool)))
        for (size_t i = 0; i < level.size(); i++) cout << level[i] << (i + 1 < level.size() ? " " : "\n");
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: one line per level.`,
      keyLines: [{ match: 'if (out.size() % 2 == 1) reverse(level.begin(), level.end());', note: 'out.size() is the index of the level being added.' }],
      mistakes: ['Changing the push order of children (breaks deeper levels)'],
      tests: [
        { in: '7\n3 9 20 null null 15 7', out: '3\n20 9\n15 7' },
        { in: '1\n1', out: '1' },
        { in: '7\n1 2 3 4 5 6 7', out: '1\n3 2\n4 5 6 7' },
        { in: '0', out: '' },
      ],
    },
    {
      id: 'd17-max-width',
      day: 17,
      title: 'Widest Level Including Gaps',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Use heap-style position indices.',
      statement: 'The width of a level is the distance between its leftmost and rightmost non-null nodes, counting the null positions in between as in a complete tree. Print the maximum width.',
      constraints: ['1 ≤ nodes ≤ 3000'],
      examples: [{ input: '1 3 2 5 3 null 9', output: '4' }],
      edgeCases: ['Deep skewed trees (indices overflow without re-basing)', 'Single node'],
      cues: ['Count missing positions → index nodes like a heap'],
      hints: ['Root index 0; children 2i + 1 and 2i + 2.', 'Width = last − first + 1 per level.', 'Subtract the level\'s first index before computing children to keep numbers small.'],
      approach: 'BFS of (node, index) with per-level re-basing.',
      correctness: 'Heap indices encode horizontal positions in a complete tree.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'BFS.' },
      cpp: cpp`${TREE_HEAD}

long long maxWidth(TreeNode* root) {
    if (!root) return 0;
    queue<pair<TreeNode*, unsigned long long>> q;
    q.push({root, 0});
    long long best = 0;
    while (!q.empty()) {
        int size = q.size();
        unsigned long long first = q.front().second, last = first;
        for (int i = 0; i < size; i++) {
            auto [n, idx] = q.front();
            q.pop();
            idx -= first;  // re-base to avoid overflow
            last = idx;
            if (n->left) q.push({n->left, 2 * idx + 1});
            if (n->right) q.push({n->right, 2 * idx + 2});
        }
        best = max(best, (long long)last + 1);
    }
    return best;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    cout << maxWidth(build(readTokens(), pool)) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: maximum width.`,
      keyLines: [{ match: 'idx -= first;', note: 'Positions relative to the leftmost node of the level.' }],
      mistakes: ['Counting only non-null nodes'],
      tests: [
        { in: '7\n1 3 2 5 3 null 9', out: '4' },
        { in: '4\n1 3 2 5', out: '2' },
        { in: '1\n1', out: '1' },
        { in: '11\n1 1 1 1 null null 1 1 null null 1', out: '8' },
      ],
    },
    {
      id: 'd17-max-level-sum',
      day: 17,
      title: 'Richest Level',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Track the best level index during BFS.',
      statement: 'Print the smallest level number (root = 1) whose node values have the maximum sum.',
      constraints: ['1 ≤ nodes ≤ 10⁴', '−10⁵ ≤ value ≤ 10⁵'],
      examples: [{ input: '1 7 0 7 -8 null null', output: '2' }],
      edgeCases: ['All negative', 'Ties → smallest level'],
      cues: ['Per-level sums → BFS'],
      hints: ['Sum each level.', 'Update only on a strictly larger sum.'],
      approach: 'BFS with running best.',
      correctness: 'Strict comparison keeps the earliest level among ties.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'BFS.' },
      cpp: cpp`${TREE_HEAD}

int maxLevelSum(TreeNode* root) {
    queue<TreeNode*> q;
    q.push(root);
    long long best = LLONG_MIN;
    int bestLevel = 1;
    for (int level = 1; !q.empty(); level++) {
        int size = q.size();
        long long sum = 0;
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            sum += n->val;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
        if (sum > best) {
            best = sum;
            bestLevel = level;
        }
    }
    return bestLevel;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    cout << maxLevelSum(build(readTokens(), pool)) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: level number.`,
      keyLines: [{ match: 'if (sum > best) {', note: 'Strict: ties keep the earlier level.' }],
      mistakes: ['Initialising best to 0 (fails with negative sums)'],
      tests: [
        { in: '7\n1 7 0 7 -8 null null', out: '2' },
        { in: '1\n-5', out: '1' },
        { in: '3\n-1 -2 -3', out: '1' },
        { in: '7\n1 2 3 4 null null 5', out: '3' },
      ],
    },
    {
      id: 'd17-deepest-leaves-sum',
      day: 17,
      title: 'Sum of the Deepest Leaves',
      difficulty: 'Medium',
      topic: 'trees',
      patterns: ['tree-bfs'],
      objective: 'Keep only the last level\'s aggregate.',
      statement: 'Print the sum of the values on the deepest level of the tree.',
      constraints: ['1 ≤ nodes ≤ 10⁴'],
      examples: [{ input: '1 2 3 4 5 null 6 7 null null null null 8', output: '15' }],
      edgeCases: ['Single node', 'Deepest level with one node'],
      cues: ['Answer depends on the last level only → BFS, overwrite the sum each round'],
      hints: ['Compute the sum of each level; the last computed one is the answer.'],
      approach: 'BFS with per-level sum.',
      correctness: 'The final round is the deepest level.',
      complexity: { time: 'O(n)', space: 'O(w)', why: 'BFS.' },
      cpp: cpp`${TREE_HEAD}

long long deepestSum(TreeNode* root) {
    queue<TreeNode*> q;
    q.push(root);
    long long sum = 0;
    while (!q.empty()) {
        int size = q.size();
        sum = 0;
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            sum += n->val;
            if (n->left) q.push(n->left);
            if (n->right) q.push(n->right);
        }
    }
    return sum;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    cout << deepestSum(build(readTokens(), pool)) << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Output: the deepest level sum.`,
      keyLines: [{ match: 'sum = 0;', note: 'Reset at the start of every level.' }],
      mistakes: ['Summing all leaves (not only the deepest)'],
      tests: [
        { in: '13\n1 2 3 4 5 null 6 7 null null null null 8', out: '15' },
        { in: '1\n9', out: '9' },
        { in: '3\n1 2 3', out: '5' },
        { in: '5\n1 2 null 3 null', out: '3' },
      ],
    },
    {
      id: 'd17-distance-k',
      day: 17,
      title: 'Nodes K Steps Away',
      difficulty: 'Hard',
      topic: 'trees',
      patterns: ['graph-bfs', 'tree-bfs'],
      objective: 'Convert a tree into an undirected graph with parent links, then BFS.',
      statement: 'Values are unique. Given a target value and k, print the values of all nodes exactly k edges away from the target, sorted ascending (or an empty line).',
      constraints: ['1 ≤ nodes ≤ 500', '0 ≤ k ≤ 1000'],
      examples: [{ input: '3 5 1 6 2 0 8 null null 7 4, target 5, k 2', output: '1 4 7' }],
      edgeCases: ['k = 0 → the target itself', 'k larger than the tree height'],
      cues: ['Distance in any direction (up or down) → add parent edges and BFS'],
      hints: ['Record each node\'s parent with a DFS.', 'BFS from the target over left, right and parent.', 'Stop after k rounds.'],
      approach: 'Parent map + BFS with a visited set.',
      correctness: 'With parent edges the tree is an undirected graph; BFS distance equals edge count.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each node visited once.' },
      cpp: cpp`${TREE_HEAD}
#include <unordered_map>
#include <unordered_set>

void linkParents(TreeNode* n, TreeNode* p, unordered_map<TreeNode*, TreeNode*>& parent) {
    if (!n) return;
    parent[n] = p;
    linkParents(n->left, n, parent);
    linkParents(n->right, n, parent);
}

TreeNode* findNode(TreeNode* n, int v) {
    if (!n || n->val == v) return n;
    TreeNode* l = findNode(n->left, v);
    return l ? l : findNode(n->right, v);
}

vector<int> distanceK(TreeNode* root, int target, int k) {
    unordered_map<TreeNode*, TreeNode*> parent;
    linkParents(root, nullptr, parent);
    TreeNode* start = findNode(root, target);
    queue<TreeNode*> q;
    unordered_set<TreeNode*> seen{start};
    q.push(start);
    for (int d = 0; d < k && !q.empty(); d++) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* n = q.front();
            q.pop();
            for (TreeNode* nb : {n->left, n->right, parent[n]})
                if (nb && seen.insert(nb).second) q.push(nb);
        }
    }
    vector<int> out;
    while (!q.empty()) {
        out.push_back(q.front()->val);
        q.pop();
    }
    sort(out.begin(), out.end());
    return out;
}`,
      main: cpp`${TREE_BUILD}

int main() {
    vector<TreeNode*> pool;
    TreeNode* root = build(readTokens(), pool);
    int target, k;
    cin >> target >> k;
    vector<int> out = distanceK(root, target, k);
    for (size_t i = 0; i < out.size(); i++) cout << out[i] << (i + 1 < out.size() ? " " : "");
    cout << "\n";
    for (auto* p : pool) delete p;
    return 0;
}`,
      io: `${TREE_IO} Then target k. Output: values at distance k.`,
      keyLines: [{ match: 'for (TreeNode* nb : {n->left, n->right, parent[n]})', note: 'Three neighbours: two children and the parent.' }],
      mistakes: ['Forgetting the visited set (walks back and forth)'],
      tests: [
        { in: '11\n3 5 1 6 2 0 8 null null 7 4\n5 2', out: '1 4 7' },
        { in: '1\n1\n1 3', out: '' },
        { in: '3\n1 2 3\n2 0', out: '2' },
        { in: '3\n1 2 3\n2 2', out: '3' },
      ],
    },
  ],
};

export default day;
