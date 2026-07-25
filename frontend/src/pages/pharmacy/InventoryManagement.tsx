import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, Layers, Download, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Tablet', label: '💊 Tablets' },
  { value: 'Syrup', label: '🧴 Syrups' },
  { value: 'Injection', label: '💉 Injections' },
  { value: 'Capsule', label: '💊 Capsules' },
  { value: 'OT Consumable', label: '🏥 OT Consumables' },
  { value: 'Skin Care', label: '🧴 Skin Care / Topical' },
  { value: 'General', label: '📦 General' },
];

const CSV_SAMPLE_HEADER = "Item Name *,Generic Name *,SKU,Category *,Manufacturer,Batch Number *,Rack Number *,Stock Quantity *,Reorder Level,Expiry Date (YYYY-MM-DD) *,Purchase Price (Rs) *,Selling Unit Price (Rs) *,Is Sheet (true/false),Tablets Per Sheet,HSN Code";
const CSV_SAMPLE_ROWS = [
  "Paracetamol 500mg,Paracetamol,MED-001,Tablet,Cipla Ltd,BATCH-2026-01,Rack A-1,100,20,2027-12-31,5.00,10.00,true,10,30049099",
  "Amoxicillin 250mg,Amoxicillin,MED-002,Capsule,Sun Pharma,BATCH-2026-02,Rack B-3,50,10,2027-06-30,8.50,15.00,true,10,30049099",
  "Cough Syrup 100ml,Dextromethorphan,MED-003,Syrup,Dr Reddys,BATCH-2026-03,Shelf C-2,30,5,2026-11-30,45.00,75.00,false,1,30049099",
  "Pantoprazole 40mg,Pantoprazole,MED-004,Tablet,Zydus Cadila,BATCH-2026-04,Rack A-2,200,30,2028-03-31,6.00,12.00,true,10,30049099",
  "Azithromycin 500mg,Azithromycin,MED-005,Tablet,Torrent Pharma,BATCH-2026-05,Rack B-1,80,15,2027-09-30,18.00,35.00,true,3,30049099"
];

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedBulkItems, setParsedBulkItems] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [form, setForm] = useState({
    itemName: '',
    sku: '',
    category: 'Tablet',
    manufacturer: '',
    stockQuantity: '0',
    reorderLevel: '50',
    unitPrice: '0',
    expiryDate: '',
    genericName: '',
    batchNo: '',
    rackNo: '',
    purchasePrice: '0',
    isSheet: false,
    tabletsPerSheet: '1',
    hsnCode: '30049099',
  });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    api.get(`/pharmacy/inventory?search=${search}&lowStock=${lowStock}&limit=200`)
      .then(r => {
        let data = r.data.data.items || [];
        if (categoryFilter) {
          data = data.filter((item: any) => item.category === categoryFilter);
        }
        setItems(data);
      })
      .catch(() => {});
  };

  useEffect(fetchData, [search, lowStock, categoryFilter]);

  const resetForm = () => {
    setForm({
      itemName: '', sku: '', category: 'Tablet', manufacturer: '',
      stockQuantity: '0', reorderLevel: '50', unitPrice: '0', expiryDate: '',
      genericName: '', batchNo: '', rackNo: '', purchasePrice: '0',
      isSheet: false, tabletsPerSheet: '1', hsnCode: '30049099',
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/pharmacy/inventory', {
        ...form,
        stockQuantity: Number(form.stockQuantity),
        reorderLevel: Number(form.reorderLevel),
        unitPrice: Number(form.unitPrice),
        purchasePrice: Number(form.purchasePrice),
        tabletsPerSheet: Number(form.tabletsPerSheet),
      });
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  // Download Sample CSV Template
  const downloadTemplate = () => {
    const csvContent = [CSV_SAMPLE_HEADER, ...CSV_SAMPLE_ROWS].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pharmacy_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File into Structured JSON Array
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert('The uploaded file appears to be empty or missing data rows.');
        return;
      }

      // First line is header
      const rows = lines.slice(1);
      const parsed = rows.map((line, idx) => {
        // Handle quoted CSV columns properly
        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        const itemName = cols[0] || '';
        const genericName = cols[1] || itemName;
        const sku = cols[2] || `SKU-${Date.now()}-${idx + 1}`;
        const category = cols[3] || 'General';
        const manufacturer = cols[4] || '';
        const batchNo = cols[5] || `BATCH-${idx + 1}`;
        const rackNo = cols[6] || 'Rack A-1';
        const stockQuantity = Number(cols[7]) || 0;
        const reorderLevel = Number(cols[8]) || 50;
        const expiryDate = cols[9] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const purchasePrice = Number(cols[10]) || 0;
        const unitPrice = Number(cols[11]) || 0;
        const isSheet = String(cols[12] || 'false').toLowerCase() === 'true';
        const tabletsPerSheet = Number(cols[13]) || 1;
        const hsnCode = cols[14] || '30049099';

        const isValid = itemName.length > 0 && stockQuantity >= 0;

        return {
          itemName, genericName, sku, category, manufacturer,
          batchNo, rackNo, stockQuantity, reorderLevel, expiryDate,
          purchasePrice, unitPrice, isSheet, tabletsPerSheet, hsnCode,
          isValid
        };
      });

      setParsedBulkItems(parsed);
    };

    reader.readAsText(file);
  };

  // Submit Bulk Upload to Backend
  const handleBulkSubmit = async () => {
    const validItems = parsedBulkItems.filter(i => i.isValid);
    if (validItems.length === 0) {
      alert('No valid inventory items found in the file to upload.');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await api.post('/pharmacy/inventory/bulk', { items: validItems });
      const importedCount = res.data.data?.importedCount || validItems.length;
      alert(`✓ Successfully imported ${importedCount} inventory items into pharmacy database!`);
      setShowBulkModal(false);
      setParsedBulkItems([]);
      setFileName('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete bulk upload');
    } finally {
      setBulkLoading(false);
    }
  };

  const perTabletPrice = (item: any) => {
    if (!item.is_sheet) return null;
    const tps = parseInt(item.tablets_per_sheet, 10) || 1;
    return parseFloat(item.unit_price) / tps;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1><Package size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Pharmacy Inventory Management</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<Download size={16} />} onClick={downloadTemplate}>
            Download CSV Template
          </Button>
          <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setShowBulkModal(true)} style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
            Bulk Upload CSV/Excel
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Add Single Item
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <Select label="" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))} />
        <Button variant={lowStock ? 'danger' : 'secondary'} icon={<AlertTriangle size={16} />} onClick={() => setLowStock(!lowStock)}>
          {lowStock ? 'Show All' : 'Low Stock Only'}
        </Button>
      </div>

      {/* Category Summary Badges */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
        {CATEGORIES.filter(c => c.value).map(c => {
          const count = items.filter(i => i.category === c.value).length;
          if (categoryFilter && categoryFilter !== c.value) return null;
          return (
            <Badge key={c.value} variant={categoryFilter === c.value ? 'primary' : 'default'}
              style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setCategoryFilter(categoryFilter === c.value ? '' : c.value)}>
              {c.label} ({count})
            </Badge>
          );
        })}
      </div>

      <Table
        columns={[
          { key: 'item_name', label: 'Name' },
          { key: 'generic_name', label: 'Generic Name' },
          { key: 'category', label: 'Category', render: (v) => <Badge variant="default" style={{ fontSize: '11px' }}>{v}</Badge> },
          { key: 'hsn_code', label: 'HSN Code' },
          { key: 'batch_no', label: 'Batch No' },
          { key: 'rack_no', label: 'Rack No', render: (v) => <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{v}</span> },
          { key: 'is_sheet', label: 'Pack Type', render: (v, row) => v ? (
            <span title={`${row.tablets_per_sheet} tablets per sheet`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={14} style={{ color: 'var(--accent-info)' }} />
              <span style={{ fontSize: '12px' }}>Sheet ({row.tablets_per_sheet} tab)</span>
            </span>
          ) : <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Unit</span> },
          { key: 'stock_quantity', label: 'Stock', render: (v, row) => <span style={{ color: parseFloat(v) <= row.reorder_level ? 'var(--accent-danger)' : 'var(--text-primary)', fontWeight: 600 }}>{parseFloat(v)}</span> },
          { key: 'purchase_price', label: 'Purchase Rate', render: (v) => formatCurrency(parseFloat(v)) },
          { key: 'unit_price', label: 'Sheet/Unit Rate', render: (v) => formatCurrency(parseFloat(v)) },
          { key: 'per_tablet', label: 'Per Tablet Rate', render: (_, row) => {
            const pt = perTabletPrice(row);
            return pt !== null ? <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatCurrency(pt)}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
          }},
          { key: 'expiry_date', label: 'Expiry', render: (v) => formatDate(v) },
          { key: 'status', label: 'Status', render: (_, row) => parseFloat(row.stock_quantity) <= row.reorder_level ? <Badge variant="danger">Low</Badge> : <Badge variant="success">OK</Badge> },
        ]}
        data={items}
      />

      {/* ========================================================================= */}
      {/* BULK UPLOAD MODAL (Excel / CSV) */}
      {/* ========================================================================= */}
      <Modal 
        isOpen={showBulkModal} 
        onClose={() => { setShowBulkModal(false); setParsedBulkItems([]); setFileName(''); }} 
        title="Bulk Upload Pharmacy Medicines (CSV / Excel)" 
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Instructions Box */}
          <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.2)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <FileText size={18} color="var(--accent-primary)" />
                Step 1: Download Inventory Template & Fill CSV File
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={downloadTemplate}>
                Download Sample Template
              </Button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Use our pre-formatted CSV template with standard headers (`Item Name`, `Generic Name`, `Category`, `Batch Number`, `Rack Number`, `Stock Quantity`, `Purchase Price`, `Selling Price`, `Expiry Date`).
            </p>
          </div>

          {/* File Picker Box */}
          <div style={{ border: '2px dashed var(--border-primary)', borderRadius: '10px', padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)' }}>
            <Upload size={32} style={{ margin: '0 auto 10px auto', color: 'var(--accent-primary)' }} />
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              Select CSV File to Import
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
              Supports `.csv` spreadsheet files exported from Excel, Google Sheets, or Tally.
            </div>

            <input 
              type="file" 
              accept=".csv, .txt, text/csv" 
              onChange={handleFileUpload} 
              id="bulk-csv-upload-input" 
              style={{ display: 'none' }} 
            />
            
            <label htmlFor="bulk-csv-upload-input" style={{ cursor: 'pointer' }}>
              <span className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Upload size={16} />
                Browse File from Computer
              </span>
            </label>

            {fileName && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--accent-success)', fontWeight: 600 }}>
                Selected File: {fileName} ({parsedBulkItems.length} items parsed)
              </div>
            )}
          </div>

          {/* Live Preview Table of Parsed CSV Rows */}
          {parsedBulkItems.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px' }}>Pre-Upload Data Preview ({parsedBulkItems.length} items)</strong>
                <Badge variant="success">✓ {parsedBulkItems.filter(i => i.isValid).length} Valid Items Ready</Badge>
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border-primary)' }}>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Generic Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Batch</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Rack</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Stock</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Selling Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedBulkItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)', background: item.isValid ? 'transparent' : 'rgba(239,68,68,0.05)' }}>
                        <td style={{ padding: '8px' }}>
                          {item.isValid ? (
                            <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={14} /> Ready
                            </span>
                          ) : (
                            <span style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <XCircle size={14} /> Incomplete
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{item.itemName}</td>
                        <td style={{ padding: '8px' }}>{item.genericName}</td>
                        <td style={{ padding: '8px' }}>{item.category}</td>
                        <td style={{ padding: '8px' }}>{item.batchNo}</td>
                        <td style={{ padding: '8px', color: 'var(--accent-primary)', fontWeight: 600 }}>{item.rackNo}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{item.stockQuantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => { setShowBulkModal(false); setParsedBulkItems([]); setFileName(''); }}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleBulkSubmit} 
              disabled={parsedBulkItems.length === 0} 
              loading={bulkLoading}
              icon={<Upload size={16} />}
            >
              Upload & Import {parsedBulkItems.filter(i => i.isValid).length} Items
            </Button>
          </div>

        </div>
      </Modal>

      {/* Add Single Item Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Add Inventory Item" size="lg">
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div className="form-row">
              <Input label="Medicine / Item Name *" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required />
              <Input label="Generic Name *" value={form.genericName} onChange={e => setForm({ ...form, genericName: e.target.value })} required />
            </div>
            <div className="form-row">
              <Input label="SKU *" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
              <Input label="HSN Code *" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} required />
            </div>
            <div className="form-row">
              <Select label="Category *" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                options={CATEGORIES.filter(c => c.value).map(c => ({ value: c.value, label: c.label }))} />
              <Input label="Batch Number *" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} required />
            </div>
            <div className="form-row">
              <Input label="Rack Number * (Mandatory)" value={form.rackNo} onChange={e => setForm({ ...form, rackNo: e.target.value })} required />
              <Input label="Manufacturer" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div className="form-row">
              <Input label="Stock Quantity *" type="number" step="0.01" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} required />
              <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} />
            </div>
            <div className="form-row">
              <Input label="Expiry Date *" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} required />
            </div>

            {/* ─── Sheet Setup Section ─── */}
            <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', background: 'rgba(14,165,233,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <Layers size={18} style={{ color: 'var(--accent-info)' }} />
                <strong style={{ fontSize: 'var(--font-sm)' }}>Sheet / Bundle Setup</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Enable for tablets sold in strips/sheets</span>
              </div>
              <div className="form-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                  <input type="checkbox" checked={form.isSheet} onChange={e => setForm({ ...form, isSheet: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                  This item is sold as a Sheet / Strip
                </label>
                {form.isSheet && (
                  <Input label="Tablets per Sheet *" type="number" min="1" value={form.tabletsPerSheet}
                    onChange={e => setForm({ ...form, tabletsPerSheet: e.target.value })} required />
                )}
              </div>
              {form.isSheet && Number(form.tabletsPerSheet) > 0 && Number(form.unitPrice) > 0 && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                  <strong>Per Tablet Price: </strong>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '15px' }}>
                    {formatCurrency(Number(form.unitPrice) / Number(form.tabletsPerSheet))}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
                    ({form.unitPrice} ÷ {form.tabletsPerSheet} tablets)
                  </span>
                </div>
              )}
            </div>

            <div className="form-row">
              <Input label="Purchase Rate (₹) *" type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} required />
              <Input label={form.isSheet ? "Sheet Rate (₹) *" : "Unit Rate (₹) *"} type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required />
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>Add Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
