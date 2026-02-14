# 🌍 Familia — Cross-Cultural Human Connection Platform

> **"Real people forming deep, cross-cultural bonds through chosen family roles — technology is the bridge, not the companion."**

Familia is a platform where humans from different cultures connect as chosen family members (mother, son, mentor, friend, etc.), communicate through real-time AI translation, and strengthen their bonds through contests, games, and shared cultural experiences.

![Familia Banner](https://img.shields.io/badge/Familia-Cross_Cultural_Connection-FF6B35?style=for-the-badge&logo=globe&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## ✨ Key Features

### 🔐 Human Verification
- Video/voice verification to ensure only real humans connect
- Intent bio to describe why you want to be part of the global family
- Verified badge displayed across the platform

### 🌐 Real-Time Translation
- AI-powered translation (OpenAI GPT-3.5) with cultural context
- Idiom detection for 6+ languages (English, Hindi, Portuguese, Japanese, Spanish, Korean)
- Cultural notes explaining nuances that translation can't capture
- MyMemory API as fallback

### 🤝 Smart Matching
- Choose your role (mother, father, son, daughter, sibling, mentor, student, friend, pen pal, grandparent, grandchild)
- Score-based matching algorithm considering language compatibility, verification status, care score
- Cross-cultural priority — matching people from different cultures first

### 📈 Relationship Levels & Bond Points
- **Level 1 — Stranger**: Basic text chat
- **Level 2 — Acquaintance**: Voice messages, simple games (50 pts)
- **Level 3 — Companion**: Video calls, contests, all games (150 pts)
- **Level 4 — Close Bond**: Family rooms, cultural exchange (300 pts)
- **Level 5 — Family**: Full trust, time capsules, gratitude journal (500 pts)

### 🏆 Bond Contests
- Questions auto-generated from your real conversations using AI
- Synchrony scoring — bonus points when both partners answer similarly
- Weekly challenges to keep bonds active

### 🎮 Bonding Games
- Mood Mirror, Emotion Charades, Cultural Trivia, Would You Rather
- Story Builder, Recipe Swap, Word Exchange, Gratitude Chain
- Each game earns bond points and strengthens your relationship

### 🏠 Global Family Rooms
- Themed group spaces (cooking, language, music, stories, art)
- Multi-language messages with auto-translation
- Cultural Potluck events — share traditions together

### 🎨 Custom Avatars
- Full avatar customization: skin tone, hair, eyes, outfit, accessories, expression, background
- Cultural outfit options (Indian, Brazilian, Japanese, African heritage, etc.)
- Interactive SVG-based avatar preview

### 🛡️ Safety System
- Bond severing with 24-hour cooldown and farewell message
- User reporting and moderation queue
- Exit surveys for bond improvement
- Minor protection settings
- Reliability scoring

---

## 🏗️ Architecture

```
cfc_Familya/
├── backend/                  # FastAPI Python backend
│   ├── main.py              # FastAPI app + router registration
│   ├── config.py            # Pydantic settings (env vars)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   ├── routers/             # API route handlers
│   │   ├── auth.py          # Signup, login, verification
│   │   ├── profiles.py      # User profiles, languages, status
│   │   ├── matching.py      # Smart matching algorithm
│   │   ├── chat.py          # Messages + WebSocket + translation
│   │   ├── contests.py      # Bond quiz contests
│   │   ├── games.py         # Bonding games
│   │   ├── family_rooms.py  # Group rooms + potlucks
│   │   ├── safety.py        # Reports, severing, moderation
│   │   └── translation.py   # Translation API
│   ├── services/            # Business logic
│   │   ├── supabase_client.py
│   │   ├── translation_service.py
│   │   ├── matching_service.py
│   │   └── contest_service.py
│   └── models/
│       └── schemas.py       # Pydantic request/response models
│
├── frontend/                 # Next.js 14 TypeScript frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── layout.tsx         # Root layout + animated BG
│   │   │   ├── globals.css        # Glass morphism + animations
│   │   │   ├── signup/page.tsx    # Multi-step signup
│   │   │   ├── login/page.tsx     # Login with demo mode
│   │   │   ├── verify/page.tsx    # Human verification flow
│   │   │   ├── dashboard/page.tsx # Main hub
│   │   │   ├── chat/[id]/page.tsx # Real-time translated chat
│   │   │   ├── matching/page.tsx  # Role selection + match flow
│   │   │   ├── contests/page.tsx  # Bond quiz interface
│   │   │   ├── games/page.tsx     # Game catalog + gameplay
│   │   │   ├── family-rooms/      # Group rooms + chat
│   │   │   ├── avatar/page.tsx    # Avatar customizer
│   │   │   └── profile/page.tsx   # User profile + achievements
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   └── supabase.ts        # Supabase client
│   │   └── types/
│   │       └── index.ts           # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js         # Custom theme
│   └── .env.example
│
└── supabase/
    └── schema.sql            # 24 tables, RLS, triggers, seeds
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account (or local Supabase)

### 1. Database Setup
```bash
# Create a new Supabase project at https://supabase.com
# Go to SQL Editor and run the entire contents of:
# supabase/schema.sql
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and OpenAI keys

# Run the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# Run the dev server
npm run dev
```

### 4. Open the app
Visit **http://localhost:3000** 🎉

---

## 🎮 Demo Mode

The frontend works in **demo mode** without any backend/Supabase setup:
- All pages use mock data for demonstration
- Auth stores data in localStorage
- Chat simulates partner replies with translation
- Games and contests are fully playable with mock data
- Perfect for hackathon demos!

---

## 🗄️ Database (24 Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with care score, verification status |
| `user_languages` | Spoken languages with proficiency levels |
| `verification_records` | Video/voice verification data |
| `relationships` | Bonds between users with roles and levels |
| `messages` | Chat messages with translation data |
| `contests` | Bond quiz sessions |
| `contest_questions` | AI-generated quiz questions from chat |
| `chat_facts` | Extracted facts from conversations for contests |
| `family_rooms` | Group rooms with themes |
| `family_room_members` | Room membership |
| `family_room_messages` | Multi-language room messages |
| `cultural_potlucks` | Cultural exchange events |
| `games` | Available bonding games (15 seeded) |
| `game_sessions` | Active/completed game sessions |
| `achievements` | Achievement definitions (16 seeded) |
| `user_achievements` | Earned achievements |
| `notifications` | In-app notifications |
| `reports` | User reports |
| `moderation_queue` | Items pending review |
| `exit_surveys` | Feedback when bonds end |
| `matching_queue` | Real-time matching queue |
| `relationship_milestones` | Bond milestone tracking |
| `time_capsules` | Future messages (Level 5 feature) |
| `gratitude_entries` | Gratitude journal entries |

---

## 🎨 Design System

- **Glass Morphism**: Translucent cards with blur effects
- **Gradient Palette**: Familia orange (#FF6B35), Bond teal (#06B6D4), Heart rose (#F43F5E), Warm amber
- **Animations**: Float, glow, shimmer, heartbeat, gradient-shift (Framer Motion + CSS)
- **Typography**: System fonts with custom weight scale
- **Components**: Glass cards, gradient buttons, progress rings, typing indicators, badge system

---

## 🌐 Supported Languages (Translation)

English, Hindi, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Chinese (Simplified & Traditional), Arabic, Russian, Turkish, Dutch, Swedish, Thai, Vietnamese, Indonesian

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/verify` | Human verification |
| GET | `/api/v1/profiles/me` | Get my profile |
| POST | `/api/v1/matching/search` | Find a match |
| POST | `/api/v1/chat/send` | Send translated message |
| WS | `/api/v1/chat/ws/{id}` | Real-time chat WebSocket |
| POST | `/api/v1/contests/create` | Start bond contest |
| GET | `/api/v1/games/` | List bonding games |
| POST | `/api/v1/family-rooms/create` | Create family room |
| POST | `/api/v1/safety/report` | Report a user |
| POST | `/api/v1/translate/` | Translate text |

---

## 🤖 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend**: FastAPI, Python 3.10+, Pydantic
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Translation**: OpenAI GPT-3.5-turbo + MyMemory API
- **Real-time**: WebSockets (FastAPI) + Supabase Realtime
- **Auth**: JWT tokens + Supabase Auth

---

## 🏆 Built for Call for Code

Familia addresses the need for genuine human connection in an increasingly digital world. By combining cross-cultural bonding with AI-powered translation and safety systems, we create a space where real people form real families — across every border.

> **"Not an AI companion. Not a chatbot. A real human who chose to be your family."**

---

<p align="center">
  Made with ❤️ for a more connected world 🌍
</p>