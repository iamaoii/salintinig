import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../../components/dashboard/layout/TopNav.jsx';
import { GraduationCap, X } from '@phosphor-icons/react';

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
