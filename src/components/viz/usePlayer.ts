import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Step player driven by requestAnimationFrame. The algorithm has already
 * produced all steps; the player only chooses which index to show, so
 * rendering never re-runs algorithm logic.
 */
export function usePlayer(length: number, opts: { speed?: number; baseMs?: number; resetKey?: unknown } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(opts.speed ?? 1);
  const baseMs = opts.baseMs ?? 650;
  const acc = useRef(0);
  const last = useRef<number | null>(null);

  // Reset whenever a new run is loaded.
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [length, opts.resetKey]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (t: number) => {
      if (last.current === null) last.current = t;
      acc.current += t - last.current;
      last.current = t;
      const interval = baseMs / speed;
      if (acc.current >= interval) {
        const n = Math.floor(acc.current / interval);
        acc.current -= n * interval;
        setIndex((i) => {
          const next = Math.min(length - 1, i + n);
          if (next >= length - 1) setPlaying(false);
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
      acc.current = 0;
    };
  }, [playing, speed, length, baseMs]);

  const play = useCallback(() => {
    setIndex((i) => (i >= length - 1 ? 0 : i));
    setPlaying(true);
  }, [length]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(length - 1, i + 1));
  }, [length]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const end = useCallback(() => {
    setPlaying(false);
    setIndex(Math.max(0, length - 1));
  }, [length]);
  const seek = useCallback((i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(length - 1, i)));
  }, [length]);

  return { index, playing, speed, setSpeed, play, pause, toggle, next, prev, reset, end, seek, length };
}

export type Player = ReturnType<typeof usePlayer>;
