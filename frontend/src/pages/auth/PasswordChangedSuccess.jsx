import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function PasswordChangedSuccess() {
  const navigate = useNavigate();

  // Intercept browser back button (popstate) to navigate directly to /forgot-password
  useEffect(() => {
    const handlePopState = () => {
      navigate('/forgot-password', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return (
    <AuthLayout photo="flag" showBack backTo="/forgot-password">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#00a652]/15 text-[#00a652]">
            <CheckCircle size={36} weight="fill" />
          </div>
          <h1 className="text-3xl font-bold text-ink">Password Changed!</h1>
          <p className="text-base text-ink/50">
            Your password has been successfully updated in system records. You can now log in with your new password.
          </p>
        </div>

        <PrimaryButton type="button" onClick={() => navigate('/login', { replace: true })}>
          Log In Now
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
