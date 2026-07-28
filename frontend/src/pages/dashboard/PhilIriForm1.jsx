import RecordActions from '../../components/dashboard/RecordActions.jsx';
import { classInfo, form1Rows, form1Totals } from '../../data/philIriRecords.js';

const COPY = {
  fil: {
    formLabel: 'Phil-IRI FORM 1A',
    title: 'Talaan ng Pangkatang Pagtatasa ng Klase (TPPK)',
    fields: [
      ['Baitang:', classInfo.grade],
      ['Seksyon:', classInfo.section],
      ['Guro:', classInfo.teacher],
    ],
    fields2: [
      ['Antas ng pangkatang pagtatasa:', classInfo.level],
      ['Petsa:', classInfo.date],
    ],
    school: ['Paaralan:', classInfo.school],
    name: 'Pangalan',
    testTaken: 'Nakuha ang pagtatasa',
    responsesHeader: 'Bilang ng Tamang Sagot (Ayon sa Uri ng Tanong)',
    literal: 'Literal',
    inferential: 'Paghihinuha (Inferential)',
    critical: 'Kritikal',
    total: 'Kabuuang Marka',
    below14: 'Markang <14',
    above14: 'Markang >14*',
    totalStudents: 'Kabuuang bilang ng mag-aaral',
    footnote: '*Ang mag-aaral na nagtamo ng kabuuang marka na >= 14/20 ay hindi na kailangang kumuha ng Phil-IRI.',
  },
  en: {
    formLabel: 'Phil-IRI FORM 1B',
    title: 'Screening Test Class Reading Record (STCRR)',
    fields: [
      ['Grade:', classInfo.grade],
      ['Section:', classInfo.section],
      ['Teacher:', classInfo.teacher],
    ],
    fields2: [
      ['Screening Test Level:', classInfo.level],
      ['Date:', classInfo.date],
    ],
    school: ['School:', classInfo.school],
    name: 'Name',
    testTaken: 'Test Taken',
    responsesHeader: 'Number of Correct Responses',
    literal: 'Literal',
    inferential: 'Inferential',
    critical: 'Critical',
    total: 'Kabuuang Marka',
    below14: 'Markang <14',
    above14: 'Markang >14+',
    totalStudents: 'Total number of students',
    footnote: '*Students with a total score of >= 14/20 do not need to take the Phil-IRI',
  },
};

export default function PhilIriForm1({ language }) {
  const copy = COPY[language];

  return (
    <div className="rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      <div className="flex justify-end">
        <p className="text-xs text-ink/40">{copy.formLabel}</p>
      </div>
      <h2 className="-mt-4 text-center text-lg font-semibold text-ink">{copy.title}</h2>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink">
        {copy.fields.map(([label, value]) => (
          <p key={label}>
            <span className="font-semibold">{label}</span> {value}
          </p>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink">
        <p>
          <span className="font-semibold">{copy.school[0]}</span> {copy.school[1]}
        </p>
        {copy.fields2.map(([label, value]) => (
          <p key={label}>
            <span className="font-semibold">{label}</span> {value}
          </p>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-xs text-ink/70">
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                {copy.name}
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                {copy.testTaken}
              </th>
              <th colSpan={3} className="border border-ink/10 bg-ink/[0.03] p-2">
                {copy.responsesHeader}
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                {copy.total}
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                {copy.below14}
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                {copy.above14}
              </th>
            </tr>
            <tr className="text-xs text-ink/70">
              <th className="border border-ink/10 bg-ink/[0.03] p-2">{copy.literal}</th>
              <th className="border border-ink/10 bg-ink/[0.03] p-2">{copy.inferential}</th>
              <th className="border border-ink/10 bg-ink/[0.03] p-2">{copy.critical}</th>
            </tr>
          </thead>
          <tbody>
            {form1Rows.map((row, i) => (
              <tr key={row.lrn}>
                <td className="border border-ink/10 p-2 text-ink">
                  {i + 1}. {row.name}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.testTaken}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.literal}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.inferential}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.critical}</td>
                <td className="border border-ink/10 p-2 text-center font-medium text-ink">{row.total}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.below14}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.above14}</td>
              </tr>
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`blank-${i}`}>
                <td className="border border-ink/10 p-2 text-ink/40">{form1Rows.length + i + 1}.</td>
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
                <td className="border border-ink/10 p-2" />
              </tr>
            ))}
            <tr className="font-medium text-ink">
              <td className="border border-ink/10 p-2">{copy.totalStudents}</td>
              <td className="border border-ink/10 p-2 text-center">{form1Totals.totalStudents}</td>
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2 text-center">{form1Totals.below14}</td>
              <td className="border border-ink/10 p-2 text-center">{form1Totals.above14}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs italic text-ink/50">{copy.footnote}</p>

      <RecordActions />
    </div>
  );
}
