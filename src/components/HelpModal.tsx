import React from 'react';
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
              <div className="help-text">Build logic circuits that make outputs match their targets.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Place</div>
              <div className="help-text">Click a component on the left, then click on the canvas.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Wire</div>
              <div className="help-text">Click an output (right dot), then an input (left dot). Double-click to snap.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Edit</div>
              <div className="help-text">Drag to move. Click to select. Press Delete to remove.</div>
            </div>
            <div className="help-item">
              <div className="help-title">View</div>
              <div className="help-text">Right-drag to pan. Ctrl/Cmd + wheel to zoom.</div>
            </div>
            <div className="help-item">
              <div className="help-title">Run</div>
              <div className="help-text">Click Run to test. Use Next to progress after success.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


