import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading, fullWidth, icon, children, className = '', disabled, ...props }) => {
  const classes = `btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${fullWidth ? 'btn-full' : ''} ${loading ? 'loading' : ''} ${className}`.trim();
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className="loading-spinner" /> : icon}
      {children}
    </button>
  );
};
