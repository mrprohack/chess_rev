import json
from playwright.sync_api import sync_playwright
import time

def get_classifications(url):
    with open('../chess-review-scraper/cookies.json', 'r') as f:
        cookies = json.load(f)
    
    clean_cookies = []
    for c in cookies:
        cookie = {
            'name': c['name'],
            'value': c['value'],
            'domain': c['domain'],
            'path': c['path']
        }
        clean_cookies.append(cookie)

    print("Launching browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        print(f"Navigating to {url}")
        page.goto(url)
        page.wait_for_timeout(5000)
        
        print("Clicking Game Review...")
        try:
            btn = page.locator("a[aria-label='Game Review']").first
            if not btn.is_visible():
                btn = page.locator("a:has-text('Game Review')").first
            
            if btn.is_visible():
                btn.click()
                print("Clicked Game Review. Waiting 15s...")
                page.wait_for_timeout(15000)
            else:
                print("Game Review button not found!")
                # Just continue, maybe we are already in review
        except Exception as e:
            print("Error clicking:", e)
            
        print("Extracting classifications using locators...")
        # Playwright locators automatically pierce shadow DOMs
        icons = page.locator('.icon-font-chess')
        count = icons.count()
        print(f"Found {count} icon-font-chess elements")
        
        results = []
        for i in range(count):
            cls = icons.nth(i).get_attribute("class") or ""
            if 'brilliant' in cls: results.append('Brilliant')
            elif 'great' in cls: results.append('Great')
            elif 'best' in cls: results.append('Best')
            elif 'excellent' in cls: results.append('Excellent')
            elif 'good' in cls: results.append('Good')
            elif 'inaccuracy' in cls: results.append('Inaccuracy')
            elif 'mistake' in cls: results.append('Mistake')
            elif 'miss' in cls: results.append('Miss')
            elif 'blunder' in cls: results.append('Blunder')
            elif 'book' in cls: results.append('Book')
            # we also have some other icons, like arrows.
            # let's only get the ones that represent a move evaluation.
            
        # But we need them matched to moves! 
        # So we should get the move texts and their icons.
        move_nodes = page.locator('.move-node-component, div > span[data-cy="move-text"]')
        node_count = move_nodes.count()
        print(f"Found {node_count} move nodes")
        
        moves_data = []
        for i in range(node_count):
            node = move_nodes.nth(i)
            text = node.inner_text().strip()
            
            # Find the icon next to or inside it
            # since move-node-component is the wrapper, we look for icon-font-chess inside it
            icon = node.locator('.icon-font-chess').first
            cls = ""
            if icon.count() > 0:
                cls = icon.get_attribute("class") or ""
                
            eval_class = ""
            if 'brilliant' in cls: eval_class = 'Brilliant'
            elif 'great' in cls: eval_class = 'Great'
            elif 'best' in cls: eval_class = 'Best'
            elif 'excellent' in cls: eval_class = 'Excellent'
            elif 'good' in cls: eval_class = 'Good'
            elif 'inaccuracy' in cls: eval_class = 'Inaccuracy'
            elif 'mistake' in cls: eval_class = 'Mistake'
            elif 'miss' in cls: eval_class = 'Miss'
            elif 'blunder' in cls: eval_class = 'Blunder'
            elif 'book' in cls: eval_class = 'Book'
            
            moves_data.append(eval_class)
            
        browser.close()
        return moves_data

if __name__ == '__main__':
    res = get_classifications('https://www.chess.com/game/live/170863561538')
    print("Classifications found:", len(res))
    print(res)
