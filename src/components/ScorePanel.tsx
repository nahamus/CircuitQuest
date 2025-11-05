import { useEffect, useState } from 'react';
import { useStore } from '../state/useStore';
import { loadProgress } from '../services/storage';
import type { Progress } from '../services/storage';
import './ScorePanel.css';

export default function ScorePanel() {
  const { currentLevel, resetLevel, ui, setShowLivePath, setTruthTableVisible, setShowHelp, revealNextSubGoal } = useStore();
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
        <button
          className="help-inline"
          title="How to Play"
          onClick={() => setShowHelp(true)}
        >
          ?
        </button>
      </div>
      <div className="side-actions">
        <button className="side-btn danger" onClick={resetLevel}>Clear Canvas</button>
        {/* Run button moved to on-canvas overlay */}
        <div className="side-divider" />
        <button
          className="side-btn"
          onClick={() => setTruthTableVisible(true)}
          title="Open truth table for components"
        >
          Truth Table
        </button>
        <div className="side-divider" />
        <button
          className="side-btn"
          onClick={() => revealNextSubGoal()}
          title="Reveal next sub-goal hint"
          disabled={!currentLevel?.hints?.subGoals || currentLevel.hints.subGoals.length === 0}
        >
          Hint: Sub-goal
        </button>
        <div className="side-divider" />
        <button
          className="side-btn"
          onClick={() => setShowLivePath(!ui.showLivePath)}
          title="Highlight paths carrying 1 during build"
        >
          {ui.showLivePath ? 'Guide: On' : 'Guide: Off'}
        </button>
      </div>
    </div>
  );
}

