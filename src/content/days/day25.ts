import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 25,
    title: 'Dijkstra and Weighted Shortest Paths',
    zone: 'graphs',
    objectives: [
      'Run Dijkstra with std::priority_queue and lazy deletion of stale entries',
      'Explain why Dijkstra requires non-negative weights',
      'Reconstruct shortest paths with a parent array',
      'Choose between BFS, Dijkstra and other algorithms based on edge weights',
    ],
    prerequisites: ['Day 15: priority queues', 'Day 21: BFS and graph representation'],
    lesson: [
      {
        heading: 'From BFS to Dijkstra',
        body: 'BFS processes nodes in order of the **number of edges**. With weights, process nodes in order of **total distance** instead: always expand the unsettled node with the smallest tentative distance. A min-priority-queue provides it in O(log V).',
      },
      {
        heading: 'Relaxation',
        body: 'For edge u → v with weight w: if `dist[u] + w < dist[v]`, improve `dist[v]` and push `(dist[v], v)`. The same node can be pushed several times; when a popped entry has `d > dist[u]` it is **stale** and skipped. This "lazy deletion" avoids a decrease-key operation.',
      },
      {
        heading: 'Why non-negative weights?',
        body: 'When u is popped with the smallest distance, any other route to u must go through a node whose distance is already ≥ dist[u]; adding non-negative edges cannot make it smaller, so dist[u] is final. A negative edge breaks this argument — use Bellman-Ford instead.',
      },
      {
        heading: 'Choosing the algorithm',
        body: '- All weights equal → BFS, O(V + E).\n- Weights 0 or 1 → 0-1 BFS with a deque (Day 36).\n- Non-negative weights → Dijkstra, O((V + E) log V).\n- Negative weights, no negative cycles → Bellman-Ford, O(V·E).\n- DAG with any weights → DP in topological order (Day 23).',
      },
    ],
    recognition: [
      '"Minimum cost/time/distance" with weighted edges ≥ 0 → Dijkstra.',
      'Costs on cells of a grid → Dijkstra on the grid graph.',
      '"Maximum probability" (product of factors ≤ 1) → Dijkstra with a max-heap.',
      'Uniform weights → BFS is simpler and faster.',
    ],
    patterns: ['dijkstra', 'algorithm-selection', 'graph-bfs'],
    visualizations: ['graph-algos', 'grid-paths'],
    exampleA: {
      id: 'd25-A',
      title: 'Dijkstra with a min-heap and stale entries',
      goal: 'Compute shortest distances from node 0 in a directed weighted graph.',
      input: 'edges 0→1 (4), 0→2 (1), 2→1 (2), 1→3 (1), 2→3 (5), 3→4 (3)',
      output: 'dist: 0 3 1 4 7',
      idea: 'Pop the closest unsettled node, then relax its edges. Node 1 is first reached with cost 4 (directly) but improved to 3 via node 2; the old (4, 1) entry becomes stale.',
      code: TRACE_CODE.dijkstra,
      keyLines: [
        { match: 'priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;', note: 'Min-heap ordered by distance first.' },
        { match: 'if (d > dist[u]) continue;', note: 'Skip stale entries left by earlier, worse pushes.' },
        { match: 'if (dist[u] + w < dist[v]) {', note: 'Relaxation: a shorter route to v was found.' },
        { match: 'const long long INF = LLONG_MAX;', note: 'long long distances; dist[u] is never INF when relaxing because u was popped.' },
      ],
      complexity: { time: 'O((V + E) log V)', space: 'O(V + E)', why: 'Each edge can push one heap entry; each push/pop is O(log of heap size).' },
      edgeCases: ['Unreachable nodes stay INF', 'Several edges between the same nodes', 'Zero-weight edges are fine'],
      mistakes: ['Using a max-heap (default priority_queue)', 'Not skipping stale entries (still correct but slower)', 'Applying Dijkstra to negative weights'],
      tryIt: 'Record parent[v] = u during relaxation and print the path to node 4.',
      trace: { id: 'dijkstra', input: { n: 5, edges: [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]] } },
      bug: {
        find: 'pq.push({dist[v], v});',
        replace: '/* improved, but never pushed */',
        symptom: 'The program prints "dist: 0 4 1 INF INF" — nodes beyond the source\'s neighbours are never explored.',
        explanation: 'Relaxation must both lower dist[v] and schedule v for expansion. Without the push, improved nodes are never popped, so their outgoing edges are never relaxed.',
      },
    },
    exampleB: {
      id: 'd25-B',
      kind: 'edge-case',
      title: 'BFS vs Dijkstra on the same weighted graph',
      goal: 'Show that the fewest-edges path is not the cheapest path when weights differ.',
      input: 'edges A–B (10), A–C (1), C–D (1), D–B (1); from A to B',
      output: 'BFS path: A B (edges 1, cost 10)\nDijkstra path: A C D B (edges 3, cost 3)',
      idea: 'BFS minimises the number of edges, Dijkstra minimises the sum of weights. Both reconstruct paths by following parent pointers.',
      code: cpp`
#include <algorithm>
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

int main() {
    string names = "ABCD";
    int n = 4;
    vector<vector<pair<int, int>>> adj(n);
    auto add = [&](int u, int v, int w) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    };
    add(0, 1, 10);
    add(0, 2, 1);
    add(2, 3, 1);
    add(3, 1, 1);
    auto printPath = [&](const vector<int>& parent, int t) {
        vector<int> path;
        for (int v = t; v != -1; v = parent[v]) path.push_back(v);
        reverse(path.begin(), path.end());
        string out;
        for (int v : path) out += string(out.empty() ? "" : " ") + names[v];
        return out;
    };
    // BFS: fewest edges
    vector<int> hops(n, -1), pb(n, -1);
    queue<int> q;
    hops[0] = 0;
    q.push(0);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (auto [v, w] : adj[u])
            if (hops[v] == -1) {
                hops[v] = hops[u] + 1;
                pb[v] = u;
                q.push(v);
            }
    }
    long long bfsCost = 0;
    for (int v = 1; pb[v] != -1; v = pb[v])
        for (auto [x, w] : adj[pb[v]])
            if (x == v) bfsCost += w;
    // Dijkstra: least total weight
    vector<long long> dist(n, LLONG_MAX);
    vector<int> pd(n, -1);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[0] = 0;
    pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pd[v] = u;
                pq.push({dist[v], v});
            }
    }
    cout << "BFS path: " << printPath(pb, 1) << " (edges " << hops[1] << ", cost " << bfsCost << ")\n";
    cout << "Dijkstra path: " << printPath(pd, 1) << " (edges 3, cost " << dist[1] << ")\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (hops[v] == -1) {', note: 'BFS ignores weights entirely.' },
        { match: 'if (d + w < dist[v]) {', note: 'Dijkstra compares accumulated weight.' },
        { match: 'for (int v = t; v != -1; v = parent[v]) path.push_back(v);', note: 'Same parent-walk reconstruction for both algorithms.' },
      ],
      dryRun: {
        columns: ['algorithm', 'order settled', 'B reached via', 'cost'],
        rows: [
          ['BFS', 'A, B, C, D', 'A directly (1 edge)', '10'],
          ['Dijkstra', 'A(0), C(1), D(2), B(3)', 'D', '3'],
        ],
      },
      complexity: { time: 'BFS O(V + E); Dijkstra O((V + E) log V)', space: 'O(V + E)', why: 'Standard bounds for each algorithm.' },
      edgeCases: ['All weights equal → both give the same cost', 'Ties between paths'],
      mistakes: ['Using BFS on a weighted graph and trusting its "shortest" path'],
      tryIt: 'Set every weight to 1 and confirm both algorithms report the same cost.',
    },
    complexityNotes: 'Dijkstra with a binary heap is O((V + E) log V). Lazy deletion may hold up to E entries in the heap; that is still O(E log V).',
    quiz: [
      {
        prompt: 'Why must Dijkstra skip popped entries with d > dist[u]?',
        options: ['They are invalid nodes', 'They are stale duplicates from before dist[u] improved; processing them wastes work', 'They have negative weights', 'They are unreachable'],
        answer: 1,
        explanation: 'Lazy deletion leaves outdated entries in the heap.',
      },
      {
        prompt: 'A graph has a negative edge but no negative cycle. Which algorithm is safe?',
        options: ['Dijkstra', 'BFS', 'Bellman-Ford', 'DFS'],
        answer: 2,
        explanation: 'Dijkstra\'s finalisation argument fails with negative edges.',
      },
      {
        prompt: 'Every edge has weight 1. Best algorithm for single-source shortest paths?',
        options: ['Dijkstra', 'BFS', 'Floyd–Warshall', 'Bellman-Ford'],
        answer: 1,
        explanation: 'BFS is O(V + E) and exactly right for uniform weights.',
      },
    ],
    recap: 'Dijkstra settles nodes in increasing distance using a min-heap and relaxation. It requires non-negative weights; choose BFS for uniform weights and other tools for negative edges.',
    nextPrep: 'Tomorrow begins dynamic programming: states, transitions and memoisation.',
  },
  questions: [
    {
      id: 'd25-sssp',
      day: 25,
      title: 'Delivery Times From the Depot',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['dijkstra'],
      objective: 'Apply the Dijkstra template.',
      statement: 'A directed graph has non-negative edge weights. Print the shortest distance from node s to every node (INF if unreachable).',
      constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ m ≤ 2·10⁵', '0 ≤ w ≤ 10⁹'],
      examples: [{ input: 'n=3, edges 0→1 (5), 1→2 (2), 0→2 (9), s=0', output: '0 5 7' }],
      edgeCases: ['Unreachable nodes', 'Zero-weight edges', 'Large sums (64-bit)'],
      cues: ['Single source, non-negative weights → Dijkstra'],
      hints: ['Min-heap of (dist, node).', 'Skip stale entries.'],
      approach: 'Example A.',
      correctness: 'Standard Dijkstra invariant.',
      complexity: { time: 'O((n + m) log n)', space: 'O(n + m)', why: 'Heap operations per edge.' },
      cpp: cpp`
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

vector<long long> dijkstra(int n, const vector<tuple<int, int, long long>>& edges, int s) {
    vector<vector<pair<int, long long>>> adj(n);
    for (auto [u, v, w] : edges) adj[u].push_back({v, w});
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
    }
    return dist;
}`,
      main: cpp`
int main() {
    int n, m, s;
    cin >> n >> m;
    vector<tuple<int, int, long long>> e(m);
    for (auto& [u, v, w] : e) cin >> u >> v >> w;
    cin >> s;
    vector<long long> d = dijkstra(n, e, s);
    for (int i = 0; i < n; i++) {
        if (d[i] == LLONG_MAX) cout << "INF";
        else cout << d[i];
        cout << (i + 1 < n ? " " : "\n");
    }
    return 0;
}`,
      io: 'Input: n m, m edges "u v w", then s. Output: n distances.',
      keyLines: [{ match: 'if (d > dist[u]) continue;', note: 'Lazy deletion.' }],
      mistakes: ['int distances overflow'],
      tests: [
        { in: '3 3\n0 1 5\n1 2 2\n0 2 9\n0', out: '0 5 7' },
        { in: '3 1\n0 1 4\n2', out: 'INF INF 0' },
        { in: '2 2\n0 1 0\n1 0 0\n1', out: '0 0' },
        { in: '3 2\n0 1 1000000000\n1 2 1000000000\n0', out: '0 1000000000 2000000000' },
      ],
      viz: 'graph-algos',
    },
    {
      id: 'd25-network-delay',
      day: 25,
      title: 'Signal Broadcast Time',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['dijkstra'],
      objective: 'Answer = maximum shortest distance.',
      statement: 'A signal starts at node k (1..n) and travels along directed weighted links. Print the time until all nodes receive it, or -1 if some never do.',
      constraints: ['1 ≤ n ≤ 100', '1 ≤ links ≤ 6000'],
      examples: [{ input: 'n=4, k=2, links 2→1 (1), 2→3 (1), 3→4 (1)', output: '2' }],
      edgeCases: ['Unreachable node → -1', 'n = 1 → 0'],
      cues: ['"Time for all to receive" = max over shortest paths'],
      hints: ['Run Dijkstra from k.', 'The answer is the largest finite distance (or -1 if any is infinite).'],
      approach: 'Dijkstra + max.',
      correctness: 'Each node receives the signal exactly at its shortest-path distance.',
      complexity: { time: 'O(E log V)', space: 'O(V + E)', why: 'Dijkstra.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

long long broadcastTime(int n, int k, const vector<tuple<int, int, int>>& links) {
    vector<vector<pair<int, int>>> adj(n + 1);
    for (auto [u, v, w] : links) adj[u].push_back({v, w});
    vector<long long> dist(n + 1, LLONG_MAX);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[k] = 0;
    pq.push({0, k});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
    }
    long long ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == LLONG_MAX) return -1;
        ans = max(ans, dist[i]);
    }
    return ans;
}`,
      main: cpp`
int main() {
    int n, m, k;
    cin >> n >> m >> k;
    vector<tuple<int, int, int>> l(m);
    for (auto& [u, v, w] : l) cin >> u >> v >> w;
    cout << broadcastTime(n, k, l) << "\n";
    return 0;
}`,
      io: 'Input: n m k, then m links "u v w". Output: time or -1.',
      keyLines: [{ match: 'if (dist[i] == LLONG_MAX) return -1;', note: 'Some node never receives the signal.' }],
      mistakes: ['Summing distances instead of taking the maximum'],
      tests: [
        { in: '4 3 2\n2 1 1\n2 3 1\n3 4 1', out: '2' },
        { in: '2 1 1\n1 2 1', out: '1' },
        { in: '2 1 2\n1 2 1', out: '-1' },
        { in: '3 3 1\n1 2 5\n1 3 1\n3 2 1', out: '2' },
      ],
    },
    {
      id: 'd25-max-probability',
      day: 25,
      title: 'Most Reliable Route',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['dijkstra', 'algorithm-selection'],
      objective: 'Dijkstra variant maximising a product of factors ≤ 1.',
      statement: 'An undirected graph has edge success probabilities in [0, 1]. Print the maximum probability of a path from s to t with 5 decimals (0.00000 if unreachable).',
      constraints: ['2 ≤ n ≤ 10⁴', '0 ≤ m ≤ 2·10⁴'],
      examples: [{ input: 'n=3, edges 0-1 (0.5) 1-2 (0.5) 0-2 (0.2), s=0, t=2', output: '0.25000' }],
      edgeCases: ['Unreachable', 's and t adjacent with a worse direct edge'],
      cues: ['Best product with factors ≤ 1 → max-heap Dijkstra (multiplying never increases)'],
      hints: ['Use a max-heap of (probability, node).', 'Relax with prob[u] · p.'],
      approach: 'Dijkstra with max-heap and multiplication.',
      correctness: 'Multiplying by p ≤ 1 never increases a value — the analogue of non-negative weights.',
      complexity: { time: 'O(m log n)', space: 'O(n + m)', why: 'Dijkstra.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

double bestProbability(int n, const vector<tuple<int, int, double>>& edges, int s, int t) {
    vector<vector<pair<int, double>>> adj(n);
    for (auto [u, v, p] : edges) {
        adj[u].push_back({v, p});
        adj[v].push_back({u, p});
    }
    vector<double> best(n, 0.0);
    priority_queue<pair<double, int>> pq;  // max-heap
    best[s] = 1.0;
    pq.push({1.0, s});
    while (!pq.empty()) {
        auto [p, u] = pq.top();
        pq.pop();
        if (p < best[u]) continue;
        if (u == t) return p;
        for (auto [v, q] : adj[u])
            if (p * q > best[v]) {
                best[v] = p * q;
                pq.push({best[v], v});
            }
    }
    return 0.0;
}`,
      main: cpp`
#include <cstdio>
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, double>> e(m);
    for (auto& [u, v, p] : e) cin >> u >> v >> p;
    int s, t;
    cin >> s >> t;
    printf("%.5f\n", bestProbability(n, e, s, t));
    return 0;
}`,
      io: 'Input: n m, m edges "u v p", then s t. Output: probability with 5 decimals.',
      keyLines: [{ match: 'priority_queue<pair<double, int>> pq;  // max-heap', note: 'Here we want the largest probability first.' }],
      mistakes: ['Summing probabilities', 'Using a min-heap'],
      tests: [
        { in: '3 3\n0 1 0.5\n1 2 0.5\n0 2 0.2\n0 2', out: '0.25000' },
        { in: '3 3\n0 1 0.5\n1 2 0.5\n0 2 0.3\n0 2', out: '0.30000' },
        { in: '3 1\n0 1 0.5\n0 2', out: '0.00000' },
        { in: '2 1\n0 1 1.0\n1 0', out: '1.00000' },
      ],
    },
    {
      id: 'd25-min-effort',
      day: 25,
      title: 'Gentlest Hiking Route',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['dijkstra', 'grid-traversal'],
      objective: 'Dijkstra where path cost is the maximum step, not the sum.',
      statement: 'Move between 4-adjacent cells of a height grid from top-left to bottom-right. A route\'s effort is the maximum absolute height difference along it. Print the minimum effort.',
      constraints: ['1 ≤ R, C ≤ 100', '1 ≤ height ≤ 10⁶'],
      examples: [{ input: '1 2 2 / 3 8 2 / 5 3 5', output: '2' }],
      edgeCases: ['1×1 grid → 0', 'Flat grid → 0'],
      cues: ['Minimise the maximum edge on a path (bottleneck) → Dijkstra with max instead of +'],
      hints: ['Cost through edge = max(cost[u], |h[u] − h[v]|).', 'Max is monotone like addition, so Dijkstra still works.'],
      approach: 'Dijkstra on the grid with the bottleneck relaxation.',
      correctness: 'max(a, w) ≥ a for all w ≥ 0, which is the property Dijkstra needs.',
      complexity: { time: 'O(RC log(RC))', space: 'O(RC)', why: 'Dijkstra on RC nodes with 4 edges each.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

int minEffort(const vector<vector<int>>& h) {
    int R = h.size(), C = h[0].size();
    vector<vector<int>> eff(R, vector<int>(C, INT_MAX));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;
    eff[0][0] = 0;
    pq.push({0, 0, 0});
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!pq.empty()) {
        auto [e, r, c] = pq.top();
        pq.pop();
        if (e > eff[r][c]) continue;
        if (r == R - 1 && c == C - 1) return e;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
            int ne = max(e, abs(h[nr][nc] - h[r][c]));
            if (ne < eff[nr][nc]) {
                eff[nr][nc] = ne;
                pq.push({ne, nr, nc});
            }
        }
    }
    return 0;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> h(R, vector<int>(C));
    for (auto& row : h)
        for (auto& x : row) cin >> x;
    cout << minEffort(h) << "\n";
    return 0;
}`,
      io: 'Input: R C, then heights. Output: minimum effort.',
      keyLines: [{ match: 'int ne = max(e, abs(h[nr][nc] - h[r][c]));', note: 'Path cost is the largest single step so far.' }],
      mistakes: ['Summing differences (different problem)'],
      tests: [
        { in: '3 3\n1 2 2\n3 8 2\n5 3 5', out: '2' },
        { in: '3 3\n1 2 3\n3 8 4\n5 3 5', out: '1' },
        { in: '1 1\n7', out: '0' },
        { in: '2 2\n1 10\n10 1', out: '9' },
      ],
    },
    {
      id: 'd25-path-reconstruction',
      day: 25,
      title: 'Print the Cheapest Route',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['dijkstra'],
      objective: 'Record parents during relaxation and rebuild the path.',
      statement: 'Undirected weighted graph, nodes 1..n. Print the cost of the cheapest path from 1 to n and the path itself, or -1 if unreachable. (Inputs are chosen so the cheapest path is unique.)',
      constraints: ['2 ≤ n ≤ 10⁵', '1 ≤ m ≤ 10⁵', '1 ≤ w ≤ 10⁶'],
      examples: [{ input: 'n=5, edges 1-2 (2) 2-5 (5) 2-3 (4) 1-4 (1) 4-3 (3) 3-5 (1)', output: '5\n1 4 3 5' }],
      edgeCases: ['Unreachable → -1'],
      cues: ['Shortest path + the path itself → parent array'],
      hints: ['Set parent[v] = u whenever dist[v] improves.', 'Walk back from n to 1.'],
      approach: 'Dijkstra with parents.',
      correctness: 'The last relaxation that sets dist[v] lies on a shortest path to v.',
      complexity: { time: 'O(m log n)', space: 'O(n + m)', why: 'Dijkstra.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

pair<long long, vector<int>> cheapest(int n, const vector<tuple<int, int, int>>& edges) {
    vector<vector<pair<int, int>>> adj(n + 1);
    for (auto [u, v, w] : edges) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    vector<long long> dist(n + 1, LLONG_MAX);
    vector<int> parent(n + 1, -1);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[1] = 0;
    pq.push({0, 1});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {
                dist[v] = d + w;
                parent[v] = u;
                pq.push({dist[v], v});
            }
    }
    if (dist[n] == LLONG_MAX) return {-1, {}};
    vector<int> path;
    for (int v = n; v != -1; v = parent[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return {dist[n], path};
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> e(m);
    for (auto& [u, v, w] : e) cin >> u >> v >> w;
    auto [cost, path] = cheapest(n, e);
    cout << cost << "\n";
    for (size_t i = 0; i < path.size(); i++) cout << path[i] << (i + 1 < path.size() ? " " : "\n");
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: cost, then the path (nothing more if -1).',
      keyLines: [{ match: 'parent[v] = u;', note: 'Update together with dist[v].' }],
      mistakes: ['Recording parents on pop instead of on improvement'],
      tests: [
        { in: '5 6\n1 2 2\n2 5 5\n2 3 4\n1 4 1\n4 3 3\n3 5 1', out: '5\n1 4 3 5' },
        { in: '3 1\n1 2 1', out: '-1' },
        { in: '2 2\n1 2 5\n1 2 3', out: '3\n1 2' },
        { in: '4 3\n1 2 1\n2 3 1\n3 4 1', out: '3\n1 2 3 4' },
      ],
    },
    {
      id: 'd25-cheapest-k-stops',
      day: 25,
      title: 'Cheapest Flight With At Most K Stops',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['state-space-modeling', 'dijkstra'],
      objective: 'Bellman-Ford style relaxation limited by the number of edges.',
      statement: 'Directed flights u→v with prices. Print the cheapest price from src to dst using at most k stops (k + 1 flights), or -1.',
      constraints: ['1 ≤ n ≤ 100', '0 ≤ flights ≤ n(n−1)/2', '0 ≤ k < n'],
      examples: [{ input: 'n=4, flights 0→1 (100) 1→2 (100) 2→0 (100) 1→3 (600) 2→3 (200), src 0, dst 3, k 1', output: '700' }],
      edgeCases: ['k = 0 → direct flight only', 'Cheaper path with too many stops must be ignored'],
      cues: ['Shortest path with an edge-count limit → k + 1 rounds of relaxation using the previous round'],
      hints: ['Plain Dijkstra may pick a cheap path with too many stops.', 'Run k + 1 rounds; each round relaxes all edges from a copy of the previous distances.'],
      approach: 'Bounded Bellman-Ford.',
      correctness: 'After round i, dist holds the cheapest cost using at most i flights; copying prevents chaining within a round.',
      complexity: { time: 'O(k · m)', space: 'O(n)', why: 'k + 1 passes over the edges.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <tuple>
#include <vector>
using namespace std;

long long cheapest(int n, const vector<tuple<int, int, int>>& flights, int src, int dst, int k) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(n, INF);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        vector<long long> next = dist;
        for (auto [u, v, w] : flights)
            if (dist[u] != INF && dist[u] + w < next[v]) next[v] = dist[u] + w;
        dist = next;
    }
    return dist[dst] == INF ? -1 : dist[dst];
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> f(m);
    for (auto& [u, v, w] : f) cin >> u >> v >> w;
    int src, dst, k;
    cin >> src >> dst >> k;
    cout << cheapest(n, f, src, dst, k) << "\n";
    return 0;
}`,
      io: 'Input: n m, m flights "u v w", then src dst k. Output: price or -1.',
      keyLines: [{ match: 'vector<long long> next = dist;', note: 'Relax from the previous round only, so each round adds at most one flight.' }],
      mistakes: ['Relaxing in place (allows more flights than the round count)'],
      tests: [
        { in: '4 5\n0 1 100\n1 2 100\n2 0 100\n1 3 600\n2 3 200\n0 3 1', out: '700' },
        { in: '3 3\n0 1 100\n1 2 100\n0 2 500\n0 2 1', out: '200' },
        { in: '3 3\n0 1 100\n1 2 100\n0 2 500\n0 2 0', out: '500' },
        { in: '3 1\n0 1 5\n0 2 1', out: '-1' },
      ],
    },
    {
      id: 'd25-count-shortest',
      day: 25,
      title: 'How Many Fastest Routes?',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['dijkstra', 'tabulation'],
      objective: 'Count shortest paths during Dijkstra.',
      statement: 'Undirected weighted graph, nodes 0..n−1. Print the number of shortest paths from 0 to n − 1 modulo 1 000 000 007.',
      constraints: ['1 ≤ n ≤ 200', 'n − 1 ≤ m ≤ n(n−1)/2', '1 ≤ w ≤ 10⁹'],
      examples: [{ input: 'n=4, edges 0-1 (1) 0-2 (1) 1-3 (1) 2-3 (1)', output: '2' }],
      edgeCases: ['Unique shortest path → 1', 'Large weights (64-bit)'],
      cues: ['Counting optimal paths → carry ways[] alongside dist[]'],
      hints: ['On a strict improvement, ways[v] = ways[u].', 'On an equal distance, ways[v] += ways[u].'],
      approach: 'Dijkstra with a ways array.',
      correctness: 'When u is popped its ways count is final, so contributions to v are complete before v is popped.',
      complexity: { time: 'O(m log n)', space: 'O(n + m)', why: 'Dijkstra.' },
      cpp: cpp`
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

long long countShortest(int n, const vector<tuple<int, int, long long>>& edges) {
    const long long MOD = 1000000007;
    vector<vector<pair<int, long long>>> adj(n);
    for (auto [u, v, w] : edges) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    vector<long long> dist(n, LLONG_MAX), ways(n, 0);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[0] = 0;
    ways[0] = 1;
    pq.push({0, 0});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (d + w < dist[v]) {
                dist[v] = d + w;
                ways[v] = ways[u];
                pq.push({dist[v], v});
            } else if (d + w == dist[v]) {
                ways[v] = (ways[v] + ways[u]) % MOD;
            }
        }
    }
    return ways[n - 1];
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, long long>> e(m);
    for (auto& [u, v, w] : e) cin >> u >> v >> w;
    cout << countShortest(n, e) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m edges. Output: number of shortest paths mod 1e9+7.',
      keyLines: [{ match: '} else if (d + w == dist[v]) {', note: 'An equally short route adds its count.' }],
      mistakes: ['Counting with stale entries (they are skipped by the d > dist[u] check)'],
      tests: [
        { in: '4 4\n0 1 1\n0 2 1\n1 3 1\n2 3 1', out: '2' },
        { in: '2 1\n0 1 7', out: '1' },
        { in: '7 10\n0 6 7\n0 1 2\n1 2 3\n1 3 3\n6 3 3\n3 5 1\n6 5 1\n2 5 1\n0 4 5\n4 6 2', out: '4' },
        { in: '3 3\n0 1 1\n1 2 1\n0 2 3', out: '1' },
      ],
    },
    {
      id: 'd25-swim-rising-water',
      day: 25,
      title: 'Escape the Rising Flood',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['dijkstra', 'binary-search-answer', 'union-find'],
      objective: 'Minimise the maximum cell value along a path.',
      statement: 'An N×N grid holds distinct elevations. At time t you can swim through cells with elevation ≤ t. Print the least t at which you can travel from the top-left to the bottom-right cell (4-directional).',
      constraints: ['1 ≤ N ≤ 50', '0 ≤ elevation < N²'],
      examples: [{ input: '0 2 / 1 3', output: '3' }],
      edgeCases: ['1×1 grid → its elevation', 'Start cell is high'],
      cues: ['Bottleneck path (minimise the maximum) → Dijkstra with max, or binary search + BFS, or DSU by increasing elevation'],
      hints: ['Path cost = max elevation on it.', 'Dijkstra with cost = max(current, next cell).'],
      approach: 'Min-heap expansion by elevation.',
      correctness: 'The first time the target is popped, the max along the cheapest route is minimal (same argument as minimum effort).',
      complexity: { time: 'O(N² log N)', space: 'O(N²)', why: 'Dijkstra on N² cells.' },
      cpp: cpp`
#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

int swimTime(const vector<vector<int>>& g) {
    int N = g.size();
    vector<vector<bool>> seen(N, vector<bool>(N, false));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<>> pq;
    pq.push({g[0][0], 0, 0});
    seen[0][0] = true;
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!pq.empty()) {
        auto [t, r, c] = pq.top();
        pq.pop();
        if (r == N - 1 && c == N - 1) return t;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= N || nc >= N || seen[nr][nc]) continue;
            seen[nr][nc] = true;
            pq.push({max(t, g[nr][nc]), nr, nc});
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int N;
    cin >> N;
    vector<vector<int>> g(N, vector<int>(N));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << swimTime(g) << "\n";
    return 0;
}`,
      io: 'Input: N, then the grid. Output: minimum time.',
      keyLines: [{ match: 'pq.push({max(t, g[nr][nc]), nr, nc});', note: 'Waiting time is the highest elevation along the route.' }],
      mistakes: ['Summing elevations'],
      tests: [
        { in: '2\n0 2\n1 3', out: '3' },
        { in: '5\n0 1 2 3 4\n24 23 22 21 5\n12 13 14 15 16\n11 17 18 19 20\n10 9 8 7 6', out: '16' },
        { in: '1\n0', out: '0' },
        { in: '2\n3 2\n0 1', out: '3' },
      ],
    },
  ],
};

export default day;
