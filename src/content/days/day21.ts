import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 21,
    title: 'Graph Representation, DFS and BFS',
    zone: 'graphs',
    objectives: [
      'Store graphs as adjacency lists and know when a matrix is better',
      'Traverse with DFS (recursion or explicit stack) and BFS (queue)',
      'Count connected components and detect cycles in undirected graphs',
      'Reconstruct shortest paths in unweighted graphs with a parent array',
    ],
    prerequisites: ['Day 10: queues and stacks', 'Day 17: BFS on trees'],
    lesson: [
      {
        heading: 'Representations',
        body: '- **Adjacency list** `vector<vector<int>> adj(n)`: O(V + E) memory, iterate neighbours quickly — the default.\n- **Adjacency matrix** `vector<vector<bool>> m(n, vector<bool>(n))`: O(V²) memory, O(1) edge test — good for dense or tiny graphs.\n- **Edge list**: handy for sorting edges (Kruskal) or Union-Find.\nFor undirected graphs add each edge in both directions.',
      },
      {
        heading: 'DFS',
        body: 'Mark a node visited, then recursively visit its unvisited neighbours. Each node and edge is processed once: O(V + E). Use DFS for reachability, components, cycle detection and topological ideas. For deep graphs replace recursion with an explicit stack.',
      },
      {
        heading: 'BFS and shortest paths',
        body: 'BFS explores in order of distance from the source when every edge has the same weight. Mark nodes visited **when pushing** to avoid duplicates. Record `parent[v] = u` on discovery; walk parents back from the target to rebuild a shortest path.',
      },
      {
        heading: 'Trees are graphs too',
        body: 'A tree is a connected acyclic graph with n − 1 edges. General graphs may have cycles and several components, which is why the visited array is essential.',
      },
    ],
    recognition: [
      'Entities with pairwise relationships (friends, roads, prerequisites) → graph.',
      '"Fewest steps/moves" with uniform cost → BFS.',
      '"Can we reach", "how many groups", "is there a cycle" → DFS (or BFS).',
      'Dense graph with n ≤ ~2000 and many edge queries → adjacency matrix.',
    ],
    patterns: ['graph-dfs', 'graph-bfs', 'algorithm-selection'],
    visualizations: ['graph-algos'],
    exampleA: {
      id: 'd21-A',
      title: 'Adjacency list and connected components with DFS',
      goal: 'Count the connected components of an undirected graph and list each one.',
      input: 'n = 7; edges 0-1, 1-2, 3-4, 5-6',
      output: 'component: 0 1 2\ncomponent: 3 4\ncomponent: 5 6\ncomponents = 3',
      idea: 'Start a DFS from every node that is not yet visited. Each start discovers exactly one whole component.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

void dfs(int u, const vector<vector<int>>& adj, vector<bool>& seen, vector<int>& comp) {
    seen[u] = true;
    comp.push_back(u);
    for (int v : adj[u])
        if (!seen[v]) dfs(v, adj, seen, comp);  //@gap
}

int main() {
    int n = 7;
    vector<pair<int, int>> edges = {{0, 1}, {1, 2}, {3, 4}, {5, 6}};
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);  // undirected: store both directions
    }
    vector<bool> seen(n, false);
    int components = 0;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        vector<int> comp;
        dfs(s, adj, seen, comp);
        components++;
        cout << "component:";
        for (int u : comp) cout << " " << u;
        cout << "\n";
    }
    cout << "components = " << components << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'adj[v].push_back(u);', note: 'Undirected edge: both endpoints list each other.' },
        { match: 'seen[u] = true;', note: 'Mark before exploring neighbours to stop infinite loops on cycles.' },
        { match: 'if (seen[s]) continue;', note: 'Every unvisited node starts a new component.' },
      ],
      dryRun: {
        columns: ['start s', 'DFS visits', 'components'],
        rows: [
          ['0', '0, 1, 2', '1'],
          ['1, 2', 'already seen', '1'],
          ['3', '3, 4', '2'],
          ['5', '5, 6', '3'],
        ],
      },
      complexity: { time: 'O(V + E)', space: 'O(V + E)', why: 'Each node is entered once and each adjacency entry is scanned once; the list stores 2E entries.' },
      edgeCases: ['Isolated nodes are components of size 1', 'Self-loops and parallel edges', 'Recursion depth up to V'],
      mistakes: ['Adding only one direction for undirected edges', 'Marking visited after recursing'],
      tryIt: 'Print the size of the largest component instead of listing them.',
      bug: {
        find: 'if (seen[s]) continue;',
        replace: '// if (seen[s]) continue;',
        symptom: 'The program prints "components = 7" — every node is counted as its own component.',
        explanation: 'Without the check, the outer loop starts a new component from nodes that an earlier DFS already reached. Only unvisited nodes may start a component.',
      },
    },
    exampleB: {
      id: 'd21-B',
      kind: 'variant',
      title: 'BFS shortest path with parent reconstruction',
      goal: 'Find a shortest path (fewest edges) between two nodes of an unweighted graph and print it.',
      input: 'n = 6; edges 0-1, 0-2, 1-3, 2-3, 3-4, 4-5; from 0 to 5',
      output: 'distance = 4\npath: 0 1 3 4 5',
      idea: 'BFS discovers nodes in order of distance. Remember who discovered each node; following parents back from the target gives a shortest path in reverse.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n = 6, src = 0, dst = 5;
    vector<pair<int, int>> edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}};
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<int> dist(n, -1), parent(n, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            if (dist[v] != -1) continue;
            dist[v] = dist[u] + 1;  // mark when pushing
            parent[v] = u;
            q.push(v);
        }
    }
    cout << "distance = " << dist[dst] << "\n";
    vector<int> path;
    for (int v = dst; v != -1; v = parent[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    cout << "path:";
    for (int v : path) cout << " " << v;
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'dist[v] = dist[u] + 1;  // mark when pushing', note: 'Setting dist on discovery doubles as the visited mark.' },
        { match: 'parent[v] = u;', note: 'The first discoverer lies on a shortest path.' },
        { match: 'for (int v = dst; v != -1; v = parent[v]) path.push_back(v);', note: 'Walk back to the source (whose parent is −1).' },
      ],
      dryRun: {
        columns: ['pop', 'discovered (dist)', 'queue'],
        rows: [
          ['0', '1 (1), 2 (1)', '1 2'],
          ['1', '3 (2)', '2 3'],
          ['2', '—', '3'],
          ['3', '4 (3)', '4'],
          ['4', '5 (4)', '5'],
        ],
      },
      complexity: { time: 'O(V + E)', space: 'O(V)', why: 'Each node enters the queue once.' },
      edgeCases: ['Unreachable target (dist = −1, path should not be printed)', 'src == dst'],
      mistakes: ['Marking visited when popping (nodes can be queued several times)', 'Using BFS on weighted graphs'],
      tryIt: 'Handle unreachable targets by printing "no path".',
    },
    complexityNotes: 'DFS and BFS are O(V + E) with adjacency lists; with an adjacency matrix they become O(V²).',
    quiz: [
      {
        prompt: 'A graph has 10⁵ nodes and 2·10⁵ edges. Which representation?',
        options: ['Adjacency matrix', 'Adjacency list', 'Either — same memory', 'Neither'],
        answer: 1,
        explanation: 'A matrix would need 10¹⁰ cells.',
      },
      {
        prompt: 'Why mark a node visited when it is pushed into the BFS queue (not when popped)?',
        options: ['Style only', 'Otherwise the same node can be pushed many times before being processed', 'It changes distances', 'Queues require it'],
        answer: 1,
        explanation: 'Early marking keeps the queue size and work O(V + E).',
      },
      {
        prompt: 'What does BFS compute that DFS does not (in unweighted graphs)?',
        options: ['Reachability', 'Shortest path lengths in edges', 'Connected components', 'Cycles'],
        answer: 1,
        explanation: 'BFS processes nodes in non-decreasing distance order.',
      },
    ],
    recap: 'Adjacency lists + visited arrays make DFS and BFS O(V + E). DFS answers reachability and components; BFS gives unweighted shortest paths, rebuilt with parent pointers.',
    nextPrep: 'Tomorrow: graphs hidden in grids — flood fill and multi-source BFS.',
  },
  questions: [
    {
      id: 'd21-path-exists',
      day: 21,
      title: 'Is There a Road?',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['graph-dfs', 'graph-bfs'],
      objective: 'Reachability with BFS or DFS.',
      statement: 'An undirected graph has n nodes (0-based) and m edges. Print `true` if there is a path from s to t.',
      constraints: ['1 ≤ n ≤ 2·10⁵', '0 ≤ m ≤ 2·10⁵'],
      examples: [{ input: 'n=3, edges 0-1 1-2, s=0, t=2', output: 'true' }],
      edgeCases: ['s == t', 'No edges'],
      cues: ['"Can we reach" → traversal from s'],
      hints: ['Build an adjacency list.', 'BFS from s and check whether t gets visited.'],
      approach: 'Iterative BFS.',
      correctness: 'BFS visits exactly the nodes reachable from s.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Standard traversal.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

bool reachable(int n, const vector<pair<int, int>>& edges, int s, int t) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<bool> seen(n, false);
    queue<int> q;
    q.push(s);
    seen[s] = true;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        if (u == t) return true;
        for (int v : adj[u])
            if (!seen[v]) {
                seen[v] = true;
                q.push(v);
            }
    }
    return false;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    int s, t;
    cin >> s >> t;
    cout << (reachable(n, e, s, t) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n m, m edges "u v", then s t. Output: true or false.',
      keyLines: [{ match: 'if (u == t) return true;', note: 'Stop as soon as the target is popped.' }],
      mistakes: ['Recursion depth issues on long chains (BFS avoids them)'],
      tests: [
        { in: '3 2\n0 1\n1 2\n0 2', out: 'true' },
        { in: '6 5\n0 1\n0 2\n3 5\n5 4\n4 3\n0 5', out: 'false' },
        { in: '1 0\n0 0', out: 'true' },
        { in: '4 1\n2 3\n3 2', out: 'true' },
      ],
      viz: 'graph-algos',
    },
    {
      id: 'd21-star-center',
      day: 21,
      title: 'Find the Hub',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['graph-dfs'],
      objective: 'Use degrees to reason about structure.',
      statement: 'An undirected star graph has n nodes labelled 1..n and n − 1 edges, all touching one centre node. Print the centre.',
      constraints: ['3 ≤ n ≤ 10⁵'],
      examples: [{ input: 'edges 1-2, 2-3, 4-2', output: '2' }],
      edgeCases: ['Centre appears second in some edges'],
      cues: ['The centre is the only node in every edge → check the first two edges'],
      hints: ['The centre must appear in both of the first two edges.'],
      approach: 'Compare the endpoints of edges 0 and 1.',
      correctness: 'Exactly one node is shared by all edges, so it is shared by the first two.',
      complexity: { time: 'O(1) after reading', space: 'O(1)', why: 'Only two edges inspected.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int center(const vector<pair<int, int>>& e) {
    auto [a, b] = e[0];
    auto [c, d] = e[1];
    return (a == c || a == d) ? a : b;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> e(n - 1);
    for (auto& [u, v] : e) cin >> u >> v;
    cout << center(e) << "\n";
    return 0;
}`,
      io: 'Input: n, then n − 1 edges. Output: the centre.',
      keyLines: [{ match: 'return (a == c || a == d) ? a : b;', note: 'If a is not shared, b must be.' }],
      mistakes: ['Building full degree counts (fine, but unnecessary)'],
      tests: [
        { in: '4\n1 2\n2 3\n4 2', out: '2' },
        { in: '5\n1 2\n5 1\n1 3\n1 4', out: '1' },
        { in: '3\n3 1\n2 3', out: '3' },
        { in: '3\n1 2\n2 3', out: '2' },
      ],
    },
    {
      id: 'd21-components',
      day: 21,
      title: 'Count Friend Groups',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-dfs'],
      objective: 'Count components with repeated traversals.',
      statement: 'Print the number of connected components and the size of the largest one.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵'],
      examples: [{ input: 'n=5, edges 0-1 1-2 3-4', output: '2 3' }],
      edgeCases: ['No edges → n components of size 1', 'Duplicate edges'],
      cues: ['"How many groups" → start a traversal from each unvisited node'],
      hints: ['Iterative DFS with a stack avoids deep recursion.'],
      approach: 'Loop over nodes; each unvisited node starts a stack-based DFS counting its size.',
      correctness: 'Each traversal discovers exactly one component.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Each node and edge processed once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

pair<int, int> components(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<bool> seen(n, false);
    int count = 0, largest = 0;
    for (int s = 0; s < n; s++) {
        if (seen[s]) continue;
        count++;
        int size = 0;
        stack<int> st;
        st.push(s);
        seen[s] = true;
        while (!st.empty()) {
            int u = st.top();
            st.pop();
            size++;
            for (int v : adj[u])
                if (!seen[v]) {
                    seen[v] = true;
                    st.push(v);
                }
        }
        largest = max(largest, size);
    }
    return {count, largest};
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    auto [c, l] = components(n, e);
    cout << c << " " << l << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: count and largest size.',
      keyLines: [{ match: 'seen[v] = true;', note: 'Mark when pushing so each node is counted once.' }],
      mistakes: ['Counting a node twice by marking on pop'],
      tests: [
        { in: '5 3\n0 1\n1 2\n3 4', out: '2 3' },
        { in: '4 0', out: '4 1' },
        { in: '3 3\n0 1\n1 2\n2 0', out: '1 3' },
        { in: '6 2\n0 0\n4 5', out: '5 2' },
      ],
    },
    {
      id: 'd21-bfs-distances',
      day: 21,
      title: 'Hops From Headquarters',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-bfs'],
      objective: 'Compute single-source unweighted distances.',
      statement: 'Print the BFS distance (number of edges) from node s to every node, or -1 if unreachable.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵'],
      examples: [{ input: 'n=4, edges 0-1 1-2, s=0', output: '0 1 2 -1' }],
      edgeCases: ['Isolated nodes', 'Multiple shortest paths'],
      cues: ['Uniform edge cost + distances → BFS'],
      hints: ['dist[s] = 0; dist[v] = dist[u] + 1 on discovery.'],
      approach: 'Standard BFS.',
      correctness: 'Nodes leave the queue in non-decreasing distance order.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'BFS.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<int> bfs(int n, const vector<pair<int, int>>& edges, int s) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<int> dist(n, -1);
    queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u])
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
    }
    return dist;
}`,
      main: cpp`
int main() {
    int n, m, s;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    cin >> s;
    vector<int> d = bfs(n, e, s);
    for (int i = 0; i < n; i++) cout << d[i] << (i + 1 < n ? " " : "\n");
    return 0;
}`,
      io: 'Input: n m, m edges, then s. Output: n distances.',
      keyLines: [{ match: 'if (dist[v] == -1) {', note: 'dist doubles as the visited array.' }],
      mistakes: ['Using DFS (does not give shortest distances)'],
      tests: [
        { in: '4 2\n0 1\n1 2\n0', out: '0 1 2 -1' },
        { in: '5 5\n0 1\n0 2\n1 3\n2 3\n3 4\n4', out: '3 2 2 1 0' },
        { in: '1 0\n0', out: '0' },
        { in: '3 1\n1 2\n1', out: '-1 0 1' },
      ],
    },
    {
      id: 'd21-bipartite',
      day: 21,
      title: 'Two Rival Teams',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-bfs', 'graph-dfs'],
      objective: '2-colour a graph with BFS.',
      statement: 'Can the nodes be split into two teams so every edge connects different teams? Print `true` or `false`. The graph may be disconnected.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵'],
      examples: [{ input: 'n=4, edges 0-1 1-2 2-3 3-0', output: 'true' }],
      edgeCases: ['Odd cycle → false', 'Self-loop → false', 'Disconnected components'],
      cues: ['Two groups with edges only across → bipartite check by colouring'],
      hints: ['Colour the start 0; neighbours get the opposite colour.', 'A neighbour with the same colour means an odd cycle.', 'Repeat for every component.'],
      approach: 'BFS colouring from each uncoloured node.',
      correctness: 'A graph is bipartite iff it has no odd cycle iff BFS colouring never conflicts.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'BFS over all components.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

bool bipartite(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) {
                    color[v] = 1 - color[u];
                    q.push(v);
                } else if (color[v] == color[u]) {
                    return false;
                }
            }
        }
    }
    return true;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    cout << (bipartite(n, e) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: true or false.',
      keyLines: [{ match: 'color[v] = 1 - color[u];', note: 'Neighbours alternate colours.' }],
      mistakes: ['Checking only the component of node 0'],
      tests: [
        { in: '4 4\n0 1\n1 2\n2 3\n3 0', out: 'true' },
        { in: '3 3\n0 1\n1 2\n2 0', out: 'false' },
        { in: '5 2\n0 1\n3 4', out: 'true' },
        { in: '2 1\n1 1', out: 'false' },
      ],
    },
    {
      id: 'd21-undirected-cycle',
      day: 21,
      title: 'Is There a Loop of Roads?',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-dfs'],
      objective: 'Detect cycles in an undirected graph by tracking the parent.',
      statement: 'Print `true` if an undirected simple graph (no self-loops, no parallel edges) contains a cycle.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 10⁵'],
      examples: [{ input: 'n=4, edges 0-1 1-2 2-0 2-3', output: 'true' }],
      edgeCases: ['Forest → false', 'Disconnected graph with one cyclic component'],
      cues: ['Undirected cycle → a visited neighbour that is not the parent'],
      hints: ['Traverse with (node, parent).', 'Meeting an already visited node other than the parent closes a cycle.', 'Alternatively: a forest has exactly n − components edges.'],
      approach: 'Iterative DFS storing parents.',
      correctness: 'In a DFS of an undirected graph, any non-tree edge connects to an ancestor and closes a cycle.',
      complexity: { time: 'O(n + m)', space: 'O(n + m)', why: 'Single traversal.' },
      cpp: cpp`
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

bool hasCycle(int n, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    vector<int> parent(n, -2);  // -2 = unvisited
    for (int s = 0; s < n; s++) {
        if (parent[s] != -2) continue;
        parent[s] = -1;
        stack<int> st;
        st.push(s);
        while (!st.empty()) {
            int u = st.top();
            st.pop();
            for (int v : adj[u]) {
                if (parent[v] == -2) {
                    parent[v] = u;
                    st.push(v);
                } else if (v != parent[u]) {
                    return true;
                }
            }
        }
    }
    return false;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> e(m);
    for (auto& [u, v] : e) cin >> u >> v;
    cout << (hasCycle(n, e) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: true or false.',
      keyLines: [{ match: '} else if (v != parent[u]) {', note: 'Seeing the parent again is just the edge we came through.' }],
      mistakes: ['Treating the edge back to the parent as a cycle'],
      tests: [
        { in: '4 4\n0 1\n1 2\n2 0\n2 3', out: 'true' },
        { in: '4 3\n0 1\n1 2\n2 3', out: 'false' },
        { in: '5 4\n0 1\n2 3\n3 4\n4 2', out: 'true' },
        { in: '1 0', out: 'false' },
      ],
    },
    {
      id: 'd21-all-paths-dag',
      day: 21,
      title: 'Every Route Through a Pipeline',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-dfs', 'backtracking'],
      objective: 'Enumerate paths in a DAG with backtracking DFS.',
      statement: 'A directed acyclic graph has nodes 0..n−1 given as adjacency lists. Print every path from 0 to n − 1 (in DFS order following each list), then the count.',
      constraints: ['2 ≤ n ≤ 15'],
      examples: [{ input: 'adj: 0→[1,2], 1→[3], 2→[3], 3→[]', output: '0 1 3\n0 2 3\ncount 2' }],
      edgeCases: ['No path → only "count 0"'],
      cues: ['All paths, small DAG → DFS with a path vector (no visited set needed in a DAG)'],
      hints: ['Push the node, recurse into neighbours, pop.', 'Record when you reach n − 1.'],
      approach: 'Backtracking DFS.',
      correctness: 'A DAG has no cycles, so every recursion branch terminates and each path is generated once.',
      complexity: { time: 'O(2ⁿ · n) worst case', space: 'O(n)', why: 'The number of paths can be exponential.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

int paths = 0;

void dfs(int u, const vector<vector<int>>& adj, vector<int>& path) {
    path.push_back(u);
    if (u == (int)adj.size() - 1) {
        for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\n");
        paths++;
    } else {
        for (int v : adj[u]) dfs(v, adj, path);
    }
    path.pop_back();
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
    vector<int> path;
    dfs(0, adj, path);
    cout << "count " << paths << "\n";
    return 0;
}`,
      io: 'Input: n, then for each node "k v1 … vk". Output: paths, then the count.',
      keyLines: [{ match: 'path.pop_back();', note: 'Undo so sibling branches start from the right prefix.' }],
      mistakes: ['Adding a visited set (would block paths that share nodes)'],
      tests: [
        { in: '4\n2 1 2\n1 3\n1 3\n0', out: '0 1 3\n0 2 3\ncount 2' },
        { in: '2\n1 1\n0', out: '0 1\ncount 1' },
        { in: '3\n1 1\n0\n0', out: 'count 0' },
        { in: '5\n3 4 3 1\n3 3 2 4\n1 3\n1 4\n0', out: '0 4\n0 3 4\n0 1 3 4\n0 1 2 3 4\n0 1 4\ncount 5' },
      ],
    },
    {
      id: 'd21-min-height-trees',
      day: 21,
      title: 'Best Root for a Network Tree',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['graph-bfs', 'queue-level-traversal'],
      objective: 'Peel leaves layer by layer to find the tree centre(s).',
      statement: 'A tree has n nodes. Choosing a root gives a height. Print all roots that minimise the height, ascending.',
      constraints: ['1 ≤ n ≤ 2·10⁴', 'n − 1 edges forming a tree'],
      examples: [{ input: 'n=6, edges 3-0 3-1 3-2 3-4 5-4', output: '3 4' }],
      edgeCases: ['n = 1 → 0', 'n = 2 → both nodes'],
      cues: ['Minimum-height roots are the centre(s) of the longest path → remove leaves repeatedly'],
      hints: ['BFS from every node is O(n²).', 'Repeatedly remove all current leaves (degree 1).', 'The last 1 or 2 remaining nodes are the answer.'],
      brute: 'BFS from every node: O(n²).',
      approach: 'Topological trimming of leaves by layers.',
      correctness: 'Removing all leaves shortens every longest path by 2 at both ends, so the centres are preserved until ≤ 2 nodes remain.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each node is removed once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<int> centres(int n, const vector<pair<int, int>>& edges) {
    if (n == 1) return {0};
    vector<vector<int>> adj(n);
    vector<int> deg(n, 0);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        adj[v].push_back(u);
        deg[u]++;
        deg[v]++;
    }
    vector<int> leaves;
    for (int i = 0; i < n; i++)
        if (deg[i] == 1) leaves.push_back(i);
    int remaining = n;
    while (remaining > 2) {
        remaining -= leaves.size();
        vector<int> next;
        for (int leaf : leaves)
            for (int v : adj[leaf])
                if (--deg[v] == 1) next.push_back(v);
        leaves = next;
    }
    sort(leaves.begin(), leaves.end());
    return leaves;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> e(n - 1);
    for (auto& [u, v] : e) cin >> u >> v;
    vector<int> c = centres(n, e);
    for (size_t i = 0; i < c.size(); i++) cout << c[i] << (i + 1 < c.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n, then n − 1 edges. Output: optimal roots ascending.',
      keyLines: [{ match: 'if (--deg[v] == 1) next.push_back(v);', note: 'A neighbour becomes a leaf of the next layer.' }],
      mistakes: ['Stopping at remaining == 1 only (two centres are possible)'],
      tests: [
        { in: '6\n3 0\n3 1\n3 2\n3 4\n5 4', out: '3 4' },
        { in: '4\n1 0\n1 2\n1 3', out: '1' },
        { in: '1', out: '0' },
        { in: '2\n0 1', out: '0 1' },
      ],
    },
  ],
};

export default day;
