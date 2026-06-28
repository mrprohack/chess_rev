import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  Settings, 
  Share2,
  RefreshCw,
  Search,
  PlusSquare,
  LayoutGrid,
  Users
} from 'lucide-react';

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
      setCurrentMoveIndex(0); // Reset position to start of game
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigate functions
  const maxMoves = gameData?.moves?.length || 0;
  const goToStart = () => setCurrentMoveIndex(0);
  const goToEnd = () => setCurrentMoveIndex(maxMoves);
  const goPrev = () => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
  const goNext = () => setCurrentMoveIndex(Math.min(maxMoves, currentMoveIndex + 1));

  // Format moves for the display grid (pairs of white and black)
  const movePairs = [];
  if (gameData && gameData.moves) {
    let currentPair = {};
    gameData.moves.forEach((move, i) => {
      const moveIndex = i + 1;
      if (move.color === 'white') {
        currentPair = { num: move.number, w: move.notation, wClass: move.classification, wIndex: moveIndex };
        if (i === gameData.moves.length - 1) movePairs.push(currentPair);
      } else {
        currentPair.b = move.notation;
        currentPair.bClass = move.classification;
        currentPair.bIndex = moveIndex;
        movePairs.push(currentPair);
        currentPair = {};
      }
    });
  }

  const dummyMoves = [
    { num: 1, w: 'e4', wTime: '0.1s', b: 'e5', bTime: '0.1s', wIndex: 1, bIndex: 2 },
    { num: 2, w: 'Nf3', wTime: '1.8s', b: 'Nc6', bTime: '1.3s', wIndex: 3, bIndex: 4 },
    { num: 3, w: 'Bc4', wTime: '3.2s', b: 'Bc5', bTime: '1.5s', wIndex: 5, bIndex: 6 }
  ];

  const displayMoves = gameData ? movePairs : dummyMoves;

  return (
    <div className="right-panel">
      {/* URL Input Form */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1d1b19' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Paste Chess.com URL..." 
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: '4px', 
              border: 'none', 
              backgroundColor: '#302E2B', 
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
          <button 
            onClick={fetchGame}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--green-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
        {error && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '8px' }}>{error}</div>}
      </div>

      {/* Secondary Tabs */}
      <div className="panel-tabs-secondary">
        <div className="panel-tab-sec active">Moves</div>
        <div className="panel-tab-sec">Info</div>
        <div className="panel-tab-sec">Openings</div>
      </div>

      {/* Engine Info */}
      <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span>Starting Position</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          | Stockfish 18 Lite <Settings size={12} />
        </span>
      </div>

      {/* Moves List */}
      <div className="moves-list">
        {displayMoves.map((m, idx) => (
          <div key={idx} className="move-row">
            <div className="move-num">{m.num}.</div>
            
            <div 
              className="move-col" 
              onClick={() => m.wIndex && setCurrentMoveIndex(m.wIndex)}
              style={{ backgroundColor: currentMoveIndex === m.wIndex ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            >
              <div className="move-text">
                {m.w} <span style={{ color: 'var(--green-primary)', fontSize: '0.75rem' }}>{m.wClass}</span>
              </div>
              <div className="move-time">{m.wTime || '-'}</div>
            </div>

            <div 
              className="move-col"
              onClick={() => m.bIndex && setCurrentMoveIndex(m.bIndex)}
              style={{ backgroundColor: currentMoveIndex === m.bIndex ? 'rgba(255,255,255,0.2)' : 'transparent' }}
            >
              <div className="move-text">
                {m.b} <span style={{ color: 'var(--green-primary)', fontSize: '0.75rem' }}>{m.bClass}</span>
              </div>
              <div className="move-time">{m.bTime || '-'}</div>
            </div>
          </div>
        ))}
        
        <div className="badge-row">
          <span className="badge great">! Great</span>
          <span className="badge best">★ Best</span>
          <span className="badge excellent">👍 Excellent</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="panel-footer">
        <button className="review-btn">
          ★ Game Review
        </button>

        <div className="controls">
          <button className="control-btn"><Share2 size={16} /></button>
          
          <div className="controls-main">
            <button className="control-btn" onClick={goToStart}><SkipBack size={18} /></button>
            <button className="control-btn" onClick={goPrev}><ChevronLeft size={18} /></button>
            <button className="control-btn" onClick={goNext}><ChevronRight size={18} /></button>
            <button className="control-btn" onClick={goToEnd}><SkipForward size={18} /></button>
          </div>

          <button className="control-btn"><RefreshCw size={16} /></button>
        </div>
      </div>
    </div>
  );
}
