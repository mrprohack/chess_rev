import test from 'node:test';
import assert from 'node:assert/strict';
import { bookmarkStorageKey, formatHistoryGame, formatMoveLabel, getGameColor, getGameOutcome, getPlayerPerspective, getMoveStory, getRecentHistoryGames, normalizeUsername, toggleBookmark } from './review.js';

test('orients the board to the saved Chess.com player', () => {
  assert.equal(getPlayerPerspective({ white: 'Alice', black: 'Bob' }, 'bob'), 'black');
  assert.equal(getPlayerPerspective({ white: 'Alice', black: 'Bob' }, 'ALICE'), 'white');
  assert.equal(getPlayerPerspective({ white: 'Alice', black: 'Bob' }, 'Carol'), null);
});

test('bookmarks are unique, sorted, and game-scoped', () => {
  assert.deepEqual(toggleBookmark([5, 2], 3), [2, 3, 5]);
  assert.deepEqual(toggleBookmark([2, 3, 5], 3), [2, 5]);
  assert.notEqual(bookmarkStorageKey('https://www.chess.com/game/live/1'), bookmarkStorageKey('https://www.chess.com/game/live/2'));
});

test('creates a useful story for an important move', () => {
  const story = getMoveStory({ classification: 'Blunder', notation: 'Qh5??', played_move: 'd1h5', best_move: 'g1f3' }, false);
  assert.equal(story.label, 'Blunder');
  assert.equal(story.tone, 'danger');
  assert.match(story.description, /best/i);
});

test('derives the profile result from the player side', () => {
  const game = { white: { username: 'Alice', result: 'win' }, black: { username: 'Bob', result: 'checkmated' } };
  assert.equal(getGameOutcome(game, 'alice'), 'win');
  assert.equal(getGameOutcome(game, 'bob'), 'loss');
});


test('formats real chess move numbers instead of raw ply index', () => {
  assert.equal(formatMoveLabel({ number: 12, color: 'white' }, 23), 'Move 12.');
  assert.equal(formatMoveLabel({ number: 12, color: 'black' }, 24), 'Move 12…');
  assert.equal(formatMoveLabel({}, 7), 'Move 7');
});


test('normalizes Chess.com handles and member URLs for the profile input', () => {
  assert.equal(normalizeUsername('@Alice'), 'Alice');
  assert.equal(normalizeUsername('https://www.chess.com/member/Alice/'), 'Alice');
  assert.equal(normalizeUsername('alice'), 'alice');
  assert.equal(normalizeUsername('%'), '%');
});


test('history helper identifies the saved player color', () => {
  const game = { white: { username: 'Alice' }, black: { username: 'Bob' } };
  assert.equal(getGameColor(game, 'alice'), 'white');
  assert.equal(getGameColor(game, 'bob'), 'black');
  assert.equal(getGameColor(game, 'carol'), '');
});

test('history helper produces compact row data', () => {
  const row = formatHistoryGame({
    url: 'https://www.chess.com/game/live/1',
    end_time: 1720000000,
    time_class: 'rapid',
    white: { username: 'Alice', rating: 1500, result: 'win' },
    black: { username: 'Bob', rating: 1470, result: 'checkmated' },
  }, 'alice');
  assert.equal(row.outcome, 'win');
  assert.equal(row.outcomeLabel, 'W');
  assert.equal(row.color, 'white');
  assert.equal(row.opponentUsername, 'Bob');
  assert.equal(row.opponentRating, 1470);
  assert.equal(row.timeClass, 'Rapid');
});

test('history helper sorts newest first and caps at 20', () => {
  const games = Array.from({ length: 25 }, (_, index) => ({
    url: `https://www.chess.com/game/live/${index + 1}`,
    end_time: index + 1,
    white: { username: 'Alice', result: 'win' },
    black: { username: `Opponent${index}`, result: 'checkmated' },
  }));
  const rows = getRecentHistoryGames(games, 'alice', 20);
  assert.equal(rows.length, 20);
  assert.equal(rows[0].url.endsWith('/25'), true);
  assert.equal(rows.at(-1).url.endsWith('/6'), true);
});
