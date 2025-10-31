import { create } from 'zustand';
import type { Level, Gate, Wire, GateType, SimResult } from '../models/types';
import { runSimulation } from '../logic/simulation';
import { saveProgress, loadProgress, saveAutosave, loadAutosave, loadSettings, saveSettings } from '../services/storage';
import type { Settings } from '../services/storage';
import { fetchLevel } from '../services/levels';
import { manhattanPath } from '../logic/router';

interface StoreState {
  currentLevel?: Level;
  gates: Gate[];
  wires: Wire[];
  selection: { gateId?: string; wireId?: string };
  sim: { last?: SimResult; running: boolean };
  ui: {
    zoom: number;
    offsetX: number;
    offsetY: number;
    gridSnap: number;
    theme: 'dark' | 'light';
    showHints: boolean;
  };
  wireStart?: { gateId: string; portIndex: number; x: number; y: number };
  armedGateType?: GateType | null;
  
  // Actions
  loadLevel: (id: string) => Promise<void>;
  placeGate: (type: GateType, x: number, y: number) => void;
  moveGate: (gateId: string, x: number, y: number) => void;
  replaceGateType: (gateId: string, newType: GateType) => void;
  arrangeIO: () => void;
  startWire: (gateId: string, portIndex: number, x: number, y: number) => void;
  completeWire: (gateId: string, portIndex: number) => void;
  cancelWire: () => void;
  deleteSelection: () => void;
  runSimulation: () => void;
  resetLevel: () => void;
  saveProgress: () => void;
  loadAutosave: () => Promise<void>;
  setSelection: (gateId?: string, wireId?: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  setArmedGateType: (type: GateType | null) => void;
  fitToView: () => void;
}

function calculateScore(level: Level, gates: Gate[], wires: Wire[]): number {
  const componentCount = gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT').length;
  const wireLength = wires.reduce((sum, w) => {
    let len = 0;
    for (let i = 1; i < w.path.length; i++) {
      const dx = w.path[i].x - w.path[i-1].x;
      const dy = w.path[i].y - w.path[i-1].y;
      len += Math.abs(dx) + Math.abs(dy);
    }
    return sum + len;
  }, 0);
  
  const placedGates = gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT');
  const remainingPalette = Object.entries(level.palette).reduce((sum, [type, count]) => {
    const used = placedGates.filter(g => g.type === type).length;
    return sum + Math.max(0, count - used);
  }, 0);
  
  return 1000 - 10 * componentCount - 0.1 * wireLength + 50 * remainingPalette;
}

export const useStore = create<StoreState>((set, get) => ({
  gates: [],
  wires: [],
  selection: {},
  sim: { running: false },
  ui: {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    gridSnap: 32,
    theme: 'dark',
    showHints: false,
  },
  
  loadLevel: async (id: string) => {
    const level = await fetchLevel(id);
    const settings = await loadSettings();
    // Arrange IO gates onto a top floating bar by default
    const snap = level.grid.snap;
    const barY = Math.floor(snap * 0.75); // top bar center, closer to top
    const horizontalSpacing = snap * 2.5;
    const leftMargin = snap * 2;
    const rightMargin = snap * 2;
    const totalWidth = (level.grid.cols - 1) * snap;

    const arrangedInputs: Gate[] = (level.inputs || []).map((g, index) => ({
      ...g,
      x: leftMargin + index * horizontalSpacing,
      y: barY,
    }));
    const arrangedOutputs: Gate[] = (level.outputs || []).map((g, index) => ({
      ...g,
      x: totalWidth - rightMargin - ((level.outputs?.length || 1) - 1) * horizontalSpacing + index * horizontalSpacing,
      y: barY,
    }));
    const initialPlaced: Gate[] = [...(level.placed || [])];

    // Persist arranged IO positions into currentLevel
    level.inputs = arrangedInputs;
    level.outputs = arrangedOutputs;

    set({
      currentLevel: level,
      gates: [...arrangedInputs, ...initialPlaced, ...arrangedOutputs],
      wires: level.wires || [],
      selection: {},
      sim: { running: false },
      ui: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        gridSnap: level.grid.snap,
        theme: settings?.theme || 'dark',
        showHints: settings?.showHints || false,
      },
      wireStart: undefined,
      armedGateType: null,
    });
    
    // Try to load autosave
    await get().loadAutosave();
    
    // Auto-fit view after a short delay to let DOM update
    setTimeout(() => {
      get().fitToView();
    }, 100);
  },
  
  placeGate: (type: GateType, x: number, y: number) => {
    const state = get();
    if (!state.currentLevel) return;
    
    const id = `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gate: Gate = {
      id,
      type,
      x,
      y,
      inputs: type === 'NOT' || type === 'BUF' || type === 'SPLIT'
        ? [{ id: `${id}:in0`, dir: 'In', index: 0 }]
        : type === 'AND' || type === 'OR' || type === 'XOR' || type === 'NAND' || type === 'NOR' || type === 'XNOR'
        ? [
            { id: `${id}:in0`, dir: 'In', index: 0 },
            { id: `${id}:in1`, dir: 'In', index: 1 },
          ]
        : [],
      outputs: type === 'SPLIT'
        ? [
            { id: `${id}:out0`, dir: 'Out', index: 0 },
            { id: `${id}:out1`, dir: 'Out', index: 1 },
          ]
        : [{ id: `${id}:out0`, dir: 'Out', index: 0 }],
    };
    
    set({
      gates: [...state.gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT'), gate],
    });
  },
  
  replaceGateType: (gateId: string, newType: GateType) => {
    const state = get();
    const original = state.gates.find(g => g.id === gateId);
    if (!original || original.type === 'INPUT' || original.type === 'OUTPUT') return;

    // Build new ports for the new type
    const id = original.id;
    const buildInputs = (): Port[] => {
      if (newType === 'NOT' || newType === 'BUF' || newType === 'SPLIT') {
        return [{ id: `${id}:in0`, dir: 'In', index: 0 }];
      }
      if (newType === 'AND' || newType === 'OR' || newType === 'XOR' || newType === 'NAND' || newType === 'NOR' || newType === 'XNOR') {
        return [
          { id: `${id}:in0`, dir: 'In', index: 0 },
          { id: `${id}:in1`, dir: 'In', index: 1 },
        ];
      }
      return [];
    };
    const buildOutputs = (): Port[] => {
      if (newType === 'SPLIT') {
        return [
          { id: `${id}:out0`, dir: 'Out', index: 0 },
          { id: `${id}:out1`, dir: 'Out', index: 1 },
        ];
      }
      return [{ id: `${id}:out0`, dir: 'Out', index: 0 }];
    };

    const newGate: Gate = {
      ...original,
      type: newType,
      inputs: buildInputs(),
      outputs: buildOutputs(),
    };

    // Update wires: remove connections that reference non-existent ports on the replaced gate
    const maxIn = newGate.inputs.length;
    const maxOut = newGate.outputs.length;
    const filteredWires = state.wires.filter(w => {
      if (w.fromGateId === gateId && w.fromPortIndex >= maxOut) return false;
      if (w.toGateId === gateId && w.toPortIndex >= maxIn) return false;
      return true;
    });

    set({
      gates: state.gates.map(g => (g.id === gateId ? newGate : g)),
      wires: filteredWires,
      selection: { gateId },
    });
  },

  arrangeIO: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return;
    const snap = state.ui.gridSnap;
    const barY = Math.floor(snap * 0.75);
    const horizontalSpacing = snap * 2.5;
    const leftMargin = snap * 2;
    const rightMargin = snap * 2;
    const totalWidth = (level.grid.cols - 1) * snap;

    const inputs = state.gates.filter(g => g.type === 'INPUT');
    const outputs = state.gates.filter(g => g.type === 'OUTPUT');
    const others = state.gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT');

    const arrangedInputs = inputs.map((g, i) => ({ ...g, x: leftMargin + i * horizontalSpacing, y: barY }));
    const arrangedOutputs = outputs.map((g, i) => ({
      ...g,
      x: totalWidth - rightMargin - (outputs.length - 1) * horizontalSpacing + i * horizontalSpacing,
      y: barY,
    }));

    set({ gates: [...arrangedInputs, ...others, ...arrangedOutputs] });
  },
  
  moveGate: (gateId: string, x: number, y: number) => {
    const state = get();
    const snap = state.ui.gridSnap;
    const gateWidth = snap * 0.8;
    const gateHeight = snap * 0.8;
    const portSize = snap * 0.15;
    
    // Helper function to calculate port position (matching renderGate)
    const getPortPosition = (gateX: number, gateY: number, portIndex: number, portCount: number, isInput: boolean) => {
      const portY = gateY + ((portIndex + 1) / (portCount + 1)) * gateHeight - gateHeight / 2;
      const portX = isInput 
        ? gateX - gateWidth / 2 - portSize / 2  // Left side for inputs
        : gateX + gateWidth / 2 + portSize / 2; // Right side for outputs
      return { x: portX, y: portY };
    };
    
    // First, update the gates array with the new position
    const updatedGates = state.gates.map(g => g.id === gateId ? { ...g, x, y } : g);
    
    set({
      gates: updatedGates,
      wires: state.wires.map(w => {
        // Use the updated gates array to get current positions
        const fromGate = updatedGates.find(g => g.id === w.fromGateId);
        const toGate = updatedGates.find(g => g.id === w.toGateId);
        if (!fromGate || !toGate) return w;
        
        // Only update wire paths if the moved gate is involved
        if (fromGate.id === gateId || toGate.id === gateId) {
          const fromPort = fromGate.outputs[w.fromPortIndex];
          const toPort = toGate.inputs[w.toPortIndex];
          
          if (!fromPort || !toPort) return w;
          
          // Use the actual gate positions from updatedGates
          const fromPos = getPortPosition(fromGate.x, fromGate.y, fromPort.index, fromGate.outputs.length, false);
          const toPos = getPortPosition(toGate.x, toGate.y, toPort.index, toGate.inputs.length, true);
          
          return { ...w, path: manhattanPath(fromPos.x, fromPos.y, toPos.x, toPos.y) };
        }
        return w;
      }),
    });
  },
  
  startWire: (gateId: string, portIndex: number, x: number, y: number) => {
    const state = get();
    const gate = state.gates.find(g => g.id === gateId);
    if (!gate) return;
    const port = gate.outputs[portIndex];
    if (!port) return;
    
    // Calculate the actual port position for the wire start
    const snap = state.ui.gridSnap;
    const gateWidth = snap * 0.8;
    const gateHeight = snap * 0.8;
    const portSize = snap * 0.15;
    
    const portY = gate.y + ((port.index + 1) / (gate.outputs.length + 1)) * gateHeight - gateHeight / 2;
    const portX = gate.x + gateWidth / 2 + portSize / 2;
    
    set({ wireStart: { gateId, portIndex, x: portX, y: portY } });
  },
  
  completeWire: (toGateId: string, toPortIndex: number) => {
    const state = get();
    if (!state.wireStart) return;
    
    const fromGate = state.gates.find(g => g.id === state.wireStart!.gateId);
    const toGate = state.gates.find(g => g.id === toGateId);
    if (!fromGate || !toGate) {
      set({ wireStart: undefined });
      return;
    }
    
    const fromPort = fromGate.outputs[state.wireStart.portIndex];
    const toPort = toGate.inputs[toPortIndex];
    if (!fromPort || !toPort) {
      set({ wireStart: undefined });
      return;
    }
    
    // Check if connection already exists
    const exists = state.wires.some(
      w => w.fromGateId === state.wireStart!.gateId &&
           w.fromPortIndex === state.wireStart!.portIndex &&
           w.toGateId === toGateId &&
           w.toPortIndex === toPortIndex
    );
    if (exists) {
      set({ wireStart: undefined });
      return;
    }
    
    const snap = state.ui.gridSnap;
    const gateWidth = snap * 0.8;
    const gateHeight = snap * 0.8;
    const portSize = snap * 0.15;
    
    // Calculate port positions matching renderGate
    const fromPortY = fromGate.y + ((fromPort.index + 1) / (fromGate.outputs.length + 1)) * gateHeight - gateHeight / 2;
    const fromPortX = fromGate.x + gateWidth / 2 + portSize / 2;
    const toPortY = toGate.y + ((toPort.index + 1) / (toGate.inputs.length + 1)) * gateHeight - gateHeight / 2;
    const toPortX = toGate.x - gateWidth / 2 - portSize / 2;
    
    const wireId = `wire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fromX = fromPortX;
    const fromY = fromPortY;
    const toX = toPortX;
    const toY = toPortY;
    
    const wire: Wire = {
      id: wireId,
      fromGateId: state.wireStart.gateId,
      fromPortIndex: state.wireStart.portIndex,
      toGateId,
      toPortIndex,
      path: manhattanPath(fromX, fromY, toX, toY),
    };
    
    set({
      wires: [...state.wires, wire],
      wireStart: undefined,
    });
  },
  
  cancelWire: () => {
    set({ wireStart: undefined });
  },
  
  deleteSelection: () => {
    const state = get();
    if (state.selection.gateId) {
      const gateId = state.selection.gateId;
      const gate = state.gates.find(g => g.id === gateId);
      // Do not delete INPUT/OUTPUT; instead re-arrange them back to bar and clear selection
      if (gate && (gate.type === 'INPUT' || gate.type === 'OUTPUT')) {
        get().arrangeIO();
        set({ selection: {} });
        return;
      }
      set({
        gates: state.gates.filter(g => g.id !== gateId),
        wires: state.wires.filter(w => w.fromGateId !== gateId && w.toGateId !== gateId),
        selection: {}
      });
    } else if (state.selection.wireId) {
      set({
        wires: state.wires.filter(w => w.id !== state.selection.wireId),
        selection: {},
      });
    }
  },
  
  runSimulation: async () => {
    const state = get();
    if (!state.currentLevel) return;
    
    set({ sim: { running: true } });
    
    // Create level snapshot
    const level: Level = {
      ...state.currentLevel,
      placed: state.gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT'),
      wires: state.wires,
    };
    
    const result = runSimulation(level);
    
    // Update port values in gates for visualization
    const updatedGates = [...state.gates];
    state.wires.forEach(w => {
      const fromGate = updatedGates.find(g => g.id === w.fromGateId);
      const toGate = updatedGates.find(g => g.id === w.toGateId);
      if (fromGate && toGate) {
        const fromPort = fromGate.outputs[w.fromPortIndex];
        const toPort = toGate.inputs[w.toPortIndex];
        if (fromPort && toPort && fromPort.value !== undefined) {
          toPort.value = fromPort.value;
        }
      }
    });
    
    set({
      gates: updatedGates,
      sim: { last: result, running: false },
    });
    
    if (result.success) {
      const score = calculateScore(state.currentLevel, level.placed || [], level.wires || []);
      const componentCount = (level.placed || []).length;
      const existingProgress = await loadProgress(state.currentLevel.id);
      if (!existingProgress || score > existingProgress.bestScore) {
        await saveProgress(state.currentLevel.id, {
          bestScore: score,
          bestParts: componentCount,
          bestTime: Date.now(), // Simple timestamp, could be improved
        });
      }
    }
  },
  
  resetLevel: () => {
    const state = get();
    if (!state.currentLevel) return;
    const level = state.currentLevel;
    const snap = level.grid.snap;
    const barY = Math.floor(snap * 0.75); // top bar center, closer to top
    const horizontalSpacing = snap * 2.5;
    const leftMargin = snap * 2;
    const rightMargin = snap * 2;
    const totalWidth = (level.grid.cols - 1) * snap;
    const arrangedInputs: Gate[] = (level.inputs || []).map((g, index) => ({
      ...g,
      x: leftMargin + index * horizontalSpacing,
      y: barY,
    }));
    const arrangedOutputs: Gate[] = (level.outputs || []).map((g, index) => ({
      ...g,
      x: totalWidth - rightMargin - ((level.outputs?.length || 1) - 1) * horizontalSpacing + index * horizontalSpacing,
      y: barY,
    }));
    
    set({
      gates: [...arrangedInputs, ...arrangedOutputs],
      wires: [],
      selection: {},
      sim: { running: false },
      wireStart: undefined,
    });
  },
  
  saveProgress: async () => {
    const state = get();
    if (!state.currentLevel) return;
    
    const placed = state.gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT');
    await saveAutosave(state.currentLevel.id, {
      gates: placed,
      wires: state.wires,
    });
  },
  
  loadAutosave: async () => {
    const state = get();
    if (!state.currentLevel) return;
    
    const save = await loadAutosave(state.currentLevel.id);
    if (save) {
      set({
        gates: [...state.currentLevel.inputs, ...save.gates, ...state.currentLevel.outputs],
        wires: save.wires,
      });
    }
  },
  
  setSelection: (gateId?: string, wireId?: string) => {
    set({ selection: { gateId, wireId } });
  },
  
  setZoom: (zoom: number) => {
    set({ ui: { ...get().ui, zoom: Math.max(0.5, Math.min(3, zoom)) } });
  },
  
  setOffset: (x: number, y: number) => {
    set({ ui: { ...get().ui, offsetX: x, offsetY: y } });
  },
  
    updateSettings: async (settings: Partial<Settings>) => {
    const current = await loadSettings();
    const defaults: Settings = { theme: 'dark', gridSnap: 32, showHints: false };
    const updated: Settings = { ...defaults, ...current, ...settings };
    await saveSettings(updated);
    set({ ui: { ...get().ui, theme: updated.theme, showHints: updated.showHints } });
  },
  
  setArmedGateType: (type: GateType | null) => {
    set({ armedGateType: type });
  },
  
  fitToView: () => {
    const state = get();
    if (!state.currentLevel || state.gates.length === 0) return;
    
    // Calculate bounds of all gates
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    state.gates.forEach(gate => {
      minX = Math.min(minX, gate.x);
      maxX = Math.max(maxX, gate.x);
      minY = Math.min(minY, gate.y);
      maxY = Math.max(maxY, gate.y);
    });
    
    // Add padding
    const padding = state.ui.gridSnap * 2;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Get viewport dimensions (approximate, will be adjusted by component)
    const viewportWidth = 800; // approximate, will be updated by canvas
    const viewportHeight = 600;
    
    // Calculate zoom to fit
    const zoomX = viewportWidth / width;
    const zoomY = viewportHeight / height;
    const zoom = Math.min(zoomX, zoomY, 2) * 0.8; // 0.8 for padding, max 2x zoom
    
    // Center the view
    const offsetX = viewportWidth / 2 / zoom - centerX;
    const offsetY = viewportHeight / 2 / zoom - centerY;
    
    set({
      ui: {
        ...state.ui,
        zoom: Math.max(0.5, Math.min(2, zoom)),
        offsetX,
        offsetY,
      },
    });
  },
}));

