import { Link } from 'react-router-dom';
import { UsersThree } from '@phosphor-icons/react';
import Avatar from '../../components/dashboard/Avatar.jsx';
import { students } from '../../data/students.js';

export default function PhilIriForm3List({ formKey, label }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-ink/70">
        <UsersThree size={18} />
        <h2 className="text-sm font-medium">Students with {label}</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <table className="w-full min-w-[560px] border-collapse text-sm">
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
            {students.map((student, i) => (
              <tr key={student.lrn} className="border-b border-ink/5 last:border-b-0">
                <td className="px-4 py-3 text-ink/50">{i + 1}</td>
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
                  <Link
                    to={`/dashboard/phil-iri-records/${formKey}/${student.lrn}`}
                    className="inline-block rounded-full bg-brand-blue px-4 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-blue-700"
                  >
                    {label}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
