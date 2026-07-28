import { Link, NavLink } from 'react-router-dom';
import Avatar from '../../components/dashboard/Avatar.jsx';
import { students } from '../../data/students.js';

const TABS = [
  { to: '/dashboard/student-dashboard/all', label: 'All', level: 'All', activeColor: '#165fd5' },
  { to: '/dashboard/student-dashboard/independent', label: 'Independent', level: 'Independent', activeColor: '#00a652' },
  { to: '/dashboard/student-dashboard/instructional', label: 'Instructional', level: 'Instructional', activeColor: '#ffc300' },
  { to: '/dashboard/student-dashboard/frustrational', label: 'Frustrational', level: 'Frustrational', activeColor: '#d53f24' },
];

const COL = 'border-r border-ink/10 last:border-r-0';

export default function StudentMasterlist({ level }) {
  const filtered = level === 'All' ? students : students.filter((s) => s.level === level);
  const headerColor = TABS.find((tab) => tab.level === level)?.activeColor ?? '#165fd5';

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">Students</h2>
        <p className="text-sm text-ink/50">Total no. of learners: {filtered.length}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto border-b border-ink/10">
        <span className="shrink-0 px-4 py-2 text-sm font-medium text-ink/50">GST:</span>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `shrink-0 border-b-2 px-4 py-2 text-base font-medium ${isActive ? '' : 'border-transparent text-ink hover:bg-ink/5'}`
            }
            style={({ isActive }) => (isActive ? { borderColor: tab.activeColor, color: tab.activeColor } : undefined)}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr
              className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/50"
              style={{ backgroundColor: `${headerColor}0D` }}
            >
              <th className={`w-12 px-4 py-3 font-medium ${COL}`}>#</th>
              <th className={`px-4 py-3 font-medium ${COL}`}>LRN</th>
              <th className={`px-4 py-3 font-medium ${COL}`}>Name</th>
              <th className={`px-4 py-3 font-medium ${COL}`}>Gender</th>
              <th className={`px-4 py-3 font-medium ${COL}`}>Section</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, i) => (
              <tr key={student.lrn} className="border-b border-ink/10 last:border-b-0">
                <td className={`px-4 py-3 text-ink/50 ${COL}`}>{i + 1}</td>
                <td className={`px-4 py-3 text-ink/70 ${COL}`}>{student.lrn}</td>
                <td className={`px-4 py-3 ${COL}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} size={28} />
                    <span className="font-medium text-ink">{student.name}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 text-ink/70 ${COL}`}>{student.gender}</td>
                <td className={`px-4 py-3 text-ink/70 ${COL}`}>{student.section}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/dashboard/student-dashboard/students/${student.lrn}`}
                    className="inline-block rounded-full bg-brand-blue px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-blue-700"
                  >
                    Profile
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/40">
                  No students at this reading level.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
