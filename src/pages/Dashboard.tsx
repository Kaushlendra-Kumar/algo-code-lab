import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useProgress } from '../lib/progress/context';
import { DAY_BY_NUMBER, PATTERN_BY_ID, PATTERNS, QUESTION_BY_ID, QUESTION_META, QUESTIONS, TOTAL_DAYS, ZONES } from '../content';
import { accuracy, allMastery, nextDay, recentAttempts, solvedIds, weekly } from '../lib/progress/selectors';
import { currentStreak, dueReviews, levelFromXp } from '../lib/progress/rules';
import { pickDaily } from '../lib/questions';
import { Bar, DifficultyChip, Glass, Ring, Stat } from '../components/ui';
import { WeekChart } from '../components/WeekChart';
import { zoneOfDay } from '../content/zones';

export default function Dashboard() {
  const { state, today } = useProgress();
  const current = nextDay(state, TOTAL_DAYS);
  const day = DAY_BY_NUMBER[current];
  const done = Object.keys(state.lessons).length;
  const lv = levelFromXp(state.xp);
  const solved = solvedIds(state).length;
  const acc = accuracy(state);
  const streak = currentStreak(state, today);
  const due = dueReviews(state.revision, today);
  const daily = useMemo(() => pickDaily(today, QUESTIONS, state), [today, state]);
  const dailyDone = state.daily[today]?.completed;
  const week = weekly(state, today);
  const recent = recentAttempts(state, 6);
  const mastery = useMemo(
    () => allMastery(PATTERNS.map((p) => p.id), QUESTION_META, state).filter((m) => m.attempted > 0).sort((a, b) => b.score - a.score),
    [state],
  );
  const todayXp = state.activity[today]?.xp ?? 0;
  const zone = zoneOfDay(current);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="stack lg">
      <Glass className="hero">
        <div className="grid c2" style={{ alignItems: 'center' }}>
          <div className="stack">
            <div className="eyebrow">{greet} · Day {current} of {TOTAL_DAYS}</div>
            <h1>
              {done === 0 ? (
                <>
                  Start your <span className="grad-text">DSA journey</span>
                </>
              ) : done >= TOTAL_DAYS ? (
                <>
                  Roadmap <span className="grad-text">complete</span> — keep revising
                </>
              ) : (
                <>
                  Continue with <span className="grad-text">{day?.title ?? `Day ${current}`}</span>
                </>
              )}
            </h1>
            <p className="lead">
              {day ? day.objectives[0] : 'Pick any day from the roadmap.'}
              {zone && <span className="muted"> · {zone.name}</span>}
            </p>
            <div className="row">
              <Link className="btn primary" to={`/day/${current}`}>
                {done === 0 ? 'Start Day 1' : 'Continue learning'} →
              </Link>
              <Link className="btn" to="/lab">
                Open Visualization Lab
              </Link>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 28 }}>
            <Ring value={done / TOTAL_DAYS} size={140} stroke={12} label={`${done} of ${TOTAL_DAYS} lessons`}>
              <div style={{ fontSize: 28 }}>{done}</div>
              <div className="tiny muted">/ {TOTAL_DAYS} days</div>
            </Ring>
            <Ring value={lv.progress} size={110} stroke={10} label={`Level ${lv.level}`}>
              <div style={{ fontSize: 22 }}>Lv {lv.level}</div>
              <div className="tiny muted">{state.xp} XP</div>
            </Ring>
          </div>
        </div>
      </Glass>

      <div className="grid c4">
        <Glass className="pad kpi">
          <div className="ico">🔥</div>
          <Stat value={state.settings.streaksEnabled ? streak : '—'} label={state.settings.streaksEnabled ? `day streak · ${state.streak.freezes} freeze${state.streak.freezes === 1 ? '' : 's'}` : 'streaks disabled'} />
        </Glass>
        <Glass className="pad kpi">
          <div className="ico">✓</div>
          <Stat value={`${solved}`} label={`of ${QUESTIONS.length} questions solved`} />
        </Glass>
        <Glass className="pad kpi">
          <div className="ico">◎</div>
          <Stat value={acc === null ? '—' : `${Math.round(acc * 100)}%`} label="check accuracy" />
        </Glass>
        <Glass className="pad kpi">
          <div className="ico">↻</div>
          <Stat value={due.length} label="reviews due today" />
        </Glass>
      </div>

      <div className="grid c3">
        <Glass className="pad stack span2">
          <div className="row between">
            <h2>Today's plan</h2>
            <span className="muted small">
              {todayXp} / {state.settings.dailyGoal} XP goal
            </span>
          </div>
          <Bar value={todayXp / state.settings.dailyGoal} label="Daily XP goal" />
          <div className="stack sm">
            <Link to={`/day/${current}`} className="list-item">
              <span className={`status-dot ${state.lessons[current] ? 'solved' : ''}`} />
              <div className="grow">
                <div style={{ fontWeight: 650 }}>Lesson · Day {current}: {day?.title}</div>
                <div className="small muted">Read, step through the C++ examples, take the quiz</div>
              </div>
              <span className="chip">+50 XP</span>
            </Link>
            {daily && (
              <Link to="/daily" className="list-item">
                <span className={`status-dot ${dailyDone ? 'solved' : ''}`} />
                <div className="grow">
                  <div style={{ fontWeight: 650 }}>Daily challenge · {daily.title}</div>
                  <div className="small muted">
                    Day {daily.day} · {PATTERN_BY_ID[daily.patterns[0]]?.name}
                  </div>
                </div>
                <DifficultyChip d={daily.difficulty} />
              </Link>
            )}
            <Link to="/revision" className="list-item">
              <span className={`status-dot ${due.length ? 'needs-revision' : 'solved'}`} />
              <div className="grow">
                <div style={{ fontWeight: 650 }}>Revision queue</div>
                <div className="small muted">{due.length ? `${due.length} question${due.length > 1 ? 's' : ''} due for spaced review` : 'Nothing due — great!'}</div>
              </div>
            </Link>
          </div>
        </Glass>
        <Glass className="pad stack">
          <h2>This week</h2>
          <WeekChart data={week} />
          <div className="small muted">
            {week.reduce((s, d) => s + d.solved, 0)} solved · {week.reduce((s, d) => s + d.lessons, 0)} lessons · {week.reduce((s, d) => s + d.reviews, 0)} reviews
          </div>
        </Glass>
      </div>

      <div className="grid c2">
        <Glass className="pad stack">
          <div className="row between">
            <h2>Pattern mastery</h2>
            <Link to="/progress" className="btn sm ghost">
              Details →
            </Link>
          </div>
          {mastery.length === 0 ? (
            <p className="muted small">Mastery appears after you attempt practice questions. Quizzes alone never mark a pattern as mastered.</p>
          ) : (
            <div className="stack sm">
              {mastery.slice(0, 7).map((m) => (
                <Link key={m.pattern} to={`/patterns/${m.pattern}`} className="list-item" style={{ padding: '6px 10px' }}>
                  <div className="grow">
                    <div className="row between small">
                      <span>{PATTERN_BY_ID[m.pattern]?.name}</span>
                      <span className="muted">{m.level}</span>
                    </div>
                    <Bar value={m.score} thin />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Glass>
        <Glass className="pad stack">
          <h2>Recent attempts</h2>
          {recent.length === 0 ? (
            <p className="muted small">
              No attempts yet. Open the <Link to="/questions">question bank</Link> and pass the checks on a question.
            </p>
          ) : (
            <div className="stack sm">
              {recent.map((a, i) => {
                const q = QUESTION_BY_ID[a.id];
                return (
                  <Link key={i} to={`/questions/${a.id}`} className="list-item" style={{ padding: '7px 10px' }}>
                    <span className={`status-dot ${a.correct ? 'solved' : 'needs-revision'}`} />
                    <div className="grow small">
                      {q?.title ?? a.id}
                      <span className="muted"> · {a.mode}</span>
                    </div>
                    <span className="tiny faint">{new Date(a.at).toLocaleDateString()}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Glass>
      </div>

      <Glass className="pad stack">
        <div className="row between">
          <h2>Learning zones</h2>
          <Link to="/world" className="btn sm ghost">
            Open world map →
          </Link>
        </div>
        <div className="grid auto-sm">
          {ZONES.map((z) => {
            const completed = z.days.filter((d) => state.lessons[d]).length;
            return (
              <Link key={z.id} to={`/day/${z.days.find((d) => !state.lessons[d]) ?? z.days[0]}`} className="glass tight interactive" style={{ textDecoration: 'none' }}>
                <div className="row nowrap">
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: z.color, boxShadow: `0 0 10px ${z.color}` }} />
                  <strong className="small">{z.name}</strong>
                </div>
                <div className="tiny muted" style={{ margin: '4px 0 8px' }}>
                  {z.tagline}
                </div>
                <Bar value={completed / z.days.length} thin />
              </Link>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}
