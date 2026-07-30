import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function ForgotPasswordEmail() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/forgot-password/code');
  };

  return (
    <AuthLayout photo="flag" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Forgot Password?</h1>
          <p className="text-base text-ink/50">No worries, we got you.</p>
        </div>

        <TextField type="email" placeholder="Email" required />

        <PrimaryButton type="submit">Send code</PrimaryButton>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-brand-blue"
        >
          ← Back to Log In
        </button>
      </form>
    </AuthLayout>
  );
}
