import type { GridState, Step } from '../viz/types';
import { MinHeap } from './minheap';
import { mulberry32 } from '../rng';

export type GridAlgo = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

export interface Grid {
  rows: number;
  cols: number;
  walls: boolean[];
  weights: number[];
  start: number;
  goal: number;
}

export interface GridRun {
  steps: Step<GridState>[];
  path: number[];
  visitedCount: number;
  cost: number | null;
}

export const GRID_INFO: Record<GridAlgo, { name: string; optimal: string; note: string }> = {
  bfs: {
    name: 'Breadth-First Search',
    optimal: 'Shortest path in number of steps (ignores weights)',
    note: 'Explores in rings of equal distance using a FIFO queue. Every edge counts as 1, so the first time BFS reaches the goal it has used the fewest moves.',
  },
  dfs: {
    name: 'Depth-First Search',
    optimal: 'Not shortest — finds *a* path',
    note: 'Dives as deep as possible with a stack before backtracking. Great for reachability and exhaustive exploration, but the first path found can be long.',
  },
  dijkstra: {
    name: 'Dijkstra',
    optimal: 'Minimum total cost with non-negative weights',
    note: 'Always expands the frontier cell with the smallest known cost (priority queue). Correct only when no edge weight is negative.',
  },
  astar: {
    name: 'A* Search',
    optimal: 'Minimum cost when the heuristic never overestimates',
    note: 'Dijkstra plus a goal-directed estimate h (Manhattan distance here). Orders the frontier by g + h, so it usually expands fewer cells than Dijkstra.',
  },
};

export function makeGrid(rows: number, cols: number): Grid {
  return {
    rows,
    cols,
    walls: new Array(rows * cols).fill(false),
    weights: new Array(rows * cols).fill(1),
    start: Math.floor(rows / 2) * cols + 1,
    goal: Math.floor(rows / 2) * cols + cols - 2,
  };
}

export function neighbors(g: Pick<Grid, 'rows' | 'cols'>, id: number): number[] {
  const r = Math.floor(id / g.cols);
  const c = id % g.cols;
  const out: number[] = [];
  // Fixed order: up, right, down, left — makes runs deterministic.
  if (r > 0) out.push(id - g.cols);
  if (c < g.cols - 1) out.push(id + 1);
  if (r < g.rows - 1) out.push(id + g.cols);
  if (c > 0) out.push(id - 1);
  return out;
}

function manhattan(g: Grid, a: number, b: number) {
  return Math.abs(Math.floor(a / g.cols) - Math.floor(b / g.cols)) + Math.abs((a % g.cols) - (b % g.cols));
}

function buildPath(parent: Map<number, number>, goal: number, start: number): number[] {
  if (goal !== start && !parent.has(goal)) return [];
  const path = [goal];
  let cur = goal;
  while (cur !== start) {
    cur = parent.get(cur)!;
    path.push(cur);
  }
  return path.reverse();
}

export function runGrid(algo: GridAlgo, g: Grid, maxSteps = 5000): GridRun {
  const steps: Step<GridState>[] = [];
  const visitedOrder: number[] = [];
  const closed = new Set<number>();
  const parent = new Map<number, number>();
  const dist: (number | null)[] = new Array(g.rows * g.cols).fill(null);
  const base = (): Omit<GridState, 'visited' | 'frontier'> => ({
    kind: 'grid',
    rows: g.rows,
    cols: g.cols,
    walls: g.walls,
    weights: g.weights,
    start: g.start,
    goal: g.goal,
  });
  const push = (frontier: number[], current: number | undefined, note: string) => {
    if (steps.length >= maxSteps) return;
    steps.push({
      state: { ...base(), visited: [...visitedOrder], frontier: [...frontier], current, dist: [...dist] },
      note,
      vars: { visited: visitedOrder.length, frontier: frontier.length },
    });
  };

  if (g.walls[g.start] || g.walls[g.goal]) {
    push([], undefined, 'Start or goal is a wall — there is no valid path');
    return { steps, path: [], visitedCount: 0, cost: null };
  }

  let found = false;
  dist[g.start] = 0;

  if (algo === 'bfs') {
    const q = [g.start];
    let head = 0;
    closed.add(g.start);
    push(q, undefined, 'Enqueue the start cell (distance 0)');
    while (head < q.length) {
      const cur = q[head++];
      visitedOrder.push(cur);
      if (cur === g.goal) {
        found = true;
        push(q.slice(head), cur, `Dequeued the goal at distance ${dist[cur]} — BFS distances are final when dequeued`);
        break;
      }
      for (const nb of neighbors(g, cur)) {
        if (g.walls[nb] || closed.has(nb)) continue;
        closed.add(nb);
        parent.set(nb, cur);
        dist[nb] = (dist[cur] as number) + 1;
        q.push(nb);
      }
      push(q.slice(head), cur, `Dequeue cell ${cur} (distance ${dist[cur]}) and enqueue unvisited neighbours`);
    }
  } else if (algo === 'dfs') {
    const stack = [g.start];
    while (stack.length) {
      const cur = stack.pop()!;
      if (closed.has(cur)) continue;
      closed.add(cur);
      visitedOrder.push(cur);
      if (cur === g.goal) {
        found = true;
        push(stack, cur, 'Reached the goal — DFS stops at the first path it finds, which may not be the shortest');
        break;
      }
      const nbs = neighbors(g, cur).filter((nb) => !g.walls[nb] && !closed.has(nb));
      for (let i = nbs.length - 1; i >= 0; i--) {
        const nb = nbs[i];
        parent.set(nb, cur);
        dist[nb] = (dist[cur] as number) + 1;
        stack.push(nb);
      }
      push(stack, cur, `Pop cell ${cur}, push its unvisited neighbours on the stack`);
    }
  } else {
    const pq = new MinHeap<number>();
    const h = (id: number) => (algo === 'astar' ? manhattan(g, id, g.goal) : 0);
    pq.push(h(g.start), g.start);
    push([g.start], undefined, algo === 'astar' ? 'Push start with f = g + h' : 'Push start with cost 0');
    while (pq.size) {
      const { value: cur } = pq.pop()!;
      if (closed.has(cur)) continue; // stale entry
      closed.add(cur);
      visitedOrder.push(cur);
      if (cur === g.goal) {
        found = true;
        push(pq.values(), cur, `Goal popped with cost ${dist[cur]} — with non-negative weights this cost is optimal`);
        break;
      }
      for (const nb of neighbors(g, cur)) {
        if (g.walls[nb] || closed.has(nb)) continue;
        const nd = (dist[cur] as number) + g.weights[nb];
        if (dist[nb] === null || nd < (dist[nb] as number)) {
          dist[nb] = nd;
          parent.set(nb, cur);
          pq.push(nd + h(nb), nb);
        }
      }
      push(
        pq.values(),
        cur,
        `Pop cell ${cur} (cost ${dist[cur]}${algo === 'astar' ? `, h ${h(cur)}` : ''}) and relax its neighbours`,
      );
    }
  }

  const path = found ? buildPath(parent, g.goal, g.start) : [];
  const cost = found ? path.slice(1).reduce((s, id) => s + (algo === 'bfs' || algo === 'dfs' ? 1 : g.weights[id]), 0) : null;
  steps.push({
    state: { ...base(), visited: [...visitedOrder], frontier: [], path, dist: [...dist] },
    note: found
      ? `Path found: ${path.length - 1} moves, cost ${cost}, ${visitedOrder.length} cells expanded`
      : `Goal unreachable — explored all ${visitedOrder.length} reachable cells`,
    vars: { visited: visitedOrder.length, pathLength: found ? path.length - 1 : 'none' },
  });
  return { steps, path, visitedCount: visitedOrder.length, cost };
}

/** Random obstacles with a guaranteed-open start/goal. */
export function randomWalls(g: Grid, density: number, seed: number): Grid {
  const rnd = mulberry32(seed);
  const walls = g.walls.map((_, i) => i !== g.start && i !== g.goal && rnd() < density);
  return { ...g, walls };
}

/** Perfect maze using randomized DFS on odd cells. */
export function generateMaze(g: Grid, seed: number): Grid {
  const rnd = mulberry32(seed);
  const walls = new Array(g.rows * g.cols).fill(true);
  const id = (r: number, c: number) => r * g.cols + c;
  const stack: [number, number][] = [[1, 1]];
  walls[id(1, 1)] = false;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const dirs = [
      [-2, 0],
      [0, 2],
      [2, 0],
      [0, -2],
    ].filter(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr > 0 && nc > 0 && nr < g.rows - 1 && nc < g.cols - 1 && walls[id(nr, nc)];
    });
    if (!dirs.length) {
      stack.pop();
      continue;
    }
    const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
    walls[id(r + dr / 2, c + dc / 2)] = false;
    walls[id(r + dr, c + dc)] = false;
    stack.push([r + dr, c + dc]);
  }
  const start = id(1, 1);
  const gr = g.rows % 2 === 0 ? g.rows - 3 : g.rows - 2;
  const gc = g.cols % 2 === 0 ? g.cols - 3 : g.cols - 2;
  const goal = id(gr, gc);
  walls[start] = false;
  walls[goal] = false;
  return { ...g, walls, start, goal };
}

export function randomWeights(g: Grid, seed: number): Grid {
  const rnd = mulberry32(seed);
  return { ...g, weights: g.weights.map(() => (rnd() < 0.25 ? 5 : 1)) };
}
