# 🎓 Knowza — Institutional EdTech & Assessment Ecosystem

[![Platform Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/backend-Django%205%20%7C%20DRF-blue.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vite%208-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

Knowza is a multi-role educational SaaS platform designed for learning centers, schools, teachers, and students. Unlike simple test-taking apps, Knowza is an **educational operating system** that integrates secure server-authoritative testing, school administration, academic scheduling, performance analytics, gamified student engagement, monetization tiers, and AI-assisted learning tools into a single ecosystem.

This repository serves as the central hub and high-level overview of the entire Knowza ecosystem.

---

## 🏛 Ecosystem Repositories

The platform is split into two specialized repositories:

1.  **Frontend SPA**: [Test-App](https://github.com/Jonizz14/Test-App)
    *   *Stack:* React 19, Vite 8, React Router 7, TanStack Query, Tailwind CSS 4, Ant Design & Material-UI, Framer Motion & GSAP, ECharts.
2.  **Backend REST API**: [Django-Test-App-Backend](https://github.com/Jonizz14/Django-Test-App-Backend)
    *   *Stack:* Django 5, Django REST Framework, SimpleJWT, PostgreSQL/SQLite, Redis-compatible Cache, Swagger/ReDoc.

---

## 🛰 Core Architecture

```text
       ┌────────────────────────┐
       │   Browser / React SPA  │
       └───────────┬────────────┘
                   │
                   │ REST API (JSON / JWT Auth)
                   ▼
       ┌────────────────────────┐
       │ Django REST Framework  │ (Tenant-based scoping & role logic)
       └───────────┬────────────┘
                   │
                   ├───────────────────────┐
                   ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐
         │ PostgreSQL DB    │    │ Redis-compatible │
         │ & Media Storage  │    │ Caching / Worker │
         └──────────────────┘    └──────────────────┘
```

The system isolates permissions and data queries at the database query level (tenant and role scoping) to ensure high security and isolation between different learning centers (tenants).

---

## ⚡ Main Capabilities

### 🛡 1. Test Integrity & Anti-Cheat (Knowza Sentinel)
*   **Server-Authoritative Sessions:** Test sessions are initialized and managed on the server. Time limits, question order, score calculations, and daily limits are strictly enforced backend-side.
*   **Active Violation Detection:** Tracks focus loss, tab switching, and abnormal input speed in real-time.
*   **Progressive Bans:** Suspicious behaviors record `TestViolation` logs. Exceeding thresholds automatically triggers a `TestBan`, immediately invalidating active test sessions with a score of 0.

### 🎮 2. Gamification & Retention
*   **Streaks & XP:** Rewards consistent daily learning.
*   **Star Economy:** Virtual stars earned from scoring high on tests can be used to unlock premium courses, custom profile designs, or participate in special challenges.
*   **Leagues & Rankings:** Weekly promotions and competitive divisions keep students actively engaged.

### 💼 3. SaaS Monetization (B2B & B2C)
*   **B2B Admin Tariffs:** Learning center owners subscribe to tiers that enforce limits on students, teachers, classrooms, and subjects.
*   **B2C Student Premium:** In-app purchases for premium features, profile customizations (likes, gifts, status), and AI helper usage.

### 🤖 4. AI Helper Layer
*   **AI Test Builder:** Helps teachers generate questions automatically from topics, files, or custom prompts.
*   **AI Student Coach:** Analyzes student results, explains mistakes, suggests review modules, and acts as a personal tutor.
*   **Operational Analytics:** Provides admins and teachers with student grouping suggestions and risk reports.

---

## 📈 Recent System Evolution (Changelog)

Below is the changelog documenting recent features, refactorings, and cleanup tasks implemented across the ecosystem:

### 🎨 Frontend (`Test-App`)

*   **[ADDED]** **Session Expiry Handling:** Automatic relogin UI and state persistence when JWT tokens expire.
*   **[ADDED]** **Tariff Limit UI:** Restricts dashboard navigation for free tier users and visualizes current resource usage limits.
*   **[ADDED]** **Schedule & Classroom Forms:** Integrated new UI components for managing schedule slots, classrooms, and teacher assignments.
*   **[ADDED]** **Reveal Animations:** Standardized global entry animations across all pages using a custom reveal utility.
*   **[DELETED]** **Onboarding Tour:** Removed legacy onboarding tour components to simplify layout rendering.
*   **[DELETED]** **Legacy Utilities:** Cleaned up unused `ScrollToTop` components, redundant size props, and old server test context documentation.
*   **[REFACTORED]** **Toast Notification System:** Replaced local page-level alerts with a unified, slick toast notification system.
*   **[REFACTORED]** **Rebranding:** Renamed the application name across all translation files (`uz`, `ru`, `en`) to **Knowza**.

### ⚙️ Backend (`Django-Test-App-Backend`)

*   **[ADDED]** **Profile Endpoint (`/api/users/me`):** Secure endpoint for authenticated profile retrieval and inline updates.
*   **[ADDED]** **Bulk Import Action:** Created high-speed bulk import endpoint for classrooms with tariff limit enforcement.
*   **[ADDED]** **Threaded Email System:** Implemented chunked email distribution queue for user registration, support tickets, and tariff updates.
*   **[ADDED]** **Activity status:** Introduced an `is_online` status attribute to track active users.
*   **[DELETED]** **Quota Restrictions:** Lifted hard limitations on subjects, rooms, and groups while adjusting SaaS prices.
*   **[REFACTORED]** **SQL Optimization:** Fixed N+1 query bottlenecks in analytics and modules using `select_related` and optimized queryset prefetching.
*   **[REFACTORED]** **Tenant Scoping:** Enhanced security isolation filters, hidden student profiles from admin searches, and masked sensitive identifiers.

---

## 🚀 Quick Start Guide

To run the full ecosystem locally:

### 1. Backend Setup
```bash
git clone https://github.com/Jonizz14/Django-Test-App-Backend.git
cd Django-Test-App-Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
The backend API documentation will be available at `http://localhost:8000/swagger/` or `http://localhost:8000/redoc/`.

### 2. Frontend Setup
```bash
git clone https://github.com/Jonizz14/Test-App.git
cd Test-App
npm install
npm run dev
```
Open `http://localhost:5173` to access the application.

---

## 🗺 Roadmap

*   [ ] **Mobile Application:** Native React Native/Flutter client for students and parents.
*   [ ] **Parent Dashboard:** Interface to track payments, attendance, test scores, and homework progress.
*   [ ] **Live Proctoring:** Secure video, microphone, and browser-lock integrations for official tests.
*   [ ] **Built-in Payment Gateway:** Direct billing for tariff purchases, premium stars, and course marketplace.

---

© 2026 Knowza Educational Platform. All rights reserved.
