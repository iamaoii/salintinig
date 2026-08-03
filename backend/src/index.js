const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

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

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
})
