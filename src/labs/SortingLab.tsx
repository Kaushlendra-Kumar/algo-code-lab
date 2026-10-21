import { useMemo, useState } from 'react';
import { SORT_INFO, runSort, type SortAlgo } from '../lib/algorithms/sorting';
import { randomArray } from '../lib/rng';
import { Glass, Tabs } from '../components/ui';
import { LabHeader, StepView, parseInts } from './common';
import { usePlayer } from '../components/viz/usePlayer';
import { PlayerControls } from '../components/viz/PlayerControls';
import { VizRenderer, Legend } from '../components/viz/VizRenderer';
import { TraceViewer } from '../components/TraceViewer';

const ALGOS = Object.keys(SORT_INFO) as SortAlgo[];

function Race({ a, b, input }: { a: SortAlgo; b: SortAlgo; input: number[] }) {
  const ra = useMemo(() => runSort(a, input), [a, input]);
  const rb = useMemo(() => runSort(b, input), [b, input]);
  const len = Math.max(ra.steps.length, rb.steps.length);
  const p = usePlayer(len, { resetKey: `${a}${b}${input.join()}`, baseMs: 140 });
  const sa = ra.steps[Math.min(p.index, ra.steps.length - 1)];
  const sb = rb.steps[Math.min(p.index, rb.steps.length - 1)];
  return (
    <div className="stack" data-player-scope tabIndex={-1}>
      <div className="grid c2">
        {[
          [a, ra, sa],
          [b, rb, sb],
        ].map(([algo, r, s]) => {
          const run = r as typeof ra;
          const st = s as (typeof ra.steps)[number];
          const finished = p.index >= run.steps.length - 1;
          return (
            <div key={String(algo)} className="stack sm">
              <div className="row between">
                <strong>{SORT_INFO[algo as SortAlgo].name}</strong>
                {finished && <span className="chip good">finished at step {run.steps.length}</span>}
              </div>
              <div className="viz-stage" style={{ minHeight: 250 }}>
                <VizRenderer state={st?.state} />
              </div>
              <div className="small mono muted">
                comparisons {String(st?.vars?.comparisons ?? 0)} · writes {String(st?.vars?.writes ?? 0)}
              </div>
            </div>
          );
        })}
      </div>
      <PlayerControls p={p} label="Race" />
      <div className="feedback info small">
        Measured on this input: {SORT_INFO[a].name} used {ra.comparisons} comparisons / {ra.writes} writes; {SORT_INFO[b].name} used {rb.comparisons} / {rb.writes}. These are operation counts for one run — they illustrate, but do not replace, the theoretical bounds in the table below.
      </div>
    </div>
  );
}

export default function SortingLab() {
  const [algo, setAlgo] = useState<SortAlgo>('insertion');
  const [other, setOther] = useState<SortAlgo>('merge');
  const [mode, setMode] = useState<'single' | 'race' | 'code'>('single');
  const [size, setSize] = useState(16);
  const [seed, setSeed] = useState(7);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<'random' | 'sorted' | 'reversed' | 'few-unique'>('random');
  const [input, setInput] = useState<number[]>(() => randomArray(16, 60, 7));

  const generate = (p = preset, n = size, s = seed) => {
    let a = randomArray(n, 60, s);
    if (p === 'sorted') a = [...a].sort((x, y) => x - y);
    if (p === 'reversed') a = [...a].sort((x, y) => y - x);
    if (p === 'few-unique') a = a.map((x) => 10 + (x % 4) * 12);
    setInput(a);
    setCustom('');
    setError(null);
  };
  const run = useMemo(() => runSort(algo, input), [algo, input]);
  const info = SORT_INFO[algo];

  return (
    <div className="stack lg">
      <LabHeader title="Sorting Arena" icon="▥">
        Run six classic sorts step by step, or race two on the same input. Bars turn amber when compared, pink when written, green when final.
      </LabHeader>
      <Glass className="pad stack">
        <div className="row between">
          <Tabs value={mode} onChange={setMode} label="Mode" items={[{ id: 'single', label: 'Single run' }, { id: 'race', label: 'Compare two' }, { id: 'code', label: 'Synced C++ (insertion)' }]} />
          <div className="row">
            <select className="input" style={{ width: 170 }} value={algo} onChange={(e) => setAlgo(e.target.value as SortAlgo)} aria-label="Algorithm">
              {ALGOS.map((a) => (
                <option key={a} value={a}>
                  {SORT_INFO[a].name}
                </option>
              ))}
            </select>
            {mode === 'race' && (
              <>
                <span className="muted">vs</span>
                <select className="input" style={{ width: 170 }} value={other} onChange={(e) => setOther(e.target.value as SortAlgo)} aria-label="Second algorithm">
                  {ALGOS.map((a) => (
                    <option key={a} value={a}>
                      {SORT_INFO[a].name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
        {mode !== 'code' && (
          <div className="row">
            <select className="input" style={{ width: 150 }} value={preset} onChange={(e) => { const p = e.target.value as typeof preset; setPreset(p); generate(p); }} aria-label="Input shape">
              <option value="random">Random</option>
              <option value="sorted">Already sorted</option>
              <option value="reversed">Reversed</option>
              <option value="few-unique">Few unique</option>
            </select>
            <label className="row small muted nowrap">
              n = {size}
              <input type="range" min={4} max={40} value={size} onChange={(e) => { setSize(Number(e.target.value)); generate(preset, Number(e.target.value)); }} aria-label="Array size" />
            </label>
            <button className="btn sm" onClick={() => { const s = seed + 1; setSeed(s); generate(preset, size, s); }}>
              ↻ New array
            </button>
            <form className="row grow" onSubmit={(e) => { e.preventDefault(); const r = parseInts(custom); if (typeof r === 'string') setError(r); else { setError(null); setInput(r); } }}>
              <input className="input grow" placeholder="Or type values: 5, 3, 8, 1" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom array" />
              <button className="btn sm" type="submit">Use</button>
            </form>
          </div>
        )}
        {error && <div className="feedback bad small">{error}</div>}
        <Legend items={[['compare', 'compared'], ['swap', 'written / swapped'], ['active', 'key / pivot'], ['done', 'in final position']]} />
      </Glass>

      <Glass className="pad-lg">
        {mode === 'single' && <StepView steps={run.steps} title={info.name} />}
        {mode === 'race' && <Race a={algo} b={other} input={input} />}
        {mode === 'code' && <TraceViewer id="insertion-sort" editable />}
      </Glass>

      <Glass className="pad stack">
        <h2>Theory vs. this run</h2>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Best</th>
                <th>Average</th>
                <th>Worst</th>
                <th>Extra space</th>
                <th>Stable</th>
              </tr>
            </thead>
            <tbody>
              {ALGOS.map((a) => (
                <tr key={a} style={a === algo ? { background: 'rgba(124,156,255,0.08)' } : undefined}>
                  <td>{SORT_INFO[a].name}</td>
                  <td className="mono">{SORT_INFO[a].best}</td>
                  <td className="mono">{SORT_INFO[a].average}</td>
                  <td className="mono">{SORT_INFO[a].worst}</td>
                  <td className="mono">{SORT_INFO[a].space}</td>
                  <td>{SORT_INFO[a].stable ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">{info.note}</p>
        <p className="small muted">
          This run ({input.length} values): <strong>{run.comparisons}</strong> comparisons and <strong>{run.writes}</strong> writes. Theoretical complexity describes growth as n increases; a single run's counts depend on the specific input (try “Already sorted” with Insertion vs Quick sort).
        </p>
      </Glass>
    </div>
  );
}
