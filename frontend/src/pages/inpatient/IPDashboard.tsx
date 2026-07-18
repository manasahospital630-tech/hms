import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bed, Activity, UserPlus, ArrowRightLeft, LogOut, CheckCircle, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export const IPDashboard: React.FC = () => {
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Transfer Modal States
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [availableBeds, setAvailableBeds] = useState<any[]>([]);
    const [targetBedId, setTargetBedId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [admRes, bedRes] = await Promise.all([
                api.get('/inpatient/admissions/active'),
                api.get('/inpatient/beds')
            ]);
            setAdmissions(admRes.data.data || []);
            setBeds(bedRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch inpatient dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (transferModalOpen) {
            // Load available beds for transfer
            api.get('/inpatient/beds')
                .then(r => {
                    setAvailableBeds(r.data.data?.filter((b: any) => b.status === 'Available') || []);
                })
                .catch(() => {});
        }
    }, [transferModalOpen]);

    const handleDischarge = async (admissionId: string) => {
        if (!window.confirm('Are you sure you want to approve this patient discharge? This will free the allocated bed.')) {
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/inpatient/discharge/${admissionId}`);
            alert('Patient discharged successfully. The assigned bed is now available.');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to discharge patient.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetBedId) {
            setActionError('Please select a target bed');
            return;
        }
        setActionLoading(true);
        setActionError('');
        try {
            await api.post('/inpatient/transfer', {
                ipAdmissionId: selectedAdmission.ip_admission_id,
                targetBedId,
                transferReason: transferReason || 'Clinical ward shift'
            });
            setTransferModalOpen(false);
            setTargetBedId('');
            setTransferReason('');
            setSelectedAdmission(null);
            fetchData();
            alert('Patient bed transfer completed successfully.');
        } catch (err: any) {
            setActionError(err.response?.data?.error || 'Failed to transfer bed.');
        } finally {
            setActionLoading(false);
        }
    };

    const openTransferModal = (admission: any) => {
        setSelectedAdmission(admission);
        setTransferModalOpen(true);
    };

    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    const totalBeds = beds.length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return (
        <div style={{ color: 'var(--text-primary)' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bed size={28} color="var(--accent-primary)" style={{ verticalAlign: 'middle' }} /> 
                    IP Patients Management
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
                    Track admitted patients, perform bed transfers, and manage clinical discharges
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={fetchData} icon={<RefreshCw size={14} />} disabled={loading}>
                      Refresh
                  </Button>
                  <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => navigate('/inpatient/admission')}>
                      New IP Admission
                  </Button>
                </div>
            </div>

            {/* Inpatient Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Bed Occupancy</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-primary)' }}>
                        {occupiedBeds} / {totalBeds} Beds
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Hospital occupancy rate is at {occupancyRate}%
                    </div>
                </Card>
                
                <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Active Inpatients</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-info)' }}>
                        {admissions.length} Patients
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Undergoing active clinical treatment & rounds
                    </div>
                </Card>
            </div>

            {/* Active Inpatients List */}
            <Card 
              title={<span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>Active Inpatients Registry</span>}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
            >
                <div style={{ marginTop: '16px' }}>
                  <Table 
                      columns={[
                          {
                              key: 'patient',
                              label: 'Patient Details',
                              render: (_, row) => (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.first_name} {row.last_name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {row.medical_record_number}</div>
                                  </div>
                              )
                          },
                          {
                              key: 'admission_type',
                              label: 'Priority',
                              render: (val) => (
                                  <Badge variant={val === 'Emergency' ? 'danger' : 'default'}>{val}</Badge>
                              )
                          },
                          {
                              key: 'ward',
                              label: 'Ward & Bed Allocation',
                              render: (_, row) => (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ color: 'var(--text-primary)' }}>{row.ward_name?.replace(/_/g, ' ')}</div>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>Bed {row.bed_number}</div>
                                  </div>
                              )
                          },
                          {
                              key: 'doctor',
                              label: 'Admitting Consultant',
                              render: (_, row) => (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                      Dr. {row.doc_first} {row.doc_last}
                                  </span>
                              )
                          },
                          {
                              key: 'admitted_at',
                              label: 'Admitted Date/Time',
                              render: (val) => (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                      {new Date(val).toLocaleString()}
                                  </span>
                              )
                          },
                          {
                              key: 'actions',
                              label: 'Care Actions',
                              render: (_, row) => (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                      <Button 
                                          variant="secondary" 
                                          size="sm" 
                                          icon={<ArrowRightLeft size={13} />} 
                                          onClick={() => openTransferModal(row)}
                                      >
                                          Transfer Bed
                                      </Button>
                                      <Button 
                                          variant="danger" 
                                          size="sm" 
                                          icon={<LogOut size={13} />} 
                                          onClick={() => handleDischarge(row.ip_admission_id)}
                                          disabled={actionLoading}
                                      >
                                          Discharge
                                      </Button>
                                  </div>
                              )
                          }
                      ]}
                      data={admissions}
                  />
                </div>
            </Card>

            {/* Transfer Bed Modal */}
            {transferModalOpen && selectedAdmission && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
                        <button 
                            onClick={() => setTransferModalOpen(false)}
                            style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            <ArrowRightLeft size={20} color="var(--accent-primary)" />
                            Shift Ward & Bed Allocation
                        </h2>
                        
                        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>Patient Name</div>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                                {selectedAdmission.first_name} {selectedAdmission.last_name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                                <span>Current Bed: <strong>{selectedAdmission.ward_name} - Bed {selectedAdmission.bed_number}</strong></span>
                                <span>MRN: {selectedAdmission.medical_record_number}</span>
                            </div>
                        </div>

                        {actionError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                                <AlertCircle size={16} />
                                <span>{actionError}</span>
                            </div>
                        )}

                        <form onSubmit={handleTransferSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Target Bed *</label>
                                    <select 
                                        className="select" 
                                        value={targetBedId} 
                                        onChange={(e) => setTargetBedId(e.target.value)}
                                        required
                                        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">-- Choose an Available Bed --</option>
                                        {availableBeds.map(b => (
                                            <option key={b.bed_id} value={b.bed_id}>
                                                {b.ward_name} - Bed {b.bed_number} (${parseFloat(b.hourly_rate || '0').toFixed(2)}/hr)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Reason for Bed Transfer</label>
                                    <textarea 
                                        className="input" 
                                        value={transferReason} 
                                        onChange={(e) => setTransferReason(e.target.value)}
                                        placeholder="e.g. Patient condition upgraded, general care shifting, Deluxe suite upgrade"
                                        style={{ minHeight: '80px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                                    <Button variant="secondary" type="button" onClick={() => setTransferModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit" loading={actionLoading}>
                                        Shift Bed Allocation
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default IPDashboard;
