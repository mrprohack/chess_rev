export const IMPORTANT_CLASSIFICATIONS = new Set(['brilliant', 'great', 'inaccuracy', 'mistake', 'miss', 'blunder']);

export function normalizeUsername(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withoutAt = raw.startsWith('@') ? raw.slice(1) : raw;
  const memberMatch = withoutAt.match(/^(?:https?:\/\/)?(?:www\.)?chess\.com\/member\/([^/?#]+)\/?(?:[?#].*)?$/i);
  const candidate = memberMatch?.[1] || withoutAt;
  try { return decodeURIComponent(candidate).trim(); } catch { return candidate.trim(); }
}

export function formatMoveLabel(move, fallbackIndex) {
  const number = Number(move?.number);
  if (Number.isFinite(number) && number > 0) return `Move ${number}${String(move?.color || '').toLowerCase() === 'black' ? '…' : '.'}`;
  return `Move ${fallbackIndex}`;
}

export function getPlayerPerspective(gameData, username) {
  const needle = normalizeUsername(username).toLowerCase();
  if (!needle || !gameData) return null;
  if (String(gameData.white || '').toLowerCase() === needle) return 'white';
  if (String(gameData.black || '').toLowerCase() === needle) return 'black';
  return null;
}

export function isImportantMove(move) { return IMPORTANT_CLASSIFICATIONS.has(String(move?.classification || '').toLowerCase()); }
export function toggleBookmark(bookmarks, moveIndex) { const current = new Set((bookmarks || []).filter(Number.isInteger)); if (current.has(moveIndex)) current.delete(moveIndex); else current.add(moveIndex); return [...current].sort((a,b) => a-b); }
export function bookmarkStorageKey(gameUrl) { let hash = 2166136261; for (const ch of String(gameUrl || 'unknown-game')) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); } return `chess_bookmarks_${(hash >>> 0).toString(16)}`; }

const STORY_MAP = {
  brilliant: ['Brilliant','accent','A standout move. The engine sees this as an exceptional choice.'],
  great: ['Great move','positive','A strong move that preserves or improves the position.'], best: ['Best move','positive','This matches the engine’s preferred move in the position.'], excellent: ['Excellent','positive','A very accurate move with little evaluation loss.'], good: ['Good move','neutral','A solid move that keeps the game on track.'], book: ['Book move','book','This follows known opening play.'], inaccuracy: ['Inaccuracy','warning','A small slip. Compare the played arrow with the engine suggestion.'], mistake: ['Mistake','warning','This loses meaningful value. The green arrow shows the stronger engine move.'], miss: ['Miss','danger','A tactical or positional opportunity was missed. Compare with the best move.'], blunder: ['Blunder','danger','A major evaluation swing. Compare the played move with the engine’s best move.'],
};
export function getMoveStory(move, bookmarked = false) { if (!move) return null; const key = String(move.classification || 'move').toLowerCase(); const [label,tone,description] = STORY_MAP[key] || ['Move','neutral','Review this position and compare the played move with the engine line.']; return { label: bookmarked ? `${label} · Bookmarked` : label, tone: bookmarked ? 'bookmark' : tone, description, notation: move.notation || '' }; }

const DRAW_RESULTS = new Set(['agreed','repetition','stalemate','insufficient','50move','timevsinsufficient','draw']);
export function getGameOutcome(game, username) { const needle = normalizeUsername(username).toLowerCase(); const whiteIsPlayer = String(game?.white?.username || '').toLowerCase() === needle; const blackIsPlayer = String(game?.black?.username || '').toLowerCase() === needle; if (!whiteIsPlayer && !blackIsPlayer) return 'unknown'; const result = String((whiteIsPlayer ? game.white : game.black)?.result || '').toLowerCase(); if (result === 'win') return 'win'; if (DRAW_RESULTS.has(result)) return 'draw'; return result ? 'loss' : 'unknown'; }
