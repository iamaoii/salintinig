import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  WarningCircle,
  ShieldCheck,
  SpeakerHigh,
  SpeakerSlash,
  CheckCircle,
  Warning,
  ArrowCounterClockwise,
  Trash,
  BookOpen,
  CaretDown,
  CaretUp,
  Info,
  CheckSquare,
  ChartBar,
  X,
  Check,
  PencilSimple,
  Prohibit,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { PhilIriReviewSkeleton } from '../../../components/common/Skeleton.jsx';
import { getToken } from '../../../lib/auth.js';
import { getApiUrl } from '../../../config/api.js';

// ===========================================================================
// 8 OFFICIAL PHIL-IRI MISCUES (DepEd Official Guidelines)
// ===========================================================================
export const OFFICIAL_MISCUE_TYPES = [
  {
    type: 'mispronunciation',
    label: 'Mispronunciation',
    labelFilipino: 'Maling Bigkas',
    code: 'MIS',
    isPenalized: true,
    scoringRule: 'Count as 1 error every mispronunciation. (Dialectal variation is not counted as an error).',
    markingRule: 'Write the phonetic pronunciation above the mispronounced word.',
    example: 'sleed (above slide)',
    accentColor: 'border-l-amber-500',
    indicatorDot: 'bg-amber-500',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    wordStyle: 'underline decoration-amber-500 decoration-2 underline-offset-4 bg-amber-50/80 text-ink font-semibold',
  },
  {
    type: 'omission',
    label: 'Omission',
    labelFilipino: 'Pagkakaltas',
    code: 'OMI',
    isPenalized: true,
    scoringRule: 'Count as 1 error a word or a phrase omitted.',
    markingRule: 'Mark unread or skipped words in the passage.',
    example: 'elephant (OMI)',
    accentColor: 'border-l-rose-500',
    indicatorDot: 'bg-rose-500',
    badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
    wordStyle: 'line-through decoration-rose-500 decoration-2 bg-rose-50/80 text-ink font-semibold',
  },
  {
    type: 'substitution',
    label: 'Substitution',
    labelFilipino: 'Pagpapalit',
    code: 'SUB',
    isPenalized: true,
    scoringRule: 'Count as 1 error every substitution.',
    markingRule: 'Write the substituted word spoken by the student above the text.',
    example: 'money (above monkey)',
    accentColor: 'border-l-orange-500',
    indicatorDot: 'bg-orange-500',
    badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200',
    wordStyle: 'underline decoration-orange-500 decoration-2 underline-offset-4 bg-orange-50/80 text-ink font-semibold',
  },
  {
    type: 'insertion',
    label: 'Insertion',
    labelFilipino: 'Pagsingit',
    code: 'INS',
    isPenalized: true,
    scoringRule: 'Count a word or a phrase inserted as 1 error.',
    markingRule: 'Insert a caret (^) with the added word above the line.',
    example: '^ lovely (above flowers)',
    accentColor: 'border-l-blue-500',
    indicatorDot: 'bg-blue-500',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    wordStyle: 'border-b-2 border-blue-500 bg-blue-50/80 text-ink font-semibold',
  },
  {
    type: 'repetition',
    label: 'Repetition',
    labelFilipino: 'Pag-uulit',
    code: 'REP',
    isPenalized: true,
    scoringRule: 'Count as 1 error every word or phrase repeated.',
    markingRule: 'Mark repeated words or phrases with a loop arrow (↩) above the text.',
    example: '↩ (above repeated word)',
    accentColor: 'border-l-indigo-500',
    indicatorDot: 'bg-indigo-500',
    badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    wordStyle: 'underline decoration-indigo-500 decoration-2 underline-offset-4 bg-indigo-50/80 text-ink font-semibold',
  },
  {
    type: 'transposition',
    label: 'Transposition',
    labelFilipino: 'Pagpapalit ng Lugar',
    code: 'TRA',
    isPenalized: true,
    scoringRule: 'Count as 1 error every transposition made.',
    markingRule: 'Indicate swapped word order using a transposition mark (⌢).',
    example: '⌢ (above swapped words)',
    accentColor: 'border-l-teal-500',
    indicatorDot: 'bg-teal-500',
    badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
    wordStyle: 'underline decoration-teal-500 decoration-wavy underline-offset-4 bg-teal-50/80 text-ink font-semibold',
  },
  {
    type: 'reversal',
    label: 'Reversal',
    labelFilipino: 'Paglilipat',
    code: 'REV',
    isPenalized: true,
    scoringRule: 'Count as 1 error every reversal made.',
    markingRule: 'Write the reversed word sequence spoken by the student above it.',
    example: 'dab (above bad)',
    accentColor: 'border-l-violet-500',
    indicatorDot: 'bg-violet-500',
    badgeStyle: 'bg-violet-50 text-violet-800 border-violet-200',
    wordStyle: 'underline decoration-violet-500 decoration-dotted decoration-2 underline-offset-4 bg-violet-50/80 text-ink font-semibold',
  },
  {
    type: 'self_correction',
    label: 'Self-Correction',
    labelFilipino: 'Sariling Pagwawasto',
    code: 'SC',
    isPenalized: false,
    scoringRule: 'Don’t count self-correction as an error (0 errors).',
    markingRule: 'Place an (SC) notation above words corrected independently.',
    example: 'SC (above corrected word)',
    accentColor: 'border-l-emerald-500',
    indicatorDot: 'bg-emerald-500',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    wordStyle: 'border-b-2 border-emerald-500 bg-emerald-50/80 text-ink font-semibold',
  },
];

const MISCUE_TYPE_MAP = new Map(OFFICIAL_MISCUE_TYPES.map((t) => [t.type, t]));
const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

// ===========================================================================
// OFFICIAL PHIL-IRI COMPUTATION TABLES (DepEd Tables 6, 7, 8)
// ===========================================================================

/**
 * Table 6. Table of Percentage for Comprehension Scores
 */
export const TABLE_6_PERCENTAGES = {
  5: { 5: 100, 4: 80, 3: 60, 2: 40, 1: 20 },
  6: { 6: 100, 5: 83, 4: 67, 3: 50, 2: 33, 1: 17 },
  7: { 7: 100, 6: 86, 5: 71, 4: 57, 3: 43, 2: 29, 1: 14 },
  8: { 8: 100, 7: 88, 6: 75, 5: 63, 4: 50, 3: 38, 2: 25, 1: 13 },
};

export function getComprehensionScorePercentage(correct, total) {
  const c = Math.max(0, Number(correct) || 0);
  const t = Number(total) || 0;
  if (t <= 0) return 0;
  if (TABLE_6_PERCENTAGES[t] && TABLE_6_PERCENTAGES[t][c] !== undefined) {
    return TABLE_6_PERCENTAGES[t][c];
  }
  return Math.round((c / t) * 100);
}

/**
 * Table 7. Word Reading Level Criteria
 * Independent: 97 - 100%
 * Instructional: 90 - 96%
 * Frustration: 89% and below
 */
export function getWordReadingLevel(accuracyPct) {
  const acc = Number(accuracyPct) || 0;
  if (acc >= 97) return 'Independent';
  if (acc >= 90) return 'Instructional';
  return 'Frustration';
}

/**
 * Table 7. Reading Comprehension Level Criteria
 * Independent: 80 - 100%
 * Instructional: 59 - 79%
 * Frustration: 58% and below
 */
export function getComprehensionLevel(compPct) {
  const comp = Number(compPct) || 0;
  if (comp >= 80) return 'Independent';
  if (comp >= 59) return 'Instructional';
  return 'Frustration';
}

/**
 * Table 8. Student's Reading Profile Per Passage
 * | Word Reading  | Reading Comprehension | Reading Profile per passage |
 * | Independent   | Independent           | Independent                 |
 * | Independent   | Instructional         | Instructional               |
 * | Instructional | Independent           | Instructional               |
 * | Instructional | Frustration           | Frustration                 |
 * | Frustration   | Instructional         | Frustration                 |
 * | Frustration   | Frustration           | Frustration                 |
 */
export function getPhilIriOralProfile(wordLevel, compLevel) {
  if (wordLevel === 'Independent' && compLevel === 'Independent') {
    return 'Independent';
  }
  if (
    (wordLevel === 'Independent' && compLevel === 'Instructional') ||
    (wordLevel === 'Instructional' && compLevel === 'Independent') ||
    (wordLevel === 'Instructional' && compLevel === 'Instructional')
  ) {
    return 'Instructional';
  }
  return 'Frustration';
}

const OFFICIAL_MISCUE_TYPE_SET = new Set(OFFICIAL_MISCUE_TYPES.map((t) => t.type));

function normalizeMiscueType(rawType) {
  if (!rawType) return null;
  const norm = String(rawType).toLowerCase().trim().replace(/[-\s]+/g, '_');
  if (norm.includes('mispronun')) return 'mispronunciation';
  if (norm.includes('omiss')) return 'omission';
  if (norm.includes('substitut')) return 'substitution';
  if (norm.includes('insert')) return 'insertion';
  if (norm.includes('repet')) return 'repetition';
  if (norm.includes('transpos')) return 'transposition';
  if (norm.includes('revers')) return 'reversal';
  if (norm.includes('self_correct') || norm === 'sc') return 'self_correction';
  if (OFFICIAL_MISCUE_TYPE_SET.has(norm)) return norm;
  return null;
}

// DepEd Phil-IRI Dominant Miscue Priority (Image 1):
// When multiple miscues overlap on a single word, choose the primary miscue:
// Substitution > Mispronunciation > Reversal > Insertion > Omission > Transposition > Repetition > Self-Correction
const PHIL_IRI_MISCUE_PRIORITY = {
  substitution: 8,
  mispronunciation: 7,
  reversal: 6,
  insertion: 5,
  omission: 4,
  transposition: 3,
  repetition: 2,
  self_correction: 1,
};

function parseMiscues(source) {
  if (!source) return [];
  let items = [];
  if (Array.isArray(source)) {
    items = source;
  } else if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) items = parsed;
    } catch (_) {
      return [];
    }
  }

  // Strictly keep and normalize only official 8 Phil-IRI miscues (discarding hesitation, etc.)
  const normalized = items
    .map((m) => {
      const normType = normalizeMiscueType(m?.miscue_type);
      return normType ? { ...m, miscue_type: normType } : null;
    })
    .filter(Boolean);

  // Enforce DepEd Phil-IRI rule: Only 1 primary miscue per word position
  const byPosition = new Map();
  normalized.forEach((m) => {
    if (m?.word_position == null) return;
    const pos = Number(m.word_position);
    if (!byPosition.has(pos)) {
      byPosition.set(pos, m);
    } else {
      const existing = byPosition.get(pos);
      const existingWeight = PHIL_IRI_MISCUE_PRIORITY[existing.miscue_type] ?? 0;
      const currentWeight = PHIL_IRI_MISCUE_PRIORITY[m.miscue_type] ?? 0;
      // Retain the dominant miscue (or retain spoken word if existing has none)
      if (currentWeight > existingWeight || (!existing.spoken_word && m.spoken_word)) {
        byPosition.set(pos, m);
      }
    }
  });

  return Array.from(byPosition.values());
}

function getDraftKey(id) {
  return id ? `salintinig_review_draft_${id}` : null;
}

function saveDraftMiscues(id, data) {
  const key = getDraftKey(id);
  if (key) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {}
  }
}

function loadDraftMiscues(id) {
  const key = getDraftKey(id);
  if (key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return parseMiscues(raw);
    } catch (_) {}
  }
  return null;
}

function formatTime(secs) {
  if (isNaN(secs) || !secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PhilIriReviewDetail({ reviewData, onBack, onVerified }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTableGuide, setShowTableGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('decision'); // 'decision' | 'miscues' | 'compTable' | 'formulas'

  const attemptId = reviewData?.attemptId || reviewData?.assessmentId;

  const [miscues, setMiscues] = useState(() => {
    const draft = loadDraftMiscues(attemptId);
    if (draft) return draft;
    if (reviewData?.verifiedMiscues !== undefined && reviewData?.verifiedMiscues !== null) {
      return parseMiscues(reviewData.verifiedMiscues);
    }
    if (reviewData?.aiMiscues !== undefined && reviewData?.aiMiscues !== null) {
      return parseMiscues(reviewData.aiMiscues);
    }
    return parseMiscues(reviewData?.miscues);
  });

  const [selectedMiscueType, setSelectedMiscueType] = useState('mispronunciation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessSaved, setIsSuccessSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [isDiscontinued, setIsDiscontinued] = useState(() => {
    return Boolean(reviewData?.isDiscontinued || reviewData?.discontinuationReason === 'refusal_to_read');
  });

  // Comprehension state (Image 2, 3, Table 6)
  const defaultTotalQuestions = Number(reviewData?.totalQuestions) || 7;
  const initialCorrect = reviewData?.comprehensionScore != null
    ? Math.min(defaultTotalQuestions, Math.max(0, Math.round(((Number(reviewData.comprehensionScore) || 57) / 100) * defaultTotalQuestions)))
    : 4;

  const [compCorrect, setCompCorrect] = useState(initialCorrect);
  const [compTotal, setCompTotal] = useState(defaultTotalQuestions);

  const audioUrl = reviewData?.audioUrl || reviewData?.audio_recording_url || reviewData?.audio || null;

  useEffect(() => {
    const draft = loadDraftMiscues(attemptId);
    if (draft) {
      setMiscues(draft);
      return;
    }
    if (reviewData?.verifiedMiscues !== undefined && reviewData?.verifiedMiscues !== null) {
      setMiscues(parseMiscues(reviewData.verifiedMiscues));
      return;
    }
    if (reviewData?.aiMiscues !== undefined && reviewData?.aiMiscues !== null) {
      setMiscues(parseMiscues(reviewData.aiMiscues));
      return;
    }
    const standard = parseMiscues(reviewData?.miscues);
    if (standard.length > 0) {
      setMiscues(standard);
    }
  }, [reviewData, attemptId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => console.error('Audio playback error:', err));
    }
  }, [isPlaying]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVol) => {
    const vol = parseFloat(newVol);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextState = !isMuted;
      audioRef.current.muted = nextState;
      setIsMuted(nextState);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const passageText = reviewData?.passageText || reviewData?.passageContent || '';
  const words = useMemo(() => (passageText ? passageText.split(/\s+/).filter(Boolean) : []), [passageText]);
  const totalWords = words.length || Number(reviewData?.wordCount) || 65;

  // Map miscues by word position (1-indexed) - only valid official miscues
  const miscueMap = useMemo(() => {
    const map = new Map();
    miscues.forEach((m) => {
      if (m?.word_position != null && OFFICIAL_MISCUE_TYPE_SET.has(m?.miscue_type)) {
        const pos = Number(m.word_position);
        if (!map.has(pos)) {
          map.set(pos, []);
        }
        map.get(pos).push(m);
      }
    });
    return map;
  }, [miscues]);

  // =========================================================================
  // OFFICIAL PHIL-IRI SCORING PROCESS (Images 1, 2, 4, 5)
  // =========================================================================

  // 1. Errors count (Excluding Self-Correction)
  // DepEd Phil-IRI Official Rules (Images 1 & 2):
  // Rule A: Exactly 1 miscue error counted per word (dominant miscue).
  // Rule B: Consecutive words in an Omission phrase or Insertion phrase count as ONE error total.
  // Rule C: Self-Correction is recorded but NOT penalized (0 error).
  const { totalErrors, consecutivePhraseCount } = useMemo(() => {
    const penalized = miscues
      .filter((m) => m?.miscue_type !== 'self_correction' && OFFICIAL_MISCUE_TYPE_SET.has(m?.miscue_type))
      .sort((a, b) => Number(a.word_position) - Number(b.word_position));

    let errors = 0;
    let phrasesGrouped = 0;

    for (let i = 0; i < penalized.length; i++) {
      const curr = penalized[i];
      const currPos = Number(curr.word_position);
      const prev = penalized[i - 1];
      const prevPos = prev ? Number(prev.word_position) : null;

      // Group consecutive omitted words (e.g. phrase omission) -> counts as 1 error total
      if (
        curr.miscue_type === 'omission' &&
        prev?.miscue_type === 'omission' &&
        currPos === prevPos + 1
      ) {
        phrasesGrouped++;
        continue;
      }

      // Group consecutive inserted words -> counts as 1 error total
      if (
        curr.miscue_type === 'insertion' &&
        prev?.miscue_type === 'insertion' &&
        currPos === prevPos + 1
      ) {
        phrasesGrouped++;
        continue;
      }

      errors++;
    }

    return {
      totalErrors: errors,
      consecutivePhraseCount: phrasesGrouped,
    };
  }, [miscues]);

  const selfCorrectionCount = useMemo(
    () => miscues.filter((m) => m?.miscue_type === 'self_correction').length,
    [miscues]
  );

  // 2. Oral Reading Score / Word Reading Score % (Image 1 Formula)
  // ((No. of words - No. of miscues) / No. of words) * 100
  const correctWords = Math.max(0, totalWords - totalErrors);
  const wordReadingScorePct = totalWords > 0
    ? Number(((correctWords / totalWords) * 100).toFixed(1))
    : Number(reviewData?.accuracyPct || 0);

  // 3. Word Reading Level (Table 7 Criteria + Discontinuation Rule from Picture 3)
  const wordReadingLevel = useMemo(() => {
    if (isDiscontinued) return 'Frustration';
    return getWordReadingLevel(wordReadingScorePct);
  }, [isDiscontinued, wordReadingScorePct]);

  // 4. Comprehension Score % (Image 2, 3 Formula & Table 6)
  // C = (No. of correct answers / No. of questions) * 100
  const compPercentage = useMemo(
    () => getComprehensionScorePercentage(compCorrect, compTotal),
    [compCorrect, compTotal]
  );

  // 5. Comprehension Level (Table 7 Criteria)
  const compLevel = useMemo(() => getComprehensionLevel(compPercentage), [compPercentage]);

  // 6. Comprehensive Student Reading Profile Per Passage (Table 8 Decision Matrix)
  const combinedProfile = useMemo(() => {
    if (isDiscontinued) return 'Frustration';
    return getPhilIriOralProfile(wordReadingLevel, compLevel);
  }, [isDiscontinued, wordReadingLevel, compLevel]);

  // 7. Reading Rate in Words Per Minute (Image 5)
  const readingDurationSecs = duration || Number(reviewData?.readingTimeSeconds) || 60;
  const wpm = Number(reviewData?.wpm) || (readingDurationSecs > 0 ? Number(((totalWords / readingDurationSecs) * 60).toFixed(1)) : 0);

  const isVerified = String(reviewData?.verificationStatus || '').toLowerCase() === 'verified' || isSuccessSaved;

  // Active editing popover state for custom spoken word input
  const [editingMiscue, setEditingMiscue] = useState(null); // { wordIdx, position, expectedWord, miscueType }
  const [spokenInput, setSpokenInput] = useState('');

  // Remove any miscue from a specific word position
  const handleRemoveMiscue = useCallback(
    (position) => {
      setMiscues((prev) => {
        const next = prev.filter((m) => Number(m.word_position) !== position);
        saveDraftMiscues(attemptId, next);
        return next;
      });
      setEditingMiscue(null);
      setSpokenInput('');
    },
    [attemptId]
  );

  // Handle cancelling editor: if the tag was newly added, remove it so the word is not tagged!
  const handleCancelEditing = useCallback(() => {
    if (!editingMiscue) return;

    if (editingMiscue.isNew) {
      setMiscues((prev) => {
        let next;
        if (editingMiscue.previousMiscue) {
          next = [
            ...prev.filter((m) => Number(m.word_position) !== editingMiscue.position),
            editingMiscue.previousMiscue,
          ];
        } else {
          next = prev.filter((m) => Number(m.word_position) !== editingMiscue.position);
        }
        saveDraftMiscues(attemptId, next);
        return next;
      });
    }

    setEditingMiscue(null);
    setSpokenInput('');
  }, [editingMiscue, attemptId]);

  // Handle word clicking: toggle off or open editor for spoken word
  const handleWordClick = useCallback(
    (idx) => {
      const position = idx + 1;
      const expectedWord = words[idx] || '';
      const TEXT_MISCUE_TYPES = ['mispronunciation', 'substitution', 'reversal', 'insertion'];

      setMiscues((prev) => {
        const existingMiscue = prev.find((m) => Number(m.word_position) === position);

        // If the word already has the SAME miscue type:
        if (existingMiscue && existingMiscue.miscue_type === selectedMiscueType) {
          // If it is a text-based miscue, open editor so teacher can edit spoken word or remove tag
          if (TEXT_MISCUE_TYPES.includes(selectedMiscueType)) {
            setEditingMiscue({
              wordIdx: idx,
              position,
              expectedWord,
              miscueType: selectedMiscueType,
              isNew: false,
              previousMiscue: existingMiscue,
            });
            setSpokenInput(existingMiscue.spoken_word || '');
            return prev;
          }

          // Non-text miscue (omission, repetition, etc.): clicking toggles it off!
          const next = prev.filter((m) => Number(m.word_position) !== position);
          saveDraftMiscues(attemptId, next);
          return next;
        }

        // New tag or changing to a new miscue type:
        // In oral reading, one word has one primary miscue — replace any previous miscue at this position
        const newMiscue = {
          word_position: position,
          expected_word: expectedWord,
          spoken_word: '',
          miscue_type: selectedMiscueType,
        };

        const next = [...prev.filter((m) => Number(m.word_position) !== position), newMiscue];
        saveDraftMiscues(attemptId, next);

        if (TEXT_MISCUE_TYPES.includes(selectedMiscueType)) {
          setEditingMiscue({
            wordIdx: idx,
            position,
            expectedWord,
            miscueType: selectedMiscueType,
            isNew: true,
            previousMiscue: existingMiscue || null,
          });
          setSpokenInput('');
        } else {
          setEditingMiscue(null);
          setSpokenInput('');
        }

        return next;
      });
    },
    [words, selectedMiscueType, attemptId]
  );

  // Update spoken word for a specific miscue position and type
  const handleSaveSpokenWord = (position, miscueType, newSpokenWord) => {
    const trimmed = (newSpokenWord || '').trim();
    setMiscues((prev) => {
      const next = prev.map((m) => {
        if (Number(m.word_position) === position) {
          return { ...m, spoken_word: trimmed };
        }
        return m;
      });
      saveDraftMiscues(attemptId, next);
      return next;
    });
    setEditingMiscue(null);
    setSpokenInput('');
  };

  const handleResetToAi = () => {
    const ai = parseMiscues(reviewData?.aiMiscues);
    setMiscues(ai);
    saveDraftMiscues(attemptId, ai);
    setToastMsg({ text: 'Reset miscues to AI speech recognition output.', type: 'success' });
  };

  const handleClearAll = () => {
    setMiscues([]);
    saveDraftMiscues(attemptId, []);
    setToastMsg({ text: 'Cleared all miscue tags from this passage.', type: 'success' });
  };

  const handleSaveVerification = async () => {
    if (!attemptId) {
      console.warn('Attempt ID missing for verification save.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(getApiUrl(`/api/teacher/assessments/${attemptId}/verify-oral`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          verifiedMiscues: miscues,
          verifiedWpm: wpm,
          verifiedAccuracyPct: isDiscontinued ? 0 : wordReadingScorePct,
          comprehensionScore: compPercentage,
          isDiscontinued,
          discontinuationReason: isDiscontinued ? 'refusal_to_read' : null,
          wordReadingLevel,
          overallProfile: combinedProfile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccessSaved(true);
        saveDraftMiscues(attemptId, miscues);
        setToastMsg({ text: 'Phil-IRI oral reading result saved & verified successfully!', type: 'success' });
        if (onVerified) onVerified();
      } else {
        setToastMsg({ text: data.error || 'Failed to save verification result.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to verify result:', err);
      setToastMsg({ text: 'Failed to save verification result. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMiscue = MISCUE_TYPE_MAP.get(selectedMiscueType);

  // Miscue Breakdown Counts
  const miscueCounts = useMemo(() => {
    const counts = {};
    OFFICIAL_MISCUE_TYPES.forEach((t) => {
      counts[t.type] = 0;
    });
    miscues.forEach((m) => {
      if (counts[m.miscue_type] !== undefined) {
        counts[m.miscue_type]++;
      }
    });
    return counts;
  }, [miscues]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackButton onClick={onBack} label="Back to Verification List" size={18} />

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-2xs ${
            isVerified
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          {isVerified ? 'Verified Official Result' : 'Pending Teacher Approval'}
        </span>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-[0px_2px_8px_rgba(26,24,22,0.06)] space-y-6 w-full">
        {/* Student & Passage Info Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
              {reviewData?.studentName || 'Student Reading Assessment'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 font-medium">
              <span className="font-semibold text-ink/80">Passage:</span>
              <span>{reviewData?.passageTitle || 'Assigned Passage'}</span>
              {reviewData?.passageSet && (
                <>
                  <span>•</span>
                  <span className="rounded bg-amber-100/80 px-2 py-0.5 font-bold text-amber-800 border border-amber-200">
                    {reviewData.passageSet}
                  </span>
                </>
              )}
              {reviewData?.gradeLevel && (
                <>
                  <span>•</span>
                  <span className="text-ink/60">
                    Grade {String(reviewData.gradeLevel).replace(/^grade\s*/i, '')}
                  </span>
                </>
              )}
              {reviewData?.language && (
                <>
                  <span>•</span>
                  <span className="text-ink/60">
                    {String(reviewData.language).toLowerCase().startsWith('en') ? 'English' : 'Filipino'}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveVerification}
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer ${
              isVerified
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                : 'bg-brand-red hover:bg-brand-red/90 active:scale-95 disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : isVerified ? (
              <>
                <CheckCircle size={18} weight="bold" />
                <span>Update & Save Verified Result</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} weight="bold" />
                <span>Approve & Save Official Result</span>
              </>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PHIL-IRI ORAL READING PROFILE SUMMARY                                     */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-ink/10 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <ChartBar size={16} weight="bold" className="text-brand-red" />
                Phil-IRI Oral Reading Profile Summary
              </h3>
              <p className="text-[11px] text-ink/50 mt-0.5">
                Comprehensive evaluation combining Word Reading Accuracy and Reading Comprehension per passage.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                combinedProfile === 'Independent'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : combinedProfile === 'Instructional'
                  ? 'bg-blue-50 text-brand-blue border border-blue-200'
                  : 'bg-red-50 text-brand-red border border-red-200'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  combinedProfile === 'Independent'
                    ? 'bg-emerald-500'
                    : combinedProfile === 'Instructional'
                    ? 'bg-brand-blue'
                    : 'bg-brand-red'
                }`}
              />
              <span>Overall Profile: {combinedProfile}</span>
            </span>
          </div>

          {/* Clean 3-Column Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Word Reading Score */}
            <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-extrabold text-ink/70 uppercase tracking-wide">Word Reading Score</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isDiscontinued
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : wordReadingLevel === 'Independent'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : wordReadingLevel === 'Instructional'
                        ? 'bg-blue-100 text-brand-blue border border-blue-200'
                        : 'bg-red-100 text-brand-red border border-red-200'
                    }`}
                  >
                    {isDiscontinued ? 'Frustration (Discontinued)' : wordReadingLevel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1.5 pb-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                    {isDiscontinued ? 'Discontinued' : `${wordReadingScorePct}%`}
                  </span>
                  {!isDiscontinued && (
                    <span className="text-sm font-bold text-red-600">
                      ({totalErrors} {totalErrors === 1 ? 'error' : 'errors'})
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-ink/50 font-mono mt-0.5">
                  {isDiscontinued
                    ? 'Refusal to Read · Remaining unread words not penalized'
                    : `(${totalWords} words - ${totalErrors} errors) / ${totalWords} × 100`}
                </p>
              </div>

              {/* Self-Correction & Phrase Notes (Clean Text, No Colored Container) */}
              <div className="pt-2 border-t border-ink/10 space-y-1">
                {!isDiscontinued && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-ink/60">Self-Corrections:</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {selfCorrectionCount} {selfCorrectionCount === 1 ? 'correction' : 'corrections'} <span className="font-normal text-ink/50 text-[10.5px]">(0 error)</span>
                    </span>
                  </div>
                )}
                {!isDiscontinued && consecutivePhraseCount > 0 && (
                  <p className="text-[10.5px] text-amber-700 font-medium">
                    *{consecutivePhraseCount} consecutive skipped {consecutivePhraseCount === 1 ? 'word' : 'words'} grouped into phrase error (1 error)
                  </p>
                )}
              </div>
            </div>

            {/* 2. Comprehension Score */}
            <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-extrabold text-ink/70 uppercase tracking-wide">Comprehension Score</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      compLevel === 'Independent'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : compLevel === 'Instructional'
                        ? 'bg-blue-100 text-brand-blue border border-blue-200'
                        : 'bg-red-100 text-brand-red border border-red-200'
                    }`}
                  >
                    {compLevel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1.5 pb-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                    {compPercentage}%
                  </span>
                  <span className="text-sm font-semibold text-ink/70">
                    ({compCorrect} of {compTotal} correct)
                  </span>
                </div>

                <p className="text-[11px] text-ink/50 font-mono mt-0.5">
                  ({compCorrect} / {compTotal} questions) × 100
                </p>
              </div>

              <div className="pt-2 border-t border-ink/10 text-[11px] text-ink/60 flex items-center justify-between">
                <span>Passing threshold:</span>
                <span className="font-semibold text-ink/80">≥ 59% (Instructional)</span>
              </div>
            </div>

            {/* 3. Reading Rate */}
            <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-2 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-extrabold text-ink/70 uppercase tracking-wide">Reading Rate</span>
                  <span className="text-[10px] font-medium text-ink/40 uppercase tracking-wider">
                    Oral Speed
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1.5 pb-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                    {wpm} <span className="text-sm font-bold text-ink/60 font-sans">WPM</span>
                  </span>
                  <span className="text-sm font-semibold text-ink/70">
                    ({Math.round(readingDurationSecs)}s duration)
                  </span>
                </div>

                <p className="text-[11px] text-ink/50 font-mono mt-0.5">
                  ({totalWords} words / {Math.round(readingDurationSecs)}s) × 60
                </p>
              </div>

              <div className="pt-2 border-t border-ink/10 text-[11px] text-ink/60 flex items-center justify-between">
                <span>Passage length:</span>
                <span className="font-semibold text-ink/80">{totalWords} total words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player Component */}
        <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          {audioUrl ? (
            <>
              <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-white shadow-xs hover:bg-brand-red/90 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" className="ml-0.5" />}
              </button>

              <div className="flex flex-1 items-center gap-2.5 min-w-[140px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="w-full accent-brand-red cursor-pointer h-1.5 bg-ink/10 rounded-full"
                />
                <span className="shrink-0 font-mono text-[11px] text-ink/60 min-w-[62px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (SPEED_OPTIONS.indexOf(playbackSpeed) + 1) % SPEED_OPTIONS.length;
                    handleSpeedChange(SPEED_OPTIONS[nextIdx]);
                  }}
                  title="Click to change playback speed"
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-ink/70 hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  {playbackSpeed}x
                </button>

                <div className="flex items-center gap-1.5 pl-1">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className="text-ink/60 hover:text-ink transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <SpeakerSlash size={14} weight="bold" className="text-brand-red" />
                    ) : (
                      <SpeakerHigh size={14} weight="bold" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-14 accent-brand-red cursor-pointer h-1 bg-ink/10 rounded-full hidden sm:block"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-ink/50 text-xs font-medium">
              <WarningCircle size={15} className="text-amber-500 shrink-0" />
              <span>No audio recording available for this assessment attempt.</span>
            </div>
          )}
        </div>

        {/* 8 Official Phil-IRI Miscues Toolbar */}
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-ink uppercase tracking-wider">
                  Phil-IRI Miscue Classification Toolbar
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/60 border border-ink/10">
                  8 Official Categories
                </span>
              </div>
              <p className="text-[11px] text-ink/60 font-medium mt-0.5">
                Select an official Phil-IRI miscue type, then click any word in the passage to tag or untag it.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTableGuide((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-cream/70 px-3 py-1.5 text-xs font-bold text-ink shadow-2xs hover:bg-cream active:scale-95 transition-all cursor-pointer"
                title="View Official Phil-IRI Guidelines and scoring matrix"
              >
                <BookOpen size={15} weight="bold" className="text-brand-red" />
                <span>Phil-IRI Guidelines</span>
                {showTableGuide ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isDiscontinued;
                  setIsDiscontinued(next);
                  setToastMsg({
                    text: next
                      ? 'Assessment marked as Discontinued (Refusal to Read). Word Reading Level set to Frustration Level.'
                      : 'Discontinuation rule unchecked. Normal scoring calculation restored.',
                    type: 'success',
                  });
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                  isDiscontinued
                    ? 'border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-400/30'
                    : 'border-ink/15 bg-white text-ink/70 hover:bg-ink/[0.02]'
                }`}
                title="Phil-IRI Discontinuation Rule (Student refused or stopped reading)"
              >
                <Prohibit size={15} weight="bold" className={isDiscontinued ? 'text-amber-800' : 'text-ink/40'} />
                <span>{isDiscontinued ? 'Discontinued (Refusal)' : 'Refusal to Read'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToAi}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-brand-blue shadow-2xs hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                title="Restore original speech-to-text detected miscues"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
                <span>Reset to AI</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-700 shadow-2xs hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                title="Clear all miscue tags"
              >
                <Trash size={15} weight="bold" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Discontinuation / Refusal to Read Informative Banner */}
          {isDiscontinued && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 flex items-start gap-3 text-xs text-amber-950 shadow-2xs animate-in fade-in duration-150">
              <WarningCircle size={20} weight="bold" className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold uppercase text-[11px] tracking-wide text-amber-900">
                    Phil-IRI Discontinuation Rule Active (Refusal to Read)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Frustration Level
                  </span>
                </div>
                <p className="text-[11.5px] text-amber-900/90 leading-relaxed">
                  Huminto ang bata at tuluyan nang hindi tinapos ang kuwento. Alinsunod sa DepEd Phil-IRI panuntunan, <strong>hindi binibilang na errors</strong> ang lahat ng natitirang hindi binasang salita. Ang Word Recognition Level ay awtomatikong itinakda sa <strong>Frustration Level</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Collapsible Phil-IRI Official Table Reference Modal/Banner */}
          {showTableGuide && (
            <div className="rounded-xl border border-ink/15 bg-cream/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex flex-wrap items-center justify-between border-b border-ink/10 gap-2">
                <span className="text-xs font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5 py-1">
                  <Info size={16} weight="bold" className="text-brand-red" />
                  DepEd Phil-IRI Official Computation Guidelines
                </span>
                {/* Clean, standard underline tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setGuideTab('decision')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      guideTab === 'decision'
                        ? 'border-brand-red text-brand-red'
                        : 'border-transparent text-ink/60 hover:text-ink'
                    }`}
                  >
                    Profile Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('compTable')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      guideTab === 'compTable'
                        ? 'border-brand-red text-brand-red'
                        : 'border-transparent text-ink/60 hover:text-ink'
                    }`}
                  >
                    Comprehension %
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('miscues')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      guideTab === 'miscues'
                        ? 'border-brand-red text-brand-red'
                        : 'border-transparent text-ink/60 hover:text-ink'
                    }`}
                  >
                    8 Miscue Types
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('formulas')}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      guideTab === 'formulas'
                        ? 'border-brand-red text-brand-red'
                        : 'border-transparent text-ink/60 hover:text-ink'
                    }`}
                  >
                    Formulas
                  </button>
                </div>
              </div>

              {/* Tab Content 1: Decision Matrix */}
              {guideTab === 'decision' && (
                <div className="space-y-4 pt-1 text-xs">
                  <div>
                    <h4 className="font-bold text-ink mb-1.5">Oral Reading Profile Standards</h4>
                    <table className="w-full text-left border-collapse border border-ink/10 rounded-lg overflow-hidden bg-white">
                      <thead>
                        <tr className="bg-ink/[0.04] text-[11px] font-extrabold text-ink border-b border-ink/10">
                          <th className="p-2">Oral Reading Level</th>
                          <th className="p-2">Word Reading Score (in %)</th>
                          <th className="p-2">Comprehension Score (in %)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">Independent</td>
                          <td className="p-2">97 - 100%</td>
                          <td className="p-2">80 - 100%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-brand-blue">Instructional</td>
                          <td className="p-2">90 - 96%</td>
                          <td className="p-2">59 - 79%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-brand-red">Frustration</td>
                          <td className="p-2">89% and below</td>
                          <td className="p-2">58% and below</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-bold text-ink mb-1.5">Student's Reading Profile Per Passage (Decision Matrix)</h4>
                    <table className="w-full text-left border-collapse border border-ink/10 rounded-lg overflow-hidden bg-white">
                      <thead>
                        <tr className="bg-ink/[0.04] text-[11px] font-extrabold text-ink border-b border-ink/10">
                          <th className="p-2">Word Reading</th>
                          <th className="p-2">Reading Comprehension</th>
                          <th className="p-2">Reading Profile per passage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        <tr>
                          <td className="p-2">Independent</td>
                          <td className="p-2">Independent</td>
                          <td className="p-2 font-black text-emerald-700">Independent</td>
                        </tr>
                        <tr>
                          <td className="p-2">Independent</td>
                          <td className="p-2">Instructional</td>
                          <td className="p-2 font-black text-brand-blue">Instructional</td>
                        </tr>
                        <tr>
                          <td className="p-2">Instructional</td>
                          <td className="p-2">Independent</td>
                          <td className="p-2 font-black text-brand-blue">Instructional</td>
                        </tr>
                        <tr>
                          <td className="p-2">Instructional</td>
                          <td className="p-2">Frustration</td>
                          <td className="p-2 font-black text-brand-red">Frustration</td>
                        </tr>
                        <tr>
                          <td className="p-2">Frustration</td>
                          <td className="p-2">Instructional</td>
                          <td className="p-2 font-black text-brand-red">Frustration</td>
                        </tr>
                        <tr>
                          <td className="p-2">Frustration</td>
                          <td className="p-2">Frustration</td>
                          <td className="p-2 font-black text-brand-red">Frustration</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Comprehension Percentages */}
              {guideTab === 'compTable' && (
                <div className="space-y-2 pt-1 text-xs">
                  <h4 className="font-bold text-ink">Comprehension Score Conversion Table</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[5, 6, 7, 8].map((itemCount) => (
                      <div key={itemCount} className="rounded-lg border border-ink/10 bg-white p-2.5">
                        <div className="font-bold text-brand-red border-b border-ink/10 pb-1 mb-1 text-[11px]">
                          {itemCount} Items
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px]">
                          {Object.entries(TABLE_6_PERCENTAGES[itemCount])
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([score, pct]) => (
                              <div key={score} className="flex justify-between">
                                <span className="text-ink/70">{score} score:</span>
                                <span className="font-bold text-ink">{pct}%</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 3: 8 Official Miscues */}
              {guideTab === 'miscues' && (
                <div className="space-y-3 pt-1">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-ink/15 text-ink/70 font-extrabold uppercase text-[10px]">
                        <th className="py-2 pr-3">Types of Miscues</th>
                        <th className="py-2 px-3">Marking the Miscue</th>
                        <th className="py-2 px-3">Example</th>
                        <th className="py-2 pl-3">Scoring (Pagpupuntos)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {OFFICIAL_MISCUE_TYPES.map((t) => (
                        <tr key={t.type} className="hover:bg-ink/[0.02]">
                          <td className="py-2 pr-3 font-bold text-ink">
                            <div>{t.label}</div>
                            <span className="text-[10px] text-ink/50 font-normal italic">({t.labelFilipino})</span>
                          </td>
                          <td className="py-2 px-3 text-ink/70">{t.markingRule}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-ink/80">{t.example}</td>
                          <td className="py-2 pl-3">
                            <span
                              className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                                t.isPenalized
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                              }`}
                            >
                              {t.scoringRule}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

              {/* Tab Content 4: Formulas */}
              {guideTab === 'formulas' && (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="rounded-lg border border-ink/10 bg-white p-3 space-y-1">
                    <span className="font-extrabold text-ink">1. Oral Reading Score</span>
                    <p className="font-mono text-ink/80 bg-cream/70 p-2 rounded border border-ink/10">
                      Oral Reading Score = ((No. of words - No. of miscues) / No. of words) × 100
                    </p>
                    <p className="text-[11px] text-ink/60">
                      Example: 65 words in passage, 15 miscues → (65 - 15) / 65 × 100 = 76.9% (Frustration)
                    </p>
                  </div>

                  <div className="rounded-lg border border-ink/10 bg-white p-3 space-y-1">
                    <span className="font-extrabold text-ink">2. Comprehension Score</span>
                    <p className="font-mono text-ink/80 bg-cream/70 p-2 rounded border border-ink/10">
                      C = (No. of correct answers / No. of questions) × 100 = % of comprehension
                    </p>
                    <p className="text-[11px] text-ink/60">
                      Example: 4 correct out of 7 questions → 4 / 7 × 100 = 57% (Frustration)
                    </p>
                  </div>

                  <div className="rounded-lg border border-ink/10 bg-white p-3 space-y-1">
                    <span className="font-extrabold text-ink">3. Reading Rate (Words Per Minute)</span>
                    <p className="font-mono text-ink/80 bg-cream/70 p-2 rounded border border-ink/10">
                      Reading Rate = (Words read / Time in seconds) × 60
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8 Official Miscue Type Buttons - UI Friendly, Calm & Professional */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {OFFICIAL_MISCUE_TYPES.map((m) => {
              const isSelected = selectedMiscueType === m.type;
              const count = miscueCounts[m.type] || 0;

              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setSelectedMiscueType(m.type)}
                  className={`relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-red bg-white shadow-xs ring-2 ring-brand-red/20'
                      : 'border-ink/10 bg-white hover:border-ink/20 hover:bg-ink/[0.01]'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`size-2 shrink-0 rounded-full ${m.indicatorDot}`} />
                      <span className={`text-xs truncate ${isSelected ? 'font-black text-ink' : 'font-semibold text-ink/90'}`}>
                        {m.label}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                        isSelected
                          ? 'bg-brand-red/10 text-brand-red border-brand-red/30'
                          : count > 0
                          ? 'bg-ink/5 text-ink/80 border-ink/10'
                          : 'bg-transparent text-ink/40 border-transparent'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-ink/45 italic font-normal text-[10.5px]">
                      {m.labelFilipino}
                    </span>
                    <span
                      className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isSelected ? m.badgeStyle : 'bg-ink/[0.03] text-ink/50 border-ink/10'
                      }`}
                    >
                      {m.code}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Miscue Guidance Helper Banner - Clean & Eye Friendly */}
          {activeMiscue && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink/[0.02] border border-ink/10 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Selected Tool:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${activeMiscue.indicatorDot}`} />
                  <span className="font-extrabold text-ink text-xs">{activeMiscue.label}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${activeMiscue.badgeStyle}`}>
                    {activeMiscue.code}
                  </span>
                </div>
                <span className="text-ink/60 text-xs hidden md:inline">— {activeMiscue.markingRule}</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  activeMiscue.isPenalized
                    ? 'text-red-700 bg-red-50 border-red-200/80'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                }`}
              >
                {activeMiscue.isPenalized ? 'Counts as 1 error' : '0 error (Not penalized)'}
              </span>
            </div>
          )}
        </div>

        {/* Natural Flowing Passage Text Transcript (No Word Containers) */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8 shadow-2xs">
          <div className="border-b border-ink/10 pb-3 mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-ink uppercase tracking-wider">Passage Text Transcript</p>
              <p className="text-[11px] text-ink/50 font-medium mt-0.5">
                Click any word to tag its primary miscue as <span className="font-bold text-ink">{activeMiscue?.label}</span> or edit/remove tags.
              </p>
            </div>
          </div>

          {words.length > 0 ? (
            <div className="text-[15px] font-normal leading-[3.6] text-ink font-sans tracking-normal select-none py-4">
              {words.map((word, idx) => {
                const position = idx + 1;
                const wordMiscues = (miscueMap.get(position) || []).filter((m) =>
                  MISCUE_TYPE_MAP.has(m.miscue_type)
                );
                const hasMiscues = wordMiscues.length > 0;
                const primaryMiscue = wordMiscues[0];
                const primaryType = primaryMiscue?.miscue_type;
                const typeInfo = primaryType ? MISCUE_TYPE_MAP.get(primaryType) : null;

                // Color configuration for tagged chips based on official miscue types
                const getChipStyles = (type) => {
                  switch (type) {
                    case 'omission':
                      return {
                        chip: 'border-rose-300 bg-rose-50/70 text-rose-950',
                        badge: 'bg-rose-50 text-rose-600 border-rose-300',
                        annotation: 'text-rose-600',
                      };
                    case 'substitution':
                      return {
                        chip: 'border-amber-300 bg-amber-50/70 text-amber-950',
                        badge: 'bg-amber-50 text-amber-700 border-amber-300',
                        annotation: 'text-amber-800 font-serif italic font-bold',
                      };
                    case 'mispronunciation':
                      return {
                        chip: 'border-orange-300 bg-orange-50/70 text-orange-950',
                        badge: 'bg-orange-50 text-orange-700 border-orange-300',
                        annotation: 'text-orange-800 font-serif italic font-bold',
                      };
                    case 'insertion':
                      return {
                        chip: 'border-blue-300 bg-blue-50/70 text-blue-950',
                        badge: 'bg-blue-50 text-blue-600 border-blue-300',
                        annotation: 'text-blue-700 font-serif font-bold',
                      };
                    case 'repetition':
                      return {
                        chip: 'border-indigo-300 bg-indigo-50/70 text-indigo-950',
                        badge: 'bg-indigo-50 text-indigo-600 border-indigo-300',
                        annotation: 'text-indigo-700 font-bold',
                      };
                    case 'transposition':
                      return {
                        chip: 'border-teal-300 bg-teal-50/70 text-teal-950',
                        badge: 'bg-teal-50 text-teal-700 border-teal-300',
                        annotation: 'text-teal-700 font-bold',
                      };
                    case 'reversal':
                      return {
                        chip: 'border-violet-300 bg-violet-50/70 text-violet-950',
                        badge: 'bg-violet-50 text-violet-700 border-violet-300',
                        annotation: 'text-violet-800 font-serif italic font-bold',
                      };
                    case 'self_correction':
                      return {
                        chip: 'border-emerald-300 bg-emerald-50/70 text-emerald-950',
                        badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',
                        annotation: 'text-emerald-700 font-bold font-serif',
                      };
                    default:
                      return {
                        chip: 'text-ink',
                        badge: 'hidden',
                        annotation: 'text-ink/70',
                      };
                  }
                };

                const chipTheme = hasMiscues ? getChipStyles(primaryType) : null;

                // Derive annotation above the word based on miscue type
                const getAnnotation = (miscue) => {
                  const spoken = miscue?.spoken_word || '';
                  switch (miscue?.miscue_type) {
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

                const annotationText = primaryMiscue ? getAnnotation(primaryMiscue) : null;
                const isBeingEdited = editingMiscue && editingMiscue.position === position;

                return (
                  <span
                    key={idx}
                    onClick={() => handleWordClick(idx)}
                    className={`relative inline-flex items-center align-middle cursor-pointer transition-all duration-150 ${
                      hasMiscues
                        ? `px-2 py-0.5 mx-0.5 my-0.5 rounded-lg border text-sm font-medium shadow-2xs ${chipTheme.chip} hover:brightness-95`
                        : 'px-0.5 mx-0.5 text-ink hover:bg-ink/5 rounded'
                    }`}
                    title={`Word #${position}: "${word}"${
                      hasMiscues
                        ? ` — Tagged: ${wordMiscues
                            .map((m) => {
                              const info = MISCUE_TYPE_MAP.get(m.miscue_type);
                              return `${info?.label || m.miscue_type}`;
                            })
                            .join(', ')}`
                        : ' (Click to tag)'
                    }`}
                  >
                    {/* Uttered / annotation text positioned neatly on top */}
                    {annotationText && !isBeingEdited && (
                      <span
                        className={`absolute -top-[18px] left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap leading-none pointer-events-none font-semibold ${chipTheme.annotation}`}
                      >
                        {annotationText}
                      </span>
                    )}

                    {/* Word text */}
                    <span>{word}</span>

                    {/* Color-coded miscue badge tag (OMI, SUB, INS, etc.) - only for tagged words */}
                    {hasMiscues && typeInfo && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border leading-none ${chipTheme.badge}`}
                      >
                        {typeInfo.code}
                      </span>
                    )}

                    {/* Transparent click-outside overlay to dismiss cleanly */}
                    {isBeingEdited && (
                      <div
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEditing();
                        }}
                      />
                    )}

                    {/* Sleek, Modern Floating Annotation Card */}
                    {isBeingEdited && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-40 animate-in zoom-in-95 fade-in duration-150 leading-normal select-auto text-left"
                        style={{
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '260px',
                        }}
                      >
                        <div className="relative rounded-xl bg-white border border-ink/15 shadow-xl p-3">
                          {/* Top Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`size-2 shrink-0 rounded-full ${
                                  MISCUE_TYPE_MAP.get(editingMiscue.miscueType)?.indicatorDot || 'bg-amber-500'
                                }`}
                              />
                              <span className="text-[11px] font-bold text-ink truncate">
                                {MISCUE_TYPE_MAP.get(editingMiscue.miscueType)?.label || editingMiscue.miscueType}
                              </span>
                              <span className="text-[11px] text-ink/40 font-mono">
                                &ldquo;{editingMiscue.expectedWord}&rdquo;
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelEditing()}
                              className="shrink-0 p-1 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-md transition-colors"
                              title="Close without saving (Esc)"
                            >
                              <X size={12} weight="bold" />
                            </button>
                          </div>

                          {/* Input Field */}
                          <div className="pt-2.5 pb-2">
                            <label className="block text-[10px] font-semibold text-ink/50 mb-1">
                              What did the student say?
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                autoFocus
                                value={spokenInput}
                                onChange={(e) => setSpokenInput(e.target.value)}
                                placeholder="Type student's spoken word..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveSpokenWord(position, editingMiscue.miscueType, spokenInput);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditing();
                                  }
                                }}
                                className="w-full text-xs font-serif italic px-2.5 py-1.5 pr-6 rounded-md bg-ink/[0.02] border border-ink/20 text-ink placeholder:text-ink/30 focus:outline-none focus:border-brand-red focus:bg-white focus:ring-1 focus:ring-brand-red/20 transition-all"
                              />
                              {spokenInput && (
                                <button
                                  type="button"
                                  onClick={() => setSpokenInput('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
                                  title="Clear text"
                                >
                                  <X size={11} weight="bold" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                            <button
                              type="button"
                              onClick={() => handleRemoveMiscue(position)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Remove this miscue tag completely"
                            >
                              <Trash size={12} weight="bold" />
                              <span>Remove tag</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCancelEditing()}
                                className="px-2 py-1 rounded-md text-[11px] font-medium text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveSpokenWord(position, editingMiscue.miscueType, spokenInput)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-brand-red hover:bg-brand-red/90 shadow-2xs transition-all active:scale-95"
                              >
                                <Check size={12} weight="bold" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>

                          {/* Caret pointer */}
                          <div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 border-b border-r border-ink/15 bg-white pointer-events-none"
                            aria-hidden
                          />
                        </div>
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-ink/50">
              <WarningCircle size={24} className="text-amber-500 mb-1.5" />
              <p className="text-xs font-semibold">No passage transcript text found for this assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhilIriReviewPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReview() {
      try {
        const token = getToken();
        // 1. Direct review detail endpoint
        const directRes = await fetch(getApiUrl(`/api/teacher/assessments/review/${attemptId}`), {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const directData = await directRes.json();
        if (directRes.ok && directData.success && directData.review) {
          setReviewData(directData.review);
          return;
        }

        // 2. Fallback to pending reviews list
        const pendingRes = await fetch(getApiUrl('/api/teacher/assessments/pending-reviews'), {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const pendingData = await pendingRes.json();
        if (pendingData.success && Array.isArray(pendingData.pendingReviews)) {
          const match = pendingData.pendingReviews.find(
            (r) => String(r.attemptId) === String(attemptId) || String(r.assessmentId) === String(attemptId)
          );
          if (match) {
            setReviewData(match);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch review data:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchReview();

    return () => {
      controller.abort();
    };
  }, [attemptId]);

  if (loading) {
    return <PhilIriReviewSkeleton />;
  }

  if (!reviewData) {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 p-8 max-w-md mx-auto text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-1">
          <Warning size={24} weight="bold" />
        </div>
        <h3 className="text-base font-bold text-ink">Oral Reading Record Not Found</h3>
        <p className="text-xs text-ink/60 max-w-xs leading-relaxed">
          The requested assessment attempt could not be found or has already been completed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/teacher/class-activities/phil-iri')}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-brand-red/90 transition-all cursor-pointer"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  return (
    <PhilIriReviewDetail
      reviewData={reviewData}
      onBack={() => navigate('/teacher/class-activities/phil-iri')}
      onVerified={() => navigate('/teacher/class-activities/phil-iri')}
    />
  );
}
