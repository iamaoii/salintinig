import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ChartLineUp, Clock, Prohibit, UserSwitch, CaretLeft, CaretRight } from '@phosphor-icons/react';
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
  Frustration: 'bg-[#FEE2E2] text-[#B91C1C] font-bold border border-[#B91C1C]/20',
  Frustrational: 'bg-[#FEE2E2] text-[#B91C1C] font-bold border border-[#B91C1C]/20',
  Instruction: 'bg-[#FEF08A] text-[#854D0E] font-bold border border-[#CA8A04]/20',
  Instructional: 'bg-[#FEF08A] text-[#854D0E] font-bold border border-[#CA8A04]/20',
  Independent: 'bg-[#D1FAE5] text-[#047857] font-bold border border-[#047857]/20',
  Pending: 'bg-slate-100 text-slate-700 font-bold border border-slate-300',
  'Pending Evaluation': 'bg-slate-100 text-slate-700 font-bold border border-slate-300',
};

const ACHIEVEMENT_TABS = ['Phil-IRI Records', 'Badges', 'Stories'];

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

import { cacheService } from '../../../services/cacheService.js';

export default function StudentProfile() {
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Phil-IRI Records');
  
  const cacheKey = `student_profile_${lrn || rawLrn}`;
  const cachedData = cacheService.get(cacheKey);

  const [dbStudent, setDbStudent] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    let isMounted = true;
    const fetchStudent = async () => {
      try {
        const token = getToken();
        const targetLrn = lrn || rawLrn;
        if (!cachedData) setLoading(true);

        const res = await fetch(getApiUrl(`/api/teacher/students/${targetLrn}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success && data.student) {
          setDbStudent(data.student);
          cacheService.set(cacheKey, data.student, 120000); // 2 minutes TTL
        }
      } catch (err) {
        console.warn('Fetch student details notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudent();
    return () => { isMounted = false; };
  }, [lrn, rawLrn, cacheKey]);

  const student = dbStudent || {
    name: loading ? 'Loading profile...' : `Student (${lrn || ''})`,
    lrn: lrn || '',
    grade: '',
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

  const activities = (student.activities && student.activities.length > 0)
    ? student.activities
        .filter((act) => act.status === 'done' || act.status === 'completed' || act.status === 'finished')
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

  const [recordsPage, setRecordsPage] = useState(1);
  const [storiesPage, setStoriesPage] = useState(1);
  const [badgesPage, setBadgesPage] = useState(1);

  const RECORDS_PAGE_SIZE = 5;
  const STORIES_PAGE_SIZE = 10;
  const BADGES_PAGE_SIZE = 10;

  const totalRecordsPages = Math.ceil(activities.length / RECORDS_PAGE_SIZE) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (recordsPage - 1) * RECORDS_PAGE_SIZE;
    return activities.slice(start, start + RECORDS_PAGE_SIZE);
  }, [activities, recordsPage]);

  const totalStoriesPages = Math.ceil(stories.length / STORIES_PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (storiesPage - 1) * STORIES_PAGE_SIZE;
    return stories.slice(start, start + STORIES_PAGE_SIZE);
  }, [stories, storiesPage]);

  const totalBadgesPages = Math.ceil(badges.length / BADGES_PAGE_SIZE) || 1;
  const paginatedBadges = useMemo(() => {
    const start = (badgesPage - 1) * BADGES_PAGE_SIZE;
    return badges.slice(start, start + BADGES_PAGE_SIZE);
  }, [badges, badgesPage]);

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
            <h2 className="text-xl font-bold text-ink">Phil-IRI Records & Student Progress</h2>
          </div>

          <div className="mt-4 flex items-center gap-2 border-b border-ink/10">
            {ACHIEVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab ? 'border-brand-red text-brand-red font-bold' : 'border-transparent text-ink/70 hover:bg-ink/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div key={activeTab} className="animate-fadeIn">
              {activeTab === 'Phil-IRI Records' && (
                <div>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {paginatedActivities.map((activity) => (
                          <AchievementActivityRow key={activity.id} activity={activity} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(recordsPage - 1) * RECORDS_PAGE_SIZE + 1} to {Math.min(recordsPage * RECORDS_PAGE_SIZE, activities.length)} of {activities.length} records
                        </span>
                        {totalRecordsPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={recordsPage === 1}
                              onClick={() => setRecordsPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalRecordsPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setRecordsPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    recordsPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={recordsPage === totalRecordsPages}
                              onClick={() => setRecordsPage((p) => Math.min(p + 1, totalRecordsPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Clock size={32} className="text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Assessment Records Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not taken any Phil-IRI reading assessment tests yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Badges' && (
                <div>
                  {badges.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedBadges.map((badge, idx) => (
                          <BadgeCard key={badge.id ?? idx} badge={badge} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(badgesPage - 1) * BADGES_PAGE_SIZE + 1} to {Math.min(badgesPage * BADGES_PAGE_SIZE, badges.length)} of {badges.length} badges
                        </span>
                        {totalBadgesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={badgesPage === 1}
                              onClick={() => setBadgesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalBadgesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setBadgesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    badgesPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={badgesPage === totalBadgesPages}
                              onClick={() => setBadgesPage((p) => Math.min(p + 1, totalBadgesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:medal-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Badges Unlocked Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not unlocked any achievement badges yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Stories' && (
                <div>
                  {stories.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedStories.map((story) => (
                          <StoryRow key={story.id} story={story} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(storiesPage - 1) * STORIES_PAGE_SIZE + 1} to {Math.min(storiesPage * STORIES_PAGE_SIZE, stories.length)} of {stories.length} stories
                        </span>
                        {totalStoriesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={storiesPage === 1}
                              onClick={() => setStoriesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalStoriesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setStoriesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    storiesPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={storiesPage === totalStoriesPages}
                              onClick={() => setStoriesPage((p) => Math.min(p + 1, totalStoriesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:book-open-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Completed Stories Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not completed any reading stories yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
