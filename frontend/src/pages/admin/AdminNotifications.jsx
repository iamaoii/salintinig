import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Clock,
  CloudArrowUp,
  UserPlus,
  ShieldWarning,
  Funnel,
  Check,
  Student,
  Trash,
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotifications = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);

    const handleNotifUpdate = () => {
      fetchNotifications(false);
    };
    window.addEventListener('notificationsUpdated', handleNotifUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleNotifUpdate);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToastMessage('All notifications marked as read.');
        fetchNotifications(false);
      }
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      window.dispatchEvent(new Event('notificationsUpdated'));
      const token = getToken();
      if (!token) return;
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(false);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event('notificationsUpdated'));
      const token = getToken();
      if (!token) return;
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToastMessage('Notification removed.');
        fetchNotifications(false);
      }
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'Unread') return notifications.filter((n) => !n.is_read);
    if (filter === 'Assessment') return notifications.filter((n) => n.notification_type === 'reading_level' || n.notification_type === 'assessment');
    if (filter === 'Account') return notifications.filter((n) => n.notification_type === 'account_request' || n.notification_type === 'account_approval' || n.notification_type === 'account_rejection');
    if (filter === 'Audit Logs') return notifications.filter((n) => n.notification_type === 'system' || n.notification_type === 'audit');
    return notifications;
  }, [notifications, filter]);

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">
        {/* Upper Left Back Navigation */}
        <div>
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell size={28} className="text-brand-red" />
              <h1 className="text-3xl font-bold text-ink">Notifications & Audit Logs</h1>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Complete history of assessment alerts, account activation notices, system changes, and administrative audit logs
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <Check size={16} className="text-brand-blue" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.04)]">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-ink/40" />
            <span className="text-xs font-bold text-ink/70">Filter:</span>
            <div className="flex items-center rounded-full border border-ink/10 bg-ink/5 p-0.5 text-xs font-semibold overflow-x-auto">
              {['All', 'Unread', 'Assessment', 'Account', 'Audit Logs'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    filter === cat
                      ? 'bg-white text-ink shadow-xs font-bold'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-ink/50 font-medium">
            {notifications.filter((n) => !n.is_read).length} Unread Alerts
          </span>
        </div>

        {/* Notifications Master List */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-ink/50">
              <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
              <span className="text-xs font-semibold text-ink/70">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell size={48} weight="regular" className="text-ink/30 mb-3" />
              <h3 className="text-base font-bold text-ink tracking-tight">No Notifications Found</h3>
              <p className="mt-1 text-xs text-ink/50 max-w-sm leading-relaxed">
                There are currently no notifications or system activity alerts matching your selected filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-ink/[0.02] rounded-xl px-3 transition-colors cursor-pointer ${
                    !n.is_read ? 'bg-brand-blue/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
                      {n.notification_type === 'reading_level' || n.notification_type === 'assessment' ? (
                        <Student size={18} className="text-brand-blue" />
                      ) : n.notification_type === 'account_request' || n.notification_type === 'account_approval' ? (
                        <UserPlus size={18} className="text-purple-600" />
                      ) : (
                        <CheckCircle size={18} className="text-amber-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-ink">{n.title}</h4>
                        {!n.is_read && (
                          <span className="size-2 rounded-full bg-brand-red shrink-0" />
                        )}
                        <span className="rounded bg-ink/5 px-1.5 py-0.2 text-[9px] font-bold text-ink/60 uppercase">
                          {n.notification_type || 'SYSTEM'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink/70 leading-relaxed">{n.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 text-xs text-ink/40">
                      <Clock size={13} />
                      <span>{new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-1 rounded text-ink/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove notification"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
