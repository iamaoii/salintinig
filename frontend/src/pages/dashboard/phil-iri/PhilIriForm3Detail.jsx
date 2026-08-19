import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import RecordActions from '../../../components/dashboard/records/RecordActions.jsx';
import { decodeSecureToken } from '../../../lib/securityToken.js';
import { students } from '../../../data/students.js';
import { individualRecordsByLrn } from '../../../data/philIriRecords.js';

export default function PhilIriForm3Detail({ formKey, label, backTo }) {
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const student = students.find((s) => s.lrn === lrn || s.lrn === rawLrn) ?? students[0] ?? { name: 'Learner', lrn: '' };
  const initialRecord = (student?.lrn && individualRecordsByLrn[student.lrn]) ?? individualRecordsByLrn['136670100091'] ?? {
    duration: '03:45',
    wpm: 67,
    miscues: [
      { type: 'Mispronunciation', typeFilipino: 'Maling Bigkas', count: 2 },
      { type: 'Omission', typeFilipino: 'Pagkakaltas', count: 1 },
      { type: 'Substitution', typeFilipino: 'Pagpapalit', count: 1 },
      { type: 'Insertion', typeFilipino: 'Pagsingit', count: 0 },
      { type: 'Repetition', typeFilipino: 'Pag-uulit', count: 1 },
      { type: 'Reversal', typeFilipino: 'Pagsasalungat', count: 0 },
      { type: 'Refusal to Pronounce', typeFilipino: 'Hindi Pagbigkas', count: 0 },
    ],
    totalMiscues: 5,
    oralAccuracy: '92%',
    answers: ['Tama', 'Tama', 'Mali', 'Tama', 'Mali', 'Tama', 'Tama'],
    responses: ['Correct', 'Correct', 'Incorrect', 'Correct', 'Incorrect', 'Correct', 'Correct'],
    compScore: '5/7',
    compPercentage: '71%',
    readingLevel: 'Instructional',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [record, setRecord] = useState(initialRecord);

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleMiscueChange = (index, count) => {
    setRecord((prev) => {
      const nextMiscues = [...prev.miscues];
      nextMiscues[index] = { ...nextMiscues[index], count: Number(count) || 0 };
      const totalMiscues = nextMiscues.reduce((sum, m) => sum + m.count, 0);
      return { ...prev, miscues: nextMiscues, totalMiscues };
    });
  };

  return (
    <div>
      <BackButton to={backTo} size={20} />

      <div className="relative mt-6 rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        {showToast && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652]">
            <CheckCircle size={18} weight="fill" />
            <span>Individual record updated and saved successfully!</span>
          </div>
        )}



        <div className="flex justify-end">
          <p className="text-xs text-ink/40">Phil-IRI {label}</p>
        </div>
        <p className="-mt-4 text-sm text-ink/50">{student.name}</p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">PART A</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink">
            <p className="flex items-center gap-1.5">
              <span className="text-ink/50">Kabuuang Oras ng Pagbabasa:</span>
              {isEditing ? (
                <input
                  value={record.duration}
                  onChange={(e) => setRecord((r) => ({ ...r, duration: e.target.value }))}
                  className="w-28 bg-transparent text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                />
              ) : (
                record.duration
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-ink/50">Rate ng Pagbabasa</span>
              {isEditing ? (
                <input
                  value={record.rate}
                  onChange={(e) => setRecord((r) => ({ ...r, rate: e.target.value }))}
                  className="w-32 bg-transparent text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                />
              ) : (
                record.rate
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-ink/50">Marka:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={record.marka}
                  onChange={(e) => setRecord((r) => ({ ...r, marka: Number(e.target.value) }))}
                  className="w-16 bg-transparent text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                />
              ) : (
                record.marka
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-ink/50">Comprehension Level:</span>
              {isEditing ? (
                <input
                  value={record.comprehensionLevel}
                  onChange={(e) => setRecord((r) => ({ ...r, comprehensionLevel: e.target.value }))}
                  className="w-28 bg-transparent text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                />
              ) : (
                record.comprehensionLevel
              )}
            </p>
          </div>

          <p className="mt-3 text-sm text-ink/50">Sagot sa mga tanong:</p>
          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-ink sm:grid-cols-4">
            {(record?.answers || []).map((answer, i) => (
              <p key={i} className="flex items-center gap-1">
                <span className="font-semibold">{i + 1}.</span>
                {isEditing ? (
                  <input
                    value={answer}
                    onChange={(e) => {
                      const nextAns = [...(record?.answers || [])];
                      nextAns[i] = e.target.value;
                      setRecord((r) => ({ ...r, answers: nextAns }));
                    }}
                    className="w-10 bg-transparent text-center text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                  />
                ) : (
                  answer
                )}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">PART B</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            <p>
              <span className="text-ink/50">Seleksyon:</span> {record?.selection || 'N/A'}
            </p>
            <p>
              <span className="text-ink/50">Level:</span> {record?.level || 'Grade 4'}
            </p>
            <p>
              <span className="text-ink/50">Set:</span> {record?.set || 'A'}
            </p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink/70">
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">#</th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">
                    Type of Miscues <span className="italic text-ink/40">(Uri ng Mali)</span>
                  </th>
                  <th className="border border-ink/10 bg-ink/[0.03] p-2 text-left">
                    Number of Miscues <span className="italic text-ink/40">(Bilang ng Salitang mali ang basa)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(record?.miscues || []).map((miscue, i) => (
                  <tr key={miscue.type}>
                    <td className="border border-ink/10 p-2 text-ink/70">{i + 1}</td>
                    <td className="border border-ink/10 p-2 text-ink">
                      {miscue.type} <span className="italic text-ink/40">({miscue.typeFilipino})</span>
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/70">
                      {isEditing ? (
                        <input
                          type="number"
                          value={miscue.count}
                          onChange={(e) => handleMiscueChange(i, e.target.value)}
                          className="w-full bg-transparent text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                        />
                      ) : (
                        miscue.count
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium text-ink">
                  <td colSpan={2} className="border border-ink/10 p-2">
                    Total Miscues <span className="italic text-ink/50">(Kabuuan)</span>
                  </td>
                  <td className="border border-ink/10 p-2">{record.totalMiscues}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-ink/10 p-2 text-ink">
                    Number of Words in the Passage
                  </td>
                  <td className="border border-ink/10 p-2 text-ink/70">{record.totalWords}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-ink/10 p-2 text-ink">
                    Word Reading Score
                  </td>
                  <td className="border border-ink/10 p-2 text-ink/70">{record.wordReadingScore}</td>
                </tr>
                <tr className="font-medium text-ink">
                  <td colSpan={2} className="border border-ink/10 p-2">
                    Total Miscues <span className="italic text-ink/50">(Antas ng Pagbabasa)</span>
                  </td>
                  <td className="border border-ink/10 p-2">{record.readingLevel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <RecordActions
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    </div>
  );
}
