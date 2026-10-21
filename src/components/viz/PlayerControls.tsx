import { useEffect, useRef } from 'react';
import type { Player } from './usePlayer';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

/** Transport controls. Keyboard: Space play/pause, ←/→ step, Home reset, End jump to end (when the player has focus within). */
export function PlayerControls({ p, label = 'Visualization' }: { p: Player; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.closest('[data-player-scope]') ?? ref.current;
    if (!el) return;
    const onKey = (e: Event) => {
      const k = e as KeyboardEvent;
      const tag = (k.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (k.key === ' ') {
        k.preventDefault();
        p.toggle();
      } else if (k.key === 'ArrowRight') {
        k.preventDefault();
        p.next();
      } else if (k.key === 'ArrowLeft') {
        k.preventDefault();
        p.prev();
      } else if (k.key === 'Home') p.reset();
      else if (k.key === 'End') p.end();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [p]);

  const disabled = p.length <= 1;
  return (
    <div className="player" ref={ref} role="group" aria-label={`${label} controls`}>
      <button className="btn icon" onClick={p.reset} disabled={disabled} aria-label="Reset" title="Reset (Home)">
        ⟲
      </button>
      <button className="btn icon" onClick={p.prev} disabled={p.index === 0} aria-label="Previous step" title="Back (←)">
        ‹
      </button>
      <button className="btn primary" onClick={p.toggle} disabled={disabled} aria-label={p.playing ? 'Pause' : 'Play'} title="Play / pause (Space)" style={{ minWidth: 88 }}>
        {p.playing ? '❚❚ Pause' : '▶ Play'}
      </button>
      <button className="btn icon" onClick={p.next} disabled={p.index >= p.length - 1} aria-label="Next step" title="Next (→)">
        ›
      </button>
      <input className="scrub" type="range" min={0} max={Math.max(0, p.length - 1)} value={p.index} onChange={(e) => p.seek(Number(e.target.value))} aria-label="Step" />
      <span className="counter" aria-live="off">
        {p.length ? p.index + 1 : 0}/{p.length}
      </span>
      <select className="input" style={{ width: 86, padding: '6px 26px 6px 10px' }} value={p.speed} onChange={(e) => p.setSpeed(Number(e.target.value))} aria-label="Speed">
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  );
}
