import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function RequestSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  return (
    <AuthLayout photo="classroom2">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Request Sent</h1>
          <p className="text-base text-ink/50">
            {email ? (
              <>We have received your request for <strong>{email}</strong>. Please wait patiently while our administrator reviews and issues your login credentials.</>
            ) : (
              <>Please wait patiently, our administrator will send you the login instructions.</>
            )}
          </p>
        </div>

        <PrimaryButton type="button" onClick={() => navigate('/login')}>
          Back to Login
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
