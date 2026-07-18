import React, { useState, useEffect } from 'react';
import { Settings, Plus, RefreshCw, X, AlertTriangle, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const EquipmentAndQC: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const [qcLogs, setQcLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'machines' | 'qc'>('machines');

  // Machine Modal State
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [machineForm, setMachineForm] = useState({
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    calibrationDate: new Date().toISOString().split('T')[0],
    maintenanceDate: new Date().toISOString().split('T')[0],
    department: 'Laboratory',
    status: 'Active'
  });

  // QC Log Modal State
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcForm, setQcForm] = useState({
    machineId: '',
    qcParameter: 'Hemoglobin Control',
    expectedValue: '12.5 - 13.5 g/dL',
    actualValue: '',
    status: 'Pass' as 'Pass' | 'Fail'
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [machsRes, qcRes] = await Promise.all([
        api.get('/diagnostics/machines'),
        api.get('/diagnostics/qc')
      ]);

      if (machsRes.data.success) {
        setMachines(machsRes.data.data);
        if (machsRes.data.data.length > 0) {
          setQcForm(prev => ({ ...prev, machineId: machsRes.data.data[0].machine_id }));
        }
      }
      if (qcRes.data.success) setQcLogs(qcRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      await api.post('/diagnostics/machines', machineForm);
      setMachineModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save diagnostic machine configuration.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleQcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      await api.post('/diagnostics/qc', qcForm);
      setQcModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to submit QC parameter audit.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={28} color="var(--accent-primary)" />
            Analyzer Equipment & Quality Control (QC)
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Track machine calibration schedules, maintenance history, and daily quality control logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadData} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          {activeSubTab === 'machines' ? (
            <Button variant="primary" onClick={() => setMachineModalOpen(true)} icon={<Plus size={14} />}>
              Add Lab Machine
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setQcModalOpen(true)} icon={<ShieldCheck size={14} />}>
              Perform Daily QC
            </Button>
          )}
        </div>
      </div>

      {/* Tab select */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveSubTab('machines')}
          style={{
            padding: '8px 20px',
            background: activeSubTab === 'machines' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'machines' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'machines' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'machines' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Diagnostic Analyzers ({machines.length})
        </button>
        <button
          onClick={() => setActiveSubTab('qc')}
          style={{
            padding: '8px 20px',
            background: activeSubTab === 'qc' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'qc' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'qc' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'qc' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Quality Control Logs ({qcLogs.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading equipment registry...</span>
        </div>
      ) : activeSubTab === 'machines' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {machines.map((m) => (
            <Card key={m.machine_id} title={m.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Manufacturer / Model:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{m.manufacturer} {m.model}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Serial Number:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>{m.serial_number}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Last Calibration:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {m.calibration_date ? new Date(m.calibration_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Next Maintenance:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {m.maintenance_date ? new Date(m.maintenance_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-primary)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dept: {m.department}</span>
                  <span style={{ 
                    fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                    background: m.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                    color: m.status === 'Active' ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>
                    {m.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>QC Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Machine Name</th>
                  <th style={{ padding: '12px 16px' }}>Parameter Analyzed</th>
                  <th style={{ padding: '12px 16px' }}>Expected Range</th>
                  <th style={{ padding: '12px 16px' }}>Actual Result</th>
                  <th style={{ padding: '12px 16px' }}>Audit Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {qcLogs.map((log) => (
                  <tr key={log.qc_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '12px 16px' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.machine_name}</td>
                    <td style={{ padding: '12px 16px' }}>{log.qc_parameter}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{log.expected_value}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.actual_value}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                        background: log.status === 'Pass' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                        color: log.status === 'Pass' ? 'var(--accent-success)' : 'var(--accent-danger)'
                      }}>
                        {log.status === 'Pass' ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {log.first_name ? `${log.first_name} ${log.last_name}` : 'Lab Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Machine Modal */}
      {machineModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setMachineModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Configure Analyzer Machine</h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleMachineSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Machine Analyzer Name *</label>
                  <input type="text" className="input" value={machineForm.name} onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })} required placeholder="e.g. Sysmex Hematology XN" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manufacturer</label>
                    <input type="text" className="input" value={machineForm.manufacturer} onChange={(e) => setMachineForm({ ...machineForm, manufacturer: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Model</label>
                    <input type="text" className="input" value={machineForm.model} onChange={(e) => setMachineForm({ ...machineForm, model: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Serial Number *</label>
                    <input type="text" className="input" value={machineForm.serialNumber} onChange={(e) => setMachineForm({ ...machineForm, serialNumber: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Department</label>
                    <select className="select" value={machineForm.department} onChange={(e) => setMachineForm({ ...machineForm, department: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="Cardiology">Cardiology</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calibration Date</label>
                    <input type="date" className="input" value={machineForm.calibrationDate} onChange={(e) => setMachineForm({ ...machineForm, calibrationDate: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Maintenance Schedule</label>
                    <input type="date" className="input" value={machineForm.maintenanceDate} onChange={(e) => setMachineForm({ ...machineForm, maintenanceDate: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setMachineModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Register Equipment</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Log Modal */}
      {qcModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setQcModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Log Analyzer Quality Control Audit</h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleQcSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select Machine Analyzer *</label>
                  <select className="select" value={qcForm.machineId} onChange={(e) => setQcForm({ ...qcForm, machineId: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {machines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Parameter Analyzed *</label>
                  <input type="text" className="input" value={qcForm.qcParameter} onChange={(e) => setQcForm({ ...qcForm, qcParameter: e.target.value })} required placeholder="e.g. Platelets Control L1, Hematocrit Calibration" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expected Reference Range</label>
                    <input type="text" className="input" value={qcForm.expectedValue} onChange={(e) => setQcForm({ ...qcForm, expectedValue: e.target.value })} placeholder="e.g. 150 - 450 K/uL" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Actual Value Obtained *</label>
                    <input type="text" className="input" value={qcForm.actualValue} onChange={(e) => setQcForm({ ...qcForm, actualValue: e.target.value })} required placeholder="e.g. 152 K/uL" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Audit Calibration Status *</label>
                  <select className="select" value={qcForm.status} onChange={(e) => setQcForm({ ...qcForm, status: e.target.value as any })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="Pass">Pass (Meets QC Criteria)</option>
                    <option value="Fail">Fail (Analyzer Out of Range)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setQcModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Submit QC Audit</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EquipmentAndQC;
