# 🎬 Knowza Live Demo Presentation Script

This document details the optimal step-by-step walkthrough to present the Knowza platform's capabilities during a live demonstration or exam defense.

---

## ⏱ Demo Preparation Checklist

1.  **Run Services:** Ensure the Django backend (`python manage.py runserver`) and Vite frontend (`npm run dev`) are running locally.
2.  **Open API Docs:** Keep `http://localhost:8000/swagger/` open in a browser tab to demonstrate back-end integrity.
3.  **Use Split View:** Arrange browser tabs to show the different user roles (e.g., Chrome Guest window for Student, main window for Admin/Teacher).

---

## 📽 Walkthrough Steps

### Phase 1: Landing Page & Positioning (2 Mins)
*   **Action:** Show `http://localhost:5173`. Scroll through the landing page.
*   **Narrative:** *"This is the public experience of Knowza. We present ourselves as a modern, unified SaaS platform. Unlike a simple quiz site, we handle institutional management, billing, scheduling, and analytics under one ecosystem."*
*   **Showcase:** Point out the translation picker (UZ, RU, EN) and show the beautiful micro-animations and typography.

### Phase 2: Head Admin Control Panel (2 Mins)
*   **Action:** Log in as Head Admin (`/login` with head admin credentials). Go to the dashboard.
*   **Narrative:** *"The system begins at the top tier. The Head Admin manages global metrics, reviews platform-wide support tickets, approves admin tariff requests, and sets configurations like currency pricing or default league divisions."*
*   **Showcase:** Point out the Business Analytics graphs and the list of active institutional tenants.

### Phase 3: Admin & Operations Dashboard (3 Mins)
*   **Action:** Log in as an Institution Admin (`/knowza/test-platform/admin`).
*   **Narrative:** *"The Admin represents the school owner. Here, they oversee the local tenant. They can manage classrooms, configure schedule slots, monitor teachers, and add students in bulk using CSV files."*
*   **Showcase:** Show the `My Limits` indicator showing current student and teacher quotas based on the school's premium tariff tier.

### Phase 4: Teacher & Test Builder (3 Mins)
*   **Action:** Switch to a Teacher account (`/knowza/test-platform/teacher`).
*   **Narrative:** *"The Teacher manages learning content. They build tests, add questions (supporting formulas and images), assign homework files, and review class performance trends."*
*   **Showcase:** Use the Test Builder to create a draft, modify questions, and show the KaTeX math formula rendering capabilities.

### Phase 5: Student Testing & Anti-Cheat (5 Mins)
*   **Action:** Switch to a Student account (`/knowza/test-platform/student`).
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
*   **Action:** Go to the Swagger documentation at `http://localhost:8000/swagger/`.
*   **Narrative:** *"Under the hood, all inputs are validated at the database level. Permissions, tenant isolation, and analytics events are strictly audited. Query execution is optimized using select_related to resolve N+1 bottlenecks."*
*   **Showcase:** Perform a quick GET request to `/api/users/me/` from Swagger UI to demonstrate API responsiveness.
