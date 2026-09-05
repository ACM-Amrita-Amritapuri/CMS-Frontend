# CMS Backend — API Reference

Single source of truth for the frontend, generated from `../CMS-backend/cms` (all modules' `routes.py`, `services.py`, `models.py`, `repository.py`, plus `cms/__init__.py`, `cms/config.py`).

## 1. Conventions

### 1.1 URL prefixes

| Module | Prefix |
|---|---|
| health | *(none)* |
| auth | `/auth` |
| members (profiles) | *(none — routes at root)* |
| admin | `/admin` |
| learning | `/learning` |
| documentation | `/documentation` |
| projects | `/projects` |
| operations | `/operations` |

### 1.2 Standard error envelope

```json
{ "error": { "code": "CODE", "message": "human readable", "details": {} } }
```

### 1.3 Error-code catalog

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid/expired access token |
| `INVALID_CREDENTIALS` | 401 | Login failed, wrong current password, rate-limited login |
| `TOKEN_INVALID` | 401 | Refresh token missing or invalid |
| `TOKEN_EXPIRED` | 401 | Refresh token expired |
| `TOKEN_REVOKED` | 401 | Refresh token revoked or replay detected |
| `PASSWORD_CHANGE_REQUIRED` | 403 | `must_change_password` is true |
| `PROFILE_INCOMPLETE` | 403 | Profile missing real_name/year/branch/about/skills |
| `FORBIDDEN` | 403 | Missing permission, SIG-scope mismatch, hierarchy/ownership violation |
| `NOT_FOUND` | 404 | Resource missing or hidden from caller |
| `CONFLICT` | 409 | Duplicate record, invalid workflow/state transition, capacity full |
| `VALIDATION_ERROR` | 422 | Body shape, unknown fields, bad values, bad query params |
| `INTERNAL_ERROR` | 500 | Unexpected server exception |

### 1.4 Auth gates

- **`require_auth` (full gate)** — 401 on bad token; 403 `PASSWORD_CHANGE_REQUIRED`; 403 `PROFILE_INCOMPLETE` (profile complete = `real_name`, `year`, `branch`, `about`, `skills` all non-empty).
- **`require_auth_no_profile_gate`** — only 401. Used by: `/auth/change-password`, `/auth/users`, `/auth/users/<id>/reset-password`, `/auth/users/<id>/roles`, `/auth/logout-all`, and ALL `/members` profile routes.

### 1.5 Date/time formats

- **Accepted input**: ISO-8601 (`Z` converted to `+00:00`). Learning `deadline_at` requires a timezone; Operations/Projects datetimes accept naive (treated as UTC) or zoned.
- **Returned output**: naive UTC `datetime.isoformat()` — **no timezone suffix** (parse as UTC). `null` when unset.

## 2. Auth token mechanics

| Aspect | Behavior |
|---|---|
| Access token | JWT; TTL **900 s** |
| Sending | `Authorization: Bearer <token>` |
| Refresh token | Opaque; TTL **7 days**; stored hashed |
| Refresh cookie | `refresh_token`; `HttpOnly`, `Secure`, `SameSite=Lax`, **`Path=/auth`** |
| Rotation | `POST /auth/refresh` rotates; replay revokes the whole family (`TOKEN_REVOKED`) |
| `session_version` | In access token, verified per request; bumped by change-password and logout-all |
| Temp password | Valid 24 h; `must_change_password` cleared by change-password |
| Login rate limit | 5 failed attempts per identifier / 15 min → `INVALID_CREDENTIALS` |

## 3. Enums

| Domain | States |
|---|---|
| Roles | `MEMBER`(1) `WEBMASTER`(2) `SIG_CORE`(3, SIG) `SIG_LEAD`(4, SIG) `ADMIN`(5) `SUPER_ADMIN`(6) — global; SIG roles need `sig_id` |
| Permissions | MEMBER: view_self/change_own_password; SIG_CORE: +sig.view_members/content.manage_content; SIG_LEAD: +sig.manage_members/assign roles/members.create_profile; WEBMASTER: content.manage_content; ADMIN: all admin/content/members perms; SUPER_ADMIN: +auth.bypass_ownership |
| Learning publication | `DRAFT`, `PUBLISHED` |
| Learning resource | `MARKDOWN`, `EXTERNAL_LINK` |
| Assignment type | `TEXT`, `LINK` |
| Submission | stored `DRAFT` → `SUBMITTED` → `REVIEWED`; payload state `DRAFT`\|`FINAL` |
| Completion content_type | `LESSON`, `ASSIGNMENT`, `QUIZ` |
| Document state | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED` |
| Proposal state | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` |
| Project state | `PUBLISHED`, `CLOSED` |
| Task state | `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE` (TODO→IN_PROGRESS\|BLOCKED; IN_PROGRESS→TODO\|BLOCKED\|DONE; BLOCKED→TODO\|IN_PROGRESS; DONE terminal) |
| Milestone state | `PLANNED`, `IN_PROGRESS`, `DONE` |
| Showcase state | `DRAFT`, `PUBLISHED` |
| Application state | `PENDING`, `ACCEPTED`, `REJECTED` |
| Invitation state | `PENDING`, `ACCEPTED`, `DECLINED` |
| Announcement state | `DRAFT`, `PUBLISHED`, `EXPIRED` (computed) |
| Event/Meeting state | `DRAFT`, `PUBLISHED`, `CANCELLED` |
| Registration state | `REGISTERED`, `CANCELLED` |
| Attendance method | `MANUAL`, `QR` |
| Recruitment cycle | `DRAFT`, `OPEN`, `CLOSED` |
| Recruitment application | `SUBMITTED`, `UNDER_REVIEW`, `INTERVIEW`, `SELECTED`, `REJECTED`, `WITHDRAWN` (transitions: SUBMITTED→UNDER_REVIEW\|REJECTED\|WITHDRAWN; UNDER_REVIEW→INTERVIEW\|SELECTED\|REJECTED\|WITHDRAWN; INTERVIEW→SELECTED\|REJECTED\|WITHDRAWN) |

## 4. Health

`GET /health` — no auth → `200 { "status": "ok" }`

## 5. Auth

### 5.1 `POST /auth/login`
Body `{ "login", "password" }` → `200 { "access_token", "token_type": "Bearer", "user": { "id", "username", "roll_number", "must_change_password", "role_assignments": [{ "role_code", "sig_id" }] } }` + refresh cookie. Errors: 422, 401 `INVALID_CREDENTIALS`.

### 5.2 `POST /auth/change-password` (no-profile gate)
Body `{ "current_password", "new_password" }` (new ≥ 8 chars, must differ). → `200 { "message" }`. Revokes all refresh tokens, bumps `session_version`, clears `must_change_password`. Errors: 401 `INVALID_CREDENTIALS` (wrong current), 422.

### 5.3 `GET /auth/me` (full gate)
→ `200 { "user": { ...user... } }`. Can return 403 `PASSWORD_CHANGE_REQUIRED` / `PROFILE_INCOMPLETE`.

### 5.4 `POST /auth/refresh`
→ `200 { "access_token", "token_type" }` + rotated cookie. Errors: 401 `TOKEN_INVALID`/`TOKEN_EXPIRED`/`TOKEN_REVOKED`.

### 5.5 `POST /auth/logout` → `200 { "message" }`, clears cookie. No auth required.
### 5.6 `POST /auth/logout-all` (no-profile gate) → `200 { "message" }`, bumps session_version.

### 5.7 `POST /auth/users` (no-profile gate; `auth.create_user`)
Body `{ "username", "roll_number" }` → `201 { "user": { "id", "username", "roll_number" }, "temporary_password" }`. Errors: 403, 422 (duplicate).

### 5.8 `POST /auth/users/<user_id>/reset-password` (`auth.reset_password`)
No body → `200 { "user_id", "temporary_password", "expires_at" }`. Errors: 403, 404.

### 5.9 `PUT /auth/users/<user_id>/roles` (`auth.assign_roles` + hierarchy)
Body `{ "action": "assign"|"revoke", "role_code", "sig_id": int|null }` (sig_id required for SIG roles, forbidden otherwise) → `200 { "message" }`. Errors: 403/404/422.

## 6. Members (profiles)

Profile view (`build_profile_view`):
```json
{ "user_id", "roll_number", "real_name", "year", "branch", "about", "skills": [],
  "interests", "hobbies", "github_url", "linkedin_url", "leetcode_url",
  "codechef_url", "codeforces_url", "hackerrank_url", "is_complete", "created_at",
  "username", "club_role": { "assignments": [], "sig_info": { "3": "AI SIG" } } }
```

- `POST /members` (`members.create_profile`; no-profile gate) — body `{ "roll_number" }` or `{ "username" }` → `201 { "profile", "user" }`. Errors: 403, 409 (exists), 422.
- `GET /members/me` → `200 { "profile" }`; 404 if missing.
- `PUT /members/me` — unknown fields rejected; allowed: `real_name, year (1–4), branch, about, skills (string[]), interests, hobbies, github_url, linkedin_url, leetcode_url, codechef_url, codeforces_url, hackerrank_url` → `200 { "profile" }`.
- `GET /members/<roll_number>` → `200 { "profile" }`; 404.
- `GET /members/<user_id>/portfolio` → `200 { "portfolio": { "profile", "learning_achievements": [{ "id", "path_id", "module_id", "content_type", "content_id", "completed_at" }], "project_contributions": [{ "project_id", "title", "summary", "role_id", "is_lead", "joined_at", "left_at" }], "showcases": [{ showcase }] } }`.

## 7. Admin (full gate + permission)

- `GET /admin/dashboard` (`admin.view_dashboard`) → `200 { "summary": { "total_users", "active_users", "incomplete_profiles", "total_sigs", "active_sigs", "role_counts": {} } }`.
- `GET /admin/sigs` (`admin.manage_sigs`; `limit` 1–100 default 50) → `200 { "sigs": [{ "id", "name", "slug", "is_active" }] }`.
- `POST /admin/sigs` — `{ "name", "slug" }` → `201 { "sig" }`. 409 slug taken.
- `PUT /admin/sigs/<sig_id>` — subset `{ "name", "slug", "is_active" }` → `200 { "sig" }`.
- `GET /admin/members` (`admin.manage_accounts`; `limit`, `is_active=true|false`) → `200 { "members": [{ "id", "username", "roll_number", "is_active", "role_assignments" }] }`.
- `PATCH /admin/members/<user_id>/status` — `{ "is_active": bool }` → `200 { "member" }`. 403 hierarchy / last active SUPER_ADMIN.

## 8. Learning (full gate)

Serialization:
```json
// path: { "id", "title", "slug", "description", "sig_id", "publication_state" }
// module/lesson: { "id", "title", "slug", "position", "publication_state" }
// resource: { "id", "title", "resource_type", "content", "external_url", "position", "publication_state" }
// assignment: { "id", "title", "instructions", "assignment_type", "position", "deadline_at", "publication_state" }
// quiz: { "id", "title", "instructions", "position", "publication_state", "questions": [{ "id", "prompt", "choices": [], "position", "correct_choice"(owner only) }] }
// submission: { "id", "assignment_id", "submission_state", "content", "external_url", "submitted_at", "feedback", "score", "reviewed_at" }
```
Members see only fully-published hierarchies; owners/managers see drafts. Mutations need `content.manage_content` scoped to path `sig_id` + ownership (or bypass).

- `GET /learning/paths` (`limit`) → `200 { "paths" }`. Authors see own drafts; others see published.
- `POST /learning/paths` — `{ "title", "slug", "description"?, "sig_id"? }` → `201 { "path" }`.
- `GET /learning/paths/<path_id>` → `200 { "path": { ...path, "modules": [{ ...module, "lessons": [{ ...lesson, "resources": [] }], "assignments": [], "quizzes": [] }] } }`.
- `PATCH /learning/paths/<path_id>` — either `{ "publication_state": "PUBLISHED" }` alone, or subset `{ "title", "description" }` (draft only).
- `POST /learning/paths/<path_id>/modules` — `{ "title", "slug", "position" }` → `201 { "module" }`. PATCH `/learning/modules/<id>`: publish alone or `{ "title", "position" }`.
- `POST /learning/modules/<module_id>/lessons` → `201 { "lesson" }`. PATCH `/learning/lessons/<id>`: same rules.
- `POST /learning/lessons/<lesson_id>/resources` — `{ "title", "resource_type", "position", "content" | "external_url" }` (content XOR external_url) → `201 { "resource" }`. PATCH `/learning/resources/<id>`: publish alone or draft edit of `{ "title", "position", "resource_type", "content", "external_url" }`.
- `POST /learning/modules/<module_id>/assignments` — `{ "title", "instructions", "assignment_type", "position", "deadline_at" (ISO WITH timezone | null) }` → `201 { "assignment" }`. PATCH `/learning/assignments/<id>`: publish alone or `{ "title", "instructions", "position", "deadline_at" }`.
- `POST /learning/assignments/<assignment_id>/submissions` — `{ "submission_state": "DRAFT"|"FINAL", "content" | "external_url" }`; FINAL requires the value; deadline checked; resubmit from DRAFT/REVIEWED only → `201 { "submission" }`. 409 active submission exists.
- `PATCH /learning/submissions/<submission_id>/review` (path mutation rights) — `{ "feedback", "score" (0–100) }` optional; only SUBMITTED → `200 { "submission" }`; auto-creates completion.
- `POST /learning/modules/<module_id>/quizzes` — `{ "title", "instructions", "position" }` → `201 { "quiz" }`. PATCH `/learning/quizzes/<id>`: publish alone or `{ "title", "instructions", "position" }`.
- `GET /learning/quizzes/<quiz_id>` → `200 { "quiz" }` (owner sees `correct_choice`).
- `POST /learning/quizzes/<quiz_id>/questions` — `{ "prompt", "choices" (2–100 strings), "correct_choice" (0-based), "position" }` → `201 { "question" }`.
- `POST /learning/quizzes/<quiz_id>/attempts` — `{ "answers": { "<question_id>": <choice_index> } }` (exact key set) → `201 { "attempt": { "quiz_id", "score", "total_questions" } }`.
- `POST /learning/lessons/<lesson_id>/complete` → `200 { "message" }` (idempotent).
- `GET /learning/paths/<path_id>/progress` → `200 { "progress": { "path_id", "completed_items", "total_items", "percent_complete", "modules": [{ "module_id", "completed_items", "total_items", "percent_complete" }] } }`.

## 9. Documentation (full gate)

Document (full): `{ "id", "title", "summary", "category", "tags": [], "body", "sig_id", "owner_user_id", "state", "review_comment", "reviewed_by_user_id", "reviewed_at" }`. Search results omit `body`. Revision: `{ "id", "revision_number", "title", "summary", "category", "body", "created_by_user_id", "created_at" }`. Non-published docs visible to owner/SIG managers only (else 404).

- `GET /documentation/documents` (`limit` digits 1–100) → `200 { "documents" }`.
- `POST /documentation/documents` — `{ "title", "body", "summary"?, "category"?, "tags"? (≤20), "sig_id"? }` → `201 { "document" }` (revision #1 created).
- `GET /documentation/documents/<id>` → `200 { "document" }`.
- `PATCH /documentation/documents/<id>` — owner only, DRAFT/REJECTED only; subset `{ "title", "summary", "body", "category", "tags", "sig_id" }` → `200 { "document" }` (new revision).
- `POST /documentation/documents/<id>/<action>` — action `submit` (owner: DRAFT/REJECTED→SUBMITTED), `publish` (manager: APPROVED→PUBLISHED), `archive` (manager: PUBLISHED→ARCHIVED), `restore` (manager: ARCHIVED→DRAFT) → `200 { "document" }`; invalid transition 409.
- `POST /documentation/documents/<id>/review` (SIG manager; not own doc) — `{ "decision": "APPROVE"|"REJECT", "comment" (required) }` → `200 { "document" }`.
- `GET /documentation/documents/<id>/revisions` → `200 { "revisions" }`.
- `GET /documentation/search` (`q`, `tag`, `category`, `limit`) — published only → `200 { "documents" }` (no body).

## 10. Projects (full gate)

Serialization: proposal `{ "id", "title", "summary", "description", "sig_id", "team_capacity", "state", "project_id", "reviewed_by_user_id" }`; role `{ "id", "title", "description", "capacity", "required_skills": [] }`; application `{ "id", "project_id", "role_id", "applicant_user_id", "note", "state", "reviewed_by_user_id" }`; invitation `{ "id", "project_id", "role_id", "member_user_id", "state", "expires_at" }`; task `{ "id", "project_id", "created_by_user_id", "assignee_user_id", "title", "description", "state", "due_at", "blocker", "weekly_update" }`; milestone `{ "id", "project_id", "created_by_user_id", "title", "description", "state", "due_at" }`; membership `{ "id", "project_id", "role_id", "member_user_id", "accepted_by_user_id", "left_at" }`; showcase `{ "id", "project_id", "summary", "technology", "outcomes", "repository_url", "demo_url", "deployment_url", "media_url", "state", "published_at", "team_user_ids": [] }`.

Full project: `{ "id", "title", "summary", "description", "sig_id", "lead_user_id", "team_capacity", "state", "progress", "roles": [], "team_memberships": [], "applications": [] }`. Lead sees all applications; others see own.

- `POST /projects/proposals` — `{ "title", "summary", "description", "sig_id"?, "team_capacity" (1–100) }` → `201 { "proposal" }`.
- `PATCH /projects/proposals/<id>` — proposer only, DRAFT/REJECTED; subset of same fields → `200 { "proposal" }`.
- `POST /projects/proposals/<id>/submit` — DRAFT/REJECTED→SUBMITTED → `200 { "proposal" }`.
- `POST /projects/proposals/<id>/review` (SIG manager; not own) — `{ "decision": "APPROVE"|"REJECT" }`; APPROVE publishes the project → `200 { "proposal" }`.
- `GET /projects/proposals` (`limit`) → `200 { "proposals" }` (own + manageable).
- `GET /projects` (`limit`) — published only → `200 { "projects" }`.
- `GET /projects/<id>` → `200 { "project" }`; hidden else 404.
- `POST /projects/<id>/roles` (lead only; PUBLISHED) — exactly `{ "title", "description", "capacity" (≤ team_capacity), "required_skills" }` → `201 { "role" }`.
- `POST /projects/<id>/tasks` (lead or member) — subset `{ "title" (req), "description", "assignee_user_id", "due_at", "state", "blocker", "weekly_update" }` → `201 { "task" }`.
- `PATCH /projects/tasks/<id>` (creator/assignee/lead) — same subset; state must follow transition map (else 409) → `200 { "task" }`.
- `POST /projects/<id>/applications` — exactly `{ "role_id", "note"? }`; not lead/member; capacity checked → `201 { "application" }`.
- `POST /projects/applications/<id>/review` (lead) — exactly `{ "decision": "ACCEPT"|"REJECT" }` → `200 { "application" }`.
- `POST /projects/<id>/invitations` (lead) — `{ "role_id", "member_user_id", "expires_at"? (default +7d) }` → `201 { "invitation" }`.
- `POST /projects/invitations/<id>/respond` (invitee) — exactly `{ "decision": "ACCEPT"|"DECLINE" }`; PENDING + not expired → `200 { "invitation" }`.
- `POST /projects/<id>/milestones` (lead/member) — subset `{ "title" (req), "description", "due_at", "state" }` → `201 { "milestone" }`.
- `POST /projects/<id>/showcase` (lead or SIG manager) — `{ "summary" (req), "technology" (req), "outcomes" (req), "repository_url"?, "demo_url"?, "deployment_url"?, "media_url"?, "state"? }` (upserts single showcase) → `201 { "showcase" }`.
- `GET /projects/showcases/<id>` → `200 { "showcase" }` (published public; drafts lead/manager).
- `POST /projects/<id>/leave` (active member) → `200 { "membership" }` (sets `left_at`).
- `DELETE /projects/memberships/<membership_id>` (lead; not the lead) → `200 { "membership" }`.

## 11. Operations (full gate)

Serialization: announcement `{ "id", "title", "body", "sig_id", "author_user_id", "state", "expires_at", "published_at" }`; event `{ "id", "title", "description", "sig_id", "owner_user_id", "starts_at", "ends_at", "location", "external_url", "capacity", "registered_count", "kind": "EVENT", "state", "published_at", "cancelled_at" }`; registration `{ "id", "event_id", "member_user_id", "state", "registered_at", "cancelled_at" }`; attendance `{ "id", "event_id", "member_user_id", "recorded_by_user_id", "method", "attended_at" }`; feedback `{ "id", "event_id", "member_user_id", "rating", "comment", "created_at", "updated_at" }`; cycle `{ "id", "title", "description", "sig_id", "owner_user_id", "opens_at", "closes_at", "state" }`; recruitment application `{ "id", "cycle_id", "applicant_user_id", "preferred_sig_id", "statement", "state", "reviewer_user_id", "evaluation_score", "evaluation_notes", "interview_at", "interview_notes", "reviewed_at" }`; meeting `{ "id", "event": { ...event... }, "project_id", "agenda", "minutes_document_id" }`.

- Announcements: `POST /operations/announcements` `{ "title", "body", "sig_id"?, "expires_at"? }` → 201; `PATCH .../<id>` (manager, draft only); `POST .../<id>/publish`; `GET /operations/announcements` (`limit`, `include_drafts=true`); `GET .../<id>`.
- Events: `POST /operations/events` `{ "title", "description"?, "sig_id"?, "starts_at", "ends_at" (> starts), "location"?, "external_url"?, "capacity" (1–10000) }` → 201; `PATCH .../<id>` (draft only; capacity ≥ registered); `POST .../<id>/publish`; `POST .../<id>/cancel` (any state, idempotent); `GET /operations/events` (`limit`, `include_drafts`); `GET .../<id>`.
- Registrations: `POST /operations/events/<id>/registrations` (PUBLISHED + future start; capacity + duplicate checked) → `201 { "registration" }`; `DELETE /operations/registrations/<registration_id>` → `200 { "registration" }`.
- Attendance: `POST /operations/events/<id>/attendance` (manager) — exactly `{ "member_user_id", "method": "MANUAL"|"QR" }` → `201 { "attendance" }`; duplicate 409. `GET .../attendance` (managers all; members own) → `200 { "attendance": [] }`.
- Feedback: `POST /operations/events/<id>/feedback` (registered, event ended, not cancelled) — `{ "rating" (1–5), "comment"? }` (upserts) → `201 { "feedback" }`.
- Calendar: `GET /operations/calendar?start=&end=&limit=` (both required; start ≤ end) — events overlapping window → `200 { "calendar": [ ...event... ] }`.
- Recruitment: `POST /operations/recruitment/cycles` `{ "title", "description"?, "sig_id"?, "opens_at", "closes_at" (> opens) }` → 201; `PATCH .../<cycle_id>` (draft only); `POST .../<cycle_id>/open` (DRAFT→OPEN); `POST .../<cycle_id>/close` (OPEN→CLOSED); `GET .../cycles` (`limit`); `POST .../<cycle_id>/applications` (OPEN + within window; one per member) `{ "statement", "preferred_sig_id"? }` → 201; `GET .../<cycle_id>/applications` (manager) → `200 { "applications" }`; `PATCH /operations/recruitment/applications/<id>` — exactly one of: `{ "reviewer_user_id": int }` (assign), `{ "decision": "REVIEW"|"INTERVIEW"|"SELECT"|"REJECT"|"WITHDRAW" }` (state machine), or evaluation subset `{ "evaluation_score", "evaluation_notes", "interview_at", "interview_notes" }` → `200 { "application" }`.
- Meetings: `POST /operations/meetings` `{ "title", "starts_at", "ends_at", "agenda" (req); "description"?, "sig_id"?, "project_id"?, "location"?, "external_url"?, "capacity"?, "minutes_document_id"? (PUBLISHED doc of same SIG) }` → 201; `PATCH .../<id>` (manager; draft only); `GET /operations/meetings` (`limit`, `include_drafts`); `GET .../<id>`.

## 12. Query parameters

| Endpoint | Params |
|---|---|
| `GET /admin/sigs` | `limit` 1–100 (default 50) |
| `GET /admin/members` | `limit` 1–100, `is_active` true\|false |
| `GET /learning/paths` | `limit` 1–100 |
| `GET /documentation/documents` | `limit` digits 1–100 |
| `GET /documentation/search` | `q`, `tag`, `category`, `limit` |
| `GET /projects`, `GET /projects/proposals` | `limit` digits 1–100 |
| `GET /operations/announcements` / `events` / `meetings` | `limit` 1–100, `include_drafts=true` |
| `GET /operations/calendar` | `start`, `end` (required), `limit` 1–100 (default 100) |
| `GET /operations/recruitment/cycles` | `limit` 1–100 |

Most write endpoints reject unknown fields — keep forms aligned to the exact payloads above.
