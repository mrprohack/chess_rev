import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appUrl = new URL('../App.jsx', import.meta.url);
const mobileCssUrl = new URL('../Mobile.css', import.meta.url);

function readMobileCss() {
  assert.equal(existsSync(mobileCssUrl), true, 'Mobile.css should exist');
  return readFileSync(mobileCssUrl, 'utf8');
}

test('loads the mobile UX layer after the existing app styles', () => {
  const appSource = readFileSync(appUrl, 'utf8');
  assert.match(
    appSource,
    /import '\.\/ReviewEnhancements\.css';\s*import '\.\/Mobile\.css';/,
    'Mobile.css should be imported after ReviewEnhancements.css so mobile overrides win without changing desktop styles',
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
