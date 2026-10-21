import { useMemo, useState } from 'react';
import type { TraceId } from '../types/content';
import { TRACES } from '../lib/viz/traces';
import { markerLines } from '../content/cpp';
import { CodeBlock } from './CodeBlock';
import { VizRenderer } from './viz/VizRenderer';
import { usePlayer } from './viz/usePlayer';
import { PlayerControls } from './viz/PlayerControls';
import type { Step, VarValue } from '../lib/viz/types';

export function WatchPanel({ step, prev }: { step?: Step; prev?: Step }) {
  const vars = step?.vars ?? {};
  const entries = Object.entries(vars);
  if (!entries.length) return <div className="faint small">No variables to watch at this step.</div>;
  const fmt = (v: VarValue) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
  return (
    <div className="watch" aria-label="Variable watch">
      {entries.map(([k, v]) => {
        const changed = prev?.vars && k in prev.vars && prev.vars[k] !== v;
        return (
          <div key={k} className={`watch-item ${changed ? 'changed' : ''}`}>
            <div className="wk">{k}</div>
            <div className="wv">{fmt(v)}</div>
          </div>
        );
      })}
    </div>
  );
}

function parseField(type: 'int-array' | 'int' | 'string', raw: string): unknown {
  if (type === 'string') return raw.trim();
  if (type === 'int') {
    const n = Number(raw.trim());
    if (!Number.isInteger(n)) throw new Error('Enter a whole number');
    return n;
  }
  const parts = raw.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.some((x) => !Number.isInteger(x) || Math.abs(x) > 1e6)) throw new Error('Use whole numbers separated by commas');
  return parts;
}

/**
 * Code + visualization + variable watch, all driven by the same step index.
 * Labelled as a scripted educational trace: the steps are produced by a
 * TypeScript mirror of the C++ program, not by executing C++.
 */
export function TraceViewer({ id, editable = false, compact = false }: { id: TraceId; editable?: boolean; compact?: boolean }) {
  const def = TRACES[id];
  const [input, setInput] = useState<Record<string, unknown>>(def.defaultInput);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.fields.map((f) => [f.key, Array.isArray(def.defaultInput[f.key]) ? (def.defaultInput[f.key] as unknown[]).join(', ') : String(def.defaultInput[f.key])])),
  );
  const [error, setError] = useState<string | null>(null);
  const run = useMemo(() => def.run(input), [def, input]);
  const p = usePlayer(run.steps.length, { resetKey: run });
  const lines = useMemo(() => markerLines(def.code), [def.code]);
  const step = run.steps[p.index];
  const isDefault = input === def.defaultInput;

  const apply = () => {
    try {
      const next: Record<string, unknown> = { ...def.defaultInput };
      for (const f of def.fields) next[f.key] = parseField(f.type, drafts[f.key] ?? '');
      const err = def.validate?.(next) ?? null;
      if (err) throw new Error(err);
      setError(null);
      setInput(next);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="stack" data-player-scope tabIndex={-1}>
      <div className="row between">
        <div className="row">
          <span className="chip info" title="Steps come from a TypeScript mirror of this C++ program on the same input; your own code is not executed.">Scripted educational trace</span>
          <span className="muted small">{def.title}</span>
        </div>
        {editable && def.fields.length > 0 && (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            {def.fields.map((f) => (
              <label key={f.key} className="row nowrap small muted" style={{ gap: 6 }}>
                {f.label}
                <input className="input" style={{ width: f.type === 'int' ? 70 : 200, padding: '6px 10px' }} value={drafts[f.key] ?? ''} onChange={(e) => setDrafts({ ...drafts, [f.key]: e.target.value })} aria-label={f.label} />
              </label>
            ))}
            <button className="btn sm" type="submit">
              Run
            </button>
            {!isDefault && (
              <button
                className="btn sm ghost"
                type="button"
                onClick={() => {
                  setInput(def.defaultInput);
                  setDrafts(Object.fromEntries(def.fields.map((f) => [f.key, Array.isArray(def.defaultInput[f.key]) ? (def.defaultInput[f.key] as unknown[]).join(', ') : String(def.defaultInput[f.key])])));
                }}
              >
                Default
              </button>
            )}
          </form>
        )}
      </div>
      {error && <div className="feedback bad">{error}</div>}
      {!isDefault && <div className="banner">The trace now uses your input. The code panel still shows the sample values written in <code>main()</code>.</div>}
      <div className="grid c2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <CodeBlock code={def.code} activeLine={step?.line ? lines[step.line] : undefined} maxHeight={compact ? 380 : 520} />
        </div>
        <div className="stack">
          <div className="viz-stage" aria-live="polite">
            <VizRenderer state={step?.state} />
          </div>
          <div className="viz-note">
            <span className="step">#{p.index + 1}</span>
            <span>{step?.note}</span>
          </div>
          <WatchPanel step={step} prev={run.steps[p.index - 1]} />
        </div>
      </div>
      <PlayerControls p={p} label={def.title} />
      {p.index === run.steps.length - 1 && (
        <div className="feedback info small">
          Program output for this input: <code className="mono">{run.output.split('\n').join(' ⏎ ')}</code>
        </div>
      )}
    </div>
  );
}
