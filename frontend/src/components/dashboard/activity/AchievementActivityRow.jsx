

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
    };
  }

  if (typeStr.includes('oral')) {
    return {
      key: 'oral',
      label: 'Oral Reading',
      icon: 'ph:user-sound-bold',
      iconBg: 'bg-blue-100/90',
      iconColor: 'text-blue-700',
    };
  }

  if (typeStr.includes('silent')) {
    return {
      key: 'silent',
      label: 'Silent Reading',
      icon: 'ph:book-open-bold',
      iconBg: 'bg-emerald-100/90',
      iconColor: 'text-emerald-700',
    };
  }

  // Practice / General
  return {
    key: 'practice',
    label: 'Practice',
    icon: 'ph:puzzle-piece-bold',
    iconBg: 'bg-purple-100/90',
    iconColor: 'text-purple-700',
  };
}

export default function AchievementActivityRow({ activity }) {
  const isDone = activity.status === 'done';
  const theme = getAssessmentTheme(activity);

  const lang = (activity.language || activity.title || '').toLowerCase();
  const isEn = lang.includes('english') || lang.includes('en');
  const langBadge = isEn ? 'ENG' : 'FIL';

  return (
    <div className="relative w-full rounded-2xl border border-ink/10 bg-white p-4 sm:px-6 sm:py-4 shadow-2xs transition-all hover:border-ink/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Modality Icon + Title & Badges */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Rounded squircle icon container */}
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconColor}`}>
            <Icon icon={theme.icon} className="size-6" />
          </div>

          <div className="flex min-w-0 flex-col items-start gap-1">
            <p className="text-sm sm:text-base font-bold text-ink leading-snug truncate max-w-xs sm:max-w-md">
              {activity.title}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-brand-red/10 text-brand-red border border-brand-red/20 px-2 py-0.5 text-[10px] font-bold">
                {activity.tag || 'Phil-IRI'}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  isEn
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {langBadge}
              </span>
              {activity.passageSet && (
                <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold text-ink/70 border border-ink/10">
                  {activity.passageSet}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Personal Status / Scores + Blue Action Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/5">
          {/* Personal status & performance chips */}
          <div className="flex items-center gap-2">
            {isDone ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <Icon icon="ph:check-circle-bold" className="size-3.5 text-emerald-600 shrink-0" />
                  Done
                </span>
                {(activity.accuracyScore > 0 || activity.comprehensionScore > 0) && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-ink/70">
                    {activity.accuracyScore > 0 && (
                      <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink">
                        Acc: {activity.accuracyScore}%
                      </span>
                    )}
                    {activity.comprehensionScore > 0 && (
                      <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink">
                        Comp: {activity.comprehensionScore}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-700">
                <Icon icon="ph:clock-bold" className="size-3.5 text-amber-600 shrink-0" />
                Pending
              </span>
            )}
          </div>

          {/* Action Button: Royal Blue Pill Button ("Open" or "View result") */}
          <button
            type="button"
            onClick={() => {
              if (activity.onClick) {
                activity.onClick(activity);
              } else if (activity.onAction) {
                activity.onAction(activity);
              }
            }}
            className="rounded-full bg-[#165fd5] hover:bg-[#124db0] px-5 sm:px-6 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {isDone ? 'View result' : 'Open'}
          </button>
        </div>
      </div>
    </div>
  );
}
