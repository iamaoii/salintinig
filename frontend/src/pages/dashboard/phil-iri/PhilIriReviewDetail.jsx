import { useState } from 'react';
import { Play, Pause, CheckCircle, ArrowLeft, Microphone, Warning, ShieldCheck } from '@phosphor-icons/react';
import { getToken } from '../../../lib/auth.js';

const MISCUE_TYPES = [
  { type: 'omission', label: 'Omission', color: 'bg-red-100 text-red-700 border-red-300' },
  { type: 'substitution', label: 'Substitution', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { type: 'insertion', label: 'Insertion', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { type: 'repetition', label: 'Repetition', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { type: 'hesitation', label: 'Hesitation', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { type: 'self_correction', label: 'Self Correction', color: 'bg-green-100 text-green-700 border-green-300' }
];

export default function PhilIriReviewDetail({ reviewData, onBack, onVerified }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [miscues, setMiscues] = useState(reviewData?.miscues || []);
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [selectedMiscueType, setSelectedMiscueType] = useState('omission');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passageText = reviewData?.passageText || 'Ang aso at ang pusa ay magkaibigan sa bakuran.';
  const words = passageText.split(/\s+/).filter(Boolean);

  const totalWords = words.length;
  const miscueCount = miscues.filter(m => m.miscue_type !== 'self_correction').length;
  const correctCount = Math.max(0, totalWords - miscueCount);
  const accuracyPct = Number(((correctCount / totalWords) * 100).toFixed(1));
  const wpm = reviewData?.wpm || 65;

  let profileLabel = 'Frustration';
  if (accuracyPct >= 97) profileLabel = 'Independent';
  else if (accuracyPct >= 90) profileLabel = 'Instructional';

  const handleWordClick = (idx) => {
    setSelectedWordIdx(idx);
    const existing = miscues.find(m => m.word_position === idx + 1);
    if (existing) {
      // Toggle off miscue
      setMiscues(prev => prev.filter(m => m.word_position !== idx + 1));
    } else {
      // Add miscue
      setMiscues(prev => [
        ...prev,
        {
          word_position: idx + 1,
          expected_word: words[idx],
          spoken_word: '',
          miscue_type: selectedMiscueType
        }
      ]);
    }
  };

  const handleSaveVerification = async () => {
    setIsSubmitting(true);
    try {
      const token = getToken();
      const attemptId = reviewData?.attemptId;
      const res = await fetch(`/api/teacher/assessments/${attemptId}/verify-oral`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          verifiedMiscues: miscues,
          verifiedWpm: wpm,
          verifiedAccuracyPct: accuracyPct,
          comprehensionScore: reviewData?.comprehensionScore || 80
        })
      });
      const data = await res.json();
      if (data.success && onVerified) {
        onVerified();
      }
    } catch (err) {
      console.error('Failed to verify result:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to Verification List
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
          <Warning size={14} /> Pending Teacher Approval
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{reviewData?.studentName || 'Student Oral Reading Test'}</h2>
            <p className="text-xs text-gray-500">Passage: {reviewData?.passageTitle || 'Set A - Filipino Grade 3'}</p>
          </div>
          <button
            onClick={handleSaveVerification}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-green-700 transition-all disabled:opacity-50"
          >
            <ShieldCheck size={18} /> Approve & Lock Official Result
          </button>
        </div>

        {/* Audio Player */}
        <div className="mt-6 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex size-12 items-center justify-center rounded-full bg-brand-red text-white shadow-md hover:bg-red-700"
          >
            {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1"><Microphone size={14} /> Audio Playback</span>
              <span>0:45 / 1:12</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/3 bg-brand-red transition-all"></div>
            </div>
          </div>
        </div>

        {/* Miscue Classification Selector */}
        <div className="mt-6">
          <label className="block text-xs font-bold text-gray-700 mb-2">Click any word below to mark or remove a miscue:</label>
          <div className="flex flex-wrap gap-2">
            {MISCUE_TYPES.map(m => (
              <button
                key={m.type}
                onClick={() => setSelectedMiscueType(m.type)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                  selectedMiscueType === m.type ? `${m.color} ring-2 ring-brand-red/30` : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Passage Text */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-6 leading-relaxed">
          <div className="flex flex-wrap gap-2 text-base font-medium text-gray-800">
            {words.map((word, idx) => {
              const miscue = miscues.find(m => m.word_position === idx + 1);
              const miscueType = MISCUE_TYPES.find(t => t.type === miscue?.miscue_type);
              return (
                <span
                  key={idx}
                  onClick={() => handleWordClick(idx)}
                  className={`cursor-pointer rounded px-1.5 py-0.5 transition-all hover:ring-2 hover:ring-gray-400 ${
                    miscue ? `${miscueType?.color || 'bg-red-100 text-red-700'} font-bold border` : ''
                  }`}
                >
                  {word}
                  {miscue && <sup className="ml-0.5 text-[10px] uppercase font-bold">{miscue.miscue_type.substring(0, 3)}</sup>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Real-Time Score Bar */}
        <div className="mt-6 grid grid-cols-4 gap-4 rounded-xl bg-gray-900 p-4 text-white">
          <div>
            <span className="text-[11px] text-gray-400">Total Words</span>
            <p className="text-xl font-bold">{totalWords}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400">Miscues Count</span>
            <p className="text-xl font-bold text-amber-400">{miscueCount}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400">Accuracy %</span>
            <p className="text-xl font-bold text-emerald-400">{accuracyPct}%</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400">Phil-IRI Profile</span>
            <p className={`text-lg font-bold ${profileLabel === 'Independent' ? 'text-green-400' : profileLabel === 'Instructional' ? 'text-blue-400' : 'text-red-400'}`}>
              {profileLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
