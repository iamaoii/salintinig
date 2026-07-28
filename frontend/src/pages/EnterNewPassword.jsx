import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import TextField from '../components/TextField.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function EnterNewPassword() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/forgot-password/success');
  };

  return (
    <AuthLayout photo="classroom" showBack backTo="/forgot-password/code">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[680px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Enter new password</h1>
          <p className="text-base text-ink/50">Make sure to remember it.</p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <TextField type="password" placeholder="Password" required className="flex-1" />
          <TextField type="password" placeholder="Re-enter Password" required className="flex-1" />
        </div>

        <PrimaryButton type="submit">Change password</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
