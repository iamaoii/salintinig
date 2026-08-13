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
  ChatText,
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

  const profilePath = currentRole === 'admin' ? '/admin/account' : '/teacher/account';
  const settingsPath = currentRole === 'admin' ? '/admin/account' : '/teacher/account';

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
      return (
        user?.profileImage ||
        user?.profile_image ||
        localStorage.getItem('adminAvatarCache') ||
        null
      );
    }
    return (
      user?.profileImage ||
      user?.profile_image ||
      localStorage.getItem('teacherAvatarCache') ||
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-ink/10 bg-cream p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-ink/10 pb-3.5 mb-3">
              <div className="flex items-center gap-2">
                <ChatText size={22} className="text-brand-blue" />
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {currentRole === 'admin' ? 'Administrator Help & FAQ' : 'Teacher Help & FAQ'}
                  </h3>
                  <p className="text-xs text-ink/50">
                    {currentRole === 'admin'
                      ? 'Frequently Asked Questions & Admin Management Guide'
                      : 'Frequently Asked Questions & Teacher Guide for SalinTinig'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Role-Specific FAQ Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs text-ink mt-2 pr-1">
              {currentRole === 'admin' ? (
                <>
                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I activate a new Academic School Year?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Click the <strong>Active S.Y.</strong> button in the top navigation bar, enter the school year format (e.g., 2027-2028), and click <strong>Activate S.Y.</strong>. All section counts, analytics, and student metrics update immediately across the portal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I approve teacher account activation requests?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Go to <strong>Overview</strong> or <strong>Account Requests</strong> in the admin sidebar. Review pending teacher account requests, click <strong>Approve</strong>, and automated login credentials will be generated and dispatched to the teacher via email.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I assign Faculty in Charge and Advisers?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Navigate to <strong>Faculty Assignment</strong> from the sidebar. Select grade-level lead faculty (Faculty-in-Charge) and section advisers, or unassign them by choosing "No Faculty in Charge".
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I batch import students or manage student profiles?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Go to <strong>Student Records</strong> or <strong>Overview</strong> and click <strong>Upload Student CSV</strong> to batch import learners into PostgreSQL. You can also view student profiles, edit sections, or toggle enrollment status.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I access Phil-IRI reading analytics and export reports?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Navigate to <strong>Phil-IRI Reports</strong> from the sidebar. You can monitor school-wide reading level distributions (Independent, Instructional, Frustration, Non-Reader) and export official DepEd Form 1 - 4 summary reports.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">What happens when I update School Profile settings?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Click <strong>Edit Profile</strong> in Admin Settings to open the School Institutional Profile modal. Updates save to PostgreSQL immediately and refresh the red welcome headers in real time.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">Where can I review system audit logs and notifications?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Click <strong>Notifications & Audit Logs</strong> in the top navbar or sidebar to inspect real-time system alerts, CSV import logs, teacher requests, and security audit records.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs space-y-1">
                    <p className="font-bold text-ink text-sm">How do I change my Admin password or security credentials?</p>
                    <p className="text-ink/70 leading-relaxed">
                      Under <strong>Other Settings</strong> in Admin Settings, click <strong>Change Password</strong>. Enter your current password and your new password to update your credentials securely.
                    </p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="shrink-0 pt-3 border-t border-ink/10 mt-3">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-full rounded-full bg-brand-blue px-6 py-2.5 text-xs font-semibold text-cream hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
