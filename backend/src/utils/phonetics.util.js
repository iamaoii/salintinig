/**
 * SalinTinig Bilingual Phonetics & Linguistic Utility (Filipino & English)
 * 
 * Provides:
 * - Phoneme normalization, Soundex/Metaphone style phonetic transforms
 * - Dialectal and developmental allophone mapping (e/i, o/u, p/f, b/v, d/r, th/d/t)
 * - Number-to-word expansion in Filipino & English
 * - Compound hyphenated word handling (mag-aaral <-> mag aaral <-> magaaral)
 * - Prefix stutter / false start detection
 * - Deep phonetic similarity scoring (0.0 to 1.0)
 */

const NUMBER_WORDS_MAP = {
  '0': ['zero', 'sero', 'wala'],
  '1': ['isa', 'one', 'unang'],
  '2': ['dalawa', 'two', 'pangalawa'],
  '3': ['tatlo', 'three', 'pangatlo'],
  '4': ['apat', 'four', 'pang-apat'],
  '5': ['lima', 'five', 'panlima'],
  '6': ['anim', 'six', 'pang-anim'],
  '7': ['pito', 'seven', 'pampito'],
  '8': ['walo', 'eight', 'pangwalo'],
  '9': ['siyam', 'nine', 'pansiyam'],
  '10': ['sampu', 'ten', 'pansampu'],
  '11': ['labing-isa', 'eleven'],
  '12': ['labindalawa', 'twelve'],
  '15': ['labinlima', 'fifteen'],
  '20': ['dalawampu', 'twenty'],
  '50': ['limampu', 'fifty'],
  '100': ['daan', 'sandaan', 'hundred', 'one hundred']
};

/**
 * Standard word normalization (lowercased, stripped of non-alphanumeric punctuation except hyphens)
 * @param {string} word 
 * @returns {string}
 */
function normalizeWord(word) {
  if (!word || typeof word !== 'string') return '';
  return word
    .toLowerCase()
    .replace(/[^\w\sñÑáéíóú-]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove hyphens and whitespace to compare compound words
 * (e.g. "mag-aaral" -> "magaaral", "araw-araw" -> "arawaraw")
 * @param {string} word 
 * @returns {string}
 */
function toUnsegmented(word) {
  return normalizeWord(word).replace(/[-\s]/g, '');
}

/**
 * Filipino & ESL Phonetic Code Transformer
 * Normalizes common dialectal and developmental allophones into canonical phonetic representations:
 * - Vowel pairs: e <-> i, o <-> u
 * - Consonant pairs: f <-> p, v <-> b, d <-> r (in intervocalic positions)
 * - Digraphs: ng, sh, ch, ts
 * - Silent letters & consonant cluster reductions
 * 
 * @param {string} word 
 * @returns {string} canonical phonetic string
 */
function toPhoneticCode(word) {
  const norm = normalizeWord(word);
  if (!norm) return '';

  let p = norm
    // Handle Filipino digraphs
    .replace(/ng/g, 'N')
    .replace(/ts/g, 'C')
    .replace(/ch/g, 'C')
    .replace(/sh/g, 'S')
    .replace(/ny/g, 'ñ')

    // Handle English voiced/voiceless dental fricatives (th -> d / t)
    .replace(/th/g, 'd')

    // Handle allophones common in Philippine languages
    .replace(/f/g, 'p')
    .replace(/v/g, 'b')
    .replace(/j/g, 'dy')
    .replace(/z/g, 's')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')

    // Spanish-Tagalog loanword allophones (e.g. pamilya <-> familia)
    .replace(/ly/g, 'li')

    // Filipino vowel neutrality: e -> i, o -> u
    .replace(/e/g, 'i')
    .replace(/o/g, 'u')

    // Intervocalic d/r equivalence (e.g. madami / marami)
    .replace(/(?<=[aeiou])d(?=[aeiou])/g, 'r')

    // Initial Tagalog d/r allophone pairs (din/rin, daw/raw, dito/rito, doon/roon, diyan/riyan)
    .replace(/^r(?=i[n|t|y]|a[w]|u[u|n])/g, 'd')

    // Glottal / hyphen collapses
    .replace(/[-']/g, '')

    // Collapse repeated letters (e.g. "pp" -> "p", "aa" -> "a")
    .replace(/(.)\1+/g, '$1');

  return p;
}

/**
 * Levenshtein distance on two strings
 * @param {string} s1 
 * @param {string} s2 
 * @returns {number} edit distance
 */
function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // Deletion
        matrix[i][j - 1] + 1,       // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * String similarity ratio (0.0 to 1.0)
 * @param {string} s1 
 * @param {string} s2 
 * @returns {number}
 */
function getStringSimilarity(s1, s2) {
  const norm1 = normalizeWord(s1);
  const norm2 = normalizeWord(s2);
  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(norm1, norm2);
  return (maxLen - dist) / maxLen;
}

/**
 * Check if spoken word is a partial stutter / false-start prefix of expected word
 * (e.g. "nag" or "nagla" for "naglakad", "fright" for "frightened")
 * @param {string} spoken 
 * @param {string} expected 
 * @returns {boolean}
 */
function isPrefixStutter(spoken, expected) {
  const s = normalizeWord(spoken);
  const e = normalizeWord(expected);
  if (!s || !e || s.length < 2 || s.length >= e.length) return false;
  return e.startsWith(s) || toPhoneticCode(e).startsWith(toPhoneticCode(s));
}

/**
 * Comprehensive Phonetic & Grapheme Similarity Score (0.0 to 1.0)
 * Evaluates exact surface text, number-to-word equivalents, compound word matching,
 * and deep phonetic/sound distance.
 * 
 * @param {string} expectedWord - Reference word in passage
 * @param {string} spokenWord - Transcribed word from student's audio
 * @returns {{ similarity: number, isPhoneticMatch: boolean, isExactMatch: boolean, isNumberMatch: boolean }}
 */
function getPhoneticSimilarity(expectedWord, spokenWord) {
  const normExp = normalizeWord(expectedWord);
  const normSpok = normalizeWord(spokenWord);

  if (normExp === normSpok) {
    return { similarity: 1.0, isPhoneticMatch: true, isExactMatch: true, isNumberMatch: false };
  }
  if (!normExp || !normSpok) {
    return { similarity: 0.0, isPhoneticMatch: false, isExactMatch: false, isNumberMatch: false };
  }

  // 1. Compound / Unsegmented Match (e.g. "mag-aaral" vs "magaaral")
  if (toUnsegmented(normExp) === toUnsegmented(normSpok)) {
    return { similarity: 1.0, isPhoneticMatch: true, isExactMatch: true, isNumberMatch: false };
  }

  // 2. Number-to-Words Check (e.g. passage "5" vs student "lima" or "five")
  if (NUMBER_WORDS_MAP[normExp]) {
    const validWords = NUMBER_WORDS_MAP[normExp];
    if (validWords.includes(normSpok) || validWords.some(vw => normSpok.startsWith(vw))) {
      return { similarity: 1.0, isPhoneticMatch: true, isExactMatch: true, isNumberMatch: true };
    }
  }
  if (NUMBER_WORDS_MAP[normSpok]) {
    const validWords = NUMBER_WORDS_MAP[normSpok];
    if (validWords.includes(normExp) || validWords.some(vw => normExp.startsWith(vw))) {
      return { similarity: 1.0, isPhoneticMatch: true, isExactMatch: true, isNumberMatch: true };
    }
  }

  // 3. Surface Graphemic Similarity
  const graphemeSim = getStringSimilarity(normExp, normSpok);

  // 4. Phonetic Code Similarity
  const phoneExp = toPhoneticCode(normExp);
  const phoneSpok = toPhoneticCode(normSpok);
  const phoneticSim = getStringSimilarity(phoneExp, phoneSpok);

  // Weighted combination giving priority to acoustic similarity for child speech
  const compositeSimilarity = Number((graphemeSim * 0.4 + phoneticSim * 0.6).toFixed(3));

  // Determine if it qualifies as an acceptable dialectal/phonetic match
  // Canonical phonetic codes must match identically (e.g. lalaki/lalake, marami/madami)
  // Dropped suffixes like "praised" vs "praise", "running" vs "run" have different phonetic codes and will correctly be flagged as substitutions.
  const isPhoneticMatch = phoneExp === phoneSpok;

  return {
    similarity: Math.max(graphemeSim, compositeSimilarity),
    isPhoneticMatch,
    isExactMatch: false,
    isNumberMatch: false
  };
}

module.exports = {
  normalizeWord,
  toUnsegmented,
  toPhoneticCode,
  levenshteinDistance,
  getStringSimilarity,
  getPhoneticSimilarity,
  isPrefixStutter,
};
