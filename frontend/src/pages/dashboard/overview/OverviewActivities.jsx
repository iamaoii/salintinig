import { Link } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import ActivityRow from '../../../components/dashboard/activity/ActivityRow.jsx';
import { activities } from '../../../data/activities.js';

export default function OverviewActivities() {
  return (
    <div className="relative flex flex-col gap-4 pb-20">
      {activities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}

      <Link
        to="/dashboard/class-activities/new"
        aria-label="Add activity"
        className="fixed bottom-8 right-8 z-50 flex size-12 items-center justify-center rounded-full bg-brand-red text-cream shadow-lg transition-transform hover:scale-105 hover:bg-[#b8331b] active:scale-95"
      >
        <Plus size={22} weight="bold" />
      </Link>
    </div>
  );
}
