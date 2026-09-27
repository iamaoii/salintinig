/**
 * Phil-IRI Phase 2 — Adaptive Assessment Engine
 *
 * Implements the DepEd Phil-IRI adaptive level-finding algorithm:
 *   - If student is FRUSTRATION  → step DOWN one grade level
 *   - If student is INDEPENDENT  → step UP one grade level
 *   - If student is INSTRUCTIONAL → STOP — instructional level found
 *
 * Goal: Locate the exact grade level where the student is INSTRUCTIONAL
 * (i.e., can learn with teacher assistance).
 */

/**
 * Canonical ordered list of Phil-IRI grade levels (lowest → highest).
 * Grades 1–6 cover the DepEd elementary scope.
 */
const GRADE_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
];

/**
 * Returns the 0-based index of a grade level string, or -1 if not found.
 * Case-insensitive and tolerates minor spacing differences.
 * @param {string} level  e.g. 'Grade 4'
 * @returns {number}
 */
function getGradeIndex(level) {
  if (!level) return -1;
  const normalized = String(level).trim();
  return GRADE_LEVELS.findIndex(
    (gl) => gl.toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Determine the FIRST grade level to assess in Phase 2 and the stepping direction,
 * based on the student's enrolled grade and their Phase 1 screening result.
 *
 * @param {string} enrolledGradeLevel   Student's current enrolled grade (e.g. 'Grade 4')
 * @param {string} phase1ProfileLevel   Phase 1 result: 'Independent' | 'Instructional' | 'Frustration'
 * @returns {{ firstGradeLevel: string, direction: string|null, noPhase2Needed: boolean, atBoundary: boolean }}
 */
function computeInitialStep(enrolledGradeLevel, phase1ProfileLevel) {
  const idx = getGradeIndex(enrolledGradeLevel);

  if (phase1ProfileLevel === 'Instructional') {
    // Already at instructional level — Phase 2 not needed
    return {
      firstGradeLevel: enrolledGradeLevel,
      direction: null,
      noPhase2Needed: true,
      atBoundary: false,
    };
  }

  if (phase1ProfileLevel === 'Frustration') {
    if (idx <= 0) {
      // Already at Grade 1 — cannot go lower; student is Frustration at Grade 1
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

  if (phase1ProfileLevel === 'Independent') {
    if (idx >= GRADE_LEVELS.length - 1) {
      // Already at Grade 6 — cannot go higher; student is Independent at Grade 6
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

  // Unknown profile — treat as no Phase 2 needed
  return {
    firstGradeLevel: enrolledGradeLevel,
    direction: null,
    noPhase2Needed: true,
    atBoundary: false,
  };
}

/**
 * Core adaptive decision function — called after EACH Phase 2 assessment submission.
 *
 * @param {string} currentGradeLevel   Grade level of the passage just assessed
 * @param {string} profileLevel        Result: 'Independent' | 'Instructional' | 'Frustration'
 * @returns {{
 *   action: 'stepUp'|'stepDown'|'complete',
 *   nextGradeLevel: string|null,
 *   finalLevel: string|null,
 *   finalProfileLevel: string|null,
 *   reason: string,
 *   atBoundary: boolean,
 * }}
 */
function evaluateNextStep(currentGradeLevel, profileLevel) {
  const idx = getGradeIndex(currentGradeLevel);

  // ── INSTRUCTIONAL → DONE ────────────────────────────────────────────────
  if (profileLevel === 'Instructional') {
    return {
      action: 'complete',
      nextGradeLevel: null,
      finalLevel: currentGradeLevel,
      finalProfileLevel: 'Instructional',
      reason: `Student is Instructional at ${currentGradeLevel}. Instructional level identified.`,
      atBoundary: false,
    };
  }

  // ── FRUSTRATION → STEP DOWN ─────────────────────────────────────────────
  if (profileLevel === 'Frustration') {
    if (idx <= 0) {
      // At Grade 1 — cannot go lower; record Grade 1 as Frustration boundary
      return {
        action: 'complete',
        nextGradeLevel: null,
        finalLevel: GRADE_LEVELS[0],
        finalProfileLevel: 'Frustration',
        reason: `Student is Frustration at ${GRADE_LEVELS[0]} (minimum grade level). Cannot step down further.`,
        atBoundary: true,
      };
    }
    return {
      action: 'stepDown',
      nextGradeLevel: GRADE_LEVELS[idx - 1],
      finalLevel: null,
      finalProfileLevel: null,
      reason: `Student is Frustration at ${currentGradeLevel}. Stepping down to ${GRADE_LEVELS[idx - 1]}.`,
      atBoundary: false,
    };
  }

  // ── INDEPENDENT → STEP UP ───────────────────────────────────────────────
  if (profileLevel === 'Independent') {
    if (idx >= GRADE_LEVELS.length - 1) {
      // At Grade 6 — cannot go higher; record Grade 6 as Independent boundary
      return {
        action: 'complete',
        nextGradeLevel: null,
        finalLevel: GRADE_LEVELS[GRADE_LEVELS.length - 1],
        finalProfileLevel: 'Independent',
        reason: `Student is Independent at ${GRADE_LEVELS[GRADE_LEVELS.length - 1]} (maximum grade level). Cannot step up further.`,
        atBoundary: true,
      };
    }
    return {
      action: 'stepUp',
      nextGradeLevel: GRADE_LEVELS[idx + 1],
      finalLevel: null,
      finalProfileLevel: null,
      reason: `Student is Independent at ${currentGradeLevel}. Stepping up to ${GRADE_LEVELS[idx + 1]}.`,
      atBoundary: false,
    };
  }

  // Fallback — treat as complete
  return {
    action: 'complete',
    nextGradeLevel: null,
    finalLevel: currentGradeLevel,
    finalProfileLevel: profileLevel || 'Unknown',
    reason: `Unrecognized profile level "${profileLevel}". Marking session complete.`,
    atBoundary: false,
  };
}

/**
 * Formats a raw phil_iri_adaptive_sessions DB row into a clean API-facing object.
 * @param {object} row  Raw DB row from phil_iri_adaptive_sessions
 * @returns {object}
 */
function buildSessionSummary(row) {
  if (!row) return null;
  return {
    sessionId:               row.session_id,
    studentId:               row.student_id,
    language:                row.language,
    assessmentType:          row.assessment_type,
    baselineGradeLevel:      row.baseline_grade_level,
    baselineProfileLevel:    row.baseline_profile_level,
    currentGradeLevel:       row.current_grade_level,
    direction:               row.direction,
    status:                  row.status,
    finalInstructionalLevel: row.final_instructional_level,
    finalProfileLevel:       row.final_profile_level,
    stepCount:               row.step_count,
    startedAt:               row.started_at,
    completedAt:             row.completed_at,
  };
}

module.exports = {
  GRADE_LEVELS,
  getGradeIndex,
  computeInitialStep,
  evaluateNextStep,
  buildSessionSummary,
};
