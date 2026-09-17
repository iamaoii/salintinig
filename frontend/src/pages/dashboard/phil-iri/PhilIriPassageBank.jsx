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
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import { getToken, getUser } from '../../../lib/auth.js';

const SET_COLORS = {
  'Set A': 'bg-purple-100/90 text-purple-900 border border-purple-200/80',
  'Set B': 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
  'Set C': 'bg-rose-100/90 text-rose-900 border border-rose-200/80',
  'Set D': 'bg-orange-100/90 text-orange-950 border border-orange-200/80',
};

export default function PhilIriPassageBank() {
  const user = getUser();
  const teacherGrade = user?.grade || user?.grade_level || user?.assigned_grade || 'Grade 4';
  const initialGrade = teacherGrade.toString().toLowerCase().includes('grade') ? teacherGrade : `Grade ${teacherGrade}`;

  const [passages, setPassages] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedSet, setSelectedSet] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [activePassage, setActivePassage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const token = getToken();
    const fetchPassages = () => {
      fetch('/api/teacher/assessments/passages', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.passages)) {
            setPassages(data.passages);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    };
    fetchPassages();
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
  }, [selectedGrade, selectedLanguage, selectedSet, searchQuery]);

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      // Grade filter
      if (selectedGrade !== 'all') {
        const pGrade = (p.grade_level || '').toLowerCase();
        const target = selectedGrade.toLowerCase();
        if (!pGrade.includes(target)) return false;
      }

      // Language filter
      const lang = (p.language || '').toLowerCase();
      if (selectedLanguage === 'fil' && !(lang === 'fil' || lang === 'filipino')) return false;
      if (selectedLanguage === 'en' && !(lang === 'en' || lang === 'eng' || lang === 'english')) return false;

      // Set filter
      if (selectedSet !== 'all' && p.passage_set !== selectedSet) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const textMatch = (p.content_text || '').toLowerCase().includes(q);
        if (!titleMatch && !textMatch) return false;
      }

      return true;
    });
  }, [passages, selectedGrade, selectedLanguage, selectedSet, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPassages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPassages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPassages, currentPage]);

  const gradeOptions = ['all', 'Grade 4', 'Grade 5', 'Grade 6'];

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <BackButton size={22} />
        <BookOpen size={28} className="text-brand-blue" />
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

      {/* Grade Level Selector Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-ink/70">Grade Level:</span>
          <div className="flex items-center gap-1.5 rounded-2xl border border-ink/10 bg-cream p-1.5 shadow-2xs">
            {gradeOptions.map((g) => {
              const isSelected = selectedGrade === g;
              const label = g === 'all' ? 'All' : g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-blue text-white shadow-xs'
                      : 'text-ink/70 hover:bg-white/60 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-cream p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-brand-blue shadow-2xs'
                : 'text-ink/60 hover:text-ink'
            }`}
            title="Grid View"
          >
            <SquaresFour size={16} weight="bold" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-brand-blue shadow-2xs'
                : 'text-ink/60 hover:text-ink'
            }`}
            title="Compact List View"
          >
            <ListBullets size={16} weight="bold" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Secondary Filters Bar (Search, Language, Set) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-3.5 shadow-xs">
        {/* Search Bar */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-ink/15 bg-white px-3.5 py-2">
          <MagnifyingGlass size={18} className="text-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passage title or text content..."
            className="w-full bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-ink/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ink/40 hover:text-ink cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
            <Funnel size={15} />
            <span>Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-brand-blue cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="fil">Filipino (FIL)</option>
              <option value="en">English (ENG)</option>
            </select>
          </div>

          {/* Set Selector */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
            <span>Passage Set:</span>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-brand-blue cursor-pointer"
            >
              <option value="all">All Sets (A - D)</option>
              <option value="Set A">Set A</option>
              <option value="Set B">Set B</option>
              <option value="Set C">Set C</option>
              <option value="Set D">Set D</option>
            </select>
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

      {/* Content Rendering: Grid View vs List View */}
      {isLoading ? (
        <div className="mt-8 flex justify-center py-12 text-sm font-semibold text-ink/50">
          Loading Phil-IRI passages...
        </div>
      ) : paginatedPassages.length > 0 ? (
        viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPassages.map((p, idx) => {
              const isFil = (p.language || '').toLowerCase().includes('fil');
              const setBadgeStyle = SET_COLORS[p.passage_set] || 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20';
              return (
                <div
                  key={p.passage_id || idx}
                  onClick={() => setActivePassage(p)}
                  className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer"
                >
                  <div className="space-y-2">
                    {/* Header: Set badge + Language badge on left, Grade Level on right */}
                    <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${setBadgeStyle}`}>
                          {p.passage_set || 'Set A'}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isFil
                              ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200/80'
                              : 'bg-blue-100/90 text-blue-900 border border-blue-200/80'
                          }`}
                        >
                          {isFil ? 'Filipino' : 'English'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-ink/50">{p.grade_level || 'Grade 4'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-brand-blue transition-colors">
                      {p.title}
                    </h3>

                    {/* Faded Text Excerpt Box */}
                    <div className="bg-cream/60 p-2.5 rounded-xl border border-ink/5">
                      <p className="text-xs text-ink/70 leading-relaxed font-serif line-clamp-3 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_50%,rgba(0,0,0,0)_100%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_50%,rgba(0,0,0,0)_100%)]">
                        "{p.content_text}"
                      </p>
                    </div>
                  </div>

                  {/* Footer line: Word Count & Read Passage */}
                  <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink/60 bg-ink/5 px-2.5 py-0.5 rounded-md">
                      {p.word_count ? `${p.word_count} words` : 'Passage text'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePassage(p);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                    >
                      <Eye size={14} weight="bold" />
                      <span>Read Passage</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT LIST VIEW */
          <div className="mt-3 overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink/10 bg-cream/80 text-[11px] font-bold text-ink/60 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Set</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Grade Level</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Word Count</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 bg-white">
                  {paginatedPassages.map((p, idx) => {
                    const isFil = (p.language || '').toLowerCase().includes('fil');
                    const setBadgeStyle = SET_COLORS[p.passage_set] || 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20';
                    return (
                      <tr
                        key={p.passage_id || idx}
                        onClick={() => setActivePassage(p)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold">
                          <span className={`rounded-md px-2.5 py-0.5 text-xs ${setBadgeStyle}`}>
                            {p.passage_set || 'Set A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">{p.title}</td>
                        <td className="px-4 py-3 font-semibold text-ink/70">{p.grade_level || 'Grade 4'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                              isFil ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isFil ? 'Filipino' : 'English'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink/60 font-medium">{p.word_count ? `${p.word_count} words` : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePassage(p);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                          >
                            <Eye size={14} /> Read
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-cream p-10 text-center">
          <FileText size={40} className="text-ink/30" />
          <h3 className="mt-3 text-base font-bold text-ink">No Phil-IRI Passages Found</h3>
          <p className="mt-1 text-xs text-ink/50">
            No passage matching your selected grade level, language, or set filter was found.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex items-center gap-1 rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" /> Previous
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === pg
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                }`}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="flex items-center gap-1 rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <CaretRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Reader Modal */}
      {activePassage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 overscroll-none"
          onClick={() => setActivePassage(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                  {activePassage.passage_set || 'Set A'}
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  {(activePassage.language || '').toLowerCase().includes('fil') ? 'Filipino' : 'English'}
                </span>
                <span className="text-xs font-semibold text-ink/60">{activePassage.grade_level || 'Grade 4'}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePassage(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
                aria-label="Close passage reader"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-bold text-ink">{activePassage.title}</h2>
              <span className="text-xs text-ink/50 font-medium">Word Count: {activePassage.word_count || 0} words</span>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 text-sm sm:text-base leading-relaxed tracking-wide text-ink font-serif shadow-2xs">
                <Quotes size={28} className="mb-2 text-amber-500/80" />
                <p className="whitespace-pre-line">{activePassage.content_text}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3">
              <span className="text-xs text-ink/40">DepEd Phil-IRI Standard Reading Passage</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
