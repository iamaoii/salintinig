import { useState, useEffect } from 'react';
import logoBg from '../../../assets/logo/logo_bg.webp';
import { getToken } from '../../../lib/auth.js';

export default function ClassCard() {
  const [loading, setLoading] = useState(true);
  const [sectionInfo, setSectionInfo] = useState({
    sectionName: '',
    schoolYear: '',
    learnerCount: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchClassInfo() {
      try {
        setLoading(true);
        const token = getToken();

        // 1. Fetch current logged-in user profile from /api/auth/me
        let sectionName = '';
        let activeSY = '';
        try {
          const resMe = await fetch('http://localhost:5000/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const dataMe = await resMe.json();
          if (resMe.ok && dataMe.success && dataMe.user) {
            sectionName = dataMe.user.section || dataMe.user.assigned_section || '';
            const rawSy = dataMe.user.activeSchoolYear || dataMe.user.schoolYear;
            if (rawSy) {
              const cleanSy = String(rawSy).replace(/^S\.?Y\.?\s*/i, '');
              activeSY = `S.Y. ${cleanSy}`;
            }
          }
        } catch (meErr) {
          console.warn('ClassCard me fetch notice:', meErr.message);
        }

        // 2. If no teacher section assigned yet, fetch active sections from DB
        if (!sectionName) {
          sectionName = 'Unassigned Section';
        }

        // 3. Fallback School Year fetch if /api/auth/me didn't provide activeSchoolYear
        if (!activeSY) {
          try {
            const resSY = await fetch('http://localhost:5000/api/admin/school-years', {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const dataSY = await resSY.json();
            if (resSY.ok && dataSY.success && Array.isArray(dataSY.schoolYears)) {
              const activeRecord = dataSY.schoolYears.find((sy) => sy.isActive === true || sy.isActive === 'true' || sy.is_active) || dataSY.schoolYears[0];
              if (activeRecord && activeRecord.schoolYear) {
                const cleanSy = String(activeRecord.schoolYear).replace(/^S\.?Y\.?\s*/i, '');
                activeSY = `S.Y. ${cleanSy}`;
              }
            }
          } catch (syErr) {
            console.warn('School year fetch notice:', syErr.message);
          }
        }

        // 4. Fetch Enrolled Learners Count from DB for THIS specific section
        let learnerText = '0 Enrolled Learners';
        try {
          const resStudents = await fetch('http://localhost:5000/api/admin/students', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const dataStudents = await resStudents.json();
          if (resStudents.ok && dataStudents.success && Array.isArray(dataStudents.students)) {
            const sectionStudents = dataStudents.students.filter((s) => {
              if (!sectionName) return false;
              const sSec = (s.section || '').toLowerCase().trim();
              const targetSec = sectionName.toLowerCase().trim();
              const targetSecNameOnly = targetSec.replace(/^grade\s*\d+\s*-\s*/i, '').trim();
              return sSec === targetSec || sSec === targetSecNameOnly || (sSec.length > 0 && targetSec.includes(sSec));
            });
            learnerText = `${sectionStudents.length} Enrolled Learners`;
          }
        } catch (stdErr) {
          console.warn('Students count fetch notice:', stdErr.message);
        }

        if (isMounted) {
          setSectionInfo({
            sectionName,
            schoolYear: activeSY,
            learnerCount: learnerText,
          });
          setLoading(false);
        }
      } catch (e) {
        console.warn('Class card info fetch notice:', e);
        if (isMounted) setLoading(false);
      }
    }

    fetchClassInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="relative flex items-start justify-between overflow-hidden rounded-2xl bg-brand-red p-5 text-cream shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] min-h-[124px]">
        <img
          src={logoBg}
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover brightness-[3] mix-blend-screen"
        />
        <div className="relative z-10 flex flex-col items-start gap-3 w-full">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-white/30" />
          <div className="flex flex-col gap-2 w-full">
            <div className="h-3.5 w-32 animate-pulse rounded-md bg-white/20" />
            <div className="h-3.5 w-40 animate-pulse rounded-md bg-white/20" />
          </div>
        </div>
      </div>
    );
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
        <h2 className="text-3xl sm:text-[32px] font-bold leading-tight text-cream">{sectionInfo.sectionName}</h2>
        <div className="flex flex-col gap-1 text-xs font-semibold leading-tight text-cream/90">
          <p className="uppercase tracking-wide">{sectionInfo.schoolYear}</p>
          <p className="opacity-90">{sectionInfo.learnerCount}</p>
        </div>
      </div>
    </div>
  );
}
