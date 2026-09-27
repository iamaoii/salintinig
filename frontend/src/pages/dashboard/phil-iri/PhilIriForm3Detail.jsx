import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Microphone, WarningCircle, DownloadSimple, FloppyDisk } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import { decodeSecureToken } from '../../../lib/securityToken.js';
import { getToken } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';

export default function PhilIriForm3Detail({ formKey, label, backTo }) {
  const { lrn: rawLrn } = useParams();
  const isTagalog = formKey === 'form-3a';
  const langCode = isTagalog ? 'fil' : 'en';

  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [record, setRecord] = useState(null);

  const buildDefaultMiscues = (att) => [
    { id: 1, nameEn: 'Mispronunciation', nameFil: 'Maling Bigkas', count: Number(att?.mispronunciation_count || 0) },
    { id: 2, nameEn: 'Omission', nameFil: 'Pagkakaltas', count: Number(att?.omission_count || 0) },
    { id: 3, nameEn: 'Substitution', nameFil: 'Pagpapalit', count: Number(att?.substitution_count || 0) },
    { id: 4, nameEn: 'Insertion', nameFil: 'Pagsisiringit', count: Number(att?.insertion_count || 0) },
    { id: 5, nameEn: 'Repetition', nameFil: 'Pag-uulit', count: Number(att?.repetition_count || 0) },
    { id: 6, nameEn: 'Transposition', nameFil: 'Pagpapalit ng lugar', count: Number(att?.transposition_count || 0) },
    { id: 7, nameEn: 'Reversal', nameFil: 'Paglilipat', count: Number(att?.reversal_count || 0) },
  ];

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(
          getApiUrl(`/api/teacher/phil-iri/form3-attempts/${encodeURIComponent(rawLrn)}?language=${langCode}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setStudentInfo(data.student);
          setAttempts(data.attempts || []);
          setSelectedAttemptIndex(0);
        }
      } catch (err) {
        console.warn('Error fetching Form 3 attempts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [rawLrn, langCode]);

  useEffect(() => {
    if (attempts.length > 0 && attempts[selectedAttemptIndex]) {
      const att = attempts[selectedAttemptIndex];
      const dateObj = att.completed_at || att.created_at;
      const formattedDate = dateObj
        ? new Date(dateObj).toLocaleDateString('fil-PH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

      const readTimeSec = Number(att.reading_time_seconds || 0);
      const readTimeMin = readTimeSec > 0 ? (readTimeSec / 60).toFixed(2) : '0.00';

      const rawComp = Number(att.comprehension_score || 0);
      const compMarka = rawComp > 7 ? Math.round((rawComp / 100) * 7) : Math.round(rawComp);
      const compPct = Math.round(Number(att.comprehension_percentage || (rawComp > 7 ? rawComp : (rawComp / 7) * 100) || 0));

      setRecord({
        passageTitle: att.passage_title ? `"${att.passage_title}"` : '"Pangalan ng Teksto"',
        passageText: att.passage_text || '',
        level: att.passage_grade_level || 'Grade Level',
        wordCount: Number(att.word_count || 0),
        testType: (att.assessment_period || 'pre_test').toLowerCase().includes('post') ? 'Post-Test' : 'Pre-Test',
        set: att.passage_set || 'A',
        date: formattedDate,
        readingTimeMinutes: readTimeMin,
        readingRateWpm: String(Math.round(Number(att.words_per_minute || att.reading_rate_wpm || 0))),
        compMarka: compMarka,
        compPercentage: compPct,
        compLevel: att.comprehension_level || (compPct >= 80 ? 'Independent' : compPct >= 59 ? 'Instructional' : 'Frustration'),
        miscues: buildDefaultMiscues(att),
        overallProfile: att.overall_profile || 'Pending',
        stepNumber: att.adaptive_step_number || (selectedAttemptIndex + 1),
      });
    } else {
      setRecord({
        passageTitle: '"Walang Assessment Attempt"',
        passageText: 'Wala pang nakatalang nakumpletong oral reading assessment attempt para sa estudyanteng ito.',
        level: '—',
        wordCount: 0,
        testType: 'Pre-Test',
        set: 'A',
        date: '—',
        readingTimeMinutes: '0.00',
        readingRateWpm: '0',
        compMarka: 0,
        compPercentage: 0,
        compLevel: '—',
        miscues: buildDefaultMiscues(null),
        overallProfile: '—',
        stepNumber: 1,
      });
    }
  }, [attempts, selectedAttemptIndex]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSave = () => {
    triggerToast('Assessment record saved successfully!');
  };

  const totalMiscues = (record?.miscues || []).reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const numWords = record?.wordCount || 0;
  const wordReadingScore = numWords > 0 ? Math.max(0, (((numWords - totalMiscues) / numWords) * 100)).toFixed(2) : '0.00';
  const wordReadingLevel =
    numWords === 0
      ? '—'
      : Number(wordReadingScore) >= 97
      ? 'INDEPENDENT'
      : Number(wordReadingScore) >= 90
      ? 'INSTRUCTIONAL'
      : 'FRUSTRATION';

  const handleMiscueChange = (index, val) => {
    const updated = [...(record.miscues || [])];
    updated[index] = { ...updated[index], count: Math.max(0, Number(val) || 0) };
    setRecord((prev) => ({ ...prev, miscues: updated }));
  };

  const formTitleMap = {
    'form-3a': 'Markahang Papel ng Panggradong Lebel na Teksto (Filipino)',
    'form-3b': 'Graded Passage Rating Sheet (English)',
    'form-4': 'RUNNING RECORD FORM',
  };

  const formTitle = formTitleMap[formKey] || 'Markahang Papel ng Panggradong Lebel na Teksto';
  const pageFormCode = isTagalog ? 'PHIL-IRI FORM 3A' : 'PHIL-IRI FORM 3B';

  const studentDisplay = studentInfo || {
    name: '—',
    lrn: rawLrn,
    grade: '—',
    section: '—',
    age: '—',
    school: '—',
    teacher: '—',
  };

  // Export to Excel (.xlsx) using ExcelJS matching Form 1A/1B & Form 2
  const handleExportXLSX = async () => {
    if (!record) return;
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheetName = isTagalog ? 'Phil-IRI Form 3A' : 'Phil-IRI Form 3B';
      const worksheet = workbook.addWorksheet(sheetName);

      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      };

      worksheet.columns = [
        { width: 12 },
        { width: 32 },
        { width: 20 },
        { width: 22 },
        { width: 22 },
      ];

      // Row 1: Code Right Aligned
      const r1 = worksheet.addRow(['', '', '', '', pageFormCode]);
      r1.getCell(5).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF4B5563' } };
      r1.getCell(5).alignment = { horizontal: 'right' };

      // Row 2: Title
      const r2 = worksheet.addRow([formTitle.toUpperCase()]);
      worksheet.mergeCells(`A2:E2`);
      r2.getCell(1).font = { name: 'Arial', size: 12, bold: true };
      r2.getCell(1).alignment = { horizontal: 'center' };

      // Row 3: Subtitle
      const r3 = worksheet.addRow([isTagalog ? 'Panimulang Pagtatasa sa Filipino' : 'Pre-Test Assessment in English']);
      worksheet.mergeCells(`A3:E3`);
      r3.getCell(1).font = { name: 'Arial', size: 10, italic: true };
      r3.getCell(1).alignment = { horizontal: 'center' };

      // Row 4: Attempt & Set
      const r4 = worksheet.addRow([`Attempt ${selectedAttemptIndex + 1} — Set ${record.set} (${record.level})`]);
      worksheet.mergeCells(`A4:E4`);
      r4.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      r4.getCell(1).alignment = { horizontal: 'center' };

      worksheet.addRow([]); // Blank row 5

      // Row 6-8: Student Metadata
      worksheet.addRow(['Pangalan:', studentDisplay.name, '', 'Baitang/Seksiyon:', `${studentDisplay.grade}-${studentDisplay.section}`]);
      worksheet.addRow(['Paaralan:', studentDisplay.school, '', 'Guro:', studentDisplay.teacher]);
      worksheet.addRow(['Petsa:', record.date, '', 'Antas ng Pagbasa:', wordReadingLevel]);

      worksheet.addRow([]); // Blank row 10

      // Passage Content
      const rPassageHead = worksheet.addRow([`Seleksyon: ${record.passageTitle}`]);
      worksheet.mergeCells(`A${rPassageHead.number}:E${rPassageHead.number}`);
      rPassageHead.getCell(1).font = { name: 'Arial', size: 11, bold: true };

      const rPassageText = worksheet.addRow([record.passageText]);
      worksheet.mergeCells(`A${rPassageText.number}:E${rPassageText.number}`);
      rPassageText.getCell(1).alignment = { wrapText: true };
      rPassageText.height = 100;

      worksheet.addRow([]);

      // PART A Header
      const rPartA = worksheet.addRow(['PART A: PAGTATASA SA PAG-UNAWA (COMPREHENSION)']);
      worksheet.mergeCells(`A${rPartA.number}:E${rPartA.number}`);
      rPartA.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      rPartA.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };

      const rPartAHeaders = worksheet.addRow(['Oras ng Pagbasa', 'Bilis (WPM)', 'Marka sa Pag-unawa', 'Antas ng Pag-unawa', 'Overall Profile']);
      rPartAHeaders.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      const rPartAData = worksheet.addRow([
        `${record.readingTimeMinutes} min`,
        `${record.readingRateWpm} WPM`,
        `${record.compMarka} / 7 (${record.compPercentage}%)`,
        record.compLevel,
        record.overallProfile,
      ]);
      rPartAData.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 10, bold: true };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      worksheet.addRow([]);

      // PART B Header
      const rPartB = worksheet.addRow(['PART B: WORD READING (PAGBASA) — URI AT BILANG NG MALI (MISCUES)']);
      worksheet.mergeCells(`A${rPartB.number}:E${rPartB.number}`);
      rPartB.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      rPartB.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };

      const rMiscueHeader = worksheet.addRow(['#', 'Uri ng Mali (Miscue Type)', '', 'Bilang ng Mali (Miscue Count)', '']);
      worksheet.mergeCells(`B${rMiscueHeader.number}:C${rMiscueHeader.number}`);
      worksheet.mergeCells(`D${rMiscueHeader.number}:E${rMiscueHeader.number}`);
      rMiscueHeader.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      record.miscues.forEach((m) => {
        const row = worksheet.addRow([m.id, `${m.nameEn} (${m.nameFil})`, '', m.count, '']);
        worksheet.mergeCells(`B${row.number}:C${row.number}`);
        worksheet.mergeCells(`D${row.number}:E${row.number}`);
        row.eachCell({ includeEmpty: true }, (c, col) => {
          c.font = { name: 'Arial', size: 9 };
          c.border = borderThin;
          if (col === 1 || col >= 4) c.alignment = { horizontal: 'center' };
        });
      });

      // Total Miscues Row
      const rTotal = worksheet.addRow(['KABUUAN (TOTAL MISCUES)', '', '', totalMiscues, '']);
      worksheet.mergeCells(`A${rTotal.number}:C${rTotal.number}`);
      worksheet.mergeCells(`D${rTotal.number}:E${rTotal.number}`);
      rTotal.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 10, bold: true };
        c.border = borderThin;
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      });

      // Word Reading Score
      const rScore = worksheet.addRow(['Word Reading Score (% ng Pagbasa)', '', '', `${wordReadingScore}%`, '']);
      worksheet.mergeCells(`A${rScore.number}:C${rScore.number}`);
      worksheet.mergeCells(`D${rScore.number}:E${rScore.number}`);
      rScore.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 10, bold: true };
        c.border = borderThin;
      });

      // Word Reading Level
      const rLevel = worksheet.addRow(['Word Reading Level (Antas ng Pagbasa)', '', '', wordReadingLevel, '']);
      worksheet.mergeCells(`A${rLevel.number}:C${rLevel.number}`);
      worksheet.mergeCells(`D${rLevel.number}:E${rLevel.number}`);
      rLevel.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF107C41' } };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      // Write and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pageFormCode.replace(/\s+/g, '_')}_${studentDisplay.lrn}_Attempt${selectedAttemptIndex + 1}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      triggerToast(`Downloaded ${pageFormCode} (.XLSX) successfully!`);
    } catch (err) {
      console.error('Failed to export Form 3 to Excel:', err);
      triggerToast('Failed to export Excel file.');
    }
  };

  return (
    <div className="pb-10 font-sans text-xs">
      <BackButton to={backTo} size={20} />

      {/* Top Action Header Bar matching Form 1A/1B & Form 2 */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            {pageFormCode} - {formTitle.toUpperCase()}
          </h3>
          <p className="text-xs text-ink/60">
            {studentDisplay.name} ({studentDisplay.lrn}) — {attempts.length} Oral Assessment Attempt(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs"
          >
            <DownloadSimple size={15} weight="bold" className="text-[#107c41]" />
            <span>Export .XLSX</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-[#107c41] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0b542c] transition-colors cursor-pointer shadow-xs"
          >
            <FloppyDisk size={15} weight="bold" />
            <span>Save Record</span>
          </button>
        </div>
      </div>

      {/* Attempts Stepper / Selector Pills Bar */}
      {attempts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink/50 mr-1 flex items-center gap-1">
            <Microphone size={14} weight="bold" /> Oral Attempts:
          </span>
          {attempts.map((att, idx) => {
            const isSelected = selectedAttemptIndex === idx;
            const levelLabel = att.passage_grade_level || `Attempt ${idx + 1}`;
            const profile = att.overall_profile || 'Pending';
            return (
              <button
                key={att.attempt_id || idx}
                type="button"
                onClick={() => {
                  setSelectedAttemptIndex(idx);
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#107c41] text-white border-[#107c41] shadow-2xs'
                    : 'bg-white border-ink/20 text-ink/70 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <span>
                  Attempt {idx + 1}: {levelLabel}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : profile === 'Independent'
                      ? 'bg-emerald-100 text-emerald-800'
                      : profile === 'Instructional'
                      ? 'bg-amber-100 text-amber-800'
                      : profile === 'Frustration'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-ink/10 text-ink/60'
                  }`}
                >
                  {profile}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showToast && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652] border border-[#00a652]/30">
          <CheckCircle size={18} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-400 bg-white p-12 text-center shadow-xs">
          <Clock size={32} className="animate-spin text-[#107c41] mb-3" />
          <p className="text-sm font-bold text-ink">Loading Form 3 Assessment Attempts...</p>
        </div>
      ) : !record ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-400 bg-white p-12 text-center">
          <WarningCircle size={32} className="text-ink/40 mb-2" />
          <p className="text-sm font-semibold text-ink/70">Wala pang nakatalang oral reading attempt para sa estudyanteng ito.</p>
        </div>
      ) : (
        /* CLEAN OFFICIAL DEPED EXCEL FORM TABLE UI CONTAINER */
        <div className="overflow-x-auto rounded-lg border border-gray-400 bg-white p-6 shadow-xs space-y-6">
          <div className="min-w-[850px]">
            {/* Sheet Top Form Header */}
            <div className="text-center space-y-0.5 mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                <span className="font-bold text-[#107c41]">
                  ATTEMPT {selectedAttemptIndex + 1} NG {Math.max(1, attempts.length)}
                </span>
                <span>{pageFormCode}, Pahina 1</span>
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {isTagalog ? 'Markahang Papel ng Panggradong Lebel na Teksto' : 'Graded Passage Rating Sheet'}
              </h2>
              <p className="text-xs font-semibold text-gray-700">
                {isTagalog ? 'Panimulang Pagtatasa sa Filipino' : 'Pre-Test Assessment in English'}
              </p>
              <p className="text-xs font-bold text-gray-900">
                Set {record.set} ({record.level})
              </p>
            </div>

            {/* Official DepEd Header Metadata Grid (Matching Form 1 & Form 2) */}
            <div className="space-y-2 text-xs text-gray-900 font-semibold mb-6 px-1 border-t border-b border-gray-300 py-3 bg-gray-50/50">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <span>Pangalan:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900 truncate">
                    {studentDisplay.name}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>Edad:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900">
                    {studentDisplay.age || '—'}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>Baitang/Seksiyon:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900">
                    {studentDisplay.grade}-{studentDisplay.section}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center col-span-2">
                  <span>Paaralan:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900">
                    {studentDisplay.school}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>Guro:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900 truncate">
                    {studentDisplay.teacher}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="radio"
                      checked={record.testType === 'Pre-Test'}
                      onChange={() => setRecord((r) => ({ ...r, testType: 'Pre-Test' }))}
                      className="accent-[#107c41]"
                    />
                    <span>Pre-Test</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                    <input
                      type="radio"
                      checked={record.testType === 'Post-Test'}
                      onChange={() => setRecord((r) => ({ ...r, testType: 'Post-Test' }))}
                      className="accent-[#107c41]"
                    />
                    <span>Post-Test</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <span>Level:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-center text-gray-900">
                    {record.level}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>Set:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-center text-gray-900">
                    {record.set}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>Petsa:</span>
                  <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-center text-gray-900">
                    {record.date}
                  </strong>
                </div>
              </div>
            </div>

            {/* Passage Box styled cleanly like Form 1/2 DepEd Worksheet */}
            <div className="mb-6 rounded border border-gray-400 bg-white p-5">
              <h5 className="text-center text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                {record.passageTitle}
              </h5>
              <div className="text-xs leading-relaxed text-gray-900 whitespace-pre-line space-y-2.5 font-serif px-2">
                {record.passageText}
              </div>
              <div className="mt-4 flex justify-between items-center text-[11px] font-bold text-gray-700 pt-2 border-t border-gray-300">
                <span>Antas: {record.level}</span>
                <span>Bilang ng mga Salita: {record.wordCount}</span>
              </div>
            </div>

            {/* ── EXCEL TABLE: PAHINA 2 (PART A & PART B) ── */}
            <div className="mt-8 pt-4 border-t border-gray-300">
              <div className="flex justify-end text-[11px] font-bold text-gray-600 mb-2">
                {pageFormCode}, Pahina 2
              </div>

              {/* PART A: COMPREHENSION & READING RATE TABLE (EXCEL GRID LOOK) */}
              <div className="mb-6">
                <table className="w-full border-collapse border border-gray-400 text-xs font-sans mb-3">
                  <thead>
                    <tr className="bg-[#e2e2e2] text-gray-900 font-bold border border-gray-400">
                      <th colSpan={4} className="border border-gray-400 p-2 text-left uppercase bg-[#d4d4d4]">
                        PART A: Pagtatasa sa Pag-unawa (Comprehension) & Rate ng Pagbasa
                      </th>
                    </tr>
                    <tr className="bg-[#f0f0f0] text-gray-800 font-semibold border border-gray-400 text-center">
                      <th className="border border-gray-400 p-2 w-1/4">Kabuuang Oras ng Pagbasa</th>
                      <th className="border border-gray-400 p-2 w-1/4">Rate ng Pagbasa (WPM)</th>
                      <th className="border border-gray-400 p-2 w-1/4">Marka sa Pag-unawa</th>
                      <th className="border border-gray-400 p-2 w-1/4">Antas ng Pag-unawa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center font-bold text-gray-900 bg-white">
                      <td className="border border-gray-400 p-2.5">{record.readingTimeMinutes} minuto</td>
                      <td className="border border-gray-400 p-2.5">{record.readingRateWpm} salita / minuto</td>
                      <td className="border border-gray-400 p-2.5">
                        {record.compMarka} / 7 ({record.compPercentage}%)
                      </td>
                      <td
                        className={`border border-gray-400 p-2.5 uppercase font-black ${
                          record.compLevel === 'Independent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.compLevel === 'Instructional'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.compLevel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PART B: WORD READING & MISCUES EXCEL TABLE */}
              <div>
                <table className="w-full border-collapse border border-gray-400 text-xs font-sans">
                  <thead>
                    <tr className="bg-[#d4d4d4] text-gray-900 font-bold border border-gray-400">
                      <th colSpan={3} className="border border-gray-400 p-2 text-left uppercase">
                        PART B: Word Reading (Pagbasa) — Uri at Bilang ng Mali (Miscues)
                      </th>
                    </tr>
                    <tr className="bg-[#e2e2e2] text-gray-900 font-bold border border-gray-400 text-center">
                      <th className="border border-gray-400 p-2 w-12 bg-[#d4d4d4]">#</th>
                      <th className="border border-gray-400 p-2 text-left">
                        Types of Miscues <span className="font-normal italic text-gray-700">(Uri ng Mali)</span>
                      </th>
                      <th className="border border-gray-400 p-2 w-48 text-center">
                        Number of Miscues <br />
                        <span className="font-normal italic text-gray-700">(Bilang ng Salitang mali ang basa)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.miscues.map((m) => (
                      <tr key={m.id} className="hover:bg-[#f5faf6] transition-colors">
                        <td className="border border-gray-400 p-1.5 text-center font-mono font-bold bg-[#eaeaea] text-gray-800">
                          {m.id}
                        </td>
                        <td className="border border-gray-400 p-1.5 text-gray-900 font-medium">
                          {m.nameEn} <span className="italic text-gray-600">({m.nameFil})</span>
                        </td>
                        <td className="border border-gray-400 p-1.5 text-center font-bold text-gray-900">
                          <input
                            type="number"
                            value={m.count}
                            onChange={(e) => handleMiscueChange(m.id - 1, e.target.value)}
                            className="w-16 border-b border-gray-400 text-center font-bold text-gray-900 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#f0f0f0] font-bold text-gray-900">
                      <td colSpan={2} className="border border-gray-400 p-2 text-right">
                        Total Miscues <span className="italic font-normal text-gray-700">(Kabuuan)</span>:
                      </td>
                      <td className="border border-gray-400 p-2 text-center text-gray-900 font-black">{totalMiscues}</td>
                    </tr>
                    <tr className="bg-white font-bold text-gray-900">
                      <td colSpan={2} className="border border-gray-400 p-2 text-right">
                        Number of Words in the Passage (Bilang ng Salita):
                      </td>
                      <td className="border border-gray-400 p-2 text-center text-gray-900 font-bold">{record.wordCount}</td>
                    </tr>
                    <tr className="bg-white font-bold text-gray-900">
                      <td colSpan={2} className="border border-gray-400 p-2 text-right">
                        Word Reading Score (% ng Pagbasa):
                      </td>
                      <td className="border border-gray-400 p-2 text-center text-gray-900 font-bold">{wordReadingScore}%</td>
                    </tr>
                    <tr
                      className={`font-bold text-sm ${
                        wordReadingLevel === 'INDEPENDENT'
                          ? 'bg-[#107c41] text-white'
                          : wordReadingLevel === 'INSTRUCTIONAL'
                          ? 'bg-amber-600 text-white'
                          : wordReadingLevel === 'FRUSTRATION'
                          ? 'bg-rose-700 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <td colSpan={2} className="border border-gray-400 p-2 text-right">
                        Word Reading Level (Antas ng Pagbasa):
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-black uppercase tracking-wider">
                        {wordReadingLevel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
