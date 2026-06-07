# Contributing to Knowza

Thank you for your interest in contributing to the Knowza Educational Platform! We welcome contributions from developers, designers, educators, and writers.

As a multi-role EdTech ecosystem, keeping code modular, secure, and clean is critical to our product integrity.

---

## 🛠 Codebase Architecture & Standards

Knowza is split into two main systems:
1.  **Frontend SPA (`Knowza`):** React 19, Vite, Tailwind CSS, TanStack React Query, Ant Design.
2.  **Backend REST API (`Knowza-Backend`):** Django 5, Django REST Framework, JWT, PostgreSQL.

### Frontend Development Guidelines

*   **State Management:** Always use TanStack React Query for server-side state synchronizations. Local state should be managed with standard React Hooks (`useState`, `useReducer`, or React Context for global structures).
*   **Aesthetics and CSS:** We prioritize premium UX. Use standard Tailwind CSS classes or native CSS styles rather than unstructured, inline styling. Ensure smooth micro-animations using GSAP or Framer Motion for interactive modules.
*   **Component Structure:** Place reusable widgets in `src/components/ui/` and dashboard pages inside `src/pages/Knowza Test Platform/`.
*   **Localization:** Knowza supports English (`en`), Russian (`ru`), and Uzbek (`uz`). All user-facing strings must utilize `i18next` hooks (`t('translation_key')`). Do not hardcode raw text in React templates.

### Backend Development Guidelines

*   **Strict Security & Tenant Scoping:** Ensure database operations restrict querysets to the user's active tenant (institution organization scope). Non-admin roles must never access cross-tenant data.
*   **SQL Optimizations (N+1 avoidance):** Always inspect query metrics when listing resources. Utilize `.select_related()` and `.prefetch_related()` inside selectors and managers to prevent heavy database hits.
*   **API Conventions:** Follow REST principles. Return descriptive HTTP status codes:
    *   `200 OK` / `201 Created` for successful mutations.
    *   `400 Bad Request` for validation errors.
    *   `401 Unauthorized` / `403 Forbidden` for auth and role failures.
    *   Provide unified validation structures for forms (e.g., matching the frontend toast formats).
*   **Tests:** Add automated tests in `api/tests.py` covering permissions, tariff limitations, and the test session anti-cheat mechanics.

---

## 🚀 Branching Model & Workflow

We follow a structured Git workflow:

1.  **Fork & Clone:** Fork the respective repository and clone it locally.
2.  **Branch Naming:** Create a feature branch matching the format:
    *   `feat/feature-name` for new user capabilities.
    *   `fix/bug-name` for resolutions.
    *   `refactor/refactor-name` for architectural cleanups.
    *   `docs/doc-name` for documentation enhancements.
3.  **Local Validation:** Before committing, verify that:
    *   The frontend builds without warnings: `npm run build`.
    *   All backend tests pass: `python manage.py test`.
4.  **Commits:** Write clear, conventional commit messages (e.g., `feat: implement session expiry auto-relogin UI`).

---

## 👥 Need Help?

If you have questions, feel free to open an issue in the respective repository or email the core maintainers at **knowzasupport@gmail.com**.

Happy coding! 🎓
