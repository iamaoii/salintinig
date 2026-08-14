import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Users,
  MagnifyingGlass,
  CalendarBlank,
  ListChecks,
  Ear,
  UserSound,
  Eye,
  Check,
  Funnel,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

const DEFAULT_PERIODS = {
  'Grade 4': 'Pre-Test',
  'Grade 5': 'Pre-Test',
  'Grade 6': 'Pre-Test',
};

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

  // Active screening period per grade level
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [editingGrade, setEditingGrade] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/students', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.warn('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
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

  const handleSavePeriod = (grade, newPeriod) => {
    setPeriods((prev) => ({ ...prev, [grade]: newPeriod }));
    setToast({ message: `${grade} active period set to ${newPeriod}.` });
    setEditingGrade(null);
  };

  // Filtered Students list (1 row per student)
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

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />

      <div className="w-full space-y-6">
        {/* Integrated Embedded Header Bar */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.04)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ink/10 pb-4">
            {/* Title & Description */}
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
              <div className="flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3.5 py-1.5 shadow-2xs">
                <Users size={15} className="text-brand-blue" />
                <span className="text-xs font-semibold text-brand-blue/80">Total:</span>
                <span className="text-xs font-extrabold text-brand-blue">{metrics.total}</span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#00a652]/30 bg-[#00a652]/10 px-3.5 py-1.5 shadow-2xs">
                <CheckCircle size={15} className="text-[#00a652]" />
                <span className="text-xs font-semibold text-[#00a652]">Completed:</span>
                <span className="text-xs font-extrabold text-[#00a652]">{metrics.completed}</span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#ffc300]/40 bg-[#ffc300]/15 px-3.5 py-1.5 shadow-2xs">
                <Clock size={15} className="text-[#b38600]" />
                <span className="text-xs font-semibold text-[#b38600]">Pending:</span>
                <span className="text-xs font-extrabold text-[#b38600]">{metrics.pending}</span>
              </div>
            </div>
          </div>

          {/* Active Screening Period Section */}
          <div className="border-t border-ink/10 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarBlank size={18} className="text-brand-red shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-ink">Active Screening Period Configuration</h3>
                <p className="text-[11px] text-ink/50">Select active testing period per grade level (Pre-Test baseline or Post-Test evaluation)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Grade 4', 'Grade 5', 'Grade 6'].map((g) => {
                const current = periods[g];
                return (
                  <div key={g} className="rounded-xl border border-ink/12 bg-white p-3.5 shadow-xs flex flex-col justify-between space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-ink">{g}</span>
                      <span className="rounded-full bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                        Active: {current}
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-ink/50 uppercase tracking-wider block mb-1">
                        Screening Period
                      </label>
                      <select
                        value={current}
                        onChange={(e) => handleSavePeriod(g, e.target.value)}
                        className="w-full rounded-xl border border-ink/20 bg-cream/50 px-3 py-2 text-xs font-bold text-ink outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue cursor-pointer transition-colors"
                      >
                        <option value="Pre-Test">Pre-Test (Baseline Period)</option>
                        <option value="Post-Test">Post-Test (Evaluation Period)</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Assessment Records Table */}
        <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-4 shadow-xs">
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
                      : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
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
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue transition-colors"
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
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer focus:border-brand-blue transition-colors"
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
                  className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-1.5 text-xs text-ink outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead>
                <tr className="border-b border-ink/10 bg-cream/60 text-ink/60">
                  <th className="py-2.5 px-3 font-semibold">LRN</th>
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Section</th>
                  <th className="py-2.5 px-3 font-semibold">Assessment Type</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Phil-IRI Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3"><div className="h-4 w-24 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-4 w-32 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-4 w-20 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-4 w-28 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-4 w-16 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-4 w-20 rounded bg-ink/10 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink/40">
                      No student assessment records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
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

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffc300]/15 border border-[#ffc300]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#b38600]">
                        <Clock size={13} weight="bold" className="text-[#b38600]" />
                        Pending
                      </span>
                    );

                    if (isDone) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00a652]/10 border border-[#00a652]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#00a652]">
                          <CheckCircle size={13} weight="fill" className="text-[#00a652]" />
                          Completed
                        </span>
                      );
                    }

                    let profileBadge = (
                      <span className="rounded-full bg-ink/5 border border-ink/10 px-2.5 py-0.5 text-[10px] font-semibold text-ink/50">
                        Pending
                      </span>
                    );

                    if (lvl.includes('independent')) {
                      profileBadge = (
                        <span className="rounded-full bg-[#00a652]/10 border border-[#00a652]/25 px-2.5 py-0.5 text-[10px] font-bold text-[#00a652]">
                          Independent
                        </span>
                      );
                    } else if (lvl.includes('instructional')) {
                      profileBadge = (
                        <span className="rounded-full bg-[#ffc300]/20 border border-[#ffc300]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#b38600]">
                          Instructional
                        </span>
                      );
                    } else if (lvl.includes('frustration')) {
                      profileBadge = (
                        <span className="rounded-full bg-[#d53f24]/10 border border-[#d53f24]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#d53f24]">
                          Frustration
                        </span>
                      );
                    }

                    return (
                      <tr key={s.id || s.lrn} className="hover:bg-cream/40 transition-colors">
                        {/* LRN Column */}
                        <td className="py-3 px-3 font-mono text-xs font-semibold text-ink/70">
                          {s.lrn}
                        </td>

                        {/* Student Name Column */}
                        <td className="py-3 px-3 font-bold text-ink">
                          {s.name}
                        </td>

                        {/* Section Column */}
                        <td className="py-3 px-3 font-medium text-ink/70">
                          {s.grade} - {s.section || 'Unassigned'}
                        </td>

                        {/* Assessment Type Column */}
                        <td className="py-3 px-3">
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

                        {/* Status Column */}
                        <td className="py-3 px-3">
                          {statusBadge}
                        </td>

                        {/* Profile Column */}
                        <td className="py-3 px-3 text-right">
                          {profileBadge}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
