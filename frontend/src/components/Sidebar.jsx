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
        <Users size={20} color="var(--text-60)" />
        <Mail size={20} color="var(--text-60)" />
        <Bell size={20} color="var(--text-60)" />
        <div onClick={onOpenSettings} title="Settings">
          <Settings size={20} color="var(--text-60)" />
        </div>
      </div>
    </div>
  );
}
