import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LockKey,
  Bell,
  Info,
  ChatCenteredText,
  Trash,
  CaretRight,
  Copy,
  SignOut,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import Avatar from '../../components/dashboard/Avatar.jsx';
import { logout } from '../../lib/auth.js';

const SETTINGS_GROUPS = [
  [
    { icon: User, label: 'Profile details' },
    { icon: LockKey, label: 'Password' },
    { icon: Bell, label: 'Notifications' },
  ],
  [
    { icon: Info, label: 'About application' },
    { icon: ChatCenteredText, label: 'Help / FAQ' },
    { icon: Trash, label: 'Deactivate my account', danger: true },
  ],
];

const CURRENT_PASSWORD = 'Password123';

export default function AccountSettings() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('TF001');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="rounded-2xl border border-ink/5 bg-cream p-8 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:w-64">
            <Avatar name="Ted Mosby" size={160} className="text-5xl" />
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-ink">Ted Mosby</p>
              <Link
                to="/dashboard/account/avatar"
                className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/70 hover:bg-ink/10"
              >
                Edit Profile
              </Link>
            </div>
            <p className="-mt-2 text-sm text-ink/50">Teacher IV</p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink/50">Full name</p>
              <p className="text-lg font-semibold text-ink">Ted E. Mosby</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">Assigned Class</p>
              <p className="text-lg font-semibold text-ink">Grade 4 - Fyang</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">Teacher ID</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-ink">TF001</p>
                <button type="button" onClick={handleCopy} className="text-ink/40 hover:text-ink" aria-label="Copy Teacher ID">
                  <Copy size={18} />
                </button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-ink/50">Email</p>
              <p className="text-lg font-semibold text-ink">mosbyTed@edu.org.ph</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-ink/50">Current Password</p>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-ink">
                    {showPassword ? CURRENT_PASSWORD : '••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-ink/40 hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/70 hover:bg-ink/10"
                >
                  Change Password
                </button>
              </div>
            </div>
            <div className="flex items-end justify-end sm:col-span-2">
              <button
                type="button"
                className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
              >
                Switch to Department Head
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Other Settings</h2>
        <div className="flex flex-col gap-3">
          {SETTINGS_GROUPS.map((group, gi) => (
            <div key={gi} className="overflow-hidden rounded-xl border border-ink/5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
              {group.map(({ icon: Icon, label, danger }, i) => (
                <button
                  key={label}
                  type="button"
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-ink/5 ${
                    i !== group.length - 1 ? 'border-b border-ink/10' : ''
                  } ${danger ? 'text-brand-red' : 'text-ink'}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} />
                    {label}
                  </span>
                  <CaretRight size={16} className={danger ? 'text-brand-red' : 'text-ink/40'} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
        >
          <SignOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
