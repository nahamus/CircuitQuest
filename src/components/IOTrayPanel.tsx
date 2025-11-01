import { useStore } from '../state/useStore';
import './IOTrayPanel.css';

export default function IOTrayPanel() {
  const { currentLevel, dockedIO, setArmedIO, armedIOId, setSelection } = useStore();
  if (!currentLevel) return null;

  const items = [...(currentLevel.inputs||[]), ...(currentLevel.outputs||[])].filter(g => dockedIO.includes(g.id));

  return (
    <div className="io-tray panel">
      <h3>Inputs/Outputs</h3>
      {armedIOId && (
        <div className="io-armed">Click on canvas to place</div>
      )}
      <div className="io-tray-list">
        {items.map(g => {
          const isArmed = armedIOId === g.id;
          return (
            <div
              key={g.id}
              className={`io-tray-item ${isArmed ? 'armed' : ''}`}
              title={g.target !== undefined ? `Target ${g.target ? '1' : '0'}` : (g.initial !== undefined ? `Initial ${g.initial ? '1' : '0'}` : '')}
              onClick={() => { setSelection(); setArmedIO(isArmed ? null : g.id); }}
            >
              <div className="io-tray-name">{g.label || g.id}</div>
              {g.target !== undefined && (
                <div className={`io-tray-badge ${g.target ? 't1' : 't0'}`}>{g.target ? '1' : '0'}</div>
              )}
              {g.initial !== undefined && (
                <div className={`io-tray-badge ${g.initial ? 't1' : 't0'}`}>{g.initial ? '1' : '0'}</div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="io-tray-empty">All placed on canvas</div>
        )}
      </div>
    </div>
  );
}


