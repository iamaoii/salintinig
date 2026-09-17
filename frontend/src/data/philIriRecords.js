import { students } from './students.js';

export const classInfo = {
  grade: 4,
  section: 'Fyang',
  teacher: 'Antoinette Jadaone',
  level: 4,
  date: '26 Mayo 2026',
  school: 'Mandaluyong Elementary School',
};

export const schoolInfo = {
  school: 'Mandaluyong Elementary School',
  division: 'II',
  district: 'IV',
  region: 'National Capital Region (NCR)',
};

// Form 1A / 1B: per-student class test record.
export const form1Rows = students.map((student, i) => {
  const literal = 4;
  const inferential = 4;
  const critical = 5;
  const total = literal + inferential + critical;
  return {
    lrn: student.lrn,
    name: student.name,
    testTaken: '/',
    literal: `${literal}/7`,
    inferential: `${inferential}/7`,
    critical: `${critical}/6`,
    total: `${total}/20`,
    below14: total < 14 ? '/' : '',
    above14: total >= 14 ? '/' : '',
  };
});

export const form1Totals = {
  totalStudents: form1Rows.length,
  below14: form1Rows.filter((r) => r.below14).length,
  above14: form1Rows.filter((r) => r.above14).length,
};

// Form 2: school-wide reading profile aggregate.
export const form2Rows = [
  { grade: 'IV', section: '', enrolment: 207, above14: 88, below14: 119, isGradeTotal: true },
  { grade: '', section: 'Fyang', enrolment: 52, above14: 20, below14: 35 },
  { grade: '', section: 'Kalapati', enrolment: 53, above14: 21, below14: 32 },
  { grade: 'V', section: '', enrolment: 203, above14: 84, below14: 119, isGradeTotal: true },
  { grade: '', section: 'Aguinaldo', enrolment: 51, above14: 24, below14: 27 },
  { grade: '', section: 'Bonifacio', enrolment: 49, above14: 20, below14: 29 },
  { grade: 'VI', section: '', enrolment: 119, above14: 80, below14: 119, isGradeTotal: true },
  { grade: '', section: 'Apo', enrolment: 47, above14: 19, below14: 28 },
  { grade: '', section: 'Cordillera', enrolment: 49, above14: 18, below14: 31 },
];

export const form2Total = { enrolment: 1418, above14: 593, below14: 825 };

// Form 3A / 3B: individual oral/silent reading assessment record, keyed by LRN.
const sharedIndividualRecord = {
  duration: '1.50 minuto',
  rate: '78 salita/minuto',
  marka: 4,
  comprehensionLevel: 'Frustration',
  answers: ['a', 'b', 'b', 'd', 'c', 'a', 'b'],
  selection: 'Isang Pangako',
  level: 4,
  set: 'A',
  miscues: [
    { type: 'Mispronunciation', typeFilipino: 'Maling Bigkas', count: 1 },
    { type: 'Omission', typeFilipino: 'Pagkakaltas', count: 1 },
    { type: 'Substitution', typeFilipino: 'Pagpapalit', count: 2 },
    { type: 'Insertion', typeFilipino: 'Pagsisingit', count: 1 },
    { type: 'Repetition', typeFilipino: 'Pag-uulit', count: 3 },
    { type: 'Transposition', typeFilipino: 'Pagpapalit ng lugar', count: 1 },
    { type: 'Reversal', typeFilipino: 'Paglilipat', count: 0 },
  ],
  totalMiscues: 9,
  totalWords: 144,
  wordReadingScore: '93.75%',
  readingLevel: 'Instructional',
};

export const individualRecordsByLrn = Object.fromEntries(
  students.map((student) => [student.lrn, sharedIndividualRecord]),
);

// Form 4: Individual Summary Record levels (K, I, II, ... VII).
export const form4Levels = ['K', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const form4ObservationChecklist = [
  { behavior: 'Does word-by-word reading', behaviorFilipino: 'Nagbabasa nang pa-isang salita', result: 'X bihira' },
  {
    behavior: 'Lacks expression; reads in a monotonous tone',
    behaviorFilipino: 'Walang damdamin; walang pagbabago ang tono',
    result: 'X',
  },
  { behavior: 'Voice is hardly audible', behaviorFilipino: 'Hindi madaling marinig ang boses', result: 'X' },
  { behavior: 'Disregards punctuation', behaviorFilipino: 'Hindi pinapansin ang mga bantas', result: '/' },
  {
    behavior: "Points to each word with his/her finger",
    behaviorFilipino: 'Itinuturo ang bawat salita',
    result: 'X bihira',
  },
];

export const form4RecordByLrn = Object.fromEntries(
  students.map((student) => [
    student.lrn,
    {
      startedLevel: 'IV',
      dateTaken: '20 June',
      wordReading: { level: 'IV', ind: false, ins: false, frus: true },
      comprehension: { level: 'IV', ind: false, ins: false, frus: true },
      observationChecklist: form4ObservationChecklist,
      passageResult: { level: 'IV', score: '4/7', percent: '57', readingLevel: 'Frustration' },
    },
  ]),
);
