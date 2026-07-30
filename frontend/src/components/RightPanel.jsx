import React, { useState, useEffect, useRef } from 'react';
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
  Pause
} from 'lucide-react';

import { playMoveSound } from '../utils/audio';

const CLASS_COLORS = {
  brilliant: 'brilliant', great: 'great', best: 'best', excellent: 'excellent',
  good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', miss: 'miss', blunder: 'blunder', book: 'book'
};

const renderSan = (san, cls, figurineNotation = true) => {
  if (!san) return null;
  const pieces = { 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔' };
  const firstChar = san.charAt(0);
  const colorClass = cls ? CLASS_COLORS[cls.toLowerCase()] + "-text" : "";
  
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
  switch(cls.toLowerCase()) {
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
  setGameData,
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
  threads = 1
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('moves');
  const [isPlaying, setIsPlaying] = useState(false);
  const prevMoveIndexRef = useRef(currentMoveIndex);

  // Play audio on move index changes
  useEffect(() => {
    if (prevMoveIndexRef.current !== currentMoveIndex) {
      const moveObj = currentMoveIndex > 0 && gameData?.moves ? gameData.moves[currentMoveIndex - 1] : null;
      playMoveSound(moveObj, soundEnabled, soundVolume, soundTheme);
      prevMoveIndexRef.current = currentMoveIndex;
    }
  }, [currentMoveIndex, soundEnabled, soundVolume, soundTheme, gameData]);

  // Auto-play interval effect
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMoveIndex(prev => {
          const max = gameData?.moves?.length || 0;
          if (prev >= max) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, autoPlaySpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, autoPlaySpeed, gameData, setCurrentMoveIndex]);

  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/game/') || path.includes('/live/')) {
      const chessComUrl = `https://www.chess.com${path}`;
      setUrl(chessComUrl);
      fetchGame(chessComUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGame = async (targetUrl) => {
    const finalUrl = typeof targetUrl === 'string' ? targetUrl : url;
    if (!finalUrl) return;
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
          maxTime: maxTime,
          numLines: numLines,
          threads: threads
        })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to fetch game data');
      }
      const data = await response.json();
      setGameData(data);
      setCurrentMoveIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const maxMoves = gameData?.moves?.length || 0;
  const goToStart = () => { setIsPlaying(false); setCurrentMoveIndex(0); };
  const goToEnd = () => { setIsPlaying(false); setCurrentMoveIndex(maxMoves); };
  const goPrev = () => { setIsPlaying(false); setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1)); };
  const goNext = () => { setIsPlaying(false); setCurrentMoveIndex(Math.min(maxMoves, currentMoveIndex + 1)); };
  const togglePlay = () => setIsPlaying(prev => !prev);

  const movePairs = [];
  if (gameData && gameData.moves) {
    let currentPair = {};
    gameData.moves.forEach((move, i) => {
      const moveIndex = i + 1;
      if (move.color === 'white') {
        currentPair = { num: move.number, w: move.notation, wClass: move.classification, wTime: move.time, wIndex: moveIndex };
        if (i === gameData.moves.length - 1) movePairs.push(currentPair);
      } else {
        currentPair.b = move.notation;
        currentPair.bClass = move.classification;
        currentPair.bTime = move.time;
        currentPair.bIndex = moveIndex;
        movePairs.push(currentPair);
        currentPair = {};
      }
    });
  }

  const whiteCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, book: 0 };
  const blackCounts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0, book: 0 };
  
  if (gameData && gameData.moves) {
    gameData.moves.forEach(m => {
      const cls = m.classification?.toLowerCase();
      if (m.color === 'white' && whiteCounts[cls] !== undefined) whiteCounts[cls]++;
      if (m.color === 'black' && blackCounts[cls] !== undefined) blackCounts[cls]++;
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
    { label: 'Book', key: 'book', icon: '📖' }
  ];

  return (
    <div className="right-panel" aria-busy={loading}>
      {/* URL Input */}
      <div className="url-input-area">
        <div className="panel-heading">
          <div>
            <h1>Game review</h1>
            <p>Paste a Chess.com or Lichess game link</p>
          </div>
          <span className={`engine-status ${loading ? 'is-busy' : ''}`}><span /> {loading ? 'Analyzing' : 'Ready'}</span>
        </div>
        <form className="url-input-row" onSubmit={(e) => { e.preventDefault(); fetchGame(); }}>
          <input
            className="url-input"
            type="url"
            name="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="Game URL"
            placeholder="Paste game URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button type="submit" className="analyze-btn" disabled={loading || !url.trim()}>
            {loading && <Loader2 size={14} className="spin" aria-hidden="true" style={{ animation: 'spin 2s linear infinite' }} />}
            {loading ? 'Loading…' : 'Analyze'}
          </button>
        </form>
        {error && <div className="error-msg" role="alert">{error}</div>}
      </div>

      {/* Secondary Tabs */}
      <div className="panel-tabs-secondary" role="tablist" aria-label="Game Analysis Sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'moves'}
          aria-controls="moves-panel"
          className={`panel-tab-sec ${activeTab === 'moves' ? 'active' : ''}`}
          onClick={() => setActiveTab('moves')}
        >
          Moves
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'analysis'}
          aria-controls="analysis-panel"
          className={`panel-tab-sec ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'openings'}
          aria-controls="openings-panel"
          className={`panel-tab-sec ${activeTab === 'openings' ? 'active' : ''}`}
          onClick={() => setActiveTab('openings')}
        >
          Openings
        </button>
      </div>

      {/* Engine Info */}
      <div className="engine-info">
        <span>Starting Position</span>
        <span className="engine-name">
          <Cpu size={11} aria-hidden="true" /> {
            chessEngine === 'stockfish18' ? 'Stockfish 18' :
            chessEngine === 'stockfish18lite' ? 'Stockfish 18 Lite' :
            chessEngine === 'torch4' ? 'Torch 4' :
            chessEngine === 'torch4lite' ? 'Torch 4 Lite' :
            'Engine Off'
          } (Depth {engineDepth || 10})
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Engine settings"
              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'inherit', display: 'inline-flex' }}
            >
              <Settings size={11} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      {/* Accuracy Info */}
      {gameData && gameData.accuracy && (
        <div className="accuracy-info">
          <span style={{ color: '#d4a843', fontVariantNumeric: 'tabular-nums' }}>White Accuracy: {gameData.accuracy.white}%</span>
          <span style={{ color: '#5b7fa6', fontVariantNumeric: 'tabular-nums' }}>Black Accuracy: {gameData.accuracy.black}%</span>
        </div>
      )}

      {/* Tab content view */}
      {activeTab === 'moves' && (
        <div className="moves-list panel-content" id="moves-panel" role="tabpanel">
          {!gameData && (
            <div className="empty-state">
              <div className="empty-state-icon">♞</div>
              <h2>Your review starts here</h2>
              <p>Paste a game link above to see engine evaluations, move classifications, and accuracy.</p>
            </div>
          )}
          {movePairs.map((m, idx) => (
            <div key={idx} className="move-row">
              <div className="move-num">{m.num}.</div>

              <button
                type="button"
                className={`move-col ${currentMoveIndex === m.wIndex ? 'selected' : ''}`}
                onClick={() => { setIsPlaying(false); if (m.wIndex) setCurrentMoveIndex(m.wIndex); }}
                aria-label={`Move ${m.num} White: ${m.w || 'none'}`}
              >
                <div className="move-text">
                  {m.wClass && (
                    <span className={`move-class-icon ${CLASS_COLORS[m.wClass?.toLowerCase()] || ''}`} title={m.wClass}>
                      {getIcon(m.wClass)}
                    </span>
                  )}
                  {renderSan(m.w, m.wClass, figurineNotation)}
                </div>
                <div className="move-time">
                  <div className="time-bar"></div>
                  <span>{m.wTime || ''}</span>
                </div>
              </button>

              <button
                type="button"
                className={`move-col ${currentMoveIndex === m.bIndex ? 'selected' : ''}`}
                onClick={() => { setIsPlaying(false); if (m.bIndex) setCurrentMoveIndex(m.bIndex); }}
                aria-label={`Move ${m.num} Black: ${m.b || 'none'}`}
              >
                <div className="move-text">
                  {m.bClass && (
                    <span className={`move-class-icon ${CLASS_COLORS[m.bClass?.toLowerCase()] || ''}`} title={m.bClass}>
                      {getIcon(m.bClass)}
                    </span>
                  )}
                  {renderSan(m.b, m.bClass, figurineNotation)}
                </div>
                <div className="move-time">
                  <div className="time-bar"></div>
                  <span>{m.bTime || ''}</span>
                </div>
              </button>
            </div>
          ))}

          {gameData && <div className="stats-container">
            {statRows.map((row) => {
              const w = whiteCounts[row.key];
              const b = blackCounts[row.key];
              if (w === 0 && b === 0 && row.key !== 'best' && row.key !== 'blunder') return null;
              return (
                <div key={row.key} className="stat-row" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <div className="stat-label">{row.label}</div>
                  <div className={`stat-white ${row.key}`}>{w}</div>
                  <div className={`stat-icon ${CLASS_COLORS[row.key]}`}>{row.icon}</div>
                  <div className={`stat-black ${row.key}`}>{b}</div>
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="empty-state panel-content" id="analysis-panel" role="tabpanel">
          <div className="empty-state-icon">⌁</div>
          <h2>Analysis overview</h2>
          <p>{gameData ? 'Use the move list to explore each engine evaluation.' : 'Analyze a game first to unlock its evaluation.'}</p>
        </div>
      )}

      {activeTab === 'openings' && (
        <div className="empty-state panel-content" id="openings-panel" role="tabpanel">
          <div className="empty-state-icon">♙</div>
          <h2>Opening explorer</h2>
          <p>{gameData ? 'Opening details will appear when they are available for this game.' : 'Analyze a game to identify its opening.'}</p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="panel-footer">
        <div className="move-progress" aria-live="polite">
          <span>Move</span>
          <strong>{currentMoveIndex} / {maxMoves}</strong>
        </div>
        <button type="button" className="review-btn" onClick={() => fetchGame()} disabled={loading || !url.trim()}>
          {loading ? 'Analyzing game…' : '★ Analyze again'}
        </button>

        <div className="controls">
          <button type="button" className="control-btn" title="Share" aria-label="Share game"><Share2 size={15} aria-hidden="true" /></button>

          <div className="controls-main">
            <button type="button" className="control-btn" onClick={goToStart} disabled={!gameData || currentMoveIndex === 0} title="Start (Home)" aria-label="First move"><SkipBack size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goPrev} disabled={!gameData || currentMoveIndex === 0} title="Previous (←)" aria-label="Previous move"><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" className={`control-btn play-control ${isPlaying ? 'active' : ''}`} onClick={togglePlay} disabled={!gameData} title={isPlaying ? "Pause auto-play" : "Start auto-play"} aria-label="Auto play moves">
              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="control-btn" onClick={goNext} disabled={!gameData || currentMoveIndex === maxMoves} title="Next (→)" aria-label="Next move"><ChevronRight size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goToEnd} disabled={!gameData || currentMoveIndex === maxMoves} title="End (End)" aria-label="Last move"><SkipForward size={16} aria-hidden="true" /></button>
          </div>

          <button type="button" className={`control-btn ${isFlipped ? 'active' : ''}`} onClick={onToggleFlip} title={isFlipped ? "Flip board (Black perspective)" : "Flip board (White perspective)"} aria-label="Flip board perspective" aria-pressed={isFlipped}><RefreshCw size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}

