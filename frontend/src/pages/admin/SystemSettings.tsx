import React, { useState, useEffect } from 'react';
import {
  Settings, Shield, Building2, Save, FileText, CheckCircle,
  Users, Layers, Lock, Search, RefreshCw, KeyRound, Server, Activity, Plus,
  Sliders, ShieldCheck, Database, Check, Eye
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const BUSINESS_UNITS = [
  { id: 'BU-01', name: 'Outpatient Department (OPD)', head: 'Dr. Sandeep Gunde', staffCount: 18, type: 'Clinical Unit', status: 'Active' },
  { id: 'BU-02', name: 'Inpatient Department (IPD)', head: 'Dr. Alex Nguyen', staffCount: 24, type: 'Clinical Unit', status: 'Active' },
  { id: 'BU-03', name: 'Emergency & Trauma Care (ICU)', head: 'Dr. Arjun Mehta', staffCount: 12, type: 'Critical Care', status: 'Active' },
  { id: 'BU-04', name: 'Laboratory & Pathology', head: 'Dr. Priya Sharma', staffCount: 10, type: 'Diagnostics', status: 'Active' },
  { id: 'BU-05', name: 'Pharmacy & Dispensing', head: 'Rajesh Kumar (Pharmacist)', staffCount: 8, type: 'Pharmacy', status: 'Active' },
  { id: 'BU-06', name: 'Billing, Revenue & Finance', head: 'Suresh Verma (Biller)', staffCount: 6, type: 'Administration', status: 'Active' },
  { id: 'BU-07', name: 'Reception & Front Desk', head: 'Anita Desai', staffCount: 9, type: 'Operations', status: 'Active' },
  { id: 'BU-08', name: 'System Administration', head: 'IT Admin Team', staffCount: 4, type: 'IT & Infrastructure', status: 'Active' },
];

const SECURITY_ROLES = [
  {
    role: 'Admin',
    description: 'System Administrator with unrestricted access to system configuration, user accounts, security roles, and financial records.',
    permissions: ['Full System Control', 'User Creation & Roles', 'Hospital Settings', 'Audit Logs Access', 'Financial Override'],
    color: '#ef4444',
    bg: '#fef2f2',
    userCount: 3
  },
  {
    role: 'Doctor',
    description: 'Physicians & Consultants with access to patient clinical records, OPD check-in, EMR consultation, prescriptions, and lab ordering.',
    permissions: ['OPD Consultation', 'EMR & Diagnosis', 'Prescription Creation', 'Lab Test Orders', 'Doctor Profile Dashboard'],
    color: '#0d9488',
    bg: '#f0fdf4',
    userCount: 14
  },
  {
    role: 'Nurse',
    description: 'Nursing staff responsible for patient triage, vitals capture, inpatient bed management, and assisting doctor consultations.',
    permissions: ['Triage Queue', 'Vitals Capture', 'IP Bed Management', 'Clinical Assistance', 'Patient History View'],
    color: '#0284c7',
    bg: '#f0f9ff',
    userCount: 22
  },
  {
    role: 'Receptionist',
    description: 'Front desk receptionists managing patient registration, appointment booking, OP check-in, and daily token queues.',
    permissions: ['Patient Registration', 'Appointment Booking', 'OP Check-in & Tokens', 'Patient Search', 'Queue Status'],
    color: '#8b5cf6',
    bg: '#f3e8ff',
    userCount: 9
  },
  {
    role: 'Pharmacist',
    description: 'Pharmacy staff managing medicine dispensing workstation, medicine sales, inventory stock adjustments, and reorder levels.',
    permissions: ['Dispense Workstation', 'Medicine Sales Billing', 'Inventory Management', 'Stock Reordering', 'Pharmacy Receipts'],
    color: '#d97706',
    bg: '#fffbeb',
    userCount: 8
  },
  {
    role: 'Biller',
    description: 'Accountants and billing staff generating diagnostic invoices, collecting patient payments, managing OPD/IPD bills and receipts.',
    permissions: ['Invoice Generator', 'Payment Processing', 'Diagnostics Billing', 'Receipt Printing', 'Revenue Split View'],
    color: '#059669',
    bg: '#ecfdf5',
    userCount: 6
  },
  {
    role: 'Incharge',
    description: 'Department Incharge overseeing daily department rosters, doctor consultations, queue operational flow, and unit stats.',
    permissions: ['Department Supervision', 'Consultation Tracking', 'Roster Management', 'Unit Analytics', 'Audit Log View'],
    color: '#6366f1',
    bg: '#eef2ff',
    userCount: 5
  },
  {
    role: 'Management',
    description: 'Executive management & directors viewing high-level HMS analytics, revenue charts, doctor performance metrics, and bed utilization.',
    permissions: ['Executive Dashboard', 'Revenue & Financial Analytics', 'OPD Performance Metrics', 'Bed Utilization', 'Hospital Reports'],
    color: '#475569',
    bg: '#f8fafc',
    userCount: 4
  }
];

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'business' | 'security' | 'audit'>('settings');
  
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
    const params = resourceFilter ? `?resourceType=${resourceFilter}&limit=100` : '?limit=100';
    api.get(`/admin/audit-log${params}`).then(r => setLogs(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs();
    }
  }, [resourceFilter, activeTab]);

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
    <div style={{ color: 'var(--text-primary)', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={28} color="var(--accent-primary)" />
            System Administration & Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage hospital branding, business units, security roles, system diagnostics, and audit logs
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* TABS NAVIGATION BAR */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'settings', label: 'System Settings', icon: Sliders },
          { id: 'business', label: 'Business Units, Users & Teams', icon: Building2 },
          { id: 'security', label: 'Security Roles & RBAC Matrix', icon: ShieldCheck },
          { id: 'audit', label: 'System Audit Logs', icon: FileText }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                background: isActive ? 'rgba(13,148,136,0.08)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-1px'
              }}
            >
              <IconComp size={18} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1: SYSTEM SETTINGS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'settings' && (
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
                <div><strong>Deployment Env:</strong> Production / Hostinger</div>
                <div><strong>API Server Status:</strong> 🟢 Online (Express Node.js)</div>
                <div><strong>Database:</strong> PostgreSQL 17 (Cloud Managed)</div>
                <div><strong>System Timezone:</strong> IST (+05:30) / Asia/Kolkata</div>
              </div>
            </Card>
            
            <Card title="Security & Access Shield" icon={<Shield size={20} />}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 'var(--space-xs)' }}>
                <div><strong>Session Auth:</strong> JSON Web Tokens (JWT)</div>
                <div><strong>Password Hashing:</strong> bcryptjs (12 salt rounds)</div>
                <div><strong>RBAC Shielding:</strong> 8 Active Staff Roles</div>
                <div><strong>Security Auditing:</strong> Full audit logs enabled</div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 2: BUSINESS UNITS, USERS & TEAMS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>🏢 Business Units & Clinical Departments</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Operational departments, team leads, active staff counts, and department status
              </p>
            </div>
            <Button variant="primary" icon={<Plus size={16} />}>
              Add Business Unit
            </Button>
          </div>

          {/* Business Units Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {BUSINESS_UNITS.map(bu => (
              <div key={bu.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(13,148,136,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {bu.id}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0 0 0', color: 'var(--text-primary)' }}>
                      {bu.name}
                    </h3>
                  </div>
                  <Badge variant="success">{bu.status}</Badge>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div><strong>Unit Head / Incharge:</strong> {bu.head}</div>
                  <div><strong>Staff Members:</strong> {bu.staffCount} Active Staff</div>
                  <div><strong>Category:</strong> {bu.type}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hospital Teams Summary */}
          <Card title="Hospital Operational Teams & Staff Roster" icon={<Users size={20} />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '13px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>Medical & Doctors Team</strong>
                <div style={{ margin: '6px 0 2px 0', color: 'var(--text-secondary)' }}>Consultants, Physicians, Surgeons</div>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>14 Active Doctors</strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <strong style={{ color: '#0284c7', fontSize: '14px' }}>Nursing & Care Team</strong>
                <div style={{ margin: '6px 0 2px 0', color: 'var(--text-secondary)' }}>Triage, ICU & Ward Nurses</div>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>22 Active Nurses</strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <strong style={{ color: '#8b5cf6', fontSize: '14px' }}>Front Desk & Reception</strong>
                <div style={{ margin: '6px 0 2px 0', color: 'var(--text-secondary)' }}>Patient Reg, OP Check-in, Tokens</div>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>9 Front Desk Staff</strong>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <strong style={{ color: '#d97706', fontSize: '14px' }}>Pharmacy & Billing Team</strong>
                <div style={{ margin: '6px 0 2px 0', color: 'var(--text-secondary)' }}>Dispensing, Sales & Invoicing</div>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>14 Pharmacists & Billers</strong>
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 3: SECURITY ROLES & RBAC MATRIX */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>🛡️ Security Roles & Role-Based Access Control (RBAC) Matrix</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
              System roles, assigned capabilities, security boundaries, and user allocations
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
            {SECURITY_ROLES.map(roleItem => (
              <div key={roleItem.role} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: roleItem.color, background: roleItem.bg, padding: '4px 12px', borderRadius: '6px' }}>
                    {roleItem.role}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {roleItem.userCount} Users
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  {roleItem.description}
                </p>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Key Role Capabilities:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {roleItem.permissions.map((perm, pIdx) => (
                    <span key={pIdx} style={{ fontSize: '11px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-primary)' }}>
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 4: SYSTEM AUDIT LOGS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={22} style={{ color: 'var(--accent-primary)' }} />
                Auditable System Log Trail
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Real-time security log entries of system modifications, user creations, and setting updates
              </p>
            </div>

            <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchLogs}>
              Refresh Logs
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Input 
                placeholder="Filter by resource type (User, Doctor...)" 
                value={resourceFilter} 
                onChange={e => setResourceFilter(e.target.value)} 
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Log Entries: {logs.length}
            </span>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <Table columns={[
              { key: 'user_name', label: 'User Name', render: (v, row) => (
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{v || 'System'}</strong>
                  {row.user_email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.user_email}</div>}
                </div>
              )},
              { key: 'action', label: 'Action', render: (v) => (
                <span style={{ fontWeight: 700, fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: v === 'CREATE' ? '#dcfce7' : v === 'UPDATE' ? '#e0f2fe' : '#fee2e2', color: v === 'CREATE' ? '#166534' : v === 'UPDATE' ? '#0369a1' : '#991b1b' }}>
                  {v}
                </span>
              )},
              { key: 'resource_type', label: 'Resource Type', render: (v) => <strong style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{v}</strong> },
              { key: 'resource_id', label: 'Resource ID', render: (v) => v ? <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{v.substring(0, 10)}...</span> : '—' },
              { key: 'ip_address', label: 'IP Address', render: (v) => v || '127.0.0.1' },
              { key: 'created_at', label: 'Timestamp', render: (v) => formatDateTime(v) },
            ]} data={logs} />
          </div>

        </div>
      )}

    </div>
  );
};

export default SystemSettings;
