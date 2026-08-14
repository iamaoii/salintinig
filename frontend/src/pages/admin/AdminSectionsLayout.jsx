import { NavLink, Outlet } from 'react-router-dom';
import { IdentificationCard } from '@phosphor-icons/react';

const TABS = [
  { to: '/admin/sections/list', label: 'Sections' },
  { to: '/admin/sections/faculty', label: 'Faculty' },
  { to: '/admin/sections/school-years', label: 'School Years' },
];

export default function AdminSectionsLayout() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
        <IdentificationCard size={32} weight="regular" className="text-brand-red shrink-0" />
        <span>Sections &amp; Faculty</span>
      </h1>

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
  );
}
