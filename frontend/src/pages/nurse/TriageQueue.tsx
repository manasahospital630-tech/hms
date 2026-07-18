import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const TriageQueue: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get(`/appointments?date=${today}&status=CheckedIn`).then(r => setAppointments(r.data.data.appointments || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header"><h1><Activity size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Triage Queue</h1></div>
      {appointments.length === 0 ? <div className="card"><div className="empty-state"><Activity size={48} /><p>No patients waiting for triage.</p></div></div> : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {appointments.map(a => (
            <Card key={a.appointment_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div><h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>{a.patient_name}</h3><p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{a.medical_record_number} • Dr. {a.doctor_name} • {formatDateTime(a.appointment_date)}</p>
                  {a.symptoms_brief && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginTop: 4 }}>Symptoms: {a.symptoms_brief}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <StatusBadge status={a.status} />
                  <Button variant="primary" size="sm" onClick={() => navigate(`/nurse/vitals/${a.appointment_id}`)}>Start Triage</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default TriageQueue;
