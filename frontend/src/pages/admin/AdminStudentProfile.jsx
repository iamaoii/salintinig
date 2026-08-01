import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import {
  Student,
  EnvelopeSimple,
  Key,
  ShieldCheck,
  CheckCircle,
  Pencil,
  Prohibit,
  UserSwitch,
  Clock,
  Article,
  GraduationCap,
  IdentificationCard,
  ChartLineUp,
  X,
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import StatCard from '../../components/dashboard/progress/StatCard.jsx';
import AccuracyTrendChart from '../../components/dashboard/progress/AccuracyTrendChart.jsx';
import AchievementActivityRow from '../../components/dashboard/activity/AchievementActivityRow.jsx';
import BadgeCard from '../../components/dashboard/student/BadgeCard.jsx';
import StoryRow from '../../components/dashboard/student/StoryRow.jsx';

import { students } from '../../data/students.js';
import { initialAdminStudents } from '../../data/adminData.js';
import { badgesByLrn, storiesByLrn } from '../../data/studentAchievements.js';

const LEVEL_BADGE = {
  Frustrational: 'bg-[#FEE2E2] text-[#B91C1C] font-bold border border-[#B91C1C]/20',
  Instructional: 'bg-[#FEF08A] text-[#854D0E] font-bold border border-[#CA8A04]/20',
  Independent: 'bg-[#D1FAE5] text-[#047857] font-bold border border-[#047857]/20',
  Screening: 'bg-blue-100 text-blue-800 font-bold border border-blue-200',
};

const ACHIEVEMENT_TABS = ['Phil-IRI Records', 'Activities', 'Badges', 'Stories'];

const ACTIVITIES = [
  { id: 1, title: 'Oral Reading Screening Test', status: 'done', type: 'PhilIRI' },
  { id: 2, title: 'Comprehension Activity - Ang Pinagmulan ng Marikina', status: 'done', type: 'Practice' },
  { id: 3, title: 'Silent Reading Passage - Form 1B', status: 'not-done', type: 'PhilIRI' },
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

export default function AdminStudentProfile() {
  const { lrn } = useParams();
  const navigate = useNavigate();
  const [adminStudents, setAdminStudents] = useState(initialAdminStudents);
  const [achievementTab, setAchievementTab] = useState('Phil-IRI Records');
  const [toastMessage, setToastMessage] = useState(null);

  const std = adminStudents.find((s) => s.lrn === lrn || s.id === lrn) ?? {
    id: 'STD-1001',
    lrn: lrn || '10928374801',
    name: 'Adrian Matthew Cruz',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Instructional',
    personalEmail: 'adrian.cruz@gmail.com',
    status: 'Account Created',
    generatedPassword: 'ST-x8k9a2',
  };

  const studentObj = students.find((s) => s.lrn === std.lrn) ?? students[0];
  const rawBadges = (badgesByLrn[std.lrn] && badgesByLrn[std.lrn].length > 0)
    ? badgesByLrn[std.lrn]
    : (badgesByLrn['136670100091'] || []);
  const badges = withPlaceholders(rawBadges);

  const stories = (storiesByLrn[std.lrn] && storiesByLrn[std.lrn].length > 0)
    ? storiesByLrn[std.lrn]
    : (storiesByLrn['136670100091'] || [
        { id: 1, title: 'The Lost Kite', color: 'blue' },
        { id: 2, title: 'Adventures in the Forest', color: 'green' },
        { id: 3, title: 'The Brave Little Turtle', color: 'yellow' },
      ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = () => {
    const newStatus = std.status === 'Disabled' ? 'Account Created' : 'Disabled';
    setAdminStudents((prev) =>
      prev.map((s) => (s.lrn === std.lrn ? { ...s, status: newStatus } : s))
    );
    showToast(`Account for ${std.name} set to ${newStatus === 'Disabled' ? 'Disabled' : 'Active'}.`);
  };

  const handleResetPassword = () => {
    const newPass = `ST-${Math.random().toString(36).slice(-6)}`;
    showToast(`Password reset! New credentials emailed to ${std.personalEmail}.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#00a652] px-4 py-3 text-xs font-semibold text-white shadow-lg animate-in fade-in">
          <CheckCircle size={18} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Back Navigation */}
      <button
        type="button"
        onClick={() => navigate('/admin/students')}
        className="group inline-flex items-center gap-2.5 text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
      >
        <BackButton to="/admin/students" size={20} />
        <span className="group-hover:underline">Back to Student Records</span>
      </button>

      {/* Profile Header Banner with Clean Action Buttons */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar name={std.name} size={88} className="text-2xl font-bold shrink-0" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-ink">{std.name}</h1>
                <span className={`rounded-lg px-2.5 py-0.5 text-xs ${LEVEL_BADGE[std.level || 'Instructional']}`}>
                  {std.level || 'Instructional'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    std.status === 'Disabled' ? 'bg-brand-red/10 text-brand-red' : 'bg-[#00a652]/15 text-[#00a652]'
                  }`}
                >
                  {std.status === 'Disabled' ? 'Disabled' : 'Active Account'}
                </span>
              </div>

              <p className="text-xs font-mono text-ink/60">LRN: {std.lrn}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div>
                  <span className="text-ink/50">Grade & Section: </span>
                  <span className="font-bold text-ink">{std.grade} - {std.section}</span>
                </div>
                <div>
                  <span className="text-ink/50">Email: </span>
                  <span className="font-semibold text-brand-blue">{std.personalEmail}</span>
                </div>
                <div>
                  <span className="text-ink/50">Gender: </span>
                  <span className="font-semibold text-ink">{std.gender}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-ink/10">
            <button
              type="button"
              onClick={handleResetPassword}
              className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
            >
              <Key size={16} />
              <span>Reset Password</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                std.status === 'Disabled'
                  ? 'border border-[#00a652]/30 bg-[#00a652]/10 text-[#00a652] hover:bg-[#00a652] hover:text-white'
                  : 'border border-brand-red/30 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white'
              }`}
            >
              {std.status === 'Disabled' ? <UserSwitch size={16} /> : <Prohibit size={16} />}
              <span>{std.status === 'Disabled' ? 'Activate Account' : 'Disable Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Left Accuracy Chart, Right Phil-IRI Records & Student Progress */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left Column: Accuracy Trend & Stat Cards */}
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="flex items-center gap-2">
            <ChartLineUp size={16} className="text-ink" />
            <p className="text-sm font-medium text-ink">Accuracy Trend</p>
          </div>
          <div className="rounded-[10px] border border-ink/10 bg-cream p-3 shadow-xs">
            <AccuracyTrendChart sessions={SESSIONS} accuracy={ACCURACY_TREND} comprehension={COMPREHENSION_TREND} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              value={87}
              unit="%"
              label={'Average\nAccuracy'}
              iconName="ph:target"
              iconBg="bg-[#DBEAFE] text-[#2563EB]"
            />
            <StatCard
              value={37}
              unit="%"
              label={'Average\nComprehension'}
              iconName="ph:lightbulb"
              iconBg="bg-[#D1FAE5] text-[#059669]"
            />
            <StatCard
              value={67}
              unit="wps"
              label={'Average\nReading Speed'}
              iconName="ph:lightning"
              iconBg="bg-[#FEF08A] text-[#CA8A04]"
            />
          </div>
        </div>

        {/* Right Column: Phil-IRI Records & Student Progress (Unified Tabs) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Icon icon="ph:trophy" className="size-7 text-brand-red" />
            <h2 className="text-xl font-bold text-ink">Phil-IRI Records & Student Progress</h2>
          </div>

          <div className="mt-4 flex items-center gap-2 border-b border-ink/10">
            {ACHIEVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAchievementTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  achievementTab === tab ? 'border-brand-red text-brand-red font-bold' : 'border-transparent text-ink/70 hover:bg-ink/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div key={achievementTab} className="animate-fadeIn">
              {achievementTab === 'Phil-IRI Records' && (
                <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="text-ink/70">
                          <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Form Name</th>
                          <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Score & Details</th>
                          <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Level</th>
                          <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, form: 'Form 1A (Oral Reading)', score: '14/15 Oral • 87% Accuracy', level: 'Instructional', date: 'Jul 25, 2026' },
                          { id: 2, form: 'Form 1B (Comprehension)', score: '7/8 Correct Answers', level: 'Independent', date: 'Jul 20, 2026' },
                          { id: 3, form: 'Form 2 (Group Screening Test)', score: '14/20 Passed GST', level: 'Screened', date: 'Jun 15, 2026' },
                        ].map((item) => (
                          <tr key={item.id} className="hover:bg-ink/[0.02] transition-colors">
                            <td className="border border-ink/10 p-2.5 font-bold text-ink">{item.form}</td>
                            <td className="border border-ink/10 p-2.5 text-ink/70">{item.score}</td>
                            <td className="border border-ink/10 p-2.5">
                              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                                {item.level}
                              </span>
                            </td>
                            <td className="border border-ink/10 p-2.5 text-right text-ink/50">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {achievementTab === 'Activities' && (
                <div className="flex flex-col gap-3">
                  {ACTIVITIES.map((activity) => (
                    <AchievementActivityRow key={activity.id} activity={activity} />
                  ))}
                </div>
              )}

              {achievementTab === 'Badges' && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {badges.map((badge, idx) => (
                    <BadgeCard key={badge.id ?? idx} badge={badge} />
                  ))}
                </div>
              )}

              {achievementTab === 'Stories' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {stories.map((story) => (
                    <StoryRow key={story.id} story={story} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
