import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarningCircle, CaretDown } from '@phosphor-icons/react';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import PrimaryButton from '../../components/common/PrimaryButton.jsx';

export default function SignupEmail() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [teacherNo, setTeacherNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('Male');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch(getApiUrl('/api/auth/public-schools'));
        const data = await res.json();
        if (data.success && Array.isArray(data.schools) && data.schools.length > 0) {
          setSchools(data.schools);
          setSchoolId(data.schools[0].school_id);
        } else {
          setSchools([{ school_id: '109283', school_name: 'San Jose Elementary School' }]);
          setSchoolId('109283');
        }
      } catch (err) {
        setSchools([{ school_id: '109283', school_name: 'San Jose Elementary School' }]);
        setSchoolId('109283');
      }
    }
    fetchSchools();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/contact-admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'Teacher',
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

  const inputClass = "py-2 px-3 text-sm h-[42px] rounded-xl border border-ink/20 focus:border-brand-blue transition-all";

  return (
    <AuthLayout photo="classroom" showBack backTo="/login">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col items-center gap-3 my-auto py-2 animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-ink">Contact Admin</h1>
          <p className="text-xs text-ink/60">Request account creation & activation from your administrator.</p>
        </div>

        {errorMessage && (
          <div className="w-full flex items-start gap-2.5 p-3 bg-red-50/90 border border-red-200 rounded-xl text-xs text-red-900 shadow-sm animate-in fade-in">
            <WarningCircle size={20} weight="fill" className="shrink-0 text-red-600 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-red-950">
                {errorMessage.includes('Employee ID') || errorMessage.includes('Teacher ID')
                  ? 'Employee ID Already Registered'
                  : errorMessage.includes('already exists')
                  ? 'Email Already Registered'
                  : 'Request Error'}
              </span>
              <span className="text-red-800 leading-snug">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-2.5">
          {/* Select School Custom Dropdown */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">Select School</label>
            <div className="relative w-full">
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full h-[42px] appearance-none rounded-xl border border-ink/20 bg-white px-3.5 pr-10 text-sm text-ink font-medium focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none cursor-pointer shadow-sm transition-all"
              >
                {schools.map((sch) => (
                  <option key={sch.school_id} value={sch.school_id}>
                    {sch.school_name} ({sch.school_id})
                  </option>
                ))}
              </select>
              <CaretDown size={18} weight="bold" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink/50" />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">Teacher ID / Employee ID</label>
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

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">First Name</label>
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

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">
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

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">Last Name</label>
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

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">Sex / Gender</label>
            <div className="relative w-full">
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full h-[42px] appearance-none rounded-xl border border-ink/20 bg-white px-3.5 pr-10 text-sm text-ink font-medium focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none cursor-pointer shadow-sm transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <CaretDown size={18} weight="bold" className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink/50" />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[12px] font-bold text-ink/75 px-0.5">Email Address</label>
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

        <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-3 h-[48px] rounded-xl text-sm font-bold shadow-md">
          {isSubmitting ? 'Submitting...' : 'Send Request to School Admin'}
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
