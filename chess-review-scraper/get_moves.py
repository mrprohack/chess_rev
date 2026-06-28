import json
import time
from playwright.sync_api import sync_playwright

def get_moves():
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
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        url = 'https://www.chess.com/analysis/game/live/170817879284/review'
        print(f"Navigating to {url}")
        page.goto(url)
        print("Waiting for page to load...")
        page.wait_for_timeout(8000)
        
        # Try clicking "Game Review" if it's a button
        try:
            # We look for a button containing the text Game Review
            review_btn = page.locator("button:has-text('Game Review')").first
            if review_btn.is_visible():
                review_btn.click(timeout=3000)
                print("Clicked 'Game Review'")
                page.wait_for_timeout(8000)
        except Exception as e:
            print("Could not click 'Game Review' (might already be active).")
        
        # Method 1: Extract from the 'Share' menu PGN
        try:
            print("Attempting to find share tab for PGN...")
            share_btn = page.locator("button[aria-label='Share']").first
            if share_btn.is_visible():
                share_btn.click(timeout=2000)
                page.wait_for_timeout(2000)
                pgn_tab = page.locator("text='PGN'").first
                if pgn_tab.is_visible():
                    pgn_tab.click(timeout=2000)
                    page.wait_for_timeout(1000)
                    
                # Look for PGN textarea or copy text
                pgn_text = page.evaluate("() => { const ta = document.querySelector('textarea'); return ta ? ta.value : ''; }")
                if pgn_text and '[Event' in pgn_text:
                    with open('moves.txt', 'w', encoding='utf-8') as f:
                        f.write(pgn_text)
                    print("Successfully saved PGN to moves.txt via Share menu.")
                    browser.close()
                    return
        except Exception as e:
            print("Share menu PGN extraction failed:", e)

        # Method 2: Extract text from DOM move list
        print("Extracting move list from DOM...")
        try:
            # Extract all move nodes
            moves = page.evaluate('''() => {
                let moveNodes = document.querySelectorAll('.move, .node, .move-text-component');
                if (moveNodes.length === 0) {
                    // Try getting the whole move list container text
                    let list = document.querySelector('.move-list-component') || document.querySelector('wc-move-list');
                    return list ? list.innerText : '';
                }
                return Array.from(moveNodes).map(e => e.innerText.trim()).filter(t => t.length > 0).join(' ');
            }''')
            if moves:
                with open('moves.txt', 'w', encoding='utf-8') as f:
                    f.write(moves)
                print("Successfully saved moves from DOM to moves.txt")
                browser.close()
                return
        except Exception as e:
            print("DOM move list extraction failed:", e)

        # Fallback: Save whole page text
        print("Fallback: Saving all page text...")
        with open('moves.txt', 'w', encoding='utf-8') as f:
            f.write(page.evaluate('document.body.innerText'))
        print("Saved fallback page text to moves.txt")
        browser.close()

if __name__ == '__main__':
    get_moves()
