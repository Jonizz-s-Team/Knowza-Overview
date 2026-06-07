# 🚀 Update v2.0.0 — Knowza ID, Sentinel Anti-Cheat & Enterprise Security

**Release Period:** April 1 – April 27, 2026  
**Commits:** ~70 (Frontend) · ~40 (Backend)

---

## 🎯 Release Goal

Launch enterprise-grade security features — the Knowza ID universal authentication system, Sentinel anti-cheat engine, AI-powered test generation with KnowzaShield firewall, strict multi-tenant data isolation, and complete admin/sub-admin dashboard overhaul. This milestone marks Knowza's transition from a prototype to a production-ready SaaS platform.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Knowza ID Authentication:** Implemented custom ID-based login alongside traditional credentials. Users receive a unique Knowza ID for seamless cross-device access (`aa76201`–`71729ed`, Apr 1). Includes staged loading animations during ID verification (`0daf8d1`, Apr 2).
- **Sub-Admin Statistics Dashboard:** Added a statistics table to the sub-admin dashboard with property naming standardization (`8c87dbd`, Apr 2).
- **Legal Pages:** Created Terms of Service, Privacy Policy, and Cookie Policy pages with localization (`24ecf8c`, Apr 2).
- **Documentation Portal:** Built a multi-platform documentation portal with interactive navigation and full-text search (`5a26b92`–`a474f66`, Apr 3–5).
- **TanStack Query Migration:** Migrated all form management and data fetching to TanStack Query with CRUD functionality across entity forms (`12a368b`, Apr 11).
- **Sentinel Anti-Cheat Frontend:** Implemented the Sentinel monitoring hook and security utilities for client-side exam surveillance (`fa82cfe`, Apr 11).
- **AI Usage Badge:** Designed the AI usage indicator badge with a modern dropdown menu and pulse animation (`a3ba32d`–`0368ca6`, Apr 11–12).
- **Comprehensive Dashboard Modules:** Built out all admin and sub-admin dashboard modules including routing, management pages, and data tables (`28300ee`, Apr 11).
- **Bulk Import System v2:** Rebuilt the teacher import with preview step, validation, and backend integration (`d913cd5`, Apr 15). Added batch delete for subjects with Excel support (`a79c805`, Apr 17).
- **Rendering Performance:** Memoized table columns, data, and filtering logic across all list components to prevent unnecessary re-renders (`6842b56`, Apr 15).
- **PitchDeck Presentation Page:** Created an interactive presentation page with custom slide navigation, pyramid market visualization, and branded styling (`b404334`–`c8db674`, Apr 19).
- **Demo Page:** Built a dedicated demo page with feature grids, branding, and descriptive sections (`a2c9f2d`–`79bef73`, Apr 19–20).
- **Chunked Bulk Import:** Implemented chunked imports with global progress tracking using `ImportContext` and `GlobalImportModal` (`0a38bd0`, Apr 19).
- **CommandPalette Component:** Added a keyboard-driven command palette for quick navigation and actions (`641eb87`, Apr 22).
- **Sub-Admin Access Control:** Implemented creation access controls and group renaming with category management (`96bf1be`, Apr 25).
- **AI Notch Button:** Extracted the `AINotchButton` component with integration into statistics pages (`b7690f8`, Apr 25).
- **Student Dashboard Enhancements:** Added collapsible sections, optimized API polling intervals, student detail pages, and group list views (`d7533a4`–`b2e7315`, Apr 26).

### Backend (`Knowza-Backend`)

- **Knowza ID System:** Implemented universal access control with `knowza_custom_id` field, case-insensitive login, JWT claim updates, and service entitlement models (`7a2f4d0`–`cda07a6`, Apr 1).
- **Strict Security Isolation:** Enforced mandatory password verification for all content management views (`df4bede`, Apr 2).
- **User Selector Improvements:** Enforced role filtering before search with class group filter support (`57cb2c5`, Apr 4).
- **Sub-Admin Statistics Caching:** Implemented 5-minute response caching for sub-admin statistics serializers (`54213fd`, Apr 5).
- **Aggressive Performance Caching:** Built queryset optimization and multi-level caching for user data and statistics endpoints (`ca0dd5e`, Apr 6).
- **Multi-Tenant Data Isolation:** Restricted admin-created student visibility to teachers within the same branch only (`e4949c5`–`10b3203`, Apr 9–10). Centralized user queryset isolation into `get_user_queryset_for_role` selector (`249899e`, Apr 15).
- **Swagger Schema Safety:** Applied universal safety guards to prevent 500 errors during API schema generation (`10d72ad`, Apr 15).
- **Analytics Expansion:** Added summary statistics, class/global rankings, and recent activity history to analytics responses (`e226369`, Apr 15). Enforced strict hierarchical data siloing (`30f6e95`, Apr 16).
- **KnowzaShield AI Firewall:** Integrated Groq API support and implemented a security firewall for auditing all AI requests and responses (`d76079b`, Apr 18).
- **Structured JSON for AI:** Enforced structured JSON schema output from AI responses with additional metadata fields (`7d982ca`–`f26c5e5`, Apr 19).
- **Bulk Group Import:** Added bulk import for institution groups with email verification rate limiting (`0548fa6`, Apr 18).
- **Atomic Teacher Statistics:** Implemented atomic statistics sync with `LiteTestAttemptSerializer` and model isolation managers (`db1dd3c`, Apr 21).
- **30-Day Account Cleanup:** Implemented automatic cleanup for expired admin accounts with deletion countdown exposure (`c20243a`, Apr 25).
- **User Services Layer:** Added dedicated user services and serializers module (`90ebe41`, Apr 26).
- **Cache Invalidation:** Fixed streak and dashboard cache invalidation after data updates (`7c7193b`, Apr 26).

---

## 🗑 Deletions & Cleanups

- **Unused Icons Removed:** Cleaned up `CheckCircleOutlined` and other unused imports (`825d44d`, Apr 19).
- **Error Message Exposure Restricted:** Production error responses now hide internal details (`a22287d`, Apr 15).
- **Unused `select_related` Fields Removed:** Optimized Test queryset by removing unnecessary joins (`a22287d`, Apr 15).
- **Duplicate Index Removed:** Fixed deployment collision caused by duplicate `last_activity` database index (`a46eb2f`, Apr 15).
- **Hibernation Checkpoint:** Development paused briefly with "Hibernation mode" commit before resuming (`87907fa`, Apr 23).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~70 |
| Backend Commits | ~40 |
| Security Features Added | 5 (Knowza ID, Sentinel, KnowzaShield, Tenant Isolation, Password Verification) |
| New Dashboard Pages | 10+ |
| Active Development Days | 22 |
