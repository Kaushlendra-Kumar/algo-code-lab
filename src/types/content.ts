// Content schemas for AlgoVerse. Content lives in src/content and is kept
// separate from UI components so it can be validated and audited.

export const CONTENT_SCHEMA_VERSION = 1;

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ZoneId =
  | 'foundations'
  | 'arrays-hashing'
  | 'two-pointers'
  | 'sliding-window'
  | 'binary-search'
  | 'linked-lists'
  | 'stacks-queues'
  | 'recursion'
  | 'trees'
  | 'graphs'
  | 'dynamic-programming'
  | 'greedy'
  | 'advanced';

export type VizId =
  | 'sorting'
  | 'grid-paths'
  | 'graph-algos'
  | 'two-pointers'
  | 'sliding-window'
  | 'prefix-sum'
  | 'binary-search'
  | 'fast-slow'
  | 'stack-queue'
  | 'heap'
  | 'recursion'
  | 'dp'
  | 'greedy'
  | 'complexity'
  | 'tree';

/** Ids of step generators that are synchronised with a C++ example (see lib/viz/traces). */
export type TraceId =
  | 'prefix-sum'
  | 'two-sum-hash'
  | 'pair-sum-sorted'
  | 'window-fixed'
  | 'window-variable'
  | 'binary-search'
  | 'lower-bound'
  | 'fast-slow-cycle'
  | 'next-greater'
  | 'insertion-sort'
  | 'subsets'
  | 'bfs-grid'
  | 'dijkstra'
  | 'topo-kahn'
  | 'union-find'
  | 'climb-stairs'
  | 'knapsack'
  | 'heap-topk'
  | 'level-order'
  | 'merge-intervals'
  | 'house-robber'
  | 'running-sum';

export interface KeyLine {
  /** Substring that identifies the explained line inside the code. */
  match: string;
  note: string;
}

export interface Complexity {
  time: string;
  space: string;
  why: string;
}

export interface DryRun {
  columns: string[];
  rows: string[][];
}

export interface CppExample {
  id: string;
  title: string;
  goal: string;
  input: string;
  /** Exact stdout of the program; verified with g++ by scripts/verify-cpp.ts. */
  output: string;
  idea: string;
  /** Complete C++17 program. Trailing `//#name` comments are trace markers and are hidden in the UI. */
  code: string;
  keyLines: KeyLine[];
  /** Manually written dry run. Examples with a trace derive theirs from the trace steps. */
  dryRun?: DryRun;
  complexity: Complexity;
  edgeCases: string[];
  mistakes: string[];
  tryIt: string;
  /** "variant" | "brute-vs-optimized" | "edge-case" — what role Example B plays. */
  kind?: 'core' | 'variant' | 'brute-vs-optimized' | 'edge-case';
  trace?: { id: TraceId; input: unknown };
  /** Line marked with //@gap become fill-the-gap exercises. */
  bug?: BugExercise;
}

export interface BugExercise {
  /** Exact substring of a code line to replace to create the bug. */
  find: string;
  replace: string;
  symptom: string;
  explanation: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface LessonSection {
  heading: string;
  body: string;
}

export interface OptimizeExercise {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface CurriculumDay {
  day: number;
  title: string;
  zone: ZoneId;
  advanced?: boolean;
  objectives: string[];
  prerequisites: string[];
  lesson: LessonSection[];
  recognition: string[];
  patterns: string[];
  visualizations: VizId[];
  exampleA: CppExample;
  exampleB: CppExample;
  complexityNotes: string;
  quiz: QuizQuestion[];
  optimize?: OptimizeExercise;
  recap: string;
  nextPrep: string;
}

export interface TestCase {
  in: string;
  out: string;
}

export interface Question {
  id: string;
  day: number;
  title: string;
  difficulty: Difficulty;
  topic: ZoneId;
  /** Pattern ids, primary first. */
  patterns: string[];
  objective: string;
  statement: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  edgeCases: string[];
  cues: string[];
  hints: string[];
  brute?: string;
  approach: string;
  correctness: string;
  complexity: Complexity;
  /** Solution function(s). */
  cpp: string;
  /** Driver that reads stdin in the `io` format and prints the answer. */
  main: string;
  io: string;
  keyLines: KeyLine[];
  mistakes: string[];
  tests: TestCase[];
  prerequisites?: string[];
  related?: string[];
  viz?: VizId;
}

/** A day module bundles the lesson and its practice questions. */
export interface DayModule {
  day: CurriculumDay;
  questions: Question[];
}

export interface Pattern {
  id: string;
  name: string;
  family: PatternFamily;
  summary: string;
  cues: string[];
  useWhen: string[];
  avoidWhen: string[];
  invariant: string;
  complexity: string;
  prerequisites: string[];
  visualization?: VizId;
  /** Reference to a curriculum example id ("d04-A"), when one teaches this pattern. */
  examples: string[];
  /** Short standalone C++ snippet for patterns without a day example, or as an extra variant. */
  cpp?: string;
  go?: string;
  mistakes: string[];
  related: string[];
  intro?: boolean;
}

export type PatternFamily =
  | 'Arrays & Hashing'
  | 'Pointers & Windows'
  | 'Searching & Sorting'
  | 'Stacks & Queues'
  | 'Recursion & Search'
  | 'Trees & Graphs'
  | 'Dynamic Programming'
  | 'Greedy & Optimization'
  | 'Bit Manipulation'
  | 'Interview Meta-Patterns';

export interface Zone {
  id: ZoneId;
  name: string;
  tagline: string;
  days: number[];
  color: string;
  x: number;
  y: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
}
