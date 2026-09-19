# SalinTinig 🎙️ - API Reference Documentation

Base URL (Production): `https://salintinig.onrender.com/api`  
Base URL (Local Dev): `http://localhost:5000/api`

---

## 🔐 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Authenticate admin, teacher, or student | No |
| `POST` | `/signup` | Teacher account registration request | No |
| `GET` | `/me` | Get currently logged-in user profile | Yes (Bearer JWT) |
| `POST` | `/forgot-password` | Request 6-digit password reset verification code via email | No |
| `POST` | `/verify-reset-code` | Verify 6-digit password reset code | No |
| `POST` | `/reset-password` | Set new password following verification | No |
| `PUT` | `/profile` | Update account profile details | Yes (Bearer JWT) |
| `PUT` | `/change-password` | Change account password | Yes (Bearer JWT) |

---

## 👩‍🏫 2. Teacher & Assessment Endpoints (`/api/teacher`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/class-students` | Get enrolled students for teacher's grade/section |
| `GET` | `/assessments/passages` | Get PHIL-IRI reading passages (Filipino/English, Sets A-D) |
| `GET` | `/assessments/phil-iri-activities` | Get master list of created PHIL-IRI activities |
| `POST` | `/assessments/assign-phil-iri-students` | Assign PHIL-IRI reading assessment to selected students |
| `GET` | `/assessments/activity-detail/:id` | Get detailed activity results, student completion status, and WPM scores |
| `PUT` | `/assessments/toggle-status` | Toggle activity status (open / closed) |
| `DELETE` | `/assessments/:id` | Delete master activity and student assignments |
| `GET` | `/students/:id/promotion` | View student promotion status |
| `GET` | `/grade-level` | Get assigned section grade level stats |

---

## 👦 3. Student Endpoints (`/api/students` or `/api/student`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/assessment/passages` | Get assigned reading passages for student |
| `POST` | `/assessment/submit-oral` | Submit oral reading audio recording for Groq Whisper v3 AI transcription & miscue analysis |
| `POST` | `/assessment/submit-listening` | Submit listening comprehension quiz answers |
| `POST` | `/assessment/submit-silent` | Submit silent reading speed & comprehension test |
| `GET` | `/progress` | Get student streaks, earned badges, reading WPM history, and stats |
| `GET` | `/vocabulary` | Get practice reader vocabulary words & quizzes |

---

## 🛠️ 4. Admin Endpoints (`/api/admin`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/stats` | Global portal metrics (Total Students, Teachers, Assessments Conducted) |
| `GET` | `/analytics/phil-iri` | Comprehensive PHIL-IRI reading profile distribution reports |
| `GET` | `/account-requests` | List pending teacher registration requests |
| `PUT` | `/account-requests/:id/approve` | Approve teacher request and send automated welcome credentials email |
| `PUT` | `/account-requests/:id/reject` | Reject teacher registration request |
| `GET` | `/school-years` | Manage academic school years |

---

## 🔔 5. Notification Endpoints (`/api/notifications`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Fetch user notifications |
| `PUT` | `/:id/read` | Mark single notification as read |
| `PUT` | `/read-all` | Mark all notifications as read |
| `DELETE` | `/:id` | Delete notification |
