import philIriIcon from '../../assets/activity-icon-philiri.svg';
import practiceIcon from '../../assets/activity-icon-practice.svg';
import doneIcon from '../../assets/activity-icon-done.svg';
import pendingIcon from '../../assets/activity-icon-pending.svg';
import menuDots from '../../assets/activity-menu-dots.svg';

const ROW_BG = {
  default: 'bg-cream',
  pending: 'bg-[rgba(255,195,0,0.1)]',
  completed: 'bg-[rgba(0,166,82,0.1)]',
};

const BUTTON_STYLE = {
  default: 'bg-brand-blue hover:bg-blue-700',
  pending: 'bg-[#ffc300] hover:bg-amber-500',
  completed: 'bg-[#00a652] hover:bg-green-700',
};

const ICON_BY_TYPE = {
  'phil-iri': philIriIcon,
  practice: practiceIcon,
};

function TitleBlock({ activity, className = '' }) {
  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <p className="text-base font-medium leading-4 text-ink">{activity.title}</p>
      <span className="rounded-[10px] bg-ink/10 px-2.5 py-1 text-[10px] leading-[10px] text-ink">
        {activity.tag}
      </span>
    </div>
  );
}

function StatsBlock({ activity }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <div className="flex items-start gap-1">
        <img src={doneIcon} alt="" className="mt-[3px] h-[7px] w-2.5" />
        <div className="flex flex-col items-start gap-1 leading-none text-ink">
          <span className="text-xs leading-3">{activity.done}</span>
          <span className="text-[10px] leading-[10px]">Students Done</span>
        </div>
      </div>
      <div className="flex items-start gap-1">
        <img src={pendingIcon} alt="" className="mt-0.5 size-2.5" />
        <div className="flex flex-col items-start gap-1 leading-none text-ink">
          <span className="text-xs leading-3">{activity.pending}</span>
          <span className="text-[10px] leading-[10px]">Students Pending</span>
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
      className={`shrink-0 rounded-[10px] px-3 py-1.5 text-xs font-semibold text-cream transition-colors ${BUTTON_STYLE[activity.status]}`}
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
      className="flex size-8 shrink-0 items-center justify-center rounded-full p-2.5 hover:bg-ink/5"
    >
      <img src={menuDots} alt="" className="h-4 w-0.5" />
    </button>
  );
}

export default function ActivityRow({ activity, compact = false, selected = false, onClick }) {
  const icon = ICON_BY_TYPE[activity.type];
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      onClick={onClick}
      className={`w-full rounded-[10px] border text-left shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)] transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${selected ? 'border-brand-blue' : 'border-ink/5'} ${ROW_BG[activity.status]}`}
    >
      {/* xl+: exact Figma layout */}
      <div className={`items-center gap-8 px-10 py-5 ${compact ? 'hidden' : 'hidden xl:flex'}`}>
        <img src={icon} alt="" className="size-10 shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <TitleBlock activity={activity} className="w-[300px] shrink-0" />
          <StatsBlock activity={activity} />
          <div className="flex w-[150px] shrink-0 justify-end">
            <ActionButton activity={activity} onClick={stopPropagation} />
          </div>
        </div>
        <MenuButton onClick={stopPropagation} />
      </div>

      {/* below xl (or always, if compact): stacked, responsive layout */}
      <div className={`flex flex-col gap-4 px-5 py-4 ${compact ? '' : 'xl:hidden'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <img src={icon} alt="" className="size-10 shrink-0" />
            <TitleBlock activity={activity} />
          </div>
          <MenuButton onClick={stopPropagation} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatsBlock activity={activity} />
          <ActionButton activity={activity} onClick={stopPropagation} />
        </div>
      </div>
    </div>
  );
}
