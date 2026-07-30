import { Icon } from '@iconify/react';
import ReadingLevelDonut from './ReadingLevelDonut.jsx';
import StatCard from './StatCard.jsx';

const CLASS_STATS = {
  readingLevels: { frustration: 5, instructional: 3, independent: 2 },
  averageAccuracy: 67,
  averageComprehension: 37,
  averageReadingSpeed: 87,
  priorityStudents: 5,
  lastUpdate: '05/06/2026',
};

export default function ClassProgressPanel() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Icon icon="ph:presentation-chart" className="size-6 text-brand-red" />
        <h3 className="text-base font-bold text-ink">Class Progress Dashboard</h3>
      </div>

      <ReadingLevelDonut counts={CLASS_STATS.readingLevels} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={CLASS_STATS.averageAccuracy}
          unit="wps"
          label={'Average\nAccuracy'}
          iconName="ph:target"
          iconBg="bg-[#DBEAFE] text-[#2563EB]"
        />
        <StatCard
          value={CLASS_STATS.priorityStudents}
          label={'Priority\nStudents'}
          variant="priority"
          action={<Icon icon="ph:arrow-circle-right" className="size-6 text-brand-red" />}
          iconName="ph:siren"
          iconBg="bg-[#FEE2E2] text-[#d53f24]"
        />
        <StatCard
          value={CLASS_STATS.averageReadingSpeed}
          unit="%"
          label={'Average\nReading Speed'}
          iconName="ph:lightning"
          iconBg="bg-[#FEF08A] text-[#CA8A04]"
        />
        <StatCard
          value={CLASS_STATS.averageComprehension}
          unit="%"
          label={'Average\nComprehension'}
          iconName="ph:lightbulb"
          iconBg="bg-[#D1FAE5] text-[#059669]"
        />
      </div>

      <p className="text-xs font-semibold text-ink/70">Last Update: {CLASS_STATS.lastUpdate}</p>
    </div>
  );
}
