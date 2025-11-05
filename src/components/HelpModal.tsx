import './HelpModal.css';

export default function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h3>How to Play</h3>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>
        <div className="help-modal-body">
          <div className="help-grid">
            <div className="help-item">
              <div className="help-title">Goal</div>
              <div className="help-text">Make each output match its target value shown on the top bar.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Inputs / Outputs</div>
              <div className="help-text">
                Use the Inputs/Outputs panel on the left:
                <ul>
                  <li>Click an item to arm it, then click on the canvas to place.</li>
                  <li>Inputs show 0/1; Outputs show a target (→0/→1).</li>
                  <li>Delete returns them to the panel for reuse.</li>
                </ul>
              </div>
            </div>
            <div className="help-item">
              <div className="help-title">Components</div>
              <div className="help-text">
                Choose gates from Components:
                <ul>
                  <li>Click a gate to arm, then click the canvas to place.</li>
                  <li>Build with AND, OR, NOT, XOR, etc. to transform signals.</li>
                </ul>
              </div>
            </div>
            <div className="help-item">
              <div className="help-title">Wire</div>
              <div className="help-text">Click an output (right pin), then an input (left pin). Double‑click to snap.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Edit</div>
              <div className="help-text">Drag to move. Click to select. Press Delete to remove selected.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Run & Clear Canvas</div>
              <div className="help-text">Use Run and Clear Canvas on the right panel. On success, you’ll auto‑advance (or use Next).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


