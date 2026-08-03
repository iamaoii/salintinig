import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import Pagination from '../../../components/dashboard/records/Pagination.jsx';

const PAGE_SIZE = 10;

export default function OverviewPeople() {
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      } catch (err) {
        console.warn('Could not fetch students for overview:', err);
      }
    };
    fetchStudents();
  }, []);

  const totalStudents = students.length;
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const pageStudents = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3.5 flex items-center gap-2">
          <Icon icon="ph:user-square" className="size-6 text-brand-red" />
          <h2 className="text-base font-bold uppercase tracking-wider text-ink">Teacher</h2>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-ink/5 bg-cream px-4 py-3.5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
          <Avatar name="Antoinette Jadaone" size={34} />
          <span className="text-sm font-semibold text-ink">Antoinette Jadaone</span>
        </div>
      </section>

      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="ph:users-three" className="size-6 text-brand-red" />
            <h2 className="text-base font-bold uppercase tracking-wider text-ink">Students</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <Icon icon="ph:users-three" className="size-6 text-brand-red" />
            <span className="text-2xl font-extrabold text-ink">{totalStudents}</span>
            <span className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-ink/60">
              Total
              <br />
              Students
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.08)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs font-bold uppercase tracking-wider text-ink/80">
                <th className="w-12 px-4 py-3.5 font-bold">#</th>
                <th className="px-4 py-3.5 font-bold">LRN</th>
                <th className="px-4 py-3.5 font-bold">Name</th>
                <th className="px-4 py-3.5 font-bold">Gender</th>
                <th className="px-4 py-3.5 font-bold">Section</th>
                <th className="w-24 px-2 py-3.5 text-center font-bold" />
              </tr>
            </thead>
            <tbody>
              {pageStudents.map((student, i) => (
                <tr key={student.lrn} className="border-b border-ink/10 transition-colors hover:bg-ink/[0.02] last:border-b-0">
                  <td className="px-4 py-3.5 font-semibold text-ink/80">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-ink/90">{student.lrn}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size={30} />
                      <span className="font-semibold text-ink">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-ink/90">{student.gender}</td>
                  <td className="px-4 py-3.5 font-medium text-ink/90">{student.section}</td>
                  <td className="w-24 px-2 py-3.5 text-center">
                    <button
                      type="button"
                      className="rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-cream transition-colors hover:bg-blue-700"
                    >
                      Profile
                    </button>
                  </td>
                </tr>
              ))}
              {pageStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-medium text-ink/50">
                    No student records found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </section>
    </div>
  );
}
