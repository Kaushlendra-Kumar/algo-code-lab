import type { Zone } from '../types/content';

// Positions are percentages on the learning-world map.
export const ZONES: Zone[] = [
  { id: 'foundations', name: 'Foundations Isle', tagline: 'Big-O, arrays, sorting and bits', days: [1, 9, 14], color: '#7c9cff', x: 9, y: 70 },
  { id: 'arrays-hashing', name: 'Hashing Harbor', tagline: 'Frequency maps, prefix sums, range tricks', days: [2, 3], color: '#38bdf8', x: 20, y: 40 },
  { id: 'two-pointers', name: 'Twin Pointer Pass', tagline: 'Converging and chasing pointers', days: [4], color: '#22d3ee', x: 30, y: 72 },
  { id: 'sliding-window', name: 'Window Cliffs', tagline: 'Fixed and elastic windows', days: [5], color: '#2dd4bf', x: 37, y: 22 },
  { id: 'linked-lists', name: 'Chain Caverns', tagline: 'Fast & slow pointers on nodes', days: [6], color: '#a3e635', x: 44, y: 56 },
  { id: 'binary-search', name: 'Bisection Peaks', tagline: 'Halve the search space', days: [7, 8], color: '#facc15', x: 52, y: 15 },
  { id: 'stacks-queues', name: 'Stack Citadel', tagline: 'Stacks, queues, deques and heaps', days: [10, 15], color: '#fb923c', x: 56, y: 80 },
  { id: 'recursion', name: 'Recursion Grove', tagline: 'Call stacks and backtracking', days: [11, 12, 13], color: '#f472b6', x: 64, y: 44 },
  { id: 'trees', name: 'Canopy Forest', tagline: 'DFS, BFS, BSTs and tries', days: [16, 17, 18, 19, 32], color: '#4ade80', x: 72, y: 18 },
  { id: 'graphs', name: 'Graph Archipelago', tagline: 'Traversal, ordering, shortest paths', days: [21, 22, 23, 24, 25, 35, 36], color: '#c084fc', x: 80, y: 66 },
  { id: 'dynamic-programming', name: 'Memo Mountains', tagline: 'States, transitions, tables', days: [26, 27, 28, 29, 30, 37], color: '#e879f9', x: 88, y: 32 },
  { id: 'greedy', name: 'Greedy Gulch', tagline: 'Intervals, exchange arguments, sweeps', days: [20, 31, 34], color: '#f87171', x: 68, y: 86 },
  { id: 'advanced', name: 'Summit of Synthesis', tagline: 'Mixed patterns and interview simulation', days: [33, 38, 39, 40], color: '#fde68a', x: 93, y: 82 },
];

export const zoneOfDay = (day: number) => ZONES.find((z) => z.days.includes(day));
