# CMS Design Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, clickable, dark-mode CMS design prototype that lets the team review every planned screen, its content hierarchy, and its important UI states before backend integration.

**Architecture:** Keep the prototype server-rendered and data-only. Reuse the existing `AppShell`, CSS tokens, and native form controls; add one typed mock-content module and focused page components. Every route is navigable without authentication or API calls, while copy and empty states clearly label the prototype boundary.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Bun, global CSS tokens, Vitest, Testing Library.

**Spec:** `FRONTEND_IMPLEMENTATION_PLAN.md` plus the approved in-chat design for a complete static design prototype.

## Global Constraints

- Use Bun for install, scripts, tests, builds, and runtime commands.
- Keep the existing Next.js 16.3.4 and fixed frontend port `33001`.
- Do not add backend calls, auth tokens, API mocks, or new dependencies for this prototype.
- Reuse the existing shell and tokens; do not create a second design system.
- Make every interactive control keyboard reachable with a visible focus state.
- Use honest demo labels and mock data; never present fake values as live backend data.
- Every page needs a clear heading, responsive layout, empty/error/forbidden examples where those states affect design, and a route back to the prototype index.
- Keep production integration seams obvious: route-level page files own composition, `src/lib/prototype/content.ts` owns demo data, and shared layout/UI components own repeated structure.

---

### Task 1: Create the prototype map and shared demo content

**Files:**
- Create: `src/lib/prototype/content.ts`
- Create: `src/app/prototype/page.tsx`
- Create: `src/components/prototype/PrototypeNotice.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/prototype/prototype-map.test.tsx`

**Interfaces:**
- `prototypeSections: PrototypeSection[]` contains every public, member, learning, documentation, projects, operations, and admin route with its purpose and required content.
- `PrototypeNotice` renders a consistent “Design prototype / mock data” notice and a link to `/prototype`.
- `AppShell` exposes all major top-level destinations, including Admin, with the active destination marked by `aria-current="page"`.

- [ ] **Step 1: Write the failing map test.** Assert that the prototype index renders links for `/login`, `/dashboard`, `/profile`, `/members`, `/learning`, `/documentation`, `/projects`, `/operations`, and `/admin`, and that the shell renders an Admin link.
- [ ] **Step 2: Run the targeted test and confirm it fails** because the route index, content model, and Admin navigation do not exist.
- [ ] **Step 3: Add the typed content model and the minimal prototype index.** Use plain arrays of route metadata and links; do not add a registry library or runtime router.
- [ ] **Step 4: Add `PrototypeNotice` and extend the existing shell/landing links.** Keep the existing dark visual language and make the prototype index the designer team’s table of contents.
- [ ] **Step 5: Run `bun run test -- tests/prototype/prototype-map.test.tsx` and `bun run lint`.** Both must pass before the next task.
- [ ] **Step 6: Commit** with `feat: add cms prototype map and demo content`.

### Task 2: Build the public and onboarding screens

**Files:**
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/(account)/change-password/page.tsx`
- Create: `src/app/(account)/profile/setup/page.tsx`
- Create: `src/components/forms/PrototypeField.tsx`
- Test: `tests/prototype/public-pages.test.tsx`

**Interfaces:**
- Each page is a standalone server component and uses native inputs, labels, buttons, inline helper text, and representative validation/error/success panels.
- `PrototypeField` accepts `{ id, label, hint, type?, placeholder?, required?, error? }` and renders a label, input, hint, and optional error without owning form state.

- [ ] **Step 1: Write failing tests** for login fields and action, change-password requirements plus temporary-password warning, and profile-setup fields plus completion action.
- [ ] **Step 2: Run the targeted tests and verify the expected missing-route/component failures.**
- [ ] **Step 3: Implement the shared field and three pages.** Include the designer-facing states: invalid credentials on login, password requirement guidance, and profile completion success preview.
- [ ] **Step 4: Add links between the public screens and `/prototype` without implementing submit behavior.** Buttons should be visually complete but remain safe demo controls.
- [ ] **Step 5: Run `bun run test -- tests/prototype/public-pages.test.tsx`, `bun run lint`, and `bun run typecheck`.**
- [ ] **Step 6: Commit** with `feat: add public and onboarding prototype screens`.

### Task 3: Build the member area and profile surfaces

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/profile/page.tsx`
- Create: `src/app/(app)/members/page.tsx`
- Create: `src/app/(app)/members/[rollNumber]/page.tsx`
- Create: `src/app/(app)/portfolio/[userId]/page.tsx`
- Create: `src/components/member/MemberCard.tsx`
- Create: `src/components/member/ProfileSummary.tsx`
- Test: `tests/prototype/member-pages.test.tsx`

**Interfaces:**
- `MemberCard` renders identity, SIG, status, and a profile link from a typed member item.
- `ProfileSummary` renders profile identity, contact links, bio, SIG roles, and an edit action.
- Member lookup and portfolio routes use stable demo route parameters and mock data only.

- [ ] **Step 1: Write failing tests** for dashboard quick actions/activity, directory search/filter controls, profile summary, member detail, and portfolio sections.
- [ ] **Step 2: Run the targeted test and confirm the new member routes/components are absent.**
- [ ] **Step 3: Add the mock member data and reusable cards.** Show realistic but clearly fictional members, SIG badges, availability, contribution history, and empty activity states.
- [ ] **Step 4: Implement each member route with responsive cards/table layouts.** Include profile edit affordance, member not-found example copy, and portfolio sections for learning completions, projects, and showcases.
- [ ] **Step 5: Run `bun run test -- tests/prototype/member-pages.test.tsx`, `bun run build`, and `bun run lint`.**
- [ ] **Step 6: Commit** with `feat: add member area prototype screens`.

### Task 4: Build learning and documentation workflows

**Files:**
- Modify: `src/app/(app)/learning/page.tsx`
- Create: `src/app/(app)/learning/path/[slug]/page.tsx`
- Create: `src/app/(app)/learning/assignments/page.tsx`
- Create: `src/app/(app)/learning/progress/page.tsx`
- Modify: `src/app/(app)/documentation/page.tsx`
- Create: `src/app/(app)/documentation/[slug]/page.tsx`
- Create: `src/app/(app)/documentation/new/page.tsx`
- Create: `src/app/(app)/documentation/review/page.tsx`
- Create: `src/components/content/ContentRow.tsx`
- Create: `src/components/content/ProgressBar.tsx`
- Test: `tests/prototype/content-pages.test.tsx`

**Interfaces:**
- `ContentRow` renders title, category/status, owner, updated time, and action link.
- `ProgressBar` renders a labeled native progress indicator with accessible value text.
- Learning pages show paths, assignments, progress, lessons, and resources; documentation pages show library, article reading, editor, and review queue.

- [ ] **Step 1: Write failing tests** for learning path cards, assignment statuses, progress values, documentation search/filter controls, article metadata, editor fields, and review actions.
- [ ] **Step 2: Run the targeted test and verify it fails for missing routes/components.**
- [ ] **Step 3: Add shared content rows/progress primitives and typed mock content.** Keep status colors semantic and readable in dark mode.
- [ ] **Step 4: Implement all learning/documentation routes.** Include loading/empty/error examples in the page composition where a designer needs to see them; use static panels rather than fake async behavior.
- [ ] **Step 5: Run `bun run test -- tests/prototype/content-pages.test.tsx`, `bun run typecheck`, and `bun run build`.**
- [ ] **Step 6: Commit** with `feat: add learning and documentation prototype workflows`.

### Task 5: Build projects and operations workflows

**Files:**
- Modify: `src/app/(app)/projects/page.tsx`
- Create: `src/app/(app)/projects/[projectId]/page.tsx`
- Create: `src/app/(app)/projects/new/page.tsx`
- Create: `src/app/(app)/projects/showcase/page.tsx`
- Modify: `src/app/(app)/operations/page.tsx`
- Create: `src/app/(app)/operations/announcements/page.tsx`
- Create: `src/app/(app)/operations/events/page.tsx`
- Create: `src/app/(app)/operations/calendar/page.tsx`
- Create: `src/components/operations/TimelineItem.tsx`
- Create: `src/components/projects/ProjectCard.tsx`
- Test: `tests/prototype/workflows.test.tsx`

**Interfaces:**
- `ProjectCard` renders project stage, SIG, members, summary, and a project link.
- `TimelineItem` renders date/time, event type, title, owner, and status with an accessible structure.
- Project screens show directory/detail/create/showcase; operations screens show overview/announcements/events/calendar.

- [ ] **Step 1: Write failing tests** for project cards/detail sections/create fields/showcase links and operation timeline/announcement/calendar content.
- [ ] **Step 2: Run the targeted test and confirm missing-route failures.**
- [ ] **Step 3: Add focused cards/timeline primitives and typed demo data.** Do not add a calendar package; use semantic lists and a compact CSS month grid.
- [ ] **Step 4: Implement all project/operations routes.** Include publish/draft, upcoming/past, RSVP, empty calendar, and failed publish states as static examples.
- [ ] **Step 5: Run `bun run test -- tests/prototype/workflows.test.tsx`, `bun run lint`, and `bun run build`.**
- [ ] **Step 6: Commit** with `feat: add projects and operations prototype workflows`.

### Task 6: Build administration and the designer handoff document

**Files:**
- Create: `src/app/(app)/admin/page.tsx`
- Create: `src/app/(app)/admin/sigs/page.tsx`
- Create: `src/app/(app)/admin/members/page.tsx`
- Create: `src/app/(app)/admin/accounts/page.tsx`
- Create: `src/components/admin/AdminTable.tsx`
- Create: `src/components/admin/RoleBadge.tsx`
- Create: `DESIGN_PROTOTYPE_MAP.md`
- Test: `tests/prototype/admin-pages.test.tsx`

**Interfaces:**
- `AdminTable` renders column headings, rows, row actions, bulk/filter controls, and an empty state without assuming an API.
- `RoleBadge` renders a role label and optional SIG scope.
- `DESIGN_PROTOTYPE_MAP.md` lists every route, purpose, required content, states, and backend integration notes in designer-friendly language.

- [ ] **Step 1: Write failing tests** for admin dashboard metrics, SIG list/form, member filters/status actions, account role controls, and forbidden-state copy.
- [ ] **Step 2: Run the targeted test and confirm missing admin routes/component failures.**
- [ ] **Step 3: Implement admin pages with realistic demo rows and explicit forbidden/confirmation/one-time-secret panels.** Never persist or expose real credentials.
- [ ] **Step 4: Write `DESIGN_PROTOTYPE_MAP.md` from the final route inventory.** For each screen document purpose, primary components, content fields, actions, states, responsive behavior, and integration phase.
- [ ] **Step 5: Run `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run build`.
- [ ] **Step 6: Commit** with `feat: complete cms design prototype and handoff map`.

### Task 7: Final visual/runtime verification

**Files:**
- Modify: only files required by verification findings.
- Test: all existing and prototype tests.

- [ ] **Step 1: Start the app with the fixed Bun command `bun run dev` and verify the console advertises `http://localhost:33001`, not `3000`.
- [ ] **Step 2: Request every route in `DESIGN_PROTOTYPE_MAP.md` and confirm HTTP 200 responses.
- [ ] **Step 3: Inspect the rendered landing page, prototype index, representative public/member/content/admin pages, and mobile layout for console errors, broken links, missing headings, and focus visibility.
- [ ] **Step 4: Run `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run build` after the final change.
- [ ] **Step 5: Confirm `git status --short` is clean and report the exact prototype URL and designer handoff document.
