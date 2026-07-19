# 🚀 Update v2.3.0 — Email Automation, Knowza Rebranding & Documentation

**Release Period:** May 31, 2026  
**Commits:** ~12 (Frontend) · ~12 (Backend)

---

## 🎯 Release Goal

Complete the global platform rebranding to "Knowza" across all translation locales, build a comprehensive automated email notification pipeline, rewrite the production deployment guide, and unify the notification system by replacing scattered alert patterns with centralized toast notifications.

---

## 🏫 Knowza LMS
### 🏫 Frontend
- **Global Rebranding to Knowza:** Updated the application name across all translation locale files (EN, UZ, RU) to consistently display "Knowza" (`5dd5af5`, May 31).
- **Unified Toast Notifications:** Replaced all remaining local state alerts (`useState`-based success/error messages) with centralized `sonner` toast notifications across every admin module (`d43ed21`–`e21077d`, May 31).
- **Category Normalization:** Standardized category handling across admin modules for consistent data filtering (`e21077d`, May 31).
- **News Image URL Optimization:** Fixed news image URL paths and optimized list layout rendering (`d43ed21`, May 31).
- **Contact Form Labels:** Updated contact form subject dropdown values to more descriptive labels (`7538219`, May 31).
- **Roadmap Documentation:** Updated the project roadmap with detailed product features and system module descriptions (`dd05f40`, May 31).
- **Legacy Docs Cleanup:** Removed outdated server test context documentation and added the project presentation report (`fa4a604`, May 31).

### 🏫 Backend
- **Production Deployment Guide:** Completely rewrote the production deployment documentation with comprehensive maintenance procedures, troubleshooting sections, and operational playbooks (`5e4f3af`, May 31).
- **BCC Email Support:** Added BCC recipient support to the email utility for admin notification copies (`d7a7bae`, May 31).
- **Automated Email Notifications:** Implemented automatic email triggers for:
  - Site updates and content publications (`d7a7bae`, May 31)
  - New user registration welcome emails (`d7a7bae`, May 31)
  - Premium status change confirmations (`d7a7bae`, May 31)
  - Tariff request submission, approval, and rejection (`9aa1c3d`, May 31)
  - New contact message auto-confirmation (`4329310`, May 31)
- **Threaded Email Distribution:** Implemented chunked email sending using Python threading to prevent blocking the main request thread during bulk distributions (`fda855f`, May 31).
- **Email Template Content Updates:** Modernized email template content with updated marketing copy and feature highlights (`fda855f`–`d8bbea4`, May 31).
- **Support Email Recipients:** Added support team email addresses to the notification recipient list (`d8bbea4`, May 31).
- **Admin Notification Fix:** Excluded the original submitter from receiving admin-targeted notification emails (`acf1223`, May 31).
- **Media File Email Fix:** Updated email template to handle `media_file` attachments and exclude video rendering from email bodies (`bedd98e`, May 31).
- **Nginx Media Path Fix:** Prepended proxy path to media file URLs to resolve Nginx path stripping issue in production (`2fb695c`, May 31).
- **Online Status Tracking:** Added `is_online` field to user serializer to track active status based on recent activity timestamps (`262d407`, May 31).
- **Cache Duration Fix:** Reduced cache expiration time to 1 second in management and analytics mixins for near-real-time data accuracy (`0aed054`, May 31).

---

## 🗑 Deletions & Cleanups

- **Legacy Server Test Docs Removed:** Outdated server testing documentation was deleted (`fa4a604`, May 31).
- **Local State Alerts Purged:** All `useState`-based success/error alert patterns removed across admin modules in favor of toast system (`d43ed21`–`e21077d`, May 31).
- **Submitter Email Exclusion:** Admin notification emails no longer go to the person who triggered them (`acf1223`, May 31).

---

## 🤖 Knowza AI

No new Knowza AI features in this release. Focus was on LMS email automation, platform rebranding to "Knowza", and the unified notification system. The Knowza AI engine (KnowzaShield, LLM gateway, intent routing) remained stable from v2.0.0.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~12 |
| Backend Commits | ~12 |
| Email Notification Types | 7 |
| Translation Files Updated | 3 locales |
| Active Development Days | 1 (intensive) |
