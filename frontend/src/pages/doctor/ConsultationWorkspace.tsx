import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Plus, CheckCircle } from 'lucide-react';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VitalsCard } from '../../components/shared/VitalsCard';
import api from '../../api/client';

const ConsultationWorkspace: React.FC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [soap, setSoap] = useState({ soapSubjective: '', soapObjective: '', soapAssessment: '', soapPlan: '' });
  const [diagnoses, setDiagnoses] = useState<{ icdCode: string; description: string; isPrimary: boolean }[]>([]);
  const [diagForm, setDiagForm] = useState({ icdCode: '', description: '' });
  const [rxItems, setRxItems] = useState<{ itemId: string; itemName: string; dosageInstruction: string; quantityPrescribed: number }[]>([]);
  const [rxForm, setRxForm] = useState({ itemId: '', itemName: '', dosageInstruction: '', quantityPrescribed: 1 });
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      api.get(`/appointments/${appointmentId}`).then(r => { setAppointment(r.data.data); return r.data.data.patient_id; })
        .then(pid => api.get(`/emr/patients/${pid}/encounters`)).then(r => setEncounters(r.data.data || [])).catch(() => {});
    }
    api.get('/pharmacy/inventory?limit=200').then(r => setInventory(r.data.data.items || [])).catch(() => {});
  }, [appointmentId]);

  const currentEncounter = encounters[0]; // most recent

  const handleSave = async () => {
    setLoading(true);
    try {
      if (currentEncounter) {
        await api.patch(`/emr/encounters/${currentEncounter.encounter_id}/soap`, soap);
        for (const d of diagnoses) await api.post(`/emr/encounters/${currentEncounter.encounter_id}/diagnoses`, d);
        if (rxItems.length > 0) await api.post('/pharmacy/prescriptions', { encounterId: currentEncounter.encounter_id, patientId: appointment.patient_id, items: rxItems.map(i => ({ itemId: i.itemId, dosageInstruction: i.dosageInstruction, quantityPrescribed: i.quantityPrescribed })) });
      }
      await api.patch(`/appointments/${appointmentId}/status`, { status: 'Completed' });
      setSaved(true);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  if (saved) return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
      <CheckCircle size={64} color="var(--accent-success)" /><h2 style={{ margin: 'var(--space-md) 0' }}>Consultation Complete</h2>
      <Button variant="primary" onClick={() => navigate('/doctor/dashboard')}>Back to Dashboard</Button>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h1><Stethoscope size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Consultation</h1></div>
      {appointment && <div className="alert alert-info">Patient: <strong>{appointment.patient_name}</strong> • MRN: {appointment.medical_record_number}</div>}
      {currentEncounter && <Card title="Current Vitals" style={{ marginBottom: 'var(--space-lg)' }}><VitalsCard vitals={currentEncounter} /></Card>}

      <Card title="SOAP Notes" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          <Textarea label="Subjective" value={soap.soapSubjective} onChange={e => setSoap({ ...soap, soapSubjective: e.target.value })} placeholder="Patient's complaints..." />
          <Textarea label="Objective" value={soap.soapObjective} onChange={e => setSoap({ ...soap, soapObjective: e.target.value })} placeholder="Clinical findings..." />
          <Textarea label="Assessment" value={soap.soapAssessment} onChange={e => setSoap({ ...soap, soapAssessment: e.target.value })} placeholder="Diagnosis assessment..." />
          <Textarea label="Plan" value={soap.soapPlan} onChange={e => setSoap({ ...soap, soapPlan: e.target.value })} placeholder="Treatment plan..." />
        </div>
      </Card>

      <Card title="Diagnoses" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="form-row" style={{ marginBottom: 'var(--space-md)' }}>
          <Input label="ICD Code" value={diagForm.icdCode} onChange={e => setDiagForm({ ...diagForm, icdCode: e.target.value })} placeholder="e.g. J06.9" />
          <Input label="Description" value={diagForm.description} onChange={e => setDiagForm({ ...diagForm, description: e.target.value })} placeholder="Acute upper respiratory infection" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => { if (diagForm.icdCode && diagForm.description) { setDiagnoses([...diagnoses, { ...diagForm, isPrimary: diagnoses.length === 0 }]); setDiagForm({ icdCode: '', description: '' }); } }}>Add</Button>
          </div>
        </div>
        {diagnoses.map((d, i) => <div key={i} className="alert alert-info" style={{ marginBottom: 4 }}>{d.isPrimary && '⭐ '}{d.icdCode} — {d.description}</div>)}
      </Card>

      <Card title="Prescription" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="form-row" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="form-group"><label>Medicine</label>
            <select className="select" value={rxForm.itemId} onChange={e => { const item = inventory.find(i => i.item_id === e.target.value); setRxForm({ ...rxForm, itemId: e.target.value, itemName: item?.item_name || '' }); }}>
              <option value="">Select medicine...</option>
              {inventory.map(i => <option key={i.item_id} value={i.item_id}>{i.item_name} (Stock: {i.stock_quantity})</option>)}
            </select>
          </div>
          <Input label="Dosage" value={rxForm.dosageInstruction} onChange={e => setRxForm({ ...rxForm, dosageInstruction: e.target.value })} placeholder="e.g. 1 tab TID x 5 days" />
          <Input label="Qty" type="number" value={String(rxForm.quantityPrescribed)} onChange={e => setRxForm({ ...rxForm, quantityPrescribed: Number(e.target.value) })} />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => { if (rxForm.itemId && rxForm.dosageInstruction) { setRxItems([...rxItems, { ...rxForm }]); setRxForm({ itemId: '', itemName: '', dosageInstruction: '', quantityPrescribed: 1 }); } }}>Add</Button>
          </div>
        </div>
        {rxItems.map((r, i) => <div key={i} className="alert alert-info" style={{ marginBottom: 4 }}>{r.itemName} — {r.dosageInstruction} (x{r.quantityPrescribed})</div>)}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
        <Button variant="secondary" onClick={() => navigate('/doctor/dashboard')}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={handleSave}>Complete Consultation</Button>
      </div>
    </div>
  );
};
export default ConsultationWorkspace;
