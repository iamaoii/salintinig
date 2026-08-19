import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersThree } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken } from '../../../lib/auth.js';

export default function PhilIriForm3List({ formKey, label }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (err) {
        console.warn('Fetch Form 3 students error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-ink/70">
        <UsersThree size={18} />
        <h2 className="text-sm font-medium">Students with {label}</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] bg-cream">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/70">
              <th className="w-12 px-4 py-3 font-bold">#</th>
              <th className="px-4 py-3 font-bold">LRN</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Gender</th>
              <th className="px-4 py-3 font-bold">Section</th>
              <th className="px-4 py-3 text-right font-bold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50 font-medium">
                  Loading student records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50 font-medium">
                  No student records found in database.
                </td>
              </tr>
            ) : (
              students.map((student, i) => (
                <tr key={student.lrn} className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.02] transition-colors">
                  <td className="px-4 py-3 text-ink/50 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 text-ink/70 font-mono font-medium">{student.lrn}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size={28} />
                      <span className="font-semibold text-ink">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{student.gender || 'N/A'}</td>
                  <td className="px-4 py-3 text-ink/70">{student.section}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/teacher/phil-iri-records/${formKey}/${student.lrn}`}
                      className="inline-block rounded-full bg-brand-blue px-4 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-blue-700"
                    >
                      {label}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
