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

// Routes
app.use('/api/auth', require('./routes/auth.routes.js'))
app.use('/api/admin/students', require('./routes/student.routes.js'))
app.use('/api/admin', require('./routes/admin.routes.js'))

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
