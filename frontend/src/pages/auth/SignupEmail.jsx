import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WarningCircle } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function SignupEmail() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [teacherNo, setTeacherNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('Male');
  const [email, setEmail] = useState('');
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
          teacherNo,
          firstName,
          middleName,
          lastName,
          sex,
          email,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const computedFullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
        navigate('/signup/success', { state: { email, fullName: computedFullName } });
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

  const inputClass = "py-2 px-3 text-sm h-[40px] rounded-lg border-2 border-ink/40";

  return (
    <AuthLayout photo="classroom" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[400px] flex-col items-center gap-3 my-auto py-1 animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-ink">Contact Admin</h1>
          <p className="text-xs text-ink/50">Request account creation & activation from your administrator.</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-red animate-in fade-in">
            <WarningCircle size={16} weight="fill" className="shrink-0 text-brand-red" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col gap-0.5 w-full">
              <label className="text-[11px] font-semibold text-ink/70 px-0.5 truncate">DepEd School ID</label>
              <TextField
                type="text"
                placeholder="e.g. 109283"
                required
                value={schoolId}
                error={Boolean(errorMessage)}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-0.5 w-full">
              <label className="text-[11px] font-semibold text-ink/70 px-0.5 truncate">Teacher ID / Employee ID</label>
              <TextField
                type="text"
                placeholder="e.g. EMP-2026-001"
                required
                value={teacherNo}
                error={Boolean(errorMessage)}
                onChange={(e) => {
                  setTeacherNo(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5 w-full">
            <label className="text-[11px] font-semibold text-ink/70 px-0.5">First Name</label>
            <TextField
              type="text"
              placeholder="e.g. Juan"
              required
              value={firstName}
              error={Boolean(errorMessage)}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-0.5 w-full">
            <label className="text-[11px] font-semibold text-ink/70 px-0.5">
              Middle Name <span className="font-normal text-ink/40">(Optional)</span>
            </label>
            <TextField
              type="text"
              placeholder="e.g. Santos"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-0.5 w-full">
            <label className="text-[11px] font-semibold text-ink/70 px-0.5">Last Name</label>
            <TextField
              type="text"
              placeholder="e.g. Dela Cruz"
              required
              value={lastName}
              error={Boolean(errorMessage)}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-0.5 w-full">
            <label className="text-[11px] font-semibold text-ink/70 px-0.5">Sex / Gender</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full h-[40px] rounded-lg border-2 border-ink/40 bg-white px-3 text-sm text-ink focus:border-brand-blue outline-none cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5 w-full">
            <label className="text-[11px] font-semibold text-ink/70 px-0.5">Email Address</label>
            <TextField
              type="email"
              placeholder="e.g. teacher@gmail.com"
              required
              value={email}
              error={Boolean(errorMessage)}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className={inputClass}
            />
          </div>
        </div>

        <PrimaryButton type="submit" disabled={isSubmitting} className="h-[44px] text-sm">
          {isSubmitting ? 'Submitting Request...' : 'Submit Activation Request'}
        </PrimaryButton>

        <p className="text-xs text-ink/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
