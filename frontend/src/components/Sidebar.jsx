import React from 'react';
import { 
  Users, 
  Mail,
  Bell,
  Settings
} from 'lucide-react';

export default function Sidebar({ onOpenSettings }) {
  return (
    <div className="sidebar">
      
      {/* Empty space to push footer icons to the bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Footer Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '15px' }}>
        <Users size={20} color="var(--text-60)" aria-hidden="true" />
        <Mail size={20} color="var(--text-60)" aria-hidden="true" />
        <Bell size={20} color="var(--text-60)" aria-hidden="true" />
        <button onClick={onOpenSettings} title="Settings" aria-label="Settings" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
          <Settings size={20} color="var(--text-60)" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
