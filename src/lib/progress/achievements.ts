import type { ProgressState } from './model';
import type { Ctx } from './actions';
import { currentStreak, grantXp } from './rules';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  test: (s: ProgressState, ctx: Ctx) => boolean;
}

const solvedCount = (s: ProgressState) => Object.values(s.attempts).filter((r) => r.attempts.some((a) => a.correct)).length;
const independentCount = (s: ProgressState) =>
  Object.values(s.attempts).filter((r) => r.attempts.some((a) => a.correct && a.hintsUsed === 0)).length;
const reviewSuccesses = (s: ProgressState) =>
  Object.values(s.revision).reduce((n, r) => n + r.history.filter((h) => h.correct).length, 0);
const hardSolved = (s: ProgressState, ctx: Ctx) =>
  ctx.questions.filter((q) => q.difficulty === 'Hard' && s.attempts[q.id]?.attempts.some((a) => a.correct)).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: '◆', xp: 20, test: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'week-one', name: 'Week One', description: 'Complete 7 curriculum lessons.', icon: '❖', xp: 50, test: (s) => Object.keys(s.lessons).length >= 7 },
  { id: 'halfway', name: 'Halfway There', description: 'Complete 20 curriculum lessons.', icon: '◐', xp: 100, test: (s) => Object.keys(s.lessons).length >= 20 },
  { id: 'graduate', name: 'Roadmap Graduate', description: 'Complete all 40 lessons.', icon: '★', xp: 300, test: (s, c) => Object.keys(s.lessons).length >= c.totalDays },
  { id: 'first-solve', name: 'Hello, Accepted Reasoning', description: 'Pass every check on a practice question.', icon: '✓', xp: 20, test: (s) => solvedCount(s) >= 1 },
  { id: 'ten-solves', name: 'Pattern Spotter', description: 'Solve 10 practice questions.', icon: '⬡', xp: 60, test: (s) => solvedCount(s) >= 10 },
  { id: 'fifty-solves', name: 'Problem Crusher', description: 'Solve 50 practice questions.', icon: '⬢', xp: 150, test: (s) => solvedCount(s) >= 50 },
  { id: 'century', name: 'Century', description: 'Solve 100 practice questions.', icon: '💯', xp: 300, test: (s) => solvedCount(s) >= 100 },
  { id: 'no-hints', name: 'Unassisted', description: 'Solve 5 questions without using a hint.', icon: '◎', xp: 60, test: (s) => independentCount(s) >= 5 },
  { id: 'hard-three', name: 'Hard Mode', description: 'Solve 3 Hard questions.', icon: '▲', xp: 100, test: (s, c) => hardSolved(s, c) >= 3 },
  { id: 'reviewer', name: 'Spaced Out', description: 'Pass 10 spaced-revision reviews.', icon: '↻', xp: 80, test: (s) => reviewSuccesses(s) >= 10 },
  { id: 'streak-3', name: 'Warming Up', description: 'Reach a 3-day streak.', icon: '🔥', xp: 30, test: (s, c) => s.settings.streaksEnabled && currentStreak(s, c.today) >= 3 },
  { id: 'streak-7', name: 'Consistent', description: 'Reach a 7-day streak.', icon: '☄', xp: 70, test: (s, c) => s.settings.streaksEnabled && currentStreak(s, c.today) >= 7 },
  { id: 'streak-30', name: 'Unstoppable', description: 'Reach a 30-day streak.', icon: '✺', xp: 250, test: (s, c) => s.settings.streaksEnabled && currentStreak(s, c.today) >= 30 },
  { id: 'daily-5', name: 'Daily Driver', description: 'Complete 5 daily challenges.', icon: '☀', xp: 60, test: (s) => Object.values(s.daily).filter((d) => d.completed).length >= 5 },
  { id: 'lab-explorer', name: 'Lab Explorer', description: 'Open 6 different visualization labs.', icon: '⚗', xp: 40, test: (s) => s.labsVisited.length >= 6 },
  { id: 'bug-hunter', name: 'Bug Hunter', description: 'Fix 3 C++ bugs in the code lab.', icon: '🐞', xp: 50, test: (s) => Object.entries(s.exercises).filter(([k, v]) => k.startsWith('bug:') && v.done).length >= 3 },
  { id: 'gap-filler', name: 'Gap Filler', description: 'Complete 5 fill-the-gap exercises.', icon: '▭', xp: 50, test: (s) => Object.entries(s.exercises).filter(([k, v]) => k.startsWith('gap:') && v.done).length >= 5 },
];

export function evaluateAchievements(s: ProgressState, ctx: Ctx): ProgressState {
  let next = s;
  for (const a of ACHIEVEMENTS) {
    if (next.achievements[a.id]) continue;
    if (!a.test(next, ctx)) continue;
    next = { ...next, achievements: { ...next.achievements, [a.id]: ctx.now.toISOString() } };
    next = grantXp(next, `achievement:${a.id}`, a.xp, `Achievement: ${a.name}`, ctx.now, ctx.today);
  }
  return next;
}
