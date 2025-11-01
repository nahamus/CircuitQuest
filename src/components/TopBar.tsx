import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import './TopBar.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { currentLevel, sim, runSimulation, resetLevel, deleteSelection } = useStore();

  if (!currentLevel) return null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button onClick={() => navigate('/')}>← Back to Menu</button>
      </div>
      <div className="topbar-center">
        {sim.last && (
          <>
            <div className={`sim-result ${sim.last.success ? 'success' : 'error'}`}>
              {sim.last.success ? '✓ Success! All outputs correct!' : 'Some outputs are incorrect.'}
            </div>
            {!sim.last.success && sim.last.outputs && sim.last.outputs.length > 0 && (
              <div className="sim-details">
                {sim.last.outputs
                  .filter(o => o.value !== o.target)
                  .map(o => {
                    const label = currentLevel.outputs.find(g => g.id === o.id)?.label || o.id;
                    return `${label}: expected ${o.target ? '1' : '0'}, got ${o.value ? '1' : '0'}`;
                  })
                  .join(' • ')}
              </div>
            )}
          </>
        )}
      </div>
      <div className="topbar-right">
        <button onClick={deleteSelection}>Delete</button>
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

