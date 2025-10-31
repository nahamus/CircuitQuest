import { useStore } from '../state/useStore';
import './ObjectivePanel.css';

export default function ObjectivePanel() {
  const { currentLevel, sim } = useStore();
  if (!currentLevel) return null;

  const getOutputStatus = () => {
    if (!sim.last || !sim.last.outputs) return null;
    return currentLevel.outputs.map(output => {
      const result = sim.last?.outputs?.find(o => o.id === output.id);
      return {
        id: output.id,
        label: output.label || output.id,
        target: output.target,
        actual: result?.value,
        correct: result ? result.value === result.target : undefined,
      };
    });
  };

  const statuses = getOutputStatus();

  return (
    <div className="objective-panel panel">
      <h3>Goal</h3>
      <div className="outputs-section">
        <div className="value-list compact">
          {currentLevel.outputs.map(output => {
            const status = statuses?.find(s => s.id === output.id);
            return (
              <div key={output.id} className="value-item pill">
                <span className="value-label">{output.label || output.id}</span>
                <span className={`value-badge value-target ${output.target ? 'value-true' : 'value-false'}`}>
                  {output.target ? '1' : '0'}
                </span>
                {status && status.correct !== undefined && (
                  <span className={`check-status ${status.correct ? 'check-correct' : 'check-incorrect'}`}>
                    {status.correct ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentLevel.maxComponents && (
        <div className="constraints subtle">
          <small>Max components: {currentLevel.maxComponents}</small>
        </div>
      )}
    </div>
  );
}


