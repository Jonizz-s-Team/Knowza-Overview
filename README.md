# 🧠 Knowza AI — Source Code Overview (v3.0.0)

> **Enterprise-grade, full-spectrum AI-powered adaptive learning platform** built for rigorous exam preparation (IELTS, SAT, Milliy Sertifikat) and CEFR English Foundation (A0 to Strong B2 Mastery).

[![Live Platform](https://img.shields.io/badge/Live%20Platform-knowza.uz-blue?style=for-the-badge)](https://knowza.uz)
[![Version](https://img.shields.io/badge/Version-3.0.0-purple?style=for-the-badge)](./updates/update_v3.0.0.md)
[![Backend](https://img.shields.io/badge/Backend-Django%205.x-green?style=for-the-badge&logo=django)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](./frontend)
[![AI Multi-Provider](https://img.shields.io/badge/AI-Groq%20%7C%20Gemini%20%7C%20OpenAI-orange?style=for-the-badge)](./backend/ai_engine)

---

## 🎯 What is Knowza AI?

Knowza AI is an **end-to-end adaptive learning ecosystem** that integrates cognitive pedagogy, Item Response Theory (IRT), and large language models to deliver personalized educational acceleration. It features an English Foundation Engine (guaranteeing A0 to Strong B2 mastery), an Adaptive IELTS Reading & Writing Suite, a Socratic Test Coach, a deterministic 7-module study planner, and a 20-page student web application.

### Core Capabilities

| Feature | Description | Technology |
|---|---|---|
| 🧪 **Adaptive Diagnostic V2** | IRT-based adaptive test accurately calibrating student ability | Item Response Theory (Rasch Model) |
| 📖 **Adaptive IELTS Reading** | Multi-paragraph passage generation across 4 question types with band grading | Dynamic Reading Engine + Band Scoring |
| ✍️ **IELTS AI Writing Evaluator** | Task 1 & Task 2 grading across 4 Cambridge criteria with sentence corrections | LLM Rubric Evaluation Engine |
| 🗺️ **Deterministic Study Planner** | 7-module Python engine generating zero-token Free and low-token Pro roadmaps | `study_plan/` (128 Unit Tests passing) |
| 🎓 **Socratic Test Coach** | Real-time guidance during practice questions without direct answer spoilers | Socratic Pedagogy Pipeline |
| 🃏 **Spaced Repetition (SRS)** | SM-2 algorithm with daily AI-generated vocabulary decks | Custom SRS Engine (`srs_engine.py`) |
| 🔬 **Deep Research Studio** | Agentic web research with live reflection loop, TOC, and PDF export | Streaming LLM + Reflection Pipeline |
| 🛡️ **KnowzaShield AI Firewall** | Multilingual injection, jailbreak, and role-hijacking protection | Custom `firewall.py` |
| ⚡ **Multi-Provider Failover Router** | Sub-500ms auto-failover: Groq (`llama-3.3-70b`) → Gemini 2.0/1.5 → GPT-4o | Round-robin key manager + Semantic Cache |

---

## 📁 Repository Structure

```
Knowza-Overview/
│
├── Knowza AI/
│   ├── backend/                           # Django REST Framework backend
│   │   ├── ai_engine/
│   │   │   ├── ai_study_planner.py        # Legacy & bridge study planner adapter
│   │   │   ├── cognitive_pedagogy.py      # ★ Cognitive spaced repetition scheduler
│   │   │   ├── diagnostic_engine.py       # ★ IRT-based adaptive diagnostic test
│   │   │   ├── firewall.py                # ★ KnowzaShield anti-injection security layer
│   │   │   ├── ielts_reading_engine.py    # ★ IELTS Adaptive Reading passage & evaluation engine
│   │   │   ├── ielts_writing_engine.py    # ★ IELTS Writing Task 1 & 2 criteria grading engine
│   │   │   ├── knowledge.py               # RAG knowledge base interface
│   │   │   ├── knowza_bridge.py           # Central AI orchestration layer
│   │   │   ├── memory_engine.py           # Long-term knowledge gap tracking
│   │   │   ├── mock_engine.py             # Timed mock exam simulation engine
│   │   │   ├── queue_engine.py            # Daily missions & queue scheduler
│   │   │   ├── roadmap_engine.py          # Study roadmap generation coordinator
│   │   │   ├── srs_engine.py              # ★ SM-2 Spaced Repetition System
│   │   │   ├── streak_engine.py           # Habit & streak tracking engine
│   │   │   ├── streamer.py                # Server-Sent Events (SSE) streaming engine
│   │   │   ├── test_coach.py              # ★ Real-time Socratic AI tutoring during tests
│   │   │   ├── test_engine.py             # Assessment test runner & validator
│   │   │   ├── utils.py                   # ★ Multi-provider router with auto-failover
│   │   │   ├── vdb.py                     # Vector database semantic cache interface
│   │   │   ├── brain/                     # Modular brain sub-components (gateway, cache, profiling)
│   │   │   ├── exam_bank/                 # Validated question repositories (IELTS, SAT, MS)
│   │   │   ├── prompts/                   # Specialized system prompts for each pedagogical intent
│   │   │   └── study_plan/                # ★ 7-module deterministic study plan engine
│   │   └── api/
│   │       ├── ai_knowza_views.py         # Primary Knowza AI ViewSet endpoints
│   │       └── ielts_views.py             # IELTS Adaptive Reading & Writing ViewSet
│   │
│   └── frontend/                          # React 18 + Vite frontend
│       └── src/
│           ├── components/                # Specialized Knowza AI widgets & loaders
│           │   ├── ExamTrackModal.jsx     # Exam track selection modal (IELTS, SAT, MS)
│           │   ├── KnowzaAILoader.jsx     # Branded AI interaction loader
│           │   └── KnowzaAILoader.css     # Animation styles
│           ├── context/
│           │   └── FlashCardsContext.jsx  # Global flashcard generation state
│           └── pages/                     # Complete 20-Page Knowza AI Frontend Suite
│               ├── Home.jsx               # Spatial landing page with 3D globe & coverflow demo
│               ├── Dashboard.jsx          # Student learning cockpit & daily missions
│               ├── Diagnostic.jsx         # IRT-based diagnostic assessment wizard
│               ├── Reading.jsx            # IELTS Adaptive Reading simulator & passage viewer
│               ├── Writing.jsx            # IELTS Writing workspace with live criteria grading
│               ├── Tutor.jsx              # 24/7 Socratic conversational tutor
│               ├── Planner.jsx            # 4-phase study roadmap & milestone progress
│               ├── FlashCards.jsx         # SM-2 Spaced repetition flashcard deck
│               ├── Research.jsx           # Deep scientific research studio with TOC & PDF
│               ├── MockExam.jsx           # Full-length timed mock examinations
│               ├── Lesson.jsx             # Atomic micro-skill interactive lesson room
│               ├── Test.jsx               # Practice assessment runner with hints
│               ├── Analytics.jsx          # Cognitive analytics & skill gap radar
│               ├── Onboarding.jsx         # Multi-step student goal setup
│               ├── Login.jsx              # Dedicated student authentication
│               ├── Layout.jsx             # Sidebar and navigation frame
│               ├── Profile.jsx            # Profile & AI memory settings
│               ├── Pro.jsx                # Premium subscription tier upgrade
│               ├── Guide.jsx              # Comprehensive platform guide
│               └── Search.jsx             # Universal knowledge & notes search
│
├── docs/                                  # In-depth architectural & feature documentation
├── updates/                               # Comprehensive version-by-version changelog
└── README.md                              # Central project overview
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       KNOWZA AI 3.0 PLATFORM                                │
│                                                                             │
│  ┌──────────────────┐               ┌─────────────────────────────────┐    │
│  │     React 18     │──────────────▶│      Django REST Framework      │    │
│  │  Frontend Suite  │               │           API Layer             │    │
│  │   (20 Modules)   │               └────────────────┬────────────────┘    │
│  │ • IELTS Reading  │                                │                      │
│  │ • IELTS Writing  │               ┌────────────────▼────────────────┐    │
│  │ • Socratic Tutor │               │        AI ENGINE LAYER          │    │
│  │ • Study Planner  │               │                                 │    │
│  │ • Diagnostic IRT │               │  ┌──────────┐  ┌─────────────┐  │    │
│  │ • Mock Exams     │               │  │   Groq   │  │   Gemini    │  │    │
│  │ • FlashCards SRS │               │  │ Llama3.3 │  │ 2.0 / 1.5   │  │    │
│  │ • Research & PDF │               │  └────┬─────┘  └──────┬──────┘  │    │
│  └──────────────────┘               │       │  ┌──────────┐ │         │    │
│                                     │       │  │  OpenAI  │ │         │    │
│  ┌──────────────────┐               │       └──┤  GPT-4o  ├─┘         │    │
│  │    PostgreSQL    │               │          └────┬─────┘           │    │
│  │     Database     │◀──────────────│               ▼                 │    │
│  │                  │               │    KnowzaShield (Firewall)      │    │
│  │ • AI Profiles    │               │    Deterministic Planner        │    │
│  │ • Learning Nodes │               │    IELTS Adaptive Pipeline      │    │
│  │ • FlashCards SRS │               │    Socratic Dialogue Coach      │    │
│  │ • Diagnostic IRT │               │    Semantic Cache VDB           │    │
│  │ • Skill Gaps     │               └─────────────────────────────────┘    │
│  └──────────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⭐ Key Technical Highlights

### 1. Adaptive IELTS Writing & Reading Engines (`ielts_*`)
```python
# Automatic 4-criteria IELTS essay evaluation
evaluation = evaluate_essay(submission)
# Output includes:
# - Task Achievement / Response (0.0-9.0)
# - Coherence and Cohesion (0.0-9.0)
# - Lexical Resource (0.0-9.0)
# - Grammatical Range and Accuracy (0.0-9.0)
# - Detailed actionable suggestions and sentence-level corrections
```

### 2. Deterministic Study Planner (`study_plan/`)
- 7 modular Python components generating sub-5ms Free roadmaps with 0 token consumption.
- Pro roadmaps use token-compressed outlines, achieving >80% LLM token reduction.
- Guaranteed mathematical progression curve and gap-based sub-skill weighting.

### 3. Socratic Test Coach (`test_coach.py`)
- Real-time coaching during practice without revealing direct answers.
- Employs question-based hints and misconception diagnostics.

### 4. SM-2 Spaced Repetition Engine (`srs_engine.py`)
```python
interval, ef = SpacedRepetitionScheduler.calculate_next_review(
    failure_count=failure_count,
    success_count=card.repetition_count + 1,
    last_ease_factor=card.easiness_factor
)
```

---

## 📊 Technical Stats (v3.0.0)

| Metric | Value |
|---|---|
| **Total Backend AI Python Files** | 35+ |
| **Total Frontend Dedicated Pages** | 20 |
| **AI Engine Modules** | 20+ |
| **Supported Exam Standards** | IELTS (Academic & General), Digital SAT, Milliy Sertifikat |
| **CEFR Range** | A0 (Absolute Beginner) → Strong B2 (Upper-Intermediate) |
| **Supported Languages** | Uzbek 🇺🇿, Russian 🇷🇺, English 🇬🇧 |
| **Integrated AI Providers** | 3 (Groq Llama 3.3 70B, Google Gemini 2.0/1.5, OpenAI GPT-4o) |
| **SRS Algorithm** | SM-2 (SuperMemo) |
| **Diagnostic Algorithm** | IRT Rasch Model |
| **Deterministic Unit Tests** | 128 (100% Pass) |
| **Security Layer** | KnowzaShield Multilingual Anti-Injection Firewall |

---

## 🚀 Tech Stack

**Backend:**
- Django 5.x + Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Pydantic v2 for AI response schema validation
- Custom 7-module Deterministic Study Plan Engine
- Custom Adaptive IELTS Reading & Writing Engines
- Custom Socratic Test Coach & SM-2 SRS Engine

**Frontend:**
- React 18 + Vite (Tailwind CSS, Lucide Icons, Framer Motion)
- TanStack Query (React Query) for state synchronization
- React Router v6
- i18next (Uzbek/Russian/English)

**AI/ML:**
- Groq API (`llama-3.3-70b-versatile`)
- Google Gemini 2.0 Flash / 1.5 Flash
- OpenAI GPT-4o (Fallback)
- Custom Multi-Provider Failover Router with Semantic Caching

---

> Built with ❤️ by [Jonizz14](https://github.com/Jonizz14)
