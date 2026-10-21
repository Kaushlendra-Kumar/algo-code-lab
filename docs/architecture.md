# Architecture

AlgoVerse is a static single-page app (React 19, TypeScript, Vite). There is no backend: content ships with the bundle and progress lives in `localStorage`.

## Layers

```
content (data)  ──►  lib (pure logic)  ──►  components / labs / pages (React)
```

- **`src/content`** — curriculum days, questions, patterns and zones as typed data (`src/types/content.ts`). Content never imports React.
- **`src/lib/algorithms`** — step generators for the labs. Each algorithm runs once and returns an array of `Step` objects (`state`, `note`, optional `line` marker and `vars`). Rendering never re-runs algorithm logic.
- **`src/lib/viz/traces.ts`** — trace generators that mirror the C++ programs in `src/content/traceCode.ts`. Each step names the `//#marker` of the C++ line being executed so the code viewer can highlight it.
- **`src/lib/progress`** — the progress model as pure functions: actions (`completeLesson`, `recordAttempt`, …), rules (XP, levels, mastery, spaced repetition, streaks), achievements and storage (schema version, migration, sanitising, corruption backup, export/import). `context.tsx` is the only React-aware part: it wraps the actions, persists state with a short debounce and raises toasts for new XP and achievements.
- **`src/components`** — UI primitives (`ui.tsx`), the syntax-highlighted `CodeBlock`, `VizRenderer` (renders array, table, grid, graph, tree, recursion, list and timeline states), `usePlayer` (requestAnimationFrame step player with keyboard controls) and the C++ learning modes in `ExampleView`.
- **`src/pages`, `src/labs`** — routed screens, lazily loaded. Routing uses `HashRouter` so deep links work on GitHub Pages.

## Progress rules in short

- **XP** is granted once per unique key (`lesson:5`, `solve:d05-…`, `daily:2026-03-01`, …) and recomputed from the XP log on load, so replaying content or editing the total cannot inflate it.
- **Levels** need `50 · L · (L − 1)` total XP. Themes unlock at levels 1, 3, 5, 8 and 12.
- **Solved** means passing the approach, complexity and output-prediction checks. Self-reports are stored separately.
- **Question score** combines correctness, hints, solution viewing and revision results; **pattern mastery** averages scores of tagged questions, weighted by coverage. *Mastered* additionally requires four solves, two without hints and one successful spaced review.
- **Spaced repetition** uses Leitner boxes with intervals of 1, 3, 7, 14 and 30 days; a failure returns the question to box 0.
- **Streaks** count days with activity; one missed day is covered automatically by a streak freeze (earned every 7-day milestone, at most 2 banked). Streaks can be disabled.

## Verification

| Check | Command | What it proves |
| --- | --- | --- |
| C++ | `npm run verify:cpp` | Every program compiles warning-free under sanitizers, prints its documented output, passes its tests; bug variants really misbehave. |
| Content | `npm run audit:content` | Counts and reference/field consistency; writes `docs/question-bank-audit.md`. |
| Unit | `npm test` | Algorithms, trace ↔ C++ output equality, markers, content schema, progress rules, storage, filters, components. |
| E2E | `npm run test:e2e` | All routes render without console errors on desktop and mobile, no horizontal scroll, lesson and practice flows, persistence. |
