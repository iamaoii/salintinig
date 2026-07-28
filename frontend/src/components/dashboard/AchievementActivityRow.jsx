import practiceIcon from '../../assets/activity-icon-practice.svg';
import menuDots from '../../assets/activity-menu-dots.svg';

const ROW_BG = {
  'not-done': 'bg-cream',
  done: 'bg-[rgba(0,166,82,0.1)]',
};

const BUTTON_STYLE = {
  'not-done': 'bg-brand-red hover:bg-red-700',
  done: 'bg-[#00a652] hover:bg-green-700',
};

export default function AchievementActivityRow({ activity }) {
  const isDone = activity.status === 'done';

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-[10px] border border-ink/5 px-6 py-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] sm:flex-nowrap sm:gap-8 ${ROW_BG[activity.status]}`}
    >
      <img src={practiceIcon} alt="" className="size-10 shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <p className="text-base font-medium leading-4 text-ink">{activity.title}</p>
        <div className="flex items-center gap-1.5">
          <span className="rounded-[10px] bg-ink/10 px-2.5 py-1 text-[10px] leading-[10px] text-ink">Practice</span>
          <span className="rounded-[10px] bg-ink/10 px-2.5 py-1 text-[10px] leading-[10px] text-ink">
            {isDone ? 'Done' : 'Not Done'}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`shrink-0 rounded-[10px] px-3 py-1.5 text-xs font-semibold text-cream transition-colors ${BUTTON_STYLE[activity.status]}`}
      >
        {isDone ? 'View result' : 'Open'}
      </button>

      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-full p-2.5 hover:bg-ink/5"
      >
        <img src={menuDots} alt="" className="h-4 w-0.5" />
      </button>
    </div>
  );
}
