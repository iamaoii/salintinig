import { NavLink } from 'react-router-dom';
import { House, Presentation, FileText, Flag, Gear } from '@phosphor-icons/react';
import logo from '../../assets/logo-salintinig.png';
import Avatar from './Avatar.jsx';

const NAV_ITEMS = [
  { to: '/dashboard/overview', label: 'Overview', icon: House },
  { to: '/dashboard/student-dashboard', label: 'Student Dashboard', icon: Presentation },
  { to: '/dashboard/phil-iri-records', label: 'Phil - IRI Records', icon: FileText },
  { to: '/dashboard/class-activities', label: 'Class Activities', icon: Flag },
];

export default function TopNav() {
  return (
    <header className="flex items-center gap-2 border-b border-ink/10 bg-cream px-4 py-4 sm:gap-4 sm:px-8">
      <img src={logo} alt="SalinTinig" className="h-8 w-auto shrink-0 sm:h-9" />

      <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto sm:gap-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                isActive
                  ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                  : 'border-transparent text-ink/70 hover:bg-ink/5'
              }`
            }
          >
            <Icon size={18} weight={to === '/dashboard/overview' ? 'fill' : 'regular'} className="shrink-0" />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <NavLink to="/dashboard/account" className="text-ink/60 hover:text-ink">
          <Gear size={22} />
        </NavLink>
        <NavLink to="/dashboard/account">
          <Avatar name="Ted Mosby" size={36} />
        </NavLink>
      </div>
    </header>
  );
}
