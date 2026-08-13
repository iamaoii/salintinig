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

        // 2. Fetch students in this section
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          const sectionStudents = data.students.filter((s) => {
            if (!targetSection || targetSection.toLowerCase().includes('unassigned')) return false;
            const sSec = (s.section || '').toLowerCase().trim();
            const targetSec = targetSection.toLowerCase().trim();
            const targetSecNameOnly = targetSec.replace(/^grade\s*\d+\s*-\s*/i, '').trim();
            return sSec === targetSec || sSec === targetSecNameOnly || (sSec.length > 0 && targetSec.includes(sSec));
          });

          // Calculate reading levels distribution
          let frustration = 0;
          let instructional = 0;
          let independent = 0;
          let totalAccuracy = 0;
          let totalSpeed = 0;
          let totalComp = 0;
          let assessedCount = 0;

          sectionStudents.forEach((st) => {
            const lvl = (st.level || st.readingLevel || st.gstResult || '').toLowerCase();
            if (lvl.includes('frustrat')) frustration++;
            else if (lvl.includes('instruct')) instructional++;
            else if (lvl.includes('independ')) independent++;

            if (st.oralAccuracy || st.comprehensionScore || st.readingSpeed) {
              assessedCount++;
              totalAccuracy += Number(st.oralAccuracy || 85);
              totalSpeed += Number(st.readingSpeed || 65);
              totalComp += Number(st.comprehensionScore || 75);
            }
          });

          const avgAcc = assessedCount > 0 ? Math.round(totalAccuracy / assessedCount) : 0;
          const avgSpd = assessedCount > 0 ? Math.round(totalSpeed / assessedCount) : 0;
          const avgCmp = assessedCount > 0 ? Math.round(totalComp / assessedCount) : 0;

          const today = new Date();
          const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

          setStats({
            readingLevels: { frustration, instructional, independent },
            averageAccuracy: avgAcc,
            averageReadingSpeed: avgSpd,
            averageComprehension: avgCmp,
            priorityStudents: frustration,
            lastUpdate: assessedCount > 0 ? dateStr : 'No assessments yet',
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

      <p className="text-xs font-semibold text-ink/70">Last Update: {stats.lastUpdate}</p>
    </div>
  );
}
