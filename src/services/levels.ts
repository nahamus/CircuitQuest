import type { Level } from '../models/types';
import { logError } from '../utils/logger';

// Use Vite's BASE_URL to handle base path correctly
const BASE_URL = import.meta.env.BASE_URL;

export async function fetchLevelIndex(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}levels/index.json`);
    if (!res.ok) {
      logError('Failed to fetch level index:', res.status, res.statusText);
      throw new Error(`Failed to load level index: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    logError('Error fetching level index:', error);
    throw error;
  }
}

export async function fetchLevel(id: string): Promise<Level> {
  const res = await fetch(`${BASE_URL}levels/${id}.json`);
  if (!res.ok) throw new Error(`Failed to load level ${id}`);
  const data = await res.json() as Level;
  
  // Ensure INPUT/OUTPUT gates have correct ports
  data.inputs.forEach(g => {
    g.inputs = [];
    if (!g.outputs.length) {
      g.outputs = [{ id: `${g.id}:out0`, dir: 'Out', index: 0 }];
    }
  });
  
  data.outputs.forEach(g => {
    g.outputs = [];
    if (!g.inputs.length) {
      g.inputs = [{ id: `${g.id}:in0`, dir: 'In', index: 0 }];
    }
  });
  
  // Initialize placed and wires if undefined
  if (!data.placed) data.placed = [];
  if (!data.wires) data.wires = [];
  
  return data;
}

export async function fetchPacks(): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(`${BASE_URL}levels/packs.json`);
    if (!res.ok) throw new Error(`Failed to load packs: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data as Record<string, string[]>;
  } catch (e) {
    logError('Error fetching packs:', e);
    return { All: [] };
  }
}

