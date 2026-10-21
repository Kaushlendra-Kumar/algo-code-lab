import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../src/content';
import { markerLines, normalizeOutput } from '../src/content/cpp';
import { TRACE_LIST, TRACES } from '../src/lib/viz/traces';

describe('scripted traces', () => {
  for (const t of TRACE_LIST) {
    it(`${t.id}: every step points at a marker in the C++ code`, () => {
      const markers = markerLines(t.code);
      const run = t.run(t.defaultInput);
      expect(run.steps.length).toBeGreaterThan(1);
      for (const s of run.steps) if (s.line) expect(markers[s.line], `marker ${s.line}`).toBeGreaterThan(0);
    });

    it(`${t.id}: is deterministic`, () => {
      expect(t.run(t.defaultInput).output).toBe(t.run(t.defaultInput).output);
    });
  }

  it('matches the g++-verified output of every example that uses it', () => {
    let checked = 0;
    for (const { example } of Object.values(EXAMPLES)) {
      if (!example.trace) continue;
      const run = TRACES[example.trace.id].run(example.trace.input as Record<string, unknown>);
      expect(normalizeOutput(run.output), example.id).toBe(normalizeOutput(example.output));
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(15);
  });

  it('validators reject bad input where defined', () => {
    for (const t of TRACE_LIST) if (t.validate) expect(t.validate(t.defaultInput), t.id).toBeNull();
  });
});
