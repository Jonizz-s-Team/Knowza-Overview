# Knowza Feature Overview

This document provides a high-level summary of the features implemented within the Knowza educational platform.

---

## 1. Public Experience & Marketing
Knowza is designed as a premium SaaS product with a public-facing website to introduce the system to prospective schools, centers, and students.
*   **Main Navigation:** Home, About, Pricing, FAQ, Contact, Updates (News), and Docs.
*   **Legal Transparency:** Fully integrated pages for Privacy Policy, Terms of Service, Cookie Policy, Refund Policy, and Disclaimer.
*   **Localization:** Complete language options for English (EN), Russian (RU), and Uzbek (UZ) using localized JSON translation files.
*   **UX Design:** Responsive, dark-themed, glassmorphic layouts with smooth entry and hover animations.

---

## 2. Multi-Role Authentication & Identity
Focal access points are protected by robust authorization policies, automatically routing users to their designated panels.
*   **Sign-in Options:** Username/Email + password, unique Knowza ID, or display ID login routes.
*   **Session Guarding:** Automatic relogin UI triggers upon JWT session expiry, preventing user state loss.
*   **Account Controls:** Email verification flows, password resets, and Appwrite Google Sign-In helper pathways.

---

## 3. Dedicated Role Workspaces

### Head Admin (Platform Owner)
*   Manage institutional tenant registrations and local administrators.
*   Review global platform metrics and business analytics.
*   Manage B2B Admin Tariffs and accept/reject change requests.
*   Track B2C Premium Purchases and transaction history.
*   Moderate support tickets, public contact messages, and site-wide news.
*   Adjust student currencies (stars, premium access status) manually when requested.

### Admin (Institution Owner)
*   Manage local accounts for Teachers, Sub-Admins, and Students.
*   Configure classes, classrooms, subjects, and schedule slots.
*   Assign teachers to specific groups and subjects.
*   Monitor student grades, exam attempts, and system activity logs.
*   View B2B tariff limits (student and teacher quotas) in real-time.
*   Perform high-speed batch actions via bulk CSV user importing.

### Sub-Admin (Branch Manager)
*   Manage assigned teachers and students within specific branch scopes.
*   Oversee class lists, schedules, and subject allocations.
*   Review branch-level performance statistics.

### Teacher (Content Creator & Educator)
*   Design custom tests and questions (multiple-choice, short-answer, true/false) with KaTeX math rendering and image uploads.
*   Monitor assigned class performance trends and individual student test history.
*   Publish homework assignments with file attachments.
*   Generate mock tests or lesson outlines using AI assistant integrations.

### Student (Learner)
*   Browse allowed test listings, module topics, and homework calendars.
*   Take exams within server-controlled test sessions.
*   Track academic growth, streaks, levels (XP), and virtual stars.
*   Interact with peers via profile ratings, likes, and pinned gifts.
*   Acquire premium access or custom profile colors using star balances.
*   Query the AI Tutor to review mistake history or generate personal practice guides.

---

## 4. Server-Authoritative Test Session Engine
*   **Server control:** Start times, session duration, and answer calculations are managed entirely on the backend database.
*   **Real-time sync:** Answers are progressively saved during the exam session, ensuring data recovery if a student refreshes their browser.
*   **Anti-Cheat (Knowza Sentinel):** Tracks browser tab changes and window blur events. Accumulating violations automatically flags the session, aborting the attempt and lodging a 0-score record on the database.

---

## 5. Academic Operations & LMS
*   **Scheduling Calendar:** Daily lesson grid matching rooms, subjects, and teachers to prevent double-bookings.
*   **Classrooms & Groups:** Standardized groups and subjects to keep students organized.
*   **Homework Workspace:** Teachers upload assignments, write instructions, and link reference files; students download them and track completed tasks.

---

## 6. Gamification & Retention Economy
*   **XP Progression:** Points awarded from tests increase student levels and determine weekly League brackets.
*   **Streak Tracker:** Tracks daily learning consistency.
*   **Stars Currency:** Earned via high test performance or awarded by admins. Students spend stars on profile decorations (likes, custom labels, premium tags).
*   **Weekly Leagues:** Encourages peer competition with automated weekly promotion and demotion calculations.

---

## 7. SaaS Billing & Monetization
*   **B2B Licensing:** Admins request tariff upgrades based on school needs. Tiers control user limits, subject capacities, and AI quotas.
*   **B2C Micro-Transactions:** Students purchase star packs to unlock specialized premium tests or customized profiles.

---

## 8. AI Assistance Layer
*   **AI Test Gen:** Creates fully structured exams from teacher outlines or uploaded files.
*   **AI Coach:** Explains incorrect answers, provides reference tutorials, and compiles study schedules.
*   **AI Analytics:** Groups students by strength and highlights academic risks.
