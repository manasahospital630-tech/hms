import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Check, Ban, ArrowLeftRight, Printer, Search, X, Edit } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

const InvoiceGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'list' | 'create-item'>('generator');
  
  // Generator States
  const [patient, setPatient] = useState<any>(null);
  const [items, setItems] = useState<{ description: string; category: string; quantity: number; unitPrice: number }[]>([]);
  const [itemForm, setItemForm] = useState({ description: '', category: 'General', quantity: '1', unitPrice: '0' });
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [insurance, setInsurance] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Manage Line Items States
  const [categories, setCategories] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    categoryId: '',
    serviceCode: '',
    price: '',
    gstPercentage: '18',
    durationMinutes: '30',
    sampleRequired: 'None',
    normalRange: '',
    machineRequired: '',
    homeCollectionAvailable: false,
    emergencyAvailable: false,
    isActive: true
  });

  const [diagSearchQuery, setDiagSearchQuery] = useState('');
  const [diagDropdownOpen, setDiagDropdownOpen] = useState(false);

  useEffect(() => {
    if (patient) {
      setPaymentStatus(patient.is_inpatient ? 'Unpaid' : 'Paid');
    }
  }, [patient]);

  // Diagnostic Catalog State
  const [diagServices, setDiagServices] = useState<any[]>([]);

  // List States
  const [invoices, setInvoices] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - Number(discount) + Number(tax);
  const patientOwes = total - Number(insurance);

  const loadHospitalSettings = async () => {
    try {
      const res = await api.get('/admin/hospital-settings/public');
      if (res.data.success) {
        setHospitalSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hospital settings:', err);
    }
  };

  const loadDiagnosticsAndInvoices = async () => {
    try {
      const [diagRes, catsRes] = await Promise.all([
        api.get('/diagnostics/services'),
        api.get('/diagnostics/categories')
      ]);
      if (diagRes.data.success) {
        setDiagServices(diagRes.data.data || []);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load diagnostics services or categories:', err);
    }
  };

  const loadInvoices = async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await api.get('/billing/invoices');
      if (res.data.success) {
        setInvoices(res.data.data?.invoices || res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setListError('Failed to fetch invoice history.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnosticsAndInvoices();
    loadHospitalSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      loadInvoices();
    }
  }, [activeTab]);

  const handleDiagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    if (!serviceId) return;

    const service = diagServices.find(s => s.service_id === serviceId);
    if (service) {
      setItemForm({
        description: service.name,
        category: 'Diagnostics',
        quantity: '1',
        unitPrice: parseFloat(service.price).toString()
      });
    }
  };

  const addItem = () => {
    if (!itemForm.description) return;
    setItems([
      ...items,
      {
        description: itemForm.description,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unitPrice: Number(itemForm.unitPrice)
      }
    ]);
    setItemForm({ description: '', category: 'General', quantity: '1', unitPrice: '0' });
  };

  const handlePrintBill = async (invoiceId: string) => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}`);
      if (res.data.success) {
        const inv = res.data.data;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const isIP = !!inv.is_inpatient;

          // Hospital Settings dynamic variables
          const hospitalName = hospitalSettings?.hospital_name || 'Hannah Hospitals India Pvt. Ltd.';
          const hospitalAddress = hospitalSettings?.hospital_address || '44-617/12, Adjacent to BSNL Telephone Exchange, Nacharam, Secunderabad-500 076';
          const phoneNumber = hospitalSettings?.phone_number || '040 - 68244555, 88012 33333';
          const website = hospitalSettings?.website || 'https://hannahhospitals.in';
          const email = hospitalSettings?.email || 'info@hannahhospitals.in';
          const gstin = hospitalSettings?.gstin || '36AABCU2450J1ZD';
          const licenseInfo = hospitalSettings?.license_info || 'PR-2026/8508';
          const logoUrl = hospitalSettings?.hospital_logo || null;

          const logoHtml = logoUrl 
            ? `<img src="${logoUrl}" alt="Logo" style="height: 70px; max-width: 100px; object-fit: contain;" />`
            : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px;">
                <svg viewBox="0 0 24 24" width="45" height="45" fill="none" stroke="#007a87" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span style="font-size: 8px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; margin-top: 3px; text-transform: uppercase;">HANNAH</span>
              </div>`;

          // Date formatting (DD/MM/YYYY HH:MM)
          const dateObj = new Date(inv.created_at);
          const pad = (n: number) => n.toString().padStart(2, '0');
          const formattedDate = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

          // Bill Reference Number format
          const billPrefix = isIP ? 'IP' : 'OP';
          const billYear = dateObj.getFullYear().toString().substring(2);
          const billNumber = `${billPrefix}${billYear}-${inv.invoice_id.substring(0, 8).toUpperCase()}`;

          // Dynamic Age computation
          const getAgeStr = (birthDateStr: string): string => {
            if (!birthDateStr) return '—';
            const birth = new Date(birthDateStr);
            const today = new Date();
            let years = today.getFullYear() - birth.getFullYear();
            let months = today.getMonth() - birth.getMonth();
            if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
              years--;
              months += 12;
            }
            return `${years} years ${months} months`;
          };
          const ageStr = getAgeStr(inv.birth_date);

          // Rupees in words converter
          const numberToWords = (num: number): string => {
            const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            
            const numToString = (n: number): string => {
              if (n < 20) return a[n];
              const digit = n % 10;
              if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
              if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numToString(n % 100) : '');
              return '';
            };
            
            const convert = (n: number): string => {
              if (n === 0) return 'zero';
              let words = '';
              if (n >= 10000000) {
                words += convert(Math.floor(n / 10000000)) + ' crore ';
                n %= 10000000;
              }
              if (n >= 100000) {
                words += convert(Math.floor(n / 100000)) + ' lakh ';
                n %= 100000;
              }
              if (n >= 1000) {
                words += numToString(Math.floor(n / 1000)) + ' thousand ';
                n %= 1000;
              }
              if (n > 0) {
                words += numToString(n);
              }
              return words.trim();
            };
            
            return 'RUPEES ' + convert(Math.floor(num)).toUpperCase() + ' ONLY';
          };
          const wordsTotal = numberToWords(parseFloat(inv.patient_responsibility));

          const userObj = JSON.parse(localStorage.getItem('hms_user') || '{}');
          const preparedBy = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'system admin';

          printWindow.document.write(`
            <html>
              <head>
                <title>${isIP ? 'IP BILL' : 'OP BILL'}</title>
                <style>
                  @page {
                    size: auto;
                    margin: 15mm 15mm 15mm 15mm;
                  }
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                    color: #0f172a;
                    padding: 10px;
                    line-height: 1.4;
                    margin: 0;
                    font-size: 13px;
                  }
                  .logo-col {
                    width: 100px;
                  }
                  .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                  }
                  .hospital-details {
                    flex: 1;
                    padding-left: 20px;
                  }
                  .hospital-name {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 6px 0;
                  }
                  .hospital-sub {
                    font-size: 12px;
                    color: #475569;
                    margin: 2px 0;
                  }
                  .hospital-sub strong {
                    color: #0f172a;
                  }
                  .stamp-col {
                    text-align: right;
                    width: 200px;
                  }
                  .reg-stamp {
                    border: 2px dashed #2563eb;
                    color: #2563eb;
                    padding: 6px 12px;
                    font-weight: 800;
                    font-size: 12px;
                    text-transform: uppercase;
                    border-radius: 6px;
                    transform: rotate(-3deg);
                    display: inline-block;
                    font-family: monospace;
                  }
                  .divider-thick {
                    border-bottom: 2.5px solid #0f172a;
                    margin: 12px 0 20px 0;
                  }
                  .bill-title {
                    text-align: center;
                    font-weight: 800;
                    font-size: 14px;
                    letter-spacing: 1px;
                    border-top: 1px solid #cbd5e1;
                    border-bottom: 1px solid #cbd5e1;
                    padding: 6px 0;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                  }
                  .bill-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1.2fr;
                    gap: 8px 30px;
                    margin-bottom: 20px;
                  }
                  .bill-meta-row {
                    display: flex;
                    justify-content: flex-start;
                  }
                  .bill-meta-label {
                    width: 100px;
                    font-weight: 600;
                    color: #475569;
                  }
                  .bill-meta-value {
                    font-weight: 700;
                    color: #0f172a;
                  }
                  .patient-banner {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px 16px;
                    display: grid;
                    grid-template-columns: 2.2fr 1.5fr 1.3fr 0.8fr 1.5fr;
                    margin-bottom: 20px;
                  }
                  .patient-block {
                    display: flex;
                    flex-direction: column;
                  }
                  .patient-label {
                    font-size: 10px;
                    color: #64748b;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                  }
                  .patient-value {
                    font-size: 13px;
                    font-weight: 800;
                    color: #0f172a;
                  }
                  .payment-type {
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #1e293b;
                  }
                  .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                  }
                  .table th {
                    border-top: 1.5px solid #0f172a;
                    border-bottom: 1.5px solid #0f172a;
                    padding: 8px 10px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                  }
                  .table td {
                    padding: 8px 10px;
                    font-size: 13px;
                    border-bottom: none;
                  }
                  .table tr:last-child td {
                    border-bottom: 1.5px solid #0f172a;
                  }
                  .summary-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                  }
                  .words-block {
                    flex: 1;
                    padding-right: 30px;
                  }
                  .words-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #64748b;
                    margin-bottom: 2px;
                  }
                  .words-val {
                    font-size: 12px;
                    font-weight: 800;
                    font-style: italic;
                    color: #0f172a;
                  }
                  .calc-block {
                    width: 250px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                  }
                  .calc-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    padding: 8px 0;
                  }
                  .calc-val {
                    font-weight: 700;
                    text-align: right;
                  }
                  .receivable-row {
                    border-bottom: 1px solid #cbd5e1;
                  }
                  .received-row {
                    border-bottom: 1.5px solid #0f172a;
                    font-size: 14px;
                    font-weight: 800;
                    color: #0f172a;
                  }
                  .footer-signature {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 80px;
                    font-size: 12px;
                    color: #475569;
                  }
                  .prepared-by {
                    font-weight: 700;
                    color: #0f172a;
                  }
                  .sig-line {
                    border-top: 1px dashed #94a3b8;
                    width: 150px;
                    text-align: center;
                    padding-top: 5px;
                    font-weight: 600;
                  }
                </style>
              </head>
              <body onload="window.print(); setTimeout(function() { window.close(); }, 500);">
                <div class="header-container">
                  <div class="logo-col">
                    ${logoHtml}
                  </div>
                  <div class="hospital-details">
                    <h1 class="hospital-name">${hospitalName}</h1>
                    <p class="hospital-sub">${hospitalAddress}</p>
                    <p class="hospital-sub">Phone: ${phoneNumber} | Web: ${website} | Email: ${email}</p>
                    <p class="hospital-sub"><strong>GSTIN: ${gstin}</strong></p>
                  </div>
                  <div class="stamp-col">
                    <div class="reg-stamp">REG NO: ${licenseInfo}</div>
                  </div>
                </div>

                <div class="divider-thick"></div>

                <div class="bill-title">${isIP ? 'IP BILL' : 'OP BILL'}</div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                  <tbody>
                    <tr>
                      <td style="width: 120px; padding: 4px 0; color: #475569; font-weight: 600;">${isIP ? 'IP No' : 'OP No'}</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${isIP ? 'IP' : 'OP'}-${inv.patient_id.substring(0, 4).toUpperCase()}</td>
                      <td style="width: 120px; padding: 4px 0; color: #475569; font-weight: 600;">Token No</td>
                      <td style="padding: 4px 0; font-weight: 700;">: 1</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Consultant</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${inv.doctor_name || 'Dr. Priya Nair (Dermatology) M.B.B.S, M.D.'}</td>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Referred By</td>
                      <td style="padding: 4px 0; font-weight: 700;">: self</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Date</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${formattedDate}</td>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Bill No</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${billNumber}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="patient-banner">
                  <div class="patient-block">
                    <span class="patient-label">NAME</span>
                    <span class="patient-value">${inv.patient_name}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">ID (MRN)</span>
                    <span class="patient-value">${inv.medical_record_number}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">AGE</span>
                    <span class="patient-value">${ageStr}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">GENDER</span>
                    <span class="patient-value">${(inv.gender || 'F').toUpperCase()}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">MOBILE</span>
                    <span class="patient-value">${inv.phone || '—'}</span>
                  </div>
                </div>

                <div class="payment-type">
                  Payment Type: ${inv.payment_method || 'Cash'}
                </div>

                <table class="table">
                  <thead>
                    <tr>
                      <th style="width: 50px; text-align: left;">S.NO</th>
                      <th style="text-align: left;">PARTICULARS</th>
                      <th style="width: 80px; text-align: right;">QTY</th>
                      <th style="width: 120px; text-align: right;">RATE</th>
                      <th style="width: 120px; text-align: right;">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(inv.items || []).map((item: any, idx: number) => `
                      <tr>
                        <td style="text-align: left;">${idx + 1}.</td>
                        <td style="font-weight: 700; text-transform: uppercase;">${item.description}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td style="text-align: right;">${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style="text-align: right; font-weight: 700;">${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="summary-container">
                  <div class="words-block">
                    <div class="words-label">Amount (in words):</div>
                    <div class="words-val">${wordsTotal}</div>
                  </div>
                  <div class="calc-block">
                    <div class="calc-row receivable-row">
                      <span class="calc-label">Amount Receivable</span>
                      <span class="calc-val">${parseFloat(inv.patient_responsibility).toFixed(2)}</span>
                    </div>
                    <div class="calc-row received-row">
                      <span class="calc-label">Amount Received</span>
                      <span class="calc-val">${parseFloat(inv.amount_paid).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div class="footer-signature">
                  <div>Prepared By: <span class="prepared-by">${preparedBy}</span></div>
                  <div class="sig-line">Signature / Stamp</div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err: any) {
      alert('Failed to retrieve full invoice data for printing.');
    }
  };

  const handleSubmit = async () => {
    if (!patient || items.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/billing/invoices', {
        patientId: patient.patient_id,
        items,
        discount: Number(discount),
        tax: Number(tax),
        insuranceCoverage: Number(insurance),
        paymentMethod,
        paymentStatus
      });
      
      if (res.data.success) {
        const createdInv = res.data.data;
        setSuccess('Invoice created successfully! Initializing printout...');
        setItems([]);
        setPatient(null);
        setTimeout(() => setSuccess(''), 3000);
        
        // Print the invoice directly
        handlePrintBill(createdInv.invoice_id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to CANCEL this bill?')) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/cancel`);
      loadInvoices();
      alert('Invoice cancelled successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel invoice.');
    }
  };

  const handleReturnInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to RETURN/REFUND this bill? This resets paid amount to 0.')) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/return`);
      loadInvoices();
      alert('Invoice returned successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to return invoice.');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, targetStatus: 'Paid' | 'Unpaid') => {
    const actionText = targetStatus === 'Paid' ? 'mark this bill as PAID (Cash Payment)' : 'mark this bill as UNPAID';
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/update-status`, {
        status: targetStatus,
        paymentMethod: 'Cash'
      });
      loadInvoices();
      alert(`Invoice marked as ${targetStatus} successfully.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update payment status.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.categoryId || !serviceForm.serviceCode || !serviceForm.price) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      const payload = {
        name: serviceForm.name,
        categoryId: serviceForm.categoryId,
        serviceCode: serviceForm.serviceCode.toUpperCase(),
        price: parseFloat(serviceForm.price),
        gstPercentage: parseFloat(serviceForm.gstPercentage),
        durationMinutes: parseInt(serviceForm.durationMinutes),
        sampleRequired: serviceForm.sampleRequired,
        normalRange: serviceForm.normalRange,
        machineRequired: serviceForm.machineRequired,
        homeCollectionAvailable: serviceForm.homeCollectionAvailable,
        emergencyAvailable: serviceForm.emergencyAvailable,
        isActive: serviceForm.isActive
      };

      if (editingService) {
        await api.put(`/diagnostics/services/${editingService.service_id}`, payload);
        alert('Billing line item updated successfully.');
      } else {
        await api.post('/diagnostics/services', payload);
        alert('New billing line item created successfully.');
      }
      setServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        categoryId: categories[0]?.category_id || '',
        serviceCode: '',
        price: '',
        gstPercentage: '18',
        durationMinutes: '30',
        sampleRequired: 'None',
        normalRange: '',
        machineRequired: '',
        homeCollectionAvailable: false,
        emergencyAvailable: false,
        isActive: true
      });
      loadDiagnosticsAndInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save line item.');
    }
  };

  const handleEditServiceClick = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      categoryId: service.category_id,
      serviceCode: service.service_code,
      price: parseFloat(service.price).toString(),
      gstPercentage: parseFloat(service.gst_percentage || '18').toString(),
      durationMinutes: parseInt(service.duration_minutes || '30').toString(),
      sampleRequired: service.sample_required || 'None',
      normalRange: service.normal_range || '',
      machineRequired: service.machine_required || '',
      homeCollectionAvailable: !!service.home_collection_available,
      emergencyAvailable: !!service.emergency_available,
      isActive: !!service.is_active
    });
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this billing line item?')) return;
    try {
      await api.delete(`/diagnostics/services/${serviceId}`);
      alert('Billing line item deleted successfully.');
      loadDiagnosticsAndInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete line item.');
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Invoices & Billing Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Generate patient bills, search diagnostics catalog, and manage cancellations/returns
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'generator' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'generator' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'generator' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'generator' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Invoice Generator
        </button>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'list' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'list' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'list' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          All Bills
        </button>
        <button
          onClick={() => {
            setActiveTab('create-item');
            if (categories.length > 0 && !serviceForm.categoryId) {
              setServiceForm(prev => ({ ...prev, categoryId: categories[0].category_id }));
            }
          }}
          style={{
            padding: '8px 20px',
            background: activeTab === 'create-item' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'create-item' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'create-item' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'create-item' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Create New Line Item
        </button>
      </div>

      {success && <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-success)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>{success}</div>}

      {activeTab === 'generator' ? (
        <>
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '12px' }}>Patient Selection</div>
            <PatientSearchBar onSelect={setPatient} />
            {patient && (
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '8px', marginTop: '12px', fontWeight: 600 }}>
                {patient.first_name} {patient.last_name} ({patient.medical_record_number}) 
                <span style={{ fontSize: '11px', marginLeft: '10px', padding: '2px 8px', borderRadius: '50px', background: patient.is_inpatient ? '#eff6ff' : '#ecfdf5', color: patient.is_inpatient ? '#1d4ed8' : '#047857' }}>
                  {patient.is_inpatient ? 'Inpatient (IP)' : 'Outpatient (OP)'}
                </span>
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '12px' }}>Line Items</div>
            
            {/* Catalog search box */}
            {diagServices.length > 0 && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-primary)' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Quick Search Diagnostics Services Catalog (By Short Code or Test Name)
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="Type to search catalog (e.g. CBP, ESR, LFT...)" 
                      value={diagSearchQuery}
                      onChange={(e) => {
                        setDiagSearchQuery(e.target.value);
                        setDiagDropdownOpen(true);
                      }}
                      onFocus={() => setDiagDropdownOpen(true)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                    />
                    {diagSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => {
                          setDiagSearchQuery('');
                          setDiagDropdownOpen(false);
                        }} 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Floating autocomplete results list */}
                  {diagDropdownOpen && diagSearchQuery && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-primary)', 
                      borderRadius: '8px', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
                      maxHeight: '220px', 
                      overflowY: 'auto', 
                      zIndex: 50,
                      marginTop: '4px'
                    }}>
                      {diagServices
                        .filter(s => 
                          s.name.toLowerCase().includes(diagSearchQuery.toLowerCase()) || 
                          s.service_code.toLowerCase().includes(diagSearchQuery.toLowerCase())
                        )
                        .slice(0, 15) // Limit results for performance
                        .map(s => (
                          <div 
                            key={s.service_id} 
                            onClick={() => {
                              setItemForm({
                                description: s.name,
                                category: s.category_name || 'Diagnostics',
                                quantity: '1',
                                unitPrice: parseFloat(s.price).toString()
                              });
                              setDiagSearchQuery(`${s.name} (${s.service_code})`);
                              setDiagDropdownOpen(false);
                            }}
                            style={{ 
                              padding: '10px 14px', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid var(--border-primary)',
                              transition: 'background 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '13px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <strong style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', marginRight: '8px' }}>[{s.service_code}]</strong>
                              <span>{s.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--accent-success)' }}>Rs. {parseFloat(s.price).toFixed(0)}</span>
                          </div>
                        ))}
                      {diagServices.filter(s => 
                        s.name.toLowerCase().includes(diagSearchQuery.toLowerCase()) || 
                        s.service_code.toLowerCase().includes(diagSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                          No matching tests found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
              <Input label="Description" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Select label="Category" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} options={[{ value: 'Consultation', label: 'Consultation' }, { value: 'Lab', label: 'Lab' }, { value: 'Diagnostics', label: 'Diagnostics' }, { value: 'Medication', label: 'Medication' }, { value: 'Procedure', label: 'Procedure' }, { value: 'General', label: 'General' }]} />
              <Input label="Qty" type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Price" type="number" step="0.01" value={itemForm.unitPrice} onChange={e => setItemForm({ ...itemForm, unitPrice: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Button variant="secondary" icon={<Plus size={16} />} onClick={addItem} style={{ height: '36px' }}>Add</Button>
            </div>
            
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '13px', alignItems: 'center' }}>
                <span>{item.description} ({item.category})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{ padding: '4px', cursor: 'pointer', color: 'var(--accent-danger)', border: 'none', background: 'transparent' }}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Input label="Discount" type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Tax" type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Insurance Coverage" type="number" step="0.01" value={insurance} onChange={e => setInsurance(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
            </div>
            <hr className="divider" style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              <span>Total: <strong>{formatCurrency(total)}</strong></span>
              <span>Patient Owes: <strong style={{ color: 'var(--accent-primary)' }}>{formatCurrency(patientOwes)}</strong></span>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '12px' }}>Payment Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: patient?.is_inpatient ? '1fr 1fr' : '1fr', gap: '16px' }}>
              <Select 
                label="Payment Method" 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Card', label: 'Card' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Insurance', label: 'Insurance' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' }
                ]} 
              />
              {patient?.is_inpatient && (
                <Select 
                  label="Payment Status" 
                  value={paymentStatus} 
                  onChange={e => setPaymentStatus(e.target.value)} 
                  options={[
                    { value: 'Paid', label: 'Paid (Immediate Settlement)' },
                    { value: 'Unpaid', label: 'Unpaid (On Account / Deferred)' }
                  ]} 
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" loading={loading} onClick={handleSubmit} disabled={!patient || items.length === 0}>Create & Print Invoice</Button>
          </div>
        </>
      ) : activeTab === 'list' ? (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          {listError && <div style={{ color: 'var(--accent-danger)', padding: '16px' }}>{listError}</div>}
          {listLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No bills registered in the system.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                    <th style={{ padding: '12px 16px' }}>Patient</th>
                    <th style={{ padding: '12px 16px' }}>Total Amount</th>
                    <th style={{ padding: '12px 16px' }}>Amount Paid</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                        {inv.invoice_id.substring(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inv.patient_name}</td>
                      <td style={{ padding: '12px 16px' }}>{formatCurrency(parseFloat(inv.total_amount))}</td>
                      <td style={{ padding: '12px 16px' }}>{formatCurrency(parseFloat(inv.amount_paid))}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                          background: inv.status === 'Paid' ? 'rgba(16,185,129,0.15)' : 
                                      inv.status === 'Cancelled' ? 'rgba(100,116,139,0.15)' : 
                                      inv.status === 'Returned' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                          color: inv.status === 'Paid' ? 'var(--accent-success)' : 
                                 inv.status === 'Cancelled' ? 'var(--text-muted)' : 
                                 inv.status === 'Returned' ? 'var(--accent-warning)' : 'var(--accent-danger)'
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            onClick={() => handlePrintBill(inv.invoice_id)} 
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                            title="Print Invoice"
                          >
                            <Printer size={13} /> Print
                          </button>
                           {(inv.status === 'Unpaid' || inv.status === 'PartiallyPaid') && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.invoice_id, 'Paid')} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Mark Paid via Cash"
                            >
                              <Check size={13} /> Collect Cash
                            </button>
                          )}
                          {inv.status === 'Paid' && (inv.payment_method === 'Cash' || !inv.payment_method) && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.invoice_id, 'Unpaid')} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Mark Unpaid"
                            >
                              <XCircle size={13} /> Mark Unpaid
                            </button>
                          )}
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.status !== 'Returned' && (
                            <button 
                              onClick={() => handleCancelInvoice(inv.invoice_id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Cancel Bill"
                            >
                              <Ban size={13} /> Cancel
                            </button>
                          )}
                          {inv.status === 'Paid' && (
                            <button 
                              onClick={() => handleReturnInvoice(inv.invoice_id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Return / Refund Bill"
                            >
                              <ArrowLeftRight size={13} /> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px', width: '100%', maxWidth: '380px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search by code or full test name..." 
                value={itemSearch} 
                onChange={(e) => setItemSearch(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
              />
              {itemSearch && <button onClick={() => setItemSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={14} /></button>}
            </div>

            <Button variant="primary" icon={<Plus size={14} />} onClick={() => {
              setEditingService(null);
              setServiceForm({
                name: '',
                categoryId: categories[0]?.category_id || '',
                serviceCode: '',
                price: '',
                gstPercentage: '18',
                durationMinutes: '30',
                sampleRequired: 'None',
                normalRange: '',
                machineRequired: '',
                homeCollectionAvailable: false,
                emergencyAvailable: false,
                isActive: true
              });
              setServiceModalOpen(true);
            }}>
              Create New Line Item
            </Button>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', width: '150px' }}>Short Code</th>
                  <th style={{ padding: '12px 16px' }}>Full Test Name</th>
                  <th style={{ padding: '12px 16px', width: '150px' }}>Category</th>
                  <th style={{ padding: '12px 16px', width: '120px', textAlign: 'right' }}>Price (₹)</th>
                  <th style={{ padding: '12px 16px', width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {diagServices
                  .filter(s => 
                    s.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                    s.service_code.toLowerCase().includes(itemSearch.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.service_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>{s.service_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {s.category_name || 'Laboratory'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>
                        Rs. {parseFloat(s.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEditServiceClick(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><Edit size={13} /> Edit</button>
                          <button onClick={() => handleDeleteService(s.service_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}><Trash2 size={13} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Service creation modal */}
      {serviceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', color: 'var(--text-primary)' }}>
            <button onClick={() => setServiceModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {editingService ? 'Edit Billing Line Item' : 'Add New Billing Line Item'}
            </h2>

            <form onSubmit={handleServiceSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Item/Test Name *</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={serviceForm.name} 
                      onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Short Code *</label>
                    <input 
                      type="text" 
                      className="input" 
                      required
                      value={serviceForm.serviceCode} 
                      onChange={e => setServiceForm({...serviceForm, serviceCode: e.target.value.toUpperCase()})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category *</label>
                    <select 
                      className="select" 
                      required
                      value={serviceForm.categoryId} 
                      onChange={e => setServiceForm({...serviceForm, categoryId: e.target.value})}
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => (
                        <option key={c.category_id} value={c.category_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Price (₹) *</label>
                    <input 
                      type="number" 
                      className="input" 
                      required
                      step="0.01"
                      value={serviceForm.price} 
                      onChange={e => setServiceForm({...serviceForm, price: e.target.value})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>GST %</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={serviceForm.gstPercentage} 
                      onChange={e => setServiceForm({...serviceForm, gstPercentage: e.target.value})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Duration (Mins)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={serviceForm.durationMinutes} 
                      onChange={e => setServiceForm({...serviceForm, durationMinutes: e.target.value})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Sample Type</label>
                    <select 
                      className="select" 
                      value={serviceForm.sampleRequired} 
                      onChange={e => setServiceForm({...serviceForm, sampleRequired: e.target.value})}
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="None">None (Imaging/Scans)</option>
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Sputum">Sputum</option>
                      <option value="Stool">Stool</option>
                      <option value="Swab">Swab</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Normal Range</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. 70 - 110 mg/dL"
                      value={serviceForm.normalRange} 
                      onChange={e => setServiceForm({...serviceForm, normalRange: e.target.value})} 
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={serviceForm.isActive} 
                      onChange={e => setServiceForm({...serviceForm, isActive: e.target.checked})} 
                    />
                    Is Active
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <Button variant="ghost" type="button" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Save Line Item</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
