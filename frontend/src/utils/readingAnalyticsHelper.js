/**
 * readingAnalyticsHelper.js
 * Standardized Phil-IRI descriptive interpretation utility for numerical analytics.
 * Categorizes and qualifies Accuracy, Comprehension, and Reading Speed according
 * to DepEd Phil-IRI criteria and pedagogical norms.
 */

export function getAccuracyInterpretation(accuracy) {
  const val = Number(accuracy) || 0;
  if (val === 0) {
    return {
      level: 'Pending',
      badge: 'No Data Yet',
      category: 'neutral',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      textColor: 'text-slate-700',
      pct: 0,
      description: 'Assessment in progress. Awaiting reviewed oral reading trials.',
      scale: [
        { label: 'Frust. (<90%)', active: false, color: 'bg-rose-400' },
        { label: 'Inst. (90-96%)', active: false, color: 'bg-amber-400' },
        { label: 'Indep. (≥97%)', active: false, color: 'bg-emerald-500' },
      ],
    };
  }

  if (val >= 97) {
    return {
      level: 'Independent',
      badge: 'Independent / Mastery',
      category: 'independent',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      textColor: 'text-emerald-700',
      pct: val,
      description: 'Fluent word reading. Demonstrates high decoding accuracy with minimal miscues.',
      scale: [
        { label: 'Frust.\n(<90%)', active: false, color: 'bg-rose-200' },
        { label: 'Inst.\n(90-96%)', active: false, color: 'bg-amber-200' },
        { label: 'Indep.\n(≥97%)', active: true, color: 'bg-emerald-500' },
      ],
    };
  }

  if (val >= 90) {
    return {
      level: 'Instructional',
      badge: 'Instructional (Acceptable)',
      category: 'instructional',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      textColor: 'text-amber-700',
      pct: val,
      description: 'Acceptable word recognition. Benefits from targeted phonics and word-study practice.',
      scale: [
        { label: 'Frust.\n(<90%)', active: false, color: 'bg-rose-200' },
        { label: 'Inst.\n(90-96%)', active: true, color: 'bg-amber-500' },
        { label: 'Indep.\n(≥97%)', active: false, color: 'bg-emerald-200' },
      ],
    };
  }

  return {
    level: 'Frustration',
    badge: 'Frustration (Needs Support)',
    category: 'frustration',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    textColor: 'text-rose-700',
    pct: val,
    description: 'Frequent oral reading miscues. Requires structured phonics and guided remedial support.',
    scale: [
      { label: 'Frust.\n(<90%)', active: true, color: 'bg-rose-500' },
      { label: 'Inst.\n(90-96%)', active: false, color: 'bg-amber-200' },
      { label: 'Indep.\n(≥97%)', active: false, color: 'bg-emerald-200' },
    ],
  };
}

export function getComprehensionInterpretation(comprehension) {
  const val = Number(comprehension) || 0;
  if (val === 0) {
    return {
      level: 'Pending',
      badge: 'No Data Yet',
      category: 'neutral',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      textColor: 'text-slate-700',
      pct: 0,
      description: 'Assessment in progress. Awaiting passage question responses.',
      scale: [
        { label: 'Frust.\n(≤58%)', active: false, color: 'bg-rose-400' },
        { label: 'Inst.\n(59-79%)', active: false, color: 'bg-amber-400' },
        { label: 'Indep.\n(≥80%)', active: false, color: 'bg-emerald-500' },
      ],
    };
  }

  if (val >= 80) {
    return {
      level: 'Independent',
      badge: 'Independent / Strong',
      category: 'independent',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      textColor: 'text-emerald-700',
      pct: val,
      description: 'Strong passage comprehension with thorough retention across key story elements.',
      scale: [
        { label: 'Frust.\n(≤58%)', active: false, color: 'bg-rose-200' },
        { label: 'Inst.\n(59-79%)', active: false, color: 'bg-amber-200' },
        { label: 'Indep.\n(≥80%)', active: true, color: 'bg-emerald-500' },
      ],
    };
  }

  if (val >= 59) {
    return {
      level: 'Instructional',
      badge: 'Instructional (Acceptable)',
      category: 'instructional',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      textColor: 'text-amber-700',
      pct: val,
      description: 'Solid literal comprehension. Benefits from teacher guidance on inferential questions.',
      scale: [
        { label: 'Frust.\n(≤58%)', active: false, color: 'bg-rose-200' },
        { label: 'Inst.\n(59-79%)', active: true, color: 'bg-amber-500' },
        { label: 'Indep.\n(≥80%)', active: false, color: 'bg-emerald-200' },
      ],
    };
  }

  return {
    level: 'Frustration',
    badge: 'Frustration (Critical Need)',
    category: 'frustration',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    textColor: 'text-rose-700',
    pct: val,
    description: 'Difficulty recalling passage details. Requires pre-reading schema and chunked checks.',
    scale: [
      { label: 'Frust.\n(≤58%)', active: true, color: 'bg-rose-500' },
      { label: 'Inst.\n(59-79%)', active: false, color: 'bg-amber-200' },
      { label: 'Indep.\n(≥80%)', active: false, color: 'bg-emerald-200' },
    ],
  };
}

export function getReadingSpeedInterpretation(speed) {
  const val = Number(speed) || 0;
  if (val === 0) {
    return {
      level: 'Pending',
      badge: 'No Data Yet',
      category: 'neutral',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      textColor: 'text-slate-700',
      description: 'Awaiting timed oral reading passages.',
      scale: [
        { label: 'Slow', active: false, color: 'bg-amber-200' },
        { label: 'Grade Norm', active: false, color: 'bg-emerald-200' },
        { label: 'Fast', active: false, color: 'bg-blue-200' },
      ],
    };
  }

  const effectiveWpm = val < 10 ? Math.round(val * 60) : val;

  if (effectiveWpm >= 80 && effectiveWpm <= 125) {
    return {
      level: 'Norm',
      badge: 'At Grade Norm (Fluent)',
      category: 'norm',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      textColor: 'text-emerald-700',
      description: 'Pacing is on target. Maintains a steady reading tempo with natural expression.',
      scale: [
        { label: 'Slow\n(<80)', active: false, color: 'bg-amber-200' },
        { label: 'Norm\n(80-125)', active: true, color: 'bg-emerald-500' },
        { label: 'Fast\n(>125)', active: false, color: 'bg-blue-200' },
      ],
    };
  }

  if (effectiveWpm < 80) {
    return {
      level: 'Developing',
      badge: 'Developing (Slow Pacing)',
      category: 'slow',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      textColor: 'text-amber-700',
      description: 'Hesitant reading pace. Repeated oral reading is recommended to build fluency.',
      scale: [
        { label: 'Slow\n(<80)', active: true, color: 'bg-amber-500' },
        { label: 'Norm\n(80-125)', active: false, color: 'bg-emerald-200' },
        { label: 'Fast\n(>125)', active: false, color: 'bg-blue-200' },
      ],
    };
  }

  return {
    level: 'Rapid',
    badge: 'Rapid Pacing',
    category: 'fast',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    textColor: 'text-blue-700',
    description: 'Fast reading pace. Ensure phrasing and punctuation awareness are maintained.',
    scale: [
      { label: 'Slow\n(<80)', active: false, color: 'bg-amber-200' },
      { label: 'Norm\n(80-125)', active: false, color: 'bg-emerald-200' },
      { label: 'Fast\n(>125)', active: true, color: 'bg-blue-500' },
    ],
  };
}

export function getProfileCompletionInterpretation(completedCount, totalCount) {
  const completed = Number(completedCount) || 0;
  const total = Number(totalCount) || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) {
    return {
      badge: 'No Enrolled Learners',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Awaiting student roster data for this section.',
      pct: 0,
    };
  }

  if (pct >= 85) {
    return {
      badge: `${pct}% Ready for Evaluation`,
      color: 'bg-violet-50 text-violet-800 border-violet-200',
      description: 'Optimal class profiling. Sufficient assessment data to group learners for intervention.',
      pct,
    };
  }

  if (pct >= 50) {
    return {
      badge: `${pct}% Moderately Profiled`,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      description: 'Diagnostic profiling in progress. Over half of class has completed assessment.',
      pct,
    };
  }

  return {
    badge: `${pct}% Screening Incomplete`,
    color: 'bg-amber-50 text-amber-900 border-amber-200',
    description: 'Early diagnostic stage. Prioritize finalizing remaining learner trials.',
    pct,
  };
}
