import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const DSU = `struct DSU {
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        parent[b] = a;
        sz[a] += sz[b];
        return true;
    }
};`;

const day: DayModule = {
  day: {
    day: 24,
    title: 'Union-Find (Disjoint Set Union)',
    zone: 'graphs',
    objectives: [
      'Implement find with path compression and unite with union by size',
      'Answer "are a and b connected?" while edges are added',
      'Detect the edge that closes a cycle in an undirected graph',
      'Map non-integer items (strings, cells) to DSU indices',
    ],
    prerequisites: ['Day 21: connected components', 'Day 11: recursion'],
    lesson: [
      {
        heading: 'Sets as trees',
        body: 'Each set is a tree of parent pointers; the root is the set\'s representative. `find(x)` follows parents to the root. `unite(a, b)` links one root under the other. Two items are connected iff they have the same root.',
      },
      {
        heading: 'Two optimisations',
        body: '- **Path compression**: during find, point every visited node directly at the root.\n- **Union by size (or rank)**: attach the smaller tree under the larger one.\nTogether, a sequence of m operations costs O(m · α(n)) where α is the inverse Ackermann function — at most 4 for any practical n. Treat it as constant.',
      },
      {
        heading: 'DSU vs BFS/DFS',
        body: 'For a fixed graph, one traversal gives components in O(V + E). DSU shines when edges **arrive over time** and you must answer connectivity queries in between, or when you process edges in a special order (Kruskal\'s MST, Day 35). It cannot delete edges.',
      },
      {
        heading: 'Cycle detection',
        body: 'Adding edge (u, v) when find(u) == find(v) creates a cycle — the endpoints were already connected. That is how "redundant connection" and Kruskal\'s skip rule work.',
      },
    ],
    recognition: [
      '"Connected?" queries interleaved with merges → DSU.',
      '"Which edge creates a cycle", "earliest time everyone is connected" → DSU over edges in order.',
      'Grouping equal things transitively (accounts, equations, similar strings) → DSU on mapped ids.',
    ],
    patterns: ['union-find', 'graph-dfs'],
    visualizations: ['graph-algos'],
    exampleA: {
      id: 'd24-A',
      title: 'DSU with path compression and union by size',
      goal: 'Perform unions on 6 elements and report which ones merged and how many sets remain.',
      input: 'unions (0,1), (2,3), (1,3), (4,5), (0,3)',
      output: 'unite(0,1) merged\nunite(2,3) merged\nunite(1,3) merged\nunite(4,5) merged\nunite(0,3) already connected\ncomponents = 2',
      idea: 'unite finds both roots. Equal roots mean the elements are already connected; otherwise the smaller tree hangs under the larger root.',
      code: TRACE_CODE['union-find'],
      keyLines: [
        { match: 'iota(parent.begin(), parent.end(), 0);', note: 'Initially every element is its own root: parent[i] = i.' },
        { match: 'if (parent[x] != x) parent[x] = find(parent[x]);', note: 'Path compression: point x straight at the root.' },
        { match: 'if (sz[a] < sz[b]) swap(a, b);', note: 'Union by size keeps trees shallow.' },
        { match: 'parent[b] = a;', note: 'Link roots, never arbitrary members.' },
      ],
      complexity: { time: 'O(α(n)) amortised per operation', space: 'O(n)', why: 'Path compression + union by size make trees almost flat; α(n) ≤ 4 in practice.' },
      edgeCases: ['unite(x, x)', 'Repeated unions of the same pair', 'Recursion depth of find before compression (bounded by log n with union by size)'],
      mistakes: ['parent[a] = b without finding roots first', 'Forgetting to initialise parent[i] = i'],
      tryIt: 'Add a method `bool connected(int a, int b)` and a count of sets maintained inside the struct.',
      trace: { id: 'union-find', input: { n: 6, ops: [[0, 1], [2, 3], [1, 3], [4, 5], [0, 3]] } },
      bug: {
        find: 'if (a == b) return false;',
        replace: 'if (a == b) return true;',
        symptom: 'The program prints "unite(0,3) merged" and "components = 1" — a redundant union is counted as a merge.',
        explanation: 'When both elements already share a root, nothing changes; unite must report false so callers (like the component counter) do not decrement.',
      },
    },
    exampleB: {
      id: 'd24-B',
      kind: 'variant',
      title: 'Find the redundant edge',
      goal: 'A tree had one extra edge added. Find the edge (last in input order) whose removal leaves a tree.',
      input: 'edges 1-2, 1-3, 2-3 (nodes 1..3)',
      output: 'redundant edge: 2 3',
      idea: 'Add edges one by one with DSU. The first edge whose endpoints are already connected closes the cycle — it is redundant.',
      code: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

${DSU}

int main() {
    vector<pair<int, int>> edges = {{1, 2}, {1, 3}, {2, 3}};
    DSU dsu(4);  // nodes are 1..3
    for (auto [u, v] : edges) {
        if (!dsu.unite(u, v)) {  //@gap
            cout << "redundant edge: " << u << " " << v << "\n";
            break;
        }
    }
    return 0;
}`,
      keyLines: [
        { match: 'int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }', note: 'Compact path-compressing find.' },
        { match: 'if (!dsu.unite(u, v)) {', note: 'unite returns false when u and v were already connected.' },
        { match: 'DSU dsu(4);', note: 'Size n + 1 so 1-based labels index directly.' },
      ],
      dryRun: {
        columns: ['edge', 'roots before', 'result'],
        rows: [
          ['1-2', '1, 2', 'merged'],
          ['1-3', '1, 3', 'merged'],
          ['2-3', '1, 1', 'already connected → redundant'],
        ],
      },
      complexity: { time: 'O(n · α(n))', space: 'O(n)', why: 'One unite per edge.' },
      edgeCases: ['The redundant edge is the last one by problem guarantee'],
      mistakes: ['Detecting cycles with DFS after every edge (O(n²))'],
      tryIt: 'Print all edges that close cycles if more than one extra edge was added.',
    },
    complexityNotes: 'With both optimisations each DSU operation is effectively O(1) (inverse Ackermann). Without them, chains can make find O(n).',
    quiz: [
      {
        prompt: 'What does path compression do?',
        options: ['Deletes elements', 'Points nodes visited by find directly at the root', 'Merges every set', 'Sorts the parent array'],
        answer: 1,
        explanation: 'Future finds on those nodes become one step.',
      },
      {
        prompt: 'Which operation can a standard DSU NOT support efficiently?',
        options: ['Merging two sets', 'Checking connectivity', 'Splitting a set / deleting an edge', 'Counting sets'],
        answer: 2,
        explanation: 'DSU only grows sets.',
      },
      {
        prompt: 'unite(u, v) finds find(u) == find(v). In an undirected graph, adding edge (u, v) would…',
        options: ['Create a cycle', 'Disconnect the graph', 'Be a bridge', 'Do nothing special'],
        answer: 0,
        explanation: 'u and v were already connected by another path.',
      },
    ],
    recap: 'DSU keeps disjoint sets as parent-pointer trees. Path compression + union by size make find/unite nearly O(1). Use it for incremental connectivity and cycle detection.',
    nextPrep: 'Tomorrow: weighted shortest paths with Dijkstra.',
  },
  questions: [
    {
      id: 'd24-connectivity-queries',
      day: 24,
      title: 'Online Connectivity Queries',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['union-find'],
      objective: 'Interleave unions and connectivity checks.',
      statement: 'Process q operations on n nodes: "U a b" connects a and b; "Q a b" prints `yes` if a and b are connected, else `no`.',
      constraints: ['1 ≤ n, q ≤ 2·10⁵'],
      examples: [{ input: 'U 0 1, Q 0 1, Q 1 2', output: 'yes\nno' }],
      edgeCases: ['Q a a → yes', 'Repeated unions'],
      cues: ['Connectivity changing over time → DSU'],
      hints: ['find(a) == find(b) answers a query.'],
      approach: 'DSU with both optimisations.',
      correctness: 'Roots identify sets exactly.',
      complexity: { time: 'O(q · α(n))', space: 'O(n)', why: 'Near-constant per operation.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

${DSU}`,
      main: cpp`
int main() {
    int n, q;
    cin >> n >> q;
    DSU d(n);
    while (q--) {
        char op;
        int a, b;
        cin >> op >> a >> b;
        if (op == 'U') d.unite(a, b);
        else cout << (d.find(a) == d.find(b) ? "yes" : "no") << "\n";
    }
    return 0;
}`,
      io: 'Input: n q, then q lines "U a b" or "Q a b". Output: answers to Q.',
      keyLines: [{ match: 'else cout << (d.find(a) == d.find(b) ? "yes" : "no") << "\\n";', note: 'Same root ⇔ same set.' }],
      mistakes: ['Comparing parent[a] == parent[b] instead of roots'],
      tests: [
        { in: '3 3\nU 0 1\nQ 0 1\nQ 1 2', out: 'yes\nno' },
        { in: '4 4\nU 0 1\nU 2 3\nU 1 2\nQ 0 3', out: 'yes' },
        { in: '1 1\nQ 0 0', out: 'yes' },
        { in: '5 3\nQ 0 4\nU 4 0\nQ 0 4', out: 'no\nyes' },
      ],
      viz: 'graph-algos',
    },
    {
      id: 'd24-count-sets',
      day: 24,
      title: 'Groups After Merges',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['union-find'],
      objective: 'Track the number of sets during unions.',
      statement: 'Start with n singletons. After each of m unions print the current number of sets.',
      constraints: ['1 ≤ n, m ≤ 2·10⁵'],
      examples: [{ input: 'n=4, unions (0,1) (1,0) (2,3)', output: '3\n3\n2' }],
      edgeCases: ['Redundant unions do not change the count'],
      cues: ['Set count under merges → decrement on successful unite'],
      hints: ['unite returns true only when two different sets merge.'],
      approach: 'DSU with a counter.',
      correctness: 'Each successful merge reduces the number of sets by exactly one.',
      complexity: { time: 'O(m · α(n))', space: 'O(n)', why: 'DSU.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

${DSU}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    DSU d(n);
    int sets = n;
    while (m--) {
        int a, b;
        cin >> a >> b;
        if (d.unite(a, b)) sets--;
        cout << sets << "\n";
    }
    return 0;
}`,
      io: 'Input: n m, then m pairs. Output: set count after each union.',
      keyLines: [{ match: 'if (d.unite(a, b)) sets--;', note: 'Only real merges change the count.' }],
      mistakes: ['Decrementing on every union call'],
      tests: [
        { in: '4 3\n0 1\n1 0\n2 3', out: '3\n3\n2' },
        { in: '1 1\n0 0', out: '1' },
        { in: '3 3\n0 1\n1 2\n0 2', out: '2\n1\n1' },
        { in: '5 2\n3 4\n4 3', out: '4\n4' },
      ],
    },
    {
      id: 'd24-redundant',
      day: 24,
      title: 'The Extra Cable',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['union-find'],
      objective: 'Find the edge that closes a cycle.',
      statement: 'A network of n nodes (1..n) was a tree before one extra cable was added. Given the n cables in order, print the cable that can be removed to restore a tree (if several, the one appearing last).',
      constraints: ['3 ≤ n ≤ 1000'],
      examples: [{ input: '1-2 1-3 2-3', output: '2 3' }],
      edgeCases: ['Cycle through many nodes'],
      cues: ['Edge that creates a cycle → DSU'],
      hints: ['Add cables in order.', 'The first cable connecting already-connected nodes is the answer (it is the last cable on the unique cycle in input order).'],
      approach: 'Example B.',
      correctness: 'Exactly one cycle exists; the cycle\'s last edge in input order is the first one found redundant.',
      complexity: { time: 'O(n · α(n))', space: 'O(n)', why: 'One unite per cable.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

${DSU}

pair<int, int> redundant(int n, const vector<pair<int, int>>& e) {
    DSU d(n + 1);
    for (auto [u, v] : e)
        if (!d.unite(u, v)) return {u, v};
    return {-1, -1};
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> e(n);
    for (auto& [u, v] : e) cin >> u >> v;
    auto [u, v] = redundant(n, e);
    cout << u << " " << v << "\n";
    return 0;
}`,
      io: 'Input: n, then n edges. Output: the redundant edge.',
      keyLines: [{ match: 'if (!d.unite(u, v)) return {u, v};', note: 'Already connected → this edge closes the cycle.' }],
      mistakes: ['0-based DSU with 1-based labels (off by one)'],
      tests: [
        { in: '3\n1 2\n1 3\n2 3', out: '2 3' },
        { in: '5\n1 2\n2 3\n3 4\n1 4\n1 5', out: '1 4' },
        { in: '4\n1 2\n2 3\n3 1\n3 4', out: '3 1' },
        { in: '3\n2 3\n1 2\n1 3', out: '1 3' },
      ],
    },
    {
      id: 'd24-earliest-connected',
      day: 24,
      title: 'When Did Everyone Become Friends?',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['union-find', 'custom-sort'],
      objective: 'Process events in time order until one set remains.',
      statement: 'Log entries "t a b" say a and b became friends at time t (unsorted). Print the earliest time when all n people are connected, or -1.',
      constraints: ['2 ≤ n ≤ 100', '1 ≤ logs ≤ 10⁴'],
      examples: [{ input: 'n=4, logs (20,0,1) (10,2,3) (30,1,2)', output: '30' }],
      edgeCases: ['Never fully connected → -1'],
      cues: ['Earliest moment of full connectivity → sort events, DSU with a set counter'],
      hints: ['Sort logs by time.', 'Unite and decrement the set count; when it hits 1, print the time.'],
      approach: 'Sort + DSU.',
      correctness: 'Connectivity only increases over time, so the first time the count reaches 1 is the answer.',
      complexity: { time: 'O(m log m)', space: 'O(n + m)', why: 'Sorting dominates.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <tuple>
#include <vector>
using namespace std;

${DSU}

int earliest(int n, vector<tuple<int, int, int>> logs) {
    sort(logs.begin(), logs.end());
    DSU d(n);
    int sets = n;
    for (auto [t, a, b] : logs)
        if (d.unite(a, b) && --sets == 1) return t;
    return -1;
}`,
      main: cpp`
int main() {
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> logs(m);
    for (auto& [t, a, b] : logs) cin >> t >> a >> b;
    cout << earliest(n, logs) << "\n";
    return 0;
}`,
      io: 'Input: n m, then m lines "t a b". Output: earliest time or -1.',
      keyLines: [{ match: 'if (d.unite(a, b) && --sets == 1) return t;', note: 'Short-circuit: only decrement on a real merge.' }],
      mistakes: ['Processing logs in input order'],
      tests: [
        { in: '4 3\n20 0 1\n10 2 3\n30 1 2', out: '30' },
        { in: '3 1\n5 0 1', out: '-1' },
        { in: '2 2\n7 1 0\n3 0 1', out: '3' },
        { in: '4 4\n1 0 1\n2 1 0\n3 2 3\n4 0 3', out: '4' },
      ],
    },
    {
      id: 'd24-equations',
      day: 24,
      title: 'Consistent Equalities',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['union-find'],
      objective: 'Unite equalities first, then check inequalities.',
      statement: 'Equations look like "a==b" or "a!=b" with lowercase variables. Print `true` if all can be satisfied simultaneously.',
      constraints: ['1 ≤ equations ≤ 500'],
      examples: [{ input: 'a==b b!=a', output: 'false' }],
      edgeCases: ['a!=a → false', 'Only inequalities → true unless x!=x'],
      cues: ['Transitive equality → DSU; inequalities are checks against the final sets'],
      hints: ['Process all "==" first.', 'Then every "!=" must have different roots.'],
      approach: 'Two-pass DSU over 26 letters.',
      correctness: 'Equalities determine the finest consistent partition; an inequality fails only within a set.',
      complexity: { time: 'O(m · α(26))', space: 'O(1)', why: 'Fixed alphabet.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
using namespace std;

${DSU}

bool possible(const vector<string>& eqs) {
    DSU d(26);
    for (auto& e : eqs)
        if (e[1] == '=') d.unite(e[0] - 'a', e[3] - 'a');
    for (auto& e : eqs)
        if (e[1] == '!' && d.find(e[0] - 'a') == d.find(e[3] - 'a')) return false;
    return true;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<string> eqs(n);
    for (auto& s : eqs) cin >> s;
    cout << (possible(eqs) ? "true" : "false") << "\n";
    return 0;
}`,
      io: 'Input: n, then n equations. Output: true or false.',
      keyLines: [{ match: "if (e[1] == '=') d.unite(e[0] - 'a', e[3] - 'a');", note: 'Characters 0 and 3 are the variables; 1–2 are the operator.' }],
      mistakes: ['Checking inequalities before all equalities are merged'],
      tests: [
        { in: '2\na==b\nb!=a', out: 'false' },
        { in: '2\nb==a\na==b', out: 'true' },
        { in: '3\na==b\nb==c\na!=c', out: 'false' },
        { in: '1\nc!=c', out: 'false' },
      ],
    },
    {
      id: 'd24-smallest-swaps',
      day: 24,
      title: 'Smallest String With Allowed Swaps',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['union-find', 'custom-sort'],
      objective: 'Sort within each connected component of positions.',
      statement: 'Given a string and pairs of indices that may be swapped any number of times, print the lexicographically smallest reachable string.',
      constraints: ['1 ≤ |s| ≤ 10⁵', '0 ≤ pairs ≤ 10⁵'],
      examples: [{ input: 's = dcab, pairs (0,3) (1,2)', output: 'bacd' }],
      edgeCases: ['No pairs', 'Everything connected → fully sorted'],
      cues: ['Swaps compose → any permutation within a connected component'],
      hints: ['Union the index pairs.', 'Collect indices and characters per root.', 'Sort characters and place them into sorted indices.'],
      approach: 'DSU groups; sort each group\'s characters.',
      correctness: 'Swaps along a connected set generate all permutations of that set.',
      complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sorting groups.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
using namespace std;

${DSU}

string smallest(string s, const vector<pair<int, int>>& pairs) {
    int n = s.size();
    DSU d(n);
    for (auto [a, b] : pairs) d.unite(a, b);
    vector<vector<int>> groups(n);
    for (int i = 0; i < n; i++) groups[d.find(i)].push_back(i);
    for (auto& idx : groups) {
        string chars;
        for (int i : idx) chars += s[i];
        sort(chars.begin(), chars.end());
        for (size_t k = 0; k < idx.size(); k++) s[idx[k]] = chars[k];  // idx is already ascending
    }
    return s;
}`,
      main: cpp`
int main() {
    string s;
    int m;
    cin >> s >> m;
    vector<pair<int, int>> p(m);
    for (auto& [a, b] : p) cin >> a >> b;
    cout << smallest(s, p) << "\n";
    return 0;
}`,
      io: 'Input: s m, then m pairs. Output: smallest string.',
      keyLines: [{ match: 'for (int i = 0; i < n; i++) groups[d.find(i)].push_back(i);', note: 'Indices are added in increasing order, so each group is sorted already.' }],
      mistakes: ['Greedy adjacent swaps (misses long chains)'],
      tests: [
        { in: 'dcab 2\n0 3\n1 2', out: 'bacd' },
        { in: 'dcab 3\n0 3\n1 2\n0 2', out: 'abcd' },
        { in: 'cba 0', out: 'cba' },
        { in: 'zyx 2\n0 1\n1 2', out: 'xyz' },
      ],
    },
    {
      id: 'd24-stones-removed',
      day: 24,
      title: 'Remove Stones Sharing a Line',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['union-find', 'hash-lookup'],
      objective: 'Union rows and columns as nodes.',
      statement: 'Stones are at integer points. A stone can be removed if another remaining stone shares its row or column. Print the maximum number of stones that can be removed.',
      constraints: ['1 ≤ stones ≤ 1000', '0 ≤ x, y ≤ 10⁴'],
      examples: [{ input: '(0,0) (0,1) (1,0) (1,2) (2,1) (2,2)', output: '5' }],
      edgeCases: ['Single stone → 0', 'All in different rows and columns → 0'],
      cues: ['Stones connected through shared rows/columns; each component keeps one stone'],
      hints: ['Answer = stones − number of components.', 'Treat row x and column y (offset by 10001) as DSU nodes; unite them for each stone.'],
      approach: 'DSU over rows/columns.',
      correctness: 'Within a connected component all but one stone can be removed in a suitable order (e.g. reverse DFS order).',
      complexity: { time: 'O(n · α)', space: 'O(20002)', why: 'One union per stone.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <set>
#include <vector>
using namespace std;

${DSU}

int removable(const vector<pair<int, int>>& stones) {
    const int OFF = 10001;
    DSU d(2 * OFF);
    for (auto [x, y] : stones) d.unite(x, y + OFF);
    set<int> roots;
    for (auto [x, y] : stones) roots.insert(d.find(x));
    return (int)stones.size() - (int)roots.size();
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> s(n);
    for (auto& [x, y] : s) cin >> x >> y;
    cout << removable(s) << "\n";
    return 0;
}`,
      io: 'Input: n, then n points. Output: maximum removable stones.',
      keyLines: [{ match: 'for (auto [x, y] : stones) d.unite(x, y + OFF);', note: 'A stone links its row node with its column node.' }],
      mistakes: ['Uniting stones pairwise (O(n²) but still correct)'],
      tests: [
        { in: '6\n0 0\n0 1\n1 0\n1 2\n2 1\n2 2', out: '5' },
        { in: '5\n0 0\n0 2\n1 1\n2 0\n2 2', out: '3' },
        { in: '1\n0 0', out: '0' },
        { in: '3\n0 0\n1 1\n2 2', out: '0' },
      ],
    },
    {
      id: 'd24-islands-ii',
      day: 24,
      title: 'Islands Appearing Over Time',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['union-find', 'grid-traversal'],
      objective: 'Online island counting with DSU on cell ids.',
      statement: 'An R×C grid starts as water. Land is added at given cells one by one. After each addition print the number of islands (4-connected).',
      constraints: ['1 ≤ R, C ≤ 10⁴', 'R·C ≤ 10⁵', '1 ≤ additions ≤ 10⁴'],
      examples: [{ input: '3×3, add (0,0) (0,1) (1,2) (2,1)', output: '1\n1\n2\n3' }],
      edgeCases: ['Adding the same cell twice', 'Merging several islands at once'],
      cues: ['Components changing as cells appear → DSU with id = r·C + c'],
      hints: ['On adding land: count++ (unless already land).', 'For each land neighbour, unite; decrement count when a merge happens.'],
      approach: 'DSU over cell ids with a land flag.',
      correctness: 'Each successful union merges two islands into one.',
      complexity: { time: 'O(k · α(RC))', space: 'O(R · C)', why: 'Four unions per addition.' },
      cpp: cpp`
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

${DSU}

vector<int> islandsOverTime(int R, int C, const vector<pair<int, int>>& adds) {
    DSU d(R * C);
    vector<bool> land(R * C, false);
    vector<int> out;
    int count = 0, dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    for (auto [r, c] : adds) {
        int id = r * C + c;
        if (!land[id]) {
            land[id] = true;
            count++;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C || !land[nr * C + nc]) continue;
                if (d.unite(id, nr * C + nc)) count--;
            }
        }
        out.push_back(count);
    }
    return out;
}`,
      main: cpp`
int main() {
    int R, C, k;
    cin >> R >> C >> k;
    vector<pair<int, int>> adds(k);
    for (auto& [r, c] : adds) cin >> r >> c;
    for (int x : islandsOverTime(R, C, adds)) cout << x << "\n";
    return 0;
}`,
      io: 'Input: R C k, then k cells. Output: island count after each addition.',
      keyLines: [{ match: 'if (d.unite(id, nr * C + nc)) count--;', note: 'Joining two different islands reduces the count.' }],
      mistakes: ['Recounting islands with BFS after each addition (O(k · RC))', 'Double-counting a repeated addition'],
      tests: [
        { in: '3 3 4\n0 0\n0 1\n1 2\n2 1', out: '1\n1\n2\n3' },
        { in: '1 3 3\n0 0\n0 2\n0 1', out: '1\n2\n1' },
        { in: '2 2 2\n0 0\n0 0', out: '1\n1' },
        { in: '3 3 5\n0 1\n1 0\n1 2\n2 1\n1 1', out: '1\n2\n3\n4\n1' },
      ],
    },
  ],
};

export default day;
