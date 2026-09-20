import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen } from '@phosphor-icons/react';

const TABS = [
  { to: '/super-admin/phil-iri/passages', label: 'Passage Bank' },
];

export default function SuperAdminPhilIriLayout() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <BookOpen size={30} weight="regular" className="text-brand-red shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Phil-IRI System Content</h1>
          <p className="mt-0.5 text-xs text-ink/60">
            System-wide repository of official DepEd Phil-IRI graded reading passages and assessment materials.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4 border-b border-ink/10 sm:gap-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `shrink-0 border-b-2 pb-3 text-sm font-semibold transition-colors ${
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
