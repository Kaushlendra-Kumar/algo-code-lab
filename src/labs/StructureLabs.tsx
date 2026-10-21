import { useMemo, useState } from 'react';
import { Glass, Tabs } from '../components/ui';
import { LabHeader, StepView, parseInts } from './common';
import { heapOps, queueOps, slidingWindowMax, stackOps, traverseTree, type TreeTraversal } from '../lib/algorithms/labs';
import { TraceViewer } from '../components/TraceViewer';

function parseOps(raw: string, popWord: string): (number | string)[] | string {
  const toks = raw.split(/[\s,]+/).filter(Boolean);
  if (!toks.length) return 'Enter some operations.';
  if (toks.length > 30) return 'Use at most 30 operations.';
  const out: (number | string)[] = [];
  for (const t of toks) {
    if (t.toLowerCase() === popWord || t === '-') out.push(popWord);
    else if (/^-?\d+$/.test(t) && Math.abs(Number(t)) < 1000) out.push(Number(t));
    else return `“${t}” is not a number or “${popWord}”.`;
  }
  return out;
}

export function StackQueueLab() {
  const [mode, setMode] = useState<'stack' | 'queue' | 'mono' | 'deque'>('stack');
  const [stackRaw, setStackRaw] = useState('5 8 pop 3 9 pop pop 7');
  const [queueRaw, setQueueRaw] = useState('5 8 dequeue 3 9 dequeue dequeue 7');
  const [dequeRaw, setDequeRaw] = useState('1 3 -1 -3 5 3 6 7');
  const [k, setK] = useState(3);
  const [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState({ stack: stackRaw, queue: queueRaw, deque: dequeRaw, k });
  const steps = useMemo(() => {
    if (mode === 'stack') {
      const ops = parseOps(applied.stack, 'pop');
      return typeof ops === 'string' ? [] : stackOps(ops as (number | 'pop')[]).steps;
    }
    if (mode === 'queue') {
      const ops = parseOps(applied.queue, 'dequeue');
      return typeof ops === 'string' ? [] : queueOps(ops as (number | 'dequeue')[]).steps;
    }
    if (mode === 'deque') {
      const a = parseInts(applied.deque, 16);
      return typeof a === 'string' || applied.k < 1 || applied.k > a.length ? [] : slidingWindowMax(a, applied.k).steps;
    }
    return [];
  }, [mode, applied]);

  const apply = () => {
    const check = mode === 'stack' ? parseOps(stackRaw, 'pop') : mode === 'queue' ? parseOps(queueRaw, 'dequeue') : parseInts(dequeRaw, 16);
    if (typeof check === 'string') return setErr(check);
    if (mode === 'deque' && (k < 1 || k > (check as number[]).length)) return setErr('k must be between 1 and the array length.');
    setErr(null);
    setApplied({ stack: stackRaw, queue: queueRaw, deque: dequeRaw, k });
  };

  return (
    <div className="stack lg">
      <LabHeader title="Stacks, Queues & Deques" icon="☷">
        LIFO vs FIFO, then the two most useful “monotonic” tricks: a stack for next-greater elements and a deque for sliding-window maxima. Both are O(n) because every index is pushed and popped at most once.
      </LabHeader>
      <Glass className="pad stack">
        <Tabs value={mode} onChange={setMode} label="Structure" items={[{ id: 'stack', label: 'Stack' }, { id: 'queue', label: 'Queue' }, { id: 'mono', label: 'Monotonic stack (C++)' }, { id: 'deque', label: 'Monotonic deque' }]} />
        {mode !== 'mono' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); apply(); }}>
            {mode === 'stack' && <input className="input grow" value={stackRaw} onChange={(e) => setStackRaw(e.target.value)} aria-label="Stack operations" />}
            {mode === 'queue' && <input className="input grow" value={queueRaw} onChange={(e) => setQueueRaw(e.target.value)} aria-label="Queue operations" />}
            {mode === 'deque' && (
              <>
                <input className="input grow" value={dequeRaw} onChange={(e) => setDequeRaw(e.target.value)} aria-label="Array" />
                <label className="row small muted nowrap">
                  k <input className="input" type="number" style={{ width: 70 }} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Window size" />
                </label>
              </>
            )}
            <button className="btn sm" type="submit">Run</button>
          </form>
        )}
        {mode === 'stack' && <span className="tiny muted">Numbers push; the word “pop” pops.</span>}
        {mode === 'queue' && <span className="tiny muted">Numbers enqueue; the word “dequeue” removes from the front.</span>}
        {err && <div className="feedback bad small">{err}</div>}
      </Glass>
      <Glass className="pad-lg">{mode === 'mono' ? <TraceViewer id="next-greater" editable /> : <StepView steps={steps} title={mode} />}</Glass>
    </div>
  );
}

export function HeapLab() {
  const [mode, setMode] = useState<'ops' | 'topk'>('ops');
  const [raw, setRaw] = useState('7 3 9 1 pop 4 2 pop 8');
  const [applied, setApplied] = useState(raw);
  const [err, setErr] = useState<string | null>(null);
  const steps = useMemo(() => {
    const ops = parseOps(applied, 'pop');
    return typeof ops === 'string' ? [] : heapOps(ops as (number | 'pop')[]).steps;
  }, [applied]);
  return (
    <div className="stack lg">
      <LabHeader title="Heap Lab" icon="△">
        A binary min-heap stored in an array: the children of index i are 2i+1 and 2i+2. Push sifts up, pop moves the last element to the root and sifts down — both O(log n).
      </LabHeader>
      <Glass className="pad stack">
        <Tabs value={mode} onChange={setMode} label="Mode" items={[{ id: 'ops', label: 'Push / pop' }, { id: 'topk', label: 'Top-K (synced C++)' }]} />
        {mode === 'ops' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); const r = parseOps(raw, 'pop'); if (typeof r === 'string') setErr(r); else { setErr(null); setApplied(raw); } }}>
            <input className="input grow" value={raw} onChange={(e) => setRaw(e.target.value)} aria-label="Heap operations" />
            <button className="btn sm" type="submit">Run</button>
          </form>
        )}
        {err && <div className="feedback bad small">{err}</div>}
        {mode === 'topk' && <div className="feedback info small">The tree shows a textbook binary-heap layout of the same operations; std::priority_queue may arrange equal-priority items differently internally, but its top element is always the same.</div>}
      </Glass>
      <Glass className="pad-lg">{mode === 'ops' ? <StepView steps={steps} title="Heap" /> : <TraceViewer id="heap-topk" editable />}</Glass>
    </div>
  );
}

export function TreeLab() {
  const [mode, setMode] = useState<TreeTraversal | 'trace'>('insert');
  const [raw, setRaw] = useState('50 30 70 20 40 60 80 35');
  const [values, setValues] = useState([50, 30, 70, 20, 40, 60, 80, 35]);
  const [err, setErr] = useState<string | null>(null);
  const run = useMemo(() => (mode === 'trace' ? null : traverseTree(values, mode)), [values, mode]);
  return (
    <div className="stack lg">
      <LabHeader title="Tree Lab" icon="⟁">
        Build a binary search tree, then compare traversal orders. In-order traversal of a BST visits values in sorted order — a handy correctness check.
      </LabHeader>
      <Glass className="pad stack">
        <Tabs
          value={mode}
          onChange={setMode}
          label="Traversal"
          items={[
            { id: 'insert', label: 'BST insert' },
            { id: 'preorder', label: 'Pre-order' },
            { id: 'inorder', label: 'In-order' },
            { id: 'postorder', label: 'Post-order' },
            { id: 'level', label: 'Level order' },
            { id: 'trace', label: 'Level order (C++)' },
          ]}
        />
        {mode !== 'trace' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); const r = parseInts(raw, 15); if (typeof r === 'string') setErr(r); else { setErr(null); setValues(r); } }}>
            <input className="input grow" value={raw} onChange={(e) => setRaw(e.target.value)} aria-label="Values to insert" />
            <button className="btn sm" type="submit">Build</button>
          </form>
        )}
        {err && <div className="feedback bad small">{err}</div>}
        <span className="tiny muted">Duplicates are ignored. Inserting sorted values produces a degenerate (linked-list shaped) tree with height n — try “1 2 3 4 5”.</span>
      </Glass>
      <Glass className="pad-lg">{run ? <StepView steps={run.steps} title="Tree" /> : <TraceViewer id="level-order" />}</Glass>
    </div>
  );
}
