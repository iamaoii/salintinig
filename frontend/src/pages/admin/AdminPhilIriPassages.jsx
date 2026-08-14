import { useState } from 'react';
import { Article, MagnifyingGlass, BookOpen, Ear, UserSound } from '@phosphor-icons/react';

const PASSAGE_SETS = ['Set A', 'Set B', 'Set C', 'Set D'];
const GRADES = ['Grade 4', 'Grade 5', 'Grade 6'];
const TYPES = [
  { key: 'oral-reading', label: 'Oral Reading', icon: UserSound, color: 'bg-brand-blue/10 text-brand-blue' },
  { key: 'listening', label: 'Listening', icon: Ear, color: 'bg-[#ffc300]/10 text-[#b38600]' },
  { key: 'silent-reading', label: 'Silent Reading', icon: BookOpen, color: 'bg-[#00a652]/10 text-[#00a652]' },
];

const PASSAGE_DATA = [
  { id: 1, title: 'Ang Masikhay na Magsasaka', grade: 'Grade 4', set: 'Set A', type: 'oral-reading', language: 'Filipino', period: 'Pre-Test', words: 120 },
  { id: 2, title: 'The Diligent Farmer', grade: 'Grade 4', set: 'Set A', type: 'oral-reading', language: 'English', period: 'Pre-Test', words: 118 },
  { id: 3, title: 'Ang Puso ng Kabundukan', grade: 'Grade 4', set: 'Set B', type: 'listening', language: 'Filipino', period: 'Pre-Test', words: 105 },
  { id: 4, title: 'Heart of the Mountains', grade: 'Grade 4', set: 'Set B', type: 'listening', language: 'English', period: 'Pre-Test', words: 110 },
  { id: 5, title: 'Ang Talim ng Pangarap', grade: 'Grade 5', set: 'Set A', type: 'oral-reading', language: 'Filipino', period: 'Pre-Test', words: 140 },
  { id: 6, title: 'The Sharpness of Dreams', grade: 'Grade 5', set: 'Set A', type: 'oral-reading', language: 'English', period: 'Pre-Test', words: 136 },
  { id: 7, title: 'Ang Dagat ng Kaalaman', grade: 'Grade 5', set: 'Set C', type: 'silent-reading', language: 'Filipino', period: 'Post-Test', words: 152 },
  { id: 8, title: 'The Sea of Knowledge', grade: 'Grade 5', set: 'Set C', type: 'silent-reading', language: 'English', period: 'Post-Test', words: 148 },
  { id: 9, title: 'Ang Liwanag ng Hinaharap', grade: 'Grade 6', set: 'Set D', type: 'oral-reading', language: 'Filipino', period: 'Post-Test', words: 170 },
  { id: 10, title: 'The Light of Tomorrow', grade: 'Grade 6', set: 'Set D', type: 'oral-reading', language: 'English', period: 'Post-Test', words: 165 },
];

export default function AdminPhilIriPassages() {
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSet, setSelectedSet] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PASSAGE_DATA.filter((p) => {
    if (selectedGrade !== 'All' && p.grade !== selectedGrade) return false;
    if (selectedSet !== 'All' && p.set !== selectedSet) return false;
    if (selectedType !== 'All' && p.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.language.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Article size={22} className="text-brand-red shrink-0" />
            <h2 className="text-xl font-bold text-ink">Phil-IRI Reading Passages</h2>
          </div>
          <p className="mt-0.5 text-xs text-ink/50">Browse reading passages across all grade levels, sets, and assessment types.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-brand-red/10 px-4 py-1.5">
          <span className="text-xs font-bold text-brand-red">{filtered.length} Passages</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-3.5 py-2 focus-within:border-brand-blue min-w-[200px] flex-1 max-w-xs">
          <MagnifyingGlass size={16} className="shrink-0 text-ink/40" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search passages..." className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/30" />
        </div>
        <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink outline-none cursor-pointer">
          <option value="All">All Grades</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink outline-none cursor-pointer">
          <option value="All">All Sets</option>
          {PASSAGE_SETS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink outline-none cursor-pointer">
          <option value="All">All Types</option>
          {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((passage) => {
          const typeInfo = TYPES.find((t) => t.key === passage.type) || TYPES[0];
          const TypeIcon = typeInfo.icon;
          return (
            <div key={passage.id} className="rounded-2xl border border-ink/10 bg-cream p-4 shadow-sm flex flex-col gap-2.5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${typeInfo.color}`}><TypeIcon size={18} weight="bold" /></div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-[10px] font-bold text-ink/60">{passage.set}</span>
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">{passage.grade}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink leading-tight">{passage.title}</h3>
                <p className="mt-0.5 text-xs text-ink/50 font-medium">{passage.language} - {typeInfo.label}</p>
              </div>
              <div className="flex items-center justify-between border-t border-ink/8 pt-2">
                <span className="text-[10px] font-semibold text-ink/50">{passage.words} words - {passage.period}</span>
                <button type="button" className="rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-[10px] font-bold text-ink/70 hover:bg-ink/5 cursor-pointer">Preview</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Article size={40} className="text-ink/20 mb-3" weight="regular" />
          <h3 className="text-sm font-bold text-ink">No passages found</h3>
          <p className="mt-1 text-xs text-ink/50">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
