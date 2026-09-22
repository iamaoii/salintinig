import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Buildings,
  Student,
  ChalkboardTeacher,
  BookOpen,
  BookBookmark,
  ArrowRight,
  SpinnerGap,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';

function StatCard({ icon: Icon, title, subtitle, value, iconBgClass, iconColorClass, linkTo, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex flex-col justify-between h-[138px]">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="h-8 w-14 rounded-md bg-ink/10" />
            <div className="size-8 rounded-xl bg-ink/10" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-4 w-24 rounded bg-ink/10" />
            <div className="h-3 w-32 rounded bg-ink/5" />
          </div>
        </div>
        <div className="mt-4 pt-2 border-t border-ink/5 flex items-center justify-end">
          <div className="h-3.5 w-14 rounded bg-ink/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-ink leading-none">
            {value ?? 0}
          </span>
          <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${iconBgClass} ${iconColorClass}`}>
            <Icon size={17} weight="bold" />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-bold text-ink leading-tight">{title}</p>
          <p className="text-[11px] text-ink/40 mt-0.5 font-normal">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-ink/5 flex items-center justify-end">
        <button
          type="button"
          onClick={() => navigate(linkTo)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:text-brand-blue/80 hover:underline cursor-pointer"
        >
          <span>Manage</span>
          <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || 'active').toLowerCase();
  const isActive = s === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-ink/5 text-ink/50 border border-ink/10'
      }`}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-ink/40'}`} />
      {s}
    </span>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [schoolsOverview, setSchoolsOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cached = cacheService.get('sa_dashboard_stats');
        if (cached) {
          setStats(cached.stats);
          setSchoolsOverview(cached.schoolsOverview || []);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/dashboard/stats'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
          setSchoolsOverview(data.schoolsOverview || []);
          cacheService.set('sa_dashboard_stats', { stats: data.stats, schoolsOverview: data.schoolsOverview });
        }
      } catch (err) {
        console.warn('SA Dashboard: failed to fetch stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const STAT_CARDS = [
    {
      icon: Buildings,
      title: 'Total Schools',
      subtitle: 'Registered Institutions',
      value: stats?.totalSchools,
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      linkTo: '/super-admin/schools',
    },
    {
      icon: Student,
      title: 'Total Students',
      subtitle: 'Across all schools',
      value: stats?.totalStudents,
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      linkTo: '/super-admin/schools',
    },
    {
      icon: ChalkboardTeacher,
      title: 'Total Teachers',
      subtitle: 'Across all schools',
      value: stats?.totalTeachers,
      iconBgClass: 'bg-rose-100',
      iconColorClass: 'text-rose-600',
      linkTo: '/super-admin/schools',
    },
    {
      icon: BookOpen,
      title: 'Phil-IRI Passages',
      subtitle: 'Published passages',
      value: stats?.totalPassages ?? stats?.totalAssessments,
      iconBgClass: 'bg-emerald-100',
      iconColorClass: 'text-emerald-600',
      linkTo: '/super-admin/phil-iri/passages',
    },
    {
      icon: BookBookmark,
      title: 'Reading Materials',
      subtitle: 'Active stories',
      value: stats?.totalStories,
      iconBgClass: 'bg-amber-100',
      iconColorClass: 'text-amber-600',
      linkTo: '/super-admin/stories',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">System Dashboard</h1>
        <p className="mt-0.5 text-sm text-ink/50">Platform-wide overview of all schools and activity.</p>
      </div>

      {/* Stat Cards Grid (5 Column Layout matching 2nd image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.title} {...card} loading={loading && !stats} />
        ))}
      </div>

      {/* School Overview Table */}
      <div className="rounded-2xl border border-ink/5 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5">
          <div>
            <h2 className="text-sm font-bold text-ink">School Overview</h2>
            <p className="text-xs text-ink/50 mt-0.5">Top schools by name with admin and enrolment snapshot.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/super-admin/schools')}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline cursor-pointer"
          >
            View All <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm table-fixed">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs">
                  <th className="w-[30%] px-5 py-3 text-left font-bold text-ink/50">School Code & Name</th>
                  <th className="w-[22%] px-4 py-3 text-left font-bold text-ink/50">Division & Region</th>
                  <th className="w-[24%] px-4 py-3 text-left font-bold text-ink/50">School Admin</th>
                  <th className="w-[10%] px-4 py-3 text-right font-bold text-ink/50">Students</th>
                  <th className="w-[10%] px-4 py-3 text-right font-bold text-ink/50">Teachers</th>
                  <th className="w-[14%] px-5 py-3 text-left font-bold text-ink/50">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-3.5">
                      <div className="h-4 w-40 rounded bg-ink/10 mb-1" />
                      <div className="h-3 w-20 rounded bg-ink/5" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-28 rounded bg-ink/10 mb-1" />
                      <div className="h-3 w-16 rounded bg-ink/5" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-32 rounded bg-ink/10 mb-1" />
                      <div className="h-3 w-24 rounded bg-ink/5" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-8 rounded bg-ink/10 ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-8 rounded bg-ink/10 ml-auto" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="h-5 w-16 rounded-full bg-ink/10" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : schoolsOverview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Buildings size={40} weight="regular" className="text-ink/20 mb-2" />
            <p className="text-sm font-bold text-ink/40">No schools yet</p>
            <p className="text-xs text-ink/30 mt-0.5">Add schools from the Schools section.</p>
            <button
              type="button"
              onClick={() => navigate('/super-admin/schools')}
              className="mt-4 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 transition-colors cursor-pointer"
            >
              Add School
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm table-fixed">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs">
                    <th className="w-[30%] px-5 py-3 text-left font-bold text-ink/50">School Code & Name</th>
                    <th className="w-[22%] px-4 py-3 text-left font-bold text-ink/50">Division & Region</th>
                    <th className="w-[24%] px-4 py-3 text-left font-bold text-ink/50">School Admin</th>
                    <th className="w-[10%] px-4 py-3 text-right font-bold text-ink/50">Students</th>
                    <th className="w-[10%] px-4 py-3 text-right font-bold text-ink/50">Teachers</th>
                    <th className="w-[14%] px-5 py-3 text-left font-bold text-ink/50">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {schoolsOverview.map((school) => (
                    <tr
                      key={school.school_id}
                      onClick={() => navigate(`/super-admin/schools/${school.school_id}`)}
                      className="group hover:bg-ink/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 overflow-hidden">
                        <div className="min-w-0">
                          <p className="font-bold text-ink text-xs leading-tight truncate group-hover:text-brand-blue transition-colors" title={school.school_name}>
                            {school.school_name}
                          </p>
                          <p className="text-[11px] font-mono text-ink/50 mt-0.5 truncate" title={`Code: ${school.school_id}`}>
                            Code: {school.school_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-ink/70 overflow-hidden">
                        <div className="min-w-0">
                          <p className="font-medium text-ink leading-tight truncate" title={school.division || '—'}>
                            {school.division || '—'}
                          </p>
                          <p className="text-[11px] text-ink/50 mt-0.5 truncate" title={school.region || '—'}>
                            {school.region || '—'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-ink/70 overflow-hidden">
                        {school.admin_email ? (
                          <div className="min-w-0">
                            <p className="font-semibold text-ink leading-tight truncate" title={school.admin_name || 'Admin'}>
                              {school.admin_name || 'Admin'}
                            </p>
                            <p className="text-[11px] text-ink/50 mt-0.5 truncate font-mono" title={school.admin_email}>
                              {school.admin_email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-ink/40 italic">No admin assigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-ink">
                        {school.student_count ?? 0}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-ink">
                        {school.teacher_count ?? 0}
                      </td>

                      <td className="px-5 py-3 text-left">
                        <StatusBadge status={school.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
