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

  const counts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 };
  if (gameData && gameData.moves) {
    gameData.moves.forEach(m => {
      const cls = m.classification?.toLowerCase();
      if (counts[cls] !== undefined) {
        counts[cls]++;
      }
    });
  }

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
        <div className="panel-tab-sec active">Moves</div>
        <div className="panel-tab-sec">Analysis</div>
        <div className="panel-tab-sec">Openings</div>
      </div>

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

        <div className="badge-row">
          {counts.brilliant > 0 && <span className="badge brilliant">!! {counts.brilliant} Brilliant</span>}
          {counts.great > 0 && <span className="badge great">! {counts.great} Great</span>}
          {counts.best > 0 && <span className="badge best">★ {counts.best} Best</span>}
          {counts.excellent > 0 && <span className="badge excellent">👍 {counts.excellent} Excellent</span>}
          {counts.good > 0 && <span className="badge good">✔ {counts.good} Good</span>}
          {counts.inaccuracy > 0 && <span className="badge inaccuracy">?! {counts.inaccuracy} Inaccuracy</span>}
          {counts.mistake > 0 && <span className="badge mistake">? {counts.mistake} Mistake</span>}
          {counts.miss > 0 && <span className="badge miss">✖ {counts.miss} Miss</span>}
          {counts.blunder > 0 && <span className="badge blunder">?? {counts.blunder} Blunder</span>}
        </div>
      </div>

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
