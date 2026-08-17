import React, { createContext, useContext } from 'react';

const DEFAULT_REVIEW_MOTION = Object.freeze({
  phase: 'settled',
  mode: 'settled',
  token: 0,
  delta: 0,
  isJump: false,
});

const ReviewMotionContext = createContext(DEFAULT_REVIEW_MOTION);

export function useReviewMotion() {
  return useContext(ReviewMotionContext);
}

export default function ReviewMotionScope({ reviewMotion = DEFAULT_REVIEW_MOTION, children }) {
  const value = { ...DEFAULT_REVIEW_MOTION, ...reviewMotion };
  return (
    <ReviewMotionContext.Provider value={value}>
      <div
        className="review-motion-scope"
        data-review-motion-phase={value.phase}
        data-review-motion-mode={value.mode}
        data-review-motion-token={value.token}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </ReviewMotionContext.Provider>
  );
}
