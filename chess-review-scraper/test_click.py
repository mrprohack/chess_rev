import json
from playwright.sync_api import sync_playwright

def test():
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

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        page.goto("https://www.chess.com/game/live/167709467654")
        page.wait_for_timeout(5000)
        
        try:
            btn = page.locator("a[aria-label='Game Review']").first
            btn.click(timeout=5000)
        except:
            pass
            
        page.wait_for_timeout(10000)
        
        # Click the magnifying glass (Analysis tab)
        try:
            page.locator(".icon-font-chess.magnifying-glass").first.click(timeout=3000)
            print("Clicked Magnifying Glass")
        except Exception as e:
            print("Failed to click magnifying glass:", e)
            
        page.wait_for_timeout(3000)
        
        # Take screenshot
        page.screenshot(path="screenshot_analysis.png")
        browser.close()

if __name__ == '__main__':
    test()
