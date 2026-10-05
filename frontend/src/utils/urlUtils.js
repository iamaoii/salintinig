export const POLICIES_BASE_URL = 'https://policies.salintinig.org';

export function getPoliciesUrl(path = '') {
  if (typeof window === 'undefined') return `${POLICIES_BASE_URL}${path}`;
  const host = window.location.hostname.toLowerCase();
  
  // If running locally, use relative path for local testing
  if (host === 'localhost' || host === '127.0.0.1') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${POLICIES_BASE_URL}${cleanPath}`;
}

export function getMainAppUrl(path = '/login') {
  if (typeof window === 'undefined') return `https://salintinig.org${path}`;
  const host = window.location.hostname.toLowerCase();
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  // If running locally, use relative path
  if (host === 'localhost' || host === '127.0.0.1') {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Strip subdomain (policies., privacy., terms.) to get main domain
  const mainHost = host.replace(/^(policies|privacy|terms)\./, '');
  return `${protocol}//${mainHost}${port}${path.startsWith('/') ? path : `/${path}`}`;
}
