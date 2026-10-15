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
import { getCompactPageItems } from '../../lib/pagination.js';

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

  // Aggregated analytical insights for school-level educational decision-making
  const schoolAnalyticsSummary = useMemo(() => {
    const totalScoped = scopedProfiles.length || 1;
    const finalizedCount = finalizedProfiles.length;
    const inProgressCount = inProgressProfiles.length;
    const coveragePct = Math.round((finalizedCount / totalScoped) * 100);

    const langTitle = language === 'en' ? 'English (Form 1B/3B)' : 'Filipino (Form 1A/3A)';
    const periodTitle = period === 'post_test' ? 'Post-Test' : 'Pre-Test';

    // GST screening aggregate data
    const relevantGst = (gstSubmissions || []).filter((sub) => {
      const subLang = String(sub.test_language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
      return subLang === language && (selectedGrade === 'All' || sub.grade_level === selectedGrade);
    });
    const totalGstAssessed = relevantGst.reduce((sum, s) => sum + Number(s.total_assessed || 0), 0);
    const totalGstBelow14 = relevantGst.reduce((sum, s) => sum + Number(s.below_14_count || 0), 0);
    const totalGstAbove14 = relevantGst.reduce((sum, s) => sum + Number(s.above_14_count || 0), 0);
    const gstAtRiskPct = totalGstAssessed > 0 ? Math.round((totalGstBelow14 / totalGstAssessed) * 100) : null;

    if (finalizedCount === 0) {
      return {
        hasData: false,
        coveragePct,
        diagnosticBullets: [
          {
            label: 'Screening Pipeline Status',
            text: `${inProgressCount} active learner profile${inProgressCount === 1 ? '' : 's'} registered in ${periodTitle} for ${langTitle}. Stage 2 oral assessment passages are currently ongoing.`,
          },
          ...(totalGstAssessed > 0 ? [{
            label: 'GST Initial Screening Baseline',
            text: `${totalGstAssessed} learners screened in Stage 1 GST: ${totalGstBelow14} scored <14 (${gstAtRiskPct}%) requiring Stage 2 oral diagnostic passage administration.`,
          }] : [{
            label: 'Baseline Screening Notice',
            text: 'Awaiting completion of Stage 1 Group Screening Test (GST) or first finalized oral passage evaluations.',
          }]),
        ],
        directiveBullets: [
          {
            label: 'Immediate Assessment Target',
            text: `Prioritize administering Stage 2 oral passages to students identified with screening scores below 14 in ${selectedGrade === 'All' ? 'all enrolled cohorts' : selectedGrade}.`,
          },
          {
            label: 'Monitoring Directive',
            text: 'Ensure subject teachers submit verified oral recording scores to populate reading boundary distributions.',
          },
        ],
      };
    }

    // Dynamic Level Distributions and Niche Metrics
    const indCounts = {};
    const instCounts = {};
    const frustCounts = {};
    const sectionFinalizedCounts = {};
    let steppedUpCount = 0;
    let steppedDownCount = 0;
    let readingAtOrAboveGradeCount = 0;
    let readingBelowGradeCount = 0;

    finalizedProfiles.forEach((p) => {
      const indGrade = gradeLabel(p.independentLevel);
      if (indGrade !== '—') indCounts[indGrade] = (indCounts[indGrade] || 0) + 1;

      const instGrade = gradeLabel(p.instructionalLevel);
      if (instGrade !== '—') instCounts[instGrade] = (instCounts[instGrade] || 0) + 1;

      const frustGrade = gradeLabel(p.frustrationalLevel);
      if (frustGrade !== '—') frustCounts[frustGrade] = (frustCounts[frustGrade] || 0) + 1;

      const sKey = `${p.grade} - ${p.section}`;
      sectionFinalizedCounts[sKey] = (sectionFinalizedCounts[sKey] || 0) + 1;

      // Extract numeric grades to detect if learner reads below or at/above their enrolled grade
      const enrolledNum = Number(String(p.grade || p.baselineGradeLevel || '').match(/\d+/)?.[0] || 0);
      const indNum = Number(String(p.independentLevel || '').match(/\d+/)?.[0] || 0);
      const instNum = Number(String(p.instructionalLevel || '').match(/\d+/)?.[0] || 0);
      const bestLevel = Math.max(indNum, instNum);

      if (enrolledNum > 0 && bestLevel > 0) {
        if (bestLevel >= enrolledNum) {
          readingAtOrAboveGradeCount += 1;
        } else {
          readingBelowGradeCount += 1;
        }
      }

      // Check adaptive stepping movement from baseline
      const baseNum = Number(String(p.baselineGradeLevel || p.grade || '').match(/\d+/)?.[0] || 0);
      if (baseNum > 0 && indNum > 0) {
        if (indNum > baseNum) steppedUpCount += 1;
        else if (indNum < baseNum) steppedDownCount += 1;
      }
    });

    const sortEntries = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const topIndEntries = sortEntries(indCounts);
    const topInstEntries = sortEntries(instCounts);
    const topFrustEntries = sortEntries(frustCounts);

    const predominantInd = topIndEntries[0] ? topIndEntries[0][0] : 'Level 3';
    const indCount = topIndEntries[0] ? topIndEntries[0][1] : 0;
    const indPct = Math.round((indCount / finalizedCount) * 100);

    const predominantInst = topInstEntries[0] ? topInstEntries[0][0] : 'Level 4';
    const instCount = topInstEntries[0] ? topInstEntries[0][1] : 0;
    const instPct = Math.round((instCount / finalizedCount) * 100);

    const predominantFrust = topFrustEntries[0] ? topFrustEntries[0][0] : null;
    const frustCount = topFrustEntries[0] ? topFrustEntries[0][1] : 0;
    const frustPct = Math.round((frustCount / finalizedCount) * 100);

    // Dynamic numeric level extraction to measure cohort spread
    const getNum = (str) => Number(String(str || '').match(/\d+/)?.[0] || 0);
    const indNum = getNum(predominantInd);
    const instNum = getNum(predominantInst);
    const frustNum = getNum(predominantFrust);

    // Section distribution leader and lagging section
    const sortedSections = Object.entries(sectionFinalizedCounts).sort((a, b) => b[1] - a[1]);
    const topSection = sortedSections[0] ? `${sortedSections[0][0]}` : null;
    const laggingSection = sortedSections.length > 1 ? sortedSections[sortedSections.length - 1][0] : null;

    // --- Dynamic Teacher-Friendly Reading Overview with Niche Insights ---
    const diagnosticBullets = [];

    // 1. Independent reading level insight
    diagnosticBullets.push({
      label: 'Reading on Their Own (Independent)',
      text: indCount > 0
        ? `Most independent readers are comfortably reading at ${predominantInd} (${indPct}% of assessed learners). They read smoothly and understand stories with little to no teacher assistance.`
        : 'Students are currently reading with teacher guidance; independent reading levels are being determined through higher passage trials.',
    });

    // 2. Guided classroom reading level insight
    diagnosticBullets.push({
      label: 'Guided Classroom Level (Instructional)',
      text: instCount > 0
        ? `Classroom lessons are best focused at ${predominantInst} (${instPct}% of assessed learners). Students understand well when guided by their teacher during class discussions.`
        : 'Whole-class guided reading passage levels will settle as more students finish their oral reading assessments.',
    });

    // 3. Frustration difficulty boundary insight
    if (predominantFrust && frustCount > 0) {
      diagnosticBullets.push({
        label: 'Needs Extra Reading Support (Frustration)',
        text: `Learners begin to encounter reading difficulty when reaching ${predominantFrust} passages (${frustPct}% of assessed learners). Extra practice and patience are helpful at this level.`,
      });
    }

    // 4. Niche Insight: Grade-level alignment comparison
    if (readingAtOrAboveGradeCount > 0 || readingBelowGradeCount > 0) {
      const atOrAbovePct = Math.round((readingAtOrAboveGradeCount / (readingAtOrAboveGradeCount + readingBelowGradeCount)) * 100);
      diagnosticBullets.push({
        label: 'Grade-Level Reading Readiness',
        text: atOrAbovePct >= 70
          ? `Strong cohort performance: ${atOrAbovePct}% of evaluated students are reading at or above their enrolled grade level.`
          : `${atOrAbovePct}% of students are reading at their enrolled grade level, while ${100 - atOrAbovePct}% need guided support with lower passage levels.`,
      });
    }

    // 5. Niche Insight: Adaptive Stepping & Growth
    if (steppedUpCount > 0) {
      diagnosticBullets.push({
        label: 'Advanced Reading Growth',
        text: `${steppedUpCount} student${steppedUpCount === 1 ? '' : 's'} successfully moved up to read passages higher than their enrolled grade level.`,
      });
    } else if (steppedDownCount > 0) {
      diagnosticBullets.push({
        label: 'Foundational Support Group',
        text: `${steppedDownCount} student${steppedDownCount === 1 ? '' : 's'} were adjusted to lower-level passages to help them read comfortably without frustration.`,
      });
    }

    // --- Dynamic Teacher-Friendly Classroom Teaching Action Items ---
    const directiveBullets = [];

    // Directive 1: Core classroom reading material level
    if (instNum > 0) {
      directiveBullets.push({
        label: 'Classroom Reading Materials',
        text: `Use ${predominantInst} stories and textbooks for regular group reading sessions to keep lessons engaging and manageable for the class.`,
      });
    } else {
      directiveBullets.push({
        label: 'Reading Materials',
        text: 'Select grade-appropriate reading stories for shared classroom reading activities.',
      });
    }

    // Directive 2: Phonics / Remediation strategy customized by grade difficulty
    if (predominantFrust && frustNum > 0) {
      if (frustNum <= 3) {
        directiveBullets.push({
          label: 'Phonics & Word Reading Practice',
          text: `Provide short daily word-sounding and letter-combination practice for students experiencing difficulty with ${predominantFrust} words.`,
        });
      } else {
        directiveBullets.push({
          label: 'Story Comprehension & Vocabulary Help',
          text: `Help students discuss unfamiliar vocabulary and ask guide questions before and after reading ${predominantFrust} stories.`,
        });
      }
    } else {
      directiveBullets.push({
        label: 'Reading Assistance',
        text: 'Offer gentle guidance and word-recognition hints to students when reading unfamiliar words.',
      });
    }

    // Directive 3: Extension for fast readers or confidence building
    if (indNum >= 4 || steppedUpCount > 0) {
      directiveBullets.push({
        label: 'Encouraging Fast Readers',
        text: `Provide fun library books, short stories, or partner-reading activities for students who already read independently at ${predominantInd}.`,
      });
    } else {
      directiveBullets.push({
        label: 'Building Reading Confidence',
        text: 'Encourage daily 10-minute silent or paired reading sessions to help students transition from guided to independent reading.',
      });
    }

    // Directive 4: Section Pacing & Remaining Assessments
    if (coveragePct < 100) {
      const remainingCount = totalScoped - finalizedCount;
      const sectionNote = laggingSection ? ` especially in ${laggingSection}` : '';
      directiveBullets.push({
        label: 'Remaining Assessments',
        text: `Complete the oral reading assessment for the remaining ${remainingCount} student${remainingCount === 1 ? '' : 's'}${sectionNote} to finalize the class reading profile.`,
      });
    } else {
      directiveBullets.push({
        label: 'All Profiles Complete',
        text: `All enrolled students in this group have completed their Phil-IRI reading evaluation. Records are ready for parent conferences and grading.`,
      });
    }

    return {
      hasData: true,
      coveragePct,
      predominantInd,
      predominantInst,
      diagnosticBullets,
      directiveBullets,
    };
  }, [finalizedProfiles, scopedProfiles, inProgressProfiles, gstSubmissions, language, period, selectedGrade]);

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
            {/* ── Executive School-Level Analytical Summary ── */}
            <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                    <ChartBar size={16} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink tracking-tight">Reading Profile Overview & Teaching Suggestions</h2>
                    <p className="text-[11px] text-ink/50">Helpful classroom guidance based on students' Phil-IRI reading assessment results</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    ● {schoolAnalyticsSummary.coveragePct}% Profiling Complete
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 pt-0.5">
                <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 border-b border-ink/5 pb-2">
                    <span className="size-1.5 rounded-full bg-brand-blue" />
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink/60">
                      Student Reading Levels
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-ink/80">
                    {(schoolAnalyticsSummary.diagnosticBullets || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink/40" />
                        <span>
                          <strong className="font-semibold text-ink">{item.label}:</strong> {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 border-b border-ink/5 pb-2">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink/60">
                      Recommended Classroom Actions
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-ink/80">
                    {(schoolAnalyticsSummary.directiveBullets || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink/40" />
                        <span>
                          <strong className="font-semibold text-ink">{item.label}:</strong> {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                <div>
                  <h2 className="text-base font-bold text-ink">Phil-IRI Oral Adaptive Diagnostic Distribution</h2>
                  <p className="text-xs text-ink/60">
                    Evaluation results across Independent, Instructional, and Frustrational passage levels
                  </p>
                </div>
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink/70">
                  {finalizedProfiles.length} Finalized • {inProgressProfiles.length} In Progress
                </span>
              </div>

          {/* 3 Boundary Distribution Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {distribution.map((b) => {
              const boundarySubtitles = {
                Independent: 'Mastered reading on their own',
                Instructional: 'Optimal for teacher-guided reading',
                Frustrational: 'Reached reading difficulty ceiling',
              };

              return (
                <div key={b.label} className="rounded-xl border border-ink/10 bg-white p-4 space-y-3.5 shadow-xs">
                  <div className="border-b border-ink/5 pb-2.5">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${b.badgeBg}`}>
                      {b.label} Level
                    </span>
                    <p className="mt-1 text-[11px] text-ink/50 font-medium">
                      {boundarySubtitles[b.label] || 'Learner distribution by passage level'}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-0.5">
                    {gradesInDistribution.map((gradeNum) => {
                      const count = b.byGrade[`Grade ${gradeNum}`] || 0;
                      const pct = finalizedProfiles.length
                        ? Math.round((count / finalizedProfiles.length) * 100)
                        : 0;

                      return (
                        <div key={gradeNum} className="flex items-center gap-3 text-xs">
                          <span className="w-28 font-semibold text-ink/75 truncate">Level {gradeNum} Passage</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${b.barBg}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-7 text-right font-bold text-ink">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
                    <th className="p-3 text-center">
                      <span>Stage 1: GST</span>
                      <span className="block text-[9px] font-normal normal-case text-ink/45">Screening Test</span>
                    </th>
                    <th className="p-3 text-center">
                      <span>Oral: Not Started</span>
                      <span className="block text-[9px] font-normal normal-case text-ink/45">Stage 2 Pending</span>
                    </th>
                    <th className="p-3 text-center">
                      <span>Oral: In Progress</span>
                      <span className="block text-[9px] font-normal normal-case text-ink/45">Trials Ongoing</span>
                    </th>
                    <th className="p-3 text-center">
                      <span>Oral: Finalized</span>
                      <span className="block text-[9px] font-normal normal-case text-ink/45">Profile Complete</span>
                    </th>
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

                          <td className="p-3 text-center font-semibold text-ink/80">
                            {sec.enrolled === 0 || sec.gstAssessed === null ? (
                              <span className="text-ink/40">—</span>
                            ) : (
                              <span>
                                {Math.min(sec.gstAssessed, sec.enrolled)} / {sec.enrolled}
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {sec.enrolled ? (
                              <span className={sec.notStarted > 0 ? 'font-bold text-amber-700' : 'text-ink/40 font-medium'}>
                                {sec.notStarted}
                              </span>
                            ) : '—'}
                          </td>

                          <td className="p-3 text-center">
                            {sec.enrolled ? (
                              <span className={sec.inProgress > 0 ? 'font-bold text-brand-blue' : 'text-ink/40 font-medium'}>
                                {sec.inProgress}
                              </span>
                            ) : '—'}
                          </td>

                          <td className="p-3 text-center">
                            {sec.enrolled ? (
                              sec.finalized === sec.enrolled && sec.enrolled > 0 ? (
                                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  {sec.finalized} Complete
                                </span>
                              ) : (
                                <span className="font-bold text-ink">
                                  {sec.finalized}
                                </span>
                              )
                            ) : '—'}
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
