import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

const VitalsCapture: React.FC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [form, setForm] = useState({ systolicBp: '', diastolicBp: '', pulseRate: '', temperatureCelsius: '', weightKg: '', heightCm: '', spo2: '', chiefComplaint: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (appointmentId) api.get(`/appointments/${appointmentId}`).then(r => { setAppointment(r.data.data); setForm(f => ({ ...f, chiefComplaint: r.data.data.symptoms_brief || '' })); }).catch(() => {});
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const data: any = { patientId: appointment.patient_id, chiefComplaint: form.chiefComplaint };
      if (appointmentId) data.appointmentId = appointmentId;
      if (form.systolicBp) data.systolicBp = Number(form.systolicBp);
      if (form.diastolicBp) data.diastolicBp = Number(form.diastolicBp);
      if (form.pulseRate) data.pulseRate = Number(form.pulseRate);
      if (form.temperatureCelsius) data.temperatureCelsius = Number(form.temperatureCelsius);
      if (form.weightKg) data.weightKg = Number(form.weightKg);
      if (form.heightCm) data.heightCm = Number(form.heightCm);
      if (form.spo2) data.spo2 = Number(form.spo2);
      await api.post('/emr/encounters', data);
      if (appointmentId) await api.patch(`/appointments/${appointmentId}/status`, { status: 'InConsultation' });
      setSuccess(true);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [f]: e.target.value });

  if (success) return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
      <CheckCircle size={64} color="var(--accent-success)" style={{ marginBottom: 'var(--space-md)' }} />
      <h2>Vitals Recorded</h2><p style={{ color: 'var(--text-secondary)' }}>Patient moved to In Consultation.</p>
      <Button variant="primary" onClick={() => navigate('/nurse/triage')} style={{ marginTop: 'var(--space-lg)' }}>Back to Triage Queue</Button>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h1><Heart size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Vitals Capture</h1></div>
      {appointment && <div className="alert alert-info">Patient: <strong>{appointment.patient_name}</strong> ({appointment.medical_record_number})</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-section-title">Vital Signs</div>
        <div className="form-row">
          <Input label="Systolic BP (mmHg)" type="number" value={form.systolicBp} onChange={set('systolicBp')} />
          <Input label="Diastolic BP (mmHg)" type="number" value={form.diastolicBp} onChange={set('diastolicBp')} />
          <Input label="Pulse Rate (bpm)" type="number" value={form.pulseRate} onChange={set('pulseRate')} />
        </div>
        <div className="form-row" style={{ marginTop: 'var(--space-md)' }}>
          <Input label="Temperature (°C)" type="number" step="0.1" value={form.temperatureCelsius} onChange={set('temperatureCelsius')} />
          <Input label="Weight (kg)" type="number" step="0.1" value={form.weightKg} onChange={set('weightKg')} />
          <Input label="Height (cm)" type="number" step="0.1" value={form.heightCm} onChange={set('heightCm')} />
          <Input label="SpO2 (%)" type="number" value={form.spo2} onChange={set('spo2')} />
        </div>
        <Textarea label="Chief Complaint *" value={form.chiefComplaint} onChange={set('chiefComplaint')} required style={{ marginTop: 'var(--space-md)' }} />
        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="primary" loading={loading}>Save Vitals & Move to Consultation</Button>
        </div>
      </form>
    </div>
  );
};
export default VitalsCapture;
