import React, { useEffect, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMoveLabel, getMoveStory } from '../utils/review';
import { useReviewMotion } from './ReviewMotionScope';

function formatUci(uci) {
  if (!uci || uci.length < 4) return '—';
  return `${uci.slice(0, 2)} → ${uci.slice(2, 4)}`;
}

export default function MoveStory({
  move,
  moveIndex,
  bookmarked,
  onToggleBookmark,
  onPreviousKey,
  onNextKey,
  hasPreviousKey,
  hasNextKey,
}) {
  const reviewMotion = useReviewMotion();
  const [bookmarkPulseToken, setBookmarkPulseToken] = useState(0);
  const [displayState, setDisplayState] = useState(() => ({
    move,
    moveIndex,
    bookmarked,
    token: reviewMotion.token,
  }));

  useEffect(() => {
    if (moveIndex === displayState.moveIndex) {
      if (bookmarked !== displayState.bookmarked || move !== displayState.move) {
        setDisplayState((current) => ({ ...current, move, bookmarked }));
      }
      return;
    }

    const delta = Number(moveIndex) - Number(displayState.moveIndex);
    const singleStep = Math.abs(delta) === 1;
    const motionAdvanced = reviewMotion.token !== displayState.token;
    const revealPhase = reviewMotion.phase === 'panelSync' || reviewMotion.phase === 'settled';
    const canReveal = !singleStep || (motionAdvanced && (reviewMotion.mode === 'settled' || revealPhase));
    if (canReveal) {
      setDisplayState({ move, moveIndex, bookmarked, token: reviewMotion.token });
    }
  }, [move, moveIndex, bookmarked, reviewMotion.phase, reviewMotion.mode, reviewMotion.token, displayState]);

  const story = getMoveStory(displayState.move, displayState.bookmarked);
  if (!story) return null;
  const shownMove = displayState.move;
  const showBest = shownMove.best_move && shownMove.played_move && shownMove.best_move !== shownMove.played_move;

  const handleBookmark = () => {
    setBookmarkPulseToken((current) => current + 1);
    onToggleBookmark?.();
  };

  return (
    <section className={`move-story move-story--${story.tone}`} aria-live="polite">
      <div key={`${displayState.moveIndex}:${displayState.token}`} className="review-story-transition">
        <div className="move-story-topline">
          <div className="move-story-title">
            <span className="move-story-kicker">{formatMoveLabel(shownMove, displayState.moveIndex)}</span>
            <strong>{story.label}</strong>
            <span className="move-story-san">{story.notation}</span>
          </div>
          <button
            type="button"
            className={`bookmark-btn ${bookmarked ? 'active' : ''}`}
            onClick={handleBookmark}
            aria-label={bookmarked ? 'Remove move bookmark' : 'Bookmark this move'}
            aria-pressed={bookmarked}
            title="Bookmark move (B)"
          >
            <span key={bookmarkPulseToken} className="bookmark-icon-pulse">
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            </span>
          </button>
        </div>
        <p>{story.description}</p>
        <div className="move-story-lines">
          <span><small>Played</small><strong>{formatUci(shownMove.played_move)}</strong></span>
          {showBest ? <span><small>Best</small><strong>{formatUci(shownMove.best_move)}</strong></span> : null}
        </div>
      </div>
      <div className="key-moment-nav">
        <button type="button" onClick={onPreviousKey} disabled={!hasPreviousKey}>
          <ChevronLeft size={14} aria-hidden="true" /> Previous key moment
        </button>
        <button type="button" onClick={onNextKey} disabled={!hasNextKey}>
          Next key moment <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
