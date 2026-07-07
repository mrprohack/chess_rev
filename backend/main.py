from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import chess.pgn
import chess.engine
import io
import datetime
import math
from typing import Optional
from database import SessionLocal, GameRecord

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: str
    depth: Optional[int] = 10

@app.get("/")
async def root():
    return {"message": "Chess API is running. Please open the Frontend Web UI at http://127.0.0.1:5173"}

def parse_pgn(pgn_str: str, engine_depth: int = 10):
    # Parse the PGN using python-chess
    pgn_io = io.StringIO(pgn_str)
    game = chess.pgn.read_game(pgn_io)
    
    if not game:
        return None
        
    moves = []
    board = game.board()
    
    node = game
    move_num = 1
    
    classification_counts = {
        "white": {},
        "black": {}
    }
    
    white_caps_sum = 0
    black_caps_sum = 0
    white_moves_count = 0
    black_moves_count = 0
    
    # Initialize engine
    try:
        engine = chess.engine.SimpleEngine.popen_uci("stockfish/stockfish/stockfish-windows-x86-64-avx2.exe")
    except Exception as e:
        print(f"Engine error: {e}")
        engine = None
    
    # Parse TimeControl
    tc = game.headers.get("TimeControl", "60")
    inc = int(tc.split("+")[1]) if "+" in tc else 0
    base = int(tc.split("+")[0]) if "+" in tc else int(tc) if tc.isdigit() else 60
    
    while node.variations:
        # Evaluate before move
        score_before = 0
        best_move_uci = None
        if engine:
            info = engine.analyse(board, chess.engine.Limit(depth=engine_depth))
            score_before = info["score"].white().score(mate_score=10000)
            if "pv" in info and len(info["pv"]) > 0:
                best_move_uci = info["pv"][0].uci()
            
        next_node = node.variation(0)
        move = next_node.move
        san_move = board.san(move)
        played_move_uci = move.uci()
        board.push(move)
        
        # Evaluate after move
        score_after = 0
        if engine:
            info = engine.analyse(board, chess.engine.Limit(depth=engine_depth))
            score_after = info["score"].white().score(mate_score=10000)
            
        # Centipawn loss for the player who just moved (white moved if turn is now black)
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
                classification = "Best" # fallback if engine fails
                
        # Basic Opening Book simulation (first 5 moves)
        if move_num <= 5 and classification in ["Best", "Excellent", "Good"]:
            classification = "Book"
            
        # Time calculation
        current_clock = next_node.clock()
        if current_clock is None:
            time_str = "0.1s"
        else:
            if node == game or node.parent == game:
                prev_clock = base
                time_spent = prev_clock - current_clock
            else:
                prev_clock = node.parent.clock()
                time_spent = prev_clock - current_clock + inc
            time_spent = max(0.1, time_spent)
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
            "best_move": best_move_uci
        })
        
        if classification:
            classification_counts[color][classification] = classification_counts[color].get(classification, 0) + 1
        
        if color == "black":
            move_num += 1
            
        node = next_node
        
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
            "black": round(black_caps_sum / max(1, black_moves_count), 1)
        }
    }

@app.post("/api/analyze")
async def analyze_game(req: AnalyzeRequest):
    url = req.url
    engine_depth = req.depth or 10
    
    if "chess.com" not in url and "lichess.org" not in url:
        raise HTTPException(status_code=400, detail="Invalid URL. Must be chess.com or lichess.org")
        
    db = SessionLocal()
    try:
        # Check DB cache
        db_game = db.query(GameRecord).filter(
            GameRecord.url == url, 
            GameRecord.depth == str(engine_depth)
        ).first()
        if db_game:
            return db_game.data
            
        if "lichess.org" in url:
            parts = url.split("lichess.org/")
            if len(parts) > 1:
                game_id = parts[1].split("/")[0]
            else:
                raise HTTPException(status_code=400, detail="Could not extract Lichess game ID")
                
            headers = {"Accept": "application/x-chess-pgn"}
            lichess_url = f"https://lichess.org/game/export/{game_id}"
            res = requests.get(lichess_url, headers=headers, timeout=10)
            res.raise_for_status()
            pgn_str = res.text
            
            game_data = parse_pgn(pgn_str, engine_depth)
            if not game_data:
                raise HTTPException(status_code=500, detail="Failed to parse PGN data")
                
            new_record = GameRecord(url=url, depth=str(engine_depth), data=game_data)
            db.add(new_record)
            db.commit()
            return game_data
            
        elif "chess.com" in url:
            # Extract ID
            if "/live/" in url:
                game_id = url.split("/live/")[1].split("/")[0].split("?")[0]
            elif "/game/" in url:
                game_id = url.split("/game/")[1].split("/")[0].split("?")[0]
            else:
                raise HTTPException(status_code=400, detail="Could not extract game ID")
                
            headers = {"User-Agent": "Chess.com API Fetcher"}
            
            # 1. Fetch callback to get player username and game date
            cb_url = f"https://www.chess.com/callback/live/game/{game_id}"
            cb_res = requests.get(cb_url, headers=headers, timeout=10)
            cb_res.raise_for_status()
            cb_data = cb_res.json()
            
            uuid = cb_data['game']['uuid']
            end_time = cb_data['game']['endTime']
            dt = datetime.datetime.fromtimestamp(end_time)
            
            # Try top or bottom player
            players = cb_data.get('players', {})
            if 'top' in players:
                username = players['top']['username']
            elif 'bottom' in players:
                username = players['bottom']['username']
            else:
                raise HTTPException(status_code=404, detail="Could not find players in game data")
                
            # 2. Fetch the public API monthly archive
            archive_url = f"https://api.chess.com/pub/player/{username}/games/{dt.year}/{dt.month:02d}"
            arch_res = requests.get(archive_url, headers=headers, timeout=10)
            arch_res.raise_for_status()
            games = arch_res.json().get("games", [])
            
            # 3. Find the matching game
            pgn_str = None
            for g in games:
                if g.get('uuid') == uuid or str(g.get('url', '')).endswith(str(game_id)):
                    pgn_str = g.get('pgn')
                    break
                    
            if not pgn_str:
                raise HTTPException(status_code=404, detail="Game not found in monthly archive")
                
            # Parse PGN
            game_data = parse_pgn(pgn_str, engine_depth)
            if not game_data:
                raise HTTPException(status_code=500, detail="Failed to parse PGN data")
                
            new_record = GameRecord(url=url, depth=str(engine_depth), data=game_data)
            db.add(new_record)
            db.commit()
            return game_data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from chess.com: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing game: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
