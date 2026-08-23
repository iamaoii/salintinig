import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gear,
  User,
  PencilSimple,
  FloppyDisk,
  EnvelopeSimple,
  IdentificationBadge,
  CalendarBlank,
  Copy,
  Camera,
  LockKey,
  Bell,
  Info,
  ChatText,
  Trash,
  CaretRight,
  X,
  Warning,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import logoBg from '../../../assets/logo/logo_bg.webp';
import { getToken, getUser, logout } from '../../../lib/auth.js';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import AvatarCropModal from '../../../components/common/AvatarCropModal.jsx';

export default function AccountSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(() => currentUser?.profileImage || currentUser?.profile_image || null);
  const [cropSrc, setCropSrc] = useState(null);

  // Modal states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Active School Year
  const [activeSY, setActiveSY] = useState('');

  const userSec = currentUser?.section || currentUser?.assigned_section;
  const initialClass = (userSec && !userSec.toLowerCase().includes('unassigned')) ? userSec : 'Unassigned Section';
  const initialDesignation = currentUser?.isFacultyInCharge ? 'Faculty-in-Charge' : (initialClass !== 'Unassigned Section') ? 'Class Adviser' : 'Unassigned Teacher';

  // Form State
  const [form, setForm] = useState({
    fullName: currentUser?.name || 'Teacher',
    teacherId: currentUser?.teacherNo || currentUser?.employeeId || 'N/A',
    assignedClass: initialClass,
    designation: initialDesignation,
    email: currentUser?.email || '',
    contactNo: '0917-123-4567',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lock body scroll when modals open
  useEffect(() => {
    const anyOpen = isEditProfileModalOpen || isPasswordModalOpen || isAboutModalOpen || isHelpModalOpen || isDeactivateModalOpen || Boolean(cropSrc);
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
  }, [isEditProfileModalOpen, isPasswordModalOpen, isAboutModalOpen, isHelpModalOpen, isDeactivateModalOpen, cropSrc]);

  useEffect(() => {
    async function fetchTeacherProfile() {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          const u = data.user;
          const fn = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Teacher';
          const rawSec = u.section || u.assigned_section;
          const hasAssignedSec = Boolean(rawSec && !rawSec.toLowerCase().includes('unassigned'));
          const classText = hasAssignedSec ? rawSec : 'Unassigned Section';
          const desigText = u.isFacultyInCharge ? 'Faculty-in-Charge' : hasAssignedSec ? 'Class Adviser' : 'Unassigned Teacher';

          setForm({
            fullName: fn,
            teacherId: u.teacherNo || u.employeeId || 'N/A',
            assignedClass: classText,
            designation: desigText,
            email: u.email || '',
            contactNo: u.contactNo || u.phone || '0917-123-4567',
          });

          if (u.activeSchoolYear || u.schoolYear) {
            const clean = String(u.activeSchoolYear || u.schoolYear).replace(/^S\.?Y\.?\s*/i, '');
            setActiveSY(clean);
          }

          if (u.profileImage || u.profile_image) {
            setAvatarUrl(u.profileImage || u.profile_image);
          }
        }
      } catch (err) {
        console.warn('Teacher settings fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherProfile();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
  };

  const safeCopy = (text, message, e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!text) return;

    let copied = false;
    try {
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).catch(() => {});
        copied = true;
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copied = true;
      } catch (fallbackErr) {
        console.warn('Fallback copy error:', fallbackErr);
      }
    }

    showToast(message);
  };

  const handleCopyEmail = (e) => {
    safeCopy(form.email, 'Email address copied to clipboard!', e);
  };

  const handleCopyId = (e) => {
    safeCopy(form.teacherId, 'Teacher ID copied to clipboard!', e);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedBase64) => {
    setAvatarUrl(croppedBase64);
    setCropSrc(null);
    localStorage.setItem('teacherAvatarCache', croppedBase64);
    window.dispatchEvent(new CustomEvent('userAvatarChanged', { detail: croppedBase64 }));
    try {
      const token = getToken();
      if (token) {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profileImage: croppedBase64 }),
        });
        const data = await res.json();
        if (data.success && data.user?.profileImage) {
          const finalImg = data.user.profileImage;
          setAvatarUrl(finalImg);
          localStorage.setItem('teacherAvatarCache', finalImg);
          window.dispatchEvent(new CustomEvent('userAvatarChanged', { detail: finalImg }));
          const current = getUser();
          if (current) {
            localStorage.setItem(
              'salintinig_user',
              JSON.stringify({
                ...current,
                profileImage: finalImg,
                profile_image: finalImg,
              })
            );
          }
        }
      }
      showToast('Profile picture updated successfully!');
    } catch (err) {
      console.warn('Error saving avatar to DB:', err);
      showToast('Profile picture updated!');
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = getToken();
      if (token) {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('Teacher profile updated successfully!');
          setIsEditProfileModalOpen(false);
          const current = getUser();
          if (current) {
            localStorage.setItem(
              'salintinig_user',
              JSON.stringify({
                ...current,
                name: form.fullName,
                email: form.email,
              })
            );
          }
          return;
        }
      }
      showToast('Teacher profile updated successfully!');
      setIsEditProfileModalOpen(false);
    } catch (err) {
      showToast('Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    try {
      const token = getToken();
      if (token) {
        const res = await fetch('http://localhost:5000/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          showToast(data.error || 'Failed to update password.', 'error');
          return;
        }
      }
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully!');
    } catch (err) {
      showToast('Failed to update password.', 'error');
    }
  };

  const handleConfirmDeactivate = () => {
    setIsDeactivateModalOpen(false);
    showToast('Deactivation request logged. Please contact administrator for assistance.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
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
            Manage your teacher profile, official class details, active academic year, and security policies
          </p>
        </div>

        {/* Teacher Red Card Header Banner */}
        <div id="profile-details-section" className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden rounded-2xl bg-brand-red px-6 py-8 sm:px-8 sm:py-10 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] gap-6">
          <img
            src={logoBg}
            alt=""
            className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
          />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar with Camera Badge */}
            <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar
                name={form.fullName}
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
                {form.designation}
              </span>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-cream drop-shadow-sm">
                {loading ? <span className="inline-block h-6 w-48 animate-pulse rounded bg-white/20" /> : form.fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold text-white">
                <div className="flex items-center gap-1.5">
                  <EnvelopeSimple size={16} className="shrink-0 text-white/90" />
                  <span>{loading ? <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/30" /> : form.email}</span>
                  {form.email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                <span className="text-white/40 hidden sm:inline">•</span>

                <div className="flex items-center gap-1.5">
                  <IdentificationBadge size={16} className="shrink-0 text-white/90" />
                  <span className="font-mono">{loading ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/30" /> : `Teacher ID: ${form.teacherId}`}</span>
                  {form.teacherId && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Copy Teacher ID"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                {activeSY && (
                  <>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5">
                      <CalendarBlank size={16} className="shrink-0 text-white/90" />
                      <span>Active S.Y.: <strong className="font-bold text-white">{activeSY}</strong></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button on Banner Header */}
          <button
            type="button"
            onClick={() => setIsEditProfileModalOpen(true)}
            className="relative z-10 flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shrink-0"
          >
            <PencilSimple size={16} weight="bold" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Other Settings Section */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-ink">Other Settings</h2>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <LockKey size={18} className="text-ink/70" />
                Password
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => showToast('Notification preferences updated.')}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Bell size={18} className="text-ink/70" />
                Notifications
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Info size={18} className="text-ink/70" />
                About application
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <ChatText size={18} className="text-ink/70" />
                Help / FAQ
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => setIsDeactivateModalOpen(true)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-bold text-brand-red hover:bg-brand-red/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Trash size={18} className="text-brand-red" />
                Deactivate my account
              </span>
              <CaretRight size={16} className="text-brand-red/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Teacher Profile Modal (Popping up on Edit Profile click) */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <User size={22} className="text-brand-blue" />
                <h3 className="text-base font-bold text-ink">Teacher Institutional Profile</h3>
              </div>
              <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-ink">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter Full Name"
                    className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-ink">Teacher ID (Employee Code)</label>
                  <div className="flex items-center justify-between mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70">
                    <input
                      type="text"
                      readOnly
                      value={form.teacherId}
                      className="bg-transparent outline-none w-full cursor-not-allowed font-mono font-bold text-ink"
                    />
                    <span className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider shrink-0 ml-2">Read-Only</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-ink">Assigned Class / Section</label>
                  <div className="flex items-center justify-between mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70">
                    <input
                      type="text"
                      readOnly
                      value={form.assignedClass}
                      className="bg-transparent outline-none w-full cursor-not-allowed font-bold text-ink"
                    />
                    <span className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider shrink-0 ml-2">Read-Only</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-ink">Designation / Position</label>
                  <div className="flex items-center justify-between mt-1 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70">
                    <input
                      type="text"
                      readOnly
                      value={form.designation}
                      className="bg-transparent outline-none w-full cursor-not-allowed font-bold text-ink"
                    />
                    <span className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider shrink-0 ml-2">Read-Only</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-ink">Official Contact Email</label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="teacher@gmail.com"
                    className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="rounded-full bg-ink/10 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || loading}
                  className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-cream transition-colors hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save Teacher Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h3 className="text-base font-bold text-ink">Change Password</h3>
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink">Current Password</label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-ink/20 bg-white pl-3 pr-10 py-2 text-ink outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-semibold text-ink">New Password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-ink/20 bg-white pl-3 pr-10 py-2 text-ink outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-semibold text-ink">Confirm New Password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-ink/20 bg-white pl-3 pr-10 py-2 text-ink outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-full bg-ink/10 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold text-cream hover:bg-blue-700 cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Application Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h3 className="text-base font-bold text-ink">About SalinTinig</h3>
              <button type="button" onClick={() => setIsAboutModalOpen(false)} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-ink">
              <p><strong className="font-semibold">App Version:</strong> SalinTinig v1.0.0 (Production Release)</p>
              <p><strong className="font-semibold">Department:</strong> Department of Education (DepEd)</p>
              <p><strong className="font-semibold">Purpose:</strong> Automated Phil-IRI oral & silent reading assessment management platform.</p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAboutModalOpen(false)}
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold text-cream hover:bg-blue-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help / FAQ Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-ink/10 pb-3.5 mb-3">
              <div className="flex items-center gap-2">
                <ChatText size={22} className="text-brand-blue" />
                <div>
                  <h3 className="text-lg font-bold text-ink">Teacher Help & FAQ</h3>
                  <p className="text-xs text-ink/50">Frequently Asked Questions & Teacher Guide for SalinTinig</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Teacher FAQ Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs text-ink mt-2 pr-1">
              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">What is SalinTinig?</p>
                <p className="text-ink/70 leading-relaxed">
                  SalinTinig is an automated Phil-IRI assessment and oral reading analysis platform designed for DepEd schools to monitor student reading proficiency levels in real time.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">How are student reading levels classified?</p>
                <p className="text-ink/70 leading-relaxed">
                  Reading levels (Independent, Instructional, Frustrational, Non-Reader) are automatically calculated based on Oral Reading Score (%) and Comprehension Score (%) following official DepEd Phil-IRI guidelines.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">How do I generate and export Phil-IRI Form 1 to 4?</p>
                <p className="text-ink/70 leading-relaxed">
                  Navigate to the <strong>Phil - IRI Records</strong> tab in the top navigation bar to access pre-formatted templates, enter assessment scores, or export official DepEd Form 1–4 summary records.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">How do class activities and oral reading practice work?</p>
                <p className="text-ink/70 leading-relaxed">
                  Go to <strong>Class Activities</strong> to create custom practice passages, assign reading tasks, and view real-time student recordings and submission progress.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">What notifications do I receive on my dashboard?</p>
                <p className="text-ink/70 leading-relaxed">
                  You will receive real-time alerts for student Phil-IRI oral reading assessment completions, class progress alerts, and school announcements.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">How do Faculty-in-Charge (FIC) grade-level permissions work?</p>
                <p className="text-ink/70 leading-relaxed">
                  If designated as Faculty-in-Charge for a grade level, you can view summary reading statistics, section performance, and faculty records across all sections in your assigned grade level.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                <p className="font-bold text-ink text-sm">Need additional support?</p>
                <p className="text-ink/70 leading-relaxed">
                  Contact your school administrator or reach out to DepEd IT support at <span className="font-semibold text-brand-blue">support.salintinig@deped.gov.ph</span>.
                </p>
              </div>
            </div>

            {/* Modal Fixed Footer */}
            <div className="shrink-0 pt-3 border-t border-ink/10 mt-3">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full rounded-full bg-brand-blue px-6 py-2.5 text-xs font-semibold text-cream hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                <Warning size={24} weight="bold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Deactivate Account</h3>
                <p className="text-xs text-ink/50">Are you sure you want to deactivate?</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-xs text-ink">
              <p className="text-ink/80">
                Deactivating your teacher account will pause your access to section masterlists and assessment forms until reactivated by your administrator.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="rounded-full bg-ink/10 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold text-cream hover:bg-red-700 cursor-pointer"
                >
                  Confirm Deactivation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastNotification
        message={toastMessage?.text}
        type={toastMessage?.type}
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}
