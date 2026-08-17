import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
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
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { getToken, getUser } from '../../../lib/auth.js';

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
  const navigate = useNavigate();
  const user = getUser();
  const teacherGrade = user?.grade || user?.grade_level || user?.assigned_grade || 'Grade 4';
  const initialGrade = teacherGrade.toString().toLowerCase().includes('grade') ? teacherGrade : `Grade ${teacherGrade}`;

  const [period, setPeriod] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [students, setStudents] = useState([]);
  const [passages, setPassages] = useState([]);
  const [selectedPassages, setSelectedPassages] = useState({});
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPassage, setPreviewPassage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      // Grade filter
      if (selectedGrade !== 'all') {
        const pGrade = (p.grade_level || '').toLowerCase();
        const target = selectedGrade.toLowerCase();
        if (!pGrade.includes(target)) return false;
      }
      // Language filter
      const lang = (p.language || '').toLowerCase();
      if (selectedLanguage === 'fil') return lang === 'fil' || lang === 'filipino';
      if (selectedLanguage === 'en') return lang === 'en' || lang === 'eng' || lang === 'english';
      return true;
    });
  }, [passages, selectedLanguage, selectedGrade]);

  useEffect(() => {
    const token = getToken();

    // Fetch passages
    const fetchPassages = () => {
      fetch('/api/teacher/assessments/passages', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.passages) && data.passages.length > 0) {
            setPassages(data.passages);
          } else {
            fetch('/api/students/assessment/passages', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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
          fetch('/api/students/assessment/passages', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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
    fetch('/api/teacher/class-students', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.students) && data.students.length > 0) {
          initStudents(data.students);
        } else {
          fetch('/api/students', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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

  const initStudents = (stdList) => {
    setStudents(stdList);
    setSelectedStudents(new Set());
  };

  // Lock body and html scroll when preview modal is open
  useEffect(() => {
    if (previewPassage) {
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
  }, [previewPassage]);

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

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
      setSelectedPassages({});
    } else {
      const allIds = students.map((s) => s.student_id || s.id);
      setSelectedStudents(new Set(allIds));
      const emptyMap = {};
      allIds.forEach((id) => {
        emptyMap[id] = '';
      });
      setSelectedPassages(emptyMap);
    }
  };

  const handleAutoDistributeSets = () => {
    if (!selectedLanguage) {
      setToastMessage({ text: 'Please select an Assessment Language (Filipino or English) first.', type: 'warning' });
      return;
    }

    const availablePassages = filteredPassages.length > 0 ? filteredPassages : passages;
    if (availablePassages.length === 0) {
      setToastMessage({ text: 'No passages available for the selected criteria.', type: 'warning' });
      return;
    }

    if (selectedStudents.size === 0) {
      setToastMessage({ text: 'Please select at least one student before auto-distributing passage sets.', type: 'warning' });
      return;
    }

    const targetStudentList = students.filter((s) => selectedStudents.has(s.student_id || s.id));

    const updated = { ...selectedPassages };

    targetStudentList.forEach((std) => {
      const stdId = std.student_id || std.id;
      const randomPassage = availablePassages[Math.floor(Math.random() * availablePassages.length)];

      if (randomPassage) {
        updated[stdId] = randomPassage.passage_id;
      }
    });

    setSelectedPassages(updated);
    setToastMessage({ text: `Auto-distributed passage sets to ${targetStudentList.length} student(s).`, type: 'success' });
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
    if (selectedStudents.size === 0) {
      setToastMessage({ text: 'Please select at least one student to assign.', type: 'warning' });
      return;
    }

    const unassignedStudentId = Array.from(selectedStudents).find((sId) => !selectedPassages[sId]);
    if (unassignedStudentId) {
      setToastMessage({ text: 'Please select a passage set for all selected students (or click "Auto-Distribute Sets").', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const assignmentList = Array.from(selectedStudents).map((studentId) => ({
        studentId,
        passageId: selectedPassages[studentId] || passages[0]?.passage_id,
      }));

      const token = getToken();
      const res = await fetch('/api/teacher/assessments/assign-phil-iri-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assignments: assignmentList,
          assessmentType,
          assessmentPeriod: period,
        }),
      });

      const data = await res.json();
      if (data.success) {
        navigate('/teacher/class-activities/phil-iri');
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
        <h1 className="text-3xl font-bold text-ink">Assign Phil-IRI Assessment</h1>
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
              {/* Grid: Assessment Period & Language */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Assessment Period <span className="text-brand-red">*</span>
                  </label>
                  <select
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-brand-blue"
                  >
                    <option value="" disabled>-- Select Assessment Period --</option>
                    <option value="pre_test">Pre-Test (GST / Screening)</option>
                    <option value="post_test">Post-Test (Year-End Evaluation)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Assessment Language <span className="text-brand-red">*</span>
                  </label>
                  <select
                    required
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-brand-blue"
                  >
                    <option value="" disabled>-- Select Language (Filipino or English) --</option>
                    <option value="fil">Filipino (FIL)</option>
                    <option value="en">English (ENG)</option>
                  </select>
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
                        onClick={() => setAssessmentType(item.key)}
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

              {/* Passage Set Reference Overview */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-xs sm:text-sm font-semibold text-ink/80">
                    Available Phil-IRI Passage Sets ({filteredPassages.length})
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Static Teacher Grade Badge */}
                    <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-xs font-bold text-brand-blue">
                      {selectedGrade}
                    </span>

                    <Link
                      to="/teacher/phil-iri-passages"
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                    >
                      <span>Passage Bank</span>
                      <ArrowSquareOut size={12} />
                    </Link>
                  </div>
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-ink/20 hover:scrollbar-thumb-ink/40">
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredPassages.length > 0 ? (
                      filteredPassages.map((p, idx) => {
                        const isFil = (p.language || '').toLowerCase().includes('fil');
                        const setBadgeStyle = SET_COLORS[p.passage_set] || 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20';
                        return (
                          <div
                            key={p.passage_id || `psg-${idx}`}
                            onClick={() => setPreviewPassage(p)}
                            className="group flex flex-col gap-1 rounded-xl border border-ink/10 bg-white p-3 shadow-2xs transition-all hover:border-brand-blue hover:shadow-sm cursor-pointer"
                            title="Click to preview full passage text"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${setBadgeStyle}`}>
                                  {p.passage_set || 'Set'}
                                </span>
                                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  isFil
                                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200/80'
                                    : 'bg-blue-100/90 text-blue-900 border border-blue-200/80'
                                }`}>
                                  {isFil ? 'FIL' : 'ENG'}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-ink/50">
                                {p.grade_level || 'Grade 4'}
                              </span>
                            </div>
                            <h4 className="truncate text-xs font-bold text-ink group-hover:text-brand-blue transition-colors mt-0.5">{p.title}</h4>
                            <div className="flex items-center justify-between text-[10px] text-ink/60">
                              <span>{p.word_count ? `${p.word_count} words` : 'Passage text'}</span>
                              <span className="flex items-center gap-0.5 font-bold text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={12} /> Read
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-6 text-center text-xs font-medium text-ink/40">
                        No passages found for selected grade/language.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Assigned Students List (5 Cols) */}
        {(() => {
          const isLeftPanelComplete = Boolean(period && selectedLanguage && assessmentType);
          return (
            <div className="flex flex-col lg:col-span-5">
              <div className={`flex h-full flex-col rounded-2xl border border-ink/10 bg-cream p-5 shadow-sm transition-all ${
                !isLeftPanelComplete ? 'opacity-70 bg-cream/60' : ''
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">Assigned Students</h2>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                      {selectedStudents.size}/{students.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!isLeftPanelComplete}
                    onClick={handleAutoDistributeSets}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-200/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Distribute Set A, B, C, D evenly across roster"
                  >
                    <MagicWand size={14} weight="bold" /> Auto-Distribute Sets
                  </button>
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
                filteredStudents.map((std, idx) => {
                  const stdId = std.student_id || std.id;
                  const isChecked = selectedStudents.has(stdId);
                  const name = std.name || `${std.firstName || ''} ${std.lastName || ''}`.trim() || 'Student';
                  const level = std.level || 'Pending Evaluation';
                  const badgeStyle = LEVEL_TAG[level] || LEVEL_TAG['Pending Evaluation'];
                  const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <div
                      key={stdId}
                      onClick={() => {
                        if (!isLeftPanelComplete) return;
                        toggleStudent(stdId);
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                        !isLeftPanelComplete
                          ? 'border-ink/10 bg-white/40 opacity-40 cursor-not-allowed'
                          : isChecked
                            ? 'border-ink/15 bg-white shadow-xs cursor-pointer'
                            : 'border-ink/10 bg-white/40 opacity-50 hover:opacity-80 cursor-pointer'
                      }`}
                    >
                      {/* Left: Avatar + Name + Level Badge */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar name={name} src={std.profileImage || std.profile_image} size={32} />

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xs font-bold text-ink">{name}</h3>
                          <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
                            {level}
                          </span>
                        </div>
                      </div>

                      {/* Right: Phil-IRI Set Dropdown + Checkbox */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isChecked && (
                          <select
                            value={selectedPassages[stdId] || ''}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleSetChange(stdId, e.target.value)}
                            className="w-44 truncate rounded-lg border border-ink/15 bg-cream px-2.5 py-1 text-xs font-bold text-ink outline-none focus:border-brand-blue focus:bg-white cursor-pointer"
                          >
                            <option value="" disabled>-- Select Set --</option>
                            {filteredPassages.length > 0 &&
                              filteredPassages.map((p) => (
                                <option key={p.passage_id} value={p.passage_id}>
                                  {p.passage_set ? `${p.passage_set}: ${p.title}` : p.title}
                                </option>
                              ))}
                          </select>
                        )}

                        {/* Selection Checkbox indicator */}
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                            isChecked
                              ? 'border-brand-blue bg-brand-blue text-white'
                              : 'border-ink/20 bg-white hover:border-ink/40'
                          }`}
                        >
                          {isChecked && <Check size={14} weight="bold" />}
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
