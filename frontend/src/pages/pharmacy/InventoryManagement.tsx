import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, Layers, Filter } from 'lucide-react';
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
  { value: 'OT Consumable', label: '🏥 OT Consumables' },
  { value: 'Skin Care', label: '🧴 Skin Care / Topical' },
  { value: 'General', label: '📦 General' },
];

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  const perTabletPrice = (item: any) => {
    if (!item.is_sheet) return null;
    const tps = parseInt(item.tablets_per_sheet, 10) || 1;
    return parseFloat(item.unit_price) / tps;
  };

  return (
    <div>
      <div className="page-header">
        <h1><Package size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Inventory Management</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Add Item</Button>
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

      {/* Add Item Modal */}
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
