export const MOTION_TIMING = Object.freeze({
  pieceMs: 330,
  landingAtMs: 300,
  verdictAtMs: 400,
  panelAtMs: 520,
  settledAtMs: 760,
});

const SUPPORTED = new Set([
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
  'book',
]);

const PRESETS = Object.freeze({
  book: { symbol: '📖', motion: 'book', tone: 'book', landing: 'book', row: 'book', negative: false, keyMoment: false },
  good: { symbol: '✓', motion: 'subtle', tone: 'positive', landing: 'soft', row: 'positive', negative: false, keyMoment: false },
  excellent: { symbol: '✓', motion: 'subtle', tone: 'positive', landing: 'soft', row: 'positive', negative: false, keyMoment: false },
  best: { symbol: '★', motion: 'great', tone: 'positive', landing: 'great', row: 'positive', negative: false, keyMoment: false },
  great: { symbol: '!', motion: 'great', tone: 'great', landing: 'great', row: 'positive', negative: false, keyMoment: true },
  brilliant: { symbol: '!!', motion: 'brilliant', tone: 'brilliant', landing: 'brilliant', row: 'brilliant', negative: false, keyMoment: true },
  inaccuracy: { symbol: '?!', motion: 'inaccuracy', tone: 'warning', landing: 'warning', row: 'warning', negative: true, keyMoment: true },
  mistake: { symbol: '?', motion: 'mistake', tone: 'mistake', landing: 'warning', row: 'warning', negative: true, keyMoment: true },
  miss: { symbol: '✕', motion: 'miss', tone: 'danger', landing: 'danger', row: 'danger', negative: true, keyMoment: true },
  blunder: { symbol: '??', motion: 'blunder', tone: 'danger', landing: 'danger', row: 'danger', negative: true, keyMoment: true },
});

const PHASE_ORDER = Object.freeze({
  idle: 0,
  pieceMoving: 1,
  landing: 2,
  verdictReveal: 3,
  panelSync: 4,
  settled: 5,
});

export function normalizeMotionClassification(classification) {
  const normalized = String(classification || '').trim().toLowerCase();
  return SUPPORTED.has(normalized) ? normalized : '';
}

export function getMotionPreset(classification, reducedMotion = false) {
  const key = normalizeMotionClassification(classification);
  const preset = PRESETS[key] || {
    symbol: '',
    motion: 'subtle',
    tone: 'neutral',
    landing: 'none',
    row: 'none',
    negative: false,
    keyMoment: false,
  };
  if (!reducedMotion) return { classification: key, ...preset };
  return {
    classification: key,
    ...preset,
    motion: 'reduced',
    landing: 'none',
    row: 'none',
  };
}

function destinationDisplayCoords(uci, isFlipped) {
  if (typeof uci !== 'string' || uci.length < 4) return null;
  const square = uci.slice(2, 4).toLowerCase();
  if (!/^[a-h][1-8]$/.test(square)) return null;
  const boardFile = square.charCodeAt(0) - 97;
  const boardRank = Number(square[1]);
  const file = isFlipped ? 7 - boardFile : boardFile;
  const row = isFlipped ? boardRank - 1 : 8 - boardRank;
  return { square, file, row };
}

export function getVerdictPlacement(uci, isFlipped = false) {
  const coords = destinationDisplayCoords(uci, isFlipped);
  if (!coords) return null;
  const nearTop = coords.row <= 1;
  const nearRight = coords.file >= 6;
  let placement = 'top-right';
  if (nearTop && nearRight) placement = 'bottom-left';
  else if (nearTop) placement = 'bottom-right';
  else if (nearRight) placement = 'top-left';
  return {
    ...coords,
    placement,
    leftPct: (coords.file + 0.5) * 12.5,
    topPct: (coords.row + 0.5) * 12.5,
  };
}

export function shouldAnimateReview(delta, reducedMotion = false) {
  return !reducedMotion && Math.abs(Number(delta)) === 1;
}

export function getArrowReveal(classification, playedMove, bestMove, phase = 'settled') {
  const preset = getMotionPreset(classification);
  const phaseRank = PHASE_ORDER[phase] ?? PHASE_ORDER.settled;
  const showPlayed = Boolean(preset.keyMoment && playedMove && phaseRank >= PHASE_ORDER.verdictReveal);
  const showBest = Boolean(
    preset.negative
      && bestMove
      && playedMove
      && bestMove !== playedMove
      && phaseRank >= PHASE_ORDER.panelSync,
  );
  return { showPlayed, showBest };
}
