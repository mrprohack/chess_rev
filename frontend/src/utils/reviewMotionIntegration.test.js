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
const scopePath = path.join(componentsDir, 'ReviewMotionScope.jsx');
const moveStoryPath = path.join(componentsDir, 'MoveStory.jsx');
const appPath = path.join(srcDir, 'App.jsx');
const cssPath = path.join(srcDir, 'CinematicMotion.css');

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
  assert.match(source, /CinematicMotion\.css/);
  assert.doesNotMatch(source, /board-moment-badge/);
});

test('BoardArea forwards the shared review motion without replacing deterministic board replay', () => {
  const source = read(boardAreaPath);
  assert.match(source, /reviewMotion/);
  assert.match(source, /animationMove/);
  assert.match(source, /animationDirection/);
  assert.match(source, /reviewMotion=\{boardReviewMotion\}/);
});

test('BoardArea derives an immediate one-ply pieceMoving phase before App effects can run', () => {
  const source = read(boardAreaPath);
  assert.match(source, /boardReviewMotion/);
  assert.match(source, /Math\.abs\(delta\) === 1/);
  assert.match(source, /phase:\s*shouldAnimateImmediate\s*\?\s*['"]pieceMoving['"]\s*:\s*['"]settled['"]/);
  assert.match(source, /reviewMotion\?\.reducedMotion/);
});

test('App includes reduced-motion state inside the shared review motion payload', () => {
  const source = read(appPath);
  assert.match(source, /reducedMotion:\s*prefersReducedMotion/);
});

test('cinematic board CSS includes verdict placement, landing effects, and distinct verdict motions', () => {
  assert.equal(fs.existsSync(cssPath), true, 'CinematicMotion.css should exist');
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

test('review panel descendants share the same motion phase without putting timing logic in RightPanel', () => {
  assert.equal(fs.existsSync(scopePath), true, 'ReviewMotionScope.jsx should exist');
  const app = read(appPath);
  const scope = read(scopePath);
  assert.match(app, /ReviewMotionScope/);
  assert.match(app, /reviewMotion=\{reviewMotion\}/);
  assert.match(scope, /data-review-motion-phase/);
  assert.match(scope, /display/);
  assert.match(scope, /useReviewMotion/);
});

test('MoveStory holds the previous explanation until panelSync and isolates bookmark pulse state', () => {
  const source = read(moveStoryPath);
  assert.match(source, /useReviewMotion/);
  assert.match(source, /panelSync/);
  assert.match(source, /displayState/);
  assert.match(source, /bookmarkPulseToken/);
  assert.match(source, /bookmark-icon-pulse/);
});

test('selected move rows echo classification tone only during panel sync', () => {
  const css = read(cssPath);
  assert.match(css, /review-motion-scope\[data-review-motion-phase=["']panelSync["']\]/);
  assert.match(css, /\.move-col\.selected/);
  assert.match(css, /move-class-icon\.blunder/);
  assert.match(css, /move-class-icon\.brilliant/);
  assert.match(css, /review-row-sweep/);
});

test('bookmark micro-animation is local to the bookmark icon', () => {
  const css = read(cssPath);
  assert.match(css, /\.bookmark-icon-pulse/);
  assert.match(css, /bookmark-snap/);
  assert.doesNotMatch(css, /\.motion-board[^\{]*\{[^\}]*bookmark-snap/s);
});
