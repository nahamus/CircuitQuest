import { useStore } from '../state/useStore';
import type { GateType } from '../models/types';
import { playClick } from '../utils/sound';
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
  NAND: 'NAND',
  NOR: 'NOR',
  XNOR: 'XNOR',
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
  NAND: 'NOT(AND)',
  NOR: 'NOT(OR)',
  XNOR: 'NOT(XOR) (same)',
};

export default function PalettePanel() {
  const { currentLevel, gates, armedGateType, setArmedGateType, setSelection } = useStore();
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
    if (!canPlace(type)) return;
    // Clear any canvas selection to prevent replacing a selected gate
    setSelection();
    // Arm for placement only
    setArmedGateType(armedGateType === type ? null : type);
    playClick();
  };

  return (
    <div className="palette-panel panel">
      <h3>Components</h3>
      {armedGateType && (
        <div className="armed-notice compact" aria-live="polite">
          <div>Place <strong>{GATE_NAMES[armedGateType]}</strong> on canvas</div>
          <div className="armed-desc">{GATE_DESCRIPTIONS[armedGateType]}</div>
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
                className={`palette-item tile ${disabled ? 'disabled' : ''} ${isArmed ? 'armed' : ''}`}
                title={GATE_DESCRIPTIONS[type]}
                onClick={() => handleClick(type)}
              >
                <div className="tile-icon" aria-hidden>
                  {renderSymbol(type)}
                </div>
                <div className="tile-title">{GATE_NAMES[type]}</div>
                <div className="tile-count">{remaining}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function renderSymbol(type: GateType) {
  const size = 18;
  const stroke = '#cfd8e3';
  const sw = 2;
  switch (type) {
    case 'NOT':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="6,6 6,18 16,12" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx="18.5" cy="12" r="1.5" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'BUF':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <polygon points="6,6 6,18 16,12" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'AND':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M7 6 H12 A6 6 0 0 1 12 18 H7 Z" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'OR':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M6 6 C11 6, 13 6, 18 12 C13 18, 11 18, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M6 6 C7.5 9, 7.5 15, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'NOR':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M6 6 C11 6, 13 6, 18 12 C13 18, 11 18, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M6 6 C7.5 9, 7.5 15, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx="19.5" cy="12" r="1.5" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'XOR':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M6 6 C11 6, 13 6, 18 12 C13 18, 11 18, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M6 6 C7.5 9, 7.5 15, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M4.8 6 C6.3 9, 6.3 15, 4.8 18" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'XNOR':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M6 6 C11 6, 13 6, 18 12 C13 18, 11 18, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M6 6 C7.5 9, 7.5 15, 6 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M4.8 6 C6.3 9, 6.3 15, 4.8 18" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx="19.5" cy="12" r="1.5" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'NAND':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M7 6 H12 A6 6 0 0 1 12 18 H7 Z" fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx="19" cy="12" r="1.5" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case 'SPLIT':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M6 12 H12" stroke={stroke} strokeWidth={sw} />
          <path d="M12 12 L18 8" stroke={stroke} strokeWidth={sw} />
          <path d="M12 12 L18 16" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    default:
      return null;
  }
}
