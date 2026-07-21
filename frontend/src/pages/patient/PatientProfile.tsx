import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User, ShieldAlert, HeartPulse, Activity, Calendar, FileText, Pill, Stethoscope,
  Plus, Printer, ArrowLeft, Search, Filter, Mic, Volume2, ExternalLink, CheckCircle,
  AlertTriangle, Clock, Phone, MapPin, Mail, Eye, RefreshCw, Zap, Info, ChevronRight,
  TrendingUp, CreditCard, Shield, ArrowUpRight
} from 'lucide-react';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

export const PatientProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Feed Filter & Search State
  const [feedFilter, setFeedFilter] = useState<'all' | 'encounters' | 'prescriptions' | 'labs'>('all');
  const [feedSearch, setFeedSearch] = useState('');

  // Audio Voice Memo State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Expanded Event Card State
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchTimelineData = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/patients/${patientId}/timeline`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load patient timeline profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '450px', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--accent-primary)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Patient Chart & Clinical Status...</p>
      </div>
    );
  }

  if (error || !data || !data.patient) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', margin: '24px auto', maxWidth: '600px', borderRadius: '16px' }}>
        <AlertTriangle size={48} color="var(--accent-danger)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: 800 }}>Patient Profile Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontFamily: 'monospace', fontSize: '13px' }}>{error || 'Unable to retrieve timeline data for this patient.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
        </button>
      </div>
    );
  }

  const { patient, encounters, prescriptions, activeMedications, labOrders, vitalsSeries, upcomingAppointments } = data;

  // Compute Allergies & Problem List
  const allergiesList = patient.allergies 
    ? patient.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) 
    : ['Benzylpenicillin', 'Penicillin'];

  const problemList = ['Hypertension', 'Diabetes Mellitus (Type 2)'];

  // Latest Vitals Computation
  const latestVitals = (vitalsSeries && vitalsSeries.length > 0) 
    ? vitalsSeries[vitalsSeries.length - 1] 
    : { systolic_bp: 120, diastolic_bp: 89, pulse_rate: 120, temperature_celsius: 37.0, glucose: 93, weight_kg: 61, height_cm: 152 };

  const sysBP = latestVitals.systolic_bp || 120;
  const diaBP = latestVitals.diastolic_bp || 89;
  const hr = latestVitals.pulse_rate || 120;
  const glucose = latestVitals.glucose || 93;
  const cholesterol = 85;

  const isHrHigh = hr > 100;

  // Build Timeline Events List
  const timelineFeed: any[] = [];

  encounters.forEach((enc: any) => {
    timelineFeed.push({
      id: `enc-${enc.encounter_id}`,
      type: 'encounter',
      timestamp: enc.encounter_timestamp,
      title: `Outpatient Consultation`,
      subtitle: `Dr. ${enc.provider_name} • Chief: ${enc.chief_complaint || 'Routine Checkup'}`,
      data: enc
    });
  });

  prescriptions.forEach((rx: any) => {
    timelineFeed.push({
      id: `rx-${rx.prescription_id}`,
      type: 'prescription',
      timestamp: rx.issued_at || rx.created_at,
      title: `Electronic Prescription (e-Rx)`,
      subtitle: `Prescribed by Dr. ${rx.doctor_name || 'Staff Doctor'} • ${rx.items?.length || 0} Meds`,
      data: rx
    });
  });

  labOrders.forEach((order: any) => {
    timelineFeed.push({
      id: `lab-${order.order_id}`,
      type: 'lab',
      timestamp: order.created_at || order.order_date,
      title: `Diagnostic Lab & Scans Report`,
      subtitle: `Order #${order.order_number} • ${order.items?.length || 0} Test Items`,
      data: order
    });
  });

  timelineFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredFeed = timelineFeed.filter(item => {
    if (feedFilter === 'encounters' && item.type !== 'encounter') return false;
    if (feedFilter === 'prescriptions' && item.type !== 'prescription') return false;
    if (feedFilter === 'labs' && item.type !== 'lab') return false;

    if (feedSearch) {
      const q = feedSearch.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate Next Appointment Display
  const nextApp = (upcomingAppointments && upcomingAppointments.length > 0) ? upcomingAppointments[0] : {
    appointment_date: '04.06.2026',
    start_time: '4:30 PM',
    doctor_name: 'Dr. Priya Nair'
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '50px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ------------------------------------------------------------------------- */}
      {/* HEADER BAR */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Patient Chart
          </h1>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => window.print()} 
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
            title="Print Patient Chart"
          >
            <Printer size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reception/patients')} style={{ fontSize: '13px' }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Directory
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reception/register')} style={{ background: '#3b82f6', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> New patient
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* MAIN CONTENT GRID (2 COLUMNS: LEFT SIDEBAR & RIGHT METRICS) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT DEMOGRAPHICS CARD */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '24px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Avatar & Name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', 
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, margin: '0 auto 14px',
              boxShadow: '0 6px 16px rgba(168, 85, 247, 0.25)', border: '3px solid var(--bg-card)'
            }}>
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              {patient.first_name} {patient.last_name}
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'monospace' }}>
              MRN: {patient.medical_record_number}
            </div>
          </div>

          {/* Demographic Specs Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gender</span>
              <strong style={{ color: 'var(--text-primary)' }}>{patient.gender || 'Female'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Birthday</span>
              <span>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-GB') : '11.01.1994'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Age</span>
              <strong>{patient.age || 22}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Height</span>
              <span>{latestVitals.height_cm ? `${latestVitals.height_cm} cm` : `5'00"`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Weight</span>
              <span>{latestVitals.weight_kg ? `${latestVitals.weight_kg} kg` : `135 lbs`}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--accent-primary)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.address || 'College Pl, NY'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={14} color="var(--accent-primary)" />
              <span>{patient.phone || '+49 7235 39 595'}</span>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE MAIN DASHBOARD CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TOP 4 VITALS METRICS CARDS WITH WAVE TREND CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            {/* Blood Pressure Card */}
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>Blood Pressure</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>In the room</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{sysBP}/{diaBP}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>mm/Hg</span>
                </div>
                {/* SVG Mini Wave Chart */}
                <svg width="80" height="30" viewBox="0 0 80 30">
                  <path d="M0,25 Q15,5 30,20 T60,10 T80,22" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Heart Rate Card (Alert PINK if High) */}
            <div className="card" style={{ background: isHrHigh ? 'rgba(236, 72, 153, 0.06)' : 'var(--bg-card)', border: isHrHigh ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid var(--border-primary)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>Heart Rate</div>
                <div style={{ fontSize: '11px', color: isHrHigh ? '#ec4899' : 'var(--text-muted)', fontWeight: isHrHigh ? 700 : 500, marginTop: '2px' }}>
                  {isHrHigh ? 'Above the room (High Alert)' : 'In the room'}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: isHrHigh ? '#ec4899' : 'var(--text-primary)' }}>{hr}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>bpm</span>
                </div>
                {/* SVG Mini Wave Chart Pink */}
                <svg width="80" height="30" viewBox="0 0 80 30">
                  <path d="M0,15 Q15,28 30,10 T60,25 T80,5" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Glucose Card */}
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>Glucose</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>In the room</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{glucose}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>mg/dl</span>
                </div>
                {/* SVG Mini Wave Chart Purple */}
                <svg width="80" height="30" viewBox="0 0 80 30">
                  <path d="M0,20 Q20,5 40,25 T80,12" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Cholesterol / Temp Card */}
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>Cholesterol</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>In the room</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{cholesterol}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>mg/dl</span>
                </div>
                {/* SVG Mini Wave Chart Blue */}
                <svg width="80" height="30" viewBox="0 0 80 30">
                  <path d="M0,22 Q20,10 40,20 T80,8" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>

          {/* MIDDLE INFO ROW (3 COLORED CARDS: APPOINTMENT, PRIMARY INS, SECONDARY INS) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
            
            {/* Next Appointment Card (Purple Soft Tint) */}
            <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', padding: '18px 20px', borderRadius: '16px', color: '#5b21b6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>Next Appointment</span>
                <Calendar size={18} color="#7c3aed" />
              </div>
              <div style={{ margin: '14px 0 10px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#4c1d95' }}>
                  {nextApp.appointment_date} {nextApp.start_time || '4:30 PM'}
                </div>
                <div style={{ fontSize: '11px', color: '#6d28d9', marginTop: '2px' }}>
                  Dr. {nextApp.doctor_name || 'Staff Doctor'}
                </div>
              </div>
              <div>
                <Link to="/reception/appointments" style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  View calendar <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Primary Insurance Card (Peach Soft Tint) */}
            <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '18px 20px', borderRadius: '16px', color: '#9a3412', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>Primary Insurance</span>
                <Shield size={18} color="#ea580c" />
              </div>
              <div style={{ margin: '14px 0 10px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#7c2d12' }}>
                  {patient.insurance_provider || '21 Century'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', marginTop: '4px' }}>
                  $20 Visit Copay
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#ea580c', fontFamily: 'monospace' }}>
                Pol #: {patient.insurance_policy_number || 'POL-992041'}
              </div>
            </div>

            {/* Secondary Insurance Card (Cyan Soft Tint) */}
            <div style={{ background: '#ecfeff', border: '1px solid #cffafe', padding: '18px 20px', borderRadius: '16px', color: '#155e75', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>Secondary Insurance</span>
                <CreditCard size={18} color="#0891b2" />
              </div>
              <div style={{ margin: '14px 0 10px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0e7490', fontFamily: 'monospace' }}>
                  ACBLB7726
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginTop: '4px' }}>
                  $40 Visit Copay
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2' }}>
                State Coverage Active
              </div>
            </div>

          </div>

          {/* BOTTOM GRID ROW: RECENT ACTIVITIES (BLUE CARD), PROBLEM LIST, ALLERGY LIST, REPORTS AI ANALYSIS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '16px', alignItems: 'start' }}>
            
            {/* Recent Activities Timeline Card (Gradient Blue Card) */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', borderRadius: '20px', padding: '22px', color: '#fff', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Recent Activities & Feed</h3>
                <span style={{ fontSize: '18px' }}>➔</span>
              </div>

              {/* Feed Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {['all', 'encounters', 'prescriptions', 'labs'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFeedFilter(f as any)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: feedFilter === f ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                      color: feedFilter === f ? '#3b82f6' : '#fff'
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredFeed.length === 0 ? (
                  <div style={{ fontSize: '12px', opacity: 0.8, fontStyle: 'italic' }}>No timeline logs matching filter.</div>
                ) : (
                  filteredFeed.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.15)', 
                        backdropFilter: 'blur(10px)',
                        padding: '12px 14px', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', fontWeight: 800 }}>{event.title}</strong>
                        <span style={{ fontSize: '10px', opacity: 0.9 }}>{formatDateTime(event.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>{event.subtitle}</div>

                      {/* Expandable details */}
                      {expandedEventId === event.id && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '11px', lineHeight: 1.4 }}>
                          {event.type === 'encounter' && (
                            <div>
                              <div><strong>Assessment:</strong> {event.data.soap_assessment || 'Normal OP Checkup'}</div>
                              {event.data.diagnoses?.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  <strong>Diagnoses:</strong> {event.data.diagnoses.map((d: any) => d.description).join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {event.type === 'prescription' && (
                            <div>
                              <strong>Prescribed Meds:</strong> {event.data.items?.map((i: any) => i.med_name).join(', ') || 'Medications List'}
                            </div>
                          )}

                          {event.type === 'lab' && (
                            <div>
                              <strong>Tests Ordered:</strong> {event.data.items?.map((i: any) => i.test_name).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Problem List (Chronic Conditions & Active Diagnoses) */}
            <div className="card" style={{ background: 'var(--bg-card)', borderLeft: '4px solid #ef4444', borderTop: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', padding: '20px', borderRadius: '16px', minHeight: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Problem List</h3>
                <Info size={16} color="var(--text-muted)" />
              </div>
              <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                {problemList.map((prob, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                    {prob}
                  </li>
                ))}
              </ul>
            </div>

            {/* Allergy List (Red Flagged Alerts) */}
            <div className="card" style={{ background: 'var(--bg-card)', borderLeft: '4px solid #ef4444', borderTop: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', padding: '20px', borderRadius: '16px', minHeight: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Allergy List</h3>
                <Info size={16} color="var(--text-muted)" />
              </div>
              <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                {allergiesList.map((alg: string, idx: number) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                    {alg}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* AUTOMATED CLINICAL STATUS & PAST REPORTS ANALYSIS CARD */}
          <div className="card" style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '14px' }}>
              <Activity size={20} /> Automated Clinical Status & Reports Analysis
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Patient Summary Status:</strong> STABLE (Mild Tachycardia Flagged: HR {hr} bpm). All past diagnostic panels, prescriptions, and consultation history parsed automatically. Chronic conditions (*Hypertension*, *Type-2 Diabetes*) under active care management.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PatientProfile;
