/**
 * Phil-IRI Miscue Analysis Engine
 * Compares target passage text with STT spoken transcript text to auto-flag miscues.
 */

function normalizeWord(word) {
  if (!word) return '';
  return word.toLowerCase().replace(/[^\w\sñÑáéíóú-]/gi, '').trim();
}

/**
 * Perform Diff Alignment between expected passage words and spoken words
 * Returns miscue details and score metrics.
 */
function analyzeOralReading(passageText, spokenTranscript, readingTimeSeconds = 60) {
  const originalWords = passageText.split(/\s+/).filter(Boolean);
  const spokenWords = (spokenTranscript || '').split(/\s+/).filter(Boolean);

  const totalPassageWords = originalWords.length;
  const miscues = [];
  let correctCount = 0;

  // Word Alignment
  let origIdx = 0;
  let spokIdx = 0;

  while (origIdx < originalWords.length && spokIdx < spokenWords.length) {
    const origNorm = normalizeWord(originalWords[origIdx]);
    const spokNorm = normalizeWord(spokenWords[spokIdx]);

    if (origNorm === spokNorm) {
      // Exact Match
      correctCount++;
      origIdx++;
      spokIdx++;
    } else if (
      origIdx + 1 < originalWords.length &&
      normalizeWord(originalWords[origIdx + 1]) === spokNorm
    ) {
      // Omission: Student skipped originalWords[origIdx]
      miscues.push({
        word_position: origIdx + 1,
        expected_word: originalWords[origIdx],
        spoken_word: '',
        miscue_type: 'omission',
        is_corrected: false
      });
      origIdx++;
    } else if (
      spokIdx + 1 < spokenWords.length &&
      origNorm === normalizeWord(spokenWords[spokIdx + 1])
    ) {
      // Insertion: Student added an extra word
      miscues.push({
        word_position: origIdx + 1,
        expected_word: '',
        spoken_word: spokenWords[spokIdx],
        miscue_type: 'insertion',
        is_corrected: false
      });
      spokIdx++;
    } else {
      // Substitution or Mispronunciation
      miscues.push({
        word_position: origIdx + 1,
        expected_word: originalWords[origIdx],
        spoken_word: spokenWords[spokIdx],
        miscue_type: 'substitution',
        is_corrected: false
      });
      origIdx++;
      spokIdx++;
    }
  }

  // Handle remaining unread words in passage (Omissions)
  while (origIdx < originalWords.length) {
    miscues.push({
      word_position: origIdx + 1,
      expected_word: originalWords[origIdx],
      spoken_word: '',
      miscue_type: 'omission',
      is_corrected: false
    });
    origIdx++;
  }

  const wordsRead = spokenWords.length;
  const readingTimeMin = (readingTimeSeconds || 60) / 60;
  const readingRateWPM = readingTimeMin > 0 ? Number((wordsRead / readingTimeMin).toFixed(2)) : 0;
  const accuracyPercentage = totalPassageWords > 0 
    ? Number(((correctCount / totalPassageWords) * 100).toFixed(2))
    : 0;

  return {
    totalPassageWords,
    wordsRead,
    correctWords: correctCount,
    readingRateWPM,
    accuracyPercentage,
    miscuesCount: miscues.length,
    miscues
  };
}

/**
 * Calculate Phil-IRI Reading Profile Label
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
  normalizeWord
};
