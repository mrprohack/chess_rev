import React, { useState, useEffect } from 'react';

// PIECE_SVG is now generated dynamically in the component based on pieceSet prop.

const FEN_CHAR_MAP = {
  K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
  k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
};

function parseFen(fen) {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  if (!fen || fen === 'start') {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    return parseFenRows(startFen, board);
  }
  const rows = fen.split(' ')[0];
  return parseFenRows(rows, board);
}

function parseFenRows(rows, board) {
  const rankStrings = rows.split('/');
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const ch of rankStrings[rank]) {
      if (ch >= '1' && ch <= '8') {
        file += parseInt(ch);
      } else {
        board[rank][file] = FEN_CHAR_MAP[ch] || null;
        file++;
      }
    }
  }
  return board;
}

let pieceIdCounter = 0;
function getNextId() { return `p_${pieceIdCounter++}`; }

function syncPieces(oldPieces, fen) {
  const newBoard = parseFen(fen);
  const newPieces = [];
  const oldUnmatched = oldPieces.filter(p => p.status !== 'captured').map(p => ({ ...p, matched: false }));
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const type = newBoard[rank][file];
      if (type) {
        let matchIdx = oldUnmatched.findIndex(p => p.type === type && p.rank === rank && p.file === file && !p.matched);
        if (matchIdx !== -1) {
          oldUnmatched[matchIdx].matched = true;
          newPieces.push({ ...oldUnmatched[matchIdx], status: 'idle' });
        }
      }
    }
  }
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const type = newBoard[rank][file];
      if (type) {
        const alreadyMatched = newPieces.some(p => p.rank === rank && p.file === file);
        if (!alreadyMatched) {
          let matchIdx = oldUnmatched.findIndex(p => p.type === type && !p.matched);
          
          if (matchIdx === -1) {
            const pawnType = type.startsWith('w') ? 'wP' : 'bP';
            matchIdx = oldUnmatched.findIndex(p => p.type === pawnType && !p.matched);
            if (matchIdx !== -1) {
               oldUnmatched[matchIdx].matched = true;
               newPieces.push({ ...oldUnmatched[matchIdx], type, rank, file, status: 'promoted' });
               continue;
            }
          }
          
          if (matchIdx !== -1) {
            oldUnmatched[matchIdx].matched = true;
            newPieces.push({ ...oldUnmatched[matchIdx], rank, file, status: 'moved' });
          } else {
            newPieces.push({ id: getNextId(), type, rank, file, status: 'idle' });
          }
        }
      }
    }
  }
  
  const capturedPieces = oldUnmatched.filter(p => !p.matched).map(p => ({ ...p, status: 'captured' }));
  return [...newPieces, ...capturedPieces];
}

const BOARD_THEME_COLORS = {
  wood: { light: '#F0D9B5', dark: '#B58863' },
  green: { light: '#EEEED2', dark: '#769656' },
  blue: { light: '#DEE3E6', dark: '#8CA2AD' },
  glass: { light: '#3A3F51', dark: '#262936' },
};

export default function ChessBoard({ 
  fen = 'start', 
  bestMove, 
  playedMove, 
  classification, 
  isFlipped = false,
  boardTheme = 'wood',
  showArrows = true,
  showCoordinates = true,
  isJump = false
}) {
  const [pieces, setPieces] = useState(() => syncPieces([], fen));

  useEffect(() => {
    setPieces(prev => syncPieces(prev, fen));
  }, [fen]);

  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

  const colors = BOARD_THEME_COLORS[boardTheme] || BOARD_THEME_COLORS.wood;
  const LIGHT = colors.light;
  const DARK = colors.dark;

  const pieceDir = '/pieces_alt';

  function uciToCoords(uci) {
    if (!uci || uci.length < 4) return null;
    const fileChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const f1 = fileChars.indexOf(uci[0]);
    const r1 = parseInt(uci[1], 10);
    const f2 = fileChars.indexOf(uci[2]);
    const r2 = parseInt(uci[3], 10);
    
    if (f1 < 0 || r1 < 1 || r1 > 8 || f2 < 0 || r2 < 1 || r2 > 8) return null;
    
    const x1Val = isFlipped ? (7 - f1 + 0.5) : (f1 + 0.5);
    const y1Val = isFlipped ? (r1 - 0.5) : (8 - r1 + 0.5);
    const x2Val = isFlipped ? (7 - f2 + 0.5) : (f2 + 0.5);
    const y2Val = isFlipped ? (r2 - 0.5) : (8 - r2 + 0.5);

    return {
      x1: `${x1Val * 12.5}%`,
      y1: `${y1Val * 12.5}%`,
      x2: `${x2Val * 12.5}%`,
      y2: `${y2Val * 12.5}%`,
    };
  }

  const bestCoords = uciToCoords(bestMove);
  const playedCoords = uciToCoords(playedMove);
  
  const isMistake = classification && ['mistake', 'blunder', 'miss'].includes(classification.toLowerCase());

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)' }}>
      {/* 8x8 Board Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%',
        height: '100%',
        userSelect: 'none',
      }}>
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const isFirstCol = fileIdx === 0;
            const isLastRow = rankIdx === 7;

            return (
              <div key={`${rank}-${file}`} style={{
                backgroundColor: isLight ? LIGHT : DARK,
                position: 'relative',
                userSelect: 'none',
              }}>
                {/* Rank label on first column */}
                {showCoordinates && isFirstCol && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isLight ? DARK : LIGHT,
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}>
                    {rank}
                  </span>
                )}
                {/* File label on last row */}
                {showCoordinates && isLastRow && (
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isLight ? DARK : LIGHT,
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}>
                    {file}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pieces Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 5
      }}>
        {pieces.map(p => {
          const displayFile = isFlipped ? (7 - p.file) : p.file;
          const displayRank = isFlipped ? (7 - p.rank) : p.rank;
          const left = `${displayFile * 12.5}%`;
          const top = `${displayRank * 12.5}%`;
          let className = 'chess-piece';
          if (isJump) className += ' no-transition';
          if (p.status === 'captured') className += ' piece-captured';
          if (p.status === 'promoted') className += ' piece-promoted';
          
          return (
            <img
              key={p.id}
              src={`${pieceDir}/${p.type}.svg`}
              alt={p.type}
              draggable={false}
              className={className}
              style={{
                left,
                top,
                userSelect: 'none',
              }}
            />
          );
        })}
      </div>
      
      {/* SVG Arrow Overlay */}
      {showArrows && (
        <svg style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 10,
          width: '100%',
          height: '100%'
        }}>
          <defs>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80" opacity="0.8" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" opacity="0.8" />
            </marker>
          </defs>

          {/* Draw Played Move if Mistake */}
          {isMistake && playedCoords && (
            <line
              x1={playedCoords.x1} y1={playedCoords.y1}
              x2={playedCoords.x2} y2={playedCoords.y2}
              stroke="#f87171"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.8"
              markerEnd="url(#arrow-red)"
            />
          )}
          
          {/* Draw Best Move */}
          {(isMistake || (playedMove !== bestMove && bestCoords)) && bestCoords && (
            <line
              x1={bestCoords.x1} y1={bestCoords.y1}
              x2={bestCoords.x2} y2={bestCoords.y2}
              stroke="#4ade80"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.8"
              markerEnd="url(#arrow-green)"
            />
          )}
        </svg>
      )}
    </div>
  );
}
