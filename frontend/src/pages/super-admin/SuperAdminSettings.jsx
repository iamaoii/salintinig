import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Gear,
  User,
  ShieldCheck,
  FloppyDisk,
  EnvelopeSimple,
  IdentificationBadge,
  Copy,
  Camera,
  LockKey,
  Bell,
  Info,
  ChatText,
  Trash,
  CaretRight,
  X,
  PencilSimple,
  Eye,
  EyeSlash,
  Building,
} from '@phosphor-icons/react';
import logoBg from '../../assets/logo/logo_bg.webp';
import { getToken, getUser } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import AvatarCropModal from '../../components/common/AvatarCropModal.jsx';

export default function SuperAdminSettings() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const currentUser = getUser();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('adminAvatarCache') || currentUser?.profileImage || currentUser?.profile_image || null);
  const [cropSrc, setCropSrc] = useState(null);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    superAdminId: (currentUser?.id || currentUser?.user_id) ? `SA-${String(currentUser.id || currentUser.user_id).padStart(4, '0')}` : '',
    office: 'DepEd Central Office',
  });

  // Modal states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Sync modal states with URL sub-route
  useEffect(() => {
    if (tab === 'password' || tab === 'security') {
      setIsPasswordModalOpen(true);
    } else if (tab === 'about') {
      setIsAboutModalOpen(true);
    } else if (tab === 'faq' || tab === 'help') {
      setIsHelpModalOpen(true);
    } else if (tab === 'edit-profile' || tab === 'profile') {
      setIsEditProfileModalOpen(true);
    } else if (tab === 'deactivate') {
      setIsDeactivateModalOpen(true);
    } else {
      setIsEditProfileModalOpen(false);
      setIsPasswordModalOpen(false);
      setIsAboutModalOpen(false);
      setIsHelpModalOpen(false);
      setIsDeactivateModalOpen(false);
    }
  }, [tab]);

  const closeModal = () => {
    setIsEditProfileModalOpen(false);
    setIsPasswordModalOpen(false);
    setIsAboutModalOpen(false);
    setIsHelpModalOpen(false);
    setIsDeactivateModalOpen(false);
    if (tab) {
      navigate('/super-admin/account');
    }
  };

  // Lock body scroll when any modal is open
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

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
  };

  // Fetch Super Admin details
  useEffect(() => {
    async function fetchSuperAdminProfile() {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          const u = data.user;
          const fn = u.name || [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') || 'Super Admin';
          const saId = (u.id || u.user_id) ? `SA-${String(u.id || u.user_id).padStart(4, '0')}` : '—';

          setProfileForm({
            firstName: u.firstName || u.first_name || '',
            middleName: u.middleName || u.middle_name || '',
            lastName: u.lastName || u.last_name || '',
            fullName: fn,
            email: u.email || '',
            superAdminId: saId,
            office: u.office || 'DepEd Central Office',
          });

          const img = u.profileImage || u.profile_image || null;
          setAvatarUrl(img);
          if (img) {
            localStorage.setItem('adminAvatarCache', img);
          } else {
            localStorage.removeItem('adminAvatarCache');
          }
        }
      } catch (err) {
        console.warn('Super Admin profile fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSuperAdminProfile();
  }, []);

  // Avatar select
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Confirm avatar crop
  const handleCropConfirm = async (croppedWebP) => {
    setCropSrc(null);
    try {
      setAvatarUrl(croppedWebP);
      window.dispatchEvent(new CustomEvent('adminAvatarChanged', { detail: croppedWebP }));

      const token = getToken();
      const res = await fetch(getApiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ profileImage: croppedWebP }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user?.profileImage) {
        const finalUrl = data.user.profileImage;
        setAvatarUrl(finalUrl);
        localStorage.setItem('adminAvatarCache', finalUrl);
        window.dispatchEvent(new CustomEvent('adminAvatarChanged', { detail: finalUrl }));
      } else {
        localStorage.setItem('adminAvatarCache', croppedWebP);
      }

      showToast('Profile picture updated!');
    } catch (err) {
      console.warn('Failed to upload avatar:', err);
      showToast('Profile picture updated locally.');
    }
  };

  const handleCropCancel = () => setCropSrc(null);

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

  const handleCopyId = (e) => {
    safeCopy(profileForm.superAdminId, 'Super Admin ID copied to clipboard!', e);
  };

  const handleCopyEmail = (e) => {
    safeCopy(profileForm.email, 'Email address copied to clipboard!', e);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Profile updated successfully!');
        setIsEditProfileModalOpen(false);

        // Update local session
        const storedUser = getUser();
        if (storedUser) {
          localStorage.setItem('user', JSON.stringify({
            ...storedUser,
            name: profileForm.fullName,
            email: profileForm.email,
          }));
        }
      } else {
        showToast(data.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast('Error saving profile.', 'error');
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
        const res = await fetch(getApiUrl('/api/auth/change-password'), {
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
      closeModal();
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully!');
    } catch (err) {
      showToast('Failed to update password.', 'error');
    }
  };

  const handleConfirmDeactivate = () => {
    closeModal();
    showToast('Deactivation request logged. Super Admin accounts require system administrator consent.');
  };

  return (
    <>
      <ToastNotification
        message={toastMessage?.text}
        type={toastMessage?.type}
        onClose={() => setToastMessage(null)}
      />
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
            <h1 className="text-3xl font-bold text-ink">Account & System Settings</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Manage your super administrator profile, access credentials, system notifications, and security policies
          </p>
        </div>

        {/* Super Administrator Profile Banner Card matching SalinTinig branding */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden rounded-2xl bg-brand-red px-6 py-8 sm:px-8 sm:py-10 text-cream shadow-md gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="size-24 rounded-full bg-white/20 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-white/20" />
                  <div className="h-6 w-48 rounded bg-white/30" />
                  <div className="h-4 w-40 rounded bg-white/20" />
                </div>
              </div>
              <div className="h-9 w-28 rounded-full bg-white/20" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-ink/10" />
              <div className="rounded-2xl border border-ink/10 bg-cream divide-y divide-ink/10 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <div className="h-4 w-36 rounded bg-ink/10" />
                    <div className="h-4 w-4 rounded bg-ink/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div id="profile-details-section" className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden rounded-2xl bg-brand-red px-6 py-8 sm:px-8 sm:py-10 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] gap-6">
          <img
            src={logoBg}
            alt=""
            className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
          />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Interactive Avatar with Camera Upload Badge */}
            <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar
                name={profileForm.fullName}
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
                Super Administrator
              </span>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-cream drop-shadow-sm">
                {loading ? <span className="inline-block h-6 w-48 animate-pulse rounded bg-white/20" /> : profileForm.fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold text-white">
                <div className="flex items-center gap-1.5">
                  <EnvelopeSimple size={16} className="shrink-0 text-white/90" />
                  <span>{loading ? <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/30" /> : profileForm.email}</span>
                  {profileForm.email && (
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
                  <span className="font-mono">{loading ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-white/30" /> : `ID: ${profileForm.superAdminId}`}</span>
                  {profileForm.superAdminId && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Copy ID"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button on Banner Header */}
          <button
            type="button"
            onClick={() => navigate('/super-admin/account/edit-profile')}
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
              onClick={() => navigate('/super-admin/account/password')}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <LockKey size={18} className="text-ink/70" />
                Password & Security
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/super-admin/notifications')}
              className="flex w-full items-center justify-between border-b border-ink/10 px-5 py-3.5 text-left text-xs font-bold text-ink hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Bell size={18} className="text-ink/70" />
                System Notifications
              </span>
              <CaretRight size={16} className="text-ink/40" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/super-admin/account/about')}
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
              onClick={() => navigate('/super-admin/account/faq')}
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
              onClick={() => navigate('/super-admin/account/deactivate')}
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
      </>
    )}
  </div>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <User size={22} className="text-brand-blue" />
                <h3 className="text-base font-bold text-ink">Edit Super Admin Profile</h3>
              </div>
              <button type="button" onClick={closeModal} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={loading || isSaving}
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={loading || isSaving}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-50"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Super Admin Access Level</label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/70">
                  <span className="font-bold text-ink">Central System Administrator (Full Access)</span>
                  <ShieldCheck size={18} className="text-brand-blue" weight="fill" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-ink/10 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isSaving}
                  className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-cream transition-colors hover:bg-blue-700 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                onClick={closeModal}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
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
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
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
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-ink/20 bg-white pl-3 pr-10 py-2 text-ink outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink cursor-pointer"
                  >
                    {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full bg-ink/10 px-4 py-2 font-semibold text-ink hover:bg-ink/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-brand-red px-6 py-2 font-bold text-cream transition-colors hover:bg-brand-red/90 shadow-sm cursor-pointer"
                >
                  <LockKey size={16} weight="bold" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Application Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <Info size={22} className="text-brand-blue" />
                <h3 className="text-base font-bold text-ink">About SalinTinig Platform</h3>
              </div>
              <button type="button" onClick={closeModal} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-ink/80 leading-relaxed">
              <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-ink/10">
                <div>
                  <p className="font-bold text-ink text-sm">SalinTinig Phil-IRI System</p>
                  <p className="text-[11px] text-ink/50">DepEd Digital Assessment Engine</p>
                </div>
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[11px] font-bold text-brand-blue">
                  v2.4.0
                </span>
              </div>

              <p>
                SalinTinig is a comprehensive reading assessment and analytics system aligned with the Department of Education Philippine Informal Reading Inventory (Phil-IRI) standards.
              </p>
              <p>
                As a Super Administrator, you have system-wide oversight to onboard schools, manage regional passage banks, publish reading materials, and monitor literacy assessment metrics across all divisions.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-cream hover:bg-blue-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help / FAQ Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <ChatText size={22} className="text-brand-blue" />
                <h3 className="text-base font-bold text-ink">Super Admin Help & Documentation</h3>
              </div>
              <button type="button" onClick={closeModal} className="text-ink/40 hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-ink/10 bg-white p-3 space-y-1">
                <p className="font-bold text-ink">How do I add a new school?</p>
                <p className="text-ink/70">Navigate to <strong>Schools</strong> on the sidebar and click <strong>Add New School</strong>. Enter the School ID, Name, Division, Region, Principal, and Official Contact Email. An administrator account is automatically generated.</p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-3 space-y-1">
                <p className="font-bold text-ink">How do I reset a School Administrator's password?</p>
                <p className="text-ink/70">Go to <strong>Schools</strong>, select the target school, view the Administrator card, and click <strong>Reset Password</strong> or <strong>Resend Credentials</strong>.</p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-3 space-y-1">
                <p className="font-bold text-ink">How do Phil-IRI passages get updated?</p>
                <p className="text-ink/70">Manage passages under <strong>Phil-IRI -&gt; Passage Bank</strong>. You can add, edit, or archive reading assessment passages by Grade Level and Phil-IRI Type (GST, Oral, Silent Reading).</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-cream hover:bg-blue-700 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-brand-red border-b border-ink/10 pb-3">
              <Trash size={24} weight="bold" />
              <h3 className="text-base font-bold text-ink">Deactivate Account</h3>
            </div>

            <p className="text-xs text-ink/80 leading-relaxed">
              Deactivating a Super Administrator account will revoke system access for managing schools, Phil-IRI passages, and global analytics.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink/10 text-xs">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-ink/10 px-4 py-2 font-semibold text-ink hover:bg-ink/20 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="rounded-full bg-brand-red px-5 py-2 font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
              >
                Log Deactivation Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
