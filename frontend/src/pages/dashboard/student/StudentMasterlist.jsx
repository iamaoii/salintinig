import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, UserCheck, CaretDown, CaretUp, CaretLeft, CaretRight, Lightbulb } from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { encodeSecureToken } from '../../../lib/securityToken.js';
import { getToken } from '../../../lib/auth.js';
import { getCompactPageItems } from '../../../lib/pagination.js';
import { cacheService } from '../../../services/cacheService.js';
import { StudentTableSkeleton } from '../../../components/common/Skeleton.jsx';


const TABS = [
  { to: '/teacher/student-dashboard/all', label: 'All Learners', filter: 'all', activeColor: '#165fd5' },
  { to: '/teacher/student-dashboard/independent', label: 'Complete Profiles', filter: 'complete', activeColor: '#00a652' },
  { to: '/teacher/student-dashboard/instructional', label: 'In Progress', filter: 'in_progress', activeColor: '#d97706' },
  { to: '/teacher/student-dashboard/pending', label: 'Not Started', filter: 'not_started', activeColor: '#64748b' },
];

export default function StudentMasterlist({ level }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchParams] = useSearchParams();
  const profileLanguage = searchParams.get('language') || 'fil';
  const profilePeriod = searchParams.get('period') || 'pre_test';

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [level, profileLanguage, profilePeriod]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lock body scroll when EOSY Promotion modal is open
  useEffect(() => {
    if (showPromotionModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [showPromotionModal]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const cached = cacheService.get('teacher_class_students');
        if (cached) {
          setStudents(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }
        const token = getToken();

        const res = await fetch(getApiUrl('/api/teacher/class-students'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          setStudents(data.students);
          cacheService.set('teacher_class_students', data.students);
        } else {
          setStudents([]);
        }
        setLoading(false);
      } catch (err) {
        console.warn('Error fetching students:', err);
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSetPromotionStatus = async (studentId, statusToSet) => {
    const studentObj = students.find((s) => (s.id || s.studentId) === studentId);
    const currentStatus = studentObj?.promotionStatus || 'pending';
    // Deselect if clicking the already selected status option -> resets back to 'pending'
    const newStatus = currentStatus === statusToSet ? 'pending' : statusToSet;

    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/teacher/students/${studentId}/promotion`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ promotionStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          newStatus === 'pending'
            ? 'Selection cleared (Pending evaluation).'
            : `Learner status set to ${newStatus.toUpperCase()}.`
        );
        cacheService.invalidate('teacher_class_students');
        cacheService.invalidate('admin_student_sectioning');
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId || s.studentId === studentId ? { ...s, promotionStatus: newStatus } : s))
        );
      }
    } catch (err) {
      showToast('Failed to update promotion status.');
    }
  };

  const handleMarkAllPromoted = async () => {
    try {
      const token = getToken();
      await Promise.all(
        students.map((std) => {
          const sId = std.id || std.studentId;
          return fetch(getApiUrl(`/api/teacher/students/${sId}/promotion`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ promotionStatus: 'promoted' }),
          });
        })
      );
      showToast(`Marked all ${students.length} learners as PROMOTED.`);
      setStudents((prev) => prev.map((s) => ({ ...s, promotionStatus: 'promoted' })));
    } catch (err) {
      showToast('Failed to mark all learners as promoted.');
    }
  };

  const handleClearAllStatus = async () => {
    try {
      const token = getToken();
      await Promise.all(
        students.map((std) => {
          const sId = std.id || std.studentId;
          return fetch(getApiUrl(`/api/teacher/students/${sId}/promotion`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ promotionStatus: 'pending' }),
          });
        })
      );
      showToast('Cleared all evaluation selections (set to Pending).');
      setStudents((prev) => prev.map((s) => ({ ...s, promotionStatus: 'pending' })));
    } catch (err) {
      showToast('Failed to clear evaluation selections.');
    }
  };

  const getAdaptiveProfile = (student) => (student.oralAdaptiveProfiles || []).find((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    return language === profileLanguage && String(profile.period || 'pre_test').toLowerCase() === profilePeriod;
  });
  const formatGrade = (value) => {
    if (!value) return null;
    const grade = String(value).match(/\d+/)?.[0];
    return grade ? `Grade ${grade}` : String(value);
  };
  const profileIsComplete = (profile) => Boolean(profile?.independentLevel && profile?.instructionalLevel && profile?.frustrationalLevel);

  const activeFilter = TABS.find((tab) => tab.to.endsWith(`/${String(level || 'all').toLowerCase()}`))?.filter || 'all';

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const profile = getAdaptiveProfile(student);
      if (activeFilter === 'complete') return profileIsComplete(profile);
      if (activeFilter === 'in_progress') return Boolean(profile) && !profileIsComplete(profile);
      if (activeFilter === 'not_started') return !profile;
      return true;
    });
  }, [students, activeFilter, profileLanguage, profilePeriod]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedStudents = useMemo(() => {
    return filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filtered, currentPage]);

  const evaluatedCount = useMemo(() => {
    return students.filter((s) => s.promotionStatus && s.promotionStatus !== 'pending').length;
  }, [students]);

  // ── Memoized Guidance Analytics ──
  const guidanceData = useMemo(() => {
    if (students.length === 0) return null;
    const indCounts = {};
    const instCounts = {};
    const frustCounts = {};
    let completedCount = 0;

    students.forEach((s) => {
      const p = getAdaptiveProfile(s);
      if (p?.independentLevel && p?.instructionalLevel && p?.frustrationalLevel) {
        completedCount += 1;
      }
      const indG = formatGrade(p?.independentLevel);
      if (indG) indCounts[indG] = (indCounts[indG] || 0) + 1;
      const instG = formatGrade(p?.instructionalLevel);
      if (instG) instCounts[instG] = (instCounts[instG] || 0) + 1;
      const frustG = formatGrade(p?.frustrationalLevel);
      if (frustG) frustCounts[frustG] = (frustCounts[frustG] || 0) + 1;
    });

    if (completedCount === 0) return null;

    const sortEntries = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const topInd = sortEntries(indCounts)[0]?.[0] || null;
    const topInst = sortEntries(instCounts)[0]?.[0] || null;
    const topFrust = sortEntries(frustCounts)[0]?.[0] || null;

    const topIndCount = indCounts[topInd] || 0;
    const topInstCount = instCounts[topInst] || 0;
    const topFrustCount = frustCounts[topFrust] || 0;

    const instNum = Number(String(topInst || '').match(/\d+/)?.[0] || 4);
    const frustNum = Number(String(topFrust || '').match(/\d+/)?.[0] || 0);
    const indNum = Number(String(topInd || '').match(/\d+/)?.[0] || 4);

    const guided = [];
    if (topInst) {
      guided.push(<>Baseline: <strong>{topInst}</strong> passages match the instructional level of {topInstCount} learners.</>);
    } else {
      guided.push(<>Assign standard grade-level passages for class-wide oral reading practice.</>);
    }
    if (instNum <= 3) {
      guided.push(<>Pre-teach common sight words and demonstrate natural pacing before recorded attempts.</>);
    } else if (instNum >= 5) {
      guided.push(<>Focus comprehension reviews on inferential and critical analysis questions.</>);
    } else {
      guided.push(<>Provide 5W1H guide questions before oral reading to anchor comprehension.</>);
    }

    const remediation = [];
    if (topFrust) {
      remediation.push(<>Priority: {topFrustCount} learners encounter difficulty at <strong>{topFrust}</strong> passages.</>);
    } else {
      remediation.push(<>Support learners with frequent oral miscues or low comprehension scores.</>);
    }
    if (frustNum > 0 && frustNum <= 3) {
      remediation.push(<>Assign short Practice Activities in Salintinig to build sound-spelling accuracy.</>);
    } else if (frustNum >= 5) {
      remediation.push(<>Target difficult multi-syllabic terms identified in Phil-IRI Review before passages.</>);
    } else {
      remediation.push(<>Use audio playback in Phil-IRI Review to pinpoint specific misread or skipped words.</>);
    }

    const enrichment = [];
    if (topInd) {
      enrichment.push(<>Mastery: {topIndCount} learners read independently with high accuracy at <strong>{topInd}</strong>.</>);
    } else {
      enrichment.push(<>Encourage fluent readers to sustain daily practice across available passages.</>);
    }
    if (indNum >= 5) {
      enrichment.push(<>Assign higher-grade passages from the Passage Bank and pair as reading buddies.</>);
    } else if (indNum <= 2) {
      enrichment.push(<>Assign varied Practice Activities to build reading speed towards the grade norm.</>);
    } else {
      enrichment.push(<>Assess higher independent reading boundaries using upper-level Passage Bank texts.</>);
    }

    return {
      completedCount,
      guided,
      remediation,
      enrichment,
    };
  }, [students, profileLanguage, profilePeriod]);

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div>
        {/* ── Classroom Reading Overview & Teaching Suggestions (Collapsible & Rich Bullet Points) ── */}
        {!loading && guidanceData && (
          <div className="mb-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xs">
            <div
              onClick={() => setShowGuidance((prev) => !prev)}
              className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 transition-colors hover:bg-ink/[0.015]"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                  <Lightbulb size={14} weight="bold" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-bold text-ink">Classroom Reading Profile & Teaching Guidance</h3>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800">
                    {guidanceData.completedCount} / {students.length} Evaluated
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-ink/60 hover:bg-ink/5 cursor-pointer"
              >
                <span>{showGuidance ? 'Hide' : 'Show Suggestions'}</span>
                {showGuidance ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
              </button>
            </div>

            {showGuidance && (
              <div className="border-t border-ink/5 p-3.5 pt-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-[11px] leading-relaxed">
                  {/* Guided Material Card */}
                  <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-ink/5 pb-2 mb-2.5">
                      <span className="flex size-2 rounded-full bg-brand-blue" />
                      <h4 className="text-xs font-bold text-ink">Guided Material Level</h4>
                    </div>
                    <ul className="space-y-1.5 text-ink/80">
                      {guidanceData.guided.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-ink/60 font-bold text-[11px] leading-none mt-0.5">•</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Targeted Remediation Card */}
                  <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-ink/5 pb-2 mb-2.5">
                      <span className="flex size-2 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-bold text-ink">Targeted Remediation</h4>
                    </div>
                    <ul className="space-y-1.5 text-ink/80">
                      {guidanceData.remediation.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-ink/60 font-bold text-[11px] leading-none mt-0.5">•</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reader Enrichment Card */}
                  <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-ink/5 pb-2 mb-2.5">
                      <span className="flex size-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold text-ink">Reader Enrichment</h4>
                    </div>
                    <ul className="space-y-1.5 text-ink/80">
                      {guidanceData.enrichment.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-ink/60 font-bold text-[11px] leading-none mt-0.5">•</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Subtabs & Action Controls Bar (Directly Above Table) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 pb-2.5">
          <div className="flex min-w-0 items-center gap-4 overflow-x-auto sm:gap-6">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={{ pathname: tab.to, search: searchParams.toString() }}
                className={({ isActive }) =>
                  `shrink-0 border-b-2 py-1 text-sm font-medium transition-colors ${
                    isActive ? '' : 'border-transparent text-ink/60 hover:text-ink'
                  }`
                }
                style={({ isActive }) => (isActive ? { borderColor: tab.activeColor, color: tab.activeColor } : undefined)}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!loading && (
              <span className="text-xs font-semibold text-ink/60">
                {filtered.length} {filtered.length === 1 ? 'learner' : 'learners'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPromotionModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors cursor-pointer shadow-xs"
              title="Manage End-of-Year Learner Promotion Statuses"
            >
              <UserCheck size={15} className="text-brand-blue" weight="bold" />
              <span>EOSY Learner Promotion</span>
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xs">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-[#eef2f6] text-left text-xs font-bold uppercase tracking-wider text-ink/70">
                <th className="w-12 px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Independent</th>
                <th className="px-4 py-3.5">Instructional</th>
                <th className="px-4 py-3.5">Frustrational</th>
                <th className="w-40 px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {loading && <StudentTableSkeleton rows={6} />}

              {!loading && paginatedStudents.map((student, i) => {
                const adaptiveProfile = getAdaptiveProfile(student);
                const isCompleted = profileIsComplete(adaptiveProfile);
                const statusBadge = isCompleted ? (
                  <span className="inline-flex whitespace-nowrap items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">Completed</span>
                ) : (
                  <span className="inline-flex whitespace-nowrap items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/80">{adaptiveProfile?.status === 'in_progress' ? 'In Progress' : 'Pending Evaluation'}</span>
                );
                const boundaryBadge = (value, colors) => value ? (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors}`}>{formatGrade(value)}</span>
                ) : <span className="px-2 text-xs font-semibold text-ink/35">—</span>;

                return (
                  <tr
                    key={student.lrn}
                    onClick={() => navigate(`/teacher/student-dashboard/students/${encodeSecureToken('st', student.lrn)}`)}
                    className="group transition-colors hover:bg-ink/[0.015] cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-xs font-semibold text-ink/70">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={30} />
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-ink group-hover:text-brand-blue transition-colors">{student.name}</span>
                          <span className="mt-0.5 block text-[10px] font-medium text-ink/50">LRN: {student.lrn}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs">{boundaryBadge(adaptiveProfile?.independentLevel, 'border-emerald-200 bg-emerald-50 text-emerald-800')}</td>
                    <td className="px-4 py-3.5 text-xs">{boundaryBadge(adaptiveProfile?.instructionalLevel, 'border-amber-200 bg-amber-50 text-amber-900')}</td>
                    <td className="px-4 py-3.5 text-xs">{boundaryBadge(adaptiveProfile?.frustrationalLevel, 'border-rose-200 bg-rose-50 text-rose-800')}</td>
                    <td className="px-4 py-3.5 text-xs">{statusBadge}</td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs font-medium text-ink/50">
                    {students.length === 0
                      ? 'No enrolled students found in this section.'
                      : 'No learners match this Oral adaptive-profile status.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Masterlist Table Footer / Pagination */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
              <span>
                {filtered.length === 0
                  ? 'Showing 0 of 0 student records'
                  : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} student records`}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                  >
                    <CaretLeft size={14} /> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {getCompactPageItems(totalPages, currentPage).map((pg, index) => pg === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="flex size-8 items-center justify-center text-xs font-bold text-ink/45" aria-hidden="true">…</span>
                    ) : (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pg
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
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* End-of-Year Learner Promotion Modal */}
      {showPromotionModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/10">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <UserCheck size={20} className="text-brand-blue" />
                  <span>End-of-Year Learner Promotion Evaluation</span>
                </h3>
                <p className="text-xs text-ink/50 mt-0.5">
                  Evaluate and mark each learner in your advisory class
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {students.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkAllPromoted}
                      className="whitespace-nowrap rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-3.5 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
                    >
                      Mark All Promoted
                    </button>
                    {evaluatedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllStatus}
                        className="whitespace-nowrap rounded-xl border border-ink/20 bg-ink/5 px-3.5 py-1.5 text-xs font-bold text-ink/70 hover:bg-ink/10 transition-colors cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(false)}
                  className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {students.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink/50 font-medium bg-white rounded-xl border border-ink/10">
                  No enrolled learners found in your advisory section.
                </div>
              ) : (
                students.map((std) => {
                  const sId = std.id || std.studentId;
                  const status = std.promotionStatus || 'pending';
                  const isPromoted = status === 'promoted';
                  const isRetained = status === 'retained';
                  const isDropped = status === 'dropped';
                  const isTransferred = status === 'transferred';
                  const isPending = status === 'pending';

                  return (
                    <div
                      key={std.lrn}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-ink/10 bg-white shadow-2xs hover:border-ink/20 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={std.name} src={std.profileImage || std.profile_image || std.avatarUrl || std.avatar} size={36} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-ink">{std.name}</p>
                            {isPending && (
                              <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-ink/50 mt-0.5">LRN: {std.lrn}</p>
                        </div>
                      </div>

                      {/* Standard Dropdown Selector */}
                      <select
                        value={status}
                        onChange={(e) => handleSetPromotionStatus(sId, e.target.value)}
                        className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs outline-none focus:border-brand-blue cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="promoted">Promoted</option>
                        <option value="retained">Retained</option>
                        <option value="dropped">Dropped Out</option>
                        <option value="transferred">Transferred Out</option>
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
