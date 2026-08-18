require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const db = require('./config/db.js')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files (backend public directory including logos)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/src/assets')));

// Routes
app.use('/api/auth', require('./routes/auth.routes.js'))
app.use('/api/students', require('./routes/student.routes.js'))
app.use('/api/admin/students', require('./routes/student.routes.js'))
app.use('/api/admin', require('./routes/admin.routes.js'))
app.use('/api/teacher', require('./routes/teacher.routes.js'))
app.use('/api/notifications', require('./routes/notification.routes.js'))

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SalinTinig API is running 🎙️' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err)
  res.status(500).json({ success: false, error: 'Internal Server Error' })
})

async function initDatabase() {
  if (!process.env.DATABASE_URL) return;
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(sql);
      await db.query("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS sex VARCHAR(20) DEFAULT 'Male';");
      await db.query("ALTER TABLE faculty_in_charge ADD COLUMN IF NOT EXISTS school_id VARCHAR(50) REFERENCES schools(school_id);");
      await db.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id VARCHAR(50) REFERENCES schools(school_id);");
      await db.query("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS teacher_no VARCHAR(100);");
      await db.query("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);");
      await db.query("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);");
      await db.query("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);");
      await db.query("ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS sex VARCHAR(20) DEFAULT 'Male';");
      await db.query("ALTER TABLE phil_iri_passages ADD COLUMN IF NOT EXISTS prev_status VARCHAR(50) DEFAULT 'published';");
      await db.query("ALTER TABLE student_grade_history ADD COLUMN IF NOT EXISTS school_year_id UUID REFERENCES school_years(school_year_id) ON DELETE CASCADE;");
      await db.query("ALTER TABLE student_grade_history ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50);");
      try {
        await db.query("ALTER TABLE student_grade_history ADD CONSTRAINT unique_student_sy UNIQUE (student_id, school_year_id);");
      } catch (cErr) {
        // Ignore if constraint unique_student_sy already exists
      }

      // Auto-hash any existing plain-text passwords in database with bcrypt salt rounds 10
      try {
        const bcrypt = require('bcryptjs');
        const { rows: plainUsers } = await db.query(
          "SELECT user_id, password_hash FROM users WHERE password_hash NOT LIKE '$2a$%' AND password_hash NOT LIKE '$2b$%' AND password_hash NOT LIKE '$2y$%';"
        );
        if (plainUsers && plainUsers.length > 0) {
          for (const u of plainUsers) {
            if (u.password_hash) {
              const salt = bcrypt.genSaltSync(10);
              const hashed = bcrypt.hashSync(u.password_hash, salt);
              await db.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [hashed, u.user_id]);
            }
          }
          console.log(`🔒 Encrypted & hashed ${plainUsers.length} plain-text passwords in database using bcrypt.`);
        }
      } catch (hashErr) {
        console.warn('Password hash migration notice:', hashErr.message);
      }

      console.log('✅ Database schema verified & ready.');
      await seedPhilIriData();
    }
  } catch (err) {
    console.warn('DB Init Notice:', err.message);
  }
}

async function seedPhilIriData() {
  if (!process.env.DATABASE_URL) return;
  try {
    const { rows: existing } = await db.query('SELECT COUNT(*)::int AS count FROM phil_iri_passages');
    if (existing && Number(existing[0].count) === 0) {
      console.log('🌱 Seeding initial Phil-IRI reading passages into database...');
      const seedPassages = [
        {
          title: 'Ang Masikhay na Magsasaka',
          grade: 'Grade 4',
          set: 'Set A',
          language: 'fil',
          status: 'published',
          text: 'Si Mang Juan ay isang masikhay na magsasaka sa lalawigan ng Bulacan. Araw-araw, bago pa man sumikat ang araw, siya ay nasa bukid na upang mag-araro at magtanim ng palay. Dahil sa kanyang sipag at tiyaga, palaging masagana ang kanyang ani. Ipinagmamalaki niya ang kanyang propesyon dahil ito ang nagpapakain sa kanyang pamilya at sa maraming mamamayan.',
          questions: [
            {
              question: 'Sino ang pangunahing tauhan sa kuwento?',
              options: ['Si Mang Juan', 'Si Mang Pedro', 'Si Mang Jose', 'Si Mang Kulas'],
              correct: 0,
            },
            {
              question: 'Saan matatagpuan ang bukid ni Mang Juan?',
              options: ['Bulacan', 'Pampanga', 'Laguna', 'Nueva Ecija'],
              correct: 0,
            },
            {
              question: 'Bakit masagana ang ani ni Mang Juan?',
              options: ['Dahil sa sipag at tiyaga', 'Dahil sa ulan', 'Dahil sa swerte', 'Dahil sa tulong ng kapitbahay'],
              correct: 0,
            },
          ],
        },
        {
          title: 'The Diligent Farmer',
          grade: 'Grade 4',
          set: 'Set A',
          language: 'en',
          status: 'published',
          text: 'Mang Juan is a hardworking farmer from Bulacan. Every day, before the sun rises, he is already in the field plowing and planting rice. Because of his diligence and perseverance, his harvest is always bountiful. He takes pride in his profession because it feeds his family and many citizens.',
          questions: [
            {
              question: 'Who is the main character in the story?',
              options: ['Mang Juan', 'Mang Pedro', 'Mang Jose', 'Mang Kulas'],
              correct: 0,
            },
            {
              question: 'Where is Mang Juan from?',
              options: ['Bulacan', 'Pampanga', 'Laguna', 'Cavite'],
              correct: 0,
            },
          ],
        },
        {
          title: 'Ang Puso ng Kabundukan',
          grade: 'Grade 5',
          set: 'Set B',
          language: 'fil',
          status: 'published',
          text: 'Sa gitna ng serye ng matatayog na kabundukan ng Cordillera, may isang malinis na batis na siyang pinagmumulan ng tubig para sa buong nayon. Ang mga katutubong mamamayan doon ay maingat na inaalagaan ang kagubatan sapagkat naniniwala silang ang kalikasan ang buhay ng kanilang komunidad.',
          questions: [
            {
              question: 'Saan matatagpuan ang malinis na batis?',
              options: ['Sa Cordillera', 'Sa Sierra Madre', 'Sa Banahaw', 'Sa Apo'],
              correct: 0,
            },
          ],
        },
        {
          title: 'The Light of Tomorrow',
          grade: 'Grade 6',
          set: 'Set D',
          language: 'en',
          status: 'published',
          text: 'Education has always been hailed as the great equalizer of opportunities. In a remote village in the Philippines, young learners travel miles on foot just to reach the nearest elementary school. Their unwavering spirit demonstrates that hope burns brightest when fueled by passion for learning.',
          questions: [
            {
              question: 'What is described as the great equalizer?',
              options: ['Education', 'Hard work', 'Wealth', 'Friendship'],
              correct: 0,
            },
          ],
        },
      ];

      for (const p of seedPassages) {
        const wordCount = p.text.trim().split(/\s+/).filter(Boolean).length;
        const { rows } = await db.query(`
          INSERT INTO phil_iri_passages (title, grade_level, passage_set, language, status, content_text, word_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING passage_id
        `, [p.title, p.grade, p.set, p.language, p.status, p.text, wordCount]);

        const matId = rows[0].passage_id;
        for (const q of p.questions) {
          const qRes = await db.query(`
            INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
            VALUES ($1, $2, 'Multiple Choice')
            RETURNING question_id
          `, [matId, q.question]);
          const qId = qRes.rows[0].question_id;

          for (let i = 0; i < q.options.length; i++) {
            await db.query(`
              INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
              VALUES ($1, $2, $3)
            `, [qId, q.options[i], i === q.correct]);
          }
        }
      }
      console.log('✅ Phil-IRI reading passages seeded successfully.');
    }

    // Seed student reading profiles if empty
    const { rows: profCount } = await db.query('SELECT COUNT(*)::int AS count FROM reading_profiles');
    if (profCount && Number(profCount[0].count) === 0) {
      console.log('🌱 Seeding initial student reading profiles into database...');
      const { rows: stList } = await db.query('SELECT student_id FROM students LIMIT 20');
      const levels = ['Independent Level', 'Instructional Level', 'Frustration Level'];
      let idx = 0;
      for (const s of stList) {
        const lvl = levels[idx % 3];
        idx++;
        await db.query(`
          INSERT INTO reading_profiles (student_id, current_profile_label)
          VALUES ($1, $2)
          ON CONFLICT (student_id) DO UPDATE SET current_profile_label = EXCLUDED.current_profile_label
        `, [s.student_id, lvl]);
      }
      console.log('✅ Student reading profiles seeded successfully.');
    }
  } catch (seedErr) {
    console.warn('Phil-IRI seed notice:', seedErr.message);
  }
}

app.listen(PORT, async () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
  await initDatabase();
})
