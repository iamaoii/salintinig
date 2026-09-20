import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Buildings,
  UserPlus,
  ArrowLeft,
  Copy,
  Check,
  Key,
  EnvelopeSimple,
  IdentificationBadge,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function SuperAdminAddSchool() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [division, setDivision] = useState('');
  const [region, setRegion] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [principalName, setPrincipalName] = useState('');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [tempPassword, setTempPassword] = useState(generateRandomPassword());
  const [copiedPass, setCopiedPass] = useState(false);

  // Created Success Modal
  const [createdResult, setCreatedResult] = useState(null);

  useEffect(() => {
    if (createdResult) {
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
  }, [createdResult]);

  const handleCopyPassword = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId.trim() || !schoolName.trim()) {
      setToast({ message: 'School ID and School Name are required.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const payload = {
        schoolId: schoolId.trim(),
        schoolName: schoolName.trim(),
        division: division.trim() || null,
        region: region.trim() || null,
        officialEmail: officialEmail.trim() || null,
        principalName: principalName.trim() || null,
        adminFirstName: adminFirstName.trim() || null,
        adminLastName: adminLastName.trim() || null,
        adminEmail: adminEmail.trim() || null,
        tempPassword: tempPassword,
      };

      const res = await fetch(getApiUrl('/api/super-admin/schools'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedResult({
          schoolName: data.school?.school_name || schoolName.trim(),
          schoolId: data.school?.school_id || schoolId.trim(),
          adminEmail: adminEmail.trim(),
          tempPassword: data.tempPassword || tempPassword,
        });
      } else {
        setToast({ message: data.error || 'Failed to create school.', type: 'error' });
      }
    } catch (err) {
      console.error('Error adding school:', err);
      setToast({ message: 'Network error creating school.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/super-admin/schools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Schools</span>
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Buildings size={24} className="text-brand-red shrink-0" />
            <h1 className="text-2xl font-bold text-ink">Register New School</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/60">
            Create an official school profile and provision an administrator login account.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: School Information */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
              <Buildings size={20} className="text-brand-red" />
              <h2 className="text-base font-bold text-ink">1. School Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  School ID / Code <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 136589"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red font-mono"
                />
                <p className="text-[11px] text-ink/40 mt-1">Official DepEd School ID used as unique identifier.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  School Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandaluyong Elementary School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Division</label>
                <input
                  type="text"
                  placeholder="e.g. Schools Division of Mandaluyong"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Region</label>
                <input
                  type="text"
                  placeholder="e.g. National Capital Region (NCR)"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="e.g. mandaluyong.es@deped.gov.ph"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Principal / School Head</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maria Elena Cruz"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>

          {/* Section 2: School Admin Account */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-brand-blue" />
                <h2 className="text-base font-bold text-ink">2. School Administrator Account</h2>
              </div>
              <span className="text-xs text-ink/50 font-normal">Optional initial admin account</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Admin Login Email</label>
                <input
                  type="email"
                  placeholder="e.g. admin.mandaluyong@deped.gov.ph"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  The temporary password will be sent automatically via email to this address using Resend.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/super-admin/schools')}
              className="rounded-full border border-ink/10 px-5 py-2.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-xs font-bold text-cream shadow-xs hover:bg-brand-red/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  <span>Registering School...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {createdResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={28} weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-ink">School Registered Successfully!</h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                <strong>{createdResult.schoolName}</strong> (Code: {createdResult.schoolId}) has been added to SalinTinig.
              </p>
            </div>

            {createdResult.adminEmail && (
              <div className="rounded-xl border border-ink/10 bg-emerald-500/10 p-4 space-y-1.5 text-xs">
                <p className="font-bold text-ink flex items-center gap-1.5 text-emerald-800">
                  <EnvelopeSimple size={16} className="text-emerald-600" />
                  Credentials Email Sent
                </p>
                <p className="text-ink/70 text-[11px]">
                  An email containing the temporary login password was dispatched to:
                </p>
                <p className="font-semibold font-mono text-ink text-xs">{createdResult.adminEmail}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={() => navigate('/super-admin/schools')}
                className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-xs font-bold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer text-center"
              >
                Back to Schools
              </button>
              <button
                type="button"
                onClick={() => navigate(`/super-admin/schools/${createdResult.schoolId}`)}
                className="flex-1 rounded-full bg-brand-red px-4 py-2.5 text-xs font-bold text-cream hover:bg-brand-red/90 transition-colors cursor-pointer text-center"
              >
                View School Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
