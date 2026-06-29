import React from 'react';
import { 
  Users, 
  Mail,
  Bell,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      
      {/* Empty space to push footer icons to the bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Footer Icons */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0' }}>
        <Users size={16} color="var(--text-secondary)" />
        <Mail size={16} color="var(--text-secondary)" />
        <Bell size={16} color="var(--text-secondary)" />
        <Settings size={16} color="var(--text-secondary)" />
      </div>
    </div>
  );
}
