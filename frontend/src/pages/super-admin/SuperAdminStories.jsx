import { getApiUrl } from '../../config/api.js';
import { useState, useMemo, useEffect } from 'react';
import {
  BookBookmark,
  MagnifyingGlass,
  Plus,
  Pencil,
  Eye,
  CheckCircle,
  Archive,
  Funnel,
  SquaresFour,
  ListBullets,
  CaretLeft,
  CaretRight,
  X,
  Clock,
  Trash,
  Check,
  SpinnerGap,
  Sparkle,
  FileText,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

function StatusBadge({ status }) {
  const s = (status || 'active').toLowerCase();
  let cls = 'bg-ink/5 text-ink/50 border-ink/10';
  if (s === 'active' || s === 'published') {
    cls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (s === 'draft') {
    cls = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (s === 'archived') {
    cls = 'bg-ink/10 text-ink/60 border-ink/20';
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border capitalize ${cls}`}>
      {s}
    </span>
  );
}

const CATEGORIES = [
  'All',
  'Short Story',
  'Poem',
  'Fable',
  'Folktale',
  'Informational',
  'Alamat',
  'Kwento',
  'Pabula',
];

export default function SuperAdminStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const PAGE_SIZE = 8;

  // Modals state
  const [previewStory, setPreviewStory] = useState(null);
  const isPreviewOpen = Boolean(previewStory);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'quiz'
  const [savingStory, setSavingStory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    contentText: '',
    language: 'Filipino',
    category: 'Short Story',
    gradeLevelTarget: 'Grade 4',
    difficultyLevel: 'Medium',
    readingTimeMinutes: 3,
    status: 'active',
    quizQuestions: [],
  });

  const fetchStories = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(getApiUrl('/api/super-admin/stories'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.stories)) {
        setStories(data.stories);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.warn('Failed to load stories:', err);
      setToast({ message: 'Failed to fetch reading materials.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (isAddEditOpen || isPreviewOpen) {
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
  }, [isAddEditOpen, isPreviewOpen]);

  const handleToggleStatus = async (storyId, newStatus) => {
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/super-admin/stories/${storyId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Story status updated to ${newStatus}.`, type: 'success' });
        fetchStories();
      } else {
        setToast({ message: data.error || 'Failed to update status.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error.', type: 'error' });
    }
  };

  const handleOpenAdd = () => {
    setEditingStoryId(null);
    setFormData({
      title: '',
      author: '',
      description: '',
      contentText: '',
      language: 'Filipino',
      category: 'Short Story',
      gradeLevelTarget: 'Grade 4',
      difficultyLevel: 'Medium',
      readingTimeMinutes: 3,
      status: 'active',
      quizQuestions: [],
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (story) => {
    setEditingStoryId(story.id);
    let parsedQuiz = [];
    if (Array.isArray(story.quiz_questions)) {
      parsedQuiz = story.quiz_questions;
    } else if (typeof story.quiz_questions === 'string') {
      try {
        parsedQuiz = JSON.parse(story.quiz_questions);
      } catch (e) {}
    }

    setFormData({
      title: story.title || '',
      author: story.author || '',
      description: story.description || '',
      contentText: story.content_text || '',
      language: story.language || 'Filipino',
      category: story.category || 'Short Story',
      gradeLevelTarget: story.grade_level_target || 'Grade 4',
      difficultyLevel: story.difficulty_level || 'Medium',
      readingTimeMinutes: story.reading_time_minutes || 3,
      status: story.status || 'active',
      quizQuestions: parsedQuiz,
    });
    setModalTab('details');
    setIsAddEditOpen(true);
  };

  // Quiz Builder
  const handleAddQuizQuestion = () => {
    const newQ = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setFormData((prev) => ({
      ...prev,
      quizQuestions: [...(prev.quizQuestions || []), newQ],
    }));
  };

  const handleRemoveQuizQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((_, i) => i !== index),
    }));
  };

  const handleQuizQuestionChange = (qIndex, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.quizQuestions];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return { ...prev, quizQuestions: updated };
    });
  };

  const handleQuizOptionChange = (qIndex, optIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.quizQuestions];
      const opts = [...(updated[qIndex].options || ['', '', '', ''])];
      opts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return { ...prev, quizQuestions: updated };
    });
  };

  const handleSaveStory = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim() || !formData.contentText.trim()) {
      setToast({ message: 'Title and story content text are required.', type: 'error' });
      return;
    }

    try {
      setSavingStory(true);
      const token = getToken();
      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim() || 'Unknown',
        description: formData.description.trim() || null,
        content_text: formData.contentText.trim(),
        language: formData.language,
        category: formData.category,
        grade_level_target: formData.gradeLevelTarget,
        difficulty_level: formData.difficultyLevel,
        reading_time_minutes: Number(formData.readingTimeMinutes) || 3,
        quiz_questions: formData.quizQuestions || [],
        status: formData.status,
      };

      const endpoint = editingStoryId
        ? `/api/super-admin/stories/${editingStoryId}`
        : '/api/super-admin/stories';
      const method = editingStoryId ? 'PUT' : 'POST';

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
          message: editingStoryId ? 'Story updated successfully.' : 'Story created successfully.',
          type: 'success',
        });
        setIsAddEditOpen(false);
        fetchStories();
      } else {
        setToast({ message: data.error || 'Failed to save story.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error saving story.', type: 'error' });
    } finally {
      setSavingStory(false);
    }
  };

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'All' ||
        s.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesLang =
        selectedLanguage === 'All' ||
        s.language?.toLowerCase() === selectedLanguage.toLowerCase();

      const matchesStatus =
        selectedStatus === 'All' ||
        (s.status || 'active').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesLang && matchesStatus;
    });
  }, [stories, searchQuery, selectedCategory, selectedLanguage, selectedStatus]);

  const totalPages = Math.ceil(filteredStories.length / PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStories.slice(start, start + PAGE_SIZE);
  }, [filteredStories, currentPage]);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookBookmark size={24} className="text-brand-red shrink-0" />
              <h1 className="text-2xl font-bold text-ink">Story Library Management</h1>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Manage practice stories, fables, legends, and comprehension quizzes available to students.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Add New Story</span>
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-4 space-y-3 shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search story title or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-red"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-ink/60 font-semibold mr-1">
                <Funnel size={16} />
                <span>Filter:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
              >
                <option value="All">All Languages</option>
                <option value="Filipino">Filipino</option>
                <option value="English">English</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-ink/20 bg-cream px-3 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active / Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

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

        {/* Stories Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-16 rounded-md bg-ink/10" />
                      <div className="h-5 w-14 rounded-md bg-ink/5" />
                      <div className="h-5 w-16 rounded-md bg-ink/5" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-ink/10" />
                  </div>
                  <div className="h-5 w-3/4 rounded bg-ink/10 mb-1.5" />
                  <div className="h-3 w-28 rounded bg-ink/5 mb-3" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-ink/5" />
                    <div className="h-3 w-5/6 rounded bg-ink/5" />
                  </div>
                </div>
                <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                  <div className="h-3.5 w-32 rounded bg-ink/5" />
                  <div className="h-4 w-12 rounded bg-ink/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-cream p-12 text-center shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
            <BookBookmark size={40} className="mx-auto text-ink/20 mb-2" />
            <p className="text-sm font-bold text-ink">No stories found</p>
            <p className="text-xs text-ink/50 mt-0.5">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search criteria or filters.'
                : 'Click "Add New Story" to publish your first reading material.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {paginatedStories.map((story) => {
              const s = (story.status || 'active').toLowerCase();
              return (
                <div
                  key={story.id}
                  className="group rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] hover:border-ink/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                          {story.category || 'Story'}
                        </span>
                        <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70">
                          {story.language || 'Filipino'}
                        </span>
                        <span className="rounded-md bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          {story.grade_level_target || 'Grade 4'}
                        </span>
                      </div>
                      <StatusBadge status={story.status} />
                    </div>

                    <h3 className="text-base font-bold text-ink line-clamp-1">{story.title}</h3>
                    <p className="text-xs text-ink/50 mt-0.5">By {story.author || 'Unknown'}</p>

                    {story.description && (
                      <p className="mt-2 text-xs text-ink/70 line-clamp-2 leading-relaxed">
                        {story.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink/50">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{story.reading_time_minutes || 3} mins</span>
                      </span>
                      <span>•</span>
                      <span>{story.difficulty_level || 'Medium'}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPreviewStory(story)}
                        className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                        title="Preview Story"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(story)}
                        className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-brand-blue cursor-pointer"
                        title="Edit Story"
                      >
                        <Pencil size={16} />
                      </button>
                      {s === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(story.id, 'archived')}
                          className="flex size-7 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer"
                          title="Archive Story"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(story.id, 'active')}
                          className="flex size-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title="Publish Story"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
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
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Title & Author</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Category</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Language</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Target Grade</th>
                    <th className="p-3 text-left font-bold text-ink/60 uppercase text-[11px]">Status</th>
                    <th className="p-3 text-right font-bold text-ink/60 uppercase text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {paginatedStories.map((story) => (
                    <tr key={story.id} className="group hover:bg-ink/[0.02] transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-ink text-xs leading-tight">{story.title}</p>
                        <p className="text-[11px] text-ink/50 mt-0.5">By {story.author || 'Unknown'}</p>
                      </td>
                      <td className="p-3 font-semibold text-brand-blue">{story.category || 'Story'}</td>
                      <td className="p-3 text-ink/70">{story.language}</td>
                      <td className="p-3 text-ink/70">{story.grade_level_target || 'Grade 4'}</td>
                      <td className="p-3 text-left">
                        <StatusBadge status={story.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setPreviewStory(story)}
                            className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
                            title="Preview"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(story)}
                            className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-brand-blue cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(story.id, story.status === 'active' ? 'archived' : 'active')
                            }
                            className={`flex size-7 items-center justify-center rounded-lg cursor-pointer ${
                              story.status === 'active'
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={story.status === 'active' ? 'Archive' : 'Publish'}
                          >
                            {story.status === 'active' ? <Archive size={15} /> : <CheckCircle size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/60">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(currentPage * PAGE_SIZE, filteredStories.length)} of {filteredStories.length} stories
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
        )}
      </div>

      {/* Add / Edit Story Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-ink/10 bg-cream shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 p-5">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingStoryId ? 'Edit Story Material' : 'Add New Story Material'}
                </h3>
                <p className="text-xs text-ink/50 mt-0.5">
                  Manage reading content, target grade level, and comprehension quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
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
                1. Story Content & Metadata
              </button>
              <button
                type="button"
                onClick={() => setModalTab('quiz')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'quiz'
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                2. Quiz Questions ({formData.quizQuestions?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {modalTab === 'details' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Story Title <span className="text-brand-red">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ang Alamat ng Pinya"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Author / Source</label>
                      <input
                        type="text"
                        placeholder="e.g. Kwentong Bayan"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink mb-1">Brief Description</label>
                    <input
                      type="text"
                      placeholder="Short synopsis or lesson of the story..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Short Story">Short Story</option>
                        <option value="Poem">Poem</option>
                        <option value="Fable">Fable</option>
                        <option value="Folktale">Folktale</option>
                        <option value="Informational">Informational</option>
                        <option value="Alamat">Alamat</option>
                        <option value="Kwento">Kwento</option>
                        <option value="Pabula">Pabula</option>
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
                      <label className="block font-semibold text-ink mb-1">Target Grade</label>
                      <select
                        value={formData.gradeLevelTarget}
                        onChange={(e) => setFormData({ ...formData, gradeLevelTarget: e.target.value })}
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
                      <label className="block font-semibold text-ink mb-1">Difficulty</label>
                      <select
                        value={formData.difficultyLevel}
                        onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">Estimated Reading Time (mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.readingTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, readingTimeMinutes: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs text-ink outline-none focus:border-brand-red"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 bg-cream px-3 py-2 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-red"
                      >
                        <option value="active">Active (Visible to Students)</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink mb-1">
                      Story Content Text <span className="text-brand-red">*</span>
                    </label>
                    <textarea
                      rows={10}
                      required
                      placeholder="Type or paste the complete reading material text..."
                      value={formData.contentText}
                      onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 bg-cream p-3 text-xs text-ink outline-none focus:border-brand-red leading-relaxed font-sans"
                    />
                  </div>
                </>
              ) : (
                /* Quiz Questions Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ink/60">
                      Add practice quiz questions students will answer after reading this story.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-3.5 py-1.5 text-xs font-bold text-cream hover:bg-brand-red/90 cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Add Quiz Question</span>
                    </button>
                  </div>

                  {(!formData.quizQuestions || formData.quizQuestions.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-ink/40">
                      <FileText size={32} className="mx-auto mb-1 text-ink/20" />
                      <p className="font-semibold">No quiz questions added</p>
                      <p className="text-[11px] mt-0.5">
                        Students can still read the story, or you can add quiz questions to test comprehension.
                      </p>
                    </div>
                  ) : (
                    formData.quizQuestions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink">Quiz Question {qIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuizQuestion(qIdx)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash size={15} />
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Enter quiz question..."
                          value={q.question || ''}
                          onChange={(e) => handleQuizQuestionChange(qIdx, 'question', e.target.value)}
                          className="w-full rounded-lg border border-ink/20 bg-cream px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-red"
                        />

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase text-ink/50">
                            Answer Choices (Select radio button for correct answer):
                          </span>
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`quiz-correct-${qIdx}`}
                                checked={Number(q.correctAnswer) === optIdx}
                                onChange={() => handleQuizQuestionChange(qIdx, 'correctAnswer', optIdx)}
                                className="accent-brand-red cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => handleQuizOptionChange(qIdx, optIdx, e.target.value)}
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
                    onClick={() => setModalTab('quiz')}
                    className="font-semibold text-brand-blue hover:underline cursor-pointer"
                  >
                    Next: Quiz Questions →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className="font-semibold text-ink/60 hover:underline cursor-pointer"
                  >
                    ← Back to Story Details
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
                  onClick={handleSaveStory}
                  disabled={savingStory}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-5 py-2 text-xs font-bold text-cream hover:bg-brand-red/90 disabled:opacity-50 cursor-pointer"
                >
                  {savingStory ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Story</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-ink/10 bg-cream shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 p-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                    {previewStory.category || 'Story'}
                  </span>
                  <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70">
                    {previewStory.language}
                  </span>
                  <span className="text-xs text-ink/50">• {previewStory.grade_level_target}</span>
                </div>
                <h3 className="text-lg font-bold text-ink">{previewStory.title}</h3>
                <p className="text-xs text-ink/50 mt-0.5">By {previewStory.author || 'Unknown'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStory(null)}
                className="flex size-7 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {previewStory.description && (
                <div className="rounded-xl bg-ink/[0.03] border border-ink/10 p-3 italic text-ink/70">
                  {previewStory.description}
                </div>
              )}

              <div className="rounded-xl border border-ink/10 bg-white p-5">
                <p className="text-sm leading-relaxed text-ink whitespace-pre-line font-sans">
                  {previewStory.content_text || 'No text content provided.'}
                </p>
              </div>

              {previewStory.quiz_questions &&
                (Array.isArray(previewStory.quiz_questions) ? previewStory.quiz_questions : []).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-ink text-sm">
                      Comprehension Quiz ({previewStory.quiz_questions.length} questions)
                    </h4>
                    {previewStory.quiz_questions.map((q, idx) => (
                      <div key={idx} className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3 space-y-1.5">
                        <p className="font-semibold text-ink">
                          {idx + 1}. {q.question}
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
                onClick={() => setPreviewStory(null)}
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
