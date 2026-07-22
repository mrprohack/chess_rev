import React from 'react';
import { X } from 'lucide-react';
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
  autoPlaySpeed,
  setAutoPlaySpeed,
  figurineNotation,
  setFigurineNotation
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const speeds = [
    { value: 2000, label: 'Slow (2s)' },
    { value: 1000, label: 'Normal (1s)' },
    { value: 500, label: 'Fast (0.5s)' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div className="modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close Settings">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Section: Appearance */}
          <div className="settings-section">
            <h3 className="section-title">Appearance & Analysis</h3>
            
            <div className="setting-row" role="group" aria-labelledby="theme-label">
              <label id="theme-label">App Theme</label>
              <div className="toggle-group">
                <button 
                  type="button"
                  className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
                <button 
                  type="button"
                  className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  Normal
                </button>
                <button 
                  type="button"
                  className={`toggle-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  System
                </button>
              </div>
            </div>

            <div className="setting-row" style={{ marginTop: '16px' }}>
              <label htmlFor="engine-depth-input">Engine Depth ({engineDepth})</label>
              <div className="slider-group">
                <input 
                  id="engine-depth-input"
                  name="engine-depth"
                  type="range" 
                  min="5" 
                  max="20" 
                  value={engineDepth} 
                  onChange={(e) => setEngineDepth(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div className="setting-hint">
                  Higher depth = more accurate analysis (5 to 20 plies).
                </div>
              </div>
            </div>
          </div>

          {/* Section: Board Customization */}
          <div className="settings-section">
            <h3 className="section-title">Board Customization</h3>
            
            <div className="setting-row">
              <label>Board Colors</label>
              <div className="theme-options">
                {boardThemes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`board-theme-btn ${boardTheme === t.id ? 'active' : ''}`}
                    onClick={() => setBoardTheme(t.id)}
                    title={t.label}
                  >
                    <span className="swatch" style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }} />
                    <span className="swatch-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row" style={{ marginTop: '14px' }}>
              <label htmlFor="show-arrows-toggle">Move Analysis Arrows</label>
              <label className="switch">
                <input 
                  id="show-arrows-toggle"
                  type="checkbox" 
                  checked={showArrows} 
                  onChange={e => setShowArrows(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-row" style={{ marginTop: '14px' }}>
              <label htmlFor="show-coords-toggle">Board Coordinates (1-8, a-h)</label>
              <label className="switch">
                <input 
                  id="show-coords-toggle"
                  type="checkbox" 
                  checked={showCoordinates} 
                  onChange={e => setShowCoordinates(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          {/* Section: Audio & Playback */}
          <div className="settings-section">
            <h3 className="section-title">Audio & Navigation</h3>
            
            <div className="setting-row">
              <label htmlFor="sound-toggle">Move Sound Effects</label>
              <label className="switch">
                <input 
                  id="sound-toggle"
                  type="checkbox" 
                  checked={soundEnabled} 
                  onChange={e => setSoundEnabled(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-row" style={{ marginTop: '14px' }}>
              <label htmlFor="autoplay-speed-select">Auto-Play Speed</label>
              <select
                id="autoplay-speed-select"
                className="setting-select"
                value={autoPlaySpeed}
                onChange={e => setAutoPlaySpeed(Number(e.target.value))}
              >
                {speeds.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="setting-row" style={{ marginTop: '14px' }}>
              <label htmlFor="figurine-toggle">Figurine Piece Symbols (♘f3)</label>
              <label className="switch">
                <input 
                  id="figurine-toggle"
                  type="checkbox" 
                  checked={figurineNotation} 
                  onChange={e => setFigurineNotation(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

