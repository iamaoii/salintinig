import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

function getAssessmentTheme(activity) {
  const typeStr = (
    activity.assessmentType ||
    activity.assessment_type ||
    activity.type ||
    activity.title ||
    ''
  ).toLowerCase();

  if (typeStr.includes('listening')) {
    return {
      key: 'listening',
      label: 'Listening',
      icon: 'ph:ear-bold',
      iconBg: 'bg-amber-100/90',
      iconColor: 'text-amber-700',
      buttonBg: 'bg-[#ffc300] hover:bg-amber-500 text-amber-950 font-bold',
      badgeBg: 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
    };
  }

  if (typeStr.includes('oral')) {
    return {
      key: 'oral',
      label: 'Oral Reading',
      icon: 'ph:user-sound-bold',
      iconBg: 'bg-blue-100/90',
      iconColor: 'text-blue-700',
      buttonBg: 'bg-brand-blue hover:bg-blue-700 text-white font-bold',
      badgeBg: 'bg-blue-100/90 text-blue-950 border border-blue-200/80',
    };
  }

  if (typeStr.includes('silent')) {
    return {
      key: 'silent',
      label: 'Silent Reading',
      icon: 'ph:book-open-bold',
      iconBg: 'bg-emerald-100/90',
      iconColor: 'text-emerald-700',
      buttonBg: 'bg-[#00a652] hover:bg-emerald-700 text-white font-bold',
      badgeBg: 'bg-emerald-100/90 text-emerald-950 border border-emerald-200/80',
    };
  }

  // Practice / General
  return {
    key: 'practice',
    label: 'Practice',
    icon: 'ph:puzzle-piece-bold',
    iconBg: 'bg-purple-100/90',
    iconColor: 'text-purple-700',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white font-bold',
    badgeBg: 'bg-purple-100/90 text-purple-950 border border-purple-200/80',
  };
}

function TitleBlock({ activity, theme, className = '' }) {
  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <p className="text-sm font-bold text-ink leading-snug">{activity.title}</p>
      <div className="flex items-center gap-1.5">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${theme.badgeBg}`}>
          {activity.tag || 'Phil-IRI'}
        </span>
      </div>
    </div>
  );
}

function StatsBlock({ activity }) {
  return (
    <div className="flex shrink-0 items-center gap-6 sm:gap-8">
      {/* Students Done */}
      <div className="flex items-center gap-1.5">
        <Icon icon="ph:check" className="size-4.5 shrink-0 text-emerald-600" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-ink">{activity.done}</span>
          <span className="text-[11px] font-medium text-ink/60">Students Done</span>
        </div>
      </div>

      {/* Students Pending */}
      <div className="flex items-center gap-1.5">
        <Icon icon="ph:clock" className="size-4.5 shrink-0 text-amber-600" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-ink">{activity.pending}</span>
          <span className="text-[11px] font-medium text-ink/60">Students Pending</span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ activity, theme, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer ${theme.buttonBg}`}
    >
      {activity.action || 'Open'}
    </button>
  );
}

function MenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full p-1.5 text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink cursor-pointer"
    >
      <Icon icon="ph:dots-three-vertical-bold" className="size-4" />
    </button>
  );
}

export default function ActivityRow({ activity, selected = false, onClick, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const stopPropagation = (e) => e.stopPropagation();
  const theme = getAssessmentTheme(activity);

  return (
    <div
      onClick={onClick}
      className={`relative w-full rounded-xl border text-left shadow-2xs bg-white transition-all ${
        onClick ? 'cursor-pointer hover:border-ink/20' : ''
      } ${selected ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-ink/10'}`}
    >
      <div className="flex items-center gap-6 sm:gap-8 p-3.5 sm:px-5 sm:py-4">
        {/* Left Icon Container matching assessment type */}
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconColor}`}>
          <Icon icon={theme.icon} className="size-6" />
        </div>

        {/* Center Title, Stats & Action */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <TitleBlock activity={activity} theme={theme} className="min-w-0 flex-1 pl-1 pr-2" />
          <StatsBlock activity={activity} />
          <div className="flex shrink-0 sm:ml-4">
            <ActionButton activity={activity} theme={theme} onClick={stopPropagation} />
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
                    navigate(`/teacher/class-activities/${activity.id}/edit`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-ink/5 cursor-pointer"
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
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
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
