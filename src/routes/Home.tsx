import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLevelIndex, fetchPacks } from '../services/levels';
import { useStore } from '../state/useStore';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { setCurrentPack } = useStore();
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packs, setPacks] = useState<Record<string, string[]> | null>(null);

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
    fetchPacks().then(setPacks).catch(() => setPacks(null));
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
        {packs && (() => {
          const order = ['Intro','Arithmetic','Selectors','Equivalence','Logic Only','All'];
          const keys = order.filter(k => packs[k]).concat(Object.keys(packs).filter(k => !order.includes(k)));
          const iconFor = (pack: string) => pack === 'Intro' ? '⭐' : pack === 'Arithmetic' ? '➕' : pack === 'Selectors' ? '🔀' : pack === 'Equivalence' ? '≡' : pack === 'Logic Only' ? '⚙️' : '🎯';
          return (
            <div className="packs">
              <div className="packs-head">
                <h2>Challenge Packs</h2>
                <p>Select a pack to start a themed set of challenges.</p>
              </div>
              <div className="packs-grid">
                {keys.map((pack) => {
                  const count = packs[pack]?.length || 0;
                  return (
                    <button
                      key={pack}
                      className="pack-card"
                      onClick={() => {
                        setCurrentPack(pack === 'All' ? undefined : pack);
                        const first = (packs[pack][0] || '').replace(/\.json$/, '');
                        if (first) navigate(`/play/${first}`);
                      }}
                      title={`${count} challenges`}
                    >
                      <div className="pack-emoji" aria-hidden>{iconFor(pack)}</div>
                      <div className="pack-title">{pack}</div>
                      <div className="pack-meta">{count} {count === 1 ? 'challenge' : 'challenges'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

