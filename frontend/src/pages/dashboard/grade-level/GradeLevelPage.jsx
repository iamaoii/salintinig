import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  UsersThree,
  ChalkboardTeacher,
  Student,
  Plus,
  Pencil,
  Trash,
  X,
  MagnifyingGlass,
  WarningCircle,
  Calendar,
  Eye,
} from '@phosphor-icons/react';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { getToken } from '../../../lib/auth.js';

const TABS = [
  { key: 'sections', to: '/teacher/grade-level/sections', label: 'Sections' },
  { key: 'faculty', to: '/teacher/grade-level/faculty', label: 'Faculty' },
  { key: 'students', to: '/teacher/grade-level/students', label: 'Students' },
];

export default function GradeLevelPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTabFromPath = () => {
    if (location.pathname.includes('/faculty')) return 'faculty';
    if (location.pathname.includes('/people') || location.pathname.includes('/students')) return 'students';
    return 'sections';
  };

  const activeTab = getActiveTabFromPath();

  const [data, setData] = useState({
    gradeLevel: 'Grade 4',
    ficName: '',
    sections: [],
    teachers: [],
    allTeachers: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal states
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);

  // Form states
  const [sectionFormData, setSectionFormData] = useState({
    sectionName: '',
    adviserId: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchGradeData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/teacher/grade-level', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData);
      } else {
        showToast(resData.error || 'Failed to load grade level overview.');
      }
    } catch (err) {
      console.error('Fetch grade level error:', err);
      showToast('Error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeData();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return (data.students || []).filter((st) => {
      const matchesSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.lrn.includes(searchQuery);
      const matchesSection = sectionFilter === 'All' || st.sectionName === sectionFilter;
      return matchesSearch && matchesSection;
    });
  }, [data.students, searchQuery, sectionFilter]);

  // Available teachers for Section Adviser assignment (filters out teachers who advise another section)
  const availableAdviserTeachers = useMemo(() => {
    const currentSectionId = editingSection?.id;
    const currentAdviserId = sectionFormData?.adviserId;

    // Get set of teacher IDs currently assigned to OTHER sections
    const assignedTeacherIds = new Set();
    (data.sections || []).forEach((sec) => {
      if (sec.advisorId && String(sec.id) !== String(currentSectionId)) {
        assignedTeacherIds.add(String(sec.advisorId));
      }
    });

    return (data.allTeachers || []).filter((tc) => {
      const tId = String(tc.id);
      const isAssignedToOther = assignedTeacherIds.has(tId);
      const isCurrentAdviser = tId === String(currentAdviserId);
      return !isAssignedToOther || isCurrentAdviser;
    });
  }, [data.allTeachers, data.sections, editingSection, sectionFormData.adviserId]);

  // Handlers for section CRUD
  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionFormData.sectionName.trim()) {
      showToast('Section name is required.');
      return;
    }

    try {
      const token = getToken();
      const isEdit = Boolean(editingSection);
      const url = isEdit
        ? `http://localhost:5000/api/teacher/grade-level/sections/${editingSection.id}`
        : 'http://localhost:5000/api/teacher/grade-level/sections';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sectionFormData)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(result.message || (isEdit ? 'Section updated successfully.' : 'Section created successfully.'));
        setShowAddSectionModal(false);
        setEditingSection(null);
        setSectionFormData({ sectionName: '', adviserId: '' });
        fetchGradeData();
      } else {
        showToast(result.error || 'Operation failed.');
      }
    } catch (err) {
      console.error('Save section error:', err);
      showToast('Error communicating with server.');
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:5000/api/teacher/grade-level/sections/${deletingSection.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        showToast('Section deleted successfully.');
        setDeletingSection(null);
        fetchGradeData();
      } else {
        showToast(result.error || 'Failed to delete section.');
      }
    } catch (err) {
      console.error('Delete section error:', err);
      showToast('Error communicating with server.');
    }
  };

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
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Standard SalinTinig Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Grade Overview: {data.gradeLevel}</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Faculty-in-Charge oversight for {data.gradeLevel} sections, class advisers, and enrolled learners
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingSection(null);
              setSectionFormData({ sectionName: '', adviserId: '' });
              setShowAddSectionModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            <span>Add New Section</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner matching Admin style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-ink/50 block">Total Class Sections</span>
            <p className="text-2xl font-bold text-ink mt-0.5">{data.sections?.length || 0}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <UsersThree size={22} weight="bold" />
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-ink/50 block">Assigned Faculty</span>
            <p className="text-2xl font-bold text-ink mt-0.5">{data.teachers?.length || 0}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ChalkboardTeacher size={22} weight="bold" />
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-ink/50 block">Total Enrolled Learners</span>
            <p className="text-2xl font-bold text-ink mt-0.5">{data.students?.length || 0}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#00a652]/10 text-[#00a652]">
            <Student size={22} weight="bold" />
          </div>
        </div>
      </div>

      {/* Tabs Bar matching picture 2 style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10">
        <div className="flex items-center gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              className={({ isActive }) =>
                `shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Filter Controls when in Students Tab */}
        {activeTab === 'students' && (
          <div className="flex flex-wrap items-center gap-2.5 pb-2 sm:pb-0">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-full border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium text-ink focus:border-brand-blue outline-none"
            >
              <option value="All">All Sections</option>
              {(data.sections || []).map((sec) => (
                <option key={sec.id} value={sec.sectionName}>
                  {sec.sectionName}
                </option>
              ))}
            </select>

            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search student or LRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full border border-ink/20 bg-cream pl-9 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue w-56"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-ink/10 bg-cream p-12 text-center shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-ink/60">Loading grade level overview...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: SECTIONS CARDS GRID */}
          {activeTab === 'sections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.sections?.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-ink/10 bg-cream p-10 text-center shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] text-xs text-ink/60">
                  No sections created for {data.gradeLevel} yet. Click "Add New Section" to begin.
                </div>
              ) : (
                data.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                        <div>
                          <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[9px] font-bold text-brand-blue uppercase">
                            {sec.gradeLevel}
                          </span>
                          <h3 className="text-lg font-bold text-ink mt-1">{sec.sectionName}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit section"
                            onClick={() => {
                              setEditingSection(sec);
                              setSectionFormData({
                                sectionName: sec.sectionName,
                                adviserId: sec.advisorId || ''
                              });
                              setShowAddSectionModal(true);
                            }}
                            className="flex size-7 items-center justify-center rounded-full text-ink/60 hover:bg-ink/10 transition-colors cursor-pointer"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title={sec.studentsCount > 0 ? "Cannot delete section with students" : "Delete empty section"}
                            onClick={() => {
                              if (sec.studentsCount > 0) {
                                showToast("Cannot delete a section with enrolled students. Contact admin.");
                                return;
                              }
                              setDeletingSection(sec);
                            }}
                            className={`flex size-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                              sec.studentsCount > 0
                                ? 'text-ink/20 cursor-not-allowed'
                                : 'text-brand-red hover:bg-brand-red/10'
                            }`}
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-ink/50">Class Adviser:</span>
                          <span className="font-semibold text-ink">{sec.adviser || 'Unassigned'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-ink/50">Enrolled Learners:</span>
                          <span className="font-semibold text-ink">{sec.studentsCount} Students</span>
                        </div>

                        {/* Phil-IRI Reading Breakdown Bar */}
                        <div className="pt-3 border-t border-ink/10 mt-3">
                          <span className="text-[10px] font-bold text-ink/50 uppercase tracking-wider block mb-1.5">
                            Phil-IRI Reading Status
                          </span>
                          {(() => {
                            const evaluatedTotal = sec.independentCount + sec.instructionalCount + sec.frustrationalCount;
                            const pendingCount = Math.max(0, sec.studentsCount - evaluatedTotal);
                            return (
                              <>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/10">
                                  {evaluatedTotal > 0 ? (
                                    <>
                                      <div
                                        style={{ width: `${(sec.independentCount / evaluatedTotal) * 100}%` }}
                                        className="bg-[#00a652]"
                                        title={`Independent: ${sec.independentCount}`}
                                      />
                                      <div
                                        style={{ width: `${(sec.instructionalCount / evaluatedTotal) * 100}%` }}
                                        className="bg-amber-500"
                                        title={`Instructional: ${sec.instructionalCount}`}
                                      />
                                      <div
                                        style={{ width: `${(sec.frustrationalCount / evaluatedTotal) * 100}%` }}
                                        className="bg-brand-red"
                                        title={`Frustrational: ${sec.frustrationalCount}`}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full bg-ink/10" />
                                  )}
                                </div>
                                <div className="mt-2 grid grid-cols-4 items-center text-[10px] font-semibold">
                                  <span className="text-[#00a652] text-left">Ind: {sec.independentCount}</span>
                                  <span className="text-amber-600 text-center">Ins: {sec.instructionalCount}</span>
                                  <span className="text-brand-red text-center">Fru: {sec.frustrationalCount}</span>
                                  <span className="text-ink/60 text-right font-medium">Pending: {pendingCount}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: FACULTY LIST TABLE */}
          {activeTab === 'faculty' && (
            <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="text-xs text-ink/70">
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Emp ID</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Teacher Name</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Email Address</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Assigned Section</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Account Status</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teachers?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-ink/10 p-8 text-center text-xs text-ink/50">
                          No faculty assigned to sections in {data.gradeLevel} yet.
                        </td>
                      </tr>
                    ) : (
                      data.teachers.map((tc) => (
                        <tr key={tc.id} className="hover:bg-ink/[0.02] transition-colors text-xs">
                          <td className="border border-ink/10 p-2.5 font-mono text-ink/70">{tc.employeeId || 'N/A'}</td>
                          <td
                            onClick={() => navigate(`/teacher/grade-level/faculty/${tc.employeeId || tc.id}`)}
                            className="border border-ink/10 p-2.5 font-semibold text-brand-blue hover:underline cursor-pointer"
                          >
                            {tc.name}
                          </td>
                          <td className="border border-ink/10 p-2.5 text-ink/70">{tc.email || 'N/A'}</td>
                          <td className="border border-ink/10 p-2.5 font-semibold text-ink">
                            {tc.sectionAssigned || 'Unassigned'}
                          </td>
                          <td className="border border-ink/10 p-2.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                tc.status === 'Active'
                                  ? 'bg-[#00a652]/15 text-[#00a652]'
                                  : 'bg-brand-red/15 text-brand-red'
                              }`}
                            >
                              {tc.status}
                            </span>
                          </td>
                          <td className="border border-ink/10 p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigate(`/teacher/grade-level/faculty/${tc.employeeId || tc.id}`)}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-brand-blue/10 px-3.5 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
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
          )}

          {/* TAB 3: STUDENT MASTERLIST TABLE */}
          {activeTab === 'students' && (
            <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="text-xs text-ink/70">
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Learner Name</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">LRN</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Section</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Gender</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-left">Phil-IRI Reading Status</th>
                      <th className="border border-ink/10 bg-ink/[0.03] p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-ink/10 p-8 text-center text-xs text-ink/50">
                          No student records found matching search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-ink/[0.02] transition-colors text-xs">
                          <td
                            onClick={() => navigate(`/teacher/grade-level/students/${st.lrn}`)}
                            className="border border-ink/10 p-2.5 font-semibold text-brand-blue hover:underline cursor-pointer flex items-center gap-2.5"
                          >
                            <Avatar name={st.name} src={st.profileImage} size={28} />
                            <span>{st.name}</span>
                          </td>
                          <td className="border border-ink/10 p-2.5 font-mono text-ink/70">{st.lrn}</td>
                          <td className="border border-ink/10 p-2.5 font-medium text-ink">{st.sectionName}</td>
                          <td className="border border-ink/10 p-2.5 text-ink/70">{st.gender || 'N/A'}</td>
                          <td className="border border-ink/10 p-2.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getReadingBadgeClass(
                                st.readingLevel
                              )}`}
                            >
                              {st.readingLevel}
                            </span>
                          </td>
                          <td className="border border-ink/10 p-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigate(`/teacher/grade-level/students/${st.lrn}`)}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-brand-blue/10 px-3.5 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors cursor-pointer"
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
          )}
        </>
      )}

      {/* MODAL: ADD / EDIT SECTION */}
      {showAddSectionModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="text-base font-bold text-ink">
                  {editingSection ? 'Edit Section' : `Add Section (${data.gradeLevel})`}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="flex size-7 items-center justify-center rounded-full text-ink/40 hover:bg-ink/10 hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSection} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-ink">Section Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fyang, Acacia, Aguinaldo"
                    value={sectionFormData.sectionName}
                    onChange={(e) =>
                      setSectionFormData({ ...sectionFormData, sectionName: e.target.value })
                    }
                    className="w-full rounded-full border border-ink/20 bg-cream px-4 py-2 text-ink outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Assign Class Adviser</label>
                  <select
                    value={sectionFormData.adviserId}
                    onChange={(e) =>
                      setSectionFormData({ ...sectionFormData, adviserId: e.target.value })
                    }
                    className="w-full rounded-full border border-ink/20 bg-cream px-4 py-2 text-ink outline-none focus:border-brand-blue"
                  >
                    <option value="">No Adviser (Unassigned)</option>
                    {availableAdviserTeachers.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(false)}
                    className="rounded-full border border-ink/10 bg-cream px-4 py-2 font-medium text-ink hover:bg-ink/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-blue px-5 py-2 font-semibold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
                  >
                    {editingSection ? 'Save Changes' : 'Create Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: DELETE SECTION CONFIRMATION */}
      {deletingSection &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-3">
                  <WarningCircle size={24} weight="bold" />
                </div>
                <h3 className="text-base font-bold text-ink">Delete Section?</h3>
                <p className="mt-1 text-xs text-ink/60 leading-relaxed">
                  Are you sure you want to remove section <strong className="text-ink">{deletingSection.sectionName}</strong>? This section has 0 enrolled students.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingSection(null)}
                  className="rounded-full border border-ink/10 bg-cream px-4 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSection}
                  className="rounded-full bg-brand-red px-5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Delete Section
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
