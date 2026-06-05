# 🚀 Update v2.1.0 — LMS Academic Operations & Email Infrastructure

**Release Period:** May 23 – May 27, 2026  
**Commits:** ~10 (Frontend) · ~12 (Backend)

> **Note:** There was a ~1 month development pause (Apr 28 – May 22) before this release cycle resumed.

---

## 🎯 Release Goal

Expand Knowza from a pure assessment platform into a full Learning Management System (LMS) — adding homework management, school schedule grids, classroom CRUD, business analytics, and a styled asynchronous email notification pipeline.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)

- **Homework Management:** Added homework calendar pages with file attachment support, email verification methods, and API service integration for homework CRUD (`585948e`, May 23).
- **Toast Notification Migration:** Replaced all `antd message` popups with `sonner` toast notifications across every platform page for a cleaner, more modern notification UX (`8d39873`, May 23).
- **Public Identifier Navigation:** Migrated student profile navigation to use public identifiers via a shared utility helper, removing internal IDs from URLs (`1f58f6e`, May 23).
- **Schedule Management Page:** Built the `SchedulePage` component with full schedule slot management — create, edit, delete time slots mapped to days, subjects, and classrooms (`30b34a8`, May 24).
- **Business Analytics Page:** Added a dedicated Business Analytics dashboard with revenue tracking and operational metrics (`f078279`, May 24).
- **Student Operations Page:** Created a Student Operations management page with localization and UI improvements (`48a4d7d`, May 24).
- **Presentation Package:** Added a comprehensive presentation package including demo screenshots checklist, API docs screenshot plan, architecture details, 7-month development narrative, and pilot roadmap (`971ac10`, May 25).

### Backend (`Django-Test-App-Backend`)

- **Async Styled Email System:** Implemented a fully styled, asynchronous email delivery pipeline using Django's email backend. Emails feature modern HTML templates with responsive layouts (`928434e`, May 23).
- **Teacher Permission Restrictions:** Tightened teacher management permissions with scoped access controls (`928434e`, May 23).
- **Homework ViewSet:** Created a dedicated ViewSet for homework CRUD operations with file attachment support.
- **Cross-Branch Data Isolation:** Enforced strict cross-branch user data isolation policies and optimized Gunicorn deployment configurations (`935a8a5`, May 23).
- **Classroom & Schedule Models:** Added `Classroom` and `ClassScheduleSlot` models with full CRUD functionality including slot conflict detection (`e6b11cf`, May 24).
- **Analytics Event Tracking:** Implemented analytics event logging with daily aggregate computation and management commands (`776de72`, May 24).
- **Monetization Tracking:** Enhanced monetization/revenue tracking endpoints and tightened permission controls on billing views (`cfc337a`, May 24).
- **Site Settings Endpoint:** Added a public site-settings endpoint for frontend configuration and enhanced revenue calculation in analytics (`9ec7fd4`, May 25).
- **Class Group Scoping:** Added `class_group` field to the Test model with strict access control in serializers and views (`d42fbc8`, May 25).
- **Student Analytics Enhancement:** Enhanced student analytics with class group restrictions and detailed per-student statistics (`2320fb0`, May 26).
- **Performance Testing Reports:** Added production performance testing reports and an installation script (`235dedb`, May 26).
- **Tenant-Scoped Teacher Queryset:** Implemented organization-scoped student querysets for teachers with class group detail support in module views (`b6d1c30`, May 26).
- **Docker Setup:** Added complete Docker infrastructure with `Dockerfile`, `docker-compose.yml`, PostgreSQL configuration, and an entrypoint script for automated Django initialization (`ddf00be`–`9a89e18`, May 27).

---

## 🗑 Deletions & Cleanups

- **antd `message` API Removed:** All legacy `antd message.success/error` calls were replaced with `sonner toast` (`8d39873`, May 23).
- **Internal ID Exposure Removed:** Student profile URLs no longer expose database IDs (`1f58f6e`, May 23).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~10 |
| Backend Commits | ~12 |
| New Backend Models | 2 (Classroom, ClassScheduleSlot) |
| Infrastructure | Docker + Gunicorn production configs |
| Active Development Days | 5 |
