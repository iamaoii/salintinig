import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Student,
  ChalkboardTeacher,
  Users,
  GridFour,
  GraduationCap,
  CloudArrowUp,
  UserPlus,
  ShieldWarning,
  ArrowRight,
  Clock,
  CheckCircle,
  FileCsv,
  SquaresFour,
  Check,
  X,
  UserCheck,
} from '@phosphor-icons/react';
import { adminStats, recentActivities } from '../../data/adminData.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function AdminDashboardHome() {
  const navigate = useNavigate();
  const [activities] = useState(recentActivities);
  const [accountRequests, setAccountRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [requestFilter, setRequestFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Fetch pending account activation requests
  const fetchRequests = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/account-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountRequests(data.requests || []);
      }
    } catch (err) {
      console.warn('Could not fetch account requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch live system metrics
  const fetchStats = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Could not fetch admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();

    const handleSYChange = () => fetchStats();
    window.addEventListener('schoolYearChanged', handleSYChange);
    return () => window.removeEventListener('schoolYearChanged', handleSYChange);
  }, []);

  const handleApprove = async (id, name) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/account-requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Account for ${name} approved successfully! Credentials sent via email.`, type: 'success' });
        fetchRequests();
      } else {
        setToast({ message: data.error || 'Failed to approve request.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error while approving request.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/account-requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'Account request rejected.', type: 'info' });
        fetchRequests();
      } else {
        setToast({ message: data.error || 'Failed to reject request.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Error rejecting request.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    if (requestFilter === 'pending') return accountRequests.filter((r) => r.status === 'pending');
    if (requestFilter === 'approved') return accountRequests.filter((r) => r.status === 'approved');
    if (requestFilter === 'rejected') return accountRequests.filter((r) => r.status === 'rejected');
    return accountRequests;
  }, [accountRequests, requestFilter]);

  const pendingCount = useMemo(() => {
    return accountRequests.filter((r) => r.status === 'pending').length;
  }, [accountRequests]);

  const STAT_CARDS = [
    {
      title: 'Total Students',
      value: (stats?.totalStudents ?? 0).toLocaleString(),
      subtitle: 'Grades 4 - 6',
      icon: Student,
      link: '/admin/students',
      bgIcon: 'bg-brand-blue/10 text-brand-blue',
    },
    {
      title: 'Total Teachers',
      value: (stats?.totalTeachers ?? 0).toLocaleString(),
      subtitle: 'Faculty members',
      icon: ChalkboardTeacher,
      link: '/admin/teachers',
      bgIcon: 'bg-brand-red/10 text-brand-red',
    },
    {
      title: 'Parent Accounts',
      value: (stats?.totalParentAccounts ?? 0).toLocaleString(),
      subtitle: 'Registered portals',
      icon: Users,
      link: '/admin/students',
      bgIcon: 'bg-green-100 text-green-700',
    },
    {
      title: 'Total Sections',
      value: (stats?.totalSections ?? 0).toLocaleString(),
      subtitle: `S.Y. ${stats?.activeSchoolYear || '2026-2027'}`,
      icon: GridFour,
      link: '/admin/faculty-assignment',
      bgIcon: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Grade Levels',
      value: stats?.totalGradeLevels ?? 3,
      subtitle: 'Grade 4 - Grade 6',
      icon: GraduationCap,
      link: '/admin/faculty-assignment',
      bgIcon: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="space-y-4">
      <ToastNotification
        message={toast?.message || null}
        type={toast?.type || 'success'}
        onClose={() => setToast(null)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SquaresFour size={24} className="text-brand-red" />
            <h1 className="text-2xl font-bold text-ink">Overview</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            System metrics, student enrollment, and administrative action logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-[0px_2px_4px_rgba(0,0,0,0.04)] hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <FileCsv size={16} className="text-brand-blue" />
            <span>Upload Student CSV</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/faculty-assignment')}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Assign Faculty</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-2.5">System Summary</h2>
        <div className="grid grid-cols-5 gap-2.5 w-full overflow-x-auto">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.link)}
                className="group relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-cream p-3 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer min-w-0"
              >
                <div className="flex items-start justify-between gap-1">
                  {loadingStats ? (
                    <div className="h-6 w-10 animate-pulse rounded bg-ink/10" />
                  ) : (
                    <p className="text-xl font-black text-ink leading-none tracking-tight">
                      {card.value}
                    </p>
                  )}
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${card.bgIcon}`}>
                    <Icon size={14} weight="bold" />
                  </div>
                </div>

                <div className="mt-2.5">
                  <p className="text-xs font-bold text-ink truncate">{card.title}</p>
                  <p className="text-[11px] text-ink/50 truncate mt-0.5">{card.subtitle}</p>
                </div>

                <div className="mt-2.5 flex items-center justify-end border-t border-ink/5 pt-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue group-hover:underline shrink-0">
                    <span>Manage</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Activation Requests Section */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-brand-red" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Account Activation Requests</h2>
                <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                  {pendingCount} Pending
                </span>
              </div>
              <p className="text-xs text-ink/50">Teachers requesting credentials via Contact Admin form</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/requests')}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {loadingRequests ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-ink/50">
            <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Loading account activation requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-2 py-8 text-center">
            <UserCheck size={36} className="text-ink/30" />
            <h4 className="text-sm font-bold text-ink">No Account Activation Requests</h4>
            <p className="text-xs text-ink/60 leading-relaxed">
              {requestFilter === 'all'
                ? 'There are currently no account activation requests submitted by teachers.'
                : `No ${requestFilter} account activation requests found.`}
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-ink/10 overflow-x-auto">
            {filteredRequests.map((req) => {
              const tName = req.full_name || [req.first_name, req.middle_name, req.last_name].filter(Boolean).join(' ') || 'Teacher';
              return (
                <div key={req.request_id || req.email} className="flex items-center justify-between py-2.5 px-2 hover:bg-ink/[0.02] rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm">
                      {(tName || 'T')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-ink">{tName}</h4>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status ? req.status.toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink/60">{req.email} &bull; ID: {req.teacher_no || 'N/A'} &bull; School ID: {req.school_id}</p>
                    </div>
                  </div>

                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={processingId === (req.request_id || req.email)}
                        onClick={() => handleApprove(req.request_id || req.email, tName)}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} weight="bold" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === (req.request_id || req.email)}
                        onClick={() => handleReject(req.request_id || req.email, tName)}
                        className="flex items-center gap-1 rounded-lg border border-ink/10 bg-cream px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X size={14} weight="bold" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-ink/40">
                      {req.status === 'approved' ? 'Credentials Sent' : 'Request Processed'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activities Section */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Recent Activities</h2>
              <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                Real-time Log
              </span>
            </div>
            <p className="text-xs text-ink/50">Audit log of record uploads and administrative actions</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/activities')}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="mt-2 divide-y divide-ink/10">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start justify-between py-1.5 first:pt-0 last:pb-0 hover:bg-ink/[0.02] rounded-xl px-2 transition-colors">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/70">
                  {act.type === 'upload' && <CloudArrowUp size={12} weight="bold" />}
                  {act.type === 'assignment' && <UserPlus size={12} weight="bold" />}
                  {act.type === 'user' && <CheckCircle size={12} weight="bold" />}
                  {act.type === 'security' && <ShieldWarning size={12} weight="bold" />}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[10px] font-bold text-ink">{act.title}</h4>
                    <span className="rounded bg-ink/5 px-1 py-0.2 text-[8px] font-bold text-ink/70">
                      {act.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-ink/60 leading-tight">{act.details}</p>
                  <span className="text-[9px] text-ink/40 block">By {act.user}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] text-ink/40 whitespace-nowrap">
                <Clock size={11} />
                <span>{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
