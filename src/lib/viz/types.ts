// Visual state shapes shared by every lab. Algorithms produce arrays of steps;
// renderers only read state, so algorithm logic stays independent of animation.

export type Tone =
  | 'active'
  | 'compare'
  | 'swap'
  | 'done'
  | 'muted'
  | 'found'
  | 'warn'
  | 'path'
  | 'frontier'
  | 'visited';

export type VarValue = string | number | boolean;

export interface Step<S = VizState> {
  state: S;
  note: string;
  /** Trace marker in the synced C++ code (see content/cpp.ts markerLines). */
  line?: string;
  vars?: Record<string, VarValue>;
}

export interface ArrayRow {
  label: string;
  values: (number | string | null)[];
  /** Index labels under each cell, defaults to 0..n-1. */
  indexLabels?: string[];
  tones?: Record<number, Tone>;
  pointers?: { name: string; index: number; tone?: Tone }[];
  range?: { from: number; to: number; tone?: Tone };
}

export interface ArrayState {
  kind: 'array';
  rows: ArrayRow[];
  aux?: { label: string; items: string[]; tone?: Tone }[];
  bars?: boolean;
}

export interface TableState {
  kind: 'table';
  title?: string;
  rowLabels: string[];
  colLabels: string[];
  cells: (string | number | null)[][];
  active?: [number, number];
  deps?: [number, number][];
  path?: [number, number][];
  aux?: { label: string; items: string[]; tone?: Tone }[];
}

export interface GridCellInfo {
  wall?: boolean;
  weight?: number;
}

export interface GridState {
  kind: 'grid';
  rows: number;
  cols: number;
  walls: boolean[];
  weights?: number[];
  start: number;
  goal: number;
  visited: number[];
  frontier: number[];
  current?: number;
  path?: number[];
  dist?: (number | null)[];
  labels?: (string | null)[];
}

export interface GraphNodeView {
  id: number;
  x: number;
  y: number;
  label: string;
  tone?: Tone;
  badge?: string;
}

export interface GraphEdgeView {
  u: number;
  v: number;
  w?: number;
  directed?: boolean;
  tone?: Tone;
}

export interface GraphState {
  kind: 'graph';
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
  aux?: { label: string; items: string[]; tone?: Tone }[];
}

export interface TreeNodeView {
  id: number;
  label: string;
  left?: number;
  right?: number;
  tone?: Tone;
  x?: number;
  y?: number;
}

export interface TreeState {
  kind: 'tree';
  nodes: TreeNodeView[];
  root: number | null;
  aux?: { label: string; items: string[]; tone?: Tone }[];
}

export interface RecNode {
  id: number;
  parent: number | null;
  label: string;
  tone?: Tone;
}

export interface RecursionState {
  kind: 'recursion';
  nodes: RecNode[];
  current: number | null;
  stack: string[];
  partial: string;
  results: string[];
  pruned: number;
}

export interface ListState {
  kind: 'list';
  values: number[];
  next: number[];
  pointers: { name: string; index: number; tone?: Tone }[];
  tones?: Record<number, Tone>;
}

export interface TimelineItem {
  id: string;
  start: number;
  end: number;
  lane?: number;
  tone?: Tone;
  label?: string;
}

export interface TimelineState {
  kind: 'timeline';
  maxTime: number;
  items: TimelineItem[];
  lanes?: string[];
  marker?: number;
  aux?: { label: string; items: string[]; tone?: Tone }[];
}

export type VizState =
  | ArrayState
  | TableState
  | GridState
  | GraphState
  | TreeState
  | RecursionState
  | ListState
  | TimelineState;
