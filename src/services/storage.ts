import { set, get, del } from 'idb-keyval';
import type { Gate, Wire } from '../models/types';

const PREFIX_PROGRESS = 'cq.progress.';
const PREFIX_SAVE = 'cq.save.';
const KEY_SETTINGS = 'cq.settings';

export interface Progress {
  bestScore: number;
  bestParts: number;
  bestTime: number;
}

export interface Save {
  gates: Gate[];
  wires: Wire[];
}

export interface Settings {
  theme: 'dark' | 'light';
  gridSnap: number;
  showHints: boolean;
}

export async function saveProgress(levelId: string, progress: Progress): Promise<void> {
  await set(`${PREFIX_PROGRESS}${levelId}`, progress);
}

export async function loadProgress(levelId: string): Promise<Progress | undefined> {
  return await get(`${PREFIX_PROGRESS}${levelId}`);
}

export async function saveAutosave(levelId: string, save: Save): Promise<void> {
  await set(`${PREFIX_SAVE}${levelId}`, save);
}

export async function loadAutosave(levelId: string): Promise<Save | undefined> {
  return await get(`${PREFIX_SAVE}${levelId}`);
}

export async function deleteAutosave(levelId: string): Promise<void> {
  await del(`${PREFIX_SAVE}${levelId}`);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(KEY_SETTINGS, settings);
}

export async function loadSettings(): Promise<Settings | undefined> {
  return await get(KEY_SETTINGS);
}

