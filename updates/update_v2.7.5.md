# 🚀 Update v2.7.5 — Full i18n Overhaul, Profile Redesign & Email Infrastructure

**Release Period:** June 12 – June 19, 2026  
**Commits:** ~11 (Frontend) · ~20 (Backend)  
**Lines Changed:** +99,961 / −79,574  

---

## 🎯 Release Goal

Deliver a complete multi-language internationalization (i18n) system across all platform pages and dashboard panels (Student, Teacher, Sub-Admin, Head Admin), redesign profile editing layouts with translated badges, harden the backend email infrastructure with SMTP diagnostics, fix critical analytics calculation bugs, and implement granular activity logging for automated student notifications.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Complete i18n Overhaul:** Implemented a platform-wide multi-language translation system using `react-i18next` with JSON translation files, covering all 4 dashboard panels (Student, Teacher, Sub-Admin, Head Admin) and public-facing pages — 226 files refactored with translation keys (`7f35719`, `dec25c7`, Jun 15-19).
- **CommandPalette Search Engine Rebuild:** Redesigned the `CommandPalette` search engine to work with translated navigation labels, enabling multi-language search across all panel routes (`dec25c7`, Jun 19).
- **Activity Log Translation:** Added a dedicated `activityTranslator.js` utility to dynamically translate system activity log entries across all panels, ensuring activity feeds render correctly in any selected language (`dec25c7`, Jun 19).
- **Public Page Localization:** Refactored `NewsPage`, `PitchDeck`, `PricingPage`, and `TheArchitect` components to use i18n hooks for full localization support (`e0d59e7`, Jun 19).
- **Profile Edit Redesign:** Redesigned profile edit layouts for Student and Teacher panels with enhanced field grouping, translated badge labels, and updated legal policy sections (`a5425b7`, Jun 15).
- **Toast Notifications for Updates:** Added real-time toast notifications for platform updates and account verification status changes on the student dashboard (`4f76d0a`, Jun 13).
- **Loading Hang Fix:** Resolved a critical loading hang caused by missing AbortController timeout in data fetching, and fixed analytics column sorting with improved refetch logic (`c00f074`, Jun 13).
- **Test ID Standardization:** Standardized test ID handling across pages and enhanced homework calendar detail views with consistent data formatting (`f83c9d7`, Jun 13).

### 🤖 Knowza AI

- **AI UI Consolidation:** Removed early experimental AI-branded UI analytics widgets (`AIAnalysisCard`, dashboard AI overlays) from student statistics pages. The Knowza AI interface was refactored into a dedicated, focused AI chat experience rather than scattered analytics overlays (`5e533ea`, Jun 13).
- **Backend AI Engine Stability:** The server-side `KnowzaAIEngine` continued operating unaffected — only the frontend display layer was reorganized. All intents (explain, test_gen, socratic, article_gen, etc.) remained fully functional.
- **AI Session Continuity:** Backend `AIChatHistory` model persisted all session data through the UI consolidation, ensuring no conversation history was lost for users during the transition.
- **Notification Preferences Utility:** Added a `notificationPreferences.js` utility module to manage and persist user notification settings (`dec25c7`, Jun 19).
- **Student & Teacher Docs Data:** Created dedicated `StudentDocsData.js` and `TeacherDocsData.js` files to externalize documentation content with full translation support (`dec25c7`, Jun 19).

### Backend (`Knowza-Backend`)

- **SMTP Diagnostics Endpoint:** Built a `check_smtp` endpoint to diagnose email configuration and connectivity issues in real-time, with delivery validation and detailed error reporting (`76de601`, `daf8b14`, Jun 13).
- **Email Infrastructure Hardening:** Migrated SMTP configuration to environment variables, switched to Brevo SMTP relay, removed promotional links from templates, and enabled synchronous email sending with explicit error handling (`d14e73a`, `08e9ec3`, `9b68fdf`, `c91be72`, Jun 14).
- **Automated Student Activity Logging:** Implemented automated activity log entries for schedule changes and new homework assignments so students receive timely notifications (`416b88c`, Jun 13).
- **Activity Log Enhancements:** Added `user_id` filter to activity logs, enabled login activity logging for all roles, and filtered admin dashboard to exclude student/teacher login noise (`f1f7707`, `1868552`, `3b69937`, Jun 15-19).
- **Tenant Staff Scoping:** Updated user retrieval and list queries to include tenant staff based on admin scope, ensuring sub-admins see their own staff members (`ee66681`, Jun 19).
- **Test Visibility Filtering:** Implemented caching-aware test visibility filtering in serializer methods, allowing students to access previously attempted tests regardless of current visibility settings (`2e1cc1e`, `94e5a6f`, Jun 13).
- **Analytics Calculation Fixes:** Fixed division-by-zero in class average calculation, excluded zero-test students from averages, added `averageScore` field, and carried forward last known average in trend calculations (`6e80d21`, `b8c2a68`, `aec42b5`, Jun 13).
- **Admin Scope Consolidation:** Refactored user scoping logic with centralized `build_owner_scope` for admin root queries and student queryset filtering (`059d69c`, `9c70a6a`, Jun 13).
- **Database Hygiene:** Untracked `db.sqlite3` from git to prevent production database overrides (`26c51a8`, Jun 13).
- **Input Sanitization:** Fixed `sub_admin_id` query parameter handling to gracefully sanitize invalid string inputs as `None` (`0f0b886`, Jun 13).

---

## 📐 Architecture Changes

- **i18n Infrastructure:** Introduced `react-i18next` with a centralized `i18n.js` configuration, JSON-based translation files per language, and a `LanguageSwitcher` component. All 226 UI files now use `useTranslation()` hooks instead of hardcoded strings.
- **Activity Translation Layer:** Created a standalone `activityTranslator.js` utility that maps backend activity log action keys to translated display strings, decoupling log rendering from language selection.
- **Email Resilience:** Migrated from hardcoded SMTP settings to environment-variable-driven configuration with a dedicated diagnostic endpoint, improving deployability across different hosting environments.
- **Scope Resolution Refactor:** Consolidated duplicated admin/sub-admin scoping logic into reusable `build_owner_scope` utility, reducing code duplication across 5+ view modules.

---

## 🗑 Deletions & Cleanups

- **AI-Branded Components:** Removed `AIAnalysisCard` branding and experimental AI analytics features from student statistics and dashboard pages.
- **Hardcoded Strings:** Eliminated thousands of hardcoded UI strings across 226 files in favor of translation keys.
- **Promotional Email Content:** Removed promotional footer links from the styled email template.
- **SQLite Tracking:** Removed `db.sqlite3` from version control to prevent accidental production data commits.
- **Redundant Comments:** Cleaned up leftover comments and unused code from CommandPalette navigation.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | 11 |
| Backend Commits | 20 |
| Total Files Changed | 239 |
| Lines Added | 99,961 |
| Lines Removed | 79,574 |
| New Utility Modules | 3 (`activityTranslator.js`, `notificationPreferences.js`, `i18n.js`) |
| Translation Files | Full JSON sets for multi-language support |
| Active Development Days | 8 |
