import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Books,
  MagnifyingGlass,
  Plus,
  Pencil,
  Eye,
  Archive,
  ArrowCounterClockwise,
  Trash,
  X,
  Funnel,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-ink/10 text-ink/50',
};

const GRADES = ['All', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
const LANGUAGES = ['All', 'Filipino', 'English'];
const STATUSES = ['All', 'active', 'draft', 'archived'];
const ITEMS_PER_PAGE = 8;

const EMPTY_FORM = {
  title: '',
  author: '',
  description: '',
  contentText: '',
  language: 'Filipino',
  category: '',
  gradeLevel: '',
  difficultyLevel: '',
  readingTimeMinutes: '',
  status: 'draft',
};

export default function SuperAdminStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const [previewStory, setPreviewStory] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/stories'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStories(data.stories || []);
      }
    } catch (err) {
      console.warn('Failed to fetch stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q);
      const matchGrade = selectedGrade === 'All' || s.gradeLevel === selectedGrade;
      const matchLang = selectedLanguage === 'All' || s.language === selectedLanguage;
      const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
      return matchSearch && matchGrade && matchLang && matchStatus;
    });
  }, [stories, searchQuery, selectedGrade, selectedLanguage, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => { setEditingStory(null); setFormData(EMPTY_FORM); setIsFormOpen(true); };
  const openEdit = (s) => {
    setEditingStory(s);
    setFormData({
      title: s.title || '',
      author: s.author || '',
      description: s.description || '',
      contentText: s.contentText || '',
      language: s.language || 'Filipino',
      category: s.category || '',
      gradeLevel: s.gradeLevel || '',
      difficultyLevel: s.difficultyLevel || '',
      readingTimeMinutes: s.readingTimeMinutes || '',
      status: s.status || 'draft',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { setToast({ message: 'Title is required.', type: 'error' }); return; }
    setSaving(true);
    try {
      const token = getToken();
      const url = editingStory
        ? getApiUrl(`/api/super-admin/stories/${editingStory.id}`)
        : getApiUrl('/api/super-admin/stories');
      const method = editingStory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: editingStory ? 'Story updated.' : 'Story created.', type: 'success' });
        setIsFormOpen(false);
        fetchStories();
      } else {
        setToast({ message: data.error || 'Failed to save story.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (story, newStatus) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/stories/${story.id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Story ${newStatus === 'active' ? 'published' : newStatus}.`, type: 'success' });
        fetchStories();
      } else {
        setToast({ message: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err) { setToast({ message: 'Network error.', type: 'error' }); }
  };

  const handleDelete = async (story) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/stories/${story.id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: 'Story deleted.', type: 'success' });
        setDeleteConfirm(null);
        fetchStories();
      } else {
        setToast({ message: data.error || 'Cannot delete this story.', type: 'error' });
        setDeleteConfirm(null);
      }
    } catch (err) { setToast({ message: 'Network error.', type: 'error' }); }
  };

  return (
    <div className="space-y-5">
      <ToastNotification message={toast?.message || null} type={toast?.type || 'success'} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Books size={24} className="text-purple-700" />
            <h1 className="text-2xl font-bold text-ink">Reading Materials</h1>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">Manage the reading materials library for students</p>
        </div>
        <button type="button" onClick={openAdd}
          className="flex shrink-0 items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-colors cursor-pointer">
          <Plus size={14} weight="bold" />
          Add Story
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input type="text" placeholder="Search stories..." value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border border-ink/10 bg-cream py-2 pl-9 pr-4 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Funnel size={13} className="text-ink/40" />
          {[
            { options: GRADES, value: selectedGrade, set: setSelectedGrade },
            { options: LANGUAGES, value: selectedLanguage, set: setSelectedLanguage },
            { options: STATUSES, value: selectedStatus, set: setSelectedStatus, label: (v) => v === 'active' ? 'Published' : v.charAt(0).toUpperCase() + v.slice(1) },
          ].map(({ options, value, set, label }, i) => (
            <select key={i} value={value} onChange={(e) => { set(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-ink/10 bg-cream px-2.5 py-1.5 text-[11px] font-semibold text-ink outline-none focus:border-purple-400 cursor-pointer">
              {options.map((o) => <option key={o} value={o}>{label ? (o === 'All' ? 'All' : label(o)) : o}</option>)}
            </select>
          ))}
          <span className="text-[11px] text-ink/40">{filtered.length} stories</span>
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-ink/50">
          <div className="size-7 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Loading stories...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-ink/10 bg-cream text-center">
          <Books size={40} className="text-ink/30 mb-3" />
          <p className="text-sm font-bold text-ink">No stories found</p>
          <p className="text-xs text-ink/50 mt-1">Add your first reading material to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-ink leading-snug line-clamp-2">{s.title}</p>
                  {s.author && <p className="text-[11px] text-ink/50 mt-0.5">by {s.author}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[s.status] || STATUS_STYLES.draft}`}>
                  {s.status === 'active' ? 'Published' : s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                </span>
              </div>
              {s.description && <p className="mt-2 text-[11px] text-ink/60 line-clamp-2 flex-1">{s.description}</p>}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {s.language && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/50">{s.language}</span>}
                {s.gradeLevel && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/50">{s.gradeLevel}</span>}
                {s.difficultyLevel && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/50">{s.difficultyLevel}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setPreviewStory(s)}
                    className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer" title="Preview">
                    <Eye size={13} />
                  </button>
                  <button type="button" onClick={() => openEdit(s)}
                    className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer" title="Edit">
                    <Pencil size={13} />
                  </button>
                  {s.status === 'archived' ? (
                    <button type="button" onClick={() => handleStatusChange(s, 'draft')}
                      className="flex size-7 items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer" title="Restore to Draft">
                      <ArrowCounterClockwise size={13} />
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleStatusChange(s, 'archived')}
                      className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer" title="Archive">
                      <Archive size={13} />
                    </button>
                  )}
                  {s.status === 'draft' && (
                    <button type="button" onClick={() => setDeleteConfirm(s)}
                      className="flex size-7 items-center justify-center rounded-lg border border-ink/10 text-ink/60 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer" title="Delete">
                      <Trash size={13} />
                    </button>
                  )}
                </div>
                {s.status === 'draft' && (
                  <button type="button" onClick={() => handleStatusChange(s, 'active')}
                    className="text-[11px] font-semibold text-green-700 hover:underline cursor-pointer">
                    Publish
                  </button>
                )}
                {s.status === 'active' && (
                  <button type="button" onClick={() => handleStatusChange(s, 'draft')}
                    className="text-[11px] font-semibold text-ink/50 hover:underline cursor-pointer">
                    Unpublish
                  </button>
                )}
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

      {/* Delete Confirm Modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-ink">Delete Story?</h2>
            <p className="text-xs text-ink/60">Are you sure you want to permanently delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer">
                Delete
              </button>
              <button type="button" onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-full border border-ink/10 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal */}
      {previewStory && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl">
            <button type="button" onClick={() => setPreviewStory(null)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer">
              <X size={18} weight="bold" />
            </button>
            <div className="mb-4">
              <h2 className="text-base font-black text-ink">{previewStory.title}</h2>
              {previewStory.author && <p className="text-xs text-ink/50 mt-0.5">by {previewStory.author}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {previewStory.language && <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold">{previewStory.language}</span>}
                {previewStory.gradeLevel && <span className="rounded-full bg-ink/10 text-ink/60 px-2 py-0.5 text-[10px] font-bold">{previewStory.gradeLevel}</span>}
                {previewStory.readingTimeMinutes && <span className="rounded-full bg-ink/10 text-ink/60 px-2 py-0.5 text-[10px] font-bold">{previewStory.readingTimeMinutes} min read</span>}
              </div>
              {previewStory.description && <p className="text-xs text-ink/60 mt-2">{previewStory.description}</p>}
            </div>
            {previewStory.contentText && (
              <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {previewStory.contentText}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-cream shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-ink">{editingStory ? 'Edit Story' : 'Add Reading Material'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Story title" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Author</label>
                  <input type="text" value={formData.author} onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))}
                    placeholder="Author name" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Language</label>
                  <select value={formData.language} onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-purple-400 cursor-pointer">
                    <option>Filipino</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Grade Level Target</label>
                  <select value={formData.gradeLevel} onChange={(e) => setFormData((p) => ({ ...p, gradeLevel: e.target.value }))}
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Select grade...</option>
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Difficulty Level</label>
                  <select value={formData.difficultyLevel} onChange={(e) => setFormData((p) => ({ ...p, difficultyLevel: e.target.value }))}
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-purple-400 cursor-pointer">
                    <option value="">Select difficulty...</option>
                    {['Beginner', 'Intermediate', 'Advanced'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Reading Time (minutes)</label>
                  <input type="number" value={formData.readingTimeMinutes} onChange={(e) => setFormData((p) => ({ ...p, readingTimeMinutes: e.target.value }))}
                    placeholder="e.g. 5" min="1" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Fable, Adventure" className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-purple-400 cursor-pointer">
                    <option value="draft">Draft</option>
                    <option value="active">Published</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Short description of the story"
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 transition-colors resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">Story Content</label>
                  <textarea value={formData.contentText} onChange={(e) => setFormData((p) => ({ ...p, contentText: e.target.value }))}
                    rows={10} placeholder="Enter the full story text here..."
                    className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-xs text-ink placeholder-ink/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-colors resize-none" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur-sm">
              <button type="button" onClick={() => setIsFormOpen(false)}
                className="rounded-full border border-ink/10 px-5 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-full bg-purple-700 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-60">
                {saving && <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {saving ? 'Saving...' : (editingStory ? 'Save Changes' : 'Create Story')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
