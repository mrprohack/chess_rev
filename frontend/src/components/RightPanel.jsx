import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Settings,
  Share2,
  RefreshCw,
  Cpu,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';

import { playMoveSound } from '../utils/audio';
import { isImportantMove } from '../utils/review';
import MoveStory from './MoveStory';

const CLASS_COLORS = {
  brilliant: 'brilliant', great: 'great', best: 'best', excellent: 'excellent',
  good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', miss: 'miss', blunder: 'blunder', book: 'book',
};

const renderSan = (san, cls, figurineNotation = true) => {
  if (!san) return null;
  const pieces = { N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
  const firstChar = san.charAt(0);
  const colorClass = cls ? `${CLASS_COLORS[cls.toLowerCase()] || ''}-text` : '';

  if (figurineNotation && pieces[firstChar]) {
    return (
      <span className={colorClass} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ fontSize: '1.05rem', marginRight: '1px' }}>{pieces[firstChar]}</span>
        {san.slice(1)}
      </span>
    );
  }
  return <span className={colorClass}>{san}</span>;
};

const getIcon = (cls) => {
  if (!cls) return '';
  switch (cls.toLowerCase()) {
    case 'brilliant': return '!!';
    case 'great': return '!';
    case 'best': return '★';
    case 'excellent': return '👍';
    case 'good': return '✔';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
    case 'miss': return '✖';
    case 'book': return '📖';
    default: return '';
  }
};

export default function RightPanel({
  gameData,
  onGameLoaded,
  currentMoveIndex,
  setCurrentMoveIndex,
  engineDepth,
  onOpenSettings,
  isFlipped,
  onToggleFlip,
  soundEnabled = true,
  soundVolume = 0.8,
  soundTheme = 'classic',
  autoPlaySpeed = 1000,
  figurineNotation = true,
  chessEngine = 'stockfish18',
  maxTime = 5,
  numLines = 3,
  threads = 1,
  onHideReview,
  requestedUrl = '',
  onRequestedUrlConsumed,
  bookmarks = [],
  onToggleBookmark,
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('moves');
  const [isPlaying, setIsPlaying] = useState(false);
  const prevMoveIndexRef = useRef(currentMoveIndex);
  const requestedUrlRef = useRef('');

  useEffect(() => {
    if (prevMoveIndexRef.current !== currentMoveIndex) {
      const moveObj = currentMoveIndex > 0 && gameData?.moves ? gameData.moves[currentMoveIndex - 1] : null;
      playMoveSound(moveObj, soundEnabled, soundVolume, soundTheme);
      prevMoveIndexRef.current = currentMoveIndex;
    }
  }, [currentMoveIndex, soundEnabled, soundVolume, soundTheme, gameData]);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMoveIndex((previous) => {
          const max = gameData?.moves?.length || 0;
          if (previous >= max) {
            setIsPlaying(false);
            return previous;
          }
          return previous + 1;
        });
      }, autoPlaySpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, autoPlaySpeed, gameData, setCurrentMoveIndex]);

  const fetchGame = async (targetUrl) => {
    const finalUrl = (typeof targetUrl === 'string' ? targetUrl : url).trim();
    if (!finalUrl) return;
    setIsPlaying(false);
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
      const response = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          depth: engineDepth || 10,
          engine: chessEngine,
          maxTime,
          numLines,
          threads,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Failed to fetch game data');
      setUrl(finalUrl);
      onGameLoaded?.(body, finalUrl);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to fetch game data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!requestedUrl || requestedUrlRef.current === requestedUrl) return;
    requestedUrlRef.current = requestedUrl;
    setUrl(requestedUrl);
    onRequestedUrlConsumed?.();
    fetchGame(requestedUrl);
  }, [requestedUrl]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/game/') || path.includes('/live/')) {
      const chessComUrl = `https://www.chess.com${path}`;
      setUrl(chessComUrl);
      fetchGame(chessComUrl);
    }
  }, []);

  useEffect(() => {
    const handleSpace = (event) => {
      if (event.code !== 'Space' || !gameData) return;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
      event.preventDefault();
      setIsPlaying((previous) => !previous);
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [gameData]);

  const maxMoves = gameData?.moves?.length || 0;
  const goToStart = () => { setIsPlaying(false); setCurrentMoveIndex(0); };
  const goToEnd = () => { setIsPlaying(false); setCurrentMoveIndex(maxMoves); };
  const goPrev = () => { setIsPlaying(false); setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1)); };
  const goNext = () => { setIsPlaying(false); setCurrentMoveIndex(Math.min(maxMoves, currentMoveIndex + 1)); };
  const togglePlay = () => setIsPlaying((previous) => !previous);

  const currentMove = currentMoveIndex > 0 ? gameData?.moves?.[currentMoveIndex - 1] : null;
  const bookmarkedSet = new Set(bookmarks);
  const keyMomentIndices = gameData?.moves?.reduce((indices, move, index) => {
    const moveIndex = index + 1;
    if (isImportantMove(move) || bookmarkedSet.has(moveIndex)) indices.push(moveIndex);
    return indices;
  }, []) || [];
  const previousKey = [...keyMomentIndices].reverse().find((index) => index < currentMoveIndex);
  const nextKey = keyMomentIndices.find((index) => index > currentMoveIndex);

  const movePairs = [];
  if (gameData?.moves) {
    let currentPair = {};
    gameData.moves.forEach((move, index) => {
      const moveIndex = index + 1;
      if (move.color === 'white') {
        currentPair = {
          num: move.number,
          w: move.notation,
          wClass: move.classification,
          wTime: move.time,
          wIndex: moveIndex,
          wImportant: isImportantMove(move),
        };
        if (index === gameData.moves.length - 1) movePairs.push(currentPair);
      } else {
        currentPair.b = move.notation;
        currentPair.bClass = move.classification;
        currentPair.bTime = move.time;
        currentPair.bIndex = moveIndex;
        currentPair.bImportant = isImportantMove(move);
        movePairs.push(currentPair);
        currentPair = {};
      }
    });
  }

  const whiteCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, book: 0 };
  const blackCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, book: 0 };
  if (gameData?.moves) {
    gameData.moves.forEach((move) => {
      const cls = move.classification?.toLowerCase();
      if (move.color === 'white' && whiteCounts[cls] !== undefined) whiteCounts[cls] += 1;
      if (move.color === 'black' && blackCounts[cls] !== undefined) blackCounts[cls] += 1;
    });
  }

  const statRows = [
    { label: 'Brilliant', key: 'brilliant', icon: '!!' },
    { label: 'Great', key: 'great', icon: '!' },
    { label: 'Best', key: 'best', icon: '★' },
    { label: 'Excellent', key: 'excellent', icon: '👍' },
    { label: 'Good', key: 'good', icon: '✔' },
    { label: 'Inaccuracy', key: 'inaccuracy', icon: '?!' },
    { label: 'Mistake', key: 'mistake', icon: '?' },
    { label: 'Miss', key: 'miss', icon: '✖' },
    { label: 'Blunder', key: 'blunder', icon: '??' },
    { label: 'Book', key: 'book', icon: '📖' },
  ];

  const renderMoveButton = ({ notation, cls, time, index, important, sideLabel, moveNumber }) => {
    if (!notation || !index) return <span className="move-col move-col--empty" aria-hidden="true" />;
    const bookmarked = bookmarkedSet.has(index);
    return (
      <button
        type="button"
        className={`move-col ${currentMoveIndex === index ? 'selected' : ''} ${important ? 'key-move' : ''} ${bookmarked ? 'bookmarked-move' : ''}`}
        onClick={() => { setIsPlaying(false); if (index) setCurrentMoveIndex(index); }}
        aria-label={`Move ${moveNumber} ${sideLabel}: ${notation || 'none'}${bookmarked ? ', bookmarked' : ''}`}
      >
        <div className="move-text">
          {bookmarked && <span className="bookmark-marker" title="Bookmarked">◆</span>}
          {cls && (
            <span className={`move-class-icon ${CLASS_COLORS[cls?.toLowerCase()] || ''}`} title={cls}>
              {getIcon(cls)}
            </span>
          )}
          {renderSan(notation, cls, figurineNotation)}
        </div>
        <div className="move-time">
          <div className="time-bar" />
          <span>{time || ''}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="right-panel right-panel--motion" aria-busy={loading}>
      <div className="url-input-area review-source-area">
        <div className="panel-heading">
          <div>
            <h1>Game Review</h1>
            <p>Review a recent game or paste a game link</p>
          </div>
          <div className="review-heading-actions">
            <span className={`engine-status ${loading ? 'is-busy' : ''}`}><span /> {loading ? 'Analyzing' : 'Ready'}</span>
            <button type="button" className="hide-review-btn" onClick={onHideReview} aria-expanded="true">
              Hide Review
            </button>
          </div>
        </div>

        <form className="url-input-row" onSubmit={(event) => { event.preventDefault(); fetchGame(); }}>
          <input
            className="url-input"
            type="url"
            name="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="Game URL"
            placeholder="Chess.com or Lichess game URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button type="submit" className="analyze-btn" disabled={loading || !url.trim()}>
            {loading && <Loader2 size={14} className="spin" aria-hidden="true" />}
            {loading ? 'Loading…' : 'Analyze'}
          </button>
        </form>
        {error && <div className="error-msg" role="alert">{error}</div>}
      </div>

      <div className="panel-tabs-secondary" role="tablist" aria-label="Game Analysis Sections">
        <button type="button" role="tab" aria-selected={activeTab === 'moves'} aria-controls="moves-panel" className={`panel-tab-sec ${activeTab === 'moves' ? 'active' : ''}`} onClick={() => setActiveTab('moves')}>Moves</button>
        <button type="button" role="tab" aria-selected={activeTab === 'analysis'} aria-controls="analysis-panel" className={`panel-tab-sec ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Analysis</button>
        <button type="button" role="tab" aria-selected={activeTab === 'openings'} aria-controls="openings-panel" className={`panel-tab-sec ${activeTab === 'openings' ? 'active' : ''}`} onClick={() => setActiveTab('openings')}>Openings</button>
      </div>

      <div className="engine-info">
        <span>{currentMove ? `Move ${currentMoveIndex}` : 'Starting Position'}</span>
        <span className="engine-name">
          <Cpu size={11} aria-hidden="true" /> {
            chessEngine === 'stockfish18' ? 'Stockfish 18' :
            chessEngine === 'stockfish18lite' ? 'Stockfish 18 Lite' :
            chessEngine === 'torch4' ? 'Torch 4' :
            chessEngine === 'torch4lite' ? 'Torch 4 Lite' :
            'Engine Off'
          } (Depth {engineDepth || 10})
          {onOpenSettings && (
            <button type="button" onClick={onOpenSettings} aria-label="Engine settings" className="engine-settings-btn">
              <Settings size={11} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      {gameData?.accuracy && (
        <div className="accuracy-info">
          <span style={{ color: '#d4a843', fontVariantNumeric: 'tabular-nums' }}>White Accuracy: {gameData.accuracy.white}%</span>
          <span style={{ color: '#5b7fa6', fontVariantNumeric: 'tabular-nums' }}>Black Accuracy: {gameData.accuracy.black}%</span>
        </div>
      )}

      {currentMove && (
        <MoveStory
          move={currentMove}
          moveIndex={currentMoveIndex}
          bookmarked={bookmarkedSet.has(currentMoveIndex)}
          onToggleBookmark={onToggleBookmark}
          onPreviousKey={() => { setIsPlaying(false); if (previousKey) setCurrentMoveIndex(previousKey); }}
          onNextKey={() => { setIsPlaying(false); if (nextKey) setCurrentMoveIndex(nextKey); }}
          hasPreviousKey={Boolean(previousKey)}
          hasNextKey={Boolean(nextKey)}
        />
      )}

      {activeTab === 'moves' && (
        <div className="moves-list panel-content" id="moves-panel" role="tabpanel">
          {!gameData && (
            <div className="empty-state">
              <div className="empty-state-icon">♞</div>
              <h2>Your review starts here</h2>
              <p>Paste a game link or choose one from History. Key moments, best-move arrows, and bookmarks appear as you replay.</p>
            </div>
          )}
          {movePairs.map((movePair, index) => (
            <div key={index} className="move-row">
              <div className="move-num">{movePair.num}.</div>
              {renderMoveButton({
                notation: movePair.w,
                cls: movePair.wClass,
                time: movePair.wTime,
                index: movePair.wIndex,
                important: movePair.wImportant,
                sideLabel: 'White',
                moveNumber: movePair.num,
              })}
              {renderMoveButton({
                notation: movePair.b,
                cls: movePair.bClass,
                time: movePair.bTime,
                index: movePair.bIndex,
                important: movePair.bImportant,
                sideLabel: 'Black',
                moveNumber: movePair.num,
              })}
            </div>
          ))}

          {gameData && (
            <div className="stats-container">
              {statRows.map((row) => {
                const white = whiteCounts[row.key];
                const black = blackCounts[row.key];
                if (white === 0 && black === 0 && row.key !== 'best' && row.key !== 'blunder') return null;
                return (
                  <div key={row.key} className="stat-row" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <div className="stat-label">{row.label}</div>
                    <div className={`stat-white ${row.key}`}>{white}</div>
                    <div className={`stat-icon ${CLASS_COLORS[row.key]}`}>{row.icon}</div>
                    <div className={`stat-black ${row.key}`}>{black}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="empty-state panel-content" id="analysis-panel" role="tabpanel">
          <div className="empty-state-icon">⌁</div>
          <h2>Analysis overview</h2>
          <p>{gameData ? 'Use key-moment navigation to jump between the moves that changed the game.' : 'Analyze a game first to unlock its evaluation.'}</p>
        </div>
      )}

      {activeTab === 'openings' && (
        <div className="empty-state panel-content" id="openings-panel" role="tabpanel">
          <div className="empty-state-icon">♙</div>
          <h2>Opening explorer</h2>
          <p>{gameData ? 'Opening details appear here when they are available for this game.' : 'Analyze a game to identify its opening.'}</p>
        </div>
      )}

      <div className="panel-footer">
        <div className="move-progress" aria-live="polite">
          <span>Move</span>
          <strong>{currentMoveIndex} / {maxMoves}</strong>
          {keyMomentIndices.length > 0 && <small>{keyMomentIndices.length} key moments</small>}
        </div>
        <button type="button" className="review-btn" onClick={() => fetchGame()} disabled={loading || !url.trim()}>
          {loading ? 'Analyzing game…' : '★ Analyze again'}
        </button>

        <div className="controls">
          <button type="button" className="control-btn" title="Share" aria-label="Share game"><Share2 size={15} aria-hidden="true" /></button>
          <div className="controls-main">
            <button type="button" className="control-btn" onClick={goToStart} disabled={!gameData || currentMoveIndex === 0} title="Start (Home)" aria-label="First move"><SkipBack size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goPrev} disabled={!gameData || currentMoveIndex === 0} title="Previous (←)" aria-label="Previous move"><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" className={`control-btn play-control ${isPlaying ? 'active' : ''}`} onClick={togglePlay} disabled={!gameData} title={isPlaying ? 'Pause auto-play (Space)' : 'Start auto-play (Space)'} aria-label="Auto play moves">
              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="control-btn" onClick={goNext} disabled={!gameData || currentMoveIndex === maxMoves} title="Next (→)" aria-label="Next move"><ChevronRight size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goToEnd} disabled={!gameData || currentMoveIndex === maxMoves} title="End (End)" aria-label="Last move"><SkipForward size={16} aria-hidden="true" /></button>
          </div>
          <button type="button" className={`control-btn ${isFlipped ? 'active' : ''}`} onClick={onToggleFlip} title={isFlipped ? 'Black perspective' : 'White perspective'} aria-label="Flip board perspective" aria-pressed={isFlipped}><RefreshCw size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}
