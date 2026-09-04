/**
 * Pronunciation Evaluator Service
 * 
 * Compares transcribed speech against target words and syllables using
 * Normalized Levenshtein Distance and Phonetic Character Matching.
 */

function calculateLevenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Clean and normalize spoken or reference tokens
 */
function cleanText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\sñ]/gi, '')
    .trim();
}

/**
 * Evaluates pronunciation accuracy between target word and student transcript.
 * Enforces strict syllable-level correctness:
 * - A single mispronounced or substituted syllable (e.g. 'makanuri' instead of 'mapanuri')
 *   will NOT pass and will cap the score at <75%.
 * - Exact and near-exact matches earn genuine passing scores (88–100%).
 * 
 * @param {string} targetWord - The target vocabulary word (e.g. "Mapanuri")
 * @param {string} transcript - The text returned by Whisper STT
 * @param {Array<string>} [syllables=[]] - Expected phonetic syllables (e.g. ["ma", "pa", "nu", "ri"])
 * @param {string} [language='fil'] - Language code ('fil' or 'en')
 * @returns {{ accuracyScore: number, isPassed: boolean, transcript: string, feedback: string }}
 */
function evaluatePronunciation(targetWord, transcript, syllables = [], language = 'fil') {
  const cleanTarget = cleanText(targetWord);
  const cleanSpoken = cleanText(transcript);
  const isTagalog = (language || 'fil').toLowerCase().startsWith('fil') || (language || 'fil').toLowerCase().startsWith('tl');

  if (!cleanSpoken) {
    return {
      accuracyScore: 0,
      isPassed: false,
      transcript: '',
      feedback: isTagalog ? 'Walang malinaw na boses. Magsalita nang mas malapit sa mic.' : 'No clear speech. Speak closer to mic.',
    };
  }

  // 1. Direct whole-string exact match
  if (cleanTarget === cleanSpoken) {
    return {
      accuracyScore: 100,
      isPassed: true,
      transcript,
      feedback: isTagalog ? 'Napakagaling ng pagbigkas!' : 'Excellent pronunciation!',
    };
  }

  // 2. Token isolation: if student said multiple words, check if target was spoken
  const spokenTokens = cleanSpoken.split(/\s+/).filter(Boolean);
  if (spokenTokens.includes(cleanTarget)) {
    return {
      accuracyScore: 100,
      isPassed: true,
      transcript,
      feedback: isTagalog ? 'Napakagaling ng pagbigkas!' : 'Excellent pronunciation!',
    };
  }

  // Find the single spoken token closest to the target word
  let bestToken = spokenTokens[0] || cleanSpoken;
  let bestDist = calculateLevenshtein(cleanTarget, bestToken);
  for (const token of spokenTokens) {
    const d = calculateLevenshtein(cleanTarget, token);
    if (d < bestDist) {
      bestDist = d;
      bestToken = token;
    }
  }

  const maxLen = Math.max(cleanTarget.length, bestToken.length, 1);
  const charSim = Math.max(0, 1 - bestDist / maxLen);

  // 3. Syllable-level validation
  const cleanSyllables = (syllables || []).map(s => cleanText(s)).filter(Boolean);
  let matchedCount = 0;
  const missingSyllables = [];

  if (cleanSyllables.length > 0) {
    let searchIndex = 0;
    for (const syl of cleanSyllables) {
      const idx = bestToken.indexOf(syl, searchIndex);
      if (idx !== -1) {
        matchedCount++;
        searchIndex = idx + syl.length;
      } else {
        missingSyllables.push(syl);
      }
    }
  }

  let accuracyScore = 0;
  let isPassed = false;
  let feedback = '';

  if (cleanSyllables.length > 0) {
    const sylRatio = matchedCount / cleanSyllables.length;
    const allSyllablesPresent = (matchedCount === cleanSyllables.length);

    if (allSyllablesPresent && bestDist === 0) {
      accuracyScore = 100;
      isPassed = true;
      feedback = isTagalog ? 'Napakagaling ng pagbigkas!' : 'Great pronunciation!';
    } else if (allSyllablesPresent && bestDist <= 1) {
      // All syllables pronounced with minor accent variation or soft trailing character
      accuracyScore = Math.max(88, Math.round(92 - bestDist * 4));
      isPassed = true;
      feedback = isTagalog ? 'Napakagaling ng pagbigkas!' : 'Well done!';
    } else if (allSyllablesPresent) {
      accuracyScore = Math.round(sylRatio * 50 + charSim * 40);
      isPassed = accuracyScore >= 88;
      feedback = isPassed
        ? (isTagalog ? 'Mahusay!' : 'Well done!')
        : (isTagalog ? 'Muntik na! Bigkasin nang mas malinaw.' : 'Almost there! Speak clearly.');
    } else {
      // Core syllable was mispronounced or missing (e.g. 'makanuri' instead of 'mapanuri')
      // STRICT: Cannot pass if any syllable was replaced or dropped! Cap score at <=75%.
      accuracyScore = Math.min(75, Math.round(sylRatio * 60 + charSim * 20));
      isPassed = false;
      if (missingSyllables.length === 1) {
        feedback = isTagalog
          ? `Pakinggan ang pantig na "${missingSyllables[0]}". Subukan muli!`
          : `Practice the syllable "${missingSyllables[0]}"!`;
      } else {
        feedback = isTagalog
          ? 'Mali ang ilang pantig. Pakinggan muli si Sally!'
          : 'Some syllables were missed. Listen to Sally again!';
      }
    }
  } else {
    // Fallback without syllables: strict character distance
    accuracyScore = Math.round(charSim * 100);
    isPassed = accuracyScore >= 88 && (cleanTarget.length < 5 ? bestDist === 0 : bestDist <= 1);
    feedback = isPassed
      ? (accuracyScore >= 95 ? (isTagalog ? 'Napakagaling!' : 'Great job!') : (isTagalog ? 'Mahusay!' : 'Well done!'))
      : (isTagalog ? 'Subukan muli! Bigkasin nang malinaw.' : 'Try again! Speak clearly.');
  }

  return {
    accuracyScore,
    isPassed,
    transcript,
    feedback,
  };
}

module.exports = {
  evaluatePronunciation,
  calculateLevenshtein,
  cleanText,
};
