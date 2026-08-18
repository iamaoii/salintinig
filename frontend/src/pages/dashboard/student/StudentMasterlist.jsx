import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowsClockwise, Check, X, UserCheck, CaretDown } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { encodeSecureToken } from '../../../lib/securityToken.js';
import { getToken, getUser } from '../../../lib/auth.js';

const TABS = [
  { to: '/teacher/student-dashboard/all', label: 'All', level: 'All', activeColor: '#165fd5' },
  { to: '/teacher/student-dashboard/independent', label: 'Independent', level: 'Independent', activeColor: '#00a652' },
  { to: '/teacher/student-dashboard/instructional', label: 'Instructional', level: 'Instructional', activeColor: '#ffc300' },
  { to: '/teacher/student-dashboard/frustrational', label: 'Frustrational', level: 'Frustrational', activeColor: '#d53f24' },
  { to: '/teacher/student-dashboard/pending', label: 'Pending Evaluation', level: 'Pending', activeColor: '#8b5cf6' },
];

const COL = 'border-r border-ink/10 last:border-r-0';

export default function StudentMasterlist({ level }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lock body scroll when EOSY Promotion modal is open
  useEffect(() => {
    if (showPromotionModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [showPromotionModal]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = getToken();

        const res = await fetch('http://localhost:5000/api/teacher/class-students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        } else {
          // Fallback to admin endpoint if teacher endpoint returns empty
          const fallbackRes = await fetch('http://localhost:5000/api/admin/students', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok && fallbackData.success && Array.isArray(fallbackData.students)) {
            setStudents(fallbackData.students);
          }
        }
        setLoading(false);
      } catch (err) {
        console.warn('Error fetching students:', err);
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSetPromotionStatus = async (studentId, statusToSet) => {
    const studentObj = students.find((s) => (s.id || s.studentId) === studentId);
    const currentStatus = studentObj?.promotionStatus || 'pending';
    // Deselect if clicking the already selected status option -> resets back to 'pending'
    const newStatus = currentStatus === statusToSet ? 'pending' : statusToSet;

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/teacher/students/${studentId}/promotion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ promotionStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          newStatus === 'pending'
            ? 'Selection cleared (Pending evaluation).'
            : `Learner status set to ${newStatus.toUpperCase()}.`
        );
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, promotionStatus: newStatus } : s))
        );
      }
    } catch (err) {
      showToast('Failed to update promotion status.');
    }
  };

  const handleMarkAllPromoted = async () => {
    try {
      const token = getToken();
      await Promise.all(
        students.map((std) => {
          const sId = std.id || std.studentId;
          return fetch(`http://localhost:5000/api/teacher/students/${sId}/promotion`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ promotionStatus: 'promoted' }),
          });
        })
      );
      showToast(`Marked all ${students.length} learners as PROMOTED.`);
      setStudents((prev) => prev.map((s) => ({ ...s, promotionStatus: 'promoted' })));
    } catch (err) {
      showToast('Failed to mark all learners as promoted.');
    }
  };

  const handleClearAllStatus = async () => {
    try {
      const token = getToken();
      await Promise.all(
        students.map((std) => {
          const sId = std.id || std.studentId;
          return fetch(`http://localhost:5000/api/teacher/students/${sId}/promotion`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ promotionStatus: 'pending' }),
          });
        })
      );
      showToast('Cleared all evaluation selections (set to Pending).');
      setStudents((prev) => prev.map((s) => ({ ...s, promotionStatus: 'pending' })));
    } catch (err) {
      showToast('Failed to clear evaluation selections.');
    }
  };

  const filtered = level === 'All'
    ? students
    : level.toLowerCase() === 'pending'
    ? students.filter((s) => !s.level || s.level.toLowerCase().includes('pending') || s.level.toLowerCase().includes('unassessed'))
    : students.filter((s) => (s.level || s.readingLevel || '').toLowerCase().includes(level.toLowerCase()));
  const headerColor = TABS.find((tab) => tab.level === level)?.activeColor ?? '#165fd5';

  const evaluatedCount = students.filter((s) => s.promotionStatus && s.promotionStatus !== 'pending').length;

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Students</h2>
            <p className="text-xs text-ink/50 mt-0.5">Manage learner reading profiles and class masterlist</p>
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-xs font-semibold text-ink/60">Total learners: {filtered.length}</span>
            )}
            <button
              type="button"
              onClick={() => setShowPromotionModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors cursor-pointer shadow-xs"
              title="Manage End-of-Year Learner Promotion Statuses"
            >
              <UserCheck size={16} className="text-brand-blue" weight="bold" />
              <span>EOSY Learner Promotion</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 overflow-x-auto border-b border-ink/10 sm:gap-6">
          <span className="shrink-0 pb-3 text-sm font-medium text-ink/60">GST:</span>
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive ? '' : 'border-transparent text-ink/60 hover:text-ink'
                }`
              }
              style={({ isActive }) => (isActive ? { borderColor: tab.activeColor, color: tab.activeColor } : undefined)}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.08)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr
                className="border-b border-ink/10 text-left text-xs font-bold uppercase tracking-wider text-ink/80"
                style={{ backgroundColor: `${headerColor}12` }}
              >
                <th className={`w-12 px-4 py-3.5 font-bold ${COL}`}>#</th>
                <th className={`px-4 py-3.5 font-bold ${COL}`}>LRN</th>
                <th className={`px-4 py-3.5 font-bold ${COL}`}>Name</th>
                <th className={`px-4 py-3.5 font-bold ${COL}`}>Gender</th>
                <th className={`px-4 py-3.5 font-bold ${COL}`}>Section</th>
                <th className="w-24 px-2 py-3.5 text-center font-bold" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
                      <span className="text-xs font-semibold text-ink/50">Loading section masterlist...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map((student, i) => (
                <tr key={student.lrn} className="border-b border-ink/10 transition-colors hover:bg-ink/[0.02] last:border-b-0">
                  <td className={`px-4 py-3.5 font-semibold text-ink/80 ${COL}`}>{i + 1}</td>
                  <td className={`px-4 py-3.5 font-medium text-ink/90 ${COL}`}>{student.lrn}</td>
                  <td className={`px-4 py-3.5 ${COL}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size={30} />
                      <span className="font-semibold text-ink">{student.name}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3.5 font-medium text-ink/90 ${COL}`}>{student.gender}</td>
                  <td className={`px-4 py-3.5 font-medium text-ink/90 ${COL}`}>{student.section || student.sectionName || 'Assigned'}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <Link
                      to={`/teacher/student-dashboard/students/${encodeSecureToken('st', student.lrn)}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-brand-blue/10 px-3.5 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-medium text-ink/50">
                    {students.length === 0
                      ? 'No enrolled students found in this section.'
                      : 'No students found at this reading level.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* End-of-Year Learner Promotion Modal */}
      {showPromotionModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/10">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <UserCheck size={20} className="text-brand-blue" />
                  <span>End-of-Year Learner Promotion Evaluation</span>
                </h3>
                <p className="text-xs text-ink/50 mt-0.5">
                  Evaluate and mark each learner in your advisory class
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {students.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkAllPromoted}
                      className="whitespace-nowrap rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-3.5 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
                    >
                      Mark All Promoted
                    </button>
                    {evaluatedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllStatus}
                        className="whitespace-nowrap rounded-xl border border-ink/20 bg-ink/5 px-3.5 py-1.5 text-xs font-bold text-ink/70 hover:bg-ink/10 transition-colors cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(false)}
                  className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {students.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/50 font-medium bg-white rounded-xl border border-ink/10">
                  No enrolled learners found in your advisory section.
                </div>
              ) : (
                students.map((std) => {
                  const sId = std.id || std.studentId;
                  const status = std.promotionStatus || 'pending';
                  const isPromoted = status === 'promoted';
                  const isRetained = status === 'retained';
                  const isDropped = status === 'dropped';
                  const isTransferred = status === 'transferred';
                  const isPending = status === 'pending';

                  return (
                    <div
                      key={std.lrn}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-ink/10 bg-white shadow-2xs hover:border-ink/20 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={std.name} size={36} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-ink">{std.name}</p>
                            {isPending && (
                              <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-ink/50 mt-0.5">LRN: {std.lrn}</p>
                        </div>
                      </div>

                      {/* Standard Dropdown Selector */}
                      <select
                        value={status}
                        onChange={(e) => handleSetPromotionStatus(sId, e.target.value)}
                        className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs outline-none focus:border-brand-blue cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="promoted">Promoted</option>
                        <option value="retained">Retained</option>
                        <option value="dropped">Dropped Out</option>
                        <option value="transferred">Transferred Out</option>
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
