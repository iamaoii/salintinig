import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSmartNotificationPoll } from '../../hooks/useSmartNotificationPoll.js';
import {
  House,
  Buildings,
  BookOpen,
  BookBookmark,
  ChartBar,
  Bell,
  List,
  X,
  ArrowRight,
} from '@phosphor-icons/react';
import logo from '../../assets/logo/logo.webp';
import logoBg from '../../assets/logo/logo_bg.webp';
import ProfileDropdown from '../../components/dashboard/layout/ProfileDropdown.jsx';
import { getUser, getToken } from '../../lib/auth.js';

const NAV_ITEMS = [
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: House, exact: true },
  { to: '/super-admin/schools', label: 'Schools', icon: Buildings, group: 'schools' },
  { to: '/super-admin/phil-iri', label: 'Phil-IRI', icon: BookOpen, group: 'phil-iri' },
  { to: '/super-admin/stories', label: 'Stories', icon: BookBookmark },
  { to: '/super-admin/analytics', label: 'Analytics', icon: ChartBar },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const location = useLocation();
  const isDashboard = location.pathname === '/super-admin/dashboard' || location.pathname === '/super-admin';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(getApiUrl('/api/notifications'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newNotifs = data.notifications || [];
        const newUnread = data.unreadCount || 0;
        setNotifications((prev) => (JSON.stringify(prev) !== JSON.stringify(newNotifs) ? newNotifs : prev));
        setUnreadCount((prev) => (prev !== newUnread ? newUnread : prev));
      }
    } catch (err) {
      console.warn('SA: Failed to fetch notifications:', err.message);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useSmartNotificationPoll(fetchNotifications, 45000, [location.pathname]);

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const token = getToken();
      if (!token) return;
      await fetch(getApiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.warn('SA: Error marking notification as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      const token = getToken();
      if (!token) return;
      await fetch(getApiUrl('/api/notifications/read-all'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.warn('SA: Error marking all as read:', err.message);
    }
  };

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
    <div className="min-h-screen w-full bg-cream text-ink font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1480px] items-center justify-between px-6 sm:px-8 lg:px-10">
          {/* Logo Branding */}
          <Link to="/super-admin/dashboard" className="flex shrink-0 items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer">
            <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
                SalinTinig
              </span>
              <span className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-brand-red">
                Super Admin
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex h-full items-center justify-center gap-4 lg:gap-6">
            {NAV_ITEMS.map(({ to, label, icon: Icon, group, exact }) => {
              const groupActive = group ? location.pathname.startsWith(`/super-admin/${group}`) : false;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) => {
                    const active = groupActive || (exact ? isActive : false) || (!group && !exact && isActive);
                    return `relative flex h-full shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
                      active ? 'text-brand-red' : 'text-ink/70 hover:text-ink'
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const active = groupActive || (exact ? isActive : false) || (!group && !exact && isActive);
                    return (
                      <>
                        <Icon size={20} weight="regular" className="shrink-0" />
                        <span>{label}</span>
                        {active && (
                          <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand-red" />
                        )}
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </nav>

          {/* Right — Bell + Profile + Mobile Toggle */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="relative flex size-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} weight="bold" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-red animate-pulse" />
                )}
              </button>

              {showNotifPopover && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_8px_24px_rgba(26,24,22,0.12)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-ink">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-brand-red/10 px-2 py-0.2 text-[9px] font-bold text-brand-red">
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="font-semibold text-ink/60 hover:text-ink hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setShowNotifPopover(false); navigate('/super-admin/notifications'); }}
                        className="font-semibold text-brand-blue hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-ink/10 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Bell size={32} weight="regular" className="text-ink/30 mb-2" />
                        <p className="text-xs font-bold text-ink">All caught up!</p>
                        <p className="text-[11px] text-ink/50 mt-0.5">No unread notifications.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                          className={`py-2.5 px-2 hover:bg-ink/[0.03] rounded-xl transition-colors cursor-pointer ${
                            !notif.is_read ? 'bg-brand-blue/[0.04]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              {!notif.is_read && <span className="size-1.5 rounded-full bg-brand-red shrink-0" />}
                              <h5 className="text-xs font-bold text-ink truncate">{notif.title}</h5>
                            </div>
                            <span className="text-[9px] text-ink/40 shrink-0">
                              {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink/60 mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <ProfileDropdown role="super_admin" customName={currentUser?.name} />

            {/* Mobile Toggle */}
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

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-ink/10 bg-cream p-4 space-y-1.5 shadow-lg animate-fade-in">
            {NAV_ITEMS.map(({ to, label, icon: Icon, group }) => (
              <div key={to}>
                <NavLink
                  to={to}
                  onClick={() => !group && setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive || (group && location.pathname.startsWith(`/super-admin/${group}`))
                        ? 'bg-brand-red text-cream shadow-xs'
                        : 'text-ink/80 hover:bg-ink/5 hover:text-ink'
                    }`
                  }
                >
                  <Icon size={18} weight="regular" />
                  <span>{label}</span>
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main Layout */}
      <main className="mx-auto max-w-[1480px] px-6 pt-6 pb-20 sm:px-8 sm:pt-8 sm:pb-28 lg:px-10 lg:pb-36">
        {isDashboard ? (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left aside — System overview banner + Notifications */}
            <aside className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
              {/* System Banner */}
              <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
                <img
                  src={logoBg}
                  alt=""
                  className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
                />
                <div className="relative z-10 flex flex-col items-start gap-2 max-w-[90%] w-full">
                  <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-cream uppercase tracking-wider">
                    System Administrator
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight text-cream drop-shadow-sm">
                    {currentUser?.name || 'Super Admin'}
                  </h2>
                  <div className="flex flex-col gap-0.5 text-xs font-medium leading-tight text-cream/90">
                    <p>{currentUser?.email || ''}</p>
                    <p>Platform-wide management access</p>
                  </div>
                </div>
              </div>

              {/* Notifications Card */}
              <div className="rounded-2xl border border-ink/5 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={20} className="text-brand-red" />
                    <h3 className="font-semibold text-ink">Notification</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/super-admin/notifications')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-ink/10">
                  {loadingNotifs ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-ink/50">
                      <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold text-ink/70">Loading notifications...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell size={36} weight="regular" className="text-ink/30 mb-2" />
                      <p className="text-xs font-bold text-ink">No Notifications Available</p>
                      <p className="text-[11px] text-ink/50 mt-0.5 max-w-[200px] leading-snug">
                        System updates and activity alerts will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((n) => (
                      <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        <p className="mt-1 text-xs text-ink/40">
                          {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 text-sm text-ink/60">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* Dashboard Content */}
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
