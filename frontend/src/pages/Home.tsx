import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, Activity, Shield, Users, Clock, ArrowRight, CheckCircle2, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const roleDefaultPaths: Record<string, string> = {
    Admin: '/admin/users',
    Doctor: '/doctor/dashboard',
    Nurse: '/nurse/triage',
    Receptionist: '/reception/queue',
    Pharmacist: '/pharmacy/dispense',
    Biller: '/billing/invoices',
    Patient: '/patient-portal/health',
    Management: '/admin/settings',
  };

  const handleAction = () => {
    if (isAuthenticated && user) {
      navigate(roleDefaultPaths[user.role] || '/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #0e1e38, #0a0e1a 60%)', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', overflowX: 'hidden' }}>
      
      {/* Navigation Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-primary)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(10, 14, 26, 0.75)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-primary), #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, letterSpacing: '0.5px', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Manasa Hospital</h2>
            <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Medical Center</span>
          </div>
        </div>

        <div>
          {isAuthenticated && user ? (
            <button className="btn btn-primary" onClick={handleAction} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              Go to Dashboard <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleAction} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              Portal Login <ArrowRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-xl)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', alignItems: 'center', position: 'relative' }}>
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '6px 12px', borderRadius: '50px', marginBottom: 'var(--space-lg)' }}>
            <Activity size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.5px' }}>Next-Gen Healthcare Management</span>
          </div>
          
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: 'var(--space-md)', background: 'linear-gradient(to right, #ffffff, #e2e8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
            State-of-the-Art <br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent-primary), #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Medical Care</span> Right At Your Fingertips.
          </h1>
          
          <p style={{ fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', lineHeight: 1.6, maxWidth: '540px' }}>
            Manasa Hospital combines clinical excellence with advanced technologies, featuring 24/7 fast-track emergency intake, real-time bed management, and unified digital patient profiles.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button className="btn btn-primary btn-lg" onClick={handleAction} style={{ boxShadow: 'var(--shadow-glow)' }}>
              Access HMS Portal <ArrowRight size={18} />
            </button>
            <a href="#services" className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Explore Services
            </a>
          </div>
        </div>

        {/* Hero Interactive Graphic */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Neon background blur */}
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: 0.15, top: '50px', left: '50px', zIndex: 0 }} />
          
          <div style={{ zIndex: 1, width: '100%', maxWidth: '480px', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Emergency Intake Console</span>
              </div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Bed Occupancy</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700 }}>42 / 50</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-primary)' }}>84% Capacity</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', marginTop: 'var(--space-sm)', overflow: 'hidden' }}>
                  <div style={{ width: '84%', height: '100%', background: 'linear-gradient(to right, var(--accent-primary), #3b82f6)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Active ER Cases</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-danger)' }}>8 Patients</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>On-Duty Staff</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-success)' }}>24 Providers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{ borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', background: 'rgba(17, 24, 39, 0.4)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-lg)', textAlign: 'center' }}>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>15,000+</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>Patients Cared For</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '4px' }}>120+</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>Specialist Physicians</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>50+</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>Smart Care Wards & Beds</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginBottom: '4px' }}>99.9%</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>Satisfaction Score</p>
          </div>
        </div>
      </section>

      {/* About Hospital Section */}
      <section id="about" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>About Manasa Hospital</h2>
          <div style={{ width: '60px', height: '4px', background: 'linear-gradient(95deg, var(--accent-primary), #3b82f6)', margin: '0 auto 16px auto', borderRadius: '2px' }} />
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: 'var(--font-base)' }}>
            Founded on the values of clinical excellence, innovation, and compassionate care, Manasa Hospital stands as a premier medical facility offering multidisciplinary diagnostics and therapies.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>State-Of-The-Art Digital Clinical Ecosystem</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              At Manasa Hospital, we leverage our proprietary Manasa HMS platform to automate and stream care administration. All outpatient check-ins, nursing triage, and emergency registrations feed into a synchronized ledger.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Our active inpatient records employ strict state checking. If a patient is admitted, outpatient bookings are automatically locked out, and all sub-ledger services (pharma, labs, nursing fees) compile into a single running invoice, facilitating stress-free discharge billing.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <CheckCircle2 size={18} color="var(--accent-success)" />
                <span style={{ fontWeight: 500 }}>Advanced 24/7 Emergency Fast-Track Intake</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <CheckCircle2 size={18} color="var(--accent-success)" />
                <span style={{ fontWeight: 500 }}>Real-Time Bed State Management & Wards Allocation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <CheckCircle2 size={18} color="var(--accent-success)" />
                <span style={{ fontWeight: 500 }}>Unified Ledger and Automated Pharmacy Integration</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-primary)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Our Core Mission</h4>
            <blockquote style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: 'var(--space-md)', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-lg)' }}>
              "To heal humanity with compassion, integrity, and next-generation clinical intelligence, making high-end clinical services accessible to all."
            </blockquote>
            
            <h4 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Hours of Operations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '4px' }}>
                <span>Emergency Intake Services</span>
                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>24 Hours / 7 Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '4px' }}>
                <span>Outpatient Clinics (OPD)</span>
                <span>08:00 AM - 08:00 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '4px' }}>
                <span>Inpatient Admittance & Shifts</span>
                <span>24 Hours / 7 Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Diagnostics & Lab Pharmacy</span>
                <span>24 Hours / 7 Days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ borderTop: '1px solid var(--border-primary)', background: 'rgba(10, 14, 26, 0.5)', padding: 'var(--space-2xl) var(--space-xl)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>Specialized Clinical Services</h2>
            <div style={{ width: '60px', height: '4px', background: 'linear-gradient(95deg, var(--accent-primary), #3b82f6)', margin: '0 auto 16px auto', borderRadius: '2px' }} />
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: 'var(--font-base)' }}>
              Explore our core medical units equipped with the latest diagnostic, surgical, and therapeutic medical technology.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
            
            {/* Card 1 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ color: 'var(--accent-danger)', background: 'rgba(244, 63, 94, 0.1)' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="card-title">Emergency Trauma Care</h3>
                  <span className="card-subtitle">Fast-Track Intake</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                Immediate stabilization and trauma management for critical emergency admissions. Featuring baseline registration and instantaneous bed setup.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="card-title">Advanced Cardiology</h3>
                  <span className="card-subtitle">Heart & Vascular</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                High-end cardiac diagnosis, monitoring, and surgical procedures led by nationally-acclaimed electrophysiologists and cardiologists.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ color: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="card-title">Intensive Care (ICU)</h3>
                  <span className="card-subtitle">Critical Monitoring</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                Fully equipped ICU beds with continuous smart vitals monitoring, respiratory assistance, and 24/7 dedicated critical nursing staff.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ color: 'var(--accent-info)', background: 'rgba(139, 92, 246, 0.1)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="card-title">Outpatient Clinics (OPD)</h3>
                  <span className="card-subtitle">General & Specialties</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                Comprehensive consultations across primary care, pediatrics, orthopedics, neurology, and internal medicine with simplified scheduling.
              </p>
            </div>

            {/* Card 5 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="card-title">Central EMR Diagnostics</h3>
                  <span className="card-subtitle">Path & Lab Tests</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                Rapid lab processing for blood panels, molecular analysis, MRI/CT imaging, and automated clinical reporting linked directly to patient records.
              </p>
            </div>

            {/* Card 6 */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="card-title">Automated Pharmacy</h3>
                  <span className="card-subtitle">Central Dispensary</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                Quick prescriptions dispensing with unified inpatient ledger links, eliminating outpatient checkouts for active inpatients.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#070a13', borderTop: '1px solid var(--border-primary)', padding: 'var(--space-2xl) var(--space-xl)', color: 'var(--text-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-2xl)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent-primary), #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={18} color="white" />
              </div>
              <h3 style={{ color: 'white', fontSize: 'var(--font-base)', fontWeight: 700 }}>Manasa Hospital</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', lineHeight: 1.6, maxWidth: '320px', marginBottom: 'var(--space-md)' }}>
              Providing cutting-edge, patient-centered clinical care backed by robust digitized system operations.
            </p>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()} Manasa HMS. All rights reserved.
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: 'var(--font-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Phone size={14} color="var(--accent-primary)" />
                <span>+1 (555) 839-2001</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Mail size={14} color="var(--accent-primary)" />
                <span>info@manasahospital.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                <MapPin size={14} color="var(--accent-primary)" style={{ marginTop: '3px' }} />
                <span>742 Medical Center Parkway,<br />Suite 100, New York, NY</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Portal Status</h4>
            <div style={{ fontSize: 'var(--font-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px', color: 'var(--accent-success)', fontWeight: 500, width: 'fit-content' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
                All Systems Operational
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                Database, EMR, and Inpatient ledger tracking nodes are fully synchronized.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
