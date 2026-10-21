# Content guide

How to add or change curriculum content.

## Adding a question

Questions live in `src/content/days/dayNN.ts`. A question needs:

- `id` of the form `dNN-short-name`, unique across the bank;
- `statement`, `constraints`, `examples`, `edgeCases`, `cues`, `hints`, `approach`, `correctness`, `complexity`;
- `patterns` — pattern ids from `src/content/patterns.ts`, **primary pattern first** (it becomes the correct answer of the approach check);
- `cpp` — the solution function(s) with their `#include`s, and `main` — a driver that reads stdin in the format described by `io`;
- at least three `tests` (`in` / `out`). Tests 2 and 3 are the ones learners must predict, so keep them small;
- `keyLines` — substrings of lines in `cpp` or `main` with a short explanation.

Write code with the `cpp` tagged template so backslashes such as `"\n"` stay literal.

## Worked examples

Each day has `exampleA` and `exampleB` with a complete C++17 program and its exact `output`.

- Append `//@gap` to a line to turn it into a fill-the-gap exercise.
- Add a `bug` (`find` must occur exactly once in the code). The symptom may quote output with `prints "…"`; the verifier checks the buggy program really prints it.
- To sync a step-through trace, put the program in `src/content/traceCode.ts` with `//#marker` comments, add a generator to `src/lib/viz/traces.ts` that emits those markers, and reference it with `trace: { id, input }`.

## After editing

```bash
python3 scripts/gen-day-index.py          # only when adding a new day file
npx tsx scripts/verify-cpp.ts --filter dNN
npm test
npm run audit:content
```

Expected outputs must come from running the program, never from guessing.
