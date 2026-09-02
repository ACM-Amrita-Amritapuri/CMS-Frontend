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
