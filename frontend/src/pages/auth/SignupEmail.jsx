import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function SignupEmail() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gradeSubject, setGradeSubject] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/contact-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          fullName,
          email,
          contactNumber,
          gradeSubject,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        navigate('/signup/success', { state: { email, fullName } });
        return;
      }

      if (data && data.error) {
        setErrorMessage(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      setErrorMessage('Network error while submitting request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout photo="classroom" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold text-ink">Contact Admin</h1>
          <p className="text-sm text-ink/50">Request account creation & activation from your administrator.</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-sm font-bold text-brand-red animate-in fade-in">
            <WarningCircle size={18} weight="fill" className="shrink-0 text-brand-red" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <TextField
            type="text"
            placeholder="DepEd School ID (e.g. 136660)"
            required
            value={schoolId}
            error={Boolean(errorMessage)}
            onChange={(e) => {
              setSchoolId(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <TextField
            type="text"
            placeholder="Full Name (e.g. Juan Dela Cruz)"
            required
            value={fullName}
            error={Boolean(errorMessage)}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <TextField
            type="email"
            placeholder="Email address"
            required
            value={email}
            error={Boolean(errorMessage)}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
          />

          <TextField
            type="tel"
            placeholder="Contact Number (Optional)"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />

          <TextField
            type="text"
            placeholder="Grade Level & Subject (Optional)"
            value={gradeSubject}
            onChange={(e) => setGradeSubject(e.target.value)}
          />
        </div>

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Request...' : 'Submit Activation Request'}
        </PrimaryButton>

        <p className="text-sm text-ink/50 mt-1">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
