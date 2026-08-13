import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FlagPennant, Plus } from '@phosphor-icons/react';
import ActivityRow from '../../../components/dashboard/activity/ActivityRow.jsx';
import ActivityDetailPanel from '../../../components/dashboard/activity/ActivityDetailPanel.jsx';

import { philIriActivities, practiceActivities } from '../../../data/classActivities.js';

const TABS = [
  { key: 'phil-iri', to: '/teacher/class-activities/phil-iri', label: 'Phil-IRI Assessments', activities: philIriActivities },
  { key: 'practice', to: '/teacher/class-activities/practice', label: 'Practice Mode', activities: practiceActivities },
];

export default function ClassActivities() {
  const location = useLocation();
  const isPractice = location.pathname.includes('/practice');
  const activeTabKey = isPractice ? 'practice' : 'phil-iri';
  const currentTab = TABS.find((tab) => tab.key === activeTabKey) || TABS[0];
  const [selectedId, setSelectedId] = useState(null);

  const selectedActivity = currentTab.activities.find((a) => a.id === selectedId);

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col">
      <div className="flex items-center gap-3">
        <FlagPennant size={28} className="text-brand-red" />
        <h1 className="text-3xl font-bold text-ink">Activities</h1>
      </div>

      {/* Tabs with dedicated routes */}
      <div className="mt-4 flex items-center gap-4 border-b border-ink/10">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={({ isActive }) =>
              `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-ink hover:bg-ink/5'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4">
            {currentTab.activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                compact
                selected={activity.id === selectedActivity?.id}
                onClick={() => setSelectedId((prev) => (prev === activity.id ? null : activity.id))}
              />
            ))}
          </div>

          <Link
            to="/teacher/class-activities/new"
            aria-label="Add activity"
            className="fixed bottom-8 right-8 z-50 flex size-12 items-center justify-center rounded-full bg-brand-red text-cream shadow-lg transition-transform hover:scale-105 hover:bg-[#b8331b] active:scale-95"
          >
            <Plus size={22} weight="bold" />
          </Link>
        </div>

        <div className="w-full xl:w-[380px] xl:shrink-0 xl:border-l xl:border-ink/10 xl:pl-8">
          {selectedActivity && <ActivityDetailPanel activity={selectedActivity} />}
        </div>
      </div>
    </div>
  );
}
