import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, CheckCircle, RefreshCw, X, AlertTriangle, FileText, Barcode, Printer, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const TestOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Order Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [orderForm, setOrderForm] = useState({
    doctorId: '',
    referralId: '',
    priority: 'Routine' as 'Routine' | 'Urgent' | 'Emergency',
    clinicalNotes: '',
    diagnosis: '',
    selectedServices: [] as string[],
    selectedPackages: [] as string[]
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, docsRes, refsRes, servsRes, pkgsRes] = await Promise.all([
        api.get('/diagnostics/orders'),
        api.get('/admin/users'), // fetch all doctors
        api.get('/diagnostics/referrals'),
        api.get('/diagnostics/services'),
        api.get('/diagnostics/packages')
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (docsRes.data.success) {
        // filter users who are doctors or administrators
        const filteredDocs = (docsRes.data.data || []).filter((u: any) => u.role === 'Doctor' || u.role === 'Admin');
        setDoctors(filteredDocs);
        if (filteredDocs.length > 0) {
          setOrderForm(prev => ({ ...prev, doctorId: filteredDocs[0].user_id }));
        }
      }
      if (refsRes.data.success) setReferrals(refsRes.data.data);
      if (servsRes.data.success) setServices(servsRes.data.data);
      if (pkgsRes.data.success) setPackages(pkgsRes.data.data);
    } catch (err: any) {
      console.error('Failed to load orders catalog:', err);
      setError('Unable to fetch test orders list and catalog items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientLookup = async (val: string) => {
    setPatientSearch(val);
    if (val.length < 3) {
      setPatients([]);
      return;
    }
    try {
      const res = await api.get(`/patients?search=${encodeURIComponent(val)}`);
      // Note: Backend might wrap inside data.patients or data.data.patients depending on pagination
      const fetched = res.data.data?.patients || res.data.data || [];
      setPatients(fetched);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!selectedPatientId) {
      setModalError('Please search and select a patient first.');
      return;
    }
    if (orderForm.selectedServices.length === 0 && orderForm.selectedPackages.length === 0) {
      setModalError('Please select at least one service test or package.');
      return;
    }
    setModalLoading(true);

    const payload = {
      patientId: selectedPatientId,
      doctorId: orderForm.doctorId,
      referralId: orderForm.referralId || null,
      priority: orderForm.priority,
      clinicalNotes: orderForm.clinicalNotes,
      diagnosis: orderForm.diagnosis,
      services: orderForm.selectedServices,
      packages: orderForm.selectedPackages
    };

    try {
      await api.post('/diagnostics/orders', payload);
      setOrderModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to submit test order.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePayOrder = async (orderId: string) => {
    try {
      await api.post(`/diagnostics/orders/${orderId}/pay`);
      loadData();
      alert('Diagnostic invoice payment cleared successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process payment.');
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await api.put(`/diagnostics/orders/items/${itemId}/status`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update test item status.');
    }
  };

  const handlePrintBarcode = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sample Barcode Print</title>
            <style>
              body { font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; }
              .barcode { border: 2px solid #000; padding: 10px 40px; margin: 10px 0; font-size: 24px; font-weight: bold; letter-spacing: 4px; }
              .meta { font-size: 11px; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
            <div style="font-size: 14px; font-weight: bold;">HANNAH DIAGNOSTICS</div>
            <div class="barcode">||||| ${item.service_code} |||||</div>
            <div class="meta">
              Sample ID: ${item.item_id.substring(0,8).toUpperCase()}<br/>
              Test: ${item.service_name}<br/>
              Date: ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(term) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(term) ||
      o.medical_record_number.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={28} color="var(--accent-primary)" />
            Diagnostics Orders & Bills
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Order new laboratory and imaging exams and clear bills
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadData} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setOrderModalOpen(true)} icon={<Plus size={14} />}>
            Create Diagnostics Order
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search orders by number, patient name or MRN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ paddingLeft: '38px', background: 'var(--bg-primary)' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No Test Orders Found</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            No diagnostic orders have been logged in the system.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => (
            <Card 
              key={order.order_id} 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>{order.order_number}</span>
                    <span style={{ 
                      fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                      background: order.priority === 'Emergency' ? 'rgba(244,63,94,0.15)' : order.priority === 'Urgent' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.1)',
                      color: order.priority === 'Emergency' ? 'var(--accent-danger)' : order.priority === 'Urgent' ? 'var(--accent-warning)' : 'var(--text-secondary)'
                    }}>
                      {order.priority}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                      background: order.payment_status === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                      color: order.payment_status === 'Paid' ? 'var(--accent-success)' : 'var(--accent-danger)'
                    }}>
                      Bill: {order.payment_status}
                    </span>
                    {order.payment_status !== 'Paid' && (
                      <Button size="small" variant="primary" onClick={() => handlePayOrder(order.order_id)}>
                        Collect Payment
                      </Button>
                    )}
                  </div>
                </div>
              }
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
            >
              {/* Order Meta details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{order.first_name} {order.last_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {order.medical_record_number}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Ordering Consultant:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>Dr. {order.doc_first} {order.doc_last}</div>
                </div>
                {order.referral_name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Referral Doctor:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--accent-primary)' }}>{order.referral_name}</div>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Ordered Timestamp:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{new Date(order.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Sub items breakdown */}
              <div style={{ marginTop: '14px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Ordered Panels & Tests</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(order.items || []).map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid var(--border-primary)', 
                        borderRadius: '8px' 
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.service_name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>({item.service_code})</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Category: {item.category_name} | Sample Required: {item.sample_required || 'None'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateItemStatus(item.item_id, e.target.value)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 600,
                            background: item.status === 'Verified' || item.status === 'Completed' ? 'rgba(16,185,129,0.15)' : item.status === 'Resulted' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
                            color: item.status === 'Verified' || item.status === 'Completed' ? 'var(--accent-success)' : item.status === 'Resulted' ? '#8b5cf6' : 'var(--accent-warning)',
                            border: '1px solid var(--border-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Ordered" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Ordered</option>
                          <option value="Sample Collected" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Sample Collected</option>
                          <option value="In Lab" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>In Lab</option>
                          <option value="Resulted" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Resulted</option>
                          <option value="Completed" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Completed</option>
                          <option value="Verified" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Verified</option>
                          <option value="Cancelled" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancelled</option>
                        </select>
                        {item.sample_required && item.sample_required !== 'None' && (
                          <button 
                            onClick={() => handlePrintBarcode(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--border-primary)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '11px' }}
                            title="Print tube barcode label"
                          >
                            <Barcode size={14} /> Barcode
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {orderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setOrderModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Create Diagnostics Test Order</h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleOrderSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search Patient */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>1. Search Patient (Name or MRN) *</label>
                  <input 
                    type="text" 
                    placeholder="Type name or MRN to lookup..."
                    className="input" 
                    value={patientSearch}
                    onChange={(e) => handlePatientLookup(e.target.value)}
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  {patients.length > 0 && (
                    <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', background: 'var(--bg-primary)', maxHeight: '120px', overflowY: 'auto', marginTop: '6px' }}>
                      {patients.map(p => (
                        <div 
                          key={p.patient_id}
                          onClick={() => {
                            setSelectedPatientId(p.patient_id);
                            setPatientSearch(`${p.first_name} ${p.last_name} (${p.medical_record_number})`);
                            setPatients([]);
                          }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-primary)', fontSize: '13px', background: selectedPatientId === p.patient_id ? 'rgba(14,165,233,0.08)' : 'transparent' }}
                        >
                          {p.first_name} {p.last_name} — MRN: {p.medical_record_number}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ordering Doctor *</label>
                    <select className="select" value={orderForm.doctorId} onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {doctors.map(d => <option key={d.user_id} value={d.user_id}>Dr. {d.first_name} {d.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Referral Doctor (External)</label>
                    <select className="select" value={orderForm.referralId} onChange={(e) => setOrderForm({ ...orderForm, referralId: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="">None / Self Referral</option>
                      {referrals.map(r => <option key={r.referral_id} value={r.referral_id}>{r.name} ({r.hospital || 'Hospital'})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority *</label>
                    <select className="select" value={orderForm.priority} onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value as any })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clinical History / Primary Diagnosis</label>
                    <input type="text" className="input" value={orderForm.diagnosis} onChange={(e) => setOrderForm({ ...orderForm, diagnosis: e.target.value })} placeholder="Primary symptoms or provisional diagnosis" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {/* Services multi select */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>2. Select Individual Diagnostic Services</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '10px', background: 'var(--bg-primary)' }}>
                    {services.map(s => {
                      const isChecked = orderForm.selectedServices.includes(s.service_id);
                      return (
                        <label key={s.service_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setOrderForm({ ...orderForm, selectedServices: orderForm.selectedServices.filter(id => id !== s.service_id) });
                              } else {
                                setOrderForm({ ...orderForm, selectedServices: [...orderForm.selectedServices, s.service_id] });
                              }
                            }}
                          />
                          <span>{s.name} (Rs. {parseFloat(s.price).toFixed(0)})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Packages */}
                {packages.length > 0 && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>3. Select Bundled Health Packages</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {packages.map(p => {
                        const isChecked = orderForm.selectedPackages.includes(p.package_id);
                        return (
                          <label key={p.package_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: isChecked ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setOrderForm({ ...orderForm, selectedPackages: orderForm.selectedPackages.filter(id => id !== p.package_id) });
                                } else {
                                  setOrderForm({ ...orderForm, selectedPackages: [...orderForm.selectedPackages, p.package_id] });
                                }
                              }}
                            />
                            <span>{p.name} (Rs. {parseFloat(p.price).toFixed(0)})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clinical Instructions / Notes</label>
                  <textarea className="input" rows={2} value={orderForm.clinicalNotes} onChange={(e) => setOrderForm({ ...orderForm, clinicalNotes: e.target.value })} placeholder="Home collection instructions, fast fasting requirements, etc." style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setOrderModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Submit Test Order</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TestOrders;
