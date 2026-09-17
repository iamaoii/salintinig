import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import RecordActions from '../../../components/dashboard/records/RecordActions.jsx';
import { classInfo, form1Rows } from '../../../data/philIriRecords.js';

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
    totalStudents: 'Kabuuang Bilang ng Mag-aaral',
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
    totalStudents: 'Total Number of Students',
    footnote: '*Students with a total score of >= 14/20 do not need to take the Phil-IRI',
  },
};

export default function PhilIriForm1({ language }) {
  const copy = COPY[language];
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [rowsData, setRowsData] = useState(form1Rows);

  const handleCellChange = (index, field, value) => {
    setRowsData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const totals = {
    totalStudents: rowsData.length,
    below14: rowsData.filter((r) => r.below14 === '/').length,
    above14: rowsData.filter((r) => r.above14 === '/').length,
  };

  return (
    <div className="relative rounded-[10px] border border-ink/10 bg-cream p-6 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.1)]">
      {showToast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652]">
          <CheckCircle size={18} weight="fill" />
          <span>Record updated and saved successfully!</span>
        </div>
      )}



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
            {rowsData.map((row, i) => (
              <tr key={row.lrn} className={isEditing ? 'bg-blue-50/20' : ''}>
                <td className="border border-ink/10 p-2 text-ink">
                  {i + 1}. {row.name}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">
                  {isEditing ? (
                    <input
                      value={row.testTaken}
                      onChange={(e) => handleCellChange(i, 'testTaken', e.target.value)}
                      className="w-full bg-transparent text-center text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.testTaken
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">
                  {isEditing ? (
                    <input
                      value={row.literal}
                      onChange={(e) => handleCellChange(i, 'literal', e.target.value)}
                      className="w-full bg-transparent text-center text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.literal
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">
                  {isEditing ? (
                    <input
                      value={row.inferential}
                      onChange={(e) => handleCellChange(i, 'inferential', e.target.value)}
                      className="w-full bg-transparent text-center text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.inferential
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">
                  {isEditing ? (
                    <input
                      value={row.critical}
                      onChange={(e) => handleCellChange(i, 'critical', e.target.value)}
                      className="w-full bg-transparent text-center text-xs font-semibold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.critical
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-center font-medium text-ink">
                  {isEditing ? (
                    <input
                      value={row.total}
                      onChange={(e) => handleCellChange(i, 'total', e.target.value)}
                      className="w-full bg-transparent text-center text-xs font-bold text-ink outline-none border-b border-dashed border-ink/30 focus:border-brand-blue"
                    />
                  ) : (
                    row.total
                  )}
                </td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.below14}</td>
                <td className="border border-ink/10 p-2 text-center text-ink/70">{row.above14}</td>
              </tr>
            ))}

            <tr className="font-medium text-ink">
              <td className="border border-ink/10 p-2">{copy.totalStudents}</td>
              <td className="border border-ink/10 p-2 text-center">{totals.totalStudents}</td>
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2" />
              <td className="border border-ink/10 p-2 text-center">{totals.below14}</td>
              <td className="border border-ink/10 p-2 text-center">{totals.above14}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs italic text-ink/50">{copy.footnote}</p>

      <RecordActions
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  );
}
