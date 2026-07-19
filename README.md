# 🎓 Knowza — Unified EdTech Ecosystem

[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite-orange.svg)]()
[![Backend](https://img.shields.io/badge/backend-Django%205%20%7C%20DRF-blue.svg)]()
[![Docs](https://img.shields.io/badge/docs-public%20overview-purple.svg)]()
[![Releases](https://img.shields.io/badge/releases-v2.8.5-blue.svg)]()

Knowza is an ecosystem of **two completely separate products**, each with its own environment, audience, and subscription:

> ⚠️ **Important:** Knowza AI and Knowza LMS are **different products with different subscriptions**. A student enrolled at a school on Knowza LMS does **NOT** automatically get Knowza AI access. These are separate purchases.

---

## 🏫 Knowza LMS — For Schools and Learning Centers

**Audience:** School administrators, teachers, and enrolled students  
**Model:** B2B SaaS — the **institution** purchases the subscription  
**What it does:** Full school management — schedules, classrooms, anti-cheat exams, homework, gamification, and multi-role dashboards

---

## 🤖 Knowza AI — Personal AI Tutor for Students

**Audience:** Students / independent learners **only**  
**Model:** B2C — the **student** purchases a personal subscription  
**What it does:** AI-powered personal learning — adaptive tutor, test generation, study roadmap, long-term memory, and error analysis

---

## 📐 Ecosystem Map

```
┌─────────────────────────────────────────────────────────────┐
│  🏫 Knowza LMS                │  🤖 Knowza AI               │
│  For schools & centers        │  For students only          │
│  Subscription: B2B            │  Subscription: B2C          │
│                               │                             │
│  Roles: Admin · BranchAdmin   │  Role: Learner only         │
│         Teacher · Student     │                             │
│                               │                             │
│  Features:                    │  Features:                  │
│  • School management          │  • AI Tutor (chat)          │
│  • Schedules & classrooms     │  • Learning roadmap         │
│  • Anti-cheat exams           │  • Sandbox tests            │
│  • Homework system            │  • Daily missions           │
│  • Leagues & gamification     │  • Socratic Coach           │
│  • School analytics           │  • AI Articles + Web Search │
│  • B2B tariff plans           │  • Personal subscription    │
└───────────────────┬───────────┴──────────────┬──────────────┘
                    └─────────────┬────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │  Knowza Backend (Django)  │
                    │  Shared infrastructure:   │
                    │  Auth · DB · AI Engine    │
                    └─────────────┬────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │  PostgreSQL · Redis       │
                    └──────────────────────────┘
```

This repository is the centralized documentation hub for the entire Knowza ecosystem.

---

## 🏫 Knowza LMS

Knowza LMS is a **B2B SaaS platform** designed for private schools, learning centers, and educational institutions. It provides a complete institutional management system with role-tailored workspaces for Admins, Teachers, and Students.

### What Knowza LMS covers:

- **Multi-role Dashboards** — separate workspaces for School Admins, Branch Admins, Teachers, and Students
- **Academic Management** — classrooms, subjects, groups, lesson scheduling, and student enrollment
- **Test & Exam Engine** — teacher-built quizzes and exams with configurable settings
- **Knowza Sentinel** — server-authoritative anti-cheat system with real-time tab monitoring and auto-bans
- **Homework System** — assignment publishing with file attachments and tracking
- **Gamification & Leagues** — XP, Stars, daily streaks, weekly leagues, and milestone rewards
- **SaaS Subscriptions** — multi-tier B2B tariff engine per institution size
- **Multi-tenant Isolation** — strict organization-scoped data separation at every layer

> 📄 See [`docs/LMS_ARCHITECTURE.md`](docs/LMS_ARCHITECTURE.md) for the full technical blueprint.
> 📋 See [`docs/LMS_FEATURES.md`](docs/LMS_FEATURES.md) for the complete feature inventory.

---

## 🤖 Knowza AI

Knowza AI is a **standalone personal learning platform for students only**. It is completely separate from Knowza LMS — different environment, different subscription, different audience. Students access Knowza AI with a personal account and personal subscription to get an AI tutor that learns from them.

### What Knowza AI covers:

- **Personal AI Tutor** — conversational AI that adapts to each student's level, goals, and language (EN/RU/UZ)
- **AI Test Generation** — generates sandbox tests on any topic, calibrated to the student's level
- **Learning Roadmap** — builds a personalized sequential study plan with locked/available/completed nodes
- **Daily Missions** — auto-generated task queue (lesson / test / review / practice) prioritized by skill gaps
- **Socratic Coach** — asks guiding questions after wrong answers to build critical thinking
- **AI Articles** — writes in-depth educational articles enriched with live web search and YouTube references
- **Long-Term Memory** — remembers each student's history, struggles, and goals across sessions
- **KnowzaShield Firewall** — prompt injection and jailbreak detection in 3 languages
- **Personal B2C Subscription** — independent from any school tariff (Free / Premium / Knowza ID Universal)

> 📄 See [`docs/AI_ARCHITECTURE.md`](docs/AI_ARCHITECTURE.md) for the full technical blueprint.
> 📋 See [`docs/AI_FEATURES.md`](docs/AI_FEATURES.md) for the complete feature inventory.

---

## 📸 Platform Preview

All screenshots use sanitized demo data. Personal names, credentials, and tenant-specific identifiers are intentionally hidden.

### Admin Dashboard — Analytics & School Management
> The admin overview provides real-time statistics on students, teachers, active groups, and system activity with interactive charts.

![Admin Dashboard](docs/images/Overview.png)

### Class Scheduling System
> A full weekly/daily schedule grid linking classrooms, subjects, teachers, and time slots.

![Schedule System](docs/images/Schedule.png)

### Teacher Test Builder
> Teachers create quizzes and exams with configurable time limits, question pools, anti-cheat settings, and optional star-pricing.

![Test Builder](docs/images/TeacherTest.png)

### Sentinel Anti-Cheat & Exam Results
> Real-time violation tracking and detailed exam result analytics.

![Anti-Cheat & Results](docs/images/TeacherExamResult.png)

### Student Dashboard — Daily Overview
> Students see their daily schedule, active assignments, Dynamic Island notifications, and gamification stats.

![Student Dashboard](docs/images/StudentOverview.png)

### League & Gamification System
> A competitive leaderboard with XP-based rankings, levels, daily streaks, and Stars currency.

![League System](docs/images/StudentLeague.png)

### Live Exam Session
> The exam interface with real-time countdown, question navigation, and answer syncing — all protected by Sentinel.

![Exam Session](docs/images/ExamSession.png)

### SaaS Pricing Plans
> Five-tier subscription model with feature differentiation for institutions of different sizes.

![Pricing Page](docs/images/PricingPage.png)

---

## 🏛 Documentation Map

| Document | Description |
|---|---|
| [`docs/LMS_ARCHITECTURE.md`](docs/LMS_ARCHITECTURE.md) | Knowza LMS — system structure, frontend/backend layers, anti-cheat & session model |
| [`docs/LMS_FEATURES.md`](docs/LMS_FEATURES.md) | Knowza LMS — complete feature inventory per role |
| [`docs/AI_ARCHITECTURE.md`](docs/AI_ARCHITECTURE.md) | Knowza AI — LLM engine design, memory system, intent routing, RAG pipeline |
| [`docs/AI_FEATURES.md`](docs/AI_FEATURES.md) | Knowza AI — full AI feature set and personalization capabilities |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Public REST API structure for auth, tests, anti-cheat, and AI endpoints |
| [`presentation/PITCH_DECK.md`](presentation/PITCH_DECK.md) | Pitch deck, market positioning, and SaaS monetization model |
| [`presentation/DEMO_FLOW.md`](presentation/DEMO_FLOW.md) | Step-by-step live demo walkthrough |
| [`updates/README.md`](updates/README.md) | Chronological release tracker (v1.0.0 → v2.8.5) |

---

## 🛠 Technology Stack

### Knowza LMS + Knowza AI — Shared Frontend
- **Stack:** React 19, Vite, React Router 7, TanStack Query v5, Axios, Tailwind CSS 4, Ant Design, GSAP, ECharts, i18next (EN/RU/UZ)

### Knowza Backend (Shared API)
- **Stack:** Django 5, Django REST Framework, SimpleJWT, PostgreSQL, Redis, Gunicorn, WhiteNoise

### Knowza AI Engine (within the backend)
- **LLM Providers:** OpenAI (GPT-4o), Anthropic Claude, Google Gemini, Groq — with multi-key load balancing
- **Memory:** PostgreSQL-based long-term user summaries + thread-local context
- **RAG:** Internal knowledge base with PostgreSQL full-text search
- **Semantic Cache:** Vector-based deduplication for article responses

---

## 📦 Repositories

| Repository | Description | Tech |
|---|---|---|
| `Knowza` | Frontend SPA — Student, Teacher, Admin dashboards + AI Chat UI | React 19, Vite, Ant Design |
| `Knowza-Backend` | REST API — LMS Engine + Knowza AI Engine, Auth, Anti-Cheat | Django 5, DRF, JWT, PostgreSQL |
| `Knowza-Overview` | Documentation hub — Architecture, API docs, Releases | Markdown |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
