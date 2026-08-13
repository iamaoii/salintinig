import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChalkboardTeacher,
  UsersThree,
  Student,
  EnvelopeSimple,
  IdentificationBadge,
  CheckCircle,
  Clock,
  Eye,
  ArrowLeft,
} from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken } from '../../../lib/auth.js';

export default function FicTeacherProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(`http://localhost:5000/api/teacher/faculty/${id}`, {
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

  const getReadingBadgeClass = (level) => {
    switch (level) {
      case 'Independent':
        return 'bg-[#00a652]/15 text-[#00a652] border border-[#00a652]/20';
      case 'Instructional':
        return 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
      case 'Frustrational':
        return 'bg-brand-red/15 text-brand-red border border-brand-red/20';
      default:
        return 'bg-purple-500/15 text-purple-600 border border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} weight="bold" />
        <span className="group-hover:underline">Back to Previous Page</span>
      </button>

      {loading ? (
        <div className="rounded-2xl border border-ink/10 bg-cream p-12 text-center shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-ink/60">Loading teacher profile...</span>
          </div>
        </div>
      ) : !teacher ? (
        <div className="rounded-2xl border border-ink/10 bg-cream p-10 text-center shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] text-xs text-ink/60">
          Teacher profile record not found.
        </div>
      ) : (
        <>
          {/* Main Teacher Profile Header Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar name={teacher.name} size={80} className="text-2xl font-bold shadow-xs" />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-ink">{teacher.name}</h1>
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue uppercase">
                    {teacher.employeeId || 'N/A'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      teacher.status === 'Active'
                        ? 'bg-[#00a652]/15 text-[#00a652]'
                        : 'bg-brand-red/15 text-brand-red'
                    }`}
                  >
                    {teacher.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/70">
                  <div className="flex items-center gap-1.5">
                    <EnvelopeSimple size={15} className="text-ink/50" />
                    <span>{teacher.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChalkboardTeacher size={15} className="text-ink/50" />
                    <span>Assigned Section: <strong className="text-ink">{teacher.sectionAssigned || 'Unassigned'}</strong></span>
                  </div>
                  {teacher.isFacultyInCharge && (
                    <span className="rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                      Faculty In Charge
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-ink/50 block">Enrolled Classroom Students</span>
                <p className="text-2xl font-bold text-ink mt-0.5">{teacher.students?.length || 0}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Student size={22} weight="bold" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-ink/50 block">Phil-IRI Submissions</span>
                <p className="text-2xl font-bold text-ink mt-0.5">{teacher.submissionsCount || 0}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <CheckCircle size={22} weight="bold" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-ink/50 block">Assigned Section</span>
                <p className="text-lg font-bold text-ink mt-0.5">{teacher.sectionAssigned || 'Unassigned'}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#00a652]/10 text-[#00a652]">
                <ChalkboardTeacher size={22} weight="bold" />
              </div>
            </div>
          </div>

          {/* Enrolled Classroom Roster Table */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
              <h2 className="text-sm font-bold text-ink">Assigned Classroom Roster ({teacher.students?.length || 0})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="text-xs text-ink/70">
                    <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Learner Name</th>
                    <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">LRN</th>
                    <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Gender</th>
                    <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Phil-IRI Reading Status</th>
                    <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!teacher.students || teacher.students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-ink/10 p-8 text-center text-xs text-ink/50">
                        This teacher is not currently assigned as adviser to an active section or section has no enrolled students.
                      </td>
                    </tr>
                  ) : (
                    teacher.students.map((st) => (
                      <tr key={st.id || st.lrn} className="hover:bg-ink/[0.02] transition-colors text-xs">
                        <td
                          onClick={() => navigate(`/teacher/grade-level/students/${st.lrn}`)}
                          className="border border-ink/10 p-2.5 font-semibold text-brand-blue hover:underline cursor-pointer flex items-center gap-2.5"
                        >
                          <Avatar name={st.name} size={28} />
                          <span>{st.name}</span>
                        </td>
                        <td className="border border-ink/10 p-2.5 font-mono text-ink/70">{st.lrn}</td>
                        <td className="border border-ink/10 p-2.5 text-ink/70">{st.gender || 'N/A'}</td>
                        <td className="border border-ink/10 p-2.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getReadingBadgeClass(
                              st.level
                            )}`}
                          >
                            {st.level || 'Pending Evaluation'}
                          </span>
                        </td>
                        <td className="border border-ink/10 p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/teacher/grade-level/students/${st.lrn}`)}
                            className="inline-flex items-center rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
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
