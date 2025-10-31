import type { WirePoint } from '../models/types';

export function manhattanPath(x1: number, y1: number, x2: number, y2: number): WirePoint[] {
  return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }];
}

