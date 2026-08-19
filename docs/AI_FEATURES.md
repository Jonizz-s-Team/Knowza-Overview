# 🤖 Knowza AI — Feature Catalog (v3.0.0)

Knowza AI is an autonomous, full-spectrum learning ecosystem built exclusively for students and self-directed learners. It encompasses 20 specialized modules tailored for exam excellence (IELTS, SAT, Milliy Sertifikat) and CEFR foundation mastery.

---

## 🚀 Complete 20-Module Feature Catalog

### 1. 📖 IELTS Adaptive Reading Simulator (`Reading.jsx`)
- Dynamically synthesizes CEFR-calibrated academic reading passages.
- Includes 4 standard IELTS question types: True/False/Not Given, Multiple Choice, Matching Headings, and Summary Completion.
- Instant submission grading with comprehensive explanations and Band Score conversion (0.0–9.0).

### 2. ✍️ IELTS AI Writing Evaluator (`Writing.jsx`)
- Generates Task 1 (visual data / charts / letters) and Task 2 (discursive essay) prompts.
- Evaluates submissions across official Cambridge IELTS criteria:
  1. *Task Achievement / Response*
  2. *Coherence and Cohesion*
  3. *Lexical Resource*
  4. *Grammatical Range and Accuracy*
- Line-by-line grammar corrections and vocabulary enhancement recommendations.

### 3. 💬 24/7 Socratic AI Tutor (`Tutor.jsx`)
- Conversational Socratic tutor that leads students toward answers through guided questions.
- Multiple pedagogical intents: `EXPLAIN_SIMPLE`, `EXPLAIN_DEEP`, `SIMPLIFY`, `DEEPEN`.
- Streaming responses with KaTeX math formula rendering and Markdown formatting.

### 4. 🗺️ Deterministic 4-Phase Study Planner (`Planner.jsx`)
- 7-module Python engine creating tailored study paths across 4 phases: *Diagnostic & Foundation*, *Skills Development*, *Exam Simulation*, and *Final Review*.
- 0-token instant generation for Free tier; token-compressed summaries for Pro tier.
- Gap-based allocation dedicating 70% of study time to weakest diagnostic sub-skills.

### 5. 🧪 Adaptive Diagnostic Assessment V2 (`Diagnostic.jsx`)
- Item Response Theory (IRT Rasch model) test converging on student proficiency in 20 questions.
- Assesses Grammar, Vocabulary, Reading, and Listening with precise CEFR placement (A0 to Strong B2).

### 6. 🃏 SM-2 Spaced Repetition Flashcards (`FlashCards.jsx`)
- Daily vocabulary decks generated from a 15-topic academic pool.
- SuperMemo SM-2 algorithm scheduling cards based on repetition count, ease factor, and recall quality.

### 7. 🔬 Deep Research Studio (`Research.jsx`)
- Autonomous multi-step research agent performing live web search and reflection.
- Generates structured research papers with dynamic Table of Contents (TOC), full-screen reading mode, and PDF export.

### 8. 📝 Mock Exam Simulator (`MockExam.jsx`)
- Timed full-length mock examinations for SAT, IELTS, and Milliy Sertifikat.
- Simulates official test conditions with section transitions, time warnings, and post-exam analytics.

### 9. 🏫 Interactive Atomic Lesson Room (`Lesson.jsx`)
- Micro-skill lesson environment with interactive dialogues and comprehension checks.
- Enforces 90% mastery threshold before unlocking subsequent curriculum nodes.

### 10. 🎯 Practice Test Runner (`Test.jsx`)
- Practice test interface with real-time Socratic hints from the AI Test Coach.
- Tracks question attempts and feeds error patterns directly into `SkillGap`.

### 11. 📊 Cognitive Analytics Dashboard (`Analytics.jsx`)
- Detailed visualization of CEFR mastery progression, daily learning streaks, and subject competency radar charts.
- Identifies emerging knowledge gaps and forecasts target exam scores.

### 12. 🎮 Central Learning Cockpit (`Dashboard.jsx`)
- Overview of today's learning missions, streak counter, upcoming milestones, and quick action cards.

### 13. 🌐 Spatial Landing Page (`Home.jsx`)
- Modern product presentation with 3D interactive Globe, coverflow demonstration slider, feature comparison grids, and pricing tiers.

### 14. 🧭 Guided Onboarding (`Onboarding.jsx`)
- Multi-step personalization setup: exam track, target score, timeline, daily study hours, and learning language.

### 15. 🔐 Dedicated Student Auth (`Login.jsx`)
- Secure JWT-based authentication isolated from institutional LMS portals.

### 16. 🖼️ Workspace Navigation Shell (`Layout.jsx`)
- Fluid sidebar navigation with real-time AI quota badges and notifications.

### 17. 👤 Profile & AI Memory Controls (`Profile.jsx`)
- Student profile management, target goal adjustment, and AI long-term memory toggle (`is_memory_enabled`).

### 18. ⭐ Pro Subscription Upgrade Hub (`Pro.jsx`)
- Flexible subscription tiers (1, 3, 9 months) with instant feature unlocking and Uzbek electronic receipt generation.

### 19. 📚 Comprehensive Platform Manual (`Guide.jsx`)
- Step-by-step user guide detailing how to maximize each AI tool in the workspace.

### 20. 🔍 Universal Knowledge Search (`Search.jsx`)
- Fast multi-resource search across study notes, saved research articles, and vocabulary decks.
