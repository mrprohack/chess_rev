# Chess Game Review

A full-stack Chess.com / Lichess game review app. Paste a game URL and instantly replay it move-by-move with Stockfish analysis in a dark-mode UI.

## Features

- **Paste & Analyze** — Paste any Chess.com or Lichess game URL
- **Stockfish Engine** — Move classification (Best/Excellent/Good/Inaccuracy/Mistake/Blunder/Brilliant/Great/Miss/Book)
- **Step-by-Step Replay** — Navigate moves with controls or click any move in the list
- **Custom Chess Board** — FEN-based board renderer with SVG piece animations
- **Player Info** — Names, ratings, and accuracy stats
- **Move List** — Full annotated move list with quality badges
- **Dark Mode UI** — Chess.com-inspired dark theme
- **Flutter Android Client** — Native portrait-first Review/History/Settings app in `mobile/` with Share Intent and deep-link support

## Project Structure

```text
chess_rev/
├── backend/                 # Python FastAPI backend + Stockfish
├── frontend/                # React + Vite web client
├── mobile/                  # Flutter Android client (com.reviewchess.app)
│   ├── lib/                 # Riverpod app, review, board, history, settings
│   ├── assets/              # Bundled chess pieces and move sounds
│   ├── test/                # Unit + widget + integration-style tests
│   └── tool/                # Deterministic Android scaffold templates
└── run_all.bat              # Start web/backend services on Windows
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web | React 19, Vite 8, Vanilla CSS |
| Android | Flutter, Dart, Riverpod, Dio, go_router |
| Board | Custom FEN renderer with bundled SVG pieces |
| Backend | Python, FastAPI, python-chess, Stockfish 18 |
| Database | SQLite via SQLAlchemy |
| Data | Chess.com API, Lichess API |

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
python main.py
```

Backend runs at **http://127.0.0.1:8001**.

### Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://127.0.0.1:8000**.

### Flutter Android

See [`mobile/README.md`](mobile/README.md) for full Android setup, testing, Share Intent/deep-link behavior, and release requirements.

Quick emulator development setup:

```bash
cd mobile
flutter pub get
bash tool/bootstrap_android.sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001
```

Mobile verification:

```bash
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
bash tool/bootstrap_android.sh
flutter build apk --debug
```

### Frontend (Production Build)

```bash
cd frontend
npm run build
cp -r dist /var/www/reviewchess
```

## Environment Variables

Web development uses `frontend/.env`:

```text
VITE_API_URL=http://127.0.0.1:8001
```

Production web may use an HTTPS backend such as:

```text
VITE_API_URL=https://testapi.reviewchess.in
```

Flutter debug builds default to the Android-emulator backend `http://10.0.2.2:8001` when `API_BASE_URL` is not supplied. Flutter **release** builds require an explicit remote HTTPS value:

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.reviewchess.in
```

## Production Deployment (Nginx)

Nginx serves the built frontend and proxies API requests:

```nginx
upstream chess_backend {
    server 127.0.0.1:8001;
}

server {
    listen 8000;
    server_name test.reviewchess.in;

    root /var/www/reviewchess;
    index index.html;

    location /api/ {
        proxy_pass http://chess_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Updating Frontend in Production

```bash
cd frontend
npm run build
cp -r dist/* /var/www/reviewchess/
```

## Services (systemd)

Both server services run as systemd units, auto-start on boot, and restart on crash. On this server the backend unit is `chess-backend` and nginx serves the frontend.

### Quick Start

```bash
sudo systemctl start chess-backend nginx
sudo systemctl status chess-backend nginx
```

### Quick Restart

```bash
sudo systemctl restart chess-backend nginx
sudo systemctl restart chess-backend
```

### Backend Service

```bash
sudo systemctl status chess-backend
sudo systemctl start chess-backend
sudo systemctl stop chess-backend
sudo systemctl restart chess-backend
sudo systemctl enable chess-backend
sudo systemctl disable chess-backend
journalctl -u chess-backend -f
journalctl -u chess-backend -n 50
```

Service file: `/etc/systemd/system/chess-backend.service`

### Nginx (Frontend)

```bash
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

### After a Code Change

1. **Backend** — restart the backend process:
   ```bash
   sudo systemctl restart chess-backend
   ```
2. **Frontend** — rebuild the static bundle:
   ```bash
   cd frontend
   npm run build
   sudo cp -r dist/* /var/www/reviewchess/
   ```
3. **Android** — rerun Flutter checks/build from `mobile/` as described in `mobile/README.md`.

## API Reference

### `POST /api/analyze`

Request body:

```json
{
  "url": "https://www.chess.com/game/live/170804338698",
  "depth": 10,
  "engine": "stockfish18",
  "maxTime": 5,
  "numLines": 3,
  "threads": 1
}
```

Example response:

```json
{
  "white": "player1",
  "black": "player2",
  "white_rating": 1500,
  "black_rating": 1450,
  "result": "1-0",
  "moves": [
    {
      "number": 1,
      "color": "white",
      "notation": "e4",
      "classification": "Book",
      "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    }
  ],
  "accuracy": { "white": 95.2, "black": 88.7 },
  "counts": {}
}
```

## Architecture

```text
React Web ─────┐
               ├──► FastAPI ──► Chess.com / Lichess
Flutter Android┘        │
                        ├──► python-chess
                        ├──► Stockfish 18
                        └──► SQLite analysis cache
```

The Android app keeps only lightweight local state such as settings, profile snapshot, bookmarks, and recent URLs. Full analyzed games remain server-authoritative and are not persisted across app launches.

## Notes

- Stockfish binary auto-downloads on first backend run.
- Games are cached in SQLite (`games.db`) keyed by URL + depth.
- Chess.com API may rate-limit; cached results are returned instantly.
- Lichess games are supported through direct PGN export.
- Android application ID is `com.reviewchess.app`.
- Android release signing material and backend secrets must never be committed.
