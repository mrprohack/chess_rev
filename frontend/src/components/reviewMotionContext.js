import { createContext, useContext } from 'react';

export const DEFAULT_REVIEW_MOTION = Object.freeze({
  phase: 'settled',
  mode: 'settled',
  token: 0,
  delta: 0,
  isJump: false,
  reducedMotion: false,
});

export const ReviewMotionContext = createContext(DEFAULT_REVIEW_MOTION);

export function useReviewMotion() {
  return useContext(ReviewMotionContext);
}
