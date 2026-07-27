# 🚀 Update v2.9.0 — Deterministic Hybrid AI Study Planner, Zero-Token Free Tier, Granular Tier Engine & Sub-Second Groq Gateway

**Release Period:** July 20 – July 27, 2026  
**Commits:** ~6 (Frontend) · ~8 (Backend)  
**Lines Changed:** +2,397 / −106  

---

## 🎯 Release Goal

Replace hallucination-prone AI study plan generation with a high-precision, 7-module deterministic Python engine (`study_plan/`). Eliminate AI token expenditure entirely for Free-tier users while delivering instant sub-5ms roadmap generation. Differentiate Free vs. Pro plans with crystal-clear pedagogical value: 2-phase capped roadmaps for Free vs. 4-phase deep arcs with weekly Mini Mock Exams, gap-based diagnostic skill targeting, and Pro-exclusive tutor strategies for Pro users. Prioritize ultra-fast Groq (`llama-3.3-70b-versatile`) routing with KnowzaShield firewall security.

---

## 🏫 Knowza LMS

### 🏫 Frontend
> No new LMS-specific features shipped in this release. This cycle was focused entirely on the Knowza AI product environment.

---

### 🏫 Backend

> No new LMS-specific backend changes in this release.

---

## 🤖 Knowza AI

### 🤖 Frontend

> All frontend changes below are **exclusive to the Knowza AI product** — the standalone personal AI tutor environment for students.

- **Plan Tier Badging & Upgrade Triggers (`Planner.jsx`):** Integrated live tier badges (`Knowza AI Standard Plan` vs. `Knowza AI Pro Plan`) and upgrade info banners explaining Pro features.
- **Interactive Phase Progress Bar (`Planner.jsx`):** Developed a dynamic phase indicator component rendering the 4-phase pedagogical arc (*Diagnostic & Foundation*, *Skills Development*, *Exam Simulation*, *Final Review*).
- **Milestone & Today's Mission Cards (`Planner.jsx`):** Enhanced hero section with non-linear predicted score milestones and structured daily mission checklists.
- **Exam Structure & Skill Guidance (`Planner.jsx`):** Detailed exam section breakdown cards for Digital SAT (RW + Math Desmos specs), IELTS (Listening, Reading, Writing, Speaking), and Milliy Sertifikat.

---

### 🤖 Backend

> All backend changes below are **exclusive to the Knowza AI engine** within the shared backend infrastructure.

- **Deterministic Hybrid Study Planner Engine (`api/ai_engine/study_plan/`):** Replaced legacy AI-heavy generation with a modular 7-component engine:
  - `exam_knowledge.py`: Domain knowledge base for IELTS (0.0-9.0), SAT (400-1600), and Milliy Sertifikat (0-100 Rash model scale across 7 core subjects).
  - `difficulty_engine.py`: Mathematical modeling of progress curves and burnout-adjusted study hours.
  - `section_allocator.py`: Allocates study time across exam sections based on sub-skill diagnostic gaps (70% weight to weak skills).
  - `phase_builder.py`: Builds 4-phase arcs for Pro users and 2-phase simplified arcs for Free users.
  - `tier_differentiator.py`: Enforces zero-AI Free plans and token-compressed Pro plan prompt constraints.
  - `curriculum_bank.py`: Hierarchical bilingual (UZ/EN) topic map.
  - `plan_assembler.py`: Central orchestration engine assembling the complete roadmap object.
- **Zero-Token Free Tier & Token-Compressed Pro Tier:** Free plans cost 0 AI tokens. Pro plans send only a 4-week skeleton summary to the LLM, reducing input token consumption by >80%.
- **Adjusted AI Daily Limits (`ai_limits.py`):** Increased daily AI quota for Free students to 10 requests/day (ideal for daily AI chat & practice test generation), and Pro students to 150 requests/day.
- **Sub-Second Provider Router (`utils.py`):** Prioritized **Groq (`llama-3.3-70b-versatile`)** and **Gemini 2.0 Flash** for `roadmap_gen`, `article_gen`, and `test_gen` to deliver ~300-600ms latency.
- **128 Unit and Integration Tests (`study_plan/tests/`):** Created a comprehensive test suite covering edge cases, scoring logic, and tier integrity. All 128 tests passing (`128/128 OK`).

---

## 📐 Architecture Notes

- **Swiss-Watch Reliability:** Structural validity (daily minutes, phase order, sequential topic progression, mock test placement) is guaranteed mathematically by Python; the LLM is restricted strictly to generating Markdown lesson descriptions for Pro users.
- **Zero-Latency Free Tier:** Free roadmaps generate deterministically in < 5ms without external API dependencies or network overhead.
- **KnowzaShield Firewall Protection:** All incoming prompts pass through KnowzaShield for injection and jailbreak prevention, and outputs are strictly validated via Pydantic schemas.

---

## 🗑 Cleanups

- **Legacy AI Roadmap Prompts:** Replaced massive, hallucination-prone system prompts with focused skeleton constraints (`roadmap_engine.py`).
- **Unused AI Timeline Predictor:** Replaced legacy timeline predictor with the mathematical `DifficultyEngine`.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~6 |
| Backend Commits | ~8 |
| Total Files Changed | 18 |
| Lines Added | +2,397 |
| Lines Removed | -106 |
| Unit & Integration Tests | 128 (100% Pass) |
| Free Plan Latency | < 5 ms |
| Pro Plan Latency | ~500 ms |
| Token Cost Savings | 80-100% |
