import { NavLink, Outlet } from 'react-router-dom';
import { Article } from '@phosphor-icons/react';

const TABS = [
  { to: '/teacher/phil-iri-records/form-1a', label: 'FORM 1A' },
  { to: '/teacher/phil-iri-records/form-1b', label: 'FORM 1B' },
  { to: '/teacher/phil-iri-records/form-2', label: 'FORM 2' },
  { to: '/teacher/phil-iri-records/form-3a', label: 'FORM 3A' },
  { to: '/teacher/phil-iri-records/form-3b', label: 'FORM 3B' },
  { to: '/teacher/phil-iri-records/form-4', label: 'FORM 4' },
];

export default function PhilIriLayout() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Article size={28} className="text-brand-red" />
        <h1 className="text-3xl font-bold text-ink">Phil-IRI Records</h1>
      </div>

      <div className="mt-4 flex items-center gap-4 overflow-x-auto border-b border-ink/10">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'border-brand-red text-brand-red' : 'border-transparent text-ink hover:bg-ink/5'
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
