import type { GraphEdgeView, GraphNodeView, GraphState, Step, Tone } from '../viz/types';
import { MinHeap } from './minheap';

export interface Edge {
  u: number;
  v: number;
  w: number;
}

export interface Graph {
  n: number;
  edges: Edge[];
  directed: boolean;
  labels?: string[];
  pos?: { x: number; y: number }[];
}

export function adjacency(g: Graph): { to: number; w: number }[][] {
  const adj: { to: number; w: number }[][] = Array.from({ length: g.n }, () => []);
  for (const e of g.edges) {
    adj[e.u].push({ to: e.v, w: e.w });
    if (!g.directed) adj[e.v].push({ to: e.u, w: e.w });
  }
  return adj;
}

// ---------- Pure algorithms (tested directly) ----------

export function bfsOrder(g: Graph, src: number): { order: number[]; dist: number[] } {
  const adj = adjacency(g);
  const dist = new Array(g.n).fill(-1);
  const order: number[] = [];
  const q = [src];
  dist[src] = 0;
  for (let h = 0; h < q.length; h++) {
    const u = q[h];
    order.push(u);
    for (const { to } of adj[u]) {
      if (dist[to] === -1) {
        dist[to] = dist[u] + 1;
        q.push(to);
      }
    }
  }
  return { order, dist };
}

export function dfsOrder(g: Graph, src: number): number[] {
  const adj = adjacency(g);
  const seen = new Array(g.n).fill(false);
  const order: number[] = [];
  const go = (u: number) => {
    seen[u] = true;
    order.push(u);
    for (const { to } of adj[u]) if (!seen[to]) go(to);
  };
  go(src);
  return order;
}

export function countComponents(g: Graph): number {
  const seen = new Array(g.n).fill(false);
  let c = 0;
  for (let s = 0; s < g.n; s++) {
    if (seen[s]) continue;
    c++;
    for (const u of bfsOrder(g, s).order) seen[u] = true;
  }
  return c;
}

export const INF = Number.POSITIVE_INFINITY;

export function dijkstra(g: Graph, src: number): { dist: number[]; parent: number[] } {
  if (g.edges.some((e) => e.w < 0)) throw new Error('Dijkstra requires non-negative edge weights');
  const adj = adjacency(g);
  const dist = new Array(g.n).fill(INF);
  const parent = new Array(g.n).fill(-1);
  const pq = new MinHeap<number>();
  dist[src] = 0;
  pq.push(0, src);
  while (pq.size) {
    const { priority: d, value: u } = pq.pop()!;
    if (d > dist[u]) continue;
    for (const { to, w } of adj[u]) {
      if (d + w < dist[to]) {
        dist[to] = d + w;
        parent[to] = u;
        pq.push(dist[to], to);
      }
    }
  }
  return { dist, parent };
}

/** Kahn's algorithm. Returns null when the graph has a cycle. Smallest-id-first for determinism. */
export function topoSort(n: number, edges: [number, number][]): number[] | null {
  const indeg = new Array(n).fill(0);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v]++;
  }
  const ready = new MinHeap<number>();
  for (let i = 0; i < n; i++) if (indeg[i] === 0) ready.push(i, i);
  const order: number[] = [];
  while (ready.size) {
    const u = ready.pop()!.value;
    order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) ready.push(v, v);
  }
  return order.length === n ? order : null;
}

export class DSU {
  parent: number[];
  size: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]]; // path halving
      x = this.parent[x];
    }
    return x;
  }
  unite(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}

export function kruskal(g: Graph): { weight: number; edges: Edge[] } {
  const dsu = new DSU(g.n);
  const picked: Edge[] = [];
  let weight = 0;
  const sorted = [...g.edges].sort((a, b) => a.w - b.w || a.u - b.u || a.v - b.v);
  for (const e of sorted) {
    if (dsu.unite(e.u, e.v)) {
      picked.push(e);
      weight += e.w;
    }
  }
  return { weight, edges: picked };
}

export function prim(g: Graph, start = 0): { weight: number; edges: Edge[] } {
  const adj = adjacency(g);
  const inTree = new Array(g.n).fill(false);
  const pq = new MinHeap<Edge>();
  const picked: Edge[] = [];
  let weight = 0;
  inTree[start] = true;
  for (const { to, w } of adj[start]) pq.push(w, { u: start, v: to, w });
  while (pq.size) {
    const e = pq.pop()!.value;
    if (inTree[e.v]) continue;
    inTree[e.v] = true;
    picked.push(e);
    weight += e.w;
    for (const { to, w } of adj[e.v]) if (!inTree[to]) pq.push(w, { u: e.v, v: to, w });
  }
  return { weight, edges: picked };
}

// ---------- Step generators for the Graph Lab ----------

export type GraphAlgo = 'bfs' | 'dfs' | 'dijkstra' | 'topo' | 'union-find' | 'kruskal' | 'prim';

export const GRAPH_ALGO_INFO: Record<GraphAlgo, { name: string; needs: string; note: string }> = {
  bfs: { name: 'BFS', needs: 'any graph', note: 'Visits nodes level by level; gives fewest-edge distances.' },
  dfs: { name: 'DFS', needs: 'any graph', note: 'Goes deep first using recursion (an implicit stack).' },
  dijkstra: { name: 'Dijkstra', needs: 'non-negative weights', note: 'Greedy frontier expansion by smallest tentative distance.' },
  topo: { name: 'Topological sort (Kahn)', needs: 'directed acyclic graph', note: 'Repeatedly removes a node with in-degree 0.' },
  'union-find': { name: 'Union-Find', needs: 'list of edges', note: 'Merges components; find() follows parents to the root representative.' },
  kruskal: { name: 'Kruskal MST', needs: 'connected, undirected, weighted', note: 'Sort edges by weight, keep an edge if it joins two different components.' },
  prim: { name: 'Prim MST', needs: 'connected, undirected, weighted', note: 'Grow one tree, always adding the cheapest edge leaving it.' },
};

const CIRCLE = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    x: 50 + 38 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: 50 + 38 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));

export const SAMPLE_UNDIRECTED: Graph = {
  n: 7,
  directed: false,
  labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  pos: [
    { x: 12, y: 50 },
    { x: 32, y: 18 },
    { x: 32, y: 82 },
    { x: 55, y: 50 },
    { x: 75, y: 18 },
    { x: 75, y: 82 },
    { x: 92, y: 50 },
  ],
  edges: [
    { u: 0, v: 1, w: 4 },
    { u: 0, v: 2, w: 2 },
    { u: 1, v: 2, w: 1 },
    { u: 1, v: 3, w: 5 },
    { u: 2, v: 3, w: 8 },
    { u: 2, v: 5, w: 10 },
    { u: 3, v: 4, w: 2 },
    { u: 3, v: 5, w: 6 },
    { u: 4, v: 6, w: 3 },
    { u: 5, v: 6, w: 1 },
  ],
};

export const SAMPLE_DAG: Graph = {
  n: 7,
  directed: true,
  labels: ['math', 'arrays', 'hashing', 'pointers', 'search', 'graphs', 'dp'],
  pos: [
    { x: 10, y: 50 },
    { x: 32, y: 22 },
    { x: 32, y: 78 },
    { x: 55, y: 22 },
    { x: 55, y: 78 },
    { x: 80, y: 30 },
    { x: 85, y: 75 },
  ],
  edges: [
    { u: 0, v: 1, w: 1 },
    { u: 0, v: 2, w: 1 },
    { u: 1, v: 3, w: 1 },
    { u: 1, v: 4, w: 1 },
    { u: 2, v: 4, w: 1 },
    { u: 3, v: 5, w: 1 },
    { u: 4, v: 5, w: 1 },
    { u: 4, v: 6, w: 1 },
    { u: 2, v: 6, w: 1 },
  ],
};

function view(g: Graph, tones: Record<number, Tone>, edgeTones: Map<number, Tone>, badges: Record<number, string> = {}) {
  const pos = g.pos ?? CIRCLE(g.n);
  const nodes: GraphNodeView[] = pos.map((p, id) => ({
    id,
    x: p.x,
    y: p.y,
    label: g.labels?.[id] ?? String(id),
    tone: tones[id],
    badge: badges[id],
  }));
  const edges: GraphEdgeView[] = g.edges.map((e, i) => ({ u: e.u, v: e.v, w: e.w, directed: g.directed, tone: edgeTones.get(i) }));
  return { nodes, edges };
}

const edgeIndex = (g: Graph, u: number, v: number) =>
  g.edges.findIndex((e) => (e.u === u && e.v === v) || (!g.directed && e.u === v && e.v === u));

export function runGraph(algo: GraphAlgo, g: Graph, src = 0): Step<GraphState>[] {
  const steps: Step<GraphState>[] = [];
  const L = (i: number) => g.labels?.[i] ?? String(i);
  const tones: Record<number, Tone> = {};
  const et = new Map<number, Tone>();
  const badges: Record<number, string> = {};
  const snap = (note: string, aux: GraphState['aux'] = [], vars: Step['vars'] = {}) =>
    steps.push({ state: { kind: 'graph', ...view(g, { ...tones }, new Map(et), { ...badges }), aux }, note, vars });
  const adj = adjacency(g);

  if (algo === 'bfs') {
    const dist = new Array(g.n).fill(-1);
    const q = [src];
    dist[src] = 0;
    tones[src] = 'frontier';
    badges[src] = '0';
    snap(`Enqueue ${L(src)} with distance 0`, [{ label: 'queue', items: q.map(L) }]);
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      tones[u] = 'active';
      snap(`Dequeue ${L(u)}`, [{ label: 'queue', items: q.slice(h + 1).map(L) }]);
      for (const { to } of adj[u]) {
        if (dist[to] !== -1) continue;
        dist[to] = dist[u] + 1;
        badges[to] = String(dist[to]);
        tones[to] = 'frontier';
        et.set(edgeIndex(g, u, to), 'path');
        q.push(to);
        snap(`Discover ${L(to)} at distance ${dist[to]}`, [{ label: 'queue', items: q.slice(h + 1).map(L) }]);
      }
      tones[u] = 'done';
    }
    snap('BFS complete — the highlighted edges form a BFS tree of shortest (fewest-edge) paths', [
      { label: 'order', items: q.map(L) },
    ]);
  } else if (algo === 'dfs') {
    const seen = new Array(g.n).fill(false);
    const stack: string[] = [];
    const order: string[] = [];
    const go = (u: number, from: number) => {
      seen[u] = true;
      stack.push(L(u));
      order.push(L(u));
      tones[u] = 'active';
      if (from >= 0) et.set(edgeIndex(g, from, u), 'path');
      snap(`Enter ${L(u)} (call depth ${stack.length})`, [
        { label: 'call stack', items: [...stack] },
        { label: 'order', items: [...order] },
      ]);
      for (const { to } of adj[u]) if (!seen[to]) go(to, u);
      tones[u] = 'done';
      stack.pop();
      snap(`Finish ${L(u)} — return to caller`, [
        { label: 'call stack', items: [...stack] },
        { label: 'order', items: [...order] },
      ]);
    };
    go(src, -1);
  } else if (algo === 'dijkstra') {
    const dist = new Array(g.n).fill(INF);
    const pq = new MinHeap<number>();
    dist[src] = 0;
    badges[src] = '0';
    pq.push(0, src);
    const parentEdge = new Array(g.n).fill(-1);
    const pqView = () => [{ label: 'priority queue (dist, node)', items: pq.values().map((v) => `${dist[v]}:${L(v)}`) }];
    snap(`dist[${L(src)}] = 0; push it into the min-priority queue`, pqView());
    const done = new Array(g.n).fill(false);
    while (pq.size) {
      const { priority: d, value: u } = pq.pop()!;
      if (done[u] || d > dist[u]) continue;
      done[u] = true;
      tones[u] = 'active';
      snap(`Pop ${L(u)} with dist ${d}: this distance is now final`, pqView());
      for (const { to, w } of adj[u]) {
        if (done[to]) continue;
        const ei = edgeIndex(g, u, to);
        et.set(ei, 'compare');
        if (d + w < dist[to]) {
          const old = dist[to];
          dist[to] = d + w;
          badges[to] = String(dist[to]);
          if (parentEdge[to] >= 0) et.delete(parentEdge[to]);
          parentEdge[to] = ei;
          pq.push(dist[to], to);
          tones[to] = 'frontier';
          snap(`Relax ${L(u)}→${L(to)}: ${old === INF ? '∞' : old} > ${d}+${w}, set dist[${L(to)}] = ${dist[to]}`, pqView());
        } else {
          snap(`Edge ${L(u)}→${L(to)} gives ${d + w}, not better than ${dist[to]}`, pqView());
        }
        et.delete(ei);
        parentEdge.forEach((pe) => pe >= 0 && et.set(pe, 'path'));
      }
      tones[u] = 'done';
    }
    snap('All reachable distances are final. Highlighted edges form the shortest-path tree.', [
      { label: 'dist', items: dist.map((d, i) => `${L(i)}=${d === INF ? '∞' : d}`) },
    ]);
  } else if (algo === 'topo') {
    const indeg = new Array(g.n).fill(0);
    for (const e of g.edges) indeg[e.v]++;
    for (let i = 0; i < g.n; i++) badges[i] = `in ${indeg[i]}`;
    const ready: number[] = [];
    for (let i = 0; i < g.n; i++) if (indeg[i] === 0) ready.push(i);
    ready.forEach((i) => (tones[i] = 'frontier'));
    const order: number[] = [];
    snap('Compute in-degrees; nodes with in-degree 0 have no unmet prerequisites', [
      { label: 'ready queue', items: ready.map(L) },
    ]);
    while (ready.length) {
      ready.sort((a, b) => a - b);
      const u = ready.shift()!;
      order.push(u);
      tones[u] = 'done';
      badges[u] = `#${order.length}`;
      for (const { to } of adj[u]) {
        indeg[to]--;
        badges[to] = `in ${indeg[to]}`;
        et.set(edgeIndex(g, u, to), 'muted');
        if (indeg[to] === 0) {
          ready.push(to);
          tones[to] = 'frontier';
        }
      }
      snap(`Output ${L(u)} and remove its outgoing edges`, [
        { label: 'ready queue', items: ready.map(L) },
        { label: 'order', items: order.map(L) },
      ]);
    }
    snap(
      order.length === g.n
        ? `Topological order: ${order.map(L).join(' → ')}`
        : 'Some nodes never reached in-degree 0 — the graph contains a cycle',
      [{ label: 'order', items: order.map(L) }],
    );
  } else if (algo === 'union-find') {
    const dsu = new DSU(g.n);
    const comp = () => {
      const groups = new Map<number, number[]>();
      for (let i = 0; i < g.n; i++) {
        const r = dsu.find(i);
        groups.set(r, [...(groups.get(r) ?? []), i]);
      }
      return [...groups.values()].map((m) => `{${m.map(L).join(',')}}`);
    };
    const parents = () => dsu.parent.map((p, i) => `${L(i)}→${L(p)}`);
    for (let i = 0; i < g.n; i++) badges[i] = L(i);
    snap('Every node starts as its own set (parent[x] = x)', [
      { label: 'sets', items: comp() },
      { label: 'parent', items: parents() },
    ]);
    g.edges.forEach((e, i) => {
      et.set(i, 'compare');
      const ra = dsu.find(e.u);
      const rb = dsu.find(e.v);
      const merged = dsu.unite(e.u, e.v);
      et.set(i, merged ? 'path' : 'muted');
      for (let k = 0; k < g.n; k++) badges[k] = L(dsu.find(k));
      snap(
        merged
          ? `unite(${L(e.u)}, ${L(e.v)}): roots ${L(ra)} and ${L(rb)} differ — attach the smaller tree under the larger`
          : `unite(${L(e.u)}, ${L(e.v)}): both already have root ${L(ra)} — this edge would create a cycle`,
        [
          { label: 'sets', items: comp() },
          { label: 'parent', items: parents() },
        ],
      );
    });
  } else if (algo === 'kruskal') {
    const dsu = new DSU(g.n);
    const order = g.edges.map((e, i) => ({ e, i })).sort((a, b) => a.e.w - b.e.w || a.i - b.i);
    let total = 0;
    snap('Sort edges by weight', [{ label: 'edges', items: order.map(({ e }) => `${L(e.u)}${L(e.v)}:${e.w}`) }]);
    for (const { e, i } of order) {
      et.set(i, 'compare');
      if (dsu.unite(e.u, e.v)) {
        total += e.w;
        et.set(i, 'path');
        tones[e.u] = 'done';
        tones[e.v] = 'done';
        snap(`Take ${L(e.u)}–${L(e.v)} (w=${e.w}); it joins two components. Total = ${total}`, [], { total });
      } else {
        et.set(i, 'muted');
        snap(`Skip ${L(e.u)}–${L(e.v)} (w=${e.w}); its endpoints are already connected`, [], { total });
      }
    }
    snap(`Minimum spanning tree weight = ${total}`, [], { total });
  } else if (algo === 'prim') {
    const inTree = new Array(g.n).fill(false);
    const pq = new MinHeap<{ e: Edge; i: number }>();
    let total = 0;
    inTree[src] = true;
    tones[src] = 'done';
    const pushFrom = (u: number) => {
      g.edges.forEach((e, i) => {
        if (e.u === u && !inTree[e.v]) pq.push(e.w, { e: { u, v: e.v, w: e.w }, i });
        if (e.v === u && !inTree[e.u]) pq.push(e.w, { e: { u, v: e.u, w: e.w }, i });
      });
    };
    pushFrom(src);
    snap(`Start the tree at ${L(src)}; push its edges into a min-heap`, [], { total });
    while (pq.size) {
      const { e, i } = pq.pop()!.value;
      if (inTree[e.v]) continue;
      inTree[e.v] = true;
      total += e.w;
      tones[e.v] = 'done';
      et.set(i, 'path');
      pushFrom(e.v);
      snap(`Cheapest edge leaving the tree: ${L(e.u)}–${L(e.v)} (w=${e.w}). Total = ${total}`, [], { total });
    }
    snap(`Minimum spanning tree weight = ${total}`, [], { total });
  }
  return steps;
}
