import { describe, expect, it } from 'vitest';
import * as core from '../src/lib/algorithms/core';
import { SORT_INFO, runSort, type SortAlgo } from '../src/lib/algorithms/sorting';
import { MinHeap } from '../src/lib/algorithms/minheap';
import { DSU, SAMPLE_DAG, SAMPLE_UNDIRECTED, bfsOrder, dijkstra, kruskal, prim, topoSort } from '../src/lib/algorithms/graph';
import { makeGrid, runGrid } from '../src/lib/algorithms/grid';
import { coinChangeDP, greedyCoins, lcsDP } from '../src/lib/algorithms/labs';
import { mulberry32, randomArray } from '../src/lib/rng';

describe('sorting', () => {
  const algos = Object.keys(SORT_INFO) as SortAlgo[];
  for (const algo of algos) {
    it(`${algo} sorts random arrays and ends with a sorted frame`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const a = randomArray(12, 30, seed);
        const run = runSort(algo, a);
        const last = run.steps[run.steps.length - 1].state;
        const values = last.kind === 'array' ? last.rows[0].values : [];
        expect(values).toEqual([...a].sort((x, y) => x - y));
      }
    });
  }
  it('handles empty and single inputs', () => {
    for (const algo of algos) {
      expect(() => runSort(algo, [])).not.toThrow();
      expect(() => runSort(algo, [5])).not.toThrow();
    }
  });
});

describe('core algorithms', () => {
  it('prefix sums and range sums', () => {
    const p = core.prefixSums([3, 1, 4, 1, 5]);
    expect(p).toEqual([0, 3, 4, 8, 9, 14]);
    expect(core.rangeSum(p, 1, 3)).toBe(6);
  });
  it('binary search family agrees with linear scans', () => {
    const rnd = mulberry32(7);
    for (let t = 0; t < 200; t++) {
      const a = Array.from({ length: Math.floor(rnd() * 12) }, () => Math.floor(rnd() * 10)).sort((x, y) => x - y);
      const x = Math.floor(rnd() * 12) - 1;
      const lb = a.findIndex((v) => v >= x);
      const ub = a.findIndex((v) => v > x);
      expect(core.lowerBound(a, x)).toBe(lb === -1 ? a.length : lb);
      expect(core.upperBound(a, x)).toBe(ub === -1 ? a.length : ub);
      const bs = core.binarySearch(a, x);
      if (a.includes(x)) expect(a[bs]).toBe(x);
      else expect(bs).toBe(-1);
    }
  });
  it('sliding windows', () => {
    expect(core.maxWindowSum([2, 1, 5, 1, 3, 2], 3)).toBe(9);
    expect(core.longestUniqueSubstring('abcabcbb')).toBe(3);
    expect(core.minSubarrayLen([2, 3, 1, 2, 4, 3], 7)).toBe(2);
  });
  it('stack, list and DP helpers', () => {
    expect(core.nextGreater([2, 1, 2, 4, 3])).toEqual([4, 2, 4, -1, -1]);
    expect(core.climbStairs(5)).toBe(8);
    expect(core.houseRobber([2, 7, 9, 3, 1])).toBe(12);
    expect(core.knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)).toBe(9);
    expect(core.lisLength([10, 9, 2, 5, 3, 7, 101, 18])).toBe(4);
    expect(core.lcsLength('ABCBDAB', 'BDCABA')).toBe(4);
    expect(core.uniquePathsWithObstacles([[0, 0, 0], [0, 1, 0], [0, 0, 0]])).toBe(2);
  });
});

describe('heap', () => {
  it('pops in ascending order', () => {
    const h = new MinHeap<number>();
    const a = randomArray(50, 100, 3).map((x) => x - 50);
    a.forEach((x) => h.push(x, x));
    const out: number[] = [];
    while (h.size) out.push(h.pop()!.value);
    expect(out).toEqual([...a].sort((x, y) => x - y));
  });
});

describe('graphs', () => {
  it('BFS distances are non-decreasing in visit order', () => {
    const { order, dist } = bfsOrder(SAMPLE_UNDIRECTED, 0);
    for (let i = 1; i < order.length; i++) expect(dist[order[i]]).toBeGreaterThanOrEqual(dist[order[i - 1]]);
  });
  it('Dijkstra source distance is zero and triangle inequality holds', () => {
    const { dist } = dijkstra(SAMPLE_UNDIRECTED, 0);
    expect(dist[0]).toBe(0);
    for (const e of SAMPLE_UNDIRECTED.edges) {
      expect(dist[e.v]).toBeLessThanOrEqual(dist[e.u] + e.w);
      expect(dist[e.u]).toBeLessThanOrEqual(dist[e.v] + e.w);
    }
  });
  it('topological order respects every edge and detects cycles', () => {
    const edges = SAMPLE_DAG.edges.map((e) => [e.u, e.v] as [number, number]);
    const order = topoSort(SAMPLE_DAG.n, edges)!;
    const pos = new Map(order.map((v, i) => [v, i]));
    for (const [u, v] of edges) expect(pos.get(u)!).toBeLessThan(pos.get(v)!);
    expect(topoSort(2, [[0, 1], [1, 0]])).toBeNull();
  });
  it('Kruskal and Prim agree on MST weight', () => {
    expect(kruskal(SAMPLE_UNDIRECTED).weight).toBe(prim(SAMPLE_UNDIRECTED).weight);
  });
  it('DSU unites components', () => {
    const d = new DSU(4);
    expect(d.unite(0, 1)).toBe(true);
    expect(d.unite(1, 0)).toBe(false);
    expect(d.find(0)).toBe(d.find(1));
    expect(d.find(2)).not.toBe(d.find(0));
  });
});

describe('grid search', () => {
  it('BFS finds the Manhattan shortest path on an empty grid', () => {
    const g = makeGrid(6, 8);
    const run = runGrid('bfs', g);
    const r = (id: number) => Math.floor(id / g.cols);
    const c = (id: number) => id % g.cols;
    expect(run.path.length - 1).toBe(Math.abs(r(g.start) - r(g.goal)) + Math.abs(c(g.start) - c(g.goal)));
    expect(run.path[0]).toBe(g.start);
    expect(run.path[run.path.length - 1]).toBe(g.goal);
  });
  it('A* and Dijkstra find paths of equal length to BFS on unit grids', () => {
    const g = makeGrid(7, 9);
    const b = runGrid('bfs', g).path.length;
    expect(runGrid('dijkstra', g).path.length).toBe(b);
    expect(runGrid('astar', g).path.length).toBe(b);
  });
});

describe('lab DP and greedy', () => {
  it('coin change DP beats greedy on a non-canonical system', () => {
    expect(coinChangeDP([1, 3, 4], 6).answer).toBe(2);
    expect(greedyCoins([1, 3, 4], 6)).toBe(3);
  });
  it('LCS lab returns a valid subsequence', () => {
    const r = lcsDP('ABCBDAB', 'BDCABA');
    expect(r.length).toBe(4);
    expect(r.sequence).toHaveLength(4);
  });
});
