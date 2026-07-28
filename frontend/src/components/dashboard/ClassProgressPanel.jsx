import ReadingLevelDonut from './ReadingLevelDonut.jsx';
import StatCard from './StatCard.jsx';
import headerIcon from '../../assets/sd-icon-classprogress-header.svg';
import accuracyIcon from '../../assets/sd-icon-accuracy.svg';
import comprehensionIcon from '../../assets/sd-icon-comprehension.svg';
import readingSpeedIcon from '../../assets/sd-icon-readingspeed.svg';
import priorityIcon from '../../assets/sd-icon-priority.svg';
import priorityBellIcon from '../../assets/sd-icon-priority-bell.svg';

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
        <img src={headerIcon} alt="" className="h-5 w-[19px]" />
        <h3 className="text-base font-semibold text-black">Class Progress Dashboard</h3>
      </div>

      <ReadingLevelDonut counts={CLASS_STATS.readingLevels} />

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard value={CLASS_STATS.averageAccuracy} unit="wps" label={'Average\nAccuracy'} icon={accuracyIcon} />
        <StatCard
          value={CLASS_STATS.priorityStudents}
          label={'Priority\nStudents'}
          icon={priorityIcon}
          variant="priority"
          action={
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full">
              <img src={priorityBellIcon} alt="" className="size-5" />
            </span>
          }
        />
        <StatCard
          value={CLASS_STATS.averageReadingSpeed}
          unit="%"
          label={'Average\nReading Speed'}
          icon={readingSpeedIcon}
        />
        <StatCard
          value={CLASS_STATS.averageComprehension}
          unit="%"
          label={'Average\nComprehension'}
          icon={comprehensionIcon}
        />
      </div>

      <p className="text-[9px] italic text-ink/50">Last Update: {CLASS_STATS.lastUpdate}</p>
    </div>
  );
}
