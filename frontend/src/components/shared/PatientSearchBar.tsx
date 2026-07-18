import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import api from '../../api/client';

interface Patient { patient_id: string; first_name: string; last_name: string; medical_record_number: string; }

export const PatientSearchBar: React.FC<{
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  showRegisterOption?: boolean;
  onRegisterClick?: () => void;
}> = ({ onSelect, placeholder = 'Search patients by name or MRN...', showRegisterOption = false, onRegisterClick }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (search.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(search)}&limit=8`);
        setResults(res.data.data.patients || []);
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="search-container" ref={ref}>
      <div className="input-icon-wrapper">
        <span className="input-icon"><Search size={16} /></span>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} />
      </div>
      {open && (results.length > 0 || (search.length >= 2 && showRegisterOption)) && (
        <div className="search-dropdown">
          {results.map((p) => (
            <div key={p.patient_id} className="search-dropdown-item" onClick={() => { onSelect(p); setSearch(`${p.first_name} ${p.last_name}`); setOpen(false); }}>
              <span>{p.first_name} {p.last_name}</span>
              <span className="mrn">{p.medical_record_number}</span>
            </div>
          ))}
          {showRegisterOption && (
            <div className="search-dropdown-item" style={{ color: 'var(--accent-primary)', fontWeight: 600, borderTop: results.length > 0 ? '1px solid var(--border-primary)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { onRegisterClick?.(); setOpen(false); }}>
              <span>➕ Register New Patient</span>
              {search && <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontStyle: 'italic' }}>"{search}"</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
