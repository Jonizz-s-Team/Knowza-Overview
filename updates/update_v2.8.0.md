# 🚀 Update v2.8.0 — Branch Admin Migration, Profile Extension, Billing Upgrades & Legal Documentation Overhaul

**Release Period:** June 21 – June 30, 2026  
**Commits:** ~19 (Frontend) · ~13 (Backend)  
**Lines Changed:** +12,844 / −18,429  

---

## 🎯 Release Goal

Consolidate a major platform migration renaming all Sub-Admin references to Branch Admin, expand Teacher and Student profiles with comprehensive administrative and academic fields, integrate secure document storage paths, rebuild the subscription management and B2B invoice generation engine with JWT validation, synchronize all platform-wide legal policies (Privacy, Terms, Cookies, Refund, Disclaimer) to June 30, 2026, and officially codify B2B/B2C payment isolation and multi-tenant data access control rules.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Branch Admin Role Migration:** Fully migrated the user role checks, path names, and terminology from `sub_admin` to `branch_admin` across the entire React codebase, including updating `SubAdminSelector` to fetch via the branch admin endpoint (`be4a07f`, `d749965`, Jun 24).
- **Branch Admin Management UI:** Added `BranchAdminDetails` and enhanced `BranchAdminForm` to collect phone numbers and support automatic username generation (`a6791d6`, Jun 24).
- **Admin Profile & Tariffs Tab Redesign:** Consolidated subscription plan details, countdowns, and resource limits into a single styled card in `AdminProfile.jsx` without heavy shadows, using a standard `1.5px solid #94a3b8` border (`086fd32`, Jun 29).
- **Resource Limits & Stats Grid:** Redesigned limit displays with icons, hover transitions, and a modal showing progress meters for resource usage (`7ec856e`, `e74846b`, Jun 30).
- **Invoice Management and History:** Added bulk invoice downloading and limited payment history lists to prevent visual clutter in the profile view (`aa8eb41`, Jun 30).
- **I18n Translation System Enhancements:** Overhauled the Excel import/export modals and standardized teacher profile forms with full multi-language translations (UZ/RU/EN) (`cb98fe1`, `d5bcfbf`, Jun 23-24).
- **Legal Document Overhaul & Sync:** Synchronized "Last Updated" dates to **June 30, 2026** across all five legal policies, rewriting data collection sections to detail exactly what fields are gathered per user role (`4b74ec4`, `a7dba33`, `2ed01a8`, Jun 30):
  - **Privacy Policy Role-Based Disclosures:** Formally documented that we collect organization details for Admins, professional records and uploaded documents (passport, diploma, certificates, contracts) for Teachers, and demographic fields (DOB, address, parents' contacts) for Students.
  - **Data Access Control (Section 9):** Documented tenant-level logical data isolation (Admin/Branch Admin/Teacher/Student scoping).
  - **B2B/B2C Payment Split (Section 14):** Formally clarified that B2B learning center tariffs are completely independent of direct student payments (Premium/Stars), protecting Knowza from center-level claims.

### Backend (`Knowza-Backend`)

- **Sub-Admin to Branch Admin DB Migration:** Renamed Django DB roles, choices, and filters from `sub_admin` to `branch_admin`, modified the tariff limits field (`max_sub_admins` -> `max_branch_admins`), and generated migration `0124_change_sub_admin_to_branch_admin.py` while ensuring all 55 unit tests pass (`e073fe2`, Jun 24).
- **Branch Admin View Filters:** Added `branch_admin_id` filter to content manager and test endpoints, and included cached statistics in resource serializers (`7339017`, Jun 24).
- **Extended Profile Serializers:** Added DB storage fields for Teacher document uploads (passport, diploma, certificates, contract) and Student details (birth date, gender, address, parent contact details, XP, and streak scores) (`fa259b0`, `3e7fda6`, `55edd8e`, Jun 23).
- **B2B Invoice Generation Engine:** Built a JWT-authenticated endpoint to dynamically generate billing invoices, including custom tariff prices and customer billing details (`ae10b0a`, Jun 30).
- **Tariff Limit Enforcement:** Added backend checks enforcing resource limits per tariff tier for core assets (students, teachers, groups, branches) (`f3b3511`, Jun 30).
- **Persistent Docker Media Storage:** Refactored media configurations to use configurable environment variables and secure persistent Docker volumes (`3a5c41f`, Jun 23).
- **Star Package Expansion:** Expanded role permissions in `OpsMixin` to grant branch admins capability to award stars to students (`8f655ed`, Jun 21).

---

## 📐 Architecture Notes

- **Tariff & Subscription Rules:** Enforced core CRM constraints on the backend, checking usage counts against plan thresholds before allowing resource creations.
- **Tenant Isolation Security:** Hardened backend managers and serializers to prevent access cross-talk, ensuring branch admins and teachers only query records from their own tenants.
- **Persistent Storage Layout:** Formally separated document uploads and static media into specialized subfolders (`teacher_docs/`, `student_photos/`) mapped to host volumes.

---

## 🗑 Cleanups

- Cleared out obsolete source code files, legacy endpoint routing files, and unused CSS selectors (`071703a`, `1268817`, `fe08459`, Jun 24-30).
- Cleaned up database models by removing redundant comments and draft models in `ops_mixin.py` (`174508d`, Jun 24).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~19 |
| Backend Commits | ~13 |
| Total Files Changed | 188 |
| Lines Added | 12,844 |
| Lines Removed | 18,429 |
| Updated Legal Policies | 5 |
| Active Development Days | 10 |
