import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, Filter, 
  Download, Printer, Search, RefreshCw, BarChart2, CheckCircle, 
  ArrowUpRight, ArrowDownRight, Layers, FileText, ChevronRight, Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import api from '../../api/client';
import { formatCurrency, formatDateTime, formatDisplayAge } from '../../utils/formatters';

interface OPDAnalyticsDashboardProps {
  doctors: any[];
  onPrintSlip: (row: any) => void;
  hospitalDetails?: any;
}

export const OPDAnalyticsDashboard: React.FC<OPDAnalyticsDashboardProps> = ({
  doctors,
  onPrintSlip,
  hospitalDetails
}) => {
  // Global Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Table Specific Filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('ALL');
  const [tablePayment, setTablePayment] = useState('ALL');

  // Data States
  const [kpiSummary, setKpiSummary] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Selected Record Modal
  const [viewRecord, setViewRecord] = useState<any>(null);

  // Fetch KPI Summary
  const fetchKpiSummary = async () => {
    try {
      const res = await api.get(`/v1/opd/dashboard/kpi-summary?doctorId=${selectedDoctorId}&paymentMethod=${selectedPaymentMethod}`);
      if (res.data.success) {
        setKpiSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch KPI summary:', err);
    }
  };

  // Fetch Growth Chart Data
  const fetchGrowthData = async () => {
    try {
      const params = new URLSearchParams({
        doctorId: selectedDoctorId,
        dateRange: selectedDateRange,
        startDate: customStartDate,
        endDate: customEndDate
      });
      const res = await api.get(`/v1/opd/dashboard/growth-chart?${params.toString()}`);
      if (res.data.success) {
        setGrowthData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch growth chart data:', err);
    }
  };

  // Fetch Master Records
  const fetchRecords = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams({
        doctorId: selectedDoctorId,
        dateRange: selectedDateRange,
        paymentMethod: tablePayment !== 'ALL' ? tablePayment : selectedPaymentMethod,
        status: tableStatus,
        search: tableSearch,
        startDate: customStartDate,
        endDate: customEndDate,
        limit: '100',
        offset: '0'
      });
      const res = await api.get(`/v1/opd/dashboard/records?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.data.records || []);
        setTotalRecords(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch OPD records:', err);
    } finally {
      setTableLoading(false);
    }
  };

  const loadAllDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      fetchKpiSummary(),
      fetchGrowthData(),
      fetchRecords()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllDashboardData();
  }, [selectedDoctorId, selectedDateRange, selectedPaymentMethod, customStartDate, customEndDate]);

  useEffect(() => {
    fetchRecords();
  }, [tableSearch, tableStatus, tablePayment]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('No OPD records available to export.');
      return;
    }

    const headers = ['OP No', 'MRN', 'Patient Name', 'Phone', 'Doctor Name', 'Department', 'OP Booked By', 'OP Check In Time', 'OP Check In By', 'Payment Method', 'Amount (INR)', 'Status'];
    const rows = records.map(r => [
      r.op_no || r.opNo || '—',
      r.medical_record_number || '—',
      `"${r.patient_name || ''}"`,
      r.patient_phone || '—',
      `"Dr. ${r.doctor_name || ''}"`,
      `"${r.doctor_department || 'General'}"`,
      `"${r.op_booked_by || 'Reception Desk'}"`,
      `"${new Date(r.appointment_date).toLocaleString('en-IN')}"`,
      `"${r.op_check_in_by || 'Reception Desk'}"`,
      `"${r.payment_method || 'Cash'}"`,
      r.amount || 0,
      r.status || 'CheckedIn'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OPD_Analytics_Report_${selectedDateRange.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Master Report Handler
  const handlePrintMasterReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = records.map((r, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>OP-${r.op_no || '—'}</strong></td>
        <td style="font-family: monospace;">${r.medical_record_number}</td>
        <td><strong>${r.patient_name}</strong><br/><small style="color: #64748b;">${r.patient_phone || '—'}</small></td>
        <td>Dr. ${r.doctor_name}<br/><small style="color: #64748b;">${r.doctor_department || 'General'}</small></td>
        <td>${r.op_booked_by || 'Reception Desk'}</td>
        <td>${new Date(r.appointment_date).toLocaleString('en-IN')}</td>
        <td>${r.op_check_in_by || 'Reception Desk'}</td>
        <td><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${r.payment_method || 'Cash'}</span></td>
        <td style="text-align: right; font-weight: 700;">₹${parseFloat(r.amount || '0').toFixed(2)}</td>
        <td style="text-align: center;"><span style="color: #059669; font-weight: 600;">${r.status}</span></td>
      </tr>
    `).join('');

    const totalRev = records.reduce((s, r) => s + parseFloat(r.amount || '0'), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OPD Master Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .hospital-title { font-size: 20px; font-weight: 800; }
            .report-title { font-size: 16px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-top: 4px; }
            .summary-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stat-card { text-align: center; }
            .stat-val { font-size: 18px; font-weight: 800; color: #1e3a8a; }
            .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #0f172a; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="hospital-title">${hospitalDetails?.hospital_name || 'Manasa Hospital'}</div>
              <div class="report-title">Master OPD Consultation Analytics Report</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}<br/>
              <strong>Date Range:</strong> ${selectedDateRange === 'ALL' ? 'All Bookings (From Beginning)' : selectedDateRange}<br/>
              <strong>Doctor Scope:</strong> ${selectedDoctorId === 'ALL' ? 'All Hospital Doctors' : 'Selected Doctor'}
            </div>
          </div>

          <div class="summary-box">
            <div class="stat-card">
              <div class="stat-lbl">Total OPD Records</div>
              <div class="stat-val">${records.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Total Revenue</div>
              <div class="stat-val">₹${totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Average Ticket / Fee</div>
              <div class="stat-val">₹${records.length > 0 ? (totalRev / records.length).toFixed(2) : '0.00'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Payment Mode</div>
              <div class="stat-val">${selectedPaymentMethod}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>OP No</th>
                <th>MRN</th>
                <th>Patient Details</th>
                <th>Consulting Doctor</th>
                <th>OP Booked By</th>
                <th>OP Check In Time</th>
                <th>OP Check In By</th>
                <th>Payment</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
              🖨️ Print Master OPD Report
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Max value in time series for chart scaling
  const maxTsCount = useMemo(() => {
    if (!growthData?.timeSeries || growthData.timeSeries.length === 0) return 10;
    return Math.max(...growthData.timeSeries.map((t: any) => t.count), 5);
  }, [growthData]);

  const maxTsRev = useMemo(() => {
    if (!growthData?.timeSeries || growthData.timeSeries.length === 0) return 5000;
    return Math.max(...growthData.timeSeries.map((t: any) => t.revenue), 1000);
  }, [growthData]);

  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* A. Global Filter Bar (Adaptive Layout) */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end justify-between w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 flex-1 w-full">
            {/* Doctor Mapping Selector */}
            <div>
              <Select
                label="👨‍⚕️ Doctor Mapping Selector"
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                options={[
                  { value: 'ALL', label: '🏥 All Doctors (Hospital-Wide View)' },
                  ...doctors.map(d => ({
                    value: d.doctorId,
                    label: `Dr. ${d.doctorName} (${d.department || 'General'})`
                  }))
                ]}
              />
            </div>

            {/* Date Range Selector */}
            <div>
              <Select
                label="📅 Date Range Filter"
                value={selectedDateRange}
                onChange={e => setSelectedDateRange(e.target.value)}
                options={[
                  { value: 'ALL', label: '📅 All Bookings (From Beginning)' },
                  { value: 'Today', label: '📅 Today' },
                  { value: 'Yesterday', label: '📅 Yesterday' },
                  { value: 'This Week', label: '📅 This Week' },
                  { value: 'This Month', label: '🗓️ This Month' },
                  { value: 'This Year', label: '📊 This Year' },
                  { value: 'Custom', label: '⚙️ Custom Date Range' }
                ]}
              />
            </div>

            {/* Payment Method Filter */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Select
                label="💳 Payment / Check-In Method"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                options={[
                  { value: 'ALL', label: '💵 All Methods' },
                  { value: 'Cash', label: '💵 Cash' },
                  { value: 'UPI', label: '📱 UPI / QR' },
                  { value: 'Card', label: '💳 Card' },
                  { value: 'Insurance', label: '🛡️ Insurance / Credit' },
                  { value: 'Free Review', label: '🎁 Free Review' }
                ]}
              />
            </div>

            {/* Custom Date Pickers */}
            {selectedDateRange === 'Custom' && (
              <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="From Date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="To Date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={loadAllDashboardData}
              loading={loading}
            >
              Sync Analytics
            </Button>
          </div>
        </div>
      </Card>

      {/* B. RESPONSIVE KPI SUMMARY CARDS GRID */}
      {/* Mobile: 1 col | Tablet: 2 cols | Desktop: 4 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {/* Today Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Today's OPD</span>
            <Users className="w-5 h-5 opacity-90" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold">{kpiSummary?.today?.totalBookings || 0}</span>
            <span className="text-xs opacity-80">Check-ins</span>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-400/30 flex justify-between items-center text-xs font-semibold">
            <span>Revenue:</span>
            <span className="text-sm font-bold">{formatCurrency(kpiSummary?.today?.totalRevenue || 0)}</span>
          </div>
        </div>

        {/* This Week Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 md:p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">This Week's OPD</span>
            <Activity className="w-5 h-5 opacity-90" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold">{kpiSummary?.week?.totalBookings || 0}</span>
            <span className="text-xs opacity-80">Check-ins</span>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-400/30 flex justify-between items-center text-xs font-semibold">
            <span>Revenue:</span>
            <span className="text-sm font-bold">{formatCurrency(kpiSummary?.week?.totalRevenue || 0)}</span>
          </div>
        </div>

        {/* This Month Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 md:p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">This Month's OPD</span>
            <Calendar className="w-5 h-5 opacity-90" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold">{kpiSummary?.month?.totalBookings || 0}</span>
            <span className="text-xs opacity-80">Check-ins</span>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-400/30 flex justify-between items-center text-xs font-semibold">
            <span>Revenue:</span>
            <span className="text-sm font-bold">{formatCurrency(kpiSummary?.month?.totalRevenue || 0)}</span>
          </div>
        </div>

        {/* This Year Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 md:p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px] min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">This Year's OPD</span>
            <BarChart2 className="w-5 h-5 opacity-90" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold">{kpiSummary?.year?.totalBookings || 0}</span>
            <span className="text-xs opacity-80">Cumulative</span>
          </div>
          <div className="mt-3 pt-2 border-t border-red-400/30 flex justify-between items-center text-xs font-semibold">
            <span>Revenue:</span>
            <span className="text-sm font-bold">{formatCurrency(kpiSummary?.year?.totalRevenue || 0)}</span>
          </div>
        </div>
      </div>

      {/* C. RESPONSIVE CHARTS SECTION */}
      {/* Mobile/Tablet: Stacked (1 col) | Desktop: 3-column split (2:1 ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Chart 1: Equalizer Growth Trend Chart (66% width on desktop) */}
        <div className="lg:col-span-2">
        <Card title="📊 Volume & Revenue Growth Trend (Equalizer Bar Chart)">
          <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Granularity: <strong>{selectedDateRange} Breakdown</strong></span>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 12, height: 12, background: '#2563eb', borderRadius: 3, display: 'inline-block' }}></span>
                OPD Volume (Count)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 12, height: 12, background: '#10b981', borderRadius: 3, display: 'inline-block' }}></span>
                Revenue (₹)
              </span>
            </div>
          </div>

          {growthData?.timeSeries && growthData.timeSeries.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '240px', gap: '12px', borderBottom: '2px solid var(--border-primary)', paddingBottom: '10px', overflowX: 'auto', paddingTop: '20px' }}>
              {growthData.timeSeries.map((item: any, idx: number) => {
                const countBarHeight = Math.max(Math.round((item.count / maxTsCount) * 180), 8);
                const revBarHeight = Math.max(Math.round((item.revenue / maxTsRev) * 180), 8);

                return (
                  <div key={idx} style={{ flex: 1, minWidth: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                      {/* Count Bar */}
                      <div 
                        title={`OPD Count: ${item.count}`}
                        style={{ 
                          width: '14px', 
                          height: `${countBarHeight}px`, 
                          background: 'linear-gradient(to top, #1e3a8a, #3b82f6)', 
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: '#1e3a8a' }}>
                          {item.count}
                        </span>
                      </div>

                      {/* Revenue Bar */}
                      <div 
                        title={`Revenue: ₹${item.revenue}`}
                        style={{ 
                          width: '14px', 
                          height: `${revBarHeight}px`, 
                          background: 'linear-gradient(to top, #065f46, #10b981)', 
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No time-series check-in data available for selected filter range.
            </div>
          )}
        </Card>
      </div>

        {/* Chart 2: Comparative Performance Stack */}
        <Card title="📈 Comparative Growth Stack">
          <div style={{ display: 'grid', gap: '14px' }}>
            {/* Today vs Yesterday */}
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Today vs. Yesterday</span>
                {growthData?.comparisons?.todayVsYesterday?.growthPct >= 0 ? (
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={14} /> +{growthData?.comparisons?.todayVsYesterday?.growthPct}%
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowDownRight size={14} /> {growthData?.comparisons?.todayVsYesterday?.growthPct}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                Today: {growthData?.comparisons?.todayVsYesterday?.currentCount || 0} visits ({formatCurrency(growthData?.comparisons?.todayVsYesterday?.currentRevenue || 0)})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Yesterday: {growthData?.comparisons?.todayVsYesterday?.prevCount || 0} visits ({formatCurrency(growthData?.comparisons?.todayVsYesterday?.prevRevenue || 0)})
              </div>
            </div>

            {/* This Week vs Last Week */}
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>This Week vs. Last Week</span>
                {growthData?.comparisons?.weekVsLastWeek?.growthPct >= 0 ? (
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={14} /> +{growthData?.comparisons?.weekVsLastWeek?.growthPct}%
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowDownRight size={14} /> {growthData?.comparisons?.weekVsLastWeek?.growthPct}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                This Week: {growthData?.comparisons?.weekVsLastWeek?.currentCount || 0} visits ({formatCurrency(growthData?.comparisons?.weekVsLastWeek?.currentRevenue || 0)})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Last Week: {growthData?.comparisons?.weekVsLastWeek?.prevCount || 0} visits ({formatCurrency(growthData?.comparisons?.weekVsLastWeek?.prevRevenue || 0)})
              </div>
            </div>

            {/* This Month vs Last Month */}
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>This Month vs. Last Month</span>
                {growthData?.comparisons?.monthVsLastMonth?.growthPct >= 0 ? (
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={14} /> +{growthData?.comparisons?.monthVsLastMonth?.growthPct}%
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowDownRight size={14} /> {growthData?.comparisons?.monthVsLastMonth?.growthPct}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                This Month: {growthData?.comparisons?.monthVsLastMonth?.currentCount || 0} visits ({formatCurrency(growthData?.comparisons?.monthVsLastMonth?.currentRevenue || 0)})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Last Month: {growthData?.comparisons?.monthVsLastMonth?.prevCount || 0} visits ({formatCurrency(growthData?.comparisons?.monthVsLastMonth?.prevRevenue || 0)})
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* D. Master OPD Filterable Data Table */}
      <Card title="📑 Master OPD Filterable Data Grid">
        {/* Table Filters & Actions Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', flex: 1, minWidth: 300 }}>
            {/* Text Search */}
            <div style={{ flex: 2, minWidth: 200 }}>
              <Input
                placeholder="🔍 Search patient name, MRN, OP No, phone..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <Select
                value={tableStatus}
                onChange={e => setTableStatus(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Status: All' },
                  { value: 'CheckedIn', label: 'Status: CheckedIn' },
                  { value: 'Completed', label: 'Status: Completed' },
                  { value: 'Cancelled', label: 'Status: Cancelled' }
                ]}
              />
            </div>

            {/* Payment Filter */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <Select
                value={tablePayment}
                onChange={e => setTablePayment(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Payment: All' },
                  { value: 'Cash', label: 'Payment: Cash' },
                  { value: 'UPI', label: 'Payment: UPI' },
                  { value: 'Card', label: 'Payment: Card' },
                  { value: 'Insurance', label: 'Payment: Insurance' },
                  { value: 'Free Review', label: 'Payment: Free Review' }
                ]}
              />
            </div>
          </div>

          {/* Top Right Action Export & Print Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={handlePrintMasterReport}
            >
              Print Master Report
            </Button>
          </div>
        </div>

        {/* Master Data Table */}
        <Table
          columns={[
            {
              key: 'op_no',
              label: 'OP NO',
              render: (_, row) => (
                <strong style={{ color: 'var(--text-primary)' }}>
                  {row.op_no || row.opNo || '—'}
                </strong>
              )
            },
            {
              key: 'medical_record_number',
              label: 'MRN',
              render: (v) => (
                <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {v}
                </span>
              )
            },
            {
              key: 'patient_name',
              label: 'PATIENT DETAILS',
              render: (v, row) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    📱 {row.patient_phone || '—'}
                  </div>
                </div>
              )
            },
            {
              key: 'doctor_name',
              label: 'CONSULTING DOCTOR',
              render: (v, row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>Dr. {v}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {row.doctor_department || 'General'}
                  </div>
                </div>
              )
            },
            {
              key: 'op_booked_by',
              label: 'OP BOOKED BY',
              render: (v, row) => (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px' }}>
                  👤 {row.op_booked_by || v || 'Reception Desk'}
                </span>
              )
            },
            {
              key: 'appointment_date',
              label: 'OP CHECK IN',
              render: (v) => formatDateTime(v)
            },
            {
              key: 'op_check_in_by',
              label: 'OP CHECK IN BY',
              render: (v, row) => (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  🏥 {row.op_check_in_by || v || 'Reception Desk'}
                </span>
              )
            },
            {
              key: 'payment_method',
              label: 'PAYMENT METHOD',
              render: (v, row) => {
                const method = v || row.payment_method || 'Cash';
                const isFree = method.includes('Free');
                return (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    background: isFree ? '#ecfdf5' : '#eff6ff',
                    color: isFree ? '#047857' : '#1d4ed8',
                    border: `1px solid ${isFree ? '#a7f3d0' : '#bfdbfe'}`
                  }}>
                    {method}
                  </span>
                );
              }
            },
            {
              key: 'amount',
              label: 'AMOUNT',
              render: (_, row) => {
                const amt = parseFloat(row.amount || '0');
                return (
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(amt)}
                  </strong>
                );
              }
            },
            {
              key: 'status',
              label: 'STATUS',
              render: (v) => (
                <Badge variant={v === 'Cancelled' ? 'danger' : v === 'Completed' ? 'success' : 'info'}>
                  {v || 'CheckedIn'}
                </Badge>
              )
            },
            {
              key: 'actions',
              label: 'ACTION',
              render: (_, row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Printer size={13} />}
                    onClick={() => onPrintSlip(row)}
                  >
                    Print Slip
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewRecord(row)}
                  >
                    View
                  </Button>
                </div>
              )
            }
          ]}
          data={records}
        />
      </Card>

      {/* Record View Modal */}
      {viewRecord && (
        <Modal
          isOpen={!!viewRecord}
          onClose={() => setViewRecord(null)}
          title="OPD Check-in Details"
          size="md"
        >
          <div style={{ padding: 'var(--space-md)', display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', background: 'var(--bg-primary)', padding: 'var(--space-md)', borderRadius: '8px' }}>
              <div><strong>OP Number:</strong> OP-{viewRecord.op_no || '—'}</div>
              <div><strong>Token Number:</strong> #{viewRecord.token_no || '—'}</div>
              <div><strong>Patient Name:</strong> {viewRecord.patient_name}</div>
              <div><strong>MRN:</strong> {viewRecord.medical_record_number}</div>
              <div><strong>Phone:</strong> {viewRecord.patient_phone || '—'}</div>
              <div><strong>Consulting Doctor:</strong> Dr. {viewRecord.doctor_name} ({viewRecord.doctor_department || 'General'})</div>
              <div><strong>Check-in Time:</strong> {formatDateTime(viewRecord.appointment_date)}</div>
              <div><strong>Payment Mode:</strong> {viewRecord.payment_method || 'Cash'}</div>
              <div><strong>Billed Fee:</strong> {formatCurrency(parseFloat(viewRecord.amount || '0'))}</div>
              <div><strong>Status:</strong> {viewRecord.status}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <Button variant="secondary" onClick={() => setViewRecord(null)}>Close</Button>
              <Button variant="primary" icon={<Printer size={16} />} onClick={() => { onPrintSlip(viewRecord); setViewRecord(null); }}>Print Slip</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
