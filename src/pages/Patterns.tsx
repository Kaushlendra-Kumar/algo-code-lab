import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PATTERNS, QUESTION_META, questionsForPattern } from '../content';
import { PATTERN_FAMILIES } from '../content/patterns';
import { useProgress } from '../lib/progress/context';
import { patternMastery } from '../lib/progress/rules';
import { Bar, Empty, Glass } from '../components/ui';

export default function Patterns() {
  const { state } = useProgress();
  const [text, setText] = useState('');
  const [family, setFamily] = useState<string>('');
  const list = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    return PATTERNS.filter((p) => (!family || p.family === family) && words.every((w) => `${p.name} ${p.summary} ${p.cues.join(' ')} ${p.family}`.toLowerCase().includes(w)));
  }, [text, family]);

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Pattern library</div>
        <h1>{PATTERNS.length} reusable problem-solving patterns</h1>
        <p className="lead">Patterns are tools, not labels: many problems combine several. Each entry explains when the pattern applies, when it does not, the invariant that makes it correct, and links to C++ examples and practice.</p>
      </div>
      <Glass className="pad stack">
        <input className="input" placeholder="Search patterns, cues or keywords — e.g. “sorted”, “subarray”, “minimum steps”" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search patterns" />
        <div className="row" style={{ gap: 6 }}>
          <button className={`chip ${family === '' ? 'on' : ''}`} onClick={() => setFamily('')}>
            All families
          </button>
          {PATTERN_FAMILIES.map((f) => (
            <button key={f} className={`chip ${family === f ? 'on' : ''}`} onClick={() => setFamily(f)}>
              {f}
            </button>
          ))}
        </div>
      </Glass>
      {list.length === 0 ? (
        <Glass className="pad">
          <Empty icon="⌕" title="No patterns match">
            Try a broader word or clear the family filter.
          </Empty>
        </Glass>
      ) : (
        PATTERN_FAMILIES.filter((f) => list.some((p) => p.family === f)).map((f) => (
          <section key={f} className="stack">
            <h2>{f}</h2>
            <div className="grid auto">
              {list
                .filter((p) => p.family === f)
                .map((p) => {
                  const m = patternMastery(p.id, QUESTION_META, state.attempts, state.revision);
                  return (
                    <Link key={p.id} to={`/patterns/${p.id}`} className="glass pad interactive stack sm" style={{ textDecoration: 'none' }}>
                      <div className="row between nowrap">
                        <h3>{p.name}</h3>
                        {p.intro && <span className="chip intro">intro</span>}
                      </div>
                      <div className="small muted grow">{p.summary}</div>
                      <div className="row between tiny muted">
                        <span>{questionsForPattern(p.id).length} questions</span>
                        <span>{m.level}</span>
                      </div>
                      <Bar value={m.score} thin />
                    </Link>
                  );
                })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
