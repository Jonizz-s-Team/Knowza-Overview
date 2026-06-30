# 🚀 Update v2.8.0 — Legal Documentation Overhaul, Backend Data Audit & B2B/B2C Model Clarification

**Release Period:** June 29 – June 30, 2026  
**Commits:** ~8 (Frontend) · ~0 (Backend)  
**Lines Changed:** +620 / −85  

---

## 🎯 Release Goal

Conduct a full backend data audit to map exactly what information is collected per user role, rewrite all five legal pages (Privacy Policy, Terms of Service, Cookie Policy, Refund Policy, Disclaimer) to reflect the actual platform data model, introduce a formal B2B/B2C payment model separation clause, synchronize all "Last Updated" dates across the platform, and add a dedicated data isolation section documenting the multi-tenant access control architecture.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Knowza`)

- **Privacy Policy — Role-Based Data Collection (Section 2 Rewrite):** Completely rewrote Section 2 of `PrivacyPage.jsx` across all three languages (UZ/EN/RU) to document data collection by user role. Each role now has a dedicated subsection:
  - **Admin:** Organization name, institution type (school/learning center/private tutor), country, full name, primary and additional phone numbers, tariff plan, payment history, and access isolation note.
  - **Teacher:** Full name, email, Display ID, subject specialization, position (Teacher/Senior Teacher/Lead Teacher), experience years, qualification level, hire date, assigned classes, social links, and official documents (passport copy, diploma, certificates, employment contract — all optional, uploaded by admin).
  - **Student:** Full name, middle name, last name, email, Display ID, date of birth, gender, home address, enrollment date, parent/guardian names and phone numbers (separate fields for father, mother, guardian), relationship type, group, study direction, study status, test results, average score, XP points, daily streak, premium status, star balance, profile photo, and student notes.
  - **All roles:** Technical logs (IP, browser, OS, device) for Knowza Sentinel Anti-Cheat, payment transaction history, and last activity timestamps.

- **Privacy Policy — Data Isolation Section (Section 9, new):** Added a new Section 9 across all three languages formally documenting the multi-tenant data access architecture:
  - Admin → sees only their own branch admins, teachers, and students
  - Branch Admin → sees only their assigned branch
  - Teacher → sees only their assigned students' test results
  - Student → sees only their own results and group ranking (name + score)

- **Terms of Service — B2B/B2C Payment Model Separation (Section 14, new):** Added Section 14 to `TermsPage.jsx` across all three languages formally separating the two independent payment streams:
  - **B2B:** Admin pays Knowza a monthly/annual CRM+LMS tariff. This payment has no relation to student purchases.
  - **B2C:** Student purchases Premium subscriptions or Stars directly with Knowza. The learning center or admin receives no share of these transactions and has no right to claim them.
  - Includes explicit clause: *"The center cannot make any claim over such payments."*

- **Date Synchronization — All Legal Pages:** Audited and synchronized the "Last Updated" date across all five legal documents. Four pages had outdated dates (June 21, 2026); all updated to **June 30, 2026**:
  - `CookiePolicy.jsx` — UZ/EN/RU ✅
  - `RefundPolicy.jsx` — UZ/EN/RU ✅
  - `DisclaimerPage.jsx` — UZ/EN/RU ✅
  - `TermsPage.jsx` — UZ/EN/RU ✅
  - `PrivacyPage.jsx` — already up to date ✅

- **Section Numbering Update:** Renumbered the final "Policy Updates" section from 9 to 10 in `PrivacyPage.jsx` across all three languages to accommodate the new data isolation section.

---

## 🔍 Backend Data Audit

Conducted a systematic review of `api/models.py` (2,117 lines) and `api/serializers.py` (1,717 lines) to identify every data field collected per user role. Key findings that were previously undocumented in the Privacy Policy:

| Field | Model Field | Previously Documented |
|---|---|---|
| Teacher passport document | `passport_document` | ❌ No |
| Teacher diploma document | `diploma_document` | ❌ No |
| Teacher certificates | `certificates_document` | ❌ No |
| Teacher employment contract | `employment_contract_document` | ❌ No |
| Student parent name/phone (3 roles) | `parent_name`, `parent_phone`, `parents_extra_phones` | ❌ No |
| Student date of birth | `birth_date` | ❌ No |
| Student gender | `gender` | ❌ No |
| Student home address | `address` | ❌ No |
| Student XP and streak data | `total_xp`, `current_streak` | ❌ No |
| Admin access isolation rule | `IsolatedManager` | ❌ No |
| Admin additional phone | `additional_phones` | ❌ No |

All above fields have been added to the Privacy Policy in all three languages.

---

## 📐 Architecture Notes

- **Multi-Tenant Isolation:** The platform uses a custom `IsolatedManager` Django model manager that enforces per-admin data scoping at the ORM level. This is now formally documented in the Privacy Policy under Section 9.
- **Document Storage:** Teacher documents (passport, diploma, certificates, contract) are stored in separate subdirectories under `teacher_docs/` with distinct upload paths per document type.
- **B2B/B2C Separation:** The legal boundary between admin tariff payments (B2B) and student Premium/Stars purchases (B2C) is now formally codified in Terms of Service Section 14, protecting Knowza from potential third-party claims by learning centers over student payments.

---

## 🗑 Cleanups

- Removed outdated June 21, 2026 dates from 4 legal page files (12 instances total — 3 languages × 4 pages).
- Replaced generic single-list data collection section in Privacy Policy with structured role-based breakdown.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~8 |
| Backend Commits | 0 |
| Legal Pages Updated | 5 |
| Languages Per Page | 3 (UZ / EN / RU) |
| New Privacy Policy Sections | 2 (Role-Based Data §2, Isolation §9) |
| New Terms of Service Sections | 1 (B2B/B2C Model §14) |
| Previously Undocumented Fields Added | 11 |
| Date Instances Corrected | 12 |
| Active Development Days | 2 |
