import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Route, Routes, useLocation, Link } from 'react-router-dom';
import { useProgress } from './lib/progress/context';
import { currentStreak, dueReviews, levelFromXp } from './lib/progress/rules';
import { PATTERN_BY_ID, QUESTION_BY_ID } from './content';
import { LAB_META } from './pages/labMeta';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const World = lazy(() => import('./pages/World'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const DayPage = lazy(() => import('./pages/DayPage'));
const Patterns = lazy(() => import('./pages/Patterns'));
const PatternDetail = lazy(() => import('./pages/PatternDetail'));
const LabHub = lazy(() => import('./pages/LabHub'));
const LabPage = lazy(() => import('./pages/LabPage'));
const Questions = lazy(() => import('./pages/Questions'));
const Practice = lazy(() => import('./pages/Practice'));
const Daily = lazy(() => import('./pages/Daily'));
const Revision = lazy(() => import('./pages/Revision'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const NAV: { section: string; items: { to: string; label: string; ico: string; end?: boolean }[] }[] = [
  {
    section: 'Learn',
    items: [
      { to: '/', label: 'Dashboard', ico: '⌂', end: true },
      { to: '/world', label: 'Learning World', ico: '◍' },
      { to: '/roadmap', label: '40-Day Roadmap', ico: '☰' },
      { to: '/patterns', label: 'Pattern Library', ico: '❖' },
    ],
  },
  {
    section: 'Explore',
    items: [{ to: '/lab', label: 'Visualization Lab', ico: '⚗' }],
  },
  {
    section: 'Practice',
    items: [
      { to: '/questions', label: 'Question Bank', ico: '⌘' },
      { to: '/daily', label: 'Daily Challenge', ico: '☀' },
      { to: '/revision', label: 'Revision Center', ico: '↻' },
    ],
  },
  {
    section: 'You',
    items: [
      { to: '/progress', label: 'Progress', ico: '◔' },
      { to: '/settings', label: 'Settings & Data', ico: '⚙' },
    ],
  },
];

const CRUMB_NAMES: Record<string, string> = {
  world: 'Learning World',
  roadmap: 'Roadmap',
  day: 'Roadmap',
  patterns: 'Patterns',
  lab: 'Visualization Lab',
  questions: 'Question Bank',
  daily: 'Daily Challenge',
  revision: 'Revision',
  progress: 'Progress',
  settings: 'Settings',
};

function crumbLabel(section: string, id: string): string {
  if (section === 'day') return `Day ${id}`;
  if (section === 'lab') return LAB_META[id as keyof typeof LAB_META]?.title ?? id;
  if (section === 'questions') return QUESTION_BY_ID[id]?.title ?? id;
  if (section === 'patterns') return PATTERN_BY_ID[id]?.name ?? id;
  return id;
}

function Crumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return <span>Dashboard</span>;
  const first = parts[0];
  const base = first === 'day' ? '/roadmap' : `/${first}`;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span>›</span>
      <Link to={base}>{CRUMB_NAMES[first] ?? first}</Link>
      {parts[1] && (
        <>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{crumbLabel(first, decodeURIComponent(parts[1]))}</span>
        </>
      )}
    </nav>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useProgress();
  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="glass toast" role="status" onClick={() => dismissToast(t.id)}>
          <div style={{ fontWeight: 700 }} className={t.title.startsWith('+') ? 'xp-burst' : ''}>
            {t.title}
          </div>
          {t.body && <div className="small muted">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}

export function Loading() {
  return (
    <div className="empty" role="status">
      <div className="big">◌</div>
      <div className="small">Loading…</div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { state, today } = useProgress();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  const lv = levelFromXp(state.xp);
  const streak = currentStreak(state, today);
  const due = dueReviews(state.revision, today).length;

  return (
    <>
      <a href="#main" className="skip-link btn">
        Skip to content
      </a>
      <div className="ambient" aria-hidden>
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="grain" />
      </div>
      <div className="shell">
        {open && <div className="scrim" onClick={() => setOpen(false)} />}
        <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
          <div className="glass">
            <Link to="/" className="brand">
              <span className="brand-mark">A</span>
              <span>
                <div className="brand-name">AlgoVerse</div>
                <div className="brand-sub">DSA learning lab</div>
              </span>
            </Link>
            <nav className="nav">
              {NAV.map((sec) => (
                <div key={sec.section}>
                  <div className="nav-section">{sec.section}</div>
                  {sec.items.map((it) => (
                    <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <span className="ico" aria-hidden>
                        {it.ico}
                      </span>
                      {it.label}
                      {it.to === '/revision' && due > 0 && <span className="count">{due}</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-foot">
              Free &amp; open source · MIT
              <br />
              Built by Kaushlendra Kumar
            </div>
          </div>
        </aside>
        <main className="main" id="main">
          <header className="glass topbar">
            <button className="btn icon menu-btn" onClick={() => setOpen(true)} aria-label="Open navigation">
              ☰
            </button>
            <Crumbs />
            <div className="stats">
              {state.settings.streaksEnabled && (
                <span className="pill-stat" title="Current streak">
                  🔥 {streak}
                  <span className="hide-sm muted"> day{streak === 1 ? '' : 's'}</span>
                </span>
              )}
              <Link to="/progress" className="pill-stat" style={{ textDecoration: 'none' }} title={`${state.xp} XP total`}>
                ⬡ Lv {lv.level}
                <span className="hide-sm" style={{ width: 70 }}>
                  <span className="bar thin" style={{ display: 'block' }}>
                    <span style={{ width: `${lv.progress * 100}%` }} />
                  </span>
                </span>
                <span className="hide-sm muted">{state.xp} XP</span>
              </Link>
            </div>
          </header>
          <div className="page" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <Shell>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/world" element={<World />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/day/:n" element={<DayPage />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/patterns/:id" element={<PatternDetail />} />
          <Route path="/lab" element={<LabHub />} />
          <Route path="/lab/:lab" element={<LabPage />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<Practice />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}
