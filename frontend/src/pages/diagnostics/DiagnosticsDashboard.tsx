import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Beaker, CheckSquare, Play, Award, 
  AlertTriangle, DollarSign, RefreshCw, Layers, Tool, 
  Users, Activity, ChevronRight 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const DiagnosticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/diagnostics/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load diagnostics stats:', err);
      setError('Unable to fetch diagnostics performance stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <RefreshCw size={36} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading Diagnostics Dashboard...</span>
      </div>
    );
  }

  const kpis = [
    { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: ClipboardList, color: 'var(--accent-primary)', bg: 'rgba(14,165,233,0.08)' },
    { label: 'Pending Samples', value: stats?.pendingSamples ?? 0, icon: Beaker, color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Collected Samples', value: stats?.collectedSamples ?? 0, icon: CheckSquare, color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Running Tests', value: stats?.runningTests ?? 0, icon: Play, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { label: 'Completed Reports', value: stats?.completedReports ?? 0, icon: Award, color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Pending Verification', value: stats?.pendingVerification ?? 0, icon: AlertTriangle, color: 'var(--accent-danger)', bg: 'rgba(244,63,94,0.08)' },
    { label: "Today's Revenue", value: `Rs. ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Emergency Cases', value: stats?.emergencyCases ?? 0, icon: Activity, color: 'var(--accent-danger)', bg: 'rgba(244,63,94,0.08)' }
  ];

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beaker size={28} color="var(--accent-primary)" />
            Diagnostics Management Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Enterprise Laboratory Information System & Imaging Dashboard
          </p>
        </div>
        <Button variant="secondary" onClick={fetchStats} icon={<RefreshCw size={14} />}>
          Refresh Stats
        </Button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--accent-danger)', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {kpi.label}
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', background: kpi.bg, color: kpi.color, display: 'flex' }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
                {kpi.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Navigation Panel */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Diagnostic Module Quick Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Test Ordering', desc: 'Place new laboratory & imaging scan requests', path: '/diagnostics/orders', color: 'var(--accent-primary)' },
            { title: 'Workspaces', desc: 'Sample Collection, Lab Result entry & report verification', path: '/diagnostics/workspaces', color: '#8b5cf6' },
            { title: 'Service Catalog', desc: 'Configure tests, normal reference ranges & packages', path: '/diagnostics/catalog', color: '#10b981' },
            { title: 'Equipment & QC', desc: 'Manage diagnostic analyzers, calibration & daily quality control logs', path: '/diagnostics/equipment', color: '#f59e0b' },
            { title: 'Referral Doctors & Billing', desc: 'Calculate referral doctor commissions & manage billing', path: '/diagnostics/billing', color: 'var(--accent-danger)' }
          ].map((lnk, idx) => (
            <div 
              key={idx}
              onClick={() => navigate(lnk.path)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = lnk.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{lnk.title}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{lnk.desc}</p>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts & Productivity Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Department Distribution */}
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700 }}>Department-wise Diagnostic Load</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats?.charts?.departments && stats.charts.departments.length > 0 ? (
              stats.charts.departments.map((dept: any, index: number) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    <span>{dept.department}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{dept.count} Tests</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        background: 'var(--accent-primary)', 
                        width: `${Math.min(100, (dept.count / Math.max(1, ...stats.charts.departments.map((d: any) => d.count))) * 100)}%`,
                        borderRadius: '10px'
                      }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                No department distribution data available.
              </div>
            )}
          </div>
        </Card>

        {/* Volume trend */}
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700 }}>Daily Diagnostics Order Volume</h3>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', paddingBottom: '12px', borderBottom: '1px solid var(--border-primary)' }}>
              {stats?.charts?.volume && stats.charts.volume.length > 0 ? (
                stats.charts.volume.map((day: any, idx: number) => {
                  const maxCount = Math.max(1, ...stats.charts.volume.map((v: any) => v.count));
                  const pct = (day.count / maxCount) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>{day.count}</span>
                      <div 
                        style={{ 
                          width: '24px', 
                          height: `${Math.max(15, pct)}px`, 
                          background: 'rgba(14,165,233,0.7)', 
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.5s'
                        }} 
                      />
                    </div>
                  );
                })
              ) : (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No order volume history available.
                </div>
              )}
            </div>
            {/* X Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0 8px' }}>
              {stats?.charts?.volume?.map((day: any, idx: number) => (
                <span key={idx} style={{ fontSize: '10px', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
                  {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default DiagnosticsDashboard;
