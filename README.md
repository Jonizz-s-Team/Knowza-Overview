# 🎓 Knowza — Institutional EdTech & Assessment Ecosystem

[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite-orange.svg)]()
[![Backend](https://img.shields.io/badge/backend-Django%205%20%7C%20DRF-blue.svg)]()
[![Docs](https://img.shields.io/badge/docs-public%20overview-purple.svg)]()

**Knowza** is a unified multi-role educational SaaS platform designed for private schools and learning centers. It integrates secure online testing, academic scheduling, classroom management, student homework tracking, league gamification, and AI-assisted educational tools under a single ecosystem.

This repository serves as the centralized overview hub for the Knowza project.

---

## 🏛 Directory & Documentation Map

To understand different layers of Knowza, explore the links below:

*   **System Architecture Details:** [`docs/ARCHITECTURE.md`](file:///Users/jakhongir/Documents/Knowza-Overview/docs/ARCHITECTURE.md) - Database models, tenant query filtering, and server-side lifecycle sequence diagrams.
*   **Public API Structure:** [`docs/API_REFERENCE.md`](file:///Users/jakhongir/Documents/Knowza-Overview/docs/API_REFERENCE.md) - Secure REST endpoints for login, test sessions, anti-cheat reports, and limit checks.
*   **Feature Inventory:** [`docs/FEATURES.md`](file:///Users/jakhongir/Documents/Knowza-Overview/docs/FEATURES.md) - Detailed breakdown of features per role and component.
*   **Pitch & Product Strategy:** [`presentation/PITCH_DECK.md`](file:///Users/jakhongir/Documents/Knowza-Overview/presentation/PITCH_DECK.md) - Slide outline, market positioning, and SaaS monetization model.
*   **Presentation Script:** [`presentation/DEMO_FLOW.md`](file:///Users/jakhongir/Documents/Knowza-Overview/presentation/DEMO_FLOW.md) - Step-by-step instructions to demonstrate the system live.
*   **Evolution Timeline:** [`updates/README.md`](file:///Users/jakhongir/Documents/Knowza-Overview/updates/README.md) - Chronological releases tracker.

---

## ⚙️ How Knowza Works (System Workflow)

The operational pipeline follows a sequential workflow from registration to evaluation:

```text
[1. Admin Reg] ──► [2. Setup School] ──► [3. Schedule Classes]
                                                    │
[6. Real-time Audit] ◄── [5. Student Work] ◄────────┘
```

### 1. Admin Registration & Subscription
*   The School Owner (Admin) registers their learning center on the platform.
*   The Admin selects a subscription plan (Tariff).
*   The backend establishes a unique `Organization` identifier (Tenant ID) that scopes all future database entries.

### 2. School Infrastructure Setup
*   The Admin logs into the Admin Dashboard.
*   The Admin creates classrooms (`Classrooms`), school subjects (`Subjects`), and student class groups (`Groups`).
*   The Admin registers Teachers, Sub-Admins, and Students belonging to the school. Users can be created individually or imported instantly via bulk CSV files.

### 3. Class Scheduling & Assignment
*   The Admin maps the school schedule by creating `ClassScheduleSlots` linking days, times, subjects, and classrooms.
*   The Admin assigns specific teachers to specific student groups (`TeacherClassAssignment`).

### 4. Content Creation & Assignments
*   Teachers log in to their specialized Teacher Dashboard.
*   Teachers publish homework sheets with optional file attachments (`HomeworkAttachment`).
*   Teachers build quizzes and exams using the Test Builder. They specify details like time limits, question pools, and optional star-pricing.

### 5. Student Testing, Learning & Gamification
*   Students log into the Student Dashboard.
*   Students view their schedule calendar, download homework files, and take active tests.
*   Test attempts run under server-controlled sessions (`TestSession`), syncing answers dynamically.
*   Upon submission, the server awards XP (Experience Points) and Stars, updating the student's level, daily streak, and League rankings.

### 6. Security Enforcement & Analytics Auditing
*   While students take exams, the frontend monitors tab switches and window blur events, reporting logs to the backend.
*   Admins review class ranking trends, student results, anti-cheat violations, and operational logs to monitor center activity.

---

## 🛠 Technology Stack

*   **Frontend SPA:** [Test-App](https://github.com/Jonizz14/Test-App)
    *   *Stack:* React 19, Vite, React Router 7, TanStack Query, Axios, Tailwind CSS 4, Ant Design, GSAP, ECharts.
*   **Backend REST API:** [Django-Test-App-Backend](https://github.com/Jonizz14/Django-Test-App-Backend)
    *   *Stack:* Django 5, Django REST Framework, JWT, PostgreSQL, Redis.
