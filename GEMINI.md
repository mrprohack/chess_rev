# GEMINI.md — Chess Game Review Clone

## Project Overview

A full-stack chess game review application inspired by Chess.com and Lichess. Users can paste a Chess.com or Lichess game URL to fetch the game PGN, analyze it move-by-move using Stockfish 18, calculate player accuracy & move classifications, and replay the game interactively in a dark/light mode UI.

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
├── backend/                    # FastAPI Backend (Python)
│   ├── main.py                 # Core REST API (/api/analyze), PGN fetching & Stockfish analysis
│   ├── database.py             # SQLAlchemy models & SQLite session initialization
│   ├── test_main.py            # Unit test suite for API endpoints and error paths
│   ├── games.db                # SQLite database caching analyzed games
│   ├── requirements.txt        # Python backend dependencies
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
        ├── App.jsx             # Top-level state (gameData, moveIndex, theme, depth)
        ├── App.css             # Main styling, theme custom properties & animations
        ├── index.css           # Global reset & CSS base styles
        └── components/
            ├── BoardArea.jsx   # Eval bar, player headers, board wrapper
            ├── ChessBoard.jsx  # SVG piece renderer, move animation sync, arrows overlay
            ├── RightPanel.jsx  # URL input, move list, accuracy stats, nav controls
            ├── Sidebar.jsx     # Left icon navigation bar
            ├── SettingsModal.jsx # Settings modal (theme & Stockfish depth slider)
            └── SettingsModal.css # Settings modal styles
```

---

## Backend Information (`backend/`)

### Technology Stack
- **Framework**: Python 3.13, FastAPI, Uvicorn
- **Engine**: Stockfish 18 (UCI via `python-chess`)
- **Database**: SQLite (`games.db`) with SQLAlchemy ORM
- **HTTP Client**: `requests` for fetching PGNs from Chess.com and Lichess

### Core Backend Files
- **[main.py](file:///c:/Users/hack/Documents/chesspgn/backend/main.py)**:
  - `POST /api/analyze`: Accepts `{ "url": str, "depth": int }`. Extracts game ID, fetches PGN via provider APIs, runs Stockfish centipawn evaluation, computes move accuracy percentages, and caches results in `games.db`.
  - `parse_pgn()`: Parses PGN strings using `python-chess`, evaluates board positions at each ply, calculates centipawn loss and accuracy exponential decay, classifies moves (Best, Book, Great, Excellent, Good, Inaccuracy, Mistake, Blunder, Miss, Brilliant), and safe-guards engine cleanup in `try...finally`.
  - Fetchers: Supports Lichess (`https://lichess.org/game/export/{id}`) and Chess.com (Callback API + Monthly UTC public archive API).
- **[database.py](file:///c:/Users/hack/Documents/chesspgn/backend/database.py)**:
  - Defines `GameRecord` table storing cached JSON responses keyed on `(url, depth)`.
- **[test_main.py](file:///c:/Users/hack/Documents/chesspgn/backend/test_main.py)**:
  - `unittest` suite testing root health (`GET /`), URL domain validation (`POST /api/analyze`), and provider 404 response handling.

---

## Frontend Information (`frontend/`)

### Technology Stack
- **Framework**: React 19, Vite
- **Styling**: Vanilla CSS with custom properties (`App.css`, `SettingsModal.css`)
- **Icons**: Lucide React (`lucide-react`)
- **Chess Library**: `chess.js` for FEN state tracking & move validation

### Core Frontend Components
- **[App.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/App.jsx)**:
  - Holds central application state: `gameData`, `currentMoveIndex`, `theme` ('dark' | 'light' | 'system'), and `engineDepth`.
- **[ChessBoard.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/ChessBoard.jsx)**:
  - Custom SVG-based chess board. Animates piece movements between moves, renders move recommendation arrows (green for best move, red for mistake/blunder).
- **[BoardArea.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/BoardArea.jsx)**:
  - Wraps the chessboard and evaluation bar. Renders white and black player cards with ratings and captured pieces.
- **[RightPanel.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/RightPanel.jsx)**:
  - URL paste input, move navigation buttons (first, prev, next, last, auto-play), interactive move history list, accuracy comparison bars, and move classification badges.
- **[SettingsModal.jsx](file:///c:/Users/hack/Documents/chesspgn/frontend/src/components/SettingsModal.jsx)**:
  - Allows adjusting Stockfish engine depth (depth 5 to 18) and toggling application theme.

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
