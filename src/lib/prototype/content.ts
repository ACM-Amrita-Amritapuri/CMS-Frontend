export interface PrototypeScreen {
  href: string;
  label: string;
  purpose: string;
  components: string[];
}

export interface PrototypeSection {
  label: string;
  description: string;
  screens: PrototypeScreen[];
}

export const prototypeSections: PrototypeSection[] = [
  {
    label: "Public & onboarding",
    description: "The first-touch experience and the screens that get a member ready to work.",
    screens: [
      { href: "/login", label: "Login", purpose: "Welcome members and recover from invalid credentials.", components: ["Brand promise", "Login form", "Forgot password link", "Error banner"] },
      { href: "/change-password", label: "Change password", purpose: "Guide a new account through its required first action.", components: ["Temporary password warning", "Password rules", "Confirmation state"] },
      { href: "/profile/setup", label: "Profile setup", purpose: "Collect the minimum profile information needed for a useful workspace.", components: ["Profile form", "Avatar placeholder", "Completion progress"] },
    ],
  },
  {
    label: "Member workspace",
    description: "The everyday surfaces members use to find people, work, and their own progress.",
    screens: [
      { href: "/dashboard", label: "Dashboard", purpose: "Give every member a calm starting point and useful next actions.", components: ["Welcome header", "Quick actions", "Activity feed", "Empty state"] },
      { href: "/profile", label: "My profile", purpose: "Show and edit identity, bio, contact links, and SIG membership.", components: ["Profile summary", "Edit action", "Role badges", "Activity history"] },
      { href: "/members", label: "Member directory", purpose: "Help members discover people by name, SIG, and availability.", components: ["Search", "Filters", "Member cards", "Pagination"] },
      { href: "/members/ACM-024", label: "Member profile", purpose: "Show a public member profile and contribution history.", components: ["Profile header", "About", "Projects", "Learning"] },
      { href: "/portfolio/42", label: "Portfolio", purpose: "Present a member’s finished work, learning, and showcases.", components: ["Portfolio header", "Project cards", "Completion list", "Showcase"] },
    ],
  },
  {
    label: "Learning",
    description: "The path from first concept to practiced confidence.",
    screens: [
      { href: "/learning", label: "Learning overview", purpose: "Make paths, recommendations, and current progress easy to scan.", components: ["Path cards", "Progress summary", "Resource list", "Empty state"] },
      { href: "/learning/path/frontend-foundations", label: "Learning path", purpose: "Let members work through an ordered path of lessons and resources.", components: ["Path header", "Lesson list", "Progress bar", "Next action"] },
      { href: "/learning/assignments", label: "Assignments", purpose: "Give members one place to see assigned work and due dates.", components: ["Status filters", "Assignment rows", "Due dates", "Submission state"] },
      { href: "/learning/progress", label: "Progress", purpose: "Show personal momentum across paths and completed work.", components: ["Progress chart", "Completion stats", "Milestones", "History"] },
    ],
  },
  {
    label: "Documentation",
    description: "A library and editorial workflow that keeps club knowledge useful.",
    screens: [
      { href: "/documentation", label: "Documentation library", purpose: "Browse and search published guides, notes, and references.", components: ["Search", "Topic filters", "Document rows", "Create action"] },
      { href: "/documentation/getting-started", label: "Document detail", purpose: "Read a document with clear ownership and freshness signals.", components: ["Article body", "Metadata", "Table of contents", "Related docs"] },
      { href: "/documentation/new", label: "Create document", purpose: "Draft a new piece of knowledge with safe defaults.", components: ["Title field", "Editor", "Topic selector", "Save draft"] },
      { href: "/documentation/review", label: "Review queue", purpose: "Help editors approve or request changes without losing context.", components: ["Review filters", "Preview", "Reviewer notes", "Approve/reject"] },
    ],
  },
  {
    label: "Projects",
    description: "A visible home for ideas, teams, delivery, and finished work.",
    screens: [
      { href: "/projects", label: "Project directory", purpose: "Discover active and completed work across SIGs.", components: ["Search", "Stage filters", "Project cards", "Create action"] },
      { href: "/projects/website-refresh", label: "Project detail", purpose: "Give a project one place for context, people, updates, and outcomes.", components: ["Project header", "Team list", "Milestones", "Updates"] },
      { href: "/projects/new", label: "Create project", purpose: "Capture a clear project brief and invite collaborators.", components: ["Project form", "SIG selector", "Member picker", "Draft state"] },
      { href: "/projects/showcase", label: "Project showcase", purpose: "Celebrate finished work and make it useful to future members.", components: ["Featured work", "Outcome cards", "Contributors", "External links"] },
    ],
  },
  {
    label: "Operations",
    description: "The practical rhythm of announcements, meetings, and club events.",
    screens: [
      { href: "/operations", label: "Operations overview", purpose: "See the next important operational moments at a glance.", components: ["Upcoming timeline", "Announcements", "Calendar preview", "Quick actions"] },
      { href: "/operations/announcements", label: "Announcements", purpose: "Publish and read important club-wide updates.", components: ["Announcement list", "Audience badge", "Publish status", "Composer action"] },
      { href: "/operations/events", label: "Events & meetings", purpose: "Browse upcoming events and manage attendance expectations.", components: ["Event cards", "RSVP state", "Location", "Attendee summary"] },
      { href: "/operations/calendar", label: "Club calendar", purpose: "Give teams one reliable view of what is happening and when.", components: ["Month grid", "Event legend", "Day detail", "Empty day state"] },
    ],
  },
  {
    label: "Administration",
    description: "The high-trust controls reserved for keeping the club healthy.",
    screens: [
      { href: "/admin", label: "Admin dashboard", purpose: "Surface membership, content, and operational health.", components: ["Summary metrics", "Pending actions", "Recent changes", "Forbidden state"] },
      { href: "/admin/sigs", label: "SIG management", purpose: "Create and maintain Special Interest Groups and their leads.", components: ["SIG table", "Create form", "Lead assignment", "Conflict state"] },
      { href: "/admin/members", label: "Member management", purpose: "Search, filter, activate, and deactivate member accounts.", components: ["Member table", "Status filter", "Confirmation dialog", "Bulk actions"] },
      { href: "/admin/accounts", label: "Account & roles", purpose: "Create accounts and manage role assignments safely.", components: ["Account table", "Role selector", "Reset action", "One-time secret dialog"] },
    ],
  },
];

export const prototypeRoutes = prototypeSections.flatMap((section) => section.screens);

export interface DemoMember {
  id: number;
  rollNumber: string;
  name: string;
  initials: string;
  role: string;
  sig: string;
  location: string;
  availability: "Available" | "In a project" | "Learning";
  bio: string;
  skills: string[];
  email: string;
  website: string;
}

export const demoMembers: DemoMember[] = [
  {
    id: 42,
    rollNumber: "ACM-024",
    name: "Aanya Sharma",
    initials: "AS",
    role: "Web lead",
    sig: "Web Development",
    location: "New Delhi, IN",
    availability: "Available",
    bio: "I like turning complicated ideas into interfaces that feel obvious to use. Currently exploring design systems and accessible frontends.",
    skills: ["React", "TypeScript", "Design systems", "Accessibility"],
    email: "aanya@example.com",
    website: "aanya.example.com",
  },
  {
    id: 57,
    rollNumber: "ACM-039",
    name: "Kabir Mehta",
    initials: "KM",
    role: "SIG core",
    sig: "Artificial Intelligence",
    location: "Bengaluru, IN",
    availability: "In a project",
    bio: "Building small, useful experiments around language models and developer tooling.",
    skills: ["Python", "ML tooling", "Research", "APIs"],
    email: "kabir@example.com",
    website: "kabir.example.com",
  },
  {
    id: 64,
    rollNumber: "ACM-046",
    name: "Meera Iyer",
    initials: "MI",
    role: "Design contributor",
    sig: "Design & Media",
    location: "Chennai, IN",
    availability: "Learning",
    bio: "Learning in public through visual storytelling, research, and community projects.",
    skills: ["Figma", "Research", "Content", "Motion"],
    email: "meera@example.com",
    website: "meera.example.com",
  },
  {
    id: 71,
    rollNumber: "ACM-053",
    name: "Rohan Das",
    initials: "RD",
    role: "Member",
    sig: "Open Source",
    location: "Kolkata, IN",
    availability: "Available",
    bio: "Interested in the craft behind reliable software and welcoming contributor experiences.",
    skills: ["Go", "Git", "Testing", "Docs"],
    email: "rohan@example.com",
    website: "rohan.example.com",
  },
];

export const primaryMember = demoMembers[0];

export interface DemoLearningPath {
  slug: string;
  title: string;
  category: string;
  description: string;
  lessons: number;
  completedLessons: number;
  nextLesson: string;
  level: string;
}

export const demoLearningPaths: DemoLearningPath[] = [
  {
    slug: "frontend-foundations",
    title: "Frontend foundations",
    category: "Web Development",
    description: "Build a sturdy mental model for accessible, responsive interfaces.",
    lessons: 8,
    completedLessons: 5,
    nextLesson: "Designing for real content",
    level: "Beginner → intermediate",
  },
  {
    slug: "research-to-brief",
    title: "Research to brief",
    category: "Design & Media",
    description: "Turn a loose idea into a project brief a team can actually use.",
    lessons: 6,
    completedLessons: 2,
    nextLesson: "Writing the problem statement",
    level: "All levels",
  },
  {
    slug: "open-source-first-steps",
    title: "Open source first steps",
    category: "Open Source",
    description: "Find a project, make a small contribution, and learn the rhythm of review.",
    lessons: 5,
    completedLessons: 0,
    nextLesson: "Finding a welcoming issue",
    level: "Beginner",
  },
];

export interface DemoDocument {
  slug: string;
  title: string;
  topic: string;
  owner: string;
  updated: string;
  readTime: string;
  summary: string;
  body: string[];
}

export const demoDocuments: DemoDocument[] = [
  {
    slug: "getting-started",
    title: "How we review project briefs",
    topic: "Web Development SIG",
    owner: "Aanya Sharma",
    updated: "Updated 2 days ago",
    readTime: "6 min read",
    summary: "A lightweight review rhythm for turning a promising idea into a brief a team can start with confidence.",
    body: [
      "A good brief gives a team enough context to make a useful first decision. It does not need every answer, but it should make the problem, audience, and next step visible.",
      "Before review, the author shares the smallest useful version: the problem they are exploring, who feels it, what success could look like, and what is intentionally out of scope.",
      "Reviewers respond with questions and risks first. Approval means the team has a clear direction to learn from, not that every implementation detail is already settled.",
    ],
  },
  {
    slug: "member-onboarding",
    title: "Member onboarding checklist",
    topic: "Club operations",
    owner: "Operations team",
    updated: "Updated 1 week ago",
    readTime: "4 min read",
    summary: "The practical first-week checklist for helping a new member find people, context, and a first contribution.",
    body: [
      "Start with a profile that tells other members what the new person wants to learn and where they can help.",
      "Invite them to one relevant SIG and one low-pressure event. A small, specific first contribution is more useful than a long list of links.",
    ],
  },
  {
    slug: "accessible-ui-basics",
    title: "Accessible UI basics",
    topic: "Shared practice",
    owner: "Design & Media SIG",
    updated: "Updated 3 weeks ago",
    readTime: "8 min read",
    summary: "A practical reference for labels, focus states, contrast, and content structure in club projects.",
    body: [
      "Accessibility is easiest to maintain when it is part of the first sketch and the first component, rather than a final audit.",
      "Use native controls where they fit, give every input a visible label, and make keyboard focus as clear as hover feedback.",
    ],
  },
];

export interface DemoProject {
  slug: string;
  title: string;
  sig: string;
  stage: "Exploring" | "In progress" | "Shipped";
  description: string;
  lead: string;
  contributors: number;
  updated: string;
}

export const demoProjects: DemoProject[] = [
  {
    slug: "website-refresh",
    title: "Website refresh",
    sig: "Web Development",
    stage: "In progress",
    description: "A calmer, more accessible home for the club’s next chapter.",
    lead: "Aanya Sharma",
    contributors: 6,
    updated: "Updated today",
  },
  {
    slug: "welcome-kit",
    title: "New member welcome kit",
    sig: "Club operations",
    stage: "Exploring",
    description: "A simple first-week guide that helps new members find context and people.",
    lead: "Meera Iyer",
    contributors: 4,
    updated: "Updated yesterday",
  },
  {
    slug: "issue-finder",
    title: "Good first issue finder",
    sig: "Open Source",
    stage: "Shipped",
    description: "A curated way for members to find welcoming contribution opportunities.",
    lead: "Rohan Das",
    contributors: 3,
    updated: "Shipped Mar 04",
  },
];

export interface DemoAnnouncement {
  title: string;
  audience: string;
  date: string;
  status: "Published" | "Draft";
  description: string;
}

export const demoAnnouncements: DemoAnnouncement[] = [
  { title: "Spring SIG kickoff week", audience: "All members", date: "Today", status: "Published", description: "Meet the leads, choose a direction, and find one small way to participate this month." },
  { title: "March project demos", audience: "All members", date: "Mar 18", status: "Published", description: "Three teams will share what they learned, what shipped, and what they would change next." },
  { title: "Volunteer hosts needed", audience: "SIG leads", date: "Mar 21", status: "Draft", description: "Help make the next community session welcoming, clear, and easy to join." },
];

export interface DemoEvent {
  title: string;
  kind: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  description: string;
}

export const demoEvents: DemoEvent[] = [
  { title: "Spring SIG kickoff", kind: "Community", date: "Mar 14", time: "18:00–19:30", location: "Main hall + online", attendees: "24 going", description: "Meet the people behind each SIG and choose a practical first contribution." },
  { title: "Project brief clinic", kind: "Workshop", date: "Mar 18", time: "17:30–18:30", location: "Design studio", attendees: "12 going", description: "Bring a rough idea and leave with a clearer problem, audience, and next step." },
  { title: "March project demos", kind: "Showcase", date: "Mar 28", time: "18:00–20:00", location: "Auditorium", attendees: "58 going", description: "See what teams built and the lessons they want to pass on." },
];
