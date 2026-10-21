// Compiles and runs every C++ program bundled with AlgoVerse:
//   - curriculum Example A / B programs: stdout must equal the stated output
//   - practice questions: solution + driver must pass every stdin/stdout test
//   - pattern snippets: must compile (-fsyntax-only)
//   - Go snippets: must build (when `go` is installed)
// Uses g++ -std=c++17 -Wall -Wextra -Werror with AddressSanitizer + UBSan.
// Results are cached by source hash in .cpp-build/ so re-runs are fast.
//
// Usage: npm run verify:cpp [-- --filter d05] [-- --no-sanitize]
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { DAY_MODULES } from '../src/content/days/index.ts';
import { PATTERNS } from '../src/content/patterns.ts';

const run = promisify(execFile);
const BUILD = '.cpp-build';
const args = process.argv.slice(2);
const filter = args.includes('--filter') ? args[args.indexOf('--filter') + 1] : '';
const sanitize = !args.includes('--no-sanitize');
const FLAGS = ['-std=c++17', '-O1', '-Wall', '-Wextra', '-Werror', '-Wno-unused-parameter', ...(sanitize ? ['-fsanitize=address,undefined', '-fno-sanitize-recover=all'] : [])];

mkdirSync(BUILD, { recursive: true });
const cacheFile = join(BUILD, 'cache.json');
const cache: Record<string, boolean> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};

interface Job {
  name: string;
  kind: 'program' | 'question' | 'snippet' | 'go';
  source: string;
  tests: { in: string; out: string }[];
}

const jobs: Job[] = [];
for (const m of DAY_MODULES) {
  for (const ex of [m.day.exampleA, m.day.exampleB]) {
    jobs.push({ name: ex.id, kind: 'program', source: ex.code, tests: [{ in: '', out: ex.output }] });
  }
  for (const q of m.questions) {
    jobs.push({ name: q.id, kind: 'question', source: `${q.cpp}\n\n${q.main}\n`, tests: q.tests });
  }
}
for (const p of PATTERNS) {
  if (p.cpp) jobs.push({ name: `pattern:${p.id}`, kind: 'snippet', source: `#include <bits/stdc++.h>\nusing namespace std;\n\n${p.cpp}\n\nint main() { return 0; }\n`, tests: [] });
  if (p.go) jobs.push({ name: `go:${p.id}`, kind: 'go', source: `package main\n\n${p.go}\n\nfunc main() {}\n`, tests: [] });
}

const selected = jobs.filter((j) => !filter || j.name.includes(filter));
const norm = (s: string) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim();

let hasGo = true;
try {
  await run('go', ['version']);
} catch {
  hasGo = false;
}

async function verify(job: Job): Promise<string | null> {
  const key = createHash('sha256').update(JSON.stringify({ job, FLAGS })).digest('hex').slice(0, 24);
  if (cache[key]) return null;
  const base = join(BUILD, key);
  if (job.kind === 'go') {
    if (!hasGo) return null;
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, 'main.go'), job.source);
    try {
      await run('go', ['build', '-o', join(base, 'bin'), join(base, 'main.go')], { env: { ...process.env, GOFLAGS: '-mod=mod', GO111MODULE: 'off' } });
    } catch (e) {
      return `go build failed:\n${(e as { stderr?: string }).stderr ?? e}`;
    }
    cache[key] = true;
    return null;
  }
  const src = `${base}.cpp`;
  writeFileSync(src, job.source);
  try {
    await run('g++', [...FLAGS, ...(job.kind === 'snippet' ? ['-fsyntax-only'] : ['-o', base]), src], { maxBuffer: 1 << 24 });
  } catch (e) {
    return `compile failed:\n${(e as { stderr?: string }).stderr ?? e}`;
  }
  for (const [i, t] of job.tests.entries()) {
    let out: string;
    try {
      const p = run(base, [], { timeout: 10000, maxBuffer: 1 << 24 });
      p.child.stdin?.end(t.in);
      out = (await p).stdout;
    } catch (e) {
      const err = e as { stderr?: string; stdout?: string; message?: string };
      return `test ${i + 1} crashed: ${err.message}\n${err.stderr ?? ''}`;
    }
    if (norm(out) !== norm(t.out)) return `test ${i + 1} wrong output\n  input:    ${JSON.stringify(t.in)}\n  expected: ${JSON.stringify(norm(t.out))}\n  actual:   ${JSON.stringify(norm(out))}`;
  }
  cache[key] = true;
  return null;
}

const failures: { name: string; error: string }[] = [];
let next = 0;
let done = 0;
const workers = Array.from({ length: Math.max(1, cpus().length) }, async () => {
  while (next < selected.length) {
    const job = selected[next++];
    const err = await verify(job);
    done++;
    if (err) failures.push({ name: job.name, error: err });
    if (done % 25 === 0) process.stdout.write(`  ${done}/${selected.length}\n`);
  }
});
await Promise.all(workers);
writeFileSync(cacheFile, JSON.stringify(cache));

const counts = selected.reduce<Record<string, number>>((m, j) => ((m[j.kind] = (m[j.kind] ?? 0) + 1), m), {});
const testCount = selected.reduce((s, j) => s + j.tests.length, 0);
console.log(`\nVerified ${selected.length} items (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), ${testCount} stdin/stdout checks. Sanitizers: ${sanitize ? 'on' : 'off'}. Go: ${hasGo ? 'yes' : 'not installed (skipped)'}.`);
if (failures.length) {
  for (const f of failures) console.error(`\n✗ ${f.name}\n${f.error}`);
  console.error(`\n${failures.length} failure(s).`);
  process.exit(1);
}
console.log('All C++ programs compiled and produced the expected output.');
