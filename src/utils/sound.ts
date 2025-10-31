let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx!;
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.05) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {}
}

export function playClick() {
  // short mid beep
  beep(880, 35, 'square', 0.04);
}

export function playSnap() {
  // two quick descending tones
  beep(1200, 25, 'triangle', 0.04);
  setTimeout(() => beep(900, 25, 'triangle', 0.04), 30);
}

export function playSuccess() {
  beep(660, 60, 'sine', 0.05);
  setTimeout(() => beep(880, 80, 'sine', 0.05), 70);
}


