# Security Policy

We take the security of Knowza, our users, and educational institutions extremely seriously. As a server-authoritative testing and SaaS management platform, maintaining strong boundaries around user data, payments, and test integrity is our top priority.

---

## Supported Versions

Only the latest active release branch is supported with security updates.

| Version | Supported |
| ------- | --------- |
| v2.x    | ✅ Yes     |
| v1.x    | ❌ No      |

---

## Reporting a Vulnerability

If you discover a security vulnerability within the Knowza ecosystem, please **do not open a public issue**. Instead, report it privately to our team to allow us to resolve it before disclosure.

1.  **Email Us:** Send a detailed report to **knowzasupport@gmail.com**.
2.  **What to Include:**
    *   A descriptive title detailing the nature of the vulnerability (e.g., "SQL Injection in API attempts endpoint").
    *   A step-by-step proof of concept (PoC) to reproduce the issue.
    *   An assessment of the impact (e.g., horizontal privilege escalation, database access, anti-cheat bypass).
    *   Any potential remediation suggestions.
3.  **Response Time:** You will receive an acknowledgment of your report within 24 hours. We aim to provide a resolution or patch within 7-14 business days, depending on severity.

---

## Our Core Security Principles

1.  **Server-Authoritative Control:** The browser is never trusted for test duration, question scoring, limit verification, or cheat bans.
2.  **Strict Isolation (Multi-Tenancy):** Institution data filters must be enforced in the queryset selector layer to prevent horizontal cross-school leaks.
3.  **Encrypted Configurations:** Secret keys, database passwords, Appwrite client configurations, and SMTP email credentials must reside strictly in `.env` configurations and never be committed to repository logs.
4.  **Role Enforcement:** Platform Owners, Admins, Teachers, and Students must be authenticated using secure JWT access tokens and validated via role mixins at the view level.
