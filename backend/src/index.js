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
app.use('/api/admin', require('./routes/admin.routes.js'))
app.use('/api/teacher', require('./routes/teacher.routes.js'))
app.use('/api/notifications', require('./routes/notification.routes.js'))
app.use('/api/tts', require('./routes/tts.routes.js'))

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

      // Auto-migrate reading_profiles and student_reading_profiles normalized architecture
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS student_reading_profiles (
            profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
            language VARCHAR(20) NOT NULL DEFAULT 'fil',
            assessment_type VARCHAR(50) NOT NULL,
            assessment_period VARCHAR(50) NOT NULL DEFAULT 'pre_test',
            profile_level VARCHAR(50) NOT NULL,
            accuracy_rate DECIMAL(5,2),
            comprehension_rate DECIMAL(5,2),
            speed_wpm INT,
            last_assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_student_lang_modality_period UNIQUE (student_id, language, assessment_type, assessment_period)
          );

          -- Create or update the dynamic VIEW (reads directly from normalized student_reading_profiles)
          CREATE OR REPLACE VIEW reading_profiles AS
          SELECT 
              s.student_id,
              COALESCE(
                (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id ORDER BY srp.updated_at DESC LIMIT 1),
                'Pending Evaluation'
              ) AS current_profile_label,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS oral_profile_label,
              (SELECT accuracy_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS oral_accuracy_rate,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS oral_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS oral_speed_wpm,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS listening_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS listening_comprehension_rate,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS silent_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS silent_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS silent_speed_wpm,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' ORDER BY srp.updated_at DESC LIMIT 1) AS filipino_profile_label,
              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' ORDER BY srp.updated_at DESC LIMIT 1) AS english_profile_label,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_profile_label,
              (SELECT accuracy_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_accuracy_rate,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_speed_wpm,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_listening_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_listening_comprehension_rate,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_speed_wpm,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_profile_label,
              (SELECT accuracy_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_accuracy_rate,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_speed_wpm,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_listening_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_listening_comprehension_rate,

              (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_profile_label,
              (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_comprehension_rate,
              (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_speed_wpm
          FROM students s;
        `);
      } catch (colErr) {
        console.warn('reading_profiles migration notice:', colErr.message);
      }

      console.log('✅ Database schema verified & ready.');
    }
  } catch (err) {
    console.warn('DB Init Notice:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
  await initDatabase();
})
