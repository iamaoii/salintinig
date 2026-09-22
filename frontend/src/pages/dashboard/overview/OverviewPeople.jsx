import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { StudentTableSkeleton } from '../../../components/common/Skeleton.jsx';
import Pagination from '../../../components/dashboard/records/Pagination.jsx';
import { getToken, getUser } from '../../../lib/auth.js';
import { cacheService } from '../../../services/cacheService.js';

const PAGE_SIZE = 10;

export default function OverviewPeople() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const cachedStudents = cacheService.get('teacher_overview_students') || cacheService.get('teacher_class_students');
  const [students, setStudents] = useState(() => cachedStudents || []);
  const [loading, setLoading] = useState(!cachedStudents || cachedStudents.length === 0);
  const [teacherInfo, setTeacherInfo] = useState(() => {
    const u = getUser();
    return {
      name: u?.name || u?.displayName || 'Teacher',
      section: u?.section || u?.assigned_section || '',
      avatar: localStorage.getItem('teacherAvatarCache') || u?.profileImage || u?.profile_image || null,
    };
  });

  useEffect(() => {
    const fetchOverviewData = async () => {
      const cached = cacheService.get('teacher_overview_students') || cacheService.get('teacher_class_students');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setStudents(cached);
        setLoading(false);
      }
      try {
        const token = getToken();
        let targetSection = teacherInfo.section;

        // 1. Fetch user info from /api/auth/me
        try {
          const meRes = await fetch(getApiUrl('/api/auth/me'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.user) {
            const freshName = meData.user.name || `${meData.user.firstName || ''} ${meData.user.lastName || ''}`.trim();
            targetSection = meData.user.section || meData.user.assigned_section || meData.user.section_name || targetSection;
            setTeacherInfo({
              name: freshName || 'Teacher',
              section: targetSection || 'Unassigned',
              avatar: meData.user.profileImage || meData.user.profile_image || localStorage.getItem('teacherAvatarCache') || null,
            });
          }
        } catch (meErr) {
          console.warn('Teacher me fetch notice:', meErr.message);
        }

        // 2. Fetch students from teacher endpoint
        const res = await fetch(getApiUrl('/api/teacher/class-students'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          const filteredStudents = data.students.filter((s) => {
            if (!targetSection || targetSection.toLowerCase().includes('unassigned')) return false;
            const sSec = (s.sectionName || s.section || '').toLowerCase().trim();
            const targetSec = targetSection.toLowerCase().trim();
            const targetSecNameOnly = targetSec.replace(/^grade\s*\d+\s*-\s*/i, '').trim();
            return sSec === targetSec || sSec === targetSecNameOnly || (sSec.length > 0 && targetSec.includes(sSec));
          });
          setStudents(filteredStudents);
          cacheService.set('teacher_overview_students', filteredStudents);
          cacheService.set('teacher_class_students', filteredStudents);
        }
      } catch (err) {
        console.warn('Could not fetch students for overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  const totalStudents = students.length;
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const pageStudents = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Teacher Section */}
      <section>
        <div className="mb-3.5 flex items-center gap-2">
          <Icon icon="ph:user-square" className="size-6 text-brand-red" />
          <h2 className="text-base font-bold uppercase tracking-wider text-ink">Teacher</h2>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-ink/5 bg-cream px-4 py-3.5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
          <Avatar name={teacherInfo.name} src={teacherInfo.avatar} size={38} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-ink">{teacherInfo.name}</span>
            {teacherInfo.section ? (
              <span className="text-xs text-ink/60 font-semibold">{teacherInfo.section}</span>
            ) : (
              <span className="text-xs text-ink/40 font-medium italic">Unassigned Section</span>
            )}
          </div>
        </div>
      </section>

      {/* Students Section */}
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

        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xs">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-[#eef2f6] text-left text-xs font-bold uppercase tracking-wider text-ink/70">
                <th className="w-12 px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">LRN</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Gender</th>
                <th className="px-4 py-3.5">Reading Level</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading ? (
                <StudentTableSkeleton rows={5} />
              ) : pageStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink/50">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Icon icon="ph:users-three" className="size-10 text-ink/30 mb-1" />
                      <p className="text-sm font-bold text-ink">No Student Records Found</p>
                      <p className="text-xs text-ink/50">
                        {teacherInfo.section && !teacherInfo.section.toLowerCase().includes('unassigned')
                          ? `There are currently no students registered in ${teacherInfo.section}.`
                          : 'Your account is currently unassigned, so no students are loaded.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageStudents.map((student, i) => {
                  const rawLvl = (student.level || student.readingLevel || student.reading_level || student.current_profile_label || student.gstResult || '').toLowerCase();
                  let levelBadge = <span className="text-ink/40 font-bold px-2">—</span>;
                  if (rawLvl.includes('independ')) {
                    levelBadge = <span className="inline-flex items-center rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 border border-emerald-200/80">Independent</span>;
                  } else if (rawLvl.includes('instruct')) {
                    levelBadge = <span className="inline-flex items-center rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200/80">Instructional</span>;
                  } else if (rawLvl.includes('frustrat') || rawLvl.includes('non-reader') || rawLvl.includes('non reader')) {
                    levelBadge = <span className="inline-flex items-center rounded-full bg-rose-100/90 px-2.5 py-0.5 text-xs font-semibold text-rose-900 border border-rose-200/80">Frustration</span>;
                  }

                  const isCompleted = rawLvl.includes('independ') || rawLvl.includes('instruct') || rawLvl.includes('frustrat') || student.status === 'Completed' || student.status === 'completed';
                  const statusBadge = isCompleted ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">Completed</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/80">Pending Evaluation</span>
                  );

                  return (
                    <tr
                      key={student.lrn}
                      onClick={() => navigate(`/teacher/student-dashboard/students/${student.lrn}`)}
                      className="group transition-colors hover:bg-ink/[0.015] cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-xs font-semibold text-ink/70">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3.5 text-xs font-medium text-ink/80">{student.lrn}</td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={30} />
                          <span className="font-semibold text-ink group-hover:text-brand-blue transition-colors">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-ink/80">{student.gender || 'N/A'}</td>
                      <td className="px-4 py-3.5 text-xs">{levelBadge}</td>
                      <td className="px-4 py-3.5 text-xs">{statusBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && pageCount > 1 && (
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        )}
      </section>
    </div>
  );
}
