import { useRef, useState } from 'react';
import { useProgress } from '../lib/progress/context';
import { THEMES, unlockedThemes } from '../lib/progress/rules';
import { exportProgress, importProgress } from '../lib/progress/storage';
import { Glass, Switch } from '../components/ui';
import { QUESTIONS, DAYS, PATTERNS } from '../content';

export default function Settings() {
  const { state, updateSettings, replaceState, reset, storageMessage } = useProgress();
  const s = state.settings;
  const unlocked = unlockedThemes(state.xp);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const doExport = () => {
    const blob = new Blob([exportProgress(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algoverse-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Progress exported as a JSON file.' });
  };
  const doImport = async (file: File) => {
    const text = await file.text();
    const r = importProgress(text);
    if (r.ok) {
      replaceState(r.state);
      setMsg({ ok: true, text: `Imported progress: ${Object.keys(r.state.lessons).length} lessons, ${Object.keys(r.state.attempts).length} questions, ${r.state.xp} XP.` });
    } else setMsg({ ok: false, text: r.error });
  };

  return (
    <div className="stack lg">
      <div>
        <div className="eyebrow">Settings &amp; data</div>
        <h1>Make AlgoVerse yours</h1>
      </div>
      {storageMessage && <div className="banner">{storageMessage}</div>}
      <div className="grid c2" style={{ alignItems: 'start' }}>
        <Glass className="pad stack">
          <h2>Appearance</h2>
          <div className="stack sm">
            <div className="small muted">Theme (more unlock as you level up)</div>
            <div className="row">
              {THEMES.map((t) => {
                const ok = unlocked.includes(t.id);
                return (
                  <button key={t.id} className={`btn sm ${s.theme === t.id ? 'selected' : ''}`} disabled={!ok} onClick={() => updateSettings({ theme: t.id })} title={ok ? t.name : `Unlocks at level ${t.level}`}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})` }} />
                    {t.name}
                    {!ok && ` · Lv ${t.level}`}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="row between">
            <div>
              <div>Liquid glass effects</div>
              <div className="tiny muted">Turn off blur and floating light for better performance on older devices.</div>
            </div>
            <Switch checked={s.glass === 'full'} onChange={(v) => updateSettings({ glass: v ? 'full' : 'reduced' })} label="Liquid glass effects" />
          </div>
          <label className="field">
            Motion
            <select className="input" value={s.motion} onChange={(e) => updateSettings({ motion: e.target.value as typeof s.motion })}>
              <option value="system">Follow system setting</option>
              <option value="reduced">Reduce motion</option>
              <option value="full">Full motion</option>
            </select>
          </label>
        </Glass>
        <Glass className="pad stack">
          <h2>Learning</h2>
          <div className="row between">
            <div>
              <div>Streaks</div>
              <div className="tiny muted">A missed day is covered automatically by a streak freeze when you have one (earned every 7-day streak, max 2).</div>
            </div>
            <Switch checked={s.streaksEnabled} onChange={(v) => updateSettings({ streaksEnabled: v })} label="Enable streaks" />
          </div>
          <label className="field">
            Daily XP goal: {s.dailyGoal}
            <input type="range" min={20} max={300} step={10} value={s.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} />
          </label>
        </Glass>
        <Glass className="pad stack">
          <h2>Your data</h2>
          <p className="small muted">Progress is stored only in this browser (localStorage). Export it regularly to back it up or move it to another device. No account or server is involved.</p>
          <div className="row">
            <button className="btn primary" onClick={doExport}>
              Export progress (.json)
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              Import progress…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = '';
              }}
            />
          </div>
          {msg && <div className={`feedback ${msg.ok ? 'good' : 'bad'} small`}>{msg.text}</div>}
          <div className="divider" />
          {!confirmReset ? (
            <button className="btn bad" onClick={() => setConfirmReset(true)}>
              Reset all progress…
            </button>
          ) : (
            <div className="feedback bad stack sm">
              <span className="small">This permanently deletes your lessons, attempts, XP and settings from this browser. Export first if you might want them back.</span>
              <div className="row">
                <button className="btn bad" onClick={() => { reset(); setConfirmReset(false); setMsg({ ok: true, text: 'Progress reset.' }); }}>
                  Yes, reset everything
                </button>
                <button className="btn ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Glass>
        <Glass className="pad stack">
          <h2>About AlgoVerse</h2>
          <p className="small">
            Free, open-source (MIT) DSA learning platform by <strong>Kaushlendra Kumar</strong>. {DAYS.length} curriculum days, {QUESTIONS.length} practice questions and {PATTERNS.length} patterns, all bundled — works offline after the first load.
          </p>
          <h3>What is verified, and what is not</h3>
          <ul className="small rich">
            <li>Every C++ example and every question's reference solution is compiled with g++ (C++17, -Wall -Wextra -Werror, AddressSanitizer + UBSan) and checked against its expected output by the repository's <code>npm run verify:cpp</code> script.</li>
            <li>Synced code traces are scripted TypeScript mirrors of those C++ programs; automated tests assert that each trace prints the same output as the compiled program.</li>
            <li>Your own code is never compiled or executed in the browser. Practice checks validate reasoning (approach, complexity, output prediction), and self-reported solves are labelled as such.</li>
          </ul>
        </Glass>
      </div>
    </div>
  );
}
