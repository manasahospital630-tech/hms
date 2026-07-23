import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Users, Percent } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const ReferralsAndBilling: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const refsRes = await api.get('/diagnostics/referrals');
      if (refsRes.data.success) setReferrals(refsRes.data.data);
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

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={28} color="var(--accent-primary)" />
            Referrals
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Calculate commission payouts and register referral clinics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadData} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setReferralModalOpen(true)} icon={<Plus size={14} />}>
            Add Referral Doctor
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading records...</span>
        </div>
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
