import { describe, expect, it } from 'vitest';
import { BACKUP_PREFIX, STORAGE_KEY, exportProgress, importProgress, loadProgress, saveProgress, type KVStore } from '../src/lib/progress/storage';
import { PROGRESS_SCHEMA_VERSION, emptyProgress } from '../src/lib/progress/model';

function memoryStore(init: Record<string, string> = {}): KVStore & { data: Record<string, string> } {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

describe('progress storage', () => {
  it('starts fresh when nothing is saved', () => {
    expect(loadProgress(memoryStore()).status).toBe('fresh');
    expect(loadProgress(null).status).toBe('fresh');
  });

  it('round-trips a saved state', () => {
    const store = memoryStore();
    const s = { ...emptyProgress(), xp: 120, xpLog: [{ key: 'lesson:1', amount: 120, at: '', reason: 'test' }], lessons: { 1: { completedAt: '2026-01-01T00:00:00.000Z' } } };
    expect(saveProgress(store, s)).toBe(true);
    const loaded = loadProgress(store);
    expect(loaded.status).toBe('loaded');
    expect(loaded.state.xp).toBe(120);
    expect(loaded.state.lessons['1']).toBeDefined();
  });

  it('recovers from corrupted JSON and keeps a backup', () => {
    const store = memoryStore({ [STORAGE_KEY]: '{not json' });
    const r = loadProgress(store, new Date(1000));
    expect(r.status).toBe('recovered');
    expect(r.state.xp).toBe(0);
    expect(store.data[BACKUP_PREFIX + '1000']).toBe('{not json');
  });

  it('refuses data from a newer schema without destroying it', () => {
    const raw = JSON.stringify({ schemaVersion: PROGRESS_SCHEMA_VERSION + 1, xp: 5 });
    const store = memoryStore({ [STORAGE_KEY]: raw });
    expect(loadProgress(store).status).toBe('recovered');
    expect(store.data[STORAGE_KEY]).toBe(raw);
  });

  it('migrates v1 data', () => {
    const v1 = { schemaVersion: 1, xp: 70, completedLessons: [1, 2], createdAt: '2025-12-01T00:00:00.000Z' };
    const r = loadProgress(memoryStore({ [STORAGE_KEY]: JSON.stringify(v1) }));
    expect(r.status).toBe('migrated');
    expect(Object.keys(r.state.lessons).sort()).toEqual(['1', '2']);
    expect(r.state.schemaVersion).toBe(PROGRESS_SCHEMA_VERSION);
    expect(r.state.xp).toBe(70);
  });

  it('recomputes XP from the log so a tampered total cannot drift', () => {
    const raw = { ...emptyProgress(), xp: 999999, xpLog: [{ key: 'lesson:1', amount: 50, at: '', reason: 'x' }] };
    expect(loadProgress(memoryStore({ [STORAGE_KEY]: JSON.stringify(raw) })).state.xp).toBe(50);
  });

  it('sanitises malformed fields', () => {
    const r = loadProgress(memoryStore({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 2, xp: 'lots', attempts: { a: 5 }, settings: { motion: 'warp' } }) }));
    expect(r.state.xp).toBe(0);
    expect(r.state.settings.motion).toBe('system');
  });

  it('save reports failure when storage throws', () => {
    const store: KVStore = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
    expect(saveProgress(store, emptyProgress())).toBe(false);
  });

  it('export and import round-trip', () => {
    const s = { ...emptyProgress(), xp: 300, xpLog: [{ key: 'a', amount: 300, at: '', reason: 'test' }] };
    const r = importProgress(exportProgress(s));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.xp).toBe(300);
    expect(importProgress('nope').ok).toBe(false);
    expect(importProgress(JSON.stringify({ app: 'Other', progress: {} })).ok).toBe(false);
  });
});
