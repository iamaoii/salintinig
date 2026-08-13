import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StudentProgressSidebar from '../../../components/dashboard/layout/StudentProgressSidebar.jsx';
import { getToken } from '../../../lib/auth.js';

export default function StudentDashboardLayout() {
  const [headerInfo, setHeaderInfo] = useState({
    section: '',
    schoolYear: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLayoutData() {
      try {
        setLoading(true);
        const token = getToken();
        let sec = '';
        let sy = '';
        try {
          const meRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.user) {
            sec = meData.user.section || meData.user.assigned_section || '';
            const rawSy = meData.user.activeSchoolYear || meData.user.schoolYear;
            if (rawSy) {
              const clean = String(rawSy).replace(/^S\.?Y\.?\s*/i, '');
              sy = `S.Y. ${clean}`;
            }
          }
        } catch (e) {}

        if (!sec) {
          sec = 'Unassigned Section';
        }

        if (!sy) {
          try {
            const syRes = await fetch('http://localhost:5000/api/admin/school-years', {
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

        setHeaderInfo({ section: sec, schoolYear: sy });
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
