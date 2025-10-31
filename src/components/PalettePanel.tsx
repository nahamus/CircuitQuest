import { useStore } from '../state/useStore';
import type { GateType } from '../models/types';
import './PalettePanel.css';

const GATE_NAMES: Record<GateType, string> = {
  INPUT: 'Input',
  OUTPUT: 'Output',
  AND: 'AND',
  OR: 'OR',
  XOR: 'XOR',
  NOT: 'NOT',
  BUF: 'Buffer',
  SPLIT: 'Split',
};

const GATE_DESCRIPTIONS: Record<GateType, string> = {
  INPUT: 'Provides input signal',
  OUTPUT: 'Output target',
  AND: 'Output = A AND B (both true)',
  OR: 'Output = A OR B (either true)',
  XOR: 'Output = A XOR B (different)',
  NOT: 'Output = NOT A (inverts)',
  BUF: 'Output = A (passes through)',
  SPLIT: 'Splits 1 input to 2 outputs',
};

export default function PalettePanel() {
  const { currentLevel, gates, armedGateType, setArmedGateType } = useStore();
  if (!currentLevel) return null;

  const getRemaining = (type: GateType): number => {
    if (type === 'INPUT' || type === 'OUTPUT') return 0;
    const used = gates.filter(g => g.type === type).length;
    return Math.max(0, currentLevel.palette[type] - used);
  };

  const canPlace = (type: GateType): boolean => {
    return getRemaining(type) > 0;
  };

  const handleClick = (type: GateType) => {
    if (canPlace(type)) {
      // Toggle: if already armed, disarm; otherwise arm this type
      setArmedGateType(armedGateType === type ? null : type);
    }
  };

  return (
    <div className="palette-panel panel">
      <h3>Components</h3>
      {armedGateType && (
        <div className="armed-notice">
          Click on canvas to place <strong>{GATE_NAMES[armedGateType]}</strong>
        </div>
      )}
      <div className="palette-list">
        {(Object.keys(currentLevel.palette) as GateType[])
          .filter(type => type !== 'INPUT' && type !== 'OUTPUT' && currentLevel.palette[type] > 0)
          .map(type => {
            const remaining = getRemaining(type);
            const disabled = !canPlace(type);
            const isArmed = armedGateType === type;
            return (
              <div
                key={type}
                className={`palette-item ${disabled ? 'disabled' : ''} ${isArmed ? 'armed' : ''}`}
                title={disabled ? 'No more available' : isArmed ? 'Click to cancel' : `Click to place ${GATE_NAMES[type]}`}
                onClick={() => handleClick(type)}
              >
                <div className="palette-item-name">{GATE_NAMES[type]}</div>
                <div className="palette-item-description">{GATE_DESCRIPTIONS[type]}</div>
                <div className="palette-item-count">{remaining} left</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
