import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Calendar, Users, CheckCircle } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.get(`/appointments?date=${today}&doctorId=${user?.user_id}`).then(r => setAppointments(r.data.data.appointments || [])).catch(() => {});
  }, [user]);

  const inConsultation = appointments.filter(a => a.status === 'InConsultation').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;

  return (
    <div>
      <div className="page-header"><h1><Stethoscope size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Doctor Dashboard</h1></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon primary"><Calendar size={24} /></div><div><div className="stat-value">{appointments.length}</div><div className="stat-label">Today's Appointments</div></div></div>
        <div className="stat-card"><div className="stat-icon warning"><Users size={24} /></div><div><div className="stat-value">{inConsultation}</div><div className="stat-label">In Consultation</div></div></div>
        <div className="stat-card"><div className="stat-icon success"><CheckCircle size={24} /></div><div><div className="stat-value">{completed}</div><div className="stat-label">Completed Today</div></div></div>
      </div>
      <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-md)' }}>My Appointments Today</h2>
      <Table columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'medical_record_number', label: 'MRN' },
        { key: 'appointment_date', label: 'Time', render: (v) => formatDateTime(v) },
        { key: 'symptoms_brief', label: 'Symptoms' },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
      ]} data={appointments} onRowClick={(row) => { if (row.status === 'InConsultation' || row.status === 'CheckedIn') navigate(`/doctor/consultation/${row.appointment_id}`); }} />
    </div>
  );
};
export default DoctorDashboard;
