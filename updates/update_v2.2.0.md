# 🚀 Update v2.2.0 — SaaS Tariff Engine & Performance Overhaul

**Release Period:** May 28 – May 30, 2026  
**Commits:** ~15 (Frontend) · ~15 (Backend)

---

## 🎯 Release Goal

Launch the B2B subscription monetization engine with five-tier tariff plans, implement dynamic pricing calculations, build reveal animations across the public site, fix critical N+1 query performance issues, and optimize serializer rendering for large datasets.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)

- **Reveal Animations:** Implemented scroll-triggered reveal animations across all landing page components and public pages with a new styling utility class (`1abb17d`, May 29).
- **Tariff Limit Visualization:** Built a visual quota display showing resource usage vs. plan limits, restricting dashboard navigation for free-tier users (`4544e00`, May 29).
- **PhoneInput Component:** Created a dedicated phone number input component with country code selection and localization updates (`89c7842`, May 29).
- **Session Expiry Handling:** Implemented automatic session expiration detection with a relogin overlay UI and state persistence — users don't lose their work (`0f7e6aa`, May 30).
- **UI Theme Simplification:** Consolidated theme colors to `blue-500`, removed the `ScrollToTop` component, and expanded the PricingPage with an ecosystem section (`bcf62dd`, May 29).
- **Onboarding Tour Removal:** Removed onboarding tour components and logic from all dashboards in favor of simpler help flows (`c5fbabd`, May 30).
- **Ant Design v5 Migration:** Migrated UI components to v5 style props and replaced legacy `List` components with custom flex layouts (`04ee473`, May 30).
- **Skeleton Loading Expansion:** Enhanced loading states with Skeleton components across teacher overview and statistics pages (`dfa96e7`–`f91b4af`, May 25–26).
- **Class Group Details Refactor:** Improved UI interaction patterns and data handling in ClassGroupDetails and ModuleAnalyticsPage (`a1d3e24`, May 26).
- **Animation & Loader Fixes:** Optimized reveal animation timing, fixed loader transition glitches, updated contact email and social links, and added missing news translations (`9daacfe`, May 29).

### Backend (`Django-Test-App-Backend`)

- **Five-Tier Tariff Plans:** Introduced `Free`, `Starter`, `Professional`, `Business`, and `Enterprise` subscription tiers with configurable resource limits and database seeding support (`e641a18`–`68c3b0e`, May 28–29).
- **Dynamic Pricing Engine:** Implemented a billing service for calculating subscription costs based on usage volume and tier features (`68c3b0e`, May 29).
- **Tariff Feature Packs:** Updated pricing packs with AI analysis quotas, CSV import limits, and gamification toggle options (`ca2c437`, May 29).
- **Role-Based Tariff Access:** Enforced strict role-based access control for tariff creation/management and disabled pagination for admin tariff views (`065ad77`, May 29).
- **Student Search Isolation:** Excluded students from admin and sub-admin search queries to prevent data leakage (`a6eee23`, May 29).
- **Cache Invalidation v2:** Implemented version-based cache invalidation for user list responses ensuring data consistency after mutations (`c3194cf`, May 29).
- **My Limits Endpoint:** Added `/my_limits/` endpoint returning the current admin's tariff quota and usage statistics (`b7e2c39`, May 29).
- **Email Template Redesign:** Redesigned the HTML email template with a modern layout, improved typography, and responsive design (`614c6ca`, May 29).
- **N+1 Query Elimination:** Optimized analytics queries by adding `select_related` and batching data retrieval to eliminate N+1 database issues (`ce47aa1`, May 30).
- **Background Worker:** Added a background worker process for deferred task execution (`d61b226`, May 30).
- **Serializer Performance:** Bypassed heavy lookups and database hits during list views by using `LiteSerializer` patterns (`d659014`, May 30).

---

## 🗑 Deletions & Cleanups

- **ScrollToTop Component Removed:** Deleted in favor of native browser behavior (`bcf62dd`, May 29).
- **Onboarding Tour Components Removed:** Stripped from all dashboards (`c5fbabd`, May 30).
- **Legacy List Components Removed:** Replaced with custom flex layouts for better control (`04ee473`, May 30).
- **Price Modification Logic Simplified:** Reduced pricing complexity in serializer representation (`f5f5e27`, Jun 1 — logic written May 30).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~15 |
| Backend Commits | ~15 |
| Tariff Plans Created | 5 |
| N+1 Queries Fixed | 3+ |
| Active Development Days | 3 |
