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

test('keeps the primary mobile navigation compact at the top with labels', () => {
  const css = readMobileCss();
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(
    css,
    /\.sidebar\s*\{[^}]*position:\s*fixed;[^}]*top:\s*0;[^}]*bottom:\s*auto;[^}]*height:\s*calc\(58px\s*\+\s*env\(safe-area-inset-top\)\);/s,
    'mobile page navigation should stay in a compact top bar instead of competing with playback at the bottom',
  );
  assert.match(css, /\.sidebar-btn\s+span\s*\{[^}]*display:\s*(?:inline|block);/s);
  assert.match(css, /\.sidebar-btn\s*\{[^}]*min-height:\s*44px;/s);
  assert.match(css, /safe-area-inset-top/);
});

test('uses phone-friendly touch sizing for review actions and move rows', () => {
  const css = readMobileCss();
  assert.match(css, /\.analyze-btn[^}]*min-height:\s*48px;/s);
  assert.match(css, /\.control-btn[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.move-col[^}]*min-height:\s*48px;/s);
});

test('keeps a compact move-control dock at the true bottom without covering moves', () => {
  const css = readMobileCss();
  assert.match(
    css,
    /\.panel-footer\s*\{[^}]*position:\s*fixed;[^}]*left:\s*50%;[^}]*bottom:\s*env\(safe-area-inset-bottom\);[^}]*z-index:\s*280;/s,
    'move controls should own the bottom thumb zone once page navigation moves to the top',
  );
  assert.match(
    css,
    /\.moves-list\s*\{[^}]*padding-bottom:\s*(?:8[0-9]|9[0-6])px;/s,
    'the move list should reserve only the compact dock height instead of wasting vertical space',
  );
  assert.match(
    css,
    /\.play-control\s*\{[^}]*min-width:\s*5[0-6]px;[^}]*min-height:\s*4[8-9]px;/s,
    'play should remain the strongest playback target without making the dock unnecessarily tall',
  );
});
