import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '@phosphor-icons/react';
import ActivityRow from '../../components/dashboard/ActivityRow.jsx';
import ActivityDetailPanel from '../../components/dashboard/ActivityDetailPanel.jsx';
import addButtonIcon from '../../assets/activity-add-button.svg';
import { philIriActivities, practiceActivities } from '../../data/classActivities.js';

const TABS = [
  { key: 'phil-iri', label: 'Phil -IRI Assessments', activities: philIriActivities },
  { key: 'practice', label: 'Practice Mode', activities: practiceActivities },
];

export default function ClassActivities() {
  const [activeTab, setActiveTab] = useState('phil-iri');
  const currentTab = TABS.find((tab) => tab.key === activeTab);
  const [selectedId, setSelectedId] = useState(currentTab.activities[0]?.id);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const nextTab = TABS.find((tab) => tab.key === key);
    setSelectedId(nextTab.activities[0]?.id);
  };

  const selectedActivity = currentTab.activities.find((a) => a.id === selectedId) ?? currentTab.activities[0];

  return (
    <div>
      <div className="flex items-center gap-2">
        <Flag size={22} weight="fill" className="text-brand-red" />
        <h1 className="text-2xl font-medium text-ink">Activities</h1>
      </div>

      <div className="mt-4 flex items-center gap-4 border-b border-ink/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-ink hover:bg-ink/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4">
            {currentTab.activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                compact
                selected={activity.id === selectedActivity?.id}
                onClick={() => setSelectedId(activity.id)}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Link to="/dashboard/class-activities/new" aria-label="Add activity">
              <img src={addButtonIcon} alt="" className="size-[42px]" />
            </Link>
          </div>
        </div>

        {selectedActivity && (
          <div className="w-full xl:max-w-[380px] xl:shrink-0">
            <ActivityDetailPanel activity={selectedActivity} />
          </div>
        )}
      </div>
    </div>
  );
}
