import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../../components/dashboard/layout/TopNav.jsx';
import { GraduationCap, X } from '@phosphor-icons/react';
import { getToken } from '../../lib/auth.js';
import { getApiUrl } from '../../config/api.js';
import { cacheService } from '../../services/cacheService.js';

function GradeLevelBanner({ isActive, gradeLevel, onExit }) {
  if (!isActive) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-brand-blue px-6 py-2.5 text-cream shadow-md">
      <div className="flex items-center gap-2.5 text-xs font-semibold">
        <GraduationCap size={18} weight="bold" className="shrink-0" />
        <span>
          Grade Level Mode:{' '}
          <strong className="font-bold">
            {gradeLevel ? `${gradeLevel} — All Sections` : 'All Sections'}
          </strong>
        </span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer shrink-0"
      >
        <X size={12} weight="bold" />
        Exit Mode
      </button>
    </div>
  );
}

export default function DashboardLayout() {
  const [isGradeLevelMode, setIsGradeLevelMode] = useState(false);
  const [ficGradeLevel, setFicGradeLevel] = useState(null);

  useEffect(() => {
    const prefetchTeacherData = async () => {
      const token = getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        if (!cacheService.get('teacher_assessments')) {
          fetch(getApiUrl('/api/assessments'), { headers })
            .then((r) => r.json())
            .then((d) => d.success && Array.isArray(d.assessments) && cacheService.set('teacher_assessments', d.assessments));
        }
        if (!cacheService.get('teacher_passages')) {
          fetch(getApiUrl('/api/passages'), { headers })
            .then((r) => r.json())
            .then((d) => d.success && Array.isArray(d.passages) && cacheService.set('teacher_passages', d.passages));
        }
        if (!cacheService.get('teacher_phil_iri_activities')) {
          fetch(getApiUrl('/api/teacher/assessments/phil-iri-activities'), { headers })
            .then((r) => r.json())
            .then((d) => d.success && Array.isArray(d.activities) && cacheService.set('teacher_phil_iri_activities', d.activities));
        }
        if (!cacheService.get('teacher_overview_students')) {
          fetch(getApiUrl('/api/teacher/class-students'), { headers })
            .then((r) => r.json())
            .then((d) => d.success && Array.isArray(d.students) && cacheService.set('teacher_overview_students', d.students));
        }
        if (!cacheService.get('teacher_sidebar_notifications')) {
          fetch(getApiUrl('/api/notifications'), { headers })
            .then((r) => r.json())
            .then((d) => d.success && Array.isArray(d.notifications) && cacheService.set('teacher_sidebar_notifications', d.notifications));
        }
      } catch (err) {
        // Silently ignore prefetch errors
      }
    };

    prefetchTeacherData();
  }, []);

  useEffect(() => {
    const onEnter = (e) => {
      setIsGradeLevelMode(true);
      if (e?.detail?.gradeLevel) setFicGradeLevel(e.detail.gradeLevel);
    };
    const onExit = () => setIsGradeLevelMode(false);

    window.addEventListener('enterGradeLevelMode', onEnter);
    window.addEventListener('exitGradeLevelMode', onExit);
    return () => {
      window.removeEventListener('enterGradeLevelMode', onEnter);
      window.removeEventListener('exitGradeLevelMode', onExit);
    };
  }, []);

  const handleExitMode = () => {
    setIsGradeLevelMode(false);
    window.dispatchEvent(new CustomEvent('exitGradeLevelMode'));
  };

  return (
    <div className="min-h-screen w-full bg-cream">
      <TopNav />
      <GradeLevelBanner
        isActive={isGradeLevelMode}
        gradeLevel={ficGradeLevel}
        onExit={handleExitMode}
      />
      <main className="mx-auto max-w-[1480px] px-6 py-8 sm:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
