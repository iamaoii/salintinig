import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Plus,
  CloudArrowUp,
  DownloadSimple,
  Pencil,
  Trash,
  CheckCircle,
  X,
  WarningCircle,
  FileCsv,
  EnvelopeSimple,
  Key,
  ChalkboardTeacher,
  Prohibit,
  UserSwitch,
} from '@phosphor-icons/react';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import { initialAdminTeachers, sectionsByGrade } from '../../data/adminData.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function AdminTeacherRecords() {
  const navigate = useNavigate();
  const { globalSearch } = useOutletContext() || {};
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    gradeAssigned: 'Unassigned',
    sectionAssigned: 'Unassigned',
    isFacultyInCharge: false,
  });

  // CSV Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('select');
  const [uploadSummary, setUploadSummary] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [availableSections, setAvailableSections] = useState([]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/teachers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.warn('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/sections', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && data.allSections) {
        setAvailableSections(data.allSections);
      }
    } catch (err) {
      console.warn('Could not fetch sections:', err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSections();
  }, []);

  const teacherSectionsForSelectedGrade = useMemo(() => {
    if (!availableSections || availableSections.length === 0) return [];
    return availableSections.filter((sec) => sec.gradeLevel === formData.gradeAssigned);
  }, [availableSections, formData.gradeAssigned]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return teachers.filter(
      (t) =>
        !query ||
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.employeeId && t.employeeId.toLowerCase().includes(query)) ||
        (t.email && t.email.toLowerCase().includes(query)) ||
        (t.sectionAssigned && t.sectionAssigned.toLowerCase().includes(query))
    );
  }, [teachers, globalSearch, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 on search
  const handleSearch = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Handlers
  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const teacherName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();

      if (editingTeacher) {
        const res = await fetch(`http://localhost:5000/api/admin/teachers/${editingTeacher.id || editingTeacher.employeeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Teacher record for ${teacherName} updated.`);
          fetchTeachers();
          setEditingTeacher(null);
          setShowAddModal(false);
        } else {
          showToast(data.error || 'Failed to update teacher.');
        }
      } else {
        const res = await fetch('http://localhost:5000/api/admin/teachers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const passMsg = data.tempPassword ? ` (Temp Pass: ${data.tempPassword})` : '';
          showToast(`Teacher ${teacherName} created! Credentials sent to email${passMsg}.`);
          fetchTeachers();
          setShowAddModal(false);
        } else {
          showToast(data.error || 'Failed to create teacher account.');
        }
      }
    } catch (err) {
      showToast('Error saving teacher record.');
    }
  };

  const handleToggleStatus = (tch) => {
    const newStatus = tch.status === 'Disabled' ? 'Active' : 'Disabled';
    setTeachers((prev) =>
      prev.map((t) => (t.id === tch.id ? { ...t, status: newStatus } : t))
    );
    showToast(`Account status for ${tch.name} set to ${newStatus}.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeacher) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/teachers/${deletingTeacher.id || deletingTeacher.employeeId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Teacher record for ${deletingTeacher.name} removed.`);
        fetchTeachers();
      } else {
        showToast(data.error || 'Failed to delete teacher.');
      }
    } catch (err) {
      showToast('Error removing teacher record.');
    } finally {
      setDeletingTeacher(null);
    }
  };

  const handleSimulatedUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStep('validating');

    setTimeout(() => {
      setIsUploading(false);
      const count = 5;
      const newBatch = Array.from({ length: count }, (_, i) => ({
        id: `TCH-CSV-${Date.now()}-${i}`,
        employeeId: `EMP-2024-05${i}`,
        name: `Faculty Member ${i + 1}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        email: `faculty.member${i + 1}@deped.gov.ph`,
        gradeAssigned: 'Grade 4',
        sectionAssigned: 'Kalapati',
        isFacultyInCharge: false,
        status: 'Active',
        dateAdded: new Date().toISOString().split('T')[0],
      }));

      setTeachers((prev) => [...newBatch, ...prev]);
      setUploadSummary({
        success: true,
        count,
      });
      setUploadStep('summary');
    }, 1200);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Employee ID,Full Name,Gender,DepEd Email,Assigned Grade,Assigned Section\nEMP-2024-099,Maria Santos,Female,maria.santos@deped.gov.ph,Grade 4,Fyang';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SalinTinig_Teacher_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Teacher CSV Template downloaded.');
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ChalkboardTeacher size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Teacher Records</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Manage official DepEd faculty records, class assignments, and portal access
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} />
            <span>Download Template</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setUploadStep('select');
              setUploadSummary(null);
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-brand-blue hover:bg-brand-blue/5 transition-colors cursor-pointer"
          >
            <CloudArrowUp size={16} />
            <span>Upload Teacher CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                employeeId: '',
                firstName: '',
                middleName: '',
                lastName: '',
                gender: 'Male',
                email: '',
                gradeAssigned: 'Unassigned',
                sectionAssigned: 'Unassigned',
                isFacultyInCharge: false,
              });
              setEditingTeacher(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="relative w-full md:w-96">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search teacher name or Employee ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Main Teacher Table matching Phil-IRI table styling */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink/70">
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Emp ID</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Teacher Name</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">DepEd Email</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Assigned Class</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Role</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left min-w-[130px] whitespace-nowrap">Account Status</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="border border-ink/10 p-8 text-center text-ink/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold">Loading teacher records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-ink/10 p-10 text-center">
                    <div className="mx-auto max-w-sm flex flex-col items-center justify-center space-y-2">
                      <ChalkboardTeacher size={40} className="text-ink/30" />
                      <h4 className="text-sm font-bold text-ink">
                        {teachers.length === 0 ? 'No Teacher Records Found' : 'No Matching Teacher Records'}
                      </h4>
                      <p className="text-xs text-ink/60 leading-relaxed">
                        {teachers.length === 0
                          ? 'There are currently no teacher records in your database. Click "Add Teacher" or "Upload Teacher CSV" to register faculty.'
                          : 'No teacher records found matching your search.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTeachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="border border-ink/10 p-2 font-mono text-xs text-ink/80">{tch.employeeId}</td>
                    <td
                      className="border border-ink/10 p-2 font-semibold text-brand-blue hover:underline cursor-pointer"
                      onClick={() => navigate(`/admin/teachers/${tch.id}`)}
                    >
                      {tch.name}
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/70 text-xs">{tch.email}</td>
                    <td className="border border-ink/10 p-2 text-ink/70 text-xs">
                      {(!tch.gradeAssigned || tch.gradeAssigned === 'Unassigned' || tch.sectionAssigned === 'Unassigned') ? (
                        'Unassigned'
                      ) : (
                        <span><strong className="font-semibold text-ink">{tch.gradeAssigned}</strong> - {tch.sectionAssigned}</span>
                      )}
                    </td>
                    <td className="border border-ink/10 p-2 text-xs">
                      {tch.isFacultyInCharge ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue border border-brand-blue/20">
                          <ChalkboardTeacher size={13} weight="bold" />
                          <span>Faculty-in-Charge</span>
                        </span>
                      ) : (tch.gradeAssigned && tch.gradeAssigned !== 'Unassigned' && tch.sectionAssigned !== 'Unassigned') ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-bold text-ink/80 border border-ink/15">
                          <UserSwitch size={13} weight="bold" />
                          <span>Class Adviser</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-medium text-ink/60 border border-ink/10">
                          <span>Faculty Member</span>
                        </span>
                      )}
                    </td>
                    <td className="border border-ink/10 p-2 min-w-[130px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tch)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            tch.status === 'Disabled' ? 'bg-ink/20' : 'bg-[#00a652]'
                          }`}
                          role="switch"
                          aria-checked={tch.status !== 'Disabled'}
                          title={tch.status === 'Disabled' ? 'Click to Enable Account' : 'Click to Disable Account'}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              tch.status === 'Disabled' ? 'translate-x-0' : 'translate-x-4'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-bold inline-block min-w-[55px] ${
                            tch.status === 'Disabled' ? 'text-brand-red' : 'text-[#00a652]'
                          }`}
                        >
                          {tch.status === 'Disabled' ? 'Disabled' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="border border-ink/10 p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/teachers/${tch.id}`)}
                          className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher(tch);
                            let fn = tch.firstName || '';
                            let mn = tch.middleName || '';
                            let ln = tch.lastName || '';
                            if (!fn && tch.name) {
                              const parts = tch.name.trim().split(' ');
                              fn = parts[0] || '';
                              ln = parts.length > 1 ? parts[parts.length - 1] : '';
                              mn = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
                            }
                            setFormData({
                              employeeId: tch.employeeId || '',
                              firstName: fn,
                              middleName: mn,
                              lastName: ln,
                              gender: tch.gender || 'Female',
                              email: tch.email || '',
                              gradeAssigned: tch.gradeAssigned || 'Unassigned',
                              sectionAssigned: tch.sectionAssigned || 'Unassigned',
                              isFacultyInCharge: tch.isFacultyInCharge || false,
                            });
                            setShowAddModal(true);
                          }}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="Edit Teacher"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTeacher(tch)}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-brand-red/10 hover:text-brand-red cursor-pointer"
                          title="Delete Teacher"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink/5 pt-4 text-xs text-ink/50">
          <span>Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredTeachers.length)}–{Math.min(currentPage * PAGE_SIZE, filteredTeachers.length)} of {filteredTeachers.length} teacher records</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg px-2.5 py-1 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  page === currentPage
                    ? 'bg-brand-blue text-white'
                    : 'hover:bg-ink/5 text-ink/70'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg px-2.5 py-1 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* View Teacher Profile Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10">
              <div className="flex items-center gap-3">
                <Avatar name={viewingTeacher.name} size={48} className="text-sm font-bold" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{viewingTeacher.name}</h3>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-bold text-ink/70">
                      {viewingTeacher.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-ink/60">{viewingTeacher.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-ink/10 bg-white p-3 text-center">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Assigned Grade</p>
                  <p className="mt-1 text-sm font-bold text-ink">{viewingTeacher.gradeAssigned}</p>
                  <p className="text-[10px] text-ink/60">Section {viewingTeacher.sectionAssigned}</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-white p-3 text-center">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Role</p>
                  <div className="mt-1">
                    {viewingTeacher.isFacultyInCharge ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue border border-brand-blue/20">
                        <ChalkboardTeacher size={12} weight="bold" />
                        <span>Faculty-in-Charge</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/80 border border-ink/15">
                        <UserSwitch size={12} weight="bold" />
                        <span>Class Adviser</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink/60 mt-1">S.Y. 2026-2027</p>
                </div>
                <div className="rounded-xl border border-ink/10 bg-white p-3 text-center">
                  <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Account Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      viewingTeacher.status === 'Active' ? 'bg-[#00a652]/15 text-[#00a652]' : 'bg-brand-red/10 text-brand-red'
                    }`}
                  >
                    {viewingTeacher.status}
                  </span>
                </div>
              </div>

              {/* Administrative & Class Profile */}
              <div className="rounded-xl bg-ink/5 p-4 space-y-2">
                <h4 className="font-bold text-ink text-xs">Administrative & Assessment Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-ink/80">
                  <p><span className="font-semibold text-ink">Gender:</span> {viewingTeacher.gender}</p>
                  <p><span className="font-semibold text-ink">Date Registered:</span> {viewingTeacher.dateAdded || '2025-06-15'}</p>
                  <p><span className="font-semibold text-ink">Students Enrolled:</span> 35 Students</p>
                  <p><span className="font-semibold text-ink">Phil-IRI Form Submissions:</span> 52 Forms</p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between border-t border-ink/10">
              <button
                type="button"
                onClick={() => {
                  handleToggleStatus(viewingTeacher);
                  setViewingTeacher((prev) => prev ? { ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' } : null);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                  viewingTeacher.status === 'Active'
                    ? 'bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white'
                    : 'bg-[#00a652]/10 text-[#00a652] hover:bg-[#00a652] hover:text-white'
                }`}
              >
                {viewingTeacher.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tch = viewingTeacher;
                    setViewingTeacher(null);
                    setEditingTeacher(tch);
                    setFormData({
                      employeeId: tch.employeeId,
                      name: tch.name,
                      gender: tch.gender,
                      email: tch.email,
                      gradeAssigned: tch.gradeAssigned,
                      sectionAssigned: tch.sectionAssigned,
                    });
                  }}
                  className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink hover:bg-ink/5 cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTeacher(null)}
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream hover:bg-blue-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {(showAddModal || editingTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">
                {editingTeacher ? 'Edit Teacher Record' : 'Add New Teacher'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTeacher(null);
                }}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-4 text-xs">
              {/* DepEd Employee ID */}
              <div>
                <label className="font-semibold text-ink">
                  DepEd Employee ID <span className="text-brand-red ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="EMP-2024-XXX"
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue font-mono shadow-xs"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="font-semibold text-ink">
                  First Name <span className="text-brand-red ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Maria"
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label className="font-semibold text-ink">
                  Middle Name <span className="text-ink/40 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="e.g. Santos"
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="font-semibold text-ink">
                  Last Name <span className="text-brand-red ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Dela Cruz"
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs"
                />
              </div>

              {/* Sex / Gender */}
              <div>
                <label className="font-semibold text-ink">
                  Sex / Gender <span className="text-brand-red ml-0.5">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* DepEd Email Address */}
              <div>
                <label className="font-semibold text-ink">
                  DepEd Email Address <span className="text-brand-red ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher.name@deped.gov.ph"
                  className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs"
                />
              </div>

              {/* Assigned Grade & Section */}
              <div className={`grid grid-cols-1 ${formData.gradeAssigned !== 'Unassigned' ? 'sm:grid-cols-2' : ''} gap-4`}>
                <div>
                  <label className="font-semibold text-ink">
                    Assigned Grade <span className="text-brand-red ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.gradeAssigned}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      setFormData({
                        ...formData,
                        gradeAssigned: newGrade,
                        sectionAssigned: newGrade === 'Unassigned' ? 'Unassigned' : formData.sectionAssigned,
                      });
                    }}
                    className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs cursor-pointer"
                  >
                    <option value="Unassigned">Unassigned (No Class)</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>

                {formData.gradeAssigned !== 'Unassigned' && (
                  <div>
                    <label className="font-semibold text-ink">
                      Assigned Section <span className="text-brand-red ml-0.5">*</span>
                    </label>
                    <select
                      required
                      value={formData.sectionAssigned === 'Unassigned' ? '' : formData.sectionAssigned}
                      onChange={(e) => setFormData({ ...formData, sectionAssigned: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink outline-none focus:border-brand-blue shadow-xs cursor-pointer"
                    >
                      <option value="" disabled hidden>Select Section</option>
                      {teacherSectionsForSelectedGrade.length === 0 ? (
                        <option value="" disabled>No sections available</option>
                      ) : (
                        teacherSectionsForSelectedGrade.map((sec) => (
                          <option key={sec.id || `${sec.gradeLevel}-${sec.sectionName}`} value={sec.sectionName}>
                            {sec.sectionName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTeacher(null);
                  }}
                  className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  {editingTeacher ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl text-center animate-in fade-in">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-3">
              <WarningCircle size={28} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-ink">Remove Teacher Record?</h3>
            <p className="mt-1 text-xs text-ink/60">
              Are you sure you want to remove <span className="font-bold text-ink">{deletingTeacher.name}</span> ({deletingTeacher.employeeId})?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-full bg-brand-red px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-700 cursor-pointer"
              >
                Yes, Remove Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <FileCsv size={22} className="text-brand-blue" />
                <h3 className="text-base font-bold text-ink">Batch Upload Teacher Records</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {uploadStep === 'select' && (
              <div className="mt-4 space-y-4 text-xs">
                <div
                  onClick={() => setSelectedFile({ name: 'Faculty_DepEd_Masterlist2026.csv', size: '18 KB' })}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                    selectedFile
                      ? 'border-brand-blue bg-brand-blue/5'
                      : 'border-ink/20 bg-white hover:bg-ink/[0.02]'
                  }`}
                >
                  <CloudArrowUp size={36} className="text-brand-blue mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-brand-blue">{selectedFile.name}</p>
                      <p className="text-[11px] text-ink/50">{selectedFile.size} - Ready for import</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-ink">Click to select CSV File</p>
                      <p className="text-[11px] text-ink/40 mt-0.5">Supports .csv format (max 5MB)</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile}
                    onClick={handleSimulatedUpload}
                    className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    Import Teacher Records
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'validating' && (
              <div className="my-10 text-center py-6">
                <div className="mx-auto size-10 rounded-full border-4 border-ink/10 border-t-brand-blue animate-spin mb-4" />
                <h4 className="text-sm font-bold text-ink">Processing Faculty Data...</h4>
                <p className="text-xs text-ink/50 mt-1">Creating DepEd email portal authorizations and assigning sections</p>
              </div>
            )}

            {uploadStep === 'summary' && uploadSummary && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl bg-[#00a652]/15 border border-[#00a652]/30 p-4 text-[#00a652]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={20} weight="fill" />
                    <h4 className="font-bold text-sm">Faculty Import Successful!</h4>
                  </div>
                  <p className="text-xs text-ink/80">
                    Created accounts for <span className="font-bold">{uploadSummary.count} new teachers</span>.
                  </p>

                  <div className="mt-3 rounded-lg bg-white p-3 border border-ink/10 space-y-1 text-[11px] text-ink/80">
                    <div className="flex items-center gap-1.5 font-semibold text-brand-blue">
                      <Key size={14} />
                      <span>DepEd Credentials Dispatched</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-green-700">
                      <EnvelopeSimple size={14} />
                      <span>Activation links sent to official DepEd email addresses</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      showToast('Teacher CSV import completed.');
                    }}
                    className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
