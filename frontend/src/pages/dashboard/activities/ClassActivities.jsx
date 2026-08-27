import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { FlagPennant, Plus, UserCheck, Microphone, BookOpen, WarningCircle, CaretLeft, CaretRight, MagnifyingGlass, X, User } from '@phosphor-icons/react';
import ActivityRow from '../../../components/dashboard/activity/ActivityRow.jsx';
import ActivityDetailPanel from '../../../components/dashboard/activity/ActivityDetailPanel.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import PhilIriReviewDetail from '../phil-iri/PhilIriReviewDetail.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { getToken } from '../../../lib/auth.js';

import { practiceActivities } from '../../../data/classActivities.js';

function consolidateActivities(rawList) {
  if (!Array.isArray(rawList)) return [];
  const map = new Map();

  rawList.forEach((act) => {
    const type = (act.assessmentType || act.type || 'oral').toLowerCase();
    const period = (act.period || act.assessmentPeriod || 'pre_test').toLowerCase();
    const lang = (act.language || 'fil').toLowerCase();

    const key = act.id || `${type}_${period}_${lang}`;

    if (!map.has(key)) {
      map.set(key, {
        ...act,
        id: act.id || key,
        done: Number(act.done || 0),
        pending: Number(act.pending || 0),
        totalAssigned: Number(act.totalAssigned || (Number(act.done || 0) + Number(act.pending || 0))),
      });
    } else {
      const existing = map.get(key);
      existing.done += Number(act.done || 0);
      existing.pending += Number(act.pending || 0);
      existing.totalAssigned += Number(act.totalAssigned || (Number(act.done || 0) + Number(act.pending || 0)));
      existing.status = existing.pending === 0 ? 'completed' : 'pending';
      existing.action = existing.pending === 0 ? 'View result' : 'Open';
    }
  });

  return Array.from(map.values());
}

export default function ClassActivities() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPractice = location.pathname.includes('/practice');
  const activeTabKey = isPractice ? 'practice' : 'phil-iri';

  const [selectedId, setSelectedId] = useState(null);
  const [students, setStudents] = useState([]);
  const [passages, setPassages] = useState([]);
  const [activeReviewData, setActiveReviewData] = useState(null);
  const [showPendingListModal, setShowPendingListModal] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [philIriActivitiesList, setPhilIriActivitiesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const rawActivities = activeTabKey === 'practice' ? practiceActivities : philIriActivitiesList;
  const currentActivities = consolidateActivities(rawActivities);

  const filteredActivities = currentActivities.filter((act) => {
    const matchesSearch = !searchQuery || act.title.toLowerCase().includes(searchQuery.toLowerCase());
    const typeStr = (act.assessmentType || act.type || '').toLowerCase();
    const matchesFilter =
      assessmentFilter === 'all' ||
      (assessmentFilter === 'oral' && typeStr.includes('oral')) ||
      (assessmentFilter === 'listening' && typeStr.includes('listening')) ||
      (assessmentFilter === 'silent' && typeStr.includes('silent'));
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + pageSize);

  const selectedActivity = currentActivities.find((a) => a.id === selectedId);

  const fetchPhilIriActivities = () => {
    const token = getToken();
    setIsLoading(true);
    fetch('/api/teacher/assessments/phil-iri-activities', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activities) {
          setPhilIriActivitiesList(consolidateActivities(data.activities));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleToggleActivityStatus = async (activity) => {
    if (!activity) return;
    const currentIsClosed = activity.activityStatus === 'closed' || activity.action === 'Closed';
    const nextStatus = currentIsClosed ? 'open' : 'closed';

    try {
      const token = getToken();
      const res = await fetch('/api/teacher/assessments/toggle-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          activityId: activity.id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage({
          text: `Assessment has been marked as ${nextStatus.toUpperCase()}.`,
          type: 'success',
        });
        fetchPhilIriActivities();
      } else {
        setToastMessage({ text: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setToastMessage({ text: 'Failed to update status.', type: 'error' });
    }
  };

  const handleDeleteActivity = (activityId) => {
    setDeleteTargetId(activityId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeleteTargetId(null);

    try {
      const token = getToken();
      const res = await fetch(`/api/teacher/assessments/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setPhilIriActivitiesList((prev) => prev.filter((a) => a.id !== targetId));
        if (selectedId === targetId) setSelectedId(null);
        setToastMessage({ text: 'Assessment deleted successfully.', type: 'success' });
        fetchPhilIriActivities();
      } else {
        setToastMessage({ text: data.error || 'Failed to delete assessment.', type: 'error' });
      }
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setToastMessage({ text: 'Failed to delete assessment.', type: 'error' });
    }
  };

  useEffect(() => {
    const token = getToken();
    fetch('/api/teacher/assessments/passages', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.passages) setPassages(data.passages);
      })
      .catch(() => {});

    // Fetch enrolled section students for teacher
    fetch('/api/teacher/class-students', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
        }
      })
      .catch(() => {});

    fetch('/api/teacher/assessments/pending-reviews', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pendingReviews) setPendingReviews(data.pendingReviews);
      })
      .catch(() => {});

    fetchPhilIriActivities();
  }, []);

  useEffect(() => {
    if (activeReviewData || showPendingListModal || deleteTargetId) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [activeReviewData, showPendingListModal, deleteTargetId]);



  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col">
      <div className="flex items-center gap-3">
        <FlagPennant size={28} className="text-brand-red" />
        <h1 className="text-3xl font-bold text-ink">Activities</h1>
      </div>

      {/* Tabs with dedicated routes */}
      <div className="mt-4 flex items-center justify-between border-b border-ink/10">
        <div className="flex items-center gap-4">
          <NavLink
            to="/teacher/class-activities/phil-iri"
            className={({ isActive }) =>
              `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-ink hover:bg-ink/5'
              }`
            }
          >
            Phil-IRI Assessments
          </NavLink>
          <NavLink
            to="/teacher/class-activities/practice"
            className={({ isActive }) =>
              `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-ink hover:bg-ink/5'
              }`
            }
          >
            Practice Mode
          </NavLink>
        </div>

        <div className="mb-1 flex items-center gap-2">
          <button
            onClick={() => {
              if (pendingReviews.length > 0) setShowPendingListModal(true);
            }}
            disabled={pendingReviews.length === 0}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              pendingReviews.length > 0
                ? 'border-brand-red/30 bg-white text-brand-red shadow-2xs hover:bg-brand-red/5 cursor-pointer'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-75'
            }`}
          >
            <Microphone size={16} weight="bold" />
            <span>Review Oral Assessments ({pendingReviews.length})</span>
          </button>

          <Link
            to="/teacher/phil-iri-passages"
            className="flex items-center gap-2 rounded-xl border border-brand-red/30 bg-white px-3.5 py-2 text-xs font-bold text-brand-red shadow-2xs hover:bg-brand-red/5 transition-all cursor-pointer"
          >
            <BookOpen size={16} weight="bold" />
            <span>Phil-IRI Passage Bank</span>
          </Link>

          {activeTabKey === 'phil-iri' ? (
            <Link
              to="/teacher/class-activities/phil-iri/assign"
              className="flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 transition-all cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Assign Phil-IRI Sets</span>
            </Link>
          ) : (
            <Link
              to="/teacher/class-activities/practice/create"
              className="flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 transition-all cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Add Practice Activity</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-8 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          {/* Search & Filter Bar */}
          {currentActivities.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px]">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search assessment activity..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-ink/15 bg-white py-2 pl-9 pr-3.5 text-xs text-ink placeholder:text-ink/40 focus:border-brand-red focus:outline-none shadow-2xs"
                />
              </div>

              {/* Assessment Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'oral', label: 'Oral Reading' },
                  { key: 'listening', label: 'Listening' },
                  { key: 'silent', label: 'Silent Reading' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setAssessmentFilter(item.key);
                      setCurrentPage(1);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      assessmentFilter === item.key
                        ? 'bg-brand-red text-white shadow-2xs'
                        : 'bg-white text-ink/70 border border-ink/10 hover:bg-ink/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-ink/50">
              <div className="size-6 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
              <span className="text-xs font-semibold text-ink/60">Loading Phil-IRI assessments...</span>
            </div>
          ) : currentActivities.length > 0 ? (
            <>
              {paginatedActivities.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {paginatedActivities.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      compact
                      selected={activity.id === selectedActivity?.id}
                      onClick={() => setSelectedId((prev) => (prev === activity.id ? null : activity.id))}
                      onDelete={handleDeleteActivity}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center shadow-2xs">
                  <div className="flex size-12 items-center justify-center rounded-full bg-ink/5 text-ink/40 mb-3">
                    <MagnifyingGlass size={22} weight="bold" />
                  </div>
                  <h4 className="text-sm font-bold text-ink">No Matching Assessments</h4>
                  <p className="mt-1 text-xs text-ink/60 max-w-xs leading-relaxed">
                    {searchQuery.trim()
                      ? `No assessments found matching "${searchQuery}". Try searching with a different keyword.`
                      : `No assessments found for the selected filter.`}
                  </p>
                </div>
              )}

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
                  <span className="text-xs font-medium text-ink/60">
                    Showing <strong className="text-ink">{startIndex + 1}</strong> to{' '}
                    <strong className="text-ink">
                      {Math.min(startIndex + pageSize, filteredActivities.length)}
                    </strong>{' '}
                    of <strong className="text-ink">{filteredActivities.length}</strong> assessments
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="flex size-8 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safePage === pg
                            ? 'bg-brand-red text-white shadow-2xs'
                            : 'border border-ink/15 bg-white text-ink/70 hover:bg-ink/5'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="flex size-8 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white p-12 text-center shadow-2xs">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-3">
                <FlagPennant size={28} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-ink">No Phil-IRI Assessments Assigned Yet</h3>
              <p className="mt-1 max-w-sm text-xs text-ink/60 leading-relaxed">
                You have not assigned any Phil-IRI passage sets to your class students yet.
              </p>
              <Link
                to="/teacher/class-activities/phil-iri/assign"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-all cursor-pointer"
              >
                <UserCheck size={18} /> Assign Phil-IRI Sets to Students Now
              </Link>
            </div>
          )}
        </div>

        <div className="w-full xl:w-[380px] xl:shrink-0 xl:border-l xl:border-ink/10 xl:pl-8">
          {selectedActivity && (
            <ActivityDetailPanel
              activity={selectedActivity}
              onDelete={handleDeleteActivity}
              onToggleStatus={handleToggleActivityStatus}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Popup */}

      {/* Delete Confirmation Modal Popup */}
      {deleteTargetId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red shrink-0">
                <WarningCircle size={22} weight="bold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Delete Assessment</h3>
                <p className="text-xs text-ink/60">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-ink/80 leading-relaxed">
              Are you sure you want to delete this assessment from your class activities?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-red/90 cursor-pointer"
              >
                Delete Assessment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Pending Oral Reviews List Modal — Matching Add Student / Teacher Modal style */}
      {showPendingListModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red font-bold">
                  <Microphone size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Students Awaiting Oral Review</h3>
                  <p className="text-xs text-gray-500 font-medium">Select a student recording to evaluate miscues and reading profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPendingListModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
              {pendingReviews.map((rev) => (
                <div
                  key={rev.attemptId || rev.oralResultId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 hover:border-brand-red/30 hover:bg-red-50/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={rev.studentName || rev.name || ''}
                      src={rev.studentAvatar || rev.profileImage || rev.profile_image || null}
                      color="#0097b2"
                      size={36}
                    />
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-bold text-gray-900">
                        {rev.studentName || [rev.firstName, rev.middleName, rev.lastName].filter(Boolean).join(' ') || rev.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-0.5">
                        <span>Passage: {rev.passageSet || 'Set A'}</span>
                        <span>•</span>
                        <span>{rev.language ? (String(rev.language).toLowerCase().startsWith('en') ? 'English' : 'Filipino') : 'Filipino'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPendingListModal(false);
                      navigate(`/teacher/class-activities/phil-iri/review/${rev.attemptId}`);
                    }}
                    className="shrink-0 rounded-lg bg-brand-red px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-brand-red/90 active:scale-95 transition-all cursor-pointer"
                  >
                    Review Now
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPendingListModal(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
