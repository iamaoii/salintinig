import { getApiUrl } from '../../config/api.js';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Article,
  MagnifyingGlass,
  Plus,
  Pencil,
  Trash,
  Eye,
  BookOpen,
  UserSound,
  Ear,
  X,
  CheckCircle,
  Clock,
  Archive,
  Funnel,
  ListPlus,
  GraduationCap,
  ArrowRight,
  DotsThreeVertical,
  SquaresFour,
  ListBullets,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { CardGridSkeleton } from '../../components/common/Skeleton.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';


const SET_COLORS = {
  'Set A': 'bg-purple-100/90 text-purple-900 border border-purple-200/80',
  'Set B': 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
  'Set C': 'bg-rose-100/90 text-rose-900 border border-rose-200/80',
  'Set D': 'bg-orange-100/90 text-orange-950 border border-orange-200/80',
};

export default function AdminPhilIriPassages() {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const ITEMS_PER_PAGE = 8;

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPassage, setPreviewPassage] = useState(null);

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPassageId, setEditingPassageId] = useState(null);
  const [deletingPassage, setDeletingPassage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'questions'

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    title: '',
    grade: 'Grade 4',
    language: 'Filipino',
    set: 'Set A',
    status: 'Published',
    text: '',
    questions: [],
  });

  const fetchPassages = async (skipCache = false) => {
    try {
      const cached = cacheService.get('admin_phil_iri_passages');
      if (cached && !skipCache) {
        setPassages(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/phil-iri/passages'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.passages)) {
        setPassages(data.passages);
        cacheService.set('admin_phil_iri_passages', data.passages);
      } else {
        setPassages([]);
      }
    } catch (err) {
      console.warn('Failed to fetch backend passages:', err);
      setPassages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassages();
  }, []);

  // Filtered passages list
  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      if (selectedGrade !== 'All' && p.grade !== selectedGrade) return false;
      if (selectedLanguage !== 'All' && p.language !== selectedLanguage) return false;
      if (selectedSet !== 'All' && p.set !== selectedSet) return false;
      if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchText = p.text.toLowerCase().includes(q);
        if (!matchTitle && !matchText) return false;
      }
      return true;
    });
  }, [passages, selectedGrade, selectedLanguage, selectedSet, selectedStatus, searchQuery]);

  // Reset page number on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedLanguage, selectedSet, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPassages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPassages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPassages, currentPage]);

  // Open modal for adding new passage
  const handleOpenAdd = () => {
    setEditingPassageId(null);
    setFormData({
      title: '',
      grade: 'Grade 4',
      language: 'Filipino',
      set: 'Set A',
      status: 'Published',
      text: '',
      questions: [
        {
          id: Date.now(),
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          type: 'Multiple Choice',
        },
      ],
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  // Open modal for editing existing passage
  const handleOpenEdit = (passage) => {
    setEditingPassageId(passage.id);
    setFormData({
      title: passage.title,
      grade: passage.grade,
      language: passage.language,
      set: passage.set,
      status: passage.status,
      text: passage.text,
      questions: passage.questions || [],
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  // Archive / Toggle Status Passage
  const handleArchive = async (passage) => {
    let newStatus;
    let prevStatus = passage.prevStatus || (passage.status !== 'Archived' ? passage.status : 'Published');

    if (passage.status === 'Archived') {
      newStatus = prevStatus || 'Published';
    } else {
      prevStatus = passage.status; // 'Draft' or 'Published'
      newStatus = 'Archived';
    }

    const payload = {
      ...passage,
      status: newStatus,
      prevStatus: prevStatus,
    };

    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/phil-iri/passages/${passage.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ message: `Passage status updated to ${newStatus}.` });
        cacheService.invalidate('admin_phil_iri_passages');
        fetchPassages(true);
        return;
      }
    } catch (err) {
      console.warn('Backend archive notice:', err);
    }

    setPassages((prev) =>
      prev.map((p) => (p.id === passage.id ? { ...p, status: newStatus, prevStatus } : p))
    );
    setToast({ message: `Passage status updated to ${newStatus}.` });
  };

  // Delete Passage Permanently
  const handleDeletePassage = async (passage) => {
    if (!passage) return;
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/admin/phil-iri/passages/${passage.id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setToast({ message: `Passage "${passage.title}" deleted successfully.` });
        cacheService.invalidate('admin_phil_iri_passages');
        fetchPassages(true);
        setDeletingPassage(null);
        return;
      }
    } catch (err) {
      console.warn('Backend delete notice:', err);
    }

    setPassages((prev) => prev.filter((p) => p.id !== passage.id));
    setToast({ message: `Passage "${passage.title}" deleted.` });
    setDeletingPassage(null);
  };

  // Save Add/Edit form
  const handleSaveForm = async (e, statusOverride) => {
    if (e) e.preventDefault();

    if (!formData.title.trim() || !formData.text.trim()) {
      setToast({ message: 'Title and Passage Text are required.', type: 'error' });
      return;
    }

    const finalStatus = statusOverride || formData.status || 'Published';
    const wordsCount = formData.text.trim().split(/\s+/).filter(Boolean).length;
    const passagePayload = {
      ...formData,
      status: finalStatus,
      words: wordsCount,
    };

    try {
      const token = getToken();
      const url = editingPassageId
        ? getApiUrl(`/api/admin/phil-iri/passages/${editingPassageId}`)
        : getApiUrl('/api/admin/phil-iri/passages');
      const method = editingPassageId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(passagePayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Passage ${editingPassageId ? 'updated' : 'created'} successfully.` });
        cacheService.invalidate('admin_phil_iri_passages');
        fetchPassages(true);
        setIsAddEditOpen(false);
        return;
      }
    } catch (err) {
      console.warn('Backend save notice, saving to local state:', err);
    }

    // Local fallback
    if (editingPassageId) {
      setPassages((prev) =>
        prev.map((p) => (p.id === editingPassageId ? { ...p, ...passagePayload } : p))
      );
      setToast({ message: 'Passage updated successfully.' });
    } else {
      const newPassage = {
        id: Date.now(),
        ...passagePayload,
      };
      setPassages((prev) => [newPassage, ...prev]);
      setToast({ message: 'Passage created successfully.' });
    }

    setIsAddEditOpen(false);
  };

  // Question Form Helpers
  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now(),
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          type: 'Multiple Choice',
        },
      ],
    }));
  };

  const handleRemoveQuestion = (qIndex) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex),
    }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const newOptions = [...updated[qIndex].options];
      newOptions[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOptions };
      return { ...prev, questions: updated };
    });
  };

  const wordCount = useMemo(() => {
    return formData.text ? formData.text.trim().split(/\s+/).filter(Boolean).length : 0;
  }, [formData.text]);

  useEffect(() => {
    if (isPreviewOpen || isAddEditOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isPreviewOpen, isAddEditOpen]);

  // Close 3-dot dropdown menu when clicking anywhere outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="w-full space-y-6">

        {/* ── Page Header & Action ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Article size={24} className="text-brand-red shrink-0" />
              <h2 className="text-xl font-bold text-ink">Phil-IRI Content Management</h2>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Browse, search, and view official DepEd Phil-IRI reading passages and questions. (Managed by Super Admin)
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-ink/5 border border-ink/10 px-3.5 py-1.5 text-xs font-semibold text-ink/60 shrink-0">
            <BookOpen size={15} />
            <span>Read-Only View</span>
          </div>
        </div>

        {/* ── Filters & Search Toolbar (Matching SuperAdmin Design) ── */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-4 space-y-3 shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search passage title or text..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-ink/60 font-semibold mr-1">
                <Funnel size={16} />
                <span>Filter:</span>
              </div>

              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Grades</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Languages</option>
                <option value="Filipino">Filipino</option>
                <option value="English">English</option>
              </select>

              <select
                value={selectedSet}
                onChange={(e) => {
                  setSelectedSet(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Sets</option>
                <option value="Set A">Set A</option>
                <option value="Set B">Set B</option>
                <option value="Set C">Set C</option>
                <option value="Set D">Set D</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published / Active</option>
                <option value="Archived">Archived</option>
              </select>

              {/* View Switcher - Exact SuperAdmin style */}
              <div className="ml-auto flex items-center gap-1 rounded-full border border-ink/10 bg-cream p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex size-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-ink/10 text-ink font-bold' : 'text-ink/50 hover:text-ink'
                  }`}
                  title="Grid View"
                >
                  <SquaresFour size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex size-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-ink/10 text-ink font-bold' : 'text-ink/50 hover:text-ink'
                  }`}
                  title="List View"
                >
                  <ListBullets size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Passage Cards / List View ── */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : paginatedPassages.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-ink/10 bg-white">
            <Article size={40} className="text-ink/20 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-ink/60">No passages found</h3>
            <p className="text-xs text-ink/40 mt-0.5">Try adjusting search or filter settings.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {paginatedPassages.map((passage) => {
              const isArchived = (passage.status || '').toLowerCase() === 'archived';
              const questionCount = passage.questions?.length || 0;
              const wordCount = passage.text ? passage.text.trim().split(/\s+/).length : 0;

              let statusBadge = (
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 capitalize">
                  {passage.status || 'Published'}
                </span>
              );

              if (passage.status === 'Draft') {
                statusBadge = (
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 capitalize">
                    Draft
                  </span>
                );
              } else if (isArchived) {
                statusBadge = (
                  <span className="rounded-full bg-ink/10 border border-ink/15 px-2.5 py-0.5 text-[10px] font-semibold text-ink/50 capitalize">
                    Archived
                  </span>
                );
              }

              return (
                <div
                  key={passage.id}
                  className={`group rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isArchived
                      ? 'border-ink/10 bg-ink/[0.02] opacity-75'
                      : 'border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] hover:border-ink/20'
                  }`}
                >
                  <div>
                    {/* Badges row: Set, Grade, Language, Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[passage.set] || 'bg-ink/5 text-ink'}`}>
                          {passage.set || 'Unassigned'}
                        </span>
                        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                          {passage.grade || 'Grade 4'}
                        </span>
                        <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70">
                          {passage.language || 'Filipino'}
                        </span>
                      </div>
                      {statusBadge}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-ink line-clamp-1">{passage.title}</h3>

                    {/* Text Preview */}
                    <p className="mt-2 text-xs text-ink/70 line-clamp-3 leading-relaxed">
                      {passage.text}
                    </p>
                  </div>

                  {/* Footer line: Word & Question Count + Preview Action */}
                  <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink/50">
                    <div className="flex items-center gap-3">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>{questionCount} Questions</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPassage(passage);
                          setIsPreviewOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
                        title="Preview Passage"
                      >
                        <Eye size={14} weight="bold" />
                        <span>Preview Passage</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT LIST VIEW */
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink/10 bg-cream/70 text-[11px] font-bold text-ink/60 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Passage Title</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Set</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 bg-white">
                  {paginatedPassages.map((passage) => {
                    const qCount = passage.questions ? passage.questions.length : 0;
                    return (
                      <tr key={passage.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-ink">{passage.title}</td>
                        <td className="px-4 py-3 font-semibold text-brand-blue">{passage.grade}</td>
                        <td className="px-4 py-3 font-medium text-ink/70">{passage.language}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[passage.set] || 'bg-ink/5 text-ink/80'}`}>
                            {passage.set}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            passage.status === 'Published'
                              ? 'bg-[#00a652]/10 text-[#00a652]'
                              : passage.status === 'Draft'
                                ? 'bg-[#ffc300]/20 text-[#b38600]'
                                : 'bg-ink/5 text-ink/50'
                          }`}>
                            {passage.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink/60">{qCount} Qs</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPassage(passage);
                              setIsPreviewOpen(true);
                            }}
                            className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
                            title="Preview Passage"
                          >
                            Preview
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination Controls ── */}
        <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/60">
          <span>
            Showing {filteredPassages.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPassages.length)} of {filteredPassages.length} passages
          </span>

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
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deletingPassage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-brand-red">
              <div className="rounded-full bg-brand-red/10 p-2.5">
                <Trash size={24} weight="bold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Delete Reading Passage</h3>
                <p className="text-xs text-ink/60">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-ink/70 leading-relaxed bg-white p-3 rounded-xl border border-ink/10">
              Are you sure you want to permanently delete <strong className="text-ink">"{deletingPassage.title}"</strong> ({deletingPassage.grade}, {deletingPassage.language})? All associated questions will also be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={() => setDeletingPassage(null)}
                className="rounded-full border border-ink/20 bg-cream px-4 py-2 text-xs font-bold text-ink/70 hover:bg-ink/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePassage(deletingPassage)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-red/90 transition-colors cursor-pointer"
              >
                <Trash size={15} weight="bold" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── PREVIEW MODAL ── */}
      {isPreviewOpen && previewPassage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-ink/10 bg-cream shadow-2xl overflow-hidden animate-in fade-in">
            {/* Fixed Header */}
            <div className="flex items-center justify-between border-b border-ink/10 p-5 shrink-0 bg-cream">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[previewPassage.set] || 'bg-ink/5 text-ink'}`}>
                    {previewPassage.set || 'Unassigned'}
                  </span>
                  <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                    {previewPassage.grade}
                  </span>
                  <span className="text-xs text-ink/50 font-medium">• {previewPassage.language}</span>
                </div>
                <h3 className="text-lg font-bold text-ink">{previewPassage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Passage Body Text */}
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-sm leading-relaxed text-ink whitespace-pre-line font-sans">
                  {previewPassage.text}
                </p>
                <p className="text-[11px] text-ink/40 mt-3 pt-2 border-t border-ink/10">
                  Word Count: {previewPassage.words || 0} words
                </p>
              </div>

              {/* Comprehension Questions */}
              {(!previewPassage.questions || previewPassage.questions.length === 0) ? (
                <p className="text-xs text-ink/40 italic">No questions attached to this passage yet.</p>
              ) : (
                <div className="space-y-4 pt-1">
                  {previewPassage.questions.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3.5 shadow-xs">
                      <p className="text-sm font-bold text-ink">
                        {idx + 1}. {q.question}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`rounded-full px-4 py-2 text-xs border flex items-center transition-all ${
                                Number(q.correctAnswer) === optIdx
                                  ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-800 shadow-2xs'
                                  : 'bg-white border-ink/15 text-ink/70'
                              }`}
                            >
                              <span className="font-bold mr-2 text-ink">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="truncate">{opt}</span>
                              {Number(q.correctAnswer) === optIdx && (
                                <span className="ml-1.5 font-bold text-emerald-700 shrink-0"> (Correct Answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-4 px-5 border-t border-ink/10 shrink-0 bg-cream">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ADD / EDIT PASSAGE MODAL ── */}
      {isAddEditOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <form
            onSubmit={(e) => handleSaveForm(e, 'Published')}
            className="w-full max-w-3xl rounded-2xl border border-ink/10 bg-cream shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in"
          >
            {/* FIXED TOP HEADER & TABS */}
            <div className="p-5 px-6 border-b border-ink/10 space-y-3.5 shrink-0 bg-cream">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {editingPassageId ? 'Edit Phil-IRI Passage' : 'Add New Phil-IRI Passage'}
                  </h2>
                  <p className="text-xs text-ink/50">Enter passage metadata, story content, and comprehension questions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Tabs (Underlined Tab Strip Style) */}
              <div className="flex items-center gap-6 pt-1 border-b border-ink/10 -mb-3.5">
                <button
                  type="button"
                  onClick={() => setModalTab('details')}
                  className={`pb-2.5 text-xs transition-all cursor-pointer border-b-2 ${
                    modalTab === 'details'
                      ? 'border-brand-red text-brand-red font-bold'
                      : 'border-transparent text-ink/60 hover:text-ink font-semibold'
                  }`}
                >
                  1. Passage Details
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('questions')}
                  className={`pb-2.5 text-xs transition-all cursor-pointer border-b-2 ${
                    modalTab === 'questions'
                      ? 'border-brand-red text-brand-red font-bold'
                      : 'border-transparent text-ink/60 hover:text-ink font-semibold'
                  }`}
                >
                  2. Questions ({formData.questions.length})
                </button>
              </div>
            </div>

            {/* SCROLLABLE MIDDLE BODY */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* TAB 1: PASSAGE DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-ink/70 block mb-1">Passage Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ang Masikhay na Magsasaka"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink outline-none focus:border-brand-blue"
                      />
                    </div>

                    {/* Grade Level */}
                    <div>
                      <label className="text-xs font-bold text-ink/70 block mb-1">Grade Level *</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-brand-blue"
                      >
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="text-xs font-bold text-ink/70 block mb-1">Language *</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-brand-blue"
                      >
                        <option value="Filipino">Filipino</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    {/* Passage Set */}
                    <div>
                      <label className="text-xs font-bold text-ink/70 block mb-1">Passage Set *</label>
                      <select
                        value={formData.set}
                        onChange={(e) => setFormData({ ...formData, set: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-brand-blue"
                      >
                        <option value="Set A">Set A</option>
                        <option value="Set B">Set B</option>
                        <option value="Set C">Set C</option>
                        <option value="Set D">Set D</option>
                      </select>
                    </div>

                    {/* Passage Body Text */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-ink/70">Passage Story Content *</label>
                        <span className="text-[11px] font-semibold text-ink/40">{wordCount} words</span>
                      </div>
                      <textarea
                        required
                        rows={6}
                        placeholder="Write or paste the Phil-IRI passage content here..."
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-white p-3.5 text-xs text-ink outline-none focus:border-brand-blue leading-relaxed font-serif"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTIONS */}
              {modalTab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-ink/70 uppercase tracking-wider">
                      Comprehension Questions ({formData.questions.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 px-4 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue/20 cursor-pointer transition-colors"
                    >
                      <Plus size={15} weight="bold" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {formData.questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="rounded-2xl border border-ink/15 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Question #{qIdx + 1}</span>
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-xs text-brand-red hover:underline font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Enter question statement..."
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                        className="w-full rounded-xl border border-ink/20 bg-cream/40 px-3.5 py-2 text-xs font-semibold text-ink outline-none focus:border-brand-blue"
                      />

                      {/* Options (A, B, C, D) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() => handleQuestionChange(qIdx, 'correctAnswer', optIdx)}
                              className="accent-[#00a652] cursor-pointer"
                              title="Set as correct answer"
                            />
                            <span className="text-xs font-bold text-ink/60 w-4">{String.fromCharCode(65 + optIdx)}.</span>
                            <input
                              type="text"
                              placeholder={`Choice ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              className="w-full rounded-lg border border-ink/15 bg-cream/40 px-2.5 py-1 text-xs text-ink outline-none focus:border-brand-blue"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FIXED BOTTOM FOOTER BAR */}
            <div className="p-4 px-6 border-t border-ink/10 bg-cream flex items-center justify-end shrink-0">

              {modalTab === 'details' ? (
                <button
                  type="button"
                  onClick={() => setModalTab('questions')}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue/90 cursor-pointer transition-colors"
                >
                  <span>Next: Add Questions</span>
                  <ArrowRight size={15} weight="bold" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveForm(e, 'Draft')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream px-5 py-2 text-xs font-bold text-ink hover:bg-ink/10 cursor-pointer transition-colors"
                  >
                    <span>Save as Draft</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue/90 cursor-pointer transition-colors"
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>{editingPassageId ? 'Save Changes' : 'Save & Publish'}</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
