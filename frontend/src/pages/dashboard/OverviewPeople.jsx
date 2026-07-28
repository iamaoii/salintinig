import { useState } from 'react';
import { User, UsersThree } from '@phosphor-icons/react';
import Avatar from '../../components/dashboard/Avatar.jsx';
import Pagination from '../../components/dashboard/Pagination.jsx';
import { students, totalStudents } from '../../data/students.js';

const PAGE_SIZE = 10;

export default function OverviewPeople() {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const pageStudents = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <User size={20} className="text-brand-red" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Teacher</h2>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-ink/5 bg-cream px-4 py-3 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
          <Avatar name="Antoinette Jadaone" size={32} />
          <span className="text-sm font-medium text-ink">Antoinette Jadaone</span>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersThree size={20} className="text-brand-red" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Students</h2>
          </div>
          <div className="flex items-center gap-2">
            <UsersThree size={20} className="text-brand-red" />
            <span className="text-2xl font-bold text-ink">{totalStudents}</span>
            <span className="text-xs text-ink/50">
              Total
              <br />
              Students
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">LRN</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Gender</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageStudents.map((student, i) => (
                <tr key={student.lrn} className="border-b border-ink/5 last:border-b-0">
                  <td className="px-4 py-3 text-ink/50">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-3 text-ink/70">{student.lrn}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size={28} />
                      <span className="font-medium text-ink">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{student.gender}</td>
                  <td className="px-4 py-3 text-ink/70">{student.section}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-blue-700"
                    >
                      Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </section>
    </div>
  );
}
