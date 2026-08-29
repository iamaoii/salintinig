/**
 * Phil-IRI High-Accuracy AI Miscue Analysis Engine
 * 
 * Powered by Gotoh Affine-Gap Sequence Alignment, Bilingual Phonetic Matching,
 * Compound Word Reconciliation, Multi-Scale Repetition Mapping (Words & Sentences),
 * Timestamp-Based Hesitation Analysis, and Multi-Token Self-Correction Resolution.
 */

const {
  normalizeWord,
  toUnsegmented,
  toPhoneticCode,
  getStringSimilarity,
  getPhoneticSimilarity,
  isPrefixStutter
} = require('../utils/phonetics.util.js');

const FILLER_WORDS = new Set([
  'uhm', 'um', 'uh', 'ah', 'eh', 'er', 'erm', 'hmm', 'hmmm', 'oops', 'ay', 'ha', 'ano', 'yung', 'kasi', 'kuan', 'kwan'
]);

const FILLER_REGEX = /^(u+h*m+|a+h+|e+h+|e+r+m*|h+m+|u+h+|o+o+p+s+|a+y+|h+a+|a+n+o+|y+u+n+g+|k+a+s+i+|k+u+a+n+|k+w+a+n+)$/i;

function isFillerWord(word) {
  const norm = normalizeWord(word);
  if (!norm) return false;
  return FILLER_REGEX.test(norm) || FILLER_WORDS.has(norm);
}

/**
 * Detect repeated words and phrases in spoken words stream
 * Handles:
 * - Single word adjacent repetitions (e.g. "helping helping", "bata bata")
 * - Word repetitions with filler in between (e.g. "nagluto uhm nagluto")
 * - Multi-word phrase & sentence repetitions from 2 to 25 words
 * 
 * @param {Array<string>} spokenWords 
 * @returns {Array<{ isRepetition: boolean, sourceIdx: number|null, repetitionCount: number }>}
 */
function detectRepetitions(spokenWords) {
  const repInfo = spokenWords.map(() => ({ isRepetition: false, sourceIdx: null, repetitionCount: 1 }));
  const normalized = spokenWords.map(w => normalizeWord(w));

  // 1. Single word adjacent and filler-separated repetitions
  for (let i = 1; i < normalized.length; i++) {
    if (!normalized[i] || isFillerWord(normalized[i])) continue;

    // Direct adjacent
    if (normalized[i] === normalized[i - 1]) {
      repInfo[i] = {
        isRepetition: true,
        sourceIdx: repInfo[i - 1].isRepetition ? repInfo[i - 1].sourceIdx : i - 1,
        repetitionCount: (repInfo[i - 1].repetitionCount || 1) + 1
      };
      continue;
    }

    // Separated by 1 filler word (e.g. "nagluto uhm nagluto")
    if (i >= 2 && isFillerWord(normalized[i - 1]) && normalized[i] === normalized[i - 2]) {
      repInfo[i] = {
        isRepetition: true,
        sourceIdx: repInfo[i - 2].isRepetition ? repInfo[i - 2].sourceIdx : i - 2,
        repetitionCount: (repInfo[i - 2].repetitionCount || 1) + 1
      };
      continue;
    }
  }

  // 2. Multi-word phrase and sentence repetitions (n-grams from 2 to 25 words)
  for (let len = 2; len <= 25; len++) {
    for (let i = 0; i + len <= normalized.length; i++) {
      const p1 = normalized.slice(i, i + len).join(' ');
      if (p1.length < 3) continue;

      // Scan ahead for duplicate phrase/sentence
      for (let j = i + len; j + len <= normalized.length && j <= i + len * 2 + 5; j++) {
        const p2 = normalized.slice(j, j + len).join(' ');
        if (p1 === p2) {
          for (let k = 0; k < len; k++) {
            repInfo[j + k] = {
              isRepetition: true,
              sourceIdx: i + k,
              repetitionCount: 2
            };
          }
        }
      }
    }
  }

  return repInfo;
}

/**
 * Gotoh Global Sequence Alignment with Affine Gap Penalties & Compound Word Support
 * Prevents multi-word skips or sentence repetitions from fragmenting into false substitutions.
 * 
 * @param {Array<string>} originalWords - Reference passage words
 * @param {Array<string>} spokenWords - Transcribed student words
 * @param {Array<{ isRepetition: boolean }>} repInfo - Repetition info per spoken word
 * @param {Array<boolean>} isFiller - Filler word flags per spoken word
 * @returns {Array<{ type: string, origIdx: number|null, spokIdx: number|null, phoneticConfidence: number }>}
 */
function alignSequences(originalWords, spokenWords, repInfo, isFiller) {
  const m = originalWords.length;
  const n = spokenWords.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) {
    return spokenWords.map((_, j) => ({ type: 'insertion', origIdx: null, spokIdx: j, phoneticConfidence: 0 }));
  }
  if (n === 0) {
    return originalWords.map((_, i) => ({ type: 'omission', origIdx: i, spokIdx: null, phoneticConfidence: 0 }));
  }

  const GAP_OPEN = -3.0;
  const GAP_EXTEND = -0.5;
  const NEG_INF = -1e9;

  // 3 Matrices for Gotoh Affine Gap Alignment:
  // M: Match/Substitution, X: Omission (Gap in Spoken), Y: Insertion (Gap in Passage)
  const M = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));
  const X = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));
  const Y = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));

  M[0][0] = 0;

  for (let i = 1; i <= m; i++) {
    X[i][0] = GAP_OPEN + i * GAP_EXTEND;
  }
  for (let j = 1; j <= n; j++) {
    Y[0][j] = GAP_OPEN + j * GAP_EXTEND;
  }

  for (let i = 1; i <= m; i++) {
    const origWord = originalWords[i - 1];
    for (let j = 1; j <= n; j++) {
      const spokWord = spokenWords[j - 1];
      const phon = getPhoneticSimilarity(origWord, spokWord);

      let matchScore = -1.5;
      if (phon.isExactMatch) {
        matchScore = 3.0;
      } else if (phon.isPhoneticMatch) {
        matchScore = 2.5; // High reward for acceptable dialectal/phonetic match
      } else if (phon.similarity >= 0.70) {
        matchScore = 1.0;
      } else if (phon.similarity >= 0.45) {
        matchScore = 0.0;
      } else {
        matchScore = -1.5;
      }

      // If spoken word is flagged as a repetition or filler, reduce match weight to prioritize primary reading
      if (repInfo[j - 1]?.isRepetition || isFiller[j - 1]) {
        matchScore -= 1.2;
      }

      // Calculate M[i][j] (diagonal move)
      const prevBest = Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      M[i][j] = prevBest + matchScore;

      // Calculate X[i][j] (deletion from passage / omission)
      X[i][j] = Math.max(
        M[i - 1][j] + GAP_OPEN + GAP_EXTEND,
        X[i - 1][j] + GAP_EXTEND
      );

      // Calculate Y[i][j] (insertion in spoken / extra word)
      Y[i][j] = Math.max(
        M[i][j - 1] + GAP_OPEN + GAP_EXTEND,
        Y[i][j - 1] + GAP_EXTEND
      );
    }
  }

  // Backtracking
  let i = m;
  let j = n;
  let currentMatrix = 'M';

  // Determine starting matrix at (m, n)
  const maxScore = Math.max(M[m][n], X[m][n], Y[m][n]);
  if (maxScore === X[m][n]) currentMatrix = 'X';
  else if (maxScore === Y[m][n]) currentMatrix = 'Y';
  else currentMatrix = 'M';

  const steps = [];

  while (i > 0 || j > 0) {
    if (currentMatrix === 'M') {
      if (i === 0 || j === 0) {
        currentMatrix = i > 0 ? 'X' : 'Y';
        continue;
      }

      const origWord = originalWords[i - 1];
      const spokWord = spokenWords[j - 1];
      const phon = getPhoneticSimilarity(origWord, spokWord);

      const isMatch = phon.isExactMatch || phon.isPhoneticMatch;
      steps.unshift({
        type: isMatch ? 'match' : 'substitution',
        origIdx: i - 1,
        spokIdx: j - 1,
        phoneticConfidence: Math.round(phon.similarity * 100)
      });

      // Find where we came from
      const prevM = M[i - 1][j - 1];
      const prevX = X[i - 1][j - 1];
      const prevY = Y[i - 1][j - 1];
      const best = Math.max(prevM, prevX, prevY);

      if (best === prevM) currentMatrix = 'M';
      else if (best === prevX) currentMatrix = 'X';
      else currentMatrix = 'Y';

      i--;
      j--;
    } else if (currentMatrix === 'X') {
      // Omission (gap in spoken, move up in passage)
      steps.unshift({
        type: 'omission',
        origIdx: i - 1,
        spokIdx: null,
        phoneticConfidence: 0
      });

      if (i > 0 && X[i][j] === X[i - 1][j] + GAP_EXTEND) {
        currentMatrix = 'X';
      } else {
        currentMatrix = 'M';
      }
      i--;
    } else if (currentMatrix === 'Y') {
      // Insertion (gap in passage, move left in spoken)
      steps.unshift({
        type: 'insertion',
        origIdx: i > 0 ? i - 1 : 0,
        spokIdx: j - 1,
        phoneticConfidence: 0
      });

      if (j > 0 && Y[i][j] === Y[i][j - 1] + GAP_EXTEND) {
        currentMatrix = 'Y';
      } else {
        currentMatrix = 'M';
      }
      j--;
    }
  }

  return steps;
}

/**
 * Reconcile compound and hyphenated words between passage and spoken words
 * E.g., if passage has "mag-aaral" and spoken has ["mag", "aaral"], merge spoken into "mag-aaral".
 * @param {Array<string>} originalWords 
 * @param {Array<string>} spokenWords 
 * @param {Array<object>} timestampedWords 
 * @returns {{ spokenWords: Array<string>, timestampedWords: Array<object> }}
 */
function reconcileCompoundTokens(originalWords, spokenWords, timestampedWords = []) {
  const mergedSpoken = [];
  const mergedTimestamps = [];

  const unsegmentedPassage = new Set(originalWords.map(w => toUnsegmented(w)));

  let j = 0;
  while (j < spokenWords.length) {
    // Check if 2 consecutive spoken words form an unsegmented compound word in passage
    if (j + 1 < spokenWords.length) {
      const combined = toUnsegmented(spokenWords[j] + spokenWords[j + 1]);
      if (unsegmentedPassage.has(combined)) {
        mergedSpoken.push(`${spokenWords[j]}-${spokenWords[j + 1]}`);
        if (timestampedWords.length > 0) {
          mergedTimestamps.push({
            word: `${spokenWords[j]}-${spokenWords[j + 1]}`,
            start: timestampedWords[j]?.start,
            end: timestampedWords[j + 1]?.end || timestampedWords[j]?.end
          });
        }
        j += 2;
        continue;
      }
    }

    mergedSpoken.push(spokenWords[j]);
    if (timestampedWords.length > 0 && timestampedWords[j]) {
      mergedTimestamps.push(timestampedWords[j]);
    }
    j++;
  }

  return {
    spokenWords: mergedSpoken,
    timestampedWords: mergedTimestamps
  };
}

/**
 * Perform Comprehensive Phil-IRI AI Miscue Analysis
 * 
 * @param {string} passageText - Original reference passage text
 * @param {string|object} spokenInput - Spoken transcript or { text, words: [{ word, start, end }] }
 * @param {number} [readingTimeSeconds=60] - Total reading duration
 * @returns {object} Full Phil-IRI analysis output with verified reading metrics
 */
function analyzeOralReading(passageText, spokenInput, readingTimeSeconds = 60) {
  const originalWords = (passageText || '').split(/\s+/).filter(Boolean);

  let spokenRawText = '';
  let timestampedWords = [];

  if (typeof spokenInput === 'string') {
    spokenRawText = spokenInput;
  } else if (spokenInput && typeof spokenInput === 'object') {
    spokenRawText = spokenInput.text || '';
    timestampedWords = Array.isArray(spokenInput.words) ? spokenInput.words : [];
  }

  // Extract initial spoken words list
  let rawSpokenWords = [];
  if (timestampedWords.length > 0) {
    rawSpokenWords = timestampedWords.map(tw => tw.word || '').filter(Boolean);
  } else {
    rawSpokenWords = spokenRawText.split(/\s+/).filter(Boolean);
  }

  // Reconcile compound words (e.g. "mag" "aaral" -> "mag-aaral")
  const reconciled = reconcileCompoundTokens(originalWords, rawSpokenWords, timestampedWords);
  const spokenWords = reconciled.spokenWords;
  timestampedWords = reconciled.timestampedWords;

  const totalPassageWords = originalWords.length;
  if (totalPassageWords === 0) {
    return {
      totalPassageWords: 0,
      wordsRead: 0,
      correctWords: 0,
      readingRateWPM: 0,
      accuracyPercentage: 0,
      miscuesCount: 0,
      miscues: []
    };
  }

  // 1. Detect audio hesitations / pauses from word-level timestamps (pause >= 2.5s)
  const isHesitation = new Array(spokenWords.length).fill(false);
  if (timestampedWords.length > 1) {
    for (let k = 1; k < timestampedWords.length; k++) {
      const prevEnd = timestampedWords[k - 1]?.end;
      const currStart = timestampedWords[k]?.start;
      if (typeof prevEnd === 'number' && typeof currStart === 'number') {
        const pauseSec = currStart - prevEnd;
        if (pauseSec >= 2.5) {
          isHesitation[k] = true;
        }
      }
    }
  }

  // 2. Detect word and phrase repetitions (N-Gram & sentence loop-back detection)
  const repInfo = detectRepetitions(spokenWords);

  // 3. Mark filler words
  const isFiller = spokenWords.map(w => isFillerWord(w));

  // 4. Perform Gotoh Affine Gap Sequence Alignment
  const steps = alignSequences(originalWords, spokenWords, repInfo, isFiller);

  // Map each spoken word index to the passage index it aligned to
  const spokenToOrigMap = new Array(spokenWords.length).fill(null);
  for (const step of steps) {
    if (step.spokIdx !== null && step.origIdx !== null) {
      spokenToOrigMap[step.spokIdx] = step.origIdx;
    }
  }

  // 5. Forward Processing & Consolidation
  const miscuesByPosition = new Map(); // Map<word_position, miscue_object>

  const setMiscue = (pos, miscue) => {
    const validPos = Math.max(1, Math.min(pos, totalPassageWords));
    const fallbackExpected = originalWords[validPos - 1] || originalWords[0] || '';
    
    // Ensure expected_word is always guaranteed to be populated
    const cleanMiscue = {
      ...miscue,
      word_position: validPos,
      expected_word: miscue.expected_word || fallbackExpected
    };

    const existing = miscuesByPosition.get(validPos);
    if (!existing) {
      miscuesByPosition.set(validPos, cleanMiscue);
      return;
    }

    // Priority ranking:
    // 1. self_correction (highest)
    // 2. repetition (overwrites generic insertion and hesitation)
    // 3. substitution / omission (content errors)
    // 4. insertion
    // 5. hesitation (lowest)
    if (cleanMiscue.miscue_type === 'self_correction') {
      miscuesByPosition.set(validPos, cleanMiscue);
      return;
    }

    if (cleanMiscue.miscue_type === 'repetition') {
      if (existing.miscue_type === 'insertion' || existing.miscue_type === 'hesitation') {
        miscuesByPosition.set(validPos, cleanMiscue);
        return;
      }
    }

    if (cleanMiscue.miscue_type === 'substitution' || cleanMiscue.miscue_type === 'omission') {
      if (existing.miscue_type === 'insertion' || existing.miscue_type === 'hesitation') {
        miscuesByPosition.set(validPos, cleanMiscue);
        return;
      }
    }
  };

  let currentOrigPos = 1;

  for (let s = 0; s < steps.length; s++) {
    const step = steps[s];
    if (step.origIdx !== null && step.origIdx !== undefined) {
      currentOrigPos = step.origIdx + 1;
    }

    const nextStep = s + 1 < steps.length ? steps[s + 1] : null;
    const spokenWord = step.spokIdx !== null ? spokenWords[step.spokIdx] : '';
    const isStepFiller = step.spokIdx !== null && isFillerWord(spokenWord);
    const isStepRepetition = step.spokIdx !== null && repInfo[step.spokIdx]?.isRepetition;
    const isSameWordAsNext = nextStep && nextStep.spokIdx !== null && normalizeWord(spokenWord) === normalizeWord(spokenWords[nextStep.spokIdx]);

    // A. Detect Self-Correction:
    // If the spoken word is identical to the next spoken word, it is a REPETITION, not a self-correction!
    // Pattern 1: Substitution immediately corrected on same expected word
    // Pattern 2: False start / prefix stutter / phonetic attempt immediately followed by match on target word
    if (
      !isStepFiller &&
      !isStepRepetition &&
      !isSameWordAsNext &&
      nextStep &&
      nextStep.type === 'match' &&
      nextStep.origIdx !== null &&
      (
        (step.type === 'substitution' && step.origIdx === nextStep.origIdx) ||
        (step.spokIdx !== null && isPrefixStutter(spokenWord, originalWords[nextStep.origIdx])) ||
        (step.type === 'insertion' && (step.origIdx === nextStep.origIdx || step.origIdx + 1 === nextStep.origIdx) && getPhoneticSimilarity(spokenWord, originalWords[nextStep.origIdx]).similarity >= 0.40)
      )
    ) {
      const targetOrigIdx = nextStep.origIdx;
      setMiscue(targetOrigIdx + 1, {
        expected_word: originalWords[targetOrigIdx],
        spoken_word: `${spokenWords[step.spokIdx]} → ${spokenWords[nextStep.spokIdx]}`,
        miscue_type: 'self_correction',
        is_corrected: true,
        phonetic_confidence: 100
      });
      s++; // Skip nextStep as it is resolved as part of the self-correction
      continue;
    }

    // B. Match Step
    if (step.type === 'match') {
      const sIdx = step.spokIdx;
      if (sIdx !== null) {
        if (repInfo[sIdx]?.isRepetition) {
          setMiscue(currentOrigPos, {
            expected_word: originalWords[step.origIdx],
            spoken_word: spokenWords[sIdx],
            miscue_type: 'repetition',
            is_corrected: false,
            phonetic_confidence: step.phoneticConfidence || 100
          });
        } else if (isHesitation[sIdx]) {
          setMiscue(currentOrigPos, {
            expected_word: originalWords[step.origIdx],
            spoken_word: spokenWords[sIdx],
            miscue_type: 'hesitation',
            is_corrected: false,
            phonetic_confidence: step.phoneticConfidence || 100
          });
        }
      }
      continue;
    }

    // C. Omission Step (Student skipped the passage word)
    if (step.type === 'omission') {
      setMiscue(currentOrigPos, {
        expected_word: originalWords[step.origIdx],
        spoken_word: '',
        miscue_type: 'omission',
        is_corrected: false,
        phonetic_confidence: 0
      });
      continue;
    }

    // D. Substitution Step (Student mispronounced or changed the word)
    if (step.type === 'substitution') {
      setMiscue(currentOrigPos, {
        expected_word: originalWords[step.origIdx],
        spoken_word: spokenWords[step.spokIdx],
        miscue_type: 'substitution',
        is_corrected: false,
        phonetic_confidence: step.phoneticConfidence || 0
      });
      continue;
    }

    // E. Insertion Step (Student said an extra word, filler, or repeated phrase)
    if (step.type === 'insertion') {
      const sIdx = step.spokIdx;
      const currentSpoken = spokenWords[sIdx];

      if (isFillerWord(currentSpoken)) {
        // Find upcoming match step in passage to anchor the hesitation
        let targetPos = currentOrigPos;
        for (let f = s + 1; f < steps.length; f++) {
          if (steps[f].origIdx !== null && steps[f].type === 'match') {
            targetPos = steps[f].origIdx + 1;
            break;
          }
        }

        setMiscue(targetPos, {
          expected_word: originalWords[targetPos - 1] || originalWords[0] || '',
          spoken_word: currentSpoken,
          miscue_type: 'hesitation',
          is_corrected: false,
          phonetic_confidence: 0
        });
      } else if (isSameWordAsNext && nextStep && nextStep.origIdx !== null) {
        // Identical word read twice in sequence
        const targetPos = nextStep.origIdx + 1;
        setMiscue(targetPos, {
          expected_word: originalWords[targetPos - 1] || originalWords[0] || '',
          spoken_word: currentSpoken,
          miscue_type: 'repetition',
          is_corrected: false,
          phonetic_confidence: 100
        });
      } else if (repInfo[sIdx]?.isRepetition) {
        // If this repetition maps to a known source word in passage, use that exact passage position!
        let targetPos = currentOrigPos;
        const srcIdx = repInfo[sIdx].sourceIdx;
        if (srcIdx !== null && spokenToOrigMap[srcIdx] !== null) {
          targetPos = spokenToOrigMap[srcIdx] + 1;
        }

        setMiscue(targetPos, {
          expected_word: originalWords[targetPos - 1] || originalWords[0] || '',
          spoken_word: currentSpoken,
          miscue_type: 'repetition',
          is_corrected: false,
          phonetic_confidence: 0
        });
      } else {
        const anchorWord = originalWords[currentOrigPos - 1] || originalWords[0] || '';
        setMiscue(currentOrigPos, {
          expected_word: anchorWord,
          spoken_word: currentSpoken,
          miscue_type: 'insertion',
          is_corrected: false,
          phonetic_confidence: 0
        });
      }
    }
  }

  // Convert map to sorted array by 1-indexed word_position
  const miscues = Array.from(miscuesByPosition.values()).sort((a, b) => a.word_position - b.word_position);

  // Phil-IRI Accuracy scoring: Self-corrections and minor hesitations do not penalize accuracy
  const penalizedMiscues = miscues.filter(m => 
    m.miscue_type === 'omission' || 
    m.miscue_type === 'substitution' || 
    m.miscue_type === 'insertion'
  ).length;

  const correctWords = Math.max(0, totalPassageWords - penalizedMiscues);
  const accuracyPercentage = totalPassageWords > 0
    ? Number(((correctWords / totalPassageWords) * 100).toFixed(1))
    : 0;

  const wordsRead = spokenWords.length;
  const readingTimeMin = (readingTimeSeconds || 60) / 60;
  const readingRateWPM = readingTimeMin > 0 ? Number((wordsRead / readingTimeMin).toFixed(1)) : 0;

  return {
    totalPassageWords,
    wordsRead,
    correctWords,
    readingRateWPM,
    accuracyPercentage,
    miscuesCount: miscues.length,
    miscues
  };
}

/**
 * Calculate Official Phil-IRI Reading Profile Label
 * 
 * DepEd Phil-IRI Matrix:
 * - Independent: Word Reading >= 97% AND Comprehension >= 80%
 * - Instructional: Word Reading 90-96% OR Comprehension 59-79%
 * - Frustration: Word Reading < 90% OR Comprehension < 59%
 * 
 * @param {number} accuracyPercentage - Word reading accuracy percentage
 * @param {number} comprehensionScorePercentage - Reading comprehension score percentage
 * @returns {'Independent'|'Instructional'|'Frustration'}
 */
function getPhilIriProfile(accuracyPercentage, comprehensionScorePercentage) {
  let wordLevel = 'Frustration';
  if (accuracyPercentage >= 97) wordLevel = 'Independent';
  else if (accuracyPercentage >= 90) wordLevel = 'Instructional';

  let compLevel = 'Frustration';
  if (comprehensionScorePercentage >= 80) compLevel = 'Independent';
  else if (comprehensionScorePercentage >= 59) compLevel = 'Instructional';

  if (wordLevel === 'Frustration' || compLevel === 'Frustration') {
    return 'Frustration';
  }
  if (wordLevel === 'Instructional' || compLevel === 'Instructional') {
    return 'Instructional';
  }
  return 'Independent';
}

module.exports = {
  analyzeOralReading,
  getPhilIriProfile,
  alignSequences,
  detectRepetitions,
  normalizeWord,
  getPhoneticSimilarity,
};
