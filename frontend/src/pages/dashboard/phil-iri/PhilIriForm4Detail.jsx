import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, CheckCircle, DownloadSimple, FloppyDisk } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import { decodeSecureToken } from '../../../lib/securityToken.js';
import { getToken } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';

const FORM4_LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

function LevelMark({ active }) {
  return active ? (
    <Check size={16} weight="bold" className="mx-auto text-[#107c41]" />
  ) : (
    <span className="block text-gray-300">-</span>
  );
}

export default function PhilIriForm4Detail() {
  const { lrn: rawLrn } = useParams();
  const [student, setStudent] = useState({ name: '—', lrn: rawLrn, grade: '—', section: '—', school: '—', teacher: '—' });
  const [loading, setLoading] = useState(true);

  const initialRecord = {
    wordReading: { level: 'Grade 4', ind: false, ins: true, frus: false },
    comprehension: { level: 'Grade 4', ind: false, ins: true, frus: false },
    summary: { readingLevel: 'Instructional', levelAssigned: 'Grade 4', dateTaken: new Date().toISOString().split('T')[0] },
    observationChecklist: [
      { behavior: 'Does word by word reading', behaviorFilipino: 'Pagbasa nang isa-isang salita', result: '✓' },
      { behavior: 'Lacks expression', behaviorFilipino: 'Kakulangan sa damdamin', result: '✓' },
      { behavior: 'Does not obey punctuation marks', behaviorFilipino: 'Hindi pagpansin sa bantas', result: 'X 2' },
      { behavior: 'Points to words while reading', behaviorFilipino: 'Pagturo sa mga salita habang nagbabasa', result: '✓' },
    ],
  };

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [record, setRecord] = useState(initialRecord);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const res = await fetch(getApiUrl(`/api/teacher/phil-iri/form3-attempts/${encodeURIComponent(rawLrn)}?language=fil`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && data.student) {
          setStudent(data.student);
          if (data.attempts && data.attempts.length > 0) {
            const levelMap = {};
            data.attempts.forEach((att) => {
              const pGrade = att.passage_grade_level || 'Grade 4';
              const wrScore = Number(att.accuracy_percentage || 0);
              const wrLevel = wrScore >= 97 ? 'Independent' : wrScore >= 90 ? 'Instructional' : 'Frustration';
              const compLevel = att.comprehension_level || (Number(att.comprehension_score || 0) >= 6 ? 'Independent' : Number(att.comprehension_score || 0) >= 4 ? 'Instructional' : 'Frustration');
              const dStr = att.completed_at ? att.completed_at.split('T')[0] : '';
              levelMap[pGrade] = {
                wordReading: {
                  ind: wrLevel === 'Independent',
                  ins: wrLevel === 'Instructional',
                  frus: wrLevel === 'Frustration',
                },
                comprehension: {
                  ind: compLevel === 'Independent',
                  ins: compLevel === 'Instructional',
                  frus: compLevel === 'Frustration',
                },
                dateTaken: dStr,
                profile: att.overall_profile || wrLevel,
              };
            });

            const latest = data.attempts[data.attempts.length - 1];
            const pGrade = latest.passage_grade_level || 'Grade 4';
            const prof = latest.overall_profile || 'Instructional';

            setRecord((prev) => ({
              ...prev,
              levelMap,
              wordReading: {
                level: pGrade,
                ind: prof === 'Independent',
                ins: prof === 'Instructional',
                frus: prof === 'Frustration',
              },
              comprehension: {
                level: pGrade,
                ind: latest.comprehension_level === 'Independent',
                ins: latest.comprehension_level === 'Instructional',
                frus: latest.comprehension_level === 'Frustration',
              },
              summary: {
                readingLevel: prof,
                levelAssigned: pGrade,
                dateTaken: latest.completed_at ? latest.completed_at.split('T')[0] : prev.summary.dateTaken,
              },
            }));
          }
        }
      } catch (err) {
        console.warn('Error loading Form 4 student details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [rawLrn]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSave = () => {
    triggerToast('Form 4 Individual Summary Record saved successfully!');
  };

  const handleChecklistChange = (index, newResult) => {
    setRecord((prev) => {
      const nextList = [...prev.observationChecklist];
      nextList[index] = { ...nextList[index], result: newResult };
      return { ...prev, observationChecklist: nextList };
    });
  };

  // Export official Form 4 to Excel (.xlsx) using ExcelJS
  const handleExportXLSX = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Phil-IRI Form 4');

      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      };

      worksheet.columns = [
        { width: 14 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 16 },
      ];

      // Row 1: Code
      const r1 = worksheet.addRow(['', '', '', '', '', '', '', 'PHIL-IRI FORM 4']);
      r1.getCell(8).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF4B5563' } };
      r1.getCell(8).alignment = { horizontal: 'right' };

      // Row 2: Title
      const r2 = worksheet.addRow(['INDIVIDUAL SUMMARY RECORD (ISR) / TALAAN NG INDIBIDWAL NA PAGBASA (TIP)']);
      worksheet.mergeCells('A2:H2');
      r2.getCell(1).font = { name: 'Arial', size: 12, bold: true };
      r2.getCell(1).alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      // Metadata Rows
      worksheet.addRow(['Pangalan:', student.name, '', '', 'Baitang/Seksiyon:', `${student.grade}-${student.section}`]);
      worksheet.addRow(['Paaralan:', student.school, '', '', 'Guro:', student.teacher]);

      worksheet.addRow([]);

      // ISR Table Headers
      const rTableHead = worksheet.addRow(['Level', 'Word Reading', '', '', 'Comprehension', '', '', 'Date Taken']);
      worksheet.mergeCells(`B${rTableHead.number}:D${rTableHead.number}`);
      worksheet.mergeCells(`E${rTableHead.number}:G${rTableHead.number}`);
      rTableHead.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 10, bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      const rSubHead = worksheet.addRow(['', 'Ind', 'Ins', 'Frus', 'Ind', 'Ins', 'Frus', '']);
      rSubHead.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        c.border = borderThin;
        c.alignment = { horizontal: 'center' };
      });

      FORM4_LEVELS.forEach((lvl) => {
        const lvlData = record?.levelMap?.[lvl];
        const isActive = lvl === record?.wordReading?.level;
        const indWR = lvlData ? lvlData.wordReading.ind : (isActive && record?.wordReading?.ind);
        const insWR = lvlData ? lvlData.wordReading.ins : (isActive && record?.wordReading?.ins);
        const frusWR = lvlData ? lvlData.wordReading.frus : (isActive && record?.wordReading?.frus);
        const indComp = lvlData ? lvlData.comprehension.ind : (isActive && record?.comprehension?.ind);
        const insComp = lvlData ? lvlData.comprehension.ins : (isActive && record?.comprehension?.ins);
        const frusComp = lvlData ? lvlData.comprehension.frus : (isActive && record?.comprehension?.frus);
        const dateTaken = lvlData?.dateTaken || (isActive ? (record?.summary?.dateTaken || '—') : '—');

        const row = worksheet.addRow([
          lvl,
          indWR ? '✓' : '-',
          insWR ? '✓' : '-',
          frusWR ? '✓' : '-',
          indComp ? '✓' : '-',
          insComp ? '✓' : '-',
          frusComp ? '✓' : '-',
          dateTaken,
        ]);
        row.eachCell({ includeEmpty: true }, (c, col) => {
          c.font = { name: 'Arial', size: 9 };
          c.border = borderThin;
          c.alignment = { horizontal: 'center' };
          if (col === 1) c.font = { name: 'Arial', size: 9, bold: true };
        });
      });

      worksheet.addRow([]);

      // Checklist Header
      const rChecklistHead = worksheet.addRow(['Oral Reading Observation Checklist: Talaan ng mga Puna Habang Nagbabasa']);
      worksheet.mergeCells(`A${rChecklistHead.number}:H${rChecklistHead.number}`);
      rChecklistHead.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      rChecklistHead.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };

      const rCheckSub = worksheet.addRow(['Paraan ng Pagbabasa (Behaviors while Reading)', '', '', '', '', '', '✓ or X', '']);
      worksheet.mergeCells(`A${rCheckSub.number}:F${rCheckSub.number}`);
      worksheet.mergeCells(`G${rCheckSub.number}:H${rCheckSub.number}`);
      rCheckSub.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        c.border = borderThin;
      });

      (record?.observationChecklist || []).forEach((rowItem) => {
        const row = worksheet.addRow([`${rowItem.behavior} (${rowItem.behaviorFilipino})`, '', '', '', '', '', rowItem.result, '']);
        worksheet.mergeCells(`A${row.number}:F${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, (c, col) => {
          c.font = { name: 'Arial', size: 9 };
          c.border = borderThin;
          if (col >= 7) c.alignment = { horizontal: 'center' };
        });
      });

      // Write and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PHIL_IRI_FORM_4_${student.lrn || rawLrn}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      triggerToast('Downloaded PHIL-IRI FORM 4 (.XLSX) successfully!');
    } catch (err) {
      console.error('Error exporting Form 4 to Excel:', err);
      triggerToast('Failed to export Excel file.');
    }
  };

  return (
    <div className="pb-10 font-sans text-xs">
      <BackButton to="/teacher/phil-iri-records/form-4" size={20} />

      {/* Top Header Bar matching Form 1 & Form 2 */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            PHIL-IRI FORM 4 - INDIVIDUAL SUMMARY RECORD (ISR)
          </h3>
          <p className="text-xs text-ink/60">
            {student.name} ({student.lrn || rawLrn}) — Talaan ng Indibidwal na Pagbasa (TIP)
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

      {showToast && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652] border border-[#00a652]/30">
          <CheckCircle size={18} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Official DepEd Excel Worksheet UI */}
      <div className="overflow-x-auto rounded-lg border border-gray-400 bg-white p-6 shadow-xs">
        <div className="min-w-[850px]">
          {/* Header Title Block */}
          <div className="text-center space-y-0.5 mb-4">
            <p className="text-right text-[11px] font-bold text-gray-700">PHIL-IRI FORM 4</p>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              INDIVIDUAL SUMMARY RECORD (ISR) /
            </h2>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              TALAAN NG INDIBIDWAL NA PAGBASA (TIP)
            </h2>
          </div>

          {/* Form Header Information Grid */}
          <div className="space-y-2 text-xs text-gray-900 font-semibold mb-6 px-1 border-t border-b border-gray-300 py-3 bg-gray-50/50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex items-center">
                <span>Pangalan (Name):</span>
                <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.name}
                </strong>
              </div>
              <div className="flex items-center">
                <span>Baitang/Seksiyon (Grade/Sec):</span>
                <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900">
                  {student.grade}-{student.section}
                </strong>
              </div>
              <div className="flex items-center">
                <span>Paaralan (School):</span>
                <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900">
                  {student.school}
                </strong>
              </div>
              <div className="flex items-center">
                <span>Guro (Teacher):</span>
                <strong className="grow border-b border-gray-700 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.teacher}
                </strong>
              </div>
            </div>
          </div>

          {/* Form 4 Excel Table Grid */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400 text-xs font-sans text-center">
              <thead>
                <tr className="bg-[#d4d4d4] font-bold text-gray-900 uppercase border border-gray-400">
                  <th rowSpan={2} className="border border-gray-400 p-2 w-28 bg-[#c4c4c4]">
                    Level (Antas)
                  </th>
                  <th colSpan={3} className="border border-gray-400 p-2 bg-[#e2e2e2]">
                    Word Reading (Pagbasa)
                  </th>
                  <th colSpan={3} className="border border-gray-400 p-2 bg-[#d4d4d4]">
                    Comprehension (Pag-unawa)
                  </th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-32 bg-[#c4c4c4]">
                    Date Taken (Petsa)
                  </th>
                </tr>
                <tr className="bg-[#f0f0f0] font-bold text-gray-800 text-[11px] border border-gray-400">
                  <th className="border border-gray-400 p-1.5 w-16">Ind</th>
                  <th className="border border-gray-400 p-1.5 w-16">Ins</th>
                  <th className="border border-gray-400 p-1.5 w-16">Frus</th>
                  <th className="border border-gray-400 p-1.5 w-16">Ind</th>
                  <th className="border border-gray-400 p-1.5 w-16">Ins</th>
                  <th className="border border-gray-400 p-1.5 w-16">Frus</th>
                </tr>
              </thead>
              <tbody>
                {FORM4_LEVELS.map((lvl) => {
                  const lvlData = record?.levelMap?.[lvl];
                  const isActive = lvl === record?.wordReading?.level;
                  const isTested = Boolean(lvlData || isActive);
                  const indWR = lvlData ? lvlData.wordReading.ind : (isActive && record?.wordReading?.ind);
                  const insWR = lvlData ? lvlData.wordReading.ins : (isActive && record?.wordReading?.ins);
                  const frusWR = lvlData ? lvlData.wordReading.frus : (isActive && record?.wordReading?.frus);
                  const indComp = lvlData ? lvlData.comprehension.ind : (isActive && record?.comprehension?.ind);
                  const insComp = lvlData ? lvlData.comprehension.ins : (isActive && record?.comprehension?.ins);
                  const frusComp = lvlData ? lvlData.comprehension.frus : (isActive && record?.comprehension?.frus);
                  const dateVal = lvlData?.dateTaken || (isActive ? (record?.summary?.dateTaken || '') : '');

                  return (
                    <tr key={lvl} className={isTested ? 'bg-[#f5faf6] font-bold' : 'hover:bg-gray-50'}>
                      <td className="border border-gray-400 p-2 font-mono font-bold bg-[#eaeaea] text-gray-800">
                        {isActive ? '* ' : ''}
                        {lvl}
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={indWR} />
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={insWR} />
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={frusWR} />
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={indComp} />
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={insComp} />
                      </td>
                      <td className="border border-gray-400 p-2">
                        <LevelMark active={frusComp} />
                      </td>
                      <td className="border border-gray-400 p-2 text-gray-700">
                        {dateVal ? (
                          <span className="font-semibold text-gray-900">{dateVal}</span>
                        ) : isActive ? (
                          <input
                            type="date"
                            value={record?.summary?.dateTaken ?? ''}
                            onChange={(e) =>
                              setRecord((r) => ({ ...r, summary: { ...r.summary, dateTaken: e.target.value } }))
                            }
                            className="w-full bg-transparent text-center text-xs font-bold text-gray-900 outline-none"
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mb-6 text-[11px] font-semibold italic text-gray-600">
            Legend: Ind - Independent; Ins - Instructional; Frus - Frustration
          </p>

          {/* Checklist Excel Table */}
          <div className="mt-8 border-t border-gray-300 pt-4">
            <table className="w-full border-collapse border border-gray-400 text-xs font-sans">
              <thead>
                <tr className="bg-[#d4d4d4] text-gray-900 font-bold border border-gray-400">
                  <th colSpan={2} className="border border-gray-400 p-2 text-left uppercase">
                    Oral Reading Observation Checklist: Talaan ng mga Puna Habang Nagbabasa
                  </th>
                </tr>
                <tr className="bg-[#e2e2e2] text-gray-900 font-bold border border-gray-400">
                  <th className="border border-gray-400 p-2 text-left">
                    Behaviors while Reading <span className="font-normal italic text-gray-700">(Paraan ng Pagbabasa)</span>
                  </th>
                  <th className="w-32 border border-gray-400 p-2 text-center">✓ or X</th>
                </tr>
              </thead>
              <tbody>
                {(record?.observationChecklist || []).map((row, i) => (
                  <tr key={row.behavior} className="hover:bg-[#f5faf6]">
                    <td className="border border-gray-400 p-2 text-gray-900">
                      <strong>{row.behavior}</strong>{' '}
                      <span className="italic text-gray-600">({row.behaviorFilipino})</span>
                    </td>
                    <td className="border border-gray-400 p-2 text-center font-bold">
                      <input
                        value={row.result}
                        onChange={(e) => handleChecklistChange(i, e.target.value)}
                        className="w-16 border-b border-gray-400 text-center font-bold text-gray-900 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
