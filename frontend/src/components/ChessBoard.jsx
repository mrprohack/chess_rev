import React, { useState, useEffect, useMemo } from 'react';

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

export default function ChessBoard({ fen = 'start', bestMove, playedMove, classification }) {
  const [pieces, setPieces] = useState(() => syncPieces([], fen));

  useEffect(() => {
    setPieces(prev => syncPieces(prev, fen));
  }, [fen]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Premium board colors (from CSS variables)
  const LIGHT = 'var(--board-light, #F0D9B5)';
  const DARK = 'var(--board-dark, #B58863)';

  const pieceDir = '/pieces_alt';

  function uciToCoords(uci) {
    if (!uci || uci.length < 4) return null;
    const f1 = files.indexOf(uci[0]);
    const r1 = parseInt(uci[1], 10);
    const f2 = files.indexOf(uci[2]);
    const r2 = parseInt(uci[3], 10);
    
    if (f1 < 0 || r1 < 1 || r1 > 8 || f2 < 0 || r2 < 1 || r2 > 8) return null;
    
    return {
      x1: `${(f1 + 0.5) * 12.5}%`,
      y1: `${(8 - r1 + 0.5) * 12.5}%`,
      x2: `${(f2 + 0.5) * 12.5}%`,
      y2: `${(8 - r2 + 0.5) * 12.5}%`,
    };
  }

  const bestCoords = uciToCoords(bestMove);
  const playedCoords = uciToCoords(playedMove);
  
  const isMistake = classification && ['mistake', 'blunder', 'miss'].includes(classification.toLowerCase());

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{
      display: 'grid',
      gridTemplateColumns: '18px repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr) 18px',
      width: '100%',
      height: '100%',
      userSelect: 'none',
    }}>
      {ranks.map((rank, rankIdx) => (
        <React.Fragment key={rank}>
          {/* Rank number label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '700',
            color: rankIdx % 2 === 0 ? LIGHT : DARK,
            background: '#1a1a1a',
            paddingRight: '2px',
          }}>
            {rank}
          </div>

          {/* 8 squares per rank */}
          {files.map((file, fileIdx) => {
            const isLight = (rankIdx + fileIdx) % 2 === 0;

            return (
              <div key={file} style={{
                backgroundColor: isLight ? LIGHT : DARK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'default',
              }}>
                {/* File label on bottom rank */}
                {rankIdx === 7 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '3px',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: isLight ? DARK : LIGHT,
                    lineHeight: 1,
                  }}>
                    {file}
                  </span>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}

      {/* Bottom-left corner spacer */}
      <div style={{ background: '#1a1a1a' }} />
      {files.map((file, fileIdx) => (
        <div key={file} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '700',
          color: fileIdx % 2 === 0 ? LIGHT : DARK,
          background: '#1a1a1a',
        }}>
          {file}
        </div>
      ))}
      </div>

      {/* Pieces Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '18px',
        right: 0,
        bottom: '18px',
        pointerEvents: 'none',
        zIndex: 5
      }}>
        {pieces.map(p => {
          const left = `${p.file * 12.5}%`;
          const top = `${p.rank * 12.5}%`;
          let className = 'chess-piece';
          if (p.status === 'captured') className += ' piece-captured';
          if (p.status === 'promoted') className += ' piece-promoted';
          
          return (
            <img
              key={p.id}
              src={`${pieceDir}/${p.type}.svg`}
              alt={p.type}
              className={className}
              style={{
                left,
                top,
              }}
            />
          );
        })}
      </div>
      
      {/* SVG Arrow Overlay */}
      <svg style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: '18px',
        left: '18px',
        pointerEvents: 'none',
        zIndex: 10,
        width: 'calc(100% - 18px)',
        height: 'calc(100% - 18px)'
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
            strokeWidth="12"
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
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.8"
            markerEnd="url(#arrow-green)"
          />
        )}
      </svg>
    </div>
  );
}
