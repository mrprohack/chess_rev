import React from 'react';
import ChessBoard from './ChessBoard';

export default function BoardArea({ gameData, currentMoveIndex = 0 }) {
  const oppName = gameData ? gameData.black : 'Master_Pradeep';
  const oppRating = gameData ? gameData.black_rating : '690';
  const selfName = gameData ? gameData.white : 'mrprohack';
  const selfRating = gameData ? gameData.white_rating : '646';

  let currentFen = 'start';
  if (gameData && gameData.moves && currentMoveIndex > 0) {
    // currentMoveIndex is 1-indexed for moves, so we subtract 1 to get array index
    const moveIndex = currentMoveIndex - 1;
    if (moveIndex < gameData.moves.length) {
      currentFen = gameData.moves[moveIndex].fen || 'start';
    }
  }

  return (
    <div className="board-container">
      {/* Top Player (Opponent) */}
      <div className="player-info">
        <div className="player-details">
          <div className="player-avatar"></div>
          <span className="player-name">{oppName}</span>
          <span className="player-rating">({oppRating})</span>
          <span>🇮🇳</span>
        </div>
        <div className="player-timer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          10:00
        </div>
      </div>

      {/* The Chess Board */}
      <div className="board-wrapper">
        <ChessBoard fen={currentFen} />
      </div>

      {/* Bottom Player (Self) */}
      <div className="player-info">
        <div className="player-details">
          <div className="player-avatar avatar-orange">{selfName.charAt(0).toLowerCase()}</div>
          <span className="player-name">{selfName}</span>
          <span className="player-rating">({selfRating})</span>
          <span>🇮🇳</span>
        </div>
        <div className="player-timer timer-active">
          10:00
        </div>
      </div>
    </div>
  );
}
