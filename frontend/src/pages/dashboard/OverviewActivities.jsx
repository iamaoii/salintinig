import ActivityRow from '../../components/dashboard/ActivityRow.jsx';
import addButtonIcon from '../../assets/activity-add-button.svg';
import { activities } from '../../data/activities.js';

export default function OverviewActivities() {
  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}

      <div className="flex w-full items-center justify-end p-4">
        <button type="button" aria-label="Add activity" className="block">
          <img src={addButtonIcon} alt="" className="size-[42px]" />
        </button>
      </div>
    </div>
  );
}
