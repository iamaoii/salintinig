import { Outlet } from 'react-router-dom';
import TopNav from '../../components/dashboard/layout/TopNav.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-cream">
      <TopNav />
      <main className="mx-auto max-w-[1480px] px-6 py-8 sm:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
