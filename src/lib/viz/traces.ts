// Scripted educational traces. Each generator mirrors the control flow of the
// matching C++ program in content/traceCode.ts on the same input, emitting the
// marker of the line being executed plus a variable watch. Tests assert that
// every marker exists in the code and that each default-input run prints the
// same output as the compiled C++ program.
import type { TraceId, VizId } from '../../types/content';
import type {
  ArrayState,
  GraphState,
  GridState,
  ListState,
  RecursionState,
  Step,
  TableState,
  TimelineState,
  Tone,
  TreeState,
  VizState,
} from './types';
import { TRACE_CODE } from '../../content/traceCode';

export interface TraceRun {
  steps: Step<VizState>[];
  output: string;
}

export type InputField = { key: string; label: string; type: 'int-array' | 'int' | 'string' };

export interface TraceDef {
  id: TraceId;
  title: string;
  viz: VizId;
  code: string;
  defaultInput: Record<string, unknown>;
  fields: InputField[];
  validate?: (input: Record<string, unknown>) => string | null;
  run: (input: Record<string, unknown>) => TraceRun;
}

const arr = (label: string, values: (number | string | null)[], extra: Partial<ArrayState['rows'][number]> = {}) => ({
  label,
  values,
  ...extra,
});

// ---------------------------------------------------------------- running sum
function runningSum(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const steps: Step[] = [];
  let sum = 0;
  let best = a[0];
  let bestIdx = 0;
  const view = (i: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [arr('a', a, { tones: { [bestIdx]: 'found', ...tones }, pointers: i >= 0 ? [{ name: 'i', index: i }] : [] })],
  });
  steps.push({ state: view(-1), line: 'init', note: 'sum starts at 0 (long long avoids overflow on big inputs)', vars: { sum } });
  steps.push({ state: view(-1), line: 'init2', note: `best = a[0] = ${best}`, vars: { sum, best, bestIdx } });
  for (let i = 0; i < a.length; i++) {
    sum += a[i];
    steps.push({ state: view(i, { [i]: 'active' }), line: 'add', note: `Add a[${i}] = ${a[i]} → sum = ${sum}`, vars: { i, 'a[i]': a[i], sum, best } });
    const gt = a[i] > best;
    steps.push({
      state: view(i, { [i]: 'compare' }),
      line: 'cmp',
      note: `Is a[${i}] = ${a[i]} > best = ${best}? ${gt ? 'yes' : 'no'}`,
      vars: { i, 'a[i]': a[i], sum, best },
    });
    if (gt) {
      best = a[i];
      bestIdx = i;
      steps.push({ state: view(i), line: 'upd', note: `New maximum ${best} at index ${i}`, vars: { i, sum, best, bestIdx } });
    }
  }
  const output = `sum = ${sum}\nmax = ${best} at index ${bestIdx}`;
  steps.push({ state: view(-1), line: 'print', note: 'One pass, O(n) time, O(1) extra space', vars: { sum, best, bestIdx } });
  return { steps, output };
}

// ---------------------------------------------------------------- prefix sum
function prefixSum(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const queries = input.queries as [number, number][];
  const n = a.length;
  const prefix: (number | null)[] = new Array(n + 1).fill(null);
  prefix[0] = 0;
  const steps: Step[] = [];
  const view = (aTones: Record<number, Tone>, pTones: Record<number, Tone>, range?: [number, number]): ArrayState => ({
    kind: 'array',
    rows: [
      arr('a', a, { tones: aTones, range: range ? { from: range[0], to: range[1], tone: 'active' } : undefined }),
      arr('prefix', [...prefix], { tones: pTones }),
    ],
  });
  steps.push({ state: view({}, { 0: 'done' }), line: 'init', note: 'prefix has n + 1 slots; prefix[0] = 0 is the empty sum', vars: { n } });
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = (prefix[i] as number) + a[i];
    steps.push({
      state: view({ [i]: 'active' }, { [i]: 'compare', [i + 1]: 'found' }),
      line: 'build',
      note: `prefix[${i + 1}] = prefix[${i}] + a[${i}] = ${prefix[i]} + ${a[i]} = ${prefix[i + 1]}`,
      vars: { i, 'a[i]': a[i], [`prefix[${i + 1}]`]: prefix[i + 1] as number },
    });
  }
  const lines: string[] = [];
  for (const [l, r] of queries) {
    const sum = (prefix[r + 1] as number) - (prefix[l] as number);
    steps.push({
      state: view({}, { [r + 1]: 'found', [l]: 'warn' }, [l, r]),
      line: 'query',
      note: `sum(${l}..${r}) = prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${sum}`,
      vars: { l, r, sum },
    });
    lines.push(`sum[${l}..${r}] = ${sum}`);
    steps.push({ state: view({}, {}, [l, r]), line: 'print', note: `Print ${lines[lines.length - 1]} — each query is O(1)`, vars: { l, r, sum } });
  }
  return { steps, output: lines.join('\n') };
}

// ---------------------------------------------------------------- two sum hash
function twoSumHash(input: Record<string, unknown>): TraceRun {
  const nums = input.nums as number[];
  const target = input.target as number;
  const seen = new Map<number, number>();
  const steps: Step[] = [];
  const view = (i: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [arr('nums', nums, { tones, pointers: i >= 0 ? [{ name: 'i', index: i }] : [] })],
    aux: [{ label: 'seen (value → index)', items: [...seen].map(([v, i]) => `${v} → ${i}`) }],
  });
  steps.push({ state: view(-1), line: 'init', note: 'The map remembers values we have already passed', vars: { target } });
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    steps.push({ state: view(i, { [i]: 'active' }), line: 'need', note: `need = ${target} − ${nums[i]} = ${need}`, vars: { i, 'nums[i]': nums[i], need } });
    const hit = seen.get(need);
    steps.push({
      state: view(i, { [i]: 'active', ...(hit !== undefined ? { [hit]: 'found' } : {}) }),
      line: 'lookup',
      note: hit !== undefined ? `${need} is in the map at index ${hit}` : `${need} is not in the map yet`,
      vars: { i, need, found: hit !== undefined },
    });
    if (hit !== undefined) {
      steps.push({ state: view(i, { [i]: 'found', [hit]: 'found' }), line: 'found', note: `Return {${hit}, ${i}}`, vars: { i, need } });
      return { steps, output: `indices ${hit} ${i}` };
    }
    seen.set(nums[i], i);
    steps.push({ state: view(i, { [i]: 'done' }), line: 'store', note: `Store ${nums[i]} → ${i}`, vars: { i, size: seen.size } });
  }
  steps.push({ state: view(-1), line: 'none', note: 'No pair adds up to the target' });
  return { steps, output: 'no pair' };
}

// ---------------------------------------------------------------- pair sum sorted
function pairSum(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const target = input.target as number;
  const steps: Step[] = [];
  let left = 0;
  let right = a.length - 1;
  const view = (tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [
      arr('a', a, {
        tones,
        pointers: left < a.length && right >= 0 ? [
          { name: 'left', index: left, tone: 'active' },
          { name: 'right', index: right, tone: 'warn' },
        ] : [],
        range: left <= right ? { from: left, to: right, tone: 'muted' } : undefined,
      }),
    ],
  });
  steps.push({ state: view(), line: 'init', note: 'Start with the widest pair: smallest + largest', vars: { left, right, target } });
  while (true) {
    const cont = left < right;
    steps.push({ state: view(), line: 'loop', note: `left < right? ${cont ? 'yes' : 'no'}`, vars: { left, right } });
    if (!cont) break;
    const sum = a[left] + a[right];
    steps.push({ state: view({ [left]: 'compare', [right]: 'compare' }), line: 'sum', note: `sum = ${a[left]} + ${a[right]} = ${sum}`, vars: { left, right, sum, target } });
    if (sum === target) {
      steps.push({ state: view({ [left]: 'found', [right]: 'found' }), line: 'found', note: `Found ${a[left]} + ${a[right]} = ${target}`, vars: { left, right, sum } });
      return { steps, output: `pair at ${left} ${right} (${a[left]} + ${a[right]})` };
    }
    if (sum < target) {
      left++;
      steps.push({ state: view(), line: 'left', note: `${sum} < ${target}: every pair with the old left is too small → left++`, vars: { left, right, sum } });
    } else {
      right--;
      steps.push({ state: view(), line: 'right', note: `${sum} > ${target}: every pair with the old right is too big → right--`, vars: { left, right, sum } });
    }
  }
  steps.push({ state: view(), line: 'none', note: 'Pointers met — no pair exists' });
  return { steps, output: 'no pair' };
}

// ---------------------------------------------------------------- fixed window
function windowFixed(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const k = input.k as number;
  const steps: Step[] = [];
  if (k > a.length) return { steps: [{ state: { kind: 'array', rows: [arr('a', a)] }, note: 'k is larger than the array' }], output: 'window larger than array' };
  let window = 0;
  let best = 0;
  let bestStart = 0;
  const view = (from: number, to: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [arr('a', a, { tones, range: to >= from ? { from, to, tone: 'active' } : undefined })],
    aux: [{ label: 'best window', items: [`start ${bestStart}`, `sum ${best}`] }],
  });
  steps.push({ state: view(0, -1), line: 'init', note: `Window size k = ${k}`, vars: { k, window } });
  for (let i = 0; i < k; i++) window += a[i];
  best = window;
  steps.push({ state: view(0, k - 1), line: 'first', note: `First window a[0..${k - 1}] sums to ${window}`, vars: { window } });
  steps.push({ state: view(0, k - 1), line: 'best0', note: 'It is the best so far', vars: { window, best, bestStart } });
  for (let right = k; right < a.length; right++) {
    window += a[right] - a[right - k];
    steps.push({
      state: view(right - k + 1, right, { [right]: 'found', [right - k]: 'warn' }),
      line: 'slide',
      note: `Slide: add a[${right}] = ${a[right]}, drop a[${right - k}] = ${a[right - k]} → window = ${window}`,
      vars: { right, window, best },
    });
    const better = window > best;
    steps.push({ state: view(right - k + 1, right), line: 'cmp', note: `${window} > ${best}? ${better ? 'yes' : 'no'}`, vars: { right, window, best } });
    if (better) {
      best = window;
      bestStart = right - k + 1;
      steps.push({ state: view(right - k + 1, right), line: 'upd', note: `New best ${best} starting at ${bestStart}`, vars: { right, best, bestStart } });
    }
  }
  steps.push({ state: view(bestStart, bestStart + k - 1, {}), line: 'print', note: 'Each element entered and left the window once: O(n)', vars: { best, bestStart } });
  return { steps, output: `max sum ${best} starts at ${bestStart}` };
}

// ---------------------------------------------------------------- variable window
function windowVariable(input: Record<string, unknown>): TraceRun {
  const s = input.s as string;
  const chars = [...s];
  const last = new Map<string, number>();
  const steps: Step[] = [];
  let left = 0;
  let best = 0;
  let bestStart = 0;
  const view = (right: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [
      arr('s', chars, {
        tones,
        range: right >= left ? { from: left, to: right, tone: 'active' } : undefined,
        pointers: right >= 0 ? [
          { name: 'left', index: left, tone: 'active' },
          { name: 'right', index: right, tone: 'warn' },
        ] : [],
      }),
    ],
    aux: [{ label: 'last seen', items: [...last].map(([c, i]) => `'${c}' @${i}`) }],
  });
  steps.push({ state: view(-1), line: 'init', note: 'last[c] = most recent index of character c (−1 = never seen)', vars: { left, best } });
  for (let right = 0; right < chars.length; right++) {
    const c = chars[right];
    steps.push({ state: view(right, { [right]: 'active' }), line: 'read', note: `Read s[${right}] = '${c}'`, vars: { left, right, c } });
    const prev = last.get(c) ?? -1;
    const dup = prev >= left;
    steps.push({
      state: view(right, dup ? { [prev]: 'warn', [right]: 'warn' } : { [right]: 'active' }),
      line: 'dup',
      note: dup ? `'${c}' already inside the window at ${prev}` : `'${c}' is not inside the window`,
      vars: { left, right, [`last['${c}']`]: prev },
    });
    if (dup) {
      left = prev + 1;
      steps.push({ state: view(right), line: 'shrink', note: `Jump left past the duplicate → left = ${left}`, vars: { left, right } });
    }
    last.set(c, right);
    steps.push({ state: view(right), line: 'mark', note: `last['${c}'] = ${right}`, vars: { left, right } });
    const len = right - left + 1;
    steps.push({ state: view(right), line: 'cmp', note: `Window length ${len} vs best ${best}`, vars: { left, right, len, best } });
    if (len > best) {
      best = len;
      bestStart = left;
      steps.push({ state: view(right), line: 'upd', note: `New best ${best}: "${s.substr(bestStart, best)}"`, vars: { best, bestStart } });
    }
  }
  const output = `longest ${best} "${s.substr(bestStart, best)}"`;
  steps.push({ state: view(-1, Object.fromEntries(Array.from({ length: best }, (_, i) => [bestStart + i, 'found']))), line: 'print', note: output, vars: { best, bestStart } });
  return { steps, output };
}

// ---------------------------------------------------------------- binary search
function binarySearch(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const target = input.target as number;
  const steps: Step[] = [];
  let lo = 0;
  let hi = a.length - 1;
  const view = (mid: number | null, tones: Record<number, Tone> = {}): ArrayState => {
    const muted: Record<number, Tone> = {};
    a.forEach((_, i) => (i < lo || i > hi) && (muted[i] = 'muted'));
    const pointers = [
      { name: 'lo', index: lo, tone: 'active' as Tone },
      { name: 'hi', index: hi, tone: 'warn' as Tone },
    ].filter((p) => p.index >= 0 && p.index < a.length);
    if (mid !== null) pointers.push({ name: 'mid', index: mid, tone: 'compare' });
    return { kind: 'array', rows: [arr('a', a, { tones: { ...muted, ...tones }, pointers })] };
  };
  steps.push({ state: view(null), line: 'init', note: `Search for ${target} in the closed range [0, ${hi}]`, vars: { lo, hi, target } });
  for (;;) {
    const cont = lo <= hi;
    steps.push({ state: view(null), line: 'loop', note: `lo ≤ hi? ${cont ? 'yes' : 'no — the range is empty'}`, vars: { lo, hi } });
    if (!cont) break;
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ state: view(mid, { [mid]: 'compare' }), line: 'mid', note: `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}; a[mid] = ${a[mid]}`, vars: { lo, hi, mid, 'a[mid]': a[mid] } });
    if (a[mid] === target) {
      steps.push({ state: view(mid, { [mid]: 'found' }), line: 'found', note: `a[${mid}] equals the target`, vars: { lo, hi, mid } });
      return { steps, output: `found ${target} at index ${mid}` };
    }
    if (a[mid] < target) {
      lo = mid + 1;
      steps.push({ state: view(null), line: 'right', note: `${a[mid]} < ${target}: discard the left half → lo = ${lo}`, vars: { lo, hi } });
    } else {
      hi = mid - 1;
      steps.push({ state: view(null), line: 'left', note: `${a[mid]} > ${target}: discard the right half → hi = ${hi}`, vars: { lo, hi } });
    }
  }
  steps.push({ state: view(null), line: 'none', note: `${target} is absent; lo = ${lo} is where it would be inserted`, vars: { lo, hi } });
  return { steps, output: `${target} not found` };
}

// ---------------------------------------------------------------- lower bound
function lowerBound(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const target = input.target as number;
  const steps: Step[] = [];
  let lo = 0;
  let hi = a.length;
  const view = (mid: number | null, tones: Record<number, Tone> = {}): ArrayState => {
    const t: Record<number, Tone> = {};
    a.forEach((_, i) => (i < lo || i >= hi) && (t[i] = 'muted'));
    const pointers: { name: string; index: number; tone?: Tone }[] = [];
    if (lo < a.length) pointers.push({ name: 'lo', index: lo, tone: 'active' });
    if (hi < a.length) pointers.push({ name: 'hi', index: hi, tone: 'warn' });
    if (mid !== null) pointers.push({ name: 'mid', index: mid, tone: 'compare' });
    return {
      kind: 'array',
      rows: [arr('a', a, { tones: { ...t, ...tones }, pointers })],
      aux: [{ label: 'half-open range', items: [`[${lo}, ${hi})`] }],
    };
  };
  steps.push({ state: view(null), line: 'init', note: `Half-open search space [0, ${hi}) — hi = n means "not found"`, vars: { lo, hi, target } });
  for (;;) {
    const cont = lo < hi;
    steps.push({ state: view(null), line: 'loop', note: `lo < hi? ${cont ? 'yes' : 'no — lo is the answer'}`, vars: { lo, hi } });
    if (!cont) break;
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ state: view(mid, { [mid]: 'compare' }), line: 'mid', note: `mid = ${mid}, a[mid] = ${a[mid]}`, vars: { lo, hi, mid, 'a[mid]': a[mid] } });
    if (a[mid] < target) {
      lo = mid + 1;
      steps.push({ state: view(null), line: 'right', note: `${a[mid]} < ${target}: the answer is right of mid → lo = ${lo}`, vars: { lo, hi } });
    } else {
      hi = mid;
      steps.push({ state: view(null), line: 'left', note: `${a[mid]} ≥ ${target}: mid could be the answer, keep it → hi = ${hi}`, vars: { lo, hi } });
    }
  }
  steps.push({ state: view(null, lo < a.length ? { [lo]: 'found' } : {}), line: 'ret', note: `lower bound = ${lo}`, vars: { lo } });
  let after = 0;
  while (after < a.length && a[after] <= target) after++;
  return { steps, output: `first index with a[i] >= ${target}: ${lo}\ncount of ${target}: ${after - lo}` };
}

// ---------------------------------------------------------------- fast/slow
function fastSlow(input: Record<string, unknown>): TraceRun {
  const values = input.values as number[];
  const next = input.next as number[];
  const steps: Step[] = [];
  const view = (ptrs: { name: string; index: number; tone?: Tone }[], tones: Record<number, Tone> = {}): ListState => ({
    kind: 'list',
    values,
    next,
    pointers: ptrs.filter((p) => p.index >= 0),
    tones,
  });
  let slow = 0;
  let fast = 0;
  const v = (i: number) => (i < 0 ? 'null' : values[i]);
  steps.push({ state: view([{ name: 'slow', index: slow, tone: 'active' }, { name: 'fast', index: fast, tone: 'warn' }]), line: 'init', note: 'Both pointers start at head', vars: { slow: v(slow), fast: v(fast) } });
  for (;;) {
    const cont = fast >= 0 && next[fast] >= 0;
    steps.push({ state: view([{ name: 'slow', index: slow, tone: 'active' }, { name: 'fast', index: fast, tone: 'warn' }]), line: 'loop', note: cont ? 'fast and fast->next exist' : 'fast reached the end — no cycle', vars: { slow: v(slow), fast: v(fast) } });
    if (!cont) break;
    slow = next[slow];
    fast = next[next[fast]];
    steps.push({ state: view([{ name: 'slow', index: slow, tone: 'active' }, { name: 'fast', index: fast, tone: 'warn' }]), line: 'move', note: 'slow moves 1 step, fast moves 2 steps', vars: { slow: v(slow), fast: v(fast) } });
    const meet = slow === fast;
    steps.push({ state: view([{ name: 'slow', index: slow, tone: 'active' }, { name: 'fast', index: fast, tone: 'warn' }], meet ? { [slow]: 'found' } : {}), line: 'meet', note: meet ? 'They meet — there is a cycle' : 'Not equal yet', vars: { slow: v(slow), fast: v(fast) } });
    if (meet) {
      let p = 0;
      steps.push({ state: view([{ name: 'p', index: p, tone: 'compare' }, { name: 'slow', index: slow, tone: 'active' }]), line: 'phase2', note: 'Phase 2: p restarts at head; both now move 1 step', vars: { p: v(p), slow: v(slow) } });
      for (;;) {
        const differ = p !== slow;
        steps.push({ state: view([{ name: 'p', index: p, tone: 'compare' }, { name: 'slow', index: slow, tone: 'active' }]), line: 'loop2', note: differ ? 'p != slow' : 'p == slow — this is the cycle entrance', vars: { p: v(p), slow: v(slow) } });
        if (!differ) break;
        p = next[p];
        slow = next[slow];
        steps.push({ state: view([{ name: 'p', index: p, tone: 'compare' }, { name: 'slow', index: slow, tone: 'active' }]), line: 'move2', note: 'Advance both by one', vars: { p: v(p), slow: v(slow) } });
      }
      steps.push({ state: view([{ name: 'start', index: p, tone: 'found' }], { [p]: 'found' }), line: 'found', note: `Cycle starts at the node with value ${values[p]}`, vars: { start: values[p] } });
      return { steps, output: `cycle starts at value ${values[p]}` };
    }
  }
  steps.push({ state: view([]), line: 'none', note: 'Return nullptr' });
  return { steps, output: 'no cycle' };
}

// ---------------------------------------------------------------- next greater
function nextGreater(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const ans: (number | null)[] = a.map(() => -1);
  const st: number[] = [];
  const steps: Step[] = [];
  const view = (i: number, tones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [
      arr('a', a, { tones, pointers: i >= 0 && i < a.length ? [{ name: 'i', index: i }] : [] }),
      arr('ans', [...ans]),
    ],
    aux: [{ label: 'stack (indices, top on the right)', items: st.map((x) => `${x}:${a[x]}`) }],
  });
  steps.push({ state: view(-1), line: 'init', note: 'Every answer defaults to −1 ("no greater element")' });
  for (let i = 0; i < a.length; i++) {
    for (;;) {
      const top = st[st.length - 1];
      const pop = st.length > 0 && a[top] < a[i];
      steps.push({
        state: view(i, { [i]: 'active', ...(st.length ? { [top]: 'compare' } : {}) }),
        line: 'check',
        note: st.length ? `a[top] = ${a[top]} < a[${i}] = ${a[i]}? ${pop ? 'yes' : 'no'}` : 'Stack is empty',
        vars: { i, 'a[i]': a[i], top: st.length ? top : 'none' },
      });
      if (!pop) break;
      ans[top] = a[i];
      st.pop();
      steps.push({ state: view(i, { [i]: 'active', [top]: 'found' }), line: 'resolve', note: `a[${i}] is the next greater element for index ${top}`, vars: { i, [`ans[${top}]`]: a[i] } });
    }
    st.push(i);
    steps.push({ state: view(i, { [i]: 'active' }), line: 'push', note: `Push index ${i}; stack values stay decreasing from bottom to top`, vars: { i, stackSize: st.length } });
  }
  steps.push({ state: view(-1), line: 'ret', note: 'Each index is pushed and popped at most once → O(n)' });
  return { steps, output: `next greater: ${ans.join(' ')}` };
}

// ---------------------------------------------------------------- insertion sort
function insertionSort(input: Record<string, unknown>): TraceRun {
  const a = [...(input.a as number[])];
  const steps: Step[] = [];
  const view = (sortedUpTo: number, tones: Record<number, Tone> = {}, key?: number): ArrayState => {
    const t: Record<number, Tone> = {};
    for (let i = 0; i <= sortedUpTo; i++) t[i] = 'done';
    return { kind: 'array', bars: true, rows: [arr('a', [...a], { tones: { ...t, ...tones } })], aux: key !== undefined ? [{ label: 'key', items: [String(key)] }] : [] };
  };
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({ state: view(i - 1, { [i]: 'active' }, key), line: 'key', note: `key = a[${i}] = ${key}; a[0..${i - 1}] is already sorted`, vars: { i, key, j } });
    for (;;) {
      const cond = j >= 0 && a[j] > key;
      steps.push({
        state: view(i - 1, j >= 0 ? { [j]: 'compare' } : {}, key),
        line: 'cmp',
        note: j >= 0 ? `a[${j}] = ${a[j]} > ${key}? ${cond ? 'yes' : 'no'}` : 'j < 0: reached the front',
        vars: { i, key, j },
      });
      if (!cond) break;
      a[j + 1] = a[j];
      steps.push({ state: view(i - 1, { [j + 1]: 'swap' }, key), line: 'shift', note: `Shift ${a[j]} right to index ${j + 1}`, vars: { i, key, j } });
      j--;
    }
    a[j + 1] = key;
    steps.push({ state: view(i, { [j + 1]: 'found' }, key), line: 'insert', note: `Insert ${key} at index ${j + 1}`, vars: { i, key, j } });
  }
  return { steps, output: `sorted: ${a.join(' ')}` };
}

// ---------------------------------------------------------------- subsets
function subsets(input: Record<string, unknown>): TraceRun {
  const nums = input.nums as number[];
  const steps: Step[] = [];
  const nodes: RecursionState['nodes'] = [];
  const stack: string[] = [];
  const results: string[] = [];
  const cur: number[] = [];
  const fmt = (s: number[]) => `[${s.join(',')}]`;
  const snap = (current: number, line: string, note: string, vars: Step['vars'] = {}) =>
    steps.push({
      state: { kind: 'recursion', nodes: nodes.map((n) => ({ ...n })), current, stack: [...stack], partial: fmt(cur), results: [...results], pruned: 0 },
      line,
      note,
      vars: { cur: fmt(cur), depth: stack.length, ...vars },
    });
  const bt = (start: number, parent: number | null) => {
    const id = nodes.length;
    nodes.push({ id, parent, label: fmt(cur), tone: 'active' });
    stack.push(`backtrack(start=${start}, cur=${fmt(cur)})`);
    results.push(fmt(cur));
    snap(id, 'record', `Record ${fmt(cur)} as a subset`, { start });
    for (let i = start; i < nums.length; i++) {
      cur.push(nums[i]);
      snap(id, 'choose', `Choose nums[${i}] = ${nums[i]}`, { start, i });
      snap(id, 'recurse', `Recurse with start = ${i + 1}`, { start, i });
      nodes[id].tone = 'visited';
      bt(i + 1, id);
      nodes[id].tone = 'active';
      cur.pop();
      snap(id, 'undo', `Undo: remove ${nums[i]} and try the next choice`, { start, i });
    }
    nodes[id].tone = 'done';
    stack.pop();
  };
  bt(0, null);
  return { steps, output: [...results, `total ${results.length}`].join('\n') };
}

// ---------------------------------------------------------------- bfs grid
function bfsGrid(input: Record<string, unknown>): TraceRun {
  const g = input.grid as string[];
  const R = g.length;
  const C = g[0].length;
  const walls = g.join('').split('').map((ch) => ch === '#');
  const startId = g.join('').indexOf('S');
  const goalId = g.join('').indexOf('G');
  const dist: (number | null)[] = new Array(R * C).fill(null);
  const visited: number[] = [];
  const q: number[] = [];
  let head = 0;
  const steps: Step[] = [];
  const view = (current?: number): GridState => ({
    kind: 'grid',
    rows: R,
    cols: C,
    walls,
    start: startId,
    goal: goalId,
    visited: [...visited],
    frontier: q.slice(head),
    current,
    dist: [...dist],
  });
  dist[startId] = 0;
  q.push(startId);
  const rc = (id: number) => `(${Math.floor(id / C)},${id % C})`;
  steps.push({ state: view(), line: 'start', note: `Start at ${rc(startId)} with distance 0`, vars: { queue: 1 } });
  const dr = [-1, 0, 1, 0];
  const dc = [0, 1, 0, -1];
  while (head < q.length) {
    const cur = q[head++];
    visited.push(cur);
    const r = Math.floor(cur / C);
    const c = cur % C;
    steps.push({ state: view(cur), line: 'pop', note: `Pop ${rc(cur)} at distance ${dist[cur]}`, vars: { r, c, 'dist[r][c]': dist[cur] as number, queue: q.length - head } });
    if (g[r][c] === 'G') {
      steps.push({ state: view(cur), line: 'goal', note: `Goal reached: shortest path length ${dist[cur]}`, vars: { answer: dist[cur] as number } });
      return { steps, output: `shortest path length = ${dist[cur]}` };
    }
    for (let k = 0; k < 4; k++) {
      const nr = r + dr[k];
      const nc = c + dc[k];
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      const nid = nr * C + nc;
      if (g[nr][nc] === '#' || dist[nid] !== null) {
        steps.push({ state: view(cur), line: 'skip', note: `Skip (${nr},${nc}): ${g[nr][nc] === '#' ? 'wall' : 'already discovered'}`, vars: { nr, nc } });
        continue;
      }
      dist[nid] = (dist[cur] as number) + 1;
      q.push(nid);
      steps.push({ state: view(cur), line: 'push', note: `Discover (${nr},${nc}) at distance ${dist[nid]}`, vars: { nr, nc, dist: dist[nid] as number } });
    }
  }
  steps.push({ state: view(), line: 'none', note: 'Queue empty — goal unreachable' });
  return { steps, output: 'shortest path length = -1' };
}

// ---------------------------------------------------------------- dijkstra
function dijkstraTrace(input: Record<string, unknown>): TraceRun {
  const n = input.n as number;
  const edges = input.edges as [number, number, number][];
  const pos = [
    { x: 10, y: 50 },
    { x: 45, y: 15 },
    { x: 40, y: 85 },
    { x: 75, y: 40 },
    { x: 92, y: 80 },
    { x: 92, y: 15 },
    { x: 60, y: 70 },
    { x: 25, y: 30 },
  ];
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v, w]) => adj[u].push([v, w]));
  const dist: number[] = new Array(n).fill(Infinity);
  const pq: [number, number][] = [];
  const steps: Step[] = [];
  const fmt = (d: number) => (d === Infinity ? '∞' : String(d));
  const view = (tones: Record<number, Tone>, edgeTone?: [number, number, Tone]): GraphState => ({
    kind: 'graph',
    nodes: Array.from({ length: n }, (_, i) => ({ id: i, x: pos[i % pos.length].x, y: pos[i % pos.length].y, label: String(i), tone: tones[i], badge: fmt(dist[i]) })),
    edges: edges.map(([u, v, w]) => ({ u, v, w, directed: true, tone: edgeTone && edgeTone[0] === u && edgeTone[1] === v ? edgeTone[2] : undefined })),
    aux: [{ label: 'min-heap (dist, node)', items: [...pq].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([d, u]) => `(${d}, ${u})`) }],
  });
  const settled = new Set<number>();
  const doneTones = () => Object.fromEntries([...settled].map((u) => [u, 'done' as Tone]));
  dist[0] = 0;
  pq.push([0, 0]);
  steps.push({ state: view({ 0: 'frontier' }), line: 'init', note: 'dist[src] = 0, everything else ∞; push (0, src)', vars: { src: 0 } });
  const popMin = () => {
    let bi = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[bi][0] || (pq[i][0] === pq[bi][0] && pq[i][1] < pq[bi][1])) bi = i;
    return pq.splice(bi, 1)[0];
  };
  while (pq.length) {
    const [d, u] = popMin();
    steps.push({ state: view({ ...doneTones(), [u]: 'active' }), line: 'pop', note: `Pop (${d}, ${u})`, vars: { d, u, [`dist[${u}]`]: fmt(dist[u]) } });
    if (d > dist[u]) {
      steps.push({ state: view({ ...doneTones(), [u]: 'muted' }), line: 'stale', note: `Stale entry: ${d} > dist[${u}] = ${dist[u]}, skip`, vars: { d, u } });
      continue;
    }
    settled.add(u);
    for (const [v, w] of adj[u]) {
      const better = dist[u] + w < dist[v];
      steps.push({
        state: view({ ...doneTones(), [u]: 'active', [v]: 'compare' }, [u, v, 'compare']),
        line: 'relax',
        note: `Edge ${u}→${v} (w=${w}): ${dist[u]} + ${w} = ${dist[u] + w} < ${fmt(dist[v])}? ${better ? 'yes' : 'no'}`,
        vars: { u, v, w, 'dist[u]': dist[u], 'dist[v]': fmt(dist[v]) },
      });
      if (better) {
        dist[v] = dist[u] + w;
        pq.push([dist[v], v]);
        steps.push({ state: view({ ...doneTones(), [u]: 'active', [v]: 'found' }, [u, v, 'path']), line: 'update', note: `dist[${v}] = ${dist[v]}; push (${dist[v]}, ${v})`, vars: { v, 'dist[v]': dist[v] } });
      }
    }
  }
  return { steps, output: `dist: ${dist.map((d) => (d === Infinity ? 'INF' : d)).join(' ')}` };
}

// ---------------------------------------------------------------- topo sort
function topoKahn(input: Record<string, unknown>): TraceRun {
  const n = input.n as number;
  const edges = input.edges as [number, number][];
  const pos = Array.from({ length: n }, (_, i) => ({ x: 12 + (i % 3) * 38, y: 25 + Math.floor(i / 3) * 50 }));
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  const steps: Step[] = [];
  const order: number[] = [];
  const q: number[] = [];
  let head = 0;
  const view = (tones: Record<number, Tone> = {}): GraphState => ({
    kind: 'graph',
    nodes: pos.map((p, i) => ({ id: i, ...p, label: String(i), badge: `in ${indeg[i]}`, tone: tones[i] ?? (order.includes(i) ? 'done' : undefined) })),
    edges: edges.map(([u, v]) => ({ u, v, directed: true, tone: order.includes(u) ? 'muted' : undefined })),
    aux: [
      { label: 'queue', items: q.slice(head).map(String) },
      { label: 'order', items: order.map(String) },
    ],
  });
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v]++;
  }
  steps.push({ state: view(), line: 'indeg', note: 'Count incoming edges (unmet prerequisites) for each node', vars: { edges: edges.length } });
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  steps.push({ state: view(Object.fromEntries(q.map((x) => [x, 'frontier']))), line: 'seed', note: `Nodes with in-degree 0: ${q.join(', ')}`, vars: { queue: q.length } });
  while (head < q.length) {
    const u = q[head++];
    order.push(u);
    steps.push({ state: view({ [u]: 'active' }), line: 'pop', note: `Pop ${u} and append it to the order`, vars: { u } });
    for (const v of adj[u]) {
      indeg[v]--;
      if (indeg[v] === 0) q.push(v);
      steps.push({ state: view({ [u]: 'active', [v]: indeg[v] === 0 ? 'frontier' : 'compare' }), line: 'relax', note: `indeg[${v}] → ${indeg[v]}${indeg[v] === 0 ? ` — ${v} is ready` : ''}`, vars: { u, v, [`indeg[${v}]`]: indeg[v] } });
    }
  }
  const ok = order.length === n;
  steps.push({ state: view(), line: 'cycle', note: ok ? 'All nodes output — no cycle' : 'Some nodes never became ready: cycle', vars: { output: order.length, n } });
  return { steps, output: ok ? `order: ${order.join(' ')}` : 'cycle detected' };
}

// ---------------------------------------------------------------- union-find
function unionFind(input: Record<string, unknown>): TraceRun {
  const n = input.n as number;
  const ops = input.ops as [number, number][];
  const parent = Array.from({ length: n }, (_, i) => i);
  const sz = new Array(n).fill(1);
  const steps: Step[] = [];
  const view = (tones: Record<number, Tone> = {}): ArrayState => {
    const groups = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      let r = i;
      while (parent[r] !== r) r = parent[r];
      groups.set(r, [...(groups.get(r) ?? []), i]);
    }
    return {
      kind: 'array',
      rows: [arr('parent', [...parent], { tones }), arr('size', [...sz])],
      aux: [{ label: 'sets', items: [...groups.values()].map((g) => `{${g.join(',')}}`) }],
    };
  };
  const find = (x: number): number => {
    if (parent[x] !== x) {
      const r = find(parent[x]);
      if (parent[x] !== r) {
        parent[x] = r;
        steps.push({ state: view({ [x]: 'swap' }), line: 'find', note: `Path compression: parent[${x}] = ${r}`, vars: { x, root: r } });
      }
    }
    return parent[x];
  };
  const lines: string[] = [];
  let components = n;
  for (const [a0, b0] of ops) {
    let a = find(a0);
    let b = find(b0);
    steps.push({ state: view({ [a]: 'active', [b]: 'active' }), line: 'roots', note: `unite(${a0}, ${b0}): roots are ${a} and ${b}`, vars: { a, b } });
    if (a === b) {
      steps.push({ state: view({ [a]: 'warn' }), line: 'same', note: 'Same root — already connected, nothing to do', vars: { a, b } });
      lines.push(`unite(${a0},${b0}) already connected`);
      continue;
    }
    if (sz[a] < sz[b]) [a, b] = [b, a];
    steps.push({ state: view({ [a]: 'active', [b]: 'compare' }), line: 'size', note: `Larger tree root = ${a} (size ${sz[a]}), smaller = ${b} (size ${sz[b]})`, vars: { a, b, 'sz[a]': sz[a], 'sz[b]': sz[b] } });
    parent[b] = a;
    sz[a] += sz[b];
    components--;
    steps.push({ state: view({ [b]: 'found' }), line: 'link', note: `parent[${b}] = ${a}; size[${a}] = ${sz[a]}`, vars: { a, b, components } });
    lines.push(`unite(${a0},${b0}) merged`);
  }
  lines.push(`components = ${components}`);
  return { steps, output: lines.join('\n') };
}

// ---------------------------------------------------------------- DP 1D
function dpRow(label: string, values: (number | null)[], tones: Record<number, Tone>) {
  return arr(label, values, { tones });
}

function climbStairs(input: Record<string, unknown>): TraceRun {
  const n = input.n as number;
  const dp: (number | null)[] = new Array(n + 1).fill(null);
  const steps: Step[] = [];
  const view = (tones: Record<number, Tone>): ArrayState => ({ kind: 'array', rows: [dpRow('dp', [...dp], tones)] });
  dp[0] = 1;
  if (n >= 1) dp[1] = 1;
  steps.push({ state: view({ 0: 'done', 1: 'done' }), line: 'base', note: 'Base cases: dp[0] = 1 (stand still), dp[1] = 1', vars: { n } });
  for (let i = 2; i <= n; i++) {
    dp[i] = (dp[i - 1] as number) + (dp[i - 2] as number);
    steps.push({
      state: view({ [i - 1]: 'compare', [i - 2]: 'compare', [i]: 'found' }),
      line: 'trans',
      note: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]} (last move was 1 or 2 steps)`,
      vars: { i, 'dp[i-1]': dp[i - 1] as number, 'dp[i-2]': dp[i - 2] as number, 'dp[i]': dp[i] as number },
    });
  }
  steps.push({ state: view({ [n]: 'found' }), line: 'ret', note: `Answer dp[${n}] = ${dp[n]}`, vars: { answer: dp[n] as number } });
  return { steps, output: `ways(${n}) = ${dp[n]}` };
}

function houseRobber(input: Record<string, unknown>): TraceRun {
  const a = input.a as number[];
  const n = a.length;
  const steps: Step[] = [];
  if (n === 0) return { steps, output: 'max loot = 0' };
  const dp: (number | null)[] = new Array(n).fill(null);
  const view = (tones: Record<number, Tone>, hTones: Record<number, Tone> = {}): ArrayState => ({
    kind: 'array',
    rows: [arr('houses', a, { tones: hTones }), dpRow('dp', [...dp], tones)],
  });
  dp[0] = a[0];
  steps.push({ state: view({ 0: 'done' }, { 0: 'active' }), line: 'base', note: `dp[0] = ${a[0]}: with one house, rob it`, vars: { 'dp[0]': a[0] } });
  for (let i = 1; i < n; i++) {
    const skip = dp[i - 1] as number;
    steps.push({ state: view({ [i - 1]: 'compare' }, { [i]: 'active' }), line: 'skip', note: `Skip house ${i}: keep dp[${i - 1}] = ${skip}`, vars: { i, skip } });
    const take = a[i] + (i >= 2 ? (dp[i - 2] as number) : 0);
    steps.push({ state: view(i >= 2 ? { [i - 2]: 'compare' } : {}, { [i]: 'active' }), line: 'take', note: `Rob house ${i}: ${a[i]} + ${i >= 2 ? `dp[${i - 2}] = ${dp[i - 2]}` : '0'} = ${take}`, vars: { i, skip, take } });
    dp[i] = Math.max(skip, take);
    steps.push({ state: view({ [i]: 'found' }), line: 'best', note: `dp[${i}] = max(${skip}, ${take}) = ${dp[i]}`, vars: { i, 'dp[i]': dp[i] as number } });
  }
  steps.push({ state: view({ [n - 1]: 'found' }), line: 'ret', note: `Answer dp[${n - 1}] = ${dp[n - 1]}`, vars: { answer: dp[n - 1] as number } });
  return { steps, output: `max loot = ${dp[n - 1]}` };
}

// ---------------------------------------------------------------- knapsack
function knapsack(input: Record<string, unknown>): TraceRun {
  const wt = input.wt as number[];
  const val = input.val as number[];
  const W = input.W as number;
  const n = wt.length;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => new Array(W + 1).fill(i === 0 ? 0 : null));
  const steps: Step[] = [];
  const rowLabels = ['0 items', ...wt.map((w, i) => `item ${i + 1} (w${w}, v${val[i]})`)];
  const colLabels = Array.from({ length: W + 1 }, (_, w) => `w=${w}`);
  const view = (active?: [number, number], deps: [number, number][] = [], path?: [number, number][]): TableState => ({
    kind: 'table',
    title: 'dp[i][w]',
    rowLabels,
    colLabels,
    cells: dp.map((r) => [...r]),
    active,
    deps,
    path,
  });
  steps.push({ state: view(), line: 'init', note: 'Row 0 is all zeros: with no items the best value is 0', vars: { n, W } });
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      steps.push({ state: view([i, w], [[i - 1, w]]), line: 'skip', note: `Skip item ${i}: dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`, vars: { i, w, 'dp[i][w]': dp[i][w] as number } });
      if (wt[i - 1] <= w) {
        const takeV = (dp[i - 1][w - wt[i - 1]] as number) + val[i - 1];
        const old = dp[i][w] as number;
        dp[i][w] = Math.max(old, takeV);
        steps.push({
          state: view([i, w], [[i - 1, w], [i - 1, w - wt[i - 1]]]),
          line: 'take',
          note: `Take item ${i}: dp[${i - 1}][${w - wt[i - 1]}] + ${val[i - 1]} = ${takeV}; max(${old}, ${takeV}) = ${dp[i][w]}`,
          vars: { i, w, take: takeV, 'dp[i][w]': dp[i][w] as number },
        });
      }
    }
  }
  // Reconstruct chosen items for display.
  const path: [number, number][] = [];
  let w = W;
  for (let i = n; i >= 1; i--) {
    path.push([i, w]);
    if (dp[i][w] !== dp[i - 1][w]) w -= wt[i - 1];
  }
  steps.push({ state: view([n, W], [], path), line: 'ret', note: `Answer dp[${n}][${W}] = ${dp[n][W]}. Highlighted cells trace back the chosen items.`, vars: { answer: dp[n][W] as number } });
  return { steps, output: `best value = ${dp[n][W]}` };
}

// ---------------------------------------------------------------- heap top-k
function heapTopK(input: Record<string, unknown>): TraceRun {
  const nums = input.nums as number[];
  const k = input.k as number;
  const heap: number[] = [];
  const steps: Step[] = [];
  const siftUp = (i: number) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const popMin = () => {
    const top = heap[0];
    const last = heap.pop()!;
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
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  const out: number[] = [];
  const view = (x?: number, tones: Record<number, Tone> = {}): TreeState => ({
    kind: 'tree',
    root: heap.length ? 0 : null,
    nodes: heap.map((v, i) => ({ id: i, label: String(v), left: 2 * i + 1 < heap.length ? 2 * i + 1 : undefined, right: 2 * i + 2 < heap.length ? 2 * i + 2 : undefined, tone: tones[i] ?? (i === 0 ? 'active' : undefined) })),
    aux: [
      { label: 'input', items: nums.map(String) },
      { label: 'heap array', items: heap.map(String) },
      ...(x !== undefined ? [{ label: 'current x', items: [String(x)] }] : []),
      ...(out.length ? [{ label: 'out', items: out.map(String) }] : []),
    ],
  });
  steps.push({ state: view(), line: 'init', note: `Min-heap capped at k = ${k}: its top is the smallest of the best k so far`, vars: { k } });
  for (const x of nums) {
    heap.push(x);
    siftUp(heap.length - 1);
    steps.push({ state: view(x), line: 'push', note: `Push ${x} (heap size ${heap.length})`, vars: { x, size: heap.length, top: heap[0] } });
    if (heap.length > k) {
      const removed = popMin();
      steps.push({ state: view(x), line: 'pop', note: `Size > k: pop the minimum ${removed} — it cannot be in the top ${k}`, vars: { x, removed, top: heap[0] } });
    }
  }
  while (heap.length) {
    out.push(heap[0]);
    popMin();
    steps.push({ state: view(), line: 'drain', note: `Move top ${out[out.length - 1]} to the output`, vars: { size: heap.length } });
  }
  return { steps, output: `top ${k}: ${out.join(' ')}` };
}

// ---------------------------------------------------------------- level order
function levelOrder(input: Record<string, unknown>): TraceRun {
  const level = input.tree as (number | null)[];
  // Build node list from LeetCode-style level order with nulls.
  const nodes: TreeState['nodes'] = [];
  const idOf: (number | undefined)[] = [];
  level.forEach((v, i) => {
    if (v !== null) {
      idOf[i] = nodes.length;
      nodes.push({ id: nodes.length, label: String(v) });
    }
  });
  {
    let child = 1;
    for (let i = 0; i < level.length && child < level.length; i++) {
      if (level[i] === null) continue;
      const me = nodes[idOf[i]!];
      if (child < level.length && level[child] !== null) me.left = idOf[child];
      child++;
      if (child < level.length && level[child] !== null) me.right = idOf[child];
      child++;
    }
  }
  const steps: Step[] = [];
  const tones: Record<number, Tone> = {};
  const q: number[] = [];
  let head = 0;
  const levels: number[][] = [];
  const view = (): TreeState => ({
    kind: 'tree',
    root: nodes.length ? 0 : null,
    nodes: nodes.map((n) => ({ ...n, tone: tones[n.id] })),
    aux: [
      { label: 'queue', items: q.slice(head).map((id) => nodes[id].label) },
      { label: 'levels', items: levels.map((l) => l.join(' ')) },
    ],
  });
  if (!nodes.length) return { steps, output: '' };
  q.push(0);
  tones[0] = 'frontier';
  steps.push({ state: view(), line: 'init', note: 'Push the root' });
  while (head < q.length) {
    const size = q.length - head;
    steps.push({ state: view(), line: 'size', note: `This level has ${size} node(s) — freeze the count before adding children`, vars: { size, depth: levels.length } });
    const cur: number[] = [];
    for (let i = 0; i < size; i++) {
      const id = q[head++];
      tones[id] = 'active';
      cur.push(Number(nodes[id].label));
      steps.push({ state: view(), line: 'pop', note: `Pop ${nodes[id].label}`, vars: { i, size } });
      const { left, right } = nodes[id];
      if (left !== undefined) {
        q.push(left);
        tones[left] = 'frontier';
      }
      if (right !== undefined) {
        q.push(right);
        tones[right] = 'frontier';
      }
      steps.push({ state: view(), line: 'kids', note: 'Enqueue its children for the next level', vars: { i, queued: q.length - head } });
      tones[id] = 'done';
    }
    levels.push(cur);
    steps.push({ state: view(), line: 'level', note: `Level ${levels.length - 1}: ${cur.join(' ')}`, vars: { depth: levels.length - 1 } });
  }
  return { steps, output: levels.map((l, d) => `level ${d}: ${l.join(' ')}`).join('\n') };
}

// ---------------------------------------------------------------- merge intervals
function mergeIntervals(input: Record<string, unknown>): TraceRun {
  const raw = input.intervals as [number, number][];
  const v = [...raw].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const maxTime = Math.max(...v.map((x) => x[1]), 1) + 1;
  const out: [number, number][] = [];
  const steps: Step[] = [];
  const view = (cur: number): TimelineState => ({
    kind: 'timeline',
    maxTime,
    lanes: ['input (sorted)', 'merged'],
    items: [
      ...v.map(([s, e], i) => ({ id: `in${i}`, start: s, end: e, lane: 0, tone: (i === cur ? 'active' : i < cur ? 'done' : 'muted') as Tone, label: `[${s},${e}]` })),
      ...out.map(([s, e], i) => ({ id: `out${i}`, start: s, end: e, lane: 1, tone: (i === out.length - 1 ? 'found' : 'path') as Tone, label: `[${s},${e}]` })),
    ],
  });
  steps.push({ state: view(-1), line: 'sort', note: 'Sort by start: overlapping intervals become neighbours' });
  v.forEach(([s, e], i) => {
    const overlap = out.length > 0 && s <= out[out.length - 1][1];
    steps.push({ state: view(i), line: 'overlap', note: out.length ? `[${s},${e}] starts at ${s} ≤ last end ${out[out.length - 1][1]}? ${overlap ? 'yes' : 'no'}` : 'Output is empty', vars: { s, e, lastEnd: out.length ? out[out.length - 1][1] : 'none' } });
    if (overlap) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
      steps.push({ state: view(i), line: 'extend', note: `Extend the last interval to end at ${out[out.length - 1][1]}`, vars: { s, e } });
    } else {
      out.push([s, e]);
      steps.push({ state: view(i), line: 'new', note: `Start a new merged interval [${s},${e}]`, vars: { s, e } });
    }
  });
  return { steps, output: out.map(([s, e]) => `[${s},${e}]`).join(' ') };
}

// ---------------------------------------------------------------- registry
const intArr = (key: string, label: string): InputField => ({ key, label, type: 'int-array' });
const int = (key: string, label: string): InputField => ({ key, label, type: 'int' });

const nonEmpty = (key: string, max = 16) => (i: Record<string, unknown>) => {
  const a = i[key] as unknown[];
  if (!Array.isArray(a) || a.length === 0) return `${key} must contain at least one value`;
  if (a.length > max) return `Keep ${key} to at most ${max} values so the trace stays readable`;
  return null;
};

const sortedCheck = (key: string) => (i: Record<string, unknown>) => {
  const e = nonEmpty(key)(i);
  if (e) return e;
  const a = i[key] as number[];
  for (let k = 1; k < a.length; k++) if (a[k] < a[k - 1]) return `${key} must be sorted for this algorithm`;
  return null;
};

export const TRACES: Record<TraceId, TraceDef> = {
  'running-sum': { id: 'running-sum', title: 'One-pass sum and maximum', viz: 'prefix-sum', code: TRACE_CODE['running-sum'], defaultInput: { a: [4, -2, 7, 7, 1] }, fields: [intArr('a', 'a')], validate: nonEmpty('a'), run: runningSum },
  'prefix-sum': { id: 'prefix-sum', title: 'Prefix sums + range queries', viz: 'prefix-sum', code: TRACE_CODE['prefix-sum'], defaultInput: { a: [3, 1, 4, 1, 5, 9, 2], queries: [[1, 3], [0, 6], [4, 4]] }, fields: [intArr('a', 'a')], validate: nonEmpty('a'), run: (i) => prefixSum({ ...i, queries: (i.queries as [number, number][]).filter(([l, r]) => r < (i.a as number[]).length && l <= r) }) },
  'two-sum-hash': { id: 'two-sum-hash', title: 'Two Sum with a hash map', viz: 'prefix-sum', code: TRACE_CODE['two-sum-hash'], defaultInput: { nums: [3, 8, 4, 9, 1, 6], target: 10 }, fields: [intArr('nums', 'nums'), int('target', 'target')], validate: nonEmpty('nums'), run: twoSumHash },
  'pair-sum-sorted': { id: 'pair-sum-sorted', title: 'Pair sum with two pointers', viz: 'two-pointers', code: TRACE_CODE['pair-sum-sorted'], defaultInput: { a: [1, 3, 4, 6, 8, 11], target: 10 }, fields: [intArr('a', 'a (sorted)'), int('target', 'target')], validate: sortedCheck('a'), run: pairSum },
  'window-fixed': { id: 'window-fixed', title: 'Fixed-size sliding window', viz: 'sliding-window', code: TRACE_CODE['window-fixed'], defaultInput: { a: [2, 1, 5, 1, 3, 2], k: 3 }, fields: [intArr('a', 'a'), int('k', 'k')], validate: (i) => nonEmpty('a')(i) ?? ((i.k as number) < 1 ? 'k must be at least 1' : null), run: windowFixed },
  'window-variable': { id: 'window-variable', title: 'Longest substring without repeats', viz: 'sliding-window', code: TRACE_CODE['window-variable'], defaultInput: { s: 'abcbdca' }, fields: [{ key: 's', label: 's', type: 'string' }], validate: (i) => ((i.s as string).length === 0 ? 's must not be empty' : (i.s as string).length > 20 ? 'Keep s to 20 characters' : null), run: windowVariable },
  'binary-search': { id: 'binary-search', title: 'Exact binary search', viz: 'binary-search', code: TRACE_CODE['binary-search'], defaultInput: { a: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 }, fields: [intArr('a', 'a (sorted)'), int('target', 'target')], validate: sortedCheck('a'), run: binarySearch },
  'lower-bound': { id: 'lower-bound', title: 'Lower bound (first ≥ target)', viz: 'binary-search', code: TRACE_CODE['lower-bound'], defaultInput: { a: [1, 2, 2, 2, 5, 7], target: 2 }, fields: [intArr('a', 'a (sorted)'), int('target', 'target')], validate: sortedCheck('a'), run: lowerBound },
  'fast-slow-cycle': { id: 'fast-slow-cycle', title: "Floyd's cycle detection", viz: 'fast-slow', code: TRACE_CODE['fast-slow-cycle'], defaultInput: { values: [1, 2, 3, 4, 5, 6], next: [1, 2, 3, 4, 5, 2] }, fields: [], run: fastSlow },
  'next-greater': { id: 'next-greater', title: 'Next greater element (monotonic stack)', viz: 'stack-queue', code: TRACE_CODE['next-greater'], defaultInput: { a: [2, 1, 2, 4, 3] }, fields: [intArr('a', 'a')], validate: nonEmpty('a'), run: nextGreater },
  'insertion-sort': { id: 'insertion-sort', title: 'Insertion sort', viz: 'sorting', code: TRACE_CODE['insertion-sort'], defaultInput: { a: [5, 2, 4, 6, 1, 3] }, fields: [intArr('a', 'a')], validate: nonEmpty('a', 12), run: insertionSort },
  subsets: { id: 'subsets', title: 'Subsets by backtracking', viz: 'recursion', code: TRACE_CODE.subsets, defaultInput: { nums: [1, 2, 3] }, fields: [intArr('nums', 'nums')], validate: nonEmpty('nums', 4), run: subsets },
  'bfs-grid': { id: 'bfs-grid', title: 'BFS shortest path on a grid', viz: 'grid-paths', code: TRACE_CODE['bfs-grid'], defaultInput: { grid: ['S..#', '.#..', '...#', '#.G.'] }, fields: [], run: bfsGrid },
  dijkstra: { id: 'dijkstra', title: 'Dijkstra with a min-heap', viz: 'graph-algos', code: TRACE_CODE.dijkstra, defaultInput: { n: 5, edges: [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]] }, fields: [], run: dijkstraTrace },
  'topo-kahn': { id: 'topo-kahn', title: "Kahn's topological sort", viz: 'graph-algos', code: TRACE_CODE['topo-kahn'], defaultInput: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [5, 4]] }, fields: [], run: topoKahn },
  'union-find': { id: 'union-find', title: 'Union-Find with path compression', viz: 'graph-algos', code: TRACE_CODE['union-find'], defaultInput: { n: 6, ops: [[0, 1], [2, 3], [1, 3], [4, 5], [0, 3]] }, fields: [], run: unionFind },
  'climb-stairs': { id: 'climb-stairs', title: 'Climbing stairs (tabulation)', viz: 'dp', code: TRACE_CODE['climb-stairs'], defaultInput: { n: 6 }, fields: [int('n', 'n')], validate: (i) => ((i.n as number) < 0 || (i.n as number) > 40 ? 'Choose n between 0 and 40' : null), run: climbStairs },
  'house-robber': { id: 'house-robber', title: 'House robber', viz: 'dp', code: TRACE_CODE['house-robber'], defaultInput: { a: [2, 7, 9, 3, 1] }, fields: [intArr('a', 'houses')], validate: nonEmpty('a', 12), run: houseRobber },
  knapsack: { id: 'knapsack', title: '0/1 knapsack table', viz: 'dp', code: TRACE_CODE.knapsack, defaultInput: { wt: [1, 3, 4, 5], val: [1, 4, 5, 7], W: 7 }, fields: [], run: knapsack },
  'heap-topk': { id: 'heap-topk', title: 'Top-K with a min-heap', viz: 'heap', code: TRACE_CODE['heap-topk'], defaultInput: { nums: [5, 1, 9, 3, 7, 6, 8], k: 3 }, fields: [intArr('nums', 'nums'), int('k', 'k')], validate: (i) => nonEmpty('nums', 14)(i) ?? ((i.k as number) < 1 || (i.k as number) > (i.nums as number[]).length ? 'k must be between 1 and the number of values' : null), run: heapTopK },
  'level-order': { id: 'level-order', title: 'Level-order traversal (BFS)', viz: 'tree', code: TRACE_CODE['level-order'], defaultInput: { tree: [3, 9, 20, null, null, 15, 7] }, fields: [], run: levelOrder },
  'merge-intervals': { id: 'merge-intervals', title: 'Merge overlapping intervals', viz: 'greedy', code: TRACE_CODE['merge-intervals'], defaultInput: { intervals: [[1, 3], [8, 10], [2, 6], [15, 18], [17, 20]] }, fields: [], run: mergeIntervals },
};

export const TRACE_LIST = Object.values(TRACES);
