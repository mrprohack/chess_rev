import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const mainUrl = new URL('../main.jsx', import.meta.url);
const mobileCssUrl = new URL('../Mobile.css', import.meta.url);

function readMobileCss() {
  assert.equal(existsSync(mobileCssUrl), true, 'Mobile.css should exist');
  return readFileSync(mobileCssUrl, 'utf8');
}

test('loads the mobile UX layer after the application module', () => {
  const mainSource = readFileSync(mainUrl, 'utf8');
  assert.match(
    mainSource,
    /import App from '\.\/App\.jsx'\s*\nimport '\.\/Mobile\.css'/,
    'Mobile.css should load after App.jsx so it can override only mobile presentation without rewriting desktop styles',
  );
});

test('keeps the primary mobile navigation in the bottom thumb zone with labels', () => {
  const css = readMobileCss();
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /\.sidebar\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*0;/s);
  assert.match(css, /\.sidebar-btn\s+span\s*\{[^}]*display:\s*(?:inline|block);/s);
  assert.match(css, /\.sidebar-btn\s*\{[^}]*min-height:\s*48px;/s);
  assert.match(css, /safe-area-inset-bottom/);
});

test('uses phone-friendly touch sizing for review actions and move rows', () => {
  const css = readMobileCss();
  assert.match(css, /\.analyze-btn[^}]*min-height:\s*48px;/s);
  assert.match(css, /\.control-btn[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.move-col[^}]*min-height:\s*48px;/s);
});

test('pins the mobile review controls above the primary navigation without covering moves', () => {
  const css = readMobileCss();
  assert.match(
    css,
    /\.panel-footer\s*\{[^}]*position:\s*fixed;[^}]*left:\s*50%;[^}]*bottom:\s*calc\(72px\s*\+\s*env\(safe-area-inset-bottom\)\);[^}]*z-index:\s*280;/s,
    'the review footer should stay fixed in the thumb zone directly above the mobile app navigation',
  );
  assert.match(
    css,
    /\.moves-list\s*\{[^}]*padding-bottom:\s*1(?:2[0-9]|[3-9][0-9])px;/s,
    'the move list should reserve enough space for the fixed review dock',
  );
  assert.match(
    css,
    /\.play-control\s*\{[^}]*min-width:\s*5[2-9]px;[^}]*min-height:\s*5[2-9]px;/s,
    'auto-play should be the easiest playback action to hit on mobile',
  );
});
