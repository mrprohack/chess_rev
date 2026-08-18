import { shouldAnimateReview } from './reviewMotion.js';

export function createMotionState({ moveIndex = 0, previousMoveIndex = 0, reducedMotion = false } = {}) {
  const current = Number(moveIndex) || 0;
  const previous = Number(previousMoveIndex) || 0;
  const delta = current - previous;
  const isJump = Math.abs(delta) > 1;
  const animate = shouldAnimateReview(delta, reducedMotion);
  return {
    delta,
    isJump,
    mode: animate ? 'animate' : 'settled',
    phase: animate ? 'pieceMoving' : 'settled',
  };
}
