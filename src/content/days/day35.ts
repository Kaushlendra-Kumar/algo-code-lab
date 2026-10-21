import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 35,
    title: 'Minimum Spanning Trees: Kruskal and Prim',
    zone: 'graphs',
    objectives: [
      'Define a spanning tree and its total weight',
      'Build an MST with Kruskal (sorted edges + union-find)',
      'Build an MST with Prim (grow one tree with a min-heap)',
      'Explain the cut property that makes both greedy algorithms correct',
    ],
    prerequisites: ['Day 24: union-find', 'Day 25: Dijkstra with a heap'],
    lesson: [
      {
        heading: 'Spanning trees',
        body: 'A spanning tree of a connected undirected graph with V vertices uses exactly V − 1 edges, connects every vertex and has no cycle. The **minimum** spanning tree (MST) minimises the total edge weight — e.g. the cheapest way to cable every building.',
      },
      {
        heading: 'The cut property',
        body: 'Split the vertices into two groups. The lightest edge crossing between the groups belongs to some MST. Both Kruskal and Prim repeatedly add such a "lightest crossing edge", which is why their greedy choices are safe.',
      },
      {
        heading: 'Kruskal',
        body: 'Sort all edges by weight. Walk through them; add an edge if its endpoints are in different components (union-find `unite` returns true), skip it otherwise because it would form a cycle. Stop after V − 1 edges. O(E log E).',
      },
      {
        heading: 'Prim',
        body: 'Start from any vertex. Keep a min-heap of edges leaving the current tree; pop the lightest, skip it if its far end is already in the tree, otherwise add the vertex and push its edges. O(E log V). Prim is handy for dense graphs or implicit graphs (all pairs of points).',
      },
      {
        heading: 'Not a shortest-path tree',
        body: 'An MST minimises the *sum* of chosen edges, not the distance from a source. The path between two vertices inside an MST can be much longer than their shortest path. Do not use Dijkstra when an MST is asked, or vice versa.',
      },
    ],
    recognition: [
      '"Connect all … with minimum total cost" → MST.',
      'Points with pairwise distances (complete graph) → Prim in O(V²) or with a heap.',
      '"Minimum cost with an option to build at a node" → add a virtual node, then MST.',
    ],
    patterns: ['minimum-spanning-tree', 'union-find', 'heap-greedy'],
    visualizations: ['graph-algos'],
    exampleA: {
      id: 'd35-A',
      title: "Kruskal's algorithm",
      goal: 'Find the MST of a weighted undirected graph with 6 vertices.',
      input: 'edges (u v w): 0-1 4, 0-2 4, 1-2 2, 2-3 3, 2-5 2, 2-4 4, 3-4 3, 5-4 3',
      output: 'take 1-2 (2)\ntake 2-5 (2)\ntake 2-3 (3)\ntake 3-4 (3)\nskip 5-4 (3)\ntake 0-1 (4)\nMST weight = 14',
      idea: 'Process edges from lightest to heaviest. Union-find tells in near-constant time whether an edge would close a cycle.',
      code: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

struct DSU {
    vector<int> parent, size;
    explicit DSU(int n) : parent(n), size(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;  // already connected: edge would form a cycle
        if (size[a] < size[b]) swap(a, b);
        parent[b] = a;
        size[a] += size[b];
        return true;
    }
};

int main() {
    int n = 6;
    struct Edge {
        int u, v, w;
    };
    vector<Edge> edges = {{0, 1, 4}, {0, 2, 4}, {1, 2, 2}, {2, 3, 3}, {2, 5, 2}, {2, 4, 4}, {3, 4, 3}, {5, 4, 3}};
    stable_sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) { return a.w < b.w; });  //@gap
    DSU dsu(n);
    int total = 0, used = 0;
    for (auto& e : edges) {
        if (used == n - 1) break;  // tree complete
        if (dsu.unite(e.u, e.v)) {  //@gap
            total += e.w;
            used++;
            cout << "take " << e.u << "-" << e.v << " (" << e.w << ")\n";
        } else {
            cout << "skip " << e.u << "-" << e.v << " (" << e.w << ")\n";
        }
    }
    cout << "MST weight = " << total << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'stable_sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) { return a.w < b.w; });', note: 'Lightest edges first (stable keeps input order on ties, so the output is predictable).' },
        { match: 'if (a == b) return false;  // already connected: edge would form a cycle', note: 'The cycle test in O(α(n)).' },
        { match: 'if (used == n - 1) break;  // tree complete', note: 'A spanning tree has exactly V − 1 edges.' },
        { match: 'if (dsu.unite(e.u, e.v)) {', note: 'Merge components and accept the edge in one call.' },
      ],
      dryRun: {
        columns: ['edge (sorted)', 'components before', 'action'],
        rows: [
          ['1-2 (2)', '{0} {1} {2} {3} {4} {5}', 'take'],
          ['2-5 (2)', '{0} {1,2} {3} {4} {5}', 'take'],
          ['2-3 (3)', '{0} {1,2,5} {3} {4}', 'take'],
          ['3-4 (3)', '{0} {1,2,3,5} {4}', 'take'],
          ['5-4 (3)', '{0} {1,2,3,4,5}', 'skip (cycle)'],
          ['0-1 (4)', '{0} {1,2,3,4,5}', 'take → 5 edges, done'],
        ],
      },
      complexity: { time: 'O(E log E)', space: 'O(V + E)', why: 'Sorting dominates; union-find operations are almost O(1).' },
      edgeCases: ['Disconnected graph → fewer than V − 1 edges taken (no spanning tree)', 'Equal weights → several MSTs with the same total'],
      mistakes: ['Checking cycles with DFS for each edge (O(V · E))', 'Forgetting to stop or to detect disconnection'],
      tryIt: 'Remove edge 0-1 and 0-2: what does the program report, and how would you detect the problem?',
      bug: {
        find: 'if (a == b) return false;  // already connected: edge would form a cycle',
        replace: 'if (a == b) return true;  // already connected: edge would form a cycle',
        symptom: 'The program prints "take 5-4 (3)" and an MST weight of 13 — a cycle was accepted and vertex 0 is left out.',
        explanation: 'unite must report failure when both endpoints are already in one component. Accepting that edge creates a cycle and uses up one of the V − 1 edge slots.',
      },
    },
    exampleB: {
      id: 'd35-B',
      kind: 'variant',
      title: "Prim's algorithm with a min-heap",
      goal: 'Grow an MST of the same graph from vertex 0.',
      input: 'same 6-vertex graph, start at 0',
      output: 'add 0 via weight 0\nadd 1 via weight 4\nadd 2 via weight 2\nadd 5 via weight 2\nadd 3 via weight 3\nadd 4 via weight 3\nMST weight = 14',
      idea: 'The heap holds (weight, vertex) for edges leaving the tree. The lightest one whose vertex is new is a lightest crossing edge — the cut property says it is safe.',
      code: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n = 6;
    vector<vector<pair<int, int>>> adj(n);  // (neighbour, weight)
    auto addEdge = [&](int u, int v, int w) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    };
    addEdge(0, 1, 4);
    addEdge(0, 2, 4);
    addEdge(1, 2, 2);
    addEdge(2, 3, 3);
    addEdge(2, 5, 2);
    addEdge(2, 4, 4);
    addEdge(3, 4, 3);
    addEdge(5, 4, 3);

    vector<bool> inTree(n, false);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;  // (weight, vertex)
    pq.push({0, 0});
    int total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (inTree[u]) continue;  // stale entry: u was added via a lighter edge
        inTree[u] = true;
        total += w;
        cout << "add " << u << " via weight " << w << "\n";
        for (auto [v, wv] : adj[u])
            if (!inTree[v]) pq.push({wv, v});
    }
    cout << "MST weight = " << total << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;  // (weight, vertex)', note: 'Min-heap ordered by edge weight.' },
        { match: 'if (inTree[u]) continue;  // stale entry: u was added via a lighter edge', note: 'Lazy deletion, like Dijkstra.' },
        { match: 'if (!inTree[v]) pq.push({wv, v});', note: 'Push the edge weight only — not a path distance (that would be Dijkstra).' },
      ],
      complexity: { time: 'O(E log E)', space: 'O(V + E)', why: 'Each edge is pushed at most twice.' },
      edgeCases: ['Disconnected graph → some vertices never added', 'Parallel edges'],
      mistakes: ['Pushing w + dist[u] (turns Prim into Dijkstra)', 'Marking vertices when pushing instead of when popping'],
      tryIt: 'Replace pq.push({wv, v}) with pq.push({w + wv, v}) and compare the total — you just built a shortest-path tree.',
    },
    complexityNotes: 'Kruskal: O(E log E) for sorting. Prim with a heap: O(E log V); with an adjacency matrix and no heap: O(V²), best for dense graphs such as all pairs of points.',
    quiz: [
      {
        prompt: 'How many edges does a spanning tree of a connected graph with V vertices have?',
        options: ['V', 'V − 1', 'E', 'V + 1'],
        answer: 1,
        explanation: 'A tree on V vertices always has V − 1 edges.',
      },
      {
        prompt: 'In Kruskal, an edge is skipped when…',
        options: ['It is the heaviest so far', 'Both endpoints are already in the same component', 'It touches a leaf', 'Its weight is odd'],
        answer: 1,
        explanation: 'It would form a cycle.',
      },
      {
        prompt: 'Is the MST path between two vertices always a shortest path?',
        options: ['Yes', 'No', 'Only with positive weights', 'Only in trees'],
        answer: 1,
        explanation: 'MSTs minimise total weight, not individual distances.',
      },
    ],
    recap: 'Kruskal sorts edges and adds those that join two components (union-find). Prim grows a single tree with a min-heap of crossing edges. Both are justified by the cut property. An MST is not a shortest-path tree.',
    nextPrep: 'Tomorrow: BFS variations — 0-1 BFS and multi-source BFS.',
  },
  questions: [
    {
      id: 'd35-cables-needed',
      day: 35,
      title: 'Spare Cables for the Network',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['union-find', 'minimum-spanning-tree'],
      objective: 'Count components and redundant edges with DSU.',
      statement: 'n computers and some cables. You may unplug any cable and reconnect it between two other computers. Print the minimum moves to connect everything, or -1 if there are not enough cables.',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ cables ≤ 10⁵'],
      examples: [{ input: 'n=4, cables 0-1 0-2 1-2', output: '1' }],
      edgeCases: ['cables < n − 1 → -1'],
      cues: ['Connect components using spare edges'],
      hints: ['You need at least n − 1 cables.', 'The answer is components − 1.'],
      approach: 'Union-find to count components.',
      correctness: 'With ≥ n − 1 cables, there are always enough redundant cables to join the components.',
      complexity: { time: 'O((n + m) α(n))', space: 'O(n)', why: 'DSU.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int find(vector<int>& p, int x) { return p[x] == x ? x : p[x] = find(p, p[x]); }

int movesToConnect(int n, const vector<pair<int, int>>& cables) {
    if ((int)cables.size() < n - 1) return -1;
    vector<int> p(n);
    iota(p.begin(), p.end(), 0);
    int components = n;
    for (auto& [a, b] : cables) {
        int ra = find(p, a), rb = find(p, b);
        if (ra != rb) {
            p[ra] = rb;
            components--;
        }
    }
    return components - 1;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> c(m);
    for (auto& e : c) cin >> e.first >> e.second;
    cout << movesToConnect(n, c) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m cables. Output: moves or -1.',
      keyLines: [{ match: 'if ((int)cables.size() < n - 1) return -1;', note: 'A connected graph needs at least n − 1 edges.' }],
      mistakes: ['Counting redundant cables but forgetting the n − 1 check'],
      tests: [
        { in: '4 3\n0 1\n0 2\n1 2', out: '1' },
        { in: '6 5\n0 1\n0 2\n0 3\n1 2\n1 3', out: '2' },
        { in: '6 4\n0 1\n0 2\n0 3\n1 2', out: '-1' },
        { in: '1 0', out: '0' },
      ],
    },
    {
      id: 'd35-kruskal',
      day: 35,
      title: 'Cheapest Fibre Layout',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'union-find'],
      objective: 'Kruskal with disconnection detection.',
      statement: 'Print the total weight of a minimum spanning tree, or -1 if the graph is disconnected.',
      constraints: ['1 ≤ V ≤ 10⁵', '0 ≤ E ≤ 2·10⁵', '1 ≤ w ≤ 10⁶'],
      examples: [{ input: 'V=4, edges 0-1 1, 1-2 2, 0-2 3, 2-3 4', output: '7' }],
      edgeCases: ['V = 1 → 0', 'Disconnected → -1'],
      cues: ['Connect all vertices, minimum total'],
      hints: ['Sort edges; unite; count accepted edges.'],
      approach: 'Kruskal.',
      correctness: 'Cut property.',
      complexity: { time: 'O(E log E)', space: 'O(V + E)', why: 'Sort + DSU.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int findRoot(vector<int>& p, int x) {
    while (p[x] != x) x = p[x] = p[p[x]];  // path halving
    return x;
}

long long mstWeight(int V, vector<array<int, 3>> edges) {  // {w, u, v}
    sort(edges.begin(), edges.end());
    vector<int> p(V);
    iota(p.begin(), p.end(), 0);
    long long total = 0;
    int used = 0;
    for (auto& [w, u, v] : edges) {
        int a = findRoot(p, u), b = findRoot(p, v);
        if (a == b) continue;
        p[a] = b;
        total += w;
        used++;
    }
    return used == V - 1 ? total : -1;
}`,
      main: cpp`
int main() {
    int V, E;
    cin >> V >> E;
    vector<array<int, 3>> edges(E);
    for (auto& e : edges) cin >> e[1] >> e[2] >> e[0];
    cout << mstWeight(V, edges) << "\n";
    return 0;
}`,
      io: 'Input: V E, then E lines "u v w". Output: MST weight or -1.',
      keyLines: [{ match: 'return used == V - 1 ? total : -1;', note: 'Fewer accepted edges means the graph is disconnected.' }],
      mistakes: ['Returning a partial total for disconnected graphs'],
      tests: [
        { in: '4 4\n0 1 1\n1 2 2\n0 2 3\n2 3 4', out: '7' },
        { in: '3 1\n0 1 5', out: '-1' },
        { in: '1 0', out: '0' },
        { in: '6 8\n0 1 4\n0 2 4\n1 2 2\n2 3 3\n2 5 2\n2 4 4\n3 4 3\n5 4 3', out: '14' },
      ],
      viz: 'graph-algos',
    },
    {
      id: 'd35-prim',
      day: 35,
      title: 'Growing the Power Grid',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'heap-greedy'],
      objective: 'Prim with lazy deletion.',
      statement: 'Print the total weight of an MST of a connected graph using Prim\'s algorithm from vertex 0.',
      constraints: ['1 ≤ V ≤ 10⁵', 'Graph is connected'],
      examples: [{ input: 'V=3, edges 0-1 5, 1-2 1, 0-2 2', output: '3' }],
      edgeCases: ['Parallel edges with different weights'],
      cues: ['MST on an adjacency list'],
      hints: ['Heap of (weight, vertex); skip vertices already in the tree.'],
      approach: 'Prim.',
      correctness: 'Each popped fresh vertex is joined by a lightest crossing edge.',
      complexity: { time: 'O(E log E)', space: 'O(V + E)', why: 'Heap operations per edge.' },
      cpp: cpp`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

long long prim(int V, const vector<vector<pair<int, int>>>& adj) {
    vector<bool> in(V, false);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    pq.push({0, 0});
    long long total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (in[u]) continue;
        in[u] = true;
        total += w;
        for (auto [v, wv] : adj[u])
            if (!in[v]) pq.push({wv, v});
    }
    return total;
}`,
      main: cpp`
int main() {
    int V, E;
    cin >> V >> E;
    vector<vector<pair<int, int>>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    cout << prim(V, adj) << "\n";
    return 0;
}`,
      io: 'Input: V E, then E edges. Output: MST weight.',
      keyLines: [{ match: 'if (in[u]) continue;', note: 'Ignore heap entries for vertices already connected.' }],
      mistakes: ['Pushing cumulative distances'],
      tests: [
        { in: '3 3\n0 1 5\n1 2 1\n0 2 2', out: '3' },
        { in: '2 2\n0 1 7\n0 1 3', out: '3' },
        { in: '1 0', out: '0' },
        { in: '5 7\n0 1 2\n0 3 6\n1 2 3\n1 3 8\n1 4 5\n2 4 7\n3 4 9', out: '16' },
      ],
    },
    {
      id: 'd35-connect-points',
      day: 35,
      title: 'Wiring Street Lamps',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree'],
      objective: 'Dense-graph Prim in O(V²).',
      statement: 'Connect all points; the cost of wiring two points is their Manhattan distance. Print the minimum total cost.',
      constraints: ['1 ≤ n ≤ 1000', '|x|, |y| ≤ 10⁶'],
      examples: [{ input: '(0,0) (2,2) (3,10) (5,2) (7,0)', output: '20' }],
      edgeCases: ['Single point → 0', 'Duplicate points'],
      cues: ['All pairs are candidate edges → dense graph'],
      hints: ['Keep dist[v] = cheapest edge from the tree to v; pick the minimum each round.'],
      approach: 'Array-based Prim, no heap.',
      correctness: 'Same as Prim; scanning dist is the extract-min.',
      complexity: { time: 'O(n²)', space: 'O(n)', why: 'n rounds × n scan; better than O(n² log n) with all edges.' },
      cpp: cpp`
#include <climits>
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;

long long connectPoints(const vector<pair<int, int>>& p) {
    int n = p.size();
    vector<long long> dist(n, LLONG_MAX);
    vector<bool> in(n, false);
    dist[0] = 0;
    long long total = 0;
    for (int round = 0; round < n; round++) {
        int u = -1;
        for (int v = 0; v < n; v++)
            if (!in[v] && (u == -1 || dist[v] < dist[u])) u = v;
        in[u] = true;
        total += dist[u];
        for (int v = 0; v < n; v++) {
            long long d = abs(p[u].first - p[v].first) + abs(p[u].second - p[v].second);
            if (!in[v] && d < dist[v]) dist[v] = d;
        }
    }
    return total;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> p(n);
    for (auto& q : p) cin >> q.first >> q.second;
    cout << connectPoints(p) << "\n";
    return 0;
}`,
      io: 'Input: n, then n points. Output: minimum cost.',
      keyLines: [{ match: 'if (!in[v] && (u == -1 || dist[v] < dist[u])) u = v;', note: 'Linear extract-min — fine for dense graphs.' }],
      mistakes: ['Materialising all n² edges and sorting them (slower, more memory)'],
      tests: [
        { in: '5\n0 0\n2 2\n3 10\n5 2\n7 0', out: '20' },
        { in: '3\n3 12\n-2 5\n-4 1', out: '18' },
        { in: '1\n0 0', out: '0' },
        { in: '2\n-1000000 -1000000\n1000000 1000000', out: '4000000' },
      ],
    },
    {
      id: 'd35-connecting-cities',
      day: 35,
      title: 'Linking Villages by Road',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'union-find'],
      objective: 'Kruskal on 1-indexed input with impossibility.',
      statement: 'Villages are numbered 1..n. Given possible roads with costs, print the minimum cost to connect all villages, or -1.',
      constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ roads ≤ 10⁴'],
      examples: [{ input: 'n=3, roads 1-2 5, 1-3 6, 2-3 1', output: '6' }],
      edgeCases: ['Not enough roads'],
      cues: ['Connect all at minimum total cost'],
      hints: ['Convert to 0-based or size the DSU n + 1.'],
      approach: 'Kruskal.',
      correctness: 'Cut property.',
      complexity: { time: 'O(m log m)', space: 'O(n)', why: 'Sort + DSU.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int root(vector<int>& p, int x) { return p[x] == x ? x : p[x] = root(p, p[x]); }

int minimumCost(int n, vector<array<int, 3>> roads) {  // {cost, a, b}
    sort(roads.begin(), roads.end());
    vector<int> p(n + 1);
    iota(p.begin(), p.end(), 0);
    int cost = 0, joined = 0;
    for (auto& [c, a, b] : roads) {
        int ra = root(p, a), rb = root(p, b);
        if (ra == rb) continue;
        p[ra] = rb;
        cost += c;
        if (++joined == n - 1) break;
    }
    return joined == n - 1 ? cost : -1;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<array<int, 3>> roads(m);
    for (auto& r : roads) cin >> r[1] >> r[2] >> r[0];
    cout << minimumCost(n, roads) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m lines "a b cost". Output: cost or -1.',
      keyLines: [{ match: 'vector<int> p(n + 1);', note: 'Index 0 unused because villages are 1-based.' }],
      mistakes: ['Out-of-bounds with 1-based ids'],
      tests: [
        { in: '3 3\n1 2 5\n1 3 6\n2 3 1', out: '6' },
        { in: '4 2\n1 2 3\n3 4 4', out: '-1' },
        { in: '1 0', out: '0' },
        { in: '4 5\n1 2 1\n2 3 1\n3 4 1\n1 4 1\n1 3 5', out: '3' },
      ],
    },
    {
      id: 'd35-max-spanning',
      day: 35,
      title: 'Strongest Backbone',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'union-find'],
      objective: 'Maximum spanning tree by reversing the order.',
      statement: 'Edges have bandwidths. Choose a spanning tree with the maximum total bandwidth and print it (the graph is connected).',
      constraints: ['1 ≤ V ≤ 10⁴', 'V − 1 ≤ E ≤ 10⁵'],
      examples: [{ input: 'V=3, edges 0-1 1, 1-2 2, 0-2 3', output: '5' }],
      edgeCases: ['All equal weights'],
      cues: ['"maximum" spanning tree'],
      hints: ['Sort edges descending; same Kruskal.'],
      approach: 'Kruskal with reversed order.',
      correctness: 'Negating weights turns a maximum spanning tree into a minimum one.',
      complexity: { time: 'O(E log E)', space: 'O(V)', why: 'Sort + DSU.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <functional>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int leader(vector<int>& p, int x) { return p[x] == x ? x : p[x] = leader(p, p[x]); }

long long maxSpanning(int V, vector<array<int, 3>> edges) {  // {w, u, v}
    sort(edges.begin(), edges.end(), greater<array<int, 3>>());
    vector<int> p(V);
    iota(p.begin(), p.end(), 0);
    long long total = 0;
    for (auto& [w, u, v] : edges) {
        int a = leader(p, u), b = leader(p, v);
        if (a != b) {
            p[a] = b;
            total += w;
        }
    }
    return total;
}`,
      main: cpp`
int main() {
    int V, E;
    cin >> V >> E;
    vector<array<int, 3>> e(E);
    for (auto& x : e) cin >> x[1] >> x[2] >> x[0];
    cout << maxSpanning(V, e) << "\n";
    return 0;
}`,
      io: 'Input: V E, then E edges "u v w". Output: maximum total.',
      keyLines: [{ match: 'sort(edges.begin(), edges.end(), greater<array<int, 3>>());', note: 'Heaviest first — the only change from Kruskal.' }],
      mistakes: ['Trying to "maximise" with Prim but a min-heap'],
      tests: [
        { in: '3 3\n0 1 1\n1 2 2\n0 2 3', out: '5' },
        { in: '2 1\n0 1 9', out: '9' },
        { in: '4 5\n0 1 4\n1 2 4\n2 3 4\n3 0 4\n0 2 1', out: '12' },
        { in: '1 0', out: '0' },
      ],
    },
    {
      id: 'd35-water-distribution',
      day: 35,
      title: 'Wells or Pipes',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'state-space-modeling'],
      objective: 'Model "build here" options as edges to a virtual node.',
      statement: 'Each house i (1..n) can dig its own well for well[i] or be connected by pipes (a, b, cost). Print the minimum total cost so every house has water.',
      constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ pipes ≤ 10⁴'],
      examples: [{ input: 'wells 1 2 2, pipes 1-2 1, 2-3 1', output: '3' }],
      edgeCases: ['No pipes → sum of wells'],
      cues: ['Node cost + edge costs → virtual source node'],
      hints: ['Add node 0 = "water source"; well[i] becomes edge 0–i.', 'Then the answer is the MST of n + 1 nodes.'],
      approach: 'Virtual node + Kruskal.',
      correctness: 'Every valid plan is a spanning tree of the extended graph (each component has exactly one well connection) and vice versa.',
      complexity: { time: 'O((n + m) log(n + m))', space: 'O(n + m)', why: 'Kruskal on n + m edges.' },
      cpp: cpp`
#include <algorithm>
#include <array>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int head(vector<int>& p, int x) { return p[x] == x ? x : p[x] = head(p, p[x]); }

long long supplyWater(int n, const vector<int>& well, vector<array<int, 3>> pipes) {  // pipes {cost, a, b}
    for (int i = 1; i <= n; i++) pipes.push_back({well[i - 1], 0, i});  // virtual source 0
    sort(pipes.begin(), pipes.end());
    vector<int> p(n + 1);
    iota(p.begin(), p.end(), 0);
    long long total = 0;
    for (auto& [c, a, b] : pipes) {
        int ra = head(p, a), rb = head(p, b);
        if (ra != rb) {
            p[ra] = rb;
            total += c;
        }
    }
    return total;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<int> well(n);
    for (auto& w : well) cin >> w;
    vector<array<int, 3>> pipes(m);
    for (auto& x : pipes) cin >> x[1] >> x[2] >> x[0];
    cout << supplyWater(n, well, pipes) << "\n";
    return 0;
}`,
      io: 'Input: n m, n well costs, then m pipes "a b cost". Output: minimum cost.',
      keyLines: [{ match: 'for (int i = 1; i <= n; i++) pipes.push_back({well[i - 1], 0, i});  // virtual source 0', note: 'Digging a well = connecting to the source.' }],
      mistakes: ['Choosing wells greedily per component'],
      tests: [
        { in: '3 2\n1 2 2\n1 2 1\n2 3 1', out: '3' },
        { in: '2 1\n1 1\n1 2 1', out: '2' },
        { in: '2 0\n5 7', out: '12' },
        { in: '4 3\n10 10 10 1\n1 2 2\n2 3 2\n3 4 2', out: '7' },
      ],
    },
    {
      id: 'd35-critical-edges',
      day: 35,
      title: 'Indispensable Links',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['minimum-spanning-tree', 'union-find', 'brute-to-optimal'],
      objective: 'Classify edges by re-running Kruskal with constraints.',
      statement: 'For a connected weighted graph, an edge is critical if removing it increases the MST weight (or disconnects the graph). Print the indices (0-based, input order) of critical edges in ascending order, or "-" if none.',
      constraints: ['2 ≤ V ≤ 100', '1 ≤ E ≤ 200'],
      examples: [{ input: 'V=5, edges 0-1 1, 1-2 1, 2-3 2, 0-3 2, 0-4 3, 3-4 3, 1-4 6', output: '0 1' }],
      edgeCases: ['A bridge is always critical', 'Equal weights make edges replaceable'],
      cues: ['Small E, "is this edge necessary" → rerun MST without it'],
      hints: ['Compute the base MST weight.', 'For each edge, run Kruskal skipping it; compare.'],
      brute: 'This is the brute-force approach; O(E² α(V)) is fine for E ≤ 200.',
      approach: 'Kruskal with one excluded edge per run.',
      correctness: 'If the MST weight without e is larger (or no spanning tree exists), every MST must contain e.',
      complexity: { time: 'O(E · E α(V))', space: 'O(V + E)', why: 'One Kruskal run per edge on pre-sorted edges.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

struct E {
    int u, v, w, id;
};

int top(vector<int>& p, int x) { return p[x] == x ? x : p[x] = top(p, p[x]); }

long long mstWithout(int V, const vector<E>& sorted, int skip) {
    vector<int> p(V);
    iota(p.begin(), p.end(), 0);
    long long total = 0;
    int used = 0;
    for (auto& e : sorted) {
        if (e.id == skip) continue;
        int a = top(p, e.u), b = top(p, e.v);
        if (a == b) continue;
        p[a] = b;
        total += e.w;
        used++;
    }
    return used == V - 1 ? total : LLONG_MAX;
}

vector<int> criticalEdges(int V, vector<E> edges) {
    sort(edges.begin(), edges.end(), [](const E& a, const E& b) { return a.w < b.w; });
    long long base = mstWithout(V, edges, -1);
    vector<int> res;
    for (auto& e : edges)
        if (mstWithout(V, edges, e.id) > base) res.push_back(e.id);
    sort(res.begin(), res.end());
    return res;
}`,
      main: cpp`
int main() {
    int V, m;
    cin >> V >> m;
    vector<E> edges(m);
    for (int i = 0; i < m; i++) {
        cin >> edges[i].u >> edges[i].v >> edges[i].w;
        edges[i].id = i;
    }
    auto res = criticalEdges(V, edges);
    if (res.empty()) cout << "-";
    for (size_t i = 0; i < res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << "\n";
    return 0;
}`,
      io: 'Input: V E, then E lines "u v w". Output: critical edge indices or "-".',
      keyLines: [{ match: 'if (mstWithout(V, edges, e.id) > base) res.push_back(e.id);', note: 'Removing it hurts → it is in every MST.' }],
      mistakes: ['Treating every MST edge as critical (equal-weight alternatives may exist)'],
      tests: [
        { in: '5 7\n0 1 1\n1 2 1\n2 3 2\n0 3 2\n0 4 3\n3 4 3\n1 4 6', out: '0 1' },
        { in: '4 4\n0 1 1\n1 2 1\n2 3 1\n0 3 1', out: '-' },
        { in: '2 1\n0 1 5', out: '0' },
        { in: '3 3\n0 1 1\n1 2 2\n0 2 3', out: '0 1' },
      ],
    },
  ],
};

export default day;
