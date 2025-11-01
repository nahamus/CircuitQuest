export type GateType = 'INPUT'|'OUTPUT'|'AND'|'OR'|'XOR'|'NOT'|'BUF'|'SPLIT'|'NAND'|'NOR'|'XNOR';
export type PortDir = 'In'|'Out';

export interface Port {
  id: string;
  dir: PortDir;
  index: number;
  value?: boolean; // sim value
}

export interface Gate {
  id: string;
  type: GateType;
  x: number; // grid coords (snap units)
  y: number;
  label?: string;
  inputs: Port[];
  outputs: Port[];
  // For OUTPUT and INPUT:
  target?: boolean;     // OUTPUT target
  initial?: boolean;    // INPUT initial
}

export interface WirePoint { x: number; y: number; }
export interface Wire {
  id: string;
  fromGateId: string;
  fromPortIndex: number;
  toGateId: string;
  toPortIndex: number;
  path: WirePoint[];
}

export interface GridSpec { cols: number; rows: number; snap: number; }

export interface Level {
  id: string;
  title: string;
  description?: string;
  grid: GridSpec;
  inputs: Gate[];
  outputs: Gate[];
  palette: Record<GateType, number>; // allowed counts
  placed?: Gate[];
  wires?: Wire[];
  maxComponents?: number;
  hint?: string;
  truthTable?: {
    headers: string[]; // e.g., ['A','B','F']
    rows: (0|1|'-')[][]; // array of rows matching headers length
  };
  hints?: {
    subGoals?: string[];
  };
}

export interface SimResult {
  success: boolean;
  message?: string;
  outputs?: { id: string; value: boolean; target: boolean }[];
}


