import './TruthTableModal.css';

type TableSpec = { title: string; headers: string[]; rows: (string|number)[][] };

export default function TruthTableModal({ tables, onClose }: { tables: TableSpec[]; onClose: () => void }) {
  return (
    <div className="tt-overlay" onClick={onClose}>
      <div className="tt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tt-header">
          <h3>Truth Table</h3>
          <button className="tt-close" onClick={onClose}>✕</button>
        </div>
        <div className="tt-body">
          <div className="tt-grid">
            {tables.map((t, idx) => (
              <div key={idx} className="tt-card">
                <div className="tt-title">{t.title}</div>
                <table className="tt-table">
                  <thead>
                    <tr>
                      {t.headers.map((h) => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((c, j) => <td key={j}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


