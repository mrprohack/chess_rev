import json
import argparse
import time
from playwright.sync_api import sync_playwright

def get_annotated_pgn(url):
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

    print("Launching browser in headed mode...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        # Ensure we navigate to the base page to click the Game Review button
        if "/analysis/" in url:
            game_id = url.split("/live/")[1].split("/")[0].split("?")[0]
            url = f"https://www.chess.com/game/live/{game_id}"
            
        print(f"Navigating to {url}")
        page.goto(url)
        page.wait_for_timeout(5000)
        
        print("Looking for the Game Review button...")
        try:
            btn = page.locator("a[aria-label='Game Review']").first
            if btn.is_visible():
                btn.click()
                print("Clicked the Game Review button!")
            else:
                btn = page.locator("a:has-text('Game Review')").first
                if btn.is_visible():
                    btn.click()
                    print("Clicked Game Review via text!")
                else:
                    print("Game review button not found.")
        except Exception as e:
            print("Could not click Game Review button:", e)

        print("Waiting 15 seconds for the Game Review to fully load and analyze...")
        page.wait_for_timeout(15000)
        
        # Now click the "Moves" or "Details" tab so the move list renders
        print("Switching to the Details/Moves tab...")
        for tab_name in ['Details', 'Moves']:
            try:
                tab = page.locator(f"text='{tab_name}'").first
                if tab.is_visible():
                    tab.click(timeout=3000)
                    page.wait_for_timeout(2000)
                    print(f"Clicked '{tab_name}' tab.")
                    break
            except:
                pass
                
        print("Extracting annotated moves...")
        moves = page.evaluate('''() => {
            let moves = [];
            // We select ALL rows that contain moves
            let rows = document.querySelectorAll('.move');
            
            if (rows.length === 0) {
                // Fallback for different UI structure
                let allNodes = document.querySelectorAll('.node, .move-text-component');
                let flatMoves = [];
                allNodes.forEach(node => {
                    let textNode = node.querySelector('span[data-cy="move-text"]') || node;
                    let text = textNode.innerText.replace(/\\s+/g, '').trim();
                    let icon = node.querySelector('.icon-font-chess');
                    let classification = '';
                    if (icon) {
                        let cls = icon.className;
                        if (cls.includes('brilliant')) classification = ' [BRILLIANT!!]';
                        else if (cls.includes('great')) classification = ' [GREAT!]';
                        else if (cls.includes('best')) classification = ' [BEST]';
                        else if (cls.includes('excellent')) classification = ' [EXCELLENT]';
                        else if (cls.includes('good')) classification = ' [GOOD]';
                        else if (cls.includes('inaccuracy')) classification = ' [INACCURACY?!]';
                        else if (cls.includes('mistake')) classification = ' [MISTAKE?]';
                        else if (cls.includes('miss')) classification = ' [MISS]';
                        else if (cls.includes('blunder')) classification = ' [BLUNDER??]';
                        else if (cls.includes('book')) classification = ' [BOOK]';
                    }
                    if (text) flatMoves.push(text + classification);
                });
                return flatMoves.join(' ');
            }
            
            rows.forEach(row => {
                let moveNum = row.querySelector('[class*="move-number"]');
                let numText = moveNum ? moveNum.innerText.trim() : '';
                
                let nodes = row.querySelectorAll('.node, .move-text-component');
                let rowMoves = [];
                nodes.forEach(node => {
                    let textNode = node.querySelector('span[data-cy="move-text"]') || node;
                    let text = textNode.innerText.trim();
                    
                    let icon = node.querySelector('.icon-font-chess');
                    let classification = '';
                    if (icon) {
                        let cls = icon.className;
                        if (cls.includes('brilliant')) classification = ' [BRILLIANT!!]';
                        else if (cls.includes('great')) classification = ' [GREAT!]';
                        else if (cls.includes('best')) classification = ' [BEST]';
                        else if (cls.includes('excellent')) classification = ' [EXCELLENT]';
                        else if (cls.includes('good')) classification = ' [GOOD]';
                        else if (cls.includes('inaccuracy')) classification = ' [INACCURACY?!]';
                        else if (cls.includes('mistake')) classification = ' [MISTAKE?]';
                        else if (cls.includes('miss')) classification = ' [MISS]';
                        else if (cls.includes('blunder')) classification = ' [BLUNDER??]';
                        else if (cls.includes('book')) classification = ' [BOOK]';
                    }
                    if (text) rowMoves.push(text + classification);
                });
                
                if (numText && rowMoves.length > 0) {
                    moves.push(numText + ' ' + rowMoves.join(' '));
                } else if (rowMoves.length > 0) {
                    moves.push(rowMoves.join(' '));
                }
            });
            return moves.join('\\n');
        }''')
        
        if moves:
            with open('annotated_moves.txt', 'w', encoding='utf-8') as f:
                f.write(moves)
            print("Successfully extracted annotated moves to annotated_moves.txt")
        else:
            print("Failed to find annotated moves. HTML might be structured differently.")
                
        browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Extract all moves with classifications from chess.com")
    parser.add_argument('url', help="The URL of the chess.com game")
    args = parser.parse_args()
    get_annotated_pgn(args.url)
