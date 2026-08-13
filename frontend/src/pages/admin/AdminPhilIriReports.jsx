import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChartBar,
  ChartPie,
  DownloadSimple,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function AdminPhilIriReports() {
  const { globalSearch } = useOutletContext() || {};
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [toast, setToast] = useState(null);

  // Phil-IRI Set Assignment Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignGrade, setAssignGrade] = useState('Grade 4');
  const [assignSet, setAssignSet] = useState('Set A');
  const [assignPeriod, setAssignPeriod] = useState('Pre-Test');
  const [assignType, setAssignType] = useState('oral');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignPhilIri = async (e) => {
    e.preventDefault();
    try {
      setIsAssigning(true);
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/student/assessment/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          gradeLevel: assignGrade,
          set: assignSet,
          period: assignPeriod,
          assessmentType: assignType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: `Successfully assigned ${assignSet} (${assignPeriod}) to ${assignGrade}!` });
        setIsAssignModalOpen(false);
      } else {
        setToast({ message: data.error || 'Failed to assign Phil-IRI set.' });
      }
    } catch (err) {
      console.error('Error assigning set:', err);
      setToast({ message: 'Network error. Failed to assign Phil-IRI set.' });
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/analytics/phil-iri', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.warn('Failed to fetch Phil-IRI analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

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
      console.warn('Failed to fetch students for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchStudents();
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Compute live breakdown if API analytics empty or fallback
  const summaryData = useMemo(() => {
    if (analytics?.summary && analytics.summary.totalEvaluated > 0) {
      return analytics.summary;
    }

    let ind = 0, inst = 0, frust = 0, nonR = 0, pend = 0;
    students.forEach((s) => {
      const lvl = (s.level || '').toLowerCase();
      if (lvl.includes('independent')) ind++;
      else if (lvl.includes('instructional')) inst++;
      else if (lvl.includes('frustration')) frust++;
      else if (lvl.includes('non-reader') || lvl.includes('non reader')) nonR++;
      else pend++;
    });

    const totalEval = ind + inst + frust + nonR;
    const profRate = totalEval > 0 ? Math.round(((ind + inst) / totalEval) * 100) : 0;

    return {
      totalEvaluated: totalEval,
      independent: ind,
      instructional: inst,
      frustration: frust,
      nonReader: nonR,
      pending: pend,
      proficiencyRate: profRate,
    };
  }, [analytics, students]);

  // Compute Grade Level comparison data
  const gradeBreakdown = useMemo(() => {
    const defaultGrades = {
      'Grade 4': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
      'Grade 5': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
      'Grade 6': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
    };

    students.forEach((s) => {
      const g = s.grade || 'Grade 4';
      if (!defaultGrades[g]) {
        defaultGrades[g] = { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 };
      }
      const lvl = (s.level || '').toLowerCase();
      if (lvl.includes('independent')) defaultGrades[g].independent++;
      else if (lvl.includes('instructional')) defaultGrades[g].instructional++;
      else if (lvl.includes('frustration')) defaultGrades[g].frustration++;
      else if (lvl.includes('non-reader') || lvl.includes('non reader')) defaultGrades[g].nonReader++;
      else defaultGrades[g].pending++;

      defaultGrades[g].total++;
    });

    return defaultGrades;
  }, [students]);

  // SVG Donut Chart Calculation
  const donutSlices = useMemo(() => {
    const total = summaryData.totalEvaluated || 1;
    const segments = [
      { label: 'Independent', count: summaryData.independent, color: '#00a652' },
      { label: 'Instructional', count: summaryData.instructional, color: '#ffc300' },
      { label: 'Frustration', count: summaryData.frustration, color: '#d53f24' },
    ];

    let cumulativePercent = 0;
    return segments.map((seg) => {
      const percent = (seg.count / total) * 100;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 3.6;

      const x1 = 50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);

      const largeArc = percent > 50 ? 1 : 0;
      const pathData = percent >= 99.99
        ? `M 50,10 A 40,40 0 1,1 49.99,10 Z`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        ...seg,
        percent: Math.round(percent),
        pathData,
      };
    });
  }, [summaryData]);

  // Filtered Students for Table View
  const filteredStudents = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return students.filter((s) => {
      const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
      const matchesQuery =
        !query ||
        s.name?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query) ||
        s.section?.toLowerCase().includes(query) ||
        s.level?.toLowerCase().includes(query);
      return matchesGrade && matchesQuery;
    });
  }, [students, selectedGrade, globalSearch, searchQuery]);

  // Handle Exporting Phil-IRI Form 1 CSV
  const handleExportForm1 = () => {
    if (filteredStudents.length === 0) {
      setToast({ message: 'No student data available to export.', type: 'error' });
      return;
    }

    const headers = 'Student LRN,Full Name,Gender,Grade Level,Assigned Section,Phil-IRI Reading Level,Date Added\n';
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.lrn || ''}","${s.name || ''}","${s.gender || 'Male'}","${s.grade || ''}","${s.section || ''}","${s.level || 'Pending Evaluation'}","${s.dateAdded || ''}"`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SalinTinig_Phil_IRI_Form_1_${selectedGrade.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ message: 'Phil-IRI Form 1 Summary Report exported successfully.', type: 'success' });
  };

  const [hoveredSlice, setHoveredSlice] = useState(null);

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ChartPie size={24} className="text-brand-red" />
              <h1 className="text-3xl font-bold text-ink">Phil-IRI Analytics & Graphs</h1>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Visual reading profile distribution charts, grade comparison analytics, and exportable Form 1 summary reports
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
            >
              <span>Assign Phil-IRI Set</span>
            </button>

            <button
              type="button"
              onClick={handleExportForm1}
              className="flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
            >
              <DownloadSimple size={16} />
              <span>Export Phil-IRI Form 1 (CSV)</span>
            </button>
          </div>
        </div>

        {/* Top Visual Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graph 1: Donut Chart — Overall Reading Profile Distribution */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <ChartPie size={20} className="text-brand-red" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-ink">Reading Profile Distribution (Donut Graph)</h3>
                    {loadingAnalytics ? (
                      <div className="h-4 w-20 animate-pulse rounded-full bg-ink/10" />
                    ) : (
                      <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                        {summaryData.proficiencyRate}% Proficient
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/50">Proportion of learners by Phil-IRI reading category</p>
                </div>
              </div>
            </div>

            <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-8">
              {/* SVG Donut Chart with Dynamic Slice Scale & Load Animations */}
              <div className="relative size-44 shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className={`size-full transition-all duration-1000 ease-out ${
                    isMounted
                      ? 'rotate-[-90deg] scale-100 opacity-100'
                      : 'rotate-[-270deg] scale-50 opacity-0'
                  }`}
                >
                  {donutSlices.map((slice, i) => {
                    const isHovered = hoveredSlice === i;
                    const isAnyHovered = hoveredSlice !== null;
                    const opacityStyle = isAnyHovered && !isHovered ? 0.35 : 1;
                    const scaleTransform = isHovered ? 'scale(1.06)' : 'scale(1)';

                    return (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        style={{
                          opacity: opacityStyle,
                          transform: scaleTransform,
                          transformOrigin: '50px 50px',
                          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                        }}
                        onMouseEnter={() => setHoveredSlice(i)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className="cursor-pointer"
                      />
                    );
                  })}
                  {/* Donut Hole */}
                  <circle cx="50" cy="50" r="28" fill="#F7F5F0" />
                </svg>

                {/* Animated Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-300 px-3">
                  {loadingAnalytics ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-6 w-10 animate-pulse rounded bg-ink/10" />
                      <div className="h-2 w-12 animate-pulse rounded bg-ink/10" />
                    </div>
                  ) : hoveredSlice !== null ? (
                    <>
                      <span className="text-xl font-extrabold leading-none animate-fade-in" style={{ color: donutSlices[hoveredSlice].color }}>
                        {donutSlices[hoveredSlice].count}
                      </span>
                      <div className="flex flex-col items-center justify-center my-0.5 leading-tight text-[9px] font-bold text-ink/80">
                        {donutSlices[hoveredSlice].label.split(' ').map((word, idx) => (
                          <span key={idx} className="block">{word}</span>
                        ))}
                      </div>
                      <span className="text-[8px] font-bold text-ink/50 leading-none">
                        ({donutSlices[hoveredSlice].percent}%)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold text-ink leading-none">{students.length || summaryData.totalEvaluated}</span>
                      <span className="text-[9px] font-semibold text-ink/50 uppercase tracking-wider mt-0.5">Learners</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend & Interactive Hover Rows */}
              <div className="space-y-2.5 w-full max-w-xs text-xs">
                {loadingAnalytics ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-full animate-pulse rounded-xl bg-ink/10" />
                  ))
                ) : (
                  donutSlices.map((slice, i) => (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredSlice(i)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        hoveredSlice === i
                          ? 'bg-white border-brand-blue shadow-md translate-x-1'
                          : 'bg-white border-ink/10 hover:border-ink/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full shrink-0 transition-transform duration-200" style={{ backgroundColor: slice.color, transform: hoveredSlice === i ? 'scale(1.25)' : 'scale(1)' }} />
                        <span className="font-bold text-ink">{slice.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-ink">{slice.count}</span>
                        <span className="text-ink/40 text-[11px]">({slice.percent}%)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-ink/10 flex items-center justify-between text-[11px] text-ink/60">
              {loadingAnalytics ? (
                <>
                  <div className="h-3 w-32 animate-pulse rounded bg-ink/10" />
                  <div className="h-3 w-28 animate-pulse rounded bg-ink/10" />
                </>
              ) : (
                <>
                  <span>Total Assessed Learners: <strong>{summaryData.totalEvaluated}</strong></span>
                  <span>Pending Evaluation: <strong>{summaryData.pending}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Graph 2: Bar Graph — Grade Level Comparison */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <ChartBar size={20} className="text-brand-red" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Grade-Level Reading Level Comparison (Bar Graph)</h3>
                  <p className="text-xs text-ink/50">Comparative learner count across Grade 4, Grade 5, and Grade 6</p>
                </div>
              </div>
            </div>

            {/* Vertical Bar Graph Visual */}
            <div className="my-6 space-y-5">
              {loadingAnalytics ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 w-16 animate-pulse rounded bg-ink/10" />
                      <div className="h-3 w-24 animate-pulse rounded bg-ink/10" />
                    </div>
                    <div className="h-6 w-full animate-pulse rounded-xl bg-ink/10" />
                  </div>
                ))
              ) : (
                Object.entries(gradeBreakdown).map(([grade, data]) => {
                  const assessedCount = data.independent + data.instructional + data.frustration;
                  const maxVal = Math.max(assessedCount, 1);
                  return (
                    <div key={grade} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-ink">
                        <span>{grade}</span>
                        <span className="text-ink/50 text-[11px]">{assessedCount} Students Assessed</span>
                      </div>

                      <div className="h-6 w-full rounded-xl bg-white border border-ink/10 overflow-hidden flex p-0.5 gap-0.5">
                        {data.independent > 0 && (
                          <div
                            style={{ width: `${(data.independent / maxVal) * 100}%` }}
                            className="bg-[#00a652] h-full rounded-md transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                            title={`Grade ${grade} Independent: ${data.independent}`}
                          >
                            {data.independent}
                          </div>
                        )}
                        {data.instructional > 0 && (
                          <div
                            style={{ width: `${(data.instructional / maxVal) * 100}%` }}
                            className="bg-[#ffc300] h-full rounded-md transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                            title={`Grade ${grade} Instructional: ${data.instructional}`}
                          >
                            {data.instructional}
                          </div>
                        )}
                        {data.frustration > 0 && (
                          <div
                            style={{ width: `${(data.frustration / maxVal) * 100}%` }}
                            className="bg-[#d53f24] h-full rounded-md transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                            title={`Grade ${grade} Frustration: ${data.frustration}`}
                          >
                            {data.frustration}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bar Legend */}
            <div className="pt-3 border-t border-ink/10 flex flex-wrap items-center justify-start gap-6 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-[#00a652]" />
                <span className="text-ink/70">Independent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-[#ffc300]" />
                <span className="text-ink/70">Instructional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-[#d53f24]" />
                <span className="text-ink/70">Frustration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Student Masterlist Section */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-[0px_4px_12px_rgba(26,24,22,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
            {/* Grade Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Grade 4', 'Grade 5', 'Grade 6'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-brand-blue text-cream shadow-sm'
                      : 'bg-white text-ink/70 hover:bg-ink/5 border border-ink/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search LRN, student, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-ink/10 bg-white py-1.5 pl-9 pr-4 text-xs text-ink placeholder:text-ink/40 focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead>
                <tr className="border-b border-ink/10 bg-white text-ink/60">
                  <th className="py-2.5 px-3 font-semibold">Learner Reference No. (LRN)</th>
                  <th className="py-2.5 px-3 font-semibold">Student Name</th>
                  <th className="py-2.5 px-3 font-semibold">Grade & Section</th>
                  <th className="py-2.5 px-3 font-semibold">Gender</th>
                  <th className="py-2.5 px-3 font-semibold">Phil-IRI Profile Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3"><div className="h-3.5 w-28 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-3.5 w-36 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-3.5 w-24 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-3.5 w-16 rounded bg-ink/10" /></td>
                      <td className="py-3 px-3"><div className="h-4 w-20 rounded-full bg-ink/10" /></td>
                      <td className="py-3 px-3 text-right"><div className="h-3.5 w-20 rounded bg-ink/10 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink/40">
                      No student records found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const lvl = (s.level || '').toLowerCase();
                    let badgeBg = 'bg-slate-100 text-slate-700 border border-slate-300';
                    if (lvl.includes('independent')) badgeBg = 'bg-green-100 text-green-700';
                    else if (lvl.includes('instructional')) badgeBg = 'bg-blue-100 text-blue-700';
                    else if (lvl.includes('frustration')) badgeBg = 'bg-amber-100 text-amber-700';
                    else if (lvl.includes('non-reader') || lvl.includes('non reader')) badgeBg = 'bg-red-100 text-red-700';
                    else if (lvl.includes('pending')) badgeBg = 'bg-slate-100 text-slate-700 border border-slate-300';

                    return (
                      <tr key={s.id || s.lrn} className="hover:bg-white/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-ink/80">{s.lrn}</td>
                        <td className="py-3 px-3 font-semibold text-ink">{s.name}</td>
                        <td className="py-3 px-3 text-ink/70">
                          {s.grade || 'Grade 4'} - {s.section || 'Unassigned'}
                        </td>
                        <td className="py-3 px-3 text-ink/70">{s.gender || 'Male'}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                            {s.level || 'Pending Evaluation'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-ink/50">{s.dateAdded || 'N/A'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Phil-IRI Set Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-cream border border-ink/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Assign Phil-IRI Passage Set</h3>
                <p className="text-xs text-ink/50">Select DepEd set and period for learners</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPhilIri} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Target Grade Level</label>
                <select
                  value={assignGrade}
                  onChange={(e) => setAssignGrade(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Screening Period</label>
                <select
                  value={assignPeriod}
                  onChange={(e) => setAssignPeriod(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Pre-Test">Pre-Test (Beginning of Year)</option>
                  <option value="Post-Test">Post-Test (End of Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Phil-IRI Set</label>
                <select
                  value={assignSet}
                  onChange={(e) => setAssignSet(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Set A">Set A</option>
                  <option value="Set B">Set B</option>
                  <option value="Set C">Set C</option>
                  <option value="Set D">Set D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Assessment Type</label>
                <select
                  value={assignType}
                  onChange={(e) => setAssignType(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="oral">Oral Reading Assessment</option>
                  <option value="silent">Silent Reading Assessment</option>
                  <option value="listening">Listening Comprehension Test</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
