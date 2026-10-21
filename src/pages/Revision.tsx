import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProgress } from '../lib/progress/context';
import { PATTERN_BY_ID, PATTERNS, QUESTION_BY_ID, QUESTION_META, questionsForPattern } from '../content';
import { SRS_INTERVALS, dueReviews } from '../lib/progress/rules';
import { allMastery } from '../lib/progress/selectors';
import { Bar, DifficultyChip, Empty, Glass } from '../components/ui';
import { diffDays } from '../lib/progress/date';
import { statusOf } from '../lib/questions';

export default function Revision() {
  const { state, today } = useProgress();
  const due = dueReviews(state.revision, today).filter((id) => QUESTION_BY_ID[id]);
  const upcoming = Object.entries(state.revision)
    .filter(([id, r]) => QUESTION_BY_ID[id] && diffDays(today, r.due) > 0)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .slice(0, 12);
  const wrong = Object.entries(state.attempts)
    .filter(([id, r]) => QUESTION_BY_ID[id] && r.attempts.length && !r.lastCorrect)
    .map(([id]) => id);
  const weak = useMemo(
    () =>
      allMastery(PATTERNS.map((p) => p.id), QUESTION_META, state)
        .filter((m) => m.attempted > 0 && m.score < 0.55)
        .sort((a, b) => a.score - b.score)
        .slice(0, 6),
    [state],
  );
  const improved = Object.entries(state.attempts).filter(([, r]) => r.firstCorrect === false && r.lastCorrect === true).length;
  const regressed = Object.entries(state.attempts).filter(([, r]) => r.firstCorrect === true && r.lastCorrect === false).length;

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Revision center</div>
        <h1>Spaced revision</h1>
        <p className="lead">
          Every checked attempt schedules the next review: correct answers move a question to a longer interval ({SRS_INTERVALS.join(' → ')} days); a mistake brings it back tomorrow. In revision mode the solution stays hidden until you submit.
        </p>
      </div>
      <div className="grid c3">
        <Glass className="pad stack sm">
          <div className="stat">
            <div className="v">{due.length}</div>
            <div className="k">due now</div>
          </div>
        </Glass>
        <Glass className="pad stack sm">
          <div className="stat">
            <div className="v" style={{ color: 'var(--tone-done)' }}>{improved}</div>
            <div className="k">questions fixed after an initial mistake (first ✗ → latest ✓)</div>
          </div>
        </Glass>
        <Glass className="pad stack sm">
          <div className="stat">
            <div className="v" style={{ color: 'var(--tone-warn)' }}>{regressed}</div>
            <div className="k">questions that slipped (first ✓ → latest ✗)</div>
          </div>
        </Glass>
      </div>
      <div className="grid c2" style={{ alignItems: 'start' }}>
        <Glass className="pad stack">
          <h2>Due for review</h2>
          {due.length === 0 ? (
            <Empty icon="✓" title="Nothing due">
              Solve questions to start building your review schedule.
            </Empty>
          ) : (
            due.map((id) => {
              const q = QUESTION_BY_ID[id];
              const r = state.revision[id];
              return (
                <Link key={id} to={`/questions/${id}?mode=revision`} className="list-item">
                  <span className={`status-dot ${statusOf(state.attempts, id)}`} />
                  <div className="grow">
                    <div style={{ fontWeight: 650 }}>{q.title}</div>
                    <div className="tiny muted">
                      box {r.box + 1}/{SRS_INTERVALS.length} · due {r.due} · {r.history.filter((h) => h.correct).length}/{r.history.length} reviews passed
                    </div>
                  </div>
                  <DifficultyChip d={q.difficulty} />
                </Link>
              );
            })
          )}
          {upcoming.length > 0 && (
            <>
              <h3 className="mt">Coming up</h3>
              {upcoming.map(([id, r]) => (
                <div key={id} className="row between small" style={{ padding: '4px 6px' }}>
                  <Link to={`/questions/${id}`}>{QUESTION_BY_ID[id].title}</Link>
                  <span className="muted">{r.due}</span>
                </div>
              ))}
            </>
          )}
        </Glass>
        <div className="stack">
          <Glass className="pad stack">
            <h2>Previously incorrect</h2>
            {wrong.length === 0 ? (
              <p className="small muted">No questions whose latest attempt failed.</p>
            ) : (
              wrong.slice(0, 15).map((id) => (
                <Link key={id} to={`/questions/${id}?mode=revision`} className="list-item" style={{ padding: '7px 10px' }}>
                  <span className="status-dot needs-revision" />
                  <span className="small grow">{QUESTION_BY_ID[id].title}</span>
                  <DifficultyChip d={QUESTION_BY_ID[id].difficulty} />
                </Link>
              ))
            )}
          </Glass>
          <Glass className="pad stack">
            <h2>Weak patterns</h2>
            {weak.length === 0 ? (
              <p className="small muted">No weak patterns detected yet — they appear once you have attempted questions.</p>
            ) : (
              weak.map((m) => {
                const next = questionsForPattern(m.pattern).find((q) => statusOf(state.attempts, q.id) !== 'solved');
                return (
                  <div key={m.pattern} className="stack sm">
                    <div className="row between small">
                      <Link to={`/patterns/${m.pattern}`}>{PATTERN_BY_ID[m.pattern]?.name}</Link>
                      <span className="muted">{m.level}</span>
                    </div>
                    <Bar value={m.score} thin />
                    {next && (
                      <Link className="tiny" to={`/questions/${next.id}`}>
                        Review quest: {next.title} →
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </Glass>
        </div>
      </div>
    </div>
  );
}
