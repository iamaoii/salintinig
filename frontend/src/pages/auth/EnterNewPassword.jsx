import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function EnterNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const code = location.state?.code;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invalidate code session and navigate back to /forgot-password
  const handleBackToEmail = () => {
    if (email) {
      fetch('http://localhost:5000/api/auth/invalidate-reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }
    navigate('/forgot-password', { replace: true });
  };

  // Intercept browser back button (popstate) to invalidate session & go to /forgot-password
  useEffect(() => {
    const handlePopState = () => {
      if (email) {
        fetch('http://localhost:5000/api/auth/invalidate-reset-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).catch(() => {});
      }
      navigate('/forgot-password', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [email, navigate]);

  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    // Verify session code is active and valid with server
    const verifyCodeActive = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          navigate('/forgot-password', { replace: true });
        }
      } catch (err) {
        console.warn('Code status check error:', err);
      }
    };

    verifyCodeActive();
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        navigate('/forgot-password/success', { replace: true });
        return;
      }

      if (data && data.error) {
        setErrorMessage(data.error);
        setIsSubmitting(false);
        if (data.error.includes('expired') || data.error.includes('already used')) {
          setTimeout(() => navigate('/forgot-password', { replace: true }), 2000);
        }
        return;
      }
    } catch (err) {
      setErrorMessage('Network error while resetting password. Please try again.');
      setIsSubmitting(false);
      return;
    }
  };

  if (!email || !code) return null;

  return (
    <AuthLayout photo="classroom2" showBack backTo="/forgot-password" onBackClick={handleBackToEmail}>
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-ink">New Password</h1>
          <p className="text-base text-ink/50">Please enter your new account password.</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-sm font-bold text-brand-red animate-in fade-in">
            <WarningCircle size={18} weight="fill" className="shrink-0 text-brand-red" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex w-full flex-col gap-4">
          <TextField
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            required
            value={newPassword}
            error={Boolean(errorMessage)}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-ink/40 hover:text-ink transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            }
          />

          <TextField
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter New Password"
            required
            value={confirmPassword}
            error={Boolean(errorMessage)}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-ink/40 hover:text-ink transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            }
          />
        </div>

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating Password...' : 'Save New Password'}
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
