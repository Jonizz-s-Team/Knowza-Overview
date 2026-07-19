# ✨ Knowza LMS — Feature Inventory

Knowza LMS is an institutional SaaS platform for schools, learning centers, and private tutors. It provides a complete academic management system, a server-authoritative assessment engine, and a gamified engagement loop — all within a multi-tenant, role-based architecture.

---

## 👥 Multi-Role Workspace System

Knowza LMS provides separate, purpose-built dashboards for each role:

| Role | Workspace Focus |
|---|---|
| **Head Admin** | Platform-wide superuser access — all institutions, system health |
| **Admin** | Full school/center management — users, billing, analytics, reports |
| **Branch Admin** | Branch-level management — teachers, students within one branch |
| **Teacher** | Test creation, homework publishing, student analytics |
| **Student** | Schedule, test-taking, homework, gamification, profile |
| **Seller** | Premium sales commission tracking |
| **Content Manager** | Platform-wide content management |

---

## 🏫 Academic Management System

### Organization Setup
- Multi-tenant school registration with unique organization scoping
- Branch management (multiple locations per admin)
- Teacher and student user creation (individual or bulk Excel import)
- Sub-admin (Branch Admin) delegation with scoped permissions

### Classroom & Group Management
- Classroom creation and assignment
- Student group/class organization (e.g., `5-A`, `IELTS-Advanced`)
- Subject management with category support
- Direction system (student learning track tagging)

### Lesson Scheduling
- Weekly/daily schedule grid — links classrooms, subjects, teachers, and time slots
- Teacher-to-group assignment (`TeacherClassAssignment`)
- CalendarJS-based homework and schedule view for students

### Academic Operations
- Homework publishing with optional file attachments (`HomeworkAttachment`)
- Student attendance tracking
- Grade monitoring and activity reporting
- Academic analytics per class, group, teacher

---

## 📝 Assessment Engine

### Test Builder (Teacher)
- Custom quiz/exam creation with configurable settings
- Multiple question types (text, image-based)
- Mathematical notation support
- Question pool configuration
- Optional star-pricing for premium tests
- Draft protection — tests save automatically

### Test Session (Student)
- Server-authoritative sessions with absolute expiry — not browser-side timers
- Real-time answer syncing via PATCH endpoints
- Automatic session recovery on page refresh
- Daily test limit system (10 free / 100 premium per day)

### Knowza Sentinel — Anti-Cheat System
- Browser focus monitoring (tab switching, window blur, visibility changes)
- Real-time `TestViolation` record creation per event
- Configurable tolerance thresholds to reduce false positives
- Automatic `TestBan` on threshold exceeded → session terminated, score set to 0
- Full violation audit log per student per exam

### Exam Results & Analytics
- Per-student score breakdown
- Teacher-level aggregate analytics (average score across all tests)
- Admin-level institution-wide performance dashboard
- Test complaint system — students can flag contested questions

---

## 🏆 Gamification & Engagement

### XP & Leveling
- XP awarded on each test completion
- Cumulative XP drives level progression
- Level displayed on student profile

### Daily Streaks
- Streak counter increments each day a student completes at least one test
- Streak reset if a day is missed (freeze items available to prevent accidental reset)
- Milestone rewards at: 7 days (50★), 30 days (150★), 90 days (300★), 180 days (600★), 365 days (1500★)

### Weekly Leagues (Duolingo-style)
- Season-based weekly leagues with tier divisions
- XP-based leaderboard within each league
- Top performers promoted to higher tiers at season end
- Peer-to-peer competition to drive engagement and retention

### Stars Economy (Virtual Currency)
- Stars earned from exams, streak milestones, gifts
- Spent on: profile customization, emoji packs, profile status, premium test unlocks
- Full refund and transaction audit trail

---

## 💎 Premium Profile System

- Premium status (time-based: week/month/year or performance-based)
- Profile photo (including GIF support)
- Custom status message
- Premium emoji display around avatar
- Background gradient customization
- Hide/show premium visibility controls
- Pinned gift likes display

---

## 💳 SaaS & Billing

### B2B Institution Subscriptions
- 5-tier subscription model scaling with student/teacher/branch counts
- Automated tariff expiry — blocks all institution sub-users on expiry
- Dynamic B2B invoice generation with JWT-secured PDF links
- Free/trial tariff tracking (`admin_free_tariff_used`)

### Admin Premium
- Admin-level premium subscription (week/month/year)
- Manual approval workflow with granted/expiry date tracking
- Cost tracking per subscription period

---

## 🌍 Platform & UX

### Localization
- Full 3-language support: 🇺🇸 English · 🇷🇺 Russian · 🇺🇿 Uzbek
- 226+ translation files across all UI components
- Language selector with preference persistence

### Design System
- Dark-mode optimized interface
- Responsive across desktop and mobile
- Smooth page transitions and micro-animations (GSAP / Framer Motion)
- Apple-inspired Dynamic Island notification system in student header

### Public Platform
- Marketing website with pricing pages
- FAQ and support resources
- Contact and inquiry channels
- News and platform updates
