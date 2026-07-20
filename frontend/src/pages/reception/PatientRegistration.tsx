import React, { useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

const PatientRegistration: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', age: '', gender: 'Male', bloodGroup: '', phone: '', email: '', address: '', emergencyContactName: '', emergencyContactPhone: '', insuranceProvider: '', insurancePolicyNumber: '', allergies: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ mrn: string } | null>(null);
  const [error, setError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/patients', form);
      setSuccess({ mrn: res.data.data.medical_record_number });
      setForm({ firstName: '', lastName: '', age: '', gender: 'Male', bloodGroup: '', phone: '', email: '', address: '', emergencyContactName: '', emergencyContactPhone: '', insuranceProvider: '', insurancePolicyNumber: '', allergies: '' });
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to register patient.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><div><h1><UserPlus size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Patient Registration</h1><p>Register a new patient in the system</p></div></div>
      {success && <div className="alert alert-success"><CheckCircle size={18} /> Patient registered! MRN: <strong>{success.mrn}</strong></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-section"><div className="form-section-title">Personal Information</div>
          <div className="form-row">
            <Input label="First Name *" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Last Name *" value={form.lastName} onChange={set('lastName')} required />
            <Input label="Age (Years) *" type="number" min="0" max="120" placeholder="e.g. 35" value={form.age} onChange={set('age')} required />
          </div>
          <div className="form-row" style={{ marginTop: 'var(--space-md)' }}>
            <Select label="Gender *" value={form.gender} onChange={set('gender')} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
            <Select label="Blood Group" value={form.bloodGroup} onChange={set('bloodGroup')} options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))} />
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Contact</div>
          <div className="form-row"><Input label="Phone" value={form.phone} onChange={set('phone')} /><Input label="Email" type="email" value={form.email} onChange={set('email')} /></div>
          <Textarea label="Address" value={form.address} onChange={set('address')} style={{ marginTop: 'var(--space-md)' }} />
        </div>
        <div className="form-section"><div className="form-section-title">Emergency Contact</div>
          <div className="form-row"><Input label="Contact Name" value={form.emergencyContactName} onChange={set('emergencyContactName')} /><Input label="Contact Phone" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></div>
        </div>
        <div className="form-section"><div className="form-section-title">Insurance</div>
          <div className="form-row"><Input label="Provider" value={form.insuranceProvider} onChange={set('insuranceProvider')} /><Input label="Policy Number" value={form.insurancePolicyNumber} onChange={set('insurancePolicyNumber')} /></div>
        </div>
        <div className="form-section"><div className="form-section-title">Medical</div>
          <Textarea label="Known Allergies" value={form.allergies} onChange={set('allergies')} placeholder="List any known allergies..." />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          <Button type="submit" variant="primary" loading={loading} icon={<UserPlus size={16} />}>Register Patient</Button>
        </div>
      </form>
    </div>
  );
};
export default PatientRegistration;
