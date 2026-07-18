import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from '../shared/RoleBadge';
import { LogOut, Menu } from 'lucide-react';
import { getInitials } from '../../utils/formatters';

export const Header: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  
  return (
    <header className="header" style={{ height: 'var(--header-height)' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={onMenuToggle}
          style={{ 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '1px solid var(--border-primary)', 
            borderRadius: '8px', 
            padding: '6px',
            background: 'var(--bg-primary)'
          }}
        >
          <Menu size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
          Manasa HMS
        </span>
      </div>
      
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="header-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-info))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#ffffff' }}>
            {getInitials(user?.first_name || '', user?.last_name || '')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ display: 'flex' }}>
              <RoleBadge role={user?.role || ''} />
            </div>
          </div>
        </div>
        
        <button 
          className="btn" 
          onClick={logout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--accent-danger)', 
            background: 'rgba(244,63,94,0.06)',
            border: '1px solid rgba(244,63,94,0.18)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.12)';
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.06)';
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)';
          }}
          title="Logout"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
