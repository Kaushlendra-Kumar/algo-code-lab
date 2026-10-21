import { describe, expect, it } from 'vitest';
import { QUESTION_META, QUESTIONS } from '../src/content';
import { emptyProgress } from '../src/lib/progress/model';
import type { Ctx } from '../src/lib/progress/actions';
import { answerQuiz, completeDaily, completeExercise, completeLesson, markSolutionViewed, recordAttempt, selfReportSolved } from '../src/lib/progress/actions';
import {
  SRS_INTERVALS,
  XP,
  applyStreakRules,
  currentStreak,
  dueReviews,
  levelFromXp,
  longestStreak,
  patternMastery,
  questionScore,
  scheduleReview,
  solveXp,
  unlockedThemes,
  xpForLevel,
} from '../src/lib/progress/rules';
import { addDays } from '../src/lib/progress/date';

const today = '2026-03-10';
const ctx = (day = today): Ctx => ({ now: new Date(`${day}T12:00:00Z`), today: day, questions: QUESTION_META, totalDays: 40 });
const good = { approach: true, complexity: true, outputs: [true, true] };
const bad = { approach: true, complexity: false, outputs: [true, false] };
const easy = QUESTIONS.find((q) => q.difficulty === 'Easy')!;

describe('XP and levels', () => {
  it('level thresholds grow and levelFromXp is consistent', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    for (const xp of [0, 99, 100, 299, 300, 5000]) {
      const l = levelFromXp(xp);
      expect(xp).toBeGreaterThanOrEqual(l.current);
      expect(xp).toBeLessThan(l.next);
    }
  });

  it('hints reduce solve XP but never below the floor', () => {
    expect(solveXp('Medium', 0)).toBe(XP.solve.Medium);
    expect(solveXp('Medium', 2)).toBeLessThan(XP.solve.Medium);
    expect(solveXp('Hard', 100)).toBe(Math.round(XP.solve.Hard * XP.minSolveFactor));
  });

  it('themes unlock with level', () => {
    expect(unlockedThemes(0)).toEqual(['aurora']);
    expect(unlockedThemes(100000).length).toBeGreaterThan(3);
  });
});

describe('no duplicate rewards', () => {
  it('completing a lesson twice grants XP once', () => {
    let s = completeLesson(emptyProgress(), 1, ctx());
    const xp = s.xp;
    expect(xp).toBeGreaterThanOrEqual(XP.lesson);
    s = completeLesson(s, 1, ctx());
    expect(s.xp).toBe(xp);
  });

  it('solving a question again does not re-award XP', () => {
    let s = recordAttempt(emptyProgress(), { questionId: easy.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    const xp = s.xp;
    s = recordAttempt(s, { questionId: easy.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    expect(s.xp).toBe(xp);
    expect(s.attempts[easy.id].attempts).toHaveLength(2);
  });

  it('quiz XP only on a first-try correct answer', () => {
    let s = answerQuiz(emptyProgress(), 'd1:q0', false, ctx());
    expect(s.xp).toBe(0);
    s = answerQuiz(s, 'd1:q0', true, ctx());
    expect(s.xp).toBe(0);
    s = answerQuiz(s, 'd1:q1', true, ctx());
    expect(s.xp).toBeGreaterThanOrEqual(XP.quizCorrect);
  });

  it('exercises and daily challenges reward once', () => {
    let s = completeExercise(emptyProgress(), 'trace:d01-A', true, ctx());
    const xp = s.xp;
    s = completeExercise(s, 'trace:d01-A', true, ctx());
    expect(s.xp).toBe(xp);
    s = completeDaily(s, today, easy.id, ctx());
    const xp2 = s.xp;
    s = completeDaily(s, today, easy.id, ctx());
    expect(s.xp).toBe(xp2);
  });

  it('self-report is recorded separately from verified solving', () => {
    const s = selfReportSolved(emptyProgress(), easy.id, ctx());
    expect(s.attempts[easy.id].selfReported).toBe(true);
    expect(s.attempts[easy.id].attempts).toHaveLength(0);
    expect(s.attempts[easy.id].status).not.toBe('solved');
  });
});

describe('question status and score', () => {
  it('failed attempt then success', () => {
    let s = recordAttempt(emptyProgress(), { questionId: easy.id, checks: bad, hintsUsed: 0, mode: 'practice' }, ctx());
    expect(s.attempts[easy.id].status).toBe('attempted');
    s = recordAttempt(s, { questionId: easy.id, checks: good, hintsUsed: 1, mode: 'practice' }, ctx());
    expect(s.attempts[easy.id].status).toBe('solved');
    expect(s.attempts[easy.id].firstCorrect).toBe(false);
  });

  it('viewing the solution before solving lowers the score', () => {
    const solved = recordAttempt(emptyProgress(), { questionId: easy.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    const peeked = recordAttempt(markSolutionViewed(emptyProgress(), easy.id), { questionId: easy.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    expect(questionScore(peeked.attempts[easy.id])).toBeLessThan(questionScore(solved.attempts[easy.id]));
  });

  it('unknown question ids are ignored', () => {
    const s = emptyProgress();
    expect(recordAttempt(s, { questionId: 'nope', checks: good, hintsUsed: 0, mode: 'practice' }, ctx())).toBe(s);
  });
});

describe('pattern mastery', () => {
  it('cannot reach Mastered without enough evidence', () => {
    const pattern = easy.patterns[0];
    const s = recordAttempt(emptyProgress(), { questionId: easy.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    const m = patternMastery(pattern, QUESTION_META, s.attempts, s.revision);
    expect(m.solved).toBe(1);
    expect(m.level).not.toBe('Mastered');
    expect(patternMastery(pattern, QUESTION_META, {}, {}).level).toBe('Unstarted');
  });

  it('reaches Mastered with independent solves and a revision success', () => {
    const pattern = 'binary-search';
    const qs = QUESTIONS.filter((q) => q.patterns.includes(pattern)).slice(0, 4);
    expect(qs.length).toBe(4);
    let s = emptyProgress();
    for (const q of qs) s = recordAttempt(s, { questionId: q.id, checks: good, hintsUsed: 0, mode: 'practice' }, ctx());
    const later = addDays(today, 1);
    s = recordAttempt(s, { questionId: qs[0].id, checks: good, hintsUsed: 0, mode: 'revision' }, ctx(later));
    expect(patternMastery(pattern, QUESTION_META, s.attempts, s.revision).level).toBe('Mastered');
  });
});

describe('spaced repetition', () => {
  it('moves up a box on unassisted success and resets on failure', () => {
    const r1 = scheduleReview(undefined, true, 0, today);
    expect(r1.box).toBe(1);
    expect(r1.due).toBe(addDays(today, SRS_INTERVALS[1]));
    const r2 = scheduleReview(r1, true, 0, r1.due);
    expect(r2.box).toBe(2);
    const r3 = scheduleReview(r2, false, 0, r2.due);
    expect(r3.box).toBe(0);
    expect(r3.due).toBe(addDays(r2.due, 1));
    const r4 = scheduleReview(r2, true, 2, r2.due);
    expect(r4.box).toBe(2);
  });

  it('caps at the last interval', () => {
    let r = scheduleReview(undefined, true, 0, today);
    for (let i = 0; i < 10; i++) r = scheduleReview(r, true, 0, r.due);
    expect(r.box).toBe(SRS_INTERVALS.length - 1);
  });

  it('lists due reviews', () => {
    const revision = { a: scheduleReview(undefined, true, 0, today), b: scheduleReview(undefined, false, 0, today) };
    expect(dueReviews(revision, today)).toEqual([]);
    expect(dueReviews(revision, addDays(today, 1))).toEqual(['b']);
    expect(dueReviews(revision, addDays(today, 3))).toEqual(['b', 'a']);
  });
});

describe('streaks', () => {
  const active = (days: string[]) => ({
    activity: Object.fromEntries(days.map((d) => [d, { xp: 10, solved: 0, attempted: 0, lessons: 0, reviews: 0, seconds: 0 }])),
    streak: { freezes: 0, frozen: [] as string[], earnedAt: [] as string[] },
  });

  it('counts consecutive days and tolerates an inactive today', () => {
    const s = active([addDays(today, -2), addDays(today, -1)]);
    expect(currentStreak(s, today)).toBe(2);
    expect(currentStreak(s, addDays(today, 2))).toBe(0);
    expect(longestStreak(active(['2026-01-01', '2026-01-02', '2026-01-05']))).toBe(2);
  });

  it('a freeze covers one missed day', () => {
    const base = { ...emptyProgress(), ...active([addDays(today, -3), addDays(today, -2), today]) };
    base.streak = { freezes: 1, frozen: [], earnedAt: [] };
    const s = applyStreakRules(base, today);
    expect(s.streak.freezes).toBe(0);
    expect(s.streak.frozen).toContain(addDays(today, -1));
    expect(currentStreak(s, today)).toBe(4);
  });

  it('earns a freeze at a 7-day milestone', () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const s = applyStreakRules({ ...emptyProgress(), ...active(days) }, today);
    expect(s.streak.freezes).toBe(1);
    expect(applyStreakRules(s, today).streak.freezes).toBe(1);
  });
});
