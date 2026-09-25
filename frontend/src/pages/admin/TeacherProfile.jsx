import { getApiUrl } from '../../config/api.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChalkboardTeacher,
  Users,
  FileText,
  TrendUp,
  Prohibit,
  UserSwitch,
  Clock,
  Student,
  CaretLeft,
  CaretRight,
  CheckCircle,
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { TeacherProfileSkeleton } from '../../components/common/Skeleton.jsx';
import { getToken } from '../../lib/auth.js';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination State for Roster & Activity Logs
  const [rosterPage, setRosterPage] = useState(1);
  const ROSTER_PAGE_SIZE = 10;
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PAGE_SIZE = 10;

  useEffect(() => {
    let isMounted = true;
    const cacheKey = `teacher_profile_${id}`;

    // 1. Read from client-side sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data && Date.now() - (parsed.timestamp || 0) < 5 * 60 * 1000) {
          setTeacher(parsed.data);
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn('Cache read notice:', e);
    }

    // 2. Fetch live data from backend endpoint
    const fetchTeacherDetail = async () => {
      try {
        const token = getToken();
        const res = await fetch(getApiUrl(`/api/admin/teachers/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && data.teacher && isMounted) {
          setTeacher(data.teacher);
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ timestamp: Date.now(), data: data.teacher })
            );
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Failed to fetch teacher details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTeacherDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const t = teacher || {
    id: id || '',
    employeeId: id || '',
    name: 'Teacher Record Not Found',
    gender: 'N/A',
    email: 'N/A',
    gradeAssigned: 'Unassigned',
    sectionAssigned: 'Unassigned',
    isFacultyInCharge: false,
    status: 'N/A',
    students: [],
    submissionsCount: 0,
    activityLogs: [],
  };

  const handleToggleStatus = async () => {
    if (!t.id) return;
    const newStatus = t.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/teachers/${t.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTeacher((prev) => {
          const updated = { ...prev, status: newStatus };
          try {
            sessionStorage.setItem(
              `teacher_profile_${id}`,
              JSON.stringify({ timestamp: Date.now(), data: updated })
            );
          } catch (e) {}
          return updated;
        });
        showToast(`Teacher account status changed to ${newStatus}.`);
      }
    } catch (err) {
      showToast('Failed to update account status.');
    }
  };

  if (loading && !teacher) {
    return <TeacherProfileSkeleton />;
  }

  const classStudents = t.students || [];
  const activityLogs = t.activityLogs || [];

  // Compute real literacy rate from assigned class students
  const literateStudentsCount = classStudents.filter((std) => {
    const lvl = String(std.level || '').toLowerCase();
    return lvl.includes('independ') || lvl.includes('instruct');
  }).length;
  const literacyRate =
    classStudents.length > 0
      ? `${Math.round((literateStudentsCount / classStudents.length) * 100)}%`
      : '0%';

  return (
    <div className="space-y-6">
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Top Back Navigation */}
      <div className="inline-flex items-center gap-2.5">
        <BackButton to="/admin/teachers" size={20} />
      </div>

      {/* Profile Header Banner */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar
              name={t.name}
              src={t.profileImage || t.profile_image || t.avatarUrl || t.avatar}
              size={88}
              className="text-2xl font-bold shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-ink">{t.name}</h1>
                <span className="rounded-full bg-ink/5 px-2.5 py-0.5 font-mono text-xs font-bold text-ink/70">
                  {t.employeeId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    t.status === 'Active'
                      ? 'bg-[#00a652]/15 text-[#00a652]'
                      : 'bg-brand-red/10 text-brand-red'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <p className="text-xs text-ink/60">{t.email}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div>
                  <span className="text-ink/50">Assigned Class: </span>
                  <span className="font-bold text-ink">
                    {t.gradeAssigned} - {t.sectionAssigned}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-ink/50">Role: </span>
                  {t.isFacultyInCharge ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue border border-brand-blue/20">
                      <ChalkboardTeacher size={14} weight="bold" />
                      <span>Faculty-in-Charge</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-bold text-ink/80 border border-ink/15">
                      <UserSwitch size={14} weight="bold" />
                      <span>Class Adviser</span>
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-ink/50">Gender: </span>
                  <span className="font-semibold text-ink">{t.gender}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-ink/10">
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                t.status === 'Active'
                  ? 'border border-brand-red/30 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white'
                  : 'border border-[#00a652]/30 bg-[#00a652]/10 text-[#00a652] hover:bg-[#00a652] hover:text-white'
              }`}
            >
              {t.status === 'Active' ? <Prohibit size={16} /> : <UserSwitch size={16} />}
              <span>{t.status === 'Active' ? 'Disable Account' : 'Activate Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink/70">Enrolled Students</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Users size={18} weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink">{classStudents.length}</p>
          <p className="mt-0.5 text-[11px] text-ink/50">Section {t.sectionAssigned || 'N/A'}</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink/70">Phil-IRI Submissions</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <FileText size={18} weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink">{t.submissionsCount ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-ink/50">Forms 1A, 1B, 2, 3 & 4</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink/70">Class Literacy Rate</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <TrendUp size={18} weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink">{literacyRate}</p>
          <p className="mt-0.5 text-[11px] text-ink/50">Independent & Instructional</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink/70">Faculty Supervision</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ChalkboardTeacher size={18} weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-brand-blue">
            {t.isFacultyInCharge ? 'Faculty Lead' : 'Class Adviser'}
          </p>
          <p className="mt-0.5 text-[11px] text-ink/50">Official DepEd Assignment</p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="flex items-center gap-4 border-b border-ink/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'roster'
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Student size={16} />
            <span>Assigned Classroom Roster ({classStudents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'logs'
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Clock size={16} />
            <span>Assessment Activity Logs ({activityLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Class Roster */}
        {activeTab === 'roster' && (
          <div className="mt-4 rounded-xl border border-ink/10 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs font-bold text-ink/50">
                    <th className="px-5 py-3.5 text-left w-[20%]">LRN</th>
                    <th className="px-5 py-3.5 text-left w-[35%]">Student Name</th>
                    <th className="px-5 py-3.5 text-left w-[20%]">Gender</th>
                    <th className="px-5 py-3.5 text-left w-[25%]">Reading Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-xs text-ink">
                  {classStudents.length > 0 ? (
                    classStudents
                      .slice((rosterPage - 1) * ROSTER_PAGE_SIZE, rosterPage * ROSTER_PAGE_SIZE)
                      .map((std) => (
                        <tr
                          key={std.lrn}
                          onClick={() => navigate(`/admin/records/students/${std.lrn}`)}
                          className="group hover:bg-ink/[0.02] transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4 font-mono text-ink/80">{std.lrn || '—'}</td>
                          <td className="px-5 py-4 font-bold text-ink group-hover:text-brand-blue transition-colors">
                            {std.name || '—'}
                          </td>
                          <td className="px-5 py-4 text-ink/70">{std.gender || '—'}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                String(std.level || '').toLowerCase().includes('frustrat')
                                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/20'
                                  : String(std.level || '').toLowerCase().includes('instruct')
                                  ? 'bg-[#FEF08A] text-[#854D0E] border-[#CA8A04]/20'
                                  : String(std.level || '').toLowerCase().includes('independ')
                                  ? 'bg-[#D1FAE5] text-[#047857] border-[#047857]/20'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {std.level || 'Pending Evaluation'}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-ink/50">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Clock size={28} className="text-ink/30 mb-1" />
                          <span className="text-xs font-bold text-ink">No Enrolled Students Assigned</span>
                          <span className="text-[11px] text-ink/60">This teacher does not currently advise a section or section has no enrolled students.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Class Roster Pagination */}
            {classStudents.length > 0 && (
              <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
                <span>
                  {classStudents.length === 0
                    ? 'Showing 0 of 0 student records'
                    : `Showing ${(rosterPage - 1) * ROSTER_PAGE_SIZE + 1} to ${Math.min(rosterPage * ROSTER_PAGE_SIZE, classStudents.length)} of ${classStudents.length} student records`}
                </span>
                {Math.ceil(classStudents.length / ROSTER_PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={rosterPage === 1}
                      onClick={() => setRosterPage((p) => Math.max(p - 1, 1))}
                      className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      <CaretLeft size={14} /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(classStudents.length / ROSTER_PAGE_SIZE) }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setRosterPage(pg)}
                          className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            rosterPage === pg
                              ? 'bg-brand-blue text-white shadow-xs'
                              : 'bg-cream border border-ink/10 text-ink/70 hover:bg-ink/5'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={rosterPage === Math.ceil(classStudents.length / ROSTER_PAGE_SIZE)}
                      onClick={() => setRosterPage((p) => Math.min(p + 1, Math.ceil(classStudents.length / ROSTER_PAGE_SIZE)))}
                      className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      Next <CaretRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="mt-4 space-y-3">
            {activityLogs.length > 0 ? (
              <>
                {activityLogs
                  .slice((logsPage - 1) * LOGS_PAGE_SIZE, logsPage * LOGS_PAGE_SIZE)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-ink/10 p-3.5 bg-white text-xs shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                          <CheckCircle size={18} weight="fill" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-ink">{log.title}</h4>
                            {log.status && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  log.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'pending_review'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {log.status === 'completed'
                                  ? 'Completed'
                                  : log.status === 'pending_review'
                                  ? 'Pending Review'
                                  : log.status}
                              </span>
                            )}
                          </div>
                          <p className="text-ink/60 mt-1">{log.detail}</p>
                          <span className="text-[10px] text-ink/40 mt-1 block font-medium">
                            {log.time}
                          </span>
                        </div>
                      </div>
                      {log.readingLevelResult && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            String(log.readingLevelResult || '')
                              .toLowerCase()
                              .includes('frustrat')
                              ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/20'
                              : String(log.readingLevelResult || '')
                                  .toLowerCase()
                                  .includes('instruct')
                              ? 'bg-[#FEF08A] text-[#854D0E] border-[#CA8A04]/20'
                              : String(log.readingLevelResult || '')
                                  .toLowerCase()
                                  .includes('independ')
                              ? 'bg-[#D1FAE5] text-[#047857] border-[#047857]/20'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {log.readingLevelResult}
                        </span>
                      )}
                    </div>
                  ))}

                {/* Activity Logs Pagination */}
                {activityLogs.length > 0 && (
                  <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white text-xs text-ink/60">
                    <span>
                      {activityLogs.length === 0
                        ? 'Showing 0 of 0 assessment logs'
                        : `Showing ${(logsPage - 1) * LOGS_PAGE_SIZE + 1} to ${Math.min(
                            logsPage * LOGS_PAGE_SIZE,
                            activityLogs.length
                          )} of ${activityLogs.length} assessment logs`}
                    </span>
                    {Math.ceil(activityLogs.length / LOGS_PAGE_SIZE) > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={logsPage === 1}
                          onClick={() => setLogsPage((p) => Math.max(p - 1, 1))}
                          className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                        >
                          <CaretLeft size={14} /> Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.ceil(activityLogs.length / LOGS_PAGE_SIZE) },
                            (_, i) => i + 1
                          ).map((pg) => (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setLogsPage(pg)}
                              className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                logsPage === pg
                                  ? 'bg-brand-blue text-white shadow-xs'
                                  : 'bg-cream border border-ink/10 text-ink/70 hover:bg-ink/5'
                              }`}
                            >
                              {pg}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={logsPage === Math.ceil(activityLogs.length / LOGS_PAGE_SIZE)}
                          onClick={() =>
                            setLogsPage((p) =>
                              Math.min(p + 1, Math.ceil(activityLogs.length / LOGS_PAGE_SIZE))
                            )
                          }
                          className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                        >
                          Next <CaretRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Clock size={28} className="text-ink/30 mb-1" />
                  <span className="text-xs font-bold text-ink">No Assessment Logs Found</span>
                  <span className="text-[11px] text-ink/60">
                    This teacher has not created or submitted Phil-IRI reading assessment activities yet.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
