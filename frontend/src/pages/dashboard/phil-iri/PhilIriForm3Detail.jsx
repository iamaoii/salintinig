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
  const student = students.find((s) => s.lrn === lrn || s.lrn === rawLrn) ?? students[0] ?? { name: 'Karlo Roman', lrn: '136670100091', grade: '6', section: 'Rizal', age: '12', school: 'Emilio Aguinaldo Elementary School', teacher: 'Ms. Joy Masayahin' };

  const isTagalog = formKey === 'form-3a';

  const defaultMiscues = isTagalog
    ? [
        { id: 1, nameEn: 'Mispronunciation', nameFil: 'Maling Bigkas', count: 1 },
        { id: 2, nameEn: 'Omission', nameFil: 'Pagkakaltas', count: 1 },
        { id: 3, nameEn: 'Substitution', nameFil: 'Pagpapalit', count: 2 },
        { id: 4, nameEn: 'Insertion', nameFil: 'Pagsisiringit', count: 1 },
        { id: 5, nameEn: 'Repetition', nameFil: 'Pag-uulit', count: 3 },
        { id: 6, nameEn: 'Transposition', nameFil: 'Pagpapalit ng lugar', count: 1 },
        { id: 7, nameEn: 'Reversal', nameFil: 'Paglilipat', count: 0 },
      ]
    : [
        { id: 1, nameEn: 'Mispronunciation', nameFil: 'Maling Bigkas', count: 1 },
        { id: 2, nameEn: 'Omission', nameFil: 'Pagkakaltas', count: 1 },
        { id: 3, nameEn: 'Substitution', nameFil: 'Pagpapalit', count: 2 },
        { id: 4, nameEn: 'Insertion', nameFil: 'Pagsisiringit', count: 1 },
        { id: 5, nameEn: 'Repetition', nameFil: 'Pag-uulit', count: 3 },
        { id: 6, nameEn: 'Transposition', nameFil: 'Pagpapalit ng lugar', count: 1 },
        { id: 7, nameEn: 'Reversal', nameFil: 'Paglilipat', count: 0 },
      ];

  const initialRecord = {
    passageTitle: '"Isang Pangarap"',
    passageText: `Kasama si Jamil, isang batang Muslim, sa sumalubong sa pagdating ng kanyang tiyuhin.\n\n"Tito Abdul, saan po ba kayo galing?" tanong ni Jamil.\n\n"Galing ako sa Mecca, ang banal na sambahan nating mga Muslim. Bawat isa sa atin ay nangangarap na makapunta roon. Mapalad ako dahil narating ko iyon."\n\n"Bakit ngayon po kayo nagpunta roon?"\n\n"Kasi, isinasagawa natin ngayon ang Ramadan, ang pinakabanal na gawain ng mga Muslim. Pag-alala ito sa ating banal na akdat na tinatawag na Koran. Doon ipinahayog na sugo ni Allah si Mohammed."\n\n"Alam ko po ang Ramadan. Nag-aayuno tayo at hindi kumakain mula sa pagsikat ng araw hanggang hapon."\n\n"Oo. Isang paraan kasi natin ito upang ipakita ang pagsisis sa nagawa nating kasalanan."\n\n"Ang pagtatapos ng Ramadan," dagdag pa ni Tito Abdul, "ay masayang ipinagdiriwang din nating mga Muslim."\n\n"Pangarap ko rin pong makapunta sa Mecca," sabi ni Jamil.`,
    level: 'Grade 4',
    wordCount: 144,
    testType: 'Pre-Test',
    set: 'A',
    date: '17-Hunyo, 2014',
    readingTimeMinutes: '1.50',
    readingRateWpm: '78',
    questionAnswers: ['a', 'b', 'b', 'd', 'c', 'a', 'b'],
    compMarka: 4,
    compPercentage: 57,
    compLevel: 'Frustration',
    miscues: defaultMiscues,
    selection: 'Isang Pangako',
    ...(individualRecordsByLrn[student?.lrn] || {}),
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [record, setRecord] = useState(initialRecord);

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const totalMiscues = (record.miscues || []).reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const numWords = record.wordCount || 144;
  const wordReadingScore = (((numWords - totalMiscues) / numWords) * 100).toFixed(2);
  const wordReadingLevel = wordReadingScore >= 97 ? 'Independent' : wordReadingScore >= 90 ? 'Instructional' : 'Frustration';

  const handleMiscueChange = (index, val) => {
    const updated = [...record.miscues];
    updated[index] = { ...updated[index], count: Math.max(0, Number(val) || 0) };
    setRecord((prev) => ({ ...prev, miscues: updated }));
  };

  const formTitleMap = {
    'form-3a': 'Markahang Papel ng Panggradong Lebel na Teksto (Filipino)',
    'form-3b': 'Graded Passage Rating Sheet (English)',
    'form-4': 'RUNNING RECORD FORM',
  };

  const formTitle = formTitleMap[formKey] || 'Markahang Papel ng Panggradong Lebel na Teksto';
  const pageFormCode = isTagalog ? 'Phil-IRI Form 3A' : 'Phil-IRI Form 3B';

  return (
    <div className="pb-10">
      <BackButton to={backTo} size={20} />

      {/* Header Bar */}
      <div className="mt-4 mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">
          PHIL-IRI {label} - {formTitle.toUpperCase()}
        </h3>
      </div>

      {showToast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#00a652]/15 px-4 py-3 text-xs font-semibold text-[#00a652]">
          <CheckCircle size={18} weight="fill" />
          <span>Individual assessment record updated successfully!</span>
        </div>
      )}

      {/* Main Container mimicking Official Phil-IRI Form 3A/3B PDF manual pages */}
      <div className="space-y-8">
        
        {/* PAGE 1: PASSAGE & STUDENT METADATA */}
        <div className="rounded-xl border border-ink/15 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex justify-end text-xs font-semibold text-ink/60">
            {pageFormCode}, Pahina 1
          </div>

          <div className="text-center mt-2">
            <h4 className="text-base sm:text-lg font-bold text-ink">
              {isTagalog ? 'Markahang Papel ng Panggradong Lebel na Teksto' : 'Graded Passage Rating Sheet'}
            </h4>
            <p className="text-sm font-semibold text-ink/70 mt-1">
              {isTagalog ? `Panimulang Pagtatasa sa Filipino` : `Pre-Test Assessment in English`}
            </p>
            <p className="text-sm font-bold text-ink mt-0.5">
              Set {record.set} ({record.level})
            </p>
          </div>

          {/* Student & School Metadata Fields */}
          <div className="mt-6 border-b border-t border-ink/15 py-4 text-xs sm:text-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-ink/60">Name: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{student.name || 'Karlo Roman'}</span>
            </div>
            <div>
              <span className="text-ink/60">Age: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{student.age || '12'}</span>
            </div>
            <div>
              <span className="text-ink/60">Baitang /Section: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{student.grade || '6'}-{student.section || 'Rizal'}</span>
            </div>
            <div>
              <span className="text-ink/60">School: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{student.school || 'Emilio Aguinaldo Elementary School'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-ink/60">Teacher: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{student.teacher || 'Ms. Joy Masayahin'}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={record.testType === 'Pre-Test'} onChange={() => setRecord(r => ({ ...r, testType: 'Pre-Test' }))} disabled={!isEditing} />
                <span>Pre-Test</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={record.testType === 'Post-Test'} onChange={() => setRecord(r => ({ ...r, testType: 'Post-Test' }))} disabled={!isEditing} />
                <span>Post-Test</span>
              </label>
            </div>
            <div>
              <span className="text-ink/60">Level: </span>
              <span className="font-semibold text-ink">{record.level}</span>
            </div>
            <div>
              <span className="text-ink/60">Set: </span>
              <span className="font-semibold text-ink">{record.set}</span>
            </div>
            <div>
              <span className="text-ink/60">Date: </span>
              <span className="font-semibold underline decoration-dotted text-ink">{record.date}</span>
            </div>
          </div>

          {/* Passage Reading Text Box */}
          <div className="mt-6 border-2 border-ink/30 rounded-lg p-5 sm:p-7 bg-amber-50/20">
            <h5 className="text-center text-base font-bold text-ink mb-4">
              {record.passageTitle}
            </h5>
            <div className="text-xs sm:text-sm leading-relaxed text-ink/90 whitespace-pre-line space-y-3 font-serif">
              {record.passageText}
            </div>
            <div className="mt-6 flex flex-wrap justify-between items-center text-xs font-semibold text-ink/70 pt-3 border-t border-ink/15">
              <span>Level: {record.level}</span>
              <span>Bilang ng mga salita: {record.wordCount}</span>
            </div>
          </div>
        </div>

        {/* PAGE 2: PART A & PART B EVALUATION SCORE SHEET */}
        <div className="rounded-xl border border-ink/15 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex justify-end text-xs font-semibold text-ink/60">
            {pageFormCode}, Pahina 2
          </div>

          {/* PART A */}
          <div className="mt-2">
            <h4 className="text-sm font-bold text-ink tracking-wider border-b border-ink/15 pb-1">
              PART A
            </h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-ink/70">Kabuuang Oras ng Pagbasa:</span>
                {isEditing ? (
                  <input
                    value={record.readingTimeMinutes}
                    onChange={(e) => setRecord((r) => ({ ...r, readingTimeMinutes: e.target.value }))}
                    className="w-20 border-b border-dashed border-ink/40 text-center font-semibold text-ink outline-none"
                  />
                ) : (
                  <span className="font-semibold underline text-ink">{record.readingTimeMinutes} minuto</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-ink/70">Rate ng Pagbasa:</span>
                {isEditing ? (
                  <input
                    value={record.readingRateWpm}
                    onChange={(e) => setRecord((r) => ({ ...r, readingRateWpm: e.target.value }))}
                    className="w-20 border-b border-dashed border-ink/40 text-center font-semibold text-ink outline-none"
                  />
                ) : (
                  <span className="font-semibold underline text-ink">{record.readingRateWpm} salita /minuto</span>
                )}
              </div>
            </div>

            <div className="mt-4 text-xs sm:text-sm flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <span className="text-ink/70">Sagot sa mga Tanong: Marka: </span>
                {isEditing ? (
                  <input
                    type="number"
                    value={record.compMarka}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const pct = Math.round((val / 7) * 100);
                      const lvl = pct >= 80 ? 'Independent' : pct >= 59 ? 'Instructional' : 'Frustration';
                      setRecord((r) => ({ ...r, compMarka: val, compPercentage: pct, compLevel: lvl }));
                    }}
                    className="w-12 border-b border-dashed border-ink/40 text-center font-semibold text-ink outline-none"
                  />
                ) : (
                  <span className="font-semibold underline text-ink">{record.compMarka}</span>
                )}
              </div>

              <div>
                <span className="text-ink/70">%= </span>
                <span className="font-semibold underline text-ink">{record.compPercentage}%</span>
              </div>

              <div>
                <span className="text-ink/70">Comprehension Level: </span>
                <span className="font-semibold underline text-ink">{record.compLevel}</span>
              </div>
            </div>

            {/* Questions 1-7 */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm border-t border-ink/10 pt-3">
              {record.questionAnswers.map((ans, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-ink/60 font-semibold">{idx + 1}.</span>
                  {isEditing ? (
                    <input
                      value={ans}
                      onChange={(e) => {
                        const newAns = [...record.questionAnswers];
                        newAns[idx] = e.target.value;
                        setRecord((r) => ({ ...r, questionAnswers: newAns }));
                      }}
                      className="w-12 border-b border-dashed border-ink/40 text-center font-semibold text-ink outline-none"
                    />
                  ) : (
                    <span className="font-semibold underline text-ink">{ans}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PART B */}
          <div className="mt-8">
            <h4 className="text-sm font-bold text-ink tracking-wider border-b border-ink/15 pb-1">
              PART B
            </h4>

            <p className="mt-3 text-xs sm:text-sm font-bold text-ink">
              Word Reading (Pagbasa)
            </p>

            <div className="mt-2 text-xs sm:text-sm flex flex-wrap gap-x-8 gap-y-2 text-ink/80">
              <div>
                <span className="text-ink/60">Seleksyon: </span>
                <span className="font-semibold underline text-ink">{record.selection}</span>
              </div>
              <div>
                <span className="text-ink/60">Level: </span>
                <span className="font-semibold underline text-ink">{record.level}</span>
              </div>
              <div>
                <span className="text-ink/60">Set: </span>
                <span className="font-semibold underline text-ink">{record.set}</span>
              </div>
            </div>

            {/* Miscues Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-ink/30 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-ink/5 text-ink font-bold text-center">
                    <th className="border border-ink/30 p-2 w-12">#</th>
                    <th className="border border-ink/30 p-2 text-left">
                      Types of Miscues <span className="font-normal italic text-ink/70">(Uri ng Mali)</span>
                    </th>
                    <th className="border border-ink/30 p-2 w-48 text-center">
                      Number of Miscues <br />
                      <span className="font-normal italic text-ink/70">(Bilang ng Salitang mali ang basa)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.miscues.map((m, i) => (
                    <tr key={m.id} className="hover:bg-ink/[0.02]">
                      <td className="border border-ink/30 p-2 text-center font-bold">{m.id}</td>
                      <td className="border border-ink/30 p-2 text-ink">
                        {m.nameEn} <span className="italic text-ink/60">({m.nameFil})</span>
                      </td>
                      <td className="border border-ink/30 p-2 text-center font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={m.count}
                            onChange={(e) => handleMiscueChange(i, e.target.value)}
                            className="w-16 border-b border-dashed border-ink/40 text-center font-bold text-ink outline-none"
                          />
                        ) : (
                          m.count || ''
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-ink/5 font-bold">
                    <td colSpan={2} className="border border-ink/30 p-2 text-right">
                      Total Miscues <span className="italic font-normal text-ink/70">(Kabuuan)</span>
                    </td>
                    <td className="border border-ink/30 p-2 text-center text-ink">{totalMiscues}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-ink/30 p-2 font-bold text-right">
                      Number of Words in the Passage
                    </td>
                    <td className="border border-ink/30 p-2 text-center font-bold text-ink">{record.wordCount}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-ink/30 p-2 font-bold text-right">
                      Word Reading Score
                    </td>
                    <td className="border border-ink/30 p-2 text-center font-bold text-ink">{wordReadingScore}%</td>
                  </tr>
                  <tr className="bg-ink/5 font-bold">
                    <td colSpan={2} className="border border-ink/30 p-2 text-right">
                      Word Reading Level <span className="italic font-normal text-ink/70">(Antas ng Pagbasa)</span>
                    </td>
                    <td className="border border-ink/30 p-2 text-center text-ink">{wordReadingLevel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <RecordActions
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>

      </div>
    </div>
  );
}

