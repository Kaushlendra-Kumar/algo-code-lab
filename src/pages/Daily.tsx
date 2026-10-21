import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProgress } from '../lib/progress/context';
import { DAY_BY_NUMBER, PATTERN_BY_ID, QUESTIONS } from '../content';
import { pickDaily } from '../lib/questions';
import { DifficultyChip, Empty, Glass, Rich } from '../components/ui';
import { McqCard } from '../components/Quiz';
import { hashString } from '../lib/rng';
import { addDays } from '../lib/progress/date';

export default function Daily() {
  const { state, today, answerQuiz } = useProgress();
  const q = useMemo(() => pickDaily(today, QUESTIONS, state), [today, state.lessons]); // eslint-disable-line react-hooks/exhaustive-deps
  const record = state.daily[today];
  const sourceDay = q ? DAY_BY_NUMBER[q.day] : undefined;
  const quiz = sourceDay ? sourceDay.quiz[hashString(today) % sourceDay.quiz.length] : undefined;
  const history = Array.from({ length: 14 }, (_, i) => addDays(today, -13 + i));
  const completedCount = Object.values(state.daily).filter((d) => d.completed).length;

  if (!q)
    return (
      <Glass className="pad">
        <Empty icon="☀" title="No challenge available" />
      </Glass>
    );

  return (
    <div className="stack lg">
      <Glass className="hero stack sm">
        <div className="eyebrow">Daily challenge · {today}</div>
        <h1>{q.title}</h1>
        <div className="row">
          <DifficultyChip d={q.difficulty} />
          <span className="chip">Day {q.day}</span>
          <span className="chip">{PATTERN_BY_ID[q.patterns[0]]?.family}</span>
          {record?.completed ? <span className="chip good">Completed today ✓ +40 XP</span> : <span className="chip">+40 XP bonus</span>}
        </div>
        <p className="small muted">The challenge is chosen deterministically from today's date and your progress (unsolved questions near your current roadmap day, easier ones first). It works fully offline.</p>
      </Glass>
      <div className="grid c3" style={{ alignItems: 'start' }}>
        <Glass className="pad stack span2">
          <h2>Today's problem</h2>
          <Rich text={q.statement} />
          <div className="row">
            <Link className="btn primary" to={`/questions/${q.id}?mode=daily`}>
              {record?.completed ? 'Review the problem' : 'Solve it now'} →
            </Link>
          </div>
          {quiz && (
            <>
              <div className="divider" />
              <h3>Warm-up question from Day {q.day}</h3>
              <McqCard q={quiz} onAnswer={(ok) => answerQuiz(`daily:${today}`, ok)} previouslyCorrect={state.quiz[`daily:${today}`]?.correct} />
            </>
          )}
        </Glass>
        <Glass className="pad stack">
          <h3>Last 14 days</h3>
          <div className="heat" role="img" aria-label="Daily challenge completion over the last 14 days">
            {history.map((d) => (
              <i key={d} title={`${d}: ${state.daily[d]?.completed ? 'completed' : 'not completed'}`} style={state.daily[d]?.completed ? { background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' } : undefined} />
            ))}
          </div>
          <div className="small muted">{completedCount} daily challenges completed in total.</div>
        </Glass>
      </div>
    </div>
  );
}
