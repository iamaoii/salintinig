/**
 * Base64URL token encoder and decoder helper for frontend routes
 */
export function encodeSecureToken(prefix, idValue) {
  if (!idValue) return '';
  const str = String(idValue).trim();
  if (str.startsWith(`${prefix}-`)) return str;
  try {
    const encodedHash = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${prefix}-${encodedHash}`;
  } catch (e) {
    return str;
  }
}

export function decodeSecureToken(prefix, tokenValue) {
  if (!tokenValue) return '';
  const str = String(tokenValue).trim();
  const tokenPrefix = `${prefix}-`;
  if (str.startsWith(tokenPrefix)) {
    try {
      let base64 = str.substring(tokenPrefix.length).replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return atob(base64);
    } catch (e) {
      return str;
    }
  }
  return str;
}
