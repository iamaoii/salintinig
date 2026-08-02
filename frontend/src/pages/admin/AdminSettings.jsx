import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gear,
  CheckCircle,
  Building,
  ShieldCheck,
  FloppyDisk,
  SignOut,
} from '@phosphor-icons/react';
import { logout } from '../../lib/auth.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [schoolProfile, setSchoolProfile] = useState({
    schoolName: 'SalinTinig Elementary School',
    schoolId: '109283',
    division: 'Division of City Schools',
    region: 'Region IV-A (CALABARZON)',
    principalName: 'Dr. Maria Corazon Aquino',
    contactEmail: 'admin.salintinig@deped.gov.ph',
  });

  const [securitySettings, setSecuritySettings] = useState({
    autoCreateAccounts: true,
    requirePasswordResetOnFirstLogin: true,
    allowTeacherBulkUpload: true,
    auditLoggingEnabled: true,
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('School profile configuration saved successfully.');
  };

  const handleToggleSecurity = (key) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    showToast('Security policy updated.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="mx-auto max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Gear size={28} className="text-brand-red" />
          <h1 className="text-3xl font-bold text-ink">School & Admin Settings</h1>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Configure official school details, security protocols, and automated user generation rules
        </p>
      </div>

      {/* School Information Card matching AccountSettings.jsx */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
          <Building size={20} className="text-brand-blue" />
          <h3 className="text-base font-bold text-ink">School Institutional Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-ink">School Name</label>
            <input
              type="text"
              required
              value={schoolProfile.schoolName}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, schoolName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="font-semibold text-ink">School ID (DepEd Code)</label>
            <input
              type="text"
              required
              value={schoolProfile.schoolId}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, schoolId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="font-semibold text-ink">Division Office</label>
            <input
              type="text"
              required
              value={schoolProfile.division}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, division: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="font-semibold text-ink">Region</label>
            <input
              type="text"
              required
              value={schoolProfile.region}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, region: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="font-semibold text-ink">School Head / Principal Name</label>
            <input
              type="text"
              required
              value={schoolProfile.principalName}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="font-semibold text-ink">Official Contact Email</label>
            <input
              type="email"
              required
              value={schoolProfile.contactEmail}
              onChange={(e) => setSchoolProfile({ ...schoolProfile, contactEmail: e.target.value })}
              className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-ink/10">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2.5 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <FloppyDisk size={16} />
            <span>Save School Profile</span>
          </button>
        </div>
      </form>

      {/* Security & Automation Settings Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-ink/10">
          <ShieldCheck size={20} className="text-[#00a652]" />
          <h3 className="text-base font-bold text-ink">Account & Security Automation Policies</h3>
        </div>

        <div className="divide-y divide-ink/10 text-xs">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-ink">Automated Portal Account Generation</p>
              <p className="text-ink/50 text-[11px]">
                Automatically generate temporary login credentials for parents/teachers upon CSV import
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.autoCreateAccounts}
              onChange={() => handleToggleSecurity('autoCreateAccounts')}
              className="size-4 accent-brand-blue cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-ink">Force Password Reset on First Login</p>
              <p className="text-ink/50 text-[11px]">
                Require new user accounts to change default passwords upon initial system login
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.requirePasswordResetOnFirstLogin}
              onChange={() => handleToggleSecurity('requirePasswordResetOnFirstLogin')}
              className="size-4 accent-brand-blue cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-ink">Allow Faculty Bulk CSV Uploads</p>
              <p className="text-ink/50 text-[11px]">
                Grant advisers authorization to batch import student records for their assigned section
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.allowTeacherBulkUpload}
              onChange={() => handleToggleSecurity('allowTeacherBulkUpload')}
              className="size-4 accent-brand-blue cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-bold text-ink">Real-time Administrative Audit Logging</p>
              <p className="text-ink/50 text-[11px]">
                Track all record modifications, account activations, and faculty assignments
              </p>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.auditLoggingEnabled}
              onChange={() => handleToggleSecurity('auditLoggingEnabled')}
              className="size-4 accent-brand-blue cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Log Out Button matching Teacher side AccountSettings.jsx */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-blue-700 cursor-pointer shadow-sm"
        >
          <SignOut size={18} />
          Log Out
        </button>
      </div>
    </div>
    </>
  );
}
