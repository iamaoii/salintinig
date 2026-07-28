const AUTH_KEY = 'salintinig_auth';

export function login() {
  localStorage.setItem(AUTH_KEY, 'true');
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}
