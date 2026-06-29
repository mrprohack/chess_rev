import chess.pgn

cp_losses = [5, 101, 91, -9, 0, 88, 74, 24, 33, 31, -4, -11, 32, 1, 98, 24, 77, 34, 0, -9, 445, -8, -6, 3, 31, -15, 29, 9, -6, 8, 9388, -1, 0, -1]

target_great = 2
target_best = 6
target_excellent = 5

for book in range(0, 16):
    valid_cps = cp_losses[book:]
    for great_t in range(-150, 20):
        for best_t in range(great_t + 1, 50):
            for excellent_t in range(best_t + 1, 100):
                great = 0
                best = 0
                excellent = 0
                
                for cp in valid_cps:
                    if cp <= great_t:
                        great += 1
                    elif cp <= best_t:
                        best += 1
                    elif cp <= excellent_t:
                        excellent += 1
                        
                if great == target_great and best == target_best and excellent == target_excellent:
                    print(f"FOUND MATCH: Book: {book}, Great <= {great_t}, Best <= {best_t}, Excellent <= {excellent_t}")
                    exit(0)
                    
print("No match found.")
