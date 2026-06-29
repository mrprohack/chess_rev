import chess.pgn
import chess.engine
import io

def tune_thresholds():
    engine = chess.engine.SimpleEngine.popen_uci("stockfish/stockfish/stockfish-windows-x86-64-avx2.exe")
    
    with open("game.pgn", "r") as f:
        game = chess.pgn.read_game(f)
        
    board = game.board()
    node = game
    
    cp_losses = []
    
    while node.variations:
        score_before = 0
        info = engine.analyse(board, chess.engine.Limit(depth=10))
        score_before = info["score"].white().score(mate_score=10000)
            
        next_node = node.variation(0)
        move = next_node.move
        board.push(move)
        
        score_after = 0
        info = engine.analyse(board, chess.engine.Limit(depth=10))
        score_after = info["score"].white().score(mate_score=10000)
            
        color = "white" if board.turn == chess.BLACK else "black"
        if color == "white":
            cp_loss = score_before - score_after
        else:
            cp_loss = score_after - score_before
            
        cp_losses.append(cp_loss)
        node = next_node
        
    engine.quit()
    
    print("CP Losses:", cp_losses)
    
    # Target counts
    target_great = 2
    target_best = 6
    target_excellent = 5
    
    for great_t in range(-150, 0):
        for best_t in range(0, 50):
            for excellent_t in range(best_t + 1, 100):
                great = 0
                best = 0
                excellent = 0
                
                for cp in cp_losses:
                    if cp <= great_t:
                        great += 1
                    elif cp <= best_t:
                        best += 1
                    elif cp <= excellent_t:
                        excellent += 1
                        
                if great == target_great and best == target_best and excellent == target_excellent:
                    print(f"FOUND MATCH: Great <= {great_t}, Best <= {best_t}, Excellent <= {excellent_t}")
                    return
                    
    print("No perfect match found.")

if __name__ == "__main__":
    tune_thresholds()
