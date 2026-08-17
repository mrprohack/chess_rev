import React from 'react';
import { History, Play, SearchCheck, Settings } from 'lucide-react';

export default function Sidebar({ activeView = 'review', onChangeView, onOpenSettings }) {
  return (
    <nav className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand" title="Chess Game Review">
        <span className="sidebar-brand-mark">♟</span>
        <span className="sidebar-brand-name">Game Review</span>
      </div>

      <div className="sidebar-nav-list">
        <button
          type="button"
          className={`sidebar-btn ${activeView === 'review' ? 'active' : ''}`}
          onClick={() => onChangeView?.('review')}
          aria-current={activeView === 'review' ? 'page' : undefined}
          title="Review"
        >
          <SearchCheck size={20} aria-hidden="true" />
          <span>Review</span>
        </button>
        <button
          type="button"
          className={`sidebar-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => onChangeView?.('history')}
          aria-current={activeView === 'history' ? 'page' : undefined}
          title="History"
        >
          <History size={20} aria-hidden="true" />
          <span>History</span>
        </button>
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
