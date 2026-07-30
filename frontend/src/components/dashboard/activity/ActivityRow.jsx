import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ROW_BG = {
  default: 'bg-cream',
  pending: 'bg-[#FFF9E6]',
  completed: 'bg-[#EEF9F1]',
};

const BUTTON_STYLE = {
  default: 'bg-brand-blue hover:bg-blue-700',
  pending: 'bg-[#EAB308] hover:bg-yellow-600',
  completed: 'bg-[#00A652] hover:bg-emerald-700',
};

const ICON_CONFIG = {
  'phil-iri': {
    icon: 'ph:exam',
    bg: 'bg-[#FEE2E2]',
    color: 'text-[#EF4444]',
  },
  practice: {
    icon: 'ph:puzzle-piece',
    bg: 'bg-[#DBEAFE]',
    color: 'text-[#2563EB]',
  },
};

function TitleBlock({ activity, className = '' }) {
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <p className="text-base font-bold text-ink">{activity.title}</p>
      <span className="rounded-full bg-ink/10 px-3 py-0.5 text-xs font-medium text-ink/70">
        {activity.tag}
      </span>
    </div>
  );
}

function StatsBlock({ activity }) {
  return (
    <div className="flex shrink-0 items-center gap-8 sm:gap-10">
      {/* Students Done */}
      <div className="flex items-start gap-2">
        <Icon icon="ph:check" className="size-4 shrink-0 translate-y-[2px] text-ink" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-base font-normal text-ink">{activity.done}</span>
          <span className="mt-0.5 text-xs text-ink/60">Students Done</span>
        </div>
      </div>

      {/* Students Pending */}
      <div className="flex items-start gap-2">
        <Icon icon="ph:spinner" className="size-4 shrink-0 translate-y-[2px] text-ink" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-base font-normal text-ink">{activity.pending}</span>
          <span className="mt-0.5 text-xs text-ink/60">Students Pending</span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ activity, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-cream transition-colors ${BUTTON_STYLE[activity.status]}`}
    >
      {activity.action}
    </button>
  );
}

function MenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-full p-2 text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
    >
      <Icon icon="ph:dots-three-vertical-bold" className="size-5" />
    </button>
  );
}

export default function ActivityRow({ activity, selected = false, onClick, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const stopPropagation = (e) => e.stopPropagation();
  const iconConfig = ICON_CONFIG[activity.type] || ICON_CONFIG.practice;

  return (
    <div
      onClick={onClick}
      className={`relative w-full rounded-2xl border text-left shadow-[0px_5px_5px_0px_rgba(26,24,22,0.08)] transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${selected ? 'border-brand-blue' : 'border-ink/5'} ${ROW_BG[activity.status]}`}
    >
      <div className="flex items-center gap-4 p-4 sm:gap-5 sm:px-6 sm:py-5">
        {/* Left Icon Container */}
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconConfig.bg} ${iconConfig.color}`}>
          <Icon icon={iconConfig.icon} className="size-[30px]" />
        </div>

        {/* Center Title, Stats & Action */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <TitleBlock activity={activity} className="min-w-0 sm:w-[260px] md:w-[300px] shrink-0" />
          <StatsBlock activity={activity} />
          <div className="flex shrink-0 sm:ml-auto">
            <ActionButton activity={activity} onClick={stopPropagation} />
          </div>
        </div>

        {/* 3-dots Menu Container */}
        <div className="relative">
          <MenuButton
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          />

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-ink/10 bg-cream p-1.5 shadow-xl transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    navigate(`/dashboard/class-activities/${activity.id}/edit`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  <Icon icon="ph:pencil-simple-bold" className="size-4 text-brand-blue" />
                  Edit Activity
                </button>

                <div className="my-1 border-t border-ink/10" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete?.(activity.id);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Icon icon="ph:trash-bold" className="size-4 text-red-600" />
                  Delete Activity
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
