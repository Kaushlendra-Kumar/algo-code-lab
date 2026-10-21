import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 36,
    title: 'BFS Variations: 0-1 BFS and Multi-Source BFS',
    zone: 'graphs',
    advanced: true,
    objectives: [
      'Run BFS from many sources at once to get distance-to-nearest',
      'Handle edge weights 0 and 1 with a deque in O(V + E)',
      'Add extra information (keys, eliminations) to the BFS state',
      'Choose between BFS, 0-1 BFS and Dijkstra from the edge weights',
    ],
    prerequisites: ['Day 22: BFS on grids', 'Day 25: Dijkstra'],
    lesson: [
      {
        heading: 'Multi-source BFS',
        body: 'Push **all** sources into the queue with distance 0 before the loop starts. BFS then expands from every source in lock-step, so the first time a cell is reached it is reached from its nearest source. One BFS replaces k separate BFS runs.',
      },
      {
        heading: '0-1 BFS',
        body: 'When edges cost 0 or 1, use a deque: relax a 0-edge by pushing the neighbour to the **front**, a 1-edge by pushing it to the **back**. The deque always holds at most two distinct distances in order, so it behaves like Dijkstra\'s heap at O(V + E).',
      },
      {
        heading: 'Typical 0-1 models',
        body: '- Moving through an empty cell = 0, breaking a wall = 1.\n- Following the arrow in a cell = 0, changing it = 1.\n- Free transfer vs paid transfer in transport networks.',
      },
      {
        heading: 'State-augmented BFS',
        body: 'If the rules depend on more than the position — remaining wall breaks, keys held, direction — make the state `(r, c, extra)` and mark visited per state. The state space grows by the size of `extra`, so keep it small.',
      },
      {
        heading: 'Choosing the tool',
        body: 'All weights equal → BFS. Weights in {0, 1} → 0-1 BFS. Arbitrary non-negative weights → Dijkstra. Negative weights → Bellman-Ford (not covered here).',
      },
    ],
    recognition: [
      '"Distance to the nearest X" for every cell → multi-source BFS from all X.',
      '"Minimum number of walls to remove / changes to make" while moving → 0-1 BFS.',
      '"Can break at most k obstacles" → BFS over (cell, k left).',
    ],
    patterns: ['zero-one-bfs', 'multi-source-bfs', 'graph-bfs', 'state-space-modeling'],
    visualizations: ['grid-paths'],
    exampleA: {
      id: 'd36-A',
      title: '0-1 BFS: fewest walls to break',
      goal: 'Moving up/down/left/right through a grid, entering an open cell costs 0 and entering a wall costs 1 (you break it). Find the minimum cost from the top-left to the bottom-right.',
      input: 'grid .##. / .#.. / ..#. / ##.. (# = wall)',
      output: 'cost grid:\n0 1 2 1\n0 1 1 1\n0 0 1 1\n1 1 1 1\nwalls to break = 1',
      idea: 'Use a deque. A 0-cost move pushes to the front, a 1-cost move to the back, so cells come out in non-decreasing cost order — exactly like Dijkstra.',
      code: cpp`
#include <climits>
#include <deque>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<string> g = {".##.", ".#..", "..#.", "##.."};
    int R = g.size(), C = g[0].size();
    vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
    deque<pair<int, int>> dq;
    dist[0][0] = 0;
    dq.push_back({0, 0});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!dq.empty()) {
        auto [r, c] = dq.front();
        dq.pop_front();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            int w = g[nr][nc] == '#' ? 1 : 0;
            if (dist[r][c] + w < dist[nr][nc]) {
                dist[nr][nc] = dist[r][c] + w;
                if (w == 0) dq.push_front({nr, nc});  //@gap
                else dq.push_back({nr, nc});          //@gap
            }
        }
    }
    cout << "cost grid:\n";
    for (auto& row : dist) {
        for (int c = 0; c < C; c++) cout << (c ? " " : "") << row[c];
        cout << "\n";
    }
    cout << "walls to break = " << dist[R - 1][C - 1] << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'int w = g[nr][nc] == \'#\' ? 1 : 0;', note: 'The edge weight: entering a wall costs one break.' },
        { match: 'if (dist[r][c] + w < dist[nr][nc]) {', note: 'Relax like Dijkstra — a cell may improve after it was first seen.' },
        { match: 'if (w == 0) dq.push_front({nr, nc});', note: 'Same cost as the current cell → process it next.' },
        { match: 'else dq.push_back({nr, nc});', note: 'One more → behind every cell of the current cost.' },
      ],
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell is relaxed a constant number of times; deque operations are O(1).' },
      edgeCases: ['Start or goal is a wall (count it if entering costs)', 'No walls → 0'],
      mistakes: ['Using a plain queue (gives the fewest moves, not the fewest walls)', 'Marking visited on push instead of relaxing by distance'],
      tryIt: 'Make breaking a wall cost 2: the deque trick no longer applies — switch to Dijkstra.',
      bug: {
        find: 'int w = g[nr][nc] == \'#\' ? 1 : 0;',
        replace: 'int w = g[nr][nc] == \'#\' ? 0 : 1;',
        symptom: 'The program prints "walls to break = 3" — it now counts open cells entered and walks through walls for free.',
        explanation: 'The edge weight must describe the thing being minimised. Swapping 0 and 1 makes walls free and open cells expensive, so the search optimises the wrong quantity.',
      },
    },
    exampleB: {
      id: 'd36-B',
      kind: 'variant',
      title: 'Multi-source BFS: distance to the nearest exit',
      goal: 'For every open cell, find the number of steps to the nearest exit (E). Walls (#) block movement.',
      input: 'grid E..# / .#.. / ...E',
      output: 'distances:\n0 1 2 #\n1 # 2 1\n2 2 1 0',
      idea: 'Seed the queue with every exit at distance 0. The BFS frontier grows from all exits simultaneously, so each cell is first reached from its closest exit.',
      code: cpp`
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<string> g = {"E..#", ".#..", "...E"};
    int R = g.size(), C = g[0].size();
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == 'E') {
                dist[r][c] = 0;  // every exit is a source
                q.push({r, c});
            }
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            if (g[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    cout << "distances:\n";
    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            if (c) cout << " ";
            if (g[r][c] == '#') cout << "#";
            else cout << dist[r][c];
        }
        cout << "\n";
    }
    return 0;
}`,
      keyLines: [
        { match: 'dist[r][c] = 0;  // every exit is a source', note: 'All sources start in the queue at distance 0.' },
        { match: 'if (g[nr][nc] == \'#\' || dist[nr][nc] != -1) continue;', note: 'dist doubles as the visited array.' },
        { match: 'dist[nr][nc] = dist[r][c] + 1;', note: 'First visit = nearest source, because BFS processes by distance.' },
      ],
      dryRun: {
        columns: ['BFS layer', 'cells reached'],
        rows: [
          ['0', '(0,0) (2,3)'],
          ['1', '(1,0) (0,1) (1,3) (2,2)'],
          ['2', '(2,0) (0,2) (1,2) (2,1)'],
        ],
      },
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell enters the queue once, no matter how many sources there are.' },
      edgeCases: ['Cells that cannot reach any exit stay -1', 'No exits at all'],
      mistakes: ['Running a BFS from every cell to find its nearest exit (O((RC)²))', 'Running one BFS per exit and taking minimums (O(k · RC))'],
      tryIt: 'Put a wall at (1,2) and check which cells become unreachable.',
    },
    complexityNotes: 'Multi-source BFS and 0-1 BFS are both O(V + E). Adding a state dimension of size k multiplies both time and memory by k.',
    quiz: [
      {
        prompt: 'In 0-1 BFS, a neighbour reached through a 0-weight edge is pushed…',
        options: ['To the back', 'To the front', 'Into a heap', 'Nowhere'],
        answer: 1,
        explanation: 'It has the same distance as the current node, so it must be processed before nodes with distance + 1.',
      },
      {
        prompt: 'To compute every cell\'s distance to its nearest gate, you…',
        options: ['BFS from each cell', 'BFS from each gate separately', 'One BFS starting with all gates in the queue', 'Dijkstra from the top-left'],
        answer: 2,
        explanation: 'Multi-source BFS: one pass, O(R · C).',
      },
      {
        prompt: 'Edges have weights 1, 2 and 5. Which algorithm fits?',
        options: ['BFS', '0-1 BFS', 'Dijkstra', 'Union-find'],
        answer: 2,
        explanation: 'Non-uniform non-negative weights need Dijkstra.',
      },
    ],
    recap: 'Seed BFS with all sources for nearest-source distances. Use a deque for 0/1 weights (front for 0, back for 1). When rules depend on more than position, extend the state and the visited array.',
    nextPrep: 'Tomorrow: state-space and bitmask DP — when the state needs more than an index.',
  },
  questions: [
    {
      id: 'd36-double-or-add',
      day: 36,
      title: 'Doubling Calculator',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['graph-bfs', 'state-space-modeling'],
      objective: 'BFS over numbers as states.',
      statement: 'Start at 1. One operation either adds 1 or doubles the number. Print the minimum number of operations to reach n.',
      constraints: ['1 ≤ n ≤ 10⁶'],
      examples: [{ input: '10', output: '4', explanation: '1 → 2 → 4 → 5 → 10' }],
      edgeCases: ['n = 1 → 0'],
      cues: ['Minimum operations, unit cost → BFS over states'],
      hints: ['States above n are useless (both operations only increase).'],
      approach: 'BFS on 1..n.',
      correctness: 'Each operation has cost 1, so BFS order gives minimum counts.',
      complexity: { time: 'O(n)', space: 'O(n)', why: 'Each number visited once with two edges.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minOps(int n) {
    vector<int> dist(n + 1, -1);
    queue<int> q;
    dist[1] = 0;
    q.push(1);
    while (!q.empty()) {
        int x = q.front();
        q.pop();
        if (x == n) return dist[x];
        for (long long y : {(long long)x + 1, 2LL * x})
            if (y <= n && dist[y] == -1) {
                dist[y] = dist[x] + 1;
                q.push(y);
            }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    cout << minOps(n) << "\n";
    return 0;
}`,
      io: 'Input: n. Output: minimum operations.',
      keyLines: [{ match: 'if (y <= n && dist[y] == -1) {', note: 'Never go above n — there is no way back down.' }],
      mistakes: ['Greedy doubling (fails for 2ᵏ + 1 style targets)'],
      tests: [
        { in: '10', out: '4' },
        { in: '1', out: '0' },
        { in: '7', out: '4' },
        { in: '1000000', out: '25' },
      ],
    },
    {
      id: 'd36-knight',
      day: 36,
      title: 'Knight Across the Board',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-bfs', 'grid-traversal'],
      objective: 'BFS with custom moves.',
      statement: 'On an n×n board, print the minimum knight moves from (sr, sc) to (tr, tc), or -1.',
      constraints: ['1 ≤ n ≤ 500'],
      examples: [{ input: 'n=8, (0,0) → (7,7)', output: '6' }],
      edgeCases: ['Same square → 0', 'n ≤ 3 boards where some squares are unreachable'],
      cues: ['Minimum moves, unit cost, 8 move types'],
      hints: ['Eight (dr, dc) pairs.'],
      approach: 'Grid BFS with knight offsets.',
      correctness: 'BFS layers are move counts.',
      complexity: { time: 'O(n²)', space: 'O(n²)', why: 'Each square once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int knightMoves(int n, int sr, int sc, int tr, int tc) {
    vector<vector<int>> dist(n, vector<int>(n, -1));
    queue<pair<int, int>> q;
    dist[sr][sc] = 0;
    q.push({sr, sc});
    const int dr[] = {1, 2, 2, 1, -1, -2, -2, -1}, dc[] = {2, 1, -1, -2, -2, -1, 1, 2};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        if (r == tr && c == tc) return dist[r][c];
        for (int d = 0; d < 8; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && dist[nr][nc] == -1) {
                dist[nr][nc] = dist[r][c] + 1;
                q.push({nr, nc});
            }
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int n, sr, sc, tr, tc;
    cin >> n >> sr >> sc >> tr >> tc;
    cout << knightMoves(n, sr, sc, tr, tc) << "\n";
    return 0;
}`,
      io: 'Input: n sr sc tr tc. Output: minimum moves or -1.',
      keyLines: [{ match: 'const int dr[] = {1, 2, 2, 1, -1, -2, -2, -1}, dc[] = {2, 1, -1, -2, -2, -1, 1, 2};', note: 'All eight L-shaped moves.' }],
      mistakes: ['Missing one of the eight moves'],
      tests: [
        { in: '8 0 0 7 7', out: '6' },
        { in: '5 2 2 2 2', out: '0' },
        { in: '3 0 0 1 1', out: '-1' },
        { in: '8 0 0 1 2', out: '1' },
      ],
    },
    {
      id: 'd36-binary-matrix',
      day: 36,
      title: 'Diagonal Escape',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-bfs', 'grid-traversal'],
      objective: '8-directional grid BFS counting cells.',
      statement: 'In an n×n 0/1 grid, print the number of cells on the shortest 8-directional path of 0s from the top-left to the bottom-right, or -1.',
      constraints: ['1 ≤ n ≤ 100'],
      examples: [{ input: '01 / 10', output: '2' }],
      edgeCases: ['Start or end blocked → -1', '1×1 open → 1'],
      cues: ['Shortest path, unit steps, diagonals allowed'],
      hints: ['Path length counts cells, so start at distance 1.'],
      approach: 'BFS with 8 neighbours.',
      correctness: 'BFS on an unweighted graph.',
      complexity: { time: 'O(n²)', space: 'O(n²)', why: 'Each cell once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int shortestClearPath(const vector<vector<int>>& g) {
    int n = g.size();
    if (g[0][0] || g[n - 1][n - 1]) return -1;
    vector<vector<int>> dist(n, vector<int>(n, 0));
    queue<pair<int, int>> q;
    dist[0][0] = 1;
    q.push({0, 0});
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        if (r == n - 1 && c == n - 1) return dist[r][c];
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++) {
                int nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= n || nc < 0 || nc >= n || g[nr][nc] || dist[nr][nc]) continue;
                dist[nr][nc] = dist[r][c] + 1;
                q.push({nr, nc});
            }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> g(n, vector<int>(n));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << shortestClearPath(g) << "\n";
    return 0;
}`,
      io: 'Input: n, then the grid. Output: path length in cells, or -1.',
      keyLines: [{ match: 'dist[0][0] = 1;', note: 'Counting cells, not moves.' }],
      mistakes: ['Forgetting to check the start/end cells'],
      tests: [
        { in: '2\n0 1\n1 0', out: '2' },
        { in: '3\n0 0 0\n1 1 0\n1 1 0', out: '4' },
        { in: '3\n1 0 0\n1 1 0\n1 1 0', out: '-1' },
        { in: '1\n0', out: '1' },
      ],
    },
    {
      id: 'd36-nearest-exit',
      day: 36,
      title: 'Closest Way Out of the Maze',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['graph-bfs', 'grid-traversal'],
      objective: 'BFS with a border-based goal test.',
      statement: 'In a maze of "." and "+", starting at the entrance, print the fewest steps to reach any empty border cell that is not the entrance, or -1.',
      constraints: ['1 ≤ R, C ≤ 100'],
      examples: [{ input: '++.+ / ...+ / +++. ; entrance (1,2)', output: '1' }],
      edgeCases: ['Entrance itself is on the border (does not count)'],
      cues: ['Shortest steps to any of many targets'],
      hints: ['Check the exit condition when a cell is dequeued (or pushed), excluding the entrance.'],
      approach: 'BFS from the entrance.',
      correctness: 'The first border cell dequeued is the closest.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

int nearestExit(vector<string> m, int er, int ec) {
    int R = m.size(), C = m[0].size();
    queue<pair<int, int>> q;
    q.push({er, ec});
    m[er][ec] = '+';
    int steps = 0;
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        steps++;
        for (int k = q.size(); k > 0; k--) {
            auto [r, c] = q.front();
            q.pop();
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C || m[nr][nc] == '+') continue;
                if (nr == 0 || nr == R - 1 || nc == 0 || nc == C - 1) return steps;
                m[nr][nc] = '+';
                q.push({nr, nc});
            }
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int R, C, er, ec;
    cin >> R >> C;
    vector<string> m(R);
    for (auto& row : m) cin >> row;
    cin >> er >> ec;
    cout << nearestExit(m, er, ec) << "\n";
    return 0;
}`,
      io: 'Input: R C, the maze rows, then the entrance row and column. Output: steps or -1.',
      keyLines: [{ match: 'm[er][ec] = \'+\';', note: 'Marking the entrance visited also stops it from counting as an exit.' }],
      mistakes: ['Returning 0 because the entrance is on the border'],
      tests: [
        { in: '3 4\n++.+\n...+\n+++.\n1 2', out: '1' },
        { in: '3 3\n+++\n...\n+++\n1 0', out: '2' },
        { in: '1 2\n.+\n0 0', out: '-1' },
        { in: '4 4\n++++\n+..+\n+..+\n++.+\n1 1', out: '3' },
      ],
    },
    {
      id: 'd36-far-from-land',
      day: 36,
      title: 'Deepest Point at Sea',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['multi-source-bfs', 'grid-traversal'],
      objective: 'Multi-source BFS from all land cells.',
      statement: 'In a 0 (water) / 1 (land) grid, print the maximum over water cells of the Manhattan distance to the nearest land, or -1 if there is no land or no water.',
      constraints: ['1 ≤ n ≤ 100'],
      examples: [{ input: '101 / 000 / 101', output: '2' }],
      edgeCases: ['All land or all water → -1'],
      cues: ['Distance to the nearest of many sources'],
      hints: ['Push all land cells first; the last layer reached is the answer.'],
      approach: 'Multi-source BFS (4-directional steps equal Manhattan distance here).',
      correctness: 'Without obstacles, BFS distance equals Manhattan distance to the nearest source.',
      complexity: { time: 'O(n²)', space: 'O(n²)', why: 'Each cell once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int maxDistance(vector<vector<int>> g) {
    int n = g.size();
    queue<pair<int, int>> q;
    for (int r = 0; r < n; r++)
        for (int c = 0; c < n; c++)
            if (g[r][c] == 1) q.push({r, c});
    if (q.empty() || (int)q.size() == n * n) return -1;
    int best = 0;
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || g[nr][nc] != 0) continue;
            g[nr][nc] = g[r][c] + 1;  // stores distance + 1
            best = max(best, g[nr][nc] - 1);
            q.push({nr, nc});
        }
    }
    return best;
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> g(n, vector<int>(n));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << maxDistance(g) << "\n";
    return 0;
}`,
      io: 'Input: n, then the grid. Output: maximum distance or -1.',
      keyLines: [{ match: 'g[nr][nc] = g[r][c] + 1;  // stores distance + 1', note: 'Reuse the grid as the distance array (land = 1 = distance 0 + 1).' }],
      mistakes: ['BFS from every water cell (O(n⁴))'],
      tests: [
        { in: '3\n1 0 1\n0 0 0\n1 0 1', out: '2' },
        { in: '3\n1 0 0\n0 0 0\n0 0 0', out: '4' },
        { in: '2\n1 1\n1 1', out: '-1' },
        { in: '2\n0 0\n0 0', out: '-1' },
      ],
    },
    {
      id: 'd36-remove-obstacles',
      day: 36,
      title: 'Bulldozer Route',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['zero-one-bfs', 'grid-traversal'],
      objective: '0-1 BFS where obstacles cost 1.',
      statement: 'Grid of 0 (empty) and 1 (obstacle). Moving into an obstacle removes it at cost 1. Print the minimum number of removals to go from top-left to bottom-right (both corners are empty).',
      constraints: ['1 ≤ R · C ≤ 10⁵'],
      examples: [{ input: '011 / 110 / 110', output: '2' }],
      edgeCases: ['Path with no obstacles → 0'],
      cues: ['Minimise the number of special moves → 0-1 weights'],
      hints: ['Weight = value of the entered cell.'],
      approach: 'Deque-based 0-1 BFS.',
      correctness: 'Equivalent to Dijkstra with weights 0/1.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell relaxed O(1) times.' },
      cpp: cpp`
#include <climits>
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int minRemovals(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
    deque<pair<int, int>> dq;
    dist[0][0] = 0;
    dq.push_back({0, 0});
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!dq.empty()) {
        auto [r, c] = dq.front();
        dq.pop_front();
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            int w = g[nr][nc];
            if (dist[r][c] + w >= dist[nr][nc]) continue;
            dist[nr][nc] = dist[r][c] + w;
            if (w) dq.push_back({nr, nc});
            else dq.push_front({nr, nc});
        }
    }
    return dist[R - 1][C - 1];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << minRemovals(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid. Output: minimum removals.',
      keyLines: [{ match: 'if (w) dq.push_back({nr, nc});', note: 'Cost-1 moves wait behind all cost-0 work.' }],
      mistakes: ['Plain BFS minimises steps, not removals'],
      tests: [
        { in: '3 3\n0 1 1\n1 1 0\n1 1 0', out: '2' },
        { in: '3 5\n0 1 0 0 0\n0 1 0 1 0\n0 0 0 1 0', out: '0' },
        { in: '1 1\n0', out: '0' },
        { in: '2 3\n0 1 1\n1 1 0', out: '2' },
      ],
    },
    {
      id: 'd36-k-eliminations',
      day: 36,
      title: 'Through Walls with Limited Charges',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['graph-bfs', 'state-space-modeling'],
      objective: 'BFS over (cell, charges left).',
      statement: 'Grid of 0 (empty) and 1 (wall). You may walk through at most k walls. Print the minimum number of steps from top-left to bottom-right, or -1.',
      constraints: ['1 ≤ R, C ≤ 40', '0 ≤ k ≤ R · C'],
      examples: [{ input: '000 / 110 / 000 / 011 / 000, k=1', output: '6' }],
      edgeCases: ['k large enough to go straight: answer R + C − 2'],
      cues: ['Shortest steps + limited special resource'],
      hints: ['State = (r, c, charges left).', 'If k ≥ R + C − 3, the Manhattan path always works.'],
      approach: 'BFS over augmented states.',
      correctness: 'Each state is a node; edges cost 1 step; BFS gives shortest steps.',
      complexity: { time: 'O(R · C · k)', space: 'O(R · C · k)', why: 'States × 4 moves.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>
using namespace std;

int shortestWithCharges(const vector<vector<int>>& g, int k) {
    int R = g.size(), C = g[0].size();
    if (k >= R + C - 3) return R + C - 2;  // straight Manhattan path is always possible
    vector<vector<vector<bool>>> seen(R, vector<vector<bool>>(C, vector<bool>(k + 1, false)));
    queue<tuple<int, int, int>> q;
    q.push({0, 0, k});
    seen[0][0][k] = true;
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    for (int steps = 0; !q.empty(); steps++) {
        for (int cnt = q.size(); cnt > 0; cnt--) {
            auto [r, c, left] = q.front();
            q.pop();
            if (r == R - 1 && c == C - 1) return steps;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                int nl = left - g[nr][nc];
                if (nl < 0 || seen[nr][nc][nl]) continue;
                seen[nr][nc][nl] = true;
                q.push({nr, nc, nl});
            }
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    int R, C, k;
    cin >> R >> C >> k;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << shortestWithCharges(g, k) << "\n";
    return 0;
}`,
      io: 'Input: R C k, then the grid. Output: minimum steps or -1.',
      keyLines: [{ match: 'int nl = left - g[nr][nc];', note: 'Entering a wall uses one charge.' }],
      mistakes: ['Visited per cell only (a cell reached with more charges is a different, better state)'],
      tests: [
        { in: '5 3 1\n0 0 0\n1 1 0\n0 0 0\n0 1 1\n0 0 0', out: '6' },
        { in: '3 3 1\n0 1 1\n1 1 1\n1 0 0', out: '-1' },
        { in: '1 1 0\n0', out: '0' },
        { in: '2 2 0\n0 1\n1 0', out: '-1' },
      ],
    },
    {
      id: 'd36-arrow-grid',
      day: 36,
      title: 'Redirecting the Conveyor Belts',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['zero-one-bfs', 'state-space-modeling'],
      objective: 'Model "follow vs change" as 0/1 edges.',
      statement: 'Each cell holds an arrow: 1 right, 2 left, 3 down, 4 up. Following the arrow is free; moving in any other direction costs 1 (you change the arrow). Print the minimum cost from the top-left to the bottom-right.',
      constraints: ['1 ≤ R, C ≤ 100'],
      examples: [{ input: '1111 / 2222 / 1111 / 2222', output: '3' }],
      edgeCases: ['1×1 grid → 0'],
      cues: ['Free moves vs paid moves → 0-1 BFS'],
      hints: ['Weight = 0 if d matches the arrow, else 1.'],
      approach: '0-1 BFS over cells.',
      correctness: 'Dijkstra with 0/1 weights; the deque preserves distance order.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Four edges per cell.' },
      cpp: cpp`
#include <climits>
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int minCostArrows(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    const int dr[] = {0, 0, 0, 1, -1}, dc[] = {0, 1, -1, 0, 0};  // index = arrow value
    vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
    deque<pair<int, int>> dq;
    dist[0][0] = 0;
    dq.push_back({0, 0});
    while (!dq.empty()) {
        auto [r, c] = dq.front();
        dq.pop_front();
        for (int a = 1; a <= 4; a++) {
            int nr = r + dr[a], nc = c + dc[a];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            int w = g[r][c] == a ? 0 : 1;
            if (dist[r][c] + w >= dist[nr][nc]) continue;
            dist[nr][nc] = dist[r][c] + w;
            if (w) dq.push_back({nr, nc});
            else dq.push_front({nr, nc});
        }
    }
    return dist[R - 1][C - 1];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << minCostArrows(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the arrow grid. Output: minimum cost.',
      keyLines: [{ match: 'int w = g[r][c] == a ? 0 : 1;', note: 'The arrow of the current cell decides which move is free.' }],
      mistakes: ['Using the arrow of the destination cell'],
      tests: [
        { in: '4 4\n1 1 1 1\n2 2 2 2\n1 1 1 1\n2 2 2 2', out: '3' },
        { in: '3 3\n1 1 3\n3 2 2\n1 1 4', out: '0' },
        { in: '2 2\n1 2\n4 3', out: '1' },
        { in: '1 1\n4', out: '0' },
      ],
    },
  ],
};

export default day;
