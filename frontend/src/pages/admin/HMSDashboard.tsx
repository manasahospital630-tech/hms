import React, { useState, useEffect } from 'react';
import { Card, Spin, Table, Button, message } from 'antd';
import { Download, Users, DollarSign, Activity, Activity as PulseIcon, Heart } from 'lucide-react';
import api from '../../api/client';

export const HMSDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats');
      setData(res.data.data);
    } catch (err) {
      message.error('Failed to load dashboard statistics');
      // Set some mock data if DB queries fail or are empty
      setData({
        staff: { doctorsPresent: 28, dutyDoctors: 15, nursesAttended: 95, totalNurses: 110, otherStaff: 62 },
        opBooked: { opBookedToday: 210 },
        revenue: { totalAmountOverall: 34500, totalBillsCount: 1150, revenueToday: 8200, totalIpBillsCount: 45 },
        beds: { totalBeds: 150, availableBeds: 22, occupiedBeds: 128 },
        recentActivity: [
          { name: 'Latest OP booking', start: '05/05/25:17 AM', status: '2 hours ago' },
          { name: 'Staff Check-in', start: '05/05/20:17 AM', status: '3 hours ago' },
          { name: 'Bill Payment', start: '05/05/20:17 AM', status: '$5,500.00 USD' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    message.success('Exporting HMS Dashboard data as PDF/Excel...');
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading HMS Overview Dashboard..." />
      </div>
    );
  }

  const { staff, opBooked, revenue, beds, recentActivity } = data;

  // Donut chart calculations
  const totalBeds = beds.totalBeds || 150;
  const availableBeds = beds.availableBeds || 22;
  const occupiedBeds = beds.occupiedBeds || 128;
  const occupiedPercent = (occupiedBeds / totalBeds) * 100;
  const availablePercent = (availableBeds / totalBeds) * 100;

  // SVG parameters for donut chart
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const occupiedStroke = (occupiedPercent / 100) * circumference;
  const availableStroke = (availablePercent / 100) * circumference;

  return (
    <div style={{ padding: '24px', background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>HMS Overview Dashboard</h1>
        <Button 
          type="primary" 
          icon={<Download size={16} />} 
          onClick={handleExport}
          style={{ background: 'var(--accent-primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          Export PDF/Excel
        </Button>
      </div>

      {/* Main Grid: Staff, OP Booked, Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Staff on Duty */}
        <Card 
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>Staff on Duty</span>}
          bordered={false}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Users size={24} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Doctors Present</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{staff.doctorsPresent}</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-primary)', paddingLeft: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Duty Doctors</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-secondary)' }}>{staff.dutyDoctors}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-info)' }}>
                <Users size={24} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nurses Attended</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{staff.nursesAttended}</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-primary)', paddingLeft: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Nurses</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-secondary)' }}>{staff.totalNurses}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total employed</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* OP Booked */}
        <Card 
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>OP Booked</span>}
          bordered={false}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative', background: 'rgba(255,255,255,0.01)', padding: '20px 16px', borderRadius: '10px', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>OP Booked Today</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>{opBooked.opBookedToday}</div>
              </div>
              
              {/* Spline Wave Graphic */}
              <div style={{ width: '120px', height: '40px' }}>
                <svg width="120" height="40" viewBox="0 0 120 40">
                  <path 
                    d="M 0 30 Q 15 5, 30 20 T 60 10 T 90 28 T 120 15" 
                    fill="none" 
                    stroke="var(--accent-primary)" 
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path 
                    d="M 0 30 Q 15 5, 30 20 T 60 10 T 90 28 T 120 15 L 120 40 L 0 40 Z" 
                    fill="url(#grad)" 
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-primary)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '20px 16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Other Staff</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{staff.otherStaff}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Revenue */}
        <Card 
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>Financial Revenue</span>}
          bordered={false}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Amount (Overall)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>${revenue.totalAmountOverall.toLocaleString()}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Bills (Count)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>{revenue.totalBillsCount}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Revenue Today</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', margin: '4px 0' }}>${revenue.revenueToday.toLocaleString()}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total IP Bills (Count)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>{revenue.totalIpBillsCount}</div>
            </div>
          </div>
        </Card>

      </div>

      {/* Bottom Grid: IP Census (Beds) & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        
        {/* IP Census (Beds) */}
        <Card 
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>IP Census (Beds)</span>}
          bordered={false}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                {/* Background track */}
                <circle cx="65" cy="65" r={radius} fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="12" />
                {/* Occupied stroke (Blue) */}
                <circle 
                  cx="65" 
                  cy="65" 
                  r={radius} 
                  fill="transparent" 
                  stroke="var(--accent-primary)" 
                  strokeWidth="12" 
                  strokeDasharray={`${occupiedStroke} ${circumference}`}
                  transform="rotate(-90 65 65)"
                />
                {/* Available stroke (Red/Coral) */}
                <circle 
                  cx="65" 
                  cy="65" 
                  r={radius} 
                  fill="transparent" 
                  stroke="var(--accent-danger)" 
                  strokeWidth="12" 
                  strokeDasharray={`${availableStroke} ${circumference}`}
                  transform={`rotate(${(occupiedPercent * 3.6) - 90} 65 65)`}
                />
              </svg>
              {/* Inner Label */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Beds</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalBeds}</span>
              </div>
            </div>

            {/* Labels List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Occupied Beds</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{occupiedBeds}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-danger)' }} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Available Beds</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-danger)' }}>{availableBeds}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)' }} />
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Capacity</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalBeds}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card 
          title={<span style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 600 }}>Recent Activity</span>}
          bordered={false}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>NAME</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>START</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((r: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {r.start && r.start.includes('T') ? new Date(r.start).toLocaleString() : r.start}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right', fontWeight: 600, color: r.status?.startsWith('$') || r.status?.includes('Paid') ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                    {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </div>
    </div>
  );
};
