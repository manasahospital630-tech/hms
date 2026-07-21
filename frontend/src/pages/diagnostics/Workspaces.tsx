import React, { useState, useEffect } from 'react';
import { Beaker, ShieldAlert, Award, FileText, CheckCircle, RefreshCw, X, AlertTriangle, Upload, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

export const Workspaces: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<'collection' | 'lab' | 'imaging' | 'verification'>('collection');

  // Modal Action States
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [containerType, setContainerType] = useState('EDTA Tube (Purple Top)');
  const [barcode, setBarcode] = useState('');
  
  // Lab result fields
  const [actualResult, setActualResult] = useState('');
  const [labStatus, setLabStatus] = useState('Normal');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  
  // Imaging fields (Radiology, USG, ECG)
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');

  // Doctor verification fields
  const [verifyStatus, setVerifyStatus] = useState('Approved');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [paramValues, setParamValues] = useState<{ [paramId: string]: string }>({});

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [ordersRes, machinesRes] = await Promise.all([
        api.get('/diagnostics/orders'),
        api.get('/diagnostics/machines')
      ]);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (machinesRes.data.success) {
        setMachines(machinesRes.data.data);
        if (machinesRes.data.data.length > 0) {
          setSelectedMachineId(machinesRes.data.data[0].machine_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const openActionModal = (item: any) => {
    setActionItem(item);
    setBarcode(`BAR-${Date.now().toString().substring(8)}`);
    setActualResult(item.lab_result?.actual_result || '');
    setLabStatus(item.lab_result?.status || 'Normal');
    setFindings('');
    setImpression('');
    setConclusion('');
    setClinicalHistory('');
    setVerifyStatus('Approved');
    setVerifyNotes('');
    setActionError('');

    // Initialize parameter values
    const initialParams: { [key: string]: string } = {};
    if (item.result_parameters && Array.isArray(item.result_parameters) && item.result_parameters.length > 0) {
      item.result_parameters.forEach((rp: any) => {
        initialParams[rp.parameter_id] = rp.actual_value || '';
      });
    } else if (item.parameters && Array.isArray(item.parameters)) {
      item.parameters.forEach((p: any) => {
        initialParams[p.parameter_id] = '';
      });
    }
    setParamValues(initialParams);

    setActionModalOpen(true);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    try {
      if (activeWorkspace === 'collection') {
        const itemsToCollect = getPackageGroupItems(actionItem);
        for (const targetItem of itemsToCollect) {
          const payload = {
            itemId: targetItem.item_id,
            containerType,
            barcode,
            remarks: 'Sample collection logged successfully'
          };
          await api.post('/diagnostics/samples/collect', payload);
        }
      } else if (activeWorkspace === 'lab') {
        if (actionItem.package_id) {
          const groupItems = getPackageGroupItems(actionItem);
          for (const targetItem of groupItems) {
            const hasParams = targetItem.parameters && Array.isArray(targetItem.parameters) && targetItem.parameters.length > 0;
            let submitActualResult = '';
            let submitParams = undefined;

            if (hasParams) {
              submitParams = targetItem.parameters.map((p: any) => ({
                parameterId: p.parameter_id,
                name: p.name,
                unit: p.unit,
                referenceRange: p.reference_range,
                actualValue: paramValues[p.parameter_id] || ''
              }));
              submitActualResult = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
            } else {
              submitActualResult = paramValues[`svc-${targetItem.item_id}`] || 'Normal';
            }

            const payload = {
              itemId: targetItem.item_id,
              actualResult: submitActualResult,
              referenceRange: targetItem.normal_range || 'Normal',
              status: labStatus,
              machineId: selectedMachineId || null,
              remarks: 'Grouped profile lab values entered',
              parameters: submitParams
            };
            await api.post('/diagnostics/results/submit?type=lab', payload);
          }
        } else {
          const hasParams = actionItem.parameters && Array.isArray(actionItem.parameters) && actionItem.parameters.length > 0;
          let submitActualResult = actualResult;
          let submitParams = undefined;

          if (hasParams) {
            submitParams = actionItem.parameters.map((p: any) => ({
              parameterId: p.parameter_id,
              name: p.name,
              unit: p.unit,
              referenceRange: p.reference_range,
              actualValue: paramValues[p.parameter_id] || ''
            }));
            submitActualResult = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
          }

          const payload = {
            itemId: actionItem.item_id,
            actualResult: submitActualResult,
            referenceRange: actionItem.normal_range,
            status: labStatus,
            machineId: selectedMachineId || null,
            remarks: 'Lab values entered',
            parameters: submitParams
          };
          await api.post('/diagnostics/results/submit?type=lab', payload);
        }
      } else if (activeWorkspace === 'imaging') {
        const isXray = actionItem.category_name === 'Radiology';
        const isUsg = actionItem.category_name === 'Ultrasound';
        
        if (isXray) {
          const payload = {
            itemId: actionItem.item_id,
            findings,
            impression,
            conclusion,
            imageUrls: ['/scans/xray_stub.jpg']
          };
          await api.post('/diagnostics/results/submit?type=radiology', payload);
        } else if (isUsg) {
          const payload = {
            itemId: actionItem.item_id,
            findings,
            impression,
            clinicalHistory,
            recommendations: conclusion
          };
          await api.post('/diagnostics/results/submit?type=ultrasound', payload);
        } else {
          // ECG
          const hasParams = actionItem.parameters && Array.isArray(actionItem.parameters) && actionItem.parameters.length > 0;
          let submitParams = undefined;
          let submitFindings = findings;
          if (hasParams) {
            submitParams = actionItem.parameters.map((p: any) => ({
              parameterId: p.parameter_id,
              name: p.name,
              unit: p.unit,
              referenceRange: p.reference_range,
              actualValue: paramValues[p.parameter_id] || ''
            }));
            submitFindings = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
          }

          const payload = {
            itemId: actionItem.item_id,
            findings: submitFindings,
            interpretation: impression || 'ECG Analysis Completed',
            recommendation: conclusion,
            graphUrl: '/scans/ecg_graph.png',
            parameters: submitParams
          };
          await api.post('/diagnostics/results/submit?type=ecg', payload);
        }
      } else if (activeWorkspace === 'verification') {
        const itemsToVerify = getPackageGroupItems(actionItem);
        for (const targetItem of itemsToVerify) {
          const payload = {
            itemId: targetItem.item_id,
            status: verifyStatus,
            notes: verifyNotes,
            digitalSignatureUsed: 'Dr. Pathologist Digital Approval Stamp'
          };
          await api.post('/diagnostics/results/verify', payload);
        }
      }

      setActionModalOpen(false);
      loadWorkspaceData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to submit clinical workspace action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter items in orders based on current workspace
  const getWorkspaceItems = () => {
    const items: any[] = [];
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        const requiresSample = item.sample_required && item.sample_required !== 'None' && item.sample_required !== '';
        const matchesWorkspace = 
          (activeWorkspace === 'collection' && requiresSample && item.status === 'Ordered') ||
          (activeWorkspace === 'lab' && requiresSample && item.status === 'SampleCollected') ||
          (activeWorkspace === 'imaging' && !requiresSample && (item.status === 'Ordered' || item.status === 'SampleCollected')) ||
          (activeWorkspace === 'verification' && item.status === 'Resulted');
          
        if (matchesWorkspace) {
          items.push({
            ...item,
            order_id: o.order_id,
            patient_name: `${o.first_name} ${o.last_name}`,
            patient_mrn: o.medical_record_number,
            order_number: o.order_number,
            priority: o.priority,
            clinical_notes: o.clinical_notes,
            diagnosis: o.diagnosis,
            all_order_items: o.items || []
          });
        }
      });
    });
    return items;
  };

  const workspaceItems = getWorkspaceItems();

  // Helper to get all items belonging to the same package in an order
  const getPackageGroupItems = (item: any) => {
    if (!item || !item.package_id || !item.all_order_items) return [item];
    return item.all_order_items.filter((i: any) => i.package_id === item.package_id);
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beaker size={28} color="var(--accent-primary)" />
            Diagnostics Clinical Workspaces
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Collect samples, input lab analyzer results, dictate scan findings & approve verifications
          </p>
        </div>
        <Button variant="secondary" onClick={loadWorkspaceData} icon={<RefreshCw size={14} />}>
          Refresh Queue
        </Button>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'collection', label: 'Sample Collection Desk', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.sample_required && i.sample_required !== 'None' && i.sample_required !== '' && i.status === 'Ordered').length, 0) },
          { id: 'lab', label: 'Laboratory Analyzer', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.sample_required && i.sample_required !== 'None' && i.sample_required !== '' && i.status === 'SampleCollected').length, 0) },
          { id: 'imaging', label: 'Imaging Dept (X-Ray/USG/ECG)', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => (!i.sample_required || i.sample_required === 'None' || i.sample_required === '') && (i.status === 'Ordered' || i.status === 'SampleCollected')).length, 0) },
          { id: 'verification', label: 'Pathologist Verification', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.status === 'Resulted').length, 0) }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveWorkspace(tab.id as any)}
            style={{
              padding: '10px 18px',
              background: activeWorkspace === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeWorkspace === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: activeWorkspace === tab.id ? '1px solid var(--border-primary)' : '1px solid transparent',
              borderBottom: activeWorkspace === tab.id ? '1px solid transparent' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-3px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            <span style={{ fontSize: '11px', background: tab.count > 0 ? 'var(--accent-danger)' : 'var(--bg-primary)', color: tab.count > 0 ? '#fff' : 'var(--text-muted)', padding: '2px 6px', borderRadius: '50px' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading active diagnostic queue...</span>
        </div>
      ) : workspaceItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
          <CheckCircle size={48} color="var(--accent-success)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>Queue Clean & Completed</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            There are no pending tasks waiting in this diagnostic workspace.
          </p>
        </div>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px' }}>Patient Info</th>
                  <th style={{ padding: '12px 16px' }}>Test requested</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Clinical Indication</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Workspace Action</th>
                </tr>
              </thead>
              <tbody>
                {workspaceItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{item.order_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{item.patient_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {item.patient_mrn}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{item.service_name}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {item.service_code} ({item.category_name})</span>
                        {item.package_name && (
                          <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Profile: {item.package_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                        background: item.priority === 'Emergency' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.1)',
                        color: item.priority === 'Emergency' ? 'var(--accent-danger)' : 'var(--text-secondary)'
                      }}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.diagnosis || item.clinical_notes || 'Routine checkup'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button variant="primary" size="sm" onClick={() => openActionModal(item)}>
                        {activeWorkspace === 'collection' && (item.package_id ? 'Collect Profile Samples' : 'Collect Sample')}
                        {activeWorkspace === 'lab' && (item.package_id ? 'Enter Group Results' : 'Enter Results')}
                        {activeWorkspace === 'imaging' && 'Perform & Document'}
                        {activeWorkspace === 'verification' && 'Review & Verify'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Action Dialog Modal */}
      {actionModalOpen && actionItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: actionItem.package_id ? '640px' : '520px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setActionModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              {activeWorkspace === 'collection' && (actionItem.package_id ? 'Phlebotomy Profile Sample Collection' : 'Phlebotomy Sample Collection')}
              {activeWorkspace === 'lab' && (actionItem.package_id ? 'Grouped Profile Lab Result Entry' : 'Hematology & Biochemistry Entry')}
              {activeWorkspace === 'imaging' && 'Diagnostic Imaging Documentation'}
              {activeWorkspace === 'verification' && 'Sign-Off Report Verification'}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Patient: <strong>{actionItem.patient_name}</strong> | Test: <strong>{actionItem.service_name}</strong>
              {actionItem.package_name && (
                <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: '6px' }}>[Package: {actionItem.package_name}]</span>
              )}
            </p>

            {actionError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleActionSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Sample Collection Desk Form */}
                {activeWorkspace === 'collection' && (
                  <>
                    {actionItem.package_id && (
                      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Profile Grouped Tests ({getPackageGroupItems(actionItem).length} Tests):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {getPackageGroupItems(actionItem).map((pItem: any) => (
                            <span key={pItem.item_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500 }}>
                              ✓ {pItem.service_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Container Tube Type *</label>
                      <select className="select" value={containerType} onChange={(e) => setContainerType(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <option value="EDTA Tube (Purple Top)">EDTA Tube (Purple Top) - Hematology</option>
                        <option value="Plain Tube (Red Top)">Plain Tube (Red Top) - Serum/Biochemistry</option>
                        <option value="Sodium Fluoride (Grey Top)">Sodium Fluoride Tube (Grey Top) - Glucose</option>
                        <option value="Urine Sterile Container">Urine Sterile Container</option>
                        <option value="Stool Collection Cup">Stool Collection Cup</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Barcode Reference ID *</label>
                      <input type="text" className="input" value={barcode} onChange={(e) => setBarcode(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                    </div>
                  </>
                )}

                {/* 2. Lab Results Entry Form */}
                {activeWorkspace === 'lab' && (
                  <>
                    {actionItem.package_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                          Grouped Package Parameters ({actionItem.package_name}):
                        </div>
                        {getPackageGroupItems(actionItem).map((groupSvc: any) => (
                          <div key={groupSvc.item_id} style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
                              {groupSvc.service_name} ({groupSvc.service_code})
                            </div>
                            {groupSvc.parameters && groupSvc.parameters.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  <span>PARAMETER</span>
                                  <span>VALUE *</span>
                                  <span>UNIT</span>
                                  <span>REF INTERVAL</span>
                                </div>
                                {groupSvc.parameters.map((p: any) => (
                                  <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                                    <input 
                                      type="text" 
                                      className="input" 
                                      required
                                      value={paramValues[p.parameter_id] || ''} 
                                      onChange={(e) => setParamValues({ ...paramValues, [p.parameter_id]: e.target.value })}
                                      style={{ height: '28px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                                    />
                                    <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.reference_range || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <input 
                                  type="text" 
                                  className="input" 
                                  placeholder="Enter result value summary..."
                                  value={paramValues[`svc-${groupSvc.item_id}`] || ''} 
                                  onChange={(e) => setParamValues({ ...paramValues, [`svc-${groupSvc.item_id}`]: e.target.value })}
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px' }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : actionItem.parameters && Array.isArray(actionItem.parameters) && actionItem.parameters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '6px', color: 'var(--text-secondary)' }}>
                          <span>PARAMETER</span>
                          <span>VALUE *</span>
                          <span>UNIT</span>
                          <span>REF INTERVAL</span>
                        </div>
                        {actionItem.parameters.map((p: any) => (
                          <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            <input 
                              type="text" 
                              className="input" 
                              required
                              value={paramValues[p.parameter_id] || ''} 
                              onChange={(e) => setParamValues({ ...paramValues, [p.parameter_id]: e.target.value })}
                              style={{ height: '28px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.reference_range || '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Analyzer Output Readings *</label>
                        <textarea className="input" rows={3} value={actualResult} onChange={(e) => setActualResult(e.target.value)} placeholder="e.g. Hemoglobin: 14.2 g/dL, WBC: 7,500/mcL" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Result Flag Status</label>
                        <select className="select" value={labStatus} onChange={(e) => setLabStatus(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="Normal">Normal Range</option>
                          <option value="Low">Low Value</option>
                          <option value="High">High Value</option>
                          <option value="Critical">Critical Alert Level</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Diagnostic Equipment</label>
                        <select className="select" value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="">None / Manual Analysis</option>
                          {machines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. Imaging Department Form */}
                {activeWorkspace === 'imaging' && (
                  <>
                    {actionItem.parameters && Array.isArray(actionItem.parameters) && actionItem.parameters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '6px', color: 'var(--text-secondary)' }}>
                          <span>PARAMETER</span>
                          <span>VALUE *</span>
                          <span>UNIT</span>
                          <span>REF INTERVAL</span>
                        </div>
                        {actionItem.parameters.map((p: any) => (
                          <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            <input 
                              type="text" 
                              className="input" 
                              required
                              value={paramValues[p.parameter_id] || ''} 
                              onChange={(e) => setParamValues({ ...paramValues, [p.parameter_id]: e.target.value })}
                              style={{ height: '28px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.reference_range || '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {actionItem.category_name === 'Ultrasound' && (
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clinical History</label>
                            <input type="text" className="input" value={clinicalHistory} onChange={(e) => setClinicalHistory(e.target.value)} placeholder="Indication for scan" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dictated Findings *</label>
                          <textarea className="input" rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Enter details of anatomy scanned..." required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Radiology/Sonology/ECG Impression *</label>
                      <input type="text" className="input" value={impression} onChange={(e) => setImpression(e.target.value)} placeholder="Clinical interpretation summary" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommendations / Conclusion</label>
                      <input type="text" className="input" value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Follow up recommendations" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </>
                )}

                {/* 4. Pathologist/Doctor Verification Form */}
                {activeWorkspace === 'verification' && (
                  <>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700 }}>Resulted Data Findings:</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {actionItem.lab_result?.actual_result || actionItem.radiology_report?.findings || actionItem.ultrasound_report?.findings || actionItem.ecg_report?.findings}
                      </p>
                      {actionItem.lab_result?.status !== 'Normal' && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px', color: 'var(--accent-danger)', fontSize: '11px', fontWeight: 700 }}>
                          <ShieldAlert size={14} /> Critical Flag: {actionItem.lab_result?.status} Value Alert!
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sign-Off Status *</label>
                        <select className="select" value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="Approved">Approve & Issue Final Report</option>
                          <option value="Rejected">Reject (Retest Required)</option>
                          <option value="PendingRetest">Request Sample Recollection</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Verification Notes / Comments</label>
                      <input type="text" className="input" value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} placeholder="Add clinician remarks..." style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setActionModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={actionLoading}>
                    {activeWorkspace === 'collection' && 'Log Collection'}
                    {activeWorkspace === 'lab' && 'Submit Results'}
                    {activeWorkspace === 'imaging' && 'Save Scan Findings'}
                    {activeWorkspace === 'verification' && 'Authorize Signature'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Workspaces;
