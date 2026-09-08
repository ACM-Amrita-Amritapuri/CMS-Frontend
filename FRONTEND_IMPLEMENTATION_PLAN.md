# CMS Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the CMS frontend as a responsive Next.js application that consumes the backend REST contract at commit `eec9ff33e7487c5bec71ce671214d243e5f01e3b`, covering authentication, profiles, administration, learning, documentation, member portfolios, team-based project progress, and internal event planning/calendar workflows.

**Architecture:** Use the Next.js App Router with TypeScript. Protected pages run through a client-side session provider because the short-lived access token must remain in memory; the browser sends the HTTP-only refresh cookie through `credentials: "include"`. Use a typed API boundary and TanStack Query for request caching/invalidation, with route guards and capability helpers controlling navigation visibility while the backend remains the final authorization authority. GitHub and web-source progress collection is server-owned and exposed to the frontend as normalized snapshots; event planning uses normal event/document APIs and a CSV-compatible spreadsheet workflow.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules and global CSS design tokens, TanStack Query, React Hook Form, Zod, Vitest, Testing Library, MSW, Playwright, Flask, and SQLAlchemy.

**Spec:** `../CMS-backend/BACKEND_FRONTEND_INTEGRATION_PLAN.md`, validated against backend commit `eec9ff33e7487c5bec71ce671214d243e5f01e3b` on `origin/dev`. The scope amendments in this plan supersede that document’s older project-proposal, event-participant, and recruitment-release assumptions.

## Phase 0 — Contract and deployment lock

This phase is complete when the frontend implementation uses the following decisions as its contract:

- Backend reference: `eec9ff33e7487c5bec71ce671214d243e5f01e3b` on `origin/dev`. The older backend integration document is supporting context; route source at that commit is authoritative when they differ.
- App Router root: `src/app/`. Route groups are under `src/app`, not a second root-level `app` tree.
- Deployment topology: same-origin frontend/backend through a reverse proxy is the default. The backend has no CORS configuration, and its refresh cookie is `Secure`, `HttpOnly`, `SameSite=Lax`, and scoped to `/auth`; a cross-origin deployment therefore requires an explicit HTTPS CORS/cookie configuration change in the backend.
- Local development: configure `BACKEND_ORIGIN` for the same-origin proxy, or use an HTTPS backend configuration, before testing refresh-cookie behavior. Direct cross-origin development is not treated as a valid auth smoke environment.
- Onboarding: newly created accounts have a blank initialized profile, so `/members/me` GET/PUT is the normal setup path. `POST /members` is reserved for privileged repair of a genuinely missing legacy profile.
- Time: backend timestamps without an offset are UTC and must be parsed as UTC before local rendering; outbound date-times are ISO-8601.
- Authorization: UI capabilities are derived from `{ role_code, sig_id }`, with SIG roles evaluated against the selected SIG. The server remains authoritative for every protected request.
- Phase 1 scope: only the runnable shell, API error/client boundary, in-memory access-token session store, and their tests. Query caching, forms, validation, mocks, and browser journeys enter with the first feature that needs them.
- Project scope: projects are existing/direct project records; the frontend does not provide proposal submission or proposal review. Team formation remains in scope, and project work items are the primary progress record.
- Project integrations: GitHub and approved web-source progress collection runs on the backend. The frontend consumes normalized snapshots, last-sync state, and actionable failures; it never scrapes third-party sites in the browser.
- Operations scope: Operations is an internal event-planning workspace with announcements, meetings, event drafts/publication, related documentation, and Calendar. Event registration, attendance capture, and post-event feedback are out of this release.
- Recruitment scope: recruitment is deferred to a later release and is not a dependency of the current frontend or release gate.
- Spreadsheet scope: start with browser-native CSV import/export that Excel can open; do not add an XLSX parser or external spreadsheet integration until a separate requirement justifies it.

- [x] Contract and deployment assumptions recorded.
- [x] Backend reference and route authority recorded.
- [x] Phase 1 scope reduced to the minimum runnable foundation.

## Global Constraints

- Use the backend’s unversioned paths exactly: `/auth`, `/members`, `/admin`, `/learning`, `/documentation`, `/projects`, `/operations`, and `/health`.
- Configure one `NEXT_PUBLIC_API_BASE_URL`; do not hard-code a deployment host in components.
- Send `credentials: "include"` on every API request and `Authorization: Bearer <access_token>` only when an in-memory access token exists.
- Never read, store, display, log, or put the refresh token in application state; it is HTTP-only and scoped by the backend to `/auth`.
- Keep the access token in memory, clear it on logout, logout-all, failed refresh, or session-version invalidation, and clear TanStack Query caches with the session.
- On one protected-request `401`, call `/auth/refresh` once through a single-flight refresh lock, retry the original request once, then sign out if refresh fails. Never retry login, validation, permission, not-found, conflict, or `422` responses.
- Preserve the backend envelope names (`user`, `profile`, `path`, `documents`, `projects`, `announcements`, `events`, `meetings`, `error`) and do not assume `200` and `201` responses have the same shape.
- Treat `PASSWORD_CHANGE_REQUIRED` and `PROFILE_INCOMPLETE` as workflow states, not generic permission failures.
- Render UTC server timestamps in the browser’s local timezone and send form timestamps as ISO-8601 strings.
- Show readable server messages, but never expose stack traces, raw database errors, refresh tokens, temporary passwords after the one-time display, or request secrets.
- Do not implement binary uploads, video processing, code execution, notifications, websockets, email, or client-side scraping. GitHub/web-source synchronization is a backend integration with explicit source validation, rate limits, and stale/error states.
- Hide unavailable navigation and actions with capability helpers, but handle a server `403` on every protected mutation because permissions can change after page load.
- Every screen must have loading, empty, error, success, keyboard-focus, and mobile states appropriate to its content.

---

## Backend Contract Used by the Frontend

### Session and account states

`POST /auth/login` returns `{ access_token, token_type, user }`; `user` contains `id`, `username`, `roll_number`, `must_change_password`, and `role_assignments` with `{ role_code, sig_id }`. The response also sets the HTTP-only refresh cookie.

`POST /auth/refresh` returns only `{ access_token, token_type }` and rotates the refresh cookie. `GET /auth/me` returns `{ user }` only after the password and profile gates are satisfied. `POST /auth/change-password` invalidates existing sessions, so the frontend must clear the current access token and send the user through login again after success.

New accounts are created by administrators through `POST /auth/users` and return a one-time `temporary_password`. There is no public registration page. Profile routes remain available during onboarding: `GET /members/me`, `PUT /members/me`, and, only for a missing profile, `POST /members`.

### Current list behavior

- `GET /documentation/documents?limit=1..100` returns authorized documents, including private workflow records visible to the current content manager; ordinary members see published records.
- `GET /operations/announcements`, `/operations/events`, and `/operations/meetings` accept `limit=1..100` and `include_drafts=true`; private records are returned only when the backend authorizes the actor. Omit the flag for public/published views.
- `GET /documentation/search?q=&tag=&category=&limit=` searches published documents and returns `{ documents }`.
- `GET /projects` returns published/direct project records with team, work-item, showcase, and integration-progress data needed by the tracking screens.
- Learning list/detail reads expose published content to ordinary members and authorized drafts to content managers.

### Write payloads

Keep forms aligned with the backend’s accepted fields:

```text
Login:        login, password
Password:     current_password, new_password
Profile:      real_name, year, branch, about, skills, interests, hobbies,
              github_url, linkedin_url, leetcode_url, codechef_url,
              codeforces_url, hackerrank_url
SIG:          name, slug, is_active
Path:         title, slug, description, sig_id
Module:       title, slug, position
Lesson:       title, slug, position
Resource:     title, resource_type, content, external_url, position
Assignment:   title, instructions, assignment_type, position, deadline_at
Submission:   submission_state, content, external_url
Review:       feedback, score
Quiz:         title, instructions, position
Question:     prompt, choices, correct_choice, position
Attempt:      answers
Project:      title, summary, description, sig_id, team_capacity, project_state
Document:     title, summary, body, category, tags, sig_id
Doc review:   decision, comment
Project role: title, description, capacity, required_skills
Application:  role_id, note
Invitation:   role_id, member_user_id, expires_at
Task:         title, description, assignee_user_id, due_at, state, blocker, weekly_update
Milestone:    title, description, due_at, state
Showcase:     summary, technology, outcomes, repository_url, demo_url,
              deployment_url, media_url, state
Announcement: title, body, sig_id, expires_at
Event:        title, description, sig_id, starts_at, ends_at, location,
              external_url, capacity, planning_document_id
Meeting:      title, description, sig_id, project_id, starts_at, ends_at,
              location, external_url, capacity, agenda, minutes_document_id
```

Use these backend enums in shared TypeScript types: `MEMBER`, `SIG_CORE`, `SIG_LEAD`, `WEBMASTER`, `ADMIN`, `SUPER_ADMIN`; publication states `DRAFT`, `PUBLISHED`; resource types `MARKDOWN`, `EXTERNAL_LINK`; assignment types `TEXT`, `LINK`; submission states `DRAFT`, `FINAL`; project task states `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`; showcase states `DRAFT`, `PUBLISHED`; documentation decisions `APPROVE`, `REJECT`; invitation decisions `ACCEPT`, `DECLINE`; progress source types `GITHUB`, `WEB`; progress sync states `HEALTHY`, `STALE`, `ERROR`.

## Planned Route Structure

```text
  src/app/
  (public)/login
  (account)/change-password
  (account)/profile/setup
  (app)/dashboard
  (app)/profile
  (app)/members/[rollNumber]
  (app)/portfolio/[userId]
  (app)/learning
  (app)/learning/paths/[pathId]
  (app)/documentation
  (app)/documentation/[documentId]
  (app)/projects
  (app)/projects/[projectId]
  (app)/operations
  (app)/operations/events/[eventId]
  (app)/operations/meetings/[meetingId]
  (app)/admin
  (app)/admin/sigs
  (app)/admin/members
  (app)/admin/accounts
```

Protected route layouts must not depend on a token in server middleware because the token intentionally lives in browser memory. The `(app)` layout mounts `SessionProvider`, bootstraps `/auth/me` through the API client, and renders a loading state until the session decision is known.

---

## Phase 1 — Foundation and API runtime

### Task 1: Scaffold the frontend foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/styles/tokens.css`, `src/components/ui/VisuallyHidden.tsx`
- Create: `vitest.config.ts`, `tests/setup.ts`
- Test: `tests/smoke/app-shell.test.tsx`

**Interfaces:**
- Produces a runnable Next.js App Router project with TypeScript path alias `@/*`, a global font/color/spacing token layer, and Bun commands `bun run lint`, `bun run test`, `bun run test:e2e`, and `bun run build`.

- [x] **Step 1: Add the project dependencies and scripts.** Use Bun (`bun install`) with only Next.js, React, TypeScript types, ESLint, Vitest, and Testing Library needed by the foundation. Add workflow dependencies (TanStack Query, React Hook Form, Zod, MSW, and Playwright) in the phase that first uses each one. Define scripts that run through Bun without hiding failures.
- [x] **Step 2: Add the root layout and design tokens.** Set document metadata, responsive viewport behavior, base background/text colors, focus-ring styles, semantic status colors, form controls, buttons, cards, tables, and mobile breakpoints. Keep reusable primitives style-agnostic and accessible.
- [x] **Step 3: Add the first smoke test.** Render the root page and assert that the application title and primary navigation placeholder are present without requiring a backend session.
- [x] **Step 4: Run the foundation checks.** Run `bun run lint`, `bun run test --run tests/smoke/app-shell.test.tsx`, and `bun run build`; all three must pass.
- [x] **Step 5: Commit the foundation.** Run `git add package.json bun.lock tsconfig.json next.config.ts eslint.config.mjs src tests vitest.config.ts` and commit with `feat: scaffold cms frontend`.

### Task 2: Build the typed API client and session runtime

**Files:**
- Create: `src/lib/api/types.ts`, `src/lib/api/errors.ts`, `src/lib/api/client.ts`
- Create: `src/lib/auth/session-store.ts`, `src/lib/auth/permissions.ts`
- Create: `src/app/providers.tsx`
- Test: `tests/api/client.test.ts`, `tests/auth/session-store.test.ts`

**Interfaces:**
- `ApiError` exposes `status: number`, `code: string`, `message: string`, and `details: Record<string, unknown>`.
- `apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>` serializes JSON bodies, sends credentials, attaches the current access token, normalizes every non-2xx response into `ApiError`, and performs one guarded refresh/retry for protected requests.
- `SessionStore` exposes `getSnapshot(): SessionState`, `setSession(user, accessToken)`, `clearSession()`, `subscribe(listener)`, and `hasCapability(capability)`.
- `roleAssignments` are typed as `{ role_code: RoleCode; sig_id: number | null }[]`; capabilities are derived from role assignments but never used as server authorization.

- [x] **Step 1: Write client tests for the contract.** Cover JSON success, empty-body success, `401` refresh then original retry, concurrent `401`s sharing one `/auth/refresh` promise, failed refresh clearing the store, and preserving `409`/`422` field details without retrying.
- [x] **Step 2: Implement `ApiError` and response parsing.** Read the standard `{ error: { code, message, details } }` envelope, use `INTERNAL_ERROR` for malformed/unknown server responses, and never expose raw response text in UI-facing messages.
- [x] **Step 3: Implement the single-flight request wrapper.** Use `credentials: "include"`, set `Content-Type` only for JSON bodies, attach the in-memory bearer token, skip refresh retry for `/auth/login`, `/auth/refresh`, `/auth/logout`, and `/auth/logout-all`, and retry the original request at most once.

```ts
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status !== 401 || options.retryOn401 === false || isAuthPath(path)) {
    return parseResponse<T>(response);
  }
  await refreshOnce();
  return parseResponse<T>(await send(path, { ...options, retryOn401: false }));
}
```

- [x] **Step 4: Implement session state and capability helpers.** Store only the access token and current user in memory; expose helpers for `canManageContent`, `canAdminister`, `canReviewDocumentation`, and `canManageOperations` based on role assignments.
- [x] **Step 5: Mount session context in `src/app/providers.tsx`.** Keep browser-only session access behind a client component. Add the TanStack Query provider only when the first query-driven feature is implemented, so Phase 1 does not ship an unused cache dependency.
- [x] **Step 6: Run unit tests and lint.** Run `bun run test --run tests/api/client.test.ts tests/auth/session-store.test.ts` and `bun run lint`.
- [x] **Step 7: Commit the API foundation.** Run `git add src/lib src/app/providers.tsx tests/api tests/auth` and commit with `feat: add typed api and session runtime`.

## Phase 2 — Authentication and onboarding

### Task 3: Implement login, onboarding gates, and logout

**Files:**
- Create: `src/app/(public)/login/page.tsx`, `src/app/(account)/change-password/page.tsx`, `src/app/(account)/profile/setup/page.tsx`
- Create: `src/app/(app)/layout.tsx`, `src/components/auth/AuthBoundary.tsx`, `src/components/auth/SessionBootstrap.tsx`
- Create: `src/components/forms/FieldError.tsx`, `src/components/auth/LogoutButton.tsx`
- Create: `src/lib/api/auth.ts`, `src/lib/api/members.ts`
- Test: `tests/auth/login-page.test.tsx`, `tests/auth/onboarding-flow.test.tsx`, `tests/auth/auth-boundary.test.tsx`

**Interfaces:**
- `login(input: { login: string; password: string }): Promise<AuthLoginResponse>` calls `POST /auth/login`.
- `changePassword(input: { current_password: string; new_password: string }): Promise<{ message: string }>` calls `POST /auth/change-password`.
- `getMe(): Promise<{ user: AuthUser }>` calls `GET /auth/me`.
- `getMyProfile()` and `updateMyProfile(input: ProfileInput)` call `GET/PUT /members/me`.

- [ ] **Step 1: Write tests for the state machine.** Assert that successful login enters the app, `PASSWORD_CHANGE_REQUIRED` renders the password form, successful password change clears the token and sends the user to login, `PROFILE_INCOMPLETE` renders profile setup, and a failed refresh returns to login with no stale cached queries.
- [ ] **Step 2: Implement the login form.** Validate non-empty login/password locally, submit only `{ login, password }`, retain field values on `401`, display `INVALID_CREDENTIALS`, and redirect based on `must_change_password` without placing a temporary password in the URL or storage.
- [ ] **Step 3: Implement the password-change page.** Allow the password route while the password gate is active, validate a minimum client-side length plus matching confirmation, call `/auth/change-password`, clear the session on success, and require a fresh login because the backend increments `session_version` and revokes refresh tokens.
- [ ] **Step 4: Implement profile setup.** Load `/members/me` through the no-profile-gate route, edit only the allowed profile fields, render server `422` details beside fields, submit `PUT /members/me`, and redirect to `/dashboard` only when the returned profile reports `is_complete`.
- [ ] **Step 5: Implement `AuthBoundary`.** Bootstrap `/auth/me`; map `PASSWORD_CHANGE_REQUIRED` to `/change-password`, `PROFILE_INCOMPLETE` to `/profile/setup`, `401` to `/login`, and other errors to a retryable session error page. Do not use middleware to inspect the in-memory token.
- [ ] **Step 6: Implement logout and logout-all.** Call the corresponding endpoint, clear session/query cache regardless of logout response, and navigate to `/login`.
- [ ] **Step 7: Run tests and build.** Run `bun run test --run tests/auth` and `bun run build`.
- [ ] **Step 8: Commit the auth flow.** Run `git add app src tests/auth` and commit with `feat: implement auth and onboarding flow`.

## Phase 3 — Application shell and member area

> Progress note (2026-09-02): a dark, static preview slice now exposes the
> shared workspace shell plus `/dashboard`, `/learning`, `/documentation`,
> `/projects`, and `/operations`. This is intentionally not marked complete:
> authentication, live data, capability-derived navigation, and member
> profiles still belong to the implementation steps below.

### Task 4: Build the application shell, dashboard, profiles, and portfolios

**Files:**
- Create: `src/components/layout/AppShell.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx`, `src/components/layout/MobileNav.tsx`
- Create: `src/components/ui/AsyncState.tsx`, `src/components/ui/ConfirmDialog.tsx`, `src/components/ui/StatusBadge.tsx`, `src/components/ui/DataTable.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/profile/page.tsx`, `src/app/(app)/members/[rollNumber]/page.tsx`, `src/app/(app)/portfolio/[userId]/page.tsx`
- Create: `src/lib/api/admin.ts`, `src/lib/api/members.ts`, `src/lib/formatters/date.ts`
- Test: `tests/layout/navigation.test.tsx`, `tests/members/profile-pages.test.tsx`, `tests/members/portfolio-page.test.tsx`

**Interfaces:**
- `getDashboard(): Promise<{ summary: DashboardSummary }>` calls `GET /admin/dashboard` only for authorized users.
- `getMyProfile(): Promise<{ profile: ProfileView }>` calls `GET /members/me`.
- `getMemberByRoll(rollNumber: string): Promise<{ profile: ProfileView }>` calls `GET /members/<roll_number>`.
- `getPortfolio(userId: number): Promise<{ portfolio: PortfolioView }>` calls `GET /members/<user_id>/portfolio`.

- [ ] **Step 1: Write navigation tests.** Assert the member menu, content-management menu, and admin menu are derived from role capabilities; assert hidden actions are not rendered while direct API `403` remains handled.
- [ ] **Step 2: Build the responsive shell.** Add desktop sidebar, mobile navigation, breadcrumb/title region, user menu, logout action, and a consistent content container. Keep tables horizontally scrollable on small screens.
- [ ] **Step 3: Build dashboard states.** Render member dashboard cards from profile/progress/activity data; render admin aggregate cards only when `/admin/dashboard` is allowed. Add explicit empty/error states rather than fabricating metrics.
- [ ] **Step 4: Build profile edit/view.** Use a shared profile form for setup and normal editing, render all social links safely, and show server timestamps in local time.
- [ ] **Step 5: Build member lookup and portfolio.** Use roll-number lookup, profile not-found state, portfolio learning completions, published project contributions, and published showcases from the backend response.
- [ ] **Step 6: Run tests and lint.** Run `bun run test --run tests/layout tests/members` and `bun run lint`.
- [ ] **Step 7: Commit the shell and member area.** Run `git add src app tests/layout tests/members` and commit with `feat: add app shell and member area`.

## Phase 4 — Administration and SIG management

### Task 5: Build administration and SIG management

**Files:**
- Create: `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/sigs/page.tsx`, `src/app/(app)/admin/members/page.tsx`, `src/app/(app)/admin/accounts/page.tsx`
- Create: `src/components/admin/SigForm.tsx`, `src/components/admin/MemberStatusControl.tsx`, `src/components/admin/RoleAssignmentForm.tsx`, `src/components/admin/TemporaryPasswordDialog.tsx`
- Extend: `src/lib/api/admin.ts`, `src/lib/api/auth.ts`
- Test: `tests/admin/admin-pages.test.tsx`, `tests/admin/account-security.test.tsx`

**Interfaces:**
- `listSigs(limit)` → `GET /admin/sigs?limit=`; `createSig(input)` → `POST /admin/sigs`; `updateSig(id, input)` → `PUT /admin/sigs/<sig_id>`.
- `listMembers(filters)` → `GET /admin/members?limit=&is_active=`; `setMemberStatus(id, isActive)` → `PATCH /admin/members/<user_id>/status`.
- `createAccount(input)` → `POST /auth/users`; `resetPassword(userId)` → `POST /auth/users/<user_id>/reset-password`; `changeRole(userId, input)` → `PUT /auth/users/<user_id>/roles`.

- [ ] **Step 1: Write tests for admin permissions and one-time secrets.** Assert non-admins see a controlled forbidden state, create/reset responses show a temporary password exactly in the success dialog, closing/reloading loses it, and no URL/local-storage/logger contains it.
- [ ] **Step 2: Implement dashboard and SIG screens.** Support list/create/update, display duplicate SIG conflicts as form messages, and invalidate the relevant queries after mutations.
- [ ] **Step 3: Implement member administration.** Add `is_active=true|false` filter, activate/deactivate confirmation, and server conflict/permission handling.
- [ ] **Step 4: Implement account creation/reset/roles.** Use a copy-once temporary password dialog; provide role and optional SIG selectors; use `action: "assign"|"revoke"`, `role_code`, and nullable `sig_id` exactly as the backend expects.
- [ ] **Step 5: Run tests and build.** Run `bun run test --run tests/admin` and `bun run build`.
- [ ] **Step 6: Commit administration.** Run `git add src/app/'(app)'/admin src/components/admin src/lib/api/admin.ts src/lib/api/auth.ts tests/admin` and commit with `feat: add administration workflows`.

## Phase 5 — Learning paths and content

### Task 6: Build learning paths, content management, assignments, and quizzes

**Files:**
- Create: `src/app/(app)/learning/page.tsx`, `src/app/(app)/learning/paths/[pathId]/page.tsx`, `src/app/(app)/learning/quizzes/[quizId]/page.tsx`
- Create: `src/components/learning/PathTree.tsx`, `src/components/learning/LessonViewer.tsx`, `src/components/learning/ProgressSummary.tsx`, `src/components/learning/AssignmentPanel.tsx`, `src/components/learning/QuizAttempt.tsx`, `src/components/learning/ContentEditor.tsx`
- Create: `src/lib/api/learning.ts`, `src/lib/validation/learning.ts`
- Test: `tests/learning/path-navigation.test.tsx`, `tests/learning/submission-quiz.test.tsx`, `tests/learning/content-management.test.tsx`

**Interfaces:**
- Reads: `GET /learning/paths`, `GET /learning/paths/<path_id>`, `GET /learning/quizzes/<quiz_id>`, `GET /learning/paths/<path_id>/progress`.
- Member actions: `POST /learning/lessons/<lesson_id>/complete`, `POST /learning/assignments/<assignment_id>/submissions`, `POST /learning/quizzes/<quiz_id>/attempts`.
- Manager actions: create/update paths, modules, lessons, resources, assignments, quizzes, questions; publish through the corresponding `PATCH` state update; review submissions through `PATCH /learning/submissions/<submission_id>/review`.

- [ ] **Step 1: Write tests for the learning hierarchy.** Assert paths, modules, lessons, resources, assignments, and quizzes render from server data; progress is loaded from `/progress` rather than computed from partial client data; unpublished content is not shown to ordinary members.
- [ ] **Step 2: Implement path/module/lesson navigation.** Preserve backend positions, render Markdown resources as sanitized content, open external links with safe attributes, and show missing-resource/not-found states.
- [ ] **Step 3: Implement progress and completion.** Call the complete endpoint once per action, invalidate path/progress queries, and show the server progress response.
- [ ] **Step 4: Implement assignments.** Support `DRAFT` and `FINAL`, `TEXT` and `LINK`, ISO deadlines, member submission, reviewer feedback/score, and server `409`/`422` messages.
- [ ] **Step 5: Implement quizzes.** Render choices from the server, submit answers keyed by question ID, show the returned attempt/score, and keep answer keys out of member views; answer-authoring controls are restricted to content managers.
- [ ] **Step 6: Implement manager editing.** Use separate forms for each hierarchy level, exact allowed payload keys, explicit publish controls, and query invalidation after every successful mutation.
- [ ] **Step 7: Run tests and commit.** Run `bun run test --run tests/learning`, `bun run lint`, then commit with `feat: add learning workflows`.

## Phase 6 — Documentation and editorial workflow

### Task 7: Build documentation search and editorial workflow

**Files:**
- Create: `src/app/(app)/documentation/page.tsx`, `src/app/(app)/documentation/[documentId]/page.tsx`, `src/app/(app)/documentation/new/page.tsx`
- Create: `src/components/documentation/DocumentCard.tsx`, `src/components/documentation/DocumentReader.tsx`, `src/components/documentation/DocumentEditor.tsx`, `src/components/documentation/RevisionHistory.tsx`, `src/components/documentation/WorkflowActions.tsx`
- Create: `src/lib/api/documentation.ts`, `src/lib/validation/documentation.ts`
- Test: `tests/documentation/search-reader.test.tsx`, `tests/documentation/workflow.test.tsx`

**Interfaces:**
- Reads: `GET /documentation/documents?limit=`, `GET /documentation/search?q=&tag=&category=&limit=`, `GET /documentation/documents/<document_id>`, `GET /documentation/documents/<document_id>/revisions`.
- Writes: `POST /documentation/documents`, `PATCH /documentation/documents/<document_id>`, `POST /documentation/documents/<document_id>/submit|publish|archive|restore`, and `POST /documentation/documents/<document_id>/review`.

- [ ] **Step 1: Write tests for visibility and state transitions.** Assert members receive published documents, authorized staff can see allowed drafts, search uses published-only results, and the UI exposes only legal actions for `DRAFT`, `SUBMITTED`, `APPROVED`, `PUBLISHED`, `REJECTED`, and archived states.
- [ ] **Step 2: Implement search/list/detail.** Debounce query changes, keep `q`, `tag`, `category`, and `limit` in the URL, render summary cards without assuming body content exists, and render a not-found state for `404`.
- [ ] **Step 3: Implement the Markdown reader/editor.** Sanitize rendered Markdown, support title/summary/body/category/tags/SIG fields, preserve draft form values after `409`/`422`, and keep revision history read-only.
- [ ] **Step 4: Implement workflow actions/review.** Use `decision: "APPROVE"|"REJECT"` and `comment`, require confirmation for archive/restore, and invalidate document/list/search/revision queries after success.
- [ ] **Step 5: Run tests and commit.** Run `bun run test --run tests/documentation` and commit with `feat: add documentation workflows`.

## Phase 7 — Projects, teams, and progress tracking

### Task 8: Replace project proposals with direct project records and progress-source APIs

**Files:**
- Modify: `H:\Personal\ACM\CMS-backend\cms\modules\projects\models.py`, `repository.py`, `services.py`, `routes.py`, `__init__.py`
- Create: `H:\Personal\ACM\CMS-backend\cms\modules\projects\progress.py`
- Modify: `H:\Personal\ACM\CMS-backend\database\schema.sql`
- Test: `H:\Personal\ACM\CMS-backend\tests\projects\test_project_listing.py`, `test_project_tracking.py`, `test_team_formation.py`, `test_showcase.py`, `test_progress_sources.py`, `H:\Personal\ACM\CMS-backend\tests\test_schema_minimization.py`, `test_compact_schema.py`

**Interfaces:**
- Direct project provisioning: `POST /projects` and `PATCH /projects/<project_id>` accept `title`, `summary`, `description`, `sig_id`, `team_capacity`, and `project_state`; only the existing project-management capability may use them.
- Reads: `GET /projects` and `GET /projects/<project_id>` return the project, team, work items, showcase, and normalized external progress summary.
- Progress sources: `GET /projects/<project_id>/progress`, `POST /projects/<project_id>/progress/sync`, and manager-only `POST /projects/<project_id>/progress/sources` accept `{ source_type: "GITHUB"|"WEB", source_url }` only for an allowlisted GitHub repository or approved public web source.
- A progress snapshot contains `source_type`, `source_url`, `sync_state`, `last_synced_at`, `captured_at`, `metrics`, and a safe `error_message`; GitHub public-repository metrics and approved web-source metrics use the same response shape.
- Team/tracking/showcase routes remain: roles, applications, reviews, invitations, membership, tasks, milestones, and showcases.

- [ ] **Step 1: Write backend contract tests.** Assert direct project records can be created/updated by authorized managers, the direct contract does not require proposal routes, team routes still work, and progress responses expose stable `sync_state`/timestamp/error fields.
- [ ] **Step 2: Add direct project lifecycle.** Move project creation/update authorization to direct project records, preserve existing published projects, and stop creating new projects through proposal objects.
- [ ] **Step 3: Add normalized progress storage.** Store source configuration and the latest snapshot without storing third-party credentials in project rows; keep source errors separate from project state.
- [ ] **Step 4: Add server-side sync adapters.** Implement a public GitHub adapter and an allowlisted public web-source adapter behind the sync service. Use a deployment scheduler or manual endpoint for refresh; do not add a queue or browser scraper.
- [ ] **Step 5: Update schema and backend fixtures.** Add the progress-source/snapshot tables and direct project fields to `database/schema.sql`; retain proposal columns until Task 11 completes the contract phase.
- [ ] **Step 6: Run backend tests.** Run `uv run pytest tests/projects tests/test_schema_minimization.py tests/test_compact_schema.py -q`.

**Dependencies:** Tasks 1–5. The frontend uses this contract before proposal storage is removed.

### Task 9: Build the project team workspace and progress UI

**Files:**
- Create/modify: `H:\Personal\ACM\CMS-Frontend\src\app\(app)\projects\page.tsx`, `src\app\(app)\projects\[projectId]\page.tsx`
- Create: `H:\Personal\ACM\CMS-Frontend\src\components\projects\ProjectCard.tsx`, `TeamPanel.tsx`, `RoleApplicationForm.tsx`, `InvitationDialog.tsx`, `TaskBoard.tsx`, `MilestoneList.tsx`, `ProgressSummary.tsx`, `ProgressSourceStatus.tsx`, `ShowcaseForm.tsx`
- Create/modify: `H:\Personal\ACM\CMS-Frontend\src\lib\api\projects.ts`, `src\lib\validation\projects.ts`
- Test: `H:\Personal\ACM\CMS-Frontend\tests\projects\team-workspace.test.tsx`, `progress-sync.test.tsx`, `tracking-showcase.test.tsx`

**Interfaces:**
- The project list calls `GET /projects`; the detail page calls `GET /projects/<project_id>` and `GET /projects/<project_id>/progress`.
- Team actions use the existing roles, applications, invitations, membership, task, milestone, and showcase routes from Task 8.
- Manual sync calls `POST /projects/<project_id>/progress/sync` and displays `last_synced_at`, stale state, provider failure, and retry status.

- [ ] **Step 1: Write frontend tests.** Assert no proposal page or proposal action is rendered; teams remain usable; tasks/milestones show server state; source sync success, stale, forbidden, and provider-error states are readable.
- [ ] **Step 2: Implement project discovery/detail.** Focus the screens on current project status, team members, work items, milestones, and progress summaries; remove proposal cards and proposal navigation.
- [ ] **Step 3: Implement team workflows.** Preserve role applications, manager review, invitations, accept/decline, leave/remove confirmation, and local-time invitation expiry.
- [ ] **Step 4: Implement manual tracking.** Support `TODO`, `IN_PROGRESS`, `BLOCKED`, and `DONE`, with blockers and weekly updates; invalidate project queries after mutations.
- [ ] **Step 5: Implement external progress display.** Show provider metrics as read-only server data, show source freshness/errors, and make sync a capability-gated action with a single request at a time.
- [ ] **Step 6: Implement showcase refresh.** Keep published showcase fields and invalidate the member portfolio after successful publication.
- [ ] **Step 7: Run frontend tests and build.** Run `bun run test --run tests/projects`, `bun run lint`, and `bun run build`.

**Dependencies:** Task 8.

### Checkpoint: Projects

- [ ] Projects load as direct records without proposal UI.
- [ ] A team can manage roles and work items.
- [ ] GitHub/web progress has visible freshness and failure states.
- [ ] Project tests, lint, and build pass.

## Phase 8 — Operations event planning and calendar

### Task 10: Build internal event planning, documentation links, and Calendar

**Files:**
- Modify: `H:\Personal\ACM\CMS-backend\cms\modules\operations\models.py`, `repository.py`, `services.py`, `routes.py`
- Modify: `H:\Personal\ACM\CMS-backend\database\schema.sql`
- Create/modify: `H:\Personal\ACM\CMS-Frontend\src\app\(app)\operations\page.tsx`, `src\app\(app)\operations\events\[eventId]\page.tsx`, `src\app\(app)\operations\calendar\page.tsx`, `src\app\(app)\operations\meetings\[meetingId]\page.tsx`
- Create/modify: `H:\Personal\ACM\CMS-Frontend\src\components\operations\AnnouncementList.tsx`, `EventPlanningForm.tsx`, `EventPlanTable.tsx`, `RelatedDocumentLink.tsx`, `MeetingEditor.tsx`, `CalendarView.tsx`
- Create/modify: `H:\Personal\ACM\CMS-Frontend\src\lib\api\operations.ts`, `src\lib\validation\operations.ts`, `src\lib\formatters\calendar.ts`
- Test: `H:\Personal\ACM\CMS-backend\tests\test_mvp_flows.py`, `H:\Personal\ACM\CMS-backend\tests\test_regressions.py`, `H:\Personal\ACM\CMS-Frontend\tests\operations\event-planning.test.tsx`, `calendar.test.tsx`, `documentation-link.test.tsx`

**Interfaces:**
- Lists: `GET /operations/announcements`, `GET /operations/events`, `GET /operations/meetings`, with `include_drafts=true` only for authorized planning views; `GET /operations/calendar?start=&end=&limit=`.
- Event planning: create/update/publish/cancel events with `title`, `description`, `sig_id`, `starts_at`, `ends_at`, `location`, `external_url`, `capacity`, and nullable `planning_document_id`.
- Documentation linking: event responses include `planning_document_id`; the UI links to `/documentation/<document_id>` and can create a new related document through the existing documentation workflow.
- Meetings remain internal planning records with agenda and optional `minutes_document_id`.
- Spreadsheet workflow: export the visible planning table to CSV and import CSV rows through browser-native file APIs, validate every row before sending normal event mutations, and report row-level errors without partial silent writes.
- There are no registration, attendance, feedback, or recruitment interfaces in this release.

- [ ] **Step 1: Write backend contract tests.** Assert event draft/publish/update/cancel and calendar behavior, related-document persistence, that event planning does not depend on participant endpoints, and row-safe validation for event fields.
- [ ] **Step 2: Add event-document relation.** Add nullable `planning_document_id` with a document foreign key, validate document visibility/ownership, return it in event serialization, and keep meeting `minutes_document_id` behavior unchanged.
- [ ] **Step 3: Implement event planning UI.** Replace registration-oriented controls with manager-only draft/edit/publish/cancel actions, show capacity only as planning metadata, and link the related document.
- [ ] **Step 4: Implement CSV planning workflow.** Export event rows with stable headers; parse/import CSV in the browser; validate required fields and ISO date ranges; preview valid/invalid rows; submit only confirmed valid rows through normal APIs.
- [ ] **Step 5: Implement Calendar.** Keep month navigation, send ISO-8601 date ranges, display events and meetings in local time, and provide loading/empty/error states.
- [ ] **Step 6: Keep secondary operations.** Preserve announcements and internal meeting planning, but remove recruitment from navigation and release tests.
- [ ] **Step 7: Run tests and build.** Run `uv run pytest tests/test_mvp_flows.py tests/test_regressions.py -q`, `bun run test --run tests/operations`, `bun run lint`, and `bun run build`.

**Dependencies:** Tasks 1–7. Participant workflows are removed from the current release.

## Phase 9 — Backend cleanup and contract removal

### Task 11: Remove deprecated proposal and event-participant backend surfaces

**Files:**
- Modify: `H:\Personal\ACM\CMS-backend\cms\modules\projects\models.py`, `repository.py`, `services.py`, `routes.py`, `__init__.py`
- Modify: `H:\Personal\ACM\CMS-backend\cms\modules\operations\models.py`, `repository.py`, `services.py`, `routes.py`, `__init__.py`
- Modify: `H:\Personal\ACM\CMS-backend\database\schema.sql`
- Modify/remove tests: `H:\Personal\ACM\CMS-backend\tests\projects\test_proposals.py`, `tests\test_regressions.py`, `tests\test_mvp_flows.py`, `tests\test_query_counts.py`, `tests\test_schema_minimization.py`, and `tests\test_compact_schema.py`
- Modify: `H:\Personal\ACM\CMS-backend\BACKEND_FRONTEND_INTEGRATION_PLAN.md`

**Interfaces:**
- Removed project endpoints: `POST/PATCH /projects/proposals`, `POST /projects/proposals/<proposal_id>/submit`, `POST /projects/proposals/<proposal_id>/review`, and `GET /projects/proposals`.
- Removed event-participant endpoints: `POST /operations/events/<event_id>/registrations`, `DELETE /operations/registrations/<registration_id>`, `POST/GET /operations/events/<event_id>/attendance`, and `POST /operations/events/<event_id>/feedback`.
- Retained interfaces: direct project records, team workflows, project work items/showcases/progress, event planning, announcements, meetings, Calendar, and documentation.
- Deferred interfaces: recruitment will be added in a later release; its current routes, storage, and frontend page are removed.

- [x] **Step 1: Prove active consumers are migrated.** Repository-wide searches and route inspection confirm no retained feature calls the removed workflows.
- [x] **Step 2: Remove proposal code.** Proposal route handlers, service/repository methods, compatibility aliases, tests, storage columns, and frontend navigation are removed; project/team/tracking/showcase methods remain.
- [x] **Step 3: Contract project storage.** Proposal-only columns and indexes are absent from `database/schema.sql`; existing project ownership remains for teams and portfolios.
- [x] **Step 4: Remove participant workflow.** Registration/attendance/feedback handlers, helpers, serializers, aliases, model, table, and registration counts are removed.
- [x] **Step 5: Update documentation and fixtures.** Stale payloads, endpoint examples, mocks, and assertions are removed; recruitment is documented as future work.
- [x] **Step 6: Run the removal gate.** Full backend tests, frontend tests/typecheck/lint/build, and schema checks pass.

**Dependencies:** Tasks 8–10. Destructive schema changes are the final step and must not be bundled with the first direct-project/event-document deployment.

### Checkpoint: Scope cleanup

- [x] No active route or frontend action exposes proposals or event participants.
- [x] Existing project teams, tracking, showcases, event planning, Calendar, and documentation links remain functional.
- [x] Recruitment is clearly deferred and its current surfaces are removed.
- [x] Schema and endpoint documentation match the runtime contract.

## Phase 10 — Hardening and release

### Task 12: Add end-to-end verification, accessibility, and release configuration

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/auth-onboarding.spec.ts`, `tests/e2e/member-journey.spec.ts`, `tests/e2e/admin-journey.spec.ts`
- Create: `.env.example`, `README.md` sections for setup and backend integration
- Modify: `src/components/ui/*`, affected route pages, `next.config.ts`
- Test: `tests/api/contract-fixtures.test.ts`, complete unit/integration/e2e suites

**Interfaces:**
- Browser tests use a configured backend base URL and seeded test accounts; they do not bypass the refresh cookie or inject refresh tokens into page JavaScript.
- Release build consumes `NEXT_PUBLIC_API_BASE_URL` and supports same-origin or explicitly configured cross-origin cookie/CORS deployment.

- [ ] **Step 1: Add MSW fixtures for every response envelope used by the UI.** Include success, empty, `401`, `PASSWORD_CHANGE_REQUIRED`, `PROFILE_INCOMPLETE`, `403`, `404`, `409`, `422`, and `500` fixtures; assert forms map `details` to fields where present.
- [ ] **Step 2: Add Playwright journeys.** Cover login → password change → login again → profile setup → dashboard; member learning/document/project-team/progress flow; and administrator account/SIG/content/event-planning/calendar flows. Do not add registration or recruitment journeys.
- [ ] **Step 3: Audit accessibility.** Verify labels, keyboard submission, focus restoration after dialogs, visible focus states, semantic headings, table headers, color-independent status indicators, and screen-reader error announcements.
- [ ] **Step 4: Audit responsive behavior.** Test 320px, tablet, and desktop widths for shell navigation, dashboards, editors, tables, task boards, progress summaries, CSV preview, calendar, and detail pages.
- [ ] **Step 5: Run the release gate.** Run `bun run lint`, `bun run test`, `bun run build`, and `bun run test:e2e`; all must pass against mocked tests and a configured backend smoke environment.
- [ ] **Step 6: Commit release readiness.** Run `git add .env.example README.md playwright.config.ts tests/e2e tests/api src next.config.ts` and commit with `chore: verify frontend release readiness`.

## Release Sequence

1. Release 1: Tasks 1–4 — API client, auth/onboarding, shell, profile, member lookup, and portfolio.
2. Release 2: Task 5 and Task 6 — administration, SIGs, learning, assignments, quizzes, and progress.
3. Release 3: Task 7 and Tasks 8–9 — documentation, direct projects, team workflows, tracking, external progress snapshots, showcases, and portfolio refresh.
4. Release 4: Task 10 — internal event planning, CSV workflow, documentation links, meetings, and Calendar.
5. Release 5: Tasks 11–12 — backend contract removal, schema cleanup, responsive polish, accessibility, end-to-end tests, and backend smoke verification.

## Definition of Done

- A member can log in, complete the forced password/profile workflow, view published learning and documentation, submit learning work, view progress, browse project teams and progress, respond to project invitations, and view a portfolio.
- Authorized staff can manage accounts, SIGs, learning content, documentation workflow, direct projects, project teams, progress sources, meetings, announcements, event plans, and Calendar according to the role assignments returned by `/auth/me`.
- Access-token refresh and rotation work after browser refresh and expiry without exposing the refresh token.
- All listed server error classes render controlled UI states; no stack traces or raw database errors reach the UI.
- Members never receive draft/private records through normal list/detail views.
- No implementation depends on deferred recruitment or removed participant/proposal features.
- `bun run lint`, `bun run test`, `bun run build`, and `bun run test:e2e` pass, and one smoke run uses the deployed MySQL-backed backend rather than only SQLite fixtures.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing project rows still depend on proposal state | High | Cut over direct-project reads first, preserve ownership, back up/count rows, and drop proposal columns only in a later migration with a down path. |
| Event participant storage is shared by three workflows | High | Remove all participant consumers before dropping the table; keep event planning independent of participant counts. |
| Third-party sources change or rate-limit requests | Medium | Server-side adapters, allowlists, bounded timeouts, cached snapshots, manual retry, and explicit stale/error state. |
| CSV rows contain invalid or mixed timezones | Medium | Preview before write, validate each row, require ISO date-times, and report row-level errors without silent partial writes. |

## Open Questions

- The first external web source must be selected from an allowlisted public source before its adapter is implemented; GitHub public repositories are the first supported provider.
- If actual `.xlsx` or Google Sheets integration becomes necessary, add it as a separate follow-up after the CSV workflow proves insufficient.
