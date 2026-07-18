import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const DispenseWorkstation: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dispensing, setDispensing] = useState<string | null>(null);

  const fetchData = () => { api.get('/pharmacy/prescriptions/pending').then(r => setPrescriptions(r.data.data || [])).catch(() => {}); };
  useEffect(fetchData, []);

  const handleDispense = async (id: string) => {
    setDispensing(id);
    try { await api.patch(`/pharmacy/prescriptions/${id}/dispense`); fetchData(); } catch (err: any) { alert(err.response?.data?.error || 'Dispense failed'); }
    finally { setDispensing(null); }
  };

  return (
    <div>
      <div className="page-header"><h1><Pill size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Dispense Workstation</h1><Button variant="secondary" onClick={fetchData}>Refresh</Button></div>
      {prescriptions.length === 0 ? <div className="card"><div className="empty-state"><CheckCircle size={48} /><p>No pending prescriptions.</p></div></div> : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {prescriptions.map(rx => (
            <Card key={rx.prescription_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>{rx.patient_name} <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>({rx.medical_record_number})</span></h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Dr. {rx.doctor_name} • {formatDateTime(rx.issued_at)}</p>
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    {rx.items?.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: '6px 0', borderBottom: '1px solid var(--border-primary)', fontSize: 'var(--font-sm)' }}>
                        <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.dosage_instruction}</span>
                        <Badge variant={item.stock_quantity >= item.quantity_prescribed ? 'success' : 'danger'}>Qty: {item.quantity_prescribed}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="success" loading={dispensing === rx.prescription_id} onClick={() => handleDispense(rx.prescription_id)}>Dispense</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default DispenseWorkstation;
