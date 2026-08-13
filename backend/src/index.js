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
    }
  } catch (err) {
    console.warn('DB Init Notice:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
  await initDatabase();
})
