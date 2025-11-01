import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/useStore';
import './TopBar.css';

export default function TopBar() {
  const navigate = useNavigate();
  const { currentLevel } = useStore();

  if (!currentLevel) return null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button onClick={() => navigate('/')}>← Back to Menu</button>
      </div>
      <div className="topbar-center" />
      <div className="topbar-right" />
    </div>
  );
}

