import { Bell } from '@phosphor-icons/react';
import ClassCard from './ClassCard.jsx';
import { notifications } from '../../data/notifications.js';

export default function Sidebar() {
  return (
    <aside className="flex w-full flex-col gap-4 lg:max-w-[400px] lg:shrink-0">
      <ClassCard />

      <div className="rounded-2xl border border-ink/5 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={20} />
          <h3 className="font-semibold text-ink">Notification</h3>
        </div>
        <div className="flex flex-col divide-y divide-ink/10">
          {notifications.map((n) => (
            <div key={n.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-ink">{n.title}</p>
              <p className="mt-1 text-xs text-ink/40">{n.time}</p>
              <p className="mt-1 text-sm text-ink/60">{n.description}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
