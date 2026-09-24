import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ChartLineUp, Prohibit, UserSwitch } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import StatCard from '../../../components/dashboard/progress/StatCard.jsx';
import AccuracyTrendChart from '../../../components/dashboard/progress/AccuracyTrendChart.jsx';
import AchievementActivityRow from '../../../components/dashboard/activity/AchievementActivityRow.jsx';
import BadgeCard from '../../../components/dashboard/student/BadgeCard.jsx';
import StoryRow from '../../../components/dashboard/student/StoryRow.jsx';
import { StudentProfileSkeleton } from '../../../components/common/Skeleton.jsx';
import { getToken } from '../../../lib/auth.js';
import { decodeSecureToken } from '../../../lib/securityToken.js';

import { students as mockStudentsData } from '../../../data/students.js';
import { defaultBadges, defaultStories } from '../../../data/studentAchievements.js';

const LEVEL_BADGE = {
  Frustrational: 'bg-[#FEE2E2] text-[#B91C1C] font-bold border border-[#B91C1C]/20',
  Instructional: 'bg-[#FEF08A] text-[#854D0E] font-bold border border-[#CA8A04]/20',
  Independent: 'bg-[#D1FAE5] text-[#047857] font-bold border border-[#047857]/20',
  Pending: 'bg-purple-100 text-purple-700 font-bold border border-purple-300',
  'Pending Evaluation': 'bg-purple-100 text-purple-700 font-bold border border-purple-300',
};

const ACHIEVEMENT_TABS = ['Activities', 'Badges', 'Stories'];

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
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Activities');
  const [dbStudent, setDbStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const targetLrn = lrn || rawLrn;
        const res = await fetch(getApiUrl(`/api/teacher/students/${targetLrn}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && data.student) {
          setDbStudent(data.student);
        }
      } catch (err) {
        console.warn('Fetch student details notice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [lrn, rawLrn]);

  const fallbackStudent = mockStudentsData.find((s) => s.lrn === lrn);
  const student = dbStudent || fallbackStudent || {
    name: `Student (${lrn})`,
    lrn: lrn,
    grade: 'Grade 4',
    section: 'Unassigned',
    level: 'Pending Evaluation',
  };

  // Map real database badges or default badge assets (only unlocked badges)
  const badges = (student.badges && student.badges.length > 0)
    ? student.badges.map((b) => {
        const found = defaultBadges.find(
          (db) => db.name.toLowerCase() === (b.badgeName || b.name || '').toLowerCase() ||
                  db.id === (b.id || b.badge_id)
        );
        return {
          id: b.id || b.badge_id || b.badgeName,
          name: b.badgeName || b.name,
          image: b.iconPath ? getApiUrl(b.iconPath) : (found?.image || defaultBadges[0]?.image),
          description: b.description || found?.description,
        };
      })
    : [];

  // Map real database completed stories
  const stories = (student.stories && student.stories.length > 0)
    ? student.stories.map((s) => ({
        id: s.id,
        title: s.title,
        color: s.color || 'blue',
      }))
    : [];

  // Map real database completed activities (Achievements only include finished work)
  const activities = (student.activities && student.activities.length > 0)
    ? student.activities
        .filter((act) => act.status === 'done')
        .map((act) => ({
          ...act,
          onAction: (a) => {
            if (a.attemptId) {
              navigate(`/teacher/class-activities/phil-iri/review/${a.attemptId}`);
            } else if (a.id) {
              navigate(`/teacher/class-activities/phil-iri/view/${a.id}`);
            }
          },
        }))
    : [];

  return (
    <div>
      {/* Top Back Navigation */}
      <div className="mb-4">
        <BackButton onClick={() => navigate(-1)} label="Back to Previous Page" size={20} />
      </div>

      {loading ? (
        <StudentProfileSkeleton />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-5">
          <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={96} className="text-2xl" />
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs font-semibold text-ink/70">Full name</p>
                <p className="text-xl font-bold text-ink">{student.name}</p>
              </div>
              <span className={`rounded-lg px-3 py-1 text-xs font-bold ${LEVEL_BADGE[student.level] || LEVEL_BADGE['Pending']}`}>
                {student.level || 'Pending Evaluation'}
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold text-ink/70">Grade Level</p>
                <p className="text-base font-bold text-ink">{student.grade || 'Grade 4'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">Section</p>
                <p className="text-base font-bold text-ink">{student.section || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">LRN</p>
                <p className="text-base font-bold text-ink">{student.lrn}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-2.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-blue-700"
        >
          <Icon icon="ph:article" className="size-5" />
          Generate report
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="flex items-center gap-2">
            <ChartLineUp size={16} className="text-ink" />
            <p className="text-sm font-medium text-ink">Accuracy Trend</p>
          </div>
          <div className="rounded-[10px] border border-ink/10 bg-cream p-3">
            <AccuracyTrendChart
              sessions={student.sessions && student.sessions.length > 0 ? student.sessions : ['S1']}
              accuracy={student.accuracyTrend && student.accuracyTrend.length > 0 ? student.accuracyTrend : [0]}
              comprehension={student.comprehensionTrend && student.comprehensionTrend.length > 0 ? student.comprehensionTrend : [0]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              value={student.avgAccuracy || 0}
              unit="%"
              label={'Average\nAccuracy'}
              iconName="ph:target"
              iconBg="bg-[#DBEAFE] text-[#2563EB]"
            />
            <StatCard
              value={student.avgComprehension || 0}
              unit="%"
              label={'Average\nComprehension'}
              iconName="ph:lightbulb"
              iconBg="bg-[#D1FAE5] text-[#059669]"
            />
            <StatCard
              value={student.avgWps || 0}
              unit=" WPS"
              label={'Average\nReading Speed'}
              iconName="ph:gauge"
              iconBg="bg-[#FEF3C7] text-[#D97706]"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Icon icon="ph:trophy" className="size-7 text-brand-red" />
            <h2 className="text-xl font-bold text-ink">Achievements</h2>
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
            <div key={activeTab} className="animate-fadeIn">
              {activeTab === 'Activities' && (
                activities.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {activities.map((activity) => (
                      <AchievementActivityRow key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-ink/10 bg-cream">
                    <Icon icon="ph:article" className="mb-2 size-9 text-ink/30" />
                    <p className="text-base font-bold text-ink/70">No completed activities yet.</p>
                    <p className="text-xs text-ink/50 mt-1">Activities completed by this student will appear here.</p>
                  </div>
                )
              )}

              {activeTab === 'Badges' &&
                (badges.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {badges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon icon="ph:medal" className="mb-2 size-9 text-ink/30" />
                    <p className="text-base font-bold text-ink/70">Nothing here yet.</p>
                  </div>
                ))}

              {activeTab === 'Stories' &&
                (stories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {stories.map((story) => (
                      <StoryRow key={story.id} story={story} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon icon="ph:book-open-text" className="mb-2 size-9 text-ink/30" />
                    <p className="text-base font-bold text-ink/70">Nothing here yet.</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
