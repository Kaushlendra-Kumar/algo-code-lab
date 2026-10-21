import type { CppExample, CurriculumDay, Question } from '../types/content';
import type { QuestionMeta } from '../lib/progress/model';
import { DAY_MODULES } from './days/index';
import { PATTERNS, PATTERN_BY_ID } from './patterns';
import { ZONES } from './zones';

export const DAYS: CurriculumDay[] = DAY_MODULES.map((m) => m.day).sort((a, b) => a.day - b.day);
export const QUESTIONS: Question[] = DAY_MODULES.flatMap((m) => m.questions).sort((a, b) => a.day - b.day);
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
export const DAY_BY_NUMBER: Record<number, CurriculumDay> = Object.fromEntries(DAYS.map((d) => [d.day, d]));
export const EXAMPLES: Record<string, { example: CppExample; day: number }> = Object.fromEntries(
  DAYS.flatMap((d) => [
    [d.exampleA.id, { example: d.exampleA, day: d.day }],
    [d.exampleB.id, { example: d.exampleB, day: d.day }],
  ]),
);
export const QUESTION_META: QuestionMeta[] = QUESTIONS.map((q) => ({ id: q.id, day: q.day, difficulty: q.difficulty, patterns: q.patterns, topic: q.topic }));
export const TOTAL_DAYS = 40;

export const questionsForDay = (day: number) => QUESTIONS.filter((q) => q.day === day);
export const questionsForPattern = (pattern: string) => QUESTIONS.filter((q) => q.patterns.includes(pattern));

export { PATTERNS, PATTERN_BY_ID, ZONES };
