import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, DownloadSimple, FloppyDisk } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { PhilIriForm4DetailSkeleton, SkeletonBlock } from '../../../components/common/Skeleton.jsx';
import { cacheService } from '../../../services/cacheService.js';
import { getToken } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';
import { jsPDF } from 'jspdf';

const FORM4_LEVELS = [
  { code: 'I', label: 'Grade 1' },
  { code: 'II', label: 'Grade 2' },
  { code: 'III', label: 'Grade 3' },
  { code: 'IV', label: 'Grade 4' },
  { code: 'V', label: 'Grade 5' },
  { code: 'VI', label: 'Grade 6' },
  { code: 'VII', label: 'Grade 7' },
];

const DEFAULT_OBSERVATIONS = [
  { behavior: 'Does word-by-word reading', behaviorFilipino: 'Nagbabasa nang pa-isa isang salita', result: '' },
  { behavior: 'Lacks expression; reads in a monotonous tone', behaviorFilipino: 'Walang damdamin; walang pagbabago ang tono', result: '' },
  { behavior: 'Voice is hardly audible', behaviorFilipino: 'Hindi madaling marinig ang boses', result: '' },
  { behavior: 'Disregards punctuation', behaviorFilipino: 'Hindi pinanpansin ang mga bantas', result: '' },
  { behavior: 'Points to each word with his/her finger', behaviorFilipino: 'Itinuturo ang bawat salita', result: '' },
  { behavior: 'Employs little or no method of analysis', behaviorFilipino: 'Bahagya o walang paraan ng pagsusuri', result: '' },
  { behavior: 'Other observations:', behaviorFilipino: 'Ibang Puna', result: '' },
];

const extractSetLetter = (rawSet) => {
  if (!rawSet) return '';
  const str = String(rawSet).toUpperCase().trim();
  const match = str.match(/[A-D]/);
  return match ? match[0] : str;
};

const normalizeGradeLevel = (rawLevel) => {
  if (!rawLevel) return '';
  const str = String(rawLevel).trim();
  if (str === '1' || str.toLowerCase().includes('grade 1') || str === 'I') return 'I';
  if (str === '2' || str.toLowerCase().includes('grade 2') || str === 'II') return 'II';
  if (str === '3' || str.toLowerCase().includes('grade 3') || str === 'III') return 'III';
  if (str === '4' || str.toLowerCase().includes('grade 4') || str === 'IV') return 'IV';
  if (str === '5' || str.toLowerCase().includes('grade 5') || str === 'V') return 'V';
  if (str === '6' || str.toLowerCase().includes('grade 6') || str === 'VI') return 'VI';
  if (str === '7' || str.toLowerCase().includes('grade 7') || str === 'VII') return 'VII';
  return str;
};

function LevelMark({ active }) {
  return active ? (
    <Check size={16} weight="bold" className="mx-auto text-[#107c41]" />
  ) : (
    <span className="block text-gray-300">-</span>
  );
}

export default function PhilIriForm4Detail() {
  const { lrn: rawLrn } = useParams();
  const cacheKey = `phil_iri_form4_${rawLrn}`;

  const [student, setStudent] = useState({ name: '—', lrn: rawLrn, grade: '—', section: '—', school: '—', teacher: '—' });
  const [loading, setLoading] = useState(true);

  // 4 ISR Modes: 'pre_fil', 'post_fil', 'pre_en', 'post_en'
  const [selectedMode, setSelectedMode] = useState('pre_fil');
  const [filAttempts, setFilAttempts] = useState([]);
  const [enAttempts, setEnAttempts] = useState([]);

  // Editable Observation Checklist state per mode
  const [checklistByMode, setChecklistByMode] = useState({});

  // Editable L/I/C scores per mode, per level
  const [licByMode, setLicByMode] = useState({});

  const [toastMsg, setToastMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved checklist + L/I/C from localStorage, Cache, and Database
  useEffect(() => {
    // 1. Read from client-side cacheService first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      if (cached.student) setStudent(cached.student);
      if (cached.filAttempts) setFilAttempts(cached.filAttempts);
      if (cached.enAttempts) setEnAttempts(cached.enAttempts);
      if (cached.checklistByMode) setChecklistByMode(cached.checklistByMode);
      if (cached.licByMode) setLicByMode(cached.licByMode);
      setLoading(false);
    }

    // 2. Read local backup from localStorage
    try {
      const savedChecklist = localStorage.getItem(`phil_iri_form4_checklist_${rawLrn}`);
      if (savedChecklist && (!cached || !cached.checklistByMode)) setChecklistByMode(JSON.parse(savedChecklist));
    } catch (e) {
      console.warn('Could not parse saved Form 4 checklist:', e);
    }
    try {
      const savedLic = localStorage.getItem(`phil_iri_form4_lic_${rawLrn}`);
      if (savedLic && (!cached || !cached.licByMode)) setLicByMode(JSON.parse(savedLic));
    } catch (e) {
      console.warn('Could not parse saved Form 4 L/I/C:', e);
    }

    // 3. Fetch fresh student data, attempts & saved submissions from server
    const fetchAllData = async () => {
      try {
        if (!cached) setLoading(true);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [filRes, enRes, subRes] = await Promise.all([
          fetch(getApiUrl(`/api/teacher/phil-iri/form3-attempts/${encodeURIComponent(rawLrn)}?language=fil`), { headers }),
          fetch(getApiUrl(`/api/teacher/phil-iri/form3-attempts/${encodeURIComponent(rawLrn)}?language=en`), { headers }),
          fetch(getApiUrl(`/api/teacher/phil-iri/form4-submission/${encodeURIComponent(rawLrn)}`), { headers }),
        ]);

        const filData = await filRes.json();
        const enData = await enRes.json();
        const subData = await subRes.json();

        let currentStudent = student;
        let currentFil = [];
        let currentEn = [];
        let currentChecklist = checklistByMode;
        let currentLic = licByMode;

        if (filRes.ok && filData.success && filData.student) {
          currentStudent = filData.student;
          currentFil = filData.attempts || [];
          setStudent(currentStudent);
          setFilAttempts(currentFil);
        } else if (enRes.ok && enData.success && enData.student) {
          currentStudent = enData.student;
          setStudent(currentStudent);
        }

        if (enRes.ok && enData.success) {
          currentEn = enData.attempts || [];
          setEnAttempts(currentEn);
        }

        if (subRes.ok && subData.success && subData.submission) {
          if (subData.submission.checklistByMode && Object.keys(subData.submission.checklistByMode).length > 0) {
            currentChecklist = subData.submission.checklistByMode;
            setChecklistByMode(currentChecklist);
          }
          if (subData.submission.licByMode && Object.keys(subData.submission.licByMode).length > 0) {
            currentLic = subData.submission.licByMode;
            setLicByMode(currentLic);
          }
        }

        // Cache fresh data for 5 minutes (300000ms)
        cacheService.set(cacheKey, {
          student: currentStudent,
          filAttempts: currentFil,
          enAttempts: currentEn,
          checklistByMode: currentChecklist,
          licByMode: currentLic,
        }, 300000);
      } catch (err) {
        console.warn('Error fetching Form 4 details from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [rawLrn]);

  const triggerToast = (msg, type = 'success') => {
    setToastMsg({ text: msg, type });
  };

  const currentObservationChecklist = checklistByMode[selectedMode] || DEFAULT_OBSERVATIONS;

  const handleChecklistChange = (index, newResult) => {
    setChecklistByMode((prev) => {
      const modeList = [...(prev[selectedMode] || DEFAULT_OBSERVATIONS)];
      modeList[index] = { ...modeList[index], result: newResult };
      return { ...prev, [selectedMode]: modeList };
    });
  };

  const handleLicChange = (levelCode, field, value) => {
    setLicByMode((prev) => ({
      ...prev,
      [selectedMode]: {
        ...(prev[selectedMode] || {}),
        [levelCode]: {
          l: '', i: '', c: '',
          ...(prev[selectedMode]?.[levelCode] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Save locally as immediate backup
      localStorage.setItem(`phil_iri_form4_checklist_${rawLrn}`, JSON.stringify(checklistByMode));
      localStorage.setItem(`phil_iri_form4_lic_${rawLrn}`, JSON.stringify(licByMode));

      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(getApiUrl('/api/teacher/phil-iri/form4-submission'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lrn: rawLrn,
          checklistByMode,
          licByMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update cache with newly saved submission
        cacheService.set(cacheKey, {
          student,
          filAttempts,
          enAttempts,
          checklistByMode,
          licByMode,
        }, 300000);
        triggerToast('Form 4 record saved to database successfully!', 'success');
      } else {
        triggerToast(data.error || 'Saved locally, but failed to sync to database.', 'error');
      }
    } catch (e) {
      console.error('Error saving Form 4 record to database:', e);
      triggerToast('Saved locally, but server request failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine active attempts & language derived from selectedMode
  const isEnglishMode = selectedMode.endsWith('_en');
  const isPostMode = selectedMode.startsWith('post');
  const activeAttemptsPool = isEnglishMode ? enAttempts : filAttempts;

  // Filter pool by pre-test vs post-test
  const currentAttempts = activeAttemptsPool.filter((att) => {
    const period = (att.assessment_period || '').toLowerCase();
    if (period.includes('post') || period.includes('panapos')) {
      return isPostMode;
    }
    if (period.includes('pre') || period.includes('panimula')) {
      return !isPostMode;
    }
    // If period is unspecified, default all to pre-test unless post-test selected
    return !isPostMode;
  });

  // Map attempts to level codes (I to VII)
  const levelMap = {};
  currentAttempts.forEach((att) => {
    const normCode = normalizeGradeLevel(att.passage_grade_level);
    const wrScore = Number(att.accuracy_percentage || 0);
    const wrLevel = wrScore >= 97 ? 'Independent' : wrScore >= 90 ? 'Instructional' : 'Frustration';
    const answers = att.answers || [];
    const totalItems = Number(
      answers.length > 0
        ? answers.length
        : (att.comprehension_total_items || 8)
    );
    const compScore = Number(att.comprehension_raw_score ?? att.comprehension_score ?? 0);
    const compPct = att.comprehension_percentage ?? (totalItems > 0 ? Math.round((compScore / totalItems) * 100) : 0);
    const compLevel = att.comprehension_level || (compPct >= 80 ? 'Independent' : compPct >= 59 ? 'Instructional' : 'Frustration');
    const dStr = att.completed_at ? att.completed_at.split('T')[0] : (att.created_at ? att.created_at.split('T')[0] : '');

    // Positional Phil-IRI split: L = first 3, C = last 2, I = middle
    const litTotal = Math.min(3, totalItems);
    const critTotal = Math.max(0, Math.min(2, totalItems - litTotal));
    const infTotal = Math.max(0, totalItems - litTotal - critTotal);

    let literalCount = 0, inferentialCount = 0, criticalCount = 0;
    answers.forEach((ans, idx) => {
      if (!ans.is_correct) return;
      if (idx < litTotal) literalCount++;
      else if (idx < litTotal + infTotal) inferentialCount++;
      else criticalCount++;
    });

    levelMap[normCode] = {
      set: att.passage_set || 'A',
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
      answers,
      compScore,
      totalItems,
      compPct,
      compLevel,
      literalCount,
      inferentialCount,
      criticalCount,
      literalTotal: litTotal,
      inferentialTotal: infTotal,
      criticalTotal: critTotal,
    };
  });

  const usedSets = new Set();
  currentAttempts.forEach((att) => {
    const letter = extractSetLetter(att.passage_set);
    if (letter) usedSets.add(letter);
  });
  Object.values(levelMap).forEach((lvlData) => {
    if (lvlData?.set) {
      const letter = extractSetLetter(lvlData.set);
      if (letter) usedSets.add(letter);
    }
  });

  // Starting level (*) is determined by the grade level of the student's earliest oral reading attempt (placed via GST). If no attempt exists, set to null.
  const firstAttempt = currentAttempts.length > 0 ? currentAttempts[0] : (activeAttemptsPool.length > 0 ? activeAttemptsPool[0] : null);
  const startingLevelCode = firstAttempt ? normalizeGradeLevel(firstAttempt.passage_grade_level) : null;

  const getModeLabel = (modeKey) => {
    switch (modeKey) {
      case 'pre_fil': return 'Filipino - Pre-Test (Panimulang Pagtatasa)';
      case 'post_fil': return 'Filipino - Post-Test (Panapos na Pagtatasa)';
      case 'pre_en': return 'English - Pre-Test';
      case 'post_en': return 'English - Post-Test';
      default: return '';
    }
  };

  const handleDownloadPDF = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const margin = 8;
      const contentWidth = pageWidth - margin * 2; // 194mm

      const borderCol = [160, 160, 160];

      const drawVectorCheckmark = (pdf, cx, cy, size = 2.5, color = [16, 124, 65], strokeWidth = 0.38) => {
        pdf.setDrawColor(...color);
        pdf.setLineWidth(strokeWidth);
        pdf.setLineCap('round');
        pdf.setLineJoin('round');
        const p1x = cx - size * 0.32;
        const p1y = cy;
        const p2x = cx - size * 0.08;
        const p2y = cy + size * 0.32;
        const p3x = cx + size * 0.36;
        const p3y = cy - size * 0.36;
        pdf.line(p1x, p1y, p2x, p2y);
        pdf.line(p2x, p2y, p3x, p3y);
        pdf.setLineCap('butt');
        pdf.setLineJoin('miter');
      };

      const drawCell = (left, top, width, height, text = '', options = {}) => {
        if (options.fill) {
          pdf.setFillColor(...options.fill);
          pdf.rect(left, top, width, height, 'F');
        }
        pdf.setDrawColor(...borderCol);
        pdf.setLineWidth(0.2);
        pdf.rect(left, top, width, height);

        if (text === '✓') {
          const color = options.textColor || [16, 124, 65];
          drawVectorCheckmark(pdf, left + width / 2, top + height / 2 + 0.1, (options.size || 6.5) * 0.42, color, 0.38);
          return;
        }

        pdf.setTextColor(...(options.textColor || [30, 30, 30]));
        pdf.setFont('helvetica', options.italic ? 'italic' : options.bold ? 'bold' : 'normal');
        pdf.setFontSize(options.size || 6.5);
        if (text !== '' && text !== null && text !== undefined) {
          const lines = pdf.splitTextToSize(String(text), Math.max(2, width - 2));
          const lineHeight = (options.size || 6.5) * 0.42;
          const startY = top + (height - lines.length * lineHeight) / 2 + lineHeight * 0.75;
          lines.forEach((line, idx) => {
            const align = options.align || 'center';
            const textX = align === 'left' ? left + 1.8 : align === 'right' ? left + width - 1.8 : left + width / 2;
            pdf.text(line, textX, startY + idx * lineHeight, { align });
          });
        }
      };

      const drawCheckbox = (x, y, checked, size = 3.2) => {
        // Clean square checkbox border
        pdf.setDrawColor(17, 24, 39);
        pdf.setLineWidth(0.2);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, size, size, 'FD');
        if (checked) {
          // Typical crisp continuous checkmark inside checkbox
          drawVectorCheckmark(pdf, x + size / 2, y + size / 2 + 0.1, size * 0.7, [17, 24, 39], 0.38);
        }
      };

      const drawDividerLine = (yPos) => {
        // Form rules use the same thin black stroke as the web layout.
        pdf.setDrawColor(17, 24, 39);
        pdf.setLineWidth(0.12);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
      };

      // ── FORM HEADER ──
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(75, 85, 99);
      pdf.text('PHIL-IRI FORM 4', pageWidth - margin, 9, { align: 'right' });

      pdf.setFontSize(9.5);
      pdf.setTextColor(17, 24, 39);
      pdf.text('INDIVIDUAL SUMMARY RECORD (ISR) /', pageWidth / 2, 14, { align: 'center' });
      pdf.text('TALAAN NG INDIBIDWAL NA PAGBASA (TIP)', pageWidth / 2, 18.5, { align: 'center' });

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 124, 65);
      pdf.text(getModeLabel(selectedMode).toUpperCase(), pageWidth / 2, 23.5, { align: 'center' });

      // Student Info Lines
      pdf.setFontSize(7);
      pdf.setTextColor(30, 30, 30);
      const yL1 = 30.5;
      const yL2 = 36;
      const yL3 = 41.5;

      // Line 1: Name, Age, Grade/Section
      // Match the web form grid: 6 / 2 / 4 columns on the first row,
      // then 6 / 6 columns on the second row.
      const nameEndX = margin + 97;
      const ageStartX = margin + 100;
      const ageEndX = margin + 129;
      const gradeStartX = margin + 132;

      pdf.setDrawColor(17, 24, 39);
      // Keep the student-information rules as hairlines, like the web form.
      // (0.3mm made the exported rules visibly heavier than the reference.)
      pdf.setLineWidth(0.12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name:', margin, yL1);
      const wNameLbl = pdf.getTextWidth('Name:');
      pdf.setFont('helvetica', 'bold');
      pdf.text(student.name || '—', margin + wNameLbl + 2, yL1);
      pdf.line(margin + wNameLbl + 1, yL1 + 0.6, nameEndX, yL1 + 0.6);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Age:', ageStartX, yL1);
      const wAgeLbl = pdf.getTextWidth('Age:');
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(student.age || '—'), ageStartX + wAgeLbl + 2, yL1);
      pdf.line(ageStartX + wAgeLbl + 1, yL1 + 0.6, ageEndX, yL1 + 0.6);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Grade/Section:', gradeStartX, yL1);
      const wGSLbl = pdf.getTextWidth('Grade/Section:');
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${student.grade}-${student.section}`, gradeStartX + wGSLbl + 2, yL1);
      pdf.line(gradeStartX + wGSLbl + 1, yL1 + 0.6, pageWidth - margin, yL1 + 0.6);

      // Line 2: School, Teacher
      pdf.setFont('helvetica', 'bold');
      pdf.text('School:', margin, yL2);
      const wSchoolLbl = pdf.getTextWidth('School:');
      pdf.setFont('helvetica', 'bold');
      pdf.text(student.school || '—', margin + wSchoolLbl + 2, yL2);
      pdf.line(margin + wSchoolLbl + 1, yL2 + 0.6, nameEndX, yL2 + 0.6);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Teacher:', ageStartX, yL2);
      const wTeacherLbl = pdf.getTextWidth('Teacher:');
      pdf.setFont('helvetica', 'bold');
      pdf.text(student.teacher || '—', ageStartX + wTeacherLbl + 2, yL2);
      pdf.line(ageStartX + wTeacherLbl + 1, yL2 + 0.6, pageWidth - margin, yL2 + 0.6);

      // Line 3: Language Checkboxes
      pdf.setFont('helvetica', 'bold');
      pdf.text('English:', margin, yL3);
      drawCheckbox(margin + pdf.getTextWidth('English:') + 2, yL3 - 2.4, isEnglishMode, 3);

      pdf.text('Filipino:', margin + 32, yL3);
      drawCheckbox(margin + 32 + pdf.getTextWidth('Filipino:') + 2, yL3 - 2.4, !isEnglishMode, 3);

      // ── TABLE 1: WORD READING & COMPREHENSION LEVEL SUMMARY ──
      let currentY = 47.5;
      const colsT1 = [20, 16, 26, 14, 14, 14, 14, 14, 14, 34];
      const scaleT1 = contentWidth / colsT1.reduce((a, b) => a + b, 0);
      const wsT1 = colsT1.map((w) => w * scaleT1);
      const xsT1 = [margin];
      wsT1.forEach((w) => xsT1.push(xsT1[xsT1.length - 1] + w));

      const fillD4 = [212, 212, 212];
      const fillE2 = [226, 226, 226];
      const fillF0 = [240, 240, 240];
      const fillActive = [245, 250, 246];

      // Header Row 1
      drawCell(xsT1[0], currentY, wsT1[0], 5, 'Level Started', { fill: fillD4, bold: true, size: 5.5 });
      drawCell(xsT1[1], currentY, wsT1[1], 5, 'Level', { fill: fillD4, bold: true, size: 5.5 });
      drawCell(xsT1[2], currentY, wsT1[2], 5, 'Set', { fill: fillD4, bold: true, size: 5.5 });
      drawCell(xsT1[3], currentY, wsT1[3] + wsT1[4] + wsT1[5], 5, 'Word Reading', { fill: fillE2, bold: true, size: 5.5 });
      drawCell(xsT1[6], currentY, wsT1[6] + wsT1[7] + wsT1[8], 5, 'Comprehension', { fill: fillD4, bold: true, size: 5.5 });
      drawCell(xsT1[9], currentY, wsT1[9], 5, 'Date Taken', { fill: fillD4, bold: true, size: 5.5 });

      // Header Row 2
      drawCell(xsT1[0], currentY + 5, wsT1[0], 5, 'Mark with an *', { fill: fillF0, italic: true, size: 4.8 });
      drawCell(xsT1[1], currentY + 5, wsT1[1], 5, '', { fill: fillF0 });
      drawCell(xsT1[2], currentY + 5, wsT1[2], 5, 'Indicate if A, B, C, or D', { fill: fillF0, italic: true, size: 4.6 });
      ['Ind', 'Ins', 'Frus', 'Ind', 'Ins', 'Frus'].forEach((h, i) => {
        drawCell(xsT1[3 + i], currentY + 5, wsT1[3 + i], 5, h, { fill: fillF0, bold: true, size: 5 });
      });
      drawCell(xsT1[9], currentY + 5, wsT1[9], 5, '', { fill: fillF0 });

      currentY += 10;

      FORM4_LEVELS.forEach((item) => {
        const lvlCode = item.code;
        const lvlData = levelMap[lvlCode];
        const mark = (v) => (v ? '✓' : '—');
        const isStartLevel = lvlCode === startingLevelCode;

        const vals = [
          isStartLevel ? '*' : '',
          lvlCode,
          lvlData?.set || '—',
          mark(lvlData?.wordReading.ind),
          mark(lvlData?.wordReading.ins),
          mark(lvlData?.wordReading.frus),
          mark(lvlData?.comprehension.ind),
          mark(lvlData?.comprehension.ins),
          mark(lvlData?.comprehension.frus),
          lvlData?.dateTaken || '—',
        ];

        vals.forEach((v, idx) => {
          const opts = {
            fill: lvlData ? fillActive : null,
            bold: Boolean(lvlData) || idx === 1,
            size: 5.2,
          };
          if (v === '✓') opts.textColor = [16, 124, 65]; // GREEN CHECKMARK in 1st Part!
          else if (v === '—') opts.textColor = [180, 180, 180];
          drawCell(xsT1[idx], currentY, wsT1[idx], 4.4, v, opts);
        });
        currentY += 4.4;
      });

      // Keep the transition between the level summary and checklist breathable,
      // matching the vertical rhythm of the on-screen form.
      currentY += 5.5;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Legend: Ind - Independent; Ins - Instructional; Frus - Frustration', margin, currentY);

      // Divider 3
      currentY += 4.5;
      drawDividerLine(currentY);

      // ── TABLE 2: ORAL READING OBSERVATION CHECKLIST ──
      currentY += 5.5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(17, 24, 39);
      pdf.text('ORAL READING OBSERVATION CHECKLIST /', pageWidth / 2, currentY, { align: 'center' });
      pdf.text('TALAAN NG MGA PUNA HABANG NAGBABASA', pageWidth / 2, currentY + 3.6, { align: 'center' });
      // Leave a clear break between the two-line heading and the checklist table.
      currentY += 8.5;

      const wCheckText = contentWidth - 32;
      const wCheckVal = 32;

      drawCell(margin, currentY, wCheckText, 5, 'Behaviors while Reading (Paraan ng Pagbabasa)', { fill: fillE2, bold: true, align: 'left', size: 5.5 });
      drawCell(margin + wCheckText, currentY, wCheckVal, 5, '', { fill: fillE2 });
      const checkHeaderCenter = margin + wCheckText + wCheckVal / 2;
      pdf.setTextColor(17, 24, 39);
      drawVectorCheckmark(pdf, checkHeaderCenter - 2.5, currentY + 2.5, 2.0, [17, 24, 39], 0.35);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.5);
      pdf.text('or X', checkHeaderCenter - 0.2, currentY + 3.2, { align: 'left' });
      currentY += 5;

      currentObservationChecklist.forEach((row) => {
        drawCell(margin, currentY, wCheckText, 4.4, '', { fill: null });
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.2);
        pdf.setTextColor(17, 24, 39);
        pdf.text(row.behavior, margin + 1.8, currentY + 3.1);
        const wEng = pdf.getTextWidth(row.behavior);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(5.2);
        pdf.setTextColor(80, 80, 80);
        pdf.text(` (${row.behaviorFilipino})`, margin + 1.8 + wEng, currentY + 3.1);

        const resVal = row.result || '';
        // Part 2 uses neutral printed marks: both check and X are black.
        const resColor = [17, 24, 39];

        drawCell(margin + wCheckText, currentY, wCheckVal, 4.4, resVal, { bold: true, size: 5.2, textColor: resColor });
        currentY += 4.4;
      });

      // Divider 4
      // Separate Part 2 from Part 3 so the two sections do not read as one block.
      currentY += 4.5;
      drawDividerLine(currentY);

      // ── TABLE 3: SUMMARY OF COMPREHENSION RESPONSES ──
      currentY += 5.5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(17, 24, 39);
      pdf.text('SUMMARY OF COMPREHENSION RESPONSES /', pageWidth / 2, currentY, { align: 'center' });
      pdf.text('TALAAN NG PAG-UNAWA', pageWidth / 2, currentY + 3.6, { align: 'center' });

      currentY += 7.5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.text('English:', margin, currentY);
      drawCheckbox(margin + pdf.getTextWidth('English:') + 2, currentY - 2.2, isEnglishMode, 2.8);

      pdf.text('Filipino:', margin + 30, currentY);
      drawCheckbox(margin + 30 + pdf.getTextWidth('Filipino:') + 2, currentY - 2.2, !isEnglishMode, 2.8);

      currentY += 3.8;

      // Table 3 Columns Setup (Total 194mm)
      // Match the web grid: a compact passage-level column followed by eight
      // evenly spaced question columns.
      const colPassage = 28;
      const colQ = 9; // 8 * 9 = 72
      const colScoreType = 32;
      const colScore = 16;
      const colPct = 16;
      const colLevel = 30;

      const xsT3 = [margin];
      const wsT3 = [colPassage, colQ, colQ, colQ, colQ, colQ, colQ, colQ, colQ, colScoreType, colScore, colPct, colLevel];
      wsT3.forEach((w) => xsT3.push(xsT3[xsT3.length - 1] + w));

      const fillHeader3 = [232, 232, 232];
      const fillSubQ = [240, 240, 240];

      // ── TABLE 3 HEADER (3 ROWS GRID LAYOUT) ──
      const topT3 = currentY;
      const modeHeaderH = 5.5;
      // Taller middle header keeps the vertical Passage Level choices fully
      // inside their merged cell before the Q1–Q8 row starts.
      const responseHeaderH = 13;
      // Give the stacked passage-level checkboxes breathing room before the
      // standalone Q1–Q8 row begins.
      const questionHeaderH = 6;
      const passageHeaderH = modeHeaderH + responseHeaderH; // 18.5mm
      const table3HeaderH = passageHeaderH + questionHeaderH; // 24.5mm

      // 1. Passage Level (Col 0, spans Row 1 and Row 2)
      drawCell(xsT3[0], topT3, wsT3[0], passageHeaderH, '', { fill: fillHeader3 });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.8);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Passage', xsT3[0] + 1.5, topT3 + 2.6);
      pdf.text('Level', xsT3[0] + 1.5, topT3 + 4.6);

      // Spread A–D vertically inside Passage Level box, matching the web form.
      const setPositions = [
        { code: 'A', x: xsT3[0] + 1.5, y: topT3 + 6.0 },
        { code: 'B', x: xsT3[0] + 1.5, y: topT3 + 9.2 },
        { code: 'C', x: xsT3[0] + 1.5, y: topT3 + 12.4 },
        { code: 'D', x: xsT3[0] + 1.5, y: topT3 + 15.6 },
      ];
      setPositions.forEach((pos) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5);
        pdf.text(pos.code, pos.x, pos.y + 1.85);
        drawCheckbox(pos.x + 5, pos.y - 0.35, usedSets.has(pos.code), 2.2);
      });

      // 2. Pre-Test (Col 1..4, Row 1)
      const wPre = wsT3[1] + wsT3[2] + wsT3[3] + wsT3[4];
      drawCell(xsT3[1], topT3, wPre, modeHeaderH, '', { fill: fillHeader3 });
      drawCheckbox(xsT3[1] + 2, topT3 + 1.4, !isPostMode, 2.6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.8);
      pdf.text('Pre-Test', xsT3[1] + 5.5, topT3 + 2.6);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(4.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Panimulang Pagtatasa', xsT3[1] + 5.5, topT3 + 4.6);

      // 3. Post-Test (Col 5..12, Row 1)
      const wPost = wsT3[5] + wsT3[6] + wsT3[7] + wsT3[8] + wsT3[9] + wsT3[10] + wsT3[11] + wsT3[12];
      drawCell(xsT3[5], topT3, wPost, modeHeaderH, '', { fill: fillHeader3 });
      drawCheckbox(xsT3[5] + 2, topT3 + 1.4, isPostMode, 2.6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.8);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Post Test', xsT3[5] + 5.5, topT3 + 2.6);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(4.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Panapos na Pagtatasa', xsT3[5] + 5.5, topT3 + 4.6);

      // Row 2: Responses to Questions and right-hand summary headers (Row 2 only, height = responseHeaderH)
      const wResp = wsT3[1] + wsT3[2] + wsT3[3] + wsT3[4] + wsT3[5] + wsT3[6] + wsT3[7] + wsT3[8];
      drawCell(xsT3[1], topT3 + modeHeaderH, wResp, responseHeaderH, 'Responses to Questions\nSagot sa mga Tanong', { fill: fillHeader3, bold: true, size: 5.2 });
      drawCell(xsT3[9], topT3 + modeHeaderH, wsT3[9], responseHeaderH, 'Score per\nType of\nQuestion', { fill: fillHeader3, bold: true, size: 5 });
      drawCell(xsT3[10], topT3 + modeHeaderH, wsT3[10], responseHeaderH, 'Score\nMarka', { fill: fillHeader3, bold: true, size: 5.2 });
      drawCell(xsT3[11], topT3 + modeHeaderH, wsT3[11], responseHeaderH, '%', { fill: fillHeader3, bold: true, size: 5.8 });
      drawCell(xsT3[12], topT3 + modeHeaderH, wsT3[12], responseHeaderH, 'Reading\nLevel\nAntas ng Pagbasa', { fill: fillHeader3, bold: true, size: 5 });

      // Row 3: Standalone 3rd header row across all columns (Passage Level empty cell + Q1–Q8 sub-headers + right empty cells)
      const topRow3 = topT3 + passageHeaderH;
      drawCell(xsT3[0], topRow3, wsT3[0], questionHeaderH, '', { fill: fillSubQ });

      ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'].forEach((q, idx) => {
        drawCell(xsT3[1 + idx], topRow3, wsT3[1 + idx], questionHeaderH, q, { fill: fillSubQ, bold: true, size: 5 });
      });

      drawCell(xsT3[9], topRow3, wsT3[9], questionHeaderH, '', { fill: fillSubQ });
      drawCell(xsT3[10], topRow3, wsT3[10], questionHeaderH, '', { fill: fillSubQ });
      drawCell(xsT3[11], topRow3, wsT3[11], questionHeaderH, '', { fill: fillSubQ });
      drawCell(xsT3[12], topRow3, wsT3[12], questionHeaderH, '', { fill: fillSubQ });

      currentY = topT3 + table3HeaderH;

      // ── TABLE 3 DATA ROWS (LEVELS I TO VII) ──
      FORM4_LEVELS.forEach((item) => {
        const lvlCode = item.code;
        const lvlData = levelMap[lvlCode];
        const answers = lvlData?.answers || [];
        const rowH = 6.8;

        // Col 0: Level Code
        drawCell(xsT3[0], currentY, wsT3[0], rowH, lvlCode, {
          fill: lvlData ? fillActive : null,
          bold: true,
          align: 'left',
          size: 5.8,
        });

        // Col 1..8: Q1..Q8
        for (let q = 0; q < 8; q++) {
          const ans = answers[q];
          let qMark = '';
          const qColor = [17, 24, 39];
          if (ans) {
            if (ans.is_correct) {
              qMark = '✓';
            } else {
              qMark = 'x';
            }
          }
          drawCell(xsT3[1 + q], currentY, wsT3[1 + q], rowH, qMark, {
            fill: lvlData ? fillActive : null,
            bold: true,
            size: 5.5,
            textColor: qColor,
          });
        }

        // Col 9: Score per Type of Question (L, I, C)
        drawCell(xsT3[9], currentY, wsT3[9], rowH, '', { fill: lvlData ? fillActive : null });
        const litDenom = lvlData ? lvlData.literalTotal : 3;
        const infDenom = lvlData ? lvlData.inferentialTotal : 3;
        const critDenom = lvlData ? lvlData.criticalTotal : 2;

        const lVal = licByMode[selectedMode]?.[lvlCode]?.l ?? (lvlData ? `${lvlData.literalCount}/${litDenom}` : '_/_');
        const iVal = licByMode[selectedMode]?.[lvlCode]?.i ?? (lvlData ? `${lvlData.inferentialCount}/${infDenom}` : '_/_');
        const cVal = licByMode[selectedMode]?.[lvlCode]?.c ?? (lvlData ? `${lvlData.criticalCount}/${critDenom}` : '_/_');

        const yLIC = currentY + 1.8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(4.6);
        pdf.setTextColor(30, 30, 30);

        pdf.text(`L=  ${lVal}`, xsT3[9] + 1.8, yLIC);
        if (lVal && lVal !== '_/_') pdf.line(xsT3[9] + 5.5, yLIC + 0.5, xsT3[9] + 5.5 + pdf.getTextWidth(lVal), yLIC + 0.5);

        pdf.text(`I=  ${iVal}`, xsT3[9] + 1.8, yLIC + 2.0);
        if (iVal && iVal !== '_/_') pdf.line(xsT3[9] + 5.5, yLIC + 2.5, xsT3[9] + 5.5 + pdf.getTextWidth(iVal), yLIC + 2.5);

        pdf.text(`C=  ${cVal}`, xsT3[9] + 1.8, yLIC + 4.2);
        if (cVal && cVal !== '_/_') pdf.line(xsT3[9] + 5.5, yLIC + 4.7, xsT3[9] + 5.5 + pdf.getTextWidth(cVal), yLIC + 4.7);

        // Col 10: Score
        const scoreStr = lvlData ? `${lvlData.compScore}/${lvlData.totalItems}` : '';
        drawCell(xsT3[10], currentY, wsT3[10], rowH, scoreStr, { fill: lvlData ? fillActive : null, bold: true, size: 5.8 });

        // Col 11: %
        const pctStr = lvlData ? `${lvlData.compPct}%` : '';
        drawCell(xsT3[11], currentY, wsT3[11], rowH, pctStr, { fill: lvlData ? fillActive : null, bold: true, size: 5.8 });

        // Col 12: Reading Level
        const lvlStr = lvlData ? lvlData.compLevel : '';
        drawCell(xsT3[12], currentY, wsT3[12], rowH, lvlStr, { fill: lvlData ? fillActive : null, bold: true, size: 5.5 });

        currentY += rowH;
      });

      // Give the legend a clear separation from the final Table 3 row.
      currentY += 4.5;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Legend: L - Literal; I - Inferential; C - Critical', margin, currentY);

      // Save PDF file
      pdf.save(`PHIL_IRI_FORM_4_${student.lrn || rawLrn}_${selectedMode.toUpperCase()}.pdf`);
      triggerToast(`Downloaded PHIL-IRI FORM 4 (${selectedMode.toUpperCase()}) as PDF.`, 'success');
    } catch (error) {
      console.error('Failed to generate Form 4 PDF:', error);
      triggerToast('Failed to generate the PDF file.', 'error');
    }
  };

  // Export official Form 4 to Excel (.xlsx) using ExcelJS matching Web UI exact layout
  const handleExportXLSX = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheetName = `Form 4 (${selectedMode.toUpperCase()})`;
      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
        pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      };

      const fillBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } }; // #d4d4d4
      const fillSubHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }; // #e8e8e8
      const fillSubHeaderSub = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; // #f0f0f0
      const fillActiveRow = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5FAF6' } }; // #f5faf6

      // Grid definition: 13 columns (A - M) with generous widths to prevent any truncation
      worksheet.columns = [
        { width: 16 }, // A - Passage Level / Behaviors / Level Started
        { width: 8 },  // B - Q1 / Level
        { width: 22 }, // C - Set ("Indicate if A, B, C or D") / Q2
        { width: 8 },  // D - Q3 / WR Ind
        { width: 8 },  // E - Q4 / WR Ins
        { width: 8 },  // F - Q5 / WR Frus / Age:
        { width: 8 },  // G - Q6 / Comp Ind / Age val
        { width: 16 }, // H - Q7 / Comp Ins / "Grade/Section:" label
        { width: 8 },  // I - Q8 / Comp Frus
        { width: 16 }, // J - Score per Type of Question (L, I, C)
        { width: 12 }, // K - Score (Marka)
        { width: 10 }, // L - %
        { width: 22 }, // M - Reading Level / Date Taken
      ];

      // Row 1: Code
      const r1 = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', 'PHIL-IRI FORM 4']);
      r1.getCell(13).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF4B5563' } };
      r1.getCell(13).alignment = { horizontal: 'right' };

      // Row 2: Title
      const r2 = worksheet.addRow(['INDIVIDUAL SUMMARY RECORD (ISR) / TALAAN NG INDIBIDWAL NA PAGBASA (TIP)']);
      worksheet.mergeCells('A2:M2');
      r2.height = 24;
      r2.getCell(1).font = { name: 'Arial', size: 12, bold: true };
      r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 3: Assessment Stage Label
      const r3 = worksheet.addRow([getModeLabel(selectedMode).toUpperCase()]);
      worksheet.mergeCells('A3:M3');
      r3.height = 20;
      r3.getCell(1).font = { name: 'Arial', size: 10, italic: true, bold: true, color: { argb: 'FF107C41' } };
      r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow([]);

      // Metadata Rows (Rows 5-7) — follows the web form's 6 / 2 / 4 grid.
      // A value range gets a continuous black rule; underlining text alone
      // leaves gaps and does not resemble the on-screen form.
      const metadataRule = { style: 'thin', color: { argb: 'FF111827' } };
      const styleMetadataValue = (rowNumber, startColumn, endColumn, align = 'left', indent = 1) => {
        for (let column = startColumn; column <= endColumn; column += 1) {
          const cell = worksheet.getCell(rowNumber, column);
          cell.border = { bottom: metadataRule };
          cell.alignment = { horizontal: align, vertical: 'middle', indent: align == 'left' ? indent : 0 };
        }
        const valueCell = worksheet.getCell(rowNumber, startColumn);
        valueCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF111827' } };
      };

      const r5 = worksheet.addRow([
        'Name:', student.name, '', '', '',
        'Age:', String(student.age || '—'),
        'Grade/Section:', '', `${student.grade || '—'}-${student.section || '—'}`, '', '', ''
      ]);
      const n5 = r5.number;
      r5.height = 20;
      worksheet.mergeCells(`B${n5}:E${n5}`);
      worksheet.mergeCells(`H${n5}:I${n5}`);
      worksheet.mergeCells(`J${n5}:M${n5}`);
      [1, 6, 8].forEach((column) => {
        r5.getCell(column).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF111827' } };
        r5.getCell(column).alignment = {
          horizontal: column == 1 ? 'left' : 'right',
          vertical: 'middle',
        };
      });
      styleMetadataValue(n5, 2, 5);
      styleMetadataValue(n5, 7, 7, 'center');
      styleMetadataValue(n5, 10, 13);

      const r6 = worksheet.addRow([
        'School:', student.school, '', '', '',
        'Teacher:', '', '', '', student.teacher, '', '', ''
      ]);
      const n6 = r6.number;
      r6.height = 20;
      worksheet.mergeCells(`B${n6}:E${n6}`);
      worksheet.mergeCells(`F${n6}:I${n6}`);
      worksheet.mergeCells(`J${n6}:M${n6}`);
      [1, 6].forEach((column) => {
        r6.getCell(column).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF111827' } };
        r6.getCell(column).alignment = {
          horizontal: column == 1 ? 'left' : 'right',
          vertical: 'middle',
        };
      });
      styleMetadataValue(n6, 2, 5);
      styleMetadataValue(n6, 10, 13);

      const r7 = worksheet.addRow([
        'English:', isEnglishMode ? '[ ✓ ]' : '[   ]', '',
        'Filipino:', !isEnglishMode ? '[ ✓ ]' : '[   ]', '', '', '', '', '', '', '', ''
      ]);
      const n7 = r7.number;
      r7.height = 20;
      worksheet.mergeCells(`B${n7}:C${n7}`);
      worksheet.mergeCells(`E${n7}:F${n7}`);
      [1, 2, 4, 5].forEach((column) => {
        r7.getCell(column).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF111827' } };
        r7.getCell(column).alignment = { horizontal: column == 2 || column == 5 ? 'center' : column == 4 ? 'right' : 'left', vertical: 'middle' };
      });

      worksheet.addRow([]);

      // ── TABLE 1: WORD READING & COMPREHENSION LEVEL SUMMARY ──
      const rT1Sub1 = worksheet.addRow([
        'LEVEL STARTED', 'LEVEL', 'SET',
        'WORD READING', '', '',
        'COMPREHENSION', '', '',
        'DATE TAKEN', '', '', ''
      ]);
      const nT1_1 = rT1Sub1.number;

      const rT1Sub2 = worksheet.addRow([
        'Mark with an *', '', 'Indicate if A. B. C. or D',
        'Ind', 'Ins', 'Frus',
        'Ind', 'Ins', 'Frus',
        '', '', '', ''
      ]);
      const nT1_2 = rT1Sub2.number;

      rT1Sub1.height = 22;
      rT1Sub2.height = 22;

      worksheet.mergeCells(`D${nT1_1}:F${nT1_1}`);
      worksheet.mergeCells(`G${nT1_1}:I${nT1_1}`);
      worksheet.mergeCells(`J${nT1_1}:M${nT1_1}`);
      worksheet.mergeCells(`J${nT1_2}:M${nT1_2}`);

      for (let r = nT1_1; r <= nT1_2; r += 1) {
        for (let c = 1; c <= 13; c += 1) {
          const cell = worksheet.getCell(r, c);
          cell.fill = fillSubHeader;
          cell.border = borderThin;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          if (r === nT1_1) {
            cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF111827' } };
          } else {
            const isItalic = c === 1 || c === 3;
            const isBoldMark = c >= 4 && c <= 9;
            cell.font = { name: 'Arial', size: 8.5, italic: isItalic, bold: isBoldMark, color: { argb: 'FF111827' } };
          }
        }
      }

      FORM4_LEVELS.forEach((item) => {
        const lvlCode = item.code;
        const lvlData = levelMap[lvlCode];
        const isStartLevel = lvlCode === startingLevelCode;

        const indWR = lvlData ? lvlData.wordReading.ind : false;
        const insWR = lvlData ? lvlData.wordReading.ins : false;
        const frusWR = lvlData ? lvlData.wordReading.frus : false;
        const indComp = lvlData ? lvlData.comprehension.ind : false;
        const insComp = lvlData ? lvlData.comprehension.ins : false;
        const frusComp = lvlData ? lvlData.comprehension.frus : false;
        const dateTaken = lvlData?.dateTaken || '—';
        const rawSet = lvlData?.set || '—';
        const setVal = rawSet !== '—' ? (rawSet.startsWith('Set') ? rawSet : `Set ${rawSet}`) : '—';

        const row = worksheet.addRow([
          isStartLevel ? '*' : '',
          lvlCode,
          setVal,
          indWR ? '✓' : '—',
          insWR ? '✓' : '—',
          frusWR ? '✓' : '—',
          indComp ? '✓' : '—',
          insComp ? '✓' : '—',
          frusComp ? '✓' : '—',
          dateTaken, '', '', ''
        ]);
        const rNum = row.number;
        worksheet.mergeCells(`J${rNum}:M${rNum}`);
        row.height = 20;

        for (let col = 1; col <= 13; col += 1) {
          const c = row.getCell(col);
          const val = c.value;
          const isCheckmark = val === '✓';
          c.font = {
            name: 'Arial',
            size: 9.5,
            bold: Boolean(lvlData) || isCheckmark,
            color: { argb: isCheckmark ? 'FF107C41' : 'FF111827' }
          };
          c.border = borderThin;
          c.alignment = { horizontal: 'center', vertical: 'middle' };
          if (lvlData) c.fill = fillActiveRow;
        }
      });

      const rT1Legend = worksheet.addRow(['Legend: Ind - Independent; Ins - Instructional; Frus - Frustration']);
      const nT1Leg = rT1Legend.number;
      worksheet.mergeCells(`A${nT1Leg}:M${nT1Leg}`);
      rT1Legend.getCell(1).font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF4B5563' } };

      worksheet.addRow([]);

      // ── TABLE 2: ORAL READING OBSERVATION CHECKLIST ──
      const rT2Title = worksheet.addRow(['ORAL READING OBSERVATION CHECKLIST /\nTALAAN NG MGA PUNA HABANG NAGBABASA']);
      const nT2T = rT2Title.number;
      worksheet.mergeCells(`A${nT2T}:M${nT2T}`);
      rT2Title.height = 32;
      rT2Title.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      rT2Title.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      const rT2Sub = worksheet.addRow(['Behaviors while Reading (Paraan ng Pagbabasa)', '', '', '', '', '', '', '', '', '', '✓ or X', '', '']);
      const nT2S = rT2Sub.number;
      rT2Sub.height = 22;
      worksheet.mergeCells(`A${nT2S}:J${nT2S}`);
      worksheet.mergeCells(`K${nT2S}:M${nT2S}`);
      rT2Sub.eachCell({ includeEmpty: true }, (c, col) => {
        c.font = { name: 'Arial', size: 9.5, bold: true };
        c.fill = fillBanner;
        c.border = borderThin;
        c.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
      });

      currentObservationChecklist.forEach((rowItem) => {
        const row = worksheet.addRow([`${rowItem.behavior} (${rowItem.behaviorFilipino})`, '', '', '', '', '', '', '', '', '', rowItem.result || '—', '', '']);
        const rNum = row.number;
        row.height = 22;
        worksheet.mergeCells(`A${rNum}:J${rNum}`);
        worksheet.mergeCells(`K${rNum}:M${rNum}`);
        row.eachCell({ includeEmpty: true }, (c, col) => {
          c.font = { name: 'Arial', size: 9 };
          c.border = borderThin;
          if (col >= 11) {
            c.alignment = { horizontal: 'center', vertical: 'middle' };
            c.font = { name: 'Arial', size: 9, bold: true };
          } else {
            c.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });

      worksheet.addRow([]);

      // ── TABLE 3: SUMMARY OF COMPREHENSION RESPONSES ──
      const rT3Title = worksheet.addRow(['SUMMARY OF COMPREHENSION RESPONSES /\nTALAAN NG PAG-UNAWA']);
      const nT3T = rT3Title.number;
      worksheet.mergeCells(`A${nT3T}:M${nT3T}`);
      rT3Title.height = 32;
      rT3Title.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      rT3Title.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      const langText = `English: ${isEnglishMode ? '[✓]' : '[ ]'}    Filipino: ${isEnglishMode ? '[ ]' : '[✓]'}`;
      const rT3Lang = worksheet.addRow([langText]);
      const nT3L = rT3Lang.number;
      rT3Lang.height = 22;
      worksheet.mergeCells(`A${nT3L}:M${nT3L}`);
      rT3Lang.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };

      const passageLevelStr = `Passage Level\nA [${usedSets.has('A') ? '✓' : ' '}]  B [${usedSets.has('B') ? '✓' : ' '}]\nC [${usedSets.has('C') ? '✓' : ' '}]  D [${usedSets.has('D') ? '✓' : ' '}]`;
      const preTestStr = `[ ${!isPostMode ? '✓' : ' '} ] Pre-Test`;
      const postTestStr = `[ ${isPostMode ? '✓' : ' '} ] Post Test`;

      const rT3Sub1 = worksheet.addRow([
        passageLevelStr,
        preTestStr, '', '', '',
        postTestStr, '', '', '',
        'Score per\nType of\nQuestion',
        'Score\nMarka',
        '%',
        'Reading Level\nAntas ng Pagbasa'
      ]);
      const nT3_1 = rT3Sub1.number;

      const rT3Sub2 = worksheet.addRow([
        '',
        'Panimulang Pagtatasa', '', '', '',
        'Panapos na Pagtatasa', '', '', '',
        '', '', '', ''
      ]);
      const nT3_2 = rT3Sub2.number;

      const rT3Sub3 = worksheet.addRow([
        '',
        'Responses to Questions (Sagot sa mga Tanong)', '', '', '', '', '', '', '',
        '', '', '', ''
      ]);
      const nT3_3 = rT3Sub3.number;

      const rT3Sub4 = worksheet.addRow([
        '', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', '', '', '', ''
      ]);
      const nT3_4 = rT3Sub4.number;

      rT3Sub1.height = 20;
      rT3Sub2.height = 18;
      rT3Sub3.height = 22;
      rT3Sub4.height = 20;

      // Multi-row header vertical and horizontal merges across 4 rows
      worksheet.mergeCells(`A${nT3_1}:A${nT3_4}`);
      worksheet.mergeCells(`B${nT3_1}:E${nT3_1}`);
      worksheet.mergeCells(`F${nT3_1}:I${nT3_1}`);
      worksheet.mergeCells(`B${nT3_2}:E${nT3_2}`);
      worksheet.mergeCells(`F${nT3_2}:I${nT3_2}`);
      worksheet.mergeCells(`B${nT3_3}:I${nT3_3}`);

      worksheet.mergeCells(`J${nT3_1}:J${nT3_4}`);
      worksheet.mergeCells(`K${nT3_1}:K${nT3_4}`);
      worksheet.mergeCells(`L${nT3_1}:L${nT3_4}`);
      worksheet.mergeCells(`M${nT3_1}:M${nT3_4}`);

      for (let r = nT3_1; r <= nT3_4; r += 1) {
        for (let c = 1; c <= 13; c += 1) {
          const cell = worksheet.getCell(r, c);
          cell.fill = fillSubHeader;
          cell.border = borderThin;
          const isItalic = r === nT3_2 && c >= 2 && c <= 9;
          cell.font = { name: 'Arial', size: 9, bold: !isItalic, italic: isItalic, color: { argb: 'FF111827' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
      }

      FORM4_LEVELS.forEach((item) => {
        const lvlCode = item.code;
        const lvlData = levelMap[lvlCode];
        const answers = lvlData?.answers || [];

        const qAns = [0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
          const ans = answers[idx];
          return ans ? (ans.is_correct ? '✓' : 'x') : '';
        });

        const litDenom = lvlData ? lvlData.literalTotal : 3;
        const infDenom = lvlData ? lvlData.inferentialTotal : 3;
        const critDenom = lvlData ? lvlData.criticalTotal : 2;

        const lVal = licByMode[selectedMode]?.[lvlCode]?.l ?? (lvlData ? `${lvlData.literalCount}/${litDenom}` : '_/_');
        const iVal = licByMode[selectedMode]?.[lvlCode]?.i ?? (lvlData ? `${lvlData.inferentialCount}/${infDenom}` : '_/_');
        const cVal = licByMode[selectedMode]?.[lvlCode]?.c ?? (lvlData ? `${lvlData.criticalCount}/${critDenom}` : '_/_');

        const typeScores = `L= ${lVal}\nI= ${iVal}\nC= ${cVal}`;
        const scoreStr = lvlData ? `${lvlData.compScore}/${lvlData.totalItems}` : '';
        const pctStr = lvlData ? `${lvlData.compPct}%` : '';
        const lvlStr = lvlData ? lvlData.compLevel : '';

        const row = worksheet.addRow([
          lvlCode,
          ...qAns,
          typeScores,
          scoreStr,
          pctStr,
          lvlStr
        ]);
        row.height = 38;

        for (let col = 1; col <= 13; col += 1) {
          const c = row.getCell(col);
          const val = String(c.value || '');
          const isCheckmark = val === '✓';
          c.font = {
            name: 'Arial',
            size: 9.5,
            bold: Boolean(lvlData) || isCheckmark,
            color: { argb: isCheckmark ? 'FF107C41' : 'FF111827' }
          };
          c.border = borderThin;
          c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: col === 10 };
          if (col === 1) c.alignment = { horizontal: 'left', vertical: 'middle' };
          if (lvlData) c.fill = fillActiveRow;
        }
      });

      const rT3Legend = worksheet.addRow(['Legend: L - Literal; I - Inferential; C - Critical']);
      const nT3Leg = rT3Legend.number;
      worksheet.mergeCells(`A${nT3Leg}:M${nT3Leg}`);
      rT3Legend.getCell(1).font = { name: 'Arial', size: 8.5, italic: true, color: { argb: 'FF4B5563' } };

      // Write and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PHIL_IRI_FORM_4_${student.lrn || rawLrn}_${selectedMode.toUpperCase()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      triggerToast(`Downloaded PHIL-IRI FORM 4 (${selectedMode.toUpperCase()}) successfully!`, 'success');
    } catch (err) {
      console.error('Error exporting Form 4 to Excel:', err);
      triggerToast('Failed to export Excel file.', 'error');
    }
  };

  return (
    <div className="pb-10 font-sans text-xs">
      <BackButton to="/teacher/phil-iri-records/form-4" size={20} />

      {/* Top Header Bar with Mode Selector matching Form 3 */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-ink">
            PHIL-IRI FORM 4 - INDIVIDUAL SUMMARY RECORD (ISR)
          </h3>
          {loading ? (
            <SkeletonBlock className="h-3.5 w-64 rounded-md mt-1" />
          ) : (
            <p className="text-xs text-ink/60">
              {student.name} ({student.lrn || rawLrn}) — Talaan ng Indibidwal na Pagbasa (TIP)
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Variant / Mode Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="form4-mode-select" className="text-xs font-bold text-ink/70">
              ISR Sheet:
            </label>
            <select
              id="form4-mode-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-ink focus:border-[#107c41] focus:bg-white focus:outline-none cursor-pointer shadow-2xs"
            >
              <optgroup label="Filipino ISR">
                <option value="pre_fil">Pre-Test (Panimulang Pagtatasa)</option>
                <option value="post_fil">Post-Test (Panapos na Pagtatasa)</option>
              </optgroup>
              <optgroup label="English ISR">
                <option value="pre_en">Pre-Test</option>
                <option value="post_en">Post-Test</option>
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={loading}
            className="order-2 flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <DownloadSimple size={15} weight="bold" className="text-red-600" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportXLSX}
            className="order-1 flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs"
          >
            <DownloadSimple size={15} weight="bold" className="text-[#107c41]" />
            <span>Export .XLSX</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="order-3 flex items-center gap-1.5 rounded-lg bg-[#107c41] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0b542c] transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FloppyDisk size={15} weight="bold" />
            <span>{isSaving ? 'Saving to DB...' : 'Save Record'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <PhilIriForm4DetailSkeleton />
      ) : (
        /* Clean Official DepEd Excel Worksheet UI */
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
            <p className="text-xs font-bold text-[#107c41] uppercase tracking-wide pt-1">
              {getModeLabel(selectedMode)}
            </p>
          </div>

          {/* Form Header Information Grid (Matching official DepEd layout) */}
          <div className="space-y-2 text-xs text-gray-900 font-semibold mb-6 px-1 border-t border-b border-gray-300 py-3 bg-white">
            <div className="grid grid-cols-12 gap-y-2 gap-x-4 items-center">
              <div className="col-span-6 flex items-center">
                <span>Name:</span>
                <strong className="grow border-b border-gray-800 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.name}
                </strong>
              </div>
              <div className="col-span-2 flex items-center">
                <span>Age:</span>
                <strong className="grow border-b border-gray-800 font-bold px-2 ml-2 text-gray-900 text-center">
                  {student.age || '—'}
                </strong>
              </div>
              <div className="col-span-4 flex items-center">
                <span>Grade/Section:</span>
                <strong className="grow border-b border-gray-800 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.grade}-{student.section}
                </strong>
              </div>

              <div className="col-span-6 flex items-center">
                <span>School:</span>
                <strong className="grow border-b border-gray-800 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.school}
                </strong>
              </div>
              <div className="col-span-6 flex items-center">
                <span>Teacher:</span>
                <strong className="grow border-b border-gray-800 font-bold px-2 ml-2 text-gray-900 truncate">
                  {student.teacher}
                </strong>
              </div>

              <div className="col-span-12 flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <span>English:</span>
                  <div className="w-4 h-4 border border-gray-800 flex items-center justify-center font-bold text-xs bg-white">
                    {isEnglishMode ? '✓' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span>Filipino:</span>
                  <div className="w-4 h-4 border border-gray-800 flex items-center justify-center font-bold text-xs bg-white">
                    {!isEnglishMode ? '✓' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table 1: Word Reading & Comprehension Level Summary */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400 text-xs font-sans text-center">
              <thead>
                <tr className="bg-[#d4d4d4] font-bold text-gray-900 uppercase border border-gray-400">
                  <th className="border border-gray-400 p-2 w-20">
                    Level Started
                  </th>
                  <th className="border border-gray-400 p-2 w-16">
                    Level
                  </th>
                  <th className="border border-gray-400 p-2 w-28">
                    Set
                  </th>
                  <th colSpan={3} className="border border-gray-400 p-2 bg-[#e2e2e2]">
                    Word Reading
                  </th>
                  <th colSpan={3} className="border border-gray-400 p-2 bg-[#d4d4d4]">
                    Comprehension
                  </th>
                  <th className="border border-gray-400 p-2 w-28">
                    Date Taken
                  </th>
                </tr>
                <tr className="bg-[#f0f0f0] font-bold text-gray-800 text-[10.5px] border border-gray-400">
                  <th className="border border-gray-400 p-1.5 text-center font-normal italic">
                    Mark with an *
                  </th>
                  <th className="border border-gray-400 p-1.5"></th>
                  <th className="border border-gray-400 p-1.5 text-center font-normal italic">
                    Indicate if A. B. C. or D
                  </th>
                  <th className="border border-gray-400 p-1.5 w-14">Ind</th>
                  <th className="border border-gray-400 p-1.5 w-14">Ins</th>
                  <th className="border border-gray-400 p-1.5 w-14">Frus</th>
                  <th className="border border-gray-400 p-1.5 w-14">Ind</th>
                  <th className="border border-gray-400 p-1.5 w-14">Ins</th>
                  <th className="border border-gray-400 p-1.5 w-14">Frus</th>
                  <th className="border border-gray-400 p-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {FORM4_LEVELS.map((item) => {
                  const lvlCode = item.code;
                  const lvlData = levelMap[lvlCode];
                  const isStartLevel = lvlCode === startingLevelCode;

                  const indWR = lvlData ? lvlData.wordReading.ind : false;
                  const insWR = lvlData ? lvlData.wordReading.ins : false;
                  const frusWR = lvlData ? lvlData.wordReading.frus : false;
                  const indComp = lvlData ? lvlData.comprehension.ind : false;
                  const insComp = lvlData ? lvlData.comprehension.ins : false;
                  const frusComp = lvlData ? lvlData.comprehension.frus : false;
                  const dateVal = lvlData?.dateTaken || '';
                  const setVal = lvlData?.set || '';

                  return (
                    <tr key={lvlCode} className={lvlData ? 'bg-[#f5faf6] font-bold' : 'hover:bg-gray-50'}>
                      <td className="border border-gray-400 p-2 font-bold text-gray-900">
                        {isStartLevel ? '*' : ''}
                      </td>
                      <td className="border border-gray-400 p-2 font-bold text-gray-900">
                        {lvlCode}
                      </td>
                      <td className="border border-gray-400 p-2 text-gray-800 font-semibold">
                        {setVal || '—'}
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
                        {dateVal || '—'}
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

          {/* Table 2: Oral Reading Observation Checklist */}
          <div className="mt-8 border-t border-gray-300 pt-4">
            <div className="text-center mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Oral Reading Observation Checklist /
              </h3>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Talaan ng mga Puna Habang Nagbabasa
              </h3>
            </div>
            <table className="w-full border-collapse border border-gray-400 text-xs font-sans">
              <thead>
                <tr className="bg-[#e2e2e2] text-gray-900 font-bold border border-gray-400">
                  <th className="border border-gray-400 p-2 text-left">
                    Behaviors while Reading <span className="font-normal italic text-gray-700">(Paraan ng Pagbabasa)</span>
                  </th>
                  <th className="w-36 border border-gray-400 p-2 text-center">✓ or X</th>
                </tr>
              </thead>
              <tbody>
                {currentObservationChecklist.map((row, i) => (
                  <tr key={row.behavior} className="hover:bg-[#f5faf6]">
                    <td className="border border-gray-400 p-2 text-gray-900">
                      <strong>{row.behavior}</strong>{' '}
                      <span className="italic text-gray-600">({row.behaviorFilipino})</span>
                    </td>
                    <td className="border border-gray-400 p-1.5 text-center">
                      {i === currentObservationChecklist.length - 1 ? (
                        <input
                          type="text"
                          value={row.result}
                          onChange={(e) => handleChecklistChange(i, e.target.value)}
                          placeholder="Ibang Puna / Notes..."
                          className="w-full max-w-[220px] rounded border border-gray-300 px-2 py-1 text-center font-bold text-gray-900 focus:border-[#107c41] focus:bg-white focus:outline-none transition-colors shadow-2xs text-xs"
                        />
                      ) : (
                        <select
                          value={row.result || ''}
                          onChange={(e) => handleChecklistChange(i, e.target.value)}
                          className="w-36 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-900 focus:border-[#107c41] focus:bg-white focus:outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="">— Select —</option>
                          <option value="✓">✓</option>
                          <option value="X">X</option>
                          <option value="X bihira">X bihira</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table 3: Summary of Comprehension Responses (Talaan ng Pag-unawa) */}
          <div className="mt-8 border-t border-gray-300 pt-4 mb-6">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Summary of Comprehension Responses /
              </h3>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Talaan ng Pag-unawa
              </h3>
            </div>

            {/* English / Filipino language indicators */}
            <div className="flex items-center gap-6 text-xs font-semibold text-gray-800 mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span>English:</span>
                <div className="w-3.5 h-3.5 border border-gray-800 flex items-center justify-center text-[10px] font-black bg-white">
                  {isEnglishMode ? '✓' : ''}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Filipino:</span>
                <div className="w-3.5 h-3.5 border border-gray-800 flex items-center justify-center text-[10px] font-black bg-white">
                  {!isEnglishMode ? '✓' : ''}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-xs font-sans text-center">
                <thead>
                  {/* Row 1: Passage Level (rowspan 2) | Pre-Test | Post-Test */}
                  <tr className="bg-[#e8e8e8] font-bold text-gray-900 text-xs border border-gray-400">
                    <th rowSpan={2} className="border border-gray-400 p-1.5 text-left align-top w-20">
                      <div className="text-[10px] font-bold leading-tight mb-1">Passage<br/>Level</div>
                      <div className="flex flex-col gap-0.5">
                        {['A','B','C','D'].map((s) => (
                          <div key={s} className="flex items-center gap-1 text-[9px] font-semibold text-gray-800">
                            <span>{s}</span>
                            <div className="w-3 h-3 border border-gray-700 bg-white shrink-0 flex items-center justify-center text-[9px] font-black">
                              {usedSets.has(s) ? '✓' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </th>
                    <th colSpan={4} className="border border-gray-400 p-1.5 text-left font-bold text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 border border-gray-800 bg-white shrink-0 flex items-center justify-center text-[10px] font-black">
                          {!isPostMode ? '✓' : ''}
                        </div>
                        <span>Pre-Test</span>
                      </div>
                      <div className="italic font-normal text-gray-600 text-[9px] ml-5">Panimulang Pagtatasa</div>
                    </th>
                    <th colSpan={8} className="border border-gray-400 p-1.5 text-left font-bold text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 border border-gray-800 bg-white shrink-0 flex items-center justify-center text-[10px] font-black">
                          {isPostMode ? '✓' : ''}
                        </div>
                        <span>Post Test</span>
                      </div>
                      <div className="italic font-normal text-gray-600 text-[9px] ml-5">Panapos na Pagtatasa</div>
                    </th>
                  </tr>
                  {/* Row 2: Responses (colspan 8) | Score per Type | Score | % | Reading Level */}
                  <tr className="bg-[#e8e8e8] font-bold text-gray-900 text-xs border border-gray-400">
                    <th colSpan={8} className="border border-gray-400 p-1.5 text-center">
                      Responses to Questions<br/>
                      <span className="font-normal italic text-gray-600 text-[9.5px]">Sagot sa mga Tanong</span>
                    </th>
                    <th className="border border-gray-400 p-1.5 text-center w-24 text-[10px]">
                      Score per<br/>Type of<br/>Question
                    </th>
                    <th className="border border-gray-400 p-1.5 text-center w-12 text-[10px]">
                      Score<br/>
                      <span className="font-normal italic text-gray-600 text-[9px]">Marka</span>
                    </th>
                    <th className="border border-gray-400 p-1.5 text-center w-9 text-[10px]">%</th>
                    <th className="border border-gray-400 p-1.5 text-center w-20 text-[10px]">
                      Reading<br/>Level<br/>
                      <span className="font-normal italic text-gray-600 text-[9px]">Antas ng<br/>Pagbasa</span>
                    </th>
                  </tr>
                  {/* Row 3: Q1–Q8 sub-headers */}
                  <tr className="bg-[#f0f0f0] font-bold text-gray-800 text-[10px] border border-gray-400">
                    <th className="border border-gray-400 p-1 w-20"></th>
                    <th className="border border-gray-400 p-1 w-7">Q1</th>
                    <th className="border border-gray-400 p-1 w-7">Q2</th>
                    <th className="border border-gray-400 p-1 w-7">Q3</th>
                    <th className="border border-gray-400 p-1 w-7">Q4</th>
                    <th className="border border-gray-400 p-1 w-7">Q5</th>
                    <th className="border border-gray-400 p-1 w-7">Q6</th>
                    <th className="border border-gray-400 p-1 w-7">Q7</th>
                    <th className="border border-gray-400 p-1 w-7">Q8</th>
                    <th className="border border-gray-400 p-1"></th>
                    <th className="border border-gray-400 p-1"></th>
                    <th className="border border-gray-400 p-1"></th>
                    <th className="border border-gray-400 p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {FORM4_LEVELS.map((item) => {
                    const lvlCode = item.code;
                    const lvlData = levelMap[lvlCode];
                    const answers = lvlData?.answers || [];
                    const setVal = lvlData?.set || '';

                    return (
                      <tr key={lvlCode} className={lvlData ? 'bg-[#f5faf6] font-bold' : 'hover:bg-gray-50'}>
                        {/* Passage Level: grade level only */}
                        <td className="border border-gray-400 p-2 text-left font-bold text-gray-900">
                          {lvlCode}
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((qIdx) => {
                          const ans = answers[qIdx];
                          return (
                            <td key={qIdx} className="border border-gray-400 p-1 text-center font-bold text-gray-800">
                              {ans ? (ans.is_correct ? '✓' : 'x') : ''}
                            </td>
                          );
                        })}
                        <td className="border border-gray-400 p-1.5 text-left text-[10px] leading-snug text-gray-800 pl-2">
                          {(() => {
                            const litDenom = lvlData ? lvlData.literalTotal : 3;
                            const infDenom = lvlData ? lvlData.inferentialTotal : 3;
                            const critDenom = lvlData ? lvlData.criticalTotal : 2;

                            return [['l','L', litDenom],['i','I', infDenom],['c','C', critDenom]].map(([field, label, maxDenom]) => {
                              let autoVal = '';
                              if (lvlData) {
                                if (field === 'l') autoVal = `${lvlData.literalCount}/${maxDenom}`;
                                else if (field === 'i') autoVal = `${lvlData.inferentialCount}/${maxDenom}`;
                                else if (field === 'c') autoVal = `${lvlData.criticalCount}/${maxDenom}`;
                              }
                              const val = licByMode[selectedMode]?.[lvlCode]?.[field] ?? autoVal;
                              return (
                                <div key={field} className="flex items-center gap-0.5">
                                  <span className="font-bold shrink-0">{label}=</span>
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleLicChange(lvlCode, field, e.target.value)}
                                    placeholder="_/_"
                                    className="w-10 border-b border-gray-400 text-center text-[10px] font-semibold bg-transparent focus:outline-none focus:border-[#107c41] placeholder-gray-300"
                                  />
                                </div>
                              );
                            });
                          })()}
                        </td>
                        <td className="border border-gray-400 p-2 text-gray-900 font-bold text-center">
                          {lvlData ? `${lvlData.compScore}/${lvlData.totalItems}` : ''}
                        </td>
                        <td className="border border-gray-400 p-2 text-gray-900 font-bold text-center">
                          {lvlData ? `${lvlData.compPct}%` : ''}
                        </td>
                        <td className="border border-gray-400 p-2 text-gray-900 font-bold text-center">
                          {lvlData ? lvlData.compLevel : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] font-semibold italic text-gray-600">
              Legend: L - Literal; I - Inferential; C - Critical
            </p>
          </div>
        </div>
      </div>
      )}

      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}
