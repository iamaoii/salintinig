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
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';

const INITIAL_PASSAGES = [
  {
    id: 1,
    title: 'Ang Masikhay na Magsasaka',
    grade: 'Grade 4',
    set: 'Set A',
    language: 'Filipino',
    status: 'Published',
    words: 120,
    text: 'Si Mang Juan ay isang masikhay na magsasaka sa lalawigan ng Bulacan. Araw-araw, bago pa man sumikat ang araw, siya ay nasa bukid na upang mag-araro at magtanim ng palay. Dahil sa kanyang sipag at tiyaga, palaging masagana ang kanyang ani. Ipinagmamalaki niya ang kanyang propesyon dahil ito ang nagpapakain sa kanyang pamilya at sa maraming mamamayan.',
    questions: [
      {
        id: 1,
        question: 'Sino ang pangunahing tauhan sa kuwento?',
        options: ['Si Mang Juan', 'Si Mang Pedro', 'Si Mang Jose', 'Si Mang Kulas'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
      {
        id: 2,
        question: 'Saan matatagpuan ang bukid ni Mang Juan?',
        options: ['Bulacan', 'Pampanga', 'Laguna', 'Nueva Ecija'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
      {
        id: 3,
        question: 'Bakit masagana ang ani ni Mang Juan?',
        options: ['Dahil sa sipag at tiyaga', 'Dahil sa ulan', 'Dahil sa swerte', 'Dahil sa tulong ng kapitbahay'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
    ],
  },
  {
    id: 2,
    title: 'The Diligent Farmer',
    grade: 'Grade 4',
    set: 'Set A',
    language: 'English',
    status: 'Published',
    words: 118,
    text: 'Mang Juan is a hardworking farmer from Bulacan. Every day, before the sun rises, he is already in the field plowing and planting rice. Because of his diligence and perseverance, his harvest is always bountiful. He takes pride in his profession because it feeds his family and many citizens.',
    questions: [
      {
        id: 1,
        question: 'Who is the main character in the story?',
        options: ['Mang Juan', 'Mang Pedro', 'Mang Jose', 'Mang Kulas'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
      {
        id: 2,
        question: 'Where is Mang Juan from?',
        options: ['Bulacan', 'Pampanga', 'Laguna', 'Cavite'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
    ],
  },
  {
    id: 3,
    title: 'Ang Puso ng Kabundukan',
    grade: 'Grade 5',
    set: 'Set B',
    language: 'Filipino',
    status: 'Published',
    words: 145,
    text: 'Sa gitna ng serye ng matatayog na kabundukan ng Cordillera, may isang malinis na batis na siyang pinagmumulan ng tubig para sa buong nayon. Ang mga katutubong mamamayan doon ay maingat na inaalagaan ang kagubatan sapagkat naniniwala silang ang kalikasan ang buhay ng kanilang komunidad.',
    questions: [
      {
        id: 1,
        question: 'Saan matatagpuan ang malinis na batis?',
        options: ['Sa Cordillera', 'Sa Sierra Madre', 'Sa Banahaw', 'Sa Apo'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
    ],
  },
  {
    id: 4,
    title: 'The Light of Tomorrow',
    grade: 'Grade 6',
    set: 'Set D',
    language: 'English',
    status: 'Draft',
    words: 165,
    text: 'Education has always been hailed as the great equalizer of opportunities. In a remote village in the Philippines, young learners travel miles on foot just to reach the nearest elementary school. Their unwavering spirit demonstrates that hope burns brightest when fueled by passion for learning.',
    questions: [
      {
        id: 1,
        question: 'What is described as the great equalizer?',
        options: ['Education', 'Hard work', 'Wealth', 'Friendship'],
        correctAnswer: 0,
        type: 'Multiple Choice',
      },
    ],
  },
];

export default function AdminPhilIriPassages() {
  const [passages, setPassages] = useState(INITIAL_PASSAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPassage, setPreviewPassage] = useState(null);

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPassageId, setEditingPassageId] = useState(null);
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

  // Archive / Delete Passage
  const handleArchive = (id) => {
    setPassages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'Archived' ? 'Published' : 'Archived' } : p))
    );
    setToast({ message: 'Passage status updated.' });
  };

  // Save Add/Edit form
  const handleSaveForm = (e, statusOverride) => {
    if (e) e.preventDefault();
    if (!formData.title.trim() || !formData.text.trim()) {
      setToast({ message: 'Please enter a passage title and body text.' });
      return;
    }

    const targetStatus = statusOverride || formData.status || 'Published';
    const wordCount = formData.text.trim().split(/\s+/).filter(Boolean).length;

    if (editingPassageId) {
      // Edit
      setPassages((prev) =>
        prev.map((p) =>
          p.id === editingPassageId
            ? { ...p, ...formData, status: targetStatus, words: wordCount }
            : p
        )
      );
      setToast({ message: targetStatus === 'Draft' ? 'Passage saved as draft.' : 'Passage updated successfully.' });
    } else {
      // Add
      const newPassage = {
        id: Date.now(),
        ...formData,
        status: targetStatus,
        words: wordCount,
      };
      setPassages((prev) => [newPassage, ...prev]);
      setToast({ message: targetStatus === 'Draft' ? 'Passage saved as draft.' : 'New passage published successfully.' });
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

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="w-full space-y-6">

        {/* ── Page Header & Action ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Article size={24} className="text-orange-500 shrink-0" />
              <h2 className="text-xl font-bold text-ink">Phil-IRI Content Management</h2>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Manage official DepEd Phil-IRI reading passages and comprehension questions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-blue/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} weight="bold" />
            <span>Add Passage</span>
          </button>
        </div>

        {/* ── Filters & Search Toolbar (Matching Wireframe) ── */}
        <div className="rounded-2xl border border-ink/10 bg-white p-4 space-y-3 shadow-xs">
          {/* Top Control Bar: Search & Dropdown Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-ink/10">
            
            {/* System Standard Search Bar */}
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search passage title or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-ink/60 font-semibold mr-0.5">
                <Funnel size={16} />
                <span>Filters:</span>
              </div>

              {/* Language */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Languages</option>
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
              </select>

              {/* Passage Set */}
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Sets</option>
                <option value="Set A">Set A</option>
                <option value="Set B">Set B</option>
                <option value="Set C">Set C</option>
                <option value="Set D">Set D</option>
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Grade Level Filter Tabs (Matching User Wireframe: Grade 4 | Grade 5 | Grade 6) */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs font-bold text-ink/50 mr-2">Grade Level:</span>
            {['All', 'Grade 4', 'Grade 5', 'Grade 6'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`rounded-full px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-brand-blue text-white shadow-2xs'
                    : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
                }`}
              >
                {g}
              </button>
            ))}

            <span className="text-[11px] font-semibold text-ink/40 ml-auto">
              {filteredPassages.length} passages found
            </span>
          </div>
        </div>

        {/* ── Passage Cards Grid (Matching User Wireframe Card Layout) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPassages.length === 0 ? (
            <div className="col-span-full py-16 text-center rounded-2xl border border-ink/10 bg-white">
              <Article size={40} className="text-ink/20 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-ink/60">No passages found</h3>
              <p className="text-xs text-ink/40 mt-0.5">Try adjusting search or filter settings.</p>
            </div>
          ) : (
            filteredPassages.map((passage) => {
              const questionCount = passage.questions ? passage.questions.length : 0;

              let statusBadge = (
                <span className="rounded-full bg-[#00a652]/10 border border-[#00a652]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#00a652]">
                  Published
                </span>
              );

              if (passage.status === 'Draft') {
                statusBadge = (
                  <span className="rounded-full bg-[#ffc300]/20 border border-[#ffc300]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#b38600]">
                    Draft
                  </span>
                );
              } else if (passage.status === 'Archived') {
                statusBadge = (
                  <span className="rounded-full bg-ink/5 border border-ink/10 px-2.5 py-0.5 text-[10px] font-semibold text-ink/50">
                    Archived
                  </span>
                );
              }

              return (
                <div
                  key={passage.id}
                  className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    {/* Header line: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2">
                        {passage.title}
                      </h3>
                      {statusBadge}
                    </div>

                    {/* Metadata line: Grade 4 • English • Set A */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink/60 font-medium">
                      <span className="font-bold text-brand-blue">{passage.grade}</span>
                      <span>•</span>
                      <span>{passage.language}</span>
                      <span>•</span>
                      <span className="font-semibold text-ink/70 bg-ink/5 px-2 py-0.5 rounded-md">{passage.set}</span>
                    </div>

                    {/* Excerpt with Natural Text Mask Fade */}
                    <div className="bg-cream/60 p-2.5 rounded-xl border border-ink/5">
                      <p className="text-xs text-ink/70 leading-relaxed font-serif line-clamp-3 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_50%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_50%,rgba(0,0,0,0)_100%)]">
                        "{passage.text}"
                      </p>
                    </div>
                  </div>

                  {/* Footer line: Questions Count & Actions (Edit | Archive | Preview) */}
                  <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink/60 bg-ink/5 px-2.5 py-0.5 rounded-md">
                      Questions: {questionCount}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPassage(passage);
                          setIsPreviewOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue/10 transition-colors cursor-pointer"
                        title="Preview Passage"
                      >
                        <Eye size={14} weight="bold" />
                        <span>Preview</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(passage)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                        title="Edit Passage"
                      >
                        <Pencil size={14} weight="bold" />
                        <span>Edit</span>
                      </button>

                      {/* Archive Button */}
                      <button
                        type="button"
                        onClick={() => handleArchive(passage.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-red hover:bg-brand-red/10 transition-colors cursor-pointer"
                        title={passage.status === 'Archived' ? 'Restore Passage' : 'Archive Passage'}
                      >
                        <Archive size={14} weight="bold" />
                        <span>{passage.status === 'Archived' ? 'Restore' : 'Archive'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── PREVIEW MODAL ── */}
      {isPreviewOpen && previewPassage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider block">Passage Preview</span>
                <h2 className="text-lg font-bold text-ink">{previewPassage.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-blue/10 px-3 py-0.5 text-xs font-bold text-brand-blue">
                {previewPassage.grade}
              </span>
              <span className="rounded-full bg-white border border-ink/15 px-3 py-0.5 text-xs font-semibold text-ink/70">
                Language: {previewPassage.language}
              </span>
              <span className="rounded-full bg-white border border-ink/15 px-3 py-0.5 text-xs font-semibold text-ink/70">
                Set: {previewPassage.set}
              </span>
              <span className="rounded-full bg-white border border-ink/15 px-3 py-0.5 text-xs font-semibold text-ink/70">
                Word Count: {previewPassage.words} words
              </span>
            </div>

            {/* Passage Body Text */}
            <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2">
              <h4 className="text-xs font-bold text-ink/50 uppercase tracking-wider">Passage Content</h4>
              <p className="text-sm text-ink leading-relaxed font-serif text-justify whitespace-pre-line">
                {previewPassage.text}
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-ink/50 uppercase tracking-wider">
                Comprehension Questions ({previewPassage.questions?.length || 0})
              </h4>

              {(!previewPassage.questions || previewPassage.questions.length === 0) ? (
                <p className="text-xs text-ink/40 italic">No questions attached to this passage yet.</p>
              ) : (
                previewPassage.questions.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-ink/10 bg-white p-3.5 space-y-2">
                    <p className="text-xs font-bold text-ink">
                      {idx + 1}. {q.question}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`rounded-lg px-2.5 py-1 text-xs border ${
                              q.correctAnswer === optIdx
                                ? 'bg-[#00a652]/10 border-[#00a652]/30 font-bold text-[#00a652]'
                                : 'bg-cream/50 border-ink/10 text-ink/70'
                            }`}
                          >
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                            {q.correctAnswer === optIdx && <span className="ml-1 text-[10px]"> (Correct Answer)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full border border-ink/15 bg-white px-5 py-2 text-xs font-bold text-ink/70 hover:bg-ink/5 cursor-pointer transition-colors"
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
            <div className="p-4 px-6 border-t border-ink/10 bg-cream flex items-center justify-between shrink-0">
              {modalTab === 'details' ? (
                <div></div>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalTab('details')}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-cream px-6 py-2 text-xs font-bold text-ink/70 hover:bg-ink/10 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={16} weight="bold" />
                  <span>Back to Details</span>
                </button>
              )}

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
