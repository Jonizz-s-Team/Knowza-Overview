# 🚀 Update v2.6.0 — Sub-Admin Scope Isolation, Teacher Test Management & Calendar Overhaul

**Release Period:** June 5, 2026  
**Commits:** ~1 (Frontend) · ~2 (Backend)  
**Lines Changed:** +4,411 / −1,154

---

## 🎯 Release Goal

Implement full sub-admin data scope isolation across all platform modules, enable teachers to independently create and manage tests, redesign the classroom assignment workflow with bulk reassignment, and overhaul the schedule calendar to use Monday as the starting day.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)

- **Sub-Admin Branch Isolation:** Implemented complete data scope isolation for sub-admins — groups, teachers, classrooms, and student lists are now automatically filtered by the sub-admin's assigned branch (`c896c6a`, Jun 5).
- **Classroom Sub-Admin Assignment:** Added the ability to assign specific sub-admins to classrooms with a dedicated selector, supporting bulk reassignment of existing classrooms between branches (`c896c6a`, Jun 5).
- **Monday-Starting Calendar Grid:** Patched the `calendarjs` weekly calendar component so that columns start from Monday instead of Sunday, matching the standard academic week layout used in Uzbekistan (`c896c6a`, Jun 5).
- **Admin Groups List Overhaul:** Completely redesigned the admin groups list page with direction-based filtering, Excel import/export with `Yo'nalish` column support, and direction auto-detection from keywords (Aniq/Tabiiy/Gumanitar) (`c896c6a`, Jun 5).
- **Admin Students/Teachers/Subjects Lists:** All admin-level list pages now include sub-admin filtering, reorganized toolbar layouts, and enhanced Excel import/export buttons moved to the filters card area (`c896c6a`, Jun 5).
- **Sub-Admin Groups/Students/Teachers/Subjects Lists:** Sub-admin versions of all list pages upgraded with the same direction support, Excel spreadsheet-style import preview, and export functionality (`c896c6a`, Jun 5).
- **Schedule & Classroom UI Redesign:** Relocated Excel import/export and refresh buttons from the header area into the filters card section for cleaner layout organization. Fixed duplicate `size` props in schedule form Select elements (`c896c6a`, Jun 5).
- **Excel Import Preview — Spreadsheet UI:** Built a realistic Excel-like spreadsheet preview component for the group import modal, complete with formula bar, column headers (A, B), row numbers, and sheet tabs (`c896c6a`, Jun 5).
- **Excel Export for Groups:** Added a new "Excel Export" button to export the current groups list with group name, direction, student count, and average score to a dated `.xlsx` file (`c896c6a`, Jun 5).
- **Schedule Slot Fix:** Fixed schedule loading where slot count was being truncated by disabling the default backend viewset pagination for schedule endpoints (`c896c6a`, Jun 5).

### Backend (`Django-Test-App-Backend`)

- **Teacher Test Creation:** Teachers can now independently create and manage tests on the backend — previously restricted to admins and sub-admins only (`abc1022`, Jun 5).
- **Sub-Admin Filtering for Classrooms & Schedules:** Added `sub_admin` query parameter filtering to classroom and schedule viewsets, allowing the frontend to scope data by branch (`fc6ffde`, Jun 5).
- **Bulk Reassign Classrooms:** New `bulk_reassign` action on the Classroom viewset lets admins reassign all classrooms from one sub-admin to another in a single API call (`fc6ffde`, Jun 5).
- **Flexible `created_by` Ownership:** Classroom and schedule creation now supports an explicit `created_by` field, enabling admins to assign ownership to specific sub-admins during creation (`fc6ffde`, Jun 5).
- **Sub-Admin Selector Enhancement:** Added sub-admin users to the user selector query for admin-level views, making sub-admins available for assignment dropdowns (`fc6ffde`, Jun 5).

---

## 📐 Architecture Changes

- **Sub-Admin Scope Pattern:** Established a consistent frontend pattern where each list page (groups, students, teachers, subjects) auto-filters by the selected sub-admin's branch using a shared `SubAdminSelector` component and TanStack Query key invalidation.
- **Direction System:** Groups now carry a structured `direction` object with `category` (exact/natural/humanities/other) and `custom_name`, replacing the flat `direction_id` reference. Auto-detection from text keywords (Aniq → exact, Tabiiy → natural, Gumanitar → humanities) is built into both Excel import and manual editing.
- **Calendar Patching:** The `calendarjs` third-party component was monkey-patched at the CSS level to reorder day columns, avoiding a fork of the library.

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | 1 (mega-commit) |
| Backend Commits | 2 |
| Files Changed | 22 |
| Lines Added | ~4,411 |
| Lines Removed | ~1,154 |
| Net Lines | +3,257 |
| Admin List Pages Redesigned | 4 (Groups, Students, Teachers, Subjects) |
| Sub-Admin List Pages Upgraded | 4 (Groups, Students, Teachers, Subjects) |
| New API Endpoints | 2 (bulk_reassign, teacher test CRUD) |
