import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';
import { TRACE_CODE } from '../traceCode';

const day: DayModule = {
  day: {
    day: 22,
    title: 'Grids: Flood Fill, Islands and Multi-Source BFS',
    zone: 'graphs',
    objectives: [
      'Treat a 2D grid as an implicit graph with 4 (or 8) neighbours',
      'Use direction arrays and bounds checks without off-by-one errors',
      'Count and measure regions with flood fill',
      'Run BFS from many sources at once to get distances to the nearest source',
    ],
    prerequisites: ['Day 21: BFS and DFS'],
    lesson: [
      {
        heading: 'Grids are graphs',
        body: 'Cell (r, c) is a node; its neighbours are (r−1, c), (r, c+1), (r+1, c), (r, c−1). Use `int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};` and check `0 <= nr < R && 0 <= nc < C` **before** indexing. Total work is O(R · C).',
      },
      {
        heading: 'Flood fill',
        body: 'Start at a cell and visit every connected cell of the same kind, marking them (in place or in a visited array). Counting how many times you start a fill gives the number of islands; counting cells per fill gives their areas.',
      },
      {
        heading: 'Multi-source BFS',
        body: 'To get each cell\'s distance to the **nearest** source (rotting fruit, nearest exit, distance to zero), push **all** sources into the queue with distance 0 before starting. BFS then expands from all of them simultaneously — O(R · C) instead of one BFS per source.',
      },
      {
        heading: 'Border tricks',
        body: 'Regions touching the border are often special ("not enclosed"). Flood fill from every border cell first, then whatever remains is enclosed.',
      },
    ],
    recognition: [
      '2D map with walls/water/land and "regions", "islands", "connected" → flood fill.',
      '"Minimum steps" on a grid → BFS from the start.',
      '"Distance to the nearest X" or "time until everything is reached" → multi-source BFS.',
      '"Enclosed" regions → flood from the border first.',
    ],
    patterns: ['grid-traversal', 'multi-source-bfs', 'graph-bfs', 'graph-dfs'],
    visualizations: ['grid-paths'],
    exampleA: {
      id: 'd22-A',
      title: 'Shortest path on a grid with BFS',
      goal: 'Find the fewest moves from S to G avoiding walls.',
      input: 'S..# / .#.. / ...# / #.G.',
      output: 'shortest path length = 5',
      idea: 'Every move costs 1, so BFS from S reaches each cell first along a shortest route. dist[r][c] = −1 marks unvisited cells.',
      code: TRACE_CODE['bfs-grid'],
      keyLines: [
        { match: "if (g[r][c] == 'S') { dist[r][c] = 0; q.push({r, c}); }", note: 'Seed the queue (several S cells would make this multi-source BFS).' },
        { match: 'int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};', note: 'Up, right, down, left.' },
        { match: 'if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;', note: 'Bounds check before touching g[nr][nc].' },
        { match: "if (g[nr][nc] == '#' || dist[nr][nc] != -1) continue;", note: 'Skip walls and already-discovered cells.' },
      ],
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell is enqueued at most once and checks 4 neighbours.' },
      edgeCases: ['G unreachable → −1', 'S equals G', '1×1 grid'],
      mistakes: ['Checking bounds after indexing', 'Swapping rows and columns in the direction arrays'],
      tryIt: 'Allow diagonal moves (8 directions) and compare the answer.',
      trace: { id: 'bfs-grid', input: { grid: ['S..#', '.#..', '...#', '#.G.'] } },
      bug: {
        find: 'dist[nr][nc] = dist[r][c] + 1;',
        replace: 'dist[nr][nc] = dist[r][c];',
        symptom: 'The program prints "shortest path length = 0".',
        explanation: 'Each step away from the start costs one move, so a newly discovered cell is one further than the cell that discovered it. Without + 1 every cell inherits the start\'s distance 0.',
      },
    },
    exampleB: {
      id: 'd22-B',
      kind: 'variant',
      title: 'Count islands with DFS flood fill',
      goal: 'Count groups of horizontally/vertically connected land cells.',
      input: '11000 / 11000 / 00100 / 00011',
      output: 'islands = 3',
      idea: 'Scan every cell. When you find unvisited land, it is a new island: flood-fill it (turn it into water) so it is not counted again.',
      code: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

void sink(vector<string>& g, int r, int c) {
    if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != '1') return;
    g[r][c] = '0';  // mark visited by sinking the land
    sink(g, r + 1, c);
    sink(g, r - 1, c);
    sink(g, r, c + 1);
    sink(g, r, c - 1);
}

int main() {
    vector<string> g = {"11000", "11000", "00100", "00011"};
    int islands = 0;
    for (int r = 0; r < (int)g.size(); r++)
        for (int c = 0; c < (int)g[0].size(); c++)
            if (g[r][c] == '1') {
                islands++;     //@gap
                sink(g, r, c); //@gap
            }
    cout << "islands = " << islands << "\n";
    return 0;
}`,
      keyLines: [
        { match: "if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != '1') return;", note: 'One guard handles bounds, water and already-sunk land.' },
        { match: "g[r][c] = '0';", note: 'Mark in place — no separate visited array needed.' },
        { match: 'islands++;', note: 'Each unvisited land cell found by the scan starts a new island.' },
      ],
      dryRun: {
        columns: ['scan cell', 'land?', 'action', 'islands'],
        rows: [
          ['(0,0)', 'yes', 'sink 4 cells', '1'],
          ['(0,1)…(1,1)', 'sunk', 'skip', '1'],
          ['(2,2)', 'yes', 'sink 1 cell', '2'],
          ['(3,3)', 'yes', 'sink 2 cells', '3'],
        ],
      },
      complexity: { time: 'O(R · C)', space: 'O(R · C) recursion worst case', why: 'Each cell is sunk once; a snake-shaped island can make recursion depth R · C.' },
      edgeCases: ['All water → 0', 'One giant island (deep recursion — BFS is safer for 10⁶ cells)'],
      mistakes: ['Counting diagonal neighbours when the problem says 4-directional', 'Not marking cells before recursing'],
      tryIt: 'Return the area of the largest island (have sink return the number of cells it removed).',
    },
    complexityNotes: 'Grid traversals are O(R · C): every cell is processed once with four neighbour checks. Multi-source BFS keeps that bound regardless of the number of sources.',
    quiz: [
      {
        prompt: 'How many neighbours does a non-border cell have with 4-directional moves?',
        options: ['2', '4', '8', '9'],
        answer: 1,
        explanation: 'Up, down, left and right.',
      },
      {
        prompt: 'You need every cell\'s distance to the nearest exit and there are k exits. Best approach?',
        options: ['k separate BFS runs', 'One BFS with all exits in the queue at distance 0', 'DFS from each cell', 'Dijkstra from each cell'],
        answer: 1,
        explanation: 'Multi-source BFS is O(R · C) total.',
      },
      {
        prompt: 'Why sink land cells (set to \'0\') during flood fill?',
        options: ['To save memory only', 'It marks them visited so the island is counted once and recursion terminates', 'To change the answer', 'It is required by C++'],
        answer: 1,
        explanation: 'Marking prevents revisiting and infinite recursion.',
      },
    ],
    recap: 'Grids are graphs with implicit edges. Flood fill counts and measures regions; BFS gives shortest moves; seeding many sources gives nearest-source distances in one pass.',
    nextPrep: 'Tomorrow: directed graphs and topological sorting for dependency ordering.',
  },
  questions: [
    {
      id: 'd22-flood-fill',
      day: 22,
      title: 'Paint Bucket',
      difficulty: 'Easy',
      topic: 'graphs',
      patterns: ['grid-traversal', 'graph-dfs'],
      objective: 'Recolour a connected region.',
      statement: 'An image is an R×C grid of colour digits. Starting at (sr, sc), recolour the 4-connected region of the starting colour to newColor and print the image.',
      constraints: ['1 ≤ R, C ≤ 50', 'Colours are digits 0–9'],
      examples: [{ input: '111 / 110 / 101, start (1,1), new 2', output: '222\n220\n201' }],
      edgeCases: ['newColor equals the old colour (avoid infinite recursion)'],
      cues: ['Recolour a connected region → flood fill'],
      hints: ['Remember the original colour.', 'If it equals newColor, return immediately.', 'DFS to all 4-neighbours with the original colour.'],
      approach: 'Recursive flood fill.',
      correctness: 'Each cell of the original region is reached by some path of same-coloured cells.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell recoloured once.' },
      cpp: cpp`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

void fill(vector<string>& g, int r, int c, char from, char to) {
    if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != from) return;
    g[r][c] = to;
    fill(g, r + 1, c, from, to);
    fill(g, r - 1, c, from, to);
    fill(g, r, c + 1, from, to);
    fill(g, r, c - 1, from, to);
}`,
      main: cpp`
int main() {
    int R, C, sr, sc;
    char nc;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    cin >> sr >> sc >> nc;
    if (g[sr][sc] != nc) fill(g, sr, sc, g[sr][sc], nc);
    for (auto& row : g) cout << row << "\n";
    return 0;
}`,
      io: 'Input: R C, R rows of digits, then sr sc newColor. Output: the image.',
      keyLines: [{ match: 'if (g[sr][sc] != nc) fill(g, sr, sc, g[sr][sc], nc);', note: 'Same colour → nothing to do (and no infinite recursion).' }],
      mistakes: ['Recursing when old == new colour'],
      tests: [
        { in: '3 3\n111\n110\n101\n1 1 2', out: '222\n220\n201' },
        { in: '2 2\n00\n00\n0 0 0', out: '00\n00' },
        { in: '1 1\n5\n0 0 7', out: '7' },
        { in: '2 3\n121\n111\n0 1 3', out: '131\n111' },
      ],
      viz: 'grid-paths',
    },
    {
      id: 'd22-islands',
      day: 22,
      title: 'Count the Islands',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['grid-traversal', 'graph-bfs'],
      objective: 'Count regions with BFS flood fill (no recursion limits).',
      statement: 'Count the islands (4-connected groups of 1s) in an R×C grid.',
      constraints: ['1 ≤ R, C ≤ 300'],
      examples: [{ input: '11110 / 11010 / 11000 / 00000', output: '1' }],
      edgeCases: ['All water', 'Checkerboard'],
      cues: ['Connected regions → flood fill per unvisited land cell'],
      hints: ['Scan cells; on a 1, BFS and sink the island.'],
      approach: 'BFS flood fill.',
      correctness: 'Each island triggers exactly one fill.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell enqueued at most once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

int countIslands(vector<string> g) {
    int R = g.size(), C = g[0].size(), islands = 0;
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (g[r][c] != '1') continue;
            islands++;
            queue<pair<int, int>> q;
            q.push({r, c});
            g[r][c] = '0';
            while (!q.empty()) {
                auto [x, y] = q.front();
                q.pop();
                for (int k = 0; k < 4; k++) {
                    int nx = x + dr[k], ny = y + dc[k];
                    if (nx < 0 || ny < 0 || nx >= R || ny >= C || g[nx][ny] != '1') continue;
                    g[nx][ny] = '0';
                    q.push({nx, ny});
                }
            }
        }
    return islands;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    cout << countIslands(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then R rows of 0/1. Output: number of islands.',
      keyLines: [{ match: "g[nx][ny] = '0';", note: 'Mark when enqueuing to avoid duplicates.' }],
      mistakes: ['Marking when dequeuing (cells enqueued twice)'],
      tests: [
        { in: '4 5\n11110\n11010\n11000\n00000', out: '1' },
        { in: '4 5\n11000\n11000\n00100\n00011', out: '3' },
        { in: '1 1\n0', out: '0' },
        { in: '3 3\n101\n010\n101', out: '5' },
      ],
    },
    {
      id: 'd22-max-area',
      day: 22,
      title: 'Largest Island Area',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['grid-traversal', 'graph-dfs'],
      objective: 'Return sizes from a flood fill.',
      statement: 'Print the area (number of cells) of the largest island of 1s, or 0 if there is none.',
      constraints: ['1 ≤ R, C ≤ 50'],
      examples: [{ input: '0110 / 0100 / 0011', output: '3' }],
      edgeCases: ['No land', 'Whole grid is land'],
      cues: ['Region size → flood fill returning a count'],
      hints: ['area(r, c) = 1 + area of the four neighbours (0 for water/out of bounds).'],
      approach: 'Recursive flood fill that sinks cells and returns the count.',
      correctness: 'Every cell of an island is counted exactly once.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int area(vector<string>& g, int r, int c) {
    if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != '1') return 0;
    g[r][c] = '0';
    return 1 + area(g, r + 1, c) + area(g, r - 1, c) + area(g, r, c + 1) + area(g, r, c - 1);
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    int best = 0;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) best = max(best, area(g, r, c));
    cout << best << "\n";
    return 0;
}`,
      io: 'Input: R C, then R rows. Output: largest area.',
      keyLines: [{ match: 'return 1 + area(g, r + 1, c) + area(g, r - 1, c) + area(g, r, c + 1) + area(g, r, c - 1);', note: 'Sum the sizes of the connected parts.' }],
      mistakes: ['Not sinking cells (double counting)'],
      tests: [
        { in: '3 4\n0110\n0100\n0011', out: '3' },
        { in: '2 2\n00\n00', out: '0' },
        { in: '2 2\n11\n11', out: '4' },
        { in: '3 3\n101\n111\n001', out: '6' },
      ],
    },
    {
      id: 'd22-rotting',
      day: 22,
      title: 'Spreading Rot',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['multi-source-bfs', 'grid-traversal'],
      objective: 'Simultaneous spread from all sources.',
      statement: 'Grid cells: 0 empty, 1 fresh fruit, 2 rotten. Each minute, rotten fruit rots its 4 neighbours. Print the minutes until no fresh fruit remains, or -1 if impossible.',
      constraints: ['1 ≤ R, C ≤ 100'],
      examples: [{ input: '211 / 110 / 011', output: '4' }],
      edgeCases: ['No fresh fruit → 0', 'Isolated fresh fruit → -1'],
      cues: ['Spread from many sources at once → multi-source BFS by levels'],
      hints: ['Push every rotten cell first.', 'Count fresh fruit; decrement when they rot.', 'Track minutes as BFS levels.'],
      approach: 'Multi-source BFS with level counting.',
      correctness: 'Each fresh fruit rots at its BFS distance from the nearest initially rotten fruit.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell enqueued once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int minutesToRot(vector<vector<int>> g) {
    int R = g.size(), C = g[0].size(), fresh = 0;
    queue<pair<int, int>> q;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (g[r][c] == 2) q.push({r, c});
            if (g[r][c] == 1) fresh++;
        }
    int minutes = 0, dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!q.empty() && fresh > 0) {
        int size = q.size();
        while (size--) {
            auto [r, c] = q.front();
            q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] != 1) continue;
                g[nr][nc] = 2;
                fresh--;
                q.push({nr, nc});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << minutesToRot(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid as numbers. Output: minutes or -1.',
      keyLines: [{ match: 'while (!q.empty() && fresh > 0) {', note: 'Stop as soon as nothing fresh remains (otherwise we over-count a minute).' }],
      mistakes: ['Counting an extra minute after the last fruit rots'],
      tests: [
        { in: '3 3\n2 1 1\n1 1 0\n0 1 1', out: '4' },
        { in: '3 3\n2 1 1\n0 1 1\n1 0 1', out: '-1' },
        { in: '1 2\n0 2', out: '0' },
        { in: '1 3\n2 1 2', out: '1' },
      ],
    },
    {
      id: 'd22-zero-one-matrix',
      day: 22,
      title: 'Distance to the Nearest Zero',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['multi-source-bfs'],
      objective: 'Nearest-source distances for every cell.',
      statement: 'For each cell of a 0/1 matrix print the distance (in 4-directional steps) to the nearest 0.',
      constraints: ['1 ≤ R, C ≤ 300', 'At least one 0'],
      examples: [{ input: '000 / 010 / 111', output: '0 0 0\n0 1 0\n1 2 1' }],
      edgeCases: ['All zeros', 'Single zero in a corner'],
      cues: ['Nearest of many sources → push all zeros first'],
      hints: ['dist = 0 for zeros, −1 for ones; push all zeros.', 'BFS fills each one with dist of the cell that discovered it + 1.'],
      approach: 'Multi-source BFS.',
      correctness: 'BFS from all zeros discovers each cell first via a nearest zero.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell once.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<vector<int>> nearestZero(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<int>> d(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == 0) {
                d[r][c] = 0;
                q.push({r, c});
            }
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || d[nr][nc] != -1) continue;
            d[nr][nc] = d[r][c] + 1;
            q.push({nr, nc});
        }
    }
    return d;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    for (auto& row : nearestZero(g))
        for (int c = 0; c < C; c++) cout << row[c] << (c + 1 < C ? " " : "\n");
    return 0;
}`,
      io: 'Input: R C, then the matrix. Output: the distance matrix.',
      keyLines: [{ match: 'd[nr][nc] = d[r][c] + 1;', note: 'First discovery is the nearest-zero distance.' }],
      mistakes: ['BFS from each 1 separately (O((RC)²))'],
      tests: [
        { in: '3 3\n0 0 0\n0 1 0\n1 1 1', out: '0 0 0\n0 1 0\n1 2 1' },
        { in: '1 1\n0', out: '0' },
        { in: '2 3\n1 1 1\n1 1 0', out: '3 2 1\n2 1 0' },
        { in: '1 4\n0 1 1 0', out: '0 1 1 0' },
      ],
    },
    {
      id: 'd22-closed-islands',
      day: 22,
      title: 'Lakes Fully Surrounded',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['grid-traversal', 'graph-dfs'],
      objective: 'Eliminate border-connected regions first.',
      statement: 'In a grid of land (0) and water (1), count land regions that do not touch the grid border (4-directional).',
      constraints: ['1 ≤ R, C ≤ 100'],
      examples: [{ input: '11111 / 10001 / 10101 / 10001 / 11111', output: '1' }],
      edgeCases: ['All land touching the border → 0'],
      cues: ['"Not touching the border" → flood the border regions first'],
      hints: ['Sink every land region reachable from the border.', 'Count the remaining land regions.'],
      approach: 'Border flood fill, then count.',
      correctness: 'After removing border-connected land, every remaining region is closed.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell once.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

void sink(vector<vector<int>>& g, int r, int c) {
    if (r < 0 || c < 0 || r >= (int)g.size() || c >= (int)g[0].size() || g[r][c] != 0) return;
    g[r][c] = 1;
    sink(g, r + 1, c);
    sink(g, r - 1, c);
    sink(g, r, c + 1);
    sink(g, r, c - 1);
}

int closedIslands(vector<vector<int>> g) {
    int R = g.size(), C = g[0].size();
    for (int r = 0; r < R; r++) {
        sink(g, r, 0);
        sink(g, r, C - 1);
    }
    for (int c = 0; c < C; c++) {
        sink(g, 0, c);
        sink(g, R - 1, c);
    }
    int count = 0;
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (g[r][c] == 0) {
                count++;
                sink(g, r, c);
            }
    return count;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << closedIslands(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid (0 land, 1 water). Output: number of closed islands.',
      keyLines: [{ match: 'sink(g, r, 0);', note: 'Remove land connected to the left border.' }],
      mistakes: ['Counting border-touching regions'],
      tests: [
        { in: '5 5\n1 1 1 1 1\n1 0 0 0 1\n1 0 1 0 1\n1 0 0 0 1\n1 1 1 1 1', out: '1' },
        { in: '3 3\n0 0 0\n0 1 0\n0 0 0', out: '0' },
        { in: '5 7\n1 1 1 1 1 1 1\n1 0 1 1 0 0 1\n1 1 1 1 1 0 1\n1 0 1 1 1 1 1\n1 1 1 1 1 1 1', out: '3' },
        { in: '1 1\n0', out: '0' },
      ],
    },
    {
      id: 'd22-pacific-atlantic',
      day: 22,
      title: 'Water Flowing to Both Oceans',
      difficulty: 'Medium',
      topic: 'graphs',
      patterns: ['multi-source-bfs', 'grid-traversal'],
      objective: 'Reverse the flow direction and search from the targets.',
      statement: 'Heights form an R×C island. The Pacific touches the top and left edges, the Atlantic the bottom and right edges. Water flows to a neighbour with height ≤ the current one. Print the cells (row col, row-major order) from which water can reach both oceans.',
      constraints: ['1 ≤ R, C ≤ 200'],
      examples: [{ input: '3×3: 1 2 3 / 8 9 4 / 7 6 5', output: '0 2\n1 0\n1 1\n1 2\n2 0\n2 1\n2 2' }],
      edgeCases: ['1×1 grid', 'Flat island (all equal)'],
      cues: ['"Can reach the border" for every cell → search backwards from the border'],
      hints: ['From each ocean\'s border cells, BFS uphill (to neighbours with height ≥ current).', 'A cell is an answer if both searches reached it.'],
      approach: 'Two multi-source BFS runs on the reversed flow condition.',
      correctness: 'Water flows from x to the ocean iff the ocean reaches x by moving uphill.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Two BFS runs.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

vector<vector<bool>> reach(const vector<vector<int>>& h, const vector<pair<int, int>>& seeds) {
    int R = h.size(), C = h[0].size();
    vector<vector<bool>> seen(R, vector<bool>(C, false));
    queue<pair<int, int>> q;
    for (auto [r, c] : seeds)
        if (!seen[r][c]) {
            seen[r][c] = true;
            q.push({r, c});
        }
    int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen[nr][nc] || h[nr][nc] < h[r][c]) continue;
            seen[nr][nc] = true;
            q.push({nr, nc});
        }
    }
    return seen;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> h(R, vector<int>(C));
    for (auto& row : h)
        for (auto& x : row) cin >> x;
    vector<pair<int, int>> pac, atl;
    for (int r = 0; r < R; r++) {
        pac.push_back({r, 0});
        atl.push_back({r, C - 1});
    }
    for (int c = 0; c < C; c++) {
        pac.push_back({0, c});
        atl.push_back({R - 1, c});
    }
    auto P = reach(h, pac), A = reach(h, atl);
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (P[r][c] && A[r][c]) cout << r << " " << c << "\n";
    return 0;
}`,
      io: 'Input: R C, then heights. Output: qualifying cells, one "r c" per line.',
      keyLines: [{ match: 'if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen[nr][nc] || h[nr][nc] < h[r][c]) continue;', note: 'Reverse flow: we may only climb (or stay level).' }],
      mistakes: ['Running a search from every cell (O((RC)²))'],
      tests: [
        { in: '3 3\n1 2 3\n8 9 4\n7 6 5', out: '0 2\n1 0\n1 1\n1 2\n2 0\n2 1\n2 2' },
        { in: '1 1\n5', out: '0 0' },
        { in: '2 2\n1 1\n1 1', out: '0 0\n0 1\n1 0\n1 1' },
        { in: '2 2\n3 1\n1 3', out: '0 0\n0 1\n1 0\n1 1' },
      ],
    },
    {
      id: 'd22-shortest-bridge',
      day: 22,
      title: 'Shortest Bridge Between Two Islands',
      difficulty: 'Hard',
      topic: 'graphs',
      patterns: ['multi-source-bfs', 'grid-traversal', 'graph-dfs'],
      objective: 'Flood one island, then BFS outward from all its cells.',
      statement: 'An N×N grid contains exactly two islands of 1s. Print the minimum number of 0s that must be flipped to connect them.',
      constraints: ['2 ≤ N ≤ 100'],
      examples: [{ input: '010 / 000 / 001', output: '2' }],
      edgeCases: ['Islands diagonally adjacent (answer 1)'],
      cues: ['Distance between two regions → multi-source BFS from one region'],
      hints: ['Find one island with DFS and mark it (e.g. 2), pushing its cells into a queue.', 'BFS outward over water; the first time you touch a 1, the level is the answer.'],
      approach: 'DFS to label island A, then multi-source BFS from all of A.',
      correctness: 'BFS levels equal the number of water cells crossed, so the first contact is minimal.',
      complexity: { time: 'O(N²)', space: 'O(N²)', why: 'Each cell processed a constant number of times.' },
      cpp: cpp`
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int N;
vector<vector<int>> g;
queue<pair<int, int>> q;
int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};

void mark(int r, int c) {
    if (r < 0 || c < 0 || r >= N || c >= N || g[r][c] != 1) return;
    g[r][c] = 2;
    q.push({r, c});
    for (int k = 0; k < 4; k++) mark(r + dr[k], c + dc[k]);
}

int shortestBridge() {
    bool found = false;
    for (int r = 0; r < N && !found; r++)
        for (int c = 0; c < N && !found; c++)
            if (g[r][c] == 1) {
                mark(r, c);
                found = true;
            }
    for (int steps = 0; !q.empty(); steps++) {
        int size = q.size();
        while (size--) {
            auto [r, c] = q.front();
            q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nc < 0 || nr >= N || nc >= N || g[nr][nc] == 2) continue;
                if (g[nr][nc] == 1) return steps;
                g[nr][nc] = 2;
                q.push({nr, nc});
            }
        }
    }
    return -1;
}`,
      main: cpp`
int main() {
    cin >> N;
    g.assign(N, vector<int>(N));
    for (auto& row : g)
        for (auto& x : row) cin >> x;
    cout << shortestBridge() << "\n";
    return 0;
}`,
      io: 'Input: N, then the N×N grid. Output: minimum flips.',
      keyLines: [{ match: 'if (g[nr][nc] == 1) return steps;', note: 'Touching the other island: steps water cells were crossed.' }],
      mistakes: ['Starting BFS from a single cell of the first island'],
      tests: [
        { in: '3\n0 1 0\n0 0 0\n0 0 1', out: '2' },
        { in: '2\n0 1\n1 0', out: '1' },
        { in: '5\n1 1 1 1 1\n1 0 0 0 1\n1 0 1 0 1\n1 0 0 0 1\n1 1 1 1 1', out: '1' },
        { in: '4\n1 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 1', out: '5' },
      ],
    },
  ],
};

export default day;
