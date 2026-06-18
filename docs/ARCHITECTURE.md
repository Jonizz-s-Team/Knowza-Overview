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

---

## 6. Formal Mathematical & Algorithmic Data Exchange Model

For academic and formal system audits, the data exchange pipeline between the client SPA ($C$) and backend services ($S$) can be modeled as a **Server-Authoritative Finite State Machine (FSM)** with monotonic integrity checks and strict relational database partitioning.

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

---

## 6. Formal Mathematical & Algorithmic Data Exchange Model

For academic and formal system audits, the data exchange pipeline between the client SPA ($C$) and backend services ($S$) can be modeled as a **Server-Authoritative Finite State Machine (FSM)** with monotonic integrity checks and strict relational database partitioning.

### 6.1 State Synchronization & Temporal Monotonicity
Let the state of an active testing session at time step $t$ be defined as a tuple:
$$\mathcal{S}_t = \langle \mathcal{Q}, \mathcal{A}_t, \mathcal{T}_{expire}, \mathcal{V}_t \rangle$$
Where:
*   $\mathcal{Q}$ is the immutable question space.
*   $\mathcal{A}_t = \{ (q_i, a_i) \mid q_i \in \mathcal{Q} \}$ is the set of registered student answers synchronized at step $t$.
*   $\mathcal{T}_{expire} \in \mathbb{R}^+$ is the absolute UTC epoch boundary after which state changes are rejected.
*   $\mathcal{V}_t \in \mathbb{N}$ is the monotonic count of integrity violations.

The client state update function $\Phi$ is client-initiated but server-evaluated. Given a client mutation vector $\delta_t = \langle q_k, a'_k \rangle$ sent via `PUT /api/v1/exams/sessions/sync` at epoch $\tau$, the server applies the transition function:
$$\Gamma(\mathcal{S}_t, \delta_t, \tau) \to \mathcal{S}_{t+1}$$

Defined as:
$$\mathcal{S}_{t+1} = \begin{cases}
\text{TerminalState}(\mathcal{S}_{ban}), & \text{if } \mathcal{V}_t \ge \theta_{\text{max}} \text{ or } \tau > \mathcal{T}_{expire} \\
\langle \mathcal{Q}, \mathcal{A}_t \setminus \{(q_k, a_k)\} \cup \{(q_k, a'_k)\}, \mathcal{T}_{expire}, \mathcal{V}_t \rangle, & \text{otherwise}
\end{cases}$$

This ensures that the client cannot write state updates after $\mathcal{T}_{expire}$ or once the integrity violation limit $\theta_{\text{max}}$ is exceeded.

### 6.2 Relational Tenant Partitioning Predicate
Database isolation is enforced at the database projection layer. Let $U$ be the authenticated user context, and let $D$ be a relational tuple in any database table. The security guard verifies accessibility using a boolean validation predicate $\Psi(U, D)$:
$$\Psi(U, D) := \big( \text{Org}(U) = \text{Org}(D) \big) \land \big( \text{Role}(U) \succeq \text{RoleReq}(D) \big)$$

Where:
*   $\text{Org}(x)$ maps entity $x$ to its unique SaaS tenant identifier.
*   $\succeq$ represents a partial ordering over the user role hierarchy:
$$\text{Student} \prec \text{Teacher} \prec \text{BranchManager} \prec \text{Admin}$$

If $\Psi(U, D) = 0$, the server returns a HTTP $403 \text{ Forbidden}$ payload and drops the database socket connection to prevent blind-injection profiling.

### 6.3 Real-time Telemetry Processing (Knowza Sentinel)
The anti-cheat module models user focus telemetry as a discrete time series of focus state transitions $E = \{e_1, e_2, \dots, e_n\}$, where each event $e_i = \langle \Delta t_i, \text{type}_i \rangle$ indicates a transition out of the active browser viewport:
$$\text{type}_i \in \{ \text{VisibilityHidden}, \text{WindowBlur} \}$$

A continuous audit algorithm aggregates this sequence on the backend. When a client reports an event $e_k$ via `POST /api/v1/exams/violations/report`, the server computes the update:
$$\mathcal{V}_{t+1} = \mathcal{V}_t + \mathbb{I}\left(\text{type}_k \in \{\text{VisibilityHidden}, \text{WindowBlur}\} \land \Delta t_k > \epsilon\right)$$

Where $\mathbb{I}$ is the indicator function, and $\epsilon$ is a configuration-defined tolerance threshold (e.g., $150\text{ ms}$) to filter out OS-level render lags and browser frame shifts.

