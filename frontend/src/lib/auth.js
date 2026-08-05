const AUTH_KEY = 'salintinig_auth';
const USER_KEY = 'salintinig_user';
const TOKEN_KEY = 'salintinig_token';
const LEGACY_TOKEN_KEY = 'token';

const API_BASE_URL = 'http://localhost:5000/api/auth';

function syncLegacyTokenKey() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !localStorage.getItem(LEGACY_TOKEN_KEY)) {
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
  }
}

syncLegacyTokenKey();

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
      const mustChange = Boolean(data.mustChangePassword || data.user?.mustChangePassword);
      if (!mustChange) {
        localStorage.setItem(AUTH_KEY, 'true');
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
      localStorage.setItem(USER_KEY, JSON.stringify({ ...data.user, mustChangePassword: mustChange }));
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(LEGACY_TOKEN_KEY, data.token);
      }
      return {
        success: true,
        user: data.user,
        mustChangePassword: mustChange,
      };
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

/**
 * Async API function to update initial temporary password
 */
export async function changePasswordAsync(newPassword) {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      localStorage.setItem(AUTH_KEY, 'true');
      const user = getUser();
      if (user) {
        user.mustChangePassword = false;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to update password.' };
  } catch (err) {
    return { success: false, error: 'Network error updating password.' };
  }
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
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
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
