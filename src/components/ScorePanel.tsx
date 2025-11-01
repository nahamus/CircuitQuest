import { useEffect, useState } from 'react';
import { useStore } from '../state/useStore';
import { loadProgress } from '../services/storage';
import type { Progress } from '../services/storage';
import './ScorePanel.css';

export default function ScorePanel() {
  const { currentLevel, resetLevel, runSimulation, sim } = useStore();
  const currentGates = useStore((state) => 
    state.gates.filter(g => g.type !== 'INPUT' && g.type !== 'OUTPUT').length
  );
  const currentWires = useStore((state) => state.wires.length);
  const [progress, setProgress] = useState<Progress | undefined>();

  useEffect(() => {
    if (currentLevel) {
      loadProgress(currentLevel.id).then(setProgress);
    }
  }, [currentLevel]);

  if (!currentLevel) return null;

  return (
    <div className="score-panel panel">
      <h3>Progress</h3>
      <div className="score-stats">
        <div className="stat">
          <div className="stat-label">Best Score</div>
          <div className="stat-value">{progress?.bestScore?.toFixed(1) || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Best Parts</div>
          <div className="stat-value">{progress?.bestParts || '—'}</div>
        </div>
        <div className="stat-current">
          <div className="stat-label">Current</div>
          <div className="stat-value">{currentGates} gates, {currentWires} wires</div>
        </div>
      </div>
      <div className="side-actions">
        <button className="side-btn danger" onClick={resetLevel}>↺ Reset</button>
        <button className="side-btn primary" onClick={runSimulation} disabled={sim.running}>
          {sim.running ? 'Running…' : '▶ Run'}
        </button>
      </div>
    </div>
  );
}

