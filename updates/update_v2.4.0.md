# 🚀 Update v2.4.0 — Schedule System, Pricing Overhaul & Classroom Management

**Release Period:** June 1 – June 2, 2026  
**Commits:** ~6 (Frontend) · ~8 (Backend)

---

## 🎯 Release Goal

Launch the classroom and schedule management system with form-based CRUD interfaces, overhaul the pricing model by removing resource limits and reducing costs, implement the user profile self-service endpoint, and standardize the global UI styling system.

---

## 🛠 Features & Capabilities Introduced

### Frontend (`Test-App`)

- **ScheduleForm & ClassroomForm:** Built dedicated form components with full navigation, API integration, and validation for managing schedule time slots and classroom records (`f661da2`, Jun 1).
- **Tariff Feature List Redesign:** Updated the pricing plan feature list UI with real-time data by disabling pricing cache (`24f69e2`, Jun 1).
- **Global Styling Standardization:** Unified the CSS design system and standardized UI components across all platform pages for visual consistency (`72245d9`, Jun 2).
- **Delete Loading States:** Added loading indicators for delete operations to prevent double-clicks and improve UX feedback (`229997c`, Jun 2).
- **Classroom List Filtering:** Implemented client-side search and filtering for the classroom list view (`229997c`, Jun 2).

### Backend (`Django-Test-App-Backend`)

- **Bulk Classroom Import:** Added a `bulk_import` action to the Classroom ViewSet with tariff quota enforcement (`ce8e55f`, Jun 1).
- **Pricing Model Overhaul:** Removed all resource limits on subjects, rooms, and groups. Significantly reduced dynamic pricing and tariff costs to accelerate adoption (`ed563b1`, Jun 1).
- **Unlimited Feature Labels:** Updated all feature strings in serializer representations to display "Unlimited" status (`3121743`–`f5f5e27`, Jun 1).
- **Price Logic Removal:** Stripped the dynamic price modification logic from serializers, simplifying the billing pipeline (`f5f5e27`, Jun 1).
- **Curator Class Uniqueness:** Enforced uniqueness of curator class assignments per admin and implemented automatic clearing when the feature is disabled (`7bcd11b`, Jun 1).
- **`/me/` Profile Endpoint:** Implemented a self-service endpoint for authenticated user profile retrieval and updates, reducing unnecessary admin API calls (`0f78644`, Jun 2).

---

## 🗑 Deletions & Cleanups

- **Resource Limit Restrictions Removed:** Subjects, rooms, and groups are now unlimited across all tariff tiers (`ed563b1`, Jun 1).
- **Dynamic Pricing Logic Removed:** The complex per-unit pricing calculation was stripped from serializers (`f5f5e27`, Jun 1).
- **Pricing Cache Disabled:** Real-time pricing data is now always fetched fresh (`24f69e2`, Jun 1).

---

## 📊 Stats

| Metric | Count |
| --- | --- |
| Frontend Commits | ~6 |
| Backend Commits | ~8 |
| New Form Components | 2 (ScheduleForm, ClassroomForm) |
| Pricing Changes | Unlimited resources, reduced costs |
| Active Development Days | 2 |
