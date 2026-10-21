import { useMemo, useRef, useState } from 'react';
import { GRID_INFO, generateMaze, makeGrid, randomWalls, randomWeights, runGrid, type Grid, type GridAlgo } from '../lib/algorithms/grid';
import { Glass, Tabs } from '../components/ui';
import { LabHeader, StepView } from './common';
import { Legend } from '../components/viz/VizRenderer';
import { TraceViewer } from '../components/TraceViewer';

const ROWS = 15;
const COLS = 29;
type Tool = 'wall' | 'weight' | 'start' | 'goal' | 'erase';
const ALGOS = Object.keys(GRID_INFO) as GridAlgo[];

function Editor({ grid, setGrid, tool }: { grid: Grid; setGrid: (g: Grid) => void; tool: Tool }) {
  const painting = useRef<null | boolean>(null);
  const apply = (i: number, first: boolean) => {
    const g = { ...grid, walls: [...grid.walls], weights: [...grid.weights] };
    if (tool === 'start') {
      if (!g.walls[i] && i !== g.goal) g.start = i;
    } else if (tool === 'goal') {
      if (!g.walls[i] && i !== g.start) g.goal = i;
    } else if (i !== g.start && i !== g.goal) {
      if (tool === 'wall') {
        if (first) painting.current = !g.walls[i];
        g.walls[i] = painting.current ?? true;
        g.weights[i] = 1;
      } else if (tool === 'weight') {
        if (first) painting.current = g.weights[i] === 1;
        g.weights[i] = painting.current ? 5 : 1;
        g.walls[i] = false;
      } else {
        g.walls[i] = false;
        g.weights[i] = 1;
      }
    }
    setGrid(g);
  };
  return (
    <div
      className="grid-viz"
      style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`, maxWidth: 900, cursor: 'crosshair' }}
      onPointerUp={() => (painting.current = null)}
      onPointerLeave={() => (painting.current = null)}
      role="grid"
      aria-label="Grid editor: click or drag to paint"
    >
      {Array.from({ length: grid.rows * grid.cols }, (_, i) => {
        let cls = 'gcell';
        if (grid.walls[i]) cls += ' wall';
        else if (i === grid.start) cls += ' start';
        else if (i === grid.goal) cls += ' goal';
        else if (grid.weights[i] > 1) cls += ' heavy';
        return (
          <div
            key={i}
            className={cls}
            onPointerDown={(e) => {
              (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
              apply(i, true);
            }}
            onPointerEnter={(e) => {
              if (e.buttons === 1 && (tool === 'wall' || tool === 'weight' || tool === 'erase')) apply(i, false);
            }}
          >
            {i === grid.start ? 'S' : i === grid.goal ? 'G' : grid.weights[i] > 1 && !grid.walls[i] ? grid.weights[i] : ''}
          </div>
        );
      })}
    </div>
  );
}

export default function MazeLab() {
  const [grid, setGrid] = useState<Grid>(() => randomWalls(makeGrid(ROWS, COLS), 0.22, 3));
  const [tool, setTool] = useState<Tool>('wall');
  const [algo, setAlgo] = useState<GridAlgo>('bfs');
  const [mode, setMode] = useState<'edit' | 'run' | 'compare' | 'code'>('edit');
  const [seed, setSeed] = useState(11);
  const run = useMemo(() => (mode === 'run' ? runGrid(algo, grid) : null), [mode, algo, grid]);
  const compare = useMemo(() => (mode === 'compare' ? ALGOS.map((a) => ({ a, r: runGrid(a, grid) })) : null), [mode, grid]);
  const weighted = grid.weights.some((w) => w > 1);

  return (
    <div className="stack lg">
      <LabHeader title="Maze & Pathfinding Lab" icon="▦">
        Paint walls and heavy cells (cost 5), move the start and goal, then watch how each algorithm explores. BFS is optimal only when every move costs the same; Dijkstra and A* handle non-negative weights.
      </LabHeader>
      <Glass className="pad stack">
        <div className="row between">
          <Tabs value={mode} onChange={setMode} label="Mode" items={[{ id: 'edit', label: '✎ Edit grid' }, { id: 'run', label: '▶ Run one' }, { id: 'compare', label: '⚖ Compare all' }, { id: 'code', label: 'Synced C++ BFS' }]} />
          {mode === 'run' && (
            <select className="input" style={{ width: 210 }} value={algo} onChange={(e) => setAlgo(e.target.value as GridAlgo)} aria-label="Algorithm">
              {ALGOS.map((a) => (
                <option key={a} value={a}>
                  {GRID_INFO[a].name}
                </option>
              ))}
            </select>
          )}
        </div>
        {mode === 'edit' && (
          <div className="row">
            <div className="tabs" role="toolbar" aria-label="Paint tool">
              {(['wall', 'weight', 'start', 'goal', 'erase'] as Tool[]).map((t) => (
                <button key={t} aria-selected={tool === t} onClick={() => setTool(t)}>
                  {t === 'wall' ? '■ Wall' : t === 'weight' ? '⧫ Weight 5' : t === 'start' ? 'S Start' : t === 'goal' ? 'G Goal' : '⌫ Erase'}
                </button>
              ))}
            </div>
            <button className="btn sm" onClick={() => { const s = seed + 1; setSeed(s); setGrid(generateMaze(makeGrid(ROWS, COLS), s)); }}>
              Generate maze
            </button>
            <button className="btn sm" onClick={() => { const s = seed + 1; setSeed(s); setGrid(randomWalls(makeGrid(ROWS, COLS), 0.25, s)); }}>
              Random walls
            </button>
            <button className="btn sm" onClick={() => { const s = seed + 1; setSeed(s); setGrid(randomWeights({ ...grid }, s)); }}>
              Random weights
            </button>
            <button className="btn sm ghost" onClick={() => setGrid(makeGrid(ROWS, COLS))}>
              Clear
            </button>
          </div>
        )}
        <Legend items={[['frontier', 'visited / closed'], ['compare', 'frontier / open'], ['swap', 'current'], ['path', 'final path'], ['#fbbf2440', 'weight 5 cell']]} />
      </Glass>

      <Glass className="pad-lg">
        {mode === 'edit' && <Editor grid={grid} setGrid={setGrid} tool={tool} />}
        {mode === 'run' && run && (
          <StepView
            steps={run.steps}
            title={GRID_INFO[algo].name}
            footer={
              <div className="feedback info small">
                <strong>{GRID_INFO[algo].name}:</strong> {GRID_INFO[algo].note} <em>Guarantee: {GRID_INFO[algo].optimal}.</em>
                {algo === 'bfs' && weighted && ' This grid has weighted cells, so BFS minimises moves, not cost.'}
              </div>
            }
          />
        )}
        {mode === 'compare' && compare && (
          <div className="stack">
            <table className="table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Cells expanded</th>
                  <th>Path moves</th>
                  <th>Path cost{weighted ? ' (weights count)' : ''}</th>
                  <th>Guarantee</th>
                </tr>
              </thead>
              <tbody>
                {compare.map(({ a, r }) => (
                  <tr key={a}>
                    <td>{GRID_INFO[a].name}</td>
                    <td className="mono">{r.visitedCount}</td>
                    <td className="mono">{r.path.length ? r.path.length - 1 : 'unreachable'}</td>
                    <td className="mono">{r.path.length ? r.path.slice(1).reduce((s, id) => s + grid.weights[id], 0) : '—'}</td>
                    <td className="small muted">{GRID_INFO[a].optimal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted">All four run on the identical grid. Cost is recomputed with the cell weights for every algorithm so you can see where BFS and DFS paths are more expensive on weighted grids.</p>
          </div>
        )}
        {mode === 'code' && <TraceViewer id="bfs-grid" />}
      </Glass>
    </div>
  );
}
