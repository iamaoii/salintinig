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
} from '@phosphor-icons/react';
import BackButton from '../../components/common/BackButton.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      try {
        const token = getToken();
        const res = await fetch(`http://localhost:5000/api/admin/teachers/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && data.teacher) {
          setTeacher(data.teacher);
        }
      } catch (err) {
        console.warn('Failed to fetch teacher details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherDetail();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = async () => {
    if (!t.id) return;
    const newStatus = t.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/teachers/${t.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTeacher((prev) => ({ ...prev, status: newStatus }));
        showToast(`Teacher account status changed to ${newStatus}.`);
      }
    } catch (err) {
      showToast('Failed to update account status.');
    }
  };

  const t = teacher || {
    id: id || '',
    employeeId: id || '',
    name: loading ? 'Loading teacher profile...' : 'Teacher Record Not Found',
    gender: 'N/A',
    email: 'N/A',
    gradeAssigned: 'N/A',
    sectionAssigned: 'N/A',
    isFacultyInCharge: false,
    status: 'N/A',
    students: [],
    submissionsCount: 0,
  };

  const classStudents = t.students || [];

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
        {loading ? (
          <div className="flex animate-pulse items-center gap-5">
            <div className="size-20 rounded-full bg-ink/10" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-md bg-ink/10" />
              <div className="h-4 w-32 rounded-md bg-ink/10" />
              <div className="h-4 w-64 rounded-md bg-ink/10" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar name={t.name} size={88} className="text-2xl font-bold shrink-0" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-ink">{t.name}</h1>
                  <span className="rounded-full bg-ink/5 px-2.5 py-0.5 font-mono text-xs font-bold text-ink/70">
                    {t.employeeId}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      t.status === 'Active' ? 'bg-[#00a652]/15 text-[#00a652]' : 'bg-brand-red/10 text-brand-red'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <p className="text-xs text-ink/60">{t.email}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-ink/50">Assigned Class: </span>
                    <span className="font-bold text-ink">{t.gradeAssigned} - {t.sectionAssigned}</span>
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
        )}
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
          <p className="mt-2 text-2xl font-black text-ink">
            {classStudents.length > 0 ? '88%' : '0%'}
          </p>
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
            <span>Assessment Activity Logs</span>
          </button>
        </div>

        {/* Tab 1: Class Roster */}
        {activeTab === 'roster' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink/70">
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">LRN</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Student Name</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Gender</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Reading Level</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.length > 0 ? (
                  classStudents.map((std) => (
                    <tr key={std.lrn} className="hover:bg-ink/[0.02] transition-colors">
                      <td className="border border-ink/10 p-2 font-mono text-xs text-ink/80">{std.lrn}</td>
                      <td className="border border-ink/10 p-2 font-semibold text-ink">{std.name}</td>
                      <td className="border border-ink/10 p-2 text-xs text-ink/70">{std.gender}</td>
                      <td className="border border-ink/10 p-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300">
                          {std.level || 'Pending Evaluation'}
                        </span>
                      </td>
                      <td className="border border-ink/10 p-2 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/records/students/${std.lrn}`)}
                          className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-ink/10 p-8 text-center text-ink/50">
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
        )}

        {/* Tab 2: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="mt-4 space-y-3">
            {t.activityLogs && t.activityLogs.length > 0 ? (
              t.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-xl border border-ink/10 p-3 bg-white text-xs">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <CheckCircle size={16} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink">{log.title}</h4>
                    <p className="text-ink/60 mt-0.5">{log.detail}</p>
                    <span className="text-[10px] text-ink/40 mt-1 block">{log.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Clock size={28} className="text-ink/30 mb-1" />
                  <span className="text-xs font-bold text-ink">No Assessment Logs Found</span>
                  <span className="text-[11px] text-ink/60">This teacher has not created or submitted Phil-IRI reading assessment activities yet.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
