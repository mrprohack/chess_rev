import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, User } from 'lucide-react';
import { getGameOutcome } from '../utils/review';

function ratingLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  return Number.isFinite(Number(value)) ? Number(value) : '—';
}

function opponentForGame(game, username) {
  const needle = String(username || '').toLowerCase();
  const whiteIsPlayer = String(game?.white?.username || '').toLowerCase() === needle;
  return whiteIsPlayer ? game?.black : game?.white;
}

export default function ProfileLoader({
  username = '',
  profile,
  loading = false,
  error = '',
  onLoadProfile,
  onSelectGame,
}) {
  const [draft, setDraft] = useState(username);

  useEffect(() => {
    setDraft(username);
  }, [username]);

  const submit = (event) => {
    event.preventDefault();
    onLoadProfile?.(draft);
  };

  return (
    <section className="profile-loader" aria-label="Chess.com profile">
      <div className="profile-loader-heading">
        <div>
          <span className="profile-loader-label">Chess.com profile</span>
          <small>Saved as your default after a successful load</small>
        </div>
        {profile?.url ? (
          <a className="profile-link" href={profile.url} target="_blank" rel="noreferrer" aria-label="Open Chess.com profile">
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <form className="profile-input-row" onSubmit={submit}>
        <div className="profile-input-wrap">
          <User size={15} aria-hidden="true" />
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Chess.com username"
            placeholder="Chess.com username"
          />
        </div>
        <button type="submit" className="profile-load-btn" disabled={loading || !draft.trim()}>
          {loading ? <Loader2 size={15} className="spin" aria-hidden="true" /> : 'Load'}
        </button>
      </form>

      {error ? <div className="profile-error" role="alert">{error}</div> : null}

      {profile ? (
        <div className="profile-loaded">
          <div className="profile-summary-row">
            <div className="profile-avatar-lg">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span>{String(profile.username || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="profile-identity">
              <strong>{profile.name || profile.username}</strong>
              <span>@{profile.username}</span>
            </div>
            <a className="play-chess-btn" href="https://www.chess.com/play/online" target="_blank" rel="noreferrer">
              Play chess
            </a>
          </div>

          <div className="profile-ratings" aria-label="Chess.com ratings">
            <span><small>Rapid</small><strong>{ratingLabel(profile.ratings?.rapid)}</strong></span>
            <span><small>Blitz</small><strong>{ratingLabel(profile.ratings?.blitz)}</strong></span>
            <span><small>Bullet</small><strong>{ratingLabel(profile.ratings?.bullet)}</strong></span>
          </div>

          {profile.games?.length > 0 ? (
            <div className="recent-games">
              <div className="recent-games-title">
                <span>Recent games</span>
                <small>Tap to review</small>
              </div>
              {profile.games.slice(0, 5).map((game) => {
                const opponent = opponentForGame(game, profile.username) || {};
                const outcome = getGameOutcome(game, profile.username);
                const playedAt = game.end_time
                  ? new Date(game.end_time * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '';
                const outcomeLabel = outcome === 'win' ? 'W' : outcome === 'loss' ? 'L' : outcome === 'draw' ? 'D' : '·';
                return (
                  <button
                    type="button"
                    className="recent-game-row"
                    key={game.uuid || game.url}
                    onClick={() => onSelectGame?.(game.url)}
                  >
                    <span className={`game-outcome game-outcome--${outcome}`}>{outcomeLabel}</span>
                    <span className="recent-game-opponent">
                      <strong>{opponent.username || 'Opponent'}</strong>
                      <small>{game.time_class || 'game'} · {playedAt}</small>
                    </span>
                    <span className="recent-game-rating">{opponent.rating || '—'}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
