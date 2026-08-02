import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function ForgotPasswordEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        navigate('/forgot-password/code', { state: { email } });
        return;
      }

      if (data && data.error) {
        setErrorMessage(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      setErrorMessage('Network error while requesting reset code. Please check backend connection.');
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <AuthLayout photo="flag" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-ink">Forgot Password?</h1>
          <p className="text-base text-ink/50">Enter your email to receive a password reset code.</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-sm font-bold text-brand-red animate-in fade-in">
            <WarningCircle size={18} weight="fill" className="shrink-0 text-brand-red" />
            <span>{errorMessage}</span>
          </div>
        )}

        <TextField
          type="email"
          placeholder="Email address"
          required
          value={email}
          error={Boolean(errorMessage)}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage('');
          }}
        />

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying Email...' : 'Send Reset Code'}
        </PrimaryButton>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-brand-blue hover:underline cursor-pointer"
        >
          ← Back to Log In
        </button>
      </form>
    </AuthLayout>
  );
}
