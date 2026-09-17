import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import RecordActions from '../../../components/dashboard/records/RecordActions.jsx';
import { schoolInfo, form2Rows, form2Total } from '../../../data/philIriRecords.js';

export default function PhilIriForm2() {
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [rowsData, setRowsData] = useState(form2Rows);

  const handleCellChange = (index, field, value) => {
    setRowsData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: Number(value) || value };
      return next;
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="relative rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      {showToast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652]">
          <CheckCircle size={18} weight="fill" />
          <span>Form 2 record updated and saved successfully!</span>
        </div>
      )}



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
            {rowsData.map((row, i) => (
              <tr key={i} className={row.isGradeTotal ? 'font-semibold text-ink' : 'text-ink/70'}>
                <td className="border border-ink/10 p-2">{row.grade}</td>
                <td className="border border-ink/10 p-2">{row.section}</td>
                <td className="border border-ink/10 p-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={row.enrolment}
                      onChange={(e) => handleCellChange(i, 'enrolment', e.target.value)}
                      className="w-full bg-transparent text-right text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.enrolment
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={row.above14}
                      onChange={(e) => handleCellChange(i, 'above14', e.target.value)}
                      className="w-full bg-transparent text-right text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.above14
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={row.below14}
                      onChange={(e) => handleCellChange(i, 'below14', e.target.value)}
                      className="w-full bg-transparent text-right text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.below14
                  )}
                </td>
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

      <RecordActions
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  );
}
