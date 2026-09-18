// Centralized API configuration for environment adaptation
// In production (Cloudflare Pages), VITE_API_URL is configured via Cloudflare Dashboard
const rawApiUrl = import.meta.env.VITE_API_URL || '';

// Clean API Base URL (without trailing slash)
export const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

/**
 * Helper to build full API endpoints cleanly.
 * If endpoint starts with '/api', and API_BASE_URL is set, it will construct full URL properly.
 * E.g., getApiUrl('/api/auth/login') => '/api/auth/login' (in dev) or 'https://your-api.com/api/auth/login' (in prod)
 * Or in local dev (with proxy): getApiUrl('/api/auth/login') => '/api/auth/login'
 */
export function getApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}
