import React, { useEffect, useState } from 'react';
import '../CinematicMotion.css';
import { createPieces, transitionPieces, syncPieces } from '../utils/boardMotion';
import { getArrowReveal, getMotionPreset } from '../utils/reviewMotion';
import BoardVerdictBadge from './BoardVerdictBadge';
import LandingEffect from './LandingEffect';

const BOARD_THEME_COLORS = {
  wood: { light: '#F0D9B5', dark: '#B58863' },
  green: { light: '#EEEED2', dark: '#769656' },
  blue: { light: '#DEE3E6', dark: '#8CA2AD' },
  glass: { light: '#3A3F51', dark: '#262936' },
};

const CLASS_ARROW_COLORS = { brilliant: '#22d3ee', great: '#2dd4bf', inaccuracy: '#fbbf24', mistake: '#fb923c', miss: '#f87171', blunder: '#ef4444' };

function uciToCoords(uci, isFlipped) {
  if (!uci || uci.length < 4) return null;
  const fileChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const f1 = fileChars.indexOf(uci[0]);
  const r1 = Number.parseInt(uci[1], 10);
  const f2 = fileChars.indexOf(uci[2]);
  const r2 = Number.parseInt(uci[3], 10);
  if (f1 < 0 || r1 < 1 || r1 > 8 || f2 < 0 || r2 < 1 || r2 > 8) return null;
  const x1Val = isFlipped ? 7 - f1 + 0.5 : f1 + 0.5;
  const y1Val = isFlipped ? r1 - 0.5 : 8 - r1 + 0.5;
  const x2Val = isFlipped ? 7 - f2 + 0.5 : f2 + 0.5;
  const y2Val = isFlipped ? r2 - 0.5 : 8 - r2 + 0.5;
  return { x1: `${x1Val * 12.5}%`, y1: `${y1Val * 12.5}%`, x2: `${x2Val * 12.5}%`, y2: `${y2Val * 12.5}%` };
}

function moveSquares(uci) {
  if (!uci || uci.length < 4) return new Set();
  return new Set([uci.slice(0, 2), uci.slice(2, 4)]);
}

export default function ChessBoard({
  fen = 'start',
  bestMove,
  playedMove,
  classification,
  animationMove,
  animationDirection = 'forward',
  isFlipped = false,
  boardTheme = 'wood',
  showArrows = true,
  showCoordinates = true,
  isJump = false,
  reviewMotion = { phase: 'settled', mode: 'settled', token: 0 },
}) {
  const [pieces, setPieces] = useState(() => createPieces(fen));

  useEffect(() => {
    setPieces((previous) => {
      if (isJump || !animationMove) return syncPieces(previous, fen);
      return transitionPieces(previous, fen, animationMove, animationDirection);
    });
    const settleTimer = window.setTimeout(() => {
      setPieces((previous) => previous.map((piece) => (['moved', 'promoted', 'restored'].includes(piece.status) ? { ...piece, status: 'idle' } : piece)));
    }, 380);
    return () => window.clearTimeout(settleTimer);
  }, [fen, animationMove, animationDirection, isJump]);

  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const colors = BOARD_THEME_COLORS[boardTheme] || BOARD_THEME_COLORS.wood;
  const pieceDir = '/pieces_alt';
  const bestCoords = uciToCoords(bestMove, isFlipped);
  const playedCoords = uciToCoords(playedMove, isFlipped);
  const lastMoveSquares = moveSquares(playedMove);
  const preset = getMotionPreset(classification);
  const classKey = preset.classification;
  const isKeyMoment = preset.keyMoment;
  const playedArrowColor = CLASS_ARROW_COLORS[classKey] || '#60a5fa';
  const effectivePhase = isJump ? 'settled' : (reviewMotion?.phase || 'settled');
  const effectiveMode = isJump ? 'settled' : (reviewMotion?.mode || 'settled');
  const arrowReveal = getArrowReveal(classification, playedMove, bestMove, effectivePhase);

  return (
    <div className="motion-board" data-motion-phase={effectivePhase}>
      <div className="motion-board-grid">
        {ranks.map((rank, rankIndex) => files.map((file, fileIndex) => {
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          const isFirstCol = fileIndex === 0;
          const isLastRow = rankIndex === 7;
          const square = `${file}${rank}`;
          const highlighted = lastMoveSquares.has(square);
          return (
            <div key={square} className="motion-square" style={{ backgroundColor: isLight ? colors.light : colors.dark }}>
              {highlighted ? <span className={`last-move-square ${isKeyMoment ? `last-move-square--${classKey}` : ''}`} aria-hidden="true" /> : null}
              {showCoordinates && isFirstCol ? <span className="board-rank-label" style={{ color: isLight ? colors.dark : colors.light }}>{rank}</span> : null}
              {showCoordinates && isLastRow ? <span className="board-file-label" style={{ color: isLight ? colors.dark : colors.light }}>{file}</span> : null}
            </div>
          );
        }))}
      </div>

      <div className="pieces-layer" aria-hidden="true">
        {pieces.map((piece) => {
          const displayFile = isFlipped ? 7 - piece.file : piece.file;
          const displayRank = isFlipped ? 7 - piece.rank : piece.rank;
          const classNames = ['chess-piece', isJump ? 'no-transition' : '', piece.status === 'captured' ? 'piece-captured' : '', piece.status === 'moved' ? 'piece-moving' : '', piece.status === 'promoted' ? 'piece-promoted' : '', piece.status === 'restored' ? 'piece-restored' : ''].filter(Boolean).join(' ');
          return <img key={piece.id} src={`${pieceDir}/${piece.type}.svg`} alt="" draggable={false} className={classNames} style={{ left: `${displayFile * 12.5}%`, top: `${displayRank * 12.5}%` }} />;
        })}
      </div>

      <LandingEffect
        classification={classification}
        playedMove={playedMove}
        isFlipped={isFlipped}
        phase={effectivePhase}
        mode={effectiveMode}
        token={reviewMotion?.token || 0}
      />

      {showArrows && isKeyMoment && playedCoords && arrowReveal.showPlayed ? (
        <svg className="analysis-arrows" aria-hidden="true">
          <defs>
            <marker id="motion-arrow-played" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={playedArrowColor} /></marker>
            <marker id="motion-arrow-best" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80" /></marker>
          </defs>
          <line className="analysis-arrow" x1={playedCoords.x1} y1={playedCoords.y1} x2={playedCoords.x2} y2={playedCoords.y2} stroke={playedArrowColor} markerEnd="url(#motion-arrow-played)" pathLength="100" />
          {arrowReveal.showBest && bestCoords ? <line className="analysis-arrow analysis-arrow--best" x1={bestCoords.x1} y1={bestCoords.y1} x2={bestCoords.x2} y2={bestCoords.y2} stroke="#4ade80" markerEnd="url(#motion-arrow-best)" pathLength="100" /> : null}
        </svg>
      ) : null}

      <BoardVerdictBadge
        classification={classification}
        playedMove={playedMove}
        isFlipped={isFlipped}
        phase={effectivePhase}
        mode={effectiveMode}
        token={reviewMotion?.token || 0}
      />
    </div>
  );
}
