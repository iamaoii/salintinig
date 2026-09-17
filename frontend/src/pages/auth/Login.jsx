import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, WarningCircle, LockKey } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';
import { authenticateAsync, changePasswordAsync, getUser, isLoggedIn, logout } from '../../lib/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory First-Time Password Change State
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.mustChangePassword) {
      setPendingUser(user);
      setIsFirstTimeLogin(true);
    } else if (isLoggedIn() && user && !user.mustChangePassword) {
      navigate(user.defaultPath || '/teacher', { replace: true });
    }
  }, [navigate]);

  const handleCancelFirstTimeLogin = () => {
    logout();
    setIsFirstTimeLogin(false);
    setPendingUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setModalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await authenticateAsync(username, password, rememberMe);
      if (res.success) {
        if (res.mustChangePassword) {
          setPendingUser(res.user);
          setIsFirstTimeLogin(true);
        } else {
          navigate(res.user.defaultPath);
        }
      } else {
        setErrorMessage(res.error || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMandatoryPasswordChange = async (e) => {
    e.preventDefault();
    setModalError('');

    if (newPassword.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await changePasswordAsync(newPassword);
      if (res.success) {
        setIsFirstTimeLogin(false);
        navigate(pendingUser?.defaultPath || '/teacher');
      } else {
        setModalError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setModalError('Error updating temporary password.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <AuthLayout showBack={isFirstTimeLogin} onBackClick={handleCancelFirstTimeLogin} photo="flag">
      {!isFirstTimeLogin ? (
        <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-ink">Welcome Back!</h1>
            <p className="text-base text-ink/50">Login to your account to continue</p>
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-brand-red animate-in fade-in">
                <WarningCircle size={18} weight="fill" className="shrink-0 text-brand-red" />
                <span>{errorMessage}</span>
              </div>
            )}

            <TextField
              type="text"
              placeholder="Email / Teacher ID"
              required
              value={username}
              error={Boolean(errorMessage)}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
            />

            <div className="relative w-full">
              <TextField
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                error={Boolean(errorMessage)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 transition-colors hover:text-ink cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex w-full items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded accent-brand-blue cursor-pointer"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-blue hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </PrimaryButton>

          <p className="text-sm text-ink/50">
            Not registered yet?{' '}
            <Link to="/signup" className="font-medium text-brand-blue underline">
              Contact Admin
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleMandatoryPasswordChange} className="flex w-full max-w-[420px] flex-col items-center gap-6 animate-in fade-in duration-300 -translate-y-10 sm:-translate-y-14">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-1">
              <LockKey size={32} weight="duotone" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Set Your New Password</h1>
            <p className="text-sm text-ink/60 leading-relaxed max-w-[360px]">
              You logged in using a <strong>temporary password</strong>. Please set a new permanent password to secure your account.
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            {modalError && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-red animate-in fade-in">
                <WarningCircle size={16} weight="fill" className="shrink-0 text-brand-red" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="relative w-full">
              <TextField
                type={showNewPass ? 'text' : 'password'}
                placeholder="New Password (min 6 characters)"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (modalError) setModalError('');
                }}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPass((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 transition-colors hover:text-ink cursor-pointer"
              >
                {showNewPass ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <TextField
              type={showNewPass ? 'text' : 'password'}
              placeholder="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (modalError) setModalError('');
              }}
            />
          </div>

          <PrimaryButton type="submit" disabled={isUpdatingPass}>
            {isUpdatingPass ? 'Updating Password...' : 'Save Password & Continue'}
          </PrimaryButton>
        </form>
      )}
    </AuthLayout>
  );
}
