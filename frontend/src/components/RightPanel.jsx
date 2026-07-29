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

  const handleKey = (e) => {
    if (e.key === 'Enter') fetchGame();
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

  const dummyMoves = [
    { num: 1, w: 'e4', b: 'e5', wIndex: 1, bIndex: 2 },
    { num: 2, w: 'Nf3', b: 'Nc6', wIndex: 3, bIndex: 4 },
    { num: 3, w: 'Bc4', b: 'Bc5', wIndex: 5, bIndex: 6 },
  ];

  const displayMoves = gameData ? movePairs : dummyMoves;

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
    <div className="right-panel">
      {/* URL Input */}
      <div className="url-input-area">
        <div className="url-input-row">
          <input
            className="url-input"
            type="url"
            name="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="Game URL"
            placeholder="e.g., https://www.chess.com/game/live/1234…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKey}
          />
          <button type="button" className="analyze-btn" onClick={fetchGame} disabled={loading}>
            {loading && <Loader2 size={14} className="spin" aria-hidden="true" style={{ animation: 'spin 2s linear infinite' }} />}
            {loading ? 'Loading…' : 'Analyze'}
          </button>
        </div>
        {error && <div className="error-msg" role="alert">{error}</div>}
      </div>

      {/* Secondary Tabs */}
      <div className="panel-tabs-secondary" role="tablist" aria-label="Game Analysis Sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'moves'}
          className={`panel-tab-sec ${activeTab === 'moves' ? 'active' : ''}`}
          onClick={() => setActiveTab('moves')}
        >
          Moves
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'analysis'}
          className={`panel-tab-sec ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'openings'}
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
        <div className="moves-list">
          {displayMoves.map((m, idx) => (
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

          <div className="stats-container">
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
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-60)', fontSize: '0.85rem' }}>
          Interactive Stockfish evaluation graph & blunder timeline.
        </div>
      )}

      {activeTab === 'openings' && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-60)', fontSize: '0.85rem' }}>
          Opening Explorer & Win-Rate Statistics.
        </div>
      )}

      {/* Footer Controls */}
      <div className="panel-footer">
        <button type="button" className="review-btn" onClick={() => fetchGame()}>
          ★ Game Review
        </button>

        <div className="controls">
          <button type="button" className="control-btn" title="Share" aria-label="Share game"><Share2 size={15} aria-hidden="true" /></button>

          <div className="controls-main">
            <button type="button" className="control-btn" onClick={goToStart} title="Start (Home)" aria-label="First move"><SkipBack size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goPrev} title="Previous (←)" aria-label="Previous move"><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" className={`control-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlay} title={isPlaying ? "Pause auto-play" : "Start auto-play"} aria-label="Auto play moves">
              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="control-btn" onClick={goNext} title="Next (→)" aria-label="Next move"><ChevronRight size={16} aria-hidden="true" /></button>
            <button type="button" className="control-btn" onClick={goToEnd} title="End (End)" aria-label="Last move"><SkipForward size={16} aria-hidden="true" /></button>
          </div>

          <button type="button" className={`control-btn ${isFlipped ? 'active' : ''}`} onClick={onToggleFlip} title={isFlipped ? "Flip board (Black perspective)" : "Flip board (White perspective)"} aria-label="Flip board perspective" aria-pressed={isFlipped}><RefreshCw size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}

