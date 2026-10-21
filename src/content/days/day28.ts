import type { DayModule } from '../../types/content';
import { cpp } from '../cpp';

const day: DayModule = {
  day: {
    day: 28,
    title: 'Grid DP: Paths, Obstacles and Minimum Cost',
    zone: 'dynamic-programming',
    objectives: [
      'Define dp[r][c] for grids where moves only go right or down',
      'Handle obstacles and first-row/first-column base cases correctly',
      'Reconstruct an optimal path from a filled table',
      'Compress a 2D table to one row',
    ],
    prerequisites: ['Day 26: DP recipe', 'Day 22: grids as graphs'],
    lesson: [
      {
        heading: 'Why grids are DP-friendly',
        body: 'If moves only go right or down, a cell can only be reached from the cell above or the cell to its left. The dependency graph is acyclic and row-major order computes dependencies first: `dp[r][c] = combine(dp[r−1][c], dp[r][c−1]) + cell`.',
      },
      {
        heading: 'Counting vs optimising',
        body: '- Counting paths: `dp[r][c] = dp[r−1][c] + dp[r][c−1]` (0 at obstacles).\n- Minimum cost: `dp[r][c] = grid[r][c] + min(dp[r−1][c], dp[r][c−1])`.\n- Maximum value or feasibility: replace + / min with max or OR.',
      },
      {
        heading: 'Boundaries',
        body: 'The first row has only a left neighbour and the first column only an upper one. Instead of special loops, treat out-of-grid neighbours as 0 (counting) or +∞ (minimising). An obstacle at the start means zero paths.',
      },
      {
        heading: 'One-row compression',
        body: 'Row r only depends on row r − 1 and itself, so one array `row[c]` suffices: before updating, `row[c]` still holds the value from above and `row[c−1]` already holds the new left value.',
      },
      {
        heading: 'Moves in all directions',
        body: 'If moves can go up and left as well, cycles appear and plain DP no longer works — use BFS or Dijkstra instead (Days 22 and 25).',
      },
    ],
    recognition: [
      'Grid + "only right/down" + "count paths" or "minimum sum" → grid DP.',
      'Triangles and pyramids (move to adjacent positions below) → bottom-up DP.',
      'Largest square / rectangle of 1s → dp over the bottom-right corner.',
    ],
    patterns: ['grid-dp', 'dp-2d', 'tabulation'],
    visualizations: ['dp'],
    exampleA: {
      id: 'd28-A',
      title: 'Count paths around obstacles',
      goal: 'Count right/down paths from the top-left to the bottom-right cell, avoiding obstacles.',
      input: 'grid 0000 / 0100 / 0001 / 1000 (1 = obstacle)',
      output: 'paths = 3',
      idea: 'Each open cell is reached either from above or from the left, so its count is the sum of those two counts. Obstacles hold 0.',
      code: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long countPaths(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<long long>> dp(R, vector<long long>(C, 0));
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (g[r][c] == 1) continue;  // obstacle: 0 paths
            if (r == 0 && c == 0) {
                dp[r][c] = 1;
                continue;
            }
            long long up = r > 0 ? dp[r - 1][c] : 0;    //@gap
            long long left = c > 0 ? dp[r][c - 1] : 0;  //@gap
            dp[r][c] = up + left;
        }
    return dp[R - 1][C - 1];
}

int main() {
    vector<vector<int>> g = {{0, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 0, 1}, {1, 0, 0, 0}};
    cout << "paths = " << countPaths(g) << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'if (g[r][c] == 1) continue;  // obstacle: 0 paths', note: 'dp stays 0 for blocked cells.' },
        { match: 'dp[r][c] = 1;', note: 'Base case: one way to stand on the (open) start.' },
        { match: 'long long up = r > 0 ? dp[r - 1][c] : 0;', note: 'Out-of-grid neighbours contribute 0.' },
        { match: 'dp[r][c] = up + left;', note: 'Transition: last move came from above or from the left.' },
      ],
      dryRun: {
        columns: ['row', 'dp values'],
        rows: [
          ['0', '1 1 1 1'],
          ['1', '1 0 1 2'],
          ['2', '1 1 2 0'],
          ['3', '0 1 3 3'],
        ],
      },
      complexity: { time: 'O(R · C)', space: 'O(R · C), reducible to O(C)', why: 'Each cell computed once from two neighbours.' },
      edgeCases: ['Obstacle on the start or the goal → 0', 'Single row or column', 'Large grids overflow — use a modulus'],
      mistakes: ['Initialising the whole first row to 1 even after an obstacle', 'Swapping r and c bounds'],
      tryIt: 'Use a single vector<long long> row(C) instead of the 2D table.',
      bug: {
        find: 'long long left = c > 0 ? dp[r][c - 1] : 0;',
        replace: 'long long left = c > 0 ? dp[r - 1][c - 1] : 0;',
        symptom: 'The program crashes or reads out of bounds for row 0 (dp[−1]) — with sanitizers it reports a memory error.',
        explanation: 'The left neighbour of (r, c) is (r, c − 1). Using the diagonal (r − 1, c − 1) reads row −1 on the first row and counts the wrong moves.',
      },
    },
    exampleB: {
      id: 'd28-B',
      kind: 'variant',
      title: 'Minimum path sum with path reconstruction',
      goal: 'Find the cheapest right/down path and print the cells it uses.',
      input: 'grid 1 3 1 / 1 5 1 / 4 2 1',
      output: 'min sum = 7\npath: (0,0) (0,1) (0,2) (1,2) (2,2)',
      idea: 'dp[r][c] = grid[r][c] + min(cost from above, cost from left). Walking back from the goal, always step to the neighbour that produced the minimum.',
      code: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<vector<int>> g = {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    int R = g.size(), C = g[0].size();
    vector<vector<long long>> dp(R, vector<long long>(C, LLONG_MAX));
    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++) {
            if (r == 0 && c == 0) {
                dp[r][c] = g[r][c];
                continue;
            }
            long long best = LLONG_MAX;
            if (r > 0) best = min(best, dp[r - 1][c]);
            if (c > 0) best = min(best, dp[r][c - 1]);
            dp[r][c] = best + g[r][c];
        }
    cout << "min sum = " << dp[R - 1][C - 1] << "\n";
    vector<pair<int, int>> path;
    int r = R - 1, c = C - 1;
    while (true) {
        path.push_back({r, c});
        if (r == 0 && c == 0) break;
        if (c == 0 || (r > 0 && dp[r - 1][c] <= dp[r][c - 1])) r--;  // came from above
        else c--;                                                     // came from the left
    }
    reverse(path.begin(), path.end());
    cout << "path:";
    for (auto [pr, pc] : path) cout << " (" << pr << "," << pc << ")";
    cout << "\n";
    return 0;
}`,
      keyLines: [
        { match: 'dp[r][c] = best + g[r][c];', note: 'Cheapest way into this cell.' },
        { match: 'if (c == 0 || (r > 0 && dp[r - 1][c] <= dp[r][c - 1])) r--;', note: 'Step back toward the neighbour that achieved the minimum (ties prefer "above").' },
        { match: 'reverse(path.begin(), path.end());', note: 'The walk collects cells from goal to start.' },
      ],
      dryRun: {
        columns: ['row', 'dp values'],
        rows: [
          ['0', '1 4 5'],
          ['1', '2 7 6'],
          ['2', '6 8 7'],
        ],
      },
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Full table kept for reconstruction.' },
      edgeCases: ['Ties between two optimal paths (pick a rule and stick to it)', '1×1 grid'],
      mistakes: ['Reconstructing by greedily choosing the cheaper next cell going forward (not the same as DP backtracking)'],
      tryIt: 'Break ties toward "left" instead and see whether the printed path changes.',
    },
    complexityNotes: 'Grid DP is O(R · C) time. Counting only needs one row; reconstruction needs the full table (or stored decisions).',
    quiz: [
      {
        prompt: 'With moves right/down only, which cells does dp[r][c] depend on?',
        options: ['All neighbours', 'dp[r−1][c] and dp[r][c−1]', 'dp[r+1][c] and dp[r][c+1]', 'The diagonal only'],
        answer: 1,
        explanation: 'Those are the only cells that can move into (r, c).',
      },
      {
        prompt: 'If moves may go in all four directions, is grid DP still valid?',
        options: ['Yes', 'No — dependencies form cycles; use BFS/Dijkstra', 'Only for counting', 'Only for 1×n grids'],
        answer: 1,
        explanation: 'DP needs an acyclic order of states.',
      },
      {
        prompt: 'In the one-row version, before updating row[c], what does row[c] contain?',
        options: ['The value from the left', 'The value from the previous row (above)', 'Zero', 'The final answer'],
        answer: 1,
        explanation: 'It has not been overwritten for the current row yet.',
      },
    ],
    recap: 'Grid DP fills cells in row-major order from up and left neighbours. Obstacles are zeros, boundaries are 0 or ∞, and decisions can be traced back from the goal.',
    nextPrep: 'Tomorrow: knapsack and subset-sum — DP over items and capacity.',
  },
  questions: [
    {
      id: 'd28-unique-paths',
      day: 28,
      title: 'Routes Across a Plaza',
      difficulty: 'Easy',
      topic: 'dynamic-programming',
      patterns: ['grid-dp'],
      objective: 'Count right/down paths with one rolling row.',
      statement: 'Count the paths from the top-left to the bottom-right corner of an R×C grid moving only right or down.',
      constraints: ['1 ≤ R, C ≤ 100 (answer fits in 64-bit for these inputs)'],
      examples: [{ input: 'R=3, C=7', output: '28' }],
      edgeCases: ['1×n grid → 1'],
      cues: ['Right/down moves + count → grid DP'],
      hints: ['row[c] += row[c − 1] for each row.'],
      approach: 'Rolling 1D array.',
      correctness: 'Each update adds paths from the left to paths from above.',
      complexity: { time: 'O(R · C)', space: 'O(C)', why: 'One row reused.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long uniquePaths(int R, int C) {
    vector<long long> row(C, 1);
    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++) row[c] += row[c - 1];
    return row[C - 1];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    cout << uniquePaths(R, C) << "\n";
    return 0;
}`,
      io: 'Input: R C. Output: number of paths.',
      keyLines: [{ match: 'for (int c = 1; c < C; c++) row[c] += row[c - 1];', note: 'row[c] (above) + row[c − 1] (left, already updated).' }],
      mistakes: ['Computing C(R+C−2, R−1) with factorials (overflow)'],
      tests: [
        { in: '3 7', out: '28' },
        { in: '3 2', out: '3' },
        { in: '1 1', out: '1' },
        { in: '10 10', out: '48620' },
      ],
      viz: 'dp',
    },
    {
      id: 'd28-obstacles',
      day: 28,
      title: 'Paths Around Roadblocks',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp'],
      objective: 'Handle obstacles in grid counting.',
      statement: 'Count right/down paths in a grid of 0 (open) and 1 (obstacle) from top-left to bottom-right.',
      constraints: ['1 ≤ R, C ≤ 100', 'Answer < 2·10⁹'],
      examples: [{ input: '000 / 010 / 000', output: '2' }],
      edgeCases: ['Obstacle at start or goal', 'Obstacle row that blocks everything'],
      cues: ['Grid counting with blocked cells'],
      hints: ['Set dp to 0 on obstacles.', 'Use one row: row[c] = 0 if blocked else row[c] + row[c−1].'],
      approach: 'Rolling row with obstacle resets.',
      correctness: 'Blocked cells contribute nothing to their neighbours.',
      complexity: { time: 'O(R · C)', space: 'O(C)', why: 'One pass.' },
      cpp: cpp`
#include <iostream>
#include <vector>
using namespace std;

long long pathsWithObstacles(const vector<vector<int>>& g) {
    int C = g[0].size();
    vector<long long> row(C, 0);
    row[0] = 1;
    for (auto& line : g)
        for (int c = 0; c < C; c++) {
            if (line[c] == 1) row[c] = 0;
            else if (c > 0) row[c] += row[c - 1];
        }
    return row[C - 1];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& r : g)
        for (auto& x : r) cin >> x;
    cout << pathsWithObstacles(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid. Output: number of paths.',
      keyLines: [{ match: 'if (line[c] == 1) row[c] = 0;', note: 'Obstacles erase whatever came from above.' }],
      mistakes: ['Not handling an obstacle at (0,0)'],
      tests: [
        { in: '3 3\n0 0 0\n0 1 0\n0 0 0', out: '2' },
        { in: '2 2\n0 1\n0 0', out: '1' },
        { in: '1 1\n1', out: '0' },
        { in: '4 4\n0 0 0 0\n0 1 0 0\n0 0 0 1\n1 0 0 0', out: '3' },
      ],
    },
    {
      id: 'd28-min-path-sum',
      day: 28,
      title: 'Cheapest Path Through a Toll Grid',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp'],
      objective: 'Minimisation grid DP.',
      statement: 'Each cell has a non-negative toll. Moving only right or down, print the minimum total toll from top-left to bottom-right (both corners included).',
      constraints: ['1 ≤ R, C ≤ 200', '0 ≤ toll ≤ 200'],
      examples: [{ input: '131 / 151 / 421', output: '7' }],
      edgeCases: ['Single cell', 'Single row'],
      cues: ['Minimum sum with right/down moves'],
      hints: ['dp[r][c] = toll + min(up, left).', 'Treat missing neighbours as +∞.'],
      approach: 'Rolling row with INF boundaries.',
      correctness: 'Optimal substructure: the best path to a cell extends the best path to one of its predecessors.',
      complexity: { time: 'O(R · C)', space: 'O(C)', why: 'One row.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

long long minPathSum(const vector<vector<int>>& g) {
    int C = g[0].size();
    vector<long long> row(C, LLONG_MAX / 2);
    row[0] = 0;
    for (auto& line : g) {
        row[0] += line[0];
        for (int c = 1; c < C; c++) row[c] = min(row[c], row[c - 1]) + line[c];
    }
    return row[C - 1];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& r : g)
        for (auto& x : r) cin >> x;
    cout << minPathSum(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the tolls. Output: minimum total.',
      keyLines: [{ match: 'vector<long long> row(C, LLONG_MAX / 2);', note: 'Half of max avoids overflow when adding a toll to "infinity".' }],
      mistakes: ['LLONG_MAX + toll overflow'],
      tests: [
        { in: '3 3\n1 3 1\n1 5 1\n4 2 1', out: '7' },
        { in: '2 3\n1 2 3\n4 5 6', out: '12' },
        { in: '1 1\n5', out: '5' },
        { in: '3 1\n1\n2\n3', out: '6' },
      ],
    },
    {
      id: 'd28-triangle',
      day: 28,
      title: 'Descending a Number Pyramid',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp', 'dp-2d'],
      objective: 'Bottom-up DP that avoids edge cases.',
      statement: 'A triangle has row i with i + 1 numbers. From the top, move to one of the two adjacent numbers below. Print the minimum path sum to the bottom.',
      constraints: ['1 ≤ rows ≤ 200', '−10⁴ ≤ value ≤ 10⁴'],
      examples: [{ input: '2 / 3 4 / 6 5 7 / 4 1 8 3', output: '11' }],
      edgeCases: ['Single row', 'Negative numbers'],
      cues: ['Choices go down to adjacent positions → bottom-up DP'],
      hints: ['Start from the bottom row.', 'best[j] = value + min(best[j], best[j + 1]) for the row above.'],
      approach: 'Bottom-up with one array.',
      correctness: 'best[j] after processing row i is the minimum path sum from (i, j) to the bottom.',
      complexity: { time: 'O(n²)', space: 'O(n)', why: 'Each number processed once.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long minTriangle(const vector<vector<int>>& t) {
    vector<long long> best(t.back().begin(), t.back().end());
    for (int i = (int)t.size() - 2; i >= 0; i--)
        for (int j = 0; j <= i; j++) best[j] = t[i][j] + min(best[j], best[j + 1]);
    return best[0];
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> t(n);
    for (int i = 0; i < n; i++) {
        t[i].resize(i + 1);
        for (auto& x : t[i]) cin >> x;
    }
    cout << minTriangle(t) << "\n";
    return 0;
}`,
      io: 'Input: n, then the triangle rows. Output: minimum path sum.',
      keyLines: [{ match: 'best[j] = t[i][j] + min(best[j], best[j + 1]);', note: 'Bottom-up means no boundary special cases.' }],
      mistakes: ['Greedy choice of the smaller child at each step'],
      tests: [
        { in: '4\n2\n3 4\n6 5 7\n4 1 8 3', out: '11' },
        { in: '1\n-10', out: '-10' },
        { in: '2\n1\n2 3', out: '3' },
        { in: '3\n-1\n2 3\n1 -1 -3', out: '-1' },
      ],
    },
    {
      id: 'd28-maximal-square',
      day: 28,
      title: 'Largest Square Plot',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp', 'dp-2d'],
      objective: 'dp over the bottom-right corner of a square.',
      statement: 'In a 0/1 grid, print the area of the largest square containing only 1s.',
      constraints: ['1 ≤ R, C ≤ 300'],
      examples: [{ input: '10100 / 10111 / 11111 / 10010', output: '4' }],
      edgeCases: ['No 1s → 0', 'All 1s'],
      cues: ['Largest square ending at (r, c) depends on up, left and diagonal'],
      hints: ['side[r][c] = 1 + min(up, left, diagonal) for a 1-cell.'],
      approach: 'Tabulation with a padded table.',
      correctness: 'A square of side k ends at (r, c) iff the three neighbouring squares all have side ≥ k − 1.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int maximalSquare(const vector<string>& g) {
    int R = g.size(), C = g[0].size(), best = 0;
    vector<vector<int>> side(R + 1, vector<int>(C + 1, 0));
    for (int r = 1; r <= R; r++)
        for (int c = 1; c <= C; c++)
            if (g[r - 1][c - 1] == '1') {
                side[r][c] = 1 + min({side[r - 1][c], side[r][c - 1], side[r - 1][c - 1]});
                best = max(best, side[r][c]);
            }
    return best * best;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    cout << maximalSquare(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then R rows of 0/1 characters. Output: largest area.',
      keyLines: [{ match: 'side[r][c] = 1 + min({side[r - 1][c], side[r][c - 1], side[r - 1][c - 1]});', note: 'Limited by the smallest of the three neighbouring squares.' }],
      mistakes: ['Returning the side instead of the area'],
      tests: [
        { in: '4 5\n10100\n10111\n11111\n10010', out: '4' },
        { in: '2 2\n01\n10', out: '1' },
        { in: '1 1\n0', out: '0' },
        { in: '3 3\n111\n111\n111', out: '9' },
      ],
    },
    {
      id: 'd28-falling-path',
      day: 28,
      title: 'Minimum Falling Path',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp'],
      objective: 'Grid DP with three predecessors.',
      statement: 'In an n×n matrix, a falling path starts in any cell of the first row and moves to the next row in the same column or a diagonally adjacent one. Print the minimum sum.',
      constraints: ['1 ≤ n ≤ 100', '−100 ≤ value ≤ 100'],
      examples: [{ input: '2 1 3 / 6 5 4 / 7 8 9', output: '13' }],
      edgeCases: ['n = 1', 'Negative values'],
      cues: ['Row-by-row with neighbours above → DP over rows'],
      hints: ['dp[r][c] = val + min(dp[r−1][c−1], dp[r−1][c], dp[r−1][c+1]).'],
      approach: 'Row-by-row DP with a copy of the previous row.',
      correctness: 'Each cell is reached from one of at most three cells above.',
      complexity: { time: 'O(n²)', space: 'O(n)', why: 'Two rows.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int minFalling(const vector<vector<int>>& a) {
    int n = a.size();
    vector<int> prev = a[0];
    for (int r = 1; r < n; r++) {
        vector<int> cur(n);
        for (int c = 0; c < n; c++) {
            int best = prev[c];
            if (c > 0) best = min(best, prev[c - 1]);
            if (c + 1 < n) best = min(best, prev[c + 1]);
            cur[c] = a[r][c] + best;
        }
        prev = cur;
    }
    return *min_element(prev.begin(), prev.end());
}`,
      main: cpp`
int main() {
    int n;
    cin >> n;
    vector<vector<int>> a(n, vector<int>(n));
    for (auto& r : a)
        for (auto& x : r) cin >> x;
    cout << minFalling(a) << "\n";
    return 0;
}`,
      io: 'Input: n, then the matrix. Output: minimum falling path sum.',
      keyLines: [{ match: 'vector<int> cur(n);', note: 'A separate row: updating prev in place would mix rows.' }],
      mistakes: ['In-place updates that read already-updated neighbours'],
      tests: [
        { in: '3\n2 1 3\n6 5 4\n7 8 9', out: '13' },
        { in: '2\n-19 57\n-40 -5', out: '-59' },
        { in: '1\n7', out: '7' },
        { in: '3\n1 2 3\n4 5 6\n7 8 9', out: '12' },
      ],
    },
    {
      id: 'd28-count-squares',
      day: 28,
      title: 'Count All Square Plots',
      difficulty: 'Medium',
      topic: 'dynamic-programming',
      patterns: ['grid-dp'],
      objective: 'Sum the "largest square ending here" values.',
      statement: 'Count all square submatrices containing only 1s in a 0/1 grid.',
      constraints: ['1 ≤ R, C ≤ 300'],
      examples: [{ input: '0111 / 1111 / 0111', output: '15' }],
      edgeCases: ['All zeros', 'Single 1'],
      cues: ['side[r][c] squares end at (r, c) — sizes 1..side'],
      hints: ['Same recurrence as maximal square.', 'Add side[r][c] to the total for every cell.'],
      approach: 'Maximal-square DP with a running sum.',
      correctness: 'A cell with side k is the bottom-right corner of exactly k squares (sizes 1..k).',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'One pass.' },
      cpp: cpp`
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

long long countSquares(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<int>> side(R + 1, vector<int>(C + 1, 0));
    long long total = 0;
    for (int r = 1; r <= R; r++)
        for (int c = 1; c <= C; c++)
            if (g[r - 1][c - 1] == 1) {
                side[r][c] = 1 + min({side[r - 1][c], side[r][c - 1], side[r - 1][c - 1]});
                total += side[r][c];
            }
    return total;
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& r : g)
        for (auto& x : r) cin >> x;
    cout << countSquares(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid. Output: number of all-1 squares.',
      keyLines: [{ match: 'total += side[r][c];', note: 'Each cell contributes one square per possible size.' }],
      mistakes: ['Counting only maximal squares'],
      tests: [
        { in: '3 4\n0 1 1 1\n1 1 1 1\n0 1 1 1', out: '15' },
        { in: '3 3\n1 0 1\n1 1 0\n1 1 0', out: '7' },
        { in: '1 1\n0', out: '0' },
        { in: '2 2\n1 1\n1 1', out: '5' },
      ],
    },
    {
      id: 'd28-dungeon',
      day: 28,
      title: 'Minimum Starting Health',
      difficulty: 'Hard',
      topic: 'dynamic-programming',
      patterns: ['grid-dp', 'dp-2d'],
      objective: 'Fill a grid DP backwards from the goal.',
      statement: 'A knight starts at the top-left and moves right or down to the bottom-right. Each cell adds (possibly negative) health. Health must stay ≥ 1 at all times. Print the minimum initial health.',
      constraints: ['1 ≤ R, C ≤ 200', '−1000 ≤ cell ≤ 1000'],
      examples: [{ input: '-2 -3 3 / -5 -10 1 / 10 30 -5', output: '7' }],
      edgeCases: ['All positive → 1', 'Single negative cell'],
      cues: ['Requirement depends on the future → DP from the goal backwards'],
      hints: ['need[r][c] = minimum health needed when entering (r, c).', 'need = max(1, min(need right, need down) − cell).', 'Fill from the bottom-right.'],
      approach: 'Reverse grid DP with ∞ padding.',
      correctness: 'Entering a cell with h requires h + cell ≥ next requirement and h ≥ 1.',
      complexity: { time: 'O(R · C)', space: 'O(R · C)', why: 'Each cell once.' },
      cpp: cpp`
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>
using namespace std;

int minHealth(const vector<vector<int>>& g) {
    int R = g.size(), C = g[0].size();
    vector<vector<int>> need(R + 1, vector<int>(C + 1, INT_MAX));
    need[R][C - 1] = need[R - 1][C] = 1;  // after the goal you only need to be alive
    for (int r = R - 1; r >= 0; r--)
        for (int c = C - 1; c >= 0; c--) {
            int next = min(need[r + 1][c], need[r][c + 1]);
            need[r][c] = max(1, next - g[r][c]);
        }
    return need[0][0];
}`,
      main: cpp`
int main() {
    int R, C;
    cin >> R >> C;
    vector<vector<int>> g(R, vector<int>(C));
    for (auto& r : g)
        for (auto& x : r) cin >> x;
    cout << minHealth(g) << "\n";
    return 0;
}`,
      io: 'Input: R C, then the grid. Output: minimum initial health.',
      keyLines: [{ match: 'need[r][c] = max(1, next - g[r][c]);', note: 'Never below 1, and enough to meet the next requirement after this cell.' }],
      mistakes: ['Forward DP of maximum health (does not capture the "never below 1" constraint)'],
      tests: [
        { in: '3 3\n-2 -3 3\n-5 -10 1\n10 30 -5', out: '7' },
        { in: '1 1\n0', out: '1' },
        { in: '1 1\n-5', out: '6' },
        { in: '2 2\n1 -3\n-2 5', out: '2' },
      ],
    },
  ],
};

export default day;
