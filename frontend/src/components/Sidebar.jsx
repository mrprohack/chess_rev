import React from 'react';
import { 
  Users, 
  Mail,
  Bell,
  Settings
} from 'lucide-react';

export default function Sidebar({ onOpenSettings }) {
  return (
    <nav className="sidebar" aria-label="Main Navigation">
      {/* Brand logo icon at top */}
      <div className="sidebar-brand" title="Chess Game Review">
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green)' }}>♟</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Navigation Buttons */}
      <div className="sidebar-nav-list">
        <button type="button" className="sidebar-btn" title="Community" aria-label="Community">
          <Users size={20} aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-btn" title="Messages" aria-label="Messages">
          <Mail size={20} aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-btn" title="Notifications" aria-label="Notifications">
          <Bell size={20} aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
          <Settings size={20} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
