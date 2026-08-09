import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { House, PresentationChart, Article, FlagPennant, Bell } from '@phosphor-icons/react';
import logo from '../../../assets/logo/logo.webp';
import ProfileDropdown from './ProfileDropdown.jsx';

const NAV_ITEMS = [
  { to: '/dashboard/overview', label: 'Overview', icon: House },
  { to: '/dashboard/student-dashboard', label: 'Student Dashboard', icon: PresentationChart },
  { to: '/dashboard/phil-iri-records', label: 'Phil - IRI Records', icon: Article },
  { to: '/dashboard/class-activities', label: 'Class Activities', icon: FlagPennant },
];

const sampleNotifications = [
  { id: 1, title: 'New Assessment Result', time: '5m ago', desc: 'Adrian completed Phil-IRI Passage 2 assessment.' },
  { id: 2, title: 'Class Activity Due', time: '1h ago', desc: 'Oral Reading Practice deadline tomorrow at 5:00 PM.' },
];

export default function TopNav() {
  const navigate = useNavigate();
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1480px] items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Logo Branding */}
        <div className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
            SalinTinig
          </span>
        </div>

        {/* Navigation Tabs with Underline Indicator */}
        <nav className="flex h-full min-w-0 items-center justify-center gap-3 sm:gap-6 md:gap-8">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex h-full shrink-0 items-center gap-2 px-2.5 text-sm font-semibold transition-colors sm:px-3.5 ${
                  isActive
                    ? 'text-brand-red'
                    : 'text-ink/70 hover:text-ink'
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

        {/* User Profile & Notification Bell Dropdown */}
        <div className="flex shrink-0 items-center gap-5 sm:gap-6">
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

            {showNotifPopover && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_8px_24px_rgba(26,24,22,0.12)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                  <h4 className="text-xs font-bold text-ink">Notifications</h4>
                  <span className="rounded-full bg-brand-red/10 px-2 py-0.2 text-[9px] font-bold text-brand-red">
                    {sampleNotifications.length} New
                  </span>
                </div>
                <div className="divide-y divide-ink/10 max-h-60 overflow-y-auto">
                  {sampleNotifications.map((n) => (
                    <div key={n.id} className="py-2 px-1 text-xs">
                      <div className="flex justify-between font-bold text-ink">
                        <span>{n.title}</span>
                        <span className="text-[9px] text-ink/40">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-ink/60 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ProfileDropdown role="teacher" />
        </div>
      </div>
    </header>
  );
}
