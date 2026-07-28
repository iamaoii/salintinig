import { Outlet } from 'react-router-dom';
import StudentProgressSidebar from '../../components/dashboard/StudentProgressSidebar.jsx';
import masterlistIcon from '../../assets/sd-icon-masterlist-header.svg';

export default function StudentDashboardLayout() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <StudentProgressSidebar />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-8">
            <img src={masterlistIcon} alt="" className="h-6 w-8" />
            <h1 className="text-3xl font-medium text-ink">Masterlist</h1>
          </div>
          <p className="text-sm text-ink/50">Grade 4 - Section Fyang / S.Y. 2026-2027</p>
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
