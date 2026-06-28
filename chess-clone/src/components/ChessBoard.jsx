import React from 'react';

const PIECE_UNICODE = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const FEN_CHAR_MAP = {
  K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
  k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
};

function parseFen(fen) {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  if (!fen || fen === 'start') {
    // Starting position
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr) 20px',
      width: '100%',
      aspectRatio: '1',
      userSelect: 'none',
    }}>
      {ranks.map((rank, rankIdx) => (
        <React.Fragment key={rank}>
          {/* Rank number label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            color: rankIdx % 2 === 0 ? '#EBECD0' : '#779556',
            paddingRight: '2px',
          }}>
            {rank}
          </div>

          {/* 8 squares per rank */}
          {files.map((file, fileIdx) => {
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const piece = board[rankIdx][fileIdx];
            const isWhitePiece = piece && piece[0] === 'w';

            return (
              <div key={file} style={{
                backgroundColor: isLight ? '#EBECD0' : '#779556',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontSize: 'clamp(20px, 4.5vw, 52px)',
                cursor: 'default',
              }}>
                {piece && (
                  <span style={{
                    color: isWhitePiece ? '#fff' : '#1a1a1a',
                    textShadow: isWhitePiece
                      ? '0 0 2px #000, 0 0 2px #000'
                      : '0 0 1px rgba(255,255,255,0.4)',
                    lineHeight: 1,
                    display: 'block',
                  }}>
                    {PIECE_UNICODE[piece]}
                  </span>
                )}
                {/* File label on bottom rank */}
                {rankIdx === 7 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '3px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: isLight ? '#779556' : '#EBECD0',
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

      {/* Bottom-left corner spacer + file labels */}
      <div />
      {files.map((file, fileIdx) => (
        <div key={file} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          color: fileIdx % 2 === 0 ? '#EBECD0' : '#779556',
        }}>
          {file}
        </div>
      ))}
    </div>
  );
}
