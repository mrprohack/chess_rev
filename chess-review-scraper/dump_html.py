import json
from playwright.sync_api import sync_playwright

def dump_html():
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
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        page.goto('https://www.chess.com/analysis/game/live/170804338698/review?flip=true')
        page.wait_for_timeout(10000)
        
        # Click Details/Moves to make move list visible
        for tab_name in ['Details', 'Moves']:
            try:
                page.locator(f"text='{tab_name}'").first.click(timeout=2000)
                page.wait_for_timeout(2000)
                break
            except:
                pass
                
        with open('page_dump.html', 'w', encoding='utf-8') as f:
            f.write(page.content())
            
        browser.close()

if __name__ == '__main__':
    dump_html()
