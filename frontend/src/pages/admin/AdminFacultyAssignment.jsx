import { getApiUrl } from '../../config/api.js';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Plus,
  Pencil,
  Trash,
  X,
  MagnifyingGlass,
  ChalkboardTeacher,
  UserSwitch,
  Calendar,
  CaretLeft,
  CaretRight,
  UserCheck,
  Users,
  CheckCircle,
  Info,
  Check,
  Clock,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import AdminSchoolYearModal from '../../components/admin/AdminSchoolYearModal.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';


export default function AdminFacultyAssignment() {
  const location = useLocation();
  const isSectioningTab = location.pathname.endsWith('/sectioning');

  // Student Sectioning State
  const [sectioningStudents, setSectioningStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetAssignSection, setTargetAssignSection] = useState('');
  const [sectioningGradeFilter, setSectioningGradeFilter] = useState('All');
  const [sectioningStatusFilter, setSectioningStatusFilter] = useState('All');
  const [sectioningSearchQuery, setSectioningSearchQuery] = useState('');
  const [sectioningPage, setSectioningPage] = useState(1);
  const SECTIONING_PAGE_SIZE = 10;
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [showSectioningHelp, setShowSectioningHelp] = useState(true);

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
      // Check dual-layer cache first for 0ms initial render
      const cachedTch = cacheService.get('admin_teachers');
      const cachedSec = cacheService.get('admin_sections');
      const cachedAsg = cacheService.get('admin_faculty_assignments');
      const cachedSy = cacheService.get('admin_school_years');

      if (cachedTch && cachedSec && cachedAsg) {
        setTeachers(cachedTch);
        setSections(cachedSec.sections || {});
        setDbSectionsList(cachedSec.allSections || []);
        setAssignments(cachedAsg);
        if (cachedSy) setActiveSchoolYear(cachedSy);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = getToken();
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // Concurrent parallel fetch (4 requests triggered simultaneously)
      const [tchRes, secRes, asgRes, syRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/teachers'), { headers: authHeaders }).catch(() => null),
        fetch(getApiUrl('/api/admin/sections'), { headers: authHeaders }).catch(() => null),
        fetch(getApiUrl('/api/admin/faculty-assignments'), { headers: authHeaders }).catch(() => null),
        fetch(getApiUrl('/api/admin/school-years'), { headers: authHeaders }).catch(() => null),
      ]);

      if (tchRes?.ok) {
        const tchData = await tchRes.json();
        if (tchData.success) {
          setTeachers(tchData.teachers || []);
          cacheService.set('admin_teachers', tchData.teachers || []);
        }
      }

      let newSections = {};
      let newDbSectionsList = [];
      if (secRes?.ok) {
        const secData = await secRes.json();
        if (secData.success) {
          if (secData.sections) newSections = secData.sections;
          if (secData.allSections) newDbSectionsList = secData.allSections;
          setSections(newSections);
          setDbSectionsList(newDbSectionsList);
          cacheService.set('admin_sections', { sections: newSections, allSections: newDbSectionsList });
        }
      }

      if (asgRes?.ok) {
        const asgData = await asgRes.json();
        const fetchedAssignments = (asgData.success && asgData.assignments) ? asgData.assignments : [];
        const formattedAsg = [
          { id: '1', gradeLevel: 'Grade 4', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
          { id: '2', gradeLevel: 'Grade 5', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
          { id: '3', gradeLevel: 'Grade 6', facultyInCharge: 'Unassigned', sectionsCount: 0, status: 'Active' },
        ].map((g) => {
          const found = fetchedAssignments.find((a) => a.gradeLevel === g.gradeLevel);
          return found ? { ...g, facultyInCharge: found.facultyInCharge, status: 'Assigned' } : g;
        });
        setAssignments(formattedAsg);
        cacheService.set('admin_faculty_assignments', formattedAsg);
      }

      if (syRes?.ok) {
        const syData = await syRes.json();
        if (syData.success && syData.schoolYears) {
          const active = syData.schoolYears.find((s) => s.isActive);
          if (active) {
            setActiveSchoolYear(active.schoolYear);
            cacheService.set('admin_school_years', active.schoolYear);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch faculty assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentSectioning = async (skipCache = false) => {
    try {
      const cached = cacheService.get('admin_student_sectioning');
      if (cached && !skipCache) {
        setSectioningStudents(cached);
      }
      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/student-sectioning'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSectioningStudents(data.students || []);
        cacheService.set('admin_student_sectioning', data.students || []);
      }
    } catch (err) {
      console.warn('Failed to fetch student sectioning:', err);
    }
  };

  const handleBulkAssignStudents = async () => {
    if (selectedStudentIds.length === 0 || !targetAssignSection) return;
    try {
      setIsBulkAssigning(true);
      const token = getToken();

      // Find the selected target section object to know its gradeLevel
      const targetSecObj = (allSectionsList || []).find((s) => s.sectionName === targetAssignSection);
      const targetGrade = targetSecObj?.gradeLevel || (sectioningGradeFilter !== 'All' ? sectioningGradeFilter : 'Grade 4');

      const res = await fetch(getApiUrl('/api/admin/assign-students-section'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          sectionName: targetAssignSection,
          gradeLevel: targetGrade,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Students assigned to section.');
        setSelectedStudentIds([]);
        setTargetAssignSection('');
        cacheService.invalidate('admin_student_sectioning');
        fetchStudentSectioning(true);
        fetchAssignmentData();
      } else {
        showToast(data.error || 'Failed to assign students.');
      }
    } catch (err) {
      showToast('Error assigning students.');
    } finally {
      setIsBulkAssigning(false);
    }
  };



  useEffect(() => {
    fetchAssignmentData();
    if (isSectioningTab) {
      fetchStudentSectioning();
    }

    // Real-time background sync every 6 seconds (bypassing cache for fresh DB state)
    const pollInterval = setInterval(() => {
      fetchAssignmentData(true);
      if (isSectioningTab) {
        fetchStudentSectioning(true);
      }
    }, 6000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isSectioningTab]);

  // Sectioning Summary Counters
  const sectioningStats = useMemo(() => {
    const total = (sectioningStudents || []).length;
    const unassigned = (sectioningStudents || []).filter(
      (s) => !s.sectionName || s.sectionName === 'Unassigned'
    ).length;
    const assigned = total - unassigned;
    return { total, unassigned, assigned };
  }, [sectioningStudents]);

  // Sectioning Filtered & Paginated List
  const filteredSectioningStudents = useMemo(() => {
    return (sectioningStudents || []).filter((std) => {
      const matchesGrade = sectioningGradeFilter === 'All' || std.gradeLevel === sectioningGradeFilter;
      const isUnassigned = !std.sectionName || std.sectionName === 'Unassigned';
      const matchesStatus =
        sectioningStatusFilter === 'All' ||
        (sectioningStatusFilter === 'Unassigned' && isUnassigned) ||
        (sectioningStatusFilter === 'Assigned' && !isUnassigned);

      const query = sectioningSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (std.name || '').toLowerCase().includes(query) ||
        (std.lrn || '').toLowerCase().includes(query) ||
        (std.sectionName || '').toLowerCase().includes(query);

      return matchesGrade && matchesStatus && matchesSearch;
    });
  }, [sectioningStudents, sectioningGradeFilter, sectioningStatusFilter, sectioningSearchQuery]);

  const totalSectioningPages = Math.ceil(filteredSectioningStudents.length / SECTIONING_PAGE_SIZE) || 1;

  const paginatedSectioningStudents = useMemo(() => {
    const start = (sectioningPage - 1) * SECTIONING_PAGE_SIZE;
    return filteredSectioningStudents.slice(start, start + SECTIONING_PAGE_SIZE);
  }, [filteredSectioningStudents, sectioningPage]);

  // Reset sectioning pagination when search or filters change
  useEffect(() => {
    setSectioningPage(1);
  }, [sectioningGradeFilter, sectioningStatusFilter, sectioningSearchQuery]);

  const handleAssignSingleStudent = async (studentId, sectionName, gradeLevel) => {
    if (!studentId || !sectionName) return;
    try {
      setIsBulkAssigning(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/assign-students-section'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentIds: [studentId],
          sectionName,
          gradeLevel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Student assigned to section ${sectionName}.`);
        cacheService.invalidate('admin_student_sectioning');
        fetchStudentSectioning(true);
        fetchAssignmentData();
      } else {
        showToast(data.error || 'Failed to assign student.');
      }
    } catch (err) {
      showToast('Error assigning student.');
    } finally {
      setIsBulkAssigning(false);
    }
  };

  // All unique teachers for Faculty-in-Charge assignment (allows advisers to also be faculty-in-charge)
  const allTeachers = useMemo(() => {
    const map = new Map();
    (teachers || []).forEach((t) => {
      const key = t.id || t.employeeId || t.name;
      if (!map.has(key)) map.set(key, t);
    });
    return Array.from(map.values());
  }, [teachers]);

  // Available teachers for Section Adviser assignment (filters out teachers who already advise another section)
  const adviserTeachers = useMemo(() => {
    const map = new Map();
    const currentSectionId = editingSectionData?.id || editingSectionData?.name;
    const currentAdviserId = sectionFormData?.adviserId;

    // Get set of teacher IDs/names that are currently assigned to OTHER sections
    const assignedTeacherIds = new Set();
    (dbSectionsList || []).forEach((sec) => {
      const secId = sec.id || sec.name;
      if (sec.adviserId && secId !== currentSectionId) {
        assignedTeacherIds.add(String(sec.adviserId));
      }
    });

    (teachers || []).forEach((t) => {
      const key = t.id || t.employeeId || t.name;
      const tId = String(t.id || t.employeeId || '');
      const tName = String(t.name || '');

      const isAssigned = assignedTeacherIds.has(tId) || assignedTeacherIds.has(tName);
      const isCurrentAdviser = tId === String(currentAdviserId) || tName === String(currentAdviserId);

      if (!map.has(key)) {
        if (!isAssigned || isCurrentAdviser) {
          map.set(key, t);
        }
      }
    });
    return Array.from(map.values());
  }, [teachers, dbSectionsList, editingSectionData, sectionFormData]);

  // Flat list of sections for the data table
  const allSectionsList = useMemo(() => {
    if (dbSectionsList && dbSectionsList.length > 0) {
      return dbSectionsList.map((item) => {
        const gradeAssignment = assignments.find((a) => a.gradeLevel === item.gradeLevel);
        return {
          ...item,
          id: item.id || `${item.gradeLevel}-${item.sectionName}`,
          facultyInCharge: gradeAssignment ? gradeAssignment.facultyInCharge : '—',
          adviser: item.adviser && String(item.adviser).trim() !== '' && String(item.adviser).trim() !== 'Unassigned Adviser' ? String(item.adviser).trim() : '—',
          studentsCount: Number(item.studentsCount || 0),
          independentCount: Number(item.independentCount || 0),
          instructionalCount: Number(item.instructionalCount || 0),
          frustrationalCount: Number(item.frustrationalCount || 0),
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
          facultyInCharge: gradeAssignment ? gradeAssignment.facultyInCharge : '—',
          adviser: adviser ? adviser.name : '—',
          studentsCount: 0,
          independentCount: 0,
          instructionalCount: 0,
          frustrationalCount: 0,
        });
      });
    });
    return list;
  }, [dbSectionsList, sections, assignments, teachers]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGradeTab, searchQuery]);

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

  const totalPages = Math.ceil(filteredSections.length / PAGE_SIZE) || 1;

  const paginatedSections = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSections.slice(start, start + PAGE_SIZE);
  }, [filteredSections, currentPage]);

  // Handlers
  const handleSaveSection = async (e) => {
    e.preventDefault();
    const { gradeLevel, sectionName, adviserId } = sectionFormData;
    const trimmed = sectionName.trim();
    if (!trimmed) return;

    try {
      const token = getToken();
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (editingSectionData) {
        // Renaming section or updating adviser
        const targetId = editingSectionData.id || editingSectionData.name;
        const res = await fetch(getApiUrl(`/api/admin/sections/${targetId}`), {
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
        const res = await fetch(getApiUrl('/api/admin/sections'), {
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
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/sections/${name}`), {
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
      const token = getToken();
      const teacherObj = selectedTeacherForGrade
        ? teachers.find((t) => t.name === selectedTeacherForGrade || t.id === selectedTeacherForGrade)
        : null;

      const res = await fetch(getApiUrl('/api/admin/faculty-assignments'), {
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

      {/* Page Content Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ChalkboardTeacher size={22} className="text-brand-red shrink-0" />
            <h2 className="text-xl font-bold text-ink">
              {isSectioningTab ? 'Student Sectioning' : 'Sections & Faculty'}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">
            {isSectioningTab
              ? 'Assign unassigned students to new Academic Year sections and set promotion statuses'
              : 'Manage school sections, assigned class advisers, and grade-level Faculty-in-Charge supervisors'}
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

          {!isSectioningTab && (
            <button
              type="button"
              onClick={() => {
                setEditingSectionData(null);
                setSectionFormData({ gradeLevel: 'Grade 4', sectionName: '', adviserId: '' });
                setShowAddSectionModal(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus size={15} weight="bold" />
              <span>Add New Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Student Sectioning View if on /sectioning */}
      {isSectioningTab ? (
        <div className="space-y-5">
          {/* Sectioning Summary Metric Counters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink/70">Unassigned Learners</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <UserSwitch size={18} weight="bold" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600">{sectioningStats.unassigned}</p>
              <p className="mt-0.5 text-[11px] text-ink/50">Needs section assignment for S.Y. {activeSchoolYear || 'Active'}</p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink/70">Assigned Learners</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <UserCheck size={18} weight="bold" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600">{sectioningStats.assigned}</p>
              <p className="mt-0.5 text-[11px] text-ink/50">Successfully placed in section</p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink/70">Total Enrolled Learners</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                  <Users size={18} weight="bold" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-ink">{sectioningStats.total}</p>
              <p className="mt-0.5 text-[11px] text-ink/50">Active school year roster</p>
            </div>
          </div>

          {/* Quick How-To Workflow Banner */}
          {showSectioningHelp && (
            <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-xs shadow-xs relative animate-in fade-in">
              <button
                type="button"
                onClick={() => setShowSectioningHelp(false)}
                className="absolute top-3 right-3 text-ink/40 hover:text-ink cursor-pointer p-1 rounded-lg"
                title="Dismiss tip"
              >
                <X size={16} />
              </button>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                  <Info size={16} weight="bold" />
                </div>
                <div className="space-y-1 pr-6">
                  <h4 className="font-bold text-ink">How to Assign Students to Sections:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-ink/70 text-[11px]">
                    <li><strong>Filter & Search:</strong> Select grade level or search student by Name / LRN.</li>
                    <li><strong>Select Students:</strong> Check the boxes for students you want to section together.</li>
                    <li><strong>Assign Section:</strong> Pick the target section in the top bar and click <strong>Assign Selected</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-4">
            {/* Header & Sticky Bulk Assignment Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">Student Sectioning Roster</span>
                <span className="text-xs font-bold text-brand-blue font-mono bg-brand-blue/10 px-2.5 py-0.5 rounded-full">
                  S.Y. {activeSchoolYear || 'Active'}
                </span>
              </div>

              {/* Bulk Sectioning Floating Action Control */}
              {selectedStudentIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 bg-brand-blue/10 border border-brand-blue/25 p-2.5 rounded-xl animate-in fade-in shadow-xs">
                  <span className="text-xs font-bold text-brand-blue flex items-center gap-1.5 px-1">
                    <CheckCircle size={16} weight="fill" />
                    <span>{selectedStudentIds.length} Learner(s) Selected</span>
                  </span>
                  {(() => {
                    const selectedGrades = Array.from(
                      new Set(
                        (sectioningStudents || [])
                          .filter((std) => selectedStudentIds.includes(std.studentId))
                          .map((std) => std.gradeLevel)
                          .filter(Boolean)
                      )
                    );
                    const isMixedGrades = selectedGrades.length > 1;

                    return (
                      <>
                        {isMixedGrades ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1">
                            ⚠️ Selected learners belong to different grade levels ({selectedGrades.join(', ')}). Please filter by a single grade level to bulk assign.
                          </span>
                        ) : (
                          <select
                            value={targetAssignSection}
                            onChange={(e) => setTargetAssignSection(e.target.value)}
                            className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink font-semibold outline-none focus:border-brand-blue cursor-pointer"
                          >
                            <option value="">-- Select Target Section --</option>
                            {(allSectionsList || [])
                              .filter((s) => selectedGrades.length === 0 || s.gradeLevel === selectedGrades[0])
                              .map((s) => (
                                <option key={s.id} value={s.sectionName}>
                                  {s.gradeLevel} - {s.sectionName}
                                </option>
                              ))}
                          </select>
                        )}
                        <button
                          type="button"
                          disabled={!targetAssignSection || isBulkAssigning || isMixedGrades}
                          onClick={handleBulkAssignStudents}
                          className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <UserCheck size={15} weight="bold" />
                          <span>{isBulkAssigning ? 'Assigning...' : 'Assign Selected'}</span>
                        </button>
                      </>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="rounded-lg p-1 text-ink/50 hover:bg-ink/10 hover:text-ink cursor-pointer"
                    title="Clear Selection"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Toolbar: Filters & Search Input */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ink/10 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Grade Level Tabs */}
                <div className="flex items-center gap-1 bg-ink/5 p-1 rounded-xl">
                  {['All', 'Grade 4', 'Grade 5', 'Grade 6'].map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setSectioningGradeFilter(grade)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        sectioningGradeFilter === grade ? 'bg-white text-ink shadow-xs' : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1 bg-ink/5 p-1 rounded-xl">
                  {['Unassigned', 'Assigned', 'All'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSectioningStatusFilter(status)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        sectioningStatusFilter === status ? 'bg-white text-ink shadow-xs' : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Search Input */}
              <div className="relative w-full md:w-72">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search student name or LRN..."
                  value={sectioningSearchQuery}
                  onChange={(e) => setSectioningSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-ink/20 bg-white pl-9 pr-8 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
                {sectioningSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSectioningSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Sectioning Table */}
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs font-bold text-ink/50">
                    <th className="px-4 py-3.5 text-center w-[4%]">
                      <input
                        type="checkbox"
                        checked={
                          paginatedSectioningStudents.length > 0 &&
                          paginatedSectioningStudents.every((s) => selectedStudentIds.includes(s.studentId))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageIds = paginatedSectioningStudents.map((s) => s.studentId);
                            setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...pageIds])));
                          } else {
                            const pageIdsSet = new Set(paginatedSectioningStudents.map((s) => s.studentId));
                            setSelectedStudentIds(selectedStudentIds.filter((id) => !pageIdsSet.has(id)));
                          }
                        }}
                        className="rounded border-ink/30 text-brand-blue focus:ring-brand-blue cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5 w-[15%]">LRN</th>
                    <th className="px-5 py-3.5 w-[28%]">Student Name</th>
                    <th className="px-5 py-3.5 w-[14%]">Grade Level</th>
                    <th className="px-5 py-3.5 w-[18%]">Current Section</th>
                    <th className="px-5 py-3.5 w-[15%]">End-of-Year Status</th>
                    <th className="px-5 py-3.5 text-right w-[15%]">Assign Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 text-xs text-ink">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-4 text-center"><div className="size-4 rounded bg-ink/10 mx-auto" /></td>
                        <td className="px-5 py-4"><div className="h-3.5 w-24 rounded bg-ink/10" /></td>
                        <td className="px-5 py-4"><div className="h-3.5 w-36 rounded bg-ink/10" /></td>
                        <td className="px-5 py-4"><div className="h-3.5 w-16 rounded bg-ink/10" /></td>
                        <td className="px-5 py-4"><div className="h-5 w-24 rounded-full bg-ink/10" /></td>
                        <td className="px-5 py-4"><div className="h-5 w-20 rounded-lg bg-ink/10" /></td>
                        <td className="px-5 py-4 text-right"><div className="h-7 w-28 rounded-lg bg-ink/10 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredSectioningStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center">
                        <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-2">
                          <Users size={40} className="text-ink/30" />
                          <h4 className="text-sm font-bold text-ink">No Student Records Found</h4>
                          <p className="text-xs text-ink/60 leading-relaxed">
                            No students match your filter or search criteria. Try changing the grade level or search query.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSectioningStudents.map((std) => (
                      <tr key={std.studentId} className="group hover:bg-ink/[0.02] transition-colors">
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(std.studentId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, std.studentId]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== std.studentId));
                              }
                            }}
                            className="rounded border-ink/30 text-brand-blue focus:ring-brand-blue cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-ink/80">{std.lrn}</td>
                        <td className="px-5 py-3.5 font-bold text-ink">{std.name}</td>
                        <td className="px-5 py-3.5 font-semibold text-ink/80">{std.gradeLevel}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              !std.sectionName || std.sectionName === 'Unassigned'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {std.sectionName || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const st = (std.promotionStatus || 'pending').toLowerCase();
                            const getBadgeStyle = () => {
                              switch (st) {
                                case 'promoted':
                                  return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                                case 'retained':
                                  return 'bg-brand-red/10 text-brand-red border-brand-red/30';
                                case 'dropped':
                                  return 'bg-slate-100 text-slate-700 border-slate-300';
                                case 'transferred':
                                  return 'bg-purple-100 text-purple-800 border-purple-300';
                                default:
                                  return 'bg-amber-100 text-amber-800 border-amber-300';
                              }
                            };
                            const getStatusLabel = () => {
                              switch (st) {
                                case 'promoted':
                                  return 'Promoted';
                                case 'retained':
                                  return 'Retained';
                                case 'dropped':
                                  return 'Dropped Out';
                                case 'transferred':
                                  return 'Transferred Out';
                                default:
                                  return 'Pending Evaluation';
                              }
                            };
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${getBadgeStyle()}`}
                                title={`Status set by teacher: ${getStatusLabel()}`}
                              >
                                {st === 'promoted' && <CheckCircle size={13} weight="fill" className="text-emerald-600" />}
                                {st === 'retained' && <X size={13} weight="bold" className="text-brand-red" />}
                                {st === 'dropped' && <X size={13} weight="bold" className="text-slate-600" />}
                                {st === 'transferred' && <Info size={13} weight="bold" className="text-purple-600" />}
                                {st !== 'promoted' && st !== 'retained' && st !== 'dropped' && st !== 'transferred' && (
                                  <Clock size={13} weight="bold" className="text-amber-600" />
                                )}
                                <span>{getStatusLabel()}</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {(!std.sectionName || std.sectionName === 'Unassigned') ? (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignSingleStudent(std.studentId, e.target.value, std.gradeLevel);
                                }
                              }}
                              className="rounded-lg border border-ink/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink outline-none focus:border-brand-blue cursor-pointer"
                            >
                              <option value="">Quick Assign...</option>
                              {(allSectionsList || [])
                                .filter((sec) => sec.gradeLevel === std.gradeLevel)
                                .map((sec) => (
                                  <option key={sec.id} value={sec.sectionName}>
                                    {sec.sectionName}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                value={std.sectionName}
                                onChange={(e) => {
                                  if (e.target.value && e.target.value !== std.sectionName) {
                                    handleAssignSingleStudent(std.studentId, e.target.value, std.gradeLevel);
                                  }
                                }}
                                className="rounded-lg border border-ink/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink outline-none focus:border-brand-blue cursor-pointer"
                                title="Change Section"
                              >
                                {(allSectionsList || [])
                                  .filter((sec) => sec.gradeLevel === std.gradeLevel)
                                  .map((sec) => (
                                    <option key={sec.id} value={sec.sectionName} className="bg-white text-ink font-normal">
                                      {sec.sectionName}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredSectioningStudents.length > 0 && (
              <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
                <span>
                  {totalSectioningPages > 1
                    ? `Showing ${(sectioningPage - 1) * SECTIONING_PAGE_SIZE + 1} to ${Math.min(
                        sectioningPage * SECTIONING_PAGE_SIZE,
                        filteredSectioningStudents.length
                      )} of ${filteredSectioningStudents.length} student records`
                    : `Showing ${filteredSectioningStudents.length} of ${filteredSectioningStudents.length} student records`}
                </span>
                {totalSectioningPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={sectioningPage === 1}
                      onClick={() => setSectioningPage((p) => Math.max(p - 1, 1))}
                      className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      <CaretLeft size={14} /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalSectioningPages }, (_, i) => i + 1)
                        .filter((pg) => pg === 1 || pg === totalSectioningPages || Math.abs(pg - sectioningPage) <= 1)
                        .reduce((acc, pg, idx, arr) => {
                          if (idx > 0 && pg - arr[idx - 1] > 1) {
                            acc.push('...');
                          }
                          acc.push(pg);
                          return acc;
                        }, [])
                        .map((pg, idx) =>
                          pg === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-ink/40">
                              ...
                            </span>
                          ) : (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => setSectioningPage(pg)}
                              className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                sectioningPage === pg
                                  ? 'bg-brand-blue text-white shadow-xs'
                                  : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                              }`}
                            >
                              {pg}
                            </button>
                          )
                        )}
                    </div>

                    <button
                      type="button"
                      disabled={sectioningPage === totalSectioningPages}
                      onClick={() => setSectioningPage((p) => Math.min(p + 1, totalSectioningPages))}
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
      ) : (
        /* Class Sections & Faculty-in-Charge View (Sections Tab) */
        <div className="space-y-6">
        {/* Grade Level Faculty-in-Charge Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading && assignments.every((a) => a.facultyInCharge === 'Unassigned') ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex flex-col justify-between animate-pulse"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-ink/10 pb-2.5">
                    <div className="h-4 w-16 rounded bg-ink/10" />
                    <div className="h-4 w-16 rounded-full bg-ink/10" />
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-ink/10" />
                    <div className="h-4 w-36 rounded bg-ink/10" />
                  </div>
                </div>

                <div className="mt-4 h-8 w-full rounded-xl bg-ink/10" />
              </div>
            ))
          ) : (
            assignments.map((item) => (
              <div
                key={item.gradeLevel}
                className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-ink/10 pb-2.5">
                    <span className="text-sm font-bold text-ink">{item.gradeLevel}</span>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                      {sections[item.gradeLevel]?.length || 0} Sections
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-[11px] text-ink/50 block">Faculty-in-Charge:</span>
                    <p className="text-xs font-bold text-ink">{item.facultyInCharge || 'Unassigned'}</p>
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
            ))
          )}
        </div>

        {/* Class Sections Table & Controls */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink">Active Class Sections Masterlist</span>
              <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                {filteredSections.length} Sections Listed
              </span>
            </div>
          </div>

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
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/[0.02] text-xs font-bold text-ink/50">
                <th className="px-5 py-3.5 w-[12%]">Grade Level</th>
                <th className="px-5 py-3.5 w-[16%]">Section Name</th>
                <th className="px-5 py-3.5 w-[22%]">Class Adviser</th>
                <th className="px-5 py-3.5 w-[15%]">Enrolled Students</th>
                <th className="px-5 py-3.5 w-[25%] whitespace-nowrap">Reading Level Profile</th>
                <th className="px-5 py-3.5 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 text-xs text-ink">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-3.5 w-16 rounded bg-ink/10" /></td>
                    <td className="px-5 py-4"><div className="h-3.5 w-24 rounded bg-ink/10" /></td>
                    <td className="px-5 py-4"><div className="h-3.5 w-36 rounded bg-ink/10" /></td>
                    <td className="px-5 py-4"><div className="h-3.5 w-12 rounded bg-ink/10" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-48 rounded bg-ink/10" /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <div className="size-7 rounded bg-ink/10" />
                        <div className="size-7 rounded bg-ink/10" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
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
                paginatedSections.map((sec) => (
                  <tr key={sec.id} className="group hover:bg-ink/[0.02] transition-colors cursor-pointer">
                    <td className="px-5 py-4 font-bold text-ink">{sec.gradeLevel}</td>
                    <td className="px-5 py-4 font-bold text-ink group-hover:text-brand-blue transition-colors">{sec.sectionName}</td>
                    <td className="px-5 py-4 text-ink/80">
                      {sec.adviser && String(sec.adviser).trim() !== '' && String(sec.adviser).trim() !== 'Unassigned Adviser'
                        ? String(sec.adviser).trim()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-ink/70">{sec.studentsCount || 0} Students</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
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
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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

        {/* Table Footer / Pagination */}
        {filteredSections.length > 0 && (
          <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/10 text-xs text-ink/60 bg-ink/[0.01]">
            <span>
              {totalPages > 1
                ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredSections.length)} of ${filteredSections.length} section records`
                : `Showing ${filteredSections.length} of ${filteredSections.length} section records`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <CaretLeft size={14} /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
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
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  Next <CaretRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      )}

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
                  {adviserTeachers.map((t) => (
                    <option key={t.id || t.employeeId || t.name} value={t.id || t.employeeId || t.name}>
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
                  {allTeachers.map((t) => (
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
