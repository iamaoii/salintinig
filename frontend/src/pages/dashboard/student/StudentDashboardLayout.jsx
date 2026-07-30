import { Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import StudentProgressSidebar from '../../../components/dashboard/layout/StudentProgressSidebar.jsx';

export default function StudentDashboardLayout() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <StudentProgressSidebar />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Icon icon="ph:users-three" className="size-8 text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Masterlist</h1>
          </div>
          <p className="text-sm font-semibold text-ink/80">Grade 4 - Section Fyang / S.Y. 2026-2027</p>
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
