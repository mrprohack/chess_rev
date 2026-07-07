import React from 'react';
import { X } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  engineDepth,
  setEngineDepth
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close Settings">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="setting-row" role="group" aria-labelledby="theme-label">
            <label id="theme-label">Theme</label>
            <div className="toggle-group">
              <button 
                className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
              <button 
                className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                Normal
              </button>
              <button 
                className={`toggle-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
              >
                System
              </button>
            </div>
          </div>
          <div className="setting-row" style={{ marginTop: '20px' }}>
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
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                Higher depth = more accurate, but slower analysis.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
