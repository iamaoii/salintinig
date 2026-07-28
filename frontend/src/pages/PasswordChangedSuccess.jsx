import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function PasswordChangedSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout photo="flag">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Changed Successfully.</h1>
          <p className="text-base text-ink/50">Welcome to SalinTinig!</p>
        </div>

        <PrimaryButton type="button" onClick={() => navigate('/login')}>
          Continue
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
