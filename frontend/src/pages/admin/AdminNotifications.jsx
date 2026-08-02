import { useState, useMemo } from 'react';
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
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import ToastNotification from '../../components/common/ToastNotification.jsx';

const ALL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Adrian Completed Oral Reading Assessment',
    time: '3 minutes ago',
    description: 'Finished reading the passage aloud and answered the comprehension questions successfully.',
    category: 'Assessment',
    read: false,
  },
  {
    id: 2,
    title: 'Janna Completed Oral Reading Assessment',
    time: '4 minutes ago',
    description: 'Finished reading the passage aloud and answered the comprehension questions successfully.',
    category: 'Assessment',
    read: false,
  },
  {
    id: 3,
    title: 'Batch Import Completed for Grade 4',
    time: '15 minutes ago',
    description: '52 new student accounts created and credentials dispatched to registered parent emails.',
    category: 'Import',
    read: true,
  },
  {
    id: 4,
    title: 'Teacher Account Request Submitted',
    time: '1 hour ago',
    description: 'Maria Santos (EMP-2026-102) submitted a credential activation request via Contact Admin form.',
    category: 'Account',
    read: true,
  },
  {
    id: 5,
    title: 'Section Faculty Assigned',
    time: '2 hours ago',
    description: 'Grade 5 - Agila assigned to Adviser Juan Dela Cruz.',
    category: 'Assignment',
    read: true,
  },
  {
    id: 6,
    title: 'System Backup Completed',
    time: '1 day ago',
    description: 'Automated daily database snapshot backup completed successfully.',
    category: 'System',
    read: true,
  },
];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS);
  const [filter, setFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'Unread') return notifications.filter((n) => !n.read);
    if (filter === 'Assessment') return notifications.filter((n) => n.category === 'Assessment');
    if (filter === 'System') return notifications.filter((n) => n.category === 'Import' || n.category === 'System');
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
              <h1 className="text-3xl font-bold text-ink">Notifications Center</h1>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Complete history of assessment alerts, account activation notices, and system logs
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
              {['All', 'Unread', 'Assessment', 'System'].map((cat) => (
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
            {notifications.filter((n) => !n.read).length} Unread Alerts
          </span>
        </div>

        {/* Notifications Master List */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          {filteredNotifications.length === 0 ? (
            <p className="text-xs text-ink/40 py-8 text-center">No notifications found.</p>
          ) : (
            <div className="divide-y divide-ink/10">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:bg-ink/[0.02] rounded-xl px-3 transition-colors ${
                    !n.read ? 'bg-brand-blue/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
                      {n.category === 'Assessment' && <Student size={18} className="text-brand-blue" />}
                      {n.category === 'Import' && <CloudArrowUp size={18} className="text-green-600" />}
                      {n.category === 'Account' && <UserPlus size={18} className="text-purple-600" />}
                      {n.category === 'System' && <CheckCircle size={18} className="text-amber-600" />}
                      {n.category === 'Assignment' && <UserPlus size={18} className="text-brand-red" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-ink">{n.title}</h4>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-brand-red shrink-0" />
                        )}
                        <span className="rounded bg-ink/5 px-1.5 py-0.2 text-[9px] font-bold text-ink/60">
                          {n.category.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink/70 leading-relaxed">{n.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-ink/40 shrink-0 self-end sm:self-center">
                    <Clock size={13} />
                    <span>{n.time}</span>
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
