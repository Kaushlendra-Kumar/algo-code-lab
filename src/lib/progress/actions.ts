// Pure state transitions. The React provider wraps these and persists the result.
import type { AttemptChecks, AttemptMode, ProgressState, QuestionMeta, QuestionRecord } from './model';
import { emptyDay } from './model';
import { XP, applyStreakRules, grantXp, isCorrect, questionScore, scheduleReview, solveXp } from './rules';
import { evaluateAchievements } from './achievements';

export interface Ctx {
  now: Date;
  today: string;
  questions: readonly QuestionMeta[];
  totalDays: number;
}

function bump(s: ProgressState, today: string, field: 'solved' | 'attempted' | 'lessons' | 'reviews', by = 1): ProgressState {
  const day = s.activity[today] ?? emptyDay();
  return { ...s, activity: { ...s.activity, [today]: { ...day, [field]: day[field] + by } } };
}

function finish(s: ProgressState, ctx: Ctx): ProgressState {
  return evaluateAchievements(applyStreakRules(s, ctx.today), ctx);
}

export function completeLesson(s: ProgressState, day: number, ctx: Ctx): ProgressState {
  if (s.lessons[day]) return s;
  let next: ProgressState = { ...s, lessons: { ...s.lessons, [day]: { completedAt: ctx.now.toISOString() } } };
  next = bump(next, ctx.today, 'lessons');
  next = grantXp(next, `lesson:${day}`, XP.lesson, `Completed Day ${day} lesson`, ctx.now, ctx.today);
  return finish(next, ctx);
}

export function uncompleteLesson(s: ProgressState, day: number): ProgressState {
  if (!s.lessons[day]) return s;
  const lessons = { ...s.lessons };
  delete lessons[day];
  // XP is kept: it was earned and the reward key prevents re-earning it.
  return { ...s, lessons };
}

export function answerQuiz(s: ProgressState, key: string, correct: boolean, ctx: Ctx): ProgressState {
  const prev = s.quiz[key];
  let next: ProgressState = {
    ...s,
    quiz: { ...s.quiz, [key]: { correct: prev?.correct || correct, at: ctx.now.toISOString(), tries: (prev?.tries ?? 0) + 1 } },
  };
  // Only a correct answer on the first try earns XP.
  if (correct && !prev) next = grantXp(next, `quiz:${key}`, XP.quizCorrect, 'Quiz answered correctly', ctx.now, ctx.today);
  return finish(next, ctx);
}

export function completeExercise(s: ProgressState, key: string, ok: boolean, ctx: Ctx): ProgressState {
  const prev = s.exercises[key];
  let next: ProgressState = {
    ...s,
    exercises: { ...s.exercises, [key]: { done: prev?.done || ok, at: ctx.now.toISOString(), tries: (prev?.tries ?? 0) + 1 } },
  };
  if (ok) next = grantXp(next, `exercise:${key}`, XP.exercise, 'C++ lab exercise', ctx.now, ctx.today);
  return finish(next, ctx);
}

export interface AttemptInput {
  questionId: string;
  checks: AttemptChecks;
  hintsUsed: number;
  mode: AttemptMode;
  seconds?: number;
}

export function recordAttempt(s: ProgressState, input: AttemptInput, ctx: Ctx): ProgressState {
  const meta = ctx.questions.find((q) => q.id === input.questionId);
  if (!meta) return s;
  const correct = isCorrect(input.checks);
  const prev: QuestionRecord = s.attempts[input.questionId] ?? { status: 'new', attempts: [], bestScore: 0 };
  const wasSolved = prev.attempts.some((a) => a.correct);
  const entry = { at: ctx.now.toISOString(), mode: input.mode, checks: input.checks, hintsUsed: input.hintsUsed, correct, seconds: input.seconds };
  const rec: QuestionRecord = {
    ...prev,
    attempts: [...prev.attempts, entry],
    firstCorrect: prev.firstCorrect ?? correct,
    lastCorrect: correct,
    solvedAt: prev.solvedAt ?? (correct ? ctx.now.toISOString() : undefined),
    status: correct ? 'solved' : wasSolved || prev.attempts.length > 0 ? 'needs-revision' : 'attempted',
    bestScore: 0,
  };
  rec.bestScore = questionScore(rec);

  let next: ProgressState = { ...s, attempts: { ...s.attempts, [input.questionId]: rec } };
  next = bump(next, ctx.today, 'attempted');
  if (input.seconds) {
    const d = next.activity[ctx.today];
    next = { ...next, activity: { ...next.activity, [ctx.today]: { ...d, seconds: d.seconds + input.seconds } } };
  }

  // Spaced repetition: every verified attempt updates the schedule.
  const prevSrs = s.revision[input.questionId];
  const isReview = input.mode === 'revision' && prevSrs !== undefined;
  next = { ...next, revision: { ...next.revision, [input.questionId]: scheduleReview(prevSrs, correct, input.hintsUsed, ctx.today) } };

  if (correct && !wasSolved) {
    next = bump(next, ctx.today, 'solved');
    next = grantXp(next, `solve:${input.questionId}`, solveXp(meta.difficulty, input.hintsUsed), `Solved ${input.questionId}`, ctx.now, ctx.today);
  }
  if (isReview) {
    next = bump(next, ctx.today, 'reviews');
    if (correct) next = grantXp(next, `review:${input.questionId}:${prevSrs.due}`, XP.revision, `Revision of ${input.questionId}`, ctx.now, ctx.today);
  }
  return finish(next, ctx);
}

export function selfReportSolved(s: ProgressState, questionId: string, ctx: Ctx): ProgressState {
  const prev: QuestionRecord = s.attempts[questionId] ?? { status: 'new', attempts: [], bestScore: 0 };
  const rec: QuestionRecord = {
    ...prev,
    selfReported: true,
    status: prev.attempts.some((a) => a.correct) ? 'solved' : 'attempted',
    bestScore: 0,
  };
  rec.bestScore = questionScore(rec);
  let next: ProgressState = { ...s, attempts: { ...s.attempts, [questionId]: rec } };
  next = grantXp(next, `self:${questionId}`, XP.selfReport, `Self-reported ${questionId}`, ctx.now, ctx.today);
  return finish(next, ctx);
}

export function markNeedsRevision(s: ProgressState, questionId: string, ctx: Ctx): ProgressState {
  const prev: QuestionRecord = s.attempts[questionId] ?? { status: 'new', attempts: [], bestScore: 0 };
  return {
    ...s,
    attempts: { ...s.attempts, [questionId]: { ...prev, status: 'needs-revision' } },
    revision: { ...s.revision, [questionId]: s.revision[questionId] ? { ...s.revision[questionId], due: ctx.today } : { box: 0, due: ctx.today, history: [] } },
  };
}

export function markSolutionViewed(s: ProgressState, questionId: string): ProgressState {
  const prev: QuestionRecord = s.attempts[questionId] ?? { status: 'new', attempts: [], bestScore: 0 };
  // Reading the solution after solving is encouraged and costs nothing.
  if (prev.solutionViewed || prev.attempts.some((a) => a.correct)) return s;
  const rec = { ...prev, solutionViewed: true };
  rec.bestScore = questionScore(rec);
  return { ...s, attempts: { ...s.attempts, [questionId]: rec } };
}

export function completeDaily(s: ProgressState, date: string, questionId: string, ctx: Ctx): ProgressState {
  if (s.daily[date]?.completed) return s;
  let next: ProgressState = { ...s, daily: { ...s.daily, [date]: { questionId, completed: true } } };
  next = grantXp(next, `daily:${date}`, XP.daily, 'Daily challenge', ctx.now, ctx.today);
  return finish(next, ctx);
}

export function visitLab(s: ProgressState, lab: string, ctx: Ctx): ProgressState {
  if (s.labsVisited.includes(lab)) return s;
  return finish({ ...s, labsVisited: [...s.labsVisited, lab] }, ctx);
}
