import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole, getUser } from '../../lib/auth.js';

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  if (!isLoggedIn() || (user && user.mustChangePassword)) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();

  // Block student role from web portal entirely
  if (role === 'student') {
    return <Navigate to="/login" replace />;
  }

  // super_admin can access any protected route
  if (role === 'super_admin') {
    if (allowedRole && allowedRole !== 'super_admin') {
      // super_admin trying to access teacher or admin-specific routes — redirect to their dashboard
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return children;
  }

  // Block unknown roles (not admin, teacher, or super_admin)
  if (role !== 'admin' && role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user's role does not match:
  if (allowedRole && role !== allowedRole) {
    if (allowedRole === 'admin' && role !== 'admin') {
      // Teachers cannot access Admin Portal -> redirect to Teacher Dashboard
      return <Navigate to="/teacher" replace />;
    }
    if (allowedRole === 'teacher' && role !== 'teacher') {
      // Admins cannot access Teacher Portal -> redirect to Admin Dashboard
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}
