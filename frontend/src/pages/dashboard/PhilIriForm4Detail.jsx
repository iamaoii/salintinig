import { useParams } from 'react-router-dom';
import { Check, X } from '@phosphor-icons/react';
import BackButton from '../../components/BackButton.jsx';
import RecordActions from '../../components/dashboard/RecordActions.jsx';
import { students } from '../../data/students.js';
import { form4Levels, form4RecordByLrn, classInfo } from '../../data/philIriRecords.js';

function LevelMark({ active }) {
  return active ? (
    <Check size={14} weight="bold" className="mx-auto text-green-600" />
  ) : (
    <span className="block text-ink/20">-</span>
  );
}

export default function PhilIriForm4Detail() {
  const { lrn } = useParams();
  const student = students.find((s) => s.lrn === lrn) ?? students[0];
  const record = form4RecordByLrn[student.lrn];

  return (
    <div>
      <BackButton to="/dashboard/phil-iri-records/form-4" size={20} />

      <div className="mt-6 rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <div className="flex justify-end">
          <p className="text-xs text-ink/40">Phil-IRI FORM 4</p>
        </div>
        <p className="-mt-4 text-sm text-ink/50">{student.name}</p>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold text-ink">Individual Summary Record (ISR)</h2>
          <p className="text-sm italic text-ink/50">Talaan ng Indibidwal na Pagbasa (TIP)</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-ink sm:grid-cols-2">
          <p>
            <span className="text-ink/50">Name:</span> {student.name}
          </p>
          <p>
            <span className="text-ink/50">Grade/Section:</span> {classInfo.grade}-{classInfo.section}
          </p>
          <p>
            <span className="text-ink/50">School:</span> {classInfo.school}
          </p>
          <p>
            <span className="text-ink/50">Teacher:</span> {classInfo.teacher}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-xs text-ink/70">
                <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2">
                  Level
                </th>
                <th colSpan={3} className="border border-ink/10 bg-ink/[0.03] p-2">
                  Word Reading
                </th>
                <th colSpan={3} className="border border-ink/10 bg-ink/[0.03] p-2">
                  Comprehension
                </th>
                <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2">
                  Date Taken
                </th>
              </tr>
              <tr className="text-xs text-ink/70">
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Ind</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Ins</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Frus</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Ind</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Ins</th>
                <th className="border border-ink/10 bg-ink/[0.03] p-2">Frus</th>
              </tr>
            </thead>
            <tbody>
              {form4Levels.map((level) => {
                const isActive = level === record.wordReading.level;
                return (
                  <tr key={level}>
                    <td className="border border-ink/10 p-2 text-center font-medium text-ink">
                      {isActive ? '* ' : ''}
                      {level}
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.wordReading.ind} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.wordReading.ins} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.wordReading.frus} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.comprehension.ind} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.comprehension.ins} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <LevelMark active={isActive && record.comprehension.frus} />
                    </td>
                    <td className="border border-ink/10 p-2 text-center text-ink/70">
                      {isActive ? record.dateTaken : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs italic text-ink/50">
          Legend: Ind- Independent; Ins- Instructional; Frus- Frustration
        </p>

        <div className="mt-6 text-center">
          <h3 className="text-base font-semibold text-ink">Oral Reading Observation Checklist:</h3>
          <p className="text-sm italic text-ink/50">Talaan ng mga Puna Habang Nagbabasa</p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left text-xs text-ink/70">
                  Behaviors while Reading <span className="italic text-ink/40">(Paraan ng Pagbabasa)</span>
                </th>
                <th className="w-24 border border-ink/10 bg-ink/[0.03] p-2 text-xs text-ink/70">✓ or X</th>
              </tr>
            </thead>
            <tbody>
              {record.observationChecklist.map((row) => (
                <tr key={row.behavior}>
                  <td className="border border-ink/10 p-2 text-ink">
                    {row.behavior} <span className="italic text-ink/40">({row.behaviorFilipino})</span>
                  </td>
                  <td className="border border-ink/10 p-2 text-center text-ink/70">
                    {row.result.startsWith('X') ? (
                      <span className="inline-flex items-center gap-1">
                        <X size={14} className="text-brand-red" />
                        {row.result.replace('X', '').trim()}
                      </span>
                    ) : (
                      <Check size={14} className="mx-auto text-green-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <RecordActions />
      </div>
    </div>
  );
}
