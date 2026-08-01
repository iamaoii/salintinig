import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function SignupEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/signup/success', { state: { email } });
  };

  return (
    <AuthLayout photo="classroom" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-ink">Contact Admin</h1>
          <p className="text-base text-ink/50">Enter your email to request account credentials from your administrator.</p>
        </div>

        <TextField
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PrimaryButton type="submit">Contact Admin</PrimaryButton>

        <p className="text-sm text-ink/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
