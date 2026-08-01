import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Building,
  LockKey,
  Copy,
  CheckCircle,
  Eye,
  EyeSlash,
  Gear,
  SignOut,
  IdentificationCard,
  EnvelopeSimple,
  Phone,
  CalendarBlank,
  House,
} from '@phosphor-icons/react';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import { getUser, logout } from '../../lib/auth.js';

const CURRENT_PASSWORD = 'AdminPassword2026!';

export default function AdminProfile() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText('EMP-2024-000');
    setCopiedId(true);
    showToast('Employee ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(currentUser?.email || 'antoinette.j@deped.gov.ph');
    setCopiedEmail(true);
    showToast('Email address copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#00a652] px-4 py-3 text-xs font-semibold text-white shadow-lg animate-in fade-in">
          <CheckCircle size={18} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="group inline-flex items-center gap-2.5 text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
        >
          <BackButton to="/admin/dashboard" size={20} />
          <span className="group-hover:underline">Back to Admin Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors cursor-pointer shadow-sm"
        >
          <Gear size={16} />
          <span>School Settings</span>
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 sm:p-8 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 sm:w-64">
            <Avatar
              name={currentUser?.name || 'Antoinette Jadaone'}
              size={140}
              className="text-4xl font-bold shadow-md"
            />
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold text-brand-red border border-brand-red/20">
                <ShieldCheck size={14} weight="bold" />
                <span>System Administrator</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/account/avatar')}
              className="mt-1 rounded-full bg-ink/5 px-4 py-1.5 text-xs font-semibold text-ink/80 hover:bg-ink/10 transition-colors cursor-pointer"
            >
              Edit Avatar
            </button>
          </div>

          {/* User Details Overview */}
          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink/50 font-medium">Administrator Name</p>
              <p className="text-lg font-bold text-ink">
                {currentUser?.name || 'Antoinette Jadaone'}, Ph.D.
              </p>
            </div>

            <div>
              <p className="text-xs text-ink/50 font-medium">Designation / Title</p>
              <p className="text-lg font-bold text-ink">Principal IV</p>
            </div>

            <div>
              <p className="text-xs text-ink/50 font-medium">Employee ID</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-lg font-bold text-ink font-mono">EMP-2024-000</p>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-ink/40 hover:text-ink transition-colors cursor-pointer"
                  title="Copy Employee ID"
                >
                  <Copy size={18} />
                </button>
                {copiedId && <span className="text-xs font-bold text-[#00a652]">Copied!</span>}
              </div>
            </div>

            <div>
              <p className="text-xs text-ink/50 font-medium">DepEd Email</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-base font-bold text-ink truncate">
                  {currentUser?.email || 'antoinette.j@deped.gov.ph'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-ink/40 hover:text-ink transition-colors cursor-pointer shrink-0"
                  title="Copy Email"
                >
                  <Copy size={18} />
                </button>
                {copiedEmail && <span className="text-xs font-bold text-[#00a652]">Copied!</span>}
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-ink/70">
                <Building size={16} className="text-brand-blue" />
                <span>SalinTinig Elementary School • School ID: <strong>109283</strong></span>
              </div>
              <div className="flex items-center gap-2 text-ink/70">
                <CalendarBlank size={16} className="text-brand-red" />
                <span>Administrator since: <strong>Aug 2021</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Administrative Profile Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
          <IdentificationCard size={22} className="text-brand-blue" />
          <h3 className="text-base font-bold text-ink">Administrative & Institutional Credentials</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-ink/5 bg-white p-4 space-y-1">
            <p className="text-ink/50 font-semibold">Division Office</p>
            <p className="text-sm font-bold text-ink">Division of City Schools</p>
          </div>

          <div className="rounded-xl border border-ink/5 bg-white p-4 space-y-1">
            <p className="text-ink/50 font-semibold">Region</p>
            <p className="text-sm font-bold text-ink">Region IV-A (CALABARZON)</p>
          </div>

          <div className="rounded-xl border border-ink/5 bg-white p-4 space-y-1">
            <p className="text-ink/50 font-semibold">Office Contact Number</p>
            <p className="text-sm font-bold text-ink">+63 (02) 8920-4100 ext. 102</p>
          </div>

          <div className="rounded-xl border border-ink/5 bg-white p-4 space-y-1">
            <p className="text-ink/50 font-semibold">System Privileges</p>
            <p className="text-sm font-bold text-[#00a652] flex items-center gap-1.5">
              <CheckCircle size={16} weight="fill" />
              <span>Full Administrative Access</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Security & Password Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
          <LockKey size={22} className="text-brand-red" />
          <h3 className="text-base font-bold text-ink">Account Security & Credentials</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs bg-white p-4 rounded-xl border border-ink/5">
          <div className="space-y-1">
            <p className="text-ink/50 font-semibold">Current System Password</p>
            <div className="flex items-center gap-3">
              <p className="text-base font-bold text-ink font-mono">
                {showPassword ? CURRENT_PASSWORD : '••••••••••••'}
              </p>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Password change request initiated.')}
            className="rounded-full bg-ink/5 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/10 transition-colors cursor-pointer self-start sm:self-center"
          >
            Change Password
          </button>
        </div>

        <div className="flex items-center justify-between text-xs px-2 pt-1">
          <span className="text-ink/60">Two-Factor Authentication (2FA)</span>
          <span className="rounded-full bg-[#00a652]/10 px-3 py-1 font-bold text-[#00a652] border border-[#00a652]/20">
            Enabled
          </span>
        </div>
      </div>

      {/* Log Out Section */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-blue-700 cursor-pointer shadow-sm"
        >
          <SignOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
