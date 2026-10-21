import { parseDay } from '../lib/progress/date';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Bar chart of XP per day from stored activity only (never synthetic data). */
export function WeekChart({ data, metric = 'xp' }: { data: { day: string; xp: number; solved: number }[]; metric?: 'xp' | 'solved' }) {
  const vals = data.map((d) => d[metric]);
  const max = Math.max(1, ...vals);
  const W = 100;
  const H = 42;
  const bw = W / data.length;
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="viz-svg" viewBox={`0 0 ${W} ${H + 8}`} role="img" aria-label={`${metric === 'xp' ? 'XP' : 'Questions solved'} per day: ${data.map((d) => `${d.day} ${d[metric]}`).join(', ')}`}>
        <defs>
          <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <line x1="0" x2={W} y1={H} y2={H} stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
        {data.map((d, i) => {
          const h = (d[metric] / max) * (H - 8);
          return (
            <g key={d.day}>
              <rect x={i * bw + bw * 0.2} y={H - h} width={bw * 0.6} height={Math.max(h, 0.4)} rx="1.4" fill={d[metric] ? 'url(#wk)' : 'rgba(255,255,255,0.08)'}>
                <title>
                  {d.day}: {d[metric]} {metric}
                </title>
              </rect>
              {d[metric] > 0 && (
                <text x={i * bw + bw / 2} y={H - h - 1.5} fontSize="2.6" fill="var(--text-2)" textAnchor="middle">
                  {d[metric]}
                </text>
              )}
              <text x={i * bw + bw / 2} y={H + 5} fontSize="2.6" fill="var(--faint)" textAnchor="middle">
                {DOW[parseDay(d.day).getDay()]}
              </text>
            </g>
          );
        })}
      </svg>
      {total === 0 && <figcaption className="tiny faint center">No activity recorded in this period yet.</figcaption>}
    </figure>
  );
}
