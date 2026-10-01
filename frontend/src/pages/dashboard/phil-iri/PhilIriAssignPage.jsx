import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Ear,
  UserSound,
  BookOpen,
  Check,
  FloppyDisk,
  MagnifyingGlass,
  MagicWand,
  Eye,
  X,
  Quotes,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import CustomDatePicker from '../../../components/common/CustomDatePicker.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken, getUser } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';

const ASSESSMENT_TYPES = [
  { key: 'listening', label: 'Listening Assessment', icon: Ear, color: 'bg-[#ffc300]/10 text-[#b38600]' },
  { key: 'oral', label: 'Oral Reading Assessment', icon: UserSound, color: 'bg-brand-blue/10 text-brand-blue' },
  { key: 'silent', label: 'Silent Reading Assessment', icon: BookOpen, color: 'bg-[#00a652]/10 text-[#00a652]' },
];

const LEVEL_TAG = {
  Frustrational: 'bg-brand-red/10 text-brand-red',
  Instructional: 'bg-[#ffc300]/10 text-[#b38600]',
  Independent: 'bg-[#00a652]/10 text-[#00a652]',
  'Pending Evaluation': 'bg-gray-100 text-gray-600',
};

const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-rose-600',
];

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SET_COLORS = {
  'Set A': 'bg-purple-100/90 text-purple-900 border border-purple-200/80',
  'Set B': 'bg-amber-100/90 text-amber-950 border border-amber-200/80',
  'Set C': 'bg-rose-100/90 text-rose-900 border border-rose-200/80',
  'Set D': 'bg-orange-100/90 text-orange-950 border border-orange-200/80',
};

export default function PhilIriAssignPage() {
  const { editId } = useParams();
  const isEditMode = Boolean(editId);

  const navigate = useNavigate();
  const user = getUser();
  const teacherGrade = user?.grade || user?.grade_level || user?.assigned_grade || 'Grade 4';
  const initialGrade = teacherGrade.toString().toLowerCase().includes('grade') ? teacherGrade : `Grade ${teacherGrade}`;

  const [period, setPeriod] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [dueDate, setDueDate] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [students, setStudents] = useState([]);
  const [passages, setPassages] = useState([]);
  const [selectedPassages, setSelectedPassages] = useState({});
  const [selectedStudentGrades, setSelectedStudentGrades] = useState({});
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [supplementaryEligibilityConfirmed, setSupplementaryEligibilityConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPassage, setPreviewPassage] = useState(null);
  const [pickingStudentForPassage, setPickingStudentForPassage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      const lang = (p.language || '').toLowerCase();
      const matchesLanguage = selectedLanguage === 'fil'
        ? lang === 'fil' || lang === 'filipino'
        : selectedLanguage === 'en'
          ? lang === 'en' || lang === 'eng' || lang === 'english'
          : true;
      if (!matchesLanguage) return false;

      // Passages are tagged by their Phil-IRI stage (Pre-Test / Post-Test).
      // Do not mix stages in the assignment picker.
      if (!period) return true;
      const passagePeriod = String(p.stage || p.assessment_period || p.assessmentPeriod || '')
        .toLowerCase()
        .replace(/[^a-z]+/g, '_')
        .replace(/^_|_$/g, '');
      return passagePeriod === period;
    });
  }, [passages, selectedLanguage, period]);

  useEffect(() => {
    const token = getToken();

    // Fetch passages
    const fetchPassages = () => {
      fetch(getApiUrl('/api/teacher/assessments/passages'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.passages) && data.passages.length > 0) {
            setPassages(data.passages);
          } else {
            fetch(getApiUrl('/api/students/assessment/passages'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
              .then((res) => res.json())
              .then((sData) => {
                if (sData.success && Array.isArray(sData.passages)) {
                  setPassages(sData.passages);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          fetch(getApiUrl('/api/students/assessment/passages'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then((res) => res.json())
            .then((sData) => {
              if (sData.success && Array.isArray(sData.passages)) {
                setPassages(sData.passages);
              }
            })
            .catch(() => {});
        });
    };
    fetchPassages();

    // Fetch enrolled section students for this teacher
    fetch(getApiUrl('/api/teacher/class-students'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          initStudents(data.students);
        } else {
          fetch(getApiUrl('/api/students'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then((res) => res.json())
            .then((sData) => {
              if (sData.success && Array.isArray(sData.students)) {
                initStudents(sData.students);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Preload existing assessment detail when editing
  useEffect(() => {
    if (editId) {
      const token = getToken();
      fetch(getApiUrl(`/api/teacher/assessments/activity-detail/${editId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.activity) {
            const act = data.activity;
            setPeriod(act.period || 'pre_test');
            setAssessmentType(act.assessmentType || 'oral');
            setSelectedLanguage(act.language || 'fil');

            if (act.dueDate) setDueDate(act.dueDate.split('T')[0]);
            if (act.instructions) setCustomInstructions(act.instructions);

            if (Array.isArray(act.students) && act.students.length > 0) {
              const assignedIds = new Set();
              const passagesMap = {};
              act.students.forEach((std) => {
                const sid = std.studentId || std.id;
                if (sid) {
                  assignedIds.add(sid);
                  if (std.passageId) passagesMap[sid] = std.passageId;
                }
              });
              setSelectedStudents(assignedIds);
              setSelectedPassages(passagesMap);
            }
          }
        })
        .catch((err) => console.error('Error preloading edit activity data:', err));
    }
  }, [editId]);

  const initStudents = async (stdList) => {
    if (!Array.isArray(stdList) || stdList.length === 0) {
      setStudents([]);
      setSelectedStudents(new Set());
      return;
    }

    const token = getToken();
    const sectionName = stdList[0]?.sectionName || stdList[0]?.section_name || stdList[0]?.section || '';

    let filSubmission = null;
    let engSubmission = null;

    if (sectionName) {
      try {
        const [filRes, engRes] = await Promise.all([
          fetch(getApiUrl(`/api/teacher/phil-iri/gst-submission?sectionName=${encodeURIComponent(sectionName)}&language=Tagalog`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then((r) => r.json()).catch(() => ({})),
          fetch(getApiUrl(`/api/teacher/phil-iri/gst-submission?sectionName=${encodeURIComponent(sectionName)}&language=English`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then((r) => r.json()).catch(() => ({})),
        ]);

        if (filRes.success && filRes.submission?.form_data) {
          filSubmission = filRes.submission.form_data;
        }
        if (engRes.success && engRes.submission?.form_data) {
          engSubmission = engRes.submission.form_data;
        }
      } catch (e) {
        console.warn('Could not fetch GST submissions for section:', e);
      }
    }

    // Build lookup maps by LRN and normalized student names
    const filMap = {};
    const engMap = {};

    if (filSubmission) {
      const rows = [...(filSubmission.maleRows || []), ...(filSubmission.femaleRows || [])];
      rows.forEach((r) => {
        if (r.lrn) filMap[String(r.lrn).trim()] = r;
        if (r.name) filMap[r.name.trim().toLowerCase()] = r;
      });
    }

    if (engSubmission) {
      const rows = [...(engSubmission.maleRows || []), ...(engSubmission.femaleRows || [])];
      rows.forEach((r) => {
        if (r.lrn) engMap[String(r.lrn).trim()] = r;
        if (r.name) engMap[r.name.trim().toLowerCase()] = r;
      });
    }

    const enriched = stdList.map((std) => {
      const lrn = std.lrn ? String(std.lrn).trim() : '';
      const stdName = (std.name || `${std.firstName || ''} ${std.lastName || ''}`).trim().toLowerCase();
      const lName = (std.lastName || std.last_name || '').trim();
      const fName = (std.firstName || std.first_name || '').trim();
      const lastFirst = lName && fName ? `${lName}, ${fName}`.toLowerCase() : '';

      const filRecord = filMap[lrn] || filMap[stdName] || filMap[lastFirst];
      const engRecord = engMap[lrn] || engMap[stdName] || engMap[lastFirst];

      return {
        ...std,
        gstScoreFil: filRecord?.totalNum ?? filRecord?.score ?? null,
        gstScoreEng: engRecord?.totalNum ?? engRecord?.score ?? null,
        startingPointFil: filRecord?.startingPoint || null,
        startingPointEng: engRecord?.startingPoint || null,
      };
    });

    setStudents(enriched);
    setSelectedStudents(new Set());
  };

  // Lock body and html scroll when any modal is open
  useEffect(() => {
    if (previewPassage || pickingStudentForPassage) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [previewPassage, pickingStudentForPassage]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const nameStr = s.name || `${s.firstName || ''} ${s.lastName || ''}`;
      return nameStr.toLowerCase().includes(q);
    });
  }, [students, searchQuery]);

  const toggleStudent = (id) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedPassages((sp) => {
          const cp = { ...sp };
          delete cp[id];
          return cp;
        });
      } else {
        next.add(id);
        setSelectedPassages((sp) => ({ ...sp, [id]: '' }));
      }
      return next;
    });
  };

  const checkAlreadyHasAssessment = (student, typeKey, periodKey, langKey) => {
    if (!student || !Array.isArray(student.existingAssessments) || !typeKey || !periodKey) return null;
    return student.existingAssessments.find((a) => {
      const matchesType = a.type?.toLowerCase() === typeKey.toLowerCase();
      const matchesPeriod = a.period?.toLowerCase() === periodKey.toLowerCase();
      if (!langKey) return matchesType && matchesPeriod;
      const aLang = (a.language || 'fil').toLowerCase();
      const targetLang = (langKey || 'fil').toLowerCase();
      const matchesLang = aLang === targetLang || aLang.startsWith(targetLang[0]);
      return matchesType && matchesPeriod && matchesLang;
    });
  };

  const toggleAll = () => {
    const eligibleStudents = students.filter((student) => {
      if (checkAlreadyHasAssessment(student, assessmentType, period, selectedLanguage)) return false;
      if (assessmentType !== 'oral') return true;
      const recommendation = computeGstRecommendation(student, selectedLanguage);
      return !recommendation.missingGst && !recommendation.isExempt;
    });
    if (selectedStudents.size === eligibleStudents.length && eligibleStudents.length > 0) {
      setSelectedStudents(new Set());
      setSelectedPassages({});
    } else {
      const allIds = eligibleStudents.map((s) => s.student_id || s.id);
      setSelectedStudents(new Set(allIds));
      const emptyMap = {};
      allIds.forEach((id) => {
        emptyMap[id] = '';
      });
      setSelectedPassages(emptyMap);
    }
  };

  // Helper to compute DepEd Table 3 GST starting passage recommendation
  const computeGstRecommendation = (student, langKey) => {
    const isTagalog = langKey === 'fil';
    const score = isTagalog ? student.gstScoreFil : student.gstScoreEng;
    const startingPointText = isTagalog ? student.startingPointFil : student.startingPointEng;
    const currentGrade = parseInt(String(student.gradeLevel || student.grade || selectedGrade || '4').replace(/\D/g, ''), 10) || 4;

    const minimumPassageGrade = isTagalog ? 1 : 2;
    if (score !== null && score !== undefined && score !== '') {
      const numScore = Number(score);
      if (numScore >= 14) {
        return { label: 'Exempted (Score ≥ 14)', targetGrade: currentGrade, isExempt: true };
      }
      if (numScore >= 8) {
        const targetGrade = Math.max(minimumPassageGrade, currentGrade - 2);
        return { label: `Rec: Grade ${targetGrade} Passage`, targetGrade, isExempt: false };
      }
      const targetGrade = Math.max(minimumPassageGrade, currentGrade - 3);
      return { label: `Rec: Grade ${targetGrade} Passage`, targetGrade, isExempt: false };
    }

    if (startingPointText) {
      if (startingPointText.toLowerCase().includes('exempt')) {
        return { label: 'Exempted (Discontinue)', targetGrade: currentGrade, isExempt: true };
      }
      const matchGrade = parseInt(String(startingPointText).replace(/\D/g, ''), 10);
      if (matchGrade) {
        return { label: `Rec: Grade ${matchGrade} Passage`, targetGrade: matchGrade, isExempt: false };
      }
    }

    // A saved Form 1A/1B GST result is mandatory before assigning Stage 2 Oral Reading.
    return { label: 'GST score required', targetGrade: null, isExempt: false, missingGst: true };
  };

  const getPassagesForStudent = (student) => {
    if (assessmentType !== 'oral') return filteredPassages;
    const recommendation = computeGstRecommendation(student, selectedLanguage);
    if (!recommendation.targetGrade) return [];
    return filteredPassages.filter((passage) =>
      Number(String(passage.grade_level || '').replace(/\D/g, '')) === recommendation.targetGrade
    );
  };

  // Changing to Oral (or changing language) must remove learners without a saved
  // GST score, so they can never be accidentally published as Oral assignments.
  useEffect(() => {
    if (assessmentType !== 'oral' || !selectedLanguage) return;
    const ineligibleIds = new Set(students
      .filter((student) => {
        const recommendation = computeGstRecommendation(student, selectedLanguage);
        return recommendation.isExempt || recommendation.missingGst;
      })
      .map((student) => String(student.student_id || student.id)));
    if (ineligibleIds.size === 0) return;
    setSelectedStudents((current) => {
      const next = new Set([...current].filter((id) => !ineligibleIds.has(String(id))));
      return next.size === current.size ? current : next;
    });
    setSelectedPassages((current) => {
      const next = { ...current };
      let changed = false;
      ineligibleIds.forEach((id) => {
        if (id in next) { delete next[id]; changed = true; }
      });
      return changed ? next : current;
    });
  }, [assessmentType, selectedLanguage, students]);

  const handleAutoAssignGstRecommended = () => {
    if (assessmentType !== 'oral') {
      setToastMessage({ text: 'GST auto-assignment is available only for Oral Reading Assessment. Please choose passages manually for Listening or Silent Reading.', type: 'warning' });
      return;
    }
    if (!selectedLanguage) {
      setToastMessage({ text: 'Please select an Assessment Language (Filipino or English) first.', type: 'warning' });
      return;
    }

    if (selectedStudents.size === 0) {
      setToastMessage({ text: 'Please select at least one student first.', type: 'warning' });
      return;
    }

    const updated = { ...selectedPassages };
    let assignedCount = 0;
    let missingGstCount = 0;
    let missingPassageCount = 0;
    const gradeSetCounters = {};

    students.forEach((std) => {
      const stdId = std.student_id || std.id;
      if (!selectedStudents.has(stdId)) return;

      const rec = computeGstRecommendation(std, selectedLanguage);
      if (rec.isExempt) return;
      if (rec.missingGst) {
        missingGstCount++;
        return;
      }

      // Find all passages matching recommended target grade and selected language
      const matchingPassages = filteredPassages.filter((p) => {
        const pGrade = parseInt(String(p.grade_level || '').replace(/\D/g, ''), 10);
        const pLang = (p.language || '').toLowerCase();
        const langMatch = selectedLanguage === 'fil' ? (pLang === 'fil' || pLang === 'filipino') : (pLang === 'en' || pLang === 'english');
        return pGrade === rec.targetGrade && langMatch;
      });

      let match = null;
      if (matchingPassages.length > 0) {
        // Cycle through available sets (Set A, B, C, D) per grade level so students get varied sets
        const counter = gradeSetCounters[rec.targetGrade] || 0;
        match = matchingPassages[counter % matchingPassages.length];
        gradeSetCounters[rec.targetGrade] = counter + 1;
      } else missingPassageCount++;

      if (match) {
        updated[stdId] = match.passage_id;
        assignedCount++;
      }
    });

    setSelectedPassages(updated);
    setToastMessage({
      text: missingGstCount > 0 || missingPassageCount > 0
        ? `Assigned ${assignedCount} GST-based passage(s). ${missingGstCount ? `${missingGstCount} learner(s) need a saved Form 1A/1B score. ` : ''}${missingPassageCount ? `${missingPassageCount} learner(s) have no passage at their required starting grade.` : ''}`
        : `Auto-assigned GST Table 3 recommended starting passages for ${assignedCount} student(s).`,
      type: missingGstCount > 0 || missingPassageCount > 0 ? 'warning' : 'success',
    });
  };

  const handleSetChange = (studentId, passageId) => {
    setSelectedPassages((prev) => ({ ...prev, [studentId]: passageId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!period) {
      setToastMessage({ text: 'Please select an Assessment Period (Pre-Test or Post-Test).', type: 'warning' });
      return;
    }
    if (!selectedLanguage) {
      setToastMessage({ text: 'Please select an Assessment Language (Filipino or English).', type: 'warning' });
      return;
    }
    if (!assessmentType) {
      setToastMessage({ text: 'Please select an Assessment Type (Listening, Oral, or Silent).', type: 'warning' });
      return;
    }
    if (dueDate && dueDate < todayStr) {
      setToastMessage({ text: 'Due date cannot be a past date. Please select today or a future date.', type: 'warning' });
      return;
    }
    if (selectedStudents.size === 0) {
      setToastMessage({ text: 'Please select at least one student to assign.', type: 'warning' });
      return;
    }
    if (assessmentType === 'oral') {
      const missingGstStudents = students.filter((student) => {
        const studentId = student.student_id || student.id;
        return selectedStudents.has(studentId) && computeGstRecommendation(student, selectedLanguage).missingGst;
      });
      if (missingGstStudents.length > 0) {
        setToastMessage({ text: `${missingGstStudents.length} selected learner(s) have no saved Form 1A/1B GST score for this language. Save GST first before publishing an Oral Reading assessment.`, type: 'warning' });
        return;
      }
    }
    if ((assessmentType === 'listening' || assessmentType === 'silent') && !supplementaryEligibilityConfirmed) {
      setToastMessage({ text: 'Please confirm that the selected learners are eligible for this supplementary assessment.', type: 'warning' });
      return;
    }

    const unassignedStudentId = Array.from(selectedStudents).find((sId) => !selectedPassages[sId]);
    if (unassignedStudentId) {
      setToastMessage({ text: 'Please select a passage set for all selected students (or click "Auto-Assign GST Level").', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const assignmentList = Array.from(selectedStudents).map((studentId) => ({
        studentId,
        passageId: selectedPassages[studentId] || filteredPassages[0]?.passage_id,
      }));

      const token = getToken();
      const res = await fetch(getApiUrl('/api/teacher/assessments/assign-phil-iri-students'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assignments: assignmentList,
          assessmentType,
          assessmentPeriod: period,
          dueDate: dueDate || null,
          isEdit: isEditMode,
          instructions: customInstructions || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        navigate('/teacher/phil-iri-assessments');
      } else {
        setToastMessage({ text: data.error || 'Failed to publish Phil-IRI assignments.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to assign Phil-IRI:', err);
      setToastMessage({ text: 'Failed to publish Phil-IRI assignments.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Header Bar */}
      <div className="flex items-center gap-3">
        <BackButton size={22} />
        <h1 className="text-3xl font-bold text-ink">
          {isEditMode ? 'Edit Phil-IRI Assessment Assignment' : 'Assign Phil-IRI Assessment'}
        </h1>
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-ink/10">
        <p className="px-3 py-2 text-sm font-medium text-ink/60 truncate">
          Configure assessment details, passage set distribution, and target student roster
        </p>
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column - Form Inputs (7 Cols) */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* General Details Card */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-ink">General Details</h2>

            <div className="flex flex-col gap-3.5">
              {/* Assessment Period - Full Width */}
              <div>
                <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                  Assessment Period <span className="text-brand-red">*</span>
                </label>
                <select
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink outline-none focus:border-brand-blue"
                >
                  <option value="" disabled>-- Select Assessment Period --</option>
                  <option value="pre_test">Pre-Test (Panimulang Pagtatasa)</option>
                  <option value="post_test">Post-Test (Pangwakas na Pagtatasa)</option>
                </select>
              </div>

              {/* Grid: Language & Due Date */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Assessment Language <span className="text-brand-red">*</span>
                  </label>
                  <select
                    required
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink outline-none focus:border-brand-blue"
                  >
                    <option value="" disabled>-- Select Language (Filipino or English) --</option>
                    <option value="fil">Filipino (FIL)</option>
                    <option value="en">English (ENG)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Due Date / Deadline <span className="text-ink/40 font-normal">(Optional)</span>
                  </label>
                  <CustomDatePicker
                    value={dueDate}
                    onChange={(val) => setDueDate(val)}
                    minDate={todayStr}
                    placeholder="Select due date..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Content / Assessment Type Selection */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-ink">Assessment Type</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-semibold text-ink/80">
                  Assessment Type <span className="text-brand-red">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {ASSESSMENT_TYPES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = assessmentType === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setAssessmentType(item.key);
                          setSupplementaryEligibilityConfirmed(false);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-blue bg-blue-50/50 shadow-sm ring-1 ring-brand-blue'
                            : 'border-ink/10 bg-white hover:border-ink/20 hover:bg-ink/5'
                        }`}
                      >
                        <div className={`flex size-10 items-center justify-center rounded-xl ${item.color}`}>
                          <Icon size={22} weight="bold" />
                        </div>
                        <span className="text-center text-xs font-bold text-ink">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(assessmentType === 'silent' || assessmentType === 'listening') && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                  <p className="font-bold">
                    {assessmentType === 'silent'
                      ? 'Silent Reading is a teacher-directed supplementary assessment.'
                      : 'Listening Comprehension is for a learner identified as a nonreader.'}
                  </p>
                  <p className="mt-1 leading-relaxed text-amber-900">
                    {assessmentType === 'silent'
                      ? 'Use it after Oral Reading to further check a reader’s speed and comprehension. GST does not select its passage.'
                      : 'Use it only when the completed Oral Reading findings and teacher judgment identify the learner as a nonreader. GST does not select its passage.'}
                  </p>
                  <label className="mt-2 flex cursor-pointer items-start gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={supplementaryEligibilityConfirmed}
                      onChange={(e) => setSupplementaryEligibilityConfirmed(e.target.checked)}
                      className="mt-0.5 size-3.5 accent-brand-blue"
                    />
                    <span>
                      {assessmentType === 'silent'
                        ? 'I confirm this learner is eligible based on Oral Reading findings.'
                        : 'I confirm this learner has been identified as a nonreader based on Oral Reading findings.'}
                    </span>
                  </label>
                </div>
              )}

              {/* Optional Custom Instructions / Teacher Notes */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-ink/80">
                  Special Instructions / Notes for Students <span className="text-xs font-normal text-ink/50">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Please make sure you are in a quiet room and speak loudly into your microphone..."
                  className="w-full rounded-xl border border-ink/15 bg-white p-3 text-xs text-ink outline-none transition-all focus:border-brand-blue focus:ring-1 focus:ring-brand-blue placeholder:text-ink/35"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Assigned Students List (5 Cols) */}
        {(() => {
          const isLeftPanelComplete = Boolean(period && selectedLanguage && assessmentType);
          const oralNotRequiredCount = assessmentType === 'oral'
            ? students.filter((student) => computeGstRecommendation(student, selectedLanguage).isExempt).length
            : 0;
          const eligibleStudentCount = students.length - oralNotRequiredCount;
          return (
            <div className="flex flex-col lg:col-span-5">
              <div className={`flex h-full flex-col rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm transition-all ${
                !isLeftPanelComplete ? 'opacity-70 bg-cream/60' : ''
              }`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">Assigned Students</h2>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                      {selectedStudents.size}/{eligibleStudentCount}
                    </span>
                  </div>

                  {assessmentType === 'oral' && <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!isLeftPanelComplete || assessmentType !== 'oral'}
                      onClick={handleAutoAssignGstRecommended}
                      className="flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink/5 hover:border-ink/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title={assessmentType === 'oral' ? 'Auto-assign starting passage based on DepEd Table 3 GST score' : 'GST auto-assignment applies only to Oral Reading Assessment'}
                    >
                      <MagicWand size={14} className="text-ink/60" /> Auto-Assign GST Level
                    </button>
                  </div>}
                </div>

                {/* Search and Select All */}
                <div className="mt-3.5 flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2">
                    <MagnifyingGlass size={16} className="text-ink/40" />
                    <input
                      type="text"
                      disabled={!isLeftPanelComplete}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student..."
                      className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink/40 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!isLeftPanelComplete}
                    onClick={toggleAll}
                    className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

            {/* Student Roster List */}
            <div className="mt-3.5 flex max-h-[520px] flex-1 flex-col gap-2 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-ink/20 hover:scrollbar-thumb-ink/40">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((std) => {
                  const stdId = std.student_id || std.id;
                  const isChecked = selectedStudents.has(stdId);
                  const name = std.name || `${std.firstName || ''} ${std.lastName || ''}`.trim() || 'Student';
                  const level = std.level || 'Pending Evaluation';
                  const badgeStyle = LEVEL_TAG[level] || LEVEL_TAG['Pending Evaluation'];

                  const gstRec = computeGstRecommendation(std, selectedLanguage);
                  const isOralNotRequired = assessmentType === 'oral' && gstRec.isExempt;

                  const existingRec = checkAlreadyHasAssessment(std, assessmentType, period, selectedLanguage);
                  const isAlreadyAssigned = Boolean(existingRec);

                  return (
                    <div
                      key={stdId}
                      onClick={() => {
                        if (!isLeftPanelComplete || isAlreadyAssigned || (assessmentType === 'oral' && (gstRec.missingGst || gstRec.isExempt))) return;
                        toggleStudent(stdId);
                      }}
                      title={
                        isAlreadyAssigned
                          ? `Student already has an official ${selectedLanguage === 'en' ? 'English' : 'Filipino'} ${period === 'pre_test' ? 'Pre-test' : 'Post-test'} for this assessment type.`
                          : assessmentType === 'oral' && gstRec.missingGst
                            ? 'Save a GST score in Form 1A/1B before assigning Stage 2 Oral Reading.'
                            : isOralNotRequired
                              ? 'GST score is 14 or higher. No individualized Oral Reading assessment is required.'
                              : undefined
                      }
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                        isAlreadyAssigned
                          ? 'border-ink/15 bg-slate-50/60 opacity-80 cursor-not-allowed'
                          : !isLeftPanelComplete || (assessmentType === 'oral' && (gstRec.missingGst || gstRec.isExempt))
                            ? 'border-ink/10 bg-white/40 opacity-40 cursor-not-allowed'
                            : isChecked
                              ? 'border-ink/15 bg-white shadow-xs cursor-pointer'
                              : 'border-ink/10 bg-white/40 opacity-50 hover:opacity-80 cursor-pointer'
                      }`}
                    >
                      {/* Left: Avatar + Name + Level Badge + GST Table 3 Rec Badge */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={name} src={std.profileImage || std.profile_image || std.avatarUrl || std.avatar} size={32} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-xs font-bold text-ink">{name}</h3>
                            {isAlreadyAssigned && (
                              <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[9px] font-bold text-ink/70 border border-ink/10 shrink-0">
                                {selectedLanguage === 'en' ? 'ENG' : 'FIL'} {period === 'pre_test' ? 'Pre-test' : 'Post-test'} Assigned ({existingRec?.passageSet || 'Set A'})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
                              {level}
                            </span>
                            {assessmentType === 'oral' && selectedLanguage && (
                              <span className="inline-block rounded-md bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold">
                                {gstRec.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Popover Passage Picker Button + Checkbox */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isChecked && !isAlreadyAssigned && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickingStudentForPassage(std);
                            }}
                            className="flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand-blue hover:shadow-2xs cursor-pointer transition-all"
                          >
                            {selectedPassages[stdId] ? (
                              (() => {
                                const selectedPsg = passages.find((p) => String(p.passage_id) === String(selectedPassages[stdId]));
                                const setBadgeColor = SET_COLORS[selectedPsg?.passage_set] || 'bg-brand-blue/10 text-brand-blue';
                                return (
                                  <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${setBadgeColor}`}>
                                      {selectedPsg?.passage_set || 'Set'}
                                    </span>
                                    <span className="truncate text-xs font-bold text-ink">{selectedPsg?.title || 'Selected'}</span>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="flex items-center gap-1.5 text-ink/50 hover:text-brand-blue font-medium">
                                <BookOpen size={14} className="text-ink/40" />
                                <span>Choose Passage...</span>
                              </div>
                            )}
                          </button>
                        )}

                        {/* Selection Checkbox indicator */}
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            isAlreadyAssigned
                              ? 'border-ink/20 bg-ink/10 text-ink/60'
                              : isChecked
                                ? 'border-brand-blue bg-brand-blue text-white'
                                : 'border-ink/20 bg-white hover:border-ink/40'
                          }`}
                        >
                          {isAlreadyAssigned ? (
                            <Check size={12} weight="bold" />
                          ) : isChecked ? (
                            <Check size={12} weight="bold" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-ink/50">
                  No enrolled students found.
                </div>
              )}
            </div>

            {/* Right Panel Action Footer */}
            <div className="mt-4 flex items-center justify-end border-t border-ink/10 pt-3.5">
              <button
                type="submit"
                disabled={!isLeftPanelComplete || isSubmitting || selectedStudents.size === 0}
                className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FloppyDisk size={18} weight="bold" />
                <span>{isSubmitting ? 'Saving...' : 'Save & Publish Assessment'}</span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}
      </form>

      {/* MODAL OPTION 3: Passage Card Picker Modal */}
      {pickingStudentForPassage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 overscroll-none"
          onClick={() => setPickingStudentForPassage(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Select Passage for <span className="text-brand-blue">{pickingStudentForPassage.name || 'Learner'}</span>
                </h3>
                {assessmentType === 'oral' ? (
                  <p className="text-xs text-ink/60">
                    GST starting level: <strong className="text-ink">{computeGstRecommendation(pickingStudentForPassage, selectedLanguage).label}</strong>. Choose a parallel set at this grade only.
                  </p>
                ) : (
                  <p className="text-xs text-ink/60">Choose the appropriate passage manually for this supplementary assessment.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickingStudentForPassage(null)}
                className="rounded-full p-1 text-ink/40 hover:bg-ink/10 hover:text-ink cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Passage Cards Grid */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
              {(() => {
                const recommendation = computeGstRecommendation(pickingStudentForPassage, selectedLanguage);
                const pickerPassages = getPassagesForStudent(pickingStudentForPassage);

                if (pickerPassages.length === 0) {
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                      {assessmentType === 'oral'
                        ? `No ${selectedLanguage === 'en' ? 'English' : 'Filipino'} ${recommendation.targetGrade ? `Grade ${recommendation.targetGrade}` : ''} ${period === 'post_test' ? 'Post-Test' : 'Pre-Test'} passage is available. Do not select another grade; contact the administrator.`
                        : 'No passages are available for the selected language and assessment period.'}
                    </div>
                  );
                }

                return Object.entries(
                  pickerPassages.reduce((acc, p) => {
                  const gr = p.grade_level || 'Other Grades';
                  if (!acc[gr]) acc[gr] = [];
                  acc[gr].push(p);
                  return acc;
                  }, {})
                )
                .sort(([aGrade], [bGrade]) => {
                  const numA = parseInt(String(aGrade).replace(/\D/g, ''), 10) || 99;
                  const numB = parseInt(String(bGrade).replace(/\D/g, ''), 10) || 99;
                  return numA - numB;
                })
                .map(([gradeLevel, psgs]) => {
                  const sortedPsgs = [...psgs].sort((a, b) =>
                    (a.passage_set || '').localeCompare(b.passage_set || '')
                  );
                  return (
                    <div key={gradeLevel} className="space-y-2">
                      <span className="text-xs font-bold text-ink/50 uppercase tracking-wider block border-b border-ink/10 pb-1">
                        {gradeLevel}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {sortedPsgs.map((p) => {
                          const stdId = pickingStudentForPassage.student_id || pickingStudentForPassage.id;
                          const isSelectedPassage = String(selectedPassages[stdId]) === String(p.passage_id);
                          const setStyle = SET_COLORS[p.passage_set] || 'bg-brand-blue/10 text-brand-blue';
                          return (
                            <div
                              key={p.passage_id}
                              onClick={() => {
                                handleSetChange(stdId, p.passage_id);
                                setPickingStudentForPassage(null);
                              }}
                              className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                                isSelectedPassage
                                  ? 'border-brand-blue bg-blue-50/50 shadow-xs ring-1 ring-brand-blue'
                                  : 'border-ink/10 bg-white hover:border-ink/30 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${setStyle}`}>
                                  {p.passage_set || 'Set'}
                                </span>
                                <span className="text-[10px] font-medium text-ink/50">
                                  {p.word_count ? `${p.word_count} words` : 'Passage'}
                                </span>
                              </div>
                              <h4 className="mt-2 text-xs font-bold text-ink truncate">{p.title}</h4>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Passage Text Preview Modal */}
      {previewPassage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 overscroll-none"
          onClick={() => setPreviewPassage(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                  {previewPassage.passage_set || 'Set'}
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  {(previewPassage.language || '').toLowerCase().includes('fil') ? 'Filipino' : 'English'}
                </span>
                <span className="text-xs font-semibold text-ink/60">{previewPassage.grade_level || 'Grade 4'}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPassage(null)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink cursor-pointer"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-bold text-ink">{previewPassage.title}</h2>
              <span className="text-xs text-ink/50 font-medium">Word Count: {previewPassage.word_count || 0} words</span>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 text-sm sm:text-base leading-relaxed tracking-wide text-ink font-serif shadow-2xs">
                <Quotes size={28} className="mb-2 text-amber-500/80" />
                <p className="whitespace-pre-line">{previewPassage.content_text}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3">
              <Link
                to="/teacher/phil-iri-passages"
                className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
              >
                <span>Open Full Passage Bank</span>
                <ArrowSquareOut size={14} />
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Toast Notification */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
