import React from 'react';
import ChessBoard from './ChessBoard';

export default function BoardArea({ 
  gameData, 
  currentMoveIndex = 0, 
  isFlipped = false,
  boardTheme = 'wood',
  showArrows = true,
  showCoordinates = true
}) {
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

  const topPlayer = isFlipped ? (
    <PlayerBar name={selfName} rating={selfRating} initial={selfName.charAt(0)} color="#d4a843" isActive={isWhiteTurn} clockSeconds={selfClock} />
  ) : (
    <PlayerBar name={oppName} rating={oppRating} initial={oppName.charAt(0)} color="#5b7fa6" isActive={!isWhiteTurn} clockSeconds={oppClock} />
  );

  const bottomPlayer = isFlipped ? (
    <PlayerBar name={oppName} rating={oppRating} initial={oppName.charAt(0)} color="#5b7fa6" isActive={!isWhiteTurn} clockSeconds={oppClock} />
  ) : (
    <PlayerBar name={selfName} rating={selfRating} initial={selfName.charAt(0)} color="#d4a843" isActive={isWhiteTurn} clockSeconds={selfClock} />
  );

  return (
    <div className="board-container" aria-live="polite">
      {/* Top Player */}
      {topPlayer}

      {/* The Chess Board */}
      <div className="board-wrapper">
        <EvalBar score={currentScore} isFlipped={isFlipped} />
        <ChessBoard 
          fen={currentFen} 
          bestMove={currentBestMove} 
          playedMove={currentPlayedMove}
          classification={currentClassification}
          isFlipped={isFlipped}
          boardTheme={boardTheme}
          showArrows={showArrows}
          showCoordinates={showCoordinates}
        />
      </div>

      {/* Bottom Player */}
      {bottomPlayer}
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

function EvalBar({ score, isFlipped = false }) {
  // Clamp score between -10 and 10 for the display
  let clampedScore = Math.max(-10, Math.min(10, score || 0));
  
  // Convert score to percentage: 0 is 50%, 10 is 100%, -10 is 0%
  let whitePercent = 50 + (clampedScore / 10) * 50;

  const topPercent = isFlipped ? whitePercent : 100 - whitePercent;
  const bottomPercent = isFlipped ? 100 - whitePercent : whitePercent;
  const topColor = isFlipped ? '#f8f8f8' : '#403d39';
  const bottomColor = isFlipped ? '#403d39' : '#f8f8f8';

  return (
    <div className="eval-bar-container" aria-label={`Evaluation: ${score > 0 ? '+' : ''}${score.toFixed(1)}`}>
      <div style={{ flex: topPercent, background: topColor, transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      <div style={{ flex: bottomPercent, background: bottomColor, transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      <span className={`eval-bar-score ${score > 0 ? (isFlipped ? 'eval-black' : 'eval-white') : (isFlipped ? 'eval-white' : 'eval-black')}`}>
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </span>
    </div>
  );
}
