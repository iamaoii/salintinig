import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole, getUser } from '../../lib/auth.js';

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  if (!isLoggedIn() || (user && user.mustChangePassword)) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();

  // Web portal is restricted exclusively to Admin and Teacher roles
  if (role === 'student' || (role !== 'admin' && role !== 'teacher')) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user's role does not match:
  if (allowedRole && role !== allowedRole) {
    if (allowedRole === 'admin' && role !== 'admin') {
      // Teachers cannot access Admin Portal -> redirect to Teacher Dashboard
      return <Navigate to="/teacher" replace />;
    }
  }

  return children;
}
