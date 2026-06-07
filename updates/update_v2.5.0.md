# 🚀 Update v2.5.0 — Live Refresh, Home Expansion & Security Refinements

**Release Period:** June 3 – June 5, 2026  
**Commits:** ~8 (Frontend) · ~4 (Backend)

---

## 🎯 Release Goal

Introduce panel live refresh functionality, expand the home page with new localized content sections, refine tenant-scoped security, and clean up the codebase by removing temporary files and scratch documentation.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Panel Live Refresh:** Implemented a real-time data refresh mechanism with refresh buttons across dashboard panels (`f93c96b`, Jun 3). Later removed the refresh UI element in favor of automatic background polling (`c78595e`, Jun 4).
- **CSS Input Cleanup:** Cleaned up global CSS input style overrides and removed redundant `size` prop from UpdatesPage search input (`9b9864f`, Jun 3).
- **Student Profile Consistency:** Adjusted input size configurations in StudentProfilePage for consistent UI styling (`401d2b6`, Jun 3).
- **Generated Key Length Update:** Increased the length of auto-generated access keys for improved security (`c78595e`, Jun 4).
- **Home Page Content Expansion:** Extended the home page with new localized content sections, expanded solution cards, and enhanced localization content across all language files (`2b7831f`–`7617387`, Jun 4).
- **Admin Dashboard Strings:** Expanded localization files and UI navigation with new admin and user dashboard translation strings (`2b7831f`, Jun 4).
- **Invalid Credentials Handling:** Added specific error handling and user-facing messages for invalid login credentials (`5285504`, Jun 5).
- **Scaling Section Content:** Updated the scaling/growth section content in translation files with more descriptive text (`5285504`, Jun 5).
- **Scratch File Cleanup:** Removed all temporary scratch scripts and documentation files from the repository (`94c092d`, Jun 4).

### Backend (`Knowza-Backend`)

- **Identifier Masking:** Custom identifiers (Knowza IDs) are now masked for non-admin users to prevent exposure of internal IDs (`33b6656`, Jun 3).
- **Tenant Scoping Refinement:** Refined tenant-based scoping logic for more precise data isolation across multi-school environments (`33b6656`, Jun 3).
- **Admin/Sub-Admin Update Fix:** Fixed a bug where admins and sub-admins could not be retrieved during update actions in user selectors (`ca45806`, Jun 3).
- **Repository Cleanup:** Removed temporary scratch files, local database backups, and test scripts from the repository (`6a01cbe`, Jun 4).

---

## 🗑 Deletions & Cleanups

- **PanelLiveRefresh UI Removed:** The manual refresh button was removed in favor of automatic background polling (`c78595e`, Jun 4).
- **Scratch Scripts Removed:** All temporary testing and scratch files deleted from both frontend and backend repos (`94c092d`, `6a01cbe`, Jun 4).
- **Redundant CSS Overrides Removed:** Cleaned up input styling overrides that conflicted with Ant Design defaults (`9b9864f`, Jun 3).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~8 |
| Backend Commits | ~4 |
| Home Page Sections Added | 3+ |
| Translation Keys Added | 40+ |
| Active Development Days | 3 |
