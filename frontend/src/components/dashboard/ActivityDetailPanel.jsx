import { Link } from 'react-router-dom';
import { Clock, CheckCircle, CircleDashed, ArrowRight, PencilSimple, Trash } from '@phosphor-icons/react';

export default function ActivityDetailPanel({ activity }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-[10px] border border-ink/10 bg-cream p-4">
        <div className="mb-3 flex items-center gap-2 text-ink/50">
          <Clock size={16} />
          <p className="text-sm">{activity.title}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-medium leading-none text-ink">{activity.done + activity.pending}</p>
            <p className="mt-1 text-xs text-ink/50">Total Students</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none text-ink">{activity.done}</p>
                <p className="text-xs text-ink/50">Done</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDashed size={16} className="text-ink/40" />
              <div>
                <p className="text-sm font-medium leading-none text-ink">{activity.pending}</p>
                <p className="text-xs text-ink/50">Not Done</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-[10px] border border-ink/10 p-3">
            <div>
              <p className="text-xl font-medium leading-none text-ink">{activity.studentsUnder14Gst}</p>
              <p className="mt-1 text-xs text-ink/50">Student under 14 GST</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-brand-red" />
          </div>
          <div className="flex items-center justify-between rounded-[10px] border border-ink/10 p-3">
            <div>
              <p className="text-xl font-medium leading-none text-ink">{activity.studentsAbove14Gst}</p>
              <p className="mt-1 text-xs text-ink/50">Student above 14 GST</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-brand-red" />
          </div>
        </div>

        <p className="mt-3 text-[10px] italic text-ink/40">Last Update: {activity.lastUpdate}</p>
      </div>

      <div className="rounded-[10px] border border-ink/10 bg-cream p-4">
        <p className="text-xs text-ink/50">Due: {activity.dueDate}</p>
        <p className="mt-1 text-base font-semibold text-ink">{activity.title}</p>
        <span className="mt-2 inline-block rounded-full bg-green-600/10 px-2.5 py-1 text-xs font-medium text-green-700">
          {activity.stars} Stars
        </span>

        <div className="mt-3 border-t border-ink/10 pt-3">
          <p className="text-sm font-semibold text-ink">Instructions:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink/70">
            {activity.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to={`/dashboard/class-activities/${activity.id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-brand-blue px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
        >
          <PencilSimple size={16} />
          Edit Activity
        </Link>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-brand-red px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-red-700"
        >
          <Trash size={16} />
          Delete Activity
        </button>
      </div>
    </div>
  );
}
