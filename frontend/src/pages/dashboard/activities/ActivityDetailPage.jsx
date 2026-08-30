import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CaretLeft,
  MagnifyingGlass,
  BookOpen,
  Ear,
  UserSound,
  UsersThree,
  CheckCircle,
  Clock,
  ChartPieSlice,
  FileText,
  Trash,
  Microphone,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import PhilIriReviewDetail from '../phil-iri/PhilIriReviewDetail.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { getToken } from '../../../lib/auth.js';

const PROFILE_TAG = {
  Independent: 'bg-emerald-100 text-emerald-950 border border-emerald-200',
  Instructional: 'bg-amber-100 text-amber-950 border border-amber-200',
  Frustrational: 'bg-rose-100 text-rose-950 border border-rose-200',
  'Pending Evaluation': 'bg-gray-100 text-gray-700 border border-gray-200',
};

export default function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [profileFilter, setProfileFilter] = useState('all');
  const [activeReviewData, setActiveReviewData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActivityDetail = () => {
    setLoading(true);
    const token = getToken();
    fetch(`/api/teacher/assessments/activity-detail/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.activity) {
          setActivityData(data.activity);
        } else {
          setToastMessage({ text: data.error || 'Failed to load activity details.', type: 'error' });
        }
      })
      .catch((err) => {
        console.error('Error fetching activity detail:', err);
        setToastMessage({ text: 'Error connecting to server.', type: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivityDetail();
  }, [id]);

  const students = activityData?.students || [];
  const passages = activityData?.passages || [];

  const filteredStudents = useMemo(() => {
    return students.filter((std) => {
      const nameMatch =
        !searchQuery ||
        (std.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (std.lrn || '').includes(searchQuery);

      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && std.status === 'completed') ||
        (statusFilter === 'pending' && std.status !== 'completed');

      const profileMatch =
        profileFilter === 'all' ||
        (std.readingLevelResult || 'Pending Evaluation').toLowerCase() === profileFilter.toLowerCase();

      return nameMatch && statusMatch && profileMatch;
    });
  }, [students, searchQuery, statusFilter, profileFilter]);

  const doneCount = useMemo(() => students.filter((s) => s.status === 'completed').length, [students]);
  const pendingCount = useMemo(() => students.length - doneCount, [students]);

  const profileStats = useMemo(() => {
    const counts = { Independent: 0, Instructional: 0, Frustrational: 0, Pending: 0 };
    students.forEach((s) => {
      const lvl = s.readingLevelResult || 'Pending Evaluation';
      if (lvl.includes('Independent')) counts.Independent++;
      else if (lvl.includes('Instructional')) counts.Instructional++;
      else if (lvl.includes('Frustrational')) counts.Frustrational++;
      else counts.Pending++;
    });
    return counts;
  }, [students]);

  const handleDeleteActivity = async () => {
    if (!window.confirm('Are you sure you want to delete this master assessment activity and all associated student assignments?')) {
      return;
    }
    setIsDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/teacher/assessments/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        navigate('/teacher/class-activities/phil-iri');
      } else {
        setToastMessage({ text: data.error || 'Failed to delete assessment.', type: 'error' });
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      setToastMessage({ text: 'Failed to delete assessment.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (activeReviewData) {
    return (
      <PhilIriReviewDetail
        reviewData={activeReviewData}
        onBack={() => setActiveReviewData(null)}
        onVerified={() => {
          setActiveReviewData(null);
          fetchActivityDetail();
        }}
      />
    );
  }

  const getTypeIcon = (type) => {
    if (type === 'listening') return <Ear size={22} className="text-amber-600" />;
    if (type === 'silent') return <BookOpen size={22} className="text-emerald-600" />;
    return <UserSound size={22} className="text-brand-blue" />;
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full min-h-screen pb-16">
      {toastMessage && (
        <ToastNotification text={toastMessage.text} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/teacher/class-activities/phil-iri" />
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-ink/10 px-2 py-0.5 text-[11px] font-bold text-ink/70">
                Phil-IRI Master Activity
              </span>
              {activityData?.langLabel && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    activityData.language?.startsWith('en')
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {activityData.langLabel}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink mt-0.5">
              {activityData?.title || 'Assessment Details'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDeleteActivity}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash size={15} weight="bold" />
            Delete Activity
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Key Metrics Overview Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Assigned */}
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
              <div>
                <span className="text-xs font-semibold text-ink/60">Total Assigned</span>
                <p className="text-2xl font-extrabold text-ink mt-0.5">{students.length}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-ink/5 text-ink/70">
                <UsersThree size={22} weight="bold" />
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-2xs">
              <div>
                <span className="text-xs font-semibold text-emerald-800">Completed</span>
                <p className="text-2xl font-extrabold text-emerald-950 mt-0.5">{doneCount}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle size={22} weight="bold" />
              </div>
            </div>

            {/* Pending */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-2xs">
              <div>
                <span className="text-xs font-semibold text-amber-800">Pending Evaluation</span>
                <p className="text-2xl font-extrabold text-amber-950 mt-0.5">{pendingCount}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock size={22} weight="bold" />
              </div>
            </div>

            {/* Profile Summary Breakdown */}
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
              <div className="w-full">
                <span className="text-xs font-semibold text-ink/60 mb-1 block">Reading Level Profiles</span>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-700">Ind: {profileStats.Independent}</span>
                  <span className="text-amber-700">Ins: {profileStats.Instructional}</span>
                  <span className="text-rose-700">Fru: {profileStats.Frustrational}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Passage Sets Included */}
          <div className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3.5">
              <FileText size={20} className="text-ink/60" />
              <h2 className="text-sm font-bold text-ink">Assigned Passage Sets ({passages.length})</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {passages.map((p) => (
                <div key={p.passageId} className="flex flex-col justify-between rounded-xl border border-ink/10 bg-cream/60 p-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="rounded bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue border border-brand-blue/20">
                        {p.passageSet || 'Set A'}
                      </span>
                      <span className="text-[11px] font-semibold text-ink/60">{p.wordCount ? `${p.wordCount} words` : ''}</span>
                    </div>
                    <h3 className="text-xs font-bold text-ink leading-snug">{p.title}</h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-ink/60 pt-2 border-t border-ink/5">
                    <span>{p.gradeLevel || 'Grade 4'}</span>
                    <span className="font-bold text-ink/80">{p.assignedCount} Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5 shadow-2xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Student Roster & Submission Status</h2>
                <p className="text-xs text-ink/60">Manage and inspect student Phil-IRI assessment progress</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student or LRN..."
                    className="w-full rounded-xl border border-ink/15 bg-cream/40 pl-9 pr-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-brand-blue focus:bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-cream/40 px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-brand-blue focus:bg-white cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={profileFilter}
                  onChange={(e) => setProfileFilter(e.target.value)}
                  className="rounded-xl border border-ink/15 bg-cream/40 px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-brand-blue focus:bg-white cursor-pointer"
                >
                  <option value="all">All Profiles</option>
                  <option value="independent">Independent</option>
                  <option value="instructional">Instructional</option>
                  <option value="frustrational">Frustrational</option>
                  <option value="pending evaluation">Pending Evaluation</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-cream/40 text-ink/70 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                    <th className="py-2.5 px-3">LRN</th>
                    <th className="py-2.5 px-3">Assigned Set</th>
                    <th className="py-2.5 px-3">Passage Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reading Level Profile</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((std) => {
                      const isCompleted = std.status === 'completed';
                      const badgeClass = PROFILE_TAG[std.readingLevelResult] || PROFILE_TAG['Pending Evaluation'];
                      const needsOralVerification = std.assessmentType === 'oral' && std.audioUrl && std.verificationStatus !== 'verified';

                      return (
                        <tr key={std.assessmentId || std.studentId} className="hover:bg-cream/30 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-ink">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={std.studentName} size={28} />
                              <span>{std.studentName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-ink/70">{std.lrn || '—'}</td>
                          <td className="py-2.5 px-3 font-bold text-brand-blue">{std.passageSet || 'Set A'}</td>
                          <td className="py-2.5 px-3 font-semibold text-ink max-w-[200px] truncate">
                            {std.passageTitle}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isCompleted ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-950'
                              }`}
                            >
                              {isCompleted ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                              {std.readingLevelResult}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {needsOralVerification ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReviewData({
                                    attemptId: std.attemptId,
                                    studentName: std.studentName,
                                    passageTitle: std.passageTitle,
                                    passageSet: std.passageSet,
                                    gradeLevel: std.gradeLevel,
                                    language: std.passageLanguage,
                                    passageText: std.passageText,
                                    aiMiscues: std.aiMiscues,
                                    verifiedMiscues: std.verifiedMiscues,
                                    miscues: std.verifiedMiscues ?? std.aiMiscues,
                                    audioUrl: std.audioUrl,
                                    wpm: std.wpm,
                                    accuracyPct: std.accuracyPct,
                                    comprehensionScore: std.comprehensionScore,
                                    verificationStatus: std.verificationStatus,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
                              >
                                <Microphone size={13} weight="bold" />
                                Review Audio
                              </button>
                            ) : (
                              <span className="text-[11px] text-ink/40 font-medium">
                                {isCompleted ? 'Recorded' : 'Awaiting Test'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs font-semibold text-ink/50">
                        No student assessments match the selected search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
