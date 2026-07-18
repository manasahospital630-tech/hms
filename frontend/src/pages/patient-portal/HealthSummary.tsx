import React, { useState, useEffect } from 'react';
import { Heart, Calendar, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { VitalsCard } from '../../components/shared/VitalsCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const HealthSummary: React.FC = () => {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    // Patient portal: fetch data for the logged-in patient
    // In a real app, we'd need a patient lookup by user_id
    api.get('/appointments?limit=10').then(r => setAppointments(r.data.data.appointments || r.data.data || [])).catch(() => {});
  }, [user]);

  return (
    <div>
      <div className="page-header"><h1><Heart size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Health Summary</h1><p>Welcome, {user?.first_name}</p></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon primary"><Calendar size={24} /></div><div><div className="stat-value">{appointments.length}</div><div className="stat-label">Appointments</div></div></div>
        <div className="stat-card"><div className="stat-icon success"><Heart size={24} /></div><div><div className="stat-value">{encounters.length}</div><div className="stat-label">Encounters</div></div></div>
      </div>

      <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-md)' }}>Upcoming Appointments</h2>
      <div style={{ display: 'grid', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {appointments.length === 0 ? <Card><div className="empty-state"><p>No upcoming appointments.</p></div></Card> :
          appointments.slice(0, 5).map(a => (
            <Card key={a.appointment_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>Dr. {a.doctor_name}</strong><p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{formatDateTime(a.appointment_date)}</p></div>
                <StatusBadge status={a.status} />
              </div>
            </Card>
          ))}
      </div>

      {encounters.length > 0 && <>
        <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-md)' }}>Recent Encounters</h2>
        {encounters.slice(0, 3).map(enc => (
          <Card key={enc.encounter_id} style={{ marginBottom: 'var(--space-md)' }}>
            <p style={{ fontWeight: 600 }}>{formatDateTime(enc.encounter_timestamp)} — {enc.provider_name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{enc.chief_complaint}</p>
            <VitalsCard vitals={enc} />
          </Card>
        ))}
      </>}
    </div>
  );
};
export default HealthSummary;
