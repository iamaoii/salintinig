import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken } from '../../../lib/auth.js';

const TABS = [
  { to: '/dashboard/student-dashboard/all', label: 'All', level: 'All', activeColor: '#165fd5' },
  { to: '/dashboard/student-dashboard/independent', label: 'Independent', level: 'Independent', activeColor: '#00a652' },
  { to: '/dashboard/student-dashboard/instructional', label: 'Instructional', level: 'Instructional', activeColor: '#ffc300' },
  { to: '/dashboard/student-dashboard/frustrational', label: 'Frustrational', level: 'Frustrational', activeColor: '#d53f24' },
];

const COL = 'border-r border-ink/10 last:border-r-0';

export default function StudentMasterlist({ level }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = getToken();
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      } catch (err) {
        console.warn('Error fetching students:', err);
      }
    };
    fetchStudents();
  }, []);

  const filtered = level === 'All' ? students : students.filter((s) => s.level === level);
  const headerColor = TABS.find((tab) => tab.level === level)?.activeColor ?? '#165fd5';

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Students</h2>
        <p className="text-sm font-medium text-ink/60">Total no. of learners: {filtered.length}</p>
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
            {filtered.map((student, i) => (
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
                <td className="w-24 px-2 py-3.5 text-center">
                  <Link
                    to={`/dashboard/student-dashboard/students/${student.lrn}`}
                    className="inline-block rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-cream transition-colors hover:bg-blue-700"
                  >
                    Profile
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-medium text-ink/50">
                  {students.length === 0
                    ? 'No student records found in database.'
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
