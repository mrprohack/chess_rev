# Chess Review Scraper

A Python project that uses Playwright to automatically extract Game Review data (Accuracy, Move Classifications, Estimated Ratings) from a Chess.com game analysis URL.

## Features
- Avoids login hurdles by utilizing an existing session's `cookies.json`.
- Uses a Chromium headless browser to load the JavaScript-dependent Game Review page.
- Extracts and saves the raw text of the game review panel.

## Setup and Usage
Please refer to the documentation in `docs/usage.md` for full instructions.
