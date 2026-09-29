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
// Adaptive results intentionally vary by section. This gives the teacher
// dashboard realistic completed and in-progress cases instead of the same
// 15/30 result in every mock class.
const ADAPTIVE_PLANS = [
  { completed: 12, steppingDown: 2, steppingUp: 1 }, // Grade 4 - Maya
  { completed: 9,  steppingDown: 3, steppingUp: 2 }, // Grade 4 - Sampaguita
  { completed: 14, steppingDown: 1, steppingUp: 0 }, // Grade 5 - Agila
  { completed: 11, steppingDown: 2, steppingUp: 2 }, // Grade 5 - Kalapati
  { completed: 16, steppingDown: 1, steppingUp: 1 }, // Grade 6 - Narra
  { completed: 8,  steppingDown: 4, steppingUp: 2 }, // Grade 6 - Rizal
];
const MALE_FIRST = ['Adrian','Angelo','Bryan','Carlo','Daniel','Ethan','Gabriel','Harold','Isaac','Jericho','Kenneth','Lorenzo','Marco','Nathaniel','Oscar','Patrick','Renz','Samuel','Theo','Vincent','Warren','Xavier','Yves','Zion','Aldrin','Benedict','Cedric','Dominic','Emmanuel','Felix'];
const FEMALE_FIRST = ['Abigail','Angelica','Bianca','Camille','Danica','Erika','Faith','Gabrielle','Hannah','Isabela','Jasmine','Katrina','Lara','Mariel','Nadine','Patricia','Rachelle','Samantha','Therese','Valerie','Yna','Zaira','Alexa','Beatriz','Christine','Denise','Frances','Janine','Kaye','Leanne'];
const MALE_MIDDLE = ['James','Luis','John','Paul','Joseph','Mark','David','Lee','Michael','Andrew','Raymond','Noel','Carlos','Miguel','Ramon','Angelo','Jude','Martin','Elias','Rene'];
const FEMALE_MIDDLE = ['Anne','Marie','Grace','Joy','Mae','Rose','Claire','Nicole','Jane','Louise','Faith','Jean','Kate','Hope','May','Lyn','Belle','Dawn','Pearl','Rae'];
// Realistic, varied surnames. The sequence is intentionally not grouped by
// section or gender, so adjacent records do not share a visible name pattern.
const LAST = ['Aguilar','Bautista','Cabrera','Domingo','Estrada','Fernandez','Gonzales','Herrera','Ignacio','Jimenez','Lacson','Manalo','Natividad','Ocampo','Pangilinan','Quintana','Robles','Salazar','Tolentino','Umali','Valdez','Yap','Zamora','Alcantara','Bernardo','Cordero','Del Rosario','Espiritu','Fajardo'];
const EMAIL_FAMILY_FALLBACKS = ['Santiago','Villaflor','Macapagal','Magbanua','Dalisay','Balingit','Maliksi','Bayani','Katigbak','Sarmiento'];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false });
const profile = (n) => n % 5 === 0 ? 'Frustration' : n % 3 === 0 ? 'Instructional' : 'Independent';
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
const pick = (passages, grade, lang, n) => { const exact = passages.filter((p) => p.grade_level === grade && String(p.language).toLowerCase() === lang); const fallback = passages.filter((p) => String(p.language).toLowerCase() === lang); const list = exact.length ? exact : (fallback.length ? fallback : passages); return list[n % list.length]; };
const emailFor = (first, last) => `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@gmail.com';
async function availableIdentity(client, first, last) {
  for (let attempt = 0; attempt <= EMAIL_FAMILY_FALLBACKS.length; attempt += 1) {
    const candidateLast = attempt === 0 ? last : `${last}-${EMAIL_FAMILY_FALLBACKS[attempt - 1]}`;
    const email = emailFor(first, candidateLast);
    const existing = await client.query('SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email]);
    if (!existing.rows.length) return { last: candidateLast, email };
  }
  throw new Error(`Could not create a unique mock email for ${first} ${last}`);
}

async function addOral(client, { studentId, teacherId, passage, n, level, sessionId = null, step = null }) {
  // This seed represents a finished mock school year: all oral results were
  // already verified by the teacher, so the review queue starts empty.
  const pending = false;
  const accuracy = level === 'Independent' ? 98 : level === 'Instructional' ? 93 : 84;
  const comprehension = level === 'Independent' ? 86 : level === 'Instructional' ? 68 : 42;
  const wpm = level === 'Independent' ? 118 : level === 'Instructional' ? 88 : 58;
  const assessment = await client.query(`INSERT INTO assessments (student_id,passage_id,assigned_by_teacher_id,adaptive_session_id,adaptive_step_number,assessment_type,assessment_period,status,reading_level_result,remarks) VALUES ($1,$2,$3,$4,$5,'oral','pre_test',$6,$7,'Mock seeded oral assessment') RETURNING assessment_id`, [studentId, passage.passage_id, teacherId, sessionId, step, pending ? 'open' : 'completed', level]);
  const attempt = await client.query(`INSERT INTO assessment_attempts (assessment_id,completed_at,total_score,status) VALUES ($1,NOW(),$2,$3) RETURNING attempt_id`, [assessment.rows[0].assessment_id, comprehension, pending ? 'pending_review' : 'completed']);
  const found = makeMiscues(n); const words = Number(passage.word_count) || 100;
  await client.query(`INSERT INTO oral_reading_results (assessment_attempt_id,transcript_text,ai_miscues_json,verified_miscues_json,verification_status,reading_time_seconds,words_read,correct_words,reading_rate_wpm,accuracy_percentage,self_corrections_count,fluency_score,pronunciation_score,comprehension_score) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [attempt.rows[0].attempt_id, 'Mock oral reading transcript for teacher review.', JSON.stringify(found), pending ? null : JSON.stringify(found), pending ? 'pending' : 'verified', Math.round(words / wpm * 60), words, words - found.length, wpm, accuracy, n % 3, accuracy, accuracy - 2, comprehension]);
  const questions = await client.query(`SELECT q.question_id,(SELECT choice_id FROM phil_iri_question_choices c WHERE c.question_id=q.question_id AND c.is_correct=true LIMIT 1) AS good,(SELECT choice_id FROM phil_iri_question_choices c WHERE c.question_id=q.question_id AND c.is_correct=false LIMIT 1) AS bad FROM phil_iri_questions q WHERE q.passage_id=$1 ORDER BY q.created_at LIMIT 7`, [passage.passage_id]);
  for (const [i, q] of questions.rows.entries()) { const correct = i < Math.round(questions.rows.length * comprehension / 100); await client.query(`INSERT INTO assessment_answers (assessment_attempt_id,phil_iri_question_id,selected_choice_id,is_correct,score) VALUES ($1,$2,$3,$4,$5)`, [attempt.rows[0].attempt_id, q.question_id, correct ? q.good : (q.bad || q.good), correct, correct ? 1 : 0]); }
  return { assessmentId: assessment.rows[0].assessment_id, accuracy, comprehension, wpm };
}

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passages = (await client.query(`SELECT passage_id,grade_level,language,word_count FROM phil_iri_passages WHERE grade_level=ANY($1) AND LOWER(COALESCE(status,'published')) <> 'archived' ORDER BY created_at`, [GRADES])).rows;
    if (!passages.length) throw new Error('No Grade 4–6 Phil-IRI passages exist. Seed passages first.');
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
    await client.query(`DELETE FROM schools WHERE school_id=$1`, [SCHOOL_ID]);
    await client.query(`INSERT INTO schools (school_id,school_name,division,district,region,official_email,principal_name,status) VALUES ($1,'SalinTinig Mock Elementary School','Mock Division','Mock District','NCR','salintinig.mockschool@gmail.com','Maria Santos','active')`, [SCHOOL_ID]);
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
    for (const classroom of classes) {
      const adaptivePlan = ADAPTIVE_PLANS[classes.indexOf(classroom)];
      const adaptiveTotal = adaptivePlan.completed + adaptivePlan.steppingDown + adaptivePlan.steppingUp;
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
        const identity = await availableIdentity(client, first, last);
        last = identity.last;
        const user = await client.query(`INSERT INTO users (school_id,email,password_hash,role,status,must_change_password) VALUES ($1,$2,$3,'student','active',false) RETURNING user_id`, [SCHOOL_ID, identity.email, hash]);
        const studentId = (await client.query(`INSERT INTO students (user_id,lrn,first_name,middle_name,last_name,sex,nickname) VALUES ($1,$2,$3,$4,$5,$6,$3) RETURNING student_id`, [user.rows[0].user_id, lrn, first, middle, last, sex])).rows[0].student_id;
        await client.query(`INSERT INTO student_grade_history (student_id,school_year_id,grade_level,class_id,promotion_status) VALUES ($1,$2,$3,$4,'active')`, [studentId, yearId, classroom.grade, classroom.classId]);
        await client.query(`INSERT INTO student_progress (student_id,current_streak,longest_streak,last_activity_date,earned_badges) VALUES ($1,$2,$3,CURRENT_DATE,'[]'::jsonb)`, [studentId, number % 7 + 1, number % 14 + 4]);
        const lang = language(number); const base = profile(number); let oral = await addOral(client, { studentId, teacherId: classroom.teacherId, passage: pick(passages, classroom.grade, lang, number), n:number, level:base }); let finalLevel = base;
        if (slot < adaptiveTotal) {
          const isCompleted = slot < adaptivePlan.completed;
          const direction = slot < adaptivePlan.completed + adaptivePlan.steppingDown ? 'stepping_down' : 'stepping_up';
          const session = await client.query(
            `INSERT INTO phil_iri_adaptive_sessions (student_id,language,assessment_type,baseline_grade_level,baseline_profile_level,current_grade_level,direction,status,final_instructional_level,final_profile_level,step_count,assigned_by_teacher_id,school_year_id,completed_at)
             VALUES ($1,$2,'oral',$3,$4,$3,$5,$6,$7,$8,1,$9,$10,$11)
             RETURNING session_id`,
            [studentId, lang, classroom.grade, base, direction, isCompleted ? 'completed' : 'in_progress', isCompleted ? classroom.grade : null, isCompleted ? 'Instructional' : null, classroom.teacherId, yearId, isCompleted ? new Date() : null]
          );
          const adaptiveLevel = isCompleted ? 'Instructional' : base;
          oral = await addOral(client, { studentId, teacherId:classroom.teacherId, passage:pick(passages,classroom.grade,lang,number+1), n:number+50, level:adaptiveLevel, sessionId:session.rows[0].session_id, step:1 });
          finalLevel = adaptiveLevel;
        }
        await client.query(`INSERT INTO student_reading_profiles (student_id,language,assessment_type,assessment_period,profile_level,accuracy_rate,comprehension_rate,speed_wpm,last_assessment_id) VALUES ($1,$2,'oral','pre_test',$3,$4,$5,$6,$7)`, [studentId, lang, finalLevel, oral.accuracy, oral.comprehension, oral.wpm, oral.assessmentId]);
        if (number % 3 === 0 || number % 5 === 0) {
          const type = number % 3 === 0 ? 'listening' : 'silent'; const score = type === 'listening' ? 78 : 72; const assessment = await client.query(`INSERT INTO assessments (student_id,passage_id,assigned_by_teacher_id,assessment_type,assessment_period,status,reading_level_result) VALUES ($1,$2,$3,$4,'pre_test','completed','Instructional') RETURNING assessment_id`, [studentId, pick(passages,classroom.grade,lang,number+2).passage_id, classroom.teacherId, type]); const attempt = await client.query(`INSERT INTO assessment_attempts (assessment_id,completed_at,total_score,status) VALUES ($1,NOW(),$2,'completed') RETURNING attempt_id`, [assessment.rows[0].assessment_id,score]); await client.query(type === 'listening' ? `INSERT INTO listening_reading_results (assessment_attempt_id,audio_duration_seconds,comprehension_score) VALUES ($1,95,$2)` : `INSERT INTO silent_reading_results (assessment_attempt_id,reading_time_seconds,comprehension_score) VALUES ($1,110,$2)`, [attempt.rows[0].attempt_id,score]); await client.query(`INSERT INTO student_reading_profiles (student_id,language,assessment_type,assessment_period,profile_level,comprehension_rate,speed_wpm,last_assessment_id) VALUES ($1,$2,$3,'pre_test','Instructional',$4,$5,$6)`, [studentId,lang,type,score,type === 'silent' ? 95 : null,assessment.rows[0].assessment_id]);
        }
        if (materials.length) { const material = materials[number % materials.length].material_id; await client.query(`INSERT INTO student_story_progress (student_id,material_id,status,reading_progress,last_page_read,quiz_score,total_questions,completed_at) VALUES ($1,$2,'completed',1,4,$3,5,NOW())`, [studentId,material,3+number%3]); await client.query(`INSERT INTO story_attempts (student_id,material_id,score,total_questions,selected_answers,time_spent_seconds) VALUES ($1,$2,$3,5,'[]'::jsonb,$4)`, [studentId,material,3+number%3,100+number]); }
        await client.query(`INSERT INTO pronunciation_attempts (student_id,session_id,language,difficulty,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,$3,'medium',$4,$5,15,'[]'::jsonb)`, [studentId,`mock-pron-${number}`,lang,number%3,85+number%12]); await client.query(`INSERT INTO vocabulary_attempts (student_id,session_id,difficulty,total_pairs,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,'medium',5,$3,$4,12,'[]'::jsonb)`, [studentId,`mock-vocab-${number}`,number%2,86+number%10]); await client.query(`INSERT INTO sentence_attempts (student_id,session_id,language,difficulty,mistakes_count,score,xp_earned,items_detail) VALUES ($1,$2,$3,'medium',$4,$5,10,'[]'::jsonb)`, [studentId,`mock-sentence-${number}`,lang,number%2,88+number%10]);
        const literalNum = Math.min(7, 2 + number % 6); const inferentialNum = Math.min(7, 2 + number % 6); const criticalNum = Math.min(6, 1 + number % 5); const total = literalNum + inferentialNum + criticalNum;
        const row = { lrn,name:`${last}, ${first}`,gender:sex === 'Female' ? 'F' : 'M',testTaken:'✓',literalNum,inferentialNum,criticalNum,totalNum:total,below14:total<14?'/':'',above14:total>=14?'/':'',startingPoint:total>=14?'Exempted (Discontinue)':`Grade ${Math.max(1,Number(classroom.grade.slice(-1))-2)} Passage`}; formData[sex === 'Female' ? 'femaleRows':'maleRows'].push(row);
        await client.query(`INSERT INTO phil_iri_form4_submissions (student_lrn,checklist_data,lic_data) VALUES ($1,$2::jsonb,$3::jsonb)`, [lrn,JSON.stringify({pre_fil:[{behavior:'Reads with confidence',result:'✓'}]}),JSON.stringify({pre_fil:{IV:{l:'5/7',i:'4/7',c:'3/6'}}})]);
      }
      const below = [...formData.maleRows,...formData.femaleRows].filter((row) => row.below14).length;
      for (const [testLanguage,formCode] of [['Tagalog','PHIL-IRI FORM 1A'],['English','PHIL-IRI FORM 1B']]) await client.query(`INSERT INTO gst_form_submissions (school_id,school_year_id,class_id,teacher_id,section_name,grade_level,test_language,form_code,form_data,above_14_count,below_14_count,total_assessed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,30)`, [SCHOOL_ID,yearId,classroom.classId,classroom.teacherId,classroom.section,classroom.grade,testLanguage,formCode,JSON.stringify(formData),30-below,below]);
    }
    await client.query('COMMIT'); console.log('Mock school seeded: 1 school, 6 classes, 6 teachers, 180 students (30 per section). Password: password'); console.log('Admin: maria.santos@gmail.com');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
}
seed().catch((error) => { console.error('Mock-school seed failed:', error.message); process.exitCode = 1; });
