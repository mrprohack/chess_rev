import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(here, 'reviewMotionState.js');
const appPath = path.join(here, '..', 'App.jsx');

async function loadStateModule() {
  assert.equal(fs.existsSync(statePath), true, 'reviewMotionState.js should exist');
  return import(pathToFileURL(statePath));
}

test('single-step forward navigation starts cinematic motion', async () => {
  const { createMotionState } = await loadStateModule();
  assert.deepEqual(createMotionState({ moveIndex: 7, previousMoveIndex: 6, reducedMotion: false }), {
    delta: 1,
    isJump: false,
    mode: 'animate',
    phase: 'pieceMoving',
  });
});

test('single-step backward navigation starts cinematic motion', async () => {
  const { createMotionState } = await loadStateModule();
  assert.deepEqual(createMotionState({ moveIndex: 5, previousMoveIndex: 6, reducedMotion: false }), {
    delta: -1,
    isJump: false,
    mode: 'animate',
    phase: 'pieceMoving',
  });
});

test('jump navigation settles immediately instead of replaying stale stages', async () => {
  const { createMotionState } = await loadStateModule();
  assert.deepEqual(createMotionState({ moveIndex: 12, previousMoveIndex: 4, reducedMotion: false }), {
    delta: 8,
    isJump: true,
    mode: 'settled',
    phase: 'settled',
  });
});

test('reduced motion keeps the latest move settled', async () => {
  const { createMotionState } = await loadStateModule();
  assert.deepEqual(createMotionState({ moveIndex: 7, previousMoveIndex: 6, reducedMotion: true }), {
    delta: 1,
    isJump: false,
    mode: 'settled',
    phase: 'settled',
  });
});

test('unchanged move index has no cinematic replay', async () => {
  const { createMotionState } = await loadStateModule();
  assert.deepEqual(createMotionState({ moveIndex: 6, previousMoveIndex: 6, reducedMotion: false }), {
    delta: 0,
    isJump: false,
    mode: 'settled',
    phase: 'settled',
  });
});

test('App owns one shared cancellable reviewMotion timeline for board and panel', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.match(source, /createMotionState/);
  assert.match(source, /MOTION_TIMING/);
  assert.match(source, /setReviewMotion/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /reviewMotion=\{reviewMotion\}/);
  assert.equal((source.match(/reviewMotion=\{reviewMotion\}/g) || []).length >= 2, true);
});
