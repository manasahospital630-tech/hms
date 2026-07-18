import React, { useState, useEffect } from 'react';
import { Settings, Shield, Building2, Save, FileText, CheckCircle } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const SystemSettings: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [resourceFilter, setResourceFilter] = useState('');
  
  // Hospital Settings States
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [licenseInfo, setLicenseInfo] = useState('');
  const [hospitalLogo, setHospitalLogo] = useState('');
  const [theme, setTheme] = useState('dark');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/hospital-settings');
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        setHospitalName(s.hospital_name || '');
        setHospitalAddress(s.hospital_address || '');
        setPhoneNumber(s.phone_number || '');
        setWebsite(s.website || '');
        setEmail(s.email || '');
        setGstin(s.gstin || '');
        setLicenseInfo(s.license_info || '');
        setHospitalLogo(s.hospital_logo || '');
        setTheme(s.theme || 'dark');
      }
    } catch (err) {
      console.error('Failed to fetch hospital settings');
    }
  };

  const fetchLogs = () => {
    const params = resourceFilter ? `?resourceType=${resourceFilter}&limit=50` : '?limit=50';
    api.get(`/admin/audit-log${params}`).then(r => setLogs(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [resourceFilter]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setErrorMsg('');
    try {
      const res = await api.put('/admin/hospital-settings', {
        hospitalName,
        hospitalAddress,
        phoneNumber,
        website,
        email,
        gstin,
        licenseInfo,
        hospitalLogo,
        theme
      });
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchLogs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save hospital settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>
          <Settings size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-primary)' }} />
          System Settings
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {/* Hospital details card */}
        <Card title="Hospital Profile & Licensing" icon={<Building2 size={20} />}>
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {errorMsg && (
                <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              {saveSuccess && (
                <div style={{ color: 'var(--accent-success)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={16} /> Hospital details saved successfully!
                </div>
              )}

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <Input
                  label="Hospital Name *"
                  value={hospitalName}
                  onChange={e => setHospitalName(e.target.value)}
                  required
                />
                <Input
                  label="GSTIN / Tax ID *"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Hospital Address *</label>
                <textarea
                  className="input"
                  style={{ minHeight: 80, resize: 'vertical', padding: '10px' }}
                  value={hospitalAddress}
                  onChange={e => setHospitalAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <Input
                  label="Phone Number(s) *"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', alignItems: 'center' }}>
                <Input
                  label="Website Link *"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  required
                />
                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Hospital Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setHospitalLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    {hospitalLogo && (
                      <img
                        src={hospitalLogo}
                        alt="Logo Preview"
                        style={{ height: 40, width: 40, objectFit: 'contain', border: '1px solid var(--border-primary)', borderRadius: 4, background: '#fff' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>License & Legal Info</label>
                <textarea
                  className="input"
                  style={{ minHeight: 60, resize: 'vertical', padding: '10px' }}
                  value={licenseInfo}
                  onChange={e => setLicenseInfo(e.target.value)}
                  placeholder="e.g. Pharmacy License No, Hospital Reg No, etc."
                />
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>System Theme (Applies to all users) *</label>
                <select
                  className="select"
                  value={theme}
                  onChange={e => {
                    const newTheme = e.target.value;
                    setTheme(newTheme);
                    // Apply theme immediately for local feedback
                    const html = document.documentElement;
                    if (newTheme === 'light') {
                      html.classList.add('light-theme');
                    } else {
                      html.classList.remove('light-theme');
                    }
                  }}
                  required
                >
                  <option value="dark">Dark Theme (Neon / Midnight)</option>
                  <option value="light">Light Theme (Clean / Slate)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <Button variant="primary" type="submit" icon={<Save size={16} />} loading={saveLoading}>
                  Save Hospital Profile
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* System info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <Card title="System Diagnostics" icon={<Settings size={20} />}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 'var(--space-xs)' }}>
              <div><strong>Application Version:</strong> 1.0.0</div>
              <div><strong>Deployment Env:</strong> Development</div>
              <div><strong>API Server URL:</strong> http://localhost:5000</div>
              <div><strong>Database:</strong> PostgreSQL 17</div>
            </div>
          </Card>
          
          <Card title="Security & Access Control" icon={<Shield size={20} />}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 'var(--space-xs)' }}>
              <div><strong>Session Auth:</strong> JSON Web Tokens (JWT)</div>
              <div><strong>Password Hashing:</strong> bcryptjs (12 salt rounds)</div>
              <div><strong>RBAC Shielding:</strong> 8 Staff Roles</div>
              <div><strong>Security Auditing:</strong> Full audit logs enabled</div>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          System Audit Logs
        </h2>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Input 
            placeholder="Filter by resource type..." 
            value={resourceFilter} 
            onChange={e => setResourceFilter(e.target.value)} 
            style={{ maxWidth: 300 }} 
          />
        </div>
        <Table columns={[
          { key: 'user_name', label: 'User' },
          { key: 'action', label: 'Action' },
          { key: 'resource_type', label: 'Resource' },
          { key: 'resource_id', label: 'Resource ID', render: (v) => v ? v.substring(0, 8) + '...' : '—' },
          { key: 'ip_address', label: 'IP' },
          { key: 'created_at', label: 'Timestamp', render: (v) => formatDateTime(v) },
        ]} data={logs} />
      </div>
    </div>
  );
};

export default SystemSettings;
