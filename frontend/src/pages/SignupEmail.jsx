import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function SignupEmail() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/signup/success');
  };

  return (
    <AuthLayout photo="classroom" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[680px] flex-col items-center gap-6">
        <div className="flex w-full flex-col items-start gap-2.5 text-left">
          <h1 className="text-3xl font-bold text-ink">Enter email</h1>
          <p className="text-base text-ink/50">Enter email, to contact your admin.</p>
        </div>

        <TextField type="email" placeholder="Email" required className="w-full" />

        <PrimaryButton type="submit">Click here</PrimaryButton>

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
