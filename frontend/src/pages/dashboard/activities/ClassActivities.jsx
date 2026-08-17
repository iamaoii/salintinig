import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { FlagPennant, Plus, UserCheck, Microphone, BookOpen } from '@phosphor-icons/react';
import ActivityRow from '../../../components/dashboard/activity/ActivityRow.jsx';
import ActivityDetailPanel from '../../../components/dashboard/activity/ActivityDetailPanel.jsx';
import PhilIriReviewDetail from '../phil-iri/PhilIriReviewDetail.jsx';
import { getToken } from '../../../lib/auth.js';

import { practiceActivities } from '../../../data/classActivities.js';

export default function ClassActivities() {
  const location = useLocation();
  const isPractice = location.pathname.includes('/practice');
  const activeTabKey = isPractice ? 'practice' : 'phil-iri';

  const [selectedId, setSelectedId] = useState(null);
  const [students, setStudents] = useState([]);
  const [passages, setPassages] = useState([]);
  const [activeReviewData, setActiveReviewData] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [philIriActivitiesList, setPhilIriActivitiesList] = useState([]);

  const currentActivities = activeTabKey === 'practice' ? practiceActivities : philIriActivitiesList;
  const selectedActivity = currentActivities.find((a) => a.id === selectedId);

  const fetchPhilIriActivities = () => {
    const token = getToken();
    fetch('/api/teacher/assessments/phil-iri-activities', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activities) {
          setPhilIriActivitiesList(data.activities);
        }
      })
      .catch(() => {});
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/teacher/assessments/${activityId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setPhilIriActivitiesList((prev) => prev.filter((a) => a.id !== activityId));
        if (selectedId === activityId) setSelectedId(null);
      } else {
        alert(data.error || 'Failed to delete assessment.');
      }
    } catch (err) {
      console.error('Error deleting assessment:', err);
      alert('Failed to delete assessment.');
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

    // Fetch students list for assignment modal
    fetch('/api/students', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
        } else {
          fetch('/api/teacher/grade-level', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(res => res.json())
            .then(gData => {
              if (gData.success && Array.isArray(gData.students)) {
                setStudents(gData.students);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch('/api/teacher/grade-level', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          .then(res => res.json())
          .then(gData => {
            if (gData.success && Array.isArray(gData.students)) {
              setStudents(gData.students);
            }
          })
          .catch(() => {});
      });

    fetch('/api/teacher/assessments/pending-reviews', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pendingReviews) setPendingReviews(data.pendingReviews);
      })
      .catch(() => {});

    fetchPhilIriActivities();
  }, []);

  if (activeReviewData) {
    return (
      <PhilIriReviewDetail
        reviewData={activeReviewData}
        onBack={() => setActiveReviewData(null)}
        onVerified={() => {
          setActiveReviewData(null);
          // refresh pending list
          const token = localStorage.getItem('token');
          fetch('/api/teacher/assessments/pending-reviews', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(res => res.json())
            .then(data => {
              if (data.success) setPendingReviews(data.pendingReviews || []);
            });
        }}
      />
    );
  }

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

        <Link
          to="/teacher/phil-iri-passages"
          className="mb-1 flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 hover:shadow-md transition-all cursor-pointer"
        >
          <BookOpen size={18} weight="bold" />
          <span>Phil-IRI Passage Bank</span>
        </Link>
      </div>

      {/* Pending Oral Reviews Banner */}
      {activeTabKey === 'phil-iri' && pendingReviews.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Microphone size={20} />
              <span>{pendingReviews.length} Student Oral Assessment(s) Awaiting Teacher Review</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {pendingReviews.map((rev) => (
              <button
                key={rev.attemptId || rev.oralResultId}
                onClick={() => setActiveReviewData(rev)}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm border border-amber-200 hover:bg-amber-100/50"
              >
                <span>{rev.studentName}</span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">{rev.passageSet || 'Set A'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-1 flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1">
          {currentActivities.length > 0 ? (
            <div className="flex flex-col gap-4">
              {currentActivities.map((activity) => (
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <FlagPennant size={40} className="text-gray-400" />
              <h3 className="mt-3 text-lg font-bold text-gray-900">No Phil-IRI Assessments Assigned Yet</h3>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                You have not assigned any Phil-IRI passage sets to your class students in the database.
              </p>
              <Link
                to="/teacher/class-activities/assign-phil-iri"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all"
              >
                <UserCheck size={18} /> Assign Phil-IRI Sets to Students Now
              </Link>
            </div>
          )}

          {activeTabKey === 'phil-iri' ? (
            <Link
              to="/teacher/class-activities/assign-phil-iri"
              aria-label="Assign Phil-IRI Sets"
              title="Assign Phil-IRI Sets"
              className="fixed bottom-8 right-8 z-50 flex size-12 items-center justify-center rounded-full bg-brand-red text-cream shadow-lg transition-transform hover:scale-105 hover:bg-[#b8331b] active:scale-95"
            >
              <Plus size={22} weight="bold" />
            </Link>
          ) : (
            <Link
              to="/teacher/class-activities/new"
              aria-label="Add practice activity"
              title="Add Practice Activity"
              className="fixed bottom-8 right-8 z-50 flex size-12 items-center justify-center rounded-full bg-brand-red text-cream shadow-lg transition-transform hover:scale-105 hover:bg-[#b8331b] active:scale-95"
            >
              <Plus size={22} weight="bold" />
            </Link>
          )}
        </div>

        <div className="w-full xl:w-[380px] xl:shrink-0 xl:border-l xl:border-ink/10 xl:pl-8">
          {selectedActivity && (
            <ActivityDetailPanel activity={selectedActivity} onDelete={handleDeleteActivity} />
          )}
        </div>
      </div>
    </div>
  );
}
