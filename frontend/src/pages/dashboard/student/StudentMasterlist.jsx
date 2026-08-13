import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = getToken();

        // 1. Get active section from /api/auth/me or user
        let targetSection = '';
        try {
          const meRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.user) {
            targetSection = meData.user.section || meData.user.assigned_section || '';
          }
        } catch (e) {}

        if (!targetSection) {
          const u = getUser();
          targetSection = u?.section || u?.assigned_section || '';
        }

        // 2. Fetch students and filter by section
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          const filtered = data.students.filter((s) => {
            if (!targetSection || targetSection.toLowerCase().includes('unassigned')) return false;
            const sSec = (s.section || '').toLowerCase().trim();
            const targetSec = targetSection.toLowerCase().trim();
            const targetSecNameOnly = targetSec.replace(/^grade\s*\d+\s*-\s*/i, '').trim();
            return sSec === targetSec || sSec === targetSecNameOnly || (sSec.length > 0 && targetSec.includes(sSec));
          });
          setStudents(filtered);
        }
        setLoading(false);
      } catch (err) {
        console.warn('Error fetching students:', err);
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = level === 'All'
    ? students
    : level.toLowerCase() === 'pending'
    ? students.filter((s) => !s.level || s.level.toLowerCase().includes('pending') || s.level.toLowerCase().includes('unassessed'))
    : students.filter((s) => (s.level || s.readingLevel || '').toLowerCase().includes(level.toLowerCase()));
  const headerColor = TABS.find((tab) => tab.level === level)?.activeColor ?? '#165fd5';

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Students</h2>
        {loading ? (
          <div className="h-4 w-32 animate-pulse rounded-md bg-ink/10" />
        ) : (
          <p className="text-sm font-medium text-ink/60">Total no. of learners: {filtered.length}</p>
        )}
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
                <td className={`px-4 py-3.5 font-medium text-ink/90 ${COL}`}>{student.section}</td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <Link
                    to={`/teacher/student-dashboard/students/${student.lrn}`}
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
  );
}
