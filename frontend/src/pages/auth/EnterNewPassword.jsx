import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function EnterNewPassword() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/forgot-password/success');
  };

  return (
    <AuthLayout photo="classroom2" showBack backTo="/forgot-password/code">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Enter new password</h1>
          <p className="text-base text-ink/50">Make sure to remember it.</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <TextField type="password" placeholder="Password" required />
          <TextField type="password" placeholder="Re-enter Password" required />
        </div>

        <PrimaryButton type="submit">Change password</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
