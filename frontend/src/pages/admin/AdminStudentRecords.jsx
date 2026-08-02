import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Funnel,
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
  Student,
  Eye,
  Prohibit,
  UserSwitch,
} from '@phosphor-icons/react';
import { initialAdminStudents } from '../../data/adminData.js';
import ToastNotification from '../../components/common/ToastNotification.jsx';

export default function AdminStudentRecords() {
  const navigate = useNavigate();
  const { globalSearch } = useOutletContext() || {};
  const [students, setStudents] = useState(initialAdminStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    lrn: '',
    name: '',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    personalEmail: '',
  });

  // CSV Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('select');
  const [simulatedErrorMode, setSimulatedErrorMode] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.lrn.includes(query) ||
        s.grade.toLowerCase().includes(query) ||
        s.section.toLowerCase().includes(query);

      const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter;
      const matchesSection = sectionFilter === 'All' || s.section === sectionFilter;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [students, globalSearch, searchQuery, gradeFilter, sectionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setCurrentPage(1);
  };

  // Handlers
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (editingStudent) {
      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? { ...s, ...formData } : s))
      );
      showToast(`Student record for ${formData.name} updated successfully.`);
      setEditingStudent(null);
    } else {
      const newStd = {
        id: `STD-${Date.now().toString().slice(-4)}`,
        ...formData,
        level: 'Screening',
        status: 'Account Created',
        generatedPassword: `ST-${Math.random().toString(36).slice(-6)}`,
      };
      setStudents((prev) => [newStd, ...prev]);
      showToast(`Student ${formData.name} added & account created!`);
      setShowAddModal(false);
    }
  };

  const handleToggleStatus = (std) => {
    const newStatus = std.status === 'Disabled' ? 'Account Created' : 'Disabled';
    setStudents((prev) =>
      prev.map((s) => (s.id === std.id ? { ...s, status: newStatus } : s))
    );
    showToast(`Account for ${std.name} set to ${newStatus === 'Disabled' ? 'Disabled' : 'Active'}.`);
  };

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      showToast(`Student ${deletingStudent.name} deleted.`);
      setDeletingStudent(null);
    }
  };

  const handleSimulatedUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStep('validating');

    setTimeout(() => {
      setIsUploading(false);
      if (simulatedErrorMode) {
        setUploadSummary({
          success: false,
          errors: [
            'Row 4: Missing LRN number',
            'Row 9: Invalid Personal Email format (email_invalid)',
          ],
        });
      } else {
        const count = 12;
        const newBatch = Array.from({ length: count }, (_, i) => ({
          id: `STD-CSV-${Date.now()}-${i}`,
          lrn: `10928374${800 + i}`,
          name: `Batch Student ${i + 1}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          grade: gradeFilter === 'All' ? 'Grade 4' : gradeFilter,
          section: 'Kalapati',
          level: 'Screening',
          personalEmail: `batch.student${i + 1}@gmail.com`,
          status: 'Account Created',
          generatedPassword: `ST-${Math.random().toString(36).slice(-6)}`,
        }));

        setStudents((prev) => [...newBatch, ...prev]);
        setUploadSummary({
          success: true,
          count,
        });
      }
      setUploadStep('summary');
    }, 1200);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,LRN,Full Name,Gender,Grade Level,Section,Email Address\n10928374801,Juan Cruz,Male,Grade 4,Fyang,juan.cruz@gmail.com\n10928374802,Maria Clara,Female,Grade 4,Kalapati,maria.clara@gmail.com';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SalinTinig_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Student CSV Template downloaded.');
  };

  return (
    <>
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Student size={28} className="text-brand-red" />
            <h1 className="text-3xl font-bold text-ink">Student Records</h1>
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Manage official student masterlists and automated portal accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} />
            <span>Download CSV Template</span>
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
            <span>Upload Records (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({
                lrn: '',
                name: '',
                gender: 'Male',
                grade: 'Grade 4',
                section: 'Fyang',
                personalEmail: '',
              });
              setEditingStudent(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filters matching Teacher side style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="relative w-full md:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search student, LRN, section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-ink/60 font-semibold">
            <Funnel size={16} />
            <span>Filters:</span>
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand-blue"
          >
            <option value="All">All Grades</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand-blue"
          >
            <option value="All">All Sections</option>
            <option value="Fyang">Fyang</option>
            <option value="Kalapati">Kalapati</option>
            <option value="Sampaguita">Sampaguita</option>
            <option value="Aguinaldo">Aguinaldo</option>
          </select>
        </div>
      </div>

      {/* Main Student Table matching Phil-IRI table styling */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink/70">
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">LRN</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Student Name</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Grade & Section</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Gender</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Parent Access Code</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Email Address</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left min-w-[130px] whitespace-nowrap">Account Status</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-ink/10 p-6 text-center text-ink/40">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="border border-ink/10 p-2 font-mono text-xs text-ink/80">{std.lrn}</td>
                    <td className="border border-ink/10 p-2 font-semibold text-brand-blue hover:underline cursor-pointer" onClick={() => navigate(`/admin/students/${std.lrn}`)}>{std.name}</td>
                    <td className="border border-ink/10 p-2 text-ink/80">
                      <span className="font-semibold">{std.grade}</span> - {std.section}
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/70 text-xs">{std.gender}</td>
                    <td className="border border-ink/10 p-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-blue border border-brand-blue/20">
                        <Key size={12} weight="bold" />
                        <span>{std.parentAccessCode || `PAC-${std.lrn.slice(-5)}`}</span>
                      </span>
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/70 text-xs">{std.personalEmail}</td>
                    <td className="border border-ink/10 p-2 min-w-[130px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(std)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            std.status === 'Disabled' ? 'bg-ink/20' : 'bg-[#00a652]'
                          }`}
                          role="switch"
                          aria-checked={std.status !== 'Disabled'}
                          title={std.status === 'Disabled' ? 'Click to Enable Account' : 'Click to Disable Account'}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              std.status === 'Disabled' ? 'translate-x-0' : 'translate-x-4'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-bold inline-block min-w-[55px] ${
                            std.status === 'Disabled' ? 'text-brand-red' : 'text-[#00a652]'
                          }`}
                        >
                          {std.status === 'Disabled' ? 'Disabled' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="border border-ink/10 p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/students/${std.lrn}`)}
                          className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(std);
                            setFormData({
                              lrn: std.lrn,
                              name: std.name,
                              gender: std.gender,
                              grade: std.grade,
                              section: std.section,
                              personalEmail: std.personalEmail,
                            });
                          }}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                          title="Edit Student"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(std)}
                          className="rounded-lg p-1.5 text-ink/60 hover:bg-brand-red/10 hover:text-brand-red cursor-pointer"
                          title="Delete Student"
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
          <span>Showing {filteredStudents.length === 0 ? 0 : Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredStudents.length)}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} student records</span>
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

      {/* Add / Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="text-base font-bold text-ink">
                {editingStudent ? 'Edit Student Record' : 'Add New Student'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-ink">LRN (Learner Reference Number)</label>
                <input
                  type="text"
                  required
                  value={formData.lrn}
                  onChange={(e) => setFormData({ ...formData, lrn: e.target.value })}
                  placeholder="12-digit LRN"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Full Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Last Name, First Name Middle Name"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink">Grade Level</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  >
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-ink">Section</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. Fyang"
                    className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  placeholder="student.email@gmail.com"
                  className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  {editingStudent ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl text-center animate-in fade-in">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-3">
              <WarningCircle size={28} weight="fill" />
            </div>
            <h3 className="text-base font-bold text-ink">Delete Student Record?</h3>
            <p className="mt-1 text-xs text-ink/60">
              Are you sure you want to delete <span className="font-bold text-ink">{deletingStudent.name}</span> (LRN: {deletingStudent.lrn})?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-full bg-brand-red px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete Record
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
                <h3 className="text-base font-bold text-ink">Batch Upload Student Records</h3>
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
                  onClick={() => setSelectedFile({ name: 'Grade4_Students_Batch2026.csv', size: '24 KB' })}
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
                      <p className="text-[11px] text-ink/50">{selectedFile.size} - Ready for validation</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-ink">Click to select CSV or Excel File</p>
                      <p className="text-[11px] text-ink/40 mt-0.5">Supports .csv, .xlsx format (max 5MB)</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-ink/5 p-3 text-[11px]">
                  <span className="font-semibold text-ink/80">Simulate Upload Errors Mode</span>
                  <input
                    type="checkbox"
                    checked={simulatedErrorMode}
                    onChange={(e) => setSimulatedErrorMode(e.target.checked)}
                    className="size-4 accent-brand-blue cursor-pointer"
                  />
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
                    Validate & Import Records
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'validating' && (
              <div className="my-10 text-center py-6">
                <div className="mx-auto size-10 rounded-full border-4 border-ink/10 border-t-brand-blue animate-spin mb-4" />
                <h4 className="text-sm font-bold text-ink">Validating & Processing File...</h4>
                <p className="text-xs text-ink/50 mt-1">Checking LRN formats, required fields, and duplicate entries</p>
              </div>
            )}

            {uploadStep === 'summary' && uploadSummary && (
              <div className="mt-4 space-y-4 text-xs">
                {uploadSummary.success ? (
                  <div className="rounded-xl bg-[#00a652]/15 border border-[#00a652]/30 p-4 text-[#00a652]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} weight="fill" />
                      <h4 className="font-bold text-sm">Upload & Account Creation Successful!</h4>
                    </div>
                    <p className="text-xs text-ink/80">
                      Successfully saved <span className="font-bold">{uploadSummary.count} student records</span>.
                    </p>

                    <div className="mt-3 rounded-lg bg-white p-3 border border-ink/10 space-y-1 text-[11px] text-ink/80">
                      <div className="flex items-center gap-1.5 font-semibold text-brand-blue">
                        <Key size={14} />
                        <span>Temporary Credentials Generated</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-green-700">
                        <EnvelopeSimple size={14} />
                        <span>Login credentials sent to registered email addresses</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-brand-red/10 border border-brand-red/30 p-4 text-brand-red">
                    <div className="flex items-center gap-2 mb-2">
                      <WarningCircle size={20} weight="fill" />
                      <h4 className="font-bold text-sm">Validation Errors Found</h4>
                    </div>
                    <p className="text-xs text-ink/80 mb-2">
                      The uploaded file contains missing or invalid fields:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] font-semibold text-brand-red">
                      {uploadSummary.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      showToast('Batch upload workflow completed.');
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
