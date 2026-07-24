import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const AppointmentBooking: React.FC = () => {
  const [patient, setPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({ doctorId: '', appointmentDate: '', symptomsBrief: '' });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/users?limit=100').then(r => setDoctors((r.data.data.users || []).filter((u: any) => u.role === 'Doctor'))).catch(() => {});
    const today = new Date().toISOString().split('T')[0];
    api.get(`/appointments?date=${today}`).then(r => setAppointments(r.data.data.appointments || [])).catch(() => {});
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/appointments', { patientId: patient.patient_id, ...form });
      setSuccess('Appointment booked!'); setForm({ doctorId: '', appointmentDate: '', symptomsBrief: '' }); setPatient(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><h1><Calendar size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Appointment Booking</h1></div>
      {success && <div className="alert alert-success">{success}</div>}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="form-section-title">Book New Appointment</div>
        <div style={{ marginBottom: 'var(--space-md)' }}><label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Primary Patient Search (Mobile Number / Name / MRN) *</label><PatientSearchBar onSelect={setPatient} placeholder="📱 Primary Search: Enter Mobile Number, Name or MRN..." /></div>
        {patient && <div className="alert alert-info" style={{ fontWeight: 600 }}>Selected: <span style={{ color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', marginRight: '6px' }}>📱 {patient.phone || 'No Mobile'}</span> {patient.first_name} {patient.last_name} ({patient.medical_record_number})</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <Select label="Doctor *" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} options={doctors.map(d => ({ value: d.user_id, label: `Dr. ${d.first_name} ${d.last_name}` }))} />
            <Input label="Date & Time *" type="datetime-local" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} required />
          </div>
          <Textarea label="Symptoms" value={form.symptomsBrief} onChange={(e) => setForm({ ...form, symptomsBrief: e.target.value })} placeholder="Brief description..." style={{ marginTop: 'var(--space-md)' }} />
          <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" loading={loading} disabled={!patient}>Book Appointment</Button>
          </div>
        </form>
      </div>
      <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-md)' }}>Today's Appointments</h2>
      <Table columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'appointment_date', label: 'Time', render: (v) => formatDateTime(v) },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
      ]} data={appointments} />
    </div>
  );
};
export default AppointmentBooking;
