import type { CaseDraft } from './types';

const DB_NAME = 'async-trace-stitcher';
const DEMO_DB_NAME = 'demo:async-trace-stitcher';
const STORE = 'cases';
const DRAFT_KEY = 'active-draft';
export type StorageMode = 'real' | 'demo';

function openDb(mode: StorageMode): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(mode === 'demo' ? DEMO_DB_NAME : DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadDraft(mode: StorageMode = 'real'): Promise<CaseDraft | null> {
  const db = await openDb(mode);
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(DRAFT_KEY);
    request.onsuccess = () => resolve((request.result as CaseDraft | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(draft: CaseDraft, mode: StorageMode = 'real'): Promise<void> {
  const db = await openDb(mode);
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(draft, DRAFT_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearDraft(mode: StorageMode = 'real'): Promise<void> {
  const db = await openDb(mode);
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(DRAFT_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
