import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.join(here, 'reviewMotion.js');

async function loadMotionModule() {
  assert.equal(fs.existsSync(modulePath), true, 'reviewMotion.js should exist');
  return import(pathToFileURL(modulePath));
}

test('maps chess classifications to distinct cinematic presets', async () => {
  const { getMotionPreset } = await loadMotionModule();
  const expected = {
    book: ['📖', 'book'],
    good: ['✓', 'subtle'],
    great: ['!', 'great'],
    brilliant: ['!!', 'brilliant'],
    inaccuracy: ['?!', 'inaccuracy'],
    mistake: ['?', 'mistake'],
    miss: ['✕', 'miss'],
    blunder: ['??', 'blunder'],
  };
  for (const [classification, [symbol, motion]] of Object.entries(expected)) {
    const preset = getMotionPreset(classification);
    assert.equal(preset.symbol, symbol, classification);
    assert.equal(preset.motion, motion, classification);
  }
});

test('normalizes supported classifications without changing review semantics', async () => {
  const { normalizeMotionClassification } = await loadMotionModule();
  assert.equal(normalizeMotionClassification('  Brilliant  '), 'brilliant');
  assert.equal(normalizeMotionClassification('BEST'), 'best');
  assert.equal(normalizeMotionClassification('unknown'), '');
  assert.equal(normalizeMotionClassification(null), '');
});

test('reduced motion preserves verdict information but removes theatrical effects', async () => {
  const { getMotionPreset } = await loadMotionModule();
  const preset = getMotionPreset('blunder', true);
  assert.equal(preset.symbol, '??');
  assert.equal(preset.motion, 'reduced');
  assert.equal(preset.landing, 'none');
  assert.equal(preset.row, 'none');
});

test('places verdict badges beside destination pieces without clipping board edges', async () => {
  const { getVerdictPlacement } = await loadMotionModule();
  assert.equal(getVerdictPlacement('e2e4', false).placement, 'top-right');
  assert.equal(getVerdictPlacement('a7a8', false).placement, 'bottom-right');
  assert.equal(getVerdictPlacement('h2h4', false).placement, 'top-left');
  assert.equal(getVerdictPlacement('h7h8', false).placement, 'bottom-left');
});

test('verdict placement follows flipped board orientation', async () => {
  const { getVerdictPlacement } = await loadMotionModule();
  assert.equal(getVerdictPlacement('h7h8', true).placement, 'top-right');
  assert.equal(getVerdictPlacement('a2a1', true).placement, 'bottom-left');
  assert.equal(getVerdictPlacement('e2e4', true).square, 'e4');
});

test('only one-ply navigation uses the full cinematic sequence', async () => {
  const { shouldAnimateReview } = await loadMotionModule();
  assert.equal(shouldAnimateReview(1, false), true);
  assert.equal(shouldAnimateReview(-1, false), true);
  assert.equal(shouldAnimateReview(2, false), false);
  assert.equal(shouldAnimateReview(0, false), false);
  assert.equal(shouldAnimateReview(1, true), false);
});

test('negative best-move correction waits until after the verdict', async () => {
  const { getArrowReveal } = await loadMotionModule();
  const moving = getArrowReveal('blunder', 'd1h5', 'g1f3', 'pieceMoving');
  const verdict = getArrowReveal('blunder', 'd1h5', 'g1f3', 'verdictReveal');
  const panel = getArrowReveal('blunder', 'd1h5', 'g1f3', 'panelSync');
  assert.deepEqual(moving, { showPlayed: false, showBest: false });
  assert.deepEqual(verdict, { showPlayed: true, showBest: false });
  assert.deepEqual(panel, { showPlayed: true, showBest: true });
});

test('positive key moves never show an unnecessary corrective arrow', async () => {
  const { getArrowReveal } = await loadMotionModule();
  assert.deepEqual(
    getArrowReveal('brilliant', 'g1f3', 'g1f3', 'panelSync'),
    { showPlayed: true, showBest: false },
  );
});
