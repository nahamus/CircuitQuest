import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLevelIndex } from '../services/levels';
import { useStore } from '../state/useStore';
import type { Gate, Wire, GateType } from '../models/types';
import clsx from 'clsx';
import './CircuitCanvas.css';
import { playClick, playSnap } from '../utils/sound';
import TruthTableModal from './TruthTableModal';

const GATE_COLORS: Record<GateType, string> = {
  INPUT: '#3cfaa5',
  OUTPUT: '#ff6b6b',
  AND: '#12dbff',
  OR: '#ffa94d',
  XOR: '#d96dff',
  NOT: '#ffe066',
  BUF: '#7aa2ff',
  SPLIT: '#5cf2c2',
  NAND: '#00c2d4',
  NOR: '#ff7b6b',
  XNOR: '#b48ef6',
};

const GATE_LABELS: Record<GateType, string> = {
  INPUT: 'I',
  OUTPUT: 'O',
  AND: '&',
  OR: '≥1',
  XOR: '=1',
  NOT: '1',
  BUF: '1',
  SPLIT: 'T',
  NAND: '⊼',
  NOR: '⊽',
  XNOR: '≡',
};

export default function CircuitCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const navigate = useNavigate();
  const [levelIds, setLevelIds] = useState<string[]>([]);
  const [dragging, setDragging] = useState<{ gateId: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  const {
    gates,
    wires,
    ui,
    selection,
    wireStart,
    armedGateType,
    armedIOId,
    setSelection,
    placeGate,
    placeIO,
    moveGate,
    startWire,
    completeWire,
    deleteSelection,
    setZoom,
    setOffset,
    setArmedGateType,
    fitToView,
    currentLevel,
    sim,
    showTruthTable,
    setTruthTableVisible,
    hintSubIndex,
  } = useStore();

  // Load level ids for Next button
  useEffect(() => {
    fetchLevelIndex()
      .then(ids => setLevelIds(ids.map(s => s.replace(/\.json$/, ''))))
      .catch(() => {});
  }, []);

  

  // Auto-fit view when level loads
  useEffect(() => {
    if (currentLevel && gates.length > 0) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          fitToView();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentLevel?.id, fitToView]);

  const snapToGrid = useCallback((x: number, y: number): [number, number] => {
    const snap = ui.gridSnap;
    return [Math.round(x / snap) * snap, Math.round(y / snap) * snap];
  }, [ui.gridSnap]);

  // worldToScreen helper removed (unused)

  const screenToWorld = useCallback((x: number, y: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [x, y];
    const viewBox = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const svgWidth = rect.width;
    const svgHeight = rect.height;
    
    // Account for preserveAspectRatio="xMidYMin meet"
    const viewBoxAspect = viewBox.width / viewBox.height;
    const svgAspect = svgWidth / svgHeight;
    
    let scale: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (viewBoxAspect > svgAspect) {
      // ViewBox is wider - letterboxing (bars top/bottom), YMin => align to top (no vertical offset)
      scale = svgWidth / viewBox.width;
      offsetY = 0;
    } else {
      // ViewBox is taller - pillarboxing (bars left/right), keep horizontal centering
      scale = svgHeight / viewBox.height;
      const scaledWidth = viewBox.width * scale;
      offsetX = (svgWidth - scaledWidth) / 2;
      offsetY = 0;
    }
    
    // Convert screen coordinates, accounting for letterboxing/pillarboxing
    const worldX = ((x - offsetX) / scale) + viewBox.x;
    const worldY = ((y - offsetY) / scale) + viewBox.y;
    
    return [worldX, worldY];
  }, []);

  // Track actual SVG pixel size locally to keep object size constant on window resize
  useEffect(() => {
    const target = svgRef.current;
    if (!target) return;
    const update = () => {
      const r = target.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setViewport({ w: Math.floor(r.width), h: Math.floor(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(target);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(ui.zoom * delta);
      } else {
        setOffset(ui.offsetX - e.deltaX / ui.zoom, ui.offsetY - e.deltaY / ui.zoom);
      }
    };

    let panning = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        panning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (panning) {
        const dx = (e.clientX - lastX) / ui.zoom;
        const dy = (e.clientY - lastY) / ui.zoom;
        setOffset(ui.offsetX + dx, ui.offsetY + dy);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      panning = false;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [ui.zoom, ui.offsetX, ui.offsetY, setZoom, setOffset]);

  // Handle Delete/Backspace to delete selection (IO will return to tray)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelection]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const [sx, sy] = snapToGrid(wx, wy);

    if (armedGateType) {
      // Prevent placing on top of INPUT/OUTPUT or within the top floating bar
      const snap = ui.gridSnap;
      const gateHalf = (snap * 0.8) / 2;
      const hitIO = gates.some(g =>
        (g.type === 'INPUT' || g.type === 'OUTPUT') &&
        Math.abs(sx - g.x) <= gateHalf &&
        Math.abs(sy - g.y) <= gateHalf
      );
      if (hitIO) {
        // Ignore placement; keep armed so user can click elsewhere
        return;
      }
      placeGate(armedGateType, sx, sy);
      playClick();
      setArmedGateType(null);
    } else if (armedIOId) {
      // Place IO from tray
      placeIO(armedIOId, sx, sy);
      playClick();
    } else {
      setSelection();
    }
  }, [armedGateType, armedIOId, screenToWorld, snapToGrid, placeGate, placeIO, setSelection]);

  const handleGateMouseDown = useCallback((e: React.MouseEvent, gate: Gate) => {
    e.stopPropagation();
    if (e.button === 0) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        // Store the offset from the gate center to where the mouse clicked
        const offsetX = wx - gate.x;
        const offsetY = wy - gate.y;
        setSelection(gate.id);
        setDragging({ 
          gateId: gate.id, 
          startX: e.clientX, 
          startY: e.clientY,
          offsetX,
          offsetY
        });
      }
    }
  }, [setSelection, screenToWorld]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !dragging) return;
      const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      // Use the raw world coordinates minus the offset to maintain relative position
      moveGate(dragging.gateId, wx - dragging.offsetX, wy - dragging.offsetY);
    };

    const handleUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, screenToWorld, snapToGrid, moveGate]);

  const renderGate = (gate: Gate) => {
    // Use gate coordinates directly since viewBox handles scaling
    const sx = gate.x;
    const sy = gate.y;
    const snap = ui.gridSnap;
    const width = snap * 1.12;
    const height = snap * 1.12;
    const portSize = snap * 0.22;
    const isSelected = selection.gateId === gate.id;

    const hasDiagram =
      gate.type === 'AND' || gate.type === 'OR' || gate.type === 'XOR' ||
      gate.type === 'NOT' || gate.type === 'BUF' || gate.type === 'SPLIT' ||
      gate.type === 'NAND' || gate.type === 'NOR' || gate.type === 'XNOR';

    return (
      <g
        key={gate.id}
        className={clsx('gate', isSelected && 'selected')}
        transform={`translate(${sx}, ${sy})`}
        onMouseDown={(e) => handleGateMouseDown(e, gate)}
        onClick={(e) => { e.stopPropagation(); setSelection(gate.id); }}
      >
        {gate.type === 'OUTPUT' ? (
          // Render OUTPUT as a bulb
          <>
            <circle
              className={clsx('bulb-body', isSelected && 'selected')}
              cx={0}
              cy={0}
              r={width / 2}
              fill={GATE_COLORS[gate.type]}
              opacity={0.6}
            />
            {(() => {
              const inputVal = gates.find(g => g.id === gate.id)?.inputs[0]?.value;
              const met = inputVal === gate.target;
              return met ? (
                <circle cx={0} cy={0} r={width * 0.55} className="bulb-ring" />
              ) : null;
            })()}
            {/* Output label inside bulb */}
            {gate.label && (
              <text
                x={0}
                y={0}
                className="gate-value-label"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={`${Math.min(width, height) * 0.22}`}
                style={{ fontWeight: 700, opacity: 0.95 }}
              >
                {gate.label}
              </text>
            )}
          </>
        ) : (
          <>
            <rect
              className={clsx('gate-body', isSelected && 'selected')}
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              rx={Math.max(4, width * 0.1)}
              ry={Math.max(4, height * 0.1)}
              fill={GATE_COLORS[gate.type]}
              opacity={gate.type === 'INPUT' ? 0.5 : 0.28}
            />
            {/* Gate diagram shapes */}
            {gate.type === 'NOT' && (
              <>
                <polygon
                  points={`${-width*0.32},${-height*0.35} ${-width*0.32},${height*0.35} ${width*0.32},0`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2}
                />
                <circle cx={width*0.36} cy={0} r={width*0.055} fill="none" stroke="#e0e0e0" strokeWidth={2} />
              </>
            )}
            {gate.type === 'BUF' && (
              <polygon
                points={`${-width*0.32},${-height*0.35} ${-width*0.32},${height*0.35} ${width*0.32},0`}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth={2}
              />
            )}
            {gate.type === 'AND' && (
              <path
                d={`M ${-width*0.35} ${-height*0.35} L 0 ${-height*0.35} A ${width*0.35} ${height*0.35} 0 0 1 0 ${height*0.35} L ${-width*0.35} ${height*0.35} Z`}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth={2}
              />
            )}
            {gate.type === 'NAND' && (
              <>
                <path
                  d={`M ${-width*0.35} ${-height*0.35} L 0 ${-height*0.35} A ${width*0.35} ${height*0.35} 0 0 1 0 ${height*0.35} L ${-width*0.35} ${height*0.35} Z`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2}
                />
                <circle cx={width*0.36} cy={0} r={width*0.055} fill="none" stroke="#e0e0e0" strokeWidth={2} />
              </>
            )}
            {gate.type === 'OR' && (
              <>
                <path
                  d={`M ${-width*0.32} ${-height*0.35} C ${-width*0.02} ${-height*0.35}, ${width*0.18} ${-height*0.25}, ${width*0.35} 0 C ${width*0.18} ${height*0.25}, ${-width*0.02} ${height*0.35}, ${-width*0.32} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.36} ${-height*0.35} C ${-width*0.30} ${-height*0.10}, ${-width*0.30} ${height*0.10}, ${-width*0.36} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
              </>
            )}
            {gate.type === 'NOR' && (
              <>
                <path
                  d={`M ${-width*0.32} ${-height*0.35} C ${-width*0.02} ${-height*0.35}, ${width*0.18} ${-height*0.25}, ${width*0.35} 0 C ${width*0.18} ${height*0.25}, ${-width*0.02} ${height*0.35}, ${-width*0.32} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.36} ${-height*0.35} C ${-width*0.30} ${-height*0.10}, ${-width*0.30} ${height*0.10}, ${-width*0.36} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <circle cx={width*0.38} cy={0} r={width*0.055} fill="none" stroke="#e0e0e0" strokeWidth={2.2} />
              </>
            )}
            {gate.type === 'XOR' && (
              <>
                <path
                  d={`M ${-width*0.32} ${-height*0.35} C ${-width*0.02} ${-height*0.35}, ${width*0.18} ${-height*0.25}, ${width*0.35} 0 C ${width*0.18} ${height*0.25}, ${-width*0.02} ${height*0.35}, ${-width*0.32} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.36} ${-height*0.35} C ${-width*0.30} ${-height*0.10}, ${-width*0.30} ${height*0.10}, ${-width*0.36} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.44} ${-height*0.35} C ${-width*0.38} ${-height*0.10}, ${-width*0.38} ${height*0.10}, ${-width*0.44} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.4}
                />
              </>
            )}
            {gate.type === 'XNOR' && (
              <>
                <path
                  d={`M ${-width*0.32} ${-height*0.35} C ${-width*0.02} ${-height*0.35}, ${width*0.18} ${-height*0.25}, ${width*0.35} 0 C ${width*0.18} ${height*0.25}, ${-width*0.02} ${height*0.35}, ${-width*0.32} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.36} ${-height*0.35} C ${-width*0.30} ${-height*0.10}, ${-width*0.30} ${height*0.10}, ${-width*0.36} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.2}
                />
                <path
                  d={`M ${-width*0.44} ${-height*0.35} C ${-width*0.38} ${-height*0.10}, ${-width*0.38} ${height*0.10}, ${-width*0.44} ${height*0.35}`}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth={2.4}
                />
                <circle cx={width*0.38} cy={0} r={width*0.055} fill="none" stroke="#e0e0e0" strokeWidth={2.2} />
              </>
            )}
            {gate.type === 'SPLIT' && (
              <>
                <path d={`M ${-width*0.25} 0 H 0`} stroke="#e0e0e0" strokeWidth={2} />
                <path d={`M 0 0 L ${width*0.25} ${-height*0.2}`} stroke="#e0e0e0" strokeWidth={2} />
                <path d={`M 0 0 L ${width*0.25} ${height*0.2}`} stroke="#e0e0e0" strokeWidth={2} />
              </>
            )}
            {gate.type === 'INPUT' && (
              <>
                {gate.label && (
                  (() => {
                    const pocketW = Math.max(10, width * 0.24);
                    const pocketH = Math.max(10, height * 0.45);
                    const px = -width / 2 - pocketW; // attach flush to the square
                    const py = -pocketH / 2;
                    const radius = 3;
                    const labelSize = pocketH * 0.42;
                    return (
                      <g className="input-pocket">
                        <rect x={px} y={py} width={pocketW} height={pocketH} rx={radius} ry={radius}
                          fill="#1a1a24" stroke="#444" strokeWidth={1.4} />
                        <text
                          x={px + pocketW / 2}
                          y={0}
                          className="gate-value-label"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={`${labelSize}`}
                          style={{ fontWeight: 600, opacity: 0.9 }}
                        >
                          {gate.label}
                        </text>
                      </g>
                    );
                  })()
                )}
                <text
                  x={0}
                  y={0}
                  className="gate-value-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={`${Math.min(width, height) * 0.5}`}
                  style={{ fontWeight: 800 }}
                >
                  {gate.initial ? '1' : '0'}
                </text>
              </>
            )}
          </>
        )}
        {gate.inputs.map((port, idx) => {
          const portY = ((idx + 1) / (gate.inputs.length + 1)) * height - height / 2;
          const isActive = port.value === true;
          const cx = -width / 2 - portSize / 2;
          const cy = portY;
          return (
            <g key={port.id}>
              <circle
                className="port-hit"
                cx={cx}
                cy={cy}
                r={portSize * 1.6}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (wireStart) {
                    completeWire(gate.id, port.index);
                    setMousePos(null);
                    playSnap();
                  }
                }}
              />
              {isActive && (
                <circle className="port-halo" cx={cx} cy={cy} r={portSize * 0.9} />
              )}
              <circle
                className={clsx('gate-input', isActive ? 'active' : 'inactive')}
                cx={cx}
                cy={cy}
                r={portSize * 0.6}
              />
            </g>
          );
        })}
        {gate.outputs.map((port, idx) => {
          const portY = ((idx + 1) / (gate.outputs.length + 1)) * height - height / 2;
          const isActive = gate.type === 'INPUT' ? !!gate.initial : port.value === true;
          const cx = width / 2 + portSize / 2;
          const cy = portY;
          return (
            <g key={port.id}>
              <circle
                className="port-hit"
                cx={cx}
                cy={cy}
                r={portSize * 1.8}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const portWorldX = gate.x + (width / 2 + portSize / 2) + (portSize * 0.6);
                  const portWorldY = gate.y + portY;
                  startWire(gate.id, port.index);
                  setMousePos({ x: portWorldX, y: portWorldY });
                  playClick();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const portWorldX = gate.x + (width / 2 + portSize / 2) + (portSize * 0.6);
                  const portWorldY = gate.y + portY;
                  startWire(gate.id, port.index);
                  setMousePos({ x: portWorldX, y: portWorldY });
                  playClick();
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const portWorldX = gate.x + (width / 2 + portSize / 2) + (portSize * 0.6);
                  const portWorldY = gate.y + portY;
                  startWire(gate.id, port.index);
                  setMousePos({ x: portWorldX, y: portWorldY });
                  playClick();
                }}
              />
              {isActive && (
                <circle className="port-halo" cx={cx} cy={cy} r={portSize * 0.95} />
              )}
              <circle
                className={clsx('gate-output', isActive ? 'active' : 'inactive')}
                cx={cx}
                cy={cy}
                r={portSize * 0.6}
              />
            </g>
          );
        })}
        {gate.label && gate.type !== 'INPUT' && gate.type !== 'OUTPUT' && (
          <text
            className="gate-label"
            x={0}
            y={height / 2 + 12}
            textAnchor="middle"
          >
            {gate.label}
          </text>
        )}
        {!gate.label && !hasDiagram && gate.type !== 'INPUT' && gate.type !== 'OUTPUT' && (
          <text
            className="gate-label"
            x={0}
            y={0}
            dy="0.3em"
          >
            {GATE_LABELS[gate.type]}
          </text>
        )}
      </g>
    );
  };

  const renderWire = (wire: Wire) => {
    const isSelected = selection.wireId === wire.id;
    const isActive = ui.showLivePath ? liveActiveWireIds.has(wire.id) : false;

    // Check if wire has valid path
    if (!wire.path || wire.path.length < 2) {
      return null;
    }

    // Use path coordinates directly - ensure proper format for SVG path
    const pathStr = wire.path.map((p, idx) => {
      return `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ');

    return (
      <path
        key={wire.id}
        className={clsx('wire', isActive && 'active', isSelected && 'selected')}
        d={pathStr}
        onClick={(e) => {
          e.stopPropagation();
          setSelection(undefined, wire.id);
        }}
      />
    );
  };

  const renderRubberBand = () => {
    if (!wireStart || !mousePos) return null;
    
    // Create a Manhattan path from wireStart to mouse position for preview
    const x1 = wireStart.x;
    const y1 = wireStart.y;
    const x2 = mousePos.x;
    const y2 = mousePos.y;
    
    // Simple Manhattan routing preview
    const midX = x2;
    const midY = y1;
    
    const pathStr = `M ${x1} ${y1} L ${midX} ${midY} L ${x2} ${y2}`;

    return (
      <path
        className="wire"
        d={pathStr}
        strokeDasharray="5,5"
        opacity={0.7}
        strokeWidth={2}
      />
    );
  };

  const renderGhostGate = () => {
    if (!armedGateType || !mousePos || !currentLevel) return null;
    // Snap to grid for ghost gate placement
    const [sx, sy] = snapToGrid(mousePos.x, mousePos.y);
    const snap = ui.gridSnap;
    const width = snap * 1.12;
    const height = snap * 1.12;
    const stroke = GATE_COLORS[armedGateType];
    const sw = 2;

    const shape = (() => {
      switch (armedGateType) {
        case 'NOT':
          return (
            <>
              <polygon
                points={`${-width*0.25},${-height*0.3} ${-width*0.25},${height*0.3} ${width*0.25},0`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <circle cx={width*0.3} cy={0} r={width*0.05} fill="none" stroke={stroke} strokeWidth={sw} opacity={0.85} />
            </>
          );
        case 'BUF':
          return (
            <polygon
              points={`${-width*0.25},${-height*0.3} ${-width*0.25},${height*0.3} ${width*0.25},0`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              opacity={0.85}
            />
          );
        case 'AND':
          return (
            <path
              d={`M ${-width*0.25} ${-height*0.3} L 0 ${-height*0.3} A ${width*0.25} ${height*0.3} 0 0 1 0 ${height*0.3} L ${-width*0.25} ${height*0.3} Z`}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              opacity={0.85}
            />
          );
        case 'NAND':
          return (
            <>
              <path
                d={`M ${-width*0.25} ${-height*0.3} L 0 ${-height*0.3} A ${width*0.25} ${height*0.3} 0 0 1 0 ${height*0.3} L ${-width*0.25} ${height*0.3} Z`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <circle cx={width*0.3} cy={0} r={width*0.05} fill="none" stroke={stroke} strokeWidth={sw} opacity={0.85} />
            </>
          );
        case 'OR':
          return (
            <>
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.05} ${-height*0.3}, ${width*0.05} ${-height*0.3}, ${width*0.3} 0 C ${width*0.05} ${height*0.3}, ${-width*0.05} ${height*0.3}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.25} ${-height*0.1}, ${-width*0.25} ${height*0.1}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
            </>
          );
        case 'NOR':
          return (
            <>
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.05} ${-height*0.3}, ${width*0.05} ${-height*0.3}, ${width*0.3} 0 C ${width*0.05} ${height*0.3}, ${-width*0.05} ${height*0.3}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.25} ${-height*0.1}, ${-width*0.25} ${height*0.1}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <circle cx={width*0.32} cy={0} r={width*0.05} fill="none" stroke={stroke} strokeWidth={sw} opacity={0.85} />
            </>
          );
        case 'XOR':
          return (
            <>
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.05} ${-height*0.3}, ${width*0.05} ${-height*0.3}, ${width*0.3} 0 C ${width*0.05} ${height*0.3}, ${-width*0.05} ${height*0.3}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.25} ${-height*0.1}, ${-width*0.25} ${height*0.1}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.42} ${-height*0.3} C ${-width*0.37} ${-height*0.1}, ${-width*0.37} ${height*0.1}, ${-width*0.42} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw + 0.5}
                opacity={0.85}
              />
            </>
          );
        case 'XNOR':
          return (
            <>
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.05} ${-height*0.3}, ${width*0.05} ${-height*0.3}, ${width*0.3} 0 C ${width*0.05} ${height*0.3}, ${-width*0.05} ${height*0.3}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.3} ${-height*0.3} C ${-width*0.25} ${-height*0.1}, ${-width*0.25} ${height*0.1}, ${-width*0.3} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                opacity={0.85}
              />
              <path
                d={`M ${-width*0.42} ${-height*0.3} C ${-width*0.37} ${-height*0.1}, ${-width*0.37} ${height*0.1}, ${-width*0.42} ${height*0.3}`}
                fill="none"
                stroke={stroke}
                strokeWidth={sw + 0.5}
                opacity={0.85}
              />
              <circle cx={width*0.32} cy={0} r={width*0.05} fill="none" stroke={stroke} strokeWidth={sw} opacity={0.85} />
            </>
          );
        case 'SPLIT':
          return (
            <>
              <path d={`M ${-width*0.25} 0 H 0`} stroke={stroke} strokeWidth={sw} opacity={0.85} />
              <path d={`M 0 0 L ${width*0.25} ${-height*0.2}`} stroke={stroke} strokeWidth={sw} opacity={0.85} />
              <path d={`M 0 0 L ${width*0.25} ${height*0.2}`} stroke={stroke} strokeWidth={sw} opacity={0.85} />
            </>
          );
        default:
          return null;
      }
    })();

    return (
      <g className="ghost-gate" transform={`translate(${sx}, ${sy})`} opacity={0.75}>
        {shape}
      </g>
    );
  };

  const renderFloatingBar = () => {
    // No visual bar in SVG; we use the HTML overlay for visuals
    return null;
  };


  if (!currentLevel) return null;

  // Derive viewBox from viewport and UI zoom/offset so object sizes remain constant on resize
  const viewBoxWidth = Math.max(1, (viewport.w || 1) / Math.max(0.0001, ui.zoom));
  const viewBoxHeight = Math.max(1, (viewport.h || 1) / Math.max(0.0001, ui.zoom));
  const minX = -ui.offsetX;
  const minY = -ui.offsetY;

  // Live guide evaluation: compute which wires carry a logical 1 from current inputs
  const liveActiveWireIds = useMemo(() => {
    if (!ui.showLivePath) return new Set<string>();
    // Local maps of signal values
    const outVals = new Map<string, Map<number, boolean | undefined>>(); // gateId -> outIndex -> value
    const inVals = new Map<string, Map<number, boolean | undefined>>(); // gateId -> inIndex -> value

    const getOut = (g: Gate, idx: number) => (outVals.get(g.id)?.get(idx));
    const setOut = (g: Gate, idx: number, v: boolean | undefined) => {
      let m = outVals.get(g.id); if (!m) { m = new Map(); outVals.set(g.id, m); }
      const prev = m.get(idx);
      if (prev !== v) { m.set(idx, v); return true; }
      return false;
    };
    const getIn = (g: Gate, idx: number) => (inVals.get(g.id)?.get(idx));
    const setIn = (g: Gate, idx: number, v: boolean | undefined) => {
      let m = inVals.get(g.id); if (!m) { m = new Map(); inVals.set(g.id, m); }
      const prev = m.get(idx);
      if (prev !== v) { m.set(idx, v); return true; }
      return false;
    };

    // Initialize inputs
    gates.forEach(g => {
      if (g.type === 'INPUT') {
        setOut(g, 0, !!g.initial);
      }
    });

    const evalGate = (g: Gate): boolean => {
      // Returns true if any output changed
      const iv = (i: number) => (getIn(g, i));
      const writeSingle = (v: boolean | undefined) => setOut(g, 0, v);
      const writeSplit = (v: boolean | undefined) => {
        const a = setOut(g, 0, v);
        const b = setOut(g, 1, v);
        return a || b;
      };
      switch (g.type) {
        case 'INPUT':
          return false;
        case 'BUF':
          return writeSingle(iv(0));
        case 'NOT':
          return writeSingle(iv(0) === undefined ? undefined : !iv(0)!);
        case 'SPLIT':
          return writeSplit(iv(0));
        case 'AND': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : !!(a && b);
          return writeSingle(v);
        }
        case 'NAND': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : !(a && b);
          return writeSingle(v);
        }
        case 'OR': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : !!(a || b);
          return writeSingle(v);
        }
        case 'NOR': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : !(a || b);
          return writeSingle(v);
        }
        case 'XOR': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : (!!a !== !!b);
          return writeSingle(v);
        }
        case 'XNOR': {
          const a = iv(0); const b = iv(1);
          const v = (a === undefined || b === undefined) ? undefined : (!!a === !!b);
          return writeSingle(v);
        }
        case 'OUTPUT':
          return false;
        default:
          return false;
      }
    };

    // Iterate propagation until stable or max passes
    const maxPasses = gates.length + wires.length + 5;
    for (let pass = 0; pass < maxPasses; pass++) {
      let changed = false;
      // Propagate along wires
      wires.forEach(w => {
        const from = gates.find(g => g.id === w.fromGateId);
        const to = gates.find(g => g.id === w.toGateId);
        if (!from || !to) return;
        const v = getOut(from, w.fromPortIndex);
        if (v !== undefined) {
          changed = setIn(to, w.toPortIndex, v) || changed;
        }
      });
      // Evaluate gates
      gates.forEach(g => {
        changed = evalGate(g) || changed;
      });
      if (!changed) break;
    }

    const active = new Set<string>();
    wires.forEach(w => {
      const from = gates.find(g => g.id === w.fromGateId);
      if (!from) return;
      const v = getOut(from, w.fromPortIndex);
      if (v === true) active.add(w.id);
    });
    return active;
  }, [ui.showLivePath, gates, wires]);

  // Build truth tables for component gates in the palette
  const buildComponentTruthTables = useCallback((): { title: string; headers: string[]; rows: (string|number)[][] }[] => {
    if (!currentLevel) return [];
    const has = (t: GateType) => currentLevel.palette && currentLevel.palette[t] > 0;
    const tables: { title: string; headers: string[]; rows: (string|number)[][] }[] = [];

    const twoInput = (title: string, fn: (a: number, b: number) => number) => {
      const rows: (string|number)[][] = [
        [0, 0, fn(0, 0)],
        [0, 1, fn(0, 1)],
        [1, 0, fn(1, 0)],
        [1, 1, fn(1, 1)],
      ];
      tables.push({ title, headers: ['A','B','F'], rows });
    };
    const oneInput = (title: string, fn: (a: number) => number) => {
      const rows: (string|number)[][] = [
        [0, fn(0)],
        [1, fn(1)],
      ];
      tables.push({ title, headers: ['A','F'], rows });
    };

    if (has('AND')) twoInput('AND', (a,b) => a & b);
    if (has('NAND')) twoInput('NAND', (a,b) => (a & b) ? 0 : 1);
    if (has('OR')) twoInput('OR', (a,b) => (a | b));
    if (has('NOR')) twoInput('NOR', (a,b) => (a | b) ? 0 : 1);
    if (has('XOR')) twoInput('XOR', (a,b) => (a ^ b));
    if (has('XNOR')) twoInput('XNOR', (a,b) => (a ^ b) ? 0 : 1);
    if (has('NOT')) oneInput('NOT', (a) => a ? 0 : 1);
    if (has('BUF')) oneInput('BUF', (a) => a);
    // SPLIT has no logical truth table; it is a routing element

    return tables;
  }, [currentLevel]);

  return (
    <div ref={containerRef} className={clsx('circuit-canvas-container', sim.running && 'sim-running', sim.last?.success && 'sim-success')}>
      {/* Responsive overlay bar (HTML) for clean visuals */}
      <div ref={overlayRef} className="io-overlay" />
      <div className="io-overlay-controls">
        <div className="ioc-left">
          <div className="ioc-title">{currentLevel?.title}</div>
          {currentLevel?.description && (
            <div className="ioc-sub">{currentLevel.description}</div>
          )}
          {currentLevel && (
            <div className="ioc-goal">
              <span style={{ marginRight: 8, color: '#9fb3c8' }}>Goal:</span>
              {currentLevel.outputs.map(o => (
                <span key={o.id} className="ioc-goal-pill">
                  <span className={`ioc-dot ${o.target ? 't1' : 't0'}`} />
                  <span className="ioc-goal-label">{(o.label || o.id)}</span>
                  <span className="ioc-goal-val">{o.target ? '1' : '0'}</span>
                </span>
              ))}
            </div>
          )}
          {sim?.last && (
            <div className={`ioc-sim ${sim.last.success ? 'success' : 'error'}`}>
              {sim.last.success ? (
                <>
                  <span className="ioc-sim-icon">✓</span>
                  <span>All outputs correct!</span>
                </>
              ) : (
                <span className="ioc-sim-details">
                  {sim.last.outputs && sim.last.outputs.length > 0
                    ? sim.last.outputs
                        .filter(o => o.value !== o.target)
                        .map(o => {
                          const label = currentLevel?.outputs.find(g => g.id === o.id)?.label || o.id;
                          return `${label}: expected ${o.target ? '1' : '0'}, got ${o.value ? '1' : '0'}`;
                        })
                        .join(' • ')
                    : 'Some outputs are incorrect.'}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="ioc-center">
          {currentLevel?.hints?.subGoals && hintSubIndex > 0 && (
            <div className="ioc-hint" title="Sub-goal">
              💡 {currentLevel.hints.subGoals[hintSubIndex - 1]}
            </div>
          )}
        </div>
        <div className="ioc-right">
          {currentLevel && (
            (() => {
              const idx = levelIds.indexOf(currentLevel.id);
              const nextId = idx >= 0 && idx + 1 < levelIds.length ? levelIds[idx + 1] : undefined;
              return (
                <>
                  <button className="ioc-next" disabled={!nextId} onClick={() => nextId && navigate(`/play/${nextId}`)}>
                    Next ›
                  </button>
                </>
              );
            })()
          )}
        </div>
      </div>
      <svg
        ref={svgRef}
        className="circuit-canvas grid-bg"
        viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMin meet"
        onClick={handleCanvasClick}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) {
            const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            // For wire drawing, use unsnapped coordinates for smooth following
            // For ghost gate placement, we'll snap in renderGhostGate if needed
            setMousePos({ x: wx, y: wy });
          }
        }}
        onMouseLeave={() => {
          // Keep mousePos if we're placing a gate or wiring
          if (!wireStart && !armedGateType) setMousePos(null);
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {renderFloatingBar()}
        {wires.map(renderWire)}
        {renderRubberBand()}
        {renderGhostGate()}
        {gates.map(renderGate)}
      </svg>
      {showTruthTable && (
        <TruthTableModal
          tables={buildComponentTruthTables()}
          onClose={() => setTruthTableVisible(false)}
        />
      )}
    </div>
  );
}

