# 🛰 API Reference (Conceptual Overview)

This document highlights the core REST API paradigms and conceptual endpoints exposed by the Knowza backend services. 

> [!NOTE]
> To protect production security, all endpoints, parameters, and payloads shown here are generalized abstractions and do not represent the exact URL structures or field schemas implemented in the live production system.

All API requests are authenticated using token-based authentication via the `Authorization` header:
```text
Authorization: Bearer <auth_token>
```

---

## 🔑 1. Authentication & Identity

### User Authentication
Verifies credentials and returns session tokens along with high-level user context.

*   **Endpoint:** `POST /api/v1/auth/login`
*   **Request Body:**
    ```json
    {
      "username": "user@example.com",
      "password": "user_password_hash"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token_access": "jwt_access_token_example",
      "token_refresh": "jwt_refresh_token_example",
      "user": {
        "id": 1001,
        "username": "student_demo",
        "email": "user@example.com",
        "role": "student",
        "first_name": "Demo",
        "last_name": "Student",
        "organization_id": 42
      }
    }
    ```

### Retrieve Profile Details
Fetches profile context, active streaks, and gamification balances for the authenticated user.

*   **Endpoint:** `GET /api/v1/auth/profile`
*   **Response (200 OK):**
    ```json
    {
      "id": 1001,
      "first_name": "Demo",
      "last_name": "Student",
      "email": "user@example.com",
      "role": "student",
      "gamification": {
        "balance_stars": 120,
        "experience_points": 4500,
        "active_streak_days": 5
      },
      "settings": {
        "theme": "dark",
        "notifications_enabled": true
      }
    }
    ```

---

## 📝 2. Assessment Sessions & Integrity

### Initialize Assessment Session
Creates a server-authoritative session tracking duration limits and start constraints.

*   **Endpoint:** `POST /api/v1/exams/sessions/start`
*   **Request Body:**
    ```json
    {
      "exam_id": 12
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "session_id": "session_uuid_token",
      "exam_title": "Mathematics Assessment",
      "started_at": "2026-06-05T12:00:00Z",
      "expires_at": "2026-06-05T12:45:00Z",
      "integrity_threshold": 3,
      "total_questions": 20
    }
    ```

### Sync Answer Progress (Progressive Save)
Progressively synchronizes active choices during an exam session to protect against data loss.

*   **Endpoint:** `PUT /api/v1/exams/sessions/sync`
*   **Request Body:**
    ```json
    {
      "session_id": "session_uuid_token",
      "responses": {
        "question_id_101": "answer_choice_A",
        "question_id_102": "answer_choice_C"
      }
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "synchronized",
      "saved_items": 2
    }
    ```

### Log Session Security Event
Reports interface focus events or potential anti-cheat alerts to the backend security auditor.

*   **Endpoint:** `POST /api/v1/exams/violations/report`
*   **Request Body:**
    ```json
    {
      "session_id": "session_uuid_token",
      "event_type": "focus_loss",
      "details": "Client shifted focus from active viewport"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "event_id": 98451,
      "accumulated_events": 2,
      "action": "warn",
      "message": "Focus loss detected. Session will terminate if threshold is exceeded."
    }
    ```

---

## 📊 3. Organization Administration & Limits

### Retrieve Resource Quotas
Queries current tenant limits, subscription tier details, and seat usage stats.

*   **Endpoint:** `GET /api/v1/organizations/limits`
*   **Response (200 OK):**
    ```json
    {
      "tier_name": "Premium License",
      "quotas": {
        "max_student_accounts": 500,
        "max_teacher_accounts": 30,
        "max_branch_managers": 3
      },
      "usage": {
        "active_students": 438,
        "active_teachers": 21,
        "active_branch_managers": 2
      }
    }
    ```
