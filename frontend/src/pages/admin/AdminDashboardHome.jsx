import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Student,
  ChalkboardTeacher,
  Users,
  GridFour,
  GraduationCap,
  CloudArrowUp,
  UserPlus,
  ShieldWarning,
  ArrowRight,
  Clock,
  CheckCircle,
  FileCsv,
  SquaresFour,
} from '@phosphor-icons/react';
import { adminStats, recentActivities } from '../../data/adminData.js';

export default function AdminDashboardHome() {
  const navigate = useNavigate();
  const [activities] = useState(recentActivities);

  const STAT_CARDS = [
    {
      title: 'Total Students',
      value: adminStats.totalStudents.toLocaleString(),
      subtitle: 'Grades 4 - 6',
      icon: Student,
      link: '/admin/students',
      bgIcon: 'bg-brand-blue/10 text-brand-blue',
    },
    {
      title: 'Total Teachers',
      value: adminStats.totalTeachers.toLocaleString(),
      subtitle: 'Faculty members',
      icon: ChalkboardTeacher,
      link: '/admin/teachers',
      bgIcon: 'bg-brand-red/10 text-brand-red',
    },
    {
      title: 'Parent Accounts',
      value: adminStats.totalParentAccounts.toLocaleString(),
      subtitle: 'Registered portals',
      icon: Users,
      link: '/admin/students',
      bgIcon: 'bg-green-100 text-green-700',
    },
    {
      title: 'Total Sections',
      value: adminStats.totalSections.toLocaleString(),
      subtitle: 'S.Y. 2026-2027',
      icon: GridFour,
      link: '/admin/faculty-assignment',
      bgIcon: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Grade Levels',
      value: adminStats.totalGradeLevels,
      subtitle: 'Grade 4 - Grade 6',
      icon: GraduationCap,
      link: '/admin/faculty-assignment',
      bgIcon: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SquaresFour size={24} className="text-brand-red" />
            <h1 className="text-2xl font-bold text-ink">Overview</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            System metrics, student enrollment, and administrative action logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-[0px_2px_4px_rgba(0,0,0,0.04)] hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <FileCsv size={16} className="text-brand-blue" />
            <span>Upload Student CSV</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/faculty-assignment')}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Assign Faculty</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards - Single Horizontal Line (grid-cols-5) without badges */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-2.5">System Summary</h2>
        <div className="grid grid-cols-5 gap-2.5 w-full overflow-x-auto">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.link)}
                className="group relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-cream p-3 shadow-[0px_4px_8px_0px_rgba(26,24,22,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer min-w-0"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xl font-black text-ink leading-none tracking-tight">
                    {card.value}
                  </p>
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${card.bgIcon}`}>
                    <Icon size={14} weight="bold" />
                  </div>
                </div>

                <div className="mt-2.5">
                  <p className="text-xs font-bold text-ink truncate">{card.title}</p>
                  <p className="text-[11px] text-ink/50 truncate mt-0.5">{card.subtitle}</p>
                </div>

                <div className="mt-2.5 flex items-center justify-end border-t border-ink/5 pt-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue group-hover:underline shrink-0">
                    <span>Manage</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities Section matching Teacher side card container */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div>
            <h2 className="text-sm font-bold text-ink">Recent Activities</h2>
            <p className="text-xs text-ink/50">Audit log of record uploads and administrative actions</p>
          </div>
          <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold text-brand-blue">
            Real-time Log
          </span>
        </div>

        <div className="mt-2 divide-y divide-ink/10">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start justify-between py-1.5 first:pt-0 last:pb-0 hover:bg-ink/[0.02] rounded-xl px-2 transition-colors">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/70">
                  {act.type === 'upload' && <CloudArrowUp size={12} weight="bold" />}
                  {act.type === 'assignment' && <UserPlus size={12} weight="bold" />}
                  {act.type === 'user' && <CheckCircle size={12} weight="bold" />}
                  {act.type === 'security' && <ShieldWarning size={12} weight="bold" />}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[10px] font-bold text-ink">{act.title}</h4>
                    <span className="rounded bg-ink/5 px-1 py-0.2 text-[8px] font-bold text-ink/70">
                      {act.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-ink/60 leading-tight">{act.details}</p>
                  <span className="text-[9px] text-ink/40 block">By {act.user}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] text-ink/40 whitespace-nowrap">
                <Clock size={11} />
                <span>{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
