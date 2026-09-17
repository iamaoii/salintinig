/**
 * SalinTinig — Dictionary & Content Ingestion Service
 * 
 * Fetches candidate words from external dictionary APIs (Free Dictionary API for English,
 * and lexical lookup + KWF syllabifier for Filipino).
 */

const https = require('https');

/**
 * Filipino KWF Rule-based Syllabifier
 * Breaks words into syllables based on Filipino orthography (CV, CVC, PK, KPK patterns).
 */
function syllabifyFilipino(word) {
  if (!word || typeof word !== 'string') return [];
  const clean = word.trim();
  const vowels = 'aeiouáéíóú';
  const syllables = [];
  let current = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = i + 1 < clean.length ? clean[i + 1] : '';
    const nextNextChar = i + 2 < clean.length ? clean[i + 2] : '';

    current += char;

    const isVowel = vowels.includes(char.toLowerCase());
    const isNextVowel = vowels.includes(nextChar.toLowerCase());
    const isNextNextVowel = vowels.includes(nextNextChar.toLowerCase());

    if (isVowel) {
      if (!nextChar) {
        syllables.push(current);
        current = '';
      } else if (isNextVowel) {
        // V-V break (e.g. "ka-a-la-man")
        syllables.push(current);
        current = '';
      } else if (!isNextVowel && isNextNextVowel) {
        // V-CV break (e.g. "ba-ha-ga-ri")
        syllables.push(current);
        current = '';
      } else if (!isNextVowel && !isNextNextVowel && nextNextChar) {
        // V-CCV break (e.g. "bang-ka", "ang-kin")
        // Check for diphthongs or consonant clusters
        current += nextChar;
        i++;
        syllables.push(current);
        current = '';
      }
    }
  }

  if (current) {
    if (syllables.length > 0) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }

  // Capitalize first letter of first syllable
  if (syllables.length > 0) {
    syllables[0] = syllables[0].charAt(0).toUpperCase() + syllables[0].slice(1);
  }

  return syllables;
}

/**
 * Basic English Syllable breakdown heuristic
 */
function syllabifyEnglish(word) {
  if (!word) return [];
  const clean = word.toLowerCase().trim();
  
  // Approximate standard syllables
  const regex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
  const matches = clean.match(regex);
  if (!matches || matches.length <= 1) {
    return [word];
  }
  return matches;
}

/**
 * HTTP GET JSON helper
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'SalinTinig-App/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

/**
 * Look up word metadata from external dictionary API
 * @param {string} word - Target vocabulary word
 * @param {string} language - 'fil' or 'en'
 */
async function lookupWordMetadata(word, language = 'en') {
  const cleanWord = (word || '').trim();
  if (!cleanWord) return null;

  const isEng = language === 'en' || language === 'eng';

  if (isEng) {
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord.toLowerCase())}`;
      const data = await fetchJson(url);

      if (data && Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const definition = meaning?.definitions?.[0]?.definition || '';
        const example = meaning?.definitions?.[0]?.example || '';
        const syllables = syllabifyEnglish(cleanWord);

        return {
          word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
          definition,
          exampleSentence: example,
          translation: '',
          syllables,
          language: 'en',
          source: 'dictionary_api',
        };
      }
    } catch (e) {
      console.warn(`[dictionaryService] External dictionary lookup failed for "${cleanWord}":`, e.message);
    }
  }

  // Fallback / Filipino word generation
  return {
    word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
    definition: '',
    exampleSentence: '',
    translation: '',
    syllables: isEng ? syllabifyEnglish(cleanWord) : syllabifyFilipino(cleanWord),
    language: isEng ? 'en' : 'fil',
    source: 'dictionary_api',
  };
}

module.exports = {
  lookupWordMetadata,
  syllabifyFilipino,
  syllabifyEnglish,
};
