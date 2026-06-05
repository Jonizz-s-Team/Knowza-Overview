# 🚀 Update v1.0.0 — Core Platform Foundation

**Release Date:** May 10, 2026

## 🎯 Release Goal
Establish the primary technical foundation for the educational workspace. This milestone introduces multi-role access control, basic quiz editing capabilities, and standard JWT-based session security.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)
*   **Role Dashboards:** Created dedicated workspaces and menu navigation structures for Admins, Teachers, and Students.
*   **Test Management UI:** Built a basic dashboard allowing teachers to list tests, create new test details, and edit standard questions.
*   **Authentication Portal:** Implemented standard login and registration pages using centralized JWT handling.

### Backend (`Django-Test-App-Backend`)
*   **Custom User Model:** Developed a customized User model extending Django's `AbstractUser` to track user roles (`head_admin`, `admin`, `teacher`, `student`).
*   **Multi-tenant Foundation:** Implemented `Organization` filters to restrict query outcomes and verify school privacy.
*   **Assessment Models:** Defined standard models for `Test`, `Question` (multiple-choice), and `TestAttempt` tracking.
