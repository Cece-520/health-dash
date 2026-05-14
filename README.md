# 🌿 Wellness Tracker

A full-stack web application for monitoring daily health and wellness. Users can log mood, sleep, energy, and symptoms through a daily check-in interface, visualize trends over time through interactive dashboards, and access educational health resources powered by the U.S. National Library of Medicine.

**Live Demo:** [meow-healthdash.vercel.app](https://meow-healthdash.vercel.app)

---

## Features

- **Daily check-in** — log mood, sleep hours, energy level, and symptoms with severity ratings
- **Trend dashboard** — interactive line charts showing mood, sleep, and energy over 7, 14, or 30 days
- **Symptom info** — search any symptom to get educational resources from MedlinePlus (NIH)
- **Secure auth** — email/password authentication via Supabase Auth with JWT validation
- **Data privacy** — PostgreSQL row-level security ensures users can only access their own data
- **Responsive design** — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Pydantic |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| External API | MedlinePlus — U.S. National Library of Medicine |
| Hosting | Vercel (frontend), Railway (backend) |
| Version Control | Git, GitHub |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client Browser                   │
│         Next.js — Vercel (meow-healthdash.vercel.app)│
└──────────────┬──────────────────────────────────────┘
               │ REST API calls (JWT auth header)
               ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend — Railway               │
│  /checkins   /analytics/trends   /symptoms/info      │
└──────┬──────────────────────────┬───────────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐         ┌─────────────────────┐
│  Supabase   │         │  MedlinePlus API     │
│ PostgreSQL  │         │  (NIH / NLM)         │
│ + Auth      │         │  wsearch.nlm.nih.gov │
└─────────────┘         └─────────────────────┘
```

---

## Project Structure

```
wellness-tracker/
├── frontend/                   # Next.js app → Vercel
│   ├── app/
│   │   ├── page.tsx            # Login / signup
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Trends dashboard
│   │   ├── checkin/
│   │   │   └── page.tsx        # Daily check-in form
│   │   ├── symptoms/
│   │   │   └── page.tsx        # Symptom info panel
│   │   └── lib/
│   │       └── supabase.ts     # Supabase client
│   └── ...
│
├── backend/                    # FastAPI app → Railway
│   ├── app/
│   │   ├── main.py             # App entry point, CORS
│   │   ├── auth.py             # JWT middleware
│   │   ├── database.py         # Supabase client
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic models
│   │   └── routers/
│   │       ├── checkins.py     # Check-in CRUD
│   │       ├── analytics.py    # Trend aggregation
│   │       └── symptoms.py     # MedlinePlus proxy
│   ├── schema.sql              # PostgreSQL schema + RLS
│   ├── requirements.txt
│   └── railway.toml
│
└── README.md
```

---

## Database Schema

```sql
profiles      -- extends Supabase auth.users
check_ins     -- mood, sleep_hours, energy, notes, date
symptoms      -- name, severity (linked to check_ins)
```

Row-level security policies ensure every user can only read and write their own data using `auth.uid() = user_id`.

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Run the database schema
# Paste contents of schema.sql into Supabase SQL Editor and run

# Start the server
uvicorn app.main:app --reload
# API running at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL

# Start the dev server
npm run dev
# App running at http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ping` | Health check |
| POST | `/checkins/` | Save a daily check-in |
| GET | `/checkins/` | List recent check-ins |
| GET | `/checkins/{id}` | Get a single check-in |
| GET | `/analytics/trends` | Aggregated mood/sleep/energy trends |
| GET | `/symptoms/info?name=` | Fetch health info from MedlinePlus |

All endpoints except `/ping` require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Deployment

| Service | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| Backend | Railway | Auto-deploys on push to `main` |

### Environment variables

**Railway (backend):**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FRONTEND_URL
```

**Vercel (frontend):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL
```

---

## What I Learned

- Designing a **REST API with FastAPI** including JWT authentication middleware, Pydantic validation, and CORS configuration
- Setting up **PostgreSQL row-level security** to protect user health data at the database level
- Integrating a **third-party health API** (MedlinePlus) via a backend proxy pattern to keep API calls secure
- Managing **environment-specific configuration** across local development, Railway, and Vercel
- Building a **full CI/CD pipeline** using GitHub → Vercel and GitHub → Railway for automatic deployments

---

## License

MIT — feel free to use this project as a reference or starting point.