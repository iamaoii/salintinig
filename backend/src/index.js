require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const db = require('./config/db.js')
const { initSocket } = require('./config/socket.js')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5000

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive during early deployment, can be tightened
  },
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve static files (backend public directory including logos)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/src/assets')));

// Routes
app.use('/api/auth', require('./routes/auth.routes.js'))
app.use('/api/students', require('./routes/student.routes.js'))
app.use('/api/student', require('./routes/student.routes.js'))
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
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled Error:', err)
  } else {
    console.error('Unhandled Error:', err.message || 'Server Error')
  }
  res.status(500).json({ success: false, error: 'Internal Server Error' })
})

async function initDatabase() {
  if (!process.env.DATABASE_URL) return;
  try {
    // Verify database connection responsiveness
    await db.query('SELECT 1;');
    console.log('✅ Supabase PostgreSQL Database connected & active.');
  } catch (err) {
    console.warn('⚠️ DB Connection Warning:', err.message);
  }
}

server.listen(PORT, async () => {
  console.log(`✅ SalinTinig Server listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  initSocket(server)
  await initDatabase()
})
