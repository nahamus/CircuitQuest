import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import TopBar from '../components/TopBar';
import PalettePanel from '../components/PalettePanel';
import CircuitCanvas from '../components/CircuitCanvas';
import ScorePanel from '../components/ScorePanel';
import ObjectivePanel from '../components/ObjectivePanel';
import Toast from '../components/Toast';
import './Play.css';

export default function Play() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadLevel, sim, currentLevel } = useStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (id) {
      loadLevel(id).catch((err) => {
        console.error('Failed to load level:', err);
        navigate('/');
      });
    }
  }, [id, loadLevel, navigate]);

  useEffect(() => {
    if (sim.last) {
      setToast({
        message: sim.last.message || (sim.last.success ? 'Success!' : 'Failed'),
        type: sim.last.success ? 'success' : 'error',
      });
    }
  }, [sim.last]);

  if (!currentLevel) {
    return <div className="loading">Loading level...</div>;
  }

  return (
    <div className="play">
      <TopBar />
      <div className="play-content">
        <div className="play-left">
          <ObjectivePanel />
          <PalettePanel />
        </div>
        <CircuitCanvas />
        <ScorePanel />
      </div>
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

