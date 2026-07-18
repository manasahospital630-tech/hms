import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/shared/StatusBadge';
import api from '../../api/client';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentProcessing: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amountPaid: '', paymentMethod: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    const statusParam = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/billing/invoices${statusParam}`).then(r => setInvoices(r.data.data.invoices || [])).catch(() => {});
  };
  useEffect(fetchData, [filter]);

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentForm.amountPaid || !paymentForm.paymentMethod) return;
    setLoading(true);
    try {
      await api.patch(`/billing/invoices/${selectedInvoice.invoice_id}/payment`, { amountPaid: Number(paymentForm.amountPaid), paymentMethod: paymentForm.paymentMethod });
      setSelectedInvoice(null); setPaymentForm({ amountPaid: '', paymentMethod: '' }); fetchData();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><h1><DollarSign size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Payment Processing</h1></div>
      <div className="tabs">
        {['all', 'Unpaid', 'PartiallyPaid', 'Paid'].map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s}</button>
        ))}
      </div>
      <Table columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'total_amount', label: 'Total', render: (v) => formatCurrency(v) },
        { key: 'patient_responsibility', label: 'Patient Owes', render: (v) => formatCurrency(v) },
        { key: 'amount_paid', label: 'Paid', render: (v) => formatCurrency(v) },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
        { key: 'created_at', label: 'Date', render: (v) => formatDateTime(v) },
        { key: 'actions', label: '', render: (_, row) => row.status !== 'Paid' ? <Button size="sm" variant="primary" onClick={() => setSelectedInvoice(row)}>Pay</Button> : null },
      ]} data={invoices} />

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Record Payment" size="sm">
        {selectedInvoice && (
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              <p>Patient: <strong>{selectedInvoice.patient_name}</strong></p>
              <p>Total: {formatCurrency(selectedInvoice.total_amount)} | Paid: {formatCurrency(selectedInvoice.amount_paid)} | Due: <strong>{formatCurrency(parseFloat(selectedInvoice.patient_responsibility) - parseFloat(selectedInvoice.amount_paid))}</strong></p>
            </div>
            <Input label="Payment Amount *" type="number" step="0.01" value={paymentForm.amountPaid} onChange={e => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} />
            <Select label="Payment Method *" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} options={[{ value: 'Cash', label: 'Cash' }, { value: 'Card', label: 'Credit/Debit Card' }, { value: 'Insurance', label: 'Insurance' }, { value: 'Bank Transfer', label: 'Bank Transfer' }]} />
            <div className="modal-footer"><Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Cancel</Button><Button variant="primary" loading={loading} onClick={handlePayment}>Record Payment</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default PaymentProcessing;
