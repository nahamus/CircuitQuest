import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import './TopBar.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { currentLevel, sim, runSimulation, resetLevel } = useStore();

  if (!currentLevel) return null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button onClick={() => navigate('/')}>← Back to Menu</button>
        <h2>{currentLevel.title}</h2>
      </div>
      <div className="topbar-center">
        {!sim.last && currentLevel.description && (
          <div className="level-description">{currentLevel.description}</div>
        )}
        {sim.last && (
          <div className={`sim-result ${sim.last.success ? 'success' : 'error'}`}>
            {sim.last.success ? '✓ Success! All outputs correct!' : sim.last.message}
          </div>
        )}
      </div>
      <div className="topbar-right">
        <button onClick={resetLevel} className="danger">Reset</button>
        <button
          onClick={runSimulation}
          disabled={sim.running}
          className="primary"
        >
          {sim.running ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  );
}

