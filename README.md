# Circuit Quest

A static, offline-capable web app for building logic circuits to solve puzzles.

## Tech Stack

- React 18 + TypeScript
- Vite
- Zustand (state management)
- idb-keyval (IndexedDB storage)
- React Router (HashRouter for GitHub Pages)
- vite-plugin-pwa (Progressive Web App support)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update `vite.config.ts`:
   - Replace `base: '/REPO_NAME/'` with your actual GitHub repository name
   - Example: If your repo is `circuit-quest`, change to `base: '/circuit-quest/'`

3. Run locally:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment to GitHub Pages

1. Push to the `main` branch
2. The GitHub Actions workflow will automatically build and deploy to Pages
3. Make sure GitHub Pages is enabled in your repository settings

## Features

- **Offline Support**: Full PWA with service worker and manifest
- **Persistent Storage**: Progress and saves stored in IndexedDB
- **Level System**: JSON-based level definitions in `/public/levels/`
- **Circuit Simulation**: Topological sort-based evaluation
- **SVG Rendering**: Zoom and pan canvas with grid snapping
- **Manhattan Routing**: Automatic wire pathfinding

## Project Structure

- `/src/routes/` - Page components (Home, Play)
- `/src/components/` - UI components (TopBar, PalettePanel, CircuitCanvas, etc.)
- `/src/logic/` - Simulation and routing algorithms
- `/src/state/` - Zustand store
- `/src/services/` - Storage and level loading
- `/public/levels/` - Level JSON files

## Adding Levels

Create a new JSON file in `/public/levels/` and add its name to `/public/levels/index.json`.

See `lvl-001.json` for the level format.
