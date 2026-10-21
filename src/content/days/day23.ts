import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 23,
    title: 'Topological Sorting and Dependency Resolution',
    zone: 'graphs',
    objectives: [
      'Model prerequisites as directed edges u → v ("u before v")',
      'Produce a topological order with Kahn\'s algorithm (in-degrees + queue)',
      'Detect directed cycles with Kahn\'s count or DFS colouring',
      'Run DP over a DAG in topological order (longest paths, path counts)',
    ],
    prerequisites: ['Day 21: graphs, BFS/DFS', 'Day 10: queues'],
    lesson: [
      {
        heading: 'Directed acyclic graphs',
        body: 'A topological order lists nodes so that every edge u → v has u before v. It exists **iff** the directed graph has no cycle. There may be many valid orders.',
      },
      {
        heading: 'Kahn\'s algorithm',
        body: 'Compute each node\'s in-degree (number of unmet prerequisites). Queue all nodes with in-degree 0. Repeatedly pop u, append it to the order, and decrement the in-degree of its successors; any successor reaching 0 joins the queue. If fewer than n nodes are output, a cycle blocked the rest.',
      },
      {
        heading: 'Deterministic orders',
        body: 'Using a `queue` gives one valid order; using a min-heap instead gives the lexicographically smallest order — useful when a unique answer is required.',
      },
      {
        heading: 'DFS colouring',
        body: 'Colour nodes white (unvisited), grey (on the current DFS path) and black (finished). Reaching a grey node means a back edge — a cycle. Appending nodes when they turn black and reversing gives a topological order.',
      },
      {
        heading: 'DP on a DAG',
        body: 'Processing nodes in topological order guarantees all predecessors are final, so `longest[v] = max(longest[u] + w)` or `ways[v] += ways[u]` can be computed in one pass.',
      },
    ],
    recognition: [
      'Prerequisites, build steps, course schedules, "must happen before" → topological sort.',
      '"Is it possible to finish everything?" → cycle detection in a directed graph.',
      'Longest/shortest/counting paths in a DAG → DP in topological order.',
    ],
    patterns: ['topological-sort', 'graph-dfs', 'state-space-dp'],
    visualizations: ['graph-algos'],
    exampleA: {
      id: 'd23-A',
      title: "Kahn's algorithm",
      goal: 'Order 6 tasks so every prerequisite comes first, or report a cycle.',
      input: 'edges 0→1, 0→2, 1→3, 2→3, 3→4, 5→4',
      output: 'order: 0 5 1 2 3 4',
      idea: 'Nodes with in-degree 0 have no unmet prerequisites. Output one, remove its outgoing edges, and repeat.',
      code: TRACE_CODE['topo-kahn'],
      keyLines: [
        { match: 'indeg[v]++;', note: 'In-degree = number of prerequisites of v.' },
        { match: 'if (indeg[i] == 0) q.push(i);', note: 'Start with every task that has no prerequisites.' },
        { match: 'if (--indeg[v] == 0) q.push(v);', note: 'v becomes ready when its last prerequisite is done.' },
        { match: 'if ((int)order.size() != n) return {};', note: 'Nodes on a cycle never reach in-degree 0.' },
      ],
      complexity: { time: 'O(V + E)', space: 'O(V + E)', why: 'Each node is queued once and each edge decremented once.' },
      edgeCases: ['Cycle → empty result', 'Several independent sources', 'Isolated nodes appear anywhere'],
      mistakes: ['Reversing edge direction (u → v must mean u first)', 'Forgetting the size check for cycles'],
      tryIt: 'Replace the queue with a min-heap to output the lexicographically smallest order.',
      trace: { id: 'topo-kahn', input: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [5, 4]] } },
      bug: {
        find: 'if (--indeg[v] == 0) q.push(v);',
        replace: 'q.push(v);',
        symptom: 'The program prints "cycle detected" although the graph is acyclic — nodes are queued once per incoming edge, so the order has too many entries.',
        explanation: 'A node is ready only when ALL its prerequisites are done, i.e. when its in-degree drops to 0. Pushing it on every incoming edge outputs nodes too early and several times, so order.size() no longer equals n and the cycle check fires.',
      },
    },
    exampleB: {
      id: 'd23-B',
      kind: 'variant',
      title: 'Cycle detection with DFS colours',
      goal: 'Decide whether a directed graph has a cycle using white/grey/black colouring.',
      input: 'graph A: 0→1, 1→2, 2→0; graph B: 0→1, 1→2, 0→2',
      output: 'A has cycle: true\nB has cycle: false',
      idea: 'Grey nodes are on the current recursion path. An edge into a grey node goes back to an ancestor and closes a cycle. Black nodes are fully explored and safe.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

enum Color { WHITE, GREY, BLACK };

bool dfs(int u, const vector<vector<int>>& adj, vector<Color>& color) {
    color[u] = GREY;
    for (int v : adj[u]) {
        if (color[v] == GREY) return true;                    // back edge
        if (color[v] == WHITE && dfs(v, adj, color)) return true;
    }
    color[u] = BLACK;  //@gap
    return false;
}

bool hasCycle(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) adj[u].push_back(v);
    vector<Color> color(n, WHITE);
    for (int s = 0; s < n; s++)
        if (color[s] == WHITE && dfs(s, adj, color)) return true;
    return false;
}

int main() {
    cout << boolalpha;
    cout << "A has cycle: " << hasCycle(3, {{0, 1}, {1, 2}, {2, 0}}) << "\n";
    cout << "B has cycle: " << hasCycle(3, {{0, 1}, {1, 2}, {0, 2}}) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'color[u] = GREY;', note: 'u is on the active path.' },
        { match: 'if (color[v] == GREY) return true;', note: 'Edge to an ancestor on the current path → cycle.' },
        { match: 'color[u] = BLACK;', note: 'Finished: reaching u again later is not a cycle (graph B, edge 0→2).' },
      ],
      dryRun: {
        columns: ['graph', 'step', 'colours', 'event'],
        rows: [
          ['A', 'dfs(0) → dfs(1) → dfs(2)', '0,1,2 grey', 'edge 2→0 hits grey → cycle'],
          ['B', 'dfs(0) → dfs(1) → dfs(2)', '2 black, 1 black', 'back in 0: edge 0→2 hits black → fine'],
        ],
      },
      complexity: { time: 'O(V + E)', space: 'O(V)', why: 'Each node changes colour twice; each edge examined once.' },
      edgeCases: ['Self-loop u→u is a cycle', 'Disconnected graph: start DFS from every white node'],
      mistakes: ['Using a single visited flag (cannot tell back edges from cross edges)'],
      tryIt: 'Collect nodes when they turn black and reverse the list to get a topological order.',
    },
    complexityNotes: 'Kahn\'s algorithm and DFS colouring are both O(V + E). Using a min-heap for a lexicographic order adds a log V factor.',
    quiz: [
      {
        prompt: 'Kahn\'s algorithm outputs 4 of 6 nodes and the queue becomes empty. What does that mean?',
        options: ['The order is still valid', 'The graph contains a cycle', 'Two nodes are isolated', 'The graph is undirected'],
        answer: 1,
        explanation: 'Nodes on a cycle never reach in-degree 0.',
      },
      {
        prompt: 'In DFS colouring, you reach a BLACK node. Is that a cycle?',
        options: ['Yes', 'No — it was fully explored earlier; this is a cross/forward edge', 'Only in undirected graphs', 'Only if it is the start'],
        answer: 1,
        explanation: 'Only GREY (on the current path) indicates a back edge.',
      },
      {
        prompt: 'Course a must be taken before course b. Which edge do you add?',
        options: ['b → a', 'a → b', 'Both', 'Neither — use a set'],
        answer: 1,
        explanation: 'Edges point from prerequisite to dependent.',
      },
    ],
    recap: 'Topological order exists exactly for DAGs. Kahn\'s in-degree queue builds it and detects cycles; DFS colouring detects back edges. DAG DP runs in topological order.',
    nextPrep: 'Tomorrow: Union-Find, a structure for merging groups and answering connectivity fast.',
  },
  questions: [
    {
      id: 'd23-town-judge',
      day: 23,
      title: 'Find the Town Judge',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['topological-sort'],
      objective: 'Reason with in-degrees and out-degrees.',
      statement: 'n people (1..n). Edge a b means a trusts b. The judge trusts nobody and is trusted by everyone else. Print the judge or -1.',
      constraints: ['1 ≤ n ≤ 1000', '0 ≤ trusts ≤ 10⁴'],
      examples: [{ input: 'n=3, trusts 1→3, 2→3', output: '3' }],
      edgeCases: ['n = 1 with no trusts → 1', 'Two candidates impossible'],
      cues: ['Conditions on incoming/outgoing counts → degree arrays'],
      hints: ['score[b]++ for being trusted, score[a]-- for trusting.', 'The judge has score n − 1.'],
      approach: 'Net degree count.',
      correctness: 'Only someone trusted by n − 1 people and trusting nobody reaches n − 1.',
      complexity: { time: 'O(n + m)', space: 'O(n)', why: 'One pass over edges.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int findJudge(int n, const vector<pair<int, int>>& trust) {
    vector<int> score(n + 1, 0);
    for (auto [a, b] : trust) {
        score[a]--;
        score[b]++;
    }
    for (int i = 1; i <= n; i++)
        if (score[i] == n - 1) return i;
    return -1;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> t(m);
    for (auto& [a, b] : t) cin >> a >> b;
    cout << findJudge(n, t) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m trust pairs. Output: judge or -1.',
      keyLines: [{ match: 'if (score[i] == n - 1) return i;', note: 'In-degree n − 1 and out-degree 0 combined.' }],
      mistakes: ['Only checking the in-degree'],
      tests: [
        { in: '3 2\n1 3\n2 3', out: '3' },
        { in: '3 3\n1 3\n2 3\n3 1', out: '-1' },
        { in: '1 0', out: '1' },
        { in: '2 0', out: '-1' },
      ],
      viz: 'graph-algos',
    },
    {
      id: 'd23-can-finish',
      day: 23,
      title: 'Can All Courses Be Finished?',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort'],
      objective: 'Cycle detection via Kahn\'s count.',
      statement: 'n courses (0..n−1); pair a b means b must be taken before a. Print `true` if all courses can be finished.',
      constraints: ['1 ≤ n ≤ 2000', '0 ≤ pairs ≤ 5000'],
      examples: [{ input: 'n=2, pairs (1,0)', output: 'true' }],
      edgeCases: ['Self-dependency', 'Disconnected courses'],
      cues: ['Prerequisites + feasibility → DAG check'],
      hints: ['Edge b → a for each pair (a, b).', 'Run Kahn and count outputs.'],
      approach: 'Kahn\'s algorithm; feasible iff all n nodes are output.',
      correctness: 'Output size < n ⇔ a cycle exists.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Kahn.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

bool canFinish(int n, const vector<pair<int, int>>& pre) {
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [a, b] : pre) {
        adj[b].push_back(a);
        indeg[a]++;
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!indeg[i]) q.push(i);
    int done = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        done++;
        for (int v : adj[u])
            if (--indeg[v] == 0) q.push(v);
    }
    return done == n;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> p(m);
    for (auto& [a, b] : p) cin >> a >> b;
    cout << (canFinish(n, p) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n m, then m pairs "a b". Output: true or false.',
      keyLines: [{ match: 'adj[b].push_back(a);', note: 'Prerequisite b points to dependent a.' }],
      mistakes: ['Reversing the pair meaning'],
      tests: [
        { in: '2 1\n1 0', out: 'true' },
        { in: '2 2\n1 0\n0 1', out: 'false' },
        { in: '3 1\n1 1', out: 'false' },
        { in: '4 3\n1 0\n2 1\n3 2', out: 'true' },
      ],
    },
    {
      id: 'd23-course-order',
      day: 23,
      title: 'Lexicographically Smallest Course Plan',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort', 'heap-greedy'],
      objective: 'Make the topological order unique with a min-heap.',
      statement: 'Print the lexicographically smallest valid order of courses 0..n−1 (pair a b: b before a), or `impossible`.',
      constraints: ['1 ≤ n ≤ 2000'],
      examples: [{ input: 'n=4, pairs (1,0) (2,0) (3,1) (3,2)', output: '0 1 2 3' }],
      edgeCases: ['Cycle → impossible', 'No pairs → 0..n−1'],
      cues: ['Smallest order among valid ones → always take the smallest ready node'],
      hints: ['Use priority_queue with greater<int>.'],
      approach: 'Kahn with a min-heap.',
      correctness: 'Choosing the smallest available node at each step is optimal for lexicographic order.',
      complexity: { time: 'O((n + m) log n)', space: 'O(n + m)', why: 'Heap operations.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<int> smallestOrder(int n, const vector<pair<int, int>>& pre) {
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [a, b] : pre) {
        adj[b].push_back(a);
        indeg[a]++;
    }
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 0; i < n; i++)
        if (!indeg[i]) pq.push(i);
    vector<int> order;
    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indeg[v] == 0) pq.push(v);
    }
    if ((int)order.size() < n) return {};
    return order;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> p(m);
    for (auto& [a, b] : p) cin >> a >> b;
    vector<int> o = smallestOrder(n, p);
    if (o.empty()) cout << "impossible\n";
    else
        for (int i = 0; i < n; i++) cout << o[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n m, then m pairs. Output: order or "impossible".',
      keyLines: [{ match: 'priority_queue<int, vector<int>, greater<int>> pq;', note: 'Min-heap picks the smallest ready course.' }],
      mistakes: ['Using a FIFO queue (valid but not smallest)'],
      tests: [
        { in: '4 4\n1 0\n2 0\n3 1\n3 2', out: '0 1 2 3' },
        { in: '3 0', out: '0 1 2' },
        { in: '2 2\n0 1\n1 0', out: 'impossible' },
        { in: '4 2\n0 3\n1 2', out: '2 1 3 0' },
      ],
    },
    {
      id: 'd23-min-semesters',
      day: 23,
      title: 'Minimum Semesters',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort', 'queue-level-traversal'],
      objective: 'Count Kahn levels.',
      statement: 'Any number of courses can be taken per semester if their prerequisites were completed earlier. Print the minimum number of semesters, or -1 if impossible (pair a b: b before a; courses 1..n).',
      constraints: ['1 ≤ n ≤ 5000'],
      examples: [{ input: 'n=3, pairs (3,1) (3,2)', output: '2' }],
      edgeCases: ['Cycle → -1', 'No pairs → 1'],
      cues: ['Rounds of "everything currently available" → Kahn by levels'],
      hints: ['Process the queue level by level.', 'The number of levels is the answer.'],
      approach: 'Level-order Kahn.',
      correctness: 'The level of a node equals the length of the longest prerequisite chain ending at it.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Kahn.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minSemesters(int n, const vector<pair<int, int>>& pre) {
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (auto [a, b] : pre) {
        adj[b].push_back(a);
        indeg[a]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++)
        if (!indeg[i]) q.push(i);
    int semesters = 0, taken = 0;
    while (!q.empty()) {
        semesters++;
        int size = q.size();
        while (size--) {
            int u = q.front();
            q.pop();
            taken++;
            for (int v : adj[u])
                if (--indeg[v] == 0) q.push(v);
        }
    }
    return taken == n ? semesters : -1;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> p(m);
    for (auto& [a, b] : p) cin >> a >> b;
    cout << minSemesters(n, p) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m pairs. Output: semesters or -1.',
      keyLines: [{ match: 'int size = q.size();', note: 'One semester = one level of ready courses.' }],
      mistakes: ['Counting nodes instead of levels'],
      tests: [
        { in: '3 2\n3 1\n3 2', out: '2' },
        { in: '3 3\n2 1\n3 2\n1 3', out: '-1' },
        { in: '1 0', out: '1' },
        { in: '5 4\n2 1\n3 2\n4 3\n5 1', out: '4' },
      ],
    },
    {
      id: 'd23-longest-path-dag',
      day: 23,
      title: 'Longest Weighted Path in a DAG',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort', 'state-space-dp'],
      objective: 'DP in topological order.',
      statement: 'A weighted DAG has nodes 0..n−1. Print the maximum total weight of any path (a path may be a single node with weight 0).',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵', '−10⁹ ≤ w ≤ 10⁹'],
      examples: [{ input: 'n=4, edges 0→1 (3), 1→2 (4), 0→2 (5), 2→3 (1)', output: '8' }],
      edgeCases: ['All weights negative → 0', 'Disconnected DAG'],
      cues: ['Longest path is NP-hard in general but easy in a DAG → topological DP'],
      hints: ['best[v] = max(0, max over edges u→v of best[u] + w).', 'Process nodes in topological order.'],
      approach: 'Kahn order + relaxation.',
      correctness: 'When v is processed, all its predecessors already have final best values.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'One pass over edges.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

long long longestPath(int n, const vector<tuple<int, int, long long>>& edges) {
    vector<vector<pair<int, long long>>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [u, v, w] : edges) {
        adj[u].push_back({v, w});
        indeg[v]++;
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!indeg[i]) q.push(i);
    vector<long long> best(n, 0);
    long long answer = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        answer = max(answer, best[u]);
        for (auto [v, w] : adj[u]) {
            best[v] = max(best[v], best[u] + w);
            if (--indeg[v] == 0) q.push(v);
        }
    }
    return answer;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, long long>> e(m);
    for (auto& [u, v, w] : e) cin >> u >> v >> w;
    cout << longestPath(n, e) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges "u v w". Output: maximum path weight.',
      keyLines: [{ match: 'best[v] = max(best[v], best[u] + w);', note: 'Relax only after u is final (topological order).' }],
      mistakes: ['Running Dijkstra with negated weights (invalid)'],
      tests: [
        { in: '4 4\n0 1 3\n1 2 4\n0 2 5\n2 3 1', out: '8' },
        { in: '2 1\n0 1 -5', out: '0' },
        { in: '1 0', out: '0' },
        { in: '3 2\n0 1 1000000000\n1 2 1000000000', out: '2000000000' },
      ],
    },
    {
      id: 'd23-safe-states',
      day: 23,
      title: 'Nodes That Never Loop',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort', 'graph-dfs'],
      objective: 'Reverse the graph and run Kahn from terminal nodes.',
      statement: 'A node is safe if every path from it ends at a terminal node (no outgoing edges). Print all safe nodes ascending.',
      constraints: ['1 ≤ n ≤ 10⁴'],
      examples: [{ input: 'adj: 0→[1,2], 1→[2,3], 2→[5], 3→[0], 4→[5], 5→[], 6→[]', output: '2 4 5 6' }],
      edgeCases: ['Self-loop → unsafe', 'All terminal'],
      cues: ['"All paths end at terminals" → peel terminals backwards (reverse Kahn on out-degrees)'],
      hints: ['Reverse every edge.', 'Start from nodes with out-degree 0.', 'A node becomes safe when all its outgoing edges lead to safe nodes.'],
      approach: 'Kahn on the reversed graph using original out-degrees.',
      correctness: 'Nodes never reaching out-degree 0 can reach a cycle.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Kahn.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<int> safeNodes(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<vector<int>> rev(n);
    vector<int> outdeg(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : adj[u]) {
            rev[v].push_back(u);
            outdeg[u]++;
        }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!outdeg[i]) q.push(i);
    vector<bool> safe(n, false);
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        safe[v] = true;
        for (int u : rev[v])
            if (--outdeg[u] == 0) q.push(u);
    }
    vector<int> out;
    for (int i = 0; i < n; i++)
        if (safe[i]) out.push_back(i);
    return out;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> adj(n);
    for (auto& l : adj) {
        int k;
        cin >> k;
        l.resize(k);
        for (auto& v : l) cin >> v;
    }
    vector<int> s = safeNodes(adj);
    for (size_t i = 0; i < s.size(); i++) cout << s[i] << (i + 1 < s.size() ? " " : "");
    cout << "\n";
    return 0;
}`,
      io: 'Input: n, then for each node "k v1 … vk". Output: safe nodes.',
      keyLines: [{ match: 'if (--outdeg[u] == 0) q.push(u);', note: 'All of u\'s successors are now known to be safe.' }],
      mistakes: ['Marking a node safe because one path terminates'],
      tests: [
        { in: '7\n2 1 2\n2 2 3\n1 5\n1 0\n1 5\n0\n0', out: '2 4 5 6' },
        { in: '1\n1 0', out: '' },
        { in: '3\n0\n0\n0', out: '0 1 2' },
        { in: '3\n1 1\n1 2\n1 1', out: '' },
      ],
    },
    {
      id: 'd23-count-paths-dag',
      day: 23,
      title: 'Count Routes Through a DAG',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['topological-sort', 'tabulation'],
      objective: 'Path counting DP modulo a prime.',
      statement: 'Count the paths from node 0 to node n − 1 in a DAG, modulo 1 000 000 007.',
      constraints: ['2 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵'],
      examples: [{ input: 'n=4, edges 0→1 0→2 1→3 2→3', output: '2' }],
      edgeCases: ['No path → 0', 'Exponentially many paths (needs modulo)'],
      cues: ['Counting paths in a DAG → ways[v] += ways[u] in topological order'],
      hints: ['ways[0] = 1.', 'Propagate along edges in topological order, taking the modulus.'],
      approach: 'Kahn order DP.',
      correctness: 'Every path to v ends with exactly one edge u→v; summing over u counts each path once.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'One pass.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

const long long MOD = 1000000007;

long long countPaths(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    vector<int> indeg(n, 0);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        indeg[v]++;
    }
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (!indeg[i]) q.push(i);
    vector<long long> ways(n, 0);
    ways[0] = 1;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            ways[v] = (ways[v] + ways[u]) % MOD;
            if (--indeg[v] == 0) q.push(v);
        }
    }
    return ways[n - 1];
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    cout << countPaths(n, e) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: number of paths mod 1e9+7.',
      keyLines: [{ match: 'ways[v] = (ways[v] + ways[u]) % MOD;', note: 'Keep values small with the modulus.' }],
      mistakes: ['DFS enumeration of all paths (exponential)'],
      tests: [
        { in: '4 4\n0 1\n0 2\n1 3\n2 3', out: '2' },
        { in: '3 1\n1 2', out: '0' },
        { in: '2 2\n0 1\n0 1', out: '2' },
        { in: '5 7\n0 1\n0 2\n1 2\n1 3\n2 3\n2 4\n3 4', out: '5' },
      ],
    },
    {
      id: 'd23-alien-order',
      day: 23,
      title: 'Decode an Alien Alphabet',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['topological-sort', 'heap-greedy'],
      objective: 'Derive ordering constraints from adjacent words.',
      statement: 'Words are sorted in an unknown alphabet (subset of lowercase letters). Derive a letter order consistent with them: compare adjacent words at the first differing letter. Print the lexicographically smallest valid order of all letters that appear, or `invalid` (cycle or a word followed by its own proper prefix).',
      constraints: ['1 ≤ words ≤ 100', '1 ≤ length ≤ 100'],
      examples: [{ input: 'wrt wrf er ett rftt', output: 'wertf' }],
      edgeCases: ['"abc" before "ab" → invalid', 'Single word → its letters in natural order'],
      cues: ['Pairwise order constraints → graph + topological sort'],
      hints: ['For each adjacent pair, the first differing letters give an edge.', 'If no difference and the first word is longer, the input is invalid.', 'Kahn with a min-heap over the letters present.'],
      approach: 'Build edges from adjacent pairs; Kahn with a min-heap.',
      correctness: 'Only first-difference comparisons are implied by sorted order; any topological order satisfies them.',
      complexity: { time: 'O(total characters + 26 log 26)', space: 'O(26²)', why: 'At most one edge per adjacent pair.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

string alienOrder(const vector<string>& w) {
    bool present[26] = {false}, edge[26][26] = {{false}};
    int indeg[26] = {0};
    for (auto& s : w)
        for (char c : s) present[c - 'a'] = true;
    for (size_t i = 0; i + 1 < w.size(); i++) {
        const string &a = w[i], &b = w[i + 1];
        size_t k = 0;
        while (k < a.size() && k < b.size() && a[k] == b[k]) k++;
        if (k == a.size() || k == b.size()) {
            if (a.size() > b.size()) return "invalid";
            continue;
        }
        int u = a[k] - 'a', v = b[k] - 'a';
        if (!edge[u][v]) {
            edge[u][v] = true;
            indeg[v]++;
        }
    }
    priority_queue<int, vector<int>, greater<int>> pq;
    int total = 0;
    for (int c = 0; c < 26; c++)
        if (present[c]) {
            total++;
            if (!indeg[c]) pq.push(c);
        }
    string out;
    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();
        out += char('a' + u);
        for (int v = 0; v < 26; v++)
            if (edge[u][v] && --indeg[v] == 0) pq.push(v);
    }
    return (int)out.size() == total ? out : "invalid";
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> w(n);
    for (auto& s : w) cin >> s;
    cout << alienOrder(w) << "\n";
    return 0;
}`,
      io: 'Input: n, then n words. Output: the order or "invalid".',
      keyLines: [{ match: 'if (a.size() > b.size()) return "invalid";', note: 'A word cannot come before its own proper prefix.' }],
      mistakes: ['Adding constraints beyond the first difference'],
      tests: [
        { in: '5\nwrt wrf er ett rftt', out: 'wertf' },
        { in: '2\nz x', out: 'zx' },
        { in: '3\nz x z', out: 'invalid' },
        { in: '2\nabc ab', out: 'invalid' },
      ],
    },
  ],
};

export default day;
