import React from 'react';
import ChessBoard from './ChessBoard';

export default function BoardArea({ gameData, currentMoveIndex = 0 }) {
  const oppName = gameData ? gameData.black : 'Opponent';
  const oppRating = gameData ? gameData.black_rating : '—';
  const selfName = gameData ? gameData.white : 'You';
  const selfRating = gameData ? gameData.white_rating : '—';

  let currentFen = 'start';
  let currentScore = 0;
  
  let baseTime = gameData ? gameData.base_time : 600;
  let selfClock = baseTime;
  let oppClock = baseTime;
  let currentBestMove = null;
  let currentPlayedMove = null;
  let currentClassification = null;

  if (gameData && gameData.moves && currentMoveIndex > 0) {
    const moveIndex = currentMoveIndex - 1;
    if (moveIndex < gameData.moves.length) {
      currentFen = gameData.moves[moveIndex].fen || 'start';
      currentScore = gameData.moves[moveIndex].eval || 0;
      currentBestMove = gameData.moves[moveIndex].best_move;
      currentPlayedMove = gameData.moves[moveIndex].played_move;
      currentClassification = gameData.moves[moveIndex].classification;
    }
    
    // Find latest clock for both players up to current move
    for (let i = 0; i < currentMoveIndex; i++) {
      const move = gameData.moves[i];
      if (move.color === 'white') selfClock = move.clock || selfClock;
      if (move.color === 'black') oppClock = move.clock || oppClock;
    }
  }

  // Even index (0, 2, 4) = White's turn to move
  // Odd index (1, 3, 5) = Black's turn to move
  const isWhiteTurn = currentMoveIndex % 2 === 0;

  return (
    <div className="board-container">
      {/* Top Player (Opponent / Black) */}
      <PlayerBar name={oppName} rating={oppRating} initial={oppName.charAt(0)} color="#5b7fa6" isActive={!isWhiteTurn} clockSeconds={oppClock} />

      {/* The Chess Board */}
      <div className="board-wrapper">
        <EvalBar score={currentScore} />
        <ChessBoard 
          fen={currentFen} 
          bestMove={currentBestMove} 
          playedMove={currentPlayedMove}
          classification={currentClassification}
        />
      </div>

      {/* Bottom Player (Self / White) */}
      <PlayerBar name={selfName} rating={selfRating} initial={selfName.charAt(0)} color="#d4a843" isActive={isWhiteTurn} clockSeconds={selfClock} />
    </div>
  );
}

function PlayerBar({ name, rating, initial, color, isActive, clockSeconds = 600 }) {
  const mins = Math.floor(clockSeconds / 60);
  const secs = Math.floor(clockSeconds % 60);
  const tenths = Math.floor((clockSeconds % 1) * 10);
  
  let timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (clockSeconds < 20 && clockSeconds > 0) {
     // Show tenths of a second if time is low
     timeStr += `.${tenths}`;
  }

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
        {timeStr}
      </div>
    </div>
  );
}

function EvalBar({ score }) {
  // Clamp score between -10 and 10 for the display
  let clampedScore = Math.max(-10, Math.min(10, score || 0));
  
  // Convert score to percentage: 0 is 50%, 10 is 100%, -10 is 0%
  let whitePercent = 50 + (clampedScore / 10) * 50;

  return (
    <div className="eval-bar-container">
      {/* Black part (top) */}
      <div className="eval-bar-black" style={{ flex: 100 - whitePercent }}></div>
      {/* White part (bottom) */}
      <div className="eval-bar-white" style={{ flex: whitePercent }}></div>
      {/* Score text overlay */}
      <span className={`eval-bar-score ${score > 0 ? 'eval-white' : 'eval-black'}`}>
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </span>
    </div>
  );
}
