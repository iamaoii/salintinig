import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StudentProgressSidebar from '../../../components/dashboard/layout/StudentProgressSidebar.jsx';
import { getApiUrl } from '../../../config/api.js';
import { getUser, getToken } from '../../../lib/auth.js';
import { cacheService } from '../../../services/cacheService.js';

export default function StudentDashboardLayout() {
  const initialUser = getUser();
  const cachedHeader = cacheService.get('student_header_info');

  const deriveHeaderFromUser = (u) => {
    if (!u) return null;
    const sec = u.section || u.assigned_section || '';
    const rawSy = u.activeSchoolYear || u.schoolYear;
    const sy = rawSy ? `S.Y. ${String(rawSy).replace(/^S\.?Y\.?\s*/i, '')}` : '';
    if (sec || sy) {
      return { section: sec || 'Unassigned Section', schoolYear: sy || 'S.Y. 2026-2027' };
    }
    return null;
  };

  const initialInfo = cachedHeader || deriveHeaderFromUser(initialUser) || { section: 'Grade 4 - Fyang', schoolYear: 'S.Y. 2026-2027' };

  const [headerInfo, setHeaderInfo] = useState(initialInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLayoutData() {
      try {
        const token = getToken();
        let sec = headerInfo.section;
        let sy = headerInfo.schoolYear;
        try {
          const meRes = await fetch(getApiUrl('/api/auth/me'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.user) {
            sec = meData.user.section || meData.user.assigned_section || sec;
            const rawSy = meData.user.activeSchoolYear || meData.user.schoolYear;
            if (rawSy) {
              const clean = String(rawSy).replace(/^S\.?Y\.?\s*/i, '');
              sy = `S.Y. ${clean}`;
            }
          }
        } catch (e) {}

        if (!sec || sec === 'Unassigned Section') {
          sec = 'Grade 4 - Fyang';
        }

        if (!sy) {
          try {
            const syRes = await fetch(getApiUrl('/api/admin/school-years'), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const syData = await syRes.json();
            if (syRes.ok && syData.schoolYears && syData.schoolYears.length > 0) {
              const active = syData.schoolYears.find((item) => item.isActive === true || item.isActive === 'true' || item.is_active) || syData.schoolYears[0];
              if (active && active.schoolYear) {
                const clean = String(active.schoolYear).replace(/^S\.?Y\.?\s*/i, '');
                sy = `S.Y. ${clean}`;
              }
            }
          } catch (e) {}
        }

        const newHeader = { section: sec || 'Grade 4 - Fyang', schoolYear: sy || 'S.Y. 2026-2027' };
        setHeaderInfo(newHeader);
        cacheService.set('student_header_info', newHeader);
        setLoading(false);
      } catch (err) {
        console.warn('Dashboard layout fetch notice:', err);
        setLoading(false);
      }
    }
    fetchLayoutData();
  }, []);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <StudentProgressSidebar />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Icon icon="ph:users-three" className="size-8 text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Masterlist</h1>
          </div>
          {loading ? (
            <div className="h-5 w-48 animate-pulse rounded-md bg-ink/10" />
          ) : (
            <p className="text-sm font-semibold text-ink/80">
              {headerInfo.section} / {headerInfo.schoolYear}
            </p>
          )}
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
