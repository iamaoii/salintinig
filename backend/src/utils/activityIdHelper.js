/**
 * Helper to encode and decode activity IDs securely
 */
function encodeActivityId(type, period, language) {
  const rawSlug = `${type}_${period}_${language}`;
  const encodedHash = Buffer.from(rawSlug).toString('base64url');
  return `act-${encodedHash}`;
}

function decodeActivityId(activityId) {
  let cleanId = String(activityId || '').trim();
  if (cleanId.startsWith('act-')) {
    try {
      const hash = cleanId.replace(/^act-/, '');
      cleanId = Buffer.from(hash, 'base64url').toString('utf-8');
    } catch (e) {
      // Fallback if decoding fails
    }
  }

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
  encodeActivityId,
  decodeActivityId,
};
