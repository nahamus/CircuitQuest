# Circuit Quest

Circuit Quest is a browser-based logic-circuit puzzle game. Build circuits with classic logic gates to make the outputs match the targets. Progress through challenges, optimize your design, and learn digital logic along the way.

## Features

- Clean, focused gameplay on an SVG canvas
- Inputs/Outputs panel with click-to-arm placement (no extra place button)
- Components panel with accurate gate symbols (AND, OR, XOR, NOT, BUF, NAND, NOR, XNOR, SPLIT)
- Manhattan wires that attach at the exact center of pins
- Top gradient overlay bar with challenge info, goal pills, and sim feedback
- Right-side actions: stylish Run and Reset buttons
- Delete/Backspace to remove selection; IO pieces return to the IO panel
- Auto-advance to next level on success (with Next when available)
- Autosave of your in-progress circuit per level
- Subtle sound effects and keyboard-friendly UX

## Tech Stack

- React + TypeScript
- Zustand (state management)
- Vite (dev/build tooling)
- SVG for gates and wires
- idb-keyval for autosave/progress/settings
- react-router for routing

## Getting Started

### Prerequisites
- Node.js 18+
- npm, pnpm, or yarn (examples use npm)

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```
Then open the printed local URL (typically `http://localhost:5173`).

### Build
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## How to Play

- Inputs/Outputs (left panel)
  - Click an item to arm it; click on the canvas to place it.
  - Inputs display current value (0/1). Outputs show target (→0/→1).
  - Deleting an IO on the canvas returns it to the panel for reuse.

- Components (left panel)
  - Click a gate to arm it; click on the canvas to place it.
  - Gates include AND, OR, XOR, NOT, BUF, NAND, NOR, XNOR, and SPLIT (tee).

- Wiring
  - Click an output pin (right side), then an input pin (left side).
  - Wires preview while routing and snap using a Manhattan path.
  - Double‑clicking a source pin also starts a wire.

- Running & Reset
  - Use Run and Reset on the right panel.
  - Simulation results show beneath the goals on the top overlay bar.
  - On success, you’ll auto‑advance to the next challenge if available.

- Editing & View
  - Drag a gate to move it. Click to select. Delete/Backspace to remove.
  - Right‑drag to pan. Ctrl/Cmd + wheel to zoom.

## Controls (Cheat Sheet)

- Place IO/Gate: Click item in side panel → Click canvas
- Start wire: Click output (right pin)
- Complete wire: Click input (left pin)
- Select: Click gate or wire
- Delete selection: Delete or Backspace
- Pan: Right mouse drag
- Zoom: Ctrl/Cmd + mouse wheel

## Levels

Levels are JSON files served from `public/levels/` with an index at `public/levels/index.json`.
- The app loads the index to populate available levels.
- Individual levels are fetched as `${BASE_URL}levels/<id>.json`.

A level defines (simplified):
```json
{
  "id": "lvl-001",
  "title": "Example",
  "description": "Make F = A AND B",
  "grid": { "rows": 40, "cols": 60, "snap": 32 },
  "palette": { "AND": 2, "OR": 2, "XOR": 1, "NOT": 1, "BUF": 1, "NAND": 1, "NOR": 1, "XNOR": 1, "SPLIT": 1 },
  "inputs": [{ "id": "A", "label": "A", "initial": 0, "outputs": [] }],
  "outputs": [{ "id": "F", "label": "F", "target": 1, "inputs": [] }],
  "placed": [],
  "wires": []
}
```
Notes:
- Inputs are normalized to have one output pin; outputs to have one input pin.
- `placed` and `wires` are optional; they default to empty.

## State & Architecture

- `src/state/useStore.ts` (Zustand store)
  - Gates, wires, selection, UI (zoom/offset/snap), sim state
  - Actions: loadLevel, placeGate, placeIO, returnIO, moveGate, replaceGateType
  - Wiring: startWire, completeWire, cancelWire
  - Persistence: saveProgress/loadProgress, saveAutosave/loadAutosave, saveSettings/loadSettings

- `src/components/CircuitCanvas.tsx`
  - Renders gates, pins, and wires in SVG
  - Handles dragging, wiring, selection, and grid snapping
  - Displays the top overlay bar (title/description, goals, sim feedback, Next)

- Side Panels
  - `src/components/IOTrayPanel.tsx`: Click‑to‑arm IO placement
  - `src/components/PalettePanel.tsx`: Click‑to‑arm components with matching symbols
  - `src/components/ScorePanel.tsx`: Progress and Run/Reset

- Services
  - `src/services/levels.ts`: Level index and level fetching
  - `src/services/storage.ts`: Progress, autosave, and settings (idb‑keyval)

- Simulation
  - `src/logic/simulation.ts` evaluates circuits for correctness

## Sounds

Subtle click and snap sounds play on interactions.

## Accessibility

- Focus‑visible outlines on interactive tiles
- Keyboard deletion of selection (Delete/Backspace)
- Clear visible feedback for armed items and simulation results

## Development Tips

- If wires don’t align with pins, verify snap/grid values and the pin math in `useStore.ts`.
- If IO pieces don’t return after deletion, ensure `returnIO` is used for INPUT/OUTPUT.
- If levels fail to load, check `public/levels/index.json` and referenced files.

## Deployment

Build the static site using Vite and serve the `dist/` folder:
```bash
npm run build
```

## Contributing

- Use clear, descriptive names for gates, ports, and actions.
- Keep symbols consistent between palette icons and on‑canvas gates.
- Prefer small, focused edits and test interactions (place → wire → run → reset).

---

Made with ❤️ for learning and puzzling.
