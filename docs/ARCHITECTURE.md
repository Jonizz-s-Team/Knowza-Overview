# Knowza — Architecture Overview

> **This document has been split into two separate architecture documents:**
>
> - 🏫 **[`LMS_ARCHITECTURE.md`](LMS_ARCHITECTURE.md)** — Institutional platform: multi-tenant model, anti-cheat, session system, gamification, SaaS
> - 🤖 **[`AI_ARCHITECTURE.md`](AI_ARCHITECTURE.md)** — AI engine: LLM gateway, intent routing, RAG, memory, streaming, KnowzaShield

Please refer to the documents above for the full technical blueprints.

---

## Quick Overview

Knowza runs as a **unified ecosystem** with two products sharing the same backend:

```text
  Browser
    │
    ▼
  React/Vite SPA  (Knowza LMS UI + Knowza AI Chat UI)
    │
    ▼
  Django REST API Backend
    ├── LMS Engine (tests, schedules, users, anti-cheat, gamification)
    └── AI Engine  (intent routing, LLM gateway, RAG, memory, streaming)
    │
    ▼
  PostgreSQL · Redis · Media Storage
```

For detailed breakdowns of each layer, see the dedicated architecture documents linked above.
