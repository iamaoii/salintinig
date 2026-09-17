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
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import ToastNotification from '../../../components/common/ToastNotification.jsx';
import { getToken } from '../../../lib/auth.js';

const MISCUE_TYPES = [
  { type: 'omission', label: 'Omission', code: 'OMI', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', badgeStyle: 'bg-white text-red-600 border-red-400' },
  { type: 'substitution', label: 'Substitution', code: 'SUB', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100', badgeStyle: 'bg-white text-amber-600 border-amber-400' },
  { type: 'insertion', label: 'Insertion', code: 'INS', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', badgeStyle: 'bg-white text-blue-600 border-blue-400' },
  { type: 'repetition', label: 'Repetition', code: 'REP', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', badgeStyle: 'bg-white text-purple-600 border-purple-400' },
  { type: 'hesitation', label: 'Hesitation', code: 'HES', color: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100', badgeStyle: 'bg-white text-cyan-700 border-cyan-400' },
  { type: 'self_correction', label: 'Self Correction', code: 'SC', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', badgeStyle: 'bg-white text-emerald-600 border-emerald-400' },
];

const MISCUE_TYPE_MAP = new Map(MISCUE_TYPES.map((t) => [t.type, t]));
const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function parseMiscues(source) {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
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

  const [selectedMiscueType, setSelectedMiscueType] = useState('omission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessSaved, setIsSuccessSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

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

  const totalWords = words.length || Number(reviewData?.wordCount) || 0;

  const miscueMap = useMemo(() => {
    const map = new Map();
    miscues.forEach((m) => {
      if (m?.word_position != null) {
        const pos = Number(m.word_position);
        if (!map.has(pos)) {
          map.set(pos, []);
        }
        map.get(pos).push(m);
      }
    });
    return map;
  }, [miscues]);

  const miscueCount = useMemo(
    () => miscues.filter((m) => m?.miscue_type !== 'self_correction').length,
    [miscues]
  );

  const correctCount = Math.max(0, totalWords - miscueCount);
  const accuracyPct = totalWords > 0
    ? Number(((correctCount / totalWords) * 100).toFixed(1))
    : Number(reviewData?.accuracyPct || 0);

  const wpm = Number(reviewData?.wpm) || 0;

  const profileLabel = useMemo(() => {
    if (totalWords > 0) {
      if (accuracyPct >= 97) return 'Independent';
      if (accuracyPct >= 90) return 'Instructional';
      return 'Frustration';
    }
    return reviewData?.readingLevelResult || 'Pending';
  }, [totalWords, accuracyPct, reviewData?.readingLevelResult]);

  const isVerified = String(reviewData?.verificationStatus || '').toLowerCase() === 'verified' || isSuccessSaved;

  const handleWordClick = useCallback((idx) => {
    const position = idx + 1;
    setMiscues((prev) => {
      let next;
      // Check if this word already has the currently selected miscue category
      const typeExists = prev.some(
        (m) => Number(m.word_position) === position && m.miscue_type === selectedMiscueType
      );

      if (typeExists) {
        // Toggle OFF only this specific category on this word
        next = prev.filter(
          (m) => !(Number(m.word_position) === position && m.miscue_type === selectedMiscueType)
        );
      } else {
        // Add this category as an additional miscue tag on this word
        next = [
          ...prev,
          {
            word_position: position,
            expected_word: words[idx] || '',
            spoken_word: '',
            miscue_type: selectedMiscueType,
          },
        ];
      }

      saveDraftMiscues(attemptId, next);
      return next;
    });
  }, [words, selectedMiscueType, attemptId]);

  const handleResetToAi = () => {
    const ai = parseMiscues(reviewData?.aiMiscues);
    setMiscues(ai);
    saveDraftMiscues(attemptId, ai);
  };

  const handleClearAll = () => {
    setMiscues([]);
    saveDraftMiscues(attemptId, []);
  };

  const handleSaveVerification = async () => {
    if (!attemptId) {
      console.warn('Attempt ID missing for verification save.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/teacher/assessments/${attemptId}/verify-oral`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          verifiedMiscues: miscues,
          verifiedWpm: wpm,
          verifiedAccuracyPct: accuracyPct,
          comprehensionScore: reviewData?.comprehensionScore ?? null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccessSaved(true);
        saveDraftMiscues(attemptId, miscues);
        setToastMsg({ text: 'Phil-IRI oral reading result saved & verified successfully!', type: 'success' });
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

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto relative">
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackButton
          onClick={onBack}
          label="Back to Verification List"
          size={18}
        />

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
      <div className="rounded-3xl border border-ink/10 bg-cream p-6 sm:p-8 shadow-[0px_6px_20px_0px_rgba(26,24,22,0.05)] space-y-6">
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
                  <span className="text-ink/60">Grade {reviewData.gradeLevel}</span>
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

        {/* Audio Player Component */}
        <div className="rounded-2xl border border-ink/10 bg-white p-3.5 sm:p-4 shadow-2xs">
          {audioUrl ? (
            <>
              <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

              <div className="flex flex-wrap items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white shadow-xs hover:bg-brand-red/90 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="ml-0.5" />}
                </button>

                {/* Audio Waveform Seeker */}
                <div className="flex flex-1 items-center gap-3 min-w-[200px]">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full accent-brand-red cursor-pointer h-2 bg-cream rounded-full"
                  />
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-ink/60 min-w-[64px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Compact Control Accessories */}
                <div className="flex items-center gap-2 shrink-0 border-l border-ink/10 pl-3">
                  {/* Speed Pill */}
                  <div className="flex items-center gap-1 bg-cream/80 px-2 py-1 rounded-lg border border-ink/10 text-xs font-semibold text-ink/70">
                    <span className="text-[10px] text-ink/50 uppercase font-bold">Speed</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="bg-transparent text-xs font-bold text-ink outline-none cursor-pointer"
                    >
                      {SPEED_OPTIONS.map((spd) => (
                        <option key={spd} value={spd}>
                          {spd}x
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Volume Button & Slider */}
                  <div className="flex items-center gap-1.5 bg-cream/80 px-2 py-1 rounded-lg border border-ink/10">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-ink/70 hover:text-brand-red transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <SpeakerSlash size={15} weight="bold" className="text-brand-red" />
                      ) : (
                        <SpeakerHigh size={15} weight="bold" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(e.target.value)}
                      className="w-14 accent-brand-red cursor-pointer h-1.5 bg-ink/10 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-1 text-ink/50 text-xs font-semibold">
              <WarningCircle size={18} className="text-amber-500 shrink-0" />
              <span>No audio recording available for this assessment attempt.</span>
            </div>
          )}
        </div>

        {/* Miscue Type Selection Pills & Controls */}
        <div className="space-y-3 rounded-2xl border border-ink/10 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <div>
              <label className="text-xs font-extrabold text-ink uppercase tracking-wider">
                Miscue Classification Toolbar
              </label>
              <p className="text-[11px] text-ink/60 font-medium">Select a category below, then click any word in the transcript to tag or untag it.</p>
            </div>

            {/* Prominent Reset & Clear Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToAi}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-brand-blue shadow-2xs hover:bg-blue-100 hover:border-brand-blue/50 active:scale-95 transition-all cursor-pointer"
                title="Restore original speech-to-text detected miscues"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
                <span>Reset to AI</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-700 shadow-2xs hover:bg-red-100 hover:border-red-300 active:scale-95 transition-all cursor-pointer"
                title="Clear all miscue tags"
              >
                <Trash size={15} weight="bold" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {MISCUE_TYPES.map((m) => {
              const isSelected = selectedMiscueType === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setSelectedMiscueType(m.type)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? `${m.color} ring-2 ring-brand-red/30 shadow-2xs scale-102 font-extrabold`
                      : 'border-ink/15 bg-white text-ink/70 hover:bg-cream hover:text-ink'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Passage Text Container */}
        <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 shadow-2xs">
          <p className="text-xs font-bold text-ink/40 uppercase tracking-wider mb-3">Passage Text Transcript</p>
          {words.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-base font-medium leading-relaxed text-ink">
              {words.map((word, idx) => {
                const wordMiscues = miscueMap.get(idx + 1) || [];
                const hasMiscues = wordMiscues.length > 0;

                return (
                  <span
                    key={idx}
                    onClick={() => handleWordClick(idx)}
                    className={`inline-flex items-center gap-1.5 cursor-pointer rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all select-none ${
                      hasMiscues
                        ? 'bg-stone-100 border-stone-300 text-ink shadow-2xs ring-1 ring-stone-400/20'
                        : 'border-ink/10 bg-white text-ink hover:bg-cream hover:border-ink/20 shadow-2xs'
                    }`}
                  >
                    <span>{word}</span>
                    {wordMiscues.map((m, mIdx) => {
                      const mInfo = MISCUE_TYPE_MAP.get(m.miscue_type);
                      return (
                        <span
                          key={mIdx}
                          className={`text-[9.5px] uppercase font-extrabold px-1.5 py-0.5 rounded-md border shadow-2xs leading-none ${
                            mInfo?.badgeStyle || 'bg-white text-red-600 border-red-400'
                          }`}
                        >
                          {mInfo?.code || m.miscue_type.substring(0, 3)}
                        </span>
                      );
                    })}
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

        {/* Live Reading Metrics Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">Total Words</span>
            <p className="mt-1 text-2xl font-extrabold text-ink">{totalWords}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">Miscues Count</span>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">{miscueCount}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">Accuracy</span>
            <p className="mt-1 text-2xl font-extrabold text-brand-blue">{accuracyPct}%</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">Phil-IRI Profile</span>
            <p
              className={`mt-1 text-xl font-extrabold ${
                profileLabel === 'Independent'
                  ? 'text-emerald-600'
                  : profileLabel === 'Instructional'
                  ? 'text-brand-blue'
                  : 'text-brand-red'
              }`}
            >
              {profileLabel}
            </p>
          </div>
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
        // 1. Try direct review detail endpoint first
        const directRes = await fetch(`/api/teacher/assessments/review/${attemptId}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const directData = await directRes.json();
        if (directRes.ok && directData.success && directData.review) {
          setReviewData(directData.review);
          return;
        }

        // 2. Fallback to pending reviews if single fetch is not matched
        const pendingRes = await fetch('/api/teacher/assessments/pending-reviews', {
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
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
        <span className="text-xs font-semibold text-ink/60">Loading Phil-IRI oral review...</span>
      </div>
    );
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
