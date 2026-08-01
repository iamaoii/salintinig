import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';
import { authenticate } from '../../lib/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const res = authenticate(username, password);
    if (res.success) {
      navigate(res.user.defaultPath);
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <AuthLayout photo="flag">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
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
            placeholder="Username / Teacher ID"
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

        <PrimaryButton type="submit">Log in</PrimaryButton>



        <p className="text-sm text-ink/50">
          Not registered yet?{' '}
          <Link to="/signup" className="font-medium text-brand-blue underline">
            Contact Admin
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
