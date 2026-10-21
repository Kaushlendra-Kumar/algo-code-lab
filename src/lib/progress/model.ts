// Saved learner progress. Everything here is stored locally in the browser.
export const PROGRESS_SCHEMA_VERSION = 2;

export type QuestionStatus = 'new' | 'attempted' | 'solved' | 'needs-revision';
export type AttemptMode = 'practice' | 'revision' | 'daily';

export interface AttemptChecks {
  approach: boolean;
  complexity: boolean;
  outputs: boolean[];
}

export interface AttemptEntry {
  at: string; // ISO timestamp
  mode: AttemptMode;
  checks: AttemptChecks;
  hintsUsed: number;
  correct: boolean;
  seconds?: number;
}

export interface QuestionRecord {
  status: QuestionStatus;
  attempts: AttemptEntry[];
  selfReported?: boolean;
  solvedAt?: string;
  bestScore: number;
  /** Result of the first verified attempt and of the latest one — used for before/after revision tracking. */
  firstCorrect?: boolean;
  lastCorrect?: boolean;
  solutionViewed?: boolean;
}

export interface SrsRecord {
  box: number;
  due: string; // YYYY-MM-DD
  lastReview?: string;
  history: { at: string; correct: boolean }[];
}

export interface DayActivity {
  xp: number;
  solved: number;
  attempted: number;
  lessons: number;
  reviews: number;
  seconds: number;
}

export interface Settings {
  streaksEnabled: boolean;
  motion: 'system' | 'reduced' | 'full';
  glass: 'full' | 'reduced';
  theme: string;
  defaultSpeed: number;
  showGo: boolean;
  dailyGoal: number;
}

export interface XpEvent {
  key: string;
  amount: number;
  at: string;
  reason: string;
}

export interface ProgressState {
  schemaVersion: number;
  createdAt: string;
  xp: number;
  xpLog: XpEvent[];
  lessons: Record<string, { completedAt: string }>;
  quiz: Record<string, { correct: boolean; at: string; tries: number }>;
  attempts: Record<string, QuestionRecord>;
  revision: Record<string, SrsRecord>;
  activity: Record<string, DayActivity>;
  daily: Record<string, { questionId: string; completed: boolean }>;
  achievements: Record<string, string>;
  exercises: Record<string, { done: boolean; at: string; tries: number }>;
  labsVisited: string[];
  drafts: Record<string, string>;
  streak: { freezes: number; frozen: string[]; earnedAt: string[] };
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  streaksEnabled: true,
  motion: 'system',
  glass: 'full',
  theme: 'aurora',
  defaultSpeed: 1,
  showGo: false,
  dailyGoal: 60,
};

export function emptyProgress(now = new Date()): ProgressState {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    createdAt: now.toISOString(),
    xp: 0,
    xpLog: [],
    lessons: {},
    quiz: {},
    attempts: {},
    revision: {},
    activity: {},
    daily: {},
    achievements: {},
    exercises: {},
    labsVisited: [],
    drafts: {},
    streak: { freezes: 0, frozen: [], earnedAt: [] },
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function emptyDay(): DayActivity {
  return { xp: 0, solved: 0, attempted: 0, lessons: 0, reviews: 0, seconds: 0 };
}

export interface QuestionMeta {
  id: string;
  day: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  patterns: string[];
  topic: string;
}
