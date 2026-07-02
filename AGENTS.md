# Chess Game Review Clone — Workspace Guide

## Project Overview

A full-stack Chess.com / Lichess game review app. Users paste a game URL, and the app fetches, analyzes with Stockfish, and replays the game move-by-move in a dark-mode UI inspired by Chess.com.

## Directory Layout

```
backend/                 Python FastAPI backend
  main.py                Single API file: /api/analyze endpoint, PGN parsing, Stockfish engine integration
  database.py            SQLAlchemy models + SQLite session (games.db)
  stockfish/             Stockfish 18 binary (stockfish-windows-x86-64-avx2.exe)
  venv/                  Python virtual environment (gitignored)
frontend/                React + Vite frontend
  src/
    App.jsx              Root layout: Sidebar + BoardArea + RightPanel + SettingsModal
    components/
      BoardArea.jsx      Player bars, eval bar, wraps ChessBoard
      ChessBoard.jsx     Custom FEN parser + SVG piece renderer with animation support
      RightPanel.jsx     URL input, move list, navigation controls, classification stats
      Sidebar.jsx        Left icon nav (decorative)
      SettingsModal.jsx  Theme toggle (dark/light/system), engine depth slider
  public/pieces_alt/     SVG chess pieces (wP.svg, bK.svg, etc.) — the active piece set
  public/pieces/         Alternate/older piece set (not currently used)
```

## Running the Project

- **Backend:** `cd backend && venv\Scripts\python.exe main.py` — runs on `http://127.0.0.1:8000`
- **Frontend:** `cd frontend && npm run dev` — runs on `http://127.0.0.1:5173`
- **Both at once:** `run_all.bat` (CMD) or `run_all.ps1` (PowerShell) — prints both URLs
- **Backend uses the venv Python** at `backend/venv/Scripts/python.exe`, not the system Python

## Build & Lint Commands

| Command                | Description              |
|------------------------|--------------------------|
| `npm run dev`          | Vite dev server (frontend)|
| `npm run build`        | Production build (frontend) |
| `npm run lint`         | oxlint linter (frontend)  |
| `npm run preview`      | Preview production build  |

No test framework is configured. Backend has `test_network.py` and `test_scraper.py` (standalone scripts, not a test suite).

## Architecture

- **Frontend ↔ Backend:** Single REST endpoint `POST /api/analyze`. Body: `{ url, depth? }`. Response includes moves array, player info, accuracy stats, classification counts. No auth, no WebSocket.
- **Backend fetch flow:** Chess.com callback API → monthly PGN archive → parse with `python-chess` → Stockfish evaluation per move → SQLite cache.
- **Lichess support:** Direct PGN export from `lichess.org/game/export/{id}`.
- **Stockfish engine:** Binary at `backend/stockfish/stockfish/stockfish-windows-x86-64-avx2.exe`. Opened via `chess.engine.SimpleEngine.popen_uci()`. Windows-specific path.
- **Database:** SQLite at `backend/games.db`. Keyed on (url, depth). No migrations — uses `Base.metadata.create_all()`.

## Key Conventions

- **CSS:** All vanilla CSS in `App.css`, `index.css`, `SettingsModal.css`. Uses CSS custom properties (`--bg-secondary`, `--board-light`, `--board-dark`, etc.). Theme switching sets `data-theme` attribute on `<html>`.
- **State management:** Lifted to `App.jsx` — `gameData`, `currentMoveIndex`, `theme`, `engineDepth` passed as props. No Redux/Context/Zustand.
- **Chess piece rendering:** `ChessBoard.jsx` uses a custom piece syncing algorithm for smooth animations (tracks `moved`, `captured`, `promoted` statuses). Pieces are `<img>` tags loading from `/pieces_alt/{type}.svg`.
- **Move classification:** Backend classifies each move (Best/Excellent/Good/Inaccuracy/Mistake/Blunder/Brilliant/Great/Miss/Book) using centipawn loss thresholds. First 5 "good" moves are reclassified as "Book".
- **Arrows overlay:** SVG arrows on the board — green for best move, red for played move (shown when the move is a mistake/blunder/miss).

## Gotchas

- **Backend binds to `127.0.0.1`**, not `0.0.0.0`. Frontend hardcodes `http://127.0.0.1:8000` for API calls. No environment variable for the API URL.
- **Stockfish binary is Windows-only** (`stockfish-windows-x86-64-avx2.exe`). Cross-platform support would need a different binary path.
- **Chess.com API rate-limits** occasionally. Games are cached in SQLite keyed by URL+depth to mitigate this.
- **`stockfish/` directory is gitignored** — the Stockfish binary must be present locally but isn't in the repo. The `.zip` is also gitignored.
- **No TypeScript** — the frontend is plain JSX with no type checking configured.
- **Vite dev server binds to `127.0.0.1`** via `--host` flag in package.json, not the default `localhost` (important for IPv6 resolution issues on some systems).

## Customization Rules

- When running the backend and frontend services, always print their local URLs to the console.
- Backend URL is typically `http://127.0.0.1:8000`
- Frontend URL is typically `http://127.0.0.1:5173`
