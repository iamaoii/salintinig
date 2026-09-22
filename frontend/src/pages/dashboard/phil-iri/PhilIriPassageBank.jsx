import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  MagnifyingGlass,
  Funnel,
  Eye,
  X,
  Quotes,
  FileText,
  SquaresFour,
  ListBullets,
  Article,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import { getToken } from '../../../lib/auth.js';
import { CardGridSkeleton } from '../../../components/common/Skeleton.jsx';
import { cacheService } from '../../../services/cacheService.js';

const SET_COLORS = {
  'Set A': 'bg-purple-100/90 text-purple-900 border border-purple-200/80',
  'Set B': 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
  'Set C': 'bg-rose-100/90 text-rose-900 border border-rose-200/80',
  'Set D': 'bg-orange-100/90 text-orange-950 border border-orange-200/80',
};

export default function PhilIriPassageBank() {
  const cachedPassages = cacheService.get('teacher_phil_iri_passages') || cacheService.get('teacher_passages');
  const [passages, setPassages] = useState(cachedPassages || []);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [activePassage, setActivePassage] = useState(null);
  const [isLoading, setIsLoading] = useState(!cachedPassages || cachedPassages.length === 0);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const cached = cacheService.get('teacher_phil_iri_passages') || cacheService.get('teacher_passages');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setPassages(cached);
      setIsLoading(false);
    }

    const token = getToken();
    fetch(getApiUrl('/api/teacher/assessments/passages'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.passages)) {
          setPassages(data.passages);
          cacheService.set('teacher_phil_iri_passages', data.passages);
          cacheService.set('teacher_passages', data.passages);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Lock body and html scroll when passage reader modal is open
  useEffect(() => {
    if (activePassage) {
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
  }, [activePassage]);

  // Reset page number on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedLanguage, selectedSet, selectedStatus, searchQuery]);

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      // Grade filter
      if (selectedGrade !== 'All') {
        const pGrade = (p.grade_level || p.grade || '').toLowerCase();
        const target = selectedGrade.toLowerCase();
        if (!pGrade.includes(target)) return false;
      }

      // Language filter
      if (selectedLanguage !== 'All') {
        const lang = (p.language || '').toLowerCase();
        const target = selectedLanguage.toLowerCase();
        if (!lang.includes(target.slice(0, 3))) return false;
      }

      // Set filter
      if (selectedSet !== 'All') {
        const pSet = (p.passage_set || p.set || '').toLowerCase();
        const target = selectedSet.toLowerCase();
        if (pSet !== target) return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        const pStatus = (p.status || 'published').toLowerCase();
        const target = selectedStatus.toLowerCase();
        if (!pStatus.includes(target)) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const textMatch = (p.content_text || p.text || '').toLowerCase().includes(q);
        if (!titleMatch && !textMatch) return false;
      }

      return true;
    });
  }, [passages, selectedGrade, selectedLanguage, selectedSet, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPassages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPassages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPassages, currentPage]);

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <BackButton size={22} />
        <BookOpen size={28} className="text-brand-red" />
        <h1 className="text-3xl font-bold text-ink">Phil-IRI Passage Bank</h1>
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-ink/10 pb-3">
        <p className="px-1 text-sm font-medium text-ink/60 truncate">
          Official DepEd Phil-IRI reading passages repository for screening and evaluation
        </p>

        <Link
          to="/teacher/class-activities/phil-iri/assign"
          className="flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span>Assign Phil-IRI Sets Now</span>
        </Link>
      </div>

      {/* ── Filters & Search Toolbar (Matching Admin/SuperAdmin Design) ── */}
      <div className="mt-4 rounded-2xl border border-ink/10 bg-cream p-4 space-y-3 shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
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

      {/* Results Header Info */}
      <div className="mt-3.5 flex items-center justify-between px-1 text-xs text-ink/60 font-semibold">
        <span>
          Showing {filteredPassages.length > 0 ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredPassages.length) : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredPassages.length)} of {filteredPassages.length} passages
        </span>
        {totalPages > 1 && (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* Passage Cards / List View */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filteredPassages.length === 0 ? (
        <div className="mt-4 py-16 text-center rounded-2xl border border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)]">
          <Article size={40} className="text-ink/20 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-ink">No passages found</h3>
          <p className="text-xs text-ink/50 mt-0.5">Try adjusting your search or filter settings.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (2 columns, matching Admin page) */
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {paginatedPassages.map((passage, idx) => {
            const isFil = (passage.language || '').toLowerCase().includes('fil');
            const isArchived = (passage.status || '').toLowerCase() === 'archived';
            const setBadgeStyle = SET_COLORS[passage.passage_set || passage.set] || 'bg-ink/5 text-ink';
            const qCount = passage.questions?.length || passage.question_count || 0;
            const wCount = passage.word_count || (passage.content_text ? passage.content_text.trim().split(/\s+/).length : 0);

            return (
              <div
                key={passage.passage_id || passage.id || idx}
                onClick={() => setActivePassage(passage)}
                className={`group rounded-2xl border p-5 transition-all flex flex-col justify-between cursor-pointer ${
                  isArchived
                    ? 'border-ink/10 bg-ink/[0.02] opacity-75'
                    : 'border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] hover:border-ink/20'
                }`}
              >
                <div>
                  {/* Badges row: Set, Grade, Language, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${setBadgeStyle}`}>
                        {passage.passage_set || passage.set || 'Set A'}
                      </span>
                      <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                        {passage.grade_level || passage.grade || 'Grade 4'}
                      </span>
                      <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70">
                        {isFil ? 'Filipino' : 'English'}
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

                  <h3 className="text-base font-bold text-ink mb-1 group-hover:text-brand-blue transition-colors">
                    {passage.title}
                  </h3>

                  <p className="text-xs text-ink/70 leading-relaxed line-clamp-3 mb-3">
                    "{passage.content_text || passage.text}"
                  </p>
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink/60">
                    {wCount} words {qCount > 0 ? `• ${qCount} Questions` : ''}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePassage(passage);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                    title="Preview Passage"
                  >
                    <Eye size={14} weight="bold" />
                    <span>Preview Passage</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="mt-4 rounded-2xl border border-ink/10 bg-cream shadow-[0px_2px_8px_rgba(26,24,22,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-ink/[0.02] text-xs font-bold text-ink/50">
                <tr>
                  <th className="px-5 py-3">Set</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Grade Level</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Word Count</th>
                  <th className="pr-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {paginatedPassages.map((passage, idx) => {
                  const isFil = (passage.language || '').toLowerCase().includes('fil');
                  const setBadgeStyle = SET_COLORS[passage.passage_set || passage.set] || 'bg-ink/5 text-ink';
                  const wCount = passage.word_count || (passage.content_text ? passage.content_text.trim().split(/\s+/).length : 0);

                  return (
                    <tr key={passage.passage_id || passage.id || idx} className="hover:bg-white/60 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${setBadgeStyle}`}>
                          {passage.passage_set || passage.set || 'Set A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-ink">
                        {passage.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                          {passage.grade_level || passage.grade || 'Grade 4'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/70">
                        {isFil ? 'Filipino' : 'English'}
                      </td>
                      <td className="px-4 py-3 text-ink/70">
                        {wCount} words
                      </td>
                      <td className="pr-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActivePassage(passage)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                        >
                          <Eye size={14} weight="bold" />
                          <span>Preview Passage</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3 text-xs text-ink/70">
          <span>
            Showing page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="flex size-7 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-brand-blue text-white shadow-2xs'
                    : 'border border-ink/15 bg-white text-ink/70 hover:bg-ink/5'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="flex size-7 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 cursor-pointer"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW PASSAGE MODAL (Exact Admin Page Design) ── */}
      {activePassage &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-2xl flex flex-col animate-in fade-in">
              {/* Fixed Header */}
              <div className="flex items-center justify-between border-b border-ink/10 p-5 shrink-0 bg-cream">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${SET_COLORS[activePassage.passage_set || activePassage.set] || 'bg-ink/5 text-ink'}`}>
                      {activePassage.passage_set || activePassage.set || 'Set A'}
                    </span>
                    <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                      {activePassage.grade_level || activePassage.grade || 'Grade 4'}
                    </span>
                    <span className="text-xs text-ink/50 font-medium">
                      • {(activePassage.language || '').toLowerCase().includes('fil') ? 'Filipino' : 'English'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink">{activePassage.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePassage(null)}
                  className="flex size-8 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Passage Story Text Box */}
                <div className="rounded-xl border border-ink/10 bg-white p-4">
                  <p className="text-sm leading-relaxed text-ink whitespace-pre-line font-sans">
                    {activePassage.content_text || activePassage.text}
                  </p>
                  <p className="text-[11px] text-ink/40 mt-3 pt-2 border-t border-ink/10">
                    Word Count: {activePassage.word_count || (activePassage.content_text ? activePassage.content_text.trim().split(/\s+/).length : 0)} words
                  </p>
                </div>

                {/* Comprehension Questions & Answer Keys */}
                {(!activePassage.questions || activePassage.questions.length === 0) ? (
                  <p className="text-xs text-ink/40 italic">No questions attached to this passage yet.</p>
                ) : (
                  <div className="space-y-4 pt-1">
                    <h4 className="text-xs font-bold text-ink/70 uppercase tracking-wider">
                      Comprehension Questions ({activePassage.questions.length})
                    </h4>
                    {activePassage.questions.map((q, qIdx) => {
                      const correctOptIdx = q.correctAnswer !== undefined ? Number(q.correctAnswer) : -1;
                      return (
                        <div key={qIdx} className="rounded-2xl border border-ink/10 bg-white p-5 space-y-3.5 shadow-xs">
                          <p className="text-sm font-bold text-ink">
                            {qIdx + 1}. {q.question || q.question_text}
                          </p>
                          {q.options && q.options.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = correctOptIdx === optIdx || opt === q.answer;
                                return (
                                  <div
                                    key={optIdx}
                                    className={`rounded-full px-4 py-2 text-xs border flex items-center transition-all ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-800 shadow-2xs'
                                        : 'bg-white border-ink/15 text-ink/70'
                                    }`}
                                  >
                                    <span className="font-bold mr-2 text-ink">{String.fromCharCode(65 + optIdx)}.</span>
                                    <span className="truncate">{opt}</span>
                                    {isCorrect && (
                                      <span className="ml-1.5 font-bold text-emerald-700 shrink-0"> (Correct Answer)</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : q.answer ? (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 inline-block">
                              Answer Key: {q.answer}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end p-4 px-5 border-t border-ink/10 shrink-0 bg-cream">
                <button
                  type="button"
                  onClick={() => setActivePassage(null)}
                  className="rounded-full bg-brand-blue px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
