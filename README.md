# AlgoVerse

**An interactive, browser-based DSA learning game, visualization lab and 40-day interview preparation path — with C++17 at its core.**

AlgoVerse is free and open source (MIT) and runs entirely in your browser. There is no account, no server and no tracking: progress is saved in your browser's local storage and can be exported as a JSON file.

Author: **Kaushlendra Kumar**

---

## What's inside

| Area | What you get |
| --- | --- |
| **Learning Dashboard** | Today's lesson, daily challenge, due reviews, streak, level and a 7-day activity chart. |
| **Learning World** | 13 zones (Foundations Isle → Summit of Synthesis) on an interactive map; each zone groups related days. |
| **40-day Roadmap** | One lesson per day: objectives, prerequisites, explanation, pattern-recognition cues, two complete C++ examples (A: core, B: variant / brute-vs-optimized / edge case), dry run, complexity, quiz, recap and preparation for the next day. |
| **C++ learning modes** | For every example: *Learn* (annotated key lines), *Step through* (synced trace), *Predict* (guess state before revealing), *Fill the gap*, *Fix the bug* and *Implement*. |
| **Visualization Lab** | 15 labs: sorting arena, maze & pathfinding (BFS / DFS / Dijkstra / A\*), graph algorithms (BFS, DFS, Dijkstra, topological sort, union-find, Kruskal, Prim), two pointers, sliding window, prefix sums, binary search, fast & slow pointers, stacks / queues / deques, heaps, trees, recursion & backtracking, dynamic programming, greedy & scheduling, complexity. |
| **Pattern Library** | 76 patterns with cues, when to use / avoid, invariants, complexity, typical mistakes and links to examples and questions. |
| **Question Bank** | 320 original practice questions (76 Easy, 192 Medium, 52 Hard) with statements, constraints, hints, approach, correctness argument, C++17 reference solution, complexity and 3–4 stdin/stdout tests each. Filters by text, day, difficulty, pattern, zone and status. |
| **Daily Challenge** | One deterministic question per date, chosen from what you have already studied. |
| **Revision Center** | Spaced repetition (Leitner boxes, 1 / 3 / 7 / 14 / 30 days). The solution stays locked during a review. |
| **Progress & Achievements** | XP, levels, pattern mastery, streaks (can be turned off) with streak freezes, achievements and unlockable themes. |
| **Settings & Data** | Theme, motion, liquid-glass effects, streaks on/off, export / import / reset of progress. |

The UI uses a "liquid glass" design (layered translucent panels with blur and specular highlights). Reduced-glass and reduced-motion modes are available, and the system `prefers-reduced-motion` setting is respected.

## How answers are checked — honestly

AlgoVerse **does not compile or execute your code** in the browser. Nothing is ever labelled "Accepted".

- A question counts as **solved** when you pass three reasoning checks: the core pattern, the optimal time complexity, and the exact program output for two real test inputs.
- "I solved it on my own" is recorded separately as a **self-report** and does not count as a verified solve.
- Opening the solution before solving lowers that question's mastery score. Hints reduce XP slightly.
- *Step through* traces are **scripted educational traces**: a TypeScript mirror of the shown C++ program running on the same input. They are labelled as such in the UI. Unit tests check that each trace prints exactly the output of the compiled C++ program.

### How the content itself is verified

Every C++ program in the project is compiled and run with g++ by `npm run verify:cpp`:

- all 80 worked examples must print exactly their documented output;
- all 320 reference solutions are run against all 1 279 stdin/stdout tests;
- every "Fix the bug" variant must actually misbehave (wrong output, crash or timeout) and, where the symptom quotes output, print it;
- pattern-library snippets must compile.

Flags: `-std=c++17 -O1 -Wall -Wextra -Werror -fsanitize=address,undefined`. The same check runs in CI.

`npm run audit:content` writes [`docs/question-bank-audit.md`](docs/question-bank-audit.md) with counts per day, zone, difficulty and pattern, and consistency checks (unique ids, required fields, key lines present in the code, valid references).

## Getting started

Requirements: Node.js 20+ (22 recommended). g++ is needed only for `verify:cpp`.

```bash
npm install
npm run dev          # http://localhost:5173/algo-code-lab/
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck and build the static site into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript project check |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop and mobile) |
| `npm run verify:cpp` | Compile and run every C++ program with g++ (`-- --filter d05` limits to one day) |
| `npm run audit:content` | Regenerate the question-bank audit report |

For Playwright, install a browser once with `npx playwright install chromium`, or point `PW_CHROMIUM_PATH` at an existing Chromium binary.

## Deployment (free)

The site is fully static, so any free static host works.

### GitHub Pages (workflow included)

`.github/workflows/deploy.yml` runs the typecheck, unit tests, content audit, g++ verification and end-to-end tests on every push and pull request. On the repository's **default branch** it then builds and deploys to GitHub Pages.

1. In the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to the default branch (or run the workflow manually from the **Actions** tab).
3. The site is published at `https://<user>.github.io/<repository>/`.

The build uses `BASE_PATH=/<repository>/` automatically. Routing uses hash URLs (`#/day/1`), so deep links work on Pages without any server configuration.

### Cloudflare Pages, Netlify or a custom domain

Build with the site served from the root:

```bash
BASE_PATH=/ npm run build
```

and publish the `dist/` directory (build command `BASE_PATH=/ npm run build`, output directory `dist`).

## Project structure

```
src/
  content/          Curriculum, questions, patterns and zones (data only)
    days/dayNN.ts   One module per day: lesson + 8 questions
    traceCode.ts    C++ programs used by the synced traces
    patterns.ts     Pattern library
  lib/
    algorithms/     Step generators for the labs (sorting, grids, graphs, DP, …)
    viz/            Trace generators synced with the C++ examples
    progress/       Pure progress model: XP, mastery, SRS, streaks, storage
  components/       UI building blocks, code viewer, visualization renderer
  labs/             Visualization lab pages
  pages/            Routed pages
scripts/            verify-cpp.ts, audit-content.ts, gen-day-index.py
tests/              Vitest unit and component tests
e2e/                Playwright tests
docs/               Architecture notes and the generated audit report
```

More detail: [`docs/architecture.md`](docs/architecture.md) and [`docs/content-guide.md`](docs/content-guide.md).

## Privacy

Everything stays on your device. Clearing site data removes your progress, so export a backup from **Settings & Data** if it matters to you. If saved data cannot be read, AlgoVerse keeps a copy under a separate local-storage key and starts a fresh profile instead of failing.

## License

[MIT](LICENSE) © 2026 Kaushlendra Kumar. All questions, explanations and code in this repository are original; problem ideas follow well-known classic algorithm exercises.
