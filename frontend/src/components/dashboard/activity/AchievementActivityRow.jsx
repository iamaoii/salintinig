

import { Icon } from '@iconify/react';

const TYPE_STYLE = {
  PhilIRI: { icon: 'ph:exam', bg: 'bg-[#FEE2E2] text-[#EF4444]' },
  Practice: { icon: 'ph:puzzle-piece', bg: 'bg-[#DBEAFE] text-[#2563EB]' },
};

const ROW_BG = {
  'not-done': 'bg-cream border-ink/10',
  done: 'bg-[#EBF7F0] border-[#00a652]/20',
};

const BUTTON_STYLE = {
  'not-done': 'bg-brand-red hover:bg-red-700',
  done: 'bg-[#00a652] hover:bg-green-700',
};

export default function AchievementActivityRow({ activity }) {
  const isDone = activity.status === 'done';
  const typeConfig = TYPE_STYLE[activity.type] || TYPE_STYLE.Practice;

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] sm:flex-nowrap sm:gap-6 sm:px-6 sm:py-4 ${ROW_BG[activity.status]}`}
    >
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${typeConfig.bg}`}>
        <Icon icon={typeConfig.icon} className="size-[30px]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <p className="text-base font-bold text-ink">{activity.title}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink/10 px-3 py-0.5 text-xs font-semibold text-ink/70">
            {activity.type || 'Practice'}
          </span>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              isDone ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#d53f24]'
            }`}
          >
            {isDone ? 'Done' : 'Not Done'}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`shrink-0 rounded-full px-5 py-2 text-xs font-semibold text-cream transition-colors ${BUTTON_STYLE[activity.status]}`}
      >
        {isDone ? 'View result' : 'Open'}
      </button>

      <button
        type="button"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Icon icon="ph:dots-three-vertical" className="size-5" />
      </button>
    </div>
  );
}
