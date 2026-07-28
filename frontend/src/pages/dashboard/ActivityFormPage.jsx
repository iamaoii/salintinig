import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ear, SpeakerHigh, BookOpen, CalendarBlank, Clock, Star, Check, ArrowsClockwise } from '@phosphor-icons/react';
import BackButton from '../../components/BackButton.jsx';
import Avatar from '../../components/dashboard/Avatar.jsx';
import { allClassActivities } from '../../data/classActivities.js';
import { students } from '../../data/students.js';

const ASSESSMENT_TYPES = [
  { key: 'listening', label: 'Listening Assessment', icon: Ear, color: 'bg-[#ffc300]/10 text-[#b38600]' },
  { key: 'oral-reading', label: 'Oral Reading Assessment', icon: SpeakerHigh, color: 'bg-brand-blue/10 text-brand-blue' },
  { key: 'silent-reading', label: 'Silent Reading Assessment', icon: BookOpen, color: 'bg-[#00a652]/10 text-[#00a652]' },
];

const LEVEL_TAG = {
  Frustrational: 'bg-brand-red/10 text-brand-red',
  Instructional: 'bg-[#ffc300]/10 text-[#b38600]',
  Independent: 'bg-[#00a652]/10 text-[#00a652]',
};

export default function ActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useMemo(() => allClassActivities.find((a) => a.id === id), [id]);

  const [name, setName] = useState(existing?.title ?? '');
  const [date, setDate] = useState('05/25/26');
  const [time, setTime] = useState('11:59 PM');
  const [stars, setStars] = useState(existing?.stars ?? 100);
  const [assessmentType, setAssessmentType] = useState(existing?.assessmentType ?? 'listening');
  const [instructions, setInstructions] = useState(existing?.instructions?.join('\n') ?? '');
  const [selectedStudents, setSelectedStudents] = useState(() => new Set(students.map((s) => s.lrn)));

  const toggleStudent = (lrn) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(lrn)) next.delete(lrn);
      else next.add(lrn);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedStudents((prev) => (prev.size === students.length ? new Set() : new Set(students.map((s) => s.lrn))));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard/class-activities/success');
  };

  return (
    <div>
      <BackButton to="/dashboard/class-activities" size={20} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
        <section>
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-lg font-semibold text-ink/30">Step 1</h2>
            <span className="text-sm text-ink/30">General Details</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 flex items-center justify-between text-sm text-ink/60">
                Name
                <span className="text-xs text-brand-red">Required</span>
              </label>
              <div className="flex items-center gap-2 rounded-[10px] border-2 border-brand-blue/40 px-3 py-2.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm text-ink outline-none"
                  placeholder="Activity name"
                />
                <Check size={16} className="shrink-0 text-brand-blue" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 flex items-center justify-between text-sm text-ink/60">
                  Date
                  <span className="text-xs text-brand-red">Required</span>
                </label>
                <div className="flex items-center gap-2 rounded-[10px] border-2 border-brand-blue/40 px-3 py-2.5">
                  <CalendarBlank size={16} className="shrink-0 text-ink/50" />
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-ink outline-none"
                  />
                  <Check size={16} className="shrink-0 text-brand-blue" />
                </div>
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between text-sm text-ink/60">
                  Time
                  <span className="text-xs text-brand-red">Required</span>
                </label>
                <div className="flex items-center gap-2 rounded-[10px] border-2 border-brand-blue/40 px-3 py-2.5">
                  <Clock size={16} className="shrink-0 text-ink/50" />
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-ink outline-none"
                  />
                  <Check size={16} className="shrink-0 text-brand-blue" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink/60">Stars</label>
              <div className="flex items-center gap-2 rounded-[10px] border-2 border-brand-blue/40 px-3 py-2.5">
                <Star size={16} className="shrink-0 text-ink/50" />
                <input
                  type="number"
                  value={stars}
                  onChange={(e) => setStars(e.target.value)}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
                <Check size={16} className="shrink-0 text-brand-blue" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-lg font-semibold text-ink/30">Step 2</h2>
            <span className="text-sm text-ink/30">Activity Content</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 flex items-center justify-between text-sm text-ink/60">
                Assessment Type
                <span className="text-xs text-brand-red">Required</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {ASSESSMENT_TYPES.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAssessmentType(key)}
                    className={`flex flex-col items-center gap-2 rounded-[10px] border-2 p-3 text-center transition-colors ${
                      assessmentType === key ? 'border-brand-blue' : 'border-transparent bg-ink/5'
                    }`}
                  >
                    <span className={`flex size-10 items-center justify-center rounded-full ${color}`}>
                      <Icon size={20} weight="fill" />
                    </span>
                    <span className="text-xs font-medium text-ink">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center justify-between text-sm text-ink/60">
                Description
                <span className="text-xs text-brand-red">Required</span>
              </label>
              <div className="rounded-[10px] border-2 border-brand-blue/40 bg-brand-blue/5 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Instructions:</p>
                  <Check size={16} className="shrink-0 text-brand-blue" />
                </div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  required
                  className="w-full resize-none bg-transparent text-sm text-ink outline-none"
                  placeholder="1. ..."
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-ink/30">Step 3</h2>
              <span className="text-sm text-ink/30">Select students</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-ink/10 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
                  <th className="w-12 px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Assessments</th>
                  <th className="w-12 px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === students.length}
                      onChange={toggleAll}
                      className="size-4 accent-brand-blue"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.lrn} className="border-b border-ink/5 last:border-b-0">
                    <td className="px-4 py-3 text-ink/50">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size={28} />
                        <span className="font-medium text-ink">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_TAG[student.level]}`}>
                        {student.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.lrn)}
                        onChange={() => toggleStudent(student.lrn)}
                        className="size-4 accent-brand-blue"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-[10px] bg-amber-400 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-amber-500"
          >
            <ArrowsClockwise size={18} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
