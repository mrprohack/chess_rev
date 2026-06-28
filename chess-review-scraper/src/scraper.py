import json
import argparse
from playwright.sync_api import sync_playwright

def extract_review(url, cookies_path='cookies.json', output_path='review_output.txt'):
    # Load cookies
    try:
        with open(cookies_path, 'r') as f:
            cookies = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find '{cookies_path}'.")
        print("Please export your chess.com cookies to this file first.")
        return

    # Clean and format cookies for Playwright
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
        
        # Playwright SameSite accepts 'Strict', 'Lax', 'None'
        if cookie['sameSite'].lower() == 'no_restriction':
            cookie['sameSite'] = 'None'
        clean_cookies.append(cookie)

    print("Launching headless browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        )
        context.add_cookies(clean_cookies)
        page = context.new_page()
        
        print(f"Navigating to {url}")
        page.goto(url)
        
        print("Waiting for page and review to load (15 seconds)...")
        page.wait_for_timeout(15000)
        
        try:
            # Try to grab the review container if it exists
            sidebar = page.query_selector('.layout-sidebar')
            if sidebar:
                text = sidebar.inner_text()
            else:
                text = page.evaluate('document.body.innerText')
        except Exception as e:
            text = f"Error extracting text: {str(e)}"
            
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
            
        print(f"Done. Output saved to {output_path}")
        browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Extract Game Review from chess.com")
    parser.add_argument('url', help="The URL of the chess.com game review")
    parser.add_argument('--cookies', default='cookies.json', help="Path to the JSON cookies file")
    parser.add_argument('--output', default='review_output.txt', help="Path to save the output text")
    
    args = parser.parse_args()
    extract_review(args.url, args.cookies, args.output)
