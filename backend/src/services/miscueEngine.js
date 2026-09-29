/**
 * Phil-IRI High-Accuracy AI Miscue Analysis Engine v2
 *
 * Implements all 8 Official DepEd Phil-IRI Miscue Types:
 *   1. Mispronunciation
 *   2. Omission
 *   3. Substitution
 *   4. Insertion
 *   5. Repetition
 *   6. Transposition
 *   7. Reversal
 *   8. Self-Correction (NOT scored as an error)
 */

const {
  normalizeWord,
  toUnsegmented,
  toPhoneticCode,
  getStringSimilarity,
  getPhoneticSimilarity,
  isPrefixStutter
} = require('../utils/phonetics.util.js');
const { isKnownFilipinoWord } = require('../utils/filipinoLexicon.js');

// ============================================================
// FILLER WORD DETECTION
// ============================================================

const FILLER_WORDS = new Set([
  'uhm', 'um', 'uh', 'ah', 'eh', 'er', 'erm', 'hmm', 'hmmm', 'oops',
  'ano', 'yung', 'kasi', 'kuan', 'kwan'
]);

const FILLER_REGEX = /^(u+h*m+|a+h+|e+h+|e+r+m*|h+m+|u+h+|o+o+p+s+|a+y+|h+a+|a+n+o+|y+u+n+g+|k+a+s+i+|k+u+a+n+|k+w+a+n+)$/i;

function isFillerWord(word) {
  const norm = normalizeWord(word);
  if (!norm) return false;
  return FILLER_REGEX.test(norm) || FILLER_WORDS.has(norm);
}

// ============================================================
// STRICT LOCAL REPETITION DETECTION
// ============================================================

/**
 * Detect repeated words and phrases in the spoken word stream.
 *
 * KEY PRINCIPLE: Repetition is LOCAL. A word that naturally appears multiple
 * times in a passage is NOT flagged as a repetition unless the student JUST
 * read it in the immediate spoken stream context (within a strict window).
 *
 * @param {Array<string>} spokenWords
 * @returns {Array<{ isRepetition: boolean, sourceIdx: number|null, repetitionCount: number }>}
 */
function detectRepetitions(spokenWords) {
  const repInfo = spokenWords.map(() => ({ isRepetition: false, sourceIdx: null, repetitionCount: 1 }));
  const normalized = spokenWords.map(w => normalizeWord(w));

  // Pass 1: Single-word adjacent repetitions (including filler-separated)
  for (let i = 1; i < normalized.length; i++) {
    const curr = normalized[i];
    if (!curr || isFillerWord(curr)) continue;

    // Direct adjacent: "bata bata"
    if (curr === normalized[i - 1] && !isFillerWord(normalized[i - 1])) {
      repInfo[i] = {
        isRepetition: true,
        sourceIdx: repInfo[i - 1].isRepetition ? repInfo[i - 1].sourceIdx : i - 1,
        repetitionCount: (repInfo[i - 1].repetitionCount || 1) + 1
      };
      continue;
    }

    // Filler-separated: "nagluto uhm nagluto"
    if (
      i >= 2 &&
      isFillerWord(normalized[i - 1]) &&
      curr === normalized[i - 2] &&
      !isFillerWord(normalized[i - 2])
    ) {
      repInfo[i] = {
        isRepetition: true,
        sourceIdx: repInfo[i - 2].isRepetition ? repInfo[i - 2].sourceIdx : i - 2,
        repetitionCount: (repInfo[i - 2].repetitionCount || 1) + 1
      };
      continue;
    }
  }

  // Pass 2: Multi-word phrase repetitions (strict local window, n-grams 2-8)
  for (let len = 2; len <= 8; len++) {
    for (let i = 0; i + len <= normalized.length; i++) {
      if (repInfo[i].isRepetition) continue;

      const phrase = normalized.slice(i, i + len);
      if (phrase.every(w => !w || isFillerWord(w))) continue;
      const phraseStr = phrase.join(' ');
      if (phraseStr.trim().length < 4) continue;

      // Strict local window: only look immediately after the phrase
      const maxLookAhead = Math.min(i + len + len + 3, normalized.length - len);
      for (let j = i + len; j <= maxLookAhead; j++) {
        if (repInfo[j].isRepetition) continue;
        const compareStr = normalized.slice(j, j + len).join(' ');
        if (phraseStr === compareStr) {
          for (let k = 0; k < len; k++) {
            if (!repInfo[j + k].isRepetition) {
              repInfo[j + k] = { isRepetition: true, sourceIdx: i + k, repetitionCount: 2 };
            }
          }
        }
      }
    }
  }

  return repInfo;
}

// ============================================================
// GOTOH AFFINE-GAP SEQUENCE ALIGNMENT
// ============================================================

function alignSequences(originalWords, spokenWords, repInfo, isFiller) {
  const m = originalWords.length;
  const n = spokenWords.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) return spokenWords.map((_, j) => ({ type: 'insertion', origIdx: null, spokIdx: j, phoneticConfidence: 0 }));
  if (n === 0) return originalWords.map((_, i) => ({ type: 'omission', origIdx: i, spokIdx: null, phoneticConfidence: 0 }));

  const GAP_OPEN   = -3.0;
  const GAP_EXTEND = -0.5;
  const NEG_INF    = -1e9;

  const M = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));
  const X = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));
  const Y = Array.from({ length: m + 1 }, () => Array(n + 1).fill(NEG_INF));

  M[0][0] = 0;
  for (let i = 1; i <= m; i++) X[i][0] = GAP_OPEN + i * GAP_EXTEND;
  for (let j = 1; j <= n; j++) Y[0][j] = GAP_OPEN + j * GAP_EXTEND;

  for (let i = 1; i <= m; i++) {
    const origWord = originalWords[i - 1];
    for (let j = 1; j <= n; j++) {
      const spokWord = spokenWords[j - 1];
      const phon = getPhoneticSimilarity(origWord, spokWord);

      let matchScore = -1.5;
      if (phon.isExactMatch)          matchScore = 3.0;
      else if (phon.isPhoneticMatch)  matchScore = 2.5;
      else if (phon.similarity >= 0.70) matchScore = 1.0;
      else if (phon.similarity >= 0.45) matchScore = 0.0;

      if (repInfo[j - 1]?.isRepetition || isFiller[j - 1]) matchScore -= 1.2;

      const prevBest = Math.max(M[i - 1][j - 1], X[i - 1][j - 1], Y[i - 1][j - 1]);
      M[i][j] = prevBest + matchScore;
      X[i][j] = Math.max(M[i - 1][j] + GAP_OPEN + GAP_EXTEND, X[i - 1][j] + GAP_EXTEND);
      Y[i][j] = Math.max(M[i][j - 1] + GAP_OPEN + GAP_EXTEND, Y[i][j - 1] + GAP_EXTEND);
    }
  }

  let i = m, j = n;
  const maxScore = Math.max(M[m][n], X[m][n], Y[m][n]);
  let cur = maxScore === X[m][n] ? 'X' : (maxScore === Y[m][n] ? 'Y' : 'M');
  const steps = [];

  while (i > 0 || j > 0) {
    if (cur === 'M') {
      if (i === 0 || j === 0) { cur = i > 0 ? 'X' : 'Y'; continue; }
      const phon = getPhoneticSimilarity(originalWords[i - 1], spokenWords[j - 1]);
      steps.unshift({
        type: (phon.isExactMatch || phon.isPhoneticMatch) ? 'match' : 'substitution',
        origIdx: i - 1, spokIdx: j - 1, phoneticConfidence: Math.round(phon.similarity * 100)
      });
      const b = Math.max(M[i-1][j-1], X[i-1][j-1], Y[i-1][j-1]);
      cur = b === M[i-1][j-1] ? 'M' : (b === X[i-1][j-1] ? 'X' : 'Y');
      i--; j--;
    } else if (cur === 'X') {
      steps.unshift({ type: 'omission', origIdx: i - 1, spokIdx: null, phoneticConfidence: 0 });
      cur = (i > 0 && X[i][j] === X[i-1][j] + GAP_EXTEND) ? 'X' : 'M';
      i--;
    } else {
      steps.unshift({ type: 'insertion', origIdx: i > 0 ? i - 1 : 0, spokIdx: j - 1, phoneticConfidence: 0 });
      cur = (j > 0 && Y[i][j] === Y[i][j-1] + GAP_EXTEND) ? 'Y' : 'M';
      j--;
    }
  }

  return steps;
}

// ============================================================
// COMPOUND TOKEN RECONCILIATION
// ============================================================

function reconcileCompoundTokens(originalWords, spokenWords, timestampedWords = []) {
  const mergedSpoken = [];
  const mergedTimestamps = [];

  let j = 0;
  while (j < spokenWords.length) {
    if (j + 1 < spokenWords.length) {
      const combined = toUnsegmented(spokenWords[j] + spokenWords[j + 1]);
      
      // Position-aware check: only merge if the local passage context (around j)
      // actually contains a compound or hyphenated word matching this combined token.
      const localWindow = originalWords.slice(Math.max(0, j - 2), Math.min(originalWords.length, j + 3));
      const hasLocalCompound = localWindow.some(w => toUnsegmented(w) === combined);

      if (hasLocalCompound) {
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
    if (timestampedWords.length > 0 && timestampedWords[j]) mergedTimestamps.push(timestampedWords[j]);
    j++;
  }

  return { spokenWords: mergedSpoken, timestampedWords: mergedTimestamps };
}

// ============================================================
// TRANSPOSITION DETECTION HELPER
// ============================================================

/**
 * Check if two adjacent substitution steps represent a transposition.
 * Passage: [A, B] — Student reads: [B, A]
 * Extended window: checks up to 2 steps ahead for the second substitution.
 */
/**
 * Returns the index of the partner step if transposition is detected, or -1.
 * Passage: [A, B] — Student reads: [B, A]
 */
function findTranspositionPartner(steps, s, originalWords, spokenWords) {
  for (let offset = 1; offset <= 2; offset++) {
    const ns = s + offset;
    if (ns >= steps.length) break;
    const nextStep = steps[ns];
    if (!nextStep || nextStep.type !== 'substitution') continue;
    if (nextStep.origIdx === null || nextStep.spokIdx === null) continue;

    const currOrig = normalizeWord(originalWords[steps[s].origIdx] || '');
    const currSpok = normalizeWord(spokenWords[steps[s].spokIdx] || '');
    const nextOrig = normalizeWord(originalWords[nextStep.origIdx] || '');
    const nextSpok = normalizeWord(spokenWords[nextStep.spokIdx] || '');

    if (currOrig === nextSpok && nextOrig === currSpok) return ns;
  }
  return -1;
}

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

/**
 * Perform Comprehensive Phil-IRI AI Miscue Analysis
 *
 * @param {string}        passageText         - Original reference passage text
 * @param {string|object} spokenInput         - Spoken transcript or { text, words: [{word,start,end}] }
 * @param {number}        readingTimeSeconds   - Total reading duration in seconds
 * @returns {object} Full Phil-IRI analysis output
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

  let rawSpokenWords = [];
  if (timestampedWords.length > 0) {
    rawSpokenWords = timestampedWords.map(tw => tw.word || '').filter(Boolean);
  } else {
    rawSpokenWords = spokenRawText.split(/\s+/).filter(Boolean);
  }

  const reconciled = reconcileCompoundTokens(originalWords, rawSpokenWords, timestampedWords);
  const spokenWords = reconciled.spokenWords;
  timestampedWords = reconciled.timestampedWords;

  const totalPassageWords = originalWords.length;
  if (totalPassageWords === 0) {
    return { totalPassageWords: 0, wordsRead: 0, correctWords: 0, readingRateWPM: 0, accuracyPercentage: 0, miscuesCount: 0, miscues: [] };
  }

  const repInfo  = detectRepetitions(spokenWords);
  const isFiller = spokenWords.map(w => isFillerWord(w));
  const steps    = alignSequences(originalWords, spokenWords, repInfo, isFiller);

  const spokenToOrigMap = new Array(spokenWords.length).fill(null);
  for (const step of steps) {
    if (step.spokIdx !== null && step.origIdx !== null) {
      spokenToOrigMap[step.spokIdx] = step.origIdx;
    }
  }

  // Miscue priority for de-duplication (higher = wins)
  const PRIORITY = {
    self_correction: 6,
    reversal: 5,
    transposition: 5,
    mispronunciation: 4,
    substitution: 4,
    omission: 4,
    repetition: 3,
    insertion: 1
  };

  const miscuesByPosition = new Map();

  const setMiscue = (pos, miscue) => {
    const validPos = Math.max(1, Math.min(pos, totalPassageWords));
    const fallback = originalWords[validPos - 1] || originalWords[0] || '';
    const cleanMiscue = { ...miscue, word_position: validPos, expected_word: miscue.expected_word || fallback };

    const existing = miscuesByPosition.get(validPos);
    if (!existing) { miscuesByPosition.set(validPos, cleanMiscue); return; }

    const newP = PRIORITY[cleanMiscue.miscue_type] || 0;
    const oldP = PRIORITY[existing.miscue_type] || 0;
    if (newP > oldP) miscuesByPosition.set(validPos, cleanMiscue);
  };

  let currentOrigPos = 1;

  for (let s = 0; s < steps.length; s++) {
    const step = steps[s];
    if (step.origIdx !== null && step.origIdx !== undefined) currentOrigPos = step.origIdx + 1;

    const nextStep    = s + 1 < steps.length ? steps[s + 1] : null;
    const spokenWord  = step.spokIdx !== null ? spokenWords[step.spokIdx] : '';
    const isStepFill  = step.spokIdx !== null && isFillerWord(spokenWord);
    const isStepRep   = step.spokIdx !== null && repInfo[step.spokIdx]?.isRepetition;

    // ── A. SELF-CORRECTION ──
    if (step.type !== 'match' && !isStepFill && !isStepRep && nextStep && nextStep.type === 'match' && nextStep.origIdx !== null) {
      const targetWord  = originalWords[nextStep.origIdx];
      const spokenNorm  = normalizeWord(spokenWord);
      const targetNorm  = normalizeWord(targetWord);
      const isSameAsTarget = spokenNorm === targetNorm;

      const isKnownModifier = (word) => {
        const w = (word || '').toLowerCase().trim();
        const MODS = new Set([
          'talaga', 'sobra', 'palagi', 'noon', 'kanina', 'ngayon', 'bukas', 'dito', 'doon', 'diyan',
          'napakaganda', 'napalaki', 'napakaliit', 'mabilis', 'dahan-dahan', 'bigla', 'agad', 'mismo',
          'daw', 'raw', 'din', 'rin', 'pala', 'sana', 'kaya', 'tuloy', 'naman', 'nga',
          'isang', 'dalawang', 'tatlong', 'apat', 'lima', 'buong', 'lahat', 'bawat',
          'puting', 'pulang', 'itim', 'dilaw', 'berde', 'asul', 'luntiang', 'lumang', 'bagong',
          'munting', 'matabang', 'payat', 'mababang', 'mataas', 'matamis', 'maasim', 'maalat',
          'maraming', 'kaunting', 'mabait', 'masipag', 'matalino', 'masayang', 'tahimik', 'tunay'
        ]);
        if (MODS.has(w)) return true;
        if (w.endsWith('ng') && w.length >= 4) return true;
        return w === 'na' || w === 'mga' || w === 'ay' || w === 'at';
      };

      const isSelfCorrect = !isSameAsTarget && (
        (step.type === 'substitution' && step.origIdx === nextStep.origIdx) ||
        (step.spokIdx !== null && isPrefixStutter(spokenWord, targetWord)) ||
        (
          step.type === 'insertion' &&
          (step.origIdx === nextStep.origIdx || step.origIdx + 1 === nextStep.origIdx) &&
          (
            getPhoneticSimilarity(spokenWord, targetWord).similarity >= 0.65 ||
            (!isKnownModifier(spokenWord) && (isKnownFilipinoWord(spokenNorm) || spokenWord.includes('-')))
          )
        )
      );

      if (isSelfCorrect) {
        setMiscue(nextStep.origIdx + 1, {
          expected_word: targetWord,
          spoken_word: `${spokenWord} -> ${spokenWords[nextStep.spokIdx]}`,
          miscue_type: 'self_correction',
          is_corrected: true,
          phonetic_confidence: 100
        });
        s++;
        continue;
      }
    }

    // ── B. MATCH ──
    if (step.type === 'match') {
      // In Phil-IRI, a word that successfully matches a distinct forward passage position
      // is a correct reading of the text. Naturally recurring words in passage text
      // (e.g. "sa bukid", "ang", "si Mila") are author refrains, NOT student repetition errors.
      // Student repetitions are extra spoken tokens aligned as insertions or regressions.
      continue;
    }

    // ── C. OMISSION ──
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

    // ── D. SUBSTITUTION → reversal / transposition / mispronunciation / substitution ──
    if (step.type === 'substitution') {
      const exp = originalWords[step.origIdx] || '';
      const spk = spokenWords[step.spokIdx] || '';
      const expNorm = normalizeWord(exp);
      const spkNorm = normalizeWord(spk);
      if (!expNorm || !spkNorm) continue;

      // Reversal: letters of the expected word read in reverse order.
      // Guard: reversed form must be the exact string (both words must match letter-for-letter).
      // Extra guard: both words should be similar in length (±1 char) to avoid false positives.
      const reversedSpk = spkNorm.split('').reverse().join('');
      const isReversal = (
        expNorm.length >= 2 &&
        expNorm === reversedSpk &&
        Math.abs(expNorm.length - spkNorm.length) <= 1
      );

      // Transposition: adjacent passage words read in reversed order.
      // findTranspositionPartner returns the partner step index, or -1.
      const partnerIdx = findTranspositionPartner(steps, s, originalWords, spokenWords);
      const isTransp   = partnerIdx >= 0;

      // Mispronunciation vs Substitution:
      // Mispronunciation = student attempted the SAME word but distorted phonemes.
      //   Criteria: phonetic similarity >= 0.55 (raised from 0.42 to prevent long
      //   semantically-different words like basketball/volleyball from being grouped here)
      //   OR words share the same 3-char prefix AND both words are not too long (<=8 chars)
      //   OR isPrefixStutter (partial false start of the correct word).
      const { similarity: phonSim } = getPhoneticSimilarity(spk, exp);
      const avgLen = (expNorm.length + spkNorm.length) / 2;
      // Short words (<=5 chars): lower threshold (0.45) since minor phoneme changes are significant
      // Long words (>5 chars): higher threshold (0.60) since superficial letter overlap is common
      const misprThreshold = avgLen <= 5 ? 0.50 : 0.65;
      const sharePrefix = expNorm.length >= 3 && spkNorm.length >= 3 &&
        expNorm.slice(0, 3) === spkNorm.slice(0, 3) && avgLen <= 8;

      const isBothKnownWords = isKnownFilipinoWord(expNorm) && isKnownFilipinoWord(spkNorm);

      let detectedType = 'substitution';
      if (isReversal)                                detectedType = 'reversal';
      else if (isTransp)                             detectedType = 'transposition';
      else if (isBothKnownWords && phonSim < 0.85)   detectedType = 'substitution';
      else if (phonSim >= misprThreshold || sharePrefix) detectedType = 'mispronunciation';
      else                                           detectedType = 'substitution';

      setMiscue(currentOrigPos, {
        expected_word: exp,
        spoken_word: spk,
        miscue_type: detectedType,
        is_corrected: false,
        phonetic_confidence: step.phoneticConfidence || 0
      });

      // If transposition: advance s to partner step so it's counted as 1 error per Phil-IRI standard
      if (isTransp && partnerIdx >= 0) {
        s = partnerIdx; // Skip partner step — 1 error per transposition
      }

      continue;
    }

    // ── E. INSERTION ──
    if (step.type === 'insertion') {
      const sIdx = step.spokIdx;
      const currentSpoken = spokenWords[sIdx];

      // Filler words are never a Phil-IRI miscue
      if (isFillerWord(currentSpoken)) continue;

      // Local repetition
      if (repInfo[sIdx]?.isRepetition) {
        let targetPos = currentOrigPos;
        const srcIdx = repInfo[sIdx].sourceIdx;
        if (srcIdx !== null && spokenToOrigMap[srcIdx] !== null) targetPos = spokenToOrigMap[srcIdx] + 1;
        setMiscue(targetPos, {
          expected_word: originalWords[targetPos - 1] || originalWords[0] || '',
          spoken_word: currentSpoken,
          miscue_type: 'repetition',
          is_corrected: false,
          phonetic_confidence: 0
        });
        continue;
      }

      // Adjacent duplicate (same word as next aligned passage word)
      const spokenNorm = normalizeWord(currentSpoken);
      const isAdjDup = nextStep && nextStep.spokIdx !== null && nextStep.origIdx !== null &&
        spokenNorm === normalizeWord(spokenWords[nextStep.spokIdx]);

      if (isAdjDup) {
        const targetPos = nextStep.origIdx + 1;
        setMiscue(targetPos, {
          expected_word: originalWords[targetPos - 1] || originalWords[0] || '',
          spoken_word: currentSpoken,
          miscue_type: 'repetition',
          is_corrected: false,
          phonetic_confidence: 100
        });
        continue;
      }

      // Pure insertion
      setMiscue(currentOrigPos, {
        expected_word: originalWords[currentOrigPos - 1] || originalWords[0] || '',
        spoken_word: currentSpoken,
        miscue_type: 'insertion',
        is_corrected: false,
        phonetic_confidence: 0
      });
    }
  }

  const miscues = Array.from(miscuesByPosition.values()).sort((a, b) => a.word_position - b.word_position);

  // DepEd Phil-IRI: self_correction is NOT an error
  const penalizedMiscues   = miscues.filter(m => m.miscue_type !== 'self_correction').length;
  const correctWords        = Math.max(0, totalPassageWords - penalizedMiscues);
  const accuracyPercentage  = totalPassageWords > 0
    ? Number(((correctWords / totalPassageWords) * 100).toFixed(1))
    : 0;
  const wordsRead      = spokenWords.length;
  const readingTimeMin = (readingTimeSeconds || 60) / 60;
  const readingRateWPM = readingTimeMin > 0 ? Number((wordsRead / readingTimeMin).toFixed(1)) : 0;

  return { totalPassageWords, wordsRead, correctWords, readingRateWPM, accuracyPercentage, miscuesCount: miscues.length, miscues };
}

// ===========================================================================
// OFFICIAL DEPED PHIL-IRI COMPUTATION STANDARDS
// ===========================================================================

const TABLE_6_PERCENTAGES = {
  5: { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20 },
  6: { 6: 100, 5: 83, 4: 67, 3: 50, 2: 33, 1: 17 },
  7: { 7: 100, 6: 86, 5: 71, 4: 57, 3: 43, 2: 29, 1: 14 },
  8: { 8: 100, 7: 88, 6: 75, 5: 63, 4: 50, 3: 38, 2: 25, 1: 13 },
};

function getComprehensionScorePercentage(correctAnswers, totalQuestions) {
  const correct = Math.max(0, Number(correctAnswers) || 0);
  const total   = Number(totalQuestions) || 0;
  if (total <= 0) return 0;
  if (TABLE_6_PERCENTAGES[total] && TABLE_6_PERCENTAGES[total][correct] !== undefined) return TABLE_6_PERCENTAGES[total][correct];
  return Math.round((correct / total) * 100);
}

function calculateOralReadingScore(totalWords, miscuesCount) {
  const words   = Math.max(0, Number(totalWords) || 0);
  const miscues = Math.max(0, Number(miscuesCount) || 0);
  if (words <= 0) return 0;
  return Number(((Math.max(0, words - miscues) / words) * 100).toFixed(1));
}

function calculateReadingRate(wordsRead, durationSeconds) {
  const words = Math.max(0, Number(wordsRead) || 0);
  const secs  = Number(durationSeconds) || 0;
  if (secs <= 0) return 0;
  return Number(((words / secs) * 60).toFixed(1));
}

function getWordReadingLevel(accuracyPercentage) {
  const acc = Number(accuracyPercentage) || 0;
  if (acc >= 97) return 'Independent';
  if (acc >= 90) return 'Instructional';
  return 'Frustration';
}

function getComprehensionLevel(comprehensionScorePercentage) {
  const comp = Number(comprehensionScorePercentage) || 0;
  if (comp >= 80) return 'Independent';
  if (comp >= 59) return 'Instructional';
  return 'Frustration';
}

function getPhilIriOralProfile(accuracyPercentage, comprehensionScorePercentage) {
  const wordLevel = getWordReadingLevel(accuracyPercentage);
  const compLevel = getComprehensionLevel(comprehensionScorePercentage);
  if (wordLevel === 'Frustration' || compLevel === 'Frustration') return 'Frustration';
  if (wordLevel === 'Independent' && compLevel === 'Independent') return 'Independent';
  return 'Instructional';
}

function getPhilIriListeningProfile(comprehensionScorePercentage) {
  return getComprehensionLevel(comprehensionScorePercentage);
}

function getPhilIriSilentProfile(readingSpeedWpm, comprehensionScorePercentage, gradeLevel = 'Grade 4', language = 'fil') {
  const compLevel = getComprehensionLevel(comprehensionScorePercentage);
  const speed     = Number(readingSpeedWpm) || 0;
  if (speed <= 0) return compLevel;

  const isEnglish = (language || '').toLowerCase().startsWith('en');
  let speedLevel = 'Instructional';
  if (isEnglish) {
    if (speed >= 100) speedLevel = 'Independent';
    else if (speed >= 70) speedLevel = 'Instructional';
    else speedLevel = 'Frustration';
  } else {
    if (speed >= 80) speedLevel = 'Independent';
    else if (speed >= 60) speedLevel = 'Instructional';
    else speedLevel = 'Frustration';
  }

  if (speedLevel === 'Frustration' || compLevel === 'Frustration') return 'Frustration';
  if (speedLevel === 'Instructional' || compLevel === 'Instructional') return 'Instructional';
  return 'Independent';
}

function getPhilIriProfile(accuracyPercentage, comprehensionScorePercentage) {
  return getPhilIriOralProfile(accuracyPercentage, comprehensionScorePercentage);
}

module.exports = {
  analyzeOralReading,
  getPhilIriProfile,
  getPhilIriOralProfile,
  getPhilIriListeningProfile,
  getPhilIriSilentProfile,
  getWordReadingLevel,
  getComprehensionLevel,
  getComprehensionScorePercentage,
  calculateOralReadingScore,
  calculateReadingRate,
  TABLE_6_PERCENTAGES,
  alignSequences,
  detectRepetitions,
  normalizeWord,
  getPhoneticSimilarity,
};
