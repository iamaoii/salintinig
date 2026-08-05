import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash,
  CheckCircle,
  X,
  MagnifyingGlass,
  ChalkboardTeacher,
  UserSwitch,
  IdentificationCard,
  Calendar,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import AdminSchoolYearModal from '../../components/admin/AdminSchoolYearModal.jsx';

export default function AdminFacultyAssignment() {
  const [assignments, setAssignments] = useState([
    { id: '1', gradeLevel: 'Grade 4', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
    { id: '2', gradeLevel: 'Grade 5', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
    { id: '3', gradeLevel: 'Grade 6', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
  ]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState({
    'Grade 4': [],
    'Grade 5': [],
    'Grade 6': [],
  });
  const [loading, setLoading] = useState(true);

  // School Year State
  const [activeSchoolYear, setActiveSchoolYear] = useState(null);
  const [showSchoolYearModal, setShowSchoolYearModal] = useState(false);

  // Filters & Search
  const [selectedGradeTab, setSelectedGradeTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [editingSectionData, setEditingSectionData] = useState(null); // { grade, name }
  const [deletingSectionData, setDeletingSectionData] = useState(null); // { grade, name }
  const [assigningFacultyGrade, setAssigningFacultyGrade] = useState(null);

  // Form states
  const [sectionFormData, setSectionFormData] = useState({
    gradeLevel: 'Grade 4',
    sectionName: '',
    adviserId: '',
  });
  const [selectedTeacherForGrade, setSelectedTeacherForGrade] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isModalOpen = Boolean(showAddSectionModal || assigningFacultyGrade || deletingSectionData || showSchoolYearModal);
    if (isModalOpen) {
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
  }, [showAddSectionModal, assigningFacultyGrade, deletingSectionData, showSchoolYearModal]);

  const [dbSectionsList, setDbSectionsList] = useState([]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Teachers
      const tchRes = await fetch('http://localhost:5000/api/admin/teachers', { headers: authHeaders });
      const tchData = await tchRes.json();
      if (tchRes.ok && tchData.success) {
        setTeachers(tchData.teachers || []);
      }

      // 2. Fetch Sections
      const secRes = await fetch('http://localhost:5000/api/admin/sections', { headers: authHeaders });
      const secData = await secRes.json();
      if (secRes.ok && secData.success) {
        if (secData.sections) {
          setSections(secData.sections);
        }
        if (secData.allSections) {
          setDbSectionsList(secData.allSections);
        }
      }

      // 3. Fetch Faculty Assignments
      const asgRes = await fetch('http://localhost:5000/api/admin/faculty-assignments', { headers: authHeaders });
      const asgData = await asgRes.json();
      const fetchedAssignments = (asgRes.ok && asgData.success && asgData.assignments) ? asgData.assignments : [];

      setAssignments([
        { id: '1', gradeLevel: 'Grade 4', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
        { id: '2', gradeLevel: 'Grade 5', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
        { id: '3', gradeLevel: 'Grade 6', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
      ].map((g) => {
        const found = fetchedAssignments.find((a) => a.gradeLevel === g.gradeLevel);
        return found ? { ...g, facultyInCharge: found.facultyInCharge, status: 'Assigned' } : g;
      }));

      // 4. Fetch School Years
      const syRes = await fetch('http://localhost:5000/api/admin/school-years', { headers: authHeaders });
      const syData = await syRes.json();
      if (syRes.ok && syData.success && syData.schoolYears) {
        const active = syData.schoolYears.find((s) => s.isActive);
        if (active) {
          setActiveSchoolYear(active.schoolYear);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch faculty assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();

    const handleSYChange = () => fetchAssignmentData();
    window.addEventListener('schoolYearChanged', handleSYChange);
    return () => window.removeEventListener('schoolYearChanged', handleSYChange);
  }, []);

  const uniqueTeachers = useMemo(() => {
    const map = new Map();
    (teachers || []).forEach((t) => {
      const key = t.id || t.employeeId || t.name;
      if (!map.has(key)) map.set(key, t);
    });
    return Array.from(map.values());
  }, [teachers]);

  // Flat list of sections for the data table
  const allSectionsList = useMemo(() => {
    if (dbSectionsList && dbSectionsList.length > 0) {
      return dbSectionsList.map((item) => {
        const gradeAssignment = assignments.find((a) => a.gradeLevel === item.gradeLevel);
        return {
          ...item,
          id: item.id || `${item.gradeLevel}-${item.sectionName}`,
          facultyInCharge: gradeAssignment ? gradeAssignment.facultyInCharge : 'Unassigned',
          adviser: item.adviser || 'Unassigned Adviser',
        };
      });
    }

    const list = [];
    Object.entries(sections).forEach(([gradeLevel, sectionArr]) => {
      sectionArr.forEach((sectionName) => {
        const gradeAssignment = assignments.find((a) => a.gradeLevel === gradeLevel);
        const adviser = teachers.find(
          (t) => t.gradeAssigned === gradeLevel && t.sectionAssigned === sectionName
        );

        list.push({
          id: `${gradeLevel}-${sectionName}`,
          gradeLevel,
          sectionName,
          facultyInCharge: gradeAssignment ? gradeAssignment.facultyInCharge : 'Unassigned',
          adviser: adviser ? adviser.name : 'Unassigned Adviser',
          studentsCount: 0,
          independentCount: 0,
          instructionalCount: 0,
          frustrationalCount: 0,
        });
      });
    });
    return list;
  }, [dbSectionsList, sections, assignments, teachers]);

  // Filtered list based on tabs and search
  const filteredSections = useMemo(() => {
    return allSectionsList.filter((sec) => {
      const matchesGrade = selectedGradeTab === 'All' || sec.gradeLevel === selectedGradeTab;
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        sec.sectionName.toLowerCase().includes(search) ||
        (sec.adviser && sec.adviser.toLowerCase().includes(search)) ||
        sec.gradeLevel.toLowerCase().includes(search);
      return matchesGrade && matchesSearch;
    });
  }, [allSectionsList, selectedGradeTab, searchQuery]);

  // Handlers
  const handleSaveSection = async (e) => {
    e.preventDefault();
    const { gradeLevel, sectionName, adviserId } = sectionFormData;
    const trimmed = sectionName.trim();
    if (!trimmed) return;

    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (editingSectionData) {
        // Renaming section or updating adviser
        const targetId = editingSectionData.id || editingSectionData.name;
        const res = await fetch(`http://localhost:5000/api/admin/sections/${targetId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            gradeLevel: editingSectionData.grade,
            sectionName: trimmed,
            adviserId: adviserId || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Section "${trimmed}" updated successfully.`);
          fetchAssignmentData();
          setEditingSectionData(null);
          setShowAddSectionModal(false);
        } else {
          showToast(data.error || 'Failed to update section.');
        }
      } else {
        // Adding new section
        const res = await fetch('http://localhost:5000/api/admin/sections', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            gradeLevel,
            sectionName: trimmed,
            adviserId: adviserId || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Section "${trimmed}" added to ${gradeLevel}.`);
          fetchAssignmentData();
          setShowAddSectionModal(false);
        } else {
          showToast(data.error || 'Failed to create section.');
        }
      }
    } catch (err) {
      showToast('Error saving section.');
    }
    setSectionFormData({ gradeLevel: 'Grade 4', sectionName: '', adviserId: '' });
  };

  const handleDeleteSection = async () => {
    if (!deletingSectionData) return;
    const { grade, name } = deletingSectionData;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/sections/${name}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Section "${name}" removed from ${grade}.`);
        fetchAssignmentData();
      } else {
        showToast(data.error || 'Failed to delete section.');
      }
    } catch (err) {
      showToast('Error deleting section.');
    } finally {
      setDeletingSectionData(null);
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    if (!assigningFacultyGrade) return;

    try {
      const token = localStorage.getItem('token');
      const teacherObj = selectedTeacherForGrade
        ? teachers.find((t) => t.name === selectedTeacherForGrade || t.id === selectedTeacherForGrade)
        : null;

      const res = await fetch('http://localhost:5000/api/admin/faculty-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gradeLevel: assigningFacultyGrade,
          teacherId: teacherObj ? teacherObj.id : null,
          teacherName: selectedTeacherForGrade || '',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          selectedTeacherForGrade
            ? `Faculty-in-Charge for ${assigningFacultyGrade} updated to ${selectedTeacherForGrade}.`
            : `Faculty-in-Charge for ${assigningFacultyGrade} set to Unassigned.`
        );
        fetchAssignmentData();
        setAssigningFacultyGrade(null);
      } else {
        showToast(data.error || 'Failed to update faculty assignment.');
      }
    } catch (err) {
      showToast('Error updating faculty assignment.');
    } finally {
      setAssigningFacultyGrade(null);
      setSelectedTeacherForGrade('');
    }
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">

      {/* Standard Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IdentificationCard size={26} className="text-brand-red" />
            <h1 className="text-2xl font-bold text-ink">Section & Faculty Management</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            Manage school sections, class assignments, and grade-level Faculty-in-Charge supervisors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSchoolYearModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink hover:bg-ink/5 transition-colors cursor-pointer shadow-xs"
            title="Manage Academic School Years"
          >
            <Calendar size={16} className="text-brand-blue" weight="bold" />
            {loading || !activeSchoolYear ? (
              <div className="h-3.5 w-20 animate-pulse rounded bg-ink/10 my-0.5" />
            ) : (
              <>
                <span>S.Y. {activeSchoolYear}</span>
                <span className="rounded-full bg-[#00a652]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#00a652] uppercase">Active</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSectionData(null);
              setSectionFormData({ gradeLevel: 'Grade 4', sectionName: '' });
              setShowAddSectionModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            <span>Add New Section</span>
          </button>
        </div>
      </div>

      {/* Grade Level Faculty-in-Charge Bar (Clean standard Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assignments.map((item) => (
          <div
            key={item.gradeLevel}
            className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_3px_6px_rgba(0,0,0,0.03)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-ink/10 pb-2.5">
                <span className="text-sm font-bold text-ink">{item.gradeLevel}</span>
                <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
                  {sections[item.gradeLevel]?.length || 0} Sections
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-[11px] text-ink/50 block">Faculty-in-Charge:</span>
                {loading ? (
                  <div className="h-4 w-32 animate-pulse rounded-md bg-ink/10 my-0.5" />
                ) : (
                  <p className="text-xs font-bold text-ink">{item.facultyInCharge || 'Unassigned'}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAssigningFacultyGrade(item.gradeLevel);
                setSelectedTeacherForGrade(item.facultyInCharge === 'Unassigned' ? '' : item.facultyInCharge || '');
              }}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-ink/15 bg-white py-1.5 text-xs font-semibold text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <UserSwitch size={14} />
              <span>Change Faculty-in-Charge</span>
            </button>
          </div>
        ))}
      </div>

      {/* Sections Table & Controls (Matching Standard Admin Table Pattern) */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 pb-4">
          {/* Grade Level Tabs */}
          <div className="flex items-center gap-1.5 bg-ink/5 p-1 rounded-xl">
            {['All', 'Grade 4', 'Grade 5', 'Grade 6'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedGradeTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  selectedGradeTab === tab
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search section or adviser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/20 bg-white pl-9 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Master Section Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink/70">
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left w-[10%]">Grade Level</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left w-[14%]">Section Name</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left w-[20%]">Class Adviser</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left w-[14%]">Enrolled Students</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-left w-[32%] whitespace-nowrap">Reading Level Profile</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-3 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="border border-ink/10 p-8 text-center text-ink/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold">Loading class sections...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-ink/10 p-10 text-center">
                    <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-2">
                      <ChalkboardTeacher size={40} className="text-ink/30" />
                      <h4 className="text-sm font-bold text-ink">
                        {allSectionsList.length === 0 ? 'No Class Sections Found' : 'No Matching Class Sections'}
                      </h4>
                      <p className="text-xs text-ink/60 leading-relaxed">
                        {allSectionsList.length === 0
                          ? 'There are currently no class sections in your database. Click "Add New Section" to create a section.'
                          : 'No class sections found matching your search.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="border border-ink/10 p-3 font-bold text-xs text-ink">{sec.gradeLevel}</td>
                    <td className="border border-ink/10 p-3 font-semibold text-xs text-ink/90">{sec.sectionName}</td>
                    <td className="border border-ink/10 p-3 text-xs text-ink/80">{sec.adviser}</td>
                    <td className="border border-ink/10 p-3 text-xs text-ink/70">{sec.studentsCount || 0} Students</td>
                    <td className="border border-ink/10 p-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{sec.independentCount || 0} Independent</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                          <span>{sec.instructionalCount || 0} Instructional</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <span className="size-2 rounded-full bg-red-500 shrink-0" />
                          <span>{sec.frustrationalCount || 0} Frustrational</span>
                        </span>
                      </div>
                    </td>
                    <td className="border border-ink/10 p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionData({ id: sec.id, grade: sec.gradeLevel, name: sec.sectionName });
                            setSectionFormData({ gradeLevel: sec.gradeLevel, sectionName: sec.sectionName, adviserId: sec.adviserId || '' });
                            setShowAddSectionModal(true);
                          }}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="Edit Section & Adviser"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSectionData({ grade: sec.gradeLevel, name: sec.sectionName })}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-brand-red/10 hover:text-brand-red cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-ink/50 pt-2">
          <span>Showing {filteredSections.length} section records</span>
        </div>
      </div>

      {/* Add / Edit Section Modal */}
      {showAddSectionModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">
                {editingSectionData ? 'Edit Section Details' : 'Add New Section'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddSectionModal(false);
                  setEditingSectionData(null);
                }}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink/80 block mb-1">Grade Level</label>
                <select
                  disabled={!!editingSectionData}
                  value={sectionFormData.gradeLevel}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, gradeLevel: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue disabled:opacity-60"
                >
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-ink/80 block mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sampaguita"
                  value={sectionFormData.sectionName}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, sectionName: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink/80 block mb-1">Class Adviser (Optional)</label>
                <select
                  value={sectionFormData.adviserId || ''}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, adviserId: e.target.value })}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue cursor-pointer"
                >
                  <option value="">Unassigned (No Adviser)</option>
                  {uniqueTeachers.map((t) => (
                    <option key={t.id || t.employeeId || t.name} value={t.id}>
                      {t.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSectionModal(false);
                    setEditingSectionData(null);
                  }}
                  className="rounded-full border border-ink/20 bg-white px-4 py-2 text-xs font-semibold text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {editingSectionData ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Faculty Modal */}
      {assigningFacultyGrade && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">Assign Faculty-in-Charge</h3>
              <button
                type="button"
                onClick={() => setAssigningFacultyGrade(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignFaculty} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink/80 block mb-1">Target Grade Level</label>
                <input
                  type="text"
                  disabled
                  value={assigningFacultyGrade}
                  className="w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-bold text-ink outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-ink/80 block mb-1">Select Faculty Member</label>
                <select
                  value={selectedTeacherForGrade}
                  onChange={(e) => setSelectedTeacherForGrade(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue cursor-pointer"
                >
                  <option value="">Unassigned (No Faculty-in-Charge)</option>
                  {uniqueTeachers.map((t) => (
                    <option key={t.id || t.employeeId || t.name} value={t.name}>
                      {t.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setAssigningFacultyGrade(null)}
                  className="rounded-full border border-ink/20 bg-white px-4 py-2 text-xs font-semibold text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Section Modal */}
      {deletingSectionData && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in text-xs">
            <h3 className="text-base font-bold text-ink">Delete Section?</h3>
            <p className="mt-2 text-ink/70">
              Are you sure you want to remove section <span className="font-bold text-ink">"{deletingSectionData.name}"</span> from <span className="font-bold text-ink">{deletingSectionData.grade}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSectionData(null)}
                className="rounded-full border border-ink/20 bg-white px-4 py-2 font-semibold text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSection}
                className="rounded-full bg-brand-red px-5 py-2 font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* School Year Manager Modal */}
      <AdminSchoolYearModal
        isOpen={showSchoolYearModal}
        onClose={() => setShowSchoolYearModal(false)}
        onSchoolYearChanged={fetchAssignmentData}
      />
    </div>
    </>
  );
}
