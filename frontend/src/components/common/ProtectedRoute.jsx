import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole, getUser } from '../../lib/auth.js';

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  if (!isLoggedIn() || (user && user.mustChangePassword)) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();

  // Web portal is restricted to Admin, Teacher, and Super Admin roles
  const webPortalRoles = ['admin', 'teacher', 'super_admin'];
  if (!webPortalRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // If a specific allowedRole is required and user's role does not match:
  if (allowedRole && role !== allowedRole) {
    if (allowedRole === 'super_admin') {
      // Non-super-admin trying to access Super Admin portal
      if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (role === 'teacher') return <Navigate to="/teacher" replace />;
    }
    if (allowedRole === 'admin') {
      // Super Admin cannot browse Admin portal, redirect to their own
      if (role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
      // Teachers cannot access Admin Portal -> redirect to Teacher Dashboard
      if (role === 'teacher') return <Navigate to="/teacher" replace />;
    }
    if (allowedRole === 'teacher' && role !== 'teacher') {
      // Admins / Super Admins cannot access Teacher Portal
      if (role === 'super_admin') return <Navigate to="/super-admin/dashboard" replace />;
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}
