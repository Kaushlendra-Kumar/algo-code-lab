import type { DryRun } from '../types/content';
import type { Step } from '../lib/viz/types';

export function DryRunTable({ dry }: { dry: DryRun }) {
  return (
    <div className="scroll-x">
      <table className="table mono">
        <thead>
          <tr>
            {dry.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dry.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Build a dry-run table from trace steps: one row per step that changes a watched variable. */
export function dryRunFromSteps(steps: Step[], max = 24): DryRun {
  const cols: string[] = [];
  for (const s of steps) for (const k of Object.keys(s.vars ?? {})) if (!cols.includes(k)) cols.push(k);
  const rows: string[][] = [];
  let last = '';
  for (const s of steps) {
    const vals = cols.map((c) => (s.vars && c in s.vars ? String(s.vars[c]) : '·'));
    const sig = vals.join('|');
    if (sig === last) continue;
    last = sig;
    rows.push([String(rows.length + 1), ...vals, s.note]);
  }
  const trimmed = rows.length > max ? [...rows.slice(0, max - 1), ['…', ...cols.map(() => '…'), `${rows.length - max + 1} more steps — use the trace player`]] : rows;
  return { columns: ['#', ...cols, 'what happens'], rows: trimmed };
}
