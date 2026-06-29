import React from 'react';

const PIECE_SVG = {
  wK: '/pieces/wK.svg', wQ: '/pieces/wQ.svg', wR: '/pieces/wR.svg',
  wB: '/pieces/wB.svg', wN: '/pieces/wN.svg', wP: '/pieces/wP.svg',
  bK: '/pieces/bK.svg', bQ: '/pieces/bQ.svg', bR: '/pieces/bR.svg',
  bB: '/pieces/bB.svg', bN: '/pieces/bN.svg', bP: '/pieces/bP.svg',
};

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

export default function ChessBoard({ fen = 'start' }) {
  const board = parseFen(fen);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Premium board colors
  const LIGHT = '#F0D9B5';
  const DARK = '#B58863';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '18px repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr) 18px',
      width: '100%',
      aspectRatio: '1',
      userSelect: 'none',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.5)',
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
            const piece = board[rankIdx][fileIdx];

            return (
              <div key={file} style={{
                backgroundColor: isLight ? LIGHT : DARK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'default',
              }}>
                {piece && (
                  <img
                    src={PIECE_SVG[piece]}
                    alt={piece}
                    style={{
                      width: '88%',
                      height: '88%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
                      pointerEvents: 'none',
                    }}
                  />
                )}
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
  );
}
