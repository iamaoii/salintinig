import { Link } from 'react-router-dom';
import { ChartPieSlice, ArrowRight, PencilSimple, Trash, UsersThree } from '@phosphor-icons/react';

export default function ActivityDetailPanel({ activity, onDelete }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {/* Overview Stat Card */}
      <div className="rounded-xl border border-ink/10 bg-cream p-4 shadow-sm">
        {/* Header Title */}
        <div className="mb-2.5 flex items-center gap-1.5 text-ink/60">
          <ChartPieSlice size={18} className="shrink-0 text-ink/50" />
          <h2 className="text-sm font-semibold text-ink/70">{activity.title}</h2>
        </div>

        {/* Total Students & Status Indicators */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold leading-none text-ink">
              {activity.done + activity.pending}
            </span>
            <span className="max-w-[65px] text-[11px] font-semibold leading-tight text-ink/50">
              Total Students
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-1 shrink-0 rounded-full bg-[#00A652]" />
              <span className="text-sm font-bold text-ink">{activity.done}</span>
              <span className="text-[11px] font-medium text-ink/60">Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-4 w-1 shrink-0 rounded-full bg-ink/20" />
              <span className="text-sm font-bold text-ink">{activity.pending}</span>
              <span className="text-[11px] font-medium text-ink/60">Not Done</span>
            </div>
          </div>
        </div>

        {/* GST Grid Cards */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {/* Under 14 GST */}
          <div className="flex flex-col justify-between rounded-lg border border-ink/10 bg-cream p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-ink">{activity.studentsUnder14Gst}</span>
              <div className="flex size-6 items-center justify-center rounded-full border border-brand-red text-brand-red">
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
            <div className="mt-2.5 flex items-end justify-between gap-1.5">
              <span className="max-w-[80px] text-[11px] font-medium leading-tight text-ink/80">
                Student under 14 GST
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink/10 text-ink/40">
                <UsersThree size={16} weight="bold" />
              </div>
            </div>
          </div>

          {/* Above 14 GST */}
          <div className="flex flex-col justify-between rounded-lg border border-ink/10 bg-cream p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-ink">{activity.studentsAbove14Gst}</span>
              <div className="flex size-6 items-center justify-center rounded-full border border-brand-red text-brand-red">
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
            <div className="mt-2.5 flex items-end justify-between gap-1.5">
              <span className="max-w-[80px] text-[11px] font-medium leading-tight text-ink/80">
                Student above 14 GST
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink/10 text-ink/40">
                <UsersThree size={16} weight="bold" />
              </div>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <p className="mt-2.5 text-[11px] italic text-ink/50 font-normal">
          Last Update: {activity.lastUpdate}
        </p>
      </div>

      {/* Instructions Card */}
      <div className="rounded-xl border border-ink/10 bg-cream p-4 shadow-sm">
        <p className="text-[11px] text-ink/50">Due: {activity.dueDate}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{activity.title}</p>
        <span className="mt-1 inline-block rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
          {activity.stars} Stars
        </span>

        <div className="mt-2.5 border-t border-ink/10 pt-2.5">
          <p className="text-xs font-semibold text-ink">Instructions:</p>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-xs text-ink/70 leading-normal">
            {activity.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <Link
          to={`/teacher/class-activities/phil-iri/view/${activity.id}`}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700"
        >
          <ArrowRight size={16} weight="bold" />
          Open Full Activity & Roster
        </Link>
        <button
          type="button"
          onClick={() => onDelete?.(activity.id)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 cursor-pointer"
        >
          <Trash size={15} />
          Delete Activity
        </button>
      </div>
    </div>
  );
}
