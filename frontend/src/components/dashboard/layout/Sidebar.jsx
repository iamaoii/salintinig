import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from '@phosphor-icons/react';
import ClassCard from '../class/ClassCard.jsx';
import { getToken } from '../../../lib/auth.js';
import { useSmartNotificationPoll } from '../../../hooks/useSmartNotificationPoll.js';

function formatNotificationDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newNotifs = data.notifications || [];
        setNotifications((prev) => (JSON.stringify(prev) !== JSON.stringify(newNotifs) ? newNotifs : prev));
      }
    } catch (err) {
      console.warn('Overview notification widget fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useSmartNotificationPoll(fetchNotifications, 45000);

  return (
    <aside className="flex w-full flex-col gap-4 lg:max-w-[400px] lg:shrink-0">
      <ClassCard />

      <div className="rounded-2xl border border-ink/5 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-brand-red shrink-0" />
            <h3 className="font-semibold text-ink">Notification</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/teacher/notifications')}
            className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* List of Notifications */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-ink/50">
            <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-ink/70">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-1 animate-in fade-in duration-200">
            <Bell size={36} weight="regular" className="text-ink/30 mb-1" />
            <h4 className="text-sm font-bold text-ink tracking-tight">No Notifications Available</h4>
            <p className="text-xs text-ink/40 max-w-[220px] leading-relaxed">
              Class updates and student activity alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-ink/10 transition-opacity duration-300 animate-in fade-in">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => navigate('/teacher/notifications')}
                className="py-3.5 first:pt-3 last:pb-0 cursor-pointer hover:bg-ink/[0.02] transition-colors rounded-lg px-1"
              >
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs text-ink/40">{formatNotificationDate(n.created_at)}</p>
                <p className="mt-1 text-xs text-ink/60 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
