import React from 'react';
import { Play, Settings } from 'lucide-react';

export default function Sidebar({ onOpenSettings }) {
  return (
    <nav className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand" title="Chess Game Review">
        <span className="sidebar-brand-mark">♟</span>
        <span className="sidebar-brand-name">Game Review</span>
      </div>

      <div className="sidebar-nav-list">
        <a
          className="sidebar-btn sidebar-link"
          href="https://www.chess.com/play/online"
          target="_blank"
          rel="noreferrer"
          title="Play Chess.com"
          aria-label="Play chess on Chess.com"
        >
          <Play size={19} aria-hidden="true" />
          <span>Play</span>
        </a>
        <button type="button" className="sidebar-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
          <Settings size={20} aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
