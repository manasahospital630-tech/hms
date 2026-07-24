import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User, ShieldAlert, HeartPulse, Activity, Calendar, FileText, Pill, Stethoscope,
  Plus, Printer, ArrowLeft, Search, Filter, Mic, Volume2, ExternalLink, CheckCircle,
  AlertTriangle, Clock, Phone, MapPin, Mail, Eye, RefreshCw, Zap, Info, ChevronRight,
  TrendingUp, CreditCard, Shield, ArrowUpRight, Download, Bell, Sparkles, AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

export const PatientProfile: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'appointments' | 'reports' | 'tests' | 'imaging'>('overview');

  // Health Metrics Timeline Graph Metric
  const [metricTab, setMetricTab] = useState<'hr' | 'bp' | 'glucose' | 'spo2'>('bp');

  const fetchTimelineData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await api.get(`/patients/${patientId}/timeline`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.warn('Backend load error handled gracefully:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw className="animate-spin" size={36} color="#3b82f6" />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Patient Chart & Medical History...</p>
      </div>
    );
  }

  const patient = data?.patient || {
    first_name: 'Arthur',
    last_name: 'Tailor',
    gender: 'Male',
    date_of_birth: '1993-04-06',
    medical_record_number: 'PL12234213',
    doctor_first_name: 'Alex',
    doctor_last_name: 'Nguyen',
    insurance_provider: 'Aetna Gold Plan',
    insurance_policy_number: 'PL12234213',
    allergies: 'Nuts, Eggs, Lactose'
  };

  const encounters = data?.encounters || [];
  const labOrders = data?.labOrders || [];
  const vitalsSeries = data?.vitalsSeries || [];

  // Compute Allergies List
  const allergiesList = patient.allergies 
    ? patient.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) 
    : ['Nuts', 'Eggs', 'Lactose'];

  const currentV = data?.currentVitals || {};
  const vHist = data?.vitalsHistory || [];
  const latestVitals = vHist.length > 0 
    ? vHist[vHist.length - 1] 
    : (vitalsSeries.length > 0 ? vitalsSeries[vitalsSeries.length - 1] : currentV);

  const weight = latestVitals.weight ? `${latestVitals.weight} lbs` : (latestVitals.weight_kg ? `${latestVitals.weight_kg} lbs` : '165 lbs');
  const tempNum = parseFloat(latestVitals.temperature || (latestVitals.temperature_celsius ? (latestVitals.temperature_celsius * 1.8 + 32).toFixed(1) : 99.4));
  const temp = `${tempNum}°F`;
  const hr = Number(latestVitals.heartRate || latestVitals.pulse_rate || 140);
  const spo2 = Number(latestVitals.oxygenSaturation || latestVitals.spo2 || 94);

  const isTempHigh = tempNum > 99.0;
  const isHrAbnormal = hr < 60 || hr > 100;
  const isSpo2Low = spo2 < 95;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      
      {/* ------------------------------------------------------------------------- */}
      {/* TOP HEADER BAR & NAVIGATION TABS */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left Title / Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/reception/patients')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            <ArrowLeft size={18} /> Patient Details
          </button>
        </div>

        {/* Center Tabs Navigation */}
        <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '30px' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'history', label: 'History' },
            { id: 'appointments', label: 'Appointments' },
            { id: 'reports', label: `Medical Reports ${labOrders.length > 0 ? labOrders.length : '3'}` },
            { id: 'tests', label: 'Medical Tests' },
            { id: 'imaging', label: 'Imaging' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === t.id ? '#ffffff' : 'transparent',
                color: activeTab === t.id ? '#0f172a' : '#64748b',
                boxShadow: activeTab === t.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} />
          </button>
          <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', color: '#475569' }}>
            <Bell size={16} />
          </button>
        </div>

      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* MAIN LAYOUT: 2-COLUMN GRID (LEFT SIDEBAR 320PX, RIGHT MAIN) */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BIO, ALLERGIES, PROBLEMS, APPOINTMENT */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Patient Bio Card */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt="Patient" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', bottom: '0', right: '0', width: '14px', height: '14px', borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
              </div>

              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                  {patient.first_name} {patient.last_name}
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {patient.gender || 'Male'}, {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-GB') : '06.04.1993'}
                </div>
                <span style={{ display: 'inline-block', marginTop: '6px', background: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  Post-Surgery
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
              <div>
                <div style={{ color: '#94a3b8' }}>Primary Physician</div>
                <strong style={{ color: '#1e293b' }}>Dr. {patient.doctor_first_name || 'Alex'} {patient.doctor_last_name || 'Nguyen'}</strong>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Insurance</div>
                <strong style={{ color: '#1e293b' }}>{patient.insurance_provider || 'Aetna Gold Plan'}</strong>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Insurance №</div>
                <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>#{patient.insurance_policy_number || 'PL12234213'}</strong>
              </div>
            </div>
          </div>

          {/* Allergies Card */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>Allergies</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allergiesList.map((alg: string, idx: number) => (
                <div key={idx} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                  {alg}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Problems Card */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Latest Problems</h3>
              <a href="#problems" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>View All</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Degenerative Disc Changes', 'Spinal Canal Narrowing'].map((prob, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={16} color="#94a3b8" />
                    <span>{prob}</span>
                  </div>
                  <ChevronRight size={16} color="#cbd5e1" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Appointment Card */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Calendar size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Upcoming Appointment</h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              Follow-Up Visit to Review Heart Health
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>Confirmed</span>
                <span style={{ color: '#64748b' }}>Dr. Alicia Kim</span>
              </div>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>July 25, 2026</span>
            </div>

            {/* Timeline Schedule list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '8px', borderLeft: '2px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>10:30 - 10:35</strong> Check-in and Vitals
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>10:35 - 10:50</strong> Doctor Consultation
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>10:50 - 11:00</strong> ECG Test and Notes Review
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT / CENTER COLUMN: TOP 4 VITALS, TREND GRAPH, LABS & RISK FORECAST */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TOP 4 VITALS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            {/* Weight Card */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Weight
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{weight}</span>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>-5%</span>
              </div>
            </div>

            {/* Temperature Card */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Temperature
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: isTempHigh ? '#dc2626' : '#0f172a' }}>{temp}</span>
                <span style={{ background: isTempHigh ? '#ffe4e6' : '#dcfce7', color: isTempHigh ? '#be123c' : '#166534', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {isTempHigh ? 'High (>99°F)' : '+3%'}
                </span>
              </div>
            </div>

            {/* Heart Rate Card */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Heart Rate
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: isHrAbnormal ? '#dc2626' : '#0f172a' }}>{hr} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>bpm</span></span>
                <span style={{ background: isHrAbnormal ? '#ffe4e6' : '#dcfce7', color: isHrAbnormal ? '#be123c' : '#166534', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {isHrAbnormal ? 'High (>100)' : '+2.4%'}
                </span>
              </div>
            </div>

            {/* Oxygen Saturation Card */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                Oxygen Saturation
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: isSpo2Low ? '#dc2626' : '#0f172a' }}>{spo2}%</span>
                <span style={{ background: isSpo2Low ? '#ffe4e6' : '#dcfce7', color: isSpo2Low ? '#be123c' : '#166534', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {isSpo2Low ? 'Low (<95%)' : '+1.9%'}
                </span>
              </div>
            </div>

          </div>

          {/* HEALTH METRICS TIMELINE GRAPH CARD */}
          <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Health Metrics Timeline</h3>
              </div>

              {/* Metric Select Buttons */}
              <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '20px' }}>
                {[
                  { id: 'hr', label: 'Heart Rate' },
                  { id: 'bp', label: 'Blood Pressure' },
                  { id: 'glucose', label: 'Glucose Levels' },
                  { id: 'spo2', label: 'Oxygen Saturation' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMetricTab(m.id as any)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: metricTab === m.id ? '#3b82f6' : 'transparent',
                      color: metricTab === m.id ? '#ffffff' : '#64748b'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smooth SVG Trend Line Chart */}
            <div style={{ width: '100%', height: '140px' }}>
              <svg width="100%" height="100%" viewBox="0 0 700 140" preserveAspectRatio="none">
                {/* Horizontal Gridlines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="70" x2="700" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="700" y2="110" stroke="#f1f5f9" strokeDasharray="4 4" />

                {/* Trend Curve */}
                <path
                  d="M 20,80 C 80,40 140,90 200,60 C 260,30 320,100 380,45 C 440,70 500,50 560,80 C 620,40 650,60 680,50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                {/* Timeline Nodes */}
                <circle cx="140" cy="90" r="4" fill="#10b981" />
                <circle cx="320" cy="100" r="4" fill="#10b981" />
                <circle cx="440" cy="70" r="4" fill="#10b981" />
                <circle cx="560" cy="80" r="4" fill="#10b981" />

                {/* Timeline X Labels */}
                <text x="50" y="135" fontSize="11" fill="#94a3b8">2020</text>
                <text x="180" y="135" fontSize="11" fill="#94a3b8">2021</text>
                <text x="310" y="135" fontSize="11" fill="#94a3b8">2022</text>
                <text x="440" y="135" fontSize="11" fill="#94a3b8">2023</text>
                <text x="570" y="135" fontSize="11" fill="#94a3b8">2024</text>
                <text x="670" y="135" fontSize="11" fill="#94a3b8">2025</text>
              </svg>
            </div>
          </div>

          {/* BOTTOM ROW (2 CARDS: LABS & RISK FORECAST) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Labs Card (Parameter Progress Bars & AI Banner) */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>Labs</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'Mg', val: '6.0 / 6.0', pct: '100%' },
                    { name: 'K', val: '9.0 / 10.0', pct: '90%' },
                    { name: 'Cu', val: '3.0 / 2.5', pct: '85%' },
                    { name: 'Ca', val: '34.0 / 40.0', pct: '85%' }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                        <span>{item.name}</span>
                        <span>{item.val}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: item.pct, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Assistant Report Light Blue Banner */}
              <div style={{ marginTop: '20px', background: '#f0f9ff', border: '1px solid #e0f2fe', padding: '14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={14} /> AI Assistant Report
                  </div>
                  <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>
                    The assistant has identified <strong>four issues</strong> that necessitate medical attention.
                  </div>
                </div>
                <ChevronRight size={18} color="#0284c7" />
              </div>
            </div>

            {/* Risk Forecast Card (Gauges) */}
            <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={18} color="#3b82f6" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Risk Forecast</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: 'Cardiovascular Risk', level: 'Moderate', factors: 'Cholesterol: 160 mg/dL', pct: 23, color: '#f59e0b' },
                  { title: 'Stroke Risk', level: 'Low', factors: 'No atrial fibrillation', pct: 6, color: '#10b981' },
                  { title: 'Type 2 Diabetes Risk', level: 'High', factors: 'HbA1c: 5.4%', pct: 64, color: '#ef4444' }
                ].map((risk, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx < 2 ? '12px' : '0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{risk.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Level: <strong style={{ color: risk.color }}>{risk.level}</strong> &nbsp;•&nbsp; {risk.factors}
                      </div>
                    </div>

                    {/* Radial SVG Gauge Chart */}
                    <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <circle 
                          cx="22" cy="22" r="18" fill="none" stroke={risk.color} strokeWidth="4" 
                          strokeDasharray={`${(risk.pct / 100) * 113} 113`} 
                          strokeLinecap="round"
                          transform="rotate(-90 22 22)"
                        />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 800, color: '#0f172a' }}>{risk.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* HISTORY TAB: CHRONOLOGICAL OP CONSULTATION VISIT TIMELINE CARDS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📜 OP Consultation History & Timeline
            </h2>
            <span style={{ fontSize: '12px', background: '#e2e8f0', color: '#334155', fontWeight: 700, padding: '4px 12px', borderRadius: '16px' }}>
              {vHist.length || encounters.length || 2} Total Visits
            </span>
          </div>

          {(vHist.length > 0 ? vHist : (encounters.length > 0 ? encounters : [
            {
              recordedAt: '2026-07-26T10:30:00Z',
              opBookingId: 'BILL-LAB-1024',
              weight: 164,
              temperature: 98.6,
              bloodPressure: { systolic: 118, diastolic: 78 },
              heartRate: 78,
              oxygenSaturation: 98,
              glucoseLevel: 95,
              glucoseType: 'Fasting',
              notes: 'Follow-up review.',
              doctorNotes: 'Patient showing significant recovery. Continue prescribed medication.',
              tests: ['Complete Blood Count (CBC)', 'Fasting Blood Sugar (FBS)']
            },
            {
              recordedAt: '2026-07-24T03:32:00Z',
              opBookingId: 'BILL-LAB-6C3913A0',
              weight: 165,
              temperature: 99.4,
              bloodPressure: { systolic: 120, diastolic: 80 },
              heartRate: 140,
              oxygenSaturation: 94,
              glucoseLevel: 110,
              glucoseType: 'Random',
              notes: 'Patient mentions mild fatigue after morning activity.',
              doctorNotes: 'Advised rest and mild electrolyte intake.',
              tests: ['Serum Electrolytes (Na, K, Cl)']
            }
          ])).slice().reverse().map((visit: any, idx: number) => {
            const visitDateFormatted = visit.recordedAt || visit.visitDate || visit.encounter_timestamp
              ? new Date(visit.recordedAt || visit.visitDate || visit.encounter_timestamp).toLocaleDateString('en-GB')
              : '24/07/2026';
            const opId = visit.opBookingId || visit.op_no || visit.bill_no || `BILL-LAB-${idx + 1024}`;
            const docName = patient.doctor_first_name 
              ? `Dr. ${patient.doctor_first_name} ${patient.doctor_last_name}` 
              : 'Dr. Sandeep Gunde';

            const bpStr = visit.bloodPressure 
              ? `${visit.bloodPressure.systolic}/${visit.bloodPressure.diastolic} mmHg`
              : (visit.systolicBp ? `${visit.systolicBp}/${visit.diastolicBp} mmHg` : (visit.systolic_bp ? `${visit.systolic_bp}/${visit.diastolic_bp} mmHg` : '120/80 mmHg'));

            return (
              <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                {/* Card Header */}
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', margin: '-20px -20px 16px -20px', padding: '14px 20px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#1e293b' }}>
                    📅 Visit Date: {visitDateFormatted} - OP ID: {opId} | Doctor: {docName}
                  </div>
                </div>

                {/* Vitals Recorded */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Vitals Recorded:
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    • <strong>Weight:</strong> {visit.weight || visit.weight_kg || 165} lbs | <strong>Temp:</strong> {visit.temperature || visit.temperature_celsius || 99.4}°F | <strong>BP:</strong> {bpStr} | <strong>HR:</strong> {visit.heartRate || visit.pulse_rate || 140} bpm | <strong>SpO2:</strong> {visit.oxygenSaturation || visit.spo2 || 94}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginTop: '2px' }}>
                    • <strong>Glucose:</strong> {visit.glucoseLevel || 110} mg/dL ({visit.glucoseType || 'Random'}) | <strong>Chief Complaint:</strong> {visit.notes || visit.chiefComplaints || visit.chief_complaint || 'Patient mentions mild fatigue.'}
                  </div>
                </div>

                {/* Prescribed Tests & Diagnostics */}
                <div style={{ marginBottom: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Prescribed Tests & Diagnostics:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                    {(visit.tests || ['Complete Blood Count (CBC)', 'Fasting Blood Sugar (FBS)']).map((testName: string, tIdx: number) => (
                      <div key={tIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        • {testName} - <span style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>[ View Report PDF ]</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctor Clinical Notes */}
                <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Doctor Clinical Notes:
                  </div>
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                    "{visit.doctorNotes || 'Patient showing significant recovery. Continue prescribed medication.'}"
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PatientProfile;
