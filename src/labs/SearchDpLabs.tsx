import { useMemo, useState } from 'react';
import { Glass, Tabs } from '../components/ui';
import { LabHeader, StepView, parseInts } from './common';
import { coinChangeDP, CPU_INFO, gridPathsDP, greedyCoins, INTERVAL_PRESETS, lcsDP, runBacktrack, scheduleCpu, scheduleIntervals, STRATEGY_INFO, type BacktrackAlgo, type CpuPolicy, type IntervalStrategy, type Job } from '../lib/algorithms/labs';
import { TraceViewer } from '../components/TraceViewer';

export function RecursionLab() {
  const [algo, setAlgo] = useState<BacktrackAlgo | 'subsets'>('subsets');
  const [nums, setNums] = useState('2 3 5');
  const [target, setTarget] = useState(8);
  const [n, setN] = useState(4);
  const [applied, setApplied] = useState({ nums: [2, 3, 5], target: 8, n: 4 });
  const [err, setErr] = useState<string | null>(null);
  const run = useMemo(() => {
    if (algo === 'subsets') return null;
    if (algo === 'permutations') return runBacktrack('permutations', { nums: applied.nums.slice(0, 4) });
    if (algo === 'combination-sum') return runBacktrack('combination-sum', { nums: applied.nums, target: applied.target });
    return runBacktrack('n-queens', { n: applied.n });
  }, [algo, applied]);
  const apply = () => {
    const r = parseInts(nums, 5);
    if (typeof r === 'string') return setErr(r);
    if (algo === 'combination-sum' && (r.some((x) => x <= 0) || target < 1 || target > 20)) return setErr('Use positive candidates and a target between 1 and 20.');
    if (algo === 'n-queens' && (n < 1 || n > 6)) return setErr('Choose n between 1 and 6.');
    setErr(null);
    setApplied({ nums: r, target, n });
  };
  return (
    <div className="stack lg">
      <LabHeader title="Recursion & Backtracking" icon="⑂">
        Every node in the tree is one function call. Watch the call stack grow and shrink, the partial solution change with choose → recurse → undo, and red dashed branches get pruned.
      </LabHeader>
      <Glass className="pad stack">
        <Tabs
          value={algo}
          onChange={setAlgo}
          label="Problem"
          items={[
            { id: 'subsets', label: 'Subsets (C++)' },
            { id: 'permutations', label: 'Permutations' },
            { id: 'combination-sum', label: 'Combination sum' },
            { id: 'n-queens', label: 'N-Queens' },
          ]}
        />
        {algo !== 'subsets' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); apply(); }}>
            {algo !== 'n-queens' && <input className="input" style={{ width: 200 }} value={nums} onChange={(e) => setNums(e.target.value)} aria-label="Numbers" />}
            {algo === 'combination-sum' && (
              <label className="row small muted nowrap">
                target <input className="input" type="number" style={{ width: 80 }} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
              </label>
            )}
            {algo === 'n-queens' && (
              <label className="row small muted nowrap">
                n <input className="input" type="number" style={{ width: 80 }} value={n} onChange={(e) => setN(Number(e.target.value))} />
              </label>
            )}
            <button className="btn sm" type="submit">Run</button>
          </form>
        )}
        {algo === 'permutations' && <span className="tiny muted">Uses the first 4 numbers at most (4! = 24 leaves).</span>}
        {algo === 'combination-sum' && <span className="tiny muted">Candidates are sorted so that once one is too large, the loop can stop (break) instead of trying larger ones.</span>}
        {err && <div className="feedback bad small">{err}</div>}
      </Glass>
      <Glass className="pad-lg">{run ? <StepView steps={run.steps} title={algo} /> : <TraceViewer id="subsets" editable />}</Glass>
    </div>
  );
}

const DEFAULT_GRID = [
  [0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0],
];

export function DpLab() {
  const [mode, setMode] = useState<'climb' | 'robber' | 'grid' | 'knapsack' | 'lcs' | 'coins'>('climb');
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const [a, setA] = useState('ABCBDAB');
  const [b, setB] = useState('BDCABA');
  const [ab, setAb] = useState({ a: 'ABCBDAB', b: 'BDCABA' });
  const [coins, setCoins] = useState('1 3 4');
  const [amount, setAmount] = useState(6);
  const [coinCfg, setCoinCfg] = useState({ coins: [1, 3, 4], amount: 6 });
  const [err, setErr] = useState<string | null>(null);
  const gridRun = useMemo(() => (mode === 'grid' ? gridPathsDP(grid) : null), [mode, grid]);
  const lcsRun = useMemo(() => (mode === 'lcs' ? lcsDP(ab.a, ab.b) : null), [mode, ab]);
  const coinRun = useMemo(() => (mode === 'coins' ? coinChangeDP(coinCfg.coins, coinCfg.amount) : null), [mode, coinCfg]);
  return (
    <div className="stack lg">
      <LabHeader title="Dynamic Programming Lab" icon="▤">
        Define the state, the base cases and the transition — then fill the table in an order where every dependency is ready. Amber cells are the dependencies of the cyan cell being computed.
      </LabHeader>
      <Glass className="pad stack">
        <Tabs
          value={mode}
          onChange={setMode}
          label="Problem"
          items={[
            { id: 'climb', label: 'Climbing stairs (C++)' },
            { id: 'robber', label: 'House robber (C++)' },
            { id: 'grid', label: 'Grid paths' },
            { id: 'knapsack', label: 'Knapsack (C++)' },
            { id: 'lcs', label: 'LCS' },
            { id: 'coins', label: 'Coin change' },
          ]}
        />
        {mode === 'grid' && <span className="small muted">State dp[r][c] = number of right/down paths reaching (r, c). Click cells below to toggle obstacles.</span>}
        {mode === 'grid' && (
          <div className="grid-viz" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 40px)`, width: 'fit-content' }}>
            {grid.flatMap((row, r) =>
              row.map((v, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`gcell ${v ? 'wall' : ''} ${r === 0 && c === 0 ? 'start' : ''} ${r === grid.length - 1 && c === row.length - 1 ? 'goal' : ''}`}
                  style={{ border: 0, cursor: 'pointer' }}
                  aria-label={`cell ${r},${c} ${v ? 'obstacle' : 'open'}`}
                  onClick={() => setGrid(grid.map((rr, i) => rr.map((x, j) => (i === r && j === c ? 1 - x : x))))}
                >
                  {r === 0 && c === 0 ? 'S' : r === grid.length - 1 && c === row.length - 1 ? 'G' : ''}
                </button>
              )),
            )}
          </div>
        )}
        {mode === 'lcs' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (!a || !b || a.length > 10 || b.length > 10) setErr('Use two non-empty strings of at most 10 characters.'); else { setErr(null); setAb({ a, b }); } }}>
            <input className="input" style={{ width: 160 }} value={a} onChange={(e) => setA(e.target.value)} aria-label="String a" />
            <input className="input" style={{ width: 160 }} value={b} onChange={(e) => setB(e.target.value)} aria-label="String b" />
            <button className="btn sm" type="submit">Run</button>
          </form>
        )}
        {mode === 'coins' && (
          <form className="row" onSubmit={(e) => { e.preventDefault(); const r = parseInts(coins, 6); if (typeof r === 'string') setErr(r); else if (r.some((x) => x <= 0) || amount < 0 || amount > 30) setErr('Use positive coins and an amount between 0 and 30.'); else { setErr(null); setCoinCfg({ coins: r, amount }); } }}>
            <input className="input" style={{ width: 160 }} value={coins} onChange={(e) => setCoins(e.target.value)} aria-label="Coins" />
            <label className="row small muted nowrap">
              amount <input className="input" type="number" style={{ width: 80 }} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </label>
            <button className="btn sm" type="submit">Run</button>
          </form>
        )}
        {err && <div className="feedback bad small">{err}</div>}
      </Glass>
      <Glass className="pad-lg">
        {mode === 'climb' && <TraceViewer key="c" id="climb-stairs" editable />}
        {mode === 'robber' && <TraceViewer key="r" id="house-robber" editable />}
        {mode === 'knapsack' && <TraceViewer key="k" id="knapsack" />}
        {gridRun && <StepView steps={gridRun.steps} title="Grid paths" footer={<div className="feedback info small">Paths from S to G: <strong>{gridRun.answer}</strong></div>} />}
        {lcsRun && <StepView steps={lcsRun.steps} title="LCS" footer={<div className="feedback info small">LCS length {lcsRun.length}: “{lcsRun.sequence}”</div>} />}
        {coinRun && (
          <StepView
            steps={coinRun.steps}
            title="Coin change"
            footer={
              <div className="feedback info small">
                DP minimum coins: <strong>{coinRun.answer === -1 ? 'impossible' : coinRun.answer}</strong> · Greedy (largest coin first): <strong>{greedyCoins(coinCfg.coins, coinCfg.amount) === -1 ? 'fails' : greedyCoins(coinCfg.coins, coinCfg.amount)}</strong>
                {coinRun.answer !== greedyCoins(coinCfg.coins, coinCfg.amount) && ' — a counterexample: greedy is not optimal for these coins.'}
              </div>
            }
          />
        )}
      </Glass>
    </div>
  );
}

const DEFAULT_JOBS: Job[] = [
  { id: 'P1', arrive: 0, burst: 7 },
  { id: 'P2', arrive: 1, burst: 3 },
  { id: 'P3', arrive: 2, burst: 1 },
  { id: 'P4', arrive: 3, burst: 4 },
];

export function GreedyLab() {
  const [mode, setMode] = useState<'intervals' | 'cpu' | 'merge'>('intervals');
  const [preset, setPreset] = useState('mixed');
  const [strategy, setStrategy] = useState<IntervalStrategy>('earliest-finish');
  const [policy, setPolicy] = useState<CpuPolicy>('fcfs');
  const intervalRun = useMemo(() => scheduleIntervals(INTERVAL_PRESETS[preset].items, strategy), [preset, strategy]);
  const best = useMemo(() => scheduleIntervals(INTERVAL_PRESETS[preset].items, 'earliest-finish').chosen.length, [preset]);
  const cpuRun = useMemo(() => scheduleCpu(DEFAULT_JOBS, policy), [policy]);
  const avg = useMemo(() => (Object.keys(CPU_INFO) as CpuPolicy[]).map((p) => ({ p, w: scheduleCpu(DEFAULT_JOBS, p).avgWait })), []);
  return (
    <div className="stack lg">
      <LabHeader title="Greedy & Scheduling Lab" icon="⧗">
        A greedy algorithm commits to the locally best choice. It is correct only when an exchange argument proves that choice never hurts — so test tempting rules against counterexamples before trusting them.
      </LabHeader>
      <Glass className="pad stack">
        <Tabs value={mode} onChange={setMode} label="Mode" items={[{ id: 'intervals', label: 'Interval scheduling' }, { id: 'cpu', label: 'CPU scheduling' }, { id: 'merge', label: 'Merge intervals (C++)' }]} />
        {mode === 'intervals' && (
          <div className="row">
            <select className="input" style={{ width: 240 }} value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Preset">
              {Object.entries(INTERVAL_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
            <Tabs value={strategy} onChange={setStrategy} label="Strategy" items={(Object.keys(STRATEGY_INFO) as IntervalStrategy[]).map((s) => ({ id: s, label: STRATEGY_INFO[s].name }))} />
          </div>
        )}
        {mode === 'intervals' && (
          <div className={`feedback ${STRATEGY_INFO[strategy].valid ? 'good' : 'bad'} small`}>
            <strong>{STRATEGY_INFO[strategy].valid ? 'Valid greedy.' : 'Tempting but invalid.'}</strong> {STRATEGY_INFO[strategy].note} This strategy schedules <strong>{intervalRun.chosen.length}</strong>; the optimum here is <strong>{best}</strong>.
          </div>
        )}
        {mode === 'cpu' && (
          <div className="row">
            <Tabs value={policy} onChange={setPolicy} label="Policy" items={(Object.keys(CPU_INFO) as CpuPolicy[]).map((p) => ({ id: p, label: CPU_INFO[p].name }))} />
          </div>
        )}
        {mode === 'cpu' && (
          <div className="feedback info small">
            {CPU_INFO[policy].note} Jobs: {DEFAULT_JOBS.map((j) => `${j.id}(arrive ${j.arrive}, burst ${j.burst})`).join(', ')}. Average waiting time — {avg.map((x) => `${CPU_INFO[x.p].name.split(' (')[0]}: ${x.w.toFixed(2)}`).join(' · ')}.
          </div>
        )}
      </Glass>
      <Glass className="pad-lg">
        {mode === 'intervals' && <StepView steps={intervalRun.steps} title="Interval scheduling" />}
        {mode === 'cpu' && <StepView steps={cpuRun.steps} title="CPU scheduling" />}
        {mode === 'merge' && <TraceViewer id="merge-intervals" />}
      </Glass>
    </div>
  );
}
