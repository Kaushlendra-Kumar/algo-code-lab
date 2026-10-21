// Pure rules for XP, levels, mastery, spaced repetition and streaks.
// Kept free of React and storage so they can be unit-tested directly.
import type { AttemptEntry, ProgressState, QuestionMeta, QuestionRecord, SrsRecord } from './model';
import { addDays, diffDays } from './date';

// ------------------------------------------------------------------ XP & levels

export const XP = {
  lesson: 50,
  quizCorrect: 10,
  solve: { Easy: 30, Medium: 50, Hard: 80 } as const,
  selfReport: 10,
  revision: 15,
  daily: 40,
  exercise: 15,
  hintPenalty: 0.15,
  minSolveFactor: 0.4,
};

export function solveXp(difficulty: 'Easy' | 'Medium' | 'Hard', hintsUsed: number): number {
  const factor = Math.max(XP.minSolveFactor, 1 - XP.hintPenalty * hintsUsed);
  return Math.round(XP.solve[difficulty] * factor);
}

/** Total XP needed to reach `level` (level 1 needs 0). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): { level: number; current: number; next: number; progress: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current, next, progress: (xp - current) / (next - current) };
}

export const THEMES = [
  { id: 'aurora', name: 'Aurora', level: 1, accent: '#7c9cff', accent2: '#c084fc' },
  { id: 'ocean', name: 'Deep Ocean', level: 3, accent: '#38bdf8', accent2: '#22d3ee' },
  { id: 'ember', name: 'Ember', level: 5, accent: '#fb923c', accent2: '#f472b6' },
  { id: 'mint', name: 'Mint Circuit', level: 8, accent: '#34d399', accent2: '#a3e635' },
  { id: 'nebula', name: 'Nebula', level: 12, accent: '#e879f9', accent2: '#818cf8' },
] as const;

export function unlockedThemes(xp: number) {
  const { level } = levelFromXp(xp);
  return THEMES.filter((t) => t.level <= level).map((t) => t.id as string);
}

/**
 * Grant XP once per unique key. Returns the same state object when the key was
 * already rewarded, which prevents farming by replaying completed content.
 */
export function grantXp(s: ProgressState, key: string, amount: number, reason: string, now: Date, today: string): ProgressState {
  if (amount <= 0 || s.xpLog.some((e) => e.key === key)) return s;
  const day = s.activity[today] ?? { xp: 0, solved: 0, attempted: 0, lessons: 0, reviews: 0, seconds: 0 };
  return {
    ...s,
    xp: s.xp + amount,
    xpLog: [...s.xpLog, { key, amount, at: now.toISOString(), reason }],
    activity: { ...s.activity, [today]: { ...day, xp: day.xp + amount } },
  };
}

// ------------------------------------------------------------------ attempt scoring

/**
 * Evidence score of one question in [0, 1]:
 *  - the best correct attempt scores 1.0, minus 0.15 per hint used (floor 0.4),
 *  - minus 0.1 for each failed attempt before the first success (floor 0.3),
 *  - attempts that never succeeded score 0,
 *  - self-reported solves (not checked) count for 0.3.
 */
export function questionScore(rec: QuestionRecord | undefined): number {
  if (!rec) return 0;
  let best = 0;
  let failuresBefore = 0;
  for (const a of rec.attempts) {
    if (!a.correct) {
      if (best === 0) failuresBefore++;
      continue;
    }
    const hintFactor = Math.max(0.4, 1 - 0.15 * a.hintsUsed);
    const retryFactor = best === 0 ? Math.max(0.3, 1 - 0.1 * failuresBefore) : 1;
    best = Math.max(best, Math.min(hintFactor, retryFactor));
  }
  if (rec.solutionViewed && best > 0.6) best = Math.max(0.6, best - 0.2);
  if (best === 0 && rec.selfReported) best = 0.3;
  return Math.round(best * 100) / 100;
}

export function isCorrect(checks: AttemptEntry['checks']): boolean {
  return checks.approach && checks.complexity && checks.outputs.length > 0 && checks.outputs.every(Boolean);
}

// ------------------------------------------------------------------ mastery

export type MasteryLevel = 'Unstarted' | 'Novice' | 'Apprentice' | 'Practitioner' | 'Proficient' | 'Mastered';

export interface PatternMastery {
  pattern: string;
  score: number;
  level: MasteryLevel;
  attempted: number;
  solved: number;
  independent: number;
  revisionSuccesses: number;
  available: number;
}

export const MASTERY_EXPLANATION = [
  'Only practice questions count — lesson quizzes never raise mastery on their own.',
  'Each question contributes its best evidence score: 1.0 for an independent verified solve, less when hints or several failed tries were needed, 0 if never solved.',
  'Pattern score = average evidence over attempted questions × a coverage factor that reaches 100% after 4 solved questions.',
  'Successful spaced-revision reviews add up to +0.1.',
  '"Mastered" additionally requires at least 4 solves, 2 of them without hints, and one successful spaced review.',
];

export function patternMastery(
  pattern: string,
  questions: readonly QuestionMeta[],
  attempts: ProgressState['attempts'],
  revision: ProgressState['revision'],
): PatternMastery {
  const tagged = questions.filter((q) => q.patterns.includes(pattern));
  let sum = 0;
  let attempted = 0;
  let solved = 0;
  let independent = 0;
  let revisionSuccesses = 0;
  for (const q of tagged) {
    const rec = attempts[q.id];
    if (!rec || (rec.attempts.length === 0 && !rec.selfReported)) continue;
    attempted++;
    const sc = questionScore(rec);
    sum += sc;
    if (rec.attempts.some((a) => a.correct)) solved++;
    if (rec.attempts.some((a) => a.correct && a.hintsUsed === 0)) independent++;
    revisionSuccesses += (revision[q.id]?.history ?? []).filter((h) => h.correct).length;
  }
  if (attempted === 0) {
    return { pattern, score: 0, level: 'Unstarted', attempted, solved, independent, revisionSuccesses, available: tagged.length };
  }
  const coverage = Math.min(1, solved / 4);
  const bonus = Math.min(0.1, revisionSuccesses * 0.05);
  const score = Math.min(1, (sum / attempted) * (0.4 + 0.6 * coverage) + bonus);
  let level: MasteryLevel;
  if (score < 0.3) level = 'Novice';
  else if (score < 0.55) level = 'Apprentice';
  else if (score < 0.75) level = 'Practitioner';
  else level = 'Proficient';
  if (score >= 0.9 && solved >= 4 && independent >= 2 && revisionSuccesses >= 1) level = 'Mastered';
  return { pattern, score: Math.round(score * 100) / 100, level, attempted, solved, independent, revisionSuccesses, available: tagged.length };
}

// ------------------------------------------------------------------ spaced repetition (Leitner boxes)

export const SRS_INTERVALS = [1, 3, 7, 14, 30];

export function scheduleReview(prev: SrsRecord | undefined, correct: boolean, hintsUsed: number, today: string): SrsRecord {
  let box: number;
  if (!prev) {
    box = correct ? (hintsUsed === 0 ? 1 : 0) : 0;
  } else if (correct) {
    box = Math.min(prev.box + (hintsUsed === 0 ? 1 : 0), SRS_INTERVALS.length - 1);
  } else {
    box = 0;
  }
  return {
    box,
    due: addDays(today, SRS_INTERVALS[box]),
    lastReview: today,
    history: prev ? [...prev.history, { at: today, correct }] : [],
  };
}

export function dueReviews(revision: ProgressState['revision'], today: string): string[] {
  return Object.entries(revision)
    .filter(([, r]) => diffDays(r.due, today) >= 0)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

// ------------------------------------------------------------------ streaks

/** Days that count toward a streak: any day with XP or completed work, plus frozen days. */
export function activeDays(s: Pick<ProgressState, 'activity' | 'streak'>): Set<string> {
  const set = new Set(s.streak.frozen);
  for (const [d, a] of Object.entries(s.activity)) if (a.xp > 0 || a.solved > 0 || a.lessons > 0 || a.reviews > 0) set.add(d);
  return set;
}

/**
 * Current streak ending today, or ending yesterday if today has no activity yet
 * (a learner is not "behind" until the day is over).
 */
export function currentStreak(s: Pick<ProgressState, 'activity' | 'streak'>, today: string): number {
  const days = activeDays(s);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(s: Pick<ProgressState, 'activity' | 'streak'>): number {
  const days = [...activeDays(s)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diffDays(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/**
 * Called when the learner is active on `today`. A single missed day (yesterday)
 * is covered automatically by a streak freeze if one is available. A freeze is
 * earned at every 7-day milestone (max 2 banked).
 */
export function applyStreakRules(s: ProgressState, today: string): ProgressState {
  let streak = s.streak;
  const days = activeDays(s);
  const yesterday = addDays(today, -1);
  const before = addDays(today, -2);
  if (!days.has(yesterday) && days.has(before) && streak.freezes > 0) {
    streak = { ...streak, freezes: streak.freezes - 1, frozen: [...streak.frozen, yesterday] };
  }
  const withToday = { activity: s.activity, streak };
  const len = currentStreak(withToday, today);
  if (len > 0 && len % 7 === 0 && !streak.earnedAt.includes(today) && streak.freezes < 2) {
    streak = { ...streak, freezes: streak.freezes + 1, earnedAt: [...streak.earnedAt, today] };
  }
  return streak === s.streak ? s : { ...s, streak };
}
