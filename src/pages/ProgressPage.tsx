import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useProgress } from '../lib/progress/context';
import { PATTERN_BY_ID, PATTERNS, QUESTION_META, QUESTIONS, TOTAL_DAYS } from '../content';
import { THEMES, MASTERY_EXPLANATION, currentStreak, levelFromXp, longestStreak, xpForLevel } from '../lib/progress/rules';
import { accuracy, allMastery, solvedIds, weekly } from '../lib/progress/selectors';
import { ACHIEVEMENTS } from '../lib/progress/achievements';
import { Bar, Glass, Ring, Stat, Tabs } from '../components/ui';
import { WeekChart } from '../components/WeekChart';
import { lastNDays } from '../lib/progress/date';

export default function ProgressPage() {
  const { state, today } = useProgress();
  const [metric, setMetric] = useState<'xp' | 'solved'>('xp');
  const lv = levelFromXp(state.xp);
  const solved = solvedIds(state);
  const acc = accuracy(state);
  const mastery = useMemo(() => allMastery(PATTERNS.map((p) => p.id), QUESTION_META, state).filter((m) => m.available > 0), [state]);
  const byDiff = (['Easy', 'Medium', 'Hard'] as const).map((d) => ({ d, total: QUESTIONS.filter((q) => q.difficulty === d).length, solved: QUESTIONS.filter((q) => q.difficulty === d && solved.includes(q.id)).length }));
  const week = weekly(state, today, 7);
  const weekTotals = week.reduce((s, d) => ({ xp: s.xp + d.xp, solved: s.solved + d.solved, attempted: s.attempted + d.attempted, lessons: s.lessons + d.lessons, reviews: s.reviews + d.reviews, seconds: s.seconds + d.seconds }), { xp: 0, solved: 0, attempted: 0, lessons: 0, reviews: 0, seconds: 0 });
  const days84 = lastNDays(today, 84);
  const maxXp = Math.max(1, ...days84.map((d) => state.activity[d]?.xp ?? 0));

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Progress</div>
        <h1>Your learning record</h1>
        <p className="lead">Everything here is computed from activity stored in this browser — nothing is estimated or invented.</p>
      </div>
      <div className="grid c4">
        <Glass className="pad row nowrap">
          <Ring value={lv.progress} size={80} stroke={8}>
            <div style={{ fontSize: 18 }}>{lv.level}</div>
          </Ring>
          <Stat value={`${state.xp} XP`} label={`${xpForLevel(lv.level + 1) - state.xp} XP to level ${lv.level + 1}`} />
        </Glass>
        <Glass className="pad">
          <Stat value={`${Object.keys(state.lessons).length}/${TOTAL_DAYS}`} label="lessons completed" />
        </Glass>
        <Glass className="pad">
          <Stat value={`${solved.length}/${QUESTIONS.length}`} label={`solved · accuracy ${acc === null ? '—' : `${Math.round(acc * 100)}%`}`} />
        </Glass>
        <Glass className="pad">
          <Stat value={state.settings.streaksEnabled ? `${currentStreak(state, today)} / ${longestStreak(state)}` : 'off'} label="current / longest streak" />
        </Glass>
      </div>

      <div className="grid c3" style={{ alignItems: 'start' }}>
        <Glass className="pad stack span2">
          <div className="row between">
            <h2>Weekly summary</h2>
            <Tabs value={metric} onChange={setMetric} label="Metric" items={[{ id: 'xp', label: 'XP' }, { id: 'solved', label: 'Solved' }]} />
          </div>
          <WeekChart data={week} metric={metric} />
          <p className="small muted">
            Last 7 days: {weekTotals.xp} XP, {weekTotals.lessons} lessons, {weekTotals.solved} new solves from {weekTotals.attempted} checked attempts, {weekTotals.reviews} spaced reviews, {Math.round(weekTotals.seconds / 60)} minutes of timed practice.
          </p>
          <h3>Last 12 weeks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }} role="img" aria-label="Activity heatmap for the last 84 days">
            {Array.from({ length: 12 }, (_, w) => (
              <div key={w} style={{ display: 'grid', gap: 4 }}>
                {days84.slice(w * 7, w * 7 + 7).map((d) => {
                  const x = state.activity[d]?.xp ?? 0;
                  return <i key={d} title={`${d}: ${x} XP`} style={{ display: 'block', aspectRatio: '1', borderRadius: 4, background: x ? `color-mix(in srgb, var(--accent) ${20 + (x / maxXp) * 80}%, transparent)` : 'rgba(255,255,255,0.05)' }} />;
                })}
              </div>
            ))}
          </div>
        </Glass>
        <Glass className="pad stack">
          <h2>By difficulty</h2>
          {byDiff.map((b) => (
            <div key={b.d} className="stack sm">
              <div className="row between small">
                <span>{b.d}</span>
                <span className="muted">
                  {b.solved}/{b.total}
                </span>
              </div>
              <Bar value={b.total ? b.solved / b.total : 0} thin />
            </div>
          ))}
          <h3 className="mt">Themes</h3>
          <div className="stack sm">
            {THEMES.map((t) => (
              <div key={t.id} className="row between small">
                <span>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 4, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, marginRight: 8 }} />
                  {t.name}
                </span>
                <span className={lv.level >= t.level ? 'chip good' : 'chip'}>{lv.level >= t.level ? 'unlocked' : `level ${t.level}`}</span>
              </div>
            ))}
            <Link className="tiny" to="/settings">
              Change theme in Settings →
            </Link>
          </div>
        </Glass>
      </div>

      <Glass className="pad stack">
        <h2>Pattern mastery</h2>
        <details className="small muted">
          <summary>How mastery is calculated</summary>
          <ul>
            {MASTERY_EXPLANATION.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </details>
        <div className="grid auto">
          {mastery.map((m) => (
            <Link key={m.pattern} to={`/patterns/${m.pattern}`} className="glass tight interactive stack sm" style={{ textDecoration: 'none' }}>
              <div className="row between small nowrap">
                <strong>{PATTERN_BY_ID[m.pattern]?.name}</strong>
                <span className={m.level === 'Mastered' ? 'chip good' : 'chip'}>{m.level}</span>
              </div>
              <Bar value={m.score} thin />
              <div className="tiny muted">
                {m.solved}/{m.available} solved · {m.independent} unassisted · {m.revisionSuccesses} reviews
              </div>
            </Link>
          ))}
        </div>
      </Glass>

      <Glass className="pad stack">
        <h2>
          Achievements ({Object.keys(state.achievements).length}/{ACHIEVEMENTS.length})
        </h2>
        <div className="grid auto">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`ach ${state.achievements[a.id] ? 'won' : ''}`}>
              <span className="medal" aria-hidden>
                {a.icon}
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>{a.name}</div>
                <div className="tiny muted">{a.description}</div>
                <div className="tiny faint">{state.achievements[a.id] ? `Unlocked ${new Date(state.achievements[a.id]).toLocaleDateString()}` : `+${a.xp} XP`}</div>
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
}
