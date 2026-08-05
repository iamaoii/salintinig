import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  House,
  Student,
  ChalkboardTeacher,
  IdentificationCard,
  Bell,
  DotsThree,
  UserCheck,
  ArrowRight,
} from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';
import logoBg from '../../assets/logo/logo_bg.webp';
import ProfileDropdown from '../../components/dashboard/layout/ProfileDropdown.jsx';
import { getUser } from '../../lib/auth.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: House },
  { to: '/admin/students', label: 'Student Records', icon: Student },
  { to: '/admin/teachers', label: 'Teacher Records', icon: ChalkboardTeacher },
  { to: '/admin/faculty-assignment', label: 'Sections & Faculty', icon: IdentificationCard },
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

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = localStorage.getItem('token');
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
          {/* Logo Branding */}
          <div className="flex shrink-0 items-center gap-2.5">
            <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
                SalinTinig
              </span>
              <span className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-brand-red">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation Tabs with Underline Indicator */}
          <nav className="flex h-full min-w-0 items-center justify-center gap-2 sm:gap-4 md:gap-6">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex h-full shrink-0 items-center gap-2 px-2.5 text-sm font-semibold transition-colors sm:px-3 ${
                    isActive ? 'text-brand-red' : 'text-ink/70 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} weight="regular" className="shrink-0" />
                    <span className="hidden md:inline">{label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand-red" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Account Profile Dropdown */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <ProfileDropdown role="admin" customName={currentUser?.name} />
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="mx-auto max-w-[1480px] px-6 py-8 sm:px-8 lg:px-10">
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
