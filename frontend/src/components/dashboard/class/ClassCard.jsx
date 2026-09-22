import { useState, useEffect } from 'react';
import logoBg from '../../../assets/logo/logo_bg.webp';
import { getToken, getUser } from '../../../lib/auth.js';
import { cacheService } from '../../../services/cacheService.js';
import { getApiUrl } from '../../../config/api.js';

export default function ClassCard() {
  const currentUser = getUser();
  const cachedCard = cacheService.get('teacher_class_card_info');

  const computeClassInfo = () => {
    if (cachedCard) return cachedCard;

    const userGrade = currentUser?.grade || currentUser?.grade_level || currentUser?.assigned_grade;
    const gradePrefix = userGrade ? `Grade ${String(userGrade).replace(/^grade\s*/i, '')}` : '';
    const userSec = currentUser?.section || currentUser?.assigned_section || '';

    let sectionName = 'Unassigned Section';
    if (userSec) {
      sectionName = gradePrefix && !userSec.toLowerCase().includes('grade') ? `${gradePrefix} - ${userSec}` : userSec;
    }

    const rawSy = currentUser?.activeSchoolYear || currentUser?.schoolYear || '2026-2027';
    const syText = `S.Y. ${String(rawSy).replace(/^S\.?Y\.?\s*/i, '')}`;

    const cachedStudents = cacheService.get('teacher_class_students');
    const studentCount = Array.isArray(cachedStudents) ? cachedStudents.length : '';
    const learnerCount = studentCount !== '' ? `${studentCount} Enrolled Learners` : '';

    return {
      sectionName,
      schoolYear: syText,
      learnerCount,
    };
  };

  const [sectionInfo, setSectionInfo] = useState(computeClassInfo);

  useEffect(() => {
    let isMounted = true;

    // Non-blocking background sync for student count
    async function syncClassInfo() {
      try {
        const token = getToken();
        if (!token) return;

        const cachedStudents = cacheService.get('teacher_class_students');
        if (cachedStudents && Array.isArray(cachedStudents)) {
          const countText = `${cachedStudents.length} Enrolled Learners`;
          if (isMounted && sectionInfo.learnerCount !== countText) {
            const updated = { ...sectionInfo, learnerCount: countText };
            setSectionInfo(updated);
            cacheService.set('teacher_class_card_info', updated);
          }
          return;
        }

        const res = await fetch(getApiUrl('/api/teacher/class-students'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          cacheService.set('teacher_class_students', data.students);
          if (isMounted) {
            const updated = {
              ...sectionInfo,
              learnerCount: `${data.students.length} Enrolled Learners`,
            };
            setSectionInfo(updated);
            cacheService.set('teacher_class_card_info', updated);
          }
        }
      } catch (err) {
        // Silent background fallback
      }
    }

    syncClassInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] min-h-[124px]">
      {/* Background Logo Watermark */}
      <img
        src={logoBg}
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
      />

      <div className="relative z-10 flex flex-col items-start gap-2">
        <h2 className="text-3xl sm:text-[32px] font-bold leading-tight text-cream">
          {sectionInfo.sectionName}
        </h2>
        <div className="flex flex-col gap-1 text-xs font-semibold leading-tight text-cream/90">
          <p className="uppercase tracking-wide">{sectionInfo.schoolYear}</p>
          {sectionInfo.learnerCount && <p className="opacity-90">{sectionInfo.learnerCount}</p>}
        </div>
      </div>
    </div>
  );
}
