import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar.jsx';

const TABS = [
  { to: '/dashboard/overview/forms', label: 'Forms' },
  { to: '/dashboard/overview/activities', label: 'Activities' },
  { to: '/dashboard/overview/people', label: 'People' },
];

export default function OverviewLayout() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold text-ink">Overview</h1>

        <div className="mt-4 flex items-center gap-4 overflow-x-auto border-b border-ink/10 sm:gap-6">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  isActive ? 'border-brand-red text-brand-red' : 'border-transparent text-ink/60 hover:text-ink'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
