import { describe, expect, it } from 'vitest';
import { DAYS, EXAMPLES, PATTERNS, PATTERN_BY_ID, QUESTIONS, TOTAL_DAYS, ZONES } from '../src/content';
import { displayCode, findLine, gapLines } from '../src/content/cpp';
import { TRACES } from '../src/lib/viz/traces';

const patternIds = new Set(PATTERNS.map((p) => p.id));

describe('curriculum', () => {
  it('has exactly 40 consecutive days', () => {
    expect(DAYS).toHaveLength(TOTAL_DAYS);
    DAYS.forEach((d, i) => expect(d.day).toBe(i + 1));
  });

  it('every day has the required lesson parts', () => {
    for (const d of DAYS) {
      expect(d.title.length, `day ${d.day}`).toBeGreaterThan(3);
      expect(d.objectives.length, `day ${d.day} objectives`).toBeGreaterThanOrEqual(2);
      expect(d.lesson.length, `day ${d.day} lesson`).toBeGreaterThanOrEqual(3);
      expect(d.recognition.length, `day ${d.day} recognition`).toBeGreaterThanOrEqual(1);
      expect(d.quiz.length, `day ${d.day} quiz`).toBeGreaterThanOrEqual(2);
      expect(d.recap.length).toBeGreaterThan(10);
      expect(d.nextPrep.length).toBeGreaterThan(5);
      expect(d.exampleA.id).toBe(`d${String(d.day).padStart(2, '0')}-A`);
      expect(d.exampleB.id).toBe(`d${String(d.day).padStart(2, '0')}-B`);
      for (const q of d.quiz) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size, `duplicate quiz options on day ${d.day}`).toBe(q.options.length);
      }
    }
  });

  it('every day belongs to exactly one zone', () => {
    for (const d of DAYS) {
      const zones = ZONES.filter((z) => z.days.includes(d.day));
      expect(zones.map((z) => z.id), `day ${d.day}`).toEqual([d.zone]);
    }
  });

  it('day patterns refer to existing patterns', () => {
    for (const d of DAYS) for (const p of d.patterns) expect(patternIds.has(p), `day ${d.day} → ${p}`).toBe(true);
  });
});

describe('question bank', () => {
  it('has at least 300 questions with unique ids', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(300);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it('has at least 5 questions per day', () => {
    for (const d of DAYS) expect(QUESTIONS.filter((q) => q.day === d.day).length, `day ${d.day}`).toBeGreaterThanOrEqual(5);
  });

  it('every question has the required fields', () => {
    for (const q of QUESTIONS) {
      const where = q.id;
      expect(q.id.startsWith(`d${String(q.day).padStart(2, '0')}-`), where).toBe(true);
      expect(['Easy', 'Medium', 'Hard']).toContain(q.difficulty);
      expect(q.patterns.length, where).toBeGreaterThanOrEqual(1);
      for (const p of q.patterns) expect(patternIds.has(p), `${where} → ${p}`).toBe(true);
      expect(q.statement.length, where).toBeGreaterThan(20);
      expect(q.hints.length, where).toBeGreaterThanOrEqual(1);
      expect(q.cpp.includes('#include'), where).toBe(true);
      expect(q.main.includes('int main'), where).toBe(true);
      expect(q.tests.length, where).toBeGreaterThanOrEqual(3);
      expect(q.complexity.time.length, where).toBeGreaterThan(0);
      expect(q.keyLines.length, where).toBeGreaterThanOrEqual(1);
    }
  });

  it('question key lines point at real code lines', () => {
    for (const q of QUESTIONS) for (const k of q.keyLines) expect(findLine(q.cpp + '\n' + q.main, k.match), `${q.id}: ${k.match}`).toBeGreaterThan(0);
  });

  it('covers every difficulty', () => {
    for (const d of ['Easy', 'Medium', 'Hard'] as const) expect(QUESTIONS.filter((q) => q.difficulty === d).length).toBeGreaterThan(20);
  });
});

describe('worked examples', () => {
  const examples = Object.values(EXAMPLES).map((e) => e.example);

  it('includes two examples per day', () => {
    expect(examples).toHaveLength(TOTAL_DAYS * 2);
  });

  it('key lines exist in the displayed code', () => {
    for (const ex of examples) {
      const shown = displayCode(ex.code);
      for (const k of ex.keyLines) expect(findLine(shown, k.match), `${ex.id}: ${k.match}`).toBeGreaterThan(0);
    }
  });

  it('display code hides every marker', () => {
    for (const ex of examples) expect(displayCode(ex.code)).not.toMatch(/\/\/[#@][\w-]+\s*$/m);
  });

  it('bug exercises replace exactly one occurrence', () => {
    for (const ex of examples) {
      if (!ex.bug) continue;
      const count = ex.code.split(ex.bug.find).length - 1;
      expect(count, `${ex.id} bug.find`).toBe(1);
      expect(ex.bug.replace).not.toBe(ex.bug.find);
    }
  });

  it('fill-the-gap lines are present in many examples', () => {
    const withGaps = examples.filter((ex) => gapLines(ex.code).length > 0);
    expect(withGaps.length).toBeGreaterThanOrEqual(40);
  });

  it('trace references are valid', () => {
    for (const ex of examples) if (ex.trace) expect(TRACES[ex.trace.id], ex.id).toBeDefined();
  });
});

describe('patterns', () => {
  it('have unique ids and valid cross references', () => {
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
    for (const p of PATTERNS) {
      for (const r of p.related ?? []) expect(PATTERN_BY_ID[r], `${p.id} related ${r}`).toBeDefined();
      for (const e of p.examples) expect(EXAMPLES[e], `${p.id} example ${e}`).toBeDefined();
    }
  });

  it('most patterns are practised by at least one question', () => {
    const used = new Set(QUESTIONS.flatMap((q) => q.patterns));
    const unused = PATTERNS.filter((p) => !used.has(p.id));
    expect(unused.length).toBeLessThanOrEqual(3);
  });
});
