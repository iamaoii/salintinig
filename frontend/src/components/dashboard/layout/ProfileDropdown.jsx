import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Gear,
  Question,
  SignOut,
  CaretDown,
  X,
} from '@phosphor-icons/react';
import Avatar from '../student/Avatar.jsx';
import { getUser, getUserRole, logout } from '../../../lib/auth.js';

export default function ProfileDropdown({ customName, role: propRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = getUser();
  const currentRole = propRole || getUserRole() || 'teacher';
  const name = customName || user?.name || (currentRole === 'admin' ? 'Antoinette Jadaone' : 'Ted Mosby');
  const email = user?.email || (currentRole === 'admin' ? 'antoinette.j@deped.gov.ph' : 'mosbyTed@edu.org.ph');

  const profilePath = currentRole === 'admin' ? '/admin/settings' : '/dashboard/account';
  const settingsPath = currentRole === 'admin' ? '/admin/settings' : '/dashboard/account';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsHelpOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when help modal is open (using position:fixed to avoid breaking sticky navbar)
  useEffect(() => {
    if (isHelpOpen) {
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
  }, [isHelpOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate(profilePath);
  };

  const handleAccountSettingsClick = () => {
    setIsOpen(false);
    navigate(settingsPath);
  };

  const handleHelpClick = () => {
    setIsOpen(false);
    setIsHelpOpen(true);
  };

  const adminAvatar = currentRole === 'admin' ? localStorage.getItem('admin_avatar_url') : undefined;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger matching picture 3 (Avatar + Caret Down) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full p-1 transition-all hover:bg-ink/5 focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar name={name} src={adminAvatar} size={36} />
        <CaretDown
          size={14}
          weight="bold"
          className={`text-ink/70 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Dropdown Menu matching reference design */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-ink/10 bg-white py-2 shadow-[0px_10px_30px_rgba(0,0,0,0.08)] z-50">
          {/* User Info Header */}
          <div className="border-b border-ink/10 px-4 pb-2.5 pt-1 mb-1">
            <p className="text-sm font-bold text-ink truncate">{name}</p>
            <p className="text-xs text-ink/50 truncate">{email}</p>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col text-sm font-medium text-ink">
            {currentRole !== 'admin' && (
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-ink transition-colors hover:bg-ink/5 cursor-pointer"
              >
                <User size={20} className="text-ink shrink-0" />
                <span>Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAccountSettingsClick}
              className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-ink transition-colors hover:bg-ink/5 cursor-pointer"
            >
              <Gear size={20} className="text-ink shrink-0" />
              <span>{currentRole === 'admin' ? 'Account Settings' : 'Account Settings'}</span>
            </button>

            <button
              type="button"
              onClick={handleHelpClick}
              className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-ink transition-colors hover:bg-ink/5 cursor-pointer"
            >
              <Question size={20} className="text-ink shrink-0" />
              <span>Help/FAQ</span>
            </button>

            <div className="my-1.5 border-t border-ink/10" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-ink transition-colors hover:bg-ink/5 cursor-pointer"
            >
              <SignOut size={20} className="text-ink shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Help / FAQ Modal — rendered via portal to escape dropdown stacking context */}
      {isHelpOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Question size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Help & FAQ</h3>
                  <p className="text-xs text-ink/50">Frequently Asked Questions for SalinTinig</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/10 hover:text-ink cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs text-ink">
              <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <h4 className="font-bold text-sm text-ink mb-1">What is SalinTinig?</h4>
                <p className="text-ink/70 leading-relaxed">
                  SalinTinig is an automated Phil-IRI assessment and oral reading analysis platform designed for DepEd schools to monitor student reading proficiency levels.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <h4 className="font-bold text-sm text-ink mb-1">How are reading levels classified?</h4>
                <p className="text-ink/70 leading-relaxed">
                  Reading levels (Independent, Instructional, Frustrational) are automatically calculated based on Oral Reading Score (%) and Comprehension Score (%) following official Phil-IRI guidelines.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <h4 className="font-bold text-sm text-ink mb-1">How do I generate Phil-IRI Form 1 to 4?</h4>
                <p className="text-ink/70 leading-relaxed">
                  Navigate to the Phil-IRI Records tab in the navigation bar to access pre-formatted templates, enter scores, or export official records.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
                <h4 className="font-bold text-sm text-ink mb-1">Need additional support?</h4>
                <p className="text-ink/70 leading-relaxed">
                  Contact your school administrator or reach out to DepEd IT support at <span className="font-semibold text-brand-blue">support.salintinig@deped.gov.ph</span>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="rounded-full bg-brand-blue px-6 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-blue-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
