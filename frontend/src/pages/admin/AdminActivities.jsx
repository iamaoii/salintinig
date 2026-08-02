import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CloudArrowUp,
  UserPlus,
  CheckCircle,
  ShieldWarning,
  MagnifyingGlass,
  Funnel,
  DownloadSimple,
} from '@phosphor-icons/react';
import { recentActivities } from '../../data/adminData.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import BackButton from '../../components/common/BackButton.jsx';

export default function AdminActivities() {
  const navigate = useNavigate();
  const [activities] = useState(recentActivities);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredActivities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return activities.filter((act) => {
      const matchesSearch =
        !query ||
        act.title.toLowerCase().includes(query) ||
        act.details.toLowerCase().includes(query) ||
        act.user.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'All' || act.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, typeFilter]);

  const handleExportLogs = () => {
    const csvHeader = 'Timestamp,Activity Type,Title,Details,Performed By\n';
    const csvRows = filteredActivities
      .map(
        (a) =>
          `"${a.timestamp}","${a.type}","${a.title}","${a.details}","${a.user}"`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalinTinig_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Activity logs exported to CSV.');
  };

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
              <Clock size={28} className="text-brand-red" />
              <h1 className="text-3xl font-bold text-ink">System Activity Logs</h1>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Audit trail of system events, file uploads, faculty assignments, and user management actions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportLogs}
              className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <DownloadSimple size={16} className="text-brand-blue" />
              <span>Export Audit Logs</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.04)]">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by action title, user email, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/20 bg-white pl-9 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-ink/40" />
            <span className="text-xs font-bold text-ink/70">Category:</span>
            <div className="flex items-center rounded-full border border-ink/10 bg-ink/5 p-0.5 text-xs font-semibold overflow-x-auto">
              {['All', 'Upload', 'Assignment', 'User', 'Security'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTypeFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    typeFilter === cat
                      ? 'bg-white text-ink shadow-xs font-bold'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {cat === 'All' ? 'All Logs' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Logs Master List */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          {filteredActivities.length === 0 ? (
            <p className="text-xs text-ink/40 py-8 text-center">No activity logs found matching your filter.</p>
          ) : (
            <div className="divide-y divide-ink/10">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-ink/[0.02] rounded-xl px-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink">
                      {act.type === 'upload' && <CloudArrowUp size={18} weight="bold" className="text-brand-blue" />}
                      {act.type === 'assignment' && <UserPlus size={18} weight="bold" className="text-purple-600" />}
                      {act.type === 'user' && <CheckCircle size={18} weight="bold" className="text-green-600" />}
                      {act.type === 'security' && <ShieldWarning size={18} weight="bold" className="text-brand-red" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-ink">{act.title}</h4>
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${act.badgeColor || 'bg-ink/5 text-ink/70'}`}>
                          {act.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink/70 leading-relaxed">{act.details}</p>
                      <span className="mt-1 text-[11px] font-medium text-ink/40 block">Performed by: {act.user}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-ink/50 shrink-0 self-end sm:self-center">
                    <Clock size={13} />
                    <span>{act.timestamp}</span>
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
