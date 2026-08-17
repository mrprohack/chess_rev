import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const utilsDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(utilsDir, '..');
const componentsDir = path.join(srcDir, 'components');
const chessBoardPath = path.join(componentsDir, 'ChessBoard.jsx');
const boardAreaPath = path.join(componentsDir, 'BoardArea.jsx');
const badgePath = path.join(componentsDir, 'BoardVerdictBadge.jsx');
const landingPath = path.join(componentsDir, 'LandingEffect.jsx');
const cssPath = path.join(srcDir, 'ReviewEnhancements.css');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

test('board has dedicated destination verdict and landing overlay components', () => {
  assert.equal(fs.existsSync(badgePath), true, 'BoardVerdictBadge.jsx should exist');
  assert.equal(fs.existsSync(landingPath), true, 'LandingEffect.jsx should exist');
});

test('ChessBoard stages overlays and arrows from the shared review motion phase', () => {
  const source = read(chessBoardPath);
  assert.match(source, /BoardVerdictBadge/);
  assert.match(source, /LandingEffect/);
  assert.match(source, /getArrowReveal/);
  assert.match(source, /reviewMotion/);
  assert.doesNotMatch(source, /board-moment-badge/);
});

test('BoardArea forwards the shared review motion without replacing deterministic board replay', () => {
  const source = read(boardAreaPath);
  assert.match(source, /reviewMotion/);
  assert.match(source, /animationMove/);
  assert.match(source, /animationDirection/);
  assert.match(source, /reviewMotion=\{reviewMotion\}/);
});

test('cinematic board CSS includes verdict placement, landing effects, and distinct verdict motions', () => {
  const css = read(cssPath);
  for (const token of [
    '.board-verdict',
    '.landing-effect',
    'verdict-book',
    'verdict-brilliant',
    'verdict-inaccuracy',
    'verdict-mistake',
    'verdict-miss',
    'verdict-blunder',
  ]) {
    assert.match(css, new RegExp(token.replace('.', '\\.')));
  }
});
