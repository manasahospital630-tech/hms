import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple' | 'primary';
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, style, onClick, className }) => (
  <span className={`badge badge-${variant} ${className || ''}`} style={style} onClick={onClick}>
    {children}
  </span>
);
