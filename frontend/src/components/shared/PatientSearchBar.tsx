import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, User, Hash } from 'lucide-react';
import api from '../../api/client';

export interface Patient { 
  patient_id: string; 
  first_name: string; 
  last_name: string; 
  medical_record_number: string;
  phone?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
}

export const PatientSearchBar: React.FC<{
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  showRegisterOption?: boolean;
  onRegisterClick?: () => void;
  value?: string;
}> = ({ 
  onSelect, 
  placeholder = '📱 Primary Search: Mobile Number, Name, MRN...', 
  showRegisterOption = false, 
  onRegisterClick,
  value
}) => {
  const [search, setSearch] = useState(value || '');
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== undefined) {
      setSearch(value);
    }
  }, [value]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 1) { setResults([]); setOpen(false); return; }
    
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(trimmed)}&limit=10`);
        setResults(res.data.data.patients || []);
        setOpen(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="search-container" ref={ref} style={{ position: 'relative', width: '100%', zIndex: 100 }}>
      <div className="input-icon-wrapper">
        <span className="input-icon"><Search size={16} /></span>
        <input 
          className="input" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder={placeholder} 
          style={{ paddingLeft: '36px' }}
        />
      </div>
      {open && (results.length > 0 || (search.trim().length >= 1 && showRegisterOption)) && (
        <div className="search-dropdown" style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          zIndex: 99999, 
          background: 'var(--bg-card, #ffffff)', 
          border: '1px solid var(--border-primary, #cbd5e1)', 
          borderRadius: '8px', 
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          maxHeight: '320px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {results.map((p) => (
            <div 
              key={p.patient_id} 
              className="search-dropdown-item" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 14px', 
                borderBottom: '1px solid var(--border-primary, #f1f5f9)', 
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onClick={() => { 
                onSelect(p); 
                setSearch(p.phone ? `${p.phone} — ${p.first_name} ${p.last_name}` : `${p.first_name} ${p.last_name}`); 
                setOpen(false); 
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.phone ? (
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '12px', 
                      color: '#1d4ed8', 
                      background: '#dbeafe', 
                      border: '1px solid #93c5fd', 
                      padding: '2px 8px', 
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📱 {p.phone}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No Mobile</span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
                    {p.first_name} {p.last_name}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', marginLeft: '2px' }}>
                  {p.gender ? `${p.gender}` : ''} {p.age ? `• ${p.age} Yrs` : ''} {p.date_of_birth ? `• DOB: ${p.date_of_birth.substring(0, 10)}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="mrn" style={{ fontWeight: 600, fontSize: '11px', color: '#334155', background: 'var(--bg-tertiary, #f1f5f9)', padding: '3px 8px', borderRadius: '4px' }}>
                  🆔 {p.medical_record_number}
                </span>
              </div>
            </div>
          ))}
          {showRegisterOption && (
            <div 
              className="search-dropdown-item" 
              style={{ 
                color: 'var(--accent-primary, #2563eb)', 
                fontWeight: 600, 
                borderTop: results.length > 0 ? '1px solid var(--border-primary, #e2e8f0)' : 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 14px',
                cursor: 'pointer',
                background: '#f8fafc'
              }} 
              onClick={() => { onRegisterClick?.(); setOpen(false); }}
            >
              <span>➕ Register New Patient</span>
              {search && <span style={{ color: 'var(--text-tertiary, #94a3b8)', fontSize: '11px', fontStyle: 'italic' }}>"{search}"</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
