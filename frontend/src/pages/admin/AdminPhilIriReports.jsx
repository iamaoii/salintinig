import { useEffect, useMemo, useState } from 'react';
import {
  ChartBar,
  Funnel,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { PhilIriReportsSkeleton } from '../../components/common/Skeleton.jsx';
import { getApiUrl } from '../../config/api.js';
import { getToken } from '../../lib/auth.js';

const BOUNDARIES = [
  ['Independent', 'independentLevel', 'emerald', 'bg-emerald-500', 'text-emerald-700', 'bg-emerald-50 border-emerald-200'],
  ['Instructional', 'instructionalLevel', 'amber', 'bg-amber-400', 'text-amber-700', 'bg-amber-50 border-amber-200'],
  ['Frustrational', 'frustrationalLevel', 'rose', 'bg-rose-500', 'text-rose-700', 'bg-rose-50 border-rose-200'],
];
const SECTION_PAGE_SIZE = 6;

const gradeLabel = (value) => {
  if (!value) return '—';
  const grade = String(value || '').match(/\d+/)?.[0];
  return grade ? `Grade ${grade}` : String(value);
};

export default function AdminPhilIriReports() {
  const [profiles, setProfiles] = useState([]);
  const [students, setStudents] = useState([]);
  const [gstSubmissions, setGstSubmissions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('pre_test');
  const [language, setLanguage] = useState('fil');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sectionPage, setSectionPage] = useState(1);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await fetch(getApiUrl('/api/admin/phil-iri/adaptive-reports'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setProfiles(data.profiles || []);
          setStudents(data.students || []);
          setGstSubmissions(data.gstSubmissions || []);
          setSections(data.sections || []);
        } else {
          setToast({ message: data.error || 'Unable to load Phil-IRI analytics reports.', type: 'error' });
        }
      } catch (err) {
        setToast({ message: 'Unable to connect to server for Phil-IRI analytics.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Filter students and profiles by grade, period, and language
  const filteredStudents = useMemo(() => {
    return students.filter((s) => selectedGrade === 'All' || s.grade === selectedGrade);
  }, [students, selectedGrade]);

  const scopedProfiles = useMemo(() => {
    const profileMap = new Map(
      profiles
        .filter((p) => {
          const pLang = String(p.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
          const pPeriod = String(p.period || 'pre_test').toLowerCase();
          return pLang === language && pPeriod === period;
        })
        .map((p) => [p.id, p])
    );

    return filteredStudents.map((student) => {
      const existing = profileMap.get(student.id);
      if (existing) return existing;
      return {
        ...student,
        language,
        period,
        status: 'not_started',
        independentLevel: null,
        instructionalLevel: null,
        frustrationalLevel: null,
      };
    });
  }, [profiles, filteredStudents, period, language]);

  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set([
      ...students.map((s) => s.grade),
      ...sections.map((section) => section.grade),
    ].filter(Boolean))).sort((a, b) => {
      const numA = Number(String(a).match(/\d+/)?.[0] || 0);
      const numB = Number(String(b).match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
    return ['All', ...grades];
  }, [students, sections]);

  // Stage 2 Completed vs In Progress Profiles
  const finalizedProfiles = scopedProfiles.filter((p) => String(p.status || '').toLowerCase() === 'completed');
  const inProgressProfiles = scopedProfiles.filter((p) => String(p.status || '').toLowerCase() !== 'completed');

  // Distribution across Independent, Instructional, Frustration
  const distribution = useMemo(() => {
    return BOUNDARIES.map(([label, key, color, barBg, textColor, badgeBg]) => {
      const byGrade = finalizedProfiles.reduce((counts, p) => {
        const current = gradeLabel(p[key]);
        if (current !== '—') {
          counts[current] = (counts[current] || 0) + 1;
        }
        return counts;
      }, {});

      const totalCount = Object.values(byGrade).reduce((sum, c) => sum + c, 0);

      return {
        label,
        key,
        color,
        barBg,
        textColor,
        badgeBg,
        totalCount,
        byGrade,
      };
    });
  }, [finalizedProfiles]);

  const gradesInDistribution = language === 'en' ? [2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];

  // Section workflow monitoring: GST completion and oral adaptive progress.
  const sectionMonitoring = useMemo(() => {
    const groups = {};
    const gstBySection = new Map();

    // A section can have resubmitted GST forms. Use its largest recorded learner count,
    // rather than adding old submissions together.
    gstSubmissions
      .filter((submission) => {
        const submissionLanguage = String(submission.test_language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
        return submissionLanguage === language;
      })
      .forEach((submission) => {
        const key = `${submission.grade_level}::${submission.section_name}`;
        const assessed = Number(submission.total_assessed || 0);
        gstBySection.set(key, Math.max(gstBySection.get(key) || 0, assessed));
      });

    sections
      .filter((section) => selectedGrade === 'All' || section.grade === selectedGrade)
      .forEach((section) => {
        const key = `${section.grade}::${section.section}`;
        groups[key] = {
          grade: section.grade,
          section: section.section,
          enrolled: 0,
          finalized: 0,
          inProgress: 0,
          notStarted: 0,
          gstAssessed: gstBySection.get(key) ?? null,
        };
      });

    scopedProfiles.forEach((p) => {
      const key = `${p.grade}::${p.section}`;
      if (!groups[key]) {
        groups[key] = {
          grade: p.grade,
          section: p.section,
          enrolled: 0,
          finalized: 0,
          inProgress: 0,
          notStarted: 0,
          gstAssessed: gstBySection.get(key) ?? null,
        };
      }

      groups[key].enrolled += 1;
      const isDone = String(p.status || '').toLowerCase() === 'completed';

      if (isDone) {
        groups[key].finalized += 1;
      } else if (String(p.status || '').toLowerCase() === 'not_started') {
        groups[key].notStarted += 1;
      } else {
        groups[key].inProgress += 1;
      }
    });

    return Object.values(groups).sort((a, b) => {
      const numA = Number(String(a.grade).match(/\d+/)?.[0] || 0);
      const numB = Number(String(b.grade).match(/\d+/)?.[0] || 0);
      if (numA !== numB) return numA - numB;
      return String(a.section).localeCompare(String(b.section));
    });
  }, [scopedProfiles, gstSubmissions, language, sections, selectedGrade]);

  useEffect(() => {
    setSectionPage(1);
  }, [selectedGrade, language, period]);

  const sectionPageCount = Math.max(1, Math.ceil(sectionMonitoring.length / SECTION_PAGE_SIZE));
  const paginatedSections = useMemo(() => {
    const start = (sectionPage - 1) * SECTION_PAGE_SIZE;
    return sectionMonitoring.slice(start, start + SECTION_PAGE_SIZE);
  }, [sectionMonitoring, sectionPage]);
  const sectionRangeStart = sectionMonitoring.length ? ((sectionPage - 1) * SECTION_PAGE_SIZE) + 1 : 0;
  const sectionRangeEnd = Math.min(sectionPage * SECTION_PAGE_SIZE, sectionMonitoring.length);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Page Top Bar */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ChartBar size={22} weight="bold" className="shrink-0 text-brand-red" />
              <h1 className="text-xl font-bold text-ink">Phil-IRI School Analytics & Monitoring</h1>
            </div>
            <p className="mt-0.5 text-xs text-ink/50">
              Comprehensive school-level baseline screening, oral adaptive boundaries, and section reading profiles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-ink/15 bg-cream px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-brand-blue"
            >
              <option value="pre_test">Pre-Test Period</option>
              <option value="post_test">Post-Test Period</option>
            </select>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-ink/15 bg-cream px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-brand-blue"
            >
              <option value="fil">Filipino (Form 1A / 3A)</option>
              <option value="en">English (Form 1B / 3B)</option>
            </select>

          </div>
        </div>

        {loading ? (
          <PhilIriReportsSkeleton />
        ) : (
          <>
        <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">Phil-IRI Oral Adaptive Diagnostic Distribution</h2>
              <p className="text-xs text-ink/60">
                Evaluation results across Independent, Instructional, and Frustrational grade boundaries
              </p>
            </div>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink/70">
              {finalizedProfiles.length} Finalized • {inProgressProfiles.length} In Progress
            </span>
          </div>

          {/* 3 Boundary Distribution Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {distribution.map((b) => (
              <div key={b.label} className="rounded-xl border border-ink/10 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${b.badgeBg}`}>
                    {b.label} Level
                  </span>
                  <span className="text-base font-bold text-ink">{b.totalCount} Learners</span>
                </div>

                <div className="space-y-2 pt-1">
                  {gradesInDistribution.map((gradeNum) => {
                    const count = b.byGrade[`Grade ${gradeNum}`] || 0;
                    const pct = finalizedProfiles.length
                      ? Math.round((count / finalizedProfiles.length) * 100)
                      : 0;

                    return (
                      <div key={gradeNum} className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-semibold text-ink/60">Grade {gradeNum}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
                          <div
                            className={`h-full rounded-full transition-all ${b.barBg}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-bold text-ink">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section Master Monitoring Table ── */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">Section Phil-IRI Master Monitoring & Progress</h2>
              <p className="text-xs text-ink/60">
                Grade and section breakdown of Phil-IRI assessment progress and learner evaluation status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Funnel size={16} className="text-ink/60" />
              <span className="text-xs font-semibold text-ink/70">Filter Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rounded Table Card Wrapper */}
          <div className="rounded-2xl border border-ink/10 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.03] text-[10px] uppercase tracking-wider text-ink/60 font-bold">
                    <th className="p-3">Section</th>
                    <th className="p-3 text-center">Enrolled</th>
                    <th className="p-3 text-center">GST Completed</th>
                    <th className="p-3 text-center">Not Started</th>
                    <th className="p-3 text-center">Adaptive In Progress</th>
                    <th className="p-3 text-center">Finalized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-ink/50">
                        Loading school monitoring analytics...
                      </td>
                    </tr>
                  ) : sectionMonitoring.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-ink/50">
                        No section assessment data found for this selection.
                      </td>
                    </tr>
                  ) : (
                    paginatedSections.map((sec) => {
                      return (
                        <tr key={`${sec.grade}-${sec.section}`} className="hover:bg-ink/[0.02] transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-ink">{sec.section}</p>
                            <p className="mt-0.5 text-[10px] font-medium text-ink/55">{sec.grade}</p>
                          </td>

                          <td className="p-3 text-center font-bold text-ink">
                            {sec.enrolled || '—'}
                          </td>

                          <td className="p-3 text-center">
                            {sec.enrolled === 0 || sec.gstAssessed === null ? (
                              <span className="font-bold text-ink/40">—</span>
                            ) : (
                              <span className="font-bold text-ink">{Math.min(sec.gstAssessed, sec.enrolled)} / {sec.enrolled}</span>
                            )}
                          </td>

                          <td className="p-3 text-center font-bold text-ink">
                            {sec.enrolled ? sec.notStarted : '—'}
                          </td>

                          <td className="p-3 text-center font-bold text-ink">
                            {sec.enrolled ? sec.inProgress : '—'}
                          </td>

                          <td className="p-3 text-center font-bold text-ink">
                            {sec.enrolled ? sec.finalized : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - shown only when multiple pages exist or records exceed single page limit */}
            {!loading && sectionMonitoring.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-ink/10 px-4 py-3 gap-3 text-xs text-ink/60 bg-ink/[0.01]">
                <span>
                  Showing {sectionRangeStart} to {sectionRangeEnd} of {sectionMonitoring.length} section records
                </span>

                {sectionPageCount > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSectionPage((current) => Math.max(1, current - 1))}
                      disabled={sectionPage === 1}
                      className="flex items-center gap-1 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium text-ink/60 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      <CaretLeft size={14} /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {getCompactPageItems(sectionPageCount, sectionPage).map((pg, index) =>
                        pg === 'ellipsis' ? (
                          <span key={`ellipsis-${index}`} className="flex size-7 items-center justify-center text-xs font-bold text-ink/45" aria-hidden="true">
                            …
                          </span>
                        ) : (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setSectionPage(pg)}
                            className={`size-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              sectionPage === pg
                                ? 'bg-brand-blue text-white shadow-xs'
                                : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                            }`}
                          >
                            {pg}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSectionPage((current) => Math.min(sectionPageCount, current + 1))}
                      disabled={sectionPage === sectionPageCount}
                      className="flex items-center gap-1 rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium text-ink/60 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      Next <CaretRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </div>
    </>
  );
}
