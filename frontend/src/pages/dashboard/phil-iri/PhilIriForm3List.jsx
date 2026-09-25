import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersThree, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { PhilIriForm3Skeleton } from '../../../components/common/Skeleton.jsx';
import { getToken } from '../../../lib/auth.js';

export default function PhilIriForm3List({ formKey, label }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(getApiUrl('/api/teacher/class-students'), {
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

  const totalPages = Math.ceil(students.length / PAGE_SIZE) || 1;
  const paginatedStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formTitleMap = {
    'form-3a': 'TALAAN NG INDIBIDWAL NA PAGTATASA SA PAGBABASA (TAGALOG)',
    'form-3b': 'INDIVIDUAL READING PROFILE (ENGLISH)',
    'form-4': 'RUNNING RECORD FORM',
  };

  const formTitle = formTitleMap[formKey] || 'READING PROFILE RECORD';

  return (
    <div>
      {/* Top Header Title Bar matching Form 1 & 2 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">
            PHIL-IRI {label} - {formTitle}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink/60">
            <UsersThree size={15} />
            <span>Class Student Records</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] bg-cream">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] text-left text-xs uppercase tracking-wider text-ink/70">
              <th className="w-12 px-5 py-3.5 font-bold">#</th>
              <th className="w-44 px-5 py-3.5 font-bold">LRN</th>
              <th className="px-5 py-3.5 font-bold">Name</th>
              <th className="w-32 px-5 py-3.5 font-bold">Gender</th>
              <th className="w-40 px-5 py-3.5 font-bold">Section</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <PhilIriForm3Skeleton rows={5} />
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-ink/50 font-medium">
                  No student records found in database.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, i) => (
                <tr
                  key={student.lrn}
                  onClick={() => navigate(`/teacher/phil-iri-records/${formKey}/${student.lrn}`)}
                  className="group border-b border-ink/5 last:border-b-0 hover:bg-brand-blue/5 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 text-ink/50 font-medium">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-5 py-3.5 text-ink/70 font-mono font-medium tracking-tight">{student.lrn}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={30} />
                      <span className="font-semibold text-ink group-hover:text-brand-blue transition-colors">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink/70">{student.gender || 'N/A'}</td>
                  <td className="px-5 py-3.5 text-ink/70 font-medium">{student.sectionName || student.section_name || student.section || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table Footer / Pagination */}
        {students.length > 0 && (
          <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-white">
            <span>
              {students.length === 0
                ? 'Showing 0 of 0 student records'
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, students.length)} of ${students.length} student records`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <CaretLeft size={14} /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'bg-cream border border-ink/10 text-ink/70 hover:bg-ink/5'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  Next <CaretRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
