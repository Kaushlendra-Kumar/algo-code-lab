import { useMemo, useState } from 'react';
import type { CppExample } from '../types/content';
import { CodeBlock } from './CodeBlock';
import { DryRunTable, dryRunFromSteps } from './DryRun';
import { TraceViewer, WatchPanel } from './TraceViewer';
import { Disclosure, Rich, Tabs } from './ui';
import { displayCode, findLine, gapLines, markerLines, normalizeCode } from '../content/cpp';
import { TRACES } from '../lib/viz/traces';
import { VizRenderer } from './viz/VizRenderer';
import { useProgress } from '../lib/progress/context';
import { hashString, mulberry32, shuffle } from '../lib/rng';

type Mode = 'learn' | 'trace' | 'predict' | 'gap' | 'bug' | 'implement';

export function ExampleView({ ex, label }: { ex: CppExample; label: string }) {
  const modes: { id: Mode; label: string }[] = [
    { id: 'learn', label: 'Learn' },
    ...(ex.trace ? [{ id: 'trace' as Mode, label: 'Step through' }, { id: 'predict' as Mode, label: 'Predict' }] : []),
    ...(gapLines(ex.code).length ? [{ id: 'gap' as Mode, label: 'Fill the gap' }] : []),
    ...(ex.bug ? [{ id: 'bug' as Mode, label: 'Fix the bug' }] : []),
    { id: 'implement', label: 'Implement' },
  ];
  const [mode, setMode] = useState<Mode>('learn');
  return (
    <div className="stack">
      <div className="row between">
        <div>
          <div className="eyebrow">{label}{ex.kind && ex.kind !== 'core' ? ` · ${ex.kind.replace(/-/g, ' ')}` : ''}</div>
          <h3>{ex.title}</h3>
        </div>
        <Tabs value={mode} onChange={setMode} items={modes} label={`${ex.title} modes`} />
      </div>
      {mode === 'learn' && <LearnMode ex={ex} />}
      {mode === 'trace' && ex.trace && <TraceViewer id={ex.trace.id} editable />}
      {mode === 'predict' && ex.trace && <PredictMode ex={ex} />}
      {mode === 'gap' && <GapMode ex={ex} />}
      {mode === 'bug' && ex.bug && <BugMode ex={ex} />}
      {mode === 'implement' && <ImplementMode ex={ex} />}
    </div>
  );
}

function Facts({ ex }: { ex: CppExample }) {
  return (
    <div className="grid c3">
      <div className="glass tight">
        <div className="tiny muted">Goal</div>
        <div className="small">{ex.goal}</div>
      </div>
      <div className="glass tight">
        <div className="tiny muted">Input</div>
        <code className="small">{ex.input}</code>
      </div>
      <div className="glass tight">
        <div className="tiny muted">Expected output (verified with g++)</div>
        <pre className="small mono" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.output}</pre>
      </div>
    </div>
  );
}

function LearnMode({ ex }: { ex: CppExample }) {
  const keyLineNums = useMemo(() => ex.keyLines.map((k) => findLine(displayCode(ex.code), k.match)).filter((n) => n > 0), [ex]);
  const dry = useMemo(() => ex.dryRun ?? (ex.trace ? dryRunFromSteps(TRACES[ex.trace.id].run(ex.trace.input as Record<string, unknown>).steps) : undefined), [ex]);
  return (
    <div className="stack">
      <Facts ex={ex} />
      <div className="feedback info">
        <strong>Key idea.</strong> <Rich text={ex.idea} />
      </div>
      <div className="grid c2" style={{ alignItems: 'start' }}>
        <CodeBlock code={ex.code} keyLines={keyLineNums} />
        <div className="stack">
          <h4>Line by line</h4>
          {ex.keyLines.map((k, i) => (
            <div key={i} className="glass tight">
              <div className="row nowrap" style={{ alignItems: 'flex-start' }}>
                <span className="chip">L{keyLineNums[i] ?? '?'}</span>
                <div className="grow">
                  <code className="small mono" style={{ color: 'var(--code-fn)' }}>{k.match}</code>
                  <Rich text={k.note} className="small" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {dry && (
        <Disclosure title={`Dry run${ex.dryRun ? '' : ' (generated from the synced trace)'}`} open>
          <DryRunTable dry={dry} />
        </Disclosure>
      )}
      <div className="grid c2">
        <div className="glass tight">
          <h4>Complexity</h4>
          <div className="row mt" style={{ gap: 8 }}>
            <span className="chip info">Time {ex.complexity.time}</span>
            <span className="chip info">Space {ex.complexity.space}</span>
          </div>
          <p className="small muted">{ex.complexity.why}</p>
        </div>
        <div className="glass tight">
          <h4>Edge cases &amp; common mistakes</h4>
          <ul className="small" style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            {ex.edgeCases.map((e, i) => (
              <li key={`e${i}`}>{e}</li>
            ))}
            {ex.mistakes.map((m, i) => (
              <li key={`m${i}`} style={{ color: 'var(--tone-warn)' }}>
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="banner">
        <strong>Try it yourself:</strong> {ex.tryIt}
      </div>
    </div>
  );
}

interface Prediction {
  stepIndex: number;
  variable: string;
  options: string[];
  answer: number;
}

function buildPredictions(ex: CppExample): { predictions: Prediction[]; steps: ReturnType<(typeof TRACES)[keyof typeof TRACES]['run']>['steps'] } {
  const run = TRACES[ex.trace!.id].run(ex.trace!.input as Record<string, unknown>);
  const steps = run.steps;
  const rnd = mulberry32(hashString(ex.id));
  const candidates: { i: number; k: string }[] = [];
  for (let i = 0; i + 1 < steps.length; i++) {
    const a = steps[i].vars ?? {};
    const b = steps[i + 1].vars ?? {};
    for (const k of Object.keys(b)) if (k in a && a[k] !== b[k] && typeof b[k] !== 'boolean') candidates.push({ i, k });
  }
  const chosen: { i: number; k: string }[] = [];
  const pool = [...candidates];
  while (chosen.length < 4 && pool.length) {
    const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    if (!chosen.some((x) => Math.abs(x.i - c.i) < 2)) chosen.push(c);
  }
  chosen.sort((a, b) => a.i - b.i);
  const predictions = chosen.map(({ i, k }) => {
    const truth = String(steps[i + 1].vars![k]);
    const seen = new Set<string>();
    for (const s of steps) if (s.vars && k in s.vars) seen.add(String(s.vars[k]));
    seen.delete(truth);
    const current = String(steps[i].vars?.[k]);
    const distract = shuffle([...seen].filter((v) => v !== current), hashString(`${ex.id}${i}`)).slice(0, 2);
    const opts = shuffle([truth, current, ...distract].filter((v, j, arr) => arr.indexOf(v) === j), hashString(`${ex.id}:${i}:${k}`));
    return { stepIndex: i, variable: k, options: opts, answer: opts.indexOf(truth) };
  });
  return { predictions, steps };
}

function PredictMode({ ex }: { ex: CppExample }) {
  const { completeExercise } = useProgress();
  const { predictions, steps } = useMemo(() => buildPredictions(ex), [ex]);
  const [k, setK] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const lines = useMemo(() => markerLines(ex.code), [ex.code]);
  if (!predictions.length) return <div className="muted">This trace has no variable changes to predict.</div>;
  const done = k >= predictions.length;
  const pr = predictions[Math.min(k, predictions.length - 1)];
  const step = steps[done ? steps.length - 1 : chosen !== null ? pr.stepIndex + 1 : pr.stepIndex];
  const nextLine = steps[pr.stepIndex + 1]?.line;
  return (
    <div className="stack" data-player-scope>
      <div className="feedback info small">Trace mode: look at the highlighted line and the current state, then predict the value of a variable after the <em>next</em> step executes. Predictions are checked against the scripted trace of this exact program and input.</div>
      <div className="grid c2" style={{ alignItems: 'start' }}>
        <CodeBlock code={ex.code} activeLine={step?.line ? lines[step.line] : undefined} maxHeight={420} />
        <div className="stack">
          <div className="viz-stage">
            <VizRenderer state={step?.state} />
          </div>
          <div className="viz-note">
            <span className="step">#{(done ? steps.length - 1 : chosen !== null ? pr.stepIndex + 1 : pr.stepIndex) + 1}</span>
            <span>{step?.note}</span>
          </div>
          <WatchPanel step={step} />
        </div>
      </div>
      {done ? (
        <div className={`feedback ${score === predictions.length ? 'good' : 'info'}`}>
          You predicted {score}/{predictions.length} correctly.
          <button className="btn sm" style={{ marginLeft: 10 }} onClick={() => { setK(0); setChosen(null); setScore(0); }}>
            Restart
          </button>
        </div>
      ) : (
        <div className="glass pad stack">
          <div style={{ fontWeight: 650 }}>
            Prediction {k + 1}/{predictions.length}: after the next step{nextLine && lines[nextLine] ? ` (line ${lines[nextLine]})` : ''}, what is <code className="mono">{pr.variable}</code>?
          </div>
          <div className="row">
            {pr.options.map((o, i) => (
              <button
                key={i}
                className={`btn ${chosen === null ? '' : i === pr.answer ? 'good' : i === chosen ? 'bad' : ''}`}
                disabled={chosen !== null}
                onClick={() => {
                  setChosen(i);
                  const ok = i === pr.answer;
                  const newScore = score + (ok ? 1 : 0);
                  setScore(newScore);
                  if (k === predictions.length - 1 && newScore === predictions.length) completeExercise(`trace:${ex.id}`, true);
                }}
              >
                <span className="mono">{o}</span>
              </button>
            ))}
          </div>
          {chosen !== null && (
            <div className="row">
              <span className={chosen === pr.answer ? 'chip good' : 'chip warn'}>{chosen === pr.answer ? 'Correct' : `It becomes ${pr.options[pr.answer]}`}</span>
              <button className="btn sm primary" onClick={() => { setK(k + 1); setChosen(null); }}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GapMode({ ex }: { ex: CppExample }) {
  const { completeExercise, state } = useProgress();
  const shown = useMemo(() => displayCode(ex.code), [ex.code]);
  const gaps = useMemo(() => gapLines(ex.code), [ex.code]);
  const answers = useMemo(() => Object.fromEntries(gaps.map((g) => [g, shown.split('\n')[g - 1].trim()])), [gaps, shown]);
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ok = (g: number) => normalizeCode(vals[g] ?? '') === normalizeCode(answers[g]);
  const allOk = gaps.every(ok);
  const done = state.exercises[`gap:${ex.id}`]?.done;
  return (
    <div className="stack">
      <div className="feedback info small">
        Complete the {gaps.length} hidden line{gaps.length > 1 ? 's' : ''}. Answers are compared to the reference line ignoring whitespace — a logically equivalent but differently written line will be marked as different, so use <strong>Reveal</strong> to compare. {done && <span className="chip good">completed before ✓</span>}
      </div>
      <CodeBlock
        code={ex.code}
        copy={false}
        renderLine={(n, content) => {
          if (!gaps.includes(n)) return content;
          const indent = shown.split('\n')[n - 1].match(/^\s*/)?.[0] ?? '';
          return (
            <>
              {indent}
              {revealed ? (
                <span className="tok-fn">{answers[n]}</span>
              ) : (
                <input
                  className={`gap-input ${checked ? (ok(n) ? 'ok' : 'bad') : ''}`}
                  value={vals[n] ?? ''}
                  placeholder="// your line here"
                  spellCheck={false}
                  aria-label={`Missing line ${n}`}
                  onChange={(e) => {
                    setVals({ ...vals, [n]: e.target.value });
                    setChecked(false);
                  }}
                />
              )}
            </>
          );
        }}
      />
      <div className="row">
        <button
          className="btn primary"
          onClick={() => {
            setChecked(true);
            completeExercise(`gap:${ex.id}`, allOk);
          }}
          disabled={revealed}
        >
          Check
        </button>
        <button className="btn ghost" onClick={() => setRevealed(!revealed)}>
          {revealed ? 'Hide answer' : 'Reveal'}
        </button>
        {checked && <span className={allOk ? 'chip good' : 'chip warn'}>{allOk ? 'All lines match ✓' : `${gaps.filter(ok).length}/${gaps.length} lines match`}</span>}
      </div>
    </div>
  );
}

function BugMode({ ex }: { ex: CppExample }) {
  const { completeExercise } = useProgress();
  const bug = ex.bug!;
  const buggy = useMemo(() => ex.code.replace(bug.find, bug.replace), [ex.code, bug]);
  const bugLine = useMemo(() => findLine(displayCode(buggy), bug.replace), [buggy, bug]);
  const fixedLine = useMemo(() => displayCode(ex.code).split('\n')[bugLine - 1]?.trim() ?? '', [ex.code, bugLine]);
  const [picked, setPicked] = useState<number | null>(null);
  const [fix, setFix] = useState('');
  const [stage, setStage] = useState<'find' | 'fix' | 'done'>('find');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="stack">
      <div className="feedback bad small">
        <strong>Symptom:</strong> {bug.symptom}
      </div>
      <div className="small muted">{stage === 'find' ? 'Step 1 — click the line you believe is wrong.' : stage === 'fix' ? 'Step 2 — rewrite the faulty line.' : 'Fixed.'}</div>
      <CodeBlock
        code={buggy}
        copy={false}
        selectedLine={picked ?? undefined}
        onLineClick={
          stage === 'find'
            ? (n) => {
                setPicked(n);
                if (n === bugLine) {
                  setStage('fix');
                  setFix(displayCode(buggy).split('\n')[n - 1].trim());
                  setMsg('Correct line. Now fix it.');
                } else setMsg(`Line ${n} is fine. Compare the symptom with what each line does.`);
              }
            : undefined
        }
      />
      {msg && <div className="feedback info small">{msg}</div>}
      {stage === 'fix' && (
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (normalizeCode(fix) === normalizeCode(fixedLine)) {
              setStage('done');
              setMsg(null);
              completeExercise(`bug:${ex.id}`, true);
            } else {
              setMsg('That line does not match the reference fix yet. Think about which values the condition should accept.');
              completeExercise(`bug:${ex.id}`, false);
            }
          }}
        >
          <input className="input mono grow" value={fix} onChange={(e) => setFix(e.target.value)} aria-label="Fixed line" spellCheck={false} />
          <button className="btn primary" type="submit">
            Submit fix
          </button>
          <button className="btn ghost" type="button" onClick={() => { setStage('done'); setMsg(null); }}>
            Show answer
          </button>
        </form>
      )}
      {stage === 'done' && (
        <div className="feedback good">
          <div>
            <strong>Fix:</strong> <code className="mono">{fixedLine}</code>
          </div>
          <Rich text={bug.explanation} className="small" />
        </div>
      )}
    </div>
  );
}

function ImplementMode({ ex }: { ex: CppExample }) {
  const [hints, setHints] = useState(0);
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <div className="stack">
      <Facts ex={ex} />
      <div className="feedback info small">
        Write the program yourself, then compile it locally (for example <code>g++ -std=c++17 main.cpp &amp;&amp; ./a.out</code>) and compare with the expected output above. AlgoVerse does not compile or run your code in the browser.
      </div>
      <textarea className="input" rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="// Your C++17 solution" spellCheck={false} aria-label="Your implementation" />
      <div className="stack sm">
        {ex.keyLines.slice(0, hints).map((k, i) => (
          <div key={i} className="feedback info small">
            Hint {i + 1}: <Rich text={k.note} />
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn" disabled={hints >= ex.keyLines.length} onClick={() => setHints(hints + 1)}>
          Reveal hint ({hints}/{ex.keyLines.length})
        </button>
        <button className="btn ghost" onClick={() => setShow(!show)}>
          {show ? 'Hide reference' : 'Show reference solution'}
        </button>
      </div>
      {show && <CodeBlock code={ex.code} />}
    </div>
  );
}
