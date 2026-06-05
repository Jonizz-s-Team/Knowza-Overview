# 🚀 Update v1.4.0 — Knowza Rebranding, Anti-Cheat v2 & Tariff System

**Release Period:** March 1 – March 31, 2026  
**Commits:** ~80 (Frontend) · ~40 (Backend)

---

## 🎯 Release Goal

Rebrand the platform from "Examify/Test-App" to **Knowza**, implement the second-generation server-side anti-cheat system, build the admin tariff (subscription) system with email verification, add internationalization (i18n) across all pages, and establish the XP reward economy.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)

- **Platform Rebranding:** Renamed the platform from "Examify" to "Knowza" across all components, translations, titles, and branding assets (`255dab1`–`a31aa4a`, Mar 8–9). Later refined to "Knowza Test Platform" (`634700b`, Mar 22).
- **Anti-Cheat System v2:** Built a new progressive ban system with timezone support, centralized ban management, timed penalties, and UI ban status indicators (`df9a321`–`5f4de00`, Mar 7–8).
- **Admin Tariff & Subscription:** Implemented the admin registration flow with email verification, trial plan assignment, and subscription tier selection (`30058e9`, Mar 9).
- **Password Reset Flow:** Added a complete password reset journey with email verification codes (`2e1673f`, Mar 10).
- **XP Reward System:** Integrated XP display into student tables, profile views, and analytics with time bonuses and premium boosts (`27666fb`–`24c8448`, Mar 10–12).
- **Support Ticket System:** Built a bidirectional support ticket interface for student-admin communication with draft functionality (`a086216`–`445eb2e`, Mar 4–6).
- **Onboarding Tours:** Added guided onboarding tour components to Admin, Teacher, and Student dashboards (`54e1bad`–`6229a45`, Mar 5).
- **Minimalist Design + Skeleton Loaders:** Implemented skeleton loading states across all public pages for perceived performance improvement (`eb45c35`–`d828db7`, Mar 17–20).
- **Period-Based Filtering:** Added date-range filtering for student and class statistics views (`cf50f66`, Mar 16).
- **Uzbek Language Expansion:** Extended Uzbek translations across all platform pages including problem points and solution features (`c1520c1`–`2b02f36`, Mar 9–11).
- **Lottie Animation Optimization:** Integrated lazy-loaded Lottie animations with Framer Motion's `LazyMotion` for lighter bundle sizes (`0aa6491`–`0ae982b`, Mar 19).
- **Tailwind CSS Integration:** Initialized global CSS with Tailwind integration, custom theme variables, and responsive utilities (`a3a1358`, Mar 30).
- **Floating Pill Header:** Redesigned the header to a scroll-aware floating pill layout with brand color `#0154F8` (`3a22cbe`–`1ac1ec6`, Mar 31).
- **Teacher Profile Pages:** Added clickable teacher names linking to dedicated teacher profile and editing pages (`d1bfc26`–`0a60290`, Apr 1).
- **Seller/Content Manager Consolidation:** Merged the Seller and Content Manager panels under the unified "Head Admin" namespace (`6b1654d`–`cfcc8dd`, Mar 4–18).

### Backend (`Django-Test-App-Backend`)

- **AI Utility Functions:** Added AI-powered content generation utilities with Groq API support (`9499e6e`, Mar 27).
- **Module Model:** Introduced the `Module` model for organizing tests into subject-based collections.
- **Redis Caching & Throttling:** Implemented Redis-backed caching for AI responses and API views, added request rate throttling (`541cb64`, Mar 27).
- **Performance Benchmarking:** Built ORM aggregation-based student statistics and atomic test session management with star rewards (`e8487eb`, Mar 27).
- **Sub-Admin Role:** Implemented the Sub-Admin role with scoped permission restrictions (`1e115ba`, Mar 28).
- **Tariff Tracking:** Added user tariff/subscription tracking fields to the User model (`9499e6e`, Mar 27).
- **Database Backup System:** Established clean database dump workflows with zipped backup archives (`00da14a`–`51d2383`, Mar 27).
- **API Throttle Rates:** Increased default throttle limits for anonymous and authenticated users (`637866f`, Mar 29).
- **Deployment Automation:** Created automated deployment scripts for repository sync and server management (`84fb0b4`, Apr 1).

---

## 🗑 Deletions & Cleanups

- **Examify Brand References Removed:** All traces of the old "Examify" brand name were purged from the codebase (`255dab1`, Mar 8).
- **Duplicate Student Detail Pages Removed:** Cleaned up redundant page components (`614e369`, Mar 12).
- **Unused Components Removed:** Deleted orphaned components and extracted reusable `StatCard` (`ed11793`, Mar 22).
- **Content Manager Routes Consolidated:** Merged into head admin panel, removing standalone content manager routing (`6b1654d`, Mar 4).
- **Trial Tariff Handling Unified:** Consolidated scattered trial plan logic into a single handler (`f91bb92`, Mar 18).
- **Multiple Backend Bug Fixes:** Over 30 rapid "Fix" commits during Mar 28–29 addressing deployment and API stability issues.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~80 |
| Backend Commits | ~40 |
| Brand Rename Touchpoints | 50+ files |
| New Backend Models | 3 (Module, Tariff tracking, Sub-Admin) |
| Active Development Days | 28 |
