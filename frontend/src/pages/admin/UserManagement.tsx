import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/shared/RoleBadge';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', role: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = () => { api.get(`/admin/users?search=${search}&limit=100`).then(r => setUsers(r.data.data.users || [])).catch(() => {}); };
  useEffect(fetchData, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/admin/users', form); setShowModal(false); fetchData(); setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: '' }); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const toggleActive = async (user: any) => {
    try { await api.patch(`/admin/users/${user.user_id}`, { isActive: !user.is_active }); fetchData(); } catch { }
  };

  return (
    <div>
      <div className="page-header"><h1><Users size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />User Management</h1>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Create User</Button></div>
      <div style={{ marginBottom: 'var(--space-lg)' }}><Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} /></div>
      <Table columns={[
        { key: 'name', label: 'Name', render: (_, row) => `${row.first_name} ${row.last_name}` },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (v) => <RoleBadge role={v} /> },
        { key: 'is_active', label: 'Status', render: (v) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge> },
        { key: 'actions', label: '', render: (_, row) => <Button size="sm" variant={row.is_active ? 'danger' : 'success'} onClick={() => toggleActive(row)}>{row.is_active ? 'Deactivate' : 'Activate'}</Button> },
      ]} data={users} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create User" size="md">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div className="form-row"><Input label="First Name *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /><Input label="Last Name *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <Input label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <div className="form-row">
              <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <Select label="Role *" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} options={['Admin','Management','Doctor','Nurse','Receptionist','Pharmacist','Biller','Patient'].map(r => ({ value: r, label: r }))} />
            </div>
          </div>
          <div className="modal-footer"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" type="submit" loading={loading}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
};
export default UserManagement;
