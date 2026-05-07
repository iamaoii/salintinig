# SalinTinig 🎙️

> A capstone project — Speech-to-text web and mobile application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | React.js + Tailwind CSS (Vite) |
| Backend | Node.js + Express.js |
| Mobile | Flutter (Dart) |
| Database | Supabase (PostgreSQL) |
| Audio (Web) | Web Audio API |
| Audio (Mobile) | Flutter `record` package |
| Deployment | Vercel (frontend), Render (backend), Supabase |

---

## Project Structure

```
salintinig/
├── frontend/     ← React + Tailwind CSS (Web App)
├── backend/      ← Node.js + Express.js (REST API)
└── mobile/       ← Flutter (Mobile App)
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Flutter SDK
- A Supabase project ([supabase.com](https://supabase.com))

---

### 🌐 Frontend

```bash
cd frontend
cp .env.example .env    # Fill in your Supabase keys
npm install
npm run dev             # Runs at http://localhost:5173
```

---

### ⚙️ Backend

```bash
cd backend
cp .env.example .env    # Fill in your Supabase service role key
npm install
npm run dev             # Runs at http://localhost:5000
```

---

### 📱 Mobile

> **Windows users:** Enable Developer Mode first:
> Go to **Settings → For developers → Developer Mode → On**

```bash
cd mobile
flutter pub get
flutter run             # Connect a device or start an emulator first
```

---

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```