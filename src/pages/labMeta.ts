import type { VizId } from '../types/content';

export const LAB_META: Record<VizId, { title: string; icon: string; blurb: string; group: string }> = {
  sorting: { title: 'Sorting Arena', icon: '▥', blurb: 'Six sorting algorithms with comparison and write counters, side-by-side races.', group: 'Core' },
  'grid-paths': { title: 'Maze & Pathfinding Lab', icon: '▦', blurb: 'Draw walls, weights, start and goal; compare BFS, DFS, Dijkstra and A*.', group: 'Graphs' },
  'graph-algos': { title: 'Graph Algorithms Lab', icon: '⬡', blurb: 'BFS, DFS, Dijkstra, topological sort, Union-Find, Kruskal and Prim on node-link graphs.', group: 'Graphs' },
  'two-pointers': { title: 'Two Pointers', icon: '⇆', blurb: 'Watch converging pointers discard impossible pairs.', group: 'Arrays & Pointers' },
  'sliding-window': { title: 'Sliding Window', icon: '▭', blurb: 'Fixed and variable windows with invariants on screen.', group: 'Arrays & Pointers' },
  'prefix-sum': { title: 'Prefix Sums & Hashing', icon: 'Σ', blurb: 'Prefix arrays, range queries, running aggregates and hash lookups.', group: 'Arrays & Pointers' },
  'binary-search': { title: 'Binary Search', icon: '⌖', blurb: 'Exact search and lower bound with lo / mid / hi.', group: 'Arrays & Pointers' },
  'fast-slow': { title: 'Fast & Slow Pointers', icon: '⥂', blurb: "Floyd's cycle detection on a linked list.", group: 'Arrays & Pointers' },
  'stack-queue': { title: 'Stacks, Queues & Deques', icon: '☷', blurb: 'Push/pop, FIFO queues, monotonic stack and sliding-window maximum.', group: 'Structures' },
  heap: { title: 'Heap Lab', icon: '△', blurb: 'Sift-up/sift-down on a binary heap and top-K selection.', group: 'Structures' },
  tree: { title: 'Tree Lab', icon: '⟁', blurb: 'BST insertion, pre/in/post-order DFS and level-order BFS.', group: 'Structures' },
  recursion: { title: 'Recursion & Backtracking', icon: '⑂', blurb: 'Recursion trees, call stacks, choices, undo and pruning.', group: 'Search & DP' },
  dp: { title: 'Dynamic Programming Lab', icon: '▤', blurb: 'Tables, dependencies and reconstruction for classic DP problems.', group: 'Search & DP' },
  greedy: { title: 'Greedy & Scheduling Lab', icon: '⧗', blurb: 'Interval scheduling with counterexamples, CPU scheduling, coin change.', group: 'Search & DP' },
  complexity: { title: 'Complexity Lab', icon: '∿', blurb: 'Compare growth curves and run real (labelled) timing experiments.', group: 'Core' },
};
