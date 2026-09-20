import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import {
  ChartBar,
  Buildings,
  Student,
  BookOpen,
  CalendarBlank,
  Translate,
  TrendUp,
  SpinnerGap,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/analytics'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnalytics(data.analytics);
        } else {
          setToast({ message: data.error || 'Failed to load system analytics.', type: 'error' });
        }
      } catch (err) {
        console.warn('Failed to load system analytics:', err);
        setToast({ message: 'Network error loading analytics.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <SpinnerGap size={32} className="animate-spin text-brand-red" />
        <span className="text-xs font-semibold text-ink/50">Compiling system analytics...</span>
      </div>
    );
  }

  const schoolBreakdown = analytics?.schoolBreakdown || [];
  const readingLevelBreakdown = analytics?.readingLevelBreakdown || [];
  const languageBreakdown = analytics?.languageBreakdown || [];
  const monthlyAssessments = analytics?.monthlyAssessments || [];

  const totalReadingLevels = readingLevelBreakdown.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const totalPassagesByLang = languageBreakdown.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <ChartBar size={24} className="text-brand-red shrink-0" />
            <h1 className="text-2xl font-bold text-ink">Cross-School System Analytics</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/60">
            Platform-level reading performance distributions, language materials, and institutional activity.
          </p>
        </div>

        {/* Top 2 Metric Cards: Reading Level Profile & Language Material Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reading Level Distribution */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <TrendUp size={20} className="text-brand-red" />
                <h2 className="text-sm font-bold text-ink">Phil-IRI Reading Level Profiles</h2>
              </div>
              <span className="text-xs font-semibold text-ink/50">{totalReadingLevels} Evaluated</span>
            </div>

            {readingLevelBreakdown.length === 0 ? (
              <p className="text-xs text-ink/40 py-6 text-center">No assessment results recorded yet.</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {readingLevelBreakdown.map((item) => {
                  const count = Number(item.count) || 0;
                  const pct = totalReadingLevels > 0 ? Math.round((count / totalReadingLevels) * 100) : 0;
                  const level = item.reading_level_result || 'Pending';

                  let colorBar = 'bg-brand-blue';
                  let badgeCls = 'bg-brand-blue/10 text-brand-blue';
                  if (level.toLowerCase().includes('independent')) {
                    colorBar = 'bg-emerald-500';
                    badgeCls = 'bg-emerald-100 text-emerald-800';
                  } else if (level.toLowerCase().includes('instructional')) {
                    colorBar = 'bg-amber-500';
                    badgeCls = 'bg-amber-100 text-amber-800';
                  } else if (level.toLowerCase().includes('frustration')) {
                    colorBar = 'bg-rose-500';
                    badgeCls = 'bg-rose-100 text-rose-800';
                  }

                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${badgeCls}`}>
                          {level}
                        </span>
                        <span className="font-semibold text-ink">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorBar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Materials Distribution */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <Translate size={20} className="text-brand-blue" />
                <h2 className="text-sm font-bold text-ink">Passage Repository by Language</h2>
              </div>
              <span className="text-xs font-semibold text-ink/50">{totalPassagesByLang} Total Passages</span>
            </div>

            {languageBreakdown.length === 0 ? (
              <p className="text-xs text-ink/40 py-6 text-center">No passages in repository yet.</p>
            ) : (
              <div className="space-y-3.5 pt-1">
                {languageBreakdown.map((item) => {
                  const count = Number(item.count) || 0;
                  const pct = totalPassagesByLang > 0 ? Math.round((count / totalPassagesByLang) * 100) : 0;
                  const lang = item.language || 'Unknown';

                  return (
                    <div key={lang} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{lang}</span>
                        <span className="font-semibold text-ink/70">
                          {count} passages ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-red transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Assessment Activity */}
        {monthlyAssessments.length > 0 && (
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
              <CalendarBlank size={20} className="text-amber-600" />
              <h2 className="text-sm font-bold text-ink">Recent Assessment Activity (Past 6 Months)</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthlyAssessments.map((m) => (
                <div
                  key={m.month}
                  className="rounded-xl border border-ink/10 bg-white p-4 text-center space-y-1 shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-ink/50 uppercase">{m.month}</span>
                  <p className="text-xl font-bold text-ink">{m.count}</p>
                  <span className="text-[10px] text-ink/40">completed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* School-by-School Aggregate Table */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <Buildings size={20} className="text-brand-red" />
            <h2 className="text-sm font-bold text-ink">School Institutional Breakdown</h2>
          </div>

          {schoolBreakdown.length === 0 ? (
            <p className="text-xs text-ink/40 py-8 text-center">No schools registered in system.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02]">
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">School Name</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Division</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">Active Students</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">Active Teachers</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">School Admins</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">Assessments Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {schoolBreakdown.map((row) => (
                    <tr key={row.school_id} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-ink">{row.school_name}</p>
                        <p className="text-[10px] font-mono text-ink/40">ID: {row.school_id}</p>
                      </td>
                      <td className="p-3 text-ink/70">{row.division || '—'}</td>
                      <td className="p-3 text-center font-bold text-ink">{row.student_count ?? 0}</td>
                      <td className="p-3 text-center font-bold text-ink">{row.teacher_count ?? 0}</td>
                      <td className="p-3 text-center font-bold text-ink">{row.admin_count ?? 0}</td>
                      <td className="p-3 text-center font-bold text-brand-blue">{row.assessment_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
