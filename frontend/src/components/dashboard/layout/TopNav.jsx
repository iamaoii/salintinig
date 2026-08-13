import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { House, PresentationChart, Article, FlagPennant, Bell, List, X, CaretRight } from '@phosphor-icons/react';
import logo from '../../../assets/logo/logo.webp';
import ProfileDropdown from './ProfileDropdown.jsx';
import { getToken } from '../../../lib/auth.js';

const NAV_ITEMS = [
  { to: '/teacher/overview', label: 'Overview', icon: House },
  { to: '/teacher/student-dashboard', label: 'Student Dashboard', icon: PresentationChart },
  { to: '/teacher/phil-iri-records', label: 'Phil - IRI Records', icon: Article },
  { to: '/teacher/class-activities', label: 'Class Activities', icon: FlagPennant },
];

export default function TopNav() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Teacher TopNav notifications fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNotifUpdate = () => fetchNotifications();
    window.addEventListener('notificationsUpdated', handleNotifUpdate);

    // Silent background poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotifUpdate);
      clearInterval(interval);
    };
  }, []);

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
        {/* Clickable Logo Branding */}
        <Link to="/teacher/overview" className="flex shrink-0 items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer">
          <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
            SalinTinig
          </span>
        </Link>

        {/* Desktop Navigation Tabs (Visible on lg screens 1024px+) */}
        <nav className="hidden lg:flex h-full items-center justify-center gap-4 lg:gap-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex h-full shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-brand-red'
                    : 'text-ink/70 hover:text-ink'
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

        {/* User Profile & Notification Bell & Mobile Menu Button */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="relative flex size-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={20} weight="bold" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-red animate-pulse" />}
            </button>

            {showNotifPopover && (
              <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_8px_24px_rgba(26,24,22,0.12)] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                  <h4 className="text-sm font-bold text-ink">Notifications</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifPopover(false);
                      navigate('/teacher/notifications');
                    }}
                    className="text-xs font-bold text-brand-blue hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="divide-y divide-ink/10 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Bell size={36} weight="regular" className="text-ink/30 mb-2" />
                      <h4 className="text-sm font-bold text-ink tracking-tight">All caught up!</h4>
                      <p className="text-xs text-ink/50 mt-0.5">No unread notifications at the moment.</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.is_read) handleMarkAsRead(n.id);
                          setShowNotifPopover(false);
                          navigate('/teacher/notifications');
                        }}
                        className={`py-2.5 px-2 hover:bg-ink/[0.03] rounded-xl transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-brand-blue/[0.04]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            {!n.is_read && <span className="size-1.5 rounded-full bg-brand-red shrink-0" />}
                            <h5 className="text-xs font-bold text-ink truncate">{n.title}</h5>
                          </div>
                          <span className="text-[9px] text-ink/40 shrink-0">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink/60 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ProfileDropdown role="teacher" />

          {/* Mobile / Tablet Navigation Menu Toggle */}
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

      {/* Mobile / Tablet Navigation Dropdown Drawer (< 1024px) */}
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
  );
}
