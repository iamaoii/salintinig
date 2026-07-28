import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChartLineUp, Trophy } from '@phosphor-icons/react';
import BackButton from '../../components/BackButton.jsx';
import Avatar from '../../components/dashboard/Avatar.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import AccuracyTrendChart from '../../components/dashboard/AccuracyTrendChart.jsx';
import AchievementActivityRow from '../../components/dashboard/AchievementActivityRow.jsx';
import BadgeCard from '../../components/dashboard/BadgeCard.jsx';
import StoryRow from '../../components/dashboard/StoryRow.jsx';
import generateReportIcon from '../../assets/sd-icon-generate-report.svg';
import accuracyIcon from '../../assets/sd-icon-accuracy.svg';
import comprehensionIcon from '../../assets/sd-icon-comprehension.svg';
import readingSpeedIcon from '../../assets/sd-icon-readingspeed.svg';
import { students } from '../../data/students.js';
import { badgesByLrn, storiesByLrn } from '../../data/studentAchievements.js';

const LEVEL_BADGE = {
  Frustrational: 'bg-brand-red/10 text-brand-red',
  Instructional: 'bg-[#ffc300]/10 text-[#b38600]',
  Independent: 'bg-[#00a652]/10 text-[#00a652]',
};

const ACHIEVEMENT_TABS = ['Activities', 'Badges', 'Stories'];

const ACTIVITIES = [
  { id: 1, title: 'Activity name', status: 'not-done' },
  { id: 2, title: 'Activity name', status: 'done' },
];

const SESSIONS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const ACCURACY_TREND = [58, 65, 70, 76, 82, 87];
const COMPREHENSION_TREND = [20, 24, 28, 31, 34, 37];

const BADGE_COLUMNS = 5;

function withPlaceholders(items) {
  if (items.length === 0) return items;
  const remainder = items.length % BADGE_COLUMNS;
  const missing = remainder === 0 ? 0 : BADGE_COLUMNS - remainder;
  const placeholders = Array.from({ length: missing }, (_, i) => ({
    id: `placeholder-${i}`,
    placeholder: true,
  }));
  return [...items, ...placeholders];
}

export default function StudentProfile() {
  const { lrn } = useParams();
  const [activeTab, setActiveTab] = useState('Activities');
  const student = students.find((s) => s.lrn === lrn) ?? students[0];
  const badges = withPlaceholders(badgesByLrn[student.lrn] ?? []);
  const stories = storiesByLrn[student.lrn] ?? [];

  return (
    <div>
      <BackButton to="/dashboard/student-dashboard/all" size={20} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size={96} className="text-2xl" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs text-ink/50">Full name</p>
                <p className="text-lg font-medium text-ink">{student.name}</p>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${LEVEL_BADGE[student.level]}`}>
                {student.level}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-ink/50">Grade Level</p>
                <p className="text-sm font-medium text-ink">Grade 4</p>
              </div>
              <div>
                <p className="text-xs text-ink/50">Section</p>
                <p className="text-sm font-medium text-ink">Fyang</p>
              </div>
              <div>
                <p className="text-xs text-ink/50">LRN</p>
                <p className="text-sm font-medium text-ink">{student.lrn}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-ink/5 bg-brand-blue px-3 py-2 text-sm font-medium text-cream transition-colors hover:bg-blue-700"
        >
          <img src={generateReportIcon} alt="" className="h-4 w-4" />
          Generate report
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-3 xl:max-w-[440px]">
          <div className="flex items-center gap-2">
            <ChartLineUp size={16} className="text-ink" />
            <p className="text-sm font-medium text-ink">Accuracy Trend</p>
          </div>
          <div className="rounded-[10px] border border-ink/10 bg-cream p-3">
            <AccuracyTrendChart sessions={SESSIONS} accuracy={ACCURACY_TREND} comprehension={COMPREHENSION_TREND} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard value={87} unit="%" label={'Average\nAccuracy'} icon={accuracyIcon} />
            <StatCard value={37} unit="%" label={'Average\nComprehension'} icon={comprehensionIcon} />
            <StatCard value={67} unit="wps" label={'Average\nReading Speed'} icon={readingSpeedIcon} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-ink" />
            <h2 className="text-xl font-medium text-ink">Achievements</h2>
          </div>

          <div className="mt-4 flex items-center gap-2 border-b border-ink/10">
            {ACHIEVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'border-brand-red text-brand-red' : 'border-transparent text-ink hover:bg-ink/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === 'Activities' && (
              <div className="flex flex-col gap-3">
                {ACTIVITIES.map((activity) => (
                  <AchievementActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}

            {activeTab === 'Badges' &&
              (badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/40">Nothing here yet.</p>
              ))}

            {activeTab === 'Stories' &&
              (stories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {stories.map((story) => (
                    <StoryRow key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/40">Nothing here yet.</p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
