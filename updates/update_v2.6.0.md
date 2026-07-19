# 🚀 Update v2.6.0 — Sub-Admin Scope Isolation, Teacher Test Management & Calendar Overhaul

**Release Period:** June 5, 2026  
**Commits:** ~1 (Frontend) · ~2 (Backend)  
**Lines Changed:** +4,411 / −1,154

---

## 🎯 Release Goal

Implement full sub-admin data scope isolation across all platform modules, enable teachers to independently create and manage tests, redesign the classroom assignment workflow with bulk reassignment, and overhaul the schedule calendar to use Monday as the starting day.

---

## 🛠 Features & Capabilities Introduced

### Frontend — Knowza LMS

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

### Backend — Knowza LMS (`Knowza-Backend`)

- **Teacher Test Creation Bug Fix:** Fixed a critical permission error where teachers were unable to create tests from the Teacher Dashboard. The backend `_ensure_test_db_manage_allowed` guard was incorrectly restricting test creation to admins and sub-admins only — teachers are now properly authorized (`abc1022`, Jun 5).
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

## 🗑 Deletions, Deprecations & Legacy Code Removed

Over the course of Knowza's 7-month development, several major components, pages, and libraries were removed or replaced as the architecture evolved:

### UI Library Migration
| Library | Status | Date | Details |
| --- | --- | --- | --- |
| **Material UI (`@mui/material`)** | ❌ Removed | Dec 20, 2025 | Fully replaced by Ant Design during v1.1.0 migration (`a88e0e4`). MUI icons were temporarily re-added Dec 29 (`1096768`) but are no longer imported anywhere in the source code. The package remains in `package.json` as a dead dependency. |

### Removed Pages & Components
| Removed Item | Date Removed | Replaced By | Commit |
| --- | --- | --- | --- |
| `SellerDashboard.jsx` | Mar 18, 2026 | Consolidated into HeadAdminDashboard | `cfcc8dd` |
| `ContentManagerDashboard.jsx` | Mar 18, 2026 | Consolidated into HeadAdminDashboard | `cfcc8dd` |
| `seller/SellerOverview.jsx` | Mar 18, 2026 | HeadAdmin overview | `cfcc8dd` |
| `content-manager/` (2 pages) | Mar 18, 2026 | HeadAdmin modules | `cfcc8dd` |
| `Onboarding.jsx` (original) | Mar 14, 2026 | Rebuilt as DocsPage | `304bb14` |
| `Docs.jsx` (original) | Mar 14, 2026 | Rebuilt as DocsPage | `304bb14` |
| `RegisterPage.jsx` | Mar 9, 2026 | Admin self-registration flow | `30058e9` |
| `UnbanPage.jsx` | Mar 21, 2026 | Handled in admin panel | `33fcc1b` |
| `PricingSelection.jsx` | Dec 20, 2025 | Rebuilt as PricingPage | `09a6fb6` |
| `admin/CreateEvent.jsx` | Dec 15, 2025 | Events moved to news system | `730906a` |
| `admin/ManageEvents.jsx` | Dec 15, 2025 | Events moved to news system | `730906a` |
| `seller/ManageGifts.jsx` | Dec 20, 2025 | Gift system deprecated | `558255e` |

### Removed Components
| Component | Date Removed | Reason | Commit |
| --- | --- | --- | --- |
| `HeaderDynamicIsland.jsx` | Feb 5, 2026 | Replaced with standard header | `8a0eb98` |
| `AIChat.jsx` (Gemini integration) | Feb 28, 2026 | Feature archived | `9b43f3f` |
| `Aurora/AuroraHero.jsx` | Feb 28, 2026 | Replaced by GSAP hero section | `9b43f3f` |
| `HelpButton.jsx` | Feb 28, 2026 | Replaced by contextual help | `9b43f3f` |
| `NotesSidebar.jsx` | Feb 28, 2026 | Feature archived | `9b43f3f` |
| `TextSelectionHandler.jsx` | Feb 28, 2026 | Feature archived | `9b43f3f` |
| `OnboardingExitGhost.jsx` | Feb 28, 2026 | Onboarding redesigned | `9b43f3f` |
| `ActiveTestBanner.jsx` | Mar 22, 2026 | Replaced by Dynamic Island notifications | `ed11793` |
| `MacModalCard.jsx` | Mar 22, 2026 | Unused component | `ed11793` |
| `MagneticButton.jsx` | Mar 22, 2026 | Unused component | `ed11793` |
| `PanelLiveRefresh.jsx` | Jun 4, 2026 | Replaced by automatic background polling | `c78595e` |
| `SettingsButton.jsx` | Jan 10, 2026 | Dark mode removed | `d26a045` |
| `Footer.jsx` (original) | Jan 11, 2026 | Rebuilt as FlickeringFooter | `604a7b6` |
| `ServerTestDemo.jsx` | Dec 20, 2025 | Test utility removed | `89c18bb` |
| `WarningModal.jsx` | Dec 14, 2025 | Replaced by antd Modal | `c03d398` |
| `EmojiPicker.jsx` | Feb 1, 2026 | Feature deprecated | `4a87f68` |
| `StudentLoader.jsx` | Dec 23, 2025 | Replaced by antd Skeleton | `bc67ad7` |

### Removed Landing Pages (Old Designs)
| Old Landing/Home Page Build | Date Removed | Replaced By |
| --- | --- | --- |
| Original Home.jsx (v1, timeline layout) | Dec 20, 2025 | Ant Design home page |
| Home.jsx v2 (Echarts integration) | Feb 1, 2026 | Architecture rebuild |
| Home.jsx v3 (AuroraHero + scroll snap) | Feb 28, 2026 | Full GSAP-powered home |
| Home.jsx v4 (with i18n + Lenis) | Mar 14, 2026 | Current Home.jsx (v5, final) |

---

## 🤖 Knowza AI

> Knowza AI is a **separate product** from the LMS. The items below reflect permanent archival of the old client-side Gemini integration.

- **Client-Side Gemini Chat Archived:** `AIChat.jsx` — the original Gemini-powered client-side chat from v1.2.0 — was permanently removed (`9b43f3f`, Feb 28). The transition is complete: Knowza AI now runs entirely server-side via the `KnowzaAIEngine` built in v2.0.0.
- **Notes Sidebar Archived:** `NotesSidebar.jsx` and `TextSelectionHandler.jsx` — the text-selection memory features that accompanied the original Gemini chat — were also removed (`9b43f3f`, Feb 28). This functionality will return in a more integrated form within the dedicated Knowza AI interface.
- **No new AI endpoints** shipped in this release. The server-side AI engine was stable and unchanged.

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
| Legacy Pages Removed (total) | 12+ |
| Legacy Components Removed (total) | 17+ |
