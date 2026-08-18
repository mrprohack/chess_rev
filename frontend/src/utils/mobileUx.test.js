import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const mainUrl = new URL('../main.jsx', import.meta.url);
const mobileCssUrl = new URL('../Mobile.css', import.meta.url);
const mobileReviewCssUrl = new URL('../MobileReview.css', import.meta.url);

function readMobileCss() {
  assert.equal(existsSync(mobileCssUrl), true, 'Mobile.css should exist');
  return readFileSync(mobileCssUrl, 'utf8');
}

function readMobileReviewCss() {
  assert.equal(existsSync(mobileReviewCssUrl), true, 'MobileReview.css should exist');
  return readFileSync(mobileReviewCssUrl, 'utf8');
}

test('loads the mobile UX layers after the application module', () => {
  const mainSource = readFileSync(mainUrl, 'utf8');
  assert.match(
    mainSource,
    /import App from '\.\/App\.jsx'\s*\nimport '\.\/Mobile\.css'\s*\nimport '\.\/MobileReview\.css'/,
    'Mobile review overrides should load after the base mobile UX layer',
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
  const css = `${readMobileCss()}\n${readMobileReviewCss()}`;
  assert.match(css, /\.analyze-btn[^}]*min-height:\s*48px;/s);
  assert.match(css, /\.control-btn[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.move-col[^}]*min-height:\s*48px;/s);
});

test('fills the mobile review viewport and keeps playback inside the panel', () => {
  const css = readMobileReviewCss();
  assert.match(
    css,
    /\.layout-container\s*\{[^}]*padding-bottom:\s*0;/s,
    'the page should not reserve fake space for a viewport-fixed playback dock',
  );
  assert.match(
    css,
    /\.right-panel,\s*\.right-panel--motion\s*\{[^}]*height:\s*calc\(100dvh\s*-\s*54px\s*-\s*env\(safe-area-inset-top\)\);[^}]*min-height:\s*0;[^}]*max-height:\s*none;/s,
    'the phone review panel should use the available viewport instead of stopping at 78dvh',
  );
  assert.match(
    css,
    /\.panel-footer\s*\{[^}]*position:\s*sticky;[^}]*left:\s*auto;[^}]*bottom:\s*0;[^}]*transform:\s*none;[^}]*width:\s*100%;/s,
    'playback should be an in-panel sticky footer rather than a viewport-fixed overlay',
  );
  assert.match(
    css,
    /\.moves-list\s*\{[^}]*min-height:\s*0;[^}]*padding-bottom:\s*[4-9]px;/s,
    'the move list should flex-scroll naturally without a large fake footer reserve',
  );
});

test('shows the complete seven-control playback row at the mobile bottom', () => {
  const css = readMobileReviewCss();
  assert.match(
    css,
    /\.controls\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\);/s,
    'Share, First, Previous, Play, Next, Last, and Flip should share one balanced mobile row',
  );
  assert.match(
    css,
    /\.controls-main\s*\{[^}]*display:\s*contents;/s,
    'the nested playback group should participate directly in the seven-column mobile grid',
  );
  assert.match(
    css,
    /\.controls\s*>\s*\.control-btn:first-child\s*\{[^}]*display:\s*flex;/s,
    'the Share action should remain visible in the mobile bottom controls',
  );
  assert.match(
    css,
    /\.control-btn:disabled\s*\{[^}]*opacity:\s*0?\.[23][0-9]?;/s,
    'disabled navigation controls should remain visible but clearly subdued',
  );
  assert.match(
    css,
    /\.play-control\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s,
    'play should remain touch-safe while fitting the complete row',
  );
});
