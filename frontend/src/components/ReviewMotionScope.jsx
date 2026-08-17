import React from 'react';
import { DEFAULT_REVIEW_MOTION, ReviewMotionContext } from './reviewMotionContext';

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
