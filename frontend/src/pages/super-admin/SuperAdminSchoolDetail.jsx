import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Buildings,
  ArrowLeft,
  Users,
  Student,
  ChalkboardTeacher,
  BookOpen,
  Plus,
  Pencil,
  Key,
  Prohibit,
  CheckCircle,
  X,
  Copy,
  Check,
  EnvelopeSimple,
  IdentificationBadge,
  SpinnerGap,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

function StatCard({ icon: Icon, label, value, color = 'text-brand-red' }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-cream p-5 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex items-center gap-4">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink/[0.04] ${color}`}>
        <Icon size={22} weight="regular" />
      </div>
      <div>
        <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-ink leading-tight mt-0.5">{value ?? 0}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || 'active').toLowerCase();
  const isActive = s === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-ink/5 text-ink/50 border border-ink/10'
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-ink/40'}`} />
      {s}
    </span>
  );
}

export default function SuperAdminSchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  // Edit School Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    schoolName: '',
    division: '',
    region: '',
    officialEmail: '',
    principalName: '',
    status: 'active',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Admin Modal
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Password Display Modal (from add admin or reset password)
  const [passModalData, setPassModalData] = useState(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchSchoolData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchool(data.school);
        setStats(data.stats);
        setEditFormData({
          schoolName: data.school.school_name || '',
          division: data.school.division || '',
          region: data.school.region || '',
          officialEmail: data.school.official_email || '',
          principalName: data.school.principal_name || '',
          status: data.school.status || 'active',
        });
      } else {
        setToast({ message: data.error || 'Failed to load school details.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error loading school details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAdmins = useCallback(async () => {
    try {
      setAdminsLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else {
        setAdmins([]);
      }
    } catch (err) {
      console.warn('Failed to load school admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchoolData();
    fetchAdmins();
  }, [fetchSchoolData, fetchAdmins]);

  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleToggleSchoolStatus = async () => {
    if (!school) return;
    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `School set to ${newStatus}.`, type: 'success' });
        setSchool((prev) => ({ ...prev, status: newStatus }));
      } else {
        setToast({ message: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'School details updated.', type: 'success' });
        setIsEditOpen(false);
        fetchSchoolData();
      } else {
        setToast({ message: data.error || 'Failed to save changes.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      setAddingAdmin(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(adminFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddAdminOpen(false);
        setAdminFormData({ firstName: '', lastName: '', email: '' });
        fetchAdmins();
        setPassModalData({
          title: 'Admin Account Created',
          email: adminFormData.email,
          password: data.tempPassword,
        });
      } else {
        setToast({ message: data.error || 'Failed to add administrator.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins/${adminId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Admin account set to ${newStatus}.`, type: 'success' });
        fetchAdmins();
      } else {
        setToast({ message: data.error || 'Failed to update admin status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  const handleResetPassword = async (adminId, email) => {
    if (!window.confirm(`Reset temporary password for ${email}?`)) return;
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins/${adminId}/reset-password`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassModalData({
          title: 'Admin Password Reset',
          email: email,
          password: data.tempPassword,
        });
      } else {
        setToast({ message: data.error || 'Failed to reset password.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error resetting password.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <SpinnerGap size={32} className="animate-spin text-brand-red" />
        <span className="text-xs font-semibold text-ink/50">Loading school details...</span>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Buildings size={48} className="text-ink/20" />
        <h2 className="text-lg font-bold text-ink">School Not Found</h2>
        <p className="text-xs text-ink/50">The requested school ID does not exist or has been removed.</p>
        <button
          type="button"
          onClick={() => navigate('/super-admin/schools')}
          className="rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
        >
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/super-admin/schools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Schools</span>
        </Link>

        {/* School Overview Card */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red font-bold">
              <Buildings size={32} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink">{school.school_name}</h1>
                <StatusBadge status={school.status} />
              </div>
              <p className="text-xs font-mono text-ink/50 mt-1">
                School ID / Code: <span className="font-bold text-ink">{school.school_id}</span>
              </p>
              <p className="text-xs text-ink/60 mt-0.5">
                {school.division || 'No Division'} • {school.region || 'No Region'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <Pencil size={15} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={handleToggleSchoolStatus}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                school.status === 'active'
                  ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {school.status === 'active' ? (
                <>
                  <Prohibit size={15} />
                  <span>Deactivate School</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Activate School</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Student} label="Total Students" value={stats?.studentCount} color="text-brand-blue" />
          <StatCard icon={ChalkboardTeacher} label="Total Teachers" value={stats?.teacherCount} color="text-emerald-600" />
          <StatCard icon={Users} label="School Admins" value={stats?.adminCount} color="text-purple-600" />
          <StatCard icon={BookOpen} label="Assessments" value={stats?.assessmentCount} color="text-amber-600" />
        </div>

        {/* Information Split: Institutional Metadata & School Admins */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <h2 className="text-sm font-bold text-ink border-b border-ink/10 pb-2">Institutional Information</h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Principal / Head</span>
                <p className="font-semibold text-ink mt-0.5">{school.principal_name || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Official Email</span>
                <p className="font-semibold text-ink mt-0.5">{school.official_email || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Division</span>
                <p className="font-semibold text-ink mt-0.5">{school.division || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Region</span>
                <p className="font-semibold text-ink mt-0.5">{school.region || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Date Registered</span>
                <p className="font-semibold text-ink mt-0.5">
                  {school.created_at
                    ? new Date(school.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* School Admins Card */}
          <div className="lg:col-span-2 rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-ink">School Administrators</h2>
                <p className="text-xs text-ink/50 mt-0.5">Admin accounts managing this school's portal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-cream hover:bg-brand-blue/90 transition-colors cursor-pointer"
              >
                <Plus size={14} weight="bold" />
                <span>Add Admin</span>
              </button>
            </div>

            {adminsLoading ? (
              <div className="flex justify-center py-8">
                <SpinnerGap size={24} className="animate-spin text-brand-blue" />
              </div>
            ) : admins.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink/40">
                <Users size={32} className="mx-auto text-ink/20 mb-2" />
                <p className="font-semibold">No admin accounts assigned yet.</p>
                <p className="mt-0.5">Click "Add Admin" to provision an administrator for this school.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-ink/[0.02]">
                      <th className="p-2.5 text-left font-bold text-ink/50">Name</th>
                      <th className="p-2.5 text-left font-bold text-ink/50">Email</th>
                      <th className="p-2.5 text-center font-bold text-ink/50">Status</th>
                      <th className="p-2.5 text-right font-bold text-ink/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {admins.map((admin) => (
                      <tr key={admin.user_id} className="hover:bg-ink/[0.02]">
                        <td className="p-2.5 font-semibold text-ink">
                          {admin.first_name || admin.last_name
                            ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim()
                            : 'Admin Account'}
                        </td>
                        <td className="p-2.5 font-mono text-ink/70">{admin.email}</td>
                        <td className="p-2.5 text-center">
                          <StatusBadge status={admin.status} />
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleResetPassword(admin.user_id, admin.email)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Key size={13} />
                              <span>Reset Pass</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(admin.user_id, admin.status)}
                              className={`flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                                admin.status === 'active'
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {admin.status === 'active' ? <Prohibit size={15} /> : <CheckCircle size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit School Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-base font-bold text-ink">Edit School Details</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.schoolName}
                  onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Division</label>
                  <input
                    type="text"
                    value={editFormData.division}
                    onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Region</label>
                  <input
                    type="text"
                    value={editFormData.region}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Official Email</label>
                <input
                  type="email"
                  value={editFormData.officialEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, officialEmail: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Principal Name</label>
                <input
                  type="text"
                  value={editFormData.principalName}
                  onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none cursor-pointer focus:border-brand-red"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-full border border-ink/10 px-4 py-2 font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-full bg-brand-red px-5 py-2 font-bold text-cream hover:bg-brand-red/90 disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Add School Administrator</h3>
                <p className="text-xs text-ink/50 mt-0.5">Assign an administrator to {school.school_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAdminOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria"
                    value={adminFormData.firstName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Santos"
                    value={adminFormData.lastName}
                    onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maria.santos@deped.gov.ph"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="rounded-full border border-ink/10 px-4 py-2 font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="rounded-full bg-brand-blue px-5 py-2 font-bold text-cream hover:bg-brand-blue/90 disabled:opacity-50 cursor-pointer"
                >
                  {addingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Display / Credential Modal */}
      {passModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
              <Key size={22} className="text-amber-600" />
              <h3 className="text-base font-bold text-ink">{passModalData.title}</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-ink/50 text-[11px]">Administrator Email:</span>
                <p className="font-semibold text-ink font-mono">{passModalData.email}</p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-3.5 space-y-1.5">
                <span className="text-ink/50 text-[11px] font-bold uppercase">Temporary Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-ink/15 text-ink tracking-wider flex-1">
                    {passModalData.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(passModalData.password)}
                    className="flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-3 py-2 font-semibold text-ink hover:bg-ink/5 cursor-pointer shrink-0"
                  >
                    {copiedPass ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-ink/50">
                Please copy and share this temporary password securely with the administrator.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setPassModalData(null)}
                className="rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
