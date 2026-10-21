import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useProgress } from '../lib/progress/context';
import { DAY_BY_NUMBER, PATTERN_BY_ID, TOTAL_DAYS, questionsForDay } from '../content';
import { zoneOfDay } from '../content/zones';
import { DifficultyChip, Empty, Glass, Rich, Tabs } from '../components/ui';
import { ExampleView } from '../components/ExampleView';
import { McqCard } from '../components/Quiz';
import { statusOf } from '../lib/questions';
import { LAB_META } from './labMeta';

type Tab = 'lesson' | 'examples' | 'practice' | 'review';

export default function DayPage() {
  const n = Number(useParams().n);
  const d = DAY_BY_NUMBER[n];
  const { state, completeLesson, uncompleteLesson, answerQuiz } = useProgress();
  const [tab, setTab] = useState<Tab>('lesson');
  if (!d) {
    return (
      <Glass className="pad">
        <Empty icon="🗺" title={`Day ${n || '?'} is not available`}>
          <Link className="btn" to="/roadmap">
            Back to the roadmap
          </Link>
        </Empty>
      </Glass>
    );
  }
  const zone = zoneOfDay(n);
  const qs = questionsForDay(n);
  const done = !!state.lessons[n];
  const quizCorrect = d.quiz.filter((_, i) => state.quiz[`d${n}:${i}`]?.correct).length;

  return (
    <div className="stack lg">
      <Glass className="hero">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="stack sm" style={{ maxWidth: 760 }}>
            <div className="row">
              <span className="eyebrow">Day {n} of {TOTAL_DAYS}</span>
              {zone && (
                <Link to="/world" className="chip" style={{ borderColor: zone.color }}>
                  {zone.name}
                </Link>
              )}
              {d.advanced && <span className="chip intro">Introduction — expect to revisit</span>}
              {done && <span className="chip good">Completed ✓</span>}
            </div>
            <h1>{d.title}</h1>
            <div className="row" style={{ gap: 6 }}>
              {d.patterns.map((p) => (
                <Link key={p} className="chip" to={`/patterns/${p}`}>
                  {PATTERN_BY_ID[p]?.name ?? p}
                </Link>
              ))}
            </div>
          </div>
          <div className="row">
            {n > 1 && (
              <Link className="btn sm" to={`/day/${n - 1}`} aria-label="Previous day">
                ‹ Day {n - 1}
              </Link>
            )}
            {n < TOTAL_DAYS && (
              <Link className="btn sm" to={`/day/${n + 1}`} aria-label="Next day">
                Day {n + 1} ›
              </Link>
            )}
          </div>
        </div>
      </Glass>

      <Tabs
        value={tab}
        onChange={setTab}
        label="Day sections"
        items={[
          { id: 'lesson', label: '1 · Lesson' },
          { id: 'examples', label: '2 · C++ examples' },
          { id: 'practice', label: `3 · Practice (${qs.length})` },
          { id: 'review', label: `4 · Quiz & recap (${quizCorrect}/${d.quiz.length})` },
        ]}
      />

      {tab === 'lesson' && (
        <div className="grid c3" style={{ alignItems: 'start' }}>
          <div className="stack span2">
            {d.lesson.map((s, i) => (
              <Glass key={i} className="pad-lg stack sm" as="section">
                <h2>{s.heading}</h2>
                <Rich text={s.body} />
              </Glass>
            ))}
            <Glass className="pad-lg stack sm" as="section">
              <h2>Recognising the pattern</h2>
              <ul className="rich">
                {d.recognition.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Glass>
            <div className="row">
              <button className="btn primary" onClick={() => setTab('examples')}>
                Continue to C++ examples →
              </button>
            </div>
          </div>
          <div className="stack sticky-side">
            <Glass className="pad stack sm">
              <h3>Objectives</h3>
              <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                {d.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Glass>
            <Glass className="pad stack sm">
              <h3>Prerequisites</h3>
              <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                {d.prerequisites.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
              {n > 1 && (
                <Link className="small" to={`/day/${n - 1}`}>
                  Review Day {n - 1}
                </Link>
              )}
            </Glass>
            <Glass className="pad stack sm">
              <h3>Visual labs</h3>
              {d.visualizations.map((v) => (
                <Link key={v} to={`/lab/${v}`} className="list-item" style={{ padding: '7px 10px' }}>
                  <span>{LAB_META[v]?.icon}</span>
                  <span className="small grow">{LAB_META[v]?.title}</span>
                  <span className="faint">→</span>
                </Link>
              ))}
            </Glass>
          </div>
        </div>
      )}

      {tab === 'examples' && (
        <div className="stack lg">
          <Glass className="pad-lg">
            <ExampleView ex={d.exampleA} label="Example A · core concept" />
          </Glass>
          <Glass className="pad-lg">
            <ExampleView ex={d.exampleB} label="Example B" />
          </Glass>
          <Glass className="pad stack sm">
            <h3>Complexity in today's code</h3>
            <Rich text={d.complexityNotes} className="small" />
          </Glass>
          {d.optimize && (
            <Glass className="pad stack">
              <div className="eyebrow">Optimize</div>
              <McqCard q={d.optimize} onAnswer={(ok) => answerQuiz(`d${n}:opt`, ok)} previouslyCorrect={state.quiz[`d${n}:opt`]?.correct} />
            </Glass>
          )}
          <div className="row">
            <button className="btn primary" onClick={() => setTab('practice')}>
              Continue to practice →
            </button>
          </div>
        </div>
      )}

      {tab === 'practice' && (
        <Glass className="pad stack">
          <div className="row between">
            <h2>Practice questions</h2>
            <Link className="btn sm" to={`/questions?day=${n}`}>
              Open in question bank
            </Link>
          </div>
          <p className="small muted">Each question has progressive hints, an approach and complexity check, output prediction on real test cases, and a verified C++ reference solution.</p>
          <div className="stack sm">
            {qs.map((q) => {
              const st = statusOf(state.attempts, q.id);
              return (
                <Link key={q.id} to={`/questions/${q.id}`} className="list-item">
                  <span className={`status-dot ${st}`} title={st} />
                  <div className="grow">
                    <div style={{ fontWeight: 650 }}>{q.title}</div>
                    <div className="tiny muted">{q.patterns.map((p) => PATTERN_BY_ID[p]?.name ?? p).join(' · ')}</div>
                  </div>
                  <DifficultyChip d={q.difficulty} />
                </Link>
              );
            })}
          </div>
        </Glass>
      )}

      {tab === 'review' && (
        <div className="grid c3" style={{ alignItems: 'start' }}>
          <Glass className="pad stack lg span2">
            <h2>Review quiz</h2>
            {d.quiz.map((q, i) => (
              <McqCard key={i} q={q} index={i} onAnswer={(ok) => answerQuiz(`d${n}:${i}`, ok)} previouslyCorrect={state.quiz[`d${n}:${i}`]?.correct} />
            ))}
          </Glass>
          <div className="stack sticky-side">
            <Glass className="pad stack sm">
              <h3>Recap</h3>
              <Rich text={d.recap} className="small" />
            </Glass>
            <Glass className="pad stack sm">
              <h3>Prepare for tomorrow</h3>
              <Rich text={d.nextPrep} className="small" />
            </Glass>
            <Glass className="pad stack sm">
              {done ? (
                <>
                  <div className="feedback good small">Lesson completed on {new Date(state.lessons[n].completedAt).toLocaleDateString()}.</div>
                  <button className="btn sm ghost" onClick={() => uncompleteLesson(n)}>
                    Mark as not completed
                  </button>
                </>
              ) : (
                <button className="btn primary" onClick={() => completeLesson(n)}>
                  Mark Day {n} complete (+50 XP)
                </button>
              )}
              {n < TOTAL_DAYS && (
                <Link className="btn" to={`/day/${n + 1}`}>
                  Go to Day {n + 1} →
                </Link>
              )}
            </Glass>
          </div>
        </div>
      )}
    </div>
  );
}
