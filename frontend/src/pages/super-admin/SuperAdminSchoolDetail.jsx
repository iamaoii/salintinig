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
          district: data.school.district || '',
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

  useEffect(() => {
    if (isEditOpen || isAddAdminOpen || passModalData) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isEditOpen, isAddAdminOpen, passModalData]);

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

  const handleCancelEdit = () => {
    if (school) {
      setEditFormData({
        schoolName: school.school_name || '',
        division: school.division || '',
        district: school.district || '',
        region: school.region || '',
        officialEmail: school.official_email || '',
        principalName: school.principal_name || '',
        status: school.status || 'active',
      });
    }
    setIsEditOpen(false);
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
        body: JSON.stringify({ email: adminFormData.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddAdminOpen(false);
        setAdminFormData({ firstName: '', lastName: '', email: '' });
        fetchAdmins();
        setToast({ message: `Admin account created and credentials emailed to ${adminFormData.email}.`, type: 'success' });
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
    if (!window.confirm(`Reset temporary password and email credentials to ${email}?`)) return;
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins/${adminId}/reset-password`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Temporary password emailed successfully to ${email}.`, type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to reset password.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error resetting password.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-32 rounded bg-ink/10" />

        {/* Top Header Card skeleton */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded bg-ink/10" />
            <div className="h-4 w-40 rounded bg-ink/5" />
            <div className="h-3 w-48 rounded bg-ink/5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 rounded-full bg-ink/10" />
            <div className="h-9 w-36 rounded-full bg-ink/10" />
          </div>
        </div>

        {/* 3 Stat Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-ink/10 bg-cream p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-ink/10" />
                <div className="size-8 rounded-xl bg-ink/10" />
              </div>
              <div className="h-8 w-16 rounded bg-ink/10" />
            </div>
          ))}
        </div>

        {/* Info split grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 space-y-4">
            <div className="h-5 w-36 rounded bg-ink/10 pb-2" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-ink/5" />
              <div className="h-4 w-3/4 rounded bg-ink/5" />
              <div className="h-4 w-2/3 rounded bg-ink/5" />
            </div>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-ink/10 bg-cream p-6 space-y-4">
            <div className="h-5 w-48 rounded bg-ink/10" />
            <div className="h-28 rounded-xl bg-ink/5" />
          </div>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Student} label="Total Students" value={stats?.studentCount} color="text-brand-blue" />
          <StatCard icon={ChalkboardTeacher} label="Total Teachers" value={stats?.teacherCount} color="text-emerald-600" />
          <StatCard icon={BookOpen} label="Assessments" value={stats?.assessmentCount} color="text-amber-600" />
        </div>

        {/* Information Split: Institutional Profile & Administrator Account */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Institutional Profile Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <h2 className="text-sm font-bold text-ink border-b border-ink/10 pb-2">Institutional Profile</h2>
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Principal / Head</span>
                <p className="font-semibold text-ink mt-0.5">{school.principal_name || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">Division</span>
                <p className="font-semibold text-ink mt-0.5">{school.division || '—'}</p>
              </div>
              <div>
                <span className="text-ink/40 font-semibold uppercase text-[10px]">District</span>
                <p className="font-semibold text-ink mt-0.5">{school.district || '—'}</p>
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

          {/* Official Administrator Account Card */}
          <div className="lg:col-span-2 rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-ink/10 pb-3">
                <h2 className="text-sm font-bold text-ink">Official Administrator Account</h2>
                <p className="text-xs text-ink/50 mt-0.5">Official school admin credentials for portal login and management.</p>
              </div>

              {admins.length > 0 && admins[0] ? (
                <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-ink/40 font-semibold uppercase text-[10px]">Official Admin Login Email</span>
                      <p className="font-bold font-mono text-ink text-base mt-0.5">{admins[0].email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink/60">Account Status:</span>
                      <StatusBadge status={admins[0].status} />
                    </div>
                  </div>

                  <p className="text-xs text-ink/60 leading-relaxed border-t border-ink/10 pt-3">
                    This account holds full administrator permissions for <strong>{school.school_name}</strong>. Resetting credentials will generate a new temporary password and dispatch it to this email address via Resend.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-ink/10 bg-ink/[0.02] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-ink/40 font-semibold uppercase text-[10px]">Official School Email</span>
                    <p className="font-semibold font-mono text-ink text-sm">{school.official_email || 'No email assigned'}</p>
                  </div>
                  {school.official_email && (
                    <button
                      type="button"
                      onClick={() => handleAddAdmin({ preventDefault: () => {}, email: school.official_email })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-xs font-bold text-cream hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <EnvelopeSimple size={15} />
                      <span>Provision Credentials Email</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {admins.length > 0 && admins[0] && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => handleToggleAdminStatus(admins[0].user_id, admins[0].status)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    admins[0].status === 'active'
                      ? 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
                      : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={admins[0].status === 'active' ? 'Deactivate Admin' : 'Activate Admin'}
                >
                  {admins[0].status === 'active' ? (
                    <>
                      <Prohibit size={15} />
                      <span>Deactivate Account</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      <span>Activate Account</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(admins[0].user_id, admins[0].email)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-cream hover:bg-blue-700 transition-colors cursor-pointer"
                  title="Send new temporary password via email"
                >
                  <Key size={15} />
                  <span>Reset & Email Credentials</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit School Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Edit School Details</h3>
                <p className="text-xs text-ink/50 mt-0.5">School ID: {school?.school_id}</p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.schoolName}
                  onChange={(e) => setEditFormData({ ...editFormData, schoolName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Division</label>
                  <input
                    type="text"
                    value={editFormData.division}
                    onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">District</label>
                  <input
                    type="text"
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Region</label>
                  <input
                    type="text"
                    value={editFormData.region}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Official Email</label>
                <input
                  type="email"
                  value={editFormData.officialEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, officialEmail: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Principal Name</label>
                <input
                  type="text"
                  value={editFormData.principalName}
                  onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-cream hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
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

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin.mandaluyong@deped.gov.ph"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-ink outline-none focus:border-brand-red"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  The temporary password will be sent automatically via email to this address using Resend.
                </p>
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
                  className="rounded-full bg-brand-red px-5 py-2 font-bold text-cream hover:bg-brand-red/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {addingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
