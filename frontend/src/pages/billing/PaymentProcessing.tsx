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
  const [paymentForm, setPaymentForm] = useState({ amountPaid: '', paymentMethod: 'Cash', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    const statusParam = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/billing/invoices${statusParam}`).then(r => setInvoices(r.data.data.invoices || [])).catch(() => {});
  };
  useEffect(fetchData, [filter]);

  const handleOpenModal = (row: any) => {
    setSelectedInvoice(row);
    const totalResp = parseFloat(row.patient_responsibility || row.total_amount || 0);
    const paid = parseFloat(row.amount_paid || 0);
    const due = parseFloat(row.due_amount !== undefined && row.due_amount !== null ? row.due_amount : Math.max(0, totalResp - paid));
    setPaymentForm({
      amountPaid: due > 0 ? due.toFixed(2) : '',
      paymentMethod: row.payment_method || 'Cash',
      notes: ''
    });
  };

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentForm.amountPaid || !paymentForm.paymentMethod) return;
    setLoading(true);
    try {
      await api.post(`/billing/invoices/${selectedInvoice.invoice_id}/collect-due`, {
        collectAmount: Number(paymentForm.amountPaid),
        paymentMode: paymentForm.paymentMethod,
        notes: paymentForm.notes || 'Payment Processing Collection'
      });
      setSelectedInvoice(null);
      setPaymentForm({ amountPaid: '', paymentMethod: 'Cash', notes: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1><DollarSign size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Payment Processing</h1>
      </div>
      <div className="tabs">
        {['all', 'Unpaid', 'PartiallyPaid', 'Paid'].map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s === 'PartiallyPaid' ? 'Partially Paid' : s}
          </button>
        ))}
      </div>
      <Table columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'total_amount', label: 'Total', render: (v) => formatCurrency(v) },
        { key: 'patient_responsibility', label: 'Patient Owes', render: (v) => formatCurrency(v) },
        { key: 'amount_paid', label: 'Paid', render: (v) => formatCurrency(v) },
        { 
          key: 'due_amount', 
          label: 'Due Amount', 
          render: (v, row) => {
            const totalResp = parseFloat(row.patient_responsibility || row.total_amount || 0);
            const paid = parseFloat(row.amount_paid || 0);
            const due = parseFloat(row.due_amount !== undefined && row.due_amount !== null ? row.due_amount : Math.max(0, totalResp - paid));
            return <strong style={{ color: due > 0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>{formatCurrency(due)}</strong>;
          } 
        },
        { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
        { key: 'created_at', label: 'Date', render: (v) => formatDateTime(v) },
        { 
          key: 'actions', 
          label: 'Actions', 
          render: (_, row) => {
            const totalResp = parseFloat(row.patient_responsibility || row.total_amount || 0);
            const paid = parseFloat(row.amount_paid || 0);
            const due = parseFloat(row.due_amount !== undefined && row.due_amount !== null ? row.due_amount : Math.max(0, totalResp - paid));
            return due > 0.001 && row.status !== 'Cancelled' && row.status !== 'Returned' ? (
              <Button size="sm" variant="primary" onClick={() => handleOpenModal(row)}>Collect Due</Button>
            ) : null;
          } 
        },
      ]} data={invoices} />

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Collect Remaining Bill / Payment" size="sm">
        {selectedInvoice && (
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              <p>Patient: <strong>{selectedInvoice.patient_name}</strong></p>
              <p>
                Total: {formatCurrency(selectedInvoice.total_amount)} | Paid: <span style={{ color: 'var(--accent-success)' }}>{formatCurrency(selectedInvoice.amount_paid)}</span> | Due: <strong style={{ color: 'var(--accent-danger)' }}>{formatCurrency(parseFloat(selectedInvoice.patient_responsibility || selectedInvoice.total_amount) - parseFloat(selectedInvoice.amount_paid))}</strong>
              </p>
            </div>
            <Input 
              label="Collection Amount (₹) *" 
              type="number" 
              step="0.01" 
              value={paymentForm.amountPaid} 
              onChange={e => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} 
            />
            <Select 
              label="Payment Method *" 
              value={paymentForm.paymentMethod} 
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} 
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'UPI', label: 'UPI / QR Code' },
                { value: 'Card', label: 'Credit / Debit Card' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Net Banking', label: 'Net Banking' }
              ]} 
            />
            <Input 
              label="Notes / Transaction Ref" 
              type="text" 
              value={paymentForm.notes} 
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
              placeholder="e.g. UPI Ref / Cheque No"
            />
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Cancel</Button>
              <Button variant="primary" loading={loading} onClick={handlePayment}>Confirm Payment Collection</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default PaymentProcessing;
