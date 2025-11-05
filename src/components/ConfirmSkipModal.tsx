import './ConfirmSkipModal.css';

export default function ConfirmSkipModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="cs-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="cs-title">
      <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cs-header">
          <h3 id="cs-title">Skip Level?</h3>
        </div>
        <div className="cs-body">
          <p>You haven't submitted this level yet. Are you sure you want to skip to the next level?</p>
        </div>
        <div className="cs-footer">
          <button className="cs-btn" onClick={onCancel}>Cancel</button>
          <button className="cs-btn primary" onClick={onConfirm}>Next</button>
        </div>
      </div>
    </div>
  );
}


