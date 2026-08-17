const FEN_CHAR_MAP = {
  K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
  k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
};

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
let pieceIdCounter = 0;
const nextPieceId = () => `p_${pieceIdCounter++}`;

export function parseFen(fen = 'start') {
  const rows = (fen === 'start' ? START_FEN : fen.split(' ')[0]).split('/');
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  if (rows.length !== 8) return board;
  rows.forEach((row, rank) => {
    let file = 0;
    for (const ch of row) {
      if (/^[1-8]$/.test(ch)) file += Number(ch);
      else if (file < 8) { board[rank][file] = FEN_CHAR_MAP[ch] || null; file += 1; }
    }
  });
  return board;
}

export function squareToCoords(square) {
  if (!/^[a-h][1-8]$/.test(square || '')) return null;
  return { file: square.charCodeAt(0) - 97, rank: 8 - Number(square[1]) };
}

export function syncPieces(oldPieces, fen) {
  const newBoard = parseFen(fen);
  const newPieces = [];
  const oldUnmatched = oldPieces.filter((piece) => piece.status !== 'captured').map((piece) => ({ ...piece, matched: false }));

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const type = newBoard[rank][file];
      if (!type) continue;
      const matchIndex = oldUnmatched.findIndex((piece) => piece.type === type && piece.rank === rank && piece.file === file && !piece.matched);
      if (matchIndex !== -1) {
        oldUnmatched[matchIndex].matched = true;
        newPieces.push({ ...oldUnmatched[matchIndex], status: ['moved', 'promoted', 'restored'].includes(oldUnmatched[matchIndex].status) ? oldUnmatched[matchIndex].status : 'idle' });
      }
    }
  }

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const type = newBoard[rank][file];
      if (!type || newPieces.some((piece) => piece.rank === rank && piece.file === file)) continue;
      let matchIndex = oldUnmatched.findIndex((piece) => piece.type === type && !piece.matched);
      if (matchIndex === -1) {
        const pawnType = type.startsWith('w') ? 'wP' : 'bP';
        matchIndex = oldUnmatched.findIndex((piece) => piece.type === pawnType && !piece.matched);
        if (matchIndex !== -1) {
          oldUnmatched[matchIndex].matched = true;
          newPieces.push({ ...oldUnmatched[matchIndex], type, rank, file, status: 'promoted' });
          continue;
        }
      }
      if (matchIndex !== -1) {
        oldUnmatched[matchIndex].matched = true;
        newPieces.push({ ...oldUnmatched[matchIndex], rank, file, status: 'moved' });
      } else {
        newPieces.push({ id: nextPieceId(), type, rank, file, status: 'idle' });
      }
    }
  }

  const capturedPieces = oldUnmatched.filter((piece) => !piece.matched).map((piece) => ({ ...piece, status: 'captured' }));
  return [...newPieces, ...capturedPieces].map(({ matched, ...piece }) => piece);
}

export function createPieces(fen = 'start') { return syncPieces([], fen); }

export function transitionPieces(oldPieces, fen, uci, direction = 'forward') {
  if (!uci || uci.length < 4 || !['forward', 'backward'].includes(direction)) return syncPieces(oldPieces, fen);
  const forwardFrom = squareToCoords(uci.slice(0, 2));
  const forwardTo = squareToCoords(uci.slice(2, 4));
  if (!forwardFrom || !forwardTo) return syncPieces(oldPieces, fen);
  const source = direction === 'backward' ? forwardTo : forwardFrom;
  const target = direction === 'backward' ? forwardFrom : forwardTo;
  const targetBoard = parseFen(fen);
  const working = oldPieces.map((piece) => ({ ...piece }));
  const oldActiveIds = new Set(working.filter((piece) => piece.status !== 'captured').map((piece) => piece.id));
  const mover = working.find((piece) => piece.status !== 'captured' && piece.file === source.file && piece.rank === source.rank);
  if (!mover) return syncPieces(oldPieces, fen);

  const originalType = mover.type;
  mover.file = target.file;
  mover.rank = target.rank;
  mover.status = 'moved';
  const targetType = targetBoard[target.rank]?.[target.file];
  if (targetType) mover.type = targetType;
  if (direction === 'backward') for (const piece of working) if (piece.status === 'captured') piece.status = 'restored';

  if (originalType.endsWith('K') && Math.abs(forwardTo.file - forwardFrom.file) === 2) {
    const kingSide = forwardTo.file > forwardFrom.file;
    const rookForwardFrom = { file: kingSide ? 7 : 0, rank: forwardFrom.rank };
    const rookForwardTo = { file: kingSide ? 5 : 3, rank: forwardFrom.rank };
    const rookSource = direction === 'backward' ? rookForwardTo : rookForwardFrom;
    const rookTarget = direction === 'backward' ? rookForwardFrom : rookForwardTo;
    const rook = working.find((piece) => piece.status !== 'captured' && piece.type.endsWith('R') && piece.file === rookSource.file && piece.rank === rookSource.rank);
    if (rook) { rook.file = rookTarget.file; rook.rank = rookTarget.rank; rook.status = 'moved'; }
  }

  const synced = syncPieces(working, fen);
  return synced.map((piece) => {
    const wasMover = piece.id === mover.id;
    if (direction === 'forward' && wasMover && targetType && targetType !== originalType) return { ...piece, status: 'promoted' };
    if (direction === 'backward' && !oldActiveIds.has(piece.id)) return { ...piece, status: 'restored' };
    if (direction === 'backward' && piece.status === 'restored') return piece;
    return piece;
  });
}
