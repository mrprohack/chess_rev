from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import chess.pgn
import chess.engine
import io
import datetime

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

def parse_pgn(pgn_str: str):
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
        if engine:
            info = engine.analyse(board, chess.engine.Limit(depth=10))
            score_before = info["score"].white().score(mate_score=10000)
            
        next_node = node.variation(0)
        move = next_node.move
        san_move = board.san(move)
        board.push(move)
        
        # Evaluate after move
        score_after = 0
        if engine:
            info = engine.analyse(board, chess.engine.Limit(depth=10))
            score_after = info["score"].white().score(mate_score=10000)
            
        # Centipawn loss for the player who just moved (white moved if turn is now black)
        color = "white" if board.turn == chess.BLACK else "black"
        if color == "white":
            cp_loss = score_before - score_after
        else:
            cp_loss = score_after - score_before
            
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
                if cp_loss <= -4: classification = "Great"
                elif cp_loss <= 3: classification = "Best"
                elif cp_loss <= 8: classification = "Excellent"
                elif cp_loss <= 15: classification = "Good"
                elif cp_loss <= 50: classification = "Inaccuracy"
                elif cp_loss <= 150: classification = "Mistake"
                else: classification = "Blunder"
            else:
                classification = "Best" # fallback if engine fails
            
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
            "time": time_str
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
        "moves": moves,
        "counts": classification_counts
    }

@app.post("/api/analyze")
async def analyze_game(req: AnalyzeRequest):
    url = req.url
    
    if "chess.com" not in url:
        raise HTTPException(status_code=400, detail="Invalid chess.com URL")
        
    try:
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
        game_data = parse_pgn(pgn_str)
        if not game_data:
            raise HTTPException(status_code=500, detail="Failed to parse PGN data")
            
        return game_data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from chess.com: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing game: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
