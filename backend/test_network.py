import json
from playwright.sync_api import sync_playwright
import time

def intercept_review(url):
    with open('../chess-review-scraper/cookies.json', 'r') as f:
        cookies = json.load(f)
    
    clean_cookies = []
    for c in cookies:
        clean_cookies.append({
            'name': c['name'],
            'value': c['value'],
            'domain': c['domain'],
            'path': c['path']
        })

    review_data = None

    def handle_response(response):
        nonlocal review_data
        # Morphy or similar endpoints for review
        if 'review' in response.url.lower() or 'analysis' in response.url.lower() or 'eval' in response.url.lower():
            if 'json' in response.headers.get('content-type', ''):
                try:
                    data = response.json()
                    # Check if this json looks like an evaluation
                    if 'moves' in data or 'evals' in data or 'review' in data:
                        print("Found interesting JSON at", response.url)
                        # We will just print the keys to see
                        print(list(data.keys()))
                except:
                    pass

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        context.add_cookies(clean_cookies)
        page = context.new_page()
        page.on("response", handle_response)
        
        print(f"Navigating to {url}")
        page.goto(url)
        page.wait_for_timeout(5000)
        
        btn = page.locator("a[aria-label='Game Review']").first
        if not btn.is_visible():
            btn = page.locator("a:has-text('Game Review')").first
            
        if btn.is_visible():
            btn.click()
            print("Clicked Game Review. Waiting 15s...")
            page.wait_for_timeout(15000)
            
        browser.close()

if __name__ == '__main__':
    intercept_review('https://www.chess.com/game/live/170863561538')
