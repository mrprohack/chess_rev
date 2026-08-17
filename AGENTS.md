# Chess Game Review Clone — Agent Guide

## Purpose

This is a full-stack Chess.com and Lichess game-review app. A user can submit a game URL or load a public Chess.com profile, browse the latest 20 standard games in a dedicated History view, have the FastAPI backend fetch the selected PGN, analyze it with Stockfish, cache the result in SQLite, and replay the annotated game in the React frontend.

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
  main.py                  FastAPI API, URL parsing, provider fetches, PGN analysis, Stockfish lifecycle
  chesscom_profile.py      Read-only Chess.com PubAPI profile, ratings, and recent-game router
  database.py              SQLAlchemy SQLite model and session
  test_main.py             Backend unittest suite; providers and engine are mocked
  test_chesscom_profile.py Chess.com profile-router tests; provider calls are mocked
  requirements.txt         Backend dependencies
  stockfish/               Downloaded Stockfish binary (gitignored)
  venv/                    Required local virtual environment (gitignored)

frontend/
  src/App.jsx              Application state, Review/History view state, saved profile, bookmarks, layout composition
  src/components/GameHistory.jsx Latest-20 Chess.com history list and empty/error states
  src/components/RightPanel.jsx Review-only move analysis, source URL, playback, and hide control
  src/components/           Board, move story, profile loader, sidebar, settings, and history UI
  src/utils/boardMotion.js Deterministic UCI/FEN replay transitions for forward/backward animation
  src/utils/review.js      Profile perspective, history row formatting, key-move story, outcome, and bookmark helpers
  src/ReviewEnhancements.css Profile/replay/history/key-moment animation and responsive styles
  public/pieces_alt/       Active SVG piece set
  package.json             Vite and unit-test commands

run_all.ps1                Starts backend and frontend in separate Windows terminals
run_all.bat                CMD equivalent
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

`GET /api/chesscom/profile/{username}?limit=12` is read-only and uses Chess.com's public PubAPI. The History view requests `limit=20` and never paginates beyond that versioned UI limit.

- Return public profile identity/avatar/link fields, rapid/blitz/bullet ratings, and normalized recent standard-chess games.
- Keep the limit bounded at the FastAPI boundary.
- Map Chess.com 404, 429, timeout, and provider failures to stable safe errors.
- Do not collect Chess.com passwords, cookies, access tokens, private account data, or any credentials.

## Persistence and Caching

- SQLite database: `backend/games.db`.
- `GameRecord` uses `(url, depth)` as its composite key. The `depth` column holds the versioned analysis cache key, not just the numeric depth.
- Cache keys must include every setting that changes analysis output: cache version, depth, engine, maximum time, number of lines, and threads.
- Existing cache rows can be ignored when the cache-key format changes; do not add a migration unless the model actually requires one.
- Commit only fully analyzed results. Roll back a failed database write and close every session.
- The frontend stores only the default public Chess.com username and per-game move bookmarks in browser `localStorage`.

## Frontend Conventions

- Plain React JSX; no TypeScript or client state library.
- Keep application state lifted in `frontend/src/App.jsx`.
- `App.jsx` owns `activeView` (`review` or `history`) and the Review-panel visibility state; do not add a routing dependency for these two views.
- Use existing CSS custom properties and theme handling instead of adding a styling framework.
- `ChessBoard.jsx` uses image-based pieces from `/pieces_alt/` and replay helpers from `src/utils/boardMotion.js`; preserve stable piece identity across animation changes.
- One-ply replay should use the exact backend `played_move` UCI transition. FEN synchronization remains the fallback for jumps, initialization, and recovery.
- Captures, castling, promotions, and one-ply backward replay must preserve deterministic piece identity and reduced-motion behavior.
- Profile loading is read-only. Successful profile loads may persist the canonical username and orient reviewed games to that player's side.
- Chess.com account/profile controls live in `SettingsModal`; `RightPanel.jsx` is review-only and must not duplicate account setup or the History list.
- `GameHistory.jsx` renders at most the latest 20 normalized standard games and delegates refresh/selection back to `App.jsx`.
- Hiding the Review panel must not reset the current game, move index, bookmarks, orientation, or analysis state.
- Move bookmarks are game-scoped local state and must not alter the backend analysis contract.
- The settings panel sends all engine options listed in the backend contract. Keep frontend and backend validation aligned.

## Verification

Run from the repository root unless noted otherwise:

```powershell
# Backend: no live provider or Stockfish dependency in the regression suite
Set-Location backend
.\venv\Scripts\python.exe -m unittest test_main.py test_chesscom_profile.py -v
.\venv\Scripts\python.exe -m compileall -q .

# Frontend
Set-Location ..\frontend
npm run test:unit
npm run lint
npm run build
```

`test_network.py` and `test_scraper.py` are exploratory Playwright scripts, not the regression suite. Do not include them in unittest discovery. Mock provider calls and Stockfish in backend regression tests; never make unit tests depend on a live game URL.

GitHub Actions must run the same focused regression suite, frontend unit tests, lint, and production build before a PR is considered green.

## Working Rules

- Prefer the smallest change that fixes the shared root cause; do not add dependencies or abstractions without a demonstrated need.
- Preserve request and response compatibility unless the task explicitly includes coordinated frontend work.
- Keep `main.py` organized around named helpers rather than duplicating provider, caching, or engine logic inside the route.
- Stockfish downloads on first startup and its binary directory is gitignored. Do not commit binaries or archives.
- Chess.com may rate-limit requests. Respect provider limits and avoid automatic retry loops unless specifically requested.
- Never use destructive Git commands without explicit user approval.
- Always ask for explicit user confirmation before `git push`.
- Before claiming a change is complete, run fresh verification and report the actual command result.
