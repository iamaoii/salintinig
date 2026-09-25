import { useState, useEffect } from 'react';
import logoBg from '../../../assets/logo/logo_bg.webp';
import { getToken, getUser } from '../../../lib/auth.js';
import { cacheService } from '../../../services/cacheService.js';
import { getApiUrl } from '../../../config/api.js';
import { ClassCardSkeleton } from '../../common/Skeleton.jsx';

function formatSectionTitle(rawSec, rawGrade) {
  if (!rawSec || rawSec.toLowerCase().includes('unassigned')) {
    return 'Unassigned Section';
  }

  if (rawSec.includes('All Sections')) {
    const gradeNum = rawGrade ? String(rawGrade).replace(/^grade\s*/i, '').trim() : '4';
    return `Grade ${gradeNum} — All Sections`;
  }

  let cleanSec = String(rawSec)
    .replace(/^(\s*grade\s*\d*\s*[-:]*\s*)+/gi, '')
    .trim();

  let gradeNum = rawGrade ? String(rawGrade).replace(/^grade\s*/i, '').trim() : '';

  if (!gradeNum) {
    const match = String(rawSec).match(/grade\s*(\d+)/i);
    if (match) gradeNum = match[1];
  }

  if (!cleanSec) cleanSec = rawSec;

  if (gradeNum) {
    return `Grade ${gradeNum} - ${cleanSec}`;
  }

  return cleanSec;
}

export default function ClassCard() {
  const currentUser = getUser();
  const cachedCard = cacheService.get('teacher_class_card_info');

  const computeClassInfo = () => {
    const userGrade = currentUser?.grade || currentUser?.grade_level || currentUser?.assigned_grade || currentUser?.gradeLevel;
    const userSec = currentUser?.section || currentUser?.assigned_section || currentUser?.sectionName || '';

    const userFormedSection = formatSectionTitle(userSec, userGrade);

    if (cachedCard && cachedCard.sectionName) {
      if (cachedCard.sectionName !== 'Unassigned Section' || userFormedSection === 'Unassigned Section') {
        return {
          ...cachedCard,
          sectionName: formatSectionTitle(cachedCard.sectionName, userGrade),
        };
      }
    }

    const rawSy = currentUser?.activeSchoolYear || currentUser?.schoolYear || '2026-2027';
    const syText = `S.Y. ${String(rawSy).replace(/^S\.?Y\.?\s*/i, '')}`;

    const cachedStudents = cacheService.get('teacher_class_students');
    const studentCount = Array.isArray(cachedStudents) ? cachedStudents.length : '';
    const learnerCount = studentCount !== '' ? `${studentCount} Enrolled Learners` : '';

    return {
      sectionName: userFormedSection,
      schoolYear: syText,
      learnerCount,
    };
  };

  const initialInfo = computeClassInfo();
  const [sectionInfo, setSectionInfo] = useState(initialInfo);
  const [loading, setLoading] = useState(() => !cachedCard && initialInfo.sectionName === 'Unassigned Section');

  useEffect(() => {
    let isMounted = true;

    async function syncClassInfo() {
      try {
        const token = getToken();
        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }

        const res = await fetch(getApiUrl('/api/teacher/class-students'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const students = Array.isArray(data.students) ? data.students : [];
          cacheService.set('teacher_class_students', students, 300000);
          cacheService.set('teacher_overview_students', students, 300000);

          let rawSecName = data.sectionName || '';
          let rawGradeLevel = data.gradeLevel || '';

          if (!rawSecName && students.length > 0 && students[0].sectionName) {
            rawSecName = students[0].sectionName;
            rawGradeLevel = rawGradeLevel || students[0].gradeLevel;
          }

          let finalSecName = sectionInfo.sectionName;
          if (rawSecName && !rawSecName.toLowerCase().includes('unassigned')) {
            finalSecName = formatSectionTitle(rawSecName, rawGradeLevel);
          } else {
            const u = getUser();
            const uSec = u?.section || u?.assigned_section || u?.sectionName || '';
            const uGrade = u?.grade || u?.grade_level || u?.assigned_grade || u?.gradeLevel;
            if (uSec && !uSec.toLowerCase().includes('unassigned')) {
              finalSecName = formatSectionTitle(uSec, uGrade);
            }
          }

          const rawSy = data.schoolYear || currentUser?.activeSchoolYear || currentUser?.schoolYear || '2026-2027';
          const syText = `S.Y. ${String(rawSy).replace(/^S\.?Y\.?\s*/i, '')}`;
          const countText = `${students.length} Enrolled Learners`;

          const updatedInfo = {
            sectionName: finalSecName,
            schoolYear: syText,
            learnerCount: countText,
          };

          if (isMounted) {
            setSectionInfo(updatedInfo);
          }

          cacheService.set('teacher_class_card_info', updatedInfo, 300000);

          // Update saved user object in local & session storage
          const user = getUser();
          if (user && finalSecName !== 'Unassigned Section') {
            user.sectionName = rawSecName || user.sectionName;
            user.section = finalSecName;
            user.assigned_section = finalSecName;
            if (rawGradeLevel) user.gradeLevel = String(rawGradeLevel);
            if (data.schoolYear) user.activeSchoolYear = data.schoolYear;

            const USER_KEY = 'salintinig_user';
            if (localStorage.getItem(USER_KEY)) {
              localStorage.setItem(USER_KEY, JSON.stringify(user));
            }
            if (sessionStorage.getItem(USER_KEY)) {
              sessionStorage.setItem(USER_KEY, JSON.stringify(user));
            }
          }
        }
      } catch (err) {
        // Silent background fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncClassInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <ClassCardSkeleton />;
  }

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
