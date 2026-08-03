import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole, getUser } from '../../lib/auth.js';

export default function ProtectedRoute({ children, allowedRole }) {
  const user = getUser();

  if (!isLoggedIn() || (user && user.mustChangePassword)) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();

  // If role is required and user's role does not match:
  if (allowedRole && role !== allowedRole) {
    if (allowedRole === 'admin' && role !== 'admin') {
      // Teachers cannot access Admin Portal -> redirect to Teacher Dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
