import { useMemo, useState } from 'react';
import { GRAPH_ALGO_INFO, SAMPLE_DAG, SAMPLE_UNDIRECTED, runGraph, type GraphAlgo } from '../lib/algorithms/graph';
import { Glass, Tabs } from '../components/ui';
import { LabHeader, StepView } from './common';
import { TraceViewer } from '../components/TraceViewer';
import type { TraceId } from '../types/content';

const ALGOS = Object.keys(GRAPH_ALGO_INFO) as GraphAlgo[];
const SYNCED: { id: TraceId; label: string }[] = [
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'topo-kahn', label: "Kahn's topo sort" },
  { id: 'union-find', label: 'Union-Find' },
];

export default function GraphLab() {
  const [algo, setAlgo] = useState<GraphAlgo>('bfs');
  const [src, setSrc] = useState(0);
  const [mode, setMode] = useState<'explore' | 'code'>('explore');
  const [trace, setTrace] = useState<TraceId>('dijkstra');
  const graph = algo === 'topo' ? SAMPLE_DAG : SAMPLE_UNDIRECTED;
  const steps = useMemo(() => runGraph(algo, graph, src), [algo, graph, src]);
  const info = GRAPH_ALGO_INFO[algo];
  const needsSource = ['bfs', 'dfs', 'dijkstra', 'prim'].includes(algo);

  return (
    <div className="stack lg">
      <LabHeader title="Graph Algorithms Lab" icon="⬡">
        Node-link graphs for traversal, shortest paths, dependency ordering, disjoint sets and minimum spanning trees. Each algorithm lists the assumption it needs.
      </LabHeader>
      <Glass className="pad stack">
        <div className="row between">
          <Tabs value={mode} onChange={setMode} label="Mode" items={[{ id: 'explore', label: 'Explore algorithms' }, { id: 'code', label: 'Synced C++ traces' }]} />
          {mode === 'explore' ? (
            <div className="row">
              <select className="input" style={{ width: 220 }} value={algo} onChange={(e) => setAlgo(e.target.value as GraphAlgo)} aria-label="Algorithm">
                {ALGOS.map((a) => (
                  <option key={a} value={a}>
                    {GRAPH_ALGO_INFO[a].name}
                  </option>
                ))}
              </select>
              {needsSource && (
                <select className="input" style={{ width: 120 }} value={src} onChange={(e) => setSrc(Number(e.target.value))} aria-label="Source node">
                  {graph.labels!.map((l, i) => (
                    <option key={i} value={i}>
                      start {l}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <Tabs value={trace} onChange={setTrace} label="Trace" items={SYNCED.map((s) => ({ id: s.id, label: s.label }))} />
          )}
        </div>
        {mode === 'explore' && (
          <div className="feedback info small">
            <strong>{info.name}</strong> — requires: {info.needs}. {info.note}
          </div>
        )}
      </Glass>
      <Glass className="pad-lg">{mode === 'explore' ? <StepView steps={steps} title={info.name} /> : <TraceViewer key={trace} id={trace} />}</Glass>
      <Glass className="pad stack sm">
        <h2>Choosing the right algorithm</h2>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Graph</th>
                <th>Use</th>
                <th>Complexity</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Fewest edges from s</td><td>unweighted</td><td>BFS</td><td className="mono">O(V + E)</td></tr>
              <tr><td>Cheapest path from s</td><td>weights ≥ 0</td><td>Dijkstra</td><td className="mono">O(E log V)</td></tr>
              <tr><td>Cheapest path, weights 0/1</td><td>0/1 weights</td><td>0-1 BFS</td><td className="mono">O(V + E)</td></tr>
              <tr><td>Valid order of tasks</td><td>directed, acyclic</td><td>Topological sort</td><td className="mono">O(V + E)</td></tr>
              <tr><td>Are a and b connected (edges arrive over time)?</td><td>undirected</td><td>Union-Find</td><td className="mono">≈ O(α(n)) per op</td></tr>
              <tr><td>Connect everything cheaply</td><td>undirected, weighted</td><td>Kruskal / Prim</td><td className="mono">O(E log E)</td></tr>
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  );
}
