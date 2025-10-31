import type { Gate, Level, SimResult } from '../models/types';

export function runSimulation(level: Level): SimResult {
  const nodes: Record<string, Gate> = {};
  [...level.inputs, ...(level.placed||[]), ...level.outputs].forEach(g => nodes[g.id] = g);

  const edges: Array<{from: Gate; fromOut: number; to: Gate; toIn: number}> = [];
  (level.wires||[]).forEach(w => {
    const from = nodes[w.fromGateId], to = nodes[w.toGateId];
    if (from && to) edges.push({ from, fromOut: w.fromPortIndex, to, toIn: w.toPortIndex });
  });

  const inDeg: Record<string, number> = {};
  Object.values(nodes).forEach(n => inDeg[n.id] = 0);
  edges.forEach(e => inDeg[e.to.id]++);

  // Kahn
  const q: Gate[] = Object.values(nodes).filter(n => inDeg[n.id] === 0);
  const order: Gate[] = [];
  while (q.length) {
    const g = q.shift()!;
    order.push(g);
    edges.forEach(e => {
      if (e.from.id === g.id) {
        inDeg[e.to.id]--;
        if (inDeg[e.to.id] === 0) q.push(e.to);
      }
    });
  }
  if (order.length !== Object.keys(nodes).length) {
    return { success: false, message: 'Cycle detected (combinational loops not allowed).' };
  }

  // Seed inputs
  level.inputs.forEach(inp => {
    if (!inp.outputs.length) inp.outputs.push({ id: `${inp.id}:out0`, dir:'Out', index:0, value:false });
    inp.outputs[0].value = !!inp.initial;
  });

  // Helpers
  const getIn = (g: Gate, idx: number): boolean => {
    const e = edges.find(e => e.to.id === g.id && e.toIn === idx);
    if (!e) return false;
    const out = e.from.outputs[e.fromOut];
    return !!out?.value;
  };

  // Ensure ports
  const ensurePorts = (g: Gate) => {
    if (!g.inputs) g.inputs = [];
    if (!g.outputs) g.outputs = [];
  };

  // Eval
  for (const g of order) {
    ensurePorts(g);
    switch (g.type) {
      case 'INPUT': break;
      case 'OUTPUT': {
        if (!g.inputs.length) g.inputs.push({ id:`${g.id}:in0`, dir:'In', index:0 });
        // value carried only for check step
        break;
      }
      case 'NOT': {
        if (!g.outputs.length) g.outputs.push({ id:`${g.id}:out0`, dir:'Out', index:0 });
        g.outputs[0].value = !getIn(g,0);
        break;
      }
      case 'BUF':
      case 'SPLIT': {
        if (!g.outputs.length) g.outputs.push({ id:`${g.id}:out0`, dir:'Out', index:0 });
        g.outputs[0].value = getIn(g,0);
        if (g.type==='SPLIT') {
          if (g.outputs.length<2) g.outputs.push({ id:`${g.id}:out1`, dir:'Out', index:1 });
          g.outputs[1].value = g.outputs[0].value;
        }
        break;
      }
      case 'AND': {
        if (!g.outputs.length) g.outputs.push({ id:`${g.id}:out0`, dir:'Out', index:0 });
        g.outputs[0].value = getIn(g,0) && getIn(g,1);
        break;
      }
      case 'OR': {
        if (!g.outputs.length) g.outputs.push({ id:`${g.id}:out0`, dir:'Out', index:0 });
        g.outputs[0].value = getIn(g,0) || getIn(g,1);
        break;
      }
      case 'XOR': {
        if (!g.outputs.length) g.outputs.push({ id:`${g.id}:out0`, dir:'Out', index:0 });
        const a = getIn(g,0), b = getIn(g,1);
        g.outputs[0].value = (a ? !b : b);
        break;
      }
    }
  }

  // Check outputs
  const checks = level.outputs.map(o => {
    if (!o.inputs?.length) o.inputs = [{ id:`${o.id}:in0`, dir:'In', index:0 }];
    const e = edges.find(e => e.to.id===o.id && e.toIn===0);
    const val = e ? !!e.from.outputs[e.fromOut]?.value : false;
    return { id: o.id, value: val, target: !!o.target };
  });
  const success = checks.every(c => c.value === c.target);
  return { success, outputs: checks, message: success ? 'All outputs match.' : 'Mismatch.' };
}

