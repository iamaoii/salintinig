import { useState, useMemo } from 'react';
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
} from '@phosphor-icons/react';
import { initialFacultyAssignments, initialAdminTeachers, sectionsByGrade } from '../../data/adminData.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function AdminFacultyAssignment() {
  const [assignments, setAssignments] = useState(initialFacultyAssignments);
  const [teachers] = useState(initialAdminTeachers);
  const [sections, setSections] = useState(sectionsByGrade);

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
  });
  const [selectedTeacherForGrade, setSelectedTeacherForGrade] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Flat list of sections for the data table
  const allSectionsList = useMemo(() => {
    const list = [];
    Object.entries(sections).forEach(([gradeLevel, sectionArr]) => {
      sectionArr.forEach((sectionName) => {
        // Find assigned lead faculty
        const gradeAssignment = assignments.find((a) => a.gradeLevel === gradeLevel);
        // Find adviser assigned to this section
        const adviser = teachers.find(
          (t) => t.gradeAssigned === gradeLevel && t.sectionAssigned === sectionName
        );

        list.push({
          id: `${gradeLevel}-${sectionName}`,
          gradeLevel,
          sectionName,
          facultyInCharge: gradeAssignment ? gradeAssignment.facultyInCharge : 'Unassigned',
          adviser: adviser ? adviser.name : 'Unassigned Adviser',
          studentsCount: Math.floor(Math.abs(sectionName.length * 7 + 38)), // realistic dummy count
        });
      });
    });
    return list;
  }, [sections, assignments, teachers]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allSectionsList.filter((item) => {
      const matchesGrade = selectedGradeTab === 'All' || item.gradeLevel === selectedGradeTab;
      const matchesSearch =
        !query ||
        item.sectionName.toLowerCase().includes(query) ||
        item.gradeLevel.toLowerCase().includes(query) ||
        item.facultyInCharge.toLowerCase().includes(query) ||
        item.adviser.toLowerCase().includes(query);

      return matchesGrade && matchesSearch;
    });
  }, [allSectionsList, selectedGradeTab, searchQuery]);

  // Handlers
  const handleSaveSection = (e) => {
    e.preventDefault();
    const { gradeLevel, sectionName } = sectionFormData;
    const trimmed = sectionName.trim();
    if (!trimmed) return;

    if (editingSectionData) {
      // Renaming section
      const oldGrade = editingSectionData.grade;
      const oldName = editingSectionData.name;

      if (
        trimmed.toLowerCase() !== oldName.toLowerCase() &&
        sections[oldGrade]?.some((s) => s.toLowerCase() === trimmed.toLowerCase())
      ) {
        showToast(`Section "${trimmed}" already exists in ${oldGrade}!`);
        return;
      }

      setSections((prev) => ({
        ...prev,
        [oldGrade]: prev[oldGrade].map((s) => (s === oldName ? trimmed : s)),
      }));

      showToast(`Section "${oldName}" renamed to "${trimmed}".`);
      setEditingSectionData(null);
    } else {
      // Adding new section
      if (sections[gradeLevel]?.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        showToast(`Section "${trimmed}" already exists in ${gradeLevel}!`);
        return;
      }

      setSections((prev) => {
        const updated = {
          ...prev,
          [gradeLevel]: [...(prev[gradeLevel] || []), trimmed],
        };

        setAssignments((prevAsg) =>
          prevAsg.map((a) =>
            a.gradeLevel === gradeLevel
              ? { ...a, sectionsCount: updated[gradeLevel].length }
              : a
          )
        );

        return updated;
      });

      showToast(`Section "${trimmed}" added to ${gradeLevel}.`);
      setShowAddSectionModal(false);
    }

    setSectionFormData({ gradeLevel: 'Grade 4', sectionName: '' });
  };

  const handleDeleteSection = () => {
    if (!deletingSectionData) return;
    const { grade, name } = deletingSectionData;

    setSections((prev) => {
      const updated = {
        ...prev,
        [grade]: prev[grade].filter((s) => s !== name),
      };

      setAssignments((prevAsg) =>
        prevAsg.map((a) =>
          a.gradeLevel === grade
            ? { ...a, sectionsCount: updated[grade].length }
            : a
        )
      );

      return updated;
    });

    showToast(`Section "${name}" removed from ${grade}.`);
    setDeletingSectionData(null);
  };

  const handleAssignFaculty = (e) => {
    e.preventDefault();
    if (!assigningFacultyGrade || !selectedTeacherForGrade) return;

    const teacherObj = teachers.find((t) => t.name === selectedTeacherForGrade);

    setAssignments((prev) =>
      prev.map((item) =>
        item.gradeLevel === assigningFacultyGrade
          ? {
              ...item,
              facultyInCharge: selectedTeacherForGrade,
              email: teacherObj ? teacherObj.email : item.email,
              status: 'Assigned',
            }
          : item
      )
    );

    showToast(`${selectedTeacherForGrade} assigned as Faculty-in-Charge for ${assigningFacultyGrade}.`);
    setAssigningFacultyGrade(null);
    setSelectedTeacherForGrade('');
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
                <p className="text-xs font-bold text-ink">{item.facultyInCharge || 'Unassigned'}</p>
                <p className="text-[10px] text-ink/50 truncate">{item.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAssigningFacultyGrade(item.gradeLevel);
                setSelectedTeacherForGrade(item.facultyInCharge || '');
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
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-ink/10 p-6 text-center text-ink/40 text-xs">
                    No sections found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="border border-ink/10 p-3 font-bold text-xs text-ink">{sec.gradeLevel}</td>
                    <td className="border border-ink/10 p-3 font-semibold text-xs text-ink/90">{sec.sectionName}</td>
                    <td className="border border-ink/10 p-3 text-xs text-ink/80">{sec.adviser}</td>
                    <td className="border border-ink/10 p-3 text-xs text-ink/70">{sec.studentsCount} Students</td>
                    <td className="border border-ink/10 p-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>12 Independent</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                          <span>8 Instructional</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <span className="size-2 rounded-full bg-red-500 shrink-0" />
                          <span>5 Frustrational</span>
                        </span>
                      </div>
                    </td>
                    <td className="border border-ink/10 p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionData({ grade: sec.gradeLevel, name: sec.sectionName });
                            setSectionFormData({ gradeLevel: sec.gradeLevel, sectionName: sec.sectionName });
                            setShowAddSectionModal(true);
                          }}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="Edit Section Name"
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
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">
                {editingSectionData ? 'Edit Section Name' : 'Add New Section'}
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
        </div>
      )}

      {/* Assign Faculty Modal */}
      {assigningFacultyGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
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
                  required
                  value={selectedTeacherForGrade}
                  onChange={(e) => setSelectedTeacherForGrade(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                >
                  <option value="">Select Faculty Member...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
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
                  disabled={!selectedTeacherForGrade}
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Section Modal */}
      {deletingSectionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
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
        </div>
      )}
    </div>
    </>
  );
}
