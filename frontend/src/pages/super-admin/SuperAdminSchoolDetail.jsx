import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Buildings,
  ArrowLeft,
  Student,
  ChalkboardTeacher,
  SquaresFour,
  UserPlus,
  Key,
  CheckCircle,
  XCircle,
  Pencil,
  FloppyDisk,
  Warning,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function SuperAdminSchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchool(data.school);
        setAdmins(data.admins || []);
        setStats(data.stats);
        setEditForm({
          schoolName: data.school.name,
          division: data.school.division || '',
          region: data.school.region || '',
          officialEmail: data.school.email || '',
          principalName: data.school.principal || '',
        });
      } else {
        setToast({ message: data.error || 'School not found.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to load school details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchool(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'School updated successfully.', type: 'success' });
        setIsEditing(false);
        fetchSchool();
      } else {
        setToast({ message: data.error || 'Failed to update school.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ adminEmail: newAdminEmail, adminName: newAdminName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Admin account created. Temp password: ${data.tempPassword}`, type: 'success' });
        setShowAddAdmin(false);
        setNewAdminEmail('');
        setNewAdminName('');
        fetchSchool();
      } else {
        setToast({ message: data.error || 'Failed to create admin.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleResetPassword = async (adminId) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins/${adminId}/reset-password`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetPasswordResult(data.tempPassword);
        setToast({ message: 'Password reset successfully.', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to reset password.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  const handleToggleAdmin = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/schools/${id}/admins/${adminId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Admin account ${newStatus}.`, type: 'success' });
        fetchSchool();
      } else {
        setToast({ message: data.error || 'Failed to update admin status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-2 text-ink/50">
        <div className="size-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Loading school details...</span>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Buildings size={40} className="text-ink/30 mb-3" />
        <p className="text-sm font-bold text-ink">School not found</p>
        <button type="button" onClick={() => navigate('/super-admin/schools')} className="mt-3 text-xs text-purple-700 hover:underline cursor-pointer">
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <ToastNotification message={toast?.message || null} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/super-admin/schools')}
          className="flex size-9 items-center justify-center rounded-full border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Buildings size={22} className="text-purple-700 shrink-0" />
            <h1 className="text-xl font-bold text-ink truncate">{school.name}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
            }`}>
              {school.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">School Code: {school.id}</p>
        </div>
        {!isEditing ? (
          <button type="button" onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-cream px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer">
            <Pencil size={13} weight="bold" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 rounded-full bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-60">
              {saving ? <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <FloppyDisk size={13} weight="bold" />}
              Save
            </button>
            <button type="button" onClick={() => setIsEditing(false)}
              className="rounded-full border border-ink/10 bg-cream px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Students', value: stats?.students ?? 0, icon: Student, bg: 'bg-brand-blue/10 text-brand-blue' },
          { label: 'Teachers', value: stats?.teachers ?? 0, icon: ChalkboardTeacher, bg: 'bg-brand-red/10 text-brand-red' },
          { label: 'Sections', value: stats?.sections ?? 0, icon: SquaresFour, bg: 'bg-purple-100 text-purple-700' },
        ].map(({ label, value, icon: Icon, bg }) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm flex items-center gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon size={18} weight="bold" />
            </div>
            <div>
              <p className="text-lg font-black text-ink leading-none">{value.toLocaleString()}</p>
              <p className="text-[11px] text-ink/50 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* School Info */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-ink border-b border-ink/10 pb-2">School Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'School Name', field: 'schoolName', placeholder: 'School name' },
            { label: 'Division', field: 'division', placeholder: 'e.g. Division of Manila' },
            { label: 'Region', field: 'region', placeholder: 'e.g. NCR' },
            { label: 'Official Email', field: 'officialEmail', placeholder: 'school@deped.gov.ph' },
            { label: 'Principal Name', field: 'principalName', placeholder: 'Full name of principal' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <p className="text-[11px] font-semibold text-ink/50 mb-1">{label}</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm[field] || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              ) : (
                <p className="text-sm font-semibold text-ink">{editForm[field] || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin Accounts */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <h2 className="text-sm font-bold text-ink">Admin Accounts</h2>
          <button type="button" onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="flex items-center gap-1.5 rounded-full bg-purple-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer">
            <UserPlus size={12} weight="bold" />
            Add Admin
          </button>
        </div>

        {showAddAdmin && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
            <p className="text-xs font-bold text-ink">Create Admin Account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Admin email *"
                className="rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors"
              />
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Admin name (optional)"
                className="rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail.trim()}
                className="flex items-center gap-1.5 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-60">
                {addingAdmin ? <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <UserPlus size={12} weight="bold" />}
                Create Account
              </button>
              <button type="button" onClick={() => setShowAddAdmin(false)}
                className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetPasswordResult && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <Warning size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700">New Temporary Password</p>
              <p className="text-sm font-black text-ink tracking-widest">{resetPasswordResult}</p>
              <button type="button" onClick={() => setResetPasswordResult(null)}
                className="mt-1 text-[11px] text-amber-700 hover:underline cursor-pointer">Dismiss</button>
            </div>
          </div>
        )}

        {admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus size={32} className="text-ink/30 mb-2" />
            <p className="text-xs font-bold text-ink">No admin accounts yet</p>
            <p className="text-[11px] text-ink/50 mt-0.5">Add an admin to manage this school.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between rounded-xl border border-ink/5 bg-ink/[0.01] p-3">
                <div>
                  <p className="text-xs font-bold text-ink">{admin.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold ${admin.status === 'active' ? 'text-green-600' : 'text-ink/40'}`}>
                      {admin.status === 'active' ? '● Active' : '○ Disabled'}
                    </span>
                    {admin.mustChangePassword && (
                      <span className="text-[10px] text-amber-600">· Must change password</span>
                    )}
                    <span className="text-[10px] text-ink/30">Since {admin.date_added}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleResetPassword(admin.id)}
                    className="flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-[11px] font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer">
                    <Key size={11} weight="bold" />
                    Reset PW
                  </button>
                  <button type="button" onClick={() => handleToggleAdmin(admin.id, admin.status)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                      admin.status === 'active'
                        ? 'border border-ink/10 text-ink/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {admin.status === 'active' ? <><XCircle size={11} weight="bold" /> Disable</> : <><CheckCircle size={11} weight="bold" /> Enable</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
