import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLevelIndex } from '../services/levels';
import { loadProgress } from '../services/storage';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, { bestScore: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchLevelIndex()
      .then(async (ids) => {
        console.log('Level IDs loaded:', ids);
        // Strip .json extension from IDs if present
        const cleanIds = ids.map(id => id.replace(/\.json$/, ''));
        setLevels(cleanIds);
        const prog: Record<string, { bestScore: number }> = {};
        for (const id of cleanIds) {
          const p = await loadProgress(id);
          if (p) prog[id] = p;
        }
        setProgress(prog);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load levels:', error);
        setError(error instanceof Error ? error.message : 'Failed to load levels');
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <div className="home-content">
        <h1>Circuit Quest</h1>
        <p className="subtitle">Build circuits to solve logic puzzles</p>
        
        <button 
          className="instructions-toggle"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? '▼ Hide' : '▶ How to Play'}
        </button>

        {showInstructions && (
          <div className="instructions">
            <h3>How to Play</h3>
            <div className="instructions-content">
              <h4>Objective</h4>
              <p>Build logic circuits using gates to satisfy the output requirements. Connect gates with wires to create your solution.</p>
              
              <h4>Controls</h4>
              <ul>
                <li><strong>Place Gates:</strong> Click a gate in the palette, then click on the canvas to place it</li>
                <li><strong>Move Gates:</strong> Click and drag a gate to reposition it</li>
                <li><strong>Connect Wires:</strong> Click an output port (right side) and drag to an input port (left side)</li>
                <li><strong>Delete:</strong> Click a gate or wire to select it, then press Delete or Backspace</li>
                <li><strong>Zoom:</strong> Use Ctrl/Cmd + Mouse Wheel</li>
                <li><strong>Pan:</strong> Right-click and drag, or use Mouse Wheel</li>
              </ul>

              <h4>Gates</h4>
              <ul>
                <li><strong>INPUT</strong> - Provides a constant value (shown on the left)</li>
                <li><strong>OUTPUT</strong> - Target output (must match the required value)</li>
                <li><strong>AND</strong> - Outputs true only if both inputs are true</li>
                <li><strong>OR</strong> - Outputs true if either input is true</li>
                <li><strong>XOR</strong> - Outputs true if inputs differ</li>
                <li><strong>NOT</strong> - Inverts the input (one input)</li>
                <li><strong>BUF</strong> - Buffer/passes through the input</li>
                <li><strong>SPLIT</strong> - Splits one input to two outputs</li>
              </ul>

              <h4>Scoring</h4>
              <p>Your score is based on: fewer components, shorter wires, and unused palette items. Click <strong>Run</strong> to test your circuit!</p>
            </div>
          </div>
        )}

        {loading && <p className="subtitle">Loading levels...</p>}
        {error && (
          <div style={{ color: '#ff4444', marginBottom: '20px' }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && levels.length === 0 && (
          <p className="subtitle">No levels available</p>
        )}
        {!loading && !error && levels.length > 0 && (
          <div className="level-list">
            <h3 style={{ marginTop: '30px', marginBottom: '16px', color: '#e0e0e0' }}>Levels</h3>
            {levels.map((id) => (
              <div
                key={id}
                className="level-item"
                onClick={() => navigate(`/play/${id}`)}
              >
                <div className="level-item-name">{id}</div>
                {progress[id] && (
                  <div className="level-item-badge">
                    ★ {progress[id].bestScore.toFixed(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

