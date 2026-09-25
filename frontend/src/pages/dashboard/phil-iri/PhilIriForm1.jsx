import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Plus,
  Trash,
  FileXls,
  DownloadSimple,
  UploadSimple,
  FloppyDisk,
  Function,
  CaretRight,
  CaretLeft,
} from '@phosphor-icons/react';
import { classInfo, form1Rows } from '../../../data/philIriRecords.js';
import { getApiUrl } from '../../../config/api.js';
import { getToken, getUser } from '../../../lib/auth.js';
import { PhilIriForm1Skeleton } from '../../../components/common/Skeleton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import cacheService from '../../../services/cacheService.js';
import * as XLSX from 'xlsx';

const EXCEL_COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const BOTTOM_TABS = [
  { id: 'how-to-use', label: 'How To Use', color: 'bg-amber-400 text-ink font-bold' },
  { id: 'form-1b', label: 'form 1B', color: 'bg-amber-400 text-ink font-bold border-t-2 border-amber-600' },
  { id: 'gst-below-14', label: 'GST <14', color: 'bg-emerald-500 text-white font-bold' },
  { id: 'chairman-conso', label: 'Chairman Conso', color: 'bg-teal-500 text-white font-bold' },
  { id: 'school-conso', label: 'School Conso', color: 'bg-blue-500 text-white font-bold' },
  { id: 'district-conso', label: 'District Conso', color: 'bg-purple-500 text-white font-bold' },
  { id: 'class-reading-profile', label: 'Class Reading Profile', color: 'bg-orange-500 text-white font-bold' },
  { id: 'crp-conso', label: 'CRP CONSO', color: 'bg-pink-500 text-white font-bold' },
];

export default function PhilIriForm1({ language }) {
  const isTagalog = language !== 'en';
  const formTitle = isTagalog
    ? 'TALAAN NG PANGKATANG PAGTATASA NG KLASE (TPPK)'
    : 'SCREENING TEST CLASS READING RECORD (STCRR)';
  const formCode = isTagalog ? 'PHIL-IRI FORM 1A' : 'PHIL-IRI FORM 1B';

  const [isLoading, setIsLoading] = useState(true);
  const [activeCell, setActiveCell] = useState('E11');
  const [selectedSheet, setSelectedSheet] = useState('form 1B');
  const [toastMessage, setToastMessage] = useState(null);

  const formatDateString = (dateObj = new Date()) => {
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const monthIndex = dateObj.getMonth();

    const tagalogMonths = [
      'Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
      'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'
    ];
    const englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (isTagalog) {
      return `${day} ${tagalogMonths[monthIndex]} ${year}`;
    }
    return `${englishMonths[monthIndex]} ${day}, ${year}`;
  };

  const [dbClassInfo, setDbClassInfo] = useState({
    grade: '',
    section: '',
    teacher: '',
    school: '',
    level: '',
    date: formatDateString(),
  });

  // Split students into Male and Female rows (up to 30 slots each like DepEd form)
  const [maleRows, setMaleRows] = useState([]);
  const [femaleRows, setFemaleRows] = useState([]);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ message: msg, type });
  };

  // Helper to map DB student to Form 1B row model (only student name and gender auto-fetched)
  const mapStudentToRow = (std, defaultGender = 'M') => {
    let name = '';
    if (std.lastName || std.last_name || std.firstName || std.first_name) {
      const lName = (std.lastName || std.last_name || '').trim();
      const fName = (std.firstName || std.first_name || '').trim();
      name = lName && fName ? `${lName}, ${fName}` : (lName || fName);
    } else if (std.name) {
      const parts = std.name.trim().split(' ');
      if (parts.length > 1 && !std.name.includes(',')) {
        const last = parts.pop();
        const first = parts.join(' ');
        name = `${last}, ${first}`;
      } else {
        name = std.name.trim();
      }
    }

    const rawSex = String(std.gender || std.sex || std.gender_name || defaultGender).toUpperCase();
    const gender = rawSex.startsWith('F') || rawSex.startsWith('B') || rawSex.includes('FEMALE') || rawSex.includes('BABAE') ? 'F' : 'M';

    // GST Form 1A/1B scores are strictly filled out manually by teacher (no system reading test scores mapped)
    return {
      lrn: std.lrn || std.student_id || '',
      name,
      gender,
      testTaken: std.testTaken || std.test_taken_symbol || '',
      literalNum: std.literalNum ?? std.literal_score ?? '',
      inferentialNum: std.inferentialNum ?? std.inferential_score ?? '',
      criticalNum: std.criticalNum ?? std.critical_score ?? '',
      totalNum: std.totalNum ?? '',
      below14: '',
      above14: '',
      startingPoint: '',
    };
  };

  // Sync date format whenever language changes dynamically
  useEffect(() => {
    setDbClassInfo((prev) => ({
      ...prev,
      date: formatDateString(),
    }));
  }, [isTagalog]);

  // Fetch real database enrolled students and auto-fill saved GST scores
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoading(true);
        const user = getUser();
        if (user) {
          const teacherName = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : '');
          const schoolName = user.schoolName || user.school_name || user.school || '';
          setDbClassInfo((prev) => ({
            ...prev,
            teacher: teacherName,
            school: schoolName,
            date: formatDateString(),
          }));
        }

        const token = getToken();
        const currentLang = isTagalog ? 'Tagalog' : 'English';
        const cacheKey = `form1_class_students_${language}`;
        
        let data = cacheService.get(cacheKey);

        if (!data) {
          const res = await fetch(getApiUrl('/api/teacher/class-students'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          data = await res.json();
          if (res.ok && data.success) {
            cacheService.set(cacheKey, data, 180000); // 3 mins TTL
          }
        }

        if (data && data.success && Array.isArray(data.students) && data.students.length > 0) {
          const sample = data.students[0];
          const currentSection = sample.sectionName || sample.section_name || data.sectionName || dbClassInfo.section;
          const currentGrade = sample.gradeLevel || sample.grade_level || data.gradeLevel || dbClassInfo.grade;

          setDbClassInfo((prev) => ({
            ...prev,
            section: currentSection,
            grade: currentGrade,
            school: data.schoolName || sample.schoolName || sample.school_name || data.school_name || prev.school,
            principalName: data.principalName || data.principal_name || sample.principalName || prev.principalName || '',
            date: formatDateString(),
          }));

          // Check if there is a saved GST Submission for this section & language (Option B) with caching
          const subCacheKey = `form1_gst_sub_${currentSection}_${currentLang}`;
          let savedSubmissionMap = {};

          try {
            let subData = cacheService.get(subCacheKey);
            if (!subData) {
              const subRes = await fetch(getApiUrl(`/api/teacher/phil-iri/gst-submission?sectionName=${encodeURIComponent(currentSection)}&language=${currentLang}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              subData = await subRes.json();
              if (subRes.ok && subData.success) {
                cacheService.set(subCacheKey, subData, 180000);
              }
            }

            if (subData && subData.success && subData.submission && subData.submission.form_data) {
              const fData = subData.submission.form_data;
              const savedRows = [...(fData.maleRows || []), ...(fData.femaleRows || [])];
              savedRows.forEach((r) => {
                if (r.name) savedSubmissionMap[r.name.trim().toLowerCase()] = r;
                if (r.lrn) savedSubmissionMap[r.lrn] = r;
              });
            }
          } catch (e) {
            console.warn('Could not fetch saved submission:', e);
          }

          // Build roster from current DB students and merge any saved scores
          const males = [];
          const females = [];

          data.students.forEach((std) => {
            const mapped = mapStudentToRow(std);
            if (mapped.name && mapped.name.trim() !== '') {
              const normName = mapped.name.trim().toLowerCase();
              const savedScore = savedSubmissionMap[mapped.lrn] || savedSubmissionMap[normName];
              if (savedScore) {
                mapped.testTaken = savedScore.testTaken || '';
                mapped.literalNum = savedScore.literalNum ?? '';
                mapped.inferentialNum = savedScore.inferentialNum ?? '';
                mapped.criticalNum = savedScore.criticalNum ?? '';
                mapped.totalNum = savedScore.totalNum ?? '';
                mapped.below14 = savedScore.below14 || '';
                mapped.above14 = savedScore.above14 || '';
                mapped.startingPoint = savedScore.startingPoint || '';
              }
              if (mapped.gender === 'F') females.push(mapped);
              else males.push(mapped);
            }
          });

          males.sort((a, b) => a.name.localeCompare(b.name));
          females.sort((a, b) => a.name.localeCompare(b.name));

          // Smart UI Padding: Always render at least 10 UI slots per gender section for DepEd aesthetic
          while (males.length < 10) {
            males.push(mapStudentToRow({ lrn: '', name: '', gender: 'M' }, 'M'));
          }
          while (females.length < 10) {
            females.push(mapStudentToRow({ lrn: '', name: '', gender: 'F' }, 'F'));
          }

          setMaleRows(males);
          setFemaleRows(females);
        } else {
          const emptyMales = Array.from({ length: 10 }, () => mapStudentToRow({ name: '' }, 'M'));
          const emptyFemales = Array.from({ length: 10 }, () => mapStudentToRow({ name: '' }, 'F'));

          setMaleRows(emptyMales);
          setFemaleRows(emptyFemales);
        }
      } catch (err) {
        console.warn('Live sync Phil-IRI Form error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [language]);

  // Cell editing score handler
  const handleScoreChange = (listType, index, field, value) => {
    const setter = listType === 'M' ? setMaleRows : setFemaleRows;
    setter((prev) => {
      const next = [...prev];
      const maxLimit = field === 'criticalNum' ? 6 : 7;

      let scoreVal = '';
      if (value !== '' && value !== null && value !== undefined) {
        const parsed = parseInt(value, 10);
        scoreVal = isNaN(parsed) ? '' : Math.min(maxLimit, Math.max(0, parsed));
      }

      const row = { ...next[index], [field]: scoreVal };

      const lit = row.literalNum;
      const inf = row.inferentialNum;
      const crit = row.criticalNum;

      const hasAnyScore = lit !== '' || inf !== '' || crit !== '';
      const numLit = typeof lit === 'number' ? lit : 0;
      const numInf = typeof inf === 'number' ? inf : 0;
      const numCrit = typeof crit === 'number' ? crit : 0;

      const tot = hasAnyScore ? (numLit + numInf + numCrit) : '';

      row.totalNum = tot;
      row.below14 = tot !== '' && tot < 14 ? '/' : '';
      row.above14 = tot !== '' && tot >= 14 ? '/' : '';
      const rawGrade = String(dbClassInfo.grade || '4').replace(/grade/gi, '').trim();
      row.startingPoint = tot !== '' && tot < 14 ? `Grade ${rawGrade || '4'} Oral` : (tot !== '' ? 'Exempted' : '');

      next[index] = row;
      return next;
    });
  };

  const handleTextChange = (listType, index, field, value) => {
    const setter = listType === 'M' ? setMaleRows : setFemaleRows;
    setter((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const cycleTestTaken = (listType, index) => {
    const setter = listType === 'M' ? setMaleRows : setFemaleRows;
    setter((prev) => {
      const next = [...prev];
      const current = next[index].testTaken || '';
      let updated = '';
      if (current === '') updated = '✓';
      else if (current === '✓') updated = 'X';
      else updated = '';

      next[index] = { ...next[index], testTaken: updated };
      return next;
    });
  };

  // Male & Female Summary Totals
  const maleTotals = useMemo(() => {
    const active = maleRows.filter((r) => r.name && r.name.trim() !== '');
    return {
      count: active.length,
      below14: active.filter((r) => r.below14 === '/').length,
      above14: active.filter((r) => r.above14 === '/').length,
    };
  }, [maleRows]);

  const femaleTotals = useMemo(() => {
    const active = femaleRows.filter((r) => r.name && r.name.trim() !== '');
    return {
      count: active.length,
      below14: active.filter((r) => r.below14 === '/').length,
      above14: active.filter((r) => r.above14 === '/').length,
    };
  }, [femaleRows]);

  // Export official DepEd styled .xlsx file matching the EXACT DepEd Form 1 template layout 100%
  const handleExportXLSX = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(formCode);

      // Set exact column widths matching DepEd Form 1 official template & Web UI layout (prevent text cuts)
      worksheet.columns = [
        { key: 'no', width: 6 },
        { key: 'name', width: 40 },
        { key: 'kasarian', width: 14 },
        { key: 'testTaken', width: 16 },
        { key: 'literal', width: 12 },
        { key: 'inferential', width: 22 },
        { key: 'critical', width: 12 },
        { key: 'totalMarka', width: 14 },
        { key: 'markangBelow14', width: 14 },
        { key: 'startingPoint', width: 28 },
        { key: 'markangAbove14', width: 14 },
      ];

      // Row 1: Blank
      worksheet.addRow([]);

      // Row 2: Right-aligned Form Code (Placed at index 8 [Cell I2] so merge I2:K2 displays formCode)
      const r2 = worksheet.addRow(['', '', '', '', '', '', '', '', formCode, '', '']);
      worksheet.mergeCells(`I2:K2`);
      r2.getCell(9).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF333333' } };
      r2.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };

      // Row 3: Title Header (Centered across entire table width A3:K3)
      const r3 = worksheet.addRow(['TALAAN NG PANGKATANG PAGTATASA NG KLASE (TPPK)']);
      worksheet.mergeCells('A3:K3');
      r3.getCell(1).font = { name: 'Arial', size: 12, bold: true };
      r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 4: Blank
      worksheet.addRow([]);

      // Row 5, 6, 7: Header Metadata Block with underlined inputs (matching Web UI)
      const gradeVal = String(dbClassInfo.grade || '').replace(/grade/gi, '').trim();
      const sectionVal = dbClassInfo.section || '';
      const teacherVal = dbClassInfo.teacher || '';
      const schoolVal = dbClassInfo.school || '';
      const dateVal = dbClassInfo.date || '';

      const r5 = worksheet.addRow(['', '', '', '', '', '', '', '', '', '']);
      worksheet.mergeCells('A5:B5');
      worksheet.mergeCells('C5:E5');
      worksheet.mergeCells('J5:K5');

      r5.getCell(1).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Baitang:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: gradeVal || '    ' },
        ],
      };
      r5.getCell(3).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Seksiyon:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: sectionVal || '            ' },
        ],
      };
      r5.getCell(10).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Guro:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: teacherVal || '                ' },
        ],
      };

      const r6 = worksheet.addRow(['', '', '', '', '', '', '', '', '', '']);
      worksheet.mergeCells('A6:E6');
      worksheet.mergeCells('J6:K6');

      r6.getCell(1).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Paaralan:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: schoolVal || '                        ' },
        ],
      };
      r6.getCell(10).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Petsa:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: dateVal || '              ' },
        ],
      };

      const r7 = worksheet.addRow(['']);
      worksheet.mergeCells('A7:E7');
      r7.getCell(1).value = {
        richText: [
          { font: { name: 'Arial', size: 10, bold: true }, text: 'Antas ng Pangkatang Pagtatasa:  ' },
          { font: { name: 'Arial', size: 10, bold: true, underline: true }, text: gradeVal || '    ' },
        ],
      };

      // Row 8: Blank
      worksheet.addRow([]);

      // Row 9-10: Table Header Grid Layout (Exact DepEd Template)
      const h1 = worksheet.addRow([
        '#',
        'PANGALAN',
        'KASARIAN\nM o F',
        'NAKUHA ANG PAGTATASA\n✓ o X',
        'BILANG NG TAMANG SAGOT (AYON SA URI NG TANONG)',
        '',
        '',
        'KABUUANG MARKA',
        'MARKANG < 14',
        'PANIMULANG SANGGUNIANG ANTAS',
        'MARKANG ≥ 14',
      ]);
      h1.height = 36; // Sufficient height for multi-line headers

      const h2 = worksheet.addRow([
        '',
        '',
        '',
        '',
        'LITERAL',
        'PAGHIHINUHA (INFERENTIAL)',
        'KRITIKAL',
        '',
        '',
        '',
        '',
      ]);
      h2.height = 28; // Sufficient height for multi-line subheaders

      worksheet.mergeCells('A9:A10');
      worksheet.mergeCells('B9:B10');
      worksheet.mergeCells('C9:C10');
      worksheet.mergeCells('D9:D10');
      worksheet.mergeCells('E9:G9');
      worksheet.mergeCells('H9:H10');
      worksheet.mergeCells('I9:I10');
      worksheet.mergeCells('J9:J10');
      worksheet.mergeCells('K9:K10');

      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E2E2' } };
      const col1Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };
      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF999999' } },
        left: { style: 'thin', color: { argb: 'FF999999' } },
        bottom: { style: 'thin', color: { argb: 'FF999999' } },
        right: { style: 'thin', color: { argb: 'FF999999' } },
      };

      [h1, h2].forEach((row) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.fill = (colNumber === 1 || colNumber === 8) ? col1Fill : headerFill;
          cell.font = { name: 'Arial', size: 9, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = borderThin;
        });
      });

      // Render Male Rows (Exact 10 slots)
      const renderMaleRows = [...maleRows];
      while (renderMaleRows.length < 10) {
        renderMaleRows.push({ lrn: '', name: '', gender: 'M', testTaken: '', literalNum: '', inferentialNum: '', criticalNum: '', totalNum: '', below14: '', above14: '', startingPoint: '' });
      }

      const numFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } };
      const totalColFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };

      renderMaleRows.slice(0, 10).forEach((r, i) => {
        const row = worksheet.addRow([
          i + 1,
          r.name,
          r.name ? 'M' : '',
          r.testTaken,
          r.literalNum,
          r.inferentialNum,
          r.criticalNum,
          r.totalNum,
          r.below14 === '/' ? '/' : r.below14 === '-' ? '—' : r.below14,
          r.startingPoint,
          r.above14 === '/' ? '/' : r.above14 === '-' ? '—' : r.above14,
        ]);
        row.height = 20;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = borderThin;
          cell.font = { name: 'Arial', size: 9 };

          if (colNumber === 1) {
            cell.fill = numFill;
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNumber === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else if (colNumber === 8) {
            cell.fill = totalColFill;
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Yellow Male Subtotal Row (Note: Top-left cell of E:I merge is Col E [index 4], top-left of J:K merge is Col J [index 9])
      const mSubRow = worksheet.addRow([
        'KABUUANG BILANG NG LALAKI',
        '',
        maleTotals.count,
        '',
        `Mababa sa 14:  ${maleTotals.below14}`,
        '',
        '',
        '',
        '',
        `≥ 14:  ${maleTotals.above14}`,
        ''
      ]);
      mSubRow.height = 24;

      worksheet.mergeCells(`A${mSubRow.number}:B${mSubRow.number}`);
      worksheet.mergeCells(`E${mSubRow.number}:I${mSubRow.number}`);
      worksheet.mergeCells(`J${mSubRow.number}:K${mSubRow.number}`);

      const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      mSubRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        cell.fill = yellowFill;
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.border = borderThin;
        if (colIndex === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
        else if (colIndex === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else if (colIndex === 5) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        else if (colIndex === 10) cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Render Female Rows (Exact 10 slots)
      const renderFemaleRows = [...femaleRows];
      while (renderFemaleRows.length < 10) {
        renderFemaleRows.push({ lrn: '', name: '', gender: 'F', testTaken: '', literalNum: '', inferentialNum: '', criticalNum: '', totalNum: '', below14: '', above14: '', startingPoint: '' });
      }

      renderFemaleRows.slice(0, 10).forEach((r, i) => {
        const row = worksheet.addRow([
          i + 1,
          r.name,
          r.name ? 'F' : '',
          r.testTaken,
          r.literalNum,
          r.inferentialNum,
          r.criticalNum,
          r.totalNum,
          r.below14 === '/' ? '/' : r.below14 === '-' ? '—' : r.below14,
          r.startingPoint,
          r.above14 === '/' ? '/' : r.above14 === '-' ? '—' : r.above14,
        ]);
        row.height = 20;

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = borderThin;
          cell.font = { name: 'Arial', size: 9 };

          if (colNumber === 1) {
            cell.fill = numFill;
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNumber === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else if (colNumber === 8) {
            cell.fill = totalColFill;
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Yellow Female Subtotal Row
      const fSubRow = worksheet.addRow([
        'KABUUANG BILANG NG BABAE',
        '',
        femaleTotals.count,
        '',
        `Mababa sa 14:  ${femaleTotals.below14}`,
        '',
        '',
        '',
        '',
        `≥ 14:  ${femaleTotals.above14}`,
        ''
      ]);
      fSubRow.height = 24;

      worksheet.mergeCells(`A${fSubRow.number}:B${fSubRow.number}`);
      worksheet.mergeCells(`E${fSubRow.number}:I${fSubRow.number}`);
      worksheet.mergeCells(`J${fSubRow.number}:K${fSubRow.number}`);

      fSubRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        cell.fill = yellowFill;
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.border = borderThin;
        if (colIndex === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
        else if (colIndex === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else if (colIndex === 5) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        else if (colIndex === 10) cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Green Class Grand Total Row
      const grandTotalCount = maleTotals.count + femaleTotals.count;
      const grandBelow14 = maleTotals.below14 + femaleTotals.below14;
      const grandAbove14 = maleTotals.above14 + femaleTotals.above14;

      const gRow = worksheet.addRow([
        'KABUUANG BILANG NG KLASE (GRAND TOTAL)',
        '',
        grandTotalCount,
        '',
        `Kabuuan < 14:  ${grandBelow14}`,
        '',
        '',
        '',
        '',
        `Kabuuan ≥ 14:  ${grandAbove14}`,
        ''
      ]);
      gRow.height = 24;

      worksheet.mergeCells(`A${gRow.number}:B${gRow.number}`);
      worksheet.mergeCells(`E${gRow.number}:I${gRow.number}`);
      worksheet.mergeCells(`J${gRow.number}:K${gRow.number}`);

      const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF107C41' } };
      gRow.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        cell.fill = greenFill;
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = borderThin;
        if (colIndex === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
        else if (colIndex === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else if (colIndex === 5) cell.alignment = { horizontal: 'right', vertical: 'middle' };
        else if (colIndex === 10) cell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Footnote (Merged across full width A:K)
      worksheet.addRow([]);
      const noteRow = worksheet.addRow(['*Ang mag-aaral na nagtamo ng kabuuang marka na ≥ 14/20 ay hindi na kailangang kumuha ng Phil-IRI.']);
      worksheet.mergeCells(`A${noteRow.number}:K${noteRow.number}`);
      noteRow.height = 20;
      noteRow.getCell(1).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF555555' } };
      noteRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      // Signatures Block (Centered nicely under the table)
      worksheet.addRow([]);
      worksheet.addRow([]);

      const s1 = worksheet.addRow(['', 'Binigyang-pansin:', dbClassInfo.principalName || '', '', '', 'Inihanda ni:', dbClassInfo.teacher || '', '', '', '', '']);
      s1.height = 22;
      worksheet.mergeCells(`B${s1.number}:B${s1.number}`);
      worksheet.mergeCells(`C${s1.number}:D${s1.number}`);
      worksheet.mergeCells(`F${s1.number}:F${s1.number}`);
      worksheet.mergeCells(`G${s1.number}:J${s1.number}`);

      s1.getCell(2).font = { name: 'Arial', size: 9 };
      s1.getCell(2).alignment = { horizontal: 'right', vertical: 'bottom' };

      s1.getCell(3).font = { name: 'Arial', size: 10, bold: true };
      s1.getCell(3).alignment = { horizontal: 'center', vertical: 'bottom' };
      s1.getCell(3).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      s1.getCell(4).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };

      s1.getCell(6).font = { name: 'Arial', size: 9 };
      s1.getCell(6).alignment = { horizontal: 'right', vertical: 'bottom' };

      s1.getCell(7).font = { name: 'Arial', size: 10, bold: true };
      s1.getCell(7).alignment = { horizontal: 'center', vertical: 'bottom' };
      s1.getCell(7).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      s1.getCell(8).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      s1.getCell(9).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      s1.getCell(10).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };

      const s2 = worksheet.addRow(['', '', 'Punong-guro', '', '', '', 'Guro / Tagapayo', '', '', '', '']);
      s2.height = 20;
      worksheet.mergeCells(`C${s2.number}:D${s2.number}`);
      worksheet.mergeCells(`G${s2.number}:J${s2.number}`);
      s2.font = { name: 'Arial', size: 9, bold: true };
      s2.getCell(3).alignment = { horizontal: 'center', vertical: 'top' };
      s2.getCell(7).alignment = { horizontal: 'center', vertical: 'top' };

      // Write to Buffer & Trigger Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formCode}_${dbClassInfo.section || 'Record'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      triggerToast(`Downloaded Exact DepEd Template ${formCode} (.XLSX)!`);
    } catch (err) {
      console.error('Failed to export styled Excel file:', err);
      triggerToast('Failed to export Excel file.', 'error');
    }
  };

  // Save GST submission to backend database (Option B)
  const handleSaveRecord = async () => {
    try {
      const token = getToken();
      const currentLang = isTagalog ? 'Tagalog' : 'English';
      const above14Count = maleTotals.above14 + femaleTotals.above14;
      const below14Count = maleTotals.below14 + femaleTotals.below14;
      const totalAssessed = maleTotals.count + femaleTotals.count;

      // Filter out empty UI padding rows so only actual student score records are stored in DB
      const cleanMaleRows = maleRows.filter((r) => r.name && r.name.trim() !== '');
      const cleanFemaleRows = femaleRows.filter((r) => r.name && r.name.trim() !== '');

      const payload = {
        sectionName: dbClassInfo.section || 'Unassigned',
        gradeLevel: dbClassInfo.grade || 'Grade 4',
        language: currentLang,
        formCode,
        formData: {
          maleRows: cleanMaleRows,
          femaleRows: cleanFemaleRows,
        },
        above14Count,
        below14Count,
        totalAssessed,
      };

      const res = await fetch(getApiUrl('/api/teacher/phil-iri/gst-submission'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Invalidate Form 1 & Form 2 cache so updated scores reflect immediately
        cacheService.invalidate('form1_');
        cacheService.invalidate('form2_');
        triggerToast(`${formCode} saved to database successfully!`, 'success');
      } else {
        triggerToast(data.error || 'Failed to save GST form records.', 'error');
      }
    } catch (err) {
      console.error('Save GST Form Error:', err);
      triggerToast('Network error saving records.', 'error');
    }
  };

  if (isLoading) {
    return <PhilIriForm1Skeleton rows={8} />;
  }

  return (
    <div className="relative font-sans text-xs">
      {/* System Shared Toast Notification */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Action Bar for Exporting and Saving */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">
          {formCode} - {formTitle}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs"
          >
            <DownloadSimple size={15} weight="bold" className="text-[#107c41]" />
            <span>Export .XLSX</span>
          </button>
          <button
            type="button"
            onClick={handleSaveRecord}
            className="flex items-center gap-1.5 rounded-lg bg-[#107c41] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0b542c] transition-colors cursor-pointer shadow-xs"
          >
            <FloppyDisk size={15} weight="bold" />
            <span>Save Record</span>
          </button>
        </div>
      </div>

      {/* ── CLEAN OFFICIAL DEPED FORM TABLE UI ── */}
      <div className="overflow-x-auto rounded-lg border border-ink/20 bg-white p-6 shadow-xs">
        <div className="min-w-[1000px]">
          {/* Sheet Header Information */}
          <div className="text-center space-y-0.5 mb-4">
            <p className="text-right text-[11px] font-bold text-ink/70">{formCode}</p>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">{formTitle}</h2>
          </div>

          {/* Form Header Information Grid */}
          <div className="space-y-1.5 text-xs text-ink font-semibold mb-4 px-1">
            {/* Row 1: Grade/Baitang, Section/Seksiyon | Teacher/Guro */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                <div className="flex items-center">
                  <span>{isTagalog ? 'Baitang:' : 'Grade:'}</span>
                  <strong className="border-b border-ink font-bold px-3 ml-1 text-center inline-block min-w-[40px]">
                    {String(dbClassInfo.grade || '').replace(/grade/gi, '').trim() || '\u00A0'}
                  </strong>
                </div>
                <div className="flex items-center">
                  <span>{isTagalog ? 'Seksiyon:' : 'Section:'}</span>
                  <strong className="border-b border-ink font-bold px-4 ml-1 text-center inline-block min-w-[120px]">
                    {dbClassInfo.section || '\u00A0'}
                  </strong>
                </div>
              </div>
              <div className="flex items-center">
                <span>{isTagalog ? 'Guro:' : 'Teacher:'}</span>
                <strong className="border-b border-ink font-bold px-4 ml-1 text-center inline-block min-w-[160px]">
                  {dbClassInfo.teacher || '\u00A0'}
                </strong>
              </div>
            </div>

            {/* Row 2: School/Paaralan */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span>{isTagalog ? 'Paaralan:' : 'School:'}</span>
                <strong className="border-b border-ink font-bold px-4 ml-1 inline-block min-w-[240px]">
                  {dbClassInfo.school || '\u00A0'}
                </strong>
              </div>
            </div>

            {/* Row 3: Screening Test Level/Antas ng Pangkatang Pagtatasa | Date/Petsa */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span>{isTagalog ? 'Antas ng Pangkatang Pagtatasa:' : 'Screening Test Level:'}</span>
                <strong className="border-b border-ink font-bold px-3 ml-1 text-center inline-block min-w-[40px]">
                  {String(dbClassInfo.grade || '').replace(/grade/gi, '').trim() || '\u00A0'}
                </strong>
              </div>
              <div className="flex items-center">
                <span>{isTagalog ? 'Petsa:' : 'Date:'}</span>
                <strong className="border-b border-ink font-bold px-4 ml-1 text-center inline-block min-w-[140px]">
                  {dbClassInfo.date || '\u00A0'}
                </strong>
              </div>
            </div>
          </div>

          {/* Clean Form Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs font-sans border border-gray-400">
              <thead>
                {/* Column Headers */}
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th rowSpan={2} className="w-11 min-w-[40px] border border-gray-400 p-2 bg-[#d4d4d4]">#</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-left w-[26%]">{isTagalog ? 'Pangalan' : 'NAME'}</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[7%]">{isTagalog ? 'Kasarian' : 'Gender'}<br/><span className="text-[10px] font-normal">{isTagalog ? 'M o F' : 'M or F'}</span></th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">{isTagalog ? 'Nakuha ang pagtatasa' : 'TEST TAKEN'}<br/><span className="text-[10px] font-normal">{isTagalog ? '✓ o X' : '✓ or X'}</span></th>
                  <th colSpan={3} className="border border-gray-400 p-1.5">{isTagalog ? 'Bilang ng Tamang Sagot (Ayon sa Uri ng Tanong)' : 'NUMBER OF CORRECT RESPONSES'}</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[9%] bg-[#d4d4d4] text-gray-900">{isTagalog ? 'Kabuuang Marka' : 'TOTAL SCORE'}</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">{isTagalog ? 'Markang < 14' : 'SCORE < 14'}</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[15%]">{isTagalog ? 'Panimulang Sangguniang Antas' : 'STARTING POINT OF GRADED PASSAGE'}</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 w-[8%]">{isTagalog ? 'Markang ≥ 14' : 'SCORE ≥ 14'}</th>
                </tr>
                <tr className="bg-[#e2e2e2] font-bold text-gray-900 uppercase border border-gray-400">
                  <th className="border border-gray-400 p-1.5 w-[7%] text-[10px]">{isTagalog ? 'Literal' : 'LITERAL'}</th>
                  <th className="border border-gray-400 p-1.5 w-[7%] text-[10px]">{isTagalog ? 'Paghihinuha (Inferential)' : 'INFERENTIAL'}</th>
                  <th className="border border-gray-400 p-1.5 w-[7%] text-[10px]">{isTagalog ? 'Kritikal' : 'CRITICAL'}</th>
                </tr>
              </thead>
              <tbody>
                {/* ── MALE LEARNERS SECTION ── */}
                {maleRows.map((row, i) => {
                  const rowNum = i + 1;

                  return (
                    <tr key={`M-${i}`} className="hover:bg-[#f5faf6] transition-colors">
                      <td className="border border-gray-400 p-1 font-mono text-gray-800 bg-[#d4d4d4] font-semibold">{rowNum}</td>
                      <td
                        onClick={() => setActiveCell(`B${10 + rowNum}`)}
                        className={`relative border border-gray-400 p-1 text-left bg-[#eaeaea] ${
                          activeCell === `B${10 + rowNum}` ? 'bg-white' : ''
                        }`}
                      >
                        {activeCell === `B${10 + rowNum}` && (
                          <div className="absolute -inset-[1px] border-2 border-[#107c41] pointer-events-none z-10" />
                        )}
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleTextChange('M', i, 'name', e.target.value)}
                          className="w-full bg-transparent font-semibold text-gray-900 outline-none text-xs relative z-0"
                        />
                      </td>
                      <td className="border border-gray-400 p-1 font-bold text-gray-800">{row.name ? 'M' : ''}</td>
                      <td className="border border-gray-400 p-1 text-center font-bold">
                        {row.name ? (
                          <button
                            type="button"
                            onClick={() => cycleTestTaken('M', i)}
                            className="w-full text-center font-bold text-xs hover:bg-[#d8d8d8] py-0.5 rounded transition-colors cursor-pointer outline-none select-none"
                            title="Click to toggle (✓ / X / Blank)"
                          >
                            {row.testTaken ? (
                              <span className="text-gray-900 font-bold">{row.testTaken}</span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </button>
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={row.literalNum}
                            onChange={(e) => handleScoreChange('M', i, 'literalNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={row.inferentialNum}
                            onChange={(e) => handleScoreChange('M', i, 'inferentialNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={6}
                            value={row.criticalNum}
                            onChange={(e) => handleScoreChange('M', i, 'criticalNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1 font-extrabold text-gray-900 bg-[#eaeaea]">
                        {row.name ? row.totalNum : ''}
                      </td>
                      <td className="border border-gray-400 p-1 font-extrabold text-amber-800">{row.name ? (row.below14 || '—') : ''}</td>
                      <td className="border border-gray-400 p-1 font-medium text-gray-800">{row.name ? row.startingPoint : ''}</td>
                      <td className="border border-gray-400 p-1 font-extrabold text-emerald-800">{row.name ? (row.above14 || '—') : ''}</td>
                    </tr>
                  );
                })}

                {/* Male Summary Yellow Highlight Bar */}
                <tr className="bg-[#fef08a] font-extrabold text-gray-900 text-xs">
                  <td colSpan={2} className="border border-gray-400 p-2 text-left tracking-wide">
                    {isTagalog ? 'KABUUANG BILANG NG LALAKI' : 'TOTAL NUMBER OF MALE'}
                  </td>
                  <td className="border border-gray-400 p-2 text-center text-gray-900 font-mono text-sm">{maleTotals.count}</td>
                  <td className="border border-gray-400 p-2 bg-[#fef08a]"></td>
                  <td colSpan={5} className="border border-gray-400 p-2 text-right">
                    <span>{isTagalog ? 'Mababa sa 14:' : 'Below 14:'} <strong className="text-amber-900 font-mono text-sm ml-1">{maleTotals.below14}</strong></span>
                  </td>
                  <td colSpan={2} className="border border-gray-400 p-2 text-right">
                    <span>&ge; 14: <strong className="text-emerald-900 font-mono text-sm ml-1">{maleTotals.above14}</strong></span>
                  </td>
                </tr>

                {/* ── FEMALE LEARNERS SECTION ── */}
                {femaleRows.map((row, i) => {
                  const rowNum = i + 1;

                  return (
                    <tr key={`F-${i}`} className="hover:bg-[#f5faf6] transition-colors">
                      <td className="border border-gray-400 p-1 font-mono text-gray-800 bg-[#d4d4d4] font-semibold">{rowNum}</td>
                      <td
                        onClick={() => setActiveCell(`B${42 + rowNum}`)}
                        className={`relative border border-gray-400 p-1 text-left bg-[#eaeaea] ${
                          activeCell === `B${42 + rowNum}` ? 'bg-white' : ''
                        }`}
                      >
                        {activeCell === `B${42 + rowNum}` && (
                          <div className="absolute -inset-[1px] border-2 border-[#107c41] pointer-events-none z-10" />
                        )}
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleTextChange('F', i, 'name', e.target.value)}
                          className="w-full bg-transparent font-semibold text-gray-900 outline-none text-xs relative z-0"
                        />
                      </td>
                      <td className="border border-gray-400 p-1 font-bold text-gray-800">{row.name ? 'F' : ''}</td>
                      <td className="border border-gray-400 p-1 text-center font-bold">
                        {row.name ? (
                          <button
                            type="button"
                            onClick={() => cycleTestTaken('F', i)}
                            className="w-full text-center font-bold text-xs hover:bg-[#d8d8d8] py-0.5 rounded transition-colors cursor-pointer outline-none select-none"
                            title="Click to toggle (✓ / X / Blank)"
                          >
                            {row.testTaken ? (
                              <span className="text-gray-900 font-bold">{row.testTaken}</span>
                            ) : (
                              <span className="text-gray-400 font-normal">—</span>
                            )}
                          </button>
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={row.literalNum}
                            onChange={(e) => handleScoreChange('F', i, 'literalNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={row.inferentialNum}
                            onChange={(e) => handleScoreChange('F', i, 'inferentialNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1">
                        {row.name ? (
                          <input
                            type="number"
                            min={0}
                            max={6}
                            value={row.criticalNum}
                            onChange={(e) => handleScoreChange('F', i, 'criticalNum', e.target.value)}
                            className="w-full text-center pl-3 bg-transparent font-bold text-gray-900 outline-none text-xs"
                          />
                        ) : ''}
                      </td>
                      <td className="border border-gray-400 p-1 font-extrabold text-gray-900 bg-[#eaeaea]">
                        {row.name ? row.totalNum : ''}
                      </td>
                      <td className="border border-gray-400 p-1 font-extrabold text-amber-800">{row.name ? (row.below14 || '—') : ''}</td>
                      <td className="border border-gray-400 p-1 font-medium text-gray-800">{row.name ? row.startingPoint : ''}</td>
                      <td className="border border-gray-400 p-1 font-extrabold text-emerald-800">{row.name ? (row.above14 || '—') : ''}</td>
                    </tr>
                  );
                })}

                {/* Female Summary Yellow Highlight Bar */}
                <tr className="bg-[#fef08a] font-extrabold text-gray-900 text-xs">
                  <td colSpan={2} className="border border-gray-400 p-2 text-left tracking-wide">
                    {isTagalog ? 'KABUUANG BILANG NG BABAE' : 'TOTAL NUMBER OF FEMALE'}
                  </td>
                  <td className="border border-gray-400 p-2 text-center text-gray-900 font-mono text-sm">{femaleTotals.count}</td>
                  <td className="border border-gray-400 p-2 bg-[#fef08a]"></td>
                  <td colSpan={5} className="border border-gray-400 p-2 text-right">
                    <span>{isTagalog ? 'Mababa sa 14:' : 'Below 14:'} <strong className="text-amber-900 font-mono text-sm ml-1">{femaleTotals.below14}</strong></span>
                  </td>
                  <td colSpan={2} className="border border-gray-400 p-2 text-right">
                    <span>&ge; 14: <strong className="text-emerald-900 font-mono text-sm ml-1">{femaleTotals.above14}</strong></span>
                  </td>
                </tr>

                {/* Class Combined Grand Total Summary Bar */}
                <tr className="bg-[#107c41] text-white font-extrabold text-xs">
                  <td colSpan={2} className="p-2.5 text-left uppercase tracking-wider">
                    {isTagalog ? 'KABUUANG BILANG NG KLASE (GRAND TOTAL)' : 'COMBINED CLASS GRAND TOTAL'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-sm">{maleTotals.count + femaleTotals.count}</td>
                  <td className="p-2.5 bg-[#107c41]"></td>
                  <td colSpan={5} className="p-2.5 text-right">
                    <span>{isTagalog ? 'Kabuuan < 14:' : 'Total < 14:'} <strong className="text-amber-200 font-mono text-sm ml-1">{maleTotals.below14 + femaleTotals.below14}</strong></span>
                  </td>
                  <td colSpan={2} className="p-2.5 text-right">
                    <span>{isTagalog ? 'Kabuuan \u2265 14:' : 'Total \u2265 14:'} <strong className="text-emerald-200 font-mono text-sm ml-1">{maleTotals.above14 + femaleTotals.above14}</strong></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Note & Official DepEd Signatures Section */}
          <div className="mt-6 text-xs text-ink font-semibold px-1 pb-10">
            <p className="italic text-ink/80 mb-10">
              {isTagalog
                ? '*Ang mag-aaral na nagtamo ng kabuuang marka na \u2265 14/20 ay hindi na kailangang kumuha ng Phil-IRI.'
                : '*Students with a total score of \u2265 14/20 need not to take the PHIL-IRI.'}
            </p>

            <div className="mt-10 pt-4 flex justify-between items-end text-xs px-8 max-w-5xl mx-auto">
              {/* Left Side: Noted / School Principal */}
              <div className="flex items-end gap-3">
                <span className="text-ink/70 font-normal pb-5">{isTagalog ? 'Binigyang-pansin:' : 'Noted:'}</span>
                <div className="flex flex-col items-center">
                  <div className="w-56 border-b border-ink font-bold text-center pb-0.5 text-ink">
                    {dbClassInfo.principalName || '\u00A0'}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-ink/80">{isTagalog ? 'Punong-guro' : 'School Principal'}</p>
                </div>
              </div>

              {/* Right Side: Prepared / Adviser (Teacher) */}
              <div className="flex items-end gap-3">
                <span className="text-ink/70 font-normal pb-5">{isTagalog ? 'Inihanda ni:' : 'Prepared:'}</span>
                <div className="flex flex-col items-center">
                  <div className="w-56 border-b border-ink font-bold text-center pb-0.5 text-ink">
                    {dbClassInfo.teacher || '\u00A0'}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-ink/80">{isTagalog ? 'Guro / Tagapayo' : 'Adviser'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
