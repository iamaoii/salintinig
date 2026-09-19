# SalinTinig 🎙️ - System Architecture & Workflow Documentation

This document describes the high-level architectural design, data pipelines, AI speech-to-text integration, and database setup for **SalinTinig**.

---

## 🏛️ 1. High-Level Architecture Overview

SalinTinig is built as a multi-client educational portal with Web (React) and Mobile (Flutter) frontends connected to a centralized Node.js/Express backend server, backed by a PostgreSQL database and AI engines.

```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|  +--------------------------------+   +----------------------------+  |
|  |   Web Client (React + Vite)    |   |  Mobile Client (Flutter)   |  |
|  |   https://salintinig.org       |   |  Android / iOS App         |  |
|  +---------------+----------------+   +--------------+-------------+  |
+------------------|-----------------------------------|----------------+
                   | HTTPS / REST / WebSockets         | HTTPS / REST
                   v                                   v
+-----------------------------------------------------------------------+
|                    EDGE & NETWORK SECURITY LAYER                      |
|  Cloudflare DNS & CDN (Universal SSL/TLS + Proxy + CNAME Flattening)  |
+-----------------------------------|-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                         APPLICATION SERVER                            |
|  Node.js + Express REST API Server (Hosted on Render)                 |
|  - JWT Authentication & Authorization Middleware                      |
|  - Real-time Notification Engine (Socket.io)                          |
|  - PHIL-IRI Assessment Engine & Miscue Scoring Logic                  |
+----------+------------------------+-----------------------+-----------+
           |                        |                       |
           v                        v                       v
+----------------------+  +-------------------+  +----------------------+
|   DATABASE LAYER     |  |   STORAGE LAYER   |  |  EXTERNAL SERVICES   |
| Supabase PostgreSQL  |  | Cloudinary &      |  | - Groq Whisper v3    |
| (Users, Passages,    |  | Supabase Storage  |  | - Resend Email API   |
| Assessment Records)  |  | (Audio Recordings)|  |   (noreply@...)      |
+----------------------+  +-------------------+  +----------------------+
```

---

## 🎙️ 2. Oral Reading Speech-to-Text (STT) Pipeline

When a student performs an **Oral Reading Assessment**:

1. **Audio Recording**: The web client (via `MediaRecorder`) or mobile client (via Flutter `record`) captures the student's voice reading a PHIL-IRI passage.
2. **Audio Upload**: The raw audio file (`.webm`, `.wav`, or `.m4a`) is transmitted to the backend server.
3. **Groq Whisper Large v3 Processing**:
   - The backend sends the audio stream to **Groq Whisper Large v3 ASR Engine**.
   - Groq returns the full text transcript of the student's speech in sub-second latency.
4. **Miscue Scoring Algorithm**:
   - The backend compares the AI transcript against the original passage text.
   - It automatically identifies miscues:
     - **Omission (OMI)**: Words omitted by the student
     - **Substitution (SUB)**: Words mispronounced or replaced
     - **Insertion (INS)**: Extra words spoken
     - **Hesitation (HES)** / **Repetition (REP)** / **Self Correction (SC)**
5. **Score & Profile Calculation**:
   - Computes **Reading Speed (Words Per Minute / WPM)**.
   - Computes **Oral Reading Accuracy Level**:
     - 🟢 **Independent** (97% - 100%)
     - 🟡 **Instructional** (90% - 96%)
     - 🔴 **Frustrational** (< 90%)
6. **Teacher Verification & Review**:
   - Teachers can listen to the audio recording in their dashboard, inspect AI-detected miscues, make manual adjustments, and approve the final score.

---

## 🗄️ 3. Core Database Entities

| Entity / Table | Description |
| :--- | :--- |
| `users` | Stores accounts for Admins, Teachers (FICs), and Students. |
| `school_years` | Tracks academic school years and active status. |
| `grade_levels` | Defines grade sections (e.g. Grade 4, Grade 5, Grade 6). |
| `passages` | Stores PHIL-IRI reading passages (Filipino/English, Sets A-D, Grade 4-6). |
| `phil_iri_activities` | Master activities created by teachers for assessment assignments. |
| `student_phil_iri_assessments` | Individual student assessment results, scores, miscues, audio links, and reading profiles. |
| `vocabulary_attempts` & `story_progress` | Gamified practice reader and vocabulary tracking for students. |
| `notifications` | System notifications for teachers and admins. |

---

## 🔐 4. Security & Access Control

- **Authentication**: JWT tokens stored securely in client browser/local storage.
- **Authorization Scopes**:
  - `Admin`: Manage school years, teachers, student masterlists, and global PHIL-IRI reports.
  - `Teacher`: Manage class sections, create PHIL-IRI activities, conduct reviews, and view student progress.
  - `Student`: Access gamified reading practice, complete assigned PHIL-IRI assessments, and view earned badges/streaks.
- **CORS Protection**: Enforces trusted origins (`https://salintinig.org`, `https://www.salintinig.org`).
