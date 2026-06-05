# Knowza Public Architecture Overview

This document provides a public-safe architectural blueprint of the Knowza Educational Platform, outlining the frontend and backend systems, data layers, and overall security isolation patterns.

---

## 1. High-Level Blueprint

```text
  ┌────────────────────────────────────────────────────────┐
  │                        Browser                         │
  └───────────────────────────┬────────────────────────────┘
                              │ HTTP / JSON / JWT
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                    React/Vite SPA                      │ (Client Side)
  └───────────────────────────┬────────────────────────────┘
                              │ REST API
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 Django REST API Backend                │ (Server Side)
  │                                                        │
  │  * Authentication & Custom User Model                  │
  │  * Tenant Scoping Selector Layers                      │
  │  * Server-Side Test Session Lifecycle                  │
  │  * Anti-Cheat Sentinel Logs & Bans                     │
  │  * Automated Threaded Email Engine                     │
  │  * AI Integration Endpoints & Limit Controls           │
  └───────────────────────────┬────────────────────────────┘
                              │ ORM Queries
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │       PostgreSQL DB / Cache Cache / Media Storage      │ (Data Layer)
  └────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Layer (React SPA)
The client application is built as a single-page React 19 web app compiled with Vite.

### Core Modules
*   **State & Sync:** Employs TanStack React Query to synchronise server state with local memory, managing updates, caching, and fetch retries.
*   **Routing:** React Router governs role-specific dashboard views (`/knowza/test-platform/admin/*`, `/teacher/*`, `/student/*`), checking permissions dynamically.
*   **Themes & Styling:** Standardised using Tailwind CSS 4, styled layouts (MUI, Radix, Ant Design), and sleek entry animations.
*   **Localisation:** Manages translations across three languages (`en`, `ru`, `uz`) using `i18next`.

---

## 3. Backend Layer (Django REST Framework)
The server coordinates the business logic, tenant separations, and database records.

### Core Architecture
*   **Identity Models:** Custom User model extending standard Django `AbstractUser`, tracking roles, organizations, and user online status.
*   **Tenant Filtering:** Ensures security by filtering queryset outputs. Custom serializers and selectors verify that an institution admin cannot fetch, alter, or search users outside their own school ID scope.
*   **Optimization Layer:** Eliminates N+1 database bottlenecks inside serializers using pre-optimized `select_related` and `prefetch_related` queries.
*   **Queue Operations:** Leverages threaded execution queues to handle bulk email updates, registration codes, support notifications, and tariff requests.

---

## 4. Integrity Systems (Sessions & Anti-Cheat)
To maintain academic credibility, the testing module runs under a backend-authoritative architecture.
*   **TestSession:** When a student begins a test, the server writes a `TestSession` containing absolute duration constraints and daily quotas.
*   **Answer Syncing:** Standard PATCH endpoints sync answers continuously. If a browser crashes, session data is restored directly from the server.
*   **Knowza Sentinel:** Monitors window focus changes. Browser warnings notify students, and repeated tab shifts register `TestViolation` database records, triggering an automatic `TestBan` that terminates the session with a 0-score.

---

## 5. Monetization & SaaS Framework
*   **B2B Quota Controls:** An `AdminTariff` enforces limits on local users, classrooms, and subjects.
*   **B2C Micro-Transactions:** A dynamic star-ledger ledger logs student premium updates, star purchases, and course unlocks, with built-in refund audits.
