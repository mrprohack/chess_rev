import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  Settings, 
  Share2,
  RefreshCw,
  Cpu,
} from 'lucide-react';

const CLASS_COLORS = {
  brilliant: 'brilliant', great: 'great', best: 'best', excellent: 'excellent',
  good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', miss: 'miss', blunder: 'blunder', book: 'book'
};

const renderSan = (san, cls) => {
  if (!san) return null;
  const pieces = { 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔' };
  const firstChar = san.charAt(0);
  const colorClass = cls ? CLASS_COLORS[cls.toLowerCase()] + "-text" : "";
  
  if (pieces[firstChar]) {
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

export default function RightPanel({ gameData, setGameData, currentMoveIndex, setCurrentMoveIndex }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('review');

  const fetchGame = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
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
  const goToStart = () => setCurrentMoveIndex(0);
  const goToEnd = () => setCurrentMoveIndex(maxMoves);
  const goPrev = () => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
  const goNext = () => setCurrentMoveIndex(Math.min(maxMoves, currentMoveIndex + 1));

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
            type="text"
            placeholder="Paste Chess.com game URL…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="analyze-btn" onClick={fetchGame} disabled={loading}>
            {loading ? 'Loading…' : 'Analyze'}
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>

      {/* Secondary Tabs */}
      <div className="panel-tabs-secondary">
        <div className={`panel-tab-sec ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>Review</div>
        <div className={`panel-tab-sec ${activeTab === 'moves' ? 'active' : ''}`} onClick={() => setActiveTab('moves')}>Moves</div>
        <div className={`panel-tab-sec ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Analysis</div>
      </div>

      {activeTab === 'moves' && (
        <>
          {/* Engine Info */}
          <div className="engine-info">
            <span>Starting Position</span>
            <span className="engine-name">
              <Cpu size={11} /> Stockfish 18 Lite <Settings size={11} style={{ cursor: 'pointer' }} />
            </span>
          </div>

          {/* Moves List */}
          <div className="moves-list">
            {displayMoves.map((m, idx) => (
              <div key={idx} className="move-row">
                <div className="move-num">{m.num}.</div>

                <div
                  className={`move-col ${currentMoveIndex === m.wIndex ? 'selected' : ''}`}
                  onClick={() => m.wIndex && setCurrentMoveIndex(m.wIndex)}
                >
                    <div className="move-text">
                    {m.wClass && (
                      <span className={`move-class-icon ${CLASS_COLORS[m.wClass?.toLowerCase()] || ''}`} title={m.wClass}>
                        {getIcon(m.wClass)}
                      </span>
                    )}
                    {renderSan(m.w, m.wClass)}
                  </div>
                  <div className="move-time">
                    <div className="time-bar"></div>
                    <span>{m.wTime || ''}</span>
                  </div>
                </div>

                <div
                  className={`move-col ${currentMoveIndex === m.bIndex ? 'selected' : ''}`}
                  onClick={() => m.bIndex && setCurrentMoveIndex(m.bIndex)}
                >
                    <div className="move-text">
                    {m.bClass && (
                      <span className={`move-class-icon ${CLASS_COLORS[m.bClass?.toLowerCase()] || ''}`} title={m.bClass}>
                        {getIcon(m.bClass)}
                      </span>
                    )}
                    {renderSan(m.b, m.bClass)}
                  </div>
                  <div className="move-time">
                    <div className="time-bar"></div>
                    <span>{m.bTime || ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'review' && (
        <div className="review-tab">
          <div className="review-header-title">
            <span style={{color: '#86efac', marginRight: '6px', fontSize: '1.2rem'}}>🔍</span> Game Review
          </div>
          
          <div className="review-accuracy-section">
            <div className="acc-labels">
              <span className="acc-label-text">Players</span>
              <span className="acc-label-text">Accuracy</span>
            </div>
            <div className="acc-player-col">
              <div className="acc-avatar" style={{background: '#d4a843'}}></div>
              <div className="acc-box white">85.3</div>
            </div>
            <div className="acc-player-col">
              <div className="acc-avatar" style={{background: '#5b7fa6'}}></div>
              <div className="acc-box black">62.3</div>
            </div>
          </div>

          <div className="review-divider"></div>

          <div className="stats-container">
            {statRows.map((row) => {
              const w = whiteCounts[row.key];
              const b = blackCounts[row.key];
              if (w === 0 && b === 0 && row.key !== 'best' && row.key !== 'blunder') return null;
              return (
                <div key={row.key} className="stat-row">
                  <div className="stat-label">{row.label}</div>
                  <div className={`stat-white ${row.key}`}>{w}</div>
                  <div className={`stat-icon ${CLASS_COLORS[row.key]}`}>{row.icon}</div>
                  <div className={`stat-black ${row.key}`}>{b}</div>
                </div>
              );
            })}
          </div>

          <div className="review-divider"></div>

          <div className="rating-row">
            <span className="rating-label">Game Rating</span>
            <div className="acc-box white">1400</div>
            <div className="acc-box black">500</div>
          </div>
          
          <div className="phase-row">
            <span className="phase-label">Opening</span>
            <span className="phase-icon good">👍</span>
            <span className="phase-icon excellent">✔</span>
          </div>
          <div className="phase-row">
            <span className="phase-label">Middlegame</span>
            <span className="phase-icon great">!</span>
            <span className="phase-icon inaccuracy">?!</span>
          </div>
          <div className="phase-row">
            <span className="phase-label">Endgame</span>
            <span className="phase-icon none">-</span>
            <span className="phase-icon none">-</span>
          </div>

          <div className="review-actions">
            <button className="btn-secondary">New 10 min</button>
            <button className="btn-primary">Start Review</button>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="panel-footer">
        <button className="review-btn">
          ★ Game Review
        </button>

        <div className="controls">
          <button className="control-btn" title="Share"><Share2 size={15} /></button>

          <div className="controls-main">
            <button className="control-btn" onClick={goToStart} title="Start"><SkipBack size={16} /></button>
            <button className="control-btn" onClick={goPrev} title="Previous"><ChevronLeft size={16} /></button>
            <button className="control-btn" onClick={goNext} title="Next"><ChevronRight size={16} /></button>
            <button className="control-btn" onClick={goToEnd} title="End"><SkipForward size={16} /></button>
          </div>

          <button className="control-btn" title="Flip board"><RefreshCw size={15} /></button>
        </div>
      </div>
    </div>
  );
}
