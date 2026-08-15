import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChartBar,
  ChartPie,
  DownloadSimple,
  MagnifyingGlass,
  Funnel,
  Users,
  TrendUp,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react';
import ToastNotification from '../../components/common/ToastNotification.jsx';
import { getToken } from '../../lib/auth.js';

export default function AdminPhilIriReports() {
  const { globalSearch } = useOutletContext() || {};
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [toast, setToast] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/analytics/phil-iri', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) setAnalytics(data.analytics);
    } catch (err) {
      console.warn('Failed to fetch Phil-IRI analytics:', err);
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
      if (res.ok && data.success) setStudents(data.students || []);
    } catch (err) {
      console.warn('Failed to fetch students for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchStudents();
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Apply language filter
  const filteredByLang = useMemo(() => {
    if (selectedLanguage === 'All') return students;
    return students.filter((s) => {
      const lang = (s.language || s.assessmentLanguage || '').toLowerCase();
      return lang.includes(selectedLanguage.toLowerCase());
    });
  }, [students, selectedLanguage]);

  // Compute summary breakdown
  const summaryData = useMemo(() => {
    if (analytics?.summary && analytics.summary.totalEvaluated > 0 && selectedLanguage === 'All') {
      return analytics.summary;
    }
    let ind = 0, inst = 0, frust = 0, pend = 0;
    filteredByLang.forEach((s) => {
      const lvl = (s.level || '').toLowerCase();
      if (lvl.includes('independent')) ind++;
      else if (lvl.includes('instructional')) inst++;
      else if (lvl.includes('frustration') || lvl.includes('non-reader') || lvl.includes('non reader')) frust++;
      else pend++;
    });
    const totalEval = ind + inst + frust;
    const profRate = totalEval > 0 ? Math.round(((ind + inst) / totalEval) * 100) : 0;
    return { totalEvaluated: totalEval, independent: ind, instructional: inst, frustration: frust, pending: pend, proficiencyRate: profRate };
  }, [analytics, filteredByLang, selectedLanguage]);

  // Compute grade breakdown
  const gradeBreakdown = useMemo(() => {
    const grades = {
      'Grade 4': { independent: 0, instructional: 0, frustration: 0, pending: 0, total: 0 },
      'Grade 5': { independent: 0, instructional: 0, frustration: 0, pending: 0, total: 0 },
      'Grade 6': { independent: 0, instructional: 0, frustration: 0, pending: 0, total: 0 },
    };
    filteredByLang.forEach((s) => {
      const g = s.grade || 'Grade 4';
      if (!grades[g]) grades[g] = { independent: 0, instructional: 0, frustration: 0, pending: 0, total: 0 };
      const lvl = (s.level || '').toLowerCase();
      if (lvl.includes('independent')) grades[g].independent++;
      else if (lvl.includes('instructional')) grades[g].instructional++;
      else if (lvl.includes('frustration') || lvl.includes('non-reader') || lvl.includes('non reader')) grades[g].frustration++;
      else grades[g].pending++;
      grades[g].total++;
    });
    return grades;
  }, [filteredByLang]);

  // SVG Donut Chart
  const donutSlices = useMemo(() => {
    const total = summaryData.totalEvaluated || 1;
    const segments = [
      { label: 'Independent Level', count: summaryData.independent, color: '#00a652' },
      { label: 'Instructional Level', count: summaryData.instructional, color: '#ffc300' },
      { label: 'Frustration Level', count: summaryData.frustration, color: '#d53f24' },
    ];
    let cum = 0;
    return segments.map((seg) => {
      const pct = (seg.count / total) * 100;
      const start = cum * 3.6;
      cum += pct;
      const end = cum * 3.6;
      const x1 = 50 + 40 * Math.cos(((start - 90) * Math.PI) / 180);
      const y1 = 50 + 40 * Math.sin(((start - 90) * Math.PI) / 180);
      const x2 = 50 + 40 * Math.cos(((end - 90) * Math.PI) / 180);
      const y2 = 50 + 40 * Math.sin(((end - 90) * Math.PI) / 180);
      const largeArc = pct > 50 ? 1 : 0;
      const pathData = pct >= 99.99
        ? `M 50,10 A 40,40 0 1,1 49.99,10 Z`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...seg, percent: Math.round(pct), pathData };
    });
  }, [summaryData]);

  // Filtered student masterlist
  const filteredStudents = useMemo(() => {
    const query = (globalSearch || searchQuery).toLowerCase().trim();
    return filteredByLang.filter((s) => {
      const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
      const matchesQuery = !query ||
        s.name?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query) ||
        s.section?.toLowerCase().includes(query) ||
        s.level?.toLowerCase().includes(query);
      return matchesGrade && matchesQuery;
    });
  }, [filteredByLang, selectedGrade, globalSearch, searchQuery]);

  const handleExportCSV = (formType) => {
    if (filteredStudents.length === 0) {
      setToast({ message: 'No student data available to export.', type: 'error' });
      return;
    }
    let headers = '', filename = '', rows = '';
    if (formType === 'Form 1') {
      headers = 'Student LRN,Full Name,Gender,Grade Level,Assigned Section,Phil-IRI Reading Level,Date Added\n';
      filename = `Phil_IRI_Form_1_Masterlist_${selectedGrade.replace(/\s+/g, '_')}.csv`;
      rows = filteredStudents.map((s) => `"${s.lrn || ''}","${s.name || ''}","${s.gender || 'Male'}","${s.grade || ''}","${s.section || ''}","${s.level || 'Pending Evaluation'}","${s.dateAdded || ''}"`).join('\n');
    } else if (formType === 'Form 3') {
      headers = 'Grade & Section,Total Enrolled,Independent Count,Instructional Count,Frustration Count,Pending Count\n';
      filename = `Phil_IRI_Form_3_Class_Summary_${selectedGrade.replace(/\s+/g, '_')}.csv`;
      rows = Object.entries(gradeBreakdown).map(([grade, data]) => `"${grade}","${data.total}","${data.independent}","${data.instructional}","${data.frustration}","${data.pending}"`).join('\n');
    } else if (formType === 'Form 4') {
      headers = 'School Year,Total Assessed,Overall Proficiency Rate (%),Independent,Instructional,Frustration\n';
      filename = `Phil_IRI_Form_4_School_Consolidated_Summary.csv`;
      rows = `"S.Y. 2025-2026","${summaryData.totalEvaluated}","${summaryData.proficiencyRate}%","${summaryData.independent}","${summaryData.instructional}","${summaryData.frustration}"`;
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: `Phil-IRI ${formType} exported successfully.`, type: 'success' });
  };

  return (
    <>
      <ToastNotification message={toast?.message} onClose={() => setToast(null)} />
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ChartPie size={22} className="text-brand-red shrink-0" />
              <h2 className="text-xl font-bold text-ink">Phil-IRI Reports & Analytics</h2>
            </div>
            <p className="mt-0.5 text-xs text-ink/50">
              Reading profile distribution, grade-level comparison, and official DepEd form exports
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportCSV('Form 1')}
              className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} />
              <span>Form 1</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV('Form 3')}
              className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-4 py-2 text-xs font-medium text-ink/80 hover:bg-ink/5 transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} />
              <span>Form 3</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV('Form 4')}
              className="flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-xs font-medium text-cream shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} />
              <span>Form 4 (School Summary)</span>
            </button>
          </div>
        </div>

        {/* Language Filter + Summary Stat Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink/70">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ink/30 inline-block" />
              <span><strong className="text-ink">{summaryData.totalEvaluated + summaryData.pending}</strong> Total Learners</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#00a652] inline-block" />
              <span><strong className="text-ink">{summaryData.independent}</strong> Independent</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#ffc300] inline-block" />
              <span><strong className="text-ink">{summaryData.instructional}</strong> Instructional</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#d53f24] inline-block" />
              <span><strong className="text-ink">{summaryData.frustration}</strong> Frustration</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-300 inline-block" />
              <span><strong className="text-ink">{summaryData.pending}</strong> Pending</span>
            </span>
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink/50">Language:</span>
            {['All', 'Filipino', 'English'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  selectedLanguage === lang
                    ? 'bg-brand-blue text-cream'
                    : 'border border-ink/20 bg-cream text-ink/70 hover:bg-ink/5'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut Chart */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <ChartPie size={18} className="text-brand-red" />
              <div>
                <h3 className="text-sm font-bold text-ink">Reading Profile Distribution</h3>
                <p className="text-xs text-ink/50">Overall reading level breakdown — all grades</p>
              </div>
              <span className="ml-auto rounded-full border border-ink/15 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink/70">
                {summaryData.proficiencyRate}% proficient
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* SVG Donut */}
              <div className="relative size-40 shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className={`size-full transition-all duration-1000 ease-out ${
                    isMounted ? 'rotate-[-90deg] scale-100 opacity-100' : 'rotate-[-270deg] scale-50 opacity-0'
                  }`}
                >
                  {donutSlices.map((slice, i) => {
                    const isHovered = hoveredSlice === i;
                    const isAnyHovered = hoveredSlice !== null;
                    return (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        style={{
                          opacity: isAnyHovered && !isHovered ? 0.3 : 1,
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: '50px 50px',
                          transition: 'transform 0.2s ease, opacity 0.2s ease',
                        }}
                        onMouseEnter={() => setHoveredSlice(i)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className="cursor-pointer"
                      />
                    );
                  })}
                  <circle cx="50" cy="50" r="26" fill="#F7F5F0" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {hoveredSlice !== null ? (
                    <>
                      <span className="text-xl font-bold" style={{ color: donutSlices[hoveredSlice].color }}>{donutSlices[hoveredSlice].count}</span>
                      <span className="text-[9px] font-semibold text-ink/60 leading-tight px-1">{donutSlices[hoveredSlice].label}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-ink">{summaryData.totalEvaluated}</span>
                      <span className="text-[9px] font-semibold text-ink/50 uppercase tracking-wider">assessed</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-2 text-xs">
                {donutSlices.map((slice, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredSlice(i)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-ink/10 bg-white hover:border-ink/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="font-semibold text-ink">{slice.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ink/60">
                      <span className="font-bold text-ink">{slice.count}</span>
                      <span>({slice.percent}%)</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-ink/10 bg-white text-xs text-ink/60">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="font-semibold text-ink">Pending Evaluation</span>
                  </div>
                  <span className="font-bold text-ink">{summaryData.pending}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Graph */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <ChartBar size={18} className="text-brand-red" />
              <div>
                <h3 className="text-sm font-bold text-ink">Grade-Level Comparison</h3>
                <p className="text-xs text-ink/50">Learner reading levels by grade</p>
              </div>
            </div>

            <div className="space-y-5">
              {Object.entries(gradeBreakdown).map(([grade, data]) => {
                const maxVal = Math.max(data.total, 1);
                const evaluated = data.total - data.pending;
                return (
                  <div key={grade}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-ink">{grade}</span>
                      <span className="text-ink/50">{evaluated} / {data.total} evaluated</span>
                    </div>
                    <div className="h-5 w-full rounded bg-white border border-ink/10 overflow-hidden flex gap-px p-px">
                      {data.independent > 0 && (
                        <div
                          title={`Independent: ${data.independent}`}
                          style={{ width: `${(data.independent / maxVal) * 100}%` }}
                          className="bg-[#00a652] h-full rounded-sm transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {data.independent}
                        </div>
                      )}
                      {data.instructional > 0 && (
                        <div
                          title={`Instructional: ${data.instructional}`}
                          style={{ width: `${(data.instructional / maxVal) * 100}%` }}
                          className="bg-[#ffc300] h-full rounded-sm transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-ink"
                        >
                          {data.instructional}
                        </div>
                      )}
                      {data.frustration > 0 && (
                        <div
                          title={`Frustration: ${data.frustration}`}
                          style={{ width: `${(data.frustration / maxVal) * 100}%` }}
                          className="bg-[#d53f24] h-full rounded-sm transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                        >
                          {data.frustration}
                        </div>
                      )}
                      {data.pending > 0 && (
                        <div
                          title={`Pending: ${data.pending}`}
                          style={{ width: `${(data.pending / maxVal) * 100}%` }}
                          className="bg-slate-200 h-full rounded-sm transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-slate-600"
                        >
                          {data.pending}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-ink/10 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/60">
              {[
                { color: '#00a652', label: 'Independent' },
                { color: '#ffc300', label: 'Instructional' },
                { color: '#d53f24', label: 'Frustration' },
                { color: '#cbd5e1', label: 'Pending' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Learner Masterlist Table */}
        <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
            <div className="relative w-full md:w-80">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search student, LRN, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-ink/20 bg-cream pl-10 pr-4 py-2 text-xs text-ink outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex w-full md:w-auto items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-ink/60 font-semibold">
                <Funnel size={15} />
                <span>Filters:</span>
              </div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="rounded-full border border-ink/20 bg-cream px-3.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand-blue cursor-pointer"
              >
                <option value="All">All Grades</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink/70">
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">LRN</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Student Name</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Grade & Section</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Gender</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">Phil-IRI Level</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-right">Date Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border border-ink/10 p-8 text-center text-ink/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="size-5 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                        <span className="text-xs font-semibold">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-ink/10 p-10 text-center">
                      <div className="mx-auto max-w-xs flex flex-col items-center gap-2">
                        <ChartPie size={36} className="text-ink/20" />
                        <p className="text-xs font-bold text-ink/60">No records found</p>
                        <p className="text-xs text-ink/40">Try adjusting your search or grade filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const lvl = (s.level || '').toLowerCase();
                    let badge = 'bg-slate-100 text-slate-600 border-slate-200';
                    if (lvl.includes('independent')) badge = 'bg-[#00a652]/10 text-[#00a652] border-[#00a652]/20';
                    else if (lvl.includes('instructional')) badge = 'bg-amber-50 text-amber-700 border-amber-200';
                    else if (lvl.includes('frustration') || lvl.includes('non-reader') || lvl.includes('non reader')) badge = 'bg-[#d53f24]/10 text-[#d53f24] border-[#d53f24]/20';

                    return (
                      <tr key={s.id || s.lrn} className="hover:bg-ink/[0.02] transition-colors">
                        <td className="border border-ink/10 p-2 font-mono text-xs text-ink/80">{s.lrn}</td>
                        <td className="border border-ink/10 p-2 font-semibold text-sm text-ink">{s.name}</td>
                        <td className="border border-ink/10 p-2 text-xs text-ink/80">
                          <span className="font-semibold">{s.grade || 'Grade 4'}</span> - {s.section || 'Unassigned'}
                        </td>
                        <td className="border border-ink/10 p-2 text-xs text-ink/70">{s.gender || 'Male'}</td>
                        <td className="border border-ink/10 p-2">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge}`}>
                            {s.level || 'Pending Evaluation'}
                          </span>
                        </td>
                        <td className="border border-ink/10 p-2 text-right text-xs text-ink/50">{s.dateAdded || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredStudents.length > 0 && (
            <p className="mt-3 text-[11px] text-ink/40 text-right">
              Showing {filteredStudents.length} of {filteredByLang.length} records
            </p>
          )}
        </div>
      </div>
    </>
  );
}
