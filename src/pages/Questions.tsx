import { Link, useSearchParams } from 'react-router-dom';
import { useDeferredValue, useMemo } from 'react';
import { PATTERN_BY_ID, PATTERNS, QUESTIONS, ZONES } from '../content';
import { useProgress } from '../lib/progress/context';
import { filterQuestions, statusOf } from '../lib/questions';
import type { Difficulty } from '../types/content';
import { DifficultyChip, Empty, Glass } from '../components/ui';

const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const PAGE = 60;

export default function Questions() {
  const { state } = useProgress();
  const [params, setParams] = useSearchParams();
  const text = params.get('q') ?? '';
  const diffs = (params.get('d') ?? '').split(',').filter(Boolean) as Difficulty[];
  const pattern = params.get('pattern') ?? '';
  const topic = params.get('topic') ?? '';
  const day = Number(params.get('day')) || null;
  const status = (params.get('status') ?? 'any') as 'any' | 'unsolved' | 'solved' | 'attempted' | 'needs-revision' | 'new';
  const limit = Number(params.get('limit')) || PAGE;
  const deferredText = useDeferredValue(text);

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    p.delete('limit');
    setParams(p, { replace: true });
  };

  const list = useMemo(
    () => filterQuestions(QUESTIONS, { text: deferredText, difficulties: diffs, patterns: pattern ? [pattern] : [], topic: topic || undefined, day, status }, state.attempts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredText, params.get('d'), pattern, topic, day, status, state.attempts],
  );
  const solved = QUESTIONS.filter((q) => statusOf(state.attempts, q.id) === 'solved').length;
  const usedPatterns = useMemo(() => PATTERNS.filter((p) => QUESTIONS.some((q) => q.patterns.includes(p.id))), []);
  const filtersOn = !!(text || diffs.length || pattern || topic || day || status !== 'any');

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Question bank</div>
        <h1>{QUESTIONS.length} curated practice questions</h1>
        <p className="lead">
          {solved} solved. Every question has progressive hints, reasoning checks, real test cases and a C++17 reference solution that the repository compiles and tests with g++.
        </p>
      </div>
      <Glass className="pad stack">
        <input className="input" placeholder="Search by title, statement, pattern or id…" value={text} onChange={(e) => set('q', e.target.value)} aria-label="Search questions" />
        <div className="row">
          <div className="row" style={{ gap: 6 }}>
            {DIFFS.map((d) => (
              <button key={d} className={`chip ${diffs.includes(d) ? 'on' : d.toLowerCase()}`} aria-pressed={diffs.includes(d)} onClick={() => set('d', (diffs.includes(d) ? diffs.filter((x) => x !== d) : [...diffs, d]).join(','))}>
                {d}
              </button>
            ))}
          </div>
          <select className="input" style={{ width: 220 }} value={pattern} onChange={(e) => set('pattern', e.target.value)} aria-label="Pattern">
            <option value="">All patterns</option>
            {usedPatterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="input" style={{ width: 190 }} value={topic} onChange={(e) => set('topic', e.target.value)} aria-label="Topic">
            <option value="">All topics</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <select className="input" style={{ width: 120 }} value={day ?? ''} onChange={(e) => set('day', e.target.value)} aria-label="Curriculum day">
            <option value="">Any day</option>
            {Array.from({ length: 40 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
          <select className="input" style={{ width: 160 }} value={status} onChange={(e) => set('status', e.target.value === 'any' ? null : e.target.value)} aria-label="Status">
            <option value="any">Any status</option>
            <option value="unsolved">Not solved</option>
            <option value="solved">Solved</option>
            <option value="attempted">Attempted</option>
            <option value="needs-revision">Needs revision</option>
            <option value="new">New</option>
          </select>
          {filtersOn && (
            <button className="btn sm ghost" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          )}
        </div>
        <div className="small muted" aria-live="polite">
          {list.length} match{list.length === 1 ? '' : 'es'}
        </div>
      </Glass>
      <Glass className="pad">
        {list.length === 0 ? (
          <Empty icon="⌕" title="No questions match these filters">
            <button className="btn" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          </Empty>
        ) : (
          <div className="stack sm">
            {list.slice(0, limit).map((q) => {
              const st = statusOf(state.attempts, q.id);
              return (
                <Link key={q.id} to={`/questions/${q.id}`} className="list-item">
                  <span className={`status-dot ${st}`} title={st} />
                  <span className="mono tiny faint" style={{ width: 52 }}>
                    Day {q.day}
                  </span>
                  <div className="grow">
                    <div style={{ fontWeight: 650 }}>{q.title}</div>
                    <div className="tiny muted">{q.patterns.map((p) => PATTERN_BY_ID[p]?.name ?? p).join(' · ')}</div>
                  </div>
                  <DifficultyChip d={q.difficulty} />
                </Link>
              );
            })}
            {list.length > limit && (
              <button
                className="btn"
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set('limit', String(limit + PAGE));
                  setParams(p, { replace: true });
                }}
              >
                Show more ({list.length - limit} remaining)
              </button>
            )}
          </div>
        )}
      </Glass>
    </div>
  );
}
