# Usage Guide

## 1. Prerequisites
You need Python 3 installed on your system.

## 2. Installation
1. Open a terminal in the project directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install the requirements:
   ```bash
   pip install -r requirements.txt
   ```
5. Install the Playwright Chromium browser:
   ```bash
   python -m playwright install chromium
   ```

## 3. Configuration (Cookies)
To bypass the Chess.com Cloudflare checks and access the game review, you need your session cookies.
1. Use a browser extension (like EditThisCookie) to export your chess.com cookies in JSON format.
2. Save the output to a file named `cookies.json` in the root of this project.

## 4. Running the Scraper
Run the scraper using Python:
```bash
python src/scraper.py
```

The script will launch a headless browser, navigate to the targeted game review, wait for it to load, and save the extracted review text to `review_output.txt`.
