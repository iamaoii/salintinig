const AUTH_KEY = 'salintinig_auth';
const USER_KEY = 'salintinig_user';

// Pre-defined valid user accounts
export const ACCOUNTS = [
  {
    username: 'admin',
    aliases: ['admin', 'admin@deped.gov.ph', 'EMP-2024-000'],
    password: 'admin123',
    role: 'admin',
    name: 'Antoinette Jadaone',
    email: 'antoinette.j@deped.gov.ph',
    defaultPath: '/admin/dashboard',
  },
  {
    username: 'teacher',
    aliases: ['teacher', 'teacher@deped.gov.ph', 'EMP-2024-001', 'antoinette'],
    password: 'teacher123',
    role: 'teacher',
    name: 'Antoinette Jadaone',
    email: 'antoinette.jadaone@deped.gov.ph',
    defaultPath: '/dashboard',
  },
];

export function authenticate(identifier, password) {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  const user = ACCOUNTS.find(
    (acc) =>
      acc.aliases.some((alias) => alias.toLowerCase() === cleanId) &&
      acc.password === cleanPass
  );

  if (user) {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  return {
    success: false,
    error: 'Incorrect username or password.',
  };
}

export function login() {
  localStorage.setItem(AUTH_KEY, 'true');
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
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
