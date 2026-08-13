import { deserialiseCareer, newCareer, serialiseCareer, type CareerSave } from './career';
import type { CareerState } from './types';

/**
 * Career saves live under their own key rather than inside the study profile.
 *
 * The engine is deliberately track-agnostic and knows nothing about jobs or
 * money; making `Profile` carry a `CareerSave` would invert that. Two keys is
 * the cheaper price.
 */
const STORAGE_KEY = 'hvac-trainer:career:v1';

export function loadCareer(storage: Storage | undefined = safeStorage()): CareerState {
  if (!storage) return newCareer();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return newCareer();
    return deserialiseCareer(JSON.parse(raw) as CareerSave);
  } catch {
    // A corrupted save costs you the career, not the app.
    return newCareer();
  }
}

export function saveCareer(
  state: CareerState,
  storage: Storage | undefined = safeStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(serialiseCareer(state)));
  } catch {
    // Quota or private browsing. Play continues, progress just is not kept.
  }
}

export function clearCareer(storage: Storage | undefined = safeStorage()): void {
  storage?.removeItem(STORAGE_KEY);
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
