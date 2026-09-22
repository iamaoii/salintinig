# SalinTinig 🎙️ - Technology Stack & System Specs

> **SalinTinig** is an AI-powered Speech-to-Text Web and Mobile Educational Application designed to assess, analyze, and enhance student reading fluency and literacy through PHIL-IRI (Philippine Informal Reading Inventory) standards.

---

## 🛠️ Complete Technology Stack

### 🌐 1. Frontend (Web Application)
| Component | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | React.js (v18+) | Core component-based UI framework |
| **Build System** | Vite (v8) | Next-generation fast frontend bundler |
| **Styling** | Tailwind CSS + Vanilla CSS | Modern UI design system, Glassmorphism, Responsive Layouts |
| **Iconography** | Phosphor Icons (`@phosphor-icons/react`) | High-quality scalable vector icons |
| **Real-time Engine** | Socket.io Client (`socket.io-client`) | Live notifications and real-time activity updates |
| **Audio Processing** | Web Audio API / MediaRecorder | Native browser audio recording for oral reading tests |
| **Hosting & Deployment** | Cloudflare Pages | Edge CDN hosting with zero-downtime deployments |

---

### ⚙️ 2. Backend (REST API Server)
| Component | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Runtime Environment** | Node.js (v18+) | Server-side JavaScript runtime |
| **Web Framework** | Express.js | REST API routing and middleware management |
| **Real-time Server** | Socket.io (`socket.io`) | Server-side WebSocket event dispatcher |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | Stateless bearer token authentication |
| **Security** | `bcryptjs` + `cors` | Password hashing & origin cross-site access security |
| **File Processing** | `multer` | Multipart form-data handling for file uploads |
| **Hosting & Deployment** | Render | Cloud Web Service hosting Node.js API |

---

### 🗄️ 3. Database & Storage
| Component | Technology / Service | Purpose |
| :--- | :--- | :--- |
| **Primary Database** | PostgreSQL via Supabase | Relational database housing users, passages, assessments, and analytics |
| **Database Driver** | `pg` (Node Postgres) + `@supabase/supabase-js` | Connection pool and Supabase client SDK |
| **Cloud Storage** | Supabase Storage & Cloudinary | Asset storage for student audio recordings, passage audio files, and avatars |

---

### 🤖 4. AI Engine & Micro-RAG Framework
| Component | Model / Engine | Purpose |
| :--- | :--- | :--- |
| **Automatic Speech Recognition (ASR)** | **Groq Whisper Large v3** | Sub-second, accurate oral reading transcription & miscue scoring |
| **Micro-RAG Remediation Engine** | **Groq Llama 3 / Micro-RAG Pipeline** | Context-aware retrieval-augmented generation for adaptive practice story quizzes, hint extraction, and remedial feedback |
| **In-Memory LRU Cache** | In-Memory LRU Cache | High-speed zero-token caching for repeated RAG remediation queries |

---

### ✉️ 5. Email Communications & Verification
| Component | Service / Protocol | Purpose |
| :--- | :--- | :--- |
| **Email Service** | **Resend** (`resend` SDK) | Transactional emails (Welcome credentials, Activation requests, Password reset codes) |
| **Sender Domain** | `SalinTinig <noreply@salintinig.org>` | Verified custom domain sender address |
| **Sender Avatars** | Gravatar & Google Account Profile | Official SalinTinig brand logo icon displayed in Gmail, Yahoo, Outlook & Apple Mail |

---

### 📱 6. Mobile Application
| Component | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | Flutter (Dart SDK) | Cross-platform mobile application for Android/iOS |
| **Audio Engine** | `record` package & `audioplayers` | Mobile device audio recording and playback |
| **State & Storage** | `shared_preferences`, `flutter_dotenv` | Local user session storage and environment configuration |

---

### 🛡️ 7. Infrastructure, DNS & Networking
| Component | Service | Purpose |
| :--- | :--- | :--- |
| **Domain Registrar** | Name.com (`salintinig.org`) | Custom domain purchase & management |
| **DNS & Security** | Cloudflare DNS | Free Universal SSL/TLS, CNAME flattening, DDoS protection, CDN |
| **Version Control** | Git & GitHub (`iamaoii/salintinig`) | Source code repository and automated deployment triggers |
