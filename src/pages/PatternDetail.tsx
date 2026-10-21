import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { EXAMPLES, PATTERN_BY_ID, QUESTION_META, questionsForPattern } from '../content';
import { useProgress } from '../lib/progress/context';
import { MASTERY_EXPLANATION, patternMastery } from '../lib/progress/rules';
import { Bar, DifficultyChip, Empty, Glass, Tabs } from '../components/ui';
import { CodeBlock } from '../components/CodeBlock';
import { ExampleView } from '../components/ExampleView';
import { statusOf } from '../lib/questions';
import { LAB_META } from './labMeta';

export default function PatternDetail() {
  const id = useParams().id ?? '';
  const p = PATTERN_BY_ID[id];
  const { state } = useProgress();
  const [lang, setLang] = useState<'cpp' | 'go'>('cpp');
  if (!p)
    return (
      <Glass className="pad">
        <Empty icon="❖" title="Pattern not found">
          <Link className="btn" to="/patterns">
            Back to patterns
          </Link>
        </Empty>
      </Glass>
    );
  const qs = questionsForPattern(p.id);
  const m = patternMastery(p.id, QUESTION_META, state.attempts, state.revision);
  const examples = p.examples.map((e) => ({ id: e, ...EXAMPLES[e] })).filter((e) => e.example);

  return (
    <div className="stack lg">
      <Glass className="hero stack sm">
        <div className="row">
          <span className="eyebrow">{p.family}</span>
          {p.intro && <span className="chip intro">Introduction</span>}
        </div>
        <h1>{p.name}</h1>
        <p className="lead">{p.summary}</p>
      </Glass>

      <div className="grid c3" style={{ alignItems: 'start' }}>
        <div className="stack span2">
          <div className="grid c2">
            <Glass className="pad stack sm">
              <h3>Recognition signals</h3>
              <ul className="small rich">
                {p.cues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Glass>
            <Glass className="pad stack sm">
              <h3>Invariant</h3>
              <p className="small">{p.invariant}</p>
              <h3 className="mt">Complexity</h3>
              <p className="small">{p.complexity}</p>
            </Glass>
            <Glass className="pad stack sm">
              <h3 style={{ color: 'var(--tone-done)' }}>Use it when</h3>
              <ul className="small rich">
                {p.useWhen.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Glass>
            <Glass className="pad stack sm">
              <h3 style={{ color: 'var(--tone-warn)' }}>Avoid it when</h3>
              <ul className="small rich">
                {p.avoidWhen.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Glass>
          </div>

          {(p.cpp || p.go) && (
            <Glass className="pad stack">
              <div className="row between">
                <h3>Reference snippet</h3>
                {p.go && p.cpp && <Tabs value={lang} onChange={setLang} label="Language" items={[{ id: 'cpp', label: 'C++' }, { id: 'go', label: 'Go (optional)' }]} />}
                {p.go && !p.cpp && <span className="chip">Go (optional)</span>}
              </div>
              <CodeBlock code={(lang === 'go' && p.go) || p.cpp || p.go || ''} lang={lang === 'go' && p.go ? 'go' : p.cpp ? 'cpp' : 'go'} />
              <p className="tiny faint">Snippets are compile-checked by the repository's verification script; complete runnable programs with verified output are in the linked curriculum examples.</p>
            </Glass>
          )}

          {examples.map((e) => (
            <Glass key={e.id} className="pad-lg">
              <ExampleView ex={e.example} label={`From Day ${e.day}`} />
            </Glass>
          ))}

          <Glass className="pad stack sm">
            <h3>Common mistakes</h3>
            <ul className="small rich">
              {p.mistakes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Glass>
        </div>

        <div className="stack sticky-side">
          <Glass className="pad stack sm">
            <h3>Your mastery</h3>
            <div className="row between small">
              <span>{m.level}</span>
              <span className="muted">{Math.round(m.score * 100)}%</span>
            </div>
            <Bar value={m.score} />
            <div className="tiny muted">
              {m.solved} solved · {m.independent} without hints · {m.revisionSuccesses} successful reviews
            </div>
            <details className="tiny muted">
              <summary>How is this calculated?</summary>
              <ul style={{ paddingLeft: 16 }}>
                {MASTERY_EXPLANATION.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </details>
          </Glass>
          {p.visualization && (
            <Link to={`/lab/${p.visualization}`} className="glass pad interactive stack sm" style={{ textDecoration: 'none' }}>
              <div className="eyebrow">Visualize</div>
              <strong>
                {LAB_META[p.visualization].icon} {LAB_META[p.visualization].title}
              </strong>
              <span className="small muted">{LAB_META[p.visualization].blurb}</span>
            </Link>
          )}
          <Glass className="pad stack sm">
            <h3>Related patterns</h3>
            <div className="row" style={{ gap: 6 }}>
              {p.related.map((r) => (
                <Link key={r} className="chip" to={`/patterns/${r}`}>
                  {PATTERN_BY_ID[r]?.name ?? r}
                </Link>
              ))}
            </div>
          </Glass>
          <Glass className="pad stack sm">
            <h3>Practice ({qs.length})</h3>
            {qs.length === 0 && <span className="small muted">No questions are tagged with this pattern yet.</span>}
            {qs.slice(0, 14).map((q) => (
              <Link key={q.id} to={`/questions/${q.id}`} className="list-item" style={{ padding: '6px 8px' }}>
                <span className={`status-dot ${statusOf(state.attempts, q.id)}`} />
                <span className="small grow">{q.title}</span>
                <DifficultyChip d={q.difficulty} />
              </Link>
            ))}
            {qs.length > 14 && (
              <Link className="small" to={`/questions?pattern=${p.id}`}>
                See all {qs.length} →
              </Link>
            )}
          </Glass>
        </div>
      </div>
    </div>
  );
}
