# 🛰 API Reference

This document highlights the key API endpoints exposed by the Knowza Django REST Framework backend (`Django-Test-App-Backend`).

All requests must contain an `Authorization` header with a valid JWT token:
```text
Authorization: Bearer <your_jwt_access_token>
```

---

## 🔑 1. Authentication Endpoints

### User Login
Authenticate credentials and return JWT session tokens.

*   **Endpoint:** `POST /api/users/login/`
*   **Request Body:**
    ```json
    {
      "username_or_email": "student@knowza.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": "access_token_jwt_hash",
      "refresh": "refresh_token_jwt_hash",
      "user": {
        "id": "KNZ-982736",
        "username": "student_johndoe",
        "email": "student@knowza.com",
        "role": "student",
        "first_name": "John",
        "last_name": "Doe",
        "organization_id": 4,
        "is_online": true
      }
    }
    ```

### Retrieve Profile Info
Retrieve or update the active user's profile details.

*   **Endpoint:** `GET /api/users/me/`
*   **Response (200 OK):**
    ```json
    {
      "id": "KNZ-982736",
      "first_name": "John",
      "last_name": "Doe",
      "email": "student@knowza.com",
      "role": "student",
      "stars_count": 120,
      "xp_count": 4500,
      "streak_count": 5,
      "premium_status": "premium_tier_1",
      "is_online": true
    }
    ```

---

## 📝 2. Test Sessions & Integrity

### Start Test Session
Initialize a server-authoritative session for taking a test.

*   **Endpoint:** `POST /api/sessions/start_session/`
*   **Request Body:**
    ```json
    {
      "test_id": 12
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "session_id": "ses-abc123xyz",
      "test_title": "Algebra Math Exam",
      "started_at": "2026-06-05T12:00:00Z",
      "expires_at": "2026-06-05T12:45:00Z",
      "allowed_violations": 3,
      "questions_count": 20
    }
    ```

### Sync Answers (Progressive Save)
Save selections/answers progressively during an active session.

*   **Endpoint:** `PUT /api/sessions/update_answers/`
*   **Request Body:**
    ```json
    {
      "session_id": "ses-abc123xyz",
      "answers": {
        "question_101": "A",
        "question_102": "C"
      }
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "synchronized",
      "saved_answers_count": 2
    }
    ```

### Log Cheat Violation
Notify backend of focus loss, blur, or tab-switch violations.

*   **Endpoint:** `POST /api/test-violations/report/`
*   **Request Body:**
    ```json
    {
      "session_id": "ses-abc123xyz",
      "violation_type": "tab_switch",
      "details": "User shifted focus from testing page"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "violation_id": 451,
      "current_violations_count": 2,
      "status": "warning",
      "message": "Tab switching detected. Warning 2 of 3."
    }
    ```

---

## 📊 3. Admin & Tariffs

### My Limits
Retrieve current SaaS quotas and resource usage details for the active institution admin.

*   **Endpoint:** `GET /api/admin-tariffs/my_limits/`
*   **Response (200 OK):**
    ```json
    {
      "tariff_name": "Premium School Plan",
      "limits": {
        "max_students": 500,
        "max_teachers": 30,
        "max_sub_admins": 3
      },
      "usage": {
        "current_students": 438,
        "current_teachers": 21,
        "current_sub_admins": 2
      }
    }
    ```
