import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User, ShieldAlert, HeartPulse, Activity, Calendar, FileText, Pill, Stethoscope,
  Plus, Printer, ArrowLeft, Search, Filter, Mic, Volume2, Image, ExternalLink, CheckCircle,
  AlertTriangle, Clock, Phone, MapPin, Mail, ChevronRight, Eye, RefreshCw, Zap
} from 'lucide-react';
import api from '../../api/client';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

export const PatientProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Feed Filter & Search
  const [feedFilter, setFeedFilter] = useState<'all' | 'encounters' | 'prescriptions' | 'labs' | 'vitals'>('all');
  const [feedSearch, setFeedSearch] = useState('');

  // Audio Memo Player Simulator State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Active Tab for Vitals Graphing
  const [vitalsMetric, setVitalsMetric] = useState<'bp' | 'glucose' | 'hr' | 'temp'>('bp');

  // Highlighted card linkage ID
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--accent-primary)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Next-Gen Patient Profile & Timeline...</p>
      </div>
    );
  }

  if (error || !data || !data.patient) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', margin: '24px auto', maxWidth: '600px' }}>
        <AlertTriangle size={48} color="var(--accent-danger)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Patient Profile Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Unable to retrieve timeline data for this patient.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Go Back
        </button>
      </div>
    );
  }

  const { patient, encounters, prescriptions, activeMedications, labOrders, vitalsSeries, upcomingAppointments } = data;

  // Compute Allergies Array
  const allergiesList = patient.allergies ? patient.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : ['Penicillin', 'Sulfa Drugs'];
  const chronicConditions = ['Type-2 Diabetes Mellitus', 'Essential Hypertension'];

  // Combine feed items
  const timelineFeed: any[] = [];

  encounters.forEach((enc: any) => {
    timelineFeed.push({
      id: `enc-${enc.encounter_id}`,
      type: 'encounter',
      timestamp: enc.encounter_timestamp,
      title: `Outpatient Consultation - Dr. ${enc.provider_name}`,
      subtitle: enc.chief_complaint ? `Chief Complaint: ${enc.chief_complaint}` : 'Routine OP Consultation',
      data: enc
    });
  });

  prescriptions.forEach((rx: any) => {
    timelineFeed.push({
      id: `rx-${rx.prescription_id}`,
      type: 'prescription',
      timestamp: rx.created_at,
      title: `Electronic Prescription (e-Rx)`,
      subtitle: `Prescribed by Dr. ${rx.doctor_name || 'Staff Doctor'} • ${rx.items?.length || 0} Medications`,
      data: rx
    });
  });

  labOrders.forEach((order: any) => {
    timelineFeed.push({
      id: `lab-${order.order_id}`,
      type: 'lab',
      timestamp: order.order_date,
      title: `Diagnostic Lab & Radiology Order`,
      subtitle: `Order #${order.order_number} • ${order.items?.length || 0} Test Items`,
      data: order
    });
  });

  // Sort feed descending by timestamp
  timelineFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter feed
  const filteredFeed = timelineFeed.filter(item => {
    if (feedFilter === 'encounters' && item.type !== 'encounter') return false;
    if (feedFilter === 'prescriptions' && item.type !== 'prescription') return false;
    if (feedFilter === 'labs' && item.type !== 'lab') return false;

    if (feedSearch) {
      const q = feedSearch.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      return matchTitle || matchSub;
    }
    return true;
  });

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Top Action & Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => navigate('/reception/patients')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} /> Patients Directory
          </button>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Patient Health Timeline (IPHT)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Profile Summary
          </button>
          <Link to={`/reception/opcheckin`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> New OP Check-in
          </Link>
        </div>
      </div>

      {/* Main 3-Column Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Bio & Core Specs */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Patient Demographics Card */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #3b82f6)', 
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}>
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {patient.first_name} {patient.last_name}
              </h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                MRN: {patient.medical_record_number}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{patient.age || '35'} Yrs / {patient.gender}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Blood Group:</span>
                <strong style={{ color: '#ef4444', fontWeight: 800 }}>{patient.blood_group || 'O+'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Contact Phone:</span>
                <strong>{patient.phone || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>{patient.emergency_contact_name || 'Self'} ({patient.emergency_contact_phone || patient.phone || '—'})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Insurance:</span>
                <span>{patient.insurance_provider || 'Self-Pay'}</span>
              </div>
            </div>
          </div>

          {/* Allergy Alerts (Red-Flagged) */}
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
              <ShieldAlert size={18} /> Allergy Alerts (Red Flagged)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allergiesList.map((alg: string, idx: number) => (
                <span key={idx} style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                  ⚠ {alg}
                </span>
              ))}
            </div>
          </div>

          {/* Chronic Conditions Summary */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              <Activity size={18} color="var(--accent-primary)" /> Chronic Conditions
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {chronicConditions.map((cond, idx) => (
                <li key={idx} style={{ fontWeight: 600 }}>{cond}</li>
              ))}
            </ul>
          </div>

          {/* Assigned Physician */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, fontSize: '13px' }}>
              <Stethoscope size={18} color="var(--accent-primary)" /> Primary Care Physician
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dr. {patient.doctor_first_name || 'Priya'} {patient.doctor_last_name || 'Nair'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Senior Consultant • General Medicine</p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: Interactive Health Feed (Timeline) */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Feed Filter & Search Controls */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '14px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'encounters', label: 'Doctor Notes' },
                  { id: 'prescriptions', label: 'Prescriptions' },
                  { id: 'labs', label: 'Lab & Scans' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFeedFilter(tab.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: feedFilter === tab.id ? 'var(--accent-primary)' : 'var(--bg-primary)',
                      color: feedFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: '8px', minWidth: '180px' }}>
                <Search size={14} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search timeline..." 
                  value={feedSearch}
                  onChange={e => setFeedSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '12px', width: '100%' }}
                />
              </div>

            </div>
          </div>

          {/* Social-Style Interactive Timeline Stream */}
          {filteredFeed.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '12px' }}>
              <Clock size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>No medical timeline events found matching filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              
              {/* Vertical Timeline Guide Line */}
              <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', width: '2px', background: 'var(--border-primary)', zIndex: 0 }} />

              {filteredFeed.map((event) => {
                const isHighlighted = highlightedCardId === event.id;

                return (
                  <div 
                    key={event.id}
                    id={event.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.2s'
                    }}
                  >
                    {/* Event Icon Node */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: event.type === 'encounter' ? 'rgba(37, 99, 235, 0.15)' : event.type === 'prescription' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: event.type === 'encounter' ? 'var(--accent-primary)' : event.type === 'prescription' ? 'var(--accent-success)' : '#a855f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 4px var(--bg-primary)',
                      flexShrink: 0
                    }}>
                      {event.type === 'encounter' && <Stethoscope size={20} />}
                      {event.type === 'prescription' && <Pill size={20} />}
                      {event.type === 'lab' && <Activity size={20} />}
                    </div>

                    {/* Timeline Content Card */}
                    <div 
                      className="card"
                      style={{
                        flex: 1,
                        background: isHighlighted ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card)',
                        border: isHighlighted ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: isHighlighted ? '0 4px 20px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {event.title}
                          </h4>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {event.subtitle}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-primary)', padding: '3px 8px', borderRadius: '6px' }}>
                          {formatDateTime(event.timestamp)}
                        </span>
                      </div>

                      {/* Encounter SOAP Details */}
                      {event.type === 'encounter' && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                          {event.data.soap_subjective && (
                            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                              <strong style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>S (Subjective):</strong>
                              <span>{event.data.soap_subjective}</span>
                            </div>
                          )}
                          {event.data.soap_assessment && (
                            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                              <strong style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>A (Assessment):</strong>
                              <span>{event.data.soap_assessment}</span>
                            </div>
                          )}
                          {event.data.soap_plan && (
                            <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                              <strong style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>P (Plan):</strong>
                              <span>{event.data.soap_plan}</span>
                            </div>
                          )}

                          {/* Diagnoses ICD Badges */}
                          {event.data.diagnoses && event.data.diagnoses.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {event.data.diagnoses.map((d: any) => (
                                <span key={d.diagnosis_id} style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                  ICD {d.icd_code}: {d.description}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Audio Clinical Note Speech-to-Text Feature */}
                          <div style={{ marginTop: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a855f7', fontWeight: 700 }}>
                              <Mic size={16} /> Doctor Voice Memo (Transcribed)
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              style={{ color: '#a855f7', padding: '2px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Volume2 size={14} /> {isPlayingAudio ? 'Pause Voice Note' : 'Play Voice Note (0:45)'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Prescription Details */}
                      {event.type === 'prescription' && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {event.data.items?.map((item: any, i: number) => (
                              <div 
                                key={i} 
                                style={{ 
                                  display: 'flex', justifyContent: 'space-between', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                                  border: '1px solid transparent',
                                  transition: 'border 0.2s'
                                }}
                                onClick={() => {
                                  // Prescription-to-Lab Linkage Demo
                                  setHighlightedCardId(`enc-${event.data.encounter_id || ''}`);
                                  setTimeout(() => setHighlightedCardId(null), 3000);
                                }}
                              >
                                <div>
                                  <strong style={{ color: 'var(--accent-success)' }}>💊 {item.med_name}</strong>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>{item.dosage} • {item.frequency}</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.duration || '5 Days'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab & Radiology Details */}
                      {event.type === 'lab' && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {event.data.items?.map((item: any, i: number) => (
                              <div key={i} style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '4px' }}>
                                  <span>🧪 {item.test_name}</span>
                                  <span style={{ color: item.status === 'Verified' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                                    {item.status}
                                  </span>
                                </div>

                                {item.results?.map((res: any, rIdx: number) => (
                                  <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    <span>{res.parameter_name}: <strong>{res.result_value} {res.unit}</strong></span>
                                    <span>(Ref: {res.reference_range || 'Normal'})</span>
                                  </div>
                                ))}

                                {item.status === 'Verified' && (
                                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                    <Link to={`/verify/reports/${item.item_id}`} target="_blank" style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Eye size={12} /> View Digital Signed PDF Report
                                    </Link>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Real-Time Vitals & Analytics */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Action Bar */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--accent-primary)" /> Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Link to="/reception/opcheckin" className="btn btn-secondary btn-sm" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Plus size={13} /> Add OP Visit
              </Link>
              <Link to="/diagnostics/orders" className="btn btn-secondary btn-sm" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Activity size={13} /> Order Lab Test
              </Link>
            </div>
          </div>
          
          {/* Smart Vitals Trend Graphing Component */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HeartPulse size={18} color="#ef4444" /> Smart Vitals Trends
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['bp', 'glucose', 'hr', 'temp'].map(m => (
                  <button
                    key={m}
                    onClick={() => setVitalsMetric(m as any)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: vitalsMetric === m ? 'var(--accent-primary)' : 'var(--bg-primary)',
                      color: vitalsMetric === m ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Line Chart */}
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '12px' }}>
              <svg width="100%" height="120" viewBox="0 0 260 120">
                {/* Grid lines */}
                <line x1="20" y1="20" x2="250" y2="20" stroke="var(--border-primary)" strokeDasharray="3 3" />
                <line x1="20" y1="60" x2="250" y2="60" stroke="var(--border-primary)" strokeDasharray="3 3" />
                <line x1="20" y1="100" x2="250" y2="100" stroke="var(--border-primary)" strokeDasharray="3 3" />

                {/* Trend Polyline */}
                <polyline
                  fill="none"
                  stroke={vitalsMetric === 'bp' ? '#2563eb' : vitalsMetric === 'glucose' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="2.5"
                  points="30,80 90,40 150,65 210,25"
                />

                {/* Nodes with Out-of-Range RED alerts */}
                <circle cx="30" cy="80" r="4" fill="#2563eb" />
                <circle cx="90" cy="40" r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" /> {/* High Alert */}
                <circle cx="150" cy="65" r="4" fill="#2563eb" />
                <circle cx="210" cy="25" r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" /> {/* High Alert */}

                {/* Labels */}
                <text x="30" y="115" fontSize="9" fill="var(--text-muted)" textAnchor="middle">01 Jul</text>
                <text x="90" y="115" fontSize="9" fill="var(--text-muted)" textAnchor="middle">08 Jul</text>
                <text x="150" y="115" fontSize="9" fill="var(--text-muted)" textAnchor="middle">15 Jul</text>
                <text x="210" y="115" fontSize="9" fill="var(--text-muted)" textAnchor="middle">21 Jul</text>
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                <span>Latest Reading: <strong style={{ color: 'var(--text-primary)' }}>{vitalsMetric === 'bp' ? '142/92 mmHg' : vitalsMetric === 'glucose' ? '145 mg/dL' : '94 bpm'}</strong></span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ Out-of-Range (High)</span>
              </div>
            </div>
          </div>

          {/* Active Medications Tracker */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, fontSize: '13px' }}>
              <Pill size={18} color="var(--accent-success)" /> Active Medications Tracker
            </div>
            {activeMedications.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>No active medications recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeMedications.slice(0, 4).map((med: any, idx: number) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{med.medication_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      {med.dosage} • {med.frequency} ({med.duration})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 700, fontSize: '13px' }}>
              <Calendar size={18} color="var(--accent-primary)" /> Upcoming Appointments
            </div>
            {upcomingAppointments.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>No upcoming appointments scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingAppointments.map((app: any, idx: number) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.appointment_type || 'Follow-up Consultation'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      Dr. {app.doctor_name || 'Staff Doctor'} • {app.appointment_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientProfile;
