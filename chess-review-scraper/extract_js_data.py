import json
from playwright.sync_api import sync_playwright

def get_review_data():
    with open('cookies.json', 'r') as f:
        cookies = json.load(f)
    
    clean_cookies = []
    for c in cookies:
        cookie = {
            'name': c['name'],
            'value': c['value'],
            'domain': c['domain'],
            'path': c['path'],
            'secure': c.get('secure', False),
            'httpOnly': c.get('httpOnly', False),
            'sameSite': c.get('sameSite', 'Lax').capitalize()
        }
        if 'expirationDate' in c:
            cookie['expires'] = c['expirationDate']
        if cookie['sameSite'].lower() == 'no_restriction':
            cookie['sameSite'] = 'None'
        clean_cookies.append(cookie)

    print("Launching browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        page.goto('https://www.chess.com/analysis/game/live/170804338698/review?flip=true')
        print("Waiting for review to load...")
        page.wait_for_timeout(10000)
        
        data = page.evaluate('''() => {
            try {
                let moves = [];
                // Look at the window object or chess.com global
                let controller = document.querySelector('chess-board')?.game;
                if (!controller) {
                    // Try to find the move list component which often has the data
                    return "Could not find chess-board game controller.";
                }
                
                let playingMoves = controller.getPlayingMoves ? controller.getPlayingMoves() : controller.moves;
                if (!playingMoves) return "No moves found in controller.";
                
                for (let i = 0; i < playingMoves.length; i++) {
                    let m = playingMoves[i];
                    let san = m.san || m.notation || m.text || '';
                    let review = m.review || m.eval || m.parsedEval || '';
                    let classification = '';
                    if (review && review.classification) {
                        classification = ' [' + review.classification.toUpperCase() + ']';
                    } else if (m.icon) {
                        classification = ' [' + m.icon.toUpperCase() + ']';
                    }
                    if (san) moves.push((i%2===0 ? (Math.floor(i/2)+1)+". " : "") + san + classification);
                }
                return moves.join(' ');
            } catch (e) {
                return e.toString();
            }
        }''')
        
        with open('all_moves_annotated.txt', 'w', encoding='utf-8') as f:
            f.write(str(data))
            
        print("Output saved to all_moves_annotated.txt")
        browser.close()

if __name__ == '__main__':
    get_review_data()
