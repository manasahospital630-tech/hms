import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, KeyRound, Key, Edit, ShieldAlert, Award, Stethoscope, Activity } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
];

const PatientsList: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '',
    bloodGroup: '', address: '', phone: '', email: '',
    emergencyContactName: '', emergencyContactPhone: '',
    insuranceProvider: '', insurancePolicyNumber: '',
    allergies: '', assignedDoctorId: '',
  });

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCredentials, setActivationCredentials] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPatients = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await api.get(`/patients?search=${search}&limit=25&offset=${offset}`);
      setPatients(res.data.data.patients || []);
      const pag = res.data.data.pagination;
      if (pag) {
        setPagination({
          total: pag.total,
          limit: pag.limit,
          offset: pag.offset
        });
      }
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctor-profiles');
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors list', err);
    }
  };

  useEffect(() => {
    fetchPatients(0);
    fetchDoctors();
  }, [search]);

  const handleOpenEdit = (patient: any) => {
    setEditingPatient(patient);

    const rawAge = String(patient.age || '');
    const yearsMatch = rawAge.match(/(\d+)\s*(?:years?|yrs?|y)/i) || rawAge.match(/^(\d+)/);
    const monthsMatch = rawAge.match(/(\d+)\s*(?:months?|mos?|m)/i);

    let parsedYears = yearsMatch ? yearsMatch[1] : (patient.age || '');
    let parsedMonths = monthsMatch ? monthsMatch[1] : '';

    let isChild = (parsedYears !== '' && Number(parsedYears) < 10) || Boolean(monthsMatch) || rawAge.toLowerCase().includes('month');

    setEditForm({
      firstName: patient.first_name || '',
      lastName: patient.last_name || '',
      dateOfBirth: patient.date_of_birth ? patient.date_of_birth.substring(0, 10) : '',
      age: parsedYears,
      ageMonths: parsedMonths,
      patientCategory: isChild ? 'Child' : 'Adult',
      gender: patient.gender || 'Male',
      bloodGroup: patient.blood_group || '',
      address: patient.address || '',
      phone: patient.phone || '',
      email: patient.email || '',
      emergencyContactName: patient.emergency_contact_name || '',
      emergencyContactPhone: patient.emergency_contact_phone || '',
      insuranceProvider: patient.insurance_provider || '',
      insurancePolicyNumber: patient.insurance_policy_number || '',
      allergies: patient.allergies || '',
      assignedDoctorId: patient.assigned_doctor_id || '',
    } as any);
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setErrorMsg('');
    try {
      const formattedAge = (editForm as any).patientCategory === 'Child'
        ? ((editForm as any).age ? `${(editForm as any).age} Years ${(editForm as any).ageMonths || '0'} Months` : `${(editForm as any).ageMonths || '0'} Months`)
        : `${(editForm as any).age} Years`;

      await api.put(`/patients/${editingPatient.patient_id}`, {
        ...editForm,
        age: formattedAge,
        assignedDoctorId: editForm.assignedDoctorId || null,
      });
      setShowEditModal(false);
      fetchPatients(pagination.offset);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update patient records.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleActivatePortal = async (patient: any) => {
    if (!patient.email) {
      alert('Patient must have an email address to activate portal access. Please edit the patient record first and save their email.');
      return;
    }
    if (!window.confirm(`Are you sure you want to activate Patient Portal access for ${patient.first_name} ${patient.last_name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/patients/${patient.patient_id}/portal-access`);
      setActivationCredentials(res.data.data);
      setShowActivationModal(true);
      fetchPatients(pagination.offset);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to activate portal access.');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user?.role === 'Admin';
  const canActivate = ['Admin', 'Receptionist', 'Biller'].includes(user?.role || '');

  return (
    <div>
      <div className="page-header">
        <h1>
          <Users size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-primary)' }} />
          Patient Directory
        </h1>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => fetchPatients(pagination.offset)} loading={loading}>
          Refresh
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
          <Input
            placeholder="Search by name, MRN, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Showing <strong>{patients.length}</strong> of <strong>{pagination.total}</strong> registered patients
        </div>
      </div>

      <Card>
        <Table
          columns={[
            {
              key: 'medical_record_number',
              label: 'MRN',
              render: (v) => <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{v}</strong>
            },
            {
              key: 'name',
              label: 'Patient Name',
              render: (_, row) => `${row.first_name} ${row.last_name}`
            },
            {
              key: 'gender',
              label: 'Gender / DOB',
              render: (_, row) => (
                <div style={{ fontSize: 'var(--font-sm)' }}>
                  <span>{row.gender || '—'}</span>
                  {row.date_of_birth && (
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
                      ({new Date(row.date_of_birth).toLocaleDateString('en-IN')})
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'contact',
              label: 'Contact Information',
              render: (_, row) => (
                <div style={{ fontSize: '13px' }}>
                  <div>📞 {row.phone || '—'}</div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>✉️ {row.email || '—'}</div>
                </div>
              )
            },

            {
              key: 'user_id',
              label: 'Portal Access',
              render: (v, row) => v ? (
                <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <KeyRound size={12} /> Portal Active
                </Badge>
              ) : (
                <div>
                  {canActivate ? (
                    <Button variant="ghost" size="sm" icon={<KeyRound size={12} />} onClick={() => handleActivatePortal(row)}>
                      Grant Access
                    </Button>
                  ) : (
                    <Badge variant="default" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)' }}>
                      No Access
                    </Badge>
                  )}
                </div>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                  <Link to={`/patient/profile/${row.patient_id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', textDecoration: 'none' }}>
                    <Activity size={12} /> Timeline Profile
                  </Link>
                  {canEdit && (
                    <Button variant="secondary" size="sm" icon={<Edit size={12} />} onClick={() => handleOpenEdit(row)}>
                      Modify
                    </Button>
                  )}
                </div>
              )
            }
          ]}
          data={patients}
        />

        {/* Simple Pagination */}
        {pagination.total > pagination.limit && (
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button
              variant="secondary"
              disabled={pagination.offset === 0}
              onClick={() => fetchPatients(pagination.offset - pagination.limit)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={pagination.offset + pagination.limit >= pagination.total}
              onClick={() => fetchPatients(pagination.offset + pagination.limit)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Edit Patient Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modify Patient Records" size="lg">
        <form onSubmit={handleSaveEdit}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {errorMsg && (
              <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Patient Category *
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="editPatientCategory"
                    value="Adult"
                    checked={(editForm as any).patientCategory !== 'Child'}
                    onChange={() => setEditForm({ ...editForm, patientCategory: 'Adult' } as any)}
                  />
                  👨‍💼 Adult (≥ 10 Years)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="editPatientCategory"
                    value="Child"
                    checked={(editForm as any).patientCategory === 'Child'}
                    onChange={() => setEditForm({ ...editForm, patientCategory: 'Child' } as any)}
                  />
                  👶 Child / Pediatric (&lt; 10 Years)
                </label>
              </div>
            </div>

            <div className="form-row">
              <Input label="First Name *" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
              <Input label="Last Name *" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} required />
            </div>

            {(editForm as any).patientCategory === 'Child' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', marginBottom: '16px' }}>
                <Input label="Age (Years)" type="number" min="0" max="9" placeholder="e.g. 4" value={(editForm as any).age || ''} onChange={e => setEditForm({ ...editForm, age: e.target.value } as any)} />
                <Input label="Age (Months) *" type="number" min="0" max="11" placeholder="e.g. 6" value={(editForm as any).ageMonths || ''} onChange={e => setEditForm({ ...editForm, ageMonths: e.target.value } as any)} required />
                <Select label="Gender *" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} options={GENDER_OPTIONS} />
              </div>
            ) : (
              <div className="form-row">
                <Input label="Age (Years) *" type="number" min="10" max="120" placeholder="e.g. 35" value={(editForm as any).age || ''} onChange={e => setEditForm({ ...editForm, age: e.target.value } as any)} required />
                <Select label="Gender *" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} options={GENDER_OPTIONS} />
              </div>
            )}

            <div className="form-row">
              <Input label="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <Input label="Email (Required for Portal Access)" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>

            <div className="form-row">
              <Select label="Blood Group" value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                options={[{ value: '', label: '-- Select --' }, ...BLOOD_GROUPS]} />
            </div>

            <Input label="Address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
            <Input label="Allergies" value={editForm.allergies} onChange={e => setEditForm({ ...editForm, allergies: e.target.value })} />

            <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.01)', marginTop: 'var(--space-xs)' }}>
              <strong style={{ display: 'block', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-sm)' }}>Emergency Contact & Insurance</strong>
              <div className="form-row">
                <Input label="Contact Name" value={editForm.emergencyContactName} onChange={e => setEditForm({ ...editForm, emergencyContactName: e.target.value })} />
                <Input label="Contact Phone" value={editForm.emergencyContactPhone} onChange={e => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} />
              </div>
              <div className="form-row">
                <Input label="Insurance Provider" value={editForm.insuranceProvider} onChange={e => setEditForm({ ...editForm, insuranceProvider: e.target.value })} />
                <Input label="Policy Number" value={editForm.insurancePolicyNumber} onChange={e => setEditForm({ ...editForm, insurancePolicyNumber: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={saveLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Portal Activation Credentials Modal */}
      <Modal isOpen={showActivationModal} onClose={() => setShowActivationModal(false)} title="Portal Access Activated!" size="md">
        <div style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--accent-success)', marginBottom: 'var(--space-md)' }}>
            <Award size={28} />
            <strong style={{ fontSize: 'var(--font-lg)' }}>Activation Successful</strong>
          </div>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            A portal account has been created for the patient. Please copy these credentials and share them with the patient so they can log in to the Patient Portal:
          </p>

          {activationCredentials && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', fontFamily: 'monospace', fontSize: '14px', position: 'relative' }}>
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Portal Link: </span>
                <strong style={{ color: 'var(--accent-primary)' }}>http://localhost:5173/login</strong>
              </div>
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Username/Email: </span>
                <strong>{activationCredentials.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Temporary Password: </span>
                <strong style={{ color: 'var(--accent-warning)', fontSize: '16px' }}>{activationCredentials.password}</strong>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 'var(--space-lg)', paddingBottom: 0 }}>
            <Button variant="primary" onClick={() => setShowActivationModal(false)}>Close & Print Credentials</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientsList;
