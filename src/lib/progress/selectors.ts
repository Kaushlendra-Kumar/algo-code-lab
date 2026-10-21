import type { ProgressState, QuestionMeta } from './model';
import { lastNDays } from './date';
import { patternMastery, type PatternMastery } from './rules';

export function nextDay(s: Pick<ProgressState, 'lessons'>, total: number): number {
  for (let d = 1; d <= total; d++) if (!s.lessons[d]) return d;
  return total;
}

export function solvedIds(s: Pick<ProgressState, 'attempts'>): string[] {
  return Object.entries(s.attempts)
    .filter(([, r]) => r.attempts.some((a) => a.correct))
    .map(([id]) => id);
}

/** Accuracy over all verified attempts (null when there are none). */
export function accuracy(s: Pick<ProgressState, 'attempts'>): number | null {
  let total = 0;
  let ok = 0;
  for (const r of Object.values(s.attempts))
    for (const a of r.attempts) {
      total++;
      if (a.correct) ok++;
    }
  return total ? ok / total : null;
}

export function recentAttempts(s: Pick<ProgressState, 'attempts'>, n: number) {
  return Object.entries(s.attempts)
    .flatMap(([id, r]) => r.attempts.map((a) => ({ id, ...a })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, n);
}

export function weekly(s: Pick<ProgressState, 'activity'>, today: string, days = 7) {
  return lastNDays(today, days).map((d) => ({ day: d, ...(s.activity[d] ?? { xp: 0, solved: 0, attempted: 0, lessons: 0, reviews: 0, seconds: 0 }) }));
}

export function allMastery(patternIds: readonly string[], questions: readonly QuestionMeta[], s: Pick<ProgressState, 'attempts' | 'revision'>): PatternMastery[] {
  return patternIds.map((p) => patternMastery(p, questions, s.attempts, s.revision));
}
