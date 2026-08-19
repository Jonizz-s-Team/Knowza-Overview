# 🚀 Knowza Release Updates Index

Welcome to the central timeline of Knowza's development and release history. This directory tracks the architectural evolution of the platform across **7+ months** of continuous development — from a simple test-taking prototype into a multi-tenant institutional SaaS EdTech ecosystem with an embedded AI learning engine.

> 🤖 **Looking for just the AI history?** See [`AI_CHANGELOG.md`](AI_CHANGELOG.md) — a dedicated timeline of every Knowza AI milestone from the first Gemini integration to the full multi-provider engine.

---

## 📅 Release Timeline

| Version | Period | Title | Key Milestones | 🤖 Knowza AI |
| --- | --- | --- | --- | --- |
| **[v3.0.0](./update_v3.0.0.md)** | Aug 19, 2026 | Knowza 3.0: Full-Spectrum CEFR AI Foundation & Adaptive IELTS Suite | Complete A0 to Strong B2 mastery engine (90% threshold), IELTS Adaptive Reading & Writing, Socratic Coach, Mock Exam Simulator, full 20-module frontend ecosystem. | 🚀 **Major (KNOWZA 3.0):** Full English Foundation, IELTS Adaptive Reading/Writing, Mock Simulator, Vector semantic caching, 20 dedicated AI pages |
| **[v2.9.0](./update_v2.9.0.md)** | Jul 20–27, 2026 | Deterministic Hybrid Study Planner, Zero-Token Free Tier & Sub-Second Groq Gateway | 7-module Python study plan engine, 128 tests passing, tier badging & visual phase progress bars in frontend, Gap-Based diagnostic allocation. | ⚡ **Major:** 0-Token Free Tier, 80%+ Pro token reduction, Groq sub-second router, 10 daily AI calls for Free / 150 for Pro |
| **[v2.8.5](./update_v2.8.5.md)** | Jul 1–19, 2026 | B2C Payment History, Socratic PDF/Article Exports & Multi-Provider AI Load Balancer | Dynamic Uzbek electronic receipts & payment history table in profile, glassmorphic pricing layout, Table of Contents, contextual editing & PDF export in Research. | Multi-Provider key rotation gateway, academic sandbox standards (IELTS, SAT, MS), strict backend PRO gating |
| **[v2.8.0](./update_v2.8.0.md)** | Jun 21–30, 2026 | Branch Admin Migration, Profile Extension, Billing Upgrades & Legal Documentation Overhaul | Centralized rename of Sub-Admin to Branch Admin, extended Student/Teacher profiles, Docker volume and media storage setups, dynamic B2B invoice generation with JWT, role-based legal privacy/terms updates. | Full AI personalization fields in serializers, tariff-gated AI access |
| **[v2.7.5](./update_v2.7.5.md)** | Jun 12–19, 2026 | Full i18n Overhaul, Profile Redesign & Email Infrastructure | Platform-wide multi-language system (226 files), CommandPalette search rebuild, activity log translation, SMTP diagnostics, analytics fixes, tenant scoping. | AI UI consolidated into dedicated chat; backend AI engine unaffected |
| **[v2.7.0](./update_v2.7.0.md)** | Jun 6–12, 2026 | Gamified Leagues, Test Complaints & Calendar Migration | Duolingo-style season leagues, test complaints system, homework calendar migration to CalendarJS, draft protection, TanStack Query v5 migration, security scoping. | — |
| **[v2.6.0](./update_v2.6.0.md)** | Jun 5, 2026 | Sub-Admin Scope Isolation & Teacher Tests | Full branch isolation, classroom reassignment, teacher test CRUD, Monday calendar, direction system. | — |
| **[v2.5.0](./update_v2.5.0.md)** | Jun 3–5, 2026 | Live Refresh & Security Refinements | Panel live refresh, home page expansion, identifier masking, codebase cleanup. | — |
| **[v2.4.0](./update_v2.4.0.md)** | Jun 1–2, 2026 | Schedule System & Pricing Overhaul | ScheduleForm, ClassroomForm, unlimited resources, `/me/` profile endpoint. | — |
| **[v2.3.0](./update_v2.3.0.md)** | May 31, 2026 | Email Automation & Global Rebranding | 7 automated email types, threaded email queues, Knowza name finalization. | — |
| **[v2.2.0](./update_v2.2.0.md)** | May 28–30, 2026 | SaaS Tariff Engine & Performance | 5-tier subscription plans, N+1 query fixes, reveal animations, session expiry. | — |
| **[v2.1.0](./update_v2.1.0.md)** | May 23–27, 2026 | LMS & Academic Operations | Homework, schedules, classrooms, Docker setup, async email system. | — |
| **[v2.0.0](./update_v2.0.0.md)** | Apr 1–27, 2026 | Knowza ID & Enterprise Security | Knowza ID auth, Sentinel anti-cheat, KnowzaShield AI firewall, PitchDeck. | **🔴 Major:** KnowzaShield firewall, Groq multi-provider gateway, structured JSON output, AI usage badge & quota UI |
| **[v1.4.0](./update_v1.4.0.md)** | Mar 1–31, 2026 | Rebranding, Anti-Cheat v2 & Tariffs | Examify → Knowza, progressive bans, XP system, Tailwind integration. | — |
| **[v1.3.0](./update_v1.3.0.md)** | Feb 1–28, 2026 | Architecture Rebuild & Gamification | JS structure correction & test cleanup, Docker, League rankings, streaks, Ant Design v5. | — |
| **[v1.2.0](./update_v1.2.0.md)** | Jan 11–31, 2026 | Dynamic Island, AI Chat & Onboarding | Apple-inspired header, Gemini AI chat, brutalist design, 3D assets. | **⭐ First AI:** Google Gemini chat integration, Notes sidebar, client-side AI pipeline |
| **[v1.1.0](./update_v1.1.0.md)** | Dec 16, 2025 – Jan 10, 2026 | Ant Design Migration & Redesign | Full antd migration, dark mode, home page, contact page, animations. | — |
| **[v1.0.0](./update_v1.0.0.md)** | Nov 22 – Dec 15, 2025 | Project Genesis & Core Platform | Initial app, Stars economy, gift system, import/export, anti-cheat v1. | — |

---

## 📈 Development Summary

| Metric | Total |
| --- | --- |
| **Development Span** | 7+ months (Nov 2025 – Jun 2026) |
| **Frontend Commits** | 500+ |
| **Backend Commits** | 150+ |
| **Major Versions** | 16 releases |
| **Active Development Days** | 130+ |

---

## 🗺 Navigating Updates

Each markdown file inside this directory outlines:
1.  **Release Goal:** What the update solved and why it was needed.
2.  **Core Additions:** New capabilities introduced in both frontend and backend, with exact commit references.
3.  **Deletions & Cleanups:** What was removed to maintain clean architecture and reduce tech debt.
4.  **Stats:** Commit counts, new models, and development intensity per release cycle.

---

## 🔒 Public Update Safety Checklist

Before publishing a release note, keep the update focused on product and architecture outcomes:

*   Do not include local folder paths, machine usernames, private repository URLs, `.env` values, database dumps, logs, or screenshots with real people/account data.
*   Use demo names, masked identifiers, and generalized metrics when exact tenant data is not required for the public story.
*   Mention security fixes by impact and scope, but avoid exposing exploit steps, private endpoints, or implementation details that could help attackers.
*   Keep commit references only when they are safe to disclose and already part of the public repository history.
