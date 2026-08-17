import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { playMoveSound } from '../utils/audio';
import ProfileLoader from './ProfileLoader';
import './SettingsModal.css';

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  engineDepth,
  setEngineDepth,
  boardTheme,
  setBoardTheme,
  showArrows,
  setShowArrows,
  showCoordinates,
  setShowCoordinates,
  soundEnabled,
  setSoundEnabled,
  soundVolume = 0.8,
  setSoundVolume,
  soundTheme = 'classic',
  setSoundTheme,
  autoPlaySpeed,
  setAutoPlaySpeed,
  figurineNotation,
  setFigurineNotation,
  chessEngine,
  setChessEngine,
  maxTime,
  setMaxTime,
  numLines,
  setNumLines,
  threads,
  setThreads,
  profileUsername = '',
  profileData = null,
  profileLoading = false,
  profileError = '',
  onLoadProfile,
}) {
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const boardThemes = [
    { id: 'wood', label: 'Wood', light: '#F0D9B5', dark: '#B58863' },
    { id: 'green', label: 'Green', light: '#EEEED2', dark: '#769656' },
    { id: 'blue', label: 'Blue', light: '#DEE3E6', dark: '#8CA2AD' },
    { id: 'glass', label: 'Cyber', light: '#3A3F51', dark: '#262936' },
  ];

  const soundThemes = [
    { id: 'classic', label: 'Classic' },
    { id: 'soft', label: 'Soft' },
    { id: 'arcade', label: 'Arcade' },
  ];

  const speeds = [
    { value: 2000, label: 'Slow (2s)' },
    { value: 1000, label: 'Normal (1s)' },
    { value: 500, label: 'Fast (0.5s)' },
  ];

  const handleTestSound = (type = 'move') => {
    const sampleMoves = {
      move: { san: 'e4' },
      capture: { san: 'Nxf7' },
      check: { san: 'Qh5+' },
      checkmate: { san: 'Qxf7#' },
    };
    playMoveSound(sampleMoves[type] || sampleMoves.move, true, soundVolume, soundTheme);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close Settings">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section settings-profile-section">
            <h3 className="section-title">Account</h3>
            <ProfileLoader
              username={profileUsername}
              profile={profileData}
              loading={profileLoading}
              error={profileError}
              onLoadProfile={onLoadProfile}
              showRecentGames={false}
            />
            <div className="setting-hint">
              Your saved Chess.com username is used to orient the board to your side and load recent games.
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Analysis</h3>

            <div className="setting-row">
              <label htmlFor="engine-select">Chess Engine</label>
              <select id="engine-select" className="setting-select" value={chessEngine} onChange={(event) => setChessEngine(event.target.value)}>
                <option value="stockfish18">Stockfish 18 (108MB download)</option>
                <option value="stockfish18lite">Stockfish 18 Lite (7MB download)</option>
                <option value="torch4">Torch 4 (73MB download)</option>
                <option value="torch4lite">Torch 4 Lite (6MB download)</option>
                <option value="off">Engine Off</option>
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="max-time-select">Maximum Time</label>
              <select id="max-time-select" className="setting-select" value={maxTime} onChange={(event) => setMaxTime(Number(event.target.value))}>
                <option value={1}>1 sec</option>
                <option value={3}>3 sec</option>
                <option value={5}>5 sec</option>
                <option value={10}>10 sec</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="num-lines-select">Number of Lines</label>
              <select id="num-lines-select" className="setting-select" value={numLines} onChange={(event) => setNumLines(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number}</option>)}
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="threads-input">Threads</label>
              <input id="threads-input" type="number" className="setting-input" min="1" max="32" value={threads} style={{ width: '72px', padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-input)', color: 'var(--text-100)' }} onChange={(event) => setThreads(Number(event.target.value))} />
            </div>

            <div className="setting-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '7px' }}>
              <label htmlFor="engine-depth-input">Engine Depth ({engineDepth})</label>
              <div className="slider-group" style={{ width: '100%' }}>
                <input id="engine-depth-input" style={{ width: '100%' }} type="range" min="5" max="20" value={engineDepth} onChange={(event) => setEngineDepth(parseInt(event.target.value, 10))} />
                <div className="setting-hint">Higher depth means more accurate analysis.</div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Appearance</h3>
            <div className="setting-row" role="group" aria-labelledby="theme-label">
              <label id="theme-label">App Theme</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
                <button type="button" className={`toggle-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Normal</button>
                <button type="button" className={`toggle-btn ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}>System</button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Board Customization</h3>

            <div className="setting-row">
              <label>Board Colors</label>
              <div className="theme-options">
                {boardThemes.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    className={`board-theme-btn ${boardTheme === board.id ? 'active' : ''}`}
                    onClick={() => setBoardTheme(board.id)}
                    title={board.label}
                  >
                    <span className="swatch" style={{ background: `linear-gradient(135deg, ${board.light} 50%, ${board.dark} 50%)` }} />
                    <span className="swatch-label">{board.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <label htmlFor="show-arrows-toggle">Move Analysis Arrows</label>
              <label className="switch">
                <input id="show-arrows-toggle" type="checkbox" checked={showArrows} onChange={(event) => setShowArrows(event.target.checked)} />
                <span className="slider round" />
              </label>
            </div>

            <div className="setting-row">
              <label htmlFor="show-coords-toggle">Board Coordinates (1-8, a-h)</label>
              <label className="switch">
                <input id="show-coords-toggle" type="checkbox" checked={showCoordinates} onChange={(event) => setShowCoordinates(event.target.checked)} />
                <span className="slider round" />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="section-title">Audio & Navigation</h3>

            <div className="setting-row">
              <label htmlFor="sound-toggle">Move Sound Effects</label>
              <label className="switch">
                <input id="sound-toggle" type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
                <span className="slider round" />
              </label>
            </div>

            {soundEnabled ? (
              <>
                <div className="setting-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '7px' }}>
                  <label htmlFor="sound-volume-input">Sound Volume ({Math.round(soundVolume * 100)}%)</label>
                  <div className="slider-group" style={{ width: '100%' }}>
                    <input id="sound-volume-input" style={{ width: '100%' }} type="range" min="0" max="1" step="0.05" value={soundVolume} onChange={(event) => setSoundVolume(parseFloat(event.target.value))} />
                  </div>
                </div>

                <div className="setting-row">
                  <label>Sound Profile</label>
                  <div className="toggle-group">
                    {soundThemes.map((sound) => (
                      <button key={sound.id} type="button" className={`toggle-btn ${soundTheme === sound.id ? 'active' : ''}`} onClick={() => setSoundTheme(sound.id)}>{sound.label}</button>
                    ))}
                  </div>
                </div>

                <div className="setting-row">
                  <label>Preview Sound</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button type="button" className="test-sound-btn" onClick={() => handleTestSound('move')}><Volume2 size={14} aria-hidden="true" /> Move</button>
                    <button type="button" className="test-sound-btn" onClick={() => handleTestSound('capture')}>Capture</button>
                    <button type="button" className="test-sound-btn" onClick={() => handleTestSound('check')}>Check</button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="setting-row">
              <label htmlFor="autoplay-speed-select">Auto-Play Speed</label>
              <select id="autoplay-speed-select" className="setting-select" value={autoPlaySpeed} onChange={(event) => setAutoPlaySpeed(Number(event.target.value))}>
                {speeds.map((speed) => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="figurine-toggle">Figurine Piece Symbols (♘f3)</label>
              <label className="switch">
                <input id="figurine-toggle" type="checkbox" checked={figurineNotation} onChange={(event) => setFigurineNotation(event.target.checked)} />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
