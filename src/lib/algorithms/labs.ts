// Step generators for labs that are not tied to a single synced C++ trace.
import type {
  ArrayState,
  RecursionState,
  Step,
  TableState,
  TimelineItem,
  TimelineState,
  Tone,
  TreeState,
} from '../viz/types';

// ============================================================ backtracking

export type BacktrackAlgo = 'permutations' | 'combination-sum' | 'n-queens';

export function runBacktrack(algo: BacktrackAlgo, opts: { nums?: number[]; target?: number; n?: number }): {
  steps: Step<RecursionState>[];
  results: string[];
} {
  const steps: Step<RecursionState>[] = [];
  const nodes: RecursionState['nodes'] = [];
  const stack: string[] = [];
  const results: string[] = [];
  let pruned = 0;
  let partial = '';
  const MAX = 900;
  const snap = (current: number | null, note: string) => {
    if (steps.length >= MAX) return;
    steps.push({
      state: { kind: 'recursion', nodes: nodes.map((n) => ({ ...n })), current, stack: [...stack], partial, results: [...results], pruned },
      note,
      vars: { depth: stack.length, results: results.length, pruned },
    });
  };
  const add = (parent: number | null, label: string, tone: Tone = 'active') => {
    nodes.push({ id: nodes.length, parent, label, tone });
    return nodes.length - 1;
  };

  if (algo === 'permutations') {
    const nums = opts.nums ?? [1, 2, 3];
    const used = nums.map(() => false);
    const cur: number[] = [];
    const go = (parent: number | null) => {
      partial = `[${cur.join(',')}]`;
      const id = add(parent, partial);
      stack.push(`permute(${partial})`);
      if (cur.length === nums.length) {
        results.push(partial);
        nodes[id].tone = 'found';
        snap(id, `Complete permutation ${partial}`);
      } else {
        snap(id, `Choose the next unused element for ${partial}`);
        for (let i = 0; i < nums.length; i++) {
          if (used[i]) continue;
          used[i] = true;
          cur.push(nums[i]);
          go(id);
          cur.pop();
          used[i] = false;
          partial = `[${cur.join(',')}]`;
          snap(id, `Undo ${nums[i]}: mark it unused again`);
        }
        nodes[id].tone = 'done';
      }
      stack.pop();
    };
    go(null);
  } else if (algo === 'combination-sum') {
    const nums = [...(opts.nums ?? [2, 3, 5])].sort((a, b) => a - b);
    const target = opts.target ?? 8;
    const cur: number[] = [];
    const go = (start: number, remain: number, parent: number | null) => {
      partial = `[${cur.join(',')}]`;
      const id = add(parent, `${partial} r=${remain}`);
      stack.push(`dfs(start=${start}, remain=${remain})`);
      if (remain === 0) {
        results.push(partial);
        nodes[id].tone = 'found';
        snap(id, `Remaining is 0 — record ${partial}`);
        stack.pop();
        return;
      }
      snap(id, `Try candidates from index ${start} with remaining ${remain}`);
      for (let i = start; i < nums.length; i++) {
        if (nums[i] > remain) {
          // Sorted input: every later candidate is also too large.
          pruned++;
          const pid = add(id, `✂ ${nums[i]} > ${remain}`, 'warn');
          snap(pid, `Prune: ${nums[i]} exceeds remaining ${remain}, and so does every larger candidate`);
          break;
        }
        cur.push(nums[i]);
        go(i, remain - nums[i], id); // i, not i + 1: a number may be reused
        cur.pop();
        partial = `[${cur.join(',')}]`;
      }
      nodes[id].tone = 'done';
      stack.pop();
    };
    go(0, target, null);
  } else {
    const n = opts.n ?? 4;
    const cols: number[] = [];
    const ok = (r: number, c: number) => cols.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr);
    const go = (r: number, parent: number | null) => {
      partial = cols.map((c) => c + 1).join(' ');
      const id = add(parent, r === 0 ? 'start' : `row${r}: col ${cols[r - 1] + 1}`);
      stack.push(`place(row=${r})`);
      if (r === n) {
        results.push(`cols ${partial}`);
        nodes[id].tone = 'found';
        snap(id, `All ${n} queens placed: columns ${partial}`);
        stack.pop();
        return;
      }
      snap(id, `Place a queen in row ${r + 1}`);
      for (let c = 0; c < n; c++) {
        if (!ok(r, c)) {
          pruned++;
          const pid = add(id, `✂ col ${c + 1}`, 'warn');
          snap(pid, `Column ${c + 1} is attacked — prune this branch`);
          continue;
        }
        cols.push(c);
        go(r + 1, id);
        cols.pop();
        partial = cols.map((x) => x + 1).join(' ');
      }
      nodes[id].tone = 'done';
      stack.pop();
    };
    go(0, null);
  }
  snap(null, `Search finished: ${results.length} result(s), ${pruned} pruned branch(es)`);
  return { steps, results };
}

// ============================================================ dynamic programming

export function gridPathsDP(grid: number[][]): { steps: Step<TableState>[]; answer: number } {
  const R = grid.length;
  const C = grid[0].length;
  const dp: (number | null)[][] = grid.map((row) => row.map(() => null));
  const steps: Step<TableState>[] = [];
  const view = (active?: [number, number], deps: [number, number][] = []): TableState => ({
    kind: 'table',
    title: 'dp[r][c] = number of paths reaching (r, c)',
    rowLabels: grid.map((_, r) => `r${r}`),
    colLabels: grid[0].map((_, c) => `c${c}`),
    cells: dp.map((row, r) => row.map((v, c) => (grid[r][c] === 1 ? '■' : v))),
    active,
    deps,
  });
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 1) {
        dp[r][c] = 0;
        steps.push({ state: view([r, c]), note: `(${r},${c}) is an obstacle: 0 paths`, vars: { r, c, 'dp[r][c]': 0 } });
        continue;
      }
      if (r === 0 && c === 0) {
        dp[r][c] = 1;
        steps.push({ state: view([r, c]), note: 'Base case: one way to stand on the start', vars: { r, c, 'dp[r][c]': 1 } });
        continue;
      }
      const up = r > 0 ? (dp[r - 1][c] as number) : 0;
      const left = c > 0 ? (dp[r][c - 1] as number) : 0;
      dp[r][c] = up + left;
      const deps: [number, number][] = [];
      if (r > 0) deps.push([r - 1, c]);
      if (c > 0) deps.push([r, c - 1]);
      steps.push({ state: view([r, c], deps), note: `dp[${r}][${c}] = from above ${up} + from left ${left} = ${dp[r][c]}`, vars: { r, c, up, left, 'dp[r][c]': dp[r][c] as number } });
    }
  }
  return { steps, answer: dp[R - 1][C - 1] as number };
}

export function lcsDP(a: string, b: string): { steps: Step<TableState>[]; length: number; sequence: string } {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const shown: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => new Array(m + 1).fill(null).map((_, j) => (i === 0 || j === 0 ? 0 : null)));
  const steps: Step<TableState>[] = [];
  const view = (active?: [number, number], deps: [number, number][] = [], path?: [number, number][]): TableState => ({
    kind: 'table',
    title: 'dp[i][j] = LCS length of a[0..i) and b[0..j)',
    rowLabels: ['∅', ...a.split('')],
    colLabels: ['∅', ...b.split('')],
    cells: shown.map((r) => [...r]),
    active,
    deps,
    path,
  });
  steps.push({ state: view(), note: 'Row 0 and column 0 are 0: an empty string shares nothing' });
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        shown[i][j] = dp[i][j];
        steps.push({ state: view([i, j], [[i - 1, j - 1]]), note: `'${a[i - 1]}' matches: dp[${i}][${j}] = diagonal + 1 = ${dp[i][j]}`, vars: { i, j, 'dp[i][j]': dp[i][j] } });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        shown[i][j] = dp[i][j];
        steps.push({ state: view([i, j], [[i - 1, j], [i, j - 1]]), note: `'${a[i - 1]}' ≠ '${b[j - 1]}': max(up ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}`, vars: { i, j, 'dp[i][j]': dp[i][j] } });
      }
    }
  }
  const path: [number, number][] = [];
  let i = n;
  let j = m;
  let seq = '';
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      path.push([i, j]);
      seq = a[i - 1] + seq;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  steps.push({ state: view([n, m], [], path), note: `LCS length ${dp[n][m]}; backtracking through matches gives "${seq}"`, vars: { length: dp[n][m] } });
  return { steps, length: dp[n][m], sequence: seq };
}

export function coinChangeDP(coins: number[], amount: number): { steps: Step<ArrayState>[]; answer: number } {
  const INF = Infinity;
  const dp: number[] = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  const steps: Step<ArrayState>[] = [];
  const show = () => dp.map((v) => (v === INF ? '∞' : v));
  const view = (tones: Record<number, Tone>): ArrayState => ({ kind: 'array', rows: [{ label: 'dp[x] = min coins', values: show(), tones }] });
  steps.push({ state: view({ 0: 'done' }), note: 'dp[0] = 0; every other amount starts at ∞ (unreachable)' });
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] + 1 < dp[x]) {
        dp[x] = dp[x - c] + 1;
        steps.push({ state: view({ [x]: 'found', [x - c]: 'compare' }), note: `dp[${x}] = dp[${x - c}] + 1 = ${dp[x]} using coin ${c}`, vars: { x, coin: c, 'dp[x]': dp[x] } });
      }
    }
    if (dp[x] === INF) steps.push({ state: view({ [x]: 'warn' }), note: `${x} cannot be formed`, vars: { x } });
  }
  return { steps, answer: dp[amount] === INF ? -1 : dp[amount] };
}

export function greedyCoins(coins: number[], amount: number): number {
  const sorted = [...coins].sort((a, b) => b - a);
  let count = 0;
  let rest = amount;
  for (const c of sorted) {
    count += Math.floor(rest / c);
    rest %= c;
  }
  return rest === 0 ? count : -1;
}

// ============================================================ greedy scheduling

export type IntervalStrategy = 'earliest-finish' | 'earliest-start' | 'shortest';

export interface Interval {
  id: string;
  start: number;
  end: number;
}

export const STRATEGY_INFO: Record<IntervalStrategy, { name: string; valid: boolean; note: string }> = {
  'earliest-finish': {
    name: 'Earliest finish time',
    valid: true,
    note: 'Exchange argument: an optimal schedule can always swap its first meeting for the one that ends earliest without losing anything, because ending earlier leaves at least as much room.',
  },
  'earliest-start': {
    name: 'Earliest start time',
    valid: false,
    note: 'Counterexample: one long meeting that starts first blocks many short ones.',
  },
  shortest: {
    name: 'Shortest duration',
    valid: false,
    note: 'Counterexample: a short meeting can overlap two longer, compatible meetings.',
  },
};

export const INTERVAL_PRESETS: Record<string, { name: string; items: Interval[] }> = {
  mixed: {
    name: 'Mixed day',
    items: [
      { id: 'A', start: 1, end: 4 },
      { id: 'B', start: 3, end: 5 },
      { id: 'C', start: 0, end: 6 },
      { id: 'D', start: 5, end: 7 },
      { id: 'E', start: 3, end: 9 },
      { id: 'F', start: 5, end: 9 },
      { id: 'G', start: 6, end: 10 },
      { id: 'H', start: 8, end: 11 },
      { id: 'I', start: 8, end: 12 },
      { id: 'J', start: 2, end: 14 },
      { id: 'K', start: 12, end: 16 },
    ],
  },
  'long-first': {
    name: 'Counterexample: earliest start',
    items: [
      { id: 'Long', start: 0, end: 10 },
      { id: 'a', start: 1, end: 3 },
      { id: 'b', start: 3, end: 5 },
      { id: 'c', start: 5, end: 7 },
      { id: 'd', start: 7, end: 9 },
    ],
  },
  'short-bridge': {
    name: 'Counterexample: shortest',
    items: [
      { id: 'L', start: 0, end: 5 },
      { id: 'S', start: 4, end: 6 },
      { id: 'R', start: 5, end: 10 },
    ],
  },
};

export function scheduleIntervals(items: Interval[], strategy: IntervalStrategy): { steps: Step<TimelineState>[]; chosen: string[] } {
  const order = [...items].sort((a, b) => {
    if (strategy === 'earliest-finish') return a.end - b.end || a.start - b.start;
    if (strategy === 'earliest-start') return a.start - b.start || a.end - b.end;
    return a.end - a.start - (b.end - b.start) || a.start - b.start;
  });
  const maxTime = Math.max(...items.map((x) => x.end)) + 1;
  const chosen: Interval[] = [];
  const rejected = new Set<string>();
  const steps: Step<TimelineState>[] = [];
  const lane = new Map(items.map((x, i) => [x.id, i]));
  const view = (cur?: string, marker?: number): TimelineState => ({
    kind: 'timeline',
    maxTime,
    marker,
    lanes: items.map((x) => x.id),
    items: items.map<TimelineItem>((x) => ({
      id: x.id,
      start: x.start,
      end: x.end,
      lane: lane.get(x.id),
      label: x.id,
      tone: x.id === cur ? 'active' : chosen.includes(x) ? 'found' : rejected.has(x.id) ? 'muted' : undefined,
    })),
    aux: [
      { label: 'consider order', items: order.map((x) => x.id) },
      { label: 'chosen', items: chosen.map((x) => x.id), tone: 'found' },
    ],
  });
  steps.push({ state: view(), note: `Sort by ${STRATEGY_INFO[strategy].name.toLowerCase()}` });
  for (const x of order) {
    const ok = chosen.every((c) => x.end <= c.start || x.start >= c.end);
    if (ok) {
      chosen.push(x);
      steps.push({ state: view(x.id, x.end), note: `Take ${x.id} [${x.start}, ${x.end}) — compatible with everything chosen`, vars: { chosen: chosen.length } });
    } else {
      rejected.add(x.id);
      steps.push({ state: view(x.id), note: `Reject ${x.id} [${x.start}, ${x.end}) — overlaps a chosen meeting`, vars: { chosen: chosen.length } });
    }
  }
  steps.push({ state: view(), note: `${STRATEGY_INFO[strategy].name}: ${chosen.length} meeting(s) scheduled`, vars: { chosen: chosen.length } });
  return { steps, chosen: chosen.map((x) => x.id) };
}

export type CpuPolicy = 'fcfs' | 'sjf' | 'rr';

export interface Job {
  id: string;
  arrive: number;
  burst: number;
}

export const CPU_INFO: Record<CpuPolicy, { name: string; note: string }> = {
  fcfs: { name: 'First come, first served', note: 'Simple and fair in order, but one long job delays everyone behind it (the convoy effect).' },
  sjf: { name: 'Shortest job first (non-preemptive)', note: 'Greedy: among arrived jobs, run the shortest. Minimises average waiting time when bursts are known in advance.' },
  rr: { name: 'Round robin (quantum 2)', note: 'Each job gets a time slice in turn. Better response time, more context switches.' },
};

export function scheduleCpu(jobs: Job[], policy: CpuPolicy, quantum = 2): { steps: Step<TimelineState>[]; avgWait: number; finish: Record<string, number> } {
  const steps: Step<TimelineState>[] = [];
  const remaining = new Map(jobs.map((j) => [j.id, j.burst]));
  const finish: Record<string, number> = {};
  const slices: TimelineItem[] = [];
  const total = jobs.reduce((s, j) => s + j.burst, 0) + Math.max(...jobs.map((j) => j.arrive));
  let t = 0;
  const lanes = ['CPU'];
  const view = (note: string, queue: string[]) =>
    steps.push({
      state: { kind: 'timeline', maxTime: total + 1, lanes, marker: t, items: slices.map((s) => ({ ...s })), aux: [{ label: 'ready queue', items: queue }] },
      note,
      vars: { time: t },
    });
  const rrQueue: string[] = [];
  const arrived = new Set<string>();
  const admit = () => {
    for (const j of [...jobs].sort((a, b) => a.arrive - b.arrive || a.id.localeCompare(b.id))) {
      if (j.arrive <= t && !arrived.has(j.id)) {
        arrived.add(j.id);
        rrQueue.push(j.id);
      }
    }
  };
  admit();
  while (Object.keys(finish).length < jobs.length) {
    const ready = jobs.filter((j) => j.arrive <= t && !(j.id in finish));
    if (!ready.length) {
      t = Math.min(...jobs.filter((j) => !(j.id in finish)).map((j) => j.arrive));
      admit();
      view(`CPU idle until t = ${t}`, []);
      continue;
    }
    let pick: Job;
    let run: number;
    if (policy === 'fcfs') {
      pick = [...ready].sort((a, b) => a.arrive - b.arrive || a.id.localeCompare(b.id))[0];
      run = remaining.get(pick.id)!;
    } else if (policy === 'sjf') {
      pick = [...ready].sort((a, b) => a.burst - b.burst || a.arrive - b.arrive)[0];
      run = remaining.get(pick.id)!;
    } else {
      const id = rrQueue.shift()!;
      pick = jobs.find((j) => j.id === id)!;
      run = Math.min(quantum, remaining.get(pick.id)!);
    }
    const start = t;
    t += run;
    remaining.set(pick.id, remaining.get(pick.id)! - run);
    slices.push({ id: `${pick.id}@${start}`, start, end: t, lane: 0, label: pick.id, tone: 'active' });
    admit();
    if (remaining.get(pick.id) === 0) finish[pick.id] = t;
    else if (policy === 'rr') rrQueue.push(pick.id);
    view(
      `Run ${pick.id} from ${start} to ${t}${remaining.get(pick.id) === 0 ? ' (finished)' : ` (${remaining.get(pick.id)} left)`}`,
      policy === 'rr' ? [...rrQueue] : jobs.filter((j) => j.arrive <= t && !(j.id in finish)).map((j) => j.id),
    );
  }
  const avgWait = jobs.reduce((s, j) => s + (finish[j.id] - j.arrive - j.burst), 0) / jobs.length;
  return { steps, avgWait, finish };
}

// ============================================================ binary trees

export interface BstNode {
  id: number;
  val: number;
  left?: number;
  right?: number;
}

export function buildBst(values: number[]): { nodes: BstNode[]; root: number | null } {
  const nodes: BstNode[] = [];
  let root: number | null = null;
  for (const v of values) {
    const id = nodes.length;
    if (root === null) {
      nodes.push({ id, val: v });
      root = id;
      continue;
    }
    let cur = root;
    let placed = false;
    while (!placed) {
      const n = nodes[cur];
      if (v === n.val) {
        placed = true; // duplicates ignored
      } else if (v < n.val) {
        if (n.left === undefined) {
          nodes.push({ id, val: v });
          n.left = id;
          placed = true;
        } else cur = n.left;
      } else if (n.right === undefined) {
        nodes.push({ id, val: v });
        n.right = id;
        placed = true;
      } else cur = n.right;
    }
  }
  return { nodes, root };
}

export type TreeTraversal = 'preorder' | 'inorder' | 'postorder' | 'level' | 'insert';

export function traverseTree(values: number[], kind: TreeTraversal): { steps: Step<TreeState>[]; order: number[] } {
  const { nodes, root } = buildBst(values);
  const steps: Step<TreeState>[] = [];
  const tones: Record<number, Tone> = {};
  const order: number[] = [];
  const stackView: string[] = [];
  const view = (shown = nodes): TreeState => ({
    kind: 'tree',
    root,
    nodes: shown.map((n) => ({ id: n.id, label: String(n.val), left: n.left, right: n.right, tone: tones[n.id] })),
    aux: [
      { label: kind === 'level' ? 'queue' : 'call stack', items: [...stackView] },
      { label: 'visit order', items: order.map(String) },
    ],
  });
  if (root === null) return { steps, order };
  if (kind === 'insert') {
    const shown: BstNode[] = [];
    for (const n of nodes) {
      shown.push({ id: n.id, val: n.val });
      // Re-link children that are already shown.
      for (const s of shown) {
        const full = nodes[s.id];
        s.left = full.left !== undefined && full.left <= n.id ? full.left : undefined;
        s.right = full.right !== undefined && full.right <= n.id ? full.right : undefined;
      }
      tones[n.id] = 'found';
      order.push(n.val);
      steps.push({ state: view(shown.map((s) => ({ ...s }))), note: `Insert ${n.val}: go left when smaller, right when larger`, vars: { inserted: order.length } });
      tones[n.id] = 'done';
    }
    return { steps, order };
  }
  if (kind === 'level') {
    const q = [root];
    stackView.push(String(nodes[root].val));
    let h = 0;
    while (h < q.length) {
      const id = q[h++];
      stackView.shift();
      tones[id] = 'active';
      order.push(nodes[id].val);
      for (const c of [nodes[id].left, nodes[id].right]) {
        if (c !== undefined) {
          q.push(c);
          tones[c] = 'frontier';
          stackView.push(String(nodes[c].val));
        }
      }
      steps.push({ state: view(), note: `Visit ${nodes[id].val}, enqueue its children`, vars: { visited: order.length } });
      tones[id] = 'done';
    }
    return { steps, order };
  }
  const go = (id: number | undefined) => {
    if (id === undefined) return;
    const n = nodes[id];
    stackView.push(`dfs(${n.val})`);
    tones[id] = 'active';
    const visit = () => {
      order.push(n.val);
      tones[id] = 'found';
      steps.push({ state: view(), note: `Visit ${n.val} (${kind})`, vars: { node: n.val, depth: stackView.length } });
      tones[id] = 'active';
    };
    steps.push({ state: view(), note: `Enter dfs(${n.val})`, vars: { node: n.val, depth: stackView.length } });
    if (kind === 'preorder') visit();
    go(n.left);
    tones[id] = 'active';
    if (kind === 'inorder') visit();
    go(n.right);
    tones[id] = 'active';
    if (kind === 'postorder') visit();
    tones[id] = 'done';
    stackView.pop();
  };
  go(root);
  steps.push({ state: view(), note: `${kind} order: ${order.join(' ')}`, vars: { visited: order.length } });
  return { steps, order };
}

// ============================================================ heap operations

export function heapOps(ops: (number | 'pop')[]): { steps: Step<TreeState>[]; popped: number[] } {
  const heap: number[] = [];
  const steps: Step<TreeState>[] = [];
  const popped: number[] = [];
  const view = (tones: Record<number, Tone> = {}): TreeState => ({
    kind: 'tree',
    root: heap.length ? 0 : null,
    nodes: heap.map((v, i) => ({ id: i, label: String(v), left: 2 * i + 1 < heap.length ? 2 * i + 1 : undefined, right: 2 * i + 2 < heap.length ? 2 * i + 2 : undefined, tone: tones[i] })),
    aux: [
      { label: 'array', items: heap.map(String) },
      { label: 'popped', items: popped.map(String) },
    ],
  });
  for (const op of ops) {
    if (op === 'pop') {
      if (!heap.length) {
        steps.push({ state: view(), note: 'pop on an empty heap — nothing to remove' });
        continue;
      }
      popped.push(heap[0]);
      const last = heap.pop()!;
      steps.push({ state: view(), note: `Remove the minimum ${popped[popped.length - 1]}; move the last element to the root` });
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < heap.length && heap[l] < heap[m]) m = l;
          if (r < heap.length && heap[r] < heap[m]) m = r;
          if (m === i) break;
          steps.push({ state: view({ [i]: 'compare', [m]: 'compare' }), note: `Sift down: ${heap[i]} > child ${heap[m]}, swap` });
          [heap[i], heap[m]] = [heap[m], heap[i]];
          i = m;
        }
        steps.push({ state: view({ [i]: 'found' }), note: 'Heap property restored' });
      }
    } else {
      heap.push(op);
      let i = heap.length - 1;
      steps.push({ state: view({ [i]: 'active' }), note: `Push ${op} at the next free slot (index ${i})` });
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p] <= heap[i]) break;
        steps.push({ state: view({ [i]: 'compare', [p]: 'compare' }), note: `Sift up: ${heap[i]} < parent ${heap[p]}, swap` });
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
      steps.push({ state: view({ [i]: 'found' }), note: `${op} settled at index ${i}` });
    }
  }
  return { steps, popped };
}

// ============================================================ queue & deque

export function slidingWindowMax(a: number[], k: number): { steps: Step<ArrayState>[]; result: number[] } {
  const dq: number[] = [];
  const result: number[] = [];
  const steps: Step<ArrayState>[] = [];
  const view = (i: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [
      { label: 'a', values: a, tones, range: i >= 0 ? { from: Math.max(0, i - k + 1), to: i, tone: 'active' } : undefined },
      { label: 'max', values: [...new Array(k - 1).fill(null), ...result].slice(0, a.length) },
    ],
    aux: [{ label: 'deque (indices, front on the left)', items: dq.map((x) => `${x}:${a[x]}`) }],
  });
  for (let i = 0; i < a.length; i++) {
    if (dq.length && dq[0] <= i - k) {
      const out = dq.shift()!;
      steps.push({ state: view(i, { [out]: 'muted' }), note: `Index ${out} left the window — pop it from the front`, vars: { i } });
    }
    while (dq.length && a[dq[dq.length - 1]] <= a[i]) {
      const b = dq.pop()!;
      steps.push({ state: view(i, { [b]: 'warn', [i]: 'active' }), note: `${a[b]} ≤ ${a[i]}: it can never be a future maximum, pop from the back`, vars: { i } });
    }
    dq.push(i);
    steps.push({ state: view(i, { [i]: 'active' }), note: `Push index ${i}; deque values are decreasing`, vars: { i } });
    if (i >= k - 1) {
      result.push(a[dq[0]]);
      steps.push({ state: view(i, { [dq[0]]: 'found' }), note: `Window max = a[${dq[0]}] = ${a[dq[0]]} (front of deque)`, vars: { i, max: a[dq[0]] } });
    }
  }
  return { steps, result };
}

export function queueOps(ops: (number | 'dequeue')[]): { steps: Step<ArrayState>[]; out: number[] } {
  const q: number[] = [];
  const out: number[] = [];
  const steps: Step<ArrayState>[] = [];
  const view = (tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [{ label: 'queue (front → back)', values: q.length ? [...q] : ['empty'], tones, pointers: q.length ? [{ name: 'front', index: 0, tone: 'active' }, { name: 'back', index: q.length - 1, tone: 'warn' }] : [] }],
    aux: [{ label: 'dequeued', items: out.map(String) }],
  });
  for (const op of ops) {
    if (op === 'dequeue') {
      if (!q.length) {
        steps.push({ state: view(), note: 'Dequeue on an empty queue: check empty() first in real code' });
        continue;
      }
      out.push(q.shift()!);
      steps.push({ state: view(), note: `Dequeue ${out[out.length - 1]} from the front (FIFO)` });
    } else {
      q.push(op);
      steps.push({ state: view({ [q.length - 1]: 'found' }), note: `Enqueue ${op} at the back` });
    }
  }
  return { steps, out };
}

export function stackOps(ops: (number | 'pop')[]): { steps: Step<ArrayState>[]; out: number[] } {
  const st: number[] = [];
  const out: number[] = [];
  const steps: Step<ArrayState>[] = [];
  const view = (tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [{ label: 'stack (bottom → top)', values: st.length ? [...st] : ['empty'], tones, pointers: st.length ? [{ name: 'top', index: st.length - 1, tone: 'active' }] : [] }],
    aux: [{ label: 'popped', items: out.map(String) }],
  });
  for (const op of ops) {
    if (op === 'pop') {
      if (!st.length) {
        steps.push({ state: view(), note: 'Pop on an empty stack: undefined behaviour with std::stack — always check empty()' });
        continue;
      }
      out.push(st.pop()!);
      steps.push({ state: view(), note: `Pop ${out[out.length - 1]} from the top (LIFO)` });
    } else {
      st.push(op);
      steps.push({ state: view({ [st.length - 1]: 'found' }), note: `Push ${op} on top` });
    }
  }
  return { steps, out };
}
