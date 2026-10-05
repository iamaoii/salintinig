import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
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
  CaretDown,
  CaretLeft,
  CaretRight,
  X,
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { StudentProfileSkeleton } from '../../components/common/Skeleton.jsx';
import { getToken } from '../../lib/auth.js';
import { decodeSecureToken } from '../../lib/securityToken.js';

import Avatar from '../../components/dashboard/student/Avatar.jsx';
import StatCard from '../../components/dashboard/progress/StatCard.jsx';
import AchievementActivityRow from '../../components/dashboard/activity/AchievementActivityRow.jsx';
import BadgeCard from '../../components/dashboard/student/BadgeCard.jsx';
import StoryRow from '../../components/dashboard/student/StoryRow.jsx';

import { badgesByLrn, storiesByLrn, defaultBadges, defaultStories } from '../../data/studentAchievements.js';

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

import { cacheService } from '../../services/cacheService.js';

export default function AdminStudentProfile() {
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const navigate = useNavigate();
  
  const cacheKey = `admin_student_profile_${lrn || rawLrn}`;
  const cachedData = cacheService.get(cacheKey);

  const [student, setStudent] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);
  const [achievementTab, setAchievementTab] = useState('Phil-IRI Records');
  const [profileLanguage, setProfileLanguage] = useState('fil');
  const [profilePeriod, setProfilePeriod] = useState('pre_test');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentDetail = async () => {
      try {
        const token = getToken();
        const targetId = lrn || rawLrn;
        if (!cachedData) setLoading(true);

        let res = await fetch(getApiUrl(`/api/admin/students/${targetId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        let data = await res.json();
        
        if (!res.ok && rawLrn && rawLrn !== targetId) {
          res = await fetch(getApiUrl(`/api/admin/students/${rawLrn}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          data = await res.json();
        }

        if (isMounted && res.ok && data.success && data.student) {
          setStudent(data.student);
          cacheService.set(cacheKey, data.student, 120000); // 2 min TTL
        }
      } catch (err) {
        console.warn('Failed to fetch student details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudentDetail();
    return () => { isMounted = false; };
  }, [lrn, rawLrn, cacheKey]);

  const std = student || {
    id: lrn || '',
    lrn: lrn || '',
    name: loading ? 'Loading student profile...' : 'Student Record Not Found',
    gender: 'N/A',
    grade: 'N/A',
    section: 'N/A',
    level: 'Pending Evaluation',
    personalEmail: 'N/A',
    status: 'N/A',
  };

  const rawBadges = (std.badges && std.badges.length > 0)
    ? std.badges.map((b) => {
        const found = defaultBadges.find(
          (db) => db.name?.toLowerCase() === (b.badgeName || b.name || '').toLowerCase() ||
                  db.id === (b.id || b.badge_id)
        );
        return {
          id: b.id || b.badge_id || b.badgeName,
          name: b.badgeName || b.name,
          image: found?.image || (b.iconPath ? getApiUrl(b.iconPath) : defaultBadges[0]?.image),
          description: b.description || found?.description,
        };
      })
    : [];
  const badges = rawBadges;

  const stories = (std.stories && std.stories.length > 0) ? std.stories : [];

  const allPhilIriRecords = (std.activities || [])
    .filter((act) => ['done', 'completed', 'finished'].includes(String(act.status || '').toLowerCase()))
    .map((act) => ({
      ...act,
      onAction: (a) => {
        if (a.attemptId) {
          navigate(`/admin/records/students/${rawLrn}/review/${a.attemptId}`);
        }
      },
    }));

  const formatGrade = (value) => {
    const grade = String(value || '').match(/\d+/)?.[0];
    return grade ? `Grade ${grade}` : '—';
  };
  const selectedAdaptiveProfile = (std.oralAdaptiveProfiles || []).find((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    return language === profileLanguage && String(profile.period || 'pre_test').toLowerCase() === profilePeriod;
  });
  const oralEvidence = allPhilIriRecords
    .filter((activity) => activity.assessmentType === 'oral'
      && (String(activity.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil') === profileLanguage
      && String(activity.assessmentPeriod || 'pre_test').toLowerCase() === profilePeriod)
    .sort((first, second) => new Date(first.completedAt || 0) - new Date(second.completedAt || 0));
  const evidenceAverage = (key) => oralEvidence.length
    ? Math.round(oralEvidence.reduce((total, activity) => total + Number(activity[key] || 0), 0) / oralEvidence.length)
    : 0;
  const diagnosticEvidence = [
    ['Independent', 'independent', selectedAdaptiveProfile?.independentLevel, 'bg-emerald-50 text-emerald-800'],
    ['Instructional', 'instructional', selectedAdaptiveProfile?.instructionalLevel, 'bg-amber-50 text-amber-900'],
    ['Frustrational', 'frustrational', selectedAdaptiveProfile?.frustrationalLevel, 'bg-rose-50 text-rose-800'],
  ].map(([label, key, level, style]) => {
    const grade = String(level || '').match(/\d+/)?.[0];
    const resultPrefix = key === 'frustrational' ? 'frustr' : key;
    const evidence = oralEvidence.find((activity) => grade
      && String(activity.passageGradeLevel || '').match(/\d+/)?.[0] === grade
      && String(activity.readingLevelResult || '').toLowerCase().startsWith(resultPrefix))
      || oralEvidence.find((activity) => String(activity.readingLevelResult || '').toLowerCase().startsWith(resultPrefix));
    return { label, level, style, evidence };
  });

  const [recordsPage, setRecordsPage] = useState(1);
  const [storiesPage, setStoriesPage] = useState(1);
  const [badgesPage, setBadgesPage] = useState(1);

  const RECORDS_PAGE_SIZE = 5;
  const STORIES_PAGE_SIZE = 10;
  const BADGES_PAGE_SIZE = 10;

  const totalRecordsPages = Math.ceil(allPhilIriRecords.length / RECORDS_PAGE_SIZE) || 1;
  const paginatedPhilIriRecords = useMemo(() => {
    const start = (recordsPage - 1) * RECORDS_PAGE_SIZE;
    return allPhilIriRecords.slice(start, start + RECORDS_PAGE_SIZE);
  }, [allPhilIriRecords, recordsPage]);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetPassword = async () => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/students/${std.lrn}/reset-password`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        const tempText = data.tempPassword ? ` Temporary password: ${data.tempPassword}` : '';
        const emailText = data.emailSent ? ` Emailed to ${std.personalEmail || 'student'}.` : ' Email not sent.';
        showToast(`Password reset.${emailText}${tempText}`);
      } else {
        showToast(data?.error || 'Failed to reset password.');
      }
    } catch (e) {
      showToast('Failed to reset password.');
    }
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">

      {/* Top Back Navigation */}
      <div className="inline-flex items-center gap-2.5">
        <BackButton to="/admin/students" size={20} />
      </div>

      {loading ? (
        <StudentProfileSkeleton />
      ) : (
        <>
          {/* Profile Header Banner with Clean Action Buttons */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar name={std.name} src={std.profileImage || std.profile_image || std.avatarUrl || std.avatar} size={88} className="text-2xl font-bold shrink-0" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-ink">{std.name}</h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      std.status === 'Active'
                        ? 'bg-[#00a652]/15 text-[#00a652] border-[#00a652]/30'
                        : std.status === 'Dropped'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : std.status === 'Transferred'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                    }`}
                  >
                    {std.status === 'Dropped' ? 'Dropped Out' : std.status === 'Transferred' ? 'Transferred Out' : std.status === 'Disabled' ? 'Account Disabled' : 'Active Account'}
                  </span>
                </div>

                <p className="text-xs font-mono text-ink/60">LRN: {std.lrn}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-ink/50">Grade & Section: </span>
                    <span className="font-bold text-ink">{std.grade ? (std.grade.startsWith('Grade') ? std.grade : `Grade ${std.grade}`) : 'Unassigned'} - {std.section || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-ink/50">Email: </span>
                    <span className="font-semibold text-brand-blue">{std.personalEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-ink/50">Gender: </span>
                    <span className="font-semibold text-ink">{std.gender || 'N/A'}</span>
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

              <div className="relative inline-flex items-center">
                <span
                  className={`absolute left-3.5 size-2 rounded-full pointer-events-none z-10 ${
                    std.status === 'Active'
                      ? 'bg-[#00a652]'
                      : std.status === 'Dropped'
                      ? 'bg-amber-500'
                      : std.status === 'Transferred'
                      ? 'bg-purple-500'
                      : 'bg-brand-red'
                  }`}
                />
                <select
                  value={std.status || 'Active'}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      const token = getToken();
                      const res = await fetch(getApiUrl(`/api/admin/students/${std.lrn}/status`), {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      if (res.ok) {
                        setStudent((prev) => ({ ...prev, status: newStatus }));
                        showToast(`Student status changed to ${newStatus}.`);
                      }
                    } catch (err) {
                      showToast('Failed to update student status.');
                    }
                  }}
                  className="appearance-none rounded-full bg-white hover:bg-cream border border-ink/15 pl-8 pr-8 py-2 text-xs font-semibold text-ink outline-none cursor-pointer shadow-2xs transition-all hover:border-ink/30"
                >
                  <option value="Active">Status: Active</option>
                  <option value="Disabled">Status: Disabled</option>
                  <option value="Dropped">Status: Dropped Out</option>
                  <option value="Transferred">Status: Transferred Out</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">
                  <CaretDown size={12} weight="bold" />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main 2-Column Section: oral adaptive profile, analytics, and records */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">Oral Reading Adaptive Profile</p>
                <p className="text-[11px] text-ink/55">Teacher-reviewed diagnostic boundaries</p>
              </div>
              <div className="flex gap-1.5">
                <select value={profilePeriod} onChange={(event) => setProfilePeriod(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="pre_test">Pre-Test</option><option value="post_test">Post-Test</option>
                </select>
                <select value={profileLanguage} onChange={(event) => setProfileLanguage(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="fil">Filipino</option><option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-ink/10">
              <div className="grid grid-cols-[1.1fr_.8fr_1.35fr] gap-2 bg-ink/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink/55"><span>Boundary</span><span>Grade</span><span>Assessment basis</span></div>
              {diagnosticEvidence.map((boundary) => (
                <div key={boundary.label} className="grid grid-cols-[1.1fr_.8fr_1.35fr] items-center gap-2 border-t border-ink/10 px-3 py-2.5 text-xs">
                  <span className={`w-fit rounded-md px-2 py-1 text-[10px] font-bold ${boundary.style}`}>{boundary.label}</span>
                  <span className="font-bold text-ink">{boundary.level ? formatGrade(boundary.level) : '—'}</span>
                  {boundary.evidence ? <div className="min-w-0"><p className="truncate font-semibold text-ink">{boundary.evidence.passageTitle || boundary.evidence.passageSet}</p><p className="text-[10px] text-ink/60">{boundary.evidence.passageSet} · {boundary.evidence.accuracyScore}% Acc · {boundary.evidence.comprehensionScore}% Comp</p></div> : <span className="text-[10px] text-ink/50">No reviewed result yet</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              value={evidenceAverage('accuracyScore')}
              unit="%"
              label={'Average\nAccuracy'}
              iconName="ph:target"
              iconBg="bg-[#DBEAFE] text-[#2563EB]"
            />
            <StatCard
              value={evidenceAverage('comprehensionScore')}
              unit="%"
              label={'Average\nComprehension'}
              iconName="ph:lightbulb"
              iconBg="bg-[#D1FAE5] text-[#059669]"
            />
            <StatCard
              value={evidenceAverage('readingSpeed')}
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
                <div>
                  {allPhilIriRecords.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {paginatedPhilIriRecords.map((activity) => (
                          <AchievementActivityRow key={activity.id} activity={activity} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(recordsPage - 1) * RECORDS_PAGE_SIZE + 1} to {Math.min(recordsPage * RECORDS_PAGE_SIZE, allPhilIriRecords.length)} of {allPhilIriRecords.length} records
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

              {achievementTab === 'Badges' && (
                <div>
                  {rawBadges.length > 0 ? (
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

              {achievementTab === 'Stories' && (
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
    </>
  );
}
