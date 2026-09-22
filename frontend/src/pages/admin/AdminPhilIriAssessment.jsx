import { getApiUrl } from '../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Users,
  MagnifyingGlass,
  Ear,
  UserSound,
  Eye,
  Funnel,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import Avatar from '../../components/dashboard/student/Avatar.jsx';
import { PhilIriAssessmentSkeleton } from '../../components/common/Skeleton.jsx';
import { getToken } from '../../lib/auth.js';
import { cacheService } from '../../services/cacheService.js';

export default function AdminPhilIriAssessment() {
  const { globalSearch } = useOutletContext() || {};
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All'); // All | Pending | Completed
  const [typeFilter, setTypeFilter] = useState('All'); // All | Oral Reading | Silent Reading | Listening
  const [gradeFilter, setGradeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const fetchAssessments = async () => {
    try {
      const cached = cacheService.get('admin_phil_iri_assessments');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setStudents(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/phil-iri/assessments'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.assessments) && data.assessments.length > 0) {
        setStudents(data.assessments);
        cacheService.set('admin_phil_iri_assessments', data.assessments);
      } else {
        fetchStudentsFallback();
      }
    } catch (err) {
      console.warn('Failed to fetch Phil-IRI assessments, falling back:', err);
      fetchStudentsFallback();
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsFallback = async () => {
    try {
      const cachedStds = cacheService.get('admin_students');
      if (cachedStds && Array.isArray(cachedStds) && cachedStds.length > 0) {
        setStudents(cachedStds);
      }
      const token = getToken();
      const res = await fetch(getApiUrl('/api/admin/students'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students || []);
        cacheService.set('admin_students', data.students || []);
      }
    } catch (err) {
      console.warn('Failed to fetch fallback students:', err);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Overview metrics
  const metrics = useMemo(() => {
    const total = students.length;
    let completed = 0;
    let pending = 0;

    students.forEach((s) => {
      const lvl = (s.level || '').toLowerCase();
      const isDone = lvl && !lvl.includes('pending') && lvl !== 'unassessed' && lvl !== 'not assessed' && lvl !== '';
      if (isDone) completed++;
      else pending++;
    });

    return { total, completed, pending };
  }, [students]);

  // Filtered Students list (1 row per student)
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, gradeFilter, searchQuery, globalSearch]);

  const filteredStudents = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return students.filter((s) => {
      const lvl = (s.level || '').toLowerCase();
      const isDone = lvl && !lvl.includes('pending') && lvl !== 'unassessed' && lvl !== 'not assessed' && lvl !== '';

      if (statusFilter === 'Completed' && !isDone) return false;
      if (statusFilter === 'Pending' && isDone) return false;
      if (gradeFilter !== 'All' && s.grade !== gradeFilter) return false;

      if (query) {
        const matchName = s.name?.toLowerCase().includes(query);
        const matchLrn = s.lrn?.toLowerCase().includes(query);
        const matchSection = s.section?.toLowerCase().includes(query);
        if (!matchName && !matchLrn && !matchSection) return false;
      }

      return true;
    });
  }, [students, statusFilter, gradeFilter, globalSearch, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="w-full space-y-6">
        {/* 1. Page Header (Outside container box) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={24} className="text-brand-red shrink-0" />
              <h2 className="text-xl font-bold text-ink">Phil-IRI Assessment Management</h2>
            </div>
            <p className="mt-0.5 text-xs text-ink/60">
              Track student reading evaluation progress across Oral, Silent, and Listening assessment types.
            </p>
          </div>

          {/* Metric Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-cream px-3.5 py-1 text-xs font-semibold text-ink/70">
              <Users size={14} className="text-brand-blue" />
              <span>Total:</span>
              <span className="font-bold text-ink">
                {loading ? <span className="inline-block w-4 h-3 rounded bg-ink/10 animate-pulse" /> : metrics.total}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-[#00a652]/25 bg-[#00a652]/10 px-3.5 py-1 text-xs font-semibold text-[#00a652]">
              <CheckCircle size={14} className="text-[#00a652]" />
              <span>Completed:</span>
              <span className="font-bold text-[#00a652]">
                {loading ? <span className="inline-block w-4 h-3 rounded bg-[#00a652]/20 animate-pulse" /> : metrics.completed}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-[#ffc300]/30 bg-[#ffc300]/15 px-3.5 py-1 text-xs font-semibold text-[#b38600]">
              <Clock size={14} className="text-[#b38600]" />
              <span>Pending:</span>
              <span className="font-bold text-[#b38600]">
                {loading ? <span className="inline-block w-4 h-3 rounded bg-[#ffc300]/30 animate-pulse" /> : metrics.pending}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Assessment Records Table Container */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)] space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/10">
            {/* Status Tab Strip */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-ink/50 mr-1">Status:</span>
              {['All', 'Pending', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-brand-blue text-white shadow-2xs'
                      : 'bg-cream border border-ink/20 text-ink/70 hover:bg-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right Controls: Filters label + Dropdowns + Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Funnel Icon & Filters Label matching System Design */}
              <div className="flex items-center gap-1.5 text-xs text-ink/60 font-semibold mr-0.5">
                <Funnel size={16} />
                <span>Filters:</span>
              </div>

              {/* Assessment Type Select */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-full border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue transition-colors"
              >
                <option value="All">All Assessment Types</option>
                <option value="Oral Reading">Oral Reading</option>
                <option value="Silent Reading">Silent Reading</option>
                <option value="Listening">Listening</option>
              </select>

              {/* Grade Level Select */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="rounded-full border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue transition-colors"
              >
                <option value="All">All Grades</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
              </select>

              {/* Standard System Search Bar */}
              <div className="relative w-full sm:w-56">
                <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search student, LRN, section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-ink/20 bg-white pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Student Inner Table Container */}
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
            <table className="w-full text-left text-xs text-ink border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-[#eef2f6] text-xs font-bold text-ink/70">
                  <th className="py-3.5 px-4 font-bold">LRN</th>
                  <th className="py-3.5 px-4 font-bold">Student Name</th>
                  <th className="py-3.5 px-4 font-bold">Section</th>
                  <th className="py-3.5 px-4 font-bold">Assessment Type</th>
                  <th className="py-3.5 px-4 font-bold">Phil-IRI Profile</th>
                  <th className="py-3.5 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {loading ? (
                  <PhilIriAssessmentSkeleton rows={5} />
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink/40">
                      No student assessment records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((s) => {
                    const lvl = (s.level || '').toLowerCase();
                    const isDone = lvl && !lvl.includes('pending') && lvl !== 'unassessed' && lvl !== 'not assessed' && lvl !== '';

                    // Active type badge based on filter or default Oral Reading
                    const activeTypeLabel = typeFilter === 'All' ? 'Oral Reading' : typeFilter;

                    let typeBadgeClass = 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
                    let TypeIcon = UserSound;
                    if (activeTypeLabel === 'Silent Reading') {
                      typeBadgeClass = 'bg-[#00a652]/10 text-[#00a652] border-[#00a652]/20';
                      TypeIcon = Eye;
                    } else if (activeTypeLabel === 'Listening') {
                      typeBadgeClass = 'bg-[#ffc300]/15 text-[#b38600] border-[#ffc300]/30';
                      TypeIcon = Ear;
                    }

                    const statusBadge = isDone ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/80">
                        Pending Evaluation
                      </span>
                    );

                    let profileBadge = (
                      <span className="text-ink/40 font-bold px-2.5">—</span>
                    );

                    if (lvl.includes('independent')) {
                      profileBadge = (
                        <span className="rounded-full bg-emerald-100/90 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                          Independent
                        </span>
                      );
                    } else if (lvl.includes('instructional')) {
                      profileBadge = (
                        <span className="rounded-full bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                          Instructional
                        </span>
                      );
                    } else if (lvl.includes('frustration')) {
                      profileBadge = (
                        <span className="rounded-full bg-rose-100/90 border border-rose-200/80 px-2.5 py-0.5 text-xs font-semibold text-rose-900">
                          Frustration
                        </span>
                      );
                    }

                    return (
                      <tr key={s.id || s.lrn} className="group hover:bg-ink/[0.02] transition-colors cursor-pointer">
                        {/* LRN Column */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-ink/70">
                          {s.lrn || '—'}
                        </td>

                        {/* Student Name Column */}
                        <td className="py-3.5 px-4 font-bold text-ink group-hover:text-brand-blue transition-colors">
                          {s.name || '—'}
                        </td>

                        {/* Section Column */}
                        <td className="py-3.5 px-4 font-medium text-ink/70">
                          {s.grade} - {s.section || 'Unassigned'}
                        </td>

                        {/* Assessment Type Column */}
                        <td className="py-3.5 px-4">
                          {typeFilter === 'All' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isDone ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' : 'bg-ink/5 text-ink/40 border border-ink/10'
                              }`}>
                                <UserSound size={11} />
                                Oral
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-ink/5 text-ink/40 border border-ink/10">
                                <Eye size={11} />
                                Silent
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-ink/5 text-ink/40 border border-ink/10">
                                <Ear size={11} />
                                Listening
                              </span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${typeBadgeClass}`}>
                              <TypeIcon size={12} />
                              {activeTypeLabel}
                            </span>
                          )}
                        </td>

                        {/* Profile Column */}
                        <td className="py-3.5 px-4">
                          {profileBadge}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 text-right">
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          {filteredStudents.length > 0 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink/50">
              <span>
                {totalPages > 1
                  ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} student records`
                  : `Showing ${filteredStudents.length} of ${filteredStudents.length} student records`}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
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
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
