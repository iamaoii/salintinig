import cacheService from '../../../services/cacheService.js';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Microphone, WarningCircle, DownloadSimple, FloppyDisk } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { PhilIriForm3DetailSkeleton } from '../../../components/common/Skeleton.jsx';
import { encodeSecureToken, decodeSecureToken } from '../../../lib/securityToken.js';
import { getToken } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';
import { jsPDF } from 'jspdf';

export default function PhilIriForm3Detail({ formKey, label, backTo }) {
  const { lrn: rawLrn } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
      const cacheKey = `form3_attempts_${rawLrn}_${langCode}`;
      const cached = cacheService.get(cacheKey);

      const deduplicateList = (list) => {
        const map = new Map();
        (list || []).forEach((att) => {
          const key = att.passage_id || `${att.passage_grade_level || ''}_${att.passage_set || ''}`;
          map.set(key, att);
        });
        return Array.from(map.values());
      };

      if (cached && cached.success && Array.isArray(cached.attempts) && cached.attempts.length > 0) {
        const cleanCached = deduplicateList(cached.attempts);
        setStudentInfo(cached.student);
        setAttempts(cleanCached);

        const paramAttToken = searchParams.get('att') || searchParams.get('attemptId');
        const decodedAttId = decodeSecureToken('ATT', paramAttToken);
        const paramAttemptNum = searchParams.get('attempt');

        let initialIdx = 0;
        if (decodedAttId && cleanCached.length > 0) {
          const foundIdx = cleanCached.findIndex((a) => String(a.attempt_id) === String(decodedAttId));
          if (foundIdx >= 0) initialIdx = foundIdx;
        } else if (paramAttemptNum && !isNaN(paramAttemptNum)) {
          const numIdx = Number(paramAttemptNum) - 1;
          if (numIdx >= 0 && numIdx < cleanCached.length) initialIdx = numIdx;
        }

        setSelectedAttemptIndex(initialIdx);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const token = getToken();
        const res = await fetch(
          getApiUrl(`/api/teacher/phil-iri/form3-attempts/${encodeURIComponent(rawLrn)}?language=${langCode}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const cleanAtts = deduplicateList(data.attempts || []);
          cacheService.set(cacheKey, { ...data, attempts: cleanAtts }, 300000); // 5 mins TTL
          setStudentInfo(data.student);
          setAttempts(cleanAtts);

          const paramAttToken = searchParams.get('att') || searchParams.get('attemptId');
          const decodedAttId = decodeSecureToken('ATT', paramAttToken);
          const paramAttemptNum = searchParams.get('attempt');

          let initialIdx = 0;
          if (decodedAttId && atts.length > 0) {
            const foundIdx = atts.findIndex((a) => String(a.attempt_id) === String(decodedAttId));
            if (foundIdx >= 0) initialIdx = foundIdx;
          } else if (paramAttemptNum && !isNaN(paramAttemptNum)) {
            const numIdx = Number(paramAttemptNum) - 1;
            if (numIdx >= 0 && numIdx < atts.length) initialIdx = numIdx;
          }

          setSelectedAttemptIndex(initialIdx);
        }
      } catch (err) {
        console.warn('Error fetching Form 3 attempts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [rawLrn, langCode]);

  // Sync state changes back to URL search params using secured token
  const handleSelectAttempt = (index) => {
    setSelectedAttemptIndex(index);
    const targetAttempt = attempts[index];
    if (targetAttempt) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('attemptId');
          next.delete('attempt');
          if (targetAttempt.attempt_id) {
            next.set('att', encodeSecureToken('ATT', targetAttempt.attempt_id));
          } else {
            next.set('attempt', String(index + 1));
          }
          return next;
        },
        { replace: true }
      );
    }
  };

  useEffect(() => {
    if (attempts.length > 0 && attempts[selectedAttemptIndex]) {
      const att = attempts[selectedAttemptIndex];
      const dateObj = att.completed_at || att.created_at;
      const formattedDate = dateObj
        ? new Date(dateObj).toLocaleDateString('fil-PH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

      const readTimeSec = Number(att.reading_time_seconds || 0);
      const readTimeMin = readTimeSec > 0 ? (readTimeSec / 60).toFixed(2) : '0.00';
      const readTimeDisplay = readTimeSec > 0 ? `${readTimeMin} minuto (${readTimeSec} segundo)` : '0.00 minuto';

      const rawComp = att.comprehension_raw_score !== undefined && att.comprehension_raw_score !== null
        ? Number(att.comprehension_raw_score)
        : Number(att.comprehension_score || 0);
      const totalItems = att.comprehension_total_items || (att.answers && att.answers.length > 0 ? att.answers.length : 7);
      const compMarka = rawComp > totalItems ? Math.round((rawComp / 100) * totalItems) : Math.round(rawComp);
      const compPct = Math.round(
        Number(
          att.comprehension_percentage !== undefined && att.comprehension_percentage !== null
            ? att.comprehension_percentage
            : (totalItems > 0 ? (compMarka / totalItems) * 100 : 0)
        )
      );

      const rawSet = (att.passage_set || 'A').toString().trim();
      const cleanSet = rawSet.replace(/^set\s+/i, '');

      setRecord({
        passageTitle: att.passage_title ? `"${att.passage_title}"` : '"Pangalan ng Teksto"',
        passageText: att.passage_text || '',
        level: att.passage_grade_level || 'Grade Level',
        wordCount: Number(att.word_count || 0),
        testType: (att.assessment_period || 'pre_test').toLowerCase().includes('post') ? 'Post-Test' : 'Pre-Test',
        set: cleanSet || 'A',
        date: formattedDate,
        readingTimeMinutes: readTimeMin,
        readingRateWpm: String(Math.round(Number(att.words_per_minute || att.reading_rate_wpm || 0))),
        compMarka: compMarka,
        compTotal: totalItems,
        compPercentage: compPct,
        compLevel: att.comprehension_level || (compPct >= 80 ? 'Independent' : compPct >= 59 ? 'Instructional' : 'Frustration'),
        answers: att.answers || [],
        miscues: buildDefaultMiscues(att),
        rawMiscues: att.rawMiscues || att.verified_miscues_json || att.ai_miscues_json || [],
        overallProfile: att.overall_profile || 'Pending',
        stepNumber: att.adaptive_step_number || (selectedAttemptIndex + 1),
      });
    } else {
      setRecord({
        passageTitle: '',
        passageText: '',
        level: '—',
        wordCount: 0,
        testType: 'Pre-Test',
        set: '—',
        date: '—',
        readingTimeMinutes: '0.00',
        readingRateWpm: '0',
        compMarka: 0,
        compTotal: 7,
        compPercentage: 0,
        compLevel: '—',
        answers: [],
        miscues: buildDefaultMiscues(null),
        rawMiscues: [],
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

  const formTitleMap = {
    'form-3a': 'Markahang Papel ng Panggradong Lebel na Teksto (Filipino)',
    'form-3b': 'Graded Passage Rating Sheet (English)',
    'form-4': 'RUNNING RECORD FORM',
  };

  const formTitle = formTitleMap[formKey] || 'Markahang Papel ng Panggradong Lebel na Teksto';
  const pageFormCode = isTagalog ? 'PHIL-IRI FORM 3A' : 'PHIL-IRI FORM 3B';

  // Vector PDF export: preserves selectable text and the official Form 3 layout.
  const handleDownloadPDF = () => {
    if (!record) return;

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const border = [156, 163, 175];
      const gray = [212, 212, 212];
      const lightGray = [240, 240, 240];

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

      const writeText = (text, x, y, { size = 8, bold = false, italic = false, align = 'left' } = {}) => {
        const tokens = String(text ?? '').split(/(✓)/);
        const pieces = tokens.map((part) => {
          if (part === '✓') {
            const width = size * 0.45;
            return { isCheck: true, width, size };
          }
          pdf.setFont('helvetica', italic ? 'italic' : bold ? 'bold' : 'normal');
          pdf.setFontSize(size);
          return { isCheck: false, value: part, width: pdf.getTextWidth(part), font: 'helvetica', style: italic ? 'italic' : bold ? 'bold' : 'normal', size };
        });
        const totalWidth = pieces.reduce((sum, p) => sum + p.width, 0);
        let cursor = align === 'center' ? x - totalWidth / 2 : align === 'right' ? x - totalWidth : x;
        pieces.forEach((part) => {
          if (part.isCheck) {
            drawVectorCheckmark(pdf, cursor + part.width / 2, y - part.size * 0.08, part.size * 0.42, [16, 124, 65], 0.35);
            cursor += part.width;
          } else {
            pdf.setFont(part.font, part.style);
            pdf.setFontSize(part.size);
            pdf.text(part.value, cursor, y);
            cursor += part.width;
          }
        });
      };

      const drawCell = (x, y, width, height, text = '', options = {}) => {
        if (options.fill) {
          pdf.setFillColor(...options.fill);
          pdf.rect(x, y, width, height, 'F');
        }
        pdf.setDrawColor(...border);
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, width, height);
        pdf.setTextColor(...(options.color || [17, 24, 39]));
        const size = options.size || 8;
        const lines = text === '' ? [] : pdf.splitTextToSize(String(text), Math.max(3, width - 3));
        const lineHeight = size * 0.43;
        const startY = y + (height - lines.length * lineHeight) / 2 + lineHeight * 0.78;
        lines.forEach((line, index) => {
          const align = options.align || 'center';
          writeText(line, align === 'left' ? x + 1.8 : align === 'right' ? x + width - 1.8 : x + width / 2, startY + lineHeight * index, { ...options, size, align });
        });
      };

      const drawMetadataLine = (label, value, x, y, width) => {
        pdf.setTextColor(17, 24, 39);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.text(label, x, y);
        const labelWidth = pdf.getTextWidth(label);
        const lineStart = x + labelWidth + 2;
        writeText(value || '—', lineStart + 1, y, { size: 7.5, bold: true });
        pdf.setDrawColor(55, 65, 81);
        pdf.setLineWidth(0.25);
        pdf.line(lineStart, y + 1, x + width, y + 1);
      };

      const drawCheckbox = (x, y, checked) => {
        const size = 3.1;
        pdf.setDrawColor(17, 24, 39);
        pdf.setLineWidth(0.35);
        pdf.rect(x, y, size, size);
        if (checked) {
          drawVectorCheckmark(pdf, x + size / 2, y + size / 2 + 0.1, size * 0.7, [17, 24, 39], 0.38);
        }
      };

      const drawDocumentHeader = () => {
        pdf.setTextColor(55, 65, 81);
        writeText(pageFormCode, pageWidth - margin, 11, { size: 8, bold: true, align: 'right' });
        writeText(formTitle.toUpperCase(), pageWidth / 2, 17, { size: 10, bold: true, align: 'center' });
        writeText(isTagalog ? 'Panimulang Pagtatasa sa Filipino' : 'Pre-Test Assessment in English', pageWidth / 2, 22, { size: 8, bold: true, align: 'center' });
        if (record.set !== '—' && record.level !== '—') {
          writeText(`Set ${record.set} (${record.level})`, pageWidth / 2, 27, { size: 8, bold: true, align: 'center' });
        }

        drawMetadataLine('Pangalan:', studentDisplay.name, margin, 36, 82);
        drawMetadataLine('Edad:', studentDisplay.age, margin + 87, 36, 34);
        drawMetadataLine('Baitang/Seksiyon:', `${studentDisplay.grade || '—'}-${studentDisplay.section || '—'}`, margin + 126, 36, contentWidth - 126);
        drawMetadataLine('Paaralan:', studentDisplay.school, margin, 43, 122);
        drawMetadataLine('Guro:', studentDisplay.teacher, margin + 127, 43, contentWidth - 127);

        writeText('Pre-Test:', margin, 50.5, { size: 6.5, bold: true });
        drawCheckbox(margin + 15.5, 47.7, record.testType === 'Pre-Test');
        writeText('Post test:', margin + 24, 50.5, { size: 6.5, bold: true });
        drawCheckbox(margin + 39.5, 47.7, record.testType === 'Post-Test');
        drawMetadataLine('Level:', record.level, margin + 56, 51, 35);
        drawMetadataLine('Set:', record.set, margin + 96, 51, 28);
        drawMetadataLine('Petsa:', record.date, margin + 129, 51, contentWidth - 129);
      };

      drawDocumentHeader();
      let y = 58;
      const pdfPassageText = record.passageText || '';
      const pdfPassageTitle = pdfPassageText.trim() ? record.passageTitle : '';
      drawCell(margin, y, contentWidth, 8, pdfPassageTitle, { size: 9, bold: true });
      y += 8;

      const miscueStyles = {
        omission: { color: [225, 29, 72], code: 'OMI' },
        substitution: { color: [217, 119, 6], code: 'SUB' },
        mispronunciation: { color: [234, 88, 12], code: 'MIS' },
        insertion: { color: [37, 99, 235], code: 'INS' },
        repetition: { color: [79, 70, 229], code: 'REP' },
        transposition: { color: [13, 148, 136], code: 'TRA' },
        reversal: { color: [124, 58, 237], code: 'REV' },
        self_correction: { color: [5, 150, 105], code: 'SC' },
      };
      const taggedMiscues = record.rawMiscues || [];
      // Compact A4 layout: preserves a readable one-page Form 3 for standard passages.
      const passageFontSize = 6.5;
      const passageLineHeight = 4.5;
      const richPassageLines = [[]];
      let globalWordPosition = 0;
      let currentLineWidth = 0;
      const addPassageSegment = (text, options = {}) => {
        pdf.setFont('helvetica', options.bold ? 'bold' : 'normal');
        pdf.setFontSize(options.size || passageFontSize);
        const segmentWidth = pdf.getTextWidth(text);
        if (currentLineWidth > 0 && currentLineWidth + segmentWidth > contentWidth - 8) {
          richPassageLines.push([]);
          currentLineWidth = 0;
        }
        richPassageLines[richPassageLines.length - 1].push({ text, ...options, width: segmentWidth });
        currentLineWidth += segmentWidth;
      };

      pdfPassageText.split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          if (token.includes('\n')) {
            richPassageLines.push([]);
            currentLineWidth = 0;
          } else {
            addPassageSegment(' ');
          }
          return;
        }
        globalWordPosition += 1;
        const miscue = taggedMiscues.find((item) => Number(item.word_position) === globalWordPosition);
        const type = (miscue?.miscue_type || miscue?.type || '').toLowerCase();
        const style = miscueStyles[type];
        addPassageSegment(token, style ? { bold: true, color: style.color, underline: type === 'omission' } : {});
        if (style) {
          const spokenWord = miscue.spoken_word ? `: "${miscue.spoken_word}"` : '';
          addPassageSegment(` [${style.code}${spokenWord}]`, { bold: true, color: style.color, size: 6.5 });
        }
      });
      const printablePassageLines = richPassageLines.filter((line) => line.length > 0).slice(0, 62);
      const passageHeight = Math.max(70, Math.min(115, printablePassageLines.length * passageLineHeight + 12));
      drawCell(margin, y, contentWidth, passageHeight, '', { size: 7.5 });
      // Keep the title inside the same continuous passage box; remove the internal divider.
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.45);
      pdf.line(margin + 0.15, y, margin + contentWidth - 0.15, y);
      printablePassageLines.forEach((line, index) => {
        let cursor = margin + 4;
        line.forEach((segment) => {
          pdf.setTextColor(...(segment.color || [31, 41, 55]));
          pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
          pdf.setFontSize(segment.size || passageFontSize);
          pdf.text(segment.text, cursor, y + 6 + index * passageLineHeight);
          if (segment.underline) {
            pdf.setDrawColor(...segment.color);
            pdf.setLineWidth(0.25);
            pdf.line(cursor, y + 6.7 + index * passageLineHeight, cursor + segment.width, y + 6.7 + index * passageLineHeight);
          }
          cursor += segment.width;
        });
      });
      y += passageHeight;
      drawCell(margin, y, contentWidth, 10, '', { size: 6.5 });
      writeText(`${isTagalog ? 'Level' : 'Level'}: ${record.level}`, margin + contentWidth - 4, y + 4, { size: 6.8, bold: true, align: 'right' });
      writeText(`${isTagalog ? 'Bilang ng mga salita' : 'Number of words'}: ${record.wordCount}`, margin + contentWidth - 4, y + 7.5, { size: 6.8, bold: true, align: 'right' });
      y += 13;
      // Keep Form 3 continuous. A new page is added only when the remaining page area
      // cannot hold the first complete assessment block.
      if (y + 46 > pageHeight - margin) {
        pdf.addPage();
        y = 12;
      }
      drawCell(margin, y, contentWidth, 6, 'PART A: PAGTATASA SA PAG-UNAWA (COMPREHENSION) & RATE NG PAGBASA', { fill: gray, size: 6.5, bold: true, align: 'left' });
      y += 6;
      const metricWidth = contentWidth / 4;
      const metricHeaders = ['Kabuuang Oras ng Pagbasa', 'Rate ng Pagbasa (WPM)', 'Marka sa Pag-unawa', 'Antas ng Pag-unawa'];
      const metricValues = [`${record.readingTimeMinutes} minuto`, `${record.readingRateWpm} salita / minuto`, `${record.compMarka} / ${record.compTotal || 7} (${record.compPercentage}%)`, record.compLevel];
      metricHeaders.forEach((header, index) => drawCell(margin + metricWidth * index, y, metricWidth, 8, header, { fill: lightGray, size: 5.5, bold: true }));
      y += 8;
      metricValues.forEach((value, index) => {
        const fill = index === 3
          ? record.compLevel === 'Independent' ? [209, 250, 229] : record.compLevel === 'Instructional' ? [254, 243, 199] : [255, 228, 230]
          : null;
        drawCell(margin + metricWidth * index, y, metricWidth, 7, value, { fill, size: 6, bold: true });
      });
      y += 10;

      const answers = record.answers || [];
      const totalQuestions = record.compTotal || answers.length;
      const answerRows = Math.ceil(totalQuestions / 2);
      for (let index = 0; index < answerRows; index += 1) {
        [0, 1].forEach((column) => {
          const number = index + 1 + column * answerRows;
          if (number > totalQuestions) return;
          const answer = answers.find((item) => Number(item.number) === number);
          const value = answer?.letter || (answer?.answer_text?.length === 1 ? answer.answer_text.toLowerCase() : '');
          writeText(`${number}.`, margin + 8 + column * 85, y + 3, { size: 6.5, bold: true, align: 'right' });
          pdf.setDrawColor(31, 41, 55);
          pdf.line(margin + 12 + column * 85, y + 3.8, margin + 67 + column * 85, y + 3.8);
          writeText(value, margin + 39 + column * 85, y + 3, { size: 6.5, bold: true, align: 'center' });
        });
        y += 5;
      }
      y += 4;

      const partBHeight = 6 + 8 + record.miscues.length * 5.6 + 4 * 6;
      if (y + partBHeight > pageHeight - margin) {
        pdf.addPage();
        y = 12;
      }

      drawCell(margin, y, contentWidth, 6, 'PART B: WORD READING (PAGBASA) — URI AT BILANG NG MALI (MISCUES)', { fill: gray, size: 6.5, bold: true, align: 'left' });
      y += 6;
      const numberWidth = 12;
      const typeWidth = 118;
      const countWidth = contentWidth - numberWidth - typeWidth;
      drawCell(margin, y, numberWidth, 8, '#', { fill: gray, size: 6, bold: true });
      drawCell(margin + numberWidth, y, typeWidth, 8, 'Types of Miscues\n(Uri ng Mali)', { fill: [226, 226, 226], size: 5.7, bold: true, align: 'left' });
      drawCell(margin + numberWidth + typeWidth, y, countWidth, 8, 'Number of Miscues\n(Bilang ng Salitang mali ang basa)', { fill: [226, 226, 226], size: 5.2, bold: true });
      y += 8;
      record.miscues.forEach((miscue) => {
        drawCell(margin, y, numberWidth, 5.6, miscue.id, { fill: [234, 234, 234], size: 6, bold: true });
        drawCell(margin + numberWidth, y, typeWidth, 5.6, `${miscue.nameEn} (${miscue.nameFil})`, { size: 5.8, align: 'left' });
        drawCell(margin + numberWidth + typeWidth, y, countWidth, 5.6, miscue.count, { size: 6, bold: true });
        y += 5.6;
      });
      const summaryRows = [
        ['Total Miscues (Kabuuan):', totalMiscues, lightGray],
        ['Number of Words in the Passage (Bilang ng Salita):', record.wordCount, null],
        ['Word Reading Score (% ng Pagbasa):', `${wordReadingScore}%`, null],
        [
          'Word Reading Level (Antas ng Pagbasa):',
          wordReadingLevel,
          wordReadingLevel === 'INDEPENDENT'
            ? [16, 124, 65]
            : wordReadingLevel === 'INSTRUCTIONAL'
            ? [217, 119, 6]
            : wordReadingLevel === 'FRUSTRATION'
            ? [190, 24, 93]
            : lightGray,
        ],
      ];
      summaryRows.forEach(([label, value, fill], index) => {
        const hasReadingLevel = wordReadingLevel !== '—';
        const color = index === summaryRows.length - 1 && fill && hasReadingLevel ? [255, 255, 255] : [17, 24, 39];
        drawCell(margin, y, numberWidth + typeWidth, 6, label, { fill, color, size: 6, bold: true, align: 'right' });
        drawCell(margin + numberWidth + typeWidth, y, countWidth, 6, value, { fill, color, size: 6, bold: true });
        y += 6;
      });

      pdf.save(`${pageFormCode.replaceAll(' ', '_')}_${studentDisplay.lrn || 'student'}_Attempt${selectedAttemptIndex + 1}.pdf`);
      triggerToast(`Downloaded ${pageFormCode} as PDF.`);
    } catch (error) {
      console.error('Failed to generate Form 3 PDF:', error);
      triggerToast('Failed to generate the PDF file.', 'error');
    }
  };

  const studentDisplay = studentInfo || {
    name: '—',
    lrn: rawLrn,
    grade: '—',
    section: '—',
    age: '—',
    school: '—',
    teacher: '—',
  };

  // Export to Excel (.xlsx) using ExcelJS matching Web UI exact layout
  const handleExportXLSX = async () => {
    if (!record) return;
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheetName = isTagalog ? 'Phil-IRI Form 3A' : 'Phil-IRI Form 3B';
      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
        pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      // Borders & Color Fills matching Web UI
      const borderThin = {
        top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      };

      const borderUnderline = {
        bottom: { style: 'thin', color: { argb: 'FF374151' } },
      };

      const fillHeaderBanner = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D4' } }; // #d4d4d4
      const fillSubHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E2E2' } };    // #e2e2e2
      const fillLightGray = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };    // #f0f0f0
      const fillDarkGrayNumber = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };// #eaeaea

      // Level Profile colors
      let levelFillColor = 'FF107C41'; // Green default
      if (wordReadingLevel === 'INSTRUCTIONAL') levelFillColor = 'D97706'; // Amber-600
      else if (wordReadingLevel === 'FRUSTRATION') levelFillColor = 'BE123C'; // Rose-700
      const fillLevelBadge = { type: 'pattern', pattern: 'solid', fgColor: { argb: levelFillColor } };

      let compLevelFill = 'D1FAE5'; // Emerald-100
      let compLevelText = '065F46'; // Emerald-800
      if (record.compLevel === 'Instructional') {
        compLevelFill = 'FEF3C7'; // Amber-100
        compLevelText = '92400E'; // Amber-800
      } else if (record.compLevel === 'Frustration') {
        compLevelFill = 'FFE4E6'; // Rose-100
        compLevelText = '9F1239'; // Rose-800
      }

      // Column widths (Proportionately balanced to match web grid)
      // A: Label (Pangalan/Paaralan/Pre-Test)
      // B: Name/School
      // C: Label (Edad/Level)
      // D: Value (Age/Level)
      // E: Label (Baitang/Guro/Set)
      // F: Value (Set) or merged with G/H
      // ── CLEAN 13-COLUMN DEPED GRID ──
      // Completely isolates every label and value into its own dedicated column
      // A (10) : Label (Pangalan: / Paaralan: / Pre-Test)
      // B (18) : Value 1 (Name part 1 / School part 1)
      // C (18) : Value 2 (Name part 2 / School part 2)
      // D (8)  : Label (Edad:)
      // E (12) : Value (Age / Level value)
      // F (8)  : Label (Level:)
      // G (12) : Value (Level)
      // H (16) : Label (Baitang/Seksiyon: / Guro:)
      // I (12) : Section / Teacher
      // J (8)  : Label (Set:) -> completely isolated!
      // K (10) : Value (Set) -> completely isolated!
      // L (8)  : Label (Petsa:) -> completely isolated!
      // M (20) : Value (Date) -> completely isolated!
      worksheet.columns = [
        { width: 11 }, // A - Pangalan: / Paaralan: / Pre-Test:
        { width: 18 }, // B - Pangalan / Paaralan
        { width: 18 }, // C - Pangalan / Paaralan
        { width: 8 },  // D - Edad:
        { width: 12 }, // E - Edad value
        { width: 8 },  // F - Level:
        { width: 12 }, // G - Level value
        { width: 16 }, // H - Baitang/Seksiyon: / Guro:
        { width: 12 }, // I - Section / Teacher
        { width: 8 },  // J - Set:
        { width: 10 }, // K - Set value
        { width: 8 },  // L - Petsa:
        { width: 22 }, // M - Petsa value / Top Form Code / Miscues count
      ];

      // ── TOP MARGIN SPACING ──
      const rTopSpacer = worksheet.addRow([]);
      rTopSpacer.height = 14;

      // ── TOP BAR: ATTEMPT (LEFT) & FORM CODE (RIGHT) ──
      const attemptText = `ATTEMPT ${selectedAttemptIndex + 1} NG ${Math.max(1, attempts.length)}`;
      const page1Text = pageFormCode;

      // Col 1 (A..E) for attemptText, Col 8 (H..M) for page1Text
      const rTopBar = worksheet.addRow([attemptText, '', '', '', '', '', '', page1Text, '', '', '', '', '']);
      worksheet.mergeCells(`A${rTopBar.number}:E${rTopBar.number}`);
      worksheet.mergeCells(`H${rTopBar.number}:M${rTopBar.number}`);
      rTopBar.height = 22;

      rTopBar.getCell(1).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF107C41' } };
      rTopBar.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      rTopBar.getCell(8).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF374151' } };
      rTopBar.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      const rPostTopSpacer = worksheet.addRow([]);
      rPostTopSpacer.height = 10;

      // ── TITLES ──
      const rTitle = worksheet.addRow([isTagalog ? 'MARKAHANG PAPEL NG PANGGRADONG LEBEL NA TEKSTO' : 'GRADED PASSAGE RATING SHEET']);
      worksheet.mergeCells(`A${rTitle.number}:M${rTitle.number}`);
      rTitle.height = 24;
      rTitle.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF111827' } };
      rTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const rSub = worksheet.addRow([isTagalog ? 'Panimulang Pagtatasa sa Filipino' : 'Pre-Test Assessment in English']);
      worksheet.mergeCells(`A${rSub.number}:M${rSub.number}`);
      rSub.height = 20;
      rSub.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF4B5563' } };
      rSub.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const rSet = worksheet.addRow([`Set ${record.set} (${record.level})`]);
      worksheet.mergeCells(`A${rSet.number}:M${rSet.number}`);
      rSet.height = 20;
      rSet.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF111827' } };
      rSet.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const rMetaPreSpacer = worksheet.addRow([]);
      rMetaPreSpacer.height = 14;

      // ── OFFICIAL DEPED HEADER METADATA GRID (With Underlines matching Web) ──
      // Row 1:
      // A: "Pangalan:"
      // B..C: Student Name (Merged) -> underline
      // D: "Edad:"
      // E: Age -> underline
      // F..G: blank
      // H: "Baitang/Seksiyon:"
      // I..M: Section (Merged) -> underline
      const mRow1 = worksheet.addRow([
        'Pangalan:',
        studentDisplay.name,
        '',
        'Edad:',
        studentDisplay.age || '—',
        '',
        '',
        'Baitang/Seksiyon:',
        `${studentDisplay.grade}-${studentDisplay.section}`,
        '',
        '',
        '',
        ''
      ]);
      worksheet.mergeCells(`B${mRow1.number}:C${mRow1.number}`);
      worksheet.mergeCells(`I${mRow1.number}:M${mRow1.number}`);
      mRow1.height = 22;

      // Row 2:
      // A: "Paaralan:"
      // B..E: School (Merged) -> underline
      // F..G: blank
      // H: "Guro:"
      // I..M: Teacher (Merged) -> underline
      const mRow2 = worksheet.addRow([
        'Paaralan:',
        studentDisplay.school,
        '',
        '',
        '',
        '',
        '',
        'Guro:',
        studentDisplay.teacher,
        '',
        '',
        '',
        ''
      ]);
      worksheet.mergeCells(`B${mRow2.number}:E${mRow2.number}`);
      worksheet.mergeCells(`I${mRow2.number}:M${mRow2.number}`);
      mRow2.height = 22;

      // Row 3:
      // A..D: Pre-Test: [✓] Post test: [ ] (Merged A..D)
      // E: "Level:" (Col 5)
      // F..G: Level Value (Cols 6..7 merged) -> underline
      // H: "Set:" (Col 8)
      // I: Set Value (Col 9) -> underline
      // J: "Petsa:" (Col 10)
      // K..M: Date Value (Cols 11..13 merged) -> underline
      const isPre = (record.testType || 'Pre-Test').toLowerCase().includes('pre');
      const testCheckStr = isPre ? 'Pre-Test: [✓]   Post test: [ ]' : 'Pre-Test: [ ]   Post test: [✓]';

      const mRow3 = worksheet.addRow([
        testCheckStr,
        '',
        '',
        '',
        'Level:',
        record.level,
        '',
        'Set:',
        record.set,
        'Petsa:',
        record.date,
        '',
        ''
      ]);
      worksheet.mergeCells(`A${mRow3.number}:D${mRow3.number}`);
      worksheet.mergeCells(`F${mRow3.number}:G${mRow3.number}`);
      worksheet.mergeCells(`K${mRow3.number}:M${mRow3.number}`);
      mRow3.height = 22;

      // Clean styling matching web typography
      [mRow1, mRow2, mRow3].forEach((r) => {
        r.eachCell({ includeEmpty: true }, (c) => {
          c.font = { name: 'Arial', size: 9 };
          c.alignment = { vertical: 'middle' };
        });
      });

      // ── LABELS FORMATTING ──
      // Row 1 Labels
      mRow1.getCell(1).font = { name: 'Arial', size: 9, bold: true };
      mRow1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      mRow1.getCell(4).font = { name: 'Arial', size: 9, bold: true };
      mRow1.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

      mRow1.getCell(8).font = { name: 'Arial', size: 9, bold: true };
      mRow1.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      // Row 2 Labels
      mRow2.getCell(1).font = { name: 'Arial', size: 9, bold: true };
      mRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      mRow2.getCell(8).font = { name: 'Arial', size: 9, bold: true };
      mRow2.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      // Row 3 Labels
      mRow3.getCell(1).font = { name: 'Arial', size: 9, bold: true };
      mRow3.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      mRow3.getCell(5).font = { name: 'Arial', size: 9, bold: true };
      mRow3.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

      mRow3.getCell(8).font = { name: 'Arial', size: 9, bold: true };
      mRow3.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      mRow3.getCell(10).font = { name: 'Arial', size: 9, bold: true };
      mRow3.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };

      // ── VALUES WITH CLEAN SEPARATE UNDERLINE BORDERS ──
      // Row 1: Name (B..C)
      mRow1.getCell(2).border = borderUnderline;
      mRow1.getCell(3).border = borderUnderline;
      mRow1.getCell(2).font = { name: 'Arial', size: 9.5, bold: true };
      mRow1.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Row 1: Age (E)
      mRow1.getCell(5).border = borderUnderline;
      mRow1.getCell(5).font = { name: 'Arial', size: 9.5, bold: true };
      mRow1.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 1: Section (I..M)
      [9, 10, 11, 12, 13].forEach((col) => {
        mRow1.getCell(col).border = borderUnderline;
      });
      mRow1.getCell(9).font = { name: 'Arial', size: 9.5, bold: true };
      mRow1.getCell(9).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Row 2: School (B..E)
      [2, 3, 4, 5].forEach((col) => {
        mRow2.getCell(col).border = borderUnderline;
      });
      mRow2.getCell(2).font = { name: 'Arial', size: 9.5, bold: true };
      mRow2.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Row 2: Teacher (I..M)
      [9, 10, 11, 12, 13].forEach((col) => {
        mRow2.getCell(col).border = borderUnderline;
      });
      mRow2.getCell(9).font = { name: 'Arial', size: 9.5, bold: true };
      mRow2.getCell(9).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Row 3: Level Value (F..G)
      mRow3.getCell(6).border = borderUnderline;
      mRow3.getCell(7).border = borderUnderline;
      mRow3.getCell(6).font = { name: 'Arial', size: 9.5, bold: true };
      mRow3.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 3: Set Value (I)
      mRow3.getCell(9).border = borderUnderline;
      mRow3.getCell(9).font = { name: 'Arial', size: 9.5, bold: true };
      mRow3.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 3: Petsa Value (K..M)
      [11, 12, 13].forEach((col) => {
        mRow3.getCell(col).border = borderUnderline;
      });
      mRow3.getCell(11).font = { name: 'Arial', size: 9.5, bold: true };
      mRow3.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };

      // ── SPACER ROW BETWEEN METADATA HEADER & PASSAGE BOX ──
      const rMetaPostSpacer = worksheet.addRow([]);
      rMetaPostSpacer.height = 14;

      // ── PASSAGE BOX: OPTION 2 (NATIVE EXCEL RICHTEXT WITH INLINE MISCUE COLOR TAGS) ──
      const rPassTitle = worksheet.addRow([record.passageTitle]);
      worksheet.mergeCells(`A${rPassTitle.number}:M${rPassTitle.number}`);
      rPassTitle.height = 28;
      rPassTitle.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      rPassTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const startPassageRow = rPassTitle.number;
      const rawMiscueList = record.rawMiscues || [];
      const passageLines = (record.passageText || '').split('\n').filter((l) => l.trim().length > 0);

      // Color palette for ExcelJS RichText (ARGB)
      const MISCUE_COLORS = {
        omission: { color: { argb: 'FFE11D48' }, code: 'OMI' }, // Rose / Red
        substitution: { color: { argb: 'FFD97706' }, code: 'SUB' }, // Amber
        mispronunciation: { color: { argb: 'FFEA580C' }, code: 'MIS' }, // Orange
        insertion: { color: { argb: 'FF2563EB' }, code: 'INS' }, // Blue
        repetition: { color: { argb: 'FF4F46E5' }, code: 'REP' }, // Indigo
        transposition: { color: { argb: 'FF0D9488' }, code: 'TRA' }, // Teal
        reversal: { color: { argb: 'FF7C3AED' }, code: 'REV' }, // Violet
        self_correction: { color: { argb: 'FF059669' }, code: 'SC' }, // Emerald
      };

      let globalWordIndex = 0;

      passageLines.forEach((line) => {
        const rLine = worksheet.addRow([]);
        worksheet.mergeCells(`A${rLine.number}:M${rLine.number}`);
        const cell = rLine.getCell(1);

        const tokens = line.split(/(\s+)/);
        const richTextSegments = [];

        tokens.forEach((token) => {
          if (/^\s+$/.test(token)) {
            richTextSegments.push({
              text: token,
              font: { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } },
            });
            return;
          }

          const currentWordPos = ++globalWordIndex;
          const miscueTag = rawMiscueList.find((m) => Number(m.word_position) === currentWordPos);

          if (!miscueTag) {
            richTextSegments.push({
              text: token,
              font: { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } },
            });
          } else {
            const mType = (miscueTag.miscue_type || miscueTag.type || '').toLowerCase();
            const config = MISCUE_COLORS[mType] || MISCUE_COLORS.omission;
            const spoken = miscueTag.spoken_word ? ` "${miscueTag.spoken_word}"` : '';

            // Tagged word with bold & miscue color
            richTextSegments.push({
              text: token,
              font: { name: 'Arial', size: 10.5, bold: true, color: config.color, underline: mType === 'omission' },
            });

            // Inline miscue code badge & spoken word tag [CODE: "spoken"]
            richTextSegments.push({
              text: ` [${config.code}${spoken}]`,
              font: { name: 'Arial', size: 9, bold: true, color: config.color },
            });
          }
        });

        cell.value = { richText: richTextSegments };

        const lineLen = (line || '').length;
        const estLines = Math.max(1, Math.ceil(lineLen / 115));
        rLine.height = Math.max(24, estLines * 20);
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
      });

      // Footer Stats inside Passage Box (Level & Word Count)
      const rPassStats1 = worksheet.addRow(['', '', '', '', '', '', '', `Level: ${record.level}`, '', '', '', '', '']);
      worksheet.mergeCells(`H${rPassStats1.number}:M${rPassStats1.number}`);
      rPassStats1.height = 20;
      rPassStats1.getCell(8).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF1F2937' } };
      rPassStats1.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      const rPassStats2 = worksheet.addRow(['', '', '', '', '', '', '', `Bilang ng mga salita: ${record.wordCount}`, '', '', '', '', '']);
      worksheet.mergeCells(`H${rPassStats2.number}:M${rPassStats2.number}`);
      rPassStats2.height = 20;
      rPassStats2.getCell(8).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF1F2937' } };
      rPassStats2.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

      const endPassageRow = rPassStats2.number;

      // Draw Passage Box Outer Medium Border
      for (let rowIdx = startPassageRow; rowIdx <= endPassageRow; rowIdx++) {
        const currR = worksheet.getRow(rowIdx);
        for (let c = 1; c <= 13; c++) {
          const cell = currR.getCell(c);
          cell.border = {
            top: rowIdx === startPassageRow ? { style: 'medium', color: { argb: 'FF9CA3AF' } } : undefined,
            bottom: rowIdx === endPassageRow ? { style: 'medium', color: { argb: 'FF9CA3AF' } } : undefined,
            left: c === 1 ? { style: 'medium', color: { argb: 'FF9CA3AF' } } : undefined,
            right: c === 13 ? { style: 'medium', color: { argb: 'FF9CA3AF' } } : undefined,
          };
        }
      }

      // ── PAGE BREAK & PROPER SPACING BETWEEN SECTIONS ──
      const rPageBreakSpacer2 = worksheet.addRow([]);
      rPageBreakSpacer2.height = 16;
      rPageBreakSpacer2.pageBreak = true; // Clean printable page separation

      const rPartAPreSpacer = worksheet.addRow([]);
      rPartAPreSpacer.height = 16;

      // ── PART A: PAGTATASA SA PAG-UNAWA & RATE NG PAGBASA ──
      const rPartAHeader = worksheet.addRow(['PART A: PAGTATASA SA PAG-UNAWA (COMPREHENSION) & RATE NG PAGBASA']);
      worksheet.mergeCells(`A${rPartAHeader.number}:M${rPartAHeader.number}`);
      rPartAHeader.height = 22;
      rPartAHeader.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };
      rPartAHeader.getCell(1).fill = fillHeaderBanner;
      rPartAHeader.getCell(1).alignment = { vertical: 'middle', indent: 1 };
      for (let c = 1; c <= 13; c++) rPartAHeader.getCell(c).border = borderThin;

      // Part A Table Column Headers (Merged across A..C, D..F, G..I, J..M)
      const rPartAColHead = worksheet.addRow([
        'Kabuuang Oras ng Pagbasa', '', '',
        'Rate ng Pagbasa (WPM)', '', '',
        'Marka sa Pag-unawa', '', '',
        'Antas ng Pag-unawa', '', '', ''
      ]);
      worksheet.mergeCells(`A${rPartAColHead.number}:C${rPartAColHead.number}`);
      worksheet.mergeCells(`D${rPartAColHead.number}:F${rPartAColHead.number}`);
      worksheet.mergeCells(`G${rPartAColHead.number}:I${rPartAColHead.number}`);
      worksheet.mergeCells(`J${rPartAColHead.number}:M${rPartAColHead.number}`);
      rPartAColHead.height = 22;

      rPartAColHead.eachCell({ includeEmpty: true }, (c) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.fill = fillLightGray;
        c.border = borderThin;
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Part A Table Data
      const rPartAData = worksheet.addRow([
        `${record.readingTimeMinutes} minuto`, '', '',
        `${record.readingRateWpm} salita / minuto`, '', '',
        `${record.compMarka} / ${record.compTotal || 7} (${record.compPercentage}%)`, '', '',
        record.compLevel, '', '', ''
      ]);
      worksheet.mergeCells(`A${rPartAData.number}:C${rPartAData.number}`);
      worksheet.mergeCells(`D${rPartAData.number}:F${rPartAData.number}`);
      worksheet.mergeCells(`G${rPartAData.number}:I${rPartAData.number}`);
      worksheet.mergeCells(`J${rPartAData.number}:M${rPartAData.number}`);
      rPartAData.height = 26;

      rPartAData.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.font = { name: 'Arial', size: 9.5, bold: true };
        c.border = borderThin;
        c.alignment = { horizontal: 'center', vertical: 'middle' };

        // Color cell for Antas ng Pag-unawa
        if (colIdx >= 10) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: compLevelFill } };
          c.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: compLevelText } };
        }
      });

      // Student Comprehension Answers (Below Part A Table - matching Web UI)
      const ansList = record.answers || [];
      const totalQuestions = record.compTotal || (ansList.length > 0 ? ansList.length : 0);

      if (totalQuestions > 0) {
        worksheet.addRow([]); // Blank spacer inside Part A
        const leftLimit = totalQuestions > 4 ? 4 : totalQuestions;
        const leftColItems = Array.from({ length: leftLimit }, (_, i) => i + 1).map((num) => {
          const found = ansList.find((a) => a.number === num);
          const letter = found?.letter || (found?.answer_text && found.answer_text.length === 1 ? found.answer_text.toLowerCase() : '');
          return { num, letter: letter || '' };
        });

        const rightColItems =
          totalQuestions > 4
            ? Array.from({ length: totalQuestions - 4 }, (_, i) => i + 5).map((num) => {
                const found = ansList.find((a) => a.number === num);
                const letter = found?.letter || (found?.answer_text && found.answer_text.length === 1 ? found.answer_text.toLowerCase() : '');
                return { num, letter: letter || '' };
              })
            : [];

        const maxRows = Math.max(leftColItems.length, rightColItems.length);
        for (let i = 0; i < maxRows; i++) {
          const left = leftColItems[i];
          const right = rightColItems[i];

          const rAns = worksheet.addRow([
            left ? `${left.num}.` : '',
            left ? (left.letter || '') : '',
            '',
            '',
            '',
            '',
            right ? `${right.num}.` : '',
            right ? (right.letter || '') : '',
            '',
            '',
            '',
            '',
            ''
          ]);

          worksheet.mergeCells(`B${rAns.number}:C${rAns.number}`);
          worksheet.mergeCells(`H${rAns.number}:I${rAns.number}`);
          rAns.height = 20;

          // Left answer item
          if (left) {
            rAns.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };
            rAns.getCell(1).alignment = { horizontal: 'right', vertical: 'bottom' };

            rAns.getCell(2).font = { name: 'Arial', size: 9.5, bold: true };
            rAns.getCell(2).alignment = { horizontal: 'center', vertical: 'bottom' };
            rAns.getCell(2).border = borderUnderline;
            rAns.getCell(3).border = borderUnderline;
          }

          // Right answer item
          if (right) {
            rAns.getCell(7).font = { name: 'Arial', size: 9.5, bold: true };
            rAns.getCell(7).alignment = { horizontal: 'right', vertical: 'bottom' };

            rAns.getCell(8).font = { name: 'Arial', size: 9.5, bold: true };
            rAns.getCell(8).alignment = { horizontal: 'center', vertical: 'bottom' };
            rAns.getCell(8).border = borderUnderline;
            rAns.getCell(9).border = borderUnderline;
          }
        }
      }

      worksheet.addRow([]); // Blank spacer

      // ── PART B: WORD READING (PAGBASA) — URI AT BILANG NG MALI (MISCUES) ──
      const rPartBHeader = worksheet.addRow(['PART B: WORD READING (PAGBASA) — URI AT BILANG NG MALI (MISCUES)']);
      worksheet.mergeCells(`A${rPartBHeader.number}:M${rPartBHeader.number}`);
      rPartBHeader.height = 22;
      rPartBHeader.getCell(1).font = { name: 'Arial', size: 9.5, bold: true };
      rPartBHeader.getCell(1).fill = fillHeaderBanner;
      rPartBHeader.getCell(1).alignment = { vertical: 'middle', indent: 1 };
      for (let c = 1; c <= 13; c++) rPartBHeader.getCell(c).border = borderThin;

      // Part B Col Headers (A: #, B..I: Types of Miscues, J..M: Number of Miscues)
      const rMiscueHeader = worksheet.addRow([
        '#',
        'Types of Miscues (Uri ng Mali)', '', '', '', '', '', '', '',
        'Number of Miscues\n(Bilang ng Salitang mali ang basa)', '', '', ''
      ]);
      worksheet.mergeCells(`B${rMiscueHeader.number}:I${rMiscueHeader.number}`);
      worksheet.mergeCells(`J${rMiscueHeader.number}:M${rMiscueHeader.number}`);
      rMiscueHeader.height = 42;

      rMiscueHeader.getCell(1).fill = fillHeaderBanner;
      rMiscueHeader.getCell(2).fill = fillSubHeader;
      rMiscueHeader.getCell(10).fill = fillSubHeader;

      rMiscueHeader.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.font = { name: 'Arial', size: 9, bold: true };
        c.border = borderThin;
        c.alignment = { horizontal: colIdx === 2 ? 'left' : 'center', vertical: 'middle', wrapText: true };
      });

      // Miscue Rows (1 to 7)
      record.miscues.forEach((m) => {
        const row = worksheet.addRow([
          m.id,
          `${m.nameEn} (${m.nameFil})`, '', '', '', '', '', '', '',
          Number(m.count) || 0, '', '', ''
        ]);
        worksheet.mergeCells(`B${row.number}:I${row.number}`);
        worksheet.mergeCells(`J${row.number}:M${row.number}`);
        row.height = 21;

        row.eachCell({ includeEmpty: true }, (c, colIdx) => {
          c.border = borderThin;
          if (colIdx === 1) {
            c.fill = fillDarkGrayNumber;
            c.font = { name: 'Arial', size: 9, bold: true };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colIdx >= 2 && colIdx <= 9) {
            c.font = { name: 'Arial', size: 9.5 };
            c.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          } else if (colIdx >= 10) {
            c.font = { name: 'Arial', size: 9.5, bold: true };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Total Miscues Row (Cols A..I merged, Cols J..M for number)
      const rTotal = worksheet.addRow([
        'Total Miscues (Kabuuan):', '', '', '', '', '', '', '', '',
        totalMiscues, '', '', ''
      ]);
      worksheet.mergeCells(`A${rTotal.number}:I${rTotal.number}`);
      worksheet.mergeCells(`J${rTotal.number}:M${rTotal.number}`);
      rTotal.height = 22;
      rTotal.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.border = borderThin;
        c.font = { name: 'Arial', size: 9.5, bold: true };
        if (colIdx <= 9) {
          c.fill = fillLightGray;
          c.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        } else if (colIdx >= 10) {
          c.fill = fillLightGray;
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Number of Words in Passage Row (Cols A..I merged, Cols J..M for count)
      const rWords = worksheet.addRow([
        'Number of Words in the Passage (Bilang ng Salita):', '', '', '', '', '', '', '', '',
        record.wordCount, '', '', ''
      ]);
      worksheet.mergeCells(`A${rWords.number}:I${rWords.number}`);
      worksheet.mergeCells(`J${rWords.number}:M${rWords.number}`);
      rWords.height = 22;
      rWords.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.border = borderThin;
        c.font = { name: 'Arial', size: 9.5, bold: true };
        if (colIdx <= 9) {
          c.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        } else if (colIdx >= 10) {
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Word Reading Score Row (Cols A..I merged, Cols J..M for percentage)
      const rScore = worksheet.addRow([
        'Word Reading Score (% ng Pagbasa):', '', '', '', '', '', '', '', '',
        `${wordReadingScore}%`, '', '', ''
      ]);
      worksheet.mergeCells(`A${rScore.number}:I${rScore.number}`);
      worksheet.mergeCells(`J${rScore.number}:M${rScore.number}`);
      rScore.height = 22;
      rScore.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.border = borderThin;
        c.font = { name: 'Arial', size: 9.5, bold: true };
        if (colIdx <= 9) {
          c.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        } else if (colIdx >= 10) {
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Word Reading Level Badge (Cols A..I merged, Cols J..M for Level)
      const rLevel = worksheet.addRow([
        'Word Reading Level (Antas ng Pagbasa):', '', '', '', '', '', '', '', '',
        wordReadingLevel, '', '', ''
      ]);
      worksheet.mergeCells(`A${rLevel.number}:I${rLevel.number}`);
      worksheet.mergeCells(`J${rLevel.number}:M${rLevel.number}`);
      rLevel.height = 26;

      rLevel.eachCell({ includeEmpty: true }, (c, colIdx) => {
        c.fill = fillLevelBadge;
        c.border = borderThin;
        c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        if (colIdx <= 9) {
          c.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        } else if (colIdx >= 10) {
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Write and download `.xlsx` file
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
          {loading ? (
            <div className="h-4 w-72 rounded bg-gray-200 animate-pulse mt-1" />
          ) : (
            <p className="text-xs text-ink/60">
              {studentDisplay.name} ({studentDisplay.lrn}) — {attempts.length} Oral Assessment Attempt(s)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXLSX}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <DownloadSimple size={15} weight="bold" className="text-[#107c41]" />
            <span>Export .XLSX</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={loading || !record}
            className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-cream transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <DownloadSimple size={15} weight="bold" className="text-red-600" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Attempt Selector Skeleton / Bar */}
      {loading ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-ink/15 bg-white px-4 py-2.5 shadow-2xs animate-pulse">
          <div className="flex items-center gap-3 grow max-w-xl">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-8 grow rounded-lg bg-gray-200" />
          </div>
          <div className="h-6 w-32 rounded-full bg-gray-200" />
        </div>
      ) : (() => {
        const currentAtt = attempts.length > 0 ? attempts[selectedAttemptIndex] : null;
        const profile = currentAtt?.overall_profile || record?.overallProfile || '—';

        // Deduplicate attempts per passage key to avoid rendering duplicate records for the same passage level
        const deduplicateAttempts = (list) => {
          const map = new Map();
          list.forEach((att) => {
            const key = att.passage_id || `${att.passage_grade_level || ''}_${att.passage_set || ''}`;
            map.set(key, att);
          });
          return Array.from(map.values());
        };

        const preTestAttempts = deduplicateAttempts(
          attempts
            .map((att, originalIndex) => ({ ...att, originalIndex }))
            .filter((att) => !(att.assessment_period || '').toLowerCase().includes('post'))
        );

        const postTestAttempts = deduplicateAttempts(
          attempts
            .map((att, originalIndex) => ({ ...att, originalIndex }))
            .filter((att) => (att.assessment_period || '').toLowerCase().includes('post'))
        );

        return (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/15 bg-white px-4 py-2.5 shadow-2xs">
            <div className="flex items-center gap-3 grow max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-ink/60 flex items-center gap-1.5 shrink-0">
                <Microphone size={16} weight="bold" className="text-[#107c41]" /> Select Assessment Attempt:
              </span>
              <select
                id="attempt-select"
                value={attempts.length > 0 ? selectedAttemptIndex : 0}
                onChange={(e) => handleSelectAttempt(Number(e.target.value))}
                disabled={attempts.length === 0}
                className="grow rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 shadow-2xs focus:border-[#107c41] focus:outline-none focus:ring-1 focus:ring-[#107c41] cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {attempts.length === 0 ? (
                  <option value={0}>Wala pang Attempt (Malinis na Sheet)</option>
                ) : (
                  <>
                    {preTestAttempts.length > 0 && (
                      <optgroup label="── PRE-TEST ATTEMPTS ──">
                        {preTestAttempts.map((att, idx) => {
                          const rawSet = (att.passage_set || 'A').toString().trim();
                          const cleanSet = rawSet.replace(/^set\s+/i, '');
                          return (
                            <option key={att.attempt_id || att.originalIndex} value={att.originalIndex}>
                              Pre-Test (Attempt {idx + 1}: {att.passage_grade_level || 'Grade Level'}
                              {cleanSet ? `, Set ${cleanSet}` : ''}
                              {att.overall_profile ? ` — ${att.overall_profile}` : ''})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    {postTestAttempts.length > 0 && (
                      <optgroup label="── POST-TEST ATTEMPTS ──">
                        {postTestAttempts.map((att, idx) => {
                          const rawSet = (att.passage_set || 'A').toString().trim();
                          const cleanSet = rawSet.replace(/^set\s+/i, '');
                          return (
                            <option key={att.attempt_id || att.originalIndex} value={att.originalIndex}>
                              Post-Test (Attempt {idx + 1}: {att.passage_grade_level || 'Grade Level'}
                              {cleanSet ? `, Set ${cleanSet}` : ''}
                              {att.overall_profile ? ` — ${att.overall_profile}` : ''})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="font-semibold text-gray-500">Overall Level Profile:</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${
                  profile === 'Independent'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : profile === 'Instructional'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : profile === 'Frustration'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-ink/10 text-ink/60'
                }`}
              >
                {profile}
              </span>
            </div>
          </div>
        );
      })()}

      {showToast && (
        <ToastNotification
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {loading ? (
        <PhilIriForm3DetailSkeleton />
      ) : (
        /* CLEAN OFFICIAL DEPED EXCEL FORM TABLE UI CONTAINER */
        <div className="overflow-x-auto rounded-lg border border-gray-400 bg-white p-6 shadow-xs space-y-6">
          <div className="min-w-[850px]">
            {/* Sheet Top Form Header */}
            <div className="text-center space-y-0.5 mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                <span className="font-bold text-[#107c41]">
                  {attempts.length > 0
                    ? `ATTEMPT ${selectedAttemptIndex + 1} NG ${attempts.length}`
                    : 'ATTEMPT 0 NG 0'}
                </span>
                <span>{pageFormCode}</span>
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {isTagalog ? 'Markahang Papel ng Panggradong Lebel na Teksto' : 'Graded Passage Rating Sheet'}
              </h2>
              <p className="text-xs font-semibold text-gray-700">
                {isTagalog ? 'Panimulang Pagtatasa sa Filipino' : 'Pre-Test Assessment in English'}
              </p>
              {record.set !== '—' && record.level !== '—' && (
                <p className="text-xs font-bold text-gray-900">
                  Set {record.set} ({record.level})
                </p>
              )}
            </div>

            {/* Official DepEd Header Metadata Grid (Matching Form 1 & Form 2) */}
            <div className="space-y-2 text-xs text-gray-900 font-semibold mb-6 px-1 border-t border-b border-gray-300 py-3 bg-white">
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
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">Pre-Test:</span>
                  <div className="w-4 h-4 border-2 border-gray-900 flex items-center justify-center font-black text-xs bg-white select-none">
                    {record.testType === 'Pre-Test' ? '✓' : ''}
                  </div>
                  <span className="font-bold text-gray-900 ml-1">Post test:</span>
                  <div className="w-4 h-4 border-2 border-gray-900 flex items-center justify-center font-black text-xs bg-white select-none">
                    {record.testType === 'Post-Test' ? '✓' : ''}
                  </div>
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

            {/* Passage Box styled cleanly with Digital Miscue Badges (Matching Picture 2) */}
            <div id="form3-passage-box" className="mb-6 rounded border border-gray-400 bg-white p-5">
              <h5 className="text-center text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                {record.passageTitle}
              </h5>

              {/* Tagged Passage Text Container matching Review Page layout */}
              {(() => {
                const text = record.passageText || '';
                const lines = text.split('\n');
                const rawMiscueList = record.rawMiscues || [];

                const getChipStyles = (type) => {
                  switch (type) {
                    case 'omission':
                      return { chip: 'border-rose-300 bg-rose-50/70 text-rose-950', badge: 'bg-rose-50 text-rose-600 border-rose-300', annotation: 'text-rose-600 font-bold', code: 'OMI' };
                    case 'substitution':
                      return { chip: 'border-amber-300 bg-amber-50/70 text-amber-950', badge: 'bg-amber-50 text-amber-700 border-amber-300', annotation: 'text-amber-800 font-serif italic font-bold', code: 'SUB' };
                    case 'mispronunciation':
                      return { chip: 'border-orange-300 bg-orange-50/70 text-orange-950', badge: 'bg-orange-50 text-orange-700 border-orange-300', annotation: 'text-orange-800 font-serif italic font-bold', code: 'MIS' };
                    case 'insertion':
                      return { chip: 'border-blue-300 bg-blue-50/70 text-blue-950', badge: 'bg-blue-50 text-blue-600 border-blue-300', annotation: 'text-blue-700 font-serif font-bold', code: 'INS' };
                    case 'repetition':
                      return { chip: 'border-indigo-300 bg-indigo-50/70 text-indigo-950', badge: 'bg-indigo-50 text-indigo-600 border-indigo-300', annotation: 'text-indigo-700 font-bold', code: 'REP' };
                    case 'transposition':
                      return { chip: 'border-teal-300 bg-teal-50/70 text-teal-950', badge: 'bg-teal-50 text-teal-700 border-teal-300', annotation: 'text-teal-700 font-bold', code: 'TRA' };
                    case 'reversal':
                      return { chip: 'border-violet-300 bg-violet-50/70 text-violet-950', badge: 'bg-violet-50 text-violet-700 border-violet-300', annotation: 'text-violet-800 font-serif italic font-bold', code: 'REV' };
                    case 'self_correction':
                      return { chip: 'border-emerald-300 bg-emerald-50/70 text-emerald-950', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300', annotation: 'text-emerald-700 font-bold font-serif', code: 'SC' };
                    default:
                      return { chip: 'border-rose-300 bg-rose-50/70 text-rose-950', badge: 'bg-rose-50 text-rose-600 border-rose-300', annotation: 'text-rose-600 font-bold', code: 'OMI' };
                  }
                };

                const getAnnotation = (miscue) => {
                  const spoken = miscue?.spoken_word || '';
                  const mType = (miscue?.miscue_type || miscue?.type || '').toLowerCase();
                  switch (mType) {
                    case 'mispronunciation': return spoken || null;
                    case 'substitution':     return spoken || null;
                    case 'reversal':         return spoken || null;
                    case 'self_correction':  return 'SC';
                    case 'insertion':        return spoken ? `^ ${spoken}` : '^';
                    case 'repetition':       return '↩';
                    case 'transposition':    return '⌢';
                    default: return null;
                  }
                };

                let globalWordIndex = 0;

                return (
                  <div className="text-[14px] leading-[3.4] text-gray-900 font-sans px-2 py-2 select-none">
                    {lines.map((line, lineIdx) => {
                      if (!line.trim()) return <div key={lineIdx} className="h-3" />;
                      const tokens = line.split(/(\s+)/);

                      return (
                        <p key={lineIdx} className="leading-[3.4]">
                          {tokens.map((token, tokenIdx) => {
                            if (/^\s+$/.test(token)) {
                              return <span key={tokenIdx}>{token}</span>;
                            }

                            const currentWordPos = ++globalWordIndex;
                            const miscueTag = rawMiscueList.find((m) => Number(m.word_position) === currentWordPos);

                            if (!miscueTag) {
                              return <span key={tokenIdx}>{token}</span>;
                            }

                            const mType = (miscueTag.miscue_type || miscueTag.type || '').toLowerCase();
                            const theme = getChipStyles(mType);
                            const annotationText = getAnnotation(miscueTag);

                            return (
                              <span
                                key={tokenIdx}
                                className={`relative inline-flex items-center align-baseline px-2 py-0.5 mx-0.5 rounded-lg border text-sm font-medium ${theme.chip}`}
                                style={{
                                  verticalAlign: 'baseline',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                                title={`${mType.toUpperCase()}${miscueTag.spoken_word ? `: "${miscueTag.spoken_word}"` : ''}`}
                              >
                                {/* Annotation Text Positioned Above Word (Spoken Word or Symbol) */}
                                {annotationText && (
                                  <span
                                    className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap leading-none pointer-events-none font-semibold ${theme.annotation}`}
                                  >
                                    {annotationText}
                                  </span>
                                )}

                                <span className="inline-block leading-tight">{token}</span>

                                {/* Miscue Code Badge (OMI, MIS, SUB, INS, etc.) */}
                                <span
                                  className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border leading-none inline-flex items-center justify-center shrink-0 ${theme.badge}`}
                                >
                                  {theme.code}
                                </span>
                              </span>
                            );
                          })}
                        </p>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="mt-4 flex flex-col items-end space-y-0.5 border-t border-gray-300 pt-2 text-xs font-semibold text-gray-800">
                <span>Level: {record.level}</span>
                <span>Bilang ng mga salita: {record.wordCount}</span>
              </div>

            </div>

            {/* ── PART A & PART B SECTION ── */}
            <div className="mt-8 pt-4 border-t border-gray-300">

              {/* PART A: COMPREHENSION & READING RATE TABLE WITH STUDENT ANSWERS BELOW TABLE */}
              <div className="mb-6 border border-gray-400 bg-white">
                {/* PART A Header Banner */}
                <div className="bg-[#d4d4d4] text-gray-900 font-bold p-2 text-left uppercase border-b border-gray-400">
                  PART A: Pagtatasa sa Pag-unawa (Comprehension) & Rate ng Pagbasa
                </div>

                {/* Part A Metrics Table (ON TOP) */}
                <table className="w-full border-collapse text-xs font-sans border-b border-gray-400">
                  <thead>
                    <tr className="bg-[#f0f0f0] text-gray-800 font-semibold text-center border-b border-gray-400">
                      <th className="border-r border-gray-400 p-2 w-1/4">Kabuuang Oras ng Pagbasa</th>
                      <th className="border-r border-gray-400 p-2 w-1/4">Rate ng Pagbasa (WPM)</th>
                      <th className="border-r border-gray-400 p-2 w-1/4">Marka sa Pag-unawa</th>
                      <th className="p-2 w-1/4">Antas ng Pag-unawa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center font-bold text-gray-900 bg-white">
                      <td className="border-r border-gray-400 p-2.5">{record.readingTimeMinutes} minuto</td>
                      <td className="border-r border-gray-400 p-2.5">{record.readingRateWpm} salita / minuto</td>
                      <td className="border-r border-gray-400 p-2.5">
                        {record.compMarka} / {record.compTotal || 7} ({record.compPercentage}%)
                      </td>
                      <td
                        className={`p-2.5 uppercase font-black ${
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

                {/* Answers Section (BELOW THE TABLE) */}
                {(() => {
                  const totalQuestions = record.compTotal || (record.answers && record.answers.length > 0 ? record.answers.length : 0);
                  if (totalQuestions <= 0) return null;

                  const leftColLimit = totalQuestions > 4 ? 4 : totalQuestions;
                  const leftNums = Array.from({ length: leftColLimit }, (_, i) => i + 1);
                  const rightNums = totalQuestions > 4
                    ? Array.from({ length: totalQuestions - 4 }, (_, i) => i + 5)
                    : [];

                  return (
                    <div className="p-4 bg-white">
                      <div className={`grid ${rightNums.length > 0 ? 'grid-cols-2 gap-x-12' : 'grid-cols-1'} max-w-sm ml-4 text-xs font-sans`}>
                        {/* Left Column */}
                        <div className="space-y-2.5">
                          {leftNums.map((num) => {
                            const ansItem = (record.answers || []).find((a) => a.number === num);
                            const letter = ansItem?.letter || (ansItem?.answer_text && ansItem.answer_text.length === 1 ? ansItem.answer_text.toLowerCase() : '');
                            return (
                              <div key={num} className="flex items-end gap-2">
                                <span className="text-gray-900 font-bold text-xs w-4">{num}.</span>
                                <div className="w-28 border-b border-gray-800 text-center font-bold text-xs text-gray-900 pb-0.5 min-h-[18px]">
                                  {letter || '\u00A0'}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Column */}
                        {rightNums.length > 0 && (
                          <div className="space-y-2.5">
                            {rightNums.map((num) => {
                              const ansItem = (record.answers || []).find((a) => a.number === num);
                              const letter = ansItem?.letter || (ansItem?.answer_text && ansItem.answer_text.length === 1 ? ansItem.answer_text.toLowerCase() : '');
                              return (
                                <div key={num} className="flex items-end gap-2">
                                  <span className="text-gray-900 font-bold text-xs w-4">{num}.</span>
                                  <div className="w-28 border-b border-gray-800 text-center font-bold text-xs text-gray-900 pb-0.5 min-h-[18px]">
                                    {letter || '\u00A0'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                          {m.count}
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
