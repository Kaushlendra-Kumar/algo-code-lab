import { useMemo, useState } from 'react';
import { Glass, Switch } from '../components/ui';
import { LabHeader } from './common';

const CURVES = [
  { id: '1', label: 'O(1)', f: () => 1, color: '#94a3b8' },
  { id: 'log', label: 'O(log n)', f: (n: number) => Math.log2(Math.max(n, 1)), color: '#22d3ee' },
  { id: 'n', label: 'O(n)', f: (n: number) => n, color: '#34d399' },
  { id: 'nlogn', label: 'O(n log n)', f: (n: number) => n * Math.log2(Math.max(n, 1)), color: '#fbbf24' },
  { id: 'n2', label: 'O(n²)', f: (n: number) => n * n, color: '#fb923c' },
  { id: '2n', label: 'O(2ⁿ)', f: (n: number) => Math.pow(2, n), color: '#fb7185' },
];

const fmt = (x: number) => (x >= 1e15 ? x.toExponential(1) : x >= 1e6 ? `${(x / 1e6).toFixed(x >= 1e8 ? 0 : 1)}M` : x >= 1000 ? `${(x / 1000).toFixed(1)}k` : x.toFixed(x < 10 ? 1 : 0));

interface Measure {
  n: number;
  linear: number;
  nlogn: number;
  quadratic: number;
}

function timeIt(fn: () => void): number {
  const reps = 3;
  let best = Infinity;
  for (let r = 0; r < reps; r++) {
    const t = performance.now();
    fn();
    best = Math.min(best, performance.now() - t);
  }
  return best;
}

export default function ComplexityLab() {
  const [maxN, setMaxN] = useState(32);
  const [log, setLog] = useState(false);
  const [on, setOn] = useState<Record<string, boolean>>({ '1': true, log: true, n: true, nlogn: true, n2: true, '2n': true });
  const [measures, setMeasures] = useState<Measure[] | null>(null);
  const [busy, setBusy] = useState(false);

  const W = 100;
  const H = 56;
  const pts = useMemo(() => {
    const ns = Array.from({ length: 60 }, (_, i) => 1 + ((maxN - 1) * i) / 59);
    const visible = CURVES.filter((c) => on[c.id]);
    const yMax = Math.max(1, ...visible.flatMap((c) => ns.map((n) => c.f(n))).filter(Number.isFinite));
    const capY = log ? Math.log10(yMax + 1) : Math.min(yMax, Math.max(...visible.filter((c) => c.id !== '2n').flatMap((c) => ns.map((n) => c.f(n))), 10) * 1.15);
    const y = (v: number) => {
      const t = log ? Math.log10(v + 1) / capY : Math.min(v, capY) / capY;
      return H - 4 - t * (H - 10);
    };
    return { ns, visible, y, capY };
  }, [maxN, log, on]);

  const measure = () => {
    setBusy(true);
    setTimeout(() => {
      const sizes = [500, 1000, 2000, 4000];
      const out: Measure[] = [];
      for (const n of sizes) {
        const arr = Array.from({ length: n }, (_, i) => (i * 7919) % 1000);
        let sink = 0;
        const linear = timeIt(() => {
          for (let k = 0; k < 50; k++) for (let i = 0; i < n; i++) sink += arr[i];
        }) / 50;
        const nlogn = timeIt(() => {
          [...arr].sort((a, b) => a - b);
        });
        const quadratic = timeIt(() => {
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (arr[i] === arr[j]) sink++;
        });
        if (sink === -1) console.log(sink);
        out.push({ n, linear, nlogn, quadratic });
      }
      setMeasures(out);
      setBusy(false);
    }, 30);
  };

  return (
    <div className="stack lg">
      <LabHeader title="Complexity Lab" icon="∿">
        Theoretical growth curves describe how work scales with n, ignoring constants. Below them you can run a small timing experiment in your browser — real measurements are noisy and include constant factors, so they are labelled separately.
      </LabHeader>
      <Glass className="pad stack">
        <div className="row between">
          <div className="row">
            {CURVES.map((c) => (
              <button key={c.id} className={`chip ${on[c.id] ? 'on' : ''}`} style={on[c.id] ? { borderColor: c.color } : undefined} onClick={() => setOn({ ...on, [c.id]: !on[c.id] })} aria-pressed={on[c.id]}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block' }} /> {c.label}
              </button>
            ))}
          </div>
          <div className="row">
            <label className="row small muted nowrap">
              n up to {maxN}
              <input type="range" min={4} max={64} value={maxN} onChange={(e) => setMaxN(Number(e.target.value))} aria-label="Maximum n" />
            </label>
            <label className="row small muted nowrap">
              log scale <Switch checked={log} onChange={setLog} label="Log scale" />
            </label>
          </div>
        </div>
        <div className="viz-stage">
          <svg className="viz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Growth curves">
            {[0.25, 0.5, 0.75].map((t) => (
              <line key={t} x1={4} x2={W - 2} y1={4 + t * (H - 10)} y2={4 + t * (H - 10)} stroke="rgba(255,255,255,0.05)" strokeWidth={0.2} />
            ))}
            {pts.visible.map((c) => (
              <polyline key={c.id} fill="none" stroke={c.color} strokeWidth={0.6} strokeLinejoin="round" points={pts.ns.map((n) => `${4 + ((n - 1) / (maxN - 1)) * (W - 8)},${pts.y(c.f(n))}`).join(' ')} />
            ))}
            <text x={4} y={H - 0.5} fontSize={2.4} fill="var(--faint)">
              n = 1
            </text>
            <text x={W - 4} y={H - 0.5} fontSize={2.4} fill="var(--faint)" textAnchor="end">
              n = {maxN}
            </text>
          </svg>
        </div>
        {!log && <p className="tiny muted">Linear scale is clipped so the slower curves stay visible; O(2ⁿ) leaves the chart almost immediately. Switch to log scale to see all of them.</p>}
        <div className="scroll-x">
          <table className="table mono">
            <thead>
              <tr>
                <th>n</th>
                {CURVES.map((c) => (
                  <th key={c.id}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[10, 20, 30, 50, 1000, 100000].map((n) => (
                <tr key={n}>
                  <td>{n.toLocaleString()}</td>
                  {CURVES.map((c) => (
                    <td key={c.id}>{c.id === '2n' && n > 64 ? '≫ 10¹⁹' : fmt(c.f(n))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">Rule of thumb: about 10⁸ simple operations per second. n = 10⁵ with O(n²) is 10¹⁰ operations — far too slow; with O(n log n) it is ≈ 1.7·10⁶.</p>
      </Glass>
      <Glass className="pad stack">
        <div className="row between">
          <h2>Real runtime experiment</h2>
          <button className="btn primary" onClick={measure} disabled={busy}>
            {busy ? 'Measuring…' : 'Run in my browser'}
          </button>
        </div>
        <p className="small muted">Runs JavaScript (not C++) on this device: a linear sum, Array.prototype.sort, and an all-pairs comparison. Each timing is the best of 3 runs in milliseconds. Results vary with your device, browser and background load.</p>
        {measures && (
          <table className="table mono">
            <thead>
              <tr>
                <th>n</th>
                <th>linear sum (ms)</th>
                <th>sort (ms)</th>
                <th>all pairs (ms)</th>
                <th>pairs ratio vs previous n</th>
              </tr>
            </thead>
            <tbody>
              {measures.map((m, i) => (
                <tr key={m.n}>
                  <td>{m.n}</td>
                  <td>{m.linear.toFixed(4)}</td>
                  <td>{m.nlogn.toFixed(3)}</td>
                  <td>{m.quadratic.toFixed(2)}</td>
                  <td>{i ? `×${(m.quadratic / Math.max(measures[i - 1].quadratic, 1e-6)).toFixed(1)} (theory ×4)` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Glass>
    </div>
  );
}
