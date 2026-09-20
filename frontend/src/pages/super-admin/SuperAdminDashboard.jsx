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

function StatCard({ icon: Icon, title, subtitle, value, iconBgClass, iconColorClass, linkTo, loading }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between gap-2">
          {loading ? (
            <div className="h-8 w-14 animate-pulse rounded-md bg-ink/10" />
          ) : (
            <span className="text-2xl sm:text-3xl font-extrabold text-ink leading-none">
              {value ?? 0}
            </span>
          )}
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
  const cls =
    s === 'active'
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      : 'bg-ink/5 text-ink/50 border border-ink/10';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${cls}`}>
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
        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/dashboard/stats'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
          setSchoolsOverview(data.schoolsOverview || []);
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
          <StatCard key={card.title} {...card} loading={loading} />
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
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <SpinnerGap size={32} className="animate-spin text-brand-red" />
            <span className="text-xs text-ink/50 font-semibold">Loading school data...</span>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/5 bg-ink/[0.02]">
                  <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink/40">School</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink/40">Division</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink/40">Admin</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-ink/40">Students</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-ink/40">Teachers</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-ink/40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {schoolsOverview.map((school) => (
                  <tr
                    key={school.school_id}
                    onClick={() => navigate(`/super-admin/schools/${school.school_id}`)}
                    className="hover:bg-ink/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-ink text-xs">{school.school_name}</p>
                      <p className="text-[10px] text-ink/40 mt-0.5">ID: {school.school_id}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink/60">{school.division || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-ink/60">{school.admin_email || '—'}</td>
                    <td className="px-4 py-3.5 text-center text-xs font-semibold text-ink">{school.student_count ?? 0}</td>
                    <td className="px-4 py-3.5 text-center text-xs font-semibold text-ink">{school.teacher_count ?? 0}</td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={school.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
