import React from 'react';
import { Settings } from 'lucide-react';

export default function Sidebar({ onOpenSettings }) {
  return (
    <nav className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-brand" title="Chess Game Review">
        <span className="sidebar-brand-mark">♟</span>
        <span className="sidebar-brand-name">Game Review</span>
      </div>

      <div className="sidebar-nav-list">
        <button type="button" className="sidebar-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
          <Settings size={20} aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
