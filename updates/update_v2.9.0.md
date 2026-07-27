# Knowza AI Release v2.9.0 — Deterministic Hybrid Study Planner & Tier Engine

> **Release Date:** July 27, 2026  
> **Target Products:** Knowza AI (B2C) & Core Platform Backend  
> **Architecture Focus:** Hybrid Deterministic Engine, Zero-Token Free Tier, Sub-second Latency, Granular Pedagogical Tiering  

---

## 🚀 Key Highlights & Architectural Overhaul

### 1. Deterministic Hybrid Study Planner Engine (`api/ai_engine/study_plan/`)
- **Zero AI Hallucination & Exact Math**: Replaced heavy LLM generation with a 7-module Python engine that calculates exact timeline milestones, daily study minute budgets, non-linear progress curves, and burnout multipliers.
- **80-100% Token Cost Reduction**:
  - **Free Tier**: 0 AI tokens consumed. Pre-computes full schedules, milestones, daily missions, and templated markdown lessons deterministically.
  - **Pro Tier**: LLM receives a highly compressed 4-week skeleton summary to generate deep tutor-style lesson strategies and personalized greetings, slashing input token costs by 80%+.

### 2. Comprehensive Exam Knowledge Base (`exam_knowledge.py`)
- **IELTS**: Score range 0.0–9.0 (0.5 steps), 4 sections (Listening, Reading, Writing, Speaking), 17 sub-skills, Cambridge-based hours matrix.
- **SAT**: Digital SAT scale 400–1600 (10pt steps), 2 sections (Reading & Writing, Math), Desmos integration techniques, domain skill mapping.
- **Milliy Sertifikat (MS/DTM)**: 0–100 Rash model scale ($C, C+, B, B+, A, A+$), subject-specific section ratios (Closed vs. Open short vs. Open detailed) across 7 subjects (*Matematika, Biologiya, Kimyo, Fizika, Tarix, Geografiya, Ona tili va adabiyot*).

### 3. Fair & Impactful Tier Differentiation
- **Free Tier**:
  - 2-Phase Arc (*Foundation & Practice → Exam Preparation*).
  - Capped at 8 weeks maximum.
  - 2 lesson modules per day.
  - 10 AI Requests/day (Chat + Practice Test Generation).
  - 3 Roadmap Refreshes per profile.
- **Pro Tier**:
  - 4-Phase Deep Pedagogical Arc (*Diagnostic & Foundation → Skills Development → Exam Simulation → Final Review*).
  - Up to 52 weeks planning.
  - 3 lesson modules per day + **Weekly Mini Mock Exams** on Day 7.
  - **Gap-Based Allocation**: 70% study time targeted dynamically at weakest diagnostic skills.
  - 150 AI Requests/day + Pro Socratic Coach + Unlimited PDF Export & Node Regenerations.

### 4. KnowzaShield Security & Lightning Provider Router
- **Security Audit**: All incoming prompts audited by `KnowzaShield` for jailbreaks and prompt injections. Outputs validated against strict Pydantic schemas.
- **Ultra-Fast Fallback Router**: Prioritizes **Groq (`llama-3.3-70b-versatile`)** and **Gemini 2.0 Flash**, delivering sub-second response times (~300-600ms).

---

## 📊 Technical Test Metrics
- **128 Unit and Integration Tests**: All 128 tests passing (`128/128 OK`).
- **Response Latency**: Free tier < 5ms, Pro tier ~500ms.
- **Code Coverage**: 100% core coverage for `study_plan` modules.

---

*Knowza AI Team — Elevating Education Through Reliable Intelligence.*
