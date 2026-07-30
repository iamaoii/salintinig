import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';
import { login } from '../../lib/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate('/dashboard');
  };

  return (
    <AuthLayout photo="flag">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Welcome Back!</h1>
          <p className="text-base text-ink/50">Login to continue</p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <TextField type="text" placeholder="Username / Teacher ID" required />

          <div className="relative w-full">
            <TextField
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
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
