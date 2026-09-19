import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Buildings,
  Student,
  ChalkboardTeacher,
  BookOpen,
  Books,
  ShieldStar,
  ArrowRight,
  SquaresFour,
  Plus,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [schoolOverview, setSchoolOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/dashboard/stats'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
          setSchoolOverview(data.schoolOverview || []);
        }
      } catch (err) {
        console.warn('Failed to fetch super admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const STAT_CARDS = [
    {
      title: 'Total Schools',
      value: stats?.schools ?? 0,
      subtitle: 'Registered institutions',
      icon: Buildings,
      link: '/super-admin/schools',
      bg: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'Total Students',
      value: stats?.students ?? 0,
      subtitle: 'Across all schools',
      icon: Student,
      link: '/super-admin/analytics',
      bg: 'bg-brand-blue/10 text-brand-blue',
    },
    {
      title: 'Total Teachers',
      value: stats?.teachers ?? 0,
      subtitle: 'Across all schools',
      icon: ChalkboardTeacher,
      link: '/super-admin/analytics',
      bg: 'bg-brand-red/10 text-brand-red',
    },
    {
      title: 'Phil-IRI Passages',
      value: stats?.passages ?? 0,
      subtitle: 'Published passages',
      icon: BookOpen,
      link: '/super-admin/phil-iri/passages',
      bg: 'bg-green-100 text-green-700',
    },
    {
      title: 'Reading Materials',
      value: stats?.stories ?? 0,
      subtitle: 'Active stories',
      icon: Books,
      link: '/super-admin/stories',
      bg: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SquaresFour size={24} className="text-purple-700" />
            <h1 className="text-2xl font-bold text-ink">System Overview</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            Platform-wide metrics and school management
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/super-admin/schools/add')}
            className="flex items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-colors cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-2.5">Platform Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.link)}
                className="group relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-cream p-3 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer min-w-0"
              >
                <div className="flex items-start justify-between gap-1">
                  {loading ? (
                    <div className="h-6 w-10 animate-pulse rounded bg-ink/10" />
                  ) : (
                    <p className="text-xl font-black text-ink leading-none tracking-tight">
                      {(card.value ?? 0).toLocaleString()}
                    </p>
                  )}
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon size={14} weight="bold" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-bold text-ink truncate">{card.title}</p>
                  <p className="text-[11px] text-ink/50 truncate mt-0.5">{card.subtitle}</p>
                </div>
                <div className="mt-2.5 flex items-center justify-end border-t border-ink/5 pt-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 group-hover:underline shrink-0">
                    <span>Manage</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schools Overview Table */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div className="flex items-center gap-2">
            <Buildings size={20} className="text-purple-700" />
            <div>
              <h2 className="text-sm font-bold text-ink">Schools Overview</h2>
              <p className="text-xs text-ink/50">All registered schools and their status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/super-admin/schools')}
            className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-ink/50">
            <div className="size-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Loading schools...</span>
          </div>
        ) : schoolOverview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Buildings size={36} className="text-ink/30 mb-2" />
            <p className="text-sm font-bold text-ink">No schools registered yet</p>
            <p className="text-xs text-ink/50 mt-1">Add your first school to get started.</p>
            <button
              type="button"
              onClick={() => navigate('/super-admin/schools/add')}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              Add School
            </button>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="pb-2 text-left font-bold text-ink/60">School</th>
                  <th className="pb-2 text-left font-bold text-ink/60 hidden sm:table-cell">Division</th>
                  <th className="pb-2 text-center font-bold text-ink/60">Students</th>
                  <th className="pb-2 text-center font-bold text-ink/60">Teachers</th>
                  <th className="pb-2 text-center font-bold text-ink/60">Status</th>
                  <th className="pb-2 text-right font-bold text-ink/60">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {schoolOverview.slice(0, 8).map((school) => (
                  <tr key={school.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="py-2.5 pr-3">
                      <div>
                        <p className="font-bold text-ink truncate max-w-[180px]">{school.name}</p>
                        <p className="text-ink/50 truncate">ID: {school.id}</p>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 hidden sm:table-cell">
                      <span className="text-ink/70">{school.division || '—'}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="font-semibold text-ink">{school.student_count ?? 0}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="font-semibold text-ink">{school.teacher_count ?? 0}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        school.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-ink/10 text-ink/50'
                      }`}>
                        {school.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                        className="text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
          <ShieldStar size={20} className="text-purple-700" />
          <h2 className="text-sm font-bold text-ink">Quick Actions</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add New School', desc: 'Register a school', icon: Buildings, path: '/super-admin/schools/add' },
            { label: 'Manage Passages', desc: 'Phil-IRI library', icon: BookOpen, path: '/super-admin/phil-iri/passages' },
            { label: 'Add Story', desc: 'Reading materials', icon: Books, path: '/super-admin/stories' },
            { label: 'View Analytics', desc: 'System reports', icon: SquaresFour, path: '/super-admin/analytics' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-start gap-2 rounded-xl border border-ink/10 p-3 hover:bg-purple-50 hover:border-purple-200 transition-colors cursor-pointer text-left"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Icon size={16} weight="regular" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{action.label}</p>
                  <p className="text-[11px] text-ink/50">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
