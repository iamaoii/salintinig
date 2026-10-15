import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StatCard from './StatCard.jsx';
import { getToken } from '../../../lib/auth.js';
import { cacheService } from '../../../services/cacheService.js';
import {
  getAccuracyInterpretation,
  getComprehensionInterpretation,
  getReadingSpeedInterpretation,
  getProfileCompletionInterpretation,
} from '../../../utils/readingAnalyticsHelper.js';

export default function ClassProgressPanel() {
  const cachedStats = cacheService.get('teacher_class_progress_stats');
  const [loading, setLoading] = useState(!cachedStats);
  const [stats, setStats] = useState(() => cachedStats || {
    boundaries: { frustration: 0, instructional: 0, independent: 0 },
    distributions: { frustration: {}, instructional: {}, independent: {} },
    completedProfiles: 0,
    totalStudents: 0,
    averageAccuracy: 0,
    averageComprehension: 0,
    averageReadingSpeed: 0,
    priorityStudents: 0,
    lastUpdate: 'No assessments yet',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const language = searchParams.get('language') || 'fil';
  const period = searchParams.get('period') || 'pre_test';
  const [selectedBoundary, setSelectedBoundary] = useState('independent');
  const updateProfileFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  useEffect(() => {
    async function fetchProgressStats() {
      try {
        // The Masterlist/Dashboard already warm this roster cache. Reusing it
        // avoids a second, expensive class-students request just for analytics.
        const cachedStudents = cacheService.get('teacher_class_students');
        let data = null;
        if (Array.isArray(cachedStudents)) {
          data = { success: true, students: cachedStudents };
        } else {
          const token = getToken();
          const res = await fetch(getApiUrl('/api/teacher/class-students'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          data = await res.json();
          if (res.ok && data.success && Array.isArray(data.students)) {
            cacheService.set('teacher_class_students', data.students);
          }
        }
        if (data?.success && Array.isArray(data.students)) {
          const targetList = data.students;

          // An adaptive Oral profile has three boundaries. Do not collapse a
          // learner into only one of Independent / Instructional / Frustrational.
          let frustration = 0;
          let instructional = 0;
          let independent = 0;
          let totalAccuracy = 0;
          let accCount = 0;
          let totalSpeed = 0;
          let speedCount = 0;
          let totalComp = 0;
          let compCount = 0;
          let completedProfiles = 0;
          const distributions = { frustration: {}, instructional: {}, independent: {} };
          const normalizeLanguage = (value) => String(value || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
          const formatLevel = (value) => {
            if (!value) return null;
            const number = String(value).match(/\d+/)?.[0];
            return number ? `Grade ${number}` : String(value);
          };

          targetList.forEach((st) => {
            const profile = (st.oralAdaptiveProfiles || []).find((entry) =>
              normalizeLanguage(entry.language) === language && String(entry.period || 'pre_test').toLowerCase() === period
            );
            const metrics = (st.oralProfileMetrics || []).find((entry) =>
              normalizeLanguage(entry.language) === language && String(entry.period || 'pre_test').toLowerCase() === period
            );
            const boundaries = [
              ['independent', profile?.independentLevel],
              ['instructional', profile?.instructionalLevel],
              ['frustration', profile?.frustrationalLevel],
            ];
            boundaries.forEach(([key, value]) => {
              const grade = formatLevel(value);
              if (!grade) return;
              if (key === 'independent') independent++;
              if (key === 'instructional') instructional++;
              if (key === 'frustration') frustration++;
              distributions[key][grade] = (distributions[key][grade] || 0) + 1;
            });
            if (profile?.independentLevel && profile?.instructionalLevel && profile?.frustrationalLevel) {
              completedProfiles++;
            }

            const acc = Number(metrics?.accuracy ?? 0);
            if (acc > 0) {
              totalAccuracy += acc;
              accCount++;
            }

            const spd = Number(metrics?.speed ?? 0);
            if (spd > 0) {
              totalSpeed += spd;
              speedCount++;
            }

            const comp = Number(metrics?.comprehension ?? 0);
            if (comp > 0) {
              totalComp += comp;
              compCount++;
            }
          });

          const avgAcc = accCount > 0 ? Math.round(totalAccuracy / accCount) : 0;
          const avgSpd = speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0;
          const avgCmp = compCount > 0 ? Math.round(totalComp / compCount) : 0;

          const newStats = {
            boundaries: { frustration, instructional, independent },
            distributions,
            completedProfiles,
            totalStudents: targetList.length,
            averageAccuracy: avgAcc,
            averageReadingSpeed: avgSpd,
            averageComprehension: avgCmp,
            priorityStudents: frustration,
          };
          setStats(newStats);
          cacheService.set('teacher_class_progress_stats', newStats);
        }
        setLoading(false);
      } catch (err) {
        console.warn('Class progress stats fetch notice:', err);
        setLoading(false);
      }
    }
    fetchProgressStats();
  }, [language, period]);

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Icon icon="ph:presentation-chart" className="size-6 text-brand-red" />
          <h3 className="text-base font-bold text-ink">Class Progress Dashboard</h3>
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl bg-ink/5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        </div>
      </div>
    );
  }

  // Existing browsers may still hold the previous cached shape, which had no
  // adaptive-boundary distributions. Keep rendering safe until fresh data wins.
  const safeDistributions = stats.distributions || { frustration: {}, instructional: {}, independent: {} };
  const boundaryConfig = {
    independent: {
      label: 'Independent',
      color: 'bg-emerald-500',
      active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tag: 'Self-Reliant Passages',
      explanation: 'Highest passage difficulty learners read on their own with ease (≥97% word accuracy & ≥80% comprehension).',
    },
    instructional: {
      label: 'Instructional',
      color: 'bg-amber-400',
      active: 'bg-amber-50 text-amber-900 border-amber-200',
      tag: 'Guided Teaching Passages',
      explanation: 'Passage difficulty best suited for teacher-guided daily instruction (90-96% word accuracy & 59-79% comprehension).',
    },
    frustration: {
      label: 'Frustrational',
      color: 'bg-rose-500',
      active: 'bg-rose-50 text-rose-800 border-rose-200',
      tag: 'Diagnostic Difficulty Ceilings',
      explanation: 'Passage difficulty where reading breaks down (<90% accuracy or ≤58% comprehension), marking their diagnostic ceiling.',
    },
  };
  const selectedBoundaryConfig = boundaryConfig[selectedBoundary];

  // In SalinTinig, passages are leveled from Grade 1 to 7.
  // We clearly label these as "Reading Passage Levels" so teachers/panelists know
  // they represent text difficulty levels tested, not different enrolled sections.
  const enrolledGradeNum = 4; // Target class grade level
  const supportedGrades = language === 'en' ? [2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
  const gradeDistribution = supportedGrades.map((gradeNumber) => {
    const rawGradeKey = `Grade ${gradeNumber}`;
    const count = Number(safeDistributions[selectedBoundary]?.[rawGradeKey] || 0);

    let levelTag = '';
    if (gradeNumber === enrolledGradeNum) {
      levelTag = 'At Grade 4 Level';
    } else if (gradeNumber < enrolledGradeNum) {
      levelTag = 'Below Grade 4';
    } else {
      levelTag = 'Above Grade 4';
    }

    return {
      gradeNumber,
      displayLabel: `Level ${gradeNumber} Passage`,
      levelTag,
      count,
    };
  });
  const maxGradeCount = Math.max(...gradeDistribution.map((entry) => entry.count), 1);

  // Compute descriptive interpretations for class metrics
  const accuracyInfo = getAccuracyInterpretation(stats.averageAccuracy);
  const compInfo = getComprehensionInterpretation(stats.averageComprehension);
  const speedInfo = getReadingSpeedInterpretation(stats.averageReadingSpeed);
  const completionInfo = getProfileCompletionInterpretation(stats.completedProfiles, stats.totalStudents);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Icon icon="ph:presentation-chart" className="size-6 text-brand-red" />
        <h3 className="text-base font-bold text-ink">Class Progress Dashboard</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={period}
          onChange={(event) => updateProfileFilter('period', event.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-xs font-semibold text-ink outline-none transition-colors focus:border-brand-blue"
          aria-label="Assessment period"
        >
          <option value="pre_test">Pre-Test</option>
          <option value="post_test">Post-Test</option>
        </select>
        <select
          value={language}
          onChange={(event) => updateProfileFilter('language', event.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-xs font-semibold text-ink outline-none transition-colors focus:border-brand-blue"
          aria-label="Assessment language"
        >
          <option value="fil">Filipino</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-3.5">
        <div>
          <p className="text-xs font-bold text-ink">Reading Passage Difficulty Distribution</p>
          <p className="text-[10px] text-ink/55">Phil-IRI passage levels mastered by Grade 4 learners</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-ink/[0.03] p-1">
          {Object.entries(boundaryConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedBoundary(key)}
              className={`rounded-md border px-1.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer ${
                selectedBoundary === key ? config.active : 'border-transparent text-ink/55 hover:bg-white hover:text-ink'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {gradeDistribution.map(({ gradeNumber, displayLabel, levelTag, count }) => {
            const isEnrolledGrade = gradeNumber === enrolledGradeNum;
            return (
              <div key={displayLabel} className="grid grid-cols-[125px_1fr_24px] items-center gap-3 text-[10px]">
                <div className="flex flex-col justify-center leading-tight min-w-0 pr-1">
                  <span className={`truncate text-[11px] ${isEnrolledGrade ? 'font-extrabold text-ink' : 'font-semibold text-ink/80'}`}>
                    {displayLabel}
                  </span>
                  <span className={`text-[9px] mt-0.5 truncate ${isEnrolledGrade ? 'font-bold text-brand-blue' : 'text-ink/45'}`}>
                    {levelTag}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink/[0.08]">
                  {count > 0 && (
                    <div
                      className={`h-full rounded-full ${selectedBoundaryConfig.color} transition-all duration-300`}
                      style={{ width: `${(count / maxGradeCount) * 100}%` }}
                    />
                  )}
                </div>
                <span className={`text-right font-bold text-ink ${isEnrolledGrade ? 'text-[11px] font-black' : 'text-[10px] text-ink/75'}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          value={stats.averageAccuracy}
          unit="%"
          label={'Average\nAccuracy'}
          iconName="ph:target"
          iconBg="bg-[#DBEAFE] text-[#2563EB]"
          badge={accuracyInfo.badge}
          badgeColor={accuracyInfo.color}
          scale={accuracyInfo.scale}
          description={accuracyInfo.description}
          compact
        />
        <StatCard
          value={`${stats.completedProfiles || 0}${stats.totalStudents ? ` / ${stats.totalStudents}` : ''}`}
          label={'Complete Adaptive\nProfiles'}
          iconName="ph:check-circle"
          iconBg="bg-violet-100 text-violet-700"
          badge={completionInfo.badge}
          badgeColor={completionInfo.color}
          progressPct={completionInfo.pct}
          description={completionInfo.description}
          compact
        />
        <StatCard
          value={stats.averageReadingSpeed}
          unit="wps"
          label={'Average\nReading Speed'}
          iconName="ph:lightning"
          iconBg="bg-[#FEF08A] text-[#CA8A04]"
          badge={speedInfo.badge}
          badgeColor={speedInfo.color}
          scale={speedInfo.scale}
          description={speedInfo.description}
          compact
        />
        <StatCard
          value={stats.averageComprehension}
          unit="%"
          label={'Average\nComprehension'}
          iconName="ph:lightbulb"
          iconBg="bg-[#D1FAE5] text-[#059669]"
          badge={compInfo.badge}
          badgeColor={compInfo.color}
          scale={compInfo.scale}
          description={compInfo.description}
          compact
        />
      </div>
    </div>
  );
}
