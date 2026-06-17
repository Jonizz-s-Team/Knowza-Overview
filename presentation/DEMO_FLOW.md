# 🎬 Knowza Live Demo Presentation Script

This document details the optimal step-by-step walkthrough to present the Knowza platform's capabilities during a live demonstration or exam defense.

---

## ⏱ Demo Preparation Checklist

1.  **Run Services:** Ensure the Django backend (`python manage.py runserver`) and Vite frontend (`npm run dev`) are running locally.
2.  **Open API Docs:** Keep the configured API documentation route open in a browser tab to demonstrate back-end integrity.
3.  **Use Sanitized Demo Accounts:** Arrange browser tabs to show different user roles with demo-only credentials and non-private account data.

---

## 📽 Walkthrough Steps

### Phase 1: Landing Page & Positioning (2 Mins)
*   **Action:** Open the configured frontend URL. Scroll through the landing page.
*   **Narrative:** *"This is the public experience of Knowza. We present ourselves as a modern, unified SaaS platform. Unlike a simple quiz site, we handle institutional management, billing, scheduling, and analytics under one ecosystem."*
*   **Showcase:** Point out the translation picker (UZ, RU, EN) and show the beautiful micro-animations and typography.

### Phase 2: Admin Dashboard & School Setup (3 Mins)
*   **Action:** Log in as an Institution Admin using a sanitized demo account.
*   **Narrative:** *"The Admin represents the school owner. Here, they manage teachers, sub-admins, and students. They can perform high-speed batch actions via bulk CSV user importing."*
*   **Showcase:** Show the student list table, showing online status indicators (`is_online`) and filtering utilities.

### Phase 3: Schedule & Classrooms Layout (3 Mins)
*   **Action:** Go to the Schedule and Classrooms tabs in the Admin Panel.
*   **Narrative:** *"Admin configures the physical and digital infrastructure of the school. They define classrooms, subject fields, and map out the weekly Schedule Slots linking times, subjects, rooms, and teachers."*
*   **Showcase:** Point out the `My Limits` resource indicator, displaying real-time student/teacher quota usages against active tariff boundaries.

### Phase 4: Teacher & Test Builder (3 Mins)
*   **Action:** Switch to a Teacher demo account.
*   **Narrative:** *"Teachers log in to manage learning content. They build tests, configure question cards (supporting image uploads and formulas), publish homework files, and review class performance metrics."*
*   **Showcase:** Use the Test Builder to create a draft, modify questions, and show the KaTeX math formula rendering capabilities.

### Phase 5: Student Testing & Anti-Cheat (5 Mins)
*   **Action:** Switch to a Student demo account.
    1.  Start a test session.
    2.  Show the countdown timer syncing.
    3.  **Simulate Cheating:** Alt-Tab out of the browser or click another window. Show the warning toast popup: *"Warning: tab switching detected."*
    4.  Repeat the tab switches until the warning threshold is reached. Show how the session is forced-closed and banned.
*   **Narrative:** *"When a student starts an exam, a server session is created. If the student attempts to cheat by leaving the page, Knowza Sentinel catches the window blur events in real-time. Exceeding thresholds triggers an automatic backend ban, score invalidation, and logs a TestViolation record."*
*   **Showcase:** Show the results screen (0 points due to cheating) or a successfully completed test displaying XP and Stars distribution.

### Phase 6: Gamification Profile (2 Mins)
*   **Action:** Go to the Student Profile page.
*   **Narrative:** *"To encourage students, we leverage gamification. Scoring high yields stars and XP. Stars can be used to customize profiles (e.g., buying badges or custom theme colors), while XP ranks them in Weekly Leagues."*
*   **Showcase:** Show the streak tracker and user ratings dashboard.

### Phase 7: Tech & DB Audit Proof (2 Mins)
*   **Action:** Go to the configured Swagger/OpenAPI documentation route.
*   **Narrative:** *"Under the hood, all inputs are validated at the database level. Permissions, tenant isolation, and analytics events are strictly audited. Query execution is optimized using select_related to resolve N+1 bottlenecks."*
*   **Showcase:** Perform a quick GET request to `/api/users/me/` from Swagger UI to demonstrate API responsiveness.
