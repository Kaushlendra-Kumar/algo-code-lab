import { describe, expect, it } from 'vitest';
import { PATTERNS, PATTERN_BY_ID, QUESTIONS } from '../src/content';
import { approachChoices, complexityChoices, filterQuestions, pickDaily, predictionTests } from '../src/lib/questions';
import { emptyProgress } from '../src/lib/progress/model';
import { displayCode, gapLines, markerLines, normalizeOutput } from '../src/content/cpp';

const ids = PATTERNS.map((p) => p.id);
const nameOf = (id: string) => PATTERN_BY_ID[id].name;

describe('filters', () => {
  it('filter by difficulty, day, pattern and text', () => {
    expect(filterQuestions(QUESTIONS, { difficulties: ['Hard'] }).every((q) => q.difficulty === 'Hard')).toBe(true);
    expect(filterQuestions(QUESTIONS, { day: 5 }).every((q) => q.day === 5)).toBe(true);
    const bs = filterQuestions(QUESTIONS, { patterns: ['binary-search'] });
    expect(bs.length).toBeGreaterThan(0);
    expect(bs.every((q) => q.patterns.includes('binary-search'))).toBe(true);
    const first = QUESTIONS[0];
    expect(filterQuestions(QUESTIONS, { text: first.title })).toContain(first);
    expect(filterQuestions(QUESTIONS, { text: 'zzzz-no-match' })).toHaveLength(0);
  });

  it('status filter uses progress', () => {
    const q = QUESTIONS[0];
    const attempts = { [q.id]: { status: 'solved' as const, attempts: [{ at: '', mode: 'practice' as const, checks: { approach: true, complexity: true, outputs: [true] }, hintsUsed: 0, correct: true }], bestScore: 1 } };
    expect(filterQuestions(QUESTIONS, { status: 'solved' }, attempts)).toEqual([q]);
    expect(filterQuestions(QUESTIONS, { status: 'unsolved' }, attempts)).not.toContain(q);
  });
});

describe('practice checks', () => {
  it('approach choices contain the primary pattern exactly once', () => {
    for (const q of QUESTIONS) {
      const m = approachChoices(q, ids, nameOf);
      expect(m.options).toHaveLength(4);
      expect(new Set(m.options).size).toBe(4);
      expect(m.options[m.answer]).toBe(nameOf(q.patterns[0]));
    }
  });

  it('complexity choices are unique and include the answer', () => {
    for (const q of QUESTIONS) {
      const m = complexityChoices(q);
      expect(new Set(m.options).size, q.id).toBe(m.options.length);
      expect(m.options[m.answer]).toBe(q.complexity.time);
    }
  });

  it('prediction tests come from the verified tests', () => {
    for (const q of QUESTIONS) {
      const p = predictionTests(q);
      expect(p.length).toBe(2);
      for (const t of p) expect(q.tests.some((x) => x.in === t.in && x.out === t.out)).toBe(true);
    }
  });
});

describe('daily challenge', () => {
  it('is deterministic per date and starts easy', () => {
    const p = emptyProgress();
    const a = pickDaily('2026-05-01', QUESTIONS, p)!;
    expect(pickDaily('2026-05-01', QUESTIONS, p)!.id).toBe(a.id);
    expect(a.difficulty).toBe('Easy');
    expect(a.day).toBeLessThanOrEqual(3);
  });
});

describe('C++ helpers', () => {
  const code = 'int a = 0;  //#init\nint b = 1;  //@gap\nint c = 2;  //#step @gap\nreturn a;';
  it('find markers and gaps', () => {
    expect(markerLines(code)).toEqual({ init: 1, step: 3 });
    expect(gapLines(code)).toEqual([2, 3]);
  });
  it('strip markers for display', () => {
    expect(displayCode(code)).toBe('int a = 0;\nint b = 1;\nint c = 2;\nreturn a;');
  });
  it('normalise output whitespace', () => {
    expect(normalizeOutput('  1  2 \n\n3\n')).toBe('1 2\n3');
  });
});
