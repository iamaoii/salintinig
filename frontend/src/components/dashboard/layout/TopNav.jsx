import { NavLink } from 'react-router-dom';
import { House, PresentationChart, Article, FlagPennant, Gear } from '@phosphor-icons/react';
import logo from '../../../assets/logo/logo.webp';
import Avatar from '../student/Avatar.jsx';

const NAV_ITEMS = [
  { to: '/dashboard/overview', label: 'Overview', icon: House },
  { to: '/dashboard/student-dashboard', label: 'Student Dashboard', icon: PresentationChart },
  { to: '/dashboard/phil-iri-records', label: 'Phil - IRI Records', icon: Article },
  { to: '/dashboard/class-activities', label: 'Class Activities', icon: FlagPennant },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 shadow-[0px_4px_12px_rgba(26,24,22,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1480px] items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Logo Branding */}
        <div className="flex shrink-0 items-center gap-2.5">
          <img src={logo} alt="SalinTinig" className="h-8 w-auto" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-ink font-sans">
            SalinTinig
          </span>
        </div>

        {/* Navigation Tabs with Underline Indicator */}
        <nav className="flex h-full min-w-0 items-center justify-center gap-3 sm:gap-6 md:gap-8">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex h-full shrink-0 items-center gap-2 px-2.5 text-sm font-semibold transition-colors sm:px-3.5 ${
                  isActive
                    ? 'text-brand-red'
                    : 'text-ink/70 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} weight="regular" className="shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-brand-red" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Account Settings */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <NavLink
            to="/dashboard/account"
            className="flex size-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Gear size={21} weight="regular" />
          </NavLink>
          <NavLink to="/dashboard/account" className="transition-transform hover:scale-105">
            <Avatar name="Ted Mosby" size={35} />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
