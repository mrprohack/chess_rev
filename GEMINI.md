# GEMINI.md — Chess Game Review Clone

## Project Overview

A full-stack chess game review application inspired by Chess.com and Lichess. Users can paste a Chess.com or Lichess game URL to fetch the game PGN, analyze it move-by-move using Stockfish 18, calculate player accuracy & move classifications, and replay the game interactively in a dark/light mode UI with full board and playback customization.

---

## Directory Structure

```
chesspgn/
├── AGENTS.md                   # Workspace rules & coding conventions
├── README.md                   # General project README
├── GEMINI.md                   # Detailed project architectural guide
├── gemini.md                   # Alternate name entry point
├── run_all.bat                 # Windows batch script to launch backend & frontend
├── run_all.ps1                 # PowerShell script to launch backend & frontend
├── push.bat                    # Git convenience script
│
├── .github/
│   └── workflows/
│       └── check.yml           # GitHub Actions CI workflow (Frontend lint & build, Backend test suite)
│
├── backend/                    # FastAPI Backend (Python)
│   ├── main.py                 # Core REST API (/api/analyze), PGN fetching & Stockfish analysis
│   ├── database.py             # SQLAlchemy models & SQLite session initialization
│   ├── test_main.py            # Unit test suite using FastAPI TestClient
│   ├── games.db                # SQLite database caching analyzed games
│   ├── requirements.txt        # Python backend dependencies (fastapi, uvicorn, requests, chess, httpx)
│   ├── test_network.py         # Standalone Playwright network interception script
│   ├── test_scraper.py         # Standalone scraper test script
│   ├── tuner.py / tuner2.py    # Engine parameter tuning utilities
│   ├── game.pgn / game2.pgn    # Sample PGN files for manual testing
│   └── stockfish/              # Stockfish 18 UCI engine binary (Windows x86-64 AVX2)
│
└── frontend/                   # React + Vite Frontend
    ├── index.html              # HTML entry point
    ├── package.json            # NPM scripts & React 19 dependencies
    ├── vite.config.js          # Vite configuration
    ├── public/
    │   ├── pieces_alt/         # SVG piece set (wP.svg, bK.svg, etc. — primary set)
    │   └── pieces/             # Alternate piece set
    └── src/
        ├── main.jsx            # React root renderer
        ├── App.jsx             # Top-level state & localStorage persistence (theme, depth, boardTheme, sound, etc.)
        ├── App.css             # Main styling, theme custom properties & animations
        ├── index.css           # Global reset & CSS base styles
        └── components/
            ├── BoardArea.jsx   # Eval bar, player headers, board wrapper
            ├── ChessBoard.jsx  # SVG piece renderer, move animation sync, board themes & arrows overlay
            ├── RightPanel.jsx  # URL input, move list, accuracy stats, auto-play & audio synthesizer
            ├── Sidebar.jsx     # Left icon navigation bar
            ├── SettingsModal.jsx # Comprehensive Settings Modal (theme, depth, board theme, sound, auto-play speed)
            └── SettingsModal.css # Settings modal styles & UI switches
```

---

## Backend Information (`backend/`)

### Technology Stack
- **Framework**: Python 3.13, FastAPI, Uvicorn
- **Engine**: Stockfish 18 (UCI via `python-chess`)
- **Database**: SQLite (`games.db`) with SQLAlchemy ORM
- **HTTP Client / Testing**: `requests` for PGN fetching, `httpx` & `fastapi.testclient.TestClient` for in-process testing

### Core Backend Files
- **[main.py](file:///c:/Users/hack/Documents/chesspgn/backend/main.py)**:
  - `POST /api/analyze`: Accepts `{ "url": str, "depth": int }`. Extracts game ID, fetches PGN via provider APIs, runs Stockfish centipawn evaluation, computes move accuracy percentages, and caches results in `games.db`.
  - `parse_pgn()`: Parses PGN strings using `python-chess`, evaluates board positions at each ply, calculates centipawn loss and accuracy exponential decay, classifies moves (Best, Book, Great, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss, Brilliant), and safe-guards engine cleanup in `try...finally`.
  - Fetchers: Supports Lichess (`https://lichess.org/game/export/{id}`) and Chess.com (Callback API + Monthly UTC public archive API).
- **[database.py](file:///c:/Users/hack/Documents/chesspgn/backend/database.py)**:
  - Defines `GameRecord` table storing cached JSON responses keyed on `(url, depth)`.
- **[test_main.py](file:///c:/Users/hack/Documents/chesspgn/backend/test_main.py)**:
  - `unittest` suite using `FastAPI TestClient` for in-process testing of root health (`GET /`), URL domain validation (`POST /api/analyze`), and provider 404 error handling without requiring a external web server.

---

## Frontend Information (`frontend/`)

### Technology Stack
- **Framework**: React 19, Vite
- **Styling**: Vanilla CSS with custom properties (`App.css`, `SettingsModal.css`)
- **Icons**: Lucide React (`lucide-react`)
- **Chess Library**: `chess.js` for FEN state tracking & move validation

### Core Frontend Components
- **[App.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/App.jsx)**:
  - Central application state with `localStorage` persistence (`theme`, `engineDepth`, `boardTheme`, `showArrows`, `showCoordinates`, `soundEnabled`, `autoPlaySpeed`, `figurineNotation`).
- **[ChessBoard.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/ChessBoard.jsx)**:
  - SVG-based chess board with move animations, 4 color palettes (`wood`, `green`, `blue`, `cyber`), toggleable move recommendation arrows, and rank/file coordinate labels.
- **[BoardArea.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/BoardArea.jsx)**:
  - Board wrapper with dynamic evaluation bar and active player headers.
- **[RightPanel.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/RightPanel.jsx)**:
  - URL paste input, move navigation controls with Play/Pause auto-play, Web Audio move sound synthesis, interactive move history list, accuracy comparison bars, and move classification badges.
- **[SettingsModal.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/SettingsModal.jsx)**:
  - Comprehensive customization modal for App Theme, Engine Depth, Board Palette, Move Arrows, Coordinates, Sound Effects, Auto-Play Speed, and Figurine Notation.

---

## Running & Testing the Project

### Local URLs
- **Backend API**: `http://127.0.0.1:8000`
- **Frontend App**: `http://127.0.0.1:5173`

### Commands

| Task | Command |
|---|---|
| Run Both (Windows) | `run_all.bat` or `run_all.ps1` |
| Run Backend | `cd backend && venv\Scripts\python.exe main.py` |
| Run Frontend Dev | `cd frontend && npm run dev` |
| Run Backend Tests | `cd backend && venv\Scripts\python.exe -m unittest test_main.py` |
| Lint Frontend | `cd frontend && npm run lint` |
| Build Frontend | `cd frontend && npm run build` |

---

## Customization Rules & Git Policy

- **Console URLs**: When running backend and frontend services, always print local URLs to console (`http://127.0.0.1:8000` for backend, `http://127.0.0.1:5173` for frontend).
- **Git Push Confirmation**: Always ask for explicit user confirmation before executing any `git push` command.


