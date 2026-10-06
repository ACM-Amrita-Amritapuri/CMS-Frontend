# Member GitHub Projects Design

> **Current status:** The CMS no longer includes the snapshot ingestion endpoint
> or its service token. The scraper remains a separate future project; the
> member-project read APIs and stored project fields remain.

## Goal

Make the Projects tab a directory of members and their GitHub projects. Project
records displayed by this application come from an external worker's GitHub
scrape. Each record links to its GitHub repository and, when available, its
live demo. The scraping worker is a separate future project.

## Current state

- `/projects` lists club projects and links to a team, application, task, and
  showcase workflow.
- `/portfolio/:userId` combines manually managed project contributions and
  showcases with learning achievements.
- Member profiles already store a GitHub profile URL.
- There is no GitHub integration or background worker in this codebase.

## User experience

- Replace the Projects tab's club-project list with a member directory. Each
  member is shown once, with their scraped GitHub project cards grouped under
  their profile name.
- Each card shows the repository name, scraped description and primary
  language when present, a GitHub repository link, and a live demo link when
  supplied by the worker.
- Link each member heading to that member's portfolio. An unavailable GitHub
  profile or an empty project snapshot produces a useful empty state; do not
  show manually entered or unsourced projects as a fallback.
- Remove the project team detail screen from the Projects navigation flow.
- In a member portfolio, replace the project-contribution and showcase
  displays with the same scraped project records. Keep profile details and
  learning achievements unchanged.

## Application data and APIs

Add a member-project record separate from the existing club project tracker.
Each record belongs to one member and has a unique GitHub repository ID per
member. Store only fields needed to render the agreed cards: repository ID,
name, description, language, repository URL, and optional live demo URL. The
worker supplies these values; this application does not fetch GitHub data.

- `GET /projects/directory` returns members with their scraped projects for the
  directory. Keep the existing `GET /projects` list contract for compatibility.
  Return each member's user ID, display name, GitHub profile URL, and scraped
  projects; order members by display name and repositories by name.
- `GET /members/{user_id}/portfolio` returns the member's scraped projects in
  place of the manually managed project contributions and showcases. Keep its
  profile and learning achievement fields.
- `PUT /projects/internal/members/{user_id}/snapshot` accepts a JSON body with
  `complete: true` and a `projects` array. Each project contains
  `repository_id`, `name`, `description`, `language`, `repository_url`, and
  nullable `demo_url`. Use a configured bearer service credential. Upsert by
  repository ID and atomically remove that member's previously stored
  repositories absent from the completed snapshot. A complete empty array
  intentionally clears that member's project list. Missing `complete: true` or
  any validation or database error must leave the previous snapshot intact.
- Validate the member, GitHub repository IDs and URLs, text lengths, and
  optional demo URLs before saving. Restrict ingestion to a configured
  service credential; never expose that credential to the browser.
- Keep existing team-tracking API routes and storage intact for now. They are
  no longer used by the Projects or portfolio UI; removing them is a separate
  compatibility decision.

## Data flow

1. The future external worker identifies a member in the CMS and produces a
   complete repository snapshot.
2. It submits the snapshot to the app's authenticated ingestion endpoint.
3. The app validates and atomically stores the member's current records.
4. Authenticated members read those records from the Projects directory and
   member portfolio APIs.

There is no scraper, scheduler, queue, GitHub token, or worker deployment in
this change.

## Acceptance criteria

- The Projects tab groups scraped repositories by member and shows repository
  and optional demo links.
- A member portfolio shows the same repository data, with learning content
  unchanged and manual project contributions/showcases absent from that UI.
- Empty and missing GitHub data render clear empty states.
- Complete snapshots are idempotent; invalid or failed snapshots do not
  partially replace stored data.
- The browser cannot call ingestion using the service credential.
- The existing team-tracking backend routes remain available but are not
  linked from the updated Projects UI.

## Out of scope

- Building or deploying the scraper/worker.
- GitHub OAuth, repository selection, or manually entering project records.
- Deleting the club project team, role, application, task, milestone, or
  showcase tables and APIs.
- Changing member profiles or learning portfolio behavior.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A partial scrape could erase valid projects | Accept only complete snapshots and replace data in one transaction. |
| Project data could be attributed to the wrong member | Require an authenticated service credential and validate the target member. |
| Existing API consumers expect the old `/projects` response | Give the directory a new read route and retain the existing team-management routes. |
| Legacy project screens remain reachable by stale links | Remove their navigation route from the UI; repository and demo links go directly to their external destinations. |
