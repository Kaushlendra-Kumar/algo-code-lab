import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PATTERN_BY_ID, PATTERNS, QUESTION_BY_ID } from '../content';
import { useProgress } from '../lib/progress/context';
import { approachChoices, complexityChoices, predictionTests, statusOf } from '../lib/questions';
import { normalizeOutput, findLine } from '../content/cpp';
import { CodeBlock } from '../components/CodeBlock';
import { DifficultyChip, Empty, Glass, Rich, Tabs } from '../components/ui';
import { questionScore } from '../lib/progress/rules';
import type { AttemptMode } from '../lib/progress/model';
import { LAB_META } from './labMeta';

type Panel = 'workspace' | 'hints' | 'solution' | 'history';

function Choice({ options, value, onChange, result, name }: { options: string[]; value: number | null; onChange: (i: number) => void; result?: boolean; name: string }) {
  return (
    <div className="row" role="radiogroup" aria-label={name}>
      {options.map((o, i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} className={`btn sm ${value === i ? (result === undefined ? 'selected' : result ? 'good' : 'bad') : ''}`} onClick={() => onChange(i)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Practice() {
  const id = useParams().id ?? '';
  const [params] = useSearchParams();
  const mode = (params.get('mode') as AttemptMode) || 'practice';
  const q = QUESTION_BY_ID[id];
  const { state, today, recordAttempt, selfReport, markNeedsRevision, markSolutionViewed, saveDraft, completeDaily } = useProgress();
  const [panel, setPanel] = useState<Panel>('workspace');
  const [hints, setHints] = useState(0);
  const [approach, setApproach] = useState<number | null>(null);
  const [cx, setCx] = useState<number | null>(null);
  const [outs, setOuts] = useState<string[]>(['', '']);
  const [result, setResult] = useState<null | { approach: boolean; complexity: boolean; outputs: boolean[] }>(null);
  const [showFull, setShowFull] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    setPanel('workspace');
    setHints(0);
    setApproach(null);
    setCx(null);
    setOuts(['', '']);
    setResult(null);
    started.current = Date.now();
  }, [id]);

  const approachMcq = useMemo(() => (q ? approachChoices(q, PATTERNS.map((p) => p.id), (pid) => PATTERN_BY_ID[pid]?.name ?? pid) : null), [q]);
  const cxMcq = useMemo(() => (q ? complexityChoices(q) : null), [q]);
  const tests = useMemo(() => (q ? predictionTests(q) : []), [q]);

  if (!q || !approachMcq || !cxMcq)
    return (
      <Glass className="pad">
        <Empty icon="⌘" title="Question not found">
          <Link className="btn" to="/questions">
            Back to the question bank
          </Link>
        </Empty>
      </Glass>
    );

  const rec = state.attempts[q.id];
  const st = statusOf(state.attempts, q.id);
  const solutionLocked = mode === 'revision' && !result;
  const ready = approach !== null && cx !== null && outs.every((o) => o.trim());
  const fullProgram = `${q.cpp}\n\n${q.main}`;
  const keyLineNums = q.keyLines.map((k) => findLine(q.cpp, k.match)).filter((n) => n > 0);

  const submit = () => {
    const checks = {
      approach: approach === approachMcq.answer,
      complexity: cx === cxMcq.answer,
      outputs: tests.map((t, i) => normalizeOutput(outs[i] ?? '') === normalizeOutput(t.out)),
    };
    setResult(checks);
    const seconds = Math.round((Date.now() - started.current) / 1000);
    recordAttempt({ questionId: q.id, checks, hintsUsed: hints, mode, seconds });
    const ok = checks.approach && checks.complexity && checks.outputs.every(Boolean);
    if (ok && mode === 'daily') completeDaily(today, q.id);
  };
  const retry = () => {
    setResult(null);
    setApproach(null);
    setCx(null);
    setOuts(['', '']);
    started.current = Date.now();
  };
  const allOk = result && result.approach && result.complexity && result.outputs.every(Boolean);

  return (
    <div className="stack lg">
      <Glass className="hero stack sm">
        <div className="row">
          <Link to={`/day/${q.day}`} className="chip">
            Day {q.day}
          </Link>
          <DifficultyChip d={q.difficulty} />
          {mode !== 'practice' && <span className="chip on">{mode === 'revision' ? 'Revision mode' : 'Daily challenge'}</span>}
          <span className={`chip ${st === 'solved' ? 'good' : st === 'needs-revision' ? 'warn' : ''}`}>{st.replace('-', ' ')}</span>
          <span className="tiny faint mono">{q.id}</span>
        </div>
        <h1>{q.title}</h1>
        <p className="muted small">Objective: {q.objective}</p>
      </Glass>

      <div className="grid c2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Glass className="pad stack">
            <h2>Problem</h2>
            <Rich text={q.statement} />
            <h4>Constraints</h4>
            <ul className="small rich">
              {q.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            {q.examples.map((e, i) => (
              <div key={i} className="glass tight stack sm">
                <div className="tiny muted">Example {i + 1}</div>
                <div className="mono small">Input: {e.input}</div>
                <div className="mono small">Output: {e.output}</div>
                {e.explanation && <div className="small muted">{e.explanation}</div>}
              </div>
            ))}
            <h4>Edge cases to consider</h4>
            <ul className="small rich">
              {q.edgeCases.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <div className="row" style={{ gap: 6 }}>
              {q.patterns.map((p) => (
                <Link key={p} className="chip" to={`/patterns/${p}`} title="Pattern tags — reveal them only if you want a hint">
                  {panel === 'solution' || result ? PATTERN_BY_ID[p]?.name : '❖ pattern (hidden)'}
                </Link>
              ))}
              {q.viz && (
                <Link className="chip info" to={`/lab/${q.viz}`}>
                  {LAB_META[q.viz].icon} {LAB_META[q.viz].title}
                </Link>
              )}
            </div>
          </Glass>
        </div>

        <div className="stack">
          <Tabs
            value={panel}
            onChange={(p) => {
              if (p === 'solution' && !solutionLocked) markSolutionViewed(q.id);
              setPanel(p);
            }}
            label="Practice panels"
            items={[
              { id: 'workspace', label: 'Workspace' },
              { id: 'hints', label: `Hints (${hints}/${q.hints.length})` },
              { id: 'solution', label: solutionLocked ? 'Solution 🔒' : 'Solution' },
              { id: 'history', label: `History (${rec?.attempts.length ?? 0})` },
            ]}
          />

          {panel === 'workspace' && (
            <Glass className="pad stack">
              <div className="feedback info small">
                <strong>How checking works:</strong> AlgoVerse does not compile your C++ in the browser. A question counts as solved when you pass three reasoning checks — the right approach, the optimal time complexity, and the exact output of real test inputs (the same tests the reference solution passes under g++). Write and run your code locally if you like; your draft is saved on this device.
              </div>
              <label className="field">
                Your solution draft (saved locally, not executed)
                <textarea className="input" rows={9} value={state.drafts[q.id] ?? ''} onChange={(e) => saveDraft(q.id, e.target.value)} placeholder={`// ${q.io}\n`} spellCheck={false} />
              </label>
              <div className="divider" />
              <div className="stack">
                <div>
                  <h4>1 · Which pattern is the core of an efficient solution?</h4>
                  <Choice name="Approach" options={approachMcq.options} value={approach} onChange={(i) => !result && setApproach(i)} result={result?.approach} />
                </div>
                <div>
                  <h4>2 · What time complexity does the optimal approach achieve?</h4>
                  <Choice name="Complexity" options={cxMcq.options} value={cx} onChange={(i) => !result && setCx(i)} result={result?.complexity} />
                </div>
                <div className="stack sm">
                  <h4>3 · Predict the exact output for these inputs</h4>
                  <div className="tiny muted">Format — {q.io}</div>
                  {tests.map((t, i) => (
                    <div key={i} className="grid c2">
                      <div>
                        <div className="tiny muted">stdin #{i + 1}</div>
                        <pre className="code mono small" style={{ margin: 0, padding: 10, maxHeight: 140 }}>{t.in}</pre>
                      </div>
                      <label className="field">
                        your stdout #{i + 1}
                        <textarea className={`input ${result ? (result.outputs[i] ? '' : '') : ''}`} rows={3} value={outs[i]} disabled={!!result} onChange={(e) => setOuts(outs.map((o, j) => (j === i ? e.target.value : o)))} style={{ minHeight: 60, borderColor: result ? (result.outputs[i] ? 'var(--tone-done)' : 'var(--tone-warn)') : undefined }} />
                        {result && !result.outputs[i] && <span className="tiny" style={{ color: 'var(--tone-warn)' }}>Expected: {t.out}</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {!result ? (
                <div className="row">
                  <button className="btn primary" disabled={!ready} onClick={submit}>
                    Check my reasoning
                  </button>
                  {!ready && <span className="tiny muted">Answer all three checks to submit.</span>}
                  {hints > 0 && <span className="chip">{hints} hint{hints > 1 ? 's' : ''} used</span>}
                </div>
              ) : (
                <div className={`feedback ${allOk ? 'good' : 'bad'} stack sm`} role="status">
                  <strong>{allOk ? 'All checks passed — marked as solved.' : 'Not all checks passed — this question is queued for revision.'}</strong>
                  <div className="small">
                    Approach {result.approach ? '✓' : '✗'} · Complexity {result.complexity ? '✓' : '✗'} · Outputs {result.outputs.filter(Boolean).length}/{result.outputs.length}
                  </div>
                  <div className="row">
                    {!allOk && (
                      <button className="btn sm" onClick={retry}>
                        Try again
                      </button>
                    )}
                    <button className="btn sm" onClick={() => setPanel('solution')}>
                      Read the solution
                    </button>
                  </div>
                </div>
              )}
              <div className="divider" />
              <div className="row">
                <button className="btn sm ghost" onClick={() => selfReport(q.id)} disabled={rec?.selfReported}>
                  {rec?.selfReported ? 'Self-reported ✓' : 'I solved and tested it locally'}
                </button>
                <button className="btn sm ghost" onClick={() => markNeedsRevision(q.id)}>
                  Add to revision
                </button>
              </div>
              <p className="tiny faint">Self-reports are recorded separately and count less toward mastery than verified checks.</p>
            </Glass>
          )}

          {panel === 'hints' && (
            <Glass className="pad stack">
              <p className="small muted">Hints are progressive. Each one reduces the XP for a first solve by 15% (minimum 40%) and is recorded as evidence for mastery.</p>
              {q.hints.slice(0, hints).map((h, i) => (
                <div key={i} className="feedback info">
                  <strong>Hint {i + 1}.</strong> <Rich text={h} />
                </div>
              ))}
              {q.cues.length > 0 && hints >= 1 && (
                <div className="small muted">
                  Recognition cues: {q.cues.join(' · ')}
                </div>
              )}
              <button className="btn" disabled={hints >= q.hints.length} onClick={() => setHints(hints + 1)}>
                {hints >= q.hints.length ? 'No more hints' : `Reveal hint ${hints + 1}`}
              </button>
            </Glass>
          )}

          {panel === 'solution' &&
            (solutionLocked ? (
              <Glass className="pad">
                <Empty icon="🔒" title="Solution hidden during revision">
                  Submit an attempt first — revision measures what you can do without the answer in front of you.
                </Empty>
              </Glass>
            ) : (
              <Glass className="pad stack">
                {q.brute && (
                  <div>
                    <h4>Brute force</h4>
                    <Rich text={q.brute} className="small" />
                  </div>
                )}
                <div>
                  <h4>Optimised approach</h4>
                  <Rich text={q.approach} className="small" />
                </div>
                <div>
                  <h4>Why it is correct</h4>
                  <Rich text={q.correctness} className="small" />
                </div>
                <div className="row">
                  <span className="chip info">Time {q.complexity.time}</span>
                  <span className="chip info">Space {q.complexity.space}</span>
                </div>
                <p className="small muted">{q.complexity.why}</p>
                <div className="row between">
                  <h4>C++17 reference</h4>
                  <button className="btn sm ghost" onClick={() => setShowFull(!showFull)}>
                    {showFull ? 'Show solution only' : 'Show full program with main()'}
                  </button>
                </div>
                <CodeBlock code={showFull ? fullProgram : q.cpp} keyLines={showFull ? [] : keyLineNums} title={showFull ? 'main.cpp — reads stdin' : 'solution'} />
                <div className="stack sm">
                  {q.keyLines.map((k, i) => (
                    <div key={i} className="small">
                      <code className="mono" style={{ color: 'var(--code-fn)' }}>{k.match}</code> — {k.note}
                    </div>
                  ))}
                </div>
                <div>
                  <h4>Common mistakes</h4>
                  <ul className="small rich">
                    {q.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Test cases (verified with g++)</h4>
                  <div className="scroll-x">
                    <table className="table mono">
                      <thead>
                        <tr>
                          <th>stdin</th>
                          <th>expected stdout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.tests.map((t, i) => (
                          <tr key={i}>
                            <td style={{ whiteSpace: 'pre' }}>{t.in}</td>
                            <td style={{ whiteSpace: 'pre' }}>{t.out}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {q.related?.length ? (
                  <div className="row" style={{ gap: 6 }}>
                    <span className="small muted">Related:</span>
                    {q.related.map((r) =>
                      QUESTION_BY_ID[r] ? (
                        <Link key={r} className="chip" to={`/questions/${r}`}>
                          {QUESTION_BY_ID[r].title}
                        </Link>
                      ) : null,
                    )}
                  </div>
                ) : null}
              </Glass>
            ))}

          {panel === 'history' && (
            <Glass className="pad stack">
              {!rec || (!rec.attempts.length && !rec.selfReported) ? (
                <Empty icon="⏱" title="No attempts yet" />
              ) : (
                <>
                  <div className="row small">
                    <span className="chip">evidence score {Math.round(questionScore(rec) * 100)}%</span>
                    {rec.firstCorrect !== undefined && <span className="chip">first attempt {rec.firstCorrect ? 'correct' : 'incorrect'}</span>}
                    {rec.lastCorrect !== undefined && <span className="chip">latest {rec.lastCorrect ? 'correct' : 'incorrect'}</span>}
                    {state.revision[q.id] && <span className="chip info">next review {state.revision[q.id].due}</span>}
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Mode</th>
                        <th>Result</th>
                        <th>Hints</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.attempts
                        .slice()
                        .reverse()
                        .map((a, i) => (
                          <tr key={i}>
                            <td className="small">{new Date(a.at).toLocaleString()}</td>
                            <td className="small">{a.mode}</td>
                            <td>{a.correct ? <span className="chip good">passed</span> : <span className="chip warn">failed</span>}</td>
                            <td>{a.hintsUsed}</td>
                            <td className="small">{a.seconds ? `${Math.round(a.seconds / 60)} min` : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </Glass>
          )}
        </div>
      </div>
    </div>
  );
}
