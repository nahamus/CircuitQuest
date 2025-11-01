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
  const { loadLevel, sim, currentLevel, showHelp, setShowHelp } = useStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
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
    // Do not auto-advance on success; Next button is available on the overlay bar
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

