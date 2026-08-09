import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  Student,
  ChalkboardTeacher,
  IdentificationCard,
  Bell,
  DotsThree,
  UserCheck,
  ArrowRight,
  ChartBar,
  List,
  X,
} from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';
import logoBg from '../../assets/logo/logo_bg.webp';
import ProfileDropdown from '../../components/dashboard/layout/ProfileDropdown.jsx';
import { getUser, getToken } from '../../lib/auth.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: House },
  { to: '/admin/students', label: 'Student Records', icon: Student },
  { to: '/admin/teachers', label: 'Teacher Records', icon: ChalkboardTeacher },
  { to: '/admin/faculty-assignment', label: 'Sections & Faculty', icon: IdentificationCard },
  { to: '/admin/reports', label: 'Phil-IRI Reports', icon: ChartBar },
];

const adminNotifications = [
  {
    id: 1,
    title: 'Adrian Completed Oral Reading Assessment',
    time: '3 minutes ago',
    description: 'Finished reading the passage aloud and answered the comprehension questions successfully.',
  },
  {
    id: 2,
    title: 'Janna Completed Oral Reading Assessment',
    time: '4 minutes ago',
    description: 'Finished reading the passage aloud and answered the comprehension questions successfully.',
  },
  {
    id: 3,
    title: 'Batch Import Completed for Grade 4',
    time: '15 minutes ago',
    description: '52 new student accounts created and credentials dispatched to registered parent emails.',
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const location = useLocation();
  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  const [adminInfo, setAdminInfo] = useState(null);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = getToken();
        const res = await fetch('http://localhost:5000/api/admin/info', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAdminInfo(data);
        }
      } catch (err) {
        console.warn('Failed to fetch admin info:', err);
      }
    };
    fetchAdminInfo();

    const handleSYChange = () => fetchAdminInfo();
    window.addEventListener('schoolYearChanged', handleSYChange);
    return () => window.removeEventListener('schoolYearChanged', handleSYChange);
  }, []);

  return (
    <div className="min-h-screen w-full bg-cream text-ink font-sans">
      {/* Top Header Navigation matching Teacher side TopNav */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1480px] items-center justify-between px-6 sm:px-8 lg:px-10">
          {/* Clickable Logo Branding */}
          <Link to="/admin/dashboard" className="flex shrink-0 items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer">
            <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
                SalinTinig
              </span>
              <span className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-brand-red">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs (Visible on lg screens 1024px+) */}
          <nav className="hidden lg:flex h-full items-center justify-center gap-4 lg:gap-6">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex h-full shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
                    isActive ? 'text-brand-red' : 'text-ink/70 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} weight="regular" className="shrink-0" />
                    <span>{label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand-red" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Account Profile & Notification Popover & Mobile Menu Button */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {/* Notification Bell Button */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="relative flex size-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} weight="bold" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-red" />
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifPopover && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_8px_24px_rgba(26,24,22,0.12)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-ink">Notifications</h4>
                      <span className="rounded-full bg-brand-red/10 px-2 py-0.2 text-[9px] font-bold text-brand-red">
                        {adminNotifications.length} New
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifPopover(false);
                        navigate('/admin/notifications');
                      }}
                      className="text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-ink/10 max-h-72 overflow-y-auto">
                    {adminNotifications.map((notif) => (
                      <div key={notif.id} className="py-2.5 px-1 hover:bg-ink/[0.02] rounded-xl transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-ink truncate">{notif.title}</h5>
                          <span className="text-[9px] text-ink/40 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-ink/60 mt-0.5 leading-snug line-clamp-2">{notif.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ProfileDropdown role="admin" customName={currentUser?.name} />

            {/* Mobile / Tablet Navigation Toggle Button (Visible on screens < 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden size-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Navigation Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-ink/10 bg-cream p-4 space-y-1.5 shadow-lg animate-fade-in">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-brand-red text-cream shadow-xs'
                      : 'text-ink/80 hover:bg-ink/5 hover:text-ink'
                  }`
                }
              >
                <Icon size={18} weight="regular" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Layout Container */}
      <main className="mx-auto max-w-[1480px] px-6 pt-6 pb-20 sm:px-8 sm:pt-8 sm:pb-28 lg:px-10 lg:pb-36">
        {isDashboard ? (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Side Header Banner + Notification Cards (Dashboard Only) */}
            <aside className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
              {/* Red School Header Banner Card */}
              <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
                <img
                  src={logoBg}
                  alt=""
                  className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
                />

                <div className="relative z-10 flex flex-col items-start gap-2 max-w-[85%] w-full">
                  <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-cream uppercase tracking-wider">
                    Welcome, Administrator!
                  </span>
                  {!adminInfo ? (
                    <div className="space-y-2 w-full py-1">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-white/20" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-white/20" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/20" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl sm:text-2xl font-bold leading-tight text-cream drop-shadow-sm">
                        {adminInfo.schoolInfo?.schoolName || currentUser?.name || ''}
                      </h2>
                      <div className="flex flex-col gap-0.5 text-xs font-medium leading-tight text-cream/90">
                        <p>School ID: {adminInfo.schoolInfo?.schoolId || currentUser?.schoolId || ''}</p>
                        <p>
                          {adminInfo.schoolInfo?.division || ''} • S.Y. {adminInfo.activeSchoolYear || ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="relative z-10 text-cream/90 transition-colors hover:text-cream cursor-pointer"
                  aria-label="Admin options"
                >
                  <DotsThree size={32} weight="bold" />
                </button>
              </div>

              {/* Notification Card */}
              <div className="rounded-2xl border border-ink/5 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={20} className="text-brand-red" />
                    <h3 className="font-semibold text-ink">Notification</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/notifications')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-ink/10">
                  {adminNotifications.map((n) => (
                    <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-1 text-xs text-ink/40">{n.time}</p>
                      <p className="mt-1 text-sm text-ink/60">{n.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Dashboard Content */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        ) : (
          /* Full Width Content for Other Admin Pages */
          <div className="w-full">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
