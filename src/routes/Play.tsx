import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import { fetchLevelIndex } from '../services/levels';
import TopBar from '../components/TopBar';
import HelpModal from '../components/HelpModal';
import PalettePanel from '../components/PalettePanel';
import CircuitCanvas from '../components/CircuitCanvas';
import ScorePanel from '../components/ScorePanel';
// Objective panel removed from sidebar
import IOTrayPanel from '../components/IOTrayPanel';
import Toast from '../components/Toast';
import './Play.css';

export default function Play() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadLevel, sim, currentLevel } = useStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [levelIds, setLevelIds] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadLevel(id).catch((err) => {
        console.error('Failed to load level:', err);
        navigate('/');
      });
    }
  }, [id, loadLevel, navigate]);

  // Load level index for progression
  useEffect(() => {
    fetchLevelIndex()
      .then(ids => setLevelIds(ids.map(s => s.replace(/\.json$/, ''))))
      .catch(err => console.error('Failed to fetch level index', err));
  }, []);

  useEffect(() => {
    if (!sim.last) return;

    setToast({
      message: sim.last.message || (sim.last.success ? 'Success!' : 'Failed'),
      type: sim.last.success ? 'success' : 'error',
    });

    // Auto-advance on success to the next level if available
    if (sim.last.success && currentLevel) {
      const idx = levelIds.indexOf(currentLevel.id);
      const nextId = idx >= 0 && idx + 1 < levelIds.length ? levelIds[idx + 1] : undefined;
      if (nextId) {
        const t = setTimeout(() => navigate(`/play/${nextId}`), 1200);
        return () => clearTimeout(t);
      } else if (levelIds.length > 0) {
        // No more levels
        setToast({ message: 'All challenges complete! 🎉', type: 'success' });
      }
    }
  }, [sim.last, currentLevel?.id, levelIds, navigate]);

  if (!currentLevel) {
    return <div className="loading">Loading level...</div>;
  }

  return (
    <div className="play">
      <TopBar />
      <div className="play-content">
        <div className="play-left">
          <IOTrayPanel />
          <PalettePanel />
        </div>
        <CircuitCanvas />
        <ScorePanel />
      </div>
      <button className="help-fab" title="How to Play" onClick={() => setShowHelp(true)}>?</button>
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

