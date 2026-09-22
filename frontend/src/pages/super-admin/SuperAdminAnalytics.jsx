import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import {
  ChartBar,
  Buildings,
  CalendarBlank,
  Translate,
  TrendUp,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';

export default function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const cached = cacheService.get('sa_analytics');
        if (cached) {
          setAnalytics(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/analytics'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnalytics(data.analytics);
          cacheService.set('sa_analytics', data.analytics);
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

  const schoolBreakdown = analytics?.schoolBreakdown || [];
  const readingLevelBreakdown = analytics?.readingLevelBreakdown || [];
  const languageBreakdown = analytics?.languageBreakdown || [];
  const monthlyAssessments = analytics?.monthlyAssessments || [];

  const totalPages = Math.ceil(schoolBreakdown.length / PAGE_SIZE) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return schoolBreakdown.slice(start, start + PAGE_SIZE);
  }, [schoolBreakdown, currentPage]);

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

        {loading ? (
          <div className="space-y-6 animate-pulse">
            {/* Top 2 Metric Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <div className="h-5 w-48 rounded bg-ink/10" />
                  <div className="h-4 w-20 rounded bg-ink/5" />
                </div>
                <div className="space-y-4 pt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 rounded bg-ink/10" />
                        <div className="h-3 w-16 rounded bg-ink/5" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-ink/10" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <div className="h-5 w-52 rounded bg-ink/10" />
                  <div className="h-4 w-24 rounded bg-ink/5" />
                </div>
                <div className="space-y-4 pt-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-20 rounded bg-ink/10" />
                        <div className="h-3 w-28 rounded bg-ink/5" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-ink/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Activity Grid Skeleton */}
            <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm space-y-4">
              <div className="h-5 w-64 rounded bg-ink/10 border-b border-ink/10 pb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl border border-ink/10 bg-white p-4 text-center space-y-2">
                    <div className="h-3 w-12 rounded bg-ink/10 mx-auto" />
                    <div className="h-6 w-10 rounded bg-ink/10 mx-auto" />
                    <div className="h-2.5 w-16 rounded bg-ink/5 mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Table Breakdown Skeleton */}
            <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm space-y-4">
              <div className="h-5 w-56 rounded bg-ink/10 border-b border-ink/10 pb-3" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-ink/[0.02]">
                      <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">School Name</th>
                      <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Division</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Active Students</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Active Teachers</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">School Admins</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Assessments Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <tr key={idx}>
                        <td className="p-3"><div className="h-4 w-36 rounded bg-ink/10" /></td>
                        <td className="p-3"><div className="h-4 w-24 rounded bg-ink/5" /></td>
                        <td className="p-3 text-right"><div className="h-4 w-10 rounded bg-ink/10 ml-auto" /></td>
                        <td className="p-3 text-right"><div className="h-4 w-10 rounded bg-ink/10 ml-auto" /></td>
                        <td className="p-3 text-right"><div className="h-4 w-10 rounded bg-ink/10 ml-auto" /></td>
                        <td className="p-3 text-right"><div className="h-4 w-12 rounded bg-ink/10 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>

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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink/10 bg-ink/[0.02]">
                      <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">School Name</th>
                      <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Division</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Active Students</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Active Teachers</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">School Admins</th>
                      <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Assessments Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {paginatedSchools.map((row) => (
                      <tr key={row.school_id} className="hover:bg-ink/[0.02] transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-ink">{row.school_name}</p>
                          <p className="text-[10px] font-mono text-ink/40">ID: {row.school_id}</p>
                        </td>
                        <td className="p-3 text-ink/70">{row.division || '—'}</td>
                        <td className="p-3 text-right font-bold text-ink">{row.student_count ?? 0}</td>
                        <td className="p-3 text-right font-bold text-ink">{row.teacher_count ?? 0}</td>
                        <td className="p-3 text-right font-bold text-ink">{row.admin_count ?? 0}</td>
                        <td className="p-3 text-right font-bold text-brand-blue">{row.assessment_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-ink/10 pt-4 text-xs text-ink/60">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(currentPage * PAGE_SIZE, schoolBreakdown.length)} of {schoolBreakdown.length} school records
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      <CaretLeft size={14} /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setCurrentPage(pg)}
                          className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pg
                              ? 'bg-brand-blue text-white shadow-xs'
                              : 'bg-cream border border-ink/10 text-ink/70 hover:bg-ink/5'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      Next <CaretRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </>
    )}
      </div>
    </>
  );
}
