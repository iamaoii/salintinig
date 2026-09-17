/**
 * Utility functions to encode and decode entity tokens securely for Salintinig routes.
 * Prefixes used:
 * - 'act' for Phil-IRI activities (e.g. act-bGlzdGVuaW5nX...)
 * - 'st'  for Students (e.g. st-eDEwOTI4Mzc0ODI5MQ)
 * - 'tch' for Teachers/Faculty (e.g. tch-bTVQMDAx)
 * - 'psg' for Phil-IRI Passages (e.g. psg-cGFzc2FnZS0x)
 */

function encodeSecureToken(prefix, idValue) {
  if (!idValue) return '';
  const str = String(idValue).trim();
  if (str.startsWith(`${prefix}-`)) return str;
  const encodedHash = Buffer.from(str).toString('base64url');
  return `${prefix}-${encodedHash}`;
}

function decodeSecureToken(prefix, tokenValue) {
  if (!tokenValue) return '';
  const str = String(tokenValue).trim();
  const tokenPrefix = `${prefix}-`;
  if (str.startsWith(tokenPrefix)) {
    try {
      const hash = str.substring(tokenPrefix.length);
      return Buffer.from(hash, 'base64url').toString('utf-8');
    } catch (e) {
      return str;
    }
  }
  return str;
}

function encodeActivityId(type, period, language) {
  const rawSlug = `${type}_${period}_${language}`;
  return encodeSecureToken('act', rawSlug);
}

function decodeActivityId(activityId) {
  let cleanId = decodeSecureToken('act', activityId);

  let passageId = null;
  let assessmentType = null;
  let period = null;
  let language = null;

  const knownTypes = ['oral', 'listening', 'silent'];
  const matchingType = knownTypes.find((t) => cleanId.toLowerCase().startsWith(t + '_'));

  if (matchingType) {
    assessmentType = matchingType;
    const remainder = cleanId.substring(matchingType.length + 1).toLowerCase();
    if (remainder.endsWith('_fil') || remainder.endsWith('_en')) {
      language = remainder.endsWith('_en') ? 'en' : 'fil';
      period = remainder.substring(0, remainder.lastIndexOf('_'));
    } else {
      period = remainder;
    }
  } else if (cleanId.includes('_')) {
    const parts = cleanId.split('_');
    passageId = parts[0];
    if (parts.length > 1) assessmentType = parts[1];
    if (parts.length > 2) period = parts.slice(2).join('_');
  } else {
    passageId = cleanId;
  }

  return { passageId, assessmentType, period, language, rawId: cleanId };
}

module.exports = {
  encodeSecureToken,
  decodeSecureToken,
  encodeActivityId,
  decodeActivityId,
};
