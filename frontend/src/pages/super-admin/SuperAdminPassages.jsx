import { getApiUrl } from '../../config/api.js';
import { useState, useMemo, useEffect } from 'react';
import {
  Article,
  MagnifyingGlass,
  Plus,
  Pencil,
  Eye,
  BookOpen,
  X,
  CheckCircle,
  Clock,
  Archive,
  Funnel,
  ListPlus,
  SquaresFour,
  ListBullets,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  Trash,
  Check,
  SpinnerGap,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

const SET_COLORS = {
  'Set A': 'bg-purple-100/90 text-purple-900 border border-purple-200/80',
  'Set B': 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
  'Set C': 'bg-rose-100/90 text-rose-900 border border-rose-200/80',
  'Set D': 'bg-orange-100/90 text-orange-950 border border-orange-200/80',
};

export default function SuperAdminPassages() {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const ITEMS_PER_PAGE = 8;

  // Preview Modal
  const [previewPassage, setPreviewPassage] = useState(null);

  // Add / Edit Modal
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPassageId, setEditingPassageId] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'questions'
  const [savingPassage, setSavingPassage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    grade: 'Grade 4',
    language: 'Filipino',
    set: 'Set A',
    status: 'Published',
    text: '',
    questions: [],
  });

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/phil-iri/passages'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.passages)) {
        setPassages(data.passages);
      } else {
        setPassages([]);
      }
    } catch (err) {
      console.warn('Failed to load super-admin passages:', err);
      setToast({ message: 'Failed to fetch passages.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassages();
  }, []);

  const handleArchiveToggle = async (passage) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/phil-iri/passages/${passage.id}/archive`), {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: data.message || `Passage status updated to ${data.status}.`, type: 'success' });
        fetchPassages();
      } else {
        setToast({ message: data.error || 'Failed to update passage status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  const handleOpenAdd = () => {
    setEditingPassageId(null);
    setFormData({
      title: '',
      grade: 'Grade 4',
      language: 'Filipino',
      set: 'Set A',
      status: 'Published',
      text: '',
      questions: [],
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (passage) => {
    setEditingPassageId(passage.id);
    setFormData({
      title: passage.title || '',
      grade: passage.grade || 'Grade 4',
      language: passage.language || 'Filipino',
      set: passage.set || 'Set A',
      status: passage.status || 'Published',
      text: passage.text || '',
      questions: passage.questions ? JSON.parse(JSON.stringify(passage.questions)) : [],
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  // Questions builder helpers
  const handleAddQuestion = () => {
    const newQ = {
      id: Date.now(),
      question_number: (formData.questions?.length || 0) + 1,
      question: '',
      type: 'Literal',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQ],
    }));
  };

  const handleRemoveQuestion = (idx) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const handleQuestionChange = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const opts = [...(updated[qIdx].options || ['', '', '', ''])];
      opts[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return { ...prev, questions: updated };
    });
  };

  const handleSavePassage = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim() || !formData.text.trim()) {
      setToast({ message: 'Title and content text are required.', type: 'error' });
      return;
    }

    try {
      setSavingPassage(true);
      const token = getToken();
      const wordsCount = formData.text.trim().split(/\s+/).filter(Boolean).length;
      const payload = {
        title: formData.title.trim(),
        gradeLevel: formData.grade,
        passageSet: formData.set,
        language: formData.language,
        status: formData.status,
        contentText: formData.text.trim(),
        wordCount: wordsCount,
        questions: formData.questions || [],
      };

      const endpoint = editingPassageId
        ? `/api/super-admin/phil-iri/passages/${editingPassageId}`
        : '/api/super-admin/phil-iri/passages';
      const method = editingPassageId ? 'PUT' : 'POST';

      const res = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast({
          message: editingPassageId ? 'Passage updated successfully.' : 'Passage created successfully.',
          type: 'success',
        });
        setIsAddEditOpen(false);
        fetchPassages();
      } else {
        setToast({ message: data.error || 'Failed to save passage.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error saving passage.', type: 'error' });
    } finally {
      setSavingPassage(false);
    }
  };

  // Filtered Passages
  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.text?.toLowerCase().includes(q);

      const matchesGrade = selectedGrade === 'All' || p.grade === selectedGrade;
      const matchesLang =
        selectedLanguage === 'All' ||
        p.language?.toLowerCase() === selectedLanguage.toLowerCase();
      const matchesSet = selectedSet === 'All' || p.set === selectedSet;
      const matchesStatus =
        selectedStatus === 'All' ||
        (p.status || 'Published').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesGrade && matchesLang && matchesSet && matchesStatus;
    });
  }, [passages, searchQuery, selectedGrade, selectedLanguage, selectedSet, selectedStatus]);

  const totalPages = Math.ceil(filteredPassages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPassages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPassages, currentPage]);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Page Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Article size={24} className="text-brand-red shrink-0" />
              <h2 className="text-xl font-bold text-ink">Phil-IRI Passages</h2>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Create, edit, and archive DepEd Phil-IRI reading passages and questions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 text-xs font-bold text-cream shadow-xs hover:bg-brand-red/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Add Passage</span>
          </button>
        </div>

        {/* Toolbar & Filters */}
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
                className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-red"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-ink/60 font-semibold mr-1">
                <Funnel size={16} />
                <span>Filter:</span>
              </div>

              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
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
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
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
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published / Active</option>
                <option value="Archived">Archived</option>
              </select>

              {/* View Switcher */}
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

        {/* Passages Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <SpinnerGap size={32} className="animate-spin text-brand-red" />
            <span className="text-xs font-semibold text-ink/50">Loading passage bank...</span>
          </div>
        ) : filteredPassages.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-cream p-12 text-center shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
            <Article size={40} className="mx-auto text-ink/20 mb-2" />
            <p className="text-sm font-bold text-ink">No passages found</p>
            <p className="text-xs text-ink/50 mt-0.5">
              {searchQuery || selectedLanguage !== 'All' || selectedSet !== 'All'
                ? 'Try adjusting your filters or search query.'
                : 'Click "Add Passage" to create the first reading assessment passage.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {paginatedPassages.map((passage) => {
              const isArchived = (passage.status || '').toLowerCase() === 'archived';
              const qCount = passage.questions?.length || 0;
              return (
                <div
                  key={passage.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isArchived
                      ? 'border-ink/10 bg-ink/[0.02] opacity-75'
                      : 'border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] hover:border-ink/20'
                  }`}
                >
                  <div>
                    {/* Badges row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[passage.set] || 'bg-ink/5 text-ink'}`}>
                          {passage.set || 'Set A'}
                        </span>
                        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                          {passage.grade || 'Grade 4'}
                        </span>
                        <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70">
                          {passage.language || 'Filipino'}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                          isArchived
                            ? 'bg-ink/10 text-ink/50 border border-ink/15'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {passage.status || 'Published'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-ink line-clamp-1">{passage.title}</h3>
                    <p className="mt-2 text-xs text-ink/70 line-clamp-3 leading-relaxed">
                      {passage.text}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink/50">
                    <div className="flex items-center gap-3">
                      <span>{passage.words || 0} words</span>
                      <span>•</span>
                      <span>{qCount} Questions</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewPassage(passage)}
                        className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                        title="Preview Passage"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(passage)}
                        className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-brand-blue cursor-pointer"
                        title="Edit Passage"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToggle(passage)}
                        className={`flex size-7 items-center justify-center rounded-lg cursor-pointer ${
                          isArchived
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-amber-700 hover:bg-amber-50'
                        }`}
                        title={isArchived ? 'Restore Passage' : 'Archive Passage'}
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/[0.02]">
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Passage Title</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Grade</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Language</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Set</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">Questions</th>
                    <th className="p-3 text-center font-bold text-ink/60 uppercase text-[11px]">Status</th>
                    <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {paginatedPassages.map((passage) => {
                    const isArchived = (passage.status || '').toLowerCase() === 'archived';
                    return (
                      <tr key={passage.id} className="hover:bg-ink/[0.02] transition-colors">
                        <td className="p-3 font-bold text-ink text-xs">{passage.title}</td>
                        <td className="p-3 font-semibold text-brand-blue">{passage.grade}</td>
                        <td className="p-3 text-ink/70">{passage.language}</td>
                        <td className="p-3">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[passage.set] || 'bg-ink/5'}`}>
                            {passage.set}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-ink/60">
                          {passage.questions?.length || 0} Qs
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                              isArchived
                                ? 'bg-ink/10 text-ink/50'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {passage.status || 'Published'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewPassage(passage)}
                              className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(passage)}
                              className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-brand-blue cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveToggle(passage)}
                              className={`flex size-7 items-center justify-center rounded-lg cursor-pointer ${
                                isArchived ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-700 hover:bg-amber-50'
                              }`}
                              title={isArchived ? 'Restore' : 'Archive'}
                            >
                              <Archive size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/60">
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPassages.length)} of {filteredPassages.length} passages
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 disabled:opacity-30 cursor-pointer"
              >
                <CaretLeft size={16} />
              </button>
              <span className="px-2 font-bold text-ink">{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-ink/10 bg-cream text-ink/70 hover:bg-ink/5 disabled:opacity-30 cursor-pointer"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Passage Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-ink/10 bg-cream shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 p-5">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingPassageId ? 'Edit Phil-IRI Passage' : 'Create New Phil-IRI Passage'}
                </h3>
                <p className="text-xs text-ink/50 mt-0.5">Manage passage content and reading comprehension questions.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation inside Modal */}
            <div className="flex border-b border-ink/10 px-5 bg-ink/[0.02]">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                1. Passage Details & Content
              </button>
              <button
                type="button"
                onClick={() => setModalTab('questions')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'questions'
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                2. Comprehension Questions ({formData.questions?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {modalTab === 'details' ? (
                <>
                  <div>
                    <label className="block font-semibold text-ink mb-1">Passage Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ang Matalinong Pagong"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">Grade Level</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Grade 2">Grade 2</option>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Passage Set</label>
                      <select
                        value={formData.set}
                        onChange={(e) => setFormData({ ...formData, set: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Set A">Set A</option>
                        <option value="Set B">Set B</option>
                        <option value="Set C">Set C</option>
                        <option value="Set D">Set D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Language</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Filipino">Filipino</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Published">Published / Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-ink">Passage Content Text</label>
                      <span className="text-[11px] text-ink/50">
                        {formData.text.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      required
                      placeholder="Type or paste the full passage reading text here..."
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 bg-cream p-3 text-xs text-ink outline-none focus:border-brand-red leading-relaxed font-sans"
                    />
                  </div>
                </>
              ) : (
                /* Questions Builder Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink/60">
                      Add multiple choice comprehension questions for this passage.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3.5 py-1.5 text-xs font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {(!formData.questions || formData.questions.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-ink/40">
                      <ListPlus size={32} className="mx-auto mb-1 text-ink/20" />
                      <p className="font-semibold">No questions added yet</p>
                      <p className="text-[11px] mt-0.5">Click "Add Question" above to begin adding comprehension questions.</p>
                    </div>
                  ) : (
                    formData.questions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink">Question {qIdx + 1}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={q.type || 'Literal'}
                              onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                              className="rounded-lg border border-ink/20 bg-cream px-2 py-1 text-[11px] text-ink font-medium"
                            >
                              <option value="Literal">Literal</option>
                              <option value="Inferential">Inferential</option>
                              <option value="Critical">Critical</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Enter question text..."
                          value={q.question || ''}
                          onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                          className="w-full rounded-lg border border-ink/20 bg-cream px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-red"
                        />

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-ink/50">
                            Answer Choices (Click radio to set correct answer):
                          </span>
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={Number(q.correctAnswer) === optIdx}
                                onChange={() => handleQuestionChange(qIdx, 'correctAnswer', optIdx)}
                                className="accent-brand-red cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                className="w-full rounded-lg border border-ink/15 bg-cream px-2.5 py-1 text-xs text-ink outline-none focus:border-brand-red"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-ink/10 p-4 bg-ink/[0.02]">
              <div className="text-[11px] text-ink/50">
                {modalTab === 'details' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab('questions')}
                    className="font-semibold text-brand-blue hover:underline cursor-pointer"
                  >
                    Next: Comprehension Questions →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className="font-semibold text-ink/60 hover:underline cursor-pointer"
                  >
                    ← Back to Details
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePassage}
                  disabled={savingPassage}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 disabled:opacity-50 cursor-pointer"
                >
                  {savingPassage ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Passage</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-ink/10 bg-cream shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 p-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[previewPassage.set] || 'bg-ink/5'}`}>
                    {previewPassage.set}
                  </span>
                  <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                    {previewPassage.grade}
                  </span>
                  <span className="text-xs text-ink/50">• {previewPassage.language}</span>
                </div>
                <h3 className="text-lg font-bold text-ink">{previewPassage.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPassage(null)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-sm leading-relaxed text-ink whitespace-pre-line font-sans">
                  {previewPassage.text}
                </p>
                <p className="text-[11px] text-ink/40 mt-3 pt-2 border-t border-ink/10">
                  Word count: {previewPassage.words || 0} words
                </p>
              </div>

              {previewPassage.questions && previewPassage.questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-ink text-sm">
                    Comprehension Questions ({previewPassage.questions.length})
                  </h4>
                  {previewPassage.questions.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3 space-y-1.5">
                      <p className="font-semibold text-ink">
                        {idx + 1}. {q.question} <span className="text-[10px] text-ink/40 font-normal">({q.type || 'Literal'})</span>
                      </p>
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-3 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`rounded-md px-2 py-1 text-[11px] ${
                                Number(q.correctAnswer) === oIdx
                                  ? 'bg-emerald-100 font-bold text-emerald-900 border border-emerald-300'
                                  : 'text-ink/70'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-ink/10 p-4">
              <button
                type="button"
                onClick={() => setPreviewPassage(null)}
                className="rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
