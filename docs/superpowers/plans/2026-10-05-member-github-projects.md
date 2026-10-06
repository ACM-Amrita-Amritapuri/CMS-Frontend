# Member GitHub Projects Implementation Plan

> **Current status:** The CMS snapshot ingestion endpoint and service token
> were removed. The external scraper remains a separate future project.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the Projects experience with a member directory of externally scraped GitHub repositories while preserving the existing team-tracking API.

**Architecture:** Add a `MemberGitHubProject` store and an atomic, bearer-authenticated snapshot endpoint to the Flask app. Serve one member-grouped read contract to the Projects page and the same repository records from member portfolios; the frontend does not scrape or connect to GitHub.

**Tech Stack:** Flask, SQLAlchemy, Alembic, MySQL/SQLite schema, React, TypeScript, TanStack Query, existing UI primitives.

**Spec:** `docs/superpowers/specs/2026-10-05-member-github-projects-design.md`

## Global Constraints

- Store repository ID, name, description, language, repository URL, and optional live demo URL.
- `GET /projects/directory` serves member-grouped repositories; preserve the existing `GET /projects` response contract.
- `GET /members/{user_id}/portfolio` returns scraped projects while preserving profile and learning achievements.
- `PUT /projects/internal/members/{user_id}/snapshot` requires `complete: true` and the configured bearer service credential.
- Apply a complete snapshot atomically; a complete empty array clears that member's projects.
- Do not add a scraper, scheduler, queue, GitHub token, GitHub OAuth, or repository selection.
- Keep existing team-tracking APIs and storage; remove their UI from the Projects navigation flow.
- Never expose the ingestion credential to the browser.

## Review Focus

- Missing or invalid ingestion credentials must never permit a write.
- Missing `complete: true`, invalid project fields, or a database failure must preserve the prior snapshot.
- A complete empty snapshot must clear only the selected member's projects.
- Members with no scraped repositories must render a useful empty state in both views.
- GitHub links must target repositories; absent demo URLs must omit the demo link.

---

### Task 1: Store member GitHub repositories

**Files:**
- Modify: `CMS-backend/cms/modules/projects/models.py` (add `MemberGitHubProject` mapping)
- Modify: `CMS-backend/cms/modules/projects/repository.py`
- Create: `CMS-backend/migrations/versions/0003_member_github_projects.py`
- Modify: `CMS-backend/database/schema.sql`
- Modify: `CMS-backend/migrations/README`
- Modify: `CMS-backend/README.md`

**Interfaces:**
- Produces `MemberGitHubProject` with member foreign key and unique `(member_user_id, repository_id)`.
- Produces `list_member_github_projects(user_id: int) -> list[dict]` and `replace_member_github_projects(user_id: int, projects: list[dict]) -> None`; replacement flushes changes but leaves commit/rollback to the caller.

- [x] Add table and migration with a bigint GitHub repository ID, required member/name/repository URL fields, nullable description/language/demo URL, unique member/repository key, and member foreign key.
- [x] Add matching table definition to the checked-in SQL schema.
- [x] Update migration documentation to identify `0003_member_github_projects` as the current schema and the revision to stamp after importing the updated schema SQL.
- [x] Implement deterministic repository ordering and per-member replacement without committing inside the repository helper.
- [x] Review the migration and SQL schema together for matching columns, constraints, and nullability.

### Task 2: Accept authenticated complete snapshots

**Files:**
- Modify: `CMS-backend/cms/config.py`
- Modify: `CMS-backend/.env.example`
- Modify: `CMS-backend/cms/modules/projects/routes.py`
- Modify: `CMS-backend/cms/modules/projects/services.py`
- Modify: `CMS-backend/cms/modules/projects/repository.py`

**Interfaces:**
- Adds `PROJECT_SYNC_TOKEN` configuration, read from the environment and required for ingestion.
- Adds `PUT /projects/internal/members/<int:user_id>/snapshot` with `Authorization: Bearer <token>` and JSON `{ "complete": true, "projects": [...] }`.
- Project item fields are `repository_id`, `name`, `description`, `language`, `repository_url`, and nullable `demo_url`.
- Adds `ProjectService.sync_member_snapshot(user_id: int, payload: dict) -> None` as the validated transaction boundary.

- [x] Fail closed when the configured token is missing; compare supplied credentials without timing-sensitive string equality.
- [x] Require `complete is True`; validate the member, positive repository IDs, repository URLs on HTTPS `github.com`, demo HTTP(S) URLs, unique repository IDs, and field lengths (name 255, description 1000, language 100, URLs 2048) before changing stored data.
- [x] Lock the member row for the duration of each snapshot transaction so concurrent complete snapshots for one member serialize.
- [x] Replace the member's records in one database transaction; preserve existing records after any validation or database error; allow a complete empty array to clear that member only.
- [x] Return the existing structured API error format for unauthorized, missing-member, and invalid-snapshot requests.

### Task 3: Serve the member directory and portfolio projects

**Files:**
- Modify: `CMS-backend/cms/modules/projects/routes.py`
- Modify: `CMS-backend/cms/modules/projects/services.py`
- Modify: `CMS-backend/cms/modules/projects/repository.py`
- Modify: `CMS-backend/cms/modules/members/services.py`

**Interfaces:**
- Adds authenticated `GET /projects/directory` returning `members: [{ user_id, display_name, github_url, projects }]`.
- Adds portfolio field `github_projects` using the same repository shape; profile and `learning_achievements` remain unchanged.
- Preserves the existing `GET /projects` response and team-management routes.
- Adds `ProjectService.list_member_project_directory() -> list[dict]` for the directory response.

- [x] Return members with project snapshots ordered by display name, with each member's projects ordered by repository name.
- [x] Include the repository fields needed by the project card and optional GitHub profile link.
- [x] Replace `project_contributions` and `showcases` in the portfolio API response with `github_projects`; leave existing tracker storage and other routes intact.
- [x] Check read authorization against the existing authenticated directory and portfolio behavior.

### Task 4: Build the member-grouped Projects page

**Files:**
- Modify: `CMS-Frontend/src/lib/api/projects.ts`
- Modify: `CMS-Frontend/src/pages/projects/ProjectsListPage.tsx`
- Create: `CMS-Frontend/src/components/projects/member-github-project-card.tsx`

**Interfaces:**
- Adds TypeScript types for scraped repositories and directory members.
- Adds `listProjectDirectory(signal?)` for `GET /projects/directory`.
- `MemberGitHubProjectCard` accepts one scraped repository and renders the GitHub link and optional demo link.

- [x] Render one member section per directory entry and repository cards beneath it, linking the member heading to `/portfolio/{user_id}`.
- [x] Show scraped description and language when present; omit absent descriptions, language, and demo links cleanly.
- [x] Keep loading, error, and empty states consistent with existing async page patterns.

### Task 5: Update portfolios and remove the old Projects UI flow

**Files:**
- Modify: `CMS-Frontend/src/lib/api/members.ts`
- Modify: `CMS-Frontend/src/lib/api/projects.ts` (remove unused tracker client wrappers after deleting their sole UI caller)
- Modify: `CMS-Frontend/src/pages/portfolio/PortfolioPage.tsx`
- Modify: `CMS-Frontend/src/app/router.tsx`
- Delete: `CMS-Frontend/src/pages/projects/ProjectDetailPage.tsx`

**Interfaces:**
- `PortfolioView` exposes `github_projects` and no longer expects `project_contributions` or `showcases`.
- Portfolio project rendering reuses `MemberGitHubProjectCard`.

- [x] Replace the old contribution/showcase portfolio sections with scraped project cards; leave profile and learning achievement sections unchanged.
- [x] Remove the team project detail route and page from the Projects navigation flow.
- [x] Inspect all in-repo links to `/projects/:projectId` and remove or redirect any remaining UI links to the legacy workflow.
- [x] Remove old role/task/application/showcase client functions and types from `projects.ts` only after confirming the detail page was their final in-repo caller; retain backend routes.
- [x] Review the final UI paths against the spec's acceptance criteria without changing the retained backend tracker APIs.

## Checkpoint: Complete

- [x] New directory read API, member portfolio API, and snapshot ingestion API match the spec.
- [x] Projects directory and member portfolio use the same stored GitHub repository records.
- [x] Team-tracking backend endpoints remain intact and disconnected from the Projects UI.
