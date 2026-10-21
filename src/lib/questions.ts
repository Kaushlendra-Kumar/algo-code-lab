// Question filtering, practice-check generation and daily-challenge selection.
import type { Difficulty, Question } from '../types/content';
import type { ProgressState, QuestionStatus } from './progress/model';
import { hashString, mulberry32, shuffle } from './rng';

export interface QuestionFilter {
  text?: string;
  difficulties?: Difficulty[];
  patterns?: string[];
  topic?: string;
  day?: number | null;
  status?: QuestionStatus | 'any' | 'unsolved';
}

export function statusOf(attempts: ProgressState['attempts'], id: string): QuestionStatus {
  const rec = attempts[id];
  if (!rec) return 'new';
  if (rec.status === 'needs-revision') return 'needs-revision';
  if (rec.attempts.some((a) => a.correct)) return 'solved';
  if (rec.attempts.length || rec.selfReported) return 'attempted';
  return rec.status;
}

export function filterQuestions(questions: readonly Question[], f: QuestionFilter, attempts: ProgressState['attempts'] = {}): Question[] {
  const words = (f.text ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return questions.filter((q) => {
    if (f.difficulties?.length && !f.difficulties.includes(q.difficulty)) return false;
    if (f.patterns?.length && !f.patterns.some((p) => q.patterns.includes(p))) return false;
    if (f.topic && q.topic !== f.topic) return false;
    if (f.day && q.day !== f.day) return false;
    if (f.status && f.status !== 'any') {
      const st = statusOf(attempts, q.id);
      if (f.status === 'unsolved' ? st === 'solved' : st !== f.status) return false;
    }
    if (words.length) {
      const hay = `${q.title} ${q.statement} ${q.patterns.join(' ')} ${q.id} day ${q.day}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

// ------------------------------------------------------------------ practice checks

export const COMPLEXITY_CHOICES = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n · 2ⁿ)', 'O(n!)', 'O(V + E)', 'O(E log V)', 'O(n · m)', 'O(n log k)', 'O(n · W)'];

export interface Mcq {
  options: string[];
  answer: number;
}

/** Approach check: the primary pattern among three distractors from other patterns. */
export function approachChoices(q: Question, allPatternIds: readonly string[], nameOf: (id: string) => string): Mcq {
  const rnd = mulberry32(hashString(`${q.id}:approach`));
  const correct = q.patterns[0];
  const pool = allPatternIds.filter((p) => !q.patterns.includes(p));
  const picks: string[] = [];
  while (picks.length < 3 && pool.length) {
    const i = Math.floor(rnd() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  const ids = shuffle([correct, ...picks], hashString(q.id));
  return { options: ids.map(nameOf), answer: ids.indexOf(correct) };
}

/** Complexity check: the stated time complexity among standard distractors. */
export function complexityChoices(q: Question): Mcq {
  const correct = q.complexity.time;
  const rnd = mulberry32(hashString(`${q.id}:cx`));
  const pool = COMPLEXITY_CHOICES.filter((c) => c !== correct && !correct.includes(c));
  const picks: string[] = [];
  while (picks.length < 3) picks.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const opts = shuffle([correct, ...picks], hashString(`${q.id}:cxo`));
  return { options: opts, answer: opts.indexOf(correct) };
}

/** Which tests the learner must predict: two tests that are not the first (usually the statement example). */
export function predictionTests(q: Question) {
  const rest = q.tests.slice(1);
  return (rest.length >= 2 ? rest.slice(0, 2) : q.tests.slice(0, 2)).map((t) => ({ ...t }));
}

// ------------------------------------------------------------------ daily challenge

export function pickDaily(date: string, questions: readonly Question[], progress: Pick<ProgressState, 'lessons' | 'attempts'>): Question | null {
  if (!questions.length) return null;
  const furthest = Math.max(0, ...Object.keys(progress.lessons).map(Number));
  const reach = Math.max(3, furthest + 2);
  const solved = Object.values(progress.attempts).filter((r) => r.attempts.some((a) => a.correct)).length;
  const allowed: Difficulty[] = solved < 5 ? ['Easy'] : solved < 30 ? ['Easy', 'Medium'] : ['Easy', 'Medium', 'Hard'];
  const isSolved = (id: string) => progress.attempts[id]?.attempts.some((a) => a.correct) ?? false;
  const tiers = [
    questions.filter((q) => q.day <= reach && allowed.includes(q.difficulty) && !isSolved(q.id)),
    questions.filter((q) => q.day <= reach && !isSolved(q.id)),
    questions.filter((q) => !isSolved(q.id)),
    [...questions],
  ];
  const pool = tiers.find((t) => t.length > 0)!;
  const rnd = mulberry32(hashString(`daily:${date}`));
  return pool[Math.floor(rnd() * pool.length)];
}
