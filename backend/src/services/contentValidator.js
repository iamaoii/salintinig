/**
 * SalinTinig — Content Validator Service
 * 
 * Verifies that candidate vocabulary words meet the criteria for elementary students (Grades 4–6).
 * Checks:
 * - Word length (at least 3 characters, max 25 characters)
 * - Syllable count (at least 1, recommended >= 2 for pronunciation practice)
 * - Profanity and inappropriate content filter
 * - Complete definition requirement
 */

const BLOCKED_WORDS = new Set([
  'adult', 'violence', 'kill', 'murder', 'blood', 'weapon', 'gun', 'curse', 'damned',
  'patay', 'dugo', 'baril', 'saksak', 'laslason', 'pumatay',
]);

/**
 * Validates a candidate word item against Grade 4–6 criteria.
 * @param {object} item - The vocabulary word candidate
 * @returns {{ isValid: boolean, reason?: string, validatedItem?: object }}
 */
function validateWordCandidate(item) {
  if (!item || typeof item !== 'object') {
    return { isValid: false, reason: 'Invalid word object' };
  }

  const word = (item.word || '').trim();
  if (!word || word.length < 3) {
    return { isValid: false, reason: 'Word too short (minimum 3 letters)' };
  }
  if (word.length > 25) {
    return { isValid: false, reason: 'Word too long for Grades 4–6' };
  }

  const lower = word.toLowerCase();
  for (const blocked of BLOCKED_WORDS) {
    if (lower.includes(blocked)) {
      return { isValid: false, reason: 'Word blocked due to inappropriate content' };
    }
  }

  const syllables = Array.isArray(item.syllables) ? item.syllables.filter(Boolean) : [];
  if (syllables.length === 0) {
    return { isValid: false, reason: 'Missing syllable breakdown' };
  }

  const definition = (item.definition || '').trim();
  if (!definition) {
    return { isValid: false, reason: 'Missing child-friendly definition' };
  }

  const lang = (item.language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';

  return {
    isValid: true,
    validatedItem: {
      word: word.charAt(0).toUpperCase() + word.slice(1),
      definition,
      translation: (item.translation || '').trim(),
      exampleSentence: (item.exampleSentence || '').trim(),
      syllables,
      language: lang,
      source: item.source || 'dictionary_api',
      contentStatus: 'validated',
    },
  };
}

module.exports = {
  validateWordCandidate,
  BLOCKED_WORDS,
};
