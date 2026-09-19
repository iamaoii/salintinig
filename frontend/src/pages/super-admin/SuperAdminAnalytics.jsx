import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import {
  ChartBar,
  Buildings,
  Student,
  BookOpen,
  ArrowRight,
} from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import { useNavigate } from 'react-router-dom';

const LEVEL_COLORS = {
  Independent: { bar: '#00a652', text: 'text-[#00a652]', bg: 'bg-[#00a652]' },
  Instructional: { bar: '#ffc300', text: 'text-[#d97706]', bg: 'bg-[#ffc300]' },
  Frustration: { bar: '#d53f24', text: 'text-[#d53f24]', bg: 'bg-[#d53f24]' },
  Pending: { bar: '#9ca3af', text: 'text-gray-400', bg: 'bg-gray-300' },
};

export default function SuperAdminAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = getToken();
        const res = await fetch(getApiUrl('/api/super-admin/analytics'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.warn('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
    const timer = setTimeout(() => setIsMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const totalStudents = analytics?.totalStudents || 0;
  const levelDist = analytics?.readingLevelDistribution || [];
  const schoolComparison = analytics?.schoolComparison || [];

  const getLevel = (level) => {
    if (!level) return 'Pending';
    const l = level.toLowerCase();
    if (l.includes('independent')) return 'Independent';
    if (l.includes('instructional')) return 'Instructional';
    if (l.includes('frustration') || l.includes('frustrational')) return 'Frustration';
    return 'Pending';
  };

  const normalizedDist = levelDist.map((item) => ({
    level: getLevel(item.level),
    count: Number(item.count),
  }));

  const grouped = normalizedDist.reduce((acc, { level, count }) => {
    acc[level] = (acc[level] || 0) + count;
    return acc;
  }, {});

  const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ChartBar size={24} className="text-purple-700" />
          <h1 className="text-2xl font-bold text-ink">System Analytics</h1>
        </div>
        <p className="mt-0.5 text-xs text-ink/50">Platform-wide reading performance across all schools</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-ink/50">
          <div className="size-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <Student size={20} className="text-purple-700" />
                <div>
                  <h2 className="text-sm font-bold text-ink">Reading Level Distribution</h2>
                  <p className="text-xs text-ink/50">{totalStudents.toLocaleString()} total students system-wide</p>
                </div>
              </div>
            </div>

            {total === 0 || totalStudents === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Student size={36} className="text-ink/30 mb-2" />
                <p className="text-sm font-bold text-ink">No assessment data yet</p>
                <p className="text-xs text-ink/50 mt-1">Reading level data will appear once students are assessed.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Segmented Bar */}
                <div className="h-3 w-full rounded-full bg-ink/10 overflow-hidden flex gap-0.5 p-0.5">
                  {Object.entries(grouped).map(([level, count]) => {
                    const pct = Math.round((count / total) * 100);
                    const color = LEVEL_COLORS[level]?.bar || '#9ca3af';
                    return pct > 0 ? (
                      <div
                        key={level}
                        style={{ width: isMounted ? `${pct}%` : '0%', backgroundColor: color }}
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        title={`${level}: ${count}`}
                      />
                    ) : null;
                  })}
                </div>

                {/* Level Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(grouped).map(([level, count]) => {
                    const pct = Math.round((count / total) * 100);
                    const colors = LEVEL_COLORS[level] || LEVEL_COLORS.Pending;
                    return (
                      <div key={level} className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`size-2.5 rounded-full shrink-0 ${colors.bg}`} />
                          <span className="text-xs font-bold text-ink">{level}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 pl-4">
                          <span className="text-xl font-extrabold text-ink">{count}</span>
                          <span className={`text-xs font-bold ${colors.text}`}>({pct}%)</span>
                        </div>
                        <span className="text-[10px] text-ink/50 block pl-4 font-medium">students</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* School Comparison Table */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <Buildings size={20} className="text-purple-700" />
                <div>
                  <h2 className="text-sm font-bold text-ink">School Performance Comparison</h2>
                  <p className="text-xs text-ink/50">Assessment completion rates across all schools</p>
                </div>
              </div>
              <button type="button" onClick={() => navigate('/super-admin/schools')}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer">
                Manage Schools <ArrowRight size={11} />
              </button>
            </div>

            {schoolComparison.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Buildings size={36} className="text-ink/30 mb-2" />
                <p className="text-sm font-bold text-ink">No schools registered yet</p>
                <p className="text-xs text-ink/50 mt-1">Add schools to see performance comparison.</p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="pb-2 text-left font-bold text-ink/60">School</th>
                      <th className="pb-2 text-center font-bold text-ink/60">Students</th>
                      <th className="pb-2 text-center font-bold text-ink/60">Assessments</th>
                      <th className="pb-2 text-center font-bold text-ink/60">Completion</th>
                      <th className="pb-2 text-right font-bold text-ink/60">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {schoolComparison.map((school) => (
                      <tr key={school.id} className="hover:bg-ink/[0.015] transition-colors">
                        <td className="py-2.5 pr-3">
                          <p className="font-bold text-ink">{school.name}</p>
                          <p className="text-ink/40">{school.id}</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-ink">{school.student_count}</td>
                        <td className="py-2.5 text-center font-semibold text-ink">{school.assessment_count}</td>
                        <td className="py-2.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-bold text-sm ${
                              school.completion_rate >= 70 ? 'text-green-600' :
                              school.completion_rate >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {school.completion_rate}%
                            </span>
                            <div className="h-1.5 w-20 rounded-full bg-ink/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  school.completion_rate >= 70 ? 'bg-green-500' :
                                  school.completion_rate >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: isMounted ? `${school.completion_rate}%` : '0%' }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <button type="button" onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                            className="text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer">
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
        </>
      )}
    </div>
  );
}
