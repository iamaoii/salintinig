import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ReadingLevelDonut from './ReadingLevelDonut.jsx';
import StatCard from './StatCard.jsx';
import { getToken, getUser } from '../../../lib/auth.js';

export default function ClassProgressPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    readingLevels: { frustration: 0, instructional: 0, independent: 0 },
    averageAccuracy: 0,
    averageComprehension: 0,
    averageReadingSpeed: 0,
    priorityStudents: 0,
    lastUpdate: 'No assessments yet',
  });

  useEffect(() => {
    async function fetchProgressStats() {
      try {
        setLoading(true);
        const token = getToken();

        // 1. Get teacher section name
        let targetSection = '';
        try {
          const meRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.user) {
            targetSection = meData.user.section || meData.user.assigned_section || '';
          }
        } catch (e) {}

        if (!targetSection) {
          const u = getUser();
          targetSection = u?.section || u?.assigned_section || '';
        }

        // 2. Fetch students in this section from teacher endpoint
        const res = await fetch('http://localhost:5000/api/teacher/class-students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          const targetList = data.students;

          // Calculate reading levels distribution & metrics
          let frustration = 0;
          let instructional = 0;
          let independent = 0;
          let totalAccuracy = 0;
          let accCount = 0;
          let totalSpeed = 0;
          let speedCount = 0;
          let totalComp = 0;
          let compCount = 0;

          targetList.forEach((st) => {
            const lvl = (st.level || st.readingLevel || st.reading_level || st.current_profile_label || st.gstResult || '').toLowerCase();
            if (lvl.includes('frustrat')) frustration++;
            else if (lvl.includes('instruct')) instructional++;
            else if (lvl.includes('independ')) independent++;

            const acc = Number(st.accuracy ?? st.oralAccuracy ?? st.oral_accuracy ?? 0);
            if (acc > 0) {
              totalAccuracy += acc;
              accCount++;
            }

            const spd = Number(st.readingSpeed ?? st.reading_speed_wpm ?? st.wps ?? 0);
            if (spd > 0) {
              totalSpeed += spd;
              speedCount++;
            }

            const comp = Number(st.comprehension ?? st.comprehensionScore ?? st.comprehension_score ?? 0);
            if (comp > 0) {
              totalComp += comp;
              compCount++;
            }
          });

          const avgAcc = accCount > 0 ? Math.round(totalAccuracy / accCount) : 0;
          const avgSpd = speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0;
          const avgCmp = compCount > 0 ? Math.round(totalComp / compCount) : 0;

          setStats({
            readingLevels: { frustration, instructional, independent },
            averageAccuracy: avgAcc,
            averageReadingSpeed: avgSpd,
            averageComprehension: avgCmp,
            priorityStudents: frustration,
          });
        }
        setLoading(false);
      } catch (err) {
        console.warn('Class progress stats fetch notice:', err);
        setLoading(false);
      }
    }
    fetchProgressStats();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Icon icon="ph:presentation-chart" className="size-6 text-brand-red" />
          <h3 className="text-base font-bold text-ink">Class Progress Dashboard</h3>
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl bg-ink/5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <Icon icon="ph:presentation-chart" className="size-6 text-brand-red" />
        <h3 className="text-base font-bold text-ink">Class Progress Dashboard</h3>
      </div>

      <ReadingLevelDonut counts={stats.readingLevels} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={stats.averageAccuracy}
          unit="%"
          label={'Average\nAccuracy'}
          iconName="ph:target"
          iconBg="bg-[#DBEAFE] text-[#2563EB]"
        />
        <StatCard
          value={stats.priorityStudents}
          label={'Priority\nStudents'}
          variant="priority"
          action={<Icon icon="ph:arrow-circle-right" className="size-6 text-brand-red" />}
          iconName="ph:siren"
          iconBg="bg-[#FEE2E2] text-[#d53f24]"
        />
        <StatCard
          value={stats.averageReadingSpeed}
          unit="wps"
          label={'Average\nReading Speed'}
          iconName="ph:lightning"
          iconBg="bg-[#FEF08A] text-[#CA8A04]"
        />
        <StatCard
          value={stats.averageComprehension}
          unit="%"
          label={'Average\nComprehension'}
          iconName="ph:lightbulb"
          iconBg="bg-[#D1FAE5] text-[#059669]"
        />
      </div>
    </div>
  );
}
