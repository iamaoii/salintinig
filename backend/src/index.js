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
// app.use('/api/auth', require('./routes/auth.routes'))
// app.use('/api/recordings', require('./routes/recordings.routes'))

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SalinTinig API is running 🎙️' })
})

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
})
