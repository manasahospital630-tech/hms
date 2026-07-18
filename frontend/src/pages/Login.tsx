import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, Shield, Stethoscope, Activity, Calendar, Pill, DollarSign, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface RoleConfig {
  id: string;
  label: string;
  desc: string;
  email: string;
  icon: any;
  color: string;
}

const roles: RoleConfig[] = [
  { id: 'Admin', label: 'Admin', desc: 'System settings & user accounts', email: 'admin@hannahhms.com', icon: Shield, color: '#0ea5e9' },
  { id: 'Incharge', label: 'Incharge (Billing, Pharma, Labs and Reception)', desc: 'Overseer of Billing, Pharma, Labs, Rec', email: 'incharge@hannahhms.com', icon: Shield, color: '#14b8a6' },
  { id: 'Doctor', label: 'Doctor', desc: 'Consultations & EMR workspace', email: 'doctor@hannahhms.com', icon: Stethoscope, color: '#8b5cf6' },
  { id: 'Nurse', label: 'Nurse', desc: 'Patient vitals & triage queue', email: 'nurse@hannahhms.com', icon: Activity, color: '#f43f5e' },
  { id: 'Receptionist', label: 'Receptionist', desc: 'Registration & check-ins', email: 'receptionist@hannahhms.com', icon: Calendar, color: '#f59e0b' },
  { id: 'Pharmacist', label: 'Pharmacist', desc: 'Meds inventory & sales', email: 'pharmacist@hannahhms.com', icon: Pill, color: '#10b981' },
  { id: 'Biller', label: 'Biller', desc: 'IP invoices & payments ledger', email: 'biller@hannahhms.com', icon: DollarSign, color: '#ec4899' },
  { id: 'Patient', label: 'Patient Portal', desc: 'Appointments & health history', email: 'patient@hannahhms.com', icon: User, color: '#06b6d4' }
];

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleDefaultPaths: Record<string, string> = {
    Admin: '/admin/dashboard',
    Incharge: '/admin/dashboard',
    Doctor: '/doctor/dashboard',
    Nurse: '/nurse/triage',
    Receptionist: '/reception/queue',
    Pharmacist: '/pharmacy/dispense',
    Biller: '/billing/invoices',
    Patient: '/patient-portal/health',
    Management: '/admin/dashboard',
  };

  const handleRoleSelect = (role: RoleConfig) => {
    setSelectedRole(role);
    setEmail(role.email);
    setPassword('password123'); // Default seeded password
    setError('');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleDefaultPaths[user.role] || '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #0e1e38, #0a0e1a)', padding: 'var(--space-xl)', overflowY: 'auto' }}>
      <div className="login-bg" />
      
      <div style={{ width: '100%', maxWidth: selectedRole ? '440px' : '900px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', zIndex: 1, transition: 'all 0.3s ease' }}>
        
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <Heart size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>Manasa HMS</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>Hospital Management & Clinical Portal</p>
        </div>

        {error && <div className="alert alert-danger" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--accent-danger)', padding: '12px', borderRadius: '6px', fontSize: 'var(--font-sm)' }}>{error}</div>}

        {/* Dynamic Display: Role Selection vs Login Form */}
        {!selectedRole ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white' }}>Select Access Portal</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Choose your clinical or administrative role to sign in</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <div 
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className="card"
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = role.color;
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                      <Icon size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 'var(--font-base)' }}>{role.label}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{role.desc}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 'var(--space-xl)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '16px', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <button 
                type="button" 
                onClick={handleBack} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'white', margin: 0 }}>
                Login as <span style={{ color: selectedRole.color }}>{selectedRole.label}</span>
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                
                <Input 
                  label="Password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                
                <div style={{ marginTop: '8px' }}>
                  <Button type="submit" variant="primary" fullWidth loading={loading}>
                    Sign In
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
