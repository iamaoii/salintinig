const AUTH_KEY = 'salintinig_auth';
const USER_KEY = 'salintinig_user';
const TOKEN_KEY = 'salintinig_token';
const LEGACY_TOKEN_KEY = 'token';

const API_BASE_URL = 'http://localhost:5000/api/auth';

function getStorage(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function syncLegacyTokenKey() {
  const token = getToken();
  if (token) {
    if (localStorage.getItem(TOKEN_KEY) && !localStorage.getItem(LEGACY_TOKEN_KEY)) {
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
      localStorage.setItem('token', token);
    } else if (sessionStorage.getItem(TOKEN_KEY) && !sessionStorage.getItem(LEGACY_TOKEN_KEY)) {
      sessionStorage.setItem(LEGACY_TOKEN_KEY, token);
      sessionStorage.setItem('token', token);
    }
  }
}

syncLegacyTokenKey();

/**
 * Async API login connecting directly to live Supabase backend
 */
export async function authenticateAsync(identifier, password, rememberMe = false) {
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
      const storage = rememberMe ? localStorage : sessionStorage;

      // Clear both storages first to ensure clean state
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('adminAvatarCache');
      localStorage.removeItem('teacherAvatarCache');
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem('token');

      if (!mustChange) {
        storage.setItem(AUTH_KEY, 'true');
      }
      storage.setItem(USER_KEY, JSON.stringify({ ...data.user, mustChangePassword: mustChange }));
      if (data.token) {
        storage.setItem(TOKEN_KEY, data.token);
        storage.setItem(LEGACY_TOKEN_KEY, data.token);
        storage.setItem('token', data.token);
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
      const isPersistent = Boolean(localStorage.getItem(USER_KEY) || localStorage.getItem(AUTH_KEY));
      const targetStorage = isPersistent ? localStorage : sessionStorage;
      targetStorage.setItem(AUTH_KEY, 'true');
      const user = getUser();
      if (user) {
        user.mustChangePassword = false;
        targetStorage.setItem(USER_KEY, JSON.stringify(user));
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
  localStorage.removeItem('token');
  localStorage.removeItem('adminAvatarCache');
  localStorage.removeItem('teacherAvatarCache');
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  sessionStorage.removeItem('token');
}

export function isLoggedIn() {
  return getStorage(AUTH_KEY) === 'true';
}

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY) ||
    localStorage.getItem('token') ||
    sessionStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
    sessionStorage.getItem('token')
  );
}

export function getUser() {
  try {
    const raw = getStorage(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getUserRole() {
  const user = getUser();
  return user?.role || 'teacher';
}

