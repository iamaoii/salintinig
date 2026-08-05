import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gear,
  Building,
  ShieldCheck,
  FloppyDisk,
  EnvelopeSimple,
  IdentificationBadge,
  CalendarBlank,
  Copy,
  Camera,
  User,
  LockKey,
  Bell,
  Info,
  ChatText,
  Trash,
  CaretRight,
  X,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react';
import logoBg from '../../assets/logo/logo_bg.webp';
import logo from '../../assets/logo/logo.webp';
import { getUser, logout } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import AvatarCropModal from '../../components/common/AvatarCropModal.jsx';

export default function AdminSettings() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('adminAvatarCache') || null);
  const [cropSrc, setCropSrc] = useState(null); // holds raw image data URL for crop modal

  const [schoolProfile, setSchoolProfile] = useState({
    schoolName: '',
    schoolId: '',
    division: '',
    region: '',
    principalName: '',
    contactEmail: '',
  });

  const [securitySettings, setSecuritySettings] = useState({
    autoCreateAccounts: true,
    requirePasswordResetOnFirstLogin: true,
    allowTeacherBulkUpload: true,
    auditLoggingEnabled: true,
  });

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Lock body scroll when any modal is open (using position:fixed to avoid breaking sticky navbar)
  useEffect(() => {
    const anyOpen = isPasswordModalOpen || isAboutModalOpen || isHelpModalOpen || isDeactivateModalOpen || Boolean(cropSrc);
    if (anyOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [isPasswordModalOpen, isAboutModalOpen, isHelpModalOpen, isDeactivateModalOpen, cropSrc]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const compressImageToWebP = (file, size = 256, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const cropSize = Math.min(img.width, img.height);
          const startX = (img.width - cropSize) / 2;
          const startY = (img.height - cropSize) / 2;

          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, size, size);
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(webpDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Open crop modal instead of uploading immediately
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Called when user confirms crop — receives cropped WebP data URL
  const handleCropConfirm = async (croppedWebP) => {
    setCropSrc(null);
    try {
      // Show local preview instantly while upload is in progress
      setAvatarUrl(croppedWebP);
      window.dispatchEvent(new CustomEvent('adminAvatarChanged', { detail: croppedWebP }));

      // Sync to backend — backend uploads to Supabase Storage and returns the CDN URL
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/admin/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ profileImage: croppedWebP }),
      });

      // Fetch the actual Supabase CDN URL back from the DB and sync cache
      const infoRes = await fetch('http://localhost:5000/api/admin/info', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const infoData = await infoRes.json();
      if (infoRes.ok && infoData.success && infoData.profileImage) {
        const supabaseUrl = infoData.profileImage;
        setAvatarUrl(supabaseUrl);
        localStorage.setItem('adminAvatarCache', supabaseUrl);
        window.dispatchEvent(new CustomEvent('adminAvatarChanged', { detail: supabaseUrl }));
      } else {
        localStorage.setItem('adminAvatarCache', croppedWebP);
      }

      showToast('Profile picture updated!');
    } catch (err) {
      console.warn('Failed to process or sync avatar:', err);
    }
  };

  const handleCropCancel = () => setCropSrc(null);

  const fetchAdminInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/info', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminInfo(data);
        if (data.profileImage) {
          setAvatarUrl(data.profileImage);
          localStorage.setItem('adminAvatarCache', data.profileImage);
          window.dispatchEvent(new CustomEvent('adminAvatarChanged', { detail: data.profileImage }));
        } else {
          localStorage.removeItem('adminAvatarCache');
        }
        if (data.schoolInfo) {
          setSchoolProfile({
            schoolName: data.schoolInfo.schoolName || '',
            schoolId: data.schoolInfo.schoolId || '',
            division: data.schoolInfo.division || '',
            region: data.schoolInfo.region || '',
            principalName: data.schoolInfo.principalName || '',
            contactEmail: data.schoolInfo.officialEmail || currentUser?.email || '',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin info for settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInfo();

    const handleSYChange = () => fetchAdminInfo();
    window.addEventListener('schoolYearChanged', handleSYChange);
    return () => window.removeEventListener('schoolYearChanged', handleSYChange);
  }, []);

  const adminName = currentUser?.name || 'Administrator';
  const adminEmail = currentUser?.email || schoolProfile.contactEmail;
  const activeSchoolYear = adminInfo?.activeSchoolYear || '2026-2027';

  const handleCopyId = () => {
    if (!schoolProfile.schoolId) return;
    navigator.clipboard?.writeText(schoolProfile.schoolId);
    setCopiedId(true);
    showToast('School ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!adminEmail) return;
    navigator.clipboard?.writeText(adminEmail);
    setCopiedEmail(true);
    showToast('Email address copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          schoolName: schoolProfile.schoolName,
          schoolId: schoolProfile.schoolId,
          division: schoolProfile.division,
          region: schoolProfile.region,
          principalName: schoolProfile.principalName,
          officialEmail: schoolProfile.contactEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('School profile saved successfully!');
        window.dispatchEvent(new Event('schoolYearChanged'));
        fetchAdminInfo();
      } else {
        showToast(data.error || 'Failed to save school profile.', 'error');
      }
    } catch (err) {
      showToast('Error saving school profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSecurity = (key) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    showToast('Security policy updated.');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast('Password updated successfully!');
  };

  const handleConfirmDeactivate = () => {
    setIsDeactivateModalOpen(false);
    showToast('Deactivation request logged. Contact DepEd Central Office for permanent account removal.');
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="mx-auto max-w-4xl space-y-6 pb-20">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2">
            <Gear size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Account & School Settings</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Manage your administrator profile, official school details, active academic year, and security policies
          </p>
        </div>

        {/* Administrator Profile Summary Header Card matching SalinTinig branding */}
        <div id="profile-details-section" className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-brand-red p-5 sm:p-6 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
          <img
            src={logoBg}
            alt=""
            className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
          />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Interactive Avatar with Camera Upload Badge */}
            <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar
                name={adminName}
                src={avatarUrl}
                size={108}
                className="text-3xl font-bold shadow-lg border-4 border-white/40 shrink-0"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} className="text-white" weight="bold" />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-white text-brand-red shadow-lg transition-transform hover:scale-110 cursor-pointer border border-brand-red/20"
                title="Change profile picture"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Camera size={16} weight="bold" />
              </button>
            </div>

            <div className="flex flex-col items-start gap-1.5">
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-cream uppercase tracking-wider">
                System Administrator
              </span>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-cream drop-shadow-sm">
                {loading ? <span className="inline-block h-6 w-48 animate-pulse rounded bg-white/20" /> : adminName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold text-white">
                <div className="flex items-center gap-1.5">
                  <EnvelopeSimple size={16} className="shrink-0 text-white/90" />
                  <span>{loading ? <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/30" /> : adminEmail}</span>
                  {adminEmail && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  {copiedEmail && <span className="text-xs font-bold text-green-300">Copied!</span>}
                </div>

                <span className="text-white/40 hidden sm:inline">•</span>

                <div className="flex items-center gap-1.5">
                  <IdentificationBadge size={16} className="shrink-0 text-white/90" />
                  <span className="font-mono">{loading ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/30" /> : `School ID: ${schoolProfile.schoolId || 'N/A'}`}</span>
                  {schoolProfile.schoolId && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Copy School ID"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  {copiedId && <span className="text-xs font-bold text-green-300">Copied!</span>}
                </div>

                <span className="text-white/40 hidden sm:inline">•</span>

                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={16} className="shrink-0 text-white/90" />
                  <span>Active S.Y.: <strong className="font-bold text-white">{loading ? '...' : activeSchoolYear}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* School Institutional Profile Form */}
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
            <Building size={20} className="text-brand-blue" />
            <h3 className="text-base font-bold text-ink">School Institutional Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-ink">School Name</label>
              <input
                type="text"
                required
                disabled={loading}
                value={schoolProfile.schoolName}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, schoolName: e.target.value })}
                placeholder="Enter School Name"
                className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-ink">School ID (DepEd Code)</label>
                <span className="text-[10px] font-semibold text-ink/40">Read-Only</span>
              </div>
              <input
                type="text"
                readOnly
                value={schoolProfile.schoolId}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70 outline-none cursor-not-allowed font-mono select-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-ink">Division Office</label>
                <span className="text-[10px] font-semibold text-ink/40">Read-Only</span>
              </div>
              <input
                type="text"
                readOnly
                value={schoolProfile.division}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70 outline-none cursor-not-allowed select-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-ink">Region</label>
                <span className="text-[10px] font-semibold text-ink/40">Read-Only</span>
              </div>
              <input
                type="text"
                readOnly
                value={schoolProfile.region}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70 outline-none cursor-not-allowed select-none"
              />
            </div>

            <div>
              <label className="font-semibold text-ink">School Head / Principal Name</label>
              <input
                type="text"
                required
                disabled={loading}
                value={schoolProfile.principalName}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
                placeholder="Enter Principal Name"
                className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
              />
            </div>

            <div>
              <label className="font-semibold text-ink">Official Contact Email</label>
              <input
                type="email"
                required
                disabled={loading}
                value={schoolProfile.contactEmail}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, contactEmail: e.target.value })}
                placeholder="Enter Contact Email"
                className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-ink/10">
            <button
              type="submit"
              disabled={loading || isSaving}
              className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2.5 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FloppyDisk size={16} />
              <span>{isSaving ? 'Saving...' : 'Save School Profile'}</span>
            </button>
          </div>
        </form>

        {/* Other Settings Section matching exact layout design */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-ink">Other Settings</h2>

          {/* Unified Settings Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] overflow-hidden divide-y divide-ink/10">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ink/5 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <LockKey size={20} className="text-ink/80 group-hover:text-ink shrink-0" />
                <span className="text-sm font-semibold text-ink">Password</span>
              </div>
              <CaretRight size={18} className="text-ink/40 group-hover:text-ink transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/notifications')}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ink/5 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <Bell size={20} className="text-ink/80 group-hover:text-ink shrink-0" />
                <span className="text-sm font-semibold text-ink">Notifications</span>
              </div>
              <CaretRight size={18} className="text-ink/40 group-hover:text-ink transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ink/5 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <Info size={20} className="text-ink/80 group-hover:text-ink shrink-0" />
                <span className="text-sm font-semibold text-ink">About application</span>
              </div>
              <CaretRight size={18} className="text-ink/40 group-hover:text-ink transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ink/5 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <ChatText size={20} className="text-ink/80 group-hover:text-ink shrink-0" />
                <span className="text-sm font-semibold text-ink">Help / FAQ</span>
              </div>
              <CaretRight size={18} className="text-ink/40 group-hover:text-ink transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setIsDeactivateModalOpen(true)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-red-500/10 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <Trash size={20} className="text-brand-red shrink-0" />
                <span className="text-sm font-semibold text-brand-red">Deactivate my account</span>
              </div>
              <CaretRight size={18} className="text-brand-red/60 group-hover:text-brand-red transition-colors shrink-0" />
            </button>
          </div>
        </div>

      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <LockKey size={22} className="text-brand-red" />
                <h3 className="text-lg font-bold text-ink">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min. 6 characters)"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-full border border-ink/20 px-5 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-6 py-2 text-xs font-semibold text-cream hover:bg-blue-700"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Application Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5 text-center">
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <img src={logo} alt="SalinTinig Logo" className="h-14 w-auto" />
              <div>
                <h3 className="text-xl font-bold text-ink">SalinTinig</h3>
                <p className="text-xs text-ink/50">DepEd Phil-IRI Assessment System</p>
              </div>
              <span className="inline-block rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
                Version 1.0.0 (Build 2026.08)
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-ink/10 p-4 text-xs text-ink/70 text-left space-y-2">
              <p>
                <strong>SalinTinig</strong> is the official Philippine Informal Reading Inventory (Phil-IRI) oral reading diagnostic and analytics portal designed for elementary schools.
              </p>
              <p className="text-[11px] text-ink/50">
                Department of Education • Division of City Schools • All rights reserved.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-cream hover:bg-ink/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help / FAQ Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <ChatText size={22} className="text-brand-blue" />
                <h3 className="text-lg font-bold text-ink">Administrator Help & FAQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-2xl bg-white p-4 border border-ink/10 space-y-1">
                <p className="font-bold text-ink">How do I activate a new Academic School Year?</p>
                <p className="text-ink/60">
                  Click the <strong>Active S.Y.</strong> button in the top navigation bar, enter the format (e.g., 2027-2028), and click <strong>Activate S.Y.</strong>. All section counts and stats update immediately across the system.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-ink/10 space-y-1">
                <p className="font-bold text-ink">How do I assign Faculty in Charge and Advisers?</p>
                <p className="text-ink/60">
                  Navigate to <strong>Faculty Assignment</strong> from the sidebar. You can select lead faculty and section advisers or unassign them by choosing "No Faculty in Charge".
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-ink/10 space-y-1">
                <p className="font-bold text-ink">What happens when I update School Profile settings?</p>
                <p className="text-ink/60">
                  Changes save to PostgreSQL immediately and update the Red Header Welcome Cards on the dashboard in real time.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full rounded-full bg-brand-blue px-6 py-2.5 text-xs font-semibold text-cream hover:bg-blue-700"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-red/30 bg-cream p-6 shadow-2xl space-y-5 text-center">
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                <Warning size={32} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Deactivate Admin Account</h3>
                <p className="text-xs text-ink/60 mt-1">
                  Are you sure you want to request account deactivation? You will lose system administration privileges for your school portal.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="rounded-full border border-ink/20 px-6 py-2.5 text-xs font-semibold text-ink hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="rounded-full bg-brand-red px-6 py-2.5 text-xs font-semibold text-cream hover:bg-red-700 shadow-sm"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
