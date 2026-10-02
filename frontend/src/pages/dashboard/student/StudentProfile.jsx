import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { jsPDF } from 'jspdf';
import { Clock, Prohibit, UserSwitch, CaretLeft, CaretRight } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import StatCard from '../../../components/dashboard/progress/StatCard.jsx';
import AchievementActivityRow from '../../../components/dashboard/activity/AchievementActivityRow.jsx';
import BadgeCard from '../../../components/dashboard/student/BadgeCard.jsx';
import StoryRow from '../../../components/dashboard/student/StoryRow.jsx';
import { StudentProfileSkeleton } from '../../../components/common/Skeleton.jsx';
import { getToken } from '../../../lib/auth.js';
import { decodeSecureToken } from '../../../lib/securityToken.js';
import systemLogo from '../../../assets/logo/logo.png';

import { defaultBadges, defaultStories } from '../../../data/studentAchievements.js';

const ACHIEVEMENT_TABS = ['Phil-IRI Records', 'Badges', 'Stories'];

const BADGE_COLUMNS = 5;

function withPlaceholders(items) {
  if (items.length === 0) return items;
  const remainder = items.length % BADGE_COLUMNS;
  const missing = remainder === 0 ? 0 : BADGE_COLUMNS - remainder;
  const placeholders = Array.from({ length: missing }, (_, i) => ({
    id: `placeholder-${i}`,
    placeholder: true,
  }));
  return [...items, ...placeholders];
}

import { cacheService } from '../../../services/cacheService.js';

export default function StudentProfile() {
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Phil-IRI Records');
  const [profileLanguage, setProfileLanguage] = useState('fil');
  const [profilePeriod, setProfilePeriod] = useState('pre_test');
  
  const cacheKey = `student_profile_${lrn || rawLrn}`;
  const cachedData = cacheService.get(cacheKey);

  const [dbStudent, setDbStudent] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    let isMounted = true;
    const fetchStudent = async () => {
      try {
        const token = getToken();
        const targetLrn = lrn || rawLrn;
        if (!cachedData) setLoading(true);

        const res = await fetch(getApiUrl(`/api/teacher/students/${targetLrn}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success && data.student) {
          setDbStudent(data.student);
          cacheService.set(cacheKey, data.student, 120000); // 2 minutes TTL
        }
      } catch (err) {
        console.warn('Fetch student details notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudent();
    return () => { isMounted = false; };
  }, [lrn, rawLrn, cacheKey]);

  const student = dbStudent || {
    name: loading ? 'Loading profile...' : `Student (${lrn || ''})`,
    lrn: lrn || '',
    grade: '',
    section: 'Unassigned',
    level: 'Pending Evaluation',
  };
  const selectedAdaptiveProfile = (student.oralAdaptiveProfiles || []).find((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    return language === profileLanguage && String(profile.period || 'pre_test').toLowerCase() === profilePeriod;
  });
  const formatGrade = (value) => {
    if (!value) return '—';
    const grade = String(value).match(/\d+/)?.[0];
    return grade ? `Grade ${grade}` : String(value);
  };

  // Map real database badges or default badge assets (only unlocked badges)
  const badges = (student.badges && student.badges.length > 0)
    ? student.badges.map((b) => {
        const found = defaultBadges.find(
          (db) => db.name.toLowerCase() === (b.badgeName || b.name || '').toLowerCase() ||
                  db.id === (b.id || b.badge_id)
        );
        return {
          id: b.id || b.badge_id || b.badgeName,
          name: b.badgeName || b.name,
          image: b.iconPath ? getApiUrl(b.iconPath) : (found?.image || defaultBadges[0]?.image),
          description: b.description || found?.description,
        };
      })
    : [];

  // Map real database completed stories
  const stories = (student.stories && student.stories.length > 0)
    ? student.stories.map((s) => ({
        id: s.id,
        title: s.title,
        color: s.color || 'blue',
      }))
    : [];

  const activities = (student.activities && student.activities.length > 0)
    ? student.activities
        .filter((act) => act.status === 'done' || act.status === 'completed' || act.status === 'finished')
        .map((act) => ({
          ...act,
          onAction: (a) => {
            if (a.attemptId) {
              navigate(`/teacher/phil-iri-assessments/review/${a.attemptId}`);
            } else if (a.id) {
              navigate(`/teacher/phil-iri-assessments/view/${a.id}`);
            }
          },
        }))
    : [];
  const oralEvidence = activities
    .filter((activity) =>
      activity.assessmentType === 'oral'
      && (String(activity.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil') === profileLanguage
      && String(activity.assessmentPeriod || 'pre_test').toLowerCase() === profilePeriod
    )
    .sort((first, second) => new Date(first.completedAt || 0) - new Date(second.completedAt || 0));
  const evidenceAverage = (key) => oralEvidence.length
    ? Math.round(oralEvidence.reduce((total, activity) => total + Number(activity[key] || 0), 0) / oralEvidence.length)
    : 0;
  const buildDiagnosticEvidence = (profile, evidenceItems) => [
    ['Independent', 'independent', profile?.independentLevel, 'bg-emerald-50 text-emerald-800'],
    ['Instructional', 'instructional', profile?.instructionalLevel, 'bg-amber-50 text-amber-900'],
    ['Frustrational', 'frustrational', profile?.frustrationalLevel, 'bg-rose-50 text-rose-800'],
  ].map(([label, key, level, style]) => {
    const grade = String(level || '').match(/\d+/)?.[0];
    const resultPrefix = key === 'frustrational' ? 'frustr' : key;
    const evidence = evidenceItems.find((activity) =>
      grade && String(activity.passageGradeLevel || '').match(/\d+/)?.[0] === grade
      && (!activity.readingLevelResult || String(activity.readingLevelResult).toLowerCase().startsWith(resultPrefix))
    ) || evidenceItems.find((activity) => String(activity.readingLevelResult || '').toLowerCase().startsWith(resultPrefix));
    return { label, level, style, evidence };
  });
  const diagnosticEvidence = buildDiagnosticEvidence(selectedAdaptiveProfile, oralEvidence);
  const reportProfiles = (student.oralAdaptiveProfiles || []).map((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    const period = String(profile.period || 'pre_test').toLowerCase();
    const evidenceItems = activities.filter((activity) => activity.assessmentType === 'oral'
      && (String(activity.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil') === language
      && String(activity.assessmentPeriod || 'pre_test').toLowerCase() === period);
    return { profile, language, period, evidenceItems, boundaries: buildDiagnosticEvidence(profile, evidenceItems) };
  });
  const canGenerateReport = !loading && Boolean(student && student.name);

  const generateStudentReport = async () => {
    if (!canGenerateReport) return;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    const drawFooter = () => {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          'SalinTinig Official Student Assessment Document • Confidential Educational Record',
          margin,
          pageHeight - 9
        );
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 9,
          { align: 'right' }
        );
      }
    };

    let logoDataUrl = null;
    try {
      logoDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 300;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = systemLogo;
      });
    } catch (_) {
      logoDataUrl = null;
    }

    let y = 14;

    // Header Banner
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', margin, y, 16, 16);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text('SalinTinig', margin + 19, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(22, 95, 213);
    pdf.text('COMPREHENSIVE STUDENT READING & PERFORMANCE REPORT', margin + 19, y + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Phil-IRI & Adaptive Literacy Assessment System', margin + 19, y + 16);

    y += 20;
    pdf.setDrawColor(22, 95, 213);
    pdf.setLineWidth(0.8);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Student Demographics Card (Thin Black Border)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, 24);

    const col1 = margin + 4;
    const col2 = margin + 70;
    const col3 = margin + 130;

    const drawField = (x, lineY, label, val) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(label, x, lineY);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(String(val || '—'), x, lineY + 4.5);
    };

    drawField(col1, y + 5, 'FULL NAME', student.name);
    drawField(col2, y + 5, 'LEARNER REFERENCE NO. (LRN)', student.lrn || '—');
    drawField(col3, y + 5, 'GRADE & SECTION', `${student.grade || '—'}${student.section ? ` / ${student.section}` : ''}`);

    drawField(col1, y + 15, 'TOTAL ASSESSMENTS TAKEN', `${activities.length} completed record(s)`);
    drawField(col2, y + 15, 'REPORT DATE', new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }));

    y += 32;

    // Executive Performance Summary (Thin Black Outline Cards)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Executive Reading Performance Summary', margin, y);
    y += 6;

    const overallAvgAccuracy = evidenceAverage('accuracyScore');
    const overallAvgComp = evidenceAverage('comprehensionScore');
    const overallAvgSpeed = evidenceAverage('readingSpeed');

    const metrics = [
      { label: 'Overall Average Accuracy', val: `${overallAvgAccuracy}%`, desc: 'Oral Reading Precision' },
      { label: 'Overall Average Comprehension', val: `${overallAvgComp}%`, desc: 'Understanding & Recall' },
      { label: 'Average Reading Speed', val: `${overallAvgSpeed} WPS`, desc: 'Words Per Second Rate' },
    ];

    const cardW = (contentWidth - 8) / 3;
    metrics.forEach((m, idx) => {
      const cx = margin + idx * (cardW + 4);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(cx, y, cardW, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(m.label, cx + 4, y + 5.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(22, 95, 213);
      pdf.text(m.val, cx + 4, y + 13);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(110, 110, 110);
      pdf.text(m.desc, cx + 4, y + 17.5);
    });

    y += 28;

    const checkOverflow = (neededHeight) => {
      if (y + neededHeight > pageHeight - 20) {
        pdf.addPage();
        y = 18;
      }
    };

    // Diagnostic Reading Profiles (Classic Grid Table with Black Outlines)
    if (reportProfiles.length > 0) {
      checkOverflow(35);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Phil-IRI Diagnostic Oral Reading Profiles', margin, y);
      y += 7;

      reportProfiles.forEach((rp) => {
        const periodLabel = rp.period === 'post_test' ? 'Post-Test' : 'Pre-Test';
        const langLabel = rp.language === 'en' ? 'English' : 'Filipino';

        checkOverflow(40);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`${periodLabel} — ${langLabel} Oral Reading Profile`, margin, y);
        y += 6;

        // Calculate total table height
        let tableRowsHeight = 0;
        const processedRows = rp.boundaries.map((b) => {
          const basisText = b.evidence
            ? `${b.evidence.passageTitle || b.evidence.passageSet} (${b.evidence.passageSet}) — Acc: ${b.evidence.accuracyScore}%, Comp: ${b.evidence.comprehensionScore}%`
            : 'No reviewed assessment evidence recorded';
          const basisLines = pdf.splitTextToSize(basisText, contentWidth - 94);
          const rowH = Math.max(7, basisLines.length * 3.8 + 2);
          tableRowsHeight += rowH;
          return { b, basisLines, rowH };
        });

        const headerH = 6.5;
        const totalTableH = headerH + tableRowsHeight;

        checkOverflow(totalTableH + 5);

        const tableStartY = y;

        // Header Fill
        pdf.setFillColor(245, 247, 250);
        pdf.rect(margin, tableStartY, contentWidth, headerH, 'F');

        // Header Labels
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text('RESULT BOUNDARY', margin + 3, tableStartY + 4.5);
        pdf.text('CONFIRMED GRADE LEVEL', margin + 48, tableStartY + 4.5);
        pdf.text('TEACHER-REVIEWED EVIDENCE BASIS', margin + 93, tableStartY + 4.5);

        let currentY = tableStartY + headerH;

        processedRows.forEach(({ b, basisLines, rowH }) => {
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.15);
          pdf.line(margin, currentY, margin + contentWidth, currentY);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          if (b.label === 'Independent') pdf.setTextColor(4, 120, 87);
          else if (b.label === 'Instructional') pdf.setTextColor(180, 83, 9);
          else pdf.setTextColor(185, 28, 28);
          pdf.text(b.label, margin + 3, currentY + 4.5);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(15, 23, 42);
          pdf.text(formatGrade(b.level), margin + 48, currentY + 4.5);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(51, 65, 85);
          pdf.text(basisLines, margin + 93, currentY + 4.5);

          currentY += rowH;
        });

        // Outer Border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.rect(margin, tableStartY, contentWidth, totalTableH);

        // Vertical Column Dividers
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 45, tableStartY, margin + 45, tableStartY + totalTableH);
        pdf.line(margin + 90, tableStartY, margin + 90, tableStartY + totalTableH);

        y = tableStartY + totalTableH + 10;
      });
    }

    // Phil-IRI Assessment Attempt History (Fixed Column Positions No Overlap)
    if (activities.length > 0) {
      checkOverflow(30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Phil-IRI Assessment Attempt History', margin, y);
      y += 7;

      const headerH = 6.5;
      const rowH = 6.5;
      const totalTableH = headerH + activities.length * rowH;

      checkOverflow(Math.min(totalTableH + 5, 40));

      const tableStartY = y;

      // Header Fill
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, tableStartY, contentWidth, headerH, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);

      pdf.text('PASSAGE TITLE / RECORD', margin + 3, tableStartY + 4.5);
      pdf.text('TYPE / LANG', margin + 61, tableStartY + 4.5);
      pdf.text('ACCURACY', margin + 89, tableStartY + 4.5);
      pdf.text('COMPREHENSION', margin + 113, tableStartY + 4.5);
      pdf.text('RESULT LEVEL', margin + 147, tableStartY + 4.5);

      let currentY = tableStartY + headerH;

      activities.forEach((act) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.15);
        pdf.line(margin, currentY, margin + contentWidth, currentY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(15, 23, 42);
        const title = act.passageTitle || act.title || act.passageSet || 'Assessment Attempt';
        pdf.text(title.length > 26 ? `${title.substring(0, 24)}...` : title, margin + 3, currentY + 4.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(51, 65, 85);
        const typeLang = `${act.assessmentType ? act.assessmentType.toUpperCase() : 'ORAL'} / ${act.language ? act.language.toUpperCase() : 'FIL'}`;
        pdf.text(typeLang, margin + 61, currentY + 4.5);

        pdf.text(`${act.accuracyScore ?? '—'}%`, margin + 89, currentY + 4.5);
        pdf.text(`${act.comprehensionScore ?? '—'}%`, margin + 113, currentY + 4.5);

        pdf.setFont('helvetica', 'bold');
        const resText = act.readingLevelResult || act.level || 'Completed';
        pdf.text(resText, margin + 147, currentY + 4.5);

        currentY += rowH;
      });

      // Outer Border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, tableStartY, contentWidth, totalTableH);

      // Vertical Column Dividers (Fixed Positions)
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin + 58, tableStartY, margin + 58, tableStartY + totalTableH);
      pdf.line(margin + 86, tableStartY, margin + 86, tableStartY + totalTableH);
      pdf.line(margin + 110, tableStartY, margin + 110, tableStartY + totalTableH);
      pdf.line(margin + 144, tableStartY, margin + 144, tableStartY + totalTableH);

      y = tableStartY + totalTableH + 12;
    }

    // Achievements & Milestones
    checkOverflow(35);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Student Reading Achievements & Milestones', margin, y);
    y += 7;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(22, 95, 213);
    pdf.text(`Unlocked Badges (${badges.length})`, margin, y);
    y += 5;

    if (badges.length > 0) {
      const badgeList = badges.map((b) => b.name).join(' • ');
      const bLines = pdf.splitTextToSize(badgeList, contentWidth);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(bLines, margin, y);
      y += bLines.length * 4 + 4;
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('No achievement badges unlocked yet.', margin, y);
      y += 6;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(22, 95, 213);
    pdf.text(`Completed Reading Stories (${stories.length})`, margin, y);
    y += 5;

    if (stories.length > 0) {
      const storyList = stories.map((s) => s.title).join(' • ');
      const sLines = pdf.splitTextToSize(storyList, contentWidth);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(sLines, margin, y);
      y += sLines.length * 4 + 6;
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('No reading stories completed yet.', margin, y);
      y += 6;
    }

    // Teacher Observations & Signatures (Sharp Thin Black Border)
    checkOverflow(40);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, 32);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('TEACHER REMARKS & LITERACY INTERVENTION RECOMMENDATIONS', margin + 4, y + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('[ ] Individual Remediation Recommended   [ ] Peer Reading Buddy Program   [ ] Maintain Independent Progress', margin + 4, y + 12);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.15);
    pdf.line(margin + 4, y + 18, margin + contentWidth - 4, y + 18);
    pdf.line(margin + 4, y + 25, margin + contentWidth - 4, y + 25);
    drawFooter();

    const cleanName = String(student.name || 'Student')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '');
    const filename = `SalinTinig-Reading-Profile-${cleanName}.pdf`;
    pdf.save(filename);
  };

  const [recordsPage, setRecordsPage] = useState(1);
  const [storiesPage, setStoriesPage] = useState(1);
  const [badgesPage, setBadgesPage] = useState(1);

  const RECORDS_PAGE_SIZE = 5;
  const STORIES_PAGE_SIZE = 10;
  const BADGES_PAGE_SIZE = 10;

  const totalRecordsPages = Math.ceil(activities.length / RECORDS_PAGE_SIZE) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (recordsPage - 1) * RECORDS_PAGE_SIZE;
    return activities.slice(start, start + RECORDS_PAGE_SIZE);
  }, [activities, recordsPage]);

  const totalStoriesPages = Math.ceil(stories.length / STORIES_PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (storiesPage - 1) * STORIES_PAGE_SIZE;
    return stories.slice(start, start + STORIES_PAGE_SIZE);
  }, [stories, storiesPage]);

  const totalBadgesPages = Math.ceil(badges.length / BADGES_PAGE_SIZE) || 1;
  const paginatedBadges = useMemo(() => {
    const start = (badgesPage - 1) * BADGES_PAGE_SIZE;
    return badges.slice(start, start + BADGES_PAGE_SIZE);
  }, [badges, badgesPage]);

  return (
    <div>
      {/* Top Back Navigation */}
      <div className="mb-4">
        <BackButton onClick={() => navigate(-1)} label="Back to Previous Page" size={20} />
      </div>

      {loading ? (
        <StudentProfileSkeleton />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-5">
          <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={96} className="text-2xl" />
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs font-semibold text-ink/70">Full name</p>
                <p className="text-xl font-bold text-ink">{student.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold text-ink/70">Grade Level</p>
                <p className="text-base font-bold text-ink">{student.grade ? formatGrade(student.grade) : 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">Section</p>
                <p className="text-base font-bold text-ink">{student.section || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">LRN</p>
                <p className="text-base font-bold text-ink">{student.lrn}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={generateStudentReport}
          disabled={!canGenerateReport}
          title={canGenerateReport ? 'Open a printable individual Phil-IRI report' : 'A reviewed oral adaptive profile is required before generating a report'}
          className="flex shrink-0 items-center gap-2.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Icon icon="ph:article" className="size-5" />
          Generate report
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">Oral Reading Adaptive Profile</p>
                <p className="text-[11px] text-ink/55">Final diagnostic boundaries and their assessment basis</p>
              </div>
              <div className="flex gap-1.5">
                <select value={profilePeriod} onChange={(event) => setProfilePeriod(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="pre_test">Pre-Test</option><option value="post_test">Post-Test</option>
                </select>
                <select value={profileLanguage} onChange={(event) => setProfileLanguage(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="fil">Filipino</option><option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-ink/10">
              <div className="grid grid-cols-[1.1fr_.8fr_1.35fr] gap-2 bg-ink/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink/55"><span>Result</span><span>Grade</span><span>Assessment basis</span></div>
              {diagnosticEvidence.map((boundary) => (
                <div key={boundary.label} className="grid grid-cols-[1.1fr_.8fr_1.35fr] items-center gap-2 border-t border-ink/10 px-3 py-2.5 text-xs">
                  <span className={`w-fit rounded-md px-2 py-1 text-[10px] font-bold ${boundary.style}`}>{boundary.label}</span>
                  <span className="font-bold text-ink">{formatGrade(boundary.level)}</span>
                  {boundary.evidence ? <div className="min-w-0"><p className="truncate font-semibold text-ink">{boundary.evidence.passageTitle || boundary.evidence.passageSet}</p><p className="text-[10px] text-ink/60">{boundary.evidence.passageSet} · {boundary.evidence.accuracyScore}% Acc · {boundary.evidence.comprehensionScore}% Comp</p></div> : <span className="text-[10px] text-ink/50">No reviewed result yet</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              value={evidenceAverage('accuracyScore')}
              unit="%"
              label={'Average\nAccuracy'}
              iconName="ph:target"
              iconBg="bg-[#DBEAFE] text-[#2563EB]"
            />
            <StatCard
              value={evidenceAverage('comprehensionScore')}
              unit="%"
              label={'Average\nComprehension'}
              iconName="ph:lightbulb"
              iconBg="bg-[#D1FAE5] text-[#059669]"
            />
            <StatCard
              value={evidenceAverage('readingSpeed')}
              unit=" WPS"
              label={'Average\nReading Speed'}
              iconName="ph:gauge"
              iconBg="bg-[#FEF3C7] text-[#D97706]"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Icon icon="ph:trophy" className="size-7 text-brand-red" />
            <h2 className="text-xl font-bold text-ink">Phil-IRI Records & Student Progress</h2>
          </div>

          <div className="mt-4 flex items-center gap-2 border-b border-ink/10">
            {ACHIEVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab ? 'border-brand-red text-brand-red font-bold' : 'border-transparent text-ink/70 hover:bg-ink/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div key={activeTab} className="animate-fadeIn">
              {activeTab === 'Phil-IRI Records' && (
                <div>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {paginatedActivities.map((activity) => (
                          <AchievementActivityRow key={activity.id} activity={activity} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(recordsPage - 1) * RECORDS_PAGE_SIZE + 1} to {Math.min(recordsPage * RECORDS_PAGE_SIZE, activities.length)} of {activities.length} records
                        </span>
                        {totalRecordsPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={recordsPage === 1}
                              onClick={() => setRecordsPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalRecordsPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setRecordsPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    recordsPage === pg
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
                              disabled={recordsPage === totalRecordsPages}
                              onClick={() => setRecordsPage((p) => Math.min(p + 1, totalRecordsPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Clock size={32} className="text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Assessment Records Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not taken any Phil-IRI reading assessment tests yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Badges' && (
                <div>
                  {badges.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedBadges.map((badge, idx) => (
                          <BadgeCard key={badge.id ?? idx} badge={badge} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(badgesPage - 1) * BADGES_PAGE_SIZE + 1} to {Math.min(badgesPage * BADGES_PAGE_SIZE, badges.length)} of {badges.length} badges
                        </span>
                        {totalBadgesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={badgesPage === 1}
                              onClick={() => setBadgesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalBadgesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setBadgesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    badgesPage === pg
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
                              disabled={badgesPage === totalBadgesPages}
                              onClick={() => setBadgesPage((p) => Math.min(p + 1, totalBadgesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:medal-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Badges Unlocked Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not unlocked any achievement badges yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Stories' && (
                <div>
                  {stories.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedStories.map((story) => (
                          <StoryRow key={story.id} story={story} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(storiesPage - 1) * STORIES_PAGE_SIZE + 1} to {Math.min(storiesPage * STORIES_PAGE_SIZE, stories.length)} of {stories.length} stories
                        </span>
                        {totalStoriesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={storiesPage === 1}
                              onClick={() => setStoriesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalStoriesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setStoriesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    storiesPage === pg
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
                              disabled={storiesPage === totalStoriesPages}
                              onClick={() => setStoriesPage((p) => Math.min(p + 1, totalStoriesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:book-open-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Completed Stories Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not completed any reading stories yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
