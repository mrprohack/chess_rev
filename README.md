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

## Project Structure

```
chess_rev/
├── backend/                 # Python FastAPI backend
│   ├── main.py              # /api/analyze endpoint, PGN parsing, Stockfish integration
│   ├── database.py          # SQLAlchemy models + SQLite
│   ├── stockfish/           # Stockfish binary
│   └── venv/                # Python virtual environment
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx          # Root layout
│   │   ├── components/
│   │   │   ├── BoardArea.jsx    # Player bars, eval bar
│   │   │   ├── ChessBoard.jsx   # Custom board renderer with animations
│   │   │   ├── RightPanel.jsx   # URL input, move list, controls
│   │   │   ├── Sidebar.jsx      # Left icon nav
│   │   │   └── SettingsModal.jsx
│   │   └── App.css
│   ├── public/pieces_alt/   # SVG chess pieces
│   └── dist/                # Production build output
│
└── run_all.bat              # Start both services (Windows)
```

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 19, Vite 8, Vanilla CSS                 |
| Board    | Custom `ChessBoard.jsx` (FEN parser + SVG)    |
| Backend  | Python, FastAPI, python-chess, Stockfish 18   |
| Database | SQLite via SQLAlchemy                         |
| Data     | Chess.com API, Lichess API                    |

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows

pip install fastapi uvicorn requests python-chess sqlalchemy

python main.py
```

Backend runs at **http://127.0.0.1:8001**

### Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://127.0.0.1:8000**

### Frontend (Production Build)

```bash
cd frontend
npm run build
cp -r dist /var/www/reviewchess
```

## Environment Variables

Create `frontend/.env`:

```
VITE_API_URL=http://127.0.0.1:8001     # local dev
VITE_API_URL=https://testapi.reviewchess.in  # production
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

Both services run as systemd units, auto-start on boot, and restart on crash. On this server the backend unit is `chess-backend` and nginx serves the frontend.

### Quick Start

```bash
# Backend + frontend (nginx) together
sudo systemctl start chess-backend nginx

# Check everything is up
sudo systemctl status chess-backend nginx
```

### Quick Restart

```bash
# Restart both after a deploy or config change
sudo systemctl restart chess-backend nginx

# Restart only the backend (after backend/ changes)
sudo systemctl restart chess-backend
```

### Backend Service

```bash
# Status
sudo systemctl status chess-backend

# Start / Stop / Restart
sudo systemctl start chess-backend
sudo systemctl stop chess-backend
sudo systemctl restart chess-backend

# Enable/disable auto-start on boot
sudo systemctl enable chess-backend
sudo systemctl disable chess-backend

# View live logs
journalctl -u chess-backend -f

# View recent request/error log lines
journalctl -u chess-backend -n 50
```

Service file: `/etc/systemd/system/chess-backend.service`

### Nginx (Frontend)

```bash
# Status
sudo systemctl status nginx

# Start / Stop / Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Reload config (no downtime)
sudo systemctl reload nginx
```

### After a Code Change

1. **Backend** — the process must be restarted to pick up edits:
   ```bash
   sudo systemctl restart chess-backend
   ```
2. **Frontend** — rebuild the static bundle, then nginx picks it up automatically (no restart needed, but a reload is harmless):
   ```bash
   cd frontend
   npm run build
   sudo cp -r dist/* /var/www/reviewchess/
   ```

### Full Restart

```bash
sudo systemctl restart chess-backend nginx
```

## API Reference

### `POST /api/analyze`

**Request Body:**
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

**Response:**
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
  "counts": { ... }
}
```

## Architecture

```
Browser → Nginx (port 8000)
  ├── /              → Static frontend files
  └── /api/*         → FastAPI (port 8001)
                         ├── Chess.com API / Lichess API
                         ├── python-chess (PGN parsing)
                         └── Stockfish 18 (engine analysis)
```

## Notes

- Stockfish binary auto-downloads on first run
- Games are cached in SQLite (`games.db`) keyed by URL + depth
- Chess.com API may rate-limit; cached results are returned instantly
- Lichess games supported via direct PGN export
