import React, { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const CheckInQueue: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await api.get(`/appointments?date=${today}`);
      setAppointments(res.data.data.appointments || []);
    } catch { }
  };
  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async (id: string) => {
    try { await api.patch(`/appointments/${id}/status`, { status: 'CheckedIn' }); fetchData(); } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div>
      <div className="page-header"><h1><ClipboardList size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Check-in Queue</h1>
        <Button variant="secondary" onClick={fetchData}>Refresh</Button></div>
      <div className="tabs">
        {['all', 'Scheduled', 'CheckedIn', 'InConsultation', 'Completed'].map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
        ))}
      </div>
      <Table columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'medical_record_number', label: 'MRN' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'appointment_date', label: 'Time', render: (v) => formatDateTime(v) },
        { key: 'symptoms_brief', label: 'Symptoms' },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
        { key: 'actions', label: 'Actions', render: (_, row) => row.status === 'Scheduled' ? <Button size="sm" variant="success" onClick={() => handleCheckIn(row.appointment_id)}>Check In</Button> : null },
      ]} data={filtered} />
    </div>
  );
};
export default CheckInQueue;
