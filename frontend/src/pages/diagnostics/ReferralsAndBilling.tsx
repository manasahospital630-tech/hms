import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, RefreshCw, X, Users, Percent, ShieldCheck, Printer } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const ReferralsAndBilling: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'billing' | 'referrals'>('billing');

  // Referral Modal States
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    name: '',
    hospital: '',
    commissionPercentage: '15',
    phone: '',
    email: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [refsRes, billsRes] = await Promise.all([
        api.get('/diagnostics/referrals'),
        api.get('/diagnostics/orders') // we can get order details including billing from items
      ]);

      if (refsRes.data.success) setReferrals(refsRes.data.data);
      if (billsRes.data.success) setBills(billsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    const payload = {
      ...referralForm,
      commissionPercentage: parseFloat(referralForm.commissionPercentage)
    };

    try {
      await api.post('/diagnostics/referrals', payload);
      setReferralModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save referral doctor.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrintReceipt = (bill: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const subtotal = (bill.items || []).reduce((acc: number, item: any) => acc + parseFloat(item.price || 0), 0);
      const gst = subtotal * 0.18;
      const total = subtotal + gst;

      printWindow.document.write(`
        <html>
          <head>
            <title>Diagnostic Invoice - Hannah HMS</title>
            <style>
              body { font-family: sans-serif; padding: 30px; color: #334155; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
              .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
              .meta-table { width: 100%; margin-bottom: 20px; font-size: 13px; }
              .meta-table td { padding: 4px 0; }
              .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .invoice-table th { border-bottom: 2px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
              .invoice-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
              .totals { text-align: right; font-size: 14px; font-weight: bold; }
              .totals div { margin-bottom: 6px; }
              .footer { text-align: center; border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 15px; font-size: 11px; color: #94a3b8; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
            <div class="header">
              <h1>HANNAH DIAGNOSTICS LABS</h1>
              <p>Inpatient & Outpatient Diagnostic Services Invoice</p>
            </div>
            
            <table class="meta-table">
              <tr>
                <td><strong>Invoice Ref:</strong> INV-LAB-${bill.order_number.substring(4)}</td>
                <td style="text-align: right;"><strong>Date:</strong> ${new Date(bill.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Patient MRN:</strong> ${bill.medical_record_number}</td>
                <td style="text-align: right;"><strong>Patient Name:</strong> ${bill.first_name} ${bill.last_name}</td>
              </tr>
              <tr>
                <td><strong>Ordering Doctor:</strong> Dr. ${bill.doc_first} ${bill.doc_last}</td>
                <td style="text-align: right;"><strong>Payment Status:</strong> ${bill.payment_status.toUpperCase()}</td>
              </tr>
            </table>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Test Code</th>
                  <th>Service Description</th>
                  <th>Category</th>
                  <th style="text-align: right;">Base Price</th>
                </tr>
              </thead>
              <tbody>
                ${(bill.items || []).map((item: any) => `
                  <tr>
                    <td>${item.service_code}</td>
                    <td>${item.service_name}</td>
                    <td>${item.category_name}</td>
                    <td style="text-align: right;">Rs. ${parseFloat(item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div>Subtotal: Rs. ${subtotal.toFixed(2)}</div>
              <div>Diagnostic GST (18%): Rs. ${gst.toFixed(2)}</div>
              <div style="font-size: 16px; color: #0f172a; margin-top: 8px;">Total Amount: Rs. ${total.toFixed(2)}</div>
            </div>

            <div class="footer">
              This is a system generated diagnostic clearance receipt.<br/>
              Hannah Medical Systems - Advanced Diagnostics Module
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={28} color="var(--accent-primary)" />
            Referrals & Diagnostic Billing
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Calculate commission payouts, register referral clinics, and print bills
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadData} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          {activeSubTab === 'referrals' && (
            <Button variant="primary" onClick={() => setReferralModalOpen(true)} icon={<Plus size={14} />}>
              Add Referral Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Tab select */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveSubTab('billing')}
          style={{
            padding: '8px 20px',
            background: activeSubTab === 'billing' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'billing' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'billing' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'billing' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Billing & Invoices
        </button>
        <button
          onClick={() => setActiveSubTab('referrals')}
          style={{
            padding: '8px 20px',
            background: activeSubTab === 'referrals' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'referrals' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'referrals' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'referrals' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Referral Affiliates ({referrals.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading records...</span>
        </div>
      ) : activeSubTab === 'billing' ? (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                  <th style={{ padding: '12px 16px' }}>Patient</th>
                  <th style={{ padding: '12px 16px' }}>Subtotal (Rs.)</th>
                  <th style={{ padding: '12px 16px' }}>Tax GST (18%)</th>
                  <th style={{ padding: '12px 16px' }}>Total Charged</th>
                  <th style={{ padding: '12px 16px' }}>Referral Comm.</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Print</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => {
                  const subtotal = (bill.items || []).reduce((acc: number, item: any) => acc + parseFloat(item.price || 0), 0);
                  const gst = subtotal * 0.18;
                  const total = subtotal + gst;
                  const comm = bill.referral_name ? (subtotal * 0.15) : 0.00;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>INV-{bill.order_number}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{bill.first_name} {bill.last_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MRN: {bill.medical_record_number}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>Rs. {subtotal.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>Rs. {gst.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        Rs. {total.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: comm > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                        {comm > 0 ? `Rs. ${comm.toFixed(2)}` : '—'}
                        {bill.referral_name && <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>to {bill.referral_name}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                          background: bill.payment_status === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                          color: bill.payment_status === 'Paid' ? 'var(--accent-success)' : 'var(--accent-danger)'
                        }}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handlePrintReceipt(bill)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          title="Print Invoice Receipt"
                        >
                          <Printer size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {referrals.map((ref) => (
            <Card key={ref.referral_id} title={ref.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Affiliated Hospital:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{ref.hospital || 'Private Clinic'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Commission Rate:</span>
                    <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Percent size={14} /> {ref.commission_percentage}%
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phone Contact:</span>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{ref.phone || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Email: {ref.email || 'N/A'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Referral Modal */}
      {referralModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setReferralModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Add Referral Partner Doctor</h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleReferralSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Doctor Full Name *</label>
                  <input type="text" className="input" value={referralForm.name} onChange={(e) => setReferralForm({ ...referralForm, name: e.target.value })} required placeholder="Dr. First Last" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Affiliated Clinic / Hospital</label>
                  <input type="text" className="input" value={referralForm.hospital} onChange={(e) => setReferralForm({ ...referralForm, hospital: e.target.value })} placeholder="e.g. AIIMS Cardiac Unit" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Commission % *</label>
                    <input type="number" className="input" min="0" max="100" value={referralForm.commissionPercentage} onChange={(e) => setReferralForm({ ...referralForm, commissionPercentage: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Contact</label>
                    <input type="text" className="input" value={referralForm.phone} onChange={(e) => setReferralForm({ ...referralForm, phone: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input type="email" className="input" value={referralForm.email} onChange={(e) => setReferralForm({ ...referralForm, email: e.target.value })} placeholder="doctor@hospital.org" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setReferralModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Register Affiliate</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReferralsAndBilling;
