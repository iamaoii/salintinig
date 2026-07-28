import { useParams } from 'react-router-dom';
import BackButton from '../../components/BackButton.jsx';
import RecordActions from '../../components/dashboard/RecordActions.jsx';
import { students } from '../../data/students.js';
import { individualRecordsByLrn } from '../../data/philIriRecords.js';

export default function PhilIriForm3Detail({ formKey, label, backTo }) {
  const { lrn } = useParams();
  const student = students.find((s) => s.lrn === lrn) ?? students[0];
  const record = individualRecordsByLrn[student.lrn];

  return (
    <div>
      <BackButton to={backTo} size={20} />

      <div className="mt-6 rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
        <div className="flex justify-end">
          <p className="text-xs text-ink/40">Phil-IRI {label}</p>
        </div>
        <p className="-mt-4 text-sm text-ink/50">{student.name}</p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">PART A</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            <p>
              <span className="text-ink/50">Kabuuang Oras ng Pagbabasa:</span> {record.duration}
            </p>
            <p>
              <span className="text-ink/50">Rate ng Pagbabasa</span> {record.rate}
            </p>
            <p>
              <span className="text-ink/50">Marka:</span> {record.marka}
            </p>
            <p>
              <span className="text-ink/50">Comprehension Level:</span> {record.comprehensionLevel}
            </p>
          </div>

          <p className="mt-3 text-sm text-ink/50">Sagot sa mga tanong:</p>
          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-ink sm:grid-cols-4">
            {record.answers.map((answer, i) => (
              <p key={i}>
                <span className="font-semibold">{i + 1}.</span> {answer}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">PART B</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
            <p>
              <span className="text-ink/50">Seleksyon:</span> {record.selection}
            </p>
            <p>
              <span className="text-ink/50">Level:</span> {record.level}
            </p>
            <p>
              <span className="text-ink/50">Set:</span> {record.set}
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
                {record.miscues.map((miscue, i) => (
                  <tr key={miscue.type}>
                    <td className="border border-ink/10 p-2 text-ink/70">{i + 1}</td>
                    <td className="border border-ink/10 p-2 text-ink">
                      {miscue.type} <span className="italic text-ink/40">({miscue.typeFilipino})</span>
                    </td>
                    <td className="border border-ink/10 p-2 text-ink/70">{miscue.count}</td>
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

        <RecordActions />
      </div>
    </div>
  );
}
