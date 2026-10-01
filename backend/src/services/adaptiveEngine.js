/**
 * Phil-IRI Phase 2 — Adaptive Assessment Engine
 * Updated to DepEd 2018 Phil-IRI Manual of Administration (Plan v2 Standardization)
 *
 * Implements:
 * - Table 6 Comprehension Percentages & Band Scoring
 * - Oral Reading Score & Word Reading Level
 * - Per-Passage Combined Level: min(WordReadingLevel, ComprehensionLevel)
 * - GST-to-Starting-Passage Level Determination & Language Range Validation
 * - State Machine Transitions & 3-Tier Profile Derivation (Independent, Instructional, Frustration)
 * - Safe Boundary Handling & Infinite Loop Prevention
 * - Backward compatibility with existing callers (computeInitialStep, evaluateNextStep, buildSessionSummary)
 */

/**
 * Language passage ranges from official Phil-IRI bank
 * English: Grade 2 to Grade 7
 * Filipino: Grade 1 to Grade 7
 */
const LANGUAGE_RANGES = {
  en: { min: 2, max: 7, label: 'English' },
  fil: { min: 1, max: 7, label: 'Filipino' },
};

/**
 * Canonical ordered list of Phil-IRI grade levels (lowest → highest).
 */
const GRADE_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
];

const TABLE_6_PERCENTAGES = {
  5: { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20 },
  6: { 6: 100, 5: 83, 4: 67, 3: 50, 2: 33, 1: 17 },
  7: { 7: 100, 6: 86, 5: 71, 4: 57, 3: 43, 2: 29, 1: 14 },
  8: { 8: 100, 7: 88, 6: 75, 5: 63, 4: 50, 3: 38, 2: 25, 1: 13 },
};

/**
 * Normalizes language string to 'en' or 'fil'
 */
function normalizeLanguage(lang) {
  if (!lang) return 'fil';
  const str = String(lang).trim().toLowerCase();
  return str.startsWith('en') ? 'en' : 'fil';
}

/**
 * Extracts integer grade from strings like "Grade 4", "4", "grade-4", etc.
 */
function parseGradeLevel(grade) {
  if (typeof grade === 'number') return grade;
  if (!grade) return null;
  const match = String(grade).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Formats integer grade to "Grade X"
 */
function formatGradeLevel(gradeInt) {
  if (!gradeInt) return null;
  return `Grade ${gradeInt}`;
}

/**
 * Returns the 0-based index of a grade level string, or -1 if not found.
 * Case-insensitive and tolerates minor spacing differences.
 */
function getGradeIndex(level) {
  if (!level) return -1;
  const normalized = String(level).trim();
  return GRADE_LEVELS.findIndex(
    (gl) => gl.toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Word Reading Score = ((words - miscues) / words) * 100
 */
function calculateWordReadingScore(totalWords, miscueCount) {
  const words = Math.max(0, Number(totalWords) || 0);
  const miscues = Math.max(0, Number(miscueCount) || 0);
  if (words <= 0) return 0;
  return Number(((Math.max(0, words - miscues) / words) * 100).toFixed(1));
}

/**
 * Comprehension Score = (correct / total) * 100
 */
function calculateComprehensionScore(correctAnswers, totalQuestions) {
  const correct = Math.max(0, Number(correctAnswers) || 0);
  const total = Number(totalQuestions) || 0;
  if (total <= 0) return 0;
  if (TABLE_6_PERCENTAGES[total] && TABLE_6_PERCENTAGES[total][correct] !== undefined) {
    return TABLE_6_PERCENTAGES[total][correct];
  }
  return Math.round((correct / total) * 100);
}

/**
 * Reading Speed (WPM) = (wordsRead / seconds) * 60
 */
function calculateReadingSpeedWpm(wordsRead, durationSeconds) {
  const words = Math.max(0, Number(wordsRead) || 0);
  const secs = Number(durationSeconds) || 0;
  if (secs <= 0) return 0;
  return Number(((words / secs) * 60).toFixed(1));
}

/**
 * DepEd Word Reading Level:
 * Independent: 97 - 100%
 * Instructional: 90 - 96%
 * Frustration: 89% and below
 */
function getWordReadingLevel(scorePct) {
  const score = Number(scorePct) || 0;
  if (score >= 97) return 'Independent';
  if (score >= 90) return 'Instructional';
  return 'Frustration';
}

/**
 * DepEd Comprehension Level:
 * Independent: 80 - 100%
 * Instructional: 59 - 79%
 * Frustration: 58% and below
 */
function getComprehensionLevel(scorePct) {
  const score = Number(scorePct) || 0;
  if (score >= 80) return 'Independent';
  if (score >= 59) return 'Instructional';
  return 'Frustration';
}

/**
 * Combined Rule (Section A3):
 * Lower of Word Reading & Comprehension.
 * Hierarchy: Independent (highest) > Instructional > Frustration (lowest)
 */
function combinePassageLevel(wordReadingLevel, comprehensionLevel) {
  if (wordReadingLevel === 'Frustration' || comprehensionLevel === 'Frustration') {
    return 'Frustration';
  }
  if (wordReadingLevel === 'Instructional' || comprehensionLevel === 'Instructional') {
    return 'Instructional';
  }
  if (wordReadingLevel === 'Independent' && comprehensionLevel === 'Independent') {
    return 'Independent';
  }
  return 'Frustration';
}

/**
 * Determine Stage 2 Starting Passage and GST Outcome (Section A4)
 * Offset = 3 if GST score 0..7
 * Offset = 2 if GST score 8..13
 * 14+ is GST_NOT_REQUIRED (discontinue testing)
 */
function determineStartingPassage(enrolledGrade, gstRawScore, language = 'fil') {
  const gradeInt = parseGradeLevel(enrolledGrade) || 4;
  const langKey = normalizeLanguage(language);
  const score = Number(gstRawScore);
  const config = LANGUAGE_RANGES[langKey] || LANGUAGE_RANGES.fil;

  if (score >= 14) {
    return {
      gstOutcome: 'GST_NOT_REQUIRED',
      startingGradeLevel: null,
      startingGradeInt: null,
      status: 'GST_NOT_REQUIRED',
      terminalReason: null,
      requiresIndividual: false,
    };
  }

  const offset = score <= 7 ? 3 : 2;
  const startingGrade = gradeInt - offset;

  // Range validation: do not clamp silently
  if (startingGrade < config.min || startingGrade > config.max) {
    return {
      gstOutcome: 'GST_REQUIRES_INDIVIDUAL',
      startingGradeLevel: formatGradeLevel(startingGrade),
      startingGradeInt: startingGrade,
      status: 'NEEDS_REVIEW',
      terminalReason: 'STARTING_POINT_OUT_OF_RANGE',
      requiresIndividual: true,
      errorDetail: `Calculated starting level Grade ${startingGrade} is outside ${config.label} range (Grade ${config.min}-Grade ${config.max}).`,
    };
  }

  return {
    gstOutcome: 'GST_REQUIRES_INDIVIDUAL',
    startingGradeLevel: formatGradeLevel(startingGrade),
    startingGradeInt: startingGrade,
    status: 'IN_PROGRESS',
    terminalReason: null,
    requiresIndividual: true,
  };
}

/**
 * Determine the FIRST grade level to assess in Stage 2.
 * Supports both:
 * 1. DepEd 2018 Phil-IRI Plan v2: (enrolledGrade, gstRawScore, language)
 * 2. Backward compatibility: (enrolledGradeLevel, phase1ProfileLevel)
 */
function computeInitialStep(enrolledGradeLevel, phase1OrGstScore, language = 'fil') {
  // If second parameter is numeric or numeric string (GST raw score):
  if (typeof phase1OrGstScore === 'number' || (!isNaN(Number(phase1OrGstScore)) && phase1OrGstScore !== null && phase1OrGstScore !== '')) {
    const gstRes = determineStartingPassage(enrolledGradeLevel, Number(phase1OrGstScore), language);
    if (!gstRes.requiresIndividual) {
      return {
        firstGradeLevel: enrolledGradeLevel,
        direction: null,
        noPhase2Needed: true,
        atBoundary: false,
        gstOutcome: gstRes.gstOutcome,
        status: gstRes.status,
      };
    }
    return {
      firstGradeLevel: gstRes.startingGradeLevel || enrolledGradeLevel,
      direction: 'stepping_down',
      noPhase2Needed: false,
      atBoundary: gstRes.status === 'NEEDS_REVIEW',
      gstOutcome: gstRes.gstOutcome,
      status: gstRes.status,
      terminalReason: gstRes.terminalReason,
    };
  }

  // Fallback: Phase 1 string profile ('Instructional', 'Frustration', 'Independent')
  const enrolledGrade = String(enrolledGradeLevel || 'Grade 4');
  const phase1ProfileLevel = String(phase1OrGstScore || '');
  const idx = getGradeIndex(enrolledGrade);

  if (phase1ProfileLevel.toLowerCase() === 'instructional') {
    return {
      firstGradeLevel: enrolledGrade,
      direction: null,
      noPhase2Needed: false, // Plan v2: still need full Independent and Frustration levels
      atBoundary: false,
    };
  }

  if (phase1ProfileLevel.toLowerCase() === 'frustration') {
    if (idx <= 0) {
      return {
        firstGradeLevel: GRADE_LEVELS[0],
        direction: 'stepping_down',
        noPhase2Needed: false,
        atBoundary: true,
      };
    }
    return {
      firstGradeLevel: GRADE_LEVELS[idx - 1],
      direction: 'stepping_down',
      noPhase2Needed: false,
      atBoundary: false,
    };
  }

  if (phase1ProfileLevel.toLowerCase() === 'independent') {
    if (idx >= GRADE_LEVELS.length - 1) {
      return {
        firstGradeLevel: GRADE_LEVELS[GRADE_LEVELS.length - 1],
        direction: 'stepping_up',
        noPhase2Needed: false,
        atBoundary: true,
      };
    }
    return {
      firstGradeLevel: GRADE_LEVELS[idx + 1],
      direction: 'stepping_up',
      noPhase2Needed: false,
      atBoundary: false,
    };
  }

  return {
    firstGradeLevel: enrolledGrade,
    direction: null,
    noPhase2Needed: false,
    atBoundary: false,
  };
}

/**
 * Derive 3-Tier Profile (Independent, Instructional, Frustration) from attempts (Section A5.5)
 */
function deriveProfileFromAttempts(attempts = []) {
  const valid = attempts.filter((a) => !a.isVoided);

  const indLevels = valid.filter((a) => a.classification === 'Independent').map((a) => parseGradeLevel(a.gradeLevel)).filter(Boolean);
  const insLevels = valid.filter((a) => a.classification === 'Instructional').map((a) => parseGradeLevel(a.gradeLevel)).filter(Boolean);
  const fruLevels = valid.filter((a) => a.classification === 'Frustration').map((a) => parseGradeLevel(a.gradeLevel)).filter(Boolean);

  // Instructional adjacent to Frustration (OQ-4)
  let instructional = null;
  if (insLevels.length > 0) {
    if (fruLevels.length > 0) {
      const minFru = Math.min(...fruLevels);
      const adj = insLevels.filter((g) => g < minFru);
      instructional = adj.length > 0 ? Math.max(...adj) : Math.max(...insLevels);
    } else {
      instructional = Math.max(...insLevels);
    }
  }

  // Frustration: lowest Frustration level above Instructional (or lowest overall)
  let frustration = null;
  if (fruLevels.length > 0) {
    if (instructional !== null) {
      const aboveIns = fruLevels.filter((g) => g > instructional);
      frustration = aboveIns.length > 0 ? Math.min(...aboveIns) : Math.min(...fruLevels);
    } else {
      frustration = Math.min(...fruLevels);
    }
  }

  // Independent: highest Independent level below Instructional (or highest overall)
  let independent = null;
  if (indLevels.length > 0) {
    if (instructional !== null) {
      const belowIns = indLevels.filter((g) => g < instructional);
      independent = belowIns.length > 0 ? Math.max(...belowIns) : Math.max(...indLevels);
    } else {
      independent = Math.max(...indLevels);
    }
  }

  return {
    independentLevel: independent !== null ? formatGradeLevel(independent) : null,
    instructionalLevel: instructional !== null ? formatGradeLevel(instructional) : null,
    frustrationLevel: frustration !== null ? formatGradeLevel(frustration) : null,
    independentInt: independent,
    instructionalInt: instructional,
    frustrationInt: frustration,
    isComplete: independent !== null && instructional !== null && frustration !== null,
  };
}

/**
 * State Transition Engine (Table A5.3 & A5.4)
 * Evaluates the next search target and state given the latest attempt at grade L.
 */
function evaluateAdaptiveTransition({
  currentState = 'INITIAL_PASSAGE',
  level,
  classification,
  language = 'fil',
  existingAttempts = [],
}) {
  const langKey = normalizeLanguage(language);
  const config = LANGUAGE_RANGES[langKey] || LANGUAGE_RANGES.fil;
  const L = parseGradeLevel(level);

  // Combine latest attempt into history
  const updatedAttempts = [
    ...existingAttempts.filter((a) => parseGradeLevel(a.gradeLevel) !== L),
    { gradeLevel: L, classification, isVoided: false },
  ];

  const profile = deriveProfileFromAttempts(updatedAttempts);

  let nextState = currentState;
  let nextTarget = null;
  let status = 'IN_PROGRESS';
  let terminalReason = null;

  switch (currentState) {
    case 'INITIAL_PASSAGE':
      if (classification === 'Independent') {
        nextState = 'SEARCHING_INSTRUCTIONAL_UP';
        nextTarget = L + 1;
      } else if (classification === 'Instructional') {
        nextState = 'SEARCHING_FRUSTRATION_UP';
        nextTarget = L + 1;
      } else if (classification === 'Frustration') {
        nextState = 'SEARCHING_INSTRUCTIONAL_DOWN';
        nextTarget = L - 1;
      }
      break;

    case 'SEARCHING_INSTRUCTIONAL_UP':
      if (classification === 'Independent') {
        nextState = 'SEARCHING_INSTRUCTIONAL_UP';
        nextTarget = L + 1;
      } else if (classification === 'Instructional') {
        nextState = 'SEARCHING_FRUSTRATION_UP';
        nextTarget = L + 1;
      } else if (classification === 'Frustration') {
        // Adjacent jump
        nextState = 'NO_INSTRUCTIONAL_BETWEEN';
        status = 'TERMINATED';
        terminalReason = 'NO_INSTRUCTIONAL_BETWEEN';
        nextTarget = null;
      }
      break;

    case 'SEARCHING_FRUSTRATION_UP':
      if (classification === 'Frustration') {
        if (profile.independentInt !== null) {
          nextState = 'COMPLETE';
          status = 'COMPLETE';
          nextTarget = null;
        } else {
          nextState = 'SEARCHING_INDEPENDENT_DOWN';
          nextTarget = (profile.instructionalInt || L) - 1;
        }
      } else if (classification === 'Instructional') {
        nextState = 'SEARCHING_FRUSTRATION_UP';
        nextTarget = L + 1;
      } else if (classification === 'Independent') {
        nextState = 'NEEDS_REVIEW';
        status = 'NEEDS_REVIEW';
        terminalReason = 'NON_MONOTONIC_READING_LEVELS';
        nextTarget = null;
      }
      break;

    case 'SEARCHING_INSTRUCTIONAL_DOWN':
      if (classification === 'Frustration') {
        nextState = 'SEARCHING_INSTRUCTIONAL_DOWN';
        nextTarget = L - 1;
      } else if (classification === 'Instructional') {
        if (profile.independentInt !== null) {
          nextState = 'COMPLETE';
          status = 'COMPLETE';
          nextTarget = null;
        } else {
          nextState = 'SEARCHING_INDEPENDENT_DOWN';
          nextTarget = L - 1;
        }
      } else if (classification === 'Independent') {
        nextState = 'NO_INSTRUCTIONAL_BETWEEN';
        status = 'TERMINATED';
        terminalReason = 'NO_INSTRUCTIONAL_BETWEEN';
        nextTarget = null;
      }
      break;

    case 'SEARCHING_INDEPENDENT_DOWN':
      if (classification === 'Independent') {
        nextState = 'COMPLETE';
        status = 'COMPLETE';
        nextTarget = null;
      } else if (classification === 'Instructional') {
        nextState = 'SEARCHING_INDEPENDENT_DOWN';
        nextTarget = L - 1;
      } else if (classification === 'Frustration') {
        nextState = 'NEEDS_REVIEW';
        status = 'NEEDS_REVIEW';
        terminalReason = 'NON_MONOTONIC_READING_LEVELS';
        nextTarget = null;
      }
      break;

    default:
      if (profile.isComplete) {
        nextState = 'COMPLETE';
        status = 'COMPLETE';
        nextTarget = null;
      }
      break;
  }

  // Completion check
  if (profile.isComplete && status !== 'NEEDS_REVIEW') {
    nextState = 'COMPLETE';
    status = 'COMPLETE';
    nextTarget = null;
  }

  // Boundary check
  if (nextTarget !== null) {
    if (nextTarget > config.max) {
      nextState = 'UPPER_BOUNDARY_REACHED';
      status = 'TERMINATED';
      terminalReason = 'UPPER_BOUNDARY_REACHED';
      nextTarget = null;
    } else if (nextTarget < config.min) {
      nextState = 'LOWER_BOUNDARY_REACHED';
      status = 'TERMINATED';
      terminalReason = 'LOWER_BOUNDARY_REACHED';
      nextTarget = null;
    }
  }

  // Duplicate passage protection (avoid cycles)
  if (nextTarget !== null) {
    const testedLevels = new Set(
      updatedAttempts.filter((a) => !a.isVoided).map((a) => parseGradeLevel(a.gradeLevel))
    );

    if (testedLevels.has(nextTarget)) {
      const direction = nextTarget > L ? 1 : -1;
      let cand = nextTarget + direction;
      while (testedLevels.has(cand)) {
        cand += direction;
      }

      if (cand > config.max) {
        nextState = 'UPPER_BOUNDARY_REACHED';
        status = 'TERMINATED';
        terminalReason = 'UPPER_BOUNDARY_REACHED';
        nextTarget = null;
      } else if (cand < config.min) {
        nextState = 'LOWER_BOUNDARY_REACHED';
        status = 'TERMINATED';
        terminalReason = 'LOWER_BOUNDARY_REACHED';
        nextTarget = null;
      } else {
        nextTarget = cand;
      }
    }
  }

  return {
    nextState,
    nextTargetInt: nextTarget,
    nextTargetLevel: formatGradeLevel(nextTarget),
    status,
    terminalReason,
    profile,
  };
}

/**
 * Core adaptive decision function — called after EACH assessment submission.
 * Updated to preserve existing signature while using DepEd Plan v2 multi-level profiling.
 *
 * @param {string} currentGradeLevel - Grade level of the passage just assessed
 * @param {string} profileLevel - Result: 'Independent' | 'Instructional' | 'Frustration'
 * @param {object} [context] - Optional existing state & attempts context
 */
function evaluateNextStep(currentGradeLevel, profileLevel, context = {}) {
  const {
    currentState = 'INITIAL_PASSAGE',
    language = 'fil',
    existingAttempts = [],
  } = context;

  const transition = evaluateAdaptiveTransition({
    currentState,
    level: currentGradeLevel,
    classification: profileLevel,
    language,
    existingAttempts,
  });

  if (transition.status === 'COMPLETE' || transition.status === 'TERMINATED') {
    return {
      action: 'complete',
      nextGradeLevel: null,
      finalLevel: transition.profile.instructionalLevel || currentGradeLevel,
      finalProfileLevel: transition.profile.instructionalLevel ? 'Instructional' : profileLevel,
      profile: transition.profile,
      nextState: transition.nextState,
      status: transition.status,
      terminalReason: transition.terminalReason,
      reason: transition.status === 'COMPLETE'
        ? `Assessment complete. Profile established: Independent (${transition.profile.independentLevel || 'None'}), Instructional (${transition.profile.instructionalLevel || 'None'}), Frustration (${transition.profile.frustrationLevel || 'None'}).`
        : `Assessment terminated: ${transition.terminalReason || 'Boundary reached'}.`,
      atBoundary: transition.status === 'TERMINATED',
    };
  }

  if (transition.status === 'NEEDS_REVIEW') {
    return {
      action: 'complete',
      nextGradeLevel: null,
      finalLevel: currentGradeLevel,
      finalProfileLevel: profileLevel,
      profile: transition.profile,
      nextState: transition.nextState,
      status: 'NEEDS_REVIEW',
      terminalReason: transition.terminalReason,
      reason: `Flagged for teacher review (${transition.terminalReason}).`,
      atBoundary: true,
    };
  }

  // Stepping up or down
  const currentInt = parseGradeLevel(currentGradeLevel) || 1;
  const isSteppingUp = transition.nextTargetInt > currentInt;

  return {
    action: isSteppingUp ? 'stepUp' : 'stepDown',
    nextGradeLevel: transition.nextTargetLevel,
    finalLevel: null,
    finalProfileLevel: null,
    profile: transition.profile,
    nextState: transition.nextState,
    status: 'IN_PROGRESS',
    terminalReason: null,
    reason: `Student scored ${profileLevel} at ${currentGradeLevel}. ${isSteppingUp ? 'Advancing' : 'Stepping down'} to ${transition.nextTargetLevel}.`,
    atBoundary: false,
  };
}

/**
 * Formats a raw phil_iri_adaptive_sessions DB row into a clean API-facing object.
 */
function buildSessionSummary(row) {
  if (!row) return null;
  return {
    sessionId:            row.session_id,
    studentId:            row.student_id,
    language:             row.language,
    assessmentType:       row.assessment_type,
    baselineGradeLevel:   row.baseline_grade_level,
    baselineProfileLevel: row.baseline_profile_level,
    currentGradeLevel:    row.current_grade_level,
    direction:            row.direction,
    status:               row.status,
    stepCount:            row.step_count,
    startedAt:            row.started_at,
    completedAt:          row.completed_at,
    // DepEd Plan v2 3-Tier Profile:
    independentLevel:     row.independent_level || null,
    instructionalLevel:   row.instructional_level || null,
    frustrationLevel:     row.frustration_level || null,
    searchState:          row.search_state || null,
    terminalReason:       row.terminal_reason || null,
  };
}

module.exports = {
  GRADE_LEVELS,
  LANGUAGE_RANGES,
  TABLE_6_PERCENTAGES,
  getGradeIndex,
  parseGradeLevel,
  formatGradeLevel,
  normalizeLanguage,
  calculateWordReadingScore,
  calculateComprehensionScore,
  calculateReadingSpeedWpm,
  getWordReadingLevel,
  getComprehensionLevel,
  combinePassageLevel,
  determineStartingPassage,
  deriveProfileFromAttempts,
  evaluateAdaptiveTransition,
  computeInitialStep,
  evaluateNextStep,
  buildSessionSummary,
};
