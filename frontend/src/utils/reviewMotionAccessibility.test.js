import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getVerdictPlacement } from './reviewMotion.js';

const utilsDir = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(utilsDir, '..', 'CinematicMotion.css');
const css = fs.readFileSync(cssPath, 'utf8');

test('reduced-motion users keep verdict information without shake bounce or sweep', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.board-verdict/);
  assert.match(css, /\.landing-effect/);
  assert.match(css, /\.review-story-transition/);
  assert.match(css, /\.bookmark-icon-pulse/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /transition[^;]*1ms/);
});

test('cinematic motion never shakes or animates the whole chessboard container', () => {
  assert.doesNotMatch(css, /\.motion-board\s*\{[^}]*animation\s*:/s);
  assert.doesNotMatch(css, /\.motion-board\s*\{[^}]*translate\s*:/s);
});

test('move-row sweep is scoped to the selected move during panelSync', () => {
  assert.match(css, /review-motion-scope\[data-review-motion-phase="panelSync"\]\s+\.move-col\.selected/);
  assert.doesNotMatch(css, /review-row-sweep[^}]*\.move-row/s);
  assert.doesNotMatch(css, /review-row-sweep[^}]*\.moves-list/s);
});

test('all board corners choose an inward verdict placement when unflipped', () => {
  assert.equal(getVerdictPlacement('a7a8', false).placement, 'bottom-right');
  assert.equal(getVerdictPlacement('h7h8', false).placement, 'bottom-left');
  assert.equal(getVerdictPlacement('a2a1', false).placement, 'top-right');
  assert.equal(getVerdictPlacement('h2h1', false).placement, 'top-left');
});

test('all board corners choose an inward verdict placement when flipped', () => {
  assert.equal(getVerdictPlacement('a7a8', true).placement, 'top-left');
  assert.equal(getVerdictPlacement('h7h8', true).placement, 'top-right');
  assert.equal(getVerdictPlacement('a2a1', true).placement, 'bottom-left');
  assert.equal(getVerdictPlacement('h2h1', true).placement, 'bottom-right');
});

test('invalid played moves do not create a destination anchor', () => {
  assert.equal(getVerdictPlacement('', false), null);
  assert.equal(getVerdictPlacement('bad', false), null);
  assert.equal(getVerdictPlacement('e2e9', false), null);
});
