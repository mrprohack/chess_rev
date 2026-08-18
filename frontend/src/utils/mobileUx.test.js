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

test('keeps a minimal three-action mobile navigation at the top', () => {
  const css = readMobileCss();
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(
    css,
    /\.sidebar\s*\{[^}]*position:\s*fixed;[^}]*top:\s*0;[^}]*bottom:\s*auto;[^}]*height:\s*calc\(48px\s*\+\s*env\(safe-area-inset-top\)\);/s,
    'the mobile page navigation should use a smaller 48px top bar',
  );
  assert.match(
    css,
    /\.sidebar-nav-list\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s,
    'mobile navigation should only reserve space for Review, History, and Settings',
  );
  assert.match(
    css,
    /\.sidebar-link\s*\{[^}]*display:\s*none;/s,
    'the external Chess.com Play link should not be shown to mobile users',
  );
  assert.match(css, /\.sidebar-btn\s+span\s*\{[^}]*display:\s*(?:inline|block);/s);
  assert.match(css, /safe-area-inset-top/);
});

test('uses phone-friendly touch sizing for review actions and move rows', () => {
  const css = readMobileCss();
  assert.match(css, /\.analyze-btn[^}]*min-height:\s*48px;/s);
  assert.match(css, /\.control-btn[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.move-col[^}]*min-height:\s*48px;/s);
});

test('keeps a slim move-control dock at the true bottom without covering moves', () => {
  const css = readMobileCss();
  assert.match(
    css,
    /\.panel-footer\s*\{[^}]*position:\s*fixed;[^}]*left:\s*50%;[^}]*bottom:\s*env\(safe-area-inset-bottom\);[^}]*min-height:\s*(?:5[8-9]|60)px;/s,
    'move controls should use a slim 58-60px bottom dock',
  );
  assert.match(
    css,
    /\.moves-list\s*\{[^}]*padding-bottom:\s*(?:7[2-9]|80)px;/s,
    'the move list should reserve only enough space for the slimmer bottom dock',
  );
  assert.match(
    css,
    /\.play-control\s*\{[^}]*min-width:\s*5[0-6]px;[^}]*min-height:\s*44px;/s,
    'play should remain visually strongest while the dock stays compact',
  );
});
