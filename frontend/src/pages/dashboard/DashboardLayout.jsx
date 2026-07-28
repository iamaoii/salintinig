import { Outlet } from 'react-router-dom';
import TopNav from '../../components/dashboard/TopNav.jsx';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-cream">
      <TopNav />
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
}
