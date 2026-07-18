import React from 'react';

interface CardProps { title?: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties; }

export const Card: React.FC<CardProps> = ({ title, subtitle, icon, children, className = '', onClick, style }) => (
  <div className={`card ${className}`} onClick={onClick} style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}>
    {(title || icon) && (
      <div className="card-header">
        {icon && <div className="card-icon">{icon}</div>}
        <div>
          {title && <div className="card-title">{title}</div>}
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
    )}
    {children}
  </div>
);
