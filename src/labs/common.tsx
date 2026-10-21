import type { ReactNode } from 'react';
import type { Step } from '../lib/viz/types';
import { usePlayer } from '../components/viz/usePlayer';
import { PlayerControls } from '../components/viz/PlayerControls';
import { VizRenderer } from '../components/viz/VizRenderer';
import { WatchPanel } from '../components/TraceViewer';
import { Glass } from '../components/ui';

/** Standard "stage + narration + watch + controls" block for a precomputed run. */
export function StepView({ steps, title, footer, height }: { steps: Step[]; title?: string; footer?: ReactNode; height?: number }) {
  const p = usePlayer(steps.length, { resetKey: steps });
  const step = steps[p.index];
  return (
    <div className="stack" data-player-scope tabIndex={-1}>
      <div className="viz-stage" style={height ? { minHeight: height } : undefined} aria-live="polite">
        <VizRenderer state={step?.state} />
      </div>
      <div className="viz-note">
        <span className="step">#{p.index + 1}</span>
        <span>{step?.note ?? 'No steps'}</span>
      </div>
      {step?.vars && Object.keys(step.vars).length > 0 && <WatchPanel step={step} prev={steps[p.index - 1]} />}
      <PlayerControls p={p} label={title} />
      {footer}
    </div>
  );
}

export function LabHeader({ title, icon, children }: { title: string; icon: string; children?: ReactNode }) {
  return (
    <Glass className="hero stack sm">
      <div className="eyebrow">Visualization lab</div>
      <h1>
        <span aria-hidden>{icon}</span> {title}
      </h1>
      {children && <div className="lead">{children}</div>}
    </Glass>
  );
}

export function parseInts(raw: string, max = 40): number[] | string {
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) return 'Enter at least one number.';
  if (parts.length > max) return `Use at most ${max} values.`;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n))) return 'Only whole numbers are allowed.';
  if (nums.some((n) => Math.abs(n) > 999)) return 'Keep values between −999 and 999 so bars stay readable.';
  return nums;
}
