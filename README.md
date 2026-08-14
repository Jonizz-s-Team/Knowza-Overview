# 🧠 Knowza AI — Source Code Overview

> **Production-grade AI-powered adaptive learning platform** built for Uzbekistan's top exam preparation (IELTS, SAT, Milliy Sertifikat).

[![Live Platform](https://img.shields.io/badge/Live%20Platform-knowza.uz-blue?style=for-the-badge)](https://knowza.uz)
[![Backend](https://img.shields.io/badge/Backend-Django%205.x-green?style=for-the-badge&logo=django)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](./frontend)
[![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20Groq%20%7C%20Llama-orange?style=for-the-badge)](./backend/ai_engine)

---

## 🎯 What is Knowza AI?

Knowza AI is a **full-stack adaptive learning engine** that combines cognitive science with large language models to deliver personalized exam preparation. Every component is built from scratch — no third-party learning systems, no templates.

### Core Capabilities

| Feature | Description | Technology |
|---------|-------------|------------|
| 🧪 **Adaptive Diagnostic** | IRT-based 20-question test converges on exact student ability | Item Response Theory (Rasch Model) |
| 🗺️ **AI Study Roadmap** | Personalized week-by-week plan generated from diagnostic results | Gemini / Llama 3.3 70B |
| 🃏 **Spaced Repetition** | SM-2 algorithm with daily AI-generated vocabulary decks | Custom SRS Engine |
| 🔬 **Research Mode** | AI generates full academic-style research articles on any topic | Streaming LLM pipeline |
| 📊 **Cognitive Tracking** | Tracks weak topics, mastery %, streak, and knowledge gaps | PostgreSQL + Django ORM |
| 🛡️ **AI Firewall** | Educational content guard to prevent misuse | Custom `KnowzaShield` |
| ⚡ **Multi-Provider Router** | Auto-failover between Groq → Gemini → OpenAI | Round-robin with retry |

---

## 📁 Repository Structure

```
Knowza-Overview/
│
├── backend/                        # Django REST Framework backend
│   ├── ai_engine/
│   │   ├── srs_engine.py           # ★ SM-2 Spaced Repetition System
│   │   ├── diagnostic_engine.py    # ★ IRT-based adaptive diagnostic test
│   │   ├── roadmap_engine.py       # ★ AI study plan generator
│   │   ├── cognitive_pedagogy.py   # ★ SpacedRepetitionScheduler class
│   │   ├── utils.py                # ★ Multi-provider AI router (Groq/Gemini/OpenAI)
│   │   ├── memory_engine.py        # Knowledge gap tracking
│   │   ├── test_coach.py           # Real-time AI tutoring during tests
│   │   ├── knowza_bridge.py        # Central AI orchestration layer
│   │   └── queue_engine.py         # Background AI task queue
│   └── api/
│       └── ai_knowza_views.py      # REST API endpoints (ViewSet)
│
└── frontend/                       # React 18 + Vite frontend
    └── src/
        ├── pages/
        │   ├── FlashCards.jsx      # ★ Flashcard review UI with SRS integration
        │   ├── Dashboard.jsx       # ★ Personal AI dashboard
        │   ├── Planner.jsx         # ★ Study roadmap UI
        │   ├── Research.jsx        # ★ AI research article generator
        │   └── Diagnostic.jsx      # ★ Adaptive diagnostic test UI
        └── context/
            └── FlashCardsContext.jsx  # Global flashcard generation state
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KNOWZA AI PLATFORM                        │
│                                                             │
│  ┌──────────────┐     ┌───────────────────────────────┐    │
│  │   React 18   │────▶│     Django REST Framework      │    │
│  │  Frontend    │     │         API Layer              │    │
│  │              │     └────────────┬──────────────────┘    │
│  │ • FlashCards │                  │                        │
│  │ • Dashboard  │     ┌────────────▼──────────────────┐    │
│  │ • Planner    │     │      AI ENGINE LAYER           │    │
│  │ • Diagnostic │     │                                │    │
│  │ • Research   │     │  ┌─────────┐  ┌────────────┐  │    │
│  └──────────────┘     │  │  Groq   │  │  Gemini    │  │    │
│                        │  │ Llama3  │  │ 1.5 Flash  │  │    │
│  ┌──────────────┐     │  └────┬────┘  └─────┬──────┘  │    │
│  │  PostgreSQL  │     │       └──────┬───────┘         │    │
│  │  Database    │◀────│             ▼                  │    │
│  │              │     │   KnowzaShield (Firewall)      │    │
│  │ • Users      │     │   call_ai() Router              │    │
│  │ • FlashCards │     │   Pydantic Validation           │    │
│  │ • Decks      │     │   Semantic Cache                │    │
│  │ • Roadmaps   │     └────────────────────────────────┘    │
│  │ • Diagnostics│                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⭐ Key Technical Highlights

### 1. SM-2 Spaced Repetition Engine (`srs_engine.py`)
```python
# Cards are scheduled using the SM-2 algorithm adapted from SuperMemo
# Quality 0-2 = fail (reset to day 1), 3-5 = success (advance interval)
interval, ef = SpacedRepetitionScheduler.calculate_next_review(
    failure_count=failure_count,
    success_count=card.repetition_count + 1,
    last_ease_factor=card.easiness_factor
)
# Result: next review in interval days, mastered if interval > 21 AND ef > 2.3
```

### 2. Item Response Theory — Adaptive Diagnostic (`diagnostic_engine.py`)
```python
def _irt_probability(theta: float, difficulty: float) -> float:
    """IRT 1-Parameter Logistic (Rasch) model.
    P(correct) = 1 / (1 + e^(-a*(theta - difficulty)))
    """
    a = 1.7  # discrimination parameter
    return 1.0 / (1.0 + math.exp(-a * (theta - difficulty)))
```
- Starts at medium difficulty, adapts each question based on correctness
- Converges to ±0.05 accuracy in 20 questions (vs 50+ for traditional tests)

### 3. Multi-Provider AI Router with Auto-Failover (`utils.py`)
```python
# Tries Groq (fast/cheap) → Gemini → OpenAI in priority order
# Round-robin across multiple API keys per provider
# Auto-retries with prompt repair on Pydantic validation failure
for provider in ['groq', 'gemini', 'openai']:
    for key in available_keys[provider]:
        result = _execute_provider(provider, prompt, key, ...)
        if not error: return result  # First success wins
```

### 4. Daily AI Vocabulary Generation (Frontend)
```javascript
// Picks a different topic from 15-topic pool each day
const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 0)) / 86400000);
const autoTopic = topicsList[dayOfYear % topicsList.length];
// Topics: 'Academic Vocabulary Band 7+', 'Environment & Ecology', ...
```

---

## 📊 Technical Stats

| Metric | Value |
|--------|-------|
| Total backend Python files | 23+ |
| Total frontend JSX components | 18+ |
| AI engine modules | 12 |
| Supported exam types | IELTS, SAT, Milliy Sertifikat |
| Supported languages | Uzbek 🇺🇿, Russian 🇷🇺, English 🇬🇧 |
| AI providers integrated | 3 (Groq, Gemini, OpenAI) |
| SRS algorithm | SM-2 (SuperMemo) |
| Diagnostic algorithm | IRT Rasch Model |
| Database | PostgreSQL |
| API style | REST (DRF ViewSets) |

---

## 🔐 Security & Reliability

- **`KnowzaShield`** — AI firewall that sanitizes all prompts and responses
- **Pydantic validation** — All AI responses are validated and auto-repaired on failure  
- **Semantic cache** — Identical queries return cached results (no redundant API calls)
- **Model tiering** — Cheap fast models for routine tasks, large models for complex generation
- **Round-robin keys** — Multiple API keys per provider prevent rate limiting

---

## 🚀 Tech Stack

**Backend:**
- Django 5.x + Django REST Framework
- PostgreSQL (production) / SQLite (development)
- Gunicorn + Nginx (production)
- Pydantic v2 for AI response validation
- Custom SM-2 SRS algorithm
- Custom IRT Rasch diagnostic engine

**Frontend:**
- React 18 + Vite
- TanStack Query (React Query) for server state
- React Router v6
- i18next (Uzbek/Russian/English)
- Custom CSS (no UI framework)

**AI/ML:**
- Groq API (Llama 3.1 8B, Llama 3.3 70B)
- Google Gemini 1.5 Flash
- OpenAI GPT-4o (fallback)
- Custom multi-provider router with auto-failover

---

> This repository contains selected source files from the Knowza AI platform.
> The complete production codebase includes additional proprietary modules.

**Contact:** Built by [Jonizz14](https://github.com/Jonizz14)
