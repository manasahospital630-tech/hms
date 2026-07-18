import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    api.get('/appointments?limit=50').then(r => setAppointments(r.data.data.appointments || r.data.data || [])).catch(() => {});
  }, [user]);

  return (
    <div>
      <div className="page-header"><h1><Calendar size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />My Appointments</h1></div>
      <Table columns={[
        { key: 'doctor_name', label: 'Doctor', render: (v) => `Dr. ${v || 'N/A'}` },
        { key: 'appointment_date', label: 'Date & Time', render: (v) => formatDateTime(v) },
        { key: 'symptoms_brief', label: 'Reason' },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
      ]} data={appointments} emptyMessage="No appointments found." />
    </div>
  );
};
export default MyAppointments;
