import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';
import { login } from '../../lib/auth.js';

export default function Login() {
  const navigate = useNavigate();

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
          <TextField type="text" placeholder="Teacher ID" required />
          <TextField type="password" placeholder="Password" required />
          <div className="flex w-full justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-blue">
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
