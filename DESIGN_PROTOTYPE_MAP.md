# ACM CMS design prototype map

This is a clickable, dark-mode, data-only prototype for reviewing page inventory and UX direction with the design team.

Run it with Bun:

```text
bun run dev
```

Open [http://localhost:33001/prototype](http://localhost:33001/prototype). The existing application on port 3000 is intentionally left alone.

## Shared rules

- Every authenticated page uses the same sidebar, top bar, active navigation, user entry point, and mobile bottom navigation.
- Every list needs loading, empty, error, and filtered-no-results states. The prototype shows representative empty, success, forbidden, review, and no-match states.
- Every write flow needs visible validation, a saved/draft state, success feedback, and a recoverable error state.
- Mobile layouts stack content, keep the primary action visible, preserve keyboard focus, and turn dense tables/calendars into readable overflow or agenda views.
- All content below is fictional mock data. No form or button writes to an API yet.

## Route inventory

| Area | Route | Purpose | Required page content |
| --- | --- | --- | --- |
| Public | `/` | Explain the club workspace and route people into the preview. | Brand promise, primary CTA, workspace areas, preview entry point. |
| Public | `/login` | Let a member enter the workspace. | Email/password, forgot password, validation, invalid credentials. |
| Account | `/change-password` | Complete the required first account action. | Temporary-password warning, password rules, confirmation state. |
| Account | `/profile/setup` | Collect the minimum useful member profile. | Identity, avatar placeholder, SIG, bio, completion progress. |
| Member | `/dashboard` | Give members a calm starting point. | Welcome, quick actions, activity feed, activity empty state. |
| Member | `/profile` | Show the current member’s identity and activity. | Profile summary, role badges, SIGs, contact links, edit action. |
| Member | `/members` | Help people discover one another. | Search, filters, member cards, availability, pagination treatment. |
| Member | `/members/ACM-024` | Show a public member profile. | Header, about, skills, projects, learning, portfolio link. |
| Member | `/portfolio/42` | Present finished work and learning. | Portfolio header, featured projects, completed paths, recognition. |
| Learning | `/learning` | Make the next learning step obvious. | Recommended path, streak/stats, path cards, assignment/progress links. |
| Learning | `/learning/path/frontend-foundations` | Guide an ordered learning path. | Path header, progress, lesson list, current/locked states, resources. |
| Learning | `/learning/assignments` | Give members one focused work queue. | Status filters, assignment rows, due dates, submission state. |
| Learning | `/learning/progress` | Show momentum over time. | Completion stats, path progress, milestone, history. |
| Docs | `/documentation` | Let members find shared knowledge. | Search, topic filters, document rows, owner/freshness/read time. |
| Docs | `/documentation/getting-started` | Make a document easy to trust and read. | Article, metadata, table of contents, checklist, related docs. |
| Docs | `/documentation/new` | Draft a new piece of knowledge. | Title, topic, audience, summary, body, save/submit actions. |
| Docs | `/documentation/review` | Help editors approve or request changes. | Review filters, preview, reviewer context, approve/request changes. |
| Projects | `/projects` | Help members discover work and join it. | Search/filter treatment, project cards, stage, lead, contributors. |
| Projects | `/projects/website-refresh` | Give a project one source of truth. | Context, team/roles, success criteria, milestones, updates. |
| Projects | `/projects/new` | Turn an idea into a joinable brief. | Name, SIG, stage, problem, outcome, draft/invite actions. |
| Projects | `/projects/showcase` | Make finished work teachable. | Featured outcome, contributors, impact, project story links. |
| Operations | `/operations` | Show the club’s operational rhythm. | Next event, latest announcements, calendar entry point. |
| Operations | `/operations/announcements` | Publish and read important updates. | Announcement list, audience, date, draft/published state. |
| Operations | `/operations/events` | Help people understand and attend gatherings. | Event cards, date/time/location, RSVP state, attendee summary. |
| Operations | `/operations/calendar` | Give teams one reliable time view. | Month grid, event legend, selected-day detail, empty-day state. |
| Admin | `/admin` | Surface membership/content/operations health. | Metrics, pending actions, system signal, forbidden boundary. |
| Admin | `/admin/sigs` | Maintain SIGs and leads. | Search, SIG table, lead assignment, needs-lead conflict. |
| Admin | `/admin/members` | Maintain member accounts. | Search, status filters, member table, deactivation confirmation. |
| Admin | `/admin/accounts` | Manage accounts and roles safely. | Account table, roles, reset action, one-time secret state. |

## States to hand to design

1. Default populated state: the screen above with realistic content.
2. Loading: preserve layout hierarchy and action placement while rows/cards load.
3. Empty: explain what is missing and give one next action.
4. No results: preserve the query, offer reset, and offer a create path where appropriate.
5. Validation: identify the field, explain the problem in plain language, keep entered values.
6. Save success: confirm what happened and where the saved item can be found.
7. Permission denied: explain the boundary without leaking private data and give a safe return path.
8. Destructive confirmation: state the impact, require an explicit action, and expose recovery/support.

## Backend and product follow-up

- Replace mock arrays with API contracts for members, paths, documents, projects, announcements, events, SIGs, accounts, and roles.
- Add auth/session guards around account, member, write, review, and admin routes.
- Define pagination, search, filter, sort, ownership, freshness, and status semantics before wiring list screens.
- Define form validation and error payloads once so all create/edit screens render the same states.
- Add real RSVP, assignment submission, document approval, role reset, and destructive-action confirmation behavior.
- Add telemetry only after the core flows and permission boundaries are connected.
