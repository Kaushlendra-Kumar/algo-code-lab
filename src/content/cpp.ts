// Tag for C++ source text: keeps backslashes such as "\n" literal.
export const cpp = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  String.raw({ raw: strings.raw }, ...values).replace(/^\n/, '').replace(/\s+$/, '');

/** Strip trace markers (//#name) and gap markers (//@gap) from code for display. */
export function displayCode(code: string): string {
  return code
    .split('\n')
    .map((l) => l.replace(/\s*\/\/[#@][\w-]+(\s+[#@][\w-]+)*\s*$/, ''))
    .join('\n');
}

/** Map of trace marker -> 1-based display line number. */
export function markerLines(code: string): Record<string, number> {
  const out: Record<string, number> = {};
  code.split('\n').forEach((line, i) => {
    const m = line.match(/\/\/((?:[#@][\w-]+\s*)+)$/);
    if (!m) return;
    for (const tok of m[1].trim().split(/\s+/)) {
      if (tok.startsWith('#')) out[tok.slice(1)] = i + 1;
    }
  });
  return out;
}

/** 1-based line numbers marked //@gap. */
export function gapLines(code: string): number[] {
  return code
    .split('\n')
    .map((l, i) => (/\/\/(?:[#@][\w-]+\s*)*@gap\b/.test(l) ? i + 1 : -1))
    .filter((n) => n > 0);
}

/** Find the 1-based line containing the substring. */
export function findLine(code: string, match: string): number {
  const idx = code.split('\n').findIndex((l) => l.includes(match));
  return idx + 1;
}

export function normalizeCode(s: string): string {
  return s.replace(/\s+/g, '').replace(/;+$/, ';');
}

export function normalizeOutput(s: string): string {
  return s
    .trim()
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.length > 0)
    .join('\n')
    .toLowerCase();
}
