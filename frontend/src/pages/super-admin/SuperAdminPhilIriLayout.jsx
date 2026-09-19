import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen } from '@phosphor-icons/react';

const TABS = [
  { to: '/super-admin/phil-iri/passages', label: 'Passages' },
];

export default function SuperAdminPhilIriLayout() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
        <BookOpen size={32} weight="regular" className="text-purple-700 shrink-0" />
        <span>Phil-IRI Passages</span>
      </h1>
      <p className="mt-1 text-xs text-ink/50">
        Manage the central Phil-IRI passage library — add, edit, publish, and archive passages.
      </p>

      <div className="mt-4 flex items-center gap-4 overflow-x-auto border-b border-ink/10 sm:gap-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${
                isActive ? 'border-purple-700 text-purple-700' : 'border-transparent text-ink/60 hover:text-ink'
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
