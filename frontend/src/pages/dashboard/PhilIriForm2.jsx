import RecordActions from '../../components/dashboard/RecordActions.jsx';
import { schoolInfo, form2Rows, form2Total } from '../../data/philIriRecords.js';

export default function PhilIriForm2() {
  return (
    <div className="rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      <div className="flex justify-end">
        <p className="text-xs text-ink/40">Phil-IRI FORM 2</p>
      </div>
      <h2 className="-mt-4 text-center text-lg font-semibold text-ink">
        Talaan ng Paaralan sa Pagbabasa (TPP) / School Reading Profile (SRP)
      </h2>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink">
        <p>
          <span className="font-semibold">School:</span> {schoolInfo.school}
        </p>
        <p>
          <span className="font-semibold">Division:</span> {schoolInfo.division}
        </p>
        <p>
          <span className="font-semibold">District:</span> {schoolInfo.district}
        </p>
      </div>
      <p className="mt-2 text-sm text-ink">
        <span className="font-semibold">Region:</span> {schoolInfo.region}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-xs text-ink/70">
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                Grade
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                Sections
              </th>
              <th rowSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2 align-bottom">
                Enrolment
              </th>
              <th colSpan={2} className="border border-ink/10 bg-ink/[0.03] p-2">
                Score (Marka)
              </th>
            </tr>
            <tr className="text-xs text-ink/70">
              <th className="border border-ink/10 bg-ink/[0.03] p-2">Markang &gt;= 14</th>
              <th className="border border-ink/10 bg-ink/[0.03] p-2">Markang &lt;= 14</th>
            </tr>
          </thead>
          <tbody>
            {form2Rows.map((row, i) => (
              <tr key={i} className={row.isGradeTotal ? 'font-semibold text-ink' : 'text-ink/70'}>
                <td className="border border-ink/10 p-2">{row.grade}</td>
                <td className="border border-ink/10 p-2">{row.section}</td>
                <td className="border border-ink/10 p-2 text-right">{row.enrolment}</td>
                <td className="border border-ink/10 p-2 text-right">{row.above14}</td>
                <td className="border border-ink/10 p-2 text-right">{row.below14}</td>
              </tr>
            ))}
            <tr className="font-semibold text-ink">
              <td colSpan={2} className="border border-ink/10 p-2">
                TOTAL
              </td>
              <td className="border border-ink/10 p-2 text-right">{form2Total.enrolment}</td>
              <td className="border border-ink/10 p-2 text-right">{form2Total.above14}</td>
              <td className="border border-ink/10 p-2 text-right">{form2Total.below14}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <RecordActions />
    </div>
  );
}
