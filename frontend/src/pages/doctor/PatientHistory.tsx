import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import { Card } from '../../components/ui/Card';
import { VitalsCard } from '../../components/shared/VitalsCard';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const PatientHistory: React.FC = () => {
  const [encounters, setEncounters] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSelect = async (p: any) => {
    setPatient(p);
    try { const res = await api.get(`/emr/patients/${p.patient_id}/encounters`); setEncounters(res.data.data || []); } catch { setEncounters([]); }
  };

  return (
    <div>
      <div className="page-header"><h1><ClipboardList size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Patient History</h1></div>
      <div style={{ marginBottom: 'var(--space-lg)' }}><PatientSearchBar onSelect={handleSelect} /></div>
      {patient && <div className="alert alert-info">Showing history for: <strong>{patient.first_name} {patient.last_name}</strong> ({patient.medical_record_number})</div>}
      {encounters.length === 0 && patient && <div className="card"><div className="empty-state"><p>No encounter records found.</p></div></div>}
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        {encounters.map(enc => (
          <Card key={enc.encounter_id} onClick={() => setExpanded(expanded === enc.encounter_id ? null : enc.encounter_id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{formatDateTime(enc.encounter_timestamp)}</strong> — {enc.provider_name} <Badge variant="info">{enc.status}</Badge></div>
              <span style={{ color: 'var(--text-muted)' }}>{expanded === enc.encounter_id ? '▲' : '▼'}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 4 }}>Chief: {enc.chief_complaint}</p>
            {expanded === enc.encounter_id && (
              <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>Vitals</h4>
                <VitalsCard vitals={enc} />
                {enc.soap_subjective && <div style={{ marginTop: 'var(--space-md)' }}><h4>SOAP Notes</h4><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}><strong>S:</strong> {enc.soap_subjective}</p><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}><strong>O:</strong> {enc.soap_objective}</p><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}><strong>A:</strong> {enc.soap_assessment}</p><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}><strong>P:</strong> {enc.soap_plan}</p></div>}
                {enc.diagnoses?.length > 0 && <div style={{ marginTop: 'var(--space-md)' }}><h4>Diagnoses</h4>{enc.diagnoses.map((d: any) => <div key={d.diagnosis_id} className="badge badge-info" style={{ marginRight: 4, marginBottom: 4 }}>{d.icd_code}: {d.description}</div>)}</div>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
export default PatientHistory;
