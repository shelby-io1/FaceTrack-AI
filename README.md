# FaceTrack AI — AI-Powered Attendance System

Real-time face recognition attendance management with managed authentication via Neon Auth.

## Stack

| Tier       | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | Next.js 16.2.10 (App Router), React 19, Tailwind CSS v4, TanStack Query 5 |
| Backend    | FastAPI, Python 3.14, SQLAlchemy 2.0                                       |
| Database   | PostgreSQL on [Neon](https://neon.tech) (serverless)                       |
| Auth       | [Neon Auth](https://neon.tech/docs/auth/overview) (Better Auth) + local JWT bridge |
| Face AI    | InsightFace (buffalo_l model) — detection & recognition                    |
| HTTP       | Axios (client), Uvicorn (server)                                           |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│  Browser     │────▶│  Next.js :3000   │────▶│  FastAPI   │
│  (React SPA) │     │                  │     │  :8000     │
│             │     │  API Proxy (+auth) │     │            │
│             │     │  Neon Auth SDK    │     │  JWT Auth  │
│             │     └──────┬───────────┘     └─────┬──────┘
│             │            │                       │
│             │     ┌──────▼───────────┐     ┌─────▼──────┘
│             │     │  Neon Auth       │     │  Neon       │
│             │     │  (Better Auth)   │     │  Postgres   │
│             │     └──────────────────┘     └────────────┘
└─────────────┘
```

### Auth Flow

1. **Sign in/up** — Browser → Next.js API route (`/api/auth/[...path]`) → Neon Auth server
2. **Token exchange** — Browser → Next.js (`/api/auth/exchange-token`) → FastAPI (`/auth/neon-exchange`)
3. **API calls** — Axios attaches local JWT (storage: localStorage) → FastAPI validates via shared secret bridge
4. **Route protection** — `proxy.ts` (Next.js 16) checks Neon Auth session cookie, redirects to `/login` if missing

## Project Structure

```
attendance-ai/
├── backend/
│   └── app/
│       ├── core/           — Config, DB session, JWT/bcrypt helpers
│       ├── models/         — SQLAlchemy ORM (User, Student, FaceEncoding, Attendance)
│       ├── routes/         — auth, neon_auth, students, teachers, enrollment, recognition, attendance, health
│       ├── schemas/        — Pydantic request/response models
│       ├── services/       — Business logic (auth, face recognition, enrollment)
│       └── ai/             — InsightFace wrapper (detect, embed, compare)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/         — Login & Register pages
│       │   ├── attendance/     — Webcam + auto-recognize + mark attendance
│       │   ├── enrollment/     — Face capture (20 shots, 5 poses) + student list with image gallery
│       │   ├── students/       — List all students
│       │   ├── teachers/       — List teachers with inline editing
│       │   └── api/auth/       — Neon Auth proxy, token exchange
│       ├── lib/
│       │   ├── auth/           — Neon Auth server/client SDK instances
│       │   ├── auth-context.tsx — Auth provider (TanStack Query)
│       │   └── api.ts          — Axios client with Bearer interceptor
│       ├── components/         — Shared UI components (Sidebar, ProtectedRoute, AppLayout)
│       └── proxy.ts            — Next.js 16 route guard
└── docs/                      — (project documentation, TBD)
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Python >= 3.13
- A [Neon](https://neon.tech) project with PostgreSQL and **Neon Auth enabled**

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Configure backend/.env
# DATABASE_URL (from Neon console)
# SECRET_KEY (generate a random string)
# NEON_AUTH_SHARED_SECRET (must match frontend)

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Configure frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEON_AUTH_BASE_URL=https://ep-<project>.neonauth.<region>.aws.neon.tech/neondb/auth
# NEON_AUTH_COOKIE_SECRET= (openssl rand -base64 32)
# NEON_AUTH_SHARED_SECRET= (same as backend)

npm run dev
```

### Dev URLs

| Service      | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000         |
| Backend API  | http://localhost:8000/api     |
| API Docs     | http://localhost:8000/docs    |

## Environment Variables

### Frontend (`.env.local`)

| Variable                  | Description                        |
| ------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`     | FastAPI base URL                   |
| `NEON_AUTH_BASE_URL`      | Neon Auth server URL (with path)   |
| `NEON_AUTH_COOKIE_SECRET` | Secret for session cookie signing  |
| `NEON_AUTH_SHARED_SECRET` | Shared secret for token exchange   |

### Backend (`.env`)

| Variable                  | Description                        |
| ------------------------- | ---------------------------------- |
| `DATABASE_URL`            | Neon Postgres connection string    |
| `SECRET_KEY`              | JWT signing key                    |
| `ALGORITHM`               | JWT algorithm (default: HS256)     |
| `NEON_AUTH_SHARED_SECRET` | Shared secret (must match frontend) |

## API Endpoints

### Auth

| Method | Path                       | Description                    |
| ------ | -------------------------- | ------------------------------ |
| POST   | `/api/auth/register`       | Register (local users table)   |
| POST   | `/api/auth/login`          | Login (local users table)      |
| POST   | `/api/auth/refresh`        | Refresh JWT                    |
| PATCH  | `/api/auth/me`             | Update profile                 |
| GET    | `/api/auth/me`             | Current user profile           |
| POST   | `/api/auth/neon-exchange`  | Neon Auth → local JWT exchange |

### Students

| Method | Path                      | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/api/students`           | List all students          |
| GET    | `/api/students/{id}`      | Get student by ID          |
| POST   | `/api/students`           | Create student             |
| PUT    | `/api/students/{id}`      | Update student             |
| DELETE | `/api/students/{id}`      | Delete student             |

### Teachers

| Method | Path                      | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/api/teachers`           | List all teachers          |
| PUT    | `/api/teachers/{user_id}` | Update teacher             |

### Enrollment

| Method | Path                              | Description                           |
| ------ | --------------------------------- | ------------------------------------- |
| POST   | `/api/enrollment/capture`         | Detect face, store embedding + image  |
| GET    | `/api/enrollment/status`          | All students with capture progress    |
| GET    | `/api/enrollment/student/{id}/images` | Base64 images for a student        |

### Recognition

| Method | Path                            | Description                           |
| ------ | ------------------------------- | ------------------------------------- |
| POST   | `/api/recognition/recognize`    | Match face against enrolled students  |

### Attendance

| Method | Path                       | Description                    |
| ------ | -------------------------- | ------------------------------ |
| POST   | `/api/attendance/mark`     | Mark attendance for a student  |
| GET    | `/api/attendance/today`    | Today's attendance records     |
| GET    | `/api/attendance/history`  | Attendance history (paginated) |

### Health

| Method | Path              | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | `/api/health`     | Backend health check           |

## Face Recognition Pipeline

1. **Detection** — InsightFace RetinaFace detects face bounding box + landmarks
2. **Alignment** — Landmark-based affine transform normalises the face
3. **Embedding** — ArcFace (buffalo_l) produces a 512-dim feature vector
4. **Matching** — Cosine similarity against all enrolled embeddings (threshold: 0.5)

### Enrollment Flow

- Admin selects a student from the dropdown and starts the camera
- System captures 20 images across 5 poses (front, left, right, up, down — 4 each)
- Each capture detects + embeds the face; low-quality images are rejected
- All embeddings are stored in the `face_encodings` table linked to the student
- The enrolled students sidebar shows progress and allows viewing captured images

### Attendance Flow

- Webcam streams live feed
- On button press or auto-detect (3s interval), face is captured and compared against enrolled students
- Best match above threshold → attendance recorded with student ID and timestamp
- Each student can mark attendance once per day

## Roles

| Role      | Capabilities                                                    |
| --------- | --------------------------------------------------------------- |
| Admin     | Full access: manage students, teachers, enrollment, attendance  |
| Teacher   | View students, mark attendance, manage enrollment               |
| Student   | View own attendance and profile (self-registration via signup)  |

- Registration is open to anyone (no invite code required)
- Student profile is auto-created on signup with nullable fields (roll_number, department, semester)

## Design

- **Monochrome palette** — gray-900 primary with gray-50/100/200 accents, no blue/green
- **Minimal UI** — card-based forms, centered layouts, sans-serif typography
- **Responsive** — works on desktop and tablet viewports
