import { useState, useEffect } from 'react';
import { Calendar, Plus, Check, X, WarningCircle } from '@phosphor-icons/react';

export default function AdminSchoolYearModal({ isOpen, onClose, onSchoolYearChanged }) {
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSchoolYear, setNewSchoolYear] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/school-years', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchoolYears(data.schoolYears || []);
      }
    } catch (err) {
      console.warn('Failed to fetch school years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSchoolYears();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    let val = e.target.value.replace(/[^\d-]/g, '');
    if (val.length === 4 && !val.includes('-') && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      val = val + '-';
    }
    if (val.length > 9) val = val.slice(0, 9);
    setNewSchoolYear(val);
  };

  const handleCreateSchoolYear = async (e) => {
    e.preventDefault();
    const cleanSy = newSchoolYear.trim();
    if (!cleanSy) return;

    // Strict YYYY-YYYY format validation
    const syRegex = /^\d{4}-\d{4}$/;
    if (!syRegex.test(cleanSy)) {
      setErrorMsg('Invalid format! Must follow YYYY-YYYY format (e.g. 2027-2028).');
      return;
    }

    const [startYear, endYear] = cleanSy.split('-').map(Number);
    if (endYear !== startYear + 1) {
      setErrorMsg(`Invalid year sequence! End year must be ${startYear + 1} (e.g. ${startYear}-${startYear + 1}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/school-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          schoolYear: cleanSy,
          setAsActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`School Year S.Y. ${cleanSy} created!`);
        setNewSchoolYear('');
        fetchSchoolYears();
        if (onSchoolYearChanged) onSchoolYearChanged();
      } else {
        setErrorMsg(data.error || 'Failed to create school year.');
      }
    } catch (err) {
      setErrorMsg('Error creating new school year.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (sy) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/school-years/${sy.id}/activate`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`S.Y. ${sy.schoolYear} set as Active Academic Year.`);
        fetchSchoolYears();
        if (onSchoolYearChanged) onSchoolYearChanged();
      } else {
        setErrorMsg(data.error || 'Failed to activate school year.');
      }
    } catch (err) {
      setErrorMsg('Error updating active school year.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in text-xs text-ink">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-brand-blue" weight="bold" />
            <h3 className="text-base font-bold text-ink">Academic School Years</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-red/10 border border-brand-red/20 p-2.5 text-brand-red font-semibold">
            <WarningCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#00a652]/10 border border-[#00a652]/20 p-2.5 text-[#00a652] font-semibold">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form to Start New School Year */}
        <form onSubmit={handleCreateSchoolYear} className="mt-4 space-y-3 rounded-xl border border-ink/10 bg-white p-4">
          <h4 className="font-bold text-ink">Start New School Year</h4>
          <div>
            <label className="font-semibold text-ink/70 block mb-1">School Year Format (e.g. 2027-2028)</label>
            <input
              type="text"
              required
              maxLength={9}
              value={newSchoolYear}
              onChange={handleInputChange}
              placeholder="e.g. 2027-2028"
              className="w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-xs font-mono text-ink outline-none focus:border-brand-blue shadow-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink/80 pt-1">
            <input
              type="checkbox"
              checked={setAsActive}
              onChange={(e) => setSetAsActive(e.target.checked)}
              className="rounded border-ink/30 text-brand-blue focus:ring-brand-blue cursor-pointer"
            />
            <span>Set as Active Academic Year immediately</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !newSchoolYear.trim()}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Create & Start School Year</span>
          </button>
        </form>

        {/* Existing School Years List */}
        <div className="mt-4 space-y-2">
          <h4 className="font-bold text-ink/80 text-[11px] uppercase tracking-wider">Configured School Years</h4>
          {loading ? (
            <p className="text-ink/40 text-center py-3">Loading school years...</p>
          ) : schoolYears.length === 0 ? (
            <p className="text-ink/40 text-center py-3">No school years configured.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {schoolYears.map((sy) => (
                <div
                  key={sy.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                    sy.isActive ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-ink/10 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink text-xs">S.Y. {sy.schoolYear}</span>
                    {sy.isActive && (
                      <span className="rounded-full bg-[#00a652]/15 px-2 py-0.5 text-[10px] font-bold text-[#00a652] border border-[#00a652]/20">
                        Active
                      </span>
                    )}
                  </div>

                  {!sy.isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(sy)}
                      className="rounded-lg border border-ink/20 px-2.5 py-1 text-[11px] font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/20 bg-white px-4 py-2 font-semibold text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
