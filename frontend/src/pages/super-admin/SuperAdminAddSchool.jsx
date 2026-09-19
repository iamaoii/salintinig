import { getApiUrl } from '../../config/api.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Buildings,
  ArrowLeft,
  FloppyDisk,
  Warning,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function SuperAdminAddSchool() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState(null);

  const [form, setForm] = useState({
    schoolId: '',
    schoolName: '',
    division: '',
    region: '',
    officialEmail: '',
    principalName: '',
    adminEmail: '',
    adminName: '',
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.schoolId.trim()) errs.schoolId = 'School ID (Code) is required.';
    if (!form.schoolName.trim()) errs.schoolName = 'School name is required.';
    if (!form.adminEmail.trim()) errs.adminEmail = 'Admin email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) errs.adminEmail = 'Enter a valid email address.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedTempPassword(data.tempPassword);
        setToast({ message: data.message || 'School created successfully!', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to create school.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <ToastNotification message={toast?.message || null} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/super-admin/schools')}
          className="flex size-9 items-center justify-center rounded-full border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Buildings size={22} className="text-purple-700" />
            <h1 className="text-2xl font-bold text-ink">Add School</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">Register a new school and create an admin account</p>
        </div>
      </div>

      {/* Success state — show temp password */}
      {createdTempPassword && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <Buildings size={20} weight="fill" />
            <h2 className="text-sm font-bold">School Created Successfully!</h2>
          </div>
          <p className="text-xs text-green-700/80">
            The school and admin account have been created. Share the temporary password with the school administrator:
          </p>
          <div className="rounded-xl border border-green-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold text-green-700 mb-0.5">Temporary Password</p>
            <p className="text-lg font-black text-ink tracking-widest">{createdTempPassword}</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <Warning size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">The admin must change this password on first login.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/super-admin/schools')}
            className="rounded-full bg-purple-700 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer"
          >
            Back to Schools
          </button>
        </div>
      )}

      {/* Form */}
      {!createdTempPassword && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* School Info Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink border-b border-ink/10 pb-2">School Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  School Code / ID <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolId}
                  onChange={(e) => handleChange('schoolId', e.target.value)}
                  placeholder="e.g. 303402"
                  className={`w-full rounded-xl border ${errors.schoolId ? 'border-brand-red' : 'border-ink/10'} bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors`}
                />
                {errors.schoolId && <p className="mt-1 text-[11px] text-brand-red">{errors.schoolId}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  School Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  placeholder="e.g. Rizal Elementary School"
                  className={`w-full rounded-xl border ${errors.schoolName ? 'border-brand-red' : 'border-ink/10'} bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors`}
                />
                {errors.schoolName && <p className="mt-1 text-[11px] text-brand-red">{errors.schoolName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Division</label>
                <input
                  type="text"
                  value={form.division}
                  onChange={(e) => handleChange('division', e.target.value)}
                  placeholder="e.g. Division of Manila"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Region</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  placeholder="e.g. NCR"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Official Email</label>
                <input
                  type="email"
                  value={form.officialEmail}
                  onChange={(e) => handleChange('officialEmail', e.target.value)}
                  placeholder="school@deped.gov.ph"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Principal Name</label>
                <input
                  type="text"
                  value={form.principalName}
                  onChange={(e) => handleChange('principalName', e.target.value)}
                  placeholder="Full name of principal"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Admin Account Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink border-b border-ink/10 pb-2">School Admin Account</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Admin Email <span className="text-brand-red">*</span>
                </label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  placeholder="admin@school.com"
                  className={`w-full rounded-xl border ${errors.adminEmail ? 'border-brand-red' : 'border-ink/10'} bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors`}
                />
                {errors.adminEmail && <p className="mt-1 text-[11px] text-brand-red">{errors.adminEmail}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Admin Name</label>
                <input
                  type="text"
                  value={form.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  placeholder="Full name (optional)"
                  className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendWelcomeEmail}
                onChange={(e) => handleChange('sendWelcomeEmail', e.target.checked)}
                className="rounded border-ink/20 text-purple-700 focus:ring-purple-400 cursor-pointer"
              />
              <span className="text-xs text-ink/70">Send welcome email with temporary password to admin</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-purple-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <FloppyDisk size={14} weight="bold" />
              )}
              {loading ? 'Creating...' : 'Create School'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/super-admin/schools')}
              className="rounded-full border border-ink/10 bg-cream px-6 py-2.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
