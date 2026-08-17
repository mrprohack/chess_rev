import React from 'react';
import { Clock3, RefreshCw, Settings, UserRound } from 'lucide-react';
import { getRecentHistoryGames } from '../utils/review';

export default function GameHistory({
  username = '',
  profile,
  loading = false,
  error = '',
  onRefresh,
  onOpenSettings,
  onSelectGame,
}) {
  const rows = getRecentHistoryGames(profile?.games, username, 20);

  return (
    <section className="history-page" aria-labelledby="history-title">
      <header className="history-header">
        <div>
          <h1 id="history-title">Game History</h1>
          <p>{username ? `Latest 20 games for @${username}` : 'Your latest Chess.com games'}</p>
        </div>
        {username ? (
          <button type="button" className="history-refresh-btn" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        ) : null}
      </header>

      {!username ? (
        <div className="history-state">
          <UserRound size={30} aria-hidden="true" />
          <h2>Connect Chess.com in Settings to see your games.</h2>
          <button type="button" className="history-state-btn" onClick={onOpenSettings}>
            <Settings size={16} aria-hidden="true" /> Open Settings
          </button>
        </div>
      ) : error ? (
        <div className="history-state" role="alert">
          <h2>Could not load game history</h2>
          <p>{error}</p>
          <button type="button" className="history-state-btn" onClick={onRefresh}>Retry</button>
        </div>
      ) : !loading && rows.length === 0 ? (
        <div className="history-state"><h2>No recent standard games found.</h2></div>
      ) : (
        <div className="history-list" aria-busy={loading}>
          {rows.map((row) => (
            <button
              type="button"
              className="history-row"
              key={row.uuid || row.url}
              onClick={() => onSelectGame?.(row.url)}
            >
              <span className={`history-result history-result--${row.outcome}`}>{row.outcomeLabel}</span>
              <span className="history-opponent">
                <strong>{row.opponentUsername}</strong>
                <small>{row.opponentRating}</small>
              </span>
              <span className="history-meta">
                <strong>{row.colorLabel}</strong>
                <small>{row.timeClass}</small>
              </span>
              <span className="history-date">
                <Clock3 size={14} aria-hidden="true" />
                {row.date ? row.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
