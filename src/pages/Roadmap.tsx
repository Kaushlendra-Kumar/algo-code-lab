import { Link } from 'react-router-dom';
import { useProgress } from '../lib/progress/context';
import { DAY_BY_NUMBER, TOTAL_DAYS, questionsForDay } from '../content';
import { nextDay } from '../lib/progress/selectors';
import { zoneOfDay } from '../content/zones';

const BLOCKS = [
  { from: 1, title: 'Foundations and Arrays' },
  { from: 6, title: 'Searching and Linear Structures' },
  { from: 11, title: 'Recursion and Combinatorial Search' },
  { from: 16, title: 'Trees and Intervals' },
  { from: 21, title: 'Graphs' },
  { from: 26, title: 'Dynamic Programming' },
  { from: 31, title: 'Greedy and Advanced Patterns' },
  { from: 36, title: 'Interview Integration' },
];

export default function Roadmap() {
  const { state } = useProgress();
  const current = nextDay(state, TOTAL_DAYS);
  const done = Object.keys(state.lessons).length;
  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">40-day roadmap</div>
        <h1>Your structured path through DSA</h1>
        <p className="lead">
          Revisit any day, skip what you already know, or jump back to prerequisites — progress is stored per day, so nothing breaks. {done}/{TOTAL_DAYS} lessons completed. Days marked <span className="chip intro">intro</span> introduce topics that take longer than one day to master: this roadmap is a structured starting point, not a promise of mastery in 40 days.
        </p>
      </div>
      {BLOCKS.map((b) => (
        <section key={b.from} className="stack">
          <h2>
            <span className="muted mono small">Days {b.from}–{b.from + 4} · </span>
            {b.title}
          </h2>
          <div className="day-grid">
            {Array.from({ length: 5 }, (_, i) => b.from + i).map((n) => {
              const d = DAY_BY_NUMBER[n];
              const qs = questionsForDay(n);
              const solved = qs.filter((q) => state.attempts[q.id]?.attempts.some((a) => a.correct)).length;
              const zone = zoneOfDay(n);
              return (
                <Link key={n} to={`/day/${n}`} className={`glass interactive day-card ${state.lessons[n] ? 'done' : ''} ${n === current ? 'current' : ''}`}>
                  <div className="row between">
                    <span className="day-num">DAY {String(n).padStart(2, '0')}</span>
                    {d?.advanced && <span className="chip intro">intro</span>}
                  </div>
                  <strong>{d?.title ?? 'Coming soon'}</strong>
                  <div className="tiny muted grow">{zone?.name}</div>
                  <div className="row between tiny muted">
                    <span>
                      {solved}/{qs.length} solved
                    </span>
                    {n === current && <span className="chip on">up next</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
