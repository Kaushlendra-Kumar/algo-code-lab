// Local persistence with schema versioning, migration and corruption recovery.
import type { ProgressState, Settings } from './model';
import { DEFAULT_SETTINGS, PROGRESS_SCHEMA_VERSION, emptyProgress } from './model';

export const STORAGE_KEY = 'algoverse.progress';
export const BACKUP_PREFIX = 'algoverse.progress.corrupt.';

export interface KVStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  state: ProgressState;
  status: 'fresh' | 'loaded' | 'migrated' | 'recovered';
  message?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const rec = <T>(v: unknown, f: (x: unknown) => T | null): Record<string, T> => {
  const out: Record<string, T> = {};
  if (!isObj(v)) return out;
  for (const [k, x] of Object.entries(v)) {
    const y = f(x);
    if (y !== null) out[k] = y;
  }
  return out;
};

/**
 * Migrate older payloads to the current schema.
 * v1 stored `completedLessons: number[]` and had no `exercises` / `streak.earnedAt`.
 */
export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const v = num(raw.schemaVersion, 1);
  let out = { ...raw };
  if (v < 2) {
    const lessons: Record<string, { completedAt: string }> = {};
    if (Array.isArray(raw.completedLessons)) {
      for (const d of raw.completedLessons) if (typeof d === 'number') lessons[d] = { completedAt: str(raw.createdAt, new Date(0).toISOString()) };
    }
    out = { ...out, lessons: { ...(isObj(raw.lessons) ? raw.lessons : {}), ...lessons }, exercises: raw.exercises ?? {} };
    // v1 kept only a running total; carry it over as one log entry so it survives recomputation.
    const total = num(raw.xp);
    if (total > 0 && !Array.isArray(raw.xpLog)) {
      out.xpLog = [{ key: 'migrated:v1', amount: total, at: str(raw.createdAt, new Date(0).toISOString()), reason: 'XP carried over from an older save' }];
    }
    delete out.completedLessons;
  }
  out.schemaVersion = PROGRESS_SCHEMA_VERSION;
  return out;
}

/** Coerce arbitrary JSON into a valid ProgressState, dropping malformed entries. */
export function sanitize(raw: unknown): ProgressState {
  const base = emptyProgress();
  if (!isObj(raw)) return base;
  const settingsRaw = isObj(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    streaksEnabled: typeof settingsRaw.streaksEnabled === 'boolean' ? settingsRaw.streaksEnabled : DEFAULT_SETTINGS.streaksEnabled,
    motion: ['system', 'reduced', 'full'].includes(settingsRaw.motion as string) ? (settingsRaw.motion as Settings['motion']) : DEFAULT_SETTINGS.motion,
    glass: settingsRaw.glass === 'reduced' ? 'reduced' : 'full',
    theme: str(settingsRaw.theme, DEFAULT_SETTINGS.theme),
    defaultSpeed: Math.min(4, Math.max(0.25, num(settingsRaw.defaultSpeed, 1))),
    showGo: settingsRaw.showGo === true,
    dailyGoal: Math.min(500, Math.max(10, num(settingsRaw.dailyGoal, DEFAULT_SETTINGS.dailyGoal))),
  };
  const streakRaw = isObj(raw.streak) ? raw.streak : {};
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const xpLog = Array.isArray(raw.xpLog)
    ? raw.xpLog.filter(isObj).map((e) => ({ key: str(e.key), amount: num(e.amount), at: str(e.at), reason: str(e.reason) })).filter((e) => e.key)
    : [];
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    createdAt: str(raw.createdAt, base.createdAt),
    // XP is recomputed from the log so a tampered or partial total cannot drift.
    xp: xpLog.reduce((s, e) => s + Math.max(0, e.amount), 0),
    xpLog,
    lessons: rec(raw.lessons, (x) => (isObj(x) ? { completedAt: str(x.completedAt) } : null)),
    quiz: rec(raw.quiz, (x) => (isObj(x) ? { correct: x.correct === true, at: str(x.at), tries: num(x.tries, 1) } : null)),
    attempts: rec(raw.attempts, (x) => {
      if (!isObj(x)) return null;
      const attempts = Array.isArray(x.attempts)
        ? x.attempts.filter(isObj).map((a) => {
            const c = isObj(a.checks) ? a.checks : {};
            return {
              at: str(a.at),
              mode: (['practice', 'revision', 'daily'].includes(a.mode as string) ? a.mode : 'practice') as 'practice' | 'revision' | 'daily',
              checks: {
                approach: c.approach === true,
                complexity: c.complexity === true,
                outputs: Array.isArray(c.outputs) ? c.outputs.map((o) => o === true) : [],
              },
              hintsUsed: num(a.hintsUsed),
              correct: a.correct === true,
              seconds: typeof a.seconds === 'number' ? a.seconds : undefined,
            };
          })
        : [];
      const status = ['new', 'attempted', 'solved', 'needs-revision'].includes(x.status as string) ? (x.status as ProgressState['attempts'][string]['status']) : 'attempted';
      return {
        status,
        attempts,
        selfReported: x.selfReported === true,
        solvedAt: typeof x.solvedAt === 'string' ? x.solvedAt : undefined,
        bestScore: num(x.bestScore),
        firstCorrect: typeof x.firstCorrect === 'boolean' ? x.firstCorrect : undefined,
        lastCorrect: typeof x.lastCorrect === 'boolean' ? x.lastCorrect : undefined,
        solutionViewed: x.solutionViewed === true,
      };
    }),
    revision: rec(raw.revision, (x) => {
      if (!isObj(x) || typeof x.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.due)) return null;
      return {
        box: Math.min(4, Math.max(0, num(x.box))),
        due: x.due,
        lastReview: typeof x.lastReview === 'string' ? x.lastReview : undefined,
        history: Array.isArray(x.history) ? x.history.filter(isObj).map((h) => ({ at: str(h.at), correct: h.correct === true })) : [],
      };
    }),
    activity: rec(raw.activity, (x) =>
      isObj(x)
        ? { xp: num(x.xp), solved: num(x.solved), attempted: num(x.attempted), lessons: num(x.lessons), reviews: num(x.reviews), seconds: num(x.seconds) }
        : null,
    ),
    daily: rec(raw.daily, (x) => (isObj(x) && typeof x.questionId === 'string' ? { questionId: x.questionId, completed: x.completed === true } : null)),
    achievements: rec(raw.achievements, (x) => (typeof x === 'string' ? x : null)),
    exercises: rec(raw.exercises, (x) => (isObj(x) ? { done: x.done === true, at: str(x.at), tries: num(x.tries, 1) } : null)),
    labsVisited: strArr(raw.labsVisited),
    drafts: rec(raw.drafts, (x) => (typeof x === 'string' ? x.slice(0, 20000) : null)),
    streak: { freezes: Math.min(2, Math.max(0, num(streakRaw.freezes))), frozen: strArr(streakRaw.frozen), earnedAt: strArr(streakRaw.earnedAt) },
    settings,
  };
}

export function loadProgress(store: KVStore | null, now = new Date()): LoadResult {
  if (!store) return { state: emptyProgress(now), status: 'fresh', message: 'Browser storage is unavailable; progress will not persist.' };
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { state: emptyProgress(now), status: 'fresh', message: 'Browser storage is blocked; progress will not persist.' };
  }
  if (raw === null) return { state: emptyProgress(now), status: 'fresh' };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed)) throw new Error('not an object');
    const version = num(parsed.schemaVersion, 1);
    if (version > PROGRESS_SCHEMA_VERSION) throw new Error(`saved by a newer version (${version})`);
    const migrated = version < PROGRESS_SCHEMA_VERSION;
    const state = sanitize(migrate(parsed));
    return { state, status: migrated ? 'migrated' : 'loaded' };
  } catch (e) {
    const backupKey = BACKUP_PREFIX + now.getTime();
    try {
      store.setItem(backupKey, raw);
    } catch {
      /* ignore: best effort */
    }
    return {
      state: emptyProgress(now),
      status: 'recovered',
      message: `Saved progress could not be read (${(e as Error).message}). A copy was kept under "${backupKey}" and a fresh profile was started.`,
    };
  }
}

export function saveProgress(store: KVStore | null, state: ProgressState): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(state: ProgressState, now = new Date()): string {
  return JSON.stringify({ app: 'AlgoVerse', exportedAt: now.toISOString(), progress: state }, null, 2);
}

export function importProgress(text: string): { ok: true; state: ProgressState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (!isObj(parsed) || parsed.app !== 'AlgoVerse' || !isObj(parsed.progress)) {
    return { ok: false, error: 'This file is not an AlgoVerse progress export.' };
  }
  const version = num(parsed.progress.schemaVersion, 1);
  if (version > PROGRESS_SCHEMA_VERSION) return { ok: false, error: 'This export was created by a newer version of AlgoVerse.' };
  return { ok: true, state: sanitize(migrate(parsed.progress)) };
}

export function browserStore(): KVStore | null {
  try {
    const s = window.localStorage;
    const probe = '__algoverse_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
