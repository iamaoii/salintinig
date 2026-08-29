import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, WarningCircle, ShieldCheck, SpeakerHigh, SpeakerSlash, CheckCircle, Warning } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import { getToken } from '../../../lib/auth.js';

const MISCUE_TYPES = [
  { type: 'omission', label: 'Omission', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { type: 'substitution', label: 'Substitution', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
  { type: 'insertion', label: 'Insertion', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { type: 'repetition', label: 'Repetition', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { type: 'hesitation', label: 'Hesitation', color: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' },
  { type: 'self_correction', label: 'Self Correction', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' }
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
  const [miscues, setMiscues] = useState(() => {
    const verified = parseMiscues(reviewData?.verifiedMiscues);
    if (verified.length > 0) return verified;
    const ai = parseMiscues(reviewData?.aiMiscues);
    if (ai.length > 0) return ai;
    return parseMiscues(reviewData?.miscues);
  });
  const [selectedMiscueType, setSelectedMiscueType] = useState('omission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessSaved, setIsSuccessSaved] = useState(false);

  const audioUrl = reviewData?.audioUrl || reviewData?.audio_recording_url || reviewData?.audio || null;

  useEffect(() => {
    const verified = parseMiscues(reviewData?.verifiedMiscues);
    if (verified.length > 0) {
      setMiscues(verified);
      return;
    }
    const ai = parseMiscues(reviewData?.aiMiscues);
    if (ai.length > 0) {
      setMiscues(ai);
      return;
    }
    const standard = parseMiscues(reviewData?.miscues);
    if (standard.length > 0) {
      setMiscues(standard);
    }
  }, [reviewData]);

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
        map.set(Number(m.word_position), m);
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
      const exists = prev.some((m) => m.word_position === position);
      if (exists) {
        return prev.filter((m) => m.word_position !== position);
      }
      return [
        ...prev,
        {
          word_position: position,
          expected_word: words[idx] || '',
          spoken_word: '',
          miscue_type: selectedMiscueType,
        },
      ];
    });
  }, [words, selectedMiscueType]);

  const handleSaveVerification = async () => {
    const attemptId = reviewData?.attemptId;
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
        if (onVerified) {
          onVerified();
        }
      }
    } catch (err) {
      console.error('Failed to verify result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto">
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
            disabled={isSubmitting || isVerified}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition-all ${
              isVerified
                ? 'bg-emerald-600 cursor-default'
                : 'bg-brand-red hover:bg-brand-red/90 active:scale-95 cursor-pointer disabled:opacity-50'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle size={18} weight="bold" />
                <span>Result Verified & Locked</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} weight="bold" />
                <span>{isSubmitting ? 'Saving...' : 'Approve & Lock Official Result'}</span>
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

        {/* Miscue Type Selection Pills */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-ink">
              Miscue Classification Toolbar
            </label>
            <span className="text-[11px] text-ink/50 font-medium">Click any word below to tag or remove a miscue</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {MISCUE_TYPES.map((m) => {
              const isSelected = selectedMiscueType === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setSelectedMiscueType(m.type)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? `${m.color} ring-2 ring-brand-red/30 shadow-2xs scale-102`
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
                const miscue = miscueMap.get(idx + 1);
                const miscueType = miscue ? MISCUE_TYPE_MAP.get(miscue.miscue_type) : null;
                return (
                  <span
                    key={idx}
                    onClick={() => handleWordClick(idx)}
                    className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all hover:ring-2 hover:ring-brand-blue/40 ${
                      miscue
                        ? `${miscueType?.color || 'bg-red-100 text-red-700'} font-semibold border`
                        : 'hover:bg-cream'
                    }`}
                  >
                    {word}
                    {miscue && (
                      <sup className="ml-1 text-[8.5px] uppercase font-bold px-1 py-0.1 rounded bg-white/80 border border-current">
                        {miscue.miscue_type.substring(0, 3)}
                      </sup>
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
