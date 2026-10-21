import { Link } from 'react-router-dom';
import { useProgress } from '../lib/progress/context';
import { DAY_BY_NUMBER, TOTAL_DAYS, ZONES } from '../content';
import { nextDay } from '../lib/progress/selectors';
import { Bar, Glass } from '../components/ui';

export default function World() {
  const { state } = useProgress();
  const current = nextDay(state, TOTAL_DAYS);
  // A zone is "unlocked" once the roadmap reaches it (or any of its days is done).
  // Locked zones stay open for previewing — nothing is hard-gated.
  const info = ZONES.map((z) => {
    const done = z.days.filter((d) => state.lessons[d]).length;
    const unlocked = done > 0 || Math.min(...z.days) <= current + 1;
    return { z, done, unlocked, complete: done === z.days.length };
  });
  const ordered = [...info].sort((a, b) => Math.min(...a.z.days) - Math.min(...b.z.days));
  const pathD = ordered.map(({ z }, i) => `${i ? 'L' : 'M'} ${z.x} ${z.y * 0.86}`).join(' ');

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Learning world</div>
        <h1>Explore the {ZONES.length} zones</h1>
        <p className="lead">Each island groups the curriculum days for one family of ideas. Glowing islands are complete; dimmed islands are ahead of you on the roadmap but can still be previewed.</p>
      </div>
      <Glass className="world hide-mobile">
        <svg viewBox="0 0 100 86" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="route" x1="0" x2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.7" />
              <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d={pathD} fill="none" stroke="url(#route)" strokeWidth="0.35" strokeDasharray="1.2 1" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
        </svg>
        {info.map(({ z, done, unlocked, complete }) => (
          <Link
            key={z.id}
            to={`/day/${z.days.find((d) => !state.lessons[d]) ?? z.days[0]}`}
            className={`island ${unlocked ? '' : 'locked'} ${complete ? 'complete' : ''}`}
            style={{ left: `${z.x}%`, top: `${z.y}%`, ['--zc' as string]: z.color }}
            aria-label={`${z.name}: ${done} of ${z.days.length} days complete${unlocked ? '' : ' (ahead — preview)'}`}
          >
            <span className="island-orb">{complete ? '★' : unlocked ? `${done}/${z.days.length}` : '🔒'}</span>
            <span className="island-name">{z.name}</span>
            <span className="island-meta">Days {z.days.join(', ')}</span>
          </Link>
        ))}
      </Glass>
      <div className="grid auto">
        {info.map(({ z, done, unlocked, complete }) => (
          <Glass key={z.id} className="pad stack" style={{ borderColor: complete ? z.color : undefined }}>
            <div className="row nowrap">
              <span style={{ width: 14, height: 14, borderRadius: 99, background: z.color, boxShadow: `0 0 14px ${z.color}`, flexShrink: 0 }} />
              <h3 className="grow">{z.name}</h3>
              {complete ? <span className="chip good">complete</span> : !unlocked && <span className="chip">ahead</span>}
            </div>
            <div className="small muted">{z.tagline}</div>
            <Bar value={done / z.days.length} thin />
            <div className="stack sm">
              {z.days.map((d) => (
                <Link key={d} to={`/day/${d}`} className="list-item" style={{ padding: '6px 10px' }}>
                  <span className={`status-dot ${state.lessons[d] ? 'solved' : ''}`} />
                  <span className="small grow">
                    Day {d}: {DAY_BY_NUMBER[d]?.title ?? 'Coming soon'}
                  </span>
                  {DAY_BY_NUMBER[d]?.advanced && <span className="chip intro">intro</span>}
                </Link>
              ))}
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );
}
