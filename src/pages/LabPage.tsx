import { Link, useParams } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import type { VizId } from '../types/content';
import { useProgress } from '../lib/progress/context';
import { Empty, Glass } from '../components/ui';
import { LAB_META } from './labMeta';
import { TraceLab } from '../labs/TraceLab';

const SortingLab = lazy(() => import('../labs/SortingLab'));
const MazeLab = lazy(() => import('../labs/MazeLab'));
const GraphLab = lazy(() => import('../labs/GraphLab'));
const ComplexityLab = lazy(() => import('../labs/ComplexityLab'));
const StackQueueLab = lazy(() => import('../labs/StructureLabs').then((m) => ({ default: m.StackQueueLab })));
const HeapLab = lazy(() => import('../labs/StructureLabs').then((m) => ({ default: m.HeapLab })));
const TreeLab = lazy(() => import('../labs/StructureLabs').then((m) => ({ default: m.TreeLab })));
const RecursionLab = lazy(() => import('../labs/SearchDpLabs').then((m) => ({ default: m.RecursionLab })));
const DpLab = lazy(() => import('../labs/SearchDpLabs').then((m) => ({ default: m.DpLab })));
const GreedyLab = lazy(() => import('../labs/SearchDpLabs').then((m) => ({ default: m.GreedyLab })));

function Lab({ id }: { id: VizId }) {
  switch (id) {
    case 'sorting':
      return <SortingLab />;
    case 'grid-paths':
      return <MazeLab />;
    case 'graph-algos':
      return <GraphLab />;
    case 'complexity':
      return <ComplexityLab />;
    case 'stack-queue':
      return <StackQueueLab />;
    case 'heap':
      return <HeapLab />;
    case 'tree':
      return <TreeLab />;
    case 'recursion':
      return <RecursionLab />;
    case 'dp':
      return <DpLab />;
    case 'greedy':
      return <GreedyLab />;
    case 'two-pointers':
      return (
        <TraceLab
          title="Two Pointers"
          icon="⇆"
          intro="In a sorted array, the sum a[left] + a[right] tells you which pointer to move: too small → only a larger left value can help; too large → only a smaller right value can help. Each move discards a whole row of impossible pairs."
          traces={[{ id: 'pair-sum-sorted', label: 'Pair sum (sorted)' }]}
          notes={{ 'pair-sum-sorted': 'Invariant: if a valid pair exists, both of its indices lie in [left, right]. Try a target with no solution, e.g. 2.' }}
        />
      );
    case 'sliding-window':
      return (
        <TraceLab
          title="Sliding Window"
          icon="▭"
          intro="A window is a contiguous range [left, right]. Fixed windows slide by one; variable windows grow on the right and shrink on the left while a constraint is violated. Each index enters and leaves once, so the whole scan is O(n)."
          traces={[
            { id: 'window-fixed', label: 'Fixed size k' },
            { id: 'window-variable', label: 'Variable (no repeats)' },
          ]}
          notes={{
            'window-fixed': 'Valid because a window sum can be updated in O(1): add the entering element, subtract the leaving one.',
            'window-variable': 'Valid because the constraint is monotone: if a window has no repeated characters, every smaller window inside it also has none.',
          }}
        />
      );
    case 'prefix-sum':
      return (
        <TraceLab
          title="Prefix Sums & Hashing"
          icon="Σ"
          intro="Precompute once, answer many times: prefix sums turn any range sum into one subtraction, and a hash map turns “have I seen the complement?” into an O(1) lookup."
          traces={[
            { id: 'prefix-sum', label: 'Prefix sums' },
            { id: 'two-sum-hash', label: 'Two Sum (hash map)' },
            { id: 'running-sum', label: 'Running aggregate' },
          ]}
          notes={{ 'prefix-sum': 'sum(l..r) = prefix[r + 1] − prefix[l]. The extra prefix[0] = 0 removes the special case for l = 0.' }}
        />
      );
    case 'binary-search':
      return (
        <TraceLab
          title="Binary Search"
          icon="⌖"
          intro="Each probe halves the remaining range. Pick one convention — closed [lo, hi] or half-open [lo, hi) — and keep its invariant consistent in the loop condition and updates."
          traces={[
            { id: 'binary-search', label: 'Exact search [lo, hi]' },
            { id: 'lower-bound', label: 'Lower bound [lo, hi)' },
          ]}
          notes={{ 'lower-bound': 'When a[mid] ≥ target, mid might be the answer, so hi = mid (not mid − 1). The loop ends when lo == hi.' }}
        />
      );
    case 'fast-slow':
      return (
        <TraceLab
          title="Fast & Slow Pointers"
          icon="⥂"
          intro="If a list has a cycle, a pointer moving two steps per iteration must eventually land on a pointer moving one step: inside the cycle their gap shrinks by one each iteration. Restarting one pointer from head then finds the cycle entrance."
          traces={[{ id: 'fast-slow-cycle', label: "Floyd's cycle detection" }]}
        />
      );
  }
}

export default function LabPage() {
  const id = useParams().lab as VizId;
  const { visitLab } = useProgress();
  const known = id in LAB_META;
  useEffect(() => {
    if (known) visitLab(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, known]);
  if (!known)
    return (
      <Glass className="pad">
        <Empty icon="⚗" title="Lab not found">
          <Link to="/lab" className="btn">
            All labs
          </Link>
        </Empty>
      </Glass>
    );
  return <Lab id={id} />;
}
