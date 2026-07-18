import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    {icon ? (
      <div className="input-icon-wrapper">
        <span className="input-icon">{icon}</span>
        <input className={`input ${error ? 'error' : ''} ${className}`} {...props} />
      </div>
    ) : (
      <input className={`input ${error ? 'error' : ''} ${className}`} {...props} />
    )}
    {error && <span className="form-error">{error}</span>}
  </div>
);
