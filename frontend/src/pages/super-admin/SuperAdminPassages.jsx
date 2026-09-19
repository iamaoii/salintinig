import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  MagnifyingGlass,
  Plus,
  Pencil,
  Eye,
  Archive,
  ArrowCounterClockwise,
  X,
  Funnel,
  CaretLeft,
  CaretRight,
  ListPlus,
  Trash,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

const STATUS_STYLES = {
  Published: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
  Archived: 'bg-ink/10 text-ink/50',
};

const GRADES = ['All', 'Grade 4', 'Grade 5', 'Grade 6'];
const LANGUAGES = ['All', 'Filipino', 'English'];
const SETS = ['All', 'Set A', 'Set B', 'Set C', 'Set D'];
const STATUSES = ['All', 'Published', 'Draft', 'Archived'];
const ITEMS_PER_PAGE = 8;

const EMPTY_FORM = {
  title: '',
  grade: 'Grade 4',
  language: 'Filipino',
  set: 'Set A',
  status: 'Published',
  text: '',
  questions: [],
};

export default function SuperAdminPassages() {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const [previewPassage, setPreviewPassage] = useState(null);
  const [editingPassage, setEditingPassage] = useState(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState('details');

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/phil-iri/passages'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassages(data.passages || []);
      }
    } catch (err) {
      console.warn('Failed to fetch passages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassages(); }, []);

  const filtered = useMemo(() => {
    return passages.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || p.title?.toLowerCase().includes(q) || p.text?.toLowerCase().includes(q);
      const matchGrade = selectedGrade === 'All' || p.grade === selectedGrade;
      const matchLang = selectedLanguage === 'All' || p.language === selectedLanguage;
      const matchSet = selectedSet === 'All' || p.set === selectedSet;
      const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchSearch && matchGrade && matchLang && matchSet && matchStatus;
    });
  }, [passages, searchQuery, selectedGrade, selectedLanguage, selectedSet, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => { setEditingPassage(null); setFormData(EMPTY_FORM); setModalTab('details'); setIsAddEditOpen(true); };
  const openEdit = (p) => {
    setEditingPassage(p);
    setFormData({ title: p.title, grade: p.grade, language: p.language, set: p.set, status: p.status, text: p.text, questions: p.questions || [] });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.text.trim()) {
      setToast({ message: 'Title and passage text are required.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const url = editingPassage
        ? getApiUrl(`/api/super-admin/phil-iri/passages/${editingPassage.id}`)
        : getApiUrl('/api/super-admin/phil-iri/passages');
      const method = editingPassage ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: editingPassage ? 'Passage updated.' : 'Passage created.', type: 'success' });
        setIsAddEditOpen(false);
        fetchPassages();
      } else {
        setToast({ message: data.error || 'Failed to save passage.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (p) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/phil-iri/passages/${p.id}/archive`), {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'Passage archived.', type: 'success' });
        fetchPassages();
      }
    } catch (err) { setToast({ message: 'Network error.', type: 'error' }); }
  };

  const handleRestore = async (p) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/phil-iri/passages/${p.id}/restore`), {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'Passage restored.', type: 'success' });
        fetchPassages();
      }
    } catch (err) { setToast({ message: 'Network error.', type: 'error' }); }
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'Multiple Choice', options: ['', '', '', ''], correctAnswer: 0 }],
    }));
  };

  const updateQuestion = (qi, field, value) => {
    setFormData((prev) => {
      const qs = [...prev.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const removeQuestion = (qi) => {
    setFormData((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }));
  };

  return (
    <div className="space-y-5">
      <ToastNotification message={toast?.message || null} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search passages..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border border-ink/10 bg-cream py-2 pl-9 pr-4 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors"
          />
        </div>
        <button type="button" onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-colors cursor-pointer">
          <Plus size={14} weight="bold" />
          Add Passage
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Funnel size={14} className="text-ink/40" />
        {[
          { label: 'Grade', options: GRADES, value: selectedGrade, set: setSelectedGrade },
          { label: 'Language', options: LANGUAGES, value: selectedLanguage, set: setSelectedLanguage },
          { label: 'Set', options: SETS, value: selectedSet, set: setSelectedSet },
          { label: 'Status', options: STATUSES, value: selectedStatus, set: setSelectedStatus },
        ].map(({ label, options, value, set }) => (
          <select
            key={label}
            value={value}
            onChange={(e) => { set(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-ink/10 bg-cream px-2.5 py-1.5 text-[11px] font-semibold text-ink outline-none focus:border-purple-400 cursor-pointer"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-[11px] text-ink/40 ml-auto">{filtered.length} passages</span>
      </div>

      {/* Passages Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-ink/50">
          <div className="size-7 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading passages...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-ink/10 bg-cream text-center">
          <BookOpen size={40} className="text-ink/30 mb-3" />
          <p className="text-sm font-bold text-ink">No passages found</p>
          <p className="text-xs text-ink/50 mt-1">Try adjusting your filters or add a new passage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-ink leading-snug line-clamp-2">{p.title}</p>
                  <p className="text-[11px] text-ink/50 mt-0.5">{p.grade} · {p.language} · {p.set}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[p.status] || STATUS_STYLES.Draft}`}>
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink/60 line-clamp-3 flex-1">{p.text}</p>
              <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
                <span className="text-[11px] text-ink/40">{p.words} words · {p.questions?.length || 0} questions</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setPreviewPassage(p)}
                    className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer" title="Preview">
                    <Eye size={13} />
                  </button>
                  <button type="button" onClick={() => openEdit(p)}
                    className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer" title="Edit">
                    <Pencil size={13} />
                  </button>
                  {p.status === 'Archived' ? (
                    <button type="button" onClick={() => handleRestore(p)}
                      className="flex size-7 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer" title="Restore">
                      <ArrowCounterClockwise size={13} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleArchive(p)}
                      className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer" title="Archive">
                      <Archive size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex size-8 items-center justify-center rounded-full border border-ink/10 text-ink/60 hover:bg-ink/5 disabled:opacity-40 cursor-pointer">
            <CaretLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-ink">{currentPage} / {totalPages}</span>
          <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex size-8 items-center justify-center rounded-full border border-ink/10 text-ink/60 hover:bg-ink/5 disabled:opacity-40 cursor-pointer">
            <CaretRight size={14} />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewPassage && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <button type="button" onClick={() => setPreviewPassage(null)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer">
              <X size={18} weight="bold" />
            </button>
            <div className="flex items-start gap-2 mb-4">
              <BookOpen size={20} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-ink">{previewPassage.title}</h2>
                <p className="text-xs text-ink/50">{previewPassage.grade} · {previewPassage.language} · {previewPassage.set} · {previewPassage.words} words</p>
              </div>
            </div>
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap mb-4">
              {previewPassage.text}
            </div>
            {previewPassage.questions?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-ink">Questions ({previewPassage.questions.length})</h3>
                {previewPassage.questions.map((q, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 p-3 space-y-2">
                    <p className="text-xs font-semibold text-ink">{i + 1}. {q.question}</p>
                    {q.options?.map((opt, oi) => (
                      <div key={oi} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${oi === q.correctAnswer ? 'bg-green-50 border border-green-200 text-green-700' : 'text-ink/70'}`}>
                        <span className={`size-4 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${oi === q.correctAnswer ? 'border-green-500 bg-green-100 text-green-700' : 'border-ink/20'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Add/Edit Modal */}
      {isAddEditOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-cream shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-ink">{editingPassage ? 'Edit Passage' : 'Add Passage'}</h2>
              <button type="button" onClick={() => setIsAddEditOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer">
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-ink/10 px-5">
              {['details', 'questions'].map((t) => (
                <button key={t} type="button" onClick={() => setModalTab(t)}
                  className={`pb-3 pt-3 mr-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer capitalize ${
                    modalTab === t ? 'border-purple-700 text-purple-700' : 'border-transparent text-ink/50 hover:text-ink'
                  }`}>
                  {t === 'questions' ? `Questions (${formData.questions.length})` : t}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {modalTab === 'details' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Passage title" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Grade Level', field: 'grade', options: ['Grade 4', 'Grade 5', 'Grade 6'] },
                      { label: 'Language', field: 'language', options: ['Filipino', 'English'] },
                      { label: 'Set', field: 'set', options: ['Set A', 'Set B', 'Set C', 'Set D'] },
                      { label: 'Status', field: 'status', options: ['Draft', 'Published'] },
                    ].map(({ label, field, options }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-ink mb-1.5">{label}</label>
                        <select value={formData[field]} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                          className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-purple-400 cursor-pointer">
                          {options.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Passage Text *</label>
                    <textarea value={formData.text} onChange={(e) => setFormData((p) => ({ ...p, text: e.target.value }))}
                      rows={8} placeholder="Enter the full reading passage text here..."
                      className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors resize-none" />
                    <p className="mt-1 text-[11px] text-ink/40">{formData.text.trim().split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((q, qi) => (
                    <div key={qi} className="rounded-xl border border-ink/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-ink">Question {qi + 1}</p>
                        <button type="button" onClick={() => removeQuestion(qi)}
                          className="flex size-6 items-center justify-center rounded-full text-ink/40 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
                          <Trash size={12} />
                        </button>
                      </div>
                      <input type="text" value={q.question} onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                        placeholder="Question text" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors" />
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                              onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="text-purple-700 cursor-pointer" />
                            <input type="text" value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options]; newOpts[oi] = e.target.value;
                                updateQuestion(qi, 'options', newOpts);
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              className="flex-1 rounded-xl border border-ink/10 bg-cream px-3 py-1.5 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addQuestion}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-ink/20 px-4 py-3 text-xs font-semibold text-ink/50 hover:border-purple-400 hover:text-purple-700 transition-colors cursor-pointer w-full justify-center">
                    <ListPlus size={16} />
                    Add Question
                  </button>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur-sm">
              <button type="button" onClick={() => setIsAddEditOpen(false)}
                className="rounded-full border border-ink/10 px-5 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-full bg-purple-700 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-60">
                {saving && <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {saving ? 'Saving...' : (editingPassage ? 'Save Changes' : 'Create Passage')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
