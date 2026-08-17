import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Ear,
  UserSound,
  BookOpen,
  CalendarBlank,
  Clock,
  Star,
  Check,
  FloppyDisk,
  X,
  MagnifyingGlass,
  UsersThree,
} from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import { allClassActivities } from '../../../data/classActivities.js';
import { getToken } from '../../../lib/auth.js';

const ASSESSMENT_TYPES = [
  { key: 'listening', label: 'Listening Assessment', icon: Ear, color: 'bg-[#ffc300]/10 text-[#b38600]' },
  { key: 'oral-reading', label: 'Oral Reading Assessment', icon: UserSound, color: 'bg-brand-blue/10 text-brand-blue' },
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
  const isEditing = Boolean(id);
  const existing = useMemo(() => allClassActivities.find((a) => a.id === id), [id]);

  const [students, setStudents] = useState([]);
  const [name, setName] = useState(existing?.title ?? '');
  const [date, setDate] = useState('05/25/26');
  const [time, setTime] = useState('11:59 PM');
  const [stars, setStars] = useState(existing?.stars ?? 100);
  const [assessmentType, setAssessmentType] = useState(existing?.assessmentType ?? 'listening');
  const [instructions, setInstructions] = useState(existing?.instructions?.join('\n') ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = getToken();
        const res = await fetch('http://localhost:5000/api/admin/students', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.students)) {
          setStudents(data.students);
          setSelectedStudents(new Set(data.students.map((s) => s.lrn)));
        }
      } catch (err) {
        console.warn('Fetch activity form students error:', err);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [students, searchQuery]);

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
    navigate('/teacher/class-activities/practice/success');
  };

  return (
    <div className="w-full">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-2.5">
        <div className="flex items-center gap-5">
          <BackButton size={22} />
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {isEditing ? 'Edit Activity' : 'Create New Activity'}
            </h1>
            <p className="text-xs sm:text-sm text-ink/60">
              Configure activity details, instructions, and student assignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <FloppyDisk size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Left Column - General & Content Fields */}
        <div className="flex flex-col gap-3.5 lg:col-span-7">
          {/* Card 1: General Details */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-ink">General Details</h2>

            <div className="flex flex-col gap-2.5">
              {/* Activity Name */}
              <div>
                <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                  Activity Name <span className="text-brand-red">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 focus-within:border-brand-blue">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
                    placeholder="e.g. Listening Assessment"
                  />
                  {name && <Check size={18} className="shrink-0 text-brand-blue" />}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Due Date <span className="text-brand-red">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 focus-within:border-brand-blue">
                    <CalendarBlank size={18} className="shrink-0 text-ink/40" />
                    <input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                    Due Time <span className="text-brand-red">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 focus-within:border-brand-blue">
                    <Clock size={18} className="shrink-0 text-ink/40" />
                    <input
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-ink outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Reward Stars */}
              <div>
                <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                  Reward Stars
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 focus-within:border-brand-blue">
                  <Star size={18} className="shrink-0 text-amber-500" />
                  <input
                    type="number"
                    value={stars}
                    onChange={(e) => setStars(e.target.value)}
                    className="w-full bg-transparent text-sm text-ink outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Activity Content */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-ink">Activity Content</h2>

            <div className="flex flex-col gap-2.5">
              {/* Assessment Type Selector */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-ink/80">
                  Assessment Type <span className="text-brand-red">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {ASSESSMENT_TYPES.map(({ key, label, icon: Icon, color }) => {
                    const isSelected = assessmentType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAssessmentType(key)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-blue bg-blue-50/50 shadow-sm'
                            : 'border-ink/10 bg-white hover:bg-ink/5'
                        }`}
                      >
                        <span className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
                          <Icon size={18} weight="bold" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-ink">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="mb-1 block text-xs sm:text-sm font-semibold text-ink/80">
                  Instructions <span className="text-brand-red">*</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={5}
                  required
                  className="w-full rounded-xl border border-ink/15 bg-white p-3.5 text-sm text-ink outline-none focus:border-brand-blue placeholder:text-ink/30 leading-relaxed resize-y"
                  placeholder="Enter activity instructions line by line..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Assigned Students Panel */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex flex-col rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <UsersThree size={20} className="text-ink/60" />
                <h2 className="text-base font-semibold text-ink">Assigned Students</h2>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-0.5 text-xs sm:text-sm font-semibold text-brand-blue">
                {selectedStudents.size}/{students.length}
              </span>
            </div>

            {/* Search & Select All Bar */}
            <div className="mt-1 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 focus-within:border-brand-blue">
                <MagnifyingGlass size={18} className="shrink-0 text-ink/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student..."
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
                />
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="whitespace-nowrap rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink/70 hover:bg-ink/5 cursor-pointer"
              >
                {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Student List */}
            <div className="mt-2.5 h-[520px] overflow-y-auto rounded-xl border border-ink/10 bg-white p-1.5">
              <div className="flex flex-col gap-1">
                {filteredStudents.map((student) => {
                  const isChecked = selectedStudents.has(student.lrn);
                  return (
                    <label
                      key={student.lrn}
                      className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors ${
                        isChecked ? 'bg-blue-50/40' : 'hover:bg-ink/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.name} size={30} />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-ink">{student.name}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_TAG[student.level]}`}>
                            {student.level}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudent(student.lrn)}
                        className="size-4.5 rounded accent-brand-blue cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
