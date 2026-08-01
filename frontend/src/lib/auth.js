const AUTH_KEY = 'salintinig_auth';
const USER_KEY = 'salintinig_user';
const TOKEN_KEY = 'salintinig_token';

const API_BASE_URL = 'http://localhost:5000/api/auth';

/**
 * Async API login connecting directly to live Supabase backend
 */
export async function authenticateAsync(identifier, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      return { success: true, user: data.user };
    }

    if (data && data.error) {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Backend API connection error. Please make sure backend server is running.',
    };
  }

  return {
    success: false,
    error: 'Incorrect username/email or password.',
  };
}

export function logout() {
  const token = getToken();
  if (token) {
    fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {});
  }
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getUserRole() {
  const user = getUser();
  return user?.role || 'teacher';
}
