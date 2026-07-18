import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; }

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <textarea className={`textarea ${error ? 'error' : ''} ${className}`} {...props} />
    {error && <span className="form-error">{error}</span>}
  </div>
);
