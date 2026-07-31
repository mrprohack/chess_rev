# Chess Game Review Clone — Agent Guide

## Purpose

This is a full-stack Chess.com and Lichess game-review app. A user submits a game URL; the FastAPI backend fetches its PGN, analyzes it with Stockfish, caches the result in SQLite, and the React frontend replays the annotated game.

Keep this file accurate. Whenever a change affects architecture, commands, API contracts, persistence, deployment, or the development workflow, update this guide in the same change.

## Start-of-Task Checklist

1. Read this file, then inspect the files that own the requested behavior.
2. Check `git status --short`; preserve unrelated user changes.
3. Trace frontend callers before changing the API or response fields.
4. Use the project's backend virtual environment, never the system Python.
5. Add or update focused tests before changing backend behavior.
6. Run the smallest relevant verification first, then the full relevant suite.

## Project Map

```
backend/
  main.py                FastAPI API, URL parsing, provider fetches, PGN analysis, Stockfish lifecycle
  database.py            SQLAlchemy SQLite model and session
  test_main.py           Backend unittest suite; providers and engine are mocked
  requirements.txt       Backend dependencies
  stockfish/             Downloaded Stockfish binary (gitignored)
  venv/                  Required local virtual environment (gitignored)

frontend/
  src/App.jsx            Application state and layout composition
  src/components/        Board, right panel, sidebar, and settings UI
  public/pieces_alt/     Active SVG piece set
  package.json           Vite commands

run_all.ps1              Starts backend and frontend in separate Windows terminals
run_all.bat              CMD equivalent
```

## Running Locally

Use these URLs unless the launch configuration changes:

- Backend: `http://127.0.0.1:8001`
- Frontend: `http://127.0.0.1:8000`

```powershell
# Backend
Set-Location backend
.\venv\Scripts\python.exe main.py

# Frontend, in another terminal
Set-Location frontend
npm run dev

# Or start both
.\run_all.ps1
```

When starting services, print both local URLs. The backend binds to `0.0.0.0:8001`; Vite runs on `0.0.0.0:8000`.

## Backend Contract and Data Flow

`POST /api/analyze` accepts:

```json
{
  "url": "https://lichess.org/example",
  "depth": 10,
  "engine": "stockfish18",
  "maxTime": 5,
  "numLines": 3,
  "threads": 1
}
```

- Validate request bounds at the Pydantic boundary.
- Parse provider URLs with `parse_game_url`; do not reintroduce substring-only provider checks.
- Lichess fetches a direct PGN export. Chess.com fetches callback metadata, then the monthly archive.
- Keep provider HTTP, timeout, engine, and internal failures mapped to stable FastAPI `detail` messages; do not expose raw exceptions to clients.
- `parse_pgn` owns the Stockfish process and must always close it. Reuse the post-move evaluation as the next pre-move evaluation; do not restore duplicate engine analysis.
- Successful response fields are consumed by the frontend. Preserve top-level player/result/accuracy/count fields and each move's `number`, `color`, `notation`, `classification`, `fen`, `time`, `eval`, `clock`, `played_move`, and `best_move` fields unless frontend changes ship with the backend change.

## Persistence and Caching

- SQLite database: `backend/games.db`.
- `GameRecord` uses `(url, depth)` as its composite key. The `depth` column holds the versioned analysis cache key, not just the numeric depth.
- Cache keys must include every setting that changes analysis output: cache version, depth, engine, maximum time, number of lines, and threads.
- Existing cache rows can be ignored when the cache-key format changes; do not add a migration unless the model actually requires one.
- Commit only fully analyzed results. Roll back a failed database write and close every session.

## Frontend Conventions

- Plain React JSX; no TypeScript or client state library.
- Keep application state lifted in `frontend/src/App.jsx`.
- Use existing CSS custom properties and theme handling instead of adding a styling framework.
- `ChessBoard.jsx` uses custom FEN parsing and image-based pieces from `/pieces_alt/`; preserve its piece-sync animation behavior when changing board state.
- The settings panel sends all engine options listed in the backend contract. Keep frontend and backend validation aligned.

## Verification

Run from the repository root unless noted otherwise:

```powershell
# Backend: no live provider or Stockfish dependency in the test suite
backend\venv\Scripts\python.exe -m unittest discover -s backend -p "test_main.py" -v
backend\venv\Scripts\python.exe -m compileall -q backend

# Frontend
Set-Location frontend
npm run lint
npm run build
```

`test_network.py` and `test_scraper.py` are exploratory scripts, not the regression suite. Mock provider calls and Stockfish in `test_main.py`; never make unit tests depend on a live game URL.

## Working Rules

- Prefer the smallest change that fixes the shared root cause; do not add dependencies or abstractions without a demonstrated need.
- Preserve request and response compatibility unless the task explicitly includes coordinated frontend work.
- Keep `main.py` organized around named helpers rather than duplicating provider, caching, or engine logic inside the route.
- Stockfish downloads on first startup and its binary directory is gitignored. Do not commit binaries or archives.
- Chess.com may rate-limit requests. Respect the cache and avoid automatic retry loops unless specifically requested.
- Never use destructive Git commands without explicit user approval.
- Always ask for explicit user confirmation before `git push`.
- Before claiming a change is complete, run fresh verification and report the actual command result.
