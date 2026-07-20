import React, { useState, useEffect } from 'react';
import { Beaker, Layers, Plus, Edit, Trash2, X, RefreshCw, Info, CheckCircle, Printer, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const ServiceCatalog: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'reports'>('services');

  // Completed Test Reports States
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [printMode, setPrintMode] = useState<'plain' | 'letterhead'>('plain');

  // Service Modal States
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

  // Package Modal States
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    discount: '0',
    validityDays: '365',
    selectedServices: [] as string[]
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadCatalogData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, servsRes, pkgsRes, settingsRes] = await Promise.all([
        api.get('/diagnostics/categories'),
        api.get('/diagnostics/services'),
        api.get('/diagnostics/packages'),
        api.get('/admin/hospital-settings/public').catch(() => ({ data: { success: false } }))
      ]);

      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (servsRes.data.success) setServices(servsRes.data.data);
      if (pkgsRes.data.success) setPackages(pkgsRes.data.data);
      if (settingsRes.data.success) setHospitalSettings(settingsRes.data.data);
    } catch (err: any) {
      console.error('Failed to load diagnostics catalog:', err);
      setError('Unable to fetch services or health packages catalog.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/diagnostics/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load test orders for reports:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadOrders();
    }
  }, [activeTab]);

  const getCompletedReports = () => {
    const list: any[] = [];
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        if (item.status === 'Completed' || item.status === 'Verified') {
          list.push({
            ...item,
            patient_name: o.first_name || o.last_name ? `${o.first_name || ''} ${o.last_name || ''}`.trim() : (o.patient_name || 'Patient'),
            patient_mrn: o.medical_record_number || o.patient_mrn || '—',
            patient_gender: o.patient_gender || o.gender || 'Male',
            patient_birth_date: o.patient_birth_date || o.birth_date || o.date_of_birth,
            patient_age: o.patient_age !== undefined ? o.patient_age : o.age,
            patient_phone: o.patient_phone || o.phone,
            order_number: o.order_number,
            doctor_name: o.doc_first ? `Dr. ${o.doc_first} ${o.doc_last}` : (o.doctor_name || 'Dr. S Tarundas'),
            created_at: o.created_at,
            order: o
          });
        }
      });
    });
    return list;
  };

  const handlePrintReport = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const isLab = item.category_name === 'Laboratory';
      const hospitalName = hospitalSettings?.hospital_name || 'Telangana Diagnostics';
      const hospitalAddress = hospitalSettings?.hospital_address || 'Central Lab, IPM Campus, Narayanaguda, Hyd - 500029.';
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

      const reportUrl = `${window.location.origin}/verify/reports/${item.item_id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reportUrl)}`;

      const qrCodeHeaderHtml = `<div class="qr-header-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff; text-align: center; box-sizing: border-box; flex-shrink: 0; margin-left: 20px;">
        <img src="${qrCodeUrl}" alt="Verify" style="width: 58px; height: 58px;" />
        <span style="font-size: 6px; font-weight: bold; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.2px;">VERIFY REPORT</span>
      </div>`;

      const headerHtml = printMode === 'letterhead'
        ? `<div style="height: 2.2in; display: flex; justify-content: flex-end; align-items: flex-start; width: 100%; box-sizing: border-box; padding-top: 10px; padding-right: 10px;">
             ${qrCodeHeaderHtml}
           </div>`
        : `<div class="header-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="logo-col">${logoHtml}</div>
            <div class="hospital-details" style="flex: 1; padding-left: 20px;">
              <h1 class="hospital-name" style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">${hospitalName}</h1>
              <p class="hospital-sub" style="font-size: 12px; color: #475569; margin: 2px 0;">${hospitalAddress}</p>
              <p class="hospital-sub" style="font-size: 12px; color: #475569; margin: 2px 0;">Phone: ${phoneNumber} | Web: ${website} | Email: ${email}</p>
              <p class="hospital-sub" style="font-size: 12px; color: #475569; margin: 2px 0;"><strong>GSTIN: ${gstin}</strong></p>
            </div>
            <div class="stamp-col" style="display: flex; align-items: center; justify-content: flex-end;">
              ${qrCodeHeaderHtml}
            </div>
          </div>
          <div class="divider-thick" style="border-bottom: 2.5px solid #0f172a; margin: 12px 0 20px 0;"></div>`;

      const getAgeStr = (birthDateStr?: string, ageVal?: any): string => {
        if (ageVal !== undefined && ageVal !== null && ageVal !== '' && ageVal !== 0) {
          return `${ageVal} Years`;
        }
        if (!birthDateStr) return '—';
        const birth = new Date(birthDateStr);
        const today = new Date();
        if (isNaN(birth.getTime())) return '—';
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
          years--;
          months += 12;
        }
        if (years < 0) return '—';
        return `${years} Years`;
      };

      const ageStr = getAgeStr(item.patient_birth_date, item.patient_age || item.age);
      const dateObj = new Date(item.created_at);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${pad(dateObj.getDate())}-${pad(dateObj.getMonth() + 1)}-${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())} ${dateObj.getHours() >= 12 ? 'PM' : 'AM'}`;

      const parseConcatenatedResult = (actualResult: string) => {
        if (!actualResult || !actualResult.includes(':')) return null;
        try {
          const parts = actualResult.split(',');
          return parts.map(part => {
            const colonIdx = part.indexOf(':');
            if (colonIdx === -1) return null;
            const name = part.substring(0, colonIdx).trim();
            const remaining = part.substring(colonIdx + 1).trim();
            
            const spaceIdx = remaining.indexOf(' ');
            let value = remaining;
            let unit = '';
            if (spaceIdx !== -1) {
              value = remaining.substring(0, spaceIdx).trim();
              unit = remaining.substring(spaceIdx + 1).trim();
            }
            return { name, value, unit };
          }).filter(Boolean);
        } catch (e) {
          return null;
        }
      };

      const checkIsAbnormal = (valStr: string, rangeStr: string): boolean => {
        if (!valStr || !rangeStr || rangeStr === '—') return false;
        
        const valClean = valStr.trim();
        const rangeClean = rangeStr.replace(/\s+/g, ' ').trim();

        // Handle titer comparisons (e.g. 1:160 and <1:80)
        if (valClean.includes(':') && rangeClean.includes(':')) {
          const valParts = valClean.split(':');
          const valTiter = parseFloat(valParts[1]);
          if (!isNaN(valTiter)) {
            if (rangeClean.startsWith('<')) {
              const limitParts = rangeClean.substring(1).trim().split(':');
              const limitTiter = parseFloat(limitParts[1]);
              if (!isNaN(limitTiter)) {
                return valTiter >= limitTiter;
              }
            }
            if (rangeClean.startsWith('>')) {
              const limitParts = rangeClean.substring(1).trim().split(':');
              const limitTiter = parseFloat(limitParts[1]);
              if (!isNaN(limitTiter)) {
                return valTiter <= limitTiter;
              }
            }
          }
        }
        
        const val = parseFloat(valClean);
        if (isNaN(val)) return false;

        const cleanRange = rangeClean;

        try {
          if (cleanRange.includes('-')) {
            const parts = cleanRange.split('-');
            if (parts.length === 2) {
              const min = parseFloat(parts[0].trim());
              const max = parseFloat(parts[1].trim());
              if (!isNaN(min) && !isNaN(max)) {
                return val < min || val > max;
              }
            }
          }
          if (cleanRange.includes('–')) {
            const parts = cleanRange.split('–');
            if (parts.length === 2) {
              const min = parseFloat(parts[0].trim());
              const max = parseFloat(parts[1].trim());
              if (!isNaN(min) && !isNaN(max)) {
                return val < min || val > max;
              }
            }
          }
          if (cleanRange.startsWith('<')) {
            const limit = parseFloat(cleanRange.substring(1).trim());
            if (!isNaN(limit)) {
              return val >= limit;
            }
          }
          if (cleanRange.startsWith('>')) {
            const limit = parseFloat(cleanRange.substring(1).trim());
            if (!isNaN(limit)) {
              return val <= limit;
            }
          }
        } catch (e) {
          console.error(e);
        }
        return false;
      };

      const refRanges: { [key: string]: string } = {
        'HAEMOGLOBIN': '12.0 - 15.0 g/dL',
        'TOTAL RBC COUNT': '3.8 - 4.8 X 10¹²/L',
        'PCV / HCT': '36 - 46 %',
        'MCV': '83 - 101 fl',
        'MCH': '27 - 32 pg',
        'MCHC': '31.5 - 34.5 g/dl',
        'RDW': '11.5 - 13.5 %',
        'TOTAL WBC COUNT': '4.0-10.0 X 10³/uL',
        'PLATELET COUNT': '150 - 410 X 10³/uL',
        'NEUTROPHILS': '2.0-7.5 X 10³/uL (40 - 80%)',
        'LYMPHOCYTES': '1.0-4.0 X 10³/uL (20 - 40%)',
        'MONOCYTES': '0.2-1.0 X 10³/uL (2 - 10%)',
        'EOSINOPHILS': '0.02-0.5 X 10³/uL (1 - 6%)',
        'BASOPHILS': '0.02 - 0.1 X 10³/uL (1 - 2%)',
        'POLYMORPHS': '40 - 80 %',
        'RBC MORPHOLOGY': 'Normocytic Normochromic',
        'WBC ON SMEAR': 'Normal count & distribution',
        'PLATELETS ON SMEAR': 'Adequate',
        'COLOUR': 'PALE YELLOW',
        'APPEARANCE': 'CLEAR',
        'REACTION / PH': '4.6 - 8.0',
        'SPECIFIC GRAVITY': '1.003 - 1.035',
        'PROTEINS': 'NIL',
        'GLUCOSE': 'NIL',
        'BLOOD': 'NIL',
        'KETONE BODIES': 'Negative',
        'BILIRUBIN': 'Negative',
        'UROBILINOGEN': 'Present in normal amount',
        'NITRITE': 'Negative',
        'PUS CELLS': '0 - 5 /HPF',
        'EPITHELIAL CELLS': '0 - 8 /HPF',
        'RBC': 'Nil',
        'CASTS': 'Nil',
        'CRYSTALS': 'Nil',
        'OTHERS': 'Nil',
        'ABSOLUTE EOSINOPHIL COUNT': '40-440 cells/µL',
        'ACTIVATED PARTIAL THROMBOPLASTIN TIME': '25-35 sec',
        'CONTROL': 'Laboratory Control',
        'APTT RATIO': '0.8-1.2',
        'ALKALINE PHOSPHATASE': '44-147 U/L',
        'ERYTHROCYTE SEDIMENTATION RATE': '0-15 (Male)',
        'RANDOM BLOOD SUGAR': '70-140 mg/dL',
        'FASTING BLOOD SUGAR': '70-99 mg/dL'
      };

      const lr = item.lab_result || {};
      let finalParameters = item.result_parameters || [];
      if (isLab && (!finalParameters || finalParameters.length === 0) && lr.actual_result) {
        const parsed = parseConcatenatedResult(lr.actual_result);
        if (parsed) {
          finalParameters = parsed.map((p: any, idx: number) => ({
            parameter_id: `parsed-${idx}`,
            parameter_name: p.name,
            actual_value: p.value,
            unit: p.unit,
            reference_range: refRanges[p.name.toUpperCase()] || '',
            status: 'Normal'
          }));
        }
      }

      // Determine department title for ALL test categories
      const getDeptTitle = () => {
        const catName = (item.category_name || '').toUpperCase();
        const svcName = (item.service_name || '').toUpperCase();
        if (catName === 'LABORATORY') {
          if (svcName.includes('BLOOD') || svcName.includes('HEM') || svcName.includes('CBC') || svcName.includes('CBP')) return 'HAEMATOLOGY';
          if (svcName.includes('URINE') || svcName.includes('CUE')) return 'CLINICAL PATHOLOGY';
          return 'CLINICAL BIOCHEMISTRY';
        }
        if (catName.includes('RADIOLOGY')) return 'RADIOLOGY DEPARTMENT';
        if (catName.includes('ULTRASOUND')) return 'ULTRASOUND / SONOGRAPHY DEPARTMENT';
        if (catName.includes('CARDIOLOGY')) return 'CARDIOLOGY DEPARTMENT';
        if (catName.includes('NEUROLOGY')) return 'NEUROLOGY DEPARTMENT';
        return catName || 'DIAGNOSTICS DEPARTMENT';
      };
      const deptTitle = getDeptTitle();

      let resultHtml = '';
      if (isLab) {
        if (finalParameters.length > 0) {
          const isHaematology = item.service_name.toUpperCase().includes('BLOOD') || item.service_name.toUpperCase().includes('HEM') || item.service_name.toUpperCase().includes('CBC') || item.service_name.toUpperCase().includes('CBP');
          const refHeader = isHaematology ? 'Normal Reference Range' : 'Biological Reference Interval';

          resultHtml = `
            <div style="text-align: center; margin-top: 10px; margin-bottom: 15px;">
              <h2 style="font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; color: #0f172a; text-transform: uppercase;">
                ${deptTitle}
              </h2>
              <h3 style="font-size: 12px; font-weight: 700; text-decoration: underline; margin: 4px 0 0 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
                ${item.service_name}
              </h3>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
              <thead>
                 <tr style="border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; text-align: left; font-size: 11px; color: #475569;">
                   <th style="padding: 8px 0; font-weight: 700; width: 45%; text-transform: uppercase;">Investigation</th>
                   <th style="padding: 8px 0; font-weight: 700; width: 25%; text-align: center; text-transform: uppercase;">Result</th>
                   <th style="padding: 8px 0; font-weight: 700; width: 30%; text-align: right; text-transform: uppercase;">${refHeader}</th>
                 </tr>
              </thead>
              <tbody>
                 ${finalParameters.map((rp: any) => {
                   const name = rp.parameter_name || rp.name || '';
                   const isHeader = name.toUpperCase() === 'DIFFERENTIAL LEUKOCYTE COUNT' || name.toUpperCase() === 'PHYSICAL EXAMINATION' || name.toUpperCase() === 'CHEMICAL EXAMINATION' || name.toUpperCase() === 'MICROSCOPIC EXAMINATION' || name.toUpperCase() === 'PERIPHERAL SMEAR';
                   
                   if (isHeader) {
                     return `
                       <tr style="background: #f8fafc;">
                         <td colspan="3" style="padding: 8px 0; font-weight: 800; font-size: 12px; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #cbd5e1;">
                           ${name}
                         </td>
                       </tr>
                     `;
                   }

                   const refVal = rp.reference_range || refRanges[name.toUpperCase()] || '—';
                   const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(rp.actual_value || rp.actualValue || '', refVal);
                   return `
                     <tr style="border-bottom: 1px solid #f1f5f9;">
                       <td style="padding: 8px 0; font-weight: 500;">
                         <div>${name}</div>
                       </td>
                       <td style="padding: 8px 0; text-align: center;">
                         <span style="font-size: 13px; font-weight: ${isAbnormal ? '700' : '400'}; color: ${isAbnormal ? '#ef4444' : '#0f172a'};">${rp.actual_value || rp.actualValue || '—'}</span>
                         <span style="font-size: 11px; color: #64748b; margin-left: 2px;">${rp.unit || ''}</span>
                       </td>
                       <td style="padding: 8px 0; text-align: right; color: #475569; font-family: monospace; font-size: 11px;">
                         ${refVal}
                       </td>
                     </tr>
                   `;
                 }).join('')}
              </tbody>
            </table>

            <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
              <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 12px; font-weight: 700;">Interpretation</h4>
              <p style="margin: 0; font-size: 12px; color: #334155; white-space: pre-wrap;">${lr.remarks || lr.interpretation || 'Within normal limits. Please correlate clinically.'}</p>
            </div>
          `;
        } else {
          resultHtml = `
            <table class="table" style="margin-top: 15px; width: 100%; border-collapse: collapse;">
              <thead>
                 <tr style="border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; text-align: left; font-size: 11px; color: #475569;">
                   <th style="padding: 8px 0; font-weight: 700; width: 45%; text-transform: uppercase;">Investigation</th>
                   <th style="padding: 8px 0; font-weight: 700; width: 25%; text-align: center; text-transform: uppercase;">Result</th>
                   <th style="padding: 8px 0; font-weight: 700; width: 30%; text-align: right; text-transform: uppercase;">Biological Reference Interval</th>
                 </tr>
              </thead>
              <tbody>
                 <tr style="border-bottom: 1px solid #f1f5f9;">
                   <td style="padding: 10px 0; font-weight: 700;">${item.service_name}</td>
                   <td style="padding: 10px 0; text-align: center; font-weight: ${lr.status !== 'Normal' ? '700' : '400'}; color: ${lr.status !== 'Normal' ? '#ef4444' : '#0f172a'};">${lr.actual_result || '—'}</td>
                   <td style="padding: 10px 0; text-align: right; font-family: monospace;">${lr.reference_range || item.normal_range || '—'}</td>
                 </tr>
              </tbody>
            </table>
          `;
        }
      } else {
        const findings = item.radiology_report?.findings || item.ultrasound_report?.findings || item.ecg_report?.findings || '—';
        const impression = item.radiology_report?.impression || item.ultrasound_report?.impression || item.ecg_report?.interpretation || '—';
        const conclusion = item.radiology_report?.conclusion || item.ultrasound_report?.recommendations || item.ecg_report?.recommendation || '';
        
        resultHtml = `
          <div style="text-align: center; margin-top: 10px; margin-bottom: 15px;">
            <h2 style="font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; color: #0f172a; text-transform: uppercase;">
              ${deptTitle}
            </h2>
            <h3 style="font-size: 12px; font-weight: 700; text-decoration: underline; margin: 4px 0 0 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
              ${item.service_name}
            </h3>
          </div>

          <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px; font-size: 13px;">
            <div>
              <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Dictated Findings</h4>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; white-space: pre-wrap; font-family: monospace;">${findings}</div>
            </div>
            <div>
              <h4 style="margin: 0 0 4px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Diagnostic Impression</h4>
              <p style="margin: 0; font-weight: 700; color: #0f172a;">${impression}</p>
            </div>
            ${conclusion ? `
              <div>
                <h4 style="margin: 0 0 4px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Conclusion / Recommendations</h4>
                <p style="margin: 0; color: #334155;">${conclusion}</p>
              </div>
            ` : ''}
            <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
              <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 12px; font-weight: 700;">Interpretation</h4>
              <p style="margin: 0; font-size: 12px; color: #334155; white-space: pre-wrap;">${impression !== '—' ? impression : 'Please correlate clinically.'}</p>
            </div>
          </div>
        `;
      }

      const verifiedBy = item.verification?.verified_by_name || 'Dr. Priya Nair (Pathologist) M.D.';
      const verifiedDate = item.verification?.verified_at 
        ? new Date(item.verification.verified_at).toLocaleDateString() + ' ' + new Date(item.verification.verified_at).toLocaleTimeString()
        : formattedDate;

      printWindow.document.write(`
        <html>
          <head>
            <title>DIAGNOSTIC REPORT - ${item.patient_name}</title>
            <style>
              @page { size: auto; margin: 10mm 15mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.3; font-size: 12px; padding: 0; margin: 0; }
              .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
              .hospital-details { flex: 1; padding-left: 20px; }
              .hospital-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
              .hospital-sub { font-size: 11px; color: #475569; margin: 1px 0; }
              .divider-thick { border-bottom: 2px solid #0f172a; margin: 8px 0 12px 0; }
              
              /* Force everything to fit on one page */
              @media print {
                html, body { height: 99%; overflow: hidden; page-break-after: avoid; page-break-before: avoid; }
                table { margin-bottom: 8px !important; page-break-inside: avoid; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                td, th { padding: 4px 0 !important; font-size: 11px !important; }
                .footer-signature { margin-top: 25px !important; page-break-inside: avoid; }
                h2, h3 { margin-top: 2px !important; margin-bottom: 2px !important; }
              }
            </style>
          </head>
          <body onload="window.print(); setTimeout(function() { window.close(); }, 500);">
            ${headerHtml}

            <!-- Metadata Patient Card Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
              <tbody>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569; width: 15%;">Patient Name:</td>
                  <td style="padding: 3px 0; font-weight: 700; width: 35%; text-transform: uppercase;">${item.patient_name}</td>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569; width: 15%;">Ref. Doctor:</td>
                  <td style="padding: 3px 0; font-weight: 700; width: 35%; text-transform: uppercase;">${item.doctor_name || 'Dr S Tarundas'}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">Patient Id:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${item.patient_mrn}</td>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">Lab Id:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${item.item_id.substring(0, 8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">OP Id:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${item.order_number || 'HY-SVN-1225-00080'}</td>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">Sample Collection Date:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">Age/Gender:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${ageStr} / ${(item.patient_gender || item.gender || 'Male').toUpperCase()}</td>
                  <td style="padding: 3px 0; font-weight: 600; color: #475569;">Reporting Date & time:</td>
                  <td style="padding: 3px 0; font-weight: 700;">${verifiedDate}</td>
                </tr>
              </tbody>
            </table>

            <!-- Result Table Block (Occupies full page width for spacing layout optimization) -->
            <div style="width: 100%; margin-bottom: 15px;">
              ${resultHtml}
            </div>

            <!-- Signature block -->
            <div class="footer-signature" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 35px; font-size: 11px;">
              <div>
                <p style="margin: 0; color: #475569; font-style: italic;">Please correlate clinically</p>
                <p style="margin: 4px 0 0 0; color: #475569;">Test Performed By : <strong style="color: #0f172a;">${item.order?.items?.[0]?.entered_by_name || 'clsowmya'}</strong></p>
              </div>
              <div style="text-align: right; width: 220px;">
                <div style="font-family: 'Georgia', cursive; font-style: italic; color: #1e3a8a; font-size: 16px; font-weight: 700; margin-bottom: 2px;">
                  ${verifiedBy.includes('Priya') ? 'Dr Priya Nair' : 'Dr Vidya Kedari'}
                </div>
                <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: 700; color: #0f172a;">
                  ${verifiedBy}
                </div>
                <div style="font-size: 10px; color: #64748b;">
                  Consultant Pathologist
                </div>
              </div>
            </div>

            <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 15px; font-weight: bold; letter-spacing: 2px;">
              *** END OF REPORT ***
            </div>

            <div style="margin-bottom: 20px;"></div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openAddServiceModal = () => {
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
    setModalError('');
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (s: any) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      categoryId: s.category_id || '',
      serviceCode: s.service_code,
      price: parseFloat(s.price).toString(),
      gstPercentage: parseFloat(s.gst_percentage || '18').toString(),
      durationMinutes: parseInt(s.duration_minutes || '30').toString(),
      sampleRequired: s.sample_required || 'None',
      normalRange: s.normal_range || '',
      machineRequired: s.machine_required || '',
      homeCollectionAvailable: !!s.home_collection_available,
      emergencyAvailable: !!s.emergency_available,
      isActive: !!s.is_active
    });
    setModalError('');
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service from the catalog?')) return;
    try {
      await api.delete(`/diagnostics/services/${serviceId}`);
      loadCatalogData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove service.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    const payload = {
      ...serviceForm,
      price: parseFloat(serviceForm.price),
      gstPercentage: parseFloat(serviceForm.gstPercentage),
      durationMinutes: parseInt(serviceForm.durationMinutes)
    };

    try {
      if (editingService) {
        await api.put(`/diagnostics/services/${editingService.service_id}`, payload);
      } else {
        await api.post('/diagnostics/services', payload);
      }
      setServiceModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save diagnostic service.');
    } finally {
      setModalLoading(false);
    }
  };

  const openAddPackageModal = () => {
    setPackageForm({
      name: '',
      price: '',
      discount: '0',
      validityDays: '365',
      selectedServices: []
    });
    setModalError('');
    setPackageModalOpen(true);
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (packageForm.selectedServices.length === 0) {
      setModalError('Select at least one service test to bundle in this package.');
      return;
    }
    setModalLoading(true);
    setModalError('');

    const payload = {
      name: packageForm.name,
      price: parseFloat(packageForm.price),
      discount: parseFloat(packageForm.discount),
      validityDays: parseInt(packageForm.validityDays),
      services: packageForm.selectedServices
    };

    try {
      await api.post('/diagnostics/packages', payload);
      setPackageModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save test package.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleServiceSelectToggle = (serviceId: string) => {
    const isSelected = packageForm.selectedServices.includes(serviceId);
    if (isSelected) {
      setPackageForm({
        ...packageForm,
        selectedServices: packageForm.selectedServices.filter(id => id !== serviceId)
      });
    } else {
      setPackageForm({
        ...packageForm,
        selectedServices: [...packageForm.selectedServices, serviceId]
      });
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={28} color="var(--accent-primary)" />
            Diagnostics Catalog & Packages
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage the list of laboratory tests, imaging services, and bundled health checkup packages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'reports' ? (
            <Button variant="secondary" onClick={loadOrders} icon={<RefreshCw size={14} />}>
              Refresh Reports
            </Button>
          ) : (
            <Button variant="secondary" onClick={loadCatalogData} icon={<RefreshCw size={14} />}>
              Refresh Catalog
            </Button>
          )}
          {activeTab === 'services' && (
            <Button variant="primary" onClick={openAddServiceModal} icon={<Plus size={14} />}>
              Add Test Service
            </Button>
          )}
          {activeTab === 'packages' && (
            <Button variant="primary" onClick={openAddPackageModal} icon={<Plus size={14} />}>
              Create Bundle Package
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'services' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'services' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'services' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'services' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Individual Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'packages' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'packages' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'packages' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'packages' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Bundled Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'reports' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'reports' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'reports' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'reports' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Print Completed Reports
        </button>
      </div>

      {loading || (activeTab === 'reports' && ordersLoading) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'reports' ? 'Loading completed test reports...' : 'Loading catalog...'}
          </span>
        </div>
      ) : activeTab === 'services' ? (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Test / Service Name</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Sample Type</th>
                  <th style={{ padding: '12px 16px' }}>Price (Rs.)</th>
                  <th style={{ padding: '12px 16px' }}>Reference Ranges</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.service_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.service_code}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 500 }}>
                        {s.category_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{s.sample_required || 'None'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Rs. {parseFloat(s.price).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.normal_range}>
                      {s.normal_range || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                        background: s.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                        color: s.is_active ? 'var(--accent-success)' : 'var(--accent-danger)'
                      }}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditServiceModal(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={14} /></button>
                        <button onClick={() => handleDeleteService(s.service_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'packages' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {packages.map((pkg) => (
            <Card key={pkg.package_id} title={pkg.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0 16px 0', flexWrap: 'wrap' }}>
                    {pkg.services.map((s: any) => (
                      <span key={s.service_id} style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Package Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-success)' }}>
                      Rs. {parseFloat(pkg.price).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validity: {pkg.validity_days} Days</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discount: Rs. {parseFloat(pkg.discount || '0').toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px', width: '100%', maxWidth: '340px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search patient name, MRN, or order number..." 
                  value={reportSearch} 
                  onChange={(e) => setReportSearch(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                />
                {reportSearch && <button onClick={() => setReportSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={14} /></button>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 600 }}>Print Mode:</span>
                <select 
                  className="select" 
                  value={printMode} 
                  onChange={(e) => setPrintMode(e.target.value as any)} 
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', minHeight: 'auto', border: '1px solid var(--border-primary)', cursor: 'pointer' }}
                >
                  <option value="plain">Plain Paper (Full Header)</option>
                  <option value="letterhead">Pre-printed Letterhead (2.2" Gap, No Header)</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Completed Reports: <strong>{getCompletedReports().length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px' }}>Patient Details</th>
                  <th style={{ padding: '12px 16px' }}>Test Name</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Verified Date</th>
                  <th style={{ padding: '12px 16px' }}>Doctor Sign-off</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getCompletedReports()
                  .filter(r => 
                    r.patient_name.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    r.patient_mrn.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    r.order_number.toLowerCase().includes(reportSearch.toLowerCase())
                  )
                  .map((r, idx) => {
                    const verifiedDate = r.verification?.verified_at 
                      ? new Date(r.verification.verified_at).toLocaleDateString() + ' ' + new Date(r.verification.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(r.created_at).toLocaleDateString();

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{r.order_number}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{r.patient_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {r.patient_mrn}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.service_name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {r.category_name}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{verifiedDate}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--accent-success)' }}>
                          ✓ {r.verification?.verified_by_name || 'Dr. Priya Nair'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            icon={<Printer size={13} />}
                            onClick={() => handlePrintReport(r)}
                          >
                            Print Report
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                {getCompletedReports().length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No completed or verified test reports available to print.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Service Modal */}
      {serviceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setServiceModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {editingService ? 'Edit Diagnostic Service' : 'Add New Diagnostic Service'}
            </h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleServiceSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Service/Test Name *</label>
                    <input type="text" className="input" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Service Code *</label>
                    <input type="text" className="input" value={serviceForm.serviceCode} onChange={(e) => setServiceForm({ ...serviceForm, serviceCode: e.target.value })} required placeholder="e.g. CBC, XRAY" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Department Category *</label>
                    <select className="select" value={serviceForm.categoryId} onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Price (Rs.) *</label>
                    <input type="number" className="input" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sample Required</label>
                    <input type="text" className="input" value={serviceForm.sampleRequired} onChange={(e) => setServiceForm({ ...serviceForm, sampleRequired: e.target.value })} placeholder="e.g. Blood, Urine, None" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calibration Machine</label>
                    <input type="text" className="input" value={serviceForm.machineRequired} onChange={(e) => setServiceForm({ ...serviceForm, machineRequired: e.target.value })} placeholder="e.g. Hematology Auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Normal / Reference Range</label>
                  <input type="text" className="input" value={serviceForm.normalRange} onChange={(e) => setServiceForm({ ...serviceForm, normalRange: e.target.value })} placeholder="e.g. TSH: 0.4 - 4.0 uIU/mL" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.homeCollectionAvailable} onChange={(e) => setServiceForm({ ...serviceForm, homeCollectionAvailable: e.target.checked })} />
                    Home Collect
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.emergencyAvailable} onChange={(e) => setServiceForm({ ...serviceForm, emergencyAvailable: e.target.checked })} />
                    Emergency Lab
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.isActive} onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })} />
                    Active Status
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Save Service</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {packageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '540px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setPackageModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Create Health Test Bundle Package</h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handlePackageSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Package Title *</label>
                  <input type="text" className="input" value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} required placeholder="e.g. Master Executive Health Checkup" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Package Price *</label>
                    <input type="number" className="input" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Discount Amount</label>
                    <input type="number" className="input" value={packageForm.discount} onChange={(e) => setPackageForm({ ...packageForm, discount: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Validity (Days)</label>
                    <input type="number" className="input" value={packageForm.validityDays} onChange={(e) => setPackageForm({ ...packageForm, validityDays: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Select Included Tests *</label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)' }}>
                    {services.map(s => {
                      const isChecked = packageForm.selectedServices.includes(s.service_id);
                      return (
                        <label key={s.service_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '4px', borderRadius: '4px', background: isChecked ? 'rgba(14,165,233,0.04)' : 'transparent' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleServiceSelectToggle(s.service_id)} />
                          <span>{s.name} ({s.service_code})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setPackageModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Create Package</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ServiceCatalog;
