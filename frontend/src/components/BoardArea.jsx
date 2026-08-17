import React from 'react';
import ChessBoard from './ChessBoard';

export default function BoardArea({
  gameData,
  currentMoveIndex = 0,
  isFlipped = false,
  boardTheme = 'wood',
  showArrows = true,
  showCoordinates = true,
  profileUsername = '',
  profileAvatar = '',
  reviewMotion = { phase: 'settled', mode: 'settled', token: 0, isJump: false },
}) {
  const whitePlayer = { name: gameData?.white || 'White', rating: gameData?.white_rating || '—', color: '#d4a843', side: 'white' };
  const blackPlayer = { name: gameData?.black || 'Black', rating: gameData?.black_rating || '—', color: '#5b7fa6', side: 'black' };

  let currentFen = 'start';
  let currentScore = 0;
  const baseTime = gameData?.base_time || 600;
  let whiteClock = baseTime;
  let blackClock = baseTime;
  let currentBestMove = null;
  let currentPlayedMove = null;
  let currentClassification = null;

  if (gameData?.moves && currentMoveIndex > 0) {
    const moveIndex = currentMoveIndex - 1;
    const currentMove = gameData.moves[moveIndex];
    if (currentMove) {
      currentFen = currentMove.fen || 'start';
      currentScore = currentMove.eval || 0;
      currentBestMove = currentMove.best_move;
      currentPlayedMove = currentMove.played_move;
      currentClassification = currentMove.classification;
    }
    for (let index = 0; index < currentMoveIndex; index += 1) {
      const move = gameData.moves[index];
      if (move.color === 'white') whiteClock = move.clock ?? whiteClock;
      if (move.color === 'black') blackClock = move.clock ?? blackClock;
    }
  }

  const isWhiteTurn = currentMoveIndex % 2 === 0;
  const previousMoveIndexRef = React.useRef(currentMoveIndex);
  const previousMoveIndex = previousMoveIndexRef.current;
  const delta = currentMoveIndex - previousMoveIndex;
  const isJump = Math.abs(delta) > 1;
  const mediaReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const reducedMotion = reviewMotion?.reducedMotion ?? mediaReducedMotion;
  const shouldAnimateImmediate = Math.abs(delta) === 1 && !reducedMotion;
  const boardReviewMotion = delta === 0
    ? reviewMotion
    : {
        ...reviewMotion,
        delta,
        isJump,
        reducedMotion,
        mode: shouldAnimateImmediate ? 'animate' : 'settled',
        phase: shouldAnimateImmediate ? 'pieceMoving' : 'settled',
      };
  let animationMove = null;
  let animationDirection = 'forward';

  if (gameData?.moves && delta === 1) {
    animationMove = gameData.moves[currentMoveIndex - 1]?.played_move || null;
  } else if (gameData?.moves && delta === -1) {
    animationMove = gameData.moves[previousMoveIndex - 1]?.played_move || null;
    animationDirection = 'backward';
  }

  React.useEffect(() => {
    previousMoveIndexRef.current = currentMoveIndex;
  }, [currentMoveIndex]);

  const username = String(profileUsername || '').toLowerCase();
  const isYou = (player) => Boolean(username && player.name.toLowerCase() === username);
  const topPlayer = isFlipped ? whitePlayer : blackPlayer;
  const bottomPlayer = isFlipped ? blackPlayer : whitePlayer;

  const playerBar = (player) => (
    <PlayerBar key={player.side} name={player.name} rating={player.rating} initial={player.name.charAt(0)} color={player.color} isYou={isYou(player)} avatarSrc={isYou(player) ? profileAvatar : ''} isActive={player.side === 'white' ? isWhiteTurn : !isWhiteTurn} clockSeconds={player.side === 'white' ? whiteClock : blackClock} />
  );

  return (
    <div className="board-container" aria-live="polite">
      {playerBar(topPlayer)}
      <div className="board-wrapper">
        <EvalBar score={currentScore} isFlipped={isFlipped} />
        <ChessBoard
          fen={currentFen}
          bestMove={currentBestMove}
          playedMove={currentPlayedMove}
          classification={currentClassification}
          animationMove={animationMove}
          animationDirection={animationDirection}
          isFlipped={isFlipped}
          boardTheme={boardTheme}
          showArrows={showArrows}
          showCoordinates={showCoordinates}
          isJump={isJump}
          reviewMotion={boardReviewMotion}
        />
      </div>
      {playerBar(bottomPlayer)}
    </div>
  );
}

function PlayerBar({ name, rating, initial, color, isActive, isYou, avatarSrc, clockSeconds = 600 }) {
  const mins = Math.floor(clockSeconds / 60);
  const secs = Math.floor(clockSeconds % 60);
  const tenths = Math.floor((clockSeconds % 1) * 10);
  let timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (clockSeconds < 20 && clockSeconds > 0) timeStr += `.${tenths}`;

  return (
    <div className={`player-bar ${isActive ? 'player-bar--active' : ''}`}>
      <div className="player-details">
        <div className="player-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
          {avatarSrc ? <img src={avatarSrc} alt="" referrerPolicy="no-referrer" /> : <span>{initial.toUpperCase()}</span>}
        </div>
        <div className="player-meta">
          <span className="player-name">{name}{isYou ? <span className="you-badge">You</span> : null}</span>
          <span className="player-rating">{rating !== '—' ? `${rating} ELO` : '—'}</span>
        </div>
      </div>
      <div className={`player-timer ${isActive ? 'timer-active' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {timeStr}
      </div>
    </div>
  );
}

function EvalBar({ score, isFlipped = false }) {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const clampedScore = Math.max(-10, Math.min(10, safeScore));
  const whitePercent = 50 + (clampedScore / 10) * 50;
  const topPercent = isFlipped ? whitePercent : 100 - whitePercent;
  const bottomPercent = isFlipped ? 100 - whitePercent : whitePercent;
  const topColor = isFlipped ? '#f8f8f8' : '#403d39';
  const bottomColor = isFlipped ? '#403d39' : '#f8f8f8';

  return (
    <div className="eval-bar-container" aria-label={`Evaluation: ${safeScore > 0 ? '+' : ''}${safeScore.toFixed(1)}`}>
      <div style={{ flex: topPercent, background: topColor, transition: 'flex 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      <div style={{ flex: bottomPercent, background: bottomColor, transition: 'flex 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      <span className={`eval-bar-score ${safeScore > 0 ? (isFlipped ? 'eval-black' : 'eval-white') : (isFlipped ? 'eval-white' : 'eval-black')}`}>{safeScore > 0 ? '+' : ''}{safeScore.toFixed(1)}</span>
    </div>
  );
}
