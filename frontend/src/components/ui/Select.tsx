import React from 'react';

interface SelectOption { value: string; label: string; }
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: SelectOption[]; error?: string; }

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <select className={`select ${error ? 'error' : ''} ${className}`} {...props}>
      <option value="">Select...</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <span className="form-error">{error}</span>}
  </div>
);
