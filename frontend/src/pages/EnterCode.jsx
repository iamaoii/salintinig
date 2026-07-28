import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import OtpInput from '../components/OtpInput.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function EnterCode() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/forgot-password/new-password');
  };

  return (
    <AuthLayout photo="flag" showBack backTo="/forgot-password">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Enter code</h1>
          <p className="text-base text-ink/50">Enter the code to continue.</p>
        </div>

        <p className="text-center text-base text-ink">
          We sent a code to <span className="font-bold">doechii@edu.org.ph</span>
        </p>

        <OtpInput length={6} />

        <PrimaryButton type="submit">Submit</PrimaryButton>

        <p className="flex flex-wrap items-center justify-center gap-2.5 text-center text-sm">
          <span className="text-ink/50">Didn&rsquo;t receive a code?</span>
          <button type="button" className="font-medium text-brand-blue">
            Send again
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
