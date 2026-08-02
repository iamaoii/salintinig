import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import OtpInput from '../../components/common/OtpInput.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function EnterCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [maxResendsExceeded, setMaxResendsExceeded] = useState(false);

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

  // Fetch live server rate-limit status on mount
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/reset-status?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.active) {
            setCooldown(data.cooldownSeconds);
            setMaxResendsExceeded(data.maxResendsExceeded);
          } else {
            setCooldown(0);
          }
        }
      } catch (err) {
        console.warn('Could not sync reset status:', err);
      }
    };

    fetchStatus();
  }, [email, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!code || code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        navigate('/forgot-password/new-password', { state: { email, code }, replace: true });
        return;
      }

      if (data && data.error) {
        setErrorMessage(data.error);
        setIsVerifying(false);
        if (data.maxAttemptsExceeded) {
          setTimeout(() => navigate('/forgot-password', { replace: true }), 2500);
        }
        return;
      }
    } catch (err) {
      setErrorMessage('Network error while verifying code. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || maxResendsExceeded) return;
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCooldown(data.cooldownSeconds !== undefined ? data.cooldownSeconds : 60);
        setCode('');
        setInfoMessage('New verification code sent!');
      } else if (data && data.error) {
        setErrorMessage(data.error);
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
        if (data.maxResendsExceeded) setMaxResendsExceeded(true);
      }
    } catch (e) {
      setErrorMessage('Failed to resend code. Please try again.');
    }
  };

  if (!email) return null;

  return (
    <AuthLayout photo="classroom" showBack backTo="/forgot-password" onBackClick={handleBackToEmail}>
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-ink">Enter Code</h1>
          <p className="text-base text-ink/50">Enter the 6-digit code sent to your email.</p>
        </div>

        <p className="text-center text-sm text-ink/70">
          We sent a verification code to <strong className="text-ink font-semibold">{email}</strong>
        </p>

        {infoMessage && (
          <div className="text-sm font-bold text-[#00a652] animate-in fade-in whitespace-nowrap">
            <span>{infoMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="text-sm font-bold text-brand-red animate-in fade-in">
            <span>{errorMessage}</span>
          </div>
        )}

        <OtpInput length={6} value={code} onChange={(val) => setCode(val)} />

        <PrimaryButton type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying Code...' : 'Verify & Continue'}
        </PrimaryButton>

        <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
          <span className="text-ink/50">Didn&rsquo;t receive a code?</span>
          {maxResendsExceeded ? (
            <span className="font-bold text-brand-red">
              Max resends (3) reached
            </span>
          ) : cooldown > 0 ? (
            <span className="font-medium text-ink/40">
              Resend in 00:{cooldown < 10 ? `0${cooldown}` : cooldown}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-brand-blue hover:underline cursor-pointer"
            >
              Resend Code
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
