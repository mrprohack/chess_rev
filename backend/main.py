from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
import chess.pgn
import chess.engine
import io
import os
import datetime
import math
import platform
import urllib.request
import zipfile
import tarfile
import stat
import logging
from urllib.parse import urlparse
from database import SessionLocal, GameRecord
from chesscom_profile import router as chesscom_profile_router

app = FastAPI()
app.include_router(chesscom_profile_router)
logger = logging.getLogger(__name__)
CACHE_VERSION = 2


def ensure_stockfish():
    is_windows = platform.system() == "Windows"
    binary_name = "stockfish-windows-x86-64-avx2.exe" if is_windows else "stockfish-ubuntu-x86-64-avx2"
    base_dir = os.path.join(os.path.dirname(__file__), "stockfish", "stockfish")
    os.makedirs(base_dir, exist_ok=True)
    engine_path = os.path.join(base_dir, binary_name)
    if os.path.exists(engine_path):
        return
    print(f"Stockfish not found at {engine_path}. Downloading...")
    if is_windows:
        url = "https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-windows-x86-64-avx2.zip"
        archive_path = os.path.join(base_dir, "stockfish.zip")
    else:
        url = "https://github.com/official-stockfish/Stockfish/releases/download/sf_18/stockfish-ubuntu-x86-64-avx2.tar"
        archive_path = os.path.join(base_dir, "stockfish.tar")
    urllib.request.urlretrieve(url, archive_path)
    if is_windows:
        with zipfile.ZipFile(archive_path, 'r') as zip_ref:
            for file_info in zip_ref.infolist():
                if file_info.filename.endswith(binary_name):
                    file_info.filename = binary_name
                    zip_ref.extract(file_info, base_dir)
    else:
        with tarfile.open(archive_path) as tar_ref:
            for member in tar_ref.getmembers():
                if member.name.endswith(binary_name):
                    member.name = binary_name
                    tar_ref.extract(member, path=base_dir)
        st = os.stat(engine_path)
        os.chmod(engine_path, st.st_mode | stat.S_IEXEC)
    os.remove(archive_path)
    print("Stockfish downloaded and extracted successfully.")


@app.on_event("startup")
async def startup_event():
    ensure_stockfish()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {"User-Agent": "ChessGameReview/1.0 (https://github.com/mrprohack/chess_rev)"}


class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    depth: int = Field(default=10, ge=1, le=30)
    engine: str = Field(default="stockfish18", min_length=1, max_length=32)
    maxTime: int = Field(default=5, ge=0, le=60)
    numLines: int = Field(default=3, ge=1, le=5)
    threads: int = Field(default=1, ge=1, le=32)


LICHESS_NON_GAME_PATHS = {
    "about", "analysis", "api", "blog", "broadcaster", "cam", "challenge",
    "coach", "community", "editor", "feed", "forum", "from", "games", "help",
    "mobile", "practice", "stream", "study", "swiss", "team", "top",
    "tournament", "training", "tv", "video",
}


def _extract_lichess_game_id(parts) -> tuple[str, str]:
    for part in parts:
        if part in {"black", "white"}:
            continue
        if part in LICHESS_NON_GAME_PATHS:
            continue
        return "lichess", part
    raise HTTPException(status_code=400, detail="Could not extract Lichess game ID")


def _extract_chess_com_game_id(parts) -> tuple[str, str]:
    for game_type in ("live", "daily"):
        if game_type in parts:
            index = parts.index(game_type) + 1
            if index < len(parts):
                return "chess.com", parts[index]
    for part in parts:
        if part.isdigit() and len(part) >= 6:
            return "chess.com", part
    raise HTTPException(status_code=400, detail="Could not extract Chess.com game ID")


def parse_game_url(raw_url: str) -> tuple[str, str]:
    parsed = urlparse(raw_url.strip())
    host = (parsed.hostname or "").lower()
    parts = [part for part in parsed.path.split("/") if part]
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Invalid game URL")
    if host == "lichess.org" or host.endswith(".lichess.org"):
        if not parts:
            raise HTTPException(status_code=400, detail="Could not extract Lichess game ID")
        return "lichess", parts[0]
    if host == "chess.com" or host.endswith(".chess.com"):
        for game_type in ("live", "daily"):
            if game_type in parts:
                index = parts.index(game_type) + 1
                if index < len(parts):
                    return "chess.com", parts[index]
        raise HTTPException(status_code=400, detail="Could not extract Chess.com game ID")
    raise HTTPException(status_code=400, detail="Invalid URL. Must be chess.com or lichess.org")


@app.get("/")
async def root():
    return {"message": "Chess API is running. Please open the Frontend Web UI at http://127.0.0.1:8000"}


class EngineUnavailableError(RuntimeError):
    pass


def open_engine(engine_path, engine_id, threads):
    engine = None
    try:
        engine = chess.engine.SimpleEngine.popen_uci(engine_path)
        engine.configure({"Threads": threads})
        if "lite" in engine_id.lower():
            engine.configure({"Use NNUE": False})
        return engine
    except Exception as exc:
        if engine:
            engine.quit()
        raise EngineUnavailableError("Chess engine unavailable") from exc


def analyse_position(engine, board, limit):
    try:
        return engine.analyse(board, limit)
    except (chess.engine.EngineError, OSError, TimeoutError) as exc:
        raise EngineUnavailableError("Chess engine unavailable") from exc


def score_from_info(info):
    if not info:
        return 0
    return info["score"].white().score(mate_score=10000) or 0


def best_move_from_info(info):
    pv = info.get("pv", []) if info else []
    return pv[0].uci() if pv else None


def parse_pgn(pgn_str: str, engine_depth: int = 10, engine_id: str = "stockfish18", max_time: int = 5, num_lines: int = 3, threads: int = 1):
    pgn_io = io.StringIO(pgn_str)
    game = chess.pgn.read_game(pgn_io)
    if not game:
        return None
    moves = []
    board = game.board()
    node = game
    move_num = 1
    classification_counts = {"white": {}, "black": {}}
    white_caps_sum = black_caps_sum = 0
    white_moves_count = black_moves_count = 0
    is_windows = platform.system() == "Windows"
    binary_name = "stockfish-windows-x86-64-avx2.exe" if is_windows else "stockfish-ubuntu-x86-64-avx2"
    engine_path = os.path.join(os.path.dirname(__file__), "stockfish", "stockfish", binary_name)
    engine = None if engine_id == "off" else open_engine(engine_path, engine_id, threads)
    base = 60
    inc = 0
    tc = game.headers.get("TimeControl", "60")
    if "+" in tc:
        parts = tc.split("+")
        if parts[0].isdigit():
            base = int(parts[0])
        if parts[1].isdigit():
            inc = int(parts[1])
    elif tc.isdigit():
        base = int(tc)
    limit = chess.engine.Limit(depth=engine_depth, time=max_time if max_time > 0 else None)

    try:
        current_info = analyse_position(engine, board, limit) if engine else None
        while node.variations:
            score_before = score_from_info(current_info)
            best_move_uci = best_move_from_info(current_info)
            next_node = node.variation(0)
            move = next_node.move
            san_move = board.san(move)
            played_move_uci = move.uci()
            board.push(move)
            next_info = analyse_position(engine, board, limit) if engine else None
            score_after = score_from_info(next_info)
            color = "white" if board.turn == chess.BLACK else "black"
            if color == "white":
                cp_loss = max(0, score_before - score_after)
                accuracy_move = max(0, 103.1668 * math.exp(-0.04354 * cp_loss) - 3.1669) if cp_loss < 200 else 0
                white_caps_sum += min(100, max(0, accuracy_move))
                white_moves_count += 1
            else:
                cp_loss = max(0, score_after - score_before)
                accuracy_move = max(0, 103.1668 * math.exp(-0.04354 * cp_loss) - 3.1669) if cp_loss < 200 else 0
                black_caps_sum += min(100, max(0, accuracy_move))
                black_moves_count += 1

            classification = ""
            nags = next_node.nags
            if nags:
                if 1 in nags: classification = "Great"
                elif 2 in nags: classification = "Mistake"
                elif 3 in nags: classification = "Brilliant"
                elif 4 in nags: classification = "Blunder"
                elif 5 in nags: classification = "Miss"
                elif 6 in nags: classification = "Inaccuracy"
                elif 9 in nags: classification = "Excellent"
            if not classification:
                if engine:
                    if cp_loss <= -200: classification = "Great"
                    elif cp_loss <= 15: classification = "Best"
                    elif cp_loss <= 40: classification = "Excellent"
                    elif cp_loss <= 80: classification = "Good"
                    elif cp_loss <= 150: classification = "Inaccuracy"
                    elif cp_loss <= 300: classification = "Mistake"
                    else: classification = "Blunder"
                else:
                    classification = "Best"
            if move_num <= 5 and classification in ["Best", "Excellent", "Good"]:
                classification = "Book"

            current_clock = next_node.clock()
            if current_clock is None:
                time_str = "0.1s"
            else:
                prev_clock = node.parent.clock() if (node != game and node.parent and node.parent.clock() is not None) else base
                time_spent = max(0.1, prev_clock - current_clock + (inc if node != game and node.parent else 0))
                time_str = f"{time_spent:.1f}s"

            moves.append({
                "number": move_num,
                "color": color,
                "notation": san_move,
                "classification": classification,
                "fen": board.fen(),
                "time": time_str,
                "eval": score_after / 100 if engine else 0,
                "clock": current_clock if current_clock is not None else 600,
                "played_move": played_move_uci,
                "best_move": best_move_uci,
            })
            if classification:
                classification_counts[color][classification] = classification_counts[color].get(classification, 0) + 1
            if color == "black":
                move_num += 1
            current_info = next_info
            node = next_node
    finally:
        if engine:
            engine.quit()

    return {
        "white": game.headers.get("White", "Unknown"),
        "white_rating": game.headers.get("WhiteElo", "?"),
        "black": game.headers.get("Black", "Unknown"),
        "black_rating": game.headers.get("BlackElo", "?"),
        "result": game.headers.get("Result", "*"),
        "base_time": base,
        "moves": moves,
        "counts": classification_counts,
        "accuracy": {
            "white": round(white_caps_sum / max(1, white_moves_count), 1),
            "black": round(black_caps_sum / max(1, black_moves_count), 1),
        },
    }


def build_cache_key(req: AnalyzeRequest) -> str:
    return ":".join(map(str, (CACHE_VERSION, req.depth, req.engine, req.maxTime, req.numLines, req.threads)))


def fetch_lichess_pgn(session: requests.Session, game_id: str) -> str:
    response = session.get(f"https://lichess.org/game/export/{game_id}", headers={"Accept": "application/x-chess-pgn"}, timeout=10)
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Game not found on Lichess")
    response.raise_for_status()
    return response.text


def fetch_chess_com_pgn(session: requests.Session, game_id: str) -> str:
    response = session.get(f"https://www.chess.com/callback/live/game/{game_id}", headers=HEADERS, timeout=10)
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Game not found on Chess.com")
    response.raise_for_status()
    callback = response.json()
    game = callback.get("game", {})
    uuid = game.get("uuid")
    end_time = game.get("endTime")
    if not uuid or not end_time:
        raise HTTPException(status_code=404, detail="Could not parse game details from Chess.com")
    players = callback.get("players", {})
    username = players.get("top", {}).get("username") or players.get("bottom", {}).get("username")
    if not username:
        raise HTTPException(status_code=404, detail="Could not find players in Chess.com game data")
    played_at = datetime.datetime.fromtimestamp(end_time, tz=datetime.timezone.utc)
    archive = session.get(f"https://api.chess.com/pub/player/{username}/games/{played_at.year}/{played_at.month:02d}", headers=HEADERS, timeout=10)
    archive.raise_for_status()
    for archive_game in archive.json().get("games", []):
        if archive_game.get("uuid") == uuid or str(archive_game.get("url", "")).endswith(game_id):
            if archive_game.get("pgn"):
                return archive_game["pgn"]
    raise HTTPException(status_code=404, detail="Game PGN not found in Chess.com archive")


@app.post("/api/analyze")
def analyze_game(req: AnalyzeRequest):
    logger.info("Analyzing game from URL: %s", req.url)
    provider, game_id = parse_game_url(req.url)
    db = None
    try:
        db = SessionLocal()
        db_game = db.query(GameRecord).filter(GameRecord.url == req.url, GameRecord.depth == build_cache_key(req)).first()
        if db_game:
            return db_game.data
        with requests.Session() as session:
            pgn = fetch_lichess_pgn(session, game_id) if provider == "lichess" else fetch_chess_com_pgn(session, game_id)
        game_data = parse_pgn(pgn, req.depth, req.engine, req.maxTime, req.numLines, req.threads)
        if not game_data:
            raise HTTPException(status_code=422, detail="Could not parse game PGN")
        db.add(GameRecord(url=req.url, depth=build_cache_key(req), data=game_data))
        db.commit()
        return game_data
    except HTTPException:
        logger.warning("%s analysis failed for URL %s", provider, req.url)
        raise
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Chess provider timed out") from None
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach chess provider") from None
    except EngineUnavailableError:
        raise HTTPException(status_code=503, detail="Chess engine unavailable") from None
    except ValueError:
        raise HTTPException(status_code=422, detail="Could not parse game PGN") from None
    except Exception:
        if db is not None:
            try:
                db.rollback()
            except Exception:
                logger.exception("Database rollback failed")
        logger.exception("Unexpected game analysis failure")
        raise HTTPException(status_code=500, detail="Could not process game") from None
    finally:
        if db is not None:
            db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8001")))

