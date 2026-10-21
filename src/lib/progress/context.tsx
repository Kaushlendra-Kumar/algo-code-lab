import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ProgressState, Settings } from './model';
import { emptyProgress } from './model';
import { browserStore, loadProgress, saveProgress } from './storage';
import * as A from './actions';
import { dayKey } from './date';
import { QUESTION_META, TOTAL_DAYS } from '../../content';
import { ACHIEVEMENTS } from './achievements';

export interface Toast {
  id: number;
  title: string;
  body?: string;
}

interface ProgressApi {
  state: ProgressState;
  today: string;
  storageMessage?: string;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  completeLesson: (day: number) => void;
  uncompleteLesson: (day: number) => void;
  answerQuiz: (key: string, correct: boolean) => void;
  completeExercise: (key: string, ok: boolean) => void;
  recordAttempt: (input: A.AttemptInput) => void;
  selfReport: (questionId: string) => void;
  markNeedsRevision: (questionId: string) => void;
  markSolutionViewed: (questionId: string) => void;
  completeDaily: (date: string, questionId: string) => void;
  visitLab: (lab: string) => void;
  saveDraft: (questionId: string, code: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceState: (s: ProgressState) => void;
  reset: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => (typeof window === 'undefined' ? null : browserStore()), []);
  const initial = useMemo(() => loadProgress(store), [store]);
  const [state, setState] = useState<ProgressState>(initial.state);
  const [storageMessage] = useState(initial.message);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);
  const today = dayKey();

  const ctx = useCallback((): A.Ctx => ({ now: new Date(), today: dayKey(), questions: QUESTION_META, totalDays: TOTAL_DAYS }), []);

  const notify = useCallback((prev: ProgressState, next: ProgressState) => {
    const gained = next.xp - prev.xp;
    const newAch = ACHIEVEMENTS.filter((a) => next.achievements[a.id] && !prev.achievements[a.id]);
    const add: Toast[] = [];
    for (const a of newAch) add.push({ id: toastId.current++, title: `${a.icon} Achievement unlocked: ${a.name}`, body: a.description });
    if (gained > 0) add.push({ id: toastId.current++, title: `+${gained} XP`, body: next.xpLog[next.xpLog.length - 1]?.reason });
    if (add.length) {
      setToasts((t) => [...t, ...add].slice(-4));
      for (const t of add) setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), 4200);
    }
  }, []);

  const apply = useCallback((fn: (s: ProgressState) => ProgressState) => setState(fn), []);

  // Announce XP and achievements by diffing consecutive states (safe under StrictMode).
  const prevRef = useRef(state);
  const silent = useRef(false);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (silent.current) {
      silent.current = false;
      return;
    }
    if (prev !== state) notify(prev, state);
  }, [state, notify]);

  // Persist (debounced) whenever state changes.
  useEffect(() => {
    const t = setTimeout(() => saveProgress(store, state), 250);
    return () => clearTimeout(t);
  }, [state, store]);

  // Apply visual settings to the document.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.dataset.motion = state.settings.motion;
    root.dataset.glass = state.settings.glass;
  }, [state.settings]);

  const api: ProgressApi = {
    state,
    today,
    storageMessage,
    toasts,
    dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    completeLesson: (day) => apply((s) => A.completeLesson(s, day, ctx())),
    uncompleteLesson: (day) => apply((s) => A.uncompleteLesson(s, day)),
    answerQuiz: (key, correct) => apply((s) => A.answerQuiz(s, key, correct, ctx())),
    completeExercise: (key, ok) => apply((s) => A.completeExercise(s, key, ok, ctx())),
    recordAttempt: (input) => apply((s) => A.recordAttempt(s, input, ctx())),
    selfReport: (id) => apply((s) => A.selfReportSolved(s, id, ctx())),
    markNeedsRevision: (id) => apply((s) => A.markNeedsRevision(s, id, ctx())),
    markSolutionViewed: (id) => apply((s) => A.markSolutionViewed(s, id)),
    completeDaily: (date, id) => apply((s) => A.completeDaily(s, date, id, ctx())),
    visitLab: (lab) => apply((s) => A.visitLab(s, lab, ctx())),
    saveDraft: (id, code) => apply((s) => (s.drafts[id] === code ? s : { ...s, drafts: { ...s.drafts, [id]: code } })),
    updateSettings: (patch) => apply((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    replaceState: (s) => {
      silent.current = true;
      setState(s);
    },
    reset: () => {
      silent.current = true;
      setState(emptyProgress());
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside ProgressProvider');
  return v;
}
