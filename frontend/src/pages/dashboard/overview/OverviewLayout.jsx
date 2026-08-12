import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from '../../../components/dashboard/layout/Sidebar.jsx';

const TABS = [
  { to: '/dashboard/overview/forms', label: 'Forms' },
  { to: '/dashboard/overview/activities', label: 'Activities' },
  { to: '/dashboard/overview/people', label: 'People' },
];

export default function OverviewLayout() {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignGrade, setAssignGrade] = useState('Grade 4');
  const [assignSet, setAssignSet] = useState('Set A');
  const [assignPeriod, setAssignPeriod] = useState('Pre-Test');
  const [assignType, setAssignType] = useState('oral');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAssignPhilIri = async (e) => {
    e.preventDefault();
    try {
      setIsAssigning(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/student/assessment/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gradeLevel: assignGrade,
          set: assignSet,
          period: assignPeriod,
          assessmentType: assignType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast(`Successfully assigned Phil-IRI ${assignSet} (${assignPeriod}) to ${assignGrade}!`);
        setIsAssignModalOpen(false);
      } else {
        setToast(data.error || 'Failed to assign Phil-IRI set.');
      }
    } catch (err) {
      console.error('Error assigning set:', err);
      setToast('Network error. Failed to assign Phil-IRI set.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-3">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      <Sidebar />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Overview</h1>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
          >
            <span>Assign Phil-IRI Set</span>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4 overflow-x-auto border-b border-ink/10 sm:gap-6">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive ? 'border-brand-red text-brand-red' : 'border-transparent text-ink/60 hover:text-ink'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>

      {/* Phil-IRI Set Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-ink/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Assign Phil-IRI Passage Set</h3>
                <p className="text-xs text-ink/50">Select DepEd set and period for learners</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPhilIri} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Target Grade Level</label>
                <select
                  value={assignGrade}
                  onChange={(e) => setAssignGrade(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Screening Period</label>
                <select
                  value={assignPeriod}
                  onChange={(e) => setAssignPeriod(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Pre-Test">Pre-Test (Beginning of Year)</option>
                  <option value="Post-Test">Post-Test (End of Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Phil-IRI Set</label>
                <select
                  value={assignSet}
                  onChange={(e) => setAssignSet(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Set A">Set A</option>
                  <option value="Set B">Set B</option>
                  <option value="Set C">Set C</option>
                  <option value="Set D">Set D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Assessment Type</label>
                <select
                  value={assignType}
                  onChange={(e) => setAssignType(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="oral">Oral Reading Assessment</option>
                  <option value="silent">Silent Reading Assessment</option>
                  <option value="listening">Listening Comprehension Test</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
