import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLevelIndex } from '../services/levels';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLevelIndex()
      .then(async (ids) => {
        // Strip .json extension from IDs if present
        const cleanIds = ids.map(id => id.replace(/\.json$/, ''));
        setLevels(cleanIds);
        setLoading(false);
      })
      .catch((error) => {
        setError(error instanceof Error ? error.message : 'Failed to load levels');
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <div className="home-content">
        <h1>Circuit Quest</h1>
        <p className="subtitle">Build circuits to solve logic puzzles</p>
        <div className="home-divider" />
        
        {loading && <p className="subtitle">Loading...</p>}
        {error && (
          <div style={{ color: '#ff4444', marginBottom: '20px' }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <button
            className="primary"
            onClick={() => navigate(`/play/${levels[0]}`)}
            disabled={levels.length === 0}
          >
            Play
          </button>
        )}
      </div>
    </div>
  );
}

