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
  GraduationCap,
} from '@phosphor-icons/react';
import Avatar from '../student/Avatar.jsx';
import { getUser, getUserRole, getToken, logout } from '../../../lib/auth.js';

export default function ProfileDropdown({ customName, role: propRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = getUser();
  const currentRole = propRole || getUserRole() || 'teacher';

  // FIC state (teacher-only)
  const [isFic, setIsFic] = useState(false);
  const [ficGradeLevel, setFicGradeLevel] = useState(null);
  const [isGradeLevelMode, setIsGradeLevelMode] = useState(false);
  const [profileName, setProfileName] = useState(() => {
    if (customName) return customName;
    if (user?.name) return user.name;
    if (user?.displayName && user.displayName !== 'Teacher Account') return user.displayName;
    if (user?.firstName) return `${user.firstName} ${user.lastName || ''}`.trim();
    return currentRole === 'admin' ? 'Antoinette Jadaone' : 'Teacher';
  });

  const [profileEmail, setProfileEmail] = useState(() => user?.email || '');

  useEffect(() => {
    async function fetchMeInfo() {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          const freshUser = data.user;
          const freshName = freshUser.name || `${freshUser.firstName || ''} ${freshUser.lastName || ''}`.trim();
          if (freshName && freshName !== 'Teacher Account') {
            setProfileName(freshName);
          }
          if (freshUser.email) {
            setProfileEmail(freshUser.email);
          }
          // FIC check
          if (currentRole === 'teacher') {
            setIsFic(freshUser.isFacultyInCharge === true);
            setFicGradeLevel(freshUser.ficGradeLevel || null);
          }
          if (freshUser.profileImage || freshUser.profile_image) {
            const img = freshUser.profileImage || freshUser.profile_image;
            setAvatarUrl(img);
            localStorage.setItem('teacherAvatarCache', img);
          }
          const existingUser = getUser() || {};
          const updatedUser = { ...existingUser, ...freshUser, name: freshName || existingUser.name };
          localStorage.setItem('salintinig_user', JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.warn('ProfileDropdown me fetch notice:', e);
      }
    }
    fetchMeInfo();
  }, [currentRole]);

  const name = customName || profileName;
  const email = profileEmail || user?.email || '';

  const profilePath = currentRole === 'admin' ? '/admin/settings' : '/teacher/account';
  const settingsPath = currentRole === 'admin' ? '/admin/settings' : '/teacher/account';

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

  const handleManageGradeLevel = () => {
    setIsOpen(false);
    navigate('/teacher/grade-level');
  };

  const handleExitGradeLevel = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('exitGradeLevelMode'));
    setIsGradeLevelMode(false);
  };

  // Listen for mode changes from context
  useEffect(() => {
    const onEnter = () => setIsGradeLevelMode(true);
    const onExit = () => setIsGradeLevelMode(false);
    window.addEventListener('enterGradeLevelMode', onEnter);
    window.addEventListener('exitGradeLevelMode', onExit);
    return () => {
      window.removeEventListener('enterGradeLevelMode', onEnter);
      window.removeEventListener('exitGradeLevelMode', onExit);
    };
  }, []);

  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (currentRole === 'admin') {
      return localStorage.getItem('adminAvatarCache') || null;
    }
    return (
      localStorage.getItem('teacherAvatarCache') ||
      user?.profileImage ||
      user?.profile_image ||
      null
    );
  });

  useEffect(() => {
    if (currentRole === 'admin') {
      const fetchAdminAvatar = async () => {
        try {
          const token = getToken();
          const res = await fetch('http://localhost:5000/api/admin/info', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (res.ok && data.success && data.profileImage) {
            setAvatarUrl(data.profileImage);
            localStorage.setItem('adminAvatarCache', data.profileImage);
          } else {
            localStorage.removeItem('adminAvatarCache');
          }
        } catch (err) {
          console.warn('Failed to fetch admin avatar:', err);
        }
      };
      fetchAdminAvatar();
    }

    const handleAvatarUpdate = (e) => {
      if (e?.detail) {
        setAvatarUrl(e.detail);
        if (currentRole === 'admin') {
          localStorage.setItem('adminAvatarCache', e.detail);
        } else {
          localStorage.setItem('teacherAvatarCache', e.detail);
          const existingUser = getUser() || {};
          localStorage.setItem(
            'salintinig_user',
            JSON.stringify({
              ...existingUser,
              profileImage: e.detail,
              profile_image: e.detail,
            })
          );
        }
      }
    };

    window.addEventListener('adminAvatarChanged', handleAvatarUpdate);
    window.addEventListener('userAvatarChanged', handleAvatarUpdate);
    return () => {
      window.removeEventListener('adminAvatarChanged', handleAvatarUpdate);
      window.removeEventListener('userAvatarChanged', handleAvatarUpdate);
    };
  }, [currentRole]);

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
        <Avatar name={name} src={avatarUrl} size={36} />
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

            {/* FIC: Manage Grade Level — only for Faculty In Charge teachers */}
            {currentRole === 'teacher' && isFic && ficGradeLevel && (
              <>
                <button
                  type="button"
                  onClick={isGradeLevelMode ? handleExitGradeLevel : handleManageGradeLevel}
                  className={`flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-xs font-bold transition-colors cursor-pointer ${
                    isGradeLevelMode
                      ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15'
                      : 'text-ink hover:bg-ink/5'
                  }`}
                >
                  <GraduationCap
                    size={20}
                    className={isGradeLevelMode ? 'text-brand-blue shrink-0' : 'text-ink shrink-0'}
                    weight={isGradeLevelMode ? 'fill' : 'regular'}
                  />
                  <div className="flex flex-col items-start">
                    <span>{isGradeLevelMode ? 'Exit Grade Level Mode' : `Manage ${ficGradeLevel}`}</span>
                    {!isGradeLevelMode && (
                      <span className="text-[10px] font-normal text-ink/50">Faculty In Charge</span>
                    )}
                  </div>
                </button>
                <div className="my-1 border-t border-ink/10" />
              </>
            )}

            <button
              type="button"
              onClick={handleAccountSettingsClick}
              className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left text-ink transition-colors hover:bg-ink/5 cursor-pointer"
            >
              <Gear size={20} className="text-ink shrink-0" />
              <span>Account Settings</span>
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
