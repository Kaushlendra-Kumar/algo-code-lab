import type { ArrayState, Step, Tone } from '../viz/types';

export type SortAlgo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';

export interface SortRun {
  steps: Step<ArrayState>[];
  result: number[];
  comparisons: number;
  writes: number;
}

export const SORT_INFO: Record<
  SortAlgo,
  { name: string; best: string; average: string; worst: string; space: string; stable: boolean; note: string }
> = {
  bubble: {
    name: 'Bubble Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Repeatedly swaps adjacent out-of-order pairs; the largest remaining value "bubbles" to the end of each pass. Stops early when a pass makes no swaps.',
  },
  selection: {
    name: 'Selection Sort',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    note: 'Selects the minimum of the unsorted suffix and swaps it into place. Always does ~n²/2 comparisons but at most n−1 swaps.',
  },
  insertion: {
    name: 'Insertion Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Grows a sorted prefix by shifting larger elements right and inserting the next value. Excellent on nearly sorted input.',
  },
  merge: {
    name: 'Merge Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    note: 'Divide and conquer: sort both halves recursively, then merge two sorted runs with two pointers.',
  },
  quick: {
    name: 'Quick Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n) stack (average)',
    stable: false,
    note: 'Partitions around a pivot (Lomuto, last element here) so smaller values go left, then recurses. Worst case appears on already-sorted input with this pivot choice.',
  },
  heap: {
    name: 'Heap Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    note: 'Builds a max-heap in place, then repeatedly swaps the root (maximum) to the end and sifts the new root down.',
  },
};

class Recorder {
  steps: Step<ArrayState>[] = [];
  comparisons = 0;
  writes = 0;
  sorted = new Set<number>();
  constructor(public a: number[]) {}

  snap(note: string, tones: Record<number, Tone> = {}, extra: Partial<ArrayState> = {}) {
    const t: Record<number, Tone> = {};
    this.sorted.forEach((i) => (t[i] = 'done'));
    Object.assign(t, tones);
    this.steps.push({
      state: { kind: 'array', bars: true, rows: [{ label: 'array', values: [...this.a], tones: t }], ...extra },
      note,
      vars: { comparisons: this.comparisons, writes: this.writes },
    });
  }
  less(i: number, j: number) {
    this.comparisons++;
    this.snap(`Compare a[${i}]=${this.a[i]} with a[${j}]=${this.a[j]}`, { [i]: 'compare', [j]: 'compare' });
    return this.a[i] < this.a[j];
  }
  swap(i: number, j: number) {
    if (i === j) return;
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.writes += 2;
    this.snap(`Swap positions ${i} and ${j}`, { [i]: 'swap', [j]: 'swap' });
  }
  write(i: number, v: number, note?: string) {
    this.a[i] = v;
    this.writes++;
    this.snap(note ?? `Write ${v} into position ${i}`, { [i]: 'swap' });
  }
}

function bubble(r: Recorder) {
  const n = r.a.length;
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - pass; j++) {
      if (r.less(j + 1, j)) {
        r.swap(j, j + 1);
        swapped = true;
      }
    }
    r.sorted.add(n - 1 - pass);
    if (!swapped) {
      for (let k = 0; k < n; k++) r.sorted.add(k);
      r.snap(`Pass ${pass + 1} made no swaps — the array is sorted, stop early`);
      return;
    }
  }
  for (let k = 0; k < n; k++) r.sorted.add(k);
}

function selection(r: Recorder) {
  const n = r.a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) if (r.less(j, min)) min = j;
    r.swap(i, min);
    r.sorted.add(i);
  }
  for (let k = 0; k < n; k++) r.sorted.add(k);
}

function insertion(r: Recorder) {
  const n = r.a.length;
  if (n) r.sorted.add(0);
  for (let i = 1; i < n; i++) {
    const key = r.a[i];
    let j = i - 1;
    r.snap(`Take key = ${key} from position ${i}`, { [i]: 'active' });
    while (j >= 0) {
      r.comparisons++;
      r.snap(`Is a[${j}]=${r.a[j]} > key ${key}?`, { [j]: 'compare' });
      if (r.a[j] <= key) break;
      r.write(j + 1, r.a[j], `Shift ${r.a[j]} right to position ${j + 1}`);
      j--;
    }
    r.write(j + 1, key, `Insert key ${key} at position ${j + 1}`);
    r.sorted.add(i);
  }
}

function merge(r: Recorder) {
  const a = r.a;
  const rec = (lo: number, hi: number) => {
    if (hi - lo < 1) return;
    const mid = (lo + hi) >> 1;
    rec(lo, mid);
    rec(mid + 1, hi);
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    r.snap(`Merge [${lo}..${mid}] with [${mid + 1}..${hi}]`, {}, {
      rows: [{ label: 'array', values: [...a], range: { from: lo, to: hi, tone: 'active' } }],
    });
    while (i < left.length && j < right.length) {
      r.comparisons++;
      if (left[i] <= right[j]) r.write(k++, left[i++], `Take ${left[i - 1]} from the left run`);
      else r.write(k++, right[j++], `Take ${right[j - 1]} from the right run`);
    }
    while (i < left.length) r.write(k++, left[i++], `Copy remaining ${left[i - 1]} from the left run`);
    while (j < right.length) r.write(k++, right[j++], `Copy remaining ${right[j - 1]} from the right run`);
  };
  rec(0, a.length - 1);
  for (let k = 0; k < a.length; k++) r.sorted.add(k);
}

function quick(r: Recorder) {
  const a = r.a;
  const rec = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      r.sorted.add(lo);
      return;
    }
    const pivot = hi;
    let i = lo;
    r.snap(`Partition [${lo}..${hi}] around pivot ${a[pivot]}`, { [pivot]: 'active' });
    for (let j = lo; j < hi; j++) {
      if (r.less(j, pivot)) {
        r.swap(i, j);
        i++;
      }
    }
    r.swap(i, hi);
    r.sorted.add(i);
    r.snap(`Pivot ${a[i]} is now in its final position ${i}`, { [i]: 'found' });
    rec(lo, i - 1);
    rec(i + 1, hi);
  };
  rec(0, a.length - 1);
  for (let k = 0; k < a.length; k++) r.sorted.add(k);
}

function heap(r: Recorder) {
  const a = r.a;
  const n = a.length;
  const sift = (i: number, size: number) => {
    for (;;) {
      const l = 2 * i + 1;
      const rr = l + 1;
      let big = i;
      if (l < size && r.less(big, l)) big = l;
      if (rr < size && r.less(big, rr)) big = rr;
      if (big === i) return;
      r.swap(i, big);
      i = big;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  r.snap('Max-heap built: the maximum is at the root (index 0)', { 0: 'found' });
  for (let end = n - 1; end > 0; end--) {
    r.swap(0, end);
    r.sorted.add(end);
    sift(0, end);
  }
  for (let k = 0; k < n; k++) r.sorted.add(k);
}

const IMPL: Record<SortAlgo, (r: Recorder) => void> = { bubble, selection, insertion, merge, quick, heap };

export function runSort(algo: SortAlgo, input: readonly number[]): SortRun {
  const r = new Recorder([...input]);
  r.snap(`Start ${SORT_INFO[algo].name} on ${input.length} values`);
  IMPL[algo](r);
  r.snap(`Done: ${r.comparisons} comparisons, ${r.writes} writes`);
  return { steps: r.steps, result: r.a, comparisons: r.comparisons, writes: r.writes };
}
