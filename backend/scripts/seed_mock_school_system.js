/**
 * Isolated SalinTinig mock-system seed. It never writes passages, stories,
 * reading materials, or badges. Run with: npm run seed:mock-school
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const SCHOOL_ID = 'MOCK-SALINTINIG-01';
const YEAR = '2026-2027';
const GRADES = ['Grade 4', 'Grade 5', 'Grade 6'];
const SECTIONS = { 'Grade 4': ['Maya', 'Sampaguita'], 'Grade 5': ['Agila', 'Kalapati'], 'Grade 6': ['Narra', 'Rizal'] };
const MALE_FIRST = ['Adrian','Angelo','Bryan','Carlo','Daniel','Ethan','Gabriel','Harold','Isaac','Jericho','Kenneth','Lorenzo','Marco','Nathaniel','Oscar','Patrick','Renz','Samuel','Theo','Vincent','Warren','Xavier','Yves','Zion','Aldrin','Benedict','Cedric','Dominic','Emmanuel','Felix'];
const FEMALE_FIRST = ['Abigail','Angelica','Bianca','Camille','Danica','Erika','Faith','Gabrielle','Hannah','Isabela','Jasmine','Katrina','Lara','Mariel','Nadine','Patricia','Rachelle','Samantha','Therese','Valerie','Yna','Zaira','Alexa','Beatriz','Christine','Denise','Frances','Janine','Kaye','Leanne'];
const MALE_MIDDLE = ['James','Luis','John','Paul','Joseph','Mark','David','Lee','Michael','Andrew','Raymond','Noel','Carlos','Miguel','Ramon','Angelo','Jude','Martin','Elias','Rene'];
const FEMALE_MIDDLE = ['Anne','Marie','Grace','Joy','Mae','Rose','Claire','Nicole','Jane','Louise','Faith','Jean','Kate','Hope','May','Lyn','Belle','Dawn','Pearl','Rae'];
// Realistic, varied surnames. The sequence is intentionally not grouped by
// section or gender, so adjacent records do not share a visible name pattern.
const LAST = ['Aguilar','Bautista','Cabrera','Domingo','Estrada','Fernandez','Gonzales','Herrera','Ignacio','Jimenez','Lacson','Manalo','Natividad','Ocampo','Pangilinan','Quintana','Robles','Salazar','Tolentino','Umali','Valdez','Yap','Zamora','Alcantara','Bernardo','Cordero','Del Rosario','Espiritu','Fajardo'];
const EMAIL_FAMILY_FALLBACKS = ['Santiago','Villaflor','Macapagal','Magbanua','Dalisay','Balingit','Maliksi','Bayani','Katigbak','Sarmiento'];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false });
const language = (n) => n % 4 === 0 ? 'en' : 'fil';
const shuffle = (values) => { const copy = [...values]; for (let i = copy.length - 1; i; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const makeMiscues = (n) => Array.from({ length: n % 5 === 0 ? 5 : n % 3 === 0 ? 3 : 1 }, (_, i) => {
  const expected = ['ang', 'mga', 'bata', 'paaralan', 'araw', 'maganda', 'kaibigan', 'laro'][i];
  const type = ['mispronunciation', 'omission', 'substitution', 'repetition', 'insertion', 'transposition', 'reversal', 'self_correction'][(n + i) % 8];
  return {
    expected_word: expected,
    word: expected,
    spoken_word: type === 'omission' || type === 'repetition' ? '' : ['an', 'ma', 'pata', 'paaralan', 'raw', 'maganda', 'kaibigan', 'oral'][i],
    miscue_type: type,
    word_position: i + 3,
    position: i + 3,
  };
});
const pick = (passages, grade, lang, n = 0) => {
  const exact = passages.filter((p) => p.grade_level === grade && String(p.language).toLowerCase() === lang);
  if (!exact.length) throw new Error(`Missing ${lang} Phil-IRI passage for ${grade}. Seed the official passage bank first.`);
  return exact[n % exact.length];
};
const gradeNumber = (grade) => Number(String(grade).match(/\d+/)?.[0]);
const formatGrade = (grade) => `Grade ${grade}`;

// Each section deliberately has a mix of every meaningful Stage 2 state.
// The cases follow the standardized flow; they are not random single-passage
// labels, so analytics and review screens can exercise their real branches.
const scenarioForSlot = (slot) => {
  if (slot < 12) return 'complete';
  if (slot < 16) return 'in_progress';
  if (slot < 19) return 'terminated';
  if (slot < 21) return 'needs_review';
  return 'gst_not_required';
};
const emailFor = (first, last) => `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@gmail.com';
async function getExistingEmails(client) {
  const res = await client.query('SELECT LOWER(email) as email FROM users');
  return new Set(res.rows.map((r) => r.email));
}

function availableIdentity(existingEmails, first, last) {
  for (let attempt = 0; attempt <= EMAIL_FAMILY_FALLBACKS.length; attempt += 1) {
    const candidateLast = attempt === 0 ? last : `${last}-${EMAIL_FAMILY_FALLBACKS[attempt - 1]}`;
    const email = emailFor(first, candidateLast);
    if (!existingEmails.has(email.toLowerCase())) {
      existingEmails.add(email.toLowerCase());
      return { last: candidateLast, email };
    }
  }
  throw new Error(`Could not create a unique mock email for ${first} ${last}`);
}

const passageQuestionsCache = new Map();
async function getPassageQuestions(client, passageId) {
  if (passageQuestionsCache.has(passageId)) return passageQuestionsCache.get(passageId);
  const questions = (await client.query(`SELECT q.question_id,(SELECT choice_id FROM phil_iri_question_choices c WHERE c.question_id=q.question_id AND c.is_correct=true LIMIT 1) AS good,(SELECT choice_id FROM phil_iri_question_choices c WHERE c.question_id=q.question_id AND c.is_correct=false LIMIT 1) AS bad FROM phil_iri_questions q WHERE q.passage_id=$1 ORDER BY q.created_at LIMIT 7`, [passageId])).rows;
  passageQuestionsCache.set(passageId, questions);
  return questions;
}

async function addOral(client, { studentId, teacherId, passage, n, level, sessionId = null, step = null, period = 'pre_test' }) {
  // This seed represents a finished mock school year: all oral results were
  // already verified by the teacher, so the review queue starts empty.
  const pending = false;
  const accuracy = level === 'Independent' ? 98 : level === 'Instructional' ? 93 : 84;
  const comprehension = level === 'Independent' ? 86 : level === 'Instructional' ? 68 : 42;
  const wpm = level === 'Independent' ? 118 : level === 'Instructional' ? 88 : 58;
  const assessment = await client.query(`INSERT INTO assessments (student_id,passage_id,assigned_by_teacher_id,adaptive_session_id,adaptive_step_number,adaptive_passage_grade_level,assessment_type,assessment_period,status,reading_level_result,remarks) VALUES ($1,$2,$3,$4,$5,$6,'oral',$7,$8,$9,'Mock seeded standardized oral assessment') RETURNING assessment_id`, [studentId, passage.passage_id, teacherId, sessionId, step, passage.grade_level, period, pending ? 'open' : 'completed', level]);
  const attempt = await client.query(`INSERT INTO assessment_attempts (assessment_id,completed_at,total_score,status) VALUES ($1,NOW(),$2,$3) RETURNING attempt_id`, [assessment.rows[0].assessment_id, comprehension, pending ? 'pending_review' : 'completed']);
  const found = makeMiscues(n); const words = Number(passage.word_count) || 100;
  await client.query(`INSERT INTO oral_reading_results (assessment_attempt_id,transcript_text,ai_miscues_json,verified_miscues_json,verification_status,reading_time_seconds,words_read,correct_words,reading_rate_wpm,accuracy_percentage,self_corrections_count,fluency_score,pronunciation_score,comprehension_score) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [attempt.rows[0].attempt_id, 'Mock oral reading transcript for teacher review.', JSON.stringify(found), pending ? null : JSON.stringify(found), pending ? 'pending' : 'verified', Math.round(words / wpm * 60), words, words - found.length, wpm, accuracy, n % 3, accuracy, accuracy - 2, comprehension]);
  const questions = await getPassageQuestions(client, passage.passage_id);
  for (const [i, q] of questions.entries()) { const correct = i < Math.round(questions.length * comprehension / 100); await client.query(`INSERT INTO assessment_answers (assessment_attempt_id,phil_iri_question_id,selected_choice_id,is_correct,score) VALUES ($1,$2,$3,$4,$5)`, [attempt.rows[0].assessment_id, q.question_id, correct ? q.good : (q.bad || q.good), correct, correct ? 1 : 0]); }
  return { assessmentId: assessment.rows[0].assessment_id, accuracy, comprehension, wpm };
}

async function addOpenOral(client, { studentId, teacherId, passage, sessionId, step, period = 'pre_test' }) {
  await client.query(
    `INSERT INTO assessments (student_id,passage_id,assigned_by_teacher_id,adaptive_session_id,adaptive_step_number,adaptive_passage_grade_level,assessment_type,assessment_period,status,remarks)
     VALUES ($1,$2,$3,$4,$5,$6,'oral',$7,'open','Mock seeded next adaptive passage')`,
    [studentId, passage.passage_id, teacherId, sessionId, step, passage.grade_level, period]
  );
}

async function createAdaptiveSession(client, {
  studentId, teacherId, schoolYearId, lang, enrolledGrade, currentGrade,
  status, state, levels = {}, stepCount, terminalReason = null,
}) {
  const result = await client.query(
    `INSERT INTO phil_iri_adaptive_sessions (
       student_id,language,assessment_type,assessment_period,
       baseline_grade_level,baseline_profile_level,current_grade_level,direction,
       status,independent_level,instructional_level,frustration_level,
       search_state,terminal_reason,step_count,assigned_by_teacher_id,school_year_id,completed_at
     ) VALUES ($1,$2,'oral','pre_test',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING session_id`,
    [
      studentId, lang, enrolledGrade, 'GST_REQUIRES_INDIVIDUAL', currentGrade,
      state.includes('DOWN') ? 'stepping_down' : 'stepping_up', status,
      levels.independent || null, levels.instructional || null, levels.frustration || null,
      state, terminalReason, stepCount, teacherId, schoolYearId,
      ['completed', 'terminated', 'needs_review'].includes(status) ? new Date() : null,
    ]
  );
  return result.rows[0].session_id;
}

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL statement_timeout = 0');
    const passages = (await client.query(`SELECT passage_id,grade_level,language,word_count FROM phil_iri_passages WHERE LOWER(COALESCE(status,'published')) <> 'archived' ORDER BY created_at`)).rows;
    for (const lang of ['fil', 'en']) for (let grade = 2; grade <= 7; grade += 1) pick(passages, formatGrade(grade), lang);
    const materials = (await client.query(`SELECT material_id FROM reading_materials WHERE status='active' ORDER BY created_at LIMIT 8`)).rows;
    const hash = bcrypt.hashSync('password', 10);
    const oldUsers = (await client.query(`SELECT user_id FROM users WHERE school_id=$1`, [SCHOOL_ID])).rows.map((r) => r.user_id);
    if (oldUsers.length) {
      const lrns = (await client.query(`SELECT lrn FROM students WHERE user_id=ANY($1::uuid[])`, [oldUsers])).rows.map((r) => r.lrn);
      if (lrns.length) await client.query(`DELETE FROM phil_iri_form4_submissions WHERE student_lrn=ANY($1::varchar[])`, [lrns]);
      await client.query(`DELETE FROM students WHERE user_id=ANY($1::uuid[])`, [oldUsers]);
      await client.query(`DELETE FROM faculty_in_charge WHERE school_id=$1`, [SCHOOL_ID]); await client.query(`DELETE FROM classes WHERE school_id=$1`, [SCHOOL_ID]);
      await client.query(`DELETE FROM teachers WHERE user_id=ANY($1::uuid[])`, [oldUsers]); await client.query(`DELETE FROM users WHERE user_id=ANY($1::uuid[])`, [oldUsers]);
    }
    await client.query(`DELETE FROM school_years WHERE school_id=$1`, [SCHOOL_ID]);
    await client.query(`DELETE FROM schools WHERE school_id=$1`, [SCHOOL_ID]);
    await client.query(
      `INSERT INTO schools (school_id,school_name,division,district,region,official_email,principal_name,status)
       VALUES ($1,'SalinTinig Mock Elementary School','Mock Division','Mock District','NCR','salintinig.mockschool@gmail.com','Maria Santos','active')
       ON CONFLICT (school_id) DO UPDATE SET school_name=EXCLUDED.school_name`,
      [SCHOOL_ID]
    );
    const yearId = (await client.query(`INSERT INTO school_years (school_id,school_year,is_active) VALUES ($1,$2,true) RETURNING school_year_id`, [SCHOOL_ID, YEAR])).rows[0].school_year_id;
    await client.query(`INSERT INTO users (school_id,email,password_hash,role,status,must_change_password) VALUES ($1,'maria.santos@gmail.com',$2,'admin','active',false)`, [SCHOOL_ID, hash]);
    const classes = []; let classNo = 0;
    for (const grade of GRADES) for (const section of SECTIONS[grade]) {
      classNo += 1; const first = ['Ana','Ben','Carla','Diego','Elena','Francis'][classNo - 1]; const last = ['Reyes','Cruz','Garcia','Santos','Ramos','Torres'][classNo - 1];
      const user = await client.query(`INSERT INTO users (school_id,email,password_hash,role,status,must_change_password) VALUES ($1,$2,$3,'teacher','active',false) RETURNING user_id`, [SCHOOL_ID, `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`, hash]);
      const teacher = await client.query(`INSERT INTO teachers (user_id,teacher_no,first_name,last_name,sex) VALUES ($1,$2,$3,$4,$5) RETURNING teacher_id`, [user.rows[0].user_id, `MOCK-T-${String(classNo).padStart(3,'0')}`, first, last, classNo % 2 ? 'Female' : 'Male']);
      const klass = await client.query(`INSERT INTO classes (school_id,school_year_id,advisor_teacher_id,grade_level,section_name) VALUES ($1,$2,$3,$4,$5) RETURNING class_id`, [SCHOOL_ID, yearId, teacher.rows[0].teacher_id, grade, section]);
      classes.push({ grade, section, teacherId: teacher.rows[0].teacher_id, classId: klass.rows[0].class_id });
    }
    for (const grade of GRADES) { const lead = classes.find((c) => c.grade === grade); await client.query(`INSERT INTO faculty_in_charge (school_id,school_year_id,teacher_id,grade_level,status) VALUES ($1,$2,$3,$4,'active')`, [SCHOOL_ID, yearId, lead.teacherId, grade]); }
    let number = 0;
    let maleNameNumber = 0;
    let femaleNameNumber = 0;
    const existingEmails = await getExistingEmails(client);
    for (const classroom of classes) {
      const formData = { maleRows: [], femaleRows: [] }; const sexes = shuffle([...Array(15).fill('Male'), ...Array(15).fill('Female')]);
      for (let slot = 0; slot < 30; slot += 1) {
        number += 1;
        const sex = sexes[slot];
        const first = sex === 'Male'
          ? MALE_FIRST[(maleNameNumber++ * 7) % MALE_FIRST.length]
          : FEMALE_FIRST[(femaleNameNumber++ * 11) % FEMALE_FIRST.length];
        const middle = sex === 'Male'
          ? MALE_MIDDLE[((number - 1) * 13) % MALE_MIDDLE.length]
          : FEMALE_MIDDLE[((number - 1) * 13) % FEMALE_MIDDLE.length];
        let last = LAST[((number - 1) * 17) % LAST.length];
        const lrn = `2026${String(number).padStart(8,'0')}`;
        const identity = availableIdentity(existingEmails, first, last);
        last = identity.last;
        const user = await client.query(`INSERT INTO users (school_id,email,password_hash,role,status,must_change_password) VALUES ($1,$2,$3,'student','active',false) RETURNING user_id`, [SCHOOL_ID, identity.email, hash]);
        const studentId = (await client.query(`INSERT INTO students (user_id,lrn,first_name,middle_name,last_name,sex,nickname) VALUES ($1,$2,$3,$4,$5,$6,$3) RETURNING student_id`, [user.rows[0].user_id, lrn, first, middle, last, sex])).rows[0].student_id;
        await client.query(`INSERT INTO student_grade_history (student_id,school_year_id,grade_level,class_id,promotion_status) VALUES ($1,$2,$3,$4,'active')`, [studentId, yearId, classroom.grade, classroom.classId]);
        await client.query(`INSERT INTO student_progress (student_id,current_streak,longest_streak,last_activity_date,earned_badges) VALUES ($1,$2,$3,CURRENT_DATE,'[]'::jsonb)`, [studentId, number % 7 + 1, number % 14 + 4]);
        const lang = language(number);
        const enrolled = gradeNumber(classroom.grade);
        const start = Math.max(2, enrolled - 2); // GST score 8–13 starting point
        const scenario = scenarioForSlot(slot);
        let oral = null;

        if (scenario === 'complete') {
          const levels = { independent: formatGrade(start), instructional: formatGrade(start + 1), frustration: formatGrade(start + 2) };
          const sessionId = await createAdaptiveSession(client, { studentId, teacherId: classroom.teacherId, schoolYearId: yearId, lang, enrolledGrade: classroom.grade, currentGrade: levels.frustration, status: 'completed', state: 'COMPLETE', levels, stepCount: 3 });
          await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, levels.independent, lang, number), n: number, level: 'Independent', sessionId, step: 1 });
          await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, levels.instructional, lang, number + 1), n: number + 1, level: 'Instructional', sessionId, step: 2 });
          oral = await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, levels.frustration, lang, number + 2), n: number + 2, level: 'Frustration', sessionId, step: 3 });
          await client.query(`INSERT INTO student_reading_profiles (student_id,language,assessment_type,assessment_period,profile_level,accuracy_rate,comprehension_rate,speed_wpm,last_assessment_id) VALUES ($1,$2,'oral','pre_test','Instructional',$3,$4,$5,$6)`, [studentId, lang, oral.accuracy, oral.comprehension, oral.wpm, oral.assessmentId]);
        } else if (scenario === 'in_progress') {
          const independent = formatGrade(start);
          const sessionId = await createAdaptiveSession(client, { studentId, teacherId: classroom.teacherId, schoolYearId: yearId, lang, enrolledGrade: classroom.grade, currentGrade: formatGrade(start + 1), status: 'in_progress', state: 'SEARCHING_INSTRUCTIONAL_UP', levels: { independent }, stepCount: 1 });
          await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, independent, lang, number), n: number, level: 'Independent', sessionId, step: 1 });
          await addOpenOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, formatGrade(start + 1), lang, number + 1), sessionId, step: 2 });
        } else if (scenario === 'terminated') {
          const sessionId = await createAdaptiveSession(client, { studentId, teacherId: classroom.teacherId, schoolYearId: yearId, lang, enrolledGrade: classroom.grade, currentGrade: 'Grade 7', status: 'terminated', state: 'UPPER_BOUNDARY_REACHED', levels: { independent: 'Grade 7' }, stepCount: 7 - start + 1, terminalReason: 'UPPER_BOUNDARY_REACHED' });
          for (let level = start; level <= 7; level += 1) oral = await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, formatGrade(level), lang, number + level), n: number + level, level: 'Independent', sessionId, step: level - start + 1 });
        } else if (scenario === 'needs_review') {
          const sessionId = await createAdaptiveSession(client, { studentId, teacherId: classroom.teacherId, schoolYearId: yearId, lang, enrolledGrade: classroom.grade, currentGrade: formatGrade(start + 1), status: 'needs_review', state: 'NEEDS_REVIEW', levels: { instructional: formatGrade(start) }, stepCount: 2, terminalReason: 'NON_MONOTONIC_READING_LEVELS' });
          await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, formatGrade(start), lang, number), n: number, level: 'Instructional', sessionId, step: 1 });
          oral = await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, formatGrade(start + 1), lang, number + 1), n: number + 1, level: 'Independent', sessionId, step: 2 });
        }
        if (number % 3 === 0 || number % 5 === 0) {
          const type = number % 3 === 0 ? 'listening' : 'silent'; const score = type === 'listening' ? 78 : 72; const assessment = await client.query(`INSERT INTO assessments (student_id,passage_id,assigned_by_teacher_id,assessment_type,assessment_period,status,reading_level_result) VALUES ($1,$2,$3,$4,'pre_test','completed','Instructional') RETURNING assessment_id`, [studentId, pick(passages,classroom.grade,lang,number+2).passage_id, classroom.teacherId, type]); const attempt = await client.query(`INSERT INTO assessment_attempts (assessment_id,completed_at,total_score,status) VALUES ($1,NOW(),$2,'completed') RETURNING attempt_id`, [assessment.rows[0].assessment_id,score]); await client.query(type === 'listening' ? `INSERT INTO listening_reading_results (assessment_attempt_id,audio_duration_seconds,comprehension_score) VALUES ($1,95,$2)` : `INSERT INTO silent_reading_results (assessment_attempt_id,reading_time_seconds,comprehension_score) VALUES ($1,110,$2)`, [attempt.rows[0].attempt_id,score]); await client.query(`INSERT INTO student_reading_profiles (student_id,language,assessment_type,assessment_period,profile_level,comprehension_rate,speed_wpm,last_assessment_id) VALUES ($1,$2,$3,'pre_test','Instructional',$4,$5,$6)`, [studentId,lang,type,score,type === 'silent' ? 95 : null,assessment.rows[0].assessment_id]);
        }
        if (materials.length) { const material = materials[number % materials.length].material_id; await client.query(`INSERT INTO student_story_progress (student_id,material_id,status,reading_progress,last_page_read,quiz_score,total_questions,completed_at) VALUES ($1,$2,'completed',1,4,$3,5,NOW())`, [studentId,material,3+number%3]); await client.query(`INSERT INTO story_attempts (student_id,material_id,score,total_questions,selected_answers,time_spent_seconds) VALUES ($1,$2,$3,5,'[]'::jsonb,$4)`, [studentId,material,3+number%3,100+number]); }
        await client.query(`INSERT INTO pronunciation_attempts (student_id,session_id,language,difficulty,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,$3,'medium',$4,$5,15,'[]'::jsonb)`, [studentId,`mock-pron-${number}`,lang,number%3,85+number%12]); await client.query(`INSERT INTO vocabulary_attempts (student_id,session_id,difficulty,total_pairs,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,'medium',5,$3,$4,12,'[]'::jsonb)`, [studentId,`mock-vocab-${number}`,number%2,86+number%10]); await client.query(`INSERT INTO sentence_attempts (student_id,session_id,language,difficulty,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,$3,'medium',$4,$5,10,'[]'::jsonb)`, [studentId,`mock-sentence-${number}`,lang,number%2,88+number%10]);
        // GST data drives the same individual/no-individual split represented
        // above. 14+ is discontinued; the remaining learners start at G-2.
        const total = scenario === 'gst_not_required' ? 16 + (number % 5) : 8 + (number % 6);
        const literalNum = Math.min(7, Math.ceil(total * 0.35));
        const inferentialNum = Math.min(7, Math.ceil(total * 0.35));
        const criticalNum = Math.min(6, total - literalNum - inferentialNum);
        const row = { lrn,name:`${last}, ${first}`,gender:sex === 'Female' ? 'F' : 'M',testTaken:'✓',literalNum,inferentialNum,criticalNum,totalNum:total,below14:total<14?'/':'',above14:total>=14?'/':'',startingPoint:total>=14?'Exempted (Discontinue)':formatGrade(start)}; formData[sex === 'Female' ? 'femaleRows':'maleRows'].push(row);
        await client.query(`INSERT INTO phil_iri_form4_submissions (student_lrn,checklist_data,lic_data) VALUES ($1,$2::jsonb,$3::jsonb)`, [lrn,JSON.stringify({pre_fil:[{behavior:'Reads with confidence',result:'✓'}]}),JSON.stringify({pre_fil:{IV:{l:'5/7',i:'4/7',c:'3/6'}}})]);
      }
      const below = [...formData.maleRows,...formData.femaleRows].filter((row) => row.below14).length;
      for (const [testLanguage,formCode] of [['Tagalog','PHIL-IRI FORM 1A'],['English','PHIL-IRI FORM 1B']]) await client.query(`INSERT INTO gst_form_submissions (school_id,school_year_id,class_id,teacher_id,section_name,grade_level,test_language,form_code,form_data,above_14_count,below_14_count,total_assessed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,30)`, [SCHOOL_ID,yearId,classroom.classId,classroom.teacherId,classroom.section,classroom.grade,testLanguage,formCode,JSON.stringify(formData),30-below,below]);
    }
    await client.query('COMMIT'); console.log('Mock school seeded: 1 school, 6 classes, 6 teachers, 180 students (30 per section). Password: password'); console.log('Admin: maria.santos@gmail.com');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
}
seed().catch((error) => { console.error('Mock-school seed failed:', error.message); process.exitCode = 1; });
