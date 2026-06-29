import React from 'react';
import ChessBoard from './ChessBoard';

export default function BoardArea({ gameData, currentMoveIndex = 0 }) {
  const oppName = gameData ? gameData.black : 'Opponent';
  const oppRating = gameData ? gameData.black_rating : '—';
  const selfName = gameData ? gameData.white : 'You';
  const selfRating = gameData ? gameData.white_rating : '—';

  let currentFen = 'start';
  if (gameData && gameData.moves && currentMoveIndex > 0) {
    const moveIndex = currentMoveIndex - 1;
    if (moveIndex < gameData.moves.length) {
      currentFen = gameData.moves[moveIndex].fen || 'start';
    }
  }

  return (
    <div className="board-container">
      {/* Top Player (Opponent / Black) */}
      <PlayerBar name={oppName} rating={oppRating} initial={oppName.charAt(0)} color="#5b7fa6" isActive={false} />

      {/* The Chess Board */}
      <div className="board-wrapper">
        <ChessBoard fen={currentFen} />
      </div>

      {/* Bottom Player (Self / White) */}
      <PlayerBar name={selfName} rating={selfRating} initial={selfName.charAt(0)} color="#d4a843" isActive={true} />
    </div>
  );
}

function PlayerBar({ name, rating, initial, color, isActive }) {
  return (
    <div className={`player-bar ${isActive ? 'player-bar--active' : ''}`}>
      <div className="player-details">
        <div className="player-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
          <span>{initial.toUpperCase()}</span>
        </div>
        <div className="player-meta">
          <span className="player-name">{name}</span>
          <span className="player-rating">{rating !== '—' ? `${rating} ELO` : '—'}</span>
        </div>
      </div>
      <div className={`player-timer ${isActive ? 'timer-active' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        10:00
      </div>
    </div>
  );
}
