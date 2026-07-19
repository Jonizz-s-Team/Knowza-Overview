# 🚀 Update v2.7.0 — Gamified Leagues, Test Complaints System & Calendar Migration

**Release Period:** June 6 – June 12, 2026  
**Commits:** ~16 (Frontend) · ~9 (Backend)  
**Lines Changed:** +11,118 / −4,499  

---

## 🎯 Release Goal

Introduce gamified Duolingo-style season leagues with percentile brackets, implement a robust test complaint system for student feedback, migrate the homework calendar view to CalendarJS, safeguard forms with unsaved changes protection, and modernize the frontend architecture by standardizing state management on TanStack Query (v5).

---

## 🛠 Features & Capabilities Introduced

### Frontend — Knowza LMS

- **Gamified Student Leagues UI:** Fully redesigned the `StudentLeaguePage` with styled percentile zones (promotion/demotion areas), current streak multipliers, motivational user prompts, and an interactive dashboard for league rankings (`5ec8961`, `420b4c1`, Jun 9-10).
- **Test Complaint Submission:** Enabled students to submit complaints and report issues on specific test questions directly from the exam page, feeding into the admin notification system (`ac1093a`, Jun 9).
- **CalendarJS Migration for Homework:** Migrated the homework calendar view from Ant Design to `CalendarJS` across the teacher and student panels, introducing enhanced scheduling timelines and interactive visual overlays (`cd0531d`, `633f9ba`, Jun 12).
- **Unsaved Changes Protection:** Added a form dirty-checking and draft recovery system for test creation and editing interfaces to prevent accidental data loss. Also disabled animations on standard Modals to resolve layout shifts (`e81b28c`, Jun 12).
- **Modernized Data Fetching:** Refactored the `TeacherDashboard` page states and data-fetching pipelines, migrating them from legacy states to TanStack Query (v5) for real-time synchronization and caching (`95c3f5b`, `63e2b82`, Jun 12).
- **Country-Selecting Phone Input:** Integrated a brand-new `PhoneInput` component supporting country flag selectors, localized input masking, and profile UI updates (`deab62f`, Jun 12).
- **Role-Based Help Centers:** Designed and integrated dedicated document views (`AdminDocs.jsx`, `StudentDocs.jsx`, and `TeacherDocs.jsx`) to serve role-specific guides directly inside the user dashboard panels (`73275b3`, `a7a480c`, `63e2b82`, Jun 8-12).
- **Support Badge & Ticket Filtering:** Integrated a floating platform support badge and enhanced support tickets to filter incoming requests by sender roles (`73275b3`, `63e2b82`, Jun 8-12).
- **Explicit Size Cleanups:** Standardized layouts by removing redundant size props from search fields, sorting selects, and input fields across all modules (`7c7c8f1`, `6adb8a1`, Jun 6-9).

### Backend — Knowza LMS (`Knowza-Backend`)

- **Season Leagues Engine:** Implemented Duolingo-style leagues, configurable cohorts, streak multipliers, and percentile-based closing algorithms (`6428552`, `3044fa2`, Jun 8-9).
- **Automated League Expire Runner:** Added an automated league expiration command (`expire_leagues`) and cron-like runner (`auto_expire_runner.py`) to periodically compute rankings and advance/demote students (`6428552`, Jun 9).
- **Question Objection Logging:** Created models and endpoints (`TestComplaint`) to capture detailed student complaints mapped to specific test questions (`5921567`, `9962633`, Jun 9).
- **Public Test Database Flag:** Added a `is_in_public_db` field on the `Test` model to let institutional authors mark templates as public library materials (`9962633`, Jun 9).
- **Tenant Visibility Expansion:** Updated student access policies so students can view classmates and league rankings constrained securely within their specific tenant scope (`50d2b38`, `20509c6`, Jun 9-10).
- **Tariff Limits & Access Control:** Adjusted subscription logic to include students alongside teachers in role-based limits (`7fc040c`, `242e9d8`, Jun 8-10).

---

## 📐 Architecture Changes

- **State Consolidation on TanStack Query v5:** Reduced manual React states in favor of server-state caching with TanStack Query. Standardized request keys and automated stale-time caching across Teacher and Student dashboards.
- **League Cron Automation:** Introduced an offline script executor (`auto_expire_runner.py`) utilizing Django's management commands to decouple heavy computation (league percentile calculation) from request-response cycles.
- **Unified Event Overlays:** The legacy AntD calendar was replaced by CalendarJS to implement a custom schedule overlay, standardizing weekly schedules across both Student and Teacher panels.

---

## 🗑 Deletions & Cleanups

- **Legacy AntD Calendar View:** Removed the Ant Design calendar component dependencies from the homework views to free up bundle size.
- **Redundant Size Parameters:** Removed explicit input sizes (`size="middle"`, `size="large"`) across 30+ UI files to rely entirely on CSS theme parameters.
- **Class Ranking Interactivity:** Stripped interactive buttons and hovers from classmates ranking lists to present a simplified view.

---

## 🤖 Knowza AI

> Knowza AI is a **separate product** from the LMS. No new AI features shipped in this release. This cycle was focused entirely on LMS gamification (season leagues), test complaints, and TanStack Query migration. The Knowza AI engine ran stable in the background with no changes to the `KnowzaAIEngine`, intent router, or LLM gateway.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | 16 |
| Backend Commits | 9 |
| Total Files Changed | 137 |
| Lines Added | 11,118 |
| Lines Removed | 4,499 |
| New Database Tables/Models | 2 (`TestComplaint`, `LeagueGroup`/cohort tables) |
| Core Docs Pages Added | 3 (AdminDocs, StudentDocs, TeacherDocs) |
| Active Development Days | 7 |
