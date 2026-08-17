import React from 'react';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMoveLabel, getMoveStory } from '../utils/review';

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
  const story = getMoveStory(move, bookmarked);
  if (!story) return null;
  const showBest = move.best_move && move.played_move && move.best_move !== move.played_move;

  return (
    <section className={`move-story move-story--${story.tone}`} aria-live="polite">
      <div className="move-story-topline">
        <div className="move-story-title">
          <span className="move-story-kicker">{formatMoveLabel(move, moveIndex)}</span>
          <strong>{story.label}</strong>
          <span className="move-story-san">{story.notation}</span>
        </div>
        <button
          type="button"
          className={`bookmark-btn ${bookmarked ? 'active' : ''}`}
          onClick={onToggleBookmark}
          aria-label={bookmarked ? 'Remove move bookmark' : 'Bookmark this move'}
          aria-pressed={bookmarked}
          title="Bookmark move (B)"
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
      <p>{story.description}</p>
      <div className="move-story-lines">
        <span><small>Played</small><strong>{formatUci(move.played_move)}</strong></span>
        {showBest ? <span><small>Best</small><strong>{formatUci(move.best_move)}</strong></span> : null}
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
